"""
Traffic simulation and reading generator for Smart Junction AI.
Produces repeatable, realistic diurnal traffic readings, historical seeds,
and live step updates with anomaly & alert triggering.
"""

import math
import random
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
import json

from backend.database import get_connection
from backend.ml_models import ml_engine

JUNCTION_BEHAVIOR = {
    "J-01": {"base": 82, "rush_mult": 1.9, "profile": "commercial", "speed_base": 42},
    "J-02": {"base": 115, "rush_mult": 2.2, "profile": "highway", "speed_base": 78},
    "J-03": {"base": 72, "rush_mult": 1.7, "profile": "transit", "speed_base": 36},
    "J-04": {"base": 58, "rush_mult": 2.4, "profile": "techpark", "speed_base": 48},
    "J-05": {"base": 68, "rush_mult": 1.6, "profile": "port", "speed_base": 38},
    "J-06": {"base": 76, "rush_mult": 1.8, "profile": "ring", "speed_base": 44},
    "J-07": {"base": 48, "rush_mult": 1.5, "profile": "campus", "speed_base": 34},
    "J-08": {"base": 98, "rush_mult": 2.0, "profile": "express", "speed_base": 88},
}

class TrafficSimulator:
    def __init__(self):
        self.incident_overrides: Dict[str, Dict[str, Any]] = {}
        self.simulation_step_count = 0
        self.simulation_mode = "LIVE_AUTONOMOUS"

    def compute_traffic_point(
        self,
        j_code: str,
        lanes: int,
        speed_limit: int,
        sim_time: datetime
    ) -> Dict[str, Any]:
        """Calculates realistic traffic metrics for a junction at a given simulated time."""
        cfg = JUNCTION_BEHAVIOR.get(j_code, {"base": 60, "rush_mult": 1.8, "speed_base": 45})
        
        hour = sim_time.hour
        minute = sim_time.minute
        time_float = hour + minute / 60.0
        
        # Diurnal curve factors
        morning_rush = math.exp(-((time_float - 8.5) ** 2) / 2.2)
        evening_rush = math.exp(-((time_float - 17.5) ** 2) / 2.8)
        midday = 0.55 * math.exp(-((time_float - 13.0) ** 2) / 10.0)
        night = 0.16
        
        curve = (night + morning_rush + evening_rush + midday)
        
        # Check if an incident override is active for this junction
        if j_code in self.incident_overrides:
            inc = self.incident_overrides[j_code]
            inc["ticks_remaining"] -= 1
            if inc["ticks_remaining"] <= 0:
                del self.incident_overrides[j_code]
            else:
                return inc["data_func"](sim_time)
                
        # Normal traffic generation
        capacity = lanes * 28
        jitter = random.uniform(0.92, 1.08)
        veh_count = int(cfg["base"] * curve * jitter)
        veh_count = max(4, min(int(capacity * 1.35), veh_count))
        
        # Greenshields model for density and speed
        density = min(98.0, max(6.0, (veh_count / capacity) * 78.0 + random.gauss(0, 2.0)))
        density = round(density, 1)
        
        free_speed = min(speed_limit, cfg["speed_base"])
        speed_reduction = (density / 100.0) ** 1.3
        avg_speed = max(5.0, free_speed * (1.0 - speed_reduction) + random.gauss(0, 1.5))
        avg_speed = round(avg_speed, 1)
        
        # Waiting time
        if density < 45:
            wait = 12.0 + (density / 45.0) * 28.0 + random.gauss(0, 2)
        elif density < 75:
            wait = 40.0 + ((density - 45) / 30.0) * 65.0 + random.gauss(0, 5)
        else:
            wait = 105.0 + ((density - 75) / 25.0) * 135.0 + random.gauss(0, 10)
        wait = max(4.0, round(wait, 1))
        
        queue_m = round((veh_count * (density / 100.0) * 6.5) / lanes, 1)
        
        # Congestion level
        if density >= 85.0:
            congestion = "Critical"
        elif density >= 68.0:
            congestion = "Congested"
        elif density >= 45.0:
            congestion = "Moderate"
        else:
            congestion = "Normal"
            
        return {
            "vehicle_count": veh_count,
            "avg_speed": avg_speed,
            "density_pct": density,
            "waiting_time_sec": wait,
            "queue_length_m": queue_m,
            "congestion_level": congestion,
            "weather": "Clear"
        }

    def seed_historical_readings_if_needed(self):
        """Seed 24 hours of 15-minute readings for all junctions if database is fresh."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM traffic_readings")
        row = cursor.fetchone()
        if row and row["count"] > 100:
            conn.close()
            return
            
        print("Generating 24-hour historical traffic data for all junctions...")
        cursor.execute("SELECT id, code, lanes, speed_limit FROM junctions")
        junctions = cursor.fetchall()
        
        now = datetime.now(timezone.utc)
        # Generate 24 hours back at 15-min intervals = 96 points per junction
        total_points = 0
        for step in range(96, -1, -1):
            reading_time = now - timedelta(minutes=step * 15)
            time_str = reading_time.strftime("%Y-%m-%d %H:%M:%S")
            
            for j in junctions:
                pt = self.compute_traffic_point(j["code"], j["lanes"], j["speed_limit"], reading_time)
                cursor.execute("""
                INSERT INTO traffic_readings (
                    junction_id, timestamp, vehicle_count, avg_speed, density_pct,
                    waiting_time_sec, congestion_level, queue_length_m, weather, is_simulated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                """, (
                    j["id"], time_str, pt["vehicle_count"], pt["avg_speed"], pt["density_pct"],
                    pt["waiting_time_sec"], pt["congestion_level"], pt["queue_length_m"], pt["weather"]
                ))
                total_points += 1
                
        conn.commit()
        print(f"Generated {total_points} historical traffic records.")
        conn.close()
        
        # Also seed 3-4 initial realistic anomalies and alerts
        self._seed_initial_anomalies_and_alerts()

    def _seed_initial_anomalies_and_alerts(self):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM anomalies")
        if cursor.fetchone()["count"] > 0:
            conn.close()
            return
            
        now = datetime.now(timezone.utc)
        
        # J-05 Harbor Port Logistics Crossing: Heavy freight bottleneck
        cursor.execute("SELECT id FROM junctions WHERE code = 'J-05'")
        j5 = cursor.fetchone()["id"]
        
        anomaly_code_1 = f"ANOM-{int(time.time()) - 1800}-01"
        cursor.execute("""
        INSERT INTO anomalies (
            anomaly_code, junction_id, timestamp, severity, vehicle_count,
            avg_speed, density_pct, waiting_time_sec, anomaly_score, reason,
            feature_contributions, recommended_action, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            anomaly_code_1, j5, (now - timedelta(minutes=32)).strftime("%Y-%m-%d %H:%M:%S"),
            "Critical", 142, 9.4, 91.5, 235.0, -0.162,
            "Gridlock & Speed Collapse: Density reached 91.5% while average flow crawled to 9.4 km/h (speed drop 75.2%).",
            json.dumps({
                "vehicle_count": {"observed": 142, "deviation_pct": 118.5, "z_score": 2.45},
                "avg_speed": {"observed": 9.4, "deviation_pct": -75.2, "z_score": -2.80},
                "density_pct": {"observed": 91.5, "deviation_pct": 83.0, "z_score": 2.65},
                "waiting_time_sec": {"observed": 235.0, "deviation_pct": 213.3, "z_score": 3.10}
            }),
            "Activate emergency green-wave flush towards outbound arterials. Trigger upstream DMS for detour.",
            "Active"
        ))
        
        cursor.execute("""
        INSERT INTO alerts (
            alert_code, junction_id, timestamp, severity, title, message, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'unread')
        """, (
            f"ALT-{int(time.time()) - 1800}-01", j5,
            (now - timedelta(minutes=32)).strftime("%Y-%m-%d %H:%M:%S"),
            "Critical",
            "CRITICAL: Harbor Port Crossing Gridlock Detected",
            "Severe density surge (91.5%) and speed collapse to 9.4 km/h at Junction J-05. Freight corridor obstructed."
        ))

        # J-03 Metro Square: Moderate delay anomaly
        cursor.execute("SELECT id FROM junctions WHERE code = 'J-03'")
        j3 = cursor.fetchone()["id"]
        
        anomaly_code_2 = f"ANOM-{int(time.time()) - 900}-02"
        cursor.execute("""
        INSERT INTO anomalies (
            anomaly_code, junction_id, timestamp, severity, vehicle_count,
            avg_speed, density_pct, waiting_time_sec, anomaly_score, reason,
            feature_contributions, recommended_action, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            anomaly_code_2, j3, (now - timedelta(minutes=14)).strftime("%Y-%m-%d %H:%M:%S"),
            "High", 98, 16.2, 79.4, 168.0, -0.095,
            "Prolonged Queue Delay: Excessive queue wait time of 168.0s detected (Z-score +2.1). Transit bus interchange saturated.",
            json.dumps({
                "vehicle_count": {"observed": 98, "deviation_pct": 42.0, "z_score": 1.40},
                "avg_speed": {"observed": 16.2, "deviation_pct": -52.0, "z_score": -1.85},
                "density_pct": {"observed": 79.4, "deviation_pct": 58.8, "z_score": 1.95},
                "waiting_time_sec": {"observed": 168.0, "deviation_pct": 124.0, "z_score": 2.10}
            }),
            "Extend phase duration for congested approach. Synchronize offset with adjacent downstream junctions.",
            "Active"
        ))

        cursor.execute("""
        INSERT INTO alerts (
            alert_code, junction_id, timestamp, severity, title, message, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'unread')
        """, (
            f"ALT-{int(time.time()) - 900}-02", j3,
            (now - timedelta(minutes=14)).strftime("%Y-%m-%d %H:%M:%S"),
            "Warning",
            "WARNING: Metro Square Bus Lane Saturation",
            "Transit delay of 168.0s exceeds normal peak bounds at Junction J-03."
        ))

        conn.commit()
        conn.close()

    def advance_simulation_step(self) -> Dict[str, Any]:
        """
        Advances the simulation clock by 1 step, generating new telemetry for all junctions,
        evaluating Isolation Forest for anomalies, and issuing alerts when appropriate.
        """
        self.simulation_step_count += 1
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, code, name, lanes, speed_limit FROM junctions")
        junctions = cursor.fetchall()
        
        now = datetime.now(timezone.utc)
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")
        
        new_readings = []
        new_anomalies = []
        new_alerts = []
        
        for j in junctions:
            pt = self.compute_traffic_point(j["code"], j["lanes"], j["speed_limit"], now)
            
            # Save reading
            cursor.execute("""
            INSERT INTO traffic_readings (
                junction_id, timestamp, vehicle_count, avg_speed, density_pct,
                waiting_time_sec, congestion_level, queue_length_m, weather, is_simulated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                j["id"], now_str, pt["vehicle_count"], pt["avg_speed"], pt["density_pct"],
                pt["waiting_time_sec"], pt["congestion_level"], pt["queue_length_m"], pt["weather"]
            ))
            reading_id = cursor.lastrowid
            
            # Update junction status in junctions table
            cursor.execute("UPDATE junctions SET status = ? WHERE id = ?", (pt["congestion_level"], j["id"]))
            
            # Run Isolation Forest Anomaly Detection
            anomaly_data = ml_engine.detect_anomaly(
                vehicle_count=pt["vehicle_count"],
                avg_speed=pt["avg_speed"],
                density_pct=pt["density_pct"],
                waiting_time_sec=pt["waiting_time_sec"],
                junction_meta={"lanes": j["lanes"], "speed_limit": j["speed_limit"]}
            )
            
            if anomaly_data:
                # Check if recent active anomaly was already recorded in last 5 minutes to avoid spam
                cursor.execute("""
                SELECT id FROM anomalies 
                WHERE junction_id = ? AND status = 'Active' 
                AND timestamp >= datetime('now', '-5 minutes')
                """, (j["id"],))
                existing = cursor.fetchone()
                
                if not existing:
                    anom_code = f"ANOM-{int(time.time())}-{j['code']}"
                    cursor.execute("""
                    INSERT INTO anomalies (
                        anomaly_code, junction_id, timestamp, severity, vehicle_count,
                        avg_speed, density_pct, waiting_time_sec, anomaly_score, reason,
                        feature_contributions, recommended_action, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
                    """, (
                        anom_code, j["id"], now_str, anomaly_data["severity"],
                        pt["vehicle_count"], pt["avg_speed"], pt["density_pct"], pt["waiting_time_sec"],
                        anomaly_data["anomaly_score"], anomaly_data["reason"],
                        json.dumps(anomaly_data["feature_contributions"]),
                        anomaly_data["recommended_action"]
                    ))
                    
                    new_anomalies.append({
                        "anomaly_code": anom_code,
                        "junction_code": j["code"],
                        "severity": anomaly_data["severity"],
                        "reason": anomaly_data["reason"]
                    })
                    
                    # Create corresponding alert if unread alert doesn't exist
                    cursor.execute("""
                    SELECT id FROM alerts 
                    WHERE junction_id = ? AND status = 'unread'
                    """, (j["id"],))
                    existing_alert = cursor.fetchone()
                    
                    if not existing_alert:
                        alert_sev = "Critical" if anomaly_data["severity"] in ["Critical", "High"] else "Warning"
                        alt_code = f"ALT-{int(time.time())}-{j['code']}"
                        alt_title = f"{alert_sev.upper()}: {j['name']} Anomaly Detected"
                        alt_msg = f"Isolation Forest flagged {anomaly_data['severity']} condition: {anomaly_data['reason'][:110]}..."
                        
                        cursor.execute("""
                        INSERT INTO alerts (
                            alert_code, junction_id, timestamp, severity, title, message, status
                        ) VALUES (?, ?, ?, ?, ?, ?, 'unread')
                        """, (
                            alt_code, j["id"], now_str, alert_sev, alt_title, alt_msg
                        ))
                        
                        new_alerts.append({
                            "alert_code": alt_code,
                            "junction_code": j["code"],
                            "title": alt_title,
                            "severity": alert_sev
                        })
            
            new_readings.append({
                "junction_code": j["code"],
                "junction_name": j["name"],
                "vehicle_count": pt["vehicle_count"],
                "avg_speed": pt["avg_speed"],
                "density_pct": pt["density_pct"],
                "waiting_time_sec": pt["waiting_time_sec"],
                "congestion_level": pt["congestion_level"]
            })
            
        conn.commit()
        conn.close()
        
        return {
            "step": self.simulation_step_count,
            "timestamp": now_str,
            "readings_updated": len(new_readings),
            "new_anomalies": new_anomalies,
            "new_alerts": new_alerts
        }

    def inject_incident(self, junction_code: str, incident_type: str) -> Dict[str, Any]:
        """
        Manually injects an incident for live testing & evaluation.
        Allows interactive demonstration of the AI detector and alerts.
        """
        if incident_type == "gridlock":
            def gen(t):
                return {
                    "vehicle_count": 182,
                    "avg_speed": 6.8,
                    "density_pct": 94.5,
                    "waiting_time_sec": 245.0,
                    "queue_length_m": 390.0,
                    "congestion_level": "Critical",
                    "weather": "Heavy Rain"
                }
            desc = "Injected Severe Multi-Vehicle Gridlock and Speed Breakdown"
        elif incident_type == "ghost_block":
            def gen(t):
                return {
                    "vehicle_count": 16,
                    "avg_speed": 4.2,
                    "density_pct": 82.0,
                    "waiting_time_sec": 260.0,
                    "queue_length_m": 210.0,
                    "congestion_level": "Critical",
                    "weather": "Clear"
                }
            desc = "Injected Ghost Blockage / Stalled Heavy Truck"
        elif incident_type == "surge":
            def gen(t):
                return {
                    "vehicle_count": 195,
                    "avg_speed": 18.0,
                    "density_pct": 88.0,
                    "waiting_time_sec": 195.0,
                    "queue_length_m": 310.0,
                    "congestion_level": "Critical",
                    "weather": "Clear"
                }
            desc = "Injected Massive Stadium / Event Egress Traffic Surge"
        else:
            def gen(t):
                return {
                    "vehicle_count": 110,
                    "avg_speed": 12.0,
                    "density_pct": 78.0,
                    "waiting_time_sec": 175.0,
                    "queue_length_m": 250.0,
                    "congestion_level": "Congested",
                    "weather": "Overcast"
                }
            desc = "Injected Moderate Corridor Saturation"
            
        self.incident_overrides[junction_code] = {
            "ticks_remaining": 6,
            "data_func": gen,
            "description": desc
        }
        
        return {
            "status": "success",
            "junction_code": junction_code,
            "incident_type": incident_type,
            "description": desc,
            "duration_ticks": 6
        }

# Global simulator instance
simulator = TrafficSimulator()

if __name__ == "__main__":
    simulator.seed_historical_readings_if_needed()
    step_res = simulator.advance_simulation_step()
    print("Simulation step advanced:", step_res)

"""
FastAPI Backend Application for Smart Junction AI.
Endpoints for junctions, live telemetry, ML anomaly detection, predictions,
alerts management, analytics aggregation, and CSV exports.
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import io
import csv
import json
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.database import get_connection, init_db, seed_junctions_if_empty
from backend.ml_models import ml_engine
from backend.traffic_generator import simulator

# Background simulation runner
simulation_task = None
simulation_running = True
simulation_interval_sec = 4.0

async def simulation_background_loop():
    while True:
        try:
            if simulation_running:
                simulator.advance_simulation_step()
            await asyncio.sleep(simulation_interval_sec)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in simulation loop: {e}")
            await asyncio.sleep(simulation_interval_sec)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure DB and models ready
    init_db()
    seed_junctions_if_empty()
    simulator.seed_historical_readings_if_needed()
    ml_engine.train_and_evaluate()
    
    # Start background loop
    loop_task = asyncio.create_task(simulation_background_loop())
    yield
    # Shutdown
    loop_task.cancel()

app = FastAPI(
    title="Smart Junction AI - Traffic Monitoring & Predictive Anomaly Alert System",
    description="Backend API for Smart City Command Center with Isolation Forest and Predictive ML Models",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Models -----------------
class AlertUpdatePayload(BaseModel):
    status: str = Field(..., description="Target status: acknowledged, resolved, unread")
    acknowledged_by: Optional[str] = "Operator-1"

class IncidentPayload(BaseModel):
    junction_code: str
    incident_type: str = Field("gridlock", description="gridlock, ghost_block, surge, saturation")

class SimulationConfigPayload(BaseModel):
    running: Optional[bool] = None
    interval_sec: Optional[float] = None

# ----------------- Routes -----------------

@app.get("/api/health")
def get_health():
    """Health check and system status."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM junctions")
    junc_count = c.fetchone()["count"]
    c.execute("SELECT COUNT(*) as count FROM anomalies WHERE status = 'Active'")
    active_anomalies = c.fetchone()["count"]
    c.execute("SELECT COUNT(*) as count FROM alerts WHERE status = 'unread'")
    unread_alerts = c.fetchone()["count"]
    conn.close()

    return {
        "status": "healthy",
        "system": "Smart Junction AI Command Center",
        "simulation_online": True,
        "simulation_running": simulation_running,
        "simulation_interval_sec": simulation_interval_sec,
        "models_loaded": {
            "isolation_forest": ml_engine.anomaly_model is not None,
            "gradient_boosting_15m": ml_engine.forecast_model_15m is not None,
            "gradient_boosting_30m": ml_engine.forecast_model_30m is not None
        },
        "stats": {
            "total_junctions": junc_count,
            "active_anomalies": active_anomalies,
            "unread_alerts": unread_alerts
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/junctions")
def get_junctions(status: Optional[str] = None):
    """
    Get all smart junctions with latest real-time telemetry and congestion statuses.
    """
    conn = get_connection()
    c = conn.cursor()
    
    query = """
    SELECT 
        j.id, j.code, j.name, j.zone, j.latitude, j.longitude, j.grid_x, j.grid_y,
        j.lanes, j.speed_limit, j.camera_active, j.status,
        tr.vehicle_count, tr.avg_speed, tr.density_pct, tr.waiting_time_sec,
        tr.queue_length_m, tr.timestamp as last_reading_time
    FROM junctions j
    LEFT JOIN (
        SELECT junction_id, vehicle_count, avg_speed, density_pct, waiting_time_sec, queue_length_m, timestamp
        FROM traffic_readings
        WHERE id IN (SELECT MAX(id) FROM traffic_readings GROUP BY junction_id)
    ) tr ON j.id = tr.junction_id
    """
    params = []
    if status and status.lower() != "all":
        query += " WHERE LOWER(j.status) = LOWER(?)"
        params.append(status)
        
    query += " ORDER BY j.code ASC"
    c.execute(query, params)
    rows = c.fetchall()
    
    junctions = []
    for r in rows:
        junctions.append({
            "id": r["id"],
            "code": r["code"],
            "name": r["name"],
            "zone": r["zone"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "grid_x": r["grid_x"],
            "grid_y": r["grid_y"],
            "lanes": r["lanes"],
            "speed_limit": r["speed_limit"],
            "camera_active": bool(r["camera_active"]),
            "status": r["status"] or "Normal",
            "telemetry": {
                "vehicle_count": r["vehicle_count"] or 0,
                "avg_speed": r["avg_speed"] or 0.0,
                "density_pct": r["density_pct"] or 0.0,
                "waiting_time_sec": r["waiting_time_sec"] or 0.0,
                "queue_length_m": r["queue_length_m"] or 0.0,
                "last_updated": r["last_reading_time"] or ""
            }
        })
    conn.close()
    return junctions

@app.get("/api/junctions/{junction_id}")
def get_junction_detail(junction_id: int):
    """Get single junction details and its last 30 telemetry points."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM junctions WHERE id = ?", (junction_id,))
    j = c.fetchone()
    if not j:
        conn.close()
        raise HTTPException(status_code=404, detail="Junction not found")
        
    c.execute("""
    SELECT timestamp, vehicle_count, avg_speed, density_pct, waiting_time_sec, congestion_level
    FROM traffic_readings
    WHERE junction_id = ?
    ORDER BY timestamp DESC
    LIMIT 30
    """, (junction_id,))
    history = [dict(r) for r in c.fetchall()]
    history.reverse() # chronological
    
    conn.close()
    return {
        "junction": dict(j),
        "recent_readings": history
    }

@app.get("/api/traffic")
def get_traffic_overview():
    """
    Returns latest aggregated traffic telemetry, totals, and junction readings.
    """
    conn = get_connection()
    c = conn.cursor()
    
    c.execute("""
    SELECT 
        j.id, j.code, j.name, j.lanes, j.speed_limit, j.status,
        tr.vehicle_count, tr.avg_speed, tr.density_pct, tr.waiting_time_sec,
        tr.queue_length_m, tr.timestamp
    FROM junctions j
    LEFT JOIN (
        SELECT junction_id, vehicle_count, avg_speed, density_pct, waiting_time_sec, queue_length_m, timestamp
        FROM traffic_readings
        WHERE id IN (SELECT MAX(id) FROM traffic_readings GROUP BY junction_id)
    ) tr ON j.id = tr.junction_id
    """)
    rows = c.fetchall()
    
    total_vehicles = sum(r["vehicle_count"] or 0 for r in rows)
    congested_count = sum(1 for r in rows if r["status"] in ["Congested", "Critical"])
    
    c.execute("SELECT COUNT(*) as count FROM anomalies WHERE status = 'Active'")
    active_anomalies = c.fetchone()["count"]
    
    conn.close()
    
    return {
        "kpis": {
            "total_junctions": len(rows),
            "vehicles_monitored": total_vehicles,
            "active_anomalies": active_anomalies,
            "congested_junctions": congested_count
        },
        "junction_telemetry": [dict(r) for r in rows],
        "is_simulated": True
    }

@app.get("/api/predictions")
def get_predictions(junction_code: Optional[str] = None):
    """
    Generate ML-driven predictions for +15m and +30m congestion.
    Includes feature contributions, risk summary, and evaluation metrics.
    """
    conn = get_connection()
    c = conn.cursor()
    
    query = """
    SELECT 
        j.id, j.code, j.name, j.lanes, j.speed_limit, j.status,
        tr.vehicle_count, tr.avg_speed, tr.density_pct, tr.waiting_time_sec, tr.timestamp
    FROM junctions j
    LEFT JOIN (
        SELECT junction_id, vehicle_count, avg_speed, density_pct, waiting_time_sec, timestamp
        FROM traffic_readings
        WHERE id IN (SELECT MAX(id) FROM traffic_readings GROUP BY junction_id)
    ) tr ON j.id = tr.junction_id
    """
    params = []
    if junction_code:
        query += " WHERE j.code = ?"
        params.append(junction_code)
        
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    
    now = datetime.now()
    results = []
    high_risk_candidates = []
    
    for r in rows:
        lanes = r["lanes"] or 4
        speed_limit = r["speed_limit"] or 50
        v_count = r["vehicle_count"] or 50
        speed = r["avg_speed"] or 35.0
        dens = r["density_pct"] or 40.0
        wait = r["waiting_time_sec"] or 30.0
        
        preds = ml_engine.predict_traffic(
            hour=now.hour,
            minute=now.minute,
            day_of_week=now.weekday(),
            lanes=lanes,
            speed_limit=speed_limit,
            current_vehicle_count=v_count,
            current_avg_speed=speed,
            current_density=dens,
            current_waiting_time=wait
        )
        
        p15 = preds["prediction_15m"]
        p30 = preds["prediction_30m"]
        
        # Determine actionable recommendation
        if p15["congestion_risk"] in ["Severe", "High"] or p30["congestion_risk"] in ["Severe", "High"]:
            rec_action = f"Pre-allocate +20s adaptive green split along primary corridor. Suggest alternate routing via adjacent arterial."
            high_risk_candidates.append(r["code"])
        else:
            rec_action = "Maintain regular synchronized signal cycle offsets."
            
        results.append({
            "junction_id": r["id"],
            "junction_code": r["code"],
            "junction_name": r["name"],
            "current": {
                "vehicle_count": v_count,
                "avg_speed": speed,
                "density_pct": dens,
                "waiting_time_sec": wait
            },
            "prediction_15m": p15,
            "prediction_30m": p30,
            "recommended_action": rec_action
        })
        
    # High-level summary statement
    if high_risk_candidates:
        summary_text = f"High congestion risk predicted for Junction {', '.join(high_risk_candidates[:2])} within the next 15-30 minutes."
        recommended_action_global = "Initiate dynamic green wave progression on intersecting radials and display driver advisories."
    else:
        summary_text = "Stable traffic conditions predicted across all arterial junctions for the next 30 minutes."
        recommended_action_global = "Standard automated adaptive timing operational."
        
    return {
        "summary": summary_text,
        "high_risk_junctions": high_risk_candidates,
        "recommended_action": recommended_action_global,
        "junction_predictions": results,
        "model_metrics": ml_engine.evaluation_metrics,
        "is_simulated": True
    }

@app.get("/api/anomalies")
def get_anomalies(
    severity: Optional[str] = None,
    junction_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """
    Get detected anomalies from the Isolation Forest model.
    """
    conn = get_connection()
    c = conn.cursor()
    
    query = """
    SELECT 
        a.id, a.anomaly_code, a.junction_id, a.timestamp, a.severity,
        a.vehicle_count, a.avg_speed, a.density_pct, a.waiting_time_sec,
        a.anomaly_score, a.reason, a.feature_contributions, a.recommended_action,
        a.status, a.resolved_at,
        j.code as junction_code, j.name as junction_name, j.zone as junction_zone
    FROM anomalies a
    JOIN junctions j ON a.junction_id = j.id
    WHERE 1=1
    """
    params = []
    if severity and severity.lower() != "all":
        query += " AND LOWER(a.severity) = LOWER(?)"
        params.append(severity)
    if junction_id:
        query += " AND a.junction_id = ?"
        params.append(junction_id)
    if status and status.lower() != "all":
        query += " AND LOWER(a.status) = LOWER(?)"
        params.append(status)
        
    query += " ORDER BY a.timestamp DESC LIMIT ?"
    params.append(limit)
    
    c.execute(query, params)
    rows = c.fetchall()
    
    anomalies = []
    for r in rows:
        d = dict(r)
        try:
            d["feature_contributions"] = json.loads(d["feature_contributions"])
        except:
            d["feature_contributions"] = {}
        anomalies.append(d)
        
    conn.close()
    return anomalies

@app.get("/api/anomalies/{anomaly_id}")
def get_anomaly_detail(anomaly_id: int):
    """Detailed view for a specific anomaly with feature evidence."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    SELECT 
        a.*, j.code as junction_code, j.name as junction_name, j.zone as junction_zone,
        j.lanes, j.speed_limit
    FROM anomalies a
    JOIN junctions j ON a.junction_id = j.id
    WHERE a.id = ?
    """, (anomaly_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Anomaly not found")
        
    d = dict(row)
    try:
        d["feature_contributions"] = json.loads(d["feature_contributions"])
    except:
        d["feature_contributions"] = {}
    return d

@app.get("/api/alerts")
def get_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """
    Get live alert notifications with timestamps, severity, and status.
    """
    conn = get_connection()
    c = conn.cursor()
    
    query = """
    SELECT 
        alt.id, alt.alert_code, alt.junction_id, alt.timestamp, alt.severity,
        alt.title, alt.message, alt.status, alt.acknowledged_at, alt.acknowledged_by, alt.resolved_at,
        j.code as junction_code, j.name as junction_name
    FROM alerts alt
    JOIN junctions j ON alt.junction_id = j.id
    WHERE 1=1
    """
    params = []
    if severity and severity.lower() != "all":
        query += " AND LOWER(alt.severity) = LOWER(?)"
        params.append(severity)
    if status and status.lower() != "all":
        query += " AND LOWER(alt.status) = LOWER(?)"
        params.append(status)
        
    query += " ORDER BY alt.timestamp DESC LIMIT ?"
    params.append(limit)
    
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.patch("/api/alerts/{alert_id}")
def update_alert(alert_id: int, payload: AlertUpdatePayload):
    """Acknowledge or resolve an alert notification."""
    conn = get_connection()
    c = conn.cursor()
    
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    if payload.status == "acknowledged":
        c.execute("""
        UPDATE alerts 
        SET status = 'acknowledged', acknowledged_at = ?, acknowledged_by = ?
        WHERE id = ?
        """, (now_str, payload.acknowledged_by or "Operator-1", alert_id))
    elif payload.status == "resolved":
        c.execute("""
        UPDATE alerts 
        SET status = 'resolved', resolved_at = ?
        WHERE id = ?
        """, (now_str, alert_id))
    else:
        c.execute("UPDATE alerts SET status = ? WHERE id = ?", (payload.status, alert_id))
        
    if c.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found")
        
    conn.commit()
    c.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    updated = dict(c.fetchone())
    conn.close()
    return updated

@app.post("/api/alerts/acknowledge-all")
def acknowledge_all_alerts():
    """Acknowledge all unread alerts in one command."""
    conn = get_connection()
    c = conn.cursor()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    c.execute("""
    UPDATE alerts 
    SET status = 'acknowledged', acknowledged_at = ?, acknowledged_by = 'Operator-Command'
    WHERE status = 'unread'
    """, (now_str,))
    count = c.rowcount
    conn.commit()
    conn.close()
    return {"status": "success", "acknowledged_count": count}

@app.get("/api/analytics")
def get_analytics(junction_id: Optional[int] = None):
    """
    Get aggregated analytics:
    - Hourly traffic patterns
    - Junction congestion comparison
    - Anomaly frequency by severity
    - Traffic density distribution
    - Model metrics
    """
    conn = get_connection()
    c = conn.cursor()
    
    # 1. Hourly traffic patterns across 24 hours
    hour_query = """
    SELECT 
        strftime('%H:00', timestamp) as hour_label,
        ROUND(AVG(vehicle_count), 1) as avg_vehicles,
        ROUND(AVG(avg_speed), 1) as avg_speed,
        ROUND(AVG(density_pct), 1) as avg_density
    FROM traffic_readings
    """
    if junction_id:
        hour_query += " WHERE junction_id = ? "
        c.execute(hour_query + " GROUP BY hour_label ORDER BY hour_label ASC", (junction_id,))
    else:
        c.execute(hour_query + " GROUP BY hour_label ORDER BY hour_label ASC")
    hourly_patterns = [dict(r) for r in c.fetchall()]
    
    # 2. Junction congestion comparison
    c.execute("""
    SELECT 
        j.code, j.name,
        ROUND(AVG(tr.vehicle_count), 1) as avg_vehicles,
        ROUND(AVG(tr.density_pct), 1) as avg_density,
        ROUND(AVG(tr.waiting_time_sec), 1) as avg_waiting_time,
        SUM(CASE WHEN tr.congestion_level IN ('Congested', 'Critical') THEN 1 ELSE 0 END) as congestion_incidents
    FROM junctions j
    LEFT JOIN traffic_readings tr ON j.id = tr.junction_id
    GROUP BY j.id
    ORDER BY avg_density DESC
    """)
    junction_comparison = [dict(r) for r in c.fetchall()]
    
    # 3. Anomaly frequency by severity
    c.execute("""
    SELECT severity, COUNT(*) as count
    FROM anomalies
    GROUP BY severity
    """)
    anom_freq = [dict(r) for r in c.fetchall()]
    
    # 4. Traffic density distribution buckets
    c.execute("""
    SELECT 
        SUM(CASE WHEN density_pct < 30 THEN 1 ELSE 0 END) as free_flow,
        SUM(CASE WHEN density_pct >= 30 AND density_pct < 60 THEN 1 ELSE 0 END) as light_traffic,
        SUM(CASE WHEN density_pct >= 60 AND density_pct < 80 THEN 1 ELSE 0 END) as moderate,
        SUM(CASE WHEN density_pct >= 80 THEN 1 ELSE 0 END) as severe_bottleneck
    FROM traffic_readings
    """)
    buckets = dict(c.fetchone() or {})
    density_dist = [
        {"name": "Free Flow (<30%)", "value": buckets.get("free_flow") or 0, "color": "#22C55E"},
        {"name": "Light Flow (30-60%)", "value": buckets.get("light_traffic") or 0, "color": "#3B82F6"},
        {"name": "Moderate (60-80%)", "value": buckets.get("moderate") or 0, "color": "#F59E0B"},
        {"name": "Bottleneck (>80%)", "value": buckets.get("severe_bottleneck") or 0, "color": "#EF4444"}
    ]
    
    conn.close()
    
    return {
        "hourly_patterns": hourly_patterns,
        "junction_comparison": junction_comparison,
        "anomaly_frequency": anom_freq,
        "density_distribution": density_dist,
        "model_metrics": ml_engine.evaluation_metrics
    }

@app.get("/api/reports/export")
def export_reports(
    report_type: str = Query("traffic", description="traffic, alerts, anomalies")
):
    """
    Export live data as a downloadable CSV file.
    """
    conn = get_connection()
    c = conn.cursor()
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "alerts":
        c.execute("""
        SELECT 
            alt.alert_code, alt.timestamp, alt.severity, alt.title, alt.message,
            alt.status, alt.acknowledged_at, alt.resolved_at, j.code as junction_code
        FROM alerts alt
        JOIN junctions j ON alt.junction_id = j.id
        ORDER BY alt.timestamp DESC
        """)
        rows = c.fetchall()
        writer.writerow(["Alert Code", "Timestamp", "Severity", "Title", "Message", "Status", "Acknowledged At", "Resolved At", "Junction Code"])
        for r in rows:
            writer.writerow([r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]])
        filename = f"smart_junction_alerts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
    elif report_type == "anomalies":
        c.execute("""
        SELECT 
            a.anomaly_code, a.timestamp, a.severity, a.vehicle_count, a.avg_speed,
            a.density_pct, a.waiting_time_sec, a.anomaly_score, a.reason, a.recommended_action,
            a.status, j.code as junction_code
        FROM anomalies a
        JOIN junctions j ON a.junction_id = j.id
        ORDER BY a.timestamp DESC
        """)
        rows = c.fetchall()
        writer.writerow(["Anomaly Code", "Timestamp", "Severity", "Vehicles", "Avg Speed (km/h)", "Density (%)", "Wait Time (s)", "Anomaly Score", "Reason", "Action", "Status", "Junction"])
        for r in rows:
            writer.writerow([r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11]])
        filename = f"smart_junction_anomalies_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
    else: # traffic
        c.execute("""
        SELECT 
            tr.timestamp, j.code as junction_code, j.name as junction_name,
            tr.vehicle_count, tr.avg_speed, tr.density_pct, tr.waiting_time_sec,
            tr.congestion_level, tr.queue_length_m, tr.weather
        FROM traffic_readings tr
        JOIN junctions j ON tr.junction_id = j.id
        ORDER BY tr.timestamp DESC
        LIMIT 500
        """)
        rows = c.fetchall()
        writer.writerow(["Timestamp", "Junction Code", "Junction Name", "Vehicle Count", "Avg Speed (km/h)", "Density (%)", "Wait Time (s)", "Congestion Level", "Queue Length (m)", "Weather"])
        for r in rows:
            writer.writerow([r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9]])
        filename = f"smart_junction_traffic_readings_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
    conn.close()
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ----------------- Interactive Simulation Controls -----------------

@app.post("/api/simulation/step")
def trigger_simulation_step():
    """Manually advance the simulation step."""
    res = simulator.advance_simulation_step()
    return res

@app.post("/api/simulation/inject-incident")
def inject_incident(payload: IncidentPayload):
    """Inject an anomaly incident at a chosen junction for live demonstration."""
    res = simulator.inject_incident(payload.junction_code, payload.incident_type)
    # Immediately trigger a simulation step so the frontend catches it right away!
    step_res = simulator.advance_simulation_step()
    return {**res, "step_result": step_res}

@app.post("/api/simulation/config")
def update_simulation_config(payload: SimulationConfigPayload):
    """Adjust simulation running status or loop frequency."""
    global simulation_running, simulation_interval_sec
    if payload.running is not None:
        simulation_running = payload.running
    if payload.interval_sec is not None:
        simulation_interval_sec = max(1.0, min(30.0, payload.interval_sec))
    return {
        "simulation_running": simulation_running,
        "interval_sec": simulation_interval_sec
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)

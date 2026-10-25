"""
SQLite Database manager and schema definitions for Smart Junction AI.
"""

import sqlite3
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

DB_PATH = Path(__file__).parent / "traffic_system.db"

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Junctions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS junctions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        zone TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        grid_x REAL NOT NULL,
        grid_y REAL NOT NULL,
        lanes INTEGER NOT NULL DEFAULT 4,
        speed_limit INTEGER NOT NULL DEFAULT 50,
        camera_active BOOLEAN NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'Normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Traffic readings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS traffic_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        junction_id INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        vehicle_count INTEGER NOT NULL,
        avg_speed REAL NOT NULL,
        density_pct REAL NOT NULL,
        waiting_time_sec REAL NOT NULL,
        congestion_level TEXT NOT NULL,
        queue_length_m REAL NOT NULL,
        weather TEXT NOT NULL DEFAULT 'Clear',
        is_simulated BOOLEAN NOT NULL DEFAULT 1,
        FOREIGN KEY (junction_id) REFERENCES junctions (id)
    );
    """)

    # Index for fast querying
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_traffic_junction_time ON traffic_readings(junction_id, timestamp);")

    # Anomalies table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anomaly_code TEXT UNIQUE NOT NULL,
        junction_id INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        severity TEXT NOT NULL, -- Critical, High, Medium, Low
        vehicle_count INTEGER NOT NULL,
        avg_speed REAL NOT NULL,
        density_pct REAL NOT NULL,
        waiting_time_sec REAL NOT NULL,
        anomaly_score REAL NOT NULL,
        reason TEXT NOT NULL,
        feature_contributions TEXT NOT NULL, -- JSON string
        recommended_action TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active', -- Active, Investigating, Resolved
        resolved_at TIMESTAMP,
        FOREIGN KEY (junction_id) REFERENCES junctions (id)
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_anomalies_time ON anomalies(timestamp);")

    # Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_code TEXT UNIQUE NOT NULL,
        junction_id INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        severity TEXT NOT NULL, -- Critical, Warning, Normal
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unread', -- unread, acknowledged, resolved
        acknowledged_at TIMESTAMP,
        acknowledged_by TEXT,
        resolved_at TIMESTAMP,
        FOREIGN KEY (junction_id) REFERENCES junctions (id)
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);")

    # ML Model Metrics
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT NOT NULL,
        mae REAL,
        rmse REAL,
        r2_score REAL,
        anomaly_baseline_score REAL,
        details TEXT,
        trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

# Initial junctions configuration for the smart city
DEFAULT_JUNCTIONS = [
    {
        "code": "J-01",
        "name": "Grand Central & 4th Avenue",
        "zone": "Downtown Commercial Core",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "grid_x": 480,
        "grid_y": 280,
        "lanes": 6,
        "speed_limit": 45,
        "camera_active": True,
        "status": "Normal"
    },
    {
        "code": "J-02",
        "name": "Cyber Highway North Interchange",
        "zone": "Express Corridor North",
        "latitude": 40.7328,
        "longitude": -73.9850,
        "grid_x": 720,
        "grid_y": 140,
        "lanes": 8,
        "speed_limit": 80,
        "camera_active": True,
        "status": "Normal"
    },
    {
        "code": "J-03",
        "name": "Metro Square Multi-Way",
        "zone": "Central Transit District",
        "latitude": 40.7200,
        "longitude": -74.0150,
        "grid_x": 260,
        "grid_y": 210,
        "lanes": 6,
        "speed_limit": 40,
        "camera_active": True,
        "status": "Moderate"
    },
    {
        "code": "J-04",
        "name": "Tech Park Boulevard & Innovation Way",
        "zone": "Silicon Tech Sector",
        "latitude": 40.7450,
        "longitude": -74.0280,
        "grid_x": 190,
        "grid_y": 420,
        "lanes": 4,
        "speed_limit": 50,
        "camera_active": True,
        "status": "Normal"
    },
    {
        "code": "J-05",
        "name": "Harbor Port Logistics Crossing",
        "zone": "Industrial Freight Port",
        "latitude": 40.6980,
        "longitude": -73.9720,
        "grid_x": 780,
        "grid_y": 460,
        "lanes": 6,
        "speed_limit": 40,
        "camera_active": True,
        "status": "Congested"
    },
    {
        "code": "J-06",
        "name": "Central Plaza Ring Corridor",
        "zone": "Civic Center Arterial",
        "latitude": 40.7100,
        "longitude": -73.9920,
        "grid_x": 510,
        "grid_y": 460,
        "lanes": 6,
        "speed_limit": 45,
        "camera_active": True,
        "status": "Normal"
    },
    {
        "code": "J-07",
        "name": "University District & Medical Way",
        "zone": "Healthcare & Campus Zone",
        "latitude": 40.7380,
        "longitude": -74.0010,
        "grid_x": 380,
        "grid_y": 110,
        "lanes": 4,
        "speed_limit": 35,
        "camera_active": True,
        "status": "Normal"
    },
    {
        "code": "J-08",
        "name": "Airport Expressway Toll Concourse",
        "zone": "Aviation Gateway Link",
        "latitude": 40.6850,
        "longitude": -73.9550,
        "grid_x": 860,
        "grid_y": 300,
        "lanes": 8,
        "speed_limit": 90,
        "camera_active": True,
        "status": "Normal"
    }
]

def seed_junctions_if_empty():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM junctions")
    row = cursor.fetchone()
    if row and row["count"] == 0:
        for j in DEFAULT_JUNCTIONS:
            cursor.execute("""
            INSERT INTO junctions (code, name, zone, latitude, longitude, grid_x, grid_y, lanes, speed_limit, camera_active, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                j["code"], j["name"], j["zone"], j["latitude"], j["longitude"],
                j["grid_x"], j["grid_y"], j["lanes"], j["speed_limit"],
                1 if j["camera_active"] else 0, j["status"]
            ))
        conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    seed_junctions_if_empty()
    print("Database initialized and junctions seeded successfully.")

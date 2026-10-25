/**
 * API client for Smart Junction AI.
 * Handles calls to backend endpoints with fallback safety and formatting.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchJunctions(status = 'all') {
  const url = status && status !== 'all' ? `${BASE_URL}/api/junctions?status=${status}` : `${BASE_URL}/api/junctions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch junctions: ${res.statusText}`);
  return res.json();
}

export async function fetchJunctionDetail(junctionId) {
  const res = await fetch(`${BASE_URL}/api/junctions/${junctionId}`);
  if (!res.ok) throw new Error(`Failed to fetch junction details: ${res.statusText}`);
  return res.json();
}

export async function fetchTrafficOverview() {
  const res = await fetch(`${BASE_URL}/api/traffic`);
  if (!res.ok) throw new Error(`Failed to fetch traffic overview: ${res.statusText}`);
  return res.json();
}

export async function fetchPredictions(junctionCode = null) {
  const url = junctionCode ? `${BASE_URL}/api/predictions?junction_code=${junctionCode}` : `${BASE_URL}/api/predictions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch predictions: ${res.statusText}`);
  return res.json();
}

export async function fetchAnomalies(filters = {}) {
  const params = new URLSearchParams();
  if (filters.severity && filters.severity !== 'all') params.append('severity', filters.severity);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.junction_id) params.append('junction_id', filters.junction_id);
  
  const res = await fetch(`${BASE_URL}/api/anomalies?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch anomalies: ${res.statusText}`);
  return res.json();
}

export async function fetchAnomalyDetail(anomalyId) {
  const res = await fetch(`${BASE_URL}/api/anomalies/${anomalyId}`);
  if (!res.ok) throw new Error(`Failed to fetch anomaly detail: ${res.statusText}`);
  return res.json();
}

export async function fetchAlerts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.severity && filters.severity !== 'all') params.append('severity', filters.severity);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  
  const res = await fetch(`${BASE_URL}/api/alerts?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`);
  return res.json();
}

export async function updateAlertStatus(alertId, status, acknowledgedBy = 'Operator-Command') {
  const res = await fetch(`${BASE_URL}/api/alerts/${alertId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, acknowledged_by: acknowledgedBy }),
  });
  if (!res.ok) throw new Error(`Failed to update alert: ${res.statusText}`);
  return res.json();
}

export async function acknowledgeAllAlerts() {
  const res = await fetch(`${BASE_URL}/api/alerts/acknowledge-all`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to acknowledge all alerts: ${res.statusText}`);
  return res.json();
}

export async function fetchAnalytics(junctionId = null) {
  const url = junctionId ? `${BASE_URL}/api/analytics?junction_id=${junctionId}` : `${BASE_URL}/api/analytics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  return res.json();
}

export function getExportUrl(reportType = 'traffic') {
  return `${BASE_URL}/api/reports/export?report_type=${reportType}`;
}

export async function triggerSimulationStep() {
  const res = await fetch(`${BASE_URL}/api/simulation/step`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to advance simulation: ${res.statusText}`);
  return res.json();
}

export async function injectIncident(junctionCode, incidentType) {
  const res = await fetch(`${BASE_URL}/api/simulation/inject-incident`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ junction_code: junctionCode, incident_type: incidentType }),
  });
  if (!res.ok) throw new Error(`Failed to inject incident: ${res.statusText}`);
  return res.json();
}

export async function updateSimulationConfig(running, intervalSec) {
  const payload = {};
  if (running !== undefined) payload.running = running;
  if (intervalSec !== undefined) payload.interval_sec = intervalSec;
  
  const res = await fetch(`${BASE_URL}/api/simulation/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update simulation config: ${res.statusText}`);
  return res.json();
}

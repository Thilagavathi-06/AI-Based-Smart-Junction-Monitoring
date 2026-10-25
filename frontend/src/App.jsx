import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import KpiCards from './components/KpiCards';
import SmartCityMap from './components/SmartCityMap';
import JunctionCards from './components/JunctionCards';
import PredictionCenter from './components/PredictionCenter';
import AnomalyDetectionView from './components/AnomalyDetectionView';
import AlertCenterView from './components/AlertCenterView';
import AnalyticsReportsView from './components/AnalyticsReportsView';
import AnomalyDetailModal from './components/AnomalyDetailModal';
import JunctionDetailModal from './components/JunctionDetailModal';
import SimulationSettingsModal from './components/SimulationSettingsModal';
import Toast from './components/Toast';

import { 
  fetchTrafficOverview, 
  fetchJunctions, 
  fetchPredictions, 
  fetchAnomalies, 
  fetchAlerts, 
  fetchAnalytics,
  updateAlertStatus,
  acknowledgeAllAlerts,
  triggerSimulationStep,
  injectIncident
} from './api';

import { 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Radio, 
  ArrowRight, 
  Clock, 
  ExternalLink,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [junctionFilter, setJunctionFilter] = useState('all');

  // Core Data States
  const [kpis, setKpis] = useState({
    total_junctions: 8,
    vehicles_monitored: 0,
    active_anomalies: 0,
    congested_junctions: 0,
  });
  const [junctions, setJunctions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [analytics, setAnalytics] = useState({});

  // Modals & Selection
  const [selectedJunction, setSelectedJunction] = useState(null);
  const [inspectedJunctionModal, setInspectedJunctionModal] = useState(null);
  const [inspectedAnomalyModal, setInspectedAnomalyModal] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Connection & Toast states
  const [isConnected, setIsConnected] = useState(true);
  const [toasts, setToasts] = useState([]);
  const previousAnomaliesCount = useRef(0);

  // Add floating toast helper
  const addToast = useCallback((title, message, type = 'info', severity = 'Normal') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-3), { id, title, message, type, severity }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5500);
  }, []);

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Main data fetching routine
  const refreshAllData = useCallback(async () => {
    try {
      const [
        trafficRes, 
        junctionsRes, 
        predRes, 
        anomRes, 
        alertsRes, 
        analyticsRes
      ] = await Promise.all([
        fetchTrafficOverview(),
        fetchJunctions(),
        fetchPredictions(),
        fetchAnomalies(),
        fetchAlerts(),
        fetchAnalytics(),
      ]);

      if (trafficRes?.kpis) setKpis(trafficRes.kpis);
      if (junctionsRes) {
        setJunctions(junctionsRes);
        // keep selected junction updated with new telemetry
        setSelectedJunction(prev => {
          if (!prev) return junctionsRes[0];
          return junctionsRes.find(j => j.code === prev.code) || junctionsRes[0];
        });
      }
      if (predRes) setPredictions(predRes);
      if (anomRes) {
        // Detect newly arrived anomalies
        if (anomRes.length > previousAnomaliesCount.current && previousAnomaliesCount.current !== 0) {
          const newest = anomRes[0];
          if (newest && newest.status === 'Active') {
            addToast(
              `AI Anomaly Flagged: ${newest.junction_code}`,
              newest.reason?.slice(0, 85) + '...',
              'critical',
              newest.severity
            );
          }
        }
        previousAnomaliesCount.current = anomRes.length;
        setAnomalies(anomRes);
      }
      if (alertsRes) setAlerts(alertsRes);
      if (analyticsRes) setAnalytics(analyticsRes);
      setIsConnected(true);
    } catch (err) {
      console.warn("API poll notice:", err);
      setIsConnected(false);
    }
  }, [addToast]);

  // Initial load and periodic polling every 3.5 seconds
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 3500);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Alert Actions
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await updateAlertStatus(alertId, 'acknowledged');
      addToast('Alert Acknowledged', `Alert ID #${alertId} recorded by Operator.`, 'info');
      refreshAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await updateAlertStatus(alertId, 'resolved');
      addToast('Alert Resolved', `Incident #${alertId} closed in database.`, 'info');
      refreshAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const res = await acknowledgeAllAlerts();
      addToast('Batch Complete', `Acknowledged ${res.acknowledged_count} unread alerts.`, 'info');
      refreshAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Simulation Controls
  const handleTriggerStep = async () => {
    try {
      await triggerSimulationStep();
      addToast('Simulation Step', 'Advanced simulation time clock by 1 tick.', 'info');
      refreshAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleInjectIncident = async (junctionCode, incidentType) => {
    try {
      await injectIncident(junctionCode, incidentType);
      addToast(
        `Incident Injected: ${junctionCode}`,
        `Simulated ${incidentType}. Watch Isolation Forest evaluate the anomaly.`,
        'critical',
        'Critical'
      );
      setTimeout(refreshAllData, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;
  const activeAnomaliesCount = anomalies.filter(a => a.status === 'Active').length;

  return (
    <div className="min-h-screen bg-[#070B18] text-slate-100 flex flex-col font-sans">
      {/* Offline Alert Banner */}
      {!isConnected && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-4 py-2 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Backend API link offline or reconnecting to http://127.0.0.1:8000/api... Retrying automatically.</span>
          </div>
          <button onClick={refreshAllData} className="px-2 py-0.5 rounded bg-amber-500/30 text-white hover:bg-amber-500/50">
            Retry Now
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        unreadAlertsCount={unreadAlertsCount}
        onNavigate={setCurrentTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onTriggerStep={handleTriggerStep}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Layout Body with Sidebar and Main Content Area */}
      <div className="flex-1 flex relative">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeAnomaliesCount={activeAnomaliesCount}
          unreadAlertsCount={unreadAlertsCount}
        />

        <main className={`flex-1 p-4 lg:p-6 transition-all duration-300 max-w-full overflow-x-hidden ${
          sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'
        }`}>
          {/* Breadcrumb & Tab Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-blue-900/40">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                <span>SMART CITY TRAFFIC COMMAND</span>
                <span>/</span>
                <span className="text-slate-300 font-bold capitalize">{currentTab.replace('_', ' ')}</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-wide font-['Outfit']">
                {currentTab === 'dashboard' && 'Command Center Overview'}
                {currentTab === 'map' && 'Interactive Metropolitan Smart City Road Grid'}
                {currentTab === 'junctions' && 'Smart Junction Telemetry & Flow Monitoring'}
                {currentTab === 'predictions' && 'AI Predictive Congestion Analytics & Forecasts'}
                {currentTab === 'anomalies' && 'Isolation Forest Anomaly Detection Center'}
                {currentTab === 'alerts' && 'Live Incident Dispatch & Alert Management'}
                {currentTab === 'analytics' && 'Traffic Patterns, Distributions & Export Reports'}
                {currentTab === 'settings' && 'Simulation Configuration & Incident Injection'}
              </h2>
            </div>

            {/* Simulated Data Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-midnight-800 text-slate-300 border border-blue-900/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Simulated Sensors Online</span>
              </span>
            </div>
          </div>

          {/* ================= TAB 1: DASHBOARD ================= */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 Animated KPI Cards */}
              <KpiCards
                kpis={kpis}
                onFilterJunctions={(filter) => {
                  setJunctionFilter(filter);
                  setCurrentTab('junctions');
                }}
              />

              {/* Large Interactive Smart City Map */}
              <SmartCityMap
                junctions={junctions}
                onSelectJunction={setSelectedJunction}
                selectedJunction={selectedJunction}
                onInspectDetail={setInspectedJunctionModal}
                onInjectIncident={handleInjectIncident}
              />

              {/* Quick Intelligence Stream: Prediction Alert Banner & Recent Anomaly Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Prediction Callout (2 cols) */}
                <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-cyan-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                          AI Predictive Forecast Horizon (+15 to +30 Min)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-cyan-300 border border-blue-500/30">
                        R² 0.975 Model
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white font-['Outfit'] mb-1">
                      {predictions.summary || "Generating predictive models for Metropolitan Grid..."}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {predictions.recommended_action || "Synchronizing arterial corridors."}
                    </p>

                    {/* Quick Preview of 3 High Risk Junctions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(predictions.junction_predictions || []).slice(0, 3).map((jp) => (
                        <div key={jp.junction_code} className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="font-bold text-cyan-400">{jp.junction_code}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              jp.prediction_15m?.congestion_risk === 'Severe' ? 'text-rose-400 bg-rose-500/10' :
                              jp.prediction_15m?.congestion_risk === 'High' ? 'text-amber-400 bg-amber-500/10' :
                              'text-emerald-400 bg-emerald-500/10'
                            }`}>
                              {jp.prediction_15m?.congestion_risk}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{jp.junction_name}</div>
                          <div className="text-xs font-mono font-bold text-white mt-1">
                            +{jp.prediction_15m?.vehicle_count} veh <span className="text-[10px] text-slate-400 font-normal">(@15m)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-blue-900/30 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      MAE 2.97 veh • RMSE 4.91 veh
                    </span>
                    <button
                      onClick={() => setCurrentTab('predictions')}
                      className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
                    >
                      <span>Explore Forecasting Center</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Anomaly Feed Stream (1 col) */}
                <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-rose-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-mono font-bold text-rose-300 uppercase">
                          Isolation Forest Feed
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {activeAnomaliesCount} Active
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {anomalies.slice(0, 3).map((anom) => (
                        <div
                          key={anom.id || anom.anomaly_code}
                          onClick={() => setInspectedAnomalyModal(anom)}
                          className="p-2.5 rounded-xl bg-midnight-900/80 border border-blue-900/30 hover:border-cyan-500/40 cursor-pointer transition"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono font-bold text-white">
                              {anom.junction_code}
                            </span>
                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                              anom.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {anom.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                            {anom.reason}
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            {anom.timestamp}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-blue-900/30 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Outlier Contamination: 4.5%
                    </span>
                    <button
                      onClick={() => setCurrentTab('anomalies')}
                      className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition"
                    >
                      <span>All Anomalies</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Junction Cards Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider">
                    Junction Telemetry Grid
                  </h3>
                  <button
                    onClick={() => setCurrentTab('junctions')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition font-medium"
                  >
                    <span>View All Junctions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <JunctionCards
                  junctions={junctions}
                  onInspectJunction={setInspectedJunctionModal}
                  selectedFilter={junctionFilter}
                  onFilterChange={setJunctionFilter}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          )}

          {/* ================= TAB 2: SMART CITY MAP ================= */}
          {currentTab === 'map' && (
            <div className="space-y-6">
              <SmartCityMap
                junctions={junctions}
                onSelectJunction={setSelectedJunction}
                selectedJunction={selectedJunction}
                onInspectDetail={setInspectedJunctionModal}
                onInjectIncident={handleInjectIncident}
              />
            </div>
          )}

          {/* ================= TAB 3: JUNCTION MONITORING ================= */}
          {currentTab === 'junctions' && (
            <div className="space-y-6">
              <JunctionCards
                junctions={junctions}
                onInspectJunction={setInspectedJunctionModal}
                selectedFilter={junctionFilter}
                onFilterChange={setJunctionFilter}
                searchQuery={searchQuery}
              />
            </div>
          )}

          {/* ================= TAB 4: AI PREDICTIONS ================= */}
          {currentTab === 'predictions' && (
            <div className="space-y-6">
              <PredictionCenter
                predictionData={predictions}
                junctions={junctions}
                hourlyData={analytics.hourly_patterns || []}
              />
            </div>
          )}

          {/* ================= TAB 5: ANOMALY DETECTION ================= */}
          {currentTab === 'anomalies' && (
            <div className="space-y-6">
              <AnomalyDetectionView
                anomalies={anomalies}
                junctions={junctions}
                onInspectEvidence={setInspectedAnomalyModal}
                onResolveAnomaly={(id) => {
                  addToast('Anomaly Resolved', `Flagged anomaly #${id} marked investigated.`, 'info');
                  refreshAllData();
                }}
              />
            </div>
          )}

          {/* ================= TAB 6: LIVE ALERT CENTER ================= */}
          {currentTab === 'alerts' && (
            <div className="space-y-6">
              <AlertCenterView
                alerts={alerts}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onResolveAlert={handleResolveAlert}
                onAcknowledgeAll={handleAcknowledgeAll}
              />
            </div>
          )}

          {/* ================= TAB 7: ANALYTICS & REPORTS ================= */}
          {currentTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsReportsView
                analyticsData={analytics}
                junctions={junctions}
                onFilterJunction={(id) => setJunctionFilter(id)}
              />
            </div>
          )}

          {/* ================= TAB 8: SYSTEM & SIMULATION SETTINGS ================= */}
          {currentTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <SimulationSettingsModal
                onClose={() => setCurrentTab('dashboard')}
                junctions={junctions}
                onStepTriggered={refreshAllData}
                onIncidentInjected={refreshAllData}
              />
            </div>
          )}
        </main>
      </div>

      {/* Anomaly Evidence Inspection Modal */}
      {inspectedAnomalyModal && (
        <AnomalyDetailModal
          anomaly={inspectedAnomalyModal}
          onClose={() => setInspectedAnomalyModal(null)}
          onResolve={() => {
            refreshAllData();
          }}
        />
      )}

      {/* Junction Telemetry & CCTV Modal */}
      {inspectedJunctionModal && (
        <JunctionDetailModal
          junction={inspectedJunctionModal}
          onClose={() => setInspectedJunctionModal(null)}
          onInjectIncident={handleInjectIncident}
        />
      )}

      {/* Simulation Controls & Incident Injector Modal */}
      {showSettingsModal && (
        <SimulationSettingsModal
          onClose={() => setShowSettingsModal(false)}
          junctions={junctions}
          onStepTriggered={refreshAllData}
          onIncidentInjected={refreshAllData}
        />
      )}

      {/* Cyber Toast Notifications Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

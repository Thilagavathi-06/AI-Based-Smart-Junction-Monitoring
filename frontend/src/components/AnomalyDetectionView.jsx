import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Filter, 
  Clock, 
  Car, 
  Gauge, 
  Activity, 
  ChevronRight, 
  ExternalLink,
  Info,
  Zap,
  Layers,
  Video
} from 'lucide-react';

export default function AnomalyDetectionView({ 
  anomalies = [], 
  junctions = [], 
  onInspectEvidence, 
  onResolveAnomaly 
}) {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedJunctionId, setSelectedJunctionId] = useState('all');

  const severities = ['all', 'Critical', 'High', 'Medium', 'Low'];

  const filtered = anomalies.filter(a => {
    const matchSev = selectedSeverity === 'all' || a.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchJunc = selectedJunctionId === 'all' || a.junction_id === Number(selectedJunctionId);
    return matchSev && matchJunc;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-glow-rose';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-['Outfit']">
                  AI ANOMALY DETECTION ENGINE
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Isolation Forest
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Multi-dimensional outlier analysis across vehicle volume, velocity drop, density saturation, and queue delays.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-white">
                {anomalies.filter(a => a.status === 'Active').length}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Active Incidents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0B1224] border border-blue-900/40 text-xs">
        {/* Severity Tabs */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-slate-400 mr-1 text-[11px] font-mono">SEVERITY:</span>
          {severities.map(sev => {
            const count = sev === 'all' 
              ? anomalies.length 
              : anomalies.filter(a => a.severity.toLowerCase() === sev.toLowerCase()).length;
            const isActive = selectedSeverity.toLowerCase() === sev.toLowerCase();

            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-glow-blue' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="capitalize">{sev}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-blue-700' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Junction dropdown filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-mono">JUNCTION:</span>
          <select
            value={selectedJunctionId}
            onChange={(e) => setSelectedJunctionId(e.target.value)}
            className="px-2.5 py-1.5 bg-midnight-900 text-slate-200 rounded-xl border border-blue-900/50 focus:border-cyan-400 focus:outline-none"
          >
            <option value="all">All Junctions</option>
            {junctions.map(j => (
              <option key={j.id} value={j.id}>
                {j.code} - {j.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Anomaly Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0B1224] border border-blue-900/30">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-white">No Anomalies Matching Filters</h4>
          <p className="text-xs text-slate-400 mt-1">Traffic telemetry within nominal multi-variate confidence intervals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((anom) => (
            <div
              key={anom.id || anom.anomaly_code}
              className={`glass-panel p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                anom.severity === 'Critical' 
                  ? 'border-rose-500/40 hover:border-rose-400 shadow-glow-rose/20' 
                  : 'border-blue-900/40 hover:border-cyan-500/40'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {anom.anomaly_code}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-xs text-slate-300">
                      {anom.junction_code}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getSeverityBadge(anom.severity)}`}>
                    {anom.severity}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white font-['Outfit'] mb-1">
                  {anom.junction_name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{anom.timestamp}</span>
                  {anom.anomaly_score && (
                    <span className="text-cyan-400">
                      (Score: {anom.anomaly_score})
                    </span>
                  )}
                </div>

                {/* 4 Observed Traffic Values Pills */}
                <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                  <div className="p-2 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                    <div className="text-[9px] text-slate-400">Volume</div>
                    <div className="text-xs font-bold font-mono text-white mt-0.5">
                      {anom.vehicle_count}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                    <div className="text-[9px] text-slate-400">Speed</div>
                    <div className="text-xs font-bold font-mono text-cyan-300 mt-0.5">
                      {anom.avg_speed}k
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                    <div className="text-[9px] text-slate-400">Density</div>
                    <div className="text-xs font-bold font-mono text-amber-300 mt-0.5">
                      {anom.density_pct}%
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                    <div className="text-[9px] text-slate-400">Wait Delay</div>
                    <div className="text-xs font-bold font-mono text-rose-300 mt-0.5">
                      {anom.waiting_time_sec}s
                    </div>
                  </div>
                </div>

                {/* Root Cause Reason */}
                <div className="p-2.5 rounded-xl bg-midnight-900/70 border border-blue-900/30 text-xs text-slate-300 mb-3">
                  <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase mb-1">
                    Isolation Forest Diagnosis:
                  </div>
                  <p className="leading-relaxed">
                    {anom.reason}
                  </p>
                </div>

                {/* Recommended Action */}
                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 mb-4">
                  <div className="text-[10px] font-mono font-bold text-blue-300 uppercase mb-1">
                    Recommended Intervention:
                  </div>
                  <p className="leading-relaxed">
                    {anom.recommended_action}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-blue-900/30 flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  anom.status === 'Active' ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'
                }`}>
                  Status: {anom.status}
                </span>

                <button
                  onClick={() => onInspectEvidence(anom)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 text-cyan-300 hover:bg-blue-600/40 border border-blue-500/30 font-medium transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Evidence</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

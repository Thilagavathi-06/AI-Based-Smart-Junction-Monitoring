import React, { useState } from 'react';
import { 
  TrendingUp, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity, 
  BarChart2, 
  Info,
  Car,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export default function PredictionCenter({ 
  predictionData = {}, 
  junctions = [], 
  hourlyData = [] 
}) {
  const [selectedJunctionCode, setSelectedJunctionCode] = useState(
    predictionData.high_risk_junctions?.[0] || 'J-03'
  );

  const {
    summary = "Predictive model operational.",
    high_risk_junctions = [],
    recommended_action = "Standard progression active.",
    junction_predictions = [],
    model_metrics = {}
  } = predictionData;

  const currentPred = junction_predictions.find(p => p.junction_code === selectedJunctionCode) || junction_predictions[0] || {};
  const metrics15 = model_metrics.forecast_15m || { mae: 2.97, rmse: 4.91, r2: 0.975, accuracy_pct: 97.5 };
  const metrics30 = model_metrics.forecast_30m || { mae: 3.26, rmse: 5.24, r2: 0.972, accuracy_pct: 97.2 };

  // Generate comparison chart data for current vs +15m vs +30m across all junctions
  const forecastComparisonData = junction_predictions.map(j => ({
    code: j.junction_code,
    name: j.junction_name,
    current: j.current?.vehicle_count || 0,
    pred15: j.prediction_15m?.vehicle_count || 0,
    pred30: j.prediction_30m?.vehicle_count || 0,
    density15: j.prediction_15m?.density_pct || 0,
    density30: j.prediction_30m?.density_pct || 0,
  }));

  // Recharts custom dark tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1224] p-3 rounded-xl border border-blue-900/60 shadow-xl text-xs font-mono">
          <div className="font-bold text-cyan-300 mb-1">{label}</div>
          {payload.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-4" style={{ color: item.color }}>
              <span>{item.name}:</span>
              <span className="font-bold">{item.value} {item.unit || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'Severe':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-rose';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Moderate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Prediction Summary Callout Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 shadow-glow-cyan/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-600/10 via-cyan-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-600/20 text-cyan-400 border border-cyan-500/30 shrink-0">
              <TrendingUp className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  AI FORECASTING ENGINE • 15 & 30 MIN HORIZON
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SIMULATED DATA
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">
                {summary}
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recommended Action: {recommended_action}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <select
              value={selectedJunctionCode}
              onChange={(e) => setSelectedJunctionCode(e.target.value)}
              className="px-3 py-2 bg-midnight-900 text-xs font-mono text-cyan-300 rounded-xl border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
            >
              {junction_predictions.map(j => (
                <option key={j.junction_code} value={j.junction_code}>
                  {j.junction_code} - {j.junction_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 15m vs 30m Congestion Risk Spotlights for Selected Junction */}
      {currentPred && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* +15 Minutes Prediction */}
          <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  T + 15 Minutes Forecast ({currentPred.junction_code})
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getRiskBadge(currentPred.prediction_15m?.congestion_risk)}`}>
                {currentPred.prediction_15m?.congestion_risk} Risk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                <div className="text-[10px] text-slate-400 mb-1">Expected Vehicles</div>
                <div className="text-2xl font-bold font-mono text-white">
                  {currentPred.prediction_15m?.vehicle_count || 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    (from {currentPred.current?.vehicle_count || 0})
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                <div className="text-[10px] text-slate-400 mb-1">Expected Density</div>
                <div className="text-2xl font-bold font-mono text-cyan-300">
                  {currentPred.prediction_15m?.density_pct || 0}%
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-midnight-900/60 p-2.5 rounded-xl border border-blue-900/30">
              {currentPred.prediction_15m?.description}
            </p>
          </div>

          {/* +30 Minutes Prediction */}
          <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  T + 30 Minutes Forecast ({currentPred.junction_code})
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getRiskBadge(currentPred.prediction_30m?.congestion_risk)}`}>
                {currentPred.prediction_30m?.congestion_risk} Risk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                <div className="text-[10px] text-slate-400 mb-1">Expected Vehicles</div>
                <div className="text-2xl font-bold font-mono text-white">
                  {currentPred.prediction_30m?.vehicle_count || 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    (from {currentPred.current?.vehicle_count || 0})
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                <div className="text-[10px] text-slate-400 mb-1">Expected Density</div>
                <div className="text-2xl font-bold font-mono text-blue-300">
                  {currentPred.prediction_30m?.density_pct || 0}%
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-midnight-900/60 p-2.5 rounded-xl border border-blue-900/30">
              {currentPred.prediction_30m?.description}
            </p>
          </div>
        </div>
      )}

      {/* Charts Section: 1. Live/Historical Traffic Trend, 2. Junction Comparison Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: 24-Hour Diurnal Volume & Speed Profile */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                24-Hour Traffic Trend & Speed Profile
              </h3>
              <p className="text-[11px] text-slate-400">
                Historical diurnal curves and flow velocity
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-cyan-400 border border-blue-500/30">
              Diurnal Dynamics
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="hour_label" stroke="#64748B" fontSize={10} fontVariant="monospace" />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="avg_vehicles" name="Avg Volume" stroke="#3B82F6" fillOpacity={1} fill="url(#volGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="avg_speed" name="Avg Speed (km/h)" stroke="#22D3EE" fillOpacity={1} fill="url(#speedGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Junction-wise Congestion Forecast Comparison */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Junction-wise Predictive Volume Comparison
              </h3>
              <p className="text-[11px] text-slate-400">
                Current volume vs +15 min vs +30 min models
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Multi-Horizon
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="code" stroke="#64748B" fontSize={10} fontVariant="monospace" />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="current" name="Current" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pred15" name="+15 Min Forecast" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pred30" name="+30 Min Forecast" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Evaluation Metrics Scorecard */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-['Outfit']">
            Traffic Forecasting Model Evaluation Metrics
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            (Scikit-Learn GradientBoostingRegressor)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Mean Absolute Error (15m)</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
              {metrics15.mae} <span className="text-xs text-slate-400 font-normal">veh</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Average deviation from ground-truth</div>
          </div>

          <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Root Mean Squared Error (15m)</div>
            <div className="text-xl font-bold font-mono text-blue-400 mt-1">
              {metrics15.rmse} <span className="text-xs text-slate-400 font-normal">veh</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Penalizes large error spikes</div>
          </div>

          <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Coefficient of Determination (R²)</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {metrics15.r2}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{metrics15.accuracy_pct}% variance explained</div>
          </div>

          <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
            <div className="text-[10px] text-slate-400 uppercase font-mono">30-Min Horizon R²</div>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
              {metrics30.r2}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">MAE {metrics30.mae} veh • RMSE {metrics30.rmse}</div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-midnight-900/50 border border-blue-900/20 flex items-start gap-2.5 text-[11px] text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Transparency Notice:</strong> All metrics are calculated via test splits on synthetic multi-junction diurnal telemetry. Predictions represent probabilistic regression forecasts to aid intelligent dispatch, not absolute future certainty.
          </span>
        </div>
      </div>
    </div>
  );
}

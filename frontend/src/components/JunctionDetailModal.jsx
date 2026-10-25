import React, { useState, useEffect } from 'react';
import { 
  X, 
  Radio, 
  Car, 
  Gauge, 
  Activity, 
  Clock, 
  Video, 
  Zap, 
  Layers, 
  Compass, 
  ShieldCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { fetchJunctionDetail } from '../api';

export default function JunctionDetailModal({ junction, onClose, onInjectIncident }) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!junction?.id) return;
    setLoading(true);
    fetchJunctionDetail(junction.id)
      .then(data => {
        setDetailData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load junction detail:", err);
        setLoading(false);
      });
  }, [junction]);

  if (!junction) return null;

  const tel = junction.telemetry || {};
  const history = detailData?.recent_readings || [];

  // Format history timestamps
  const chartData = history.map(h => ({
    time: h.timestamp ? h.timestamp.slice(11, 16) : '',
    vehicles: h.vehicle_count,
    speed: h.avg_speed,
    density: h.density_pct,
    waiting: h.waiting_time_sec,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1224] p-2.5 rounded-xl border border-blue-900/60 shadow-xl text-xs font-mono">
          <div className="font-bold text-cyan-300 mb-1">{label}</div>
          {payload.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-4" style={{ color: item.color }}>
              <span>{item.name}:</span>
              <span className="font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0B1224] rounded-2xl border border-cyan-500/40 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-900/40 bg-midnight-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-cyan-400 border border-blue-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-600/20 text-cyan-300 border border-blue-500/30">
                  {junction.code}
                </span>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  {junction.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {junction.zone} • {junction.lanes} Lanes • Speed Limit {junction.speed_limit} km/h
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Real-time Telemetry 4-Pill Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vehicle Count</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {tel.vehicle_count || 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                <span>Flow Speed</span>
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {tel.avg_speed || 0} <span className="text-xs text-slate-400">km/h</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Density</span>
              </div>
              <div className="text-xl font-bold font-mono text-amber-300">
                {tel.density_pct || 0}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-midnight-900/80 border border-blue-900/30">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Wait Delay</span>
              </div>
              <div className="text-xl font-bold font-mono text-rose-300">
                {tel.waiting_time_sec || 0} <span className="text-xs text-slate-400">s</span>
              </div>
            </div>
          </div>

          {/* Historical Telemetry Sparkline Chart */}
          <div className="p-4 rounded-xl bg-midnight-900/60 border border-blue-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase">
                Recent Telemetry History (Last 30 Readings)
              </div>
              <span className="text-[10px] font-mono text-cyan-400">
                Sampling Rate: Continuous
              </span>
            </div>

            <div className="h-48">
              {loading ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-500 font-mono">
                  Loading telemetry series...
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="juncVeh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} fontVariant="monospace" />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="vehicles" name="Vehicles" stroke="#3B82F6" fillOpacity={1} fill="url(#juncVeh)" strokeWidth={2} />
                    <Area type="monotone" dataKey="density" name="Density %" stroke="#22D3EE" fillOpacity={0} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-500 font-mono">
                  No historical telemetry yet.
                </div>
              )}
            </div>
          </div>

          {/* CCTV Feed Simulation & Adaptive Signal Light Controller */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Live Camera Screen */}
            <div className="p-3.5 rounded-xl bg-midnight-900/80 border border-blue-900/30">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  Live CCTV Camera Feed
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  LIVE 1080P
                </span>
              </div>
              <div className="aspect-video rounded-lg bg-black/80 border border-blue-900/40 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-transparent to-transparent pointer-events-none" />
                <div className="text-center font-mono text-[10px] text-slate-400">
                  <div className="text-cyan-400 font-bold mb-1">OPTICAL OBJECT DETECTION</div>
                  <div>Vehicles Tracked: {tel.vehicle_count || 0}</div>
                  <div>Queue Tail: {tel.queue_length_m || 0}m</div>
                </div>
                <div className="absolute top-1.5 left-1.5 text-[8px] font-mono text-cyan-300 bg-black/60 px-1 rounded">
                  CAM-{junction.code}
                </div>
              </div>
            </div>

            {/* Adaptive Signal Status */}
            <div className="p-3.5 rounded-xl bg-midnight-900/80 border border-blue-900/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Adaptive Signal Cycle
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Cycle: 90s
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between p-1.5 rounded bg-midnight-950 border border-blue-900/20">
                    <span className="text-slate-400">North-South Phase:</span>
                    <span className="text-emerald-400 font-bold">GREEN (32s rem)</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-midnight-950 border border-blue-900/20">
                    <span className="text-slate-400">East-West Phase:</span>
                    <span className="text-rose-400 font-bold">RED (32s rem)</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-midnight-950 border border-blue-900/20">
                    <span className="text-slate-400">Adaptive Offset:</span>
                    <span className="text-cyan-400">+12s (Coordinated)</span>
                  </div>
                </div>
              </div>

              {/* Quick Incident Test Button */}
              <button
                onClick={() => {
                  onInjectIncident(junction.code, 'gridlock');
                  onClose();
                }}
                className="mt-3 w-full py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Inject Test Gridlock Surge</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-blue-900/40 bg-midnight-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Filter, 
  Clock, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  Cpu, 
  PieChart as PieIcon,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { getExportUrl } from '../api';

export default function AnalyticsReportsView({ 
  analyticsData = {}, 
  junctions = [], 
  onFilterJunction 
}) {
  const [selectedJunctionFilter, setSelectedJunctionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('24h');
  const [exportNotice, setExportNotice] = useState('');

  const {
    hourly_patterns = [],
    junction_comparison = [],
    anomaly_frequency = [],
    density_distribution = [],
    model_metrics = {}
  } = analyticsData;

  const handleExport = (type) => {
    const url = getExportUrl(type);
    window.open(url, '_blank');
    setExportNotice(`Exporting ${type} dataset to CSV...`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B1224] p-3 rounded-xl border border-blue-900/60 shadow-xl text-xs font-mono">
          <div className="font-bold text-cyan-300 mb-1">{label}</div>
          {payload.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-4" style={{ color: item.color || '#22D3EE' }}>
              <span>{item.name}:</span>
              <span className="font-bold">{item.value} {item.unit || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const SEVERITY_COLORS = {
    Critical: '#EF4444',
    High: '#F59E0B',
    Medium: '#EAB308',
    Low: '#3B82F6',
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Header and Export Toolbar */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-white font-['Outfit']">
              TRAFFIC ANALYTICS & REGULATORY REPORTS
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-cyan-400 border border-blue-500/30">
              Aggregated Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Cross-junction historical throughput, queue distributions, anomaly frequency, and model metrics.
          </p>
        </div>

        {/* CSV Export Action Group */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => handleExport('traffic')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Traffic CSV</span>
          </button>

          <button
            onClick={() => handleExport('alerts')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-midnight-900 hover:bg-slate-800 text-slate-200 border border-blue-900/50 text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Export Alerts CSV</span>
          </button>

          <button
            onClick={() => handleExport('anomalies')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-midnight-900 hover:bg-slate-800 text-slate-200 border border-blue-900/50 text-xs font-medium transition"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Export Anomalies CSV</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Analytics Charts 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Hourly Traffic & Flow Velocity */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Hourly Flow Volume & Velocity
              </h3>
              <p className="text-[11px] text-slate-400">
                24-Hour continuous traffic aggregation
              </p>
            </div>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly_patterns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="anVolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="hour_label" stroke="#64748B" fontSize={10} fontVariant="monospace" />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="avg_vehicles" name="Vehicles" stroke="#3B82F6" fillOpacity={1} fill="url(#anVolGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="avg_density" name="Density %" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Junction Congestion Comparison */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Junction Congestion Ranking
              </h3>
              <p className="text-[11px] text-slate-400">
                Average density % across all 8 monitored nodes
              </p>
            </div>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={junction_comparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="code" stroke="#64748B" fontSize={10} fontVariant="monospace" />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="avg_density" name="Avg Density %" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="congestion_incidents" name="Incidents" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Traffic Density Distribution (Donut) */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Corridor Traffic Density Distribution
              </h3>
              <p className="text-[11px] text-slate-400">
                Network percentage in each flow regime
              </p>
            </div>
            <PieIcon className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={density_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {density_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B1224" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Anomaly Frequency by Severity */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-900/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Anomaly Frequency by Severity
              </h3>
              <p className="text-[11px] text-slate-400">
                Isolation Forest outlier classifications
              </p>
            </div>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomaly_frequency} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="severity" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="count" name="Detections" fill="#EF4444" radius={[4, 4, 0, 0]}>
                  {anomaly_frequency.map((entry, index) => (
                    <Cell key={`anom-cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

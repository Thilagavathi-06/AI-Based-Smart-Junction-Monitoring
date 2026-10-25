import React, { useState } from 'react';
import { 
  Car, 
  Gauge, 
  Activity, 
  Clock, 
  Video, 
  ChevronRight, 
  Filter, 
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

export default function JunctionCards({ 
  junctions = [], 
  onInspectJunction, 
  selectedFilter = 'all', 
  onFilterChange,
  searchQuery = ''
}) {
  const [viewMode, setViewMode] = useState('grid'); // grid or table

  const filterTabs = [
    { id: 'all', label: 'All Junctions' },
    { id: 'Normal', label: 'Normal Flow' },
    { id: 'Moderate', label: 'Moderate' },
    { id: 'Congested', label: 'Congested' },
    { id: 'Critical', label: 'Critical' },
  ];

  // Filter junctions by tab and search
  const filteredJunctions = junctions.filter(j => {
    const matchesFilter = selectedFilter === 'all' || j.status?.toLowerCase() === selectedFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      j.code?.toLowerCase().includes(query) || 
      j.name?.toLowerCase().includes(query) || 
      j.zone?.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-glow-rose';
      case 'Congested':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Moderate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const getDensityColor = (density) => {
    if (density >= 85) return '#EF4444';
    if (density >= 68) return '#F59E0B';
    if (density >= 45) return '#EAB308';
    return '#22C55E';
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0B1224] border border-blue-900/40">
        {/* Status Filter Tabs */}
        <div className="flex items-center flex-wrap gap-1.5">
          {filterTabs.map((tab) => {
            const count = tab.id === 'all' 
              ? junctions.length 
              : junctions.filter(j => j.status?.toLowerCase() === tab.id.toLowerCase()).length;
            const isActive = selectedFilter.toLowerCase() === tab.id.toLowerCase();

            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-glow-blue'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] font-mono text-slate-400">
            Showing {filteredJunctions.length} of {junctions.length}
          </span>
          <div className="p-0.5 rounded-lg bg-midnight-900 border border-blue-900/40 flex text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded-md transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded-md transition ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredJunctions.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[#0B1224] border border-blue-900/30">
          <Activity className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-white">No Junctions Found</h4>
          <p className="text-xs text-slate-400 mt-1">No junctions matching filter "{selectedFilter}" or query "{searchQuery}".</p>
          <button
            onClick={() => onFilterChange('all')}
            className="mt-4 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredJunctions.map((j) => {
            const tel = j.telemetry || {};
            const isCritical = j.status === 'Critical' || (tel.density_pct || 0) >= 85;

            return (
              <div
                key={j.code}
                onClick={() => onInspectJunction(j)}
                className={`glass-panel glass-panel-hover p-4 rounded-2xl border transition-all duration-300 relative cursor-pointer group flex flex-col justify-between ${
                  isCritical ? 'border-rose-500/40 shadow-glow-rose/20' : 'border-blue-900/40'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-600/20 text-cyan-300 border border-blue-500/30">
                      {j.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getStatusBadge(j.status)}`}>
                      {j.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1 font-['Outfit']">
                    {j.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-4 line-clamp-1">
                    {j.zone}
                  </p>

                  {/* Density Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        Density
                      </span>
                      <span className="font-mono font-bold text-white">
                        {tel.density_pct || 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, tel.density_pct || 0)}%`,
                          backgroundColor: getDensityColor(tel.density_pct || 0)
                        }}
                      />
                    </div>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                        <Car className="w-3 h-3 text-cyan-400" />
                        Vehicles
                      </div>
                      <div className="font-mono font-bold text-slate-100 text-sm">
                        {tel.vehicle_count || 0}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-midnight-900/80 border border-blue-900/30">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                        <Gauge className="w-3 h-3 text-blue-400" />
                        Avg Speed
                      </div>
                      <div className="font-mono font-bold text-slate-100 text-sm">
                        {tel.avg_speed || 0} <span className="text-[10px] text-slate-400 font-normal">km/h</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-midnight-900/80 border border-blue-900/30 col-span-2 flex items-center justify-between">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Avg Waiting Delay
                      </div>
                      <div className="font-mono font-bold text-slate-100 text-xs">
                        {tel.waiting_time_sec || 0} sec ({((tel.waiting_time_sec || 0) / 60).toFixed(1)}m)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-blue-900/30 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono">{tel.last_updated ? tel.last_updated.slice(11, 19) : 'Live'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-0.5 transition font-medium">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl bg-[#0B1224] border border-blue-900/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-midnight-900/80 text-[11px] font-mono uppercase text-slate-400 border-b border-blue-900/40">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Junction Name & Zone</th>
                <th className="py-3 px-4">Vehicles</th>
                <th className="py-3 px-4">Speed (Limit)</th>
                <th className="py-3 px-4">Density</th>
                <th className="py-3 px-4">Wait Delay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 font-mono">
              {filteredJunctions.map((j) => {
                const tel = j.telemetry || {};
                return (
                  <tr key={j.code} className="hover:bg-slate-800/40 transition cursor-pointer" onClick={() => onInspectJunction(j)}>
                    <td className="py-3 px-4 font-bold text-cyan-400">{j.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-sans font-semibold text-white">{j.name}</div>
                      <div className="text-[10px] text-slate-500">{j.zone}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{tel.vehicle_count || 0} veh</td>
                    <td className="py-3 px-4">{tel.avg_speed || 0} km/h ({j.speed_limit}k)</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, tel.density_pct || 0)}%`,
                              backgroundColor: getDensityColor(tel.density_pct || 0)
                            }}
                          />
                        </div>
                        <span>{tel.density_pct || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{tel.waiting_time_sec || 0}s</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getStatusBadge(j.status)}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onInspectJunction(j); }}
                        className="px-2.5 py-1 rounded bg-blue-600/20 text-cyan-300 hover:bg-blue-600/40 text-[11px] font-sans font-medium transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

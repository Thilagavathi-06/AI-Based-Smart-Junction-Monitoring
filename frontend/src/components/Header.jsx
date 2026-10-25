import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Bell, 
  Search, 
  ShieldAlert, 
  Cpu, 
  Play, 
  RotateCw, 
  AlertTriangle,
  UserCheck,
  Radio,
  Sliders
} from 'lucide-react';

export default function Header({ 
  unreadAlertsCount = 0, 
  onNavigate, 
  searchQuery, 
  setSearchQuery, 
  onTriggerStep, 
  onOpenSettings,
  isSimulating = true
}) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#070B18]/90 backdrop-blur-md border-b border-blue-900/40 px-4 lg:px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/40 shadow-glow-cyan">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/10 blur-sm pointer-events-none" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent font-['Outfit']">
                SMART JUNCTION AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                SIMULATION ONLINE
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                SIMULATED DATA
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-wide">
              Intelligent Traffic Monitoring & Predictive Analytics
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center flex-wrap gap-2 lg:gap-4">
          {/* Live Clock */}
          <div className="hidden xl:flex flex-col items-end px-3 py-1 rounded-lg bg-midnight-800/80 border border-blue-900/30 text-right">
            <div className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
              {timeStr || "12:00:00"} <span className="text-[10px] text-slate-400">UTC</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {dateStr}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 sm:w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search junctions (e.g. J-01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-midnight-800/90 text-slate-200 rounded-lg border border-blue-900/50 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 placeholder:text-slate-500 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Manual Step Simulation Button */}
          <button
            onClick={onTriggerStep}
            title="Advance Simulation Step"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 text-cyan-300 border border-blue-500/40 hover:bg-blue-600/30 hover:border-cyan-400 transition shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sim Step</span>
          </button>

          {/* Simulation Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Simulation Controls & Incident Injection"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-midnight-800 text-slate-300 border border-blue-900/50 hover:border-cyan-500/50 hover:text-white transition"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Simulation</span>
          </button>

          {/* Alerts Bell */}
          <button
            onClick={() => onNavigate('alerts')}
            className="relative p-2 rounded-lg bg-midnight-800 text-slate-300 border border-blue-900/50 hover:border-cyan-500/50 hover:text-white transition"
            title="Alert Center"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-glow-rose animate-bounce">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Operator Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-blue-900/40">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              CC
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-[11px] font-semibold text-slate-200 leading-tight">Commander</div>
              <div className="text-[9px] text-cyan-400 font-mono">SECTOR-7 OPS</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

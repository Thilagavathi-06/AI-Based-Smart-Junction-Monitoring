import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Radio, 
  TrendingUp, 
  ShieldAlert, 
  Bell, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Layers
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  onSelectTab, 
  collapsed, 
  setCollapsed,
  activeAnomaliesCount = 0,
  unreadAlertsCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'map', label: 'Smart City Map', icon: MapPin },
    { id: 'junctions', label: 'Junction Monitoring', icon: Radio },
    { id: 'predictions', label: 'AI Predictions', icon: TrendingUp },
    { 
      id: 'anomalies', 
      label: 'Anomaly Detection', 
      icon: ShieldAlert, 
      badge: activeAnomaliesCount > 0 ? activeAnomaliesCount : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    },
    { 
      id: 'alerts', 
      label: 'Live Alert Center', 
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'settings', label: 'System & Simulation', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed lg:sticky top-[61px] left-0 h-[calc(100vh-61px)] z-20 bg-[#0B1224] border-r border-blue-900/40 flex flex-col transition-all duration-300 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className={`px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? 'SYS' : 'NAVIGATION MODULES'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive 
                  ? 'bg-blue-600/15 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan/50' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full shadow-glow-cyan" />
              )}

              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
              }`} />

              {!collapsed && (
                <span className="flex-1 text-left truncate tracking-wide">
                  {item.label}
                </span>
              )}

              {!collapsed && item.badge && (
                <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Model Status Card (expanded only) */}
      {!collapsed && (
        <div className="p-3 mx-2 mb-3 rounded-xl bg-midnight-900/80 border border-blue-900/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-200">AI Engine Online</span>
          </div>
          <div className="space-y-1 text-[10px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Isolation Forest:</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Traffic Forecast:</span>
              <span className="text-cyan-400 font-semibold">R² 0.975</span>
            </div>
            <div className="flex justify-between">
              <span>Telemetry Feed:</span>
              <span className="text-blue-400 font-semibold">Live Polling</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Collapse Toggle */}
      <div className="p-2 border-t border-blue-900/40 flex items-center justify-between">
        {!collapsed && (
          <span className="text-[10px] text-slate-500 font-mono pl-2">
            v2.4 SmartCity Core
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition mx-auto lg:mx-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

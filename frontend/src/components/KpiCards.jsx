import React from 'react';
import { 
  Radio, 
  Car, 
  ShieldAlert, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers
} from 'lucide-react';

export default function KpiCards({ kpis = {}, onFilterJunctions }) {
  const {
    total_junctions = 8,
    vehicles_monitored = 0,
    active_anomalies = 0,
    congested_junctions = 0,
  } = kpis;

  const cards = [
    {
      id: 'junctions',
      title: 'Total Junctions',
      value: total_junctions,
      unit: 'Nodes',
      subtext: '100% Telemetry Active',
      subIcon: Activity,
      icon: Radio,
      color: 'cyan',
      borderClass: 'border-cyan-500/30 hover:border-cyan-400',
      glowClass: 'shadow-glow-cyan/30',
      badge: '8/8 Online',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      onClick: () => onFilterJunctions && onFilterJunctions('all')
    },
    {
      id: 'vehicles',
      title: 'Vehicles Monitored',
      value: vehicles_monitored.toLocaleString(),
      unit: 'Vehicles',
      subtext: '+4.2% vs 1-hr Moving Avg',
      subIcon: ArrowUpRight,
      icon: Car,
      color: 'blue',
      borderClass: 'border-blue-500/30 hover:border-blue-400',
      glowClass: 'shadow-glow-blue/30',
      badge: 'Real-time Flow',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      onClick: () => onFilterJunctions && onFilterJunctions('all')
    },
    {
      id: 'anomalies',
      title: 'Active Anomalies',
      value: active_anomalies,
      unit: 'Incidents',
      subtext: 'Flagged by Isolation Forest',
      subIcon: AlertTriangle,
      icon: ShieldAlert,
      color: active_anomalies > 0 ? 'rose' : 'emerald',
      borderClass: active_anomalies > 0 ? 'border-rose-500/40 hover:border-rose-400' : 'border-emerald-500/30 hover:border-emerald-400',
      glowClass: active_anomalies > 0 ? 'shadow-glow-rose/40' : 'shadow-glow-cyan/20',
      badge: active_anomalies > 0 ? 'Attention Needed' : 'Nominal Flow',
      badgeColor: active_anomalies > 0 ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      onClick: () => onFilterJunctions && onFilterJunctions('Critical')
    },
    {
      id: 'congested',
      title: 'Congested Junctions',
      value: congested_junctions,
      unit: 'Hotspots',
      subtext: 'Density > 68% Capacity',
      subIcon: ArrowUpRight,
      icon: AlertTriangle,
      color: congested_junctions > 0 ? 'amber' : 'cyan',
      borderClass: congested_junctions > 0 ? 'border-amber-500/40 hover:border-amber-400' : 'border-cyan-500/30 hover:border-cyan-400',
      glowClass: congested_junctions > 0 ? 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]' : 'shadow-glow-cyan/20',
      badge: `${congested_junctions} Bottlenecks`,
      badgeColor: congested_junctions > 0 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      onClick: () => onFilterJunctions && onFilterJunctions('Congested')
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const SubIcon = card.subIcon;

        return (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`glass-panel glass-panel-hover p-4 rounded-2xl relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${card.borderClass}`}
          >
            {/* Background subtle glow accent */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 tracking-wide">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-midnight-900/90 border border-blue-900/40 text-cyan-400 shadow-sm">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold tracking-tight text-white font-['Outfit']">
                {card.value}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {card.unit}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-blue-900/30">
              <div className="flex items-center gap-1 text-slate-400">
                <SubIcon className="w-3 h-3 text-cyan-400" />
                <span>{card.subtext}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

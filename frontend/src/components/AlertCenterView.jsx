import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  CheckCheck, 
  Filter, 
  Archive,
  Radio,
  UserCheck
} from 'lucide-react';

export default function AlertCenterView({ 
  alerts = [], 
  onAcknowledgeAlert, 
  onResolveAlert, 
  onAcknowledgeAll 
}) {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const severities = ['all', 'Critical', 'Warning', 'Normal'];
  const statusTabs = [
    { id: 'all', label: 'All Alerts' },
    { id: 'unread', label: 'Unread' },
    { id: 'acknowledged', label: 'Acknowledged' },
    { id: 'resolved', label: 'Resolved' },
  ];

  const filteredAlerts = alerts.filter(a => {
    const matchSev = selectedSeverity === 'all' || a.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchStat = selectedStatus === 'all' || a.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchSev && matchStat;
  });

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'Critical':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-glow-rose',
          card: 'border-rose-500/40 hover:border-rose-400 bg-rose-950/10',
          icon: ShieldAlert,
          iconColor: 'text-rose-400'
        };
      case 'Warning':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          card: 'border-amber-500/40 hover:border-amber-400 bg-amber-950/10',
          icon: AlertTriangle,
          iconColor: 'text-amber-400'
        };
      default:
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          card: 'border-emerald-500/30 hover:border-emerald-400 bg-emerald-950/10',
          icon: CheckCircle,
          iconColor: 'text-emerald-400'
        };
    }
  };

  const unreadCount = alerts.filter(a => a.status === 'unread').length;

  return (
    <div className="space-y-6 mb-8">
      {/* Alert Center Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/20 text-cyan-400 border border-blue-500/30">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-['Outfit']">
              LIVE ALERT COMMAND & NOTIFICATION CENTER
            </h2>
            <p className="text-xs text-slate-300">
              Real-time incident dispatch, severity ranking, and operator acknowledgments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onAcknowledgeAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-glow-cyan transition"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Acknowledge All ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Status Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0B1224] border border-blue-900/40 text-xs">
        {/* Status Tabs */}
        <div className="flex items-center flex-wrap gap-1.5">
          {statusTabs.map(tab => {
            const count = tab.id === 'all' 
              ? alerts.length 
              : alerts.filter(a => a.status.toLowerCase() === tab.id.toLowerCase()).length;
            const isActive = selectedStatus.toLowerCase() === tab.id.toLowerCase();

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-glow-blue' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-blue-700' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] font-mono">SEVERITY:</span>
          {severities.map(sev => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg capitalize transition ${
                selectedSeverity.toLowerCase() === sev.toLowerCase()
                  ? 'bg-midnight-900 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0B1224] border border-blue-900/30">
          <CheckCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-white">No Alerts Found</h4>
          <p className="text-xs text-slate-400 mt-1">All telemetry is nominal and existing incidents are resolved.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => {
            const style = getSeverityStyle(alert.severity);
            const Icon = style.icon;
            const isUnread = alert.status === 'unread';

            return (
              <div
                key={alert.id || alert.alert_code}
                className={`p-4 rounded-2xl border transition-all duration-200 relative glass-panel ${style.card} ${
                  isUnread ? 'bg-[#0B1224]/90' : 'opacity-85'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl bg-midnight-900 border border-blue-900/40 ${style.iconColor} shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${style.badge}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {alert.junction_code}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs font-mono text-slate-400">
                          {alert.alert_code}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {alert.timestamp}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white font-['Outfit']">
                        {alert.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        {alert.message}
                      </p>

                      {/* Acknowledged / Resolved info */}
                      {alert.acknowledged_at && (
                        <div className="mt-2 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>Acknowledged by {alert.acknowledged_by || 'Operator'} at {alert.acknowledged_at}</span>
                        </div>
                      )}
                      {alert.resolved_at && (
                        <div className="mt-0.5 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Resolved at {alert.resolved_at}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {alert.status === 'unread' && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-glow-blue transition"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition"
                      >
                        Resolve
                      </button>
                    )}

                    {alert.status === 'resolved' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium">
                        ✓ Closed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

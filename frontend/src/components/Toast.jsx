import React, { useEffect } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, X, Radio } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const isCritical = t.type === 'critical' || t.severity === 'Critical';
        const isWarning = t.type === 'warning' || t.severity === 'Warning';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              isCritical
                ? 'bg-rose-950/90 border-rose-500/60 text-white shadow-glow-rose'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/60 text-white shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]'
                : 'bg-[#0B1224]/95 border-cyan-500/50 text-white shadow-glow-cyan'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Radio className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs">
              <div className="font-bold font-['Outfit'] flex items-center justify-between">
                <span>{t.title || 'Telemetry Notice'}</span>
                <span className="text-[10px] font-mono opacity-60">Just now</span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-white p-0.5 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

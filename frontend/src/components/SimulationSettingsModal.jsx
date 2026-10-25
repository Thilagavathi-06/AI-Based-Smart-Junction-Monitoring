import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Play, 
  Pause, 
  RotateCw, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Layers,
  Radio,
  Clock
} from 'lucide-react';
import { updateSimulationConfig, triggerSimulationStep, injectIncident } from '../api';

export default function SimulationSettingsModal({ 
  onClose, 
  junctions = [], 
  onStepTriggered,
  onIncidentInjected
}) {
  const [isRunning, setIsRunning] = useState(true);
  const [intervalSec, setIntervalSec] = useState(4.0);
  const [selectedJunction, setSelectedJunction] = useState('J-03');
  const [incidentType, setIncidentType] = useState('gridlock');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const incidentOptions = [
    { id: 'gridlock', label: 'Severe Multi-Vehicle Gridlock', desc: 'Density 94%, speed collapses to 6 km/h with 245s delay.' },
    { id: 'ghost_block', label: 'Stalled Freight / Ghost Obstruction', desc: 'Low vehicle count (16) but extreme waiting delay (260s).' },
    { id: 'surge', label: 'Major Stadium Egress Surge', desc: 'Vehicle count spikes to 195, pushing corridor over 180% capacity.' },
    { id: 'saturation', label: 'Arterial Peak Squeeze', desc: 'Moderate density saturation with queue spillback.' },
  ];

  const handleToggleRunning = async () => {
    try {
      const next = !isRunning;
      setIsRunning(next);
      await updateSimulationConfig(next, intervalSec);
      setStatusMsg(next ? 'Autonomous simulation resumed.' : 'Autonomous simulation paused.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeedChange = async (sec) => {
    try {
      setIntervalSec(sec);
      await updateSimulationConfig(isRunning, sec);
      setStatusMsg(`Telemetry polling interval set to ${sec}s.`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualStep = async () => {
    setLoading(true);
    try {
      await triggerSimulationStep();
      if (onStepTriggered) onStepTriggered();
      setStatusMsg('Advanced simulation clock by 1 tick.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInject = async () => {
    setLoading(true);
    try {
      await injectIncident(selectedJunction, incidentType);
      if (onIncidentInjected) onIncidentInjected(selectedJunction, incidentType);
      setStatusMsg(`Injected ${incidentType} at Junction ${selectedJunction}! Isolation Forest is processing...`);
      setTimeout(() => setStatusMsg(''), 4500);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0B1224] rounded-2xl border border-cyan-500/40 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-900/40 bg-midnight-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-cyan-400 border border-blue-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Simulation Engine & Incident Injector
              </h3>
              <p className="text-xs text-slate-400">
                Control simulation dynamics and test AI detection in real time
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
        <div className="p-5 space-y-6 overflow-y-auto">
          {statusMsg && (
            <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Section 1: Simulation Run Controls */}
          <div>
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-3">
              1. Simulation Loop State & Polling Frequency
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Play / Pause Toggle */}
              <button
                onClick={handleToggleRunning}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  isRunning 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isRunning ? <Play className="w-4 h-4 fill-emerald-400" /> : <Pause className="w-4 h-4 fill-amber-400" />}
                  <span className="text-xs font-semibold">{isRunning ? 'Running Live' : 'Simulation Paused'}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40">
                  {isRunning ? 'CLICK TO PAUSE' : 'CLICK TO RESUME'}
                </span>
              </button>

              {/* Manual Step */}
              <button
                onClick={handleManualStep}
                disabled={loading}
                className="p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-cyan-300 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  <span className="text-xs font-semibold">Advance Single Step</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300">
                  +1 TICK
                </span>
              </button>
            </div>

            {/* Speed Selector */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Loop Frequency:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { sec: 2.0, label: 'Fast (2s)' },
                  { sec: 4.0, label: 'Normal (4s)' },
                  { sec: 8.0, label: 'Slow (8s)' },
                ].map(spd => (
                  <button
                    key={spd.sec}
                    onClick={() => handleSpeedChange(spd.sec)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                      intervalSec === spd.sec 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'bg-midnight-900 text-slate-400 hover:text-white border border-blue-900/40'
                    }`}
                  >
                    {spd.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Incident Injection for Project Judging & Review */}
          <div className="pt-4 border-t border-blue-900/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>2. Live Anomaly Incident Injector</span>
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Evaluation Tool
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select a junction and incident pattern to trigger a severe perturbation. Watch the Isolation Forest model flag it immediately and dispatch critical alerts!
            </p>

            {/* Target Junction Selector */}
            <div className="mb-3">
              <label className="block text-[11px] font-mono text-slate-400 mb-1">TARGET JUNCTION:</label>
              <select
                value={selectedJunction}
                onChange={(e) => setSelectedJunction(e.target.value)}
                className="w-full px-3 py-2 bg-midnight-900 text-slate-200 text-xs rounded-xl border border-blue-900/60 focus:border-cyan-400 focus:outline-none font-mono"
              >
                {junctions.map(j => (
                  <option key={j.code} value={j.code}>
                    {j.code} — {j.name} ({j.zone})
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Type Radios */}
            <div className="space-y-2 mb-4">
              <label className="block text-[11px] font-mono text-slate-400">INCIDENT PATTERN:</label>
              {incidentOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setIncidentType(opt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    incidentType === opt.id
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-glow-rose/20'
                      : 'bg-midnight-900/60 border-blue-900/30 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="incident"
                    checked={incidentType === opt.id}
                    onChange={() => setIncidentType(opt.id)}
                    className="mt-0.5 text-rose-500 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-white font-['Outfit']">{opt.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inject Action Button */}
            <button
              onClick={handleInject}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-glow-rose transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Inject Incident & Trigger Anomaly Detector</span>
            </button>
          </div>

          {/* Academic Transparency Note */}
          <div className="p-3 rounded-xl bg-midnight-900/50 border border-blue-900/20 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              All generated vehicles, speeds, and queues are simulated based on Greenshields macroscopic traffic flow theory and diurnal curve equations.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-blue-900/40 bg-midnight-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-midnight-900 text-slate-300 hover:text-white border border-blue-900/50 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

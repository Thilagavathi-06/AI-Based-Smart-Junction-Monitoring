import React, { useState, useMemo } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Layers, 
  Eye, 
  EyeOff, 
  Activity, 
  Radio, 
  Car, 
  Gauge, 
  Clock, 
  ShieldAlert, 
  Video, 
  Zap, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function SmartCityMap({ 
  junctions = [], 
  onSelectJunction, 
  selectedJunction,
  onInspectDetail,
  onInjectIncident
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFlowAnimation, setShowFlowAnimation] = useState(true);
  const [showSpeedLabels, setShowSpeedLabels] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, congested, anomalies

  // Corridors connecting 4-way junctions
  const corridors = useMemo(() => [
    { from: 'J-07', to: 'J-02', name: 'North Express Highway', lanes: 8 },
    { from: 'J-07', to: 'J-01', name: 'University Radial Avenue', lanes: 4 },
    { from: 'J-02', to: 'J-01', name: 'Cyber Highway Connector', lanes: 6 },
    { from: 'J-02', to: 'J-08', name: 'Airport Outer Expressway', lanes: 8 },
    { from: 'J-03', to: 'J-01', name: 'Grand Central Corridor', lanes: 6 },
    { from: 'J-04', to: 'J-03', name: 'Innovation Way Link', lanes: 4 },
    { from: 'J-01', to: 'J-06', name: 'Downtown Central Arterial', lanes: 6 },
    { from: 'J-04', to: 'J-06', name: 'Tech Park Boulevard', lanes: 4 },
    { from: 'J-06', to: 'J-05', name: 'Harbor Access Corridor', lanes: 6 },
    { from: 'J-05', to: 'J-08', name: 'Logistics Ring Parkway', lanes: 6 },
  ], []);

  // Map junctions to quick lookup
  const junctionMap = useMemo(() => {
    const map = {};
    junctions.forEach(j => {
      map[j.code] = j;
    });
    return map;
  }, [junctions]);

  // Color helper based on congestion / density
  const getStatusColor = (status, density = 0) => {
    if (status === 'Critical' || density >= 85) return '#EF4444'; // Red
    if (status === 'Congested' || density >= 68) return '#F59E0B'; // Amber
    if (status === 'Moderate' || density >= 45) return '#EAB308'; // Yellow
    return '#22C55E'; // Green
  };

  const getStatusBadgeBg = (status) => {
    if (status === 'Critical') return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    if (status === 'Congested') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (status === 'Moderate') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  const handleResetZoom = () => setZoomLevel(1);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));

  // Determine current active junction in side-panel
  const activeJunction = selectedJunction || junctions[0] || null;

  return (
    <div className="glass-panel rounded-2xl border border-blue-900/40 overflow-hidden mb-6 relative">
      {/* Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0B1224]/90 border-b border-blue-900/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-cyan-400 border border-blue-500/30">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide font-['Outfit']">
              METROPOLITAN TRAFFIC GRID & CORRIDOR MAP
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive 4-Way Junctions & Dynamic Density Stream Visualization
            </p>
          </div>
        </div>

        {/* Map Filter & Display Toggles */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Quick Filter buttons */}
          <div className="flex items-center rounded-lg bg-midnight-900/90 p-0.5 border border-blue-900/40">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeFilter === 'all' 
                  ? 'bg-blue-600 text-white font-medium shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Grid
            </button>
            <button
              onClick={() => setActiveFilter('congested')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeFilter === 'congested' 
                  ? 'bg-amber-600 text-white font-medium shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Congested
            </button>
            <button
              onClick={() => setActiveFilter('anomalies')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeFilter === 'anomalies' 
                  ? 'bg-rose-600 text-white font-medium shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical
            </button>
          </div>

          {/* Toggle Flow Animation */}
          <button
            onClick={() => setShowFlowAnimation(!showFlowAnimation)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
              showFlowAnimation 
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' 
                : 'bg-midnight-900 text-slate-400 border-blue-900/40'
            }`}
            title="Toggle Traffic Flow Particles"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flow</span>
          </button>

          {/* Toggle Speed Labels */}
          <button
            onClick={() => setShowSpeedLabels(!showSpeedLabels)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
              showSpeedLabels 
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/40' 
                : 'bg-midnight-900 text-slate-400 border-blue-900/40'
            }`}
            title="Toggle Speed Limit Badges"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Speeds</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center rounded-lg bg-midnight-900 border border-blue-900/40 p-0.5">
            <button
              onClick={handleZoomOut}
              className="px-2 py-1 text-slate-400 hover:text-white transition"
              title="Zoom Out"
            >
              -
            </button>
            <span className="px-1.5 text-[10px] font-mono text-cyan-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="px-2 py-1 text-slate-400 hover:text-white transition"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-white transition border-l border-blue-900/40"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[480px]">
        {/* SVG Road Blueprint Canvas (3 cols) */}
        <div className="lg:col-span-3 relative bg-[#070B18] overflow-hidden p-2 flex items-center justify-center">
          {/* Subtle Grid Blueprint Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), radial-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px'
            }}
          />

          {/* SVG Map Container */}
          <div 
            className="w-full h-full transition-transform duration-300 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg 
              viewBox="0 0 1000 580" 
              className="w-full h-full min-h-[440px] max-h-[580px]"
              style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
            >
              <defs>
                {/* Glow Filter for critical hotspots */}
                <filter id="criticalGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Corridor Linear Gradients */}
                <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
              </defs>

              {/* City Districts Shapes (Aesthetic Smart City Blueprint) */}
              <g className="city-districts opacity-25">
                {/* Tech Sector Block */}
                <rect x="80" y="360" width="220" height="170" rx="12" fill="#0E2448" stroke="#1D4ED8" strokeWidth="1" strokeDasharray="4 4" />
                <text x="95" y="380" fill="#60A5FA" fontSize="10" fontFamily="monospace">ZONE 04: SILICON TECH PARK</text>

                {/* Central Commercial Core */}
                <rect x="340" y="220" width="280" height="180" rx="12" fill="#0D2140" stroke="#0284C7" strokeWidth="1" strokeDasharray="4 4" />
                <text x="355" y="240" fill="#38BDF8" fontSize="10" fontFamily="monospace">ZONE 01: DOWNTOWN METRO CORE</text>

                {/* Industrial Port Harbor */}
                <rect x="680" y="380" width="240" height="160" rx="12" fill="#132338" stroke="#0D9488" strokeWidth="1" strokeDasharray="4 4" />
                <text x="695" y="400" fill="#2DD4BF" fontSize="10" fontFamily="monospace">ZONE 05: LOGISTICS MARITIME PORT</text>

                {/* Airport Concourse */}
                <rect x="760" y="220" width="210" height="130" rx="12" fill="#1A1C3E" stroke="#6366F1" strokeWidth="1" strokeDasharray="4 4" />
                <text x="775" y="240" fill="#818CF8" fontSize="10" fontFamily="monospace">ZONE 08: AIRPORT CONCOURSE</text>

                {/* University District */}
                <rect x="280" y="40" width="240" height="120" rx="12" fill="#152835" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" />
                <text x="295" y="60" fill="#34D399" fontSize="10" fontFamily="monospace">ZONE 07: HEALTHCARE & CAMPUS</text>

                {/* North Highway Corridor */}
                <rect x="640" y="60" width="220" height="120" rx="12" fill="#1A2740" stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 4" />
                <text x="655" y="80" fill="#93C5FD" fontSize="10" fontFamily="monospace">ZONE 02: NORTH HIGHWAY GATEWAY</text>
              </g>

              {/* Road Corridors Base Lines */}
              <g className="corridors-base">
                {corridors.map((c, idx) => {
                  const jA = junctionMap[c.from];
                  const jB = junctionMap[c.to];
                  if (!jA || !jB) return null;

                  return (
                    <g key={`road-${idx}`}>
                      {/* Asphalt Road Bed */}
                      <line
                        x1={jA.grid_x}
                        y1={jA.grid_y}
                        x2={jB.grid_x}
                        y2={jB.grid_y}
                        stroke="#111827"
                        strokeWidth="24"
                        strokeLinecap="round"
                      />
                      {/* Road Surface */}
                      <line
                        x1={jA.grid_x}
                        y1={jA.grid_y}
                        x2={jB.grid_x}
                        y2={jB.grid_y}
                        stroke="#1E293B"
                        strokeWidth="18"
                        strokeLinecap="round"
                      />
                      {/* Center Lane Divider Marking */}
                      <line
                        x1={jA.grid_x}
                        y1={jA.grid_y}
                        x2={jB.grid_x}
                        y2={jB.grid_y}
                        stroke="#334155"
                        strokeWidth="2"
                        strokeDasharray="6 6"
                      />
                    </g>
                  );
                })}
              </g>

              {/* Dynamic Traffic Density & Animated Flow Overlays */}
              <g className="corridors-flow">
                {corridors.map((c, idx) => {
                  const jA = junctionMap[c.from];
                  const jB = junctionMap[c.to];
                  if (!jA || !jB) return null;

                  // Average density of the corridor
                  const densA = jA.telemetry?.density_pct || 30;
                  const densB = jB.telemetry?.density_pct || 30;
                  const avgDens = (densA + densB) / 2;

                  let corridorStatus = 'Normal';
                  if (avgDens >= 82) corridorStatus = 'Critical';
                  else if (avgDens >= 65) corridorStatus = 'Congested';
                  else if (avgDens >= 45) corridorStatus = 'Moderate';

                  if (activeFilter === 'congested' && corridorStatus === 'Normal') return null;
                  if (activeFilter === 'anomalies' && corridorStatus !== 'Critical') return null;

                  const color = getStatusColor(corridorStatus, avgDens);
                  const strokeWidth = avgDens > 80 ? 8 : avgDens > 60 ? 6 : 4;

                  return (
                    <g key={`flow-${idx}`}>
                      {/* Ambient density glow */}
                      <line
                        x1={jA.grid_x}
                        y1={jA.grid_y}
                        x2={jB.grid_x}
                        y2={jB.grid_y}
                        stroke={color}
                        strokeWidth={strokeWidth + 4}
                        strokeOpacity="0.25"
                        strokeLinecap="round"
                      />
                      {/* Dynamic Flowing Particles Line */}
                      <line
                        x1={jA.grid_x}
                        y1={jA.grid_y}
                        x2={jB.grid_x}
                        y2={jB.grid_y}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeOpacity="0.9"
                        strokeLinecap="round"
                        className={showFlowAnimation ? (
                          corridorStatus === 'Critical' 
                            ? 'animate-traffic-stream-slow' 
                            : corridorStatus === 'Congested' 
                              ? 'animate-traffic-stream' 
                              : 'animate-traffic-stream-fast'
                        ) : ''}
                      />
                    </g>
                  );
                })}
              </g>

              {/* 4-Way Junction Nodes (Clickable markers) */}
              <g className="junction-nodes">
                {junctions.map((j) => {
                  const isSelected = activeJunction?.code === j.code;
                  const color = getStatusColor(j.status, j.telemetry?.density_pct);
                  const isCritical = j.status === 'Critical' || (j.telemetry?.density_pct || 0) >= 85;

                  if (activeFilter === 'congested' && j.status === 'Normal') return null;
                  if (activeFilter === 'anomalies' && j.status !== 'Critical') return null;

                  return (
                    <g
                      key={j.code}
                      onClick={() => onSelectJunction(j)}
                      className="cursor-pointer transition-transform duration-200 hover:scale-110"
                      style={{ transformOrigin: `${j.grid_x}px ${j.grid_y}px` }}
                    >
                      {/* Critical Anomaly Pulsing Radar Halo */}
                      {isCritical && (
                        <circle
                          cx={j.grid_x}
                          cy={j.grid_y}
                          r="34"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="2"
                          className="radar-sweep"
                          filter="url(#criticalGlow)"
                        />
                      )}

                      {/* Selected halo */}
                      {isSelected && (
                        <circle
                          cx={j.grid_x}
                          cy={j.grid_y}
                          r="28"
                          fill="none"
                          stroke="#22D3EE"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          className="animate-spin"
                          style={{ animationDuration: '6s' }}
                        />
                      )}

                      {/* 4-Way Cross Intersection Base Plate */}
                      <rect
                        x={j.grid_x - 18}
                        y={j.grid_y - 18}
                        width="36"
                        height="36"
                        rx="6"
                        fill="#0F172A"
                        stroke={isSelected ? '#22D3EE' : '#3B82F6'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                      />

                      {/* Cross pattern simulating 4-way intersection lanes */}
                      <line x1={j.grid_x - 12} y1={j.grid_y} x2={j.grid_x + 12} y2={j.grid_y} stroke="#334155" strokeWidth="3" />
                      <line x1={j.grid_x} y1={j.grid_y - 12} x2={j.grid_x} y2={j.grid_y + 12} stroke="#334155" strokeWidth="3" />

                      {/* Center Status Beacon LED */}
                      <circle
                        cx={j.grid_x}
                        cy={j.grid_y}
                        r="7"
                        fill={color}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />

                      {/* Junction Code Tag (Above) */}
                      <rect
                        x={j.grid_x - 28}
                        y={j.grid_y - 36}
                        width="56"
                        height="16"
                        rx="4"
                        fill="#0B1224"
                        stroke={color}
                        strokeWidth="1"
                        fillOpacity="0.9"
                      />
                      <text
                        x={j.grid_x}
                        y={j.grid_y - 24}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="'Outfit', sans-serif"
                      >
                        {j.code}
                      </text>

                      {/* Live Vehicle Count Badge (Below) */}
                      <rect
                        x={j.grid_x - 30}
                        y={j.grid_y + 22}
                        width="60"
                        height="15"
                        rx="3"
                        fill="#0B1224"
                        stroke="#1E293B"
                        strokeWidth="1"
                        fillOpacity="0.95"
                      />
                      <text
                        x={j.grid_x}
                        y={j.grid_y + 33}
                        textAnchor="middle"
                        fill={color}
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="monospace"
                      >
                        {j.telemetry?.vehicle_count || 0} veh
                      </text>

                      {/* Speed limit pill */}
                      {showSpeedLabels && (
                        <g>
                          <rect
                            x={j.grid_x + 22}
                            y={j.grid_y - 10}
                            width="28"
                            height="12"
                            rx="2"
                            fill="#0B1224"
                            stroke="#3B82F6"
                            strokeWidth="0.8"
                          />
                          <text
                            x={j.grid_x + 36}
                            y={j.grid_y - 1}
                            textAnchor="middle"
                            fill="#93C5FD"
                            fontSize="8"
                            fontFamily="monospace"
                          >
                            {j.speed_limit}k
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Map Overlay Tactical Legend */}
          <div className="absolute bottom-3 left-3 bg-[#0B1224]/90 backdrop-blur-md p-2.5 rounded-xl border border-blue-900/50 text-[10px] space-y-1.5 shadow-lg select-none">
            <div className="font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              TRAFFIC FLOW LEGEND
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Normal (&lt;45%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />
                <span>Moderate (45-65%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Congested (65-85%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 animate-pulse" />
                <span>Critical (&gt;85%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Junction Tactical Side Drawer (1 col) */}
        <div className="lg:col-span-1 bg-[#0B1224] border-t lg:border-t-0 lg:border-l border-blue-900/40 p-4 flex flex-col justify-between">
          {activeJunction ? (
            <div className="space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-600/20 text-cyan-300 border border-blue-500/30">
                    {activeJunction.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getStatusBadgeBg(activeJunction.status)}`}>
                    {activeJunction.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  {activeJunction.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeJunction.zone}
                </p>
              </div>

              {/* Simulated CCTV Camera Feed Preview */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-blue-900/50 aspect-video flex flex-col items-center justify-center group">
                {/* Scanline radar overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/10 pointer-events-none" />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-cyan-400 border border-cyan-500/30">
                  <Video className="w-3 h-3 text-cyan-400" />
                  <span>CAM-0{activeJunction.id} LIVE</span>
                </div>
                <div className="absolute top-2 right-2 text-[9px] font-mono text-rose-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  REC
                </div>

                {/* Road illustration in CCTV */}
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                  <div className="text-[11px] font-mono text-slate-400 mb-1">
                    Lane Crossroad Feed Telemetry
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-cyan-300">
                    <span>{activeJunction.lanes} Lanes</span>
                    <span>•</span>
                    <span>Limit: {activeJunction.speed_limit} km/h</span>
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] font-mono text-slate-400 bg-black/50 px-2 py-0.5 rounded">
                  <span>AI TRACKER: {activeJunction.telemetry?.vehicle_count || 0} OBJS</span>
                  <span>CONF: 99.2%</span>
                </div>
              </div>

              {/* Real-time Telemetry Metrics List */}
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-midnight-900/80 border border-blue-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Car className="w-4 h-4 text-cyan-400" />
                    <span>Vehicle Count</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-white">
                    {activeJunction.telemetry?.vehicle_count || 0}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-midnight-900/80 border border-blue-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Gauge className="w-4 h-4 text-blue-400" />
                    <span>Average Speed</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-white">
                    {activeJunction.telemetry?.avg_speed || 0} <span className="text-[10px] text-slate-400">km/h</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-midnight-900/80 border border-blue-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Traffic Density</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-white">
                      {activeJunction.telemetry?.density_pct || 0}%
                    </span>
                    <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, activeJunction.telemetry?.density_pct || 0)}%`,
                          backgroundColor: getStatusColor(activeJunction.status, activeJunction.telemetry?.density_pct)
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-midnight-900/80 border border-blue-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <span>Waiting Delay</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-white">
                    {activeJunction.telemetry?.waiting_time_sec || 0} <span className="text-[10px] text-slate-400">sec</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => onInspectDetail && onInspectDetail(activeJunction)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Historical Telemetry</span>
                </button>

                <button
                  onClick={() => onInjectIncident && onInjectIncident(activeJunction.code, 'gridlock')}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-midnight-900 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  <span>Inject Test Gridlock Surge</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
              <Radio className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs">Select any junction node on the map to inspect telemetry.</p>
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-blue-900/30 text-[10px] text-slate-500 text-center font-mono">
            COORDINATE GRID: WGS84 • SIMULATED SENSORS
          </div>
        </div>
      </div>
    </div>
  );
}

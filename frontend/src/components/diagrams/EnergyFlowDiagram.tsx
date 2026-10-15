import React from 'react';
import { Sun, Wind, BatteryCharging, Zap, Factory } from 'lucide-react';
import { EnergyCurrent } from '../../services/api';
import { motion } from 'framer-motion';

interface EnergyFlowDiagramProps {
  data: EnergyCurrent | null;
}

export const EnergyFlowDiagram: React.FC<EnergyFlowDiagramProps> = ({ data }) => {
  const solarKw = data?.solar_kw ?? 685.4;
  const windKw = data?.wind_kw ?? 412.0;
  const demandKw = data?.demand_kw ?? 850.2;
  const batSoc = data?.battery_soc_pct ?? 68.5;
  const batCharge = data?.battery_charge_kw ?? 150.0;
  const batDischarge = data?.battery_discharge_kw ?? 0.0;
  const gridExport = data?.grid_export_kw ?? 247.2;
  const gridImport = data?.grid_import_kw ?? 0.0;

  const isCharging = batCharge > 0;
  const isDischarging = batDischarge > 0;
  const isExporting = gridExport > 0;

  return (
    <div className="relative w-full h-[320px] bg-panel-2 rounded-lg border border-line p-4 flex flex-col justify-between overflow-hidden scada-grid-bg select-none shadow-xl">
      {/* Top Banner with Flow Legend */}
      <div className="flex items-center justify-between z-10 text-[11px] font-mono text-text-dim">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
          <span className="font-bold tracking-wider text-teal">LIVE SCADA BUS POWER FLOW</span>
        </span>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-amber rounded inline-block" /> Solar/Wind Generation
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-teal rounded inline-block" /> Storage Buffer
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-blue rounded inline-block" /> Grid / Facility Load
          </span>
        </div>
      </div>

      {/* SVG Canvas for Flow Lines & Animated Beams */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="gradSolar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb238" />
            <stop offset="100%" stopColor="#22e6c4" />
          </linearGradient>
          <linearGradient id="gradWind" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5fa8ff" />
            <stop offset="100%" stopColor="#22e6c4" />
          </linearGradient>
        </defs>

        {/* Solar to Central Bus Background path */}
        <path
          d="M 120 75 Q 260 75 380 160"
          fill="none"
          stroke="#ffb23822"
          strokeWidth="6"
        />
        {/* Solar to Central Bus Active animated beam */}
        <path
          d="M 120 75 Q 260 75 380 160"
          fill="none"
          stroke="#ffb238"
          strokeWidth="2.5"
          className="animate-flow-forward"
          style={{ filter: 'drop-shadow(0 0 6px #ffb238aa)' }}
        />

        {/* Wind to Central Bus Background path */}
        <path
          d="M 120 245 Q 260 245 380 160"
          fill="none"
          stroke="#5fa8ff22"
          strokeWidth="6"
        />
        {/* Wind to Central Bus Active animated beam */}
        <path
          d="M 120 245 Q 260 245 380 160"
          fill="none"
          stroke="#5fa8ff"
          strokeWidth="2.5"
          className="animate-flow-forward"
          style={{ filter: 'drop-shadow(0 0 6px #5fa8ffaa)' }}
        />

        {/* Central Bus to Battery Background path */}
        <path
          d="M 400 160 L 400 230"
          fill="none"
          stroke="#22e6c422"
          strokeWidth="6"
        />
        {/* Central Bus to Battery Active animated beam */}
        <path
          d="M 400 160 L 400 230"
          fill="none"
          stroke="#22e6c4"
          strokeWidth="3"
          className={isCharging ? 'animate-flow-fast' : isDischarging ? 'animate-flow-fast stroke-dasharray' : ''}
          style={{
            filter: 'drop-shadow(0 0 8px #22e6c4cc)',
            ...(isDischarging ? { animationDirection: 'reverse' } : {}),
          }}
        />

        {/* Central Bus to Facility Load Background path */}
        <path
          d="M 420 160 Q 540 160 680 75"
          fill="none"
          stroke="#5fa8ff22"
          strokeWidth="6"
        />
        {/* Central Bus to Facility Load Active animated beam */}
        <path
          d="M 420 160 Q 540 160 680 75"
          fill="none"
          stroke="#5fa8ff"
          strokeWidth="2.5"
          className="animate-flow-forward"
          style={{ filter: 'drop-shadow(0 0 6px #5fa8ffaa)' }}
        />

        {/* Central Bus to Grid Interconnect Background path */}
        <path
          d="M 420 160 Q 540 160 680 245"
          fill="none"
          stroke={isExporting ? '#63d98a22' : '#ff6b5e22'}
          strokeWidth="6"
        />
        {/* Central Bus to Grid Interconnect Active animated beam */}
        <path
          d="M 420 160 Q 540 160 680 245"
          fill="none"
          stroke={isExporting ? '#63d98a' : '#ff6b5e'}
          strokeWidth="2.5"
          className="animate-flow-forward"
          style={{
            filter: `drop-shadow(0 0 6px ${isExporting ? '#63d98a' : '#ff6b5e'}aa)`,
            ...(!isExporting ? { animationDirection: 'reverse' } : {}),
          }}
        />
      </svg>

      {/* Interactive Animated Nodes Layer */}
      <div className="relative z-10 w-full h-full flex items-center justify-between px-2 sm:px-6">
        {/* Left: Generators */}
        <div className="flex flex-col justify-between h-[230px]">
          {/* Solar Node */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="scada-panel-nested p-2.5 w-32 border-amber/40 bg-panel shadow-glow-amber/30 flex items-center gap-2 cursor-pointer transition-shadow"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
              className="p-2 rounded bg-amber/15 text-amber shrink-0"
            >
              <Sun className="w-4 h-4" />
            </motion.div>
            <div>
              <p className="text-[10px] text-text-dim uppercase font-semibold">Solar Farm</p>
              <p className="font-mono text-xs font-bold text-amber">{solarKw.toFixed(1)} kW</p>
            </div>
          </motion.div>

          {/* Wind Node */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="scada-panel-nested p-2.5 w-32 border-blue/40 bg-panel shadow-glow-blue/30 flex items-center gap-2 cursor-pointer transition-shadow"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="p-2 rounded bg-blue/15 text-blue shrink-0"
            >
              <Wind className="w-4 h-4" />
            </motion.div>
            <div>
              <p className="text-[10px] text-text-dim uppercase font-semibold">Wind Turbine</p>
              <p className="font-mono text-xs font-bold text-blue">{windKw.toFixed(1)} kW</p>
            </div>
          </motion.div>
        </div>

        {/* Center: Inverter / Microgrid AC Bus & Battery below it */}
        <div className="flex flex-col items-center justify-between h-[250px]">
          {/* Central Bus */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="scada-panel-nested px-4 py-2 border-teal/60 bg-panel shadow-glow-teal/40 flex flex-col items-center cursor-pointer transition-shadow"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-teal animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal">
                MICROGRID BUS 400V
              </span>
            </div>
            <span className="font-mono text-[11px] text-text-main font-semibold mt-0.5">
              Net: {((solarKw + windKw) - demandKw).toFixed(1)} kW
            </span>
          </motion.div>

          {/* Battery Node */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="scada-panel-nested p-2.5 w-40 border-teal/50 bg-panel shadow-glow-teal/30 flex items-center gap-2.5 cursor-pointer transition-shadow"
          >
            <motion.div
              animate={isCharging ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="p-2 rounded bg-teal/15 text-teal shrink-0"
            >
              <BatteryCharging className="w-5 h-5 text-teal" />
            </motion.div>
            <div>
              <p className="text-[10px] text-text-dim uppercase font-semibold">BESS 2.5 MWh</p>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                <span className="text-teal">{batSoc.toFixed(1)}%</span>
                <span className="text-[10px] text-text-faint font-normal">
                  ({isCharging ? `+${batCharge.toFixed(0)} kW` : `-${batDischarge.toFixed(0)} kW`})
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Load & Grid */}
        <div className="flex flex-col justify-between h-[230px]">
          {/* Facility Load */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="scada-panel-nested p-2.5 w-36 border-line bg-panel flex items-center gap-2 cursor-pointer transition-shadow"
          >
            <div className="p-2 rounded bg-line text-text-dim shrink-0">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-text-dim uppercase font-semibold">Facility Load</p>
              <p className="font-mono text-xs font-bold text-text-main">{demandKw.toFixed(1)} kW</p>
            </div>
          </motion.div>

          {/* Grid Interconnect */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`scada-panel-nested p-2.5 w-36 bg-panel flex items-center gap-2 border cursor-pointer transition-shadow ${
              isExporting ? 'border-green/40 shadow-glow-green/30' : 'border-red/40 shadow-glow-red/30'
            }`}
          >
            <div
              className={`p-2 rounded shrink-0 ${
                isExporting ? 'bg-green/15 text-green' : 'bg-red/15 text-red'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-text-dim uppercase font-semibold">Main Grid</p>
              <p
                className={`font-mono text-xs font-bold ${
                  isExporting ? 'text-green' : 'text-red'
                }`}
              >
                {isExporting ? `Export: ${gridExport.toFixed(1)}` : `Import: ${gridImport.toFixed(1)}`}{' '}
                <span className="text-[9px] font-normal">kW</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

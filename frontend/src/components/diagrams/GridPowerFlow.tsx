import React from 'react';
import { GridStatus } from '../../services/api';
import { Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface GridPowerFlowProps {
  status: GridStatus | null;
}

export const GridPowerFlow: React.FC<GridPowerFlowProps> = ({ status }) => {
  const freq = status?.frequency_hz ?? 50.02;
  const voltage = status?.bus_voltage_v ?? 401.4;
  const pf = status?.power_factor ?? 0.98;
  const thd = status?.thd_pct ?? 1.8;
  const state = status?.grid_state ?? 'STABLE';

  const flow = status?.power_flow || {
    generation_to_bus_kw: 1097.4,
    bus_to_battery_kw: 150.0,
    battery_to_bus_kw: 0.0,
    bus_to_grid_kw: 247.2,
    grid_to_bus_kw: 0.0,
    bus_to_load_kw: 850.2,
  };

  const isExporting = flow.bus_to_grid_kw > flow.grid_to_bus_kw;

  return (
    <div className="p-4 bg-panel-2 rounded-lg border border-line flex flex-col gap-4 font-mono text-xs">
      {/* Top SCADA Single-Line Header */}
      <div className="flex items-center justify-between border-b border-line pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Zap className="w-4 h-4 text-teal" />
          </motion.div>
          <span className="font-semibold text-text-main uppercase">
            33kV / 400V Substation Single-Line Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-green/10 text-green border border-green/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            {state}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-line text-text-dim">
            Sync: IN-PHASE
          </span>
        </div>
      </div>

      {/* Grid Bus Bar & Schematic Elements */}
      <div className="relative py-6 px-4 bg-bg rounded border border-line/60 flex flex-col gap-6">
        {/* Bus Bar line with subtle shimmer glow */}
        <div className="relative h-2.5 bg-gradient-to-r from-amber via-teal to-blue rounded-full shadow-glow-teal/40">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-teal font-bold uppercase tracking-widest bg-panel px-2.5 py-0.5 border border-teal/40 rounded shadow-md">
            MAIN AC BUS 400V (3-PHASE 50Hz)
          </div>
        </div>

        {/* Drops / Feeders */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* Feeder 1: Renewables */}
          <motion.div whileHover={{ y: -3, scale: 1.02 }} className="scada-panel-nested p-2 flex flex-col items-center">
            <span className="text-[10px] text-text-dim">SOLAR + WIND</span>
            <span className="text-sm font-bold text-amber mt-0.5">
              +{flow.generation_to_bus_kw.toFixed(1)} kW
            </span>
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber transform rotate-90 my-1" />
            </motion.div>
            <span className="text-[9px] text-text-faint">Inverter 1 & 2</span>
          </motion.div>

          {/* Feeder 2: BESS */}
          <motion.div whileHover={{ y: -3, scale: 1.02 }} className="scada-panel-nested p-2 flex flex-col items-center">
            <span className="text-[10px] text-text-dim">BESS 2.5MWh</span>
            <span className="text-sm font-bold text-teal mt-0.5">
              {flow.bus_to_battery_kw > 0
                ? `-${flow.bus_to_battery_kw.toFixed(1)} kW`
                : `+${flow.battery_to_bus_kw.toFixed(1)} kW`}
            </span>
            <motion.div
              animate={{ y: flow.bus_to_battery_kw > 0 ? [-2, 2, -2] : [2, -2, 2] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ArrowRight
                className={`w-3.5 h-3.5 text-teal transform my-1 ${
                  flow.bus_to_battery_kw > 0 ? '-rotate-90' : 'rotate-90'
                }`}
              />
            </motion.div>
            <span className="text-[9px] text-text-faint">Bidirectional PCS</span>
          </motion.div>

          {/* Feeder 3: Substation Load */}
          <motion.div whileHover={{ y: -3, scale: 1.02 }} className="scada-panel-nested p-2 flex flex-col items-center">
            <span className="text-[10px] text-text-dim">FACILITY DEMAND</span>
            <span className="text-sm font-bold text-text-main mt-0.5">
              -{flow.bus_to_load_kw.toFixed(1)} kW
            </span>
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-3.5 h-3.5 text-text-dim transform rotate-90 my-1" />
            </motion.div>
            <span className="text-[9px] text-text-faint">Feeder breakers A-D</span>
          </motion.div>

          {/* Feeder 4: Utility Grid */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className={`scada-panel-nested p-2 flex flex-col items-center border-line ${
              isExporting ? 'border-green/40 shadow-glow-green/20' : 'border-red/40 shadow-glow-red/20'
            }`}
          >
            <span className="text-[10px] text-text-dim">33kV UTILITY</span>
            <span
              className={`text-sm font-bold mt-0.5 ${
                isExporting ? 'text-green' : 'text-red'
              }`}
            >
              {isExporting
                ? `+${flow.bus_to_grid_kw.toFixed(1)} kW (EXP)`
                : `-${flow.grid_to_bus_kw.toFixed(1)} kW (IMP)`}
            </span>
            <motion.div
              animate={{ y: isExporting ? [-2, 2, -2] : [2, -2, 2] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              {isExporting ? (
                <ArrowRight className="w-3.5 h-3.5 text-green transform -rotate-90 my-1" />
              ) : (
                <ArrowLeft className="w-3.5 h-3.5 text-red transform rotate-90 my-1" />
              )}
            </motion.div>
            <span className="text-[9px] text-text-faint">PCC Breaker CLOSED</span>
          </motion.div>
        </div>
      </div>

      {/* Grid Electrical Meters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-2.5">
          <span className="text-[10px] text-text-dim block">Grid Frequency</span>
          <span className="text-base font-bold text-green">{freq.toFixed(2)} Hz</span>
          <span className="text-[9px] text-text-faint block">Tol: 49.80 - 50.20 Hz</span>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-2.5">
          <span className="text-[10px] text-text-dim block">Bus RMS Voltage</span>
          <span className="text-base font-bold text-teal">{voltage.toFixed(1)} V</span>
          <span className="text-[9px] text-text-faint block">L-L nominal 400V</span>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-2.5">
          <span className="text-[10px] text-text-dim block">Power Factor (cos φ)</span>
          <span className="text-base font-bold text-blue">{pf.toFixed(3)}</span>
          <span className="text-[9px] text-text-faint block">Lagging (Cap Bank ON)</span>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-2.5">
          <span className="text-[10px] text-text-dim block">Voltage THD</span>
          <span className="text-base font-bold text-text-main">{thd.toFixed(1)}%</span>
          <span className="text-[9px] text-text-faint block">IEEE 519 standard &lt;5%</span>
        </motion.div>
      </div>
    </div>
  );
};

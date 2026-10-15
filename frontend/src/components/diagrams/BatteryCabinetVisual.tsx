import React from 'react';
import { BatteryStatus } from '../../services/api';
import { Thermometer, Zap, Activity, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface BatteryCabinetVisualProps {
  status: BatteryStatus | null;
}

export const BatteryCabinetVisual: React.FC<BatteryCabinetVisualProps> = ({ status }) => {
  const soc = status?.current_soc_pct ?? 68.5;
  const capacityKwh = status?.capacity_kwh ?? 2500;
  const storedKwh = status?.stored_kwh ?? (capacityKwh * soc) / 100;
  const tempC = status?.cell_temp_c ?? 24.8;
  const voltage = status?.voltage_v ?? 765.2;
  const current = status?.current_a ?? 196.0;
  const state = status?.status ?? 'CHARGING';
  const hours = status?.estimated_remaining_hours ?? 5.2;
  const soh = status?.state_of_health_pct ?? 98.4;

  // 16 modular rack trays
  const totalRacks = 16;
  const activeRacks = Math.round((soc / 100) * totalRacks);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6 p-4 bg-panel-2 rounded-lg border border-line">
      {/* Visual BESS Rack Cabinet */}
      <div className="relative w-48 h-80 bg-bg rounded-md border-2 border-line p-2 flex flex-col justify-between shadow-2xl shrink-0">
        {/* Top Cabinet Fan Vent */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-line bg-panel text-[9px] font-mono text-text-dim">
          <span>RACK #01</span>
          <span className="flex items-center gap-1 text-teal">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
            HV-ON
          </span>
        </div>

        {/* 16 Module Trays with Staggered Motion */}
        <div className="flex-1 my-1.5 flex flex-col justify-between gap-1">
          {Array.from({ length: totalRacks }).map((_, idx) => {
            const rackIndex = totalRacks - 1 - idx; // Top to bottom fill
            const isFilled = rackIndex < activeRacks;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.3 }}
                whileHover={{ scale: 1.03, x: 2 }}
                className={`h-3 rounded-sm flex items-center justify-between px-2 transition-all border ${
                  isFilled
                    ? 'bg-teal/25 border-teal/60 shadow-glow-teal/40'
                    : 'bg-panel border-line/40'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isFilled ? 'bg-teal' : 'bg-line'
                    }`}
                  />
                  <span className="text-[8px] font-mono text-text-faint">
                    MOD-{rackIndex + 1 < 10 ? `0${rackIndex + 1}` : rackIndex + 1}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isFilled ? 'bg-teal animate-pulse' : 'bg-line'
                    }`}
                  />
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isFilled ? 'bg-green' : 'bg-line'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Base / Inverter Connection */}
        <div className="pt-1.5 border-t border-line flex items-center justify-between text-[9px] font-mono text-text-dim">
          <span>BMS v3.4</span>
          <span className="text-amber font-bold animate-pulse">{state}</span>
        </div>
      </div>

      {/* Rack Telemetry Instruments & Metrics */}
      <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
        <motion.div whileHover={{ y: -2, scale: 1.02 }} className="scada-panel-nested p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-1">
            <Zap className="w-3.5 h-3.5 text-teal" />
            <span>State of Charge</span>
          </div>
          <p className="text-xl font-bold text-teal">{soc.toFixed(1)}%</p>
          <p className="text-[10px] text-text-dim mt-0.5">
            {storedKwh.toFixed(0)} / {capacityKwh.toFixed(0)} kWh
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.02 }} className="scada-panel-nested p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-1">
            <Thermometer className="w-3.5 h-3.5 text-amber" />
            <span>Cell Temperature</span>
          </div>
          <p className="text-xl font-bold text-amber">{tempC.toFixed(1)} °C</p>
          <p className="text-[10px] text-text-dim mt-0.5">Liquid HVAC: Normal</p>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.02 }} className="scada-panel-nested p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-1">
            <Clock className="w-3.5 h-3.5 text-blue" />
            <span>Est. Backup Hours</span>
          </div>
          <p className="text-xl font-bold text-blue">{hours.toFixed(1)} hrs</p>
          <p className="text-[10px] text-text-dim mt-0.5">At nominal draw</p>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.02 }} className="scada-panel-nested p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-1">
            <Activity className="w-3.5 h-3.5 text-text-dim" />
            <span>Bus Voltage</span>
          </div>
          <p className="text-lg font-bold text-text-main">{voltage.toFixed(1)} V</p>
          <p className="text-[10px] text-text-dim mt-0.5">DC Link: 750-800V</p>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.02 }} className="scada-panel-nested p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-1">
            <Activity className="w-3.5 h-3.5 text-text-dim" />
            <span>DC Current</span>
          </div>
          <p className="text-lg font-bold text-text-main">{current.toFixed(1)} A</p>
          <p className="text-[10px] text-text-dim mt-0.5">C-Rate: {(current / 300).toFixed(2)}C</p>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.02 }} className="scada-panel-nested p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-text-dim text-[11px] mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green" />
            <span>State of Health</span>
          </div>
          <p className="text-lg font-bold text-green">{soh.toFixed(1)}%</p>
          <p className="text-[10px] text-text-dim mt-0.5">Cycle: {status?.cycle_count ?? 342}</p>
        </motion.div>
      </div>
    </div>
  );
};

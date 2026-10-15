import React, { useEffect, useState } from 'react';
import { api, GridStatus } from '../services/api';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { GridPowerFlow } from '../components/diagrams/GridPowerFlow';
import { RadialGauge } from '../components/common/RadialGauge';
import { Zap, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

export const GridPage: React.FC = () => {
  const [gridStatus, setGridStatus] = useState<GridStatus | null>(null);

  useEffect(() => {
    const fetchGrid = async () => {
      try {
        const data = await api.getGridStatus();
        setGridStatus(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchGrid();
    const interval = setInterval(fetchGrid, 5000);
    return () => clearInterval(interval);
  }, []);

  // Synthetic 20-second historical frequency ticker
  const freqHistory = [
    { t: '11:59:40', freq: 50.01, volt: 400.8 },
    { t: '11:59:45', freq: 50.02, volt: 401.2 },
    { t: '11:59:50', freq: 50.00, volt: 401.0 },
    { t: '11:59:55', freq: 49.99, volt: 400.6 },
    { t: '12:00:00', freq: 50.03, volt: 401.5 },
    { t: '12:00:05', freq: 50.02, volt: 401.4 },
    { t: '12:00:10', freq: 50.01, volt: 401.1 },
    { t: '12:00:15', freq: 50.02, volt: 401.4 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal" />
            Grid Interconnect & Substation Telemetry
          </h2>
          <p className="text-xs text-text-dim mt-1">
            33kV / 400V Point of Common Coupling (PCC) synchronization and power quality monitoring
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="px-2 py-1 rounded bg-green/15 text-green border border-green/40 flex items-center gap-1.5 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-ping" />
            SYNC: LOCK (50.02 Hz)
          </motion.span>
          <span className="px-2 py-1 rounded bg-panel-2 text-text-dim border border-line">
            PCC: CLOSED
          </span>
        </div>
      </div>

      {/* Main Single-Line Diagram */}
      <ScadaPanel
        title="Microgrid Single-Line Power Flow"
        subtitle="Live bus bar feeder topology with real-time active power exchange"
        accentTop
      >
        <GridPowerFlow status={gridStatus} />
      </ScadaPanel>

      {/* Frequency & Voltage Real-Time Instruments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Frequency Instrument */}
        <ScadaPanel
          title="Grid Frequency Stability"
          subtitle="Nominal 50.00 Hz (Grid Code: ±0.20 Hz)"
        >
          <div className="flex flex-col items-center py-2">
            <RadialGauge
              value={gridStatus?.frequency_hz ?? 50.02}
              min={49.5}
              max={50.5}
              unit="Hz"
              size={130}
              color="green"
            />
            <div className="w-full mt-4 h-32 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={freqHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#233034" />
                  <XAxis dataKey="t" stroke="#8fa5ab" tick={{ fontSize: 9 }} />
                  <YAxis domain={[49.8, 50.2]} stroke="#8fa5ab" tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#10191c',
                      borderColor: '#233034',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="freq"
                    stroke="#63d98a"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScadaPanel>

        {/* Voltage Instrument */}
        <ScadaPanel
          title="Bus RMS Voltage"
          subtitle="Nominal 400V 3-Phase Line-to-Line"
        >
          <div className="flex flex-col items-center py-2">
            <RadialGauge
              value={gridStatus?.bus_voltage_v ?? 401.4}
              min={380}
              max={420}
              unit="V"
              size={130}
              color="teal"
            />
            <div className="w-full mt-4 h-32 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={freqHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#233034" />
                  <XAxis dataKey="t" stroke="#8fa5ab" tick={{ fontSize: 9 }} />
                  <YAxis domain={[395, 405]} stroke="#8fa5ab" tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#10191c',
                      borderColor: '#233034',
                      fontSize: '11px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="volt"
                    stroke="#22e6c4"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScadaPanel>

        {/* Protection & Harmonic Health Log */}
        <ScadaPanel
          title="Substation Protection Status"
          subtitle="IEC 61850 Relay Protection Matrix"
        >
          <div className="space-y-3 font-mono text-xs">
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Relay 50/51 (Overcurrent)</span>
              <span className="text-green font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ARMED
              </span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Relay 27/59 (Under/Over Voltage)</span>
              <span className="text-green font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ARMED
              </span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Relay 81 (Under/Over Frequency)</span>
              <span className="text-green font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ARMED
              </span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Anti-Islanding ROCOF</span>
              <span className="text-green font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
              </span>
            </motion.div>
            <div className="p-2.5 rounded bg-panel-2 border border-line text-[11px] text-text-dim">
              Power Factor: <span className="text-teal font-bold">{gridStatus?.power_factor?.toFixed(3) ?? '0.980'}</span> | THD: <span className="text-text-main font-bold">{gridStatus?.thd_pct?.toFixed(1) ?? '1.8'}%</span>
            </div>
          </div>
        </ScadaPanel>
      </div>
    </motion.div>
  );
};

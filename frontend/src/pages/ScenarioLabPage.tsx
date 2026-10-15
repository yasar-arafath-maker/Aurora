import React, { useState } from 'react';
import { api, ScenarioResult } from '../services/api';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { FlaskConical, Play, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const ScenarioLabPage: React.FC = () => {
  // Scenario Inputs
  const [cloudCoverPct, setCloudCoverPct] = useState<number>(65);
  const [windSpeedMs, setWindSpeedMs] = useState<number>(4.5);
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.2);
  const [irradianceMultiplier, setIrradianceMultiplier] = useState<number>(0.8);
  const [description, setDescription] = useState<string>('Overcast Sky & 20% Peak Demand Surge');

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation({
        cloud_cover_pct: cloudCoverPct,
        wind_speed_ms: windSpeedMs,
        demand_multiplier: demandMultiplier,
        irradiance_multiplier: irradianceMultiplier,
        description,
      });
      setResult(res);
    } catch (e) {
      console.error('Failed to run simulation:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (preset: string) => {
    if (preset === 'storm') {
      setCloudCoverPct(90);
      setWindSpeedMs(16.0);
      setDemandMultiplier(1.1);
      setIrradianceMultiplier(0.3);
      setDescription('High Wind Storm & Severe Cloud Darkness');
    } else if (preset === 'heatwave') {
      setCloudCoverPct(5);
      setWindSpeedMs(3.0);
      setDemandMultiplier(1.35);
      setIrradianceMultiplier(1.15);
      setDescription('Peak Summer Heatwave & AC Demand Surge');
    } else if (preset === 'winter_calm') {
      setCloudCoverPct(80);
      setWindSpeedMs(1.5);
      setDemandMultiplier(1.25);
      setIrradianceMultiplier(0.5);
      setDescription('Winter Dunkelflaute (Low Sun + Zero Wind)');
    }
  };

  const hourlyChartData = result?.hourly_comparison?.map((h) => ({
    hour: `${h.hour}:00`,
    'Baseline Gen': Math.round(h.baseline_generation_kw),
    'Scenario Gen': Math.round(h.scenario_generation_kw),
    'Baseline Demand': Math.round(h.baseline_demand_kw),
    'Scenario Demand': Math.round(h.scenario_demand_kw),
  })) || [];

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
            <FlaskConical className="w-5 h-5 text-teal" />
            What-If Scenario Simulation Laboratory
          </h2>
          <p className="text-xs text-text-dim mt-1">
            Simulate extreme meteorological & grid stress conditions without mutating live SCADA operational state
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="px-2 py-1 rounded bg-amber/15 text-amber border border-amber/40 shadow-sm flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            SANDBOX ENVIRONMENT
          </motion.span>
        </div>
      </div>

      {/* Preset Scenarios Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-text-dim">Control Room Presets:</span>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePreset('heatwave')}
          className="px-3 py-1 rounded bg-panel-2 border border-line hover:border-amber/60 text-xs font-mono text-text-main transition-colors shadow-sm"
        >
          Summer Heatwave (+35% Demand)
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePreset('storm')}
          className="px-3 py-1 rounded bg-panel-2 border border-line hover:border-blue/60 text-xs font-mono text-text-main transition-colors shadow-sm"
        >
          Gale Storm (High Wind, Low Sun)
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePreset('winter_calm')}
          className="px-3 py-1 rounded bg-panel-2 border border-line hover:border-red/60 text-xs font-mono text-text-main transition-colors shadow-sm"
        >
          Dunkelflaute (Zero Wind, Dense Cloud)
        </motion.button>
      </div>

      {/* Interactive Scenario Controls */}
      <ScadaPanel
        title="Simulation Parameter Adjusters"
        subtitle="Configure atmospheric and industrial variables to test battery resilience"
        accentTop
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          {/* Cloud Cover */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Cloud Cover</span>
              <span className="text-blue font-bold">{cloudCoverPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cloudCoverPct}
              onChange={(e) => setCloudCoverPct(Number(e.target.value))}
              className="w-full accent-blue cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">Direct solar attenuation</span>
          </motion.div>

          {/* Wind Speed */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Wind Speed</span>
              <span className="text-teal font-bold">{windSpeedMs.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={windSpeedMs}
              onChange={(e) => setWindSpeedMs(Number(e.target.value))}
              className="w-full accent-teal cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">Cubic power curve output</span>
          </motion.div>

          {/* Demand Multiplier */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Demand Factor</span>
              <span className="text-amber font-bold">{demandMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={demandMultiplier}
              onChange={(e) => setDemandMultiplier(Number(e.target.value))}
              className="w-full accent-amber cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">Industrial baseline scale</span>
          </motion.div>

          {/* Irradiance Multiplier */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Sun Intensity Factor</span>
              <span className="text-text-main font-bold">{irradianceMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={irradianceMultiplier}
              onChange={(e) => setIrradianceMultiplier(Number(e.target.value))}
              className="w-full accent-teal cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">POA scaling coefficient</span>
          </motion.div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-line">
          <div className="text-xs text-text-dim font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal" />
            <span>Active Test: {description}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded bg-teal text-bg font-bold font-mono text-xs hover:bg-teal/90 transition-all flex items-center justify-center gap-2 shadow-glow-teal uppercase tracking-wider disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-bg ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Running Simulation...' : 'Run Scenario Simulation'}</span>
          </motion.button>
        </div>
      </ScadaPanel>

      {/* Comparative Results Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Delta KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-amber/40 shadow-sm">
                <span className="text-[10px] text-text-dim block">SOLAR IMPACT</span>
                <p
                  className={`text-lg font-bold mt-1 ${
                    result.delta.solar_change_kwh < 0 ? 'text-red' : 'text-green'
                  }`}
                >
                  {result.delta.solar_change_kwh > 0 ? '+' : ''}
                  {result.delta.solar_change_kwh.toFixed(0)} kWh
                </p>
                <span className="text-[10px] text-text-dim">
                  Baseline: {result.baseline.solar_kwh.toFixed(0)} → Scen: {result.scenario.solar_kwh.toFixed(0)}
                </span>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-blue/40 shadow-sm">
                <span className="text-[10px] text-text-dim block">WIND IMPACT</span>
                <p
                  className={`text-lg font-bold mt-1 ${
                    result.delta.wind_change_kwh < 0 ? 'text-red' : 'text-green'
                  }`}
                >
                  {result.delta.wind_change_kwh > 0 ? '+' : ''}
                  {result.delta.wind_change_kwh.toFixed(0)} kWh
                </p>
                <span className="text-[10px] text-text-dim">
                  Baseline: {result.baseline.wind_kwh.toFixed(0)} → Scen: {result.scenario.wind_kwh.toFixed(0)}
                </span>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-line shadow-sm">
                <span className="text-[10px] text-text-dim block">DEMAND DELTA</span>
                <p
                  className={`text-lg font-bold mt-1 ${
                    result.delta.demand_change_kwh > 0 ? 'text-amber' : 'text-green'
                  }`}
                >
                  {result.delta.demand_change_kwh > 0 ? '+' : ''}
                  {result.delta.demand_change_kwh.toFixed(0)} kWh
                </p>
                <span className="text-[10px] text-text-dim">
                  Scale: {demandMultiplier.toFixed(2)}x
                </span>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-teal/50 glow-teal shadow-sm">
                <span className="text-[10px] text-text-dim block">REVISED STORAGE DECISION</span>
                <p className="text-lg font-bold text-teal mt-1">
                  {result.scenario.recommended_charge_kwh.toFixed(0)} kWh
                </p>
                <span className="text-[10px] text-teal">
                  Delta: {result.delta.charge_change_kwh > 0 ? '+' : ''}
                  {result.delta.charge_change_kwh.toFixed(0)} kWh
                </span>
              </motion.div>
            </div>

            {/* Baseline vs Scenario Hourly Curve Overlay Chart */}
            <ScadaPanel
              title="Baseline vs. Scenario 24h Hourly Overlay Chart"
              subtitle="Side-by-side power curves demonstrating grid deficit or unserved energy"
            >
              <div className="h-72 w-full mt-2 font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#233034" />
                    <XAxis dataKey="hour" stroke="#8fa5ab" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#8fa5ab" tick={{ fontSize: 10 }} unit=" kW" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#10191c',
                        borderColor: '#233034',
                        fontSize: '11px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Baseline Gen"
                      stroke="#22e6c4"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Scenario Gen"
                      stroke="#ff6b5e"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Baseline Demand"
                      stroke="#8fa5ab"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Scenario Demand"
                      stroke="#ffb238"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ScadaPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

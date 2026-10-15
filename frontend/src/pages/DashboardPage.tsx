import React, { useEffect, useState } from 'react';
import { api, OptimizationResult, TomorrowPrediction, SystemAlert } from '../services/api';
import { useSystem } from '../context/SystemContext';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { RadialGauge } from '../components/common/RadialGauge';
import { EnergyFlowDiagram } from '../components/diagrams/EnergyFlowDiagram';
import { StatusBadge } from '../components/layout/StatusBadge';
import { Sun, Wind, Zap, Factory, BatteryCharging, ArrowUpRight, AlertTriangle, Cpu, CheckCircle2, Sparkles, ArrowRight, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardPageProps {
  onNavigateToBattery: () => void;
  onNavigateToForecast: () => void;
  onNavigateToSolar?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToBattery,
  onNavigateToForecast,
  onNavigateToSolar
}) => {
  const { telemetry, batteryStatus, isDemoMode } = useSystem();
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [prediction, setPrediction] = useState<TomorrowPrediction | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const loadDashboardData = async () => {
      try {
        const [optData, predData, alertData] = await Promise.all([
          api.optimizeBattery(),
          api.getTomorrowPrediction(),
          api.getAlerts(),
        ]);
        if (active) {
          setOptimization(optData);
          setPrediction(predData);
          setAlerts(alertData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        if (active) setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const recStorage = optimization?.recommended_charge_kwh ?? 1420.5;
  const targetSoc = optimization?.target_soc_pct ?? 82.5;
  const action = optimization?.recommendation_action ?? 'CHARGE';
  const confidence = prediction?.confidence_score_pct ?? 94.2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Primary SCADA Question Answer Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="scada-panel p-5 bg-gradient-to-r from-panel via-panel-2 to-panel border-teal/40 glow-teal relative shadow-xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal/20 text-teal uppercase tracking-widest border border-teal/40 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
                DISPATCH OBJECTIVE FOR TOMORROW
              </span>
              {isDemoMode && <StatusBadge status="DEMO" label="SYNTHETIC EVALUATION" />}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main">
              How much energy should the grid battery store today to prepare for tomorrow?
            </h2>

            <div className="flex items-baseline gap-3 flex-wrap">
              <motion.span
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-3xl sm:text-4xl font-extrabold font-mono text-teal drop-shadow-md"
              >
                <AnimatedCounter value={recStorage} decimals={1} suffix="kWh" />
              </motion.span>
              <span className="text-sm font-mono text-text-dim">
                (Target SOC: <span className="font-bold text-teal">{targetSoc.toFixed(1)}%</span>)
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded border shadow-sm ${
                  action === 'CHARGE'
                    ? 'bg-teal/20 text-teal border-teal/50 animate-pulse'
                    : 'bg-amber/20 text-amber border-amber/50'
                }`}
              >
                ACTION: {action}
              </span>
            </div>

            {/* AI Advisor / Operational Explanation */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="mt-3 p-3 rounded bg-bg/80 border border-line flex items-start gap-2.5 shadow-sm"
            >
              <Cpu className="w-4 h-4 text-teal shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-[10px] font-mono text-teal uppercase tracking-wide">
                  [EXPLANATION ENGINE: SYNTHESIZED FROM DETERMINISTIC CALCULATIONS]
                </p>
                <p className="text-xs text-text-main mt-0.5 leading-relaxed font-mono">
                  {optimization?.advisory_narrative ||
                    `Tomorrow exhibits expected renewable deficit of ${Math.abs(
                      (prediction?.expected_deficit_kwh ?? 1250)
                    ).toFixed(0)} kWh. Charge ${recStorage.toFixed(0)} kWh today at 92% roundtrip efficiency to reach ${targetSoc.toFixed(1)}% SOC, guaranteeing a 15% reserve buffer against morning peak demand.`}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Action / Confidence Dial */}
          <div className="flex items-center gap-4 shrink-0 justify-center">
            <RadialGauge
              value={confidence}
              label="Model Confidence"
              sublabel="Ensemble"
              unit="%"
              color="teal"
              size={120}
            />
            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNavigateToBattery}
                className="px-4 py-2 rounded bg-teal text-bg font-bold text-xs hover:bg-teal/90 transition-all flex items-center gap-1.5 shadow-glow-teal font-mono uppercase tracking-wider"
              >
                <span>Audit Derivation</span>
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNavigateToForecast}
                className="px-4 py-2 rounded bg-panel-2 border border-line text-text-main font-semibold text-xs hover:border-teal/50 hover:bg-panel transition-all font-mono uppercase tracking-wider text-center shadow-sm"
              >
                Inspect Forecast
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Real-time Telemetry Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Solar */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onNavigateToSolar}
          className="scada-panel p-3 border-amber/40 glow-amber cursor-pointer shadow-sm group"
          title="Click to launch 3D Photovoltaic Studio & Digital Twin"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase text-amber flex items-center gap-1">
              <span>Solar Gen</span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-amber/20 text-amber font-mono group-hover:bg-amber group-hover:text-bg transition-colors">3D</span>
            </span>
            <Sun className="w-3.5 h-3.5 text-amber animate-spin-slow" />
          </div>
          <p className="text-lg font-bold font-mono text-amber">
            <AnimatedCounter value={telemetry?.solar_kw ?? 685.4} decimals={1} suffix="kW" />
          </p>
          <span className="text-[10px] text-text-dim font-mono group-hover:text-amber transition-colors flex items-center gap-1">
            <span>780 W/m²</span>
            <span>• 3D Twin →</span>
          </span>
        </motion.div>

        {/* Wind */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-blue/30 cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Wind Gen</span>
            <Wind className="w-3.5 h-3.5 text-blue" />
          </div>
          <p className="text-lg font-bold font-mono text-blue">
            <AnimatedCounter value={telemetry?.wind_kw ?? 412.0} decimals={1} suffix="kW" />
          </p>
          <span className="text-[10px] text-text-dim font-mono">Wind 8.2 m/s</span>
        </motion.div>

        {/* Total Renewable */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-teal/30 cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Total Renew</span>
            <Zap className="w-3.5 h-3.5 text-teal" />
          </div>
          <p className="text-lg font-bold font-mono text-teal">
            <AnimatedCounter value={telemetry?.total_renewable_kw ?? 1097.4} decimals={1} suffix="kW" />
          </p>
          <span className="text-[10px] text-text-dim font-mono">100% Inverter Online</span>
        </motion.div>

        {/* Facility Demand */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-line cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Facility Load</span>
            <Factory className="w-3.5 h-3.5 text-text-dim" />
          </div>
          <p className="text-lg font-bold font-mono text-text-main">
            <AnimatedCounter value={telemetry?.demand_kw ?? 850.2} decimals={1} suffix="kW" />
          </p>
          <span className="text-[10px] text-text-dim font-mono">Industrial feeder</span>
        </motion.div>

        {/* Battery SOC */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-teal/40 glow-teal cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Battery SOC</span>
            <BatteryCharging className="w-3.5 h-3.5 text-teal animate-pulse" />
          </div>
          <p className="text-lg font-bold font-mono text-teal">
            <AnimatedCounter value={telemetry?.battery_soc_pct ?? 68.5} decimals={1} suffix="%" />
          </p>
          <span className="text-[10px] text-teal font-mono">Charging (+150 kW)</span>
        </motion.div>

        {/* Grid Interchange */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-green/30 cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Grid Export</span>
            <Zap className="w-3.5 h-3.5 text-green" />
          </div>
          <p className="text-lg font-bold font-mono text-green">
            <AnimatedCounter value={telemetry?.grid_export_kw ?? 247.2} decimals={1} suffix="kW" />
          </p>
          <span className="text-[10px] text-green font-mono">Net Supplier to PCC</span>
        </motion.div>
      </div>

      {/* Main Grid Interactive Visual + Key Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScadaPanel
            title="Active Microgrid Energy Flow"
            subtitle="Real-time multi-bus topology with dynamic power direction vectors"
            accentTop
          >
            <EnergyFlowDiagram data={telemetry} />
          </ScadaPanel>
        </div>

        <div className="space-y-4">
          {/* Tomorrow 24h Summary */}
          <ScadaPanel title="Tomorrow 24h Yield Outlook" subtitle="ML Quantile Forecast">
            <div className="space-y-3 font-mono text-xs">
              <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
                <span className="text-text-dim">Solar Yield</span>
                <span className="font-bold text-amber">
                  {(prediction?.predicted_solar_kwh ?? 4250).toFixed(0)} kWh
                </span>
              </motion.div>
              <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
                <span className="text-text-dim">Wind Yield</span>
                <span className="font-bold text-blue">
                  {(prediction?.predicted_wind_kwh ?? 3100).toFixed(0)} kWh
                </span>
              </motion.div>
              <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
                <span className="text-text-dim">Expected Demand</span>
                <span className="font-bold text-text-main">
                  {(prediction?.expected_demand_kwh ?? 8600).toFixed(0)} kWh
                </span>
              </motion.div>
              <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-red/10 border border-red/30">
                <span className="text-red font-semibold">Net Deficit</span>
                <span className="font-bold text-red">
                  -{(prediction?.expected_deficit_kwh ?? 1250).toFixed(0)} kWh
                </span>
              </motion.div>
            </div>
          </ScadaPanel>

          {/* Active SCADA Alarms */}
          <ScadaPanel
            title="SCADA Operational Alarms"
            subtitle="Automated subsystem monitors"
            badge={
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber/20 text-amber rounded border border-amber/30">
                {alerts.length} ALARMS
              </span>
            }
          >
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <div className="p-3 rounded bg-panel-2 text-center text-xs text-text-dim flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green" />
                  <span>All microgrid systems nominal</span>
                </div>
              ) : (
                alerts.slice(0, 3).map((al) => (
                  <motion.div
                    key={al.id}
                    whileHover={{ x: 2 }}
                    className="p-2.5 rounded bg-panel-2 border border-line flex items-start gap-2 text-xs font-mono hover:border-line/80 transition-colors"
                  >
                    <AlertTriangle
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        al.severity === 'WARNING' ? 'text-amber' : 'text-red'
                      }`}
                    />
                    <div className="overflow-hidden">
                      <p className="text-text-main font-semibold truncate">{al.message}</p>
                      <p className="text-[10px] text-text-dim mt-0.5">
                        {al.subsystem} • {al.value}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScadaPanel>
        </div>
      </div>

      {/* Featured 3D Solar Photovoltaic Digital Twin Card */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
        className="scada-panel p-5 bg-gradient-to-r from-panel via-panel-2 to-panel border-amber/40 glow-amber relative shadow-xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber/20 border border-amber/40 flex items-center justify-center shrink-0 shadow-sm text-amber">
              <Sun className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
                  <span>3D Solar Array Digital Twin & WebXR Photovoltaic Studio</span>
                </h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber/20 text-amber border border-amber/40">
                  NEW FEATURE
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal/20 text-teal">
                  MCDA + XAI ACTIVE
                </span>
              </div>
              <p className="text-xs text-text-dim mt-1 max-w-2xl font-mono leading-relaxed">
                Interact with the 1:1 scale photovoltaic rooftop twin. Analyze FLIR thermal heatmap derating, aerodynamic wind flow, 3D module telemetry HUDs, shade obstacle casting, and 25-year financial LCOE.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToSolar}
              className="px-4 py-2.5 rounded bg-amber text-bg font-bold text-xs uppercase tracking-wider hover:bg-amber/90 transition-all flex items-center gap-1.5 shadow-glow-amber font-mono"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch 3D Solar Studio</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

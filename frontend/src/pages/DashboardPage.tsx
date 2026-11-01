import React, { useEffect, useState, useMemo } from 'react';
import { api, OptimizationResult, TomorrowPrediction, SystemAlert } from '../services/api';
import { useSystem } from '../context/SystemContext';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { RadialGauge } from '../components/common/RadialGauge';
import { EnergyFlowDiagram } from '../components/diagrams/EnergyFlowDiagram';
import { StatusBadge } from '../components/layout/StatusBadge';
import { LiveSpaceScanner } from '../components/scanner/LiveSpaceScanner';
import { MobileSolarApp } from '../components/mobile/MobileSolarApp';
import { sounds } from '../lib/soundEffects';
import {
  Sun,
  Zap,
  BatteryCharging,
  ArrowUpRight,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Camera,
  Sliders,
  DollarSign,
  Leaf,
  Clock,
  TrendingUp,
  RefreshCw,
  Eye,
  Wrench,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [error, setError] = useState<string | null>(null);

  // Dynamic Interactive Dashboard States
  const [timeHour, setTimeHour] = useState<number>(12); // 6 to 22 (12 PM default)
  const [systemSizeKw, setSystemSizeKw] = useState<number>(3.6); // default 3.6 kW
  const [batteryMode, setBatteryMode] = useState<'smart' | 'reserve' | 'export'>('smart');
  const [monthlyBill, setMonthlyBill] = useState<number>(3500); // in ₹
  const [showAdvancedScada, setShowAdvancedScada] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'fixes' | 'roi'>('overview');
  const [showMobileSimulator, setShowMobileSimulator] = useState<boolean>(false);

  // Scanner applied configuration
  const [scannedConfig, setScannedConfig] = useState<{
    spaceId: string;
    fixMethodId: string;
    capacityKw: number;
    monthlySavingsNum: number;
  } | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [optData, predData, alertData] = await Promise.all([
        api.optimizeBattery(),
        api.getTomorrowPrediction(),
        api.getAlerts()
      ]);
      setOptimization(optData);
      setPrediction(predData);
      setAlerts(alertData);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to connect to AURORA backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Dynamic Solar Calculations based on Time of Day slider & System Size
  const solarFactor = useMemo(() => {
    if (timeHour < 6 || timeHour > 18.5) return 0;
    // Normalized bell curve: peak at 12.5 PM
    const x = (timeHour - 6) / 12.5; // 0 to 1
    return Math.max(0, Math.sin(x * Math.PI));
  }, [timeHour]);

  const activeKwCapacity = scannedConfig ? scannedConfig.capacityKw : systemSizeKw;

  const dynamicSolarKw = Number((activeKwCapacity * solarFactor * 0.95).toFixed(2));
  const dynamicDemandKw = Number((1.2 + (timeHour >= 18 && timeHour <= 22 ? 1.5 : 0.4)).toFixed(2));

  // Dynamic Battery SOC & Flow
  const dynamicBatterySoc = useMemo(() => {
    if (batteryMode === 'reserve') return 85.0;
    // Charge during daytime sun, discharge in evening
    const baseSoc = 50 + solarFactor * 42 - (timeHour > 18 ? (timeHour - 18) * 8 : 0);
    return Math.min(100, Math.max(20, Number(baseSoc.toFixed(1))));
  }, [timeHour, solarFactor, batteryMode]);

  const dynamicGridExportKw = Number(
    Math.max(0, dynamicSolarKw - dynamicDemandKw - (dynamicBatterySoc < 90 ? 1.0 : 0)).toFixed(2)
  );

  // Financial calculations
  const unitRateRs = 8.5; // ₹ per kWh
  const todaySolarKwh = Number((activeKwCapacity * 4.6 * (timeHour / 18)).toFixed(1));
  const todaySavedRs = Math.round(todaySolarKwh * unitRateRs);
  const monthlySavingsEstRs = scannedConfig
    ? scannedConfig.monthlySavingsNum
    : Math.round(activeKwCapacity * 125 * unitRateRs);

  // 1-Tap Quick Optimization trigger
  const triggerOneTapOptimize = () => {
    sounds.playScanBeep();
    setIsOptimizing(true);
    setTimeout(() => {
      sounds.playSuccessChime();
      setIsOptimizing(false);
      setBatteryMode('smart');
    }, 1200);
  };

  const handleConfigAppliedFromScanner = (config: any) => {
    setScannedConfig(config);
    setSystemSizeKw(config.capacityKw);
    sounds.playSuccessChime();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Backend API Connection Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="scada-panel p-4 border-red-500/50 bg-red-950/30 flex items-center justify-between gap-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-xs font-mono font-bold text-red-300">Live Backend API Connection Notice</p>
              <p className="text-xs text-text-dim">{error}</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Retrying...' : 'Retry Connection'}</span>
          </button>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO STATUS & INTERACTIVE ACTION CONTROL BAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="scada-panel p-5 bg-gradient-to-r from-panel via-panel-2 to-panel border-teal/40 glow-teal relative shadow-xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal/20 text-teal uppercase tracking-widest border border-teal/40 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
                <span>DYNAMIC INTERACTIVE SOLAR DASHBOARD</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber/20 text-amber border border-amber/40">
                1-TAP SIMULATOR
              </span>
              {scannedConfig && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green/20 text-green border border-green/40">
                  SCAN APPLIED: {scannedConfig.capacityKw} kW
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-text-main flex items-center gap-2">
              <span>Smart Solar Power Station</span>
              <Sun className="w-6 h-6 text-amber animate-spin-slow inline-block" />
            </h1>

            <p className="text-xs sm:text-sm text-text-dim font-mono max-w-2xl leading-relaxed">
              Camera-ready solar fitting & dynamic power simulator. Move sliders to test sunlight, scan any place with your camera, and see short, simple fix guides!
            </p>
          </div>

          {/* Interactive Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Mobile App Mode: Now vs With Solar */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sounds.playClick(950);
                setShowMobileSimulator(true);
              }}
              className="px-4 py-2.5 rounded bg-gradient-to-r from-amber via-orange-500 to-amber text-slate-950 font-black font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber/30 transition-all border border-amber/70 animate-pulse"
            >
              <Smartphone className="w-4 h-4" />
              <span>📱 Mobile App (Now vs Solar)</span>
            </motion.button>

            {/* Open Camera Space Scanner Hero Button */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sounds.playScanBeep();
                setActiveTab('scanner');
              }}
              className="px-4 py-2.5 rounded bg-gradient-to-r from-teal to-emerald-400 text-bg font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow-teal transition-all"
            >
              <Camera className="w-4 h-4 animate-pulse" />
              <span>Scan Place with Camera</span>
            </motion.button>

            {/* 1-Tap Smart Optimize Button */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerOneTapOptimize}
              disabled={isOptimizing}
              className="px-3.5 py-2.5 rounded bg-panel-2 border border-teal/50 hover:border-teal text-text-main font-mono text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className={`w-4 h-4 text-teal ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Optimizing…' : '1-Tap Optimize'}</span>
            </motion.button>

            {/* 3D Photovoltaic Studio */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToSolar}
              className="px-3.5 py-2.5 rounded bg-panel-2 border border-line hover:border-amber/50 text-text-main font-mono text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-4 h-4 text-amber" />
              <span>3D Studio</span>
            </motion.button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            LIVE DYNAMIC SIMULATOR SLIDERS & CONTROLS
            ═════════════════════════════════════════════════════════════════════ */}
        <div className="mt-5 pt-4 border-t border-line/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
          {/* Slider 1: Interactive Time of Day / Sun Position */}
          <div className="p-3 rounded-lg bg-bg/70 border border-line space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-dim flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber" />
                <span>Time of Day:</span>
              </span>
              <span className="font-bold text-amber">
                {String(Math.floor(timeHour)).padStart(2, '0')}:
                {timeHour % 1 === 0 ? '00' : '30'}{' '}
                {timeHour < 12 ? 'AM' : timeHour === 12 ? 'PM' : 'PM'}
              </span>
            </div>

            <input
              type="range"
              min="6"
              max="22"
              step="0.5"
              value={timeHour}
              onChange={(e) => {
                sounds.playClick(400 + Number(e.target.value) * 20);
                setTimeHour(Number(e.target.value));
              }}
              className="w-full accent-amber h-1.5 bg-line rounded-lg cursor-pointer"
            />

            {/* Quick Time Presets */}
            <div className="flex items-center justify-between text-[10px] text-text-dim pt-0.5">
              <button
                onClick={() => {
                  sounds.playClick(500);
                  setTimeHour(7);
                }}
                className={`px-1.5 py-0.5 rounded hover:text-amber ${
                  timeHour === 7 ? 'text-amber font-bold bg-amber/10' : ''
                }`}
              >
                🌅 Dawn
              </button>
              <button
                onClick={() => {
                  sounds.playClick(700);
                  setTimeHour(12.5);
                }}
                className={`px-1.5 py-0.5 rounded hover:text-amber ${
                  timeHour === 12.5 ? 'text-amber font-bold bg-amber/10' : ''
                }`}
              >
                ☀️ Peak Noon
              </button>
              <button
                onClick={() => {
                  sounds.playClick(600);
                  setTimeHour(17);
                }}
                className={`px-1.5 py-0.5 rounded hover:text-amber ${
                  timeHour === 17 ? 'text-amber font-bold bg-amber/10' : ''
                }`}
              >
                🌇 Dusk
              </button>
              <button
                onClick={() => {
                  sounds.playClick(400);
                  setTimeHour(21);
                }}
                className={`px-1.5 py-0.5 rounded hover:text-amber ${
                  timeHour === 21 ? 'text-amber font-bold bg-amber/10' : ''
                }`}
              >
                🌙 Night
              </button>
            </div>
          </div>

          {/* Slider 2: Solar System Size (kW) */}
          <div className="p-3 rounded-lg bg-bg/70 border border-line space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-dim flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal" />
                <span>Solar Array Size:</span>
              </span>
              <span className="font-bold text-teal">{activeKwCapacity} kW</span>
            </div>

            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.2"
              value={activeKwCapacity}
              onChange={(e) => {
                sounds.playClick(600 + Number(e.target.value) * 30);
                setSystemSizeKw(Number(e.target.value));
              }}
              className="w-full accent-teal h-1.5 bg-line rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-text-dim pt-0.5">
              <span>Compact 1kW (Balcony)</span>
              <span>Home 3.6kW</span>
              <span>Villa 10kW</span>
            </div>
          </div>

          {/* Control 3: Battery Smart Modes */}
          <div className="p-3 rounded-lg bg-bg/70 border border-line space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-dim flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-green" />
                <span>Battery Dispatch Mode:</span>
              </span>
              <span className="font-bold text-green">{dynamicBatterySoc}% SOC</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              <button
                onClick={() => {
                  sounds.playClick(650);
                  setBatteryMode('smart');
                }}
                className={`py-1 rounded text-[10px] font-bold transition-all ${
                  batteryMode === 'smart'
                    ? 'bg-teal text-bg shadow-sm'
                    : 'bg-panel-2 border border-line text-text-dim hover:text-text-main'
                }`}
              >
                ⚡ Auto Eco
              </button>
              <button
                onClick={() => {
                  sounds.playClick(750);
                  setBatteryMode('reserve');
                }}
                className={`py-1 rounded text-[10px] font-bold transition-all ${
                  batteryMode === 'reserve'
                    ? 'bg-amber text-bg shadow-sm'
                    : 'bg-panel-2 border border-line text-text-dim hover:text-text-main'
                }`}
              >
                🛡 85% Reserve
              </button>
              <button
                onClick={() => {
                  sounds.playClick(850);
                  setBatteryMode('export');
                }}
                className={`py-1 rounded text-[10px] font-bold transition-all ${
                  batteryMode === 'export'
                    ? 'bg-green text-bg shadow-sm'
                    : 'bg-panel-2 border border-line text-text-dim hover:text-text-main'
                }`}
              >
                💰 Max Export
              </button>
            </div>

            <div className="text-[10px] text-text-dim text-center">
              {batteryMode === 'smart' && 'Balances home self-consumption & grid reserve'}
              {batteryMode === 'reserve' && 'Guarantees storm backup against power cut'}
              {batteryMode === 'export' && 'Exports surplus solar to grid for maximum revenue'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          4 CORE DYNAMIC REACTIVE STAT CARDS (CLEAN & SIMPLE)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Solar Power Now */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-4 border-amber/40 glow-amber relative shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between text-text-dim text-xs mb-1 font-mono">
            <span className="font-bold uppercase text-amber flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber animate-spin-slow" />
              <span>Solar Power Now</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/20 text-amber font-mono">
              {solarFactor > 0.6 ? 'HIGH' : solarFactor > 0.1 ? 'MODERATE' : 'NIGHT'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono text-amber">
              <AnimatedCounter value={dynamicSolarKw} decimals={2} suffix="kW" />
            </span>
          </div>

          <p className="text-[11px] text-text-dim font-mono mt-1 flex items-center justify-between">
            <span>Peak Irradiance: {Math.round(solarFactor * 940)} W/m²</span>
            <span className="text-amber">({Math.round(solarFactor * 100)}% Sun)</span>
          </p>
        </motion.div>

        {/* Card 2: Today's Financial Savings */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-4 border-green/40 glow-green relative shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between text-text-dim text-xs mb-1 font-mono">
            <span className="font-bold uppercase text-green flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-green" />
              <span>Today Saved</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green/20 text-green font-mono">
              {todaySolarKwh} kWh Gen
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono text-green">
              ₹<AnimatedCounter value={todaySavedRs} decimals={0} />
            </span>
            <span className="text-xs text-text-dim font-mono">
              (~₹{monthlySavingsEstRs.toLocaleString()}/mo)
            </span>
          </div>

          <p className="text-[11px] text-text-dim font-mono mt-1 flex items-center justify-between">
            <span>Tariff: ₹{unitRateRs}/unit</span>
            <span className="text-green font-semibold">Cuts bill by 82%</span>
          </p>
        </motion.div>

        {/* Card 3: Battery Energy Storage */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-4 border-teal/40 glow-teal relative shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between text-text-dim text-xs mb-1 font-mono">
            <span className="font-bold uppercase text-teal flex items-center gap-1.5">
              <BatteryCharging className="w-4 h-4 text-teal animate-pulse" />
              <span>Battery Energy</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal/20 text-teal font-mono">
              {dynamicSolarKw > dynamicDemandKw ? 'CHARGING' : 'STANDBY'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono text-teal">
              <AnimatedCounter value={dynamicBatterySoc} decimals={1} suffix="%" />
            </span>
            <span className="text-xs text-text-dim font-mono">
              ({((dynamicBatterySoc / 100) * 10).toFixed(1)} kWh)
            </span>
          </div>

          <p className="text-[11px] text-text-dim font-mono mt-1 flex items-center justify-between">
            <span>Backup runtime: ~6.5 hrs</span>
            <span className="text-teal font-semibold">98.4% Health</span>
          </p>
        </motion.div>

        {/* Card 4: Clean Carbon Offset */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-4 border-blue/40 glow-blue relative shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between text-text-dim text-xs mb-1 font-mono">
            <span className="font-bold uppercase text-blue flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-blue" />
              <span>Clean Green Index</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue/20 text-blue font-mono">
              NET ZERO
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono text-blue">
              <AnimatedCounter value={todaySolarKwh * 0.82} decimals={1} suffix="kg" />
            </span>
            <span className="text-xs text-text-dim font-mono">CO₂ avoided</span>
          </div>

          <p className="text-[11px] text-text-dim font-mono mt-1 flex items-center justify-between">
            <span>Trees Equivalent: {Math.max(1, Math.round(todaySolarKwh * 0.12))} 🌲</span>
            <span className="text-blue font-semibold">100% Inverter Online</span>
          </p>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          INTERACTIVE AI CAMERA SCANNER & FIX STUDIO SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal" />
            <h2 className="text-base sm:text-lg font-bold text-text-main font-mono">
              Live Camera Space Scanner & Fix Recommendations
            </h2>
          </div>
          <span className="text-[11px] font-mono text-teal bg-teal/10 px-2 py-0.5 rounded border border-teal/30">
            Open camera on any roof, balcony, wall or porch
          </span>
        </div>

        {/* Live Camera Space Scanner Component */}
        <LiveSpaceScanner onApplyConfig={handleConfigAppliedFromScanner} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SHORT & INTERACTIVE FIX METHODS COMPARISON STRIP
          ═══════════════════════════════════════════════════════════════════════ */}
      <ScadaPanel
        title="5 Effective Ways to Install Solar on Any Space"
        subtitle="Very short & interactive guide comparing structural fix types"
        accentTop
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Way 1: Optimal 28° Tilt */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="p-3.5 rounded-lg bg-panel-2 border border-line hover:border-amber/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
            onClick={() => sounds.playClick(600)}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">📐</span>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber/20 text-amber border border-amber/40">
                  MAX POWER
                </span>
              </div>
              <h4 className="font-bold text-xs text-text-main mt-2 group-hover:text-amber transition-colors">
                Optimal 28° South Tilt
              </h4>
              <p className="text-[11px] text-text-dim font-mono mt-1 leading-relaxed">
                Heavy triangular frame with concrete ballast blocks. Zero roof puncture, zero leaks!
              </p>
            </div>
            <div className="pt-2 border-t border-line/60 text-[10px] font-mono text-amber flex justify-between">
              <span>+28% Sun Power</span>
              <span>2-3 hrs fix</span>
            </div>
          </motion.div>

          {/* Way 2: Elevated Pergola */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="p-3.5 rounded-lg bg-panel-2 border border-line hover:border-teal/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
            onClick={() => sounds.playClick(700)}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">⛩️</span>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal/20 text-teal border border-teal/40">
                  100% USABLE
                </span>
              </div>
              <h4 className="font-bold text-xs text-text-main mt-2 group-hover:text-teal transition-colors">
                Elevated Pergola (8ft)
              </h4>
              <p className="text-[11px] text-text-dim font-mono mt-1 leading-relaxed">
                8ft tall columns. Walk, sit, and dry clothes in cool shade while generating power overhead!
              </p>
            </div>
            <div className="pt-2 border-t border-line/60 text-[10px] font-mono text-teal flex justify-between">
              <span>Terrace Gazebo</span>
              <span>1 Day fix</span>
            </div>
          </motion.div>

          {/* Way 3: Balcony Railing Hook */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="p-3.5 rounded-lg bg-panel-2 border border-line hover:border-green/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
            onClick={() => sounds.playClick(800)}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">🪝</span>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-green/20 text-green border border-green/40">
                  ZERO DRILL
                </span>
              </div>
              <h4 className="font-bold text-xs text-text-main mt-2 group-hover:text-green transition-colors">
                Balcony Hook & Plug
              </h4>
              <p className="text-[11px] text-text-dim font-mono mt-1 leading-relaxed">
                Hooks onto apartment balcony railing. Plugs into normal 16A wall plug. Perfect for tenants!
              </p>
            </div>
            <div className="pt-2 border-t border-line/60 text-[10px] font-mono text-green flex justify-between">
              <span>15 min DIY</span>
              <span>Plug & Play</span>
            </div>
          </motion.div>

          {/* Way 4: Flush Clamp Mount */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="p-3.5 rounded-lg bg-panel-2 border border-line hover:border-blue/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
            onClick={() => sounds.playClick(900)}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">🔩</span>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue/20 text-blue border border-blue/40">
                  STORM PROOF
                </span>
              </div>
              <h4 className="font-bold text-xs text-text-main mt-2 group-hover:text-blue transition-colors">
                Flush Seam Clamp
              </h4>
              <p className="text-[11px] text-text-dim font-mono mt-1 leading-relaxed">
                Clamps directly onto sloped tile/tin ridges. Low profile resists 180 km/h cyclone winds.
              </p>
            </div>
            <div className="pt-2 border-t border-line/60 text-[10px] font-mono text-blue flex justify-between">
              <span>Zero Leakage</span>
              <span>2 hrs fix</span>
            </div>
          </motion.div>

          {/* Way 5: Window Solar Awning */}
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            className="p-3.5 rounded-lg bg-panel-2 border border-line hover:border-amber/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
            onClick={() => sounds.playClick(1000)}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">🪟</span>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber/20 text-amber border border-amber/40">
                  AC COOLING
                </span>
              </div>
              <h4 className="font-bold text-xs text-text-main mt-2 group-hover:text-amber transition-colors">
                Window Awning Canopy
              </h4>
              <p className="text-[11px] text-text-dim font-mono mt-1 leading-relaxed">
                Mounted at 45° angle over sunny windows. Cuts room heat by 4°C while generating electricity!
              </p>
            </div>
            <div className="pt-2 border-t border-line/60 text-[10px] font-mono text-amber flex justify-between">
              <span>-30% AC Bill</span>
              <span>1 hr fix</span>
            </div>
          </motion.div>
        </div>
      </ScadaPanel>

      {/* ═══════════════════════════════════════════════════════════════════════
          OPTIONAL ADVANCED SCADA ENGINEERING VIEW (COLLAPSIBLE)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="scada-panel p-4 bg-panel border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal" />
            <h3 className="text-xs font-bold font-mono text-text-main uppercase tracking-wider">
              Advanced Grid Energy Flow & Subsystem Telemetry
            </h3>
          </div>

          <button
            onClick={() => {
              sounds.playClick(500);
              setShowAdvancedScada(!showAdvancedScada);
            }}
            className="px-3 py-1 rounded bg-panel-2 border border-line text-xs font-mono text-text-dim hover:text-text-main hover:border-teal/50 transition-colors flex items-center gap-1.5"
          >
            <span>{showAdvancedScada ? 'Hide Engineering View' : 'Show Engineering View'}</span>
            {showAdvancedScada ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <AnimatePresence>
          {showAdvancedScada && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-line space-y-4"
            >
              <EnergyFlowDiagram
                data={{
                  timestamp: new Date().toISOString(),
                  solar_kw: dynamicSolarKw,
                  wind_kw: telemetry?.wind_kw ?? 412.0,
                  total_renewable_kw: dynamicSolarKw + (telemetry?.wind_kw ?? 412.0),
                  demand_kw: dynamicDemandKw,
                  grid_import_kw: dynamicDemandKw > dynamicSolarKw ? dynamicDemandKw - dynamicSolarKw : 0,
                  grid_export_kw: dynamicGridExportKw,
                  battery_charge_kw: dynamicSolarKw > dynamicDemandKw ? 120.0 : 0,
                  battery_discharge_kw: dynamicSolarKw < dynamicDemandKw ? 100.0 : 0,
                  battery_soc_pct: dynamicBatterySoc,
                  net_load_kw: dynamicDemandKw - dynamicSolarKw
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-panel-2 border border-line flex items-center justify-between">
                  <span className="text-text-dim">Predicted Solar Yield Tomorrow:</span>
                  <span className="font-bold text-amber">
                    {(prediction?.predicted_solar_kwh ?? 4250).toFixed(0)} kWh
                  </span>
                </div>
                <div className="p-3 rounded bg-panel-2 border border-line flex items-center justify-between">
                  <span className="text-text-dim">Optimal Battery Dispatch Buffer:</span>
                  <span className="font-bold text-teal">
                    {(optimization?.recommended_charge_kwh ?? 1420.5).toFixed(0)} kWh
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          MOBILE APP (NOW VS WITH SOLAR) SIMULATOR POPUP MODAL
          ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showMobileSimulator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setShowMobileSimulator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <MobileSolarApp onClose={() => setShowMobileSimulator(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

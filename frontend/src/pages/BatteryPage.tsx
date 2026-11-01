import React, { useEffect, useState } from 'react';
import { api, BatteryStatus, OptimizationResult } from '../services/api';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { BatteryCabinetVisual } from '../components/diagrams/BatteryCabinetVisual';
import { FormulaCard } from '../components/common/FormulaCard';
import { BatteryCharging, RotateCcw, Cpu, TrendingUp, ShieldCheck, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const BatteryPage: React.FC = () => {
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [backtest, setBacktest] = useState<any>(null);
  const [mpcData, setMpcData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Disturbance Sliders for MPC Stress Testing
  const [cloudDropPct, setCloudDropPct] = useState<number>(45);
  const [demandSurgePct, setDemandSurgePct] = useState<number>(35);
  const [mpcLoading, setMpcLoading] = useState<boolean>(false);

  // Interactive Inputs
  const [demandKwh, setDemandKwh] = useState<number>(8600);
  const [generationKwh, setGenerationKwh] = useState<number>(7350);
  const [reservePct, setReservePct] = useState<number>(15);
  const [socOverride, setSocOverride] = useState<number>(68.5);
  const [capacityKwh, setCapacityKwh] = useState<number>(2500);

  const recomputeOptimization = async (
    customDemand = demandKwh,
    customGen = generationKwh,
    customReserve = reservePct,
    customSoc = socOverride,
    customCap = capacityKwh
  ) => {
    setLoading(true);
    try {
      const res = await api.optimizeBattery({
        custom_demand_kwh: customDemand,
        custom_generation_kwh: customGen,
        reserve_margin_pct: customReserve,
        current_soc_override: customSoc,
        battery_capacity_override: customCap,
      });
      setOptimization(res);
    } catch (e) {
      console.error('Failed to compute battery optimization:', e);
    } finally {
      setLoading(false);
    }
  };

  const runMpcSimulation = async (cloudDrop = cloudDropPct, surge = demandSurgePct) => {
    setMpcLoading(true);
    try {
      const res = await api.simulateMpc({
        cloud_drop_pct: cloudDrop / 100.0,
        demand_surge_pct: surge / 100.0,
        battery_capacity_kwh: capacityKwh,
        initial_soc_pct: socOverride / 100.0,
      });
      setMpcData(res);
    } catch (e) {
      console.error('Failed to run MPC simulation:', e);
    } finally {
      setMpcLoading(false);
    }
  };

  const initData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bat, opt, btest, mpcRes] = await Promise.all([
        api.getBatteryStatus(),
        api.optimizeBattery(),
        api.getBacktest().catch(() => null),
        api.simulateMpc({ cloud_drop_pct: 0.45, demand_surge_pct: 0.35 }).catch(() => null),
      ]);
      setBatteryStatus(bat);
      setOptimization(opt);
      setBacktest(btest);
      setMpcData(mpcRes);
      if (bat) {
        const rawSoc = (bat as any).current_soc_pct ?? ((bat as any).soc_pct ? (bat as any).soc_pct * 100 : 68.5);
        setSocOverride(rawSoc ?? 68.5);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to fetch BESS telemetry and optimization from backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleResetDefaults = () => {
    setDemandKwh(8600);
    setGenerationKwh(7350);
    setReservePct(15);
    setSocOverride(batteryStatus?.current_soc_pct ?? 68.5);
    setCapacityKwh(2500);
    recomputeOptimization(8600, 7350, 15, batteryStatus?.current_soc_pct ?? 68.5, 2500);
  };

  const recStorage = optimization?.recommended_charge_kwh ?? 1420.5;
  const targetSoc = optimization?.target_soc_pct ?? 82.5;
  const action = optimization?.recommendation_action ?? 'CHARGE';

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
            <BatteryCharging className="w-5 h-5 text-teal" />
            Grid Battery Storage & Deterministic Optimization
          </h2>
          <p className="text-xs text-text-dim mt-1">
            2.5 MWh LiFePO4 BESS with step-by-step physical limit derivations
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="px-2 py-1 rounded bg-teal/15 text-teal border border-teal/40 flex items-center gap-1.5 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
            Engine: DETERMINISTIC MATH
          </motion.span>
          <span className="px-2 py-1 rounded bg-panel-2 text-text-dim border border-line">
            Efficiency: 92.0%
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-12 scada-panel">
          <RefreshCw className="w-6 h-6 text-teal animate-spin mr-3" />
          <span className="font-mono text-sm text-text-dim">Retrieving live battery telemetry and solving LP dispatch optimization...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="scada-panel p-4 border-red/40 bg-red/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red" />
            <div>
              <p className="text-xs font-bold text-red font-mono">BESS Service Offline</p>
              <p className="text-[11px] text-text-dim">{error}</p>
            </div>
          </div>
          <button
            onClick={initData}
            className="px-3 py-1 rounded bg-panel-2 border border-line text-xs font-mono text-teal hover:border-teal/50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Physical SCADA Cabinet Visualization */}
      <ScadaPanel
        title="Physical BESS Substation Container RACK #01"
        subtitle="16 Modular LiFePO4 rack trays with cell temperature, DC link voltage, and current monitors"
        accentTop
      >
        <BatteryCabinetVisual status={batteryStatus} />
      </ScadaPanel>

      {/* Interactive Optimization Parameters Lab */}
      <ScadaPanel
        title="Optimization Derivation Parameter Controls"
        subtitle="Adjust expected conditions to observe immediate deterministic math recalculation"
        actions={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetDefaults}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-panel-2 border border-line text-[11px] font-mono text-text-dim hover:text-text-main hover:border-teal/50 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </motion.button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 font-mono text-xs">
          {/* Tomorrow Demand */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Tomorrow Demand</span>
              <span className="text-text-main font-bold">{demandKwh} kWh</span>
            </div>
            <input
              type="range"
              min="4000"
              max="15000"
              step="100"
              value={demandKwh}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDemandKwh(v);
                recomputeOptimization(v, generationKwh, reservePct, socOverride, capacityKwh);
              }}
              className="w-full accent-teal cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">Expected 24h consumption</span>
          </motion.div>

          {/* Tomorrow Generation */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Predicted Yield</span>
              <span className="text-amber font-bold">{generationKwh} kWh</span>
            </div>
            <input
              type="range"
              min="2000"
              max="15000"
              step="100"
              value={generationKwh}
              onChange={(e) => {
                const v = Number(e.target.value);
                setGenerationKwh(v);
                recomputeOptimization(demandKwh, v, reservePct, socOverride, capacityKwh);
              }}
              className="w-full accent-amber cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">Solar + Wind forecast</span>
          </motion.div>

          {/* Reserve Margin % */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Reserve Margin</span>
              <span className="text-blue font-bold">{reservePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={reservePct}
              onChange={(e) => {
                const v = Number(e.target.value);
                setReservePct(v);
                recomputeOptimization(demandKwh, generationKwh, v, socOverride, capacityKwh);
              }}
              className="w-full accent-blue cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">Emergency buffer percentage</span>
          </motion.div>

          {/* Current SOC % */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Current Battery SOC</span>
              <span className="text-teal font-bold">{socOverride?.toFixed(1) ?? '68.5'}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              step="0.5"
              value={socOverride ?? 68.5}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSocOverride(v);
                recomputeOptimization(demandKwh, generationKwh, reservePct, v, capacityKwh);
              }}
              className="w-full accent-teal cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">Starting baseline charge</span>
          </motion.div>

          {/* Battery Capacity */}
          <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3">
            <div className="flex items-center justify-between text-text-dim mb-1">
              <span>Total Capacity</span>
              <span className="text-text-main font-bold">{capacityKwh} kWh</span>
            </div>
            <input
              type="range"
              min="1000"
              max="5000"
              step="250"
              value={capacityKwh}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCapacityKwh(v);
                recomputeOptimization(demandKwh, generationKwh, reservePct, socOverride, v);
              }}
              className="w-full accent-teal cursor-pointer"
            />
            <span className="text-[10px] text-text-faint block mt-1">BESS rated energy size</span>
          </motion.div>
        </div>
      </ScadaPanel>

      {/* 4-Way Comparative Benchmark & HiGHS Mathematical Dispatch Replay */}
      {backtest && (
        <ScadaPanel
          title="HiGHS 24-Hour Multi-Period LP & Comparative Benchmark Harness"
          subtitle="Evaluates 4 engineering dispatch strategies on identical time-series under TNERC Indian C&I ToD Tariffs & Peak Demand Charges"
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green/15 text-green border border-green/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green" />
              HiGHS-LP OPTIMAL (SAVINGS: ₹{backtest.benchmark_summary?.savings_vs_nobattery_inr}/DAY)
            </span>
          }
        >
          {/* Summary KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="scada-panel-nested p-3 border-teal/30">
              <span className="text-[10px] text-text-dim block uppercase font-mono">Cost Saved vs No-Bat</span>
              <span className="text-lg font-bold text-teal font-mono">
                ₹{backtest.benchmark_summary?.savings_vs_nobattery_inr?.toLocaleString()}
              </span>
              <span className="text-[10px] text-green block font-mono mt-0.5">
                +{backtest.benchmark_summary?.savings_pct}% lower energy bill
              </span>
            </div>
            <div className="scada-panel-nested p-3 border-amber/30">
              <span className="text-[10px] text-text-dim block uppercase font-mono">Math LP vs Heuristic</span>
              <span className="text-lg font-bold text-amber font-mono">
                ₹{backtest.benchmark_summary?.savings_vs_heuristic_inr?.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-faint block font-mono mt-0.5">
                Value of HiGHS optimization
              </span>
            </div>
            <div className="scada-panel-nested p-3 border-blue/30">
              <span className="text-[10px] text-text-dim block uppercase font-mono">Peak Demand Cut</span>
              <span className="text-lg font-bold text-blue font-mono">
                {backtest.benchmark_summary?.peak_demand_reduction_kw} kW
              </span>
              <span className="text-[10px] text-text-faint block font-mono mt-0.5">
                TNERC demand charge clipping
              </span>
            </div>
            <div className="scada-panel-nested p-3 border-line">
              <span className="text-[10px] text-text-dim block uppercase font-mono">Optimality Gap (Regret)</span>
              <span className="text-lg font-bold text-text-main font-mono">
                ₹{backtest.benchmark_summary?.optimality_gap_inr?.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-faint block font-mono mt-0.5">
                Distance to perfect foresight
              </span>
            </div>
          </div>

          {/* 4-Strategy Benchmark Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left font-mono text-xs border border-line rounded">
              <thead className="bg-panel-2 text-text-dim border-b border-line text-[11px]">
                <tr>
                  <th className="p-2.5">Strategy</th>
                  <th className="p-2.5">Classification</th>
                  <th className="p-2.5 text-right">Daily Cost (₹)</th>
                  <th className="p-2.5 text-right">Peak Grid kW</th>
                  <th className="p-2.5 text-right">Net Savings (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {backtest.comparison_table?.map((row: any, idx: number) => {
                  const isOptimal = row.strategy.includes('HiGHS');
                  return (
                    <tr
                      key={idx}
                      className={
                        isOptimal
                          ? 'bg-teal/10 font-bold text-text-main border-l-2 border-l-teal'
                          : 'hover:bg-panel-2/50 text-text-dim'
                      }
                    >
                      <td className="p-2.5 text-text-main flex items-center gap-1.5">
                        {isOptimal && <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />}
                        {row.strategy}
                      </td>
                      <td className="p-2.5 text-[10px]">{row.classification}</td>
                      <td className="p-2.5 text-right font-mono">₹{row.total_cost_inr?.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono">{row.peak_grid_demand_kw} kW</td>
                      <td className="p-2.5 text-right font-mono text-green">
                        {row.savings_vs_nobat_inr > 0 ? `+₹${row.savings_vs_nobat_inr?.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 24-Hour Dispatch Area Chart */}
          <div className="scada-panel-nested p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-text-dim">
                HiGHS Optimal 24-Hour Dispatch Schedule (Charge vs Discharge vs Grid Import kW)
              </span>
              <span className="text-[10px] font-mono text-teal">
                Terminal SoC Invariant Enforced (E_24 ≥ E_0)
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={backtest.hourly_lp_schedule || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22e6c4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22e6c4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="disColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffb238" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ffb238" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gridColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5fa8ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5fa8ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit=" kW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b1320', borderColor: 'rgba(255,255,255,0.1)', fontSize: 11, fontFamily: 'monospace' }}
                    formatter={(val: any, name: any) => [`${val} kW`, name]}
                    labelFormatter={(h) => `Hour ${h}:00 (Tariff: ₹${backtest.hourly_lp_schedule?.[Number(h)]?.tariff_rate_inr}/kWh, Shadow: ₹${backtest.hourly_lp_schedule?.[Number(h)]?.shadow_price_inr})`}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="charge_kw" stroke="#22e6c4" fill="url(#chColor)" name="Charge kW (BESS In)" />
                  <Area type="monotone" dataKey="discharge_kw" stroke="#ffb238" fill="url(#disColor)" name="Discharge kW (Peak Out)" />
                  <Area type="monotone" dataKey="grid_import_kw" stroke="#5fa8ff" fill="url(#gridColor)" name="Grid Import kW" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScadaPanel>
      )}

      {/* 24-Hour Rolling-Horizon Model Predictive Control (MPC) Console */}
      {mpcData && (
        <ScadaPanel
          title="24-Hour Rolling-Horizon Model Predictive Control (MPC Console)"
          subtitle="Closed-loop receding horizon continuously re-solves HiGHS LP at each time step to absorb intra-day forecast drift"
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal/15 text-teal border border-teal/40 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-teal" />
              RECEDING MPC ACTIVE • SAVINGS: +₹{mpcData.kpi_comparison?.mpc_savings_over_static_inr}/DAY
            </span>
          }
        >
          {/* MPC KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="scada-panel-nested p-3 border-teal/40 glow-teal">
              <span className="text-[10px] text-text-dim block uppercase font-mono">MPC Closed-Loop Cost</span>
              <span className="text-lg font-bold text-teal font-mono">
                ₹{mpcData.kpi_comparison?.mpc_closedloop_cost_inr?.toLocaleString()}
              </span>
              <span className="text-[10px] text-green block font-mono mt-0.5">
                vs Static Plan: ₹{mpcData.kpi_comparison?.static_dayahead_cost_inr?.toLocaleString()}
              </span>
            </div>
            <div className="scada-panel-nested p-3 border-green/30">
              <span className="text-[10px] text-text-dim block uppercase font-mono">MPC Feedback Value</span>
              <span className="text-lg font-bold text-green font-mono">
                +₹{mpcData.kpi_comparison?.mpc_savings_over_static_inr?.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-faint block font-mono mt-0.5">
                +{mpcData.kpi_comparison?.savings_pct}% cheaper under disturbances
              </span>
            </div>
            <div className="scada-panel-nested p-3 border-amber/30">
              <span className="text-[10px] text-text-dim block uppercase font-mono">Peak Shaved by MPC</span>
              <span className="text-lg font-bold text-amber font-mono">
                {mpcData.kpi_comparison?.peak_shaved_by_mpc_kw} kW
              </span>
              <span className="text-[10px] text-text-faint block font-mono mt-0.5">
                {mpcData.kpi_comparison?.static_peak_grid_demand_kw} kW → {mpcData.kpi_comparison?.mpc_peak_grid_demand_kw} kW
              </span>
            </div>
            <div className="scada-panel-nested p-3 border-line">
              <span className="text-[10px] text-text-dim block uppercase font-mono">MPC Final SoC Asset</span>
              <span className="text-lg font-bold text-text-main font-mono">
                {mpcData.kpi_comparison?.mpc_final_soc_pct}%
              </span>
              <span className="text-[10px] text-teal block font-mono mt-0.5">
                vs Static: {mpcData.kpi_comparison?.static_final_soc_pct}% SoC
              </span>
            </div>
          </div>

          {/* Interactive Stress Disturbance Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-panel-2 rounded border border-line mb-4 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-text-dim">Cloud Drop (11:00-14:00):</span>
                <span className="text-amber font-bold">{cloudDropPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={cloudDropPct}
                onChange={(e) => setCloudDropPct(Number(e.target.value))}
                className="w-full accent-amber cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-text-dim">Evening Load Surge (18:00-20:00):</span>
                <span className="text-blue font-bold">+{demandSurgePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                step="5"
                value={demandSurgePct}
                onChange={(e) => setDemandSurgePct(Number(e.target.value))}
                className="w-full accent-blue cursor-pointer"
              />
            </div>
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => runMpcSimulation(cloudDropPct, demandSurgePct)}
                disabled={mpcLoading}
                className="w-full py-2 px-3 rounded bg-teal/15 hover:bg-teal/25 border border-teal/40 text-teal font-bold transition-all flex items-center justify-center gap-2"
              >
                {mpcLoading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {mpcLoading ? 'Re-solving MPC...' : 'Re-Run Receding MPC'}
              </motion.button>
            </div>
          </div>

          {/* Dynamic Re-dispatch Chart */}
          <div className="scada-panel-nested p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-text-dim">
                Dynamic Re-dispatch Response: Static Blind Import vs Closed-Loop MPC Grid Import (kW)
              </span>
              <span className="text-[10px] font-mono text-green">
                Peak Demand Shaved: {mpcData.kpi_comparison?.peak_shaved_by_mpc_kw} kW
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mpcData.hourly_mpc_trace || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mpcGridColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22e6c4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22e6c4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="staticGridColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit=" kW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b1320', borderColor: 'rgba(255,255,255,0.1)', fontSize: 11, fontFamily: 'monospace' }}
                    formatter={(val: any, name: any) => [`${val} kW`, name]}
                    labelFormatter={(h) => `Hour ${h}:00 (Tariff: ₹${mpcData.hourly_mpc_trace?.[Number(h)]?.tariff_rate_inr}/kWh)`}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="static_grid_import_kw" stroke="#ef4444" strokeDasharray="3 3" fill="url(#staticGridColor)" name="Static Plan Import (Unhedged Peak)" />
                  <Area type="monotone" dataKey="mpc_grid_import_kw" stroke="#22e6c4" fill="url(#mpcGridColor)" name="MPC Closed-Loop Import (Clipped Peak)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScadaPanel>
      )}

      {/* Step-by-Step Mathematical Derivation Trace */}
      <ScadaPanel
        title="Exact Algebraic Derivation Trace (Zero Black-Box Math)"
        subtitle="Every number displayed is a verifiable mathematical step from fundamental conservation of energy laws"
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal/15 text-teal border border-teal/40">
            {optimization?.derivation_trace?.length ?? 8} DERIVATION STEPS
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {optimization?.derivation_trace?.map((step) => (
            <FormulaCard
              key={step.step}
              step={step.step}
              formulaName={step.formula_name}
              equation={step.equation}
              substitution={step.substitution}
              result={step.result}
              notes={step.notes}
              isKeyResult={step.step === 5 || step.step === 7}
            />
          ))}
        </div>

        {/* Operational Advisor Banner */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="mt-4 p-3.5 rounded bg-panel-2 border border-teal/40 flex items-start gap-3 shadow-md"
        >
          <Cpu className="w-5 h-5 text-teal shrink-0 mt-0.5 animate-pulse" />
          <div className="font-mono text-xs">
            <span className="text-[10px] text-teal font-bold uppercase tracking-wider block">
              ADVISORY DIRECTIVE FOR CONTROL ROOM DISPATCH
            </span>
            <p className="text-text-main mt-1 leading-relaxed">
              {optimization?.advisory_narrative ||
                `Dispatch recommendation: ${action} ${recStorage.toFixed(
                  0
                )} kWh prior to tomorrow 06:00 to attain target SOC of ${targetSoc.toFixed(1)}%.`}
            </p>
          </div>
        </motion.div>
      </ScadaPanel>
    </motion.div>
  );
};

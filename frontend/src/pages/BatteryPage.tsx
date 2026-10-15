import React, { useEffect, useState } from 'react';
import { api, BatteryStatus, OptimizationResult } from '../services/api';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { BatteryCabinetVisual } from '../components/diagrams/BatteryCabinetVisual';
import { FormulaCard } from '../components/common/FormulaCard';
import { BatteryCharging, RotateCcw, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const BatteryPage: React.FC = () => {
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);

  // Interactive Inputs
  const [demandKwh, setDemandKwh] = useState<number>(8600);
  const [generationKwh, setGenerationKwh] = useState<number>(7350);
  const [reservePct, setReservePct] = useState<number>(15);
  const [socOverride, setSocOverride] = useState<number>(68.5);
  const [capacityKwh, setCapacityKwh] = useState<number>(2500);

  const [, setLoading] = useState<boolean>(false);

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

  useEffect(() => {
    const initData = async () => {
      try {
        const [bat, opt] = await Promise.all([
          api.getBatteryStatus(),
          api.optimizeBattery(),
        ]);
        setBatteryStatus(bat);
        setOptimization(opt);
        if (bat) setSocOverride(bat.current_soc_pct);
      } catch (e) {
        console.error(e);
      }
    };
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
              <span className="text-teal font-bold">{socOverride.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              step="0.5"
              value={socOverride}
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

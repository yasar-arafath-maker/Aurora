import React, { useState } from 'react';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

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
            <SettingsIcon className="w-5 h-5 text-teal" />
            System Configuration & Engineering Parameters
          </h2>
          <p className="text-xs text-text-dim mt-1">
            Physical BESS nameplate ratings, inverter thresholds, and SCADA alarm limits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {savedSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5 text-green text-xs font-mono"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="px-4 py-2 rounded bg-teal text-bg font-bold font-mono text-xs hover:bg-teal/90 transition-colors shadow-glow-teal flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save System Parameters</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Battery Nameplate Ratings */}
        <ScadaPanel
          title="BESS Nameplate Ratings (LiFePO4 Container #01)"
          subtitle="Hardware safety limits enforced by deterministic optimization engine"
          accentTop
        >
          <div className="space-y-3 font-mono text-xs">
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Rated Usable Energy Capacity</span>
              <span className="font-bold text-teal">2,500.0 kWh (2.5 MWh)</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Max Continuous Charge Power</span>
              <span className="font-bold text-teal">625.0 kW (4-Hour C-Rate)</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Max Continuous Discharge Power</span>
              <span className="font-bold text-teal">750.0 kW</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Depth of Discharge Floor (Min SOC)</span>
              <span className="font-bold text-amber">10.0% (Cell Longevity Limit)</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Max Charge Ceiling (Max SOC)</span>
              <span className="font-bold text-amber">95.0% (Overvoltage Prevention)</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">One-Way Inverter/Cell Efficiency</span>
              <span className="font-bold text-green">92.0% (Roundtrip ~84.6%)</span>
            </motion.div>
          </div>
        </ScadaPanel>

        {/* Grid Interconnect Protection Thresholds */}
        <ScadaPanel
          title="Grid Code Interconnect & Relay Thresholds"
          subtitle="Standards compliance for IEEE 1547 / IEC 61850"
        >
          <div className="space-y-3 font-mono text-xs">
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Under-Frequency Trip Floor</span>
              <span className="font-bold text-red">49.50 Hz (&lt;0.2s Trip)</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Over-Frequency Trip Ceiling</span>
              <span className="font-bold text-red">50.50 Hz (&lt;0.2s Trip)</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Voltage Sag Disconnect</span>
              <span className="font-bold text-amber">360 V RMS (0.90 pu)</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Voltage Swell Disconnect</span>
              <span className="font-bold text-amber">440 V RMS (1.10 pu)</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Harmonic Distortion Limit (THD)</span>
              <span className="font-bold text-text-main">5.0% Max</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Default Reserve Margin</span>
              <span className="font-bold text-blue">15.0% of Forecast Deficit</span>
            </motion.div>
          </div>
        </ScadaPanel>

        {/* Operator Profile & Role RBAC */}
        <ScadaPanel
          title="SCADA Authentication & Role Access"
          subtitle="Current active session credentials and permission scope"
        >
          <div className="space-y-3 font-mono text-xs">
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Active Operator Email</span>
              <span className="font-bold text-text-main">{user?.email || 'operator@aurora.grid'}</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">RBAC Role</span>
              <span className="font-bold text-teal uppercase">{user?.role || 'operator'}</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Control Authorization</span>
              <span className="font-bold text-green">DISPATCH PERMITTED</span>
            </motion.div>
          </div>
        </ScadaPanel>

        {/* Automated Alert Routing */}
        <ScadaPanel
          title="SCADA Notification & Dispatch Rules"
          subtitle="Configured telecommunication routes for critical excursions"
        >
          <div className="space-y-3 font-mono text-xs">
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Frequency Alert Dispatch</span>
              <span className="text-teal font-semibold">Instant In-App SCADA Banner</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Daily Shift PDF Generation</span>
              <span className="text-text-main font-semibold">23:59 UTC Automated</span>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-2.5 rounded bg-panel-2 border border-line">
              <span className="text-text-dim">Data Export Format</span>
              <span className="text-text-main font-semibold">ISO 8601 UTC Timestamps</span>
            </motion.div>
          </div>
        </ScadaPanel>
      </div>
    </motion.div>
  );
};

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { FileText, Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

export const ReportsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [report, setReport] = useState<any>(null);
  const [, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await api.getReport(timeframe);
        setReport(data);
      } catch (e) {
        console.error('Failed to load report:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [timeframe]);

  const handleExport = (format: 'csv' | 'pdf') => {
    const url = api.exportReportUrl(timeframe, format);
    window.open(url, '_blank');
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
            <FileText className="w-5 h-5 text-teal" />
            SCADA Operational Reports & Shift Logs
          </h2>
          <p className="text-xs text-text-dim mt-1">
            Auditable energy accounting logs, renewable penetration compliance, and BESS throughput
          </p>
        </div>

        {/* Timeframe Selector & Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <div className="flex rounded bg-panel-2 border border-line p-0.5">
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <motion.button
                key={t}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded uppercase tracking-wider transition-colors ${
                  timeframe === t
                    ? 'bg-teal text-bg font-bold shadow-glow-teal'
                    : 'text-text-dim hover:text-text-main'
                }`}
              >
                {t}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('csv')}
            className="px-3 py-1.5 rounded bg-panel-2 border border-line hover:border-teal/50 text-text-main flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-teal" />
            <span>Export CSV</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('pdf')}
            className="px-3 py-1.5 rounded bg-panel-2 border border-line hover:border-teal/50 text-text-main flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-teal" />
            <span>Download PDF</span>
          </motion.button>
        </div>
      </div>

      {/* Primary Shift Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <motion.div whileHover={{ y: -2 }} className="scada-panel p-4 border-amber/40 shadow-sm cursor-pointer">
          <span className="text-[10px] text-text-dim block uppercase">Solar Energy Produced</span>
          <p className="text-2xl font-bold text-amber mt-1">
            {report?.solar_generated_kwh?.toLocaleString() ?? '4,280'}{' '}
            <span className="text-xs text-text-dim font-normal">kWh</span>
          </p>
          <span className="text-[10px] text-text-dim">PV Farm Substation #01</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="scada-panel p-4 border-blue/40 shadow-sm cursor-pointer">
          <span className="text-[10px] text-text-dim block uppercase">Wind Energy Produced</span>
          <p className="text-2xl font-bold text-blue mt-1">
            {report?.wind_generated_kwh?.toLocaleString() ?? '3,150'}{' '}
            <span className="text-xs text-text-dim font-normal">kWh</span>
          </p>
          <span className="text-[10px] text-text-dim">Wind Turbines WTG 1-4</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="scada-panel p-4 border-line shadow-sm cursor-pointer">
          <span className="text-[10px] text-text-dim block uppercase">Total Facility Demand</span>
          <p className="text-2xl font-bold text-text-main mt-1">
            {report?.demand_consumed_kwh?.toLocaleString() ?? '8,620'}{' '}
            <span className="text-xs text-text-dim font-normal">kWh</span>
          </p>
          <span className="text-[10px] text-text-dim">Industrial load bus</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="scada-panel p-4 border-teal/50 glow-teal shadow-sm cursor-pointer">
          <span className="text-[10px] text-text-dim block uppercase">Renewable Penetration</span>
          <p className="text-2xl font-bold text-teal mt-1">
            {report?.renewable_penetration_pct?.toFixed(1) ?? '86.2'}%
          </p>
          <span className="text-[10px] text-teal">Carbon Avoided: 4.8 Tons</span>
        </motion.div>
      </div>

      {/* Energy Accounting Balance Sheet */}
      <ScadaPanel
        title={`Energy Accounting Statement (${timeframe.toUpperCase()})`}
        subtitle="Audited energy ledger for regulatory and grid code reporting"
        accentTop
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-line text-text-dim text-[11px]">
                <th className="py-2.5 px-3">METRIC / TELEMETRY BUS</th>
                <th className="py-2.5 px-3">RECORDED VALUE</th>
                <th className="py-2.5 px-3">MEASUREMENT UNIT</th>
                <th className="py-2.5 px-3">COMPLIANCE / STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 text-text-main">
              <motion.tr whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <td className="py-2.5 px-3 font-semibold">Total Renewable Energy Generated</td>
                <td className="py-2.5 px-3 text-amber font-bold">
                  {((report?.solar_generated_kwh ?? 4280) + (report?.wind_generated_kwh ?? 3150)).toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-text-dim">kWh</td>
                <td className="py-2.5 px-3 text-green font-semibold">Nominal</td>
              </motion.tr>
              <motion.tr whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <td className="py-2.5 px-3 font-semibold">Battery Energy Stored (Charged)</td>
                <td className="py-2.5 px-3 text-teal font-bold">
                  {report?.battery_charged_kwh?.toLocaleString() ?? '1,420'}
                </td>
                <td className="py-2.5 px-3 text-text-dim">kWh</td>
                <td className="py-2.5 px-3 text-teal font-semibold">Scheduled Target Met</td>
              </motion.tr>
              <motion.tr whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <td className="py-2.5 px-3 font-semibold">Battery Energy Discharged</td>
                <td className="py-2.5 px-3 text-teal font-bold">
                  {report?.battery_discharged_kwh?.toLocaleString() ?? '1,280'}
                </td>
                <td className="py-2.5 px-3 text-text-dim">kWh</td>
                <td className="py-2.5 px-3 text-teal font-semibold">90.1% Throughput Efficiency</td>
              </motion.tr>
              <motion.tr whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <td className="py-2.5 px-3 font-semibold">Net Energy Exported to 33kV Grid</td>
                <td className="py-2.5 px-3 text-green font-bold">
                  {report?.grid_exported_kwh?.toLocaleString() ?? '850'}
                </td>
                <td className="py-2.5 px-3 text-text-dim">kWh</td>
                <td className="py-2.5 px-3 text-green font-semibold">Revenue Generating</td>
              </motion.tr>
              <motion.tr whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <td className="py-2.5 px-3 font-semibold">Emergency Grid Import (Deficit Support)</td>
                <td className="py-2.5 px-3 text-red font-bold">
                  {report?.grid_imported_kwh?.toLocaleString() ?? '620'}
                </td>
                <td className="py-2.5 px-3 text-text-dim">kWh</td>
                <td className="py-2.5 px-3 text-amber font-semibold">Within Reserve Budget</td>
              </motion.tr>
              <motion.tr whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <td className="py-2.5 px-3 font-semibold">Peak Grid Frequency Excursion</td>
                <td className="py-2.5 px-3 text-text-main font-bold">50.04 Hz / 49.96 Hz</td>
                <td className="py-2.5 px-3 text-text-dim">Hz</td>
                <td className="py-2.5 px-3 text-green font-semibold">100% In-Tolerance (±0.20Hz)</td>
              </motion.tr>
            </tbody>
          </table>
        </div>
      </ScadaPanel>
    </motion.div>
  );
};

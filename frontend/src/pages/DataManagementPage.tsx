import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { UploadCloud, AlertTriangle, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DataManagementPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const res = await api.uploadCsv(file);
      setUploadResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'timestamp,solar_kw,wind_kw,demand_kw,temperature_c,cloud_cover_pct\n' +
      '2026-09-17T00:00:00Z,0.0,380.5,650.0,21.2,15\n' +
      '2026-09-17T06:00:00Z,120.4,410.2,780.0,22.5,20\n' +
      '2026-09-17T12:00:00Z,845.0,290.0,920.5,28.4,10\n' +
      '2026-09-17T18:00:00Z,85.2,460.8,840.0,25.1,35\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aurora_telemetry_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <FileSpreadsheet className="w-5 h-5 text-teal" />
            Data Management & Ingestion Pipeline
          </h2>
          <p className="text-xs text-text-dim mt-1">
            Ingest external meteorological and SCADA time-series for model retraining and validation
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownloadTemplate}
          className="px-3 py-1.5 rounded bg-panel-2 border border-line hover:border-teal/50 text-text-main font-mono text-xs flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-teal" />
          <span>Download Sample CSV Template</span>
        </motion.button>
      </div>

      {/* Upload Dropzone Panel */}
      <ScadaPanel
        title="CSV Time-Series File Ingestion"
        subtitle="Requires strict headers: timestamp, solar_kw, wind_kw, demand_kw, temperature_c, cloud_cover_pct"
        accentTop
      >
        <motion.div
          whileHover={{ borderColor: 'rgba(34, 230, 196, 0.6)' }}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-line rounded-lg bg-bg transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          >
            <UploadCloud className="w-12 h-12 text-teal mb-3" />
          </motion.div>

          <h4 className="text-sm font-semibold text-text-main">
            {file ? file.name : 'Select or drop CSV file here'}
          </h4>
          <p className="text-xs text-text-dim font-mono mt-1">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Comma-separated values (.csv)'}
          </p>

          <div className="flex items-center gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 rounded bg-panel-2 border border-line text-xs font-mono text-text-main hover:border-teal/50 transition-colors shadow-sm"
            >
              Browse Local File
            </motion.button>
            {file && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-1.5 rounded bg-teal text-bg font-bold font-mono text-xs hover:bg-teal/90 transition-colors shadow-glow-teal flex items-center gap-1.5 disabled:opacity-50"
              >
                {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{uploading ? 'Validating...' : 'Upload & Ingest'}</span>
              </motion.button>
            )}
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-2.5 rounded bg-red/15 border border-red/40 text-red text-xs font-mono flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </motion.div>
      </ScadaPanel>

      {/* Ingestion & Data Cleansing Summary */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ScadaPanel
              title="Ingestion Diagnostics & Schema Validation Summary"
              subtitle={`Successfully processed ${uploadResult.filename}`}
              badge={
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green/15 text-green border border-green/40 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                  SCHEMA VERIFIED
                </span>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs mb-4">
                <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3 shadow-sm">
                  <span className="text-text-dim text-[10px] block">TOTAL ROWS</span>
                  <span className="text-xl font-bold text-text-main">{uploadResult.total_rows}</span>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3 shadow-sm">
                  <span className="text-text-dim text-[10px] block">VALID DATA ROWS</span>
                  <span className="text-xl font-bold text-green">{uploadResult.valid_rows}</span>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3 shadow-sm">
                  <span className="text-text-dim text-[10px] block">MISSING CELLS FIXED</span>
                  <span className="text-xl font-bold text-amber">
                    {uploadResult.missing_values_count}
                  </span>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} className="scada-panel-nested p-3 shadow-sm">
                  <span className="text-text-dim text-[10px] block">AVG SOLAR LOAD</span>
                  <span className="text-xl font-bold text-teal">
                    {uploadResult.stats.solar_avg_kw} kW
                  </span>
                </motion.div>
              </div>

              {/* Sample Preview Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line text-text-dim text-[10px]">
                      <th className="py-2 px-2">TIMESTAMP</th>
                      <th className="py-2 px-2">SOLAR (kW)</th>
                      <th className="py-2 px-2">WIND (kW)</th>
                      <th className="py-2 px-2">DEMAND (kW)</th>
                      <th className="py-2 px-2">TEMP (°C)</th>
                      <th className="py-2 px-2">CLOUD (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40 text-text-main">
                    {uploadResult.sample_preview.map((row: any, idx: number) => (
                      <motion.tr
                        key={idx}
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                      >
                        <td className="py-1.5 px-2 text-text-dim">{row.timestamp}</td>
                        <td className="py-1.5 px-2 text-amber font-semibold">{row.solar_kw}</td>
                        <td className="py-1.5 px-2 text-blue font-semibold">{row.wind_kw}</td>
                        <td className="py-1.5 px-2">{row.demand_kw}</td>
                        <td className="py-1.5 px-2">{row.temperature_c}</td>
                        <td className="py-1.5 px-2">{row.cloud_cover_pct}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScadaPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

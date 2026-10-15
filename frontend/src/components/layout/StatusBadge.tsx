import React from 'react';
import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: 'ONLINE' | 'OFFLINE' | 'CHARGING' | 'DISCHARGING' | 'IDLE' | 'STABLE' | 'WARNING' | 'CRITICAL' | 'DEMO';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const config = {
    ONLINE: { bg: 'bg-teal/10', border: 'border-teal/30', text: 'text-teal', dot: 'bg-teal' },
    OFFLINE: { bg: 'bg-red/10', border: 'border-red/30', text: 'text-red', dot: 'bg-red' },
    CHARGING: { bg: 'bg-teal/15', border: 'border-teal/40', text: 'text-teal', dot: 'bg-teal animate-pulse' },
    DISCHARGING: { bg: 'bg-amber/15', border: 'border-amber/40', text: 'text-amber', dot: 'bg-amber animate-pulse' },
    IDLE: { bg: 'bg-line/40', border: 'border-line', text: 'text-text-dim', dot: 'bg-text-dim' },
    STABLE: { bg: 'bg-green/10', border: 'border-green/30', text: 'text-green', dot: 'bg-green' },
    WARNING: { bg: 'bg-amber/15', border: 'border-amber/40', text: 'text-amber', dot: 'bg-amber animate-ping' },
    CRITICAL: { bg: 'bg-red/15', border: 'border-red/40', text: 'text-red', dot: 'bg-red animate-ping' },
    DEMO: { bg: 'bg-amber/20', border: 'border-amber/50', text: 'text-amber font-bold', dot: 'bg-amber' },
  }[status] || { bg: 'bg-line', border: 'border-line', text: 'text-text-dim', dot: 'bg-text-dim' };

  const py = size === 'sm' ? 'py-0.5 px-2 text-[10px]' : 'py-1 px-2.5 text-xs';

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center gap-1.5 rounded font-mono font-medium border ${config.bg} ${config.border} ${config.text} ${py} tracking-wider uppercase select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label || status}
    </motion.span>
  );
};

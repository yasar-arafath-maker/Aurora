import React from 'react';
import { motion } from 'framer-motion';

interface ScadaPanelProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glow?: 'teal' | 'amber' | 'blue' | 'red' | 'green' | 'none';
  accentTop?: boolean;
}

export const ScadaPanel: React.FC<ScadaPanelProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
  glow = 'none',
  accentTop = false,
}) => {
  const glowClasses = {
    teal: 'glow-teal',
    amber: 'glow-amber',
    blue: 'glow-blue',
    red: 'glow-red',
    green: 'glow-green',
    none: '',
  }[glow];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`scada-panel p-4 sm:p-5 flex flex-col relative transition-shadow duration-200 overflow-hidden ${glowClasses} ${className}`}
    >
      {accentTop && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal via-blue to-teal opacity-80" />
      )}
      {(title || badge || actions) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-line gap-2 flex-wrap">
          <div>
            {title && (
              <h3 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-text-main flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal shadow-glow-teal animate-pulse" />
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-text-dim mt-0.5 font-mono">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {badge}
            {actions}
          </div>
        </div>
      )}
      <div className="flex-1">{children}</div>
    </motion.div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';

interface FormulaCardProps {
  step: number;
  formulaName: string;
  equation: string;
  substitution: string;
  result: string;
  notes?: string;
  isKeyResult?: boolean;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  step,
  formulaName,
  equation,
  substitution,
  result,
  notes,
  isKeyResult = false,
}) => {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`scada-panel-nested p-3.5 transition-all duration-150 ${
        isKeyResult ? 'border-teal/50 bg-teal/5 glow-teal shadow-glow-teal/20' : 'hover:border-line/80'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded flex items-center justify-center bg-line text-[11px] font-mono font-bold text-teal shadow-sm">
            {step}
          </span>
          <span className="text-xs font-semibold text-text-main tracking-wide uppercase font-mono">
            {formulaName}
          </span>
        </div>
        <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-panel border border-line text-teal shadow-inner">
          {result}
        </div>
      </div>

      <div className="space-y-1 font-mono text-[11px]">
        <div className="text-text-dim flex items-center gap-1 overflow-x-auto">
          <span className="text-text-faint select-none">eq:</span>
          <code className="text-amber/90">{equation}</code>
        </div>
        <div className="text-text-dim flex items-center gap-1 overflow-x-auto">
          <span className="text-text-faint select-none">sub:</span>
          <code className="text-blue/90">{substitution}</code>
        </div>
      </div>

      {notes && (
        <p className="text-[10px] text-text-faint mt-2 pt-1.5 border-t border-line/50 font-sans italic">
          {notes}
        </p>
      )}
    </motion.div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';

interface RadialGaugeProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  sublabel?: string;
  unit?: string;
  size?: number;
  color?: 'teal' | 'amber' | 'blue' | 'red' | 'green';
  thresholds?: { warn?: number; crit?: number };
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  min = 0,
  max = 100,
  label,
  sublabel,
  unit = '%',
  size = 140,
  color = 'teal',
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc angles: 240 degrees total (-210 deg to 30 deg)
  const angleRange = 240;
  const arcLength = circumference * (angleRange / 360);

  const clampedVal = Math.min(Math.max(value, min), max);
  const fraction = (clampedVal - min) / (max - min);
  const strokeDashoffset = arcLength - fraction * arcLength;

  const colorHex = {
    teal: '#22e6c4',
    amber: '#ffb238',
    blue: '#5fa8ff',
    red: '#ff6b5e',
    green: '#63d98a',
  }[color];

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-[210deg]"
        >
          {/* Track background arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1c282c"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active value arc with Framer Motion spring transition */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorHex}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${colorHex}66)`,
            }}
          />
        </svg>

        {/* Center Readout with subtle scale-in */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="text-2xl font-bold font-mono tracking-tight text-text-main">
            {typeof value === 'number' ? value.toFixed(1) : value}
            <span className="text-xs text-text-dim ml-0.5 font-normal">{unit}</span>
          </span>
          {sublabel && (
            <span className="text-[10px] text-text-dim uppercase font-mono tracking-wider">
              {sublabel}
            </span>
          )}
        </motion.div>
      </div>
      {label && (
        <span className="text-xs font-medium text-text-dim mt-1 text-center font-mono">{label}</span>
      )}
    </div>
  );
};

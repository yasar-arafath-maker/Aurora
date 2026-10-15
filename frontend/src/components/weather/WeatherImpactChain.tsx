import React from 'react';
import { Cloud, Sun, Zap, TrendingDown, BatteryCharging, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeatherImpactChainProps {
  cloudCoverPct: number;
  windSpeedMs: number;
  irradianceWm2: number;
  solarYieldKwh: number;
  expectedDeficitKwh: number;
  recommendedStorageKwh: number;
}

export const WeatherImpactChain: React.FC<WeatherImpactChainProps> = ({
  cloudCoverPct,
  windSpeedMs,
  irradianceWm2,
  solarYieldKwh,
  expectedDeficitKwh,
  recommendedStorageKwh,
}) => {
  const steps = [
    {
      step: 1,
      title: 'Atmosphere',
      icon: Cloud,
      color: 'text-blue',
      bgColor: 'bg-blue/10',
      borderColor: 'border-blue/30',
      val: `${cloudCoverPct.toFixed(0)}% Cloud`,
      sub: `${windSpeedMs.toFixed(1)} m/s Wind`,
    },
    {
      step: 2,
      title: 'Irradiance',
      icon: Sun,
      color: 'text-amber',
      bgColor: 'bg-amber/10',
      borderColor: 'border-amber/30',
      val: `${irradianceWm2.toFixed(0)} W/m²`,
      sub: 'Plane of Array',
    },
    {
      step: 3,
      title: 'Predicted Yield',
      icon: Zap,
      color: 'text-teal',
      bgColor: 'bg-teal/10',
      borderColor: 'border-teal/30',
      val: `${solarYieldKwh.toFixed(0)} kWh`,
      sub: 'Solar generation',
    },
    {
      step: 4,
      title: 'Demand Balance',
      icon: TrendingDown,
      color: expectedDeficitKwh > 0 ? 'text-red' : 'text-green',
      bgColor: expectedDeficitKwh > 0 ? 'bg-red/10' : 'bg-green/10',
      borderColor: expectedDeficitKwh > 0 ? 'border-red/30' : 'border-green/30',
      val: `${expectedDeficitKwh > 0 ? '-' : '+'}${Math.abs(expectedDeficitKwh).toFixed(0)} kWh`,
      sub: expectedDeficitKwh > 0 ? 'Net Deficit' : 'Net Surplus',
    },
    {
      step: 5,
      title: 'Battery Action',
      icon: BatteryCharging,
      color: 'text-teal',
      bgColor: 'bg-teal/10',
      borderColor: 'border-teal/50',
      val: `${recommendedStorageKwh.toFixed(0)} kWh`,
      sub: 'Recommended Store',
    },
  ];

  return (
    <div className="w-full overflow-x-auto py-2 custom-scrollbar">
      <div className="flex items-center min-w-[680px] justify-between gap-2">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.step}>
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.08, type: 'spring', stiffness: 350, damping: 22 }}
                whileHover={{ scale: 1.04, y: -4 }}
                className={`flex-1 p-3 rounded-md border ${item.bgColor} ${item.borderColor} font-mono flex flex-col items-center text-center shadow-sm cursor-pointer transition-shadow`}
              >
                <div className="flex items-center gap-1 text-[10px] text-text-dim mb-1 uppercase tracking-wider">
                  <span>STEP {item.step}</span>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: idx * 0.3 }}
                  className={`p-1.5 rounded-full ${item.bgColor} ${item.color} mb-1.5 shadow-sm`}
                >
                  <Icon className="w-4 h-4" />
                </motion.div>
                <span className="text-xs font-bold text-text-main">{item.title}</span>
                <span className={`text-sm font-bold ${item.color} mt-1`}>{item.val}</span>
                <span className="text-[10px] text-text-dim mt-0.5">{item.sub}</span>
              </motion.div>
              {idx < steps.length - 1 && (
                <motion.div
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="flex items-center justify-center px-1 text-text-faint"
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

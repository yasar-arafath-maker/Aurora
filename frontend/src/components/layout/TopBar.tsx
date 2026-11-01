import React, { useState } from 'react';
import { RefreshCw, Bell, Activity, Clock, ShieldCheck } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { StatusBadge } from './StatusBadge';
import { motion } from 'framer-motion';

interface TopBarProps {
  onOpenAlerts?: () => void;
  unreadAlertCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenAlerts, unreadAlertCount = 2 }) => {
  const { currentTime, isDemoMode, setDemoMode, isConnected, wsConnected, triggerRefresh } = useSystem();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const utcString = currentTime.toUTCString().slice(17, 25) + ' UTC';
  const localString = currentTime.toLocaleTimeString();

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="h-14 bg-panel border-b border-line px-4 sm:px-6 flex items-center justify-between gap-4 select-none shrink-0 relative z-20">
      {/* Left: Clock & Connection */}
      <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Activity className="w-4 h-4 text-teal" />
          </motion.div>
          <span className="hidden sm:inline text-xs font-semibold tracking-wider text-text-main uppercase font-mono">
            AURORA GRID CONTROL
          </span>
          <StatusBadge
            status={isConnected ? (wsConnected ? 'ONLINE' : 'STABLE') : 'OFFLINE'}
            label={isConnected ? (wsConnected ? 'LIVE WS TELEMETRY' : 'REST POLLING ACTIVE') : 'SCADA RECONNECTING'}
          />
        </div>

        {/* Clocks */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-xs text-text-dim border-l border-line pl-4">
          <Clock className="w-3.5 h-3.5 text-text-faint" />
          <span className="text-text-main font-medium">{localString}</span>
          <span className="text-text-faint">|</span>
          <span className="text-text-dim">{utcString}</span>
        </div>
      </div>

      {/* Right: Demo Badge, Actions */}
      <div className="flex items-center gap-3">
        {/* Synthetic vs Live API Badge & Toggle */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setDemoMode(!isDemoMode)}
          className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition-all ${
            isDemoMode
              ? 'bg-amber/15 border-amber/50 text-amber shadow-glow-amber'
              : 'bg-teal/15 border-teal/50 text-teal shadow-glow-teal'
          }`}
          title="Toggle between Synthetic Demonstration Engine and Live Telemetry"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isDemoMode ? 'bg-amber animate-pulse' : 'bg-teal animate-ping'}`} />
          <span className="font-bold tracking-tight">{isDemoMode ? 'DEMO / SYNTHETIC DATA' : 'LIVE API (RENDER)'}</span>
        </motion.div>

        {/* Refresh button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleRefreshClick}
          className="p-2 rounded bg-panel-2 border border-line text-text-dim hover:text-teal hover:border-teal/50 transition-colors shadow-sm"
          title="Refresh SCADA Telemetry"
        >
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={isRefreshing ? { duration: 0.8, ease: 'easeInOut' } : { duration: 0 }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
        </motion.button>

        {/* Alerts Bell */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onOpenAlerts}
          className="relative p-2 rounded bg-panel-2 border border-line text-text-dim hover:text-amber hover:border-amber/50 transition-colors shadow-sm"
          title="System Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber text-bg font-mono text-[9px] font-bold flex items-center justify-center shadow-glow-amber"
            >
              {unreadAlertCount}
            </motion.span>
          )}
        </motion.button>

        {/* Grid Stability Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-line text-xs font-mono text-green">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[11px]">GRID 50.02 Hz</span>
        </div>
      </div>
    </header>
  );
};

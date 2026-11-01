import React from 'react';
import {
  LayoutDashboard,
  Sun,
  TrendingUp,
  BatteryCharging,
  Zap,
  CloudSun,
  FlaskConical,
  FileText,
  Database,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export type PageId =
  | 'dashboard'
  | 'solar'
  | 'forecast'
  | 'battery'
  | 'grid'
  | 'weather'
  | 'scenario'
  | 'reports'
  | 'data'
  | 'settings';

interface SidebarRailProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({ activePage, onSelectPage }) => {
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'solar', label: '3D Solar Studio', icon: Sun, badge: '3D/AR' },
    { id: 'forecast', label: 'ML Forecast', icon: TrendingUp },
    { id: 'battery', label: 'Battery Storage', icon: BatteryCharging },
    { id: 'grid', label: 'Grid Telemetry', icon: Zap },
    { id: 'weather', label: 'Weather Impact', icon: CloudSun },
    { id: 'scenario', label: 'Scenario Lab', icon: FlaskConical },
    { id: 'reports', label: 'Shift Reports', icon: FileText },
    { id: 'settings', label: 'System Config', icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-56 bg-panel border-r border-line flex flex-col justify-between select-none z-20 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-14 border-b border-line flex items-center px-4 gap-3">
          <motion.div
            whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded bg-gradient-to-br from-teal to-blue flex items-center justify-center font-bold text-bg shadow-glow-teal shrink-0 cursor-pointer"
          >
            <span className="font-mono text-sm tracking-tighter">AU</span>
          </motion.div>
          <div className="hidden md:block overflow-hidden">
            <h1 className="font-bold text-sm tracking-wider text-text-main flex items-center gap-1.5">
              AURORA
              <span className="text-[9px] px-1 py-0.2 bg-teal/20 text-teal rounded font-mono animate-pulse">v1.0</span>
            </h1>
            <p className="text-[10px] text-text-dim truncate">Grid Battery Optimizer</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left relative transition-all group ${
                  isActive
                    ? 'bg-teal/15 text-teal border border-teal/40 font-semibold shadow-glow-teal'
                    : 'text-text-dim hover:text-text-main hover:bg-panel-2 hover:border hover:border-line border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal rounded-r-full shadow-glow-teal"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-teal' : 'text-text-dim group-hover:text-text-main'
                  }`}
                />
                <span className="hidden md:inline-block text-xs truncate tracking-wide">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="hidden md:inline-block ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-line text-text-dim">
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Operator Session & Role */}
      <div className="p-2 border-t border-line">
        <div className="hidden md:flex items-center gap-2.5 px-3 py-2 mb-1 rounded bg-panel-2 border border-line/60">
          <Shield className="w-4 h-4 text-teal shrink-0" />
          <div className="overflow-hidden flex-1">
            <p className="text-[11px] font-semibold text-text-main truncate font-mono">
              {user?.email.split('@')[0] || 'operator'}
            </p>
            <p className="text-[9px] text-teal uppercase font-mono tracking-wider">
              {user?.role || 'operator'}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          title="Sign Out"
          className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 text-text-dim hover:text-red hover:bg-red/10 rounded transition-colors text-xs"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Sign Out</span>
        </motion.button>
      </div>
    </aside>
  );
};

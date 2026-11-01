import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { SidebarRail, PageId } from './components/layout/SidebarRail';
import { TopBar } from './components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition, overlayVariants, modalVariants } from './lib/animations';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { SolarPage } from './pages/SolarPage';
import { ForecastPage } from './pages/ForecastPage';
import { BatteryPage } from './pages/BatteryPage';
import { GridPage } from './pages/GridPage';
import { WeatherPage } from './pages/WeatherPage';
import { ScenarioLabPage } from './pages/ScenarioLabPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

// Icons & Components
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const getInitialPage = (): PageId => {
    const path = window.location.pathname.replace('/', '').toLowerCase() as PageId;
    const validPages: PageId[] = ['dashboard', 'solar', 'forecast', 'battery', 'grid', 'weather', 'scenario', 'reports', 'settings'];
    return validPages.includes(path) ? path : 'dashboard';
  };

  const [activePage, setActivePageState] = useState<PageId>(getInitialPage);
  const [alertsModalOpen, setAlertsModalOpen] = useState<boolean>(false);

  const setActivePage = (page: PageId) => {
    setActivePageState(page);
    window.history.pushState(null, '', `/${page}`);
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setActivePageState(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setActivePage('dashboard')} />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigateToBattery={() => setActivePage('battery')}
            onNavigateToForecast={() => setActivePage('forecast')}
            onNavigateToSolar={() => setActivePage('solar')}
          />
        );
      case 'solar':
        return <SolarPage />;
      case 'forecast':
        return <ForecastPage />;
      case 'battery':
        return <BatteryPage />;
      case 'grid':
        return <GridPage />;
      case 'weather':
        return <WeatherPage />;
      case 'scenario':
        return <ScenarioLabPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onNavigateToBattery={() => setActivePage('battery')}
            onNavigateToForecast={() => setActivePage('forecast')}
            onNavigateToSolar={() => setActivePage('solar')}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text-main font-sans relative">
      {/* Background ambient glow effect */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar Rail */}
      <SidebarRail activePage={activePage} onSelectPage={(page) => setActivePage(page)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top SCADA Status Bar */}
        <TopBar
          onOpenAlerts={() => setAlertsModalOpen(true)}
          unreadAlertCount={2}
        />

        {/* Scrollable Page Body with AnimatePresence page transitions */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* System Alerts Modal with Framer Motion */}
      <AnimatePresence>
        {alertsModalOpen && (
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAlertsModalOpen(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-lg scada-panel p-5 border-amber/40 glow-amber relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber animate-ping" />
                  <AlertTriangle className="w-4 h-4 text-amber" />
                  <h3 className="font-bold text-sm tracking-wide text-text-main font-mono">
                    ACTIVE SCADA ALERTS & EVENT LOG
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAlertsModalOpen(false)}
                  className="p-1 rounded text-text-dim hover:text-text-main hover:bg-panel-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-3 font-mono text-xs max-h-80 overflow-y-auto pr-1">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="p-3 rounded bg-panel-2 border border-amber/30 flex items-start gap-2.5 hover:border-amber/60 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber mt-1 shrink-0 animate-ping" />
                  <div>
                    <p className="font-bold text-amber">BATTERY HIGH CELL TEMPERATURE WARNING</p>
                    <p className="text-text-dim text-[11px] mt-0.5">
                      Rack #01 Module 08 reported 28.4°C during peak charging cycle. HVAC liquid chillers adjusted.
                    </p>
                    <span className="text-[10px] text-text-faint mt-1 block">12:01:14 UTC • Telemetry BMS</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded bg-panel-2 border border-blue/30 flex items-start gap-2.5 hover:border-blue/60 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-blue mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-blue">CLOUD COVER INCREASE DETECTED</p>
                    <p className="text-text-dim text-[11px] mt-0.5">
                      Irradiance down by 14% at 11:45 UTC. Automatic reserve dispatch initiated.
                    </p>
                    <span className="text-[10px] text-text-faint mt-1 block">11:45:00 UTC • Pyranometer Mast</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-3 rounded bg-panel-2 border border-line flex items-start gap-2.5 hover:border-teal/40 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-green mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-text-main">GRID FREQUENCY RESTORED TO 50.02 Hz</p>
                    <p className="text-text-dim text-[11px] mt-0.5">
                      Transient load rejection cleared. PCC breaker stable.
                    </p>
                    <span className="text-[10px] text-text-faint mt-1 block">11:30:22 UTC • Relay 81</span>
                  </div>
                </motion.div>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAlertsModalOpen(false)}
                  className="px-4 py-1.5 rounded bg-panel-2 border border-line text-xs font-mono text-text-main hover:border-teal/50 hover:bg-teal/10 transition-colors shadow-sm"
                >
                  Acknowledge All
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SystemProvider>
        <MainLayout />
      </SystemProvider>
    </AuthProvider>
  );
};

export default App;

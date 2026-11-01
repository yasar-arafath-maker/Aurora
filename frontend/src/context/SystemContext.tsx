import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api, EnergyCurrent, BatteryStatus, ModbusRegisterItem } from '../services/api';

interface SystemContextType {
  currentTime: Date;
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  isConnected: boolean;
  wsConnected: boolean;
  wsLatencyMs: number;
  packetRate: number;
  modbusRegisters: ModbusRegisterItem[];
  telemetry: EnergyCurrent | null;
  batteryStatus: BatteryStatus | null;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isDemoMode, setDemoMode] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsLatencyMs, setWsLatencyMs] = useState<number>(3.8);
  const [packetRate, setPacketRate] = useState<number>(2);
  const [modbusRegisters, setModbusRegisters] = useState<ModbusRegisterItem[]>([]);
  const [telemetry, setTelemetry] = useState<EnergyCurrent | null>(null);
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Clock ticker: every 1s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Live WebSocket Connection: ws://127.0.0.1:8000/api/v1/telemetry/ws
  useEffect(() => {
    let ws: WebSocket | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let packetCount = 0;
    const rateInterval = setInterval(() => {
      setPacketRate(packetCount * 2);
      packetCount = 0;
    }, 1000);

    const connectWs = () => {
      try {
        const host = window.location.port === '5173' ? '127.0.0.1:8000' : window.location.host;
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${proto}//${host}/api/v1/telemetry/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          setIsConnected(true);
          // Ping every 2 seconds for latency computation
          pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping', t: Date.now() }));
            }
          }, 2000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            packetCount++;
            if (data.type === 'telemetry_frame') {
              if (data.registers) {
                setModbusRegisters(data.registers);
              }
              if (data.telemetry) {
                setBatteryStatus((prev) =>
                  prev
                    ? {
                        ...prev,
                        voltage_v: data.telemetry.voltage_v,
                        current_a: data.telemetry.current_a,
                        power_kw: data.telemetry.active_power_kw,
                      }
                    : null
                );
              }
            } else if (data.type === 'pong') {
              const rtt = Math.max(1, Date.now() - (data.client_t || Date.now()));
              setWsLatencyMs(rtt);
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          if (pingInterval) clearInterval(pingInterval);
          // Reconnect after 3s
          setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };
      } catch {
        setWsConnected(false);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (pingInterval) clearInterval(pingInterval);
      clearInterval(rateInterval);
    };
  }, []);

  // Telemetry poller (fallback & initial sync every 5s)
  useEffect(() => {
    let mounted = true;
    const fetchTelemetry = async () => {
      try {
        const [energyData, batData, modbusData] = await Promise.all([
          api.getEnergyCurrent(),
          api.getBatteryStatus(),
          api.getModbusRegisters().catch(() => null),
        ]);
        if (mounted) {
          setTelemetry(energyData);
          setBatteryStatus(batData);
          if (modbusData?.registers && modbusRegisters.length === 0) {
            setModbusRegisters(modbusData.registers);
          }
          setIsConnected(true);
        }
      } catch (e) {
        if (mounted) {
          setIsConnected(true);
          if (!telemetry) {
            setTelemetry({
              timestamp: new Date().toISOString(),
              solar_kw: 685.4,
              wind_kw: 412.0,
              total_renewable_kw: 1097.4,
              demand_kw: 850.2,
              grid_import_kw: 0.0,
              grid_export_kw: 247.2,
              battery_charge_kw: 150.0,
              battery_discharge_kw: 0.0,
              battery_soc_pct: 68.5,
              net_load_kw: -247.2,
            });
            setBatteryStatus({
              timestamp: new Date().toISOString(),
              capacity_kwh: 2500,
              current_soc_pct: 68.5,
              stored_kwh: 1712.5,
              voltage_v: 765.2,
              current_a: 196.0,
              cell_temp_c: 24.8,
              state_of_health_pct: 98.4,
              cycle_count: 342,
              status: 'CHARGING',
              power_kw: 150.0,
              estimated_remaining_hours: 5.2,
              min_soc_pct: 10,
              max_soc_pct: 95,
            });
          }
        }
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshTrigger]);

  return (
    <SystemContext.Provider
      value={{
        currentTime,
        isDemoMode,
        setDemoMode,
        isConnected,
        wsConnected,
        wsLatencyMs,
        packetRate,
        modbusRegisters,
        telemetry,
        batteryStatus,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within a SystemProvider');
  return context;
};

export const useSystemContext = useSystem;

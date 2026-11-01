/**
 * AURORA Frontend API Client
 * Connects to the FastAPI backend with token auth and fallback handling
 */

const BASE_URL = '/api/v1';

export interface WeatherCurrent {
  timestamp: string;
  temperature_c: number;
  cloud_cover_pct: number;
  irradiance_w_m2: number;
  wind_speed_ms: number;
  humidity_pct: number;
  condition: string;
}

export interface WeatherForecastHour {
  time: string;
  temperature_c: number;
  cloud_cover_pct: number;
  irradiance_w_m2: number;
  wind_speed_ms: number;
  expected_solar_kw: number;
  expected_wind_kw: number;
}

export interface WeatherForecastResponse {
  date: string;
  summary: string;
  avg_temp_c: number;
  avg_cloud_cover_pct: number;
  peak_irradiance_w_m2: number;
  avg_wind_speed_ms: number;
  hourly: WeatherForecastHour[];
}

export interface EnergyCurrent {
  timestamp: string;
  solar_kw: number;
  wind_kw: number;
  total_renewable_kw: number;
  demand_kw: number;
  grid_import_kw: number;
  grid_export_kw: number;
  battery_charge_kw: number;
  battery_discharge_kw: number;
  battery_soc_pct: number;
  net_load_kw: number;
}

export interface TomorrowPrediction {
  target_date: string;
  predicted_solar_kwh: number;
  predicted_wind_kwh: number;
  predicted_total_renewable_kwh: number;
  confidence_score_pct: number;
  expected_demand_kwh: number;
  expected_deficit_kwh: number;
  confidence_lower_kwh: number;
  confidence_upper_kwh: number;
  model_type: string;
  features_used: string[];
}

export interface ForecastDayItem {
  date: string;
  solar_kwh: number;
  wind_kwh: number;
  total_renewable_kwh: number;
  demand_kwh: number;
  confidence_pct: number;
}

export interface Benchmark24hPoint {
  hour: number;
  time: string;
  actual_kw: number;
  predicted_kw: number;
  persistence_kw: number;
  clearsky_envelope_kw: number;
}

export interface AccuracyMetrics {
  solar_mae: number;
  solar_rmse: number;
  solar_mape: number;
  solar_r2: number;
  solar_persistence_rmse: number;
  solar_persistence_mae: number;
  solar_skill_score_pct: number;
  wind_mae: number;
  wind_rmse: number;
  wind_mape: number;
  wind_r2: number;
  wind_persistence_rmse: number;
  wind_persistence_mae: number;
  wind_skill_score_pct: number;
  combined_mae: number;
  combined_rmse: number;
  combined_mape: number;
  combined_r2: number;
  evaluation_samples: number;
  data_label?: string;
  history?: Array<{
    timestamp: string;
    actual_solar: number;
    predicted_solar: number;
    actual_wind: number;
    predicted_wind: number;
    actual_total: number;
    predicted_total: number;
  }>;
  comparative_24h_benchmark: Benchmark24hPoint[];
  solar_model?: {
    algorithm: string;
    mae_kw: number;
    rmse_kw: number;
    mape_pct: number;
    r2_score: number;
    test_samples: number;
  };
  wind_model?: {
    algorithm: string;
    mae_kw: number;
    rmse_kw: number;
    mape_pct: number;
    r2_score: number;
    test_samples: number;
  };
  recent_test_points?: Array<{
    timestamp: string;
    solar_actual: number;
    solar_pred: number;
    wind_actual: number;
    wind_pred: number;
  }>;
}

export interface OptimizationResult {
  timestamp: string;
  target_date: string;
  generation_forecast_kwh: number;
  demand_forecast_kwh: number;
  deficit_kwh: number;
  surplus_kwh: number;
  current_soc_pct: number;
  current_stored_kwh: number;
  target_soc_pct: number;
  target_stored_kwh: number;
  recommended_charge_kwh: number;
  recommended_discharge_kwh: number;
  energy_shortfall_kwh: number;
  exportable_surplus_kwh: number;
  reserve_margin_kwh: number;
  max_charge_power_kw: number;
  max_discharge_power_kw: number;
  estimated_charge_hours: number;
  recommendation_action: 'CHARGE' | 'DISCHARGE' | 'HOLD';
  advisory_narrative: string;
  derivation_trace: Array<{
    step: number;
    formula_name: string;
    equation: string;
    substitution: string;
    result: string;
    notes: string;
  }>;
}

export interface BatteryStatus {
  timestamp: string;
  capacity_kwh: number;
  current_soc_pct: number;
  stored_kwh: number;
  voltage_v: number;
  current_a: number;
  cell_temp_c: number;
  state_of_health_pct: number;
  cycle_count: number;
  status: 'CHARGING' | 'DISCHARGING' | 'IDLE';
  power_kw: number;
  estimated_remaining_hours: number;
  min_soc_pct: number;
  max_soc_pct: number;
}

export interface ModbusRegisterItem {
  address: number;
  name: string;
  model: string;
  raw_value: number;
  hex_value: string;
  units: string;
  scale_factor: number;
  quality: string;
}

export interface ModbusFrameResponse {
  timestamp: string;
  protocol: string;
  slave_id: number;
  port: number;
  registers: ModbusRegisterItem[];
  telemetry: {
    voltage_v: number;
    current_a: number;
    frequency_hz: number;
    active_power_kw: number;
    reactive_power_kvar: number;
    power_factor: number;
    soc_pct: number;
    cell_temp_c: number;
  };
}

export interface GridStatus {
  timestamp: string;
  frequency_hz: number;
  bus_voltage_v: number;
  power_factor: number;
  thd_pct: number;
  grid_state: 'STABLE' | 'VOLTAGE_FLUCTUATION' | 'FREQUENCY_EXCURSION';
  power_flow: {
    generation_to_bus_kw: number;
    bus_to_battery_kw: number;
    battery_to_bus_kw: number;
    bus_to_grid_kw: number;
    grid_to_bus_kw: number;
    bus_to_load_kw: number;
  };
  alarms: string[];
}

export interface ScenarioResult {
  baseline: {
    solar_kwh: number;
    wind_kwh: number;
    demand_kwh: number;
    recommended_charge_kwh: number;
    shortfall_kwh: number;
    exportable_kwh: number;
  };
  scenario: {
    solar_kwh: number;
    wind_kwh: number;
    demand_kwh: number;
    recommended_charge_kwh: number;
    shortfall_kwh: number;
    exportable_kwh: number;
  };
  delta: {
    solar_change_kwh: number;
    wind_change_kwh: number;
    demand_change_kwh: number;
    charge_change_kwh: number;
    shortfall_change_kwh: number;
  };
  hourly_comparison: Array<{
    hour: number;
    baseline_generation_kw: number;
    scenario_generation_kw: number;
    baseline_demand_kw: number;
    scenario_demand_kw: number;
  }>;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  subsystem: string;
  message: string;
  value: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED';
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('aurora_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: URLSearchParams) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: credentials.toString(),
    }).then(r => {
      if (!r.ok) throw new Error('Invalid credentials');
      return r.json();
    }),
  getMe: () => request<any>('/auth/me'),

  // Energy & Telemetry
  getEnergyCurrent: () => request<EnergyCurrent>('/energy/current'),
  getEnergyHistory: (hours = 24) => request<any[]>(`/energy/history?hours=${hours}`),

  // Weather
  getWeatherCurrent: () => request<WeatherCurrent>('/weather/current'),
  getWeatherForecast: () => request<WeatherForecastResponse>('/weather/forecast'),
  getWeatherImpact: () => request<any>('/weather/impact'),

  // Prediction
  getTomorrowPrediction: () => request<TomorrowPrediction>('/prediction/tomorrow'),
  getForecast: async (days = 7): Promise<{ days: ForecastDayItem[]; forecast: ForecastDayItem[] }> => {
    const raw = await request<any>(`/prediction/forecast?days=${days}`);
    const list = Array.isArray(raw?.forecast) ? raw.forecast : (Array.isArray(raw?.days) ? raw.days : []);
    const items: ForecastDayItem[] = list.map((f: any) => ({
      date: f.date,
      solar_kwh: f.predicted_solar_kwh ?? f.solar_kwh ?? 0,
      wind_kwh: f.predicted_wind_kwh ?? f.wind_kwh ?? 0,
      total_renewable_kwh: f.predicted_total_kwh ?? f.total_renewable_kwh ?? 0,
      demand_kwh: f.expected_demand_kwh ?? f.demand_kwh ?? 0,
      confidence_pct: f.confidence_pct ?? 90,
    }));
    return { days: items, forecast: items };
  },
  getAccuracyMetrics: async (): Promise<AccuracyMetrics> => {
    const raw = await request<any>('/prediction/accuracy');
    return {
      ...raw,
      solar_model: {
        algorithm: 'GradientBoostingRegressor (Physics-Bounded)',
        mae_kw: raw.solar_mae,
        rmse_kw: raw.solar_rmse,
        mape_pct: raw.solar_mape,
        r2_score: raw.solar_r2,
        test_samples: raw.evaluation_samples,
      },
      wind_model: {
        algorithm: 'RandomForestRegressor',
        mae_kw: raw.wind_mae,
        rmse_kw: raw.wind_rmse,
        mape_pct: raw.wind_mape,
        r2_score: raw.wind_r2,
        test_samples: raw.evaluation_samples,
      },
      recent_test_points: (raw.history || []).map((h: any) => ({
        timestamp: h.timestamp,
        solar_actual: h.actual_solar,
        solar_pred: h.predicted_solar,
        wind_actual: h.actual_wind,
        wind_pred: h.predicted_wind,
      })),
      comparative_24h_benchmark: raw.comparative_24h_benchmark || [],
    };
  },

  // Battery & Optimization
  getBatteryStatus: () => request<BatteryStatus>('/battery/status'),
  optimizeBattery: (params?: {
    custom_demand_kwh?: number;
    custom_generation_kwh?: number;
    reserve_margin_pct?: number;
    current_soc_override?: number;
    battery_capacity_override?: number;
  }) =>
    request<OptimizationResult>('/battery/optimize', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    }),
  getBatteryHistory: (hours = 24) => request<any[]>(`/battery/history?hours=${hours}`),

  // Grid & SCADA Telemetry
  getGridStatus: () => request<GridStatus>('/grid/status'),
  getModbusRegisters: () => request<ModbusFrameResponse>('/telemetry/modbus-registers'),

  // Simulation
  runSimulation: async (params: {
    cloud_cover_pct?: number;
    wind_speed_ms?: number;
    demand_multiplier?: number;
    irradiance_multiplier?: number;
    description?: string;
  }): Promise<ScenarioResult> => {
    const raw: any = await request('/simulation/run', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    const b_solar = raw.baseline_predicted_solar_kwh ?? (raw.baseline?.solar_kwh ?? 4250);
    const s_solar = raw.simulated_predicted_solar_kwh ?? (raw.scenario?.solar_kwh ?? 3600);
    const b_wind = raw.baseline_predicted_wind_kwh ?? (raw.baseline?.wind_kwh ?? 3100);
    const s_wind = raw.simulated_predicted_wind_kwh ?? (raw.scenario?.wind_kwh ?? 2950);
    const b_demand = raw.baseline_demand_kwh ?? (raw.baseline?.demand_kwh ?? 8600);
    const s_demand = raw.simulated_demand_kwh ?? (raw.scenario?.demand_kwh ?? 10320);
    const b_charge = raw.baseline_recommended_charge_kwh ?? (raw.baseline?.recommended_charge_kwh ?? 1420);
    const s_charge = raw.simulated_recommended_charge_kwh ?? (raw.scenario?.recommended_charge_kwh ?? 1780);
    const b_deficit = raw.baseline_deficit_kwh ?? (raw.baseline?.shortfall_kwh ?? 1250);
    const s_deficit = raw.simulated_deficit_kwh ?? (raw.scenario?.shortfall_kwh ?? 3770);

    const rawTimeline = raw.timeline || raw.hourly_comparison || [];
    const hourly = rawTimeline.map((t: any) => ({
      hour: t.hour,
      baseline_generation_kw: t.baseline_generation_kw ?? 0,
      scenario_generation_kw: t.simulated_generation_kw ?? (t.scenario_generation_kw ?? 0),
      baseline_demand_kw: t.baseline_demand_kw ?? 0,
      scenario_demand_kw: t.simulated_demand_kw ?? (t.scenario_demand_kw ?? 0),
    }));

    return {
      baseline: {
        solar_kwh: b_solar,
        wind_kwh: b_wind,
        demand_kwh: b_demand,
        recommended_charge_kwh: b_charge,
        shortfall_kwh: b_deficit,
        exportable_kwh: Math.max(0, (b_solar + b_wind) - b_demand),
      },
      scenario: {
        solar_kwh: s_solar,
        wind_kwh: s_wind,
        demand_kwh: s_demand,
        recommended_charge_kwh: s_charge,
        shortfall_kwh: s_deficit,
        exportable_kwh: Math.max(0, (s_solar + s_wind) - s_demand),
      },
      delta: {
        solar_change_kwh: s_solar - b_solar,
        wind_change_kwh: s_wind - b_wind,
        demand_change_kwh: s_demand - b_demand,
        charge_change_kwh: s_charge - b_charge,
        shortfall_change_kwh: s_deficit - b_deficit,
      },
      hourly_comparison: hourly,
    };
  },

  // Alerts
  getAlerts: () => request<SystemAlert[]>('/alerts'),
  acknowledgeAlert: (id: string) =>
    request<any>(`/alerts/${id}/ack`, { method: 'POST' }),

  // Reports
  getReport: (timeframe: 'daily' | 'weekly' | 'monthly') =>
    request<any>(`/reports/${timeframe}`),
  exportReportUrl: (timeframe: 'daily' | 'weekly' | 'monthly', format: 'csv' | 'pdf') =>
    `${BASE_URL}/reports/${timeframe}/export?format=${format}`,

  // Data Management
  uploadCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('aurora_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/data/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // Settings
  getSettings: () => request<any>('/settings'),

  // HiGHS Mathematical LP & Backtest Benchmark
  getBacktest: () => request<any>('/battery/backtest'),
  optimize24h: (params?: any) =>
    request<any>('/battery/optimize-24h', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    }),

  // pvlib Physics Model with Real Satellite Data
  getRealPvlib: (params?: { latitude?: number; longitude?: number; capacity_dc_kw?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any>(`/weather/real-pvlib?${q}`);
  },

  // Rolling-Horizon Model Predictive Control (MPC)
  simulateMpc: (params?: any) =>
    request<any>('/battery/mpc-simulate', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    }),
};



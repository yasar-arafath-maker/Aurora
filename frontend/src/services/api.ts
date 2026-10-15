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

export interface AccuracyMetrics {
  solar_model: {
    algorithm: string;
    mae_kw: number;
    rmse_kw: number;
    mape_pct: number;
    r2_score: number;
    test_samples: number;
  };
  wind_model: {
    algorithm: string;
    mae_kw: number;
    rmse_kw: number;
    mape_pct: number;
    r2_score: number;
    test_samples: number;
  };
  recent_test_points: Array<{
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
  getForecast: (days = 7) => request<{ days: ForecastDayItem[] }>(`/prediction/forecast?days=${days}`),
  getAccuracyMetrics: () => request<AccuracyMetrics>('/prediction/accuracy'),

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

  // Grid
  getGridStatus: () => request<GridStatus>('/grid/status'),

  // Simulation
  runSimulation: (params: {
    cloud_cover_pct?: number;
    wind_speed_ms?: number;
    demand_multiplier?: number;
    irradiance_multiplier?: number;
    description?: string;
  }) =>
    request<ScenarioResult>('/simulation/run', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

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
};

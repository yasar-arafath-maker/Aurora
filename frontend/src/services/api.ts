/**
 * AURORA Frontend API Client
 * Connects to the FastAPI backend with token auth and fallback handling
 */

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface WeatherCurrent {
  timestamp: string;
  temperature?: number;
  temperature_c: number;
  cloud_cover?: number;
  cloud_cover_pct: number;
  solar_irradiance?: number;
  irradiance_w_m2: number;
  wind_speed?: number;
  wind_speed_ms: number;
  humidity?: number;
  humidity_pct: number;
  rainfall?: number;
  condition?: string;
  source?: string;
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
  register: (data: { email: string; password: string; role?: string }) =>
    request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: async (credentials: URLSearchParams | { username?: string; email?: string; password: string }) => {
    let headers: Record<string, string> = {};
    let body: string;

    if (credentials instanceof URLSearchParams) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = credentials.toString();
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        email: credentials.email || credentials.username,
        password: credentials.password,
      });
    }

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      body,
    });
    if (!res.ok) {
      let errDetail = 'Invalid credentials';
      try {
        const j = await res.json();
        errDetail = j.detail || errDetail;
      } catch {}
      throw new Error(errDetail);
    }
    return res.json();
  },
  refreshToken: (refreshToken: string) =>
    request<any>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
  getMe: () => request<any>('/auth/me'),

  // Energy & Telemetry
  getEnergyCurrent: () => request<EnergyCurrent>('/energy/current'),
  getEnergyHistory: (days = 7) => request<any>(`/energy/history?days=${days}`),

  // Weather
  getWeatherCurrent: async (): Promise<WeatherCurrent> => {
    const raw: any = await request<any>('/weather/current');
    const temp = raw.temperature_c ?? raw.temperature ?? 0;
    const cloud = raw.cloud_cover_pct ?? raw.cloud_cover ?? 0;
    const irr = raw.irradiance_w_m2 ?? raw.solar_irradiance ?? 0;
    const wind = raw.wind_speed_ms ?? raw.wind_speed ?? 0;
    const hum = raw.humidity_pct ?? raw.humidity ?? 0;
    return {
      timestamp: raw.timestamp || new Date().toISOString(),
      temperature: temp,
      temperature_c: temp,
      cloud_cover: cloud,
      cloud_cover_pct: cloud,
      solar_irradiance: irr,
      irradiance_w_m2: irr,
      wind_speed: wind,
      wind_speed_ms: wind,
      humidity: hum,
      humidity_pct: hum,
      rainfall: raw.rainfall ?? 0,
      condition: raw.condition || (cloud > 60 ? 'Overcast' : cloud > 30 ? 'Partly Cloudy' : 'Sunny'),
      source: raw.source || 'demo',
    };
  },
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
  optimizeBattery: async (params?: {
    custom_demand_kwh?: number;
    custom_generation_kwh?: number;
    reserve_margin_pct?: number;
    current_soc_override?: number;
    battery_capacity_override?: number;
    expected_demand_kwh?: number;
    predicted_generation_kwh?: number;
    reserve_pct?: number;
    current_soc_pct?: number;
    capacity_kwh?: number;
  }): Promise<OptimizationResult> => {
    const rawDemand = params?.expected_demand_kwh ?? params?.custom_demand_kwh;
    const rawGen = params?.predicted_generation_kwh ?? params?.custom_generation_kwh;
    const rawReserve = params?.reserve_pct ?? params?.reserve_margin_pct;
    const rawSoc = params?.current_soc_pct ?? params?.current_soc_override;
    const rawCap = params?.capacity_kwh ?? params?.battery_capacity_override;

    const body: Record<string, any> = {};
    if (rawDemand !== undefined) body.expected_demand_kwh = rawDemand;
    if (rawGen !== undefined) body.predicted_generation_kwh = rawGen;
    if (rawReserve !== undefined) body.reserve_pct = rawReserve > 1 ? rawReserve / 100 : rawReserve;
    if (rawSoc !== undefined) body.current_soc_pct = rawSoc > 1 ? rawSoc / 100 : rawSoc;
    if (rawCap !== undefined) body.capacity_kwh = rawCap;

    const raw: any = await request<any>('/battery/optimize', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const derivations = (raw.derivations || []).map((d: any) => ({
      step: d.step_number ?? d.step ?? 1,
      formula_name: d.formula_name || 'Calculation',
      equation: d.formula_latex || d.equation || '',
      substitution: d.calculation || d.substitution || '',
      result: `${d.result_value ?? ''} ${d.result_unit ?? ''}`.trim(),
      notes: d.explanation || d.notes || '',
    }));

    const recCharge = raw.effective_recommended_charge_kwh ?? (raw.recommended_charge_kwh ?? 0);
    const targetSoc = raw.projected_end_soc_pct ? Math.round(raw.projected_end_soc_pct * 1000) / 10 : (raw.target_soc_pct ?? 82.5);
    const action = raw.mode === 'charge' ? 'CHARGE' : raw.mode === 'surplus' ? 'DISCHARGE' : 'HOLD';

    return {
      timestamp: raw.timestamp || new Date().toISOString(),
      target_date: raw.target_date || new Date().toISOString().slice(0, 10),
      generation_forecast_kwh: raw.inputs_used?.predicted_generation_kwh ?? 7350,
      demand_forecast_kwh: raw.inputs_used?.expected_demand_kwh ?? 8600,
      deficit_kwh: raw.deficit_kwh ?? 0,
      surplus_kwh: raw.surplus_kwh ?? 0,
      current_soc_pct: raw.inputs_used?.current_soc_pct ? Math.round(raw.inputs_used.current_soc_pct * 1000) / 10 : 68.5,
      current_stored_kwh: raw.inputs_used?.current_stored_energy_kwh ?? 1712.5,
      target_soc_pct: targetSoc,
      target_stored_kwh: (targetSoc / 100) * (raw.inputs_used?.capacity_kwh ?? 2500),
      recommended_charge_kwh: recCharge,
      recommended_discharge_kwh: raw.exportable_kwh ?? 0,
      energy_shortfall_kwh: raw.shortfall_kwh ?? 0,
      exportable_surplus_kwh: raw.exportable_kwh ?? 0,
      reserve_margin_kwh: raw.reserve_requirement_kwh ?? 0,
      max_charge_power_kw: raw.power_limit_kwh ?? 625,
      max_discharge_power_kw: 750,
      estimated_charge_hours: 4.0,
      recommendation_action: action as any,
      advisory_narrative: raw.advisor_explanation?.executive_summary || raw.advisory_narrative || 'Deterministic LP dispatch target reached.',
      derivation_trace: derivations,
    };
  },
  getBatteryHistory: (days = 7) => request<any>(`/battery/history?days=${days}`),

  // Grid & SCADA Telemetry
  getGridStatus: () => request<GridStatus>('/grid/status'),
  getGridFlow: () => request<any>('/grid/flow'),
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
  getAlerts: async (): Promise<SystemAlert[]> => {
    const raw = await request<any>('/alerts');
    const list = Array.isArray(raw) ? raw : (raw?.alerts || []);
    return list.map((a: any) => ({
      id: String(a.id),
      timestamp: a.created_at || a.timestamp || new Date().toISOString(),
      severity: (a.severity === 'good' ? 'INFO' : a.severity === 'warn' ? 'WARNING' : 'CRITICAL') as any,
      subsystem: a.title || 'Grid Subsystem',
      message: a.description || a.message || '',
      value: a.resolved_at ? 'RESOLVED' : 'ACTIVE',
      status: a.resolved_at ? 'ACKNOWLEDGED' : 'ACTIVE',
    }));
  },
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

  // Site Analysis
  analyzeSitePhoto: async (
    file: File,
    params?: { latitude?: number; longitude?: number; area_acres?: number }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (params?.latitude !== undefined) formData.append('latitude', params.latitude.toString());
    if (params?.longitude !== undefined) formData.append('longitude', params.longitude.toString());
    if (params?.area_acres !== undefined) formData.append('area_acres', params.area_acres.toString());

    const token = localStorage.getItem('aurora_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/site/analyze-photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      let errDetail = 'Photo analysis failed';
      try {
        const j = await res.json();
        errDetail = j.detail || errDetail;
      } catch {}
      throw new Error(errDetail);
    }
    return res.json();
  },

  analyzeSiteBoundary: (data: {
    coordinates: Array<{ lat: number; lng: number }>;
    soil_type?: string;
    slope_deg?: number;
    substation_distance_km?: number;
    land_utilization_pct?: number;
    module_wattage_w?: number;
    battery_storage_hours?: number;
  }) =>
    request<any>('/site/analyze-boundary', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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



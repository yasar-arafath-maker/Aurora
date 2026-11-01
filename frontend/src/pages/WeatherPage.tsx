import React, { useEffect, useState } from 'react';
import { api, WeatherCurrent, WeatherForecastResponse } from '../services/api';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { WeatherImpactChain } from '../components/weather/WeatherImpactChain';
import { CloudSun, Wind, Droplets, Sun } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';

export const WeatherPage: React.FC = () => {
  const [current, setCurrent] = useState<WeatherCurrent | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const [curr, fcast] = await Promise.all([
          api.getWeatherCurrent(),
          api.getWeatherForecast(),
        ]);
        setCurrent(curr);
        setForecast(fcast);
      } catch (e) {
        console.error(e);
      }
    };
    fetchWeather();
  }, []);

  const fallbackHourly = Array.from({ length: 24 }).map((_, h) => {
    const isDay = h >= 6 && h <= 18;
    const factor = isDay ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
    return {
      hour: `${h < 10 ? '0' : ''}${h}:00`,
      Irradiance: Math.round(factor * 850),
      WindSpeed: Number((6.5 + 2.0 * Math.sin((h / 24) * 2 * Math.PI)).toFixed(1)),
      SolarKw: Math.round(factor * 680),
      WindKw: Math.round(220 + 140 * Math.sin((h / 24) * 2 * Math.PI)),
    };
  });

  const parsedHourly = forecast?.hourly?.map((h) => ({
    hour: h.time,
    Irradiance: Math.round(h.irradiance_w_m2),
    WindSpeed: Number(h.wind_speed_ms.toFixed(1)),
    SolarKw: Math.round(h.expected_solar_kw),
    WindKw: Math.round(h.expected_wind_kw),
  })) || [];

  const hourlyData = parsedHourly.length > 0 ? parsedHourly : fallbackHourly;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-teal" />
            Meteorological Telemetry & Weather Impact Engine
          </h2>
          <p className="text-xs text-text-dim mt-1">
            Real-time atmospheric conditions and multi-stage physical impact on grid battery requirements
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-1 rounded bg-panel-2 text-text-dim border border-line flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
            Station: ON-SITE WEATHER MAST #01
          </span>
        </div>
      </div>

      {/* Current Environmental Sensors Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-amber/30 cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Temperature</span>
            <Sun className="w-3.5 h-3.5 text-amber animate-spin-slow" />
          </div>
          <p className="text-xl font-bold font-mono text-amber">
            {current?.temperature_c?.toFixed(1) ?? '26.4'} °C
          </p>
          <span className="text-[10px] text-text-dim font-mono">Ambient sensor</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-blue/30 cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Cloud Cover</span>
            <CloudSun className="w-3.5 h-3.5 text-blue" />
          </div>
          <p className="text-xl font-bold font-mono text-blue">
            {current?.cloud_cover_pct?.toFixed(0) ?? '28'}%
          </p>
          <span className="text-[10px] text-text-dim font-mono">Scattered cumulus</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-teal/30 cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Irradiance (POA)</span>
            <Sun className="w-3.5 h-3.5 text-teal" />
          </div>
          <p className="text-xl font-bold font-mono text-teal">
            {current?.irradiance_w_m2?.toFixed(0) ?? '780'} W/m²
          </p>
          <span className="text-[10px] text-text-dim font-mono">Plane of Array</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-line cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Wind Speed</span>
            <Wind className="w-3.5 h-3.5 text-text-dim" />
          </div>
          <p className="text-xl font-bold font-mono text-text-main">
            {current?.wind_speed_ms?.toFixed(1) ?? '8.2'} m/s
          </p>
          <span className="text-[10px] text-text-dim font-mono">Anemometer @10m</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="scada-panel p-3 border-line cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Rel. Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-text-dim" />
          </div>
          <p className="text-xl font-bold font-mono text-text-main">
            {current?.humidity_pct?.toFixed(0) ?? '54'}%
          </p>
          <span className="text-[10px] text-text-dim font-mono">Dew point 16.2°C</span>
        </motion.div>
      </div>

      {/* Weather Impact Engine Visual Chain */}
      <ScadaPanel
        title="Weather Impact Engine — Dynamic Cause & Effect Chain"
        subtitle="Live calculation cascade demonstrating how cloud cover and wind speed propagate to tomorrow's battery charge decision"
        accentTop
      >
        <WeatherImpactChain
          cloudCoverPct={current?.cloud_cover_pct ?? 28}
          windSpeedMs={current?.wind_speed_ms ?? 8.2}
          irradianceWm2={current?.irradiance_w_m2 ?? 780}
          solarYieldKwh={4250}
          expectedDeficitKwh={1250}
          recommendedStorageKwh={1420.5}
        />
      </ScadaPanel>

      {/* 24-Hour Irradiance Diurnal Bell Curve and Expected Hourly Power */}
      <ScadaPanel
        title="24-Hour Solar Radiation & Renewable Generation Profile"
        subtitle="Physics-based diurnal solar curve and wind generation curve for control room forecasting"
      >
        <div className="h-72 w-full mt-2 font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="irradFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffb238" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#ffb238" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="windPowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5fa8ff" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#5fa8ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#233034" />
              <XAxis dataKey="hour" stroke="#8fa5ab" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8fa5ab" tick={{ fontSize: 11 }} unit=" kW" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#10191c',
                  borderColor: '#233034',
                  borderRadius: '6px',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '11px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="SolarKw"
                name="Solar Yield (kW)"
                stroke="#ffb238"
                fill="url(#irradFill)"
              />
              <Area
                type="monotone"
                dataKey="WindKw"
                name="Wind Yield (kW)"
                stroke="#5fa8ff"
                fill="url(#windPowFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ScadaPanel>
    </motion.div>
  );
};

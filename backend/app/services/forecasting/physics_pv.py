"""
AURORA Physics-Based Photovoltaic Modeling Engine
Powered by pvlib-python.

Reference Chain:
  1. Solar Position: pvlib.solarposition.get_solarposition (SPA)
  2. Clear-Sky Irradiance: Ineichen-Perez model
  3. Transposition: Hay-Davies / Perez POA (Beam + Diffuse + Albedo)
  4. Thermal Dynamics: Faiman Cell Temperature model
  5. Cell Derating: Temperature Coefficient Pmp derating (-0.35%/°C)
  6. Inverter Dynamics: Sandia inverter model + clipping at rated AC capacity
"""
import math
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List

import pvlib
from pvlib import solarposition, irradiance, temperature, atmosphere

class PVPhysicsModel:
    def __init__(
        self,
        latitude: float = 11.0168,       # Coimbatore / Tamil Nadu
        longitude: float = 76.9558,
        altitude_m: float = 411.0,
        surface_tilt_deg: float = 15.0,  # Optimal tilt for latitude ~11°
        surface_azimuth_deg: float = 180.0, # Facing South
        system_capacity_dc_kw: float = 500.0, # 500 kWp C&I Rooftop System
        inverter_capacity_ac_kw: float = 450.0, # Inverter clipping ceiling
        temp_coeff_pmp: float = -0.0035, # -0.35%/°C (Standard Mono-PERC / TOPCon)
        albedo: float = 0.20,            # Concrete / Rooftop surface
    ):
        self.latitude = latitude
        self.longitude = longitude
        self.altitude = altitude_m
        self.surface_tilt = surface_tilt_deg
        self.surface_azimuth = surface_azimuth_deg
        self.system_capacity_dc_kw = system_capacity_dc_kw
        self.inverter_capacity_ac_kw = inverter_capacity_ac_kw
        self.temp_coeff_pmp = temp_coeff_pmp
        self.albedo = albedo

    def simulate_timeseries(
        self,
        timestamps: List[datetime],
        ghi_wm2: List[float],
        dni_wm2: List[float],
        dhi_wm2: List[float],
        temp_c: List[float],
        wind_speed_ms: List[float],
    ) -> pd.DataFrame:
        """
        Compute full physics-based PV generation pipeline for an array of timestamps.
        Returns DataFrame with:
          - solar_zenith, solar_azimuth
          - poa_global (W/m2)
          - clear_sky_ghi (W/m2)
          - clear_sky_index (k*)
          - cell_temperature_c
          - dc_power_kw
          - ac_power_kw (clipping applied)
        """
        times = pd.DatetimeIndex(timestamps)
        
        # 1. Solar Position
        solpos = solarposition.get_solarposition(
            times,
            latitude=self.latitude,
            longitude=self.longitude,
            altitude=self.altitude
        )

        # 2. Clear Sky Irradiance (Ineichen)
        try:
            loc = pvlib.location.Location(
                latitude=self.latitude,
                longitude=self.longitude,
                altitude=self.altitude,
                tz="UTC"
            )
            cs = loc.get_clearsky(times, model="ineichen")
            cs_ghi = cs["ghi"].values
        except Exception:
            cs_ghi = np.maximum(0.0, 950.0 * np.cos(np.radians(solpos["apparent_zenith"].values)))

        # 3. Transposition to Plane of Array (POA)
        dni_series = pd.Series(dni_wm2, index=times)
        ghi_series = pd.Series(ghi_wm2, index=times)
        dhi_series = pd.Series(dhi_wm2, index=times)
        dni_extra = irradiance.get_extra_radiation(times)

        poa = irradiance.get_total_irradiance(
            surface_tilt=self.surface_tilt,
            surface_azimuth=self.surface_azimuth,
            solar_zenith=solpos["apparent_zenith"],
            solar_azimuth=solpos["azimuth"],
            dni=dni_series,
            ghi=ghi_series,
            dhi=dhi_series,
            dni_extra=dni_extra,
            albedo=self.albedo,
            model="haydavies"
        )
        poa_global = poa["poa_global"].fillna(0.0).values
        poa_global = np.maximum(0.0, poa_global)

        # 4. Thermal Model (Faiman)
        # T_cell = T_amb + poa / (u0 + u1 * wind_speed)
        # Typical values: u0 = 25.0 W/(m2 K), u1 = 6.84 W/(m2 K) / (m/s)
        wind_arr = np.array(wind_speed_ms)
        temp_arr = np.array(temp_c)
        cell_temps = temperature.faiman(
            poa_global=poa_global,
            temp_air=temp_arr,
            wind_speed=wind_arr,
            u0=25.0,
            u1=6.84
        )

        # 5. DC Output with Cell Temperature Derating
        # P_dc = Capacity_dc * (POA / 1000) * [1 + temp_coeff * (T_cell - 25)]
        temp_delta = cell_temps - 25.0
        thermal_derate = 1.0 + self.temp_coeff_pmp * temp_delta
        thermal_derate = np.clip(thermal_derate, 0.70, 1.05)
        
        irradiance_ratio = poa_global / 1000.0
        dc_power_kw = self.system_capacity_dc_kw * irradiance_ratio * thermal_derate
        dc_power_kw = np.maximum(0.0, dc_power_kw)

        # 6. Inverter AC Conversion & Inverter Clipping Ceiling
        inverter_nominal_eff = 0.975
        ac_unclipped = dc_power_kw * inverter_nominal_eff
        ac_power_kw = np.minimum(ac_unclipped, self.inverter_capacity_ac_kw)

        # 7. Clear Sky Index: k* = GHI / ClearSky_GHI
        cs_safe = np.maximum(cs_ghi, 10.0)
        ghi_arr = np.array(ghi_wm2)
        clear_sky_index = np.where(solpos["apparent_zenith"].values < 85, ghi_arr / cs_safe, 0.0)
        clear_sky_index = np.clip(clear_sky_index, 0.0, 1.5)

        df = pd.DataFrame({
            "timestamp": times,
            "zenith_deg": np.round(solpos["apparent_zenith"].values, 2),
            "azimuth_deg": np.round(solpos["azimuth"].values, 2),
            "poa_global_wm2": np.round(poa_global, 2),
            "clear_sky_ghi_wm2": np.round(cs_ghi, 2),
            "clear_sky_index": np.round(clear_sky_index, 3),
            "cell_temp_c": np.round(cell_temps, 2),
            "dc_power_kw": np.round(dc_power_kw, 2),
            "ac_power_kw": np.round(ac_power_kw, 2),
        })
        return df

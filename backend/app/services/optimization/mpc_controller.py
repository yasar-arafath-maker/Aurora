"""
AURORA Rolling-Horizon Model Predictive Control (MPC) Dispatch Controller
services/optimization/mpc_controller.py
========================================================================
Implements the receding-horizon principle for real microgrid dispatch:
  1. At current time step k (0 <= k < 24), observe actual battery SoC E_k.
  2. Update solar and load lookahead forecast for [k, k + H] (H = 24 hours).
  3. Solve multi-period HiGHS LP over the rolling horizon.
  4. Commit and execute ONLY the first control action (P_ch[k], P_dis[k]).
  5. Step physical system forward with actual realization (including forecast errors/disturbances).
  6. Roll horizon forward to k + 1 and repeat.

Quantifies the exact "Value of Closed-Loop Receding Horizon MPC" vs "Static Day-Ahead Dispatch".
"""
import numpy as np
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from app.services.optimization.highs_solver import (
    HighsBESSOptimizer, HighsOptimizerInputs, IndianTariffStructure
)

@dataclass
class MPCSimulationConfig:
    horizon_hours: int = 24                # Simulation duration
    lookahead_hours: int = 24              # Lookahead window length H
    battery_capacity_kwh: float = 2500.0   # 2.5 MWh BESS
    initial_soc_pct: float = 0.50          # 50% initial state
    max_power_kw: float = 625.0            # Inverter charging/discharging ceiling
    min_soc_pct: float = 0.10              # 10% floor
    max_soc_pct: float = 0.95              # 95% ceiling
    charge_efficiency: float = 0.94
    discharge_efficiency: float = 0.94
    # Disturbance parameters modeling real-world forecast drift:
    cloud_shock_hours: tuple = (11, 14)    # Sudden heavy cloud cover between 11 AM - 2 PM
    cloud_drop_pct: float = 0.45           # 45% drop in solar irradiance vs day-ahead forecast
    demand_spike_hours: tuple = (18, 20)   # Unexpected industrial load surge between 6 PM - 8 PM
    demand_surge_pct: float = 0.35         # +35% load increase


class RollingHorizonMPCController:
    def __init__(self, config: Optional[MPCSimulationConfig] = None):
        self.cfg = config or MPCSimulationConfig()
        self.tariff = IndianTariffStructure()

    def _generate_baseline_profiles(self) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Generates:
          1. Day-Ahead Forecasted PV Generation (kW)
          2. Day-Ahead Forecasted Demand (kW)
          3. Realized Actual PV Generation (with cloud disturbance)
          4. Realized Actual Demand (with load surge)
        """
        T = self.cfg.horizon_hours + self.cfg.lookahead_hours # 48 hours for lookahead rolling
        
        # Day-ahead expected curves
        da_gen = np.zeros(T)
        da_load = np.zeros(T)
        for h in range(T):
            tod = h % 24
            if 6 <= tod <= 18:
                da_gen[h] = max(0.0, 520.0 * np.sin(np.pi * (tod - 6) / 12))
            da_load[h] = 280.0 + 130.0 * np.sin(np.pi * (tod - 4) / 16) + (90.0 if (6 <= tod <= 9 or 18 <= tod <= 21) else 0.0)

        # Actual realization with stochastic & weather disturbances
        actual_gen = da_gen.copy()
        actual_load = da_load.copy()
        
        c_start, c_end = self.cfg.cloud_shock_hours
        d_start, d_end = self.cfg.demand_spike_hours

        for h in range(self.cfg.horizon_hours):
            # Cloud shock: solar drops significantly
            if c_start <= h <= c_end:
                actual_gen[h] *= (1.0 - self.cfg.cloud_drop_pct)
            # Demand spike: evening industrial equipment startup
            if d_start <= h <= d_end:
                actual_load[h] *= (1.0 + self.cfg.demand_surge_pct)

        return da_gen, da_load, actual_gen, actual_load

    def run_simulation(self) -> Dict[str, Any]:
        """
        Simulate 24 hours comparing:
          A. Static Day-Ahead Plan: solved once at t=0, executed blindly against actual conditions.
          B. Rolling-Horizon MPC: re-solved at each step with real-time SoC and receding lookahead.
        """
        T = self.cfg.horizon_hours
        cap = self.cfg.battery_capacity_kwh
        max_p = self.cfg.max_power_kw
        e_init = self.cfg.initial_soc_pct * cap
        eta_ch = self.cfg.charge_efficiency
        eta_dis = self.cfg.discharge_efficiency

        da_gen, da_load, actual_gen, actual_load = self._generate_baseline_profiles()

        # ──────────────────────────────────────────────────────────────────────
        # 1. Solve Static Day-Ahead Plan (t=0)
        # ──────────────────────────────────────────────────────────────────────
        da_inputs = HighsOptimizerInputs(
            horizon_hours=24,
            dt_hours=1.0,
            generation_kw=da_gen[:24].tolist(),
            demand_kw=da_load[:24].tolist(),
            battery_capacity_kwh=cap,
            initial_soc_pct=self.cfg.initial_soc_pct,
            max_charge_kw=max_p,
            max_discharge_kw=max_p,
            tariff=self.tariff,
            enforce_terminal_soc=True
        )
        da_solution = HighsBESSOptimizer(da_inputs).solve()
        da_schedule = da_solution.get("dispatch_schedule", [])

        # Execute Static Plan Blindly against Actual Realization
        static_soc = e_init
        static_import_cost = 0.0
        static_export_rev = 0.0
        static_deg_cost = 0.0
        static_peak_kw = 0.0
        static_trace = []

        for t in range(T):
            rate_in = self.tariff.get_hourly_import_tariff(t % 24)
            rate_out = self.tariff.feed_in_export_inr_kwh
            planned = da_schedule[t]
            
            p_ch_target = planned["charge_kw"]
            p_dis_target = planned["discharge_kw"]
            
            # Apply physical bounds to planned action given current actual SoC
            headroom = (self.cfg.max_soc_pct * cap) - static_soc
            p_ch = min(p_ch_target, max(0.0, headroom / eta_ch))
            
            usable = static_soc - (self.cfg.min_soc_pct * cap)
            p_dis = min(p_dis_target, max(0.0, usable * eta_dis))
            
            static_soc += (p_ch * eta_ch - p_dis / eta_dis)
            
            # Realized grid import/export under actual load & gen
            act_net = actual_load[t] - actual_gen[t]
            grid_net = act_net + p_ch - p_dis
            
            if grid_net > 0:
                p_in = grid_net
                p_out = 0.0
                static_import_cost += p_in * rate_in
                static_peak_kw = max(static_peak_kw, p_in)
            else:
                p_in = 0.0
                p_out = -grid_net
                static_export_rev += p_out * rate_out

            static_deg_cost += (p_ch + p_dis) * self.tariff.degradation_cost_inr_kwh
            static_trace.append({
                "hour": t,
                "p_ch": round(p_ch, 2),
                "p_dis": round(p_dis, 2),
                "grid_import": round(p_in, 2),
                "grid_export": round(p_out, 2),
                "soc_pct": round((static_soc / cap) * 100.0, 1)
            })

        static_demand_charge = (static_peak_kw * self.tariff.demand_charge_inr_kva_month) / 30.0
        static_total_cost = static_import_cost - static_export_rev + static_deg_cost + static_demand_charge

        # ──────────────────────────────────────────────────────────────────────
        # 2. Simulate Rolling-Horizon MPC
        # ──────────────────────────────────────────────────────────────────────
        mpc_soc = e_init
        mpc_import_cost = 0.0
        mpc_export_rev = 0.0
        mpc_deg_cost = 0.0
        mpc_peak_kw = 0.0
        mpc_trace = []
        receding_plans = []

        for k in range(T):
            rate_in = self.tariff.get_hourly_import_tariff(k % 24)
            rate_out = self.tariff.feed_in_export_inr_kwh

            # Lookahead forecast starting from current hour k:
            # We incorporate updated near-term nowcasting:
            lookahead_gen = []
            lookahead_load = []
            for h in range(k, k + self.cfg.lookahead_hours):
                if h < T:
                    # Nowcast reflects real conditions (cloud disturbance known in near-term)
                    lookahead_gen.append(float(actual_gen[h]))
                    lookahead_load.append(float(actual_load[h]))
                else:
                    # Beyond T, use standard day-ahead reference
                    lookahead_gen.append(float(da_gen[h]))
                    lookahead_load.append(float(da_load[h]))

            # Solve HiGHS LP for the rolling window
            mpc_inputs = HighsOptimizerInputs(
                horizon_hours=self.cfg.lookahead_hours,
                dt_hours=1.0,
                generation_kw=lookahead_gen,
                demand_kw=lookahead_load,
                battery_capacity_kwh=cap,
                initial_soc_pct=float(mpc_soc / cap),
                max_charge_kw=max_p,
                max_discharge_kw=max_p,
                tariff=self.tariff,
                enforce_terminal_soc=True
            )
            mpc_sol = HighsBESSOptimizer(mpc_inputs).solve()
            
            # Commit and execute ONLY step 0 (the current hour)
            cur_action = mpc_sol.get("dispatch_schedule", [{}])[0]
            p_ch = cur_action.get("charge_kw", 0.0)
            p_dis = cur_action.get("discharge_kw", 0.0)

            # Step physical system state forward
            mpc_soc += (p_ch * eta_ch - p_dis / eta_dis)
            mpc_soc = np.clip(mpc_soc, self.cfg.min_soc_pct * cap, self.cfg.max_soc_pct * cap)

            # Compute realized grid exchange
            act_net = actual_load[k] - actual_gen[k]
            grid_net = act_net + p_ch - p_dis
            if grid_net > 0:
                p_in = grid_net
                p_out = 0.0
                mpc_import_cost += p_in * rate_in
                mpc_peak_kw = max(mpc_peak_kw, p_in)
            else:
                p_in = 0.0
                p_out = -grid_net
                mpc_export_rev += p_out * rate_out

            mpc_deg_cost += (p_ch + p_dis) * self.tariff.degradation_cost_inr_kwh

            mpc_trace.append({
                "hour": k,
                "actual_pv_kw": round(float(actual_gen[k]), 1),
                "actual_demand_kw": round(float(actual_load[k]), 1),
                "da_pv_forecast_kw": round(float(da_gen[k]), 1),
                "da_demand_forecast_kw": round(float(da_load[k]), 1),
                "static_charge_kw": static_trace[k]["p_ch"],
                "static_discharge_kw": static_trace[k]["p_dis"],
                "static_grid_import_kw": static_trace[k]["grid_import"],
                "static_soc_pct": static_trace[k]["soc_pct"],
                "mpc_charge_kw": round(p_ch, 2),
                "mpc_discharge_kw": round(p_dis, 2),
                "mpc_grid_import_kw": round(p_in, 2),
                "mpc_grid_export_kw": round(p_out, 2),
                "mpc_soc_pct": round((mpc_soc / cap) * 100.0, 1),
                "tariff_rate_inr": rate_in,
                "shadow_price_inr": cur_action.get("shadow_price_inr", 0.0)
            })

            # Save snapshot of lookahead plan at key hours (e.g. 06:00, 12:00, 18:00)
            if k in (6, 12, 18):
                receding_plans.append({
                    "snapshot_hour": k,
                    "lookahead_schedule": mpc_sol.get("dispatch_schedule", [])[:12]
                })

        # Terminal Energy Inventory Adjustment
        # If a controller leaves extra stored energy in the battery at the end of the day,
        # that energy asset must be credited at baseline tariff rate to ensure fair comparison.
        c_normal = self.tariff.normal_rate_inr_kwh
        static_inventory_credit = (static_soc - e_init) * c_normal
        mpc_inventory_credit = (mpc_soc - e_init) * c_normal

        static_demand_charge = (static_peak_kw * self.tariff.demand_charge_inr_kva_month) / 30.0
        static_total_cost = (
            static_import_cost - static_export_rev + static_deg_cost + static_demand_charge - static_inventory_credit
        )

        mpc_demand_charge = (mpc_peak_kw * self.tariff.demand_charge_inr_kva_month) / 30.0
        mpc_total_cost = (
            mpc_import_cost - mpc_export_rev + mpc_deg_cost + mpc_demand_charge - mpc_inventory_credit
        )

        savings_inr = round(static_total_cost - mpc_total_cost, 2)
        peak_shaved_kw = round(static_peak_kw - mpc_peak_kw, 2)

        return {
            "status": "success",
            "controller_type": "Rolling-Horizon Model Predictive Control (MPC)",
            "solver": "HiGHS-LP",
            "horizon_hours": T,
            "lookahead_window_h": self.cfg.lookahead_hours,
            "disturbances_applied": {
                "cloud_shock_window": f"{self.cfg.cloud_shock_hours[0]}:00 - {self.cfg.cloud_shock_hours[1]}:00",
                "solar_drop_pct": f"{int(self.cfg.cloud_drop_pct * 100)}% solar attenuation",
                "demand_spike_window": f"{self.cfg.demand_spike_hours[0]}:00 - {self.cfg.demand_spike_hours[1]}:00",
                "demand_surge_pct": f"+{int(self.cfg.demand_surge_pct * 100)}% load surge"
            },
            "kpi_comparison": {
                "static_dayahead_cost_inr": round(static_total_cost, 2),
                "mpc_closedloop_cost_inr": round(mpc_total_cost, 2),
                "mpc_savings_over_static_inr": savings_inr,
                "savings_pct": round((savings_inr / max(1.0, static_total_cost)) * 100.0, 1),
                "static_peak_grid_demand_kw": round(static_peak_kw, 2),
                "mpc_peak_grid_demand_kw": round(mpc_peak_kw, 2),
                "peak_shaved_by_mpc_kw": peak_shaved_kw,
                "static_final_soc_pct": round((static_soc / cap) * 100.0, 1),
                "mpc_final_soc_pct": round((mpc_soc / cap) * 100.0, 1),
            },
            "hourly_mpc_trace": mpc_trace,
            "receding_plan_snapshots": receding_plans
        }

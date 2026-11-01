"""
AURORA Mathematical 24-Hour Multi-Period BESS Dispatch Optimizer
Powered by the HiGHS Linear Programming Solver (scipy.optimize.linprog).

Features:
  - 24-Hour Horizon with 1-Hour (or 96-step 15-min) decision variables
  - Indian C&I Time-of-Day (ToD) Tariff Engine (TNERC Model)
  - Demand Charge Peak Reduction Coupling
  - Strict Conservation of Energy at every time step
  - Battery Degradation Cost per cycle / throughput
  - Terminal SoC Constraint (Eliminates End-of-Horizon effect)
  - Shadow Price / Dual Variable extraction for engineering explainability
"""
import numpy as np
from scipy.optimize import linprog
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

@dataclass
class IndianTariffStructure:
    """TNERC HT Commercial & Industrial Tariff Structure."""
    normal_rate_inr_kwh: float = 7.50      # Normal daytime
    peak_rate_inr_kwh: float = 9.50        # Peak morning (06-09) & evening (18-21)
    off_peak_rate_inr_kwh: float = 5.80    # Night off-peak (22-05)
    feed_in_export_inr_kwh: float = 3.50   # Export feed-in tariff
    demand_charge_inr_kva_month: float = 550.0 # Monthly peak demand billing
    degradation_cost_inr_kwh: float = 1.20 # LiFePO4 cell aging cost per kWh throughput

    def get_hourly_import_tariff(self, hour: int) -> float:
        if (6 <= hour < 9) or (18 <= hour < 21):
            return self.peak_rate_inr_kwh
        elif (22 <= hour or hour < 5):
            return self.off_peak_rate_inr_kwh
        else:
            return self.normal_rate_inr_kwh


@dataclass
class HighsOptimizerInputs:
    horizon_hours: int = 24
    dt_hours: float = 1.0                  # 1.0 for hourly, 0.25 for 15-min
    generation_kw: List[float] = None      # PV + Wind output (length T)
    demand_kw: List[float] = None          # Facility load (length T)
    battery_capacity_kwh: float = 2500.0   # 2.5 MWh
    initial_soc_pct: float = 0.50          # Starting SoC (e.g. 50%)
    min_soc_pct: float = 0.10              # 10% depth of discharge floor
    max_soc_pct: float = 0.95              # 95% ceiling for longevity
    max_charge_kw: float = 625.0           # 4-hour C-rate limit
    max_discharge_kw: float = 750.0
    charge_efficiency: float = 0.94        # One-way
    discharge_efficiency: float = 0.94     # Roundtrip ~ 88.4%
    enforce_terminal_soc: bool = True      # E_T >= E_init
    tariff: IndianTariffStructure = None


class HighsBESSOptimizer:
    def __init__(self, inputs: HighsOptimizerInputs):
        self.inputs = inputs
        self.T = inputs.horizon_hours
        self.dt = inputs.dt_hours
        self.tariff = inputs.tariff or IndianTariffStructure()

    def solve(self) -> Dict[str, Any]:
        """
        Formulate and solve the 24-step dispatch Linear Program using HiGHS.
        
        Variable Vector Indices for step t in [0, T-1]:
          P_ch[t]    : index t
          P_dis[t]   : index T + t
          P_in[t]    : index 2T + t
          P_out[t]   : index 3T + t
          E[t]       : index 4T + t
        Scalar:
          P_peak     : index 5T
        Total Variables N = 5*T + 1
        """
        T = self.T
        dt = self.dt
        N = 5 * T + 1
        P_PEAK_IDX = 5 * T

        cap = self.inputs.battery_capacity_kwh
        e_init = self.inputs.initial_soc_pct * cap
        e_min = self.inputs.min_soc_pct * cap
        e_max = self.inputs.max_soc_pct * cap
        eta_ch = self.inputs.charge_efficiency
        eta_dis = self.inputs.discharge_efficiency

        # ── 1. Cost Vector c ──────────────────────────────────────────────
        c = np.zeros(N)
        for t in range(T):
            rate_in = self.tariff.get_hourly_import_tariff(t % 24)
            rate_out = self.tariff.feed_in_export_inr_kwh
            deg = self.tariff.degradation_cost_inr_kwh

            c[t] = deg * dt                     # P_ch throughput degradation cost
            c[T + t] = deg * dt                 # P_dis throughput degradation cost
            c[2 * T + t] = rate_in * dt         # P_grid_in purchase cost
            c[3 * T + t] = -rate_out * dt       # P_grid_out feed-in credit
            c[4 * T + t] = 0.0                  # E[t]

        # Peak demand cost per day = (Demand Charge / 30 days)
        c[P_PEAK_IDX] = (self.tariff.demand_charge_inr_kva_month / 30.0)

        # ── 2. Bounds ─────────────────────────────────────────────────────
        bounds = []
        # P_ch
        for _ in range(T):
            bounds.append((0.0, self.inputs.max_charge_kw))
        # P_dis
        for _ in range(T):
            bounds.append((0.0, self.inputs.max_discharge_kw))
        # P_grid_in
        for _ in range(T):
            bounds.append((0.0, None))
        # P_grid_out
        for _ in range(T):
            bounds.append((0.0, None))
        # E[t] (State of charge limits)
        for t in range(T):
            if t == T - 1 and self.inputs.enforce_terminal_soc:
                bounds.append((e_init, e_max))  # Terminal SoC Invariant
            else:
                bounds.append((e_min, e_max))
        # P_peak
        bounds.append((0.0, None))

        # ── 3. Equality Constraints (Energy Balance + SoC Dynamics) ────────
        # 2*T equations:
        # Eq 1..T: P_in[t] - P_out[t] + P_dis[t] - P_ch[t] = Demand[t] - Gen[t]
        # Eq T+1: E[0] - eta_ch*dt*P_ch[0] + (dt/eta_dis)*P_dis[0] = E_init
        # Eq T+2..2T: E[t] - E[t-1] - eta_ch*dt*P_ch[t] + (dt/eta_dis)*P_dis[t] = 0
        A_eq = np.zeros((2 * T, N))
        b_eq = np.zeros(2 * T)

        for t in range(T):
            # Energy balance
            A_eq[t, t] = -1.0                    # -P_ch
            A_eq[t, T + t] = 1.0                 # +P_dis
            A_eq[t, 2 * T + t] = 1.0             # +P_in
            A_eq[t, 3 * T + t] = -1.0            # -P_out
            b_eq[t] = self.inputs.demand_kw[t] - self.inputs.generation_kw[t]

            # SoC dynamics
            row_soc = T + t
            A_eq[row_soc, t] = -eta_ch * dt      # -eta_ch * P_ch * dt
            A_eq[row_soc, T + t] = (1.0 / eta_dis) * dt # +(1/eta_dis) * P_dis * dt
            A_eq[row_soc, 4 * T + t] = 1.0       # +E[t]
            if t == 0:
                b_eq[row_soc] = e_init
            else:
                A_eq[row_soc, 4 * T + (t - 1)] = -1.0 # -E[t-1]
                b_eq[row_soc] = 0.0

        # ── 4. Inequality Constraints (Peak Demand Tracking) ───────────────
        # P_in[t] - P_peak <= 0  ==>  P_in[t] <= P_peak
        A_ub = np.zeros((T, N))
        b_ub = np.zeros(T)
        for t in range(T):
            A_ub[t, 2 * T + t] = 1.0             # +P_in[t]
            A_ub[t, P_PEAK_IDX] = -1.0          # -P_peak
            b_ub[t] = 0.0

        # ── 5. Run HiGHS Solver ───────────────────────────────────────────
        res = linprog(
            c,
            A_ub=A_ub,
            b_ub=b_ub,
            A_eq=A_eq,
            b_eq=b_eq,
            bounds=bounds,
            method="highs"
        )

        if not res.success:
            return {
                "success": False,
                "message": res.message,
                "status": res.status
            }

        x = res.x
        p_ch = np.round(x[0:T], 2).tolist()
        p_dis = np.round(x[T:2*T], 2).tolist()
        p_in = np.round(x[2*T:3*T], 2).tolist()
        p_out = np.round(x[3*T:4*T], 2).tolist()
        stored_e = np.round(x[4*T:5*T], 2).tolist()
        soc_pct = [round((e / cap) * 100.0, 1) for e in stored_e]
        p_peak = round(float(x[P_PEAK_IDX]), 2)

        # Extract shadow prices (duals) for energy balance equations
        # Marginals indicate marginal value of generation/demand at hour t
        shadow_prices = []
        if hasattr(res, "eqlin") and res.eqlin is not None and hasattr(res.eqlin, "marginals"):
            # Marginals for energy balance rows 0..T-1
            shadow_prices = np.round(res.eqlin.marginals[0:T], 2).tolist()

        # Compute Financial Accounting
        total_import_cost = sum(
            p_in[t] * dt * self.tariff.get_hourly_import_tariff(t % 24) for t in range(T)
        )
        total_export_revenue = sum(
            p_out[t] * dt * self.tariff.feed_in_export_inr_kwh for t in range(T)
        )
        total_degradation_cost = sum(
            (p_ch[t] + p_dis[t]) * dt * self.tariff.degradation_cost_inr_kwh for t in range(T)
        )
        peak_demand_charge = (p_peak * self.tariff.demand_charge_inr_kva_month) / 30.0
        total_net_cost = total_import_cost - total_export_revenue + total_degradation_cost + peak_demand_charge

        return {
            "success": True,
            "solver": "HiGHS-LP",
            "horizon_hours": T,
            "optimal_objective_inr": round(float(res.fun), 2),
            "financial_summary": {
                "total_import_cost_inr": round(total_import_cost, 2),
                "total_export_revenue_inr": round(total_export_revenue, 2),
                "total_degradation_cost_inr": round(total_degradation_cost, 2),
                "daily_peak_demand_charge_inr": round(peak_demand_charge, 2),
                "net_operating_cost_inr": round(total_net_cost, 2),
                "peak_grid_demand_kw": p_peak,
            },
            "dispatch_schedule": [
                {
                    "hour": t,
                    "pv_generation_kw": self.inputs.generation_kw[t],
                    "demand_kw": self.inputs.demand_kw[t],
                    "charge_kw": p_ch[t],
                    "discharge_kw": p_dis[t],
                    "grid_import_kw": p_in[t],
                    "grid_export_kw": p_out[t],
                    "stored_kwh": stored_e[t],
                    "soc_pct": soc_pct[t],
                    "tariff_rate_inr": self.tariff.get_hourly_import_tariff(t % 24),
                    "shadow_price_inr": shadow_prices[t] if t < len(shadow_prices) else 0.0,
                }
                for t in range(T)
            ]
        }

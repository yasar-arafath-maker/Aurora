# AURORA: Renewable Energy Yield Prediction & Grid Battery Storage Optimization Platform

> **"How much energy should the grid battery store today to prepare for tomorrow?"**

AURORA is a production-grade industrial SCADA and microgrid energy optimization platform designed to answer that single question within seconds. It pairs an isolated Machine Learning forecasting engine with a deterministic conservation-of-energy battery optimization engine and transparent natural-language operational explanations.

---

## 🏗 System Architecture

```
                                  AURORA PLATFORM
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       │                                 │                                 │
       ▼                                 ▼                                 ▼
1. METEOROLOGY &             2. ML FORECASTING ENGINE          3. DETERMINISTIC OPTIMIZATION
   SYNTHETIC SENSORS            (services/forecasting/)           (services/optimization/)
   • Solar Irradiance (POA)     • GradientBoosting (Solar)         • Deficit = Demand - Gen
   • Wind Speed (Anemometer)    • RandomForest (Wind)              • Usable = Deficit + Reserve
   • Diurnal Bell Curves        • Quantile Intervals (q10/q90)     • Efficiency Compensation (92%)
   • Weather Impact Cascade     • Authentic Validation (R²>0.94)   • Storage Headroom & Limits
       │                                 │                                 │
       └─────────────────────────────────┼─────────────────────────────────┘
                                         │
                                         ▼
                             4. NATURAL LANGUAGE ADVISOR
                                (services/advisor/)
                                Synthesizes operational directives
                                from mathematical derivations
                                         │
                                         ▼
                             5. FASTAPI REST BACKEND &
                                SCADA CONTROL ROOM UI
```

---

## ⚡ Key Features

1. **SCADA Command Center (`/`)**:
   - Primary question answered in seconds: Recommended charge (kWh), target SOC (%), and operational action (`CHARGE` / `DISCHARGE` / `HOLD`).
   - Live SVG Microgrid Power Flow Diagram with animated particle vectors.
   - Real-time animated counters: Solar kW, Wind kW, Total Generation kW, Facility Demand kW, Battery SOC %, and PCC Grid Export/Import.
   - 1-Click interactive launch to the 3D Solar Array Studio.

2. **3D Solar Array Twin & Photovoltaic Studio (`/solar`)**:
   - **1:1 Scale WebXR & Three.js r160 Photovoltaic Digital Twin**: Interactive 3D rooftop array simulator with camera pass-through and desktop 3D orbit.
   - **Advanced Optical & Thermal Physics**: FLIR Ironbow IR thermal heatmap shader modeling cell temperatures and real-time derating (-0.30%/°C).
   - **Aerodynamics & 3D HUDs**: 3D wind streamline velocity particles and floating per-module telemetry cards ($V_{mp}$, $I_{mp}$, Watts, cell temp).
   - **Rooftop Obstacle Shadowing**: Interactive 3D obstruction casting directional PBR shadows across strings with real-time mismatch loss calculations.
   - **Photovoltaic Architecture Catalogue**: N-Type TOPCon (24.0% eff), Bifacial Dual-Glass (22.8% front + 30% albedo gain), Advanced Mono PERC, Ultra Monocrystalline, High-Temp Thin-Film CdTe, and Legacy Polycrystalline.
   - **AI Solar Decision Advisor (MCDA + XAI)**: Multi-Criteria Decision Analysis evaluating surface albedo (White TPO 0.75, Concrete 0.20, Gravel 0.28, Metal 0.16) with transparent Explainable AI engineering rationale.
   - **Array Geometry & Tilt Builder**: Real-time slider controls for Columns, Rows, Pitch, and Tilt Angle with automatic snap to optimal latitude ($34^\circ$) and NEC 2023 perimeter setback verification.
   - **25-Year Lifecycle Economics & Carbon Offsetting**: Capex, Levelized Cost of Energy ($0.042/kWh LCOE), Payback Period, and Metric Tons $CO_2$ avoided.

3. **Machine Learning Generation Forecasting (`/forecast`)**:
   - 7-day multi-step generation vs. industrial demand profile.
   - Genuine model accuracy diagnostic board: MAE, RMSE, MAPE, and $R^2$ score against held-out validation test sets.
   - Prediction interval uncertainty bands with radial confidence score gauge.

3. **Battery Storage & Optimization Lab (`/battery`)**:
   - Real SCADA BESS container rack visualization with 16 modular cell trays, cell temperature, DC bus voltage, current, and state of health.
   - Interactive parameter sliders: Tomorrow Demand, Predicted Yield, Reserve Margin %, Starting SOC, and Battery Capacity.
   - Full Step-by-Step Algebraic Derivation Trace displaying equation, numerical substitution, result value, and engineering explanation for zero black-box transparency.

4. **Grid Interconnect & Substation Telemetry (`/grid`)**:
   - Single-line diagram: 33kV Point of Common Coupling (PCC), 400V 3-phase AC bus, microgrid synchronizer, and feeder breakers.
   - Live instruments: 50.02 Hz frequency monitor, 401.4V bus RMS voltage, 0.98 power factor, and IEEE 519 harmonic distortion (THD).

5. **Weather Impact Engine (`/weather`)**:
   - 5-stage visual cause-and-effect cascade: Atmosphere → Irradiance → Predicted Yield → Net Balance → Battery Decision.
   - 24-hour diurnal solar radiation curve and wind velocity profile.

6. **What-If Scenario Laboratory (`/scenario`)**:
   - Non-destructive stress simulation: Cloud cover %, wind speed, demand multiplier, irradiance scaling.
   - One-click extreme weather presets: Summer Heatwave, High Wind Gale, and Dunkelflaute.
   - Baseline vs. Scenario comparative KPI cards and overlay power curves.

7. **SCADA Operational Reports (`/reports`)**:
   - Daily, weekly, and monthly energy accounting ledgers.
   - One-click CSV export and PDF shift report downloads.

8. **Data Ingestion & Cleansing (`/data`)**:
   - Strict CSV time-series validator (`timestamp`, `solar_kw`, `wind_kw`, `demand_kw`, `temperature_c`, `cloud_cover_pct`).
   - Downloadable template and ingestion summary statistics.

9. **System Configuration & RBAC (`/settings`)**:
   - LiFePO4 nameplate constants (2.5 MWh, 625 kW charge limit, 92% one-way efficiency).
   - Grid code frequency/voltage trip ceilings and relay protection matrix.
   - Three authentication roles: Admin, Operator, Viewer.

---

## 🚀 Running the Application Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Start Backend Server (FastAPI)
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Start Frontend Server (Vite + React)
```powershell
cd frontend
npm run dev
```
- SCADA Control Room Web Interface: [http://localhost:5173](http://localhost:5173)

### Demo Credentials (One-Click in UI):
- **Admin**: `admin@aurora.grid` / `Admin@123`
- **Operator**: `operator@aurora.grid` / `Operator@123`
- **Viewer**: `viewer@aurora.grid` / `Viewer@123`

---

## 🧪 Automated Testing
Run backend unit and integration test suites:
```powershell
cd backend
.\venv\Scripts\python -m pytest tests/
```
All 13 test suites verify:
- Fast API REST routes (`test_api.py`)
- Machine learning model accuracy and multi-step prediction (`test_forecasting.py`)
- Strict deterministic mathematical formulas (`test_optimization.py`)

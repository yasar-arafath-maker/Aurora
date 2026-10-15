# AURORA Architecture & Engineering Decisions

This document records the foundational architectural decisions, assumptions, and engineering choices made for **AURORA: Renewable Energy Yield Prediction & Grid Battery Storage Optimization Platform**.

---

## 1. Stack & Runtime Environment

### Database Strategy: Async SQLAlchemy 2.0 with SQLite Dev Fallback
- **Target Specification:** PostgreSQL 15 with asyncpg and Alembic migrations.
- **Local Dev Decision:** For immediate turnkey execution and isolated testing in Windows environments without external Postgres daemon dependencies, the backend defaults to `sqlite+aiosqlite:///./aurora.db`. 
- **Portability:** All models, schemas, and queries adhere strictly to standard SQLAlchemy 2.0 async patterns (`AsyncSession`, `select`, `declarative_base`), enabling a single configuration string swap (`DATABASE_URL=postgresql+asyncpg://...`) to run against a production PostgreSQL instance.

### ML Service Placement: In-Process Isolated Module (`services/forecasting/`)
- **Decision:** As permitted by the spec, scikit-learn models run inside the FastAPI process within an isolated `services/forecasting/` module with a clean `predict(features) -> (value, confidence)` interface.
- **Future Separation:** The interface is decoupled from HTTP handlers, enabling seamless extraction into a standalone microservice or gRPC worker without modifying API contracts.

---

## 2. Integrity & Separation of Concerns

### Deterministic Battery Engine vs. ML vs. Natural Language
- **Forecasting (`services/forecasting/`):** Probabilistic inference predicting renewable yield (solar/wind kWh) based on meteorological features. Outputs expected yield and confidence intervals derived from ensemble variance / quantile bounds.
- **Optimization (`services/optimization/`):** Purely deterministic physical equations calculating deficit, reserve buffers, charging efficiency, inverter power limits, and battery headroom. No machine learning or neural networks participate in safety-critical battery dispatch decisions.
- **Advisor (`services/advisor/`):** Template-based explanation engine that synthesizes operational narratives strictly from computed numbers. The UI visibly tags advisor outputs with `[GENERATED EXPLANATION]` to preserve operational transparency.

### Honest Representation of Data
- All synthetic datasets generated in `demo_data/` are labeled with `source="demo"`.
- The frontend UI displays an active `[DEMO / SYNTHETIC DATA]` indicator in the status bar and on telemetry cards to comply with the non-negotiable honesty rule.

---

## 3. Design System & Frontend Architecture

### SCADA / Industrial Control-Room Aesthetic
- Primary base color: `--bg: #0a1012` (graphite near-black), `--panel: #10191c`, with hairline borders (`#233034`).
- Accent tokens: `--teal: #22e6c4` (renewables), `--amber: #ffb238` (battery/warnings), `--blue: #5fa8ff` (grid), `--red: #ff6b5e` (deficit), `--green: #63d98a` (surplus).
- Typography: `Space Grotesk` for headings and UI controls; `IBM Plex Mono` for all numeric instrumentation, readouts, and formulas.
- Data presentation: Custom SVG visualizations (animated battery cells, particle-flow energy lines, power-flow busbar) instead of generic icon-packs.

---

## 4. Role-Based Access Control (RBAC)
- **Roles:**
  - `admin`: Full access, including user management, battery physical constant reconfiguration, and data uploads.
  - `operator`: Can trigger optimization overrides, run what-if simulations, adjust operational setpoints, and export reports.
  - `viewer`: Read-only telemetry, dashboards, and reports; operational controls and setpoint sliders are disabled.

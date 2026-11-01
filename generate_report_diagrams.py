# -*- coding: utf-8 -*-
"""
Generates clean architectural, DFD, and UML diagrams for the AURORA Project Report.
"""
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

output_dir = r"c:\Users\athit\.gemini\antigravity-ide\scratch\aurora\report_figures"
os.makedirs(output_dir, exist_ok=True)

plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['figure.dpi'] = 300

# 1. System Architecture Diagram (Figure 4.1)
fig, ax = plt.subplots(figsize=(10.5, 6.2), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Outer container
outer = patches.FancyBboxPatch((2, 2), 96, 96, boxstyle="round,pad=1.5,rounding_size=2",
                              facecolor="#f8fafc", edgecolor="#0f172a", linewidth=2)
ax.add_patch(outer)
ax.text(50, 94, "AURORA PLATFORM ARCHITECTURE", ha='center', va='center', fontsize=14, fontweight='bold', color='#0f172a')

# Tier 1: Meteorology & Synthetic Sensors
t1 = patches.FancyBboxPatch((5, 68), 26, 20, boxstyle="round,pad=1,rounding_size=1.5",
                           facecolor="#e0f2fe", edgecolor="#0284c7", linewidth=1.5)
ax.add_patch(t1)
ax.text(18, 83, "1. METEOROLOGY & SENSORS", ha='center', va='center', fontsize=9, fontweight='bold', color='#0369a1')
ax.text(18, 77, "• Solar Irradiance (POA W/m²)\n• Wind Velocity (Anemometer)\n• Temperature & Humidity\n• Harmonic Diurnal Encodings", ha='center', va='center', fontsize=8, color='#0f172a')

# Tier 2: ML Forecasting Engine
t2 = patches.FancyBboxPatch((37, 68), 26, 20, boxstyle="round,pad=1,rounding_size=1.5",
                           facecolor="#fef3c7", edgecolor="#d97706", linewidth=1.5)
ax.add_patch(t2)
ax.text(50, 83, "2. ML FORECASTING ENGINE", ha='center', va='center', fontsize=9, fontweight='bold', color='#b45309')
ax.text(50, 77, "• GradientBoosting (Solar)\n• RandomForest (Wind)\n• Quantile Regressors (q10/q90)\n• Validation R² > 0.94, MAE<15kW", ha='center', va='center', fontsize=8, color='#0f172a')

# Tier 3: Deterministic Optimization
t3 = patches.FancyBboxPatch((69, 68), 26, 20, boxstyle="round,pad=1,rounding_size=1.5",
                           facecolor="#dcfce7", edgecolor="#16a34a", linewidth=1.5)
ax.add_patch(t3)
ax.text(82, 83, "3. DETERMINISTIC OPTIMIZER", ha='center', va='center', fontsize=9, fontweight='bold', color='#15803d')
ax.text(82, 77, "• Deficit = Demand - Gen\n• Usable = Deficit + Reserve\n• 92% Efficiency Compensation\n• 10% Floor, 95% Ceiling, 625kW", ha='center', va='center', fontsize=8, color='#0f172a')

# Tier 4: Natural Language Advisor
t4 = patches.FancyBboxPatch((20, 38), 60, 18, boxstyle="round,pad=1,rounding_size=1.5",
                           facecolor="#f3e8ff", edgecolor="#9333ea", linewidth=1.5)
ax.add_patch(t4)
ax.text(50, 50, "4. EXPLAINABLE NATURAL LANGUAGE ADVISOR (XAI)", ha='center', va='center', fontsize=10, fontweight='bold', color='#7e22ce')
ax.text(50, 43, "Synthesizes mathematical derivation traces into clear operational directives\n(CHARGE / DISCHARGE / HOLD) with zero black-box vulnerability", ha='center', va='center', fontsize=8.5, color='#0f172a')

# Tier 5: FastAPI REST Backend & SCADA UI + 3D WebXR Digital Twin
t5a = patches.FancyBboxPatch((5, 8), 42, 20, boxstyle="round,pad=1,rounding_size=1.5",
                            facecolor="#f1f5f9", edgecolor="#475569", linewidth=1.5)
ax.add_patch(t5a)
ax.text(26, 23, "5A. FASTAPI REST BACKEND", ha='center', va='center', fontsize=9.5, fontweight='bold', color='#334155')
ax.text(26, 16, "• Async SQLAlchemy 2.0 Engine\n• Strict Pydantic Data Contracts\n• Role-Based Access Control (RBAC)\n• Sub-10ms REST Execution", ha='center', va='center', fontsize=8, color='#0f172a')

t5b = patches.FancyBboxPatch((53, 8), 42, 20, boxstyle="round,pad=1,rounding_size=1.5",
                            facecolor="#ffedd5", edgecolor="#ea580c", linewidth=1.5)
ax.add_patch(t5b)
ax.text(74, 23, "5B. SCADA CONTROL & 3D WEBXR", ha='center', va='center', fontsize=9.5, fontweight='bold', color='#c2410c')
ax.text(74, 16, "• Live SVG Power Flow Vectors\n• Three.js 1:1 Scale Rooftop Twin\n• FLIR Ironbow IR Shader (-0.30%/°C)\n• Obstacle Shading & MCDA Albedo", ha='center', va='center', fontsize=8, color='#0f172a')

# Connecting Arrows
arrow_kw = dict(arrowstyle="->", lw=1.8, color="#0f172a")
ax.annotate("", xy=(50, 68), xytext=(50, 56), arrowprops=arrow_kw)
ax.annotate("", xy=(18, 68), xytext=(35, 56), arrowprops=arrow_kw)
ax.annotate("", xy=(82, 68), xytext=(65, 56), arrowprops=arrow_kw)
ax.annotate("", xy=(30, 28), xytext=(35, 38), arrowprops=arrow_kw)
ax.annotate("", xy=(70, 28), xytext=(65, 38), arrowprops=arrow_kw)

plt.tight_layout()
arch_path = os.path.join(output_dir, "fig4_1_system_architecture.png")
fig.savefig(arch_path)
plt.close()
print(f"Generated: {arch_path}")

# 2. Level 1 Data Flow Diagram (DFD)
fig, ax = plt.subplots(figsize=(10.5, 5.5), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Entities
def draw_entity(x, y, text, color="#3b82f6"):
    p = patches.Rectangle((x-10, y-6), 20, 12, facecolor="#eff6ff", edgecolor=color, linewidth=2)
    ax.add_patch(p)
    ax.text(x, y, text, ha='center', va='center', fontsize=8.5, fontweight='bold', color=color)

def draw_process(x, y, num, text, color="#059669"):
    p = patches.FancyBboxPatch((x-12, y-7), 24, 14, boxstyle="round,pad=0.5,rounding_size=3",
                              facecolor="#ecfdf5", edgecolor=color, linewidth=1.8)
    ax.add_patch(p)
    ax.text(x, y+2.5, f"[{num}]", ha='center', va='center', fontsize=8, fontweight='bold', color='#047857')
    ax.text(x, y-2, text, ha='center', va='center', fontsize=8, fontweight='bold', color='#0f172a')

def draw_store(x, y, text):
    line1 = plt.Line2D([x-12, x+12], [y+5, y+5], color="#64748b", lw=2)
    line2 = plt.Line2D([x-12, x+12], [y-5, y-5], color="#64748b", lw=2)
    ax.add_line(line1)
    ax.add_line(line2)
    ax.text(x, y, text, ha='center', va='center', fontsize=8, fontweight='bold', color='#334155')

draw_entity(12, 80, "Weather Station\n& Telemetry", "#1e40af")
draw_entity(12, 20, "SCADA Control\nRoom Operator", "#b45309")
draw_entity(88, 50, "BESS Battery\nInverter Hardware", "#15803d")

draw_process(38, 80, "1.0", "Ingest & Normalize\nMeteorological Data")
draw_process(65, 80, "2.0", "Forecast Yield &\nQuantile Intervals")
draw_process(65, 50, "3.0", "Execute Deterministic\nEnergy Optimization")
draw_process(38, 20, "4.0", "Synthesize Explanations\n& Render SCADA Twin")

draw_store(38, 50, "D1: Historical Telemetry\n& Model Weights")

# Arrows
arr = dict(arrowstyle="->", lw=1.5, color="#1e293b")
ax.annotate("Raw Met Data", xy=(26, 80), xytext=(22, 80), arrowprops=arr, fontsize=7.5)
ax.annotate("Feature Vector", xy=(53, 80), xytext=(50, 80), arrowprops=arr, fontsize=7.5)
ax.annotate("Yield Forecast (kWh)", xy=(65, 64), xytext=(65, 73), arrowprops=arr, fontsize=7.5)
ax.annotate("Dispatch Directives", xy=(77, 50), xytext=(76, 50), arrowprops=arr, fontsize=7.5)
ax.annotate("Hardware Feedback", xy=(76, 46), xytext=(78, 46), arrowprops=arr, fontsize=7.5)
ax.annotate("Derivation Trace", xy=(53, 30), xytext=(58, 43), arrowprops=arr, fontsize=7.5)
ax.annotate("Operational Actions", xy=(22, 20), xytext=(26, 20), arrowprops=arr, fontsize=7.5)
ax.annotate("Manual Setpoint", xy=(26, 24), xytext=(22, 24), arrowprops=arr, fontsize=7.5)

ax.set_title("Figure 4.2: Level 1 Functional Data Flow Diagram (DFD) of AURORA", fontsize=11, fontweight='bold', pad=12)
plt.tight_layout()
dfd_path = os.path.join(output_dir, "fig4_2_dfd_level1.png")
fig.savefig(dfd_path)
plt.close()
print(f"Generated: {dfd_path}")

# 3. Single-Line Substation Electrical Diagram (Figure 4.9)
fig, ax = plt.subplots(figsize=(10, 5.0), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Busbars
# 33kV PCC Busbar
pcc_bus = plt.Line2D([10, 90], [80, 80], color="#dc2626", lw=4)
ax.add_line(pcc_bus)
ax.text(50, 84, "33 kV Medium Voltage Point of Common Coupling (PCC) Grid Interconnect", ha='center', va='center', fontsize=10, fontweight='bold', color='#dc2626')

# 400V Low Voltage Busbar
lv_bus = plt.Line2D([10, 90], [35, 35], color="#2563eb", lw=4)
ax.add_line(lv_bus)
ax.text(50, 29, "400 V / 3-Phase Low Voltage Synchronized AC Microgrid Busbar (50.02 Hz)", ha='center', va='center', fontsize=10, fontweight='bold', color='#2563eb')

# Step-down Transformer
def draw_transformer(x, y):
    c1 = patches.Circle((x, y+4), 4.5, facecolor="none", edgecolor="#0f172a", lw=2)
    c2 = patches.Circle((x, y-4), 4.5, facecolor="none", edgecolor="#0f172a", lw=2)
    ax.add_patch(c1)
    ax.add_patch(c2)
    ax.text(x+9, y, "33kV / 400V\n2.5 MVA Trafo", ha='left', va='center', fontsize=8, fontweight='bold')

draw_transformer(50, 58)
ax.annotate("", xy=(50, 78), xytext=(50, 67), arrowprops=dict(arrowstyle="-", lw=2, color="#0f172a"))
ax.annotate("", xy=(50, 48), xytext=(50, 37), arrowprops=dict(arrowstyle="-", lw=2, color="#0f172a"))

# Elements connected to 400V Bus
def draw_feeder(x, label, icon_type, color="#059669"):
    # Circuit breaker
    cb = patches.Rectangle((x-2.5, 20), 5, 5, facecolor="white", edgecolor="#0f172a", lw=1.5)
    ax.add_patch(cb)
    ax.plot([x-2.5, x+2.5], [20, 25], color="#0f172a", lw=1.5) # open/closed switch
    ax.plot([x, x], [35, 25], color="#0f172a", lw=2)
    ax.plot([x, x], [20, 10], color="#0f172a", lw=2)
    box = patches.FancyBboxPatch((x-8, 2), 16, 8, boxstyle="round,pad=0.3", facecolor="#f8fafc", edgecolor=color, lw=1.8)
    ax.add_patch(box)
    ax.text(x, 6, label, ha='center', va='center', fontsize=8, fontweight='bold', color=color)

draw_feeder(18, "Solar PV Inverter\n(850 kWp)", "solar", "#0284c7")
draw_feeder(38, "Wind Turbine Inverter\n(500 kWp)", "wind", "#0d9488")
draw_feeder(62, "2.5MWh LiFePO4 BESS\n(625 kW Bi-directional)", "bess", "#16a34a")
draw_feeder(82, "Facility Critical\nLoad (650 kW)", "load", "#ea580c")

ax.set_title("Figure 4.9: Single-Line Substation Electrical Diagram (33kV PCC & 400V Microgrid Bus)", fontsize=11, fontweight='bold', pad=12)
plt.tight_layout()
sld_path = os.path.join(output_dir, "fig4_9_single_line_diagram.png")
fig.savefig(sld_path)
plt.close()
print(f"Generated: {sld_path}")

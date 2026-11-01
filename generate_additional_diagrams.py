# -*- coding: utf-8 -*-
"""
Generates remaining diagram figures: Use Case, Meteorological Cascade, SCADA UI mockup, and 3D Twin mockup.
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

# 1. Use Case Diagram (Figure 4.3)
fig, ax = plt.subplots(figsize=(10.5, 6.0), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# System Boundary
sys_box = patches.Rectangle((28, 5), 52, 90, facecolor="#f8fafc", edgecolor="#0f172a", lw=2)
ax.add_patch(sys_box)
ax.text(54, 91, "AURORA SCADA PLATFORM SYSTEM BOUNDARY", ha='center', va='center', fontsize=11, fontweight='bold', color="#0f172a")

# Actors
def draw_actor(x, y, name, color="#1e40af"):
    # Head
    c = patches.Circle((x, y+5), 2.2, facecolor="#eff6ff", edgecolor=color, lw=1.8)
    ax.add_patch(c)
    # Body
    ax.plot([x, x], [y+2.8, y-3], color=color, lw=2)
    # Arms
    ax.plot([x-3, x+3], [y+1, y+1], color=color, lw=2)
    # Legs
    ax.plot([x, x-2.5], [y-3, y-8], color=color, lw=2)
    ax.plot([x, x+2.5], [y-3, y-8], color=color, lw=2)
    ax.text(x, y-11, name, ha='center', va='center', fontsize=8.5, fontweight='bold', color=color)

draw_actor(12, 75, "System Admin", "#b91c1c")
draw_actor(12, 45, "Control Room\nOperator", "#0284c7")
draw_actor(12, 18, "Substation\nViewer", "#475569")
draw_actor(90, 50, "BESS Inverter\nHardware / Grid", "#15803d")

# Use Cases (Ellipses)
use_cases = [
    (54, 82, "UC1: Configure LiFePO4 Nameplate Constants"),
    (54, 70, "UC2: Ingest Meteorological Time-Series Data"),
    (54, 58, "UC3: Execute Next-Day Yield & Quantile Forecast"),
    (54, 46, "UC4: Run Deterministic Battery Dispatch Optimizer"),
    (54, 34, "UC5: Inspect Explainable XAI Derivation Trace"),
    (54, 22, "UC6: Simulate Extreme What-If Scenarios"),
    (54, 10, "UC7: View SCADA Telemetry & 3D WebXR Twin")
]

for (ux, uy, utext) in use_cases:
    el = patches.Ellipse((ux, uy), 46, 8, facecolor="#ffffff", edgecolor="#334155", lw=1.5)
    ax.add_patch(el)
    ax.text(ux, uy, utext, ha='center', va='center', fontsize=8, fontweight='bold', color="#1e293b")

# Actor-UC Associations
arr_kw = dict(arrowstyle="-", lw=1.2, color="#64748b")
# Admin links
ax.annotate("", xy=(33, 82), xytext=(16, 75), arrowprops=arr_kw)
ax.annotate("", xy=(33, 70), xytext=(16, 75), arrowprops=arr_kw)
ax.annotate("", xy=(33, 58), xytext=(16, 75), arrowprops=arr_kw)
# Operator links
ax.annotate("", xy=(33, 58), xytext=(16, 45), arrowprops=arr_kw)
ax.annotate("", xy=(33, 46), xytext=(16, 45), arrowprops=arr_kw)
ax.annotate("", xy=(33, 34), xytext=(16, 45), arrowprops=arr_kw)
ax.annotate("", xy=(33, 22), xytext=(16, 45), arrowprops=arr_kw)
ax.annotate("", xy=(33, 10), xytext=(16, 45), arrowprops=arr_kw)
# Viewer links
ax.annotate("", xy=(33, 10), xytext=(16, 18), arrowprops=arr_kw)
# Hardware links
ax.annotate("", xy=(75, 46), xytext=(86, 50), arrowprops=arr_kw)

ax.set_title("Figure 4.3: UML Use Case Diagram for AURORA Platform Roles", fontsize=11, fontweight='bold', pad=12)
plt.tight_layout()
fig.savefig(os.path.join(output_dir, "fig4_3_use_case_diagram.png"))
plt.close()

# 2. Meteorological Impact Cascade (Figure 4.5)
fig, ax = plt.subplots(figsize=(10.5, 3.8), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

stages = [
    (10, 50, "STAGE 1\nATMOSPHERE", "Cloud Cover (CF)\nWind Velocity (v)\nAmbient Temp (T)", "#e0f2fe", "#0284c7"),
    (30, 50, "STAGE 2\nIRRADIANCE", "Plane-of-Array POA\nSolar Zenith Angle\nDynamic Albedo", "#fef3c7", "#d97706"),
    (50, 50, "STAGE 3\nPREDICTED YIELD", "Solar Yield GBR\nWind Yield RF\nQuantiles q10/q90", "#dcfce7", "#16a34a"),
    (70, 50, "STAGE 4\nNET BALANCE", "Deficit = Demand - Gen\nUncertainty Reserve\nUsable Energy", "#f3e8ff", "#9333ea"),
    (90, 50, "STAGE 5\nDISPATCH DECISION", "Charge E_rec (kWh)\nTarget SOC %\n[CHARGE / HOLD]", "#ffe4e6", "#e11d48")
]

for (sx, sy, stitle, sdesc, bg, edge) in stages:
    box = patches.FancyBboxPatch((sx-9, sy-35), 18, 70, boxstyle="round,pad=0.5,rounding_size=2",
                                facecolor=bg, edgecolor=edge, lw=1.8)
    ax.add_patch(box)
    ax.text(sx, sy+20, stitle, ha='center', va='center', fontsize=8.5, fontweight='bold', color=edge)
    ax.plot([sx-7, sx+7], [sy+8, sy+8], color=edge, lw=1)
    ax.text(sx, sy-10, sdesc, ha='center', va='center', fontsize=7.5, color="#0f172a")

for i in range(len(stages)-1):
    x1 = stages[i][0] + 9
    x2 = stages[i+1][0] - 9
    ax.annotate("", xy=(x2, 50), xytext=(x1, 50), arrowprops=dict(arrowstyle="->", lw=2, color="#0f172a"))

ax.set_title("Figure 4.5: 5-Stage Cause-and-Effect Meteorological Impact Cascade Flowchart", fontsize=11, fontweight='bold', pad=12)
plt.tight_layout()
fig.savefig(os.path.join(output_dir, "fig4_5_meteorological_cascade.png"))
plt.close()

# 3. SCADA Command Center UI Visual Representation (Figure 5.1)
fig, ax = plt.subplots(figsize=(10.5, 5.2), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Dark screen background
bg_rect = patches.Rectangle((2, 2), 96, 96, facecolor="#0a1012", edgecolor="#22e6c4", lw=2)
ax.add_patch(bg_rect)

# Top Bar
ax.text(5, 93, "AURORA SCADA // INDUSTRIAL ENERGY COMMAND CENTER", fontsize=10, fontweight='bold', color="#22e6c4")
ax.text(95, 93, "GRID: 50.02 Hz | BUS: 401.4 V | LIVE TELEMETRY", ha='right', fontsize=8, color="#94a3b8")
ax.plot([5, 95], [89, 89], color="#233034", lw=1)

# Left Panel: Power Flow SVG schematic
flow_box = patches.Rectangle((5, 12), 52, 73, facecolor="#10191c", edgecolor="#233034", lw=1.5)
ax.add_patch(flow_box)
ax.text(31, 80, "LIVE SVG MICROGRID POWER FLOW BUSBAR", ha='center', fontsize=8.5, fontweight='bold', color="#5fa8ff")
# Power flow icons inside
ax.text(12, 65, "SOLAR PV\n850 kWp\n(750 kW Gen)", ha='center', fontsize=7.5, color="#22e6c4", bbox=dict(facecolor="#18272b", edgecolor="#22e6c4", pad=3))
ax.text(12, 35, "WIND TURBINE\n500 kWp\n(400 kW Gen)", ha='center', fontsize=7.5, color="#5fa8ff", bbox=dict(facecolor="#18272b", edgecolor="#5fa8ff", pad=3))
ax.text(48, 65, "COMMERCIAL LOAD\n650 kW Demand\n(1,840 kWh Total)", ha='center', fontsize=7.5, color="#ffb238", bbox=dict(facecolor="#18272b", edgecolor="#ffb238", pad=3))
ax.text(48, 35, "2.5 MWh LiFePO4 BESS\nSOC: 58.1%\n(+225 kW Charge)", ha='center', fontsize=7.5, color="#63d98a", bbox=dict(facecolor="#18272b", edgecolor="#63d98a", pad=3))

# Arrows
ax.annotate("", xy=(30, 50), xytext=(22, 65), arrowprops=dict(arrowstyle="->", lw=2, color="#22e6c4"))
ax.annotate("", xy=(30, 50), xytext=(22, 35), arrowprops=dict(arrowstyle="->", lw=2, color="#5fa8ff"))
ax.annotate("", xy=(38, 65), xytext=(30, 50), arrowprops=dict(arrowstyle="->", lw=2, color="#ffb238"))
ax.annotate("", xy=(38, 35), xytext=(30, 50), arrowprops=dict(arrowstyle="->", lw=2, color="#63d98a"))

# Right Panel: Primary Operational Directive Box
op_box = patches.Rectangle((60, 48), 35, 37, facecolor="#10191c", edgecolor="#ffb238", lw=1.8)
ax.add_patch(op_box)
ax.text(77.5, 80, "PRIMARY QUESTION ANSWERED", ha='center', fontsize=8, fontweight='bold', color="#ffb238")
ax.text(77.5, 72, "RECOMMENDED CHARGE: 900 kWh", ha='center', fontsize=9, fontweight='bold', color="#22e6c4")
ax.text(77.5, 65, "ACTION: [ CHARGE BATTERY ]", ha='center', fontsize=9, fontweight='bold', color="#63d98a")
ax.text(77.5, 58, "Target SOC: 58.1% (Safe Headroom)", ha='center', fontsize=7.5, color="#f8fafc")
ax.text(77.5, 52, "Inverter Rate: 225 kW / 4.0h (Limit 625 kW)", ha='center', fontsize=7, color="#94a3b8")

# Right Lower Panel: XAI Natural Language Advisor Output
adv_box = patches.Rectangle((60, 12), 35, 32, facecolor="#10191c", edgecolor="#5fa8ff", lw=1.5)
ax.add_patch(adv_box)
ax.text(77.5, 39, "NATURAL LANGUAGE ADVISOR (XAI)", ha='center', fontsize=7.5, fontweight='bold', color="#5fa8ff")
adv_txt = "\"Tomorrow's demand of 1,840 kWh exceeds\npredicted yield by 690 kWh. Adding 138 kWh\nuncertainty reserve buffer and adjusting for\n92% efficiency dictates gross 900 kWh\noff-peak charge. Post-charge SOC: 58.1%.\""
ax.text(77.5, 23, adv_txt, ha='center', fontsize=6.8, style='italic', color="#e2e8f0")

ax.set_title("Figure 5.1: Industrial Dark-Mode SCADA Command Center UI and Live Telemetry Flow", fontsize=11, fontweight='bold', pad=12)
plt.tight_layout()
fig.savefig(os.path.join(output_dir, "fig5_1_scada_command_center.png"))
plt.close()

# 4. 3D WebXR Photovoltaic Digital Twin UI Mockup (Figure 5.2)
fig, ax = plt.subplots(figsize=(10.5, 5.0), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

bg3d = patches.Rectangle((2, 2), 96, 96, facecolor="#090d16", edgecolor="#38bdf8", lw=2)
ax.add_patch(bg3d)

ax.text(5, 93, "3D WEBXR PHOTOVOLTAIC DIGITAL TWIN // THREE.JS r160 ENGINE", fontsize=10, fontweight='bold', color="#38bdf8")
ax.text(95, 93, "FLIR IRONBOW SHADER | 60 FPS | 1:1 SCALE", ha='right', fontsize=8, color="#94a3b8")
ax.plot([5, 95], [89, 89], color="#1e293b", lw=1)

# Center: 3D Rooftop Grid Representation
roof = patches.Polygon([[20, 25], [80, 25], [92, 65], [32, 65]], facecolor="#1e293b", edgecolor="#475569", lw=1.5)
ax.add_patch(roof)
ax.text(56, 28, "Simulated Rooftop Surface (White TPO Membrane: Albedo α = 0.75)", ha='center', fontsize=7.5, color="#cbd5e1")

# Solar panels on roof with FLIR thermal false colors
for row_i in range(3):
    for col_j in range(5):
        px = 32 + col_j * 10 + row_i * 3
        py = 35 + row_i * 9
        # thermal color gradient
        col = "#dc2626" if (row_i==1 and col_j==2) else ("#ea580c" if row_i==2 else "#f59e0b")
        p_module = patches.Polygon([[px, py], [px+7, py], [px+9, py+6], [px+2, py+6]], facecolor=col, edgecolor="#0f172a", lw=1)
        ax.add_patch(p_module)

# Floating 3D Telemetry HUD
hud = patches.FancyBboxPatch((55, 68), 38, 18, boxstyle="round,pad=0.3", facecolor="#0f172a", edgecolor="#22e6c4", lw=1.5)
ax.add_patch(hud)
ax.text(74, 80, "PER-MODULE TELEMETRY HUD", ha='center', fontsize=7.5, fontweight='bold', color="#22e6c4")
ax.text(74, 73, "Tech: N-Type TOPCon | Eff: 24.0% | Temp: 48.2°C", ha='center', fontsize=7, color="#f8fafc")
ax.text(74, 67, "V_mp: 42.8V | I_mp: 13.55A | Derating: -0.30%/°C", ha='center', fontsize=7, color="#94a3b8")

# Obstacle casting shadow
obs = patches.Polygon([[26, 48], [31, 48], [31, 62], [26, 62]], facecolor="#64748b", edgecolor="#0f172a", lw=1)
ax.add_patch(obs)
shdw = patches.Polygon([[31, 48], [44, 45], [44, 55], [31, 62]], facecolor="#050811", alpha=0.7)
ax.add_patch(shdw)
ax.text(28, 65, "HVAC Chiller\nObstruction", ha='center', fontsize=6.5, color="#f8fafc")
ax.text(37, 49, "Raytraced\nShadow", ha='center', fontsize=6, color="#94a3b8")

ax.set_title("Figure 5.2: 1:1 Scale WebXR 3D Photovoltaic Digital Twin with FLIR Thermal Derating Shader", fontsize=11, fontweight='bold', pad=12)
plt.tight_layout()
fig.savefig(os.path.join(output_dir, "fig5_2_3d_webxr_digital_twin.png"))
plt.close()

print("All additional diagram figures successfully generated!")

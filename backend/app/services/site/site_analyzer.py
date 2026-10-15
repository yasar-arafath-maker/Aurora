"""
Site Analysis, Land Diagnostic & Layout Optimization Engine
===========================================================
Analyzes geographical, meteorological, and land imagery characteristics
to diagnose civil/electrical hurdles and generate parametric solar + BESS layouts.
"""
import math
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

def estimate_solar_resource(latitude: float, longitude: float) -> Dict[str, float]:
    """
    Estimate Global Horizontal Irradiance (GHI), Direct Normal Irradiance (DNI),
    and annual specific yield based on geographical coordinates.
    """
    # Tropical and sunbelt regions receive higher insolation
    abs_lat = abs(latitude)
    # Peak solar hours estimate (kWh/m2/day)
    base_psh = 5.6 - (abs_lat / 90.0) * 2.2
    # Specific yield in kWh/kWp/year
    specific_yield = base_psh * 365 * 0.78  # 78% Performance Ratio
    
    return {
        "latitude": latitude,
        "longitude": longitude,
        "peak_sun_hours_per_day": round(base_psh, 2),
        "annual_specific_yield_kwh_kwp": round(specific_yield, 1),
        "avg_daily_ghi_kwh_m2": round(base_psh, 2),
        "optimal_tilt_angle_deg": round(max(10.0, min(35.0, abs_lat * 0.9)), 1),
        "azimuth_deg": 180.0 if latitude >= 0 else 0.0, # True South in Northern hemisphere
    }

def diagnose_land_problems(
    area_sqm: float,
    slope_deg: float = 3.5,
    soil_type: str = "red_loam",
    substation_distance_km: float = 2.4,
    vegetation_density_pct: float = 25.0,
    shading_obstruction_pct: float = 12.0
) -> Dict[str, Any]:
    """
    Diagnose engineering and civil problems of the land site and provide
    concrete, actionable remediation protocols.
    """
    problems: List[Dict[str, Any]] = []
    remediations: List[Dict[str, Any]] = []
    
    # 1. Slope and Grading Analysis
    if slope_deg > 7.0:
        problems.append({
            "category": "Civil & Terrain",
            "severity": "CRITICAL",
            "title": "Excessive Ground Slope (>7°)",
            "description": f"Slope measured at {slope_deg}°. Risk of inter-row self-shading, severe soil erosion during heavy monsoons, and foundation drift.",
            "impact": "Requires terraced earthmoving or single-axis tracker terrain-following mounting."
        })
        remediations.append({
            "step": 1,
            "action": "Grading & Terracing Protocol",
            "details": "Deploy hydraulic motor graders to cut-and-fill slope down to <5°. Establish concrete retention swales along north-south contours.",
            "est_cost_per_acre_usd": 3200
        })
    elif slope_deg > 3.0:
        problems.append({
            "category": "Civil & Terrain",
            "severity": "WARNING",
            "title": "Moderate Gradient (3°-7°)",
            "description": f"Gentle slope of {slope_deg}°. Requires aligned pile ramming depths to ensure uniform module tilt.",
            "impact": "Minor civil levelling and storm-water drainage trenches required."
        })
        remediations.append({
            "step": 1,
            "action": "Contour Stormwater Drainage",
            "details": "Excavate 1.2m perimeter trenches and 0.8m internal ditch lines to divert surface rainwater away from inverter pads.",
            "est_cost_per_acre_usd": 1500
        })
    else:
        remediations.append({
            "step": 1,
            "action": "Standard Surface Clearing",
            "details": "Light grading and weed brush clearing. Site is naturally flat with optimal drainage profile.",
            "est_cost_per_acre_usd": 800
        })

    # 2. Shading & Obstacle Analysis
    if shading_obstruction_pct > 15.0:
        problems.append({
            "category": "Solar Yield",
            "severity": "CRITICAL",
            "title": "Severe Shading Horizon (>15%)",
            "description": f"Tree lines, structures, or rocky bluffs obstruct {shading_obstruction_pct}% of the solar azimuth window.",
            "impact": "Up to 18.5% annual energy loss and hot-spot risks on series bypass diodes."
        })
        remediations.append({
            "step": 2,
            "action": "Buffer Clearance & Tree Trimming",
            "details": "Maintain a minimum 25-meter setback buffer from eastern and western tree lines. Prune tall canopy trees.",
            "est_cost_per_acre_usd": 1800
        })
    elif shading_obstruction_pct > 5.0:
        problems.append({
            "category": "Solar Yield",
            "severity": "INFO",
            "title": "Peripheral Shading Obstacles",
            "description": f"Minor obstruction of {shading_obstruction_pct}% on boundary perimeter.",
            "impact": "Negligible if standard 10m setback buffer is enforced in layout."
        })
        remediations.append({
            "step": 2,
            "action": "Setback Buffer Enforcement",
            "details": "Incorporate a 10m perimeter safety buffer inside the boundary fence. Keep string combiners outside shade zones.",
            "est_cost_per_acre_usd": 400
        })

    # 3. Soil & Foundation Mechanics
    if soil_type in ["rocky", "hard_rock"]:
        problems.append({
            "category": "Structural & Foundation",
            "severity": "WARNING",
            "title": "Hard Bedrock / High Pile Resistance",
            "description": "Standard hydraulic pile-driving will hit refusal. Risk of bent galvanized steel posts.",
            "impact": "Standard ramming impossible. Requires pre-drilling or ground-cast concrete ballast."
        })
        remediations.append({
            "step": 3,
            "action": "Rotary Pre-Drilling & Micropile Anchors",
            "details": "Pre-drill 150mm pilot boreholes to 1.8m depth using DTH pneumatic rigs. Grout galvanized H-beams with non-shrink structural cement.",
            "est_cost_per_acre_usd": 4200
        })
    elif soil_type in ["clay", "black_cotton", "loose_sand"]:
        problems.append({
            "category": "Structural & Foundation",
            "severity": "WARNING",
            "title": "Expansive / Low Bearing Capacity Soil",
            "description": "Soil swells during monsoons and shrinks during summer dry spells. Risk of foundation heave and rack misalignment.",
            "impact": "Requires deeper ramming (>2.2m) or helical screw piles."
        })
        remediations.append({
            "step": 3,
            "action": "Helical Screw Ground Anchors",
            "details": "Install twin-helix hot-dip galvanized steel ground screws to penetrate past active seasonal moisture depth.",
            "est_cost_per_acre_usd": 2900
        })
    else:
        remediations.append({
            "step": 3,
            "action": "Standard Hydraulic Pile Ramming",
            "details": "Direct ramming of C-channel or H-beam galvanized steel piles to 1.6m depth with pull-out testing.",
            "est_cost_per_acre_usd": 1200
        })

    # 4. Grid Evacuation & Substation Connectivity
    if substation_distance_km > 5.0:
        problems.append({
            "category": "Grid Interconnection",
            "severity": "CRITICAL",
            "title": "Distant Substation Interconnection (>5 km)",
            "description": f"Nearest grid substation is {substation_distance_km} km away. 11kV evacuation will suffer >4.5% line $I^2R$ transmission loss.",
            "impact": "Requires stepping up to 33kV dedicated overhead transmission feeder, increasing interconnection CAPEX."
        })
        remediations.append({
            "step": 4,
            "action": "33kV Step-Up Substation & Transmission Feeder",
            "details": "Install 33kV outdoor switchyard transformer at plant boundary. Construct dedicated 33kV double-circuit overhead line with ABT meters.",
            "est_cost_per_acre_usd": 6500
        })
    else:
        remediations.append({
            "step": 4,
            "action": "11kV/33kV Direct Feeder Interconnect",
            "details": f"Substation is {substation_distance_km} km away. Direct tie-in via dedicated line with <1.2% transmission losses.",
            "est_cost_per_acre_usd": 2100
        })

    total_civil_prep_cost = sum(r["est_cost_per_acre_usd"] for r in remediations) * (area_sqm / 4046.86)

    return {
        "problems": problems,
        "remediations": remediations,
        "site_suitability_score": max(40, 100 - len(problems) * 14 - (slope_deg * 2)),
        "est_total_land_prep_cost_usd": round(total_civil_prep_cost, 0)
    }

def generate_site_layout(
    area_sqm: float,
    land_utilization_pct: float = 70.0,
    module_wattage_w: float = 550.0,
    battery_storage_hours: float = 4.0,
    latitude: float = 13.0827,
    longitude: float = 80.2707,
) -> Dict[str, Any]:
    """
    Parametric calculation of real-time solar PV + BESS layout blueprint:
    - Number of solar strings and tables
    - Total DC and AC capacity
    - Battery capacity and container footprint
    - Maintenance roads and electrical setbacks
    """
    area_acres = area_sqm / 4046.86
    usable_area_sqm = area_sqm * (land_utilization_pct / 100.0)
    
    # Standard 550W bifacial module dimensions: ~2.28m x 1.13m = ~2.58 m2
    module_area_sqm = 2.58
    # Ground Cover Ratio (GCR) accounting for row-to-row pitch to prevent self-shading: ~0.45 - 0.55
    gcr = 0.50
    module_footprint_sqm = module_area_sqm / gcr
    
    total_modules = int(usable_area_sqm / module_footprint_sqm)
    # Modules are grouped in strings of 28 (1500V DC string architecture)
    modules_per_string = 28
    total_strings = total_modules // modules_per_string
    total_modules = total_strings * modules_per_string
    
    dc_capacity_kwp = (total_modules * module_wattage_w) / 1000.0
    # Inverter loading ratio (DC:AC) ~ 1.25
    ilr = 1.25
    ac_capacity_kw = dc_capacity_kwp / ilr
    
    # Solar yield estimation
    resource = estimate_solar_resource(latitude, longitude)
    annual_generation_mwh = (dc_capacity_kwp * resource["annual_specific_yield_kwh_kwp"]) / 1000.0
    daily_avg_generation_kwh = (annual_generation_mwh * 1000.0) / 365.0
    
    # Battery storage optimization: sized for requested storage hours of peak AC capacity or daily buffer
    bess_power_kw = ac_capacity_kw * 0.40  # 40% of inverter capacity
    bess_capacity_kwh = bess_power_kw * battery_storage_hours
    
    # Standard 40ft High Cube BESS container rating: ~2.5 MWh - 3.5 MWh
    container_count = max(1, math.ceil(bess_capacity_kwh / 2500.0))
    
    # Financial estimates
    solar_capex_usd = dc_capacity_kwp * 680.0     # ~$0.68 / Wp turnkey utility scale
    bess_capex_usd = bess_capacity_kwh * 240.0    # ~$240 / kWh LiFePO4 turnkey containerized
    total_capex_usd = solar_capex_usd + bess_capex_usd
    
    annual_revenue_usd = annual_generation_mwh * 75.0  # ~$0.075 / kWh PPA / avoided grid cost
    payback_years = round(total_capex_usd / max(1.0, annual_revenue_usd), 1)
    
    # Visual Layout Geometry Coordinates (Normalized 0 - 100 grid for rendering SVG blueprint)
    # Racks are organized in parallel rows facing South
    rows_count = max(4, int(math.sqrt(total_strings) * 0.8))
    strings_per_row = max(1, total_strings // rows_count)
    
    table_rows = []
    y_start = 12.0
    y_end = 82.0
    row_spacing = (y_end - y_start) / max(1, rows_count)
    
    for r in range(rows_count):
        y_pos = y_start + r * row_spacing
        table_rows.append({
            "row_id": f"ROW-{r+1:02d}",
            "y_pct": round(y_pos, 2),
            "strings_count": strings_per_row,
            "modules_count": strings_per_row * modules_per_string,
            "length_meters": round(strings_per_row * 2.3, 1),
            "azimuth": resource["azimuth_deg"],
            "tilt": resource["optimal_tilt_angle_deg"]
        })

    return {
        "site_geometry": {
            "total_area_sqm": round(area_sqm, 1),
            "total_area_acres": round(area_acres, 2),
            "usable_area_sqm": round(usable_area_sqm, 1),
            "setback_buffer_m": 10.0,
            "access_road_width_m": 4.0
        },
        "solar_pv_system": {
            "total_modules": total_modules,
            "module_wattage_w": module_wattage_w,
            "modules_per_string": modules_per_string,
            "total_strings": total_strings,
            "dc_capacity_kwp": round(dc_capacity_kwp, 1),
            "ac_capacity_kw": round(ac_capacity_kw, 1),
            "dc_ac_ratio": ilr,
            "tilt_angle_deg": resource["optimal_tilt_angle_deg"],
            "azimuth_deg": resource["azimuth_deg"],
            "rows_layout": table_rows
        },
        "battery_energy_storage": {
            "capacity_kwh": round(bess_capacity_kwh, 1),
            "power_kw": round(bess_power_kw, 1),
            "duration_hours": battery_storage_hours,
            "container_count_40ft": container_count,
            "chemistry": "LiFePO4 (Lithium Iron Phosphate)",
            "placement_coords": {"x_pct": 82.0, "y_pct": 85.0}
        },
        "substation_interconnect": {
            "inverter_station_coords": {"x_pct": 50.0, "y_pct": 85.0},
            "transformer_rating_mva": round(ac_capacity_kw / 800.0, 2),
            "evacuation_voltage_kv": 33.0 if ac_capacity_kw > 2000 else 11.0,
            "main_switchyard_coords": {"x_pct": 18.0, "y_pct": 85.0}
        },
        "yield_and_financials": {
            "annual_generation_mwh": round(annual_generation_mwh, 1),
            "daily_avg_generation_kwh": round(daily_avg_generation_kwh, 1),
            "co2_emissions_avoided_tons_per_year": round(annual_generation_mwh * 0.72, 1),
            "estimated_solar_capex_usd": round(solar_capex_usd, 0),
            "estimated_bess_capex_usd": round(bess_capex_usd, 0),
            "total_capex_usd": round(total_capex_usd, 0),
            "annual_revenue_usd": round(annual_revenue_usd, 0),
            "simple_payback_years": payback_years
        }
    }

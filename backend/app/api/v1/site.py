from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import math
import random
import io

from app.services.site.site_analyzer import (
    estimate_solar_resource,
    diagnose_land_problems,
    generate_site_layout,
)

router = APIRouter(prefix="/site", tags=["Site & Land Survey"])

class CoordinatePoint(BaseModel):
    lat: float
    lng: float

class LandBoundaryRequest(BaseModel):
    coordinates: List[CoordinatePoint]
    soil_type: Optional[str] = "red_loam"
    slope_deg: Optional[float] = 2.5
    substation_distance_km: Optional[float] = 2.4
    land_utilization_pct: Optional[float] = 70.0
    module_wattage_w: Optional[float] = 550.0
    battery_storage_hours: Optional[float] = 4.0

class PhotoAnalysisResponse(BaseModel):
    filename: str
    detected_soil_type: str
    estimated_slope_deg: float
    vegetation_coverage_pct: float
    detected_obstacles: List[Dict[str, Any]]
    shading_obstruction_pct: float
    suitability_verdict: str
    diagnostics: Dict[str, Any]
    layout_preview: Dict[str, Any]

@router.post("/analyze-photo", response_model=PhotoAnalysisResponse)
async def analyze_land_photo(
    file: UploadFile = File(...),
    latitude: float = Form(default=13.0827),
    longitude: float = Form(default=80.2707),
    area_acres: float = Form(default=5.0),
):
    """
    Simulate Computer Vision & Optical Terrain Inspection on uploaded land photo.
    Detects ground contours, vegetation density, shading barriers, and rock formations.
    """
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        raise HTTPException(status_code=400, detail="Only image files (.png, .jpg, .jpeg, .webp) are supported.")
    
    # Deterministic pseudo-random seed from filename length to keep responses stable
    seed = sum(ord(c) for c in file.filename)
    rng = random.Random(seed)
    
    # Simulated CV features
    soil_types = ["red_loam", "clay", "rocky", "sandy_loam", "black_cotton"]
    detected_soil = rng.choice(soil_types)
    est_slope = round(rng.uniform(1.5, 8.5), 1)
    veg_cov = round(rng.uniform(10.0, 45.0), 1)
    shading_obs = round(rng.uniform(4.0, 18.0), 1)
    
    # Annotated Obstacles with Normalized Bounding Boxes [ymin, xmin, ymax, xmax]
    obstacles = [
        {
            "id": "obs-01",
            "type": "Dense Tree Line",
            "bbox_pct": [15, 65, 45, 92],
            "severity": "HIGH",
            "impact": "Western boundary shading after 15:30 PM",
            "remedy": "Trim canopy to 3m height or set 20m setback buffer"
        },
        {
            "id": "obs-02",
            "type": "Granite Boulder Outcrop",
            "bbox_pct": [55, 30, 75, 50],
            "severity": "MEDIUM",
            "impact": "High pile driving resistance (bedrock at 0.6m)",
            "remedy": "Pre-drill pilot holes or position inverter access road over outcrop"
        },
        {
            "id": "obs-03",
            "type": "Natural Water Runoff Swale",
            "bbox_pct": [35, 10, 60, 25],
            "severity": "MEDIUM",
            "impact": "Seasonal monsoon surface flow / pooling risk",
            "remedy": "Excavate 1m drainage trench with gravel lining"
        }
    ]
    
    area_sqm = area_acres * 4046.86
    diagnostics = diagnose_land_problems(
        area_sqm=area_sqm,
        slope_deg=est_slope,
        soil_type=detected_soil,
        substation_distance_km=rng.uniform(1.2, 4.5),
        vegetation_density_pct=veg_cov,
        shading_obstruction_pct=shading_obs
    )
    
    layout = generate_site_layout(
        area_sqm=area_sqm,
        land_utilization_pct=70.0,
        module_wattage_w=550.0,
        battery_storage_hours=4.0,
        latitude=latitude,
        longitude=longitude
    )
    
    score = diagnostics["site_suitability_score"]
    verdict = "EXCELLENT FOR UTILITY SOLAR+BESS" if score > 75 else ("VIABLE WITH CIVIL REMEDIATION" if score > 55 else "REQUIRES EXTENSIVE EARTHWORKS")
    
    return PhotoAnalysisResponse(
        filename=file.filename,
        detected_soil_type=detected_soil,
        estimated_slope_deg=est_slope,
        vegetation_coverage_pct=veg_cov,
        detected_obstacles=obstacles,
        shading_obstruction_pct=shading_obs,
        suitability_verdict=verdict,
        diagnostics=diagnostics,
        layout_preview=layout
    )

@router.post("/analyze-boundary")
async def analyze_land_boundary(req: LandBoundaryRequest):
    """
    Calculate area from polygon vertices (Shoelace formula) and return
    site diagnostics + parametric solar/BESS blueprint layout.
    """
    if len(req.coordinates) < 3:
        raise HTTPException(status_code=400, detail="At least 3 coordinate points are required to define a polygon.")
    
    # Calculate polygon area in square meters using Shoelace formula on projected coordinates
    # Reference center
    lat0 = req.coordinates[0].lat
    lng0 = req.coordinates[0].lng
    
    # Approx 1 deg lat = 111,320m, 1 deg lng = 111,320m * cos(lat)
    meters_per_lat = 111320.0
    meters_per_lng = 111320.0 * math.cos(math.radians(lat0))
    
    points_xy = [
        ((p.lng - lng0) * meters_per_lng, (p.lat - lat0) * meters_per_lat)
        for p in req.coordinates
    ]
    
    # Shoelace
    n = len(points_xy)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += points_xy[i][0] * points_xy[j][1]
        area -= points_xy[j][0] * points_xy[i][1]
    area_sqm = abs(area) / 2.0
    
    # Fallback to minimum realistic site area (e.g. 1 acre = 4046.86 m2) if boundary is very small or demo
    if area_sqm < 2000.0:
        area_sqm = 20234.3  # 5 acres default
        
    diagnostics = diagnose_land_problems(
        area_sqm=area_sqm,
        slope_deg=req.slope_deg or 2.5,
        soil_type=req.soil_type or "red_loam",
        substation_distance_km=req.substation_distance_km or 2.4,
    )
    
    layout = generate_site_layout(
        area_sqm=area_sqm,
        land_utilization_pct=req.land_utilization_pct or 70.0,
        module_wattage_w=req.module_wattage_w or 550.0,
        battery_storage_hours=req.battery_storage_hours or 4.0,
        latitude=lat0,
        longitude=lng0,
    )
    
    return {
        "center_coordinates": {"lat": lat0, "lng": lng0},
        "calculated_area_sqm": round(area_sqm, 1),
        "calculated_area_acres": round(area_sqm / 4046.86, 2),
        "polygon_vertex_count": len(req.coordinates),
        "diagnostics": diagnostics,
        "layout": layout
    }

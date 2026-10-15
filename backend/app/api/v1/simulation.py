from fastapi import APIRouter
from app.services.simulation.scenario import run_scenario
from app.schemas.simulation import SimulationRunRequest, SimulationRunResponse

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/run", response_model=SimulationRunResponse)
async def run_simulation(req: SimulationRunRequest):
    result = run_scenario(
        cloud_cover_pct=req.cloud_cover_pct,
        wind_speed_ms=req.wind_speed_ms,
        irradiance_multiplier=req.irradiance_multiplier or 1.0,
        demand_multiplier=req.demand_multiplier or 1.0,
        initial_soc_pct=req.initial_soc_pct,
    )
    return SimulationRunResponse(**result)

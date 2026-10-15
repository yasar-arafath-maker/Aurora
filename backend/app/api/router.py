from fastapi import APIRouter
from app.api.v1 import auth, weather, energy, prediction, battery, simulation, alerts, reports, settings, grid, data_mgmt, site

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(weather.router)
api_router.include_router(energy.router)
api_router.include_router(prediction.router)
api_router.include_router(battery.router)
api_router.include_router(grid.router)
api_router.include_router(simulation.router)
api_router.include_router(alerts.router)
api_router.include_router(reports.router)
api_router.include_router(settings.router)
api_router.include_router(data_mgmt.router)
api_router.include_router(site.router)

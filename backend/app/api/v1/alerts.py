from fastapi import APIRouter
from datetime import datetime, timezone, timedelta, date
import random

router = APIRouter(prefix="/alerts", tags=["Alerts"])

_rng = random.Random(7)

def _generate_demo_alerts():
    now = datetime.now(timezone.utc)
    alerts = [
        {
            "id": 1,
            "severity": "good",
            "title": "Battery SOC Optimal",
            "description": "Battery state of charge is within optimal operating range (55–90%). No action required.",
            "created_at": (now - timedelta(minutes=12)).isoformat(),
            "resolved_at": None,
        },
        {
            "id": 2,
            "severity": "warn",
            "title": "Cloud Cover Increasing",
            "description": "Cloud cover forecast for tomorrow exceeds 65%. Solar yield may be reduced by up to 40%. Verify battery charge plan.",
            "created_at": (now - timedelta(hours=1, minutes=34)).isoformat(),
            "resolved_at": None,
        },
        {
            "id": 3,
            "severity": "info",
            "title": "ML Model Retrained",
            "description": "Forecasting model aurora-ensemble-v1.0 retrained on 180 days synthetic historical data. Solar R² = 0.89.",
            "created_at": (now - timedelta(hours=3)).isoformat(),
            "resolved_at": None,
        },
        {
            "id": 4,
            "severity": "good",
            "title": "Grid Export Active",
            "description": f"Surplus renewable generation of {_rng.randint(180, 450)} kW currently exported to grid.",
            "created_at": (now - timedelta(minutes=5)).isoformat(),
            "resolved_at": None,
        },
    ]
    return alerts

@router.get("")
async def get_alerts():
    return {"alerts": _generate_demo_alerts(), "source": "demo"}

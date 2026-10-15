from fastapi import APIRouter, Path, Query
from datetime import datetime, timezone, date, timedelta
import random
import io
import csv
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/reports", tags=["Reports"])

_rng = random.Random(13)

def _generate_report(timeframe: str):
    now = datetime.now(timezone.utc)
    if timeframe == "daily":
        period_start = now.date()
        period_end = now.date()
        mult = 1
    elif timeframe == "weekly":
        period_start = (now - timedelta(days=7)).date()
        period_end = now.date()
        mult = 7
    else:
        period_start = (now - timedelta(days=30)).date()
        period_end = now.date()
        mult = 30

    solar = round(_rng.uniform(8000, 12000) * mult, 1)
    wind = round(_rng.uniform(5000, 9000) * mult, 1)
    demand = round(_rng.uniform(38000, 48000) * mult, 1)
    renewable = solar + wind
    penetration = round(renewable / demand * 100, 1)
    charged = round(renewable * 0.25, 1)
    discharged = round(charged * 0.85, 1)
    efficiency_realized = round(discharged / charged * 100, 1)
    mae = round(_rng.uniform(120, 280), 1)
    mape = round(_rng.uniform(3.2, 7.8), 2)
    grid_avoided = round(renewable * 0.7, 1)
    cost_savings = round(grid_avoided * 0.089, 0)

    return {
        "report_id": f"RPT-{timeframe[:3].upper()}-{now.strftime('%Y%m%d')}",
        "timeframe": timeframe,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "generated_at": now.isoformat(),
        "total_solar_kwh": solar,
        "total_wind_kwh": wind,
        "total_renewable_kwh": renewable,
        "total_demand_kwh": demand,
        "renewable_penetration_pct": penetration,
        "battery_energy_charged_kwh": charged,
        "battery_energy_discharged_kwh": discharged,
        "battery_roundtrip_efficiency_realized_pct": efficiency_realized,
        "forecast_mae_kwh": mae,
        "forecast_mape_pct": mape,
        "grid_import_avoided_kwh": grid_avoided,
        "estimated_cost_savings_usd": cost_savings,
        "highlights": [
            f"Renewable penetration reached {penetration}% of total demand",
            f"Battery roundtrip efficiency: {efficiency_realized}%",
            f"Forecast accuracy: MAPE {mape}% (MAE {mae} kWh)",
            f"Grid import avoided: {grid_avoided:,.0f} kWh (est. ${cost_savings:,.0f} saved)",
        ],
        "source": "demo",
    }

@router.get("/{timeframe}")
async def get_report(timeframe: str = Path(..., pattern="^(daily|weekly|monthly)$")):
    return _generate_report(timeframe)

@router.get("/{timeframe}/export")
async def export_report(
    timeframe: str = Path(..., pattern="^(daily|weekly|monthly)$"),
    format: str = Query(default="csv", pattern="^(csv|pdf)$"),
):
    report = _generate_report(timeframe)
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Field", "Value"])
        for k, v in report.items():
            if isinstance(v, list):
                for i, item in enumerate(v):
                    writer.writerow([f"{k}[{i}]", item])
            else:
                writer.writerow([k, v])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=aurora_{timeframe}_report.csv"}
        )
    else:
        # Simple PDF using reportlab
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        story.append(Paragraph(f"AURORA Platform — {timeframe.title()} Report", styles["Title"]))
        story.append(Paragraph(f"Period: {report['period_start']} to {report['period_end']}", styles["Normal"]))
        story.append(Spacer(1, 12))

        data = [["Metric", "Value"]] + [
            [k.replace("_", " ").title(), str(v)]
            for k, v in report.items()
            if not isinstance(v, list)
        ]
        t = Table(data, colWidths=[260, 200])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10191c")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#22e6c4")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f0f4f5")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ]))
        story.append(t)
        doc.build(story)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=aurora_{timeframe}_report.pdf"}
        )

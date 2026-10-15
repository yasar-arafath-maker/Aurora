import io
import csv
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/data", tags=["Data Management"])

REQUIRED_COLUMNS = ["timestamp", "solar_kw", "wind_kw", "demand_kw", "temperature_c", "cloud_cover_pct"]

class DataUploadSummary(BaseModel):
    filename: str
    total_rows: int
    valid_rows: int
    missing_values_count: int
    columns: List[str]
    sample_preview: List[Dict[str, Any]]
    stats: Dict[str, Any]

@router.post("/upload", response_model=DataUploadSummary)
async def upload_csv_data(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")
    
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")
        
    reader = csv.DictReader(io.StringIO(text))
    fieldnames = reader.fieldnames or []
    
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in fieldnames]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing_cols)}. Expected columns: {', '.join(REQUIRED_COLUMNS)}"
        )
        
    total_rows = 0
    valid_rows = 0
    missing_values_count = 0
    samples = []
    
    solar_vals = []
    wind_vals = []
    demand_vals = []
    
    for row in reader:
        total_rows += 1
        has_missing = False
        parsed_row = {}
        for col in REQUIRED_COLUMNS:
            val_str = (row.get(col) or "").strip()
            if not val_str:
                has_missing = True
                missing_values_count += 1
                parsed_row[col] = None
            else:
                if col == "timestamp":
                    parsed_row[col] = val_str
                else:
                    try:
                        f_val = float(val_str)
                        parsed_row[col] = f_val
                        if col == "solar_kw": solar_vals.append(f_val)
                        elif col == "wind_kw": wind_vals.append(f_val)
                        elif col == "demand_kw": demand_vals.append(f_val)
                    except ValueError:
                        has_missing = True
                        missing_values_count += 1
                        parsed_row[col] = None
                        
        if not has_missing:
            valid_rows += 1
        if len(samples) < 5:
            samples.append(parsed_row)
            
    stats = {
        "solar_avg_kw": round(sum(solar_vals) / len(solar_vals), 2) if solar_vals else 0.0,
        "solar_max_kw": round(max(solar_vals), 2) if solar_vals else 0.0,
        "wind_avg_kw": round(wind_vals and sum(wind_vals) / len(wind_vals) or 0.0, 2),
        "wind_max_kw": round(max(wind_vals), 2) if wind_vals else 0.0,
        "demand_avg_kw": round(sum(demand_vals) / len(demand_vals), 2) if demand_vals else 0.0,
        "demand_max_kw": round(max(demand_vals), 2) if demand_vals else 0.0,
    }
    
    return DataUploadSummary(
        filename=file.filename,
        total_rows=total_rows,
        valid_rows=valid_rows,
        missing_values_count=missing_values_count,
        columns=fieldnames,
        sample_preview=samples,
        stats=stats
    )

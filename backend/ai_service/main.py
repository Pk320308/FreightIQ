from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uvicorn
import math

app = FastAPI(
    title="FreightIQ AI/ML Forecasting Service",
    description="Probabilistic Freight Rate Forecasting Engine for Bulk Cargo (SIH26006)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MacroIndicators(BaseModel):
    brent_crude_usd: Optional[float] = Field(default=78.4, description="Brent crude benchmark price")
    bunker_fuel_vlsfo_usd: Optional[float] = Field(default=580.0, description="VLSFO bunker fuel price / MT")
    inr_usd_fx_rate: Optional[float] = Field(default=83.92, description="INR to USD currency exchange rate")
    baltic_dry_index: Optional[float] = Field(default=1845.0, description="Baltic Dry Index (BDI)")
    panamax_index: Optional[float] = Field(default=1520.0, description="Baltic Panamax Index (BPI)")
    capesize_index: Optional[float] = Field(default=2680.0, description="Baltic Capesize Index (BCI)")

class PredictRequest(BaseModel):
    origin_port: str = Field(..., example="Newcastle")
    destination_port: str = Field(..., example="Visakhapatnam")
    cargo_type: str = Field(..., example="Coal")
    cargo_quantity_mt: float = Field(..., example=75000)
    vessel_type: str = Field(..., example="Panamax")
    horizon: str = Field(default="90d", example="90d")
    macro_indicators: Optional[MacroIndicators] = None

class FreightRatePoint(BaseModel):
    date: str
    historical: Optional[float] = None
    forecast: Optional[float] = None
    upperBound: Optional[float] = None
    lowerBound: Optional[float] = None

class FeatureImportance(BaseModel):
    name: str
    impact: str  # 'positive', 'negative', 'neutral'
    strength: int  # 0 to 100
    description: str

class PredictResponse(BaseModel):
    current_rate: float
    forecast_7d: float
    forecast_30d: float
    forecast_60d: float
    forecast_90d: float
    trend: str
    volatility: str
    model_confidence: int
    model_name: str
    historical_and_forecast_series: List[FreightRatePoint]
    feature_importances: List[FeatureImportance]
    explanation: str

@app.get("/")
def health():
    return {
        "status": "online",
        "service": "FreightIQ ML Forecasting Engine",
        "domain": "Maritime Freight Logistics (SIH26006)",
        "version": "1.0.0"
    }

@app.post("/predict", response_model=PredictResponse)
def predict_freight_rates(req: PredictRequest):
    """
    ML Inference Endpoint:
    Plug in trained SARIMAX, Prophet, LightGBM, or Ensemble models here.
    """
    # 1. Base Freight Pricing Anchor
    base_benchmark = 27.40
    if req.vessel_type == "Capesize":
        base_benchmark = 25.80
    elif req.vessel_type == "Supramax":
        base_benchmark = 28.50
    elif req.vessel_type == "Handysize":
        base_benchmark = 31.20

    # 2. Dynamic Forward Multipliers (Replace with your model.predict)
    f7d = round(base_benchmark * 1.025, 2)
    f30d = round(base_benchmark * 1.062, 2)
    f60d = round(base_benchmark * 1.095, 2)
    f90d = round(base_benchmark * 1.146, 2)

    # 3. Probabilistic Time-Series Curve (Historical + Forecast with 95% Confidence Bounds)
    dates = [
        "Jul 1", "Jul 8", "Jul 15", "Jul 22", "Jul 29",
        "Aug 5", "Aug 12", "Aug 19", "Aug 26", "Sep 2",
        "Sep 9", "Sep 16", "Sep 23", "Sep 30", "Oct 7",
        "Oct 14", "Oct 21", "Oct 28", "Nov 4", "Nov 11",
        "Nov 18", "Nov 25", "Dec 2", "Dec 9", "Dec 16"
    ]

    series = []
    for idx, d in enumerate(dates):
        if idx < 10:
            hist_val = round(base_benchmark - (10 - idx) * 0.28 + math.sin(idx) * 0.2, 2)
            series.append(FreightRatePoint(date=d, historical=hist_val))
        else:
            step = idx - 9
            fc_val = round(base_benchmark + step * 0.26 + math.sin(step * 0.8) * 0.15, 2)
            band = round(0.8 + step * 0.18, 2)
            series.append(FreightRatePoint(
                date=d,
                forecast=fc_val,
                upperBound=round(fc_val + band, 2),
                lowerBound=round(fc_val - band, 2)
            ))

    features = [
        FeatureImportance(
            name="Baltic Dry Index Momentum",
            impact="positive",
            strength=84,
            description="Active fixture demand from Australian and Indonesian bulk export corridors."
        ),
        FeatureImportance(
            name="Bunker Fuel Price (VLSFO)",
            impact="negative",
            strength=65,
            description="Elevated marine fuel costs add upward cost-push pressure on ton-mile charter rates."
        ),
        FeatureImportance(
            name=f"{req.destination_port} Port Turnaround",
            impact="positive",
            strength=58,
            description="Berth waiting times on the East Coast of India reduce active vessel supply availability."
        )
    ]

    explanation = (
        f"Ensemble model forecasts a firming trajectory for {req.cargo_type} shipped on {req.vessel_type} "
        f"from {req.origin_port} to {req.destination_port}. Key drivers include sustained Indian steel mill capacity "
        f"utilization and rising bunker benchmarks."
    )

    return PredictResponse(
        current_rate=base_benchmark,
        forecast_7d=f7d,
        forecast_30d=f30d,
        forecast_60d=f60d,
        forecast_90d=f90d,
        trend="increasing",
        volatility="medium",
        model_confidence=86,
        model_name="Ensemble-SARIMAX-XGBoost-v1.2",
        historical_and_forecast_series=series,
        feature_importances=features,
        explanation=explanation
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

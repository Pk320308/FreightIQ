# 🚀 FreightIQ — AI / ML Model Integration Specification (SIH26006)

This document provides everything the **AI/ML Team** needs to build, train, and connect their Python Machine Learning model service to the **FreightIQ Full-Stack Platform**.

---

## 📌 1. Architecture Overview

```
┌──────────────────────────────────────────────┐
│           FreightIQ Next.js App              │
│       (UI / Full-Stack Platform)             │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTP POST /predict (JSON)
                       ▼
┌──────────────────────────────────────────────┐
│       Python AI/ML Service (FastAPI)         │
│  (Prophet / SARIMAX / XGBoost / LightGBM)    │
└──────────────────────────────────────────────┘
```

When you start your Python service (e.g., at `http://localhost:8000`), the FreightIQ backend will automatically send real prediction queries to your model and render your forecasts, confidence bands, feature importances, and reasoning in real time.

---

## 📌 2. API Endpoint Specification

* **HTTP Method:** `POST`
* **Path:** `/predict` (or configurable in `.env.local` as `AI_SERVICE_URL=http://localhost:8000`)

### 📥 Request Body (Sent from FreightIQ to Python AI):

```json
{
  "origin_port": "Newcastle",
  "destination_port": "Visakhapatnam",
  "cargo_type": "Coal",
  "cargo_quantity_mt": 75000,
  "vessel_type": "Panamax",
  "horizon": "90d",
  "macro_indicators": {
    "brent_crude_usd": 78.4,
    "bunker_fuel_vlsfo_usd": 580.0,
    "inr_usd_fx_rate": 83.92,
    "baltic_dry_index": 1845,
    "panamax_index": 1520,
    "capesize_index": 2680
  }
}
```

### 📤 Response Body (Returned by Python AI to FreightIQ):

```json
{
  "current_rate": 27.40,
  "forecast_7d": 28.10,
  "forecast_30d": 29.10,
  "forecast_60d": 29.98,
  "forecast_90d": 31.40,
  "trend": "increasing",
  "volatility": "medium",
  "model_confidence": 84,
  "model_name": "SARIMAX-XGBoost-Ensemble-v1.0",
  "historical_and_forecast_series": [
    { "date": "Jul 1", "historical": 24.8, "forecast": null, "upperBound": null, "lowerBound": null },
    { "date": "Sep 2", "historical": 27.4, "forecast": null, "upperBound": null, "lowerBound": null },
    { "date": "Sep 9", "historical": null, "forecast": 27.65, "upperBound": 28.8, "lowerBound": 26.5 },
    { "date": "Dec 16", "historical": null, "forecast": 31.4, "upperBound": 35.1, "lowerBound": 27.7 }
  ],
  "feature_importances": [
    {
      "name": "Baltic Panamax Index Momentum",
      "impact": "positive",
      "strength": 82,
      "description": "Strong short-term fixture demand from Pacific mineral trades."
    },
    {
      "name": "Bunker Fuel Cost (VLSFO)",
      "impact": "negative",
      "strength": 65,
      "description": "Rising fuel prices add direct upward pressure to freight quotes."
    }
  ],
  "explanation": "Ensemble model projects a 14.6% freight rate increase over the 90-day horizon due to robust Indian steel production and rising fuel benchmarks."
}
```

---

## 📌 3. Ready-to-Run Python FastAPI Boilerplate for AI Team

Your AI teammates can create a file `main.py` in their repository:

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn

app = FastAPI(title="FreightIQ ML Forecasting Engine (SIH26006)")

class MacroIndicators(BaseModel):
    brent_crude_usd: Optional[float] = 78.4
    bunker_fuel_vlsfo_usd: Optional[float] = 580.0
    inr_usd_fx_rate: Optional[float] = 83.92
    baltic_dry_index: Optional[float] = 1845.0
    panamax_index: Optional[float] = 1520.0
    capesize_index: Optional[float] = 2680.0

class PredictRequest(BaseModel):
    origin_port: str
    destination_port: str
    cargo_type: str
    cargo_quantity_mt: float
    vessel_type: str
    horizon: str
    macro_indicators: Optional[MacroIndicators] = None

@app.get("/")
def health_check():
    return {"status": "online", "model": "FreightIQ ML Engine", "version": "1.0.0"}

@app.post("/predict")
def predict_freight_rates(req: PredictRequest):
    # ----------------------------------------------------
    # 1. YOUR ML / AI INFERENCE LOGIC HERE
    # (e.g. model.predict() using Prophet, XGBoost, SARIMAX)
    # ----------------------------------------------------
    current_rate = 27.40
    f_7d = round(current_rate * 1.025, 2)
    f_30d = round(current_rate * 1.062, 2)
    f_60d = round(current_rate * 1.095, 2)
    f_90d = round(current_rate * 1.146, 2)

    # Return prediction matching the JSON contract
    return {
        "current_rate": current_rate,
        "forecast_7d": f_7d,
        "forecast_30d": f_30d,
        "forecast_60d": f_60d,
        "forecast_90d": f_90d,
        "trend": "increasing",
        "volatility": "medium",
        "model_confidence": 86,
        "model_name": "Prophet-XGBoost-Ensemble-v1.0",
        "historical_and_forecast_series": [
            {"date": "Jul 1", "historical": 24.8, "forecast": None, "upperBound": None, "lowerBound": None},
            {"date": "Aug 12", "historical": 26.4, "forecast": None, "upperBound": None, "lowerBound": None},
            {"date": "Sep 2", "historical": 27.4, "forecast": None, "upperBound": None, "lowerBound": None},
            {"date": "Sep 30", "historical": None, "forecast": 28.45, "upperBound": 30.1, "lowerBound": 26.8},
            {"date": "Oct 28", "historical": None, "forecast": 29.50, "upperBound": 31.8, "lowerBound": 27.2},
            {"date": "Nov 25", "historical": None, "forecast": 30.60, "upperBound": 33.6, "lowerBound": 27.6},
            {"date": "Dec 16", "historical": None, "forecast": 31.40, "upperBound": 35.1, "lowerBound": 27.7}
        ],
        "feature_importances": [
            {
                "name": "Baltic Index Momentum",
                "impact": "positive",
                "strength": 84,
                "description": "High seasonal chartering volume in Australian bulk export corridors."
            },
            {
                "name": "Bunker Fuel (VLSFO)",
                "impact": "negative",
                "strength": 62,
                "description": "Elevated bunker price increases ton-mile variable operating expenditure."
            },
            {
                "name": "East Coast Port Congestion",
                "impact": "positive",
                "strength": 55,
                "description": "Average 2-3 day discharge wait times restrict active regional fleet capacity."
            }
        ],
        "explanation": f"Model forecasts a firming trend for {req.cargo_type} shipped on {req.vessel_type} from {req.origin_port} to {req.destination_port}."
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 📌 4. How to Connect in FreightIQ

In `FreightIQ/.env.local`:
```env
AI_SERVICE_URL=http://localhost:8000
```
That's it! The FreightIQ platform will now instantly query your team's ML engine.

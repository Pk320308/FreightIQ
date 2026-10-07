# 🧠 FreightIQ AI / Machine Learning Forecasting Service

This directory contains the Python FastAPI backend service responsible for training, evaluating, and serving the time-series machine learning models for Problem Statement **SIH26006** (Ministry of Steel).

---

## ⚡ Quick Start for AI Teammates

### 1. Create Virtual Environment & Install Dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the AI Model Service:
```bash
python3 main.py
```
* The service will start at `http://localhost:8000`.
* Interactive Swagger Docs: `http://localhost:8000/docs`.

### 3. Connect to FreightIQ Full-Stack App:
In the root `.env.local` or `.env` file of FreightIQ:
```env
AI_SERVICE_URL=http://localhost:8000
```
FreightIQ will now query this Python service in real time for all forecast projections!

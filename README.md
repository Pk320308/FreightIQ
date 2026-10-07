# 🚢 FreightIQ — Intelligent Freight Forecasting & Vessel Chartering Optimizer

> **Smart India Hackathon (SIH) 2026**  
> **Problem Statement ID:** `SIH26006`  
> **Title:** *Development of an Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement from overseas to East Coast of India*  
> **Ministry / Organization:** **Ministry of Steel**, Government of India  
> **Category:** Software | **Domain:** Transportation & Logistics / AI & Maritime Supply Chain  

---

## 📌 1. Problem Overview & Industrial Context

India’s steel manufacturing ecosystem (SAIL, RINL, Tata Steel, etc.) depends critically on overseas imports of bulk coking coal, iron ore, and limestone from major exporting nations (Australia, Indonesia, South Africa, Mozambique, USA, and Russia) to ports along the **East Coast of India** (Visakhapatnam, Paradip, Dhamra, Gangavaram, Haldia).

### Industrial Bottlenecks Addressed:
1. **Extreme Freight Volatility:** Global maritime dry bulk freight rates (Baltic Dry Index) fluctuate rapidly. Lack of forward predictive intelligence results in millions of dollars in procurement cost overrun.
2. **Port Draft & Physical Constraints:** East Coast ports have strict physical draft, beam, and Under Keel Clearance (UKC) limitations (e.g., Haldia river port is limited to 8.5m draft, whereas Dhamra/Gangavaram support deep-draft Capesize vessels up to 18.5m). Suboptimal vessel chartering leads to heavy vessel idling and **demurrage penalties**.
3. **Spot vs. Time Charter Dilemma:** Steel procurement managers struggle to mathematically evaluate whether to secure 1-Year Time Charters (fixed daily hire) or rely on the Spot market.

**FreightIQ** solves these challenges by combining **Machine Learning time-series forecasting**, **maritime port physics constraint solvers**, and **strategic procurement optimization**.

---

## 🏗️ 2. System Architecture

FreightIQ is structured with clear separation between the **Frontend Decision Support Platform**, the **Logistics & Maritime Calculation Engine**, and the **Python AI/ML Microservice**:

```
FreightIQ/
├── frontend / app/             # Full-Stack Next.js Decision Support Dashboard
│   ├── (app)/dashboard/        # Executive KPIs, Market Pulse, Route Mapping
│   ├── (app)/freight/          # Probabilistic Forecasting Curves & Baltic Indices
│   ├── (app)/vessels/          # Port Draft Matching & Spot vs. Time Charter Optimizer
│   ├── (app)/ports/            # East Coast Port Drafts, Berths, Turnaround Analytics
│   ├── (app)/risk/             # Dynamic What-If Logistics Shock & Demurrage Simulator
│   └── (app)/reports/          # One-Click PDF/CSV Procurement Advisory Report Generator
│
├── backend/                    # Core Backend, Engineering & AI Services
│   ├── engine/                 # Maritime Logistics Physics & Optimization Engine
│   │   └── maritime_engine.ts  # UKC solver, steaming burn rates, demurrage formulas
│   ├── ai_service/             # Python FastAPI Machine Learning Microservice
│   │   ├── main.py             # Inference API (Prophet, XGBoost, SARIMAX, LightGBM)
│   │   ├── requirements.txt    # Python ML dependencies
│   │   └── README.md           # Guide for AI team
│   ├── api_bridge/             # REST Bridge connecting Next.js to Python ML
│   │   └── ai_bridge.ts        # Fault-tolerant connector with dynamic algorithmic fallback
│   └── database/               # PostgreSQL / Supabase Schema & Seed Data
│       └── schema.sql          # Relational tables for freight rates, ports, vessels
│
├── components/                 # UI & Domain Visualization Components
│   ├── freightiq/              # Custom Maritime Charts, Map Views, Risk Badges
│   └── ui/                     # Accessible UI components (Tailwind CSS)
└── lib/                        # Client API Layer & Shared Types
```

---

## ⚙️ 3. Core Mathematical & Engineering Models

### A. Port Draft & Under Keel Clearance (UKC) Feasibility Solver
$$\text{Effective Safe Draft} = \text{Port Max Permissible Draft} - \text{Channel UKC Margin} + \Delta\text{Tide Window}$$
* **Hard Fail:** If $\text{Vessel Laden Draft} > \text{Port Max Draft}$, vessel entry is physically impossible.
* **Restricted Entry:** If $\text{Vessel Draft} > \text{Effective Safe Draft}$, entry is allowed only during high-tide windows with ballast management.
* **Pass:** 100% compliant with standard safety margins.

### B. Voyage Cost & Freight / MT Calculator
$$\text{Total Voyage Cost} = \text{Bunker Fuel Cost} + \text{Charter Daily Hire} + \text{Port Dues} + \text{Demurrage Penalty} + \text{Canal Dues}$$
$$\text{Effective Freight / MT} = \frac{\text{Total Voyage Cost}}{\text{Cargo Parcel Loaded (MT)}}$$

### C. Spot Market vs. 1-Year Time Charter Break-Even Engine
$$\text{Break-Even Spot Rate} = \frac{\text{Annual Time Charter Expenditure}}{\text{Total Annual Demand (MT)}}$$
* Evaluates portfolio risk: Suggests a **Hybrid Model (e.g. 60% Time Charter + 40% Spot)** to insulate blast furnace operations from market spikes while capitalizing on seasonal spot dips.

### D. Multi-Factor Econometric Forecasting Pipeline
Considers ton-mile dynamics, Baltic Capesize (BCI) / Panamax (BPI) indices, VLSFO bunker fuel prices ($/MT), USD/INR exchange rates, and monsoon seasonality to generate 7, 30, 60, and 90-day forward freight projections with 95% confidence bands.

---

## 🚀 4. How to Run Locally

### Prerequisites
* Node.js (v18 or higher)
* Python 3.10+ (for AI/ML service)

---

### Step 1: Start the Frontend & Platform
```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

### Step 2: Start the Python AI/ML Service (Optional)
```bash
cd backend/ai_service

# 1. Setup virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install ML requirements
pip install -r requirements.txt

# 3. Run FastAPI server
python3 main.py
```
* The AI inference server runs on **`http://localhost:8000`**.
* Interactive API Documentation (Swagger UI): `http://localhost:8000/docs`.

---

## 📊 5. Key Supported Ports & Trade Corridors

| Indian East Coast Ports (Discharge) | Major Overseas Export Origins |
| :--- | :--- |
| **Visakhapatnam Port** (Outer: 18.1m, Inner: 14.5m) | **Newcastle & Gladstone** (Australia) |
| **Paradip Port** (17.1m draft) | **Hay Point / Dalrymple Bay** (Australia) |
| **Dhamra Port** (18.5m deep draft Capesize) | **Muara Pantai / Tanjung Bara** (Indonesia) |
| **Gangavaram Port** (18.5m deep draft) | **Richards Bay** (South Africa) |
| **Haldia Port** (8.5m draft - Riverine constraint) | **Maputo / Beira** (Mozambique) |
| **Kamarajar / Ennore & Krishnapatnam** (16.0m - 18.0m) | **Baltimore / Norfolk** (USA) & **Taman** (Russia) |

---

## 🎯 6. Key Deliverables & Feature Highlights (SIH26006)

* ✅ **Predictive Freight Analytics:** Multi-variable forward freight curves with confidence intervals.
* ✅ **Vessel & Port Optimization:** Real draft, UKC, and cargo compatibility matching.
* ✅ **Procurement Strategy Advisor:** Spot vs. Time Charter financial break-even analysis.
* ✅ **What-If Risk Simulation:** Real-time bunker fuel shock and demurrage estimation.
* ✅ **Executive Reporting:** Instant exportable CSV and Print/PDF decision briefs.

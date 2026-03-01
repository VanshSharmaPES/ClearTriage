# ClearTriage — Glass-Box Intelligent Triage System

A scalable, **explainable AI (XAI)** hospital triage system built with MERN + Python. Predicts patient urgency (ESI 1–5) using a Random Forest classifier and provides **transparent, SHAP-based reasoning** for every decision.

> **Research Goal:** A functional prototype + research paper on *"Operationalizing Trust in Medical AI through Explainable Triage."*

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│  Next.js UI  │────▸│  Express API │────▸│  FastAPI ML Svc    │
│  :3001       │     │  :3000       │     │  :8000             │
│              │     │  MongoDB     │     │  RandomForest      │
│  Dashboard   │◂────│  Patient CRUD│◂────│  SHAP Explainer    │
│  Admit Form  │     │              │     │  LRU Cache (500)   │
└──────────────┘     └──────────────┘     └───────────────────┘
```

## Project Structure

```
ClearTriage/
├── client/                  # Next.js + Tailwind CSS frontend
│   └── src/app/
│       ├── page.js               # Landing page
│       ├── dashboard/page.js     # Nurse Dashboard (auto-refresh, "Why?" tooltips)
│       └── admit/page.js         # Patient Admit Form
├── server/                  # Express.js backend
│   ├── models/Patient.js         # Mongoose schema (incl. aiReasoning, whyText)
│   ├── routes/patients.js        # REST CRUD + ML triage pipeline
│   ├── index.js                  # Server entry + MongoDB connection
│   └── generator.js              # ER patient simulator
├── ml-service/              # Python ML microservice
│   ├── data_processing.py        # Data cleaning pipeline
│   ├── train_model.py            # Model training + evaluation
│   ├── main.py                   # FastAPI + SHAP + LRU cache
│   ├── Dockerfile                # Container config
│   └── data/
│       ├── data.csv              # Raw Kaggle ER triage dataset (1,267 records)
│       ├── cleaned_data.csv      # Processed features (30 cols)
│       ├── model.pkl             # Trained RandomForest
│       ├── scaler.pkl            # StandardScaler for vitals
│       └── feature_names.pkl     # Training column order
├── research/                # Phase 4 — Research data for paper
│   ├── correlation_heatmap.py    # Feature selection visualization
│   ├── sanity_tests.py           # Model sanity checks (6/6 pass)
│   ├── validate_model.py         # Human vs AI (50-case study)
│   ├── load_test.js              # Scalability testing (autocannon)
│   └── overhead_test.js          # AI latency overhead comparison
├── docker-compose.yml       # Full-stack container orchestration
├── package.json             # Root: concurrently runs all 3 services
└── .env                     # MongoDB URI + PORT config
```

## Key Features

### 🔮 Explainable AI (XAI) — The "Glass Box"
- **SHAP TreeExplainer** calculates feature contributions for every prediction
- Human-readable explanations: *"Heart Rate significantly increased urgency (28%)"*
- **"Why?" hover tooltip** on triage badges shows compact reasoning with raw vitals
- Stored per-patient in `aiReasoning` (detailed) and `whyText` (compact)

### 🏥 Clinical Dashboard
- Real-time patient queue with auto-polling (5s)
- Triage-color-coded rows, sorted by urgency (ESI 1 on top)
- Expandable rows showing full SHAP reasoning
- Delete patients with confirmation

### ⚡ Performance
- **In-memory LRU cache** (500 entries) — skips SHAP for identical vitals
- `/cache-stats` endpoint for monitoring
- **Scalability tested**: 619 req/s at 100 connections, 0 errors at 1000

### 📊 Research Data
- Correlation heatmap for feature selection (seaborn)
- 6 sanity tests verifying clinical sense (6/6 PASS)
- 50-case Human vs AI validation with confusion matrix
- Load test results at 100/500/1000 concurrent users
- AI overhead: +82ms (Node-only 7ms vs Node+AI 89ms) — well under 200ms threshold

## Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.9+)
- **MongoDB** (local or Atlas)

### Setup

```bash
# Clone and install all Node dependencies (root + client + server)
git clone https://github.com/VanshSharmaPES/ClearTriage.git
cd ClearTriage
npm install

# Set up Python virtual environment
cd ml-service
python -m venv venv           # Use 'python3' on macOS/Linux

# Activate venv:
# Windows:    venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

pip install -r requirements.txt
cd ..
```

### Environment Variables

Create a `.env` file in the root:
```env
MONGO_URI=mongodb://127.0.0.1:27017/triage-system
PORT=3000
```

### Train the Model (first time only)

```bash
cd ml-service

# Windows:
venv\Scripts\python.exe data_processing.py
venv\Scripts\python.exe train_model.py

# macOS/Linux:
python data_processing.py
python train_model.py

cd ..
```

### Run All Services (single command)

```bash
npm run dev
```

This uses `concurrently` to start all three services simultaneously:

| Service | URL | Tech |
|---------|-----|------|
| Frontend | http://localhost:3001 | Next.js + Tailwind |
| Backend API | http://localhost:3000 | Express + MongoDB |
| ML Service | http://localhost:8000 | FastAPI + SHAP |

> **Note:** The project uses Next.js (App Router) instead of plain React for improved routing, SSR capabilities, and developer experience. All client-side state management uses React hooks (`useState`, `useEffect`) with polling for real-time updates.

### Simulate ER Traffic

```bash
node server/generator.js
```

## API Endpoints

### Backend (Express)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients` | List all patients (sorted by triage) |
| `POST` | `/api/patients` | Admit new patient → triggers ML triage |
| `GET` | `/api/patients/:id` | Get patient by ID |
| `PUT` | `/api/patients/:id` | Update patient |
| `DELETE` | `/api/patients/:id` | Delete patient |

### ML Service (FastAPI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Predict triage + SHAP explanations |
| `GET` | `/cache-stats` | LRU cache hit/miss metrics |
| `GET` | `/` | Service health check |

**Example prediction request:**
```json
{
  "age": 70, "heart_rate": 130, "temp": 39.5,
  "bp_systolic": 90, "bp_diastolic": 60, "o2_sat": 88,
  "pain_score": 8, "chief_complaint": "chest pain"
}
```

**Response (with SHAP explanations):**
```json
{
  "triage_score": 2,
  "triage_label": "Emergent",
  "confidence": 0.44,
  "probabilities": { "ESI_1": 0.06, "ESI_2": 0.44, "ESI_3": 0.42, "ESI_4": 0.08, "ESI_5": 0.0 },
  "explanations": [
    "Heart Rate significantly increased urgency (28%)",
    "O₂ Saturation significantly increased urgency (22%)",
    "Pain Score moderately increased urgency (15%)"
  ],
  "why_short": "High Heart Rate (130bpm), High O₂ Saturation (88%), High Pain Score (8/10)",
  "cached": false
}
```

## Docker

```bash
docker-compose up --build
```

## Tech Stack

| Layer | Technology |
|-------|-----------:|
| Frontend | Next.js (App Router), Tailwind CSS |
| Backend | Express.js, Mongoose |
| Database | MongoDB |
| ML | scikit-learn (RandomForest), SHAP (TreeExplainer), FastAPI |
| Research | seaborn, matplotlib, autocannon |
| DevOps | Docker, concurrently, dotenv |

## License

ISC

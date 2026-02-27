# ClearTriage — Glass-Box Intelligent Triage System

A scalable, **explainable AI (XAI)** hospital triage system built with MERN + Python. Predicts patient urgency (ESI 1–5) using a Random Forest classifier and provides transparent, evidence-based reasoning.

> **Research Goal:** A functional prototype + research paper on *"Operationalizing Trust in Medical AI."*

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Next.js UI  │────▸│  Express API │────▸│  FastAPI ML Svc   │
│  :3001       │     │  :3000       │     │  :8000            │
│              │     │  MongoDB     │     │  RandomForest     │
│  Dashboard   │◂────│  Patient CRUD│◂────│  /predict         │
│  Admit Form  │     │              │     │  Triage 1-5       │
└──────────────┘     └──────────────┘     └──────────────────┘
```

## Project Structure

```
ClearTriage/
├── client/              # Next.js + Tailwind CSS frontend
│   └── src/app/
│       ├── page.js           # Landing page
│       ├── dashboard/page.js # Nurse Dashboard (auto-refresh)
│       └── admit/page.js     # Patient Admit Form
├── server/              # Express.js backend
│   ├── models/Patient.js     # Mongoose schema
│   ├── routes/patients.js    # REST CRUD endpoints
│   ├── index.js              # Server entry + MongoDB connection
│   └── generator.js          # ER patient simulator
├── ml-service/          # Python ML microservice
│   ├── data_processing.py    # Data cleaning pipeline
│   ├── train_model.py        # Model training + evaluation
│   ├── main.py               # FastAPI prediction endpoint
│   └── data/
│       ├── data.csv          # Raw Kaggle ER triage dataset
│       ├── cleaned_data.csv  # Processed features
│       ├── model.pkl         # Trained RandomForest
│       └── scaler.pkl        # StandardScaler for vitals
└── .env                 # MongoDB URI + PORT config
```

## Features

- **Nurse Dashboard** — Real-time patient queue with auto-polling (5s), triage-color-coded rows
- **Admit Form** — Clickable symptom chips, vitals input, form validation
- **ML Prediction** — RandomForest classifier (1,267 ER records, 30 features, ESI 1–5)
- **Prediction API** — Returns triage score, label, confidence, and per-class probabilities
- **Patient Generator** — Simulates ER arrivals from real dataset for load testing

## Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.9+)
- **MongoDB** (local or Atlas)

### Setup

```bash
# Clone and install all dependencies
git clone https://github.com/VanshSharmaPES/ClearTriage.git
cd ClearTriage
npm install
```

### Environment Variables

Create a `.env` file in the root:
```env
MONGO_URI=mongodb://127.0.0.1:27017/triage-system
PORT=3000
```

### Train the Model

```bash
cd ml-service
venv\Scripts\python.exe data_processing.py   # Clean raw data
venv\Scripts\python.exe train_model.py       # Train RandomForest
```

### Run Development Servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| ML Service | http://localhost:8000 |

### Simulate ER Traffic

```bash
node server/generator.js
```

## API Endpoints

### Backend (Express)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients` | List all patients |
| `POST` | `/api/patients` | Admit new patient |
| `GET` | `/api/patients/:id` | Get patient by ID |
| `PUT` | `/api/patients/:id` | Update patient |
| `DELETE` | `/api/patients/:id` | Delete patient |

### ML Service (FastAPI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Predict triage score (ESI 1–5) |

**Example prediction request:**
```json
{
  "age": 70, "heart_rate": 130, "temp": 39.5,
  "bp_systolic": 90, "bp_diastolic": 60, "o2_sat": 88,
  "pain_score": 8, "chief_complaint": "chest pain"
}
```

**Response:**
```json
{
  "triage_score": 2,
  "triage_label": "Emergent",
  "confidence": 0.44,
  "probabilities": { "ESI_1": 0.06, "ESI_2": 0.44, "ESI_3": 0.42, "ESI_4": 0.08, "ESI_5": 0.0 }
}
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, Tailwind CSS |
| Backend | Express.js, Mongoose |
| Database | MongoDB |
| ML | scikit-learn, FastAPI, pandas |
| Dev Tools | concurrently, dotenv |

## License

ISC

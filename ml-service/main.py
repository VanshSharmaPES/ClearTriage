import sys
import io
import os
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

app = FastAPI(title="ClearTriage ML Service")

# ── Load model & artifacts on startup ────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
model = joblib.load(os.path.join(DATA_DIR, 'model.pkl'))
scaler = joblib.load(os.path.join(DATA_DIR, 'scaler.pkl'))
feature_names = joblib.load(os.path.join(DATA_DIR, 'feature_names.pkl'))

print(f"✅ Model loaded: {len(feature_names)} features, classes={list(model.classes_)}")

# Columns that the scaler was fitted on
VITALS_COLS = ['Age', 'SBP', 'DBP', 'HR', 'RR', 'BT', 'Saturation', 'NRS_pain']


class PatientInput(BaseModel):
    age: int = 0
    sex: int = 1  # 1=Male, 2=Female
    heart_rate: float = 80
    temp: float = 98.6  # Fahrenheit → needs conversion if BT is Celsius
    bp_systolic: float = 120
    bp_diastolic: float = 80
    o2_sat: float = 98
    respiratory_rate: float = 18
    pain_score: int = 0  # NRS 0-10
    mental: int = 1  # 1=Alert
    arrival_mode: int = 1
    injury: int = 1
    patients_per_hour: int = 5
    chief_complaint: Optional[str] = "other"


@app.get("/")
def read_root():
    return {"message": "ML Service is running", "model": "RandomForest", "features": len(feature_names)}


@app.post("/predict")
def predict(data: PatientInput):
    """Predict triage score (ESI 1-5) from patient data."""
    # Build feature dict matching training columns
    row = {
        'Sex': data.sex,
        'Age': data.age,
        'Patients number per hour': data.patients_per_hour,
        'Arrival mode': data.arrival_mode,
        'Injury': data.injury,
        'Mental': data.mental,
        'Pain': 1 if data.pain_score > 0 else 0,
        'NRS_pain': data.pain_score,
        'SBP': data.bp_systolic,
        'DBP': data.bp_diastolic,
        'HR': data.heart_rate,
        'RR': data.respiratory_rate,
        'BT': data.temp,
        'Saturation': data.o2_sat,
    }

    # Add complaint dummy columns (all False, set matching one to True)
    complaint = data.chief_complaint.strip().lower() if data.chief_complaint else 'other'
    for col in feature_names:
        if col.startswith('complaint_'):
            complaint_name = col.replace('complaint_', '')
            row[col] = (complaint_name == complaint)

    # Build DataFrame with correct column order
    input_df = pd.DataFrame([row])

    # Ensure all training columns exist (fill missing with 0)
    for col in feature_names:
        if col not in input_df.columns:
            input_df[col] = 0

    input_df = input_df[feature_names]  # Enforce exact column order

    # Scale vitals (same as training)
    vitals_in_features = [c for c in VITALS_COLS if c in feature_names]
    input_df[vitals_in_features] = scaler.transform(input_df[vitals_in_features])

    # Predict
    prediction = model.predict(input_df)
    probabilities = model.predict_proba(input_df)[0]

    triage_score = int(prediction[0])
    confidence = float(max(probabilities))

    labels = {1: 'Immediate', 2: 'Emergent', 3: 'Urgent', 4: 'Less Urgent', 5: 'Non-Urgent'}

    return {
        "triage_score": triage_score,
        "triage_label": labels.get(triage_score, "Unknown"),
        "confidence": round(confidence, 3),
        "probabilities": {
            f"ESI_{i}": round(float(p), 3)
            for i, p in zip(model.classes_, probabilities)
        }
    }

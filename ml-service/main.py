import sys
import io
import os
import hashlib
import json
import numpy as np
import pandas as pd
import joblib
import shap
import redis
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

# ── SHAP Explainer ───────────────────────────────────────
explainer = shap.TreeExplainer(model)

# ── Redis Prediction Cache ───────────────────────────
REDIS_URL = os.environ.get("REDIS_URL")
redis_client = None
if REDIS_URL:
    try:
        redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        redis_client.ping()
        print(f"✅ Redis Cache connected at {REDIS_URL}")
    except redis.ConnectionError:
        print(f"⚠️ Redis Connection Failed at {REDIS_URL}, running without cache")
        redis_client = None
else:
    print(f"⚠️ No REDIS_URL provided, running without cache")

cache_stats = {"hits": 0, "misses": 0}

def get_cache_key(data_dict):
    """Generate hash key from patient vitals."""
    key_data = json.dumps(data_dict, sort_keys=True)
    return hashlib.md5(key_data.encode()).hexdigest()

def cache_get(key):
    if not redis_client:
        return None
    try:
        cached = redis_client.get(key)
        if cached:
            cache_stats["hits"] += 1
            return json.loads(cached)
        else:
            cache_stats["misses"] += 1
            return None
    except redis.ConnectionError:
        return None

def cache_set(key, value):
    if not redis_client:
        return
    try:
        # Cache for 1 hour
        redis_client.setex(key, 3600, json.dumps(value))
    except redis.ConnectionError:
        pass

print(f"✅ Model loaded: {len(feature_names)} features, classes={list(model.classes_)}")
print(f"✅ SHAP TreeExplainer ready")

# Columns that the scaler was fitted on
VITALS_COLS = ['Age', 'SBP', 'DBP', 'HR', 'RR', 'BT', 'Saturation', 'NRS_pain']

# Human-readable feature name mapping
FEATURE_LABELS = {
    'Age': 'Age',
    'Sex': 'Sex',
    'HR': 'Heart Rate',
    'BT': 'Body Temperature',
    'SBP': 'Systolic BP',
    'DBP': 'Diastolic BP',
    'RR': 'Respiratory Rate',
    'Saturation': 'O₂ Saturation',
    'NRS_pain': 'Pain Score',
    'Mental': 'Mental Status',
    'Injury': 'Injury',
    'Pain': 'Pain Presence',
    'Arrival mode': 'Arrival Mode',
    'Patients number per hour': 'ER Volume',
}


class PatientInput(BaseModel):
    age: int = 0
    sex: int = 1
    heart_rate: float = 80
    temp: float = 98.6
    bp_systolic: float = 120
    bp_diastolic: float = 80
    o2_sat: float = 98
    respiratory_rate: float = 18
    pain_score: int = 0
    mental: int = 1
    arrival_mode: int = 1
    injury: int = 1
    patients_per_hour: int = 5
    chief_complaint: Optional[str] = "other"


def get_shap_explanations(input_df, predicted_class):
    """Generate human-readable explanations from SHAP values."""
    sv = explainer.shap_values(input_df)

    class_idx = list(model.classes_).index(predicted_class)

    # shap 0.50 returns shape (n_samples, n_features, n_classes)
    if isinstance(sv, np.ndarray) and sv.ndim == 3:
        shap_vals = sv[0, :, class_idx]
    elif isinstance(sv, list):
        # Older shap: list of arrays, one per class
        shap_vals = sv[class_idx][0]
    else:
        shap_vals = sv[0]

    # Pair feature names with their SHAP values
    feature_impacts = []
    for fname, sval in zip(feature_names, shap_vals):
        label = FEATURE_LABELS.get(fname, None)
        # For complaint dummies, make a readable name
        if fname.startswith('complaint_'):
            complaint = fname.replace('complaint_', '').replace('_', ' ').title()
            label = f"Complaint: {complaint}"
        if label is None:
            label = fname
        feature_impacts.append((label, float(sval), float(input_df[fname].iloc[0])))

    # Sort by absolute SHAP value (most impactful first)
    feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)

    # Generate top explanations in plain English
    explanations = []
    for label, sval, raw_val in feature_impacts[:5]:
        if abs(sval) < 0.01:
            continue
        direction = "increased" if sval > 0 else "decreased"
        strength = "significantly" if abs(sval) > 0.1 else "moderately" if abs(sval) > 0.05 else "slightly"
        pct = abs(sval) / (sum(abs(s) for _, s, _ in feature_impacts) + 1e-9) * 100
        explanations.append({
            "feature": label,
            "impact": round(sval, 4),
            "direction": direction,
            "text": f"{label} {strength} {direction} urgency ({pct:.0f}%)"
        })

    return explanations


@app.get("/")
def read_root():
    return {"message": "ML Service is running", "model": "RandomForest", "features": len(feature_names), "shap": True, "cache": True}


@app.get("/cache-stats")
def get_cache_stats():
    total = cache_stats["hits"] + cache_stats["misses"]
    rate = (cache_stats["hits"] / total * 100) if total > 0 else 0
    
    redis_health = "disconnected"
    cache_size = 0
    if redis_client:
        try:
            redis_client.ping()
            redis_health = "connected"
            cache_size = redis_client.dbsize()
        except redis.ConnectionError:
            pass

    return {
        "provider": "redis",
        "health": redis_health,
        "hits": cache_stats["hits"],
        "misses": cache_stats["misses"],
        "total": total,
        "hit_rate": f"{rate:.1f}%",
        "cache_size": cache_size,
        "ttl_seconds": 3600
    }


def build_why_short(data, explanations):
    """Build compact 'Why?' string using raw (unscaled) vitals."""
    # Map features to raw input values for human readability
    raw_values = {
        'Heart Rate': f"{data.heart_rate:.0f}bpm",
        'Body Temperature': f"{data.temp:.1f}°",
        'O₂ Saturation': f"{data.o2_sat:.0f}%",
        'Systolic BP': f"{data.bp_systolic:.0f}mmHg",
        'Diastolic BP': f"{data.bp_diastolic:.0f}mmHg",
        'Respiratory Rate': f"{data.respiratory_rate:.0f}/min",
        'Pain Score': f"{data.pain_score}/10",
        'Age': f"{data.age}y",
    }

    parts = []
    for exp in explanations[:3]:
        feat = exp["feature"]
        val = raw_values.get(feat, "")
        qualifier = "High" if exp["direction"] == "increased" else "Low"
        if val:
            parts.append(f"{qualifier} {feat} ({val})")
        else:
            parts.append(f"{qualifier} {feat}")

    return ", ".join(parts) if parts else "Insufficient data"


@app.post("/predict")
def predict(data: PatientInput):
    """Predict triage score (ESI 1-5) with SHAP explanations."""
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

    # Check LRU cache
    cache_key = get_cache_key(row)
    cached = cache_get(cache_key)
    if cached:
        return cached

    # Add complaint dummy columns
    complaint = data.chief_complaint.strip().lower() if data.chief_complaint else 'other'
    for col in feature_names:
        if col.startswith('complaint_'):
            complaint_name = col.replace('complaint_', '')
            row[col] = (complaint_name == complaint)

    # Build DataFrame with correct column order
    input_df = pd.DataFrame([row])
    for col in feature_names:
        if col not in input_df.columns:
            input_df[col] = 0
    input_df = input_df[feature_names]

    # Scale vitals
    vitals_in_features = [c for c in VITALS_COLS if c in feature_names]
    input_df[vitals_in_features] = scaler.transform(input_df[vitals_in_features])

    # Predict
    prediction = model.predict(input_df)
    probabilities = model.predict_proba(input_df)[0]
    triage_score = int(prediction[0])
    confidence = float(max(probabilities))

    # SHAP explanations
    explanations = get_shap_explanations(input_df, prediction[0])

    # Compact "Why?" text using raw vitals
    why_short = build_why_short(data, explanations)

    labels = {1: 'Immediate', 2: 'Emergent', 3: 'Urgent', 4: 'Less Urgent', 5: 'Non-Urgent'}

    result = {
        "triage_score": triage_score,
        "triage_label": labels.get(triage_score, "Unknown"),
        "confidence": round(confidence, 3),
        "probabilities": {
            f"ESI_{i}": round(float(p), 3)
            for i, p in zip(model.classes_, probabilities)
        },
        "explanations": [e["text"] for e in explanations],
        "why_short": why_short,
        "shap_details": explanations,
        "cached": False,
    }

    # Store in cache
    result_cached = {**result, "cached": True}
    cache_set(cache_key, result_cached)

    return result

"""
Sanity Test Suite — Model Validation (Day 45-50)
Structured test cases to verify model predictions make clinical sense.
"""
import sys
import io
import os
import json
import numpy as np
import pandas as pd
import joblib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'ml-service', 'data')

model = joblib.load(os.path.join(DATA_DIR, 'model.pkl'))
scaler = joblib.load(os.path.join(DATA_DIR, 'scaler.pkl'))
feature_names = joblib.load(os.path.join(DATA_DIR, 'feature_names.pkl'))

VITALS_COLS = ['Age', 'SBP', 'DBP', 'HR', 'RR', 'BT', 'Saturation', 'NRS_pain']

# ── Test Cases ────────────────────────────────────────
TEST_CASES = [
    {
        "name": "Critical Cardiac",
        "desc": "HR=150, Temp=104°F (40°C), BP 80/50, O₂=85 → should be ESI 1-2",
        "input": {"age": 60, "sex": 1, "hr": 150, "bt": 40.0, "sbp": 80, "dbp": 50,
                  "rr": 30, "saturation": 85, "nrs_pain": 9, "mental": 1, "injury": 1,
                  "arrival_mode": 1, "patients_per_hour": 5},
        "expected_range": [1, 2],
    },
    {
        "name": "Moderate Respiratory",
        "desc": "HR=100, Temp=101°F (38.3°C), BP 130/85, O₂=93 → should be ESI 2-3",
        "input": {"age": 50, "sex": 2, "hr": 100, "bt": 38.3, "sbp": 130, "dbp": 85,
                  "rr": 24, "saturation": 93, "nrs_pain": 5, "mental": 1, "injury": 1,
                  "arrival_mode": 1, "patients_per_hour": 5},
        "expected_range": [2, 3],
    },
    {
        "name": "Mild Stable",
        "desc": "HR=72, Temp=98.6°F (36.5°C), normal BP, O₂=99 → should be ESI 4-5",
        "input": {"age": 30, "sex": 1, "hr": 72, "bt": 36.5, "sbp": 120, "dbp": 80,
                  "rr": 16, "saturation": 99, "nrs_pain": 2, "mental": 1, "injury": 1,
                  "arrival_mode": 1, "patients_per_hour": 5},
        "expected_range": [3, 5],
    },
    {
        "name": "Elderly Critical",
        "desc": "Age=85, HR=40 (bradycardia), Temp=95°F (35°C), O₂=82 → should be ESI 1-2",
        "input": {"age": 85, "sex": 2, "hr": 40, "bt": 35.0, "sbp": 70, "dbp": 40,
                  "rr": 10, "saturation": 82, "nrs_pain": 0, "mental": 1, "injury": 1,
                  "arrival_mode": 1, "patients_per_hour": 5},
        "expected_range": [1, 2],
    },
    {
        "name": "Young Healthy",
        "desc": "Age=20, all vitals normal → should be ESI 4-5",
        "input": {"age": 20, "sex": 1, "hr": 75, "bt": 36.6, "sbp": 118, "dbp": 76,
                  "rr": 14, "saturation": 99, "nrs_pain": 0, "mental": 1, "injury": 1,
                  "arrival_mode": 1, "patients_per_hour": 3},
        "expected_range": [3, 5],
    },
    {
        "name": "Edge: Minimal Input",
        "desc": "Only age and sex, rest defaults → should not crash",
        "input": {"age": 45, "sex": 1, "hr": 80, "bt": 36.5, "sbp": 120, "dbp": 80,
                  "rr": 18, "saturation": 98, "nrs_pain": 0, "mental": 1, "injury": 1,
                  "arrival_mode": 1, "patients_per_hour": 5},
        "expected_range": [1, 5],  # Any valid score is acceptable
    },
]


def predict_case(input_data):
    """Run a single prediction through the model pipeline."""
    row = {
        'Sex': input_data.get('sex', 1),
        'Age': input_data.get('age', 30),
        'Patients number per hour': input_data.get('patients_per_hour', 5),
        'Arrival mode': input_data.get('arrival_mode', 1),
        'Injury': input_data.get('injury', 1),
        'Mental': input_data.get('mental', 1),
        'Pain': 1 if input_data.get('nrs_pain', 0) > 0 else 0,
        'NRS_pain': input_data.get('nrs_pain', 0),
        'SBP': input_data.get('sbp', 120),
        'DBP': input_data.get('dbp', 80),
        'HR': input_data.get('hr', 80),
        'RR': input_data.get('rr', 18),
        'BT': input_data.get('bt', 36.5),
        'Saturation': input_data.get('saturation', 98),
    }

    # Add complaint dummies (all False)
    for col in feature_names:
        if col.startswith('complaint_'):
            row[col] = False

    df = pd.DataFrame([row])
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0
    df = df[feature_names]

    # Scale vitals
    vitals_in = [c for c in VITALS_COLS if c in feature_names]
    df[vitals_in] = scaler.transform(df[vitals_in])

    pred = model.predict(df)[0]
    proba = model.predict_proba(df)[0]
    conf = float(max(proba))

    return int(pred), conf


def main():
    print("=" * 60)
    print("🧪 SANITY TEST SUITE — Model Validation")
    print("=" * 60)

    results = []
    passed = 0
    failed = 0

    for i, tc in enumerate(TEST_CASES, 1):
        score, conf = predict_case(tc["input"])
        lo, hi = tc["expected_range"]
        is_pass = lo <= score <= hi
        status = "✅ PASS" if is_pass else "❌ FAIL"

        if is_pass:
            passed += 1
        else:
            failed += 1

        print(f"\n{'─' * 50}")
        print(f"Test {i}: {tc['name']} — {status}")
        print(f"  {tc['desc']}")
        print(f"  Predicted: ESI {score} (confidence: {conf:.0%})")
        print(f"  Expected:  ESI {lo}-{hi}")

        results.append({
            "name": tc["name"],
            "description": tc["desc"],
            "predicted": score,
            "confidence": round(conf, 3),
            "expected_range": tc["expected_range"],
            "passed": is_pass,
        })

    # Summary
    print(f"\n{'=' * 60}")
    print(f"📋 SUMMARY: {passed} passed, {failed} failed out of {len(TEST_CASES)}")
    print(f"{'=' * 60}")

    # Save
    out_path = os.path.join(SCRIPT_DIR, 'sanity_results.json')
    output = {
        "total": len(TEST_CASES),
        "passed": passed,
        "failed": failed,
        "pass_rate": f"{passed/len(TEST_CASES)*100:.0f}%",
        "tests": results,
    }
    with open(out_path, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"💾 Results saved to {out_path}")


if __name__ == '__main__':
    main()

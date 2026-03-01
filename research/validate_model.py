"""
Human vs AI Validation Study
Compares model predictions against actual KTAS_expert scores
Generates confusion matrix and accuracy report for the paper
"""
import sys
import io
import os
import json
import numpy as np
import pandas as pd
import joblib
import shap
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, recall_score
)

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Paths — resolve relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(SCRIPT_DIR, '..', 'ml-service')
DATA_DIR = os.path.join(ML_DIR, 'data')
OUT_DIR = SCRIPT_DIR

# Load artifacts
model = joblib.load(os.path.join(DATA_DIR, 'model.pkl'))
scaler = joblib.load(os.path.join(DATA_DIR, 'scaler.pkl'))
feature_names = joblib.load(os.path.join(DATA_DIR, 'feature_names.pkl'))

# Initialize SHAP explainer
explainer = shap.TreeExplainer(model)

print("=" * 60)
print("🧪 HUMAN vs AI VALIDATION STUDY & SHAP AUDIT")
print("=" * 60)

# Load full cleaned data
df = pd.read_csv(os.path.join(DATA_DIR, 'cleaned_data.csv'))
TARGET = 'KTAS_expert'

# Sample 50 cases (stratified across triage levels)
np.random.seed(42)
samples = []
for level in sorted(df[TARGET].unique()):
    group = df[df[TARGET] == level]
    n = min(len(group), 10)
    samples.append(group.sample(n, random_state=42))
sample = pd.concat(samples).reset_index(drop=True)
if len(sample) > 50:
    sample = sample.sample(50, random_state=42).reset_index(drop=True)

print(f"\n📊 Sample: {len(sample)} cases")
print(f"   Distribution: {dict(sample[TARGET].value_counts().sort_index())}")

# Prepare features
DROP_COLS = ['Group']
X_sample = sample.drop(columns=[c for c in DROP_COLS + [TARGET] if c in sample.columns])

# Ensure column order matches training
for col in feature_names:
    if col not in X_sample.columns:
        X_sample[col] = 0
X_sample = X_sample[feature_names]

# Scale vitals
VITALS_COLS = ['Age', 'SBP', 'DBP', 'HR', 'RR', 'BT', 'Saturation', 'NRS_pain']
vitals_in = [c for c in VITALS_COLS if c in feature_names]
X_sample[vitals_in] = scaler.transform(X_sample[vitals_in])

# Predict
y_true = sample[TARGET].values
y_pred = model.predict(X_sample)
y_proba = model.predict_proba(X_sample)

# ── Results ──────────────────────────────────────────
accuracy = accuracy_score(y_true, y_pred)
recall = recall_score(y_true, y_pred, average='macro', zero_division=0)

print(f"\n{'=' * 60}")
print("📋 RESULTS")
print(f"{'=' * 60}")
print(f"Accuracy:     {accuracy:.4f} ({accuracy*100:.1f}%)")
print(f"Macro Recall: {recall:.4f} ({recall*100:.1f}%)")

# Classification report
labels = ['ESI 1 (Immediate)', 'ESI 2 (Emergent)', 'ESI 3 (Urgent)',
          'ESI 4 (Less Urgent)', 'ESI 5 (Non-Urgent)']
existing_classes = sorted(set(y_true) | set(y_pred))
used_labels = [labels[i-1] for i in existing_classes if i <= len(labels)]

print(f"\nClassification Report:")
print(classification_report(y_true, y_pred, labels=existing_classes,
                            target_names=used_labels, zero_division=0))

# Confusion matrix
cm = confusion_matrix(y_true, y_pred, labels=existing_classes)
cm_labels = [f'ESI{i}' for i in existing_classes]

print("Confusion Matrix (rows=Doctor, cols=AI):")
print(f"{'':>8}", '  '.join(f'{l:>5}' for l in cm_labels))
for i, row in enumerate(cm):
    print(f"{cm_labels[i]:>8}", '  '.join(f'{v:5d}' for v in row))

# ── Misclassified cases ──────────────────────────────
mismatches = np.where(y_true != y_pred)[0]
print(f"\n{'=' * 60}")
print(f"⚠ MISCLASSIFIED CASES: {len(mismatches)} / {len(y_true)}")
print(f"{'=' * 60}")

misclass_details = []
for idx in mismatches[:10]:  # Show first 10
    row_raw = sample.iloc[idx]
    row_scaled = X_sample.iloc[[idx]]
    
    # SHAP Audit
    pred_class = y_pred[idx]
    class_idx = list(model.classes_).index(pred_class)
    
    sv = explainer.shap_values(row_scaled)
    if isinstance(sv, np.ndarray) and sv.ndim == 3:
        shap_vals = sv[0, :, class_idx]
    elif isinstance(sv, list):
        shap_vals = sv[class_idx][0]
    else:
        shap_vals = sv[0]
        
    feature_impacts = [(feature_names[i], float(shap_vals[i])) for i in range(len(feature_names))]
    feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
    top_features = [{"feature": f, "impact": round(v, 4)} for f, v in feature_impacts[:3]]

    detail = {
        'index': int(idx),
        'doctor_score': int(y_true[idx]),
        'ai_score': int(y_pred[idx]),
        'age': float(row_raw.get('Age', 0)),
        'sex': int(row_raw.get('Sex', 0)),
        'hr': float(row_raw.get('HR', 0)),
        'confidence': float(max(y_proba[idx])),
        'shap_top_features': top_features
    }
    misclass_details.append(detail)
    direction = "↑ Over-triaged" if y_pred[idx] < y_true[idx] else "↓ Under-triaged"
    print(f"  Case {idx}: Doctor=ESI {y_true[idx]}, AI=ESI {y_pred[idx]} ({direction}) "
          f"| Age={detail['age']:.0f}, HR={detail['hr']:.0f}, Conf={detail['confidence']:.1%}")
    print(f"       ↳ AI focused on: {', '.join([f['feature'] for f in top_features])}")

# ── Save results ─────────────────────────────────────
results = {
    'sample_size': len(y_true),
    'accuracy': round(accuracy, 4),
    'macro_recall': round(recall, 4),
    'confusion_matrix': cm.tolist(),
    'confusion_labels': cm_labels,
    'total_misclassified': len(mismatches),
    'misclassified_details': misclass_details,
    'class_distribution': {f'ESI_{k}': int(v) for k, v in
                           pd.Series(y_true).value_counts().sort_index().items()},
}

out_path = os.path.join(OUT_DIR, 'validation_results.json')
with open(out_path, 'w') as f:
    json.dump(results, f, indent=2)

audit_path = os.path.join(OUT_DIR, 'explainability_audit.json')
with open(audit_path, 'w') as f:
    json.dump(misclass_details, f, indent=2)

print(f"\n💾 Results saved to {out_path}")
print(f"💾 Audit saved to {audit_path}")
print(f"{'=' * 60}")

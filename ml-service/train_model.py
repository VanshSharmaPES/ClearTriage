import sys
import io
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── Config ──────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
CLEAN_PATH = os.path.join(DATA_DIR, 'cleaned_data.csv')
MODEL_PATH = os.path.join(DATA_DIR, 'model.pkl')
FEATURES_PATH = os.path.join(DATA_DIR, 'feature_names.pkl')

TARGET = 'KTAS_expert'

# Columns to drop (not useful for prediction)
DROP_COLS = ['Group']  # Internal grouping ID


def main():
    print("🚀 Starting model training...\n")

    # ── 1. Load cleaned data ─────────────────────────────
    df = pd.read_csv(CLEAN_PATH)
    print(f"✅ Loaded {df.shape[0]} rows × {df.shape[1]} columns")

    # ── 2. Feature selection ─────────────────────────────
    drop = [c for c in DROP_COLS if c in df.columns]
    df = df.drop(columns=drop)

    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    feature_names = list(X.columns)
    print(f"📊 Features: {len(feature_names)} columns")
    print(f"🎯 Target: {TARGET} (classes: {sorted(y.unique())})")
    print(f"   Distribution: {dict(y.value_counts().sort_index())}")

    # ── 3. Train/test split ──────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n📂 Split: {len(X_train)} train / {len(X_test)} test")

    # ── 4. Train RandomForest ────────────────────────────
    print("🌲 Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight='balanced',  # Handle class imbalance (ESI 1 & 5 are rare)
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    print("✅ Training complete!")

    # ── 5. Evaluate ──────────────────────────────────────
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(f"\n{'=' * 50}")
    print(f"📋 MODEL EVALUATION")
    print(f"{'=' * 50}")
    print(f"Accuracy: {acc:.4f} ({acc*100:.1f}%)")

    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=[
        'ESI 1 (Immediate)', 'ESI 2 (Emergent)', 'ESI 3 (Urgent)',
        'ESI 4 (Less Urgent)', 'ESI 5 (Non-Urgent)'
    ]))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    labels = ['ESI1', 'ESI2', 'ESI3', 'ESI4', 'ESI5']
    print(f"{'':>8}", '  '.join(f'{l:>5}' for l in labels))
    for i, row in enumerate(cm):
        print(f"{labels[i]:>8}", '  '.join(f'{v:5d}' for v in row))

    # ── 6. Feature importance ────────────────────────────
    print(f"\n🔑 Top 10 Feature Importances:")
    importances = pd.Series(model.feature_importances_, index=feature_names)
    for feat, imp in importances.nlargest(10).items():
        bar = '█' * int(imp * 50)
        print(f"  {feat:<30s} {imp:.4f} {bar}")

    # ── 7. Save model ────────────────────────────────────
    joblib.dump(model, MODEL_PATH)
    joblib.dump(feature_names, FEATURES_PATH)
    print(f"\n💾 Model saved to {MODEL_PATH}")
    print(f"💾 Feature names saved to {FEATURES_PATH}")
    print(f"{'=' * 50}")


if __name__ == '__main__':
    main()

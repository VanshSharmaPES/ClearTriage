import sys
import io
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import os
import joblib

# Fix Windows console encoding for emoji output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── Config ──────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
RAW_PATH = os.path.join(DATA_DIR, 'data.csv')
CLEAN_PATH = os.path.join(DATA_DIR, 'cleaned_data.csv')
SCALER_PATH = os.path.join(DATA_DIR, 'scaler.pkl')

# Target column
TARGET = 'KTAS_expert'

# Columns that are determined AFTER triage (data leakage)
LEAKAGE_COLS = [
    'Diagnosis in ED', 'Disposition', 'KTAS_RN',
    'Length of stay_min', 'KTAS duration_min',
    'mistriage', 'Error_group'
]

# Vitals / numeric features to normalize
VITALS = ['Age', 'SBP', 'DBP', 'HR', 'RR', 'BT', 'Saturation', 'NRS_pain']

# Top N chief complaints to keep as dummies
TOP_N_COMPLAINTS = 15


def main():
    print("🚀 Starting data processing pipeline...\n")

    # ── 1. Load ──────────────────────────────────────────
    df = pd.read_csv(RAW_PATH, sep=';', encoding='latin-1')
    print(f"✅ Loaded raw data: {df.shape[0]} rows, {df.shape[1]} columns")

    # ── 2. Drop leakage columns ──────────────────────────
    existing = [c for c in LEAKAGE_COLS if c in df.columns]
    df = df.drop(columns=existing)
    print(f"🗑  Dropped {len(existing)} leakage columns")

    # ── 3. Fix types ─────────────────────────────────────
    # Pandas 3.x uses StringDtype ('str') not 'object' for text columns.
    # Force all non-text feature columns to numeric.
    text_col = 'Chief_complain'
    for col in df.columns:
        if col == text_col or col == TARGET:
            continue
        if pd.api.types.is_string_dtype(df[col]):
            df[col] = df[col].astype(str).str.replace(',', '.', regex=False)
            df[col] = pd.to_numeric(df[col], errors='coerce')
    print("🔧 Coerced all feature columns to numeric")

    # ── 4. Handle missing values ─────────────────────────
    # Saturation: fill with median (54% missing)
    if 'Saturation' in df.columns:
        sat_missing = df['Saturation'].isnull().sum()
        sat_median = df['Saturation'].median()
        df['Saturation'] = df['Saturation'].fillna(sat_median)
        print(f"🩹 Filled {sat_missing} missing Saturation values (median={sat_median:.1f})")

    # Fill any other numeric nulls with median
    for col in df.select_dtypes(include=[np.number]).columns:
        nulls = df[col].isnull().sum()
        if nulls > 0:
            df[col] = df[col].fillna(df[col].median())
            print(f"🩹 Filled {nulls} missing {col} values with median")

    # ── 5. Encode categoricals ───────────────────────────
    if text_col in df.columns:
        df[text_col] = df[text_col].astype(str).str.strip().str.lower()
        top = df[text_col].value_counts().nlargest(TOP_N_COMPLAINTS).index.tolist()
        df[text_col] = df[text_col].apply(lambda x: x if x in top else 'other')
        dummies = pd.get_dummies(df[text_col], prefix='complaint')
        df = pd.concat([df.drop(text_col, axis=1), dummies], axis=1)
        print(f"🔤 Encoded complaints into {len(dummies.columns)} dummy columns")

    # ── 6. Normalize vitals ──────────────────────────────
    cols_to_scale = [c for c in VITALS if c in df.columns]
    scaler = StandardScaler()
    df[cols_to_scale] = scaler.fit_transform(df[cols_to_scale])
    joblib.dump(scaler, SCALER_PATH)
    print(f"📏 Normalized {len(cols_to_scale)} columns, scaler saved")

    # ── 7. Save ──────────────────────────────────────────
    df.to_csv(CLEAN_PATH, index=False)
    print(f"\n💾 Cleaned data saved to {CLEAN_PATH}")

    # ── 8. Report ────────────────────────────────────────
    print("\n" + "=" * 50)
    print("📋 DATA QUALITY REPORT")
    print("=" * 50)
    print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"Missing values: {df.isnull().sum().sum()}")
    print(f"\nTarget ({TARGET}) distribution:")
    for level, count in df[TARGET].value_counts().sort_index().items():
        pct = count / len(df) * 100
        bar = '█' * int(pct / 2)
        print(f"  ESI {level}: {count:4d} ({pct:5.1f}%) {bar}")
    print(f"\nFeature columns: {df.shape[1] - 1}")
    print("=" * 50)


if __name__ == '__main__':
    main()

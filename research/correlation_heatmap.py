"""
Correlation Heatmap — Feature Selection Visualization
Generates heatmap showing feature correlations with KTAS_expert
For the paper's Methodology section (Day 31-33)
"""
import sys
import io
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, '..', 'ml-service', 'data', 'cleaned_data.csv')
OUT_PATH = os.path.join(SCRIPT_DIR, 'correlation_heatmap.png')
OUT_TARGET_PATH = os.path.join(SCRIPT_DIR, 'target_correlations.png')

print("=" * 60)
print("📊 CORRELATION HEATMAP — Feature Selection")
print("=" * 60)

# Load data
df = pd.read_csv(DATA_PATH)
TARGET = 'KTAS_expert'

# Drop non-numeric and ID columns
drop_cols = ['Group']
numeric_df = df.drop(columns=[c for c in drop_cols if c in df.columns])

# Convert bool columns to int for correlation
for col in numeric_df.select_dtypes(include='bool').columns:
    numeric_df[col] = numeric_df[col].astype(int)

print(f"Computing correlations for {numeric_df.shape[1]} features...")

# ── 1. Full correlation matrix ────────────────────────
corr = numeric_df.corr()

plt.figure(figsize=(16, 14))
sns.heatmap(corr, annot=False, cmap='RdBu_r', center=0,
            vmin=-1, vmax=1, square=True,
            linewidths=0.5, linecolor='#333',
            cbar_kws={'label': 'Correlation Coefficient', 'shrink': 0.8})
plt.title('Feature Correlation Matrix — ClearTriage Dataset', fontsize=16, pad=20)
plt.tight_layout()
plt.savefig(OUT_PATH, dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print(f"✅ Full heatmap saved: {OUT_PATH}")

# ── 2. Target correlations bar chart ──────────────────
target_corr = corr[TARGET].drop(TARGET).sort_values(ascending=True)

fig, ax = plt.subplots(figsize=(10, 8))
colors = ['#ef4444' if v < 0 else '#22c55e' for v in target_corr.values]
bars = ax.barh(target_corr.index, target_corr.values, color=colors, edgecolor='#333', linewidth=0.5)
ax.set_xlabel('Correlation with KTAS Expert Score', fontsize=12)
ax.set_title('Feature Correlations with Triage Score (KTAS_expert)', fontsize=14, pad=15)
ax.axvline(x=0, color='#666', linewidth=0.8, linestyle='--')
ax.set_xlim(-0.5, 0.5)

# Add value labels
for bar, val in zip(bars, target_corr.values):
    ax.text(val + (0.01 if val >= 0 else -0.01), bar.get_y() + bar.get_height()/2,
            f'{val:.3f}', va='center', ha='left' if val >= 0 else 'right',
            fontsize=8, color='#333')

plt.tight_layout()
plt.savefig(OUT_TARGET_PATH, dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print(f"✅ Target correlations saved: {OUT_TARGET_PATH}")

# ── 3. Print top correlations ────────────────────────
print(f"\n📋 Top Correlations with {TARGET}:")
print("-" * 40)
for feat, val in target_corr.sort_values(key=abs, ascending=False).head(10).items():
    direction = "↑" if val > 0 else "↓"
    print(f"  {direction} {feat:<30s} {val:+.4f}")

print(f"\n{'=' * 60}")

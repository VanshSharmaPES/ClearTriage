import sys
import io
import os
import subprocess
import pandas as pd
from pymongo import MongoClient

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
OVERRIDES_PATH = os.path.join(DATA_DIR, 'overrides.csv')
LAST_TRAINED_FLAG = os.path.join(DATA_DIR, 'last_retrained_count.txt')

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/glass_box_triage")
client = MongoClient(MONGO_URL)
db = client.get_database()
patients_collection = db['patients']

def fetch_overrides():
    print("📥 Querying MongoDB for human overrides...", flush=True)
    query = {"overrideScore": {"$ne": None}}
    overrides = list(patients_collection.find(query))
    
    if not overrides:
        print("⚠️ No overrides found. Model does not need retraining.")
        return False
    
    # Read last retrained count to avoid retraining if no new overrides exist (optional optimization)
    last_count = 0
    if os.path.exists(LAST_TRAINED_FLAG):
        with open(LAST_TRAINED_FLAG, 'r') as f:
            last_count = int(f.read().strip() or 0)
    
    if len(overrides) == last_count:
        print(f"✅ Found {len(overrides)} total overrides, but no NEW overrides since last retrain.")
        print("Skipping retraining pipeline.")
        return False
        
    print(f"✅ Found {len(overrides)} human overrides. Building training dataset...")
    
    records = []
    # Columns expected before preprocessing: 
    # Group,Sex,Age,Patients number per hour,Arrival mode,Injury,Chief_complain,Mental,Pain,NRS_pain,SBP,DBP,HR,RR,BT,Saturation,KTAS_expert
    for p in overrides:
        vitals = p.get('vitals', {})
        records.append({
            'Group': 3, # Use a different group id to identify them if needed
            'Sex': 1 if p.get('gender') == 'Male' else 2,
            'Age': p.get('age', 30),
            'Patients number per hour': 3,
            'Arrival mode': 3,
            'Injury': 2,
            'Chief_complain': p.get('symptoms', ['other'])[0] if p.get('symptoms') else 'other',
            'Mental': 1,
            'Pain': 0,
            'NRS_pain': 0,
            'SBP': vitals.get('bpSystolic', 120),
            'DBP': vitals.get('bpDiastolic', 80),
            'HR': vitals.get('heartRate', 80),
            'RR': 18,
            'BT': vitals.get('temp', 36.5),
            'Saturation': vitals.get('o2Sat', 98),
            'KTAS_expert': p.get('overrideScore') # The ground truth!
        })
        
    df_overrides = pd.DataFrame(records)
    
    # Save weight column. Overrides should carry heavy weight. There's a way in train_model, but for now we duplicate them to artificially balance.
    # Actually, the base dataset has millions of rows? No, data.csv only has tens of thousands.
    # Let's duplicate the overrides 10x so the model learns from them faster
    if len(df_overrides) > 0:
        df_overrides = pd.concat([df_overrides]*10, ignore_index=True)
        
    df_overrides.to_csv(OVERRIDES_PATH, index=False)
    print(f"💾 Saved overrides to {OVERRIDES_PATH} (duplicated 10x for emphasis)")
    
    # Save the new count
    with open(LAST_TRAINED_FLAG, 'w') as f:
        f.write(str(len(overrides)))
        
    return True

def run_pipeline():
    has_new_data = fetch_overrides()
    if not has_new_data:
        return
        
    base_dir = os.path.dirname(__file__)
    print("\n" + "="*50, flush=True)
    print("🔄 RE-RUNNING PREPROCESSING PIPELINE...", flush=True)
    print("="*50, flush=True)
    subprocess.run([sys.executable, os.path.join(base_dir, 'data_processing.py')], check=True)
    
    print("\n" + "="*50, flush=True)
    print("🌲 RE-TRAINING RANDOM FOREST MODEL...", flush=True)
    print("="*50, flush=True)
    subprocess.run([sys.executable, os.path.join(base_dir, 'train_model.py')], check=True)
    
    print("\n✅ Automated retraining pipeline completed successfully!", flush=True)
    print("🔄 Note: You need to restart the ML Service to load the newly trained model.", flush=True)

if __name__ == '__main__':
    run_pipeline()
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class PatientInput(BaseModel):
    age: int
    heart_rate: float
    # placeholder for now

@app.get("/")
def read_root():
    return {"message": "ML Service is running"}

@app.post("/predict")
def predict(data: PatientInput):
    # placeholder prediction
    return {"triage_score": 0}

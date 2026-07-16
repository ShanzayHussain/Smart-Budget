from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import RiskRequest, RiskResponse
from predict import predict_risk

app = FastAPI(title="SmartBudget ML Service")

# allow your Express backend (and frontend, if you ever call this directly) to reach it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # fine for local dev; tighten this before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/predict", response_model=RiskResponse)
def predict(request: RiskRequest):
    try:
        result = predict_risk(request.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
import pandas as pd
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "models" / "risk_model.pkl"
COLUMNS_PATH = Path(__file__).parent.parent / "models" / "feature_columns.pkl"

model = joblib.load(MODEL_PATH)
feature_columns = joblib.load(COLUMNS_PATH)

CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Other"]
MOODS = ["Happy", "Neutral", "Stressed", "Impulsive", "Tired"]


def build_feature_row(data: dict) -> pd.DataFrame:
    """
    Takes a single request's raw fields and builds a one-row DataFrame
    matching the exact columns the model was trained on (same one-hot
    encoding, same column order).
    """
    row = {
        "day_of_week": data["day_of_week"],
        "amount_spent_today": data["amount_spent_today"],
        "days_left_in_month": data["days_left_in_month"],
        "percent_budget_used_so_far": data["percent_budget_used_so_far"],
        "spending_trend": data["spending_trend"],
    }

    # manually one-hot encode, since we only have a single row —
    # pd.get_dummies alone can't know about categories absent from this one row
    for cat in CATEGORIES:
        row[f"category_{cat}"] = 1 if data["category"] == cat else 0

    for mood in MOODS:
        row[f"mood_while_spending_{mood}"] = 1 if data["mood_while_spending"] == mood else 0

    df_row = pd.DataFrame([row])

    # reorder / fill any missing columns to exactly match training-time columns
    df_row = df_row.reindex(columns=feature_columns, fill_value=0)

    return df_row


def predict_risk(data: dict) -> dict:
    features = build_feature_row(data)
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    confidence = float(max(probabilities))

    return {"level": prediction, "confidence": round(confidence, 3)}
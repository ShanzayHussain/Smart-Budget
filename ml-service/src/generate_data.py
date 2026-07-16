import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)  # reproducible randomness — same output every run

CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Other"]
MOODS = ["Happy", "Neutral", "Stressed", "Impulsive", "Tired"]

def simulate_one_user_month(user_id: int, month_days: int = 30):
    """
    Simulates one fake user's spending across one month.
    Returns a list of daily rows (dicts) plus computed running stats.
    """
    monthly_budget = np.random.choice([10000, 15000, 20000, 25000, 30000])

    # each fake user has a hidden "impulsiveness" trait —
    # this is what the model will later learn to detect indirectly
    impulsiveness = np.random.uniform(0.2, 1.0)

    daily_spend = []
    daily_mood = []
    daily_category = []

    for day in range(1, month_days + 1):
        day_of_week = (day % 7)  # 0=Mon ... 6=Sun, roughly
        is_weekend = day_of_week in [5, 6]

        # mood is somewhat random, but impulsive users are more often
        # "Stressed" or "Impulsive" — this is the pattern the model should find
        mood_weights = [0.25, 0.25, 0.2, 0.15, 0.15]
        if impulsiveness > 0.6:
            mood_weights = [0.15, 0.15, 0.25, 0.3, 0.15]
        mood = np.random.choice(MOODS, p=mood_weights)

        category = np.random.choice(CATEGORIES)

        # base spend, scaled up by impulsiveness, weekends, and certain moods
        base = np.random.gamma(shape=2.0, scale=200)
        mood_multiplier = 1.8 if mood in ["Stressed", "Impulsive"] else 1.0
        weekend_multiplier = 1.4 if is_weekend else 1.0

        amount = base * (0.5 + impulsiveness) * mood_multiplier * weekend_multiplier
        amount = round(max(amount, 50), 2)  # no negative or zero spends

        daily_spend.append(amount)
        daily_mood.append(mood)
        daily_category.append(category)

    # now walk through the month day-by-day to compute running features
    rows = []
    cumulative = 0
    for day in range(1, month_days + 1):
        cumulative += daily_spend[day - 1]
        days_left = month_days - day

        # spending_trend: average of last 3 days vs. average of all days before that
        if day >= 4:
            recent_avg = np.mean(daily_spend[max(0, day - 3):day])
            earlier_avg = np.mean(daily_spend[:max(1, day - 3)])
            trend = recent_avg - earlier_avg
        else:
            trend = 0

        rows.append({
            "user_id": user_id,
            "day": day,
            "day_of_week": day % 7,
            "amount_spent_today": daily_spend[day - 1],
            "category": daily_category[day - 1],
            "mood_while_spending": daily_mood[day - 1],
            "days_left_in_month": days_left,
            "percent_budget_used_so_far": round((cumulative / monthly_budget) * 100, 2),
            "spending_trend": round(trend, 2),
            "monthly_budget": monthly_budget,
        })

    # the label: did this simulated month actually end in overspending?
    total_spent = sum(daily_spend)
    overspend_ratio = total_spent / monthly_budget

    if overspend_ratio >= 1.15:
        risk_label = "High"
    elif overspend_ratio >= 0.95:
        risk_label = "Medium"
    else:
        risk_label = "Low"

    for row in rows:
        row["overspending_risk"] = risk_label

    return rows


def generate_dataset(num_users: int = 500):
    all_rows = []
    for user_id in range(1, num_users + 1):
        all_rows.extend(simulate_one_user_month(user_id))
    return pd.DataFrame(all_rows)


if __name__ == "__main__":
    df = generate_dataset(num_users=500)
    df.to_csv("../data/synthetic_expenses.csv", index=False)
    print(f"Generated {len(df)} rows across {df['user_id'].nunique()} simulated users.")
    print(df["overspending_risk"].value_counts())
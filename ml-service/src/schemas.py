from pydantic import BaseModel

class RiskRequest(BaseModel):
    day_of_week: int
    amount_spent_today: float
    days_left_in_month: int
    percent_budget_used_so_far: float
    spending_trend: float
    category: str
    mood_while_spending: str


class RiskResponse(BaseModel):
    level: str
    confidence: float
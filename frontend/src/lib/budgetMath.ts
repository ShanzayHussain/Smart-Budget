export interface BudgetStats {
  totalBudget: number;
  spentSoFar: number;
  percentUsed: number;
  daysInMonth: number;
  daysElapsed: number;
  daysLeft: number;
  safeDailyPace: number; // how much you can still spend per remaining day
  actualDailyAverage: number; // how much you've actually been spending per day so far
}

export function calculateBudgetStats(
  totalBudget: number,
  spentSoFar: number
): BudgetStats {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysLeft = daysInMonth - daysElapsed;
  const remaining = Math.max(totalBudget - spentSoFar, 0);

  return {
    totalBudget,
    spentSoFar,
    percentUsed: totalBudget > 0 ? Math.min((spentSoFar / totalBudget) * 100, 100) : 0,
    daysInMonth,
    daysElapsed,
    daysLeft,
    safeDailyPace: daysLeft > 0 ? remaining / daysLeft : remaining,
    actualDailyAverage: daysElapsed > 0 ? spentSoFar / daysElapsed : 0,
  };
}

/**
 * PLACEHOLDER — replace this with a call to your FastAPI ML service
 * once it's built. For now this is simple rule-based logic so the
 * dashboard has something real to show. The real version will send
 * mood history, day-of-week patterns, and spending_trend to the
 * model and get back Low/Medium/High.
 */
export function placeholderRiskEstimate(stats: BudgetStats): {
  level: "Low" | "Medium" | "High";
  reason: string;
} {
  const paceRatio = stats.actualDailyAverage / (stats.safeDailyPace || 1);

  if (paceRatio >= 1.4) {
    return {
      level: "High",
      reason: "You're spending faster than your remaining budget can support.",
    };
  }
  if (paceRatio >= 1.0) {
    return {
      level: "Medium",
      reason: "Your pace is close to the edge of what's left this month.",
    };
  }
  return {
    level: "Low",
    reason: "Your current pace keeps you comfortably within budget.",
  };
}
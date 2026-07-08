interface Expense {
  amount: number;
  category: string;
  createdAt: string;
}

export function categoryBreakdown(expenses: Expense[]) {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] ?? 0) + e.amount;
  }
  return {
    labels: Object.keys(totals),
    data: Object.values(totals),
  };
}

export function dailySpending(expenses: Expense[]) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // one bucket per day of the month so far, defaulting to 0
  const totals = Array(now.getDate()).fill(0);

  for (const e of expenses) {
    const day = new Date(e.createdAt).getDate();
    if (day <= totals.length) {
      totals[day - 1] += e.amount;
    }
  }

  return {
    labels: totals.map((_, i) => String(i + 1)),
    data: totals,
    daysInMonth,
  };
}

// Running cumulative spend, used to derive a simple risk-trend line
export function cumulativeSpending(expenses: Expense[]) {
  const { labels, data } = dailySpending(expenses);
  let running = 0;
  const cumulative = data.map((d) => (running += d));
  return { labels, data: cumulative };
}
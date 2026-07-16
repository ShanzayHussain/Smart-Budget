interface Expense {
  amount: number;
  mood: string;
  createdAt: string;
}

export function spendByMood(expenses: Expense[]) {
  const totals: Record<string, { total: number; count: number }> = {};
  for (const e of expenses) {
    if (!totals[e.mood]) totals[e.mood] = { total: 0, count: 0 };
    totals[e.mood].total += e.amount;
    totals[e.mood].count += 1;
  }
  const moods = Object.keys(totals);
  return {
    labels: moods,
    averages: moods.map((m) => Math.round(totals[m].total / totals[m].count)),
  };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function spendByDayOfWeek(expenses: Expense[]) {
  const totals = Array(7).fill(0);
  const counts = Array(7).fill(0);
  for (const e of expenses) {
    const day = new Date(e.createdAt).getDay();
    totals[day] += e.amount;
    counts[day] += 1;
  }
  return {
    labels: DAY_LABELS,
    averages: totals.map((t, i) => (counts[i] > 0 ? Math.round(t / counts[i]) : 0)),
  };
}
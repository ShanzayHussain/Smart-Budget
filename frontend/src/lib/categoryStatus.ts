interface Expense {
  amount: number;
  category: string;
}

export interface CategoryStatus {
  category: string;
  spent: number;
  budget: number;
  percentUsed: number;
  overBy: number;
}

export function checkCategoryBudgets(
  expenses: Expense[],
  categoryBudgets: Record<string, number> | null
): CategoryStatus[] {
  if (!categoryBudgets) return [];

  const spentByCategory: Record<string, number> = {};
  for (const e of expenses) {
    spentByCategory[e.category] = (spentByCategory[e.category] ?? 0) + e.amount;
  }

  return Object.entries(categoryBudgets)
    .map(([category, budget]) => {
      const spent = spentByCategory[category] ?? 0;
      return {
        category,
        spent,
        budget,
        percentUsed: budget > 0 ? (spent / budget) * 100 : 0,
        overBy: Math.max(spent - budget, 0),
      };
    })
    .filter((c) => c.percentUsed >= 80) // only surface categories worth flagging
    .sort((a, b) => b.percentUsed - a.percentUsed);
}
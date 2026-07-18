import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMonthKey, getMonthLabel } from "../lib/date";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { calculateBudgetStats, placeholderRiskEstimate } from "../lib/budgetMath";
import { categoryBreakdown } from "../lib/trendsData";
import { fetchRisk, type RiskResult } from "../lib/api";
import { checkCategoryBudgets } from "../lib/categoryStatus";

interface Expense {
  id: string;
  amount: number;
  category: string;
  mood: string;
  description?: string;
  createdAt: string;
  timestamp?: { toDate?: () => Date };
}

const RISK_META = {
  Low: { label: "On Track", pill: "ON TRACK", bg: "bg-[#5EEAD4]/25", text: "text-[#0F6656]" },
  Medium: { label: "At Risk", pill: "WATCH PACE", bg: "bg-[#E8A33D]/15", text: "text-[#B8770E]" },
  High: { label: "Over Budget", pill: "OVER PACE", bg: "bg-red-50", text: "text-red-700" },
};

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔",
  Dining: "🍽️",
  Transport: "🚌",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Education: "📚",
  Other: "📦",
};

const MOOD_STYLES: Record<string, string> = {
  Happy: "bg-[#16815F]/10 text-[#16815F]",
  Satisfied: "bg-[#16815F]/10 text-[#16815F]",
  Planned: "bg-[#16815F]/10 text-[#16815F]",
  Neutral: "bg-gray-100 text-[#0B1220]/60",
  Stressed: "bg-red-50 text-red-700",
  Impulsive: "bg-[#E8A33D]/15 text-[#B8770E]",
  Tired: "bg-gray-100 text-[#0B1220]/60",
};

const CURRENT_MONTH_LABEL = new Date().toLocaleDateString(undefined, {
  month: "long",
  year: "numeric",
});

export default function Dashboard() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [totalBudget, setTotalBudget] = useState<number | null>(null);
  const [lastSavedBudget, setLastSavedBudget] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [mlRisk, setMlRisk] = useState<RiskResult | null>(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [mlError, setMlError] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data();
        setName(userData?.name || user.displayName || "there");
        const currentMonthKey = getMonthKey();
        const budgetIsCurrent = userData?.budgetMonth === currentMonthKey;
        setTotalBudget(budgetIsCurrent ? userData?.monthlyBudget ?? null : null);
        setLastSavedBudget(userData?.monthlyBudget ?? null);
        setCategoryBudgets(budgetIsCurrent ? userData?.categoryBudgets ?? null : null);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const q = query(collection(db, "expenses"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const rows: Expense[] = snap.docs
          .map((d) => ({
            id: d.id,
            amount: d.data().amount,
            category: d.data().category,
            mood: d.data().mood,
            description: d.data().description,
            createdAt: d.data().createdAt,
            timestamp: d.data().timestamp,
          }))
          .filter((expense) => {
            const expenseDate =
              expense.timestamp?.toDate?.() ??
              (expense.createdAt ? new Date(expense.createdAt) : null);
            return expenseDate !== null && expenseDate >= startOfMonth;
          });
        setExpenses(rows);
      } catch (err) {
        console.error("Dashboard data failed to load:", err);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const result = await fetchRisk();
        setMlRisk(result);
      } catch (err) {
        console.error("ML risk fetch failed:", err);
        setMlError(true);
      } finally {
        setMlLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return <div className="min-h-[calc(100vh-73px)] bg-[#F5F6F8]" />;
  }

  const spentSoFar = expenses.reduce((sum, e) => sum + e.amount, 0);
  const needsCurrentBudget = totalBudget === null;
  const budgetForDashboard = totalBudget ?? lastSavedBudget ?? 0;
  const stats = calculateBudgetStats(budgetForDashboard, spentSoFar);
  const risk: { level: "Low" | "Medium" | "High" } = mlRisk
    ? { level: mlRisk.level }
    : placeholderRiskEstimate(stats);
  const riskMeta = RISK_META[risk.level];
  const category = categoryBreakdown(expenses);
  const remaining = Math.max(budgetForDashboard - spentSoFar, 0);
  const percentLeft = budgetForDashboard > 0 ? Math.max(100 - stats.percentUsed, 0) : 0;
  const categoryAlerts = checkCategoryBudgets(expenses, categoryBudgets);

  const now = new Date();
  const today = now.getDate();
  const daysInMonth = stats.daysInMonth || new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Bucket the month into 10 segments for the pace chart, summing real
  // expenses into past/current buckets and leaving future buckets as
  // placeholders (no data exists for days that haven't happened yet).
  const BUCKET_COUNT = 10;
  const buckets = Array.from({ length: BUCKET_COUNT }, (_, i) => {
    const startDay = Math.floor((i * daysInMonth) / BUCKET_COUNT) + 1;
    const endDay = Math.max(Math.floor(((i + 1) * daysInMonth) / BUCKET_COUNT), startDay);
    const isFuture = startDay > today;
    const isCurrent = today >= startDay && today <= endDay;
    const amount = expenses.reduce((sum, e) => {
      const d = new Date(e.createdAt).getDate();
      return d >= startDay && d <= endDay ? sum + e.amount : sum;
    }, 0);
    return { startDay, endDay, isFuture, isCurrent, amount };
  });
  const maxBucketAmount = Math.max(...buckets.filter((b) => !b.isFuture).map((b) => b.amount), 1);

  // Top category driving spend this month, for the Smart Insight card.
  const topCategoryIndex = category.data.length
    ? category.data.indexOf(Math.max(...category.data))
    : -1;
  const topCategory = topCategoryIndex >= 0 ? category.labels[topCategoryIndex] : null;
  const topCategoryAmount = topCategoryIndex >= 0 ? category.data[topCategoryIndex] : 0;
  const topCategoryShare =
    spentSoFar > 0 && topCategoryAmount ? Math.round((topCategoryAmount / spentSoFar) * 100) : 0;

  const recentExpenses = [...expenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recentToShow = recentExpenses.slice(0, visibleCount);

  return (
    <>
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-[#0B1220] mb-2">
              Your Financial Overview
            </h1>
            <p className="text-[#0B1220]/60">
              Welcome back{name ? `, ${name}` : ""}! Your finances are currently{" "}
              <span className={riskMeta.text + " font-semibold"}>{riskMeta.label}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/log-expense"
              className="inline-flex items-center gap-1.5 bg-[#0B1220] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16815F] transition-colors"
            >
              <span aria-hidden>+</span> Add Expense
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#0B1220] text-white rounded-2xl p-6 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-xs uppercase tracking-wide text-white/50">
                Monthly Budget
              </span>
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <CalendarIcon />
              </span>
            </div>

            <p className="font-display text-3xl font-bold mb-2">
              PKR {budgetForDashboard.toLocaleString()}
            </p>

            {needsCurrentBudget ? (
              <p className="text-xs text-white/50 mb-4">
                No budget set for {getMonthLabel()}
              </p>
            ) : (
              <p className="text-xs text-[#5EEAD4] mb-4">
                ↗ Budget set for {CURRENT_MONTH_LABEL}
              </p>
            )}

            <Link
              to="/set-budget"
              className="mt-auto self-start md:mt-0 md:absolute md:bottom-6 md:right-6 inline-flex items-center gap-1.5 bg-[#5EEAD4] text-[#0B1220] px-3 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
            >
              {needsCurrentBudget ? "Set Budget" : "Edit Budget"}
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-xs uppercase tracking-wide text-[#0B1220]/50">
                Remaining Balance
              </span>
              <span className="w-8 h-8 rounded-full bg-[#5EEAD4]/25 flex items-center justify-center text-[#0F6656]">
                <CoinIcon />
              </span>
            </div>
            <p className="font-display text-3xl font-bold text-[#0B1220] mb-4">
              PKR {remaining.toLocaleString()}
            </p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-[#16815F] transition-all"
                style={{ width: `${Math.min(percentLeft, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#0B1220]/50">{percentLeft.toFixed(0)}% of your budget left</p>
          </div>

          <div className="bg-[#5EEAD4] rounded-2xl p-6 text-[#0B1220]">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-xs uppercase tracking-wide text-[#0B1220]/60">
                Daily Safe Limit
              </span>
              <span className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center">
                <CheckShieldIcon />
              </span>
            </div>
            <p className="font-display text-3xl font-bold mb-2">
              PKR {stats.safeDailyPace.toFixed(0)}
            </p>
            <p className="text-sm text-[#0B1220]/70 leading-relaxed mb-4">
              ML Predicted: you can spend this daily and stay within your {getMonthLabel()} budget.
            </p>
            <span className="inline-block text-[10px] font-semibold tracking-wide bg-white/40 px-2.5 py-1 rounded-full">
              SMART LIMIT
            </span>
          </div>
        </section>

        {/* Category budget alerts — only renders when at least one category crosses 80% */}
        {categoryAlerts.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E4E7EC] p-5">
            <h3 className="font-medium text-sm text-[#0B1220]/70 mb-3">Category budget alerts</h3>
            <div className="space-y-2">
              {categoryAlerts.map((c) => (
                <div
                  key={c.category}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    c.overBy > 0 ? "bg-red-50" : "bg-[#E8A33D]/10"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{CATEGORY_ICONS[c.category] ?? "📦"}</span>
                    <span className="font-medium text-[#0B1220]">{c.category}</span>
                  </span>
                  <span className={c.overBy > 0 ? "text-red-700 font-medium" : "text-[#B8770E] font-medium"}>
                    {c.overBy > 0
                      ? `PKR ${c.overBy.toFixed(0)} over budget`
                      : `${c.percentUsed.toFixed(0)}% of budget used`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pace analysis + smart insight */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E7EC] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold text-[#0B1220]">
                Budget Pace Analysis
              </h2>
              {mlLoading ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-[#0B1220]/50">
                  ⋯ ANALYZING
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${riskMeta.bg} ${riskMeta.text}`}
                >
                  {risk.level === "Low" ? "✓" : "!"} {riskMeta.pill}
                  {mlError && (
                    <span
                      className="text-[9px] font-normal opacity-70"
                      title="ML service unavailable — showing estimated pace instead"
                    >
                      (est.)
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-end gap-2 sm:gap-3 h-40 mb-3">
              {buckets.map((b, i) => {
                const heightPct = b.isFuture
                  ? 22
                  : Math.max((b.amount / maxBucketAmount) * 100, b.amount > 0 ? 8 : 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
                    {b.isCurrent && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0B1220] text-white text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-1 rounded whitespace-nowrap">
                        TODAY
                      </span>
                    )}
                    <div
                      className={
                        b.isFuture
                          ? "w-full rounded-md border-2 border-dashed border-[#D8DCE3] bg-transparent"
                          : b.isCurrent
                          ? "w-full rounded-md bg-[#16815F]"
                          : "w-full rounded-md bg-[#0B1220]"
                      }
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-[#0B1220]/50">
              <span>Week 1</span>
              <span className="font-semibold text-[#0B1220]">
                Current Progress (Day {today})
              </span>
              <span>Week 4</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E7EC] border-l-4 border-l-[#16815F] p-6">
            <span className="inline-flex w-9 h-9 rounded-lg bg-[#5EEAD4]/30 items-center justify-center text-[#0F6656] mb-4">
              <BulbIcon />
            </span>
            <h3 className="font-display text-lg font-semibold text-[#0B1220] mb-3">
              Smart Insight
            </h3>
            {topCategory ? (
              <p className="text-sm text-[#0B1220]/70 leading-relaxed mb-4">
                Your spending on <span className="font-semibold text-[#0B1220]">{topCategory}</span>{" "}
                makes up <span className="font-semibold text-[#0B1220]">{topCategoryShare}%</span> of
                this month's total. Our ML model predicts you'll stay {riskMeta.label.toLowerCase()} if
                this pattern continues.
              </p>
            ) : (
              <p className="text-sm text-[#0B1220]/70 leading-relaxed mb-4">
                Log a few expenses this month and we'll start surfacing patterns in your spending here.
              </p>
            )}
            <Link to="/insights" className="text-sm font-medium text-[#16815F] hover:underline">
              View pattern breakdown →
            </Link>
          </div>
        </section>

        {/* Recent expenses */}
        <section className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
            <h3 className="font-display text-lg font-semibold text-[#0B1220]">Recent Expenses</h3>
            <div className="flex items-center gap-2">
              <Link to="/history" className="text-xs font-medium text-[#16815F] hover:underline">
                See full history →
              </Link>
            </div>
          </div>

          {recentToShow.length === 0 ? (
            <p className="text-sm text-[#0B1220]/50 text-center py-10">
              No expenses logged yet this month.
            </p>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_1fr_1.6fr_1fr_1fr] gap-4 px-6 py-3 bg-[#F5F6F8] text-xs font-semibold uppercase tracking-wide text-[#0B1220]/50">
                <span>Date</span>
                <span>Category</span>
                <span>Description</span>
                <span>Mood</span>
                <span className="text-right">Amount</span>
              </div>

              <div className="divide-y divide-[#E4E7EC]">
                {recentToShow.map((e) => (
                  <div key={e.id} className="px-6 py-4">
                    {/* Mobile: stacked card */}
                    <div className="flex sm:hidden justify-between items-start gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#0B1220] flex items-center gap-1.5">
                          <span aria-hidden>{CATEGORY_ICONS[e.category] ?? "📦"}</span>
                          {e.category}
                        </p>
                        <p className="text-xs text-[#0B1220]/50 mt-0.5">
                          {new Date(e.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <span
                          className={`inline-block mt-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                            MOOD_STYLES[e.mood] ?? "bg-gray-100 text-[#0B1220]/60"
                          }`}
                        >
                          {e.mood}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[#0B1220] whitespace-nowrap">
                        − PKR {e.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Desktop: grid row */}
                    <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1.6fr_1fr_1fr] gap-4 items-center">
                      <span className="text-sm text-[#0B1220]/70">
                        {new Date(e.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-sm text-[#0B1220] flex items-center gap-1.5">
                        <span aria-hidden>{CATEGORY_ICONS[e.category] ?? "📦"}</span>
                        {e.category}
                      </span>
                      <span className="text-sm text-[#0B1220]/70">
                        {e.description || `${e.category} expense`}
                      </span>
                      <span>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                            MOOD_STYLES[e.mood] ?? "bg-gray-100 text-[#0B1220]/60"
                          }`}
                        >
                          {e.mood}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-[#0B1220] text-right">
                        − PKR {e.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E4E7EC] py-8 mt-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
          <div>
            <p className="font-semibold text-[#0B1220]">SmartBudget AI</p>
            <p className="text-xs text-[#0B1220]/40">
              © {new Date().getFullYear()} SmartBudget AI. Empowering students financially.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#0B1220]/60">
            <a href="#" className="hover:text-[#0B1220]">Privacy Policy</a>
            <a href="#" className="hover:text-[#0B1220]">Terms of Service</a>
            <a href="#" className="hover:text-[#0B1220]">Financial Literacy Guide</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 9.5c0-1 1-1.5 3-1.5s3 .8 3 1.8-1 1.5-3 1.7-3 .8-3 1.8 1 1.7 3 1.7 3-.5 3-1.5" />
    </svg>
  );
}

function CheckShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.5.4.8 1 .8 1.7V17h5.6v-1.5c0-.7.3-1.3.8-1.7A6 6 0 0012 3z" />
    </svg>
  );
}
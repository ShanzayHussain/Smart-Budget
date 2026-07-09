import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMonthKey, getMonthLabel } from "../lib/date";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { calculateBudgetStats, placeholderRiskEstimate } from "../lib/budgetMath";
import { categoryBreakdown, dailySpending, cumulativeSpending } from "../lib/trendsData";
import logo from "../assets/logo.png";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  annotationPlugin
);

interface Expense {
  id: string;
  amount: number;
  category: string;
  mood: string;
  createdAt: string;
  timestamp?: { toDate?: () => Date };
}

const RISK_STYLES = {
  Low: { bg: "bg-[#3F7D58]/10", text: "text-[#3F7D58]", border: "border-[#3F7D58]/30", dot: "bg-[#3F7D58]" },
  Medium: { bg: "bg-[#E8A33D]/10", text: "text-[#B34A2E]", border: "border-[#E8A33D]/40", dot: "bg-[#E8A33D]" },
  High: { bg: "bg-[#B34A2E]/10", text: "text-[#B34A2E]", border: "border-[#B34A2E]/40", dot: "bg-[#B34A2E]" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#E8A33D",
  Transport: "#3F7D58",
  Shopping: "#B34A2E",
  Entertainment: "#5C7A99",
  Other: "#8B8681",
};

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔",
  Transport: "🚌",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Other: "📦",
};

const MOOD_STYLES: Record<string, string> = {
  Happy: "bg-[#3F7D58]/10 text-[#3F7D58]",
  Neutral: "bg-gray-100 text-[#1F2A44]/60",
  Stressed: "bg-[#B34A2E]/10 text-[#B34A2E]",
  Impulsive: "bg-[#E8A33D]/15 text-[#B34A2E]",
  Tired: "bg-gray-100 text-[#1F2A44]/60",
};

const crosshairPlugin = {
  id: "crosshair",
  afterDatasetsDraw(chart: any) {
    const { ctx, tooltip, chartArea } = chart;
    if (!tooltip?.getActiveElements()?.length) return;

    const activePoint = tooltip.getActiveElements()[0];
    const x = activePoint.element.x;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#1F2A4430";
    ctx.stroke();
    ctx.restore();
  },
};

const CURRENT_MONTH_LABEL = new Date().toLocaleDateString(undefined, {
  month: "long",
  year: "numeric",
});

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [totalBudget, setTotalBudget] = useState<number | null>(null);
  const [lastSavedBudget, setLastSavedBudget] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEverSetBudget, setHasEverSetBudget] = useState(false);

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
        setHasEverSetBudget(!!userData?.monthlyBudget);

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

  async function handleSignOut() {
    await signOut(auth);
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1]">
        <span className="font-mono text-sm text-[#1F2A44]/60">Loading…</span>
      </div>
    );
  }

  const spentSoFar = expenses.reduce((sum, e) => sum + e.amount, 0);
  const needsCurrentBudget = totalBudget === null;
  const budgetForDashboard = totalBudget ?? lastSavedBudget ?? 0;
  const stats = calculateBudgetStats(budgetForDashboard, spentSoFar);
  const risk = placeholderRiskEstimate(stats);
  const riskStyle = RISK_STYLES[risk.level];
  const category = categoryBreakdown(expenses);
  const daily = dailySpending(expenses);
  const cumulative = cumulativeSpending(expenses);

  const activeCategoryCount = new Set(expenses.map((e) => e.category)).size;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const recentExpenses = [...expenses]
    .filter((e) => new Date(e.createdAt) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const recentLogsCount = recentExpenses.length;
  const recentToShow = recentExpenses.slice(0, 5);

  const doughnutData = {
    labels: category.labels,
    datasets: [
      {
        data: category.data,
        backgroundColor: category.labels.map((l) => CATEGORY_COLORS[l] ?? "#8B8681"),
        borderWidth: 0,
      },
    ],
  };

  const dailyBarData = {
    labels: daily.labels,
    datasets: [
      {
        label: "Daily spend",
        data: daily.data,
        backgroundColor: "#5C7A99",
        borderRadius: 4,
        maxBarThickness: 18,
      },
    ],
  };

  const cumulativeLineData = {
    labels: cumulative.labels,
    datasets: [
      {
        label: "Cumulative spend",
        data: cumulative.data,
        borderColor: "#1F2A44",
        backgroundColor: "#1F2A4415",
        tension: 0.3,
        pointRadius: 0,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: "#00000008" }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1] font-body">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="SmartBudget Logo" className="w-8 h-8 object-contain" />
            <span className="font-display text-xl font-extrabold tracking-tight">
              SmartBudget
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#1F2A44]/60 hidden sm:inline">Hi, {name}</span>
            <Link
              to="/log-expense"
              className="bg-[#0c0c0e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B34A2E] transition-colors"
            >
              + Log Expense
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-[#1F2A44]/70 hover:text-[#B34A2E] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-0 py-4 space-y-6">
        
        <p className="font-mono text-xs uppercase tracking-widest text-[#1F2A44]/50">
          {CURRENT_MONTH_LABEL}
        </p>

        {/* Overview: budget + risk */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display text-base font-semibold">Budget Overview</h2>
              <div className="flex items-center gap-2">
                <Link
                  to="/set-budget"
                  className="text-xs font-medium text-[#1F2A44]/50 hover:text-[#B34A2E] transition-colors"
                >
                  {needsCurrentBudget ? "Set budget" : "Edit budget"}
                </Link>
                <span className="text-xs font-mono bg-gray-100 text-[#1F2A44]/60 px-2.5 py-1 rounded-full">
                  {stats.daysLeft} days left
                </span>
              </div>
            </div>

            {needsCurrentBudget ? (
              <div className="pt-1">
                <p className="font-display text-xl font-semibold mb-2">
                  {hasEverSetBudget
                    ? `Set your budget for ${getMonthLabel()}`
                    : "Let's set up your first budget"}
                </p>
                <p className="text-sm text-[#1F2A44]/60 mb-5 max-w-xl">
                  {hasEverSetBudget
                    ? "A new month has started, so it's time for a fresh budget. Your past spending and history are still saved."
                    : "Once you set a monthly budget, your dashboard will start tracking your spending pace and overspending risk automatically."}
                </p>
                <Link
                  to="/set-budget"
                  className="inline-block bg-[#0c0c0e] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#B34A2E] transition-colors"
                >
                  Set your budget
                </Link>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-[#1F2A44]/50 mb-1">Spent so far</p>
                    <p className="font-mono text-3xl font-semibold">
                      PKR {spentSoFar.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#1F2A44]/50 mb-1">Total budget</p>
                    <p className="font-mono text-sm font-medium text-[#1F2A44]/70">
                      PKR {budgetForDashboard.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stats.percentUsed}%`,
                      backgroundColor:
                        stats.percentUsed > 90 ? "#B34A2E" : stats.percentUsed > 60 ? "#E8A33D" : "#3F7D58",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-[#1F2A44]/50 mb-6">
                  <span>{stats.percentUsed.toFixed(0)}% used</span>
                  <span>PKR {Math.max(budgetForDashboard - spentSoFar, 0).toLocaleString()} remaining</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-[#1F2A44]/50 mb-1">Actual average</p>
                    <p className="font-mono text-lg font-semibold">
                      PKR {stats.actualDailyAverage.toFixed(0)}
                      <span className="text-xs text-[#1F2A44]/40 font-normal">/day</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#1F2A44]/50 mb-1">Safe target</p>
                    <p className="font-mono text-lg font-semibold text-[#3F7D58]">
                      PKR {stats.safeDailyPace.toFixed(0)}
                      <span className="text-xs text-[#1F2A44]/40 font-normal">/day</span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col ${riskStyle.border}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[#1F2A44]/50">Risk Status</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${riskStyle.dot}`} />
              <span className={`font-mono text-lg font-semibold ${riskStyle.text}`}>
                {risk.level}
              </span>
            </div>
            <p className="text-sm text-[#1F2A44]/70 leading-relaxed mb-5">{risk.reason}</p>

            <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#1F2A44]/50">Actual average</span>
                <span className="font-mono font-medium">
                  PKR {stats.actualDailyAverage.toFixed(0)}/day
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#1F2A44]/50">Safe target</span>
                <span className="font-mono font-medium text-[#3F7D58]">
                  PKR {stats.safeDailyPace.toFixed(0)}/day
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="bg-white/70 rounded-xl border border-gray-200 px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#1F2A44]/60">
          <span>📅 {stats.daysInMonth} days in month</span>
          <span>🏷️ {activeCategoryCount} active categories</span>
          <span>📝 {recentLogsCount} recent logs</span>
        </section>

        {/* Category + Daily spending */}
        {expenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-[#1F2A44]/60 text-sm">Log a few expenses to see your trends here.</p>
          </div>
        ) : (
          <>
            <section className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-medium text-sm text-[#1F2A44]/70 mb-4">
                  Spending by Category
                </h3>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 shrink-0">
                    <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } } }} />
                  </div>
                  <div className="space-y-2 text-sm flex-1">
                    {category.labels.map((label, i) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[label] ?? "#8B8681" }}
                          />
                          {label}
                        </span>
                        <span className="font-mono text-xs text-[#1F2A44]/60">
                          PKR {category.data[i].toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-medium text-sm text-[#1F2A44]/70 mb-4">Daily Spending</h3>
                <div className="h-44">
                  <Bar data={dailyBarData} options={chartOptions} />
                </div>
              </div>
            </section>

            {/* Cumulative spend */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-sm text-[#1F2A44]/70">
                  Cumulative Spending Month-to-Date
                </h3>
                <span className="text-xs font-mono bg-[#B34A2E]/10 text-[#B34A2E] px-2.5 py-1 rounded-full">
                  Ceiling: PKR {budgetForDashboard.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#1F2A44]/40 mb-4">
                Steeper slope late in the month usually means risk is climbing.
              </p>
              <div className="h-44">
                <Line
                  data={cumulativeLineData}
                  plugins={[crosshairPlugin]}
                  options={{
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                      legend: { display: false },
                      annotation: {
                        annotations: {
                          ceiling: {
                            type: "line",
                            yMin: budgetForDashboard,
                            yMax: budgetForDashboard,
                            borderColor: "#B34A2E",
                            borderWidth: 1.5,
                            borderDash: [6, 4],
                          },
                        },
                      },
                      tooltip: {
                        enabled: true,
                        backgroundColor: "#ffffff",
                        titleColor: "#1F2A44",
                        bodyColor: "#1F2A44",
                        borderColor: "#e5e7eb",
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                        titleFont: { size: 13, weight: 600 },
                        bodyFont: { size: 12 },
                        callbacks: {
                          title: (items: any) => `Jul ${items[0].label}`,
                          label: (item: any) =>
                            `Total Spent: PKR ${item.parsed.y.toLocaleString()}`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: "#00000008" },
                        ticks: {
                          font: { size: 10 },
                          callback: (val: any) => (val >= 1000 ? `${val / 1000}k` : val),
                        },
                        suggestedMax: budgetForDashboard * 1.1,
                      },
                      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    },
                  }}
                />
              </div>
            </section>
          </>
        )}

        {/* Recent Transactions */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-sm text-[#1F2A44]/70">Recent Transactions</h3>
            <Link
              to="/history"
              className="text-xs font-medium text-[#B34A2E] hover:underline"
            >
              See full history →
            </Link>
          </div>

          {recentToShow.length === 0 ? (
            <p className="text-sm text-[#1F2A44]/50 text-center py-6">
              No expenses logged in the last 7 days.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentToShow.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-lg">
                      {CATEGORY_ICONS[e.category] ?? "📦"}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{e.category}</p>
                      <p className="text-xs text-[#1F2A44]/40">
                        {new Date(e.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        MOOD_STYLES[e.mood] ?? "bg-gray-100 text-[#1F2A44]/60"
                      }`}
                    >
                      {e.mood}
                    </span>
                    <span className="font-mono text-sm font-semibold w-20 text-right">
                      PKR {e.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

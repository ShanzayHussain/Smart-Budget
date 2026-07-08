import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { calculateBudgetStats, placeholderRiskEstimate } from "../lib/budgetMath";
import { categoryBreakdown, dailySpending, cumulativeSpending } from "../lib/trendsData";
import logo from "../assets/logo.png";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Expense {
  id: string;
  amount: number;
  category: string;
  mood: string;
  createdAt: string;
  timestamp?: { toDate?: () => Date };
}

const RISK_STYLES = {
  Low: { bg: "bg-[#3F7D58]/10", text: "text-[#3F7D58]", border: "border-[#3F7D58]/30" },
  Medium: { bg: "bg-[#E8A33D]/10", text: "text-[#B34A2E]", border: "border-[#E8A33D]/40" },
  High: { bg: "bg-[#B34A2E]/10", text: "text-[#B34A2E]", border: "border-[#B34A2E]/40" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#E8A33D",
  Transport: "#3F7D58",
  Shopping: "#B34A2E",
  Entertainment: "#5C7A99",
  Other: "#8B8681",
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [totalBudget, setTotalBudget] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // user profile (name + budget)
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data();
        setName(userData?.name || user.displayName || "there");
        setTotalBudget(userData?.monthlyBudget ?? null);

        // this month's expenses
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

  // no budget set yet — send them back to Set Budget
  if (totalBudget === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1] px-6">
        <p className="text-[#1F2A44]/80">You haven't set a budget yet.</p>
        <Link
          to="/set-budget"
          className="bg-[#0c0c0e] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#B34A2E] transition-colors"
        >
          Set your budget
        </Link>
      </div>
    );
  }

  const spentSoFar = expenses.reduce((sum, e) => sum + e.amount, 0);
  const stats = calculateBudgetStats(totalBudget, spentSoFar);
  const risk = placeholderRiskEstimate(stats);
  const riskStyle = RISK_STYLES[risk.level];
  const category = categoryBreakdown(expenses);
  const daily = dailySpending(expenses);
  const cumulative = cumulativeSpending(expenses);

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

  const dailyLineData = {
    labels: daily.labels,
    datasets: [
      {
        label: "Daily spend",
        data: daily.data,
        borderColor: "#1F2A44",
        backgroundColor: "#1F2A44",
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const cumulativeLineData = {
    labels: cumulative.labels,
    datasets: [
      {
        label: "Cumulative spend",
        data: cumulative.data,
        borderColor: "#B34A2E",
        backgroundColor: "#B34A2E",
        tension: 0.3,
        pointRadius: 0,
        fill: true,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1] font-body">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white backdrop-blur border-b border-[#F6F3EC] shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="SmartBudget Logo" className="w-8 h-8 object-contain" />
            <span className="font-display text-xl font-extrabold tracking-tight">
              SmartBudget
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#1F2A44]/70 hidden sm:inline">Hi, {name}</span>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-[#1F2A44]/70 hover:text-[#B34A2E] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-6">
        {/* Budget progress */}
        <div className="md:col-span-2 bg-white/90 rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-display text-lg font-semibold">Budget this month</h2>
            <Link
              to="/set-budget"
              className="text-xs text-[#1F2A44]/60 hover:text-[#B34A2E] font-medium"
            >
              Edit budget
            </Link>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-3xl font-semibold">
              {spentSoFar.toLocaleString()}
            </span>
            <span className="font-mono text-sm text-[#1F2A44]/50">
              / {totalBudget.toLocaleString()} PKR
            </span>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${stats.percentUsed}%`,
                backgroundColor:
                  stats.percentUsed > 90 ? "#B34A2E" : stats.percentUsed > 60 ? "#E8A33D" : "#3F7D58",
              }}
            />
          </div>
          <p className="text-xs text-[#1F2A44]/60 font-mono">
            {stats.percentUsed.toFixed(0)}% used · {stats.daysLeft} days left in the month
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-[#1F2A44]/50 mb-1">Safe daily pace</p>
              <p className="font-mono text-xl font-semibold">
                {stats.safeDailyPace.toFixed(0)}
                <span className="text-xs text-[#1F2A44]/50 font-normal ml-1">PKR/day</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[#1F2A44]/50 mb-1">Your actual average</p>
              <p className="font-mono text-xl font-semibold">
                {stats.actualDailyAverage.toFixed(0)}
                <span className="text-xs text-[#1F2A44]/50 font-normal ml-1">PKR/day</span>
              </p>
            </div>
          </div>
        </div>

        {/* Risk card */}
        <div className={`bg-white/90 rounded-2xl shadow-md border p-6 ${riskStyle.border}`}>
          <h2 className="font-display text-lg font-semibold mb-4">Overspending risk</h2>
          <span
            className={`inline-block font-mono text-sm font-semibold px-3 py-1 rounded-full mb-4 ${riskStyle.bg} ${riskStyle.text}`}
          >
            {risk.level}
          </span>
          <p className="text-sm text-[#1F2A44]/75 leading-relaxed">{risk.reason}</p>
        </div>

        {/* Quick action */}
<div className="md:col-span-3 flex justify-between items-center bg-white/70 rounded-2xl border border-gray-200 px-6 py-4">
  <Link
    to="/history"
    className="text-sm text-[#1F2A44]/70 hover:text-[#B34A2E] transition-colors"
  >
    {expenses.length === 0
      ? "No expenses logged yet this month."
      : `${expenses.length} expense${expenses.length === 1 ? "" : "s"} logged this month.`}{" "}
    →
  </Link>
  <Link
    to="/log-expense"
    className="bg-[#0c0c0e] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#B34A2E] transition-colors"
  >
    Log an expense
  </Link>
</div>

        <div className="md:col-span-3 space-y-6">
          <h1 className="font-display text-2xl font-semibold">Trends</h1>

          {expenses.length === 0 ? (
            <div className="bg-white/70 rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-[#1F2A44]/70">Log a few expenses to see your trends.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/90 rounded-2xl shadow-md border border-gray-200 p-6">
                  <h2 className="font-display text-lg font-semibold mb-4">Spending by category</h2>
                  <div className="max-w-xs mx-auto">
                    <Doughnut
                      data={doughnutData}
                      options={{ plugins: { legend: { position: "bottom" } } }}
                    />
                  </div>
                </div>

                <div className="bg-white/90 rounded-2xl shadow-md border border-gray-200 p-6">
                  <h2 className="font-display text-lg font-semibold mb-4">Daily spending</h2>
                  <Line
                    data={dailyLineData}
                    options={{
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white/90 rounded-2xl shadow-md border border-gray-200 p-6">
                <h2 className="font-display text-lg font-semibold mb-1">Cumulative spend this month</h2>
                <p className="text-xs text-[#1F2A44]/50 mb-4">
                  Steeper slope late in the month is usually what drives risk up.
                </p>
                <Line
                  data={cumulativeLineData}
                  options={{
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

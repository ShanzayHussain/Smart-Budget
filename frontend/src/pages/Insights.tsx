import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { fetchRisk, fetchRiskHistory, type RiskResult, type RiskSnapshot } from "../lib/api";
import { spendByMood, spendByDayOfWeek } from "../lib/insightsData";
import { calculateBudgetStats } from "../lib/budgetMath";

ChartJS.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Expense {
  amount: number;
  mood: string;
  createdAt: string;
}

const RISK_COPY = {
  Low: "Your current pattern keeps you comfortably within budget.",
  Medium: "Your pace is close to the edge of what's left this month.",
  High: "You're spending faster than your remaining budget can support.",
};

const RISK_COLORS = { Low: "#16815F", Medium: "#B8770E", High: "#B91C1C" };

const TICK_COLOR = "#0B1220AA";
const TICK_FONT = { size: 11 };

export default function Insights() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [history, setHistory] = useState<RiskSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [userSnap, expensesSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDocs(query(collection(db, "expenses"), where("userId", "==", user.uid))),
        ]);

        setTotalBudget(userSnap.data()?.monthlyBudget ?? 0);

        const rows: Expense[] = expensesSnap.docs
          .map((d) => ({
            amount: d.data().amount,
            mood: d.data().mood,
            createdAt: d.data().createdAt,
          }))
          .filter((e) => new Date(e.createdAt) >= startOfMonth);
        setExpenses(rows);

        const [riskResult, riskHistory] = await Promise.all([
          fetchRisk().catch(() => null),
          fetchRiskHistory().catch(() => []),
        ]);
        setRisk(riskResult);
        setHistory(riskHistory);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return <div className="min-h-[calc(100vh-73px)] bg-[#F5F6F8]" />;
  }

  const moodData = spendByMood(expenses);
  const dayData = spendByDayOfWeek(expenses);

  const spentSoFar = expenses.reduce((sum, e) => sum + e.amount, 0);
  const stats = calculateBudgetStats(totalBudget, spentSoFar);

  // ── Derive plain-language "what's in your data" signals from
  // what's already loaded on this page. These describe patterns visible
  // in your own logged data — not the model's internal feature weights,
  // which live in the training notebook, not here.
  type Signal = { label: string; detail: string; strength: number };
  const signals: Signal[] = [];

  const paceGap = stats.actualDailyAverage - stats.safeDailyPace;
  if (Math.abs(paceGap) > 1) {
    signals.push({
      label: "Your daily spending pace",
      detail:
        paceGap > 0
          ? `You're averaging PKR ${paceGap.toFixed(0)}/day above your safe target.`
          : `You're averaging PKR ${Math.abs(paceGap).toFixed(0)}/day under your safe target.`,
      strength: Math.abs(paceGap),
    });
  }

  if (moodData.labels.length > 1) {
    const maxMood = Math.max(...moodData.averages);
    const minMood = Math.min(...moodData.averages);
    const maxMoodLabel = moodData.labels[moodData.averages.indexOf(maxMood)];
    if (maxMood - minMood > 0) {
      signals.push({
        label: "Your mood while spending",
        detail: `You spend the most on average when feeling "${maxMoodLabel}" — PKR ${maxMood.toFixed(0)} per expense.`,
        strength: maxMood - minMood,
      });
    }
  }

  if (dayData.labels.length > 1) {
    const maxDay = Math.max(...dayData.averages);
    const minDay = Math.min(...dayData.averages);
    const maxDayLabel = dayData.labels[dayData.averages.indexOf(maxDay)];
    if (maxDay - minDay > 0) {
      signals.push({
        label: "Day of the week",
        detail: `${maxDayLabel} is your highest-spending day on average — PKR ${maxDay.toFixed(0)} per expense.`,
        strength: maxDay - minDay,
      });
    }
  }

  signals.sort((a, b) => b.strength - a.strength);
  const topSignals = signals.slice(0, 3);

  const moodChartData = {
    labels: moodData.labels,
    datasets: [
      {
        label: "Average spend",
        data: moodData.averages,
        backgroundColor: "#16815F",
        borderRadius: 4,
      },
    ],
  };

  const dayChartData = {
    labels: dayData.labels,
    datasets: [
      {
        label: "Average spend",
        data: dayData.averages,
        backgroundColor: "#0B1220",
        borderRadius: 4,
      },
    ],
  };

  const historyChartData = {
    labels: history.map((h) =>
      new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    ),
    datasets: [
      {
        label: "Risk level",
        data: history.map((h) => (h.level === "Low" ? 1 : h.level === "Medium" ? 2 : 3)),
        borderColor: "#0B1220",
        backgroundColor: "#0B122010",
        stepped: true,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: history.map((h) => RISK_COLORS[h.level]),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const historyChartOptions = {
    maintainAspectRatio: false,
    interaction: { mode: "nearest" as const, intersect: true },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "#0B1220",
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 8,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (item: any) => {
            const level = item.parsed.y === 1 ? "Low" : item.parsed.y === 2 ? "Medium" : "High";
            return `Risk: ${level}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0.5,
        max: 3.5,
        ticks: {
          stepSize: 1,
          color: TICK_COLOR,
          font: TICK_FONT,
          callback: (val: any) =>
            val === 1 ? "Low" : val === 2 ? "Medium" : val === 3 ? "High" : "",
        },
        grid: { color: "#00000008" },
      },
      x: {
        ticks: { color: TICK_COLOR, font: TICK_FONT },
        grid: { display: false },
      },
    },
  };

  const barChartOptions = {
    maintainAspectRatio: false,
    interaction: { mode: "nearest" as const, intersect: true },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "#0B1220",
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 8,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (item: any) => `PKR ${item.parsed.y.toFixed(0)} avg`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: TICK_COLOR, font: TICK_FONT },
        grid: { color: "#00000008" },
      },
      x: {
        ticks: { color: TICK_COLOR, font: TICK_FONT },
        grid: { display: false },
      },
    },
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0B1220] mt-2">
          Your Spending Insights
        </h1>
        <p className="text-[#0B1220]/60 mt-1">
          What's actually driving your overspending risk this month.
        </p>
      </div>

      {/* Current prediction, explained */}
      <section className="bg-white rounded-2xl border border-[#E4E7EC] p-6">
        <h2 className="font-display text-lg font-semibold text-[#0B1220] mb-3">
          Current Prediction
        </h2>
        {risk ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: RISK_COLORS[risk.level] }}
              />
              <span
                className="font-mono text-xl font-semibold"
                style={{ color: RISK_COLORS[risk.level] }}
              >
                {risk.level}
              </span>
              {risk.confidence != null && (
                <span className="text-xs text-[#0B1220]/40 font-mono">
                  ({Math.round(risk.confidence * 100)}% model confidence)
                </span>
              )}
            </div>
            <p className="text-sm text-[#0B1220]/70">
                {topSignals.length > 0 && paceGap <= 0
                  ? `Your daily pace is healthy, but ${topSignals[0].label.toLowerCase()} is pulling your risk toward ${risk.level}.`
                  : RISK_COPY[risk.level]}
              </p>

            {topSignals.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0B1220]/50 mb-3">
                  Patterns in your data
                </p>
                <ul className="space-y-2">
                  {topSignals.map((s) => (
                    <li key={s.label} className="flex gap-2 text-sm">
                      <span className="text-[#16815F] mt-0.5">●</span>
                      <span className="text-[#0B1220]/70">
                        <span className="font-medium text-[#0B1220]">{s.label}:</span> {s.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-[#0B1220]/50">
            Log a few expenses this month to get a prediction.
          </p>
        )}
      </section>

      {/* Your Pace */}
      <section className="bg-white rounded-2xl border border-[#E4E7EC] p-6">
        <h2 className="font-display text-lg font-semibold text-[#0B1220] mb-4">
          Your Pace This Month
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[#0B1220]/50 mb-1">Actual average</p>
            <p className="font-mono text-lg font-semibold text-[#0B1220]">
              PKR {stats.actualDailyAverage.toFixed(0)}
              <span className="text-xs text-[#0B1220]/40 font-normal">/day</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-[#0B1220]/50 mb-1">Safe target</p>
            <p className="font-mono text-lg font-semibold text-[#16815F]">
              PKR {stats.safeDailyPace.toFixed(0)}
              <span className="text-xs text-[#0B1220]/40 font-normal">/day</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-[#0B1220]/50 mb-1">Budget used</p>
            <p className="font-mono text-lg font-semibold text-[#0B1220]">
              {stats.percentUsed.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[#0B1220]/50 mb-1">Days left</p>
            <p className="font-mono text-lg font-semibold text-[#0B1220]">{stats.daysLeft}</p>
          </div>
        </div>
        <p className="text-xs text-[#0B1220]/50 mt-4 pt-4 border-t border-gray-100">
          {stats.actualDailyAverage > stats.safeDailyPace
            ? `You're spending about PKR ${(stats.actualDailyAverage - stats.safeDailyPace).toFixed(0)}/day faster than your safe pace — this is part of what's pushing your risk toward ${risk?.level ?? "..."}.`
            : `You're spending within your safe daily pace — this is helping keep your risk lower.`}
        </p>
      </section>

      {/* Mood + Day patterns */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6">
          <h3 className="font-medium text-sm text-[#0B1220]/70 mb-4">Average Spend by Mood</h3>
          {moodData.labels.length > 0 ? (
            <div className="h-52">
              <Bar data={moodChartData} options={barChartOptions} />
            </div>
          ) : (
            <p className="text-sm text-[#0B1220]/50 text-center py-10">Not enough data yet.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6">
          <h3 className="font-medium text-sm text-[#0B1220]/70 mb-4">
            Average Spend by Day of Week
          </h3>
          {dayData.labels.length > 0 ? (
            <div className="h-52">
              <Bar data={dayChartData} options={barChartOptions} />
            </div>
          ) : (
            <p className="text-sm text-[#0B1220]/50 text-center py-10">Not enough data yet.</p>
          )}
        </div>
      </section>

      {/* Risk trend over time */}
      <section className="bg-white rounded-2xl border border-[#E4E7EC] p-6">
        <h3 className="font-medium text-sm text-[#0B1220]/70 mb-1">Risk Trend This Month</h3>
        <p className="text-xs text-[#0B1220]/40 mb-4">
          A saved snapshot of your predicted risk, once per day.
        </p>

        {history.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-[#0B1220]/60 mb-1">No trend yet — today is day one.</p>
            <p className="text-xs text-[#0B1220]/40">
              Come back tomorrow and this will start showing how your risk moves day to day.
            </p>
          </div>
        ) : history.length === 1 ? (
          <div className="flex items-center gap-4 py-6">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: RISK_COLORS[history[0].level] }}
            />
            <div>
              <p className="text-sm text-[#0B1220]">
                Today's prediction:{" "}
                <span className="font-semibold" style={{ color: RISK_COLORS[history[0].level] }}>
                  {history[0].level}
                </span>
              </p>
              <p className="text-xs text-[#0B1220]/40 mt-0.5">
                One more day of logging and you'll start seeing a real trend line here.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-52">
            <Line data={historyChartData} options={historyChartOptions} />
          </div>
        )}
      </section>

      {/* How this works */}
      <section className="bg-[#0B1220] text-white rounded-2xl p-6">
        <h3 className="font-display text-base font-semibold mb-2">How this works</h3>
        <p className="text-sm text-white/70 leading-relaxed mb-3">
          Your budget progress and remaining balance are plain math — no model needed.
          The risk level above comes from a Random Forest model trained to recognize
          patterns across mood, day of week, and spending trend — not just how much
          of your budget is gone.
        </p>
        <p className="text-xs text-white/40 leading-relaxed">
          The model was trained on simulated spending patterns designed to mirror real
          behavior. Predictions become more personal as more of your own logged data
          accumulates over time.
        </p>
      </section>
    </main>
  );
}
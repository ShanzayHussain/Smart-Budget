// import { useEffect, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { getMonthKey, getMonthLabel } from "../lib/date";
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   where,
// } from "firebase/firestore";
// import { signOut } from "firebase/auth";
// import {
//   Chart as ChartJS,
//   ArcElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Doughnut, Line, Bar } from "react-chartjs-2";
// import annotationPlugin from "chartjs-plugin-annotation";
// import { auth, db } from "../firebase";
// import { useAuth } from "../context/AuthContext";
// import { calculateBudgetStats, placeholderRiskEstimate } from "../lib/budgetMath";
// import { categoryBreakdown, dailySpending, cumulativeSpending } from "../lib/trendsData";
// import logo from "../assets/logo.png";

// ChartJS.register(
//   ArcElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Tooltip,
//   Legend,
//   annotationPlugin
// );

// interface Expense {
//   id: string;
//   amount: number;
//   category: string;
//   mood: string;
//   createdAt: string;
//   timestamp?: { toDate?: () => Date };
// }

// const RISK_STYLES = {
//   Low: { bg: "bg-[#3F7D58]/10", text: "text-[#3F7D58]", border: "border-[#3F7D58]/30", dot: "bg-[#3F7D58]" },
//   Medium: { bg: "bg-[#E8A33D]/10", text: "text-[#B34A2E]", border: "border-[#E8A33D]/40", dot: "bg-[#E8A33D]" },
//   High: { bg: "bg-[#B34A2E]/10", text: "text-[#B34A2E]", border: "border-[#B34A2E]/40", dot: "bg-[#B34A2E]" },
// };

// const CATEGORY_COLORS: Record<string, string> = {
//   Food: "#E8A33D",
//   Transport: "#3F7D58",
//   Shopping: "#B34A2E",
//   Entertainment: "#5C7A99",
//   Other: "#8B8681",
// };

// const CATEGORY_ICONS: Record<string, string> = {
//   Food: "🍔",
//   Transport: "🚌",
//   Shopping: "🛍️",
//   Entertainment: "🎬",
//   Other: "📦",
// };

// const MOOD_STYLES: Record<string, string> = {
//   Happy: "bg-[#3F7D58]/10 text-[#3F7D58]",
//   Neutral: "bg-gray-100 text-[#1F2A44]/60",
//   Stressed: "bg-[#B34A2E]/10 text-[#B34A2E]",
//   Impulsive: "bg-[#E8A33D]/15 text-[#B34A2E]",
//   Tired: "bg-gray-100 text-[#1F2A44]/60",
// };

// const crosshairPlugin = {
//   id: "crosshair",
//   afterDatasetsDraw(chart: any) {
//     const { ctx, tooltip, chartArea } = chart;
//     if (!tooltip?.getActiveElements()?.length) return;

//     const activePoint = tooltip.getActiveElements()[0];
//     const x = activePoint.element.x;

//     ctx.save();
//     ctx.beginPath();
//     ctx.moveTo(x, chartArea.top);
//     ctx.lineTo(x, chartArea.bottom);
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "#1F2A4430";
//     ctx.stroke();
//     ctx.restore();
//   },
// };

// const CURRENT_MONTH_LABEL = new Date().toLocaleDateString(undefined, {
//   month: "long",
//   year: "numeric",
// });

// export default function Dashboard() {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   const [name, setName] = useState("");
//   const [totalBudget, setTotalBudget] = useState<number | null>(null);
//   const [lastSavedBudget, setLastSavedBudget] = useState<number | null>(null);
//   const [expenses, setExpenses] = useState<Expense[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [hasEverSetBudget, setHasEverSetBudget] = useState(false);

//   useEffect(() => {
//     if (!user) return;

//     (async () => {
//       try {
//         const userSnap = await getDoc(doc(db, "users", user.uid));
//         const userData = userSnap.data();
//         setName(userData?.name || user.displayName || "there");
//         const currentMonthKey = getMonthKey();
//         const budgetIsCurrent = userData?.budgetMonth === currentMonthKey;
//         setTotalBudget(budgetIsCurrent ? userData?.monthlyBudget ?? null : null);
//         setLastSavedBudget(userData?.monthlyBudget ?? null);
//         setHasEverSetBudget(!!userData?.monthlyBudget);

//         const now = new Date();
//         const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//         const q = query(collection(db, "expenses"), where("userId", "==", user.uid));
//         const snap = await getDocs(q);
//         const rows: Expense[] = snap.docs
//           .map((d) => ({
//             id: d.id,
//             amount: d.data().amount,
//             category: d.data().category,
//             mood: d.data().mood,
//             createdAt: d.data().createdAt,
//             timestamp: d.data().timestamp,
//           }))
//           .filter((expense) => {
//             const expenseDate =
//               expense.timestamp?.toDate?.() ??
//               (expense.createdAt ? new Date(expense.createdAt) : null);
//             return expenseDate !== null && expenseDate >= startOfMonth;
//           });
//         setExpenses(rows);
//       } catch (err) {
//         console.error("Dashboard data failed to load:", err);
//         setExpenses([]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [user]);

//   async function handleSignOut() {
//     await signOut(auth);
//     navigate("/login");
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1]">
//         <span className="font-mono text-sm text-[#1F2A44]/60">Loading…</span>
//       </div>
//     );
//   }

//   const spentSoFar = expenses.reduce((sum, e) => sum + e.amount, 0);
//   const needsCurrentBudget = totalBudget === null;
//   const budgetForDashboard = totalBudget ?? lastSavedBudget ?? 0;
//   const stats = calculateBudgetStats(budgetForDashboard, spentSoFar);
//   const risk = placeholderRiskEstimate(stats);
//   const riskStyle = RISK_STYLES[risk.level];
//   const category = categoryBreakdown(expenses);
//   const daily = dailySpending(expenses);
//   const cumulative = cumulativeSpending(expenses);

//   const activeCategoryCount = new Set(expenses.map((e) => e.category)).size;

//   const now = new Date();
//   const sevenDaysAgo = new Date(now);
//   sevenDaysAgo.setDate(now.getDate() - 7);

//   const recentExpenses = [...expenses]
//     .filter((e) => new Date(e.createdAt) >= sevenDaysAgo)
//     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

//   const recentLogsCount = recentExpenses.length;
//   const recentToShow = recentExpenses.slice(0, 5);

//   const doughnutData = {
//     labels: category.labels,
//     datasets: [
//       {
//         data: category.data,
//         backgroundColor: category.labels.map((l) => CATEGORY_COLORS[l] ?? "#8B8681"),
//         borderWidth: 0,
//       },
//     ],
//   };

//   const dailyBarData = {
//     labels: daily.labels,
//     datasets: [
//       {
//         label: "Daily spend",
//         data: daily.data,
//         backgroundColor: "#5C7A99",
//         borderRadius: 4,
//         maxBarThickness: 18,
//       },
//     ],
//   };

//   const cumulativeLineData = {
//     labels: cumulative.labels,
//     datasets: [
//       {
//         label: "Cumulative spend",
//         data: cumulative.data,
//         borderColor: "#1F2A44",
//         backgroundColor: "#1F2A4415",
//         tension: 0.3,
//         pointRadius: 0,
//         fill: true,
//       },
//     ],
//   };

//   const chartOptions = {
//     maintainAspectRatio: false,
//     plugins: { legend: { display: false } },
//     scales: {
//       y: { beginAtZero: true, grid: { color: "#00000008" }, ticks: { font: { size: 10 } } },
//       x: { grid: { display: false }, ticks: { font: { size: 10 } } },
//     },
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1] font-body">
//       {/* Nav */}
//       <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
//         <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
//           <div className="flex items-center gap-2">
//             <img src={logo} alt="SmartBudget Logo" className="w-8 h-8 object-contain" />
//             <span className="font-display text-xl font-extrabold tracking-tight">
//               SmartBudget
//             </span>
//           </div>
//           <div className="flex items-center gap-4">
//             <span className="text-sm text-[#1F2A44]/60 hidden sm:inline">Hi, {name}</span>
//             <Link
//               to="/log-expense"
//               className="bg-[#0c0c0e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B34A2E] transition-colors"
//             >
//               + Log Expense
//             </Link>
//             <button
//               onClick={handleSignOut}
//               className="text-sm font-medium text-[#1F2A44]/70 hover:text-[#B34A2E] transition-colors"
//             >
//               Sign out
//             </button>
//           </div>
//         </div>
//       </header>
      
//       <main className="max-w-7xl mx-auto px-0 py-4 space-y-6">
        
//         <p className="font-mono text-xs uppercase tracking-widest text-[#1F2A44]/50">
//           {CURRENT_MONTH_LABEL}
//         </p>

//         {/* Overview: budget + risk */}
//         <section className="grid md:grid-cols-3 gap-6">
//           <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//             <div className="flex justify-between items-center mb-5">
//               <h2 className="font-display text-base font-semibold">Budget Overview</h2>
//               <div className="flex items-center gap-2">
//                 <Link
//                   to="/set-budget"
//                   className="text-xs font-medium text-[#1F2A44]/50 hover:text-[#B34A2E] transition-colors"
//                 >
//                   {needsCurrentBudget ? "Set budget" : "Edit budget"}
//                 </Link>
//                 <span className="text-xs font-mono bg-gray-100 text-[#1F2A44]/60 px-2.5 py-1 rounded-full">
//                   {stats.daysLeft} days left
//                 </span>
//               </div>
//             </div>

//             {needsCurrentBudget ? (
//               <div className="pt-1">
//                 <p className="font-display text-xl font-semibold mb-2">
//                   {hasEverSetBudget
//                     ? `Set your budget for ${getMonthLabel()}`
//                     : "Let's set up your first budget"}
//                 </p>
//                 <p className="text-sm text-[#1F2A44]/60 mb-5 max-w-xl">
//                   {hasEverSetBudget
//                     ? "A new month has started, so it's time for a fresh budget. Your past spending and history are still saved."
//                     : "Once you set a monthly budget, your dashboard will start tracking your spending pace and overspending risk automatically."}
//                 </p>
//                 <Link
//                   to="/set-budget"
//                   className="inline-block bg-[#0c0c0e] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#B34A2E] transition-colors"
//                 >
//                   Set your budget
//                 </Link>
//               </div>
//             ) : (
//               <>
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <p className="text-xs text-[#1F2A44]/50 mb-1">Spent so far</p>
//                     <p className="font-mono text-3xl font-semibold">
//                       PKR {spentSoFar.toLocaleString()}
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-xs text-[#1F2A44]/50 mb-1">Total budget</p>
//                     <p className="font-mono text-sm font-medium text-[#1F2A44]/70">
//                       PKR {budgetForDashboard.toLocaleString()}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
//                   <div
//                     className="h-full rounded-full transition-all"
//                     style={{
//                       width: `${stats.percentUsed}%`,
//                       backgroundColor:
//                         stats.percentUsed > 90 ? "#B34A2E" : stats.percentUsed > 60 ? "#E8A33D" : "#3F7D58",
//                     }}
//                   />
//                 </div>
//                 <div className="flex justify-between text-xs font-mono text-[#1F2A44]/50 mb-6">
//                   <span>{stats.percentUsed.toFixed(0)}% used</span>
//                   <span>PKR {Math.max(budgetForDashboard - spentSoFar, 0).toLocaleString()} remaining</span>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
//                   <div>
//                     <p className="text-xs text-[#1F2A44]/50 mb-1">Actual average</p>
//                     <p className="font-mono text-lg font-semibold">
//                       PKR {stats.actualDailyAverage.toFixed(0)}
//                       <span className="text-xs text-[#1F2A44]/40 font-normal">/day</span>
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-[#1F2A44]/50 mb-1">Safe target</p>
//                     <p className="font-mono text-lg font-semibold text-[#3F7D58]">
//                       PKR {stats.safeDailyPace.toFixed(0)}
//                       <span className="text-xs text-[#1F2A44]/40 font-normal">/day</span>
//                     </p>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>

//           <div className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col ${riskStyle.border}`}>
//             <div className="flex items-center gap-2 mb-1">
//               <span className="text-xs font-medium text-[#1F2A44]/50">Risk Status</span>
//             </div>
//             <div className="flex items-center gap-2 mb-4">
//               <span className={`w-2 h-2 rounded-full ${riskStyle.dot}`} />
//               <span className={`font-mono text-lg font-semibold ${riskStyle.text}`}>
//                 {risk.level}
//               </span>
//             </div>
//             <p className="text-sm text-[#1F2A44]/70 leading-relaxed mb-5">{risk.reason}</p>

//             <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
//               <div className="flex justify-between text-xs">
//                 <span className="text-[#1F2A44]/50">Actual average</span>
//                 <span className="font-mono font-medium">
//                   PKR {stats.actualDailyAverage.toFixed(0)}/day
//                 </span>
//               </div>
//               <div className="flex justify-between text-xs">
//                 <span className="text-[#1F2A44]/50">Safe target</span>
//                 <span className="font-mono font-medium text-[#3F7D58]">
//                   PKR {stats.safeDailyPace.toFixed(0)}/day
//                 </span>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Stats strip */}
//         <section className="bg-white/70 rounded-xl border border-gray-200 px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#1F2A44]/60">
//           <span>📅 {stats.daysInMonth} days in month</span>
//           <span>🏷️ {activeCategoryCount} active categories</span>
//           <span>📝 {recentLogsCount} recent logs</span>
//         </section>

//         {/* Category + Daily spending */}
//         {expenses.length === 0 ? (
//           <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
//             <p className="text-[#1F2A44]/60 text-sm">Log a few expenses to see your trends here.</p>
//           </div>
//         ) : (
//           <>
//             <section className="grid md:grid-cols-2 gap-6">
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                 <h3 className="font-medium text-sm text-[#1F2A44]/70 mb-4">
//                   Spending by Category
//                 </h3>
//                 <div className="flex items-center gap-6">
//                   <div className="w-32 h-32 shrink-0">
//                     <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } } }} />
//                   </div>
//                   <div className="space-y-2 text-sm flex-1">
//                     {category.labels.map((label, i) => (
//                       <div key={label} className="flex items-center justify-between">
//                         <span className="flex items-center gap-2">
//                           <span
//                             className="w-2 h-2 rounded-full"
//                             style={{ backgroundColor: CATEGORY_COLORS[label] ?? "#8B8681" }}
//                           />
//                           {label}
//                         </span>
//                         <span className="font-mono text-xs text-[#1F2A44]/60">
//                           PKR {category.data[i].toLocaleString()}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                 <h3 className="font-medium text-sm text-[#1F2A44]/70 mb-4">Daily Spending</h3>
//                 <div className="h-44">
//                   <Bar data={dailyBarData} options={chartOptions} />
//                 </div>
//               </div>
//             </section>

//             {/* Cumulative spend */}
//             <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <div className="flex justify-between items-start mb-1">
//                 <h3 className="font-medium text-sm text-[#1F2A44]/70">
//                   Cumulative Spending Month-to-Date
//                 </h3>
//                 <span className="text-xs font-mono bg-[#B34A2E]/10 text-[#B34A2E] px-2.5 py-1 rounded-full">
//                   Ceiling: PKR {budgetForDashboard.toLocaleString()}
//                 </span>
//               </div>
//               <p className="text-xs text-[#1F2A44]/40 mb-4">
//                 Steeper slope late in the month usually means risk is climbing.
//               </p>
//               <div className="h-44">
//                 <Line
//                   data={cumulativeLineData}
//                   plugins={[crosshairPlugin]}
//                   options={{
//                     maintainAspectRatio: false,
//                     interaction: { mode: "index", intersect: false },
//                     plugins: {
//                       legend: { display: false },
//                       annotation: {
//                         annotations: {
//                           ceiling: {
//                             type: "line",
//                             yMin: budgetForDashboard,
//                             yMax: budgetForDashboard,
//                             borderColor: "#B34A2E",
//                             borderWidth: 1.5,
//                             borderDash: [6, 4],
//                           },
//                         },
//                       },
//                       tooltip: {
//                         enabled: true,
//                         backgroundColor: "#ffffff",
//                         titleColor: "#1F2A44",
//                         bodyColor: "#1F2A44",
//                         borderColor: "#e5e7eb",
//                         borderWidth: 1,
//                         cornerRadius: 8,
//                         padding: 12,
//                         displayColors: false,
//                         titleFont: { size: 13, weight: 600 },
//                         bodyFont: { size: 12 },
//                         callbacks: {
//                           title: (items: any) => `Jul ${items[0].label}`,
//                           label: (item: any) =>
//                             `Total Spent: PKR ${item.parsed.y.toLocaleString()}`,
//                         },
//                       },
//                     },
//                     scales: {
//                       y: {
//                         beginAtZero: true,
//                         grid: { color: "#00000008" },
//                         ticks: {
//                           font: { size: 10 },
//                           callback: (val: any) => (val >= 1000 ? `${val / 1000}k` : val),
//                         },
//                         suggestedMax: budgetForDashboard * 1.1,
//                       },
//                       x: { grid: { display: false }, ticks: { font: { size: 10 } } },
//                     },
//                   }}
//                 />
//               </div>
//             </section>
//           </>
//         )}

//         {/* Recent Transactions */}
//         <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-medium text-sm text-[#1F2A44]/70">Recent Transactions</h3>
//             <Link
//               to="/history"
//               className="text-xs font-medium text-[#B34A2E] hover:underline"
//             >
//               See full history →
//             </Link>
//           </div>

//           {recentToShow.length === 0 ? (
//             <p className="text-sm text-[#1F2A44]/50 text-center py-6">
//               No expenses logged in the last 7 days.
//             </p>
//           ) : (
//             <div className="divide-y divide-gray-100">
//               {recentToShow.map((e) => (
//                 <div key={e.id} className="flex items-center justify-between py-3">
//                   <div className="flex items-center gap-3">
//                     <span className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-lg">
//                       {CATEGORY_ICONS[e.category] ?? "📦"}
//                     </span>
//                     <div>
//                       <p className="text-sm font-medium">{e.category}</p>
//                       <p className="text-xs text-[#1F2A44]/40">
//                         {new Date(e.createdAt).toLocaleDateString(undefined, {
//                           month: "short",
//                           day: "numeric",
//                         })}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <span
//                       className={`text-xs font-medium px-2 py-1 rounded-full ${
//                         MOOD_STYLES[e.mood] ?? "bg-gray-100 text-[#1F2A44]/60"
//                       }`}
//                     >
//                       {e.mood}
//                     </span>
//                     <span className="font-mono text-sm font-semibold w-20 text-right">
//                       PKR {e.amount.toLocaleString()}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// }


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
  // const risk = placeholderRiskEstimate(stats);
  const risk: { level: "Low" | "Medium" | "High" } = mlRisk
  ? { level: mlRisk.level }
  : placeholderRiskEstimate(stats); // fallback while ML result is loading or failed
  const riskMeta = RISK_META[risk.level];
  const category = categoryBreakdown(expenses);
  const remaining = Math.max(budgetForDashboard - spentSoFar, 0);
  const percentLeft = budgetForDashboard > 0 ? Math.max(100 - stats.percentUsed, 0) : 0;

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
          <div className="bg-[#0B1220] text-white rounded-2xl p-6 relative overflow-hidden">
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
              <Link to="/set-budget" className="text-xs text-[#5EEAD4] hover:underline">
                ↗ Set your budget for {getMonthLabel()}
              </Link>
            ) : (
              <p className="text-xs text-[#5EEAD4]">
                ↗ Budget set for {CURRENT_MONTH_LABEL}
              </p>
            )}
            <Link
    to="/set-budget"
    className="absolute bottom-6 right-6 inline-flex items-center gap-1.5 bg-[#5EEAD4] text-[#0B1220] px-3 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
  >
    Set Budget
    <span aria-hidden>→</span>
  </Link>

  {needsCurrentBudget && (
    <p className="text-xs text-white/50 mt-3">
      No budget set for {getMonthLabel()}
    </p>
  )}
          
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

        {/* Pace analysis + smart insight */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E7EC] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold text-[#0B1220]">
                Budget Pace Analysis
              </h2>
              {/* <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${riskMeta.bg} ${riskMeta.text}`}
              >
                {risk.level === "Low" ? "✓" : "!"} {riskMeta.pill}
              </span> */}
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
                    <span className="text-[9px] font-normal opacity-70" title="ML service unavailable — showing estimated pace instead">
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
                      <span className="absolute -top-7 bg-[#0B1220] text-white text-[10px] font-semibold px-2 py-1 rounded">
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
              {/* <button
                type="button"
                className="text-sm font-medium border border-[#D8DCE3] rounded-lg px-3 py-1.5 hover:bg-[#F5F6F8] transition-colors"
              >
                Filter
              </button> */}
              {/* <button
                type="button"
                className="text-sm font-medium border border-[#D8DCE3] rounded-lg px-3 py-1.5 hover:bg-[#F5F6F8] transition-colors"
              >
                Export CSV
              </button> */}
              <Link
              to="/history"
              className="text-xs font-medium text-[#B34A2E] hover:underline"
            >
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
                  <div
                    key={e.id}
                    className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1.6fr_1fr_1fr] gap-2 sm:gap-4 px-6 py-4 items-center"
                  >
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
                    <span className="hidden sm:block text-sm text-[#0B1220]/70">
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
                ))}
              </div>
              {visibleCount < recentExpenses.length && (
                <div className="text-center py-5">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 5)}
                    className="text-sm font-medium text-[#0B1220] underline underline-offset-2 hover:text-[#16815F]"
                  >
                    Load more transactions
                  </button>
                 
                </div>
              )}
            </>
          )}
          
        </section>
        <div className="flex justify-end mb-6">
  {/* <button
    type="button"
    className="text-sm font-medium border border-[#D8DCE3] rounded-lg px-3 py-1.5 hover:bg-[#F5F6F8] transition-colors"
  >
    Export PDF
  </button> */}
</div>
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


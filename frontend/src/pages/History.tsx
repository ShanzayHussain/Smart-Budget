// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   query,
//   updateDoc,
//   where,
// } from "firebase/firestore";
// import { db } from "../firebase";
// import { useAuth } from "../context/AuthContext";
// import logo from "../assets/logo.png";

// interface Expense {
//   id: string;
//   amount: number;
//   category: string;
//   mood: string;
//   createdAt: string;
// }

// const CATEGORY_ICONS: Record<string, string> = {
//   Food: "🍔",
//   Transport: "🚌",
//   Shopping: "🛍️",
//   Entertainment: "🎬",
//   Other: "📦",
// };

// const MOOD_ICONS: Record<string, string> = {
//   Happy: "😊",
//   Neutral: "😐",
//   Stressed: "😩",
//   Impulsive: "🥴",
//   Tired: "😴",
// };

// // groups a flat list of expenses into { "2026-07": [...], "2026-06": [...] }
// // keyed so they sort correctly, with a display label attached
// function groupByMonth(expenses: Expense[]) {
//   const groups: Record<string, { label: string; items: Expense[] }> = {};

//   for (const e of expenses) {
//     const d = new Date(e.createdAt);
//     const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
//     const label = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

//     if (!groups[key]) groups[key] = { label, items: [] };
//     groups[key].items.push(e);
//   }

//   // newest month first
//   return Object.entries(groups)
//     .sort(([a], [b]) => (a > b ? -1 : 1))
//     .map(([key, group]) => ({ key, ...group }));
// }

// export default function History() {
//   const { user } = useAuth();
//   const [expenses, setExpenses] = useState<Expense[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editAmount, setEditAmount] = useState("");

//   useEffect(() => {
//     if (!user) return;
//     fetchExpenses();
//   }, [user]);

//   async function fetchExpenses() {
//     setLoading(true);
//     // no date filter here on purpose — History shows every month, grouped below
//     const q = query(collection(db, "expenses"), where("userId", "==", user!.uid));
//     const snap = await getDocs(q);
//     const rows: Expense[] = snap.docs.map((d) => ({
//       id: d.id,
//       amount: d.data().amount,
//       category: d.data().category,
//       mood: d.data().mood,
//       createdAt: d.data().createdAt,
//     }));
//     rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
//     setExpenses(rows);
//     setLoading(false);
//   }

//   async function handleDelete(id: string) {
//     if (!confirm("Delete this expense?")) return;
//     await deleteDoc(doc(db, "expenses", id));
//     setExpenses((prev) => prev.filter((e) => e.id !== id));
//   }

//   function startEdit(expense: Expense) {
//     setEditingId(expense.id);
//     setEditAmount(String(expense.amount));
//   }

//   async function saveEdit(id: string) {
//     const value = Number(editAmount);
//     if (!value || value <= 0) return;
//     await updateDoc(doc(db, "expenses", id), { amount: value });
//     setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, amount: value } : e)));
//     setEditingId(null);
//   }

//   const monthGroups = groupByMonth(expenses);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1] font-body">
//       <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
//         <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
//           <div className="flex items-center gap-2">
//             <img src={logo} alt="SmartBudget Logo" className="w-8 h-8 object-contain" />
//             <span className="font-display text-xl font-extrabold tracking-tight">
//               SmartBudget
//             </span>
//           </div>
//           <Link
//             to="/dashboard"
//             className="text-sm font-medium text-[#1F2A44]/70 hover:text-[#B34A2E] transition-colors"
//           >
//             Back to dashboard
//           </Link>
//         </div>
//       </header>

//       <main className="max-w-4xl mx-auto px-6 py-10">
//         <div className="flex justify-between items-baseline mb-6">
//           <h1 className="font-display text-2xl font-semibold">Expense history</h1>
//           <Link
//             to="/log-expense"
//             className="bg-[#0c0c0e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B34A2E] transition-colors"
//           >
//             + Log expense
//           </Link>
//         </div>

//         {loading ? (
//           <p className="font-mono text-sm text-[#1F2A44]/60">Loading…</p>
//         ) : expenses.length === 0 ? (
//           <div className="bg-white/70 rounded-2xl border border-gray-200 p-8 text-center">
//             <p className="text-[#1F2A44]/70">No expenses logged yet.</p>
//           </div>
//         ) : (
//           <div className="space-y-8">
//             {monthGroups.map((group) => {
//               const monthTotal = group.items.reduce((sum, e) => sum + e.amount, 0);
//               return (
//                 <div key={group.key}>
//                   <div className="flex items-baseline justify-between mb-3 px-1">
//                     <h2 className="font-display text-lg font-semibold text-[#1F2A44]">
//                       {group.label}
//                     </h2>
//                     <span className="font-mono text-xs text-[#1F2A44]/50">
//                       {group.items.length} expense{group.items.length === 1 ? "" : "s"} · PKR{" "}
//                       {monthTotal.toLocaleString()}
//                     </span>
//                   </div>

//                   <div className="bg-white/90 rounded-2xl shadow-md border border-gray-200 divide-y divide-gray-100">
//                     {group.items.map((e) => (
//                       <div key={e.id} className="flex items-center justify-between px-6 py-4">
//                         <div className="flex items-center gap-4">
//                           <span className="text-2xl">{CATEGORY_ICONS[e.category] ?? "📦"}</span>
//                           <div>
//                             <p className="font-medium text-sm">{e.category}</p>
//                             <p className="text-xs text-[#1F2A44]/50">
//                               {new Date(e.createdAt).toLocaleDateString(undefined, {
//                                 weekday: "short",
//                                 month: "short",
//                                 day: "numeric",
//                               })}{" "}
//                               · {MOOD_ICONS[e.mood] ?? ""} {e.mood}
//                             </p>
//                           </div>
//                         </div>

//                         <div className="flex items-center gap-3">
//                           {editingId === e.id ? (
//                             <>
//                               <input
//                                 type="number"
//                                 value={editAmount}
//                                 onChange={(ev) => setEditAmount(ev.target.value)}
//                                 className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm font-mono"
//                                 autoFocus
//                               />
//                               <button
//                                 onClick={() => saveEdit(e.id)}
//                                 className="text-xs font-medium text-[#3F7D58] hover:underline"
//                               >
//                                 Save
//                               </button>
//                               <button
//                                 onClick={() => setEditingId(null)}
//                                 className="text-xs font-medium text-[#1F2A44]/50 hover:underline"
//                               >
//                                 Cancel
//                               </button>
//                             </>
//                           ) : (
//                             <>
//                               <span className="font-mono font-semibold text-sm">
//                                 {e.amount.toLocaleString()}
//                               </span>
//                               <button
//                                 onClick={() => startEdit(e)}
//                                 className="text-xs font-medium text-[#1F2A44]/50 hover:text-[#B34A2E]"
//                               >
//                                 Edit
//                               </button>
//                               <button
//                                 onClick={() => handleDelete(e.id)}
//                                 className="text-xs font-medium text-[#1F2A44]/50 hover:text-[#B34A2E]"
//                               >
//                                 Delete
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

interface Expense {
  id: string;
  amount: number;
  category: string;
  mood: string;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔",
  Transport: "🚌",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Other: "📦",
};

const MOOD_ICONS: Record<string, string> = {
  Happy: "😊",
  Neutral: "😐",
  Stressed: "😩",
  Impulsive: "🥴",
  Tired: "😴",
};

// groups a flat list of expenses into { "2026-07": [...], "2026-06": [...] }
// keyed so they sort correctly, with a display label attached
function groupByMonth(expenses: Expense[]) {
  const groups: Record<string, { label: string; items: Expense[] }> = {};

  for (const e of expenses) {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(e);
  }

  // newest month first
  return Object.entries(groups)
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([key, group]) => ({ key, ...group }));
}

export default function History() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchExpenses();
  }, [user]);

  async function fetchExpenses() {
    setLoading(true);
    // no date filter here on purpose — History shows every month, grouped below
    const q = query(collection(db, "expenses"), where("userId", "==", user!.uid));
    const snap = await getDocs(q);
    const rows: Expense[] = snap.docs.map((d) => ({
      id: d.id,
      amount: d.data().amount,
      category: d.data().category,
      mood: d.data().mood,
      createdAt: d.data().createdAt,
    }));
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setExpenses(rows);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await deleteDoc(doc(db, "expenses", id));
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
  }

  async function saveEdit(id: string) {
    const value = Number(editAmount);
    if (!value || value <= 0) return;
    await updateDoc(doc(db, "expenses", id), { amount: value });
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, amount: value } : e)));
    setEditingId(null);
  }

  const monthGroups = groupByMonth(expenses);

  return (
    <>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex justify-between items-baseline mb-6">
          <h1 className="font-display text-2xl font-semibold text-[#0B1220]">Expense history</h1>
          <Link
            to="/log-expense"
            className="bg-[#0B1220] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16815F] transition-colors"
          >
            + Log expense
          </Link>
        </div>

        {loading ? (
          <div className="min-h-40" />
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-8 text-center">
            <p className="text-[#0B1220]/70">No expenses logged yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {monthGroups.map((group) => {
              const monthTotal = group.items.reduce((sum, e) => sum + e.amount, 0);
              return (
                <div key={group.key}>
                  <div className="flex items-baseline justify-between mb-3 px-1">
                    <h2 className="font-display text-lg font-semibold text-[#0B1220]">
                      {group.label}
                    </h2>
                    <span className="font-mono text-xs text-[#0B1220]/50">
                      {group.items.length} expense{group.items.length === 1 ? "" : "s"} · PKR{" "}
                      {monthTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] divide-y divide-[#E4E7EC]">
                    {group.items.map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{CATEGORY_ICONS[e.category] ?? "📦"}</span>
                          <div>
                            <p className="font-medium text-sm text-[#0B1220]">{e.category}</p>
                            <p className="text-xs text-[#0B1220]/50">
                              {new Date(e.createdAt).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              · {MOOD_ICONS[e.mood] ?? ""} {e.mood}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {editingId === e.id ? (
                            <>
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(ev) => setEditAmount(ev.target.value)}
                                className="w-24 border border-[#D8DCE3] rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
                                autoFocus
                              />
                              <button
                                onClick={() => saveEdit(e.id)}
                                className="text-xs font-medium text-[#16815F] hover:underline"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs font-medium text-[#0B1220]/50 hover:underline"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="font-mono font-semibold text-sm text-[#0B1220]">
                                {e.amount.toLocaleString()}
                              </span>
                              <button
                                onClick={() => startEdit(e)}
                                className="text-xs font-medium text-[#0B1220]/50 hover:text-[#16815F]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(e.id)}
                                className="text-xs font-medium text-[#0B1220]/50 hover:text-red-600"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

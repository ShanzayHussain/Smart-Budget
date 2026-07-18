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
  description?: string;
  createdAt: string;
}

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
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      description: d.data().description,
      createdAt: d.data().createdAt,
    }));
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setExpenses(rows);
    setLoading(false);
  }

  async function handleDelete(id: string) {
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
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl font-bold text-[#0B1220]">Expense History</h1>
        <Link
          to="/log-expense"
          className="inline-flex items-center gap-1.5 bg-[#0B1220] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16815F] transition-colors"
        >
          <span aria-hidden>+</span> Log expense
        </Link>
      </div>

      {loading ? (
        <div className="min-h-40" />
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] p-10 text-center">
          <p className="text-[#0B1220]/60">No expenses logged yet.</p>
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

                <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_1fr_1.4fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-[#F5F6F8] text-xs font-semibold uppercase tracking-wide text-[#0B1220]/50">
                    <span>Date</span>
                    <span>Category</span>
                    <span>Description</span>
                    <span>Mood</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right">Actions</span>
                  </div>

                  <div className="divide-y divide-[#E4E7EC]">
                    {group.items.map((e) => (
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
                                weekday: "short",
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

                          <div className="text-right shrink-0">
                            {editingId === e.id ? (
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(ev) => setEditAmount(ev.target.value)}
                                className="w-24 border border-[#D8DCE3] rounded-lg px-2 py-1 text-sm font-mono text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
                                autoFocus
                              />
                            ) : (
                              <p className="text-sm font-semibold text-[#0B1220] whitespace-nowrap">
                                − PKR {e.amount.toLocaleString()}
                              </p>
                            )}
                            <div className="flex justify-end gap-3 mt-1.5">
                              {editingId === e.id ? (
                                <>
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
                                  <button
                                    onClick={() => startEdit(e)}
                                    className="text-xs font-medium text-[#0B1220]/50 hover:text-[#16815F]"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setDeleteId(e.id)}
                                    className="text-xs font-medium text-[#0B1220]/50 hover:text-red-600"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desktop: grid row */}
                        <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1.4fr_1fr_1fr_1fr] gap-4 items-center">
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

                          {editingId === e.id ? (
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(ev) => setEditAmount(ev.target.value)}
                              className="w-full border border-[#D8DCE3] rounded-lg px-2 py-1 text-sm font-mono text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
                              autoFocus
                            />
                          ) : (
                            <span className="text-sm font-semibold text-[#0B1220] text-right">
                              − PKR {e.amount.toLocaleString()}
                            </span>
                          )}

                          <div className="flex justify-end gap-3">
                            {editingId === e.id ? (
                              <>
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
                                <button
                                  onClick={() => startEdit(e)}
                                  className="text-xs font-medium text-[#0B1220]/50 hover:text-[#16815F]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteId(e.id)}
                                  className="text-xs font-medium text-[#0B1220]/50 hover:text-red-600"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-[#0B1220]">
              Delete expense?
            </h2>
            <p className="mt-2 text-sm text-[#0B1220]/60">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#0B1220]/60 hover:bg-[#F3F4F6]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleDelete(deleteId);
                  setDeleteId(null);
                }}
                className="rounded-lg bg-[#0B1220] px-4 py-2 text-sm font-medium text-white hover:bg-[#16815F]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
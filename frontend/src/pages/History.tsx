import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
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

const CATEGORIES = [
  { label: "Food", icon: "🍔" },
  { label: "Transport", icon: "🚌" },
  { label: "Shopping", icon: "🛍️" },
  { label: "Entertainment", icon: "🎬" },
  { label: "Other", icon: "📦" },
];

const MOODS = [
  { label: "Happy", icon: "😊" },
  { label: "Neutral", icon: "😐" },
  { label: "Stressed", icon: "😩" },
  { label: "Impulsive", icon: "🥴" },
  { label: "Tired", icon: "😴" },
];

const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.label, c.icon])
);

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
function groupByMonth(expenses: Expense[]) {
  const groups: Record<string, { label: string; items: Expense[] }> = {};

  for (const e of expenses) {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(e);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([key, group]) => ({ key, ...group }));
}

// "2026-07-19T14:32:00.000Z" -> "2026-07-19", for the date input's value
function toDateInputValue(isoString: string) {
  return isoString.slice(0, 10);
}

export default function History() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchExpenses();
  }, [user]);

  async function fetchExpenses() {
    setLoading(true);
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

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setEditDate(toDateInputValue(expense.createdAt));
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setEditMood(expense.mood);
    setEditDescription(expense.description ?? "");
    setEditError("");
  }

  async function saveEdit() {
    if (!editingExpense) return;
    setEditError("");

    const amountValue = Number(editAmount);
    if (!amountValue || amountValue <= 0) {
      setEditError("Enter an amount greater than zero.");
      return;
    }
    if (!editCategory) {
      setEditError("Pick a category.");
      return;
    }
    if (!editMood) {
      setEditError("Pick a mood.");
      return;
    }
    if (!editDate) {
      setEditError("Pick a date.");
      return;
    }
    const today = toDateInputValue(new Date().toISOString());

    if (editDate > today) {
      setEditError("You cannot log an expense for a future date.");
      return;
    }

    // preserve the original time-of-day, only change the calendar date —
    // avoids collapsing everything to midnight, and keeps dayOfWeek accurate
    const original = new Date(editingExpense.createdAt);
    const [year, month, day] = editDate.split("-").map(Number);
    const updatedDate = new Date(
      year,
      month - 1,
      day,
      original.getHours(),
      original.getMinutes(),
      original.getSeconds()
    );

    setSaving(true);
    try {
      await updateDoc(doc(db, "expenses", editingExpense.id), {
        amount: amountValue,
        category: editCategory,
        mood: editMood,
        description: editDescription || null,
        createdAt: updatedDate.toISOString(),
        timestamp: Timestamp.fromDate(updatedDate),
        dayOfWeek: updatedDate.getDay(),
      });

      setExpenses((prev) =>
        prev
          .map((e) =>
            e.id === editingExpense.id
              ? {
                  ...e,
                  amount: amountValue,
                  category: editCategory,
                  mood: editMood,
                  description: editDescription || undefined,
                  createdAt: updatedDate.toISOString(),
                }
              : e
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );

      setEditingExpense(null);
    } catch {
      setEditError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
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
                  <h2 className="font-display text-lg font-semibold text-[#0B1220]">{group.label}</h2>
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
                            <p className="text-sm font-semibold text-[#0B1220] whitespace-nowrap">
                              − PKR {e.amount.toLocaleString()}
                            </p>
                            <div className="flex justify-end gap-3 mt-1.5">
                              <button
                                onClick={() => openEdit(e)}
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
                          <span className="text-sm font-semibold text-[#0B1220] text-right">
                            − PKR {e.amount.toLocaleString()}
                          </span>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => openEdit(e)}
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

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-[#0B1220]">Delete expense?</h2>
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

      {/* Full edit modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-lg font-semibold text-[#0B1220] mb-4">Edit expense</h2>

            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#0B1220]/70 mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(ev) => setEditDate(ev.target.value)}
                  max={toDateInputValue(new Date().toISOString())}
                  className="w-full border border-[#D8DCE3] rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0B1220]/70 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  min="1"
                  value={editAmount}
                  onChange={(ev) => setEditAmount(ev.target.value)}
                  className="w-full border border-[#D8DCE3] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0B1220]/70 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setEditCategory(c.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        editCategory === c.label
                          ? "bg-[#0B1220] text-white border-[#0B1220]"
                          : "bg-white text-[#0B1220] border-[#D8DCE3] hover:border-[#0B1220]/40"
                      }`}
                    >
                      <span>{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0B1220]/70 mb-2">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setEditMood(m.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        editMood === m.label
                          ? "bg-[#16815F]/10 border-[#16815F] text-[#0B1220]"
                          : "bg-white text-[#0B1220] border-[#D8DCE3] hover:border-[#0B1220]/40"
                      }`}
                    >
                      <span>{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

            
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingExpense(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#0B1220]/60 hover:bg-[#F3F4F6]"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-lg bg-[#0B1220] px-4 py-2 text-sm font-medium text-white hover:bg-[#16815F] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { getMonthKey } from "../lib/date";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Other" ];

export default function SetBudget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [totalBudget, setTotalBudget] = useState("");
  const [useCategorySplit, setUseCategorySplit] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(
    Object.fromEntries(CATEGORIES.map((c) => [c, ""]))
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // pre-fill if the user already set a budget before (editable, not one-time-only)
  useEffect(() => {
  if (!user) return;
  (async () => {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data();
    const currentMonthKey = getMonthKey();

    if (data?.budgetMonth === currentMonthKey) {
      if (data?.monthlyBudget) setTotalBudget(String(data.monthlyBudget));
      if (data?.categoryBudgets) {
        setUseCategorySplit(true);
        setCategoryBudgets((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data.categoryBudgets).map(([k, v]) => [k, String(v)])
          ),
        }));
      }
    }
    setFetching(false);
  })();
}, [user]);



  const categorySum = Object.values(categoryBudgets).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const total = Number(totalBudget);
    if (!total || total <= 0) {
      setError("Enter a budget greater than zero.");
      return;
    }
    if (useCategorySplit && categorySum > total) {
      setError(
        `Category budgets add up to ${categorySum}, which is more than your total budget of ${total}.`
      );
      return;
    }

    setLoading(true);
    try {
      await setDoc(
        doc(db, "users", user!.uid),
        {
          monthlyBudget: total,
          budgetMonth: getMonthKey(),
          categoryBudgets: useCategorySplit
            ? Object.fromEntries(
                Object.entries(categoryBudgets)
                  .filter(([, v]) => Number(v) > 0)
                  .map(([k, v]) => [k, Number(v)])
              )
            : null,
          budgetSetAt: new Date().toISOString(),
        },
        { merge: true }
      );
      navigate("/dashboard");
    } catch {
      setError("Couldn't save your budget. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="min-h-[calc(100vh-73px)] bg-[#F5F6F8]" />;
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#F5F6F8] flex items-center justify-center px-6 font-body py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-8">
          <h1 className="font-display text-2xl font-semibold mb-1 text-[#0B1220]">
            Set your monthly budget
          </h1>
          <p className="text-sm text-[#0B1220]/70 mb-6">
            You can change this anytime from your dashboard.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="total" className="block text-xs font-medium text-[#0B1220]/70 mb-1">
                Total budget (PKR)
              </label>
              <input
                id="total"
                type="number"
                min="1"
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="15000"
                className="w-full border border-[#D8DCE3] rounded-lg px-3 py-2 text-sm font-mono bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[#0B1220]/80 cursor-pointer">
              <input
                type="checkbox"
                checked={useCategorySplit}
                onChange={(e) => setUseCategorySplit(e.target.checked)}
                className="rounded accent-[#16815F]"
              />
              Split budget by category
              <span className="text-xs text-[#0B1220]/50">(optional)</span>
            </label>

            {useCategorySplit && (
              <div className="space-y-3 border-t border-[#E4E7EC] pt-4">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center justify-between gap-3">
                    <label htmlFor={cat} className="text-sm text-[#0B1220]/80 w-32">
                      {cat}
                    </label>
                    <input
                      id={cat}
                      type="number"
                      min="0"
                      value={categoryBudgets[cat]}
                      onChange={(e) =>
                        setCategoryBudgets((prev) => ({ ...prev, [cat]: e.target.value }))
                      }
                      placeholder="0"
                      className="flex-1 border border-[#D8DCE3] rounded-lg px-3 py-1.5 text-sm font-mono bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
                    />
                  </div>
                ))}
                <p className="text-xs text-[#0B1220]/50 font-mono">
                  Allocated: {categorySum} / {totalBudget || 0}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B1220] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#16815F] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save and continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

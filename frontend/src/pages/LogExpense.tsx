import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

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

export default function LogExpense() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [mood, setMood] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const value = Number(amount);

    if (!date) {
      setError("Pick a date.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];

      if (date > today) {
        setError("You cannot log an expense for a future date.");
        return;
      }

    if (!value || value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!category) {
      setError("Pick a category.");
      return;
    }

    if (!mood) {
      setError("Pick how you were feeling.");
      return;
    }

    setLoading(true);

    try {
      // Create the expense date from the selected calendar date
      const [year, month, day] = date.split("-").map(Number);

      const expenseDate = new Date(
        year,
        month - 1,
        day,
        new Date().getHours(),
        new Date().getMinutes(),
        new Date().getSeconds()
      );

      await addDoc(collection(db, "expenses"), {
        userId: user!.uid,
        amount: value,
        category,
        mood,

        // Based on the date selected by the user
        dayOfWeek: expenseDate.getDay(),

        // The actual date the expense belongs to
        timestamp: Timestamp.fromDate(expenseDate),
        createdAt: expenseDate.toISOString(),
      });

      navigate("/dashboard");
    } catch {
      setError("Couldn't save this expense. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#F5F6F8] flex items-center justify-center px-6 font-body py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-8">
          <div className="flex justify-between items-baseline mb-6">
            <h1 className="font-display text-2xl font-semibold text-[#0B1220]">
              Log an expense
            </h1>

            <Link
              to="/dashboard"
              className="text-xs text-[#0B1220]/60 hover:text-[#16815F]"
            >
              Cancel
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="block text-xs font-medium text-[#0B1220]/70 mb-1"
              >
                Date
              </label>

              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-[#D8DCE3] rounded-lg px-3 py-3 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
              />
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-xs font-medium text-[#0B1220]/70 mb-1"
              >
                Amount (PKR)
              </label>

              <input
                id="amount"
                type="number"
                min="1"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full border border-[#D8DCE3] rounded-lg px-3 py-3 text-2xl font-mono bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16815F]"
              />
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-medium text-[#0B1220]/70 mb-2">
                Category
              </p>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCategory(c.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                      category === c.label
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

            {/* Mood */}
            <div>
              <p className="text-xs font-medium text-[#0B1220]/70 mb-2">
                How were you feeling?
              </p>

              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setMood(m.label)}
                    title={m.label}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-colors ${
                      mood === m.label
                        ? "bg-[#16815F]/10 border-[#16815F]"
                        : "bg-white border-[#D8DCE3] hover:border-[#0B1220]/40"
                    }`}
                  >
                    <span className="text-xl leading-none">
                      {m.icon}
                    </span>

                    <span className="text-[10px] text-[#0B1220]/60">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B1220] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#16815F] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save expense"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
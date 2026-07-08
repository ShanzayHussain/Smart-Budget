import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

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

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [mood, setMood] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const value = Number(amount);
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
      const now = new Date();
      await addDoc(collection(db, "expenses"), {
        userId: user!.uid,
        amount: value,
        category,
        mood,
        dayOfWeek: now.getDay(), // 0 = Sunday ... 6 = Saturday, useful later for the model
        timestamp: Timestamp.fromDate(now),
        createdAt: now.toISOString(),
      });
      navigate("/dashboard");
    } catch {
      setError("Couldn't save this expense. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1] flex items-center justify-center px-6 font-body py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="SmartBudget Logo" className="w-9 h-9 object-contain" />
          <span className="font-display text-2xl font-extrabold tracking-tight">
            SmartBudget
          </span>
        </div>

        <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex justify-between items-baseline mb-6">
            <h1 className="font-display text-2xl font-semibold">Log an expense</h1>
            <Link to="/dashboard" className="text-xs text-[#1F2A44]/60 hover:text-[#B34A2E]">
              Cancel
            </Link>
          </div>

          {error && (
            <div className="bg-[#B34A2E]/10 border border-[#B34A2E]/30 text-[#B34A2E] text-sm rounded-lg px-3 py-2 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-xs font-medium text-[#1F2A44]/70 mb-1">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-2xl font-mono bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B34A2E]"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-[#1F2A44]/70 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCategory(c.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                      category === c.label
                        ? "bg-[#0c0c0e] text-white border-[#0c0c0e]"
                        : "bg-white text-[#1F2A44] border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#1F2A44]/70 mb-2">
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
                        ? "bg-[#E8A33D]/20 border-[#E8A33D]"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-xl leading-none">{m.icon}</span>
                    <span className="text-[10px] text-[#1F2A44]/60">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0c0c0e] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#B34A2E] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save expense"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
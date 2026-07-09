import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import logo from "../assets/logo2.png";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        monthlyBudget: null,
        createdAt: new Date().toISOString(),
      });
      navigate("/set-budget");
    } catch (err) {
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, "users", cred.user.uid);
      const existing = await getDoc(userRef);

      if (!existing.exists()) {
        // first time this Google account has signed in — create their profile
        await setDoc(userRef, {
          name: cred.user.displayName ?? "",
          email: cred.user.email,
          monthlyBudget: null,
          createdAt: new Date().toISOString(),
        });
        navigate("/set-budget");
      } else {
        // already has a profile (and likely a budget) — skip straight to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      setError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1] flex items-center justify-center px-6 font-body">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="SmartBudget Logo" className="w-9 h-9 object-contain" />
          <span className="font-display text-2xl font-extrabold tracking-tight">
            SmartBudget
          </span>
        </div>

        <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-200 p-8">
          <h1 className="font-display text-2xl font-semibold mb-1">
            Create your account
          </h1>
          <p className="text-sm text-[#1F2A44]/70 mb-6">
            Start logging expenses in under a minute.
          </p>

          {error && (
            <div className="bg-[#B34A2E]/10 border border-[#B34A2E]/30 text-[#B34A2E] text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          

          

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-[#1F2A44]/70 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B34A2E]"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#1F2A44]/70 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B34A2E]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#1F2A44]/70 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B34A2E]"
              />
              <p className="text-[10px] text-[#1F2A44]/50 mt-1">At least 6 characters.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0c0c0e] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#B34A2E] transition-colors disabled:opacity-50 mb-5"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-[#1F2A44]/50">or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 mb-5"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <p className="text-sm text-center text-[#1F2A44]/70 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#B34A2E] font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function mapFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password needs to be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in was closed before finishing. Try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
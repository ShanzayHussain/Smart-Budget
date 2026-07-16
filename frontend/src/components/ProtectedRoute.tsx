import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import logo from "../assets/logo.png";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#F5F6F8]" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const name = user?.displayName || user?.email || "";
  const initial = name ? name.charAt(0).toUpperCase() : "U";

  async function handleSignOut() {
    await signOut(auth);
    navigate("/login");
  }

  const navLinkClass = (path: string) =>
    location.pathname === path
      ? "text-[#0B1220] border-b-2 border-[#0F6656] pb-1"
      : "text-[#0B1220]/50 hover:text-[#0B1220] pb-1";

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-body">
      <header className="sticky top-0 z-10 bg-white border-b border-[#E4E7EC]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="SmartBudget Logo" className="w-8 h-8 object-contain" />
              <span className="font-display text-xl font-semibold text-[#0B1220]">
                SmartBudget
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                Dashboard
              </Link>
              <Link to="/set-budget" className={navLinkClass("/set-budget")}>
                Set Budget
              </Link>
              <Link to="/log-expense" className={navLinkClass("/log-expense")}>
                Expenses
              </Link>
              <Link to="/insights" className={navLinkClass("/insights")}>
                Insights
              </Link>
           
              <Link to="/history" className={navLinkClass("/history")}>
                History
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              title="Notifications"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E4E7EC] text-[#0B1220]/60 hover:text-[#0B1220] transition-colors"
            >
              <BellIcon />
            </button>
            {/* <Link
              to="/settings"
              title="Settings"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E4E7EC] text-[#0B1220]/60 hover:text-[#0B1220] transition-colors"
            >
              <GearIcon />
            </Link> */}
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-[#0B1220] text-white flex items-center justify-center text-sm font-semibold">
                {initial}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-medium text-[#0B1220]/40 hover:text-[#16815F] transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.04 1.56V21a2 2 0 01-4 0v-.09A1.7 1.7 0 008.96 19a1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.56-1.04H3a2 2 0 010-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001.04-1.56V3a2 2 0 014 0v.09A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.87.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.56 1.04H21a2 2 0 010 4h-.09A1.7 1.7 0 0019.4 15z" />
    </svg>
  );
}

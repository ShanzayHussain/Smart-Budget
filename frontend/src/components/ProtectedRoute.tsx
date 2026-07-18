import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import logo from "../assets/logo.png";
import ChatWidget from "./ChatWidget";

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

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/set-budget", label: "Set Budget" },
  { path: "/log-expense", label: "Expenses" },
  { path: "/insights", label: "Insights" },
  { path: "/history", label: "History" },
];

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const mobileNavLinkClass = (path: string) =>
    location.pathname === path
      ? "block px-4 py-3 text-sm font-medium text-[#0B1220] bg-[#F5F6F8]"
      : "block px-4 py-3 text-sm font-medium text-[#0B1220]/60 hover:bg-[#F5F6F8]";

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-body">
      <header className="sticky top-0 z-20 bg-white border-b border-[#E4E7EC]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="SmartBudget Logo" className="w-8 h-8 object-contain" />
              <span className="font-display text-xl font-semibold text-[#0B1220]">
                SmartBudget
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {NAV_ITEMS.map((item) => (
                <Link key={item.path} to={item.path} className={navLinkClass(item.path)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
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

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#0B1220] hover:bg-[#F5F6F8]"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-[#E4E7EC] bg-white">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={mobileNavLinkClass(item.path)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E4E7EC]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#0B1220] text-white flex items-center justify-center text-xs font-semibold">
                  {initial}
                </span>
                <span className="text-sm text-[#0B1220]/70 truncate max-w-[160px]">{name}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-medium text-[#0B1220]/50 hover:text-[#16815F]"
              >
                Sign out
              </button>
            </div>
          </nav>
        )}
      </header>

      {children}
      <ChatWidget />
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
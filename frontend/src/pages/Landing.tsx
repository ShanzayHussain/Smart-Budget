import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const moodChips = [
  { emoji: "🙂", label: "Content", active: true },
  { emoji: "😐", label: "Neutral", active: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#0B1220] font-body">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E4E7EC]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4" >
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="SmartBudget Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display text-xl font-semibold">SmartBudget</span>
          </div>

          <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-[#0B1220]/80">
          <a href="#" className="hover:text-[#0B1220]">About</a>
            <a href="#features" className="hover:text-[#0B1220]">Features</a>
            <a href="#how-it-works" className="hover:text-[#0B1220]">How it Works</a>
            
            {/* <a href="#why-ml" className="hover:text-[#0B1220]">About</a>
            <a href="#pricing" className="hover:text-[#0B1220]">Pricing</a> */}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-2 rounded-md text-[#0B1220] hover:bg-[#F0F1F3] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16815F]"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="bg-[#0B1220] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#16815F] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16815F]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-25 grid md:grid-cols-2 gap-14 items-center">
        <div>
          

          <h1 className="font-display text-4xl sm:text-7xl font-bold leading-[1.1] mb-9">
            Master Your Personal Finances with{" "}
            <span className="text-[#16815F]">Smart Insights</span>
          </h1>

          <p className="text-base text-[#0B1220]/60 mb-9 max-w-md  leading-relaxed">
            Navigate daily life without the financial stress. Track your
            spending in PKR, log your moods, and let our ML models predict
            risks before they impact your savings.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="bg-[#0B1220] text-white px-6 py-3 rounded-md font-medium hover:bg-[#16815F] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16815F]"
            >
              Get Started for Free
            </Link>
            
          </div>
        </div>

        {/* Signature element: laptop dashboard mockup + floating mood card */}
        <div className="relative">
          <div className="bg-[#0B1220] rounded-2xl p-3 shadow-xl">
            <div className="flex items-center gap-1.5 px-2 pb-2">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="w-2 h-2 rounded-full bg-white/20" />
            </div>
            <div className="bg-white rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-wide text-[#0B1220]/50">
                  Spending overview
                </span>
                <span className="font-mono text-[10px] px-2 py-1 rounded-sm bg-[#16815F]/10 text-[#16815F] font-medium">
                  On track
                </span>
              </div>
              <svg viewBox="0 0 300 100" className="w-full h-24">
                <polygon
                  points="0,100 0,70 40,55 80,60 120,35 160,45 200,20 240,30 280,10 300,10 300,100"
                  fill="#16815F"
                  opacity="0.12"
                />
                <polyline
                  points="0,70 40,55 80,60 120,35 160,45 200,20 240,30 280,10"
                  fill="none"
                  stroke="#16815F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="280" cy="10" r="4" fill="#B34A2E" />
              </svg>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {["Food", "Transit", "Bills", "Fun"].map((cat) => (
                  <div key={cat} className="bg-[#F5F6F8] rounded-md py-2 text-center">
                    <span className="font-mono text-[9px] text-[#0B1220]/50">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating mood card */}
          <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg border border-[#E4E7EC] px-4 py-3 flex items-center gap-3 max-w-[220px]">
            <span className="text-xl">😊</span>
            <div>
              <p className="text-xs font-semibold leading-tight">
                "I feel focused today"
              </p>
              <p className="text-[10px] text-[#0B1220]/50 leading-tight">
                Spending remains stable
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#0B1220] text-white">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-3 text-center divide-x divide-white/10">
          {[
            { value: "10,000+", label: "Users Empowered" },
            { value: "PKR 50M+", label: "Tracked Monthly" },
            { value: "4.9/5", label: "App Store Rating" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-2xl sm:text-3xl font-bold">{stat.value}</p>
              <p className="text-xs sm:text-sm text-white/50 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl font-bold mb-3">
            Engineered for Your Financial Life
          </h2>
          <p className="text-[#0B1220]/60">
            Beyond just numbers, we help you understand the "why" behind
            your spending habits and financial decisions.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Honest budgeting */}
          <div className="bg-white rounded-xl border border-[#E4E7EC] p-6 flex items-center justify-between gap-6 overflow-hidden">
            <div>
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#0B1220] text-white mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 9h18M8 14h4" />
                </svg>
              </span>
              <h3 className="font-display text-lg font-semibold mb-2">Honest Budgeting</h3>
              <p className="text-sm text-[#0B1220]/60 leading-relaxed">
                Track your PKR monthly budget with ease. Our interface adapts
                to the local currency context, helping you manage bills, rent,
                and daily expenses without mental math.
              </p>
            </div>
            <div className="hidden sm:block shrink-0 w-24 h-36 bg-[#0B1220] rounded-2xl p-1.5">
              <div className="bg-white rounded-xl w-full h-full p-2 flex flex-col gap-1.5">
                <div className="h-2 w-8 bg-[#E4E7EC] rounded-full" />
                <div className="h-6 w-full bg-[#16815F]/10 rounded" />
                <div className="h-2 w-10 bg-[#E4E7EC] rounded-full" />
                <div className="h-2 w-6 bg-[#E4E7EC] rounded-full" />
                <div className="flex-1 bg-[#F5F6F8] rounded" />
              </div>
            </div>
          </div>

          {/* Mood tracking */}
          <div className="bg-[#0F4D3D] text-white rounded-xl p-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-white/10 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
              </svg>
            </span>
            <h3 className="font-display text-lg font-semibold mb-2">Mood Tracking</h3>
            <p className="text-sm text-white/70 leading-relaxed mb-5">
              Understand how your emotions drive your spending. Log a mood
              with every expense to see if stress or joy impacts your wallet.
            </p>
            <div className="flex gap-3">
              {["😊", "😐", "😔"].map((emoji) => (
                <span
                  key={emoji}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-lg"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>

          {/* ML predictions */}
          <div className="bg-white rounded-xl border border-[#E4E7EC] p-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#0B1220] text-white mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
              </svg>
            </span>
            <h3 className="font-display text-lg font-semibold mb-2">ML Predictions</h3>
            <p className="text-sm text-[#0B1220]/60 leading-relaxed">
              Get smart alerts on overspending risks. Our AI analyzes your
              history to predict when you're likely to run out of funds by
              month-end.
            </p>
          </div>

          {/* User-centric design */}
          <div className="bg-[#0B1220] text-white rounded-xl p-6 flex items-center justify-between gap-6 overflow-hidden">
            <div>
              <h3 className="font-display text-lg font-semibold mb-2">User-Centric Design</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4 max-w-xs">
                Built specifically for your financial goals. From managing
                monthly bills to splitting shared expenses with friends or
                family.
              </p>
              {/* <a href="#why-ml" className="inline-flex items-center gap-1 text-sm font-medium text-[#16815F] hover:gap-2 transition-all">
                Explore our vision <span aria-hidden>→</span>
              </a> */}
            </div>
            <svg className="hidden sm:block shrink-0" width="90" height="90" viewBox="0 0 90 90" fill="none">
              <rect x="10" y="40" width="18" height="18" rx="3" fill="#16815F" opacity="0.5" transform="rotate(12 19 49)" />
              <rect x="40" y="15" width="22" height="22" rx="3" fill="#ffffff" opacity="0.15" transform="rotate(-8 51 26)" />
              <rect x="55" y="50" width="26" height="26" rx="3" fill="#16815F" opacity="0.3" transform="rotate(20 68 63)" />
              <circle cx="30" cy="15" r="8" fill="#ffffff" opacity="0.1" />
            </svg>
          </div>
        </div>
      </section>

  

            {/* How it works / 3 steps */}
<section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
  <h2 className="font-display text-center text-3xl font-bold mb-16">
    Financial Mastery in Three Simple Steps
  </h2>

  <div className="grid md:grid-cols-2 gap-12">

    {/* Step 01 */}
    <div className="grid grid-cols-[auto_1fr] gap-6 items-start">
      <span className="font-mono text-sm text-[#16815F] font-semibold pt-1">
        01
      </span>

      <div>
        <h3 className="font-display text-xl font-semibold mb-2">
          Set your Monthly Budget
        </h3>

        <p className="text-[#0B1220]/60 mb-5 max-w-xl leading-relaxed">
          Input your monthly income in PKR. Define categories that matter to
          you, like groceries, transportation, and savings.
        </p>

        <div className="bg-white border border-[#E4E7EC] rounded-lg p-4 max-w-sm">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span>Total Allowance</span>
            <span className="font-mono">PKR 45,000</span>
          </div>

          <div className="h-2 rounded-full bg-[#F0F1F3] overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-[#16815F]" />
          </div>
        </div>
      </div>
    </div>


    {/* Step 02 */}
    <div className="grid grid-cols-[auto_1fr] gap-6 items-start">
      <span className="font-mono text-sm text-[#16815F] font-semibold pt-1">
        02
      </span>

      <div>
        <h3 className="font-display text-xl font-semibold mb-2">
          Log Expenses with Mood
        </h3>

        <p className="text-[#0B1220]/60 mb-5 max-w-xl leading-relaxed">
          Whenever you spend, take five seconds to log the amount and how
          you're feeling. Our interface makes it seamless to capture both
          data points simultaneously.
        </p>

        <div className="flex gap-3 flex-wrap">
          {moodChips.map((chip) => (
            <span
              key={chip.label}
              className={
                chip.active
                  ? "inline-flex items-center gap-1.5 bg-[#16815F] text-white text-sm font-medium px-4 py-1.5 rounded-full"
                  : "inline-flex items-center gap-1.5 bg-white border border-[#D8DCE3] text-sm font-medium px-4 py-1.5 rounded-full"
              }
            >
              {chip.emoji} {chip.label}
            </span>
          ))}
        </div>
      </div>
    </div>


    {/* Step 03 */}
    <div className="md:col-span-2 flex justify-center">
      <div className="grid grid-cols-[auto_1fr] gap-6 items-start max-w-2xl">
        <span className="font-mono text-sm text-[#16815F] font-semibold pt-1">
          03
        </span>

        <div>
          <h3 className="font-display text-xl font-semibold mb-2">
            Receive Smart Coaching
          </h3>

          <p className="text-[#0B1220]/60 mb-5 max-w-xl leading-relaxed">
            Get weekly insights and real-time alerts. If you're spending more
            when stressed, we'll give you a gentle nudge and helpful tips to
            stay on track.
          </p>

          <div className="bg-[#16815F] text-white rounded-lg p-4 max-w-md flex gap-3 items-start">
            <span className="text-[#E8A33D] mt-0.5">⚠</span>

            <p className="text-sm leading-relaxed">
              Risk Alert: You've spent 80% of your entertainment budget 10
              days before month-end. Consider dining in this week.
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-[#0B1220] rounded-2xl px-8 py-16 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 max-w-xl mx-auto leading-tight">
            Stop Worrying About Debt. Start Budgeting Like a Pro.
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-8">
            Join thousands of users who have already transformed their
            financial future with SmartBudget.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-[#16815F] text-white px-6 py-3 rounded-md font-medium hover:bg-[#16815F]/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
          >
            Get Started for Free
          </Link>
          <p className="text-white/30 text-xs mt-4">
            No credit card required. Free to get started today.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1220] text-white/60 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div>
            <p className="text-white font-semibold text-base mb-1">SmartBudget</p>
            <p className="text-xs text-white/40">© 2024 SmartBudget. Empowering users through financial focus.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Contact Us</a>
            <a href="#" className="hover:text-white">Help Center</a>
            <a href="#" className="hover:text-white">Careers</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

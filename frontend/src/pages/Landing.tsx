import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
const weekData = [
  { day: "Mon", amount: 450, mood: "😊", y: 60 },
  { day: "Tue", amount: 200, mood: "😐", y: 75 },
  { day: "Wed", amount: 1200, mood: "😩", y: 20 },
  { day: "Thu", amount: 300, mood: "🙂", y: 68 },
  { day: "Fri", amount: 1800, mood: "😅", y: 5 },
  { day: "Sat", amount: 2200, mood: "🥴", y: -5 },
  { day: "Sun", amount: 150, mood: "😴", y: 70 },
];

// build an SVG path connecting the week's points
const points = weekData.map((d, i) => `${i * 60 + 20},${90 - d.y}`);
const pathD = `M ${points.join(" L ")}`;

function riskColor(y: number) {
  if (y < 10) return "#B34A2E";
  if (y < 40) return "#E8A33D";
  return "#3F7D58";
}

export default function Landing() {
  return (
    <div className="min-h-screen  bg-gradient-to-br from-[#b8b4ad] via-[#dfddd9] to-[#f5f4f1] text-[#000000] font-body">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-[#ffffff] backdrop-blur border-b border-[#F6F3EC] shadow-md mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4"> 
          <div className="flex items-center gap-2">
            <img
                src={logo}
                alt="SmartBudget Logo"
                className="w-10 h-10 object-contain"
                />
            <span className="font-display text-3xl font-extrabold tracking-tight">SmartBudget</span>
          </div>
          <nav className="hidden sm:flex items-center gap-8 text-sm font-medium">
            
            <Link
              to="/login"
              className="bg-[#ffffff] text-[#020201] text-sm font-medium px-4 py-2 rounded-sm hover:bg-[#B34A2E] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B34A2E]"
            >
              Log in
            </Link>
          
          <Link
            to="/signup"
            className="bg-[#070606] text-[#ffffff] text-sm font-medium px-4 py-2 rounded-sm hover:bg-[#B34A2E] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B34A2E]"
          >
            Get started
          </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
        
          <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-tight mb-6">
            Predict overspending.
    
            Build better money habits.
        
          </h1>
          <p className="text-base text-[#1F2A44]/80 font-semibold mb-8 max-w-md">
            Track your expenses, monitor your budget, and get AI-powered insights that help you make smarter financial decisions every day.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="bg-[#0c0c0e] text-[#F6F3EC] px-6 py-3 rounded-sm font-medium hover:bg-[#B34A2E] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B34A2E]"
            >
              Get started free
            </Link>
          </div>
        </div>

        {/* Signature element: week strip */}
        <div className="bg-white/60 border border-[#D8D2C4] rounded-md p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs uppercase tracking-wide text-[#1F2A44]/60">
              This week
            </span>
            <span className="font-mono text-xs px-2 py-1 rounded-sm bg-[#E8A33D]/20 text-[#B34A2E] font-medium">
              Risk: Medium
            </span>
          </div>

          <svg viewBox="0 0 440 100" className="w-full h-24 mb-2">
            <path
              d={pathD}
              fill="none"
              stroke="#1F2A44"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sparkline-path"
              opacity={0.4}
            />
            {weekData.map((d, i) => (
              <circle
                key={d.day}
                cx={i * 60 + 20}
                cy={90 - d.y}
                r="5"
                fill={riskColor(d.y)}
              />
            ))}
          </svg>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekData.map((d) => (
              <div key={d.day} className="flex flex-col items-center">
                <span className="text-lg leading-none mb-1">{d.mood}</span>
                <span className="font-mono text-[10px] text-[#1F2A44]/60">
                  {d.day}
                </span>
                <span className="font-mono text-[11px] font-medium">
                  {d.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#D8D2C4]">
        <h2 className="font-display text-3xl font-semibold mb-12">
          How it works
        </h2>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
  {[
    {
      n: "01",
      title: "Set your budget",
      body: "Enter what you have for the month. One number, editable anytime.",
    },
    {
      n: "02",
      title: "Log as you spend",
      body: "Amount, category, and how you felt in the moment. Takes ten seconds.",
    },
    {
      n: "03",
      title: "See your risk",
      body: "Your pace, plus a plain-language prediction of where the month is headed.",
    },
  ].map((step) => (
    <div
      key={step.n}
      className="bg-white/40 rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-200"
    >
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#000000] text-white font-semibold mb-4">
        {step.n}
      </span>

      <h3 className="font-display text-xl font-semibold mb-3">
        {step.title}
      </h3>

      <p className="text-[#1F2A44]/75 leading-relaxed">
        {step.body}
      </p>
    </div>
  ))}
</div>
      </section>

      {/* Why ML section */}
      <section id="why-ml" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#D8D2C4]">
        <h2 className="font-display text-3xl font-semibold mb-4">
          Two kinds of tracking, used where each belongs
        </h2>
        <p className="text-[#1F2A44]/75 max-w-2xl mb-12">
          Not everything needs a model. SmartBudget separates honest
          arithmetic from actual prediction, so you always know which one
          you're looking at.
        </p>
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="border border-[#D8D2C4] rounded-md p-6 bg-white/40">
            <span className="font-mono text-xs uppercase tracking-wide text-[#3F7D58]">
              The honest math
            </span>
            <h3 className="font-display text-lg font-semibold mt-2 mb-2">
              Budget vs. spent
            </h3>
            <p className="text-sm text-[#1F2A44]/75">
              No model needed here, just your running total against your
              budget, and the daily pace required to stay under it.
            </p>
          </div>
          <div className="border border-[#D8D2C4] rounded-md p-6 bg-white/40">
            <span className="font-mono text-xs uppercase tracking-wide text-[#B34A2E]">
              The pattern prediction
            </span>
            <h3 className="font-display text-lg font-semibold mt-2 mb-2">
              Overspending risk
            </h3>
            <p className="text-sm text-[#1F2A44]/75">
              Looks at your mood, the day of the week, and your recent trend
              to flag risk before it shows up in the total.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D8D2C4] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#1F2A44]/60">
          <span>SmartBudget — built one commit at a time.</span>
          <span className="font-mono">v0.1</span>
        </div>
      </footer>
    </div>
  );
}
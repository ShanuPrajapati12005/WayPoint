import React, { useState, useEffect } from "react";
import {
  Compass, MessageCircle, GitBranch, LayoutDashboard, Sparkles, X, Send, Mic,
  Flame, Zap, TrendingUp, Clock, Lock, Check, ChevronLeft, ChevronRight,
  ArrowRight, Pencil, ChevronDown, Route, GitFork, PlayCircle, StopCircle,
  Mail, Eye, EyeOff, Chrome, ShieldCheck, Star, CheckCircle2, Target, Layers,
  ThumbsUp, ThumbsDown, SkipForward, BellRing
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend
} from "recharts";

/* ---------------- DATA ---------------- */

const NODE_ORDER = ["f1","f2","f3","d1","d2","m1","m2","m3"];

// Fixed desktop pixel positions — consecutive nodes align on one axis for clean straight connectors.
// Shared across every track — only titles/status/skills differ per track, layout stays identical.
const POS = {
  f1: { x: 40,  y: 40 },
  f2: { x: 340, y: 40 },
  f3: { x: 640, y: 40 },
  d1: { x: 640, y: 200 },
  d2: { x: 340, y: 200 },
  m1: { x: 340, y: 360 },
  m2: { x: 640, y: 360 },
  m3: { x: 940, y: 360 },
};
const NW = 170, NH = 88;
const CANVAS_W = 1150, CANVAS_H = 488;

const EDGES = [["f1","f2"],["f2","f3"],["f3","d1"],["d1","d2"],["d2","m1"],["m1","m2"],["m2","m3"]];

const TREE_BRANCHES = [
  { id: "foundations", label: "Foundations", color: "#5B5FEF", children: ["f1","f2","f3"], defaultOpen: true },
  { id: "core", label: "Core Build", color: "#0EA5A4", children: ["d1","d2"], defaultOpen: false },
  { id: "advanced", label: "Advanced / Capstone", color: "#D97706", children: ["m1","m2","m3"], defaultOpen: false },
];

const QUIZ_QUESTIONS = [
  { q: "You need to merge two SQL tables and keep unmatched rows from both sides. Which join do you reach for?", options: ["INNER JOIN", "LEFT JOIN", "FULL OUTER JOIN", "Not sure"] },
  { q: "Which metric best describes how spread out a dataset is, not just its center?", options: ["Mean", "Median", "Standard deviation", "Mode"] },
  { q: "In Pandas, which method removes duplicate rows from a DataFrame?", options: ["dropna()", "drop_duplicates()", "unique()", "Not sure"] },
];

const INSIGHTS = [
  { icon: "🚀", text: "You're finishing nodes 20% faster than similar learners.", action: "Add a stretch goal" },
  { icon: "🔥", text: "12-day streak — your longest yet. Keep the chain going today.", action: "Do today's task" },
  { icon: "🧠", text: "You scored low on the Statistics quiz — a quick refresher is queued.", action: "Review with AI" },
];

// NEW: multi-track data. Every target_role a user explores gets its own independent
// nodeMap + skillData + reasoning — never overwritten. "not_started" replaces the old
// "locked" status entirely: no node is ever gated, any node is clickable from the start.
const TRACKS = {
  ml: {
    id: "ml", label: "Machine Learning", status: "active",
    nodeMap: {
      f1: { title: "Python Basics", status: "completed", match: 96, duration: "2 wks" },
      f2: { title: "Statistics 101", status: "completed", match: 91, duration: "2 wks" },
      f3: { title: "SQL for Data", status: "in_progress", match: 88, duration: "1.5 wks" },
      d1: { title: "Pandas & NumPy", status: "not_started", match: 93, duration: "2 wks" },
      d2: { title: "Data Visualization", status: "not_started", match: 85, duration: "1 wk" },
      m1: { title: "ML Fundamentals", status: "not_started", match: 90, duration: "3 wks" },
      m2: { title: "Model Evaluation", status: "not_started", match: 82, duration: "1.5 wks" },
      m3: { title: "Capstone Project", status: "not_started", match: 97, duration: "2 wks" },
    },
    skillData: [
      { skill: "Python", current: 78, target: 95 },
      { skill: "Statistics", current: 82, target: 90 },
      { skill: "SQL", current: 55, target: 88 },
      { skill: "Data Viz", current: 30, target: 80 },
      { skill: "Machine Learning", current: 12, target: 85 },
      { skill: "Communication", current: 60, target: 75 },
    ],
    reasoning: {
      f3: { reason: "Bridges your completed stats knowledge to real querying — required before touching messy datasets.", prereq: "Builds on Statistics 101, which you finished last week.", time: "Fits your 6 hrs/week pace in ~9 days." },
      d1: { reason: "The most-used toolkit for every project after this point.", prereq: "Pairs well with SQL for Data.", time: "Slightly heavier — plan 2.5 hrs on weekends." },
      m3: { reason: "Your capstone — ties together every skill above into one portfolio piece recruiters actually check.", prereq: "Builds on ML Fundamentals + Model Evaluation.", time: "Spread across 2 weeks, ~3 hrs/week." },
    },
  },
  java: {
    id: "java", label: "Java Backend", status: "active",
    nodeMap: {
      f1: { title: "Java Syntax & OOP", status: "in_progress", match: 90, duration: "2 wks" },
      f2: { title: "Collections & Generics", status: "not_started", match: 84, duration: "1.5 wks" },
      f3: { title: "Exception Handling", status: "not_started", match: 80, duration: "1 wk" },
      d1: { title: "Spring Boot Basics", status: "not_started", match: 92, duration: "2 wks" },
      d2: { title: "REST APIs with Spring", status: "not_started", match: 89, duration: "1.5 wks" },
      m1: { title: "JPA & Hibernate", status: "not_started", match: 86, duration: "2 wks" },
      m2: { title: "Testing with JUnit", status: "not_started", match: 78, duration: "1 wk" },
      m3: { title: "Capstone: Task Manager API", status: "not_started", match: 95, duration: "2.5 wks" },
    },
    skillData: [
      { skill: "Java Core", current: 22, target: 90 },
      { skill: "OOP Design", current: 18, target: 85 },
      { skill: "Spring Boot", current: 5, target: 80 },
      { skill: "Databases/JPA", current: 10, target: 75 },
      { skill: "Testing", current: 8, target: 70 },
      { skill: "REST APIs", current: 12, target: 85 },
    ],
    reasoning: {
      f1: { reason: "Every later node assumes solid OOP fluency — this is the highest-leverage starting point.", prereq: "No prerequisites — this is your entry point.", time: "Fits your 6 hrs/week pace in ~2 weeks." },
      d1: { reason: "Spring Boot is the industry-standard framework for almost every Java backend role posted today.", prereq: "Needs Java Syntax & OOP at a solid level.", time: "Plan 2.5 hrs on weekends." },
      m3: { reason: "Your capstone — a real REST API recruiters can actually click through.", prereq: "Builds on Spring Boot Basics + REST APIs + JPA.", time: "Spread across 2.5 weeks." },
    },
  },
  python: {
    id: "python", label: "Python Foundations", status: "completed",
    nodeMap: {
      f1: { title: "Python Syntax", status: "completed", match: 98, duration: "1 wk" },
      f2: { title: "Functions & Modules", status: "completed", match: 97, duration: "1 wk" },
      f3: { title: "File Handling", status: "completed", match: 95, duration: "0.5 wk" },
      d1: { title: "OOP in Python", status: "completed", match: 96, duration: "1 wk" },
      d2: { title: "Error Handling", status: "completed", match: 94, duration: "0.5 wk" },
      m1: { title: "Working with APIs", status: "completed", match: 93, duration: "1 wk" },
      m2: { title: "Testing Basics", status: "completed", match: 91, duration: "0.5 wk" },
      m3: { title: "Capstone: CLI Tool", status: "completed", match: 99, duration: "1 wk" },
    },
    skillData: [
      { skill: "Syntax", current: 96, target: 95 },
      { skill: "Functions", current: 94, target: 90 },
      { skill: "OOP", current: 90, target: 85 },
      { skill: "File I/O", current: 92, target: 85 },
      { skill: "Testing", current: 88, target: 80 },
      { skill: "APIs", current: 91, target: 85 },
    ],
    reasoning: {},
  },
};

// Helpers — every screen reads through these instead of module-level constants,
// so switching the Global Track Selector updates Roadmap/Radar/Sidebar/Dashboard together.
function trackCompletionPct(track) {
  const vals = Object.values(track.nodeMap);
  const done = vals.filter(n => n.status === "completed").length;
  return Math.round((done / vals.length) * 100);
}
function trackReadinessPct(track) {
  return Math.round((track.skillData.reduce((sum, s) => sum + s.current / s.target, 0) / track.skillData.length) * 100);
}
function trackHighPriorityGaps(track) {
  return track.skillData.filter(s => s.current / s.target < 0.5).length;
}
// The one "guided, not gated" hint — highest-priority not_started node. Never blocks any other node.
function suggestedNextId(track) {
  return NODE_ORDER.find(id => track.nodeMap[id].status === "not_started") || null;
}

// Onboarding quiz readiness snapshot (shown once, at first-track creation) — separate from
// per-track dashboard readiness above, but uses the same formula for consistency.
const SKILL_DATA = TRACKS.ml.skillData;
const READINESS_PCT = trackReadinessPct(TRACKS.ml);
const HIGH_PRIORITY_GAPS = trackHighPriorityGaps(TRACKS.ml);

const STEPS = [
  { screen: "landing", caption: "1/14 — Landing page: pitch ka pehla impression, 'evidence-based readiness' angle turant clear hota hai." },
  { screen: "signup", caption: "2/14 — Sign up: naya user account banata hai (Google ya email/password)." },
  { screen: "onboarding", caption: "3/14 — Onboarding (Hybrid): target role/experience/time ek quick form se, phir chhoti chat se learning style." },
  { screen: "onboarding", caption: "4/14 — Form + chat se profile extract karke ek editable summary card dikhata hai." },
  { screen: "skillcheck", quizSubmitted: false, caption: "5/14 — Roadmap dene se pehle ek quick quiz — self-declared skills ko verify karta hai, sirf trust nahi karta." },
  { screen: "skillcheck", quizSubmitted: true, caption: "6/14 — Result: ek Readiness Score aur kaunse skills verified/weak hain — evidence ke basis pe, guess ke basis pe nahi." },
  { screen: "pathselect", caption: "7/14 — Goal broad ho to AI 2 valid career paths suggest karta hai — user ek choose karta hai." },
  { screen: "roadmap", view: "flow", activeTrackId: "ml", sidebarOpen: false, nodeId: null, caption: "8/14 — Roadmap 'Flow view': sab nodes shuru se hi open hain — koi locking nahi, bas ek 'Suggested next' badge guide karta hai." },
  { screen: "roadmap", view: "flow", activeTrackId: "ml", sidebarOpen: true, nodeId: "f3", caption: "9/14 — Kisi bhi node pe click karo (aage ka bhi) — AI panel khulta hai reasoning ke saath." },
  { screen: "roadmap", view: "flow", activeTrackId: "ml", sidebarOpen: true, nodeId: "f3", toastMsg: "Got it — inserting a quick review node before your next step. Roadmap updated based on your progress ✨", caption: "10/14 — Sidebar me feedback bhi de sakte ho (Easy/Too hard/Skip) — isi se Adaptive Feedback Loop trigger hota hai, sirf future nodes badalte hain." },
  { screen: "roadmap", view: "tree", activeTrackId: "ml", sidebarOpen: false, nodeId: null, caption: "11/14 — 'Tree view': wahi roadmap category-wise branches me, expand/collapse ke saath." },
  { screen: "roadmap", view: "tree", activeTrackId: "java", sidebarOpen: false, nodeId: null, caption: "12/14 — Global Track Selector se switch karo — 'Java Backend' apna alag, independent roadmap hai, ML wala touch nahi hota." },
  { screen: "dashboard", activeTrackId: "java", sidebarOpen: false, nodeId: null, caption: "13/14 — Dashboard bhi turant selected track pe switch ho jaata hai — readiness, radar, sab Java ke liye." },
  { screen: "dashboard", activeTrackId: "ml", sidebarOpen: false, nodeId: null, caption: "14/14 — Wapas ML pe switch karo — Selector 'Active' aur 'Completed' tracks alag group me dikhata hai (Python Foundations 100% ho chuka hai)." },
];

function statusStyle(status) {
  if (status === "completed") return { bg: "var(--success)" };
  if (status === "in_progress") return { bg: "var(--accent)" };
  return { bg: "var(--surface-2)" };
}
function matchColor(m) {
  if (m >= 90) return "var(--success)";
  if (m >= 70) return "var(--accent)";
  return "var(--warning)";
}

/* ---------------- SHARED UI ---------------- */

/* ---------------- LANDING PAGE ---------------- */

function LandingNav({ goto }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 sticky top-0 z-20" style={{ background: "rgba(244,245,250,0.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
          <Compass size={17} color="#fff" />
        </div>
        <span className="font-display text-lg tracking-tight" style={{ color: "var(--text)" }}>Waypoint</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => goto("login")} className="text-sm font-medium px-4 py-2" style={{ color: "var(--text)" }}>Log in</button>
        <button onClick={() => goto("signup")} className="text-sm font-medium px-4 py-2 rounded-full" style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow-sm)" }}>Get started free</button>
      </div>
    </div>
  );
}

function Landing({ goto }) {
  const steps = [
    { icon: ShieldCheck, title: "Verify", text: "A quick skill check replaces guesswork with real evidence." },
    { icon: Target, title: "Diagnose", text: "See exactly where you stand against your target role." },
    { icon: Layers, title: "Build & Prove", text: "A Learn → Build → Prove path closes your real gaps, in order." },
  ];
  const features = [
    { icon: ShieldCheck, title: "Evidence-backed skills", text: "Not self-declared. Every skill is scored from a real assessment, not a checkbox." },
    { icon: Route, title: "Gap-based roadmap", text: "Your path is built around what's actually blocking your target role — not a generic course list." },
    { icon: Sparkles, title: "AI explanations", text: "Every recommendation comes with a plain-language reason, not a black box." },
    { icon: LayoutDashboard, title: "Readiness dashboard", text: "One number that tells you — and recruiters — how job-ready you really are." },
  ];
  return (
    <div style={{ background: "var(--bg)" }}>
      <LandingNav goto={goto} />

      {/* Hero */}
      <div className="mx-auto px-6 pt-20 pb-16 text-center" style={{ maxWidth: 780 }}>
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6" style={{ background: "var(--accent-soft)" }}>
          <Sparkles size={13} style={{ color: "var(--accent)" }} />
          <span className="text-[11px] font-mono" style={{ color: "var(--accent)" }}>EVIDENCE-BASED, NOT SELF-DECLARED</span>
        </div>
        <h1 className="font-display text-5xl leading-tight mb-5" style={{ color: "var(--text)" }}>
          Stop guessing what to learn.<br />Find out if you're <span style={{ color: "var(--accent)" }}>actually ready.</span>
        </h1>
        <p className="text-base mb-8" style={{ color: "var(--muted)" }}>
          Waypoint verifies your skills, measures the gap to your target role, and builds a Learn → Build → Prove
          path to close it — not just another course list.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => goto("signup")} className="flex items-center gap-2 rounded-full px-6 py-3 font-medium" style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow)" }}>
            Get started free <ArrowRight size={16} />
          </button>
          <button onClick={() => goto("login")} className="rounded-full px-6 py-3 font-medium" style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
            I already have an account
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: 900 }}>
        <div className="rounded-2xl p-6 grid grid-cols-4 gap-4 text-center" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>
          {[["4,200+", "Skills verified"], ["180+", "Curated resources"], ["61%", "Avg. readiness at signup"], ["9.4/10", "Avg. clarity rating"]].map(([v, l]) => (
            <div key={l}>
              <div className="font-display text-2xl" style={{ color: "var(--accent)" }}>{v}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: 900 }}>
        <h2 className="font-display text-2xl text-center mb-8" style={{ color: "var(--text)" }}>How it works</h2>
        <div className="grid grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--accent-soft)" }}>
                <s.icon size={18} style={{ color: "var(--accent)" }} />
              </div>
              <div className="text-[11px] font-mono mb-1" style={{ color: "var(--muted)" }}>STEP {i + 1}</div>
              <h3 className="font-display text-base mb-2" style={{ color: "var(--text)" }}>{s.title}</h3>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: 900 }}>
        <div className="grid grid-cols-2 gap-5">
          {features.map(f => (
            <div key={f.title} className="rounded-2xl p-5 flex gap-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--success-soft)" }}>
                <f.icon size={16} style={{ color: "var(--success)" }} />
              </div>
              <div>
                <h3 className="font-display text-sm mb-1" style={{ color: "var(--text)" }}>{f.title}</h3>
                <p className="text-sm" style={{ color: "var(--muted)" }}>{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: 700 }}>
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex justify-center gap-0.5 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="var(--warning)" style={{ color: "var(--warning)" }} />)}
          </div>
          <p className="font-display text-lg mb-4" style={{ color: "var(--text)" }}>
            "I thought I knew SQL. The skill check showed me exactly where I was weak — and the roadmap fixed it in three weeks, not three months."
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>— Early beta user, aspiring Data Analyst</p>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mx-auto px-6 pb-20 text-center" style={{ maxWidth: 700 }}>
        <div className="rounded-2xl p-10" style={{ background: "var(--accent)" }}>
          <h2 className="font-display text-2xl mb-3" style={{ color: "#fff" }}>Ready to see where you stand?</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.85)" }}>Free skill check. Takes under 3 minutes.</p>
          <button onClick={() => goto("signup")} className="rounded-full px-6 py-3 font-medium" style={{ background: "#fff", color: "var(--accent)" }}>
            Get started free
          </button>
        </div>
      </div>

      <div className="text-center pb-8 text-xs" style={{ color: "var(--muted)" }}>© 2026 Waypoint · Built for HCL Amplified</div>
    </div>
  );
}

/* ---------------- AUTH: SIGN UP / LOG IN ---------------- */

function AuthCard({ title, subtitle, goto, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full" style={{ maxWidth: 400 }}>
        <button onClick={() => goto("landing")} className="flex items-center gap-2 justify-center mb-6 mx-auto">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Compass size={17} color="#fff" />
          </div>
          <span className="font-display text-lg" style={{ color: "var(--text)" }}>Waypoint</span>
        </button>
        <div className="rounded-2xl p-7" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
          <h1 className="font-display text-xl mb-1" style={{ color: "var(--text)" }}>{title}</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function FieldInput({ icon: Icon, type, placeholder, value, onChange, error, toggle }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: "var(--surface-2)", border: `1px solid ${error ? "#EF4444" : "var(--border)"}` }}>
        <Icon size={15} style={{ color: "var(--muted)" }} />
        <input type={type} placeholder={placeholder} value={value} onChange={onChange}
          className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text)" }} />
        {toggle}
      </div>
      {error && <div className="text-[11px] mt-1" style={{ color: "#EF4444" }}>{error}</div>}
    </div>
  );
}

function SignUp({ goto }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwValid = password.length >= 6;
  const formValid = name.trim().length > 1 && emailValid && pwValid;

  const submit = () => {
    setTouched(true);
    if (!formValid) return;
    setLoading(true);
    setTimeout(() => goto("onboarding"), 900); // simulated account creation
  };

  return (
    <AuthCard title="Create your account" subtitle="Free skill check, no credit card needed." goto={goto}>
      <button className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium mb-4" style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}>
        <Chrome size={16} /> Sign up with Google
      </button>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>OR</span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>
      <FieldInput icon={ShieldCheck} type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
        error={touched && name.trim().length <= 1 ? "Enter your name" : null} />
      <FieldInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
        error={touched && !emailValid ? "Enter a valid email" : null} />
      <FieldInput icon={Lock} type={showPw ? "text" : "password"} placeholder="Password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)}
        error={touched && !pwValid ? "Password must be at least 6 characters" : null}
        toggle={<button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15} style={{ color: "var(--muted)" }} /> : <Eye size={15} style={{ color: "var(--muted)" }} />}</button>} />
      <button onClick={submit} disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-medium mt-2"
        style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Creating your account..." : <>Create account <ArrowRight size={16} /></>}
      </button>
      <p className="text-center text-xs mt-4" style={{ color: "var(--muted)" }}>
        Already have an account? <button onClick={() => goto("login")} className="font-medium" style={{ color: "var(--accent)" }}>Log in</button>
      </p>
    </AuthCard>
  );
}

function Login({ goto }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wrongPw, setWrongPw] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const formValid = emailValid && password.length > 0;

  const submit = () => {
    setTouched(true);
    setWrongPw(false);
    if (!formValid) return;
    setLoading(true);
    // demo-realism: a short password gets rejected once, like a real auth check would
    setTimeout(() => {
      if (password.length < 6) { setLoading(false); setWrongPw(true); return; }
      goto("dashboard"); // returning user lands back on their dashboard, not onboarding
    }, 900);
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to pick up where you left off." goto={goto}>
      <button className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium mb-4" style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}>
        <Chrome size={16} /> Log in with Google
      </button>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>OR</span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>
      <FieldInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
        error={touched && !emailValid ? "Enter a valid email" : null} />
      <FieldInput icon={Lock} type={showPw ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
        error={(touched && password.length === 0) ? "Enter your password" : (wrongPw ? "Incorrect password — try again" : null)}
        toggle={<button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15} style={{ color: "var(--muted)" }} /> : <Eye size={15} style={{ color: "var(--muted)" }} />}</button>} />
      <div className="text-right mb-2">
        <button className="text-xs" style={{ color: "var(--accent)" }}>Forgot password?</button>
      </div>
      <button onClick={submit} disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-medium mt-1"
        style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Logging in..." : <>Log in <ArrowRight size={16} /></>}
      </button>
      <p className="text-center text-xs mt-4" style={{ color: "var(--muted)" }}>
        New here? <button onClick={() => goto("signup")} className="font-medium" style={{ color: "var(--accent)" }}>Create an account</button>
      </p>
    </AuthCard>
  );
}

/* ---------------- SHARED UI (APP SHELL) ---------------- */

function TopNav({ screen, goto, demoOn, startDemo, stopDemo }) {
  const tabs = [
    { id: "onboarding", label: "Onboarding", icon: MessageCircle },
    { id: "pathselect", label: "Choose Path", icon: GitBranch },
    { id: "roadmap", label: "Roadmap", icon: Route },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];
  return (
    <div className="flex items-center justify-between px-8 py-4 sticky top-0 z-20" style={{ background: "rgba(244,245,250,0.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
          <Compass size={17} color="#fff" />
        </div>
        <span className="font-display text-lg tracking-tight" style={{ color: "var(--text)" }}>Waypoint</span>
        <span className="ml-2 text-[11px] px-2 py-1 rounded-full font-mono" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>prototype v3 · desktop</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = screen === t.id;
            return (
              <button key={t.id} onClick={() => goto(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{ background: active ? "var(--accent)" : "transparent", color: active ? "#fff" : "var(--muted)" }}>
                <Icon size={14} /><span>{t.label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={demoOn ? stopDemo : startDemo}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: demoOn ? "var(--warning-soft)" : "var(--accent-soft)", color: demoOn ? "var(--warning)" : "var(--accent)", border: `1px solid ${demoOn ? "var(--warning)" : "var(--accent)"}` }}>
          {demoOn ? <><StopCircle size={15} /> Exit demo</> : <><PlayCircle size={15} /> Guided demo</>}
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ role, text }) {
  const isAi = role === "ai";
  return (
    <div className={`flex items-start gap-2 ${isAi ? "" : "justify-end"}`}>
      {isAi && <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--accent-soft)" }}><Sparkles size={12} style={{ color: "var(--accent)" }} /></div>}
      <div className="rounded-2xl px-4 py-2.5 text-sm max-w-[80%]" style={{ background: isAi ? "var(--surface)" : "var(--accent)", color: isAi ? "var(--text)" : "#fff", border: isAi ? "1px solid var(--border)" : "none", boxShadow: "var(--shadow-sm)" }}>{text}</div>
    </div>
  );
}
function InfoRow({ icon, label, text }) {
  return (
    <div className="flex gap-2.5">
      <span className="text-base leading-none mt-0.5">{icon}</span>
      <div>
        <div className="text-[11px] font-mono mb-0.5" style={{ color: "var(--muted)" }}>{label.toUpperCase()}</div>
        <div className="text-sm" style={{ color: "var(--text)" }}>{text}</div>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose, nodeId, track, onFeedback }) {
  const node = nodeId ? track.nodeMap[nodeId] : null;
  const info = nodeId ? track.reasoning[nodeId] : null;
  return (
    <div className="fixed top-0 right-0 h-full w-96 z-30 transition-transform duration-300"
      style={{ transform: open ? "translateX(0)" : "translateX(100%)", background: "var(--surface)", borderLeft: "1px solid var(--border)", boxShadow: "-16px 0 40px rgba(27,29,42,0.10)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2"><Sparkles size={16} style={{ color: "var(--accent)" }} /><span className="font-display text-sm" style={{ color: "var(--text)" }}>AI Guide</span></div>
        <button onClick={onClose}><X size={18} style={{ color: "var(--muted)" }} /></button>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto" style={{ height: "calc(100% - 205px)" }}>
        {node ? (
          <>
            <div className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>ASKED ABOUT</div>
            <div className="rounded-xl px-4 py-2 text-sm inline-block" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>Why is "{node.title}" recommended?</div>
            <div className="space-y-3 pt-2">
              <InfoRow icon="📌" label="Reason" text={info?.reason || "Fits directly into your chosen path's sequence."} />
              <InfoRow icon="🔗" label="Prerequisite" text={info?.prereq || "No blocking prerequisites remaining."} />
              <InfoRow icon="⏱️" label="Time fit" text={info?.time || `Estimated ${node.duration} at your current pace.`} />
            </div>
            <div className="rounded-xl p-4 mt-4" style={{ background: "var(--surface-2)" }}>
              <div className="text-[11px] font-mono mb-3" style={{ color: "var(--muted)" }}>MATCH SCORE — {node.match}%</div>
              {[["Goal alignment", 95], ["Skill readiness", 85], ["Time fit", 90]].map(([l,v]) => (
                <div key={l} className="mb-2">
                  <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text)" }}><span>{l}</span><span className="font-mono">{v}%</span></div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}><div className="h-1.5 rounded-full" style={{ width: `${v}%`, background: "var(--accent)" }} /></div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--surface-2)" }}>
              <div className="text-[11px] font-mono mb-3" style={{ color: "var(--muted)" }}>HOW DID THIS GO? (ADAPTS YOUR PATH)</div>
              <div className="flex gap-2">
                <button onClick={() => onFeedback("easy")} className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <ThumbsUp size={15} style={{ color: "var(--success)" }} /><span className="text-[10px] font-medium" style={{ color: "var(--text)" }}>Easy</span>
                </button>
                <button onClick={() => onFeedback("hard")} className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <ThumbsDown size={15} style={{ color: "var(--warning)" }} /><span className="text-[10px] font-medium" style={{ color: "var(--text)" }}>Too hard</span>
                </button>
                <button onClick={() => onFeedback("skip")} className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <SkipForward size={15} style={{ color: "var(--muted)" }} /><span className="text-[10px] font-medium" style={{ color: "var(--text)" }}>Skip</span>
                </button>
              </div>
            </div>
          </>
        ) : <ChatBubble role="ai" text="Hey, I'm your guide for this path. Click any node, or ask me anything." />}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t flex items-center gap-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <input disabled placeholder="Ask a follow-up..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--muted)" }} />
        <Send size={16} style={{ color: "var(--accent)" }} />
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed top-6 left-1/2 z-50 flex items-center gap-2.5 rounded-full pl-3 pr-5 py-2.5" style={{ transform: "translateX(-50%)", background: "var(--text)", boxShadow: "0 16px 40px rgba(27,29,42,0.35)" }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}><BellRing size={13} color="#fff" /></div>
      <span className="text-sm" style={{ color: "#fff" }}>{message}</span>
    </div>
  );
}

/* ---------------- ONBOARDING / PATHSELECT ---------------- */

function Onboarding({ goto }) {
  return (
    <div className="mx-auto px-4 py-10" style={{ maxWidth: 680 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 flex items-center justify-center rounded-full" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
          <span className="font-mono text-xs font-semibold" style={{ color: "var(--success)" }}>100%</span>
        </div>
        <div><h1 className="font-display text-2xl" style={{ color: "var(--text)" }}>Tell me where you're headed</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Profile complete — here's what I picked up</p></div>
      </div>
      <div className="space-y-3 mb-6">
        <ChatBubble role="ai" text="Hey! What are you hoping to learn, and what's the end goal?" />
        <ChatBubble role="user" text="I want to get into data science. I know basic Python but nothing about ML." />
        <ChatBubble role="ai" text="Got it. How much time can you realistically give this per week?" />
        <div className="flex gap-2 flex-wrap pl-9 mb-1">
          {["30 min/day", "1 hr/day", "6+ hrs/week"].map(c => <span key={c} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>{c}</span>)}
        </div>
        <ChatBubble role="user" text="Around 6 hours a week, mostly weekends." />
        <ChatBubble role="ai" text="Perfect. Do you learn better from projects or structured courses?" />
        <ChatBubble role="user" text="Projects, definitely." />
      </div>
      <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm tracking-wide" style={{ color: "var(--accent)" }}>PROFILE SUMMARY</h3>
          <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--muted)" }}><Pencil size={12} /> Edit</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[["Target role", "Data Science (job-ready)"], ["Self-rated level", "Beginner → some Python"], ["Time budget", "6 hrs / week"], ["Learning style", "Project-first"]].map(([k,v]) => (
            <div key={k}><div className="text-[11px] font-mono mb-0.5" style={{ color: "var(--muted)" }}>{k.toUpperCase()}</div><div style={{ color: "var(--text)" }}>{v}</div></div>
          ))}
        </div>
      </div>
      <button onClick={() => goto("skillcheck")} className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-medium" style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow)" }}>
        Continue to quick skill check <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* ---------------- SKILL CHECK (quiz-based evidence) ---------------- */

function SkillCheck({ goto, demoSubmitted }) {
  const [answers, setAnswers] = useState({});
  const [submittedLocal, setSubmittedLocal] = useState(false);
  const submitted = demoSubmitted !== undefined ? demoSubmitted : submittedLocal;
  const answeredCount = Object.keys(answers).length;

  if (submitted) {
    return (
      <div className="mx-auto px-4 py-10" style={{ maxWidth: 680 }}>
        <div className="flex items-center gap-2 mb-1"><Sparkles size={16} style={{ color: "var(--accent)" }} /><span className="text-[11px] font-mono" style={{ color: "var(--accent)" }}>EVIDENCE-BASED, NOT SELF-DECLARED</span></div>
        <h1 className="font-display text-2xl mb-6" style={{ color: "var(--text)" }}>Here's where you actually stand</h1>
        <div className="rounded-2xl p-6 mb-5 flex items-center gap-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1px solid var(--accent)" }}>
          <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center shrink-0" style={{ background: "var(--accent-soft)", border: "3px solid var(--accent)" }}>
            <span className="font-display text-2xl" style={{ color: "var(--accent)" }}>{READINESS_PCT}%</span>
            <span className="text-[9px] font-mono" style={{ color: "var(--accent)" }}>READY</span>
          </div>
          <div>
            <h3 className="font-display text-sm mb-1" style={{ color: "var(--text)" }}>Career Readiness — Data Science</h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Based on your quiz answers plus completed work so far. This isn't a guess — it updates every time you add new evidence.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SKILL_DATA.map(s => {
            const ratio = s.current / s.target;
            const status = ratio >= 0.75 ? "Verified" : ratio >= 0.45 ? "Developing" : "Weak spot";
            const color = ratio >= 0.75 ? "var(--success)" : ratio >= 0.45 ? "var(--warning)" : "#EF4444";
            return (
              <div key={s.skill} className="rounded-xl p-3 flex items-center justify-between" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div><div className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{s.skill}</div><div className="text-[10px] font-mono" style={{ color }}>{status}</div></div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full" style={{ color, background: "var(--surface-2)" }}>{s.current}%</span>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          🎯 {HIGH_PRIORITY_GAPS} high-priority gaps found. Your path below is built to close these first — not just "next course in the list."
        </div>
        <button onClick={() => goto("pathselect")} className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-medium" style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow)" }}>
          See my path options <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-10" style={{ maxWidth: 680 }}>
      <div className="flex items-center gap-2 mb-1"><Sparkles size={16} style={{ color: "var(--accent)" }} /><span className="text-[11px] font-mono" style={{ color: "var(--accent)" }}>QUICK SKILL CHECK</span></div>
      <h1 className="font-display text-2xl mb-1" style={{ color: "var(--text)" }}>Let's verify, not just take your word for it</h1>
      <p className="text-sm mb-7" style={{ color: "var(--muted)" }}>3 quick questions — this is how we tell "verified" skills apart from "I think I know this."</p>
      <div className="space-y-5 mb-6">
        {QUIZ_QUESTIONS.map((item, qi) => (
          <div key={qi} className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <p className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>{qi + 1}. {item.q}</p>
            <div className="flex gap-2 flex-wrap">
              {item.options.map(opt => {
                const active = answers[qi] === opt;
                return (
                  <button key={opt} onClick={() => setAnswers({ ...answers, [qi]: opt })}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: active ? "var(--accent)" : "var(--surface-2)", color: active ? "#fff" : "var(--text)", border: `1px solid ${active ? "var(--accent)" : "var(--border)"}` }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setSubmittedLocal(true)} disabled={answeredCount === 0}
        className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-medium"
        style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow)", opacity: answeredCount === 0 ? 0.5 : 1 }}>
        See my readiness score <ArrowRight size={16} />
      </button>
    </div>
  );
}

function PathSelect({ goto }) {
  const paths = [
    { name: "ML-Focused Track", duration: "14 weeks", skills: ["Python", "ML Theory", "Deep Learning"], desc: "For roles centered on building and tuning models." },
    { name: "Analyst-Focused Track", duration: "10 weeks", skills: ["SQL", "Visualization", "Statistics"], desc: "For roles centered on insights, dashboards and reporting." },
  ];
  return (
    <div className="mx-auto px-4 py-10" style={{ maxWidth: 900 }}>
      <h1 className="font-display text-2xl mb-1" style={{ color: "var(--text)" }}>"Data science" covers a lot of ground</h1>
      <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Here are two directions that fit your profile.</p>
      <div className="grid md:grid-cols-2 gap-5">
        {paths.map((p, i) => (
          <div key={p.name} className="rounded-2xl p-6 flex flex-col" style={{ background: "var(--surface)", boxShadow: i === 0 ? "var(--shadow)" : "var(--shadow-sm)", border: `1px solid ${i === 0 ? "var(--accent)" : "var(--border)"}` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg" style={{ color: "var(--text)" }}>{p.name}</h3>
              <span className="text-xs font-mono px-2 py-1 rounded-full" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>{p.duration}</span>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{p.desc}</p>
            <div className="flex gap-2 flex-wrap mb-5">{p.skills.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "var(--success-soft)", color: "var(--success)" }}>{s}</span>)}</div>
            <button onClick={() => goto("roadmap")} className="mt-auto w-full rounded-full py-2.5 font-medium text-sm" style={{ background: i === 0 ? "var(--accent)" : "var(--surface-2)", color: i === 0 ? "#fff" : "var(--text)" }}>Choose this path</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ROADMAP: FLOW (real connected flowchart) ---------------- */

function FlowNode({ id, node, suggested, onOpen }) {
  const p = POS[id];
  const s = statusStyle(node.status);
  return (
    <button onClick={() => onOpen(id)} className="absolute rounded-2xl flex flex-col justify-between p-3 text-left transition-transform hover:-translate-y-0.5"
      style={{ left: p.x, top: p.y, width: NW, height: NH, background: "var(--surface)", border: `1.5px solid ${node.status === "in_progress" ? "var(--accent)" : suggested ? "var(--warning)" : "var(--border)"}`, boxShadow: node.status === "in_progress" ? "0 8px 22px rgba(91,95,239,0.20)" : "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between">
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: s.bg }}>
          {node.status === "completed" && <Check size={13} color="#fff" />}
          {node.status === "in_progress" && <span className="w-2 h-2 rounded-full bg-white" />}
        </div>
        {suggested
          ? <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full" style={{ color: "var(--warning)", background: "var(--surface-2)" }}>SUGGESTED</span>
          : <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full" style={{ color: matchColor(node.match), background: "var(--surface-2)" }}>{node.match}%</span>}
      </div>
      <div><div className="text-[12.5px] font-semibold leading-tight" style={{ color: "var(--text)" }}>{node.title}</div>
      <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--muted)" }}>{node.duration}</div></div>
    </button>
  );
}

function RoadmapFlow({ track, onOpen }) {
  const centerOf = (id) => ({ x: POS[id].x + NW / 2, y: POS[id].y + NH / 2 });
  const suggested = suggestedNextId(track);

  return (
    <div className="rounded-2xl p-6 overflow-x-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
      <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
        <svg className="absolute inset-0" width={CANVAS_W} height={CANVAS_H}>
          <defs>
            <marker id="arrowMuted" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--border)" /></marker>
            <marker id="arrowDone" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--success)" /></marker>
          </defs>
          {EDGES.map(([a, b]) => {
            const done = track.nodeMap[a].status === "completed";
            const c1 = centerOf(a), c2 = centerOf(b);
            const dx = c2.x - c1.x, dy = c2.y - c1.y;
            const horiz = c1.y === c2.y;
            const p1 = horiz ? { x: c1.x + (dx > 0 ? NW/2 : -NW/2), y: c1.y } : { x: c1.x, y: c1.y + (dy > 0 ? NH/2 : -NH/2) };
            const p2 = horiz ? { x: c2.x - (dx > 0 ? NW/2 : -NW/2), y: c2.y } : { x: c2.x, y: c2.y - (dy > 0 ? NH/2 : -NH/2) };
            return (
              <line key={a + b} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={done ? "var(--success)" : "var(--border)"} strokeWidth={done ? 2.5 : 2}
                markerEnd={`url(#${done ? "arrowDone" : "arrowMuted"})`} />
            );
          })}
        </svg>
        {NODE_ORDER.map(id => <FlowNode key={id} id={id} node={track.nodeMap[id]} suggested={id === suggested} onOpen={onOpen} />)}
      </div>
      <p className="text-xs mt-4 pt-4" style={{ color: "var(--muted)", borderTop: "1px dashed var(--border)" }}>💡 Every step is open — click any node any time. The amber "Suggested" badge just points to your highest-impact next move.</p>
    </div>
  );
}

/* ---------------- ROADMAP: TREE (real expanding branches) ---------------- */

function TreeBranch({ branch, track, suggested, onOpen }) {
  const [open, setOpen] = useState(branch.defaultOpen);
  return (
    <div className="relative">
      <div className="absolute -left-6 top-5 w-6 h-0.5" style={{ background: "var(--border)" }} />
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 mb-2">
        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: branch.color }} />
        <span className="font-display text-sm" style={{ color: "var(--text)" }}>{branch.label}</span>
        <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>({branch.children.length})</span>
        <ChevronDown size={14} style={{ color: "var(--muted)", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .2s" }} />
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .28s ease" }}>
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div className="space-y-2 pb-5 pl-2" style={{ borderLeft: `2px solid ${branch.color}33`, marginLeft: 6 }}>
            {branch.children.map(id => {
              const n = track.nodeMap[id];
              const s = statusStyle(n.status);
              return (
                <button key={id} onClick={() => onOpen(id)} className="flex items-center gap-3 w-full text-left rounded-xl p-2.5 ml-3 transition-transform hover:-translate-y-0.5" style={{ background: "var(--surface)", border: `1px solid ${id === suggested ? "var(--warning)" : "var(--border)"}`, boxShadow: "var(--shadow-sm)", width: "calc(100% - 12px)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                    {n.status === "completed" && <Check size={12} color="#fff" />}
                    {n.status === "in_progress" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-medium truncate" style={{ color: "var(--text)" }}>{n.title}</div>
                  <div className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{n.duration}</div></div>
                  {id === suggested
                    ? <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ color: "var(--warning)", background: "var(--surface-2)" }}>SUGGESTED</span>
                    : <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ color: matchColor(n.match), background: "var(--surface-2)" }}>{n.match}%</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadmapTree({ track, onOpen }) {
  const suggested = suggestedNextId(track);
  return (
    <div className="rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
      <div className="flex items-stretch gap-8">
        <div className="self-center shrink-0 rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--accent-soft)", width: 220 }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}><Compass size={16} color="#fff" /></div>
          <div><div className="font-display text-sm leading-tight" style={{ color: "var(--text)" }}>{track.label} Path</div><div className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>3 branches</div></div>
        </div>
        <div className="w-8 self-center shrink-0 h-0.5" style={{ background: "var(--border)" }} />
        <div className="flex-1 flex flex-col gap-6 pl-6" style={{ borderLeft: "2px solid var(--border)" }}>
          {TREE_BRANCHES.map(b => <TreeBranch key={b.id} branch={b} track={track} suggested={suggested} onOpen={onOpen} />)}
        </div>
      </div>
    </div>
  );
}

function Roadmap({ view, setView, track, onOpen, activeTrackId, setActiveTrackId, goto }) {
  return (
    <div className="mx-auto px-4 py-8" style={{ maxWidth: 1200 }}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div><h1 className="font-display text-2xl" style={{ color: "var(--text)" }}>Your Learning Path</h1><p className="text-sm" style={{ color: "var(--muted)" }}>{track.label} Track</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          <TrackSelector activeTrackId={activeTrackId} setActiveTrackId={setActiveTrackId} goto={goto} />
          <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--surface-2)" }}>
            <button onClick={() => setView("flow")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: view === "flow" ? "var(--surface)" : "transparent", color: view === "flow" ? "var(--text)" : "var(--muted)", boxShadow: view === "flow" ? "var(--shadow-sm)" : "none" }}><Route size={13} /> Flow</button>
            <button onClick={() => setView("tree")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: view === "tree" ? "var(--surface)" : "transparent", color: view === "tree" ? "var(--text)" : "var(--muted)", boxShadow: view === "tree" ? "var(--shadow-sm)" : "none" }}><GitFork size={13} /> Tree</button>
          </div>
        </div>
      </div>
      {view === "flow" ? <RoadmapFlow track={track} onOpen={onOpen} /> : <RoadmapTree track={track} onOpen={onOpen} />}
    </div>
  );
}

/* ---------------- GLOBAL TRACK SELECTOR ---------------- */

function TrackSelector({ activeTrackId, setActiveTrackId, goto }) {
  const [open, setOpen] = useState(false);
  const active = Object.values(TRACKS).filter(t => t.status === "active");
  const completed = Object.values(TRACKS).filter(t => t.status === "completed");
  const current = TRACKS[activeTrackId];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}><Layers size={12} color="#fff" /></div>
        <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{current.label}</span>
        <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{trackCompletionPct(current)}%</span>
        <ChevronDown size={13} style={{ color: "var(--muted)" }} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 rounded-2xl p-2 z-40" style={{ width: 260, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="text-[10px] font-mono px-2 py-1" style={{ color: "var(--muted)" }}>ACTIVE</div>
          {active.map(t => (
            <button key={t.id} onClick={() => { setActiveTrackId(t.id); setOpen(false); }}
              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left"
              style={{ background: t.id === activeTrackId ? "var(--accent-soft)" : "transparent" }}>
              <div><div className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{t.label}</div><div className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>Readiness {trackReadinessPct(t)}%</div></div>
              <span className="text-[10px] font-mono font-bold" style={{ color: "var(--accent)" }}>{trackCompletionPct(t)}%</span>
            </button>
          ))}
          {completed.length > 0 && <>
            <div className="text-[10px] font-mono px-2 py-1 mt-1" style={{ color: "var(--muted)" }}>COMPLETED</div>
            {completed.map(t => (
              <button key={t.id} onClick={() => { setActiveTrackId(t.id); setOpen(false); }}
                className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left"
                style={{ background: t.id === activeTrackId ? "var(--accent-soft)" : "transparent" }}>
                <div className="flex items-center gap-1.5"><CheckCircle2 size={13} style={{ color: "var(--success)" }} /><span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{t.label}</span></div>
                <span className="text-[10px] font-mono font-bold" style={{ color: "var(--success)" }}>100%</span>
              </button>
            ))}
          </>}
          <div className="pt-1 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={() => { setOpen(false); goto("addskill"); }} className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left" style={{ color: "var(--accent)" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-soft)" }}>+</span>
              <span className="text-[13px] font-medium">Add a new skill</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${accent}18` }}><Icon size={16} style={{ color: accent }} /></div>
      <div><div className="font-display text-lg leading-tight" style={{ color: "var(--text)" }}>{value}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div></div>
    </div>
  );
}

function Dashboard({ goto, track, activeTrackId, setActiveTrackId }) {
  const [insightIdx, setInsightIdx] = useState(0);
  const insight = INSIGHTS[insightIdx];
  const readiness = trackReadinessPct(track);
  const gaps = trackHighPriorityGaps(track);
  const verifiedCount = track.skillData.filter(s => s.current / s.target >= 0.75).length;
  const completion = trackCompletionPct(track);
  const suggested = suggestedNextId(track);
  const suggestedNode = suggested ? track.nodeMap[suggested] : null;

  return (
    <div className="mx-auto px-4 py-8 space-y-6" style={{ maxWidth: 1200 }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display text-2xl" style={{ color: "var(--text)" }}>Your Progress</h1><p className="text-sm" style={{ color: "var(--muted)" }}>{track.label} Track</p></div>
        <TrackSelector activeTrackId={activeTrackId} setActiveTrackId={setActiveTrackId} goto={goto} />
      </div>

      <div className="rounded-2xl p-5 flex items-center gap-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow)", border: "1px solid var(--accent)" }}>
        <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center shrink-0" style={{ background: "var(--accent-soft)", border: "3px solid var(--accent)" }}>
          <span className="font-display text-xl" style={{ color: "var(--accent)" }}>{readiness}%</span>
          <span className="text-[8px] font-mono" style={{ color: "var(--accent)" }}>READY</span>
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-mono mb-1" style={{ color: "var(--accent)" }}>CAREER READINESS — {track.label.toUpperCase()}</div>
          <p className="text-sm" style={{ color: "var(--text)" }}>Evidence-based, updates as you complete quizzes, projects and milestones — not just course completion %.</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
          <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>{gaps} high-priority gaps</span>
          <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>{verifiedCount} skills verified</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={Flame} label="Day streak" value="12" accent="#D97706" />
        <StatCard icon={Zap} label="XP earned" value="2,340" accent="#0EA5A4" />
        <StatCard icon={TrendingUp} label="Path complete" value={`${completion}%`} accent="#5B5FEF" />
        <StatCard icon={Clock} label="Est. time left" value="9 wks" accent="#6B6F87" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div className="text-[11px] font-mono mb-3" style={{ color: "var(--muted)" }}>SUGGESTED NEXT</div>
          {suggestedNode ? <>
            <h3 className="font-display text-lg mb-1" style={{ color: "var(--text)" }}>{suggestedNode.title}</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Not started · {suggestedNode.match}% match · ~{suggestedNode.duration} left</p>
          </> : <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>All nodes underway — great pace!</p>}
          <button onClick={() => goto("roadmap")} className="mt-auto flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Continue <ArrowRight size={14} /></button>
        </div>
        <div className="col-span-2 rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div className="text-[11px] font-mono mb-2" style={{ color: "var(--muted)" }}>{track.label.toUpperCase()} FOCUS — SKILL GAP (CURRENT VS TARGET)</div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <RadarChart data={track.skillData}>
                <PolarGrid stroke="var(--border)" /><PolarAngleAxis dataKey="skill" tick={{ fill: "#6B6F87", fontSize: 11 }} />
                <Radar name="Current" dataKey="current" stroke="#0EA5A4" fill="#0EA5A4" fillOpacity={0.3} />
                <Radar name="Target" dataKey="target" stroke="#5B5FEF" fill="#5B5FEF" fillOpacity={0.12} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#6B6F87" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div className="text-[11px] font-mono mb-3" style={{ color: "var(--muted)" }}>MILESTONE TIMELINE</div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {TREE_BRANCHES.map((b, i) => {
              const branchDone = b.children.every(id => track.nodeMap[id].status === "completed");
              const branchStarted = b.children.some(id => track.nodeMap[id].status !== "not_started");
              return (
                <div key={b.id} className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: branchDone ? "var(--success)" : branchStarted ? "var(--accent)" : "var(--surface-2)", border: branchDone || branchStarted ? "none" : "1px solid var(--border)" }}>
                      {branchDone ? <Check size={14} color="#fff" /> : <span className="text-[10px] font-mono font-bold" style={{ color: branchStarted ? "#fff" : "var(--muted)" }}>{i + 1}</span>}
                    </div>
                    <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "var(--text)" }}>{b.label}</span>
                  </div>
                  {i < TREE_BRANCHES.length - 1 && <div className="w-10 h-0.5" style={{ background: "var(--border)" }} />}
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: "var(--surface)", border: "1px solid var(--accent)", boxShadow: "var(--shadow)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono" style={{ color: "var(--accent)" }}>AI INSIGHT</span>
            <div className="flex gap-1">{INSIGHTS.map((_,i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i===insightIdx ? "var(--accent)" : "var(--border)" }} />)}</div>
          </div>
          <div className="text-2xl mb-2">{insight.icon}</div>
          <p className="text-sm mb-4" style={{ color: "var(--text)" }}>{insight.text}</p>
          <button className="rounded-full py-2 text-xs font-medium mb-3" style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>{insight.action}</button>
          <div className="flex justify-between mt-auto">
            <button onClick={() => setInsightIdx((insightIdx - 1 + INSIGHTS.length) % INSIGHTS.length)}><ChevronLeft size={16} style={{ color: "var(--muted)" }} /></button>
            <button onClick={() => setInsightIdx((insightIdx + 1) % INSIGHTS.length)}><ChevronRight size={16} style={{ color: "var(--muted)" }} /></button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "var(--surface-2)", border: "1px dashed var(--border)" }}>
        <div className="text-[11px] font-mono mb-3" style={{ color: "var(--muted)" }}>🔭 ON THE ROADMAP — COMING SOON</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { t: "Debugging-lab evidence", d: "Prove skills by fixing real broken code, not just quizzes." },
            { t: "Career simulation", d: "\"What if I only had 5 hrs/week?\" — see readiness recalculate instantly." },
            { t: "Interactive evidence graph", d: "A living map of every skill node and how strongly it's verified." },
          ].map(f => (
            <div key={f.t}>
              <div className="text-[13px] font-medium mb-1" style={{ color: "var(--text)" }}>{f.t}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADD A NEW SKILL (lightweight re-entry) ---------------- */

const ROLE_OPTIONS = ["Java Backend", "MERN Stack", "UI/UX Design", "DevOps Engineer", "Cloud Engineering"];

function AddSkill({ goto, setPendingTrack }) {
  const [role, setRole] = useState("");
  const existingIds = Object.keys(TRACKS);

  const submit = (r) => {
    setPendingTrack(r);
    // Reuses weekly_time_hours/learning_style already on file — only the quiz for
    // the new role runs, not the full onboarding again.
    goto("skillcheck");
  };

  return (
    <div className="mx-auto px-4 py-10" style={{ maxWidth: 640 }}>
      <div className="flex items-center gap-2 mb-1"><Sparkles size={16} style={{ color: "var(--accent)" }} /><span className="text-[11px] font-mono" style={{ color: "var(--accent)" }}>ADD A NEW SKILL</span></div>
      <h1 className="font-display text-2xl mb-1" style={{ color: "var(--text)" }}>What do you want to get ready for next?</h1>
      <p className="text-sm mb-7" style={{ color: "var(--muted)" }}>This creates a brand-new, independent roadmap and radar — your existing tracks are never touched. We'll reuse your time budget and learning style, so it's just a quick skill check away.</p>
      <div className="flex gap-2 flex-wrap mb-6">
        {ROLE_OPTIONS.map(r => (
          <button key={r} onClick={() => setRole(r)} className="text-sm px-4 py-2 rounded-full font-medium"
            style={{ background: role === r ? "var(--accent)" : "var(--surface)", color: role === r ? "#fff" : "var(--text)", border: `1px solid ${role === r ? "var(--accent)" : "var(--border)"}` }}>
            {r}
          </button>
        ))}
      </div>
      <button onClick={() => submit(role)} disabled={!role}
        className="w-full flex items-center justify-center gap-2 rounded-full py-3 font-medium"
        style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow)", opacity: role ? 1 : 0.5 }}>
        Continue to quick skill check <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* ---------------- DEMO BAR ---------------- */

function DemoBar({ idx, total, caption, onPrev, onNext, onExit }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex items-center gap-4 rounded-full pl-5 pr-2 py-2" style={{ transform: "translateX(-50%)", background: "var(--text)", boxShadow: "0 16px 40px rgba(27,29,42,0.35)", maxWidth: 620 }}>
      <span className="text-xs font-mono shrink-0" style={{ color: "#B9BCE0" }}>{idx + 1}/{total}</span>
      <span className="text-sm" style={{ color: "#fff" }}>{caption}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onPrev} disabled={idx === 0} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)", opacity: idx === 0 ? 0.4 : 1 }}><ChevronLeft size={16} color="#fff" /></button>
        {idx < total - 1
          ? <button onClick={onNext} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}><ChevronRight size={16} color="#fff" /></button>
          : <button onClick={onExit} className="px-3 h-8 rounded-full text-xs font-medium" style={{ background: "var(--success)", color: "#fff" }}>Done</button>}
      </div>
    </div>
  );
}

/* ---------------- APP ---------------- */

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [view, setView] = useState("flow");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeTrackId, setActiveTrackId] = useState("ml");
  const [pendingTrack, setPendingTrack] = useState(null); // role name picked in AddSkill, before its track exists yet
  const [demoIdx, setDemoIdx] = useState(null);
  const [demoQuizSubmitted, setDemoQuizSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const track = TRACKS[activeTrackId];
  const goto = (s) => { setDemoIdx(null); setScreen(s); };

  const openNode = (id) => {
    setSelectedNodeId(id);
    setSidebarOpen(true);
    // No locking — opening a node never needs to "unlock" anything else.
  };

  // Adaptive Feedback Loop — presentational simulation. In the real backend this calls
  // POST /api/roadmap/adapt: quiz_low/hard inserts a review node before the next step,
  // repeated "easy" compresses future basics, "skip" re-ranks the remaining path —
  // and completed nodes are NEVER touched, whichever feedback type comes in.
  const FEEDBACK_MESSAGES = {
    easy: "Nice pace — we'll compress the easier upcoming basics for you. Roadmap updated based on your progress ✨",
    hard: "Got it — inserting a quick review node before your next step. Roadmap updated based on your progress ✨",
    skip: "Skipping this — re-ranking your remaining path around it. Roadmap updated based on your progress ✨",
  };
  const giveFeedback = (type) => {
    setToast(FEEDBACK_MESSAGES[type]);
    setTimeout(() => setToast(null), 3200);
  };

  const applyStep = (i) => {
    const s = STEPS[i];
    setScreen(s.screen);
    if (s.view) setView(s.view);
    if ("activeTrackId" in s) setActiveTrackId(s.activeTrackId);
    if ("sidebarOpen" in s) setSidebarOpen(s.sidebarOpen);
    if ("nodeId" in s) setSelectedNodeId(s.nodeId);
    if ("quizSubmitted" in s) setDemoQuizSubmitted(s.quizSubmitted);
    setToast(s.toastMsg || null);
  };

  useEffect(() => { if (demoIdx !== null) applyStep(demoIdx); }, [demoIdx]);

  const startDemo = () => setDemoIdx(0);
  const stopDemo = () => setDemoIdx(null);

  return (
    <div className="min-h-screen font-body" style={{ background: "var(--bg)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        :root {
          --bg: #F4F5FA; --surface: #FFFFFF; --surface-2: #EEF0F7; --border: #E3E5F0;
          --text: #1B1D2A; --muted: #6B6F87;
          --accent: #5B5FEF; --accent-soft: rgba(91,95,239,0.10);
          --success: #0EA5A4; --success-soft: rgba(14,165,164,0.12);
          --warning: #D97706; --warning-soft: rgba(217,119,6,0.12);
          --shadow: 0 10px 30px rgba(27,29,42,0.08);
          --shadow-sm: 0 4px 14px rgba(27,29,42,0.06);
        }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        button { cursor: pointer; }
      `}</style>

      {!["landing", "signup", "login"].includes(screen) && (
        <TopNav screen={screen} goto={goto} demoOn={demoIdx !== null} startDemo={startDemo} stopDemo={stopDemo} />
      )}

      {screen === "landing" && <Landing goto={goto} />}
      {screen === "signup" && <SignUp goto={goto} />}
      {screen === "login" && <Login goto={goto} />}
      {screen === "onboarding" && <Onboarding goto={goto} />}
      {screen === "addskill" && <AddSkill goto={goto} setPendingTrack={setPendingTrack} />}
      {screen === "skillcheck" && <SkillCheck goto={goto} demoSubmitted={demoIdx !== null ? demoQuizSubmitted : undefined} />}
      {screen === "pathselect" && <PathSelect goto={goto} />}
      {screen === "roadmap" && <Roadmap view={view} setView={setView} track={track} onOpen={openNode} activeTrackId={activeTrackId} setActiveTrackId={setActiveTrackId} goto={goto} />}
      {screen === "dashboard" && <Dashboard goto={goto} track={track} activeTrackId={activeTrackId} setActiveTrackId={setActiveTrackId} />}

      {demoIdx === null && (screen === "roadmap" || screen === "dashboard" || screen === "pathselect") && (
        <button onClick={() => { setSelectedNodeId(null); setSidebarOpen(true); }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center z-20 flex"
          style={{ background: "var(--accent)", boxShadow: "0 10px 26px rgba(91,95,239,0.35)" }}>
          <Sparkles size={22} color="#fff" />
        </button>
      )}

      <Sidebar open={sidebarOpen} onClose={() => { if (demoIdx === null) setSidebarOpen(false); }} nodeId={selectedNodeId} track={track} onFeedback={giveFeedback} />
      <Toast message={toast} />

      {demoIdx !== null && (
        <DemoBar idx={demoIdx} total={STEPS.length} caption={STEPS[demoIdx].caption}
          onPrev={() => setDemoIdx(Math.max(0, demoIdx - 1))}
          onNext={() => setDemoIdx(Math.min(STEPS.length - 1, demoIdx + 1))}
          onExit={stopDemo} />
      )}
    </div>
  );
}

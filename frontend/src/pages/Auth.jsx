import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Radar,
  Route as RouteIcon,
  ArrowLeft,
  Sparkles,
  Flame,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.47 14.97.5 12 .5A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 4.75 12 4.75Z" />
    </svg>
  );
}

// Distinct left-panel messaging for each mode — signup pitches the outcome,
// login welcomes a returning learner back to their in-progress roadmap.
const PANELS = {
  signup: {
    badge: "Get started free",
    title: "Readiness you can prove — not just courses you finished.",
    subtitle:
      "Create your account and take a short skill check. In minutes you'll see exactly where you stand and what to learn next.",
    points: [
      { icon: ShieldCheck, text: "Verify skills with real assessments" },
      { icon: Radar, text: "See your gap to any target role" },
      { icon: RouteIcon, text: "Follow an adaptive Learn → Build → Prove path" },
    ],
  },
  login: {
    badge: "Welcome back",
    title: "Your roadmap kept adapting while you were away.",
    subtitle:
      "Log back in and pick up at your AI-suggested next step — your readiness score, skill radar and streak are exactly where you left them.",
    points: [
      { icon: RouteIcon, text: "Resume at your suggested next node" },
      { icon: TrendingUp, text: "See how much your skill gap has closed" },
      { icon: Flame, text: "Keep your learning streak alive" },
    ],
  },
};

export default function Auth() {
  const navigate = useNavigate();
  const { setUserProfile } = useApp();

  const [isLogin, setIsLogin] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [touched, setTouched] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwValid = password.length >= 6;
  const nameValid = name.trim().length > 1;
  const formValid = emailValid && pwValid && (isLogin || nameValid);

  const panel = isLogin ? PANELS.login : PANELS.signup;

  const markTouched = (f) => setTouched((t) => ({ ...t, [f]: true }));

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    setError("");
    if (!formValid) return;
    setLoading(true);
    try {
      if (isLogin) {
        await api.login(email, password);
        navigate("/dashboard");
      } else {
        await api.signup(email, password);
        setUserProfile((p) => ({ ...p, name: name.trim(), email }));
        navigate("/onboarding");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((v) => !v);
    setError("");
    setTouched({});
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — themed indigo→violet with a teal "evidence" glow */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#4f46e5] via-primary to-[#7c3aed] p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#8b5cf6]/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-[#0ea5a4]/25 blur-3xl" />

        <button
          onClick={() => navigate("/")}
          className="relative flex items-center gap-2 outline-none"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Compass className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold">WayPoint</span>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="size-3.5" /> {panel.badge}
            </span>
            <h2 className="mt-5 font-display text-4xl font-bold leading-tight">
              {panel.title}
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/85">{panel.subtitle}</p>
            <ul className="mt-8 space-y-4">
              {panel.points.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.text} className="flex items-center gap-3 text-primary-foreground/90">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                      <Icon className="size-4" />
                    </span>
                    {p.text}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </AnimatePresence>

        <p className="relative text-sm text-primary-foreground/70">
          Career Readiness & Adaptive Learning Path Recommender
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <button
            onClick={() => navigate("/")}
            className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="size-4" /> Back
          </button>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLogin
                ? "Log in to continue your roadmap."
                : "Start with a quick skill check — it takes minutes."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden px-1 pb-1 -mx-1"
                >
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => markTouched("name")}
                    aria-invalid={touched.name && !nameValid}
                  />
                  {touched.name && !nameValid && (
                    <p className="text-xs text-destructive">Please enter your name.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                aria-invalid={touched.email && !emailValid}
              />
              {touched.email && !emailValid && (
                <p className="text-xs text-destructive">Enter a valid email address.</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button type="button" className="text-xs text-primary hover:underline">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  aria-invalid={touched.password && !pwValid}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {touched.password && !pwValid && (
                <p className="text-xs text-destructive">At least 6 characters.</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {isLogin ? "Log in" : "Create account"}
            </Button>
          </form>

          {/* Google — moved below the form fields, per the flow */}
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or continue with
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(isLogin ? "/dashboard" : "/onboarding")}
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "New to WayPoint?" : "Already have an account?"}{" "}
            <button onClick={toggleMode} className="font-medium text-primary hover:underline">
              {isLogin ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

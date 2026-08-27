import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mic,
  MicOff,
  Check,
  Loader2,
  Pencil,
  Clock,
  Target,
  GraduationCap,
  Brain,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";
import { SUPPORTED_ROLES } from "@/data/tracks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STEPS = ["Profile Basics", "AI Context", "Confirmation"];
const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "New to this field" },
  { id: "intermediate", label: "Intermediate", desc: "Some hands-on experience" },
  { id: "advanced", label: "Advanced", desc: "Comfortable, filling gaps" },
];
const STYLES = [
  { id: "project-first", label: "Project-first", emoji: "🛠️" },
  { id: "theory-first", label: "Theory-first", emoji: "📚" },
  { id: "visual", label: "Visual learner", emoji: "🎨" },
  { id: "mixed", label: "A mix of everything", emoji: "🔀" },
];
// Quick-select presets under the weekly-time slider.
const TIME_PRESETS = [
  { h: 3, label: "Casual" },
  { h: 6, label: "Steady" },
  { h: 10, label: "Focused" },
  { h: 15, label: "Intensive" },
];

/* ─── Web Speech API voice input ─── */
function useSpeechInput(onResult) {
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef(null);
  const supported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggle = React.useCallback(() => {
    if (!supported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      onResult(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, onResult, supported]);

  React.useEffect(() => () => recognitionRef.current?.stop(), []);

  return { supported: !!supported, listening, toggle };
}

function Stepper({ step }) {
  return (
    <div className="mx-auto mb-10 flex max-w-md items-center">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                i < step && "bg-success text-success-foreground",
                i === step && "bg-primary text-primary-foreground",
                i > step && "bg-secondary text-muted-foreground"
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-xs font-medium",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mx-2 mb-5 h-0.5 flex-1 rounded-full transition-colors",
                i < step ? "bg-success" : "bg-border"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Bubble({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Sparkles className="size-3.5" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5 text-sm leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { userProfile, setUserProfile, setActiveTrackId, tracks, showToast } = useApp();

  const [step, setStep] = React.useState(0);
  const [role, setRole] = React.useState("ml");
  const [level, setLevel] = React.useState("beginner");
  const [hours, setHours] = React.useState(userProfile.weeklyTimeHours || 6);
  const [style, setStyle] = React.useState("");
  const [experience, setExperience] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const roleMeta = SUPPORTED_ROLES.find((r) => r.id === role);
  const { supported, listening, toggle } = useSpeechInput((t) =>
    setExperience((prev) => (prev ? `${prev} ${t}` : t))
  );

  const confirm = async () => {
    setSaving(true);
    const profileData = {
      name: userProfile.name,
      targetRole: roleMeta?.label || "Machine Learning",
      skillLevel: level,
      weeklyTimeHours: hours,
      learningStyle: style || "mixed",
      pastExperience: experience || "Not specified",
    };
    try {
      const res = await api.submitOnboarding(profileData);
      if (res.success) {
        setUserProfile((p) => ({ ...p, ...res.profile }));
        if (tracks[role]) setActiveTrackId(role);
        showToast("Profile saved", { description: "Let's verify your skills next." });
        navigate("/skill-check");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <Badge variant="accent" className="mb-3">
          <Sparkles className="size-3.5" /> Let's personalize your path
        </Badge>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Tell WayPoint about your goal
        </h1>
      </div>

      <Stepper step={step} />

      <AnimatePresence mode="wait">
        {/* ─── STEP 0: Form — one card per question so it reads broad, not cramped ─── */}
        {step === 0 && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {/* Target role */}
              <Card>
                <CardContent className="p-6">
                  <Label className="mb-1 flex items-center gap-1.5">
                    <Target className="size-4 text-primary" /> Target role
                  </Label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Where do you want to be job-ready?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_ROLES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={cn(
                          "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                          role === r.id
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-card hover:bg-accent"
                        )}
                      >
                        <span className="mr-1">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  {!tracks[role] && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      A tailored roadmap for this role is generated after your skill check.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Current level */}
              <Card>
                <CardContent className="p-6">
                  <Label className="mb-1 flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-primary" /> Current level
                  </Label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    So we start at the right depth.
                  </p>
                  <div className="grid gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLevel(l.id)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-3 text-left transition-colors",
                          level === l.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border bg-card hover:bg-accent"
                        )}
                      >
                        <div>
                          <div className="text-sm font-semibold">{l.label}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{l.desc}</div>
                        </div>
                        {level === l.id && <Check className="size-4 shrink-0 text-primary" />}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly time budget — its own card with slider + quick presets */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" /> Weekly time budget
                  </Label>
                  <span className="font-mono text-sm font-semibold">{hours} hrs/wk</span>
                </div>
                <Slider value={[hours]} min={2} max={20} step={1} onValueChange={(v) => setHours(v[0])} />
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>2h · casual</span>
                  <span>20h · intensive</span>
                </div>
                {/* Quick-select presets — compact inline chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p.h}
                      onClick={() => setHours(p.h)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                        hours === p.h
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:bg-accent"
                      )}
                    >
                      <span className="font-mono font-semibold">{p.h}h</span>
                      <span
                        className={cn(
                          hours === p.h ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>

                <Button size="lg" className="mt-6 w-full" onClick={() => setStep(1)}>
                  Continue <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 1: Chat ─── */}
        {step === 1 && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mx-auto max-w-2xl"
          >
            <Card>
              <CardContent className="space-y-5 p-6">
                <Bubble>
                  Nice — <strong>{roleMeta?.label}</strong> it is. How do you learn best? This
                  shapes how I sequence your roadmap.
                </Bubble>
                <div className="flex flex-wrap gap-2 pl-9">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                        style === s.id
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:bg-accent"
                      )}
                    >
                      <span className="mr-1">{s.emoji}</span>
                      {s.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {style && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <Bubble>
                        Got it. Briefly — what have you already built or studied here? You can type
                        or use the mic.
                      </Bubble>
                      <div className="pl-9">
                        <div className="relative">
                          <textarea
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            rows={3}
                            placeholder="e.g. Basic Python, a couple of small scripts, one online course…"
                            className="w-full resize-none rounded-xl border border-input bg-card p-3 pr-12 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          />
                          <button
                            type="button"
                            onClick={toggle}
                            disabled={!supported}
                            title={
                              supported
                                ? listening
                                  ? "Stop listening"
                                  : "Speak your answer"
                                : "Voice input isn't supported in this browser"
                            }
                            className={cn(
                              "absolute right-2 top-2 flex size-9 items-center justify-center rounded-lg transition-colors",
                              !supported && "cursor-not-allowed text-muted-foreground/40",
                              supported && !listening && "text-muted-foreground hover:bg-accent hover:text-foreground",
                              listening && "bg-destructive/10 text-destructive"
                            )}
                          >
                            {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                          </button>
                          {listening && (
                            <span className="absolute right-12 top-4 flex items-center gap-1 text-xs text-destructive">
                              <span className="size-2 animate-pulse rounded-full bg-destructive" />
                              listening…
                            </span>
                          )}
                        </div>
                        {!supported && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Tip: voice input works in Chrome/Edge — typing is perfectly fine here.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <Button className="flex-1" disabled={!style} onClick={() => setStep(2)}>
                    Review profile <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── STEP 2: Summary ─── */}
        {step === 2 && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mx-auto max-w-2xl"
          >
            <Card>
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Brain className="size-4" />
                    </span>
                    <h2 className="font-display text-lg font-semibold">Your profile</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                </div>

                <dl className="divide-y divide-border rounded-xl border border-border">
                  {[
                    { label: "Target role", value: `${roleMeta?.icon} ${roleMeta?.label}` },
                    { label: "Current level", value: LEVELS.find((l) => l.id === level)?.label },
                    { label: "Weekly time", value: `${hours} hrs / week` },
                    { label: "Learning style", value: STYLES.find((s) => s.id === style)?.label || "—" },
                    { label: "Experience", value: experience || "Not specified" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-muted-foreground">{row.label}</dt>
                      <dd className="max-w-[60%] text-right text-sm font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <Button className="flex-1" size="lg" disabled={saving} onClick={confirm}>
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    Looks good — verify my skills <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

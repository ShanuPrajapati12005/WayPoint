import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  SkipForward,
  Link2,
  Clock,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { stageInfo } from "@/data/tracks";
import { useTypewriter } from "@/hooks/useTypewriter";
import { deriveBreakdown } from "@/components/common/MatchScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const barTone = { success: "bg-success", accent: "bg-primary", warning: "bg-warning" };
function toneOf(v) {
  if (v >= 90) return "success";
  if (v >= 70) return "accent";
  return "warning";
}

const SUGGESTED = [
  "How long will this take?",
  "What are the prerequisites?",
  "What comes after this?",
];

function answerFor(q, node, reasoning) {
  const t = q.toLowerCase();
  if (/how long|time|duration|week|pace/.test(t))
    return reasoning?.time || `"${node.title}" takes about ${node.duration} at your current pace.`;
  if (/prereq|before|need|ready|require/.test(t))
    return reasoning?.prereq || "There are no blocking prerequisites — you can start this now.";
  if (/after|next|then|follow/.test(t))
    return `After "${node.title}", your path moves toward the build & prove stages — each node unlocks more of the real-world skills your target role needs.`;
  if (/already know|skip|know this|too easy/.test(t))
    return `If you're already confident here, hit "Skip" below — I'll re-rank the remaining path around it and pull your next real gap forward.`;
  if (/why|recommend|reason/.test(t))
    return reasoning?.reason || `"${node.title}" is placed here because it directly supports the skills your target role needs next.`;
  return `For "${node.title}": ${reasoning?.reason || "it fits your current path sequence and target role."} Want me to adjust its difficulty or timing?`;
}

function StreamingText({ text, animate = true, className }) {
  const { displayText, isTyping } = useTypewriter(text, 14, animate);
  return (
    <span className={className}>
      {displayText}
      {isTyping && (
        <span className="ml-0.5 inline-block h-3.5 w-0.5 -translate-y-px animate-pulse bg-primary align-middle" />
      )}
    </span>
  );
}

function InfoRow({ icon: Icon, label, text }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-sm leading-relaxed text-foreground">{text}</div>
      </div>
    </div>
  );
}

export default function AISidebar() {
  const {
    sidebarOpen,
    closeSidebar,
    selectedNodeId,
    activeTrackId,
    tracks,
    giveFeedback,
    updateNodeStatus,
  } = useApp();
  const [query, setQuery] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const scrollRef = React.useRef(null);

  const track = tracks[activeTrackId];
  const node = selectedNodeId && track ? track.nodeMap[selectedNodeId] : null;
  const reasoning = selectedNodeId && track ? track.reasoning?.[selectedNodeId] : null;
  const breakdown = React.useMemo(
    () => (node ? deriveBreakdown(node.match, selectedNodeId) : []),
    [node, selectedNodeId]
  );

  // Reset the conversation when the selected node changes
  React.useEffect(() => {
    setMessages([]);
    setQuery("");
  }, [selectedNodeId]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ask = (q) => {
    const question = q.trim();
    if (!question || !node) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: question },
      { role: "ai", text: answerFor(question, node, reasoning) },
    ]);
    setQuery("");
  };

  const stage = node ? stageInfo(node.stage) : null;

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-[45] bg-black/30 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-2xl sm:w-[420px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <span className="font-display text-sm font-semibold text-foreground">
                  AI Guide
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={closeSidebar} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-5">
              {node ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {stage && <Badge variant={stage.variant}>{stage.label}</Badge>}
                    <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary">
                      Why "{node.title}"?
                    </span>
                  </div>

                  {/* Streaming explanation */}
                  <p
                    key={selectedNodeId}
                    className="text-sm leading-relaxed text-foreground"
                  >
                    <StreamingText
                      text={
                        reasoning?.reason ||
                        `"${node.title}" fits directly into your chosen path's sequence toward your target role.`
                      }
                    />
                  </p>

                  <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
                    <InfoRow
                      icon={Link2}
                      label="Prerequisite"
                      text={reasoning?.prereq || "No blocking prerequisites remaining."}
                    />
                    <InfoRow
                      icon={Clock}
                      label="Time fit"
                      text={reasoning?.time || `Estimated ${node.duration} at your current pace.`}
                    />
                  </div>

                  {/* Live status action — updates readiness, radar & heatmap everywhere */}
                  {node.status === "completed" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => updateNodeStatus(activeTrackId, selectedNodeId, "in_progress")}
                    >
                      <RotateCcw className="size-4" /> Reopen this step
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => updateNodeStatus(activeTrackId, selectedNodeId, "completed")}
                    >
                      <CheckCircle2 className="size-4" /> Mark as complete
                    </Button>
                  )}


                  {/* Real match breakdown */}
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        Match score
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {node.match}%
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {breakdown.map((b, i) => (
                        <div key={b.label}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-foreground">{b.label}</span>
                            <span className="font-mono text-muted-foreground">{b.value}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-border">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${b.value}%` }}
                              transition={{ duration: 0.7, delay: 0.15 + i * 0.1 }}
                              className={cn("h-full rounded-full", barTone[toneOf(b.value)])}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adaptive feedback */}
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      How did this go? (adapts your path)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { type: "easy", icon: ThumbsUp, label: "Easy", tone: "text-success" },
                        { type: "hard", icon: ThumbsDown, label: "Too hard", tone: "text-warning" },
                        { type: "skip", icon: SkipForward, label: "Skip", tone: "text-muted-foreground" },
                      ].map(({ type, icon: Icon, label, tone }) => (
                        <button
                          key={type}
                          onClick={() => giveFeedback(type)}
                          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card py-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                        >
                          <Icon className={cn("size-4", tone)} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q&A */}
                  {messages.length > 0 && (
                    <div className="space-y-2.5">
                      {messages.map((m, i) => (
                        <div
                          key={i}
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                            m.role === "user"
                              ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                              : "mr-auto rounded-bl-sm bg-secondary text-foreground"
                          )}
                        >
                          {m.role === "ai" ? (
                            <StreamingText text={m.text} animate={i === messages.length - 1} />
                          ) : (
                            m.text
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {messages.length === 0 && (
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED.map((s) => (
                        <button
                          key={s}
                          onClick={() => ask(s)}
                          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="size-5" />
                  </span>
                  <p className="font-display text-sm font-medium text-foreground">
                    Hey, I'm your AI guide
                  </p>
                  <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">
                    Click any node on the roadmap, or ask me anything about your path.
                  </p>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(query);
              }}
              className="flex items-center gap-2 border-t border-border p-4"
            >
              <Input
                placeholder={node ? "Ask a follow-up…" : "Select a node first"}
                value={query}
                disabled={!node}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" size="icon" disabled={!node || !query.trim()} aria-label="Send">
                <Send className="size-4" />
              </Button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

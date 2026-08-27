import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Route as RouteIcon,
  GitFork,
  Check,
  Info,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  NODE_ORDER,
  EDGES,
  TREE_BRANCHES,
  suggestedNextId,
  matchColor,
  statusInfo,
  stageInfo,
} from "@/data/tracks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── React Flow custom node ─── */
function WayPointNode({ data }) {
  const { node, suggested, layout } = data;
  const s = statusInfo(node.status);
  const stage = stageInfo(node.stage);

  return (
    <div
      className={cn(
        "group w-[190px] rounded-xl border-2 bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        node.status === "in_progress" && "border-primary shadow-[0_6px_20px_rgba(91,95,239,0.18)]",
        node.status === "completed" && "border-success/50",
        suggested && node.status !== "in_progress" && "border-warning",
        node.status === "not_started" && !suggested && "border-border"
      )}
    >
      {layout.in && (
        <Handle type="target" position={layout.in} className="!size-1.5 !border-0 !bg-transparent" />
      )}
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            node.status === "completed" && "bg-success text-success-foreground",
            node.status === "in_progress" && "bg-primary text-primary-foreground",
            node.status === "not_started" && "bg-secondary"
          )}
        >
          {node.status === "completed" && <Check className="size-3.5" />}
          {node.status === "in_progress" && <span className="size-1.5 rounded-full bg-white" />}
        </span>
        {suggested ? (
          <Badge variant="warning" className="px-1.5 py-0 text-[9px]">SUGGESTED</Badge>
        ) : (
          <span
            className="font-mono text-[10px] font-bold"
            style={{ color: matchColor(node.match) }}
          >
            {node.match}%
          </span>
        )}
      </div>
      <div className="text-[13px] font-semibold leading-tight text-foreground">{node.title}</div>
      <div className="mt-2 flex items-center justify-between">
        <Badge variant={stage.variant} className="px-1.5 py-0 text-[9px]">{stage.label}</Badge>
        <span className="font-mono text-[10px] text-muted-foreground">{node.duration}</span>
      </div>
      {layout.out && (
        <Handle type="source" position={layout.out} className="!size-1.5 !border-0 !bg-transparent" />
      )}
    </div>
  );
}

// Stable references (React Flow requirement).
const nodeTypes = { wp: WayPointNode };

const COL_W = 250;
const ROW_H = 168;
const LAYOUT = {
  f1: { col: 0, row: 0, in: null, out: Position.Right },
  f2: { col: 1, row: 0, in: Position.Left, out: Position.Right },
  f3: { col: 2, row: 0, in: Position.Left, out: Position.Bottom },
  d1: { col: 2, row: 1, in: Position.Top, out: Position.Left },
  d2: { col: 1, row: 1, in: Position.Right, out: Position.Left },
  m1: { col: 0, row: 1, in: Position.Right, out: Position.Bottom },
  m2: { col: 0, row: 2, in: Position.Top, out: Position.Right },
  m3: { col: 1, row: 2, in: Position.Left, out: null },
};
const POSITIONS = NODE_ORDER.map((id) => ({
  id,
  x: LAYOUT[id].col * COL_W,
  y: LAYOUT[id].row * ROW_H,
}));

function RoadmapFlow({ track, onOpen }) {
  const suggested = suggestedNextId(track);

  const nodes = React.useMemo(
    () =>
      POSITIONS.map(({ id, x, y }) => ({
        id,
        type: "wp",
        position: { x, y },
        data: { node: track.nodeMap[id], suggested: id === suggested, layout: LAYOUT[id] },
      })),
    [track, suggested]
  );

  const edges = React.useMemo(
    () =>
      EDGES.map(([a, b]) => {
        const done = track.nodeMap[a].status === "completed";
        return {
          id: `${a}-${b}`,
          source: a,
          target: b,
          animated: track.nodeMap[a].status === "in_progress",
          style: { stroke: done ? "#0ea5a4" : "#9aa0b5", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: done ? "#0ea5a4" : "#9aa0b5" },
        };
      }),
    [track]
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="wp-flow h-[calc(100vh-15rem)] min-h-[500px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => onOpen(n.id)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          minZoom={0.4}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant="dots" gap={22} size={1} color="var(--border)" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              const st = n.data?.node?.status;
              if (st === "completed") return "#0ea5a4";
              if (st === "in_progress") return "#5b5fef";
              return "#c9ccda";
            }}
            maskColor="color-mix(in srgb, var(--background) 70%, transparent)"
          />
        </ReactFlow>
      </div>
    </Card>
  );
}

/* ─── Tree view — collapsible connected tree with vertical rails ─── */

function TreeChild({ id, track, suggested, onOpen, color, isLast }) {
  const node = track.nodeMap[id];
  const isSuggested = id === suggested;
  const stage = stageInfo(node.stage);
  return (
    <div className="relative pl-8">
      {/* Vertical connector line */}
      {!isLast && (
        <span
          className="absolute left-[11px] top-1/2 h-[calc(100%+12px)] w-0.5"
          style={{ background: `${color}30` }}
        />
      )}
      {/* Horizontal branch line to node */}
      <span
        className="absolute left-[11px] top-1/2 h-0.5 w-4 -translate-y-1/2"
        style={{ background: `${color}50` }}
      />
      {/* Node dot on the rail */}
      <span
        className="absolute left-[7px] top-1/2 size-[10px] -translate-y-1/2 rounded-full ring-[3px] ring-card"
        style={{
          background:
            node.status === "completed"
              ? color
              : node.status === "in_progress"
                ? "#818cf8"
                : "var(--border)",
        }}
      />
      <button
        onClick={() => onOpen(id)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
          node.status === "in_progress" && "border-primary/60",
          node.status === "completed" && "border-success/40",
          isSuggested && node.status !== "in_progress" && "border-warning/60",
          node.status === "not_started" && !isSuggested && "border-border"
        )}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            node.status === "completed" && "bg-success text-success-foreground",
            node.status === "in_progress" && "bg-primary text-primary-foreground",
            node.status === "not_started" && "bg-secondary"
          )}
        >
          {node.status === "completed" && <Check className="size-4" />}
          {node.status === "in_progress" && <span className="size-1.5 rounded-full bg-white" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">{node.title}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant={stage.variant} className="px-1.5 py-0 text-[9px]">{stage.label}</Badge>
            <span className="font-mono text-[10px] text-muted-foreground">{node.duration}</span>
          </div>
        </div>
        {isSuggested ? (
          <Badge variant="warning" className="shrink-0 px-1.5 py-0 text-[9px]">SUGGESTED</Badge>
        ) : (
          <span className="shrink-0 font-mono text-[10px] font-bold" style={{ color: matchColor(node.match) }}>
            {node.match}%
          </span>
        )}
      </button>
    </div>
  );
}

function CollapsibleBranch({ branch, track, suggested, onOpen, index }) {
  const [open, setOpen] = React.useState(branch.defaultOpen !== false);
  const done = branch.children.filter((id) => track.nodeMap[id].status === "completed").length;
  const total = branch.children.length;
  const pct = Math.round((done / total) * 100);

  return (
    <Card className="overflow-hidden">
      {/* Header — clickable to expand/collapse */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold text-white"
          style={{ background: branch.color }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-semibold">{branch.label}</h3>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full"
              style={{ background: branch.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {done}/{total}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible body with connected nodes */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="relative flex flex-col gap-3 px-4 pb-4">
              {/* Main vertical rail */}
              <span
                className="absolute bottom-6 left-[27px] top-0 w-0.5 rounded"
                style={{ background: `${branch.color}30` }}
              />
              {branch.children.map((id, i) => (
                <TreeChild
                  key={id}
                  id={id}
                  track={track}
                  suggested={suggested}
                  onOpen={onOpen}
                  color={branch.color}
                  isLast={i === branch.children.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function RoadmapTree({ track, onOpen }) {
  const suggested = suggestedNextId(track);
  return (
    <div>
      {/* staged-flow legend */}
      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-wide">Staged path</span>
        {TREE_BRANCHES.map((b, i) => (
          <React.Fragment key={b.id}>
            {i > 0 && <span className="text-border">→</span>}
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: b.color }} />
              {b.label}
            </span>
          </React.Fragment>
        ))}
      </div>
      {/* Collapsible branch cards stacked vertically for tree feel */}
      <div className="flex flex-col gap-4">
        {TREE_BRANCHES.map((b, i) => (
          <CollapsibleBranch
            key={b.id}
            branch={b}
            track={track}
            suggested={suggested}
            onOpen={onOpen}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function Roadmap() {
  const { activeTrackId, tracks, openNode, roadmapView, setRoadmapView } = useApp();
  const track = tracks[activeTrackId] || Object.values(tracks)[0];

  if (!track) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-96 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Your Learning Path</h1>
          <p className="text-sm text-muted-foreground">{track.label} Track</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          {[
            { id: "flow", label: "Flow", icon: RouteIcon },
            { id: "tree", label: "Tree", icon: GitFork },
          ].map((v) => {
            const Icon = v.icon;
            const active = roadmapView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setRoadmapView(v.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" /> {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {roadmapView === "flow" ? (
        <RoadmapFlow track={track} onOpen={openNode} />
      ) : (
        <RoadmapTree track={track} onOpen={openNode} />
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Every step is open — click any node any time to open the AI guide. The amber "Suggested"
        badge just points to your highest-impact next move.
      </p>
    </div>
  );
}

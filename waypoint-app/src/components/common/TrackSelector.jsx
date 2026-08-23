import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Plus, Layers, CheckCircle2, Circle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { trackCompletionPct, trackReadinessPct } from "@/data/tracks";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function TrackRow({ track, active, onSelect }) {
  const completed = track.status === "completed";
  const pct = trackCompletionPct(track);
  return (
    <DropdownMenuItem
      onSelect={() => onSelect(track.id)}
      className={cn("gap-3", active && "bg-accent")}
    >
      {completed ? (
        <CheckCircle2 className="!text-success" />
      ) : (
        <Circle className={active ? "!text-primary" : ""} />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {track.label}
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">
          Readiness {trackReadinessPct(track)}%
        </div>
      </div>
      <span
        className={cn(
          "font-mono text-xs font-bold",
          completed ? "text-success" : "text-primary"
        )}
      >
        {pct}%
      </span>
    </DropdownMenuItem>
  );
}

export default function TrackSelector() {
  const { tracks, activeTrackId, setActiveTrackId } = useApp();
  const navigate = useNavigate();

  const allTracks = Object.values(tracks);
  const activeList = allTracks.filter((t) => t.status === "active");
  const completedList = allTracks.filter((t) => t.status === "completed");
  const current = tracks[activeTrackId] || allTracks[0];

  if (!current) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Layers className="size-3" />
          </span>
          <span className="max-w-[6rem] truncate text-sm font-medium text-foreground lg:max-w-[9rem]">
            {current.label}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {trackCompletionPct(current)}%
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Active tracks</DropdownMenuLabel>
        {activeList.map((t) => (
          <TrackRow
            key={t.id}
            track={t}
            active={t.id === activeTrackId}
            onSelect={setActiveTrackId}
          />
        ))}

        {completedList.length > 0 && (
          <>
            <DropdownMenuLabel>Completed</DropdownMenuLabel>
            {completedList.map((t) => (
              <TrackRow
                key={t.id}
                track={t}
                active={t.id === activeTrackId}
                onSelect={setActiveTrackId}
              />
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => navigate("/add-skill")}
          className="gap-3 font-medium text-primary focus:text-primary"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-primary/10">
            <Plus className="size-3 !text-primary" />
          </span>
          Add a new skill
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass,
  MessageCircle,
  GitBranch,
  Route,
  LayoutDashboard,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import TrackSelector from "@/components/common/TrackSelector";
import UserMenu from "@/components/common/UserMenu";
import FloatingNav from "@/components/layout/FloatingNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "/onboarding", label: "Onboarding", icon: MessageCircle },
  { path: "/path-select", label: "Choose Path", icon: GitBranch },
  { path: "/roadmap", label: "Roadmap", icon: Route },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, setCommandOpen, demoMode } = useApp();

  return (
    /* `wide` = roomier compressed width. This nav carries a lot (logo + 4 tabs +
       search + theme + track + account); at the marketing nav's ~68% the tabs
       wrapped and spilled out of the pill's fixed height. Every child below is
       also `shrink-0`/`nowrap` so the row can never wrap mid-transition. */
    <FloatingNav wide>
      {/* Logo */}
      <button
        onClick={() => navigate("/dashboard")}
        className="flex shrink-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Compass className="size-4" />
        </span>
        <span className="whitespace-nowrap font-display text-lg font-semibold tracking-tight text-foreground">
          WayPoint
        </span>
        {demoMode && (
          <Badge variant="warning" className="hidden shrink-0 sm:inline-flex">
            Demo
          </Badge>
        )}
      </button>

      {/* Center: pill tabs — icon-only between md and lg so they always fit */}
      <nav className="hidden shrink-0 items-center gap-1 rounded-full border border-border bg-card/60 p-1 shadow-sm md:flex">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              title={tab.label}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring lg:px-3.5",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-primary shadow-[0_2px_8px_rgba(91,95,239,0.35)]"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 size-4 shrink-0" />
              <span className="relative z-10 hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right cluster */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden shrink-0 items-center gap-2 rounded-lg border border-border bg-card/60 py-1.5 pl-2.5 pr-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground sm:flex"
          aria-label="Search — open command palette"
          title="Search (⌘K)"
        >
          <Search className="size-4 shrink-0" />
          <span className="hidden whitespace-nowrap lg:inline">Search…</span>
          <kbd className="ml-1 hidden whitespace-nowrap rounded border border-border bg-background/70 px-1.5 py-0.5 font-mono text-[10px] leading-none lg:inline">
            ⌘K
          </kbd>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <TrackSelector />

        <UserMenu />
      </div>
    </FloatingNav>
  );
}

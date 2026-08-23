# AI-Powered Personalized Learning Path Recommender
## Project Brief for Team — HCL Amplified Hackathon

> ## ⚠️ UPDATE NOTICE — Read This First
>
> This document is the project's **original pitch/summary** — the overall vision and tech-stack reasoning are still valid, but the product has **evolved** since then, with two major updates:
>
> **Update 1 — Evidence-based positioning:** The product no longer just tells you "what to learn." It first **verifies** your skills via a quiz (never trusts self-declared claims), then **identifies the gap** against your target role, then delivers a **Learn → Build → Prove** roadmap. The product is now named **"Waypoint."**
>
> **Update 2 — Multi-Track support:** A user can now explore more than one target role (e.g. Machine Learning first, then Java later, then MERN Stack) — every new role gets its own independent roadmap + radar, an existing one is never overwritten. A **Global Track Selector** lets the user switch between them. Locking has also been **removed** from roadmap steps — every node is accessible from the start.
>
> **Both updates are fully detailed in the PRD and the Implementation Plan** — if this Project Brief is handed to an AI coding tool together with those two documents, all three together give the complete, current project context. The rest of this Project Brief (tech-stack reasoning, hackathon strategy, priority order) is still accurate — just follow the PRD, not this document, for feature-level detail.

---

## 1. Project Summary

We are building an **AI-powered learning assistant** that generates a **personalized learning roadmap** for every user — based on their goals, interests, current skill level, and available time.

**Simple flow:**
The user talks to the AI in natural language about their goals → the AI understands their profile → generates a **visual, interactive roadmap** (courses + projects + milestones, in the right sequence) → the user follows the roadmap and tracks progress → the AI adapts the roadmap in real time based on their feedback and performance.

We're not just building a "recommendation list" — we're building a **full AI coaching experience** where the visual roadmap, live dashboard, AI explanations, and adaptive intelligence all work together. This is what will set us apart from the other ~2000 teams.

---

## 2. Tech Stack (Detailed)

| Layer | Technology | Why We Chose It |
|---|---|---|
| **Frontend** | React + Tailwind CSS | Fast development, component-based, industry standard |
| **Roadmap Visualization** | React Flow | Zoomable, draggable node-graph — makes the roadmap feel like an interactive "skill tree" |
| **Charts (Dashboard)** | Recharts / Chart.js | For the radar chart (skill gap), progress bars, and heatmap |
| **Backend** | Python + FastAPI | Clean and fast for LLM API calls, JSON handling, and data processing |
| **Database** | Supabase (PostgreSQL) | Our data is **relational** (users ↔ progress ↔ courses ↔ roadmaps are all connected). SQL joins give us clean queries. Built-in Auth comes free. The JSONB column type lets us store the nested roadmap JSON flexibly too — best of both worlds (SQL + flexibility) |
| **Authentication** | Supabase Auth | Email/password + Google OAuth, ready-made, no extra setup needed |
| **AI/LLM** | Claude API / OpenAI API | For generating structured JSON output — the roadmap, reasoning, and explanations all come from this |
| **Hosting (Frontend)** | Vercel | Free, best for React, auto-deploys from GitHub |
| **Hosting (Backend)** | Render | Free tier, reliable for FastAPI |

### Why Supabase (SQL), not Firebase/MongoDB?
Our data is strictly relational — a user's progress is linked to specific courses, and building the radar chart requires "joining" tags across completed courses. SQL handles this in one clean query; NoSQL (Firebase/MongoDB) would require manually simulating these relationships, which gets messy and slow. So Supabase is technically the better fit.

### Database Schema (5 tables)
```
users      → id, email, name, created_at
profiles   → user_id, interests[], skill_level, goal, weekly_time, learning_style
roadmaps   → id, user_id, path_json (nodes+edges+milestones), active_path
progress   → id, user_id, node_id, status, quiz_score, feedback, completed_at
courses    → id, title, tags[], difficulty, duration, prerequisites[], link, type
```

### Recommendation Engine Logic (RAG-style, 2-stage)
1. **Stage 1 (Retrieval):** A curated dataset of 50-100 real courses/projects (manually tagged: skill, difficulty, duration, prerequisites) — so the AI doesn't hallucinate fake course names
2. **Stage 2 (Reasoning):** The retrieved items are passed to the LLM → the LLM decides the sequence, maps prerequisites, and returns the roadmap in a fixed JSON schema (which React Flow can render directly)

---

## 3. Feature-by-Feature Breakdown (All at an Advanced Level)

### 🔹 A. Conversational Onboarding
- Chat-based interface where the user describes their goals in natural language (not a form)
- AI asks clarifying follow-up questions if an answer is vague
- Supports both quick-reply chips and free text
- Shows a progress ring ("Profile 60% complete")
- Ends with an auto-generated, editable **Profile Summary Card**
- **Backend:** LLM performs structured extraction into a profile JSON: `{interests, skill_level, goal, weekly_time, learning_style, past_experience}`

### 🔹 B. Interactive Roadmap (Core Differentiator)
- Zoomable/pannable node-graph built with **React Flow** (feels like a skill tree)
- Color-coded nodes: 🟢 completed, 🟡 in-progress, ⚪ locked
- Clicking a node opens a side panel with reasoning, resources, and time estimate
- **Milestone grouping:** A node = a single course/project. A milestone = a cluster of 3-5 related nodes (visually grouped/boxed in the graph)
- Supports branching paths (see below)

### 🔹 C. Skill Gap Radar Chart
- Radar/spider chart comparing current skills vs. target goal skills
- Data source: tags from completed courses, summed into a skill score
- Visually communicates "data-driven AI" — turns a mandatory dashboard requirement into a premium feature

### 🔹 D. Progress Dashboard
- Hero stats bar: streak 🔥, XP, completion %, time-to-goal (animated count-up)
- Embedded mini-roadmap preview
- Skill radar chart
- Horizontal milestone timeline
- "Next recommended action" card (single clear CTA)
- Activity heatmap (GitHub-style)

### 🔹 E. AI Explanation Sidebar
- Persistent floating chat panel, available on every screen
- Context-aware — clicking a node auto-loads its reasoning in the sidebar
- Structured responses: 📌 Reason, 🔗 Prerequisite link, ⏱️ Time fit
- Streaming (word-by-word) text for a premium AI feel
- **Backend:** Reasoning metadata is generated alongside the roadmap (no extra API calls needed); free-form queries get full context (profile + roadmap + current position)

### 🔹 F. AI Confidence / Match Score
- Every recommended node shows a match % (e.g. "94%") — a color-coded circular badge
- Hover reveals a breakdown: Goal alignment, Skill readiness, Time fit
- An overall "Path Confidence Score" also appears on the dashboard
- **Backend:** The LLM generates the score and reasoning directly within the roadmap JSON output

### 🔹 G. Branching Career Paths
- If the goal is broad (e.g. "data science"), the AI generates 2-3 valid path options
- A "Choose Your Path" screen shows preview cards
- The user can switch paths later without losing progress
- Shared/overlapping nodes appear as merge points in the graph
- **Backend:** Both paths are precomputed and stored; branching only triggers when the goal is detected as generic

### 🔹 H. AI Insights (Proactive Card)
- A dashboard card that proactively surfaces observations, rather than waiting to be asked
- Examples: "You're 20% faster than average 🚀" / "3 days inactive — try a quick 15-min task?"
- Each insight comes with an actionable button
- **Backend:** Simple rule-based triggers (inactivity, pace, quiz scores) are converted into natural language via a small LLM call

### 🔹 I. Adaptive Feedback Loop
- Triggers: a low quiz score, thumbs up/down feedback, pace mismatch, or a mid-way goal change
- The roadmap re-adjusts with smooth animated transitions (not a static reload)
- Toast notification: "Roadmap updated based on your progress ✨"
- **Backend:** Only unlocked/upcoming nodes are regenerated — completed nodes stay untouched, so progress is never lost

---

## 4. Additional Technical Notes (Finalized)

- **UI Component Library:** We'll use **shadcn/ui** alongside Tailwind CSS (for buttons, cards, modals, dialogs) — this keeps the whole app visually consistent and professional, instead of different developers building components in different styles.

- **Voice Input:** For the onboarding chat, we'll use the **Web Speech API** (browser-native) — no extra library or cost, and quick to set up.

- **Confidence Score — Backup Formula:** If the LLM-generated match score is ever inconsistent or unreliable, we'll fall back to a deterministic formula:
  `match_score = (goal_alignment × 0.4) + (skill_readiness × 0.35) + (time_fit × 0.25)`
  This is a **required fallback**, not just optional — it keeps the score reliable regardless of what the LLM returns.

- **API Key Security:** All API keys (Claude/OpenAI, Supabase) will be stored in a `.env` file, and `.env` will be added to `.gitignore` so it's never accidentally committed to GitHub. This is mandatory security hygiene.

- **Course Dataset Source:** For the 50-100 curated courses, we'll pull from freeCodeCamp, YouTube (official channel playlists), and Coursera/edX public course listings (name + link only, no scraping of paid content). Using real, credible sources means the demo won't look fake to judges.

---

## 5. Demo Safety Plan
- A pre-generated `sample_roadmap.json` (real saved LLM outputs for 2-3 sample profiles) as a fallback
- A hidden "Demo Mode" toggle in case the live API is slow or fails during the presentation

---

## 6. Priority Order (If Time Gets Tight)
**Must-have (core problem statement):** Onboarding → Recommendation Engine → Roadmap → Dashboard (with radar chart) → AI Sidebar → Adaptive Loop

**High-impact add-ons (build after the core is stable):** Confidence Score → Branching Paths → AI Insights Card

**Nice-to-have (only if time remains):** Voice input, Gamification (XP/streaks/badges), Explain-mode toggle

---

*We're following an MVP-first approach: build a basic, fully working end-to-end version first, then layer in polish and advanced features. This guarantees a working demo is always ready.*

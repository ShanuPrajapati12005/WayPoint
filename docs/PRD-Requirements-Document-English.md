# Product Requirements Document (PRD)
## AI-Powered Career Readiness & Adaptive Learning Path Recommender — Waypoint

> **Positioning shift (v2):** The product no longer just answers "what should I learn" — it first **verifies skills via a quiz-based evidence check**, **identifies the gap** against the target role, and then builds a **Learn → Build → Prove** path based on that gap. The roadmap/onboarding/adaptive-loop/dashboard base that was already built is fully reused — this just adds a new **evidence/readiness layer** on top. Heavier evidence types (debugging-lab, AI-interview, career simulation, full evidence graph UI) live in **Section 13 — Future Roadmap**, so the scope realistically fits the hackathon timeline.

> **Positioning shift (v3 — Multi-Track):** A user isn't limited to one target role — they can explore different skills at different times (e.g. Machine Learning first, then Java later, then MERN Stack). Every new target role gets its own **new, independent roadmap + radar chart** — an existing one is **never overwritten**. The user has a **global track selector** to switch between all their active tracks — whichever track is selected, the whole app (Roadmap, Radar, AI Sidebar, Dashboard) switches to that track's data. Full detail is in **Section 4A — Multi-Track Roadmap Management**. Along with this, node locking has been **removed** from the roadmap (see Section 4), and onboarding is now **hybrid (form + chat)** (see Section 1).

**Purpose of this doc:** To define exact requirements for every feature — what to build, how it should work, what the API looks like, where the data goes, and when a feature counts as "complete." Every team member should be able to reference their own section directly without reading everything else. **This document + the Project Brief + the Implementation Plan together give the complete project context — if all three are handed to any AI coding tool (Antigravity, etc.), it shouldn't need to ask anything further about the project.**

---

## Resolved Decisions Log (Team meeting — finalized, don't re-debate these)

| # | Question | Decision |
|---|---|---|
| 1 | Onboarding approach? | **Hybrid** — quick form for `target_role`/experience/time, short chat for `learning_style`/motivation (see Section 1) |
| 2 | Quiz question skipped/left blank? | That skill stays `self_declared`, not `verified` — never silently upgraded |
| 3 | LLM fails/times out during roadmap generation? | Fall back to a deterministic, retrieval-only roadmap (no LLM reasoning) rather than failing the request — see Section 3 |
| 4 | Goal too broad, how many branching paths? | Maximum 3 paths |
| 5 | Multiple skills/roles per user? | Each new target role creates a **new, separate roadmap** — never overwrites an existing one (Section 4A) |
| 6 | Roadmap step locking? | **Removed.** All nodes are accessible from the start (roadmap.sh-style) — a "suggested next" badge guides the user without blocking anything (Section 4) |
| 7 | Radar chart when multiple tracks exist? | One radar chart per track, switchable via the same global track selector (Section 5) |
| 8 | What happens to a track at 100% completion? | Moves from the "Active" group to a "Completed" group in the selector — never deleted, history preserved (Section 4A) |

---

## 0. Global Requirements (Applicable to all features)

### 0.1 Authentication
- **User story:** As a user, I want to sign up/login so my progress is saved across sessions.
- **Requirements:**
  - Supabase Auth: Email/Password + Google OAuth
  - Signup → redirect to Onboarding (if new) or Dashboard (if returning)
  - Session token stored client-side, auto-refresh handled by Supabase SDK
- **API:** Handled directly by Supabase client SDK (no custom backend endpoint needed)
- **Acceptance Criteria:**
  - [ ] User can sign up with email/password
  - [ ] User can log in with Google
  - [ ] Logged-in state persists on page refresh
  - [ ] Logout clears session

### 0.2 Global Data Model (Reference — used across all features)
```
users
  id (uuid, PK)
  email (text)
  name (text)
  last_active_roadmap_id (uuid, FK → roadmaps.id, nullable)   -- which track user last viewed
  created_at (timestamp)

profiles
  user_id (uuid, FK → users.id)
  interests (text[])
  skill_level (text: beginner/intermediate/advanced)   -- overall self-rating, collected once
  weekly_time_hours (int)                              -- collected once, applies to all tracks by default
  learning_style (text)                                -- collected once via the chat portion of onboarding
  past_experience (jsonb)
  created_at (timestamp)

evidence
  id (uuid, PK)
  user_id (uuid, FK)
  roadmap_id (uuid, FK → roadmaps.id, nullable)   -- which track this evidence belongs to
  skill_name (text)
  score (int, 0-100)
  source (text: quiz/project/course_completion)
  status (text: verified/developing/weak_spot/self_declared)
  recorded_at (timestamp)

role_requirements
  id (uuid, PK)
  role_name (text)
  skill_name (text)
  target_score (int, 0-100)       -- expected proficiency for this role

roadmaps
  id (uuid, PK)
  user_id (uuid, FK)
  target_role (text)              -- e.g. "Machine Learning", "Java Backend", "MERN Stack" — one row PER track
  path_json (jsonb)                -- {nodes:[], edges:[], milestones:[]}
  status (text: active/completed)  -- NOT deleted on completion — moved between groups in the UI
  completion_pct (int, 0-100)      -- denormalized for fast dropdown rendering, recomputed on every progress update
  readiness_score (int, 0-100)     -- snapshot from the evidence at generation time; radar re-reads live evidence
  created_at (timestamp)
  updated_at (timestamp)

progress
  id (uuid, PK)
  user_id (uuid, FK)
  roadmap_id (uuid, FK → roadmaps.id)   -- REQUIRED — every progress row belongs to exactly one track
  node_id (text)
  status (text: not_started/in_progress/completed)   -- NOTE: 'locked' removed — no locking mechanic anymore
  quiz_score (int, nullable)
  feedback (text, nullable: 'easy'/'hard'/'skip')
  completed_at (timestamp, nullable)

courses
  id (uuid, PK)
  title (text)
  tags (text[])
  difficulty (text)
  duration_hours (int)
  prerequisites (text[])
  link (text)
  type (text: course/project/assessment)
```

**Migration note (if evolving from the single-roadmap v2 schema):** add `roadmap_id` to `evidence` and `progress` (nullable during migration, backfill from the user's single existing roadmap, then treat as required for all new rows going forward); add `target_role`, `status`, `completion_pct`, `readiness_score` to `roadmaps`; drop the old `active_path` text column (replaced by `status`); add `last_active_roadmap_id` to `users`.

### 0.3 Non-Functional Requirements
- Page load < 3 seconds
- LLM response with streaming should start showing text within 2 seconds
- Mobile-responsive (judges may view on any device)
- All API keys in `.env`, never committed to GitHub

---

## 1. Onboarding (Hybrid: Quick Form + Short Chat)

**Owner:** [Assign name]

**User story:** As a new user, I want to quickly give the essentials (target role, experience, time) via a fast form, and then have a short natural conversation for the nuances (learning style, motivation), so I get to my first roadmap fast without either a boring long form or an unreliable fully-conversational extraction.

**Why hybrid (decision rationale):** A pure form feels like "just another form-fill app" and loses the AI-product feel. A pure chat-only flow is more impressive but carries extraction-reliability risk and takes longer to build/test. Splitting the load — form for objective/measurable fields, chat for subjective/nuanced fields — gets both speed and the "AI companion" demo feel.

### Functional Requirements
- FR1.1: **Quick Form step** — collects `target_role` (autocomplete against the supported roles list — see Section 4A), `skill_level` (beginner/intermediate/advanced self-rating), `weekly_time_hours` (slider or preset chips: 3/6/10/15+ hrs). These are structured, unambiguous fields — no AI extraction needed here, direct form binding.
- FR1.2: **Short Chat step** (2-4 exchanges max) — AI asks about `learning_style` (e.g. project-first vs structured-course-first) and any relevant `past_experience`/motivation context, extracting these into structured fields.
- FR1.3: If a chat answer is vague/incomplete, AI asks one clarifying follow-up (don't silently guess) — but cap at one follow-up per field to keep the chat short.
- FR1.4: Quick-reply chips shown alongside free text in the chat step where applicable
- FR1.5: At the end, show an editable "Profile Summary Card" combining both form + chat data — user must confirm before proceeding
- FR1.6: This full onboarding (form + chat) runs only **once** per user, at first signup. See Section 4A for the lighter-weight flow used when a returning user wants to start a *new* track for a different `target_role`.

### API Contract
```
POST /api/onboarding/chat
Request: { user_id, conversation_history[], latest_message }
Response: { ai_reply, extracted_fields: { learning_style, past_experience }, is_complete }

POST /api/onboarding/confirm
Request: { user_id, final_profile: { target_role, skill_level, weekly_time_hours, learning_style, past_experience } }
Response: { success, profile_id }
```
Note: `target_role`, `skill_level`, `weekly_time_hours` arrive directly from the form (client-side state), not via `/api/onboarding/chat` — only `learning_style`/`past_experience` go through the chat-extraction endpoint.

### Acceptance Criteria
- [ ] Form fields (target_role, skill_level, weekly_time_hours) are captured with zero AI dependency — a network-down LLM never blocks this step
- [ ] Chat step completes in 2-4 exchanges for a typical user (test with both clear and vague answers)
- [ ] Vague chat answers trigger exactly one follow-up, never more
- [ ] Profile Summary Card is editable before confirmation
- [ ] Data correctly saved to `profiles` table, and the chosen `target_role` correctly kicks off the first `roadmaps` row (Section 4A)

---

## 2. Skill Verification (Quiz-Based Evidence) — NEW

**Owner:** [Assign name]

**User story:** As a user, I want my self-declared skills to actually be checked, not just taken on my word, so my roadmap is built on evidence not guesses.

### Functional Requirements
- FR2.1: After onboarding, present a short quiz (3-5 questions) pulled from a question bank tagged by skill/topic
- FR2.2: Score each answered question; compute a per-skill verified score (0-100)
- FR2.3: Skills not covered by the quiz stay "self-declared" (not verified) until covered by a future evidence source (completed course, project, etc.)
- FR2.4: Combine verified + self-declared signals into a single `readiness_score` for the target role (see formula below)
- FR2.5: `readiness_score = weighted average of (current_skill_score / target_skill_score)` across all skills relevant to the target role
- FR2.6: Every skill shown with a status badge: **Verified** (evidence-backed, high ratio), **Developing** (mid ratio), or **Weak spot** (low ratio, becomes a high-priority gap)

### API Contract
```
GET /api/assessment/quiz?target_role=xxx
Response: { questions: [{ id, skill_tag, question, options[] }] }

POST /api/assessment/submit
Request: { user_id, target_role, answers: [{ question_id, selected_option }] }
Response: {
  readiness_score,
  skills: [{ skill_name, current_score, target_score, status }],
  high_priority_gaps: [skill_name]
}
```

### Acceptance Criteria
- [ ] Readiness score recalculates correctly whenever new evidence (quiz, completed node) is added
- [ ] Skills never covered by any evidence source are clearly marked "self-declared", not silently treated as verified
- [ ] High-priority gaps list only skills below the low-ratio threshold
- [ ] Quiz completes in under 2 minutes for a 3-5 question set

---

## 3. Gap-Based Recommendation Engine (Backend Core)

**Owner:** [Assign name]

**User story:** As a user, I want the system to recommend real, relevant courses/projects in the correct order — prioritizing what's actually blocking my target role, not a generic course list.

### Functional Requirements
- FR3.1: Retrieve relevant items from `courses` table based on `target_role` tags (Stage 1 - filtering)
- FR3.2: Weight retrieval toward skills flagged as high-priority gaps from the Skill Verification step (Feature 2) — weak/missing skills surface earlier in the path
- FR3.3: Pass retrieved items + profile + gap data to LLM to generate ordered roadmap with reasoning (Stage 2)
- FR3.4: LLM must only select from provided course list — no hallucinated course names
- FR3.5: Output must match fixed JSON schema (see below), and each node is tagged with a stage: **Learn**, **Build**, or **Prove**
- FR3.6: If goal is broad/generic, generate 2-3 branching paths (see Feature 9)
- FR3.7: **Always creates a new `roadmaps` row for the given `target_role`** — never overwrites an existing roadmap. If an *active* (not completed) roadmap already exists for that exact `target_role`, return the existing one instead of creating a duplicate; if the target_role is new (or an old one was completed), create a fresh row. See Feature 4A.
- FR3.8: **LLM failure/timeout fallback (resolved decision):** if the LLM call fails or exceeds the timeout, do not fail the request — fall back to a deterministic, retrieval-only roadmap (Stage 1 output alone, ordered by gap-priority and prerequisite order, no AI-written `reasoning` text — use a template string instead, e.g. "Recommended based on your skill gaps"). The user should never see a hard error on this endpoint.

### API Contract
```
POST /api/roadmap/generate
Request: { user_id, target_role, profile: {...}, readiness: { skills: [...], high_priority_gaps: [...] } }
Response: {
  roadmap_id,
  target_role,
  status: "active",
  paths: [
    {
      path_name,
      nodes: [{ id, title, type, stage: "learn"|"build"|"prove", difficulty, duration_hours, prerequisites[], reasoning, match_score }],
      edges: [{ from, to }],
      milestones: [{ id, title, node_ids[] }]
    }
  ]
}
```

### Acceptance Criteria
- [ ] Every recommended course exists in the `courses` table (zero hallucination in 10 test runs)
- [ ] Roadmap respects prerequisite order (no course appears before its prerequisite)
- [ ] Nodes addressing a high-priority gap appear earlier in the sequence than nodes covering already-verified skills
- [ ] Every node carries a valid `stage` value (learn/build/prove)
- [ ] Response time < 8 seconds for roadmap generation
- [ ] Output always valid JSON matching schema (test with malformed/edge-case profiles)
- [ ] Calling this endpoint twice with the same `target_role` for the same user does not create two active roadmaps
- [ ] Simulated LLM failure/timeout still returns a usable roadmap (fallback), never a raw error to the user

---

## 4. Interactive Roadmap (Visual) — No Locking

**Owner:** [Assign name]

**User story:** As a user, I want to see my learning path as a visual, explorable map, and I want to be free to work on whatever node I want — not be blocked from a topic just because I haven't finished an earlier one.

**Resolved decision:** the earlier locked/unlocked node-gating mechanic is **removed**. All nodes in a roadmap are clickable and workable from the start (roadmap.sh-style). This also simplifies the adaptive logic — there's no "unlock the next node" rule to maintain anymore (see Feature 11).

### Functional Requirements
- FR4.1: Render `nodes` + `edges` using React Flow (or the custom SVG flow/tree views already prototyped)
- FR4.2: Support zoom (scroll/pinch) and pan (drag)
- FR4.3: Node color reflects status: **not_started** (grey), **in_progress** (yellow), **completed** (green) — there is no "locked" status/color anymore
- FR4.4: Exactly one node may carry a **"Suggested next"** badge at a time — computed as the highest-priority not_started node addressing a high-priority gap. This guides the user without blocking access to any other node.
- FR4.5: Clicking any node (regardless of status) opens a side panel showing: title, reasoning, resources link, duration, match score
- FR4.6: Milestones visually grouped (bounding box/cluster label) around their child nodes
- FR4.7: If branching exists, show a path-switch tab at top
- FR4.8: This entire roadmap view is scoped to **one `roadmap_id`** at a time — see Feature 4A for how the user switches between multiple tracks

### Acceptance Criteria
- [ ] Roadmap renders correctly for roadmaps with 10, 30, and 50+ nodes (no overlap/broken layout)
- [ ] Zoom/pan works smoothly on both desktop and mobile
- [ ] Clicking any node opens correct side panel data within 300ms
- [ ] Node color updates immediately after marking a course complete
- [ ] No node is ever visually or functionally blocked from being opened, regardless of prerequisite completion

---

## 4A. Multi-Track Roadmap Management — NEW

**Owner:** [Assign name]

**User story:** As a user exploring more than one career direction, I want each target role I've looked into (e.g. Machine Learning, then later Java, then MERN Stack) to have its own separate roadmap and progress — never overwritten — and I want one simple way to switch between them that updates everything on screen at once.

### Functional Requirements
- FR4A.1: **"Add a new skill/role" entry point** — visible from the Dashboard/Roadmap header at all times (not just at first signup). Triggers a lightweight re-entry flow: just a `target_role` picker + the Skill Check quiz for that role (reuses the user's existing `weekly_time_hours`/`learning_style` from their profile — does not repeat the full onboarding).
- FR4A.2: Submitting a new target role always calls `/api/roadmap/generate` with that `target_role`, which creates a **new, independent `roadmaps` row** (see FR3.7) — the user's existing tracks are never touched.
- FR4A.3: **Global Track Selector** — a single dropdown/switcher component, present on Roadmap, Radar, AI Sidebar, and Dashboard screens, showing the user's tracks grouped into **"Active"** and **"Completed"**.
- FR4A.4: Selecting a track in this selector updates **all four surfaces simultaneously** (Roadmap view, Radar chart, AI Sidebar context, Dashboard stats) to that track's `roadmap_id` — there is exactly one "currently viewed track" concept shared app-wide, not separate selectors per screen.
- FR4A.5: The selected `roadmap_id` is persisted to `users.last_active_roadmap_id` so a returning user's dashboard opens on the track they were last viewing.
- FR4A.6: When a track's `completion_pct` reaches 100, its `roadmaps.status` flips from `active` to `completed` and it **moves from the "Active" group to the "Completed" group** in the selector — it is never deleted; all its data (roadmap, progress, evidence) remains queryable.
- FR4A.7: The selector shows, per track: `target_role` name, a small completion-progress indicator, and (for active tracks) the current readiness_score.

### API Contract
```
GET /api/roadmaps/list?user_id=xxx
Response: {
  active: [{ roadmap_id, target_role, completion_pct, readiness_score, created_at }],
  completed: [{ roadmap_id, target_role, completion_pct, completed_at }]
}

POST /api/onboarding/new-track
Request: { user_id, target_role }
Response: { quiz: { questions: [...] } }   -- reuses existing profile fields, only asks the new role + runs its quiz

PATCH /api/users/last-active-roadmap
Request: { user_id, roadmap_id }
Response: { success: true }
```

### Acceptance Criteria
- [ ] Generating a roadmap for a new target_role never modifies or deletes an existing roadmap
- [ ] Switching the track selector updates Roadmap, Radar, Sidebar, and Dashboard together, within one interaction (no stale data on any of the four surfaces)
- [ ] A track that reaches 100% completion automatically moves to the "Completed" group on the next data refresh
- [ ] Reopening the app lands the user on the track they last viewed (`last_active_roadmap_id`)
- [ ] Completed tracks remain fully viewable (read-only roadmap + historical progress), just grouped separately

---

## 5. Skill Gap Radar Chart (Per-Track)

**Owner:** [Assign name]

**User story:** As a user, I want to see visually where my skills stand vs what my current track's target role requires — and if I'm exploring multiple roles, I want a separate radar for each one, easy to switch between.

### Functional Requirements
- FR5.1: Calculate current skill scores from the latest `evidence` rows scoped to the selected `roadmap_id`'s `target_role`
- FR5.2: Calculate target skill scores from `role_requirements` for that `target_role`
- FR5.3: Render as radar/spider chart (Recharts) with both current and target overlaid
- FR5.4: Minimum 5 skill axes shown, dynamically based on the target role
- FR5.5: **Chart header shows the track name with a clear label**, e.g. "Machine Learning Focus", plus the Global Track Selector (Feature 4A) so the user can switch which track's radar they're viewing without leaving the screen
- FR5.6: When the selector switches tracks, the radar re-renders for the newly selected `roadmap_id` — this is the same shared selector driving Roadmap/Sidebar/Dashboard too, not a radar-only dropdown

### API Contract
```
GET /api/dashboard/skill-radar?roadmap_id=xxx
Response: { target_role, skills: [{ skill_name, current_score, target_score }] }
```

### Acceptance Criteria
- [ ] Chart updates automatically when a new course is marked complete, for the currently selected track only
- [ ] Chart shows minimum 5, maximum 8 skill axes (avoid clutter)
- [ ] Current vs target visually distinguishable (different colors/fill)
- [ ] Switching tracks via the selector correctly re-fetches and re-renders the radar for the new `roadmap_id`
- [ ] A track's radar disappears from the "Active" selector group once it reaches 100% completion (Feature 4A)

---

## 6. Progress Dashboard

**Owner:** [Assign name]

**User story:** As a user, I want one place to see my overall progress, stats, and what to do next.

### Functional Requirements
- FR6.0: **Career Readiness hero card** — big readiness % (from Feature 2's `readiness_score`), count of high-priority gaps, count of verified skills, **for the currently selected track** (Feature 4A). Also shows the Global Track Selector so the user can jump to another track's dashboard view.
- FR6.1: Hero stats: streak (consecutive active days across the selected track), XP (points per completed node), completion %, time-to-goal estimate
- FR6.2: Embedded mini-roadmap preview (click → navigates to full roadmap for the selected track)
- FR6.3: Skill radar chart (Feature 5), scoped to the selected track
- FR6.4: Horizontal milestone timeline (completed vs upcoming)
- FR6.5: "Suggested next action" card — points to the same single node carrying the "Suggested next" badge in Feature 4 (no longer described as "unlocked" since there's no locking — it's a priority suggestion, not a gate)
- FR6.6: Activity heatmap (daily activity, last 90 days, across all tracks combined)

### API Contract
```
GET /api/dashboard/summary?roadmap_id=xxx
Response: {
  target_role, readiness_score, high_priority_gap_count, verified_skill_count,
  streak_days, xp_total, completion_pct, time_to_goal_weeks,
  next_action: { node_id, title, reason },
  activity_heatmap: [{ date, active }]
}
```

### Acceptance Criteria
- [ ] All stats reflect real-time data (no stale cache after marking progress)
- [ ] Readiness score updates immediately after new evidence (quiz retake, node completion)
- [ ] "Suggested next action" always points to a valid not_started node (any node is technically workable, this is just the priority suggestion)
- [ ] Dashboard loads in < 2 seconds
- [ ] Switching the Global Track Selector correctly reloads all dashboard stats for the newly selected `roadmap_id`

---

## 7. AI Explanation Sidebar

**Owner:** [Assign name]

**User story:** As a user, I want to ask the AI why something was recommended or ask general questions, with answers relevant to my situation.

### Functional Requirements
- FR6.1: Persistent floating panel accessible from any screen
- FR6.2: Clicking a roadmap node auto-populates a suggested question ("Why is this recommended?")
- FR6.3: Responses structured as: Reason / Prerequisite link / Time fit (not plain paragraph)
- FR6.4: Text streams word-by-word
- FR6.5: Maintains conversation context within session

### API Contract
```
POST /api/assistant/ask
Request: { user_id, question, context: { node_id (optional), roadmap_id } }
Response: (streamed) { reply_chunks[] }
```

### Acceptance Criteria
- [ ] Node-linked questions return answers referencing that specific node's reasoning (not generic)
- [ ] Response starts streaming within 2 seconds
- [ ] Sidebar accessible without losing current page state

---

## 8. AI Confidence / Match Score

**Owner:** [Assign name]

**User story:** As a user, I want to know how well each recommendation actually fits me.

### Functional Requirements
- FR7.1: Every node includes a `match_score` (0-100) generated by LLM during roadmap generation
- FR7.2: If LLM score missing/invalid, calculate via backup formula:
  `match_score = (goal_alignment × 0.4) + (skill_readiness × 0.35) + (time_fit × 0.25)`
- FR7.3: Score badge color: green (90+), yellow (70-89), orange (<70)
- FR7.4: Hover/tap shows breakdown of the 3 components

### Acceptance Criteria
- [ ] Every single node has a valid score between 0-100 (no nulls in production)
- [ ] Backup formula triggers automatically if LLM omits score (test by mocking missing field)
- [ ] Breakdown tooltip shows all 3 components summing logically to the total

---

## 9. Branching Career Paths

**Owner:** [Assign name]

**User story:** As a user with a broad goal, I want to see multiple valid directions and choose one.

### Functional Requirements
- FR8.1: System detects "generic" goals (e.g. via keyword check or LLM classification) and triggers branching
- FR8.2: Generate 2-3 complete path options, each precomputed and stored
- FR8.3: "Choose Your Path" screen shows preview cards (name, duration, top skills, mini-map thumbnail)
- FR8.4: User can switch paths later without losing completed-node progress on shared/overlapping nodes

### Acceptance Criteria
- [ ] Broad goal (e.g. "data science") produces 2+ distinct paths
- [ ] Specific goal (e.g. "React advanced developer") produces exactly 1 path (no unnecessary branching)
- [ ] Switching paths preserves progress on any node common to both paths

---

## 10. AI Insights (Proactive Card)

**Owner:** [Assign name]

**User story:** As a user, I want the AI to proactively tell me useful things instead of me having to ask.

### Functional Requirements
- FR9.1: Rule-based triggers checked on dashboard load:
  - `days_inactive > 2` → inactivity nudge
  - `completion_rate > average_pace` → speed praise + stretch-goal suggestion
  - `quiz_score < 60%` on any node → review suggestion
- FR9.2: Triggered insight converted to natural language via LLM call
- FR9.3: Each insight includes one actionable button (e.g. "Add stretch goal", "Quick 15-min task")
- FR9.4: Multiple insights rotate in a carousel if more than one is active

### Acceptance Criteria
- [ ] Each trigger condition tested independently and produces correct insight
- [ ] No insight shown if no trigger conditions are met (empty state handled gracefully)
- [ ] Action buttons perform the correct navigation/action when clicked

---

## 11. Adaptive Feedback Loop

**Owner:** [Assign name]

**User story:** As a user, I want my roadmap to adjust based on how I'm actually doing, not stay static.

### Functional Requirements
- FR10.1: On node completion, capture quiz_score and optional feedback (👍/👎/⏭️)
- FR10.2: If quiz_score < 60%, insert a review/practice node after the current one
- FR10.3: If feedback = 'skip' or repeated 'easy', re-trigger recommendation engine for remaining **not_started/in_progress** nodes only — completed nodes are never touched (no "unlocked/locked" distinction anymore, since Feature 4 removed locking entirely)
- FR10.4: Roadmap UI shows animated transition when nodes change (not instant reload)
- FR10.5: Toast notification confirms update: "Roadmap updated based on your progress ✨"

### API Contract
```
POST /api/roadmap/adapt
Request: { user_id, roadmap_id, trigger_type, node_id, feedback_data }
Response: { updated_nodes[], updated_edges[], message }
```

### Acceptance Criteria
- [ ] Completed nodes remain unchanged after any adaptation event
- [ ] Low quiz score reliably inserts a review node right after the current one, immediately accessible (not gated behind anything)
- [ ] UI animation runs without layout break for graphs of 30+ nodes

---

## 12. Demo Safety / Fallback Mode

**Owner:** [Assign name — recommend PM/Lead]

### Functional Requirements
- FR11.1: Pre-generate and store `sample_roadmap.json` for 2-3 representative profiles
- FR11.2: Hidden toggle (keyboard shortcut or query param) to switch to demo mode, bypassing live LLM calls
- FR11.3: Demo mode data must exercise all major features (radar chart, branching, confidence scores) so nothing looks broken on switch

### Acceptance Criteria
- [ ] Demo mode can be triggered in under 5 seconds during a live presentation
- [ ] All dashboard/roadmap features work fully in demo mode without any API dependency

---

## 13. Future Roadmap (Post-Hackathon / If Time Permits)

**Status:** Not in P0/P1 scope. Present in the pitch as vision/roadmap slides, not as working demo features. Only pull items into active build if P0+P1 finish early.

| Feature | What it adds | Why it's deferred |
|---|---|---|
| Debugging-lab evidence | Verify skills by having the user fix real broken code, not just answer quiz questions | Needs its own grading pipeline — separate from the quiz engine in Feature 2 |
| AI-interview evidence | "Explain your code/reasoning" conversational assessment, graded by LLM | Subjective grading, consistency risk — needs more validation than hackathon time allows |
| Career simulation ("what-if") | Real-time recompute of readiness/path under hypothetical constraints (less time, different role, skip a topic) | Build-heavy: needs a fast recompute path on top of the full recommendation engine |
| Full interactive evidence graph | Rich node-and-edge visualization of every skill and its evidence trail | UI-heavy; current radar chart (Feature 5) + skill status badges (Feature 2) cover the same information more simply |

---

## Definition of "Done" (applies to every feature above)
A feature is only marked complete when:
1. All Functional Requirements implemented
2. All Acceptance Criteria checked off
3. Tested on both desktop and mobile viewport
4. No console errors
5. Connected end-to-end with real Supabase data (not just mock/hardcoded data)

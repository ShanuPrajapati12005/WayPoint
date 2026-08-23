# Antigravity Prompt — Waypoint Frontend, Premium UI Build

> **How to use this:** Copy everything below into Antigravity as one message. It is written to be self-contained — product context, every screen, every feature discussed, and an explicit design quality bar. If Antigravity has access to the repo, tell it to also read `docs/PRD.md`, `docs/project-brief.md`, and `docs/Implementation-Plan.md` first, and to inspect `waypoint-prototype-v3-desktop-demo.jsx` as a **structural/flow reference only** — not a visual quality bar to copy.

---

## Role

You are the design lead at a small product studio known for shipping interfaces that could not be mistaken for a generic AI-generated template. A client has already rejected a first pass because it was "enhanced but not good" — competent, functional, but visually forgettable. This second pass needs an actual point of view: a real design decision, executed with precision, not just more polish sprinkled on the same generic layout.

Do not default to any of these three looks that AI-generated UI clusters around unless I explicitly ask for one: (1) warm cream background with a serif display and a terracotta accent, (2) near-black background with a single neon/acid accent, (3) broadsheet layout with hairline rules and zero border-radius. None of these fit a career-readiness product. Make a deliberate choice instead — see the Design Direction section below, which you should treat as a starting point to refine, not override.

---

## Product Context (read this fully before designing anything)

**Product:** Waypoint — an AI career readiness and adaptive learning path recommender. It does not just answer "what should I learn." It **verifies** a user's self-declared skills via a short quiz, **identifies the gap** against a chosen target career role, and then builds a **Learn → Build → Prove** roadmap that prioritizes closing the highest-impact gaps first. A user can run this process for **multiple target roles in parallel** (e.g. Machine Learning, then later Java, then MERN Stack) — each is a fully independent track, switchable from one global selector.

**Positioning line to design around:** *"Stop guessing what to learn. Find out if you're actually ready."* The entire visual tone should feel credible, evidence-driven, and calm — not gamified or hype-y. Think "a serious tool that respects your time and tells you the truth," not "a course marketplace trying to sell you something."

**Tech constraints:** React + Tailwind CSS + shadcn/ui components. Backend is a separate FastAPI service — build the frontend against the API contracts below, with realistic mock data where the backend isn't wired yet.

---

## Design Direction (refine this — don't skip it)

Before writing any component code, produce a short design plan and follow it consistently:

- **Color:** Define 4–6 named hex values. Starting point (adapt, don't just copy verbatim): a soft, cool off-white/light-grey canvas (not stark white) so that elevated white/near-white cards visually separate from the page at a glance; one restrained indigo/blue accent for primary actions and focus states; a teal/green for verified/success states; an amber for warnings/weak-spot states. Push this further than "corporate SaaS default" — consider a slightly unusual accent shade, a subtle warm or cool tint in the neutrals, or a second, sparingly-used accent for the "evidence/verified" concept specifically, so the palette has a point of view instead of feeling like unstyled shadcn defaults.
- **Type:** Pick a real pairing — a display/heading face with some character (not generic system sans for headings) used with restraint, plus a highly legible body face, plus a monospace face for data/labels/scores (percentages, stats, badges) to reinforce the "evidence-based, measurable" feel. Define a clear type scale.
- **Layout:** Generous whitespace, a consistent spacing scale, clear visual hierarchy. Cards are elevated (subtle shadow or border) and clearly distinct from the page background — this is a hard requirement, not a suggestion.
- **Signature element:** Decide on the one visual device this product will be remembered by — a strong candidate given the product is the **Readiness Score presentation** (the circular/radial score treatment used on the Skill Check reveal and Dashboard hero) — make it genuinely well-crafted and reuse it consistently, rather than treating it as one card among many.
- **Motion:** Deliberate, not scattered — track-switch transitions, node hover states, the toast on adaptive feedback, a page-load moment on the Landing page. Respect reduced-motion preferences. Favor one or two orchestrated moments over animation sprinkled everywhere.

Build to a quality floor regardless of direction chosen: fully responsive down to mobile, visible keyboard focus states, real (not lorem-ipsum) copy throughout written in plain, active-voice, end-user language — never system/developer language (e.g. "See if you're ready," never "Submit assessment payload").

---

## Full Screen-by-Screen Spec (every feature discussed must be present)

### 1. Landing Page
- Hero built around the positioning line above — this is the thesis of the page, not a generic "big headline + gradient" template unless that's genuinely the best answer here.
- A short "how it works" sequence: Verify → Diagnose → Build & Prove.
- A feature section covering: evidence-backed skills (not self-declared), gap-based roadmap (not a generic course list), AI explanations (not a black box), a readiness dashboard.
- Realistic stats/social-proof band and one testimonial.
- Primary CTA → Sign Up. Secondary → Log In.

### 2. Auth — Sign Up / Log In
- Email/password + a Google OAuth-style button on both.
- Sign Up: name, email, password (with show/hide toggle), real inline validation (invalid email format, password length) — errors appear only after interaction, never on first render.
- Log In: email, password, "forgot password" link.
- New users land in Onboarding after Sign Up; returning users land on their Dashboard after Log In.

### 3. Onboarding — Hybrid (Quick Form + Short Chat)
- **Form portion (no AI dependency, must never block on network):** target role (autocomplete against a supported-roles list), self-rated skill level, weekly time budget.
- **Chat portion (2–4 exchanges max):** a short conversational step that extracts learning style and motivation/context. Vague answers get exactly one clarifying follow-up, never more.
- Ends in an editable "Profile Summary" card combining both — user must confirm before continuing.

### 4. Skill Check (Quiz-Based Evidence)
- 3–5 multiple-choice questions, one skill tag each, clean single-question-at-a-time or short-list layout — should feel quick, not like a formal exam.
- On submit: a **Readiness Reveal** view — the signature Readiness Score treatment, a grid of skill cards each labeled **Verified / Developing / Weak spot** with color coding, and a callout naming the highest-priority gaps. This score and skill breakdown must **visually reappear consistently** later (Dashboard, Track Selector) — establish the pattern here.

### 5. Path Select
- When the target role is broad, present 2–3 AI-generated path options as comparable cards (name, short description, what's shared vs unique) — never more than 3.

### 6. Roadmap — Flow View & Tree View (No Locking)
- Two switchable views of the same roadmap data.
  - **Flow view:** a connected flowchart layout, nodes positioned and linked with clear directional connectors.
  - **Tree view:** the same nodes grouped into expandable/collapsible branches (Foundations / Core Build / Advanced-Capstone, or similarly track-agnostic labels).
- **Every node is clickable and workable from the start — there is no locked/greyed-out state.** Exactly one node at a time carries a **"Suggested next"** treatment (the highest-priority not-yet-started node) — visually distinct but never gating.
- Node states: not started, in progress, completed — each with a distinct but restrained visual treatment.
- Clicking any node opens the AI Sidebar (below).

### 7. Global Track Selector
- One shared selector component — present on the Roadmap and Dashboard headers — showing the user's tracks grouped into **Active** and **Completed**, each with a completion indicator.
- Switching tracks updates Roadmap, Radar, Sidebar, and Dashboard together — there is exactly one "currently viewed track" concept, not per-screen state.
- Includes an **"Add a new skill"** action that leads to a lightweight re-entry (just a target-role picker, reusing the rest of the profile) rather than the full onboarding again.
- A track that reaches 100% completion moves from Active to Completed — never deleted.

### 8. AI Explanation Sidebar
- Opens when any roadmap node is clicked. Shows: why this node is recommended (Reason), what it depends on (Prerequisite), whether it fits the user's time budget (Time-fit), and a match-score breakdown (goal alignment / skill readiness / time fit, each as its own indicator).
- **Adaptive Feedback controls:** "Easy / Too hard / Skip" — triggers a toast confirming the roadmap adapted (only future, not-yet-completed nodes are ever affected — this guarantee should be implicit in the calm, non-alarming tone of the toast, not stated as a disclaimer).
- A disabled/placeholder follow-up question input (real Q&A wiring happens at the API-integration stage).

### 9. Dashboard
- **Career Readiness hero** — the signature score treatment again, plus high-priority-gap count and verified-skill count, scoped to the currently selected track, with the Global Track Selector alongside it.
- Stat row: streak, XP, completion %, estimated time remaining.
- Skill radar chart for the selected track, clearly labeled with the track/focus name (e.g. "Machine Learning Focus").
- A "suggested next action" card linking back to the roadmap.
- A milestone timeline (Foundations → Core Build → Advanced/Capstone) reflecting real per-track progress.
- An AI Insights card — a small rotating set of proactive, rule-based observations (pace, streak, a weak quiz result) with a suggested action each.
- A "Coming soon" band naming future features honestly (career simulation, deeper evidence types) so nothing in-progress is presented as finished.

### 10. Toast / Notification system
- One consistent toast pattern used for the adaptive-feedback confirmation and any other system confirmations — calm, brief, dismissible, never stacking chaotically.

---

## API Contracts to Build Against (use realistic mocked data matching these shapes until wired to the real backend)

```
POST /api/onboarding/chat            → { reply, extracted_fields: { learning_style, past_experience } }
POST /api/onboarding/confirm         → { profile_id }
GET  /api/assessment/quiz            → { questions: [{ id, skill_tag, question, options[] }] }
POST /api/assessment/submit          → { readiness_score, skills: [{ skill_name, current_score, target_score, status }], high_priority_gaps[] }
POST /api/roadmap/generate           → { roadmap_id, target_role, paths: [{ path_name, nodes: [{id,title,type,stage,difficulty,duration_hours,prerequisites[],reasoning,match_score,status}], edges[], milestones[] }] }
POST /api/roadmap/adapt              → { updated_nodes[] }   -- completed nodes never change
GET  /api/roadmaps/list              → { active: [{roadmap_id,target_role,completion_pct,readiness_score}], completed: [...] }
POST /api/onboarding/new-track       → { quiz: { questions[] } }
PATCH /api/users/last-active-roadmap → { success: true }
POST /api/assistant/ask              → { reply }  (streamed)
GET  /api/dashboard/summary          → { readiness_score, high_priority_gap_count, verified_skill_count, streak_days, xp_total, completion_pct, time_to_goal_weeks, next_action, activity_heatmap[] }
GET  /api/dashboard/skill-radar      → { target_role, skills: [{skill_name,current_score,target_score}] }
```

---

## Process (follow this order)

1. Write a short design plan first (palette with named hex values, type pairing, layout concept, signature element) — a few sentences each, not a full essay.
2. Self-critique that plan against the three generic-AI-look traps above before writing any code — if any part of it is the default answer you'd give to any similar brief, revise it and note what changed.
3. Build screen by screen in the order listed above, reusing one consistent component/token system throughout — the Readiness Score treatment, card styles, and button styles should feel like the same product on every screen, not restyled per-screen.
4. Before considering it done, check: does every feature listed above actually exist on screen? Is any card sitting flush against the page background instead of visually separated? Is any copy still generic/placeholder? Is the roadmap enforcing locking anywhere? Fix anything that fails this check.

---

## Explicit Non-Negotiables (recap)

- No locking on roadmap nodes, anywhere, ever — only a "suggested next" highlight.
- Global Track Selector must genuinely share state across Roadmap/Radar/Sidebar/Dashboard — not four separate switchers.
- Page background is never plain white; cards are always visually distinct from it.
- Copy is real, plain, active-voice, end-user language everywhere — no lorem ipsum, no developer-facing wording.
- This should read as a considered, premium product — not a shadcn starter template with the product's colors swapped in.

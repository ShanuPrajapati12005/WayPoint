# WayPoint — Backend API Contract

> **This is the single source of truth for the backend member.**
> The frontend is already built against these exact shapes (`waypoint-app/src/services/api.js`).
> Match the JSON keys below and the frontend works with **zero changes** — we just flip `VITE_USE_MOCK=false`.

---

## 0. The one thing to understand first

**The frontend computes its own metrics.** Do **not** compute readiness %, completion %, gap counts,
"suggested next step", or weeks-to-goal on the backend. The UI derives all of those **client-side** from
the raw `nodeMap` + `skillData` you return (see helpers in `src/data/tracks.js`:
`trackReadinessPct`, `trackCompletionPct`, `rankedGaps`, `estimatedWeeksToGoal`, …).

**You return raw structured data. The UI does the math.**
The only score you grade server-side is the quiz `readiness_score` (endpoint 5).

This keeps your job small: persist data, generate roadmaps with the LLM, grade the quiz. That's it.

---

## 1. Base URL & conventions

- **Base URL:** every endpoint is served under one FastAPI base URL, given to the frontend as
  `VITE_API_BASE_URL` (e.g. `https://waypoint-api.onrender.com`). All paths below are relative to it.
- **Content type:** `application/json` for all requests and responses.
- **Success envelope:** every success response includes `"success": true`.
- **Error envelope:**
  ```json
  { "success": false, "error": { "code": "invalid_credentials", "message": "Invalid email or password" } }
  ```
  with the matching HTTP status (400 / 401 / 404 / 500). Keep `message` user-safe — the UI may show it.
- **Auth:** login & signup return a bearer token (JWT). The frontend will send it as
  `Authorization: Bearer <token>` on protected calls (small planned frontend addition — the shapes below
  are what you return).
- **CORS:** allow the Vercel origin **and** `http://localhost:5180` (local dev). See `README.md`.

---

## 2. Shared data shapes

Referenced by multiple endpoints. **Source of truth: `waypoint-app/src/data/tracks.js`.**

### 2.1 Track object
```json
{
  "id": "ml",
  "label": "Machine Learning Engineer",
  "status": "active",           // "active" | "completed"
  "nodeMap": { "f1": { Node }, "f2": { Node }, ... },
  "skillData": [ { Skill }, ... ],
  "reasoning": { "f1": { Reasoning }, ... }
}
```

### 2.2 Node — `nodeMap` is an **object keyed by node id**
```json
"f1": {
  "title": "Python for Data Science",
  "status": "completed",        // "completed" | "in_progress" | "not_started"
  "match": 95,                  // int 0-100 — how well this step fits the user
  "duration": "2 wks",          // human string; frontend parses the leading number
  "stage": "learn"              // "learn" | "build" | "prove"
}
```
- **Node ids and order are fixed:** `["f1","f2","f3","d1","d2","m1","m2","m3"]` (`NODE_ORDER`).
- **Edges (the chain the graph draws) are fixed:** `f1→f2→f3→d1→d2→m1→m2→m3` (`EDGES`).
- **Stage convention in the mock:** `f*` = learn, `d*` = build, `m*` = prove (`m3` = capstone/prove).
  A generated roadmap may vary stages, but must keep the **8 ids**.

### 2.3 Skill — `skillData` is an **array** (drives the radar chart)
```json
{ "skill": "Python", "current": 8, "target": 9 }   // current/target on a 0-10 scale
```

### 2.4 Reasoning — object **keyed by node id** (powers the AI sidebar)
```json
"f1": {
  "reason":  "Python is the foundation for all ML work…",
  "prereq":  "None — this is your starting point",
  "time":    "Fits your 6 hrs/week in about 2 weeks"
}
```

### 2.5 Role ids
`ml` · `java` · `python` · `mern` · `devops` (see `SUPPORTED_ROLES` in tracks.js). Track ids == role ids.

---

## 3. Endpoints

> Each block shows the **exact frontend call** (from `api.js`), the request body, and the response.
> "FE call" = the function the frontend already invokes.

### 1) `POST /api/auth/signup`
**FE call:** `api.signup(email, password)`
```json
// request
{ "email": "user@example.com", "password": "min 6 chars" }
// response 200
{ "success": true, "user": { "id": "user-002", "email": "user@example.com" }, "token": "<jwt>" }
```
Hash passwords (bcrypt/argon2) — never store plaintext. Duplicate email → 400 with a clear message.

### 2) `POST /api/auth/login`
**FE call:** `api.login(email, password)`
```json
// request
{ "email": "user@example.com", "password": "…" }
// response 200
{ "success": true, "user": { "id": "user-001", "email": "user@example.com" }, "token": "<jwt>" }
// response 401
{ "success": false, "error": { "code": "invalid_credentials", "message": "Invalid email or password" } }
```

### 3) `POST /api/onboarding/confirm`
**FE call:** `api.submitOnboarding(profileData)` — persist to the `users` row.
```json
// request (profileData — exactly these keys)
{
  "name": "Prashant",
  "email": "prashant@example.com",
  "targetRole": "Machine Learning Engineer",
  "skillLevel": "beginner",            // "beginner" | "intermediate" | "advanced"
  "weeklyTimeHours": 6,
  "learningStyle": "project-first",
  "pastExperience": "Basic Python knowledge"
}
// response 200 — echo back with id + isOnboarded
{ "success": true, "profile": { "…same fields…", "id": "user-001", "isOnboarded": true } }
```

### 4) `GET /api/assessment/quiz?target_role=ml`
**FE call:** `api.getQuiz(roleId)`
```json
// response 200
{
  "success": true,
  "questions": [
    { "q": "What does gradient descent minimize?", "options": ["A","B","C","D"] }
  ]
}
```
**⚠ Grading integrity:** do **NOT** include the `correct` index here. The mock bundled `correct` because it
graded in the browser; the real backend grades server-side (endpoint 5). Keep `correct` server-side only.
_(Question `q` + `options` shapes are identical to `QUIZ_QUESTIONS` in tracks.js.)_

### 5) `POST /api/assessment/submit`
**FE call:** `api.submitQuiz(roleId, answers)` — `answers` = array of selected option indices, one per
question, in order.
```json
// request
{ "target_role": "ml", "answers": [0, 2, 1, 3, 0] }
// response 200
{ "success": true, "readiness_score": 72, "correct_count": 5, "total_count": 7 }
```
Grading formula (keep it): `readiness_score = round(correct_count / total_count * 100)`.
You may enhance grading, but keep these three keys.

### 6) `GET /api/roadmaps/list`
**FE call:** `api.getRoadmaps()` — loads on app start (`AppContext`). **Most important payload — the whole app
renders from it.**
```json
// response 200 — data is an OBJECT keyed by track id (NOT an array)
{
  "success": true,
  "data": {
    "ml":     { Track },
    "java":   { Track },
    "python": { Track }
  }
}
```
Return every track the user has. Each value is a full Track (nodeMap + skillData + reasoning).

### 7) `POST /api/roadmap/generate`  ← **the LLM core**
**FE call:** `api.generateRoadmap(roleId)` — used by "Add a new skill" to build a roadmap for a new role.
```json
// request
{ "target_role": "devops", "profile": { "…user profile for personalization (optional)…" } }
// response 200
{ "success": true, "roadmap": { Track } }
```
This is where the LLM generates a personalized **Learn → Build → Prove** path. The returned object **must** be
a valid Track (8 nodes `f1..m3`, `skillData` array, `reasoning` per node). **Validate the LLM's JSON against the
Track shape before returning** (retry/repair on malformed output). Curated course names+links
(freeCodeCamp / YouTube / Coursera) can live in node titles or an optional `resources` array per node —
extra fields are safe; missing required ones break the UI.

### 8) `PATCH /api/roadmap/{trackId}/nodes/{nodeId}`
**FE call:** `api.updateNodeStatus(trackId, nodeId, status)` — fired when a user marks a node complete
(optimistic UI, so just persist).
```json
// request
{ "status": "completed" }            // "completed" | "in_progress" | "not_started"
// response 200
{ "success": true }
```
Also log the change to `progress_events` (see schema) — it powers the activity heatmap.

---

## 4. Optional / Phase-2 (AI sidebar) — wire **after** the core 8

The AI explanation sidebar renders from the `reasoning` object (already in each Track) plus canned streamed
answers. When ready to make follow-up Q&A live:

- **`POST /api/ai/ask`** (streaming — SSE or chunked): `{ "trackId", "nodeId", "question" }` → streamed text.
  PRD NFR: first token should appear **< 2s**.
- **`POST /api/roadmap/{trackId}/feedback`**: `{ "nodeId", "type" }` where `type` is one of the keys in
  `FEEDBACK_MESSAGES` (see tracks.js) → optionally `{ "success": true, "updatedRoadmap": { Track } }` for the
  adaptive loop.

These are **not called by the frontend yet** — treat as the final integration step; we'll finalize exact
shapes together when we wire the sidebar.

---

## 5. Field ownership cheat-sheet

| Field / metric | Who produces it |
|---|---|
| `nodeMap`, `skillData`, `reasoning`, `label`, `status`, node `match`/`duration`/`stage` | **Backend** (LLM + DB) |
| `readiness_score`, `correct_count`, `total_count` (quiz) | **Backend** (server-side grading) |
| Readiness %, completion %, gap counts, "suggested next", weeks-to-goal, projected readiness | **Frontend** (derived from nodeMap + skillData) |
| Auth `token`, `user.id` | **Backend** |
| Theme, demo-mode, active-track selection | **Frontend** (local/device state) |

Anything in the bottom "Frontend" row — **don't build it.** It already exists client-side.

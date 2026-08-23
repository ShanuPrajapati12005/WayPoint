# WayPoint — Backend: Start Here

You own the **backend only**: Python + FastAPI + Supabase + the LLM. The frontend is **done** and already
calls your endpoints through one seam (`waypoint-app/src/services/api.js`). Your job is to make the real
endpoints exist and match the contract — nothing in the UI needs to change.

---

## What WayPoint is (10-second version)
An AI career-readiness app: verify a user's skills with a quiz → find the gap vs a target role → generate a
personalized **Learn → Build → Prove** roadmap, with a skill-gap radar and an AI explanation sidebar.

## Your scope
1. **FastAPI** service exposing the 8 endpoints in [`API-Contract.md`](./API-Contract.md).
2. **Supabase (Postgres)** for persistence — run [`schema.sql`](./schema.sql).
3. **LLM & AI Engine** for `POST /api/roadmap/generate` (the roadmap generator). **You are the AI Engineer for this project.** See [`AI-Implementation-Guide.md`](./AI-Implementation-Guide.md) for prompts, RAG logic, and deterministic fallbacks.
4. Deploy to **Render**; hand back the base URL.

You do **not** touch React, styling, or metric calculations — the UI computes readiness/gaps/etc. itself
(see the cheat-sheet at the end of the contract).

---

## Architecture (decided — FastAPI-centric)

```
  Browser (Vercel)                 FastAPI (Render)              Supabase + LLM
  ────────────────                 ────────────────              ──────────────
  api.js  ──HTTP──▶  VITE_API_BASE_URL /api/*  ──▶  service-role DB access
                                                └──▶  LLM (roadmap generation)
```

The frontend talks to **one base URL** for everything. The browser never holds a Supabase or LLM key —
those live only in your backend `.env`. This keeps the whole secret surface on your side.

---

## The endpoints (summary — full detail in API-Contract.md)

| # | Method & path | Purpose | Notes |
|---|---|---|---|
| 1 | `POST /api/auth/signup` | Create user | return `token` |
| 2 | `POST /api/auth/login` | Authenticate | return `token` |
| 3 | `POST /api/onboarding/confirm` | Save profile | echo profile + `isOnboarded:true` |
| 4 | `GET  /api/assessment/quiz?target_role=` | Quiz questions | **omit** the correct answer |
| 5 | `POST /api/assessment/submit` | Grade quiz | returns `readiness_score` |
| 6 | `GET  /api/roadmaps/list` | All user tracks | object keyed by track id |
| 7 | `POST /api/roadmap/generate` | **LLM** builds a roadmap | validate JSON vs Track shape |
| 8 | `PATCH /api/roadmap/{trackId}/nodes/{nodeId}` | Update node status | log to `progress_events` |

Start with **6, 5, 3, 1, 2** (unblocks the whole app on real data), then **7** (LLM), then **8**.

---

## Environment variables

Copy [`.env.example`](./.env.example) → `.env` and fill in. **Never commit `.env`.** Required:

| Var | What |
|---|---|
| `LLM_API_KEY` | Your LLM provider key |
| `LLM_MODEL` | Model id |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB key (secret) |
| `JWT_SECRET` | Signs auth tokens |
| `FRONTEND_ORIGIN` | Allowed CORS origin (the Vercel URL) |
| `PORT` | Server port (Render sets this) |

## CORS (don't skip — the browser will block you otherwise)
Allow the Vercel origin **and** `http://localhost:5180` (the frontend dev port). FastAPI example:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ["FRONTEND_ORIGIN"], "http://localhost:5180"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Local run (suggested)
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install fastapi "uvicorn[standard]" supabase python-jose[cryptography] passlib[bcrypt] pydantic
uvicorn app.main:app --reload --port 8000
```
Then set the frontend to point at you (see next section).

---

## How the frontend switches from mock → your backend

The frontend ships with a mock data layer so demos work offline. Flipping to real is **two env vars** in
`waypoint-app/.env` — no code change:
```
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-render-url.onrender.com
```
With `VITE_USE_MOCK=true` (default) the app uses local mock data — great as a demo safety net.

**Integration test loop:** run your API locally on `:8000`, set `VITE_USE_MOCK=false` +
`VITE_API_BASE_URL=http://localhost:8000` in the frontend, `npm --prefix waypoint-app run dev`, and walk the
flow: onboarding → skill-check → roadmap → dashboard. If a screen renders, that endpoint's shape is correct.

---

## The LLM endpoint (`/api/roadmap/generate`) — the one that needs care
- Output **must** be a valid Track: 8 nodes `f1,f2,f3,d1,d2,m1,m2,m3`, a `skillData` array, and a
  `reasoning` entry per node. See §2 of the contract for exact shapes.
- **Validate + repair** the model's JSON before returning (Pydantic model of the Track; retry on failure).
- Personalize using the `profile` in the request (skill level, weekly hours, learning style).
- Curated resources (freeCodeCamp / YouTube / Coursera, name+link only) can go in node titles or an optional
  `resources` array per node.

## Definition of Done (from the PRD)
The demo must be **connected end-to-end with real Supabase data (not mock)**. When all 8 endpoints are live
and the frontend runs green with `VITE_USE_MOCK=false`, you're done.

## Files in this handoff
- [`API-Contract.md`](./API-Contract.md) — every endpoint, exact request/response.
- [`schema.sql`](./schema.sql) — the database, ready to run.
- [`AI-Implementation-Guide.md`](./AI-Implementation-Guide.md) — rules for LLM prompts, RAG, and fallbacks.
- [`.env.example`](./.env.example) — backend secrets template.
- The frontend seam you implement against: `waypoint-app/src/services/api.js`.
- Data shapes source of truth: `waypoint-app/src/data/tracks.js`.

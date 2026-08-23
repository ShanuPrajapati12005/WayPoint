-- ============================================================================
-- WayPoint — Supabase / PostgreSQL schema
-- Run in the Supabase SQL editor (or psql). Safe to re-run (IF NOT EXISTS).
--
-- Design note: the frontend renders from nodeMap + skillData + reasoning.
-- You can store those NORMALIZED (roadmap_nodes + skills tables) OR as JSONB
-- on the roadmaps row (node_map / skill_data / reasoning columns). Both are
-- provided — pick one and delete the other. Normalized is recommended because
-- it makes per-node progress + the activity heatmap trivial.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ─── users ──────────────────────────────────────────────────────────────────
create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  email             text unique not null,
  password_hash     text,                          -- null if using Supabase Auth
  name              text,
  target_role       text,
  skill_level       text check (skill_level in ('beginner','intermediate','advanced')),
  weekly_time_hours int  default 6,
  learning_style    text,
  past_experience   text,
  is_onboarded      boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── roadmaps (one per user per target role / track) ─────────────────────────
create table if not exists roadmaps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  role_id     text not null,                        -- 'ml' | 'java' | 'python' | 'mern' | 'devops'
  label       text not null,                        -- 'Machine Learning Engineer'
  status      text default 'active' check (status in ('active','completed')),
  -- Denormalized blobs (delete these three if you use the normalized tables below):
  node_map    jsonb,                                -- full nodeMap object
  skill_data  jsonb,                                -- full skillData array
  reasoning   jsonb,                                -- { f1: {reason,prereq,time}, ... }
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, role_id)
);

-- ─── roadmap_nodes (normalized nodeMap) ──────────────────────────────────────
create table if not exists roadmap_nodes (
  id          uuid primary key default gen_random_uuid(),
  roadmap_id  uuid references roadmaps(id) on delete cascade,
  node_key    text not null,                        -- 'f1'..'m3'
  title       text not null,
  status      text default 'not_started' check (status in ('completed','in_progress','not_started')),
  match       int  check (match between 0 and 100),
  duration    text,                                 -- '2 wks'
  stage       text check (stage in ('learn','build','prove')),
  order_index int  not null,                        -- position in NODE_ORDER (0..7)
  reason      text,                                 -- reasoning.reason
  prereq      text,                                 -- reasoning.prereq
  time_fit    text,                                 -- reasoning.time
  unique (roadmap_id, node_key)
);

-- ─── skills (normalized skillData — drives the radar chart) ───────────────────
create table if not exists skills (
  id          uuid primary key default gen_random_uuid(),
  roadmap_id  uuid references roadmaps(id) on delete cascade,
  skill       text not null,
  current     int check (current between 0 and 10),
  target      int check (target  between 0 and 10)
);

-- ─── quiz_questions (server-side answer key — NEVER sent to the client) ───────
create table if not exists quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  role_id       text not null,                      -- 'ml' ...
  q             text not null,
  options       jsonb not null,                     -- ["A","B","C","D"]
  correct_index int  not null,
  order_index   int  default 0
);

-- ─── quiz_attempts (skill-check submissions) ─────────────────────────────────
create table if not exists quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  role_id         text not null,
  answers         jsonb not null,                   -- [0,2,1,...]
  readiness_score int,
  correct_count   int,
  total_count     int,
  created_at      timestamptz default now()
);

-- ─── evidence (the "Prove" stage — portfolio / project links) ────────────────
create table if not exists evidence (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  roadmap_id  uuid references roadmaps(id) on delete cascade,
  node_key    text,                                 -- which node this proves
  type        text,                                 -- 'project' | 'certificate' | 'link'
  title       text,
  url         text,
  verified    boolean default false,
  created_at  timestamptz default now()
);

-- ─── progress_events (status changes over time — powers heatmap FR6.6) ────────
create table if not exists progress_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  roadmap_id  uuid references roadmaps(id) on delete cascade,
  node_key    text,
  new_status  text,
  created_at  timestamptz default now()
);

-- ─── indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_roadmaps_user  on roadmaps(user_id);
create index if not exists idx_nodes_roadmap  on roadmap_nodes(roadmap_id);
create index if not exists idx_skills_roadmap on skills(roadmap_id);
create index if not exists idx_attempts_user  on quiz_attempts(user_id);
create index if not exists idx_progress_user  on progress_events(user_id, created_at);

-- ─── Row Level Security note ─────────────────────────────────────────────────
-- FastAPI-centric design (recommended): the API uses the Supabase service-role
-- key server-side and enforces ownership in code, so RLS can stay OFF to start.
-- If you ever expose Supabase directly to the browser, enable RLS and add
-- per-user policies (auth.uid() = user_id) on every table above.

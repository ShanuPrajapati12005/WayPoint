/* ===================================================================
   WAYPOINT — API layer
   The single seam between the frontend and the backend. Two implementations
   with IDENTICAL signatures and return shapes:
     • mock — offline hardcoded data (default; a demo can never break)
     • real — fetch() calls to the FastAPI backend
   Which one runs is decided by VITE_USE_MOCK (see waypoint-app/.env.example):
     VITE_USE_MOCK=true  (or unset)  → mock   ← default, safe for demos
     VITE_USE_MOCK=false             → real   ← calls VITE_API_BASE_URL
   Because both objects expose the same shape, NO other file changes when we
   flip the flag. Contract: docs/backend/API-Contract.md
   =================================================================== */

import { TRACKS, QUIZ_QUESTIONS } from '../data/tracks';
import { supabase } from '../lib/supabaseClient';

// ─── Config ───
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // default → mock
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'waypoint-token';

// ─── Mock latency helper ───
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Real HTTP helper ───
// Prefixes the base URL, sends JSON, attaches the bearer token if we have one,
// and normalizes errors into a thrown Error the UI can surface.
async function http(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  
  let token = null;
  if (typeof localStorage !== 'undefined') {
    if (USE_MOCK) {
      token = localStorage.getItem(TOKEN_KEY);
    } else {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token || null;
    }
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Network error — could not reach the server. Check your connection.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON / empty response — leave data null */
  }

  if (!res.ok || (data && data.success === false)) {
    const msg = data?.error?.message || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ─── Mock implementation ───
const mock = {
  login: async (email, password) => {
    await delay(1000);
    if (password.length < 6) throw new Error('Invalid credentials');
    return { success: true, user: { id: 'user-001', email } };
  },
  signup: async (email, password) => {
    await delay(1000);
    return { success: true, user: { id: 'user-002', email } };
  },
  submitOnboarding: async (profileData) => {
    await delay(1200);
    return { success: true, profile: { ...profileData, id: 'user-001', isOnboarded: true } };
  },
  getQuiz: async (roleId) => {
    await delay(600);
    return { success: true, questions: QUIZ_QUESTIONS[roleId] || [] };
  },
  submitQuiz: async (roleId, answers) => {
    await delay(1500);
    const correctCount = answers.filter(
      (ans, i) => ans === QUIZ_QUESTIONS[roleId][i].correct
    ).length;
    const totalCount = QUIZ_QUESTIONS[roleId].length;
    const score = Math.round((correctCount / totalCount) * 100);
    return {
      success: true,
      readiness_score: score,
      correct_count: correctCount,
      total_count: totalCount,
    };
  },
  getRoadmaps: async () => {
    await delay(800);
    // Deep copy so mock data stays immutable
    return { success: true, data: JSON.parse(JSON.stringify(TRACKS)) };
  },
  generateRoadmap: async (roleId) => {
    await delay(2000);
    return { success: true, roadmap: TRACKS[roleId] };
  },
  updateNodeStatus: async (_trackId, _nodeId, _status) => {
    await delay(400);
    return { success: true };
  },
};

// ─── Real implementation (matches docs/backend/API-Contract.md) ───
// Persist the bearer token returned by login/signup so subsequent calls are authed.
function persistToken(res) {
  if (res?.token && typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, res.token);
  }
  return res;
}

const real = {
  login: (email, password) =>
    http('/api/auth/login', { method: 'POST', body: { email, password } }).then(persistToken),
  signup: (email, password) =>
    http('/api/auth/signup', { method: 'POST', body: { email, password } }).then(persistToken),
  submitOnboarding: (profileData) =>
    http('/api/onboarding/confirm', { method: 'POST', body: profileData }),
  getQuiz: (roleId) =>
    http(`/api/assessment/quiz?target_role=${encodeURIComponent(roleId)}`),
  submitQuiz: (roleId, answers) =>
    http('/api/assessment/submit', { method: 'POST', body: { target_role: roleId, answers } }),
  getRoadmaps: () => http('/api/roadmaps/list'),
  generateRoadmap: (roleId) =>
    http('/api/roadmap/generate', { method: 'POST', body: { target_role: roleId } }),
  updateNodeStatus: (trackId, nodeId, status) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}`, { method: 'PATCH', body: { status } }),
};

// The one export the app consumes. Flip VITE_USE_MOCK to switch.
export const api = USE_MOCK ? mock : real;

// Lets logout drop the stored bearer token (no-op in mock mode / when none set).
export function clearAuthToken() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

// ─── Route-guard helpers ───
// Auth is only enforced when talking to a real backend. In mock/demo mode the
// whole app stays open so a live demo can never get stuck behind a login wall.
export const AUTH_ENFORCED = !USE_MOCK;
export function hasAuthToken() {
  if (typeof localStorage !== 'undefined') {
    if (USE_MOCK) {
      return !!localStorage.getItem(TOKEN_KEY);
    } else {
      const keys = Object.keys(localStorage);
      return keys.some(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    }
  }
  return false;
}

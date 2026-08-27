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
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
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
    // FastAPI wraps HTTPException payloads in `detail`
    const detail = data?.detail;
    const detailMsg = typeof detail === 'string' ? detail : detail?.error?.message;
    const msg = data?.error?.message || data?.message || detailMsg || `Request failed (${res.status})`;
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
  onboardingChat: async (messages, roleId) => {
    await delay(1000);
    // Mock conversational flow — simulate 5 exchanges before "done"
    const userMsgCount = messages.filter((m) => m.role === 'user').length;
    const mockReplies = [
      'Hey there! 🚀 So tell me, what are you currently doing — college, job, or self-learning?',
      'Nice! Have you built any projects before? Any language or tool — big or small, everything counts!',
      'Awesome! What\'s your dream job? Startup, big tech, freelance — where do you see yourself?',
      'Solid goal! 💪 Tell me one strength that helps you in tech, and one thing you find challenging.',
      'Got it! How many hours per week can you dedicate to learning? Be honest — we\'ll build a realistic plan.',
    ];
    if (userMsgCount >= 5) {
      return {
        success: true,
        done: true,
        profile: {
          skillLevel: 'beginner',
          learningStyle: 'mixed',
          weeklyTimeHours: 6,
          pastExperience: 'Basic Python knowledge, small scripts',
          careerGoals: 'Become a Machine Learning Engineer at a top tech company',
          detailedContext: {
            education: 'B.Tech CS student',
            strengths: 'Problem solving, Python basics',
            weaknesses: 'Math and statistics',
            projectsDone: 'Small Python scripts, one web project',
            preferredLanguages: ['Python', 'JavaScript'],
            dreamCompany: 'Google',
            motivation: 'Build AI products that help people',
          },
        },
      };
    }
    const reply = mockReplies[userMsgCount] || mockReplies[0];
    return { success: true, done: false, message: reply };
  },
  getQuiz: async (roleId, skillLevel = 'beginner', quizType = 'initial') => {
    await delay(600);
    let questions = QUIZ_QUESTIONS[roleId] || [];
    if (quizType === 'final') {
        questions = [...questions, ...questions]; // mock 20 questions for final by duplicating
    }
    return { success: true, questions };
  },
  submitQuiz: async (roleId, answers, quizType = 'initial') => {
    await delay(1500);
    let questions = QUIZ_QUESTIONS[roleId] || [];
    if (quizType === 'final') {
        questions = [...questions, ...questions];
    }
    
    const results = questions.map((q, i) => {
      const userAnswer = answers[i] !== undefined ? answers[i] : -1;
      const isCorrect = userAnswer === q.correct;
      return {
        q: q.q,
        options: q.options,
        user_answer: userAnswer,
        correct_answer: q.correct,
        is_correct: isCorrect
      };
    });

    const correctCount = results.filter(r => r.is_correct).length;
    const totalCount = questions.length;
    const score = Math.round((correctCount / totalCount) * 100);

    if (quizType === 'final') {
      const stored = localStorage.getItem('waypoint-mock-tracks');
      const data = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(TRACKS));
      if (data[roleId]) {
        data[roleId].skillData = data[roleId].skillData.map(skill => ({
          ...skill,
          current: Math.max(0, Math.floor((skill.target || 100) * (score / 100.0)))
        }));
        localStorage.setItem('waypoint-mock-tracks', JSON.stringify(data));
      }
    }

    return {
      success: true,
      readiness_score: score,
      correct_count: correctCount,
      total_count: totalCount,
      results
    };
  },
  getRoadmaps: async () => {
    await delay(800);
    const stored = localStorage.getItem('waypoint-mock-tracks');
    const data = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(TRACKS));
    if (!stored) localStorage.setItem('waypoint-mock-tracks', JSON.stringify(data));
    return { success: true, data };
  },
  generateRoadmap: async (roleId) => {
    await delay(2000);
    const stored = localStorage.getItem('waypoint-mock-tracks');
    const data = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(TRACKS));
    if (!data[roleId]) {
      data[roleId] = TRACKS[roleId];
      localStorage.setItem('waypoint-mock-tracks', JSON.stringify(data));
    }
    return { success: true, roadmap: data[roleId] };
  },
  updateNodeStatus: async (trackId, nodeId, status) => {
    await delay(400);
    const stored = localStorage.getItem('waypoint-mock-tracks');
    const data = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(TRACKS));
    if (data[trackId] && data[trackId].nodeMap[nodeId]) {
      data[trackId].nodeMap[nodeId].status = status;
      localStorage.setItem('waypoint-mock-tracks', JSON.stringify(data));
    }
    return { success: true };
  },
  chatWithNode: async (trackId, nodeId, query) => {
    await delay(1000);
    return { success: true, answer: `(Mock Mode) This is a simulated AI response to your question: "${query}". Switch to VITE_USE_MOCK=false for real answers.` };
  },
  adaptRoadmap: async (trackId, nodeId, feedback) => {
    await delay(1500);
    const stored = localStorage.getItem('waypoint-mock-tracks');
    const data = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(TRACKS));
    if (data[trackId] && data[trackId].nodeMap[nodeId]) {
      data[trackId].nodeMap[nodeId].title += (feedback === 'easy' ? ' (Fast Track)' : ' (Adapted)');
      localStorage.setItem('waypoint-mock-tracks', JSON.stringify(data));
      return { success: true, roadmap: data[trackId] };
    }
    return { success: false, message: 'Track not found' };
  },
  deleteRoadmap: async (trackId) => {
    await delay(500);
    const stored = localStorage.getItem('waypoint-mock-tracks');
    const data = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(TRACKS));
    if (data[trackId]) {
      delete data[trackId];
      localStorage.setItem('waypoint-mock-tracks', JSON.stringify(data));
      return { success: true };
    }
    return { success: false, message: 'Track not found' };
  },
  generalChat: async (messages) => {
    await delay(1000);
    return { success: true, message: '(Mock Mode) This is a simulated response to your general query. Switch VITE_USE_MOCK=false for real answers.' };
  },
  getUserProfile: async () => {
    await delay(500);
    return {
      success: true,
      profile: {
        id: 'user-001',
        name: 'Prashant',
        email: 'prashant@example.com',
        targetRole: 'Machine Learning Engineer',
        skillLevel: 'beginner',
        weeklyTimeHours: 6,
        learningStyle: 'project-first',
        pastExperience: 'Basic Python knowledge',
        isOnboarded: false,
        stats: {
          xp: 2340,
          streak: 12
        },
        heatmapData: [] // Would fall back to generated
      }
    };
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
  onboardingChat: (messages, roleId) =>
    http('/api/onboarding/chat', { method: 'POST', body: { role_id: roleId, messages } }),
  getQuiz: (roleId, skillLevel = 'beginner', quizType = 'initial') =>
    http(`/api/assessment/quiz?target_role=${encodeURIComponent(roleId)}&skill_level=${encodeURIComponent(skillLevel)}&quiz_type=${encodeURIComponent(quizType)}`),
  submitQuiz: (roleId, answers, quizType = 'initial') =>
    http('/api/assessment/submit', { method: 'POST', body: { target_role: roleId, answers, quiz_type: quizType } }),
  getRoadmaps: () => http('/api/roadmaps/list'),
  generateRoadmap: (roleId) =>
    http('/api/roadmap/generate', { method: 'POST', body: { target_role: roleId } }),
  updateNodeStatus: (trackId, nodeId, status) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}`, { method: 'PATCH', body: { status } }),
  chatWithNode: (trackId, nodeId, query) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}/chat`, { method: 'POST', body: { query } }),
  adaptRoadmap: (trackId, nodeId, feedback) =>
    http(`/api/roadmap/${trackId}/nodes/${nodeId}/adapt`, { method: 'POST', body: { feedback } }),
  deleteRoadmap: (trackId) =>
    http(`/api/roadmap/${trackId}`, { method: 'DELETE' }),
  generalChat: (messages) =>
    http('/api/chat/general', { method: 'POST', body: { messages } }),
  getUserProfile: () => http('/api/user/profile'),
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
  return typeof localStorage !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);
}

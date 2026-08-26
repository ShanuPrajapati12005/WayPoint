/* ===================================================================
   WAYPOINT — Global App Context
   Centralizes all state: theme, active track, user profile, progress.
   Every screen reads from here so the Global Track Selector updates
   Roadmap, Radar, Dashboard, and Sidebar simultaneously.
   =================================================================== */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { toast as sonnerToast } from 'sonner';
import { api, clearAuthToken } from '../services/api';
import { FEEDBACK_MESSAGES } from '../data/tracks';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ─── Theme (shadcn .dark class, light-first) ───
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('waypoint-theme');
      if (stored === 'light' || stored === 'dark') return stored;
      // Respect OS preference on first visit
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem('waypoint-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // ─── Demo-safety mode (?demo=1 or ⌘K toggle) ───
  const [demoMode, setDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('demo') === '1';
    }
    return false;
  });

  // ─── Tracks (fetched from API) ───
  const [tracks, setTracks] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTracks() {
      setIsLoading(true);
      try {
        const res = await api.getRoadmaps();
        if (res.success) {
          setTracks(res.data);
        }
      } catch (err) {
        console.error('Failed to load tracks', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTracks();
  }, []);

  // ─── Active Track ───
  const [activeTrackId, setActiveTrackId] = useState(() => {
    return localStorage.getItem('waypoint-active-track') || 'ml';
  });

  useEffect(() => {
    localStorage.setItem('waypoint-active-track', activeTrackId);
  }, [activeTrackId]);

  const activeTrack = tracks[activeTrackId] || null;

  // ─── User Profile (mock) ───
  const [userProfile, setUserProfile] = useState({
    id: 'user-001',
    name: 'Prashant',
    email: 'prashant@example.com',
    targetRole: 'Machine Learning Engineer',
    skillLevel: 'beginner',
    weeklyTimeHours: 6,
    learningStyle: 'project-first',
    pastExperience: 'Basic Python knowledge',
    isOnboarded: false,
  });

  const [authLoading, setAuthLoading] = useState(import.meta.env.VITE_USE_MOCK === 'false');

  // ─── Supabase Session Sync ───
  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK === 'false') {
      // 1. Sync on mount
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const user = session.user;
          setUserProfile((p) => ({
            ...p,
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Learner',
            isOnboarded: user.user_metadata?.isOnboarded ?? p.isOnboarded,
          }));
        }
        setAuthLoading(false);
      }).catch(() => {
        setAuthLoading(false);
      });

      // 2. Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          const user = session.user;
          setUserProfile((p) => ({
            ...p,
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Learner',
            isOnboarded: user.user_metadata?.isOnboarded ?? p.isOnboarded,
          }));
        } else {
          // Reset profile on logout
          setUserProfile({
            id: '',
            name: '',
            email: '',
            targetRole: '',
            skillLevel: 'beginner',
            weeklyTimeHours: 6,
            learningStyle: '',
            pastExperience: '',
            isOnboarded: false,
          });
        }
        setAuthLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // ─── Sidebar State ───
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const openNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    // Keep selectedNodeId so re-opening shows the last node
  }, []);

  // ─── Roadmap View ───
  const [roadmapView, setRoadmapView] = useState('flow'); // 'flow' | 'tree'

  // ─── Command Palette (⌘K) ───
  const [commandOpen, setCommandOpen] = useState(false);

  // ─── Toasts (backed by sonner) ───
  const showToast = useCallback((message, opts = {}) => {
    if (!message) return;
    sonnerToast(message, opts);
  }, []);

  // ─── Adaptive Feedback ───
  const giveFeedback = useCallback(
    (type) => {
      const msg = FEEDBACK_MESSAGES[type];
      if (msg) {
        sonnerToast.success('Roadmap adapted', { description: msg });
      }
    },
    []
  );

  // ─── Log out ───
  // Mock auth: there's no token to revoke, so we close every overlay, drop the
  // session-ish profile flags and let the caller navigate to /auth. Theme is a
  // device preference, so it deliberately survives a logout.
  const logout = useCallback(() => {
    clearAuthToken(); // real-mode: drop the stored bearer token (no-op in mock)
    
    // Clear Supabase session on logout
    if (import.meta.env.VITE_USE_MOCK === 'false') {
      supabase.auth.signOut().catch((err) => {
        console.error('Error signing out of Supabase:', err);
      });
    }

    setSidebarOpen(false);
    setSelectedNodeId(null);
    setCommandOpen(false);
    setDemoMode(false);
    setUserProfile((p) => ({ ...p, isOnboarded: false }));
    sonnerToast('Logged out', {
      description: 'Your progress is saved — log back in any time.',
    });
  }, []);

  // ─── Node Status Update ───
  const updateNodeStatus = useCallback((trackId, nodeId, newStatus) => {    // Optimistic UI update
    setTracks((prev) => {
      const updated = { ...prev };
      const track = { ...updated[trackId] };
      const nodeMap = { ...track.nodeMap };
      nodeMap[nodeId] = { ...nodeMap[nodeId], status: newStatus };
      track.nodeMap = nodeMap;
      updated[trackId] = track;
      return updated;
    });
    // Async API call
    api.updateNodeStatus(trackId, nodeId, newStatus).catch((err) => {
      console.error('Failed to update node status:', err);
      // In a real app, we might revert the optimistic update here
    });
  }, []);

  const value = {
    // Theme
    theme,
    toggleTheme,

    // Demo mode
    demoMode,
    setDemoMode,

    // Tracks
    tracks,
    isLoading,
    activeTrackId,
    setActiveTrackId,
    activeTrack,

    // User
    userProfile,
    setUserProfile,
    logout,
    authLoading,

    // Sidebar
    sidebarOpen,
    setSidebarOpen,
    selectedNodeId,
    setSelectedNodeId,
    openNode,
    closeSidebar,

    // Roadmap view
    roadmapView,
    setRoadmapView,

    // Command palette
    commandOpen,
    setCommandOpen,

    // Toast + feedback
    showToast,
    giveFeedback,

    // Node updates
    updateNodeStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;

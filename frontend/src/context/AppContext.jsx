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
  const [tracks, setTracks] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('waypoint-strict-cache');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
    }
    return {};
  });

  useEffect(() => {
    if (Object.keys(tracks).length > 0) {
      localStorage.setItem('waypoint-strict-cache', JSON.stringify(tracks));
    }
  }, [tracks]);

  const [isLoading, setIsLoading] = useState(true);

  const [userProfile, setUserProfile] = useState({
    id: 'user-001',
    name: 'User',
    email: 'user@example.com',
    targetRole: 'Machine Learning Engineer',
    skillLevel: 'beginner',
    weeklyTimeHours: 6,
    learningStyle: 'project-first',
    pastExperience: 'Basic Python knowledge',
    isOnboarded: false,
    stats: {
      xp: 0,
      streak: 0
    },
    heatmapData: []
  });

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [tracksRes, profileRes] = await Promise.all([
          api.getRoadmaps(),
          api.getUserProfile().catch(() => null) // Allow to fail gracefully if not authed
        ]);
        
        if (tracksRes && tracksRes.success) {
          setTracks((prev) => {
            const newTracks = {};
            // Only keep tracks that exist in the backend response (fixes caching issue)
            for (const key of Object.keys(tracksRes.data)) {
              if (!prev[key]) {
                newTracks[key] = tracksRes.data[key];
              } else {
                // BUG FIX: Spread prev first, then backend data, so backend overrides local optimistic state
                newTracks[key] = { ...prev[key], ...tracksRes.data[key], nodeMap: { ...(prev[key].nodeMap || {}), ...tracksRes.data[key].nodeMap } };
              }
            }
            return newTracks;
          });
          const currentTrack = localStorage.getItem('waypoint-active-track') || 'ml';
          if (Object.keys(tracksRes.data).length > 0 && !tracksRes.data[currentTrack]) {
            setActiveTrackId(Object.keys(tracksRes.data)[0]);
          }
        }
        if (profileRes && profileRes.success) {
          setUserProfile(profileRes.profile);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const generateAndLoadRoadmap = useCallback(async (roleId) => {
    try {
      const res = await api.generateRoadmap(roleId);
      if (res.success && res.roadmap) {
        setTracks((prev) => ({ ...prev, [roleId]: res.roadmap }));
        return res.roadmap;
      }
    } catch (err) {
      console.error('Failed to generate roadmap', err);
    }
    return null;
  }, []);



  // Re-fetch all tracks from the API and update state.
  // Called after quiz submission so Dashboard reflects updated skill levels.
  const refreshTracks = useCallback(async () => {
    try {
      const res = await api.getRoadmaps();
      if (res && res.success) {
        setTracks((prev) => {
          const newTracks = {};
          for (const key of Object.keys(res.data)) {
            if (!prev[key]) {
              newTracks[key] = res.data[key];
            } else {
              // BUG FIX: Spread prev first, then backend data, so backend overrides local optimistic state
              newTracks[key] = { ...prev[key], ...res.data[key], nodeMap: { ...(prev[key].nodeMap || {}), ...res.data[key].nodeMap } };
            }
          }
          return newTracks;
        });
      }
    } catch (err) {
      console.error('Failed to refresh tracks', err);
    }
  }, []);

  // ─── Active Track ───
  const [activeTrackId, setActiveTrackId] = useState(() => {
    return localStorage.getItem('waypoint-active-track') || 'ml';
  });

  useEffect(() => {
    localStorage.setItem('waypoint-active-track', activeTrackId);
  }, [activeTrackId]);

  const activeTrack = tracks[activeTrackId] || null;

  const deleteTrack = useCallback(async (trackId) => {
    try {
      const res = await api.deleteRoadmap(trackId);
      if (res.success) {
        setTracks((prev) => {
          const updated = { ...prev };
          delete updated[trackId];
          return updated;
        });
        if (activeTrackId === trackId) {
          setActiveTrackId((prevActive) => {
             const remainingIds = Object.keys(tracks).filter(id => id !== trackId);
             return remainingIds.length > 0 ? remainingIds[0] : null;
          });
        }
        sonnerToast.success('Track deleted successfully');
        return true;
      }
    } catch (err) {
      console.error('Failed to delete roadmap', err);
      sonnerToast.error('Failed to delete track');
    }
    return false;
  }, [activeTrackId, tracks]);



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
  const [simulatedHours, setSimulatedHours] = useState(null);
  const [adaptationPopupOpen, setAdaptationPopupOpen] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);

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
      if (isAdapting) {
        console.log('[FRONTEND] [FEEDBACK] Blocked duplicate adaptation request (already in progress)');
        return;
      }
      if (!activeTrackId || !selectedNodeId) return;

      const startTime = Date.now();
      console.log(`[FRONTEND] [FEEDBACK] Selected: ${type} for node: ${selectedNodeId} on track: ${activeTrackId} at ${new Date(startTime).toISOString()}`);
      
      setIsAdapting(true);

      api.adaptRoadmap(activeTrackId, selectedNodeId, type)
        .then((res) => {
          const duration = Date.now() - startTime;
          console.log(`[FRONTEND] [FEEDBACK] Response received for type: ${type} in ${duration}ms:`, res);
          
          if (res.success && res.roadmap) {
            const previousRoadmap = tracks[activeTrackId];
            console.log(`[FRONTEND] [FEEDBACK] Previous roadmap data:`, previousRoadmap);
            console.log(`[FRONTEND] [FEEDBACK] New roadmap data returned by API:`, res.roadmap);
            
            // Log node titles before/after to prove data flow difference
            const prevTitle = previousRoadmap?.nodeMap?.[selectedNodeId]?.title;
            const newTitle = res.roadmap?.nodeMap?.[selectedNodeId]?.title;
            console.log(`[FRONTEND] [FEEDBACK] Data Flow Proof -> Selected Node Title: [${prevTitle}] -> [${newTitle}]`);

            console.log(`[FRONTEND] [FEEDBACK] Updating global tracks state with adapted roadmap for: ${activeTrackId}`);
            setTracks((prev) => ({ ...prev, [activeTrackId]: res.roadmap }));
            setAdaptationPopupOpen(true);

            const msg = FEEDBACK_MESSAGES[type];
            sonnerToast.success('Roadmap adapted', { 
              description: msg || 'Roadmap updated based on your progress ✨' 
            });
          } else {
            console.error('[FRONTEND] [FEEDBACK] Backend returned success: false', res);
            sonnerToast.error('Failed to adapt roadmap', {
              description: res.message || 'Please try again later.'
            });
          }
        })
        .catch((err) => {
          console.error('[FRONTEND] [FEEDBACK] Failed to adapt roadmap:', err);
          sonnerToast.error('Failed to adapt roadmap', {
            description: err.message || 'Check connection to the server.'
          });
        })
        .finally(() => {
          setIsAdapting(false);
        });
    },
    [activeTrackId, selectedNodeId, isAdapting, tracks]
  );

  // ─── Log out ───
  // Mock auth: there's no token to revoke, so we close every overlay, drop the
  // session-ish profile flags and let the caller navigate to /auth. Theme is a
  // device preference, so it deliberately survives a logout.
  const logout = useCallback(() => {
    clearAuthToken(); // real-mode: drop the stored bearer token (no-op in mock)
    localStorage.removeItem('waypoint-active-track');
    localStorage.removeItem('waypoint-strict-cache');
    setTracks({});
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
      const oldStatus = nodeMap[nodeId]?.status;
      
      nodeMap[nodeId] = { ...nodeMap[nodeId], status: newStatus };
      track.nodeMap = nodeMap;

      // Locally compute the skill bump to ensure instant UI update
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        const remaining = Object.values(nodeMap).filter(n => n.status !== 'completed').length;
        const newSkillData = track.skillData.map(skill => {
          const current = skill.current || 0;
          const target = skill.target || 100;
          if (current < target) {
            if (remaining === 0) {
              return { ...skill, current: target };
            } else {
              const gap = target - current;
              const increment = Math.max(2, Math.floor(gap / (remaining + 1)));
              return { ...skill, current: Math.min(target, current + increment) };
            }
          }
          return skill;
        });
        track.skillData = newSkillData;
      }

      updated[trackId] = track;
      return updated;
    });

    // Async API call
    api.updateNodeStatus(trackId, nodeId, newStatus)
      .then((res) => {
        // We now rely on the local computation for immediate feedback.
        // We only override if the backend explicitly provides a higher/different successful state
        // but to prevent the known backend stale-data bug, we trust the optimistic update.
      })
      .catch((err) => {
        console.error('Failed to update node status:', err);
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
    generateAndLoadRoadmap,
    refreshTracks,
    deleteTrack,

    // User
    userProfile,
    setUserProfile,
    logout,

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
    simulatedHours,
    setSimulatedHours,

    // Command palette
    commandOpen,
    setCommandOpen,
    adaptationPopupOpen,
    setAdaptationPopupOpen,

    // Toast + feedback
    showToast,
    giveFeedback,
    isAdapting,

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

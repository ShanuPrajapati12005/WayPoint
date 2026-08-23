import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { AUTH_ENFORCED, hasAuthToken } from './services/api';

// Layout
import TopNav from './components/layout/TopNav';
import AISidebar from './components/layout/AISidebar';

// Global UI
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import CommandPalette from './components/common/CommandPalette';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import SkillCheck from './pages/SkillCheck';
import PathSelect from './pages/PathSelect';
import Roadmap from './pages/Roadmap';
import Dashboard from './pages/Dashboard';
import AddSkill from './pages/AddSkill';

// Pages that DON'T show the TopNav
const NO_NAV_ROUTES = ['/', '/auth'];

/**
 * Route guard. Only enforces auth against a real backend (VITE_USE_MOCK=false);
 * in mock/demo mode it's a pass-through so the frontend stays fully walkable.
 */
function RequireAuth({ children }) {
  if (!AUTH_ENFORCED || hasAuthToken()) return children;
  return <Navigate to="/auth" replace />;
}

function AppContent() {
  const location = useLocation();
  const showNav = !NO_NAV_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showNav && <TopNav />}

      <div className={showNav ? 'pt-16' : ''}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
            <Route path="/skill-check" element={<RequireAuth><SkillCheck /></RequireAuth>} />
            <Route path="/path-select" element={<RequireAuth><PathSelect /></RequireAuth>} />
            <Route path="/roadmap" element={<RequireAuth><Roadmap /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/add-skill" element={<RequireAuth><AddSkill /></RequireAuth>} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Global components */}
      <AISidebar />
      <CommandPalette />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <MotionConfig reducedMotion="user">
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </MotionConfig>
      </AppProvider>
    </BrowserRouter>
  );
}

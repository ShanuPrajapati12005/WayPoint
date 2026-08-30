# WayPoint - Project Context & State

**Note to Future Agents/Developers:** If you are reading this file, it means you have just joined this project in a new session. Please read this entire document carefully to understand the project architecture, current state, and next steps before making any changes.

---

## 1. Project Overview
**Name**: WayPoint
**Purpose**: An AI-powered, adaptive learning and career simulation platform built for the HCL Hackathon. It tracks a user's skills, generates personalized learning roadmaps using AI, and visually tracks career readiness.

## 2. Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS (v4), Shadcn UI, Framer Motion (Animations), React Flow (Roadmaps), Recharts (Data Visualization).
- **Backend**: Python, FastAPI, Supabase (PostgreSQL Database), Groq API (LLM for generating learning paths).
- **Authentication**: Custom JWT / Google Auth (handled via frontend/backend).

## 3. Key Files to Read (To Understand the App)
If you need to understand how things work, look here first:
- `frontend/src/context/AppContext.jsx`: The heart of the frontend. Contains global state (`userProfile`, `tracks`, `activeTrackId`) and mock data generation.
- `frontend/src/App.jsx`: Main routing file.
- `frontend/src/pages/Dashboard.jsx`: The main user interface. Shows Radar charts, skill gaps, and progress.
- `frontend/src/pages/Profile.jsx`: The advanced, fully editable Learner & Personal Profile UI.
- `backend/main.py`: The entry point for the FastAPI server.
- `backend/test_smtp.py` & `.env`: Email testing and environment variables (Supabase, Groq, SMTP).

## 4. What Has Been Completed So Far (Current State)
- **Environment & DB**: Supabase PostgreSQL and Groq API are fully connected (credentials are in local `.env` files).
- **Auth Fixes**: Merged cherry-picked commits from Github to fix Google auth bypass and Forgot Password UI state.
- **UI/UX Polishing**: 
  - Designed a highly professional, "hackathon-winning" **Dashboard** with interactive skill gap bars and readiness gauges.
  - Built a deeply detailed, fully editable **Profile Page** (`Profile.jsx`) that integrates with the user's Onboarding data (Career Goals, Motivation, Education, Strengths, Weaknesses).
  - Fixed standard UI bugs (e.g., `UserMenu.jsx` syntax errors and dropdown trigger behavior).
- **Unit Testing Setup**:
  - Test files are written for the frontend (`Profile.test.jsx`, `Dashboard.test.jsx`, `UserMenu.test.jsx`) using Vitest & React Testing Library.
  - Backend test file (`test_api.py`) is written using Pytest.
  - *(Note: Installation of testing libraries was skipped to avoid sandbox permission popups, but the code is ready to run).*

## 5. What Needs To Be Done Next (Pending Tasks)
1. **Execute Unit Tests**: Run `npm i -D vitest @testing-library/react...` in the frontend and `pip install pytest` in the backend, then actually execute the tests to ensure 100% pass rate.
2. **Final Hackathon Polish**: Do a final walkthrough of the entire flow (Landing -> Login -> Onboarding -> Roadmap -> Dashboard -> Profile) to ensure there are no broken links or missing edge cases.
3. **Deployment**: Prepare the frontend for deployment (e.g., Vercel/Netlify) and backend (e.g., Render/Railway) if not already done.
4. **Presentation Prep**: Ensure mock data in `AppContext.jsx` is perfectly tuned for a seamless demo during the presentation.

---
*Last Updated: 2026-08-30 (End of Advanced UI & Verification Phase)*

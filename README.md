# 🚀 WayPoint — Career Readiness & Adaptive Roadmap Recommender

![WayPoint Banner](https://img.shields.io/badge/Status-Active-success.svg) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi) ![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?logo=react) ![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase) ![Groq](https://img.shields.io/badge/AI-Groq-black)

**WayPoint** is an intelligent, interactive learning platform designed for hackathons and production alike. It evaluates user skills and generates dynamically adaptive roadmaps tailored specifically to the learner's goals. Powered by a sleek React frontend, a lightning-fast FastAPI backend, and state-of-the-art LLMs via Groq, WayPoint ensures you always know your next step.

---

## ✨ Key Features of WayPoint
- 🧠 **AI-Generated Roadmaps:** Customized learning paths powered by Groq LLMs that analyze your skills, time availability, and career goals to build the perfect curriculum.
- ⚡ **Low-Latency Deterministic Adaptation:** Real-time feedback adaptation (Easy, Medium, Hard) that re-routes your path in under 1ms without hitting API rate limits.
- 📊 **Dynamic Skill Tracking:** Automatically tracks your XP, streak, and skill proficiency (e.g. Python, SQL) as you complete nodes.
- 🎨 **Beautiful UI/UX:** Built with TailwindCSS, Framer Motion, and Glassmorphism for a premium, highly professional feel.
- 🛡️ **Offline Demo Mode:** A built-in mock mode to ensure your hackathon pitch never fails due to Wi-Fi drops.
- 👤 **Professional User Profiles:** Centralized dashboard for managing your identity, education, experience, and career aspirations.

---

## 🛠️ Prerequisites

Before you start, make sure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher) & **npm**
- **Python** (v3.10.x or v3.11.x)
- **Git** (optional, for cloning)

---

## 🚀 Step-by-Step Setup Guide

Follow these instructions carefully to run the project flawlessly on your local machine.

### 1️⃣ Backend Setup (FastAPI)

The backend handles the core logic, AI generation, user authentication, and database connections.

1. **Open a terminal** and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. **Create a Python Virtual Environment**:
   * **Windows**:
     ```bash
     python -m venv .venv
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     ```

3. **Activate the Virtual Environment**:
   * **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   * **Windows (Command Prompt)**:
     ```cmd
     .\.venv\Scripts\activate.bat
     ```
   * **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```

4. **Install Dependencies**:
   *(Make sure your virtual environment is activated before running this!)*
   ```bash
   pip install -r requirements.txt
   ```
   > 💡 **Troubleshooting Tip:** If you are connecting to a PostgreSQL database (like Supabase) and encounter a `ModuleNotFoundError: No module named 'psycopg2'` error, simply run:
   > `pip install psycopg2-binary`

5. **Configure Environment Variables**:
   Create a `.env` file inside the `backend/` directory and add the following keys. (Replace the database and Groq keys with your actual credentials):
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=qwen/qwen3.8-27b
   JWT_SECRET=waypoint-super-secret-jwt-key-change-in-production-2024
   FRONTEND_ORIGIN=http://localhost:5173
   
   # Use Supabase PostgreSQL or fallback to local SQLite
   DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres
   ```

6. **Start the Backend Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   ✅ The backend API is now running on **`http://localhost:8000`**.

---

### 2️⃣ Frontend Setup (React + Vite)

The frontend contains the interactive dashboard, learning paths, and user profiles.

1. **Open a NEW terminal window** (keep the backend running in the first one) and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. **Install Node Packages**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside the `frontend/` directory with this configuration:
   ```env
   # Toggle the mock data layer: 
   # false = connect to the real FastAPI backend 
   # true  = run offline using local mock JSON (Safe Demo Mode)
   VITE_USE_MOCK=false
   
   # Backend URL
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start the Frontend Server**:
   ```bash
   npm run dev
   ```
   ✅ The frontend is now running on **`http://localhost:5173`**.

---

## 🎤 Important Hackathon / Pitch Tips

To ensure your presentation goes smoothly, leverage these built-in features:

### 🛡️ Fail-Safe Offline Mode (Mock Data)
If the venue Wi-Fi drops or your Groq API rate-limits you during the presentation, you can run the app offline!
1. Change `VITE_USE_MOCK=true` in your `frontend/.env` file.
2. Restart the frontend server. 
*The app will instantly switch to pre-cached demo data, keeping the UI perfectly functional for your pitch.*

### ⚡ Ultra-Fast Adaptive Feedback
When a user clicks on an uncompleted node and gives feedback (e.g., *Too Hard*, *Easy*), the roadmap adapts **deterministically** on the backend in under **1 millisecond**. 
- **Easy:** Shrinks durations, adds `(Accelerated)` to titles.
- **Too Hard:** Expands durations, adds `(Foundations)` to titles.
*This guarantees zero lag during live demos and saves your LLM quota!*

### 🔑 Preloaded Test Account
Don't waste time typing in forms during the presentation. Use the pre-seeded admin account to jump straight to the action:
* **Email:** `admin@waypoint.com`
* **Password:** `password123`

---

# WayPoint — Career Readiness & Adaptive Roadmap Recommender

WayPoint is an interactive learning platform that evaluates user skills and generates dynamically adaptive roadmaps utilizing a React frontend, FastAPI backend, and deterministic/LLM integration.

This guide provides step-by-step instructions to get the application running on a new device after extracting the project zip archive.

---

## Prerequisites

Before setting up the project, ensure you have the following installed on your system:
* **Node.js** (v18.0.0 or higher)
* **npm** (comes packaged with Node.js)
* **Python** (v3.10.x or v3.11.x)
* **Git** (optional, for version management)

---

## 1. Backend Setup (FastAPI)

The backend manages data persistence in SQLite, handles user authentication, and provides the programmatic feedback adaptation logic.

### Steps:
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   * **Windows**:
     ```bash
     python -m venv .venv
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv .venv
     ```

3. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD)**:
     ```cmd
     .venv\Scripts\activate.bat
     ```
   * **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```

4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure Environment Variables:
   Create a file named `.env` in the `backend/` folder and paste the following parameters (replace the Groq API key with your own):
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=qwen/qwen3.8-27b
   JWT_SECRET=waypoint-super-secret-jwt-key-change-in-production-2024
   FRONTEND_ORIGIN=http://localhost:5173
   DATABASE_URL=sqlite:///./waypoint.db
   ```

6. Start the backend development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will now be running on **`http://localhost:8000`**.

> [!NOTE]
> On startup, FastAPI will automatically initialize the local SQLite database (`waypoint.db`) and create all required tables. No manual database setup is necessary.

---

## 2. Frontend Setup (React + Vite)

The frontend provides the interactive dashboard, directed React Flow learning path canvas, and AI Guide sidebar.

### Steps:
1. Open a new terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install the node packages and dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a file named `.env` in the `frontend/` folder and ensure it contains the following configuration:
   ```env
   # Toggle the mock data layer: 
   # false = connect to real FastAPI backend (recommended for demo)
   # true  = run offline using local mock JSON datasets
   VITE_USE_MOCK=false
   
   # Backend URL
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend application will now be running on **`http://localhost:5173`**.

---

## 3. Important Demo & Hackathon Instructions

To ensure a smooth presentation and understand the architecture, keep these features in mind:

### 💡 Low-Latency Programmatic Adaptation
When a user clicks on an uncompleted node and selects feedback (**Easy**, **Medium**, **Too Hard**, or **Skip**), the roadmap adapts **deterministically** on the backend in **less than 1 millisecond**.
* **Easy**: Shortens upcoming durations and appends `(Accelerated)` to titles.
* **Medium**: Retains pacing and appends `(Optimized)` to titles.
* **Too hard**: Extends upcoming durations and appends `(Foundations)` to titles.
* **Skip**: Marks the selected node complete/skipped and appends `(Re-planned)` to subsequent nodes.
* *This avoids hitting LLM rate limits (TPM thresholds) and eliminates network lag during live presentations.*

### 🔑 Preloaded Test Accounts
To bypass onboarding and demonstrate existing roadmaps instantly, log in with these credentials:
* **Email**: `admin@nexora.com`
* **Password**: `password123`
This user has active tracks generated for **Java Backend** and **Machine Learning**.

### 📴 Offline Fallback Mode
If you encounter network connectivity issues or do not have a Groq API key:
1. Set `VITE_USE_MOCK=true` in `frontend/.env`.
2. Restart the frontend server.
The entire application will run offline utilizing cached local data assets without requiring a running backend.

# WayPoint — Career Readiness & Adaptive Roadmap Recommender

WayPoint is an interactive, AI-powered learning platform that evaluates user skills and generates dynamically adaptive roadmaps utilizing a React frontend, FastAPI backend, Supabase (PostgreSQL), and Groq LLMs.

This guide provides instructions to get the application running on a new device.

---

## ⚡ 1-Click Setup (For Windows)

If you are on Windows, we have provided a batch script to automate 90% of the setup. 

**Prerequisites:** Ensure you have [Node.js](https://nodejs.org/) and [Python](https://www.python.org/) installed on your system.

### Step 1: Add Environment Variables
Before running the setup, you must configure the environment variables:
1. Go to the `backend/` folder and copy `.env.example` to a new file named `.env`.
2. Go to the `frontend/` folder and copy `.env.example` to a new file named `.env`.
3. Paste the secret keys (provided by your team via WhatsApp/Discord) into these new `.env` files.

### Step 2: Run the Script
Double-click the **`setup_and_run.bat`** file located in the root of the project.
This script will automatically:
- Create a Python virtual environment and install backend dependencies.
- Install all frontend NPM dependencies.
- Launch the FastAPI Backend Server on `http://localhost:8000`.
- Launch the Vite Frontend Server on `http://localhost:5173`.

---

## 🛠 Manual Setup (For Mac/Linux or Custom Environments)

If you cannot use the `.bat` file, follow these steps to start the servers manually.

### 1. Backend Setup (FastAPI)
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup `.env`: Create a `.env` file based on `.env.example` and paste the required keys.
5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Setup (React + Vite)
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Setup `.env`: Create a `.env` file based on `.env.example` and paste the required keys.
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🚀 Important Hackathon Notes

* **Database**: The project uses **Supabase (PostgreSQL)** for the database. No local database setup is required as long as the Supabase keys are correctly placed in the `.env` file.
* **Authentication**: Authentication is handled via standard custom JWT and Google Auth.
* **AI Generation**: Path generation leverages the Groq API (Llama/Qwen models) for ultra-fast, deterministic JSON outputs.

*(Make sure to always keep your `.env` files out of Git commits!)*

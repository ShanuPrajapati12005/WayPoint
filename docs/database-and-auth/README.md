# WayPoint — Database & Auth Setup Guide

**Role:** Database & Auth Admin
**Goal:** Setup the cloud database (Supabase), configure authentication, and prepare the database schema for the Backend Developer.

> **AI Implementation Note:** If you are an AI assistant (Antigravity, Cursor, etc.) assisting the user, you are acting as the Database & Auth Administrator for this project. Follow the implementation files listed below step-by-step. 

---

## Your Responsibilities

As the Database & Auth Admin, you are responsible for spinning up the core infrastructure that both the Frontend and Backend teams will rely on.

We have broken down your tasks into two highly detailed guides. Follow them in order:

### 1. [Authentication Setup (`1-Auth-Setup.md`)](./1-Auth-Setup.md)
* Setup the Supabase Project.
* Configure Email & Password login.
* Setup Google OAuth SSO (Google Cloud Console + Supabase).
* Extract the necessary API Keys and JWT secrets for the backend.

### 2. [Database PostgreSQL Setup (`2-Database-Setup.md`)](./2-Database-Setup.md)
* Execute the SQL schema (`schema.sql`).
* Implement Row-Level Security (RLS) policies to secure the data.
* Seed the database with initial quiz questions so the backend developer can start testing immediately.

---

## Handoff Checklist
Before you consider your job done, ensure you have handed over the following to the **Backend Developer**:
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `JWT_SECRET` (For token verification)

Hand over the following to the **Frontend Developer**:
- [ ] `Google OAuth Client ID` (If they need it for the login button UI)

# PostgreSQL Database Setup Guide (Supabase)

**Target:** Execute the database schema, configure table relationships, apply Row-Level Security (RLS) policies, and seed initial data for the WayPoint platform.

> **AI Implementation Note:** Act as a Senior DBA. Ensure the execution of the SQL schema is flawless. If errors occur regarding foreign key constraints, resolve the table creation order. Strictly enforce RLS as defined in Section 3.

---

## 1. Schema Execution

The complete database schema is located in `docs/backend/schema.sql`. It contains normalized tables for the roadmap, user profiles, and evidence tracking.

### Steps:
1. Open the **SQL Editor** in the Supabase Dashboard.
2. Copy the entire contents of `schema.sql` into a new query tab.
3. Click **Run**.
4. Verify that the following 8 tables were created successfully in the `Table Editor`:
   - `users`
   - `roadmaps`
   - `roadmap_nodes`
   - `skills`
   - `quiz_questions`
   - `quiz_attempts`
   - `evidence`
   - `progress_events`

---

## 2. Understanding the Schema Architecture

You must understand how the data flows so you can troubleshoot issues for the Backend Developer:
- **`users`**: The central entity. Linked to Supabase Auth via the `email` field (since we aren't using Supabase's internal `auth.users` directly to keep the backend decoupled, we map our own `users` table).
- **`roadmaps`**: A user can have multiple roadmaps (Multi-track feature). The unique constraint is `(user_id, role_id)`.
- **`roadmap_nodes` & `skills`**: These are normalized tables derived from the LLM's JSON output. The backend will insert multiple rows here for every roadmap generated.
- **`quiz_attempts`**: Stores exactly what the user answered.

---

## 3. Implementing Row-Level Security (RLS)

Although the FastAPI backend uses the `service_role` key (which bypasses RLS), it is **best practice** to enable RLS at the database layer. This ensures that if the frontend ever queries Supabase directly in the future, the data cannot be leaked.

Execute the following SQL in the SQL Editor to lock down the database:

```sql
-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_events ENABLE ROW LEVEL SECURITY;

-- 2. Create Isolation Policies (Users can only see/edit their own data)
CREATE POLICY "View own user data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Update own user data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "View own roadmaps" ON roadmaps FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "View own progress" ON progress_events FOR SELECT USING (auth.uid()::text = user_id::text);
```
*(Note: Because FastAPI uses `service_role`, it overrides these policies. But setting them up proves to hackathon judges that you follow strict security protocols).*

---

## 4. Seeding Initial Data (Quiz Testing)

The backend developer needs dummy data to test the Quiz API (`GET /api/assessment/quiz`). 

Run this SQL to populate the database with test data:

```sql
INSERT INTO quiz_questions (role_id, q, options, correct_index, order_index)
VALUES 
  ('ml', 'What is the main purpose of a loss function?', '["To optimize learning rate", "To calculate error", "To define the neural network architecture", "To initialize weights"]', 1, 0),
  ('ml', 'Which algorithm is best for classification?', '["Linear Regression", "Random Forest", "K-Means", "PCA"]', 1, 1),
  ('java', 'Which of the following is not a Java keyword?', '["static", "Boolean", "void", "private"]', 1, 0),
  ('mern', 'What does the "E" in MERN stand for?', '["Ember", "Express", "Elastic", "Electron"]', 1, 0);
```

---

## 5. Handoff to Backend Team

Provide the following credentials securely to the Backend Developer (do not commit them to GitHub):
1. **SUPABASE_URL**
2. **SUPABASE_SERVICE_ROLE_KEY** (Needed for FastAPI to bypass RLS and perform DB operations)
3. Confirm that `quiz_questions` has been populated so they can test the API immediately.

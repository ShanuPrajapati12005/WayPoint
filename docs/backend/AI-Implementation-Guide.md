# WayPoint — AI & LLM Implementation Guide

This guide is specifically for the Backend Developer handling the AI integration. Since the backend is built in Python, you will also be responsible for the LLM logic, prompt engineering, and the RAG pipeline.

The entire product relies heavily on the AI generating highly structured, personalized data. If the AI hallucinates or breaks the JSON schema, the frontend will crash or render empty screens.

---

## 1. Core AI Responsibilities

As the owner of the AI logic, your backend must:
1. Generate strict JSON roadmaps based on a user's quiz score, profile, and target role.
2. Implement a 2-stage RAG (Retrieval-Augmented Generation) pipeline to avoid course hallucination.
3. Implement a deterministic fallback mechanism in case the LLM API fails, times out, or returns invalid JSON.

---

## 2. Prompt Engineering & Strict JSON Output

The most critical endpoint is `POST /api/roadmap/generate`. The frontend expects a very specific `Track` object.

### The System Prompt Pattern
You must instruct the LLM to act as a career coach and output **only** JSON. Do not let the LLM return conversational text outside the JSON block.

**Example System Prompt:**
```text
You are an expert technical career coach. Your task is to generate a personalized learning roadmap for a user aiming for a {target_role}.
You will be provided with the user's profile (learning style, weekly hours) and their current skill readiness scores based on a recent quiz.

You must output a JSON object representing the learning track.
The JSON must strictly follow this structure:
{
  "label": "String (e.g., Data Science)",
  "readiness": Integer (0-100, calculate based on current quiz scores),
  "match": Integer (0-100, calculate alignment between profile and target role),
  "nodeMap": {
    "f1": { "title": "...", "duration": "...", "stage": "foundations", "status": "not_started", "match": ... },
    "f2": { ... },
    "f3": { ... },
    "d1": { "stage": "core", ... },
    "d2": { "stage": "core", ... },
    "m1": { "stage": "advanced", ... },
    "m2": { "stage": "advanced", ... },
    "m3": { "stage": "advanced", ... }
  },
  "skillData": [
    { "skill": "Python", "current": 40, "target": 90 },
    ...
  ],
  "reasoning": {
    "f1": "Why the user needs this step...",
    ...
  }
}

Rules:
1. The nodeMap MUST contain exactly 8 keys: "f1", "f2", "f3", "d1", "d2", "m1", "m2", "m3".
2. Do not hallucinate course names. Use only the curated courses provided in the context.
3. Return ONLY the raw JSON. No markdown formatting, no intro, no outro.
```

*Note: Use `pydantic` in FastAPI to validate the LLM's response before returning it to the frontend.*

---

## 3. RAG (Retrieval) Logic: Preventing Hallucinations

LLMs hallucinate fake course names and broken URLs. To fix this, you will implement a **2-stage recommendation engine**.

**Stage 1: Retrieval (Local/DB)**
- Maintain a local database or JSON file of 50-100 real, curated courses (e.g., from freeCodeCamp, Coursera, YouTube).
- When a user requests a roadmap for "Machine Learning", query your curated list to find the top 10 relevant courses.

**Stage 2: Reasoning (LLM)**
- Inject those 10 curated courses into the LLM prompt as context.
- Instruct the LLM: *"Select the best courses from the provided list to fill the user's skill gaps. Map them to the 8 nodes in the roadmap."*

This guarantees the roadmap is personalized but uses real, verified resources.

---

## 4. Deterministic Fallback Mechanism

Hackathons are famous for API rate limits, slow Wi-Fi, and LLM timeouts during the live demo. You **must** have a fallback.

If `POST /api/roadmap/generate` fails (either due to a timeout, a 500 error from OpenAI/Anthropic, or a JSON parsing error):
1. **Do not return a 500 to the frontend.**
2. **Catch the exception.**
3. **Execute the Deterministic Fallback:**
   - Pre-define 3-5 static, hardcoded JSON roadmaps (e.g., one for Frontend, one for Backend, one for Data Science).
   - Randomly or loosely match the user's target role to one of these static JSON files.
   - Return the static JSON.

This ensures that even if the AI is completely down during the presentation, the app still functions perfectly and the frontend can render the beautiful UI.

---

## 5. Implementation Steps for the Backend/AI Dev

1. Set up your FastAPI server.
2. Build the `generate` endpoint but mock it first with a static JSON to ensure the connection with the frontend works.
3. Integrate the LLM (LangChain, OpenAI SDK, or Anthropic SDK).
4. Implement the Pydantic schema validation for the LLM output.
5. Setup the Curated Course DB (for RAG).
6. Test edge cases (What if the user's target role is completely unknown? Provide a generic fallback roadmap).

See `API-Contract.md` for the exact shape of the responses required.

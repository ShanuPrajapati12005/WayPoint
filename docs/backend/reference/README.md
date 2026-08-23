# Reference snapshots

Read-only copies of the two frontend files the API contract refers to, placed here so this
backend folder is **fully self-contained** — you (or Antigravity) can work from this folder alone.

- **`frontend-api-seam.js`** — snapshot of `waypoint-app/src/services/api.js`.
  Shows the EXACT calls, paths, and payloads the frontend sends, plus the response shapes it
  expects. Your endpoints must match the `real` object in this file.

- **`frontend-mock-data.js`** — snapshot of `waypoint-app/src/data/tracks.js`.
  The exact data shapes (Track, node, skill, reasoning) **plus the demo seed content**: all quiz
  questions (with their correct-answer indices) and the 5 sample roadmaps. Use it to
  (a) reproduce the shapes and (b) seed a demo database.

> ⚠ These are snapshots taken at handoff time. If the frontend files change later, the live
> source of truth is `waypoint-app/src/services/api.js` and `waypoint-app/src/data/tracks.js`.

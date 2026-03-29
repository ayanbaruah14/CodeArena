# CodeArena

## What is CodeArena?

> A full-stack competitive programming platform — built for coders who want to battle, not just practice.

- Compete in **live timed contests** with auto-freezing leaderboards
- Solve problems in a **Monaco Editor** (the same engine that powers VS Code)
- Get **real-time verdicts** via a distributed judge built on Docker + BullMQ + Redis
- **Earn or lose rating** after every contest
- Track progress across an **All Problems** vault with solved/attempted/unsolved status

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS, Monaco Editor |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Queue | BullMQ + Redis |
| Judge | Docker containers + Node.js child processes |
| Auth | JWT (JSON Web Tokens) |

---

## Features

### Contests
- Live, upcoming, and ended contest states derived from start/end timestamps
- Upcoming contests are locked — no entry until start time
- Per-problem attempt tracking with accepted/wrong/TLE status
- Leaderboard auto-freezes when contest ends — shows final standings

### Code Judge
- Submissions processed via **BullMQ job queue** backed by **Redis**
- Each submission runs inside an **isolated Docker container** via Node.js child processes
- Supports **C++**, **Python**, and **JavaScript**
- Verdicts: Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error
- Frontend polls every 2 seconds until verdict is returned

### Problems
- All Problems page with live search and character-level highlight matching
- Filter by All / Attempted / Unsolved tabs
- Attempt status derived from submission history — no extra DB field needed
- Difficulty badges: Easy / Medium / Hard

### Submissions
- Filter by Accepted / Wrong Answer / TLE
- Search across problem title, language, and status simultaneously
- Smart navigation — submissions from contests link to `/contest/:id/problem/:id`, standalone submissions link to `/problem/:id`

### Auth
- JWT authentication with role-based access (student / admin)
- Client-side token decoding — no extra `/me` endpoint needed
- Protected routes throughout

---

## Project Structure

```
codearena/
├── frontend/                  # React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   ├── Contests.jsx
│   │   │   │   ├── ContestPage.jsx
│   │   │   │   ├── ProblemPage.jsx
│   │   │   │   ├── Leaderboard.jsx
│   │   │   │   ├── Submissions.jsx
│   │   │   │   └── AllProblems.jsx
│   │   │   └── auth/
│   │   │       ├── Login.jsx
│   │   │       └── Register.jsx
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── api/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── index.css              # All Neon Tokyo theme styles
│
└── backend/                   # Express API
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── contestController.js
    │   ├── problemController.js
    │   └── submissionController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── contestRoutes.js
    │   ├── problemRoutes.js
    │   └── submissionRoutes.js
    ├── models/
    │   ├── User.js
    │   ├── Contest.js
    │   ├── Problem.js
    │   └── Submission.js
    ├── worker/
    │   └── judgeWorker.js     # BullMQ worker — processes submissions
    ├── docker/
    │   └── runner/            # Docker image for code execution
    ├── server.js
    └── .env


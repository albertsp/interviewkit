# InterviewKit

> Practice real technical interviews with AI: code questions, instant feedback, and study cards to review later.

🌐 **[interviewkit.dev](https://interviewkit.dev)** · [Repository](https://github.com/albertsp/interviewkit)

[![Live demo](https://img.shields.io/badge/Live_demo-interviewkit.dev-2ea44f?style=flat&logo=vercel&logoColor=white)](https://interviewkit.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/albertsp/interviewkit/actions/workflows/ci.yml/badge.svg)](https://github.com/albertsp/interviewkit/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Testing and CI](#testing-and-ci)
- [Project structure](#project-structure)
- [Deployment](#deployment)
- [Technical decisions](#technical-decisions)
- [Challenges and lessons learned](#challenges-and-lessons-learned)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

---

## Why this exists

While learning to code and preparing for my first job, I realised that practising technical interviews with theory alone doesn't work. I needed real code questions, someone telling me exactly what went wrong, and a way to review what I had learned.

I couldn't find a free tool that did all three, so I built one.

**InterviewKit** generates 5 code questions tailored to your stack and level, evaluates your answers with AI, and saves every concept as a Q&A card you can review whenever you want.

---

## Features

| | |
|---|---|
| ![Session setup](frontend/public/screenshots/session-setup.png) | ![Dashboard](frontend/public/screenshots/dashboard-cards.png) |
| ![Stats](frontend/public/screenshots/stats-overview.png) | ![Card detail](frontend/public/screenshots/card-detail.png) |

- **Interview simulator**: choose a role (Frontend/Backend), a technology and a level. The AI generates 5 concrete code questions, not theoretical definitions.
- **Real feedback**: every answer is evaluated with an explanation of what was right, what failed, and what the correct solution looks like.
- **Q&A cards**: every question becomes a study card with the concept, a definition, a code example and use cases.
- **Dashboard**: search and filter all your cards by technology or concept.
- **Statistics**: charts of results per session, most practised tags and progress over time.
- **XP and levels**: earn experience in every session based on how well you answer.
- **Authentication**: sign in with Google, GitHub or email and password.
- **Light and dark themes**.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Code editor | CodeMirror |
| Backend | Flask 3 (Python 3.12) |
| Database | PostgreSQL 16 + SQLAlchemy |
| Migrations | Alembic (Flask-Migrate) |
| Auth | JWT in httpOnly cookies + OAuth 2.0 (Authlib) |
| Rate limiting | Flask-Limiter |
| AI | Groq API (`openai/gpt-oss-120b`) |
| Testing | pytest (backend), Vitest + Testing Library (frontend) |
| CI | GitHub Actions |
| Deployment | Vercel (frontend) + Fly.io (backend) |

---

## Architecture

```
┌──────────────────┐   HTTPS + cookies    ┌──────────────────┐     ┌────────────┐
│  Next.js 15      │ ───────────────────▶ │  Flask REST API  │ ──▶ │ PostgreSQL │
│  (Vercel)        │ ◀─────────────────── │  (Fly.io)        │     └────────────┘
└──────────────────┘                      └────────┬─────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │    Groq API      │
                                          │ question + eval  │
                                          └──────────────────┘
```

1. The frontend calls the API with `credentials: include`, so the JWT travels in an httpOnly cookie and never reaches JavaScript.
2. The backend generates questions and evaluates answers through Groq, behind per-user and global rate limits.
3. Every evaluated question is stored and can be turned into a study card.

---

## Getting started

### Prerequisites

- Node.js 20+ (CI runs on Node 22)
- Python 3.12+
- Docker Desktop (for the local PostgreSQL database)
- A free [Groq API key](https://console.groq.com)
- Optional: Google and GitHub OAuth apps, only if you want social login locally

### Setup

```bash
git clone https://github.com/albertsp/interviewkit.git
cd interviewkit

# Database
docker compose up -d

# Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your keys (see below)
flask db upgrade

# Frontend
cd ../frontend
npm install
cp .env.example .env            # NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Run the project

```bash
# Terminal 1: backend
cd backend && flask run          # http://localhost:5000

# Terminal 2: frontend
cd frontend && npm run dev       # http://localhost:3000
```

The database container started in the setup step keeps running in the background.

---

## Environment variables

**`backend/.env`**

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET_KEY` | Yes | Secret used to sign JWTs. The app refuses to start without it. |
| `DATABASE_URL` | Yes | e.g. `postgresql://admin:admin@localhost:5432/interview_prep` (matches `docker-compose.yml`). |
| `GROQ_API_KEY` | Yes, for AI features | Groq API key used to generate and evaluate questions. |
| `FLASK_ENV` | No | `development` locally, `production` when deployed. The `/debug` routes are only registered when it is not `production`. |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | No | Lifetime of the access token. |
| `CORS_ORIGINS` | Yes | Allowed frontend origins, e.g. `http://localhost:3000`. |
| `FRONTEND_URL` | Yes | Where OAuth callbacks redirect the user. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For Google login | OAuth credentials. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | For GitHub login | OAuth credentials. |

**`frontend/.env`**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend, e.g. `http://localhost:5000`. |

> Never commit real secrets. Use `.env.example` as the template and keep `.env` files out of git.

---

## API overview

All endpoints except `/auth/*`, `/stacks` and the OAuth flow require a valid session cookie.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create an account with email and password |
| `POST` | `/auth/login` | Log in and set the session cookie |
| `POST` | `/auth/logout` | Clear the session cookie |
| `GET` | `/auth/google`, `/auth/github` | Start the OAuth flow (callbacks at `/auth/<provider>/callback`) |
| `GET` | `/stacks/` | Available roles, technologies and levels |
| `POST` | `/sessions/` | Start a session and generate 5 questions (AI) |
| `PATCH` | `/sessions/<id>/questions/<qid>` | Submit an answer and get AI feedback |
| `POST` | `/sessions/<id>/complete` | Complete a session and award XP |
| `GET` | `/cards/` | List your study cards |
| `POST` | `/cards/` | Create a card from a question |
| `PATCH` / `DELETE` | `/cards/<id>` | Edit or delete a card |
| `GET` | `/me/stats` | Aggregated statistics, XP and level |
| `GET` / `PATCH` | `/me/profile` | Read or update your profile |
| `GET` | `/debug/db` | Database diagnostics (non-production only) |

**Rate limits** (AI endpoints): 5 session creations per hour and 15 answer evaluations per hour per user, plus a global shared limit of 20 per minute and 40 per day to protect the Groq free-tier budget.

**XP rules**: 100 XP for a correct answer, 50 for a partially correct one, 10 for an incorrect one, plus a 50 XP completion bonus. Every 500 XP is a level.

---

## Testing and CI

```bash
# Backend (SQLite in memory, no database or API keys needed)
cd backend
source venv/bin/activate        # Windows: venv\Scripts\activate
pytest

# Backend with coverage
pytest --cov=app --cov-report=term-missing

# Frontend
cd frontend
npm test                         # single run
npm run test:watch               # watch mode
```

The backend has tests for authentication, OAuth, models, sessions, cards, user stats and the AI service (with the Groq client mocked). The frontend has tests for the authentication context.

**Continuous integration**: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and executes the backend and frontend test suites in parallel (Python 3.12 and Node 22, with dependency caching). No secrets are required.

---

## Project structure

```
interviewkit/
├── .github/workflows/ci.yml           # CI: pytest + npm test
├── backend/
│   ├── app/
│   │   ├── models/                    # User, Session, Question, Card, OAuthAccount
│   │   ├── routes/                    # auth, oauth, sessions, cards, user, stacks, debug
│   │   ├── services/                  # Business logic and Groq integration
│   │   ├── constants/                 # Gamification rules and stacks
│   │   ├── __init__.py                # App factory, rate limiter, OAuth init
│   │   └── config.py                  # Configuration from environment variables
│   ├── migrations/                    # Alembic migrations
│   ├── tests/
│   ├── Dockerfile
│   ├── fly.toml
│   └── requirements.txt
├── frontend/
│   ├── app/(app)/
│   │   ├── page.tsx                   # Landing page
│   │   ├── login/ · register/
│   │   ├── auth/callback/             # OAuth callback handler
│   │   └── (protected)/               # dashboard, session, stats, profile
│   ├── src/
│   │   ├── components/
│   │   ├── context/                   # AuthContext
│   │   ├── services/                  # API calls
│   │   └── __tests__/
│   └── public/
├── docker-compose.yml                 # Local PostgreSQL
└── README.md
```

---

## Deployment

**Backend: Fly.io**

```bash
cd backend && fly deploy
```

Migrations run automatically on every deploy (`release_command` in `fly.toml`). Set environment variables with `fly secrets set`, and make sure `FLASK_ENV=production`.

**Frontend: Vercel**

A push to `main` deploys automatically. Set `NEXT_PUBLIC_API_URL` in the Vercel dashboard.

Because the frontend and backend live on different domains, the auth cookie is set with `SameSite=None; Secure`, and `CORS_ORIGINS` must list the exact frontend origin.

---

## Technical decisions

**Why Flask and not Django or FastAPI?**
Flask gave me full control over the structure without imposing patterns. For a REST API of this size Django would have been overkill, and FastAPI would have meant learning async from scratch at the same time.

**Why Groq and not OpenAI?**
Groq has a generous free tier and very low latency. When the user is waiting for questions in real time, speed matters, and the hosted open-weight model is capable enough to generate quality technical questions.

**Two-layer rate limiting**
The Groq free tier has one budget shared by the whole app. I implemented two limits: per user (so one account can't drain it) and global (to protect the real budget). With only a per-user limit, a coordinated attack could still exhaust the quota.

**JWT in httpOnly cookies for OAuth**
The OAuth flow redirects from the backend to the frontend. Instead of exposing the token in the URL (visible in browser history and server logs), the backend sets an httpOnly cookie directly. The frontend never touches the token; the browser sends it on every request via `credentials: include`.

**Prompt injection mitigation**
User answers go straight to the AI model for evaluation. I wrapped user input in `###ANSWER_START###` / `###ANSWER_END###` delimiters and added explicit instructions to the system prompt to treat that block as data, not as instructions.

---

## Challenges and lessons learned

**The N+1 problem in statistics**
The first version of `/me/stats` ran one query per session to fetch its questions. It's unnoticeable with little data but scales badly. I found it by inspecting the queries SQLAlchemy generated and fixed it with a single `JOIN`. I also added missing foreign-key indexes.

**OAuth is more complex than it looks**
Social login with Google and GitHub seemed simple until the details: cross-origin cookies require `SameSite=None; Secure`, the JWT can't travel in the URL, and you have to decide what happens when someone signs in with Google using an email that already has a password account. Every decision has security implications.

**Global auth state in Next.js**
Coordinating session state between the server (httpOnly cookie) and the client (React Context) with the Next.js 15 App Router was the hardest frontend challenge. The protected layout has to handle the loading state correctly so it never shows protected content before the session is verified.

**Designing the AI prompts**
The quality of the generated questions depends entirely on the prompt. Early versions produced overly theoretical questions ("What is a closure?"). Iterating on the system prompt to force concrete code questions was trial and error that took much longer than I expected. LLM output also needs defensive parsing (stripping markdown fences, fixing double-escaped newlines in code).

---

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `RuntimeError` about `JWT_SECRET_KEY` on startup | The variable is missing in `backend/.env`. |
| `connection refused` on port 5432 | The database container isn't running: `docker compose up -d`. |
| Login works but you're immediately logged out | `CORS_ORIGINS` doesn't match the frontend origin, or cookies are blocked cross-origin. Check `SameSite`/`Secure` settings in production. |
| `429 Too Many Requests` when starting a session | You hit a rate limit (see [API overview](#api-overview)). Wait and retry. |
| AI requests fail with 401 | `GROQ_API_KEY` is missing or invalid. |
| `pip install` fails locally | Use Python 3.12 (the version used in the Dockerfile and CI). |

---

## Roadmap

- [ ] Add a `CONTRIBUTING.md`
- [ ] More roles and technologies (full-stack, DevOps, data)
- [ ] Spaced-repetition review mode for study cards
- [ ] Export cards (Markdown / Anki)
- [ ] End-to-end tests (Playwright) and broader frontend test coverage
- [ ] Linting and type-checking in CI (`next lint`, `tsc`, `ruff`)
- [ ] Error monitoring and structured logging in production
- [ ] Internationalisation (UI language selection)

---

## License

Released under the [MIT License](LICENSE).

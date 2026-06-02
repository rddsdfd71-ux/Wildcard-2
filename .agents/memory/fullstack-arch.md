---
name: Fullstack Architecture
description: Wild Card app backend + frontend setup, ports, proxy config, and DB
---

## Stack
- **Frontend**: React + Vite on port 5000 (webview workflow)
- **Backend**: Express + tsx on port 3001
- **Database**: Replit PostgreSQL (DATABASE_URL env var)
- **Start command**: `npm run dev` → concurrently runs `tsx server/index.ts` and `vite`

## Key Files
- `server/index.ts` — all Express routes
- `server/db.ts` — DB pool, schema init, seed data, password hashing (SHA-256 + salt)
- `vite.config.ts` — proxies `/api/*` to `http://localhost:3001`
- `src/lib/analytics.ts` — PostHog wrapper

## Auth
- Passwords: SHA-256 hash + "wildcard_salt_2026" salt (not bcrypt)
- Auth state: localStorage key `wildcard_auth_v2`
- On login/register: call `identifyUser()` from analytics module

**Why:** Frontend-only app had no backend; this adds real persistence and cross-device sync.

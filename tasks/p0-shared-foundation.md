---
title: "P0 — Shared Foundation"
weight: 1
bookFlatSection: true
---

> Works with: Claude Code, Codex CLI, Cursor, Gemini CLI

**Skill file:** `skills/p0-shared-foundation/SKILL.md` — read this before implementing
**Agent workflow:** coder → qa → reviewer → doc-updater → committer

# 🏗️ P0 — Shared Foundation Setup

## Objective

Set up the shared infrastructure that multiple advanced-technology tools depend on — Telegram bot skeleton, SQLite database, cron scheduler, and free-tier hosting. This avoids duplicated effort and ensures all tools share a single bot identity and database.

## Prerequisites

- Node.js ≥ 18 or Python ≥ 3.10 installed locally
- A Telegram account to create a bot via [@BotFather](https://t.me/BotFather)
- A GitHub account (for Actions cron + Pages hosting)
- A free-tier hosting account: Railway.app or Render.com

## Subtasks

### Phase 1: Telegram Bot Skeleton

- [x] Create a new Telegram bot via BotFather, store the token securely in `.env`
- [x] Initialize a Node.js project (`npm init`) with `telegraf` as the bot framework
- [x] Implement a basic `/start` command that replies with a welcome message
- [x] Implement a `/help` command listing all available commands (placeholder list)
- [x] Add error handling middleware (catch + log all unhandled errors)
- [x] Verify the bot responds to `/start` and `/help` locally

### Phase 2: SQLite Database Setup

- [x] Install `better-sqlite3` (Node.js) — chosen over `sqlite3` for synchronous, simpler API
- [x] Create a `db/schema.sql` file with the initial schema
- [x] Write a `db/init.js` script that creates tables from `schema.sql` on first run
- [x] Add a database connection utility (`db/connection.js`) with proper close-on-exit handling
- [x] Seed a test farmer and plot for development

### Phase 3: Cron / Scheduling Infrastructure

- [x] Install `node-cron` for in-process scheduling
- [x] Create a `scheduler/index.js` module that:
  - Loads all registered cron jobs from a job registry
  - Logs each job's next execution time on startup
  - Provides `registerJob(name, cronExpr, handler)` API
- [x] Create a GitHub Actions workflow file (`.github/workflows/daily-cron.yml`) for daily 6 AM BDT execution as a backup/alternative scheduler
- [x] Verify cron job triggers correctly in local testing

### Phase 4: Project Structure & Configuration

- [x] Establish the project structure
- [x] Configure `.env.example` with required variables: `BOT_TOKEN`, `DB_PATH`, `TIMEZONE`
- [x] Add `.gitignore` for `node_modules/`, `.env`, `*.sqlite`
- [x] Write a `README.md` with setup instructions

### Phase 5: Deployment

- [x] Create a `Procfile` or `railway.json` for Railway.app deployment
- [x] Test deployment on Railway.app free tier (or Render.com)
- [x] Verify bot responds from the deployed instance
- [x] Set up environment variables on the hosting platform

## Acceptance Criteria

- [x] Bot responds to `/start` and `/help` on Telegram (both locally and deployed)
- [x] SQLite database file is created on first run with the correct schema
- [x] At least one cron job runs on schedule and logs output
- [x] Project structure matches the defined layout
- [x] `.env.example` documents all required environment variables
- [x] GitHub Actions workflow file is valid YAML
- [x] Winston logger imported and used in every file with side effects
- [x] `npm run lint` passes with zero warnings
- [x] `npm run format:check` passes (Prettier)
- [x] Husky pre-commit hook is installed and verified working
- [x] No hardcoded secrets — all tokens/keys loaded from `.env`
- [x] `src/db/authClient.js` uses `VITE_SUPABASE_ANON_KEY` exclusively — `|| config.supabaseKey` service-role fallback removed (security fix)
- [x] `README.md` updated with setup instructions for P0
- [x] `docs/architecture.md` updated with bot + DB + cron description


## Estimated Effort

⏱️ **1 day** (4–6 hours focused work)

## Dependencies

None — this is the foundational task.

## Tools That Depend on This

- **P1** Farm Scheduler Bot (A) — uses bot + DB + cron
- **P2** Weather Irrigation Alert (B) — uses bot + cron
- **P4** IoT Soil Monitoring (E) — uses bot for alerts
- **P8** Community Farmer Network (H) — extends the bot

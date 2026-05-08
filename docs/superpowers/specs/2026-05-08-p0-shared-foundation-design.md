# Design Spec: P0 — Shared Foundation (Node.js 24)

## 1. Objective
Establish the foundational infrastructure for the ZBNF Farming Assistant. This includes a Telegram bot skeleton, a local SQLite database, a cron scheduler, and automated quality gates (linting, formatting, pre-commit hooks). All implementation files will be consolidated within the `src/` directory.

## 2. Requirements & Constraints
- **Runtime:** Node.js 24 (LTS/Stable).
- **Location:** All source code and tool-specific docs in `src/`.
- **Primary Language:** Bangla (with English subtitles for farmer-facing messages).
- **Security:** No hardcoded secrets; use `.env.example`.
- **Quality:** Zero ESLint warnings, mandatory Prettier formatting, and Husky pre-commit hooks.
- **Logging:** No `console.log`; use Winston for all side effects.

## 3. Architecture

### 3.1 Components (inside `src/`)
- **Bot Engine (`src/bot/`):** Uses `telegraf` to handle Telegram commands.
- **Database (`src/db/`):** Uses `better-sqlite3` for local persistence.
- **Scheduler (`src/scheduler/`):** Uses `node-cron` for recurring agricultural alerts.
- **Config (`src/config/`):** Centralized logger (Winston) and environment loader.
- **Documentation (`src/docs/`):** Setup guide for Node 24 and tool usage.

### 3.2 Data Model (SQLite)
- **`farmers` Table:** Stores Telegram ID, name, and location.
- **`plots` Table:** Stores farmer plot details (crop, soil type, area, etc.).

## 4. Implementation Strategy

### 4.1 Phase 1: Environment & Tooling
1. Initialize `package.json` with Node 24 engine lock.
2. Install dependencies: `telegraf`, `better-sqlite3`, `node-cron`, `winston`, `dotenv`.
3. Set up DevTools: `eslint`, `prettier`, `husky`, `lint-staged`.
4. Create `.eslintrc.cjs` and `.prettierrc` from project templates.
5. Initialize Husky and create the `pre-commit` hook to run `lint-staged`.

### 4.2 Phase 2: Core Infrastructure
1. **Logger:** Create `src/config/logger.js` to handle error and combined logs.
2. **Database:** Create `src/db/schema.sql` and `src/db/init.js` to auto-initialize the SQLite file.
3. **Bot:** Implement `src/bot/index.js` with `/start` (Bangla welcome) and `/help` (Command list).
4. **Scheduler:** Implement `src/scheduler/index.js` for job registration.

### 4.3 Phase 3: Documentation
1. Create `src/.env.example`.
2. Create `src/docs/TOOLS_SETUP.md` with:
   - Node 24 installation steps.
   - Telegram Bot token acquisition.
   - Database initialization command.
   - Verification steps for the pre-commit hook.

## 5. Verification Plan
- **Automated:**
  - `npm run lint` (must pass with 0 warnings).
  - `npm run format:check` (must pass).
  - Verify Husky blocks a commit if linting fails.
- **Manual:**
  - Run `node src/db/init.js` and verify `agri.sqlite` creation.
  - Start bot and verify `/start` and `/help` responses in Bangla.
  - Verify cron job logs "Scheduler Heartbeat" on startup.

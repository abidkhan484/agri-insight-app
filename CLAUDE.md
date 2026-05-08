# ZBNF Farming Assistant — AI Agent Context

## Mission
Zero-cost technology platform to give free tech support to ZBNF farmers in Bangladesh.
Every tool, API, and hosting service MUST be free or open-source. No paid subscriptions.

## CRITICAL: Read Before Any Farming Logic
**Always read `skills/zbnf-formulation/SKILL.md` before implementing any formulation
calculator, reminder schedule, or irrigation advisory.** The ratios are not negotiable —
wrong values give farmers bad advice and damage crops.

---

## Build Order (Sequential — Never Parallelize P-Tasks)

```
P0 (Foundation) → P1 (Bot) → P2 (Weather) → P3 (PWA Records) → P4 (IoT)
                                                               → P5 (Disease)
                                                               → P6 (Knowledge PWA)
                                             → P7 (Local AI)  → P8 (Community)
```

Each P-task has a corresponding skill in `skills/pN-*/SKILL.md`.
Each skill defines the full implementation workflow using the agents below.

---

## Agent Workflow (Use for Every P-Task)

Invoke agents in this exact sequence for each feature:
1. **coder** — implement the feature (reads task MD + ZBNF skill)
2. **qa** — write and run tests (verifies ZBNF ratio outputs)
3. **reviewer** — security + quality check (OWASP, logger presence, Bangla UI)
4. **doc-updater** — update README, docs/, and task checklist
5. **committer** — ESLint + Prettier pass, then conventional commit

Agent files live in `agents/`. Skills live in `skills/`.

---

## Tech Stack (Locked — Do Not Substitute)

| Layer | Choice | Reason |
|-------|--------|--------|
| Bot runtime | Node.js 20+ + Telegraf v4 | Free, mature Telegram library |
| Bot DB | better-sqlite3 | Sync API, no server needed |
| Scheduling | node-cron + GitHub Actions | In-process + backup cron |
| PWA framework | React 18 + Vite + vite-plugin-pwa | Offline-first, small bundle |
| PWA DB | Dexie.js (IndexedDB) | Full offline, no server |
| Disease MVP | PlantNet API | Free, 500 req/day |
| Disease on-device | TensorFlow.js + MobileNetV2 | Runs in browser, free |
| IoT | ESP32 + MQTT + Node-RED + InfluxDB + Grafana | All free/open-source |
| Local AI | Ollama + ChromaDB + LlamaIndex | 100% local, zero API cost |
| Map | Leaflet + OpenStreetMap | No API key, free forever |
| Weather | Open-Meteo API | Free, no key required |
| Hosting (bot) | Railway.app free tier or Render.com | Free tier sufficient |
| Hosting (PWA) | Netlify or GitHub Pages | Free forever |
| Community DB | Supabase free tier | 50k rows, includes auth |

---

## Code Quality Standards (Non-Negotiable)

### Pre-Commit Gate
Every commit MUST pass: `npm run lint` (zero warnings) + `npm run format:check`.
Set up via husky + lint-staged (see `templates/husky-pre-commit.sh`).

### Node.js Logger (Winston)
Every Node.js service file with side effects MUST import the central logger:
```js
import logger from '../config/logger.js';
// Levels: debug (local dev), info (prod), warn, error
// Always include context: logger.info('Plot registered', { farmerId, plotName })
// NEVER log raw telegram_id — always label it: { ctx: 'farmer:' + telegram_id }
```
Logger config template: `templates/logger.js`

### Python Logger (P7)
```python
import structlog
logger = structlog.get_logger()
logger.info("query_received", question=q, language="bn")
```

### Browser/PWA Logger (P3, P5, P6)
```js
import log from 'loglevel';
log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');
log.info('Harvest recorded', { plotId, crop, quantity_kg });
```

### No console.log in Production Code
Use the appropriate logger. `console.log` is blocked by ESLint rule.

---

## Security Rules

- Never hardcode `BOT_TOKEN`, DB_PATH, API keys — always `.env`
- Validate all farmer inputs before DB writes (area > 0, valid date format, etc.)
- Bot commands verify sender is registered farmer before accessing their data
- Parameterized queries only (better-sqlite3 prepared statements)
- Input sanitization before Telegram message construction
- `.env` file must never be committed — it's in `.gitignore`

---

## Bangla UI Requirements

- All farmer-facing Telegram messages: **Bangla first**, English subtitle
- All PWA form labels: Bangla primary, small English hint below
- Bangla Unicode only — never transliteration (e.g., "জীবামৃত" not "Jeevamrutha" alone)
- See `skills/zbnf-formulation/SKILL.md` for full Bangla/English glossary

---

## Free Services Reference

| Service | Purpose | Free Limit |
|---------|---------|-----------|
| Railway.app | Node.js bot hosting | $5 credit/month (sufficient) |
| Render.com | Alternative hosting | 750 hrs/month free |
| GitHub Actions | Cron jobs, CI | 2,000 min/month free |
| Open-Meteo | Weather forecast API | Unlimited, no key |
| PlantNet | Disease identification | 500 req/day |
| HiveMQ public | MQTT broker (dev) | Public free broker |
| Supabase | Community farmer map | 50k rows, auth included |
| Netlify | PWA hosting | Unlimited static sites |
| GitHub Pages | Wiki/knowledge base | Unlimited |
| Ollama | Local LLM inference | Free, runs locally |
| ChromaDB | Vector store | Free, runs locally |
| OpenStreetMap | Map tiles | Free forever |

---

## Project Structure (Target)

```
agri-bot/                   ← P0 creates this
├── bot/
│   ├── commands/           ← One file per /command
│   ├── middleware/
│   └── index.js
├── config/
│   ├── index.js            ← Load .env, export config
│   └── logger.js           ← Winston logger (create first)
├── db/
│   ├── schema.sql
│   ├── connection.js
│   └── init.js
├── scheduler/index.js
├── services/               ← Business logic
├── logs/                   ← Created at runtime, gitignored
├── docs/                   ← Technical + usage docs
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .husky/pre-commit
└── package.json
```

---

## Session Progress Tracking

After completing each P-task, update `.session/progress.json`:
```json
{
  "completed": ["P0", "P1"],
  "current": "P2",
  "last_updated": "2026-05-08T10:00:00Z",
  "notes": "P1 complete. Pre-commit hook confirmed working."
}
```
The `Stop` hook auto-saves this file. `SessionStart` hook loads it and prints current status.

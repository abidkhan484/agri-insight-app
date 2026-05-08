# ZBNF Farming Assistant

A **zero-cost** agentic technology platform delivering free tech support to Zero Budget Natural Farming (ZBNF) farmers in Bangladesh. Every tool, API, and hosting service is free or open-source.

> All ZBNF formulation ratios are non-negotiable — wrong values damage crops. Always read `skills/zbnf-formulation/SKILL.md` before touching any farming calculation.

---

## Tools (P0–P8)

| Phase | Tool | What It Does |
|-------|------|--------------|
| P0 | Shared Foundation | SQLite DB, Winston logger, ESLint/Prettier, Husky pre-commit |
| P1 | Farm Scheduler Bot | Telegram bot with ZBNF auto-reminders (Jeevamrutha, Neemastra, Mulch) |
| P2 | Weather Irrigation Alert | Open-Meteo forecasts → skip/spray/heat alerts via Telegram |
| P3 | Farm Record Tracker | React PWA + IndexedDB — offline crop logs, yield charts, CSV/PDF export |
| P4 | IoT Soil Monitoring | ESP32 + MQTT + Node-RED + Grafana — real-time Whapasa soil alerts |
| P5 | Plant Disease Detection | PlantNet API + TF.js MobileNetV2 — photo → Bangla disease + ZBNF treatment |
| P6 | ZBNF Knowledge PWA | Offline formulation calculators, pest gallery, crop calendar (Bangla-first) |
| P7 | Local AI Assistant | Ollama + ChromaDB RAG — Bangla/English ZBNF Q&A, runs fully offline |
| P8 | Community Network | Telegram FAQ bot, Supabase farmer map (Leaflet/OSM), knowledge wiki |

**Build order is sequential:** P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Bot | Node.js 20+ · Telegraf v4 · better-sqlite3 · node-cron |
| PWA | React 18 · Vite · vite-plugin-pwa · Dexie.js |
| IoT | ESP32 · MQTT · Node-RED · InfluxDB · Grafana |
| AI | Ollama · ChromaDB · LlamaIndex · Flask |
| Map | Leaflet · OpenStreetMap · Supabase (free tier) |
| Weather | Open-Meteo (free, no key) |
| Hosting | Railway.app / Render.com (bot) · Netlify / GitHub Pages (PWAs) |

---

## Project Layout

```
agents/          ← Sub-agent definitions (coder, qa, reviewer, doc-updater, committer)
skills/          ← Per-phase skill files (SKILL.md in each)
tasks/           ← P0–P8 implementation checklists
docs/            ← architecture.md · developer-setup.md · api-reference.md · farmer-guide-bn-en.md
templates/       ← .eslintrc.cjs · .prettierrc · logger.js · husky-pre-commit.sh
scripts/         ← update-progress.js (tracks .session/progress.json)
.claude/         ← Hook scripts + settings.json
```

---

## Agent Workflow

For every feature, invoke agents in this order:

```
coder → qa → reviewer → doc-updater → committer
```

Agent definitions live in `agents/`. Skills live in `skills/`.

---

## Code Quality (Non-Negotiable)

- **ESLint** `no-console: error` — use Winston (Node.js), loglevel (React), structlog (Python)
- **Prettier** — single quotes, trailing commas, 100 char width
- **Husky pre-commit** — tsc → lint → format → test; zero warnings allowed
- **Bangla first** in all farmer-facing Telegram messages and PWA labels
- **No hardcoded secrets** — all config from `.env` (never committed)
- **Parameterized SQL only** — better-sqlite3 prepared statements

---

## Quick Start

See [docs/developer-setup.md](docs/developer-setup.md) for the full setup walkthrough.  
See [docs/farmer-guide-bn-en.md](docs/farmer-guide-bn-en.md) for all Telegram commands in Bangla + English.

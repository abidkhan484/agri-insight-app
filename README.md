# ZBNF Farming Assistant

A **zero-cost** agentic technology platform delivering free tech support to Zero Budget Natural Farming (ZBNF) farmers in Bangladesh. Every tool, API, and hosting service is free or open-source.

> All ZBNF formulation ratios are non-negotiable — wrong values damage crops. Always read `skills/zbnf-formulation/SKILL.md` before touching any farming calculation.

---

## Status: P1 Completed ✅

The system currently supports farmer registration, plot management, and automated ZBNF reminders (Jeevamrutha, Neemastra, Mulch, Irrigation).

---

## Tools (P0–P8)

| Phase | Tool | Status | What It Does |
|-------|------|--------|--------------|
| P0 | Shared Foundation | ✅ | SQLite DB, Winston logger, ESLint/Prettier, Husky pre-commit |
| P1 | Farm Scheduler Bot | ✅ | Telegram bot with ZBNF auto-reminders |
| P2 | Weather Irrigation Alert | 🛠️ | Open-Meteo forecasts → skip/spray/heat alerts via Telegram |
| P3 | Farm Record Tracker | 🛠️ | React PWA + IndexedDB — offline crop logs |
| P4 | IoT Soil Monitoring | 🛠️ | ESP32 + MQTT + Node-RED + Grafana — Whapasa soil alerts |
| P5 | Plant Disease Detection | 🛠️ | Photo → Bangla disease identification + ZBNF treatment |
| P6 | ZBNF Knowledge PWA | 🛠️ | Offline formulation calculators, pest gallery |
| P7 | Local AI Assistant | 🛠️ | Ollama + ChromaDB RAG — Bangla/English ZBNF Q&A |
| P8 | Community Network | 🛠️ | Telegram FAQ bot, Supabase farmer map |

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
docs/            ← architecture.md · farmer-guide-bn-en.md · CODEMAPS/
src/             ← Source code (Bot, Scheduler, Services)
templates/       ← Config templates
scripts/         ← Automation scripts
```

---

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Farmer Guide (Bangla + English)](docs/farmer-guide-bn-en.md)
- [Codemaps Index](docs/CODEMAPS/INDEX.md)
- [Developer Setup](docs/developer-setup.md)

---

## Code Quality (Non-Negotiable)

- **ESLint** `no-console: error` — use Winston (Node.js)
- **Prettier** — single quotes, trailing commas, 100 char width
- **Husky pre-commit** — lint → format → test; zero warnings allowed
- **Bangla first** in all farmer-facing Telegram messages
- **Parameterized SQL only** — better-sqlite3 prepared statements

---

## Quick Start

1. `cd src`
2. `npm install`
3. `cp .env.example .env` (Add your `BOT_TOKEN`)
4. `npm run dev`

See [docs/developer-setup.md](docs/developer-setup.md) for full instructions.

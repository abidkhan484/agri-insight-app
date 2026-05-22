# ZBNF Farming Assistant

A **zero-cost** agentic technology platform delivering free tech support to Zero Budget Natural Farming (ZBNF) farmers in Bangladesh. Every tool, API, and hosting service is 100% free or open-source.

> [!IMPORTANT]
> **ZBNF Formulation Ratios are Non-Negotiable**: Wrong recipe values damage crops. Always consult the local formulation skill manual at `skills/zbnf-formulation/SKILL.md` before writing or editing any farming calculation.

---

## System Overview

The ZBNF Farming Assistant is a production-grade ecosystem supporting natural farming:
*   **Farmer Registry & Plot Management**: Telegram bot botting with interactive workflows.
*   **Automated ZBNF Reminders**: Timely schedulers based on planting calendars.
*   **Weather Alerts**: Real-timeOpen-Meteo analysis mapping heat waves and storm warnings.
*   **Offline Record Keeper**: Unified React PWA utilizing IndexedDB for remote field logs.
*   **IoT Soil Telemetry**: Capacitive and environmental sensors broadcasting soil hydration alerts.
*   **Desi Cow Finder & FAQ**: A peer-to-peer directory for sourcing local ingredients.
*   **Bangla AI Q&A Assistant**: Offline-first RAG querying ZBNF manuals natively in Bangla.

---

## Tech Stack

| Layer | Choice |
| :--- | :--- |
| **Bot Backend** | Node.js 20+ · Telegraf v4 · Supabase · node-cron |
| **Unified PWA** | React 19 · Vite 8 · Telegram Mini Apps · Dexie.js |
| **IoT Hardware** | ESP32 · MQTT · Node-RED · InfluxDB · Grafana |
| **AI Engine** | Ollama (Gemma2:2b) · ChromaDB · Flask RAG |
| **Database** | Supabase (PostgreSQL + RLS + Triggers + PostGIS) |
| **APIs** | Open-Meteo (Weather) · PlantNet API (Disease) |
| **Hosting** | Render.com (Bot) · GitHub Pages (PWA) |

---

## 🤖 Portable Multi-Agent Pipelines

This repository implements a **100% self-contained multi-agent pipeline** that works out-of-the-box on other devices immediately upon cloning—without requiring global IDE extensions.

### Running Workflows Natively (Claude Code)
If you are running in Claude Code, execute custom TOML commands directly in the CLI using the `@` symbol:

*   **Test-Driven Development (TDD)**: Automates the Red-Green-Refactor loop:
    ```bash
    @tdd phase=P9 feature="SMS Fallback Alerts" test_file="src/__tests__/sms.test.js"
    ```
*   **End-to-End Implementation**: Orchestrates all sub-agents (Architect → Developer → Reviewer → QA → Committer) for a single feature:
    ```bash
    @full-pipeline phase=P9 feature="SMS Fallback Alerts"
    ```
*   **Manual Security & Code Quality Gate**:
    ```bash
    @quality-check
    ```

### Running Workflows Universally (Gemini CLI / Codex / Terminals)
For environments where the assistant doesn't natively parse `@` commands, run the pipeline programmatically using standard shell commands:
```bash
# Execute TDD workflow
node scripts/run-pipeline.js tdd phase=P9 feature="SMS Fallback Alerts" test_file="src/__tests__/sms.test.js"

# Execute full pipeline
node scripts/run-pipeline.js full-pipeline phase=P9 feature="SMS Fallback Alerts"

# Execute a quality check
node scripts/run-pipeline.js quality-check
```

---

## Project Layout

```
src/               ← Telegram bot backend (Node.js + Telegraf + Supabase)
client/            ← Unified React PWA (React 19 + Vite 8)
  src/modules/
    krishi-record/ ← Farm Record Tracker PWA
    disease-detect/← Plant Disease Detection PWA
    knowledge/     ← ZBNF Knowledge Base PWA
    map/           ← Farmer Map (Leaflet)
ai-assistant/      ← Local AI RAG server (Flask + LlamaIndex)
firmware/          ← ESP32 Arduino telemetry sketches
docs/              ← Architecture plans, guides, specs
.claude/
  hooks/           ← Post-tool Prettier auto-formatter & console.log check hooks
  settings.json    ← Safe and audited sandbox command permissions
agents/            ← Persona configurations (coder, qa, reviewer, doc-updater, committer)
commands/          ← Custom workflow orchestrators (.toml files)
skills/            ← Shared reference guides (TDD, Security checks, ZBNF recipe ratios)
```

---

## Code Quality (Non-Negotiable)

*   **Zero console.log in Production**: ESLint blocks standard output before staging. Use the custom Winston logger in Node.js services (`config/logger.js`) and `loglevel` in client code.
*   **Prettier Formatting**: Single quotes, trailing commas, 100 character max-width. (Enforced automatically on every file edit via `.claude/hooks/auto-format.js`).
*   **Bangla First**: All farmer-facing UI text and messages must be in Bangla.
*   **Row-Level Security (RLS)**: Enforced on all Supabase PostgreSQL tables. All database interactions must use the `dbService` connection layer.

---

## Quick Start

### 1. Bot Setup
```bash
cd src
npm install
cp ../.env.example ../.env   # Add your BOT_TOKEN + Supabase credentials
npm start
```

### 2. Client (PWA) Setup
```bash
cd client
npm install
npm run dev                  # Serves PWA on http://localhost:5173
```

Refer to [docs/developer-setup.md](docs/developer-setup.md) for full configurations.

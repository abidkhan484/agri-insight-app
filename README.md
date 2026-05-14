# ZBNF Farming Assistant

A **zero-cost** agentic technology platform delivering free tech support to Zero Budget Natural Farming (ZBNF) farmers in Bangladesh. Every tool, API, and hosting service is free or open-source.

> All ZBNF formulation ratios are non-negotiable — wrong values damage crops. Always read `skills/zbnf-formulation/SKILL.md` before touching any farming calculation.

---

## Status: P8 Community Network Completed ✅

The system supports farmer registration, plot management, automated ZBNF reminders, weather alerts, offline record keeping, IoT soil monitoring, plant disease detection, offline ZBNF knowledge base, a local AI assistant for ZBNF Q&A, and a community-driven farmer network with mapping and FAQ support.

---

## Tools (P0–P8)

| Phase | Tool | Status | What It Does |
|-------|------|--------|--------------|
| P0 | Shared Foundation | ✅ | SQLite DB, Winston logger, ESLint/Prettier, Husky pre-commit |
| P1 | Farm Scheduler Bot | ✅ | Telegram bot with ZBNF auto-reminders |
| P2 | Weather Irrigation Alert | ✅ | Open-Meteo forecasts → skip/spray/heat alerts via Telegram |
| P3 | Farm Record Tracker | ✅ | React PWA + IndexedDB — offline crop logs |
| P4 | IoT Soil Monitoring | ✅ | ESP32 + MQTT + Node-RED + Grafana — Whapasa soil alerts |
| P5 | Plant Disease Detection | ✅ | Photo → Bangla disease identification + ZBNF treatment |
| P6 | ZBNF Knowledge PWA | ✅ | Offline formulation calculators, pest gallery, crop calendar |
| P7 | Local AI Assistant | ✅ | Ollama + ChromaDB RAG — Bangla/English ZBNF Q&A |
| P8 | Community Network | ✅ | Telegram FAQ bot, Supabase farmer map, pest alerts |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Bot | Node.js 20+ · Telegraf v4 · better-sqlite3 · node-cron |
| PWA | React 19 · Vite · vite-plugin-pwa · Dexie.js |
| IoT | ESP32 · MQTT · Node-RED · InfluxDB · Grafana |
| AI | Ollama · ChromaDB · LlamaIndex · Flask |
| Map | Leaflet · OpenStreetMap · Supabase (free tier) |
| Weather | Open-Meteo (free, no key) |
| Disease | PlantNet API (free tier) · TensorFlow.js (offline fallback) |
| Hosting | Railway.app / Render.com (bot) · Netlify / GitHub Pages (PWAs) |

---

## Community Farmer Network (P8)

### Features
- **FAQ Bot**: Instant ZBNF answers via `/faq <keyword>` using a curated local dictionary.
- **Farmer Map**: Interactive map displaying ZBNF farms, desi cow sources, and regional pest alerts.
- **Pest Alerts**: Community-driven pest reporting that broadcasts alerts to nearby farmers.
- **Desi Cow Finder**: Directory of farmers providing desi cow dung and urine (essential for ZBNF).

### Commands
- `/faq [keyword]` - Get ZBNF recipe or info.
- `/joinmap` - Get the link to join the Farmer Map.
- `/reportpest` - Report a pest outbreak in your area.

---

## Local AI Assistant (P7)

### Ollama Setup
1. **Install Ollama**: `curl -fsSL https://ollama.com/install.sh | sh`
2. **Pull Models**:
   ```bash
   ollama pull gemma2:2b
   ollama pull nomic-embed-text
   ```
3. **Run AI Service**:
   ```bash
   cd ai-assistant
   pip install -r requirements.txt
   python app.py
   ```
4. **Usage**: Use the `/ask` command in the Telegram bot or access the Flask API at `http://localhost:5000/ask`.

---

## Plant Disease Detection (P5)

### API Setup
- **Primary Engine**: PlantNet API
- **API Key**: Get one at [my.plantnet.org](https://my.plantnet.org)
- **Env Variable**: `VITE_PLANTNET_API_KEY`
- **Offline Fallback**: TF.js with a quantized MobileNetV2 model stored in `public/models/plant-disease/`

---

## ZBNF Knowledge PWA (P6)

### Features
- **Calculators**: Accurate dose calculation for 6 ZBNF formulations (Jeevamrutha, Beejamrutha, etc.) based on land area.
- **Pest Gallery**: Offline searchable database of 30+ common pests with ZBNF treatments.
- **Crop Calendar**: Seasonal planting windows for all 8 divisions of Bangladesh.
- **Offline First**: Works 100% offline via Service Workers (Workbox).

---

## Hardware & IoT (P4)

### Hardware Requirements
- **Microcontroller**: ESP32 (NodeMCU or similar)
- **Soil Moisture**: Capacitive Soil Moisture Sensor (v1.2)
- **Environment**: DHT22 Temperature & Humidity Sensor
- **Power**: 18650 Li-ion battery + TP4056 Charger + 5V Solar Panel (for field deployment)

### MQTT Setup
- **Broker**: `broker.hivemq.com` (for development)
- **Port**: `1883`
- **Topic**: `farm/{plot_id}/sensors`
- **Payload Format**:
  ```json
  {
    "moisture": 45.2,
    "temp": 30.5,
    "humidity": 65.0,
    "ts": "2024-05-20T10:00:00Z"
  }
  ```

---

## Project Layout

```
agents/          ← Sub-agent definitions (coder, qa, reviewer, doc-updater, committer)
ai-assistant/    ← P7 Local AI Assistant (Flask + LlamaIndex + ChromaDB)
skills/          ← Per-phase skill files (SKILL.md in each)
tasks/           ← P0–P8 implementation checklists
docs/            ← architecture.md · farmer-guide-bn-en.md · CODEMAPS/
src/             ← Source code (Bot, Scheduler, Services)
templates/       ← Config templates
scripts/         ← Automation scripts
disease-detect/  ← P5 Plant Disease Detection PWA
krishi-record/   ← P3 Farm Record Tracker PWA
zbnf-knowledge/  ← P6 ZBNF Knowledge Base PWA
map-pwa/         ← P8 Farmer Map PWA
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

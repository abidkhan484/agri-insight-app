# ZBNF Farming Assistant — Architecture

## System Overview

The ZBNF Farming Assistant is a zero-cost technology platform composed of **9 loosely coupled components** (P0–P8). All components communicate via Telegram, a shared SQLite database, and free external APIs.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ZBNF Farming Assistant Platform                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     P0 — Shared Foundation                           │    │
│  │  Telegram Bot (Telegraf v4) │ SQLite (better-sqlite3) │ node-cron   │    │
│  │  Winston Logger │ ESLint + Prettier │ Husky pre-commit hook          │    │
│  └──────────────────────────┬──────────────────────────────────────────┘    │
│                             │ shared bot identity + DB                        │
│              ┌──────────────┼───────────────────┐                           │
│              ▼              ▼                   ▼                            │
│  ┌───────────────┐ ┌───────────────┐ ┌──────────────────┐                  │
│  │ P1 — Scheduler│ │P2 — Weather   │ │  P3 — PWA Records│                  │
│  │    Bot        │ │   Alert       │ │  (React + Dexie) │                  │
│  │/register      │ │Open-Meteo API │ │  IndexedDB local │                  │
│  │/addplot       │ │Whapasa rules  │ │  harvest + input │                  │
│  │Jeevamrtha     │ │Daily 6AM cron │ │  logs + reports  │                  │
│  │reminder cron  │ └───────────────┘ └──────────────────┘                  │
│  └───────┬───────┘                                                           │
│          │ plot data                                                          │
│          ▼                                                                    │
│  ┌───────────────┐ ┌───────────────┐ ┌──────────────────┐                  │
│  │ P4 — IoT Soil │ │P5 — Disease   │ │  P6 — Knowledge  │                  │
│  │   Monitoring  │ │   Detection   │ │  PWA (offline)   │                  │
│  │ESP32 → MQTT   │ │PlantNet API   │ │  6 calculators   │                  │
│  │Node-RED flow  │ │TF.js fallback │ │  pest gallery    │                  │
│  │InfluxDB store │ │ZBNF treatment │ │  vite-plugin-pwa │                  │
│  │Grafana dash   │ │     map       │ │                  │                  │
│  │Telegram alert │ └───────────────┘ └──────────────────┘                  │
│  └───────────────┘                                                           │
│                                                                               │
│  ┌───────────────────────────┐ ┌────────────────────────────────────────┐   │
│  │  P7 — Local AI Assistant  │ │       P8 — Community Network           │   │
│  │  Ollama (gemma2:2b)       │ │  FAQ bot │ Supabase farmer map         │   │
│  │  ChromaDB vector store    │ │  Leaflet │ OpenStreetMap tiles          │   │
│  │  LlamaIndex RAG pipeline  │ │  /joinmap │ /faq commands               │   │
│  │  Flask REST API           │ └────────────────────────────────────────┘   │
│  │  /ask Telegram command    │                                               │
│  └───────────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Descriptions

### P0 — Shared Foundation
- **Runtime**: Node.js 20+ ESM
- **Bot framework**: Telegraf v4
- **Database**: better-sqlite3 (synchronous, file-based, no server)
- **Scheduler**: node-cron (in-process) + GitHub Actions daily-cron.yml (backup)
- **Logger**: Winston (JSON to files, colorized to console)
- **Hosting**: Railway.app free tier or Render.com (750 hrs/month)

### P1 — Farm Scheduler Bot
- **Commands**: `/register`, `/addplot`, `/log`, `/report`, `/reminders`
- **Bot patterns**: Telegraf `Scenes.WizardScene` for multi-step registration
- **Cron jobs**: Jeevamrutha (every 15 days), Neemastra (every 14 days), Mulch (every 7 days)
- **Formula source**: `skills/zbnf-formulation/SKILL.md` — non-negotiable ratios

### P2 — Weather Irrigation Alert
- **API**: Open-Meteo (no key, unlimited free requests)
- **Decision logic**: Whapasa rules — if 48h precip > 5mm → skip irrigation
- **Cron**: 00:00 UTC = 06:00 BDT daily
- **GPS dedup**: groups plots by coordinate to avoid redundant API calls

### P3 — Farm Record Tracker PWA
- **Framework**: React 18 + Vite
- **Offline DB**: Dexie.js (IndexedDB wrapper)
- **Data model**: plots, inputLogs, observations, harvests
- **Reports**: Chart.js + PDF (jsPDF) + CSV (PapaParse) export
- **Hosting**: Netlify (free, unlimited static sites)

### P4 — IoT Soil Monitoring
- **Hardware**: ESP32 + capacitive soil moisture sensor + DHT22
- **Protocol**: MQTT (HiveMQ public for dev; Mosquitto on Pi for prod)
- **Processing**: Node-RED flow with threshold evaluation + cooldown gate
- **Storage**: InfluxDB OSS (time-series)
- **Visualization**: Grafana OSS dashboard (4 panels per plot)
- **Alerts**: Telegram via bot API (2-hour cooldown per alert type per plot)

### P5 — Plant Disease Detection
- **Primary**: PlantNet API — 500 req/day free
- **Fallback**: TensorFlow.js + MobileNetV2 — runs in browser, fully offline
- **Treatment map**: `disease-treatments.json` — disease genus → ZBNF formulation
- **Hosting**: Netlify (PWA)

### P6 — ZBNF Knowledge PWA
- **Calculators**: Jeevamrutha, Beejamrutha, Neemastra, Agniastra, Brahmastra, Mulch
- **Content**: Pest gallery (images + treatment), Bangla glossary, application calendar
- **Offline**: vite-plugin-pwa + Workbox service worker (precaches all assets)
- **Hosting**: Netlify or GitHub Pages

### P7 — Local AI Assistant
- **LLM**: Ollama (gemma2:2b default; llama3:8b alternative)
- **Embeddings**: nomic-embed-text (local Ollama model)
- **Vector store**: ChromaDB (persistent, local file)
- **RAG**: LlamaIndex (indexes SKILL.md + docs/)
- **API**: Flask 3.x REST on port 5000
- **Telegram**: `/ask` command with 90-second timeout
- **Logging**: structlog JSON

### P8 — Community Farmer Network
- **Database**: Supabase PostgreSQL (50k rows free)
- **RLS**: Public read on farmer_locations and faq_entries; service role write only
- **Map**: Leaflet + OpenStreetMap (no API key, free forever)
- **Map PWA**: React + react-leaflet, hosted on Netlify
- **Privacy**: District-level location only; no telegram_id in Supabase

---

## Data Flow Diagrams

### Bot → SQLite → Scheduler → Telegram (P0–P2)

```
Farmer types /register
      │
      ▼
Telegraf WizardScene
 (collect name, district, plot data)
      │
      ▼
better-sqlite3 (sync write)
 INSERT INTO farmers, plots
      │
      ▼
node-cron daily check (00:00 UTC)
 SELECT due reminders
      │
      ▼
 calculateJeevamrutha(area)     ← skills/zbnf-formulation/SKILL.md
      │
      ▼
 bot.telegram.sendMessage(farmerId, banglaMessage)
      │
      ▼
Farmer's Telegram app
```

### IoT Data Flow (P4)

```
ESP32 sensors (every 5 min)
  moisture + temp + humidity
      │
      ▼
MQTT publish
  topic: farm/{plot_id}/sensors
      │
      ▼
HiveMQ broker (dev) / Mosquitto (prod)
      │
      ▼
Node-RED flow
  ├── evaluate Whapasa thresholds
  ├── cooldown gate (2h per alert type per plot)
  ├── [if alert] HTTP POST → Telegram Bot API
  └── InfluxDB Out → soil_readings measurement
      │
      ▼
Grafana dashboard
  (moisture gauge, 24h trend, temp/humidity, alert history)
      │
      ▼
Farmer via Telegram alert
```

### AI Pipeline (P7)

```
Document ingestion (one-time):
  skills/zbnf-formulation/SKILL.md
  docs/farmer-guide-bn-en.md
  docs/api-reference.md
  tasks/*.md
      │
      ▼
nomic-embed-text (Ollama local)
  → text embeddings
      │
      ▼
ChromaDB PersistentClient
  stored in ./chroma_db/

Query flow (runtime):
Farmer: /ask জীবামৃত কীভাবে তৈরি করব?
      │
      ▼
Bot → Flask POST /ask
      │
      ▼
LlamaIndex query engine
  → ChromaDB similarity search (top-4 chunks)
      │
      ▼
Ollama LLM (gemma2:2b local)
  + retrieved context + Bangla system prompt
      │
      ▼
Answer → Flask response → Bot → Farmer Telegram
```

---

## Database Schema (SQLite — agri-bot)

```sql
farmers (id, telegram_id UNIQUE, name, district, upazila, latitude, longitude, created_at)
plots   (id, farmer_id FK, name, area_decimal, soil_type, crop, start_date, latitude, longitude)
reminders (id, plot_id FK, type, next_due, interval_days, active)
reminder_logs (id, reminder_id FK, sent_at, batch_summary)
weather_alerts (id, plot_id FK, alert_type, message, sent_at)
soil_readings (id, plot_id, moisture, temp, humidity, ts)  ← IoT cache from InfluxDB
map_registrations (id, telegram_id UNIQUE, registered_at)
```

---

## Technology Decisions

| Decision | Choice | Alternatives Rejected | Reason |
|----------|--------|-----------------------|--------|
| Bot DB | better-sqlite3 | PostgreSQL, MongoDB | Sync API, zero server, free |
| Scheduling | node-cron + GitHub Actions | Celery, BullMQ | Simplest for single-process bot |
| PWA offline | Dexie.js (IndexedDB) | localStorage, PouchDB | Full offline, relational-ish queries |
| AI inference | Ollama (local) | OpenAI API, Gemini | Zero cost, no data leaves device |
| Vector store | ChromaDB | Pinecone, Weaviate | Free, local, Python-native |
| Map tiles | OpenStreetMap | Google Maps, Mapbox | No API key, free forever, privacy |
| IoT broker | HiveMQ public / Mosquitto | AWS IoT, CloudMQTT | Free, no vendor lock-in |
| Time-series DB | InfluxDB OSS | TimescaleDB, Firebase | Free, purpose-built, Grafana native |

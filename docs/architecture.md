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
│  │/myplots       │ │Whapasa rules  │ │  harvest + input │                  │
│  │/myreminders   │ │Daily 6AM cron │ │  logs + reports  │                  │
│  │Jeevamrtha     │ └───────────────┘ └──────────────────┘                  │
│  │reminder cron  │                                                           │
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
- **Commands**: `/register`, `/myplots`, `/deleteplot`, `/myreminders`, `/cancelreminder`, `/remind`
- **Bot patterns**: Telegraf `Scenes.WizardScene` for multi-step plot registration
- **Cron jobs**: Jeevamrutha (every 15 days), Neemastra (every 14 days), Mulch (every 7 days)
- **Formula source**: `src/services/jeevamrutha.js` (synced with `skills/zbnf-formulation/SKILL.md`)

### P2 — Weather Irrigation Alert
- **API**: Open-Meteo (no key, unlimited free requests)
- **Decision logic**: Whapasa rules — if 48h precip > 5mm → skip irrigation
- **Cron**: 00:00 UTC = 06:00 BDT daily
- **Entry point**: `src/scheduler/weather-alerts.js`

### P3 — Farm Record Tracker PWA
- **Framework**: React 19 + Vite 8
- **Offline DB**: Dexie.js (IndexedDB wrapper)
- **Features**: Plot management, Input logging (Jeevamrutha, etc.), Observation tracking (earthworms, pests), Harvest & Revenue recording, Visual Reports (Chart.js), CSV/PDF export.
- **Path**: `krishi-record/`

### P4 — IoT Soil Monitoring
- **Hardware**: ESP32 + capacitive soil moisture sensor + DHT22
- **Protocol**: MQTT
- **Processing**: Node-RED evaluations of Whapasa thresholds
- **Visualization**: Grafana Dashboards via InfluxDB
- **Telegram**: `/soilstatus` command and real-time alerts

### P5 — Plant Disease Detection
- **Primary**: PlantNet API (Online identification)
- **Fallback**: TensorFlow.js (Offline on-device inference)
- **Mapping**: Scientific name → Local disease name → ZBNF Treatment (local JSON)
- **Path**: `disease-detect/`

### P6 — ZBNF Knowledge PWA
- **Framework**: React 19 + Vite 8 + `vite-plugin-pwa`
- **Calculators**: Area-based dosage for Jeevamrutha, Beejamrutha, Neemastra, Agniastra, Brahmastra, and Mulch.
- **Content**: Pest gallery with photos/symptoms/ZBNF-treatment, crop calendar by BD division.
- **Offline Strategy**: Service Workers (Workbox) pre-caching all assets and JSON data.
- **Path**: `zbnf-knowledge/`

### P7 — Local AI Assistant
- **Inference**: Ollama (gemma2:2b) running locally.
- **Orchestration**: LlamaIndex for RAG pipeline.
- **Vector Store**: ChromaDB (local persistence).
- **Service**: Flask REST API providing a `/ask` endpoint.
- **Features**: Semantic search over ZBNF docs, grounded answers in Bangla/English.
- **Path**: `ai-assistant/`

### P8 — Community Farmer Network (Roadmap)
- **Database**: Supabase PostgreSQL
- **Map**: Leaflet + OpenStreetMap

---

## Data Flow Diagrams

### AI Assistant RAG Pipeline (P7)

```
Farmer types /ask "কীভাবে জীবামৃত তৈরি করব?"
      │
      ▼
Telegram Bot (agri-bot)
      │
      ▼ (POST /ask)
Flask AI Service (ai-assistant)
      │
      ├──▶ Embedding Model (nomic-embed-text)
      │      (Converts question to vector)
      │
      ├──▶ ChromaDB Search
      │      (Retrieves top 4 relevant ZBNF doc chunks)
      │
      ├──▶ LlamaIndex Orchestrator
      │      (Combines Context + System Prompt + Question)
      │
      └──▶ Ollama (gemma2:2b)
             (Generates grounded Bangla answer)
      │
      ▼
JSON Response {answer, sources}
      │
      ▼
Telegram Bot (formats message with citations)
      │
      ▼
Farmer's Telegram (Bangla Answer + Source docs)
```

### Bot → SQLite → Scheduler → Telegram (P0–P2)

```
Farmer types /register
      │
      ▼
Telegraf WizardScene
 (collect name, area, crop, start_date)
      │
      ▼
better-sqlite3 (sync write)
 INSERT INTO plots, reminders
      │
      ▼
node-cron daily check (00:00 UTC)
 SELECT due reminders
      │
      ▼
 calculateJeevamrutha(area)     ← src/services/jeevamrutha.js
      │
      ▼
 bot.telegram.sendMessage(farmerId, banglaMessage)
      │
      ▼
Farmer's Telegram app
```

### IoT Soil Monitoring Flow (P4)

```
ESP32 (Soil/Temp/Hum)
      │
      ▼ (MQTT: farm/{plot_id}/sensors)
HiveMQ / Mosquitto Broker
      │
      ▼
Node-RED Flow
      ├──▶ InfluxDB → Grafana Dashboard
      └──▶ Evaluate Whapasa (Moisture %)
             │
             ▼ (if alert triggered)
         Telegram Bot API
             │
             ▼
      Farmer's Telegram (Bangla/English Alert)
```

### Plant Disease Detection Flow (P5)

```
Farmer takes photo of leaf
      │
      ▼
Mobile PWA (disease-detect)
      │
      ├── (Online) ──▶ PlantNet API
      │                  │
      │                  ▼ (Species Result)
      │
      └── (Offline) ─▶ TF.js (MobileNetV2)
                         │
                         ▼ (Classification Result)
      │
      ▼
Local Treatment Lookup (src/data/disease-treatments.json)
      │
      ▼
Bangla Result + ZBNF Recipe
      │
      ▼
Farmer implements natural treatment
```

---

## Database Schema (SQLite — agri-bot)

```sql
farmers (id, telegram_id UNIQUE, name, district, upazila, created_at)
plots   (id, farmer_id FK, name, area_decimal, soil_type, crop, start_date, latitude, longitude, created_at)
reminders (id, plot_id FK, type, next_due, interval_days, description, active, created_at)
reminder_logs (id, reminder_id FK, sent_at, status, message)
weather_alerts (id, plot_id FK, alert_type, message, forecast_data, sent_at)
soil_readings (id, plot_id FK, moisture, temp, humidity, ts)
```

---

## Technology Decisions

| Decision | Choice | Alternatives Rejected | Reason |
|----------|--------|-----------------------|--------|
| Bot DB | better-sqlite3 | PostgreSQL, MongoDB | Sync API, zero server, free |
| Scheduling | node-cron + GitHub Actions | Celery, BullMQ | Simplest for single-process bot |
| PWA offline | Dexie.js (IndexedDB) | localStorage, PouchDB | Full offline, relational-ish queries |
| AI inference | Ollama (local) | OpenAI API, Gemini | Zero cost, no data leaves device |
| IoT Protocol | MQTT | HTTP, WebSockets | Low power, lightweight, pub/sub model |
| Disease ID | PlantNet + TF.js | Custom Cloud API | PlantNet is free/accurate; TF.js is 100% offline |
| PWA Offline Strategy | Workbox Precaching | Custom SW, AppCache | Standardized, handles versioning well |

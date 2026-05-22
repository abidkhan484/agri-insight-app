# ZBNF Farming Assistant — Architecture

## System Overview

The ZBNF Farming Assistant is a zero-cost technology platform composed of **9 loosely coupled components** (P0–P8). All components are integrated via a unified **Supabase backend**, allowing for a seamless "Super App" experience where farmers can control the system via Telegram and manage detailed records via **Telegram Mini Apps (TMAs)**.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ZBNF Farming Assistant Platform                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     P0 — Shared Foundation                           │    │
│  │  Telegram Bot (Telegraf v4) │ Supabase (PostgreSQL) │ node-cron     │    │
│  │  Winston Logger │ TMA Auth Bridge │ Sync Metadata (updated_at)      │    │
│  └──────────────────────────┬──────────────────────────────────────────┘    │
│                             │ shared Telegram ID + Supabase Auth              │
│              ┌──────────────┼───────────────────┬──────────────────────┐    │
│              ▼              ▼                   ▼                      ▼    │
│  ┌───────────────┐ ┌───────────────┐ ┌──────────────────┐    ┌──────────────────┐
│  │ P1 — Scheduler│ │P2 — Weather   │ │  P3 — TMA Records│    │  P8 — TMA Map    │
│  │    Bot        │ │   Alert       │ │  (React + Dexie) │    │  (Leaflet + SB)  │
│  │/register      │ │Open-Meteo API │ │  Bidirectional   │    │  Community Map   │
│  │/myplots       │ │Whapasa rules  │ │  Supabase Sync   │    │  Pest Alerts     │
│  │Jeevamrtha     │ └───────────────┘ └──────────────────┘    └──────────────────┘
│  │reminder cron  │                                                           │
│  └───────┬───────┘                                                           │
│          │ plot data (Sync)                                                   │
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
│  ┌───────────────────────────┐                                               │
│  │  P7 — Local AI Assistant  │                                               │
│  │  Ollama (gemma2:2b)       │                                               │
│  │  ChromaDB vector store    │                                               │
│  │  LlamaIndex RAG pipeline  │                                               │
│  │  Flask REST API           │                                               │
│  │  /ask Telegram command    │                                               │
│  └───────────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Strategy: TMA & Supabase Sync

### 1. Authentication Bridge (TMA)
The bot serves as an identity provider. When a farmer opens a PWA from a Telegram command, the PWA uses the **Telegram Mini App SDK** to retrieve `initData`. This data is sent to the Bot's `/api/auth/telegram` endpoint, which:
- Validates the hash using the `BOT_TOKEN`.
- Signs a **Supabase JWT** containing the user's `telegram_id`.
- The PWA uses this JWT to authenticate with Supabase, enabling **Row Level Security (RLS)**.

**Guest Mode Support**:
For users outside of Telegram or those who prefer not to sign in, the system supports a **Guest Mode**. 
- Users can access all features offline via IndexedDB.
- A **LoginScreen** with a Telegram Login Widget is provided for browser-based OAuth authentication.
- Users can switch from Guest to Authenticated mode at any time to enable Cloud Sync.

### 2. Bidirectional Synchronization
To support offline-first usage in rural areas, the PWAs use **Dexie (IndexedDB)**.
- **Push**: Local 'dirty' records are upserted to Supabase when online.
- **Pull**: Remote changes modified after the local `last_sync` time are pulled down.
- **Conflict Resolution**: Last-Write-Wins based on `updated_at`.
- **Soft Deletion**: Uses an `is_deleted` flag to propagate deletions across devices.

### 3. Automated Business Logic (Triggers)
Business logic is centralized in the database. 
- **Example**: When a plot is created (via Bot OR PWA), a **Postgres Trigger** (`on_plot_created`) automatically seeds the `reminders` table with standard ZBNF intervals.

---

## Service Descriptions

### P0 — Shared Foundation
- **Runtime**: Node.js 20+ ESM
- **Bot framework**: Telegraf v4
- **Database**: Supabase (PostgreSQL with RLS, Triggers, and PostGIS)
- **Scheduler**: node-cron (in-process) + GitHub Actions daily-cron.yml (backup, not yet deployed)
- **Logger**: Winston (JSON to files, colorized to console)
- **Hosting**: Render.com free tier (750 hrs/month)

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

### P8 — Community Farmer Network
- **Backend**: Supabase PostgreSQL (Free Tier)
- **Map Interface**: Leaflet.js + OpenStreetMap (no-cost tiles)
- **Features**: 
  - **Farmer Map**: Geolocation of farms with crop/method filters.
  - **FAQ Bot**: Keyword-based instant responses from `data/faq.json`.
  - **Pest Alerts**: Regional broadcasts via Telegram.
  - **Desi Cow Finder**: Peer-to-peer registry for organic inputs.
- **Path**: `map-pwa/`

---

## Data Flow Diagrams

### Community Data Flow (P8)

```
Farmer A reports pest via /reportpest
      │
      ▼
Telegram Bot (src/bot/community.js)
      │
      ├──▶ Update Supabase (pest_alerts table)
      │
      ├──▶ Query Farmers in same Upazila (SQLite/Supabase)
      │
      └──▶ Broadcast Alert to Farmer B, C...
             "⚠️ Pest Alert in your Upazila! Treatment: Neemastra."

Farmer C wants to find Desi Cow dung
      │
      ▼
Telegram Bot /findcow <district>
      │
      └──▶ Query Supabase (cow_registry)
             │
             ▼
      List of nearby suppliers + Contact info
```

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

## Database Schema (Supabase PostgreSQL)

```sql
farmers (id, telegram_id UNIQUE, name, district, upazila, has_desi_cow, created_at, updated_at, is_deleted)
plots   (id, farmer_id FK, name, area_decimal, soil_type, crop, start_date, latitude, longitude, created_at, updated_at, is_deleted)
reminders (id, plot_id FK, type, next_due, interval_days, description, active, created_at, updated_at, is_deleted)
reminder_logs (id, reminder_id FK, sent_at, status, message)
weather_alerts (id, plot_id FK, alert_type, message, forecast_data JSONB, sent_at)
soil_readings (id, plot_id FK, moisture, temp, humidity, alert_level, ts)
map_registrations (id, telegram_id UNIQUE, registered_at)
farmer_locations (id UUID, display_name, district, upazila, crop_type, method, has_cow, location GEOGRAPHY, latitude, longitude, created_at)
pest_alerts (id UUID, pest_name, district, upazila, severity, reported_at)
faq_entries (id, category, question_bn, question_en, answer_bn, answer_en, upvotes, created_at)
input_logs (id UUID, plot_id FK, date, type, quantity, quantity_unit, cost, created_at, updated_at, is_deleted)
observations (id UUID, plot_id FK, date, title, description, created_at, updated_at, is_deleted)
harvests (id UUID, plot_id FK, date, crop, quantity, quantity_unit, revenue, created_at, updated_at, is_deleted)
```

---

## Technology Decisions

| Decision | Choice | Alternatives Rejected | Reason |
|----------|--------|-----------------------|--------|
| Bot DB | Supabase (PostgreSQL) | SQLite, MongoDB | Centralized sync, RLS security, free tier |
| Integration | Telegram Mini Apps | Magic Links, OAuth | Zero-login UX, native Telegram feel |
| Offline DB | Dexie.js (IndexedDB) | localStorage, PouchDB | Full offline, relational-ish queries |
| Sync Logic | Custom SyncManager | Supabase Realtime | Better control over offline conflict resolution |
| Logic Location| Postgres Triggers | Bot Code | Ensures consistency between Bot and PWA actions |

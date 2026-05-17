# ZBNF Farming Assistant — Deployment Guide

This guide provides step-by-step instructions for deploying the various components of the ZBNF Farming Assistant platform.

## Architecture Overview

The platform consists of several loosely coupled components:
1.  **Core Telegram Bot (`src/`)**: Node.js application managing farmer registrations, reminders, and weather alerts.
2.  **AI Assistant (`ai-assistant/`)**: Python Flask service using Ollama for ZBNF Q&A.
3.  **PWAs**:
    *   **Farm Record Tracker (`krishi-record/`)**
    *   **Plant Disease Detection (`disease-detect/`)**
    *   **ZBNF Knowledge Base (`zbnf-knowledge/`)**
    *   **Farmer Map (`map-pwa/`)**
4.  **Community Backend**: Supabase (PostgreSQL + PostGIS).
5.  **IoT Soil Monitoring**: ESP32 Firmware + Node-RED + Grafana.

---

## 1. Core Telegram Bot (Backend)

### Recommended Hosting: [Railway.app](https://railway.app) or [Render.com](https://render.com)

1.  **Repository**: Connect your GitHub repository.
2.  **Build Command**: `npm install`
3.  **Start Command**: `npm start`
4.  **Persistence**: 
    *   Since the bot uses SQLite (`agri.db`), you **must** attach a persistent volume to the container at `/src/agri.db` or use a cloud-hosted SQLite/PostgreSQL (requires code changes for Postgres).
    *   On Railway: Add a Volume and mount it to `/infinity/codes/js/insight-app/src`.
5.  **Environment Variables**:
    ```env
    BOT_TOKEN=your_telegram_bot_token
    DB_PATH=./agri.db
    TZ=Asia/Dhaka
    AI_API_URL=https://your-ai-assistant-url.com
    SUPABASE_URL=https://xxxx.supabase.co
    SUPABASE_SERVICE_KEY=your_supabase_service_role_key
    NODE_ENV=production
    ```

---

## 2. Community Backend (Supabase)

The Community Farmer Network (P8) requires a Supabase project.

1.  **Create Project**: Sign up at [supabase.com](https://supabase.com) and create a free project.
2.  **Database Schema**: Go to the **SQL Editor** and run the following commands (from `skills/p8-community-farmer-network/SKILL.md`):

```sql
-- Enable PostGIS for mapping
CREATE EXTENSION IF NOT EXISTS postgis;

-- Farmer locations for the public map
CREATE TABLE farmer_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  crop_type TEXT,
  method TEXT DEFAULT 'ZBNF',
  has_cow BOOLEAN DEFAULT false,
  location GEOGRAPHY(POINT) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pest alerts table
CREATE TABLE pest_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pest_name TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  reported_at TIMESTAMPTZ DEFAULT now()
);

-- FAQ table for the bot
CREATE TABLE zbnf_faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  answer_bn TEXT NOT NULL,
  answer_en TEXT NOT NULL
);

-- RLS Policies (Security)
ALTER TABLE farmer_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON farmer_locations FOR SELECT USING (true);

ALTER TABLE pest_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Alerts" ON pest_alerts FOR SELECT USING (true);
```

---

## 3. Local AI Assistant (Ollama)

Due to high resource requirements, this is typically deployed on a local server or a powerful cloud VM (e.g., DigitalOcean GPU or a large CPU instance).

1.  **Prerequisites**:
    *   Install [Ollama](https://ollama.com).
    *   Run `ollama pull gemma2:2b` and `ollama pull nomic-embed-text`.
2.  **Python Setup**:
    ```bash
    cd ai-assistant
    pip install -r requirements.txt
    ```
3.  **Environment Variables**:
    ```env
    OLLAMA_BASE_URL=http://localhost:11434
    CHROMA_DB_PATH=./chroma_db
    ```
4.  **Ingest Data**: `python scripts/ingest.py`
5.  **Run**: `python app.py`

---

## 4. Progressive Web Apps (PWAs)

### Recommended Hosting: [Netlify](https://netlify.com) or [Vercel](https://vercel.com)

All PWAs are built with Vite.

1.  **Build Settings**:
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
2.  **Specific Requirements**:
    *   **`disease-detect`**: Set `VITE_PLANTNET_API_KEY` in Netlify/Vercel env vars.
    *   **`map-pwa`**: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 5. IoT Soil Monitoring (Hardware)

1.  **Firmware**: 
    *   Open `firmware/soil_monitor.ino` in Arduino IDE.
    *   Update `WIFI_SSID`, `WIFI_PASS`, and `MQTT_BROKER` (e.g., `broker.hivemq.com`).
    *   Flash to ESP32.
2.  **Node-RED**:
    *   Deploy Node-RED (locally or via [Cloud-Pi](https://cloudpi.io) / [FlowForge](https://flowforge.com)).
    *   Import `flows/soil-monitoring.json`.
3.  **Grafana**:
    *   Import `grafana/soil-monitoring-dashboard.json` into your Grafana instance.

---

## 6. Maintenance & Backups

*   **SQLite**: Regularly backup `src/agri.db`.
*   **Cron Jobs**: If hosting on a service that sleeps (like Render Free Tier), use the [GitHub Actions daily-cron.yml](github_workflow/workflows/daily-cron.yml) to trigger the bot remotely every day.

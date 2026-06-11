# Developer Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 24+ (LTS) | https://nodejs.org — use `nvm` recommended |
| npm | 9+ (bundled with Node) | — |
| Git | 2.x+ | `sudo apt install git` / `brew install git` |
| Python | 3.10+ (P7 only) | https://python.org / `pyenv` |
| Ollama | Latest (P7 only) | https://ollama.com |
| Arduino IDE | 2.x (P4 only) | https://arduino.cc/en/software |

---

## 1. Clone and Initial Install

```bash
git clone https://github.com/YOUR_USERNAME/zbnf-farming-assistant.git
cd zbnf-farming-assistant
```

---

## 2. Set Up the Bot (P0/P1/P2 — `src/`)

```bash
cd src
npm install
```

### 2.1 Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy the bot token (looks like `1234567890:ABCdefGhIJK...`)

### 2.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Telegram
BOT_TOKEN=your_bot_token_here

# Supabase (Required for Bot & TMA Sync)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret-from-settings
VITE_SUPABASE_ANON_KEY=your-anon-key

# Scheduling
TZ=Asia/Dhaka

# ...
```

### 2.3 Initialize the Supabase Schema

1. Log in to your [Supabase Dashboard](https://app.supabase.com).
2. Go to **SQL Editor**.
3. Copy the contents of `src/db/schema.sql` and run it to create tables, triggers, and RLS policies.

### 2.4 Start the Bot (Development)

```bash
npm run dev
```

---

## 3. Set Up the Agriculture Assistant PWA (P3/P5/P6/P8 — `client/`)

All four frontends (Krishi Record, Disease Detection, Knowledge Base, and Farmer Map) have been consolidated into a single unified PWA.

```bash
cd client
npm install
npm run dev         # starts Vite dev server at http://localhost:5173
```

The app reads environment variables from the root `.env` file (via `envDir: '../'` in `vite.config.js`).

### 3.1 Local TMA Testing

To test the PWA inside Telegram during development:
1. Use a tool like **ngrok** to expose your local PWA: `ngrok http 5173`.
2. Open Telegram and search for `@BotFather`.
3. Select your bot and go to **Bot Settings → Menu Button → Configure Menu Button**.
4. Set the URL to your ngrok address.
5. In the Bot's `.env`, set `KRISHI_RECORD_URL` and `MAP_PWA_URL` to your ngrok address so bot commands point to it.

### 3.2 Modules

| Module | Path | Features |
|--------|------|----------|
| Krishi Record (P3) | `client/src/modules/krishi-record/` | Plot management, Input logging, Observations, Harvests, Reports |
| Disease Detection (P5) | `client/src/modules/disease-detect/` | PlantNet API identification, disease-treatments.json mapping |
| ZBNF Knowledge (P6) | `client/src/modules/knowledge/` | Calculators, Pest gallery, Crop calendar, Glossary |
| Farmer Map (P8) | `client/src/modules/map/` | Leaflet + Supabase, Bangladesh bounds |

---

## 4. Set Up the Local AI Assistant (P7 — `ai-assistant/`)

### 4.1 Install Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from ollama.com

# Pull models
ollama pull gemma2:2b
ollama pull nomic-embed-text
```

### 4.2 Python Virtual Environment

```bash
cd ai-assistant
python3 -m venv venv
source venv/bin/activate      # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 4.3 Configure AI Environment

```bash
cp .env.example .env
```

Default `.env`:
```env
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
EMBED_MODEL=nomic-embed-text
CHROMA_DB_PATH=./chroma_db
LOG_LEVEL=INFO
```

### 4.4 Ingest Documents

Before the AI can answer questions, you must index the ZBNF documentation:

```bash
python scripts/ingest.py
```

### 4.5 Run AI Service

```bash
python app.py
```

---

## 5. IoT Development (P4 — ESP32)

1. Install Arduino IDE 2.x
2. Add ESP32 board in: **File → Preferences → Board Manager URLs**:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Install libraries: `PubSubClient`, `ArduinoJson`, `DHT sensor library`.
4. Open `firmware/soil_monitor.ino` and flash.

---

## 6. Running Tests

```bash
# Bot tests
cd src && npm test

# PWA tests
cd client && npm test

# Python AI tests
cd ai-assistant && pytest tests/
```

---

## 7. Session Progress Tracking

```bash
# View progress
node scripts/update-progress.js
```

# Developer Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ (LTS) | https://nodejs.org — use `nvm` recommended |
| npm | 9+ (bundled with Node) | — |
| Git | 2.x+ | `sudo apt install git` / `brew install git` |
| Python | 3.10+ (P7 only) | https://python.org / `pyenv` |
| Arduino IDE | 2.x (P4 only) | https://arduino.cc/en/software |

---

## 1. Clone and Initial Install

```bash
git clone https://github.com/YOUR_USERNAME/zbnf-farming-assistant.git
cd zbnf-farming-assistant

# Install workspace-level dev tools (ESLint, Prettier, husky)
# Note: each sub-project (agri-bot/, krishi-record/, etc.) has its own package.json
```

---

## 2. Set Up the Bot (P0/P1/P2 — `agri-bot/`)

```bash
cd agri-bot
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

# Database
DB_PATH=./agri.db

# Scheduling
TZ=Asia/Dhaka

# AI assistant (P7) — leave empty if not running P7
AI_API_URL=http://localhost:5000

# Logging
NODE_ENV=development
LOG_LEVEL=debug
SERVICE_NAME=agri-bot
```

### 2.3 Initialize the SQLite Database

```bash
node db/init.js
```

Expected output:
```
[INFO] Database initialized at agri.db
[INFO] Tables created: farmers, plots, reminders, reminder_logs, weather_alerts, soil_readings, map_registrations
```

### 2.4 Start the Bot (Development)

```bash
npm run dev
# or
node bot/index.js
```

Test: Send `/start` to your bot in Telegram — you should receive the welcome message.

---

## 3. Set Up the Farm Record PWA (P3 — `krishi-record/`)

The Krishi Record PWA is a React-based application that works offline using IndexedDB (via Dexie.js).

```bash
cd krishi-record
npm install
npm run dev         # starts Vite dev server at http://localhost:5173
```

### 3.1 PWA Development

- **Local Storage**: Data is stored in your browser's IndexedDB. You can inspect it in DevTools → Application → IndexedDB → `KrishiRecordDB`.
- **Offline Testing**: Open DevTools → Application → Service Workers → check "Offline" and reload.
- **Service Worker**: Managed by `vite-plugin-pwa`. It only activates in production builds by default. To test it:
  ```bash
  npm run build
  npm run preview
  ```

### 3.2 Running Tests

```bash
# Run Vitest
npx vitest run
```

---

## 4. Set Up the Disease Detection PWA (P5 — `disease-detect/`)

```bash
cd disease-detect
npm install

# Copy PlantNet API key to .env
cp .env.example .env
# Edit VITE_PLANTNET_API_KEY if you have your own key (dev key works for testing)

npm run dev
```

---

## 5. Set Up the ZBNF Knowledge PWA (P6 — `zbnf-knowledge/`)

```bash
cd zbnf-knowledge
npm install
npm run dev         # http://localhost:5174
```

No environment variables needed — fully static offline app.

---

## 6. Set Up the Local AI Assistant (P7 — `ai-assistant/`)

### 6.1 Install Ollama

```bash
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the LLM + embedding models (one-time, ~2GB download)
ollama pull gemma2:2b
ollama pull nomic-embed-text

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

### 6.2 Python environment

```bash
cd ai-assistant
python3 -m venv venv
source venv/bin/activate      # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 6.3 Configure environment

```bash
cp .env.example .env
# Edit if using non-default model or DB path
```

### 6.4 Ingest documents into ChromaDB

```bash
# Run from ai-assistant/ directory — crawls workspace docs and SKILL.md files
python scripts/ingest.py
```

Expected output:
```
[INFO] ingestion_start sources=[...]
[INFO] docs_loaded directory=../skills/zbnf-formulation count=1
[INFO] docs_loaded directory=../docs count=4
[INFO] total_docs_loaded count=5
[INFO] ingestion_complete chroma_path=./chroma_db
```

---

## 7. Set Up the Farmer Map (P8 — `map-pwa/`)

```bash
cd map-pwa
npm install

# Configure Supabase
cp .env.example .env
# Edit VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# (anon key is safe for public frontend — read-only)

npm run dev         # http://localhost:5175
```

---

## 8. IoT Development (P4 — ESP32)

1. Install Arduino IDE 2.x
2. Add ESP32 board in: **File → Preferences → Board Manager URLs**:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Install ESP32 boards: **Tools → Board → Board Manager → search "esp32"**
4. Install libraries via Library Manager:
   - `PubSubClient` (MQTT)
   - `ArduinoJson`
   - `DHT sensor library` by Adafruit
5. Open `firmware/soil_monitor.ino`
6. Set build flags for WiFi credentials (do not hardcode in source)
7. Flash to ESP32

---

## 9. Running All Tests

```bash
# Bot tests (Vitest)
cd agri-bot && npm test

# Krishi Record tests
cd krishi-record && npx vitest run

# Python AI tests
cd ai-assistant && python -m pytest tests/ -v
```

---

## 10. Code Quality Commands

```bash
# ESLint (zero warnings required before commit)
npm run lint

# Auto-fix ESLint issues
npm run lint -- --fix

# Prettier format check
npm run format:check

# Format all files
npm run format

# Type check (if TypeScript)
npx tsc --noEmit
```

---

## 11. Session Progress Tracking

```bash
# View current project progress
node scripts/update-progress.js

# Mark a phase complete
node scripts/update-progress.js --completed P0

# Set current working phase
node scripts/update-progress.js --current P1

# Add a note
node scripts/update-progress.js --note "P1 reminder engine complete, starting P2"
```

Progress is saved to `.session/progress.json` (gitignored).

---

## 12. Deployment

### Bot (Railway.app)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up

# Set environment variables in Railway dashboard
# BOT_TOKEN, DB_PATH, AI_API_URL, NODE_ENV=production, LOG_LEVEL=info
```

### PWAs (Netlify)

```bash
# Build the PWA
npm run build

# Deploy to Netlify
npx netlify-cli deploy --dir=dist --prod
```

### AI Assistant (local/self-hosted)

The AI assistant runs locally on a server with sufficient RAM. For production on a Raspberry Pi:

```bash
# Use lighter model for Pi 4 (4GB RAM)
ollama pull gemma2:2b

# Run Flask as a systemd service
sudo cp docs/zbnf-ai.service /etc/systemd/system/
sudo systemctl enable --now zbnf-ai
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot doesn't respond | Check `BOT_TOKEN` in `.env`; verify with `curl https://api.telegram.org/bot$TOKEN/getMe` |
| SQLite locked error | Only one process should connect to the DB at a time |
| Ollama timeout | Increase `request_timeout` in `services/rag.py`; try `gemma2:2b` instead of `llama3:8b` |
| PlantNet 429 | TF.js fallback activates automatically; get your own API key for production |
| ESLint `no-console` error | Replace `console.log` with `logger.info` / `log.info` |
| Pre-commit hook failing | Run `npm run lint -- --fix && npm run format` then try commit again |

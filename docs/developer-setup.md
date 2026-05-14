# Developer Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ (LTS) | https://nodejs.org — use `nvm` recommended |
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

# Database
DB_PATH=./agri.db

# Scheduling
TZ=Asia/Dhaka

# AI assistant (P7)
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

### 2.4 Start the Bot (Development)

```bash
npm run dev
```

---

## 3. Set Up the Farm Record PWA (P3 — `krishi-record/`)

```bash
cd krishi-record
npm install
npm run dev         # starts Vite dev server at http://localhost:5173
```

---

## 4. Set Up the Disease Detection PWA (P5 — `disease-detect/`)

```bash
cd disease-detect
npm install
cp .env.example .env
# Edit VITE_PLANTNET_API_KEY
npm run dev
```

---

## 5. Set Up the ZBNF Knowledge PWA (P6 — `zbnf-knowledge/`)

```bash
cd zbnf-knowledge
npm install
npm run dev         # http://localhost:5174
```

---

## 6. Set Up the Local AI Assistant (P7 — `ai-assistant/`)

### 6.1 Install Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from ollama.com

# Pull models
ollama pull gemma2:2b
ollama pull nomic-embed-text
```

### 6.2 Python Virtual Environment

```bash
cd ai-assistant
python3 -m venv venv
source venv/bin/activate      # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 6.3 Configure AI Environment

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

### 6.4 Ingest Documents

Before the AI can answer questions, you must index the ZBNF documentation:

```bash
python scripts/ingest.py
```

### 6.5 Run AI Service

```bash
python app.py
```

---

## 7. IoT Development (P4 — ESP32)

1. Install Arduino IDE 2.x
2. Add ESP32 board in: **File → Preferences → Board Manager URLs**:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Install libraries: `PubSubClient`, `ArduinoJson`, `DHT sensor library`.
4. Open `firmware/soil_monitor.ino` and flash.

---

## 8. Running Tests

```bash
# Bot tests
cd src && npm test

# PWA tests
cd krishi-record && npm test

# Python AI tests
cd ai-assistant && pytest tests/
```

---

## 9. Session Progress Tracking

```bash
# View progress
node scripts/update-progress.js
```

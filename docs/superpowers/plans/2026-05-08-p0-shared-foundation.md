# P0 — Shared Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational infrastructure (Bot, DB, Cron, Tools) for the ZBNF Farming Assistant using Node.js 24.

**Architecture:** A monolithic `src/` directory containing the Bot engine, SQLite database connection, and cron scheduler, protected by ESLint/Prettier/Husky quality gates.

**Tech Stack:** Node.js 24, Telegraf, Better-SQLite3, Node-Cron, Winston, ESLint, Prettier, Husky.

---

### Task 1: Project Initialization & Quality Gates

**Files:**
- Create: `src/package.json`
- Create: `src/.env.example`
- Create: `src/.eslintrc.cjs`
- Create: `src/.prettierrc`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "zbnf-farming-assistant",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "start": "node src/bot/index.js",
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:init": "node src/db/init.js",
    "prepare": "husky"
  },
  "dependencies": {
    "better-sqlite3": "^11.x",
    "dotenv": "^16.x",
    "node-cron": "^3.x",
    "telegraf": "^4.x",
    "winston": "^3.x"
  },
  "devDependencies": {
    "@eslint/js": "^9.x",
    "eslint": "^9.x",
    "eslint-config-prettier": "^9.x",
    "husky": "^9.x",
    "lint-staged": "^15.x",
    "prettier": "^3.x"
  },
  "lint-staged": {
    "*.{js,mjs,cjs}": ["eslint --max-warnings 0", "prettier --write"],
    "*.{json,md,sql}": ["prettier --write"]
  }
}
```

- [ ] **Step 2: Copy Lint/Prettier configs from templates**

Run:
```bash
cp templates/.eslintrc.cjs src/.eslintrc.cjs
cp templates/.prettierrc src/.prettierrc
```

- [ ] **Step 3: Create .env.example**

```bash
BOT_TOKEN=your_telegram_bot_token_from_botfather
DB_PATH=./data/agri.sqlite
TIMEZONE=Asia/Dhaka
LOG_LEVEL=info
NODE_ENV=development
```

- [ ] **Step 4: Initialize Husky**

Run:
```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

- [ ] **Step 5: Commit**

```bash
git add src/package.json src/.env.example src/.eslintrc.cjs src/.prettierrc .husky/pre-commit
git commit -m "chore: initialize project structure and quality gates"
```

---

### Task 2: Logging & Configuration

**Files:**
- Create: `src/config/logger.js`
- Create: `src/config/index.js`

- [ ] **Step 1: Implement Winston Logger**

```javascript
import { createLogger, format, transports } from 'winston';
import { mkdirSync } from 'fs';

try {
  mkdirSync('logs', { recursive: true });
} catch (e) { /* directory exists */ }

export default createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

- [ ] **Step 2: Implement Config Loader**

```javascript
import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN,
  dbPath: process.env.DB_PATH || './data/agri.sqlite',
  timezone: process.env.TIMEZONE || 'Asia/Dhaka',
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
};
```

- [ ] **Step 3: Verify with Lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/config/
git commit -m "feat: add logging and config services"
```

---

### Task 3: Database Foundation

**Files:**
- Create: `src/db/schema.sql`
- Create: `src/db/connection.js`
- Create: `src/db/init.js`

- [ ] **Step 1: Define Schema**

```sql
CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT,
  district TEXT,
  upazila TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  area_decimal REAL NOT NULL,
  soil_type TEXT,
  latitude REAL,
  longitude REAL,
  crop TEXT,
  start_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
);
```

- [ ] **Step 2: Implement Connection Manager**

```javascript
import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import logger from '../config/logger.js';
import { dirname } from 'path';
import { mkdirSync } from 'fs';

try {
  mkdirSync(dirname(config.dbPath), { recursive: true });
} catch (e) {}

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

logger.info('Database connection established', { path: config.dbPath });

process.on('exit', () => db.close());

export default db;
```

- [ ] **Step 3: Implement Initialization Script**

```javascript
import db from './connection.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  logger.info('Database schema initialized successfully');
} catch (error) {
  logger.error('Failed to initialize database schema', { error });
  process.exit(1);
}
```

- [ ] **Step 4: Verify DB Initialization**

Run: `node src/db/init.js`
Verify: `src/data/agri.sqlite` (or specified path) exists.

- [ ] **Step 5: Commit**

```bash
git add src/db/
git commit -m "feat: setup sqlite database with schema"
```

---

### Task 4: Bot & Scheduler Skeleton

**Files:**
- Create: `src/bot/index.js`
- Create: `src/scheduler/index.js`

- [ ] **Step 1: Implement Bot Skeleton**

```javascript
import { Telegraf } from 'telegraf';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

if (!config.botToken) {
  logger.error('BOT_TOKEN is missing in environment variables');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

bot.start((ctx) => {
  ctx.reply('স্বাগতম! আমি আপনার কৃষি সহকারী।\nWelcome! I am your farming assistant.');
});

bot.help((ctx) => {
  ctx.reply('সাহায্য প্রয়োজন? বর্তমানে আমি এই কমান্ডগুলো বুঝি:\nNeed help? Currently I understand:\n/start - শুরু করুন\n/help - সাহায্য');
});

bot.catch((err, ctx) => {
  logger.error('Telegraf error', { err, updateType: ctx.updateType });
});

bot.launch().then(() => {
  logger.info('Telegram bot launched');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

- [ ] **Step 2: Implement Scheduler Skeleton**

```javascript
import cron from 'node-cron';
import logger from '../config/logger.js';

// Scheduler Heartbeat
cron.schedule('0 * * * *', () => {
  logger.info('Scheduler Heartbeat - Hourly check performed');
});

logger.info('Scheduler initialized');

export const registerJob = (name, cronExpr, handler) => {
  cron.schedule(cronExpr, handler);
  logger.info(`Job registered: ${name}`, { schedule: cronExpr });
};
```

- [ ] **Step 3: Verify Bot Startup (Mock Token)**

Run: `BOT_TOKEN=123:abc node src/bot/index.js`
Expected: Logs error about invalid token (verifies startup logic).

- [ ] **Step 4: Commit**

```bash
git add src/bot/ src/scheduler/
git commit -m "feat: implement bot skeleton and scheduler heartbeat"
```

---

### Task 5: Documentation & Progress Tracking

**Files:**
- Create: `src/scripts/update-progress.js`
- Create: `src/docs/TOOLS_SETUP.md`

- [ ] **Step 1: Implement Progress Script**

```javascript
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROGRESS_FILE = join(process.cwd(), '.session', 'progress.json');

const args = process.argv.slice(2);
const completedArg = args.find((a) => a.startsWith('--completed='))?.split('=')[1];
const noteArg = args.find((a) => a.startsWith('--note='))?.split('=')[1];

mkdirSync(join(process.cwd(), '.session'), { recursive: true });

let progress = { completed: [], current: 'P0', notes: [] };
try {
  progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
} catch (e) {}

if (completedArg && !progress.completed.includes(completedArg)) {
  progress.completed.push(completedArg);
}
if (noteArg) {
  progress.notes.push({ ts: new Date().toISOString(), note: noteArg });
}
progress.last_updated = new Date().toISOString();

writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
console.log('Progress saved:', progress);
```

- [ ] **Step 2: Write Setup Guide**

```markdown
# Tools Setup & Usage Guide

## Prerequisites
- Node.js 24 (LTS)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## Installation
1. `cd src`
2. `npm install`
3. `cp .env.example .env` (fill in your `BOT_TOKEN`)

## Commands
- `npm run db:init` - Initialize the local SQLite database.
- `npm run lint` - Run quality checks (Zero warnings allowed).
- `npm run format` - Auto-fix formatting.
- `npm start` - Launch the bot and scheduler.

## Pre-commit Hooks
The project uses Husky to prevent commits that fail linting. If a commit fails, run `npm run lint` to see the errors and fix them.
```

- [ ] **Step 3: Final Progress Update**

Run: `node src/scripts/update-progress.js --completed=P0 --note="Foundational infrastructure complete with Node 24"`

- [ ] **Step 4: Commit**

```bash
git add src/scripts/ src/docs/ .session/
git commit -m "docs: add setup guide and complete P0"
```

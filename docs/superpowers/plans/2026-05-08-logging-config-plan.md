# Logging & Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Winston logger and configuration loader using dotenv.

**Architecture:** Centralized config in `src/config/index.js` and Winston logger in `src/config/logger.js`. The logger ensures the `logs/` directory exists.

**Tech Stack:** Node.js 24, Winston, Dotenv.

---

### Task 1: Create Config Loader

**Files:**
- Create: `src/config/index.js`

- [ ] **Step 1: Write the implementation**

```javascript
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  botToken: process.env.BOT_TOKEN,
  dbPath: process.env.DB_PATH || path.join(__dirname, '../../data/agri.sqlite'),
  timezone: process.env.TIMEZONE || 'Asia/Dhaka',
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development'
};
```

- [ ] **Step 2: Verify with a temporary script**

Run: `node -e "import { config } from './src/config/index.js'; console.log(config)"`
Expected: Output showing default config object.

- [ ] **Step 3: Commit**

```bash
git add src/config/index.js
git commit -m "feat: add centralized configuration loader"
```

### Task 2: Create Winston Logger

**Files:**
- Create: `src/config/logger.js`

- [ ] **Step 1: Write the implementation**

```javascript
import winston from 'winston';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, json, colorize, simple, printf } = winston.format;

const fileFormat = combine(timestamp(), json());

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
  })
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: fileFormat,
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    new winston.transports.Console({ format: consoleFormat })
  ]
});
```

- [ ] **Step 2: Verify with a temporary script**

Run: `node -e "import { logger } from './src/config/logger.js'; logger.info('Test info'); logger.error('Test error')"`
Expected: Colorized output in console, and `logs/error.log` / `logs/combined.log` created with JSON entries.

- [ ] **Step 3: Commit**

```bash
git add src/config/logger.js
git commit -m "feat: add winston logger with file and console transports"
```

### Task 3: Quality Check

- [ ] **Step 1: Run linting and formatting**

Run: `cd src && npm run lint && npm run format:check`
Expected: Success with no warnings or errors.

- [ ] **Step 2: Cleanup temporary log files**

Run: `rm -rf logs`
Expected: Success.

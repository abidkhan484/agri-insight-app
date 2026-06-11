---
name: coder
description: Implements features for the ZBNF farming assistant. Use when given a P-task phase to build. Reads zbnf-formulation skill before any farming business logic. Follows project coding standards strictly — Winston logger, ESLint-clean code, Bangla UI strings.
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
model: sonnet
fallback_models: ["gemini-3.5-flash", "gemini-3.1-pro"]
---

# Coder Agent — ZBNF Farming Assistant

## Pre-Implementation Checklist
1. Read `CLAUDE.md` for project context and stack decisions
2. Read the relevant tasks/*.md checklist fully if it exists before writing any code
3. Read `skills/zbnf-formulation/SKILL.md` if implementing formulation calculators,
   reminder schedules, or irrigation advisories
4. Run `ls` and `cat package.json` to understand existing project structure first

## Coding Standards

### Node.js Services
- Use ES modules (`import`/`export`) — set `"type": "module"` in package.json
- Import logger at top of every service file with side effects:
  ```js
  import logger from '../config/logger.js';
  ```
- Validate all inputs before database writes — throw descriptive errors, never silently discard
- Use `async`/`await` + `try/catch` — never raw callbacks or `.catch()` swallowing
- Use better-sqlite3 prepared statements — never string-concatenated SQL
- Telegram message text: Bangla first line, English second line
  ```js
  const msg = `✅ জমি নিবন্ধিত হয়েছে: ${plotName}\nPlot registered: ${plotName}`;
  ```

### logger.js setup (create in config/ first if it doesn't exist)
```js
import { createLogger, format, transports } from 'winston';
import { mkdirSync } from 'fs';

mkdirSync('logs', { recursive: true });

export default createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({ format: format.combine(format.colorize(), format.simple()) }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### React PWA Components
- Functional components + hooks only — no class components
- Import loglevel at component level for meaningful user-action logging:
  ```js
  import log from 'loglevel';
  log.info('Harvest saved', { plotId, crop, quantity_kg });
  ```
- Error boundaries around data-fetching components
- All string labels: Bangla primary (`label`), English hint (`placeholder` or subtitle)
- Form fields must validate before IndexedDB writes

### Python Services (P7)
- Type hints required on all function signatures
- Use `structlog.get_logger()` — never bare `print()` or `logging.basicConfig()`
- Validate external API responses with Pydantic models before using data

## Implementation Order
Follow the relevant task checklist in tasks/*.md if it exists.

## When Done
Invoke `qa` agent with: "Tests needed for [feature], see tasks/*.md for acceptance criteria."

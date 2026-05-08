---
name: p0-shared-foundation
description: Implement P0 Shared Foundation — the infrastructure all other P-tasks depend on. Creates the Telegram bot skeleton, SQLite database, cron scheduler, Winston logger, ESLint/Prettier setup, husky pre-commit hook, and deploys to free-tier hosting. This is ALWAYS the first task to implement.
triggers:
  - implement p0
  - shared foundation
  - start agri-bot
  - set up telegram bot
  - create bot skeleton
---

# P0 — Shared Foundation Implementation Workflow

## Dependency Check
This task has NO dependencies. It creates everything others need.

## Required Reading
- `tasks/p0-shared-foundation.md` — full checklist for all 5 phases
- `CLAUDE.md` — project standards (logger, ESLint, security)
- No ZBNF formulation reading needed for P0 (no farming logic yet)

---

## Agent Invocation Sequence

### Step 1 — coder
Implement all 5 phases in `tasks/p0-shared-foundation.md`, **plus these P0-specific additions**:

#### Addition A: config/logger.js (Create FIRST — all other files depend on this)
```js
// config/logger.js
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
Add to `package.json` dependencies: `"winston": "^3.x"`

#### Addition B: ESLint + Prettier (Add During Phase 4)
```bash
npm install -D eslint prettier eslint-config-prettier @eslint/js husky lint-staged
```

Copy from workspace templates:
```bash
cp /path/to/workspace/templates/.eslintrc.cjs ./.eslintrc.cjs
cp /path/to/workspace/templates/.prettierrc ./.prettierrc
```

Add to `package.json`:
```json
{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "lint-staged": {
    "*.{js,mjs,cjs}": ["eslint --max-warnings 0", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

Set up husky pre-commit hook:
```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

#### Addition C: .env.example
```bash
BOT_TOKEN=your_telegram_bot_token_from_botfather
DB_PATH=./data/agri.sqlite
TIMEZONE=Asia/Dhaka
LOG_LEVEL=info
NODE_ENV=production
```

#### Addition D: Session Progress Script
Create `scripts/update-progress.js` for tracking P-task completion:
```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROGRESS_FILE = join(process.cwd(), '..', '.session', 'progress.json');

const args = process.argv.slice(2);
const completedArg = args.find(a => a.startsWith('--completed='))?.split('=')[1];
const noteArg = args.find(a => a.startsWith('--note='))?.split('=')[1];

mkdirSync(join(process.cwd(), '..', '.session'), { recursive: true });

let progress = {};
try {
  progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
} catch { progress = { completed: [], current: 'P0', notes: [] }; }

if (completedArg && !progress.completed.includes(completedArg)) {
  progress.completed.push(completedArg);
}
if (noteArg) progress.notes = [...(progress.notes || []), { ts: new Date().toISOString(), note: noteArg }];
progress.last_updated = new Date().toISOString();

writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
console.log('Progress saved:', progress);
```

### Step 2 — qa
Test these items specifically for P0:
- `npm run lint` passes with zero warnings on fresh project
- `npm run format:check` passes
- Bot responds to `/start` and `/help`
- SQLite schema creates all tables correctly
- Cron job logs on schedule
- Logger writes to `logs/combined.log` and `logs/error.log`
- Pre-commit hook blocks a commit when ESLint fails
  ```bash
  # Test: introduce a violation and verify hook fires
  echo "var x = 1" >> bot/index.js
  git add bot/index.js && git commit -m "test" # should FAIL
  git checkout -- bot/index.js  # restore
  ```

### Step 3 — reviewer
Check specifically:
- `BOT_TOKEN` only read from `process.env` — never hardcoded
- `config/logger.js` properly imported in `bot/index.js` and `scheduler/index.js`
- No `console.log` anywhere (use `logger.info`)
- `.env` in `.gitignore`
- All farmer messages include Bangla text at this stage (welcome + help)

### Step 4 — doc-updater
Create these docs (first version — all other P-tasks add to them):
- `README.md` — project overview, prerequisites, setup steps, commands
- `docs/architecture.md` — P0 components diagram
- `docs/developer-setup.md` — full local setup walkthrough
- `docs/api-reference.md` — `/start` and `/help` commands (stub for future ones)
- `docs/farmer-guide-bn-en.md` — initial welcome message explanation

### Step 5 — committer
Scope: `feat(config): initialize project structure, bot skeleton, SQLite, cron, and tooling`

---

## Full Acceptance Criteria

From `tasks/p0-shared-foundation.md` PLUS:
- [ ] `config/logger.js` created and imported in `bot/index.js`
- [ ] `logs/` directory auto-created on first run
- [ ] `npm run lint` passes zero warnings on a fresh clone
- [ ] `npm run format:check` passes
- [ ] Pre-commit hook blocks commits with ESLint violations
- [ ] Bot messages to farmers include Bangla text
- [ ] Session progress script created at `scripts/update-progress.js`

---

## Tools That Depend on P0
P1, P2, P4, P8 all require this to be complete before starting.

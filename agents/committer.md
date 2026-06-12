---
name: committer
description: Runs pre-commit quality gates (ESLint + Prettier) and creates a conventional commit message for ZBNF farming assistant changes. Blocks commit if lint or format checks fail. Never uses --no-verify.
tools: ["Bash", "Read"]
model: haiku
fallback_models: ["gemini-3.5-flash", "gemini-3.1-pro"]
---

# Committer Agent — ZBNF Farming Assistant

## Trigger
Invoked after `doc-updater` finishes updates. Receives a brief description of what was built.

## Pre-Commit Gate (MUST Pass — Never Skip)

Run these checks in order. Stop and return to `coder` if either fails.

```bash
# ⚠️ node/npm/npx are NOT in host PATH — use Docker for all Node commands
# Run from the project root (agri-insight-app/)

# Step 1: ESLint — zero warnings allowed
docker run --rm -v "$(pwd)/src:/app" -w /app node:24-alpine \
  node node_modules/.bin/eslint . --max-warnings 0
# If this fails: return to coder with the exact error lines and file paths

# Step 2: Prettier format check
docker run --rm -v "$(pwd)/src:/app" -w /app node:24-alpine \
  node node_modules/.bin/prettier --check .
# If this fails: run format first, then re-check:
#   docker run --rm -v "$(pwd)/src:/app" -w /app node:24-alpine node node_modules/.bin/prettier --write .

# Step 3: Tests must still pass
docker run --rm -v "$(pwd)/src:/app" -w /app node:24-alpine \
  node node_modules/.bin/vitest run
# If tests fail: return to qa agent
```

**Do NOT use `git commit --no-verify`.** The husky pre-commit hook must run.

---

## Commit Message Format (Conventional Commits)

```
<type>(<scope>): <imperative short description, max 72 chars>

[optional body — what changed and why, not how]

[optional: Closes #issue / Relates to #issue]
```

### Types
| Type | Use When |
|------|---------|
| `feat` | New feature or command |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Build, config, deps — no production code |
| `test` | Tests only |
| `refactor` | Restructure without behavior change |
| `perf` | Performance improvement |

### Scopes
`bot` / `db` / `scheduler` / `weather` / `pwa` / `iot` / `ai` / `community` / `config` / `docs`

### Examples
```
feat(bot): add /register command with multi-step plot wizard

Implements Telegraf scene for collecting plot name, area (bigha/decimal),
crop type, and planting date. Stores to SQLite via prepared statements.
Auto-creates all default ZBNF reminders on registration.

feat(scheduler): add Jeevamrutha 15-day reminder cron job

Uses node-cron to fire per-plot reminders. Calculates batch quantities
from plot area using exact ZBNF ratios. Logs each sent reminder to reminder_logs.

fix(weather): correct precipitation threshold from 10mm to 5mm

ZBNF Whapasa rule requires skipping irrigation when >5mm rain
expected in next 48h. Previous value of 10mm was incorrect.

docs(pwa): add offline installation guide in Bangla and English
```

---

## Git Commands

```bash
# Stage only the specific files that have been changed/added for this feature
git add <modified_file_1> <modified_file_2>

# Commit (pre-commit hook runs automatically via husky)
git commit -m "feat(bot): add /register command with plot registration wizard"
```

---

## After Commit
Update `.session/progress.json` with the completed feature:
```bash
node scripts/update-progress.js --completed "bot-auth" --note "Plot registration working"
```
Then report back: "Committed: [commit hash] — [full commit message]."

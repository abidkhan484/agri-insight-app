# How to Use This Project

> This is an **agentic project** — you don't write code manually. You instruct AI agents
> (Claude Code, Codex CLI, Cursor, Gemini CLI) to implement, test, review, and commit each phase.

---

## 1. First-Time Setup

Clone the repo and read these three files in order before doing anything:

```
README.md                         ← project overview + tool table
CLAUDE.md                         ← full stack, coding standards, security rules
skills/zbnf-formulation/SKILL.md  ← ZBNF formulation ratios (non-negotiable domain rules)
```

Then start by setting up the shared database infrastructure.

---

## 2. How to Implement a Feature or Module

Each feature or module implementation follows the same 5-agent workflow. Run them in order — never skip a step.

### Step-by-step

**① Tell the `coder` agent to implement the feature:**
```
@coder implement bot — Farm Scheduler
```
The coder agent will:
- Read `tasks/farm-scheduler-bot.md` (or other checklist files if they exist)
- Read `skills/zbnf-formulation/SKILL.md` if farming logic is involved
- Write all code following ESLint, Winston, Bangla-first, and security rules

**② Tell the `qa` agent to write and run tests:**
```
@qa test bot — Farm Scheduler
```
The qa agent verifies ZBNF formula outputs against exact reference values, Bangla text presence, logger calls, and edge cases.

**③ Tell the `reviewer` agent to check the code:**
```
@reviewer review bot — Farm Scheduler
```
The reviewer checks OWASP security, logger presence in every service file, `.env`-only secrets, and Bangla UI compliance.

**④ Tell the `doc-updater` agent to update docs:**
```
@doc-updater update docs for bot
```
Updates `README.md`, `docs/architecture.md`, `docs/farmer-guide-bn-en.md`, and any checklists.

**⑤ Tell the `committer` agent to commit:**
```
@committer commit bot implementation
```
Runs ESLint → Prettier → Vitest. Blocks the commit if any check fails. Never skips pre-commit hooks.

### Summary diagram

```
coder → qa → reviewer → doc-updater → committer
```

---

## 3. Module Index

The system contains the following key components:
- **bot**: Telegram Bot backend
- **client/modules/krishi-record**: PWA Farm Record Tracker
- **client/modules/disease-detect**: On-device plant disease detector
- **client/modules/knowledge**: Offline ZBNF knowledge base PWA
- **client/modules/map**: Community farmer map
- **ai-assistant**: Local AI RAG server
- **firmware**: ESP32 IoT soil telemetry

Track your current position in `.session/progress.json` (managed by `scripts/update-progress.js`).

---

## 4. What Each File Does

| File / Folder | Purpose |
|---------------|---------|
| `commands/*.toml` | Machine-readable command registry — define workflow, parameters, and steps for every major operation |
| `tasks/*.md` | Granular implementation checklists — read before coding |
| `skills/` | Shared reference guides (TDD, Security checks, ZBNF recipe ratios) |
| `skills/zbnf-formulation/SKILL.md` | All ZBNF ratios and Bangla glossary — always check before farming logic |
| `agents/*.md` | Agent definitions — instruct each agent's behaviour and tools |
| `docs/developer-setup.md` | Full local setup walkthrough for all sub-projects |
| `docs/api-reference.md` | All Telegram commands with Bangla descriptions and examples |
| `docs/farmer-guide-bn-en.md` | End-user guide in Bangla + English |
| `docs/architecture.md` | System diagram and data-flow for components |
| `templates/` | Copy these into each sub-project: ESLint, Prettier, Winston logger, Husky |
| `scripts/update-progress.js` | CLI to update `.session/progress.json` as features complete |
| `.claude/hooks/` | Auto-checks on every file write: blocks hardcoded secrets, warns on missing logger |

---

## 5. Tracking Progress

After completing each feature, update `.session/progress.json`:

```bash
node scripts/update-progress.js --completed bot-auth --current weather-alerts --note "Bot auth complete"
```

The `session-start` hook prints your current status every time Claude Code starts.

---

## 6. How to Extend — Add a Feature

Example: add a `/yield-summary` command to the Farm Record Tracker.

1. **Add a subtask** to the relevant checklist file (e.g. `tasks/farm-record-tracker.md`):
   ```markdown
   - [ ] `/yield-summary` command — monthly aggregation from IndexedDB records
   ```

2. **Add an acceptance criterion** at the bottom of that file's Acceptance Criteria block:
   ```markdown
   - [ ] `/yield-summary` returns correct totals matching Vitest fixture data
   ```

3. **Run the agent workflow** scoped to the new feature:
   ```
   @coder add /yield-summary command to farm-record-tracker
   ```
   Then: `@qa` → `@reviewer` → `@doc-updater` → `@committer`

---

## 7. How to Extend — Add a New Module or Phase

To add a completely new tool/module:

### A. Create the task checklist file
Create `tasks/[module-name].md`. Set the title, objective, prerequisites, subtasks, and acceptance criteria.

### B. Create a skill file if needed
Create `skills/[module-name]/SKILL.md`. Update the `name`, `description`, `triggers`, and implementation sections.

### C. Register it in `AGENTS.md` and `CLAUDE.md`
- Add a row to the **Skills** table in `AGENTS.md`
- Add a row to the **Tech Stack** table if a new technology is introduced in `CLAUDE.md`

### D. Add any new tech to `.gitignore`
If the new module introduces build outputs, data volumes, or generated files, add them to `.gitignore`.

### E. Run the agent workflow
```
@coder implement new-module-name
```
Then: `@qa` → `@reviewer` → `@doc-updater` → `@committer`

---

## 8. Quick Reference — Agent Commands

| Intent | Command |
|--------|---------|
| Implement a module | `@coder implement bot — Weather Irrigation Alert` |
| Test a module | `@qa test bot` |
| Security + quality review | `@reviewer review bot` |
| Update docs after a feature | `@doc-updater update docs for bot` |
| Commit changes | `@committer commit bot implementation` |
| Add a feature | `@coder add [feature] to farm-record-tracker` |
| Full pipeline (shorthand) | Describe the feature → agents run coder → qa → reviewer → doc-updater → committer |

---

## 9. Rules That Are Never Flexible

- **Never hardcode secrets** — all config in `.env`, never committed
- **Never skip the pre-commit hook** — no `--no-verify`
- **Never use `console.log`** — Winston (Node.js), loglevel (React), structlog (Python)
- **Never substitute tech** — the stack in `CLAUDE.md` is locked
- **Never change ZBNF ratios** — they come from Subhash Palekar's research; any change = wrong farmer advice
- **Bangla first** — every farmer-facing string must have Bangla as the primary text


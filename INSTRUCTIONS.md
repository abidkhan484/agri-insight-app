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

Then start with **P0** — it creates the shared infrastructure everything else depends on.

---

## 2. How to Implement a Phase

Each phase (P0–P8) follows the same 5-agent workflow. Run them in order — never skip a step.

### Step-by-step

**① Tell the `coder` agent to implement the phase:**
```
@coder implement P1 — Farm Scheduler Bot
```
The coder agent will:
- Read `tasks/p1-farm-scheduler-bot.md` (full checklist)
- Read `skills/p1-farm-scheduler-bot/SKILL.md` (implementation workflow)
- Read `skills/zbnf-formulation/SKILL.md` if farming logic is involved
- Write all code following ESLint, Winston, Bangla-first, and security rules

**② Tell the `qa` agent to write and run tests:**
```
@qa test P1 — Farm Scheduler Bot
```
The qa agent verifies ZBNF formula outputs against exact reference values, Bangla text presence, logger calls, and edge cases.

**③ Tell the `reviewer` agent to check the code:**
```
@reviewer review P1 — Farm Scheduler Bot
```
The reviewer checks OWASP security, logger presence in every service file, `.env`-only secrets, and Bangla UI compliance.

**④ Tell the `doc-updater` agent to update docs:**
```
@doc-updater update docs for P1
```
Updates `README.md`, `docs/architecture.md`, `docs/farmer-guide-bn-en.md`, and the task checklist.

**⑤ Tell the `committer` agent to commit:**
```
@committer commit P1 implementation
```
Runs ESLint → Prettier → Vitest. Blocks the commit if any check fails. Never skips pre-commit hooks.

### Summary diagram

```
coder → qa → reviewer → doc-updater → committer
```

---

## 3. Build Order (Always Sequential)

Never start a phase before its dependencies are complete:

```
P0 (Foundation)
 └─ P1 (Bot)
     ├─ P2 (Weather)
     │   └─ P3 (Records)
     │       └─ P4 (IoT)
     ├─ P5 (Disease)  ← independent, start any time after P0
     ├─ P6 (Knowledge PWA)  ← independent, start any time after P0
     └─ P7 (Local AI)
         └─ P8 (Community)  ← aggregates everything, deploy last
```

Track your current position in `.session/progress.json` (managed by `scripts/update-progress.js`).

---

## 4. What Each File Does

| File / Folder | Purpose |
|---------------|---------|
| `commands/*.toml` | Machine-readable command registry — define workflow, parameters, and steps for every major operation |
| `tasks/pN-*.md` | Granular implementation checklist for each phase — read before coding |
| `skills/pN-*/SKILL.md` | Full implementation workflow with code snippets — agents read this |
| `skills/zbnf-formulation/SKILL.md` | All ZBNF ratios and Bangla glossary — always check before farming logic |
| `agents/*.md` | Agent definitions — instruct each agent's behaviour and tools |
| `docs/developer-setup.md` | Full local setup walkthrough for all sub-projects |
| `docs/api-reference.md` | All Telegram commands with Bangla descriptions and examples |
| `docs/farmer-guide-bn-en.md` | End-user guide in Bangla + English |
| `docs/architecture.md` | System diagram and data-flow for all 9 components |
| `templates/` | Copy these into each sub-project: ESLint, Prettier, Winston logger, Husky |
| `scripts/update-progress.js` | CLI to update `.session/progress.json` as phases complete |
| `.claude/hooks/` | Auto-checks on every file write: blocks hardcoded secrets, warns on missing logger |

---

## 5. Tracking Progress

After completing each phase, update `.session/progress.json`:

```bash
node scripts/update-progress.js --completed P1 --current P2 --note "Bot live on Railway"
```

The `session-start` hook prints your current status every time Claude Code starts.

---

## 6. How to Extend — Add a Feature to an Existing Phase

Example: add a `/yield-summary` command to the Farm Record Tracker (P3).

1. **Add a subtask** to `tasks/p3-farm-record-tracker.md` under the relevant phase section:
   ```markdown
   - [ ] `/yield-summary` command — monthly aggregation from IndexedDB records
   ```

2. **Add an acceptance criterion** at the bottom of that file's Acceptance Criteria block:
   ```markdown
   - [ ] `/yield-summary` returns correct totals matching Vitest fixture data
   ```

3. **Run the agent workflow** scoped to the new feature:
   ```
   @coder add /yield-summary command to P3 Farm Record Tracker
   ```
   Then: `@qa` → `@reviewer` → `@doc-updater` → `@committer`

4. **Update the skill file** if the feature introduces a new pattern others will reuse:
   - Edit `skills/p3-farm-record-tracker/SKILL.md` — add a new section with the pattern

---

## 7. How to Extend — Add a New Phase (P9+)

To add a completely new tool/phase beyond P8:

### A. Create the task file
```bash
cp tasks/p8-community-farmer-network.md tasks/p9-my-new-tool.md
```
Edit it: set the title, objective, prerequisites, subtasks, and acceptance criteria.

### B. Create the skill file
```bash
mkdir -p skills/p9-my-new-tool
cp skills/p8-community-farmer-network/SKILL.md skills/p9-my-new-tool/SKILL.md
```
Edit `SKILL.md`: update the `name`, `description`, `triggers`, and all implementation sections.

### C. Register it in the index
Add a row to `tasks/_index.md`:
```markdown
| P9 | My New Tool | X | Why after P8? |
```

### D. Register it in `AGENTS.md` and `CLAUDE.md`
- Add a row to the **Skills** table in `AGENTS.md`
- Add a row to the **Tech Stack** table if a new technology is introduced in `CLAUDE.md`

### E. Add any new tech to `.gitignore`
If the new phase introduces build outputs, data volumes, or generated files, add them to `.gitignore`.

### F. Run the agent workflow
```
@coder implement P9 — My New Tool
```
Then: `@qa` → `@reviewer` → `@doc-updater` → `@committer`

---

## 8. Quick Reference — Agent Commands

| Intent | Command |
|--------|---------|
| Implement a phase | `@coder implement P2 — Weather Irrigation Alert` |
| Test a phase | `@qa test P2` |
| Security + quality review | `@reviewer review P2` |
| Update docs after a phase | `@doc-updater update docs for P2` |
| Commit changes | `@committer commit P2 implementation` |
| Add a feature | `@coder add [feature] to P3 Farm Record Tracker` |
| Full pipeline (shorthand) | Describe the feature → agents run coder → qa → reviewer → doc-updater → committer |

---

## 9. Rules That Are Never Flexible

- **Never hardcode secrets** — all config in `.env`, never committed
- **Never skip the pre-commit hook** — no `--no-verify`
- **Never use `console.log`** — Winston (Node.js), loglevel (React), structlog (Python)
- **Never substitute tech** — the stack in `CLAUDE.md` is locked
- **Never change ZBNF ratios** — they come from Subhash Palekar's research; any change = wrong farmer advice
- **Bangla first** — every farmer-facing string must have Bangla as the primary text

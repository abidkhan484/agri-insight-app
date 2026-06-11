# ZBNF Farming Assistant — Agent Instructions

> Universal context file. Works with Claude Code, Codex CLI, Cursor, Gemini CLI.
> For Claude Code specifics see `CLAUDE.md`.

## What This Project Is
A zero-cost technology platform providing free tech support to ZBNF (Zero Budget Natural Farming)
farmers in Bangladesh. All services, APIs, and hosting must be free or open-source.

## Domain Warning
ZBNF has precise, non-negotiable formulation ratios developed by Subhash Palekar.
Read `skills/zbnf-formulation/SKILL.md` before implementing ANY farming calculation.
Wrong values = wrong farmer advice = crop damage.

---

## Agent Roles (in `agents/` folder)

| Agent | When to Invoke |
|-------|---------------|
| `coder` | Implement a feature or module |
| `qa` | Write + run tests after implementation |
| `reviewer` | Security, quality, and ZBNF accuracy review |
| `doc-updater` | Update README, docs/, and task checklists |
| `committer` | Run ESLint + Prettier, write conventional commit |

**Workflow per feature:** coder → qa → reviewer → doc-updater → committer

---

## Skills (in `skills/` folder)

| Skill | Purpose |
|-------|---------|
| `zbnf-formulation` | All formulation ratios, schedules, and Bangla glossary (crucial for ZBNF calculations) |
| `security-review` | Rules and guidelines for verifying OWASP security standards |
| `tdd-workflow` | Enforces Test-Driven Development loops |

---

## Non-Negotiable Code Quality

1. **ESLint + Prettier** must pass before every commit (husky pre-commit hook)
2. **Winston logger** in every Node.js file with side effects
3. **loglevel** in every React/PWA component that logs
4. **structlog** in Python services
5. **No console.log** in production code — blocked by ESLint
6. **Bangla first** in all farmer-facing UI text
7. **Never log raw PII** — label with context (e.g., `{ farmer: 'id:' + id }`)

---

## Security Minimums (OWASP)

- All env vars from `.env` — never hardcoded
- All DB access via `dbService` abstraction layer (Supabase SDK) — no raw SQL
- Row-Level Security (RLS) enforced on all Supabase tables
- Bot validates farmer registration before every data operation
- Telegram inputs sanitized before DB storage
- `.env` in `.gitignore` — never committed

---

## Documentation Requirements

Every feature implementation must produce:
- Updated `README.md` with new commands/features
- `docs/architecture.md` update if new service/table added
- Bangla + English entries in `docs/farmer-guide-bn-en.md` for user-facing features

---

## File Locations

```
agents/         ← Sub-agent definitions (this folder)
skills/         ← Skill workflows (this folder)
tasks/          ← Feature implementation checklists
docs/           ← Architecture, setup, farmer guide
templates/      ← ESLint, Prettier, husky pre-commit templates
.claude/        ← Claude Code hooks and settings
```

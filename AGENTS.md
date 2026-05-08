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

## Build Sequence (Always Sequential)
```
P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8
```
Never start a P-task before its dependencies are complete. See `tasks/_index.md` for the
dependency map.

---

## Agent Roles (in `agents/` folder)

| Agent | When to Invoke |
|-------|---------------|
| `coder` | Implement a feature or phase |
| `qa` | Write + run tests after implementation |
| `reviewer` | Security, quality, and ZBNF accuracy review |
| `doc-updater` | Update README, docs/, and task checklist |
| `committer` | Run ESLint + Prettier, write conventional commit |

**Workflow per feature:** coder → qa → reviewer → doc-updater → committer

---

## Skills (in `skills/` folder)

| Skill | Purpose |
|-------|---------|
| `zbnf-formulation` | All formulation ratios, schedules, and Bangla glossary |
| `p0-shared-foundation` | Foundation setup workflow |
| `p1-farm-scheduler-bot` | Telegram bot + reminder engine |
| `p2-weather-irrigation-alert` | Open-Meteo integration + decision logic |
| `p3-farm-record-tracker` | React PWA + IndexedDB + reports |
| `p4-iot-soil-monitoring` | ESP32 + MQTT + Node-RED + Grafana |
| `p5-plant-disease-detection` | PlantNet API + TF.js on-device PWA |
| `p6-zbnf-knowledge-pwa` | Offline knowledge base PWA |
| `p7-local-ai-assistant` | Ollama + ChromaDB + RAG |
| `p8-community-farmer-network` | Community bot + Leaflet map + wiki |

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
- Parameterized queries only (better-sqlite3 prepared statements)
- Bot validates farmer registration before every data operation
- Telegram inputs sanitized before DB storage
- `.env` in `.gitignore` — never committed

---

## Documentation Requirements

Every P-task must produce:
- Updated `README.md` with new commands/features
- `docs/architecture.md` update if new service/table added
- Bangla + English entries in `docs/farmer-guide-bn-en.md` for user-facing features

---

## File Locations

```
agents/         ← Sub-agent definitions (this folder)
skills/         ← Skill workflows (this folder)
tasks/          ← P0–P8 implementation checklists
docs/           ← Architecture, setup, farmer guide
templates/      ← ESLint, Prettier, husky pre-commit templates
.claude/        ← Claude Code hooks and settings
```

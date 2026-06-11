# ZBNF Farming Assistant — Full Codebase Audit

> Audit date: 2026-05-21 | Auditor: Senior Engineer Review

---

## Executive Summary

The project has **P0–P8 all marked FINISHED** in `.session/progress.json`. After exploring every file in the codebase, I found the implementation is **substantially complete** but has several **code-level bugs**, **doc-code mismatches**, and **missing pieces** that need attention.

---

## 1. What's Actually Implemented (Ground Truth)

### Bot Backend (`src/`)

| Component | File(s) | Status |
|-----------|---------|--------|
| Config loader | `config/index.js` | ✅ Working — loads from `.env`, Supabase-aware |
| Winston logger | `config/logger.js` | ✅ Working — JSON to file, colorized console |
| Supabase connection | `db/connection.js` | ✅ Working — uses `@supabase/supabase-js` |
| DB Service layer | `db/service.js` | ✅ Working — 20+ methods, all Supabase |
| DB Schema | `db/schema.sql` | ✅ Working — 13 tables, RLS, triggers, PostGIS |
| Bot entry | `bot/index.js` | ✅ Working — Telegraf, HTTP server, TMA auth endpoint |
| Register wizard | `bot/scenes/register.js` | ✅ Working — 4-step plot registration |
| Plot commands | `bot/commands/plots.js` | ✅ `/myplots`, `/deleteplot` |
| Reminder commands | `bot/commands/reminders.js` | ✅ `/myreminders`, `/cancelreminder`, `/remind` |
| Soil status command | `bot/commands/soilstatus.js` | ✅ `/soilstatus` — reads from Supabase |
| AI Ask command | `bot/commands/ask.js` | ✅ `/ask` — proxies to Flask AI service |
| FAQ command | `bot/commands/faq.js` | ✅ `/faq` — searches Supabase `faq_entries` |
| Join map command | `bot/commands/joinmap.js` | ⚠️ **BUG** — references `farmer` variable without declaring it (see §3) |
| Community commands | `bot/commands/community.js` | ✅ `/registercow`, `/findcow`, `/reportpest` |
| Reminder engine | `scheduler/reminders.js` | ✅ Daily cron — uses Supabase via `dbService` |
| Weather alert engine | `scheduler/weather-alerts.js` | 🔴 **BROKEN** — still uses SQLite `db.prepare()` (see §3) |
| TMA Auth | `services/auth.js` | ✅ `validateTelegramInitData`, `generateSupabaseJWT` |
| Supabase service | `services/supabase.js` | ✅ `registerFarmerLocation`, `searchFAQ` |
| Weather service | `services/weather.js` | ✅ Open-Meteo fetch with retry |
| Irrigation advisor | `services/irrigation-advisor.js` | ✅ Whapasa rules |
| Jeevamrutha/ZBNF | `services/jeevamrutha.js` | ✅ Calculate & format for Jeevamrutha, Neemastra, Mulch |
| Notification service | `services/notification.js` | ✅ Telegram message sender |

### Client PWA (`client/`)

| Module | Key Files | Status |
|--------|-----------|--------|
| Shell / Router | `App.jsx` | ✅ Lazy-loads 4 modules, bottom nav, TMA integration |
| TMA Provider | `shared/tma/TMAProvider.jsx` | ✅ Auth flow with guest mode fallback |
| TMA Theme | `shared/tma/TMATheme.jsx` | ✅ Telegram theme variable mapping |
| Sync Manager | `shared/sync/SyncManager.js` | ✅ Bidirectional Dexie↔Supabase sync |
| Sync Status UI | `shared/sync/SyncStatus.jsx` | ✅ Visual sync indicator |
| Krishi Record | `modules/krishi-record/` | ✅ 5 components: PlotManager, InputLogger, ObservationTracker, HarvestRecorder, Reports |
| Krishi Dexie DB | `modules/krishi-record/db/index.js` | ✅ V2 schema with sync metadata |
| Disease Detect | `modules/disease-detect/` | ✅ DiseaseDetector component, PlantNet + TF.js services, disease-treatments.json |
| Farmer Map | `modules/map/` | ✅ Leaflet + Supabase, Bangladesh bounds |
| ZBNF Knowledge | `modules/knowledge/` | ⚠️ **Nested Router** — has its own `<Routes>` but parent already provides `<Router>` (see §3) |
| Knowledge Data | `modules/knowledge/data/` | ✅ crops.json, glossary.json, pests.json |
| PWA Config | `vite.config.js` | ✅ VitePWA, Workbox, path aliases |
| Dockerfile | `client/Dockerfile` | ✅ Nginx-based static hosting |

### AI Assistant (`ai-assistant/`)

| Component | File | Status |
|-----------|------|--------|
| Flask app | `app.py` | ✅ `/ask`, `/health` endpoints, CORS, structlog |
| RAG service | `services/rag.py` | ✅ LlamaIndex + ChromaDB + Ollama |
| Ingest script | `scripts/ingest.py` | ✅ Document indexing pipeline |
| Logger | `config/logger.py` | ✅ structlog |

### IoT (`firmware/`, `flows/`, `grafana/`)

| Component | File | Status |
|-----------|------|--------|
| ESP32 firmware | `firmware/soil_monitor.ino` | ✅ Arduino sketch present |
| Node-RED flow | `flows/soil-monitoring.json` | ✅ Flow definition |
| Grafana dashboard | `grafana/soil-monitoring-dashboard.json` | ✅ Dashboard JSON |

### DevOps & CI/CD

| Component | File | Status |
|-----------|------|--------|
| Bot Dockerfile | `Dockerfile` (root) | ✅ Multi-stage Node 24 |
| Procfile | `Procfile` | ✅ web + worker processes |
| GH Pages deploy | `.github/workflows/deploy-pwas.yml` | ✅ Build client → deploy to Pages |
| Daily cron | `.github/workflows/daily-cron.yml` | ❌ **MISSING** — referenced in docs but doesn't exist |
| ESLint (bot) | `src/eslint.config.js` | ✅ Flat config, no-console: error |
| Prettier | `src/.prettierrc` | ✅ |
| Husky | `.husky/` | ✅ Pre-commit hook directory exists |

### Tests (`src/__tests__/`)

| Test File | Coverage |
|-----------|----------|
| `bot.test.js` | Basic bot tests |
| `config.test.js` | Config loading |
| `db.test.js` | DB service |
| `p1-farm-scheduler-bot.test.js` | P1 feature tests |
| `p2-weather-irrigation-alert.test.js` | P2 weather/irrigation |
| `p4-iot-soil-monitoring.test.js` | P4 soil readings |
| `p7-bot-ask.test.js` | P7 AI ask integration |
| `p8-community-extras.test.js` | P8 cow/pest features |
| `p8-community.test.js` | P8 community commands |
| `scheduler.test.js` | Scheduler basics |

---

## 2. Documentation vs. Reality — Discrepancies

| # | Doc Location | What It Says | What Code Does | Action |
|---|-------------|-------------|----------------|--------|
| 1 | `CLAUDE.md` L48 | Bot DB = `better-sqlite3` | Bot DB = `@supabase/supabase-js` | **Update CLAUDE.md** |
| 2 | `CLAUDE.md` L48 | PWA = React 18 + Vite | PWA = React 19 + Vite 8 | **Update CLAUDE.md** |
| 3 | `CLAUDE.md` L102 | Parameterized queries (better-sqlite3 prepared statements) | Uses Supabase client SDK | **Update CLAUDE.md** |
| 4 | `CLAUDE.md` L138-160 | Project structure shows `bot/`, `config/`, `db/` under root | Actual structure is under `src/` | **Update CLAUDE.md** |
| 5 | `README.md` L35 | DB = `Supabase` + `node-cron` | ✅ Correct | OK |
| 6 | `README.md` L159 | "Parameterized SQL only — better-sqlite3 prepared statements" | Uses Supabase SDK | **Update README.md** |
| 7 | `README.md` L126-139 | Project layout shows `disease-detect/`, `krishi-record/`, `zbnf-knowledge/`, `map-pwa/` as separate dirs | All consolidated into `client/src/modules/` | **Update README.md** |
| 8 | `README.md` L165-168 | Quick Start: `cd src`, `npm install`, `cp .env.example .env`, `npm run dev` | Correct for bot. Missing client instructions. | **Update README.md** |
| 9 | `architecture.md` L82 | P0 DB = better-sqlite3 | P0 DB = Supabase | **Update architecture.md** |
| 10 | `architecture.md` L298 | Technology Decisions table says "Supabase" | ✅ Correct | OK |
| 11 | `deployment-guide.md` | References `daily-cron.yml` | File doesn't exist | **Create or remove ref** |
| 12 | `developer-setup.md` L75-81 | P3 at `krishi-record/` with its own npm | Consolidated into `client/` | **Update developer-setup.md** |
| 13 | `developer-setup.md` L95-103 | P5 at `disease-detect/` | Consolidated into `client/` | **Update developer-setup.md** |
| 14 | `developer-setup.md` L107-113 | P6 at `zbnf-knowledge/` | Consolidated into `client/` | **Update developer-setup.md** |
| 15 | `api-reference.md` L52 | `/addplot` listed as command | Actual command is `/register` (wizard does both farmer reg + plot add) | **Update api-reference.md** |
| 16 | `api-reference.md` L80 | `/plots` listed | Actual command is `/myplots` | **Update api-reference.md** |
| 17 | `api-reference.md` L114 | `/reminders` listed | Actual command is `/myreminders` | **Update api-reference.md** |
| 18 | `AGENTS.md` | References `better-sqlite3 prepared statements` | Uses Supabase | **Update AGENTS.md** |

---

## 3. Code-Level Bugs & Issues

### 🔴 Critical: `weather-alerts.js` Still Uses SQLite

[weather-alerts.js](file:///infinity/codes/js/insight-app/src/scheduler/weather-alerts.js#L1-L2):
```js
import db from '../db/connection.js';  // This is now the Supabase client, not SQLite!
// ...
const plots = db.prepare(`SELECT p.*, f.telegram_id ...`).all();  // L16-25: .prepare() doesn't exist on Supabase client
```
The `db` import is the Supabase client, but this file calls `.prepare()` and `.all()` which are SQLite API methods. **This will crash at runtime** when the cron fires.

**Fix needed**: Migrate to use `dbService.getPlotsWithGPS()` (which already exists in `service.js` L262-270) and `dbService.logWeatherAlert()` (L272-283).

### 🟡 High: `joinmap.js` Missing Variable Declaration

[joinmap.js](file:///infinity/codes/js/insight-app/src/bot/commands/joinmap.js#L11-L15):
```js
// Line 11: ... (rest of logic remains same until reply)
// Line 14: await registerFarmerLocation({
// Line 15:     displayName: `${farmer.district}-এর কৃষক`,
```
The `farmer` variable is used at L15 but never declared/fetched in this file. There's a comment "rest of logic remains same until reply" suggesting incomplete code migration. The farmer lookup is missing.

### 🟡 Medium: Knowledge Module Nested Router Conflict

[knowledge/App.jsx](file:///infinity/codes/js/insight-app/client/src/modules/knowledge/App.jsx) does NOT use a nested `<BrowserRouter>` — it uses `<Routes>` directly, which is correct since the parent `client/src/App.jsx` already provides `<Router>`. **This is actually fine.**

### 🟡 Medium: Hindi Character in Help Command

[bot/index.js L82](file:///infinity/codes/js/insight-app/src/bot/index.js#L82):
```
/start - शुरू করুন
```
`शुरू` is Hindi Devanagari. Should be Bangla `শুরু`.

### 🟡 Medium: Duplicate Reminder Seeding

When a plot is created via the register wizard ([register.js L104-118](file:///infinity/codes/js/insight-app/src/bot/scenes/register.js#L104-L118)), it manually inserts 4 default reminders. But the DB also has a Postgres trigger `on_plot_created` ([schema.sql L218-220](file:///infinity/codes/js/insight-app/src/db/schema.sql#L218-L220)) that does the same. **Result: Every plot gets 8 duplicate reminders (4 from code + 4 from trigger).**

### 🟡 Medium: `SyncManager` Uses `console.error`

[SyncManager.js L24](file:///infinity/codes/js/insight-app/client/src/shared/sync/SyncManager.js#L24):
```js
console.error(`Sync error for ${this.tableName}:`, error);
```
Project rules mandate `loglevel` for PWA code, not `console.error`.

### 🟢 Low: SQLite Data Files Committed

`src/data/agri.sqlite` and `data/agri.sqlite` exist in the repo despite `.gitignore` having `*.sqlite`. These are likely committed before the gitignore rule was added.

### ✅ Resolved: Node Engine Requirement Mismatch (Fixed)

~~`src/package.json` has `"engines": { "node": ">=24.0.0" }`. Docs say Node 20+. Deploy workflow uses Node 24 anyway, but this blocks local dev on Node 20-23.~~

**Fixed:** All documentation (`README.md`, `CLAUDE.md`, `docs/developer-setup.md`, `docs/deployment-guide.md`, `docs/architecture.md`) updated to require Node.js 24+, consistent with `engines` in `package.json`.

### 🟢 Low: `SUPABASE_JWT_SECRET` Missing from `.env`

Present in `.env.example` but not in `.env`. The `generateSupabaseJWT()` function will throw.

### 🟢 Low: `VITE_BASE_URL` Missing from `.env`

Present in `.env.example` but absent in `.env`.

---

## 4. Features That Need Specs (Incomplete/Not Implemented)

| # | Feature | Where Referenced | Current State | Needs Spec? |
|---|---------|-----------------|---------------|-------------|
| 1 | `daily-cron.yml` keep-alive | `deployment-guide.md` L107 | File doesn't exist | ✅ Yes |
| 2 | `/weather` manual command | `api-reference.md` L133 | Not implemented — only automatic daily alerts | ✅ Yes |
| 3 | `/disease` Telegram command | `api-reference.md` L147 | Not implemented — disease detect is PWA only | ✅ Yes |
| 4 | `/log` command | `api-reference.md` L98 | Marked "Upcoming" — not implemented | ✅ Yes |
| 5 | `/report` command | `api-reference.md` L106 | Marked "Upcoming" — not implemented | ✅ Yes |
| 6 | CSV/PDF export in P3 | `architecture.md` L102 | Not verified in component code | Needs check |
| 7 | TF.js offline model | `README.md` L86 | Service exists (`tfjs-fallback.js`) but no model in `public/models/` | ✅ Yes |
| 8 | Bidirectional sync actually working | `architecture.md` L64-69 | SyncManager code exists but may not be triggered in practice | Needs testing |

---

## 5. Summary of Required Actions

### Documentation Updates (docs reflect reality)
1. ✅ Update `CLAUDE.md` — SQLite→Supabase, React 18→19, project structure
2. ✅ Update `README.md` — project layout, quick start, SQLite references
3. ✅ Update `architecture.md` — P0 description, DB schema
4. ✅ Update `developer-setup.md` — consolidated client instructions, section renumbering
5. ✅ Update `api-reference.md` — correct command names, mark implemented features
6. ✅ Update `AGENTS.md` — SQLite references
7. ✅ Update `deployment-guide.md` — daily-cron.yml location clarified

### Bug Fixes (code)
1. 🔴 Migrate `weather-alerts.js` from SQLite to `dbService` → **Spec written** (`docs/spec/weather-alerts-migration.md`)
2. 🟡 Fix `joinmap.js` missing farmer lookup → **Spec written** (`docs/spec/joinmap-fix.md`)
3. ✅ Fix Hindi char in help command → **Fixed** (`শুরু` replaces `शुरू`)
4. ✅ Remove duplicate reminder seeding → **Fixed** (removed manual code in `register.js`, Postgres trigger retained)
5. ✅ Replace `console.error` in SyncManager with `loglevel` → **Fixed**

### Specs Created (in `docs/spec/`)
1. ✅ `weather-alerts-migration.md` — migrate weather-alerts.js from SQLite to Supabase
2. ✅ `joinmap-fix.md` — fix missing farmer lookup in /joinmap command
3. ✅ `weather-manual-command.md` — implement /weather on-demand command
4. ✅ `disease-telegram-command.md` — implement /disease photo-based detection
5. ✅ `log-report-commands.md` — implement /log and /report commands

### Notes
- TF.js offline model (`tfjs-fallback.js`) — **intentionally deferred**, no spec needed
- `daily-cron.yml` — exists at `github_workflow/workflows/`, intentionally not in `.github/` yet

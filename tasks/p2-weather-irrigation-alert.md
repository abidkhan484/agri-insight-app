---
title: "P2 — Weather Irrigation Alert"
weight: 20
bookFlatSection: true
---

> Works with: Claude Code, Codex CLI, Cursor, Gemini CLI

**Skill file:** `skills/p2-weather-irrigation-alert/SKILL.md` — read this before implementing
**Agent workflow:** coder → qa → reviewer → doc-updater → committer

# 🌦️ P2 — Weather-Based Smart Irrigation Alert (Tool B)

## Objective

Build a lightweight weather service that checks daily forecasts via Open-Meteo API and sends irrigation/spray/heat advisories to farmers via the existing Telegram bot — enforcing the ZBNF Whapasa principle with data, not guesswork.

## Prerequisites

- **P0 — Shared Foundation** completed (bot + cron)
- **P1 — Farm Scheduler Bot** completed (plots with GPS coordinates stored in DB)

## Subtasks

### Phase 1: Open-Meteo API Integration

- [x] Create a `services/weather.js` module
- [x] Implement `fetchForecast(latitude, longitude)` function
- [x] Parse the API response into a structured object
- [x] Add error handling for API failures (retry with exponential backoff, max 3 attempts)
- [x] Add unit tests for response parsing

### Phase 2: Decision Logic

- [x] Implement `services/irrigation-advisor.js` with basic rules
- [x] Each rule returns a message + severity level (info / warning / critical)
- [x] Support per-plot decisions (different GPS → different weather)
- [ ] Multi-day rain pattern (3+ days) 🌊 "Monsoon approaching — prepare drainage channels"

### Phase 3: Daily Cron Job

- [x] Register a daily cron job at **6:00 AM BDT** (00:00 UTC)
- [x] Job workflow:
  1. Fetch all active plots from DB
  2. Group plots by GPS coordinates (avoid duplicate API calls for same location)
  3. Fetch weather for each unique coordinate
  4. Run decision logic per plot
  5. Send relevant alerts to each farmer via Telegram
- [x] Log all alerts in a `weather_alerts` table

### Phase 4: GitHub Actions Cron (Backup)

- [ ] Create `.github/workflows/weather-alert.yml`
- [x] Create `scripts/run-weather-check.js` as a standalone entry point
- [ ] Test the workflow with `workflow_dispatch` trigger

## Acceptance Criteria

- [x] Weather data fetches correctly for any BD GPS coordinate
- [x] Irrigation skip alert fires when precipitation > 5mm in next 48h
- [x] Spray warning fires when rain expected within 6h
- [x] Heat alert fires when max temp > 38°C
- [x] Alerts are sent to the correct farmer via Telegram
- [x] `weather_alerts` table logs every sent alert
- [ ] GitHub Actions workflow runs without error (dedicated workflow missing)
- [x] Winston logger in all weather service files — no `console.log`
- [x] `npm run lint` passes with zero warnings
- [x] All farmer-facing Telegram alerts include Bangla (primary) + English (secondary) text
- [x] Open-Meteo API URL constructed with `URL` object — no string interpolation of params
- [x] `docs/farmer-guide-bn-en.md` updated with weather alert information

## Estimated Effort

⏱️ **1 day** (4–6 hours)

## Dependencies

| Dependency | Status |
|---|---|
| P0 — Shared Foundation | Completed |
| P1 — Farm Scheduler Bot | Completed |

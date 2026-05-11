---
title: "P1 — Farm Scheduler Bot"
weight: 10
bookFlatSection: true
---

> Works with: Claude Code, Codex CLI, Cursor, Gemini CLI

**Skill file:** `skills/p1-farm-scheduler-bot/SKILL.md` — read this before implementing
**Agent workflow:** coder → qa → reviewer → doc-updater → committer

# 🔔 P1 — Farm Scheduler Bot (Tool A)

## Objective

Build the Telegram-based farm scheduler and reminder system that sends automated, recurring ZBNF task reminders — Jeevamrutha application, mulch checks, Neemastra spray, and irrigation advisories — calculated per-plot based on area and planting date.

## Prerequisites

- **P0 — Shared Foundation** completed (bot skeleton, SQLite, cron running)
- At least one test farmer + plot registered in the database

## Subtasks

### Phase 1: Plot Registration Command

- [x] Implement `/register` command that collects:
  - Plot name
  - Area in decimals (with bigha-to-decimal conversion: 1 bigha = 33 decimals)
  - Primary crop
  - Planting date (DD-MM-YYYY format)
- [x] Support conversational flow (multi-step input with `telegraf` scenes/wizards)
- [x] Store plot data in the `plots` table
- [x] Implement `/myplots` command to list all registered plots for a farmer
- [x] Implement `/deleteplot <name>` to remove a plot
- [x] Validate inputs (area > 0, valid date, etc.)

### Phase 2: Jeevamrutha Reminder Engine

- [x] Create a `services/jeevamrutha.js` module with:
  - Batch quantity calculator based on plot area
  - Message formatter that generates the reminder text in Bangla + English
- [x] Register a cron job that runs every 15 days from each plot's start date
- [x] Calculate per-plot batch quantities in the reminder message
- [x] Send reminder via Telegram to the farmer's chat ID
- [x] Log each sent reminder in a `reminder_logs` table

### Phase 3: Additional Reminder Types

- [x] **Mulch check** — Weekly reminder
- [x] **Neemastra spray** — Every 14 days
- [x] **Irrigation advisory** — Every 3 days (default cadence)
- [x] Each reminder type stored as a `reminder_type` in the database
- [x] Create a `reminders` table
- [x] Auto-create all default reminders when a new plot is registered

### Phase 4: Custom Reminders

- [x] Implement `/remind` command for farmer-defined reminders
  - One-time: `/remind once 2025-02-01 "Buy seeds"`
  - Recurring: `/remind every 7 "Inspect compost"`
- [x] Store custom reminders in the same `reminders` table with `type = 'custom'`
- [x] Support `/myreminders` to list all active reminders
- [x] Support `/cancelreminder <id>` to deactivate a reminder

### Phase 5: SMS Fallback (Roadmap)

- [x] Research BD telco SMS APIs (Researched Banglalink/GP/BulkSMS BD)
- [x] Abstract the notification layer in `NotificationService.js`
- [ ] Implement actual SMS provider integration
- [ ] Document SMS API costs and rate limits

## Acceptance Criteria

- [x] `/register` successfully stores a plot with all required fields
- [x] Jeevamrutha reminder fires every 15 days with correct batch quantities for the plot area
- [x] All 4 default reminder types auto-activate on plot registration
- [x] Custom one-time and recurring reminders work correctly
- [x] `/myplots` and `/myreminders` display correct data
- [x] Reminder messages include both Bangla and English text
- [x] `reminder_logs` table records every sent reminder
- [x] Winston logger in all command and scheduler files — no `console.log`
- [x] `npm run lint` passes with zero warnings (verified)
- [x] All farmer-facing messages have Bangla (primary) + English (secondary)
- [x] ZBNF ratios match `skills/zbnf-formulation/SKILL.md` exactly
- [x] Only parameterized SQLite queries — no string interpolation in SQL
- [x] `docs/farmer-guide-bn-en.md` updated with `/register` and `/myplots` instructions
- [x] `docs/CODEMAPS/` created and updated


## Estimated Effort

⏱️ **1–2 days** (Completed)

## Dependencies

| Dependency | Status |
|---|---|
| P0 — Shared Foundation | ✅ Completed |

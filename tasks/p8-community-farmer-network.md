---
title: "P8 — Community Farmer Network"
weight: 80
bookFlatSection: true
---

> Works with: Claude Code, Codex CLI, Cursor, Gemini CLI

**Skill file:** `skills/p8-community-farmer-network/SKILL.md` — read this before implementing
**Agent workflow:** coder → qa → reviewer → doc-updater → committer

# 🌐 P8 — Community Farmer Network (Tool H)

## Objective

Build a multi-component community platform — Telegram FAQ bot, Leaflet-based farmer map, ZBNF knowledge wiki, and WhatsApp broadcast channel — connecting ZBNF farmers in Bangladesh for knowledge sharing, resource exchange, and collective action.

## Prerequisites

- **P0** completed (Telegram bot infrastructure)
- **P1** completed (bot framework and DB patterns)
- Supabase free account (for farmer map backend)

## Subtasks

### Phase 1: Telegram Community Bot Extensions

- [x] Add keyword-based FAQ: farmer types "jeevamrutha" → bot replies with recipe
- [x] Build FAQ dictionary with 50–100 ZBNF keywords in `data/faq.json`
- [x] Implement pest alert broadcast: farmer reports pest → bot notifies all in same upazila
- [x] Add desi cow finder: `/registercow` to register as supplier, `/findcow <district>` to search
- [x] Weekly market price broadcast (manual update via admin command `/setprice`)

### Phase 2: Farmer Map (Leaflet + Supabase)

- [x] Set up Supabase project (free tier: 50k rows, auth included)
- [x] Create `farmers_map` table: id, name, lat, lng, crops, methods, district, upazila, created_at
- [x] Build HTML/JS page with Leaflet.js + OpenStreetMap tiles (no API key needed)
- [x] Features:
  - [x] Pin your farm with crops grown and ZBNF methods
  - [x] Find nearest desi cow dung source (filter cow suppliers)
  - [x] Regional pest alert pins ("BPH spotted in Mymensingh!")
  - [x] Filter by crop type, district, experience level
- [x] Simple registration form (Supabase auth or anonymous with name)
- [x] Deploy to Netlify/Vercel

### Phase 3: ZBNF Knowledge Wiki

- [x] Set up Hugo or Docusaurus site with Bangla ZBNF content
- [x] Translate key sections from this project's `docs/` folder to Bangla
- [x] Add Algolia DocSearch (free for open-source) or built-in search
- [x] Deploy to GitHub Pages
- [x] Mobile-optimized reading experience

### Phase 4: WhatsApp Broadcast Channel

- [x] Create WhatsApp Channel (no development — content curation)
- [x] Document content schedule: weekly tips, weather alerts, market prices, success stories
- [x] Create content templates for consistent formatting

## Acceptance Criteria

- [x] FAQ bot responds to 50+ ZBNF keywords correctly
- [x] Pest alert broadcasts reach all farmers in the same upazila
- [x] Farmer map displays pins with correct data, filterable by crop/district
- [x] Knowledge wiki is searchable and accessible on mobile
- [x] WhatsApp channel is created with initial content plan
- [x] `SUPABASE_SERVICE_KEY` in `.env` only — never logged or returned in API response
- [x] Frontend map uses `VITE_SUPABASE_ANON_KEY` (read-only) — correctly separated from service key
- [x] Coordinate bounds validation (Bangladesh: lat 20.5–26.7N, lon 88.0–92.7E) at service layer
- [x] Winston logger in all bot command handlers — no `console.log`
- [x] All farmer-facing Telegram messages include Bangla (primary) + English (secondary)
- [x] `docs/farmer-guide-bn-en.md` updated with `/joinmap` and `/faq` instructions

## Estimated Effort

⏱️ **1–2 days** (bot + WhatsApp) + **3–5 days** (map + wiki) = **4–7 days total**

## Dependencies

| Dependency | Status |
|---|---|
| P0 — Shared Foundation | Must be completed |
| P1 — Farm Scheduler Bot | Must be completed (bot patterns) |
| Supabase account | Required for farmer map |
| Content translation to Bangla | Required for wiki |

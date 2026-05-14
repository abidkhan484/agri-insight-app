---
title: "P6 — ZBNF Knowledge PWA"
weight: 60
bookFlatSection: true
---

> Works with: Claude Code, Codex CLI, Cursor, Gemini CLI

**Skill file:** `skills/p6-zbnf-knowledge-pwa/SKILL.md` — read this before implementing
**Agent workflow:** coder → qa → reviewer → doc-updater → committer

# 📱 P6 — ZBNF Knowledge Base PWA (Tool F)

## Objective

Build an offline-first PWA that gives farmers instant access to ZBNF formulation recipes, batch calculators, pest photo gallery, crop calendar, and troubleshooting guides — all cached on first load, works without internet.

## Prerequisites

- Node.js ≥ 18
- Content: ZBNF recipes, pest photos, crop calendar data prepared

## Subtasks

### Phase 1: Project Setup

- [x] Initialize React + Vite project with `vite-plugin-pwa`
- [x] Configure manifest: name "ZBNF জ্ঞানভান্ডার", icons, `display: standalone`
- [x] Set up Bangla-first UI with Inter/Noto Sans Bengali fonts
- [x] Create content data structure:
  ```
  /data/recipes.json, pests.json, crops.json, troubleshooting.json, soil-checklist.json
  /images/pests/, /images/formulations/, /images/crops/
  ```

### Phase 2: Recipe Calculator

- [x] Implement Jeevamrutha batch calculator: input area (decimal) → output quantities
- [x] Implement Beejamrutha, Neemastra, Agniastra, Brahmastra calculators
- [x] Countdown timer: days until next application per plot (uses IndexedDB for plot data)
- [x] Visual step-by-step preparation guide with photos

### Phase 3: Pest Photo Gallery

- [x] Create `pests.json` with 30+ common BD pests: name (Bangla/English), photo, symptoms, ZBNF treatment
- [x] Gallery UI with search/filter by crop type
- [x] Tap for detail view with full treatment protocol
- [x] Compress all images to WebP, target <50KB each, total gallery <5MB

### Phase 4: Crop Calendar

- [x] Create `crops.json` with planting windows per BD division (8 divisions)
- [x] Three seasons: Kharif (monsoon), Rabi (winter), Zaid (summer)
- [x] Interactive calendar view: select division → see recommended crops per month
- [x] Highlight current month and upcoming planting windows

### Phase 5: Troubleshooting Guide

- [x] Create `troubleshooting.json`: symptom → possible causes → ZBNF solutions
- [x] Examples: "Yellow leaves?", "Wilting?", "White powder on leaves?", "Stunted growth?"
- [x] Decision tree UI: farmer selects symptoms → narrows down diagnosis
- [x] Link to relevant pest gallery entries and formulation recipes

### Phase 6: Offline Caching & PWA

- [x] Configure Workbox to precache all HTML/CSS/JS, JSON data, and images
- [x] Total cache target: 20–30 MB (including compressed pest photos and tutorial videos)
- [x] Implement cache-first strategy with background update check
- [x] Add install prompt banner
- [x] Test: full functionality in airplane mode after first visit

## Acceptance Criteria

- [x] All recipe calculators return correct quantities for any input area
- [x] Pest gallery loads with photos and searchable by crop
- [x] Crop calendar displays correct planting windows per division
- [x] Troubleshooting guide navigates symptom → cause → solution
- [x] PWA installs and works 100% offline
- [x] All text in Bangla, total app size < 30 MB
- [x] `loglevel` used throughout — no `console.log` in production code
- [x] `npm run lint` passes with zero warnings
- [x] All 6 formulas verified by Vitest against exact ratios in `skills/zbnf-formulation/SKILL.md`
- [x] No external API dependencies — fully offline after first load
- [x] `docs/farmer-guide-bn-en.md` updated with calculator usage section

## Estimated Effort

⏱️ **5–7 days** (1 week)

## Dependencies

| Dependency | Status |
|---|---|
| Content preparation (recipes, pest photos, crop data) | Completed |
| No code dependencies on other tasks | — |

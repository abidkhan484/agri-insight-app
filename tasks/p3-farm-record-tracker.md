---
title: "P3 — Farm Record Tracker"
weight: 30
bookFlatSection: true
---

> Works with: Claude Code, Codex CLI, Cursor, Gemini CLI

**Skill file:** `skills/p3-farm-record-tracker/SKILL.md` — read this before implementing
**Agent workflow:** coder → qa → reviewer → doc-updater → committer

# 📊 P3 — Farm Record Keeping & Yield Tracker (Tool D)

## Objective

Build a React PWA with fully offline IndexedDB storage that lets farmers log ZBNF inputs, costs, crop observations, and harvest yields — with auto-generated seasonal comparison reports proving ZBNF savings.

## Prerequisites

- **P0 — Shared Foundation** completed (reuses plot data model concepts)
- Node.js ≥ 18, npm/pnpm installed

## Subtasks

### Phase 1: Project Setup (React + Vite PWA)

- [x] Initialize project: `npx -y create-vite@latest ./ -- --template react`
- [x] Install dependencies:
  ```bash
  npm install dexie dexie-react-hooks chart.js react-chartjs-2 jspdf papaparse
  npm install -D vite-plugin-pwa workbox-precaching
  ```
- [x] Configure `vite-plugin-pwa` in `vite.config.js` with:
  - `registerType: 'autoUpdate'`
  - `manifest` with app name "কৃষি রেকর্ড" (Krishi Record), icons, theme color
  - `workbox.runtimeCaching` for all static assets
- [x] Add Bangla + English language support structure (implemented directly in components)

### Phase 2: IndexedDB Data Model (Dexie.js)

- [x] Create `db/index.js` with Dexie database definition:
  ```javascript
  import Dexie from 'dexie';

  export const db = new Dexie('KrishiRecordDB');
  db.version(1).stores({
    plots: '++id, name, area, areaUnit',
    inputs: '++id, plotId, date, type, quantity, quantityUnit, cost',
    observations: '++id, plotId, date, title',
    harvests: '++id, plotId, date, crop, quantity, quantityUnit, revenue'
  });
  ```
- [x] Create CRUD helper functions for each table (using `useLiveQuery` from `dexie-react-hooks`)
- [x] Add data validation before writes (area > 0, cost ≥ 0, etc.)

### Phase 3: Core UI — Plot Management

- [x] Plot registration form: name, area (decimal + bigha converter), soil type
- [x] Plot list view with edit/delete
- [x] Plot detail view showing all logs, observations, and harvests for that plot
- [x] Bangla labels on all form fields with icon hints

### Phase 4: Input Logging

- [x] Input log form with fields: date, type (dropdown: Jeevamrutha/Beejamrutha/Neemastra/Agniastra/Mulch/Other), quantity, cost (৳)
- [x] Auto-calculate Jeevamrutha batch quantities from plot area (reuse calculator from Tool F spec)
- [x] Input log list with date filtering and type grouping
- [x] Quick-add buttons for common inputs (one-tap "Applied Jeevamrutha today")

### Phase 5: Observations & Harvest Recording

- [x] Observation form: date, title/description
- [x] Harvest form: date, crop, quantity (kg), revenue (৳)
- [x] Timeline view showing all activities (inputs + observations + harvests) chronologically

### Phase 6: Reports & Charts

- [x] **Cost comparison chart** (Chart.js bar chart)
- [x] **Yield trend chart** (line chart)
- [x] **Input frequency chart** (pie/bar chart)
- [x] **ROI calculator**: Revenue - Input Cost = Net Profit

### Phase 7: Export

- [x] CSV export of all data (Papa Parse)
- [x] PDF seasonal report (jsPDF)
- [x] Share via native Web Share API (implemented in Reports)

### Phase 8: Offline & PWA

- [x] Verify full offline functionality after first load
- [x] Add install prompt banner ("Add to Home Screen")
- [x] Test on Android Chrome with airplane mode
- [x] Confirm app icon appears on home screen correctly

## Acceptance Criteria

- [x] App installs as PWA and works 100% offline
- [x] All CRUD operations persist in IndexedDB across app restarts
- [x] Cost comparison and yield trend charts render correctly
- [x] CSV and PDF exports contain accurate data
- [x] All UI labels available in Bangla
- [x] App size < 2 MB (excluding user data)
- [x] `loglevel` imported and used in all React components — no `console.log`
- [x] `npm run lint` passes with zero warnings
- [x] All form labels have Bangla (primary) + English (secondary) text
- [x] `calculateJeevamrutha(33)` returns exact values matching `skills/zbnf-formulation/SKILL.md` (Vitest)
- [x] `docs/farmer-guide-bn-en.md` updated with PWA record-keeping instructions

## Estimated Effort

⏱️ **5–7 days** (Completed)

## Dependencies

| Dependency | Status |
|---|---|
| P0 — Shared Foundation | Completed |

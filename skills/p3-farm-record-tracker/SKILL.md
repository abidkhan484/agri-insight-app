---
name: p3-farm-record-tracker
description: Implement P3 Farm Record Keeping PWA — React + Vite offline-first app with Dexie.js IndexedDB, ZBNF input logging, harvest tracking, Chart.js reports, PDF/CSV export, and full Bangla UI. Independent of bot codebase.
triggers:
  - implement p3
  - farm record tracker
  - record keeping pwa
  - krishi record
  - offline pwa
---

# P3 — Farm Record Tracker PWA Implementation Workflow

## Dependency Check
**P0 must be complete** (for project conventions reference only).
P3 has no code dependency on P1 or P2 — it is a separate React PWA project.

## Required Reading
- `tasks/p3-farm-record-tracker.md` — all 8 phases checklist
- `skills/zbnf-formulation/SKILL.md` — for input type list, reminder intervals, and batch calculator reuse in Phase 4

---

## Agent Invocation Sequence

### Step 1 — coder

#### Phase 1: Project Initialization
```bash
npm create vite@latest krishi-record -- --template react
cd krishi-record
npm install dexie dexie-react-hooks chart.js react-chartjs-2 jspdf papaparse loglevel
npm install -D vite-plugin-pwa workbox-precaching eslint prettier eslint-config-prettier @eslint/js husky lint-staged
```

Copy ESLint/Prettier configs from workspace templates (same as bot project).

Configure `vite.config.js` with `vite-plugin-pwa`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'কৃষি রেকর্ড',
        short_name: 'কৃষি রেকর্ড',
        description: 'ZBNF ফার্ম রেকর্ড সিস্টেম',
        theme_color: '#2d6a4f',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
        }],
      },
    }),
  ],
});
```

#### Phase 2: Dexie.js IndexedDB Data Model
```js
// db/index.js
import Dexie from 'dexie';

export const db = new Dexie('agri-record');
db.version(1).stores({
  plots:       '++id, name, area_decimal, soil_type, created_at',
  inputLogs:   '++id, plot_id, date, type, quantity, cost_bdt',
  observations:'++id, plot_id, date, earthworm_count, pest_sighting',
  harvests:    '++id, plot_id, date, crop, quantity_kg, revenue_bdt, season',
});
```

Input log types (exactly these — from ZBNF domain):
`'jeevamrutha' | 'beejamrutha' | 'neemastra' | 'agniastra' | 'brahmastra' | 'mulch' | 'other'`

#### Phase 4: Input Logging — Jeevamrutha Auto-Calculator
When type = 'jeevamrutha', show auto-calculated quantities from area:
```js
// Reuse exact formula from skills/zbnf-formulation/SKILL.md
import { calculateJeevamrutha } from '../utils/zbnf-formulas.js';

const batch = calculateJeevamrutha(plot.area_decimal);
// Show as hint: "আনুমানিক পরিমাণ: জল ৬১ লিটার, গোবর ৩ কেজি..."
```

#### Logging (loglevel in browser)
```js
import log from 'loglevel';
log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

// Key events to log:
log.info('harvest_recorded', { plotId, crop, quantity_kg, revenue_bdt });
log.info('input_logged', { plotId, type, cost_bdt });
log.warn('validation_failed', { field, value });
log.error('db_write_failed', { table, error: err.message });
```

#### All Form Labels — Bangla Primary
```jsx
<label>
  <span className="label-bn">ফসলের নাম</span>
  <span className="label-en">Crop Name</span>
  <input type="text" name="crop" />
</label>
```

### Step 2 — qa
- All CRUD operations persist across page refresh and app close/reopen
- `calculateJeevamrutha(33)` returns correct values (same formula as bot)
- CSV export contains all records from all 4 tables
- PDF report renders charts correctly
- App works in airplane mode after first load
- App size < 2 MB (check: `npm run build && du -sh dist/`)
  ```js
  it('calculates jeevamrutha correctly for PWA', () => {
    // Same test as bot — same formula
    expect(calculateJeevamrutha(33).water_liters).toBe(200);
  });
  ```

### Step 3 — reviewer
- Input type values match exactly the ZBNF domain list (no typos)
- Area must be validated > 0 before IndexedDB write
- No external API calls — 100% offline operation for data storage
- Bangla Unicode in all form labels confirmed
- PWA manifest has `display: standalone`

### Step 4 — doc-updater
- `docs/developer-setup.md` — add PWA project setup section
- `docs/farmer-guide-bn-en.md` — add PWA usage guide in Bangla
- `README.md` in `krishi-record/` — full setup and usage

### Step 5 — committer
Scope: `feat(pwa): implement farm record tracker PWA with offline IndexedDB and ZBNF input logging`

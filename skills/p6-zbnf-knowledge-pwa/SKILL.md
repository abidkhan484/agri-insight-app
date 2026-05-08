---
name: p6-zbnf-knowledge-pwa
description: Implement P6 ZBNF Knowledge PWA — offline-first React + Vite PWA with 6 ZBNF formulation calculators (Jeevamrutha, Beejamrutha, Neemastra, Agniastra, Brahmastra, Mulch), pest identification gallery with images, application calendar, Bangla-first UI, vite-plugin-pwa service worker, and loglevel browser logging. Independent of bot codebase.
triggers:
  - implement p6
  - zbnf knowledge pwa
  - formulation calculator
  - offline knowledge base
  - zbnf calculator
  - pest gallery
---

# P6 — ZBNF Knowledge PWA Implementation Workflow

## Dependency Check
**P0 must be complete** (for project conventions reference only).
P6 is fully independent — no code dependency on P1–P5.

## Required Reading
**MANDATORY before writing any calculator:** `skills/zbnf-formulation/SKILL.md`
Every ratio, interval, and ingredient must match exactly. This is farmer-critical.

Read all sections:
- Section 1: Jeevamrutha
- Section 2: Beejamrutha
- Section 3: Neemastra
- Section 4: Agniastra
- Section 5: Brahmastra
- Section 6: Mulch (Aachhadan)
- Section 7: Whapasa rules
- Section 8: Bangla glossary

---

## Agent Invocation Sequence

### Step 1 — coder

#### Phase 1: Project Bootstrap

```bash
npm create vite@latest zbnf-knowledge -- --template react
cd zbnf-knowledge
npm install loglevel react-router-dom
npm install -D vite-plugin-pwa workbox-precaching eslint prettier \
             eslint-config-prettier @eslint/js husky lint-staged
```

`vite.config.js`:
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
        name: 'ZBNF কৃষি জ্ঞানভান্ডার',
        short_name: 'ZBNF জ্ঞান',
        description: 'জিরো বাজেট প্রাকৃতিক কৃষির সম্পূর্ণ গাইড',
        theme_color: '#2d6a4f',
        background_color: '#f0f4f0',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,jpeg,json,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB for images
      },
    }),
  ],
});
```

#### Phase 2: App Routes (`src/App.jsx`)

```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import PestGallery from './pages/PestGallery';
import Calendar from './pages/Calendar';
import Glossary from './pages/Glossary';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="bottom-nav">
        <Link to="/">🏠<span className="bn">হোম</span></Link>
        <Link to="/calculator">🧮<span className="bn">ক্যালকুলেটর</span></Link>
        <Link to="/pests">🐛<span className="bn">পোকামাকড়</span></Link>
        <Link to="/calendar">📅<span className="bn">ক্যালেন্ডার</span></Link>
        <Link to="/glossary">📖<span className="bn">শব্দকোষ</span></Link>
      </nav>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/calculator"  element={<Calculator />} />
        <Route path="/pests"       element={<PestGallery />} />
        <Route path="/calendar"    element={<Calendar />} />
        <Route path="/glossary"    element={<Glossary />} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### Phase 3: ZBNF Formulation Calculators (`src/utils/zbnf-formulas.js`)

**All ratios must exactly match `skills/zbnf-formulation/SKILL.md`.**

```js
import log from 'loglevel';
log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

/** Jeevamrutha — per 200L batch for 33 decimals (Source: ZBNF SKILL.md Section 1) */
export function calculateJeevamrutha(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) throw new Error('Area must be > 0');
  const ratio = areaDecimal / 33;
  log.debug('jeevamrutha_calculated', { areaDecimal, ratio });
  return {
    water_liters:      Math.round(200 * ratio),
    cow_dung_kg:       parseFloat((10 * ratio).toFixed(1)),
    cow_urine_liters:  parseFloat((7.5 * ratio).toFixed(2)),
    jaggery_kg:        parseFloat((2 * ratio).toFixed(1)),
    pulse_flour_kg:    parseFloat((2 * ratio).toFixed(1)),
    soil_handful:      Math.max(1, Math.round(ratio)),
    interval_days:     15,
    shelf_life_days:   7,
  };
}

/** Beejamrutha — per 100 kg seeds (SKILL.md Section 2) */
export function calculateBeejamrutha(seedKg) {
  if (!seedKg || seedKg <= 0) throw new Error('Seed weight must be > 0');
  const ratio = seedKg / 100;
  return {
    water_liters:     parseFloat((20 * ratio).toFixed(1)),
    cow_dung_kg:      parseFloat((5 * ratio).toFixed(2)),
    cow_urine_liters: parseFloat((5 * ratio).toFixed(2)),
    lime_grams:       parseFloat((50 * ratio).toFixed(1)),
    soil_handful:     Math.max(1, Math.round(ratio)),
    soak_hours:       12,
    shade_dry_hours:  24,
  };
}

/** Neemastra — per 200L batch for 33 decimals (SKILL.md Section 3) */
export function calculateNeemastra(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) throw new Error('Area must be > 0');
  const ratio = areaDecimal / 33;
  return {
    water_liters:     Math.round(200 * ratio),
    neem_leaves_kg:   parseFloat((5 * ratio).toFixed(1)),
    cow_urine_liters: parseFloat((5 * ratio).toFixed(2)),
    cow_dung_kg:      parseFloat((1 * ratio).toFixed(2)),
    steep_hours:      48,
    filter_before_spray: true,
    interval_days:    14,
    spray_time:       'evening', // never spray in direct sun
  };
}

/** Agniastra — per 20L batch (SKILL.md Section 4) */
export function calculateAgniastra(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) throw new Error('Area must be > 0');
  const ratio = areaDecimal / 33;
  return {
    water_liters:        Math.round(20 * ratio),
    tobacco_leaves_kg:   parseFloat((1 * ratio).toFixed(2)),
    green_chilli_kg:     parseFloat((0.5 * ratio).toFixed(2)),
    garlic_kg:           parseFloat((0.5 * ratio).toFixed(2)),
    cow_urine_liters:    parseFloat((5 * ratio).toFixed(2)),
    boil_minutes:        5,
    cool_filter:         true,
    dilute_ratio:        '1:10', // 1 part Agniastra : 10 parts water
  };
}

/** Brahmastra — per 10L concentrated batch (SKILL.md Section 5) */
export function calculateBrahmastra(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) throw new Error('Area must be > 0');
  const ratio = areaDecimal / 33;
  return {
    water_liters:       Math.round(10 * ratio),
    neem_bark_leaves_kg: parseFloat((3 * ratio).toFixed(2)),
    papaya_leaves_kg:   parseFloat((2 * ratio).toFixed(2)),
    custard_apple_leaf_kg: parseFloat((2 * ratio).toFixed(2)),
    guava_leaves_kg:    parseFloat((2 * ratio).toFixed(2)),
    pomegranate_leaf_kg: parseFloat((2 * ratio).toFixed(2)),
    cow_urine_liters:   parseFloat((5 * ratio).toFixed(2)),
    cow_dung_kg:        parseFloat((1 * ratio).toFixed(2)),
    boil_minutes:       5,
    dilute_ratio:       '1:10',
    notes_bn:           'মহা কীটনাশক — শুধুমাত্র গুরুতর আক্রমণে ব্যবহার করুন',
    notes_en:           'Use only for severe pest attacks',
  };
}

/** Mulch (Aachhadan) — coverage calculation (SKILL.md Section 6) */
export function calculateMulch(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) throw new Error('Area must be > 0');
  // 4–6 inches depth required; 1 bigha (33 decimal) needs approx. 1500 kg dry straw
  const ratio = areaDecimal / 33;
  return {
    straw_kg:       Math.round(1500 * ratio),
    depth_inches:   { min: 4, max: 6 },
    interval_days:  7,  // replenish every 7 days as it decomposes
    materials_bn:   ['খড়', 'শুকনো পাতা', 'ঘাস (বীজমুক্ত)'],
    materials_en:   ['Straw', 'Dry leaves', 'Grass (seed-free)'],
    benefit_bn:     'মাটির আর্দ্রতা ধরে রাখে, আগাছা দমন করে',
    benefit_en:     'Retains soil moisture, suppresses weeds',
  };
}
```

#### Phase 4: Calculator UI (`src/pages/Calculator.jsx`)

```jsx
import { useState } from 'react';
import log from 'loglevel';
import {
  calculateJeevamrutha,
  calculateBeejamrutha,
  calculateNeemastra,
  calculateAgniastra,
  calculateBrahmastra,
  calculateMulch,
} from '../utils/zbnf-formulas.js';

const FORMULAS = {
  jeevamrutha:  { label_bn: 'জীবামৃত', label_en: 'Jeevamrutha', fn: calculateJeevamrutha, inputLabel_bn: 'জমির পরিমাণ (ডেসিমেল)', inputLabel_en: 'Plot area (decimals)' },
  beejamrutha:  { label_bn: 'বীজামৃত', label_en: 'Beejamrutha', fn: calculateBeejamrutha, inputLabel_bn: 'বীজের পরিমাণ (কেজি)', inputLabel_en: 'Seed weight (kg)' },
  neemastra:    { label_bn: 'নিমাস্ত্র', label_en: 'Neemastra', fn: calculateNeemastra, inputLabel_bn: 'জমির পরিমাণ (ডেসিমেল)', inputLabel_en: 'Plot area (decimals)' },
  agniastra:    { label_bn: 'অগ্নিআস্ত্র', label_en: 'Agniastra', fn: calculateAgniastra, inputLabel_bn: 'জমির পরিমাণ (ডেসিমেল)', inputLabel_en: 'Plot area (decimals)' },
  brahmastra:   { label_bn: 'ব্রহ্মাস্ত্র', label_en: 'Brahmastra', fn: calculateBrahmastra, inputLabel_bn: 'জমির পরিমাণ (ডেসিমেল)', inputLabel_en: 'Plot area (decimals)' },
  mulch:        { label_bn: 'আচ্ছাদন (মালচ)', label_en: 'Mulch', fn: calculateMulch, inputLabel_bn: 'জমির পরিমাণ (ডেসিমেল)', inputLabel_en: 'Plot area (decimals)' },
};

export default function Calculator() {
  const [selected, setSelected] = useState('jeevamrutha');
  const [input, setInput]       = useState('');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);

  function handleCalculate() {
    const value = parseFloat(input);
    setError(null);
    if (!value || value <= 0) {
      setError('সঠিক পরিমাণ লিখুন / Please enter a valid value');
      return;
    }
    try {
      const r = FORMULAS[selected].fn(value);
      setResult(r);
      log.info('formula_calculated', { formula: selected, input: value });
    } catch (err) {
      log.error('formula_error', { formula: selected, error: err.message });
      setError(err.message);
    }
  }

  const formula = FORMULAS[selected];

  return (
    <main className="page">
      <h1>
        <span className="bn">সার ও কীটনাশক ক্যালকুলেটর</span>
        <span className="en">Fertilizer & Pesticide Calculator</span>
      </h1>

      <div className="formula-tabs">
        {Object.entries(FORMULAS).map(([key, f]) => (
          <button
            key={key}
            className={selected === key ? 'tab active' : 'tab'}
            onClick={() => { setSelected(key); setResult(null); }}
          >
            <span className="bn">{f.label_bn}</span>
          </button>
        ))}
      </div>

      <div className="input-row">
        <label>
          <span className="bn">{formula.inputLabel_bn}</span>
          <span className="en">{formula.inputLabel_en}</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0.0"
          />
        </label>
        <button onClick={handleCalculate} className="btn-calculate">
          <span className="bn">হিসাব করুন</span>
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <ResultCard formula={selected} result={result} />
      )}
    </main>
  );
}

function ResultCard({ formula, result }) {
  return (
    <div className="result-card">
      <h2>
        <span className="bn">প্রয়োজনীয় উপকরণ</span>
        <span className="en">Required Ingredients</span>
      </h2>
      <table className="ingredients">
        <tbody>
          {Object.entries(result)
            .filter(([k]) => !k.includes('notes') && !k.includes('bn') && !k.includes('en') && !k.includes('materials'))
            .map(([key, val]) => (
              <tr key={key}>
                <td className="key">{key.replace(/_/g, ' ')}</td>
                <td className="val">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      {result.notes_bn && <p className="note">{result.notes_bn}</p>}
    </div>
  );
}
```

#### Phase 5: Pest Gallery (`src/pages/PestGallery.jsx`)

Pest data file `src/data/pests.json`:
```json
[
  {
    "id": "whitefly",
    "name_bn": "সাদা মাছি",
    "name_en": "Whitefly",
    "image": "/pests/whitefly.jpg",
    "symptoms_bn": "পাতার নিচে সাদা পোকা, হলুদ পাতা, মধু শিশির",
    "symptoms_en": "White insects under leaves, yellowing, honeydew",
    "treatment_primary": "agniastra",
    "crops_affected_bn": ["টমেটো", "বেগুন", "মরিচ", "তামাক"],
    "crops_affected_en": ["Tomato", "Brinjal", "Chili", "Tobacco"]
  },
  {
    "id": "armyworm",
    "name_bn": "ফল আর্মিওয়ার্ম",
    "name_en": "Fall Armyworm",
    "image": "/pests/armyworm.jpg",
    "symptoms_bn": "পাতায় জানালার মতো ক্ষত, কাণ্ডে ছিদ্র",
    "symptoms_en": "Window-pane leaf damage, stem boring",
    "treatment_primary": "agniastra",
    "crops_affected_bn": ["ভুট্টা", "ধান", "গম"],
    "crops_affected_en": ["Maize", "Rice", "Wheat"]
  },
  {
    "id": "aphid",
    "name_bn": "জাব পোকা",
    "name_en": "Aphid",
    "image": "/pests/aphid.jpg",
    "symptoms_bn": "পাতা কুঁকড়ানো, সবুজ/কালো ছোট পোকা",
    "symptoms_en": "Curled leaves, green/black clusters of insects",
    "treatment_primary": "neemastra",
    "crops_affected_bn": ["সরিষা", "ডাল", "সব্জি"],
    "crops_affected_en": ["Mustard", "Pulses", "Vegetables"]
  },
  {
    "id": "stem-borer",
    "name_bn": "কাণ্ড ছিদ্রকারী পোকা",
    "name_en": "Stem Borer",
    "image": "/pests/stem-borer.jpg",
    "symptoms_bn": "মৃত হৃদয়, শীষে সাদা হওয়া",
    "symptoms_en": "Dead hearts, white ear (flooding)",
    "treatment_primary": "agniastra",
    "crops_affected_bn": ["ধান", "আখ"],
    "crops_affected_en": ["Rice", "Sugarcane"]
  }
]
```

Gallery component:
```jsx
import pests from '../data/pests.json';
import log from 'loglevel';

export default function PestGallery() {
  log.debug('pest_gallery_rendered', { count: pests.length });

  return (
    <main className="page">
      <h1>
        <span className="bn">পোকামাকড় ও রোগ গ্যালারি</span>
        <span className="en">Pest & Disease Gallery</span>
      </h1>
      <div className="pest-grid">
        {pests.map((pest) => (
          <article key={pest.id} className="pest-card">
            <img src={pest.image} alt={pest.name_en} loading="lazy" />
            <h2>
              <span className="bn">{pest.name_bn}</span>
              <span className="en">{pest.name_en}</span>
            </h2>
            <p className="bn">{pest.symptoms_bn}</p>
            <p className="affected">
              <span className="bn">আক্রান্ত ফসল: </span>
              {pest.crops_affected_bn.join('، ')}
            </p>
            <div className="treatment-tag">{pest.treatment_primary}</div>
          </article>
        ))}
      </div>
    </main>
  );
}
```

#### Phase 6: Bangla Glossary (`src/data/glossary.json`)

Derived from `skills/zbnf-formulation/SKILL.md` glossary section. Include at minimum:
জীবামৃত, বীজামৃত, নিমাস্ত্র, অগ্নিআস্ত্র, ব্রহ্মাস্ত্র, দশপর্ণী অর্ক, ওয়াপাসা, আচ্ছাদন, গোমূত্র, দেশি গরু.

---

### Step 2 — qa

Test file (`tests/p6-formulas.test.js`):

```js
import { describe, it, expect } from 'vitest';
import {
  calculateJeevamrutha,
  calculateBeejamrutha,
  calculateNeemastra,
  calculateAgniastra,
  calculateBrahmastra,
  calculateMulch,
} from '../src/utils/zbnf-formulas.js';

describe('P6 — ZBNF Formula Calculators', () => {
  describe('Jeevamrutha', () => {
    it('calculates correct quantities for 33 decimals (1 bigha)', () => {
      const r = calculateJeevamrutha(33);
      expect(r.water_liters).toBe(200);
      expect(r.cow_dung_kg).toBe(10.0);
      expect(r.cow_urine_liters).toBe(7.5);
      expect(r.jaggery_kg).toBe(2.0);
      expect(r.interval_days).toBe(15);
    });

    it('calculates for half bigha (16.5 decimals)', () => {
      const r = calculateJeevamrutha(16.5);
      expect(r.water_liters).toBe(100);
      expect(r.cow_dung_kg).toBe(5.0);
      expect(r.cow_urine_liters).toBe(3.75);
    });

    it('calculates for 10 decimals (small plot)', () => {
      const r = calculateJeevamrutha(10);
      expect(r.water_liters).toBe(61);
      expect(r.cow_dung_kg).toBe(3.0);
    });

    it('throws for zero area', () => {
      expect(() => calculateJeevamrutha(0)).toThrow();
    });
  });

  describe('Beejamrutha', () => {
    it('calculates for 100 kg seeds (base recipe)', () => {
      const r = calculateBeejamrutha(100);
      expect(r.water_liters).toBe(20);
      expect(r.cow_dung_kg).toBe(5);
      expect(r.cow_urine_liters).toBe(5);
      expect(r.lime_grams).toBe(50);
    });
  });

  describe('Neemastra', () => {
    it('calculates for 33 decimals', () => {
      const r = calculateNeemastra(33);
      expect(r.water_liters).toBe(200);
      expect(r.neem_leaves_kg).toBe(5.0);
      expect(r.steep_hours).toBe(48);
      expect(r.interval_days).toBe(14);
    });

    it('specifies evening spray time', () => {
      const r = calculateNeemastra(10);
      expect(r.spray_time).toBe('evening');
    });
  });

  describe('Mulch', () => {
    it('calculates straw for 33 decimals', () => {
      const r = calculateMulch(33);
      expect(r.straw_kg).toBe(1500);
      expect(r.interval_days).toBe(7);
    });
  });
});
```

QA checklist:
- [ ] All 6 formulas produce exact ratios matching SKILL.md reference values
- [ ] Jeevamrutha test values match table in SKILL.md (33, 16.5, 66, 10 decimals)
- [ ] Neemastra steep time = 48 hours (not 24)
- [ ] App loads and works offline after first visit (service worker cached)
- [ ] Calculator accessible on mobile without horizontal scroll
- [ ] All labels show Bangla text as primary
- [ ] Pest images load with lazy loading
- [ ] `npm run lint` passes with zero warnings

---

### Step 3 — reviewer

- [ ] No API keys in frontend code — PWA is purely static
- [ ] No `console.log` — `loglevel` used throughout
- [ ] Formula constants NOT approximated — exact decimals from SKILL.md
- [ ] All Bangla text uses Unicode (not transliteration)
- [ ] Images served from own domain — no CDN external dependency for offline use
- [ ] Service worker scope covers all routes

---

### Step 4 — doc-updater

- `README.md` → P6 section with Netlify deploy URL
- `docs/architecture.md` → P6: static PWA, no server dependency
- `docs/farmer-guide-bn-en.md` → calculator usage in Bangla + English
- `tasks/p6-zbnf-knowledge-pwa.md` → mark completed phases

---

### Step 5 — committer

```
feat(p6): add ZBNF Knowledge PWA with 6 formulation calculators + pest gallery

- Jeevamrutha, Beejamrutha, Neemastra, Agniastra, Brahmastra, Mulch calculators
- All ratios validated against skills/zbnf-formulation/SKILL.md
- Pest gallery: 4 common pests with treatment links
- Offline-first: vite-plugin-pwa + Workbox service worker
- Bangla-first UI; loglevel browser logging; zero console.log
- 18 Vitest formula tests all passing
```

---

## Formula Quick Reference

| Formula | Base Batch | For (area/weight) | Key Rule |
|---------|-----------|-------------------|----------|
| Jeevamrutha | 200L | 33 decimals | Every 15 days; 7-day shelf life |
| Beejamrutha | 20L | 100 kg seeds | Soak 12h, dry 24h in shade |
| Neemastra | 200L | 33 decimals | Steep 48h; spray evenings; every 14 days |
| Agniastra | 20L | 33 decimals | Boil 5 min; dilute 1:10; severe pests only |
| Brahmastra | 10L (conc.) | 33 decimals | Nuclear option — severe attacks only; dilute 1:10 |
| Mulch | 1500 kg straw | 33 decimals | 4–6 inch depth; replenish every 7 days |

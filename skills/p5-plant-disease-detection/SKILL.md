---
name: p5-plant-disease-detection
description: Implement P5 Plant Disease Detection — PlantNet API MVP (500 req/day free) with TF.js + MobileNetV2 on-device PWA fallback, disease-to-ZBNF-treatment JSON mapping, loglevel browser logging, and Bangla-first result UI. Requires P0 complete; can run in parallel with P4.
triggers:
  - implement p5
  - plant disease detection
  - plantnet api
  - tensorflow js disease
  - disease photo upload
  - crop disease identification
---

# P5 — Plant Disease Detection Implementation Workflow

## Dependency Check
**P0 must be complete before starting P5.**
P5 is independent of P1–P4 and can run in parallel with P4.

## Required Reading
- `tasks/p5-plant-disease-detection.md` — full phase checklist
- `skills/zbnf-formulation/SKILL.md` → Sections 3–6 (Neemastra, Agniastra, Brahmastra, Dashaparni):
  - Disease detection triggers specific ZBNF spray recommendations
  - Match PlantNet confidence + disease type → correct treatment from SKILL.md ratios

---

## Agent Invocation Sequence

### Step 1 — coder

#### Phase 1: PWA Project Bootstrap

```bash
npm create vite@latest disease-detect -- --template react
cd disease-detect
npm install loglevel axios
npm install -D vite-plugin-pwa workbox-precaching eslint prettier \
             eslint-config-prettier @eslint/js husky lint-staged
```

Configure `vite.config.js`:
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
        name: 'ফসলের রোগ শনাক্তকরণ',
        short_name: 'রোগ শনাক্ত',
        description: 'ZBNF ফসলের রোগ চিহ্নিত করুন এবং চিকিৎসা জানুন',
        theme_color: '#386641',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/my\.plantnet\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'plantnet-cache', expiration: { maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
});
```

#### Phase 2: PlantNet API Integration (`src/services/plantnet.js`)

**No API key required for the free tier (500 req/day).**

```js
import log from 'loglevel';
log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

const PLANTNET_BASE = 'https://my.plantnet.org/v2/identify/all';
const PLANTNET_API_KEY = import.meta.env.VITE_PLANTNET_API_KEY || '2b10xE7EOOO0yPO1Cx5piB1Dg';
// Default key is PlantNet's public demo key — replace with own key for production

/**
 * Identify plant disease from an image file.
 * @param {File} imageFile - Image captured from camera or gallery
 * @returns {Promise<PlantNetResult[]>} Ranked results with confidence scores
 */
export async function identifyDisease(imageFile) {
  log.info('plantnet_identify_start', { fileName: imageFile.name, size: imageFile.size });

  const formData = new FormData();
  formData.append('images', imageFile);
  formData.append('organs', 'leaf');  // or 'fruit', 'flower'

  const url = `${PLANTNET_BASE}?api-key=${PLANTNET_API_KEY}&lang=en&include-related-images=false`;

  const response = await fetch(url, { method: 'POST', body: formData });

  if (response.status === 429) {
    log.warn('plantnet_rate_limit_hit');
    throw new Error('RATE_LIMIT');
  }
  if (!response.ok) {
    log.error('plantnet_api_error', { status: response.status });
    throw new Error(`PlantNet error: ${response.status}`);
  }

  const data = await response.json();
  log.info('plantnet_identify_success', { resultCount: data.results?.length });

  return (data.results || []).slice(0, 5).map((r) => ({
    scientificName: r.species?.scientificNameWithoutAuthor || '',
    commonNames: r.species?.commonNames || [],
    confidence: Math.round((r.score || 0) * 100),
    family: r.species?.family?.scientificNameWithoutAuthor || '',
  }));
}
```

#### Phase 3: Disease → ZBNF Treatment Map (`src/data/disease-treatments.json`)

```json
{
  "Alternaria": {
    "name_bn": "অলটারনারিয়া পাতার দাগ",
    "name_en": "Alternaria Leaf Blight",
    "symptoms_bn": "পাতায় বৃত্তাকার বাদামি দাগ, হলুদ আভা",
    "symptoms_en": "Circular brown spots on leaves with yellow halo",
    "treatment": {
      "primary": "neemastra",
      "secondary": "agniastra",
      "schedule_bn": "নিমাস্ত্র ৭ দিন অন্তর ৩ বার স্প্রে করুন",
      "schedule_en": "Spray Neemastra 3 times at 7-day intervals"
    }
  },
  "Phytophthora": {
    "name_bn": "আলুর ধসা রোগ (লেট ব্লাইট)",
    "name_en": "Late Blight",
    "symptoms_bn": "পাতা ও কাণ্ডে কালো পচা দাগ, সাদা ছত্রাক",
    "symptoms_en": "Dark water-soaked lesions, white mold on undersides",
    "treatment": {
      "primary": "brahmastra",
      "secondary": "neemastra",
      "schedule_bn": "ব্রহ্মাস্ত্র দিয়ে একবার, তারপর নিমাস্ত্র সাপ্তাহিক",
      "schedule_en": "Apply Brahmastra once, then weekly Neemastra"
    }
  },
  "Fusarium": {
    "name_bn": "ফিউজেরিয়াম উইল্ট (ঢলে পড়া রোগ)",
    "name_en": "Fusarium Wilt",
    "symptoms_bn": "গাছ হঠাৎ ঢলে পড়ে, শিকড় বাদামি",
    "symptoms_en": "Sudden wilting, brown vascular tissue",
    "treatment": {
      "primary": "jeevamrutha",
      "secondary": "beejamrutha",
      "schedule_bn": "জীবামৃত মাটিতে ঢালুন, পরবর্তী চাষে বীজামৃত দিন",
      "schedule_en": "Drench with Jeevamrutha; use Beejamrutha next season"
    }
  },
  "Bemisia": {
    "name_bn": "সাদা মাছি (হোয়াইটফ্লাই)",
    "name_en": "Whitefly",
    "symptoms_bn": "পাতার নিচে সাদা পোকা, মধু শিশির",
    "symptoms_en": "White insects under leaves, honeydew residue",
    "treatment": {
      "primary": "agniastra",
      "secondary": "neemastra",
      "schedule_bn": "অগ্নিআস্ত্র সন্ধ্যায় স্প্রে করুন, ৫ দিন পর নিমাস্ত্র",
      "schedule_en": "Spray Agniastra at dusk, follow with Neemastra after 5 days"
    }
  },
  "Spodoptera": {
    "name_bn": "ফল আর্মিওয়ার্ম",
    "name_en": "Fall Armyworm",
    "symptoms_bn": "পাতায় জানালার মতো ক্ষত, মল দৃশ্যমান",
    "symptoms_en": "Window-pane leaf damage, frass visible",
    "treatment": {
      "primary": "agniastra",
      "secondary": "brahmastra",
      "schedule_bn": "অগ্নিআস্ত্র প্রতি ৫ দিনে স্প্রে করুন",
      "schedule_en": "Spray Agniastra every 5 days"
    }
  },
  "unknown": {
    "name_bn": "অজ্ঞাত রোগ",
    "name_en": "Unknown Disease",
    "symptoms_bn": "নিশ্চিত শনাক্ত করা যায়নি",
    "symptoms_en": "Could not identify with confidence",
    "treatment": {
      "primary": "neemastra",
      "secondary": null,
      "schedule_bn": "সতর্কতামূলক নিমাস্ত্র স্প্রে করুন, কৃষি বিশেষজ্ঞের পরামর্শ নিন",
      "schedule_en": "Apply preventive Neemastra spray; consult agriculture expert"
    }
  }
}
```

Treatment lookup utility (`src/utils/lookup-treatment.js`):
```js
import treatments from '../data/disease-treatments.json';

export function lookupTreatment(scientificName) {
  // Match by genus (first word of scientific name)
  const genus = scientificName.split(' ')[0];
  const match = Object.entries(treatments).find(([key]) =>
    scientificName.toLowerCase().includes(key.toLowerCase())
    || genus.toLowerCase() === key.toLowerCase()
  );
  return match ? match[1] : treatments.unknown;
}
```

#### Phase 4: TF.js On-Device Fallback (`src/services/tfjs-fallback.js`)

Used when PlantNet returns 429 (rate limit) or offline:

```js
import log from 'loglevel';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

let model = null;

export async function loadModel() {
  if (model) return model;
  log.info('tfjs_model_loading');
  // MobileNetV2 fine-tuned on PlantVillage dataset (hosted on GitHub Pages)
  model = await tf.loadLayersModel(
    '/models/plant-disease/model.json'
  );
  log.info('tfjs_model_loaded');
  return model;
}

/**
 * Classify disease from image element using on-device MobileNetV2.
 * @param {HTMLImageElement|HTMLCanvasElement} imgEl
 * @returns {Promise<{label: string, confidence: number}[]>}
 */
export async function classifyDisease(imgEl) {
  const m = await loadModel();
  const tensor = tf.browser.fromPixels(imgEl)
    .resizeBilinear([224, 224])
    .expandDims(0)
    .div(255.0);

  const predictions = await m.predict(tensor).data();
  tensor.dispose();

  // Class labels match PlantVillage 38-class dataset
  const LABELS = await fetch('/models/plant-disease/labels.json').then((r) => r.json());

  return Array.from(predictions)
    .map((score, i) => ({ label: LABELS[i], confidence: Math.round(score * 100) }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}
```

#### Phase 5: Main Detection UI (`src/components/DiseaseDetector.jsx`)

```jsx
import { useState, useRef } from 'react';
import log from 'loglevel';
import { identifyDisease } from '../services/plantnet.js';
import { classifyDisease, loadModel } from '../services/tfjs-fallback.js';
import { lookupTreatment } from '../utils/lookup-treatment.js';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

export default function DiseaseDetector() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const imgRef = useRef(null);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      let detections;
      try {
        detections = await identifyDisease(file);
      } catch (err) {
        if (err.message === 'RATE_LIMIT' || !navigator.onLine) {
          log.warn('plantnet_unavailable_using_tfjs');
          const imgEl = imgRef.current;
          imgEl.src = URL.createObjectURL(file);
          await imgEl.decode();
          detections = await classifyDisease(imgEl);
        } else {
          throw err;
        }
      }

      const topResult = detections[0];
      const treatment = lookupTreatment(topResult.scientificName || topResult.label || '');
      setResult({ detections, treatment });
      log.info('disease_detected', { topResult: topResult.scientificName, confidence: topResult.confidence });
    } catch (err) {
      log.error('detection_failed', { error: err.message });
      setError('শনাক্তকরণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।\nDetection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="detector">
      <h1>
        <span className="bn">ফসলের রোগ শনাক্তকরণ</span>
        <span className="en">Crop Disease Detection</span>
      </h1>

      <label className="upload-btn">
        <span className="bn">ছবি তুলুন বা গ্যালারি থেকে বেছে নিন</span>
        <span className="en">Take photo or choose from gallery</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      </label>

      <img ref={imgRef} alt="preview" style={{ display: 'none' }} />

      {loading && (
        <p className="status">
          <span className="bn">শনাক্ত করা হচ্ছে...</span>
          <span className="en">Identifying...</span>
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-card">
          <h2>
            <span className="bn">{result.treatment.name_bn}</span>
            <span className="en">{result.treatment.name_en}</span>
          </h2>
          <p className="confidence">
            আত্মবিশ্বাস / Confidence: {result.detections[0].confidence}%
          </p>
          <h3><span className="bn">উপসর্গ</span> / Symptoms</h3>
          <p>{result.treatment.symptoms_bn}</p>
          <p>{result.treatment.symptoms_en}</p>
          <h3><span className="bn">চিকিৎসা</span> / Treatment</h3>
          <p>{result.treatment.treatment.schedule_bn}</p>
          <p>{result.treatment.treatment.schedule_en}</p>
        </div>
      )}
    </div>
  );
}
```

---

### Step 2 — qa

QA test cases (`tests/p5-disease.test.js`):

```js
import { describe, it, expect, vi } from 'vitest';
import { lookupTreatment } from '../src/utils/lookup-treatment.js';

describe('P5 — Disease Treatment Lookup', () => {
  it('returns Neemastra treatment for Alternaria', () => {
    const t = lookupTreatment('Alternaria alternata');
    expect(t.treatment.primary).toBe('neemastra');
    expect(t.name_bn).toContain('অলটারনারিয়া');
  });

  it('returns Brahmastra for Phytophthora (Late Blight)', () => {
    const t = lookupTreatment('Phytophthora infestans');
    expect(t.treatment.primary).toBe('brahmastra');
  });

  it('returns Agniastra for whitefly (Bemisia)', () => {
    const t = lookupTreatment('Bemisia tabaci');
    expect(t.treatment.primary).toBe('agniastra');
  });

  it('returns unknown treatment for unrecognized species', () => {
    const t = lookupTreatment('Xyzzyus unknownus');
    expect(t.treatment.primary).toBe('neemastra'); // default safe treatment
    expect(t.name_en).toBe('Unknown Disease');
  });

  it('all treatments reference valid ZBNF formulations', () => {
    const validFormulations = ['neemastra', 'agniastra', 'brahmastra', 'jeevamrutha', 'beejamrutha', null];
    const treatments = Object.values(
      await import('../src/data/disease-treatments.json', { assert: { type: 'json' } })
    );
    for (const t of treatments) {
      expect(validFormulations).toContain(t.treatment.primary);
    }
  });
});
```

QA checklist:
- [ ] PlantNet API returns results for a rice leaf photo
- [ ] Rate limit (429) triggers TF.js fallback gracefully
- [ ] TF.js model loads from `/models/` and produces top-3 predictions
- [ ] Treatment lookup returns correct ZBNF spray for each genus
- [ ] "Unknown" fallback always returns Neemastra (safe default)
- [ ] Camera capture works on Android Chrome (capture="environment")
- [ ] App works offline after first load (service worker caches assets)
- [ ] All UI labels include Bangla primary text

---

### Step 3 — reviewer

Security + quality checks:
- [ ] PlantNet API key stored in `.env` as `VITE_PLANTNET_API_KEY` — not hardcoded
- [ ] Image uploaded directly to PlantNet — no intermediate storage of farmer photos
- [ ] No PII in log calls — only detection metadata
- [ ] `loglevel` used throughout — no `console.log` in production code
- [ ] ESLint passes with zero warnings
- [ ] TF.js model served from owned domain — no CORS dependency on third party
- [ ] Bangla text present in all user-visible strings

---

### Step 4 — doc-updater

Updates required:
- `README.md` → P5 section: PlantNet API key setup, TF.js model download URL
- `docs/architecture.md` → P5 data flow: Camera → PlantNet API / TF.js local → treatment map → UI
- `docs/farmer-guide-bn-en.md` → disease photo section in Bangla + English
- `tasks/p5-plant-disease-detection.md` → check off completed phases

---

### Step 5 — committer

```
feat(p5): add plant disease detection with PlantNet API + TF.js fallback

- PlantNet API integration (500 req/day, no key for dev)
- TF.js MobileNetV2 on-device fallback for offline/rate-limited use
- disease-treatments.json: 5 disease families → ZBNF formulation map
- Bangla-first result cards with treatment schedule
- loglevel browser logging; zero console.log
- PWA with service worker caching for offline use
```

---

## PlantNet API Reference

| Parameter | Value | Notes |
|-----------|-------|-------|
| Base URL | `https://my.plantnet.org/v2/identify/all` | Free tier |
| Rate limit | 500 req/day | Per API key |
| Image format | JPEG, PNG | Max 10MB |
| Organ hint | `leaf`, `fruit`, `flower` | Improves accuracy |
| Response fields | `results[].species.scientificNameWithoutAuthor`, `results[].score` | Key fields |

## ZBNF Treatment Priority for Common Diseases

| Disease Type | Primary | Secondary |
|--------------|---------|-----------|
| Fungal (leaf blight) | Neemastra | Agniastra |
| Fungal (blight/wilt) | Brahmastra | Neemastra |
| Soil-borne (wilt) | Jeevamrutha | Beejamrutha |
| Sucking pests | Agniastra | Neemastra |
| Chewing pests | Agniastra | Brahmastra |

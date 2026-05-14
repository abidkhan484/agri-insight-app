# P6 — ZBNF Knowledge PWA Codemap

**Last Updated:** 2025-05-22
**Entry Points:** `zbnf-knowledge/src/main.jsx`

## Architecture

```
Farmer ──▶ App.jsx (Router)
             │
      ┌──────┴───────┬─────────────┐
      ▼              ▼             ▼
Calculator.jsx  PestGallery.jsx  Calendar.jsx
      │              │             │
      ▼              ▼             ▼
zbnf-formulas.js  pests.json    crops.json
```

## Key Modules

| Module | Purpose | Exports | Dependencies |
|--------|---------|---------|--------------|
| `Calculator.jsx` | UI for formulation dosage calculation | `Calculator` | `zbnf-formulas.js`, React |
| `zbnf-formulas.js` | Business logic for ZBNF ratios | `calculateJeevamrutha`, etc. | `loglevel` |
| `PestGallery.jsx` | UI for browsing pests and treatments | `PestGallery` | `pests.json`, React |
| `Calendar.jsx` | UI for seasonal crop windows | `Calendar` | `crops.json`, React |

## Data Flow

1. **Calculators**: Farmer enters land area (decimal) in `Calculator.jsx` → `zbnf-formulas.js` computes precise ingredient quantities based on `skills/zbnf-formulation/SKILL.md` → Result displayed in Bangla.
2. **Pest Gallery**: Farmer searches/filters `pests.json` by crop or pest name → `PestGallery.jsx` renders card with symptoms and ZBNF treatment.
3. **Crop Calendar**: Farmer selects their Division (e.g., Dhaka, Rangpur) → `Calendar.jsx` filters `crops.json` to show recommended crops for the current/upcoming months.
4. **Offline**: `vite-plugin-pwa` ensures all JSON data and images are pre-cached, allowing 100% offline access.

## External Dependencies

- `react-router-dom` - Navigation within the PWA
- `vite-plugin-pwa` - Service Worker generation (Workbox)
- `loglevel` - Standardized logging
- `react` - UI library

## Related Areas

- [P3 — Farm Record Tracker](./p3-krishi-record.md) - Shares PWA setup.
- [P5 — Disease Detection](./p5-disease-detection.md) - Complements pest management.
- [Architecture](../architecture.md) - Overall system context.

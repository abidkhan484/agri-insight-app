# P5 — Plant Disease Detection Codemap

**Last Updated:** 2025-05-21
**Entry Points:** `disease-detect/src/main.jsx`

## Architecture

```
User Photo ──▶ DiseaseDetector.jsx
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    plantnet.js (Online)    tfjs-fallback.js (Offline)
         │                       │
         └───────────┬───────────┘
                     ▼
            lookup-treatment.js ──▶ disease-treatments.json
                     │
                     ▼
               Display Result
```

## Key Modules

| Module | Purpose | Exports | Dependencies |
|--------|---------|---------|--------------|
| `DiseaseDetector.jsx` | Main UI component for camera & display | `DiseaseDetector` | React, `identifyDisease`, `classifyDisease` |
| `plantnet.js` | Integration with PlantNet API | `identifyDisease` | `loglevel` |
| `tfjs-fallback.js` | On-device TF.js model inference | `classifyDisease`, `loadModel` | `@tensorflow/tfjs` |
| `lookup-treatment.js` | Map identified species to ZBNF treatment | `getTreatment` | `disease-treatments.json` |

## Data Flow

1. Farmer takes/uploads a photo via `DiseaseDetector`.
2. Component checks connectivity (or tries both).
3. `plantnet.js` sends image to PlantNet API and gets species identification.
4. `tfjs-fallback.js` runs a local MobileNetV2 model if offline or PlantNet fails.
5. `lookup-treatment.js` finds the corresponding Bangla disease name and ZBNF recipe from `disease-treatments.json`.
6. UI displays the result with confidence score and step-by-step treatment.

## External Dependencies

- `@tensorflow/tfjs` - On-device machine learning
- `vite-plugin-pwa` - PWA and offline support
- `loglevel` - Standardized logging
- `axios` - API requests

## Related Areas

- [P3 — Farm Record Tracker](./p3-krishi-record.md) - Shares PWA setup.
- [Architecture](../architecture.md) - Overall system context.

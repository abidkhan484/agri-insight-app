# P3 — Krishi Record Codemap

**Last Updated:** 2025-05-15
**Entry Point:** `krishi-record/src/main.jsx`
**Framework:** React 19 + Vite 8
**Storage:** IndexedDB (via Dexie.js)

## Architecture

```
User Browser (PWA)
      │
      ▼
React Components (UI)
      │
      ▼
Dexie.js (ORM/Wrapper)
      │
      ▼
IndexedDB (Local Persistent Storage)
```

## Key Modules

| Module | Purpose | Exports | Dependencies |
|--------|---------|---------|--------------|
| `src/db/index.js` | Database schema & initialization | `db` | `dexie` |
| `src/App.jsx` | Main layout & tab navigation | `App` | React, Components |
| `src/components/PlotManager.jsx` | Plot CRUD operations | `PlotManager` | `dexie-react-hooks` |
| `src/components/InputLogger.jsx` | ZBNF input logging & calculators | `InputLogger` | `zbnf-formulas.js` |
| `src/components/ObservationTracker.jsx` | Field observations (earthworms, etc) | `ObservationTracker` | `dexie-react-hooks` |
| `src/components/HarvestRecorder.jsx` | Yield & revenue tracking | `HarvestRecorder` | `dexie-react-hooks` |
| `src/components/Reports.jsx` | Charts, CSV & PDF exports | `Reports` | `chart.js`, `jspdf`, `papaparse` |
| `src/utils/zbnf-formulas.js` | ZBNF batch calculations | `calculateJeevamrutha` | None |
| `src/logger.js` | App-wide logging | `log` | `loglevel` |

## Data Flow

1. **User Input:** Farmer enters data in a React form (e.g., `InputLogger`).
2. **Validation:** Component validates input (area > 0, etc.).
3. **Database Write:** Component calls `db.inputs.add()` via Dexie.
4. **Reactive Update:** `useLiveQuery` in components detects change and re-renders UI.
5. **Report Generation:** `Reports.jsx` aggregates data from multiple tables to render Chart.js bars.

## External Dependencies

- **dexie** - IndexedDB wrapper
- **chart.js** & **react-chartjs-2** - Data visualization
- **jspdf** - PDF generation
- **papaparse** - CSV parsing/unparsing
- **loglevel** - Production-safe logging
- **vite-plugin-pwa** - Service worker & manifest generation

## Related Areas

- [P0 — Shared Foundation](../architecture.md) - Conceptual data model alignment.
- [ZBNF Formulations](../../skills/zbnf-formulation/SKILL.md) - Business logic source.

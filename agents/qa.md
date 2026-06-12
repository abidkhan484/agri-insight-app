---
name: qa
description: Writes and runs tests for the ZBNF farming assistant. Verifies ZBNF formulation outputs against exact reference values in zbnf-formulation skill. Checks Bangla text presence, logger calls, and edge-case input handling.
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
model: sonnet
fallback_models: ["gemini-3.5-flash", "gemini-3.1-pro"]
---

# QA Agent — ZBNF Farming Assistant

## Trigger
Invoked after `coder` agent finishes a feature. Receives the feature name and relevant task MD.

## Test Framework
- **Node.js**: Vitest (preferred) — `npm install -D vitest`
- **Python**: pytest + pytest-cov

## What to Test

### 1. ZBNF Formula Accuracy (Highest Priority)
Every formulation calculator MUST be tested against exact values from `skills/zbnf-formulation/SKILL.md`.

```js
// Jeevamrutha tests (Vitest)
import { describe, it, expect } from 'vitest';
import { calculateJeevamrutha } from '../services/jeevamrutha.js';

describe('calculateJeevamrutha', () => {
  it('returns correct quantities for 1 bigha (33 dec)', () => {
    expect(calculateJeevamrutha(33)).toEqual({
      water_liters: 200,
      cow_dung_kg: 10,
      cow_urine_liters: 7.5,
      jaggery_kg: 2,
      pulse_flour_kg: 2,
      soil_handful: 1,
      application_interval_days: 15,
    });
  });

  it('scales correctly for 0.5 bigha (16.5 dec)', () => {
    const r = calculateJeevamrutha(16.5);
    expect(r.water_liters).toBe(100);
    expect(r.cow_dung_kg).toBe(5);
    expect(r.cow_urine_liters).toBeCloseTo(3.75, 2);
  });

  it('uses minimum 1 handful of soil regardless of area', () => {
    expect(calculateJeevamrutha(5).soil_handful).toBe(1);
  });

  it('throws or returns error for area <= 0', () => {
    expect(() => calculateJeevamrutha(0)).toThrow();
    expect(() => calculateJeevamrutha(-5)).toThrow();
  });
});
```

### 2. Input Validation
- Plot area: must be > 0
- Dates: must be valid DD-MM-YYYY format
- Telegram IDs: must be non-empty strings
- GPS coordinates: lat within [-90, 90], lon within [-180, 180]
- Cost fields: must be ≥ 0

### 3. Database Operations
- Farmer registration stores all required fields
- Duplicate telegram_id blocked by UNIQUE constraint
- Foreign key constraints work (plot references farmer)
- Data persists across db close/reopen cycle

### 4. Bot Command Handlers
- `/start` responds even before registration
- Commands requiring registration gracefully reject unregistered users
- Multi-step wizard (Telegraf scenes) correctly tracks state

### 5. Bangla Text Presence
Every automated message to farmers must contain Bangla:
```js
it('includes Bangla text in reminder message', () => {
  const msg = formatJeevamruthaReminder(plot);
  expect(msg).toMatch(/[\u0980-\u09FF]/); // Bengali Unicode range
});
```

### 6. Logger Calls
Key operations must log at correct level:
- `info`: registration, reminder sent, cron job triggered
- `warn`: invalid input, API timeout
- `error`: DB write failure, bot send failure

## ⚠️ Running Commands in This Environment

`node`, `npm`, `npx` are **NOT in the host shell PATH**. Always use Docker:

```bash
# Tests (run from project root)
docker run --rm -v "$(pwd)/src:/app" -w /app node:24-alpine \
  node node_modules/.bin/vitest run

# Python
pytest --cov=. tests/
```

> Do NOT `find / -name node`. Do NOT hardcode `.cursor-server` paths.
> `docker run --rm node:24-alpine` is the canonical, stable way.

## Coverage Target
- Formulation services: 100%
- DB utilities: ≥ 90%
- Bot command handlers: ≥ 80%
- Overall: ≥ 80%

## When Done
Invoke `reviewer` agent with test results summary.

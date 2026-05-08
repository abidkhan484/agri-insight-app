---
name: p2-weather-irrigation-alert
description: Implement P2 Weather-Based Smart Irrigation Alert — integrates Open-Meteo free API (no key required), applies ZBNF Whapasa decision rules, sends daily 6 AM BDT Telegram alerts per plot GPS location, and backs up via GitHub Actions cron. Requires P0 + P1 complete.
triggers:
  - implement p2
  - weather alert
  - irrigation advisory
  - open-meteo integration
---

# P2 — Weather Irrigation Alert Implementation Workflow

## Dependency Check
**P0 and P1 must be complete before starting P2.**
Verify: plots exist in DB with GPS coordinates (lat/lon stored in Phase 1 step).

## Required Reading
- `tasks/p2-weather-irrigation-alert.md` — full phase checklist
- `skills/zbnf-formulation/SKILL.md` → Section 7 (Whapasa rules):
  - `precipNext48h > 5mm` → skip irrigation
  - `rainIn6h === true` → skip Neemastra spray
  - `tempMax > 38°C` → heat alert

---

## Agent Invocation Sequence

### Step 1 — coder

#### Phase 1: Open-Meteo API Integration
**No API key required.** Create `services/weather.js`:
```js
import logger from '../config/logger.js';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch 3-day forecast for a GPS coordinate.
 * Retries with exponential backoff (max 3 attempts).
 */
export async function fetchForecast(latitude, longitude, attempt = 1) {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set('daily', 'precipitation_sum,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('hourly', 'precipitation');
  url.searchParams.set('timezone', 'Asia/Dhaka');
  url.searchParams.set('forecast_days', '3');

  try {
    logger.debug('Fetching weather forecast', { latitude, longitude, attempt });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
    const data = await res.json();
    logger.info('Weather forecast fetched', { latitude, longitude });
    return parseForecast(data);
  } catch (err) {
    if (attempt < 3) {
      const delay = attempt * 2000;
      logger.warn('Weather fetch failed, retrying', { attempt, delay, error: err.message });
      await new Promise(r => setTimeout(r, delay));
      return fetchForecast(latitude, longitude, attempt + 1);
    }
    logger.error('Weather fetch failed after 3 attempts', { latitude, longitude, error: err.message });
    throw err;
  }
}

function parseForecast(data) {
  const precip = data.daily.precipitation_sum;
  const tempMax = data.daily.temperature_2m_max;
  const tempMin = data.daily.temperature_2m_min;
  const hourlyPrecip = data.hourly.precipitation.slice(0, 6); // next 6 hours

  return {
    today: { precip_mm: precip[0], temp_max: tempMax[0], temp_min: tempMin[0] },
    tomorrow: { precip_mm: precip[1], temp_max: tempMax[1], temp_min: tempMin[1] },
    next48h_precip_total: precip[0] + precip[1],
    rain_in_next_6h: hourlyPrecip.some(h => h > 0.5),
  };
}
```

#### Phase 2: Decision Logic (Exact ZBNF Whapasa Rules)
Import `getIrrigationAdvice` from `skills/zbnf-formulation/SKILL.md` or reimplement exactly:
```js
// services/irrigation-advisor.js
// Thresholds from ZBNF Whapasa principle — DO NOT CHANGE
export const PRECIP_SKIP_THRESHOLD_MM = 5;     // > 5mm in 48h → skip irrigation
export const HEAT_ALERT_TEMP_C = 38;           // > 38°C → heat alert
```

#### Phase 3: Daily Cron Job
Register at **00:00 UTC = 06:00 BDT**:
```js
registerJob('weather-irrigation-alert', '0 0 * * *', async () => {
  logger.info('Weather alert cron triggered');
  const plots = db.prepare(`
    SELECT p.*, f.telegram_id
    FROM plots p
    JOIN farmers f ON p.farmer_id = f.id
    WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
  `).all();

  // Deduplicate by GPS coordinate to avoid redundant API calls
  const coordGroups = groupBy(plots, p => `${p.latitude},${p.longitude}`);
  
  for (const [coord, coordPlots] of Object.entries(coordGroups)) {
    const [lat, lon] = coord.split(',').map(Number);
    try {
      const forecast = await fetchForecast(lat, lon);
      for (const plot of coordPlots) {
        const alerts = getIrrigationAdvice(forecast, null); // soil sensor optional
        for (const alert of alerts) {
          await bot.telegram.sendMessage(plot.telegram_id,
            `${alert.message_bn}\n${alert.message_en}`);
          logger.info('Weather alert sent', { plotId: plot.id, alertType: alert.type });
          // Write to weather_alerts table
        }
      }
    } catch (err) {
      logger.error('Weather alert failed for coordinate', { coord, error: err.message });
    }
  }
});
```

### Step 2 — qa
Test specifically:
```js
// Weather API parsing
it('parses Open-Meteo response correctly', () => {
  const mockResponse = { /* realistic mock */ };
  const result = parseForecast(mockResponse);
  expect(result.next48h_precip_total).toBe(result.today.precip_mm + result.tomorrow.precip_mm);
  expect(typeof result.rain_in_next_6h).toBe('boolean');
});

// Decision logic — exact thresholds
it('skips irrigation at exactly 5.1mm (> 5mm threshold)', () => {
  const alerts = getIrrigationAdvice({ precipNext48h: 5.1, rainIn6h: false, tempMax: 30 });
  expect(alerts.some(a => a.type === 'skip_irrigation')).toBe(true);
});
it('does NOT skip irrigation at exactly 5mm (not > 5mm)', () => {
  const alerts = getIrrigationAdvice({ precipNext48h: 5.0, rainIn6h: false, tempMax: 30 });
  expect(alerts.some(a => a.type === 'skip_irrigation')).toBe(false);
});
it('blocks spray when rain expected within 6h', () => {
  const alerts = getIrrigationAdvice({ precipNext48h: 0, rainIn6h: true, tempMax: 30 });
  expect(alerts.some(a => a.type === 'skip_spray')).toBe(true);
});
it('fires heat alert when tempMax > 38°C', () => {
  const alerts = getIrrigationAdvice({ precipNext48h: 0, rainIn6h: false, tempMax: 38.1 });
  expect(alerts.some(a => a.type === 'heat_alert')).toBe(true);
});

// Retry logic
it('retries up to 3 times on fetch failure', async () => { /* mock fetch failure */ });
```

### Step 3 — reviewer
Critical:
- Precipitation threshold is exactly **5mm** (>5 to skip), not 10mm or 3mm
- `rain_in_next_6h` checks the first 6 hourly precipitation values, not 12
- Heat alert at **38°C** (> 38, not ≥ 38)
- `weather_alerts` table written for every sent alert
- GPS coordinates validated: lat ∈ [-90, 90], lon ∈ [-180, 180]

### Step 4 — doc-updater
- `docs/api-reference.md` — add weather alert description
- `docs/architecture.md` — add weather service + Open-Meteo integration
- `docs/farmer-guide-bn-en.md` — explain what weather alerts farmers will receive
- `tasks/p2-weather-irrigation-alert.md` — mark completed phases

### Step 5 — committer
Scope: `feat(weather): add Open-Meteo integration and ZBNF Whapasa irrigation advisory`

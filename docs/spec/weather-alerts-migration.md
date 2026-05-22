# Spec: Migrate `weather-alerts.js` from SQLite to Supabase

> Status: **Pending** | Priority: **Critical** | Component: `src/scheduler/weather-alerts.js`

---

## Problem

`weather-alerts.js` still uses SQLite API methods (`db.prepare().all()`, `db.prepare().run()`) but the `db` import (`../db/connection.js`) now exports a Supabase client. This causes a **runtime crash** when the daily cron job fires at 00:00 UTC (06:00 BDT).

### Current Broken Code

```js
import db from '../db/connection.js'; // ← This is the Supabase client

// Line 16-25: SQLite query — crashes because .prepare() doesn't exist on Supabase client
const plots = db.prepare(`
  SELECT p.*, f.telegram_id
  FROM plots p
  JOIN farmers f ON p.farmer_id = f.id
  WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
`).all();

// Line 52-57: SQLite insert — same crash
db.prepare(`
  INSERT INTO weather_alerts (plot_id, alert_type, message, forecast_data)
  VALUES (?, ?, ?, ?)
`).run(plot.id, alert.type, message, JSON.stringify(forecast));
```

---

## Solution

Replace all SQLite calls with the existing `dbService` methods that already support these operations via Supabase.

### Available Methods (already implemented in `src/db/service.js`)

| Method | Line | Purpose |
|--------|------|---------|
| `dbService.getPlotsWithGPS()` | L262-270 | Fetches all plots with non-null lat/lng, joined with farmer `telegram_id` |
| `dbService.logWeatherAlert(plotId, alertType, message, forecastData)` | L272-283 | Inserts a weather alert record into Supabase |

### Target Implementation

```js
import { dbService } from '../db/service.js';
import logger from '../config/logger.js';
import { registerJob } from './index.js';
import { fetchForecast } from '../services/weather.js';
import { getIrrigationAdvice } from '../services/irrigation-advisor.js';
import { NotificationService } from '../services/notification.js';

export const initWeatherAlertEngine = (bot) => {
  registerJob('weather-irrigation-alert', '0 0 * * *', async () => {
    logger.info('Weather alert cron triggered');

    const plots = await dbService.getPlotsWithGPS();

    if (plots.length === 0) {
      logger.info('No plots with GPS coordinates found for weather alerts');
      return;
    }

    // Deduplicate by GPS coordinate to avoid redundant API calls
    const coordGroups = {};
    for (const plot of plots) {
      const key = `${plot.latitude},${plot.longitude}`;
      if (!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(plot);
    }

    for (const [coord, coordPlots] of Object.entries(coordGroups)) {
      const [lat, lon] = coord.split(',').map(Number);
      try {
        const forecast = await fetchForecast(lat, lon);
        for (const plot of coordPlots) {
          const alerts = getIrrigationAdvice(forecast, null);
          for (const alert of alerts) {
            const message = `${alert.message_bn}\n${alert.message_en}`;
            const telegramId = plot.farmers?.telegram_id;
            const sent = await NotificationService.send(bot, telegramId, message);

            if (sent) {
              logger.info('Weather alert sent', { plotId: plot.id, alertType: alert.type });
              await dbService.logWeatherAlert(plot.id, alert.type, message, forecast);
            }
          }
        }
      } catch (err) {
        logger.error('Weather alert failed for coordinate', { coord, error: err.message });
      }
    }
  });
};
```

### Key Differences from Current Code

| Aspect | Old (SQLite) | New (Supabase) |
|--------|-------------|----------------|
| Plot query | `db.prepare(SQL).all()` | `dbService.getPlotsWithGPS()` |
| Alert insert | `db.prepare(SQL).run(...)` | `dbService.logWeatherAlert(...)` |
| Telegram ID access | `plot.telegram_id` (flat join) | `plot.farmers?.telegram_id` (nested join from Supabase) |
| Import | `import db from '../db/connection.js'` | `import { dbService } from '../db/service.js'` |

---

## Acceptance Criteria

- [ ] `weather-alerts.js` imports `dbService` instead of `db`
- [ ] All SQLite `.prepare()` / `.all()` / `.run()` calls are removed
- [ ] Uses `dbService.getPlotsWithGPS()` for fetching plots
- [ ] Uses `dbService.logWeatherAlert()` for persisting alerts
- [ ] Handles the Supabase nested join structure (`plot.farmers.telegram_id`)
- [ ] Existing test `p2-weather-irrigation-alert.test.js` updated and passing
- [ ] Daily cron fires without crash (verify in Render logs)

---

## Estimated Effort

~30 minutes (mostly replacing existing calls with already-implemented service methods).

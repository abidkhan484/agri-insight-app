# P2 — Weather Alert Codemap

**Last Updated:** 2024-05-08
**Entry Points:** `src/scheduler/weather-alerts.js`, `src/scripts/run-weather-check.js`

## Architecture

```
┌───────────────────┐      ┌─────────────────────────┐      ┌──────────────────┐
│  node-cron /      │      │                         │      │                  │
│  GH Actions       ├─────►│  Weather Alert Engine   ├─────►│  Open-Meteo API  │
└───────────────────┘      │                         │      │                  │
                           └────────────┬────────────┘      └─────────┬────────┘
                                        │                             │
                                        ▼                             ▼
                           ┌─────────────────────────┐      ┌──────────────────┐
                           │                         │      │                  │
                           │  Irrigation Advisor     │◄─────┤  Weather Forecast│
                           │  (ZBNF Logic)           │      │  (Parsed)        │
                           └────────────┬────────────┘      └──────────────────┘
                                        │
                                        ▼
                           ┌─────────────────────────┐      ┌──────────────────┐
                           │                         │      │                  │
                           │  Notification Service   ├─────►│  Telegram Bot    │
                           │                         │      │                  │
                           └────────────┬────────────┘      └──────────────────┘
                                        │
                                        ▼
                           ┌─────────────────────────┐
                           │                         │
                           │  SQLite (weather_alerts)│
                           │                         │
                           └─────────────────────────┘
```

## Key Modules

| Module | Purpose | Exports | Dependencies |
|--------|---------|---------|--------------|
| `services/weather.js` | Fetch & parse weather data | `fetchForecast`, `parseForecast` | Open-Meteo API |
| `services/irrigation-advisor.js` | ZBNF Whapasa decision logic | `getIrrigationAdvice` | - |
| `scheduler/weather-alerts.js` | Daily cron job orchestration | `initWeatherAlertEngine` | `weather.js`, `irrigation-advisor.js`, `db`, `notification.js` |
| `scripts/run-weather-check.js` | Standalone CLI entry point | - | same as scheduler |

## Data Flow

1. **Trigger**: Cron job runs at 06:00 BDT or script is run manually.
2. **Fetch**: Query DB for all plots with `latitude` and `longitude`.
3. **Group**: Group plots by coordinates to minimize API calls.
4. **API Call**: Fetch 3-day forecast from Open-Meteo for each unique coordinate.
5. **Analyze**: Pass forecast data through `getIrrigationAdvice` logic.
6. **Notify**: Send generated Bangla/English alerts to farmers via Telegram.
7. **Log**: Record sent alerts in `weather_alerts` table for history.

## External Dependencies

- **Open-Meteo API** - Free weather forecast (no API key required)
- **Telegraf** - Telegram bot communication

## Related Areas

- [P1 — Farm Scheduler](./p1-scheduler.md) - Provides plot GPS coordinates.
- [Shared Foundation](../architecture.md) - Database and notification infrastructure.

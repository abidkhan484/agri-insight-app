# Spec: Implement `/weather` Manual Telegram Command

> Status: **Pending** | Priority: **Medium** | Component: `src/bot/commands/weather.js` (new file)

---

## Context

Currently weather alerts are only sent **automatically** via the daily cron job at 06:00 BDT. The `/weather` command is listed in `docs/api-reference.md` as "Upcoming" but has no implementation.

Farmers should be able to check weather and irrigation advice on demand, not just wait for the daily push.

---

## Specification

### Command Syntax

```
/weather              — weather for all plots with GPS
/weather <plot_name>  — weather for a specific plot
```

### Flow

1. Farmer sends `/weather` or `/weather <plot_name>`
2. Bot verifies farmer is registered (`dbService.getFarmerByTelegramId`)
3. Bot fetches farmer's plots with GPS coordinates
4. If `<plot_name>` is provided, filter to that plot only
5. For each plot with GPS:
   a. Fetch 3-day forecast via `fetchForecast(lat, lon)` (existing service)
   b. Run `getIrrigationAdvice(forecast)` (existing service)
   c. Format Bangla + English response
6. Reply with combined weather report

### Response Format

```
🌤️ আবহাওয়া পূর্বাভাস / Weather Forecast

📍 বাড়ির পাশের জমি (North Field)
আজ: 🌡️ ৩২°C / ২৫°C | 🌧️ ৫ মিমি বৃষ্টি
আগামীকাল: 🌡️ ৩০°C / ২৪°C | 🌧️ ১২ মিমি বৃষ্টি

💧 পরামর্শ / Advice:
🌧️ সেচ দেবেন না — আগামী ৪৮ ঘণ্টায় বৃষ্টির পূর্বাভাস আছে
Skip irrigation — rain expected in next 48h
```

### Edge Cases

| Case | Response |
|------|----------|
| Farmer not registered | `❌ আপনি নিবন্ধিত নন। /start ব্যবহার করুন।` |
| No plots | `জমি নেই। /register দিয়ে জমি যোগ করুন।` |
| No plots with GPS | `কোনো জমিতে GPS অবস্থান নেই। GPS সহ জমি যোগ করুন।` |
| Plot name not found | `"<name>" নামে কোনো জমি নেই।` |
| API failure | `দুঃখিত, আবহাওয়া তথ্য সংগ্রহ করতে সমস্যা হয়েছে।` |

### Dependencies

All dependencies already exist:
- `src/services/weather.js` — `fetchForecast()`
- `src/services/irrigation-advisor.js` — `getIrrigationAdvice()`
- `src/db/service.js` — `getPlotsByFarmerIdFromTelegram()`

### File to Create

`src/bot/commands/weather.js` — new command file, register in `bot/index.js`.

---

## Acceptance Criteria

- [ ] `/weather` returns weather for all farmer plots with GPS
- [ ] `/weather <plot_name>` returns weather for a specific plot
- [ ] Response includes Bangla-first text with English subtitle
- [ ] Uses existing `fetchForecast` and `getIrrigationAdvice` services
- [ ] Registered in `bot/index.js` via `registerWeatherCommand(bot)`
- [ ] Logger present with farmer context
- [ ] Error handling for all edge cases
- [ ] Added to `docs/api-reference.md` (remove "Upcoming" label)

---

## Estimated Effort

~1 hour (new file, mostly wiring existing services).

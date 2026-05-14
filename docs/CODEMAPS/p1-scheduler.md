# P1 — Farm Scheduler Codemap

**Last Updated:** 2024-05-08
**Entry Points:** `src/bot/index.js`, `src/scheduler/reminders.js`

## Architecture

```
Farmer --(Telegram)--> Bot Command Handler
                          |
      +-------------------+-------------------+
      |                   |                   |
/register (Scene)   /myplots /myreminders   /remind
      |                   |                   |
      +--------> SQLite (better-sqlite3) <----+
                          ^
                          |
                  Daily Cron Job (6 AM)
                          |
                  Reminder Engine
                          |
            +-------------+-------------+
            |                           |
    Jeevamrutha Calc             Notification Service
    (services/jeevamrutha.js)    (services/notification.js)
```

## Key Modules

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `src/bot/scenes/register.js` | Multi-step plot registration | `registerWizard` |
| `src/bot/commands/plots.js` | Plot management commands | `/myplots`, `/deleteplot` |
| `src/bot/commands/reminders.js` | Reminder management | `/myreminders`, `/cancelreminder`, `/remind` |
| `src/services/jeevamrutha.js` | ZBNF formulas & formatting | `calculateJeevamrutha`, `formatJeevamruthaMessage` |
| `src/scheduler/reminders.js` | Daily reminder check logic | `initReminderEngine` |
| `src/services/notification.js` | Abstraction for sending messages | `NotificationService.send` |

## Data Flow

1. **Registration**: User `/register` -> `WizardScene` collects data -> Saves to `plots` table -> Automatically creates 4 default entries in `reminders` table.
2. **Scheduled Reminders**: `node-cron` triggers at 00:00 UTC -> Queries `reminders` due today -> Calculates batch quantities -> Sends Telegram message -> Logs to `reminder_logs` -> Updates `next_due` for next interval.
3. **Custom Reminders**: User `/remind` -> Saves to `reminders` table with `type='custom'` -> Processed by same scheduled loop.

## External Dependencies

- `telegraf` - Telegram Bot API
- `better-sqlite3` - Database
- `node-cron` - Scheduling

## Related Areas

- [Architecture](../architecture.md)
- [Farmer Guide](../farmer-guide-bn-en.md)

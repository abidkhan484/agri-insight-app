---
name: p1-farm-scheduler-bot
description: Implement P1 Farm Scheduler Bot — Telegraf wizard for plot registration, Jeevamrutha/Neemastra/Mulch reminder engine with exact ZBNF batch calculators, reminder logging, and custom farmer reminders. Requires P0 complete.
triggers:
  - implement p1
  - farm scheduler
  - plot registration
  - jeevamrutha reminder
  - farm bot reminders
---

# P1 — Farm Scheduler Bot Implementation Workflow

## Dependency Check
**P0 must be complete before starting P1.**
Verify: bot responds to `/start`, SQLite DB exists, `npm run lint` passes.

## Required Reading
- `tasks/p1-farm-scheduler-bot.md` — full checklist for all 5 phases
- `skills/zbnf-formulation/SKILL.md` — **mandatory** before Phase 2
  - Use `calculateJeevamrutha()` from the canonical formula there
  - Reminder intervals: Jeevamrutha=15d, Neemastra=14d, Mulch=7d

---

## Agent Invocation Sequence

### Step 1 — coder

#### Phase 1: Plot Registration (Telegraf Wizard)
Implement `/register` as a Telegraf `Scenes.WizardScene` with 4 steps:
1. Collect plot name
2. Collect area — accept bigha or decimal with converter (1 bigha = 33 decimal)
3. Collect primary crop
4. Collect planting date (DD-MM-YYYY format, validate strictly)

Logging requirements:
```js
logger.info('Plot registration started', { telegramId: ctx.from.id });
logger.info('Plot registered successfully', { farmerId, plotName, areaDecimal, crop });
logger.warn('Plot registration failed — invalid date', { input: dateStr });
```

#### Phase 2: Jeevamrutha Reminder Engine
**Import the formula from your services/jeevamrutha.js — implement it exactly from `skills/zbnf-formulation/SKILL.md`.**

Cron job using `registerJob` from `scheduler/index.js`:
```js
// Runs daily at 6 AM BDT (00:00 UTC)
registerJob('jeevamrutha-check', '0 0 * * *', async () => {
  logger.info('Jeevamrutha check triggered');
  const duePlots = db.prepare(`
    SELECT r.*, p.area_decimal, p.name AS plot_name, f.telegram_id
    FROM reminders r
    JOIN plots p ON r.plot_id = p.id
    JOIN farmers f ON p.farmer_id = f.id
    WHERE r.type = 'jeevamrutha' AND r.next_due <= date('now') AND r.active = 1
  `).all();
  
  for (const plot of duePlots) {
    const batch = calculateJeevamrutha(plot.area_decimal);
    const msg = formatJeevamruthaMessage(plot.plot_name, batch);
    await bot.telegram.sendMessage(plot.telegram_id, msg);
    logger.info('Jeevamrutha reminder sent', { plotId: plot.plot_id, plotName: plot.plot_name });
    // Update next_due and log to reminder_logs
  }
});
```

Message format (Bangla first):
```js
export function formatJeevamruthaMessage(plotName, batch) {
  return `🌱 জীবামৃত প্রয়োগের সময় হয়েছে — ${plotName}
Jeevamrutha application due — ${plotName}

📦 ব্যাচের পরিমাণ (${batch.unit_description}):
• জল: ${batch.water_liters} লিটার
• গোবর: ${batch.cow_dung_kg} কেজি
• গোমূত্র: ${batch.cow_urine_liters} লিটার
• গুড়: ${batch.jaggery_kg} কেজি
• ডালের আটা: ${batch.pulse_flour_kg} কেজি
• মাটি: ${batch.soil_handful} মুঠো

⏰ পরবর্তী প্রয়োগ ১৫ দিন পরে
Next application in 15 days`;
}
```

#### Phase 3: All 4 Default Reminders Auto-Created on Registration
```js
// Auto-create when new plot is registered
const defaultReminders = [
  { type: 'jeevamrutha', interval_days: 15 },
  { type: 'neemastra',   interval_days: 14 },
  { type: 'mulch',       interval_days: 7  },
  { type: 'irrigation',  interval_days: null }, // weather-triggered, not interval
];
```

#### Phase 5: Optional SMS Fallback
Implement as a `NotificationService` abstraction:
```js
// services/notification.js
export async function sendNotification(farmer, message) {
  if (farmer.telegram_id) {
    logger.debug('Sending via Telegram', { farmerId: farmer.id });
    return await bot.telegram.sendMessage(farmer.telegram_id, message);
  }
  logger.warn('No Telegram ID — SMS fallback not yet implemented', { farmerId: farmer.id });
  // Future: SMS via BD telco API
}
```

### Step 2 — qa
Test specifically:
```js
// ZBNF formula correctness (highest priority):
describe('calculateJeevamrutha', () => {
  it('1 bigha = 33 decimal', () => {
    expect(calculateJeevamrutha(33).water_liters).toBe(200);
    expect(calculateJeevamrutha(33).cow_dung_kg).toBe(10);
    expect(calculateJeevamrutha(33).cow_urine_liters).toBe(7.5);
    expect(calculateJeevamrutha(33).application_interval_days).toBe(15);
  });
  it('rejects area <= 0', () => expect(() => calculateJeevamrutha(0)).toThrow());
});

// Reminder auto-creation
it('registers 4 default reminders on plot creation', () => {
  registerPlot(farmer, plotData);
  const reminders = db.prepare('SELECT type FROM reminders WHERE plot_id = ?').all(plotId);
  expect(reminders.map(r => r.type)).toContain('jeevamrutha');
  expect(reminders.map(r => r.type)).toContain('neemastra');
  expect(reminders.map(r => r.type)).toContain('mulch');
});

// Bangla message content
it('reminder message includes Bengali characters', () => {
  const msg = formatJeevamruthaMessage('Test Plot', calculateJeevamrutha(33));
  expect(msg).toMatch(/[\u0980-\u09FF]/);
});
```

### Step 3 — reviewer
Critical checks for P1:
- Jeevamrutha interval must be exactly **15 days** — not 14, not 16
- Neemastra interval must be exactly **14 days**
- Mulch interval must be exactly **7 days**
- All bot messages have Bangla first
- `reminder_logs` table is written on every sent reminder
- Bot verifies farmer registration before `/myplots`, `/myreminders`, `/deleteplot`

### Step 4 — doc-updater
Update:
- `docs/api-reference.md` — add `/register`, `/myplots`, `/deleteplot`, `/remind`, `/myreminders`, `/cancelreminder`
- `docs/farmer-guide-bn-en.md` — add plot registration guide in Bangla
- `docs/architecture.md` — add reminder engine diagram
- `tasks/p1-farm-scheduler-bot.md` — mark completed phases with `[x]`

### Step 5 — committer
Scope: `feat(bot): implement plot registration wizard and ZBNF reminder engine`

---

## Full Acceptance Criteria
All items from `tasks/p1-farm-scheduler-bot.md` plus:
- [ ] `calculateJeevamrutha(33)` returns `{ water_liters: 200, cow_dung_kg: 10, cow_urine_liters: 7.5 }`
- [ ] All 4 default reminders created on plot registration
- [ ] `reminder_logs` table populated on every sent reminder
- [ ] `npm run lint` still passes zero warnings after P1 code
- [ ] Every bot message to farmers contains Bengali Unicode

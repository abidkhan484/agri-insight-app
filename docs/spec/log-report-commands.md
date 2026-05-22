# Spec: Implement `/log` and `/report` Telegram Commands

> Status: **Pending** | Priority: **Medium** | Component: `src/bot/commands/log.js`, `src/bot/commands/report.js` (new files)

---

## Context

Farm record tracking currently exists only in the Krishi Record PWA (`client/src/modules/krishi-record/`). The `/log` and `/report` commands are listed in `docs/api-reference.md` as "Upcoming". These commands would let farmers log activities and view summaries directly in Telegram without opening the PWA.

---

## `/log` Command

### Purpose

Quick in-chat logging of farm activities (input applications, observations, harvests).

### Syntax Options

```
/log input <plot> <type> <qty> <unit>
/log observation <plot> <title>
/log harvest <plot> <crop> <qty> <unit> [revenue]
```

### Examples

```
/log input উত্তরের-মাঠ জীবামৃত 200 লিটার
/log observation উত্তরের-মাঠ কেঁচো দেখা গেছে
/log harvest উত্তরের-মাঠ ধান 500 কেজি 15000
```

### Alternative: Wizard-Based Approach

If inline parsing is too complex for Bangla text, use a Telegraf `WizardScene`:

1. `/log` → "কী ধরনের কার্যক্রম? / What type of activity?" (buttons: উপকরণ | পর্যবেক্ষণ | ফসল সংগ্রহ)
2. Select type → "কোন জমিতে? / Which plot?" (list farmer's plots as buttons)
3. Depending on type:
   - Input: Ask type, quantity, unit, cost
   - Observation: Ask title, description
   - Harvest: Ask crop, quantity, revenue
4. Confirm and save

### Data Flow

```
Telegram /log → Bot (Telegraf) → dbService → Supabase
                                             ↕ (Sync)
                                     PWA (Dexie) → SyncManager → Supabase
```

Records created via `/log` will appear in the PWA after the next sync cycle, and vice versa.

### Database Tables (Already Exist)

- `input_logs` — for input applications
- `observations` — for field observations
- `harvests` — for harvest records

All three tables already have `plot_id`, `date`, sync metadata (`updated_at`, `is_deleted`), and RLS policies.

---

## `/report` Command

### Purpose

View a summary of farm activities for a plot or time period.

### Syntax

```
/report                    — summary for all plots (current month)
/report <plot_name>        — summary for a specific plot
/report <plot_name> <month> — summary for a specific month (e.g., "মে" or "May")
```

### Response Format

```
📊 ফার্ম রিপোর্ট / Farm Report — উত্তরের মাঠ
📅 মে ২০২৬

📥 উপকরণ / Inputs: ৩ বার
  - জীবামৃত: ২০০ লিটার (২ বার)
  - নীমাস্ত্র: ৫০ লিটার (১ বার)
  💰 মোট খরচ: ৫০০ টাকা

👁️ পর্যবেক্ষণ / Observations: ২ টি
  - কেঁচো দেখা গেছে (১৫ মে)
  - পোকা কম (২০ মে)

🌾 ফসল / Harvests: ১ বার
  - ধান: ৫০০ কেজি | রাজস্ব: ১৫,০০০ টাকা

📈 মোট রাজস্ব: ১৫,০০০ টাকা
```

### Implementation Notes

- Aggregation queries via Supabase `.select()` with date filters
- New `dbService` methods needed:
  - `getInputLogsByPlotAndMonth(plotId, year, month)`
  - `getObservationsByPlotAndMonth(plotId, year, month)`
  - `getHarvestsByPlotAndMonth(plotId, year, month)`
- Consider Bangla number formatting for display

---

## Acceptance Criteria

### `/log`
- [ ] Supports input, observation, and harvest logging
- [ ] Wizard-based or inline parsing (TBD)
- [ ] Records saved to correct Supabase tables
- [ ] Bangla-first confirmation messages
- [ ] Data syncs to PWA via existing SyncManager
- [ ] Logger calls present

### `/report`
- [ ] Default: current month, all plots
- [ ] Optional: specific plot, specific month
- [ ] Shows aggregated inputs, observations, harvests
- [ ] Revenue summary
- [ ] Handles zero-data case gracefully
- [ ] Bangla-first formatting

### Both
- [ ] Registered in `bot/index.js`
- [ ] New `dbService` methods added if needed
- [ ] Tests written for core logic
- [ ] `docs/api-reference.md` updated (remove "Upcoming" label)

---

## Estimated Effort

- `/log` command: ~3 hours (wizard scene + 3 activity types + validation)
- `/report` command: ~2 hours (aggregation queries + formatting)
- Total: ~5 hours

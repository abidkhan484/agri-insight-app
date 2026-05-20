# API Reference — ZBNF Farming Assistant Bot

All commands are sent directly in Telegram chat with the bot (`@YourBotName`).
Commands marked 🔐 require farmer registration (`/register` must be completed first).

---

## Registration & Onboarding

### `/start`
**Bangla:** বটের সাথে পরিচয় করুন এবং শুরু করুন
**English:** Introduce yourself to the bot and get started

**Parameters:** none

**Response:**
```
স্বাগতম! ZBNF কৃষি সহকারীতে আপনাকে স্বাগত।
Welcome to the ZBNF Farming Assistant.

/register দিয়ে শুরু করুন।
Start with /register.
```

---

### `/register`
**Bangla:** কৃষক হিসেবে নিবন্ধন করুন
**English:** Register as a farmer

**Parameters:** none (starts a multi-step wizard)

**Wizard steps:**
1. আপনার নাম / Your name
2. জেলা / District
3. উপজেলা / Upazila
4. GPS অবস্থান (ঐচ্ছিক) / GPS location (optional)

**Response on completion:**
```
✅ নিবন্ধন সম্পন্ন হয়েছে!
Registration complete!

এখন /addplot দিয়ে জমি যোগ করুন।
Now add your plot with /addplot.
```

---

## Plot Management

### `/addplot` 🔐
**Bangla:** নতুন জমি যোগ করুন
**English:** Add a new plot

**Parameters:** none (starts wizard)

**Wizard steps:**
1. জমির নাম / Plot name (e.g., "বাড়ির পাশের জমি")
2. আয়তন / Area — accepts bigha or decimal (1 bigha = 33 decimal)
3. প্রধান ফসল / Primary crop
4. রোপণের তারিখ / Planting date (DD-MM-YYYY)
5. GPS অবস্থান (ঐচ্ছিক) / GPS location (optional, for weather alerts)

**Response on completion:**
```
✅ জমি যোগ করা হয়েছে: [Plot Name]
Plot added: [Plot Name]

আয়তন / Area: 33 ডেসিমেল (1 বিঘা)
ফসল / Crop: ধান
রোপণ / Planted: 01-06-2026

জীবামৃত রিমাইন্ডার সেট করা হয়েছে।
Jeevamrutha reminder has been set.
```

---

### `/plots` 🔐
**Bangla:** আপনার সমস্ত জমির তালিকা
**English:** List all your plots

**Parameters:** none

**Response:**
```
📋 আপনার জমিসমূহ / Your Plots:

1. বাড়ির পাশের জমি — 33 ডে. — ধান
2. পুকুরপাড়ের জমি — 16.5 ডে. — মরিচ
```

---

## Logging & Records

### `/log` 🔐 (Upcoming)
**Bangla:** কৃষি কার্যক্রম লিপিবদ্ধ করুন
**English:** Log a farm activity

**Parameters:** inline or wizard

---

### `/report` 🔐 (Upcoming)
**Bangla:** ফার্মের প্রতিবেদন দেখুন
**English:** View farm report

---

## Reminders

### `/reminders` 🔐
**Bangla:** আসন্ন রিমাইন্ডার দেখুন
**English:** View upcoming reminders

**Parameters:** none

**Response:**
```
📅 আসন্ন রিমাইন্ডার / Upcoming Reminders:

🌱 জীবামৃত — বাড়ির পাশের জমি — ১৫ মে ২০২৬
💧 নিমাস্ত্র — পুকুরপাড়ের জমি — ১৮ মে ২০২৬
🌿 আচ্ছাদন — বাড়ির পাশের জমি — ১২ মে ২০২৬
```

---

## Weather

### `/weather` 🔐 (Upcoming Command)
> **Note:** Weather alerts are currently sent **automatically** every day at 6:00 AM BDT. The manual command is planned for a future update.

**Bangla:** আবহাওয়া ও সেচ পরামর্শ দেখুন
**English:** View weather forecast and irrigation advice

**Usage:**
- `/weather` — weather for all plots with GPS
- `/weather [plot_name]` — specific plot

---

## Disease Detection (Upcoming)

### `/disease` 🔐
**Bangla:** ফসলের ছবি পাঠিয়ে রোগ শনাক্ত করুন
**English:** Send a crop photo to identify disease

---

## AI Assistant (Upcoming)

### `/ask` 🔐
**Bangla:** AI সহকারীকে যেকোনো ZBNF প্রশ্ন করুন
**English:** Ask our AI assistant any ZBNF question

---

## IoT / Soil Monitoring (Upcoming)

### `/soilstatus` 🔐
**Bangla:** আপনার জমির মাটির সর্বশেষ তথ্য দেখুন
**English:** View latest soil sensor readings for your plots

## Community

### `/joinmap` 🔐
**Bangla:** ZBNF কৃষক মানচিত্রে যোগ দিন এবং দেখুন
**English:** Join and view the ZBNF farmer map

**Response:**
```
🗺️ আপনি ZBNF কৃষক মানচিত্রে যোগ দিয়েছেন!
You have joined the ZBNF farmer map!

[🗺️ মানচিত্র দেখুন (View Map)] - Opens Farmer Map TMA
```

---

## Help

### `/help`
**Bangla:** সমস্ত কমান্ডের তালিকা দেখুন
**English:** Show all available commands

**Parameters:** none

**Response:** Full list of all commands with brief Bangla descriptions.

---

## Automatic Alerts (No Command Needed)

These messages are sent automatically by the bot on schedule:

| Alert | Schedule | Trigger |
|-------|----------|---------|
| জীবামৃত রিমাইন্ডার | Every 15 days | Plot planting date |
| নিমাস্ত্র রিমাইন্ডার | Every 14 days | Plot planting date |
| আচ্ছাদন রিমাইন্ডার | Every 7 days | Plot planting date |
| আবহাওয়া পরামর্শ | Daily 6:00 AM BDT | Whapasa decision rules |
| মাটির সতর্কতা | On threshold breach | ESP32 reading (P4 only, upcoming) |

---

## Error Messages

| Error | Bangla Message | English Message |
|-------|---------------|-----------------|
| Not registered | আপনি নিবন্ধিত নন | You are not registered |
| No plots | কোনো জমি নেই | No plots found |
| Invalid date | তারিখ সঠিক নয় (DD-MM-YYYY) | Invalid date format |
| Area ≤ 0 | জমির আয়তন ০-এর বেশি হতে হবে | Plot area must be > 0 |
| Outside Bangladesh | বাংলাদেশের বাইরে অবস্থান গ্রহণযোগ্য নয় | Location outside Bangladesh bounds |

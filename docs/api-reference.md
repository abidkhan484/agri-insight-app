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

### `/log` 🔐
**Bangla:** কৃষি কার্যক্রম লিপিবদ্ধ করুন
**English:** Log a farm activity

**Parameters:** inline or wizard

**Usage:** `/log` (launches wizard)
- Select plot
- Select type: jeevamrutha | beejamrutha | neemastra | agniastra | brahmastra | mulch | other
- Enter quantity (if applicable)
- Enter cost in BDT (optional)

---

### `/report` 🔐
**Bangla:** ফার্মের প্রতিবেদন দেখুন
**English:** View farm report

**Parameters:** optional `[period]` — `week` | `month` | `season` (default: `month`)

**Usage:**
- `/report` — current month summary
- `/report week` — last 7 days
- `/report season` — current growing season

**Response:**
```
📊 মে ২০২৬ প্রতিবেদন / May 2026 Report

🌱 জীবামৃত প্রয়োগ: ২ বার
💊 নিমাস্ত্র স্প্রে: ১ বার
🌾 শস্য সংগ্রহ: ৮০ কেজি ধান
💰 আয়: ৩,২০০ টাকা | খরচ: ৮৫০ টাকা
```

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

### `/weather` 🔐
**Bangla:** আবহাওয়া ও সেচ পরামর্শ দেখুন
**English:** View weather forecast and irrigation advice

**Parameters:** optional `[plot_name]` — defaults to first plot

**Usage:**
- `/weather` — weather for all plots with GPS
- `/weather বাড়ির পাশের জমি` — specific plot

**Response:**
```
🌤️ আবহাওয়া পূর্বাভাস — বাড়ির পাশের জমি
Weather Forecast — North Plot

আজ / Today: ৩১°C | বৃষ্টি: ০ মিমি
আগামীকাল / Tomorrow: ২৯°C | বৃষ্টি: ৮ মিমি

✅ সেচ বন্ধ রাখুন — আগামীকাল বৃষ্টির সম্ভাবনা (৮ মিমি)
Hold off irrigation — rain expected tomorrow (8mm)
```

---

## Disease Detection

### `/disease` 🔐
**Bangla:** ফসলের ছবি পাঠিয়ে রোগ শনাক্ত করুন
**English:** Send a crop photo to identify disease

**Parameters:** send a photo after this command (or as caption)

**Usage:**
1. Send `/disease` → bot prompts for photo
2. Or: Send a photo with caption `/disease`

**Response:**
```
🔬 রোগ শনাক্ত / Disease Identified:
অলটারনারিয়া পাতার দাগ / Alternaria Leaf Blight
আত্মবিশ্বাস / Confidence: 78%

উপসর্গ: পাতায় বৃত্তাকার বাদামি দাগ
Symptoms: Circular brown spots on leaves

চিকিৎসা / Treatment:
নিমাস্ত্র ৭ দিন অন্তর ৩ বার স্প্রে করুন
Spray Neemastra 3 times at 7-day intervals
```

---

## AI Assistant

### `/ask` 🔐
**Bangla:** AI সহকারীকে যেকোনো ZBNF প্রশ্ন করুন
**English:** Ask our AI assistant any ZBNF question

**Parameters:** `[question]` — minimum 3 characters, maximum 500 characters

**Usage:**
- `/ask জীবামৃত কীভাবে তৈরি করব?`
- `/ask How do I treat late blight on potato?`
- `/ask ধানের শীষকাটা পোকার চিকিৎসা কী?`

**Response time:** Up to 90 seconds (local AI model)

**Response:**
```
🌾 AI উত্তর / AI Answer

জীবামৃত তৈরিতে প্রয়োজন:
• ২০০ লিটার জল
• ১০ কেজি দেশি গরুর গোবর
• ৭.৫ লিটার গোমূত্র
• ২ কেজি গুড়
• ২ কেজি ডালের আটা
• ১ মুঠো মাটি

৪৮ ঘণ্টা রেখে দিন, তারপর ব্যবহার করুন।
Rest for 48 hours before applying.
```

---

## IoT / Soil Monitoring

### `/soilstatus` 🔐
**Bangla:** আপনার জমির মাটির সর্বশেষ তথ্য দেখুন
**English:** View latest soil sensor readings for your plots

**Parameters:** none

**Response:**
```
🟢 বাড়ির পাশের জমি
আর্দ্রতা / Moisture: 55.2%
তাপমাত্রা / Temp: 29.8°C
আপেক্ষিক আর্দ্রতা / Humidity: 72.1%

🟡 পুকুরপাড়ের জমি
আর্দ্রতা / Moisture: 35.1% — শুকিয়ে আসছে
তাপমাত্রা / Temp: 31.2°C
```

**Moisture level indicators:**
- 🟢 40–70% — ওয়াপাসা (ideal)
- 🟡 30–40% or 70–80% — warning
- 🔴 < 30% or > 80% — critical

### `/setthreshold` 🔐
**Bangla:** মাটির সতর্কতার সীমা পরিবর্তন করুন
**English:** Customize soil alert thresholds (advanced)

**Parameters:** `[plot_name] [dry_%] [wet_%]`

**Usage:** `/setthreshold "বাড়ির জমি" 28 82`
> Note: ZBNF Whapasa defaults (30/80) are strongly recommended. Only change with expert guidance.

---

## Community

### `/map` 🔐
**Bangla:** ZBNF কৃষক মানচিত্র দেখুন এবং যোগ দিন
**English:** View and join the ZBNF farmer map

**Parameters:** none (shows map link + join option)

### `/joinmap` 🔐
**Bangla:** আপনার অবস্থান মানচিত্রে যোগ করুন
**English:** Add your district to the public farmer map

**Parameters:** none (uses district from /register)

**Privacy:** Only district-level location is shown. No personal data is made public.

### `/faq` 🔐
**Bangla:** সাধারণ প্রশ্নের উত্তর খুঁজুন
**English:** Search frequently asked questions

**Parameters:** `[search query]`

**Usage:**
- `/faq জীবামৃত`
- `/faq neemastra spray time`

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
| মাটির সতর্কতা | On threshold breach | ESP32 reading (P4 only) |

---

## Error Messages

| Error | Bangla Message | English Message |
|-------|---------------|-----------------|
| Not registered | আপনি নিবন্ধিত নন | You are not registered |
| No plots | কোনো জমি নেই | No plots found |
| Invalid date | তারিখ সঠিক নয় (DD-MM-YYYY) | Invalid date format |
| Area ≤ 0 | জমির আয়তন ০-এর বেশি হতে হবে | Plot area must be > 0 |
| AI unavailable | AI সহকারী এই মুহূর্তে উপলব্ধ নয় | AI assistant temporarily unavailable |
| Outside Bangladesh | বাংলাদেশের বাইরে অবস্থান গ্রহণযোগ্য নয় | Location outside Bangladesh bounds |

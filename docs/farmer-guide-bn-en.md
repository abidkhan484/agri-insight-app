# ZBNF কৃষি সহকারী — কৃষক গাইড
# ZBNF Farming Assistant — Farmer Guide

> **ভাষা নির্দেশিকা:** এই গাইডে বাংলা (প্রাথমিক) ও ইংরেজি (মাধ্যমিক) উভয় ভাষায় তথ্য দেওয়া হয়েছে।
> **Language note:** This guide is written in Bangla (primary) and English (secondary).

---

## ১. শুরু করার পদ্ধতি / Getting Started

### ধাপ ১: বট খুঁজুন / Step 1: Find the Bot

**বাংলা:**
Telegram অ্যাপ খুলুন। সার্চ বারে আপনার বটের নাম লিখুন (উদাহরণ: `@ZBNFKrishiBot`)।
বটটিতে ক্লিক করুন এবং **START** বোতামে ক্লিক করুন।

**English:**
Open the Telegram app. Search for your bot (e.g. `@ZBNFKrishiBot`).
Tap the bot and press the **START** button.

---

### ধাপ ২: নিবন্ধন / Step 2: Register

**বাংলা:**
`/register` লিখুন এবং পাঠান। বট আপনাকে একধাপ একধাপ করে প্রশ্ন করবে:

1. **নাম** — আপনার নাম বা ডাকনাম লিখুন
2. **জেলা** — আপনার জেলার নাম লিখুন (যেমন: ময়মনসিংহ)
3. **উপজেলা** — আপনার উপজেলার নাম লিখুন

**English:**
Type `/register` and send. The bot will ask you step by step:

1. **Name** — Enter your name or nickname
2. **District** — Enter your district name (e.g. Mymensingh)
3. **Upazila** — Enter your upazila name

---

### ধাপ ৩: জমি যোগ করুন / Step 3: Add Your Plot

**বাংলা:**
নিবন্ধনের পর `/addplot` লিখুন। বট জিজ্ঞেস করবে:

1. **জমির নাম** — যেকোনো নাম দিন (যেমন: "বাড়ির পাশের জমি", "পুকুরপাড়")
2. **আয়তন** — ডেসিমেল বা বিঘায় দিন।
   - উদাহরণ: `33` (ডেসিমেল) বা `1 bigha` বা `1 বিঘা`
   - ১ বিঘা = ৩৩ ডেসিমেল
3. **ফসল** — কী ফসল আবাদ করছেন (ধান, মরিচ, টমেটো...)
4. **রোপণের তারিখ** — DD-MM-YYYY ফরম্যাটে (যেমন: 01-06-2026)

**English:**
After registration, type `/addplot`. The bot will ask:

1. **Plot name** — Any name you like (e.g. "North Field", "Pond Side")
2. **Area** — In decimals or bigha.
   - Example: `33` (decimals) or `1 bigha`
   - 1 bigha = 33 decimals
3. **Crop** — What crop you are growing (rice, chili, tomato...)
4. **Planting date** — DD-MM-YYYY format (e.g. 01-06-2026)

> ✅ **বাংলা:** জমি যোগ হলে বট স্বয়ংক্রিয়ভাবে জীবামৃত, নিমাস্ত্র ও আচ্ছাদনের রিমাইন্ডার সেট করে দেবে।
> ✅ **English:** Once added, the bot will automatically set reminders for Jeevamrutha, Neemastra, and Mulch.

---

## ২. স্বয়ংক্রিয় রিমাইন্ডার / Automatic Reminders

**বাংলা:**
আপনাকে আলাদাভাবে কিছু করতে হবে না। বট নির্দিষ্ট সময়ে সকাল ৬টায় আপনাকে মেসেজ পাঠাবে:

| মেসেজ | কবে আসে |
|-------|---------|
| 🌱 জীবামৃত প্রয়োগের সময় | প্রতি ১৫ দিনে একবার |
| 💊 নিমাস্ত্র স্প্রে করুন | প্রতি ১৪ দিনে একবার |
| 🌿 আচ্ছাদন দিন | প্রতি ৭ দিনে একবার |
| ☁️ আবহাওয়া পরামর্শ | প্রতিদিন সকালে |

**English:**
You don't need to do anything extra. The bot will send messages each morning at 6 AM:

| Message | When |
|---------|------|
| 🌱 Time to apply Jeevamrutha | Every 15 days |
| 💊 Spray Neemastra | Every 14 days |
| 🌿 Add mulch | Every 7 days |
| ☁️ Weather irrigation advice | Every morning |

### রিমাইন্ডার মেসেজের উদাহরণ / Example Reminder Message

```
🌱 জীবামৃত প্রয়োগের সময় হয়েছে — বাড়ির পাশের জমি
Jeevamrutha application due — North Plot

📦 ব্যাচের পরিমাণ (২০০ লিটার):
• জল / Water: ২০০ লিটার
• গোবর / Cow dung: ১০ কেজি
• গোমূত্র / Cow urine: ৭.৫ লিটার
• গুড় / Jaggery: ২ কেজি
• ডালের আটা / Pulse flour: ২ কেজি
• মাটি / Soil: ১ মুঠো

⚠️ শুধুমাত্র দেশি গরুর গোবর ও গোমূত্র ব্যবহার করুন।
Use only desi (native) cow — not Jersey or HF breed.
```

---

## ৩. কৃষি কার্যক্রম লিপিবদ্ধ করুন / Log Farm Activities

**বাংলা:**
`/log` লিখুন। বট আপনাকে জিজ্ঞেস করবে কোন জমিতে, কী করলেন, কত পরিমাণ এবং খরচ কত।

**English:**
Type `/log`. The bot will ask which plot, what activity, how much, and the cost.

**লগ করার ধরনসমূহ / Log types:**
- `jeevamrutha` — জীবামৃত প্রয়োগ / Jeevamrutha application
- `neemastra` — নিমাস্ত্র স্প্রে / Neemastra spray
- `agniastra` — অগ্নিআস্ত্র স্প্রে / Agniastra spray
- `brahmastra` — ব্রহ্মাস্ত্র স্প্রে / Brahmastra spray
- `mulch` — আচ্ছাদন / Mulch application
- `beejamrutha` — বীজামৃত প্রয়োগ / Beejamrutha treatment
- `other` — অন্যান্য / Other

---

## ৪. মাসিক প্রতিবেদন / Monthly Report

**বাংলা:**
`/report` লিখুন। আপনার চলতি মাসের কৃষি কার্যক্রম ও আয়-ব্যয়ের সারাংশ পাবেন।

**English:**
Type `/report`. You will get a summary of this month's activities and income/expenses.

**অন্যান্য বিকল্প / Other options:**
- `/report week` — গত ৭ দিন / Last 7 days
- `/report season` — এই মৌসুম / Current season

---

## ৫. আবহাওয়া পরামর্শ / Weather Advice

**বাংলা:**
প্রতিদিন সকাল ৬টায় বট আবহাওয়া দেখে সেচের পরামর্শ দেবে:
- আগামী ৪৮ ঘণ্টায় ৫ মিমি-র বেশি বৃষ্টির সম্ভাবনা থাকলে → সেচ বন্ধ রাখার পরামর্শ
- বৃষ্টির সম্ভাবনা না থাকলে এবং মাটি শুকনো → সেচ দেওয়ার পরামর্শ

এছাড়াও `/weather` লিখে যেকোনো সময় জানতে পারবেন।

**English:**
Every morning at 6 AM the bot checks the weather and gives irrigation advice:
- If > 5mm rain expected in 48 hours → advice to skip irrigation
- If no rain expected and soil is dry → advice to irrigate

You can also type `/weather` anytime to check.

---

## ৬. ফসলের রোগ শনাক্ত করুন / Identify Crop Disease

### পদ্ধতি ১: Telegram বটে ছবি পাঠান / Method 1: Send Photo in Bot

**বাংলা:**
1. আক্রান্ত পাতা বা ফসলের স্পষ্ট ছবি তুলুন
2. Telegram-এ ছবিটি পাঠান, ক্যাপশনে লিখুন: `/disease`
3. বট রোগ শনাক্ত করে চিকিৎসা বলে দেবে

**English:**
1. Take a clear photo of the affected leaf or crop
2. Send the photo in Telegram with caption: `/disease`
3. The bot will identify the disease and recommend ZBNF treatment

### পদ্ধতি ২: ওয়েব অ্যাপ / Method 2: Web App

**বাংলা:**
`https://zbnf-bangladesh.netlify.app/disease` খুলুন।
"ছবি তুলুন বা গ্যালারি থেকে বেছে নিন" বোতামে ক্লিক করুন।
ইন্টারনেট ছাড়াও কাজ করে (অফলাইন মোড)।

**English:**
Open `https://zbnf-bangladesh.netlify.app/disease`.
Tap "Take photo or choose from gallery".
Works without internet (offline mode).

---

## ৭. AI সহকারীকে প্রশ্ন করুন / Ask the AI Assistant

**বাংলা:**
`/ask` লিখুন এবং তারপর আপনার প্রশ্ন লিখুন। AI জ্ঞানভান্ডার থেকে ZBNF পদ্ধতির উত্তর দেবে।

উদাহরণ:
- `/ask জীবামৃত কীভাবে তৈরি করব?`
- `/ask আলুর ধসা রোগের চিকিৎসা কী?`
- `/ask নিমাস্ত্র কখন স্প্রে করতে হয়?`

উত্তর পেতে ৩০-৯০ সেকেন্ড সময় লাগতে পারে।

**English:**
Type `/ask` followed by your question. The AI will answer from the ZBNF knowledge base.

Examples:
- `/ask How do I make Jeevamrutha?`
- `/ask What is the treatment for late blight on potato?`
- `/ask When should I spray Neemastra?`

Allow 30–90 seconds for a response.

---

## ৮. সার ও কীটনাশক ক্যালকুলেটর / Formulation Calculator

**বাংলা:**
`https://zbnf-bangladesh.netlify.app/calculator` খুলুন।
আপনার জমির আয়তন (ডেসিমেলে) লিখুন।
বট ৬টি ZBNF সার/কীটনাশকের সঠিক পরিমাণ হিসাব করে দেবে।

**English:**
Open `https://zbnf-bangladesh.netlify.app/calculator`.
Enter your plot area in decimals.
The app calculates exact quantities for all 6 ZBNF formulations.

### ৬টি ক্যালকুলেটর / 6 Calculators:

| কী | Bangla | English |
|----|-------|---------|
| জীবামৃত | মাটির অণুজীব সক্রিয় করে | Soil microbe activator |
| বীজামৃত | বীজ শোধন করে | Seed treatment |
| নিমাস্ত্র | পোকা দমন করে | Pest repellent |
| অগ্নিআস্ত্র | ব্যাপক পোকার আক্রমণে | Severe pest attack |
| ব্রহ্মাস্ত্র | সব ধরনের পোকা এবং রোগে | All pests and diseases |
| আচ্ছাদন (মালচ) | মাটির আর্দ্রতা ধরে রাখে | Soil moisture retention |

---

## ৯. মাটির আর্দ্রতা পর্যবেক্ষণ / Soil Moisture Monitoring (P4)

> **দ্রষ্টব্য:** এই ফিচার শুধুমাত্র ESP32 সেন্সর ইনস্টল করা জমির জন্য প্রযোজ্য।
> **Note:** This feature only applies to plots with ESP32 sensors installed.

**বাংলা:**
`/soilstatus` লিখলে আপনার জমির সর্বশেষ মাটির তথ্য দেখাবে।

মাটির ওয়াপাসা স্তর (ZBNF অনুযায়ী):

| আর্দ্রতা | স্তর | পদক্ষেপ |
|---------|-----|---------|
| > ৮০% | 🔴 জলাবদ্ধতা | নিষ্কাশনের ব্যবস্থা করুন |
| ৭০–৮০% | 🟡 অতিরিক্ত ভেজা | সেচ বন্ধ রাখুন |
| ৪০–৭০% | 🟢 ওয়াপাসা (আদর্শ) | কোনো পদক্ষেপ নেই |
| ৩০–৪০% | 🟡 শুকিয়ে আসছে | ২৪ ঘণ্টার মধ্যে সেচ দিন |
| < ৩০% | 🔴 অত্যন্ত শুষ্ক | এখনই সেচ দিন |

**English:**
Type `/soilstatus` to see your plot's latest soil data.

Whapasa moisture levels (per ZBNF standard):

| Moisture | Level | Action |
|----------|-------|--------|
| > 80% | 🔴 Waterlogged | Arrange drainage |
| 70–80% | 🟡 Overly wet | Stop irrigation |
| 40–70% | 🟢 Whapasa (ideal) | No action needed |
| 30–40% | 🟡 Drying out | Irrigate within 24 hours |
| < 30% | 🔴 Critically dry | Irrigate immediately |

---

## ১০. কৃষক মানচিত্র / Farmer Map

**বাংলা:**
`/joinmap` লিখলে আপনার জেলার তথ্য সর্বজনীন মানচিত্রে যোগ হবে।
মানচিত্র দেখুন: `https://zbnf-bangladesh.netlify.app/map`

গোপনীয়তা: শুধু জেলার নাম দেখানো হয়, ব্যক্তিগত তথ্য নয়।

**English:**
Type `/joinmap` to add your district to the public farmer map.
View the map: `https://zbnf-bangladesh.netlify.app/map`

Privacy: Only district name is shown — no personal details.

---

## ১১. সাধারণ প্রশ্নোত্তর / FAQ

**বাংলা:** `/faq [বিষয়]` লিখে জানতে পারবেন।
**English:** Type `/faq [topic]` to search frequently asked questions.

উদাহরণ / Examples:
- `/faq জীবামৃত`
- `/faq নিমাস্ত্র কতক্ষণ ভেজাতে হয়`
- `/faq beejamrutha`

---

## ১২. সব কমান্ডের তালিকা / All Commands

| কমান্ড | বাংলা | English |
|--------|-------|---------|
| `/start` | শুরু করুন | Get started |
| `/register` | নিবন্ধন করুন | Register as farmer |
| `/addplot` | জমি যোগ করুন | Add a plot |
| `/plots` | জমির তালিকা | List your plots |
| `/log` | কার্যক্রম লিখুন | Log an activity |
| `/report` | প্রতিবেদন দেখুন | View monthly report |
| `/reminders` | রিমাইন্ডার দেখুন | View upcoming reminders |
| `/weather` | আবহাওয়া পরামর্শ | Weather + irrigation advice |
| `/disease` | রোগ শনাক্ত করুন | Identify crop disease |
| `/ask` | AI-কে প্রশ্ন করুন | Ask AI assistant |
| `/soilstatus` | মাটির তথ্য | Soil sensor readings |
| `/joinmap` | মানচিত্রে যোগ দিন | Join farmer map |
| `/faq` | সাধারণ প্রশ্ন | Search FAQ |
| `/help` | সাহায্য | Show all commands |

---

## ১৩. সমস্যা হলে কী করবেন / Troubleshooting

| সমস্যা | সমাধান |
|-------|-------|
| বট সাড়া দিচ্ছে না | কিছুক্ষণ অপেক্ষা করুন; ইন্টারনেট সংযোগ পরীক্ষা করুন |
| "নিবন্ধিত নন" বার্তা | `/register` দিয়ে আগে নিবন্ধন করুন |
| AI উত্তর দিতে দেরি হচ্ছে | ৯০ সেকেন্ড পর্যন্ত অপেক্ষা করুন |
| রোগ সঠিক শনাক্ত হচ্ছে না | আক্রান্ত অংশের কাছ থেকে স্পষ্ট আলোতে ছবি তুলুন |
| ক্যালকুলেটর কাজ করছে না | পেজ রিফ্রেশ করুন; Chrome বা Firefox ব্যবহার করুন |

| Problem | Solution |
|---------|----------|
| Bot not responding | Wait a moment; check internet connection |
| "Not registered" message | Complete `/register` first |
| AI taking long to respond | Allow up to 90 seconds |
| Disease not identified correctly | Take a clearer photo in good light, close to the affected area |
| Calculator not working | Refresh the page; use Chrome or Firefox |

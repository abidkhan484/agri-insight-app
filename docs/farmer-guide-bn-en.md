# ZBNF কৃষি সহকারী — কৃষক গাইড
# ZBNF Farming Assistant — Farmer Guide

> **ভাষা নির্দেশিকা:** এই গাইডে বাংলা (প্রাথমিক) ও ইংরেজি (মাধ্যমিক) উভয় ভাষায় তথ্য দেওয়া হয়েছে।
> **Language note:** This guide is written in Bangla (primary) and English (secondary).

---

## ১. শুরু করার পদ্ধতি / Getting Started

### ধাপ ১: বট খুঁজুন / Step 1: Find the Bot

**বাংলা:**
Telegram অ্যাপ খুলুন। সার্চ বারে আপনার বটের নাম লিখুন (যেমন: `@ZBNFKrishiBot`)।
বটটিতে ক্লিক করুন এবং **START** বোতামে ক্লিক করুন। এতে আপনি নিবন্ধিত হয়ে যাবেন।

**English:**
Open the Telegram app. Search for your bot (e.g. `@ZBNFKrishiBot`).
Tap the bot and press the **START** button. This will register you.

---

## ২. জমি যোগ করুন / Add Your Plot

**বাংলা:**
জমি যোগ করতে `/register` লিখুন এবং পাঠান। বট আপনাকে একধাপ একধাপ করে প্রশ্ন করবে:

1. **জমির নাম** — যেকোনো নাম দিন (যেমন: "বাড়ির পাশের জমি")
2. **আয়তন** — ডেসিমেল বা বিঘায় দিন (যেমন: `33`)
3. **ফসল** — কী ফসল আবাদ করছেন (ধান, মরিচ, টমেটো...)
4. **রোপণের তারিখ** — দিন-মাস-বছর ফরম্যাটে (যেমন: ১২-০৫-২০২৪)

**English:**
To add a plot, type `/register` and send. The bot will ask you step by step for name, area, crop, and planting date.

---

## ৩. AI সহকারী (প্রশ্ন-উত্তর) / AI Assistant (Q&A)

**বাংলা:**
আপনার চাষাবাদ বা ZBNF পদ্ধতি নিয়ে যেকোনো প্রশ্ন সরাসরি বটের কাছে করতে পারেন। এটি বাংলা এবং ইংরেজি উভয় ভাষাই বোঝে।

**কিভাবে ব্যবহার করবেন:**
- টাইপ করুন: `/ask [আপনার প্রশ্ন]`
- উদাহরণ: `/ask জীবামৃত তৈরির সঠিক নিয়ম কী?`
- উদাহরণ: `/ask ধানের পোকা দমনে কী করব?`

বট আপনাকে ZBNF নলেজ বেস থেকে সঠিক উত্তর খুঁজে দেবে এবং কোন তথ্য থেকে এই উত্তর দেওয়া হয়েছে তা জানিয়ে দেবে।

**English:**
You can ask any questions about farming or ZBNF methods directly to the bot. It understands both Bangla and English.

**How to use:**
- Type: `/ask [Your Question]`
- Example: `/ask How to make Jeevamrutha?`
- Example: `/ask What to do for rice pests?`

The bot will find the correct answer from the ZBNF knowledge base and cite the sources.

---

## ৪. কমিউনিটি নেটওয়ার্ক ও FAQ / Community Network & FAQ

**বাংলা:**
অন্যান্য ZBNF কৃষকদের সাথে যুক্ত হতে এবং দ্রুত তথ্য পেতে নিচের কমান্ডগুলো ব্যবহার করুন:

- **FAQ (সাধারণ প্রশ্ন)**: দ্রুত ZBNF রেসিপি জানতে লিখুন `/faq [কিওয়ার্ড]`। উদাহরণ: `/faq জীবামৃত`
- **কৃষক ম্যাপ**: আপনার এলাকা বা পাশের এলাকার ZBNF কৃষকদের দেখতে এবং নিজের অবস্থান যোগ করতে লিখুন `/joinmap`
- **পোকা মাকড় সতর্কবার্তা**: আপনার এলাকায় পোকা মাকড়ের আক্রমণ দেখা দিলে অন্য কৃষকদের সতর্ক করতে `/reportpest` ব্যবহার করুন।

**English:**
Use these commands to connect with other ZBNF farmers and get quick information:

- **FAQ**: For quick ZBNF recipes, type `/faq [keyword]`. Example: `/faq jeevamrutha`
- **Farmer Map**: To see ZBNF farmers in your area and add your location, type `/joinmap`
- **Pest Alerts**: If you see a pest outbreak, use `/reportpest` to alert other farmers in your area.

---

## ৫. স্বয়ংক্রিয় রিমাইন্ডার / Automatic Reminders

**বাংলা:**
বট নির্দিষ্ট সময়ে প্রতিদিন সকালে আপনাকে মেসেজ পাঠাবে:

| মেসেজ | কবে আসে |
|-------|---------|
| 🌱 জীবামৃত প্রয়োগ | প্রতি ১৫ দিনে |
| 🛡️ নিমাস্ত্র স্প্রে | প্রতি ১৪ দিনে |
| 🍂 আচ্ছাদন পরীক্ষা | প্রতি ৭ দিনে |
| ☀️ আবহাওয়া পরামর্শ | প্রতিদিন সকাল ৬:০০ টা |

**English:**
The bot sends reminders for Jeevamrutha (15 days), Neemastra (14 days), Mulch (7 days), and daily Weather advice.

### ৫.১ ম্যানুয়াল আবহাওয়া তথ্য / Manual Weather Info

**বাংলা:**
আপনার যেকোনো জমির জন্য ম্যানুয়ালি আবহাওয়া ও সেচের পরামর্শ জানতে `/weather` কমান্ড ব্যবহার করুন।
- সব জমির জন্য: `/weather`
- নির্দিষ্ট জমির জন্য: `/weather [জমির নাম]` (যেমন: `/weather উত্তরের মাঠ`)

**English:**
To check weather and irrigation advice for your plots on demand:
- For all plots: `/weather`
- For a specific plot: `/weather [Plot Name]` (e.g. `/weather North Field`)

---

## ৬. কৃষি রেকর্ড অ্যাপ (অফলাইন) / Krishi Record App (Offline)

**বাংলা:**
চাষাবাদের খরচ, ফলন এবং মাটির স্বাস্থ্যের হিসাব রাখতে আমাদের 'কৃষি রেকর্ড' অ্যাপ ব্যবহার করুন।

**অতিথি মোড (Guest Mode):**
আপনি যদি টেলিগ্রাম দিয়ে লগইন করতে না চান, তবে আপনি **'অতিথি হিসেবে চালিয়ে যান' (Continue as Guest)** বিকল্পটি বেছে নিতে পারেন। 
- অতিথি মোডে আপনি অফলাইনে সব তথ্য সংরক্ষণ করতে পারবেন।
- **সতর্কতা:** অতিথি মোডে আপনার তথ্য মেঘে (Cloud) সিঙ্ক হবে না। অর্থাৎ, আপনি ফোন পরিবর্তন করলে বা অ্যাপ ডেটা মুছে ফেললে আপনার তথ্য হারিয়ে যাবে।
- আপনি চাইলে পরে ড্যাশবোর্ড থেকে **'লগইন করুন' (Sign In)** বোতামে ক্লিক করে টেলিগ্রামের সাথে যুক্ত হতে পারেন।

**English:**
Use the 'Krishi Record' app to track expenses, yields, and soil health offline.

**Guest Mode:**
If you don't want to sign in with Telegram, you can choose **'Continue as Guest'**.
- In Guest Mode, all data is saved locally on your phone.
- **Warning:** Data will NOT be synced to the cloud. You will lose your data if you switch phones or clear app cache.
- You can always sign in later via the **'Sign In'** button on the Dashboard.

---

## ৭. রোগ শনাক্তকরণ / Plant Disease Detection

**বাংলা:**
আক্রান্ত পাতার ছবি তুলে রোগের নাম এবং ZBNF প্রতিকার জানতে আমাদের 'Disease Detector' অ্যাপ ব্যবহার করুন অথবা সরাসরি টেলিগ্রাম বটে `/disease` কমান্ডটি ব্যবহার করুন।

**কিভাবে বটের মাধ্যমে ব্যবহার করবেন:**
1. টাইপ করুন: `/disease`
2. বট ছবি পাঠাতে বলবে। আপনার ফোনের ক্যামেরা দিয়ে আক্রান্ত পাতার একটি পরিষ্কার ছবি তুলে পাঠান।
3. বট ছবি বিশ্লেষণ করে রোগের নাম, আত্মবিশ্বাসের হার এবং ZBNF প্রতিকার বাংলা ও ইংরেজিতে জানিয়ে দেবে।

**English:**
Take a photo of an infected leaf to identify the disease and get ZBNF treatment. You can use the 'Disease Detector' PWA or use the `/disease` command directly in the Telegram bot.

**How to use via Bot:**
1. Type: `/disease`
2. Send a clear photo of the infected leaf when prompted.
3. The bot will analyze and reply with the disease name, confidence score, and ZBNF treatments.

---

## ৮. ZBNF জ্ঞানভান্ডার ও ক্যালকুলেটর / ZBNF Knowledge Base

**বাংলা:**
সঠিক পরিমাণে ZBNF উপকরণ তৈরির জন্য 'ZBNF জ্ঞানভান্ডার' ক্যালকুলেটর ব্যবহার করুন। এটি ১০০% অফলাইনে কাজ করে।

**English:**
Use the 'ZBNF Knowledge Base' for offline dosage calculators and pest management info.

---

## ৯. সব কমান্ডের তালিকা / All Commands

| কমান্ড | কাজ | Task |
|--------|-------|---------|
| `/start` | শুরু করুন | Start |
| `/register` | জমি নিবন্ধিত করুন | Register plot |
| `/ask` | প্রশ্ন করুন | Ask AI |
| `/faq` | সাধারণ তথ্য | FAQ |
| `/joinmap` | কৃষক ম্যাপে যোগ দিন | Join Map |
| `/reportpest` | পোকা মাকড় রিপোর্ট | Report Pest |
| `/myplots` | জমির তালিকা | List plots |
| `/myreminders` | রিমাইন্ডার তালিকা | List reminders |
| `/soilstatus` | মাটির অবস্থা | Check soil |
| `/weather` | আবহাওয়া পূর্বাভাস | Weather forecast |
| `/log` | কার্যক্রম লিপিবদ্ধ করুন | Log activity |
| `/report` | ফার্ম রিপোর্ট দেখুন | View report |
| `/disease` | ফসলের রোগ শনাক্তকরণ | Identify crop disease |
| `/help` | সাহায্য | Help |

---

## ১০. ইন-চ্যাট ফার্ম লগ এবং রিপোর্ট / Farm Logging & Reports

**বাংলা:**
অ্যাপে না গিয়ে সরাসরি চ্যাটের মাধ্যমে আপনার চাষাবাদের হিসাব (উপকরণ প্রয়োগ, পর্যবেক্ষণ, ফসল সংগ্রহ) রাখতে এবং রিপোর্ট দেখতে পারেন।

### ১০.১ কার্যক্রম লিপিবদ্ধ করুন (Log Activity):
টাইপ করুন `/log` এবং বট আপনাকে সাহায্য করবে। আপনি ৩ ধরণের কার্যক্রম লিপিবদ্ধ করতে পারেন:
১. **উপকরণ প্রয়োগ**: প্রয়োগ করা উপকরণের নাম, পরিমাণ, একক এবং খরচ।
২. **পর্যবেক্ষণ**: জমিতে আপনার কোনো পর্যবেক্ষণ বা মন্তব্য।
৩. **ফসল সংগ্রহ**: ফসল সংগ্রহের পরিমাণ, একক এবং বিক্রয় মূল্য/রাজস্ব।

### ১০.২ ফার্ম রিপোর্ট দেখুন (View Reports):
আপনার জমিতে কী কী কাজ হয়েছে তা দেখতে `/report` ব্যবহার করুন:
- চলতি মাসের সব জমির জন্য: `/report`
- নির্দিষ্ট জমির জন্য: `/report [জমির নাম]`
- নির্দিষ্ট জমির নির্দিষ্ট মাসের জন্য: `/report [জমির নাম] [মাস]` (যেমন: `/report উত্তরের মাঠ মে` বা `/report North Field May`)

**English:**
Log activities and view monthly summaries directly in Telegram without opening the PWA.

### Log Activities:
Type `/log` and follow the bot wizard. You can log:
1. **Inputs**: Input type, quantity, unit, and cost.
2. **Observations**: Crop/field observation title and description.
3. **Harvests**: Crop type, quantity, unit, and revenue.

### View Reports:
Use `/report` to get a structured summary of your activities:
- All plots for current month: `/report`
- Specific plot: `/report [Plot Name]`
- Specific plot and month: `/report [Plot Name] [Month]` (e.g., `/report North Field May` or `/report উত্তরের মাঠ মে`)

---

## ১১. সমস্যা হলে কী করবেন / Troubleshooting

বট সাড়া না দিলে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন। জমি যোগ করতে সমস্যা হলে `/register` আবার চেষ্টা করুন। মাটির তথ্য না দেখালে আপনার IoT ডিভাইসটি সচল কি না চেক করুন।

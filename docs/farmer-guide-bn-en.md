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

### ধাপ ২: জমি যোগ করুন / Step 2: Add Your Plot

**বাংলা:**
জমি যোগ করতে `/register` লিখুন এবং পাঠান। বট আপনাকে একধাপ একধাপ করে প্রশ্ন করবে:

1. **জমির নাম** — যেকোনো নাম দিন (যেমন: "বাড়ির পাশের জমি", "পুকুরপাড়")
2. **আয়তন** — ডেসিমেল বা বিঘায় দিন।
   - উদাহরণ: `33` (ডেসিমেল) বা `1 bigha` বা `1 বিঘা`
   - ১ বিঘা = ৩৩ ডেসিমেল
3. **ফসল** — কী ফসল আবাদ করছেন (ধান, মরিচ, টমেটো...)
4. **রোপণের তারিখ** — দিন-মাস-বছর ফরম্যাটে (যেমন: ১২-০৫-২০২৪)

**English:**
To add a plot, type `/register` and send. The bot will ask you step by step:

1. **Plot name** — Any name you like (e.g. "North Field", "Pond Side")
2. **Area** — In decimals or bigha.
   - Example: `33` (decimals) or `1 bigha`
   - 1 bigha = 33 decimals
3. **Crop** — What crop you are growing (rice, chili, tomato...)
4. **Planting date** — DD-MM-YYYY format (e.g. 12-05-2024)

> ✅ **বাংলা:** জমি যোগ হলে বট স্বয়ংক্রিয়ভাবে জীবামৃত, নিমাস্ত্র, আচ্ছাদন এবং সেচের রিমাইন্ডার সেট করে দেবে।
> ✅ **English:** Once added, the bot will automatically set reminders for Jeevamrutha, Neemastra, Mulch, and Irrigation.

---

## ২. স্বয়ংক্রিয় রিমাইন্ডার ও আবহাওয়া পরামর্শ / Automatic Reminders & Weather Advice

**বাংলা:**
আপনাকে আলাদাভাবে কিছু করতে হবে না। বট নির্দিষ্ট সময়ে প্রতিদিন সকালে আপনাকে মেসেজ পাঠাবে:

| মেসেজ | কবে আসে |
|-------|---------|
| 🌱 জীবামৃত প্রয়োগের সময় | প্রতি ১৫ দিনে একবার |
| 🛡️ নিমাস্ত্র স্প্রে করুন | প্রতি ১৪ দিনে একবার |
| 🍂 আচ্ছাদন পরীক্ষা | প্রতি ৭ দিনে একবার |
| ☀️ আবহাওয়া ও সেচ পরামর্শ | প্রতিদিন সকাল ৬:০০ টা (যদি GPS লোকেশন থাকে) |
| 🌡️ মাটির আর্দ্রতা সর্তকতা | যখন মাটি শুকিয়ে যায় (যদি IoT সেন্সর থাকে) |

**English:**
You don't need to do anything extra. The bot will send messages each morning when due:

| Message | When |
|---------|------|
| 🌱 Time to apply Jeevamrutha | Every 15 days |
| 🛡️ Spray Neemastra | Every 14 days |
| 🍂 Check mulch | Every 7 days |
| ☀️ Weather & Irrigation Advice | Daily at 6:00 AM BDT (if GPS is provided) |
| 🌡️ Soil Moisture Alerts | When soil gets dry (if IoT sensor is installed) |

---

## ৩. রিমাইন্ডার ও জমি ব্যবস্থাপনা / Managing Reminders & Plots

**বাংলা:**
আপনি নিচের কমান্ডগুলো ব্যবহার করে আপনার জমি ও রিমাইন্ডার দেখতে বা পরিবর্তন করতে পারেন:

- `/myplots` — আপনার নিবন্ধিত জমিগুলোর তালিকা দেখুন।
- `/deleteplot [জমির নাম]` — কোনো জমি মুছে ফেলুন।
- `/myreminders` — আপনার সক্রিয় রিমাইন্ডারগুলো দেখুন।
- `/cancelreminder [আইডি]` — কোনো নির্দিষ্ট রিমাইন্ডার বন্ধ করুন।
- `/remind` — নিজের জন্য আলাদা রিমাইন্ডার সেট করুন।
- `/soilstatus` — মাটির বর্তমান আর্দ্রতা ও তাপমাত্রা দেখুন (IoT সেন্সর থাকলে)।

**English:**
You can use the following commands to manage your plots and reminders:

- `/myplots` — List all your registered plots.
- `/deleteplot [Plot Name]` — Remove a plot.
- `/myreminders` — List all your active reminders.
- `/cancelreminder [ID]` — Deactivate a specific reminder.
- `/remind` — Set custom reminders for yourself.
- `/soilstatus` — Check current soil moisture and temperature (if IoT sensor is installed).

---

## ৪. কৃষি রেকর্ড অ্যাপ (অফলাইন) / Krishi Record App (Offline)

**বাংলা:**
আপনার চাষাবাদের খরচ, ফলন এবং মাটির স্বাস্থ্যের হিসাব রাখতে আমাদের 'কৃষি রেকর্ড' অ্যাপ ব্যবহার করুন। এটি ইন্টারনেট ছাড়াও কাজ করে।

**কিভাবে ব্যবহার করবেন:**
1. আপনার ফোনে অ্যাপটি ইনস্টল করুন (বট থেকে প্রাপ্ত লিঙ্ক ব্যবহার করে)।
2. **জমি (Plots):** প্রথমে আপনার জমির তথ্য যোগ করুন।
3. **উপকরণ (Inputs):** যখনই জীবামৃত বা অন্য সার দেবেন, খরচসহ এখানে লিখে রাখুন।
4. **পর্যবেক্ষণ (Observations):** কেঁচোর সংখ্যা বা পোকামাকড় দেখলে লিখে রাখুন।
5. **ফসল (Harvests):** ফসল কাটার পর কতটুকু ফলন হলো এবং কত টাকা বিক্রি হলো তা লিখুন।
6. **রিপোর্ট (Reports):** মাস শেষে লাভ-ক্ষতির হিসাব এবং চার্ট দেখুন।

**English:**
Use our 'Krishi Record' app to track your farming expenses, yields, and soil health. It works offline too.

**How to use:**
1. Install the app on your phone (using the link provided by the bot).
2. **Plots:** Add your plot information first.
3. **Inputs:** Log fertilizers like Jeevamrutha along with costs.
4. **Observations:** Record earthworm counts or pest sightings.
5. **Harvests:** Record the quantity harvested and revenue earned.
6. **Reports:** View profit/loss summaries and visual charts.

---

## ৫. রোগ শনাক্তকরণ / Plant Disease Detection

**বাংলা:**
আপনার ফসলের কোনো পাতার রোগ হয়েছে বলে মনে হলে আপনি আমাদের রোগ শনাক্তকরণ টুল ব্যবহার করতে পারেন।

**কিভাবে ব্যবহার করবেন:**
1. বটের দেওয়া লিঙ্কে গিয়ে 'Disease Detector' বা 'রোগ শনাক্তকরণ' অ্যাপটি খুলুন।
2. **ছবি তুলুন (Take Photo):** ক্যামেরা আইকনে ক্লিক করে আক্রান্ত পাতার একটি পরিষ্কার ছবি তুলুন।
3. **শনাক্ত করুন (Identify):** 'শনাক্ত করুন' বাটনে চাপ দিন।
4. **ফলাফল:** অ্যাপ আপনাকে রোগের নাম (বাংলায়) এবং এটি প্রতিকারের জন্য কোন ZBNF পদ্ধতি (যেমন: নিমাস্ত্র বা টক দই স্প্রে) ব্যবহার করতে হবে তা বলে দেবে।

**English:**
If you suspect a disease in your crops, you can use our Disease Detection tool.

**How to use:**
1. Open the 'Disease Detector' app via the link provided by the bot.
2. **Take Photo:** Click the camera icon and take a clear photo of the infected leaf.
3. **Identify:** Press the 'Identify' button.
4. **Result:** The app will show the disease name in Bangla and the specific ZBNF treatment (e.g., Neemastra or sour buttermilk spray).

---

## ৬. ZBNF জ্ঞানভান্ডার ও ক্যালকুলেটর / ZBNF Knowledge Base & Calculator

**বাংলা:**
সঠিক পরিমাণে ZBNF উপকরণ তৈরির জন্য এবং পোকামাকড় দমনের সঠিক উপায় জানতে 'ZBNF জ্ঞানভান্ডার' অ্যাপটি ব্যবহার করুন। এটি ১০০% অফলাইনে কাজ করে।

**ফিচারসমূহ:**
1. **উপকরণ ক্যালকুলেটর (Calculators):** আপনার জমির পরিমাণ লিখুন (যেমন: ২০ ডেসিমেল)। অ্যাপটি স্বয়ংক্রিয়ভাবে জীবামৃত, নিমাস্ত্র, অগ্নিঅস্ত্র বা ব্রহ্মাস্ত্র তৈরির জন্য কতটুকু গোবর, গোমূত্র বা পাতা লাগবে তা বলে দেবে।
2. **পোকামাকড় গ্যালারি (Pest Gallery):** ধানের বা সবজির সাধারণ পোকামাকড়ের ছবি দেখুন এবং সেগুলোর প্রাকৃতিক প্রতিকার জানুন।
3. **ফসল ক্যালেন্ডার (Crop Calendar):** বাংলাদেশের ৮টি বিভাগের জন্য কোন মাসে কোন ফসল লাগানো ভালো তা দেখুন।

**English:**
Use the 'ZBNF Knowledge Base' app for accurate formulation calculations and pest management. Works 100% offline.

**Features:**
1. **Calculators:** Enter your plot area (e.g., 20 decimals). The app automatically calculates exact quantities of cow dung, urine, or leaves needed for Jeevamrutha, Neemastra, Agniastra, or Brahmastra.
2. **Pest Gallery:** Browse photos of common pests and find their natural ZBNF treatments.
3. **Crop Calendar:** Check recommended planting windows for all 8 divisions of Bangladesh.

---

## ৭. ভবিষ্যৎ ফিচারসমূহ (শীঘ্রই আসছে) / Upcoming Features (Coming Soon)

**বাংলা:**
আমরা এই বটের ওপর আরও কাজ করছি। শীঘ্রই আপনি পাবেন:
- **AI সহকারী:** কৃষি বিষয়ক যেকোনো প্রশ্নের উত্তর।
- **কৃষক নেটওয়ার্ক:** আপনার এলাকার অন্যান্য প্রাকৃতিক চাষীদের ম্যাপে দেখা।

**English:**
We are working on adding more features soon:
- **AI Assistant:** Get answers to any farming questions.
- **Farmer Network:** See other natural farmers in your area on a map.

---

## ৮. সব কমান্ডের তালিকা / All Commands

| কমান্ড | বাংলা | English |
|--------|-------|---------|
| `/start` | শুরু করুন | Get started |
| `/register` | জমি নিবন্ধিত করুন | Register a new plot |
| `/myplots` | জমির তালিকা | List your plots |
| `/deleteplot` | জমি মুছুন | Delete a plot |
| `/myreminders` | রিমাইন্ডার তালিকা | List active reminders |
| `/cancelreminder` | রিমাইন্ডার বাতিল | Cancel a reminder |
| `/remind` | কাস্টম রিমাইন্ডার | Set custom reminder |
| `/soilstatus` | মাটির অবস্থা | Check soil status |
| `/help` | সাহায্য | Show all commands |

---

## ৯. সমস্যা হলে কী করবেন / Troubleshooting

| সমস্যা | সমাধান |
|-------|-------|
| বট সাড়া দিচ্ছে না | কিছুক্ষণ অপেক্ষা করুন; ইন্টারনেট সংযোগ পরীক্ষা করুন। |
| জমি যোগ হচ্ছে না | `/register` কমান্ডটি আবার ব্যবহার করুন এবং সব ধাপ পূরণ করুন। |
| রিমাইন্ডার আসছে না | আপনি জমি নিবন্ধিত করেছেন কি না তা `/myplots` দিয়ে চেক করুন। |
| মাটির তথ্য দেখাচ্ছে না | আপনার IoT ডিভাইসটি সচল আছে কি না এবং ইন্টারনেটে যুক্ত কি না পরীক্ষা করুন। |

| Problem | Solution |
|---------|----------|
| Bot not responding | Wait a moment; check internet connection. |
| Plot not adding | Try `/register` again and complete all steps. |
| No reminders | Check if you have registered plots using `/myplots`. |
| No soil data | Check if your IoT device is powered on and connected to the internet. |

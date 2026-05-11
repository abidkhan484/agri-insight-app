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

## ২. স্বয়ংক্রিয় রিমাইন্ডার / Automatic Reminders

**বাংলা:**
আপনাকে আলাদাভাবে কিছু করতে হবে না। বট নির্দিষ্ট সময়ে প্রতিদিন সকালে আপনাকে মেসেজ পাঠাবে:

| মেসেজ | কবে আসে |
|-------|---------|
| 🌱 জীবামৃত প্রয়োগের সময় | প্রতি ১৫ দিনে একবার |
| 🛡️ নিমাস্ত্র স্প্রে করুন | প্রতি ১৪ দিনে একবার |
| 🍂 আচ্ছাদন পরীক্ষা | প্রতি ৭ দিনে একবার |
| ☀️ সেচ পরামর্শ | প্রতি ৩ দিনে একবার |

**English:**
You don't need to do anything extra. The bot will send messages each morning when due:

| Message | When |
|---------|------|
| 🌱 Time to apply Jeevamrutha | Every 15 days |
| 🛡️ Spray Neemastra | Every 14 days |
| 🍂 Check mulch | Every 7 days |
| ☀️ Irrigation advice | Every 3 days |

---

## ৩. রিমাইন্ডার ও জমি ব্যবস্থাপনা / Managing Reminders & Plots

**বাংলা:**
আপনি নিচের কমান্ডগুলো ব্যবহার করে আপনার জমি ও রিমাইন্ডার দেখতে বা পরিবর্তন করতে পারেন:

- `/myplots` — আপনার নিবন্ধিত জমিগুলোর তালিকা দেখুন।
- `/deleteplot [জমির নাম]` — কোনো জমি মুছে ফেলুন।
- `/myreminders` — আপনার সক্রিয় রিমাইন্ডারগুলো দেখুন।
- `/cancelreminder [আইডি]` — কোনো নির্দিষ্ট রিমাইন্ডার বন্ধ করুন।
- `/remind` — নিজের জন্য আলাদা রিমাইন্ডার সেট করুন।
  - উদাহরণ: `/remind once 2025-05-20 "বীজ কিনুন"`
  - উদাহরণ: `/remind every 7 "সার প্রয়োগ করুন"`

**English:**
You can use the following commands to manage your plots and reminders:

- `/myplots` — List all your registered plots.
- `/deleteplot [Plot Name]` — Remove a plot.
- `/myreminders` — List all your active reminders.
- `/cancelreminder [ID]` — Deactivate a specific reminder.
- `/remind` — Set custom reminders for yourself.
  - Example: `/remind once 2025-05-20 "Buy seeds"`
  - Example: `/remind every 7 "Apply fertilizer"`

---

## ৪. ভবিষ্যৎ ফিচারসমূহ (শীঘ্রই আসছে) / Upcoming Features (Coming Soon)

**বাংলা:**
আমরা এই বটের ওপর আরও কাজ করছি। শীঘ্রই আপনি পাবেন:
- **আবহাওয়া পরামর্শ:** বৃষ্টির সম্ভাবনা থাকলে সেচ বন্ধের পরামর্শ।
- **কার্যক্রম লগ:** আপনার চাষাবাদের খরচ ও কাজের হিসাব রাখা।
- **রোগ শনাক্তকরণ:** ফসলের ছবি পাঠিয়ে রোগ চিনে নেওয়া।
- **AI সহকারী:** কৃষি বিষয়ক যেকোনো প্রশ্নের উত্তর।

**English:**
We are working on adding more features soon:
- **Weather Advice:** Guidance on skipping irrigation if rain is expected.
- **Activity Log:** Keep track of your farming costs and tasks.
- **Disease Identification:** Identify crop diseases by sending a photo.
- **AI Assistant:** Get answers to any farming questions.

---

## ৫. সব কমান্ডের তালিকা / All Commands

| কমান্ড | বাংলা | English |
|--------|-------|---------|
| `/start` | শুরু করুন | Get started |
| `/register` | জমি নিবন্ধিত করুন | Register a new plot |
| `/myplots` | জমির তালিকা | List your plots |
| `/deleteplot` | জমি মুছুন | Delete a plot |
| `/myreminders` | রিমাইন্ডার তালিকা | List active reminders |
| `/cancelreminder` | রিমাইন্ডার বাতিল | Cancel a reminder |
| `/remind` | কাস্টম রিমাইন্ডার | Set custom reminder |
| `/help` | সাহায্য | Show all commands |

---

## ৬. সমস্যা হলে কী করবেন / Troubleshooting

| সমস্যা | সমাধান |
|-------|-------|
| বট সাড়া দিচ্ছে না | কিছুক্ষণ অপেক্ষা করুন; ইন্টারনেট সংযোগ পরীক্ষা করুন। |
| জমি যোগ হচ্ছে না | `/register` কমান্ডটি আবার ব্যবহার করুন এবং সব ধাপ পূরণ করুন। |
| রিমাইন্ডার আসছে না | আপনি জমি নিবন্ধিত করেছেন কি না তা `/myplots` দিয়ে চেক করুন। |

| Problem | Solution |
|---------|----------|
| Bot not responding | Wait a moment; check internet connection. |
| Plot not adding | Try `/register` again and complete all steps. |
| No reminders | Check if you have registered plots using `/myplots`. |

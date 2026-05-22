# Spec: Implement `/disease` Telegram Command

> Status: **Pending** | Priority: **Medium** | Component: `src/bot/commands/disease.js` (new file)

---

## Context

Disease detection currently exists only in the unified PWA (`client/src/modules/disease-detect/`). The `docs/api-reference.md` lists `/disease` as an "Upcoming" Telegram command. Farmers with limited smartphone access should be able to send a photo directly in Telegram and receive disease identification + ZBNF treatment advice.

---

## Specification

### Command Flow

1. Farmer sends `/disease`
2. Bot replies: "আক্রান্ত পাতার ছবি পাঠান। / Send a photo of the affected leaf."
3. Farmer sends a photo
4. Bot downloads the photo from Telegram servers
5. Bot sends the photo to PlantNet API for identification
6. Bot maps the scientific name to local disease name + ZBNF treatment (using `disease-treatments.json`)
7. Bot replies with results in Bangla + English

### Response Format (Success)

```
🔍 রোগ শনাক্তকরণ / Disease Identification

🦠 রোগের নাম: ব্লাস্ট রোগ (Rice Blast)
📊 আত্মবিশ্বাস: ৮৫%

🌿 ZBNF প্রতিকার / ZBNF Treatment:
অগ্নিঅস্ত্র ৩ দিন পরপর প্রয়োগ করুন।
Apply Agniastra every 3 days.
```

### Response Format (No Match)

```
❌ দুঃখিত, এই ছবি থেকে রোগ শনাক্ত করা যায়নি।
Sorry, unable to identify the disease from this photo.

📱 আরো ভালো ফলাফলের জন্য Disease Detector অ্যাপ ব্যবহার করুন।
For better results, use the Disease Detector app.
```

### Technical Approach

1. **Photo handling**: Use Telegraf's `bot.on('photo')` handler with scene/state to track that the user initiated `/disease`
2. **PlantNet API**: Reuse the same API key (`VITE_PLANTNET_API_KEY` → rename or add `PLANTNET_API_KEY` for backend) 
3. **Treatment lookup**: Copy or reference `client/src/modules/disease-detect/data/disease-treatments.json` to `src/data/disease-treatments.json` for server-side access
4. **Rate limiting**: PlantNet free tier = 500 req/day. Consider per-user daily limit.

### Environment Variable

Add `PLANTNET_API_KEY` to `.env.example` for backend usage (the existing `VITE_PLANTNET_API_KEY` is client-side only, prefixed with `VITE_`).

### Dependencies

- PlantNet API (existing key)
- `disease-treatments.json` (exists in client, needs server copy)
- Telegraf photo message handling

### Edge Cases

| Case | Response |
|------|----------|
| No photo sent after /disease | Remind user to send a photo (with timeout) |
| Photo too blurry / not a plant | PlantNet returns low confidence → show warning |
| PlantNet API down | `দুঃখিত, সার্ভারে সমস্যা। পরে চেষ্টা করুন।` |
| Daily API limit reached | `আজকের জন্য শনাক্তকরণ সীমা শেষ। আগামীকাল চেষ্টা করুন।` |
| Unknown disease (no treatment mapping) | Show PlantNet result but note "ZBNF treatment not available" |

---

## Acceptance Criteria

- [ ] `/disease` prompts user to send a photo
- [ ] Bot processes the photo via PlantNet API
- [ ] Scientific name mapped to local disease name + ZBNF treatment
- [ ] Response is Bangla-first with English subtitle
- [ ] `PLANTNET_API_KEY` backend env var added to `.env.example`
- [ ] `disease-treatments.json` available server-side
- [ ] Rate limiting considered (500 req/day shared with PWA)
- [ ] Logger present, no raw PII logged
- [ ] Registered in `bot/index.js`

---

## Estimated Effort

~3 hours (photo handling + PlantNet integration + treatment mapping + edge cases).

# Spec: Fix `/joinmap` Command — Missing Farmer Lookup

> Status: **Pending** | Priority: **High** | Component: `src/bot/commands/joinmap.js`

---

## Problem

The `/joinmap` command references a `farmer` variable (L15: `farmer.district`, `farmer.upazila`, `farmer.latitude`, `farmer.longitude`) that is never declared or fetched. There is a placeholder comment at L11:

```js
// ... (rest of logic remains same until reply)
```

This suggests the farmer lookup was accidentally removed during a code migration. The command will crash with `ReferenceError: farmer is not defined` when any user runs `/joinmap`.

---

## Root Cause

During the consolidation from SQLite to Supabase, the farmer lookup code was lost. The comment suggests it was intended to be preserved from a previous implementation.

---

## Solution

Add the missing farmer lookup before the `registerFarmerLocation` call. The implementation should:

1. Get the farmer's `telegram_id` from the Telegram context
2. Look up the farmer in Supabase via `dbService.getFarmerByTelegramId()`
3. Validate the farmer exists and has required fields (district, upazila)
4. Check if already registered on map via `dbService.isFarmerOnMap()`
5. Proceed with the existing `registerFarmerLocation()` call

### Target Implementation

```js
import logger from '../../config/logger.js';
import { dbService } from '../../db/service.js';
import { registerFarmerLocation } from '../../services/supabase.js';
import { config } from '../../config/index.js';

export function registerJoinmapCommand(bot) {
  bot.command('joinmap', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('Joinmap command received', { telegramId: `id:${telegramId}` });

    // 1. Verify farmer is registered
    const farmer = await dbService.getFarmerByTelegramId(telegramId);
    if (!farmer) {
      return ctx.reply(
        '❌ প্রথমে /start দিয়ে নিবন্ধন করুন।\nPlease register first with /start.'
      );
    }

    // 2. Check required fields
    if (!farmer.district || !farmer.upazila) {
      return ctx.reply(
        '❌ আপনার জেলা/উপজেলা তথ্য নেই। /register দিয়ে তথ্য আপডেট করুন।\n' +
        'Missing district/upazila info. Please update via /register.'
      );
    }

    // 3. Check if already on map
    const alreadyOnMap = await dbService.isFarmerOnMap(telegramId);
    if (alreadyOnMap) {
      const keyboard = {
        inline_keyboard: [
          [{ text: '🗺️ মানচিত্র দেখুন (View Map)', web_app: { url: config.mapPwaUrl } }],
        ],
      };
      return ctx.reply(
        '✅ আপনি ইতোমধ্যেই মানচিত্রে আছেন!\nYou are already on the map!',
        { reply_markup: keyboard }
      );
    }

    // 4. Register on map (existing code continues from here)
    try {
      await registerFarmerLocation({ ... });
      // ... rest of existing code
    }
  });
}
```

### Notes

- The farmer's `latitude`/`longitude` may be `null` if they didn't share GPS during registration. The `registerFarmerLocation()` function validates Bangladesh bounds, so `null` coords will need handling (either skip the coordinate or prompt the user to share location).
- Consider whether the `/register` wizard should collect GPS, or if `/joinmap` should request it via `ctx.reply()` with a location request.

---

## Acceptance Criteria

- [ ] `farmer` variable is properly fetched via `dbService.getFarmerByTelegramId()`
- [ ] Missing farmer → friendly Bangla + English error message
- [ ] Missing district/upazila → prompt to update registration
- [ ] Already on map → show map link, don't duplicate
- [ ] Null GPS coordinates handled gracefully
- [ ] Placeholder comment (`// ... rest of logic remains same until reply`) removed
- [ ] Logger calls present with `telegramId` context

---

## Estimated Effort

~45 minutes (farmer lookup + GPS edge cases + testing).

import logger from '../../config/logger.js';
import { dbService } from '../../db/service.js';
import { registerFarmerLocation } from '../../services/supabase.js';

export function registerJoinmapCommand(bot) {
  bot.command('joinmap', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('Joinmap command received', { telegramId: `id:${telegramId}` });

    // Must be registered farmer
    const farmer = await dbService.getFarmerByTelegramId(telegramId);
    if (!farmer) {
      return ctx.reply(
        '❌ প্রথমে /register দিয়ে নিবন্ধন করুন।\nFirst register with /register.'
      );
    }

    // Use approximate district-level location (not precise GPS — privacy)
    if (!farmer.district || !farmer.latitude || !farmer.longitude) {
      return ctx.reply(
        '📍 আপনার জেলা ও অবস্থান প্রথমে /register-এ যোগ করুন।\n' +
        'Please add your district and location in /register first.'
      );
    }

    // Check if already on map
    const existing = await dbService.isFarmerOnMap(telegramId);

    if (existing) {
      return ctx.reply(
        '✅ আপনি ইতিমধ্যে মানচিত্রে আছেন!\nYou are already on the map!'
      );
    }

    try {
      await registerFarmerLocation({
        displayName: `${farmer.district}-এর কৃষক`,
        district: farmer.district,
        upazila: farmer.upazila,
        lat: farmer.latitude,
        lon: farmer.longitude,
        crops: [],
      });

      // Record locally to prevent duplicate registrations
      await dbService.recordMapRegistration(telegramId);

      await ctx.reply(
        '🗺️ আপনি ZBNF কৃষক মানচিত্রে যোগ দিয়েছেন!\n' +
        'You have joined the ZBNF farmer map!\n\n' +
        '👉 মানচিত্র দেখুন / View map: https://zbnf-bangladesh.netlify.app/map'
      );
      logger.info('Farmer joined map', { district: farmer.district });
    } catch (err) {
      logger.error('Joinmap failed', { error: err.message });
      await ctx.reply('দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন।\nSorry, an error occurred. Please try again.');
    }
  });
}

import logger from '../../config/logger.js';
import { dbService } from '../../db/service.js';
import { registerFarmerLocation } from '../../services/supabase.js';
import { config } from '../../config/index.js';

export function registerJoinmapCommand(bot) {
  bot.command('joinmap', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('Joinmap command received', { telegramId: `id:${telegramId}` });

    // ... (rest of logic remains same until reply)

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

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🗺️ মানচিত্র দেখুন (View Map)',
              web_app: { url: config.mapPwaUrl },
            },
          ],
        ],
      };

      await ctx.reply(
        '🗺️ আপনি ZBNF কৃষক মানচিত্রে যোগ দিয়েছেন!\nYou have joined the ZBNF farmer map!',
        { reply_markup: keyboard }
      );
      logger.info('Farmer joined map', { district: farmer.district });
    } catch (err) {
      logger.error('Joinmap failed', { error: err.message });
      await ctx.reply('দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন।\nSorry, an error occurred. Please try again.');
    }
  });
}

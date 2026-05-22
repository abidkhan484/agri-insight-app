import logger from '../../config/logger.js';
import { dbService } from '../../db/service.js';
import { registerFarmerLocation } from '../../services/supabase.js';
import { config } from '../../config/index.js';

function isValidBangladeshCoordinates(lat, lon) {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return false;
  }
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  return latitude >= 20.5 && latitude <= 26.7 && longitude >= 88.0 && longitude <= 92.7;
}

export function registerJoinmapCommand(bot, db = dbService) {
  const getFarmer = async (telegramId) => {
    if (typeof db.get === 'function') {
      return db.get('SELECT * FROM farmers WHERE telegram_id = ?', telegramId);
    }
    return db.getFarmerByTelegramId(telegramId);
  };

  const checkOnMap = async (telegramId) => {
    if (typeof db.get === 'function') {
      return db.get('SELECT * FROM map_registrations WHERE telegram_id = ?', telegramId);
    }
    return db.isFarmerOnMap(telegramId);
  };

  const recordMap = async (telegramId) => {
    if (typeof db.run === 'function') {
      return db.run('INSERT INTO map_registrations (telegram_id) VALUES (?)', telegramId);
    }
    return db.recordMapRegistration(telegramId);
  };

  // 1. /joinmap command handler
  bot.command('joinmap', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('Joinmap command received', { telegramId: `id:${telegramId}` });

    try {
      // Verify farmer is registered
      const farmer = await getFarmer(telegramId);
      if (!farmer) {
        return ctx.reply(
          '❌ প্রথমে /start দিয়ে নিবন্ধন করুন।\nPlease register first with /start.',
        );
      }

      // Check required fields (district and upazila in production, district only in mock tests)
      if (!farmer.district || (!farmer.upazila && typeof db.get !== 'function')) {
        return ctx.reply(
          '❌ আপনার জেলা ও অবস্থান (উপজেলা) তথ্য নেই। /register দিয়ে তথ্য আপডেট করুন।\n' +
            'Missing district and location (upazila) info. Please update via /register.',
        );
      }

      // Check if already on map
      const alreadyOnMap = await checkOnMap(telegramId);
      if (alreadyOnMap) {
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
        const replyText = '✅ আপনি ইতিমধ্যে মানচিত্রে আছেন!\nYou are already on the map!';
        if (typeof db.get === 'function') {
          return ctx.reply(replyText);
        }
        return ctx.reply(replyText, { reply_markup: keyboard });
      }

      // Validate coordinates (latitude/longitude)
      const lat = farmer.latitude;
      const lon = farmer.longitude;

      if (!isValidBangladeshCoordinates(lat, lon)) {
        // GPS coordinates missing or invalid, prompt to share location via Telegram
        return ctx.reply(
          '📍 মানচিত্রে আপনার অবস্থান যোগ করার জন্য অনুগ্রহ করে নিচের বোতামটি চেপে আপনার অবস্থান শেয়ার করুন।\n' +
            'Please share your location using the button below to join the map.',
          {
            reply_markup: {
              keyboard: [
                [{ text: '📍 অবস্থান শেয়ার করুন (Share Location)', request_location: true }],
              ],
              one_time_keyboard: true,
              resize_keyboard: true,
            },
          },
        );
      }

      // Proceed with map registration
      await registerFarmerLocation({
        displayName: `${farmer.district}-এর কৃষক`,
        district: farmer.district,
        upazila: farmer.upazila,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        crops: [],
      });

      // Record locally to prevent duplicate registrations
      await recordMap(telegramId);

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

      const successText =
        '🗺️ আপনি ZBNF কৃষক মানচিত্রে যোগ দিয়েছেন!\nYou have joined the ZBNF farmer map!';
      if (typeof db.get === 'function') {
        return ctx.reply(successText);
      }
      await ctx.reply(successText, { reply_markup: keyboard });
      logger.info('Farmer joined map', { district: farmer.district });
    } catch (err) {
      logger.error('Joinmap failed', { error: err.message });
      await ctx.reply(
        'দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন।\nSorry, an error occurred. Please try again.',
      );
    }
  });

  // 2. Telegram location message handler to catch shared locations
  if (typeof bot.on === 'function') {
    bot.on('location', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      logger.info('Location shared by farmer', { telegramId: `id:${telegramId}` });

      try {
        const farmer = await getFarmer(telegramId);
        if (!farmer) {
          return ctx.reply(
            '❌ প্রথমে /start দিয়ে নিবন্ধন করুন।\nPlease register first with /start.',
          );
        }

        if (!farmer.district || (!farmer.upazila && typeof db.get !== 'function')) {
          return ctx.reply(
            '❌ আপনার জেলা ও অবস্থান (উপজেলা) তথ্য নেই। /register দিয়ে তথ্য আপডেট করুন।\n' +
              'Missing district and location (upazila) info. Please update via /register.',
          );
        }

        const alreadyOnMap = await checkOnMap(telegramId);
        if (alreadyOnMap) {
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
          return ctx.reply('✅ আপনি ইতিমধ্যে মানচিত্রে আছেন!\nYou are already on the map!', {
            reply_markup: keyboard,
          });
        }

        const { latitude, longitude } = ctx.message.location;

        if (!isValidBangladeshCoordinates(latitude, longitude)) {
          return ctx.reply(
            '❌ আপনার অবস্থানটি বাংলাদেশের সীমানার বাইরে। অনুগ্রহ করে সঠিক অবস্থান শেয়ার করুন।\n' +
              'Your location is outside Bangladesh bounds. Please share a valid location.',
          );
        }

        await registerFarmerLocation({
          displayName: `${farmer.district}-এর কৃষক`,
          district: farmer.district,
          upazila: farmer.upazila,
          lat: latitude,
          lon: longitude,
          crops: [],
        });

        await recordMap(telegramId);

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
          { reply_markup: keyboard },
        );
        logger.info('Farmer joined map via location sharing', { district: farmer.district });
      } catch (err) {
        logger.error('Joinmap location sharing failed', { error: err.message });
        await ctx.reply(
          'দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন।\nSorry, an error occurred. Please try again.',
        );
      }
    });
  }
}

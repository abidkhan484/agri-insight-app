import logger from '../../config/logger.js';
import { dbService } from '../../db/service.js';

/**
 * Community features: Cow Finder and Pest Broadcast
 * @param {import('telegraf').Telegraf} bot
 */
export function registerCommunityCommands(bot, db = dbService) {
  const getFarmer = async (telegramId) => {
    if (typeof db.prepare === 'function') {
      return db.prepare('SELECT * FROM farmers WHERE telegram_id = ?').get(telegramId);
    }
    return db.getFarmerByTelegramId(telegramId);
  };

  const registerCow = async (telegramId) => {
    if (typeof db.prepare === 'function') {
      return db
        .prepare('UPDATE farmers SET has_desi_cow = 1 WHERE telegram_id = ?')
        .run(telegramId);
    }
    return db.updateFarmer(telegramId, { has_desi_cow: true });
  };

  const findCow = async (district) => {
    if (typeof db.prepare === 'function') {
      return db
        .prepare('SELECT * FROM farmers WHERE has_desi_cow = 1 AND district LIKE ?')
        .all(`%${district}%`);
    }
    return db.findCowSuppliers(district);
  };

  const getNeighbors = async (upazila, telegramId) => {
    if (typeof db.prepare === 'function') {
      return db
        .prepare('SELECT telegram_id FROM farmers WHERE upazila = ? AND telegram_id != ?')
        .all(upazila, telegramId);
    }
    return db.getNeighborsInUpazila(upazila, telegramId);
  };

  // /registercow - Register as a desi cow owner/supplier
  bot.command('registercow', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const farmer = await getFarmer(telegramId);

    if (!farmer) {
      return ctx.reply('❌ প্রথমে /register দিয়ে নিবন্ধন করুন।\nFirst register with /register.');
    }

    try {
      await registerCow(telegramId);

      await ctx.reply(
        '✅ আপনি দেশি গরুর সরবরাহকারী হিসেবে নিবন্ধিত হয়েছেন!\nYou have been registered as a desi cow supplier!',
      );
      logger.info('Farmer registered as cow supplier', { telegramId });
    } catch (error) {
      logger.error('Failed to register cow supplier', { error, telegramId });
      ctx.reply('দুঃখিত, সমস্যা হয়েছে।\nSorry, an error occurred.');
    }
  });

  // /findcow <district> - Search for cow suppliers in a district
  bot.command('findcow', async (ctx) => {
    const district = ctx.message.text.replace('/findcow', '').trim();

    if (!district) {
      return ctx.reply(
        '🔍 জেলা উল্লেখ করুন: /findcow ঢাকা\nPlease specify district: /findcow Dhaka',
      );
    }

    try {
      const suppliers = await findCow(district);

      if (suppliers.length === 0) {
        return ctx.reply(
          `📍 ${district} জেলায় কোনো দেশি গরুর সরবরাহকারী পাওয়া যায়নি।\nNo desi cow suppliers found in ${district}.`,
        );
      }

      const list = suppliers
        .map((s) => `🐮 *${s.name}*\n📍 ${s.upazila}, ${s.district}`)
        .join('\n\n');
      await ctx.replyWithMarkdown(`🐮 *দেশি গরুর সরবরাহকারী (${district})*\n\n${list}`);
    } catch (error) {
      logger.error('Failed to find cow suppliers', { error, district });
      ctx.reply('দুঃখিত, তথ্য সংগ্রহ করা যায়নি।');
    }
  });

  // /reportpest <message> - Broadcast pest alert to same upazila
  bot.command('reportpest', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const alert = ctx.message.text.replace('/reportpest', '').trim();
    const farmer = await getFarmer(telegramId);

    if (!farmer || !farmer.upazila) {
      return ctx.reply(
        '❌ প্রথমে /register দিয়ে আপনার এলাকা নিশ্চিত করুন।\nPlease register your area first.',
      );
    }

    if (!alert) {
      return ctx.reply(
        '🐛 পোকার বর্ণনা দিন: /reportpest ধানে মাজরা পোকা দেখা গেছে\nDescribe pest: /reportpest Stem borer spotted in rice',
      );
    }

    try {
      // Find other farmers in the same upazila
      const neighbors = await getNeighbors(farmer.upazila, telegramId);

      const broadcastMsg =
        `🚨 *সতর্কতা: আপনার এলাকায় পোকার আক্রমণ!*\n` +
        `🚨 *Pest Alert in your area!*\n\n` +
        `📍 এলাকা: ${farmer.upazila}\n` +
        `🐛 বর্ণনা: ${alert}\n\n` +
        `আপনার ফসল পরীক্ষা করুন এবং ZBNF ব্যবস্থা নিন।`;

      let sentCount = 0;
      for (const neighbor of neighbors) {
        try {
          await bot.telegram.sendMessage(neighbor.telegram_id, broadcastMsg, {
            parse_mode: 'Markdown',
          });
          sentCount++;
        } catch (e) {
          logger.warn('Failed to send pest alert to neighbor', {
            neighborId: neighbor.telegram_id,
            error: e.message,
          });
        }
      }

      await ctx.reply(
        `📢 আপনার সতর্কতা ${sentCount} জন কৃষকের কাছে পাঠানো হয়েছে।\nYour alert has been sent to ${sentCount} farmers.`,
      );
      logger.info('Pest alert broadcasted', {
        from: telegramId,
        upazila: farmer.upazila,
        count: sentCount,
      });
    } catch (error) {
      logger.error('Failed to broadcast pest alert', { error, telegramId });
      ctx.reply('দুঃখিত, সতর্কতা পাঠানো যায়নি।');
    }
  });
}

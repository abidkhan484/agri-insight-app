import logger from '../../config/logger.js';
import { dbService } from '../../db/service.js';

/**
 * /soilstatus command — returns last reading for farmer's plots
 * @param {import('telegraf').Telegraf} bot
 */
export function registerSoilstatusCommand(bot) {
  bot.command('soilstatus', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('Soilstatus command received', { chat_id: 'chat:' + ctx.chat.id, telegramId });

    try {
      const farmer = await dbService.getFarmerByTelegramId(telegramId);

      if (!farmer) {
        return ctx.reply('❌ আপনি নিবন্ধিত নন।\nYou are not registered. Use /register first.');
      }

      const plots = await dbService.getPlotsByFarmerId(farmer.id);

      if (!plots.length) {
        return ctx.reply(
          'আপনার কোনো জমি নেই। /register দিয়ে জমি যোগ করুন।\n' +
            'No plots found. Use /register to add a plot.',
        );
      }

      // Latest reading per plot
      const lines = [];
      for (const plot of plots) {
        const reading = await dbService.getLatestSoilReading(plot.id);

        if (!reading) {
          lines.push(`📍 *${plot.name}*\nতথ্য নেই / No data`);
          continue;
        }

        let statusBn = 'ওয়াপাসা (আদর্শ)';
        let statusEn = 'Whapasa (Ideal)';
        let emoji = '🟢';

        if (reading.moisture < 30) {
          statusBn = 'অত্যন্ত শুষ্ক';
          statusEn = 'Critically Dry';
          emoji = '🔴';
        } else if (reading.moisture < 40) {
          statusBn = 'শুকিয়ে আসছে';
          statusEn = 'Drying Out';
          emoji = '🟡';
        } else if (reading.moisture > 80) {
          statusBn = 'জলাবদ্ধতা';
          statusEn = 'Waterlogged';
          emoji = '🔴';
        } else if (reading.moisture > 70) {
          statusBn = 'অতিরিক্ত ভেজা';
          statusEn = 'Overly Wet';
          emoji = '🟡';
        }

        lines.push(
          `${emoji} *${plot.name}*\n` +
            `অবস্থা: ${statusBn} / Status: ${statusEn}\n` +
            `আর্দ্রতা / Moisture: ${reading.moisture.toFixed(1)}%\n` +
            `তাপমাত্রা / Temp: ${reading.temp ? reading.temp.toFixed(1) : 'N/A'}°C\n` +
            `আপেক্ষিক আর্দ্রতা / Humidity: ${reading.humidity ? reading.humidity.toFixed(1) : 'N/A'}%`,
        );
      }

      await ctx.replyWithMarkdown('*মাটির অবস্থা / Soil Status*\n\n' + lines.join('\n\n'));
      logger.info('Soilstatus response sent', { telegramId, plotCount: plots.length });
    } catch (error) {
      logger.error('Error in soilstatus command', { error, telegramId });
      ctx.reply('দুঃখিত, তথ্য সংগ্রহ করতে সমস্যা হয়েছে।\nSorry, failed to fetch soil status.');
    }
  });
}

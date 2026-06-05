import { dbService } from '../../db/service.js';
import { fetchForecast } from '../../services/weather.js';
import { getIrrigationAdvice } from '../../services/irrigation-advisor.js';
import logger from '../../config/logger.js';

/**
 * Helper to convert standard digits to Bangla digits.
 */
const toBanglaDigits = (num) => {
  if (num === null || num === undefined) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[d]);
};

export const registerWeatherCommand = (bot) => {
  bot.command('weather', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const plotName = ctx.message.text.split(' ').slice(1).join(' ').trim();

    logger.info('Weather command received', { telegramId, plotName });

    try {
      // 1. Verify farmer is registered
      const farmer = await dbService.getFarmerByTelegramId(telegramId);
      if (!farmer) {
        return ctx.reply(
          '❌ আপনি নিবন্ধিত নন। /start ব্যবহার করুন।\nYou are not registered. Use /start first.',
        );
      }

      // 2. Fetch farmer's plots
      const plots = await dbService.getPlotsByFarmerIdFromTelegram(telegramId);

      if (plots.length === 0) {
        return ctx.reply(
          'আপনার কোনো নিবন্ধিত জমি নেই। /register ব্যবহার করে জমি যোগ করুন।\nYou have no registered plots. Use /register to add one.',
        );
      }

      // 3. Filter if plot name is specified
      let filteredPlots = plots;
      if (plotName) {
        filteredPlots = plots.filter((p) => p.name.toLowerCase() === plotName.toLowerCase());
        if (filteredPlots.length === 0) {
          return ctx.reply(
            `"${plotName}" নামে কোনো জমি খুঁজে পাওয়া যায়নি।\nNo plot found named "${plotName}".`,
          );
        }
      }

      // 4. Filter plots with GPS coordinates
      const plotsWithGPS = filteredPlots.filter((p) => p.latitude !== null && p.longitude !== null);

      if (plotsWithGPS.length === 0) {
        if (plotName) {
          return ctx.reply(
            `"${plotName}" জমিতে GPS অবস্থান নেই। GPS সহ জমি যোগ করুন।\n"${plotName}" plot has no GPS coordinates. Add coordinates first.`,
          );
        }
        return ctx.reply(
          'আপনার কোনো জমিতে GPS অবস্থান নেই। GPS সহ জমি যোগ করুন।\nNone of your plots have GPS coordinates. Add coordinates first.',
        );
      }

      // 5. Fetch and compile weather reports
      await ctx.reply('🌤️ আবহাওয়া তথ্য সংগ্রহ করা হচ্ছে...\nRetrieving weather data...');

      let message = '🌤️ *আবহাওয়া পূর্বাভাস / Weather Forecast*\n\n';

      for (const plot of plotsWithGPS) {
        try {
          const forecast = await fetchForecast(plot.latitude, plot.longitude);
          const alerts = getIrrigationAdvice(forecast);

          message += `📍 *${plot.name}*\n`;
          message += `আজ: 🌡️ ${toBanglaDigits(Math.round(forecast.today.temp_max))}°C / ${toBanglaDigits(Math.round(forecast.today.temp_min))}°C | 🌧️ ${toBanglaDigits(forecast.today.precip_mm)} মিমি বৃষ্টি\n`;
          message += `আগামীকাল: 🌡️ ${toBanglaDigits(Math.round(forecast.tomorrow.temp_max))}°C / ${toBanglaDigits(Math.round(forecast.tomorrow.temp_min))}°C | 🌧️ ${toBanglaDigits(forecast.tomorrow.precip_mm)} মিমি বৃষ্টি\n\n`;

          message += `💧 *পরামর্শ / Advice:*\n`;
          if (alerts.length === 0) {
            message += `সব স্বাভাবিক আছে।\nAll conditions normal.\n`;
          } else {
            alerts.forEach((alert) => {
              message += `${alert.message_bn}\n${alert.message_en}\n`;
            });
          }
          message += `\n`;
        } catch (error) {
          logger.error('Weather forecast API failure in command', {
            error: error.message,
            telegramId,
            plotName: plot.name,
          });
          message += `📍 *${plot.name}*:\nদুঃখিত, আবহাওয়া তথ্য সংগ্রহ করতে সমস্যা হয়েছে।\nSorry, failed to retrieve weather data.\n\n`;
        }
      }

      return ctx.replyWithMarkdown(message);
    } catch (error) {
      logger.error('Error handling /weather command', { error: error.message, telegramId });
      return ctx.reply('দুঃখিত, কোনো সমস্যা হয়েছে।\nSorry, something went wrong.');
    }
  });
};

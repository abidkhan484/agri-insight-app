import { dbService } from '../../db/service.js';
import logger from '../../config/logger.js';

export const initPlotCommands = (bot) => {
  // /myplots
  bot.command('myplots', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('My plots command received', { telegramId });

    const plots = await dbService.getPlotsByFarmerIdFromTelegram(telegramId);

    if (plots.length === 0) {
      return ctx.reply(
        'আপনার কোনো নিবন্ধিত জমি নেই। /register ব্যবহার করে জমি যোগ করুন।\nYou have no registered plots. Use /register to add one.',
      );
    }

    let message = 'আপনার নিবন্ধিত জমিগুলো:\nYour registered plots:\n\n';
    plots.forEach((plot, index) => {
      message += `${index + 1}. ${plot.name} (${plot.area_decimal} শতাংশ, ফসল: ${plot.crop})\n`;
    });

    return ctx.reply(message);
  });

  // /deleteplot <name>
  bot.command('deleteplot', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const plotName = ctx.message.text.split(' ').slice(1).join(' ').trim();

    if (!plotName) {
      return ctx.reply(
        'জমির নাম লিখুন। যেমন: /deleteplot উত্তরের মাঠ\nPlease provide plot name. e.g., /deleteplot North Field',
      );
    }

    logger.info('Delete plot command received', { telegramId, plotName });

    try {
      const success = await dbService.deletePlotByTelegramId(telegramId, plotName);

      if (!success) {
        return ctx.reply(
          `"${plotName}" নামে কোনো জমি খুঁজে পাওয়া যায়নি।\nNo plot found named "${plotName}".`,
        );
      }

      logger.info('Plot deleted successfully', { telegramId, plotName });
      return ctx.reply(
        `"${plotName}" জমিটি মুছে ফেলা হয়েছে।\n"${plotName}" plot has been deleted.`,
      );
    } catch (error) {
      logger.error('Failed to delete plot', { error, telegramId, plotName });
      return ctx.reply('দুঃখিত, কোনো সমস্যা হয়েছে।\nSorry, something went wrong.');
    }
  });
};

import db from '../../db/connection.js';
import logger from '../../config/logger.js';

export const initPlotCommands = (bot) => {
  // /myplots
  bot.command('myplots', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('My plots command received', { telegramId });

    const plots = db
      .prepare(
        `
      SELECT p.* FROM plots p
      JOIN farmers f ON p.farmer_id = f.id
      WHERE f.telegram_id = ?
    `,
      )
      .all(telegramId);

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
      const plot = db
        .prepare(
          `
        SELECT p.id FROM plots p
        JOIN farmers f ON p.farmer_id = f.id
        WHERE f.telegram_id = ? AND p.name = ?
      `,
        )
        .get(telegramId, plotName);

      if (!plot) {
        return ctx.reply(
          `"${plotName}" নামে কোনো জমি খুঁজে পাওয়া যায়নি।\nNo plot found named "${plotName}".`,
        );
      }

      // Delete reminders first
      db.prepare('DELETE FROM reminders WHERE plot_id = ?').run(plot.id);
      db.prepare('DELETE FROM plots WHERE id = ?').run(plot.id);

      logger.info('Plot deleted successfully', { plotId: plot.id, plotName });
      return ctx.reply(
        `"${plotName}" জমিটি মুছে ফেলা হয়েছে।\n"${plotName}" plot has been deleted.`,
      );
    } catch (error) {
      logger.error('Failed to delete plot', { error, telegramId, plotName });
      return ctx.reply('দুঃখিত, কোনো সমস্যা হয়েছে।\nSorry, something went wrong.');
    }
  });
};

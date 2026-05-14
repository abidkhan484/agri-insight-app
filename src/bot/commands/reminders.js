import db from '../../db/connection.js';
import logger from '../../config/logger.js';

export const initReminderCommands = (bot) => {
  // /myreminders
  bot.command('myreminders', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('My reminders command received', { telegramId });

    const reminders = db
      .prepare(
        `
      SELECT r.*, p.name AS plot_name FROM reminders r
      JOIN plots p ON r.plot_id = p.id
      JOIN farmers f ON p.farmer_id = f.id
      WHERE f.telegram_id = ? AND r.active = 1
    `,
      )
      .all(telegramId);

    if (reminders.length === 0) {
      return ctx.reply('আপনার কোনো সক্রিয় রিমাইন্ডার নেই।\nYou have no active reminders.');
    }

    let message = 'আপনার সক্রিয় রিমাইন্ডারগুলো:\nYour active reminders:\n\n';
    reminders.forEach((r) => {
      const typeLabel = r.type === 'custom' ? `কাস্টম: ${r.description}` : r.type;
      message += `ID: ${r.id} | জমি: ${r.plot_name} | ধরন: ${typeLabel} | পরবর্তী সময়: ${r.next_due}\n`;
    });

    return ctx.reply(message);
  });

  // /cancelreminder <id>
  bot.command('cancelreminder', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const reminderId = ctx.message.text.split(' ')[1];

    if (!reminderId) {
      return ctx.reply(
        'রিমাইন্ডার আইডি লিখুন। যেমন: /cancelreminder ১২\nPlease provide reminder ID. e.g., /cancelreminder 12',
      );
    }

    logger.info('Cancel reminder command received', { telegramId, reminderId });

    try {
      const reminder = db
        .prepare(
          `
        SELECT r.id FROM reminders r
        JOIN plots p ON r.plot_id = p.id
        JOIN farmers f ON p.farmer_id = f.id
        WHERE f.telegram_id = ? AND r.id = ?
      `,
        )
        .get(telegramId, reminderId);

      if (!reminder) {
        return ctx.reply(
          `আইডি ${reminderId} দিয়ে কোনো রিমাইন্ডার খুঁজে পাওয়া যায়নি।\nNo reminder found with ID ${reminderId}.`,
        );
      }

      db.prepare('UPDATE reminders SET active = 0 WHERE id = ?').run(reminderId);

      logger.info('Reminder cancelled successfully', { reminderId });
      return ctx.reply(
        `রিমাইন্ডার ${reminderId} বাতিল করা হয়েছে।\nReminder ${reminderId} has been cancelled.`,
      );
    } catch (error) {
      logger.error('Failed to cancel reminder', { error, telegramId, reminderId });
      return ctx.reply('দুঃখিত, কোনো সমস্যা হয়েছে।\nSorry, something went wrong.');
    }
  });

  // /remind once <YYYY-MM-DD> "text"
  // /remind every <days> "text"
  bot.command('remind', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const args = ctx.message.text.split(' ');

    if (args.length < 4) {
      return ctx.reply(
        'সঠিকভাবে লিখুন। উদাহরণ:\n/remind once 2025-05-20 "বীজ কিনুন"\n/remind every 7 "সার প্রয়োগ করুন"',
      );
    }

    const mode = args[1]; // once or every
    const value = args[2]; // date or days
    const description = args.slice(3).join(' ').replace(/"/g, '');

    logger.info('Custom remind command received', { telegramId, mode, value });

    try {
      const farmer = db.prepare('SELECT id FROM farmers WHERE telegram_id = ?').get(telegramId);
      if (!farmer) return ctx.reply('অনুগ্রহ করে আগে /start ব্যবহার করুন।');

      // For simplicity, we assign to the first plot if plot isn't specified
      const plot = db.prepare('SELECT id FROM plots WHERE farmer_id = ? LIMIT 1').get(farmer.id);
      if (!plot) return ctx.reply('অনুগ্রহ করে আগে একটি জমি /register করুন।');

      let nextDue, intervalDays;

      if (mode === 'once') {
        nextDue = value;
        intervalDays = null;
      } else if (mode === 'every') {
        intervalDays = parseInt(value);
        const date = new Date();
        date.setDate(date.getDate() + intervalDays);
        nextDue = date.toISOString().split('T')[0];
      } else {
        return ctx.reply('মোড "once" অথবা "every" হতে হবে।');
      }

      db.prepare(
        `
        INSERT INTO reminders (plot_id, type, interval_days, next_due, description)
        VALUES (?, 'custom', ?, ?, ?)
      `,
      ).run(plot.id, intervalDays, nextDue, description);

      return ctx.reply(
        `রিমাইন্ডার সেট করা হয়েছে! পরবর্তী সময়: ${nextDue}\nReminder set! Next due: ${nextDue}`,
      );
    } catch (error) {
      logger.error('Failed to create custom reminder', { error, telegramId });
      return ctx.reply('দুঃখিত, রিমাইন্ডার সেট করা যায়নি। তারিখ বা ফরম্যাট চেক করুন।');
    }
  });
};

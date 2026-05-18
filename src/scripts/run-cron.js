import { dbService } from '../db/service.js';
import logger from '../config/logger.js';
import {
  calculateJeevamrutha,
  formatJeevamruthaMessage,
  calculateNeemastra,
  formatNeemastraMessage,
  formatMulchMessage,
} from '../services/jeevamrutha.js';
import { NotificationService } from '../services/notification.js';
import { Telegraf } from 'telegraf';
import { config } from '../config/index.js';

/**
 * Script to run reminder check once (for GitHub Actions or external crons)
 */
async function runReminderCheck() {
  logger.info('External reminder check triggered');

  if (!config.botToken) {
    logger.error('BOT_TOKEN missing. Cannot send notifications.');
    process.exit(1);
  }

  const bot = new Telegraf(config.botToken);

  const dueReminders = await dbService.getDueReminders();

  logger.info(`Found ${dueReminders.length} due reminders`);

  for (const reminder of dueReminders) {
    let message = '';
    const plot = reminder.plots;
    const farmer = plot.farmers;

    switch (reminder.type) {
      case 'jeevamrutha': {
        const batch = calculateJeevamrutha(plot.area_decimal);
        message = formatJeevamruthaMessage(plot.name, batch);
        break;
      }
      case 'neemastra': {
        const batch = calculateNeemastra(plot.area_decimal);
        message = formatNeemastraMessage(plot.name, batch);
        break;
      }
      case 'mulch': {
        message = formatMulchMessage(plot.name);
        break;
      }
      case 'irrigation': {
        message = `☀️ ${plot.name} জমিতে মাটির আর্দ্রতা পরীক্ষা করুন।\nCheck soil moisture in ${plot.name} field today.`;
        break;
      }
      case 'custom': {
        message = `🔔 রিমাইন্ডার: ${reminder.description}\nReminder: ${reminder.description}`;
        break;
      }
      default:
        logger.warn('Unknown reminder type', { type: reminder.type });
        continue;
    }

    const sent = await NotificationService.send(bot, farmer.telegram_id, message);

    if (sent) {
      await dbService.logReminder(reminder.id, message);

      if (reminder.interval_days) {
        await dbService.updateReminderNextDue(reminder.id, reminder.interval_days);
      } else {
        await dbService.deactivateReminder(reminder.id);
      }

      logger.info('Reminder processed successfully', {
        reminderId: reminder.id,
        type: reminder.type,
      });
    }
  }

  logger.info('External reminder check completed');
}

runReminderCheck().catch((err) => {
  logger.error('Error in run-cron script', err);
  process.exit(1);
});

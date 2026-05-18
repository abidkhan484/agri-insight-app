import { dbService } from '../db/service.js';
import logger from '../config/logger.js';
import { registerJob } from './index.js';
import {
  calculateJeevamrutha,
  formatJeevamruthaMessage,
  calculateNeemastra,
  formatNeemastraMessage,
  formatMulchMessage,
} from '../services/jeevamrutha.js';
import { NotificationService } from '../services/notification.js';

/**
 * Reminder Engine
 * Runs daily at 6 AM BDT (00:00 UTC)
 */
export const initReminderEngine = (bot) => {
  registerJob('daily-reminder-check', '0 0 * * *', async () => {
    logger.info('Daily reminder check triggered');

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
        // Log the reminder
        await dbService.logReminder(reminder.id, message);

        // Update next_due
        if (reminder.interval_days) {
          await dbService.updateReminderNextDue(reminder.id, reminder.interval_days);
        } else {
          // One-time reminder
          await dbService.deactivateReminder(reminder.id);
        }

        logger.info('Reminder processed successfully', {
          reminderId: reminder.id,
          type: reminder.type,
        });
      }
    }
  });
};

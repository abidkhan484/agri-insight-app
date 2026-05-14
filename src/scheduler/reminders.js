import db from '../db/connection.js';
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

    const dueReminders = db
      .prepare(
        `
      SELECT r.*, p.name AS plot_name, p.area_decimal, f.telegram_id, f.id AS farmer_id
      FROM reminders r
      JOIN plots p ON r.plot_id = p.id
      JOIN farmers f ON p.farmer_id = f.id
      WHERE r.active = 1 AND r.next_due <= date('now')
    `,
      )
      .all();

    logger.info(`Found ${dueReminders.length} due reminders`);

    for (const reminder of dueReminders) {
      let message = '';

      switch (reminder.type) {
        case 'jeevamrutha': {
          const batch = calculateJeevamrutha(reminder.area_decimal);
          message = formatJeevamruthaMessage(reminder.plot_name, batch);
          break;
        }
        case 'neemastra': {
          const batch = calculateNeemastra(reminder.area_decimal);
          message = formatNeemastraMessage(reminder.plot_name, batch);
          break;
        }
        case 'mulch': {
          message = formatMulchMessage(reminder.plot_name);
          break;
        }
        case 'irrigation': {
          message = `☀️ ${reminder.plot_name} জমিতে মাটির আর্দ্রতা পরীক্ষা করুন।\nCheck soil moisture in ${reminder.plot_name} field today.`;
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

      const sent = await NotificationService.send(bot, reminder.telegram_id, message);

      if (sent) {
        // Log the reminder
        db.prepare(
          `
          INSERT INTO reminder_logs (reminder_id, message)
          VALUES (?, ?)
        `,
        ).run(reminder.id, message);

        // Update next_due
        if (reminder.interval_days) {
          const nextDue = new Date();
          nextDue.setDate(nextDue.getDate() + reminder.interval_days);
          db.prepare(
            `
            UPDATE reminders
            SET next_due = ?, active = ?
            WHERE id = ?
          `,
          ).run(nextDue.toISOString().split('T')[0], 1, reminder.id);
        } else {
          // One-time reminder
          db.prepare(
            `
            UPDATE reminders SET active = 0 WHERE id = ?
          `,
          ).run(reminder.id);
        }

        logger.info('Reminder processed successfully', {
          reminderId: reminder.id,
          type: reminder.type,
        });
      }
    }
  });
};

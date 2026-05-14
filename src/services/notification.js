import logger from '../config/logger.js';

/**
 * Notification Service abstraction
 */
export const NotificationService = {
  /**
   * Send notification to a farmer
   * @param {object} bot - Telegraf bot instance
   * @param {string|number} telegramId - Farmer's Telegram ID
   * @param {string} message - Message to send
   * @returns {Promise<boolean>}
   */
  async send(bot, telegramId, message) {
    if (telegramId) {
      try {
        await bot.telegram.sendMessage(telegramId, message);
        logger.debug('Notification sent via Telegram', { telegramId });
        return true;
      } catch (error) {
        logger.error('Failed to send Telegram notification', { telegramId, error });
        return false;
      }
    }

    logger.warn('No Telegram ID provided for notification. SMS fallback not implemented.');
    return false;
  },
};

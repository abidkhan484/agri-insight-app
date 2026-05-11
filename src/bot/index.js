import { Telegraf } from 'telegraf';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

if (!config.botToken) {
  logger.error('BOT_TOKEN is missing in configuration. Exiting...');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

// /start command
bot.start((ctx) => {
  const welcomeMessage = `স্বাগতম! আমি আপনার কৃষি সহকারী।
Welcome! I am your agricultural assistant.`;

  logger.info('Start command received', { chat_id: 'chat:' + ctx.chat.id });
  return ctx.reply(welcomeMessage);
});

// /help command
bot.help((ctx) => {
  const helpMessage = `সাহায্য প্রয়োজন? বর্তমানে আমি এই কমান্ডগুলো বুঝি:
/start - শুরু করুন
/help - সাহায্য

Need help? Currently I understand:
/start - Start the bot
/help - Show help`;

  logger.info('Help command received', { chat_id: 'chat:' + ctx.chat.id });
  return ctx.reply(helpMessage);
});

// Global error handling
bot.catch((err, ctx) => {
  logger.error('Telegraf error', { err, updateType: ctx.updateType });
});

// Launch bot
bot
  .launch()
  .then(() => {
    logger.info('Telegram bot launched successfully');
  })
  .catch((err) => {
    logger.error('Failed to launch Telegram bot', err);
    process.exit(1);
  });

// Enable graceful stop
process.once('SIGINT', () => {
  logger.info('SIGINT received. Stopping bot...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  logger.info('SIGTERM received. Stopping bot...');
  bot.stop('SIGTERM');
});

import { Telegraf, Scenes, session } from 'telegraf';
import { config } from '../config/index.js';
import logger from '../config/logger.js';
import db from '../db/connection.js';
import { registerWizard } from './scenes/register.js';
import { initPlotCommands } from './commands/plots.js';
import { initReminderCommands } from './commands/reminders.js';
import { registerSoilstatusCommand } from './commands/soilstatus.js';
import { registerAskCommand } from './commands/ask.js';
import { initReminderEngine } from '../scheduler/reminders.js';
import { initWeatherAlertEngine } from '../scheduler/weather-alerts.js';

if (!config.botToken) {
  logger.error('BOT_TOKEN is missing in configuration. Exiting...');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

// Middleware
const stage = new Scenes.Stage([registerWizard]);
bot.use(session());
bot.use(stage.middleware());

// /start command
bot.start((ctx) => {
  const telegramId = ctx.from.id.toString();
  const name = ctx.from.first_name || 'Farmer';

  logger.info('Start command received', { chat_id: 'chat:' + ctx.chat.id, telegramId });

  // Register farmer if not exists
  try {
    const farmer = db.prepare('SELECT id FROM farmers WHERE telegram_id = ?').get(telegramId);
    if (!farmer) {
      db.prepare('INSERT INTO farmers (telegram_id, name) VALUES (?, ?)').run(telegramId, name);
      logger.info('New farmer registered', { telegramId, name });
    }
  } catch (error) {
    logger.error('Failed to register farmer on start', { error, telegramId });
  }

  const welcomeMessage = `স্বাগতম ${name}! আমি আপনার কৃষি সহকারী।
Welcome ${name}! I am your agricultural assistant.

আমি আপনাকে প্রাকৃতিক কৃষি (ZBNF) পদ্ধতিতে চাষাবাদে সাহায্য করব। শুরু করতে নিচের কমান্ডগুলো ব্যবহার করুন:

/register - নতুন জমি নিবন্ধিত করুন
/myplots - আপনার জমিগুলো দেখুন
/myreminders - আপনার রিমাইন্ডারগুলো দেখুন
/help - সব কমান্ডের তালিকা দেখুন`;

  return ctx.reply(welcomeMessage);
});

// /register command
bot.command('register', (ctx) => ctx.scene.enter('REGISTER_PLOT_SCENE'));

// Initialize Commands
initPlotCommands(bot);
initReminderCommands(bot);
registerSoilstatusCommand(bot, db);
registerAskCommand(bot, db);

// Initialize Reminder Engine
initReminderEngine(bot);

// Initialize Weather Alert Engine
initWeatherAlertEngine(bot);

// /help command
bot.help((ctx) => {
  const helpMessage = `সাহায্য প্রয়োজন? আমি এই কমান্ডগুলো বুঝি:
/start - শুরু করুন
/register - জমি নিবন্ধিত করুন
/myplots - আপনার জমিগুলো দেখুন
/deleteplot <নাম> - জমি মুছে ফেলুন
/remind - রিমাইন্ডার সেট করুন
/myreminders - রিমাইন্ডার তালিকা
/cancelreminder <ID> - রিমাইন্ডার বাতিল করুন
/soilstatus - মাটির অবস্থা দেখুন
/ask <প্রশ্ন> - AI সহকারীকে প্রশ্ন করুন (ZBNF)

Need help? I understand:
/start - Start the bot
/register - Register a new plot
/myplots - List your plots
/deleteplot <নাম> - Remove a plot
/remind - Set custom reminders
/myreminders - List active reminders
/cancelreminder <ID> - Cancel a reminder
/soilstatus - Check soil moisture status
/ask <question> - Ask AI Assistant (ZBNF)


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

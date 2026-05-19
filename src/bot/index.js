import { Telegraf, Scenes, session } from 'telegraf';
import http from 'http';
import { config } from '../config/index.js';
import logger from '../config/logger.js';
import { dbService } from '../db/service.js';
import { registerWizard } from './scenes/register.js';
import { initPlotCommands } from './commands/plots.js';
import { initReminderCommands } from './commands/reminders.js';
import { registerSoilstatusCommand } from './commands/soilstatus.js';
import { registerAskCommand } from './commands/ask.js';
import { registerJoinmapCommand } from './commands/joinmap.js';
import { registerFaqCommand } from './commands/faq.js';
import { registerCommunityCommands } from './commands/community.js';
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
bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const name = ctx.from.first_name || 'Farmer';

  logger.info('Start command received', { chat_id: 'chat:' + ctx.chat.id, telegramId });

  // Register farmer if not exists
  try {
    const farmer = await dbService.getFarmerByTelegramId(telegramId);
    if (!farmer) {
      await dbService.registerFarmer(telegramId, name);
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
registerSoilstatusCommand(bot);
registerAskCommand(bot);
registerJoinmapCommand(bot);
registerFaqCommand(bot);
registerCommunityCommands(bot);

// Initialize Reminder Engine
initReminderEngine(bot);

// Initialize Weather Alert Engine
initWeatherAlertEngine(bot);

// /help command
bot.help((ctx) => {
  const helpMessage = `সাহায্য প্রয়োজন? আমি এই কমান্ডগুলো বুঝি:
/start - शुरू করুন
/register - জমি নিবন্ধিত করুন
/myplots - আপনার জমিগুলো দেখুন
/deleteplot <নাম> - জমি মুছে ফেলুন
/remind - রিমাইন্ডার সেট করুন
/myreminders - রিমাইন্ডার তালিকা
/cancelreminder <ID> - রিমাইন্ডার বাতিল করুন
/soilstatus - মাটির অবস্থা দেখুন
/ask <প্রশ্ন> - AI সহকারীকে প্রশ্ন করুন (ZBNF)
/joinmap - কৃষক মানচিত্রে যোগ দিন
/faq <প্রশ্ন> - সচরাচর জিজ্ঞাসিত প্রশ্নাবলী
/registercow - দেশি গরু সরবরাহকারী হিসেবে নাম লিখুন
/findcow <জেলা> - গরু সরবরাহকারী খুঁজুন
/reportpest <বর্ণনা> - আপনার এলাকায় পোকার খবর দিন

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
/joinmap - Join the community map
/faq <query> - Search FAQ database
/registercow - Register as desi cow supplier
/findcow <district> - Find cow suppliers
/reportpest <desc> - Report pest alert in your area`;

  logger.info('Help command received', { chat_id: 'chat:' + ctx.chat.id });
  return ctx.reply(helpMessage);
});

// Global error handling
bot.catch((err, ctx) => {
  logger.error('Telegraf error', { err, updateType: ctx.updateType });
});

// Start dummy HTTP server for Render health checks immediately
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
}).listen(config.port, () => {
  logger.info(`Health check server listening on port ${config.port}`);
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

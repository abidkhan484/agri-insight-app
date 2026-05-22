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
import { diseaseScene } from './commands/disease.js';
import { initReminderEngine } from '../scheduler/reminders.js';
import { initWeatherAlertEngine } from '../scheduler/weather-alerts.js';
import { validateTelegramInitData, generateSupabaseJWT, parseTelegramUser } from '../services/auth.js';

if (!config.botToken) {
  logger.error('BOT_TOKEN is missing in configuration. Exiting...');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

// Middleware
const stage = new Scenes.Stage([registerWizard, diseaseScene]);
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

// /disease command
bot.command('disease', (ctx) => ctx.scene.enter('DISEASE_SCENE'));

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
/start - শুরু করুন
/register - জমি নিবন্ধিত করুন
/myplots - আপনার জমিগুলো দেখুন
/deleteplot <নাম> - জমি মুছে ফেলুন
/remind - রিমাইন্ডার সেট করুন
/myreminders - রিমাইন্ডার তালিকা
/cancelreminder <ID> - রিমাইন্ডার বাতিল করুন
/soilstatus - মাটির অবস্থা দেখুন
/disease - ফসলের রোগ শনাক্তকরণ
/ask <প্রশ্ন> - AI সহকারীকে প্রশ্ন করুন (ZBNF)
/joinmap - কৃষক মানচিত্রে যোগ দিন
/faq <প্রশ্ন> - সচরাচর জিজ্ঞাসিত প্রশ্নাবলী
/registercow - দেশি গরু সরবরাহকারী হিসেবে নাম লিখুন
/findcow <জেলা> - গরু সরবরাহকারী খুঁজুন
/reportpest <বর্ণনা> - আপনার এলাকায় পোকার খবর দিন
/help - সব কমান্ডের তালিকা দেখুন

Need help? I understand:
/start - Start the bot
/register - Register a new plot
/myplots - List your plots
/deleteplot <নাম> - Remove a plot
/remind - Set custom reminders
/myreminders - List active reminders
/cancelreminder <ID> - Cancel a reminder
/soilstatus - Check soil moisture status
/disease - Identify crop disease from photo
/ask <question> - Ask AI Assistant (ZBNF)
/joinmap - Join the community map
/faq <query> - Search FAQ database
/registercow - Register as desi cow supplier
/findcow <district> - Find cow suppliers
/reportpest <desc> - Report pest alert in your area
/help - Show this help message`;

  logger.info('Help command received', { chat_id: 'chat:' + ctx.chat.id });
  return ctx.reply(helpMessage);
});

// Global error handling
bot.catch((err, ctx) => {
  logger.error('Telegraf error', { err, updateType: ctx.updateType });
});

// Start HTTP server for Render health checks and TMA Auth
http
  .createServer(async (req, res) => {
    // Basic Request Logging (Level: Info for visibility)
    logger.info(`Incoming request: ${req.method} ${req.url}`);

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Robust path normalization: 
    // 1. Get path without query string
    // 2. Normalize slashes (collapse // and remove trailing)
    const rawPath = req.url.split('?')[0];
    const normalizedPath = rawPath.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';

    // TMA Authentication Endpoint
    if (normalizedPath === '/api/auth/telegram' || normalizedPath.endsWith('/api/auth/telegram')) {
      if (req.method !== 'POST') {
        logger.warn(`Auth endpoint hit with invalid method: ${req.method}`);
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
        return;
      }

      logger.info('Auth endpoint hit (POST)', { path: req.url, normalized: normalizedPath });
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { initData } = JSON.parse(body);

          if (!validateTelegramInitData(initData)) {
            logger.warn('TMA Auth Failed: Invalid initData');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid Telegram data' }));
            return;
          }

          const user = parseTelegramUser(initData);
          if (!user || !user.id) {
            logger.warn('TMA Auth Failed: Missing user data');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid user data' }));
            return;
          }

          const token = generateSupabaseJWT(user.id);

          logger.info('TMA Auth Success', { telegramId: user.id });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              token,
              user: {
                id: user.id,
                first_name: user.first_name,
                language_code: user.language_code,
              },
            }),
          );
        } catch (error) {
          logger.error('TMA Auth Error', { error: error.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
      return;
    }

    // Health check
    if (normalizedPath === '/health' || normalizedPath === '/') {
      res.writeHead(200);
      res.end('Bot is running');
      return;
    }

    // Catch-all 404 with logging
    logger.warn(`404 Not Found: ${req.method} ${req.url} (normalized: ${normalizedPath})`);
    res.writeHead(404);
    res.end();
  })
  .listen(config.port, () => {
    logger.info(`Server listening on port ${config.port}`);
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

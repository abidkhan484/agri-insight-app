import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN,
  dbPath: process.env.DB_PATH || './data/agri.sqlite',
  timezone: process.env.TIMEZONE || 'Asia/Dhaka',
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
};

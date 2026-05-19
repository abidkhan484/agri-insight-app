import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN,
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  dbPath: process.env.DB_PATH || './data/agri.sqlite',
  timezone: process.env.TIMEZONE || 'Asia/Dhaka',
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  aiApiUrl: process.env.AI_API_URL || 'http://localhost:5000',
  port: process.env.PORT || 5000,
};

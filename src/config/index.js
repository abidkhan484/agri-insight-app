import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve path to the root .env file (two levels up from src/config)
const rootEnvPath = path.resolve(__dirname, '../../.env');

// Load environment variables from the root .env file
dotenv.config({ path: rootEnvPath });

// Also load from current working directory as fallback
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN,
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-key-with-at-least-32-characters-long',
  dbName: process.env.DB_NAME || 'postgres',
  dbPath: process.env.DB_PATH || './data/agri.sqlite',
  timezone: process.env.TIMEZONE || 'Asia/Dhaka',
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  aiApiUrl: process.env.AI_API_URL || 'http://localhost:5000',
  krishiRecordUrl: process.env.KRISHI_RECORD_URL || 'http://localhost:5173',
  mapPwaUrl: process.env.MAP_PWA_URL || 'http://localhost:5174',
  port: process.env.PORT || 5000,
  plantnetApiKey: process.env.PLANTNET_API_KEY,
};

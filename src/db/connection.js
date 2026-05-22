import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

if (!config.supabaseUrl || !config.supabaseKey) {
  logger.error('Missing Supabase credentials in configuration');
}

const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    persistSession: false,
  },
});

logger.info('Supabase client initialized', { url: config.supabaseUrl });

export default supabase;

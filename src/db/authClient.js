import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  logger.warn(
    'Supabase Auth client: VITE_SUPABASE_ANON_KEY is not set — email/password auth will not work.',
    { supabaseUrl: !!config.supabaseUrl, supabaseAnonKey: !!config.supabaseAnonKey },
  );
}

/**
 * Supabase client initialised with the ANON key.
 * Used exclusively for Supabase Auth operations (sign-up / sign-in).
 * For all DB operations the service-role client in db/connection.js is used.
 */
const supabaseAuth = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey, // must be the anon (public) key — never the service-role key
  {
    auth: {
      persistSession: false,
    },
  },
);

export default supabaseAuth;

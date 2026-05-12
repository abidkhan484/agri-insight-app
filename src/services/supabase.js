import { createClient } from '@supabase/supabase-js';
import logger from '../config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role — never expose

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error('Missing Supabase credentials in .env');
  // Don't exit process here to allow bot to run even if Supabase is down
}

export const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * Register a farmer's location visible on the public map.
 * Note: we store district/upazila — not precise GPS to protect privacy.
 */
export async function registerFarmerLocation({ displayName, district, upazila, lat, lon, crops }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Validate Bangladesh coordinate bounds
  if (lat < 20.5 || lat > 26.7 || lon < 88.0 || lon > 92.7) {
    throw new Error('Coordinates outside Bangladesh bounds');
  }

  const { error } = await supabase.from('farmer_locations').insert({
    display_name: displayName,
    district,
    upazila,
    latitude: lat,
    longitude: lon,
    crops,
  });

  if (error) {
    logger.error('farmer_location_insert_failed', { error: error.message });
    throw error;
  }
  logger.info('farmer_location_registered', { district, upazila });
}

export async function getFarmerLocations() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('farmer_locations')
    .select('display_name, district, upazila, latitude, longitude, crops, joined_at')
    .order('joined_at', { ascending: false })
    .limit(500);

  if (error) {
    logger.error('farmer_locations_fetch_failed', { error: error.message });
    return [];
  }
  return data;
}

export async function searchFAQ(query) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('faq_entries')
    .select('question_bn, question_en, answer_bn, answer_en, category')
    .or(`question_bn.ilike.%${query}%,answer_bn.ilike.%${query}%`)
    .order('upvotes', { ascending: false })
    .limit(3);

  if (error) {
    logger.error('faq_search_failed', { error: error.message });
    return [];
  }
  return data;
}

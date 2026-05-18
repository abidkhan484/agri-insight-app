-- ZBNF Farming Assistant — PostgreSQL Schema (Supabase)

-- Enable PostGIS for mapping features
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT,
  district TEXT,
  upazila TEXT,
  has_desi_cow BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Plots Table
CREATE TABLE IF NOT EXISTS plots (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_decimal NUMERIC NOT NULL,
  soil_type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  crop TEXT,
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  type TEXT NOT NULL,          -- 'jeevamrutha' | 'mulch' | 'neemastra' | 'irrigation' | 'custom'
  interval_days INTEGER,       -- NULL for one-time
  next_due DATE NOT NULL,
  description TEXT,            -- for custom reminders
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Reminder Logs Table
CREATE TABLE IF NOT EXISTS reminder_logs (
  id SERIAL PRIMARY KEY,
  reminder_id INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent',
  message TEXT
);

-- 5. Weather Alerts Table
CREATE TABLE IF NOT EXISTS weather_alerts (
  id SERIAL PRIMARY KEY,
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  forecast_data JSONB,        -- JSON blob for flexibility
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Soil Readings Table (for IoT)
CREATE TABLE IF NOT EXISTS soil_readings (
  id SERIAL PRIMARY KEY,
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  moisture DOUBLE PRECISION NOT NULL,
  temp DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  alert_level TEXT DEFAULT 'OK', -- 'OK', 'WARN', 'CRITICAL'
  ts TIMESTAMPTZ DEFAULT now()
);

-- 7. Map Registrations (Internal Bot Tracking)
CREATE TABLE IF NOT EXISTS map_registrations (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Community Farmer Locations (Public Map)
CREATE TABLE IF NOT EXISTS farmer_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  crop_type TEXT,
  method TEXT DEFAULT 'ZBNF',
  has_cow BOOLEAN DEFAULT false,
  location GEOGRAPHY(POINT),
  latitude DOUBLE PRECISION, -- Stored redundantly for simpler Leaflet access
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Pest Alerts Table
CREATE TABLE IF NOT EXISTS pest_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pest_name TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  reported_at TIMESTAMPTZ DEFAULT now()
);

-- 10. FAQ Table
CREATE TABLE IF NOT EXISTS faq_entries (
  id SERIAL PRIMARY KEY,
  category TEXT,
  question_bn TEXT NOT NULL,
  question_en TEXT,
  answer_bn TEXT NOT NULL,
  answer_en TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- RLS Policies (Optional but recommended for Supabase)
-- ------------------------------------------------------------------------------

-- Enable RLS on Public Tables
ALTER TABLE farmer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to Map and FAQ
CREATE POLICY "Public Read Locations" ON farmer_locations FOR SELECT USING (true);
CREATE POLICY "Public Read Pest Alerts" ON pest_alerts FOR SELECT USING (true);
CREATE POLICY "Public Read FAQ" ON faq_entries FOR SELECT USING (true);

-- Note: The Bot (using Service Role Key) will bypass RLS for private tables.

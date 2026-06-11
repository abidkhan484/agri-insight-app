-- ZBNF Farming Assistant — PostgreSQL Schema (Supabase)

-- Enable PostGIS for mapping features
CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------------------------
-- 0. Shared Helpers
-- ------------------------------------------------------------------------------

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ------------------------------------------------------------------------------
-- 1. Farmers Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  telegram_id TEXT UNIQUE,          -- nullable for email-only accounts
  auth_user_id UUID UNIQUE,         -- Supabase Auth user id (email/password accounts)
  email TEXT,                       -- email address (for email/password accounts)
  name TEXT,
  district TEXT,
  upazila TEXT,
  has_desi_cow BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  -- Ensure at least one identity is set
  CONSTRAINT farmers_has_identity CHECK (telegram_id IS NOT NULL OR auth_user_id IS NOT NULL)
);

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON plots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  type TEXT NOT NULL,          -- 'jeevamrutha' | 'mulch' | 'neemastra' | 'irrigation' | 'custom'
  interval_days INTEGER,       -- NULL for one-time
  next_due DATE NOT NULL,
  description TEXT,            -- for custom reminders
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- 11. Input Logs (New for Krishi-Record PWA)
CREATE TABLE IF NOT EXISTS input_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  quantity NUMERIC,
  quantity_unit TEXT,
  cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE TRIGGER update_input_logs_updated_at BEFORE UPDATE ON input_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Observations (New for Krishi-Record PWA)
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE TRIGGER update_observations_updated_at BEFORE UPDATE ON observations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Harvests (New for Krishi-Record PWA)
CREATE TABLE IF NOT EXISTS harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  crop TEXT NOT NULL,
  quantity NUMERIC,
  quantity_unit TEXT,
  revenue NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE TRIGGER update_harvests_updated_at BEFORE UPDATE ON harvests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- ZBNF Automated Scheduler (Triggers)
-- ------------------------------------------------------------------------------

-- Function to seed default ZBNF reminders for a new plot
CREATE OR REPLACE FUNCTION seed_plot_reminders()
RETURNS TRIGGER AS $$
BEGIN
    -- Jeevamrutha: Every 15 days
    INSERT INTO reminders (plot_id, type, interval_days, next_due, description)
    VALUES (NEW.id, 'jeevamrutha', 15, NEW.start_date + INTERVAL '15 days', 'Apply Jeevamrutha to soil');

    -- Neemastra: Every 14 days
    INSERT INTO reminders (plot_id, type, interval_days, next_due, description)
    VALUES (NEW.id, 'neemastra', 14, NEW.start_date + INTERVAL '14 days', 'Preventive Neemastra spray');

    -- Mulch: Every 7 days
    INSERT INTO reminders (plot_id, type, interval_days, next_due, description)
    VALUES (NEW.id, 'mulch', 7, NEW.start_date + INTERVAL '7 days', 'Check and replenish mulching');

    -- Irrigation: Every 3 days (default Whapasa window)
    INSERT INTO reminders (plot_id, type, interval_days, next_due, description)
    VALUES (NEW.id, 'irrigation', 3, NEW.start_date + INTERVAL '3 days', 'Standard Whapasa irrigation check');

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_plot_created
AFTER INSERT ON plots
FOR EACH ROW EXECUTE FUNCTION seed_plot_reminders();

-- ------------------------------------------------------------------------------
-- RLS Policies
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE input_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pest_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;

-- 1. Public Tables (Read All)
CREATE POLICY "Public Read Locations" ON farmer_locations FOR SELECT USING (true);
CREATE POLICY "Public Read Pest Alerts" ON pest_alerts FOR SELECT USING (true);
CREATE POLICY "Public Read FAQ" ON faq_entries FOR SELECT USING (true);

-- Migration helper: add new columns to existing deployments
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS email TEXT;
-- Remove NOT NULL from telegram_id if it exists (safe on re-run)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='farmers' AND column_name='telegram_id'
    AND is_nullable='NO'
  ) THEN
    ALTER TABLE farmers ALTER COLUMN telegram_id DROP NOT NULL;
  END IF;
END $$;

-- 2. Farmer-Specific Tables (Owner Only)
-- Access is granted if the JWT's 'telegram_id' claim matches (Telegram auth)
-- OR if auth.uid() matches the auth_user_id column (email/password auth).

CREATE POLICY "Farmers: Owner Read/Update" ON farmers
  FOR ALL USING (
    telegram_id = auth.jwt() ->> 'telegram_id'
    OR auth_user_id = auth.uid()
  );

CREATE POLICY "Plots: Owner Access" ON plots
  FOR ALL USING (
    farmer_id IN (
      SELECT id FROM farmers
      WHERE telegram_id = auth.jwt() ->> 'telegram_id'
         OR auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Reminders: Owner Access" ON reminders
  FOR ALL USING (
    plot_id IN (
      SELECT id FROM plots WHERE farmer_id IN (
        SELECT id FROM farmers
        WHERE telegram_id = auth.jwt() ->> 'telegram_id'
           OR auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Logs: Owner Access" ON reminder_logs
  FOR ALL USING (
    reminder_id IN (
      SELECT id FROM reminders WHERE plot_id IN (
        SELECT id FROM plots WHERE farmer_id IN (
          SELECT id FROM farmers
          WHERE telegram_id = auth.jwt() ->> 'telegram_id'
             OR auth_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Weather: Owner Access" ON weather_alerts
  FOR ALL USING (
    plot_id IN (
      SELECT id FROM plots WHERE farmer_id IN (
        SELECT id FROM farmers
        WHERE telegram_id = auth.jwt() ->> 'telegram_id'
           OR auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Soil: Owner Access" ON soil_readings
  FOR ALL USING (
    plot_id IN (
      SELECT id FROM plots WHERE farmer_id IN (
        SELECT id FROM farmers
        WHERE telegram_id = auth.jwt() ->> 'telegram_id'
           OR auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Inputs: Owner Access" ON input_logs
  FOR ALL USING (
    plot_id IN (
      SELECT id FROM plots WHERE farmer_id IN (
        SELECT id FROM farmers
        WHERE telegram_id = auth.jwt() ->> 'telegram_id'
           OR auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Observations: Owner Access" ON observations
  FOR ALL USING (
    plot_id IN (
      SELECT id FROM plots WHERE farmer_id IN (
        SELECT id FROM farmers
        WHERE telegram_id = auth.jwt() ->> 'telegram_id'
           OR auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Harvests: Owner Access" ON harvests
  FOR ALL USING (
    plot_id IN (
      SELECT id FROM plots WHERE farmer_id IN (
        SELECT id FROM farmers
        WHERE telegram_id = auth.jwt() ->> 'telegram_id'
           OR auth_user_id = auth.uid()
      )
    )
  );

-- Note: The Bot (using Service Role Key) will bypass RLS for private tables.


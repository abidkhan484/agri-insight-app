-- ==============================================================================
-- Migration: Add email/password auth support to farmers table
-- Apply this to your Supabase project via the SQL Editor if the schema was
-- already deployed without these columns.
-- ==============================================================================

-- 1. Add new columns (idempotent — safe to run multiple times)
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Make telegram_id nullable (it is NOT NULL by default in the original schema).
--    Email-only accounts won't have a Telegram ID.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'farmers'
      AND column_name = 'telegram_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE farmers ALTER COLUMN telegram_id DROP NOT NULL;
  END IF;
END $$;

-- 3. Add a CHECK constraint ensuring every row has at least one identity.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farmers_has_identity'
  ) THEN
    ALTER TABLE farmers
      ADD CONSTRAINT farmers_has_identity
      CHECK (telegram_id IS NOT NULL OR auth_user_id IS NOT NULL);
  END IF;
END $$;

-- 4. Drop and recreate RLS policies to support both auth methods.
--    Telegram auth: JWT contains 'telegram_id' custom claim.
--    Email auth: auth.uid() matches auth_user_id column.

-- Farmers
DROP POLICY IF EXISTS "Farmers: Owner Read/Update" ON farmers;
CREATE POLICY "Farmers: Owner Read/Update" ON farmers
  FOR ALL USING (
    telegram_id = auth.jwt() ->> 'telegram_id'
    OR auth_user_id = auth.uid()
  );

-- Plots
DROP POLICY IF EXISTS "Plots: Owner Access" ON plots;
CREATE POLICY "Plots: Owner Access" ON plots
  FOR ALL USING (
    farmer_id IN (
      SELECT id FROM farmers
      WHERE telegram_id = auth.jwt() ->> 'telegram_id'
         OR auth_user_id = auth.uid()
    )
  );

-- Reminders
DROP POLICY IF EXISTS "Reminders: Owner Access" ON reminders;
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

-- Reminder Logs
DROP POLICY IF EXISTS "Logs: Owner Access" ON reminder_logs;
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

-- Weather Alerts
DROP POLICY IF EXISTS "Weather: Owner Access" ON weather_alerts;
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

-- Soil Readings
DROP POLICY IF EXISTS "Soil: Owner Access" ON soil_readings;
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

-- Input Logs
DROP POLICY IF EXISTS "Inputs: Owner Access" ON input_logs;
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

-- Observations
DROP POLICY IF EXISTS "Observations: Owner Access" ON observations;
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

-- Harvests
DROP POLICY IF EXISTS "Harvests: Owner Access" ON harvests;
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

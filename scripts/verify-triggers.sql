-- Verification Script for ZBNF Automated Scheduler Triggers
-- Run this in the Supabase SQL Editor to verify the triggers are working correctly.

-- 1. Create a dummy farmer
INSERT INTO farmers (telegram_id, name, district, upazila)
VALUES ('test-farmer-999', 'Test Farmer', 'Dhaka', 'Savar')
ON CONFLICT (telegram_id) DO NOTHING;

-- 2. Create a dummy plot
-- This should trigger 'on_plot_created' and seed the 'reminders' table.
INSERT INTO plots (farmer_id, name, area_decimal, crop, start_date)
SELECT id, 'Test Integration Plot', 33, 'Rice', '2024-06-01'
FROM farmers WHERE telegram_id = 'test-farmer-999'
RETURNING id;

-- 3. Verify reminders were created automatically
-- Should see 4 reminders (Jeevamrutha, Neemastra, Mulch, Irrigation)
SELECT p.name as plot_name, r.type, r.next_due, r.interval_days
FROM reminders r
JOIN plots p ON r.plot_id = p.id
WHERE p.name = 'Test Integration Plot';

-- 4. Cleanup
-- (Optional: Uncomment to delete the test data)
-- DELETE FROM plots WHERE name = 'Test Integration Plot';
-- DELETE FROM farmers WHERE telegram_id = 'test-farmer-999';

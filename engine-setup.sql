-- engine-setup.sql
-- Run ONCE in the Supabase SQL Editor for the adaptive booking engine (Prompt E).
-- Additive and safe to run more than once (uses IF NOT EXISTS).
--
-- Existing columns reused (already present): name, email, phone, service,
-- requested_date, requested_time, price_kyd, status, calendar_event_id,
-- calendar_synced_at. The columns below capture the new category/option model.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS category_id      text,
  ADD COLUMN IF NOT EXISTS category_label   text,
  ADD COLUMN IF NOT EXISTS option_id        text,
  ADD COLUMN IF NOT EXISTS option_name      text,
  ADD COLUMN IF NOT EXISTS booking_mode     text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS selected_weeks   jsonb,   -- array of week ids, nullable (weeks mode)
  ADD COLUMN IF NOT EXISTS level            text;    -- level label, nullable (level mode)

-- requested_date / requested_time are now nullable (only set for 'datetime' mode).
-- These will already be nullable on existing installs; included for new tables.
ALTER TABLE bookings ALTER COLUMN requested_date DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN requested_time DROP NOT NULL;

-- Helpful for filtering bookings by mode in the dashboard.
CREATE INDEX IF NOT EXISTS bookings_booking_mode_idx ON bookings (booking_mode);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('category_id','category_label','option_id','option_name',
                      'booking_mode','duration_minutes','selected_weeks','level')
ORDER BY column_name;

-- calendar-setup.sql
-- Run this ONCE in the Supabase SQL Editor before running Prompt 4.
-- Adds the columns needed to track each booking's Google Calendar event.
-- Safe to run more than once (uses IF NOT EXISTS).

-- 1. The ID of the event created in the business owner's Google Calendar.
--    Used for idempotency (don't double-create) and for future cancel/reschedule sync.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS calendar_event_id text;

-- 2. When the calendar event was successfully created.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS calendar_synced_at timestamptz;

-- 3. Helpful index: quickly find confirmed bookings that haven't been synced yet.
CREATE INDEX IF NOT EXISTS idx_bookings_unsynced
  ON bookings (status)
  WHERE calendar_event_id IS NULL;

-- Verify (optional — run separately to inspect):
-- select column_name, data_type
-- from information_schema.columns
-- where table_name = 'bookings'
--   and column_name in ('calendar_event_id', 'calendar_synced_at');

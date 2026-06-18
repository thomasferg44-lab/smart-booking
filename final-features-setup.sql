-- final-features-setup.sql
-- Run ALL of this in Supabase SQL Editor before your live pass.
-- Safe to run more than once (IF NOT EXISTS / IF NOT EXISTS columns).

-- 1. Lesson pack + discount code columns on bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lesson_pack text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_code text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_pct integer;

-- 2. Lesson tracker table
CREATE TABLE IF NOT EXISTS lesson_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid REFERENCES bookings(id) ON DELETE CASCADE,
  client_email  text NOT NULL,
  lesson_date   date NOT NULL,
  lessons_count integer NOT NULL DEFAULT 1,
  notes         text,
  logged_at     timestamptz DEFAULT now(),
  logged_by     text DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_lesson_logs_email
  ON lesson_logs (client_email);

CREATE INDEX IF NOT EXISTS idx_lesson_logs_booking
  ON lesson_logs (booking_id);

-- supabase-admin-setup.sql
-- Run this ONCE in the Supabase SQL editor for the booking project.
-- It is safe to run even if these already exist (uses IF NOT EXISTS where possible).
-- The dashboard needs: a status column with a default, and an index for fast ordering.

-- 1. Ensure the status column exists with a sane default.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- 2. Constrain status to the three allowed values (drop first so re-runs don't error).
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled'));

-- 3. Index for "newest first" ordering and for status filtering.
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_status_idx     ON bookings (status);

-- Note: the admin Netlify functions use the SERVICE ROLE key, which bypasses
-- Row Level Security, so no RLS policy changes are required for the dashboard.
-- The service key never touches the frontend — it lives only in Netlify env vars.

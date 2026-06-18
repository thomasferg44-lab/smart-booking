-- lesson-location-setup.sql
-- Run ONCE in the Supabase SQL Editor for the Private Lessons location feature.
-- Additive and safe to run more than once (uses IF NOT EXISTS).
-- Stores which location a Private Lessons booking is for (Lion's Pool / Beach / own pool).

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lesson_location text;

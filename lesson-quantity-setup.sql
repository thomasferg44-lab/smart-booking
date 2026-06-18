-- lesson-quantity-setup.sql
-- Run ONCE in the Supabase SQL Editor for the Private Lessons quantity feature.
-- Additive and safe to run more than once (uses IF NOT EXISTS).
-- Stores how many lessons a Private Lessons booking is for (default 1).

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lesson_quantity integer DEFAULT 1;

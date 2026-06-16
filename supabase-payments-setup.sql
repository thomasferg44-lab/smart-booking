-- supabase-payments-setup.sql
-- Run ONCE in the Supabase SQL editor for the auto-booking project.
-- Safe to run even if columns already exist.

-- 1. Add payment tracking columns to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS price_kyd      numeric(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_date   date,
  ADD COLUMN IF NOT EXISTS payment_method text;

-- 2. Constrain payment_status to allowed values
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('unpaid', 'paid'));

-- 3. Constrain payment_method to allowed values (nullable)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('cash', 'bank_transfer', 'other'));

-- 4. Index for payment status filtering
CREATE INDEX IF NOT EXISTS bookings_payment_status_idx ON bookings (payment_status);

-- 5. Update any existing bookings to have unpaid status (they were created before this feature)
UPDATE bookings SET payment_status = 'unpaid' WHERE payment_status IS NULL;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('price_kyd', 'payment_status', 'payment_date', 'payment_method')
ORDER BY column_name;

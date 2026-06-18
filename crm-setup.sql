-- crm-setup.sql
-- Run ONCE in Supabase SQL Editor before running Prompt 4.
-- Creates the clients table for owner notes + tags only.
-- All other client data is derived live from the bookings table.

CREATE TABLE IF NOT EXISTS clients (
  email        text PRIMARY KEY,
  notes        text,
  tags         text[] DEFAULT '{}',
  updated_at   timestamptz DEFAULT now()
);

-- Index for fast tag filtering (future use)
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN (tags);

-- Verify (run separately if you want to inspect):
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'clients';

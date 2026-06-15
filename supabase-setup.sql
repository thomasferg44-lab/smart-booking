create table if not exists bookings (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text,
  service       text not null,
  requested_date date not null,
  requested_time text not null,
  intake_data   jsonb default '{}'::jsonb,
  notes         text,
  status        text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'cancelled')),
  created_at    timestamptz not null default now()
);

create index if not exists bookings_status_idx on bookings(status);
create index if not exists bookings_date_idx on bookings(requested_date);
create index if not exists bookings_email_idx on bookings(email);

alter table bookings enable row level security;

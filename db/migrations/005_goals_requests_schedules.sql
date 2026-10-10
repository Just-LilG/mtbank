-- Savings goals, payment requests, scheduled transfers. Safe to run more than once. Already applied to Neon.
create table if not exists goals (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  name text not null,
  target numeric(14,2) not null check (target > 0),
  saved numeric(14,2) not null default 0 check (saved >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists goals_customer on goals (customer_id);

create table if not exists payment_requests (
  id text primary key default gen_random_uuid()::text,
  token text not null unique,
  customer_id text not null references customers(id) on delete cascade,
  amount numeric(14,2) check (amount is null or amount > 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  cancelled_at timestamptz
);
create index if not exists payment_requests_customer on payment_requests (customer_id);

create table if not exists scheduled_transfers (
  id text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  payee_account text not null,
  payee_name text not null,
  amount numeric(14,2) not null check (amount > 0),
  note text not null default '',
  frequency text not null check (frequency in ('once','weekly','monthly')),
  anchor_day int not null,
  next_run date not null,
  active boolean not null default true,
  last_run date,
  last_status text,
  created_at timestamptz not null default now()
);
create index if not exists scheduled_due on scheduled_transfers (next_run) where active;
create index if not exists scheduled_customer on scheduled_transfers (customer_id);

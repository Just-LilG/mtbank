-- Security history shown to the customer in Settings. Safe to run more than once. Already applied to Neon.
create table if not exists security_events (
  id          text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  kind        text not null,        -- signin, failed, password_changed, branch_reset, passkey_added, passkey_removed
  detail      text,
  created_at  timestamptz not null default now()
);
create index if not exists security_events_customer on security_events (customer_id, created_at desc);

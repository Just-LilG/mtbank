-- Saved payees with nicknames. Safe to run more than once. Already applied to the Neon database.
create table if not exists payees (
  id          text primary key default gen_random_uuid()::text,
  customer_id text not null references customers(id) on delete cascade,
  account     text not null,            -- the payee's account number, digits only
  name        text not null,            -- their real name when you saved them
  nickname    text not null,
  created_at  timestamptz not null default now(),
  unique (customer_id, account)
);
create index if not exists payees_customer on payees (customer_id);

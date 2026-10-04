-- Money safety, applied to the Neon database.
-- Safe to run more than once.

-- Who at the desk did it (shown in the ledger).
alter table journal add column if not exists actor text;

-- Wrong-password tracking so sign-in can be rate limited.
create table if not exists login_attempts (
  key text not null,
  at  timestamptz not null default now()
);
create index if not exists login_attempts_key_at on login_attempts (key, at desc);

-- Speeds up the "money already set aside" and daily-limit checks.
create index if not exists reviews_customer_decision on reviews (customer_id, decision, created_at);

-- The database refuses negative money even if the app has a bug.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'customers_money_nonneg') then
    alter table customers add constraint customers_money_nonneg
      check (balance >= 0 and savings >= 0 and daily_limit >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_amount_positive') then
    alter table reviews add constraint reviews_amount_positive check (amount > 0);
  end if;
end $$;

-- Face / fingerprint sign-in (passkeys). Safe to run more than once.
-- Already applied to the Neon database.
create table if not exists passkeys (
  id           text primary key,                 -- credential id (base64url)
  customer_id  text not null references customers(id) on delete cascade,
  public_key   text not null,                    -- base64url; the private half never leaves the phone
  counter      bigint not null default 0,
  transports   text,
  label        text not null default 'This device',
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists passkeys_customer on passkeys (customer_id);

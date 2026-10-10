-- Lets a customer cancel a send that is still waiting. Safe to run more than once. Already applied to Neon.
alter table reviews add column if not exists cancelled boolean not null default false;

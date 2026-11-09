-- Schema `wf` for wf-trade-helper (ADR 0009, phase 2). Idempotent. Run as the project's `postgres` role, with the
-- sweeper's password passed as a psql variable that never appears in argv, e.g. the first input line
--   \set pw `tr -d '\n' < /path/to/root-only/file`
-- followed by this file.
--
-- Who can do what:
--   wf_sweeper (login, the VM's daily sweep): read and write rows in wf.*, nothing else. It owns nothing, so it
--               can't drop, alter or truncate, and it can't create objects outside its own session's temp tables.
--   anon (the publishable key, used by the site's build): read wf.snapshot only, through the Data API.
-- RLS is on and forced for every table.

-- 1. Role (the password is set on every run, so re-running rotates it)
do $$ begin
  if not exists (select from pg_roles where rolname = 'wf_sweeper') then
    create role wf_sweeper login noinherit nocreatedb nocreaterole connection limit 2;
  end if;
end $$;
alter role wf_sweeper with login noinherit nocreatedb nocreaterole connection limit 2 password :'pw';
alter role wf_sweeper set search_path = wf;
alter role wf_sweeper set statement_timeout = '120s';
alter role wf_sweeper set idle_in_transaction_session_timeout = '60s';

-- 2. Schema, owned by postgres
create schema if not exists wf;
revoke all on schema wf from public;
grant usage on schema wf to wf_sweeper, anon, service_role;

-- 3. Tables. Ranks and subtypes are never null here (-1 and '' stand for "none") so they can be part of a key.
--    Every sweep replaces the last 90 days (daily) and 48 hours (hourly) per item, so older rows accumulate.
create table if not exists wf.daily (
  slug text not null,
  rank smallint not null default -1,
  subtype text not null default '',
  day date not null,
  volume integer not null,
  min real not null,
  max real not null,
  median real not null,
  primary key (slug, rank, subtype, day)
);

create table if not exists wf.hourly (
  slug text not null,
  rank smallint not null default -1,
  subtype text not null default '',
  hour timestamptz not null,
  volume integer not null,
  median real not null,
  primary key (slug, rank, subtype, hour)
);

-- The documents the site's build downloads (`market`: the same shape as src/fixtures/market.json). `json`, not
-- `jsonb`: stored and served as text, so the Data API doesn't re-serialize ~15 MB on every read.
create table if not exists wf.snapshot (
  name text primary key check (name in ('market')),
  taken_at timestamptz not null default now(),
  body json not null
);

-- 4. RLS and grants
alter table wf.daily enable row level security;
alter table wf.daily force row level security;
alter table wf.hourly enable row level security;
alter table wf.hourly force row level security;
alter table wf.snapshot enable row level security;
alter table wf.snapshot force row level security;

revoke all on wf.daily, wf.hourly, wf.snapshot from public, anon, authenticated;
grant select, insert, update, delete on wf.daily, wf.hourly, wf.snapshot to wf_sweeper;
grant select on wf.snapshot to anon;
grant all on wf.daily, wf.hourly, wf.snapshot to service_role;

drop policy if exists "sweeper rw" on wf.daily;
create policy "sweeper rw" on wf.daily for all to wf_sweeper using (true) with check (true);
drop policy if exists "sweeper rw" on wf.hourly;
create policy "sweeper rw" on wf.hourly for all to wf_sweeper using (true) with check (true);
drop policy if exists "sweeper rw" on wf.snapshot;
create policy "sweeper rw" on wf.snapshot for all to wf_sweeper using (true) with check (true);
drop policy if exists "public read" on wf.snapshot;
create policy "public read" on wf.snapshot for select to anon using (true);

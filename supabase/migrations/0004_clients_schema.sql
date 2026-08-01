-- FieldQuote Pro - ensure public.clients matches application expectations.
-- Idempotent: safe to run repeatedly in the Supabase SQL Editor.
--
-- Expected columns (per types/database.ts + ClientManager/QuoteBuilder):
--   id uuid PK, user_id uuid, client_name text NOT NULL,
--   client_email text, client_phone text, address text,
--   created_at timestamptz NOT NULL default now()

-- 1. Rename common legacy column names (data-preserving, only when the
--    expected column does not already exist).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'client_name'
  ) then
    alter table public.clients rename column "name" to client_name;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'email'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'client_email'
  ) then
    alter table public.clients rename column "email" to client_email;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'phone'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'client_phone'
  ) then
    alter table public.clients rename column "phone" to client_phone;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'phone_number'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'client_phone'
  ) then
    alter table public.clients rename column "phone_number" to client_phone;
  end if;
end $$;

-- 2. Add any missing columns (defaults backfill existing rows).
alter table public.clients add column if not exists user_id uuid;
alter table public.clients add column if not exists client_name text not null default '';
alter table public.clients add column if not exists client_email text;
alter table public.clients add column if not exists client_phone text;
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists created_at timestamptz not null default now();

-- 3. Index used by every owner-scoped query.
create index if not exists clients_user_id_idx on public.clients (user_id);

-- 4. Row level security (idempotent recreation).
alter table public.clients enable row level security;

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own" on public.clients
  for select using (user_id = auth.uid());
drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own" on public.clients
  for insert with check (user_id = auth.uid());
drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own" on public.clients
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own" on public.clients
  for delete using (user_id = auth.uid());

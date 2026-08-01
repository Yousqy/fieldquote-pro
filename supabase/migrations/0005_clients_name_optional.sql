-- FieldQuote Pro - make legacy clients."name" optional and remove it once unused.
-- Idempotent: safe to run repeatedly in the Supabase SQL Editor.
--
-- The app only writes client_name / client_email / client_phone / address.
-- If a legacy NOT NULL "name" column exists, inserts fail unless we relax it
-- (or drop the column entirely once client_name holds the data).

-- 1. Immediate fix: stop the NOT NULL violation on legacy "name".
alter table public.clients alter column "name" drop not null;

-- 2. Safely retire the redundant "name" column:
--    - copy any remaining data into client_name (only fills empty rows),
--    - then drop "name" so inserts can never hit it again.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'name'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'client_name'
  ) then
    update public.clients
    set client_name = "name"
    where (client_name is null or client_name = '')
      and "name" is not null and "name" <> '';

    alter table public.clients drop column "name";
  end if;
end $$;

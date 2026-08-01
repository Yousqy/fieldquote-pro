-- FieldQuote Pro - consolidated schema catch-up (single source of truth).
-- Idempotent: safe to run repeatedly in the Supabase SQL Editor.
--
-- Consolidates every schema requirement from the application:
--   1. Columns for profiles, clients, catalog_items, documents, document_items
--   2. Legacy column cleanups (renames, NOT NULL drops, redundant column drops)
--   3. Unique + common indexes
--   4. Check constraints
--   5. Row level security policies
--   6. 'signatures' storage bucket + access policies
--   7. Signup trigger (seeds business_name/phone into profiles)
--   8. Grants

-- ==========================================================================
-- 1. COLUMN ADDITIONS (all five tables)
-- ==========================================================================

-- PROFILES
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists default_tax_rate numeric(5, 2) not null default 0;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists subscription_status text not null default 'trialing';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- CLIENTS
alter table public.clients add column if not exists user_id uuid;
alter table public.clients add column if not exists client_name text not null default '';
alter table public.clients add column if not exists client_email text;
alter table public.clients add column if not exists client_phone text;
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists created_at timestamptz not null default now();

-- CATALOG_ITEMS
alter table public.catalog_items add column if not exists user_id uuid;
alter table public.catalog_items add column if not exists title text not null default '';
alter table public.catalog_items add column if not exists default_unit_price numeric(10, 2) not null default 0;
alter table public.catalog_items add column if not exists unit_type text;
alter table public.catalog_items add column if not exists created_at timestamptz not null default now();

-- DOCUMENTS
alter table public.documents add column if not exists user_id uuid;
alter table public.documents add column if not exists client_id uuid;
alter table public.documents add column if not exists doc_number text not null default '';
alter table public.documents add column if not exists doc_type text not null default 'quote';
alter table public.documents add column if not exists status text not null default 'draft';
alter table public.documents add column if not exists subtotal numeric(12, 2) not null default 0;
alter table public.documents add column if not exists tax_amount numeric(12, 2) not null default 0;
alter table public.documents add column if not exists total_amount numeric(12, 2) not null default 0;
alter table public.documents add column if not exists signature_png_url text;
alter table public.documents add column if not exists stripe_payment_link text;
alter table public.documents add column if not exists paid_at timestamptz;
alter table public.documents add column if not exists created_at timestamptz not null default now();

-- DOCUMENT_ITEMS
alter table public.document_items add column if not exists document_id uuid;
alter table public.document_items add column if not exists description text not null default '';
alter table public.document_items add column if not exists quantity numeric(10, 2) not null default 1;
alter table public.document_items add column if not exists unit_price numeric(10, 2) not null default 0;
alter table public.document_items add column if not exists subtotal numeric(12, 2) not null default 0;
alter table public.document_items add column if not exists created_at timestamptz not null default now();

-- ==========================================================================
-- 2. LEGACY COLUMN CLEANUPS
--    For each legacy column: relax NOT NULL, rename to the expected column if
--    missing, otherwise copy data and drop the legacy column. All guarded so
--    they no-op when the legacy column does not exist.
-- ==========================================================================

-- PROFILES: phone_number -> phone
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone_number'
  ) then
    alter table public.profiles alter column "phone_number" drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone_number'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone'
  ) then
    alter table public.profiles rename column "phone_number" to phone;
  end if;
end $$;

-- CLIENTS: name/email/phone/phone_number -> client_name/client_email/client_phone
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'name'
  ) then
    alter table public.clients alter column "name" drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'email'
  ) then
    alter table public.clients alter column "email" drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'phone'
  ) then
    alter table public.clients alter column "phone" drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'phone_number'
  ) then
    alter table public.clients alter column "phone_number" drop not null;
  end if;

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
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'email'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'client_email'
  ) then
    update public.clients
    set client_email = "email"
    where (client_email is null or client_email = '')
      and "email" is not null and "email" <> '';
    alter table public.clients drop column "email";
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'phone'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'client_phone'
  ) then
    update public.clients
    set client_phone = "phone"
    where (client_phone is null or client_phone = '')
      and "phone" is not null and "phone" <> '';
    alter table public.clients drop column "phone";
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'phone_number'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'client_phone'
  ) then
    update public.clients
    set client_phone = "phone_number"
    where (client_phone is null or client_phone = '')
      and "phone_number" is not null and "phone_number" <> '';
    alter table public.clients drop column "phone_number";
  end if;
end $$;

-- CATALOG_ITEMS: name/price/unit_price/default_price/unit -> title/default_unit_price/unit_type
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'name'
  ) then
    alter table public.catalog_items alter column "name" drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'title'
  ) then
    alter table public.catalog_items rename column "name" to title;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'price'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'default_unit_price'
  ) then
    alter table public.catalog_items rename column "price" to default_unit_price;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'unit_price'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'default_unit_price'
  ) then
    alter table public.catalog_items rename column "unit_price" to default_unit_price;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'default_price'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'default_unit_price'
  ) then
    alter table public.catalog_items rename column "default_price" to default_unit_price;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'unit'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'unit_type'
  ) then
    alter table public.catalog_items rename column "unit" to unit_type;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'name'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_items' and column_name = 'title'
  ) then
    update public.catalog_items
    set title = "name"
    where (title is null or title = '')
      and "name" is not null and "name" <> '';
    alter table public.catalog_items drop column "name";
  end if;
end $$;

-- DOCUMENT_ITEMS: name -> description
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'document_items' and column_name = 'name'
  ) then
    alter table public.document_items alter column "name" drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'document_items' and column_name = 'name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'document_items' and column_name = 'description'
  ) then
    alter table public.document_items rename column "name" to description;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'document_items' and column_name = 'name'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'document_items' and column_name = 'description'
  ) then
    update public.document_items
    set description = "name"
    where (description is null or description = '')
      and "name" is not null and "name" <> '';
    alter table public.document_items drop column "name";
  end if;
end $$;

-- ==========================================================================
-- 3. UNIQUE + COMMON INDEXES
-- ==========================================================================
create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id);
create unique index if not exists profiles_stripe_subscription_id_key
  on public.profiles (stripe_subscription_id);
create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists catalog_items_user_id_idx on public.catalog_items (user_id);
create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_client_id_idx on public.documents (client_id);
create index if not exists documents_status_idx on public.documents (status);
create unique index if not exists documents_user_doc_number_idx
  on public.documents (user_id, doc_number);
create index if not exists document_items_document_id_idx
  on public.document_items (document_id);

-- ==========================================================================
-- 4. CHECK CONSTRAINTS
-- ==========================================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_subscription_status_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_subscription_status_check
      check (subscription_status in ('trialing', 'active', 'canceled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'documents_doc_type_check' and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents add constraint documents_doc_type_check
      check (doc_type in ('quote', 'invoice'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'documents_status_check' and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents add constraint documents_status_check
      check (status in ('draft', 'pending_signature', 'signed', 'paid'));
  end if;
end $$;

-- ==========================================================================
-- 5. ROW LEVEL SECURITY
-- ==========================================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.catalog_items enable row level security;
alter table public.documents enable row level security;
alter table public.document_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (id = auth.uid());

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

drop policy if exists "catalog_items_select_own" on public.catalog_items;
create policy "catalog_items_select_own" on public.catalog_items
  for select using (user_id = auth.uid());
drop policy if exists "catalog_items_insert_own" on public.catalog_items;
create policy "catalog_items_insert_own" on public.catalog_items
  for insert with check (user_id = auth.uid());
drop policy if exists "catalog_items_update_own" on public.catalog_items;
create policy "catalog_items_update_own" on public.catalog_items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "catalog_items_delete_own" on public.catalog_items;
create policy "catalog_items_delete_own" on public.catalog_items
  for delete using (user_id = auth.uid());

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select using (user_id = auth.uid());
drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check (user_id = auth.uid());
drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents
  for delete using (user_id = auth.uid());

drop policy if exists "document_items_select_own" on public.document_items;
create policy "document_items_select_own" on public.document_items
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  );
drop policy if exists "document_items_insert_own" on public.document_items;
create policy "document_items_insert_own" on public.document_items
  for insert with check (
    exists (
      select 1 from public.documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  );
drop policy if exists "document_items_update_own" on public.document_items;
create policy "document_items_update_own" on public.document_items
  for update using (
    exists (
      select 1 from public.documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  );
drop policy if exists "document_items_delete_own" on public.document_items;
create policy "document_items_delete_own" on public.document_items
  for delete using (
    exists (
      select 1 from public.documents d
      where d.id = document_items.document_id and d.user_id = auth.uid()
    )
  );

-- ==========================================================================
-- 6. SIGNATURES STORAGE BUCKET + POLICIES
-- ==========================================================================
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true)
on conflict (id) do update set public = true;

drop policy if exists "signatures_insert_own" on storage.objects;
create policy "signatures_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "signatures_select_all" on storage.objects;
create policy "signatures_select_all" on storage.objects
  for select
  using (bucket_id = 'signatures');

drop policy if exists "signatures_update_own" on storage.objects;
create policy "signatures_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "signatures_delete_own" on storage.objects;
create policy "signatures_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'signatures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==========================================================================
-- 7. SIGNUP TRIGGER
-- ==========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, business_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================================================
-- 8. GRANTS
-- ==========================================================================
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to authenticated;
grant all on all sequences in schema public to service_role;

-- FieldQuote Pro - initial schema, RLS, storage, and auth trigger
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  business_name text,
  phone text,
  default_tax_rate numeric(5, 2) not null default 0,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'canceled')),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_name text not null,
  client_email text,
  client_phone text,
  address text,
  created_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  default_unit_price numeric(10, 2) not null default 0,
  unit_type text,
  created_at timestamptz not null default now()
);

create index if not exists catalog_items_user_id_idx on public.catalog_items (user_id);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  doc_number text not null,
  doc_type text not null default 'quote'
    check (doc_type in ('quote', 'invoice')),
  status text not null default 'draft'
    check (status in ('draft', 'pending_signature', 'signed', 'paid')),
  subtotal numeric(12, 2) not null default 0,
  tax_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  signature_png_url text,
  stripe_payment_link text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_client_id_idx on public.documents (client_id);
create index if not exists documents_status_idx on public.documents (status);
create unique index if not exists documents_user_doc_number_idx
  on public.documents (user_id, doc_number);

create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(10, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists document_items_document_id_idx
  on public.document_items (document_id);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.catalog_items enable row level security;
alter table public.documents enable row level security;
alter table public.document_items enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_delete_own" on public.profiles
  for delete using (id = auth.uid());

create policy "clients_select_own" on public.clients
  for select using (user_id = auth.uid());
create policy "clients_insert_own" on public.clients
  for insert with check (user_id = auth.uid());
create policy "clients_update_own" on public.clients
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "clients_delete_own" on public.clients
  for delete using (user_id = auth.uid());

create policy "catalog_items_select_own" on public.catalog_items
  for select using (user_id = auth.uid());
create policy "catalog_items_insert_own" on public.catalog_items
  for insert with check (user_id = auth.uid());
create policy "catalog_items_update_own" on public.catalog_items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "catalog_items_delete_own" on public.catalog_items
  for delete using (user_id = auth.uid());

create policy "documents_select_own" on public.documents
  for select using (user_id = auth.uid());
create policy "documents_insert_own" on public.documents
  for insert with check (user_id = auth.uid());
create policy "documents_update_own" on public.documents
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "documents_delete_own" on public.documents
  for delete using (user_id = auth.uid());

create policy "document_items_select_own" on public.document_items
  for select using (
    exists (
      select 1
      from public.documents d
      where d.id = document_items.document_id
        and d.user_id = auth.uid()
    )
  );
create policy "document_items_insert_own" on public.document_items
  for insert with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_items.document_id
        and d.user_id = auth.uid()
    )
  );
create policy "document_items_update_own" on public.document_items
  for update using (
    exists (
      select 1
      from public.documents d
      where d.id = document_items.document_id
        and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_items.document_id
        and d.user_id = auth.uid()
    )
  );
create policy "document_items_delete_own" on public.document_items
  for delete using (
    exists (
      select 1
      from public.documents d
      where d.id = document_items.document_id
        and d.user_id = auth.uid()
    )
  );

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

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to authenticated;
grant all on all sequences in schema public to service_role;

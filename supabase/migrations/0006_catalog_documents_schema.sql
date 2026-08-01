-- FieldQuote Pro - align catalog_items, documents, and document_items with
-- application expectations. Idempotent: safe to run repeatedly.
--
-- Expected columns:
--   catalog_items:   id, user_id, title, default_unit_price, unit_type, created_at
--   documents:       id, user_id, client_id, doc_number, doc_type, status,
--                    subtotal, tax_amount, total_amount, signature_png_url,
--                    stripe_payment_link, paid_at, created_at
--   document_items:  id, document_id, description, quantity, unit_price,
--                    subtotal, created_at

-- --------------------------------------------------------------------------
-- 1. CATALOG_ITEMS - rename common legacy column names (data-preserving).
-- --------------------------------------------------------------------------
do $$
begin
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
end $$;

-- --------------------------------------------------------------------------
-- 2. CATALOG_ITEMS - add any missing columns.
-- --------------------------------------------------------------------------
alter table public.catalog_items add column if not exists user_id uuid;
alter table public.catalog_items add column if not exists title text not null default '';
alter table public.catalog_items add column if not exists default_unit_price numeric(10, 2) not null default 0;
alter table public.catalog_items add column if not exists unit_type text;
alter table public.catalog_items add column if not exists created_at timestamptz not null default now();

-- --------------------------------------------------------------------------
-- 3. DOCUMENTS - add any missing columns.
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- 4. DOCUMENT_ITEMS - add any missing columns.
-- --------------------------------------------------------------------------
alter table public.document_items add column if not exists document_id uuid;
alter table public.document_items add column if not exists description text not null default '';
alter table public.document_items add column if not exists quantity numeric(10, 2) not null default 1;
alter table public.document_items add column if not exists unit_price numeric(10, 2) not null default 0;
alter table public.document_items add column if not exists subtotal numeric(12, 2) not null default 0;
alter table public.document_items add column if not exists created_at timestamptz not null default now();

-- --------------------------------------------------------------------------
-- 5. INDEXES
-- --------------------------------------------------------------------------
create index if not exists catalog_items_user_id_idx on public.catalog_items (user_id);
create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_client_id_idx on public.documents (client_id);
create index if not exists documents_status_idx on public.documents (status);
create unique index if not exists documents_user_doc_number_idx
  on public.documents (user_id, doc_number);
create index if not exists document_items_document_id_idx
  on public.document_items (document_id);

-- --------------------------------------------------------------------------
-- 6. CHECK CONSTRAINTS
-- --------------------------------------------------------------------------
do $$
begin
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

-- --------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (idempotent recreation)
-- --------------------------------------------------------------------------
alter table public.catalog_items enable row level security;
alter table public.documents enable row level security;
alter table public.document_items enable row level security;

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

-- FieldQuote Pro - minimal, rollback-proof column additions for
-- catalog_items, documents, and document_items.
--
-- Contains ONLY idempotent ALTER TABLE ... ADD COLUMN IF NOT EXISTS
-- statements so the script can never fail and roll back wholesale.
-- Run this first; then run 0006 for indexes/checks/RLS if needed.

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

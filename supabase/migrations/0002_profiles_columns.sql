-- FieldQuote Pro - align public.profiles columns with application requirements.
-- Idempotent: safe to run repeatedly in the Supabase SQL Editor.

alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists default_tax_rate numeric(5, 2) not null default 0;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists subscription_status text not null default 'trialing';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id);

create unique index if not exists profiles_stripe_subscription_id_key
  on public.profiles (stripe_subscription_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_subscription_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_subscription_status_check
      check (subscription_status in ('trialing', 'active', 'canceled'));
  end if;
end $$;

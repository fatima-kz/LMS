-- ============================================================================
-- Security Portal Credentials Table
-- Run this in Supabase SQL Editor
-- Stores credentials for the locked security portal (school creation access)
-- ============================================================================

-- pgcrypto provides crypt() and gen_salt() for bcrypt password hashing
create extension if not exists pgcrypto;

-- Drop existing if re-running
drop table if exists public.security_portal_credentials cascade;

create table public.security_portal_credentials (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.security_portal_credentials enable row level security;

-- NO public policies — this table is only accessed via service role (server actions)
-- No SELECT/INSERT/UPDATE/DELETE policies = blocked for all anon + authenticated users

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists security_portal_set_updated_at on public.security_portal_credentials;
create trigger security_portal_set_updated_at
  before update on public.security_portal_credentials
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Insert the platform owner credentials
-- Password is stored as a crypt() hash (pgcrypto extension)
-- ============================================================================
insert into public.security_portal_credentials (email, password_hash, is_active)
values (
  'fatimak2816@gmail.com',
  crypt('Ffma@1234', gen_salt('bf')),
  true
);

-- Done. The portal action will verify credentials via the RPC function below.

-- ============================================================================
-- Verification function (SECURITY DEFINER — bypasses RLS, server-side only)
-- Returns true if email+password match an active credential row.
-- ============================================================================
create or replace function public.verify_portal_credentials(
  p_email text,
  p_password text
)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.security_portal_credentials
    where email = lower(p_email)
      and is_active = true
      and password_hash = extensions.crypt(p_password, password_hash)
  );
$$;

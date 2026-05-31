-- Lufilya School Management Supabase storage
-- Run this in Supabase Dashboard > SQL Editor.

create table if not exists public.school_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_school_state_updated_at on public.school_state;
create trigger set_school_state_updated_at
before update on public.school_state
for each row
execute function public.set_updated_at();

-- The FastAPI backend should connect with SUPABASE_SERVICE_ROLE_KEY.
-- Keep Row Level Security enabled for safety; service_role bypasses RLS.
alter table public.school_state enable row level security;

create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  start_date date not null,
  end_date date not null,
  budget numeric default 0,
  hotel text default '',
  interests jsonb not null default '[]'::jsonb,
  travel_pace text default 'Balanced',
  must_visit text default '',
  transportation jsonb not null default '{}'::jsonb,
  accommodation jsonb not null default '{}'::jsonb,
  itinerary jsonb not null default '[]'::jsonb,
  fallback boolean not null default false,
  real_world_status jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists trips_created_at_idx
  on public.trips (created_at desc);

-- Keep SUPABASE_SERVICE_ROLE_KEY server-side only.
-- This hackathon schema stores shared history. Before a multi-user production
-- launch, add Supabase Auth, owner_id, and Row Level Security policies.

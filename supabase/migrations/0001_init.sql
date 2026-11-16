-- DRAFT schema — will be refined during the "Carnet" and "Comptes" phases.
-- Every synced table: client-generated uuid, updated_at, deleted_at (soft delete),
-- and an RLS policy restricting rows to their owner.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- An 8-week training cycle started by the user.
create table public.training_cycles (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  program_version text not null default 'carnet-2019',
  start_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- One row per day of a cycle: sitting practice report.
create table public.daily_reports (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  cycle_id uuid not null references public.training_cycles on delete cascade,
  day_index smallint not null check (day_index between 0 and 55), -- week = day_index / 7
  date date not null,
  practice_minutes smallint check (practice_minutes >= 0),
  positives text,
  obstacles text,
  remedies text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (cycle_id, day_index)
);

-- A–E self-assessment of one reminder on one day.
create table public.reminder_ratings (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  cycle_id uuid not null references public.training_cycles on delete cascade,
  day_index smallint not null check (day_index between 0 and 55),
  reminder_id text not null, -- stable id from src/features/carnet/program.ts
  rating char(1) not null check (rating in ('A','B','C','D','E')),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (cycle_id, day_index, reminder_id)
);

-- "Observations particulières": one free note per reminder per week.
create table public.reminder_notes (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  cycle_id uuid not null references public.training_cycles on delete cascade,
  week smallint not null check (week between 1 and 8),
  reminder_id text not null,
  note text not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (cycle_id, week, reminder_id)
);

-- Every completed meditation (guided or free timer). Feeds future statistics.
create table public.meditation_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('guided','free','sitting_type')),
  content_ref text, -- e.g. 'P10' or 'etape-3-pratique-type'
  started_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Row Level Security -------------------------------------------------------
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['training_cycles','daily_reports','reminder_ratings','reminder_notes','meditation_sessions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create index on public.%I (user_id, updated_at)', t);
  end loop;
end $$;

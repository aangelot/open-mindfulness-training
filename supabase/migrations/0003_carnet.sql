-- Carnet d'entraînement: cycle status and E8 obstacle / remedy tags.
-- Mirrors drizzle/0002 (local SQLite).

alter table public.training_cycles
  add column status text not null default 'active' check (status in ('active','completed','abandoned')),
  add column ended_at timestamptz;

-- Ids from src/features/carnet/program.ts (OBSTACLES / REMEDIES), never renamed.
alter table public.daily_reports
  add column obstacle_ids jsonb not null default '[]'::jsonb,
  add column remedy_ids jsonb not null default '[]'::jsonb;

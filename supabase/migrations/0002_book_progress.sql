-- Reading progress in the book: last opening and "read" mark per section.
create table public.book_progress (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  section_id text not null, -- WordPress slug, see src/content/generated/book.json
  opened_at timestamptz not null,
  read_at timestamptz,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, section_id)
);

alter table public.book_progress enable row level security;
create policy "own rows" on public.book_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index on public.book_progress (user_id, updated_at);

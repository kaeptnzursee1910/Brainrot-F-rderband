-- Brainrot-Fließband: Datenbank für Konten, Spielstände und Bestenliste
-- In Supabase unter "SQL Editor" einfügen und ausführen ("Run").

-- Spielstände: jeder Spieler darf nur seinen eigenen lesen und schreiben
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null check (pg_column_size(data) < 200000),
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;

drop policy if exists "saves_select_own" on public.saves;
drop policy if exists "saves_insert_own" on public.saves;
drop policy if exists "saves_update_own" on public.saves;
create policy "saves_select_own" on public.saves for select to authenticated using (auth.uid() = user_id);
create policy "saves_insert_own" on public.saves for insert to authenticated with check (auth.uid() = user_id);
create policy "saves_update_own" on public.saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bestenliste: alle dürfen lesen, jeder schreibt nur seine eigene Zeile
create table if not exists public.leaderboard (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  username   text not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  earned     double precision not null default 0 check (earned >= 0 and earned < 1e30),
  rebirths   integer not null default 0 check (rebirths between 0 and 10000),
  discovered integer not null default 0 check (discovered between 0 and 1000),
  updated_at timestamptz not null default now()
);
create index if not exists leaderboard_earned_idx on public.leaderboard (earned desc);
alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard_select_all" on public.leaderboard;
drop policy if exists "leaderboard_insert_own" on public.leaderboard;
drop policy if exists "leaderboard_update_own" on public.leaderboard;
create policy "leaderboard_select_all" on public.leaderboard for select to anon, authenticated using (true);
create policy "leaderboard_insert_own" on public.leaderboard for insert to authenticated
  with check (auth.uid() = user_id and username = (auth.jwt() -> 'user_metadata' ->> 'username'));
create policy "leaderboard_update_own" on public.leaderboard for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and username = (auth.jwt() -> 'user_metadata' ->> 'username'));

grant select on public.leaderboard to anon, authenticated;
grant select, insert, update on public.leaderboard to authenticated;
grant select, insert, update on public.saves to authenticated;

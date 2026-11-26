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

-- =====================================================================
-- Schutzregeln (können gefahrlos mehrfach ausgeführt werden)
-- =====================================================================

-- Unpassende Spielernamen erkennen (gleiche Liste wie in js/online.js)
create or replace function public.brainrot_bad_name(n text) returns boolean
language sql immutable set search_path = '' as $$
  select exists (
    select 1
    from unnest(array['arschloch','wichser','hurensohn','fotze','schlampe','missgeburt','spast','behindert',
      'nutte','ficker','ficken','schwuchtel','nazi','hitler','kanake','neger','nigger','nigga','fuck',
      'shit','bitch','cunt','pussy','whore','slut','retard','faggot','porn','penis','vagina','titten',
      'scheisse','pisser','kacke','wixer','hure','siegheil']) as w
    where position(w in translate(lower(n), '013457_', 'oieast')) > 0
  );
$$;

-- Bestenliste absichern: keine unpassenden Namen, keine unrealistischen Sprünge.
-- Werte werden nicht abgelehnt, sondern auf ein plausibles Maß begrenzt.
create or replace function public.leaderboard_guard() returns trigger
language plpgsql set search_path = '' as $$
declare
  secs double precision;
  allowed double precision;
  max_reb integer;
begin
  if public.brainrot_bad_name(new.username) then
    raise exception 'Spielername nicht erlaubt' using errcode = '22023';
  end if;

  if tg_op = 'INSERT' then
    -- Bei "upsert" auf eine vorhandene Zeile übernimmt der UPDATE-Teil die Prüfung
    if exists (select 1 from public.leaderboard l where l.user_id = new.user_id) then
      return new;
    end if;
    new.rebirths := least(new.rebirths, 3);
    new.earned   := least(new.earned, 5e7 * power(8, new.rebirths));
  else
    new.user_id  := old.user_id;
    secs    := greatest(1, least(extract(epoch from (now() - old.updated_at)), 4 * 3600));
    -- höchstens 5 % des bisherigen Verdienstes (+1000) pro Sekunde seit dem letzten Eintrag
    allowed := (old.earned * 0.05 + 1000) * secs;
    new.earned   := greatest(old.earned, least(new.earned, old.earned + allowed));
    new.rebirths := greatest(old.rebirths, least(new.rebirths, old.rebirths + 2));
  end if;

  -- Rebirths müssen zu den verdienten Lire passen (Rebirth n kostet 1 Mio. · 8^(n-1))
  max_reb := floor(ln(new.earned * 7 / 1e6 + 1) / ln(8));
  new.rebirths   := least(new.rebirths, greatest(max_reb, 0));
  new.discovered := least(new.discovered, 100);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leaderboard_guard on public.leaderboard;
create trigger leaderboard_guard before insert or update on public.leaderboard
  for each row execute function public.leaderboard_guard();

-- Vorhandene Einträge mit unpassenden Namen entfernen
delete from public.leaderboard where public.brainrot_bad_name(username);

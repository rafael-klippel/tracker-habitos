-- Tracker: schema inicial
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

-- Hábitos cadastrados pelo usuário
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'geral',
  kind text not null check (kind in ('positive', 'negative')) default 'positive',
  target_per_week int not null default 7 check (target_per_week between 1 and 7),
  reminder_time time, -- horário local (HH:MM) para lembrete, opcional
  color text not null default '#4f46e5',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Registro diário de cada hábito (feito / não feito + nota opcional)
create table if not exists public.habit_entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  completed boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, entry_date)
);

-- Nota geral do dia (humor, contexto), independente de hábito específico
create table if not exists public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  note_date date not null,
  mood smallint check (mood between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, note_date)
);

-- Assinaturas de push notification (uma por dispositivo/navegador)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists habit_entries_user_date_idx on public.habit_entries (user_id, entry_date);
create index if not exists habits_user_idx on public.habits (user_id);
create index if not exists daily_notes_user_date_idx on public.daily_notes (user_id, note_date);

-- Row Level Security: cada usuário só enxerga e altera os próprios dados
alter table public.habits enable row level security;
alter table public.habit_entries enable row level security;
alter table public.daily_notes enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "habits_owner" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habit_entries_owner" on public.habit_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_notes_owner" on public.daily_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_owner" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mantém updated_at em dia
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger habit_entries_set_updated_at
  before update on public.habit_entries
  for each row execute function public.set_updated_at();

create trigger daily_notes_set_updated_at
  before update on public.daily_notes
  for each row execute function public.set_updated_at();

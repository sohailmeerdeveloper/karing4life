-- Pre-launch email list for Karing4Life.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Visitors can only ADD an email. Nobody can read, change or delete the list
-- through the website; you see it in Dashboard → Table Editor → prelaunch_emails.

create table if not exists public.prelaunch_emails (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text not null default 'site_popup',
  created_at timestamptz not null default now(),
  constraint prelaunch_emails_email_format check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  constraint prelaunch_emails_email_length check (char_length(email) <= 254)
);

-- one row per address, whatever the capitalisation
create unique index if not exists prelaunch_emails_email_key on public.prelaunch_emails (lower(email));

alter table public.prelaunch_emails enable row level security;

grant insert on public.prelaunch_emails to anon, authenticated;

drop policy if exists "Anyone can join the pre-launch list" on public.prelaunch_emails;
create policy "Anyone can join the pre-launch list"
  on public.prelaunch_emails for insert
  to anon, authenticated
  with check (source = 'site_popup');

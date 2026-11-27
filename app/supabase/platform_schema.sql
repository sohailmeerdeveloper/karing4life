-- =====================================================================================
-- Karing4Life platform schema (Milestone 2: database, auth, roles, business rules, chat)
-- Run in Supabase: Dashboard → SQL Editor → New query → paste this whole file → Run.
-- Safe to re-run: everything is "create if not exists" / "create or replace".
-- Payments (Stripe) arrive in Milestone 3; the tables they write to already exist here.
-- =====================================================================================

-- ---------- Settings, regions, care categories (admin-editable) ----------
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (key, value) values
  ('caregiver_region_price', '8.99'),
  ('agency_region_price', '49.99'),
  ('contact_pack_price', '8.99'),
  ('contact_pack_size', '10'),
  ('free_contacts_per_post', '10'),
  ('family_post_cooldown_days', '14'),
  ('caregiver_trial_days', '14'),
  ('post_edit_flag_after', '3'),
  ('new_chats_per_day', '25'),
  ('messages_per_minute', '20')
on conflict (key) do nothing;

create table if not exists public.regions (
  key        text primary key,
  name       text not null,
  grp        text not null check (grp in ('li','nyc','up')),
  description text not null default '',
  sort       int  not null default 0,
  active     boolean not null default true
);
insert into public.regions (key, name, grp, sort) values
  ('suffolk','Suffolk','li',1),('nassau','Nassau','li',2),('manhattan','Manhattan','nyc',3),
  ('brooklyn','Brooklyn','nyc',4),('queens','Queens','nyc',5),('bronx','Bronx','nyc',6),
  ('staten-island','Staten Island','nyc',7),('capital-region','Capital Region','up',8),
  ('hudson-valley','Hudson Valley','up',9),('central-new-york','Central New York','up',10),
  ('adirondacks','Adirondacks','up',11),('catskills','Catskills','up',12),
  ('finger-lakes','Finger Lakes','up',13),('niagara','Niagara','up',14),
  ('thousand-islands','Thousand Islands','up',15),('chautauqua-allegheny','Chautauqua-Allegheny','up',16)
on conflict (key) do nothing;

create table if not exists public.care_categories (
  key    text primary key,
  label  text not null,
  grp    text not null check (grp in ('skilled','nonskilled')),
  sort   int  not null default 0,
  active boolean not null default true
);
insert into public.care_categories (key, label, grp, sort) values
  ('rn','RN (Registered Nurse)','skilled',1),('lpn','LPN (Licensed Practical Nurse)','skilled',2),
  ('pt','Physical Therapy','skilled',3),('st','Speech Therapy','skilled',4),('ot','Occupational Therapy','skilled',5),
  ('edu','Educational Therapy','skilled',6),('doula','Doula','skilled',7),
  ('companion','Companion Care','nonskilled',8),('personal','Personal Care','nonskilled',9),
  ('livein','Live-in Care','nonskilled',10),('child','Newborn / Child Care','nonskilled',11),
  ('respite','Respite Care','nonskilled',12),('occasional','Occasional Care','nonskilled',13)
on conflict (key) do nothing;

-- ---------- Users ----------
-- One row per auth user. roles: any of caregiver | family | agency | admin.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null default '' check (char_length(full_name) <= 120),
  roles        text[] not null default '{}',
  status       text not null default 'active' check (status in ('active','suspended')),
  avatar_url   text,
  town         text check (char_length(town) <= 80),
  region_key   text references public.regions(key),
  settings     jsonb not null default '{"email_messages":true,"email_posts":true,"email_billing":true}',
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz
);
create index if not exists profiles_roles_idx on public.profiles using gin (roles);

create table if not exists public.caregiver_profiles (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  headline       text not null default '' check (char_length(headline) <= 120),
  bio            text not null default '' check (char_length(bio) <= 2000),
  credential     text not null default '',
  license_number text check (char_length(license_number) <= 40),
  care_types     text[] not null default '{}',
  recipients     text[] not null default '{}',          -- Pediatric | Adult
  durations      text[] not null default '{}',          -- Fill-in | Short-term | Long-term
  schedule       jsonb  not null default '{}',          -- {"days":[1,2],"evenings":[],"overnights":[],"livein":[]}
  languages      text[] not null default '{English}',
  years_exp      int check (years_exp between 0 and 70),
  rate_min       numeric(6,2) check (rate_min >= 0),
  has_car        boolean not null default false,
  availability   text not null default 'available' check (availability in ('available','fillin')),
  service_regions text[] not null default '{}',
  verification   text not null default 'unverified' check (verification in ('unverified','pending','verified','rejected')),
  trial_ends_at  timestamptz not null default (now() + interval '14 days'),
  updated_at     timestamptz not null default now()
);
create index if not exists cg_regions_idx on public.caregiver_profiles using gin (service_regions);
create index if not exists cg_care_idx on public.caregiver_profiles using gin (care_types);

create table if not exists public.family_profiles (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  address    text check (char_length(address) <= 200),       -- private: never shown to others
  zip        text check (zip ~ '^[0-9]{5}$'),
  care_for   text check (char_length(care_for) <= 200),
  verification text not null default 'unverified' check (verification in ('unverified','pending','verified','rejected')),
  updated_at timestamptz not null default now()
);

create table if not exists public.agency_profiles (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null default '' check (char_length(business_name) <= 140),
  agency_type   text not null default 'Home care agency',
  ein           text check (ein ~ '^[0-9]{2}-?[0-9]{7}$'),
  website       text check (char_length(website) <= 200),
  contact_name  text check (char_length(contact_name) <= 120),
  about         text not null default '' check (char_length(about) <= 2000),
  logo_url      text,
  verification  text not null default 'unverified' check (verification in ('unverified','pending','verified','rejected')),
  updated_at    timestamptz not null default now()
);

-- ---------- Region access ----------
create table if not exists public.region_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  region_key  text not null references public.regions(key),
  plan        text not null check (plan in ('caregiver','agency')),
  status      text not null default 'active' check (status in ('active','past_due','canceled')),
  source      text not null default 'stripe' check (source in ('stripe','admin')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at  timestamptz not null default now(),
  canceled_at timestamptz,
  unique (user_id, region_key, plan)
);

-- ---------- Posts (family care requests + agency job posts) ----------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('family','agency')),
  title       text not null check (char_length(title) between 4 and 120),
  body        text not null check (char_length(body) between 10 and 3000),
  region_key  text not null references public.regions(key),
  town        text check (char_length(town) <= 80),
  care_types  text[] not null default '{}',
  recipient   text check (recipient in ('Pediatric','Adult')),
  duration    text check (duration in ('Fill-in','Short-term','Long-term')),
  schedule    jsonb not null default '{}',
  hours_per_week int check (hours_per_week between 0 and 168),
  start_date  date,
  pay_range   text check (char_length(pay_range) <= 60),
  status      text not null default 'open' check (status in ('open','closed','hidden')),
  flagged     boolean not null default false,
  edit_count  int not null default 0,
  expires_at  timestamptz not null default (now() + interval '14 days'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists posts_region_idx on public.posts (region_key, status, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id, created_at desc);

-- 10 free contacts per family post (+10 per pack)
create table if not exists public.contact_quotas (
  post_id    uuid primary key references public.posts(id) on delete cascade,
  family_id  uuid not null references public.profiles(id) on delete cascade,
  free_limit int not null default 10,
  extra      int not null default 0,
  used       int not null default 0
);

-- ---------- Messaging ----------
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references public.profiles(id) on delete cascade,  -- who started it
  role_a      text not null,
  user_b      uuid not null references public.profiles(id) on delete cascade,
  role_b      text not null,
  post_id     uuid references public.posts(id) on delete set null,
  counted     boolean not null default false,   -- true when it used one of a family's contacts
  a_read_at   timestamptz not null default now(),
  b_read_at   timestamptz not null default 'epoch',
  last_message_at timestamptz not null default now(),
  last_message text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_a, role_a, user_b, role_b)
);
create index if not exists conv_a_idx on public.conversations (user_a, last_message_at desc);
create index if not exists conv_b_idx on public.conversations (user_b, last_message_at desc);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 4000),
  created_at      timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references public.profiles(id) on delete cascade,
  target_user_id  uuid references public.profiles(id) on delete cascade,
  target_post_id  uuid references public.posts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  reason          text not null check (reason in ('spam','recruiter','inappropriate','scam','safety','other')),
  details         text check (char_length(details) <= 2000),
  status          text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolution      text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

-- ---------- Payments (written by Stripe webhooks in Milestone 3, or by an admin) ----------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         text not null check (kind in ('subscription','contact_pack')),
  description  text not null default '',
  amount_cents int  not null check (amount_cents >= 0),
  status       text not null default 'paid' check (status in ('paid','refunded','failed')),
  region_key   text references public.regions(key),
  post_id      uuid references public.posts(id) on delete set null,
  stripe_ref   text,
  created_at   timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

-- ---------- Verification documents ----------
create table if not exists public.verification_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  doc_type    text not null check (doc_type in ('gov_id','library_card','license','reference','business')),
  file_path   text,                           -- object in the private 'verification' bucket
  ref_name    text check (char_length(ref_name) <= 120),
  ref_contact text check (char_length(ref_contact) <= 160),
  ref_relation text check (char_length(ref_relation) <= 120),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  note        text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.saved_caregivers (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, caregiver_id)
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null default '',
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications (user_id, created_at desc);

create table if not exists public.admin_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  details     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ---------- Kommunity Korner ----------
create table if not exists public.kk_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  title      text not null check (char_length(title) between 4 and 120),
  body       text not null check (char_length(body) between 10 and 2000),
  category   text not null default 'Supplies' check (category in ('Supplies','Equipment','Mobility','Baby & child','Other')),
  condition  text not null default 'Unopened' check (condition in ('Unopened','Opened','Used')),
  region_key text references public.regions(key),
  status     text not null default 'open' check (status in ('open','claimed','hidden')),
  created_at timestamptz not null default now()
);
create table if not exists public.kk_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.kk_posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- ---------- Contact form (public) ----------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' and char_length(email) <= 254),
  role       text check (char_length(role) <= 40),
  subject    text check (char_length(subject) <= 160),
  message    text not null check (char_length(message) between 1 and 5000),
  status     text not null default 'new' check (status in ('new','done')),
  created_at timestamptz not null default now()
);

-- =====================================================================================
-- Helper functions (security definer so RLS policies can call them without recursion)
-- =====================================================================================
create or replace function public.setting_int(k text) returns int
language sql stable security definer set search_path = public as
$$ select coalesce((select (value #>> '{}')::numeric::int from app_settings where key = k), 0) $$;

create or replace function public.setting_num(k text) returns numeric
language sql stable security definer set search_path = public as
$$ select coalesce((select (value #>> '{}')::numeric from app_settings where key = k), 0) $$;

create or replace function public.has_role(r text) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and r = any(roles) and status = 'active') $$;

-- any active role at all (used by message/kk policies)
create or replace function public.has_role_any() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and status = 'active' and cardinality(roles) > 0) $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select public.has_role('admin') $$;

-- Regions a caregiver/agency can currently work in: paid regions, plus (caregivers) their
-- chosen regions while the 14-day trial lasts.
create or replace function public.access_regions(uid uuid, plan_kind text) returns text[]
language sql stable security definer set search_path = public as
$$
  select coalesce(array_agg(distinct k), '{}') from (
    select region_key as k from region_subscriptions
     where user_id = uid and plan = plan_kind and status in ('active','past_due')
    union all
    select unnest(service_regions) from caregiver_profiles
     where plan_kind = 'caregiver' and user_id = uid and trial_ends_at > now()
  ) s
$$;

create or replace function public.is_blocked_between(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from blocks where (blocker_id = x and blocked_id = y) or (blocker_id = y and blocked_id = x)) $$;

create or replace function public.push_notification(uid uuid, k text, t text, b text, l text) returns void
language sql security definer set search_path = public as
$$ insert into notifications (user_id, kind, title, body, link) values (uid, k, t, coalesce(b,''), l) $$;

create or replace function public.log_admin(a text, tt text, tid text, d jsonb default '{}') returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  insert into admin_logs (admin_id, action, target_type, target_id, details) values (auth.uid(), a, tt, tid, coalesce(d,'{}'));
end $$;

-- =====================================================================================
-- Triggers
-- =====================================================================================
-- New auth user → profile + role profile. Role comes from sign-up metadata; never admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$
declare r text := coalesce(new.raw_user_meta_data->>'role', 'family');
begin
  if r not in ('caregiver','family','agency') then r := 'family'; end if;
  insert into profiles (id, full_name, roles) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), array[r])
  on conflict (id) do nothing;
  if r = 'caregiver' then
    insert into caregiver_profiles (user_id, trial_ends_at) values (new.id, now() + make_interval(days => setting_int('caregiver_trial_days')))
    on conflict do nothing;
  elsif r = 'agency' then
    insert into agency_profiles (user_id, business_name) values (new.id, coalesce(new.raw_user_meta_data->>'business_name',''))
    on conflict do nothing;
  else
    insert into family_profiles (user_id) values (new.id) on conflict do nothing;
  end if;
  perform push_notification(new.id, 'welcome', 'Welcome to Karing4Life', 'Finish your profile to get started.', '/portal');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Users can't change their own roles/status (only admins can).
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if not public.is_admin() and auth.uid() is not null then
    new.roles := old.roles; new.status := old.status;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles for each row execute function public.guard_profile();

-- Caregivers/agencies can't self-verify or extend their trial.
create or replace function public.guard_verification() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if not public.is_admin() and auth.uid() is not null then
    if new.verification <> old.verification and not (old.verification in ('unverified','rejected') and new.verification = 'pending') then
      new.verification := old.verification;
    end if;
    if tg_table_name = 'caregiver_profiles' then new.trial_ends_at := old.trial_ends_at; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists guard_cg on public.caregiver_profiles;
create trigger guard_cg before update on public.caregiver_profiles for each row execute function public.guard_verification();
drop trigger if exists guard_ag on public.agency_profiles;
create trigger guard_ag before update on public.agency_profiles for each row execute function public.guard_verification();
drop trigger if exists guard_fam on public.family_profiles;
create trigger guard_fam before update on public.family_profiles for each row execute function public.guard_verification();

-- Post edits: only the author's content fields; family posts editable inside their 14 days;
-- several edits flag the post for admin review.
create or replace function public.guard_post_update() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if public.is_admin() or auth.uid() is null then new.updated_at := now(); return new; end if;
  new.author_id := old.author_id; new.kind := old.kind; new.created_at := old.created_at;
  new.expires_at := old.expires_at; new.edit_count := old.edit_count; new.flagged := old.flagged;
  if old.status = 'hidden' then new.status := 'hidden'; end if;
  if new.status = 'hidden' then new.status := old.status; end if;
  if (new.title, new.body, new.region_key, new.care_types, new.schedule, new.recipient, new.duration, new.town, new.hours_per_week, new.start_date, new.pay_range)
     is distinct from (old.title, old.body, old.region_key, old.care_types, old.schedule, old.recipient, old.duration, old.town, old.hours_per_week, old.start_date, old.pay_range) then
    if old.kind = 'family' and old.expires_at < now() then
      raise exception 'This post''s 14-day window has ended, so it can no longer be edited.' using errcode = 'P0001';
    end if;
    if old.kind = 'family' and new.region_key <> old.region_key then
      raise exception 'The region of a post can''t be changed. Close it and post again in the new region.' using errcode = 'P0001';
    end if;
    new.edit_count := old.edit_count + 1;
    if new.edit_count >= setting_int('post_edit_flag_after') then new.flagged := true; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists guard_post_update on public.posts;
create trigger guard_post_update before update on public.posts for each row execute function public.guard_post_update();

-- New message: bump the conversation, notify the other person (rate-limited).
create or replace function public.on_message() returns trigger
language plpgsql security definer set search_path = public as
$$
declare c conversations; other uuid; n int; sender_name text;
begin
  select * into c from conversations where id = new.conversation_id;
  select count(*) into n from messages where sender_id = new.sender_id and created_at > now() - interval '1 minute';
  if n > setting_int('messages_per_minute') then
    raise exception 'You''re sending messages very quickly. Please wait a moment.' using errcode = 'P0001';
  end if;
  update conversations set last_message_at = new.created_at, last_message = left(new.body, 140),
    a_read_at = case when new.sender_id = user_a then new.created_at else a_read_at end,
    b_read_at = case when new.sender_id = user_b then new.created_at else b_read_at end
   where id = c.id;
  other := case when new.sender_id = c.user_a then c.user_b else c.user_a end;
  select full_name into sender_name from profiles where id = new.sender_id;
  -- one unread "new message" notification per conversation at a time
  if not exists (select 1 from notifications where user_id = other and kind = 'message' and link like '%' || c.id::text and read_at is null) then
    perform push_notification(other, 'message', 'New message from ' || coalesce(nullif(sender_name,''),'a member'), left(new.body, 120),
      '/portal/' || (case when other = c.user_a then c.role_a else c.role_b end) || '/messages/' || c.id::text);
  end if;
  return new;
end $$;
drop trigger if exists on_message on public.messages;
create trigger on_message after insert on public.messages for each row execute function public.on_message();

-- New open post → notify caregivers who can see that region.
create or replace function public.on_post_created() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  insert into notifications (user_id, kind, title, body, link)
  select p.id, 'post', 'New ' || (case when new.kind = 'family' then 'care request' else 'job post' end) || ' in ' || r.name,
         new.title, '/portal/caregiver/posts/' || new.id::text
    from profiles p join regions r on r.key = new.region_key
   where 'caregiver' = any(p.roles) and p.status = 'active' and p.id <> new.author_id
     and new.region_key = any(public.access_regions(p.id, 'caregiver'))
     and coalesce((p.settings->>'email_posts')::boolean, true);
  return new;
end $$;
drop trigger if exists on_post_created on public.posts;
create trigger on_post_created after insert on public.posts for each row execute function public.on_post_created();

-- =====================================================================================
-- Business-rule RPCs (called from the site with the user's session)
-- =====================================================================================

-- Families: 1 free post every 14 days. Agencies: unlimited, in regions they pay for.
create or replace function public.create_post(p jsonb) returns uuid
language plpgsql security definer set search_path = public as
$$
declare as_role text := p->>'as'; last_post timestamptz; new_id uuid; cool int := setting_int('family_post_cooldown_days');
begin
  if auth.uid() is null then raise exception 'Please sign in first.' using errcode = 'P0001'; end if;
  if as_role not in ('family','agency') or not has_role(as_role) then raise exception 'Your account can''t create this kind of post.' using errcode = 'P0001'; end if;
  if as_role = 'family' then
    select max(created_at) into last_post from posts where author_id = auth.uid() and kind = 'family';
    if last_post is not null and last_post > now() - make_interval(days => cool) then
      raise exception 'You can post once every % days. Your next free post opens on %.', cool, to_char(last_post + make_interval(days => cool), 'FMMonth FMDD') using errcode = 'P0001';
    end if;
  else
    if not ((p->>'region_key') = any(access_regions(auth.uid(), 'agency'))) then
      raise exception 'Subscribe to this region to post jobs in it.' using errcode = 'P0001';
    end if;
  end if;
  insert into posts (author_id, kind, title, body, region_key, town, care_types, recipient, duration, schedule, hours_per_week, start_date, pay_range, expires_at)
  values (auth.uid(), as_role, trim(p->>'title'), trim(p->>'body'), p->>'region_key', nullif(trim(p->>'town'),''),
          coalesce(array(select jsonb_array_elements_text(p->'care_types')), '{}'),
          nullif(p->>'recipient',''), nullif(p->>'duration',''), coalesce(p->'schedule','{}'),
          nullif(p->>'hours_per_week','')::int, nullif(p->>'start_date','')::date, nullif(trim(p->>'pay_range'),''),
          case when as_role = 'family' then now() + make_interval(days => cool) else now() + interval '60 days' end)
  returning id into new_id;
  if as_role = 'family' then
    insert into contact_quotas (post_id, family_id, free_limit) values (new_id, auth.uid(), setting_int('free_contacts_per_post'));
  end if;
  return new_id;
end $$;

-- Start (or reopen) a conversation and send the first message.
--  caregiver → family/agency post: free, needs region access for that post's region
--  family → caregiver: uses 1 of the post's contacts (10 free + packs)
--  agency → caregiver: unlimited, caregiver must serve one of the agency's regions
create or replace function public.start_conversation(p_as text, p_other uuid, p_post uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as
$$
declare me uuid := auth.uid(); other_role text; pst posts; q contact_quotas; cid uuid; is_new boolean := false; n int; counted boolean := false;
begin
  if me is null then raise exception 'Please sign in first.' using errcode = 'P0001'; end if;
  if p_other = me then raise exception 'You can''t message yourself.' using errcode = 'P0001'; end if;
  if not has_role(p_as) then raise exception 'Your account doesn''t have access to this portal.' using errcode = 'P0001'; end if;
  if coalesce(char_length(trim(p_body)),0) = 0 then raise exception 'Write a message first.' using errcode = 'P0001'; end if;
  if is_blocked_between(me, p_other) then raise exception 'You can''t message this member.' using errcode = 'P0001'; end if;
  if not exists (select 1 from profiles where id = p_other and status = 'active') then raise exception 'This member isn''t available.' using errcode = 'P0001'; end if;

  if p_as = 'caregiver' then
    select * into pst from posts where id = p_post;
    if pst.id is null or pst.status <> 'open' then raise exception 'This post is no longer open.' using errcode = 'P0001'; end if;
    if pst.author_id <> p_other then raise exception 'That post belongs to someone else.' using errcode = 'P0001'; end if;
    if not (pst.region_key = any(access_regions(me, 'caregiver'))) then
      raise exception 'Unlock this region to reply to posts in it.' using errcode = 'P0001'; end if;
    other_role := pst.kind;
  elsif p_as = 'family' then
    if not exists (select 1 from profiles where id = p_other and 'caregiver' = any(roles)) then raise exception 'Families can message caregivers only.' using errcode = 'P0001'; end if;
    other_role := 'caregiver';
  elsif p_as = 'agency' then
    if not exists (select 1 from caregiver_profiles where user_id = p_other and service_regions && access_regions(me, 'agency')) then
      raise exception 'This caregiver doesn''t work in any of your subscribed regions.' using errcode = 'P0001'; end if;
    other_role := 'caregiver';
  else
    raise exception 'Not allowed.' using errcode = 'P0001';
  end if;

  select id into cid from conversations
   where (user_a = me and role_a = p_as and user_b = p_other and role_b = other_role)
      or (user_b = me and role_b = p_as and user_a = p_other and role_a = other_role);

  if cid is null then
    select count(*) into n from conversations where user_a = me and created_at > now() - interval '1 day';
    if n >= setting_int('new_chats_per_day') then
      raise exception 'You''ve started a lot of conversations today. Please try again tomorrow.' using errcode = 'P0001'; end if;
    if p_as = 'family' then
      select * into pst from posts where id = p_post and author_id = me and kind = 'family';
      if pst.id is null then raise exception 'Choose one of your care requests to contact caregivers from.' using errcode = 'P0001'; end if;
      if pst.status <> 'open' or pst.expires_at < now() then raise exception 'That request has closed. Post a new one to contact more caregivers.' using errcode = 'P0001'; end if;
      select * into q from contact_quotas where post_id = pst.id for update;
      if q.post_id is null then
        insert into contact_quotas (post_id, family_id, free_limit) values (pst.id, me, setting_int('free_contacts_per_post')) returning * into q;
      end if;
      if q.used >= q.free_limit + q.extra then
        raise exception 'QUOTA: You''ve used all % contacts for this request. Add 10 more contacts to keep reaching out.', q.free_limit + q.extra using errcode = 'P0001';
      end if;
      update contact_quotas set used = used + 1 where post_id = pst.id;
      counted := true;
    end if;
    insert into conversations (user_a, role_a, user_b, role_b, post_id, counted, b_read_at)
    values (me, p_as, p_other, other_role, p_post, counted, 'epoch') returning id into cid;
    is_new := true;
  end if;

  insert into messages (conversation_id, sender_id, body) values (cid, me, trim(p_body));
  return cid;
end $$;

create or replace function public.mark_conversation_read(p_conv uuid) returns void
language sql security definer set search_path = public as
$$
  update conversations set
    a_read_at = case when user_a = auth.uid() then now() else a_read_at end,
    b_read_at = case when user_b = auth.uid() then now() else b_read_at end
  where id = p_conv and auth.uid() in (user_a, user_b);
  update notifications set read_at = now() where user_id = auth.uid() and kind = 'message' and read_at is null and link like '%' || p_conv::text;
$$;

-- Caregiver search (families/agencies/admin). Returns public profile fields only.
create or replace function public.search_caregivers(f jsonb default '{}') returns table (
  user_id uuid, full_name text, avatar_url text, town text, headline text, bio text, credential text,
  care_types text[], recipients text[], durations text[], schedule jsonb, languages text[], years_exp int,
  rate_min numeric, has_car boolean, availability text, service_regions text[], verification text,
  member_since timestamptz, saved boolean)
language plpgsql stable security definer set search_path = public as
$$
#variable_conflict use_column
declare care text[] := array(select jsonb_array_elements_text(coalesce(f->'care','[]')));
        regs text[] := array(select jsonb_array_elements_text(coalesce(f->'regions','[]')));
        recip text := nullif(f->>'recipient',''); dur text := nullif(f->>'duration','');
        avail text := nullif(f->>'availability',''); q text := nullif(trim(f->>'q'),'');
        sched jsonb := coalesce(f->'schedule','{}'); only_verified boolean := coalesce((f->>'verified')::boolean,false);
        only_saved boolean := coalesce((f->>'saved')::boolean,false);
begin
  if auth.uid() is null or not (has_role('family') or has_role('agency') or is_admin()) then
    raise exception 'Search is for family, agency and admin accounts.' using errcode = 'P0001'; end if;
  return query
  select c.user_id, p.full_name, p.avatar_url, p.town, c.headline, c.bio, c.credential, c.care_types, c.recipients, c.durations,
         c.schedule, c.languages, c.years_exp, c.rate_min, c.has_car, c.availability, c.service_regions, c.verification, p.created_at,
         exists (select 1 from saved_caregivers s where s.user_id = auth.uid() and s.caregiver_id = c.user_id)
    from caregiver_profiles c join profiles p on p.id = c.user_id
   where p.status = 'active' and p.onboarded and p.id <> auth.uid()
     and not is_blocked_between(auth.uid(), p.id)
     and (cardinality(care) = 0 or c.care_types && care)
     and (cardinality(regs) = 0 or c.service_regions && regs)
     and (recip is null or recip = any(c.recipients))
     and (dur is null or dur = any(c.durations))
     and (avail is null or c.availability = avail)
     and (not only_verified or c.verification = 'verified')
     and (not only_saved or exists (select 1 from saved_caregivers s where s.user_id = auth.uid() and s.caregiver_id = c.user_id))
     and (q is null or p.full_name ilike '%'||q||'%' or c.headline ilike '%'||q||'%' or c.bio ilike '%'||q||'%' or p.town ilike '%'||q||'%')
     -- schedule: every requested day in every requested slot must be offered
     and not exists (
       select 1 from jsonb_each(sched) sc(slot, days), jsonb_array_elements_text(sc.days) dd(val)
        where not coalesce(c.schedule->sc.slot, '[]'::jsonb) @> to_jsonb(dd.val::int))
   order by (c.verification = 'verified') desc, (c.availability = 'available') desc, p.last_seen_at desc nulls last, p.created_at desc
   limit 200;
end $$;

-- Display info about another member (only name/town/avatar — never email, phone or address).
create or replace function public.member_card(uid uuid) returns jsonb
language sql stable security definer set search_path = public as
$$
  select jsonb_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url, 'town', p.town, 'roles', p.roles,
    'region_key', p.region_key, 'member_since', p.created_at,
    'business_name', a.business_name, 'logo_url', a.logo_url, 'agency_verification', a.verification,
    'credential', c.credential, 'caregiver_verification', c.verification, 'availability', c.availability)
  from profiles p left join agency_profiles a on a.user_id = p.id left join caregiver_profiles c on c.user_id = p.id
  where p.id = uid and auth.uid() is not null
$$;

-- ---------- Admin RPCs ----------
create or replace function public.admin_users(f jsonb default '{}') returns table (
  id uuid, email text, full_name text, roles text[], status text, town text, region_key text, created_at timestamptz,
  last_seen_at timestamptz, verification text, business_name text, onboarded boolean)
language plpgsql stable security definer set search_path = public, auth as
$$
#variable_conflict use_column
declare q text := nullif(trim(f->>'q'),''); r text := nullif(f->>'role',''); s text := nullif(f->>'status','');
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  return query
  select p.id, u.email::text, p.full_name, p.roles, p.status, p.town, p.region_key, p.created_at, p.last_seen_at,
         coalesce(c.verification, a.verification, fm.verification), a.business_name, p.onboarded
    from profiles p join auth.users u on u.id = p.id
    left join caregiver_profiles c on c.user_id = p.id left join agency_profiles a on a.user_id = p.id
    left join family_profiles fm on fm.user_id = p.id
   where (q is null or p.full_name ilike '%'||q||'%' or u.email ilike '%'||q||'%' or a.business_name ilike '%'||q||'%')
     and (r is null or r = any(p.roles)) and (s is null or p.status = s)
   order by p.created_at desc limit 500;
end $$;

create or replace function public.admin_set_status(uid uuid, new_status text, reason text default null) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  if uid = auth.uid() then raise exception 'You can''t suspend your own account.' using errcode = 'P0001'; end if;
  update profiles set status = new_status where id = uid;
  perform log_admin(case when new_status = 'suspended' then 'suspend_user' else 'reactivate_user' end, 'user', uid::text, jsonb_build_object('reason', reason));
end $$;

create or replace function public.admin_verify(uid uuid, p_kind text, p_decision text, p_note text default null) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  if p_decision not in ('verified','rejected') then raise exception 'Bad decision.'; end if;
  if p_kind = 'caregiver' then update caregiver_profiles set verification = p_decision where user_id = uid;
  elsif p_kind = 'agency' then update agency_profiles set verification = p_decision where user_id = uid;
  else update family_profiles set verification = p_decision where user_id = uid; end if;
  update verification_documents set status = case when p_decision = 'verified' then 'approved' else 'rejected' end,
         note = coalesce(p_note, verification_documents.note), reviewed_by = auth.uid(), reviewed_at = now()
   where user_id = uid and status = 'pending';
  perform push_notification(uid, 'verification', case when p_decision = 'verified' then 'You''re verified' else 'Verification needs another look' end,
    case when p_decision = 'verified' then 'Your verified badge is now showing on your profile.' else coalesce(p_note, 'Please upload a clearer document.') end,
    '/portal/' || p_kind || '/verification');
  perform log_admin('verify_' || p_decision, p_kind, uid::text, jsonb_build_object('note', p_note));
end $$;

create or replace function public.admin_grant_region(uid uuid, plan_kind text, region text, on_off boolean) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  if on_off then
    insert into region_subscriptions (user_id, region_key, plan, status, source, current_period_end)
    values (uid, region, plan_kind, 'active', 'admin', now() + interval '30 days')
    on conflict (user_id, region_key, plan) do update set status = 'active', canceled_at = null, current_period_end = now() + interval '30 days';
  else
    update region_subscriptions set status = 'canceled', canceled_at = now() where user_id = uid and region_key = region and plan = plan_kind;
  end if;
  perform log_admin(case when on_off then 'grant_region' else 'revoke_region' end, 'user', uid::text, jsonb_build_object('region', region, 'plan', plan_kind));
end $$;

create or replace function public.admin_add_contacts(p_post uuid, n int) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  update contact_quotas set extra = extra + n where post_id = p_post;
  perform log_admin('add_contacts', 'post', p_post::text, jsonb_build_object('count', n));
end $$;

create or replace function public.admin_extend_trial(uid uuid, days int) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  update caregiver_profiles set trial_ends_at = greatest(trial_ends_at, now()) + make_interval(days => days) where user_id = uid;
  perform log_admin('extend_trial', 'user', uid::text, jsonb_build_object('days', days));
end $$;

create or replace function public.admin_delete_user(uid uuid) returns void
language plpgsql security definer set search_path = public, auth as
$$
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  if uid = auth.uid() then raise exception 'You can''t delete your own account here.' using errcode = 'P0001'; end if;
  perform log_admin('delete_user', 'user', uid::text, (select jsonb_build_object('name', full_name) from profiles where id = uid));
  delete from auth.users where id = uid;
end $$;

create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as
$$
declare out jsonb;
begin
  if not is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users', (select count(*) from profiles),
    'caregivers', (select count(*) from profiles where 'caregiver' = any(roles)),
    'families', (select count(*) from profiles where 'family' = any(roles)),
    'agencies', (select count(*) from profiles where 'agency' = any(roles)),
    'suspended', (select count(*) from profiles where status = 'suspended'),
    'new_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'open_posts', (select count(*) from posts where status = 'open'),
    'flagged_posts', (select count(*) from posts where flagged and status <> 'hidden'),
    'open_reports', (select count(*) from reports where status = 'open'),
    'new_contacts', (select count(*) from contact_messages where status = 'new'),
    'pending_verifications', (select count(*) from verification_documents where status = 'pending'),
    'active_subs', (select count(*) from region_subscriptions where status = 'active'),
    'trialing', (select count(*) from caregiver_profiles where trial_ends_at > now()),
    'mrr_cents', (select coalesce(sum(case when plan = 'caregiver' then setting_num('caregiver_region_price') else setting_num('agency_region_price') end * 100),0)::int
                    from region_subscriptions where status = 'active' and source = 'stripe'),
    'revenue_30d_cents', (select coalesce(sum(amount_cents),0) from payments where status = 'paid' and created_at > now() - interval '30 days'),
    'refunded_30d_cents', (select coalesce(sum(amount_cents),0) from payments where status = 'refunded' and created_at > now() - interval '30 days'),
    'messages_7d', (select count(*) from messages where created_at > now() - interval '7 days'),
    'signups_by_day', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d), '[]') from (
        select gs::date d, (select count(*) from profiles where created_at::date = gs::date) n
          from generate_series(current_date - 29, current_date, interval '1 day') gs) x),
    'revenue_by_month', (select coalesce(jsonb_agg(jsonb_build_object('m', m, 'cents', c) order by m), '[]') from (
        select to_char(gs, 'YYYY-MM') m, (select coalesce(sum(amount_cents),0) from payments where status = 'paid' and to_char(created_at,'YYYY-MM') = to_char(gs,'YYYY-MM')) c
          from generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') gs) y),
    'subs_by_region', (select coalesce(jsonb_agg(jsonb_build_object('region', r.key, 'name', r.name, 'caregivers', (select count(*) from region_subscriptions s where s.region_key = r.key and s.plan = 'caregiver' and s.status = 'active'),
        'agencies', (select count(*) from region_subscriptions s where s.region_key = r.key and s.plan = 'agency' and s.status = 'active'),
        'posts', (select count(*) from posts p where p.region_key = r.key and p.status = 'open')) order by r.sort), '[]') from regions r)
  ) into out;
  return out;
end $$;

-- =====================================================================================
-- Row-level security
-- =====================================================================================
alter table public.app_settings enable row level security;
alter table public.regions enable row level security;
alter table public.care_categories enable row level security;
alter table public.profiles enable row level security;
alter table public.caregiver_profiles enable row level security;
alter table public.family_profiles enable row level security;
alter table public.agency_profiles enable row level security;
alter table public.region_subscriptions enable row level security;
alter table public.posts enable row level security;
alter table public.contact_quotas enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.payments enable row level security;
alter table public.verification_documents enable row level security;
alter table public.saved_caregivers enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_logs enable row level security;
alter table public.kk_posts enable row level security;
alter table public.kk_comments enable row level security;
alter table public.contact_messages enable row level security;

-- drop every existing policy on these tables so re-running stays clean
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' and tablename in
    ('app_settings','regions','care_categories','profiles','caregiver_profiles','family_profiles','agency_profiles','region_subscriptions',
     'posts','contact_quotas','conversations','messages','blocks','reports','payments','verification_documents','saved_caregivers',
     'notifications','admin_logs','kk_posts','kk_comments','contact_messages')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;

-- reference data: everyone reads; admins write
create policy "read settings" on public.app_settings for select using (true);
create policy "admin settings" on public.app_settings for all to authenticated using (is_admin()) with check (is_admin());
create policy "read regions" on public.regions for select using (true);
create policy "admin regions" on public.regions for all to authenticated using (is_admin()) with check (is_admin());
create policy "read care" on public.care_categories for select using (true);
create policy "admin care" on public.care_categories for all to authenticated using (is_admin()) with check (is_admin());

-- profiles: signed-in members see basic profiles (no email/phone/address live here)
create policy "members read profiles" on public.profiles for select to authenticated using (status = 'active' or id = auth.uid() or is_admin());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy "admin profile delete" on public.profiles for delete to authenticated using (is_admin());

create policy "caregiver read" on public.caregiver_profiles for select to authenticated
  using (user_id = auth.uid() or is_admin() or has_role('family') or has_role('agency'));
create policy "caregiver write" on public.caregiver_profiles for update to authenticated using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy "caregiver insert" on public.caregiver_profiles for insert to authenticated with check (user_id = auth.uid() and has_role('caregiver'));

create policy "family read own" on public.family_profiles for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "family write" on public.family_profiles for update to authenticated using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy "family insert" on public.family_profiles for insert to authenticated with check (user_id = auth.uid() and has_role('family'));

create policy "agency read" on public.agency_profiles for select to authenticated using (true);
create policy "agency write" on public.agency_profiles for update to authenticated using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
create policy "agency insert" on public.agency_profiles for insert to authenticated with check (user_id = auth.uid() and has_role('agency'));

create policy "own subs" on public.region_subscriptions for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "admin subs" on public.region_subscriptions for all to authenticated using (is_admin()) with check (is_admin());

-- posts: authors see their own; caregivers see open posts in regions they can access; admins see all.
-- Families and agencies never see each other's posts.
create policy "read posts" on public.posts for select to authenticated using (
  author_id = auth.uid() or is_admin()
  or (status = 'open' and has_role('caregiver') and region_key = any(access_regions(auth.uid(), 'caregiver')))
);
create policy "author edits post" on public.posts for update to authenticated using (author_id = auth.uid() or is_admin()) with check (author_id = auth.uid() or is_admin());
create policy "author deletes post" on public.posts for delete to authenticated using (author_id = auth.uid() or is_admin());
-- inserts only through create_post()

create policy "own quotas" on public.contact_quotas for select to authenticated using (family_id = auth.uid() or is_admin());

create policy "members read convs" on public.conversations for select to authenticated using (auth.uid() in (user_a, user_b) or is_admin());
-- conversations are created only through start_conversation()

create policy "members read msgs" on public.messages for select to authenticated using (
  exists (select 1 from conversations c where c.id = conversation_id and (auth.uid() in (c.user_a, c.user_b) or is_admin())));
create policy "members send msgs" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and has_role_any()
  and exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)
              and not is_blocked_between(c.user_a, c.user_b)));

create policy "own blocks" on public.blocks for select to authenticated using (blocker_id = auth.uid() or is_admin());
create policy "add block" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "remove block" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

create policy "file report" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "read reports" on public.reports for select to authenticated using (reporter_id = auth.uid() or is_admin());
create policy "admin reports" on public.reports for update to authenticated using (is_admin()) with check (is_admin());

create policy "own payments" on public.payments for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "admin payments" on public.payments for all to authenticated using (is_admin()) with check (is_admin());

create policy "own docs" on public.verification_documents for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "upload doc" on public.verification_documents for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "remove own pending doc" on public.verification_documents for delete to authenticated using ((user_id = auth.uid() and status = 'pending') or is_admin());
create policy "admin docs" on public.verification_documents for update to authenticated using (is_admin()) with check (is_admin());

create policy "own saved" on public.saved_caregivers for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "read notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "clear notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());

create policy "admin logs" on public.admin_logs for select to authenticated using (is_admin());

-- Kommunity Korner: anyone can read open items; members post and comment
create policy "read kk" on public.kk_posts for select using (status <> 'hidden' or author_id = auth.uid() or is_admin());
create policy "post kk" on public.kk_posts for insert to authenticated with check (author_id = auth.uid() and has_role_any());
create policy "edit kk" on public.kk_posts for update to authenticated using (author_id = auth.uid() or is_admin()) with check (author_id = auth.uid() or is_admin());
create policy "delete kk" on public.kk_posts for delete to authenticated using (author_id = auth.uid() or is_admin());
create policy "read kk comments" on public.kk_comments for select using (true);
create policy "comment kk" on public.kk_comments for insert to authenticated with check (author_id = auth.uid() and has_role_any());
create policy "delete kk comment" on public.kk_comments for delete to authenticated using (author_id = auth.uid() or is_admin());

create policy "send contact" on public.contact_messages for insert to anon, authenticated with check (status = 'new');
create policy "admin contact" on public.contact_messages for all to authenticated using (is_admin()) with check (is_admin());

-- Public (signed-out) Kommunity Korner listing needs author names: expose only name + town.
create or replace function public.kk_feed() returns table (
  id uuid, title text, body text, category text, condition text, region_key text, status text, created_at timestamptz,
  author_id uuid, author_name text, author_town text, comments bigint)
language sql stable security definer set search_path = public as
$$
  select k.id, k.title, k.body, k.category, k.condition, k.region_key, k.status, k.created_at, k.author_id,
         split_part(p.full_name, ' ', 1) || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', ''),
         p.town, (select count(*) from kk_comments c where c.post_id = k.id)
    from kk_posts k join profiles p on p.id = k.author_id
   where k.status <> 'hidden' and p.status = 'active'
   order by k.created_at desc limit 200
$$;
create or replace function public.kk_thread(pid uuid) returns table (id uuid, body text, created_at timestamptz, author_id uuid, author_name text)
language sql stable security definer set search_path = public as
$$
  select c.id, c.body, c.created_at, c.author_id,
         split_part(p.full_name, ' ', 1) || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', '')
    from kk_comments c join profiles p on p.id = c.author_id where c.post_id = pid order by c.created_at
$$;


-- ---------- Grants ----------
grant usage on schema public to anon, authenticated;
grant select on public.app_settings, public.regions, public.care_categories, public.kk_posts, public.kk_comments to anon;
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert on public.posts, public.conversations, public.contact_quotas, public.admin_logs from authenticated;
grant execute on all functions in schema public to authenticated;
grant execute on function public.kk_feed(), public.kk_thread(uuid) to anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.push_notification(uuid, text, text, text, text) from public, anon, authenticated;

-- ---------- Public /requests teaser ----------
create or replace function public.public_request_teasers()
returns table (id uuid, region_key text, care_types text[], recipient text, duration text,
               schedule jsonb, hours_per_week int, start_date date, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.region_key, p.care_types, p.recipient, p.duration, p.schedule, p.hours_per_week, p.start_date, p.created_at
  from posts p join profiles a on a.id = p.author_id
  where p.kind = 'family' and p.status = 'open' and p.expires_at > now() and not p.flagged and a.status = 'active'
  order by p.created_at desc
  limit 200;
$$;
revoke all on function public.public_request_teasers() from public;
grant execute on function public.public_request_teasers() to anon, authenticated;

-- ---------- Realtime (live chat + notification badges) ----------
do $$ begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.conversations; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/png','image/jpeg','image/webp']),
       ('verification', 'verification', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "k4l avatar read" on storage.objects;
drop policy if exists "k4l avatar write" on storage.objects;
drop policy if exists "k4l avatar update" on storage.objects;
drop policy if exists "k4l avatar delete" on storage.objects;
drop policy if exists "k4l verification upload" on storage.objects;
drop policy if exists "k4l verification read" on storage.objects;
drop policy if exists "k4l verification delete" on storage.objects;
create policy "k4l avatar read" on storage.objects for select using (bucket_id = 'avatars');
create policy "k4l avatar write" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "k4l avatar update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "k4l avatar delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "k4l verification upload" on storage.objects for insert to authenticated with check (bucket_id = 'verification' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "k4l verification read" on storage.objects for select to authenticated using (bucket_id = 'verification' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "k4l verification delete" on storage.objects for delete to authenticated using (bucket_id = 'verification' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

notify pgrst, 'reload schema';

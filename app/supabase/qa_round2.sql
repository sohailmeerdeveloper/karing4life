-- =====================================================================================
-- QA round 2 fixes (privacy, cooldown, verification status, notifications, Kommunity).
-- Run in Supabase: Dashboard → SQL Editor → New query → paste this whole file → Run.
-- Safe to re-run. The same changes are also folded into platform_schema.sql.
--
--  PERM-01  Members could read every row of `profiles` (surname, town, status, last seen,
--           settings). Now: own row + admins only. Other members' names come from
--           member_cards(), which only returns people you have a reason to see.
--  SEC-01   EIN, license numbers and trial dates were readable by every member.
--           caregiver_profiles / agency_profiles are now own row + admins only. Public
--           caregiver details come from search_caregivers() (no license, no trial date).
--  FAM-01   Deleting a request reset the 14-day cooldown. create_post() now also checks
--           family_post_log, which keeps the last post time even after a delete.
--  DATA-01  Removing the only pending verification document left the member "In review".
--  NOTIF-01 Deleting (or hiding) a post now removes the "new post" notifications for it.
--  SEC-03   Kommunity: anonymous visitors no longer get author ids or home towns.
--  PERM-02  Message notifications show a family as "First L.", like everywhere else.
-- =====================================================================================

-- ---------- Cooldown log (FAM-01) ----------
create table if not exists public.family_post_log (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  last_post_at timestamptz not null
);
alter table public.family_post_log enable row level security;
drop policy if exists "own post log" on public.family_post_log;
create policy "own post log" on public.family_post_log for select to authenticated using (user_id = auth.uid() or public.is_admin());
grant select on public.family_post_log to authenticated;
revoke insert, update, delete on public.family_post_log from authenticated, anon;
-- backfill from the posts that still exist
insert into public.family_post_log (user_id, last_post_at)
select author_id, max(created_at) from public.posts where kind = 'family' group by author_id
on conflict (user_id) do update set last_post_at = greatest(public.family_post_log.last_post_at, excluded.last_post_at);

create or replace function public.create_post(p jsonb) returns uuid
language plpgsql security definer set search_path = public as
$$
declare as_role text := p->>'as'; last_post timestamptz; new_id uuid; cool int := setting_int('family_post_cooldown_days');
begin
  if auth.uid() is null then raise exception 'Please sign in first.' using errcode = 'P0001'; end if;
  if as_role not in ('family','agency') or not has_role(as_role) then raise exception 'Your account can''t create this kind of post.' using errcode = 'P0001'; end if;
  if as_role = 'family' then
    -- the log survives deleted posts, so deleting a request doesn't reset the cooldown
    select greatest((select max(created_at) from posts where author_id = auth.uid() and kind = 'family'),
                    (select last_post_at from family_post_log where user_id = auth.uid()))
      into last_post;
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
    insert into family_post_log (user_id, last_post_at) values (auth.uid(), now())
    on conflict (user_id) do update set last_post_at = excluded.last_post_at;
  end if;
  return new_id;
end $$;

-- ---------- Verification status follows the documents (DATA-01) ----------
-- System updates (triggers) set k4l.system so the self-verify guard lets them through.
create or replace function public.guard_verification() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if not public.is_admin() and auth.uid() is not null and coalesce(current_setting('k4l.system', true), '') <> 'on' then
    if new.verification <> old.verification and not (old.verification in ('unverified','rejected') and new.verification = 'pending') then
      new.verification := old.verification;
    end if;
    if tg_table_name = 'caregiver_profiles' then new.trial_ends_at := old.trial_ends_at; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.on_verification_doc_deleted() returns trigger
language plpgsql security definer set search_path = public as
$$
declare back_to text;
begin
  if exists (select 1 from verification_documents where user_id = old.user_id and status = 'pending') then return old; end if;
  back_to := case when exists (select 1 from verification_documents where user_id = old.user_id and status = 'rejected') then 'rejected' else 'unverified' end;
  perform set_config('k4l.system', 'on', true);
  update caregiver_profiles set verification = back_to where user_id = old.user_id and verification = 'pending';
  update agency_profiles    set verification = back_to where user_id = old.user_id and verification = 'pending';
  update family_profiles    set verification = back_to where user_id = old.user_id and verification = 'pending';
  perform set_config('k4l.system', '', true);
  return old;
end $$;
drop trigger if exists on_verification_doc_deleted on public.verification_documents;
create trigger on_verification_doc_deleted after delete on public.verification_documents for each row execute function public.on_verification_doc_deleted();
-- fix members already stuck "in review" with nothing left to review
do $$ begin
  perform set_config('k4l.system', 'on', true);
  update caregiver_profiles c set verification = 'unverified' where verification = 'pending'
     and not exists (select 1 from verification_documents d where d.user_id = c.user_id and d.status = 'pending');
  update agency_profiles a set verification = 'unverified' where verification = 'pending'
     and not exists (select 1 from verification_documents d where d.user_id = a.user_id and d.status = 'pending');
  update family_profiles f set verification = 'unverified' where verification = 'pending'
     and not exists (select 1 from verification_documents d where d.user_id = f.user_id and d.status = 'pending');
  perform set_config('k4l.system', '', true);
end $$;

-- ---------- Notifications for deleted / hidden posts (NOTIF-01) ----------
create or replace function public.on_post_gone() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if tg_op = 'DELETE' then
    delete from notifications where kind = 'post' and link = '/portal/caregiver/posts/' || old.id::text;
    return old;
  end if;
  if new.status = 'hidden' then
    delete from notifications where kind = 'post' and link = '/portal/caregiver/posts/' || old.id::text;
  end if;
  return new;
end $$;
drop trigger if exists on_post_gone on public.posts;
create trigger on_post_gone after delete or update of status on public.posts for each row execute function public.on_post_gone();
delete from public.notifications n where n.kind = 'post' and n.link like '/portal/caregiver/posts/%'
  and not exists (select 1 from public.posts p where '/portal/caregiver/posts/' || p.id::text = n.link and p.status <> 'hidden');

-- ---------- Message notifications: families shown as "First L." (PERM-02) ----------
create or replace function public.short_name(n text) returns text
language sql immutable set search_path = public as
$$ select nullif(split_part(trim(coalesce(n,'')), ' ', 1) || coalesce(' ' || left(nullif(split_part(trim(coalesce(n,'')), ' ', 2), ''), 1) || '.', ''), '') $$;

create or replace function public.on_message() returns trigger
language plpgsql security definer set search_path = public as
$$
declare c conversations; other uuid; n int; sender_name text; sender_role text;
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
  sender_role := case when new.sender_id = c.user_a then c.role_a else c.role_b end;
  select case when sender_role = 'agency' then coalesce(nullif(a.business_name,''), p.full_name)
              when sender_role = 'family' then short_name(p.full_name)
              else p.full_name end
    into sender_name
    from profiles p left join agency_profiles a on a.user_id = p.id where p.id = new.sender_id;
  -- one unread "new message" notification per conversation at a time
  if not exists (select 1 from notifications where user_id = other and kind = 'message' and link like '%' || c.id::text and read_at is null) then
    perform push_notification(other, 'message', 'New message from ' || coalesce(nullif(sender_name,''),'a member'), left(new.body, 120),
      '/portal/' || (case when other = c.user_a then c.role_a else c.role_b end) || '/messages/' || c.id::text);
  end if;
  return new;
end $$;

-- ---------- Who can see whom (PERM-01, SEC-01) ----------
-- Display info for other members, only for people the caller has a reason to see:
-- themselves, people they share a conversation with, authors of posts they can see,
-- caregivers (for families/agencies, who can search them anyway) and agencies.
-- Families are shown as "First L." and never with a town. Admins see everyone.
create or replace function public.member_cards(ids uuid[]) returns table (
  id uuid, full_name text, short_name text, avatar_url text, town text, business_name text, logo_url text)
language sql stable security definer set search_path = public as
$$
  with me as (select auth.uid() as uid, public.is_admin() as adm, public.has_role('family') or public.has_role('agency') as searcher,
                     case when public.has_role('caregiver') then public.access_regions(auth.uid(), 'caregiver') else '{}'::text[] end as regs)
  select p.id,
         case when p.id = me.uid or me.adm or 'caregiver' = any(p.roles) or 'agency' = any(p.roles) then p.full_name end,
         public.short_name(p.full_name),
         p.avatar_url,
         case when p.id = me.uid or me.adm or 'caregiver' = any(p.roles) or 'agency' = any(p.roles) then p.town end,
         a.business_name, a.logo_url
    from profiles p cross join me
    left join agency_profiles a on a.user_id = p.id
   where me.uid is not null and p.id = any(ids) and (
         p.id = me.uid or me.adm
      or exists (select 1 from conversations c where (c.user_a = me.uid and c.user_b = p.id) or (c.user_b = me.uid and c.user_a = p.id))
      or exists (select 1 from posts po where po.author_id = p.id and po.status = 'open' and po.region_key = any(me.regs))
      or ('caregiver' = any(p.roles) and me.searcher)
      or ('agency' = any(p.roles) and public.has_role_any()))
$$;
revoke all on function public.member_cards(uuid[]) from public, anon;
grant execute on function public.member_cards(uuid[]) to authenticated;

-- the old single-member card returned anyone's details: route it through the same rules
create or replace function public.member_card(uid uuid) returns jsonb
language sql stable security definer set search_path = public as
$$
  select jsonb_build_object('id', m.id, 'full_name', coalesce(m.full_name, m.short_name), 'avatar_url', m.avatar_url, 'town', m.town,
    'business_name', m.business_name, 'logo_url', m.logo_url)
  from public.member_cards(array[uid]) m
$$;

-- Caregiver search, plus `id` to open one caregiver's public profile.
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
        fid uuid := nullif(f->>'id','')::uuid;
begin
  if auth.uid() is null or not (has_role('family') or has_role('agency') or is_admin()) then
    raise exception 'Search is for family, agency and admin accounts.' using errcode = 'P0001'; end if;
  return query
  select c.user_id, p.full_name, p.avatar_url, p.town, c.headline, c.bio, c.credential, c.care_types, c.recipients, c.durations,
         c.schedule, c.languages, c.years_exp, c.rate_min, c.has_car, c.availability, c.service_regions, c.verification, p.created_at,
         exists (select 1 from saved_caregivers s where s.user_id = auth.uid() and s.caregiver_id = c.user_id)
    from caregiver_profiles c join profiles p on p.id = c.user_id
   where p.status = 'active' and (p.onboarded or fid is not null) and (p.id <> auth.uid() or fid is not null)
     and (fid is null or c.user_id = fid)
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

drop policy if exists "members read profiles" on public.profiles;
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "caregiver read" on public.caregiver_profiles;
create policy "caregiver read" on public.caregiver_profiles for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "agency read" on public.agency_profiles;
create policy "agency read" on public.agency_profiles for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- Kommunity Korner without ids for the public (SEC-03) ----------
revoke select on public.kk_posts, public.kk_comments from anon;
drop function if exists public.kk_feed();
create function public.kk_feed() returns table (
  id uuid, title text, body text, category text, condition text, region_key text, status text, created_at timestamptz,
  mine boolean, author_name text, author_town text, comments bigint)
language sql stable security definer set search_path = public as
$$
  select k.id, k.title, k.body, k.category, k.condition, k.region_key, k.status, k.created_at,
         k.author_id = auth.uid(), public.short_name(p.full_name),
         case when auth.uid() is not null then p.town end,
         (select count(*) from kk_comments c where c.post_id = k.id)
    from kk_posts k join profiles p on p.id = k.author_id
   where k.status <> 'hidden' and p.status = 'active'
   order by k.created_at desc limit 200
$$;
drop function if exists public.kk_thread(uuid);
create function public.kk_thread(pid uuid) returns table (id uuid, body text, created_at timestamptz, mine boolean, author_name text)
language sql stable security definer set search_path = public as
$$
  select c.id, c.body, c.created_at, c.author_id = auth.uid(), public.short_name(p.full_name)
    from kk_comments c join profiles p on p.id = c.author_id where c.post_id = pid order by c.created_at
$$;
grant execute on function public.kk_feed(), public.kk_thread(uuid) to anon, authenticated;

notify pgrst, 'reload schema';

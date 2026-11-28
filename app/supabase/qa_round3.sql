-- =====================================================================================
-- QA round 3 fixes (Kommunity privacy, old notification names).
-- Run in Supabase: Dashboard → SQL Editor → New query → paste this whole file → Run.
-- Safe to re-run. Needs qa_round2.sql first (it already ran on the live project).
-- The same changes are also folded into platform_schema.sql.
--
--  R3-NEW-02  Signed-in members could read kk_posts / kk_comments directly, author ids
--             included. Now each member reads only their own rows (admins: all). Everyone
--             else reads the Korner through kk_feed() / kk_thread(), which hide author ids.
--  R3-NEW-01  kk_feed() returned every author's home town to signed-in members, so a family
--             showed as "QA F., Smithtown". The Korner shows the item's region, never anyone's
--             home town (the column stays, always empty, so older pages keep working).
--  R3-NEW-04  "New message from …" notifications created before round 2 still named a family
--             in full. They are rewritten to "First L.", like new ones.
-- =====================================================================================

-- ---------- Kommunity tables: own rows + admins (R3-NEW-02) ----------
drop policy if exists "read kk" on public.kk_posts;
create policy "read kk" on public.kk_posts for select to authenticated using (author_id = auth.uid() or public.is_admin());
drop policy if exists "read kk comments" on public.kk_comments;
create policy "read kk comments" on public.kk_comments for select to authenticated using (author_id = auth.uid() or public.is_admin());
revoke select on public.kk_posts, public.kk_comments from anon;

-- ---------- Korner listing without home towns (R3-NEW-01) ----------
create or replace function public.kk_feed() returns table (
  id uuid, title text, body text, category text, condition text, region_key text, status text, created_at timestamptz,
  mine boolean, author_name text, author_town text, comments bigint)
language sql stable security definer set search_path = public as
$$
  select k.id, k.title, k.body, k.category, k.condition, k.region_key, k.status, k.created_at,
         k.author_id = auth.uid(), public.short_name(p.full_name),
         null::text,   -- never a home town: families are "First L." only; the item's region is shown instead
         (select count(*) from kk_comments c where c.post_id = k.id)
    from kk_posts k join profiles p on p.id = k.author_id
   where k.status <> 'hidden' and p.status = 'active'
   order by k.created_at desc limit 200
$$;
grant execute on function public.kk_feed(), public.kk_thread(uuid) to anon, authenticated;

-- ---------- Old message notifications that name a family in full (R3-NEW-04) ----------
update public.notifications n
   set title = 'New message from ' || public.short_name(p.full_name)
  from public.conversations c, public.profiles p
 where n.kind = 'message'
   and n.link ~ '/messages/[0-9a-f-]{36}$'
   and c.id = substring(n.link from '[0-9a-f-]{36}$')::uuid
   and p.id = case when c.user_a = n.user_id then c.user_b else c.user_a end
   and (case when c.user_a = n.user_id then c.role_b else c.role_a end) = 'family'
   and n.title = 'New message from ' || p.full_name
   and public.short_name(p.full_name) is distinct from p.full_name;

notify pgrst, 'reload schema';

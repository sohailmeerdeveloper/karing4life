-- Public teaser of open family care requests for the /requests page (anyone, signed in or not).
-- Returns only non-identifying fields: never the title, description, author or town.
-- Re-runnable. Also included in platform_schema.sql.
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

notify pgrst, 'reload schema';

import { useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, q } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { usePortal } from '../context.jsx';
import { Btn, Card, Chips, Empty, Notice, PageHead, PIcon, Seg, Skel, regionName } from '../ui.jsx';
import PostCard from '../PostCard.jsx';
import { loadMembers } from './Messages.jsx';
import { SKILLED, NONSKILLED } from '../caregiver.jsx';
import { REGIONS } from '../../data/data.js';

/** Caregiver "Find work": open care requests + job posts in regions they can access. */
export default function PostFeed() {
  const { extra } = useAuth();
  const { me, base } = usePortal();
  const [kind, setKind] = useState('all');
  const [region, setRegion] = useState('');
  const [care, setCare] = useState([]);
  const [text, setText] = useState('');
  const [sort, setSort] = useState('new');
  const [showFilters, setShowFilters] = useState(false);

  const { data, loading } = useAsync(async () => {
    const access = await q(supabase.rpc('access_regions', { uid: me, plan_kind: 'caregiver' }));
    if (!access.length) return { access, posts: [], members: {}, replied: new Set() };
    const [posts, convs] = await Promise.all([
      q(supabase.from('posts').select('*').in('region_key', access).eq('status', 'open').neq('author_id', me).order('created_at', { ascending: false }).limit(300)),
      q(supabase.from('conversations').select('post_id').eq('user_a', me).eq('role_a', 'caregiver').not('post_id', 'is', null)),
    ]);
    const live = posts.filter((p) => p.kind === 'agency' || new Date(p.expires_at) > new Date());
    return { access, posts: live, members: await loadMembers(live.map((p) => p.author_id)), replied: new Set(convs.map((c) => c.post_id)) };
  }, [me]);

  const locked = useMemo(() => (extra.caregiver?.service_regions || []).filter((r) => !data?.access?.includes(r)), [extra.caregiver, data]);
  const list = useMemo(() => {
    let xs = (data?.posts || []).filter((p) =>
      (kind === 'all' || p.kind === kind) && (!region || p.region_key === region) &&
      (!care.length || p.care_types.some((c) => care.includes(c))) &&
      (!text || (p.title + ' ' + p.body + ' ' + (p.town || '')).toLowerCase().includes(text.toLowerCase())));
    if (sort === 'match') {
      const mine = new Set(extra.caregiver?.care_types || []);
      xs = [...xs].sort((a, b) => b.care_types.filter((c) => mine.has(c)).length - a.care_types.filter((c) => mine.has(c)).length);
    }
    return xs;
  }, [data, kind, region, care, text, sort, extra.caregiver]);
  const n = (k) => (data?.posts || []).filter((p) => k === 'all' || p.kind === k).length;

  return (
    <>
      <PageHead title="Find work" sub="Care requests from families and jobs from agencies in your regions. Replying is free."
        actions={<Btn variant="ghost" icon="map" to={base + '/regions'}>Manage regions</Btn>} />
      {locked.length > 0 && <Notice tone="warn" icon="lock" action={<Btn size="sm" variant="accent" to={base + '/regions'}>Unlock</Btn>}>Posts in <strong>{locked.map(regionName).join(', ')}</strong> are locked. Subscribe to see them.</Notice>}
      <div className="toolbar" style={{ marginTop: locked.length ? 16 : 0 }}>
        <div className="pin-ic"><PIcon name="search" /><input className="pin" placeholder="Search posts, towns…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search posts" /></div>
        <select className="psel" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
          <option value="">All my regions</option>
          {/* only regions you can see posts in; the rest are listed as locked (manage them in Regions) */}
          <optgroup label="Your regions">{REGIONS.filter((r) => data?.access?.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</optgroup>
          {data && REGIONS.some((r) => !data.access.includes(r.key)) && (
            <optgroup label="Locked · unlock in Regions">{REGIONS.filter((r) => !data.access.includes(r.key)).map((r) => <option key={r.key} value={r.key} disabled>{r.name} (locked)</option>)}</optgroup>
          )}
        </select>
        <select className="psel" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="new">Newest first</option><option value="match">Best match for me</option></select>
        <Btn variant={care.length ? 'soft' : 'ghost'} icon="sliders" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>Care types{care.length ? ` (${care.length})` : ''}</Btn>
      </div>
      {showFilters && (
        <Card style={{ marginBottom: 16 }} className="fade-in">
          <div className="chip-group-label">Skilled</div><Chips label="Skilled care" options={SKILLED} value={care} onChange={setCare} />
          <div className="chip-group-label" style={{ marginTop: 12 }}>Non-skilled</div><Chips label="Non-skilled care" options={NONSKILLED} value={care} onChange={setCare} />
          {care.length > 0 && <div style={{ marginTop: 12 }}><Btn size="sm" variant="link" onClick={() => setCare([])}>Clear care types</Btn></div>}
        </Card>
      )}
      <div style={{ marginBottom: 16 }}><Seg value={kind} onChange={setKind} tabs={[['all', 'All', n('all')], ['family', 'Care requests', n('family')], ['agency', 'Jobs', n('agency')]]} /></div>
      {loading ? <Skel h={180} n={3} />
        : !data.access.length ? <Card><Empty icon="lock" title="No regions unlocked" body="Choose the regions you work in. During your free trial they unlock right away." action={<Btn variant="primary" icon="map" to={base + '/regions'}>Choose regions</Btn>} /></Card>
        : list.length === 0 ? <Card><Empty icon="search" title="No posts match" body="Try fewer filters, or check back soon. You’ll get a notification when something new is posted in your regions." /></Card>
        : <div className="post-list">{list.map((p) => (
          <PostCard key={p.id} p={p} author={data.members[p.author_id]} to={base + '/posts/' + p.id} replied={data.replied.has(p.id)}>
            <span className="small muted">{p.kind === 'family' ? 'Free to reply · the family never pays for your message' : 'Agency job post'}</span>
            <Btn size="sm" variant={data.replied.has(p.id) ? 'ghost' : 'primary'} icon={data.replied.has(p.id) ? 'msg' : 'send'} to={base + '/posts/' + p.id}>{data.replied.has(p.id) ? 'View' : 'Reply'}</Btn>
          </PostCard>
        ))}</div>}
    </>
  );
}

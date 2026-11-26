import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal, otherOf } from '../context.jsx';
import { Btn, Card, Empty, Notice, PIcon, Skel, Stat, Verified, regionName } from '../ui.jsx';
import { greet, RecentChats, myConvs } from './CaregiverHome.jsx';
import { loadMembers } from './Messages.jsx';
import PostCard from '../PostCard.jsx';
import { CaregiverCard, toggleSave } from './FindCaregivers.jsx';
import StartChat from '../StartChat.jsx';

export default function AgencyHome() {
  const { extra } = useAuth();
  const { me, base, counts } = usePortal();
  const ag = extra.agency || {};
  const [chat, setChat] = useState(null);
  const { data, loading, setData } = useAsync(async () => {
    const regions = await q(supabase.rpc('access_regions', { uid: me, plan_kind: 'agency' }));
    const [jobs, convs, saved, cgs] = await Promise.all([
      q(supabase.from('posts').select('*').eq('author_id', me).eq('kind', 'agency').eq('status', 'open').order('created_at', { ascending: false })),
      myConvs(me, 'agency'),
      q(supabase.from('saved_caregivers').select('caregiver_id').eq('user_id', me)),
      regions.length ? q(supabase.rpc('search_caregivers', { f: { regions } })) : [],
    ]);
    const members = await loadMembers(convs.map((c) => otherOf(c, me).id));
    return { regions, jobs, convs, saved: saved.length, cgs, members };
  }, [me]);
  const onSave = async (c) => {
    try { await toggleSave(me, c.user_id, !c.saved); setData((d) => ({ ...d, cgs: d.cgs.map((x) => (x.user_id === c.user_id ? { ...x, saved: !c.saved } : x)) })); toast(c.saved ? 'Removed from saved' : 'Saved'); }
    catch (e) { toast.error('Couldn’t save', errText(e)); }
  };

  return (
    <>
      <section className="welcome">
        <div>
          <h1>{greet()}, {ag.business_name || 'there'}.</h1>
          <p>{data ? `${data.cgs.length} caregiver${data.cgs.length === 1 ? '' : 's'} work in your ${data.regions.length} region${data.regions.length === 1 ? '' : 's'}.` : 'Loading your regions…'}</p>
        </div>
        <div className="w-actions">
          <Btn variant="light" className="pb-light" icon="plus" to={base + '/jobs/new'}>Post a job</Btn>
          <Btn variant="ghost" icon="search" to={base + '/find'}>Find caregivers</Btn>
        </div>
      </section>
      {ag.verification !== 'verified' && <Notice tone="warn" icon="shieldCheck" action={<Btn size="sm" variant="accent" to={base + '/verification'}>Verify</Btn>}><strong>{ag.verification === 'pending' ? 'Verification in review.' : 'Verify your business'}</strong> {ag.verification === 'pending' ? 'We’ll let you know as soon as it’s approved.' : 'so caregivers know you’re a real agency. Upload an EIN letter or business document.'}</Notice>}
      {data && !data.regions.length && <Notice tone="warn" icon="map" action={<Btn size="sm" variant="accent" to={base + '/regions'}>Choose regions</Btn>}>Subscribe to a region to post jobs and message caregivers.</Notice>}

      <div className="stats" style={{ marginTop: 20 }}>
        <Stat icon="briefcase" label="Open jobs" value={loading ? '…' : data.jobs.length} to={base + '/jobs'} />
        <Stat icon="map" label="Active regions" value={loading ? '…' : data.regions.length} tone="ink" to={base + '/regions'} />
        <Stat icon="msg" label="Unread conversations" value={counts.messages} tone="sand" to={base + '/messages'} />
        <Stat icon="users" label="Caregivers in your regions" value={loading ? '…' : data.cgs.length} tone="ok" to={base + '/find'} />
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card title="Open job posts" icon="briefcase" action={<Link className="link-s" to={base + '/jobs'}>Manage<PIcon name="arrowR" /></Link>}>
            {loading ? <Skel h={140} n={2} /> : data.jobs.length === 0 ? <Empty icon="briefcase" title="No open jobs" body="Post a job and caregivers in that region are notified right away." action={data.regions.length > 0 && <Btn variant="accent" icon="plus" to={base + '/jobs/new'}>Post a job</Btn>} />
              : <div className="post-list">{data.jobs.slice(0, 3).map((p) => <PostCard key={p.id} p={p} to={base + '/jobs/' + p.id} showState />)}</div>}
          </Card>
          {data?.cgs?.length > 0 && (
            <Card title="Caregivers in your regions" icon="users" action={<Link className="link-s" to={base + '/find'}>Search<PIcon name="arrowR" /></Link>}>
              <div className="cg-grid">{data.cgs.slice(0, 3).map((c) => <CaregiverCard key={c.user_id} c={c} base={base} onSave={onSave} onMessage={setChat} />)}</div>
            </Card>
          )}
        </div>
        <div className="stack">
          <Card title="Recent messages" icon="msg" flush action={<Link className="link-s" to={base + '/messages'} style={{ marginRight: 20 }}>Inbox<PIcon name="arrowR" /></Link>}>
            {loading ? <div style={{ padding: 18 }}><Skel h={50} n={3} /></div> : <RecentChats convs={data.convs} members={data.members} me={me} base={base} empty="Message a caregiver and the conversation shows up here." />}
          </Card>
          <Card title="Company" icon="building" action={<Link className="link-s" to={base + '/company'}>Edit<PIcon name="arrowR" /></Link>}>
            <div className="kv">
              <div><span className="k">Business</span><span className="v">{ag.business_name || '—'}</span></div>
              <div><span className="k">Type</span><span className="v">{ag.agency_type}</span></div>
              <div><span className="k">Status</span><span className="v">{ag.verification === 'verified' ? <Verified status="verified" /> : ag.verification === 'pending' ? 'In review' : 'Not verified'}</span></div>
              <div><span className="k">Regions</span><span className="v">{data?.regions.map(regionName).join(', ') || '—'}</span></div>
            </div>
          </Card>
        </div>
      </div>
      <StartChat open={!!chat} onClose={() => setChat(null)} other={chat && { id: chat.user_id, name: chat.full_name, avatar: chat.avatar_url, sub: chat.credential }} />
    </>
  );
}

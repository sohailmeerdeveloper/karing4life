import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal, otherOf } from '../context.jsx';
import { Btn, Card, Empty, Notice, PIcon, Progress, Skel, Stat, fmtDate, daysLeft, regionName } from '../ui.jsx';
import { greet, first, RecentChats, myConvs } from './CaregiverHome.jsx';
import { loadMembers } from './Messages.jsx';
import { nextFreePost } from './MyPosts.jsx';
import { CaregiverCard, toggleSave } from './FindCaregivers.jsx';
import StartChat from '../StartChat.jsx';

export default function FamilyHome() {
  const { profile } = useAuth();
  const { me, base, counts, price } = usePortal();
  const [chat, setChat] = useState(null);
  const { data, loading, setData } = useAsync(async () => {
    const [posts, convs, saved] = await Promise.all([
      q(supabase.from('posts').select('*').eq('author_id', me).eq('kind', 'family').order('created_at', { ascending: false })),
      myConvs(me, 'family'),
      q(supabase.from('saved_caregivers').select('caregiver_id').eq('user_id', me)),
    ]);
    const active = posts.find((p) => p.status === 'open' && new Date(p.expires_at) > new Date()) || null;
    const quota = active ? (await supabase.from('contact_quotas').select('*').eq('post_id', active.id).maybeSingle()).data : null;
    const suggest = active ? await q(supabase.rpc('search_caregivers', { f: { care: active.care_types, regions: [active.region_key] } })) : [];
    const members = await loadMembers(convs.map((c) => otherOf(c, me).id));
    return { posts, convs, saved: saved.length, active, quota, suggest: suggest.slice(0, 3), members };
  }, [me]);

  const cooldown = data ? nextFreePost(data.posts, price('family_post_cooldown_days', 14)) : null;
  const left = data?.quota ? Math.max(0, data.quota.free_limit + data.quota.extra - data.quota.used) : 0;
  const onSave = async (c) => {
    try { await toggleSave(me, c.user_id, !c.saved); setData((d) => ({ ...d, saved: d.saved + (c.saved ? -1 : 1), suggest: d.suggest.map((x) => (x.user_id === c.user_id ? { ...x, saved: !c.saved } : x)) })); toast(c.saved ? 'Removed from saved' : 'Saved'); }
    catch (e) { toast.error('Couldn’t save', errText(e)); }
  };

  return (
    <>
      <section className="welcome">
        <div>
          <h1>{greet()}, {first(profile?.full_name)}.</h1>
          <p>{data?.active ? `Your request “${data.active.title}” is open for ${daysLeft(data.active.expires_at)} more days.` : 'Post what you need and caregivers in your region will reach out. It’s free.'}</p>
        </div>
        <div className="w-actions">
          <Btn variant="light" className="pb-light" icon="search" to={base + '/find'}>Find a caregiver</Btn>
          {cooldown ? <span data-tip={'Next free request: ' + fmtDate(cooldown.toISOString())}><Btn variant="ghost" icon="plus" disabled>New request</Btn></span> : <Btn variant="ghost" icon="plus" to={base + '/requests/new'}>Post a request</Btn>}
        </div>
      </section>

      <div className="stats">
        <Stat icon="list" label="Open requests" value={loading ? '…' : data.posts.filter((p) => p.status === 'open' && new Date(p.expires_at) > new Date()).length} to={base + '/requests'} />
        <Stat icon="users" label="Contacts left" value={loading ? '…' : data.active ? left : '—'} hint={data?.active ? 'on your open request' : 'Post a request to get 10'} tone="sand" tip="Each request includes 10 free contacts. Caregivers who message you first are always free." />
        <Stat icon="msg" label="Unread conversations" value={counts.messages} tone="ok" to={base + '/messages'} />
        <Stat icon="bookmark" label="Saved caregivers" value={loading ? '…' : data.saved} tone="ink" to={base + '/saved'} />
      </div>

      <div className="grid-main">
        <div className="stack">
          {loading ? <Skel h={160} n={1} /> : data.active ? (
            <Card title="Your open request" icon="list" action={<Link className="link-s" to={base + '/requests/' + data.active.id}>Manage<PIcon name="arrowR" /></Link>}>
              <h3 style={{ fontSize: 20 }}>{data.active.title}</h3>
              <div className="post-meta" style={{ margin: '6px 0 16px' }}><span><PIcon name="pin" />{regionName(data.active.region_key)}</span><span><PIcon name="hourglass" />Closes {fmtDate(data.active.expires_at)}</span></div>
              {data.quota && <>
                <div className="flex between small" style={{ marginBottom: 6 }}><strong>Contacts used</strong><span className="money">{data.quota.used} of {data.quota.free_limit + data.quota.extra}</span></div>
                <Progress value={data.quota.used} max={data.quota.free_limit + data.quota.extra} tone={left <= 2 ? 'warn' : ''} />
              </>}
            </Card>
          ) : (
            <Card><Empty icon="pen" title={cooldown ? 'Your last request has closed' : 'Post your first care request'} body={cooldown ? `Your next free request opens on ${fmtDate(cooldown.toISOString(), { month: 'long', day: 'numeric' })}. You can still message caregivers who reach out.` : 'Tell caregivers what you need. It takes about two minutes and it’s free.'}
              action={!cooldown && <Btn variant="accent" icon="plus" to={base + '/requests/new'}>Post a request</Btn>} /></Card>
          )}
          {data?.suggest?.length > 0 && (
            <Card title="Caregivers who match your request" icon="sparkle" action={<Link className="link-s" to={`${base}/find?care=${data.active.care_types.join(',')}&region=${data.active.region_key}`}>See all<PIcon name="arrowR" /></Link>}>
              <div className="cg-grid">{data.suggest.map((c) => <CaregiverCard key={c.user_id} c={c} base={base} onSave={onSave} onMessage={setChat} />)}</div>
            </Card>
          )}
        </div>
        <div className="stack">
          <Card title="Recent messages" icon="msg" flush action={<Link className="link-s" to={base + '/messages'} style={{ marginRight: 20 }}>Inbox<PIcon name="arrowR" /></Link>}>
            {loading ? <div style={{ padding: 18 }}><Skel h={50} n={3} /></div> : <RecentChats convs={data.convs} members={data.members} me={me} base={base} empty="When caregivers reply, you’ll see them here." />}
          </Card>
          <Notice icon="lock"><strong>Your privacy.</strong> Your address is never shown. Share your phone number only when you’re ready.</Notice>
          <Notice icon="gift" action={<Btn size="sm" variant="ghost" href="/kommunity">Open</Btn>}>Have unused supplies? Share them in the <strong>Kommunity Korner</strong>.</Notice>
        </div>
      </div>
      <StartChat open={!!chat} onClose={() => setChat(null)} other={chat && { id: chat.user_id, name: chat.full_name, avatar: chat.avatar_url, sub: chat.credential }} />
    </>
  );
}

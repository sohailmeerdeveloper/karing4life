import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal, otherOf, isUnread } from '../context.jsx';
import { Avatar, Btn, Card, Empty, Notice, PIcon, Progress, Skel, Stat, daysLeft, fmtDate, timeAgo } from '../ui.jsx';
import PostCard from '../PostCard.jsx';
import { completeness } from '../caregiver.jsx';
import { loadMembers, memberName } from './Messages.jsx';

export const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
export const first = (n = '') => n.split(' ')[0] || 'there';

export function RecentChats({ convs, members, me, base, empty }) {
  if (!convs.length) return <Empty icon="msg" title="No messages yet" body={empty} />;
  return (
    <div className="rows">{convs.map((c) => {
      const o = otherOf(c, me), m = members[o.id];
      const name = memberName(m, o.role);
      return (
        <Link key={c.id} className={'row' + (isUnread(c, me) ? ' unread' : '')} to={base + '/messages/' + c.id}>
          <Avatar name={name} url={m?.agency?.logo_url || m?.avatar_url} size="sm" square={o.role === 'agency'} />
          <span className="r-main"><span className="r-t">{name}</span><span className="r-s">{c.last_message}</span></span>
          <span className="r-time">{timeAgo(c.last_message_at)}</span>
        </Link>
      );
    })}</div>
  );
}

export async function myConvs(me, role, limit = 5) {
  const all = await q(supabase.from('conversations').select('*').or(`user_a.eq.${me},user_b.eq.${me}`).order('last_message_at', { ascending: false }).limit(60));
  return all.filter((c) => (c.user_a === me ? c.role_a : c.role_b) === role).slice(0, limit);
}

export default function CaregiverHome() {
  const { profile, extra, refresh } = useAuth();
  const { me, base, counts } = usePortal();
  const cg = extra.caregiver || {};
  const comp = completeness(cg, profile);
  const trial = daysLeft(cg.trial_ends_at);

  const { data, loading } = useAsync(async () => {
    const access = await q(supabase.rpc('access_regions', { uid: me, plan_kind: 'caregiver' }));
    const [posts, convs] = await Promise.all([
      access.length ? q(supabase.from('posts').select('*').in('region_key', access).eq('status', 'open').neq('author_id', me).order('created_at', { ascending: false }).limit(30)) : [],
      myConvs(me, 'caregiver'),
    ]);
    const live = posts.filter((p) => p.kind === 'agency' || new Date(p.expires_at) > new Date());
    const members = await loadMembers([...live.slice(0, 3).map((p) => p.author_id), ...convs.map((c) => otherOf(c, me).id)]);
    return { access, posts: live, convs, members, week: live.filter((p) => new Date(p.created_at) > new Date(Date.now() - 7 * 864e5)).length };
  }, [me]);

  const setAvail = async (v) => {
    const { error } = await supabase.from('caregiver_profiles').update({ availability: v }).eq('user_id', me);
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    await refresh(); toast(v === 'available' ? 'You’re Available' : 'You’re on Fill-in', v === 'available' ? 'Families see you’re open for regular work.' : 'Families see you take shifts or a few days.');
  };

  return (
    <>
      <section className="welcome">
        <div>
          <h1>{greet()}, {first(profile?.full_name)}.</h1>
          <p>{data ? `${data.week} new post${data.week === 1 ? '' : 's'} in your regions this week.` : 'Loading your regions…'} Families can reach you while you’re {cg.availability === 'fillin' ? 'on Fill-in' : 'Available'}.</p>
        </div>
        <div className="w-actions">
          <div className="seg" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.18)' }} role="radiogroup" aria-label="Your status">
            {[['available', 'Available'], ['fillin', 'Fill-in']].map(([k, l]) => (
              <button key={k} role="radio" aria-checked={cg.availability === k} aria-selected={cg.availability === k} onClick={() => cg.availability !== k && setAvail(k)}
                style={cg.availability === k ? {} : { color: 'var(--on-deep-2)' }} data-tip={k === 'available' ? 'Open for regular work' : 'Shifts or a few days only'}>
                <span className={'dot-s' + (k === 'fillin' ? ' fill' : '')} />{l}
              </button>
            ))}
          </div>
          <Btn variant="light" className="pb-light" icon="search" to={base + '/posts'}>Find work</Btn>
        </div>
      </section>

      {!profile?.onboarded && <Notice tone="warn" icon="sparkle" action={<Btn size="sm" variant="accent" to={base + '/onboarding'}>Finish setup</Btn>}><strong>Finish setting up your profile</strong> so families can find you in search.</Notice>}
      {profile?.onboarded && trial > 0 && <Notice tone="ok" icon="sparkle" action={<Btn size="sm" variant="ghost" to={base + '/billing'}>Plans</Btn>}><strong>Free trial: {trial} day{trial === 1 ? '' : 's'} left</strong> (until {fmtDate(cg.trial_ends_at)}). Every region you chose is unlocked.</Notice>}

      <div className="stats" style={{ marginTop: 20 }}>
        <Stat icon="list" label="Open posts in your regions" value={loading ? '…' : data.posts.length} to={base + '/posts'} />
        <Stat icon="msg" label="Unread conversations" value={counts.messages} tone="sand" to={base + '/messages'} />
        <Stat icon="zap" label="Profile strength" value={comp.pct + '%'} tone={comp.pct === 100 ? 'ok' : undefined} to={base + '/profile'} />
        <Stat icon="map" label="Unlocked regions" value={loading ? '…' : data.access.length} tone="ink" to={base + '/regions'} />
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card title="Newest in your regions" icon="list" action={<Link className="link-s" to={base + '/posts'}>See all<PIcon name="arrowR" /></Link>}>
            {loading ? <Skel h={150} n={2} /> : data.posts.length === 0 ? <Empty icon="search" title="Nothing new yet" body="You’ll get a notification as soon as a family or agency posts in your regions." action={<Btn variant="ghost" icon="map" to={base + '/regions'}>Add regions</Btn>} />
              : <div className="post-list">{data.posts.slice(0, 3).map((p) => <PostCard key={p.id} p={p} author={data.members[p.author_id]} to={base + '/posts/' + p.id} />)}</div>}
          </Card>
        </div>
        <div className="stack">
          <Card title="Recent messages" icon="msg" flush action={<Link className="link-s" to={base + '/messages'} style={{ marginRight: 20 }}>Inbox<PIcon name="arrowR" /></Link>}>
            {loading ? <div style={{ padding: 18 }}><Skel h={50} n={3} /></div> : <RecentChats convs={data.convs} members={data.members} me={me} base={base} empty="Reply to a post and the conversation shows up here." />}
          </Card>
          <Card title="Profile checklist" icon="checkCircle">
            <Progress value={comp.pct} max={100} label="Profile strength" />
            <div className="checklist" style={{ marginTop: 14 }}>
              {[['Complete your profile', 'Headline, bio, care types', '/profile', comp.pct >= 80],
                ['Choose your regions', 'Where you’re willing to work', '/regions', cg.service_regions?.length > 0],
                ['Upload verification', 'License or government ID', '/verification', cg.verification === 'verified' || cg.verification === 'pending'],
                ['Add a profile photo', 'Families reply more', '/settings', !!profile?.avatar_url]].map(([t, s, to, done]) => (
                <Link key={t} to={base + to} className={'check-item' + (done ? ' done' : '')}>
                  <span className="ck">{done && <PIcon name="check" className="pi-sm" />}</span>
                  <span><span className="ci-t" style={{ display: 'block' }}>{t}</span><span className="ci-s">{s}</span></span>
                  <PIcon name="chevR" className="pi-go pi-sm" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

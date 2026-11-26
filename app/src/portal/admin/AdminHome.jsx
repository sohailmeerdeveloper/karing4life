import { Link } from 'react-router-dom';
import { supabase, q } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { usePortal } from '../context.jsx';
import { Avatar, Badge, Btn, Card, PageHead, PIcon, Skel, Stat, money, timeAgo, fmtDate } from '../ui.jsx';
import { BarChart, LineChart, HBars } from '../charts.jsx';
import { ROLE_BADGE } from './Users.jsx';

export default function AdminHome() {
  const { base } = usePortal();
  const { data, loading, reload } = useAsync(async () => {
    const [stats, users, logs] = await Promise.all([
      q(supabase.rpc('admin_stats')),
      q(supabase.rpc('admin_users', { f: {} })),
      q(supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(6)),
    ]);
    return { s: stats, users: users.slice(0, 6), logs };
  }, []);
  const s = data?.s;
  const usd = (c, short) => (short ? '$' + Math.round(c / 100) : money(c));

  return (
    <>
      <PageHead title="Overview" sub="Everything happening on Karing4Life at a glance." actions={<Btn variant="ghost" icon="refresh" onClick={() => reload()}>Refresh</Btn>} />
      {loading && !s ? <Skel h={128} n={2} /> : (<>
        <div className="stats">
          <Stat icon="users" label="Members" value={s.users} hint={`+${s.new_7d} this week`} to={base + '/users'} />
          <Stat icon="dollar" label="Revenue, last 30 days" value={money(s.revenue_30d_cents)} hint={s.refunded_30d_cents ? `${money(s.refunded_30d_cents)} refunded` : 'No refunds'} tone="ok" to={base + '/revenue'} />
          <Stat icon="map" label="Active region plans" value={s.active_subs} hint={`${s.trialing} caregivers on trial`} tone="sand" to={base + '/revenue'} />
          <Stat icon="msg" label="Messages, last 7 days" value={s.messages_7d} hint={`${s.open_posts} open posts`} tone="ink" />
        </div>

        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[['shieldCheck', 'Verifications waiting', s.pending_verifications, '/verification', 'Review IDs, licenses and references'],
            ['flag', 'Open reports', s.open_reports, '/reports', 'Members flagged by others'],
            ['edit', 'Posts flagged for review', s.flagged_posts, '/posts?f=flagged', 'Edited several times']].map(([ic, l, n, to, sub]) => (
            <Link key={l} to={base + to} className={'check-item' + (n ? '' : ' done')} style={{ padding: 16 }}>
              <span className="stat-ic" style={n ? { background: 'var(--danger-50)', color: 'var(--danger)' } : { background: 'var(--success-50)', color: 'var(--success)' }}><PIcon name={n ? ic : 'check'} /></span>
              <span><span className="ci-t" style={{ display: 'block', textDecoration: 'none' }}>{n ? `${n} ${l.toLowerCase()}` : `No ${l.toLowerCase()}`}</span><span className="ci-s">{sub}</span></span>
              <PIcon name="chevR" className="pi-go pi-sm" />
            </Link>
          ))}
        </div>

        <div className="grid-2">
          <Card title="New members, last 30 days" icon="activity">
            <LineChart data={s.signups_by_day.map((d) => ({ label: fmtDate(d.d, { month: 'short', day: 'numeric' }), value: d.n }))} />
          </Card>
          <Card title="Revenue by month" icon="bars">
            <BarChart data={s.revenue_by_month.map((m) => ({ label: new Date(m.m + '-15').toLocaleDateString('en-US', { month: 'short' }), value: m.cents }))} format={usd} />
          </Card>
        </div>

        <div className="grid-main" style={{ marginTop: 20 }}>
          <Card title="Active plans by region" icon="map" action={<span className="legend"><span><i style={{ background: 'var(--olive)' }} />Caregivers</span><span><i style={{ background: 'var(--sand)' }} />Agencies</span></span>}>
            <HBars rows={s.subs_by_region.map((r) => ({ label: r.name, a: r.caregivers, b: r.agencies }))} aLabel="Caregivers" bLabel="Agencies" />
          </Card>
          <div className="stack">
            <Card title="Members" icon="users" flush action={<Link className="link-s" to={base + '/users'} style={{ marginRight: 20 }}>All<PIcon name="arrowR" /></Link>}>
              <div className="rows">{data.users.map((u) => (
                <Link key={u.id} className="row" to={base + '/users/' + u.id}>
                  <Avatar name={u.business_name || u.full_name} size="sm" />
                  <span className="r-main"><span className="r-t">{u.business_name || u.full_name || u.email}</span><span className="r-s">{u.roles.map((r) => ROLE_BADGE[r]).join(' · ')}</span></span>
                  <span className="r-time">{timeAgo(u.created_at)}</span>
                </Link>
              ))}</div>
            </Card>
            <Card title="Recent admin activity" icon="log" flush action={<Link className="link-s" to={base + '/logs'} style={{ marginRight: 20 }}>Log<PIcon name="arrowR" /></Link>}>
              <div className="rows">{data.logs.length ? data.logs.map((l) => (
                <div key={l.id} className="row"><span className="r-main"><span className="r-t">{l.action.replace(/_/g, ' ')}</span><span className="r-s">{l.target_type} · {l.details?.note || l.details?.reason || l.details?.region || ''}</span></span><span className="r-time">{timeAgo(l.created_at)}</span></div>
              )) : <p className="muted small" style={{ padding: 18 }}>No admin actions yet.</p>}</div>
            </Card>
          </div>
        </div>
        <div className="flex small muted" style={{ marginTop: 16, gap: 8 }}><Badge tone="line">{s.caregivers} caregivers</Badge><Badge tone="line">{s.families} families</Badge><Badge tone="line">{s.agencies} agencies</Badge>{s.suspended > 0 && <Badge tone="danger">{s.suspended} suspended</Badge>}</div>
      </>)}
    </>
  );
}

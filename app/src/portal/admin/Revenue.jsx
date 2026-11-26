import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Badge, Card, Empty, IconBtn, Notice, PageHead, PIcon, Seg, Skel, Stat, confirm, fmtDate, money, regionName } from '../ui.jsx';
import { BarChart } from '../charts.jsx';
import { loadMembers } from '../pages/Messages.jsx';

export default function Revenue() {
  const { base, price } = usePortal();
  const [tab, setTab] = useState('payments');
  const [text, setText] = useState('');
  const { data, loading, reload } = useAsync(async () => {
    const [stats, pays, subs] = await Promise.all([
      q(supabase.rpc('admin_stats')),
      q(supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(500)),
      q(supabase.from('region_subscriptions').select('*').order('created_at', { ascending: false }).limit(500)),
    ]);
    return { stats, pays, subs, members: await loadMembers([...pays, ...subs].map((x) => x.user_id)) };
  }, []);

  const name = (id) => data?.members[id]?.agency?.business_name || data?.members[id]?.full_name || '—';
  const pays = useMemo(() => (data?.pays || []).filter((p) => !text || (name(p.user_id) + ' ' + p.description).toLowerCase().includes(text.toLowerCase())), [data, text]); // eslint-disable-line react-hooks/exhaustive-deps
  const subs = useMemo(() => (data?.subs || []).filter((s) => !text || (name(s.user_id) + ' ' + regionName(s.region_key)).toLowerCase().includes(text.toLowerCase())), [data, text]); // eslint-disable-line react-hooks/exhaustive-deps

  const refund = async (p) => {
    if (!(await confirm({ title: `Refund ${money(p.amount_cents)} to ${name(p.user_id)}?`, body: 'This marks the payment refunded in Karing4Life. Once Stripe is connected (Milestone 3) it also sends the money back to their card.', confirm: 'Mark refunded', tone: 'danger', icon: 'undo' }))) return;
    const { error } = await supabase.from('payments').update({ status: 'refunded' }).eq('id', p.id);
    if (error) { toast.error('Couldn’t refund', errText(error)); return; }
    await supabase.rpc('log_admin', { a: 'refund', tt: 'payment', tid: p.id, d: { amount: p.amount_cents / 100, user: name(p.user_id) } });
    toast('Marked refunded'); reload(true);
  };
  const s = data?.stats;
  const activeStripe = (data?.subs || []).filter((x) => x.status === 'active' && x.source === 'stripe');

  return (
    <>
      <PageHead title="Subscriptions & revenue" sub="Region plans, contact packs, refunds and monthly revenue." />
      <Notice icon="card">Stripe is connected in Milestone 3. Until then this page shows payments recorded in the database; refunds here only update the record.</Notice>
      {loading && !data ? <Skel h={128} n={2} /> : (<>
        <div className="stats" style={{ marginTop: 16 }}>
          <Stat icon="refresh" label="Monthly recurring" value={money(s.mrr_cents)} hint={`${activeStripe.length} paid region plans`} />
          <Stat icon="dollar" label="Collected, last 30 days" value={money(s.revenue_30d_cents)} tone="ok" />
          <Stat icon="undo" label="Refunded, last 30 days" value={money(s.refunded_30d_cents)} tone="sand" />
          <Stat icon="hourglass" label="Caregivers on free trial" value={s.trialing} tone="ink" tip={`Each converts at $${price('caregiver_region_price', 8.99)} per region`} />
        </div>
        <Card title="Revenue by month" icon="bars" style={{ marginBottom: 20 }}>
          <BarChart data={s.revenue_by_month.map((m) => ({ label: new Date(m.m + '-15').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), value: m.cents }))} format={(c, short) => (short ? '$' + Math.round(c / 100) : money(c))} />
        </Card>
        <div className="toolbar">
          <Seg value={tab} onChange={setTab} tabs={[['payments', 'Payments', data.pays.length], ['subs', 'Region plans', data.subs.filter((x) => x.status !== 'canceled').length]]} />
          <div className="pin-ic"><PIcon name="search" /><input className="pin" placeholder="Search member or item" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search" /></div>
        </div>
        <Card flush>
          {tab === 'payments' ? (!pays.length ? <Empty icon="receipt" title="No payments" /> : (
            <div className="tbl-wrap"><table className="tbl stackable">
              <thead><tr><th>Date</th><th>Member</th><th>Item</th><th>Status</th><th className="num">Amount</th><th /></tr></thead>
              <tbody>{pays.map((p) => (
                <tr key={p.id}>
                  <td className="first">{fmtDate(p.created_at)}</td>
                  <td data-l="Member"><Link to={base + '/users/' + p.user_id}>{name(p.user_id)}</Link></td>
                  <td data-l="Item">{p.description || p.kind}</td>
                  <td data-l="Status"><Badge tone={p.status === 'paid' ? 'ok' : p.status === 'refunded' ? 'line' : 'danger'}>{p.status}</Badge></td>
                  <td data-l="Amount" className="num money">{money(p.amount_cents)}</td>
                  <td><div className="t-actions">{p.status === 'paid' && <IconBtn icon="undo" size="sm" tone="danger" label="Refund" tipPos="left" onClick={() => refund(p)} />}</div></td>
                </tr>
              ))}</tbody>
            </table></div>
          )) : (!subs.length ? <Empty icon="map" title="No region plans" /> : (
            <div className="tbl-wrap"><table className="tbl stackable">
              <thead><tr><th>Member</th><th>Plan</th><th>Region</th><th>Status</th><th>Renews</th><th>Source</th></tr></thead>
              <tbody>{subs.map((x) => (
                <tr key={x.id}>
                  <td className="first"><Link to={base + '/users/' + x.user_id}>{name(x.user_id)}</Link></td>
                  <td data-l="Plan">{x.plan === 'agency' ? 'Agency Access' : 'Region Access'}</td>
                  <td data-l="Region">{regionName(x.region_key)}</td>
                  <td data-l="Status"><Badge tone={x.status === 'active' ? 'ok' : x.status === 'past_due' ? 'warn' : 'muted'}>{x.status.replace('_', ' ')}</Badge></td>
                  <td data-l="Renews">{fmtDate(x.current_period_end)}</td>
                  <td data-l="Source">{x.source === 'admin' ? 'Courtesy' : 'Stripe'}</td>
                </tr>
              ))}</tbody>
            </table></div>
          ))}
        </Card>
      </>)}
    </>
  );
}

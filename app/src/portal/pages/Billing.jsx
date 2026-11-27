import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, q } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { usePortal } from '../context.jsx';
import { Badge, Btn, Card, Empty, Notice, PageHead, Progress, Skel, Stat, daysLeft, fmtDate, money, regionName } from '../ui.jsx';
import Checkout from '../Checkout.jsx';

export function PaymentTable({ rows }) {
  if (!rows.length) return <Empty icon="receipt" title="No payments yet" body="Receipts appear here after each charge." />;
  return (
    <div className="tbl-wrap">
      <table className="tbl stackable">
        <thead><tr><th>Date</th><th>Description</th><th>Status</th><th className="num">Amount</th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id}>
            <td data-l="Date">{fmtDate(p.created_at)}</td>
            <td data-l="Item">{p.description || (p.kind === 'contact_pack' ? 'Contact pack' : 'Subscription')}</td>
            <td data-l="Status"><Badge tone={p.status === 'paid' ? 'ok' : p.status === 'refunded' ? 'line' : 'danger'}>{p.status === 'paid' ? 'Paid' : p.status === 'refunded' ? 'Refunded' : 'Failed'}</Badge></td>
            <td data-l="Amount" className="num money">{money(p.amount_cents)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export default function Billing() {
  const { extra } = useAuth();
  const { me, role, base, price } = usePortal();
  const [params] = useSearchParams();
  const [checkout, setCheckout] = useState(null);
  const plan = role === 'agency' ? 'agency' : 'caregiver';
  const each = role === 'agency' ? price('agency_region_price', 49.99) : price('caregiver_region_price', 8.99);
  const packPrice = price('contact_pack_price', 8.99), packSize = price('contact_pack_size', 10);

  const { data, loading } = useAsync(async () => {
    const [pays, subs, posts, quotas] = await Promise.all([
      q(supabase.from('payments').select('*').eq('user_id', me).order('created_at', { ascending: false }).limit(100)),
      role === 'family' ? [] : q(supabase.from('region_subscriptions').select('*').eq('user_id', me).eq('plan', plan).neq('status', 'canceled')),
      role === 'family' ? q(supabase.from('posts').select('id,title,status,expires_at').eq('author_id', me).eq('kind', 'family').order('created_at', { ascending: false })) : [],
      role === 'family' ? q(supabase.from('contact_quotas').select('*').eq('family_id', me)) : [],
    ]);
    const forRole = pays.filter((p) => (role === 'family' ? p.kind === 'contact_pack' : p.kind === 'subscription' && (role === 'agency' ? /Agency/i.test(p.description) : !/Agency/i.test(p.description))));
    return { pays: forRole, subs, posts, quotas: Object.fromEntries(quotas.map((x) => [x.post_id, x])) };
  }, [me, role]);

  const trial = role === 'caregiver' ? daysLeft(extra.caregiver?.trial_ends_at) : 0;
  const monthly = (data?.subs || []).length * each;
  const focusPost = params.get('post');

  return (
    <>
      <PageHead title={role === 'family' ? 'Contacts & billing' : 'Billing'}
        sub={role === 'family' ? `Karing4Life is free for families. If you need to reach more than 10 caregivers on a request, add ${packSize} more for $${packPrice}.` : role === 'agency' ? `Agency Access is $${each} a month per region, billed together.` : `Region Access is $${each} a month per region, after a 14-day free trial.`}
        actions={role !== 'family' && <Btn variant="ghost" icon="external" onClick={() => setCheckout({ portal: true })}>Manage payment method</Btn>} />

      {role !== 'family' && (
        <div className="stats n3">
          <Stat icon="map" label="Active regions" value={loading ? '…' : data.subs.length} to={base + '/regions'} />
          <Stat icon="dollar" label="Monthly total" value={loading ? '…' : '$' + monthly.toFixed(2)} tone="sand" />
          {role === 'caregiver'
            ? <Stat icon="hourglass" label={trial > 0 ? 'Free trial days left' : 'Free trial'} value={trial > 0 ? trial : 'Ended'} tone={trial > 0 ? 'ok' : 'ink'} hint={trial > 0 ? 'until ' + fmtDate(extra.caregiver?.trial_ends_at) : undefined} />
            : <Stat icon="cal" label="Next renewal" value={loading || !data.subs.length ? '—' : fmtDate(data.subs.map((s) => s.current_period_end).filter(Boolean).sort()[0], { month: 'short', day: 'numeric' })} tone="ink" />}
        </div>
      )}

      <div className="grid-main">
        <div className="stack">
          {role === 'family' && (
            <Card title="Contacts per request" icon="users">
              {loading ? <Skel h={60} n={2} /> : !data.posts.length ? <Empty icon="list" title="No requests yet" body="Each request comes with 10 free contacts." action={<Btn variant="accent" icon="plus" to={base + '/requests/new'}>Post a request</Btn>} /> : (
                <div className="stack-sm">{data.posts.map((p) => {
                  const qq = data.quotas[p.id];
                  const total = qq ? qq.free_limit + qq.extra : 10, used = qq?.used || 0;
                  const open = p.status === 'open' && new Date(p.expires_at) > new Date();
                  return (
                    <div key={p.id} className="doc-row" style={focusPost === p.id ? { borderColor: 'var(--olive)', boxShadow: '0 0 0 3px rgba(var(--olive-rgb),.12)' } : undefined}>
                      <div className="d-m">
                        <strong className="trunc" style={{ display: 'block' }}>{p.title}</strong>
                        <span>{used} of {total} contacts used{open ? '' : ' · closed'}</span>
                        <div style={{ marginTop: 8 }}><Progress value={used} max={total} tone={total - used <= 2 ? 'warn' : ''} /></div>
                      </div>
                      {open && <Btn size="sm" variant="accent" icon="plus" onClick={() => setCheckout({ items: [{ label: `${packSize} extra contacts · ${p.title}`, amount: packPrice }], title: 'Contact pack' })}>{packSize} more</Btn>}
                    </div>
                  );
                })}</div>
              )}
            </Card>
          )}
          {role !== 'family' && (
            <Card title="Your subscriptions" icon="card" action={<Btn size="sm" variant="ghost" icon="map" to={base + '/regions'}>Change regions</Btn>}>
              {loading ? <Skel h={50} n={2} /> : !data.subs.length ? (
                <Empty icon="map" title="No paid regions" body={role === 'caregiver' && trial > 0 ? 'You’re on the free trial. Subscribe before it ends to keep posts unlocked.' : 'Subscribe to a region to unlock it.'} action={<Btn variant="accent" icon="card" to={base + '/regions'}>Choose regions</Btn>} />
              ) : (
                <div className="tbl-wrap"><table className="tbl stackable">
                  <thead><tr><th>Region</th><th>Status</th><th>Renews</th><th className="num">Price</th></tr></thead>
                  <tbody>{data.subs.map((s) => (
                    <tr key={s.id}>
                      <td className="first"><strong>{regionName(s.region_key)}</strong>{s.source === 'admin' && <span className="small muted"> · courtesy access</span>}</td>
                      <td data-l="Status"><Badge tone={s.status === 'active' ? 'ok' : 'warn'} icon={s.status === 'active' ? 'check' : 'alert'}>{s.status === 'active' ? 'Active' : 'Payment failed'}</Badge></td>
                      <td data-l="Renews">{fmtDate(s.current_period_end)}</td>
                      <td data-l="Price" className="num money">{s.source === 'admin' ? '$0.00' : '$' + each.toFixed(2)}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
              {data?.subs?.some((s) => s.status === 'past_due') && <div style={{ marginTop: 12 }}><Notice tone="danger" icon="alert">A payment failed. Update your card to keep access.</Notice></div>}
            </Card>
          )}
          <Card title="Payment history" icon="receipt" flush>{loading ? <div style={{ padding: 18 }}><Skel h={40} n={3} /></div> : <PaymentTable rows={data.pays} />}</Card>
        </div>
        <div className="stack">
          <Card title="How billing works" icon="info">
            <ul className="small" style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)', display: 'grid', gap: 8 }}>
              {role === 'family' ? (<>
                <li>Posting and messaging are free.</li>
                <li>Each request includes {price('free_contacts_per_post', 10)} free contacts.</li>
                <li>A contact pack adds {packSize} more for ${packPrice}, one time.</li>
                <li>Caregivers who message you first never use a contact.</li>
              </>) : (<>
                <li>${each} per region per month, all in one charge.</li>
                {role === 'caregiver' && <li>14-day free trial in every region you choose.</li>}
                <li>Cancel any region anytime; access lasts until the period ends.</li>
                <li>Receipts are emailed and listed here.</li>
              </>)}
            </ul>
          </Card>
          <Notice icon="lock">Payments are processed securely by Stripe. Card details never touch Karing4Life’s servers.</Notice>
        </div>
      </div>
      <Checkout open={!!checkout} onClose={() => setCheckout(null)} items={checkout?.items || []} title={checkout?.title} portal={checkout?.portal} />
    </>
  );
}

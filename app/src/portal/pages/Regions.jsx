import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Btn, Card, PageHead, Notice, Badge, daysLeft, fmtDate, regionName } from '../ui.jsx';
import RegionPicker from '../RegionPicker.jsx';
import Checkout from '../Checkout.jsx';

export default function Regions() {
  const { extra, refresh } = useAuth();
  const { me, role, price, base } = usePortal();
  const isCg = role === 'caregiver';
  const plan = isCg ? 'caregiver' : 'agency';
  const each = isCg ? price('caregiver_region_price', 8.99) : price('agency_region_price', 49.99);
  const { data: subs, loading } = useAsync(() => q(supabase.from('region_subscriptions').select('*').eq('user_id', me).eq('plan', plan).order('created_at')), [me, plan]);
  const active = useMemo(() => (subs || []).filter((s) => s.status !== 'canceled'), [subs]);
  const paid = useMemo(() => new Set(active.map((s) => s.region_key)), [active]);
  const cg = extra.caregiver;
  const trialLeft = isCg && cg ? daysLeft(cg.trial_ends_at) : 0;
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState(false);

  useEffect(() => { if (isCg && cg) setSel(cg.service_regions || []); else if (!isCg && subs) setSel(active.map((s) => s.region_key)); }, [isCg, cg, subs]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = (k) => (paid.has(k) ? 'paid' : isCg && trialLeft > 0 && sel.includes(k) ? 'trial' : undefined);
  const toBuy = sel.filter((k) => !paid.has(k));
  const changed = isCg ? JSON.stringify([...(cg?.service_regions || [])].sort()) !== JSON.stringify([...sel].sort()) : toBuy.length > 0;

  const saveCg = async () => {
    if (!sel.length) { toast.error('Pick at least one region', 'Families search caregivers by region.'); return; }
    setBusy(true);
    const { error } = await supabase.from('caregiver_profiles').update({ service_regions: sel }).eq('user_id', me);
    if (!error && cg?.credential && cg?.care_types?.length) await supabase.from('profiles').update({ onboarded: true }).eq('id', me);
    setBusy(false);
    if (error) { toast.error('Couldn’t save', errText(error)); return; }
    await refresh(); toast('Regions saved', trialLeft > 0 ? 'Posts in these regions are open during your free trial.' : 'Subscribe to unlock posts in new regions.');
  };

  return (
    <>
      <PageHead title={isCg ? 'Your regions' : 'Regions & plan'}
        sub={isCg ? 'Pick every region you’re willing to work in. Families search by region, and you see posts in regions you’ve unlocked.' : 'Agency Access unlocks unlimited job posts, caregiver search and messaging in each region.'}
        help={isCg ? `$${each} a month per region after your 14-day free trial.` : `$${each} a month per region, billed together.`}
        actions={isCg
          ? <Btn variant="success" icon="check" loading={busy} disabled={!changed} onClick={saveCg}>Save regions</Btn>
          : <Btn variant="accent" icon="card" disabled={!toBuy.length} onClick={() => setCheckout(true)}>Subscribe to {toBuy.length || ''} region{toBuy.length === 1 ? '' : 's'}</Btn>} />

      {isCg && (trialLeft > 0
        ? <Notice tone="ok" icon="sparkle" action={<Btn size="sm" variant="ghost" to={base + '/billing'}>See plans</Btn>}><strong>Free trial: {trialLeft} day{trialLeft === 1 ? '' : 's'} left.</strong> Every region you select is unlocked until {fmtDate(cg.trial_ends_at)}.</Notice>
        : <Notice tone="warn" icon="lock" action={<Btn size="sm" variant="accent" onClick={() => setCheckout(true)} disabled={!toBuy.length}>Unlock</Btn>}><strong>Your free trial has ended.</strong> Subscribe to see posts in regions without the green “Active” mark.</Notice>)}

      <Card style={{ marginTop: 16 }}>
        {loading ? <div className="skel" style={{ height: 360 }} /> : <RegionPicker value={sel} onChange={setSel} status={status} note="Tip: zoom in to pick the five boroughs, Nassau and Suffolk." />}
      </Card>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <Card title="Your plan" icon="card">
          <div className="kv">
            <div><span className="k">Regions selected</span><span className="v">{sel.length}</span></div>
            <div><span className="k">Active subscriptions</span><span className="v">{paid.size}</span></div>
            <div><span className="k">Price per region</span><span className="v">${each.toFixed(2)} / mo</span></div>
            <div><span className="k">Monthly total {toBuy.length > 0 && '(if you add the new ones)'}</span><span className="v money">${((paid.size + (isCg ? toBuy.length : toBuy.length)) * each).toFixed(2)}</span></div>
          </div>
          {toBuy.length > 0 && <div style={{ marginTop: 16 }}><Btn variant="accent" icon="card" block onClick={() => setCheckout(true)}>Subscribe to {toBuy.length} new region{toBuy.length === 1 ? '' : 's'}</Btn></div>}
        </Card>
        <Card title="Active regions" icon="checkCircle">
          {active.length === 0 ? <p className="muted">No paid regions yet.{isCg && trialLeft > 0 ? ' You’re covered by your free trial for now.' : ''}</p>
            : <div className="tags">{active.map((s) => <Badge key={s.id} tone={s.status === 'past_due' ? 'warn' : 'ok'} icon={s.status === 'past_due' ? 'alert' : 'check'} tip={s.status === 'past_due' ? 'Payment failed, please update your card' : 'Renews ' + fmtDate(s.current_period_end)}>{regionName(s.region_key)}</Badge>)}</div>}
        </Card>
      </div>
      <Checkout open={checkout} onClose={() => setCheckout(false)} items={toBuy.map((k) => ({ label: `${regionName(k)} region · monthly`, amount: each }))} title={isCg ? 'Region Access' : 'Agency Access'} recurring />
    </>
  );
}

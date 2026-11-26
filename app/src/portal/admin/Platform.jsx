import { useEffect, useState } from 'react';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { Btn, Card, Field, Notice, PageHead, Skel } from '../ui.jsx';

const GROUPS = [
  ['Prices', 'dollar', [
    ['caregiver_region_price', 'Caregiver Region Access ($ / region / month)', 0.5, 'decimal'],
    ['agency_region_price', 'Agency Access ($ / region / month)', 0.5, 'decimal'],
    ['contact_pack_price', 'Family contact pack ($, one time)', 0.5, 'decimal'],
  ]],
  ['Family rules', 'heart', [
    ['family_post_cooldown_days', 'Days between free family posts', 1],
    ['free_contacts_per_post', 'Free contacts per request', 1],
    ['contact_pack_size', 'Contacts added by one pack', 1],
    ['post_edit_flag_after', 'Flag a post for review after this many edits', 1],
  ]],
  ['Caregivers', 'steth', [['caregiver_trial_days', 'Free trial length (days) for new caregivers', 1]]],
  ['Anti-abuse', 'shield', [
    ['new_chats_per_day', 'New conversations a member can start per day', 1],
    ['messages_per_minute', 'Messages a member can send per minute', 1],
  ]],
];

export default function Platform() {
  const { data, loading, reload } = useAsync(() => q(supabase.from('app_settings').select('*')), []);
  const [v, setV] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setV(Object.fromEntries(data.map((r) => [r.key, String(r.value)]))); }, [data]);
  const orig = Object.fromEntries((data || []).map((r) => [r.key, String(r.value)]));
  const changed = Object.keys(v).filter((k) => v[k] !== orig[k]);

  const save = async () => {
    const bad = changed.find((k) => !(Number(v[k]) >= 0) || v[k] === '');
    if (bad) { toast.error('Check the numbers', 'Every value must be zero or more.'); return; }
    setBusy(true);
    for (const k of changed) {
      const { error } = await supabase.from('app_settings').update({ value: Number(v[k]), updated_at: new Date().toISOString() }).eq('key', k);
      if (error) { setBusy(false); toast.error('Couldn’t save ' + k, errText(error)); return; }
    }
    await supabase.rpc('log_admin', { a: 'update_settings', tt: 'settings', tid: changed.join(','), d: Object.fromEntries(changed.map((k) => [k, `${orig[k]} → ${v[k]}`])) });
    setBusy(false); toast('Settings saved', 'New values apply right away.'); reload(true);
  };

  return (
    <>
      <PageHead title="Platform settings" sub="Prices, quotas and limits. Changes apply immediately to new posts, contacts and purchases."
        actions={<><Btn variant="ghost" disabled={!changed.length} onClick={() => setV(orig)}>Undo</Btn><Btn variant="success" icon="check" loading={busy} disabled={!changed.length} onClick={save}>Save {changed.length || ''} change{changed.length === 1 ? '' : 's'}</Btn></>} />
      <Notice icon="info">Price changes affect new subscriptions. Once Stripe is connected, existing subscribers keep their price until you migrate them in Stripe.</Notice>
      {loading ? <Skel h={180} n={2} /> : (
        <div className="grid-2" style={{ marginTop: 16 }}>
          {GROUPS.map(([title, icon, fields]) => (
            <Card key={title} title={title} icon={icon}>
              <div className="pf">{fields.map(([k, label, step]) => (
                <Field key={k} label={label}>{(id) => <input id={id} className="pin" type="number" min="0" step={step} value={v[k] ?? ''} onChange={(e) => setV({ ...v, [k]: e.target.value })} style={v[k] !== orig[k] ? { borderColor: 'var(--olive)', boxShadow: '0 0 0 3px rgba(var(--olive-rgb),.12)' } : undefined} />}</Field>
              ))}</div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

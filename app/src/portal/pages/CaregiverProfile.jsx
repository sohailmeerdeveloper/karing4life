import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, errText } from '../../lib/supabase.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Btn, Card, Modal, PageHead, Progress, Seg, Notice, Avail } from '../ui.jsx';
import { AboutFields, CareFields, ScheduleFields, CaregiverProfileView, completeness } from '../caregiver.jsx';

const FIELDS = ['headline', 'bio', 'credential', 'license_number', 'years_exp', 'rate_min', 'has_car', 'languages', 'availability', 'care_types', 'recipients', 'durations', 'schedule'];
export const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o?.[k]]));

export async function saveCaregiver(me, v) {
  const { error } = await supabase.from('caregiver_profiles').update(pick(v, FIELDS)).eq('user_id', me);
  if (error) throw error;
  const ready = v.credential && v.care_types?.length && v.service_regions?.length;
  if (ready) await supabase.from('profiles').update({ onboarded: true }).eq('id', me);
}

export default function CaregiverProfile() {
  const { extra, profile, refresh } = useAuth();
  const { me, base } = usePortal();
  const [v, setV] = useState(extra.caregiver || {});
  const [tab, setTab] = useState('about');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (extra.caregiver && !dirty) setV(extra.caregiver); }, [extra.caregiver]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch) => { setV((x) => ({ ...x, ...patch })); setDirty(true); };
  const c = completeness(v, profile);

  const save = async () => {
    if (!v.credential) { setTab('about'); toast.error('Choose your credential', 'It’s the first thing families filter by.'); return; }
    if (!v.care_types?.length) { setTab('care'); toast.error('Pick at least one care type'); return; }
    setBusy(true);
    try { await saveCaregiver(me, v); await refresh(); setDirty(false); toast('Profile saved', 'Families now see your latest details.'); }
    catch (e) { toast.error('Couldn’t save', errText(e)); }
    setBusy(false);
  };

  return (
    <>
      <PageHead title="My profile" sub="This is what families and agencies see when they find you."
        actions={<><Btn variant="ghost" icon="eye" onClick={() => setPreview(true)}>Preview</Btn><Btn variant="success" icon="check" loading={busy} onClick={save} disabled={!dirty}>Save changes</Btn></>} />
      <div className="grid-main">
        <Card>
          <div style={{ marginBottom: 20 }}>
            <Seg value={tab} onChange={setTab} label="Profile sections" tabs={[['about', 'About you'], ['care', 'Care & status'], ['schedule', 'Schedule']]} />
          </div>
          <div className="fade-in" key={tab}>
            {tab === 'about' && <AboutFields v={v} set={set} />}
            {tab === 'care' && <CareFields v={v} set={set} />}
            {tab === 'schedule' && <><p className="muted small" style={{ marginBottom: 14 }}>Tap a time of day, then pick the days. Families searching for those days will find you.</p><ScheduleFields v={v} set={set} /></>}
          </div>
          <div className="pf-actions" style={{ marginTop: 20 }}>
            {dirty && <span className="small muted">You have unsaved changes</span>}
            <Btn variant="success" icon="check" loading={busy} onClick={save} disabled={!dirty}>Save changes</Btn>
          </div>
        </Card>
        <div className="stack">
          <Card title="Profile strength" icon="zap">
            <div className="flex between" style={{ marginBottom: 8 }}><strong style={{ fontSize: 28 }}>{c.pct}%</strong><Avail v={v.availability} /></div>
            <Progress value={c.pct} max={100} label="Profile strength" />
            {c.missing.length > 0
              ? <><p className="small muted" style={{ margin: '14px 0 8px' }}>Add these to show up higher in searches:</p><ul className="small" style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)' }}>{c.missing.map((m) => <li key={m}>{m}</li>)}</ul></>
              : <p className="small" style={{ marginTop: 12, color: 'var(--success-ink)', fontWeight: 700 }}>Your profile is complete. Nice work!</p>}
          </Card>
          <Notice icon="map" action={<Btn size="sm" variant="ghost" to={base + '/regions'}>Regions</Btn>}>You work in <strong>{v.service_regions?.length || 0}</strong> region{v.service_regions?.length === 1 ? '' : 's'}.</Notice>
          <Notice icon="camera" action={<Btn size="sm" variant="ghost" to={base + '/settings'}>Photo</Btn>}>Profiles with a friendly photo get more replies.</Notice>
        </div>
      </div>
      <Modal open={preview} onClose={() => setPreview(false)} title="How families see you" icon="eye" size="lg">
        <CaregiverProfileView p={profile} cg={v} />
      </Modal>
    </>
  );
}

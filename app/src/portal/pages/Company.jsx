import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, errText } from '../../lib/supabase.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Avatar, Btn, Card, Field, PageHead, Verified, confirm } from '../ui.jsx';
import { uploadAvatar } from './Settings.jsx';

export const AGENCY_TYPES = ['Home care agency', 'Nursing home', 'Assisted living facility', 'Hospital or clinic', 'Staffing agency', 'Other facility'];

export function CompanyFields({ v, set, errs = {} }) {
  return (
    <div className="pf">
      <div className="pf-row">
        <Field label="Business name" error={errs.business_name}>{(id) => <input id={id} className="pin" maxLength={140} value={v.business_name || ''} onChange={(e) => set({ business_name: e.target.value })} autoComplete="organization" />}</Field>
        <Field label="Type">{(id) => <select id={id} className="psel" value={v.agency_type || AGENCY_TYPES[0]} onChange={(e) => set({ agency_type: e.target.value })}>{AGENCY_TYPES.map((t) => <option key={t}>{t}</option>)}</select>}</Field>
      </div>
      <div className="pf-row">
        <Field label="EIN" error={errs.ein} hint="Private. Used only for verification." tip="Employer Identification Number, format 12-3456789">{(id) => <input id={id} className="pin" inputMode="numeric" maxLength={10} placeholder="12-3456789" value={v.ein || ''} onChange={(e) => set({ ein: e.target.value.replace(/[^\d-]/g, '') })} />}</Field>
        <Field label="Website" error={errs.website}>{(id) => <input id={id} className="pin" type="url" placeholder="https://" maxLength={200} value={v.website || ''} onChange={(e) => set({ website: e.target.value })} />}</Field>
      </div>
      <Field label="Business contact name">{(id) => <input id={id} className="pin" maxLength={120} value={v.contact_name || ''} onChange={(e) => set({ contact_name: e.target.value })} />}</Field>
      <Field label="About your agency" hint="What you offer caregivers: pay, training, benefits, culture.">{(id) => <><textarea id={id} className="pta" maxLength={2000} value={v.about || ''} onChange={(e) => set({ about: e.target.value })} /><div className="counter">{(v.about || '').length} / 2000</div></>}</Field>
    </div>
  );
}
export function validateCompany(v) {
  const e = {};
  if ((v.business_name || '').trim().length < 2) e.business_name = 'Add your business name.';
  if (v.ein && !/^\d{2}-?\d{7}$/.test(v.ein)) e.ein = 'Use the format 12-3456789.';
  if (v.website && !/^https?:\/\/\S+\.\S+/.test(v.website)) e.website = 'Start with https:// (e.g. https://youragency.com).';
  return e;
}
const FIELDS = ['business_name', 'agency_type', 'ein', 'website', 'contact_name', 'about'];

export default function Company() {
  const { extra, refresh } = useAuth();
  const { me } = usePortal();
  const [v, setV] = useState(extra.agency || {});
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState('');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (extra.agency && !dirty) setV(extra.agency); }, [extra.agency]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (p) => { setV((x) => ({ ...x, ...p })); setDirty(true); setErrs({}); };

  const save = async () => {
    const e = validateCompany(v); setErrs(e);
    if (Object.keys(e).length) { toast.error('Please check the highlighted fields'); return; }
    setBusy('save');
    const patch = Object.fromEntries(FIELDS.map((k) => [k, typeof v[k] === 'string' ? v[k].trim() || null : v[k]]));
    patch.business_name = v.business_name.trim();
    const { error } = await supabase.from('agency_profiles').update(patch).eq('user_id', me);
    if (!error) await supabase.from('profiles').update({ onboarded: true }).eq('id', me);
    setBusy('');
    if (error) { toast.error('Couldn’t save', errText(error)); return; }
    await refresh(); setDirty(false); toast('Company profile saved');
  };
  const onLogo = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setBusy('logo');
    try { const url = await uploadAvatar(me, f); await supabase.from('agency_profiles').update({ logo_url: url }).eq('user_id', me); await refresh(); toast('Logo updated'); }
    catch (err) { toast.error('Upload failed', errText(err)); }
    setBusy('');
  };
  const removeLogo = async () => {
    if (!(await confirm({ title: 'Remove your logo?', confirm: 'Remove logo' }))) return;
    await supabase.from('agency_profiles').update({ logo_url: null }).eq('user_id', me); await refresh(); toast('Logo removed');
  };

  return (
    <>
      <PageHead title="Company profile" sub="Caregivers see your name, logo and description when you message them or post jobs." badge={<Verified status={extra.agency?.verification} />}
        actions={<Btn variant="success" icon="check" loading={busy === 'save'} disabled={!dirty} onClick={save}>Save changes</Btn>} />
      <div className="grid-main">
        <Card><CompanyFields v={v} set={set} errs={errs} />
          <div className="pf-actions" style={{ marginTop: 16 }}><Btn variant="success" icon="check" loading={busy === 'save'} disabled={!dirty} onClick={save}>Save changes</Btn></div>
        </Card>
        <div className="stack">
          <Card title="Logo" icon="image">
            <div className="flex" style={{ gap: 16 }}>
              <Avatar name={v.business_name} url={extra.agency?.logo_url} size="xl" square />
              <div className="stack-sm">
                <label className="pb pb-soft pb-sm" style={{ cursor: 'pointer' }}>{busy === 'logo' ? 'Uploading…' : extra.agency?.logo_url ? 'Change logo' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onLogo} /></label>
                {extra.agency?.logo_url && <Btn size="sm" variant="soft-danger" onClick={removeLogo}>Remove</Btn>}
              </div>
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>Square PNG or JPG, up to 3 MB.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

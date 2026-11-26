import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, errText } from '../../lib/supabase.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Btn, Card, Field, Notice, PIcon } from '../ui.jsx';
import { RegionOptions } from '../../components/bits.jsx';
import { AboutFields, CareFields, ScheduleFields } from '../caregiver.jsx';
import { CompanyFields, validateCompany } from './Company.jsx';
import RegionPicker from '../RegionPicker.jsx';
import { pick } from './CaregiverProfile.jsx';

const STEPS = {
  caregiver: ['About you', 'Care & status', 'Schedule', 'Regions', 'Verification'],
  family: ['Where care is needed', 'Who needs care', 'All set'],
  agency: ['Company', 'Regions', 'Verification'],
};

export default function Onboarding() {
  const { profile, extra, refresh } = useAuth();
  const { me, role, base } = usePortal();
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cg, setCg] = useState(extra.caregiver || {});
  const [fam, setFam] = useState({ ...(extra.family || {}), town: profile?.town || '', region_key: profile?.region_key || '' });
  const [ag, setAg] = useState(extra.agency || {});
  const steps = STEPS[role];
  const last = i === steps.length - 1;

  const check = () => {
    if (role === 'caregiver') {
      if (i === 0 && !cg.credential) return 'Choose your primary credential.';
      if (i === 1 && !cg.care_types?.length) return 'Pick at least one type of care.';
      if (i === 1 && !cg.recipients?.length) return 'Choose who you care for (adults, children or both).';
      if (i === 3 && !cg.service_regions?.length) return 'Pick at least one region you work in.';
    }
    if (role === 'family' && i === 0) {
      if (!fam.region_key) return 'Choose the region where care is needed.';
      if (fam.zip && !/^\d{5}$/.test(fam.zip)) return 'ZIP code should be 5 digits.';
    }
    if (role === 'agency' && i === 0) { const e = validateCompany(ag); if (Object.keys(e).length) return Object.values(e)[0]; }
    return null;
  };

  const persist = async (finish) => {
    if (role === 'caregiver') {
      const { error } = await supabase.from('caregiver_profiles').update({ ...pick(cg, ['headline', 'bio', 'credential', 'license_number', 'years_exp', 'rate_min', 'has_car', 'languages', 'availability', 'care_types', 'recipients', 'durations', 'schedule']), service_regions: cg.service_regions || [] }).eq('user_id', me);
      if (error) throw error;
    } else if (role === 'family') {
      const { error } = await supabase.from('family_profiles').update({ address: fam.address?.trim() || null, zip: fam.zip || null, care_for: fam.care_for?.trim() || null }).eq('user_id', me);
      if (error) throw error;
      await supabase.from('profiles').update({ town: fam.town?.trim() || null, region_key: fam.region_key || null }).eq('id', me);
    } else if (role === 'agency') {
      const patch = pick(ag, ['business_name', 'agency_type', 'ein', 'website', 'contact_name', 'about']);
      Object.keys(patch).forEach((k) => { if (patch[k] === '') patch[k] = null; });
      const { error } = await supabase.from('agency_profiles').update(patch).eq('user_id', me);
      if (error) throw error;
    }
    if (finish) await supabase.from('profiles').update({ onboarded: true }).eq('id', me);
  };

  const next = async () => {
    const err = check();
    if (err) { toast.error('One more thing', err); return; }
    setBusy(true);
    try {
      await persist(last || (role === 'caregiver' && i === 3));
      if (last) { await refresh(); toast('You’re all set', 'Welcome to Karing4Life!'); navigate(base); }
      else { setI(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    } catch (e) { toast.error('Couldn’t save', errText(e)); }
    setBusy(false);
  };

  return (
    <>
      <div className="ph"><div className="ph-t"><h1>Let’s set up your {role} profile</h1><p>Step {i + 1} of {steps.length}. You can change everything later.</p></div></div>
      <div className="wiz-steps" role="list">
        {steps.map((s, k) => (
          <span key={s} role="listitem" className={'wiz-step' + (k === i ? ' on' : '') + (k < i ? ' done' : '')} aria-current={k === i ? 'step' : undefined}>
            <span className="n">{k < i ? <PIcon name="check" className="pi-sm" /> : k + 1}</span>{s}
          </span>
        ))}
      </div>
      <Card className="fade-in" key={i}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>{steps[i]}</h2>
        {role === 'caregiver' && (<>
          {i === 0 && <AboutFields v={cg} set={(p) => setCg((x) => ({ ...x, ...p }))} />}
          {i === 1 && <CareFields v={cg} set={(p) => setCg((x) => ({ ...x, ...p }))} />}
          {i === 2 && <><p className="muted small" style={{ marginBottom: 14 }}>When can you work? Tap a time of day, then pick the days.</p><ScheduleFields v={cg} set={(p) => setCg((x) => ({ ...x, ...p }))} /></>}
          {i === 3 && <><Notice tone="ok" icon="sparkle">Every region you pick is <strong>free for 14 days</strong>. After that it’s $8.99 a month per region, and you choose which to keep.</Notice><div style={{ marginTop: 16 }}><RegionPicker value={cg.service_regions || []} onChange={(r) => setCg((x) => ({ ...x, service_regions: r }))} /></div></>}
          {i === 4 && (
            <div className="stack-sm">
              <p className="muted">Verified caregivers get a badge and appear first in family searches. Upload a government ID (or library card) and {/RN|LPN|CNA|HHA|Therap/.test(cg.credential || '') ? 'a copy of your license' : '2–3 references'}.</p>
              <div className="flex flex-wrap"><Btn variant="primary" icon="shieldCheck" to={base + '/verification'}>Upload documents now</Btn><span className="small muted">or finish and do it later from your dashboard.</span></div>
            </div>
          )}
        </>)}
        {role === 'family' && (<>
          {i === 0 && (
            <div className="pf">
              <Field label="Street address" optional hint="Private. Never shown to anyone. Only used to place your requests in the right region.">{(id) => <input id={id} className="pin" maxLength={200} autoComplete="street-address" value={fam.address || ''} onChange={(e) => setFam({ ...fam, address: e.target.value })} />}</Field>
              <div className="pf-row n3">
                <Field label="Town or city">{(id) => <input id={id} className="pin" maxLength={80} autoComplete="address-level2" value={fam.town || ''} onChange={(e) => setFam({ ...fam, town: e.target.value })} />}</Field>
                <Field label="ZIP code" optional>{(id) => <input id={id} className="pin" inputMode="numeric" maxLength={5} autoComplete="postal-code" value={fam.zip || ''} onChange={(e) => setFam({ ...fam, zip: e.target.value.replace(/\D/g, '') })} />}</Field>
                <Field label="Region">{(id) => <select id={id} className="psel" value={fam.region_key || ''} onChange={(e) => setFam({ ...fam, region_key: e.target.value })}><RegionOptions any="Select a region" /></select>}</Field>
              </div>
            </div>
          )}
          {i === 1 && (
            <div className="pf">
              <Field label="Who are you finding care for?" optional hint="Just for you, e.g. “My mother, 81” or “Our son, 6”. Don’t include medical details.">{(id) => <input id={id} className="pin" maxLength={200} value={fam.care_for || ''} onChange={(e) => setFam({ ...fam, care_for: e.target.value })} />}</Field>
              <Notice icon="lock">Karing4Life never stores medical records. Share health details only when needed, in private messages.</Notice>
            </div>
          )}
          {i === 2 && (
            <div className="stack-sm">
              <p className="muted">You’re ready. Post your first care request (free) or start searching for caregivers.</p>
              <div className="flex flex-wrap"><Btn variant="accent" icon="plus" onClick={async () => { await persist(true); await refresh(); navigate(base + '/requests/new'); }}>Post a request</Btn><Btn variant="ghost" icon="search" onClick={async () => { await persist(true); await refresh(); navigate(base + '/find'); }}>Find caregivers</Btn></div>
            </div>
          )}
        </>)}
        {role === 'agency' && (<>
          {i === 0 && <CompanyFields v={ag} set={(p) => setAg((x) => ({ ...x, ...p }))} />}
          {i === 1 && <div className="stack-sm"><p className="muted">Agency Access is $49.99 a month per region. It unlocks unlimited job posts, caregiver search and messaging there.</p><div><Btn variant="primary" icon="map" to={base + '/regions'}>Choose regions</Btn></div><p className="small muted">You can also do this later.</p></div>}
          {i === 2 && <div className="stack-sm"><p className="muted">Upload an EIN letter or business registration and the contact’s ID. Our team reviews each agency by hand.</p><div><Btn variant="primary" icon="shieldCheck" to={base + '/verification'}>Upload documents</Btn></div></div>}
        </>)}
        <div className="pf-actions" style={{ marginTop: 24 }}>
          {i > 0 && <Btn variant="ghost" icon="arrowL" onClick={() => setI(i - 1)}>Back</Btn>}
          <span className="spacer" />
          <Btn variant={last ? 'success' : 'primary'} icon={last ? 'check' : undefined} iconRight={last ? undefined : 'arrowR'} loading={busy} onClick={next}>{last ? 'Finish' : 'Continue'}</Btn>
        </div>
      </Card>
    </>
  );
}

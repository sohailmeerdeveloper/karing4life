import { CARE } from '../data/data.js';
import { onCatalog } from '../lib/catalog.js';
import { Avail, Avatar, CareTags, Chips, Field, PIcon, ScheduleView, SchedulePicker, Verified, regionName, Info } from './ui.jsx';

export const CREDENTIALS = [
  'RN (Registered Nurse)', 'LPN (Licensed Practical Nurse)', 'CNA (Certified Nursing Assistant)', 'HHA (Home Health Aide)', 'PCA (Personal Care Aide)',
  'Physical Therapist', 'Occupational Therapist', 'Speech Therapist', 'Educational Therapist', 'Doula', 'Companion / non-skilled',
];
export const LICENSED = /RN|LPN|CNA|HHA|Therap/;
export const SKILLED = [];
export const NONSKILLED = [];
/** Refills the care lists in place (after admins edit categories). */
export function refreshCareLists() {
  SKILLED.splice(0, SKILLED.length, ...CARE.filter((c) => c.g === 'skilled').map((c) => [c.key, c.short]));
  NONSKILLED.splice(0, NONSKILLED.length, ...CARE.filter((c) => c.g === 'nonskilled').map((c) => [c.key, c.short]));
}
refreshCareLists();
onCatalog(refreshCareLists);
export const RECIPIENTS = [['Adult', 'Adult'], ['Pediatric', 'Pediatric']];
export const DURATIONS = [['Fill-in', 'Fill-in (a shift or a few days)'], ['Short-term', 'Short-term (up to a few months)'], ['Long-term', 'Long-term']];
export const LANGS = ['English', 'Spanish', 'Mandarin', 'Cantonese', 'Russian', 'Haitian Creole', 'Bengali', 'Korean', 'Italian', 'Yiddish', 'Polish', 'French', 'Arabic', 'Hindi', 'Urdu', 'Portuguese', 'Tagalog', 'Hebrew'];

/** 0–100 and the list of what's missing. */
export function completeness(cg = {}, p = {}) {
  const checks = [
    [!!p.full_name, 'Your name'], [!!p.avatar_url, 'A profile photo'], [!!cg.headline, 'A headline'], [(cg.bio || '').length >= 60, 'A short bio'],
    [!!cg.credential, 'Your credential'], [cg.care_types?.length > 0, 'Care types'], [cg.recipients?.length > 0, 'Who you care for'],
    [Object.keys(cg.schedule || {}).length > 0, 'Your schedule'], [cg.service_regions?.length > 0, 'Your regions'], [cg.rate_min > 0, 'Your hourly rate'],
    [cg.verification === 'verified' || cg.verification === 'pending', 'Verification documents'],
  ];
  const done = checks.filter((c) => c[0]).length;
  return { pct: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c[0]).map((c) => c[1]) };
}

/** Form sections, shared by the profile page and the onboarding wizard. `v` = caregiver_profiles row, `set(patch)`. */
export function AboutFields({ v, set }) {
  return (
    <div className="pf">
      <Field label="Headline" hint="One line families see first, e.g. “Gentle RN for seniors after surgery”.">{(id) => <input id={id} className="pin" maxLength={120} value={v.headline || ''} onChange={(e) => set({ headline: e.target.value })} />}</Field>
      <Field label="About you" hint="Experience, specialties, what families can expect. Don’t include your phone or email.">{(id) => (
        <><textarea id={id} className="pta" maxLength={2000} value={v.bio || ''} onChange={(e) => set({ bio: e.target.value })} /><div className="counter">{(v.bio || '').length} / 2000</div></>
      )}</Field>
      <div className="pf-row">
        <Field label="Primary credential">{(id) => (
          <select id={id} className="psel" value={v.credential || ''} onChange={(e) => set({ credential: e.target.value })}>
            <option value="">Select…</option>{CREDENTIALS.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}</Field>
        <Field label="License number" optional tip="Only our team sees this. It’s checked against the NY Office of the Professions.">{(id) => <input id={id} className="pin" maxLength={40} value={v.license_number || ''} onChange={(e) => set({ license_number: e.target.value })} disabled={!LICENSED.test(v.credential || '')} placeholder={LICENSED.test(v.credential || '') ? 'e.g. 612345' : 'Not needed for this credential'} />}</Field>
      </div>
      <div className="pf-row n3">
        <Field label="Years of experience">{(id) => <input id={id} className="pin" type="number" min="0" max="70" value={v.years_exp ?? ''} onChange={(e) => set({ years_exp: e.target.value === '' ? null : Math.max(0, Math.min(70, +e.target.value)) })} />}</Field>
        <Field label="Hourly rate from ($)">{(id) => <input id={id} className="pin" type="number" min="0" step="1" value={v.rate_min ?? ''} onChange={(e) => set({ rate_min: e.target.value === '' ? null : Math.max(0, +e.target.value) })} />}</Field>
        <Field label="Transportation">{(id) => (
          <select id={id} className="psel" value={v.has_car ? 'y' : 'n'} onChange={(e) => set({ has_car: e.target.value === 'y' })}><option value="y">I have a car</option><option value="n">No car</option></select>
        )}</Field>
      </div>
      <div className="pfield"><span className="pl">Languages</span><Chips options={LANGS.map((l) => [l, l])} value={v.languages || []} onChange={(x) => set({ languages: x })} label="Languages" /></div>
    </div>
  );
}

export function CareFields({ v, set }) {
  return (
    <div className="pf">
      <div className="pfield"><span className="pl">Status <Info tip="Available: open for regular work. Fill-in: shifts or a few days. Families can reach you either way." /></span>
        <div className="chips">
          {[['available', 'Available', 'Open for regular work'], ['fillin', 'Fill-in', 'Shifts or a few days']].map(([k, l, s]) => (
            <button type="button" key={k} className="chip-b" aria-pressed={v.availability === k} onClick={() => set({ availability: k })} style={{ minHeight: 52, borderRadius: 14 }}>
              <span className={'dot-s' + (k === 'fillin' ? ' fill' : '')} style={{ marginRight: 4 }} /><span style={{ textAlign: 'left' }}><strong style={{ display: 'block' }}>{l}</strong><span className="small" style={{ opacity: .85 }}>{s}</span></span>
            </button>
          ))}
        </div>
      </div>
      <div className="pfield"><div className="chip-group-label">Skilled care</div><Chips options={SKILLED} value={v.care_types || []} onChange={(x) => set({ care_types: x })} label="Skilled care" /></div>
      <div className="pfield"><div className="chip-group-label">Non-skilled care</div><Chips options={NONSKILLED} value={v.care_types || []} onChange={(x) => set({ care_types: x })} label="Non-skilled care" /></div>
      <div className="pf-row">
        <div className="pfield"><span className="pl">I care for</span><Chips options={RECIPIENTS} value={v.recipients || []} onChange={(x) => set({ recipients: x })} label="Care recipients" /></div>
        <div className="pfield"><span className="pl">Work I take</span><Chips options={DURATIONS.map(([k]) => [k, k])} value={v.durations || []} onChange={(x) => set({ durations: x })} label="Duration" /></div>
      </div>
    </div>
  );
}

export function ScheduleFields({ v, set }) {
  return <SchedulePicker value={v.schedule || {}} onChange={(s) => set({ schedule: s })} />;
}

/** How families and agencies see a caregiver. */
export function CaregiverProfileView({ p = {}, cg = {}, actions }) {
  return (
    <div className="stack">
      <div className="card">
        <div className="prof-head">
          <Avatar name={p.full_name} url={p.avatar_url} size="xl" />
          <div className="ph-m">
            <div className="flex flex-wrap" style={{ gap: 8 }}><Avail v={cg.availability} /><Verified status={cg.verification} /></div>
            <h2 className="prof-name">{p.full_name}</h2>
            <div className="post-meta">
              <span><PIcon name="steth" />{cg.credential || 'Caregiver'}</span>
              {p.town && <span><PIcon name="pin" />{p.town}</span>}
              {cg.years_exp != null && <span><PIcon name="clock" />{cg.years_exp} yrs experience</span>}
              {cg.rate_min > 0 && <span><PIcon name="dollar" />From ${Number(cg.rate_min).toFixed(0)}/hr</span>}
              {cg.has_car && <span><PIcon name="car" />Own transportation</span>}
            </div>
            {cg.headline && <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{cg.headline}</p>}
          </div>
          {actions && <div className="ph-act">{actions}</div>}
        </div>
      </div>
      <div className="grid-main">
        <div className="stack">
          <div className="card"><div className="sec-t">About</div><p style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>{cg.bio || 'No bio yet.'}</p></div>
          <div className="card"><div className="sec-t">Care offered</div><CareTags keys={cg.care_types} />
            <div className="divider" />
            <div className="grid-2" style={{ gap: 12 }}>
              <div><div className="sec-t">Cares for</div><div className="tags">{(cg.recipients || []).map((r) => <span key={r} className="tag-s">{r}</span>)}</div></div>
              <div><div className="sec-t">Takes</div><div className="tags">{(cg.durations || []).map((r) => <span key={r} className="tag-s">{r}</span>)}</div></div>
            </div>
          </div>
          <div className="card"><div className="sec-t">Weekly availability</div><ScheduleView value={cg.schedule} /></div>
        </div>
        <div className="stack">
          <div className="card"><div className="sec-t">Works in</div><div className="tags">{(cg.service_regions || []).map((r) => <span key={r} className="tag-s"><PIcon name="pin" />{regionName(r)}</span>)}</div></div>
          <div className="card"><div className="sec-t">Languages</div><div className="tags">{(cg.languages || []).map((l) => <span key={l} className="tag-s"><PIcon name="language" />{l}</span>)}</div></div>
          <div className="card"><div className="sec-t">Trust</div>
            <div className="kv">
              <div><span className="k">Identity & credential</span><span className="v">{cg.verification === 'verified' ? 'Verified' : cg.verification === 'pending' ? 'In review' : 'Not yet'}</span></div>
              <div><span className="k">Member since</span><span className="v">{p.created_at ? new Date(p.created_at).getFullYear() : '—'}</span></div>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>Karing4Life checks documents but isn’t the employer. Always interview and check references.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

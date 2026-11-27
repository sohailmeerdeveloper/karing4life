import { useEffect, useRef, useState } from 'react';
import { useTitle, useQuery } from '../lib/hooks.js';
import { CareOptions, RegionChips, RegionOptions, Icon } from '../components/bits.jsx';
import { PwToggle } from '../components/PwToggle.jsx';
import { ROLE_COPY, R, CARE_BY } from '../data/data.js';
import { toast } from '../lib/toast.jsx';
import { useNavigate } from 'react-router-dom';
import { supabase, errText } from '../lib/supabase.js';
import { PRELAUNCH } from '../lib/config.js';
import { openPrelaunch } from '../lib/prelaunch.js';
import { GoogleButton } from '../components/GoogleButton.jsx';
import { useAuth } from '../lib/auth.jsx';

const NEXT = { family: 'Next you’ll write your first care request.', caregiver: 'Next you’ll upload your license or ID for review.', agency: 'Next we’ll review your EIN, website and contact.' };

export default function JoinPage() {
  useTitle('Join Karing4Life');
  const params = useQuery();
  const [role, setRole] = useState('family');
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && user) navigate('/portal', { replace: true }); }, [ready, user, navigate]);
  useEffect(() => { if (ROLE_COPY[params.role]) setRole(params.role); setFormKey((k) => k + 1); }, [params.role, params.region, params.care]);
  const region = R[params.region] ? params.region : '';
  const care = CARE_BY[params.care] ? params.care : '';
  const copy = ROLE_COPY[role];
  // pre-tick the region chip passed in the URL
  useEffect(() => { if (region) formRef.current?.querySelectorAll(`input[value="${region}"]`).forEach((c) => { c.checked = true; }); }, [formKey, role, region]);
  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = Array.from(form.querySelectorAll('input,select,textarea'));
    fields.forEach((i) => { i.style.borderColor = ''; });
    const bad = fields.filter((i) => !i.checkValidity());
    if (bad.length) {
      bad.forEach((i) => { if (i.classList.contains('input') || i.classList.contains('select')) i.style.borderColor = 'var(--rust)'; });
      bad[0].focus(); toast('A few details are missing', 'Please fill in the highlighted fields and accept the terms.'); return;
    }
    const val = (id) => form.querySelector('#' + id)?.value?.trim() || '';
    if (PRELAUNCH) { openPrelaunch('signup', val('jEmail')); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: val('jEmail'), password: form.querySelector('#jPw').value,
      options: { emailRedirectTo: window.location.origin + '/portal', data: { role, full_name: val('jName'), business_name: val('aBiz') } },
    });
    setBusy(false);
    if (error) { toast.error('Couldn’t create your account', errText(error)); return; }
    if (data.session) { toast('Account created', NEXT[role]); navigate('/portal/' + role + '/onboarding'); }
    else toast('Check your email', 'Click the link we sent to confirm your address, then sign in.');
    form.reset();
  };
  return (
    <>
    <section className="auth-wrap flow">
      <div className="container">
        <div className="section-head" style={{ marginBottom: '32px' }}>
          <div className="sh-main">
            <span className="eyebrow">Join Karing4Life</span>
            <h1 style={{ fontSize: 'clamp(34px,4vw,48px)' }}>Create your <span className="serif" style={{ color: 'var(--olive)' }}>profile.</span></h1>
            <p className="lead" style={{ marginTop: '16px' }}>About two minutes. Pick who you are and the form adapts.</p>
          </div>
        </div>
        <fieldset className="role-picker" style={{ border: '0', padding: '0', margin: '0' }}>
          <legend className="sr-only">I am joining as</legend>
          <label className="role-opt">
            <input type="radio" name="role" value="family" checked={role === 'family'} onChange={() => setRole('family')} />
            <span className="ro-card">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-heart" /></svg></span>
              <span><strong>Family</strong><span>Find care for someone you love. Free.</span></span>
              <span className="ro-radio" aria-hidden="true" />
            </span>
          </label>
          <label className="role-opt">
            <input type="radio" name="role" value="caregiver" checked={role === 'caregiver'} onChange={() => setRole('caregiver')} />
            <span className="ro-card">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-steth" /></svg></span>
              <span><strong>Nurse or caregiver</strong><span>Get found by families. 14 days free.</span></span>
              <span className="ro-radio" aria-hidden="true" />
            </span>
          </label>
          <label className="role-opt">
            <input type="radio" name="role" value="agency" checked={role === 'agency'} onChange={() => setRole('agency')} />
            <span className="ro-card">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-building" /></svg></span>
              <span><strong>Agency or facility</strong><span>Post jobs and recruit. $49.99 / region.</span></span>
              <span className="ro-radio" aria-hidden="true" />
            </span>
          </label>
        </fieldset>
        <div className="join-grid">
          <form className="join-form" id="joinForm" noValidate key={formKey} ref={formRef} onSubmit={onSubmit}>
            <h2 id="joinTitle">{copy.title}</h2>
            <p className="jf-sub" id="joinSub">{copy.sub}</p>
            <GoogleButton role={role} style={{ marginTop: 20 }} />
            <div className="sc-divider">or with email</div>
            <div className="form-grid">
              <div className="field"><label htmlFor="jName">Full name</label><input className="input" id="jName" autoComplete="name" required /></div>
              <div className="field"><label htmlFor="jEmail">Email</label><input className="input" id="jEmail" type="email" autoComplete="email" required /></div>
              <div className="field full">
                <label htmlFor="jPw">Password</label>
                <div className="pw-wrap">
                  <input className="input" id="jPw" type="password" autoComplete="new-password" minLength="8" required />
                  <PwToggle target="jPw" />
                </div>
                <div className="hint">At least 8 characters.</div>
              </div>
              {role === 'family' && (
              <div className="role-fields active" data-role="family">
                <div className="fieldset-title">Where care is needed</div>
                <div className="field full">
                  <label htmlFor="fAddr">Street address</label>
                  <input className="input" id="fAddr" autoComplete="street-address" />
                  <div className="hint"><svg className="i" aria-hidden="true"><use href="#i-lock" /></svg>Private. Used only to place your request in the right region. Never shown to anyone.</div>
                </div>
                <div className="field"><label htmlFor="fCity">Town or city</label><input className="input" id="fCity" required autoComplete="address-level2" /></div>
                <div className="field">
                  <label htmlFor="fZip">ZIP code</label>
                  <input className="input" id="fZip" required inputMode="numeric" autoComplete="postal-code" maxLength="5" />
                </div>
                <div className="field"><label htmlFor="fReg">Region</label><select className="select" id="fReg" required defaultValue={region}><RegionOptions any="Select a region" /></select></div>
                <div className="field"><label htmlFor="fCare">Care needed</label><select className="select" id="fCare" defaultValue={care}><CareOptions any="Select a type of care" /></select></div>
                <div className="field">
                  <label htmlFor="fRecip">Care recipient</label>
                  <select className="select" id="fRecip"><option>Adult</option><option>Pediatric</option></select>
                </div>
                <div className="field">
                  <label htmlFor="fDur">Duration</label>
                  <select className="select" id="fDur"><option>Long-term</option><option>Short-term (up to a few months)</option><option>Fill-in (a shift or a few days)</option></select>
                </div>
              </div>
              )}
              {role === 'caregiver' && (
              <div className="role-fields active" data-role="caregiver">
                <div className="fieldset-title">Credentials</div>
                <div className="field">
                  <label htmlFor="gCred">Primary credential</label>
                  <select className="select" id="gCred" required>
                    <option>Companion / non-skilled</option>
                    <option>HHA (Home Health Aide)</option>
                    <option>PCA (Personal Care Aide)</option>
                    <option>CNA (Certified Nursing Assistant)</option>
                    <option>LPN (Licensed Practical Nurse)</option>
                    <option>RN (Registered Nurse)</option>
                    <option>Physical Therapist</option>
                    <option>Speech Therapist</option>
                    <option>Occupational Therapist</option>
                    <option>Educational Therapist</option>
                    <option>Doula</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="gLic">License number <span className="muted" style={{ fontWeight: '500' }}>(if licensed)</span></label>
                  <input className="input" id="gLic" />
                  <div className="hint"><svg className="i" aria-hidden="true"><use href="#i-file" /></svg>You'll upload a copy, or a government ID, after sign-up.</div>
                </div>
                <div className="field"><label htmlFor="gRate">Hourly rate (from)</label><input className="input" id="gRate" inputMode="decimal" placeholder="$28" /></div>
                <div className="field">
                  <label htmlFor="gStatus">Status</label>
                  <select className="select" id="gStatus"><option>Available: open for regular work</option><option>Fill-in: shifts or a few days</option></select>
                </div>
                <div className="field full">
                  <span className="label" id="gRegLbl">Regions you serve</span>
                  <div className="check-chips" role="group" aria-labelledby="gRegLbl"><RegionChips prefix="g" /></div>
                  <div className="hint"><svg className="i" aria-hidden="true"><use href="#i-sparkle" /></svg>Every region is free for your first 14 days. Then $8.99 a month per region.</div>
                </div>
              </div>
              )}
              {role === 'agency' && (
              <div className="role-fields active" data-role="agency">
                <div className="fieldset-title">Business details</div>
                <div className="field full"><label htmlFor="aBiz">Business name</label><input className="input" id="aBiz" required autoComplete="organization" /></div>
                <div className="field"><label htmlFor="aEin">EIN</label><input className="input" id="aEin" required placeholder="12-3456789" inputMode="numeric" /></div>
                <div className="field"><label htmlFor="aWeb">Website</label><input className="input" id="aWeb" required type="url" placeholder="https://" /></div>
                <div className="field"><label htmlFor="aContact">Business contact name</label><input className="input" id="aContact" required /></div>
                <div className="field">
                  <label htmlFor="aType">Type</label>
                  <select className="select" id="aType">
                    <option>Home care agency</option>
                    <option>Nursing home</option>
                    <option>Assisted living facility</option>
                    <option>Hospital or clinic</option>
                    <option>Other facility</option>
                  </select>
                </div>
                <div className="field full">
                  <span className="label" id="aRegLbl">Regions you hire in</span>
                  <div className="check-chips" role="group" aria-labelledby="aRegLbl"><RegionChips prefix="a" /></div>
                  <div className="hint"><svg className="i" aria-hidden="true"><use href="#i-info" /></svg>$49.99 a month per region. Agency accounts can't see family requests.</div>
                </div>
              </div>
              )}
              <div className="full" style={{ marginTop: '8px' }}>
                <label className="check">
                  <input type="checkbox" id="jTerms" required />
                  <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</span>
                </label>
              </div>
              <div className="full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                <span className="small muted">Already have an account? <a href="/signin" style={{ fontWeight: '700' }}>Sign in</a></span>
                <button className="btn btn-accent btn-lg" type="submit" id="joinSubmit" disabled={busy}>{busy ? 'Creating…' : copy.btn}</button>
              </div>
            </div>
          </form>
          <aside className="join-aside">
            {/* static, authored markup */}
            <div className="aside-card dark" dangerouslySetInnerHTML={{ __html: copy.aside }} />
            <div className="aside-card">
              <h3>Your privacy</h3>
              <ul>
                <li><svg className="i" aria-hidden="true"><use href="#i-lock" /></svg>No phone numbers or addresses are ever published.</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-msg" /></svg>First contact always happens in private messages.</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-shield" /></svg>IDs and licenses are seen only by our team.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
    </>
  );
}

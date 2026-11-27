import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useTitle } from '../lib/hooks.js';
import { LogoImg } from '../components/bits.jsx';
import { PwToggle } from '../components/PwToggle.jsx';
import { toast } from '../lib/toast.jsx';
import { supabase, errText, setRemember } from '../lib/supabase.js';
import { EMAIL_RE } from '../lib/waitlist.js';
import { useAuth } from '../lib/auth.jsx';
import { PRELAUNCH } from '../lib/config.js';
import { openPrelaunch } from '../lib/prelaunch.js';
import { GoogleButton } from '../components/GoogleButton.jsx';

export default function SigninPage() {
  useTitle('Sign in · Karing4Life');
  const { next } = useQuery();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fpRef = useRef(null);
  // only our own pages (e.g. /portal/…, /kommunity), never another site or the auth pages themselves
  const dest = next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') && !/^\/(signin|join)\b/.test(next) ? next : '/portal';

  useEffect(() => { if (ready && user) navigate(dest, { replace: true }); }, [ready, user, dest, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const em = e.currentTarget.elements.sEmail, pw = e.currentTarget.elements.sPw;
    setErr('');
    if (!em.value.trim() || !pw.value) { (em.value ? pw : em).focus(); setErr('Enter your email and password.'); return; }
    if (!EMAIL_RE.test(em.value.trim())) { em.focus(); setErr('That doesn’t look like an email address.'); return; }
    setBusy(true);
    setRemember(e.currentTarget.elements.sKeep.checked);
    const { data, error } = await supabase.auth.signInWithPassword({ email: em.value.trim(), password: pw.value });
    if (error) {
      setBusy(false);
      setErr(/Invalid login credentials/i.test(error.message) ? 'Incorrect email or password.' : errText(error) || 'Couldn’t sign you in. Please try again.');
      pw.value = ''; pw.focus(); return;
    }
    const { data: p } = await supabase.from('profiles').select('status').eq('id', data.user.id).maybeSingle();
    if (p?.status === 'suspended') {
      await supabase.auth.signOut(); setBusy(false);
      setErr('This account is suspended. Contact us if you think this is a mistake.'); return;
    }
    toast('Welcome back');
    navigate(dest, { replace: true });
  };
  const sendReset = async () => {
    const v = fpRef.current;
    if (!v.value.trim()) { v.focus(); toast.error('Enter your email', 'We’ll send the reset link there.'); return; }
    if (!EMAIL_RE.test(v.value.trim())) { v.focus(); toast.error('That doesn’t look like an email address', 'Check it and try again.'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(v.value.trim(), { redirectTo: window.location.origin + '/reset-password' });
    if (error && (error.status === 429 || /rate limit/i.test(error.message))) { toast.error('Too many requests', 'Please wait a few minutes before asking for another link.'); return; }
    if (error && /fetch|network/i.test(error.message)) { toast.error('Couldn’t send the link', 'Check your connection and try again.'); return; }
    toast('Check your inbox', 'If that email has an account, a reset link is on its way.'); setForgot(false);
  };
  return (
    <section className="auth-wrap screen">
      <div className="container">
        <div className="signin-card">
          <div className="sc-logo"><LogoImg alt="Karing4Life logo" width="72" height="72" /></div>
          <h1>Welcome back</h1>
          <p className="sc-sub">Sign in to your Karing4Life account.</p>
          <GoogleButton style={{ marginTop: 24 }} />
          <div className="sc-divider">or with email</div>
          <form id="signinForm" onSubmit={onSubmit} style={{ display: 'grid', gap: '16px' }} noValidate>
            <div className="field"><label htmlFor="sEmail">Email</label><input className="input" id="sEmail" type="email" inputMode="email" autoComplete="username" required /></div>
            <div className="field">
              <label htmlFor="sPw">Password</label>
              <div className="pw-wrap">
                <input className="input" id="sPw" type="password" autoComplete="current-password" required />
                <PwToggle target="sPw" />
              </div>
            </div>
            <div className="sc-row">
              <label className="check" style={{ fontSize: '14px' }}><input type="checkbox" id="sKeep" defaultChecked />Keep me signed in</label>
              <button type="button" className="link-btn" id="forgotLink" aria-expanded={forgot} aria-controls="forgotPanel" onClick={() => { setForgot(!forgot); if (!forgot) setTimeout(() => fpRef.current?.focus(), 50); }}>Forgot password?</button>
            </div>
            <div className={'forgot-panel' + (forgot ? ' open' : '')} id="forgotPanel">
              <p className="small" style={{ color: 'var(--ink-2)' }}>Enter your email and we'll send a reset link.</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <label className="sr-only" htmlFor="fpEmail">Email for password reset</label>
                <input ref={fpRef} className="input" id="fpEmail" type="email" placeholder="you@example.com" style={{ height: '44px' }} />
                <button className="btn btn-primary btn-sm" type="button" id="fpSend" onClick={sendReset} style={{ '--bh': '44px' }}>Send link</button>
              </div>
            </div>
            {err && <p className="form-err" role="alert">{err}{PRELAUNCH && err.startsWith('Incorrect') && <> New here? Accounts open at launch. <button type="button" className="link-btn" onClick={() => openPrelaunch('signup', document.getElementById('sEmail').value.trim())}>Get notified</button></>}</p>}
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div className="sc-divider">New to Karing4Life?</div>
          <a className="btn btn-ghost btn-block" href="/join">Create a free account</a>
        </div>
      </div>
    </section>
  );
}

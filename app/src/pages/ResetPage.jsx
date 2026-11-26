import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitle } from '../lib/hooks.js';
import { LogoImg } from '../components/bits.jsx';
import { PwToggle } from '../components/PwToggle.jsx';
import { supabase, errText } from '../lib/supabase.js';
import { toast } from '../lib/toast.jsx';

/** Landing page for the "reset your password" email link. */
export default function ResetPage() {
  useTitle('Reset password · Karing4Life');
  const navigate = useNavigate();
  const [ready, setReady] = useState(null);   // null = checking, true = link valid, false = no session
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((ev, s) => { if (ev === 'PASSWORD_RECOVERY' || s) setReady(true); });
    const t = setTimeout(() => supabase.auth.getSession().then(({ data: d }) => setReady((r) => r || !!d.session)), 600);
    return () => { clearTimeout(t); data.subscription.unsubscribe(); };
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    const a = e.currentTarget.elements.rPw.value, b = e.currentTarget.elements.rPw2.value;
    setErr('');
    if (a.length < 8) { setErr('Use at least 8 characters.'); return; }
    if (a !== b) { setErr('The two passwords don’t match.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: a });
    setBusy(false);
    if (error) { setErr(errText(error)); return; }
    toast('Password updated', 'You’re signed in.'); navigate('/portal');
  };
  return (
    <section className="auth-wrap screen">
      <div className="container">
        <div className="signin-card">
          <div className="sc-logo"><LogoImg width="72" height="72" /></div>
          <h1>Choose a new password</h1>
          {ready === null && <p className="sc-sub">Checking your link…</p>}
          {ready === false && (<>
            <p className="sc-sub">This reset link has expired or was already used. Request a new one from the sign-in page.</p>
            <a className="btn btn-primary btn-block" href="/signin" style={{ marginTop: 24 }}>Back to sign in</a>
          </>)}
          {ready && (
            <form onSubmit={submit} style={{ marginTop: 24, display: 'grid', gap: 16 }} noValidate>
              <div className="field"><label htmlFor="rPw">New password</label><div className="pw-wrap"><input className="input" id="rPw" type="password" autoComplete="new-password" minLength={8} required /><PwToggle target="rPw" /></div><div className="hint">At least 8 characters.</div></div>
              <div className="field"><label htmlFor="rPw2">Repeat it</label><input className="input" id="rPw2" type="password" autoComplete="new-password" required /></div>
              {err && <p className="form-err" role="alert">{err}</p>}
              <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

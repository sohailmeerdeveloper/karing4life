import { useRef, useState } from 'react';
import { useTitle } from '../lib/hooks.js';
import { LogoImg } from '../components/bits.jsx';
import { PwToggle } from '../components/PwToggle.jsx';
import { toast } from '../lib/toast.jsx';

export default function SigninPage() {
  useTitle('Sign in · Karing4Life');
  const [forgot, setForgot] = useState(false);
  const fpRef = useRef(null);
  const onSubmit = (e) => {
    e.preventDefault();
    const em = e.currentTarget.elements.sEmail, pw = e.currentTarget.elements.sPw;
    if (!em.value || !pw.value) { (em.value ? pw : em).focus(); toast('Enter your email and password'); return; }
    toast('Signing in…', 'Account sign-in will be available at launch.');
  };
  const sendReset = () => {
    const v = fpRef.current;
    if (!v.value || !v.checkValidity()) { v.focus(); toast('Enter your email', 'We’ll send the reset link there.'); return; }
    toast('Reset link requested', 'Check your inbox for a link to reset your password.'); setForgot(false);
  };
  return (
    <>
    <section className="auth-wrap screen">
      <div className="container">
        <div className="signin-card">
          <div className="sc-logo"><LogoImg alt="Karing4Life logo" width="72" height="72" /></div>
          <h1>Welcome back</h1>
          <p className="sc-sub">Sign in to your Karing4Life account.</p>
          <form id="signinForm" onSubmit={onSubmit} style={{ marginTop: '24px', display: 'grid', gap: '16px' }} noValidate>
            <div className="field"><label htmlFor="sEmail">Username or email</label><input className="input" id="sEmail" autoComplete="username" required /></div>
            <div className="field">
              <label htmlFor="sPw">Password</label>
              <div className="pw-wrap">
                <input className="input" id="sPw" type="password" autoComplete="current-password" required />
                <PwToggle target="sPw" />
              </div>
            </div>
            <div className="sc-row">
              <label className="check" style={{ fontSize: '14px' }}><input type="checkbox" />Keep me signed in</label>
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
            <button className="btn btn-primary btn-block btn-lg" type="submit">Sign in</button>
          </form>
          <div className="sc-divider">New to Karing4Life?</div>
          <a className="btn btn-ghost btn-block" href="/join">Create a free account</a>
        </div>
      </div>
    </section>
    </>
  );
}

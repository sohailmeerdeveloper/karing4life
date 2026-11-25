import { useEffect, useRef, useState } from 'react';
import { LogoImg } from '../components/bits.jsx';
import { EMAIL_RE, joinWaitlist } from '../lib/waitlist.js';
import '../gate.css';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');  // idle | sending | done | error
  const input = useRef(null);

  useEffect(() => {
    document.title = 'Karing4Life · Coming soon';
    input.current?.focus({ preventScroll: true });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setState('error'); input.current?.focus(); return; }
    setState('sending');
    try { await joinWaitlist(email); setState('done'); }
    catch { setState('error'); }
  };

  return (
    <div className="gate">
      <div className="gate-glow" aria-hidden="true" />
      <main className="gate-card cs">
        <LogoImg className="gate-logo" />
        <p className="gate-eyebrow"><span className="dot" />Coming soon</p>
        <h1 className="gate-title">Where New York families and caregivers <span className="serif">find each other.</span></h1>
        <p className="gate-sub">
          Karing4Life connects families with verified nurses and caregivers across New York. Families post the care
          they need for free and caregivers reply directly. We're putting the finishing touches on the site.
        </p>

        {state === 'done' ? (
          <p className="cs-done" role="status">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            You're on the list. We'll email you the day we open.
          </p>
        ) : (
          <form className={'cs-form' + (state === 'error' ? ' is-error' : '')} onSubmit={submit} noValidate>
            <label htmlFor="cs-email" className="sr-only">Email address</label>
            <input id="cs-email" ref={input} type="email" inputMode="email" autoComplete="email" placeholder="you@email.com"
              value={email} aria-invalid={state === 'error'} aria-describedby="cs-hint"
              onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }} />
            <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Adding…' : 'Notify me'}</button>
          </form>
        )}
        <p id="cs-hint" className={'cs-hint' + (state === 'error' ? ' err' : '')} aria-live="polite">
          {state === 'error' ? 'Please enter a valid email address.' : state === 'done' ? '' : 'Leave your email and be the first to know when we launch. No spam.'}
        </p>
      </main>
      <footer className="gate-foot">© {new Date().getFullYear()} Karing4Life · New York</footer>
    </div>
  );
}

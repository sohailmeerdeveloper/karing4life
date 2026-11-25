import { useEffect, useRef, useState } from 'react';
import { LogoImg } from '../components/bits.jsx';
import { EMAIL_RE, joinWaitlist } from '../lib/waitlist.js';
import '../gate.css';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');  // idle | sending | done | error
  const [kb, setKb] = useState(false);  // phone keyboard open
  const input = useRef(null);
  const form = useRef(null);

  useEffect(() => {
    document.title = 'Karing4Life · Coming soon';
    // Desktop: cursor waits in the field. Phones: no auto-focus, so the keyboard doesn't cover the page on arrival.
    if (window.matchMedia('(pointer: fine)').matches) input.current?.focus({ preventScroll: true });
  }, []);

  /* Phones: once the keyboard is up, scroll the field into the middle of what's still visible. */
  const onFocus = () => {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    setKb(true);
    const show = () => form.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    window.visualViewport?.addEventListener('resize', show, { once: true });
    setTimeout(show, 350);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setState('error'); input.current?.focus(); return; }
    setState('sending');
    try { await joinWaitlist(email); setState('done'); }
    catch { setState('error'); }
  };

  return (
    <div className={'gate' + (kb ? ' kb' : '')}>
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
          <form ref={form} className={'cs-form' + (state === 'error' ? ' is-error' : '')} onSubmit={submit} noValidate>
            <label htmlFor="cs-email" className="sr-only">Email address</label>
            <input id="cs-email" ref={input} type="email" inputMode="email" autoComplete="email" placeholder="you@email.com"
              onFocus={onFocus} onBlur={() => setTimeout(() => { if (document.activeElement !== input.current) setKb(false); }, 400)}
              value={email} aria-invalid={state === 'error'} aria-describedby="cs-hint"
              onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }} />
            <button type="submit" disabled={state === 'sending'} aria-label="Notify me">
              <span className="cs-btn-text">{state === 'sending' ? 'Adding…' : 'Notify me'}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
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

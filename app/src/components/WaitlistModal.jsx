import { useEffect, useRef, useState } from 'react';
import { LogoImg } from './bits.jsx';
import { EMAIL_RE, joinWaitlist, markClosed, markJoined, shouldPrompt, hasJoined } from '../lib/waitlist.js';
import { onPrelaunch } from '../lib/prelaunch.js';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

const COPY = {
  signup: ['Accounts open soon', 'We’re almost ready to ', 'welcome you.', 'Karing4Life is still under development, so new accounts aren’t open yet. Leave your email and we’ll tell you the moment you can join.'],
  signin: ['Sign-in opens at launch', 'Member accounts open ', 'very soon.', 'Karing4Life is still under development, so sign-in isn’t available yet. Leave your email and we’ll let you know as soon as it’s ready.'],
};
import '../gate.css';

/* Pre-launch popup shown over the site on arrival: asks for an email so we can tell the visitor
   when Karing4Life opens. Closing it first shows a short "are you sure" note, then lets them browse. */
const hasSession = () => { try { return !!(localStorage.getItem('k4l-auth') || sessionStorage.getItem('k4l-auth')); } catch { return false; } };

export default function WaitlistModal() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => !pathname.startsWith('/portal') && shouldPrompt() && !hasSession());
  const [reason, setReason] = useState(null);       // null = arrival popup; 'signup' | 'signin' = opened by a form
  const [step, setStep] = useState('form');      // form | confirm | done
  const [state, setState] = useState('idle');    // idle | sending | invalid | failed
  const [email, setEmail] = useState('');
  const [leaving, setLeaving] = useState(false);
  const card = useRef(null);
  const input = useRef(null);
  const { user, ready } = useAuth();
  // signed-in members already have an account: never greet them with the arrival popup
  useEffect(() => { if (ready && user && !reason) setOpen(false); }, [ready, user, reason]);

  // forms (sign-up, sign-in, Google) open the popup on demand
  useEffect(() => onPrelaunch(({ reason: r, email: em }) => {
    setReason(r); setStep(hasJoined() ? 'joined' : 'form'); setState('idle'); setLeaving(false);
    if (em) setEmail(em);
    setOpen(true);
  }), []);

  const close = () => {
    if (step !== 'done' && !reason) markClosed();
    setLeaving(true);
    setTimeout(() => setOpen(false), 220);
  };
  const askClose = () => (step === 'form' && !reason ? setStep('confirm') : close());

  // lock page scroll, focus the field (desktop), keep Tab inside, Esc = close
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      if (window.matchMedia('(pointer: fine)').matches) input.current?.focus({ preventScroll: true });
      else card.current?.focus({ preventScroll: true });
    }, 60);
    return () => { clearTimeout(t); document.body.style.overflow = overflow; prev?.focus?.({ preventScroll: true }); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); askClose(); return; }
      if (e.key !== 'Tab' || !card.current) return;
      const els = card.current.querySelectorAll('button, input, a[href]');
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // after switching steps, move focus to the new step's main control
  useEffect(() => {
    if (!open) return;
    if (step === 'form') input.current?.focus({ preventScroll: true });
    else card.current?.querySelector('.wl-primary')?.focus({ preventScroll: true });
  }, [step, open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setState('invalid'); input.current?.focus(); return; }
    setState('sending');
    try { await joinWaitlist(email); markJoined(); setStep('done'); setState('idle'); }
    catch (err) { setState(err.message === 'invalid' ? 'invalid' : 'failed'); }
  };

  const hint = state === 'invalid' ? 'Please enter a valid email address.'
    : state === 'failed' ? "Couldn't save that just now. Please check your connection and try again."
    : "We'll only email you when the site opens. No spam.";

  return (
    <div className={'wl-backdrop' + (leaving ? ' out' : '')} onMouseDown={(e) => { if (e.target === e.currentTarget) askClose(); }}>
      <div ref={card} className={'wl-card wl-' + step} role="dialog" aria-modal="true" aria-labelledby="wl-title" aria-describedby="wl-sub" tabIndex={-1}>
        <button type="button" className="wl-x" onClick={askClose} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        {step === 'form' && (<>
          <LogoImg className="wl-logo" />
          <p className="gate-eyebrow"><span className="dot" />{reason ? COPY[reason][0] : 'Launching soon'}</p>
          {reason
            ? <h2 id="wl-title" className="wl-title">{COPY[reason][1]}<span className="serif">{COPY[reason][2]}</span></h2>
            : <h2 id="wl-title" className="wl-title">Be the first to know when we <span className="serif">open.</span></h2>}
          <p id="wl-sub" className="wl-sub">
            {reason ? COPY[reason][3] : "Karing4Life is still under development. Leave your email and we'll let you know the moment it's ready."}
          </p>
          <form className={'cs-form' + (state === 'invalid' || state === 'failed' ? ' is-error' : '')} onSubmit={submit} noValidate>
            <label htmlFor="wl-email" className="sr-only">Email address</label>
            <input id="wl-email" ref={input} type="email" inputMode="email" autoComplete="email" placeholder="you@email.com"
              value={email} aria-invalid={state === 'invalid'} aria-describedby="wl-hint"
              onChange={(e) => { setEmail(e.target.value); if (state === 'invalid' || state === 'failed') setState('idle'); }} />
            <button type="submit" disabled={state === 'sending'} aria-label="Notify me">
              <span className="cs-btn-text">{state === 'sending' ? 'Adding…' : 'Notify me'}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
          <p id="wl-hint" className={'cs-hint' + (state === 'invalid' || state === 'failed' ? ' err' : '')} aria-live="polite">{hint}</p>
        </>)}

        {step === 'confirm' && (<>
          <div className="wl-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          </div>
          <h2 id="wl-title" className="wl-title sm">Leave without getting notified?</h2>
          <p id="wl-sub" className="wl-sub">
            The site is still under development, so some parts may not work yet. By entering your email,
            you'll get a note from us as soon as Karing4Life is ready.
          </p>
          <div className="wl-actions">
            <button type="button" className="wl-btn wl-primary" onClick={() => { setStep('form'); setState('idle'); }}>Enter my email</button>
            <button type="button" className="wl-btn wl-ghost" onClick={close}>Continue to site</button>
          </div>
        </>)}

        {step === 'joined' && (<>
          <div className="wl-icon ok" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </div>
          <h2 id="wl-title" className="wl-title sm">{reason === 'signin' ? 'Sign-in opens at launch.' : 'Accounts open at launch.'}</h2>
          <p id="wl-sub" className="wl-sub" role="status">Karing4Life is still under development. You're already on our list, so we'll email you the day it opens.</p>
          <div className="wl-actions">
            <button type="button" className="wl-btn wl-primary" onClick={close}>Got it</button>
          </div>
        </>)}

        {step === 'done' && (<>
          <div className="wl-icon ok" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </div>
          <h2 id="wl-title" className="wl-title sm">You're on the list.</h2>
          <p id="wl-sub" className="wl-sub" role="status">We'll email you the day Karing4Life opens. Feel free to look around in the meantime.</p>
          <div className="wl-actions">
            <button type="button" className="wl-btn wl-primary" onClick={close}>Explore the site</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

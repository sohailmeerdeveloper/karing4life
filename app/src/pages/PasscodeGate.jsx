import { useEffect, useRef, useState } from 'react';
import { LogoImg } from '../components/bits.jsx';
import { CODE_LENGTH, tryUnlock } from '../lib/access.js';
import '../gate.css';

/** Six digit boxes. Wrong code → red shake and clear; right code → tick, then onUnlock(). */
export default function PasscodeGate({ onUnlock }) {
  const [digits, setDigits] = useState(() => Array(CODE_LENGTH).fill(''));
  const [state, setState] = useState('idle');  // idle | checking | error | ok
  const boxes = useRef([]);

  useEffect(() => {
    document.title = 'Karing4Life · Preview access';
    boxes.current[0]?.focus();
  }, []);

  const check = async (code) => {
    setState('checking');
    if (await tryUnlock(code)) {
      setState('ok');
      setTimeout(onUnlock, 1100);
    } else {
      setState('error');
      setTimeout(() => {
        setDigits(Array(CODE_LENGTH).fill(''));
        setState('idle');
        boxes.current[0]?.focus();
      }, 700);
    }
  };

  const fill = (start, text) => {
    const clean = text.replace(/\D/g, '');
    if (!clean) return;
    const next = [...digits];
    let i = start;
    for (const ch of clean) { if (i >= CODE_LENGTH) break; next[i++] = ch; }
    setDigits(next);
    if (next.every(Boolean)) { boxes.current[CODE_LENGTH - 1]?.blur(); check(next.join('')); }
    else boxes.current[Math.min(i, CODE_LENGTH - 1)]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) next[i] = '';
      else if (i > 0) { next[i - 1] = ''; boxes.current[i - 1]?.focus(); }
      setDigits(next);
    } else if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) boxes.current[i + 1]?.focus();
  };

  const busy = state === 'checking' || state === 'ok' || state === 'error';

  return (
    <div className={'gate pc-' + state}>
      <div className="gate-glow" aria-hidden="true" />
      <main className="gate-card pc">
        <LogoImg className="gate-logo" />
        <div className="pc-badge" aria-hidden="true">
          {state === 'ok' ? (
            <svg viewBox="0 0 52 52" className="pc-tick"><circle cx="26" cy="26" r="24" /><path d="M15 27l7.5 7.5L37.5 19" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="pc-lock"><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></svg>
          )}
        </div>
        <h1 className="gate-title sm">{state === 'ok' ? 'Welcome in' : 'Enter preview passcode'}</h1>
        <p className="gate-sub">{state === 'ok' ? 'Opening the site…' : 'This preview of Karing4Life is private. Type the 6-digit code you were given.'}</p>

        <div className="pc-boxes" role="group" aria-label="Passcode">
          {digits.map((d, i) => (
            <input key={i} ref={(el) => { boxes.current[i] = el; }}
              className={d ? 'filled' : ''} value={d} disabled={busy}
              type="text" inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={CODE_LENGTH}
              aria-label={`Digit ${i + 1}`}
              onFocus={(e) => e.target.select()}
              onChange={(e) => fill(i, e.target.value.slice(-(CODE_LENGTH - i)))}
              onPaste={(e) => { e.preventDefault(); fill(i, e.clipboardData.getData('text')); }}
              onKeyDown={(e) => onKey(i, e)} />
          ))}
        </div>
        <p className="pc-msg" role="status" aria-live="assertive">{state === 'error' ? 'That code isn’t right. Try again.' : ' '}</p>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';

/* Tiny toast bus: toast(title, body, kind) from anywhere; <Toasts/> renders them.
   kind: 'ok' (default) | 'error' | 'info' */
const listeners = new Set();
let id = 0;
export function toast(title, body, kind = 'ok') { const t = { id: ++id, title, body, kind }; listeners.forEach((l) => l(t)); }
toast.error = (title, body) => toast(title, body, 'error');
toast.info = (title, body) => toast(title, body, 'info');

const ICON = { ok: 'check-circle', error: 'info', info: 'info' };

export function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (t) => {
      // a success means the earlier problem is solved, so older error toasts go away;
      // the same message twice (e.g. a form submitted again) replaces the first instead of stacking
      const same = (x) => x.kind === t.kind && x.title === t.title && (x.body || '') === (t.body || '');
      setItems((xs) => [...(t.kind === 'ok' ? xs.filter((x) => x.kind !== 'error') : xs).filter((x) => !same(x)).slice(-3), t]);
      const ms = t.kind === 'error' ? 6000 : 3800;
      setTimeout(() => setItems((xs) => xs.map((x) => (x.id === t.id ? { ...x, out: true } : x))), ms);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), ms + 250);
    };
    listeners.add(on);
    return () => listeners.delete(on);
  }, []);
  return (
    <div className="toast-wrap" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div key={t.id} className={'toast toast-' + t.kind + (t.out ? ' out' : '')} role={t.kind === 'error' ? 'alert' : 'status'}>
          <Icon name={ICON[t.kind] || 'check-circle'} />
          <div><strong>{t.title}</strong>{t.body && <span>{t.body}</span>}</div>
        </div>
      ))}
    </div>
  );
}

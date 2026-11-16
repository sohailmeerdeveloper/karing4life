import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.jsx';

/* Tiny toast bus: call toast(title, body) from anywhere; <Toasts/> renders them. */
const listeners = new Set();
let id = 0;
export function toast(title, body) { const t = { id: ++id, title, body }; listeners.forEach((l) => l(t)); }

export function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (t) => {
      setItems((xs) => [...xs, t]);
      setTimeout(() => setItems((xs) => xs.map((x) => (x.id === t.id ? { ...x, out: true } : x))), 3800);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 4050);
    };
    listeners.add(on);
    return () => listeners.delete(on);
  }, []);
  return (
    <div className="toast-wrap" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div key={t.id} className={'toast' + (t.out ? ' out' : '')} role="status">
          <Icon name="check-circle" />
          <div><strong>{t.title}</strong>{t.body && <span>{t.body}</span>}</div>
        </div>
      ))}
    </div>
  );
}

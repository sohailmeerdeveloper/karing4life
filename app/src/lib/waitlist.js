/* Pre-launch email list → Supabase table `prelaunch_emails` (see supabase/prelaunch_emails.sql).
   Uses the publishable key, which is safe in the browser: the table's row-level security only
   lets visitors insert, never read. The values below are fallbacks so a deploy works even when
   the VITE_ env vars aren't set on the host. */
const API = import.meta.env.VITE_SUPABASE_URL || 'https://xnbgrzwbqnyxzjbvjpbf.supabase.co';
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hdmPK_8QQVvYU5k4bUlJ9A_yf9ujmdR';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Resolves when the email is on the list (already being on it counts). Throws 'invalid' or 'network'. */
export async function joinWaitlist(email) {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) throw new Error('invalid');
  let res;
  try {
    res = await fetch(`${API}/rest/v1/prelaunch_emails`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ email: clean, source: 'site_popup' }),
    });
  } catch { throw new Error('network'); }
  if (res.ok || res.status === 409) return true;  // 409 = already signed up
  throw new Error('network');
}

/* Whether to show the popup. Joined → never again on this browser. Closed → not again for 7 days.
   Signed-in members never see it (checked in WaitlistModal). */
const JOINED = 'k4l-joined';
const CLOSED = 'k4l-popup-closed';
const WEEK = 7 * 24 * 3600 * 1000;
const get = (s, k) => { try { return s.getItem(k); } catch { return null; } };
const set = (s, k, v = '1') => { try { s.setItem(k, v); } catch { /* storage blocked */ } };
const closedRecently = () => get(sessionStorage, CLOSED) || Date.now() - Number(get(localStorage, CLOSED) || 0) < WEEK;

export const hasJoined = () => !!get(localStorage, JOINED);
export const shouldPrompt = () => !get(localStorage, JOINED) && !closedRecently();
export const markJoined = () => set(localStorage, JOINED);
export const markClosed = () => { set(sessionStorage, CLOSED); set(localStorage, CLOSED, String(Date.now())); };

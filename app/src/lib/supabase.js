import { createClient } from '@supabase/supabase-js';

// The publishable key is meant to be public: every table is protected by row-level security.
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://xnbgrzwbqnyxzjbvjpbf.supabase.co';
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hdmPK_8QQVvYU5k4bUlJ9A_yf9ujmdR';

/* "Keep me signed in" on the sign-in form: ticked → the session lives in localStorage (survives
   closing the browser); unticked → sessionStorage (ends with the browser session). */
const REMEMBER = 'k4l-remember';
const safe = (f) => { try { return f(); } catch { return null; } };
const remembered = () => safe(() => localStorage.getItem(REMEMBER)) !== '0';
export const setRemember = (on) => safe(() => localStorage.setItem(REMEMBER, on ? '1' : '0'));
const storage = {
  getItem: (k) => safe(() => localStorage.getItem(k)) ?? safe(() => sessionStorage.getItem(k)),
  setItem: (k, v) => {
    const [keep, drop] = remembered() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
    safe(() => keep.setItem(k, v)); safe(() => drop.removeItem(k));
  },
  removeItem: (k) => { safe(() => localStorage.removeItem(k)); safe(() => sessionStorage.removeItem(k)); },
};

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'k4l-auth', storage },
});

/** Turns a Supabase/Postgres error into a sentence a member can read. */
export function errText(e) {
  if (!e) return '';
  const m = (e.message || String(e)).replace(/^QUOTA:\s*/, '');
  if (/Invalid login credentials/i.test(m)) return 'That email and password don’t match an account.';
  if (/JWT|token/i.test(m)) return 'Your session expired. Please sign in again.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Can’t reach the server. Check your connection and try again.';
  if (/violates check constraint/i.test(m)) return 'One of the fields isn’t in the right format.';
  if (/row-level security|permission denied/i.test(m)) return 'You don’t have permission to do that.';
  return m;
}
export const isQuotaError = (e) => /^QUOTA:/.test(e?.message || '');

/** Throws on error, returns data. */
export async function q(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

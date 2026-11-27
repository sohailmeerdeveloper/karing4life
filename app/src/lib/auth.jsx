import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';

const Ctx = createContext(null);
/* Set on an explicit sign-out so the portal guard sends the member home instead of to
   /signin?next=<their last page> (the next person on the device shouldn't land there). */
let signedOutAt = 0;
export const justSignedOut = () => Date.now() - signedOutAt < 10000;

export const ROLE_ORDER = ['family', 'caregiver', 'agency', 'admin'];

/** Session + the member's profile rows. `ready` turns true once we know if someone is signed in. */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [extra, setExtra] = useState({});
  const [ready, setReady] = useState(false);

  const load = useCallback(async (s) => {
    if (!s?.user) { setProfile(null); setExtra({}); return; }
    const uid = s.user.id;
    const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (!p) { setProfile(null); return; }
    const roles = p.roles || [];
    const [cg, fam, ag] = await Promise.all([
      roles.includes('caregiver') ? supabase.from('caregiver_profiles').select('*').eq('user_id', uid).maybeSingle() : { data: null },
      roles.includes('family') ? supabase.from('family_profiles').select('*').eq('user_id', uid).maybeSingle() : { data: null },
      roles.includes('agency') ? supabase.from('agency_profiles').select('*').eq('user_id', uid).maybeSingle() : { data: null },
    ]);
    setProfile(p);
    setExtra({ caregiver: cg.data, family: fam.data, agency: ag.data });
    supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', uid).then(() => {});
  }, []);

  useEffect(() => {
    let live = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!live) return;
      setSession(data.session);
      await load(data.session);
      if (live) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') load(s);
    });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, [load]);

  const value = useMemo(() => ({
    ready, session, user: session?.user || null, profile, extra,
    roles: profile ? ROLE_ORDER.filter((r) => profile.roles.includes(r)) : [],
    refresh: () => load(session),
    signOut: async () => { signedOutAt = Date.now(); await supabase.auth.signOut(); setProfile(null); setExtra({}); },
  }), [ready, session, profile, extra, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

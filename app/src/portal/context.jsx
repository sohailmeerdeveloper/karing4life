import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { syncCatalog, onCatalog } from '../lib/catalog.js';

const Ctx = createContext(null);

/** Is this conversation unread for me? */
export function isUnread(c, me) {
  if (c.user_a === me) return new Date(c.last_message_at) > new Date(c.a_read_at);
  return new Date(c.last_message_at) > new Date(c.b_read_at);
}
/** The "other side" of a conversation from my point of view. */
export const otherOf = (c, me) => (c.user_a === me ? { id: c.user_b, role: c.role_b } : { id: c.user_a, role: c.role_a });

/** Per-portal state: current role, badge counts, app settings. */
export function PortalProvider({ role, children }) {
  const { user, roles } = useAuth();
  const me = user?.id;
  const [counts, setCounts] = useState({ messages: 0, notifications: 0, queue: 0, reports: 0, flagged: 0 });
  const [settings, setSettings] = useState({});

  const refreshCounts = useCallback(async () => {
    if (!me) return;
    const [{ data: convs }, { count: notifs }] = await Promise.all([
      supabase.from('conversations').select('user_a,role_a,user_b,role_b,last_message_at,a_read_at,b_read_at').or(`user_a.eq.${me},user_b.eq.${me}`),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', me).is('read_at', null),
    ]);
    const mine = (convs || []).filter((c) => (c.user_a === me ? c.role_a : c.role_b) === role);
    const next = { messages: mine.filter((c) => isUnread(c, me)).length, notifications: notifs || 0 };
    if (role === 'admin' && roles.includes('admin')) {
      const [a, b, c, d] = await Promise.all([
        supabase.from('verification_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('flagged', true).neq('status', 'hidden'),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      ]);
      Object.assign(next, { queue: a.count || 0, reports: b.count || 0, flagged: c.count || 0, contacts: d.count || 0 });
    }
    setCounts((c) => ({ ...c, ...next }));
  }, [me, role, roles]);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  const [catV, setTick] = useState(0);
  useEffect(() => { const off = onCatalog(() => setTick((t) => t + 1)); syncCatalog(); return off; }, []);
  useEffect(() => {
    supabase.from('app_settings').select('key,value').then(({ data }) => {
      if (data) setSettings(Object.fromEntries(data.map((r) => [r.key, Number(r.value)])));
    });
  }, []);

  // live badge updates
  useEffect(() => {
    if (!me) return;
    let t;
    const bump = () => { clearTimeout(t); t = setTimeout(refreshCounts, 300); };
    const ch = supabase.channel('badges-' + me + '-' + role)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${me}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_a=eq.${me}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_b=eq.${me}` }, bump)
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, [me, role, refreshCounts]);

  const value = useMemo(() => ({
    role, me, counts, refreshCounts, settings,
    price: (k, d) => (settings[k] ?? d),
    base: '/portal/' + role, catV,
  }), [role, me, counts, refreshCounts, settings, catV]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePortal = () => useContext(Ctx);

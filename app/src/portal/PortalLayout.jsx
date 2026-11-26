import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabase.js';
import { usePortal } from './context.jsx';
import { NAV, FOOT, ROLE_META } from './nav.js';
import { Avatar, IconBtn, PIcon, timeAgo, ConfirmHost, Skel } from './ui.jsx';
import { WelcomeGuide, hasSeenGuide } from './pages/Help.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { toast } from '../lib/toast.jsx';

function useOutside(ref, on, active) {
  useEffect(() => {
    if (!active) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) on(); };
    const k = (e) => { if (e.key === 'Escape') on(); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [ref, on, active]);
}

function RoleSwitch() {
  const { roles } = useAuth();
  const { role } = usePortal();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false), open);
  const m = ROLE_META[role];
  if (roles.length < 2) {
    return <div className="role-btn" style={{ cursor: 'default' }}><span className="rb-ic"><PIcon name={m.icon} /></span><span className="rb-t"><small>Signed in as</small><strong>{m.label}</strong></span></div>;
  }
  return (
    <div ref={ref} className={'role-switch' + (open ? ' open' : '')}>
      <button type="button" className="role-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} data-tip="Switch between your portals" data-tip-pos="bottom">
        <span className="rb-ic"><PIcon name={m.icon} /></span>
        <span className="rb-t"><small>Portal</small><strong>{m.title}</strong></span>
        <PIcon name="chevD" className="chev pi-sm" />
      </button>
      {open && (
        <div className="role-menu" role="menu">
          {roles.map((r) => (
            <button key={r} role="menuitem" className={r === role ? 'on' : ''} onClick={() => { setOpen(false); try { localStorage.setItem('k4l-role', r); } catch { /* */ } navigate('/portal/' + r); }}>
              <PIcon name={ROLE_META[r].icon} />{ROLE_META[r].title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Bell() {
  const { me, base, counts, refreshCounts } = usePortal();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();
  useOutside(ref, () => setOpen(false), open);
  useEffect(() => {
    if (!open) return;
    supabase.from('notifications').select('*').eq('user_id', me).order('created_at', { ascending: false }).limit(8).then(({ data }) => setItems(data || []));
  }, [open, me, counts.notifications]);
  const go = async (n) => {
    setOpen(false);
    if (!n.read_at) { await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id); refreshCounts(); }
    if (n.link) navigate(n.link.startsWith('/portal/') ? n.link : base);
  };
  const readAll = async () => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', me).is('read_at', null);
    setItems((xs) => xs?.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() }))); refreshCounts();
  };
  return (
    <div ref={ref} className="p-pop">
      <IconBtn icon="bell" label="Notifications" count={counts.notifications} onClick={() => setOpen(!open)} aria-expanded={open} tipPos="bottom" />
      {open && (
        <div className="p-pop-panel" role="dialog" aria-label="Notifications">
          <div className="p-pop-head">Notifications{counts.notifications > 0 && <button className="pb pb-link pb-sm" onClick={readAll}>Mark all read</button>}</div>
          <div className="p-pop-list">
            {items === null ? <div style={{ padding: 16 }}><div className="skel" style={{ height: 48 }} /></div>
              : items.length === 0 ? <div className="empty" style={{ padding: 28 }}><span className="e-ic"><PIcon name="bell" /></span><p>You're all caught up.</p></div>
              : items.map((n) => (
                <button key={n.id} className={'row' + (n.read_at ? '' : ' unread')} onClick={() => go(n)}>
                  <span className="stat-ic" style={{ width: 36, height: 36, flex: 'none' }}><PIcon name={ICON_OF[n.kind] || 'bell'} className="pi-sm" /></span>
                  <span className="r-main"><span className="r-t">{n.title}</span><span className="r-s">{n.body}</span></span>
                  <span className="r-time">{timeAgo(n.created_at)}</span>
                </button>
              ))}
          </div>
          <Link className="p-pop-foot" to={base + '/notifications'} onClick={() => setOpen(false)}>See all notifications</Link>
        </div>
      )}
    </div>
  );
}
export const ICON_OF = { message: 'msg', post: 'list', verification: 'shieldCheck', billing: 'receipt', welcome: 'sparkle', report: 'flag', trial: 'hourglass' };

function Me() {
  const { profile, user, signOut } = useAuth();
  const { base } = usePortal();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useOutside(ref, () => setOpen(false), open);
  const out = async () => { await signOut(); toast('Signed out', 'See you soon.'); navigate('/'); };
  return (
    <div ref={ref} className="p-pop">
      <button type="button" className="ib" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen(!open)} data-tip="Account" data-tip-pos="bottom">
        <Avatar name={profile?.full_name} url={profile?.avatar_url} size="sm" />
      </button>
      {open && (
        <div className="p-pop-panel" style={{ width: 280 }} role="menu">
          <div className="p-me"><Avatar name={profile?.full_name} url={profile?.avatar_url} /><div style={{ minWidth: 0 }}><strong>{profile?.full_name || 'Your account'}</strong><span>{user?.email}</span></div></div>
          <div className="p-menu-list">
            <Link to={base + '/settings'} onClick={() => setOpen(false)}><PIcon name="settings" />Settings</Link>
            <Link to={base + '/help'} onClick={() => setOpen(false)}><PIcon name="help" />Help & guide</Link>
            <a href="/" onClick={() => setOpen(false)}><PIcon name="home" />Back to website</a>
            <button className="danger" onClick={out}><PIcon name="logout" />Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Count({ k }) {
  const { counts } = usePortal();
  const n = counts[k];
  return n > 0 ? <span className="p-count">{n > 99 ? '99+' : n}</span> : null;
}

export default function PortalLayout() {
  const { role, base, counts } = usePortal();
  const { signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [more, setMore] = useState(false);
  const [guide, setGuide] = useState(false);
  const main = useRef(null);
  const nav = NAV[role];
  const sub = pathname.slice(base.length).replace(/^\//, '');
  const current = [...nav, ...FOOT].find((n) => (n.to === '' ? sub === '' : sub === n.to || sub.startsWith(n.to + '/')));

  useEffect(() => { setMore(false); window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => { document.title = (current?.label || 'Portal') + ' · Karing4Life'; }, [current]);
  useEffect(() => { if (!hasSeenGuide(role)) setTimeout(() => setGuide(true), 600); }, [role]);

  const out = async () => { await signOut(); navigate('/'); };
  const link = (n) => (
    <NavLink key={n.to || 'home'} to={n.to ? base + '/' + n.to : base} end={n.to === ''} className={({ isActive }) => 'p-link' + (isActive ? ' active' : '')} title={n.tip}>
      <PIcon name={n.icon} />{n.label}{n.badge && <Count k={n.badge} />}
    </NavLink>
  );
  const tabs = nav.filter((n) => n.tab).slice(0, 4);

  return (
    <div className="portal">
      <aside className="p-side" aria-label="Portal navigation">
        <a className="p-brand" href="/"><img src="/logo-olive.webp" alt="" /><span>Karing<b>4</b>Life</span></a>
        <RoleSwitch />
        <nav className="p-nav">
          {nav.map(link)}
        </nav>
        <div className="p-side-foot">
          {FOOT.map(link)}
          <button type="button" className="p-link" onClick={out} style={{ border: 0, background: 'none', cursor: 'pointer', width: '100%' }}><PIcon name="logout" />Sign out</button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="p-top">
          <a className="p-brand-m" href="/" aria-label="Karing4Life website"><img src="/logo-olive.webp" alt="" /><span>Karing<b style={{ color: 'var(--rust-ink)' }}>4</b>Life</span></a>
          <div className="p-top-title"><span>{ROLE_META[role].title}</span><PIcon name="chevR" className="pi-sm" /><span className="crumb">{current?.label || ''}</span></div>
          <div className="p-top-actions">
            <IconBtn icon="help" label="Quick guide" onClick={() => setGuide(true)} tipPos="bottom" />
            <Bell />
            <Me />
          </div>
        </header>
        <main id="main" ref={main} className="p-content" tabIndex={-1}>
          <ErrorBoundary resetKey={pathname}><Suspense fallback={<Skel h={120} />}><Outlet /></Suspense></ErrorBoundary>
        </main>
      </div>

      <nav className="p-tabs" aria-label="Portal sections">
        {tabs.map((n) => (
          <NavLink key={n.to || 'home'} to={n.to ? base + '/' + n.to : base} end={n.to === ''} className={({ isActive }) => 'p-tab' + (isActive ? ' active' : '')}>
            <PIcon name={n.icon} />{n.tab}{n.badge && counts[n.badge] > 0 && <span className="p-dot">{counts[n.badge]}</span>}
          </NavLink>
        ))}
        <button type="button" className={'p-tab' + (more ? ' active' : '')} onClick={() => setMore(true)} aria-haspopup="dialog">
          <PIcon name="menu" />More{counts.notifications > 0 && <span className="p-dot">{counts.notifications}</span>}
        </button>
      </nav>

      {more && (<>
        <div className="p-sheet-back" onClick={() => setMore(false)} />
        <div className="p-sheet" role="dialog" aria-modal="true" aria-label="More">
          <div className="grab" />
          <div style={{ marginBottom: 10 }}><RoleSwitch /></div>
          <nav className="p-nav">{nav.filter((n) => !tabs.includes(n)).map(link)}</nav>
          <div className="p-side-foot" style={{ marginTop: 10 }}>
            {FOOT.map(link)}
            <a className="p-link" href="/"><PIcon name="home" />Back to website</a>
            <button type="button" className="p-link" onClick={out} style={{ border: 0, background: 'none', cursor: 'pointer', width: '100%', color: 'var(--danger-ink)' }}><PIcon name="logout" />Sign out</button>
          </div>
        </div>
      </>)}

      <WelcomeGuide open={guide} onClose={() => setGuide(false)} role={role} />
      <ConfirmHost />
    </div>
  );
}

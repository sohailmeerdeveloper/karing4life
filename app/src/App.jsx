import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toasts } from './lib/toast.jsx';
import { useReveal } from './lib/hooks.js';
import { Sprite } from './components/Sprite.jsx';
import { Header, MobileMenu } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import WaitlistModal from './components/WaitlistModal.jsx';

// Every page except Home is split into its own chunk and loaded on demand.
const LOAD = {
  how: () => import('./pages/HowPage.jsx'),
  requests: () => import('./pages/RequestsPage.jsx'),
  families: () => import('./pages/FamiliesPage.jsx'),
  caregivers: () => import('./pages/CaregiversPage.jsx'),
  membership: () => import('./pages/MembershipPage.jsx'),
  agencies: () => import('./pages/AgenciesPage.jsx'),
  about: () => import('./pages/AboutPage.jsx'),
  contact: () => import('./pages/ContactPage.jsx'),
  join: () => import('./pages/JoinPage.jsx'),
  signin: () => import('./pages/SigninPage.jsx'),
};
const PAGES = Object.fromEntries(Object.entries(LOAD).map(([k, f]) => [k, lazy(f)]));

/** Runs after the (lazy) page has rendered: scroll-in animations for `.reveal`. */
function Page({ children }) {
  const { pathname, search } = useLocation();
  useReveal(pathname + search);
  return <div className="page active">{children}</div>;
}

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);

  // Plain <a href="/…"> links navigate client-side (no full reload).
  useEffect(() => {
    const on = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href.startsWith('/') || href.startsWith('//')) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener('click', on);
    return () => document.removeEventListener('click', on);
  }, [navigate]);

  // Old single-file links (#requests?care=rn) still work.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace(/^#/, '');
      const page = h.split('?')[0];
      if (page === 'home') navigate('/', { replace: true });
      else if (PAGES[page]) navigate('/' + h, { replace: true });
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [navigate]);

  useEffect(() => { setMenu(false); window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);

  useEffect(() => {
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
    idle(() => Object.values(LOAD).forEach((f) => f()));  // warm the other pages once idle
  }, []);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <Sprite />
      <Header onOpenMenu={() => setMenu(true)} menuOpen={menu} />
      <MobileMenu open={menu} onClose={closeMenu} />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<div className="page-loading" aria-hidden="true" />}>
          <Routes>
            <Route path="/" element={<Page><HomePage /></Page>} />
            {Object.entries(PAGES).map(([k, P]) => <Route key={k} path={'/' + k} element={<Page><P /></Page>} />)}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Toasts />
      <WaitlistModal />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout />
    </BrowserRouter>
  );
}

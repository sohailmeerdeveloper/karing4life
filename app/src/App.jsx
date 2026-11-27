import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toasts } from './lib/toast.jsx';
import { setMeta, useReveal, useTitle } from './lib/hooks.js';
import { Sprite } from './components/Sprite.jsx';
import { Header, MobileMenu } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import WaitlistModal from './components/WaitlistModal.jsx';
import { AuthProvider } from './lib/auth.jsx';

const PortalApp = lazy(() => import('./portal/PortalApp.jsx'));

// Every page except Home is split into its own chunk and loaded on demand.
// Adding a page? Also add it to the rewrites in vercel.json, or it will answer with HTTP 404.
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
  'reset-password': () => import('./pages/ResetPage.jsx'),
  pricing: () => import('./pages/PricingPage.jsx'),
  faq: () => import('./pages/FaqPage.jsx'),
  kommunity: () => import('./pages/KommunityPage.jsx'),
  terms: () => import('./pages/LegalPage.jsx'),
  privacy: () => import('./pages/LegalPage.jsx'),
  refunds: () => import('./pages/LegalPage.jsx'),
};
const PAGES = Object.fromEntries(Object.entries(LOAD).map(([k, f]) => [k, lazy(f)]));

// Search and share descriptions, one per page (the tab title comes from each page's useTitle).
const SITE = 'https://www.karing4life.com';
const DESCRIPTION = {
  '/': 'Karing4Life connects New York families with verified nurses and caregivers. Families post care requests for free, caregivers reply directly, and agencies recruit in the regions they serve.',
  '/families': 'Find a verified nurse or caregiver in New York for free. Post one care request, hear from caregivers in your region and message up to 10 of them.',
  '/caregivers': 'Nurses and caregivers: build a profile, see family care requests in the New York regions you work in, and reply directly. 14 days free, then $8.99 a month per region.',
  '/agencies': 'Agencies and facilities: post unlimited jobs and recruit verified caregivers across New York for $49.99 a month per region.',
  '/how': 'How Karing4Life works for families, caregivers and agencies: post, reply and message privately, with no agency in the middle.',
  '/requests': 'Browse open family care requests across New York by care type, region and schedule. Unlock a region to read the details and reply.',
  '/membership': 'Caregiver Region Access: $8.99 a month per New York region, billed together, with a 14-day free trial in every region.',
  '/pricing': 'Simple pricing: free for families, $8.99 a month per region for caregivers and nurses, $49.99 a month per region for agencies.',
  '/kommunity': 'Kommunity Korner: New York families pass on unused care supplies and equipment for free.',
  '/about': 'Why Karing4Life exists: a direct, fair way for New York families and caregivers to find each other.',
  '/contact': 'Questions about care, joining as a caregiver or Agency Access? Write to the Karing4Life team; a person replies within one business day.',
  '/faq': 'Answers to common questions about Karing4Life for families, caregivers, agencies, accounts and safety.',
  '/join': 'Create your Karing4Life profile as a family, a nurse or caregiver, or an agency. It takes about two minutes.',
  '/signin': 'Sign in to your Karing4Life account.',
  '/terms': 'Karing4Life Terms of Service, in plain language.',
  '/privacy': 'Karing4Life Privacy Policy: what we collect, how we use it and who can see what.',
  '/refunds': 'Karing4Life Refund Policy for region subscriptions and contact packs.',
};

/** Runs after the (lazy) page has rendered: scroll-in animations for `.reveal`, plus the
    page's canonical URL and search/share tags. Unknown addresses are marked noindex. */
function Page({ children, notFound }) {
  const { pathname, search } = useLocation();
  useReveal(pathname + search);
  useEffect(() => {
    let l = document.querySelector('link[rel=canonical]');
    if (notFound) {
      l?.remove();
      setMeta('name', 'robots', 'noindex');
      setMeta('name', 'description', 'This page doesn’t exist on Karing4Life.');
      setMeta('property', 'og:url', null);
      return () => setMeta('name', 'robots', null);
    }
    // one canonical URL per page (no query string), so search engines don't see duplicates
    if (!l) { l = document.createElement('link'); l.rel = 'canonical'; document.head.appendChild(l); }
    l.href = SITE + pathname;
    const d = DESCRIPTION[pathname.replace(/\/$/, '') || '/'] || DESCRIPTION['/'];
    setMeta('name', 'description', d);
    setMeta('property', 'og:description', d);
    setMeta('name', 'twitter:description', d);
    setMeta('property', 'og:url', SITE + pathname);
  }, [pathname, notFound]);
  return <div className="page active">{children}</div>;
}

/** Unknown address: say so (and keep the URL) instead of silently showing the home page. */
function NotFound() {
  useTitle('Page not found · Karing4Life');
  return (
    <section className="flow" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div className="container" style={{ maxWidth: 560 }}>
        <span className="eyebrow">Error 404</span>
        <h1 style={{ fontSize: 'clamp(34px,4vw,48px)', margin: '12px 0 16px' }}>We can’t find <span className="serif" style={{ color: 'var(--olive)' }}>that page.</span></h1>
        <p className="lead">The link may be old or mistyped. Try one of these instead.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
          <a className="btn btn-primary" href="/">Go to the home page</a>
          <a className="btn btn-ghost" href="/requests">Browse care requests</a>
          <a className="btn btn-ghost" href="/contact">Contact us</a>
        </div>
      </div>
    </section>
  );
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
            <Route path="*" element={<Page notFound><NotFound /></Page>} />
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
      <AuthProvider>
        <Routes>
          <Route path="/portal/*" element={<><Sprite /><Suspense fallback={<div className="page-loading" aria-hidden="true" />}><PortalApp /></Suspense><Toasts /></>} />
          <Route path="*" element={<Layout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

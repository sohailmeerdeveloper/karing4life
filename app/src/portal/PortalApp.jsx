import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { PortalProvider } from './context.jsx';
import PortalLayout from './PortalLayout.jsx';
import { Btn, Loading } from './ui.jsx';
import './portal.css';

const L = (f) => lazy(f);
const P = {
  Messages: L(() => import('./pages/Messages.jsx')),
  Notifications: L(() => import('./pages/Notifications.jsx')),
  Settings: L(() => import('./pages/Settings.jsx')),
  Help: L(() => import('./pages/Help.jsx')),
  Verification: L(() => import('./pages/Verification.jsx')),
  Billing: L(() => import('./pages/Billing.jsx')),
  Onboarding: L(() => import('./pages/Onboarding.jsx')),
  CgHome: L(() => import('./pages/CaregiverHome.jsx')),
  CgProfile: L(() => import('./pages/CaregiverProfile.jsx')),
  Regions: L(() => import('./pages/Regions.jsx')),
  Feed: L(() => import('./pages/PostFeed.jsx')),
  PostView: L(() => import('./pages/PostView.jsx')),
  FamHome: L(() => import('./pages/FamilyHome.jsx')),
  MyPosts: L(() => import('./pages/MyPosts.jsx')),
  PostEditor: L(() => import('./pages/PostEditor.jsx')),
  Find: L(() => import('./pages/FindCaregivers.jsx')),
  CgView: L(() => import('./pages/CaregiverView.jsx')),
  AgHome: L(() => import('./pages/AgencyHome.jsx')),
  Company: L(() => import('./pages/Company.jsx')),
  AdHome: L(() => import('./admin/AdminHome.jsx')),
  AdUsers: L(() => import('./admin/Users.jsx')),
  AdUser: L(() => import('./admin/UserDetail.jsx')),
  AdQueue: L(() => import('./admin/VerifyQueue.jsx')),
  AdPosts: L(() => import('./admin/AdminPosts.jsx')),
  AdReports: L(() => import('./admin/Reports.jsx')),
  AdRevenue: L(() => import('./admin/Revenue.jsx')),
  AdCatalog: L(() => import('./admin/Catalog.jsx')),
  AdKK: L(() => import('./admin/AdminKommunity.jsx')),
  AdLogs: L(() => import('./admin/Logs.jsx')),
  AdPlatform: L(() => import('./admin/Platform.jsx')),
  AdInbox: L(() => import('./admin/Inbox.jsx')),
};

const shared = (
  <>
    <Route path="messages" element={<P.Messages />} />
    <Route path="messages/:id" element={<P.Messages />} />
    <Route path="notifications" element={<P.Notifications />} />
    <Route path="settings" element={<P.Settings />} />
    <Route path="help" element={<P.Help />} />
  </>
);

const ROUTES = {
  caregiver: (<>
    <Route index element={<P.CgHome />} />
    <Route path="onboarding" element={<P.Onboarding />} />
    <Route path="profile" element={<P.CgProfile />} />
    <Route path="regions" element={<P.Regions />} />
    <Route path="posts" element={<P.Feed />} />
    <Route path="posts/:id" element={<P.PostView />} />
    <Route path="verification" element={<P.Verification />} />
    <Route path="billing" element={<P.Billing />} />
    {shared}
  </>),
  family: (<>
    <Route index element={<P.FamHome />} />
    <Route path="onboarding" element={<P.Onboarding />} />
    <Route path="requests" element={<P.MyPosts />} />
    <Route path="requests/new" element={<P.PostEditor />} />
    <Route path="requests/:id" element={<P.PostView />} />
    <Route path="requests/:id/edit" element={<P.PostEditor />} />
    <Route path="find" element={<P.Find />} />
    <Route path="saved" element={<P.Find saved />} />
    <Route path="caregivers/:id" element={<P.CgView />} />
    <Route path="verification" element={<P.Verification />} />
    <Route path="billing" element={<P.Billing />} />
    {shared}
  </>),
  agency: (<>
    <Route index element={<P.AgHome />} />
    <Route path="onboarding" element={<P.Onboarding />} />
    <Route path="jobs" element={<P.MyPosts />} />
    <Route path="jobs/new" element={<P.PostEditor />} />
    <Route path="jobs/:id" element={<P.PostView />} />
    <Route path="jobs/:id/edit" element={<P.PostEditor />} />
    <Route path="find" element={<P.Find />} />
    <Route path="saved" element={<P.Find saved />} />
    <Route path="caregivers/:id" element={<P.CgView />} />
    <Route path="company" element={<P.Company />} />
    <Route path="regions" element={<P.Regions />} />
    <Route path="verification" element={<P.Verification />} />
    <Route path="billing" element={<P.Billing />} />
    {shared}
  </>),
  admin: (<>
    <Route index element={<P.AdHome />} />
    <Route path="users" element={<P.AdUsers />} />
    <Route path="users/:id" element={<P.AdUser />} />
    <Route path="verification" element={<P.AdQueue />} />
    <Route path="posts" element={<P.AdPosts />} />
    <Route path="reports" element={<P.AdReports />} />
    <Route path="revenue" element={<P.AdRevenue />} />
    <Route path="catalog" element={<P.AdCatalog />} />
    <Route path="kommunity" element={<P.AdKK />} />
    <Route path="logs" element={<P.AdLogs />} />
    <Route path="platform" element={<P.AdPlatform />} />
    <Route path="inbox" element={<P.AdInbox />} />
    {shared}
  </>),
};

function RolePortal() {
  const { role } = useParams();
  const { roles } = useAuth();
  if (!ROUTES[role] || !roles.includes(role)) return <Navigate to="/portal" replace />;
  return (
    <PortalProvider role={role}>
      <Routes>
        <Route element={<PortalLayout />}>
          {ROUTES[role]}
          <Route path="*" element={<Navigate to={'/portal/' + role} replace />} />
        </Route>
      </Routes>
    </PortalProvider>
  );
}

function Home() {
  const { roles } = useAuth();
  let last = null;
  try { last = localStorage.getItem('k4l-role'); } catch { /* */ }
  const r = roles.includes(last) ? last : roles[0];
  return <Navigate to={'/portal/' + r} replace />;
}

export default function PortalApp() {
  const { ready, user, profile, signOut } = useAuth();
  const loc = useLocation();
  if (!ready || (user && !profile)) return <Loading />;
  if (!user) return <Navigate to={'/signin?next=' + encodeURIComponent(loc.pathname)} replace />;
  if (profile.status === 'suspended' || !profile.roles?.length) {
    return (
      <div className="p-loading" style={{ padding: 24 }}>
        <div className="card" style={{ maxWidth: 440, textAlign: 'center' }}>
          <h2>Account unavailable</h2>
          <p className="muted" style={{ margin: '8px 0 16px' }}>This account is suspended. If you think this is a mistake, email info@karing4life.com.</p>
          <Btn variant="ghost" onClick={signOut}>Sign out</Btn>
        </div>
      </div>
    );
  }
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<Home />} />
        <Route path=":role/*" element={<RolePortal />} />
      </Routes>
    </Suspense>
  );
}

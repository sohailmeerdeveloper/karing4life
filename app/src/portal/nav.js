/* Navigation per portal. [path, label, icon, tip]. First 4 marked `tab` show in the phone tab bar. */
export const ROLE_META = {
  caregiver: { label: 'Caregiver', title: 'Caregiver portal', icon: 'steth' },
  family: { label: 'Family', title: 'Family portal', icon: 'heart' },
  agency: { label: 'Agency', title: 'Agency portal', icon: 'building' },
  admin: { label: 'Admin', title: 'Admin console', icon: 'shield' },
};

export const NAV = {
  caregiver: [
    { to: '', label: 'Dashboard', icon: 'grid', tab: 'Home', tip: 'Your overview: messages, new posts and setup' },
    { to: 'posts', label: 'Find work', icon: 'search', tab: 'Work', tip: 'Care requests and job posts in your regions' },
    { to: 'messages', label: 'Messages', icon: 'msg', tab: 'Inbox', badge: 'messages', tip: 'Private chats with families and agencies' },
    { to: 'profile', label: 'My profile', icon: 'user', tab: 'Profile', tip: 'What families see when they find you' },
    { to: 'regions', label: 'Regions', icon: 'map', tip: 'Choose where you work and unlock posts' },
    { to: 'verification', label: 'Verification', icon: 'shieldCheck', tip: 'Upload your license or ID to get the verified badge' },
    { to: 'billing', label: 'Billing', icon: 'card', tip: 'Your plan, trial and receipts' },
  ],
  family: [
    { to: '', label: 'Dashboard', icon: 'grid', tab: 'Home', tip: 'Your overview: requests, messages and contacts left' },
    { to: 'requests', label: 'My requests', icon: 'list', tab: 'Requests', tip: 'Care requests you have posted' },
    { to: 'find', label: 'Find a caregiver', icon: 'search', tab: 'Find', tip: 'Search caregivers by care type, region and schedule' },
    { to: 'messages', label: 'Messages', icon: 'msg', tab: 'Inbox', badge: 'messages', tip: 'Private chats with caregivers' },
    { to: 'saved', label: 'Saved caregivers', icon: 'bookmark', tip: 'Caregivers you bookmarked' },
    { to: 'verification', label: 'Verification', icon: 'shieldCheck', tip: 'Verify your identity (optional, builds trust)' },
    { to: 'billing', label: 'Contacts & billing', icon: 'card', tip: 'Extra contact packs and receipts' },
  ],
  agency: [
    { to: '', label: 'Dashboard', icon: 'grid', tab: 'Home', tip: 'Your overview: jobs, messages and regions' },
    { to: 'jobs', label: 'Job posts', icon: 'briefcase', tab: 'Jobs', tip: 'Unlimited job posts in your regions' },
    { to: 'find', label: 'Find caregivers', icon: 'search', tab: 'Find', tip: 'Search caregivers in your regions' },
    { to: 'messages', label: 'Messages', icon: 'msg', tab: 'Inbox', badge: 'messages', tip: 'Chats with caregivers' },
    { to: 'saved', label: 'Saved caregivers', icon: 'bookmark', tip: 'Your shortlist' },
    { to: 'company', label: 'Company profile', icon: 'building', tip: 'Your logo, details and description' },
    { to: 'regions', label: 'Regions & plan', icon: 'map', tip: 'Regions you recruit in ($49.99 / region)' },
    { to: 'verification', label: 'Verification', icon: 'shieldCheck', tip: 'Business verification (EIN, website)' },
    { to: 'billing', label: 'Billing history', icon: 'receipt', tip: 'Invoices and payments' },
  ],
  admin: [
    { to: '', label: 'Overview', icon: 'grid', tab: 'Overview', tip: 'Platform health, growth and revenue' },
    { to: 'users', label: 'Users', icon: 'users', tab: 'Users', tip: 'Search, verify, suspend and manage members' },
    { to: 'verification', label: 'Verification queue', icon: 'shieldCheck', tab: 'Queue', badge: 'queue', tip: 'Review uploaded IDs, licenses and references' },
    { to: 'reports', label: 'Reports', icon: 'flag', tab: 'Reports', badge: 'reports', tip: 'Member reports to review' },
    { to: 'posts', label: 'Posts', icon: 'list', badge: 'flagged', tip: 'Moderate care requests and job posts' },
    { to: 'inbox', label: 'Contact inbox', icon: 'mail', badge: 'contacts', tip: 'Messages from the website contact form' },
    { to: 'revenue', label: 'Subscriptions & revenue', icon: 'chart', tip: 'Payments, refunds and active plans' },
    { to: 'catalog', label: 'Regions & care types', icon: 'map', tip: 'Edit region names, prices and care categories' },
    { to: 'kommunity', label: 'Kommunity Korner', icon: 'gift', tip: 'Moderate shared supplies' },
    { to: 'logs', label: 'Activity log', icon: 'log', tip: 'Every admin action, newest first' },
    { to: 'platform', label: 'Platform settings', icon: 'sliders', tip: 'Prices, quotas and limits' },
  ],
};

export const FOOT = [
  { to: 'notifications', label: 'Notifications', icon: 'bell', badge: 'notifications' },
  { to: 'settings', label: 'Settings', icon: 'settings' },
  { to: 'help', label: 'Help & guide', icon: 'help' },
];

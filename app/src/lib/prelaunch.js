/* Opens the "launching soon" popup from anywhere (sign-up, failed sign-in, Google button). */
const subs = new Set();
export function openPrelaunch(reason = 'signup', email = '') { subs.forEach((f) => f({ reason, email })); }
export function onPrelaunch(f) { subs.add(f); return () => subs.delete(f); }

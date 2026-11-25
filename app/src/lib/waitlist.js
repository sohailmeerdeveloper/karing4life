/* Coming-soon email list.
   TODO: connect to the database (e.g. a Supabase `waitlist` table) — replace the body of
   joinWaitlist with the insert. Until then emails are kept in this browser only. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function joinWaitlist(email) {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) throw new Error('invalid');
  try {
    const list = JSON.parse(localStorage.getItem('k4l-waitlist') || '[]');
    if (!list.includes(clean)) list.push(clean);
    localStorage.setItem('k4l-waitlist', JSON.stringify(list));
  } catch { /* storage unavailable: nothing to keep yet */ }
  await new Promise((r) => setTimeout(r, 450));  // stands in for the network round trip
  return true;
}

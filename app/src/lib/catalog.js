/* Region names and care categories can be edited by admins (Admin → Regions & care types).
   This pulls the live values once and updates the shared lists in place. */
import { supabase } from './supabase.js';
import { CARE, CARE_BY, R } from '../data/data.js';

const subs = new Set();
export const onCatalog = (f) => { subs.add(f); return () => subs.delete(f); };

export async function syncCatalog() {
  const [{ data: regions }, { data: cats }] = await Promise.all([
    supabase.from('regions').select('*'),
    supabase.from('care_categories').select('*').order('sort'),
  ]);
  (regions || []).forEach((r) => { if (R[r.key]) { R[r.key].name = r.name; if (r.description) R[r.key].desc = r.description; } });
  if (cats?.length) {
    const next = cats.filter((c) => c.active).map((c) => {
      const old = CARE_BY[c.key] || { icon: 'heart', desc: '' };
      const label = c.label;
      return { ...old, key: c.key, label, short: label.replace(/\s*\(.*\)$/, ''), g: c.grp };
    });
    CARE.splice(0, CARE.length, ...next);
    Object.keys(CARE_BY).forEach((k) => { if (!next.some((c) => c.key === k)) CARE_BY[k] = { ...CARE_BY[k], inactive: true }; });
    next.forEach((c) => { CARE_BY[c.key] = c; });
  }
  subs.forEach((f) => f());
}

// Seeds the Karing4Life database with one demo login (all four portals) plus sample members,
// posts, chats, payments and reports so every screen has something real to show.
//   node scripts/seed.mjs            → (re)create demo + sample data
//   node scripts/seed.mjs --remove   → delete the demo login and all sample members
// Uses SUPABASE_SECRET_KEY from .env.local (server-side only; never shipped to the browser).
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }));
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

export const DEMO_EMAIL = 'demo@karing4life.com';
const DEMO_PASSWORD = env.K4L_DEMO_PASSWORD || 'Karing4Life-Demo-2026';
const SEED_DOMAIN = '@sample.karing4life.com';

const day = 864e5;
const ago = (d, h = 0) => new Date(Date.now() - d * day - h * 36e5).toISOString();
const ahead = (d) => new Date(Date.now() + d * day).toISOString();
const ok = (r, what) => { if (r.error) { console.error('✗', what, r.error.message || r.error); process.exit(1); } return r.data; };

async function listAll() {
  const out = []; let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    out.push(...data.users); if (data.users.length < 200) break; page++;
  }
  return out;
}

async function removeAll() {
  const users = (await listAll()).filter((u) => u.email === DEMO_EMAIL || u.email.endsWith(SEED_DOMAIN));
  for (const u of users) ok(await sb.auth.admin.deleteUser(u.id), 'delete ' + u.email);
  console.log(`Removed ${users.length} demo/sample accounts.`);
}

async function makeUser(email, password, meta) {
  const r = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  return ok(r, 'create ' + email).user.id;
}

const CAREGIVERS = [
  ['Denise Morales', 'Islip', 'suffolk', 'CNA (Certified Nursing Assistant)', ['companion', 'personal', 'respite'], ['Adult'], ['Long-term', 'Short-term'], { days: [1, 2, 3, 4, 5] }, 28, 11, ['English', 'Spanish'], true, 'available', ['suffolk', 'nassau'], 'verified', 'Senior care and post-hospital recovery, 11 years.'],
  ['Grace Oduya', 'Hempstead', 'nassau', 'RN (Registered Nurse)', ['rn', 'personal'], ['Adult', 'Pediatric'], ['Long-term', 'Fill-in'], { overnights: [5, 6, 0], days: [1, 3] }, 52, 14, ['English', 'Yoruba'], true, 'available', ['nassau', 'queens', 'suffolk'], 'verified', 'ICU-trained RN offering private duty and overnight care.'],
  ['Marco Bellini', 'Bay Ridge', 'brooklyn', 'HHA (Home Health Aide)', ['companion', 'personal', 'livein'], ['Adult'], ['Long-term'], { livein: [0, 1, 2, 3, 4, 5, 6] }, 24, 8, ['English', 'Italian'], false, 'available', ['brooklyn', 'staten-island'], 'verified', 'Live-in aide with dementia and Parkinson’s experience.'],
  ['Aisha Rahman', 'Forest Hills', 'queens', 'Doula', ['doula', 'child'], ['Pediatric', 'Adult'], ['Short-term', 'Fill-in'], { evenings: [1, 2, 3, 4], days: [6] }, 40, 6, ['English', 'Bengali', 'Hindi'], false, 'fillin', ['queens', 'brooklyn', 'manhattan'], 'pending', 'Birth and postpartum doula, lactation support.'],
  ['Tom Whitaker', 'Saratoga Springs', 'capital-region', 'Physical Therapist', ['pt', 'ot'], ['Adult', 'Pediatric'], ['Short-term', 'Long-term'], { days: [1, 2, 4] }, 85, 17, ['English'], true, 'available', ['capital-region', 'adirondacks'], 'verified', 'In-home PT after surgery, falls and strokes.'],
  ['Lucia Ferreira', 'Yonkers', 'hudson-valley', 'LPN (Licensed Practical Nurse)', ['lpn', 'personal', 'companion'], ['Adult'], ['Long-term', 'Short-term'], { days: [0, 6], evenings: [5] }, 38, 9, ['English', 'Portuguese', 'Spanish'], true, 'available', ['hudson-valley', 'bronx'], 'verified', 'Weekend LPN, medication management and wound care.'],
  ['Hannah Kim', 'Ithaca', 'finger-lakes', 'Speech Therapist', ['st', 'edu'], ['Pediatric'], ['Long-term'], { days: [1, 2, 3, 4] }, 90, 7, ['English', 'Korean'], true, 'fillin', ['finger-lakes', 'central-new-york'], 'unverified', 'Pediatric speech and feeding therapy at home.'],
  ['James Carter', 'Harlem', 'manhattan', 'Companion / non-skilled', ['companion', 'occasional', 'respite'], ['Adult'], ['Fill-in', 'Short-term'], { days: [2, 4], evenings: [2, 4] }, 22, 3, ['English'], false, 'available', ['manhattan', 'bronx'], 'unverified', 'Friendly companion for walks, errands and appointments.'],
  ['Priya Natarajan', 'Buffalo', 'niagara', 'Occupational Therapist', ['ot', 'edu'], ['Pediatric', 'Adult'], ['Long-term'], { days: [1, 3, 5] }, 80, 12, ['English', 'Tamil'], true, 'available', ['niagara', 'chautauqua-allegheny'], 'verified', 'OT for sensory, fine motor and daily-living skills.'],
  ['Rosa Delgado', 'Mott Haven', 'bronx', 'PCA (Personal Care Aide)', ['personal', 'companion', 'child'], ['Adult', 'Pediatric'], ['Long-term', 'Fill-in'], { days: [1, 2, 3, 4, 5], overnights: [1] }, 23, 10, ['English', 'Spanish'], false, 'available', ['bronx', 'manhattan'], 'pending', 'Personal care, bathing and meals; great with kids too.'],
  ['Ben Abrams', 'Plattsburgh', 'adirondacks', 'RN (Registered Nurse)', ['rn', 'lpn'], ['Adult'], ['Fill-in'], { overnights: [0, 6] }, 55, 20, ['English', 'French'], true, 'fillin', ['adirondacks', 'thousand-islands'], 'verified', 'Retired ER nurse picking up fill-in nights.'],
  ['Mei Chen', 'Flushing', 'queens', 'Educational Therapist', ['edu', 'child'], ['Pediatric'], ['Long-term', 'Short-term'], { evenings: [1, 2, 3, 4] }, 60, 5, ['English', 'Mandarin'], false, 'available', ['queens', 'nassau'], 'verified', 'Learning support for children with dyslexia and ADHD.'],
];

const FAMILIES = [
  ['Ana Rodriguez', 'Patchogue', 'suffolk'], ['Michael Brennan', 'Garden City', 'nassau'], ['Sofia Russo', 'Bay Ridge', 'brooklyn'],
  ['David Levine', 'Upper West Side', 'manhattan'], ['Keisha Thompson', 'White Plains', 'hudson-valley'], ['Paul Novak', 'Rochester', 'finger-lakes'],
];
const AGENCIES = [
  ['Hudson Home Health', 'Home care agency', 'hudson-valley', ['hudson-valley', 'bronx']],
  ['Long Island Senior Living', 'Assisted living facility', 'suffolk', ['suffolk', 'nassau']],
  ['Brooklyn Care Partners', 'Home care agency', 'brooklyn', ['brooklyn', 'queens']],
];

const FAMILY_POSTS = [
  [0, 'Weekday help for my father, 79', 'Looking for weekday afternoons: companionship plus light mobility support. Dog-friendly home and Spanish is a plus.', 'suffolk', 'Patchogue', ['companion', 'personal'], 'Adult', 'Long-term', { days: [1, 2, 3, 4, 5] }, 20, 2],
  [1, 'Overnight nursing after a hospital stay', 'Weekend overnights for about six weeks: medications, vitals and help getting up safely at night.', 'nassau', 'Garden City', ['rn', 'lpn'], 'Adult', 'Short-term', { overnights: [5, 6, 0] }, 30, 4],
  [2, 'Weekday companion for my grandmother, 88', 'Help with lunch, a short walk and her morning routine. She loves crosswords and speaks Italian.', 'brooklyn', 'Bay Ridge', ['companion', 'personal'], 'Adult', 'Long-term', { days: [1, 2, 3, 4, 5] }, 25, 1],
  [3, 'Speech therapy for our 4-year-old', 'Our son needs speech therapy twice a week at home after school. Bilingual English/Hebrew household.', 'manhattan', 'Upper West Side', ['st'], 'Pediatric', 'Long-term', { evenings: [1, 3] }, 3, 6],
  [4, 'Live-in caregiver for a retired teacher', 'Private room and bath. Mobility support, meals and companionship for our father with early Parkinson’s.', 'hudson-valley', 'White Plains', ['livein', 'personal'], 'Adult', 'Long-term', { livein: [0, 1, 2, 3, 4, 5, 6] }, 0, 3],
  [5, 'Saturday respite for Mom’s caregiver', 'Dad cares for Mom full-time. We’d love someone for a few Saturdays so he can rest and run errands.', 'finger-lakes', 'Rochester', ['respite', 'occasional'], 'Adult', 'Fill-in', { days: [6] }, 6, 9],
];

async function seed() {
  await removeAll();
  const rand = () => randomBytes(24).toString('base64url');

  // ---- demo login: every portal, one email + password ----
  const demo = await makeUser(DEMO_EMAIL, DEMO_PASSWORD, { role: 'family', full_name: 'Jordan Avery' });
  ok(await sb.from('profiles').update({ roles: ['caregiver', 'family', 'agency', 'admin'], town: 'Huntington', region_key: 'suffolk', onboarded: true, last_seen_at: ago(0) }).eq('id', demo), 'demo roles');
  ok(await sb.from('family_profiles').update({ address: '12 Elm Street', zip: '11743', care_for: 'My mother, 81' }).eq('user_id', demo), 'demo family');
  ok(await sb.from('caregiver_profiles').upsert({
    user_id: demo, headline: 'Compassionate RN for seniors and post-surgical care', bio: 'Registered nurse with 9 years in home health and hospice. I focus on medication management, wound care and keeping families in the loop.',
    credential: 'RN (Registered Nurse)', license_number: 'NY-608123', care_types: ['rn', 'personal', 'companion'], recipients: ['Adult'], durations: ['Long-term', 'Short-term', 'Fill-in'],
    schedule: { days: [1, 2, 3, 4], evenings: [5] }, languages: ['English', 'Spanish'], years_exp: 9, rate_min: 48, has_car: true, availability: 'available',
    service_regions: ['suffolk', 'nassau', 'queens'], verification: 'verified', trial_ends_at: ahead(9),
  }), 'demo caregiver');
  ok(await sb.from('agency_profiles').upsert({ user_id: demo, business_name: 'Avery Home Care Group', agency_type: 'Home care agency', ein: '12-3456789', website: 'https://example.com', contact_name: 'Jordan Avery', about: 'Family-owned home care agency serving Long Island and Queens since 2012.', verification: 'verified' }), 'demo agency');

  // ---- sample caregivers ----
  const cg = [];
  for (const [i, c] of CAREGIVERS.entries()) {
    const [name, town, region, credential, care, recip, dur, sched, rate, yrs, langs, car, avail, regions, ver, headline] = c;
    const id = await makeUser(`caregiver${i + 1}${SEED_DOMAIN}`, rand(), { role: 'caregiver', full_name: name });
    ok(await sb.from('profiles').update({ town, region_key: region, onboarded: true, created_at: ago(30 + i * 3), last_seen_at: ago(i % 4, i) }).eq('id', id), 'cg profile');
    ok(await sb.from('caregiver_profiles').update({ headline, bio: headline + ' References available on request. Comfortable with pets and happy to meet the family first.', credential, care_types: care, recipients: recip, durations: dur, schedule: sched, rate_min: rate, years_exp: yrs, languages: langs, has_car: car, availability: avail, service_regions: regions, verification: ver, license_number: /RN|LPN|Therap/.test(credential) ? 'NY-' + (500000 + i * 7919) : null }).eq('user_id', id), 'cg detail');
    cg.push(id);
  }

  // ---- sample families + their posts ----
  const fam = [];
  for (const [i, [name, town, region]] of FAMILIES.entries()) {
    const id = await makeUser(`family${i + 1}${SEED_DOMAIN}`, rand(), { role: 'family', full_name: name });
    ok(await sb.from('profiles').update({ town, region_key: region, onboarded: true, created_at: ago(20 + i * 2) }).eq('id', id), 'fam profile');
    fam.push(id);
  }
  const posts = [];
  for (const [fi, title, body, region, town, care, recip, dur, sched, hrs, age] of FAMILY_POSTS) {
    const p = ok(await sb.from('posts').insert({ author_id: fam[fi], kind: 'family', title, body, region_key: region, town, care_types: care, recipient: recip, duration: dur, schedule: sched, hours_per_week: hrs, start_date: ahead(5).slice(0, 10), created_at: ago(age), expires_at: ahead(14 - age) }).select('id').single(), 'post');
    ok(await sb.from('contact_quotas').insert({ post_id: p.id, family_id: fam[fi], free_limit: 10, used: fi % 3 }), 'quota');
    posts.push(p.id);
  }

  // ---- sample agencies + job posts ----
  const ag = [];
  for (const [i, [biz, type, region, regs]] of AGENCIES.entries()) {
    const id = await makeUser(`agency${i + 1}${SEED_DOMAIN}`, rand(), { role: 'agency', full_name: biz + ' HR', business_name: biz });
    ok(await sb.from('profiles').update({ town: R_NAME[region], region_key: region, onboarded: true, created_at: ago(40 + i) }).eq('id', id), 'ag profile');
    ok(await sb.from('agency_profiles').update({ agency_type: type, ein: `4${i}-55512${i}${i}`, website: 'https://example.com', contact_name: 'Hiring team', about: `${biz} is hiring caring, reliable aides and nurses.`, verification: i === 2 ? 'pending' : 'verified' }).eq('user_id', id), 'ag detail');
    for (const r of regs) ok(await sb.from('region_subscriptions').insert({ user_id: id, region_key: r, plan: 'agency', status: 'active', source: 'stripe', current_period_end: ahead(20) }), 'ag sub');
    ok(await sb.from('posts').insert({ author_id: id, kind: 'agency', title: ['Weekend HHA, Westchester', 'Overnight CNA for assisted living', 'Bilingual PCA, full-time'][i], body: 'We’re hiring a dependable caregiver to join our team. Paid training, flexible schedules and weekly pay.', region_key: regs[0], town: R_NAME[regs[0]], care_types: [['personal', 'companion'], ['personal', 'respite'], ['personal', 'companion']][i], recipient: 'Adult', duration: 'Long-term', schedule: [{ days: [0, 6] }, { overnights: [1, 2, 3, 4, 5] }, { days: [1, 2, 3, 4, 5] }][i], pay_range: ['$24–28 / hr', '$22–26 / hr', '$21–24 / hr'][i], created_at: ago(i + 1), expires_at: ahead(50) }), 'ag post');
    ag.push(id);
  }

  // ---- demo as FAMILY: two requests, chats with caregivers ----
  const dp1 = ok(await sb.from('posts').insert({ author_id: demo, kind: 'family', title: 'Afternoon companion for my mother, 81', body: 'Mom lives on her own in Huntington and would love company most afternoons: lunch, a walk, and help keeping track of her medications.', region_key: 'suffolk', town: 'Huntington', care_types: ['companion', 'personal'], recipient: 'Adult', duration: 'Long-term', schedule: { days: [1, 2, 3, 4, 5] }, hours_per_week: 15, start_date: ahead(7).slice(0, 10), created_at: ago(3), expires_at: ahead(11) }).select('id').single(), 'demo post');
  ok(await sb.from('contact_quotas').insert({ post_id: dp1.id, family_id: demo, free_limit: 10, used: 3 }), 'demo quota');
  const dp2 = ok(await sb.from('posts').insert({ author_id: demo, kind: 'family', title: 'Overnight help after Mom’s knee surgery', body: 'Two weeks of overnight help after surgery in October. This one is filled now, thank you everyone!', region_key: 'suffolk', town: 'Huntington', care_types: ['lpn', 'personal'], recipient: 'Adult', duration: 'Fill-in', schedule: { overnights: [1, 2, 3, 4] }, hours_per_week: 40, status: 'closed', created_at: ago(24), expires_at: ago(10) }).select('id').single(), 'demo post2');
  ok(await sb.from('contact_quotas').insert({ post_id: dp2.id, family_id: demo, free_limit: 10, extra: 10, used: 12 }), 'demo quota2');

  const chat = async (a, ra, b, rb, post, counted, lines, startAgo) => {
    const c = ok(await sb.from('conversations').insert({ user_a: a, role_a: ra, user_b: b, role_b: rb, post_id: post, counted, created_at: ago(startAgo) }).select('id').single(), 'conv');
    for (const [k, [who, body]] of lines.entries()) {
      ok(await sb.from('messages').insert({ conversation_id: c.id, sender_id: who === 'a' ? a : b, body, created_at: ago(startAgo - k * 0.08) }), 'msg');
    }
    return c.id;
  };
  await chat(demo, 'family', cg[0], 'caregiver', dp1.id, true, [['a', 'Hi Denise! Your profile looks like a great fit for my mother. Are weekday afternoons still open for you?'], ['b', 'Hi Jordan, yes! I’m free Monday to Friday after 12. I live in Islip, so Huntington is an easy drive.'], ['a', 'Wonderful. Could you come by Thursday at 2 to meet her?'], ['b', 'Thursday at 2 works. See you then!']], 2);
  await chat(demo, 'family', cg[1], 'caregiver', dp1.id, true, [['a', 'Hello Grace, do you also take daytime companion shifts?'], ['b', 'Mostly overnights, but I can do Mondays and Wednesdays during the day.']], 1.5);
  await chat(cg[5], 'caregiver', demo, 'family', dp1.id, false, [['a', 'Hi! I saw your request for your mother. I’m an LPN in Yonkers and travel to Suffolk on weekdays. Happy to chat.']], 0.4);

  // ---- demo as CAREGIVER: replied to two family posts, one agency chat ----
  await chat(demo, 'caregiver', fam[1], 'family', posts[1], false, [['a', 'Hi Michael, I’m an RN in Huntington with overnight availability on weekends. I’d be glad to help after your dad’s hospital stay.'], ['b', 'That would be a huge help. Do you have experience with blood thinners and fall precautions?'], ['a', 'Yes, both, from 9 years of home health. Happy to share references.']], 1);
  await chat(ag[1], 'agency', demo, 'caregiver', null, false, [['a', 'Hi Jordan, we have an overnight RN supervisor role in Suffolk. Would you be open to a quick call?']], 0.2);
  ok(await sb.from('region_subscriptions').insert([
    { user_id: demo, region_key: 'suffolk', plan: 'caregiver', status: 'active', source: 'stripe', current_period_end: ahead(18), created_at: ago(40) },
    { user_id: demo, region_key: 'nassau', plan: 'caregiver', status: 'active', source: 'stripe', current_period_end: ahead(18), created_at: ago(40) },
    { user_id: demo, region_key: 'suffolk', plan: 'agency', status: 'active', source: 'stripe', current_period_end: ahead(12), created_at: ago(60) },
    { user_id: demo, region_key: 'queens', plan: 'agency', status: 'active', source: 'stripe', current_period_end: ahead(12), created_at: ago(60) },
  ]), 'demo subs');

  // ---- demo as AGENCY: job posts + recruiting chat ----
  ok(await sb.from('posts').insert([
    { author_id: demo, kind: 'agency', title: 'Live-in HHA for Long Island clients', body: 'Full-time live-in home health aides for clients across Suffolk. Paid training and weekly pay.', region_key: 'suffolk', town: 'Huntington', care_types: ['livein', 'personal'], recipient: 'Adult', duration: 'Long-term', schedule: { livein: [0, 1, 2, 3, 4, 5, 6] }, pay_range: '$260–300 / day', created_at: ago(5), expires_at: ahead(55) },
    { author_id: demo, kind: 'agency', title: 'Pediatric LPN, Queens', body: 'Weekday pediatric LPN for a medically complex 7-year-old in Flushing.', region_key: 'queens', town: 'Flushing', care_types: ['lpn'], recipient: 'Pediatric', duration: 'Long-term', schedule: { days: [1, 2, 3, 4, 5] }, pay_range: '$38–42 / hr', created_at: ago(9), expires_at: ahead(51) },
  ]), 'demo jobs');
  await chat(demo, 'agency', cg[11], 'caregiver', null, false, [['a', 'Hi Mei, we have an after-school learning-support client in Flushing. Interested?'], ['b', 'Yes! What days would that be?']], 0.8);
  ok(await sb.from('saved_caregivers').insert([{ user_id: demo, caregiver_id: cg[0] }, { user_id: demo, caregiver_id: cg[2] }, { user_id: demo, caregiver_id: cg[11] }]), 'saved');

  // ---- payments (history + revenue charts) ----
  const pay = [];
  for (let m = 0; m < 6; m++) {
    pay.push({ user_id: demo, kind: 'subscription', description: 'Region Access · Suffolk, Nassau', amount_cents: 1798, region_key: 'suffolk', created_at: ago(m * 30 + 2), stripe_ref: 'in_demo_' + m });
    pay.push({ user_id: demo, kind: 'subscription', description: 'Agency Access · Suffolk, Queens', amount_cents: 9998, region_key: 'suffolk', created_at: ago(m * 30 + 5), stripe_ref: 'in_demoag_' + m });
    for (const [i, id] of ag.entries()) pay.push({ user_id: id, kind: 'subscription', description: 'Agency Access · 2 regions', amount_cents: 9998, created_at: ago(m * 30 + 3 + i) });
    for (const [i, id] of cg.slice(0, 8).entries()) if (i + m < 9) pay.push({ user_id: id, kind: 'subscription', description: 'Region Access', amount_cents: 899 * (1 + (i % 2)), created_at: ago(m * 30 + i) });
  }
  pay.push({ user_id: demo, kind: 'contact_pack', description: '10 extra contacts · Overnight help after Mom’s knee surgery', amount_cents: 899, post_id: dp2.id, created_at: ago(18), stripe_ref: 'pi_demo_pack' });
  pay.push({ user_id: fam[1], kind: 'contact_pack', description: '10 extra contacts', amount_cents: 899, created_at: ago(6), status: 'refunded' });
  ok(await sb.from('payments').insert(pay, { defaultToNull: false }), 'payments');
  for (const [i, id] of cg.slice(0, 8).entries()) {
    ok(await sb.from('region_subscriptions').insert({ user_id: id, region_key: CAREGIVERS[i][13][0], plan: 'caregiver', status: i === 6 ? 'past_due' : 'active', source: 'stripe', current_period_end: ahead(10 + i) }), 'cg sub');
  }

  // ---- verification queue, reports, notifications, Kommunity Korner ----
  ok(await sb.from('verification_documents').insert(DTN([
    { user_id: cg[3], doc_type: 'gov_id', status: 'pending', created_at: ago(1) },
    { user_id: cg[3], doc_type: 'reference', ref_name: 'Dr. Leah Moss', ref_contact: '(718) 555-0142', ref_relation: 'OB-GYN I worked with', status: 'pending', created_at: ago(1) },
    { user_id: cg[9], doc_type: 'gov_id', status: 'pending', created_at: ago(0, 5) },
    { user_id: cg[9], doc_type: 'reference', ref_name: 'Maria Santos', ref_contact: 'maria.s@example.com', ref_relation: 'Former client’s daughter', status: 'pending', created_at: ago(0, 5) },
    { user_id: ag[2], doc_type: 'business', status: 'pending', note: 'EIN letter', created_at: ago(2) },
    { user_id: demo, doc_type: 'license', status: 'approved', created_at: ago(30), reviewed_at: ago(29) },
  ]), { defaultToNull: false }), 'docs');
  ok(await sb.from('reports').insert(DTN([
    { reporter_id: fam[2], target_user_id: cg[7], reason: 'recruiter', details: 'Kept asking me to sign up with a staffing agency instead of answering about the job.', created_at: ago(1) },
    { reporter_id: cg[0], target_post_id: posts[5], target_user_id: fam[5], reason: 'other', details: 'Post says Saturday only but the family asked for 5 days in chat.', created_at: ago(3) },
    { reporter_id: cg[2], target_user_id: fam[3], reason: 'spam', details: 'Duplicate messages.', status: 'dismissed', resolution: 'Not spam, family re-sent after a typo.', created_at: ago(9), resolved_at: ago(8) },
  ]), { defaultToNull: false }), 'reports');
  ok(await sb.from('posts').update({ flagged: true, edit_count: 3 }).eq('id', posts[3]), 'flag');
  ok(await sb.from('notifications').insert(DTN([
    { user_id: demo, kind: 'post', title: 'New care request in Nassau', body: FAMILY_POSTS[1][1], link: '/portal/caregiver/posts/' + posts[1], created_at: ago(4) },
    { user_id: demo, kind: 'verification', title: 'You’re verified', body: 'Your RN license was approved. The verified badge now shows on your profile.', link: '/portal/caregiver/verification', created_at: ago(29), read_at: ago(28) },
    { user_id: demo, kind: 'billing', title: 'Payment received', body: 'Region Access · Suffolk, Nassau · $17.98', link: '/portal/caregiver/billing', created_at: ago(2), read_at: ago(2) },
  ]), { defaultToNull: false }), 'notifs');
  const kk = ok(await sb.from('kk_posts').insert([
    { author_id: fam[0], title: 'Unopened adult briefs, size L (3 packs)', body: 'Dad switched brands, so these are still sealed. Free to anyone in Suffolk who can pick up in Patchogue.', category: 'Supplies', condition: 'Unopened', region_key: 'suffolk', created_at: ago(2) },
    { author_id: fam[4], title: 'Folding walker with wheels', body: 'Lightly used, adjustable height. Moving to a rollator so this needs a new home.', category: 'Mobility', condition: 'Used', region_key: 'hudson-valley', created_at: ago(4) },
    { author_id: demo, title: 'Opened box of gauze pads and tape', body: 'About 80% left of a box of 4x4 gauze pads plus two rolls of medical tape. Free, Huntington pickup.', category: 'Supplies', condition: 'Opened', region_key: 'suffolk', created_at: ago(6) },
    { author_id: fam[2], title: 'Newborn diapers, size N', body: 'Two sealed packs. Baby grew faster than expected!', category: 'Baby & child', condition: 'Unopened', region_key: 'brooklyn', created_at: ago(1) },
  ]).select('id'), 'kk');
  ok(await sb.from('kk_comments').insert([
    { post_id: kk[0].id, author_id: cg[0], body: 'One of my clients could really use these. Messaging you!', created_at: ago(1) },
    { post_id: kk[1].id, author_id: demo, body: 'Is this still available? I can pick up Saturday.', created_at: ago(3) },
    { post_id: kk[2].id, author_id: fam[0], body: 'Thank you for sharing this!', created_at: ago(5) },
  ]), 'kk comments');
  ok(await sb.from('admin_logs').insert([
    { admin_id: demo, action: 'verify_verified', target_type: 'caregiver', target_id: cg[0], details: { note: 'CNA certificate checked' }, created_at: ago(12) },
    { admin_id: demo, action: 'refund', target_type: 'payment', target_id: fam[1], details: { amount: 8.99 }, created_at: ago(6) },
  ]), 'logs');

  console.log(`Seeded: demo login + ${cg.length} caregivers, ${fam.length} families, ${ag.length} agencies.`);
  console.log(`Demo login → ${DEMO_EMAIL}`);
}

const DTN = (x) => x;
const R_NAME = { 'hudson-valley': 'White Plains', suffolk: 'Hauppauge', brooklyn: 'Downtown Brooklyn' };

if (process.argv.includes('--remove')) await removeAll(); else await seed();

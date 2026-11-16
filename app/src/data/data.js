/* Shared data for Karing4Life (care types, regions, sample requests, step copy). */
import MAP from './regions-lite.json';

export const PRICE_CG = 8.99, PRICE_AG = 49.99;

export const CARE = [
    { key: 'rn', label: 'RN (Registered Nurse)', short: 'RN', g: 'skilled', icon: 'steth', desc: 'Assessments, medications, wound and post-surgical care.' },
    { key: 'lpn', label: 'LPN (Licensed Practical Nurse)', short: 'LPN', g: 'skilled', icon: 'syringe', desc: 'Medications, vitals and routine nursing on an RN’s plan.' },
    { key: 'pt', label: 'Physical Therapy', short: 'Physical Therapy', g: 'skilled', icon: 'activity', desc: 'Strength, balance and mobility after illness or surgery.' },
    { key: 'st', label: 'Speech Therapy', short: 'Speech Therapy', g: 'skilled', icon: 'speech', desc: 'Speech, language and swallowing, for children and adults.' },
    { key: 'ot', label: 'Occupational Therapy', short: 'Occupational Therapy', g: 'skilled', icon: 'hand', desc: 'Skills for daily living, from dressing to fine motor control.' },
    { key: 'edu', label: 'Educational Therapy', short: 'Educational Therapy', g: 'skilled', icon: 'book', desc: 'One-to-one learning support for children who learn differently.' },
    { key: 'doula', label: 'Doula', short: 'Doula', g: 'skilled', icon: 'sprout', desc: 'Support before, during and after birth, at home.' },
    { key: 'companion', label: 'Companion Care', short: 'Companion Care', g: 'nonskilled', icon: 'coffee', desc: 'Conversation, outings, errands and meals together.' },
    { key: 'personal', label: 'Personal Care', short: 'Personal Care', g: 'nonskilled', icon: 'droplet', desc: 'Bathing, dressing, grooming and help moving around.' },
    { key: 'livein', label: 'Live-in Care', short: 'Live-in Care', g: 'nonskilled', icon: 'home', desc: 'Round-the-clock support from someone who lives in.' },
    { key: 'child', label: 'Newborn / Child Care', short: 'Newborn / Child Care', g: 'nonskilled', icon: 'smile', desc: 'Newborn care, nannies and help with little ones.' },
    { key: 'respite', label: 'Respite Care', short: 'Respite Care', g: 'nonskilled', icon: 'moon', desc: 'Short breaks so family caregivers can rest.' },
    { key: 'occasional', label: 'Occasional Care', short: 'Occasional Care', g: 'nonskilled', icon: 'cal', desc: 'A visit here and there, whenever you need a hand.' }
  ];
export const CARE_BY = {}; CARE.forEach(function (c) { CARE_BY[c.key] = c; });

export const GROUPS = { li: 'Long Island', nyc: 'New York City', up: 'Upstate' };
export const REGION_META = [
    ['suffolk', 'Suffolk', 'li', 'Eastern Long Island, from Huntington and Babylon out through Brookhaven to the Hamptons, the North Fork and Montauk.'],
    ['nassau', 'Nassau', 'li', 'Western Long Island between Queens and Suffolk: Hempstead, North Hempstead, Oyster Bay, Glen Cove and Long Beach.'],
    ['manhattan', 'Manhattan', 'nyc', 'New York County, from the Financial District and the Lower East Side up to Harlem, Washington Heights and Inwood.'],
    ['brooklyn', 'Brooklyn', 'nyc', 'Kings County, the city’s most populous borough, from Williamsburg and Park Slope to Bay Ridge and Coney Island.'],
    ['queens', 'Queens', 'nyc', 'Queens County, from Astoria and Flushing to Jamaica and the Rockaways. The city’s largest borough by area.'],
    ['bronx', 'Bronx', 'nyc', 'Bronx County, the only borough on the mainland, from Mott Haven and Fordham up to Riverdale and Co-op City.'],
    ['staten-island', 'Staten Island', 'nyc', 'Richmond County, across the harbor from Brooklyn and New Jersey, from St. George to Tottenville.'],
    ['capital-region', 'Capital Region', 'up', 'Albany, Schenectady, Troy and Saratoga Springs, plus the farm country of Washington County.'],
    ['hudson-valley', 'Hudson Valley', 'up', 'Both banks of the Hudson, from Westchester and Rockland up through Orange, Dutchess and Ulster to Columbia County.'],
    ['central-new-york', 'Central New York', 'up', 'Utica, Rome, Binghamton and Cooperstown, from the Mohawk Valley down to the Southern Tier.'],
    ['adirondacks', 'Adirondacks', 'up', 'The North Country’s mountains and lakes: Plattsburgh, Lake Placid, Saranac Lake, Glens Falls and Gloversville.'],
    ['catskills', 'Catskills', 'up', 'Mountain towns and river valleys across Delaware, Greene, Schoharie and Sullivan counties.'],
    ['finger-lakes', 'Finger Lakes', 'up', 'Rochester, Syracuse, Ithaca, Elmira and Geneva, and the lake towns and farms in between.'],
    ['niagara', 'Niagara', 'up', 'Buffalo and Niagara Falls, plus the towns of Genesee, Orleans and Wyoming counties.'],
    ['thousand-islands', 'Thousand Islands', 'up', 'Watertown, Oswego, Potsdam and the St. Lawrence River towns along the Canadian border.'],
    ['chautauqua-allegheny', 'Chautauqua-Allegheny', 'up', 'Jamestown, Olean, Salamanca and the rolling hills of New York’s south-western corner.']
  ];
export const BOROUGH_COUNTY = { Manhattan: 'New York', Brooklyn: 'Kings', 'Staten Island': 'Richmond' };
export const REGIONS = [], R = {};
const mapByName = {};
  MAP.regions.forEach(function (m) { mapByName[m.name] = m; });
  REGION_META.forEach(function (m, i) {
    const geo = mapByName[m[1]] || { counties: [], d: '', c: [0, 0], bbox: [0, 0, 0, 0] };
    const r = { key: m[0], name: m[1], g: m[2], group: GROUPS[m[2]], desc: m[3], counties: geo.counties.slice(), d: geo.d, c: geo.c, bbox: geo.bbox, i: i };
    r.countyChips = r.counties.map(function (c) { return r.counties.length === 1 ? c + ' County' : c; });
    REGIONS.push(r); R[r.key] = r;
  });

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SCHED = [['days', 'Days', 'sun'], ['evenings', 'Evenings', 'sunset'], ['overnights', 'Overnights', 'moon'], ['livein', 'Live-in', 'home']];

export const REQUESTS = [
    { id: 1, added: '2026-11-10', start: '2026-11-13', region: 'suffolk', town: 'Smithtown', care: ['pt', 'st', 'ot'], recipient: 'Pediatric', duration: 'Long-term', sched: { days: [0, 1] }, hours: 12,
      title: 'Therapy at home for our 6-year-old son', text: 'Looking for a team that can visit Sunday and Monday mornings for PT, speech and OT after his surgery.' },
    { id: 2, added: '2026-11-14', start: '2026-11-20', region: 'queens', town: 'Forest Hills', care: ['child', 'doula'], recipient: 'Pediatric', duration: 'Short-term', sched: { evenings: [2, 4] }, hours: 8,
      title: 'Postpartum doula and newborn help', text: 'First baby due mid-November. Two evenings a week of newborn care and support for mom, Spanish a plus.' },
    { id: 3, added: '2026-11-13', start: '2026-11-15', region: 'capital-region', town: 'Saratoga Springs', care: ['respite', 'occasional'], recipient: 'Adult', duration: 'Fill-in', sched: { days: [6] }, hours: 6,
      title: 'Saturday respite for Mom’s caregiver', text: 'Dad cares for Mom full-time. We’d love someone for a few Saturdays so he can rest and run errands.' },
    { id: 4, added: '2026-11-12', start: '2026-12-01', region: 'brooklyn', town: 'Bay Ridge', care: ['companion', 'personal'], recipient: 'Adult', duration: 'Long-term', sched: { days: [1, 2, 3, 4, 5] }, hours: 25,
      title: 'Weekday companion for my grandmother, 88', text: 'Help with lunch, a short walk and her morning routine. She loves crosswords and speaks Italian.' },
    { id: 5, added: '2026-11-09', start: '2026-11-18', region: 'hudson-valley', town: 'White Plains', care: ['livein', 'personal'], recipient: 'Adult', duration: 'Long-term', sched: { livein: [0, 1, 2, 3, 4, 5, 6] }, hours: 0,
      title: 'Live-in caregiver for a retired teacher', text: 'Private room and bath. Mobility support, meals and companionship for our father with early Parkinson’s.' },
    { id: 6, added: '2026-11-08', start: '2026-11-16', region: 'finger-lakes', town: 'Rochester', care: ['rn', 'lpn'], recipient: 'Adult', duration: 'Short-term', sched: { overnights: [5, 6, 0] }, hours: 30,
      title: 'Overnight nursing after a hospital stay', text: 'Weekend overnights for about six weeks: medications, vitals and help getting up safely at night.' }
  ];


export function icon(name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
export function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
export function money(n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
export function fmtDate(iso) { var d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }

export const MOCK = {
    f1: '<div class="mock-card"><div class="mock-row" style="justify-content:space-between"><span class="mock-label">New care request</span><span class="mock-pill">' + icon('pin', 'i-sm') + 'Suffolk</span></div><div class="mock-row" style="margin-top:12px;flex-wrap:wrap"><span class="mock-pill on">Companion</span><span class="mock-pill on">Personal</span><span class="mock-pill">Respite</span></div><div class="mock-row" style="margin-top:10px"><span class="mock-pill">Weekdays</span><span class="mock-pill">Adult</span><span class="mock-pill">Long-term</span></div><div class="mock-btn">' + icon('send', 'i-sm') + 'Post request · Free</div></div>',
    f2: '<div class="mock-card"><div class="mock-row"><span class="avatar olive">DM</span><div><strong style="font-size:14px">Denise M. · CNA</strong><div class="verified">' + icon('shield') + 'Verified</div></div></div><div class="bubble in" style="margin-top:12px">Hi! I’m a CNA in Islip with 11 years in senior care. Weekday afternoons work well for me.</div></div>',
    f3: '<div class="mock-card"><div class="bubble out">Could you come by Thursday to meet Dad?</div><div class="bubble in" style="margin-top:8px">Of course. 2pm works for me.</div><div class="mock-row" style="margin-top:12px;color:var(--muted);font-size:12px;font-weight:600">' + icon('lock', 'i-sm') + 'Private messaging · numbers stay hidden</div></div>',
    c1: '<div class="mock-card"><div class="mock-row"><span class="avatar olive">DM</span><div style="flex:1"><strong style="font-size:14px">Denise M.</strong><div class="muted" style="font-size:12px">CNA · Islip</div></div><span class="status-pill" style="height:24px;font-size:12px"><span class="dot dot-available"></span>Available</span></div><div class="mock-row" style="margin-top:12px;flex-wrap:wrap"><span class="mock-pill">From $28 / hr</span><span class="mock-pill">Weekdays</span><span class="mock-pill">Spanish</span></div><div class="mock-btn olive">' + icon('check', 'i-sm') + 'Profile complete</div></div>',
    c2: '<div class="mock-card"><div class="mock-row" style="justify-content:space-between"><span class="mock-row" style="margin:0">' + icon('file', 'i-sm') + '<strong style="font-size:13px">CNA license</strong></span><span class="verified">' + icon('check-circle') + 'Approved</span></div><div class="mock-row" style="justify-content:space-between;margin-top:12px"><span class="mock-row" style="margin:0">' + icon('id', 'i-sm') + '<strong style="font-size:13px">Government ID</strong></span><span class="mock-pill">' + icon('lock', 'i-sm') + 'Private</span></div><div class="mock-line" style="margin-top:14px;width:100%;background:var(--olive)"></div><div class="mock-label" style="margin-top:8px">Reviewed by hand</div></div>',
    c3: '<div class="mock-card"><div class="mock-row" style="justify-content:space-between"><span class="mock-label">Family request · Suffolk</span>' + icon('lock', 'i-sm') + '</div><div class="mock-blur" style="margin-top:10px"><strong>Weekday help for my father</strong><div style="font-size:12px">Afternoons, light mobility, dog-friendly home</div></div><div class="mock-btn">' + icon('unlock', 'i-sm') + 'Unlock Suffolk · $8.99/mo</div></div>',
    a1: '<div class="mock-card">' + ['EIN', 'Website', 'Business contact'].map(function (t, i) { return '<div class="mock-row" style="justify-content:space-between' + (i ? ';margin-top:10px' : '') + '"><strong style="font-size:13px">' + t + '</strong><span class="verified">' + icon('check-circle') + 'Checked</span></div>'; }).join('') + '<div class="mock-btn olive">' + icon('shield', 'i-sm') + 'Verified business</div></div>',
    a2: '<div class="mock-card"><span class="mock-label">Your regions</span><div class="mock-row" style="margin-top:10px;flex-wrap:wrap"><span class="mock-pill on">Hudson Valley</span><span class="mock-pill on">Bronx</span><span class="mock-pill">Queens</span><span class="mock-pill">Nassau</span></div><div class="mock-row" style="justify-content:space-between;margin-top:14px;border-top:1px solid var(--line);padding-top:10px"><span class="muted" style="font-size:12px">2 × $49.99</span><strong>$99.98 / mo</strong></div></div>',
    a3: '<div class="mock-card"><div class="mock-row" style="justify-content:space-between"><strong style="font-size:14px">Weekend HHA · Westchester</strong><span class="badge" style="height:22px;font-size:11px">Job post</span></div><div class="mock-row" style="margin-top:10px"><span class="mock-pill">Sat–Sun</span><span class="mock-pill">$24–28 / hr</span></div><div class="mock-row" style="margin-top:12px;color:var(--muted);font-size:12px;font-weight:600">' + icon('eye-off', 'i-sm') + 'Family requests are hidden from agencies</div></div>'
  };
export const STEPS = {
    families: [['pen', 'Post a request', 'Say where you are, the kind of care and the schedule. It’s free and takes about a minute.', 'f1'],
      ['msg', 'Caregivers reply', 'Verified caregivers and nurses in your region read it and reply with how they can help.', 'f2'],
      ['lock', 'Talk directly', 'Message privately on the site. Share your number only when you’re ready.', 'f3']],
    caregivers: [['pen', 'Build your profile', 'Credentials, care types, languages, regions and your rate. About two minutes.', 'c1'],
      ['shield', 'Get verified', 'Upload a license or government ID. We review it by hand before you reply to families.', 'c2'],
      ['unlock', 'Unlock a region', 'Every family request there opens up for $8.99 a month. Reply to the ones that fit.', 'c3']],
    agencies: [['building', 'Verify your business', 'Send your EIN, website and a business contact. We review every agency by hand.', 'a1'],
      ['map', 'Choose your regions', '$49.99 a month per region, billed together in one charge. Cancel anytime.', 'a2'],
      ['briefcase', 'Post jobs and recruit', 'List open roles and message verified caregivers. Family requests stay private.', 'a3']]
  };

export const ROLE_COPY = {
    family: { title: 'Family account', sub: 'Post a free care request and hear from verified caregivers in your region.', btn: 'Create family account',
      aside: '<h3>Free for families, always</h3><ul><li>' + icon('check') + 'One free care request every 2 weeks</li><li>' + icon('check') + 'Message 10 caregivers per post, free</li><li>' + icon('check') + '10 more contacts for $8.99, if you need them</li><li>' + icon('check') + 'Replies from caregivers are always free</li></ul>' },
    caregiver: { title: 'Nurse or caregiver profile', sub: 'Build your profile, get verified and start replying to families.', btn: 'Create profile & start trial',
      aside: '<h3>14 days free, every region</h3><ul><li>' + icon('check') + 'Then $8.99 a month per region</li><li>' + icon('check') + 'All regions in one monthly charge</li><li>' + icon('check') + 'Choose Available or Fill-in status</li><li>' + icon('check') + 'No contracts, cancel anytime</li></ul>' },
    agency: { title: 'Agency or facility profile', sub: 'Verify your business, choose your regions, then post jobs and recruit.', btn: 'Create agency profile',
      aside: '<h3>Agency Access</h3><ul><li>' + icon('check') + '$49.99 a month per region</li><li>' + icon('check') + 'Unlimited job posts and messaging</li><li>' + icon('check') + 'Verified with EIN, website and contact</li><li>' + icon('eye-off') + 'Family requests are not visible to agencies</li></ul>' }
  };

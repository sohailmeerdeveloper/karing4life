(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Data
     ------------------------------------------------------------------ */
  // Static SVG path data, projected at build time (US Census cb_2023_us_county_500k,
  // merged per region with topojson-client, geoConicConformal parallels 40.6/44.4).
  var MAP = /*__MAPDATA__*/null;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PRICE_CG = 8.99, PRICE_AG = 49.99;

  var CARE = [
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
  var CARE_BY = {}; CARE.forEach(function (c) { CARE_BY[c.key] = c; });

  var GROUPS = { li: 'Long Island', nyc: 'New York City', up: 'Upstate' };
  var REGION_META = [
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
  var BOROUGH_COUNTY = { Manhattan: 'New York', Brooklyn: 'Kings', 'Staten Island': 'Richmond' };
  var REGIONS = [], R = {};
  var mapByName = {};
  if (MAP) MAP.regions.forEach(function (m) { mapByName[m.name] = m; });
  REGION_META.forEach(function (m, i) {
    var geo = mapByName[m[1]] || { counties: [], d: '', c: [0, 0], bbox: [0, 0, 0, 0] };
    var r = { key: m[0], name: m[1], g: m[2], group: GROUPS[m[2]], desc: m[3], counties: geo.counties.slice(), d: geo.d, c: geo.c, bbox: geo.bbox, i: i };
    r.countyChips = r.counties.map(function (c) { return r.counties.length === 1 ? c + ' County' : c; });
    REGIONS.push(r); R[r.key] = r;
  });

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var SCHED = [['days', 'Days', 'sun'], ['evenings', 'Evenings', 'sunset'], ['overnights', 'Overnights', 'moon'], ['livein', 'Live-in', 'home']];

  var REQUESTS = [
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

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function icon(name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmtDate(iso) { var d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  function toast(title, body) {
    var wrap = $('#toasts'); if (!wrap) return;
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = icon('check-circle') + '<div><strong>' + esc(title) + '</strong>' + (body ? '<span>' + esc(body) + '</span>' : '') + '</div>';
    wrap.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 250); }, 3800);
  }

  /* ------------------------------------------------------------------
     Selects: care + region
     ------------------------------------------------------------------ */
  function fillSelects() {
    $$('select[data-fill]').forEach(function (sel) {
      var html = '<option value="">' + esc(sel.getAttribute('data-any') || 'Any') + '</option>';
      if (sel.dataset.fill === 'care') {
        html += '<optgroup label="Skilled care">' + CARE.filter(function (c) { return c.g === 'skilled'; }).map(function (c) { return '<option value="' + c.key + '">' + esc(c.label) + '</option>'; }).join('') + '</optgroup>';
        html += '<optgroup label="Non-skilled care">' + CARE.filter(function (c) { return c.g === 'nonskilled'; }).map(function (c) { return '<option value="' + c.key + '">' + esc(c.label) + '</option>'; }).join('') + '</optgroup>';
      } else {
        ['li', 'nyc', 'up'].forEach(function (g) {
          html += '<optgroup label="' + GROUPS[g] + '">' + REGIONS.filter(function (r) { return r.g === g; }).map(function (r) { return '<option value="' + r.key + '">' + esc(r.name) + '</option>'; }).join('') + '</optgroup>';
        });
      }
      sel.innerHTML = html;
    });
  }

  /* ------------------------------------------------------------------
     Router
     ------------------------------------------------------------------ */
  var PAGES = ['home', 'how', 'requests', 'families', 'caregivers', 'agencies', 'membership', 'about', 'contact', 'join', 'signin'];
  var NAV_OF = { how: 'how', requests: 'caregivers', families: 'families', caregivers: 'caregivers', membership: 'caregivers', agencies: 'agencies', about: 'about', contact: 'contact' };
  var current = null;
  var onEnter = {};

  function parseHash() {
    var h = (location.hash || '').replace(/^#/, '');
    var parts = h.split('?'), page = parts[0] || 'home', params = {};
    (parts[1] || '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); params[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    if (PAGES.indexOf(page) < 0) page = 'home';
    return { page: page, params: params };
  }

  function route() {
    var r = parseHash();
    var changed = r.page !== current;
    $$('.page').forEach(function (p) { p.classList.toggle('active', p.dataset.page === r.page); });
    var pg = $('.page[data-page="' + r.page + '"]');
    if (pg && pg.dataset.title) document.title = pg.dataset.title;
    $$('.nav-link[data-nav]').forEach(function (a) {
      var on = a.dataset.nav === NAV_OF[r.page];
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $$('.mm-link').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + r.page); });
    closeDropdowns(); closeMobile();
    current = r.page;
    if (changed) window.scrollTo({ top: 0, behavior: 'auto' });
    if (onEnter[r.page]) onEnter[r.page](r.params, changed);
    if (changed) { var m = $('#main'); if (m && document.activeElement && document.activeElement !== document.body && !m.contains(document.activeElement)) m.focus({ preventScroll: true }); }
  }

  /* ------------------------------------------------------------------
     Header, dropdowns, mobile menu
     ------------------------------------------------------------------ */
  var header = $('#siteHeader');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }

  function closeDropdowns(except) {
    $$('.nav-item[data-dd]').forEach(function (it) { if (it !== except) { it.classList.remove('open'); $('.nav-link', it).setAttribute('aria-expanded', 'false'); } });
  }
  function initNav() {
    var hoverable = window.matchMedia('(hover: hover)').matches;
    $$('.nav-item[data-dd]').forEach(function (it) {
      var btn = $('.nav-link', it), timer;
      function open() { clearTimeout(timer); closeDropdowns(it); it.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      function close() { it.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
      btn.addEventListener('click', function (e) { e.stopPropagation(); it.classList.contains('open') ? close() : open(); });
      if (hoverable) {
        it.addEventListener('mouseenter', open);
        it.addEventListener('mouseleave', function () { timer = setTimeout(close, 160); });
      }
      it.addEventListener('keydown', function (e) {
        var links = $$('.dd-link', it), idx = links.indexOf(document.activeElement);
        if (e.key === 'Escape') { close(); btn.focus(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (!it.classList.contains('open')) open(); (links[idx + 1] || links[0]).focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (links[idx - 1] || links[links.length - 1]).focus(); }
      });
      it.addEventListener('focusout', function (e) { if (!it.contains(e.relatedTarget)) close(); });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav-item')) closeDropdowns(); });
  }

  var mm = $('#mobileMenu'), mOpen = $('#menuOpen'), mClose = $('#menuClose');
  function openMobile() { mm.classList.add('open'); mOpen.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; setTimeout(function () { mClose.focus(); }, 50); }
  function closeMobile() { if (!mm.classList.contains('open')) return; mm.classList.remove('open'); mOpen.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  function initMobile() {
    mOpen.addEventListener('click', openMobile);
    mClose.addEventListener('click', function () { closeMobile(); mOpen.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mm.classList.contains('open')) { closeMobile(); mOpen.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024) closeMobile(); });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  function initReveal() {
    var els = $$('.reveal');
    if (REDUCED || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ------------------------------------------------------------------
     Hero audience switch
     ------------------------------------------------------------------ */
  function initHero() {
    var sw = $('#heroSwitch'); if (!sw) return;
    var tabs = $$('button[role="tab"]', sw);
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).classList.toggle('active', on);
      });
      goo(i);
      if (focus) tabs[i].focus();
    }

    /* Liquid indicator: the pill at the old tab drains through a thin neck
       into a new pill that swells at the target, merged by an SVG goo filter. */
    var gooEl = $('.as-goo', sw), A = $('.as-a', sw), B = $('.as-b', sw), N = $('.as-neck', sw);
    var cur = 0, running = [];
    function goo(to) {
      var from = cur; cur = to;
      running.forEach(function (a) { a.cancel(); }); running = [];
      if (from === to) { A.style.setProperty('--i', to); return; }
      if (REDUCED || !A.animate) { A.style.setProperty('--i', to); return; }
      var w = gooEl.clientWidth / 3, dir = to > from ? 1 : -1, span = Math.abs(to - from);
      var dur = 520 + span * 140, ease = 'cubic-bezier(.55,0,.25,1)';
      A.style.setProperty('--i', from); B.style.setProperty('--i', to);
      var lo = Math.min(from, to), hi = Math.max(from, to);
      N.style.left = ((lo + .5) * w) + 'px'; N.style.width = ((hi - lo) * w) + 'px';
      var pull = dir * w * .28;
      running.push(A.animate([
        { transform: 'translateX(0) scale(1, 1)', opacity: 1 },
        { transform: 'translateX(' + pull + 'px) scale(.92, .9)', opacity: 1, offset: .25 },
        { transform: 'translateX(' + pull * 1.6 + 'px) scale(.42, .5)', opacity: 1, offset: .62 },
        { transform: 'translateX(' + pull * 2 + 'px) scale(.1, .2)', opacity: 0 }
      ], { duration: dur, easing: ease, fill: 'forwards' }));
      running.push(B.animate([
        { transform: 'translateX(' + (-pull * 1.4) + 'px) scale(.2, .3)', opacity: 0 },
        { transform: 'translateX(' + (-pull * 1.1) + 'px) scale(.38, .5)', opacity: 1, offset: .22 },
        { transform: 'translateX(' + (-pull * .3) + 'px) scale(1.06, .94)', opacity: 1, offset: .7 },
        { transform: 'translateX(' + (pull * .06) + 'px) scale(.98, 1.03)', opacity: 1, offset: .86 },
        { transform: 'translateX(0) scale(1, 1)', opacity: 1 }
      ], { duration: dur, easing: ease, fill: 'forwards' }));
      running.push(N.animate([
        { transform: 'scale(.05, 1)', transformOrigin: dir > 0 ? 'left center' : 'right center', opacity: 1 },
        { transform: 'scale(1, .8)', transformOrigin: dir > 0 ? 'left center' : 'right center', opacity: 1, offset: .35 },
        { transform: 'scale(1, .25)', transformOrigin: dir > 0 ? 'left center' : 'right center', opacity: 1, offset: .68 },
        { transform: 'scale(.0, .1)', transformOrigin: dir > 0 ? 'right center' : 'left center', opacity: 0 }
      ], { duration: dur, easing: ease, fill: 'forwards' }));
      running[1].onfinish = function () {
        A.style.setProperty('--i', to);
        running.forEach(function (a) { a.cancel(); }); running = [];
      };
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % 3, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i + 2) % 3, true); }
      });
    });
    $$('[data-hero-form]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var care = $('select[data-fill="care"]', f).value, reg = $('select[data-fill="region"]', f).value;
        var q = []; if (care) q.push('care=' + care); if (reg) q.push('region=' + reg);
        var qs = q.length ? '&' + q.join('&') : '';
        var kind = f.dataset.heroForm;
        if (kind === 'need') location.hash = '#join?role=family' + qs;
        else if (kind === 'give') location.hash = '#requests' + (q.length ? '?' + q.join('&') : '');
        else location.hash = '#join?role=agency' + qs;
      });
    });
  }

  /* ------------------------------------------------------------------
     Map
     ------------------------------------------------------------------ */
  var NS = 'http://www.w3.org/2000/svg';
  var mapSvg, inset, state = { vb: null, zoomed: false, selected: null, anim: null };
  var VB_STATE, LABEL_POS = {
    'manhattan': { x: 711.5, y: 702, anchor: 'end', leader: [712.5, 702, 720.5, 705.5] },
    'staten-island': { x: 699, y: 763, anchor: 'middle' },
    'brooklyn': { x: 727, y: 734 },
    'queens': { x: 745, y: 722 },
    'bronx': { x: 737, y: 698 },
    'nassau': { x: 770, y: 718 },
    'suffolk': { x: 862, y: 694 },
    'thousand-islands': { x: 528, y: 150 },
    'hudson-valley': { x: 712, y: 548 },
    'capital-region': { x: 744, y: 360 },
    'central-new-york': { x: 563, y: 372 }
  };
  var ZOOM_KEYS = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten-island', 'nassau', 'suffolk'];
  var CTX_LABELS = [['PENNSYLVANIA', 360, 610], ['NEW JERSEY', 640, 680], ['CONN.', 868, 580], ['MASS.', 900, 450], ['VERMONT', 845, 160]];
  var WATER_LABELS = [['Lake Ontario', 300, 215, 0], ['Lake Erie', 52, 395, -38], ['Long Island Sound', 842, 662, -10]];
  var TINT = { 'adirondacks': 'a', 'finger-lakes': 'a', 'catskills': 'a', 'niagara': 'b', 'central-new-york': 'b', 'hudson-valley': 'b', 'chautauqua-allegheny': 'c', 'thousand-islands': 'c', 'capital-region': 'c' };

  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  function zoomBox() {
    var w = mapSvg.clientWidth;
    var aspect = MAP.h / MAP.w;
    if (w < 600) { var zw = 200; return [674, 722 - zw * aspect / 2 + 4, zw, zw * aspect]; }
    var zw2 = 336; return [667, 706 - zw2 * aspect / 2, zw2, zw2 * aspect];
  }
  function setVB(vb) { state.vb = vb; mapSvg.setAttribute('viewBox', vb.map(function (v) { return v.toFixed(2); }).join(' ')); updateLabels(); }
  function scaleNow() { var w = mapSvg.clientWidth || 800, h = mapSvg.clientHeight || 600; return Math.min(w / state.vb[2], h / state.vb[3]); }

  function animateTo(vb, done) {
    if (state.anim) cancelAnimationFrame(state.anim);
    var from = state.vb.slice(), t0 = null, dur = REDUCED ? 0 : 750;
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = dur ? Math.min(1, (ts - t0) / dur) : 1, e = ease(p);
      setVB(from.map(function (v, i) { return v + (vb[i] - v) * e; }));
      if (p < 1) state.anim = requestAnimationFrame(step); else { state.anim = null; if (done) done(); }
    }
    state.anim = requestAnimationFrame(step);
  }

  function setZoom(z) {
    if (z === state.zoomed) return;
    state.zoomed = z;
    animateTo(z ? zoomBox() : VB_STATE.slice());
    $('#mapBack').hidden = !z;
    $('#mapInset').classList.toggle('gone', z);
    mapSvg.classList.toggle('is-zoomed', z);
    $('#insetFrame').style.opacity = z ? 0 : 1;
    $('#mapCrumbs').innerHTML = icon('map', 'i-sm') + (z ? '<span>New York State</span>' + icon('chev', 'i-sm" style="transform:rotate(-90deg)') + '<strong>NYC &amp; Long Island</strong>' : '<strong>New York State</strong><span>· 16 regions · 62 counties</span>');
  }

  var labelEls = {};
  function updateLabels() {
    if (!mapSvg) return;
    var s = scaleNow(), fs = 12.5 / s, halo = 3.2 / s;
    var vb = state.vb;
    var placed = [];
    var order = REGIONS.slice().sort(function (a, b) { return (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) - (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]); });
    order.forEach(function (r) {
      var L = labelEls[r.key]; if (!L) return;
      var t = L.text;
      t.setAttribute('font-size', fs.toFixed(3)); t.setAttribute('stroke-width', halo.toFixed(3));
      var show;
      var inZoomSet = ZOOM_KEYS.indexOf(r.key) > -1;
      if (state.zoomed) show = inZoomSet; else show = r.g === 'up' || r.key === 'suffolk';
      if (show) {
        // fit test: label must fit inside the region (except manually anchored ones), and not collide
        var w = t.getComputedTextLength() * s, h = 13;
        var rw = (r.bbox[2] - r.bbox[0]) * s;
        var manual = LABEL_POS[r.key] && (LABEL_POS[r.key].leader || r.key === 'staten-island');
        if (!manual && w > rw * 1.02) show = false;
        var x = (Number(t.getAttribute('x')) - vb[0]) * s, y = (Number(t.getAttribute('y')) - vb[1]) * s;
        var anchor = t.getAttribute('text-anchor');
        var x0 = anchor === 'end' ? x - w : anchor === 'middle' || !anchor ? x - w / 2 : x;
        var box = [x0 - 3, y - h, x0 + w + 3, y + 4];
        if (show) {
          for (var i = 0; i < placed.length; i++) { var p = placed[i]; if (box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1]) { show = false; break; } }
        }
        if (show) placed.push(box);
      }
      t.classList.toggle('hidden', !show);
      if (L.line) L.line.classList.toggle('hidden', !show);
    });
  }

  function regionTip(r) { return '<strong>' + esc(r.name) + '</strong>' + esc(r.group) + ' · <span>' + r.counties.length + (r.counties.length === 1 ? ' county' : ' counties') + '</span>'; }
  var tip;
  function showTip(r, x, y) { tip.innerHTML = regionTip(r); tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('show'); }
  function hideTip() { tip.classList.remove('show'); }

  function pulseAt(r) {
    var old = $('#mapPulse'); if (old) old.remove();
    var s = scaleNow(), g = el('g', { id: 'mapPulse' }, mapSvg);
    var p = LABEL_POS[r.key] && !LABEL_POS[r.key].leader && r.key !== 'staten-island' ? null : null;
    var cx = r.c[0], cy = r.c[1];
    var ring = el('circle', { class: 'pulse', cx: cx, cy: cy, r: 4 / s, 'stroke-width': 2 }, g);
    el('circle', { class: 'pulse-core', cx: cx, cy: cy, r: 3.5 / s }, g);
    if (!REDUCED) {
      el('animate', { attributeName: 'r', from: 4 / s, to: 22 / s, dur: '1.6s', repeatCount: 'indefinite' }, ring);
      el('animate', { attributeName: 'opacity', from: 1, to: 0, dur: '1.6s', repeatCount: 'indefinite' }, ring);
    }
    g.dataset.key = r.key;
  }
  function refreshPulse() { var g = $('#mapPulse'); if (g && !state.anim) pulseAt(R[g.dataset.key]); }

  function selectRegion(key, opts) {
    opts = opts || {};
    var r = R[key]; if (!r) return;
    state.selected = key;
    $$('.region', mapSvg).forEach(function (g) { g.classList.toggle('selected', g.dataset.key === key); g.setAttribute('aria-pressed', g.dataset.key === key); });
    $$('.region', inset).forEach(function (g) { g.classList.toggle('selected', g.dataset.key === key); });
    $$('.rl-chip').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.key === key); });
    var wantZoom = r.g !== 'up';
    if (opts.zoom !== false) {
      if (wantZoom && !state.zoomed) setZoom(true);
      else if (!wantZoom && state.zoomed) setZoom(false);
    }
    setTimeout(function () { pulseAt(r); }, state.anim ? 780 : 0);
    renderPanel(r);
  }

  function renderPanel(r) {
    var p = $('#regionPanel');
    if (!r) {
      p.innerHTML = '<div class="rp-head rp-fade"><div class="rp-group"><span class="badge">' + icon('map', 'i-sm') + 'New York State</span></div>' +
        '<h3 class="rp-name">Choose a region</h3><p class="rp-desc">Select any region on the map, open the NYC &amp; Long Island view for the five boroughs, or search the list below.</p></div>' +
        '<div class="rp-body rp-fade"><div class="rp-empty-stats"><div><strong>16</strong><span>regions</span></div><div><strong>62</strong><span>counties</span></div><div><strong>3</strong><span>areas</span></div></div>' +
        '<div class="rp-label">Popular right now</div><div class="rp-counties">' + ['suffolk', 'brooklyn', 'hudson-valley', 'finger-lakes'].map(function (k) { return '<button class="rl-chip" type="button" data-pick="' + k + '">' + esc(R[k].name) + '</button>'; }).join('') + '</div>' +
        '<div class="rp-spacer"></div><div class="rp-actions"><a class="btn btn-accent btn-block" href="#join?role=family">' + icon('heart') + 'Find care</a><a class="btn btn-ghost btn-block" href="#membership">' + icon('steth') + 'Work in a region</a></div>' +
        '<div class="rp-price"><div>Families<strong>Free</strong></div><div>Caregivers<strong>$8.99 / region</strong></div></div></div>';
      $$('[data-pick]', p).forEach(function (b) { b.addEventListener('click', function () { selectRegion(b.dataset.pick); }); });
      return;
    }
    p.innerHTML = '<div class="rp-head rp-fade"><div class="rp-group"><span class="badge badge-sand">' + icon('pin', 'i-sm') + esc(r.group) + '</span><span class="badge badge-line">' + r.counties.length + (r.counties.length === 1 ? ' county' : ' counties') + '</span></div>' +
      '<h3 class="rp-name">' + esc(r.name) + '</h3><p class="rp-desc">' + esc(r.desc) + '</p></div>' +
      '<div class="rp-body rp-fade"><div class="rp-label">' + (r.counties.length === 1 ? 'County' : 'Counties') + '</div><div class="rp-counties">' + r.countyChips.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('') + '</div>' +
      (function () { var n = REQUESTS.filter(function (q) { return q.region === r.key; }).length; return '<div class="rp-reqs">' + icon('lock') + '<div><strong>' + (n ? n + ' open request' + (n === 1 ? '' : 's') : 'No open requests yet') + '</strong><span>' + (n ? 'Details unlock with ' + esc(r.name) + ' Region Access.' : 'Be the first family to post here, free.') + '</span></div>' + (n ? '<a class="link-arrow" href="#requests?region=' + r.key + '">View' + icon('arrow') + '</a>' : '') + '</div>'; })() +
      '<div class="rp-spacer"></div><div class="rp-actions"><a class="btn btn-accent btn-block" href="#join?role=family&region=' + r.key + '">' + icon('heart') + 'Find care here</a><a class="btn btn-ghost btn-block" href="#membership?region=' + r.key + '">' + icon('steth') + 'Work in this region</a></div>' +
      '<div class="rp-price"><div>Families<strong>Free, always</strong></div><div>Caregivers<strong>$8.99 / mo</strong></div></div></div>';
  }

  function buildMap() {
    mapSvg = $('#nyMap'); inset = $('#insetSvg'); tip = $('#mapTip');
    if (!mapSvg || !MAP) return;
    VB_STATE = [0, 0, MAP.w, MAP.h];
    mapSvg.style.aspectRatio = MAP.w + ' / ' + MAP.h;
    var ctx = el('g', { class: 'ctx', 'aria-hidden': 'true' }, mapSvg);
    MAP.ctx.forEach(function (c) { el('path', { class: 'ctx-state', d: c.d }, ctx); });
    WATER_LABELS.forEach(function (w) { var t = el('text', { class: 'water-label', x: w[1], y: w[2], 'text-anchor': 'middle', transform: 'rotate(' + w[3] + ' ' + w[1] + ' ' + w[2] + ')' }, ctx); t.textContent = w[0]; });
    CTX_LABELS.forEach(function (w) { var t = el('text', { class: 'ctx-label', x: w[1], y: w[2], 'text-anchor': 'middle' }, ctx); t.textContent = w[0]; });

    var gReg = el('g', { id: 'mapRegions' }, mapSvg);
    // draw upstate first, then LI and NYC on top so hit areas of small shapes win
    function area(r) { return (r.bbox[2] - r.bbox[0]) * (r.bbox[3] - r.bbox[1]); }
    // smallest shapes last, so their enlarged hit areas win over bigger neighbours
    var drawOrder = REGIONS.filter(function (r) { return r.g === 'up'; }).concat(REGIONS.filter(function (r) { return r.g !== 'up'; }).sort(function (a, b) { return area(b) - area(a); }));
    drawOrder.forEach(function (r, i) {
      var g = el('g', { class: 'region r-anim', 'data-key': r.key, 'data-group': r.g, 'data-tint': TINT[r.key] || '', tabindex: 0, role: 'button', 'aria-pressed': 'false', 'aria-label': r.name + ', ' + r.group + ', ' + r.counties.length + (r.counties.length === 1 ? ' county' : ' counties') }, gReg);
      g.style.transitionDelay = REDUCED ? '0ms' : (i * 55) + 'ms';
      el('path', { class: 'r-fill', d: r.d }, g);
      if (r.g !== 'up') el('path', { class: 'r-hit', d: r.d }, g);
      g.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') showTip(r, e.clientX, e.clientY); });
      g.addEventListener('pointerleave', hideTip);
      g.addEventListener('click', function () { hideTip(); selectRegion(r.key); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRegion(r.key); } });
      g.addEventListener('focus', function () { g.classList.add('hover'); var b = g.getBoundingClientRect(); showTip(r, b.left + b.width / 2, b.top + 4); });
      g.addEventListener('blur', function () { g.classList.remove('hover'); hideTip(); });
    });
    // dashed frame showing what the inset zooms into
    var fb = [688, 684, 300, 76];
    el('rect', { id: 'insetFrame', class: 'inset-frame', x: fb[0], y: fb[1], width: fb[2], height: fb[3], rx: 6 }, mapSvg);

    var gLab = el('g', { class: 'region-labels', 'aria-hidden': 'true' }, mapSvg);
    REGIONS.forEach(function (r) {
      var lp = LABEL_POS[r.key] || {};
      var x = lp.x != null ? lp.x : r.c[0], y = lp.y != null ? lp.y : r.c[1];
      var line = null;
      if (lp.leader) line = el('line', { x1: lp.leader[0], y1: lp.leader[1], x2: lp.leader[2], y2: lp.leader[3] }, gLab);
      var t = el('text', { x: x, y: y, 'text-anchor': lp.anchor || 'middle', 'dominant-baseline': 'middle' }, gLab);
      if (r.g === 'nyc' && !lp.leader && r.key !== 'staten-island') t.classList.add('on-dark');
      t.textContent = r.name;
      labelEls[r.key] = { text: t, line: line };
    });

    // inset (NYC & Long Island), rendered from the same paths
    var ib = [676, 662, 314, 110];
    inset.setAttribute('viewBox', ib.join(' '));
    MAP.ctx.forEach(function (c) { if (c.ab === 'NJ' || c.ab === 'CT') el('path', { class: 'ctx-state', d: c.d }, inset); });
    REGIONS.filter(function (r) { return r.g !== 'up' || r.key === 'hudson-valley'; }).forEach(function (r) {
      var g = el('g', { class: 'region', 'data-key': r.key, 'data-group': r.g, 'data-tint': TINT[r.key] || '' }, inset); el('path', { class: 'r-fill', d: r.d }, g);
    });
    $('#mapInset').addEventListener('click', function () { setZoom(true); });
    $('#mapBack').addEventListener('click', function () { setZoom(false); });

    setVB(VB_STATE.slice());
    renderPanel(null);

    if (REDUCED || !('IntersectionObserver' in window)) mapSvg.classList.add('revealed');
    else {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { mapSvg.classList.add('revealed'); io.disconnect(); setTimeout(function () { $$('.region', mapSvg).forEach(function (g) { g.style.transitionDelay = '0ms'; }); }, 1400); } }, { threshold: 0.25 });
      io.observe(mapSvg);
    }
    var rt;
    function relayout() { clearTimeout(rt); rt = setTimeout(function () { if (!mapSvg.clientWidth) return; if (state.zoomed && !state.anim) setVB(zoomBox()); else updateLabels(); refreshPulse(); }, 80); }
    window.addEventListener('resize', relayout);
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(mapSvg);

    buildRegionList();
  }

  function buildRegionList() {
    var wrap = $('#rlGroups'); if (!wrap) return;
    var colors = { li: 'var(--map-li)', nyc: 'var(--map-nyc)', up: 'var(--map-a)' };
    wrap.innerHTML = ['li', 'nyc', 'up'].map(function (g) {
      return '<div class="rl-group ' + g + '"><h4><i style="background:' + colors[g] + '"></i>' + GROUPS[g] + '</h4><div class="rl-chips">' +
        REGIONS.filter(function (r) { return r.g === g; }).map(function (r) { return '<button class="rl-chip" type="button" aria-pressed="false" data-key="' + r.key + '">' + esc(r.name) + '</button>'; }).join('') + '</div></div>';
    }).join('');
    $$('.rl-chip', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        selectRegion(b.dataset.key);
        var card = $('.map-card'), rect = card.getBoundingClientRect();
        if (rect.top < 60 || rect.bottom > window.innerHeight) card.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
      });
    });
    var input = $('#rlSearch');
    function filter() {
      var q = input.value.trim().toLowerCase(), any = false;
      $$('.rl-chip', wrap).forEach(function (b) {
        var r = R[b.dataset.key];
        var hay = (r.name + ' ' + r.counties.join(' ') + ' ' + (BOROUGH_COUNTY[r.name] || '') + ' ' + r.group).toLowerCase();
        var hit = !q || hay.indexOf(q) > -1; b.classList.toggle('dim', !hit); if (hit) any = true;
      });
      $$('.rl-group', wrap).forEach(function (g) { g.style.display = $$('.rl-chip:not(.dim)', g).length ? '' : 'none'; });
      $('#rlEmpty').style.display = any ? 'none' : 'block';
    }
    input.addEventListener('input', filter);
    var list = $('#regionList'), tg = $('#rlToggle');
    function openList(on) { list.classList.toggle('open', on); tg.setAttribute('aria-expanded', on); $('span', tg).textContent = on ? 'Hide list' : 'Show all 16'; }
    tg.addEventListener('click', function () { openList(!list.classList.contains('open')); });
    input.addEventListener('input', function () { if (input.value.trim()) openList(true); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var f = $('.rl-chip:not(.dim)', wrap); if (f) f.click(); } });
  }

  /* ------------------------------------------------------------------
     How it works (shared by home + how page)
     ------------------------------------------------------------------ */
  var MOCK = {
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
  var STEPS = {
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
  var howCtl = {};
  function initHow() {
    $$('[data-how-wrap]').forEach(function (wrap) {
      var id = wrap.dataset.howWrap;
      wrap.innerHTML = '<div class="how-line" aria-hidden="true"><svg viewBox="0 0 1000 2" preserveAspectRatio="none"><line class="hl-base" x1="0" y1="1" x2="1000" y2="1"/><line class="hl-draw" x1="0" y1="1" x2="1000" y2="1"/></svg></div>' +
        Object.keys(STEPS).map(function (k) {
          return '<div class="how-set" data-set="' + k + '" role="tabpanel">' + STEPS[k].map(function (s, i) {
            return '<div class="how-step"><span class="step-icon">' + icon(s[0]) + '<span class="step-num">' + (i + 1) + '</span></span><h3>' + s[1] + '</h3><p>' + s[2] + '</p><div class="mock">' + MOCK[s[3]] + '</div></div>';
          }).join('') + '</div>';
        }).join('');
      var toggle = $('[data-how-toggle="' + id + '"]');
      var btns = $$('button', toggle);
      function show(k, focus) {
        btns.forEach(function (b) { var on = b.dataset.how === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
        $$('.how-set', wrap).forEach(function (s) { s.classList.toggle('active', s.dataset.set === k); });
        if (wrap.classList.contains('drawn') && !REDUCED) { wrap.classList.remove('drawn'); void wrap.offsetWidth; requestAnimationFrame(function () { wrap.classList.add('drawn'); }); }
      }
      btns.forEach(function (b, i) {
        b.addEventListener('click', function () { show(b.dataset.how); });
        b.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); show(btns[(i + 1) % btns.length].dataset.how, true); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); show(btns[(i + btns.length - 1) % btns.length].dataset.how, true); }
        });
      });
      show('families');
      howCtl[id] = show;
      if (REDUCED || !('IntersectionObserver' in window)) wrap.classList.add('drawn');
      else { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { wrap.classList.add('drawn'); io.disconnect(); } }, { threshold: 0.35 }); io.observe(wrap); }
    });
  }

  /* ------------------------------------------------------------------
     Care tiles, example cards, region cloud
     ------------------------------------------------------------------ */
  function initCareTiles() {
    $$('[data-care-tiles]').forEach(function (wrap) {
      var list = CARE.filter(function (c) { return c.g === wrap.dataset.careTiles; });
      wrap.innerHTML = list.map(function (c, i) {
        var full = list.length % 2 === 1 && i === list.length - 1;
        return '<a class="care-tile' + (full ? ' full' : '') + '" href="#requests?care=' + c.key + '"><span class="icon-square">' + icon(c.icon) + '</span><span><span class="ct-title">' + esc(c.label) + '</span><span class="ct-desc">' + esc(c.desc) + '</span></span><span class="ct-go">' + icon('arrow', 'i-sm') + '</span></a>';
      }).join('');
    });
  }
  function initExamples() {
    var fam = '<article class="ex-card reveal"><span class="ex-flag">Example</span><div class="ex-kind">' + icon('heart') + 'Family request</div>' +
      '<div class="ex-head"><span class="avatar lg">AR</span><div><h3>Care for Dad, 79</h3><div class="ex-meta"><span>' + icon('pin') + 'Patchogue · Suffolk</span><span>' + icon('user') + 'Posted by Ana R.</span></div></div></div>' +
      '<p class="ex-body">Looking for weekday afternoons: companionship plus light mobility support. Dog-friendly home, and Spanish is a plus.</p>' +
      '<div class="ex-tags"><span class="tag">20 hrs / wk</span><span class="tag">Starting Oct</span><span class="tag">Companion + Personal</span></div><div class="ex-spacer"></div>' +
      '<div class="ex-foot"><span style="display:inline-flex;align-items:center;gap:6px">' + icon('lock', 'i-sm') + 'Address never shown</span><span style="display:inline-flex;align-items:center;gap:6px">' + icon('users', 'i-sm') + '4 of 10 free contacts used</span></div></article>';
    var cg = '<article class="ex-card reveal"><span class="ex-flag">Example</span><div class="ex-kind">' + icon('steth') + 'Caregiver profile</div>' +
      '<div class="ex-head"><span class="avatar lg olive">DM</span><div><h3>Denise M., CNA</h3><div class="ex-meta"><span>' + icon('pin') + 'Islip · Suffolk</span><span class="verified">' + icon('shield') + 'Verified</span></div></div></div>' +
      '<p class="ex-body">Eleven years in senior care and post-hospital recovery. References available, and has her own transportation.</p>' +
      '<div class="ex-tags"><span class="tag">From $28 / hr</span><span class="tag">Weekdays</span><span class="tag">Verified</span></div><div class="ex-spacer"></div>' +
      '<div class="ex-foot"><span class="status-pill"><span class="dot dot-available"></span>Available</span><span style="display:inline-flex;align-items:center;gap:6px">' + icon('car', 'i-sm') + 'Own transportation</span></div></article>';
    $$('[data-examples]').forEach(function (w) { w.innerHTML = fam + cg; });
    $$('[data-region-cloud]').forEach(function (w) { w.innerHTML = REGIONS.map(function (r) { return '<span class="chip">' + icon('pin', 'i-sm') + esc(r.name) + '</span>'; }).join(''); });
  }

  /* ------------------------------------------------------------------
     Care requests: filters
     ------------------------------------------------------------------ */
  function initRequests() {
    var tree = $('#careTree'); if (!tree) return;
    tree.innerHTML = [['skilled', 'Skilled Care'], ['nonskilled', 'Non-Skilled Care']].map(function (g) {
      return '<li><div class="tree-row"><label class="check tree-parent"><input type="checkbox" data-parent="' + g[0] + '">' + g[1] + '</label><button type="button" class="tree-toggle" aria-expanded="true" aria-controls="tree-' + g[0] + '" aria-label="Collapse ' + g[1] + '">' + icon('chev') + '</button></div>' +
        '<ul id="tree-' + g[0] + '">' + CARE.filter(function (c) { return c.g === g[0]; }).map(function (c) { return '<li><label class="check"><input type="checkbox" name="care" value="' + c.key + '" data-group="' + g[0] + '">' + esc(c.label) + '</label></li>'; }).join('') + '</ul></li>';
    }).join('');
    $('#schedPickers').innerHTML = SCHED.map(function (s) {
      return '<div class="sched-row" role="group" aria-label="' + s[1] + '"><label class="check"><input type="checkbox" data-sched-parent="' + s[0] + '">' + s[1] + '</label><div class="days">' +
        DAYS.map(function (d, i) { return '<label class="day"><input type="checkbox" name="sched" value="' + s[0] + ':' + i + '" aria-label="' + s[1] + ': ' + DAY_FULL[i] + '"><span>' + d + '</span></label>'; }).join('') + '</div></div>';
    }).join('');

    function syncParents() {
      $$('[data-parent]', tree).forEach(function (p) {
        var kids = $$('input[data-group="' + p.dataset.parent + '"]', tree), n = kids.filter(function (k) { return k.checked; }).length;
        p.checked = n === kids.length; p.indeterminate = n > 0 && n < kids.length;
      });
      $$('[data-sched-parent]').forEach(function (p) {
        var kids = $$('input[name="sched"][value^="' + p.dataset.schedParent + ':"]'), n = kids.filter(function (k) { return k.checked; }).length;
        p.checked = n === kids.length; p.indeterminate = n > 0 && n < kids.length;
      });
    }
    tree.addEventListener('change', function (e) {
      if (e.target.dataset.parent) $$('input[data-group="' + e.target.dataset.parent + '"]', tree).forEach(function (k) { k.checked = e.target.checked; });
      syncParents(); render();
    });
    $$('.tree-toggle', tree).forEach(function (b) { b.addEventListener('click', function () { var ul = $('#' + b.getAttribute('aria-controls')), open = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', !open); ul.hidden = open; }); });
    $('#schedPickers').addEventListener('change', function (e) {
      if (e.target.dataset.schedParent) $$('input[name="sched"][value^="' + e.target.dataset.schedParent + ':"]').forEach(function (k) { k.checked = e.target.checked; });
      syncParents(); render();
    });
    ['#fRegion', '#fRecipient', '#fDuration', '#sortBy'].forEach(function (s) { $(s).addEventListener('change', render); });
    $('#reqQ').addEventListener('input', render);
    $('#reqSearch').addEventListener('submit', function (e) { e.preventDefault(); render(); $('#reqList').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }); });
    $('#filterForm').addEventListener('submit', function (e) { e.preventDefault(); render(); if (window.innerWidth <= 1024) { toggleFilters(false); $('#resCount').scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
    $('#filterReset').addEventListener('click', function () { resetFilters(); render(); });
    function toggleFilters(force) { var f = $('#filters'), open = force != null ? force : !f.classList.contains('open'); f.classList.toggle('open', open); $('#filtersToggle').setAttribute('aria-expanded', open); }
    $('#filtersToggle').addEventListener('click', function () { toggleFilters(); });

    function resetFilters() {
      $$('input[type="checkbox"]', $('#filterForm')).forEach(function (c) { c.checked = false; c.indeterminate = false; });
      ['#fRegion', '#fRecipient', '#fDuration'].forEach(function (s) { $(s).value = ''; });
      $('#reqQ').value = '';
    }

    function getState() {
      return {
        q: $('#reqQ').value.trim().toLowerCase(),
        care: $$('input[name="care"]:checked', tree).map(function (c) { return c.value; }),
        region: $('#fRegion').value, recipient: $('#fRecipient').value, duration: $('#fDuration').value,
        sched: $$('input[name="sched"]:checked').map(function (c) { return c.value; }),
        sort: $('#sortBy').value
      };
    }
    function schedText(r) {
      return SCHED.filter(function (s) { return r.sched[s[0]]; }).map(function (s) {
        var d = r.sched[s[0]]; return s[1] + ': ' + (d.length === 7 ? 'every day' : d.map(function (i) { return DAYS[i]; }).join(', '));
      }).join(' · ');
    }
    function card(r) {
      var reg = R[r.region];
      return '<article class="req-card"><div class="rc-top"><span class="badge badge-ink">' + icon('heart', 'i-sm') + 'Family request</span><span class="rc-date">Added on ' + fmtDate(r.added) + '</span></div>' +
        '<div class="rc-locked"><div class="rc-blur" aria-hidden="true"><h3>' + esc(r.title) + '</h3><p>' + esc(r.text) + '</p></div><span class="rc-lock-badge">' + icon('lock') + 'Unlock ' + esc(reg.name) + ' to read</span><span class="sr-only">Title and description are hidden until the ' + esc(reg.name) + ' region is unlocked.</span></div>' +
        '<div class="rc-fields">' +
        '<div class="rc-field wide"><div class="k">' + icon('heart') + 'Care types</div><div class="v">' + r.care.map(function (k) { return esc(CARE_BY[k].short); }).join(', ') + '</div></div>' +
        '<div class="rc-field"><div class="k">' + icon('pin') + 'Region</div><div class="v">' + esc(reg.name) + '</div></div>' +
        '<div class="rc-field wide"><div class="k">' + icon('cal') + 'Schedule</div><div class="v">' + esc(schedText(r)) + '</div></div>' +
        '<div class="rc-field"><div class="k">' + icon('user') + 'Recipient</div><div class="v">' + esc(r.recipient) + '</div></div>' +
        '<div class="rc-field"><div class="k">' + icon('clock') + 'Starting</div><div class="v">' + fmtDate(r.start) + '</div></div>' +
        '<div class="rc-field"><div class="k">' + icon('hourglass') + 'Duration</div><div class="v">' + esc(r.duration) + '</div></div>' +
        '<div class="rc-field"><div class="k">' + icon('clock') + 'Hours</div><div class="v">' + (r.hours ? r.hours + ' hrs / wk' : 'Live-in') + '</div></div>' +
        '</div><div class="rc-foot"><span class="rc-note">$8.99/mo · cancel anytime · every region free for 14 days</span><a class="btn btn-accent btn-sm" href="#membership?region=' + reg.key + '">' + icon('unlock') + 'Unlock ' + esc(reg.name) + ' · $8.99/mo</a></div></article>';
    }
    function render() {
      var s = getState();
      var list = REQUESTS.filter(function (r) {
        if (s.q) { var hay = (r.title + ' ' + r.text + ' ' + r.town + ' ' + R[r.region].name + ' ' + r.care.map(function (k) { return CARE_BY[k].label; }).join(' ') + ' ' + r.recipient + ' ' + r.duration + ' ' + schedText(r)).toLowerCase(); if (hay.indexOf(s.q) < 0) return false; }
        if (s.care.length && !r.care.some(function (k) { return s.care.indexOf(k) > -1; })) return false;
        if (s.region && r.region !== s.region) return false;
        if (s.recipient && r.recipient !== s.recipient) return false;
        if (s.duration && r.duration !== s.duration) return false;
        if (s.sched.length && !s.sched.some(function (v) { var p = v.split(':'); return r.sched[p[0]] && r.sched[p[0]].indexOf(+p[1]) > -1; })) return false;
        return true;
      });
      list.sort(function (a, b) { return s.sort === 'old' ? a.added.localeCompare(b.added) : s.sort === 'start' ? a.start.localeCompare(b.start) : b.added.localeCompare(a.added); });
      $('#resCount').innerHTML = list.length ? 'Showing 1–' + list.length + ' of ' + list.length + ' <span>' + (list.length === 1 ? 'result' : 'results') + '</span>' : 'No results <span>for these filters</span>';
      $('#reqList').innerHTML = list.length ? list.map(card).join('') : '<div class="no-results"><span class="icon-circle lg">' + icon('search', 'i-lg') + '</span><h3>No requests match yet</h3><p>Try fewer filters, or a different region. New family requests are posted every day.</p><button class="btn btn-ghost" type="button" id="nrReset" style="margin-top:24px">Clear all filters</button></div>';
      var nr = $('#nrReset'); if (nr) nr.addEventListener('click', function () { resetFilters(); render(); });
      // active filter chips
      var chips = [];
      if (s.q) chips.push(['q', '“' + s.q + '”']);
      s.care.forEach(function (k) { chips.push(['care:' + k, CARE_BY[k].short]); });
      if (s.region) chips.push(['region', R[s.region].name]);
      if (s.recipient) chips.push(['recipient', s.recipient]);
      if (s.duration) chips.push(['duration', s.duration]);
      s.sched.forEach(function (v) { var p = v.split(':'); chips.push(['sched:' + v, SCHED.filter(function (x) { return x[0] === p[0]; })[0][1] + ' ' + DAYS[+p[1]]]); });
      $('#activeFilters').innerHTML = chips.map(function (c) { return '<button class="af-chip" type="button" data-rm="' + esc(c[0]) + '" aria-label="Remove filter ' + esc(c[1]) + '">' + esc(c[1]) + icon('x') + '</button>'; }).join('');
      $$('.af-chip').forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.dataset.rm;
          if (k === 'q') $('#reqQ').value = '';
          else if (k.indexOf('care:') === 0) $('input[name="care"][value="' + k.slice(5) + '"]').checked = false;
          else if (k.indexOf('sched:') === 0) $('input[name="sched"][value="' + k.slice(6) + '"]').checked = false;
          else $('#f' + k.charAt(0).toUpperCase() + k.slice(1)).value = '';
          syncParents(); render();
        });
      });
    }
    onEnter.requests = function (params, changed) {
      if (params.care || params.region || params.q) {
        resetFilters();
        (params.care || '').split(',').forEach(function (k) { var c = $('input[name="care"][value="' + k + '"]'); if (c) c.checked = true; });
        if (params.region && R[params.region]) $('#fRegion').value = params.region;
        if (params.q) $('#reqQ').value = params.q;
        syncParents();
      }
      render();
    };
    render();
  }

  /* ------------------------------------------------------------------
     Membership
     ------------------------------------------------------------------ */
  function initMembership() {
    var wrap = $('#memRegions'); if (!wrap) return;
    var sel = store('k4l-regions') || [];
    sel = sel.filter(function (k) { return R[k]; });
    var trialCode = false;
    wrap.innerHTML = ['li', 'nyc', 'up'].map(function (g) {
      return '<div class="mem-group"><div class="mem-group-head"><h3>' + GROUPS[g] + '</h3><button type="button" data-addgroup="' + g + '">Add all ' + REGIONS.filter(function (r) { return r.g === g; }).length + '</button></div><div class="mem-cards">' +
        REGIONS.filter(function (r) { return r.g === g; }).map(function (r) {
          return '<article class="mem-card" data-key="' + r.key + '" id="mem-' + r.key + '"><div class="mc-top"><div><h4>' + esc(r.name.replace(/ Region$/, '')) + ' Region Access</h4><div class="mc-counties">' + esc(r.countyChips.join(', ')) + '</div></div><div class="mc-price">$8.99 <small>/ mo</small></div></div>' +
            '<p>Open and reply to every family care request posted in the ' + esc(r.name) + ' region. Cancel anytime, and add more regions whenever you like.</p>' +
            '<button class="mem-toggle" type="button" aria-pressed="false" data-toggle="' + r.key + '" aria-label="Add ' + esc(r.name) + ' region">' + icon('plus') + '<span>Add region</span></button></article>';
        }).join('') + '</div></div>';
    }).join('');

    function render() {
      $$('.mem-card', wrap).forEach(function (c) {
        var on = sel.indexOf(c.dataset.key) > -1, b = $('.mem-toggle', c), name = R[c.dataset.key].name;
        c.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
        b.innerHTML = icon(on ? 'check' : 'plus') + '<span>' + (on ? 'Added' : 'Add region') + '</span>';
        b.setAttribute('aria-label', (on ? 'Remove ' : 'Add ') + name + ' region');
      });
      var n = sel.length, total = n * PRICE_CG;
      $('#sumCount').textContent = n + ' selected';
      $('#sumList').innerHTML = n ? REGIONS.filter(function (r) { return sel.indexOf(r.key) > -1; }).map(function (r) {
        return '<li><span>' + esc(r.name) + '</span><span style="display:flex;align-items:center;gap:8px"><span>$8.99</span><button type="button" data-rm="' + r.key + '" aria-label="Remove ' + esc(r.name) + '">' + icon('x') + '</button></span></li>';
      }).join('') : '<li class="sum-empty">No regions yet. Add the regions you work in.</li>';
      $('#sumCalc').textContent = n + ' × $8.99';
      $('#sumSub').textContent = money(total);
      $('#sumTotal').innerHTML = money(total) + ' <small>/ mo</small>';
      $('#selectAll').textContent = n === REGIONS.length ? 'Clear all regions' : 'Add all 16 regions';
      $$('[data-addgroup]', wrap).forEach(function (b) {
        var keys = REGIONS.filter(function (r) { return r.g === b.dataset.addgroup; }).map(function (r) { return r.key; });
        var all = keys.every(function (k) { return sel.indexOf(k) > -1; });
        b.textContent = all ? 'Remove all' : 'Add all ' + keys.length;
      });
      store('k4l-regions', sel);
    }
    function toggle(k, on) { var i = sel.indexOf(k); if (on == null) on = i < 0; if (on && i < 0) sel.push(k); if (!on && i > -1) sel.splice(i, 1); }
    wrap.addEventListener('click', function (e) {
      var t = e.target.closest('[data-toggle]'); if (t) { toggle(t.dataset.toggle); render(); return; }
      var g = e.target.closest('[data-addgroup]');
      if (g) { var keys = REGIONS.filter(function (r) { return r.g === g.dataset.addgroup; }).map(function (r) { return r.key; }); var all = keys.every(function (k) { return sel.indexOf(k) > -1; }); keys.forEach(function (k) { toggle(k, !all); }); render(); }
    });
    $('#sumList').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) { toggle(b.dataset.rm, false); render(); } });
    $('#selectAll').addEventListener('click', function () { var all = sel.length === REGIONS.length; sel = all ? [] : REGIONS.map(function (r) { return r.key; }); render(); });
    $('#trialForm').addEventListener('submit', function (e) {
      e.preventDefault(); var v = $('#trialCode').value.trim();
      if (!v) { toast('Enter a trial code', 'Codes look like K4L-TRIAL. This is a demo, so any code works.'); return; }
      trialCode = true; $('#sumTrialText').textContent = 'Trial code ' + v.toUpperCase() + ' applied: every region is free for 14 days.'; toast('Trial code applied', 'Every region is free for 14 days.');
    });
    $('#startTrial').addEventListener('click', function () {
      var n = sel.length;
      toast('Demo: 14-day trial started', n ? 'After the trial you’ll keep ' + n + (n === 1 ? ' region' : ' regions') + ' for ' + money(n * PRICE_CG) + ' a month.' : 'You have every region for 14 days. Pick the ones to keep any time.');
    });
    onEnter.membership = function (params) {
      if (params.region && R[params.region]) {
        toggle(params.region, true); render();
        var c = $('#mem-' + params.region);
        if (c) setTimeout(function () { c.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }); }, 60);
      }
    };
    render();
  }

  /* ------------------------------------------------------------------
     Join / Sign in / forms
     ------------------------------------------------------------------ */
  var ROLE_COPY = {
    family: { title: 'Family account', sub: 'Post a free care request and hear from verified caregivers in your region.', btn: 'Create family account',
      aside: '<h3>Free for families, always</h3><ul><li>' + icon('check') + 'One free care request every 2 weeks</li><li>' + icon('check') + 'Message 10 caregivers per post, free</li><li>' + icon('check') + '10 more contacts for $8.99, if you need them</li><li>' + icon('check') + 'Replies from caregivers are always free</li></ul>' },
    caregiver: { title: 'Nurse or caregiver profile', sub: 'Build your profile, get verified and start replying to families.', btn: 'Create profile & start trial',
      aside: '<h3>14 days free, every region</h3><ul><li>' + icon('check') + 'Then $8.99 a month per region</li><li>' + icon('check') + 'All regions in one monthly charge</li><li>' + icon('check') + 'Choose Available or Fill-in status</li><li>' + icon('check') + 'No contracts, cancel anytime</li></ul>' },
    agency: { title: 'Agency or facility profile', sub: 'Verify your business, choose your regions, then post jobs and recruit.', btn: 'Create agency profile',
      aside: '<h3>Agency Access</h3><ul><li>' + icon('check') + '$49.99 a month per region</li><li>' + icon('check') + 'Unlimited job posts and messaging</li><li>' + icon('check') + 'Verified with EIN, website and contact</li><li>' + icon('eye-off') + 'Family requests are not visible to agencies</li></ul>' }
  };
  function regionChips(prefix) {
    return REGIONS.map(function (r) { return '<label class="chk-chip"><input type="checkbox" name="' + prefix + 'reg" value="' + r.key + '"><span>' + esc(r.name) + '</span></label>'; }).join('');
  }
  function initJoin() {
    var form = $('#joinForm'); if (!form) return;
    $$('[data-region-chips]').forEach(function (w) { w.innerHTML = regionChips(w.dataset.regionChips); });
    var REQ = { family: ['#fCity', '#fZip', '#fReg'], caregiver: ['#gCred'], agency: ['#aBiz', '#aEin', '#aWeb', '#aContact'] };
    function setRole(role) {
      if (!ROLE_COPY[role]) role = 'family';
      $$('input[name="role"]').forEach(function (r) { r.checked = r.value === role; });
      $$('.role-fields', form).forEach(function (f) {
        var on = f.dataset.role === role; f.classList.toggle('active', on);
        $$('input,select,textarea', f).forEach(function (i) { i.disabled = !on; });
      });
      Object.keys(REQ).forEach(function (k) { REQ[k].forEach(function (s) { $(s).required = k === role; }); });
      var c = ROLE_COPY[role];
      $('#joinTitle').textContent = c.title; $('#joinSub').textContent = c.sub; $('#joinSubmit').textContent = c.btn; $('#joinAsideMain').innerHTML = c.aside;
    }
    $$('input[name="role"]').forEach(function (r) { r.addEventListener('change', function () { setRole(r.value); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('input,select,textarea', form).filter(function (i) { return !i.disabled && !i.checkValidity(); });
      $$('.input,.select', form).forEach(function (i) { i.style.borderColor = ''; });
      if (bad.length) { bad.forEach(function (i) { if (i.classList.contains('input') || i.classList.contains('select')) i.style.borderColor = 'var(--rust)'; }); bad[0].focus(); toast('A few details are missing', 'Please fill in the highlighted fields and accept the terms.'); return; }
      var role = $('input[name="role"]:checked').value;
      toast('Demo: account created', role === 'family' ? 'Next you’d write your first care request.' : role === 'caregiver' ? 'Next you’d upload your license or ID for review.' : 'Next we’d review your EIN, website and contact.');
      form.reset(); setRole(role);
    });
    onEnter.join = function (params) {
      setRole(params.role || ($('input[name="role"]:checked') || {}).value || 'family');
      if (params.region && R[params.region]) {
        var fr = $('#fReg'); if (fr) fr.value = params.region;
        $$('input[value="' + params.region + '"]', form).forEach(function (c) { c.checked = true; });
      }
      if (params.care && CARE_BY[params.care]) { var fc = $('#fCare'); if (fc) fc.value = params.care; }
    };
    setRole('family');
  }
  function initForms() {
    $$('[data-pw]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = $('#' + b.dataset.pw), show = i.type === 'password'; i.type = show ? 'text' : 'password';
        b.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); $('use', b).setAttribute('href', show ? '#i-eye-off' : '#i-eye');
      });
    });
    var fl = $('#forgotLink');
    fl.addEventListener('click', function (e) { e.preventDefault(); var p = $('#forgotPanel'), open = !p.classList.contains('open'); p.classList.toggle('open', open); fl.setAttribute('aria-expanded', open); if (open) $('#fpEmail').focus(); });
    $('#fpSend').addEventListener('click', function () { var v = $('#fpEmail'); if (!v.value || !v.checkValidity()) { v.focus(); toast('Enter your email', 'We’ll send the reset link there.'); return; } toast('Demo: reset link sent', 'Check your inbox for a link to reset your password.'); $('#forgotPanel').classList.remove('open'); });
    $('#signinForm').addEventListener('submit', function (e) { e.preventDefault(); var em = $('#sEmail'), pw = $('#sPw'); if (!em.value || !pw.value) { (em.value ? pw : em).focus(); toast('Enter your email and password'); return; } toast('Demo: signed in', 'There are no real accounts yet.'); });
    $('#contactForm').addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target, bad = $$('[required]', f).filter(function (i) { return !i.checkValidity(); });
      if (bad.length) { bad[0].focus(); toast('Please complete the form', 'Name, a valid email and a message are needed.'); return; }
      toast('Message sent (demo)', 'Thanks! A member of the team would reply within one business day.'); f.reset();
    });
    $('#footerForm').addEventListener('submit', function (e) { e.preventDefault(); var i = $('#ftEmail'); if (!i.value || !i.checkValidity()) { i.focus(); toast('Enter a valid email'); return; } toast('You’re on the list (demo)', 'Occasional updates only. Unsubscribe anytime.'); i.value = ''; });
  }

  /* ------------------------------------------------------------------
     Page hooks
     ------------------------------------------------------------------ */
  onEnter.how = function (params) { if (params.aud && howCtl.how) howCtl.how(params.aud); };
  onEnter.agencies = function (params) { if (params.s === 'pricing') setTimeout(function () { var t = $('#agency-pricing'); if (t) t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); }, 60); };

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------
     Theme: palette (olive | forest) × mode (light | dark), bottom-right dock
     ------------------------------------------------------------------ */
  var LOGOS = { olive: '/*__LOGO_OLIVE__*/', forest: '/*__LOGO_FOREST__*/' };
  var THEME_COLOR = { 'olive-light': '#FEFAE0', 'olive-dark': '#11160A', 'forest-light': '#F2F7F3', 'forest-dark': '#010F0A' };
  var root = document.documentElement;
  function applyTheme(p, m) {
    root.setAttribute('data-palette', p); root.setAttribute('data-mode', m);
    $$('.brand img, img[data-logo]').forEach(function (i) { i.src = LOGOS[p]; });
    var mt = $('meta[name="theme-color"]'); if (mt) mt.setAttribute('content', THEME_COLOR[p + '-' + m]);
    var bp = $('#tdPalette'), bm = $('#tdMode');
    if (bp) { bp.setAttribute('aria-checked', p === 'forest'); }
    if (bm) { bm.setAttribute('aria-checked', m === 'dark'); }
    try { localStorage.setItem('k4l-theme', JSON.stringify({ p: p, m: m })); } catch (e) {}
  }
  function switchTheme(p, m, btn) {
    var go = function () { applyTheme(p, m); };
    if (REDUCED) return go();
    if (document.startViewTransition) {
      var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var vt = document.startViewTransition(go);
      vt.ready.then(function () {
        root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 750, easing: 'cubic-bezier(.65,0,.25,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
      return;
    }
    root.classList.add('theme-fade'); go();
    setTimeout(function () { root.classList.remove('theme-fade'); }, 500);
  }
  function initTheme() {
    var p = root.getAttribute('data-palette') === 'forest' ? 'forest' : 'olive';
    var m = root.getAttribute('data-mode') === 'dark' ? 'dark' : 'light';
    applyTheme(p, m);
    var bp = $('#tdPalette'), bm = $('#tdMode'), dock = $('#themeDock'), fab = $('#tdFab');
    if (fab) {
      fab.addEventListener('click', function (e) { e.stopPropagation(); var on = !dock.classList.contains('open'); dock.classList.toggle('open', on); fab.setAttribute('aria-expanded', on); });
      document.addEventListener('click', function (e) { if (!dock.contains(e.target)) { dock.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); } });
    }
    if (bp) bp.addEventListener('click', function () {
      switchTheme(root.getAttribute('data-palette') === 'forest' ? 'olive' : 'forest', root.getAttribute('data-mode'), bp);
    });
    if (bm) bm.addEventListener('click', function () {
      switchTheme(root.getAttribute('data-palette'), root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark', bm);
    });
  }

  /* Ripple from the press point on every .btn */
  function initRipple() {
    if (REDUCED) return;
    document.addEventListener('pointerdown', function (e) {
      var b = e.target.closest && e.target.closest('.btn'); if (!b) return;
      var r = b.getBoundingClientRect(), d = Math.hypot(r.width, r.height) * 2;
      var s = document.createElement('span'); s.className = 'rp';
      s.style.width = s.style.height = d + 'px';
      s.style.left = (e.clientX - r.left - d / 2) + 'px'; s.style.top = (e.clientY - r.top - d / 2) + 'px';
      b.appendChild(s); setTimeout(function () { s.remove(); }, 650);
    });
  }

  function boot() {
    initTheme(); initRipple();
    fillSelects();
    initNav(); initMobile(); initHero();
    initCareTiles(); initExamples(); initHow();
    buildMap(); initRequests(); initMembership(); initJoin(); initForms();
    $('.skip-link').addEventListener('click', function (e) { e.preventDefault(); $('#main').focus(); });
    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    route();
    initReveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

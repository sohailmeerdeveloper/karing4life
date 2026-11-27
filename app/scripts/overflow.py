"""Horizontal-overflow audit of every public and portal page at several widths.
Signs in with the demo login, then reports pages whose content is wider than the
viewport and the outermost elements that stick out.
Usage: py scripts/overflow.py [BASE_URL] [widths, e.g. 320,390]"""
import os, sys
from playwright.sync_api import sync_playwright

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
widths = [int(w) for w in (sys.argv[2] if len(sys.argv) > 2 else "320,360,390,768,1024,1440").split(",")]
PW = os.environ.get("K4L_DEMO_PASSWORD", "Karing4Life-Demo-2026")

PUBLIC = ["/", "/families", "/caregivers", "/agencies", "/how", "/about", "/contact", "/faq", "/pricing",
          "/membership", "/kommunity", "/requests", "/signin", "/join", "/join?role=family", "/terms", "/privacy", "/refunds"]
PORTAL = {
    "family": ["", "requests", "requests/new", "find", "saved", "messages", "verification", "billing", "notifications", "settings", "help"],
    "caregiver": ["", "posts", "messages", "profile", "regions", "verification", "billing"],
    "agency": ["", "jobs", "jobs/new", "find", "company", "regions", "verification", "billing"],
    "admin": ["", "users", "verification", "reports", "posts", "inbox", "revenue", "catalog", "kommunity", "logs", "platform"],
}

AUDIT = """() => {
  const vw = document.documentElement.clientWidth, out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (!r.width || r.right <= vw + 1) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.visibility === 'hidden' || el.closest('[aria-hidden=true]')) continue;
    // skip things inside a horizontal scroller (intentional); things clipped by an overflow:hidden
    // ancestor only count when they hold text or controls (that content is cut off)
    let p = el.parentElement, skip = false;
    const content = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL)$/.test(el.tagName) || [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    while (p && p !== document.documentElement) {
      const s = getComputedStyle(p);
      const inView = p.getBoundingClientRect().right <= vw + 1;
      if (/(auto|scroll)/.test(s.overflowX) && inView) { skip = true; break; }
      if (/(hidden|clip)/.test(s.overflowX) && inView && !content) { skip = true; break; }
      p = p.parentElement;
    }
    if (skip) continue;
    // report only the outermost offender
    if (out.some(o => o.el.contains(el))) continue;
    out.push({ el, d: Math.round(r.right - vw) });
  }
  const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).slice(0, 3).join('.') : '');
  return { sw: document.documentElement.scrollWidth, vw, items: out.slice(0, 6).map(o => name(o.el) + ' +' + o.d + 'px') };
}"""

def sweep(pg, urls, w, label):
    bad = 0
    for u in urls:
        for attempt in range(3):
            try:
                pg.goto(base + u); pg.wait_for_timeout(1300)
                pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
                r = pg.evaluate(AUDIT); break
            except Exception:
                pg.wait_for_timeout(1500)
        else:
            print(f"  [{w}] {u}  could not load"); continue
        if r["items"] or r["sw"] > r["vw"] + 1:
            bad += 1
            print(f"  [{w}] {u}  scrollWidth {r['sw']} / {r['vw']}  -> {'; '.join(r['items'])}")
    return bad

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    total = 0
    for w in widths:
        ctx = b.new_context(viewport={"width": w, "height": 800}, has_touch=w < 1024, is_mobile=w < 768)
        ctx.add_init_script("sessionStorage.setItem('k4l-popup-closed','1'); try{for(const r of ['family','caregiver','agency','admin'])localStorage.setItem('k4l-guide-'+r,'1')}catch(e){}")
        pg = ctx.new_page()
        total += sweep(pg, PUBLIC, w, "public")
        pg.goto(base + "/signin"); pg.wait_for_timeout(800)
        pg.fill("#sEmail", "demo@karing4life.com"); pg.fill("#sPw", PW)
        pg.click("form button[type=submit]"); pg.wait_for_url("**/portal/**", timeout=15000)
        for role, paths in PORTAL.items():
            total += sweep(pg, [f"/portal/{role}/{x}".rstrip("/") for x in paths], w, role)
        # first message thread
        pg.goto(base + "/portal/family/messages"); pg.wait_for_timeout(1500)
        a = pg.query_selector("a[href*='/messages/']")
        if a:
            total += sweep(pg, [a.get_attribute("href")], w, "thread")
        ctx.close()
    b.close()
print(f"\n{total} page/width combinations overflow")

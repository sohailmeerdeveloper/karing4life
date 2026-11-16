"""Check that every section's main block fits its window, plus overflow and console errors.
Usage: py scripts/fitcheck.py [BASE_URL] [WxH ...]
  For .stage / .screen blocks it compares the content height with the window height (viewport - header).
  .flow sections (long lists/forms) are skipped.
"""
import sys
from playwright.sync_api import sync_playwright

args = sys.argv[1:]
base = args.pop(0) if args and args[0].startswith("http") else "http://localhost:5173"
sizes = [tuple(int(v) for v in a.split("x")) for a in args] or [(1440, 900)]
PAGES = ["/", "/how", "/requests", "/families", "/caregivers", "/membership", "/agencies", "/about", "/contact", "/join", "/signin"]
JS = """() => {
  const out = [];
  document.querySelectorAll('.page > section:not(.flow)').forEach(el => {
    const cs = getComputedStyle(el);
    const kids = [...el.children].filter(c => getComputedStyle(c).position !== 'absolute');
    if (!kids.length) return;
    // heading + content together, including the gap between them
    let h = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top;
    const win = el.getBoundingClientRect().height;
    const sec = el.closest('section');
    const id = (sec.getAttribute('aria-labelledby') || sec.getAttribute('aria-label') || sec.className).slice(0, 26);
    out.push([id, Math.round(h), Math.round(win), Math.round(parseFloat(cs.minHeight) || parseFloat(cs.height))]);
  });
  // inner scrollbars that shouldn't exist
  const scrollers = [...document.querySelectorAll('.region-panel')].filter(e => e.scrollHeight > e.clientHeight + 1).map(e => 'region-panel ' + e.scrollHeight + '>' + e.clientHeight);
  return { out, sw: document.documentElement.scrollWidth, W: document.documentElement.clientWidth, scrollers };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for w, h in sizes:
        pg = b.new_page(viewport={"width": w, "height": h})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None)
        over, notes = [], []
        for path in PAGES:
            pg.goto(base + path); pg.wait_for_timeout(700)
            pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
            r = pg.evaluate(JS)
            for sid, ch, win, mh in r["out"]:
                if ch > win + 2 or ch > mh + 2:
                    over.append(f"{path}:{sid} {ch}>{mh}")
            if r["sw"] > r["W"]: notes.append(f"{path} horizontal overflow {r['sw']}>{r['W']}")
            notes += [f"{path} {s}" for s in r["scrollers"]]
        print(f"{w}x{h}: {len(over)} too tall: " + ("; ".join(over) or "none"))
        for n in notes: print("   ", n)
        if errs: print("   console errors:", errs[:6])
        pg.close()
    b.close()

"""Full-page screenshots of every route at given widths, plus console errors and overflow checks.
Usage: py shoot.py OUTDIR [width ...] [--pages a,b,c]
"""
import sys, pathlib, json
from playwright.sync_api import sync_playwright

out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
args = sys.argv[2:]
pages = "home,how,requests,families,caregivers,membership,agencies,about,contact,join,signin".split(",")
if "--pages" in args:
    i = args.index("--pages"); pages = args[i + 1].split(","); args = args[:i] + args[i + 2:]
widths = [int(a) for a in args] or [1440, 390]
URL = "http://localhost:8765/Karing4Life.html"

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for w in widths:
        ctx = b.new_context(viewport={"width": w, "height": 900}, device_scale_factor=1)
        pg = ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL + "#home"); pg.wait_for_timeout(600)
        for name in pages:
            pg.evaluate(f"location.hash = '#{name}'")
            pg.wait_for_timeout(350)
            pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')); var m=document.getElementById('nyMap'); if(m) m.classList.add('revealed'); document.querySelectorAll('.how-wrap').forEach(e=>e.classList.add('drawn'))")
            pg.wait_for_timeout(700)
            ov = pg.evaluate("""() => { const W = document.documentElement.clientWidth; const bad = [];
              document.querySelectorAll('.page.active *, header *, footer *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed') { bad.push((e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ' ' + Math.round(r.left) + '-' + Math.round(r.right)); } });
              return {sw: document.documentElement.scrollWidth, W, bad: bad.slice(0, 8)}; }""")
            pg.screenshot(path=str(out / f"{name}-{w}.png"), full_page=True)
            print(w, name, "scrollW", ov["sw"], "W", ov["W"], ("OVERFLOW " + json.dumps(ov["bad"])) if ov["bad"] else "")
        if errs: print("CONSOLE ERRORS", w, errs[:10])
        ctx.close()
    b.close()

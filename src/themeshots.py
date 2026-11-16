"""Viewport screenshots of key sections in all four themes, liquid-switch frames and checks.
Usage: py themeshots.py OUTDIR
"""
import sys, pathlib
from playwright.sync_api import sync_playwright

out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8765/Karing4Life.html"
THEMES = [("olive", "light"), ("olive", "dark"), ("forest", "light"), ("forest", "dark")]

def set_theme(pg, p, m):
    pg.evaluate(f"localStorage.setItem('k4l-theme', JSON.stringify({{p:'{p}', m:'{m}'}}))")

with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome")
    errs = []
    for w, h in ((1440, 900), (390, 844)):
        ctx = b.new_context(viewport={"width": w, "height": h})
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(URL + "#home"); pg.wait_for_timeout(300)
        for p, m in THEMES:
            set_theme(pg, p, m)
            pg.goto(URL + "#home"); pg.reload(); pg.wait_for_timeout(700); pg.evaluate("scrollTo({top:0,behavior:'instant'})"); pg.wait_for_timeout(300)
            tag = f"{p}-{m}-{w}"
            pg.screenshot(path=str(out / f"hero-{tag}.png"))
            if w == 1440:
                for sel, nm in (("#map-section", "map"), ("[aria-labelledby='who-title']", "who"), (".cta-band", "cta")):
                    pg.evaluate(f"document.querySelector(\"{sel}\").scrollIntoView({{behavior:'instant'}}); document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')); var mm=document.getElementById('nyMap'); if(mm) mm.classList.add('revealed');")
                    pg.wait_for_timeout(500)
                    pg.screenshot(path=str(out / f"{nm}-{tag}.png"))
                pg.evaluate("document.querySelector('.site-footer').scrollIntoView({behavior:'instant'})"); pg.wait_for_timeout(300)
                pg.screenshot(path=str(out / f"footer-{tag}.png"))
        # liquid frames (forest light, desktop only)
        if w == 1440:
            set_theme(pg, "forest", "light"); pg.goto(URL + "#home"); pg.reload(); pg.wait_for_timeout(700); pg.evaluate("scrollTo({top:0,behavior:'instant'})"); pg.wait_for_timeout(300)
            box = pg.locator("#heroSwitch").bounding_box()
            clip = {"x": box["x"] - 10, "y": box["y"] - 10, "width": box["width"] + 20, "height": box["height"] + 20}
            pg.click("#tab-hire")
            for i, t in enumerate((60, 120, 120, 120, 150, 400)):
                pg.wait_for_timeout(t)
                pg.screenshot(path=str(out / f"goo-{i}.png"), clip=clip)
            print("selected:", pg.get_attribute("#tab-hire", "aria-selected"), "pane:", pg.is_visible("#pane-hire button[type=submit]"))
            # dock toggles
            pg.click("#tdMode"); pg.wait_for_timeout(900)
            print("after mode click:", pg.evaluate("document.documentElement.dataset.palette + '/' + document.documentElement.dataset.mode"))
            pg.click("#tdPalette"); pg.wait_for_timeout(900)
            print("after palette click:", pg.evaluate("document.documentElement.dataset.palette + '/' + document.documentElement.dataset.mode"),
                  "logo forest?", pg.evaluate("document.querySelector('.brand img').src.length"))
            dock = pg.locator("#themeDock").bounding_box()
            pg.screenshot(path=str(out / "dock.png"), clip={"x": dock["x"] - 30, "y": dock["y"] - 30, "width": dock["width"] + 40, "height": dock["height"] + 40})
        sw = pg.evaluate("document.documentElement.scrollWidth")
        print(w, "scrollWidth", sw)
        ctx.close()
    print("errors:", errs)
    b.close()

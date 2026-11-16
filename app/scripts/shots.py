"""Viewport screenshots of the home sections (and a selected map region) per theme.
Usage: py scripts/shots.py OUTDIR [BASE_URL] [palette-mode ...]   e.g. olive-light forest-dark
"""
import sys, pathlib
from playwright.sync_api import sync_playwright

out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
base = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2].startswith("http") else "http://localhost:5173"
themes = [a.split("-") for a in sys.argv[2:] if "-" in a and not a.startswith("http")] or [["olive", "light"]]
SECTIONS = [("hero", None), ("fade", "#map-section"), ("map", "#map-section .stage"), ("who", "[aria-labelledby='who-title'] .stage"),
            ("types", "[aria-labelledby='types-title'] .stage"), ("cta", ".cta-band")]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for pal, mode in themes:
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.goto(base + "/"); pg.evaluate(f"localStorage.setItem('k4l-theme-v2', JSON.stringify({{p:'{pal}', m:'{mode}'}}))")
        pg.goto(base + "/"); pg.wait_for_timeout(1200)
        for name, sel in SECTIONS:
            if sel is None: pg.evaluate("scrollTo({ top: 0, behavior: 'instant' })")
            elif name == "fade": pg.evaluate("scrollTo({ top: document.querySelector('.hero').offsetHeight - 450, behavior: 'instant' })")
            else: pg.evaluate(f"(() => {{ const e = document.querySelector(\"{sel}\"); scrollTo({{ top: e.getBoundingClientRect().top + scrollY - 64, behavior: 'instant' }}); }})()")
            pg.wait_for_timeout(400)
            pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))"); pg.wait_for_timeout(250)
            pg.screenshot(path=str(out / f"{name}-{pal}-{mode}.png"))
        # select an orange region and capture the pulse
        pg.evaluate("(() => { const e = document.querySelector('#map-section .stage'); scrollTo({ top: e.getBoundingClientRect().top + scrollY - 64, behavior: 'instant' }); })()")
        pg.wait_for_timeout(300)
        pg.click(".region[data-key='finger-lakes']", force=True); pg.wait_for_timeout(500)
        pg.screenshot(path=str(out / f"map-selected-{pal}-{mode}.png"))
        pg.close()
    b.close()
print("done")

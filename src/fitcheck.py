"""Report each section's natural content height vs its window (min-height) per page.
Usage: py fitcheck.py [WxH ...]   e.g. py fitcheck.py 1440x900 1280x800 390x844
Sections whose content is taller than the window are flagged with  >>.
"""
import sys
from playwright.sync_api import sync_playwright

sizes = [tuple(int(v) for v in a.split("x")) for a in sys.argv[1:]] or [(1440, 900)]
URL = "http://localhost:8765/Karing4Life.html"
JS = """() => {
  const p = document.querySelector('.page.active');
  return [...p.children].filter(s => s.tagName === 'SECTION').map(s => {
    const cs = getComputedStyle(s);
    let h = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    [...s.children].forEach(c => { if (getComputedStyle(c).position !== 'absolute') h += c.getBoundingClientRect().height; });
    return [(s.getAttribute('aria-labelledby') || s.className.split(' ')[0]), Math.round(h), Math.round(parseFloat(cs.minHeight))];
  });
}"""
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for w, hgt in sizes:
        pg = b.new_page(viewport={"width": w, "height": hgt})
        pg.goto(URL + "#home"); pg.wait_for_timeout(500)
        over = []
        for name in "home,how,requests,families,caregivers,membership,agencies,about,contact,join,signin".split(","):
            pg.evaluate(f"location.hash = '#{name}'"); pg.wait_for_timeout(250)
            pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
            for sid, h, mh in pg.evaluate(JS):
                if h > mh + 2:
                    over.append(f"{name}/{sid} {h}>{mh}")
        print(f"{w}x{hgt}: {len(over)} over:", "; ".join(over) or "none")
        pg.close()
    b.close()

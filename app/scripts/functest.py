"""End-to-end checks of the React site. Usage: py scripts/functest.py [BASE_URL]"""
import sys
from playwright.sync_api import sync_playwright

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
ok = []
def check(name, cond): ok.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name)

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text[:200]) if m.type in ("error", "warning") else None)
    pg.goto(base + "/"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(800)

    # hero tabs + liquid indicator
    pg.click("#tab-hire"); pg.wait_for_timeout(1000)
    check("hero: hire tab selected", pg.get_attribute("#tab-hire", "aria-selected") == "true")
    check("hero: hire pane visible", pg.is_visible("#pane-hire button[type=submit]"))
    check("hero: blob moved to tab 3", pg.evaluate("getComputedStyle(document.querySelector('.as-a')).getPropertyValue('--i').trim()") == "2")
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(900)
    check("hero: arrow key moves to give", pg.get_attribute("#tab-give", "aria-selected") == "true")
    pg.select_option("#hgive-care", "rn"); pg.click("#pane-give button[type=submit]"); pg.wait_for_timeout(700)
    check("hero: give search -> /requests?care=rn", pg.url.endswith("/requests?care=rn"))
    check("requests: rn filter applied", "1 of 1" in pg.inner_text(".count"))

    # requests filters
    pg.click("text=Reset all"); pg.wait_for_timeout(200)
    check("requests: reset shows 6", "of 6" in pg.inner_text(".count"))
    pg.check(".tree-parent input >> nth=1"); pg.wait_for_timeout(200)
    check("requests: non-skilled parent ticks children", pg.eval_on_selector_all(".tree li ul input:checked", "e => e.length") == 6)
    chips = pg.eval_on_selector_all(".af-chip", "e => e.length")
    pg.click(".af-chip >> nth=0"); pg.wait_for_timeout(200)
    check("requests: removing a chip", pg.eval_on_selector_all(".af-chip", "e => e.length") == chips - 1)

    # client-side navigation (no reload) via plain links
    pg.evaluate("window.__marker = 1")
    pg.click(".site-header a[href='/about']"); pg.wait_for_timeout(600)
    check("nav: /about without full reload", pg.url.endswith("/about") and pg.evaluate("window.__marker") == 1)
    check("nav: About active", "active" in (pg.get_attribute(".site-header a[href='/about']", "class") or ""))

    # membership
    pg.goto(base + "/membership?region=bronx"); pg.wait_for_timeout(700)
    pg.click("#mem-queens .mem-toggle"); pg.wait_for_timeout(200)
    check("membership: total $17.98", "$17.98" in pg.inner_text(".sum-total"))

    # join form
    pg.goto(base + "/join?role=agency&region=suffolk"); pg.wait_for_timeout(700)
    check("join: agency role", pg.inner_text("#joinTitle").startswith("Agency"))
    check("join: EIN visible, address hidden", pg.is_visible("#aEin") and not pg.is_visible("#fAddr"))
    check("join: region chip pre-ticked", pg.is_checked("input[name=areg][value=suffolk]"))
    pg.click("#joinSubmit"); pg.wait_for_timeout(300)
    check("join: validation toast", "missing" in pg.inner_text(".toast-wrap"))

    # theme dock
    pg.goto(base + "/"); pg.wait_for_timeout(700)
    pg.click(".td-mode"); pg.wait_for_timeout(900)
    pg.click(".td-palette"); pg.wait_for_timeout(900)
    check("theme: forest/dark applied", pg.evaluate("document.documentElement.dataset.palette + '/' + document.documentElement.dataset.mode") == "forest/dark")
    check("theme: forest logo", "logo-forest" in pg.get_attribute(".brand img", "src"))
    pg.reload(); pg.wait_for_timeout(700)
    check("theme: persisted after reload", pg.evaluate("document.documentElement.dataset.palette") == "forest")

    # map
    pg.evaluate("document.getElementById('map-section').scrollIntoView({behavior:'instant'})"); pg.wait_for_timeout(600)
    pg.click(".map-inset"); pg.wait_for_timeout(1000)
    check("map: zoom to NYC & LI", pg.is_visible(".map-back") and "NYC" in pg.inner_text(".map-crumbs"))
    pg.click(".map-svg .region[data-key='brooklyn']", force=True); pg.wait_for_timeout(500)
    check("map: Brooklyn panel", pg.inner_text(".rp-name") == "Brooklyn" and pg.is_visible(".map-pulse"))
    pg.click(".map-back"); pg.wait_for_timeout(1000)
    check("map: back to state", not pg.is_visible(".map-back"))
    check("map: panel has no scrollbar", pg.evaluate("(() => { const e = document.querySelector('.region-panel'); return e.scrollHeight <= e.clientHeight + 1; })()"))

    # legacy hash link
    pg.goto(base + "/#requests?region=suffolk"); pg.wait_for_timeout(900)
    check("legacy #requests link redirects", "/requests?region=suffolk" in pg.url)

    # mobile
    m = b.new_page(viewport={"width": 390, "height": 844}, has_touch=True)
    m.goto(base + "/"); m.wait_for_timeout(800)
    check("mobile: dock folded", not m.is_visible(".td-mode"))
    m.click(".td-fab"); m.wait_for_timeout(300)
    check("mobile: dock opens", m.is_visible(".td-mode"))
    m.click("#menuOpen"); m.wait_for_timeout(300)
    check("mobile: menu opens", m.is_visible(".mm-link"))
    m.click(".mm-link[href='/families']"); m.wait_for_timeout(700)
    check("mobile: menu link navigates and closes", m.url.endswith("/families") and not m.is_visible(".mm-link"))
    check("mobile: no horizontal scroll", m.evaluate("document.documentElement.scrollWidth <= innerWidth"))

    print("\n%d/%d passed" % (sum(1 for _, c in ok if c), len(ok)))
    print("console:", [e for e in errs if "DevTools" not in e][:8])
    b.close()

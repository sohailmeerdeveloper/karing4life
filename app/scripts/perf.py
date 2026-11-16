"""Compare load + scroll smoothness of two URLs (e.g. old single file vs React build).
Usage: py scripts/perf.py URL [URL ...]
Reports first contentful paint, DOMContentLoaded, bytes transferred, and frames during a scripted scroll
(average frame time and share of frames slower than 20 ms) on a 4x CPU-throttled Chrome.
"""
import sys
from playwright.sync_api import sync_playwright

SCROLL = """async () => {
  const frames = []; let last = performance.now(), run = true;
  const tick = (t) => { frames.push(t - last); last = t; if (run) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const H = document.documentElement.scrollHeight - innerHeight;
  for (let y = 0; y <= Math.min(H, 6000); y += 40) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => requestAnimationFrame(r)); }
  run = false;
  const f = frames.slice(2); const avg = f.reduce((a, b) => a + b, 0) / f.length;
  return { avg: +avg.toFixed(1), slow: +(100 * f.filter(x => x > 20).length / f.length).toFixed(0), n: f.length };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for url in sys.argv[1:]:
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        pg = ctx.new_page()
        cdp = ctx.new_cdp_session(pg); cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
        pg.goto(url, wait_until="load"); pg.wait_for_timeout(1500)
        t = pg.evaluate("""() => { const n = performance.getEntriesByType('navigation')[0];
          const fcp = performance.getEntriesByName('first-contentful-paint')[0];
          const bytes = performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), n.transferSize || 0);
          return { fcp: fcp ? Math.round(fcp.startTime) : null, dcl: Math.round(n.domContentLoadedEventEnd), kb: Math.round(bytes / 1024) }; }""")
        s = pg.evaluate(SCROLL)
        print(f"{url}\n   FCP {t['fcp']} ms · DOMContentLoaded {t['dcl']} ms · {t['kb']} KB transferred\n   scroll: avg frame {s['avg']} ms, {s['slow']}% frames > 20 ms ({s['n']} frames)")
        ctx.close()
    b.close()

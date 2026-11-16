"""Assemble the single-file Karing4Life site: Karing4Life.html (inline CSS, JS, map data, logo)."""
import base64, json, pathlib

SRC = pathlib.Path(__file__).parent
ROOT = SRC.parent

css = (SRC / "styles.css").read_text(encoding="utf-8")
body = (SRC / "body-1.html").read_text(encoding="utf-8") + "\n" + (SRC / "body-2.html").read_text(encoding="utf-8")
js = (SRC / "app.js").read_text(encoding="utf-8")
mapdata = json.loads((SRC / "ny-map.json").read_text(encoding="utf-8"))
logo = "data:image/webp;base64," + base64.b64encode((SRC / "logo-200.webp").read_bytes()).decode()

js = js.replace("/*__MAPDATA__*/null", json.dumps(mapdata, separators=(",", ":")))
logo_forest = "data:image/webp;base64," + base64.b64encode((SRC / "logo-forest-200.webp").read_bytes()).decode()
js = js.replace("/*__LOGO_OLIVE__*/", logo).replace("/*__LOGO_FOREST__*/", logo_forest)
body = body.replace("{{LOGO}}", logo)

html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Karing4Life · New York's care directory for families, caregivers and agencies</title>
<meta name="description" content="Karing4Life is a two-sided care directory for New York State. Families post care requests for free, verified nurses and caregivers reply directly, and agencies recruit caregivers.">
<meta name="theme-color" content="#283618">
<link rel="icon" href="{logo}">
<script>
/* Set palette + mode before first paint so there is no flash of the wrong theme */
(function () {{ var d = document.documentElement, s = {{}};
  try {{ s = JSON.parse(localStorage.getItem('k4l-theme') || '{{}}') || {{}}; }} catch (e) {{}}
  var dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  d.setAttribute('data-palette', s.p === 'forest' ? 'forest' : 'olive');
  d.setAttribute('data-mode', s.m ? (s.m === 'dark' ? 'dark' : 'light') : (dark ? 'dark' : 'light'));
}})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
{body}
<script>
{js}
</script>
</body>
</html>
"""
out = ROOT / "Karing4Life.html"
out.write_text(html, encoding="utf-8")
print(out, round(len(html.encode()) / 1024, 1), "KB")

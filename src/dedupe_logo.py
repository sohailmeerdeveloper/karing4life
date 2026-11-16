"""One-off: keep a single embedded logo (header); other <img> tags get data-logo and are filled by JS."""
import re, pathlib
src = pathlib.Path(__file__).parent
for name in ("body-1.html", "body-2.html"):
    p = src / name
    t = p.read_text(encoding="utf-8")
    n = [0]
    def r(m):
        n[0] += 1
        return m.group(0) if (name == "body-1.html" and n[0] == 1) else "data-logo"
    t = re.sub(r'src="\{\{LOGO\}\}"', r, t)
    p.write_text(t, encoding="utf-8")
    print(name, t.count("{{LOGO}}"), t.count("data-logo"))

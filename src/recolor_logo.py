"""Recolour the Karing4Life logo to the Olive Garden Feast palette.

Pixel-level hue/saturation remap (PIL + numpy) so shading and highlights stay:
  purple            -> dark olive  #283618
  orange arc / "4"  -> olive       #606C38
  red heart         -> burnt orange #BC6C25
Greys / metal / white are left alone. Also exports a transparent PNG.
"""
import sys
import numpy as np
from PIL import Image
import colorsys

src, out_dir = sys.argv[1], sys.argv[2]
PAL = sys.argv[3] if len(sys.argv) > 3 else "olive"
im = Image.open(src).convert("RGB")
rgb = np.asarray(im).astype(np.float64) / 255.0

# --- vectorised RGB -> HSV ------------------------------------------------
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
v = mx
s = np.where(mx > 0, d / np.maximum(mx, 1e-9), 0)
h = np.zeros_like(mx)
m = d > 1e-9
rc = np.where(m, (mx - r) / np.maximum(d, 1e-9), 0)
gc = np.where(m, (mx - g) / np.maximum(d, 1e-9), 0)
bc = np.where(m, (mx - b) / np.maximum(d, 1e-9), 0)
h = np.where(r == mx, bc - gc, np.where(g == mx, 2.0 + rc - bc, 4.0 + gc - rc))
h = (h / 6.0) % 1.0
h = np.where(m, h, 0)


def hsv_of(hexc):
    c = tuple(int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return colorsys.rgb_to_hsv(*c)


# classes by source hue (only where there is real colour)
coloured = s > 0.08
purple = coloured & (h > 0.72) & (h < 0.965)
red = coloured & ((h >= 0.965) | (h < 0.035))
orange = coloured & (h >= 0.035) & (h < 0.17)

targets = {"purple": "#283618", "red": "#BC6C25", "orange": "#606C38"}
if PAL == "forest":
    targets = {"purple": "#012B1D", "red": "#FB6F07", "orange": "#01B36C"}

# Colour = "ink amount" (saturation relative to the class's solid ink) mixed over
# white, multiplied by a shading term (brightness relative to the class's solid
# ink).  Edges/highlights (low saturation) fade to white, shadows stay dark.
out = rgb.copy()
for name, mask in (("purple", purple), ("red", red), ("orange", orange)):
    tgt = np.array([int(targets[name][i:i + 2], 16) / 255 for i in (1, 3, 5)])
    solid = mask & (s > 0.55)
    s0 = np.percentile(s[solid], 60)
    v0 = np.percentile(v[solid], 60)
    k = np.clip(s[mask] / s0, 0, 1)[:, None]
    shade = np.clip(v[mask] / v0, 0, 1.3)[:, None]
    base = np.clip(tgt[None, :] * shade, 0, 1)
    out[mask] = (1 - k) * 1.0 + k * base
    print(name, mask.sum(), round(s0, 3), round(v0, 3))

res = Image.fromarray((out * 255).round().astype(np.uint8), "RGB")
res.save(f"{out_dir}/karing4life-logo-{PAL}.png", optimize=True)

# --- transparent version: un-mix from the white background ----------------
alpha = np.clip((1.0 - out.min(-1)) * 1.0, 0, 1)
alpha = np.where(alpha < 0.035, 0, alpha)          # kill paper noise
alpha = np.clip((alpha - 0.035) / 0.965, 0, 1)
col = np.where(alpha[..., None] > 0,
               (out - (1 - alpha[..., None])) / np.maximum(alpha[..., None], 1e-6), 0)
col = np.clip(col, 0, 1)
rgba = np.dstack([col, alpha])
t_im = Image.fromarray((rgba * 255).round().astype(np.uint8), "RGBA")
bbox = t_im.getbbox()
t_im = t_im.crop(bbox)
t_im.save(f"{out_dir}/karing4life-logo-{PAL}-transparent.png", optimize=True)
# small web version for embedding
w = 360
sm = t_im.resize((w, round(t_im.height * w / t_im.width)), Image.LANCZOS)
sm.save(f"{out_dir}/karing4life-logo-{PAL}-360.png", optimize=True)
print("bbox", bbox, "saved")

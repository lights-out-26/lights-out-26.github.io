"""Crop the tyre photos for the tyres section (public/photos/tyres/*.webp).

Every crop is a fixed box on the original, so the output is reproducible:

  range        the 2025 range side by side at the Formula 1 Exhibition, London
               (Hullian111): soft, medium, hard, intermediate, full wet
  soft         \\
  medium        > the three slicks on their stands at Zandvoort, 2024
  hard         /  (Steffen Prößdorf): one photo, so one light for all three
  inter        \\  the intermediate and the full wet at the Formula 1
  wet          /   Exhibition, London (Hullian111)
  sidewall     a 2026 medium, with its size moulded on the sidewall (TaurusEmerald);
               the section points at the size, "280/705-18", at 21.8% / 30% of it
  worn         a used hard tyre on a Haas after the 2024 Austrian GP (Lukas Raich)
  ring         one tyre made of five real ones: a 72-degree piece of each
               sidewall (soft, medium and hard from the Zandvoort photo, the
               intermediate and full wet from the London one), each opened
               out to a true circle and set round a common hub, on the real F1
               wheel of the hard in the Zandvoort photo; it rolls behind the
               tyres section's heading

and, for the pit stop's heading (public/photos/pit/soft-tyre.webp):

  soft-tyre    Pirelli's studio photo of a P Zero supersoft, the red-lettered
               tyre of the 13-inch era, found on AUSmotive.com (not freely
               licensed, unlike the rest), cut out on a circle round the hub
               so it can turn, with the white of the wheel made transparent

usage: python scripts/prepare-tyres.py <dir with the originals> [public/photos]
  The originals keep their Commons names (spaces or underscores both work):
    Pirelli Tyre Sets at Formula 1 Exhibition, London 03.jpg
    Pirelli Tyre Sets at Formula 1 Exhibition, London 04.jpg
    2024-08-25 Motorsport, Formel 1, Großer Preis der Niederlande 2024 STP 3619 by Stepro.jpg
    Pirelli P Zero Formula 1 Medium Slick Tyre 2026.jpg
    FIA F1 Austria 2024 misc (tire rubber pickup).jpg   (the 1920 px Commons
                                                         thumbnail is enough)
  and the studio photo, as supplied (1000 x 1200, a caption bar along the top):
    Pirelli P Zero supersoft (AUSmotive).jpg
Needs Pillow and NumPy.
"""
import pathlib, sys

import numpy as np

from PIL import Image, ImageDraw, ImageOps

src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'public/photos') / 'tyres'
out.mkdir(parents=True, exist_ok=True)

LONDON_03 = 'Pirelli Tyre Sets at Formula 1 Exhibition, London 03.jpg'
LONDON_04 = 'Pirelli Tyre Sets at Formula 1 Exhibition, London 04.jpg'
ZANDVOORT = '2024-08-25 Motorsport, Formel 1, Großer Preis der Niederlande 2024 STP 3619 by Stepro.jpg'
MEDIUM_2026 = 'Pirelli P Zero Formula 1 Medium Slick Tyre 2026.jpg'
WORN = 'FIA F1 Austria 2024 misc (tire rubber pickup).jpg'
SUPERSOFT = 'Pirelli P Zero supersoft (AUSmotive).jpg'

# The rolling tyre. The hub is the centre of the silver rim's edge, fitted on
# the photo (1000 x 1200); the radius stops just inside the tyre's outer edge
# (462 px at its nearest), so none of the studio backdrop turns with it. The
# photo is black and white but for the red lettering; a gamma of 1.3 deepens
# the grey rubber to sit in the dark pit lane.
SOFT_HUB = (511.8 / 1000, 628.9 / 1200)
SOFT_R = 458 / 1000
SOFT_GAMMA = 1.3
SOFT_SIZE = 900
# Inside the rim the photo is all white and silver (the wheel, and the studio
# backdrop through its spokes), which glares in the dark pit lane. There, the
# lighter a pixel the more transparent it is: clear from a luminance of 175,
# opaque at 85, so only the wheel's shadows and edges stay, a dark ghost of it.
SOFT_RIM_R = 257.1 / 1000   # the rim's edge, as a fraction of the photo's width
SOFT_CLEAR = (175, 90)      # fully clear at, and the range down to opaque

# name: (original, box as fractions of the original (left, top, right, bottom), output size, rotation)
# Fractions, so a smaller copy of an original (a Commons thumbnail) crops the same.
CROPS = {
    'range': (LONDON_04, (60 / 4176, 300 / 2784, 4176 / 4176, 2358 / 2784), (2000, 1000), 0),
    'soft': (ZANDVOORT, (47 / 3527, 480 / 1984, 1247 / 3527, 1980 / 1984), (960, 1200), 0),
    'medium': (ZANDVOORT, (1092 / 3527, 480 / 1984, 2292 / 3527, 1980 / 1984), (960, 1200), 0),
    'hard': (ZANDVOORT, (2256 / 3527, 480 / 1984, 3456 / 3527, 1980 / 1984), (960, 1200), 0),
    'inter': (LONDON_03, (720 / 4176, 170 / 2784, 1960 / 4176, 1720 / 2784), (960, 1200), 0),
    'wet': (LONDON_03, (1640 / 4176, 200 / 2784, 3480 / 4176, 2500 / 2784), (960, 1200), 0),
    'sidewall': (MEDIUM_2026, (0, 0, 1, 1), (1200, 1200), 0),
    'worn': (WORN, (300 / 1920, 175 / 1280, 1620 / 1920, 1165 / 1280), (1320, 990), 0),
}

def find(name):
    for cand in (name, name.replace(' ', '_')):
        p = src / cand
        if p.exists():
            return p
    raise SystemExit(f'missing original: {name}')


def load(name):
    return ImageOps.exif_transpose(Image.open(find(name))).convert('RGB')


def box_px(im, box):
    W, H = im.size
    l, t, r, b = box
    return (round(l * W), round(t * H), round(r * W), round(b * H))


def save(im, name, q=80):
    path = out / f'{name}.webp'
    im.save(path, 'WEBP', quality=q, method=6)
    print(f'{path}  {im.size[0]}x{im.size[1]}  {path.stat().st_size // 1024} KB')


for name, (orig, box, size, turn) in CROPS.items():
    base = load(orig)
    im = base.crop(box_px(base, box))
    if turn:
        im = im.rotate(turn, resample=Image.BICUBIC, expand=False)
    im = im.resize(size, Image.LANCZOS)
    save(im, name)

# The pit stop's rolling tyre: a square round the hub, darkened a little,
# everything outside the tyre's circle transparent, and the white inside the
# rim cleared by its lightness.
base = load(SUPERSOFT)
W, H = base.size
cx, cy, r = SOFT_HUB[0] * W, SOFT_HUB[1] * H, SOFT_R * W
tyre = base.crop((round(cx - r), round(cy - r), round(cx + r), round(cy + r))).resize((SOFT_SIZE, SOFT_SIZE), Image.LANCZOS)
lum = np.asarray(tyre, dtype=np.float32).mean(axis=2)
yy, xx = np.mgrid[0:SOFT_SIZE, 0:SOFT_SIZE]
dist = np.hypot(xx - SOFT_SIZE / 2 + 0.5, yy - SOFT_SIZE / 2 + 0.5)
rim_r = SOFT_RIM_R * W * SOFT_SIZE / (2 * r)
keyed = np.clip((SOFT_CLEAR[0] - lum) / SOFT_CLEAR[1], 0, 1)
outside_rim = np.clip((dist - (rim_r - 1.5)) / 3, 0, 1)          # a 3 px blend at the rim's edge
alpha = outside_rim + (1 - outside_rim) * keyed
tyre = tyre.point(lambda v: round(255 * (v / 255) ** SOFT_GAMMA))
mask = Image.new('L', (SOFT_SIZE * 4, SOFT_SIZE * 4), 0)
ImageDraw.Draw(mask).ellipse((0, 0, SOFT_SIZE * 4 - 1, SOFT_SIZE * 4 - 1), fill=255)
circle = np.asarray(mask.resize((SOFT_SIZE, SOFT_SIZE), Image.LANCZOS), dtype=np.float32) / 255
tyre.putalpha(Image.fromarray((np.minimum(alpha, circle) * 255).round().astype(np.uint8)))
pit = out.parent / 'pit'
pit.mkdir(parents=True, exist_ok=True)
path = pit / 'soft-tyre.webp'
tyre.save(path, 'WEBP', quality=82, alpha_quality=90, method=6)
print(f'{path}  {SOFT_SIZE}x{SOFT_SIZE}  {path.stat().st_size // 1024} KB')


# ---- the ring: one tyre made of five ----
#
# Each tyre's painted stripe and lettering sit on one circle of its sidewall.
# An ellipse fitted to those pixels (scratch fits, in pixels of the original)
# gives the tyre's hub, its size and how far it is turned from the camera; with
# it, any point of the sidewall can be found from a radius and an angle as if
# the tyre faced the camera square on. The ring takes a 72-degree piece of each,
# from the part with nothing in front of it (the slicks' stands are below them,
# the full wet hides the intermediate's right-hand side), centred on the tyre's
# PIRELLI so the five logos come round in turn, opens the band from the rim to
# the tread (0.80 to 1.15 of the stripe's radius) onto a common band, brings
# the rubber of all five to one brightness with a gamma curve (which leaves
# the paint's brightest colours where they are), and fades each piece into the
# next over plain rubber, a stripe or a small mark, never across a logo.
RING_SIZE = 1200
RING_INNER = 0.585          # the band starts at this fraction of the radius (the CSS mask's 58.5%)
RING_BAND = (0.80, 1.15)    # the sidewall, from the rim to the tread, as a fraction of the stripe's radius
RING_FEATHER = 5            # degrees over which each piece fades into the next
RING_RUBBER = 34            # the rubber's median brightness in every piece, so the five match
RING = [
    # name, original, its size, stripe ellipse (cx, cy, semi-axis a, semi-axis b, angle of a),
    # and the angle (0 to the right, -90 at the top) of the middle of the piece used: its PIRELLI
    ('soft', ZANDVOORT, (3527, 1984), (628.5, 1139.1, 422.2, 426.4, -73.48), -35),
    ('medium', ZANDVOORT, (3527, 1984), (1716.8, 1104.9, 412.0, 412.0, 0.0), -101),
    ('hard', ZANDVOORT, (3527, 1984), (2868.9, 1084.5, 424.9, 430.9, -54.4), -87),
    ('inter', LONDON_03, (4176, 2784), (1546.6, 1053.9, 501.4, 580.2, 21.39), -94),
    ('wet', LONDON_03, (4176, 2784), (2790.2, 1245.2, 689.0, 523.9, -69.2), -88),
]
# The wheel in the middle: the hard's, from the Zandvoort photo, at full size
# (its rim is about as big as the ring's middle). The rim meets the tyre at 0.79
# of the stripe's radius, set on the ring's inner edge. The stand hides the
# bottom of it; the spokes repeat round the wheel, so the lower half is the
# upper half turned through 180 degrees. The hub sits deeper than the rim, so
# in the photo it is off the tyre's centre (2853, 1053 against 2869, 1084): the
# centre used slides from the hub to the rim's as the radius grows. The studio
# backdrop seen between the spokes is light and grey; it is made transparent,
# the lighter the more.
RING_WHEEL = (ZANDVOORT, (3527, 1984), (2868.9, 1084.5, 424.9, 430.9, -54.4), 0.79)
RING_HUB = (2853, 1053)
RING_BACKDROP = (58, 22)    # clear from this brightness, opaque this much darker


def bilinear(img, x, y):
    h, w = img.shape[:2]
    x = np.clip(x, 0, w - 1.001); y = np.clip(y, 0, h - 1.001)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = (x - x0)[..., None], (y - y0)[..., None]
    a, b = img[y0, x0], img[y0, x0 + 1]
    c, d = img[y0 + 1, x0], img[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


S = RING_SIZE
R = S / 2
yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
dx, dy = xx - R + 0.5, yy - R + 0.5
rho = np.hypot(dx, dy)
theta = np.degrees(np.arctan2(dy, dx))                    # screen angle: 0 to the right, clockwise
t = np.clip((rho - R * RING_INNER) / (R - R * RING_INNER), 0, 1)
ring = np.zeros((S, S, 3), np.float32)
weight = np.zeros((S, S), np.float32)
cache = {}
for k, (name, orig, ref, (ecx, ecy, ea, eb, eang), phi) in enumerate(RING):
    if orig not in cache:
        cache[orig] = np.asarray(load(orig), dtype=np.float32)
    pix = cache[orig]
    sx, sy = pix.shape[1] / ref[0], pix.shape[0] / ref[1]   # in case a smaller copy is used
    centre = -90 + 72 * k                                   # the soft at the top, then clockwise
    d = (theta - centre + 180) % 360 - 180
    w = np.clip((36 + RING_FEATHER - np.abs(d)) / (2 * RING_FEATHER), 0, 1)
    w = w * w * (3 - 2 * w)
    sel = w > 0
    srad = RING_BAND[0] + t[sel] * (RING_BAND[1] - RING_BAND[0])
    psi = np.radians(d[sel] + phi) - np.radians(eang)
    ca, sa = np.cos(np.radians(eang)), np.sin(np.radians(eang))
    ux, uy = srad * ea * np.cos(psi), srad * eb * np.sin(psi)
    px = (ecx + ux * ca - uy * sa) * sx
    py = (ecy + ux * sa + uy * ca) * sy
    sample = bilinear(pix, px, py)
    lum = sample.mean(axis=1)
    rubber = (lum < 130) & ((sample.max(axis=1) - sample.min(axis=1)) < 40) & (w[sel] > 0.99)
    median = float(np.clip(np.median(lum[rubber]), 4, 250))
    gamma = np.log(RING_RUBBER / 255) / np.log(median / 255)
    sample = 255 * (np.clip(sample, 0, 255) / 255) ** gamma
    ring[sel] += sample * w[sel][:, None]
    weight[sel] += w[sel]
    print(f'ring piece {name}: rubber median {median:.0f}, gamma {gamma:.2f}')
ring /= np.maximum(weight, 1e-6)[..., None]

# The wheel, opened out the same way: the output's centre to the ring's inner
# edge takes the photo's hub to its rim, blended into the tyre over 4 px.
orig, ref, (ecx, ecy, ea, eb, eang), s_rim = RING_WHEEL
pix = cache[orig]
sx, sy = pix.shape[1] / ref[0], pix.shape[0] / ref[1]
inside = rho < R * RING_INNER + 3
srad = np.minimum(rho[inside] / (R * RING_INNER), 1) * s_rim
th = theta[inside]
th = np.where(th > 0, th - 180, th)                              # the lower half from the upper
psi = np.radians(th) - np.radians(eang)
ca, sa = np.cos(np.radians(eang)), np.sin(np.radians(eang))
ux, uy = srad * ea * np.cos(psi), srad * eb * np.sin(psi)
k = srad / s_rim                                                   # 0 at the hub, 1 at the rim
hx, hy = RING_HUB[0] + k * (ecx - RING_HUB[0]), RING_HUB[1] + k * (ecy - RING_HUB[1])
wheel = bilinear(pix, (hx + ux * ca - uy * sa) * sx, (hy + ux * sa + uy * ca) * sy)
wl = wheel.mean(axis=1)
wheel_alpha = np.clip((RING_BACKDROP[0] - wl) / RING_BACKDROP[1], 0, 1)
tyre_w = np.clip((rho[inside] - (R * RING_INNER - 1)) / 4, 0, 1)[:, None]
ring[inside] = ring[inside] * tyre_w + wheel * (1 - tyre_w)
alpha = np.clip((R - rho) / 1.5 + 0.5, 0, 1)                     # a soft 1.5 px outer edge
alpha[inside] *= tyre_w[:, 0] + (1 - tyre_w[:, 0]) * wheel_alpha
img = Image.fromarray(np.clip(ring, 0, 255).astype(np.uint8))
img.putalpha(Image.fromarray((alpha * 255).round().astype(np.uint8)))
path = out / 'ring.webp'
img.save(path, 'WEBP', quality=80, alpha_quality=90, method=6)
print(f'{path}  {S}x{S}  {path.stat().st_size // 1024} KB')

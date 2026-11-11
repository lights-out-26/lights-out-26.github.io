"""Locate the two near-side wheels in each side-on photo.

1. The segmentation mask gives the car's lower outline; the two lowest "feet" are the tyres.
2. The centre is refined by concentricity: around the true centre, every ring of the wheel
   (tyre edge, sidewall band, rim) has near-constant brightness.
3. The outer radius is the dark-to-light step from rubber to asphalt on the lower arc.

Writes wheels.json (original-image pixels) and close-up debug sheets."""
import cv2, json, sys, pathlib, numpy as np
raw, maskd, out = (pathlib.Path(a) for a in sys.argv[1:4])
keys = sorted(p.stem for p in raw.glob('*.jpg') if p.stem.endswith(('-a', '-b')))

def load_mask(k, size):
    m = cv2.imread(str(maskd / f'{k}.png'), cv2.IMREAD_UNCHANGED)
    a = m[..., 3] if m.ndim == 3 and m.shape[2] == 4 else (m if m.ndim == 2 else m[..., 0])
    a = cv2.resize(a, size, interpolation=cv2.INTER_LINEAR)
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 127).astype(np.uint8))
    keep = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    return (lab == keep)

def fit_circle(x, y):
    A = np.c_[2 * x, 2 * y, np.ones_like(x)]; b = x * x + y * y
    cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]
    return cx, cy, float(np.sqrt(c + cx * cx + cy * cy))

def concentricity(g, cx, cy, r):
    """Low when rings around (cx, cy) are uniform along the angle but differ strongly from ring to ring."""
    n = int(r)
    pol = cv2.warpPolar(g, (n, 96), (cx, cy), r, cv2.WARP_POLAR_LINEAR + cv2.INTER_LINEAR)  # rows = angle, cols = radius
    ring = pol[:, int(n * 0.30):int(n * 0.97)].astype(np.float32)
    return float(ring.std(axis=0).mean() / (ring.mean(axis=0).std() + 4.0))

def search(g, cx, cy, r, span, step, yspan=None):
    best = (1e9, cx, cy)
    for dx in np.arange(-span, span + 1e-6, step):
        for dy in np.arange(-(yspan or span), (yspan or span) + 1e-6, step):
            s = concentricity(g, cx + dx, cy + dy, r)
            if s < best[0]: best = (s, cx + dx, cy + dy)
    return best

def outer_radius(g, cx, cy, r0):
    n = int(r0 * 1.3)
    pol = cv2.warpPolar(g, (n, 360), (cx, cy), r0 * 1.3, cv2.WARP_POLAR_LINEAR + cv2.INTER_LINEAR).astype(np.float32)
    lower = pol[30:151]                                   # 30..150 degrees = the arc facing the ground
    prof = cv2.GaussianBlur(np.median(lower, axis=0)[None, :], (0, 0), 1.5)[0]
    d = np.diff(prof); lo, hi = int(n * 0.66), int(n * 0.89)   # 0.86 r0 .. 1.16 r0
    return float((lo + int(np.argmax(d[lo:hi])) + 0.5) * (r0 * 1.3) / n)

res = {}; crops = []
for k in keys:
    img = cv2.imread(str(raw / f'{k}.jpg')); H, W = img.shape[:2]
    g = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (0, 0), W / 1920)
    m = load_mask(k, (W, H))
    cols = np.where(m.any(axis=0))[0]; x0, x1 = cols[0], cols[-1]; L = x1 - x0
    yb = np.where(m.any(axis=0), H - 1 - np.argmax(m[::-1], axis=0), -1)
    out_k = {}
    sw = 1920 / W; gw = cv2.resize(g, (1920, round(H * sw)), interpolation=cv2.INTER_AREA)
    for name, (a, b) in (('front', (0.17, 0.39)), ('rear', (0.76, 0.97))):
        xs = np.arange(int(x0 + a * L), int(x0 + b * L))
        r = 0.0655 * L                                    # prior: tyre radius is a fixed share of car length
        ybot = float(np.max(yb[xs]))
        xm = (xs[0] + xs[-1]) / 2
        # exhaustive coarse search on a 1920-wide copy, then fine search at full resolution
        sc, cxw, cyw = search(gw, xm * sw, (ybot - r) * sw, r * sw, (xs[-1] - xs[0]) / 2 * sw, 4, yspan=0.34 * r * sw)
        sc, cxw, cyw = search(gw, cxw, cyw, r * sw, 4, 1)
        cx, cy = cxw / sw, cyw / sw
        sc, cx, cy = search(g, cx, cy, r, 1.5 / sw, 0.25 / sw)
        ro = outer_radius(g, cx, cy, r)
        out_k[name] = [float(cx), float(cy), float(ro)]
        out_k[name + '_score'] = round(sc, 3)
    out_k['size'] = [W, H]; out_k['bbox'] = [int(x0), int(np.where(m.any(axis=1))[0][0]), int(x1), int(np.where(m.any(axis=1))[0][-1])]
    res[k] = out_k
    row = []
    for name in ('front', 'rear'):
        cx, cy, r = out_k[name]; half = int(r * 1.35)
        xa, ya = int(cx) - half, int(cy) - half
        cr = img[max(0, ya):ya + 2 * half, max(0, xa):xa + 2 * half].copy()
        cv2.circle(cr, (int(round(cx - max(0, xa))), int(round(cy - max(0, ya)))), int(round(r)), (0, 255, 0), max(1, W // 1920))
        cv2.circle(cr, (int(round(cx - max(0, xa))), int(round(cy - max(0, ya)))), max(2, W // 640), (0, 255, 255), -1)
        row.append(cv2.resize(cr, (300, 300), interpolation=cv2.INTER_AREA))
    t = np.hstack(row); cv2.putText(t, k, (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 0), 2); crops.append(t)
    s = 1920 / W; f, r_ = out_k['front'], out_k['rear']
    print(f"{k:16s} wb={(r_[0]-f[0])*s:6.0f} rf={f[2]*s:6.1f} rr={r_[2]*s:6.1f} dy={(r_[1]-f[1])*s:5.0f} r/wb={f[2]/(r_[0]-f[0]):.4f} score={out_k['front_score']}/{out_k['rear_score']}")
json.dump(res, open(out / 'wheels.json', 'w'), indent=1)
for n in range(0, len(crops), 12):
    grp = crops[n:n + 12]
    while len(grp) % 3: grp.append(np.zeros_like(grp[0]))
    cv2.imwrite(str(out / f'wheels-crops-{n // 12}.jpg'), np.vstack([np.hstack(grp[i:i + 3]) for i in range(0, len(grp), 3)]), [cv2.IMWRITE_JPEG_QUALITY, 84])

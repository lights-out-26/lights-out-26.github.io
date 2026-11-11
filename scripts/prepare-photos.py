"""Turn the downloaded photos into web assets.

Side-on shots  -> cut out, levelled and scaled so both axles land on the same
                  spot in every image (cars/*.webp), plus separate wheel discs
                  (sharp and spin-blurred) and a motion-blurred "at speed" copy.
Action shots   -> cropped around the car (action/*.webp).
Archive shots  -> resized (eras/*.webp).

usage: export.py <raw> <mask> <wheels.json> <outdir>
"""
import cv2, json, sys, pathlib, numpy as np
from PIL import Image

raw, maskd, wheels_json, out = (pathlib.Path(a) for a in sys.argv[1:5])
WHEELS = json.load(open(wheels_json))

# Canvas in "car millimetres" (scaled so the apparent wheelbase is 3,400).
CW, CH = 6000, 1540          # canvas size
FX, RX, AY = 1750, 5150, 1110  # front axle x, rear axle x, axle height
PX = 0.5                     # px per mm for the large size -> 3000 x 770
for d in ('cars', 'wheels', 'action', 'eras'): (out / d).mkdir(parents=True, exist_ok=True)

def save_webp(arr_bgra_or_bgr, path, q=84):
    a = arr_bgra_or_bgr
    if a.shape[2] == 4:
        im = Image.fromarray(cv2.cvtColor(a, cv2.COLOR_BGRA2RGBA), 'RGBA')
        im.save(path, 'WEBP', quality=q, alpha_quality=92, method=6, exact=False)
    else:
        Image.fromarray(cv2.cvtColor(a, cv2.COLOR_BGR2RGB)).save(path, 'WEBP', quality=q, method=6)

def read_alpha(k, size):
    m = cv2.imread(str(maskd / f'{k}.png'), cv2.IMREAD_UNCHANGED)
    a = m[..., 3] if (m.ndim == 3 and m.shape[2] == 4) else (m if m.ndim == 2 else m[..., 0])
    return cv2.resize(a, size, interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255

def guided(I, p, r, eps):
    box = lambda x: cv2.boxFilter(x, -1, (2 * r + 1, 2 * r + 1))
    mI, mp = box(I), box(p); cIp = box(I * p) - mI * mp; vI = box(I * I) - mI * mI
    a = cIp / (vI + eps); b = mp - a * mI
    return box(a) * I + box(b)

def cutout(k):
    img = cv2.imread(str(raw / f'{k}.jpg')); H, W = img.shape[:2]; u = W / 1920
    a = read_alpha(k, (W, H))
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8))
    keep = (lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    a *= cv2.dilate(keep, np.ones((int(9 * u) | 1,) * 2, np.uint8))
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    a = np.clip(guided(g, a, max(2, int(3 * u)), 2e-3), 0, 1)
    a = np.clip((a - 0.10) / 0.80, 0, 1)                       # trim faint halo, firm up the body
    w = WHEELS[k]
    for name in ('front', 'rear'):                             # tyres and rims are solid
        cx, cy, r = w[name]
        disc = np.zeros((H, W), np.float32); cv2.circle(disc, (int(round(cx)), int(round(cy))), int(r * 0.9), 1, -1, cv2.LINE_AA)
        a = np.maximum(a, disc * (a > 0.02))
    # de-fringe: edge pixels take their colour from the car, not from the asphalt behind them
    inner = (a > 0.9).astype(np.float32); ks = int(9 * u) | 1
    den = cv2.blur(inner, (ks, ks)); num = cv2.blur(img.astype(np.float32) * inner[..., None], (ks, ks))
    fill = num / np.maximum(den, 1e-3)[..., None]
    edge = (a < 0.9) & (den > 0.03)
    img = img.astype(np.float32); img[edge] = fill[edge]
    return np.clip(img, 0, 255).astype(np.uint8), a, w

def level(img, a, w, px):
    f, r = np.array(w['front'][:2]), np.array(w['rear'][:2]); wb = float(np.linalg.norm(r - f))
    ang = np.arctan2(r[1] - f[1], r[0] - f[0]); s = (RX - FX) * px / wb; c, sn = np.cos(ang), np.sin(ang)
    M = np.float32([[s * c, s * sn, FX * px - s * (c * f[0] + sn * f[1])], [-s * sn, s * c, AY * px - s * (-sn * f[0] + c * f[1])]])
    size = (int(CW * px), int(CH * px))
    rgb = cv2.warpAffine(img, M, size, flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    al = cv2.warpAffine(a, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return np.dstack([rgb, np.clip(al * 255, 0, 255).astype(np.uint8)]), 3400 / wb

def radii(w, mm):
    """Front and rear tyre radius in canvas mm. Measured values are noisy, so reconcile the pair."""
    rf, rr = w['front'][2] * mm, w['rear'][2] * mm / 1.03
    r0 = (rf + rr) / 2 if abs(rf - rr) < 0.04 * rf else min((rf, rr), key=lambda v: abs(v - 372))
    r0 = float(np.clip(r0, 352, 398))
    return r0, r0 * 1.03

def wheel_images(bgra, cx, cy, r):
    R = int(np.ceil(r)) + 2; x0, y0 = int(cx) - R, int(cy) - R
    crop = bgra[y0:y0 + 2 * R, x0:x0 + 2 * R].astype(np.float32)
    yy, xx = np.mgrid[0:2 * R, 0:2 * R]; d = np.hypot(xx - R, yy - R)
    disc = np.clip((r - d) / 1.6, 0, 1)
    sharp = crop.copy(); sharp[..., 3] *= disc
    # spin blur: average every ring around the hub
    n = 2 * R; pol = cv2.warpPolar(crop, (n, 720), (R, R), R, cv2.WARP_POLAR_LINEAR + cv2.INTER_LINEAR)
    pol = np.clip(np.nan_to_num(pol, nan=0.0, posinf=0.0, neginf=0.0), 0, 255)
    pm = pol.copy(); pm[..., :3] *= pm[..., 3:4] / 255
    mean = pm.mean(axis=0, keepdims=True).repeat(720, axis=0)
    back = cv2.warpPolar(mean, (2 * R, 2 * R), (R, R), R, cv2.WARP_POLAR_LINEAR + cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
    back = np.nan_to_num(back); al = np.maximum(back[..., 3:4], 1.0); blur = np.dstack([back[..., :3] / (al / 255), back[..., 3]])
    blur[..., 3] *= disc
    return np.clip(sharp, 0, 255).astype(np.uint8), np.clip(blur, 0, 255).astype(np.uint8)

def speed_copy(bgra, k):
    f = bgra.astype(np.float32); pm = f.copy(); pm[..., :3] *= pm[..., 3:4] / 255
    pm = cv2.blur(pm, (k, 1)); pm = cv2.GaussianBlur(pm, (0, 0), sigmaX=k / 9, sigmaY=0.6)
    al = np.maximum(pm[..., 3:4], 1e-3)
    return np.clip(np.dstack([pm[..., :3] / (al / 255), pm[..., 3]]), 0, 255).astype(np.uint8)

meta = {'canvas': {'w': CW, 'h': CH, 'frontX': FX / CW, 'rearX': RX / CW, 'axleY': AY / CH}, 'cars': {}}
side = sorted(k for k in WHEELS if k.endswith(('-a', '-b')))
for k in side:
    img, a, w = cutout(k)
    primary = k.endswith('-a')
    px = PX if primary else PX / 2
    bgra, mm = level(img, a, w, px)
    rf, rr = radii(w, mm)
    al = bgra[..., 3]; ys, xs = np.where(al > 20)
    entry = {'rf': round(float(rf) / CW, 5), 'rr': round(float(rr) / CW, 5),
             'bbox': [round(float(xs.min()) / bgra.shape[1], 4), round(float(ys.min()) / bgra.shape[0], 4), round(float(xs.max()) / bgra.shape[1], 4), round(float(ys.max()) / bgra.shape[0], 4)]}
    if primary:
        save_webp(bgra, out / 'cars' / f'{k}-lg.webp', 84)
        md = cv2.resize(bgra, (bgra.shape[1] // 2, bgra.shape[0] // 2), interpolation=cv2.INTER_AREA)
        save_webp(md, out / 'cars' / f'{k}.webp', 82)
        save_webp(speed_copy(md, 151), out / 'cars' / f'{k}-speed.webp', 62)
        for name, cx, r in (('f', FX, rf), ('r', RX, rr)):
            sharp, blur = wheel_images(bgra, cx * px, AY * px, r * px * 0.985)
            save_webp(sharp, out / 'wheels' / f'{k}-{name}.webp', 84); save_webp(blur, out / 'wheels' / f'{k}-{name}-spin.webp', 70)
        entry['wheelBox'] = round((int(np.ceil(rf * px * 0.985)) + 2) * 2 / bgra.shape[1], 5), round((int(np.ceil(rr * px * 0.985)) + 2) * 2 / bgra.shape[1], 5)
    else:
        save_webp(bgra, out / 'cars' / f'{k}.webp', 82)
    meta['cars'][k] = entry
    print(k, bgra.shape[1], 'x', bgra.shape[0], 'rf', round(rf), 'rr', round(rr), entry['bbox'])
json.dump(meta, open(out / 'cars.json', 'w'), indent=1)

# ---- action shots: crop around the car, away from the trackside boards ----
for p in sorted(raw.glob('*-action.jpg')):
    k = p.stem; img = cv2.imread(str(p)); H, W = img.shape[:2]
    a = read_alpha(k, (W, H)); n, lab, st, cen = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8))
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); x, y, w_, h_ = st[i, :4]
    cw = int(np.clip(w_ * 2.3, 1100, W)); ch = int(cw / 2.1)       # letterbox keeps the boards out of frame
    cx = x + w_ / 2; cy = y + h_ / 2
    x0 = int(np.clip(cx - cw * 0.46, 0, W - cw)); y0 = int(np.clip(cy - ch * 0.58, min(0.24 * H, H - ch), H - ch))
    crop = img[y0:y0 + ch, x0:x0 + cw]
    if cw > 1680: crop = cv2.resize(crop, (1680, 800), interpolation=cv2.INTER_AREA)
    save_webp(crop, out / 'action' / f'{k[:-7]}.webp', 80)
    print(k, 'crop', cw, 'x', ch, 'car', w_, 'x', h_)

# ---- archive shots ----
for p in sorted(raw.glob('era-*.jpg')):
    img = cv2.imread(str(p)); H, W = img.shape[:2]
    if W > 1600: img = cv2.resize(img, (1600, round(H * 1600 / W)), interpolation=cv2.INTER_AREA)
    save_webp(img, out / 'eras' / f'{p.stem[4:]}.webp', 80); print(p.stem, img.shape[1], 'x', img.shape[0])

"""Estimate a depth map for every photograph the WebGL scenes use.

Model: Depth Anything V2 Small, int8 ONNX build (Apache-2.0), from
https://huggingface.co/onnx-community/depth-anything-v2-small (onnx/model_quantized.onnx).
It returns relative inverse depth: larger means nearer.

Outputs, all 8-bit greyscale WebP where white is nearest:
  depth/<team>-a.webp        side-on car, on the same levelled canvas as cars/<team>-a.webp
  depth/action-<team>.webp   on-track shot, matching action/<team>.webp

Side-on cars are estimated on the original photo (the track around the car
helps the model), then put through the same levelling transform as the
colour image so the two line up pixel for pixel.

usage: python make-depth.py <model.onnx> <raw dir> <wheels.json> <public/photos>
"""
import json, sys, pathlib
import cv2, numpy as np
import onnxruntime as ort
from PIL import Image

model_path, raw, wheels_json, photos = (pathlib.Path(a) for a in sys.argv[1:5])
WHEELS = json.load(open(wheels_json))
out = photos / 'depth'
out.mkdir(parents=True, exist_ok=True)

# Same canvas as prepare-photos.py.
CW, CH = 6000, 1540
FX, RX, AY = 1750, 5150, 1110
PX_DEPTH = 0.25  # depth maps are half the width of the large colour image (1500 x 385)

opts = ort.SessionOptions()
opts.intra_op_num_threads = 2
session = ort.InferenceSession(str(model_path), opts, providers=['CPUExecutionProvider'])
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)


def estimate(bgr, long_side=1022):
    """Raw relative inverse depth at the image's own resolution."""
    h, w = bgr.shape[:2]
    s = long_side / max(w, h)
    iw, ih = (max(14, round(v * s / 14) * 14) for v in (w, h))
    x = cv2.resize(bgr, (iw, ih), interpolation=cv2.INTER_AREA)[..., ::-1].astype(np.float32) / 255
    x = ((x - MEAN) / STD).transpose(2, 0, 1)[None]
    d = session.run(None, {'pixel_values': np.ascontiguousarray(x)})[0][0]
    return cv2.resize(d, (w, h), interpolation=cv2.INTER_CUBIC)


def guided(I, p, r, eps):
    box = lambda v: cv2.boxFilter(v, -1, (2 * r + 1, 2 * r + 1))
    mI, mp = box(I), box(p)
    a = (box(I * p) - mI * mp) / (box(I * I) - mI * mI + eps)
    b = mp - a * mI
    return box(a) * I + box(b)


def stretch(d, mask=None, lo=1, hi=99.5):
    v = d[mask] if mask is not None else d.ravel()
    a, b = np.percentile(v, [lo, hi])
    return np.clip((d - a) / max(b - a, 1e-6), 0, 1)


def fill_outside(d, a):
    """Carry the depth at the car's edge outwards, so blurs and parallax that
    sample just outside the silhouette still find sensible values."""
    w = (a > 0.5).astype(np.float32)
    num, den = d * w, w.copy()
    acc_n, acc_d = np.zeros_like(d), np.zeros_like(d)
    for k in (3, 9, 27, 81, 243):
        acc_n += cv2.GaussianBlur(num, (0, 0), k)
        acc_d += cv2.GaussianBlur(den, (0, 0), k)
    far = acc_n / np.maximum(acc_d, 1e-6)
    return d * w + far * (1 - w)


def save(arr01, path, size=None):
    g = np.clip(arr01 * 255 + 0.5, 0, 255).astype(np.uint8)
    if size:
        g = cv2.resize(g, size, interpolation=cv2.INTER_AREA)
    Image.fromarray(g, 'L').save(path, 'WEBP', lossless=True, method=6)


def level_matrix(w, px):
    f, r = np.array(w['front'][:2]), np.array(w['rear'][:2])
    wb = float(np.linalg.norm(r - f))
    ang = np.arctan2(r[1] - f[1], r[0] - f[0])
    s = (RX - FX) * px / wb
    c, sn = np.cos(ang), np.sin(ang)
    return np.float32([[s * c, s * sn, FX * px - s * (c * f[0] + sn * f[1])],
                       [-s * sn, s * c, AY * px - s * (-sn * f[0] + c * f[1])]])


# ---- side-on cars ----
for k in sorted(k for k in WHEELS if k.endswith('-a')):
    img = cv2.imread(str(raw / f'{k}.jpg'))
    H, W = img.shape[:2]
    x0, y0, x1, y1 = WHEELS[k]['bbox']
    mx, my = int((x1 - x0) * 0.06), int((y1 - y0) * 0.25)
    x0, y0, x1, y1 = max(0, x0 - mx), max(0, y0 - my), min(W, x1 + mx), min(H, y1 + my)
    full = np.full((H, W), np.nan, np.float32)
    full[y0:y1, x0:x1] = estimate(img[y0:y1, x0:x1])
    full = np.nan_to_num(full, nan=float(np.nanmin(full)))
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    full = guided(g, full, max(2, int(4 * W / 1920)), 1e-3 * float(np.var(full[y0:y1, x0:x1])) + 1e-6)
    M = level_matrix(WHEELS[k], PX_DEPTH)
    size = (int(CW * PX_DEPTH), int(CH * PX_DEPTH))
    d = cv2.warpAffine(full, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    rgba = np.array(Image.open(photos / 'cars' / f'{k}.webp').convert('RGBA').resize(size, Image.BILINEAR))
    a = rgba[..., 3].astype(np.float32) / 255
    d = stretch(d, a > 0.5, 1, 99.5)
    d = fill_outside(d, a)
    # A light edge-preserving pass removes the int8 model's blockiness.
    guide = cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    d = np.clip(guided(guide, d.astype(np.float32), 3, 4e-4), 0, 1)
    save(d, out / f'{k}.webp')
    print(k, 'depth', d.shape[1], 'x', d.shape[0])

# ---- on-track shots ----
for p in sorted((photos / 'action').glob('*.webp')):
    img = cv2.cvtColor(np.array(Image.open(p).convert('RGB')), cv2.COLOR_RGB2BGR)
    d = stretch(estimate(img), None, 1, 99.5)
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    d = np.clip(guided(g, d, 4, 1e-3), 0, 1)
    h, w = img.shape[:2]
    save(d, out / f'action-{p.stem}.webp', (w // 2, h // 2))
    print('action', p.stem)

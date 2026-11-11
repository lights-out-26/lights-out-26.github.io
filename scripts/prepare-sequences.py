"""Turn the burst sequences into matched web frames (photos/seq/*.webp).

For every frame of a set:
  1. find the car from its background mask (scripts/cut-out.mjs);
  2. frame it the same way every time: the car centred left to right, its
     tyres on one ground line, and scaled to fill a fixed safe area without
     the crop leaving the original photo. (The car is genuinely closer in the
     middle, head-on frame, and stays a little larger there);
  3. match exposure and colour: frames shot from the same spot are graded so
     their backgrounds have the same brightness, contrast and white balance
     across all sets (small, clamped corrections only);
  4. save as a 1600 x 900 webp.

It also writes src/data/sequences.json with where the car sits in each frame
and which way it is moving, for the motion blur in the WebGL scene.

usage: python scripts/prepare-sequences.py <raw> <masks> <public/photos> <src/data/sequences.json>
  raw    <team>-<n>.jpg from scripts/fetch-sequences.py
  masks  <team>-<n>.png from scripts/cut-out.mjs
Needs opencv-python, numpy and pillow.
"""
import json, pathlib, sys
import cv2
import numpy as np
from PIL import Image

raw, maskd, public, meta_out = (pathlib.Path(a) for a in sys.argv[1:5])
SPEC = json.load(open(pathlib.Path(__file__).with_name('sequences.json'), encoding='utf-8'))
OW, OH = 1600, 900
SAFE_W, SAFE_H = 0.84, 0.6  # the car fills at most this much of the frame
GROUND = 0.8  # tyre contact line, from the top
QUALITY = 78
(public / 'seq').mkdir(parents=True, exist_ok=True)


def load(key):
    img = cv2.imread(str(raw / f'{key}.jpg'))
    m = cv2.imread(str(maskd / f'{key}.png'), cv2.IMREAD_UNCHANGED)
    a = m[..., 3] if (m.ndim == 3 and m.shape[2] == 4) else (m if m.ndim == 2 else m[..., 0])
    a = cv2.resize(a, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255
    return img, a


def shot_time(key):
    """Capture time in seconds (DateTimeOriginal + SubSecTimeOriginal) from the original's EXIF."""
    from datetime import datetime
    ifd = Image.open(raw / f'{key}.jpg').getexif().get_ifd(0x8769)
    t = datetime.strptime(ifd[0x9003], '%Y:%m:%d %H:%M:%S').timestamp()
    return t + float('0.' + str(ifd.get(0x9291, '0')).strip())


def car_box(a):
    """Bounding box of the largest foreground region (the car, not a marshal behind it)."""
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8))
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = st[i, :4]
    return float(x), float(y), float(x + w), float(y + h)


def background_stats(img, a):
    """Mean and spread of L, and mean a/b, over the background (well clear of the car)."""
    small = cv2.resize(img, (img.shape[1] // 4, img.shape[0] // 4), interpolation=cv2.INTER_AREA)
    am = cv2.resize(a, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_AREA)
    keep = cv2.erode((am < 0.05).astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
    lab = cv2.cvtColor(small.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)[keep]
    return np.array([lab[:, 0].mean(), lab[:, 0].std(), lab[:, 1].mean(), lab[:, 2].mean()])


def grade(img, st, target):
    lab = cv2.cvtColor(img.astype(np.float32) / 255, cv2.COLOR_BGR2Lab)
    lm, ls, am, bm = st
    tl, ts, ta, tb = target
    gain = float(np.clip(ts / ls, 0.9, 1.1))
    lab[..., 0] = (lab[..., 0] - lm) * gain + lm + float(np.clip(tl - lm, -6, 6))
    lab[..., 1] += float(np.clip(ta - am, -3, 3))
    lab[..., 2] += float(np.clip(tb - bm, -3, 3))
    out = cv2.cvtColor(lab, cv2.COLOR_Lab2BGR)
    return np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)


def frame(img, box):
    H, W = img.shape[:2]
    x0, y0, x1, y1 = box
    cw, ch = x1 - x0, y1 - y0
    s = max(min(SAFE_W * OW / cw, SAFE_H * OH / ch), OW / W, OH / H)  # output px per source px
    ww, wh = OW / s, OH / s
    wx = float(np.clip((x0 + x1) / 2 - ww / 2, 0, W - ww))
    wy = float(np.clip(y1 - GROUND * wh, 0, H - wh))
    X0, Y0 = int(round(wx)), int(round(wy))
    X1, Y1 = min(W, int(round(wx + ww))), min(H, int(round(wy + wh)))
    out = cv2.resize(img[Y0:Y1, X0:X1], (OW, OH), interpolation=cv2.INTER_AREA)
    sx, sy = OW / (X1 - X0), OH / (Y1 - Y0)
    car = [(x0 - X0) * sx / OW, (y0 - Y0) * sy / OH, (x1 - X0) * sx / OW, (y1 - Y0) * sy / OH]
    return out, [round(float(np.clip(v, 0, 1)), 4) for v in car], (X0, Y0, X1 - X0, Y1 - Y0)


# Pass 1: measure every frame.
sets = {}
for team, s in SPEC['sets'].items():
    frames = []
    for n in range(1, len(s['stp']) + 1):
        key = f'{team}-{n}'
        img, a = load(key)
        frames.append(dict(key=key, img=img, alpha=a, box=car_box(a), stats=background_stats(img, a)))
    sets[team] = frames

# Grading targets: per shooting position, the average over all sets.
positions = len(SPEC['motion'])
targets = [np.mean([sets[t][k]['stats'] for t in sets], axis=0) for k in range(positions)]

# Pass 2: frame, grade and save.
meta = {'size': [OW, OH], 'motion': SPEC['motion'], 'sets': {}}
total = 0
for team, frames in sets.items():
    s = SPEC['sets'][team]
    times = [shot_time(f['key']) for f in frames]
    entry = {'driver': s['driver'], 'no': s['no'], 'seconds': round(times[-1] - times[0], 1), 'frames': []}
    for k, f in enumerate(frames):
        out, car, crop = frame(f['img'], f['box'])
        out = grade(out, f['stats'], targets[k])
        path = public / 'seq' / f'{f["key"]}.webp'
        Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB)).save(path, 'WEBP', quality=QUALITY, method=6)
        size = path.stat().st_size
        total += size
        entry['frames'].append({'src': f'seq/{f["key"]}', 'stp': s['stp'][k], 'car': car})
        print(f'{f["key"]}: crop {crop}, car {car}, L {f["stats"][0]:.1f}->{targets[k][0]:.1f}, {size / 1024:.0f} KB')
    meta['sets'][team] = entry
json.dump(meta, open(meta_out, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(f'total {total / 1024 / 1024:.2f} MB')

"""Build the pit stop sound (public/sounds/pitstop.mp3) from real recordings.

  0.0 s   team radio: the engineer calls "Box, box", the driver answers "Copy"
          (two real people, recorded for Lingua Libre, put through a radio:
          narrow band, tinny, gated hiss, the squelch opening and closing)
  2.6 s   the car stops; real wheel guns take the wheels off, then do the new
          ones up (Red Bull Racing's pit stop practice, Mexico City 2015),
          over that recording's own pit-lane sound
  4.9 s   the release: a turbo-hybrid V6 pulling away (2021 Russian GP grid)

Prints the cue times that src/sections/Pitstop.jsx uses (PIT_CUES).

usage: python scripts/prepare-pitstop.py <dir with the originals> [public/sounds]
  The originals keep their Commons names, with spaces or underscores (a video
  may be its Commons transcode, "<name>.240p.vp9.webm"):
    Red Bull Racing Pit Stop Practice.webm
    2021 Russian Grand Prix - start for warm-up.webm
    LL-Q1860 (eng)-Vealhurl-box.wav
    LL-Q1860 (eng)-Grendelkhan-copy.wav
  (Commons' .mp3 transcodes of the two .wav files will do.)
Needs ffmpeg on PATH (or FFMPEG=...), numpy and scipy.
"""
import json, os, pathlib, re, subprocess, sys

import numpy as np
from scipy.signal import butter, iirnotch, sosfilt, tf2sos

FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
SR = 44100
src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'public/sounds')
rng = np.random.default_rng(2026)

PIT = 'Red Bull Racing Pit Stop Practice.webm'
GRID = '2021 Russian Grand Prix - start for warm-up.webm'
ENGINEER = 'LL-Q1860 (eng)-Vealhurl-box.wav'
DRIVER = 'LL-Q1860 (eng)-Grendelkhan-copy.wav'

# The stop, in seconds from the start of the sound.
STOP = 2.6            # the car stops
STATIONARY = 2.30     # until the release
GUNS_OFF = 2.66       # wheel guns undo the old wheels
GUNS_ON = 3.62        # and do the new ones up
DROP = 0.30           # jacks drop this long after the guns finish
# In the pit stop practice recording: two clusters of wheel guns (hammering at
# 30-37 blows a second), and quiet stretches of the same pit lane between them.
OFF_BURST = (20.86, 21.30)
ON_BURST = (24.18, 24.62)
GRID_PULL = 6.95      # the grid pulling away in the Russian GP recording


def find(name):
    for cand in (name, name.replace(' ', '_')):
        if (src / cand).exists():
            return src / cand
        hits = sorted(src.glob(re.sub(r'([\[\]*?])', r'[\1]', cand) + '.*'))
        if hits:
            return hits[0]
    raise SystemExit(f'missing original: {name}')


def load(name, start=0.0, length=None, af=None):
    cmd = [FFMPEG, '-v', 'error', '-ss', str(start)]
    if length:
        cmd += ['-t', str(length)]
    cmd += ['-i', str(find(name)), '-vn', '-ac', '1', '-ar', str(SR)]
    if af:
        cmd += ['-af', af]
    cmd += ['-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).astype(np.float64)


def band(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


def gain_to(x, target_db):
    return x * 10 ** ((target_db - db(x)) / 20)


def fade(x, fin=0.005, fout=0.05):
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def trim(x, floor_db=-30, pad=0.01):
    """Cut the silence before and after a spoken word."""
    w = int(0.01 * SR)
    env = np.array([np.sqrt(np.mean(x[i:i + w] ** 2)) for i in range(0, len(x) - w, w)])
    on = np.where(20 * np.log10(env / env.max() + 1e-12) > floor_db)[0]
    a, b = max(0, on[0] * w - int(pad * SR)), min(len(x), (on[-1] + 1) * w + int(pad * SR))
    return x[a:b]


def radio(x):
    """A two-way radio: a narrow telephone band with a tinny lift, gated hiss.

    All linear on purpose. Overdriving the voice, the usual radio trick,
    smears the start of "box" until it is heard as "fox". The hiss is gated as
    on a digital radio: it fades out just before each word and comes back
    after, since hiss in the short silence before a "b" also sounds like an "f".
    """
    y = band(x, 300, 3400)
    # A peaking lift around 1.6 kHz (RBJ biquad, +6 dB): the radio's tinny edge.
    w0 = 2 * np.pi * 1600 / SR
    amp, alpha = 10 ** (6 / 40), np.sin(w0) / (2 * 1.2)
    b = [1 + alpha * amp, -2 * np.cos(w0), 1 - alpha * amp]
    a = [1 + alpha / amp, -2 * np.cos(w0), 1 - alpha / amp]
    y = sosfilt(tf2sos(b, a), y)
    y = y / (np.abs(y).max() + 1e-12) * 0.8
    w = int(0.015 * SR)
    env = np.convolve(np.abs(x), np.ones(w) / w, 'same')
    speaking = env > env.max() * 0.03
    ahead, after = int(0.12 * SR), int(0.05 * SR)
    near = np.convolve(speaking.astype(float), np.ones(ahead + after), 'full')[after:after + len(x)] > 0
    gate = np.convolve(np.where(near, 0.0, 1.0), np.ones(w) / w, 'same')
    hiss = band(rng.standard_normal(len(y)), 600, 4200) * 0.012 * gate
    return y + hiss


def squelch(open_=True):
    """The click and rush of the radio opening, or the burst as it closes."""
    n = int((0.05 if open_ else 0.14) * SR)
    t = np.arange(n) / SR
    noise = band(rng.standard_normal(n), 900, 5200)
    env = np.exp(-t / (0.012 if open_ else 0.045))
    click = np.zeros(n)
    click[:int(0.002 * SR)] = 1.0
    return (noise * env * (0.25 if open_ else 0.35) + click * 0.4) * 0.9


class Track:
    def __init__(self, seconds):
        self.x = np.zeros(int(seconds * SR))

    def put(self, sig, at):
        i = int(at * SR)
        sig = sig[:max(0, len(self.x) - i)]
        self.x[i:i + len(sig)] += sig


def transmission(word_takes, background=None):
    """One radio call: squelch opens, the words, squelch closes. Returns (signal, voice onset)."""
    gap = int(0.04 * SR)
    voice = np.concatenate(sum(([w, np.zeros(gap)] for w in word_takes), [])[:-1])
    lead, tail = int(0.12 * SR), int(0.08 * SR)
    body = np.concatenate([np.zeros(lead), voice, np.zeros(tail)])
    if background is not None:
        bg = np.resize(background, len(body))
        body = body + band(bg, 300, 3400) * 0.07
    body = radio(body)
    sig = np.concatenate([squelch(True)[:int(0.03 * SR)] * 0.8, body, squelch(False)])
    return sig, (0.03 * SR + lead) / SR


def main():
    total = STOP + STATIONARY + 3.0
    tr = Track(total)
    go = STOP + STATIONARY

    # ---- team radio ----
    # A quick "Box, box": the whole word each time (the final "ks" is what makes it "box"), the second a touch quicker.
    box = fade(trim(load(ENGINEER, af='atempo=1.15')), 0.002, 0.04)
    box2 = fade(trim(load(ENGINEER, af='atempo=1.3')), 0.002, 0.04)
    grid_idle = load(GRID, 1.0, 2.0)
    call, call_on = transmission([box, box2])
    copy = trim(load(DRIVER, af='atempo=1.1'))
    reply, reply_on = transmission([copy], background=grid_idle)
    t_call = 0.22 - call_on
    tr.put(gain_to(call, -17), t_call)
    t_reply = 1.52 - reply_on
    tr.put(gain_to(reply, -15.5), t_reply)

    # ---- the pit lane: its own sound under everything, then the guns ----
    notch = lambda y: sosfilt(tf2sos(*iirnotch(1080, 6, fs=SR)), sosfilt(tf2sos(*iirnotch(2160, 8, fs=SR)), y))
    bed = notch(load(PIT, 1.0, STOP + 0.2))
    tr.put(fade(gain_to(bed, -34), 0.6, 0.15), 0.0)
    pre = 0.1
    tail = 0.06
    off = notch(load(PIT, OFF_BURST[0] - pre, OFF_BURST[1] - OFF_BURST[0] + pre + tail))
    on = notch(load(PIT, ON_BURST[0] - pre, ON_BURST[1] - ON_BURST[0] + pre + tail))
    gap_len = GUNS_ON - pre - (GUNS_OFF - pre + len(off) / SR) + 0.1
    between = notch(load(PIT, 22.75, max(0.2, gap_len)))
    after = notch(load(PIT, 25.05, 0.8))
    level = db(np.concatenate([off, on]))
    tr.put(fade(off, 0.04, 0.08), GUNS_OFF - pre)
    tr.put(fade(between, 0.05, 0.05), GUNS_OFF - pre + len(off) / SR - 0.05)
    tr.put(fade(on, 0.04, 0.08), GUNS_ON - pre)
    tr.put(fade(after, 0.05, 0.4), GUNS_ON - pre + len(on) / SR - 0.05)
    done = GUNS_ON + (ON_BURST[1] - ON_BURST[0]) + tail

    # ---- the release ----
    leave = load(GRID, GRID_PULL - 0.15, 2.85)
    leave = fade(gain_to(leave, level - 3), 0.12, 1.3)
    tr.put(leave, go - 0.15 + 0.05)

    y = tr.x / (np.abs(tr.x).max() + 1e-12) * 0.89
    out.mkdir(parents=True, exist_ok=True)
    wav = out / 'pitstop.tmp.wav'
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-af', 'loudnorm=I=-17:TP=-1.5:LRA=11', '-ar', str(SR), str(wav)], input=y.tobytes(), check=True)
    dst = out / 'pitstop.mp3'
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', str(wav), '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '128k', str(dst)], check=True)
    wav.unlink()
    cues = {'box': 0.22, 'copy': 1.52, 'stop': STOP, 'off': GUNS_OFF, 'on': GUNS_ON, 'done': round(done, 2),
            'down': round(done + DROP, 2), 'go': round(go, 2), 'end': round(total, 2)}
    print(f'{dst}: {dst.stat().st_size / 1024:.0f} KB')
    print('PIT_CUES =', json.dumps(cues))


main()

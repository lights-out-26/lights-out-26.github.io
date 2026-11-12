"""Cut the site's sounds from the original Commons recordings (scripts/sounds.json).

Each sound is trimmed, faded, loudness-normalised (EBU R128, two passes) and
saved as 128 kbps MP3 in public/sounds/. Loops get no fades.

usage: python scripts/prepare-sounds.py <dir with the originals> [public/sounds] [name ...]
  The originals keep their Commons names, with spaces or underscores. For a
  video, its Commons transcode (e.g. "<name>.240p.vp9.webm") will do: only
  the soundtrack is used. Give sound names to rebuild just those.
Needs ffmpeg on PATH (or set FFMPEG=/path/to/ffmpeg).
"""
import json, os, pathlib, re, subprocess, sys

SPEC = json.load(open(pathlib.Path(__file__).with_name('sounds.json'), encoding='utf-8'))
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
src = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'public/sounds')
out.mkdir(parents=True, exist_ok=True)
only = set(sys.argv[3:])


def find(name):
    for cand in (name, name.replace(' ', '_')):
        if (src / cand).exists():
            return src / cand
        transcodes = sorted(src.glob(glob_escape(cand) + '.*'))
        if transcodes:
            return transcodes[0]
    raise SystemExit(f'missing original: {name}')


def glob_escape(name):
    return re.sub(r'([\[\]*?])', r'[\1]', name)


total = 0
for key, s in SPEC['sounds'].items():
    if only and key not in only:
        continue
    length = s['end'] - s['start']
    chain = [f'atrim=start={s["start"]}:end={s["end"]}', 'asetpts=PTS-STARTPTS']
    if s.get('fadeIn'):
        chain.append(f'afade=t=in:d={s["fadeIn"]}')
    if s.get('fadeOut'):
        chain.append(f'afade=t=out:st={length - s["fadeOut"]:.3f}:d={s["fadeOut"]}')
    base = ','.join(chain)
    # Pass 1: measure loudness.
    probe = subprocess.run([FFMPEG, '-hide_banner', '-nostats', '-i', str(find(s['file'])), '-vn', '-af',
                            f'{base},loudnorm=I={s["lufs"]}:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                           capture_output=True, text=True)
    m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', probe.stderr).group(0))
    # Pass 2: normalise with the measured values (linear, so the dynamics of the launch survive).
    norm = (f'loudnorm=I={s["lufs"]}:TP=-1.5:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:'
            f'measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true')
    dst = out / f'{key}.mp3'
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(find(s['file'])), '-vn', '-af', f'{base},{norm}',
                    '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '128k', str(dst)], check=True)
    size = dst.stat().st_size
    total += size
    print(f'{key}: {s["file"]} {s["start"]}-{s["end"]} s, {m["input_i"]} -> {s["lufs"]} LUFS, {size / 1024:.0f} KB')
print(f'total {total / 1024:.0f} KB')

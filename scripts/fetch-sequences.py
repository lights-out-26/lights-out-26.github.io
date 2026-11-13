"""Download the original Commons files listed in scripts/sequences.json.

Writes <raw>/<team>-<n>.jpg (n = 1, 2, 3 in shooting order), checks each file's
size against Commons, and prints the author and licence that Commons reports
for it, so they can be checked against the credits.

usage: python scripts/fetch-sequences.py <raw>
"""
import json, pathlib, re, sys, time, urllib.error, urllib.parse, urllib.request

SPEC = json.load(open(pathlib.Path(__file__).with_name('sequences.json'), encoding='utf-8'))
UA = 'lights-out-26-photo-pipeline/1.0'
PAUSE = 6  # seconds between downloads; Wikimedia rate-limits bulk downloads of originals
raw = pathlib.Path(sys.argv[1])
raw.mkdir(parents=True, exist_ok=True)


def get(url, tries=6):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=120).read()
        except urllib.error.HTTPError as err:
            if err.code != 429 and err.code < 500:
                raise
            wait = int(err.headers.get('Retry-After') or 0) or 60 * (i + 1)
            print(f'  {err.code}, waiting {wait}s')
            time.sleep(wait)
        except OSError as err:  # flaky connection
            print('  retry', i + 1, err)
            time.sleep(10 * (i + 1))
    raise SystemExit(f'could not fetch {url}')


for team, s in SPEC['sets'].items():
    for n, stp in enumerate(s['stp'], 1):
        title = 'File:' + SPEC['file'].format(stp=stp)
        q = urllib.parse.urlencode(dict(action='query', format='json', titles=title, prop='imageinfo', iiprop='url|size|extmetadata',
                                        iiextmetadatafilter='LicenseShortName|Artist'))
        page = next(iter(json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))['query']['pages'].values()))
        info = page['imageinfo'][0]
        meta = info['extmetadata']
        artist = re.sub('<[^>]+>', '', meta['Artist']['value']).strip()
        licence = meta['LicenseShortName']['value']
        dst = raw / f'{team}-{n}.jpg'
        if not (dst.exists() and dst.stat().st_size == info['size']):
            data = get(info['url'])
            if len(data) != info['size']:
                raise SystemExit(f'{title}: got {len(data)} bytes, expected {info["size"]}')
            dst.write_bytes(data)
            time.sleep(PAUSE)
        print(f'{dst.name}: {title[5:]} | {artist} | {licence}')
        if licence != SPEC['licence'] or artist != SPEC['author']:
            print('  !! licence or author differs from sequences.json')

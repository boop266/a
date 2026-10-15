#!/usr/bin/env python3
"""KanjiVG の SVG を必要な字だけ取ってくる（キャッシュあり）。
使い方: python3 tools/fetch_kvg.py 木林森...   または  --from-file chars.txt
"""
import os, sys, urllib.request, concurrent.futures as cf

CACHE = os.path.join(os.path.dirname(__file__), '..', '.kvg-cache')
URL = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/{}.svg'

def fetch(ch):
    code = '%05x' % ord(ch)
    path = os.path.join(CACHE, code + '.svg')
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return ch, True
    try:
        with urllib.request.urlopen(URL.format(code), timeout=30) as r:
            data = r.read()
        with open(path, 'wb') as f:
            f.write(data)
        return ch, True
    except Exception as e:
        return ch, False

def main():
    os.makedirs(CACHE, exist_ok=True)
    args = sys.argv[1:]
    chars = ''
    if args and args[0] == '--from-file':
        chars = open(args[1], encoding='utf-8').read()
    else:
        chars = ''.join(args)
    chars = sorted(set(c for c in chars if ord(c) > 0x2e80))
    missing = []
    with cf.ThreadPoolExecutor(16) as ex:
        for ch, ok in ex.map(fetch, chars):
            if not ok:
                missing.append(ch)
    print('chars', len(chars), 'missing', ''.join(missing))

if __name__ == '__main__':
    main()

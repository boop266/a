#!/usr/bin/env python3
"""画面の文字に使う字体（Klee One, SIL OFL 1.1）を、使う字だけに絞って woff2 にし、CSS に埋め込む。
使い方: python3 tools/subset_font.py chars.txt out.css
字体ファイルは .fonts/ に置く（無ければ取ってくる）。
"""
import os, sys, base64, urllib.request
from fontTools import subset

ROOT = os.path.join(os.path.dirname(__file__), '..')
FONTS = os.path.join(ROOT, '.fonts')
SRC = 'https://raw.githubusercontent.com/google/fonts/main/ofl/kleeone/{}'
FACES = [('KleeOne-Regular.ttf', 400), ('KleeOne-SemiBold.ttf', 600)]

def ensure(name):
    os.makedirs(FONTS, exist_ok=True)
    p = os.path.join(FONTS, name)
    if not os.path.exists(p):
        with urllib.request.urlopen(SRC.format(name), timeout=120) as r:
            open(p, 'wb').write(r.read())
    return p

def main():
    chars = open(sys.argv[1], encoding='utf-8').read()
    out = sys.argv[2]
    css = []
    for name, weight in FACES:
        src = ensure(name)
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        opts.notdef_outline = True
        font = subset.load_font(src, opts)
        sub = subset.Subsetter(opts)
        sub.populate(text=chars)
        sub.subset(font)
        tmp = out + '.' + str(weight) + '.woff2'
        subset.save_font(font, tmp, opts)
        data = open(tmp, 'rb').read()
        os.remove(tmp)
        b64 = base64.b64encode(data).decode('ascii')
        css.append("@font-face{font-family:'Shizuku Klee';font-style:normal;font-weight:%d;font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');}" % (weight, b64))
        sys.stderr.write('%s: %d bytes\n' % (name, len(data)))
    open(out, 'w', encoding='utf-8').write('\n'.join(css))

if __name__ == '__main__':
    main()

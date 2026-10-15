#!/usr/bin/env python3
"""KanjiVG の SVG（.kvg-cache）を、ゲームで使う小さなデータ（JS）に変える。
各字: 画ごとの「止め・払い・はね」の種類 + 3次ベジェの点（109四方を×2した整数）
      + 部品（どの画からどの画までが、どの字の形か）
使い方: python3 tools/kvg2js.py chars.txt > src/gen_kvg.js
"""
import os, re, sys, json
import xml.etree.ElementTree as ET

CACHE = os.path.join(os.path.dirname(__file__), '..', '.kvg-cache')

HOOK = set('㇚㇆㇈㇉㇟㇂㇃㇌㇖㇡㇠')
TAPER = set('㇒㇀㇇㇙㇜㇊㇋')
RSWEEP = set('㇏㇝')
DOT = set('㇔')

def stroke_kind(t):
    for c in t or '':
        if 0x31C0 <= ord(c) <= 0x31EF:
            if c in HOOK: return 'h'
            if c in TAPER: return 't'
            if c in RSWEEP: return 'r'
            if c in DOT: return 'd'
            return 's'
    return 's'

TOK = re.compile(r'[MmCcSsLlZzHhVvQqTt]|-?\d*\.?\d+(?:e-?\d+)?')

def parse_path(d):
    toks = TOK.findall(d)
    i = 0; cmd = None
    cx = cy = 0.0; sx = sy = 0.0
    lastc2 = None
    segs = []  # list of (p0,c1,c2,p3)
    start = None
    def num():
        nonlocal i
        v = float(toks[i]); i += 1; return v
    while i < len(toks):
        t = toks[i]
        if re.match(r'[A-Za-z]', t):
            cmd = t; i += 1
            if cmd in 'Zz':
                if (cx, cy) != (sx, sy):
                    segs.append(((cx,cy),(cx,cy),(sx,sy),(sx,sy)))
                cx, cy = sx, sy
                continue
        if cmd in 'Mm':
            x, y = num(), num()
            if cmd == 'm': x += cx; y += cy
            cx, cy = x, y; sx, sy = x, y
            if start is None: start = (x, y)
            cmd = 'L' if cmd == 'M' else 'l'
            lastc2 = None
        elif cmd in 'Cc':
            x1,y1,x2,y2,x,y = [num() for _ in range(6)]
            if cmd == 'c':
                x1+=cx;y1+=cy;x2+=cx;y2+=cy;x+=cx;y+=cy
            segs.append(((cx,cy),(x1,y1),(x2,y2),(x,y)))
            lastc2 = (x2,y2); cx,cy = x,y
        elif cmd in 'Ss':
            x2,y2,x,y = [num() for _ in range(4)]
            if cmd == 's':
                x2+=cx;y2+=cy;x+=cx;y+=cy
            if lastc2 is not None:
                x1 = 2*cx - lastc2[0]; y1 = 2*cy - lastc2[1]
            else:
                x1, y1 = cx, cy
            segs.append(((cx,cy),(x1,y1),(x2,y2),(x,y)))
            lastc2 = (x2,y2); cx,cy = x,y
        elif cmd in 'Ll':
            x, y = num(), num()
            if cmd == 'l': x+=cx; y+=cy
            segs.append(((cx,cy),(cx+(x-cx)/3,cy+(y-cy)/3),(cx+2*(x-cx)/3,cy+2*(y-cy)/3),(x,y)))
            lastc2 = None; cx,cy = x,y
        elif cmd in 'Hh':
            x = num(); y = cy
            if cmd == 'h': x += cx
            segs.append(((cx,cy),(cx+(x-cx)/3,cy),(cx+2*(x-cx)/3,cy),(x,y)))
            lastc2=None; cx=x
        elif cmd in 'Vv':
            y = num(); x = cx
            if cmd == 'v': y += cy
            segs.append(((cx,cy),(cx,cy+(y-cy)/3),(cx,cy+2*(y-cy)/3),(x,y)))
            lastc2=None; cy=y
        else:
            raise ValueError('unsupported cmd ' + str(cmd) + ' in ' + d)
    return start, segs

def q(v):
    return int(round(v * 2))

def local(tag):
    return tag.split('}')[-1]

def kattr(el, name):
    for k, v in el.attrib.items():
        if k.split('}')[-1] == name:
            return v
    return None

def convert(ch):
    code = '%05x' % ord(ch)
    path = os.path.join(CACHE, code + '.svg')
    root = ET.parse(path).getroot()
    # stroke group
    sp = None
    for g in root.iter():
        if local(g.tag) == 'g' and (g.get('id') or '').startswith('kvg:StrokePaths'):
            sp = g; break
    strokes = []
    kinds = []
    pid2idx = {}
    for p in sp.iter():
        if local(p.tag) == 'path':
            d = p.get('d')
            start, segs = parse_path(d)
            nums = [q(start[0]), q(start[1])]
            for (p0,c1,c2,p3) in segs:
                nums += [q(c1[0]),q(c1[1]),q(c2[0]),q(c2[1]),q(p3[0]),q(p3[1])]
            pid2idx[p.get('id')] = len(strokes)
            strokes.append(','.join(str(n) for n in nums))
            kinds.append(stroke_kind(kattr(p, 'type')))
    # components: walk groups, collect (element, firstStroke, lastStroke+1, position, depth)
    comps = []
    top = None
    for g in sp:
        if local(g.tag) == 'g':
            top = g; break
    def walk(g, depth):
        idxs = [pid2idx[p.get('id')] for p in g.iter() if local(p.tag) == 'path']
        if not idxs: return
        el = kattr(g, 'element')
        if depth > 0 and el:
            comps.append([el, min(idxs), max(idxs)+1, kattr(g,'position') or '', depth])
        for c in g:
            if local(c.tag) == 'g':
                walk(c, depth+1)
    if top is not None:
        walk(top, 0)
    return {'k': ''.join(kinds), 's': strokes, 'c': comps}

def main():
    chars = open(sys.argv[1], encoding='utf-8').read()
    chars = sorted(set(c for c in chars if ord(c) > 0x2e80 and not (0x3000 <= ord(c) <= 0x303f) and not (0xff00 <= ord(c) <= 0xffef)))
    out = {}
    bad = []
    for ch in chars:
        try:
            out[ch] = convert(ch)
        except FileNotFoundError:
            bad.append(ch)
    sys.stderr.write('converted %d, missing %s\n' % (len(out), ''.join(bad)))
    js = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    sys.stdout.write('// 漢字の筆順データ: KanjiVG (C) Ulrich Apel, CC BY-SA 3.0  https://kanjivg.tagaini.net\n')
    sys.stdout.write('const KVG=' + js + ';\n')

if __name__ == '__main__':
    main()

// ════════════════ ドット絵の質感（壁・窓・扉・床・屋根） ════════════════
const TXW = 12, TXH = 29;// 壁1マスぶん：横12×縦29ピクセル（高さ2.4）
const TEX = {}; const texKey = (...a) => a.join('|');
function noiseAt(x, y, s) { return (hash(x * 31 + s, y * 17 + s * 3) - .5) }
// 壁の地
function wallTex(kind, base, v = 0) {
  const id = texKey('w', kind, base, v); if (TEX[id]) return TEX[id];
  const b = hx(base), s = v * 97 + kind.length * 13;
  const streak = [Math.floor(hash(s, 1) * 12), Math.floor(hash(s, 2) * 12)], slen = [6 + hash(s, 3) * 14 | 0, 4 + hash(s, 4) * 10 | 0];
  const t = mkTex(TXW, TXH, (x, y) => {
    let f = 1, n = noiseAt(x, y, s) * 10;
    switch (kind) {
      case 'conc': if (x === 0) f -= .09; if (y === 14) f -= .06; if (y === 0) f -= .1; for (let i = 0; i < 2; i++)if (x === streak[i] && y < slen[i]) f -= .07 * (1 - y / slen[i]); if (y > 25) f -= .05 * (y - 25); break;
      case 'siding': { const r = y % 3; if (r === 0) f -= .16; if (r === 1) f += .06; if (x === 0) f += .05; if (y > 26) f -= .12; n *= .5; break }
      case 'plaster': if (y > 24) { f = .62; if (y === 25) f = .5; n *= 1.4 } if (y === 0) f -= .12; if (x === 0 && y <= 24) f -= .04; break;
      case 'board': if (x % 4 === 0) f -= .16; if (y < 2) f -= .12; n += Math.sin(y * .9 + x * 3) * 4; if (y > 26) f -= .1; break;
      case 'log': { const r = y % 4; if (r === 0) f -= .28; if (r === 1) f += .1; if (r === 3) f -= .08; n += Math.sin(x * 1.3 + y) * 3; break }
      case 'tiles': if (y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) f -= .1; if (y > 26) f -= .08; break;
      case 'school': if (y === 12 || y === 13) f -= .1; if (y === 0) f -= .1; if (x === 0) f -= .05; if (y > 26) f -= .14; break;
      case 'metal': { f = 1 + (y < 6 ? .06 : 0) - (y > 24 ? .08 : 0); if (y === 19 || y === 20) return col3('#2f9a5a', 1, n * .4); if (y === 21) return col3('#e07a2a', 1, n * .4); if (x === 0) f -= .08; n *= .4; break }
      case 'shop': if (y >= 1 && y <= 3) return col3('#3a9a5a', 1, n * .3); if (y === 4) return col3('#f0f0f0'); if (y >= 5 && y <= 6) return col3('#3a6ab8', 1, n * .3); if (x === 0) f -= .05; if (y > 26) f -= .1; n *= .4; break;
      case 'shaft': if (x === 0 || x === 11) f -= .12; if ((x === 2 || x === 9) && y % 6 === 3) f += .2; if (y % 12 === 0) f -= .08; break;
      case 'inner': if (y > 26) return col3('#7a5a3a', 1, n); if (y === 26) return col3('#5a4028'); if ((x * 3 + y) % 7 === 0) f -= .03; n *= .4; break;
      case 'innerjp': if (x <= 1) return col3('#8a6440', x === 0 ? .85 : 1, n * .5); if (y < 3) return col3('#8a6440', y === 2 ? .8 : 1); if (y > 26) return col3('#6a4a2e', 1, n * .5); n *= .5; break;
      case 'vermil': if (x <= 1 || y < 2) return col3('#c8402a', x === 0 ? .8 : 1, n); n *= .6; break;
      case 'haunt': { if (x % 3 === 0) f -= .25; if (hash(x * 7 + s, Math.floor(y / 5)) > .9) f -= .35; if (v === 1 && x >= 4 && x <= 7 && y >= 9 && y <= 17) return col3('#e8dcc0', 1, n * .5 + (y === 12 ? -40 : 0)); if (y > 25) f -= .15; n *= 1.4; break }
      case 'pastel': { if (y < 5) return col3(x % 4 < 2 ? '#e8504a' : '#f8f4ec', 1, n * .3); if (y === 5) return col3('#c8a040'); if (y > 25) return col3('#8a7a6a', 1, n * .5); if (x === 0) f -= .05; n *= .5; break }
      case 'brick': { const row = Math.floor(y / 3), bx = (x + (row % 2) * 3) % 6; if (y % 3 === 0 || bx === 0) f -= .22; if (y > 26) f -= .1; n += noiseAt(Math.floor((x + (row % 2) * 3) / 6), row, 3) * 18; break }
    }
    return [clamp(b[0] * f + n, 0, 255), clamp(b[1] * f + n, 0, 255), clamp(b[2] * f + n, 0, 255)];
  });
  return TEX[id] = t;
}
// 窓（壁の上に重ねる）。v：0-7ふつう 8-10カーテン 11-12割れ 13-14板 15暗い
const CURT = ['#c84a4a', '#4a7ac8', '#d8b84a', '#7ab86a', '#b87ac8', '#e8e0d0'];
function winTex(v, frame = '#c8ccd0', lit = false, tall = false) {
  const id = texKey('win', v, frame, lit, tall); if (TEX[id]) return TEX[id];
  const y0 = tall ? 3 : 6, y1 = tall ? 26 : 18, x0 = 1, x1 = 10, fr = hx(frame), cur = hx(CURT[v % 6]), side = v % 2;
  const t = mkTex(TXW, TXH, (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return null;
    if (x === x0 || x === x1 || y === y0 || y === y1 || (!tall && x === 5 || tall && x === 5 && false) || (tall && y === 15)) return [fr[0], fr[1], fr[2]];
    if (v === 13 || v === 14) { const pl = v === 13 ? Math.floor((y - y0) / 3) % 2 : Math.floor((x + y) / 3) % 2; return col3('#7a5a38', pl ? 1 : .8, noiseAt(x, y, 5) * 12) }
    const gy = (y - y0) / (y1 - y0);
    if (lit) { if (v >= 8 && v <= 10 && (side ? x > 6 : x < 5)) return col3(CURT[v % 6], 1.15, 30); const w = 1 - Math.abs(gy - .5) * .5; return [255 * w, 210 * w, 130 * w] }
    if (v === 15) return [26, 30, 38];
    if (v === 11 || v === 12) { const cx = v === 11 ? 4 : 7, cy = y0 + 5; const d = Math.hypot(x - cx, (y - cy) * .8); if (d < 2.4 + noiseAt(x, y, 9) * 2) return [18, 20, 26]; if (Math.abs((x - cx) - (y - cy)) < .6 || Math.abs((x - cx) + (y - cy) * .5) < .5) return [230, 236, 240] }
    if (v >= 8 && v <= 10 && (side ? x > 6 : x < 5)) { const fold = (x % 2) ? .9 : 1.05; return col3(CURT[v % 6], fold, 0) }
    let r = lerp(168, 92, gy), g = lerp(196, 118, gy), b = lerp(220, 150, gy);
    if ((x - y0 + y) % 9 === 0 || (x - y0 + y) % 9 === 1) { r += 34; g += 34; b += 30 }
    return [r, g, b];
  });
  return TEX[id] = t;
}
// 扉（壁の上に重ねる）
function doorTex(kind, open = false) {
  const id = texKey('door', kind, open); if (TEX[id]) return TEX[id];
  const t = mkTex(TXW, TXH, (x, y) => {
    if (kind === 'E') { if (y < 4 && y > 0 && x > 3 && x < 8) return [30, 26, 22]; if (x < 1 || x > 10 || y < 5) return null; if (x === 1 || x === 10 || y === 5) return [90, 96, 104]; if (x === 5 || x === 6) return [120, 126, 134]; return col3('#b8bec6', 1 - (y - 5) / 80, noiseAt(x, y, 3) * 4) }
    if (x < 2 || x > 9 || y < 4) return null;
    if (open) { if (x === 2 || x === 9 || y === 4) return [70, 60, 50]; return [24, 22, 24] }
    if (x === 2 || x === 9 || y === 4) return kind === 'G' ? [180, 186, 192] : [60, 44, 30];
    switch (kind) {
      case 'D': { if (x === 8 && y === 17) return [210, 190, 120]; const p = (y > 6 && y < 14 || y > 16 && y < 26) && x > 3 && x < 8; return col3('#7a5636', p ? .9 : 1.05, noiseAt(x, y, 7) * 6) }
      case 'G': { if (x === 5 || x === 6) return [180, 186, 192]; const gy = (y - 4) / 24; return [lerp(170, 100, gy), lerp(196, 126, gy), lerp(214, 150, gy)] }
      case 'S': { if (x % 3 === 0 || y % 4 === 0) return [150, 110, 70]; return [236, 230, 214] }
      case 'gate': { if (x % 2 === 0) return [80, 86, 94]; return null }
      case 'T': return [30, 32, 36];
    }
    return [120, 90, 60];
  });
  return TEX[id] = t;
}
// 床（1マス 12×12 を菱形に貼る）
function floorTex(fm, v = 0) {
  const id = texKey('f', fm, v); if (TEX[id]) return TEX[id];
  const t = mkTex(12, 12, (x, y) => {
    const n = noiseAt(x, y, fm * 11 + v) * 10;
    switch (fm) {
      case FM.tile: { const g = (x % 6 === 0 || y % 6 === 0) ? .86 : 1; return col3('#d8d4ca', g, n * .5) }
      case FM.wood: { const r = Math.floor(y / 3), seam = y % 3 === 0 || (x + r * 5) % 12 === 0; return col3(r % 2 ? '#a87e50' : '#9a7248', seam ? .8 : 1, n) }
      case FM.carpet: return col3(['#7a5a6a', '#5a6a8a', '#6a7a5a'][v % 3], 1, n * .7);
      case FM.conc: return col3('#8e8b84', 1, n);
      case FM.metal: return col3('#6a6e74', (x + y) % 4 === 0 ? 1.15 : 1, n * .5);
      case FM.roof: { const d = (x === 0 || y === 0) ? .9 : 1; return col3('#9a968e', d, n) }
      case FM.tatami: { if (x === 0 || x === 11) return col3('#3a4a2a', 1, n * .3); const w = (y % 2) ? 1 : .94; return col3('#c8c08a', w, n * .6) }
      case FM.lino: return col3((x + y * 3) % 11 === 0 ? '#8aa898' : '#a8c4b4', 1, n * .4);
      case FM.deck: { const seam = x % 4 === 0; return col3('#9a7a58', seam ? .78 : 1, n) }
      case FM.stone: { const s = (x % 6 === 0 || (y + (Math.floor(x / 6) % 2) * 3) % 6 === 0); return col3('#a8a49a', s ? .82 : 1, n) }
      case FM.train: { if (y === 0 || y === 11) return col3('#5a5e66'); return col3('#8a8e94', (x % 3 === 0) ? 1.05 : 1, n * .4) }
    }
    return col3('#888888', 1, n);
  });
  return TEX[id] = t;
}
// 屋根の瓦（くり返し模様）
function roofTex(kind) {
  const id = texKey('r', kind); if (TEX[id]) return TEX[id];
  const base = { kawara: '#4a5262', red: '#a84a32', tin: '#5a7a6a', blue: '#3e5a7a', copper: '#4a7a6a', brown: '#6a5040', train: '#a8acb2' }[kind] || '#555';
  const t = mkTex(12, 12, (x, y) => {
    const n = noiseAt(x, y, kind.length * 7) * 8;
    if (kind === 'tin' || kind === 'train') { return col3(base, x % 3 === 0 ? 1.18 : (x % 3 === 2 ? .82 : 1), n * .5) }
    const r = y % 4, off = Math.floor(y / 4) % 2 ? 3 : 0, cx = (x + off) % 6;
    let f = 1; if (r === 0) f = 1.2; if (r === 3) f = .7; if (cx === 0) f *= .82; if (cx === 1) f *= 1.06;
    return col3(base, f, n);
  });
  return TEX[id] = t;
}
let PAT = {}; const pattern = (c, tex) => PAT[tex.__id || (tex.__id = Math.random())] || (PAT[tex.__id] = c.createPattern(tex, 'repeat'));

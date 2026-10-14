// ════════════════ 描く（地面・壁・物・影・光・空気） ════════════════
// ───────── 地面の絵 ─────────
const GS = 12;
const NT = new Float32Array(65536); for (let i = 0; i < 65536; i++)NT[i] = Math.random() - .5;
const nz = (x, y) => NT[(y & 255) * 256 + (x & 255)];
const gtex = mkCanvas(GW * GS, GH * GS);
(function buildGround() {
  const g = gtex.getContext('2d'), W = GW * GS, im = g.createImageData(W, GH * GS), d = im.data;
  const TV = new Float32Array(N); for (let y = 0; y < GH; y++)for (let x = 0; x < GW; x++)TV[key(x, y)] = fbm(x / 7, y / 7);
  const ft = {}; for (const f of Object.values(FM)) { if (!f) continue; const c = floorTex(f); ft[f] = c.getContext('2d').getImageData(0, 0, 12, 12).data }
  const set = (o, r, gg, b) => { d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255 };
  for (let ty = 0; ty < GH; ty++)for (let tx = 0; tx < GW; tx++) {
    const k = key(tx, ty), t = GT[k], tv = TV[k];
    const near = (tt) => [GT[k - 1], GT[k + 1], GT[k - GW], GT[k + GW]].includes(tt);
    for (let py = 0; py < GS; py++)for (let px = 0; px < GS; px++) {
      const X = tx * GS + px, Y = ty * GS + py, o = (Y * W + X) * 4, n = nz(X, Y), n2 = nz(X >> 1, Y >> 1);
      let r = 100, gg = 100, b = 100;
      if (t >= 100) { const f = ft[t - 100] || ft[1], q = (py * 12 + px) * 4; set(o, f[q], f[q + 1], f[q + 2]); continue }
      let tt = t;
      // 川岸はタイルでなく、なめらかな線で（水→濡れた砂→小石の浜→草）
      if (t === TG.water || t === TG.bank) { const dd = Math.abs((X + .5) / GS - riverX((Y + .5) / GS)), e = 4.9 + n2 * .7; if (dd < 3.6) { set(o, 34 + n * 8, 66 + n * 8, 78 + n * 8); continue } if (dd < e) { let r2, g2, b2; if (dd < 3.95) { r2 = 104; g2 = 98; b2 = 82 } else { r2 = 168; g2 = 156; b2 = 128; if (n > .36) { r2 = 142; g2 = 140; b2 = 134 } else if (n < -.42) { r2 = 118; g2 = 110; b2 = 94 } if (n2 > .3 && dd > e - .5) { r2 = 128; g2 = 140; b2 = 84 } } const q = n * 16; set(o, r2 + q, g2 + q, b2 + q * .8); continue } tt = TG.grass }
      switch (tt) {
        case TG.grass: case TG.bank: { r = lerp(78, 112, tv); gg = lerp(108, 128, tv); b = lerp(50, 58, tv); const e = n * 18 + n2 * 10; r += e; gg += e; b += e * .5; if (n > .43) { r += 18; gg += 22; b += 8 } if (n < -.47 && n2 > .2) { r = 228; gg = 214; b = 120 } if (t === TG.bank && ((X + Y * 2) % 9 === 0)) { r -= 12; gg -= 12 } if (near(TG.road) || near(TG.walk) || near(TG.lane)) { if (n2 > .25) { r = 120; gg = 106; b = 78 } } break }
        case TG.forest: { r = 58 + n2 * 14; gg = 78 + n2 * 14; b = 42 + n2 * 6; if (n > .38) { r = 96; gg = 72; b = 44 } if (n < -.44) { r = 44; gg = 62; b = 34 } break }
        case TG.road: case TG.lane: case TG.lot: case TG.bridge: { const base = t === TG.road ? 70 : t === TG.lane ? 80 : t === TG.lot ? 86 : 132; const p = tv > .62 ? -8 : 0; r = gg = base + p + n * 12 + n2 * 6; b = r + 3; if (t === TG.bridge && (py === 0 && tx % 3 === 0)) { r -= 20; gg -= 20; b -= 20 } break }
        case TG.walk: { const row = Math.floor(py / 3), off = (row % 2) * 3, jx = (px + off) % 6 === 0, jy = py % 3 === 0; const alt = Math.floor((px + off) / 6 + row) % 2; r = alt ? 168 : 156; gg = alt ? 156 : 146; b = alt ? 140 : 134; if (jx || jy) { r -= 28; gg -= 28; b -= 28 } r += n * 8; gg += n * 8; b += n * 8; break }
        case TG.plaza: { const h = hash(tx, ty); r = 176 + h * 14; gg = 168 + h * 12; b = 152 + h * 10; if (px === 0 || py === 0) { r -= 26; gg -= 26; b -= 26 } r += n * 7; gg += n * 7; b += n * 7; break }
        case TG.dirt: { r = 138 + n * 16; gg = 116 + n * 14; b = 86 + n * 10; if (n2 > .4) { r += 12; gg += 10; b += 8 } break }
        case TG.yard: { r = 178 + n * 12 + n2 * 8; gg = 156 + n * 10 + n2 * 6; b = 118 + n * 8; break }
        case TG.field: { const fc = [[200, 170, 80], [110, 150, 60], [130, 96, 62], [168, 140, 170], [214, 200, 90]][Math.floor(hash(tx >> 3, ty / 7 | 0) * 5)]; if (Y % 6 < 3) { r = fc[0] + n * 24; gg = fc[1] + n * 24; b = fc[2] + n * 10 } else { r = fc[0] * .62; gg = fc[1] * .6; b = fc[2] * .58 } break }
        case TG.water: case TG.pond: { r = 34 + n * 8; gg = 66 + n * 8; b = 78 + n * 8; break }
        case TG.gravel: { const h = n * 40 + n2 * 20; r = 118 + h; gg = 110 + h; b = 100 + h; break }
        case TG.platform: { r = 182 + n * 8; gg = 178 + n * 8; b = 168 + n * 8; if (tx % 3 === 0 && px === 0) { r -= 24; gg -= 24; b -= 24 } if (ty === 19 && py < 2) { r = 236; gg = 236; b = 230 } break }
        case TG.tactile: { r = 224; gg = 184; b = 48; if (px % 3 === 1 && py % 3 === 1) { r += 22; gg += 22; b += 30 } r += n * 6; break }
        case TG.sand: { r = 216 + n * 12; gg = 196 + n * 12; b = 154 + n * 10; break }
        case TG.stone: { const s = hash(Math.floor((X + 3) / 9), Math.floor((Y + (Math.floor(X / 9) % 2) * 4) / 8)); const j = ((X + 3) % 9 === 0) || ((Y + (Math.floor(X / 9) % 2) * 4) % 8 === 0); r = 162 + s * 24; gg = 158 + s * 22; b = 148 + s * 18; if (j) { r -= 46; gg -= 46; b -= 44 } r += n * 6; break }
        case TG.sgravel: { r = 196 + n * 22; gg = 192 + n * 22; b = 184 + n * 20; if (py % 4 === 0) { r -= 8; gg -= 8; b -= 8 } break }
      }
      set(o, clamp(r, 0, 255), clamp(gg, 0, 255), clamp(b, 0, 255));
    }
  }
  g.putImageData(im, 0, 0);
  const P = v => v * GS;
  // 道路の白線
  g.fillStyle = 'rgba(236,236,230,.92)';
  for (let x = 0; x < GW; x++) { if (x >= 59 && x <= 64) continue; g.fillRect(P(x), P(70) + 2, GS, 2); g.fillRect(P(x), P(74) - 4, GS, 2); if (x % 3 === 0) g.fillRect(P(x) + 2, P(72) - 1, GS * 1.6, 2) }
  for (let y = 39; y < GH; y++) { if (y >= 69 && y <= 74) continue; if (y % 3 === 0) g.fillRect(P(62) - 1, P(y), 2, GS * 1.6); g.fillRect(P(60) + 2, P(y), 2, GS); g.fillRect(P(64) - 4, P(y), 2, GS) }
  for (let i = 0; i < 8; i++) { g.fillRect(P(55) + 4, P(70) + 3 + i * 6, GS * 3.2, 3) }// 横断歩道
  for (let i = 0; i < 7; i++) { g.fillRect(P(60) + 3 + i * 6, P(75) + 2, 3, GS * 2.4); g.fillRect(P(60) + 3 + i * 6, P(66) + 4, 3, GS * 2.4) }
  g.fillRect(P(54) + 6, P(70) + 3, 3, GS * 1.8); g.fillRect(P(60) + 3, P(78) + 6, GS * 1.8, 3);
  // マンホール・ひび・水たまり・落ち葉
  for (let x = 8; x < GW; x += 23) { const cx = P(x), cy = P(71.5); g.fillStyle = '#3a3c40'; g.beginPath(); g.ellipse(cx, cy, 8, 8, 0, 0, 7); g.fill(); g.strokeStyle = '#5a5c60'; g.lineWidth = 1; for (let r = 3; r < 8; r += 2) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke() } }
  g.lineWidth = 1;
  for (let i = 0; i < 260; i++) { let x = R() * GW, y = R() * GH; const t = GT[key(x | 0, y | 0)]; if (![TG.road, TG.lane, TG.lot, TG.walk, TG.plaza].includes(t)) continue; g.strokeStyle = 'rgba(30,30,32,.55)'; g.beginPath(); g.moveTo(P(x), P(y)); let a = R() * 6; for (let s = 0; s < 8; s++) { a += (R() - .5) * 1.2; x += Math.cos(a) * .35; y += Math.sin(a) * .35; g.lineTo(P(x), P(y)) } g.stroke(); if (R() < .5) { g.fillStyle = '#5a7a34'; g.fillRect(P(x), P(y), 2, 2); g.fillRect(P(x) + 2, P(y) - 1, 1, 2) } }
  for (let i = 0; i < 40; i++) { const x = R() * GW, y = R() * GH, t = GT[key(x | 0, y | 0)]; if (![TG.road, TG.lot, TG.lane, TG.dirt, TG.yard].includes(t)) continue; const gr = g.createRadialGradient(P(x), P(y), 1, P(x), P(y), 10 + R() * 12); gr.addColorStop(0, 'rgba(120,140,160,.55)'); gr.addColorStop(1, 'rgba(120,140,160,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(P(x), P(y), 22, 12, R(), 0, 7); g.fill() }
  for (let i = 0; i < 1600; i++) { const x = R() * GW, y = R() * GH, t = GT[key(x | 0, y | 0)]; if (![TG.walk, TG.plaza, TG.road, TG.grass, TG.lane, TG.sgravel, TG.stone].includes(t)) continue; if (Math.hypot(x - DCX, y - DCY) > 22 && Math.hypot(x - 18, y - 32) > 16 && Math.hypot(x - 46, y - 88) > 16 && R() < .7) continue; g.fillStyle = ['#c86a2a', '#d8a030', '#a85a28', '#f0b8c8', '#e8a0b4'][Math.floor(R() * 5)]; g.fillRect(P(x), P(y), 2 + (R() * 2 | 0), 2) }
  // 線路
  for (const [y0, y1] of [[12, 14], [16, 18]]) { for (let x = 0; x < GW * GS; x += 6) { g.fillStyle = '#5a4634'; g.fillRect(x, P(y0) + 2, 3, P(y1 - y0) - 4) } g.fillStyle = '#9aa0a6'; g.fillRect(0, P(y0) + 6, GW * GS, 2); g.fillRect(0, P(y1) - 8, GW * GS, 2); g.fillStyle = '#d8dce0'; g.fillRect(0, P(y0) + 6, GW * GS, 1); g.fillRect(0, P(y1) - 8, GW * GS, 1) }
  // 駐車場の線
  g.fillStyle = 'rgba(236,236,230,.8)'; for (let x = 66; x <= 76; x += 3) g.fillRect(P(x), P(66), 2, GS * 2.4); for (let x = 20; x <= 34; x += 3) g.fillRect(P(x), P(64), 2, GS * 3.5);
  // 校庭のトラック
  g.strokeStyle = 'rgba(245,245,240,.85)'; g.lineWidth = 2; for (const r of [0, 1.4]) { g.beginPath(); g.ellipse(P(87), P(104), P(14 + r), P(7 + r), 0, 0, 7); g.stroke() } g.beginPath(); g.moveTo(P(87), P(97 - .4)); g.lineTo(P(87), P(95.6)); g.stroke();
  // 塔のまわりの模様
  g.strokeStyle = 'rgba(120,108,96,.5)'; g.lineWidth = 3; for (const r of [11, 12.2]) { g.beginPath(); g.arc(P(DCX), P(DCY), P(r), 0, 7); g.stroke() }
})();
// ───────── 町の外（線路・川・道がそのまま地平まで続く。東の丘に小さな集落） ─────────
const OM = 72, OS = 4, OW = GW + OM * 2, OH = GH + OM * 2;
const outerTex = mkCanvas(OW * OS, OH * OS);
const FARHOUSES = [[170, 4, 3, 2], [174, 3, 2, 3], [172, 7, 3, 2], [176, 7, 2, 2], [168, 8, 2, 2], [178, 3, 2, 2]];
(function buildOuter() {
  const g = outerTex.getContext('2d'), W = OW * OS, im = g.createImageData(W, OH * OS), d = im.data;
  const TF = new Float32Array(OW * OH), TD = new Float32Array(OW * OH), TV2 = new Float32Array(OW * OH);
  for (let ty = 0; ty < OH; ty++)for (let tx = 0; tx < OW; tx++) { const wx = tx - OM, wy = ty - OM, i = ty * OW + tx; TF[i] = fbm(wx / 17 + 40, wy / 17); TD[i] = fbm(wx / 13, wy / 13); TV2[i] = fbm(wx / 7, wy / 7) }
  const FC = [[200, 170, 80], [110, 150, 60], [130, 96, 62], [168, 140, 170], [214, 200, 90]];
  for (let py = 0; py < OH * OS; py++)for (let px = 0; px < W; px++) {
    const o = (py * W + px) * 4, wx = (px + .5) / OS - OM, wy = (py + .5) / OS - OM, tx = Math.floor(wx), ty = Math.floor(wy);
    if (tx >= 0 && ty >= 0 && tx < GW && ty < GH) continue;
    const i = (ty + OM) * OW + (tx + OM), n = nz(px, py), n2 = nz(px >> 1, py >> 1); let r, gg, b;
    const rd = Math.abs(wx - riverX(wy)), fy = wy - 69, fx = wx - 59;
    const house = FARHOUSES.find(([x, y, w, h]) => wx >= x && wx < x + w && wy >= y && wy < y + h);
    if (house) { const [x, y, w, h] = house, ridge = Math.abs(wy - (y + h / 2)) < .2; r = ridge ? 96 : wy < y + h / 2 ? 78 : 62; gg = r * .86; b = r * .8 }
    else if (rd < 3.6 && !(wy >= 11 && wy < 19)) { r = 34 + n * 8; gg = 66 + n * 8; b = 78 + n * 8 }
    else if (wy >= 11 && wy < 19) { const h2 = n * 40 + n2 * 20; r = 118 + h2; gg = 110 + h2; b = 100 + h2; for (const [y0, y1] of [[12, 14], [16, 18]]) { if (wy > y0 + .17 && wy < y1 - .17 && px % 2 === 0) { r = 90; gg = 70; b = 52 } if (Math.abs(wy - (y0 + .55)) < .13 || Math.abs(wy - (y1 - .62)) < .13) { r = 170; gg = 176; b = 182 } } }
    else if (fy >= 0 && fy < 6 && (tx < 0 || tx >= GW)) { if (fy < 1 || fy >= 5) { r = 170 + n * 8; gg = 164 + n * 8; b = 150 + n * 8 } else { r = gg = 70 + n * 12; b = r + 3; if (Math.abs(fy - 1.2) < .12 || Math.abs(fy - 4.8) < .12 || Math.abs(fy - 3) < .1 && (tx % 3 === 0)) { r = gg = 230; b = 224 } } }
    else if (fx >= 0 && fx < 6 && ty >= GH) { if (fx < 1 || fx >= 5) { r = 170 + n * 8; gg = 164 + n * 8; b = 150 + n * 8 } else { r = gg = 70 + n * 12; b = r + 3; if (Math.abs(fx - 3) < .1 && ty % 3 === 0) { r = gg = 230; b = 224 } } }
    else if (rd < 4.9 + n2 * .7) { r = 168 + n * 16; gg = 156 + n * 16; b = 128 + n * 12 }
    else if (Math.hypot(wx - 173, wy - 6) < 7 + n2 * 2) { r = 140 + n * 20; gg = 124 + n * 18; b = 92 + n * 12 }
    else if (TF[i] > .6) { const cn = vn(wx * 1.4, wy * 1.4); if (cn > .58) { r = 34; gg = 54; b = 30 } else if (cn > .35) { r = 46 + n * 10; gg = 72 + n * 12; b = 38 } else { r = 60 + n * 10; gg = 88 + n * 12; b = 44 } }
    else if (TD[i] > .55) { const fc = FC[Math.floor(hash(tx >> 3, ty / 7 | 0) * 5)]; if (py % 4 < 2) { r = fc[0] + n * 24; gg = fc[1] + n * 24; b = fc[2] + n * 10 } else { r = fc[0] * .62; gg = fc[1] * .6; b = fc[2] * .58 } }
    else { const tv = TV2[i]; r = lerp(78, 112, tv); gg = lerp(108, 128, tv); b = lerp(50, 58, tv); const e = n * 18 + n2 * 10; r += e; gg += e; b += e * .5 }
    d[o] = clamp(r, 0, 255); d[o + 1] = clamp(gg, 0, 255); d[o + 2] = clamp(b, 0, 255); d[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
})();
const WATER = []; for (let k = 0; k < N; k++)if (GT[k] === TG.water || GT[k] === TG.pond) WATER.push(k);

// ───────── 見え方 ─────────
function view(cam, k) {
  const TW = 48 * k, TH = 24 * k, ZH = 24 * k, ox = CW / 2 - (cam.x - cam.y) * TW / 2, oy = CH / 2 - (cam.x + cam.y) * TH / 2 + cam.z * ZH;
  return {
    k, TW, TH, ZH, ox, oy, p: (x, y, z = 0) => [ox + (x - y) * TW / 2, oy + (x + y) * TH / 2 - z * ZH],
    gtf: (z = 0, s = GS) => [TW / 2 / s, TH / 2 / s, -TW / 2 / s, TH / 2 / s, ox, oy - z * ZH], wtf: (z = 0) => [TW / 2, TH / 2, -TW / 2, TH / 2, ox, oy - z * ZH],
    toWorld: (sx, sy, z = 0) => { const a = (sx - ox) / (TW / 2), b = (sy - oy + z * ZH) / (TH / 2); return [(a + b) / 2, (b - a) / 2] }
  }
}
function prism(c, V, poly, z0, z1, col, top, edge) {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length, fs = [];
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; let nx = b[1] - a[1], ny = -(b[0] - a[0]); if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny } if (nx + ny > 1e-6) fs.push({ a, b, d: mx + my, nx, ny }) }
  fs.sort((p, q) => p.d - q.d); for (const f of fs) fp(c, [V.p(f.a[0], f.a[1], z0), V.p(f.b[0], f.b[1], z0), V.p(f.b[0], f.b[1], z1), V.p(f.a[0], f.a[1], z1)], sh(col, shadeF(f.nx, f.ny, 0)), edge, 1);
  if (top !== false) fp(c, poly.map(p => V.p(p[0], p[1], z1)), top || sh(col, shadeF(0, 0, 1)), edge, 1); return fs
}
const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const rbox = (x, y, a, l, w) => { const f = [Math.cos(a), Math.sin(a)], s = [-f[1], f[0]]; return [[l, -w], [l, w], [-l, w], [-l, -w]].map(([u, v]) => [x + f[0] * u + s[0] * v, y + f[1] * u + s[1] * v]) };
const ngon = (x, y, r, n, ph = 0) => Array.from({ length: n }, (_, i) => [x + Math.cos(ph + i / n * Math.PI * 2) * r, y + Math.sin(ph + i / n * Math.PI * 2) * r]);
// 壁の面に、ドット絵を貼る
const AVG = new Map();
function avgCol(tex) { let v = AVG.get(tex); if (v) return v; const d = tex.getContext('2d').getImageData(0, 0, tex.width, tex.height).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++ } v = n ? `rgb(${r / n | 0},${g / n | 0},${b / n | 0})` : null; AVG.set(tex, v); return v }
function face(c, V, a, b, z0, z1, tex, f, rows, overlay) {
  const O = V.p(a[0], a[1], z1), U = V.p(b[0], b[1], z1), D = V.p(a[0], a[1], z0);
  if (V.k < .8) { const q = [O, U, [U[0] + D[0] - O[0], U[1] + D[1] - O[1]], D]; if (!overlay) { const col = avgCol(tex); if (col) fp(c, q, col) } else if (overlay === 'win') { const zA = Math.max(z0, z1 - LH + .9), zB = Math.min(z1, z1 - LH + 2); if (zB > zA) { const col = avgCol(tex); fp(c, [V.p(lerp(a[0], b[0], .12), lerp(a[1], b[1], .12), zA), V.p(lerp(a[0], b[0], .88), lerp(a[1], b[1], .88), zA), V.p(lerp(a[0], b[0], .88), lerp(a[1], b[1], .88), zB), V.p(lerp(a[0], b[0], .12), lerp(a[1], b[1], .12), zB)], col) } } else if (overlay === 'door') { const col = avgCol(tex); fp(c, [V.p(lerp(a[0], b[0], .2), lerp(a[1], b[1], .2), z0), V.p(lerp(a[0], b[0], .8), lerp(a[1], b[1], .8), z0), V.p(lerp(a[0], b[0], .8), lerp(a[1], b[1], .8), Math.min(z1, z0 + 2.1)), V.p(lerp(a[0], b[0], .2), lerp(a[1], b[1], .2), Math.min(z1, z0 + 2.1))], col) } return q }
  let ux = U[0] - O[0], uy = U[1] - O[1]; const vx = D[0] - O[0], vy = D[1] - O[1]; const sh2 = rows || Math.max(1, Math.round(TXH * (z1 - z0) / LH));
  const ul = Math.hypot(ux, uy) || 1, ex = 1 + .7 / ul; ux *= ex; uy *= ex;
  c.setTransform(ux / TXW, uy / TXW, vx / sh2 * 1.01, vy / sh2 * 1.01, O[0], O[1]); c.drawImage(tex, 0, TXH - sh2, TXW, sh2, 0, 0, TXW, sh2); c.setTransform(1, 0, 0, 1, 0, 0);
  return [O, [O[0] + ux, O[1] + uy], [O[0] + ux + vx, O[1] + uy + vy], D];
}
function shadeQuad(c, q, f) { if (f < .99) fp(c, q, `rgba(18,20,34,${(1 - f) * .85})`) }
function floorTile(c, V, x, y, z, fm, v = 0) { const p = V.p(x, y, z), s = 12; if (V.k < .8) { const col = avgCol(floorTex(fm, v)); fp(c, [p, V.p(x + 1, y, z), V.p(x + 1, y + 1, z), V.p(x, y + 1, z)], col); return } c.setTransform(V.TW / 2 / s * 1.02, V.TH / 2 / s * 1.02, -V.TW / 2 / s * 1.02, V.TH / 2 / s * 1.02, p[0], p[1]); c.drawImage(floorTex(fm, v), 0, 0); c.setTransform(1, 0, 0, 1, 0, 0) }

// ───────── 時刻と光 ─────────
const TOD = [[0, '#2a3060', 0], [4.5, '#2c3262', 0], [5.4, '#6a6a98', 0], [6.0, '#f0b8a8', .3], [7, '#fff0e0', .1], [11, '#ffffff', 0], [16, '#fff6e6', .05], [17.2, '#ffe2bc', .35], [18.0, '#ffc4a0', .7], [18.5, '#e8aa98', .9], [18.9, '#a49ac0', .5], [19.4, '#4e5690', .1], [20, '#343c74', 0], [24, '#2a3060', 0]];
function dayInfo(tmin) {
  const h = (tmin % 1440) / 60; let i = 0; while (i < TOD.length - 2 && TOD[i + 1][0] <= h) i++; const a = TOD[i], b = TOD[i + 1], t = (h - a[0]) / (b[0] - a[0]);
  const amb = mixc(a[1], b[1], t), glow = lerp(a[2], b[2], t);
  const f = clamp((h - 5.6) / (18.9 - 5.6), 0, 1), day = h > 5.6 && h < 18.9;
  const ang = lerp(Math.PI + .35, 2 * Math.PI - .3, f), elev = Math.sin(Math.PI * f) * 62 * Math.PI / 180;
  const len = day ? clamp(1 / Math.tan(Math.max(elev, .08)), .5, 7.5) : 0;
  const night = h < 5.2 || h > 19.3 ? 1 : h < 6 ? (6 - h) / .8 : h > 18.6 ? (h - 18.6) / .7 : 0;
  return { h, amb, glow, sun: [Math.cos(ang) * len, Math.sin(ang) * len], shadowA: day ? clamp(Math.min(h - 5.6, 18.9 - h) * 1.2, 0, 1) * .4 : 0, night: clamp(night, 0, 1), golden: glow, day };
}

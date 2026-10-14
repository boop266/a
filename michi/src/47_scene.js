// ════════════════ 1枚の絵にまとめる ════════════════
const isWallish = t => t === WALL || t === WIN || t === DOOR || t === SHAFT || t === SOLIDX;
const TILES = {}; for (let L = MINL; L <= MAXL; L++) { const a = []; for (let k = 0; k < N; k++)if (LEV[L].t[k]) a.push(k); TILES[L] = Int32Array.from(a) }
// 建物の外形（影・透かしに使う）
const TBASE = { x0: BX, y0: BY, x1: BX + 18, y1: BY + 14, top: LH };
const BBOX = BLD.map((b, i) => { if (!b) return null; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, l1 = 0; for (let L = MINL; L <= MAXL; L++)for (const k of TILES[L]) if (LEV[L].bid[k] === i) { const x = k % GW, y = (k / GW) | 0; if (L >= 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); l1 = Math.max(l1, L) } } return { x0, y0, x1: x1 + 1, y1: y1 + 1, top: (l1 + 1) * LH + (b.roof === 'gable' ? 1.4 : 0) } });
const SMALLOBJ = new Set(['cans', 'shoes', 'note', 'bike', 'flower', 'laundry', 'chair', 'boxes', 'plant', 'toolbox']);
const TOPL = BLD.map((b, i) => { if (!b) return 0; let t = 0; for (let L = 0; L <= MAXL; L++)for (const k of TILES[L]) if (LEV[L].bid[k] === i) t = Math.max(t, L); return t });
const INNERW = {}; for (let L = MINL; L <= MAXL; L++) { const g = LEV[L], s2 = new Uint8Array(N); for (const k of TILES[L]) { if (!isWallish(g.t[k])) continue; const b = g.bid[k]; let inner = true; for (const d of [1, -1, GW, -GW]) { const nk = k + d, nt = g.t[nk]; if (!nt || g.bid[nk] !== b || nt === ROOF) { inner = false; break } } s2[k] = inner ? 1 : 0 } INNERW[L] = s2 }
// 真上をおおう階（その階より上で、床や壁がある一番下の階）
const COVER = {}; for (let L = MINL; L <= MAXL; L++) { const cv2 = new Int8Array(N).fill(99); for (const k of TILES[L]) { for (let L2 = L + 1; L2 <= MAXL; L2++) { const t2 = LEV[L2].t[k]; if (t2 && t2 !== HOLE && t2 !== STAIR && t2 !== GLASS && t2 !== RAIL) { cv2[k] = L2; break } } } COVER[L] = cv2 }
// 外から見えない（屋根の下の）階か
function hiddenInside(bid, L) { if (!bid) return false; const b = BLD[bid]; if (bid === T_ID) return L < 8 && L !== 0 ? true : L === 0; if (b.roof === 'gable') return L <= TOPL[bid]; return L < TOPL[bid] }
const PLAZALAMPS = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + .3; const o = obj({ type: 'plazalamp', x: Math.floor(DCX + Math.cos(a) * 15.2), y: Math.floor(DCY + Math.sin(a) * 13.4) }); PLAZALAMPS.push(o) }
// 舞う花びら・ホタル・鳥
const PETALS = Array.from({ length: 46 }, () => ({ x: Math.random() * CW, y: Math.random() * CH, v: .5 + Math.random(), ph: Math.random() * 6, c: Math.random() < .55 ? '#f4c4d0' : ['#d88a3a', '#e8b040', '#b86a2a'][Math.floor(Math.random() * 3)] }));
const FLIES = Array.from({ length: 36 }, (_, i) => { const spots = [[44, 92], [18, 30], [126, 60], [126, 85], [46, 84]]; const s = spots[i % spots.length]; return { x: s[0] + (Math.random() - .5) * 10, y: s[1] + (Math.random() - .5) * 10, z: .5 + Math.random() * 1.5, ph: Math.random() * 6, hx: s[0], hy: s[1] } });
const BIRDS = { list: [], next: 8 };
let viewL = 0, inB = 0, xray = 0;
function render() {
  const D = dayInfo(G.t), V = view({ x: camX, y: camY, z: camZ }, camK), c = ctx, k = camK, GL = [];
  c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.globalAlpha = 1;
  viewL = G.cine && G.cine.viewL != null ? G.cine.viewL : P.L; const under = viewL === -1;
  inB = G.cine && G.cine.outside ? 0 : LEV[P.L].bid[key(Math.floor(P.x), Math.floor(P.y))] || 0;
  xray = 0; if (!inB && P.L === 0 && !(G.cine && G.cine.outside)) { const u = P.x - P.y, v = P.x + P.y; let best = -1e9; for (let i = 1; i < BBOX.length; i++) { const b = i === T_ID ? TBASE : BBOX[i]; if (!b || b.x1 < 0) continue; if (u < b.x0 - b.y1 + .4 || u > b.x1 - b.y0 - .4) continue; const vmax = 2 * Math.min(b.x1, b.y1 + u) - u, vmin = 2 * Math.max(b.x0, b.y0 + u) - u; const gab = i !== T_ID && BLD[i].roof === 'gable', wTop = gab ? b.top - 1.4 : b.top, lo = gab ? Math.min(vmin - wTop * 2, (vmin + vmax) / 2 - b.top * 2) : vmin - b.top * 2; if (v < vmax - .4 && v > lo - 1.2 && v < vmin + .5) { if (vmax > best) { best = vmax; xray = i } } } }
  // 地面
  if (!under && !(G.dbg && G.dbg.ground)) { c.fillStyle = '#3a4a2e'; c.fillRect(0, 0, CW, CH); c.save(); c.setTransform(...V.gtf(0, GS / 2)); const cov = [[0, 0], [CW, 0], [0, CH], [CW, CH]].every(([sx, sy]) => { const [a, b] = V.toWorld(sx, sy, 0); return a > 0 && b > 0 && a < GW && b < GH }); if (!cov) { c.setTransform(...V.gtf(0, OS)); c.imageSmoothingEnabled = false; c.drawImage(outerTex, -OM * OS, -OM * OS) } c.restore(); c.save(); c.setTransform(...V.gtf(0)); c.imageSmoothingEnabled = k < .75; c.drawImage(gtex, 0, 0); c.restore() }
  else { c.fillStyle = '#040406'; c.fillRect(0, 0, CW, CH) }
  // 画面に入るマス
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const z of [-3, 0, 10, camZ + 8, 30]) for (const [sx, sy] of [[0, 0], [CW, 0], [0, CH], [CW, CH]]) { const [a, b] = V.toWorld(sx, sy, z); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b) }
  x0 = Math.max(0, Math.floor(x0) - 2); y0 = Math.max(0, Math.floor(y0) - 2); x1 = Math.min(GW - 1, Math.ceil(x1) + 2); y1 = Math.min(GH - 1, Math.ceil(y1) + 2);
  const onScreen = (x, y, z, m = 160) => { const [sx, sy] = V.p(x, y, z); return sx > -m && sx < CW + m && sy > -m * 1.6 && sy < CH + m * 2 };
  const DBG = G.dbg || {};
  if (!under) { if (!DBG.water) drawWater(c, V, D, x0, y0, x1, y1); if (D.shadowA > .01 && !DBG.shadow) drawShadows(c, V, D) }
  const DL = []; const add = (kk, z, rank, f) => DL.push({ kk, z, rank, f }); G.dlStat = DL;
  const focus = (bid) => bid && (bid === inB || bid === xray);
  const cut = (bid, L, t) => focus(bid) && L > P.L && !(bid === T_ID && xray === T_ID && !inB && !(L === 1 && t === ROOF));
  const low = (bid, L, x, y) => focus(bid) && L === P.L && (x + .5 - P.x) + (y + .5 - P.y) > .6;
  const Lmin = under ? -1 : 0, Lmax = under ? -1 : MAXL;
  for (let L = Lmin; L <= Lmax; L++) {
    const g = LEV[L], z0 = L * LH, TL = TILES[L];
    for (let ti = 0; ti < TL.length; ti++) {
      const kk = TL[ti], x = kk % GW, y = (kk / GW) | 0; if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const t = g.t[kk], bid = g.bid[kk]; if (cut(bid, L, t)) continue; if (!onScreen(x + .5, y + .5, z0)) continue;
      if (bid && (t === FLOOR || t === STAIR || t === HOLE || INNERW[L][kk] || t === SOLIDX || t === SHAFT) && (focus(bid) ? COVER[L][kk] <= P.L : (hiddenInside(bid, L) || COVER[L][kk] <= MAXL))) continue;
      const B = BLD[bid] || BLD[T_ID], lw = low(bid, L, x, y);
      if (L !== 0 && (t === FLOOR || t === WALL && lw || t === WIN && lw || t === DOOR || t === GLASS)) add(x + y, z0, 0, () => floorTile(c, V, x, y, z0, g.fm[kk] || FM.conc, g.fm[kk] === FM.tile ? (x * 7 + y) % 3 : 0));
      switch (t) {
        case WALL: case SOLIDX: case SHAFT: case WIN: if (t === SOLIDX && L === -1) break; add(x + y + 1, z0, 1, () => drawWallTile(c, V, x, y, L, t, B, lw, GL)); break;
        case DOOR: add(x + y + 1, z0, 1, () => drawDoorTile(c, V, DOORS.get(L * N + kk), z0, B, lw, GL)); break;
        case GLASS: add(x + y + 1, z0, 1, () => drawGlass(c, V, x, y, z0, lw || (inB === T_ID && P.L === L && (x + .5 - P.x) + (y + .5 - P.y) > -2), GL)); break;
        case RAIL: add(x + y + 1, z0, 1, () => { floorTile(c, V, x, y, z0, g.fm[kk] || FM.conc); for (const [dx, dy, ax, ay, bx, by] of [[1, 0, 1, 0, 1, 1], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1], [0, -1, 0, 0, 1, 0]]) { const nt = g.t[key(x + dx, y + dy)]; if (nt === RAIL || nt === FLOOR) continue; ln(c, V.p(x + ax, y + ay, z0 + 1), V.p(x + bx, y + by, z0 + 1), '#e8eaee', 2 * k); ln(c, V.p(x + ax, y + ay, z0), V.p(x + ax, y + ay, z0 + 1), '#c8ccd2', 1.5 * k); ln(c, V.p(x + ax, y + ay, z0 + .5), V.p(x + bx, y + by, z0 + .5), 'rgba(220,224,230,.6)', 1) } }); break;
        case FENCE: add(x + y + 1, z0, 1, () => { floorTile(c, V, x, y, z0, FM.roof); for (const [dx, dy, ax, ay, bx, by] of [[1, 0, 1, 0, 1, 1], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1], [0, -1, 0, 0, 1, 0]]) { const nt = g.t[key(x + dx, y + dy)]; if (nt) continue; for (let i = 0; i <= 4; i++)ln(c, V.p(x + ax + (bx - ax) * i / 4, y + ay + (by - ay) * i / 4, z0), V.p(x + ax + (bx - ax) * i / 4, y + ay + (by - ay) * i / 4, z0 + 1.6), 'rgba(150,158,166,.75)', 1); ln(c, V.p(x + ax, y + ay, z0 + 1.6), V.p(x + bx, y + by, z0 + 1.6), '#8a929a', 2 * k); ln(c, V.p(x + ax, y + ay, z0), V.p(x + ax, y + ay, z0 + 1.6), '#6a7078', 2 * k) } }); break;
        case ROOF: add(x + y, z0, 0, () => drawRoofTile(c, V, x, y, z0, bid, L)); break;
        case STAIR: { const r = RUNON[L].get(kk); if (!r) break; const idx = r.tiles.findIndex(([a, b]) => a === x && b === y); const wood = BLD[bid] && BLD[bid].roof === 'gable'; for (let j = 0; j < 4; j++) { const s = idx * 4 + j, zt = z0 + (s + 1) / (r.len * 4) * LH; let bx; const d = r.dir; if (d[0] > 0) bx = box(x + j * .25, y, x + (j + 1) * .25, y + 1); else if (d[0] < 0) bx = box(x + 1 - (j + 1) * .25, y, x + 1 - j * .25, y + 1); else if (d[1] > 0) bx = box(x, y + j * .25, x + 1, y + (j + 1) * .25); else bx = box(x, y + 1 - (j + 1) * .25, x + 1, y + 1 - j * .25); const cx = (bx[0][0] + bx[2][0]) / 2, cy = (bx[0][1] + bx[2][1]) / 2; add(cx + cy, zt, .5, () => prism(c, V, bx, z0, zt, wood ? '#8a6440' : L === -1 ? '#8a8680' : '#a8a49c', s % 2 ? (wood ? '#a87e50' : '#bcb8b0') : (wood ? '#9a7248' : '#b4b0a8'), 'rgba(0,0,0,.1)')) } break }
        case HOLE: add(x + y + .2, z0, 0, () => { for (const [dx, dy, ax, ay, bx, by] of [[0, -1, 0, 0, 1, 0], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1]]) { const nt = g.t[key(x + dx, y + dy)]; if (nt === FLOOR && !(HOLEON[L].get(kk) && key(x + dx, y + dy) === HOLEON[L].get(kk).arr)) { ln(c, V.p(x + ax, y + ay, z0 + 1), V.p(x + bx, y + by, z0 + 1), '#e0d8c8', 2 * k); ln(c, V.p(x + ax, y + ay, z0), V.p(x + ax, y + ay, z0 + 1), '#bdb4a4', 1.5 * k) } } }); break;
      }
    }
  }
  // 物
  for (const o of OBJ) {
    if (o.L < Lmin || o.L > Lmax) continue; const bid = LEV[o.L].bid[key(o.x, o.y)]; if (cut(bid, o.L, 0)) continue; if (bid && !under && (focus(bid) ? COVER[o.L][key(o.x, o.y)] <= P.L : (hiddenInside(bid, o.L) || COVER[o.L][key(o.x, o.y)] <= MAXL))) continue; if (k < .62 && SMALLOBJ.has(o.type)) continue;
    const ox = o.fx ?? o.x + o.w / 2, oy = o.fy ?? o.y + o.h / 2; if (ox < x0 - 3 || ox > x1 + 3 || oy < y0 - 3 || oy > y1 + 3) continue; if (!onScreen(ox, oy, o.L * LH)) continue;
    if (o.type === 'canopy' || o.type === 'pcanopy') { add(o.x + o.w + o.y + o.h, 3, 2, () => drawObj(c, V, o, GL, D)); continue }
    if (o.type === 'plazalamp') { add(ox + oy, 0, 1.5, () => drawPlazaLamp(c, V, o, GL)); continue }
    add(ox + oy, o.L * LH, 1.5, () => drawObj(c, V, o, GL, D));
  }
  if (!under) {
    for (const line of WIRES) for (let i = 0; i < line.length - 1; i++) { const a = line[i], b = line[i + 1]; const mx = (a.x + b.x) / 2 + .5, my = (a.y + b.y) / 2 + .5; if (mx < x0 - 6 || mx > x1 + 6 || my < y0 - 6 || my > y1 + 6) continue; add(mx + my + 1.2, 4.4, 2, () => wire(c, V, a, b, G.wind)) }
    for (const b of BLD) { if (!b || b.roof !== 'gable' || b.id === inB) continue; const bb = BBOX[b.id]; if ((bb.x0 + bb.x1) / 2 < x0 - 8 || (bb.x0 + bb.x1) / 2 > x1 + 8 || (bb.y0 + bb.y1) / 2 < y0 - 8 || (bb.y0 + bb.y1) / 2 > y1 + 8) continue; add(b.x + b.w + b.y + b.h, (b.levels || 1) * LH, 2, () => gableRoof(c, V, b, b.id === xray ? .22 : 1)) }
    const outsideView = !(inB === T_ID && P.L < 8) || G.cine && G.cine.outside;
    for (let L = 0; L < MAXL; L++) { if (cut(T_ID, L, 0)) continue; add(DCX + DCY + (L < 8 ? -9 : -2), L * LH, .9, () => lattice(c, V, L, true, outsideView || L < P.L - 1)); add(DCX + DCY + (L < 8 ? 9 : 2), L * LH, 1.9, () => lattice(c, V, L, false, outsideView || L < P.L - 1)) }
  }
  // 人
  const actors = [[P, 'me', PAL.me], [F, 'fr', PAL.fr], ...ZB.map(z => [z, 'z', ZPAL[z.ci]])];
  for (const [a, kind, pal] of actors) { if (a.L < Lmin || a.L > Lmax || a.hide) continue; const bid = LEV[a.L].bid[key(Math.floor(a.x), Math.floor(a.y))]; if (cut(bid, a.L, 0)) continue; if (kind === 'z' && bid && !focus(bid)) continue; add(a.x + a.y + .05, a.z, 2, () => drawActor(c, V, a, kind, pal)) }
  DL.sort((a, b) => (a.kk - b.kk) || (a.z - b.z) || (a.rank - b.rank)); if (!DBG.list) for (const d of DL) d.f();
  if (!under) drawBirds(c, V, D);
  // ともだちが教えてくれた場所が、きらっと光る
  const hn = G.hint; if (hn && G.gameT < hn.until && hn.L === P.L && !G.cine) { const s = V.p(hn.x, hn.y, hn.L * LH + 1.1), tw = (Math.sin(G.gameT * 3.2) + 1) / 2, fade = clamp((hn.until - G.gameT) / 3, 0, 1); GL.push({ s, r: 18 + tw * 16, col: `rgba(255,236,170,${(.22 + tw * .4) * fade})` }); GL.push({ poly: [[s[0], s[1] - 9 - tw * 5], [s[0] + 2, s[1] - 2], [s[0] + 9 + tw * 5, s[1]], [s[0] + 2, s[1] + 2], [s[0], s[1] + 9 + tw * 5], [s[0] - 2, s[1] + 2], [s[0] - 9 - tw * 5, s[1]], [s[0] - 2, s[1] - 2]], col: `rgba(255,248,220,${(.35 + tw * .5) * fade})` }) }
  if (!DBG.light) lightPass(c, V, D, under, GL);
  if (!DBG.atmo) atmosphere(c, V, D, under);
}
// ───────── 壁 ─────────
function drawWallTile(c, V, x, y, L, t, B, lw, GL) {
  const g = LEV[L], z0 = L * LH, h = lw ? .5 : LH, bid = g.bid[key(x, y)];
  const nh = (xx, yy) => { const kk = key(xx, yy), nt = g.t[kk]; if (!isWallish(nt)) return 0; const nb = g.bid[kk]; const nlow = (nb === inB || nb === xray) && L === P.L && (xx + .5 - P.x) + (yy + .5 - P.y) > .6; return nlow ? .5 : LH };
  const inside = (xx, yy) => { const kk = key(xx, yy), nt = g.t[kk]; return (nt === FLOOR || nt === STAIR || nt === HOLE || nt === RAIL) && (g.bid[kk] === bid) };
  const shaft = t === SHAFT, solid = t === SOLIDX;
  for (const [dx, dy, a, b, nx, ny] of [[1, 0, [x + 1, y], [x + 1, y + 1], 1, 0], [0, 1, [x, y + 1], [x + 1, y + 1], 0, 1]]) {
    if (nh(x + dx, y + dy) >= h) continue;
    const inn = inside(x + dx, y + dy) || L === -1; const spec = shaft ? ['shaft', '#7a7e86'] : solid ? ['conc', '#8a847a'] : inn ? B.int : B.ext;
    const tex = wallTex(spec[0], spec[1], (x * 3 + y * 5 + L) % 3), f = shadeF(nx, ny, 0);
    const q = face(c, V, a, b, z0, z0 + h, tex, f);
    if (t === WIN) {
      const lit = (bid === T_ID && G.power && L <= G.litLevel) || bid === K_ID && false;
      const wt = winTex(g.wv[key(x, y)], B.glassFrame || '#c8ccd0', lit, B.shopGlass && !inn);
      face(c, V, a, b, z0, z0 + h, wt, f, 0, 'win');
      if (lit && !lw) { const zA = z0 + .9, zB = z0 + 2; GL.push({ poly: [V.p(...a, zA), V.p(...b, zA), V.p(...b, zB), V.p(...a, zB)], col: 'rgba(255,190,110,.42)' }) }
    }
    shadeQuad(c, q, f);
  }
  const top = [V.p(x, y, z0 + h), V.p(x + 1, y, z0 + h), V.p(x + 1, y + 1, z0 + h), V.p(x, y + 1, z0 + h)];
  fp(c, top, shaft ? '#5a5e66' : solid ? '#6a6660' : sh((B.ext || ['', '#cccccc'])[1], lw ? .72 : .58));
}
function drawDoorTile(c, V, d, z, B, lw, GL) {
  if (!d) return; const { x, y } = d, g = LEV[d.L];
  const sideOpen = (xx, yy) => { const nt = g.t[key(xx, yy)]; return nt === FLOOR || nt === STAIR || d.L === 0 && nt === EMPTY };
  const h = lw ? .5 : LH;
  for (const [dx, dy, a, b, nx, ny] of [[1, 0, [x + 1, y], [x + 1, y + 1], 1, 0], [0, 1, [x, y + 1], [x + 1, y + 1], 0, 1]]) {
    const nt = g.t[key(x + dx, y + dy)], f = shadeF(nx, ny, 0); if (isWallish(nt)) continue;
    const across = (d.axis === 'x' && dy === 1) || (d.axis === 'y' && dx === 1);
    const inn = g.bid[key(x + dx, y + dy)] === d.bid && nt !== EMPTY; const spec = d.kind === 'E' ? ['shaft', '#9aa0a8'] : inn ? B.int : B.ext;
    const q = face(c, V, a, b, z, z + h, wallTex(spec[0], spec[1], 0), f);
    if (across) { const open = d.open || d.kind === 'T'; face(c, V, a, b, z, z + h, doorTex(d.kind === 'L' ? 'D' : d.kind, open && d.kind !== 'E'), f, 0, 'door') }
    shadeQuad(c, q, f);
  }
  fp(c, [V.p(x, y, z + h), V.p(x + 1, y, z + h), V.p(x + 1, y + 1, z + h), V.p(x, y + 1, z + h)], sh(B.ext[1], .58));
  if (d.open && (d.kind === 'D' || d.kind === 'gate') && !lw) { const t = .07; prism(c, V, d.axis === 'x' ? box(x + .02, y + .5, x + .14, y + 1.35) : box(x + .5, y + .02, x + 1.35, y + .14), z, z + 2.05, d.kind === 'gate' ? '#7a8088' : '#7a5636') }
  if (!d.open && d.lock && !lw) { const m = V.p(x + .5, y + .5, z + 1.1); c.fillStyle = '#e0c040'; c.fillRect(m[0] - 2 * V.k, m[1] - 2 * V.k, 4 * V.k, 4 * V.k) }
  if (d.kind === 'E' && G.power && !lw) { const m = V.p(x + .5, y + 1, z + 2.25); c.fillStyle = '#ff9a40'; c.font = `bold ${Math.round(9 * V.k)}px monospace`; c.textAlign = 'center'; c.fillText(d.L === 8 ? '展' : '1', m[0], m[1]); c.textAlign = 'left'; GL.push({ s: m, r: 10, col: 'rgba(255,160,60,.5)' }) }
}
function drawGlass(c, V, x, y, z, low, GL) {
  prism(c, V, box(x, y, x + 1, y + 1), z, z + .35, '#5a5e66', sh('#5a5e66', .8)); if (low) return;
  for (const [nx, ny, a, b] of [[1, 0, [x + 1, y], [x + 1, y + 1]], [0, 1, [x, y + 1], [x + 1, y + 1]], [-1, 0, [x, y], [x, y + 1]], [0, -1, [x, y], [x + 1, y]]]) {
    const nt = LEV[8].t[key(x + nx, y + ny)]; if (nt) continue; const q = [V.p(...a, z + .35), V.p(...b, z + .35), V.p(...b, z + 2.3), V.p(...a, z + 2.3)];
    const lit = G.power && G.litLevel >= 8; fp(c, q, lit ? 'rgba(255,214,150,.3)' : 'rgba(150,180,205,.22)', 'rgba(220,224,230,.7)', 1.2 * V.k); if (lit) GL.push({ poly: q, col: 'rgba(255,190,110,.14)' });
    fp(c, [q[0], [lerp(q[0][0], q[1][0], .35), lerp(q[0][1], q[1][1], .35)], [lerp(q[3][0], q[2][0], .15), lerp(q[3][1], q[2][1], .15)], q[3]], 'rgba(255,255,255,.08)');
  }
  fp(c, box(x, y, x + 1, y + 1).map(p => V.p(p[0], p[1], z + 2.3)), '#4a4e56');
}
function drawRoofTile(c, V, x, y, z, bid, L) {
  const train = BLD[bid] && BLD[bid].train; const col = train ? '#a8acb2' : bid === K_ID ? '#c8c8c4' : '#a6a299';
  const pts = [V.p(x, y, z), V.p(x + 1, y, z), V.p(x + 1, y + 1, z), V.p(x, y + 1, z)];
  if (train) { const zz = z - .15; const p2 = [V.p(x, y, zz), V.p(x + 1, y, zz), V.p(x + 1, y + 1, zz), V.p(x, y + 1, zz)]; fp(c, p2, col); ln(c, V.p(x, y + .5, zz), V.p(x + 1, y + .5, zz), 'rgba(0,0,0,.15)', 1); const g = LEV[L]; for (const [dx, dy, a, b, nx, ny] of [[1, 0, [x + 1, y], [x + 1, y + 1], 1, 0], [0, 1, [x, y + 1], [x + 1, y + 1], 0, 1]]) { if (!g.t[key(x + dx, y + dy)]) fp(c, [V.p(...a, z - LH * .05), V.p(...b, z - LH * .05), V.p(...b, zz), V.p(...a, zz)], sh(col, shadeF(nx, ny, 0))) } return }
  fp(c, pts, col);
  if ((x * 7 + y * 3) % 11 === 0) prism(c, V, box(x + .2, y + .2, x + .8, y + .7), z, z + .45, '#b4b8bc');
  const g = LEV[L]; for (const [dx, dy, a, b, nx, ny] of [[1, 0, [x + 1, y], [x + 1, y + 1], 1, 0], [0, 1, [x, y + 1], [x + 1, y + 1], 0, 1], [-1, 0, [x, y], [x, y + 1], -1, 0], [0, -1, [x, y], [x + 1, y], 0, -1]]) { const nt = g.t[key(x + dx, y + dy)]; if (!nt) { if (nx + ny > 0) fp(c, [V.p(...a, z), V.p(...b, z), V.p(...b, z + .3), V.p(...a, z + .3)], sh(col, shadeF(nx, ny, 0) * .9)); else fp(c, [V.p(...a, z + .3), V.p(...b, z + .3), V.p(...b, z), V.p(...a, z)], sh(col, .72)) } }
}
function drawPlazaLamp(c, V, o, GL) { const x = o.x + .5, y = o.y + .5; prism(c, V, box(x - .07, y - .07, x + .07, y + .07), 0, 3.3, '#3a3e46'); const m = V.p(x, y, 3.4); const on = G.power && G.litLevel >= 10; c.fillStyle = on ? '#fff4d0' : '#c8ccd0'; c.beginPath(); c.arc(m[0], m[1], 4 * V.k, 0, 7); c.fill(); if (on) GL.push({ s: m, r: 30, col: 'rgba(255,220,150,.75)' }) }
function drawActor(c, V, a, kind, pal) {
  const sx = (a.fx || 1) - (a.fy || 0), sy = (a.fx || 1) + (a.fy || 0); const dir = sx >= 0 ? 1 : -1, back = sy < -.25;
  let pose = 'stand', frame = 0;
  if (kind === 'z') { if (a.down > 0) pose = 'down'; else { pose = 'zwalk'; frame = Math.floor(a.step * 2.5) % 4 } }
  else if (a === P) { if (G.sleep) pose = 'lie'; else if (G.sit) pose = 'sit'; else if (P.climb) { pose = 'climb'; frame = Math.floor(G.gameT * 4) % 4 } else if (P.push > 0) pose = 'push'; else if (P.moving) { pose = 'walk'; frame = Math.floor(P.walkT * 1.6) % 4 } }
  else if (a === F) { if (G.sleep) pose = 'lie'; else if ((G.sit || G.restNear) && Math.hypot(F.x - P.x, F.y - P.y) < 2.6) pose = 'sit'; else if (F.point > 0) pose = 'point'; else if (F.moving) { pose = 'walk'; frame = Math.floor(F.walkT * 1.6) % 4 } }
  if (pose === 'lie') { drawPerson(c, V, a, kind, 'lie', 0, false, 1, pal); return }
  drawPerson(c, V, a, kind, pose, frame, back, dir, pal);
}
// ───────── 水 ─────────
function drawWater(c, V, D, x0, y0, x1, y1) {
  c.save(); c.beginPath(); let any = false;
  // 川：岸はなめらかな線（橋と線路の土手の下はとばす）
  const RIV = [[0, 10], [20, 68], [76, GH]], segs = [];
  for (const [a, b] of RIV) { const ya = Math.max(a, y0 - 3), yb = Math.min(b, y1 + 3); if (yb <= ya) continue; let near = false; for (let y = ya; y <= yb; y += 2) { const rx = riverX(y); if (rx + 4 > x0 - 3 && rx - 4 < x1 + 3) { near = true; break } } if (!near) continue; segs.push([ya, yb]); any = true;
    const L = [], Rr = []; for (let y = ya; y <= yb + .001; y += .5) { const rx = riverX(y); L.push(V.p(rx - 3.6, y)); Rr.push(V.p(rx + 3.6, y)) } c.moveTo(...L[0]); for (const q of L) c.lineTo(...q); for (let i = Rr.length - 1; i >= 0; i--)c.lineTo(...Rr[i]); c.closePath() }
  // 池はタイルのまま
  for (const kk of WATER) { if (GT[kk] !== TG.pond) continue; const x = kk % GW, y = (kk / GW) | 0; if (x < x0 || x > x1 || y < y0 || y > y1) continue; any = true; const a = V.p(x - .02, y - .02), b = V.p(x + 1.02, y - .02), d = V.p(x + 1.02, y + 1.02), e = V.p(x - .02, y + 1.02); c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.lineTo(...e); c.closePath() }
  if (!any) { c.restore(); return }
  const sky = D.night > .5 ? '#1a2240' : mixc('#4a7c9e', mixc('#c89a7a', '#6a70a0', clamp(D.h - 18.3, 0, 1)), D.golden * .3);
  const gr = c.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, sh(sky, 1.08, .9)); gr.addColorStop(1, sh(sky, .74, .9)); c.fillStyle = gr; c.fill();
  // 岸のさざ波
  if (V.k > .5) { c.strokeStyle = D.night > .5 ? 'rgba(180,190,230,.16)' : 'rgba(236,244,244,.32)'; c.lineWidth = 1.4 * V.k; const t0 = G.gameT; for (const [ya, yb] of segs) for (const sd of [-1, 1]) { c.beginPath(); for (let y = ya; y <= yb + .001; y += .5) { const rx = riverX(y), w = 3.45 + Math.sin(y * 1.7 + t0 * 1.3) * .06; const q = V.p(rx + sd * w, y); if (y === ya) c.moveTo(...q); else c.lineTo(...q) } c.stroke() } }
  const t = G.gameT; c.fillStyle = D.night > .5 ? 'rgba(200,210,255,.18)' : D.golden > .3 ? 'rgba(255,214,150,.6)' : 'rgba(255,255,255,.35)';
  for (const kk of WATER) { const x = kk % GW, y = (kk / GW) | 0; if (x < x0 || x > x1 || y < y0 || y > y1) continue; const pond = GT[kk] === TG.pond; for (let i = 0; i < 2; i++) { const h = hash(x * 3 + i, y * 7); const ph = (t * (.15 + h * .1) + h) % 1; const px = pond ? x + ph : x + h, py = pond ? y + h : y + ph; if (!pond && Math.abs(px - riverX(py)) > 3.3) continue; const p = V.p(px, py, 0); const w = (5 + h * 9) * V.k * Math.sin(ph * Math.PI); c.fillRect(p[0] - w / 2, p[1], w, Math.max(1, V.k)) } }
  // 橋の南の側面（川面へ落ちる影ごと）
  if (y0 <= 77 && y1 >= 74 && x1 >= BRX0 && x0 <= BRX1) { for (let x = BRX0; x <= BRX1; x++) { if (GT[key(x, 76)] !== TG.water) continue; fp(c, [V.p(x, 76, 0), V.p(x + 1, 76, 0), V.p(x + 1, 76.9, -.02), V.p(x, 76.9, -.02)], 'rgba(20,30,40,.28)'); fp(c, [V.p(x, 76, 0), V.p(x + 1, 76, 0), V.p(x + 1, 76, -.42), V.p(x, 76, -.42)], x % 4 === 1 ? '#7e786c' : '#8e887c'); ln(c, V.p(x, 76, -.02), V.p(x + 1, 76, -.02), 'rgba(230,224,210,.5)', 1) } }
  c.restore();
}
// ───────── 影 ─────────
const shadowCv = mkCanvas(CW, CH), cloudCv = mkCanvas(CW, CH);
function drawShadows(c, V, D) {
  const s = shadowCv.getContext('2d'); s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, CW, CH); s.setTransform(...V.wtf(0)); s.fillStyle = '#000'; s.strokeStyle = '#000';
  const S = D.sun; const pr = (poly, z0, z1) => { const A = poly.map(([x, y]) => [x + S[0] * z0, y + S[1] * z0]), B = poly.map(([x, y]) => [x + S[0] * z1, y + S[1] * z1]); fp(s, A, '#000'); fp(s, B, '#000'); for (let i = 0; i < poly.length; i++) { const j = (i + 1) % poly.length; fp(s, [A[i], A[j], B[j], B[i]], '#000') } };
  for (let i = 1; i < BBOX.length; i++) { const b = BBOX[i]; if (!b || i === T_ID) continue; pr(box(b.x0, b.y0, b.x1, b.y1), 0, b.top - (BLD[i].roof === 'gable' ? .7 : 0)) }
  pr(box(BX, BY, BX + 18, BY + 14), 0, LH); pr(box(BX + 5, BY + 4, BX + 13, BY + 10), 0, 10 * LH); pr(ngon(DCX, DCY, 9.2, 8, Math.PI / 8), 8 * LH, 8 * LH + 2.4); pr(box(BX + 8.2, BY + 6.2, BX + 8.8, BY + 6.8), 10 * LH, 10 * LH + 12);
  s.lineCap = 'round';
  for (const i of [0, 1, 2, 3]) { const sx = [1, -1, -1, 1][i], sy = [1, 1, -1, -1][i]; s.lineWidth = .35; s.beginPath(); s.moveTo(DCX + sx * 12.2, DCY + sy * 12.2); s.lineTo(DCX + sx * 6.6 + S[0] * 8 * LH, DCY + sy * 6.6 + S[1] * 8 * LH); s.stroke() }
  const [wa, wb] = V.toWorld(0, 0, 0), [wc, wd] = V.toWorld(CW, CH, 0), [we, wf] = V.toWorld(CW, 0, 0), [wg, wh] = V.toWorld(0, CH, 0); const bx0 = Math.min(wa, wc, we, wg) - 8, bx1 = Math.max(wa, wc, we, wg) + 2, by0 = Math.min(wb, wd, wf, wh) - 8, by1 = Math.max(wb, wd, wf, wh) + 2; const inV = (x, y) => x > bx0 && x < bx1 && y > by0 && y < by1;
  if (G.q > 0) for (const t of TREES) { if (!inV(t.fx, t.fy)) continue; const h = t.hgt; s.beginPath(); s.ellipse(t.fx + S[0] * h * .7, t.fy + S[1] * h * .7, t.r * 1.05, t.r * .85, Math.atan2(S[1], S[0]), 0, 7); s.fill(); s.lineWidth = .18; s.beginPath(); s.moveTo(t.fx, t.fy); s.lineTo(t.fx + S[0] * h * .5, t.fy + S[1] * h * .5); s.stroke() }
  for (const o of POLES) { if (!inV(o.x, o.y)) continue; s.lineWidth = .16; s.beginPath(); s.moveTo(o.x + .5, o.y + .5); s.lineTo(o.x + .5 + S[0] * 5, o.y + .5 + S[1] * 5); s.stroke() }
  for (const o of BWALL) { if (!inV(o.x, o.y)) continue; const h = o.type === 'fence' ? .3 : o.type === 'parapet' ? .7 : 1; s.lineWidth = o.type === 'hedge' ? .5 : .25; s.beginPath(); s.moveTo(o.x0 + S[0] * h * .5, o.y0 + S[1] * h * .5); s.lineTo(o.x1 + S[0] * h * .5, o.y1 + S[1] * h * .5); s.stroke() }
  for (const o of CARS) pr(rbox(o.fx, o.fy, o.a, 1.1, .5), 0, .8);
  for (const a of [P, F, ...ZB]) { if (a.L !== 0) continue; s.lineWidth = .42; s.beginPath(); s.moveTo(a.x, a.y); s.lineTo(a.x + S[0] * 1.1, a.y + S[1] * 1.1); s.stroke() }
  s.setTransform(1, 0, 0, 1, 0, 0);
  c.save(); c.globalAlpha = D.shadowA; c.drawImage(shadowCv, 0, 0); c.restore();
  // 雲の影
  if (D.day && V.k < 1.4 && G.q > 1) { c.save(); c.setTransform(...V.wtf(0)); c.globalAlpha = .1 * D.shadowA / .4; c.fillStyle = '#000'; for (let i = 0; i < 5; i++) { const cx = ((i * 53 + G.gameT * .35) % 240) - 40, cy = ((i * 37 + G.gameT * .12) % 200) - 20; if (!inV(cx, cy) && !inV(cx - 15, cy - 15)) continue; for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(cx + Math.cos(j * 1.7 + i) * 6, cy + Math.sin(j * 2.3 + i) * 4, 11 + j * 2, 7 + j, i, 0, 7); c.fill() } } c.restore() }
}
// ───────── 光と闇 ─────────
const lightCv = mkCanvas(CW, CH);
function lightPass(c, V, D, under, GL) {
  const l = lightCv.getContext('2d'); l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over';
  let amb = D.amb;
  const towerIn = inB === T_ID && P.L >= 0 && P.L <= 9;
  if (under) amb = G.power ? '#d8d0c0' : '#0c0c12'; else if (towerIn && !G.power) amb = mixc(amb, '#121622', P.L === 0 ? .4 : .55); else if (inB) amb = mixc(amb, '#1a1e2a', .28);
  if (G.cine && G.cine.dark) amb = mixc(amb, '#000000', G.cine.dark);
  l.fillStyle = amb; l.fillRect(0, 0, CW, CH); l.globalCompositeOperation = 'lighter';
  const lamp = (x, y, z, r, col, flat = .6) => { const [sx, sy] = V.p(x, y, z), rr = r * V.TW * .7; if (sx < -rr || sx > CW + rr || sy < -rr || sy > CH + rr) return; l.save(); l.translate(sx, sy); l.scale(1, flat); const g = l.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = g; l.beginPath(); l.arc(0, 0, rr, 0, 7); l.fill(); l.restore() };
  const lum = (() => { const [r, g, b] = hx(amb); return (r + g + b) / 765 })();
  if (lum < .5 && !(G.cine && G.cine.outside)) {// 懐中電灯
    const a = Math.atan2(P.fy, P.fx), len = 6.5, sp = .52; const apex = V.p(P.x, P.y, P.z + .6); const L1 = V.p(P.x + Math.cos(a - sp) * len, P.y + Math.sin(a - sp) * len, P.z), L2 = V.p(P.x + Math.cos(a + sp) * len, P.y + Math.sin(a + sp) * len, P.z), L3 = V.p(P.x + Math.cos(a) * len * 1.1, P.y + Math.sin(a) * len * 1.1, P.z);
    const g = l.createRadialGradient(apex[0], apex[1], 4, apex[0], apex[1], len * V.TW * .6); g.addColorStop(0, 'rgba(255,244,220,.95)'); g.addColorStop(.6, 'rgba(255,240,210,.45)'); g.addColorStop(1, 'rgba(255,240,210,0)'); l.fillStyle = g; l.beginPath(); l.moveTo(...apex); l.lineTo(...L1); l.quadraticCurveTo(L3[0], L3[1], ...L2); l.closePath(); l.fill();
    lamp(P.x, P.y, P.z, 2.2, 'rgba(255,240,210,.5)'); lamp(F.x, F.y, F.z, 1.6, 'rgba(255,230,190,.35)');
  }
  if (G.power) {
    const ll = G.litLevel;
    for (let L = -1; L <= MAXL; L++) { if (under !== (L === -1)) continue; if (L > ll && L >= 0) continue; if (L > P.L && inB === T_ID) continue; const z = L * LH + 1.8; if (L === -1) { lamp(BX + 10, BY + 6, z, 7, 'rgba(255,245,220,.75)'); continue } if (L === 0) { for (const [x, y] of [[8, 11], [3, 5], [14, 7], [8, 2], [14, 2]]) lamp(BX + x + .5, BY + y, z, 4.4, 'rgba(255,230,190,.6)') } else if (L === 8) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; lamp(DCX + Math.cos(a) * 5.5, DCY + Math.sin(a) * 5.5, z, 4.2, 'rgba(255,220,170,.55)') } } else lamp(BX + 8.5, BY + 6.5, z, 3.4, 'rgba(255,230,190,.5)') }
    if (!under && ll >= 10) { for (const o of PLAZALAMPS) lamp(o.x + .5, o.y + .5, 0, 5, 'rgba(255,220,160,.55)'); for (const [x, y] of [[DCX - 12, DCY - 12], [DCX + 12, DCY - 12], [DCX + 12, DCY + 12], [DCX - 12, DCY + 12]]) lamp(x, y, 0, 4, 'rgba(255,190,140,.45)'); lamp(BX + 9, BY + 15, 0, 5, 'rgba(255,220,160,.5)') }
  }
  for (const o of FIRES) if (o.fire && o.L === viewL) { const fl = .85 + Math.sin(G.gameT * 11 + o.x) * .08 + Math.sin(G.gameT * 17) * .05; lamp(o.x + .5, o.y + .5, o.L * LH + .5, 6.5 * fl, 'rgba(255,150,70,.95)') }
  if (G.gen.run && under) lamp(BX + 9, BY + 5.5, -LH + 1, 3, 'rgba(255,190,120,.6)');
  c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(lightCv, 0, 0); c.restore();
  // あとから光るもの
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const g of GL) { if (g.poly) fp(c, g.poly, g.col); else { const r = g.r * V.k; const gg = c.createRadialGradient(g.s[0], g.s[1], 0, g.s[0], g.s[1], r); gg.addColorStop(0, g.col); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.beginPath(); c.arc(g.s[0], g.s[1], r, 0, 7); c.fill() } }
  if (G.power && G.litLevel >= 10 && !under && !(inB === T_ID && P.L < 10 && !(G.cine && G.cine.outside))) { if ((G.gameT % 1.6) < .8) { const s = V.p(DCX, DCY, 10 * LH + 12.2); const gg = c.createRadialGradient(s[0], s[1], 0, s[0], s[1], 30 * V.k + 10); gg.addColorStop(0, 'rgba(255,60,40,.95)'); gg.addColorStop(1, 'rgba(255,60,40,0)'); c.fillStyle = gg; c.beginPath(); c.arc(s[0], s[1], 30 * V.k + 10, 0, 7); c.fill() } }
  // 東の果ての灯り
  if (!under && (D.night > .3 || D.h > 18.6)) { const nf = clamp(Math.max(D.night, (D.h - 18.6) * 2), 0, 1), cine = G.cine && G.cine.type === 'farlight' ? 1.35 : 1; const s = V.p(FARLIGHT[0], FARLIGHT[1], .6), R0 = 130 * V.k + 40;
    if (s[0] > -R0 && s[0] < CW + R0 && s[1] > -R0 && s[1] < CH + R0) { const fl = (.86 + Math.sin(G.gameT * 2.3) * .06 + Math.sin(G.gameT * 7.3) * .04) * nf * cine;
      let gg = c.createRadialGradient(s[0], s[1], 0, s[0], s[1], R0); gg.addColorStop(0, `rgba(255,190,115,${.5 * fl})`); gg.addColorStop(.3, `rgba(255,160,90,${.2 * fl})`); gg.addColorStop(1, 'rgba(255,140,80,0)'); c.fillStyle = gg; c.beginPath(); c.arc(s[0], s[1], R0, 0, 7); c.fill();
      for (const [dx, dy, z, r] of [[0, 0, 1.2, 1], [-1.4, .6, .9, .7], [1.1, -.8, .9, .65], [-.5, -1.6, 1.6, .55], [2.2, .7, .7, .5]]) { const q = V.p(FARLIGHT[0] + dx, FARLIGHT[1] + dy, z), rr = (9 * V.k + 4) * r, tw = .8 + Math.sin(G.gameT * (1.3 + r) + dx * 3) * .2; gg = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); gg.addColorStop(0, `rgba(255,236,190,${.95 * fl * tw})`); gg.addColorStop(.4, `rgba(255,190,120,${.5 * fl * tw})`); gg.addColorStop(1, 'rgba(255,160,90,0)'); c.fillStyle = gg; c.beginPath(); c.arc(q[0], q[1], rr, 0, 7); c.fill() } } }
  if (D.night > .3 && !under) for (const f of FLIES) { const p = V.p(f.x, f.y, f.z); if (p[0] < -10 || p[0] > CW + 10 || p[1] < -10 || p[1] > CH + 10) continue; const b = Math.max(0, Math.sin(G.gameT * 2.2 + f.ph)) * D.night; if (b < .05) continue; const gg = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 9 * V.k + 3); gg.addColorStop(0, `rgba(210,255,140,${.9 * b})`); gg.addColorStop(1, 'rgba(210,255,140,0)'); c.fillStyle = gg; c.beginPath(); c.arc(p[0], p[1], 9 * V.k + 3, 0, 7); c.fill() }
  c.restore();
}
function drawBirds(c, V, D) {
  for (const b of BIRDS.list) { const p = V.p(b.x, b.y, b.z), sp = V.p(b.x + D.sun[0] * b.z * .15, b.y + D.sun[1] * b.z * .15, 0); const fl = Math.sin(G.gameT * 9 + b.ph) * 4 * V.k + 2; c.strokeStyle = '#1a1a20'; c.lineWidth = Math.max(1.2, 1.6 * V.k); c.beginPath(); c.moveTo(p[0] - 6 * V.k, p[1] - fl); c.lineTo(p[0], p[1]); c.lineTo(p[0] + 6 * V.k, p[1] - fl); c.stroke(); if (D.shadowA > .05) { c.fillStyle = `rgba(0,0,0,${D.shadowA * .5})`; c.fillRect(sp[0] - 4 * V.k, sp[1], 8 * V.k, 2 * V.k) } }
}
function atmosphere(c, V, D, under) {
  if (!under && !inB) {// 花びら・落ち葉
    c.save(); for (let i = 0; i < PETALS.length; i += G.q > 1 ? 1 : 2) { const p = PETALS[i]; c.fillStyle = p.c; c.globalAlpha = .85; const w = 2 + Math.sin(G.gameT * 4 + p.ph) * 1.2; c.fillRect(p.x, p.y, Math.max(1, w), 2) } c.restore();
  }
  if (!under && D.golden > .25 && !inB && G.q > 1) {// 光の筋
    c.save(); c.globalCompositeOperation = 'screen'; for (let i = 0; i < 5; i++) { const x = ((i * 290 + G.gameT * 6) % (CW + 600)) - 300, w = 60 + i * 23; const g = c.createLinearGradient(x, 0, x + 520, CH); g.addColorStop(0, `rgba(255,200,140,${.07 * D.golden})`); g.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, -10); c.lineTo(x + w, -10); c.lineTo(x + w + 520, CH + 10); c.lineTo(x + 520, CH + 10); c.closePath(); c.fill() } c.restore();
  }
  if (!under && G.q > 0 && (camZ > 3 || D.golden > .1 || D.night > .3)) {
    const hz = clamp((camZ - 4) / 18, 0, 1) * .7 + .15; const sky = D.night > .5 ? [40, 50, 90] : hx(mixc('#c8dcf0', mixc('#ffb890', '#c890b0', clamp(D.h - 18, 0, 1)), D.golden));
    const g = c.createLinearGradient(0, 0, 0, CH * .55); g.addColorStop(0, `rgba(${sky[0]},${sky[1]},${sky[2]},${hz * (D.night > .5 ? .5 : .55)})`); g.addColorStop(1, `rgba(${sky[0]},${sky[1]},${sky[2]},0)`); c.save(); c.globalCompositeOperation = D.night > .5 ? 'source-over' : 'screen'; c.fillStyle = g; c.fillRect(0, 0, CW, CH); c.restore();
  }
  if (G.scope > 0) { const s = clamp(G.scope, 0, 1) * clamp((G.scopeMax - G.scope) * 2, 0, 1); c.save(); c.fillStyle = `rgba(0,0,0,${.88 * s})`; c.beginPath(); c.rect(0, 0, CW, CH); c.arc(CW / 2, CH / 2, CH * .47, 0, 7, true); c.fill('evenodd'); c.restore() }
  const vg = c.createRadialGradient(CW / 2, CH / 2, CH * .42, CW / 2, CH / 2, CW * .72); vg.addColorStop(0, 'rgba(6,6,16,0)'); vg.addColorStop(1, `rgba(6,6,16,${.3 + D.night * .25})`); c.fillStyle = vg; c.fillRect(0, 0, CW, CH);
}

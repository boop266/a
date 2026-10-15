// ---------------------------------------------------------------------------
// 描く：和紙・遠山・地面・水・字・人・光と闇・白紙
// ---------------------------------------------------------------------------
const R = {
  cv: null, ctx: null, dpr: 1, vw: 0, vh: 0, TS: 40,
  cam: { x: 0, y: 0, tx: 0, ty: 0, panX: 0, panY: 0, panT: 0, shake: 0 },
  terrainCv: null, terrainKey: '',
  paperPat: null, paperCv: null, nightPaperCv: null,
  darkCv: null,
  bg: null,
  t: 0,
  preview: null,           // ドラッグ中の見立て
  writing: [],             // 筆で書いている最中
};
// 昼（和紙と墨）と夜（紺紙と金泥）
const PAL_DAY = {
  paper: '#ebe2c8', paperDeep: '#dfd3b2', ink: INK.sumi, edge: 'rgba(28,26,32,.82)', edgeSoft: 'rgba(28,26,32,.35)',
  earth: '#cdbd98', earthDeep: '#b8a37a', rock: '#a59f94', rockDeep: '#8c867c', sand: '#e1cf9c', ice: '#cfe3ee', snow: '#f6f4ee', mud: '#7f6649', plank: '#a7835a', moss: '#7e9a52',
  water: 'rgba(34,80,138,', mist: 'rgba(235,226,200,', far1: '#cfc6ad', far2: '#b9b09a', sky: null, blank: '#f8f4e8',
};
const PAL_NIGHT = {
  paper: '#1d2540', paperDeep: '#161d35', ink: '#d9b45c', edge: 'rgba(217,180,92,.85)', edgeSoft: 'rgba(217,180,92,.35)',
  earth: '#2a3352', earthDeep: '#222a46', rock: '#363d58', rockDeep: '#2b3150', sand: '#3d4260', ice: '#4b6488', snow: '#c8cfdf', mud: '#2a2a3a', plank: '#5a4a3a', moss: '#3d5a3a',
  water: 'rgba(120,160,220,', mist: 'rgba(29,37,64,', far1: '#283152', far2: '#313b60', sky: null, blank: '#0f1426',
};
let PAL = PAL_DAY;
// 夜の巻では、字の色も金泥に
function inkCol(colKey) {
  if (PAL === PAL_NIGHT) {
    const m = { sumi: '#e0bd64', usuzumi: '#a39070', hai: '#a8a8b8', cha: '#d4a86a', kon: '#8090c0', shiro: '#f0ead8' };
    if (m[colKey]) return m[colKey];
    return mixHex(INK[colKey] || INK.sumi, '#ffffff', 0.32);
  }
  return INK[colKey] || INK.sumi;
}

function setupCanvas() {
  R.cv = $('cv'); R.ctx = R.cv.getContext('2d');
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  R.paperCv = makePaper(PAL_DAY.paper, 0x51);
  R.nightPaperCv = makePaper(PAL_NIGHT.paper, 0x77, true);
}
function resizeCanvas() {
  const st = $('stage');
  R.dpr = Math.min(2, window.devicePixelRatio || 1);
  R.vw = Math.max(1, st.clientWidth); R.vh = Math.max(1, st.clientHeight);
  R.cv.width = Math.round(R.vw * R.dpr); R.cv.height = Math.round(R.vh * R.dpr);
  const ts = Math.round(Math.min(R.vh / 11.5, R.vw / 9.4));
  const newTS = clamp(ts, 26, 66);
  if (newTS !== R.TS) { R.TS = newTS; if (W) W.tdirty = true; }
  R.darkCv = null;
}
// 和紙：繊維とむら
function makePaper(base, seed, night) {
  const S = 512, c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d'); const r = makeRng(seed);
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  // むら
  for (let i = 0; i < 70; i++) {
    const g = x.createRadialGradient(r() * S, r() * S, 0, r() * S, r() * S, 40 + r() * 120);
    const a = night ? 0.05 : 0.045;
    g.addColorStop(0, night ? 'rgba(80,100,160,' + a + ')' : 'rgba(150,120,70,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  // 繊維
  for (let i = 0; i < 900; i++) {
    x.strokeStyle = night ? 'rgba(200,190,150,' + (r() * 0.06) + ')' : 'rgba(110,90,50,' + (r() * 0.07) + ')';
    x.lineWidth = 0.4 + r() * 0.6;
    x.beginPath(); let px = r() * S, py = r() * S; x.moveTo(px, py);
    const n = 3 + r() * 5; let a = r() * TAU;
    for (let k = 0; k < n; k++) { a += (r() - 0.5) * 1.2; px += Math.cos(a) * (3 + r() * 6); py += Math.sin(a) * (3 + r() * 6); x.lineTo(px, py); }
    x.stroke();
  }
  for (let i = 0; i < 2600; i++) { x.fillStyle = night ? 'rgba(220,200,140,' + (r() * 0.05) + ')' : 'rgba(90,70,30,' + (r() * 0.06) + ')'; x.fillRect(r() * S, r() * S, 0.6 + r() * 1.6, 0.5 + r() * 0.8); }
  // 金の砂子（夜）
  if (night) for (let i = 0; i < 140; i++) { x.fillStyle = 'rgba(217,180,92,' + (0.15 + r() * 0.4) + ')'; const s = 0.6 + r() * 1.8; x.fillRect(r() * S, r() * S, s, s); }
  return c;
}

// ---- 座標 ----
function w2s(x, y) { return [(x - R.cam.x) * R.TS + R.vw / 2, (y - R.cam.y) * R.TS + R.vh / 2]; }
function s2w(sx, sy) { return [(sx - R.vw / 2) / R.TS + R.cam.x, (sy - R.vh / 2) / R.TS + R.cam.y]; }
function s2cell(sx, sy) { const [x, y] = s2w(sx, sy); return [Math.floor(x), Math.floor(y)]; }

function updateCamera(dt) {
  if (!W || !W.hero) return;
  const h = W.hero;
  const viewWt = R.vw / R.TS, viewHt = R.vh / R.TS;
  let tx = h.rx + 0.5 + R.cam.panX, ty = h.ry + 0.5 - viewHt * 0.08 + R.cam.panY;
  if (R.cam.focus) { tx = R.cam.focus.x + R.cam.panX; ty = R.cam.focus.y + R.cam.panY; }
  if (R.cam.panT > 0) { R.cam.panT -= dt; if (R.cam.panT <= 0) { R.cam.panX *= 0.0; R.cam.panY *= 0.0; } }
  else { R.cam.panX *= Math.pow(0.02, dt); R.cam.panY *= Math.pow(0.02, dt); }
  // 端で止める
  if (W.w <= viewWt) tx = W.w / 2; else tx = clamp(tx, viewWt / 2, W.w - viewWt / 2);
  if (W.h <= viewHt) ty = W.h / 2 - (viewHt - W.h) * 0.0; else ty = clamp(ty, viewHt / 2, W.h - viewHt / 2);
  const k = 1 - Math.pow(0.0025, dt);
  if (!R.cam.inited) { R.cam.x = tx; R.cam.y = ty; R.cam.inited = true; }
  R.cam.x += (tx - R.cam.x) * k; R.cam.y += (ty - R.cam.y) * k;
  if (R.cam.shake > 0) R.cam.shake = Math.max(0, R.cam.shake - dt * 1.5);
}

// ---- 地面を描きためる ----
function terrainColor(t, x, y) {
  const v = hash2(x, y, 7) * 0.08 - 0.04;
  switch (t) {
    case T.EARTH: return y > 0 && T_SOLID[tAt(x, y - 1)] ? PAL.earthDeep : PAL.earth;
    case T.ROCK: return hash2(x, y, 3) > 0.5 ? PAL.rock : PAL.rockDeep;
    case T.SAND: return PAL.sand; case T.ICE: return PAL.ice; case T.SNOW: return PAL.snow;
    case T.MUD: return PAL.mud; case T.PLANK: return PAL.plank; case T.CRACK: return PAL.rockDeep; case T.MOSS: return PAL.moss;
  }
  return null;
}
function renderTerrain() {
  const TS = R.TS;
  const key = W.w + 'x' + W.h + '@' + TS + (PAL === PAL_NIGHT ? 'n' : 'd');
  if (!R.terrainCv || R.terrainKey !== key) { R.terrainCv = document.createElement('canvas'); R.terrainCv.width = W.w * TS; R.terrainCv.height = W.h * TS; R.terrainKey = key; W.tdirty = true; }
  if (!W.tdirty) return;
  W.tdirty = false;
  const c = R.terrainCv, x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  const solid = (xx, yy) => { const t = tAt(xx, yy); return T_SOLID[t] && t !== T.BLANK; };
  // 塗り（少しにじませる）
  for (let yy = 0; yy < W.h; yy++) for (let xx = 0; xx < W.w; xx++) {
    const t = W.t[yy * W.w + xx]; if (!T_SOLID[t]) continue;
    const col = terrainColor(t, xx, yy);
    x.fillStyle = col;
    const px = xx * TS, py = yy * TS;
    // 外に出ている角は丸める
    const up = solid(xx, yy - 1), dn = solid(xx, yy + 1), lf = solid(xx - 1, yy), rt = solid(xx + 1, yy);
    const rr = TS * 0.32;
    x.beginPath();
    const tl = !up && !lf ? rr : 0, tr = !up && !rt ? rr : 0, br = !dn && !rt ? rr * .6 : 0, bl = !dn && !lf ? rr * .6 : 0;
    x.moveTo(px + tl, py); x.lineTo(px + TS - tr, py); if (tr) x.quadraticCurveTo(px + TS, py, px + TS, py + tr);
    x.lineTo(px + TS, py + TS - br); if (br) x.quadraticCurveTo(px + TS, py + TS, px + TS - br, py + TS);
    x.lineTo(px + bl, py + TS); if (bl) x.quadraticCurveTo(px, py + TS, px, py + TS - bl);
    x.lineTo(px, py + tl); if (tl) x.quadraticCurveTo(px, py, px + tl, py);
    x.closePath(); x.fill();
    // かすかなむら
    if (t === T.EARTH || t === T.ROCK || t === T.MUD) {
      const g = x.createLinearGradient(0, py, 0, py + TS);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, PAL === PAL_NIGHT ? 'rgba(0,0,10,.12)' : 'rgba(60,40,10,.06)');
      x.fillStyle = g; x.fill();
    }
  }
  // 質感
  for (let yy = 0; yy < W.h; yy++) for (let xx = 0; xx < W.w; xx++) {
    const t = W.t[yy * W.w + xx]; if (!T_SOLID[t]) continue;
    const px = xx * TS, py = yy * TS, r = makeRng(xx * 7919 + yy * 104729 + t);
    if (t === T.ROCK || t === T.CRACK) {
      // 皴（しゅん）：短い斜めの筆
      x.strokeStyle = PAL === PAL_NIGHT ? 'rgba(217,180,92,.22)' : 'rgba(40,36,44,.28)'; x.lineWidth = Math.max(1, TS * 0.035);
      for (let i = 0; i < 3; i++) { const a = px + r() * TS * .8, b = py + r() * TS * .8; x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a + TS * .15, b + TS * .05, a + TS * .22, b + TS * .2); x.stroke(); }
      if (t === T.CRACK) { x.strokeStyle = PAL.edge; x.lineWidth = Math.max(1.5, TS * 0.06); x.beginPath(); x.moveTo(px + TS * .5, py); x.lineTo(px + TS * .42, py + TS * .5); x.lineTo(px + TS * .55, py + TS); x.stroke(); }
    } else if (t === T.EARTH || t === T.MOSS) {
      x.fillStyle = PAL === PAL_NIGHT ? 'rgba(217,180,92,.12)' : 'rgba(70,55,30,.13)';
      for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(px + r() * TS, py + r() * TS, TS * (0.02 + r() * 0.03), 0, TAU); x.fill(); }
    } else if (t === T.SAND) {
      x.fillStyle = 'rgba(120,90,40,.25)';
      for (let i = 0; i < 8; i++) x.fillRect(px + r() * TS, py + r() * TS, 1.2, 1.2);
    } else if (t === T.ICE) {
      x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = Math.max(1, TS * 0.04);
      x.beginPath(); x.moveTo(px + TS * .2, py + TS * .7); x.lineTo(px + TS * .5, py + TS * .3); x.stroke();
      x.strokeStyle = 'rgba(80,130,170,.35)'; x.strokeRect(px + 1, py + 1, TS - 2, TS - 2);
    } else if (t === T.PLANK) {
      x.strokeStyle = 'rgba(60,40,20,.45)'; x.lineWidth = 1;
      for (let i = 1; i < 3; i++) { x.beginPath(); x.moveTo(px, py + TS * i / 3); x.lineTo(px + TS, py + TS * i / 3 + r() * 2); x.stroke(); }
    } else if (t === T.MUD) {
      x.fillStyle = 'rgba(30,20,10,.25)';
      for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(px + r() * TS, py + r() * TS * .6, TS * .12, TS * .05, 0, 0, TAU); x.fill(); }
    }
  }
  // ふち：上は太い墨、横は細い墨
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (let yy = 0; yy < W.h; yy++) for (let xx = 0; xx < W.w; xx++) {
    const t = W.t[yy * W.w + xx]; if (!T_SOLID[t]) continue;
    const px = xx * TS, py = yy * TS, r = makeRng(xx * 31 + yy * 977 + 5);
    const up = solid(xx, yy - 1), dn = solid(xx, yy + 1), lf = solid(xx - 1, yy), rt = solid(xx + 1, yy);
    if (!up) {
      const thick = t === T.SNOW ? TS * 0.05 : TS * (0.075 + r() * 0.03);
      x.strokeStyle = t === T.ICE ? 'rgba(60,110,160,.8)' : t === T.SNOW ? 'rgba(120,140,160,.6)' : PAL.edge;
      x.lineWidth = thick;
      const sx = lf ? px - 1 : px + TS * .22, ex = rt ? px + TS + 1 : px + TS * .78;
      x.beginPath(); x.moveTo(sx, py + 1 + r() * 1.5); x.quadraticCurveTo((sx + ex) / 2, py - 0.5 + r() * 2.5, ex, py + 1 + r() * 1.5); x.stroke();
      // 草・雪の帽子・苔点
      if (t === T.EARTH || t === T.MOSS) {
        x.strokeStyle = PAL === PAL_NIGHT ? 'rgba(156,196,106,.6)' : 'rgba(70,95,40,.75)'; x.lineWidth = Math.max(1, TS * 0.035);
        const n = 1 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) { const gx = px + TS * (0.15 + r() * 0.7), gh = TS * (0.12 + r() * 0.16); x.beginPath(); x.moveTo(gx, py + 1); x.quadraticCurveTo(gx + gh * .2, py - gh * .5, gx + gh * (r() > .5 ? .45 : -.3), py - gh); x.stroke(); }
        if (r() < 0.35) { x.fillStyle = PAL === PAL_NIGHT ? 'rgba(217,180,92,.5)' : 'rgba(28,26,32,.55)'; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(px + TS * (.2 + r() * .6), py + TS * (.06 + r() * .1), TS * .035, TS * .022, -.4, 0, TAU); x.fill(); } }
      }
    }
    x.strokeStyle = PAL.edgeSoft; x.lineWidth = Math.max(1, TS * 0.035);
    if (!lf) { x.beginPath(); x.moveTo(px + .5 + r(), py + (up ? 0 : TS * .25)); x.quadraticCurveTo(px - 1 + r() * 2, py + TS * .5, px + .5, py + TS * (dn ? 1 : .8)); x.stroke(); }
    if (!rt) { x.beginPath(); x.moveTo(px + TS - .5 - r(), py + (up ? 0 : TS * .25)); x.quadraticCurveTo(px + TS + 1 - r() * 2, py + TS * .5, px + TS - .5, py + TS * (dn ? 1 : .8)); x.stroke(); }
    if (!dn && T_SOLID[t]) { x.strokeStyle = PAL.edgeSoft; x.beginPath(); x.moveTo(px + TS * .2, py + TS - .5); x.lineTo(px + TS * .8, py + TS - .5); x.stroke(); }
  }
}

// ---- 遠景 ----
function makeBackdrop(theme) {
  const seed = theme.seed || 3;
  const layers = [];
  for (let li = 0; li < 3; li++) {
    const pts = [];
    const amp = [0.9, 1.4, 2.0][li] * (theme.hills || 1), base = [0.55, 0.62, 0.72][li];
    for (let i = 0; i <= 64; i++) { const u = i / 64; pts.push(base - amp * 0.12 * (fbm1(u * (3 + li * 2) + li * 10, seed + li) - 0.2) - (theme.peak && li === 0 ? Math.exp(-Math.pow((u - theme.peak) * 9, 2)) * 0.22 : 0)); }
    layers.push({ pts, par: [0.15, 0.3, 0.5][li] });
  }
  return { layers, theme };
}
function renderBackdrop(ctx) {
  const bg = R.bg; if (!bg) return;
  const night = PAL === PAL_NIGHT;
  const th = bg.theme;
  // 空のうすい色
  const sky = ctx.createLinearGradient(0, 0, 0, R.vh);
  if (night) { sky.addColorStop(0, 'rgba(10,14,30,.55)'); sky.addColorStop(1, 'rgba(10,14,30,0)'); }
  else if (W.dark > 0.2) { sky.addColorStop(0, 'rgba(40,50,80,' + (W.dark * 0.35) + ')'); sky.addColorStop(1, 'rgba(40,50,80,0)'); }
  else { sky.addColorStop(0, th.sky || 'rgba(170,190,205,.18)'); sky.addColorStop(0.6, 'rgba(255,255,255,0)'); }
  ctx.fillStyle = sky; ctx.fillRect(0, 0, R.vw, R.vh);
  // お日さま・お月さま
  const camPar = R.cam.x * R.TS * 0.05;
  if (th.room) { renderRoomBackdrop(ctx); return; }
  if (W.night || night) {
    const mx = R.vw * 0.72 - camPar, my = R.vh * 0.16;
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, R.TS * 2.2);
    g.addColorStop(0, 'rgba(255,240,200,.35)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, R.TS * 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = W.fullmoon ? '#f4e6b8' : '#e9d79a'; ctx.beginPath(); ctx.arc(mx, my, R.TS * 0.7, 0, TAU); ctx.fill();
    if (!W.fullmoon) { ctx.fillStyle = night ? PAL.paper : '#3a3f5a'; ctx.beginPath(); ctx.arc(mx + R.TS * .32, my - R.TS * .12, R.TS * 0.62, 0, TAU); ctx.fill(); }
  } else if (th.sun !== false) {
    const sx = R.vw * (th.sunX || 0.78) - camPar, sy = R.vh * (W.sunOut ? 0.12 : 0.18);
    ctx.fillStyle = W.sunOut ? 'rgba(200,54,30,.92)' : 'rgba(196,56,31,.78)';
    ctx.beginPath(); ctx.arc(sx, sy, R.TS * (W.sunOut ? 0.95 : 0.75), 0, TAU); ctx.fill();
  }
  // 遠い山なみ
  const cols = night ? ['rgba(60,72,110,.55)', 'rgba(48,58,92,.6)', 'rgba(38,46,76,.65)'] : [th.far0 || 'rgba(120,115,105,.16)', th.far1 || 'rgba(95,92,85,.22)', th.far2 || 'rgba(75,72,68,.26)'];
  bg.layers.forEach((L, li) => {
    const off = -R.cam.x * R.TS * L.par;
    const span = R.vw * 2.2;
    ctx.fillStyle = cols[li];
    ctx.beginPath(); ctx.moveTo(0, R.vh);
    for (let px = -20; px <= R.vw + 20; px += 12) {
      let u = ((px - off) / span) % 1; if (u < 0) u += 1;
      const fi = u * 64, i0 = Math.floor(fi), f = fi - i0;
      const yv = lerp(L.pts[i0], L.pts[(i0 + 1) % 65] || L.pts[0], f);
      ctx.lineTo(px, (yv - (R.cam.y - W.h / 2) * 0.02 * L.par) * R.vh * 1.0);
    }
    ctx.lineTo(R.vw, R.vh); ctx.closePath(); ctx.fill();
    // 霞
    const mg = ctx.createLinearGradient(0, R.vh * (0.5 + li * 0.08), 0, R.vh * (0.75 + li * 0.08));
    mg.addColorStop(0, PAL.mist + '0)'); mg.addColorStop(1, PAL.mist + (0.55 - li * 0.1) + ')');
    ctx.fillStyle = mg; ctx.fillRect(0, R.vh * (0.45 + li * 0.08), R.vw, R.vh * 0.4);
  });
}

// ---- 水 ----
function renderWater(ctx, x0, y0, x1, y1) {
  const TS = R.TS, t = R.t;
  const night = PAL === PAL_NIGHT;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const v = waAt(x, y); if (!v) continue;
      const [sx, sy] = w2s(x, y);
      const above = waAt(x, y - 1);
      const lvl = above > 0 ? 1 : v / WMAX;
      const top = sy + TS * (1 - lvl);
      const deep = clamp(0.22 + (waterDepthAt(x, y) * 0.06), 0.22, 0.5);
      ctx.fillStyle = PAL.water + (W.waterStop > 0 ? deep * 0.7 : deep) + ')';
      ctx.fillRect(sx - 0.5, top, TS + 1, sy + TS - top + 0.5);
      if (!above) {
        // 水面のゆらぎ
        ctx.strokeStyle = night ? 'rgba(200,220,255,.6)' : 'rgba(30,70,130,.55)'; ctx.lineWidth = Math.max(1, TS * 0.04);
        ctx.beginPath();
        for (let k = 0; k <= 4; k++) { const px = sx + TS * k / 4; const py = top + Math.sin(t * 2.2 + (x * 4 + k) * 0.9) * TS * 0.03 * (W.waterStop > 0 ? 0 : 1); if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.stroke();
        if (hash2(x, Math.floor(t * 0.5), 9) > 0.92) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(sx + TS * .3, top + TS * .12); ctx.lineTo(sx + TS * .6, top + TS * .12); ctx.stroke(); }
      }
    }
  }
}

// ---- 字の描き方 ----
function entColor(e) {
  if (e.mods.red) return inkCol('aka'); if (e.mods.blue) return inkCol('ai'); if (e.mods.white) return inkCol('shiro'); if (e.mods.black) return inkCol('sumi');
  if (e.burnT > 0 && !e.d.flame) return mixHex(inkCol(e.d.col), INK.shu, 0.5);
  if (e.k === '枯木') return inkCol('cha');
  return inkCol(e.d.col);
}
function glyphSize(e) {
  const d = e.d;
  if (d.kind === 'plant') return Math.max(e.w, e.h) * 0.98;
  if (e.w === e.h) return e.w * 0.94;
  return Math.min(Math.max(e.w, e.h), Math.min(e.w, e.h) * 1.6);
}
function drawGlyphAt(ctx, k, cx, cy, sizeT, color, opt) {
  const TS = R.TS, px = sizeT * TS;
  const word = k.length > 1;
  if (word) {
    const chars = [...k];
    const vertical = opt && opt.vertical;
    const each = vertical ? px / chars.length : px / chars.length * 1.05;
    chars.forEach((ch, i) => {
      const sp = Brush.sprite(ch, each, color, opt && opt.variant);
      const sc = each / (sp.width - 2 * sp.pad);
      const ox = vertical ? cx - each / 2 : cx - (chars.length * each * 0.92) / 2 + i * each * 0.92;
      const oy = vertical ? cy - px / 2 + i * each : cy - each / 2;
      ctx.drawImage(sp, ox - sp.pad * sc, oy - sp.pad * sc, sp.width * sc, sp.height * sc);
    });
    return;
  }
  const sp = Brush.sprite(k, px, color, opt && opt.variant);
  ctx.drawImage(sp, cx - px / 2 - sp.pad, cy - px / 2 - sp.pad);
}
function renderEnt(ctx, e) {
  const TS = R.TS, d = e.d, t = R.t;
  if (e.hideT > 0 && !e.mine) return;
  const [sx, sy] = w2s(e.rx, e.ry);
  const W_ = e.w * TS, H_ = e.h * TS;
  ctx.save();
  let alpha = 1;
  if (!e.alive) alpha = clamp(e.fadeT / 0.45, 0, 1);
  if (e.hideT > 0) alpha *= 0.3;
  if (e.spawnT > 0) alpha *= 1 - e.spawnT / 0.5;
  ctx.globalAlpha = alpha;
  const cx = sx + W_ / 2, by = sy + H_;
  const col = entColor(e);
  // 影
  if (e.grounded && d.kind !== 'struct' && !d.flat && !d.flame && !d.wisp) {
    ctx.fillStyle = PAL === PAL_NIGHT ? 'rgba(0,0,0,.25)' : 'rgba(40,30,10,.12)';
    ctx.beginPath(); ctx.ellipse(cx, by - 1, W_ * 0.38, TS * 0.07, 0, 0, TAU); ctx.fill();
  }
  // 光のにじみ
  const gl = e.glowR();
  if (gl > 0) {
    const g = ctx.createRadialGradient(cx, sy + H_ / 2, 0, cx, sy + H_ / 2, TS * Math.min(gl, 4) * 0.7);
    g.addColorStop(0, d.flame || e.burnT > 0 ? 'rgba(255,170,80,.35)' : d.coldfire ? 'rgba(120,170,255,.35)' : 'rgba(255,230,150,.32)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - TS * 3, sy + H_ / 2 - TS * 3, TS * 6, TS * 6);
  }
  // 動き：ゆれ・はね・傾き
  let ox = 0, oy = 0, rot = 0, scx = 1, scy = 1;
  const moving = Math.abs(e.rx - e.x) + Math.abs(e.ry - e.y) > 0.05;
  if (d.beast) {
    if (moving) oy -= Math.abs(Math.sin(t * 14 + e.id)) * TS * 0.08;
    else oy -= Math.sin(t * 2 + e.id) * TS * 0.02;
    rot = moving ? e.dir * 0.08 : 0;
    if (e.sleepT > 0) { rot = 0.12; scy = 0.9; }
    if (e.d.fly && e.flying()) { oy -= Math.sin(t * 6 + e.id) * TS * 0.08; scy = 0.9 + Math.abs(Math.sin(t * 12 + e.id)) * 0.12; }
    if (e.danceT > 0) { rot = Math.sin(t * 8 + e.id) * 0.2; oy -= Math.abs(Math.sin(t * 8)) * TS * 0.12; }
    if (e.laughT > 0) rot = Math.sin(t * 20) * 0.07;
    if (e.fearT > 0) ox += Math.sin(t * 40) * TS * 0.02;
    if (e.angryT > 0) { ox += Math.sin(t * 50) * TS * 0.03; }
    if (e.bowT > 0) { rot = 0.35 * e.dir * -1; }
    if (e.hop > 0) { oy -= Math.sin(clamp(e.hop, 0, 1) * Math.PI) * TS * 0.5; e.hop = Math.max(0, e.hop - 0.06); }
  } else if (d.kind === 'plant') {
    rot = Math.sin(t * 1.3 + e.x * 0.7) * 0.025 + (W.wind ? W.wind * 0.03 : 0) + (gustAt(e.x, e.y) ? 0.08 * sign(gustAt(e.x, e.y)) : 0);
  } else if (d.flame) {
    scx = 1 + Math.sin(t * 17 + e.id) * 0.05; scy = 1 + Math.sin(t * 13 + e.id * 2) * 0.08;
  } else if (d.wisp) { oy = Math.sin(t * 2 + e.id) * TS * 0.12; }
  if (e.squash > 0) { scy *= 1 - e.squash * 0.25; scx *= 1 + e.squash * 0.18; }
  if (e.spawnT > 0) { const k = 1 - e.spawnT / 0.5; scx *= easeOutBack(clamp(k, 0, 1)) || 0.01; scy *= easeOutBack(clamp(k, 0, 1)) || 0.01; }
  if (e.stopT > 0) { ctx.filter && (ctx.filter = 'none'); }
  ctx.translate(cx + ox, by + oy);
  ctx.rotate(rot); ctx.scale(scx, scy);
  ctx.translate(-cx, -by);
  // 形の決まった物
  if (d.kind === 'struct' || d.boat || d.cart || e.k === '丸太') renderStruct(ctx, e, sx, sy, W_, H_, col);
  else if (e.morphFrom && e.morphT < 1 && KDEF[e.morphFrom]) renderMorph(ctx, e, sx, sy, W_, H_, col);
  else {
    const gs = glyphSize(e) * (e.tinyFlag ? 0.55 : 1);
    const gcy = d.kind === 'plant' ? by - gs * TS / 2 : sy + H_ / 2 + (e.tinyFlag ? H_ * 0.2 : 0);
    if (d.flame) renderFlameUnder(ctx, cx, by, W_, H_);
    if (e.k === '人' && !e.isHero) { drawHeroFigure(ctx, cx, by, TS * 0.95, { phase: t * 8 * (moving ? 1 : 0), helper: true }); }
    else drawGlyphAt(ctx, e.k, cx, gcy, gs, col, { variant: e.mods.big ? 'bold' : null, vertical: e.h > e.w });
    if (d.lamp && !e.off) { ctx.fillStyle = 'rgba(255,200,120,.35)'; ctx.beginPath(); ctx.ellipse(cx, gcy, W_ * .3, H_ * .35, 0, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  // 状態のしるし
  ctx.save(); ctx.globalAlpha = alpha;
  renderStatus(ctx, e, cx, sy, W_, H_);
  ctx.restore();
}
function renderMorph(ctx, e, sx, sy, W_, H_, col) {
  const TS = R.TS, gs = glyphSize(e) * TS;
  const parts = [e.morphFrom, ...(Brush.get(e.k) ? [] : [])];
  const plan = e._plan || (e._plan = Brush.morphPlan(recipeParts(e.morphFrom, e.k), e.k));
  ctx.save();
  ctx.translate(sx + W_ / 2 - gs / 2, (e.d.kind === 'plant' ? sy + H_ - gs : sy + H_ / 2 - gs / 2));
  const starts = (plan || []).map((pl, i) => ({ x: i === 0 ? 0 : 0, y: 0, s: 1 }));
  if (plan) Brush.drawMorph(ctx, plan.map(p => p.part), e.k, plan, e.morphT, gs, col, starts);
  else Brush.draw(ctx, e.k, gs, col);
  ctx.restore();
  if (e.morphT >= 0.99) e._plan = null;
}
function recipeParts(from, out) { const r = RECIPES.find(r => r.out === out && r.parts.includes(from)); return r ? r.parts.slice() : [from]; }
function renderFlameUnder(ctx, cx, by, W_, H_) {
  const t = R.t;
  for (let i = 0; i < 3; i++) {
    const f = (t * 3 + i * 0.33) % 1;
    ctx.fillStyle = 'rgba(230,110,40,' + (0.25 * (1 - f)) + ')';
    ctx.beginPath(); ctx.ellipse(cx + Math.sin(t * 7 + i) * W_ * 0.12, by - H_ * (0.25 + f * 0.6), W_ * (0.3 - f * 0.18), H_ * (0.3 - f * 0.12), 0, 0, TAU); ctx.fill();
  }
}
function renderStruct(ctx, e, sx, sy, W_, H_, col) {
  const TS = R.TS, d = e.d, t = R.t, night = PAL === PAL_NIGHT;
  const wood = night ? '#6b5640' : '#9b774c', woodDark = night ? '#d4a86a' : '#5c4128';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const seal = (k, x, y, s) => drawGlyphAt(ctx, k, x, y, s, col);
  if (d.bridge || e.k === '板' || e.k === '丸太' || e.k === '一') {
    const y = sy + TS * 0.25, h = TS * 0.5;
    if (e.k === '一') { drawGlyphAt(ctx, '一', sx + W_ / 2, sy + H_ / 2, e.w * 0.95, col); return; }
    ctx.fillStyle = wood; ctx.strokeStyle = woodDark; ctx.lineWidth = Math.max(1.5, TS * 0.06);
    if (e.k === '丸太') { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx + 2, sy + TS * .2, W_ - 4, TS * .7, TS * .35) : ctx.rect(sx + 2, sy + TS * .2, W_ - 4, TS * .7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(sx + W_ - TS * .2, sy + TS * .55, TS * .14, TS * .3, 0, 0, TAU); ctx.stroke(); seal('丸', sx + W_ * .35, sy + TS * .55, .55); seal('太', sx + W_ * .55, sy + TS * .55, .55); return; }
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + W_, y); ctx.lineTo(sx + W_, y + h * 0.6); ctx.lineTo(sx, y + h * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = 1; i < e.w; i++) { ctx.beginPath(); ctx.moveTo(sx + i * TS, y); ctx.lineTo(sx + i * TS, y + h * 0.6); ctx.stroke(); }
    if (d.bridge) { ctx.lineWidth = Math.max(1.5, TS * 0.05); ctx.beginPath(); ctx.moveTo(sx, y - TS * .35); ctx.quadraticCurveTo(sx + W_ / 2, y - TS * .55, sx + W_, y - TS * .35); ctx.stroke(); for (let i = 0; i <= e.w; i++) { ctx.beginPath(); ctx.moveTo(sx + i * TS, y); ctx.lineTo(sx + i * TS, y - TS * .4 - Math.sin(i / e.w * Math.PI) * TS * .2); ctx.stroke(); } }
    seal(e.k, sx + W_ / 2, sy + TS * 0.62, 0.42);
    if (e.burnT > 0) renderFlameUnder(ctx, sx + W_ / 2, sy + TS * .5, W_, TS);
    return;
  }
  if (d.ladder) {
    ctx.strokeStyle = woodDark; ctx.lineWidth = Math.max(2, TS * 0.07);
    ctx.beginPath(); ctx.moveTo(sx + TS * .2, sy + TS * .1); ctx.lineTo(sx + TS * .2, sy + H_); ctx.moveTo(sx + TS * .8, sy + TS * .1); ctx.lineTo(sx + TS * .8, sy + H_); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, TS * 0.05);
    for (let i = 0; i < e.h * 2; i++) { const yy = sy + TS * (0.3 + i * 0.5); if (yy > sy + H_) break; ctx.beginPath(); ctx.moveTo(sx + TS * .2, yy); ctx.lineTo(sx + TS * .8, yy); ctx.stroke(); }
    seal('梯', sx + TS / 2, sy + TS * .1, .45); return;
  }
  if (d.rope) {
    ctx.strokeStyle = night ? '#d4a86a' : '#8c6a3c'; ctx.lineWidth = Math.max(2, TS * 0.08);
    ctx.beginPath(); ctx.moveTo(sx + TS / 2, sy);
    for (let i = 1; i <= e.h * 4; i++) { const yy = sy + TS * i / 4; ctx.lineTo(sx + TS / 2 + Math.sin(t * 1.5 + i * 0.6) * TS * 0.05 * (i / 4), yy); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,40,20,.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < e.h * 4; i++) { const yy = sy + TS * (i + .5) / 4; ctx.beginPath(); ctx.moveTo(sx + TS * .42, yy - 2); ctx.lineTo(sx + TS * .58, yy + 2); ctx.stroke(); }
    seal('縄', sx + TS / 2, sy + TS * .2, .42); return;
  }
  if (d.ivy) {
    ctx.strokeStyle = inkCol('moegi'); ctx.lineWidth = Math.max(1.5, TS * 0.06);
    ctx.beginPath(); ctx.moveTo(sx + TS / 2, sy + H_);
    for (let i = 1; i <= e.h * 3; i++) ctx.lineTo(sx + TS / 2 + Math.sin(i * 1.3) * TS * 0.2, sy + H_ - TS * i / 3);
    ctx.stroke();
    ctx.fillStyle = inkCol('moegi');
    for (let i = 0; i < e.h * 2; i++) { const yy = sy + H_ - TS * (i + .5) / 2; ctx.beginPath(); ctx.ellipse(sx + TS / 2 + (i % 2 ? 1 : -1) * TS * .18, yy, TS * .12, TS * .07, (i % 2 ? .6 : -.6), 0, TAU); ctx.fill(); }
    seal('蔦', sx + TS / 2, sy + TS * .3, .4); return;
  }
  if (d.cloud) {
    ctx.fillStyle = night ? 'rgba(200,210,235,.55)' : 'rgba(250,250,246,.95)';
    ctx.strokeStyle = PAL.edgeSoft; ctx.lineWidth = Math.max(1, TS * 0.04);
    ctx.beginPath();
    for (let i = 0; i < e.w * 2; i++) { const cxp = sx + TS * (0.35 + i * 0.5) * (e.w / (e.w + 0.2)), cyp = sy + TS * (0.55 + Math.sin(i * 2.1 + t) * 0.05); ctx.moveTo(cxp + TS * .4, cyp); ctx.arc(cxp, cyp, TS * (0.38 + (i % 2) * 0.08), 0, TAU); }
    ctx.fill(); ctx.stroke();
    seal('雲', sx + W_ / 2, sy + TS * .55, .6); return;
  }
  if (d.rainbow) {
    const cols = ['#d9534f', '#f0ad4e', '#f7dc6f', '#7dc36b', '#5dade2', '#8e7cc3'];
    cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha *= 1; ctx.lineWidth = TS * 0.09; ctx.beginPath(); ctx.moveTo(sx, sy + TS * (0.2 + i * 0.09)); ctx.quadraticCurveTo(sx + W_ / 2, sy - TS * 0.6 + TS * i * 0.09, sx + W_, sy + TS * (0.2 + i * 0.09)); ctx.stroke(); });
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(sx, sy + TS * .1, W_, TS * .5);
    seal('虹', sx + W_ / 2, sy + TS * .35, .5); return;
  }
  if (d.boat) {
    ctx.fillStyle = wood; ctx.strokeStyle = woodDark; ctx.lineWidth = Math.max(1.5, TS * 0.06);
    ctx.beginPath(); ctx.moveTo(sx - TS * .1, sy + TS * .2); ctx.quadraticCurveTo(sx + W_ / 2, sy + TS * 1.15, sx + W_ + TS * .1, sy + TS * .2); ctx.closePath(); ctx.fill(); ctx.stroke();
    seal(e.k, sx + W_ / 2, sy + TS * .45, .5); return;
  }
  if (d.cart) {
    ctx.fillStyle = wood; ctx.strokeStyle = woodDark; ctx.lineWidth = Math.max(1.5, TS * 0.06);
    ctx.fillRect(sx + 2, sy + TS * .2, W_ - 4, TS * .45); ctx.strokeRect(sx + 2, sy + TS * .2, W_ - 4, TS * .45);
    const sp = (e.spin || 0) * 0.8;
    for (const wx of [sx + TS * .45, sx + W_ - TS * .45]) { ctx.beginPath(); ctx.arc(wx, sy + TS * .78, TS * .2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(wx + Math.cos(sp) * TS * .2, sy + TS * .78 + Math.sin(sp) * TS * .2); ctx.lineTo(wx - Math.cos(sp) * TS * .2, sy + TS * .78 - Math.sin(sp) * TS * .2); ctx.stroke(); }
    seal('車', sx + W_ / 2, sy + TS * .42, .42); return;
  }
  if (d.island) {
    ctx.fillStyle = PAL.earth; ctx.strokeStyle = PAL.edge; ctx.lineWidth = Math.max(1.5, TS * 0.06);
    ctx.beginPath(); ctx.moveTo(sx, sy + TS * .3); ctx.quadraticCurveTo(sx + W_ / 2, sy - TS * .2, sx + W_, sy + TS * .3); ctx.lineTo(sx + W_ - TS * .3, sy + TS); ctx.lineTo(sx + TS * .3, sy + TS); ctx.closePath(); ctx.fill(); ctx.stroke();
    seal('島', sx + W_ / 2, sy + TS * .5, .5); return;
  }
  if (d.gate || d.door) {
    if (e.open) { ctx.globalAlpha *= 0.35; }
    drawGlyphAt(ctx, e.k, sx + W_ / 2, sy + H_ / 2, Math.max(e.w, e.h) * 0.95, col);
    if (e.locked) { ctx.fillStyle = inkCol('kin'); ctx.beginPath(); ctx.arc(sx + W_ / 2, sy + H_ * .6, TS * .13, 0, TAU); ctx.fill(); }
    return;
  }
  if (d.wall) { ctx.fillStyle = PAL.rock; ctx.fillRect(sx + TS * .05, sy, W_ - TS * .1, H_); ctx.strokeStyle = PAL.edge; ctx.lineWidth = 1.5; for (let i = 0; i < e.h; i++) { ctx.strokeRect(sx + TS * .05, sy + i * TS, W_ - TS * .1, TS); } seal('壁', sx + W_ / 2, sy + H_ / 2, .7); return; }
  if (e.k === '柱') { ctx.fillStyle = inkCol('aka'); ctx.fillRect(sx + TS * .2, sy, W_ - TS * .4, H_); seal('柱', sx + W_ / 2, sy + TS * .5, .55); return; }
  if (d.net) { ctx.strokeStyle = PAL.edgeSoft; ctx.lineWidth = 1; for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(sx + W_ * i / 6, sy); ctx.lineTo(sx + W_ * i / 6, sy + H_); ctx.moveTo(sx, sy + H_ * i / 6); ctx.lineTo(sx + W_, sy + H_ * i / 6); ctx.stroke(); } seal('網', sx + W_ / 2, sy + H_ / 2, .7); return; }
  if (e.k === '亀') { drawGlyphAt(ctx, '亀', sx + W_ / 2, sy + H_ - TS * .75, 1.5, col); return; }
  drawGlyphAt(ctx, e.k, sx + W_ / 2, sy + H_ / 2, Math.min(e.w, e.h) * 0.95, col);
}
function renderStatus(ctx, e, cx, sy, W_, H_) {
  const TS = R.TS, t = R.t;
  const mark = (s, col, dy) => { ctx.font = '600 ' + Math.round(TS * 0.36) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(s, cx + W_ * 0.3, sy - TS * 0.05 + (dy || 0)); };
  if (e.charmT > 0 && e.d.beast) { ctx.font = Math.round(TS * 0.3) + 'px ' + FONT; ctx.fillStyle = INK.shu; ctx.textAlign = 'center'; ctx.fillText('♥', cx, sy - TS * 0.08 + Math.sin(t * 4) * 2); }
  if (e.fearT > 0 && e.d.beast) mark('！', INK.ai);
  if (e.angryT > 0) mark('！', INK.shu);
  if (e.stunT > 0) { ctx.fillStyle = INK.kin; for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * W_ * .3, sy + Math.sin(a) * TS * .1, TS * .05, 0, TAU); ctx.fill(); } }
  if (e.frozenT > 0) { ctx.fillStyle = 'rgba(190,225,245,.45)'; ctx.strokeStyle = 'rgba(80,140,190,.7)'; ctx.lineWidth = 1.5; ctx.fillRect(cx - W_ / 2, sy, W_, H_); ctx.strokeRect(cx - W_ / 2, sy, W_, H_); }
  if (e.stopT > 0) { ctx.strokeStyle = 'rgba(120,110,90,.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5; ctx.strokeRect(cx - W_ / 2 - 2, sy - 2, W_ + 4, H_ + 4); ctx.setLineDash([]); ctx.font = '600 ' + Math.round(TS * .28) + 'px ' + FONT; ctx.fillStyle = 'rgba(80,70,60,.75)'; ctx.textAlign = 'right'; ctx.fillText('止', cx + W_ / 2, sy + TS * .25); }
  if (e.wetT > 0 && W.tick % 10 < 5 && e.d.kind !== 'struct') { ctx.fillStyle = 'rgba(40,90,160,.6)'; ctx.beginPath(); ctx.arc(cx - W_ * .25, sy + H_ * .8 + (t * 20 % 6), 2, 0, TAU); ctx.fill(); }
  if (e.mine && e.alive && !e.isHero) { ctx.fillStyle = INK.shu; ctx.globalAlpha *= 0.85; const s = TS * 0.16; ctx.fillRect(cx + W_ / 2 - s - 1, sy + H_ - s - 1, s, s); }
  if (Object.keys(e.mods).length && e.alive) {
    let i = 0; for (const k in e.mods) { if (!e.modInk[k]) continue; const st = (e.stack || []).find(s => s.key === k); const ch = st ? st.k : null; if (!ch) continue; ctx.save(); ctx.globalAlpha *= 0.95; ctx.fillStyle = INK.shu; const s = TS * .3, x = cx - W_ / 2 + i * (s + 2), y = sy - s - 2; ctx.fillRect(x, y, s, s); ctx.font = '600 ' + Math.round(s * .8) + 'px ' + FONT; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, x + s / 2, y + s / 2 + 1); ctx.restore(); i++; }
  }
  if (e.say) drawBubble(ctx, cx, sy - TS * 0.1, e.say);
}
const FONT = "'Shizuku Klee','Hiragino Mincho ProN','Yu Mincho',serif";
function drawBubble(ctx, cx, by, text) {
  const TS = R.TS; const fs = Math.max(12, Math.round(TS * 0.34));
  ctx.font = '600 ' + fs + 'px ' + FONT;
  const lines = wrapText(ctx, text, Math.min(R.vw * 0.6, TS * 6));
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + fs * 1.1, h = lines.length * fs * 1.35 + fs * 0.6;
  let x = clamp(cx - w / 2, 6, R.vw - w - 6), y = by - h - fs * 0.5;
  if (y < 4) y = 4;
  ctx.fillStyle = PAL === PAL_NIGHT ? 'rgba(240,234,216,.95)' : 'rgba(250,247,238,.96)'; ctx.strokeStyle = INK.sumi; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, fs * 0.6) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(clamp(cx, x + 10, x + w - 10) - 5, y + h); ctx.lineTo(clamp(cx, x + 10, x + w - 10), y + h + fs * 0.45); ctx.lineTo(clamp(cx, x + 10, x + w - 10) + 5, y + h); ctx.fillStyle = PAL === PAL_NIGHT ? 'rgba(240,234,216,.95)' : 'rgba(250,247,238,.96)'; ctx.fill();
  ctx.fillStyle = INK.sumi; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, x + fs * 0.55, y + fs * 0.35 + i * fs * 1.35));
  ctx.textBaseline = 'alphabetic';
}
function wrapText(ctx, text, maxW) {
  const out = []; let cur = '';
  for (const ch of text) { if (ctx.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch; }
  if (cur) out.push(cur); return out;
}

// ---- 人（あなた）----
// 頭はしずく、体は「人」の二画が足になる
function drawHeroFigure(ctx, cx, by, size, o) {
  const g = Brush.get('人');
  const s = size / 109;
  const phase = o.phase || 0;
  const swing = Math.sin(phase) * 0.22 * (o.walk === false ? 0 : 1);
  const col = o.col || (PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi);
  ctx.save();
  ctx.translate(cx, by);
  // 頭（しずく）
  const headR = size * 0.165;
  const hx = (o.lean || 0) * size * 0.06, hy = -size * 0.86 + (o.bob || 0);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(hx, hy - headR * 1.9);
  ctx.bezierCurveTo(hx + headR * 0.4, hy - headR * 1.0, hx + headR * 1.05, hy - headR * 0.25, hx + headR, hy + headR * 0.15);
  ctx.arc(hx, hy + headR * 0.1, headR, 0.05, Math.PI - 0.05);
  ctx.bezierCurveTo(hx - headR * 1.05, hy - headR * 0.25, hx - headR * 0.4, hy - headR * 1.0, hx, hy - headR * 1.9);
  ctx.fill();
  if (!o.helper) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(hx - headR * 0.35, hy - headR * 0.1, headR * 0.18, headR * 0.28, -0.4, 0, TAU); ctx.fill(); }
  // 足（人の二画）
  if (g) {
    ctx.translate(-size / 2, -size * 0.98);
    ctx.scale(s, s);
    const W = Brush.baseWidth(2) * 1.3;
    const pivot = [54, 30];
    const legs = [swing, -swing];
    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.translate(pivot[0], pivot[1]); ctx.rotate(legs[i] + (o.spread || 0) * (i ? 1 : -1)); ctx.translate(-pivot[0], -pivot[1]);
      ctx.fillStyle = col; ctx.globalAlpha *= 0.95;
      Brush.drawStroke(ctx, g.strokes[i].p, g.strokes[i].pr, g.strokes[i].kind, W, 11 + i, undefined, false);
      ctx.restore();
    }
  }
  ctx.restore();
}
function renderHero(ctx) {
  const h = W.hero; if (!h || h.hidden) return;
  if (h.birthT > 0.55) return;
  const hb = h.hero, TS = R.TS, t = R.t;
  let rx = h.rx, ry = h.ry;
  if (hb.jump) { const k = clamp(hb.jump.t, 0, 1); ry -= Math.sin(k * Math.PI) * 0.6; }
  const [sx, sy] = w2s(rx, ry);
  const cx = sx + TS / 2, by = sy + TS;
  const moving = Math.abs(h.rx - h.x) + Math.abs(h.ry - h.y) > 0.04;
  if (hb.hurtT > 0) {
    // にじむ
    const k = 1 - hb.hurtT / 1.3;
    ctx.save(); ctx.globalAlpha = 1 - k;
    ctx.fillStyle = PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi;
    ctx.beginPath(); ctx.ellipse(cx, by - TS * 0.15, TS * (0.25 + k * 0.8), TS * (0.1 + k * 0.25), 0, 0, TAU); ctx.fill();
    ctx.restore(); return;
  }
  ctx.save();
  if (hb.buff.hide) ctx.globalAlpha = 0.38;
  if (h.birthT > 0) ctx.globalAlpha = 1 - h.birthT / 0.55;
  // 光
  if (hb.buff.glow) { const g = ctx.createRadialGradient(cx, by - TS / 2, 0, cx, by - TS / 2, TS * 3); g.addColorStop(0, 'rgba(255,230,150,.35)'); g.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = g; ctx.fillRect(cx - TS * 3, by - TS * 3.5, TS * 6, TS * 6); }
  // 影
  if (!hb.climbing) { ctx.fillStyle = 'rgba(40,30,10,.14)'; ctx.beginPath(); ctx.ellipse(cx, by - 1, TS * 0.28, TS * 0.06, 0, 0, TAU); ctx.fill(); }
  let size = TS * 1.0;
  if (hb.buff.big) size *= 1.45; if (hb.buff.tiny) size *= 0.5;
  if (hb.buff.stilts) { ctx.strokeStyle = inkCol('moegi'); ctx.lineWidth = Math.max(2, TS * .06); ctx.beginPath(); ctx.moveTo(cx - TS * .2, by); ctx.lineTo(cx - TS * .2, by - TS * .9); ctx.moveTo(cx + TS * .2, by); ctx.lineTo(cx + TS * .2, by - TS * .9); ctx.stroke(); }
  const yo = hb.buff.stilts ? -TS * 0.7 : 0;
  if (hb.buff.disguise) {
    drawGlyphAt(ctx, '石', cx, by - TS * 0.45, 0.9, inkCol('hai'));
    ctx.fillStyle = INK.sumi; ctx.beginPath(); ctx.arc(cx - TS * .1, by - TS * .5, 2, 0, TAU); ctx.arc(cx + TS * .1, by - TS * .5, 2, 0, TAU); ctx.fill();
  } else {
    const pose = { phase: t * 12, walk: moving && !hb.climbing, bob: moving ? -Math.abs(Math.sin(t * 12)) * TS * 0.05 : Math.sin(t * 2) * TS * 0.015, lean: hb.face * (moving ? 1 : 0.3) };
    if (hb.climbing && moving) { pose.phase = t * 10; pose.walk = true; }
    if (hb.ride) { pose.walk = false; pose.spread = 0.35; }
    if (!h.grounded && !hb.climbing && h.fallN > 0) pose.spread = 0.25;
    if (hb.bowT > 0) pose.lean = hb.face * 3.5;
    ctx.save(); ctx.translate(0, yo);
    if (h.squash > 0) { ctx.translate(cx, by); ctx.scale(1 + h.squash * 0.2, 1 - h.squash * 0.25); ctx.translate(-cx, -by); }
    drawHeroFigure(ctx, cx, by, size, pose);
    ctx.restore();
    if (hb.restT > 0 || (hb.idleT > 6 && entsNear(h.x, h.y, 1.2, o => o.d.kind === 'plant' && o.d.wood).length)) { /* 木にもたれる */ }
  }
  if (hb.buff.umbrella) drawGlyphAt(ctx, '傘', cx, by - size - TS * 0.25 + yo, 0.7, inkCol('ai'));
  if (hb.buff.fly) { ctx.strokeStyle = PAL.edgeSoft; ctx.lineWidth = 1.5; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * TS * .15, by - TS * .55); ctx.quadraticCurveTo(cx + s * TS * .5, by - TS * (.9 + Math.sin(t * 14) * .15), cx + s * TS * .6, by - TS * .5); ctx.stroke(); } }
  if (hb.buff.swim && waAt(h.x, h.y + 1) > 0) Fx.ripple && 0;
  if (hb.buff.bell) { ctx.fillStyle = inkCol('kin'); ctx.beginPath(); ctx.arc(cx + TS * .22, by - TS * .45 + Math.sin(t * 9) * 2, TS * .07, 0, TAU); ctx.fill(); }
  if (hb.buff.kite) drawGlyphAt(ctx, '凧', cx + TS * .3, by - size - TS * .7, .6, inkCol('shu'));
  ctx.restore();
  if (h.say) drawBubble(ctx, cx, by - size - TS * 0.1, h.say);
}

// ---- 薄れたもの ----
function renderFaded(ctx) {
  const TS = R.TS, t = R.t;
  for (const f of W.faded) {
    if (f.restored) continue;
    const [sx, sy] = w2s(f.x, f.y);
    const W_ = f.w * TS, H_ = f.h * TS;
    if (sx > R.vw + W_ || sx + W_ < -W_ || sy > R.vh + H_ || sy + H_ < -H_) continue;
    if (f.draw) { f.draw(ctx, f, sx, sy, W_, H_, t); if (f.hintT > 0) f.hintT -= 1 / 60; continue; }
    ctx.save();
    // 田字格のわく
    ctx.strokeStyle = 'rgba(196,56,31,.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
    ctx.strokeRect(sx + 2, sy + 2, W_ - 4, H_ - 4);
    ctx.beginPath(); ctx.moveTo(sx + W_ / 2, sy + 4); ctx.lineTo(sx + W_ / 2, sy + H_ - 4); ctx.moveTo(sx + 4, sy + H_ / 2); ctx.lineTo(sx + W_ - 4, sy + H_ / 2); ctx.stroke();
    ctx.setLineDash([]);
    // うすい影の字（ぼんやり）
    const pulse = 0.5 + Math.sin(t * 1.6 + f.x) * 0.15;
    ctx.globalAlpha = 0.22 * pulse + (f.hintT > 0 ? 0.25 : 0);
    const gs = Math.max(f.w, f.h) * (f.k.length > 1 ? 0.8 : 0.9);
    const k = f.k;
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(Math.sin(t + i * 2) * 1.5, Math.cos(t * 0.8 + i) * 1.5); drawGlyphAt(ctx, k, sx + W_ / 2, sy + H_ / 2, gs, PAL === PAL_NIGHT ? '#c8b080' : '#8a8070', { variant: 'faded', vertical: f.h > f.w }); ctx.restore(); }
    ctx.restore();
    if (f.hintT > 0) f.hintT -= 1 / 60;
  }
}
// ---- 墨のしずく（拾える）----
function renderDrops(ctx) {
  const TS = R.TS, t = R.t;
  for (const d of W.drops) {
    if (d.got) continue;
    const [sx, sy] = w2s(d.x, d.y);
    const cx = sx + TS / 2, cy = sy + TS * 0.55 + Math.sin(t * 2.5 + d.x) * TS * 0.06;
    const r = TS * 0.16;
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, TS * .6); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx - TS, cy - TS, TS * 2, TS * 2);
    ctx.fillStyle = PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi;
    ctx.beginPath(); ctx.moveTo(cx, cy - r * 2); ctx.bezierCurveTo(cx + r * .5, cy - r, cx + r, cy - r * .2, cx + r, cy + r * .2); ctx.arc(cx, cy + r * .2, r, 0, Math.PI); ctx.bezierCurveTo(cx - r, cy - r * .2, cx - r * .5, cy - r, cx, cy - r * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(cx - r * .35, cy, r * .22, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// ---- 闇 ----
function renderDark(ctx) {
  if (W.dark <= 0.01) return;
  if (!R.darkCv || R.darkCv.width !== R.cv.width) { R.darkCv = document.createElement('canvas'); R.darkCv.width = R.cv.width; R.darkCv.height = R.cv.height; }
  const d = R.darkCv.getContext('2d');
  d.setTransform(1, 0, 0, 1, 0, 0);
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, R.darkCv.width, R.darkCv.height);
  d.fillStyle = PAL === PAL_NIGHT ? 'rgba(6,9,22,' + (W.dark * 0.92) + ')' : 'rgba(14,16,32,' + (W.dark * 0.85) + ')';
  d.fillRect(0, 0, R.darkCv.width, R.darkCv.height);
  d.globalCompositeOperation = 'destination-out';
  d.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
  const TS = R.TS;
  const lights = [];
  for (const e of W.ents) { if (!e.alive) continue; const r = e.glowR(); if (r > 0) lights.push([e.rx + e.w / 2, e.ry + e.h / 2, r]); }
  if (W.hero) lights.push([W.hero.rx + .5, W.hero.ry + .5, W.hero.hero.buff.glow ? 4.5 : 1.2]);
  for (const [x, y, r] of lights) {
    const [sx, sy] = w2s(x, y);
    const rad = r * TS * 1.1;
    const g = d.createRadialGradient(sx, sy, 0, sx, sy, rad);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g; d.beginPath(); d.arc(sx, sy, rad, 0, TAU); d.fill();
  }
  ctx.drawImage(R.darkCv, 0, 0, R.vw, R.vh);
  // 灯りのあたたかい色
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r] of lights) { if (r < 1.5) continue; const [sx, sy] = w2s(x, y); const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * TS); g.addColorStop(0, 'rgba(90,60,20,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(sx - r * TS, sy - r * TS, r * TS * 2, r * TS * 2); }
  ctx.restore();
}
// ---- 白紙（まだ書かれていない所）----
function renderBlank(ctx, x0, y0, x1, y1) {
  const TS = R.TS;
  ctx.save();
  ctx.fillStyle = PAL.blank;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (tAt(x, y) !== T.BLANK) continue;
    const [sx, sy] = w2s(x, y);
    ctx.fillRect(sx - 0.5, sy - 0.5, TS + 1, TS + 1);
  }
  // やぶれたふち
  ctx.strokeStyle = PAL === PAL_NIGHT ? 'rgba(217,180,92,.3)' : 'rgba(120,100,60,.28)'; ctx.lineWidth = 1.2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (tAt(x, y) !== T.BLANK) continue;
    const [sx, sy] = w2s(x, y);
    const r = makeRng(x * 131 + y * 7);
    const edge = (ax, ay, bx, by) => { ctx.beginPath(); ctx.moveTo(ax, ay); for (let k = 1; k <= 4; k++) { const u = k / 4; ctx.lineTo(lerp(ax, bx, u) + (r() - .5) * 3, lerp(ay, by, u) + (r() - .5) * 3); } ctx.stroke(); };
    if (tAt(x, y - 1) !== T.BLANK && y > 0) edge(sx, sy, sx + TS, sy);
    if (tAt(x - 1, y) !== T.BLANK) edge(sx, sy, sx, sy + TS);
    if (tAt(x + 1, y) !== T.BLANK) edge(sx + TS, sy, sx + TS, sy + TS);
  }
  ctx.restore();
}
// ---- 書いている筆 ----
function renderWriting(ctx) {
  for (const w of R.writing) {
    const [sx, sy] = w2s(w.x, w.y);
    const TS = R.TS, size = w.size * TS;
    const k = clamp(w.t / w.dur, 0, 1);
    const n = strokesOf(w.k);
    ctx.save();
    ctx.globalAlpha = 0.95;
    const chars = [...w.k];
    chars.forEach((ch, i) => {
      const sc = Brush.strokeCount(ch);
      const before = chars.slice(0, i).reduce((a, c) => a + Brush.strokeCount(c), 0);
      const prog = clamp(k * n - before, 0, sc);
      const each = size / chars.length;
      ctx.save(); ctx.translate(sx + w.w * TS / 2 - size / 2 + i * each, sy + w.h * TS / 2 - each / 2);
      Brush.draw(ctx, ch, each, w.col, { strokes: prog, bleed: false });
      ctx.restore();
    });
    // 筆先
    const bx = sx + w.w * TS / 2 + Math.sin(w.t * 30) * size * 0.25, byy = sy + w.h * TS / 2 + Math.cos(w.t * 23) * size * 0.25;
    ctx.strokeStyle = PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi; ctx.lineWidth = Math.max(2, TS * 0.08); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, byy); ctx.lineTo(bx + TS * 0.5, byy - TS * 1.1); ctx.stroke();
    ctx.fillStyle = INK.shu; ctx.fillRect(bx + TS * 0.42, byy - TS * 1.25, TS * 0.16, TS * 0.2);
    ctx.restore();
  }
}
// ---- 引っぱっている時の見立て ----
function renderPreview(ctx) {
  const p = R.preview; if (!p || !p.plan) return;
  const TS = R.TS, pl = p.plan, t = R.t;
  ctx.save();
  const ok = !['none', 'noroom', 'noeffect', 'wrongname'].includes(pl.kind) && (pl.cost || 0) <= Ink.free();
  const col = ok ? 'rgba(196,56,31,.85)' : 'rgba(110,100,90,.7)';
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 20;
  let bx = p.tx, by = p.ty, bw = 1, bh = 1;
  if (pl.target) { bx = pl.target.x; by = pl.target.y; bw = pl.target.w; bh = pl.target.h; }
  else if (pl.faded) { bx = pl.faded.x; by = pl.faded.y; bw = pl.faded.w; bh = pl.faded.h; }
  else if (pl.x != null && pl.w) { bx = pl.x; by = pl.y; bw = pl.w; bh = pl.h; }
  else if (pl.x != null && pl.kind === 'place') { bx = pl.x; by = pl.y; bw = pl.w || 1; bh = pl.h || 1; }
  const [sx, sy] = w2s(bx, by);
  ctx.strokeRect(sx + 1, sy + 1, bw * TS - 2, bh * TS - 2);
  ctx.setLineDash([]);
  // 置かれる形の影
  if (ok && (pl.kind === 'place' || pl.kind === 'event' && pl.w)) {
    ctx.globalAlpha = 0.35;
    const d = KDEF[p.k];
    if (d && d.kind !== 'sky') drawGlyphAt(ctx, p.k, sx + bw * TS / 2, sy + bh * TS / 2, Math.min(bw, bh) * 0.9, inkCol(d.col), { vertical: bh > bw });
    ctx.globalAlpha = 1;
  }
  // ことば
  const label = pl.msg || '';
  const costS = (pl.cost && ok) ? ('墨 ' + pl.cost) : (pl.cost > Ink.free() ? '墨が足りない' : '');
  const text = [label, costS].filter(Boolean).join('　');
  if (text) {
    ctx.font = '600 ' + Math.max(13, Math.round(TS * 0.34)) + 'px ' + FONT;
    const tw = ctx.measureText(text).width + 16;
    let lx = clamp(sx + bw * TS / 2 - tw / 2, 6, R.vw - tw - 6), ly = sy - TS * 0.55;
    if (ly < 8) ly = sy + bh * TS + 6;
    ctx.fillStyle = ok ? 'rgba(196,56,31,.92)' : 'rgba(60,56,52,.85)';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx, ly - TS * 0.32, tw, TS * 0.46, 6) : ctx.rect(lx, ly - TS * .32, tw, TS * .46); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, lx + tw / 2, ly - TS * 0.09);
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
}

// ---- 季節の空気（舞う雪・紅葉・花びら・蛍）：絵だけで、世界には触れない ----
const AMB = { kind: null, list: [], camX: 0, camY: 0, few: (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })() };
function ambSpawn(kind, anywhere) {
  const r = Math.random;
  const p = { t: r() * 10, ph: r() * TAU, depth: 0.4 + r() * 0.8, rot: r() * TAU, spin: (r() - .5) * 3 };
  p.x = r() * (R.vw + 60) - 30; p.y = anywhere ? r() * R.vh : -10 - r() * 40;
  if (kind === 'snow') { p.vx = (r() - .5) * 0.2; p.vy = 0.5 + r() * 0.7; p.sway = 0.35; p.wf = 1 + r(); p.s = 1.2 + r() * 2.4; }
  else if (kind === 'leaves') { p.vx = -0.2 + r() * 0.3; p.vy = 0.6 + r() * 0.6; p.sway = 0.9; p.wf = 1.5 + r(); p.s = 3.5 + r() * 3; p.col = ['#c4381f', '#c8742a', '#b8461f', '#d29a2c'][Math.floor(r() * 4)]; }
  else if (kind === 'petals') { p.vx = 0.25 + r() * 0.4; p.vy = 0.35 + r() * 0.45; p.sway = 0.6; p.wf = 1.8 + r(); p.s = 2.6 + r() * 1.8; p.col = ['#e8a6b8', '#f2c4cf', '#dc8fa6'][Math.floor(r() * 3)]; }
  else { p.vx = (r() - .5) * 0.25; p.vy = (r() - .5) * 0.15; p.sway = 0.25; p.wf = 0.6 + r() * 0.5; p.s = 1.6 + r() * 1.2; p.y = R.vh * (0.3 + r() * 0.6); }
  return p;
}
function renderAmbient(ctx, dt, layer) {
  const kind = Scene.cur && Scene.cur.ambient;
  if (!kind || R.snap || (layer === 'top') !== (kind === 'fireflies')) return;
  if (AMB.kind !== kind) { AMB.kind = kind; AMB.list = []; AMB.camX = R.cam.x; AMB.camY = R.cam.y; }
  const N = Math.round((kind === 'snow' ? 44 : kind === 'fireflies' ? 16 : 20) * (AMB.few ? 0.35 : 1) * clamp(R.vw / 420, 0.7, 2.2));
  while (AMB.list.length < N) AMB.list.push(ambSpawn(kind, true));
  const dcx = (R.cam.x - AMB.camX) * R.TS, dcy = (R.cam.y - AMB.camY) * R.TS; AMB.camX = R.cam.x; AMB.camY = R.cam.y;
  const TS = R.TS, wind = (W.wind || 0) + (W.zones && W.zones.length && !(W.calmT > 0) ? W.zones[0].dir * 0.8 : 0);
  ctx.save();
  for (const p of AMB.list) {
    p.t += dt; p.rot += p.spin * dt;
    p.x += ((p.vx + wind * 0.5 * p.depth + Math.sin(p.t * p.wf + p.ph) * p.sway) * dt * TS) - dcx * p.depth;
    p.y += (p.vy * dt * TS) - dcy * p.depth;
    if (p.y > R.vh + 20 || p.x < -40 || p.x > R.vw + 40 || (kind === 'fireflies' && (p.y < -20))) Object.assign(p, ambSpawn(kind, kind === 'fireflies'));
    if (kind === 'snow') { ctx.globalAlpha = 0.55 + 0.35 * p.depth / 1.2; ctx.fillStyle = '#fbfaf6'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * p.depth, 0, TAU); ctx.fill(); }
    else if (kind === 'fireflies') {
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(p.t * 2.2 + p.ph));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 6); g.addColorStop(0, 'rgba(230,240,140,' + (0.55 * a) + ')'); g.addColorStop(1, 'rgba(230,240,140,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(p.x - p.s * 6, p.y - p.s * 6, p.s * 12, p.s * 12);
      ctx.fillStyle = 'rgba(245,250,190,' + a + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
    } else {
      ctx.globalAlpha = 0.85; ctx.fillStyle = p.col;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.sin(p.t * 3 + p.ph)));
      const s = p.s * p.depth;
      ctx.beginPath();
      if (kind === 'leaves') { ctx.moveTo(0, -s); ctx.lineTo(s * 0.35, -s * 0.2); ctx.lineTo(s, -s * 0.3); ctx.lineTo(s * 0.45, s * 0.25); ctx.lineTo(s * 0.6, s); ctx.lineTo(0, s * 0.5); ctx.lineTo(-s * 0.6, s); ctx.lineTo(-s * 0.45, s * 0.25); ctx.lineTo(-s, -s * 0.3); ctx.lineTo(-s * 0.35, -s * 0.2); ctx.closePath(); }
      else { ctx.ellipse(0, 0, s, s * 0.6, 0, 0, TAU); }
      ctx.fill(); ctx.restore();
    }
  }
  ctx.restore();
}

// ---- 一こま ----
function renderFrame(dt) {
  const ctx = R.ctx; if (!W) return;
  R.t += dt;
  ctx.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
  // 位置を追いかける
  for (const e of W.ents) {
    const dx = e.x - e.rx, dy = e.y - e.ry;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 6) { e.rx = e.x; e.ry = e.y; continue; }
    const spd = (e.isHero ? 6.5 : 6) * dt * (dy > 0.5 ? 2.6 : 1) * (e.isHero && e.hero.buff.fast ? 1.8 : 1);
    e.rx += clamp(dx, -spd - Math.abs(dx) * dt * 4, spd + Math.abs(dx) * dt * 4);
    e.ry += clamp(dy, -spd - Math.abs(dy) * dt * 6, spd + Math.abs(dy) * dt * 6);
  }
  updateCamera(dt);
  const sh = R.cam.shake > 0 ? R.cam.shake * R.TS * 0.15 : 0;
  if (sh) ctx.translate((Math.random() - .5) * sh, (Math.random() - .5) * sh);
  // 紙
  const paper = PAL === PAL_NIGHT ? R.nightPaperCv : R.paperCv;
  if (!R.paperPat || R.paperPat.src !== paper) { R.paperPat = ctx.createPattern(paper, 'repeat'); R.paperPat.src = paper; }
  ctx.save();
  const offX = -((R.cam.x * R.TS) % 512), offY = -((R.cam.y * R.TS) % 512);
  ctx.translate(offX, offY); ctx.fillStyle = R.paperPat; ctx.fillRect(-offX - 2, -offY - 2, R.vw + 4, R.vh + 4); ctx.restore();
  renderBackdrop(ctx);
  // 地面
  renderTerrain();
  const [ox, oy] = w2s(0, 0);
  ctx.drawImage(R.terrainCv, ox, oy, W.w * R.TS, W.h * R.TS);
  const [cx0, cy0] = s2cell(0, 0), [cx1, cy1] = s2cell(R.vw, R.vh);
  const x0 = Math.max(0, cx0 - 1), y0 = Math.max(0, cy0 - 1), x1 = Math.min(W.w - 1, cx1 + 1), y1 = Math.min(W.h - 1, cy1 + 1);
  renderFaded(ctx);
  renderDrops(ctx);
  // 字（後ろから）
  const vis = W.ents.filter(e => !e.isHero && e.rx + e.w >= x0 - 2 && e.rx <= x1 + 2 && e.ry + e.h >= y0 - 2 && e.ry <= y1 + 2);
  vis.sort((a, b) => (a.d.kind === 'plant' ? 0 : a.d.kind === 'struct' ? 1 : 2) - (b.d.kind === 'plant' ? 0 : b.d.kind === 'struct' ? 1 : 2));
  for (const e of vis) { if (!e.d.beast) renderEnt(ctx, e); }
  renderWater(ctx, x0, y0, x1, y1);
  for (const e of vis) { if (e.d.beast) renderEnt(ctx, e); }
  renderHero(ctx);
  if (Scene.cur && Scene.cur.renderOver) Scene.cur.renderOver(ctx, dt);
  Fx.render(ctx, dt);
  renderAmbient(ctx, dt, 'mid');
  renderRainAndFog(ctx, dt);
  renderBlank(ctx, x0, y0, x1, y1);
  renderDark(ctx);
  renderAmbient(ctx, dt, 'top');
  renderWriting(ctx);
  renderPreview(ctx);
  Fx.renderTop(ctx, dt);
  // 端：白紙へとけていく
  const edgeW = R.TS * 0.8;
  const [lx] = w2s(0, 0), [rx] = w2s(W.w, 0);
  if (lx > 0) { ctx.fillStyle = PAL.blank; ctx.fillRect(0, 0, lx, R.vh); }
  if (rx < R.vw) { ctx.fillStyle = PAL.blank; ctx.fillRect(rx, 0, R.vw - rx, R.vh); }
  if (Scene.cur && Scene.cur.exitX == null) { const g = ctx.createLinearGradient(rx - edgeW, 0, rx, 0); g.addColorStop(0, 'rgba(196,56,31,0)'); g.addColorStop(1, 'rgba(196,56,31,.10)'); ctx.fillStyle = g; ctx.fillRect(rx - edgeW, 0, edgeW, R.vh); }
}
function renderRainAndFog(ctx, dt) {
  const TS = R.TS;
  for (const r of W.rains) {
    const [sx, sy] = w2s(r.x, r.y);
    // 雲
    ctx.fillStyle = r.snow ? 'rgba(235,238,245,.85)' : (PAL === PAL_NIGHT ? 'rgba(80,90,120,.7)' : 'rgba(120,125,135,.55)');
    for (let i = 0; i < r.w * 1.5; i++) { ctx.beginPath(); ctx.arc(sx + (i / 1.5 + 0.3) * TS, sy + Math.sin(i * 1.7) * TS * 0.15 + TS * 0.3, TS * (0.45 + (i % 3) * 0.1), 0, TAU); ctx.fill(); }
    // 雨すじ
    ctx.strokeStyle = r.snow ? 'rgba(255,255,255,.9)' : 'rgba(40,80,140,.5)'; ctx.lineWidth = r.snow ? 2.5 : 1.2; ctx.lineCap = 'round';
    for (let i = 0; i < r.w * 5; i++) {
      const fx = sx + ((i * 37) % (r.w * TS)), fall = ((R.t * (r.snow ? 2 : 9) * TS + i * 53) % (TS * 8));
      const fy = sy + TS * 0.6 + fall;
      ctx.beginPath(); if (r.snow) { ctx.arc(fx + Math.sin(R.t * 2 + i) * 4, fy, 1.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill(); } else { ctx.moveTo(fx, fy); ctx.lineTo(fx - 2 - W.wind * 3, fy + TS * 0.3); ctx.stroke(); }
    }
  }
  for (const f of W.fogs || []) {
    f.ttl -= dt; const [sx, sy] = w2s(f.x, f.y);
    const a = clamp(f.ttl / 3, 0, 1) * 0.7;
    const g = ctx.createRadialGradient(sx + f.w * TS / 2, sy + f.h * TS / 2, 0, sx + f.w * TS / 2, sy + f.h * TS / 2, f.w * TS * 0.6);
    g.addColorStop(0, 'rgba(240,240,238,' + a + ')'); g.addColorStop(1, 'rgba(240,240,238,0)');
    ctx.fillStyle = g; ctx.fillRect(sx - TS, sy - TS, (f.w + 2) * TS, (f.h + 2) * TS);
  }
  if (W.fogs) W.fogs = W.fogs.filter(f => f.ttl > 0);
}

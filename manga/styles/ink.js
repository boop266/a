/* =========================================================
   manga/styles/ink.js — 作画の土台（線・トーン・レイヤー）
   ・canvas 2D だけで「Gペンの線」「ハッチング」「網点」「カケアミ」「ベタ」を描く
   ・すべて MangaStylesKit（K）に入れて、ほかのファイルから使う
   読み込み順：ink.js → art.js → figure.js → background.js → effects.js → api.js
   ========================================================= */
(() => {
  const K = window.MangaStylesKit = window.MangaStylesKit || {};
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, s) => [a[0] * s, a[1] * s], len: a => Math.hypot(a[0], a[1]),
    norm: a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
    perp: a => [-a[1], a[0]], lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), dot: (a, b) => a[0] * b[0] + a[1] * b[1],
    rot: (a, r) => [a[0] * Math.cos(r) - a[1] * Math.sin(r), a[0] * Math.sin(r) + a[1] * Math.cos(r)],
  };
  // ---------- 乱数（呼び出しごとに種を決めて、毎回同じ絵になる） ----------
  let _s = 1;
  const seed = s => { _s = (s >>> 0) || 1; };
  const rand = () => { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * rand();
  const rg = (m = 0, s = 1) => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  const pick = a => a[Math.floor(rand() * a.length)];
  const hashStr = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function hash2(x, y) { let h = (x | 0) * 374761393 + (y | 0) * 668265263; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
  }
  // ---------- 曲線 ----------
  function catmull(P, seg = 8, closed = false) {
    const n = P.length; if (n < 2) return P.slice();
    if (n === 2 && !closed) { const o = []; for (let k = 0; k <= seg; k++) o.push(V.lerp(P[0], P[1], k / seg)); return o; }
    const out = [], g = i => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)], last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let k = 0; k < seg; k++) {
        const t = k / seg, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    if (!closed) out.push(P[n - 1]);
    return out;
  }
  function ellipsePts(cx, cy, rx, ry, rot = 0, n = 40, a0 = 0, a1 = TAU) { const o = []; const full = Math.abs(a1 - a0 - TAU) < 1e-6; const m = full ? n - 1 : n; for (let i = 0; i <= m; i++) { const a = a0 + (a1 - a0) * i / n; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return o; }
  const polyArea = P => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  function sweep(C, wfn) {
    const n = C.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)]; const d = V.norm(V.sub(b, a)), nn = [-d[1], d[0]];
      const w = wfn(n > 1 ? i / (n - 1) : 0, i); const wl = Array.isArray(w) ? w[0] : w, wr = Array.isArray(w) ? w[1] : w;
      L.push([C[i][0] + nn[0] * wl, C[i][1] + nn[1] * wl]); R.push([C[i][0] - nn[0] * wr, C[i][1] - nn[1] * wr]);
    }
    return { L, R, poly: L.concat(R.slice().reverse()) };
  }
  function bbox(P) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { if (p[0] < x0) x0 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[0] > x1) x1 = p[0]; if (p[1] > y1) y1 = p[1]; } return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
  function convexHull(P) {
    const pts = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (pts.length < 3) return pts;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  const fillPoly = (c, P) => { if (!P || P.length < 2) return; c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); c.closePath(); c.fill(); };
  const pathPoly = (c, P) => { c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); c.closePath(); };

  // ---------- 線の質（art から決まる）----------
  // LS = { w: 太さ倍率, taper: 入り抜き 0..1, jitter, rough, soft, grain }
  let LS = { w: 1, taper: 0.7, jitter: 0.2, rough: 0, soft: 0, grain: 0 };
  const setLine = o => { LS = Object.assign({ w: 1, taper: 0.7, jitter: 0.2, rough: 0, soft: 0, grain: 0 }, o); };
  const getLine = () => LS;
  // Gペン描線：密な点列 P、最大太さ w。o.tin/o.tout, o.wf(t,p,n), o.closed
  function penPath(ctx, P, w, o = {}) {
    const n = P.length; if (n < 2 || !(w > 0)) return;
    const closed = !!o.closed;
    const L = [0]; for (let i = 1; i < n; i++) L.push(L[i - 1] + V.dist(P[i - 1], P[i]));
    const tot = L[n - 1]; if (tot < 0.05) return;
    const tp = o.taper ?? LS.taper;
    const tin = Math.min(tot * 0.45, (o.tin ?? w * 5) * (0.15 + tp)), tout = Math.min(tot * 0.5, (o.tout ?? w * 8) * (0.15 + tp));
    const mn = o.min ?? lerp(0.6, 0.05, tp), ph = o.ph ?? rand() * 100, wob = (o.wob ?? 0.12) * (0.3 + tp);
    const jit = (o.jit ?? 1) * LS.jitter * Math.min(2.2, 0.6 + w * 0.5), jph = rand() * 50;
    const Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = P[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      const d = V.norm(V.sub(b, a)); const nn = [-d[1], d[0]];
      const s = L[i]; let f = 1;
      if (!closed) { if (s < tin) f *= Math.pow(s / tin, 0.65); if (tot - s < tout) f *= Math.pow((tot - s) / tout, 0.75); }
      f *= 1 + wob * Math.sin(s * 0.11 + ph) * Math.sin(s * 0.037 + ph * 1.7);
      if (o.wf) f = f * lerp(1, o.wf(s / tot, P[i], nn), o.wfK ?? Math.max(0.25, tp));
      f = Math.max(f, mn);
      const hw = w * f / 2;
      let px = P[i][0], py = P[i][1];
      if (jit > 0) { const q = s * 0.045 + jph; px += (vnoise(q, 1.3) - 0.5) * 2 * jit; py += (vnoise(2.7, q) - 0.5) * 2 * jit; }
      Lf.push([px + nn[0] * hw, py + nn[1] * hw]); Rt.push([px - nn[0] * hw, py - nn[1] * hw]);
    }
    ctx.beginPath();
    if (closed) {
      ctx.moveTo(Lf[0][0], Lf[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(Lf[i][0], Lf[i][1]); ctx.closePath();
      ctx.moveTo(Rt[n - 1][0], Rt[n - 1][1]); for (let i = n - 2; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]); ctx.closePath();
      ctx.fill('nonzero');
    } else {
      ctx.moveTo(Lf[0][0], Lf[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(Lf[i][0], Lf[i][1]);
      // 丸い端（taper が低いとマーカーのような丸）
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]); ctx.closePath(); ctx.fill();
      if (tp < 0.5 && !o.noCap) { const r0 = V.dist(Lf[0], Rt[0]) / 2, r1 = V.dist(Lf[n - 1], Rt[n - 1]) / 2; ctx.beginPath(); ctx.arc(P[0][0], P[0][1], r0, 0, TAU); ctx.arc(P[n - 1][0], P[n - 1][1], r1, 0, TAU); ctx.fill(); }
    }
  }
  // 手描きの線：rough が高いと、ずれた二度描き（ラフさ）が加わる
  function ink(ctx, C, w, o = {}) {
    const P = o.dense ? C : catmull(C, o.seg ?? 7, o.closed);
    const ww = w * LS.w;
    penPath(ctx, P, ww, o);
    if (LS.rough > 0.15 && !o.noRough && P.length > 3 && rand() < LS.rough) {
      const off = rr(0.6, 1.6) * LS.rough * Math.min(2.5, ww + 0.5); const a = rand() * TAU; const d = [Math.cos(a) * off, Math.sin(a) * off];
      const s0 = Math.floor(rand() * P.length * 0.3), s1 = Math.max(s0 + 3, Math.floor(P.length * rr(0.6, 1)));
      const ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.75;
      penPath(ctx, P.slice(s0, s1).map(p => [p[0] + d[0], p[1] + d[1]]), ww * 0.55, Object.assign({}, o, { closed: false }));
      ctx.globalAlpha = ga;
    }
  }
  let LIGHT = V.norm([-0.6, -0.8]);
  const setLight = l => { LIGHT = V.norm(l); }; const getLight = () => LIGHT;
  // 光の反対側（影側）を太くする輪郭
  function contour(ctx, P, w, o = {}) {
    const closed = o.closed ?? true;
    const sgn = closed ? (polyArea(P) > 0 ? 1 : -1) : (o.sgn ?? 1); const Lt = o.light || LIGHT;
    const base = o.base ?? 0.5, k = o.k ?? 1.1;
    const P2 = P.length < 12 ? catmull(P, 4, closed) : P;
    ink(ctx, P2, w, Object.assign({}, o, { dense: true, closed, wf: (t, p, nn) => { const out = [nn[0] * -sgn, nn[1] * -sgn]; const d = -(out[0] * Lt[0] + out[1] * Lt[1]); return base + k * Math.max(0, d); } }));
  }

  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

  // ---------- レイヤー ----------
  // m: 固有色（material、0=白〜1=黒）, s: 影の強さ（0=光〜1=影）, l: 線画, hi: 白い艶線
  // 奥の物から順に描き、手前の物は奥の線を消す（knock）
  class Layer {
    constructor(box, S) {
      this.box = { x: Math.floor(box.x) - 2, y: Math.floor(box.y) - 2, w: Math.ceil(box.w) + 4, h: Math.ceil(box.h) + 4 }; this.S = S;
      const { x, y, w, h } = this.box;
      this.mc = mkCanvas(w * S, h * S); this.sc = mkCanvas(w * S, h * S); this.lc = mkCanvas(w * S, h * S); this.hc = mkCanvas(w * S, h * S);
      [this.m, this.s, this.l, this.hi] = [this.mc, this.sc, this.lc, this.hc].map(c => { const g = c.getContext('2d'); g.setTransform(S, 0, 0, S, -x * S, -y * S); g.lineCap = 'round'; g.lineJoin = 'round'; return g; });
      this.l.fillStyle = '#000'; this.hi.fillStyle = '#fff';
    }
    g(v) { const q = Math.round(255 * (1 - clamp(v))); return `rgb(${q},${q},${q})`; }
    knock(P) { for (const c of [this.l, this.hi]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; fillPoly(c, P); c.restore(); } }
    // 形を塗る：mat=固有色、o.shade=影の強さ、o.off=光の方向へのずらし量（三日月形の影）
    fill(P, mat, o = {}) {
      if (!P || P.length < 3) return;
      const m = this.m, s = this.s;
      m.fillStyle = this.g(mat); fillPoly(m, P);
      const sh = o.shade ?? 0.8;
      s.save(); s.beginPath(); pathPoly(s, P); s.clip();
      s.fillStyle = this.g(sh); fillPoly(s, P);
      if (sh > 0) {
        const L = o.light || LIGHT, off = o.off ?? 4, bl = o.blur ?? 0.8;
        if (bl > 0) s.filter = `blur(${bl * this.S}px)`;
        s.fillStyle = this.g(0); fillPoly(s, P.map(p => [p[0] + L[0] * off, p[1] + L[1] * off]));
        s.filter = 'none';
      }
      s.restore();
      if (o.knock !== false) this.knock(P);
    }
    // 形の中に追加の影（落ち影など）
    shadeIn(clipP, P, v = 0.9, blur = 1) { const s = this.s; s.save(); s.beginPath(); pathPoly(s, clipP); s.clip(); if (blur) s.filter = `blur(${blur * this.S}px)`; s.fillStyle = this.g(v); fillPoly(s, P); s.restore(); }
    matIn(clipP, P, v, blur = 0) { const m = this.m; m.save(); m.beginPath(); pathPoly(m, clipP); m.clip(); if (blur) m.filter = `blur(${blur * this.S}px)`; m.fillStyle = this.g(v); fillPoly(m, P); m.restore(); }
  }

  // ---------- トーン地図 → インク ----------
  function readMaps(ly) {
    const W = ly.mc.width, H = ly.mc.height;
    const md = ly.m.getImageData(0, 0, W, H).data, sd = ly.s.getImageData(0, 0, W, H).data;
    const n = W * H, M = new Float32Array(n), Sh = new Float32Array(n), A = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const a = md[i * 4 + 3]; A[i] = a; if (a) { M[i] = 1 - md[i * 4] / 255; Sh[i] = 1 - sd[i * 4] / 255; } }
    return { M, Sh, A, w: W, h: H };
  }
  // 網点（levels があれば段階に量子化＝貼りトーン、なければグラデーション）
  function dots(out, V0, A, W, H, o) {
    const per = o.per, ang = o.ang ?? Math.PI / 4, ca = Math.cos(ang), sa = Math.sin(ang);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (A[i] < 128) continue; let v = V0[i]; if (v < 0.04) continue;
      if (o.levels) { let q = 0; for (const L of o.levels) if (v >= L[0]) q = L[1]; v = q; if (!v) continue; }
      v = Math.min(v, 0.92);
      const u = (x * ca + y * sa) / per, w = (-x * sa + y * ca) / per;
      const fu = u - Math.floor(u) - 0.5, fw = w - Math.floor(w) - 0.5; let a;
      if (v < 0.5) { const r = Math.sqrt(v / Math.PI); a = clamp((r - Math.hypot(fu, fw)) * per + 0.5); }
      else { const r = Math.sqrt((1 - v) / Math.PI); a = clamp((Math.hypot(Math.abs(fu) - 0.5, Math.abs(fw) - 0.5) - r) * per + 0.5); }
      if (a > 0) { const k = i * 4 + 3; out[k] = Math.max(out[k], Math.round(a * 255)); }
    }
  }
  // 砂目・紙の粒
  function sand(out, V0, A, n, gain) { for (let i = 0; i < n; i++) { if (A[i] < 128) continue; if (hash2(i, 71) < V0[i] * gain) out[i * 4 + 3] = 255; } }
  // ハッチング：濃さに応じて線の太さが変わる（銅版画のような階調）
  function hatch(ctx, sample, box, levels, sc = 1) {
    const x0 = box.x, y0 = box.y, x1 = box.x + box.w, y1 = box.y + box.h;
    for (const lv of levels) {
      const ang = lv.ang, d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]];
      const cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
      const pn = cs.map(c => c[0] * n[0] + c[1] * n[1]), pd = cs.map(c => c[0] * d[0] + c[1] * d[1]);
      const nmin = Math.min(...pn), nmax = Math.max(...pn), dmin = Math.min(...pd), dmax = Math.max(...pd);
      const sp = lv.sp, step = 0.7 * sc, wmax = lv.w ?? sp * 0.6, band = lv.band ?? 0.3, wa = (lv.wave ?? 0.3) * sc;
      for (let off = nmin + rand() * sp; off < nmax; off += sp * rr(0.88, 1.12)) {
        const thr = lv.thr + rg(0, 0.03), wav = rr(0, 99);
        let run = null;
        const flush = () => { if (run && run.length > 2) { const P = run.map(r => r[0]), Wd = run.map(r => r[1]); let k = 0; penPath(ctx, P, 1, { tin: 0.01, tout: 0.01, min: 0, wob: 0, jit: 0, taper: 1, wfK: 1, wf: () => Wd[k++] || 0, noCap: true }); } run = null; };
        for (let s = dmin; s < dmax; s += step) {
          const wv = Math.sin(s * 0.05 / sc + wav) * wa;
          const x = d[0] * s + n[0] * (off + wv), y = d[1] * s + n[1] * (off + wv);
          const t = sample(x, y);
          if (t > thr) { const w = wmax * Math.pow(clamp((t - thr) / band), 0.7) + 0.06 * sc; (run ||= []).push([[x, y], w]); } else flush();
        }
        flush();
      }
    }
  }
  // カケアミ：小さな格子ごとに向きを変えた短い線の重なり
  function kakeami(ctx, sample, box, sc = 1, dens = 1) {
    const cell = 7 * sc, { x, y, w, h } = box;
    for (let cy = y - cell; cy < y + h + cell; cy += cell * 0.8) for (let cx = x - cell; cx < x + w + cell; cx += cell * 0.8) {
      const v = sample(cx + cell / 2, cy + cell / 2) * dens; if (v < 0.08) continue;
      const layers = v > 0.62 ? 3 : v > 0.35 ? 2 : 1, base = ((Math.floor(cx / cell) + Math.floor(cy / cell)) & 1) ? 0.7 : -0.7;
      for (let L = 0; L < layers; L++) {
        const a = base + L * 1.15 + rr(-0.15, 0.15), d = [Math.cos(a), Math.sin(a)], nrm = [-d[1], d[0]];
        const k = 4; for (let j = 0; j < k; j++) {
          const o = (j - (k - 1) / 2) * cell * 0.22, c = [cx + cell / 2 + nrm[0] * o, cy + cell / 2 + nrm[1] * o];
          const len = cell * rr(0.7, 1.05), bend = rr(-0.2, 0.2) * len;
          const p0 = [c[0] - d[0] * len / 2, c[1] - d[1] * len / 2], p1 = [c[0] + d[0] * len / 2, c[1] + d[1] * len / 2];
          const mid = [c[0] + nrm[0] * bend * 0.3, c[1] + nrm[1] * bend * 0.3];
          penPath(ctx, catmull([p0, mid, p1], 4), (0.35 + v * 0.45) * sc, { tin: len * 0.3, tout: len * 0.3, jit: 0, taper: 1, wob: 0 });
        }
      }
    }
  }
  // 線のかすれ・紙の粒
  function erode(c, amount, seedv) {
    if (amount <= 0.02) return;
    const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), a = d.data, W = c.width;
    const th = amount * 0.55;
    for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const p = i >> 2, x = p % W, y = (p / W) | 0; const nz = vnoise(x * 0.35 + seedv, y * 0.35) * 0.6 + hash2(x + seedv, y) * 0.4; if (nz < th) a[i + 3] = Math.round(a[i + 3] * clamp((nz / th) * 1.4 - 0.4)); }
    g.putImageData(d, 0, 0);
  }

  // レイヤーを ctx へ合成。R = art から作った描き分け設定（art.js の derive）
  function compose(ctx, ly, R) {
    const mp = readMaps(ly), { M, Sh, A, w: W, h: H } = mp, n = W * H, S = ly.S, box = ly.box;
    const tmp = mkCanvas(W, H), c = tmp.getContext('2d');
    // 紙
    c.drawImage(ly.mc, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = R.paper || '#fff'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-atop';
    const img = new ImageData(W, H), out = img.data;
    // 何で表すか：固有色（M）＝トーン、影（Sh）＝ハッチ／トーン／ベタ
    const betaM = R.betaM, betaS = R.betaS, shK = R.shadeK;
    const TV = new Float32Array(n), HV = new Float32Array(n), BV = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      if (A[i] < 128) continue;
      const m = M[i], s = Sh[i] * shK;
      // ベタ：とても暗い固有色、または影ベタ（黒の多い絵柄）
      BV[i] = Math.max(sstep(betaM - 0.03, betaM + 0.03, m), R.shadeBeta ? sstep(betaS - 0.05, betaS + 0.05, s * (0.55 + 0.45 * m) + m * 0.25) : 0);
      // トーン：固有色の中間調＋（ハッチがなければ）影
      let tv = m > 0.06 ? m * R.toneMat : 0;
      tv += s * R.toneShade * (0.55 + 0.45 * m);
      TV[i] = clamp(tv);
      // ハッチ：影＋（トーンがなければ）固有色
      HV[i] = clamp(s * R.hatchShade + m * R.hatchMat);
    }
    if (R.toneKind === 'dot' || R.toneKind === 'gradient') { dots(out, TV, A, W, H, { per: R.dotPer * S, ang: Math.PI / 4, levels: R.toneKind === 'dot' ? R.levels : null }); }
    if (R.grainTone > 0) { const G = new Float32Array(n); for (let i = 0; i < n; i++) G[i] = TV[i] * 0.5; sand(out, G, A, n, R.grainTone); }
    const putImg = im => { const t2 = mkCanvas(W, H); t2.getContext('2d').putImageData(im, 0, 0); c.drawImage(t2, 0, 0); };
    putImg(img);
    const sample = arr => (x, y) => { const px = Math.round((x - box.x) * S), py = Math.round((y - box.y) * S); if (px < 0 || py < 0 || px >= W || py >= H) return 0; const i = py * W + px; return A[i] > 127 ? arr[i] : 0; };
    c.save(); c.setTransform(S, 0, 0, S, -box.x * S, -box.y * S); c.fillStyle = '#000';
    if (R.toneKind === 'kakeami') kakeami(c, sample(TV), box, R.sc, 1.0);
    if (R.hatch.length) hatch(c, sample(HV), box, R.hatch, R.sc);
    c.restore();
    // ベタ
    const bi = new ImageData(W, H), bo = bi.data; for (let i = 0; i < n; i++) if (BV[i] > 0) bo[i * 4 + 3] = Math.round(BV[i] * 255 * (A[i] / 255)); putImg(bi);
    // 艶（白）→ 線
    c.globalCompositeOperation = 'source-over';
    c.drawImage(ly.hc, 0, 0);
    erode(ly.lc, R.grain * 0.9 + R.rough * 0.25, box.x * 3 + box.y);
    c.drawImage(ly.lc, 0, 0);
    if (R.grain > 0.05) { // 紙の粒（鉛筆のざらつき）
      const gi = c.getImageData(0, 0, W, H), gd = gi.data;
      for (let i = 0; i < gd.length; i += 4) { if (!gd[i + 3]) continue; const p = i >> 2; const v = hash2(p, 13); if (gd[i] < 128 && v < R.grain * 0.22) { gd[i] = gd[i + 1] = gd[i + 2] = 255; } else if (gd[i] > 128 && v > 1 - R.grain * 0.035) { gd[i] = gd[i + 1] = gd[i + 2] = 60; } }
      c.putImageData(gi, 0, 0);
    }
    ctx.drawImage(tmp, box.x, box.y, box.w, box.h);
  }
  // ctx の今の拡大率（studio のページがどの倍率でも、細い線が潰れないように）
  function ctxScale(ctx) { try { const m = ctx.getTransform(); return clamp(Math.hypot(m.a, m.b), 0.5, 4); } catch (e) { return 2; } }

  Object.assign(K, { TAU, clamp, lerp, sstep, V, seed, rand, rr, rg, pick, hashStr, hash2, vnoise, catmull, ellipsePts, polyArea, sweep, bbox, convexHull, fillPoly, pathPoly, setLine, getLine, penPath, ink, contour, setLight, getLight, mkCanvas, Layer, compose, hatch, kakeami, dots, ctxScale });
})();

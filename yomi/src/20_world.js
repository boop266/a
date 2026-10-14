// 黄泉還：部屋を組み立てる（壁・床・扉・窓・灯り・カメラ・当たり）
const ROOMS = {};   // 部屋の定義（データは 3x_rooms_*.js）
const DOOR_H = { wood: 2.25, double: 2.6, glass: 2.5, iron: 2.2, lab: 2.4, cell: 2.3, elev: 2.4, arch: 2.6, gate: 2.6 };
// 矩形の和の外周を、壁の線分にする（内向きの法線つき）
function boundary(rects) {
  const segs = [], inside = (x, z) => rects.some(r => x > r[0] + 1e-4 && x < r[2] - 1e-4 && z > r[1] + 1e-4 && z < r[3] - 1e-4);
  const xs = [...new Set(rects.flatMap(r => [r[0], r[2]]))].sort((a, b) => a - b), zs = [...new Set(rects.flatMap(r => [r[1], r[3]]))].sort((a, b) => a - b);
  for (const r of rects) {
    const edges = [[r[0], r[1], r[2], r[1], 0, 1], [r[2], r[3], r[0], r[3], 0, -1], [r[0], r[3], r[0], r[1], 1, 0], [r[2], r[1], r[2], r[3], -1, 0]];
    for (const [ax, az, bx, bz, nx, nz] of edges) {
      const horiz = az === bz, lo = horiz ? Math.min(ax, bx) : Math.min(az, bz), hi = horiz ? Math.max(ax, bx) : Math.max(az, bz);
      const cuts = [lo, ...(horiz ? xs : zs).filter(v => v > lo && v < hi), hi];
      for (let i = 0; i < cuts.length - 1; i++) {
        const m = (cuts[i] + cuts[i + 1]) / 2, mx = horiz ? m : ax, mz = horiz ? az : m;
        if (inside(mx - nx * 0.02, mz - nz * 0.02)) continue; // 外側も部屋 → 内側の線なので壁ではない
        const s = horiz ? { a: [cuts[i], az], b: [cuts[i + 1], az] } : { a: [ax, cuts[i]], b: [ax, cuts[i + 1]] };
        s.n = [nx, nz]; segs.push(s);
      }
    }
  }
  // 同じ線上で続いているものはつなぐ
  segs.sort((p, q) => (p.n[0] - q.n[0]) || (p.n[1] - q.n[1]) || (p.n[0] ? p.a[0] - q.a[0] : p.a[1] - q.a[1]) || (p.n[0] ? p.a[1] - q.a[1] : p.a[0] - q.a[0]));
  const out = [];
  for (const s of segs) {
    const L = out[out.length - 1];
    if (L && L.n[0] === s.n[0] && L.n[1] === s.n[1]) {
      if (s.n[1] && L.a[1] === s.a[1] && abs(L.b[0] - s.a[0]) < 1e-6) { L.b = s.b; continue; }
      if (s.n[0] && L.a[0] === s.a[0] && abs(L.b[1] - s.a[1]) < 1e-6) { L.b = s.b; continue; }
    }
    out.push({ a: [...s.a], b: [...s.b], n: s.n });
  }
  return out;
}
// 壁の線分の上の位置（0..長さ）と、その線分
function onSeg(segs, x, z) {
  let best = null, bd = 0.3;
  for (const s of segs) { const horiz = s.a[1] === s.b[1]; const d = horiz ? abs(z - s.a[1]) : abs(x - s.a[0]); const lo = horiz ? Math.min(s.a[0], s.b[0]) : Math.min(s.a[1], s.b[1]), hi = horiz ? Math.max(s.a[0], s.b[0]) : Math.max(s.a[1], s.b[1]); const t = horiz ? x : z; if (t < lo - 0.01 || t > hi + 0.01) continue; if (d < bd) { bd = d; best = s; } }
  return best;
}
// ── 床の高さ・立てるか ──
function floorAt(R, x, z, yRef) {
  let best = null, bd = 0.62;
  for (const f of R.floors) {
    if (x < f.r[0] || x > f.r[2] || z < f.r[1] || z > f.r[3]) continue;
    const y = f.ax ? lerp(f.y, f.y2, f.ax === 'z' ? (z - f.r[1]) / (f.r[3] - f.r[1]) : (x - f.r[0]) / (f.r[2] - f.r[0])) : f.y;
    const d = abs(y - yRef); if (d < bd) { bd = d; best = y; }
  }
  return best;
}
const RING = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
function standAt(R, x, z, y, rad, who) {
  const yc = floorAt(R, x, z, y); if (yc == null) return null;
  for (const [ox, oz] of RING) if (floorAt(R, x + ox * rad, z + oz * rad, yc) == null) return null;
  for (const b of R.blocks) {
    if (b.off || abs(yc - b.y) > 0.45) continue; if (b.only && b.only !== who) continue;
    if (x > b.r[0] - rad && x < b.r[2] + rad && z > b.r[1] - rad && z < b.r[3] + rad) {
      // 角は丸く
      const cx = clamp(x, b.r[0], b.r[2]), cz = clamp(z, b.r[1], b.r[3]); if (hyp(x - cx, z - cz) < rad) return null;
    }
  }
  return yc;
}
function moveActor(R, a, dx, dz, who) {
  const tryP = (x, z) => { const y = standAt(R, x, z, a.y, a.rad, who); if (y != null) { a.x = x; a.z = z; a.y = y; return true; } return false; };
  if (!dx && !dz) return true;
  if (tryP(a.x + dx, a.z + dz)) return true;
  if (abs(dx) > 1e-5 && tryP(a.x + dx, a.z)) return 'slide';
  if (abs(dz) > 1e-5 && tryP(a.x, a.z + dz)) return 'slide';
  return false;
}
// 見通し（撃つ・気づく）：床のない所や高い障害物があれば遮る
function lineClear(R, x0, z0, x1, z1, y) {
  const n = Math.ceil(hyp(x1 - x0, z1 - z0) / 0.2);
  for (let i = 1; i < n; i++) {
    const t = i / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t);
    if (floorAt(R, x, z, y) == null) return false;
    for (const b of R.blocks) if (!b.off && b.tall && abs(y - b.y) < 0.45 && x > b.r[0] && x < b.r[2] && z > b.r[1] && z < b.r[3]) return false;
  }
  return true;
}
// ── 部屋を作る ──
function buildRoom(id) {
  const D = ROOMS[id]; if (!D) throw new Error('部屋がない: ' + id);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(D.bg || '#000000');
  const fogc = D.fog ? D.fog[0] : '#050403'; scene.fog = new THREE.FogExp2(fogc, D.fog ? D.fog[1] : 0.045);
  const R = { id, D, scene, floors: [], blocks: [], doors: [], looks: [], acts: [], lights: [], anims: [], wins: [], dyn: {}, pick: [], segs: [], t: 0 };
  const rects = D.rects || [[-D.w / 2, -D.d / 2, D.w / 2, D.d / 2]], H = D.h || 3.2;
  R.rects = rects; R.segs = boundary(rects);
  R.floors = (D.floors || rects.map(r => ({ r, y: 0 }))).map(f => Object.assign({}, f));
  const g = new GB(), root = new THREE.Group(); scene.add(root);
  const ctx = {
    g, R, root, H,
    block(r, y = 0, o = {}) { const b = Object.assign({ r: [Math.min(r[0], r[2]), Math.min(r[1], r[3]), Math.max(r[0], r[2]), Math.max(r[1], r[3])], y }, o); R.blocks.push(b); return b; },
    look(x, z, rad, t, o = {}) { R.looks.push(Object.assign({ p: [x, z], r: rad, t, y: o.y || 0 }, o)); },
    act(x, z, rad, id, o = {}) { R.acts.push(Object.assign({ p: [x, z], r: rad, id, y: 0 }, o)); },
    light(d) { return addLight(R, d); },
    add(o) { root.add(o); return o; },
    anim(f) { R.anims.push(f); },
  };
  // 床・天井・壁
  const fm = M(D.floor || 'parquet'), cm = D.ceil === false ? null : M(D.ceil || 'plaster'), wm = M(D.wall || 'paper_cream'), wnm = D.wain ? M(D.wain) : null, wainH = D.wainH || 1.1;
  for (const r of rects) {
    const m = fm.userData.m; g.quad(fm, [r[0], 0, r[3]], [r[2], 0, r[3]], [r[2], 0, r[1]], [r[0], 0, r[1]], [[r[0] / m, -r[3] / m], [r[2] / m, -r[3] / m], [r[2] / m, -r[1] / m], [r[0] / m, -r[1] / m]]);
    if (cm) { const cmm = cm.userData.m; g.quad(cm, [r[0], H, r[1]], [r[2], H, r[1]], [r[2], H, r[3]], [r[0], H, r[3]], [[r[0] / cmm, r[1] / cmm], [r[2] / cmm, r[1] / cmm], [r[2] / cmm, r[3] / cmm], [r[0] / cmm, r[3] / cmm]]); }
  }
  // 扉と窓を壁に割り当てる
  const openings = new Map();
  const doorsDef = D.doors || [];
  for (const d of doorsDef) {
    const s = onSeg(R.segs, d.p[0], d.p[1]); if (!s) { console.warn('扉が壁の上にない', id, d.id); continue; }
    const horiz = s.a[1] === s.b[1], w = d.w || (d.type === 'double' ? 1.7 : 1.1), y = d.y || 0, h = d.h || DOOR_H[d.type || 'wood'] || 2.3;
    const t = horiz ? d.p[0] : d.p[1];
    (openings.get(s) || openings.set(s, []).get(s)).push({ t0: t - w / 2, t1: t + w / 2, y0: y, y1: y + h, door: d });
    const n = s.n, ang = Math.atan2(n[0], n[1]);
    const dd = Object.assign({}, d, { pos: [horiz ? t : s.a[0], horiz ? s.a[1] : t], n, ang, w, h, y, horiz });
    dd.spawn = [dd.pos[0] + n[0] * 0.75, dd.pos[1] + n[1] * 0.75];
    R.doors.push(dd);
  }
  for (const wd of D.wins || []) {
    const s = onSeg(R.segs, wd.p[0], wd.p[1]); if (!s) { console.warn('窓が壁の上にない', id); continue; }
    const horiz = s.a[1] === s.b[1], t = horiz ? wd.p[0] : wd.p[1], w = wd.w || 1.2, y = wd.y != null ? wd.y : 1.0, h = wd.h || 1.8;
    (openings.get(s) || openings.set(s, []).get(s)).push({ t0: t - w / 2, t1: t + w / 2, y0: y, y1: y + h, win: wd });
  }
  const trimM = M(D.trim || 'wood_d'), baseH = 0.16;
  for (const s of (D.noWalls ? [] : R.segs)) {
    const horiz = s.a[1] === s.b[1], lo = horiz ? Math.min(s.a[0], s.b[0]) : Math.min(s.a[1], s.b[1]), hi = horiz ? Math.max(s.a[0], s.b[0]) : Math.max(s.a[1], s.b[1]);
    const ops = (openings.get(s) || []).sort((a, b) => a.t0 - b.t0);
    const P = (t, y) => horiz ? [t, y, s.a[1]] : [s.a[0], y, t];
    const ins = s.n; // 内向き
    // 壁の面：内側から見て反時計回りになるよう、向きで並びを変える
    const face = (t0, t1, y0, y1, mat) => {
      if (t1 - t0 < 1e-3 || y1 - y0 < 1e-3) return; const m = mat.userData.m;
      const flip = horiz ? ins[1] < 0 : ins[0] > 0; // 内向きが -z / +x のときは t の向きが逆
      const a = flip ? t1 : t0, b = flip ? t0 : t1;
      const ua = (horiz ? (ins[1] > 0 ? a : -a) : (ins[0] > 0 ? -a : a)) / m, ub = (horiz ? (ins[1] > 0 ? b : -b) : (ins[0] > 0 ? -b : b)) / m;
      const vMat = mat === wnm ? 1 / wainH : 1 / m;
      g.quad(mat, P(a, y0), P(b, y0), P(b, y1), P(a, y1), [[ua, y0 * vMat], [ub, y0 * vMat], [ub, y1 * vMat], [ua, y1 * vMat]]);
    };
    const column = (t0, t1, y0, y1) => { // 高さ方向に腰板と壁紙を分ける
      if (wnm && y0 < wainH) { face(t0, t1, y0, Math.min(y1, wainH), wnm); if (y1 > wainH) face(t0, t1, wainH, y1, wm); } else face(t0, t1, y0, y1, wm);
    };
    let cur = lo;
    const trims = []; // 幅木を張る区間
    for (const o of ops) {
      const a = clamp(o.t0, lo, hi), b = clamp(o.t1, lo, hi);
      if (a > cur) { column(cur, a, 0, H); trims.push([cur, a]); }
      column(a, b, 0, o.y0); column(a, b, o.y1, H); if (o.y0 > 0.01) trims.push([a, b]);
      // 開口部の奥行き（壁の厚み）と、扉の枠
      const dep = 0.16, nx = -ins[0], nz = -ins[1];
      const Q = (t, y, k) => { const p = P(t, y); return [p[0] + nx * dep * k, p[1], p[2] + nz * dep * k]; };
      const jm = o.win ? M(D.trim || 'wood_d') : trimM;
      const flip = horiz ? ins[1] < 0 : ins[0] > 0;
      const [ta, tb] = flip ? [b, a] : [a, b];
      g.quad(jm, Q(ta, o.y0, 0), Q(ta, o.y0, 1), Q(ta, o.y1, 1), Q(ta, o.y1, 0), [[0, 0], [1, 0], [1, 1], [0, 1]]);
      g.quad(jm, Q(tb, o.y1, 0), Q(tb, o.y1, 1), Q(tb, o.y0, 1), Q(tb, o.y0, 0), [[0, 0], [1, 0], [1, 1], [0, 1]]);
      g.quad(jm, Q(ta, o.y1, 0), Q(ta, o.y1, 1), Q(tb, o.y1, 1), Q(tb, o.y1, 0), [[0, 0], [1, 0], [1, 1], [0, 1]]);
      if (o.y0 > 0.01) g.quad(jm, Q(tb, o.y0, 0), Q(tb, o.y0, 1), Q(ta, o.y0, 1), Q(ta, o.y0, 0), [[0, 0], [1, 0], [1, 1], [0, 1]]);
      if (o.door) buildDoorLeaf(ctx, o.door, R.doors.find(d => d.id === o.door.id), dep);
      if (o.win) buildWindow(ctx, o.win, s, a, b, o.y0, o.y1, dep, P, ins);
      cur = b;
    }
    if (cur < hi) { column(cur, hi, 0, H); trims.push([cur, hi]); }
    // 幅木・腰板の縁・天井の回り縁
    const off = 0.025;
    for (const [a, b] of trims) {
      const c = (a + b) / 2, len = b - a, p = P(c, 0);
      if (D.base !== false) { if (horiz) g.box(trimM, p[0], baseH / 2, p[2] + ins[1] * off, len, baseH, 0.05, { no: '-y' }); else g.box(trimM, p[0] + ins[0] * off, baseH / 2, p[2], 0.05, baseH, len, { no: '-y' }); }
    }
    if (wnm && D.rail !== false) for (const [a, b] of splitBy(lo, hi, ops.filter(o => o.y0 < wainH + 0.05))) { const c = (a + b) / 2, len = b - a, p = P(c, wainH); if (horiz) g.box(trimM, p[0], wainH, p[2] + ins[1] * 0.03, len, 0.06, 0.06); else g.box(trimM, p[0] + ins[0] * 0.03, wainH, p[2], 0.06, 0.06, len); }
    if (D.crown !== false && cm) { const c = (lo + hi) / 2, len = hi - lo, p = P(c, H - 0.08); if (horiz) g.box(trimM, p[0], H - 0.08, p[2] + ins[1] * 0.06, len, 0.16, 0.12, { no: '+y' }); else g.box(trimM, p[0] + ins[0] * 0.06, H - 0.08, p[2], 0.12, 0.16, len, { no: '+y' }); }
  }
  // 部屋ごとの組み立て（家具・階段など）
  for (const p of D.props || []) { const f = PROPS[p.k]; if (!f) { console.warn('家具がない', p.k); continue; } f(ctx, p); }
  if (D.build) D.build(ctx);
  // 灯り
  const amb = new THREE.AmbientLight(D.amb ? D.amb[0] : '#4a4038', D.amb ? D.amb[1] : 0.6); scene.add(amb); R.ambient = amb;
  if (D.hemi) { const h = new THREE.HemisphereLight(D.hemi[0], D.hemi[1], D.hemi[2]); scene.add(h); R.hemi = h; }
  for (const l of D.lights || []) addLight(R, l);
  g.build(root);
  // 調べられる場所
  for (const l of D.looks || []) R.looks.push(Object.assign({ y: 0 }, l));
  for (const a of D.acts || []) R.acts.push(Object.assign({ y: 0 }, a));
  for (const b of D.blocks || []) ctx.block(b.r, b.y || 0, b);
  R.cams = (D.cams || []).map(c => { const cam = new THREE.PerspectiveCamera(c.fov || 55, 4 / 3, 0.05, 90); cam.position.set(...c.p); cam.lookAt(...c.t); cam.updateMatrixWorld(); return Object.assign({ cam }, c); });
  R.nav = buildNav(R);
  return R;
}
function splitBy(lo, hi, ops) { const out = []; let cur = lo; for (const o of ops.sort((a, b) => a.t0 - b.t0)) { const a = clamp(o.t0, lo, hi), b = clamp(o.t1, lo, hi); if (a > cur) out.push([cur, a]); cur = Math.max(cur, b); } if (cur < hi) out.push([cur, hi]); return out; }
function addLight(R, l) {
  let L;
  if (l.t === 'spot') { L = new THREE.SpotLight(l.c || '#ffffff', l.i || 10, l.d || 12, l.a || 0.6, l.pen || 0.5, l.dec != null ? l.dec : 1.6); L.target.position.set(...l.to); R.scene.add(L.target); }
  else if (l.t === 'dir') { L = new THREE.DirectionalLight(l.c || '#ffffff', l.i || 1); L.target.position.set(...(l.to || [0, 0, 0])); R.scene.add(L.target); }
  else L = new THREE.PointLight(l.c || '#ffd8a0', l.i != null ? l.i : 8, l.d || 9, l.dec != null ? l.dec : 1.6);
  L.position.set(...l.p); R.scene.add(L);
  const o = { L, base: L.intensity, fl: l.fl || 0, id: l.id, ph: Math.random() * 10 }; R.lights.push(o); return o;
}
// ── 扉の板（閉じた状態で壁に入っている） ──
function buildDoorLeaf(ctx, d, dd, dep) {
  if (!dd) return; const g = ctx.g, type = d.type || 'wood', w = dd.w, h = dd.h, y = dd.y;
  const [px, pz] = dd.pos, ang = dd.ang; // ang：部屋の内向き
  g.push(px - dd.n[0] * dep * 0.7, y, pz - dd.n[1] * dep * 0.7, ang);
  // ここでは +z が部屋の内側、x が扉の幅方向
  const wood = M(d.mat || 'wood_d'), brass = M('brass'), iron = M('iron'), metal = M('metal');
  if (type === 'wood' || type === 'double') {
    const leaves = type === 'double' ? 2 : 1, lw = w / leaves;
    for (let i = 0; i < leaves; i++) {
      const cx = -w / 2 + lw * (i + 0.5);
      g.box(wood, cx, h / 2, 0, lw - 0.02, h, 0.06);
      for (const [py, ph] of [[h * 0.27, h * 0.36], [h * 0.72, h * 0.4]]) { g.box(wood, cx, py, 0.035, lw * 0.62, ph, 0.025, { no: '-z' }); g.box(M('wood'), cx, py, 0.05, lw * 0.5, ph * 0.84, 0.01, { no: '-z' }); }
      const kx = leaves === 2 ? (i === 0 ? cx + lw * 0.36 : cx - lw * 0.36) : cx + lw * 0.38;
      g.box(brass, kx, 1.0, 0.07, 0.05, 0.16, 0.03); g.ball(brass, kx, 1.0, 0.1, 0.035, 0.035, 0.035, 3);
    }
    if (d.lock && d.lock.key && ['hawk', 'snake', 'wolf'].includes(d.lock.key)) g.plate(M('emb_' + d.lock.key, { e: '#000000' }), 0, h * 0.62, 0.09, 0.22, 0.22, '+z');
  } else if (type === 'glass') {
    for (let i = 0; i < 2; i++) { const cx = -w / 2 + w / 4 * (i * 2 + 1); g.box(M('wood_l'), cx, 0.25, 0, w / 2 - 0.03, 0.5, 0.06); g.box(M('wood_l'), cx, h - 0.06, 0, w / 2 - 0.03, 0.12, 0.06); g.box(M('wood_l'), cx - w / 4 + 0.05, h / 2, 0, 0.08, h, 0.06); g.box(M('wood_l'), cx + w / 4 - 0.05, h / 2, 0, 0.08, h, 0.06); g.box(M('wood_l'), cx, h * 0.55, 0, 0.04, h - 0.6, 0.05); for (let k = 1; k < 4; k++) g.box(M('wood_l'), cx, 0.5 + (h - 0.6) * k / 4, 0, w / 2 - 0.1, 0.04, 0.05); }
    g.plate(M('col', { c: '#3a5a50', t: 0.35, e: '#0a1a14' }), 0, h / 2 + 0.2, 0, w - 0.1, h - 0.7, '+z');
    if (d.lock && d.lock.key) g.plate(M('emb_' + d.lock.key, { e: '#000000' }), 0, 1.35, 0.05, 0.2, 0.2, '+z');
  } else if (type === 'iron') {
    g.box(metal, 0, h / 2, 0, w, h, 0.08); for (const yy of [0.3, h / 2, h - 0.3]) g.box(iron, 0, yy, 0.05, w, 0.08, 0.03);
    for (let k = 0; k < 6; k++) g.ball(iron, -w / 2 + 0.08, 0.3 + k * (h - 0.6) / 5, 0.06, 0.02, 0.02, 0.02, 2);
    g.box(iron, w * 0.35, 1.0, 0.07, 0.06, 0.2, 0.05);
  } else if (type === 'lab' || type === 'elev') {
    g.box(M('labwall'), 0, h / 2, -0.02, w + 0.3, h + 0.2, 0.06);
    g.box(metal, -w / 4, h / 2, 0.02, w / 2 - 0.01, h, 0.06); g.box(metal, w / 4, h / 2, 0.02, w / 2 - 0.01, h, 0.06);
    g.box(M('hazard'), 0, 0.12, 0.06, w, 0.18, 0.01, { no: '-z' });
    if (type === 'elev') { for (let k = -3; k <= 3; k++) g.box(iron, k * w / 7, h / 2, 0.07, 0.03, h, 0.02); }
    else { g.box(M('col', { c: '#202428' }), w / 2 + 0.25, 1.25, 0.06, 0.16, 0.24, 0.04); g.plate(M('col', { c: '#40ff70', e: '#20a040', basic: true }), w / 2 + 0.25, 1.32, 0.085, 0.06, 0.03, '+z'); }
  } else if (type === 'cell') {
    for (let k = 0; k < 8; k++) g.cyl(iron, -w / 2 + 0.07 + k * (w - 0.14) / 7, 0, 0, 0.022, h, 5);
    for (const yy of [0.15, 1.1, h - 0.1]) g.box(iron, 0, yy, 0, w, 0.05, 0.05);
  } else if (type === 'gate') {
    for (let k = 0; k < 10; k++) g.cyl(iron, -w / 2 + 0.05 + k * (w - 0.1) / 9, 0, 0, 0.025, h, 5);
    g.box(iron, 0, 0.2, 0, w, 0.06, 0.05); g.box(iron, 0, h - 0.4, 0, w, 0.06, 0.05);
  } else if (type === 'arch') { // 開いたままの通り口（奥は暗い）
    g.plate(M('col', { c: '#000000', basic: true }), 0, h / 2, -0.4, w, h, '+z');
  }
  g.pop();
}
// ── 窓（枠・ガラス・外の夜・流れる雨） ──
function buildWindow(ctx, wd, s, a, b, y0, y1, dep, P, ins) {
  const g = ctx.g, horiz = s.a[1] === s.b[1], c = (a + b) / 2, w = b - a, h = y1 - y0, p = P(c, (y0 + y1) / 2);
  const ang = Math.atan2(ins[0], ins[1]);
  g.push(p[0] - ins[0] * dep * 0.5, 0, p[2] - ins[1] * dep * 0.5, ang);
  const fr = M(wd.frame || 'wood_l'), yc = (y0 + y1) / 2;
  g.box(fr, 0, y0 + 0.04, 0, w, 0.08, dep + 0.06); g.box(fr, 0, y1 - 0.04, 0, w, 0.08, 0.1); g.box(fr, -w / 2 + 0.04, yc, 0, 0.08, h, 0.1); g.box(fr, w / 2 - 0.04, yc, 0, 0.08, h, 0.1);
  g.box(fr, 0, yc, 0, 0.05, h, 0.06); for (let k = 1; k < 3; k++) g.box(fr, 0, y0 + h * k / 3, 0, w, 0.04, 0.06);
  g.box(fr, 0, y0 - 0.05, dep * 0.6, w + 0.2, 0.06, 0.22);
  g.pop();
  // ガラス・外の景色・雨（動くので別に）
  const grp = new THREE.Group(); grp.position.set(p[0] - ins[0] * dep * 0.5, yc, p[2] - ins[1] * dep * 0.5); grp.rotation.y = ang;
  const outM = new THREE.MeshBasicMaterial({ map: T(wd.out || 'night'), fog: false, color: new THREE.Color(wd.outc || '#9aa6b8') });
  const out = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.6, h * 1.8), outM); out.position.set(0, 0, -1.2); grp.add(out);
  const glM = new THREE.MeshBasicMaterial({ color: '#8fa8c0', transparent: true, opacity: 0.12, depthWrite: false, fog: false });
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glM); grp.add(gl);
  let rainM = null;
  if (wd.rain !== false) { const rt = T('rain').clone(); rt.needsUpdate = true; rt.repeat.set(w * 1.2, h * 0.6); rainM = new THREE.MeshBasicMaterial({ map: rt, transparent: true, opacity: 0.55, depthWrite: false, fog: false }); const rm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), rainM); rm.position.z = 0.005; grp.add(rm); }
  ctx.add(grp);
  ctx.R.wins.push({ outM, glM, rainM, base: outM.color.clone() });
}
// ── 敵の道案内（格子の上でA*） ──
function buildNav(R) {
  const cs = 0.25, xs = R.rects.flatMap(r => [r[0], r[2]]), zs = R.rects.flatMap(r => [r[1], r[3]]);
  const x0 = Math.min(...xs), z0 = Math.min(...zs), nx = Math.ceil((Math.max(...xs) - x0) / cs), nz = Math.ceil((Math.max(...zs) - z0) / cs);
  return { cs, x0, z0, nx, nz, cache: new Map() };
}
function navCell(N, x, z) { return [clamp(Math.floor((x - N.x0) / N.cs), 0, N.nx - 1), clamp(Math.floor((z - N.z0) / N.cs), 0, N.nz - 1)]; }
function navOk(R, N, i, j, y, rad) { const k = (i + j * N.nx) * 8 + Math.round(y * 2 + 2); let v = N.cache.get(k); if (v === undefined) { const yy = standAt(R, N.x0 + (i + 0.5) * N.cs, N.z0 + (j + 0.5) * N.cs, y, rad, 'enemy'); v = yy == null ? null : yy; N.cache.set(k, v); } return v; }
function findPath(R, sx, sz, sy, tx, tz, rad = 0.3, maxN = 2500) {
  const N = R.nav, [si, sj] = navCell(N, sx, sz), [ti, tj] = navCell(N, tx, tz);
  const key = (i, j) => i + j * N.nx, open = [[0, si, sj, sy]], g = new Map([[key(si, sj), 0]]), from = new Map(); let n = 0;
  while (open.length && n++ < maxN) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k; const [, i, j, y] = open.splice(bi, 1)[0];
    if (abs(i - ti) <= 1 && abs(j - tj) <= 1) { const path = [[tx, tz]]; let k = key(i, j); while (from.has(k)) { const [pi, pj] = from.get(k); path.unshift([N.x0 + (k % N.nx + 0.5) * N.cs, N.z0 + (((k / N.nx) | 0) + 0.5) * N.cs]); k = key(pi, pj); } return path; }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N.nx || nj >= N.nz) continue;
      const ny = navOk(R, N, ni, nj, y, rad); if (ny == null) continue;
      if (di && dj && (navOk(R, N, i + di, j, y, rad) == null || navOk(R, N, i, j + dj, y, rad) == null)) continue;
      const nk = key(ni, nj), ng = g.get(key(i, j)) + (di && dj ? 1.414 : 1);
      if (!g.has(nk) || ng < g.get(nk)) { g.set(nk, ng); from.set(nk, [i, j]); open.push([ng + hyp(ni - ti, nj - tj), ni, nj, ny]); }
    }
  }
  return null;
}
// ── カメラの選び方：今のカメラの範囲にいれば続ける。出たら範囲に入っている最初のカメラへ ──
function camZoneHas(c, x, z, y) {
  const zs = c.zs || (c.z ? [c.z] : null); if (!zs) return true;
  if (c.lv && (y < c.lv[0] || y > c.lv[1])) return false;
  return zs.some(r => inR(r, x, z));
}
function pickCam(R, cur, x, z, y) {
  if (cur && camZoneHas(cur, x, z, y)) return cur;
  for (const c of R.cams) if (!c.event && camZoneHas(c, x, z, y)) return c;
  let best = R.cams.find(c => !c.event) || R.cams[0], bd = 1e9; for (const c of R.cams) { if (c.event) continue; const d = hyp(c.p[0] - x, c.p[2] - z); if (d < bd) { bd = d; best = c; } } return best;
}

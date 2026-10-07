/* =========================================================
   manga/styles/background.js — 背景（簡易3Dのパース＋自然物）
   ・街・室内は 3D の箱を投影して描く（1点・2点・3点透視、魚眼まで perspective で連続に変わる）
   ・自然・空は 2D（地平線を基準に）
   ========================================================= */
(() => {
  const K = window.MangaStylesKit;
  const { TAU, clamp, lerp, V, rand, rr, seed, hashStr, catmull, ellipsePts, fillPoly, pathPoly, ink, contour, penPath, Layer, compose, derive, setLine } = K;

  class Cam {
    constructor(o) { Object.assign(this, { pos: [0, 1.6, 0], yaw: 0, pitch: 0, roll: 0, f: 600, cx: 400, cy: 300, fish: 0 }, o); }
    view(p) {
      let x = p[0] - this.pos[0], y = p[1] - this.pos[1], z = p[2] - this.pos[2];
      const cy = Math.cos(-this.yaw), sy = Math.sin(-this.yaw); [x, z] = [x * cy + z * sy, -x * sy + z * cy];
      const cp = Math.cos(-this.pitch), sp = Math.sin(-this.pitch); [y, z] = [y * cp - z * sp, y * sp + z * cp];
      return [x, y, z];
    }
    proj(p) {
      const [x, y, z] = this.view(p); let sx, sy;
      if (this.fish > 0) { const r = Math.hypot(x, y), th = Math.atan2(r, z); if (th > 1.45) return null; const rp = this.f * lerp(Math.tan(Math.min(th, 1.3)), th * 1.15, this.fish); sx = r ? x / r * rp : 0; sy = r ? -y / r * rp : 0; }
      else { if (z < 0.08) return null; sx = this.f * x / z; sy = -this.f * y / z; }
      const cr = Math.cos(this.roll), sr = Math.sin(this.roll);
      return [this.cx + sx * cr - sy * sr, this.cy + sx * sr + sy * cr, z];
    }
    seg(a, b, n) { n = n ?? (this.fish ? 10 : 1); const o = []; for (let i = 0; i <= n; i++) { const q = this.proj([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n), lerp(a[2], b[2], i / n)]); if (q) o.push(q); } return o; }
    poly(P, n) { let o = []; for (let i = 0; i < P.length; i++) { const s = this.seg(P[i], P[(i + 1) % P.length], n); s.pop(); o = o.concat(s); } return o; }
    // 近い面を切る：z<0.1 の点を含む面は、点を手前へ寄せる
    clipPoly(P3) { const out = []; const near = 0.15; for (let i = 0; i < P3.length; i++) { const a = P3[i], b = P3[(i + 1) % P3.length]; const za = this.view(a)[2], zb = this.view(b)[2]; if (za >= near) out.push(a); if ((za >= near) !== (zb >= near)) { const t = (near - za) / (zb - za); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]); } } return out; }
  }

  // 3D の面を集めて、奥から描く
  class Scene {
    constructor(cam, ly, art) { this.cam = cam; this.ly = ly; this.art = art; this.faces = []; }
    face(P3, mat, shade, o = {}) { this.faces.push({ P3, mat, shade, o }); }
    box(x0, y0, z0, x1, y1, z1, mat, o = {}) {
      const L = o.light || [-0.5, 0.8, -0.3];
      const F = [
        [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1]], [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [0, 0, 1]],
        [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [-1, 0, 0]], [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0]],
        [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]], [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], [0, -1, 0]],
      ];
      for (const f of F) {
        const n = f[4], c = [(x0 + x1) / 2 + n[0] * (x1 - x0) / 2, (y0 + y1) / 2 + n[1] * (y1 - y0) / 2, (z0 + z1) / 2 + n[2] * (z1 - z0) / 2];
        const toCam = [this.cam.pos[0] - c[0], this.cam.pos[1] - c[1], this.cam.pos[2] - c[2]];
        if (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] <= 0) continue;
        const lit = clamp(-(n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) * 0.5 + 0.5);
        this.face(f.slice(0, 4), typeof mat === 'function' ? mat(n) : mat, (o.shade ?? 0.75) * (1 - lit), Object.assign({ n, extra: o.extra }, o));
      }
    }
    draw() {
      const cam = this.cam, ly = this.ly, l = ly.l;
      const dist = f => { let s = 0; for (const p of f.P3) { const v = cam.view(p); s += Math.hypot(v[0], v[1], v[2]); } return s / f.P3.length; };
      this.faces.forEach(f => f.d = dist(f)); this.faces.sort((a, b) => b.d - a.d);
      for (const f of this.faces) {
        const P3 = cam.clipPoly(f.P3); if (P3.length < 3) continue;
        const P = cam.poly(P3).map(p => [p[0], p[1]]); if (P.length < 3) continue;
        const fog = clamp(1 - f.d / (this.fogD || 140));
        const nn = f.o.n || [0, 1, 0]; const ha = nn[1] !== 0 ? 2 : (Math.abs(nn[2]) > 0.5 ? 3 : 1);
        ly.fill(P, f.mat * lerp(0.4, 1, fog), { shade: f.shade * lerp(0.35, 1, fog), off: 0, blur: 0, ha });
        const w = clamp(9 / Math.max(2, f.d), 0.25, 1.5) * (f.o.lw ?? 1);
        if (f.o.noEdge !== true) { l.fillStyle = '#000'; ink(l, P.concat([P[0]]), w, { dense: true, tin: 1, tout: 1, noRough: f.d > 40, jit: 0.6 }); }
        if (f.o.extra) f.o.extra(f, P3, w, fog);
      }
    }
  }

  const NAMES = {
    city: ['street', 'shopping', 'station', 'edo', 'rooftop', 'ruins'],
    interior: ['room', 'classroom', 'office', 'kitchen', 'cafe', 'washitsu', 'hospital', 'lab', 'library', 'gym', 'castle', 'throne', 'spaceship', 'stage'],
    nature: ['park', 'forest', 'beach', 'mountain', 'field', 'desert', 'cave', 'shrine', 'yard', 'rainbow'],
    void: ['sky', 'space', 'underwater', 'plain', 'tone', 'black', 'flowers', 'sparkle'],
  };
  const ALIAS = { garden: 'yard', backyard: 'yard', laundry: 'yard', 物干し: 'yard', niji: 'rainbow', 虹: 'rainbow', home: 'room', bedroom: 'room', school: 'classroom', city: 'street', town: 'street', road: 'street', arcade: 'shopping', market: 'shopping', ocean: 'beach', sea: 'beach', hill: 'field', meadow: 'field', temple: 'shrine', jungle: 'forest', woods: 'forest', palace: 'castle', ship: 'spaceship', universe: 'space', train: 'station', restaurant: 'cafe', dungeon: 'cave', roof: 'rooftop', ruin: 'ruins', white: 'plain', none: 'plain' };

  function drawBackground(ctx, bg, box, opts) {
    bg = bg || {}; box = box || { x: 0, y: 0, w: 800, h: 600 };
    let art = K.normalizeArt(opts && (opts.art || opts));
    if (art.rough) art = Object.assign({}, art, { detail: Math.min(art.detail, 0.2) });
    const name = ALIAS[bg.name] || bg.name || 'plain';
    seed(hashStr(name + (bg.time || '') + Math.round(box.x) + ',' + Math.round(box.y) + ',' + Math.round(box.w)));
    const sc = clamp(Math.sqrt(box.w / 500), 0.6, 1.5) * 0.8;
    const { line, R } = derive(art, sc);
    setLine(Object.assign({}, line, { w: line.w * 0.85 }));
    const S = K.ctxScale(ctx);
    const ly = new Layer(box, S);
    const night = bg.time === 'night', eve = bg.time === 'evening';
    const hz = box.y + box.h * clamp(bg.horizon ?? 0.6, 0.05, 0.95);
    const env = { ly, art, box, hz, night, eve, name, bg, R };
    const cat = Object.keys(NAMES).find(k => NAMES[k].includes(name)) || 'void';
    // 空
    if (cat !== 'interior' && !['cave', 'plain', 'tone', 'black', 'flowers', 'sparkle', 'underwater', 'space'].includes(name)) sky(env);
    if (cat === 'city') city(env);
    else if (cat === 'interior') interior(env);
    else if (cat === 'nature') nature(env);
    else voidBg(env);
    weather(env);
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
    compose(ctx, ly, R);
    if (env.post) env.post(ctx);
    ctx.restore();
    return true;
  }

  function sky(env) {
    const { ly, box, hz, night, eve, art } = env; const m = ly.m;
    const P = [[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, hz + 2], [box.x, hz + 2]];
    ly.fill(P, 0, { shade: 0, ha: 2 });
    if (night) { const g = m.createLinearGradient(0, box.y, 0, hz); g.addColorStop(0, ly.g(0.97)); g.addColorStop(1, ly.g(lerp(0.6, 0.9, art.black))); m.fillStyle = g; fillPoly(m, P); env.stars = true; }
    else if (eve) { const g = m.createLinearGradient(0, box.y, 0, hz); g.addColorStop(0, ly.g(0.55)); g.addColorStop(1, ly.g(0.08)); m.fillStyle = g; fillPoly(m, P); }
    else if (env.bg.weather === 'rain' || env.bg.weather === 'storm' || env.bg.weather === 'cloudy') { const g = m.createLinearGradient(0, box.y, 0, hz); g.addColorStop(0, ly.g(0.5)); g.addColorStop(1, ly.g(0.15)); m.fillStyle = g; fillPoly(m, P); }
    if (!night && !eve && art.hatching > 0.35 && art.black <= 0.7) { const g = m.createLinearGradient(0, box.y, 0, hz); g.addColorStop(0, ly.g(0.8 * art.hatching + 0.1)); g.addColorStop(0.7, ly.g(0.35 * art.hatching)); g.addColorStop(1, ly.g(0.08)); m.fillStyle = g; fillPoly(m, P); }
    // ベタの多い絵柄は、昼でも空を暗く重く
    if (!night && art.black > 0.7) { const k = (art.black - 0.7) / 0.3; const g = m.createLinearGradient(0, box.y, 0, hz); g.addColorStop(0, ly.g(lerp(0.3, 0.92, k))); g.addColorStop(1, ly.g(lerp(0.1, 0.45, k))); m.fillStyle = g; fillPoly(m, P); }
    // 雲
    if (!night && art.detail > 0.15) {
      const n = 1 + Math.round(art.detail * 3);
      for (let i = 0; i < n; i++) {
        const cx = box.x + rr(0.05, 0.95) * box.w, cy = box.y + rr(0.15, 0.55) * (hz - box.y), w = box.w * rr(0.12, 0.25) * (art.hatching > 0.35 ? 1.3 : 1), h = w * (art.hatching > 0.35 ? 0.55 : 0.35);
        const pts = []; const k = 9; for (let j = 0; j < k; j++) { const a = Math.PI + j / (k - 1) * Math.PI; const r = rr(0.75, 1.1); pts.push([cx + Math.cos(a) * w * r, cy + Math.sin(a) * h * r * (1 + 0.6 * Math.sin(j * 1.7) ** 2)]); }
        const P2 = catmull(pts, 4, true); ly.fill(P2, 0, { shade: art.hatching > 0.35 ? 0 : 0.4, off: h * 0.3 });
        if (art.hatching > 0.35) { // 白い積雲：輪郭を短い平行ハッチで縁取り、内側は白く残す（下側＝影側ほど長く密に）
          const n2 = P2.length; const hd = V.norm([0.5, 1]); const sc2 = Math.max(0.6, Math.sqrt(box.w / 600));
          for (let k = 0; k < n2; k++) { const p = P2[k], q2 = P2[(k + 1) % n2]; const out = V.norm(V.perp(V.sub(q2, p))); const lower = clamp(out[1] * 0.7 + 0.45); if (rand() > 0.35 + lower * 0.65) continue;
            const L = (2 + lower * 6) * sc2 * rr(0.7, 1.2); const dir = V.dot(hd, out) > 0 ? V.mul(hd, -1) : hd; const a0 = V.add(p, V.mul(out, 0.2)); ink(ly.l, [a0, V.add(a0, V.mul(dir, L))], 0.4, { tin: 0.3, tout: L * 0.6, noScratch: true }); }
          ink(ly.l, P2.filter(p => p[1] < cy), 0.35, { dense: true, tin: 6, tout: 6, noScratch: true });
        } else ink(ly.l, P2.slice(0, -4), 0.9, { dense: true });
      }
    }
  }
  function stars(env) { const { ly, box, hz, art } = env; const n = Math.round(box.w * (hz - box.y) / 1800 * (0.4 + art.sparkle)); for (let i = 0; i < n; i++) { const x = box.x + rand() * box.w, y = box.y + rand() * (hz - box.y) * 0.9; const r = rr(0.4, 1.4) * (rand() < 0.08 ? 2.5 : 1); if (r > 2) K.drawStarShape(ly.hi, x, y, r * 1.6, '#fff'); else { ly.hi.beginPath(); ly.hi.arc(x, y, r * 0.6, 0, TAU); ly.hi.fill(); } } }

  // ---------- 街（通りを奥へ） ----------
  function city(env) {
    const { ly, box, hz, art, name, night } = env;
    const p = art.perspective, det = art.detail;
    const ruins = name === 'ruins', edo = name === 'edo', roof = name === 'rooftop';
    // カメラ：パースが強いほど広角・あおり、ひねり（2点透視）、魚眼
    const f = box.w * lerp(1.25, 0.42, p);
    const pitch = lerp(0, 0.55, Math.max(0, p - 0.45) / 0.55) * (env.bg.shot === 'long' ? 0.6 : 1);
    const cam = new Cam({ pos: [lerp(0, -1.5, p), roof ? 22 : lerp(1.6, 1.1, p), 0], yaw: lerp(0, 0.38, p) * (rand() < 0.5 ? 1 : -1), pitch, roll: lerp(0, 0.06, p) * (p > 0.6 ? 1 : 0), f, cx: box.x + box.w / 2, cy: hz + Math.tan(pitch) * f, fish: p > 0.82 ? (p - 0.82) / 0.18 * 0.7 : 0 });
    env.cam = cam;
    const sc = new Scene(cam, ly, art); sc.fogD = 160;
    const Wst = edo ? 5 : 7;
    // 地面
    const gmat = night ? 0.4 : 0.03;
    sc.face([[-200, 0, 0.5], [200, 0, 0.5], [200, 0, 300], [-200, 0, 300]], gmat, 0, { noEdge: true });
    // 歩道・車線
    const ll = (a, b, w = 0.8) => { const P = cam.seg(a, b, 12).map(q => [q[0], q[1]]); if (P.length > 1) ink(ly.l, P, w, { dense: true, tin: 1, tout: 30 }); };
    // 建物
    const blocks = [];
    for (const sd of [-1, 1]) {
      let z = rr(2, 6);
      while (z < 160) {
        const len = edo ? rr(5, 8) : rr(6, 14), hgt = edo ? rr(3.5, 5.5) : rr(8, 30) * (ruins ? rr(0.5, 1) : 1), dep = rr(8, 14);
        const x0 = sd < 0 ? -Wst - dep : Wst, x1 = sd < 0 ? -Wst : Wst + dep;
        blocks.push({ x0, x1, z0: z, z1: z + len, h: hgt, sd });
        z += len + (rand() < 0.3 ? rr(1.5, 4) : 0.3);
      }
    }
    for (const b of blocks) {
      const mat = edo ? 0.1 : night ? 0.75 : pick3(0.05, 0.25, 0.45);
      const winMat = night ? 0.1 : 0.9;
      sc.box(b.x0, 0, b.z0, b.x1, b.h, b.z1, mat, { shade: 0.8, extra: (fc, P3, w, fog) => {
        // 窓・階の線（facade と正面）
        if (det < 0.15 || fog < 0.15) return;
        const n = fc.o.n; if (n[1] !== 0) return;
        const [a, b2, c, d] = fc.P3; // a,b 下, c,d 上
        const across = V3.sub(b2, a), up = V3.sub(d, a);
        const W = V3.len(across), Hh = V3.len(up);
        const floors = Math.max(1, Math.round(Hh / (edo ? 4 : 3.2))), cols = Math.max(1, Math.round(W / (edo ? 2.5 : 2.4)));
        const df = fog * det;
        if (edo) { // 格子と屋根の線
          for (let i = 1; i < cols; i++) { const s = i / cols; const p0 = V3.add(a, V3.mul(across, s)), p1 = V3.add(p0, V3.mul(up, 0.7)); ll(p0, p1, w * 0.6); }
          ll(V3.add(a, V3.mul(up, 0.72)), V3.add(b2, V3.mul(up, 0.72)), w);
          return;
        }
        for (let fl = 0; fl < floors; fl++) {
          const y0 = (fl + 0.3) / floors, y1 = (fl + 0.75) / floors;
          if (ruins && rand() < 0.15) continue;
          for (let i = 0; i < cols; i++) {
            if (rand() > 0.35 + df) continue;
            const s0 = (i + 0.22) / cols, s1 = (i + 0.78) / cols;
            const q = [V3.add(V3.add(a, V3.mul(across, s0)), V3.mul(up, y0)), V3.add(V3.add(a, V3.mul(across, s1)), V3.mul(up, y0)), V3.add(V3.add(a, V3.mul(across, s1)), V3.mul(up, y1)), V3.add(V3.add(a, V3.mul(across, s0)), V3.mul(up, y1))];
            const P = cam.poly(q).map(t => [t[0], t[1]]); if (P.length < 3) continue;
            ly.fill(P, night ? (rand() < 0.4 ? 0.0 : 0.95) : winMat * lerp(0.5, 1, fog), { shade: 0, knock: false });
            if (w > 0.4 && det > 0.5) ink(ly.l, P.concat([P[0]]), w * 0.5, { dense: true, tin: 0.5, tout: 0.5, noRough: true, jit: 0 });
          }
          if (det > 0.6 && fog > 0.4) ll(V3.add(a, V3.mul(up, (fl + 0.95) / floors)), V3.add(b2, V3.mul(up, (fl + 0.95) / floors)), w * 0.5);
        }
      } });
      if (edo) { // 瓦屋根（張り出し）
        const y = b.h, o = 1.2; const xo = b.sd < 0 ? b.x1 + o : b.x0 - o; const xi = b.sd < 0 ? b.x1 - 3 : b.x0 + 3;
        sc.face([[xo, y - 0.6, b.z0 - 0.3], [xo, y - 0.6, b.z1 + 0.3], [xi, y + 1.8, b.z1 + 0.3], [xi, y + 1.8, b.z0 - 0.3]], 0.85, 0.3, { extra: (fc, P3, w) => { for (let i = 1; i < 8; i++) { const t = i / 8; ll([xo, y - 0.6, lerp(b.z0, b.z1, t)], [xi, y + 1.8, lerp(b.z0, b.z1, t)], w * 0.5); } } });
      }
      if (ruins) { // 崩れた上端：瓦礫と鉄筋
        const xe = b.sd < 0 ? b.x1 : b.x0;
        for (let i = 0; i < 3; i++) { const z = rr(b.z0, b.z1); ll([xe, b.h, z], [xe + rr(-1, 1), b.h + rr(0.5, 2.5), z + rr(-0.5, 0.5)], 0.6); }
      }
    }
    // 瓦礫・電柱など
    if (!edo && !roof) for (let i = 0; i < Math.round(det * 6); i++) { const z = rr(8, 80), sd = rand() < 0.5 ? -1 : 1; ll([sd * (Wst - 0.5), 0, z], [sd * (Wst - 0.5), rr(7, 9), z], 1.0); }
    if (ruins) for (let i = 0; i < Math.round(6 + det * 18); i++) { const z = rr(3, 40), x = rr(-Wst + 0.5, Wst - 0.5), s = rr(0.2, 0.9) * (z < 10 ? 1.3 : 1); sc.box(x - s, 0, z - s * 0.6, x + s, s * rr(0.4, 1.2), z + s * 0.6, rr(0.1, 0.6), { shade: 0.9 }); }
    sc.draw();
    // 街の小物：街灯、看板、横断歩道
    if (!edo && !roof && det > 0.15) {
      const lampAt = (sd, z) => { const x = sd * (Wst - 0.6); ll([x, 0, z], [x, 4.6, z], 1.4); ll([x, 4.6, z], [x - sd * 0.9, 4.9, z], 1.1); const p0 = cam.proj([x - sd * 1.0, 4.85, z]); if (p0) { const r = cam.f * 0.22 / Math.max(1, cam.view([x, 0, z])[2]); const E = ellipsePts(p0[0], p0[1] + r * 0.3, r * 1.2, r * 0.5, 0, 14); ly.fill(E, 0.2, { shade: 0 }); ink(ly.l, E.concat([E[0]]), 0.6, { dense: true }); } };
      for (let z = 6; z < 70; z += 14) { lampAt(-1, z); lampAt(1, z + 7); }
      for (let i = 0; i < Math.round(det * 6); i++) { const b = pick3(...blocks.filter(b2 => b2.z0 < 50)); if (!b) continue; const xe = b.sd < 0 ? b.x1 + 0.02 : b.x0 - 0.02, z = lerp(b.z0, b.z1, rr(0.2, 0.8)), y0 = rr(2.6, 5); const P3 = [[xe, y0, z], [xe - b.sd * 0.9, y0, z], [xe - b.sd * 0.9, y0 + 2.2, z], [xe, y0 + 2.2, z]]; const P = cam.poly(P3).map(q => [q[0], q[1]]); if (P.length > 2) { ly.fill(P, pick3(0.0, 0.85, 0.3), { shade: 0.2 }); ink(ly.l, P.concat([P[0]]), 0.7, { dense: true }); for (let k = 0; k < 3; k++) ll([xe - b.sd * 0.45, y0 + 1.9 - k * 0.6, z - 0.01], [xe - b.sd * 0.45, y0 + 1.5 - k * 0.6, z - 0.01], 0.9); } }
      for (let k = -3; k <= 3; k++) { const P = cam.poly([[k * 1.6 - 0.4, 0.01, 10], [k * 1.6 + 0.4, 0.01, 10], [k * 1.6 + 0.4, 0.01, 13], [k * 1.6 - 0.4, 0.01, 13]]).map(q => [q[0], q[1]]); if (P.length > 2) { ly.fill(P, 0.0, { shade: 0, knock: false }); ink(ly.l, P.concat([P[0]]), 0.5, { dense: true }); } }
    }
    // 地面の線（描いたあと）
    if (!roof) { ll([-Wst, 0, 1], [-Wst, 0, 200], 1.0); ll([Wst, 0, 1], [Wst, 0, 200], 1.0); ll([-Wst + 2, 0, 1], [-Wst + 2, 0, 200], 0.6); ll([Wst - 2, 0, 1], [Wst - 2, 0, 200], 0.6); for (let z = 3; z < 120; z += 6) ll([0, 0, z], [0, 0, z + 2.5], 0.9); }
    if (det > 0.5) for (let i = 0; i < det * 30; i++) { const z = rr(1.5, 40), x = rr(-Wst, Wst); ll([x, 0, z], [x + rr(-0.6, 0.6), 0, z + rr(0.2, 1)], 0.4); }
    if (night) env.stars = true;
    if (name === 'shopping' && det > 0.2) { // 頭上の旗・提灯
      for (let z = 6; z < 60; z += 7) { ll([-Wst, 5, z], [Wst, 4.6, z + 1], 0.5); for (let k = -2; k <= 2; k++) { const p0 = cam.proj([k * Wst / 3, 4.6, z + 0.5]); if (!p0) continue; const r = cam.f * 0.25 / Math.max(1, cam.view([0, 0, z])[2]); const P = ellipsePts(p0[0], p0[1] + r, r * 0.6, r, 0, 12); ly.fill(P, 0.0, { shade: 0.3 }); ink(ly.l, P.concat([P[0]]), 0.6, { dense: true }); } }
    }
  }
  const V3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s], len: a => Math.hypot(a[0], a[1], a[2]) };
  const pick3 = (...a) => a[Math.floor(rand() * a.length)];

  // ---------- 室内（箱の中） ----------
  function interior(env) {
    const { ly, box, hz, art, name, night } = env;
    const p = art.perspective, det = art.detail;
    const big = name === 'gym' || name === 'castle' || name === 'throne' || name === 'library' || name === 'classroom', Wd = big ? (name === 'library' || name === 'classroom' ? 8 : 14) : name === 'washitsu' ? 6 : 6.5, Dp = big ? (name === 'library' || name === 'classroom' ? 11 : 30) : 7.5, Hh = name === 'castle' || name === 'throne' || name === 'gym' ? 9 : 3;
    const f = box.w * lerp(1.0, 0.45, p);
    const pitch = lerp(0, 0.35, Math.max(0, p - 0.5) / 0.5);
    const cam = new Cam({ pos: [lerp(0, Wd * 0.15, p) * (rand() < 0.5 ? 1 : -1), 1.5, -Dp * 0.25], yaw: lerp(0, 0.2, p) * (rand() < 0.5 ? 1 : -1), pitch, f, cx: box.x + box.w / 2, cy: hz + Math.tan(pitch) * f, fish: p > 0.85 ? (p - 0.85) / 0.15 * 0.6 : 0 });
    env.cam = cam;
    const sc = new Scene(cam, ly, art); sc.fogD = 400;
    const ll = (a, b, w = 0.7) => { const P = cam.seg(a, b, 10).map(q => [q[0], q[1]]); if (P.length > 1) ink(ly.l, P, w, { dense: true, tin: 1, tout: 2 }); };
    const wallMat = { castle: 0.35, throne: 0.35, spaceship: 0.2, stage: 0.85, cafe: 0.25, library: 0.3, lab: 0.05, hospital: 0.0, washitsu: 0.05, classroom: 0.05, office: 0.08, gym: 0.15 }[name] ?? 0.12;
    const floorMat = { washitsu: 0.15, gym: 0.25, stage: 0.4, castle: 0.3, throne: 0.3, cafe: 0.4, library: 0.45 }[name] ?? 0.3;
    const W2 = Wd / 2;
    const zFar = Dp;
    // 床・壁・天井（内側を向く面）
    sc.face([[-W2, 0, -Dp], [W2, 0, -Dp], [W2, 0, zFar], [-W2, 0, zFar]], floorMat * (night ? 1.4 : 1), 0, { noEdge: true });
    sc.face([[-W2, 0, zFar], [W2, 0, zFar], [W2, Hh, zFar], [-W2, Hh, zFar]], wallMat, night ? 0.5 : 0.05, { extra: (fc, P3, w) => backWall(env, cam, ll, W2, Hh, zFar, w) });
    sc.face([[-W2, 0, -Dp], [-W2, 0, zFar], [-W2, Hh, zFar], [-W2, Hh, -Dp]], wallMat, night ? 0.6 : 0.2);
    sc.face([[W2, 0, zFar], [W2, 0, -Dp], [W2, Hh, -Dp], [W2, Hh, zFar]], wallMat, night ? 0.75 : 0.45, { extra: (fc, P3, w) => sideWall(env, cam, ll, W2, Hh, zFar, w) });
    sc.face([[-W2, Hh, zFar], [W2, Hh, zFar], [W2, Hh, -Dp], [-W2, Hh, -Dp]], 0.05, 0.3);
    // 家具：板と脚、引き出し、本…と、部品を組み立てて「それと分かる」形に
    const furn = (x, z, w, d, h, mat = 0.3) => sc.box(x - w / 2, 0, z - d / 2, x + w / 2, h, z + d / 2, mat, { shade: 0.7 });
    const slab = (x0, y0, z0, x1, y1, z1, mat, o) => sc.box(x0, y0, z0, x1, y1, z1, mat, Object.assign({ shade: 0.7 }, o || {}));
    // 面の上の点（u: 横 0..1, v: 縦 0..1）
    const onFace = (P3, u, v) => { const [a, b, c2, d] = P3; const top = [lerp(d[0], c2[0], u), lerp(d[1], c2[1], u), lerp(d[2], c2[2], u)], bot = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; return [lerp(bot[0], top[0], v), lerp(bot[1], top[1], v), lerp(bot[2], top[2], v)]; };
    const legs = (x, z, w, d, h, t, mat) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) slab(x + sx * (w / 2 - t) - t / 2, 0, z + sz * (d / 2 - t) - t / 2, x + sx * (w / 2 - t) + t / 2, h, z + sz * (d / 2 - t) + t / 2, mat, { shade: 0.5, lw: 0.7 }); };
    const desk = (x, z, w, d, h, mat = 0.25, drawer = false) => { slab(x - w / 2, h - 0.04, z - d / 2, x + w / 2, h, z + d / 2, mat); legs(x, z, w, d, h - 0.04, 0.05, 0.6); if (drawer) slab(x - w / 2 + 0.05, h - 0.2, z - d / 2 + 0.02, x - w / 2 + 0.5, h - 0.04, z + d / 2 - 0.02, mat + 0.1, { extra: (fc, P3, w2) => { if (fc.o.n[2] !== -1) return; ll(onFace(P3, 0.3, 0.5), onFace(P3, 0.7, 0.5), w2); } }); };
    const chair = (x, z, s = 0.45, back = 1, mat = 0.4) => { slab(x - s / 2, 0.42, z - s / 2, x + s / 2, 0.46, z + s / 2, mat); legs(x, z, s, s, 0.42, 0.035, 0.7); slab(x - s / 2, 0.46, z + back * s / 2 - 0.035, x + s / 2, 0.95, z + back * s / 2, mat, { extra: (fc, P3, w2) => { if (Math.abs(fc.o.n[2]) !== 1) return; ll(onFace(P3, 0.1, 0.6), onFace(P3, 0.9, 0.6), w2 * 0.6); } }); };
    const books = (x0, x1, y0, y1, z, face) => { let x = x0; while (x < x1 - 0.04) { const bw = rr(0.035, 0.09), bh = (y1 - y0) * rr(0.65, 0.95); const lean = rand() < 0.08; const P = [[x, y0, z], [x + bw, y0, z], [x + bw + (lean ? 0.05 : 0), y0 + bh, z], [x + (lean ? 0.05 : 0), y0 + bh, z]]; sc.face(P, pick3(0.1, 0.35, 0.6, 0.85, 0.05), 0.2, { lw: 0.5, extra: (fc, P3, w2) => { if (rand() < 0.4 && bh > 0.2) ll(onFace(P3, 0.1, 0.8), onFace(P3, 0.9, 0.8), w2 * 0.5); } }); x += bw + (rand() < 0.1 ? rr(0.05, 0.12) : 0.003); } };
    const shelf = (x0, x1, z, h, dep, n, mat = 0.5) => { slab(x0, 0, z, x1, h, z + dep, mat); const rows = n; for (let r = 0; r < rows; r++) { const y0 = 0.08 + r * (h - 0.1) / rows, y1 = y0 + (h - 0.1) / rows - 0.04; sc.face([[x0 + 0.04, y0, z - 0.005], [x1 - 0.04, y0, z - 0.005], [x1 - 0.04, y1, z - 0.005], [x0 + 0.04, y1, z - 0.005]], 0.85, 0.2, { lw: 0.6 }); if (det > 0.2) books(x0 + 0.06, x1 - 0.06, y0, y1, z - 0.01); } };
    const cabinet = (x0, x1, z0, z1, h, mat = 0.12, top = 0.6, faceN = -1) => { slab(x0, 0, z0, x1, h - 0.04, z1, mat, { extra: (fc, P3, w2) => { const n = fc.o.n; if (n[1] !== 0) return; const W = Math.hypot(P3[1][0] - P3[0][0], P3[1][2] - P3[0][2]); const k = Math.max(1, Math.round(W / 0.6)); for (let i = 1; i < k; i++) ll(onFace(P3, i / k, 0.04), onFace(P3, i / k, 0.96), w2 * 0.8); ll(onFace(P3, 0, 0.78), onFace(P3, 1, 0.78), w2 * 0.6); for (let i = 0; i < k; i++) { const u = (i + 0.5) / k; ll(onFace(P3, u - 0.08, 0.86), onFace(P3, u + 0.08, 0.86), w2 * 1.4); ll(onFace(P3, u + (i % 2 ? -0.35 : 0.35) / k, 0.45), onFace(P3, u + (i % 2 ? -0.35 : 0.35) / k, 0.62), w2 * 1.4); } } }); slab(x0 - 0.03, h - 0.04, z0 - 0.03, x1 + 0.03, h, z1 + 0.03, top, { shade: 0.3 }); };
    const ellipseFlat = (cx, y, cz, rx, rz, mat) => { const P = []; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; P.push([cx + Math.cos(a) * rx, y, cz + Math.sin(a) * rz]); } sc.face(P, mat, 0, { lw: 0.6 }); };
    const monitor = (x, z, y) => { slab(x - 0.28, y + 0.12, z, x + 0.28, y + 0.47, z + 0.04, 0.85, { extra: (fc, P3, w2) => { if (fc.o.n[2] !== -1) return; const P = [onFace(P3, 0.06, 0.08), onFace(P3, 0.94, 0.08), onFace(P3, 0.94, 0.92), onFace(P3, 0.06, 0.92)]; sc.ly.fill(cam.poly(P).map(q => [q[0], q[1]]), 0.5, { shade: 0, knock: false }); } }); slab(x - 0.03, y, z + 0.01, x + 0.03, y + 0.13, z + 0.04, 0.7); slab(x - 0.12, y, z - 0.04, x + 0.12, y + 0.015, z + 0.08, 0.7); };
    const bed = (x, z, w, len) => { slab(x - w / 2, 0, z - len / 2, x + w / 2, 0.3, z + len / 2, 0.45); slab(x - w / 2 + 0.03, 0.3, z - len / 2 + 0.03, x + w / 2 - 0.03, 0.48, z + len / 2 - 0.03, 0.02); slab(x - w / 2, 0, z + len / 2 - 0.06, x + w / 2, 0.9, z + len / 2, 0.45); slab(x - w * 0.35, 0.48, z + len / 2 - 0.5, x + w * 0.35, 0.6, z + len / 2 - 0.1, 0.0, { shade: 0.3 }); slab(x - w / 2 - 0.02, 0.32, z - len / 2 - 0.02, x + w / 2 + 0.02, 0.52, z + len * 0.15, 0.3, { shade: 0.5, extra: (fc, P3, w2) => { if (fc.o.n[1] !== 1) return; for (const u of [0.3, 0.55, 0.8]) ll(onFace(P3, u, 0.1), onFace(P3, u + 0.05, 0.9), w2 * 0.6); } }); };
    const stool = (x, z, h = 0.75) => { slab(x - 0.18, h - 0.05, z - 0.18, x + 0.18, h, z + 0.18, 0.6); legs(x, z, 0.32, 0.32, h - 0.05, 0.03, 0.7); slab(x - 0.14, 0.3, z - 0.14, x + 0.14, 0.33, z + 0.14, 0.7, { lw: 0.5 }); };
    if (name === 'classroom') { for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) { const x = c * 2.0, z = 2.6 + r * 2.2; desk(x, z, 0.75, 0.5, 0.72, 0.15); chair(x, z + 0.55, 0.42, 1, 0.45); } slab(-1.3, 0, zFar - 1.6, 1.3, 0.95, zFar - 1.0, 0.3); }
    if (name === 'office' || name === 'lab') for (let c = -1; c <= 1; c += 2) for (let r = 0; r < 2; r++) { const x = c * 2.0, z = 3.5 + r * 3; desk(x, z, 1.5, 0.75, 0.74, name === 'lab' ? 0.03 : 0.3, true); if (name === 'office') monitor(x + 0.2, z + 0.15, 0.74); else { slab(x - 0.5, 0.74, z - 0.1, x - 0.35, 0.95, z + 0.05, 0.05); ellipseFlat(x + 0.3, 0.745, z, 0.12, 0.08, 0.0); } chair(x, z - 0.65, 0.45, -1, 0.75); }
    if (name === 'cafe') { cabinet(-W2 + 0.4, -W2 + 1.2, 2, zFar - 1.5, 1.05, 0.5, 0.75); for (let i = 0; i < 4; i++) stool(-W2 + 1.6, 3 + i * 1.6); for (let i = 0; i < 2; i++) { const x = 1.2 + i * 1.8, z = 3 + i * 3; slab(x - 0.4, 0.72, z - 0.4, x + 0.4, 0.76, z + 0.4, 0.3); slab(x - 0.04, 0, z - 0.04, x + 0.04, 0.72, z + 0.04, 0.7); slab(x - 0.25, 0, z - 0.25, x + 0.25, 0.03, z + 0.25, 0.7); chair(x + 0.75, z, 0.42, 1, 0.5); chair(x - 0.75, z, 0.42, -1, 0.5); ellipseFlat(x, 0.765, z, 0.1, 0.07, 0.0); } shelf(-W2 + 0.3, -W2 + 2.6, zFar - 0.35, 2.2, 0.3, 3, 0.55); }
    if (name === 'kitchen') { cabinet(-W2 + 0.05, -W2 + 0.65, 1.5, zFar - 0.05, 0.92); cabinet(-W2 + 0.65, W2 - 1.0, zFar - 0.65, zFar - 0.05, 0.92); ellipseFlat(0.2, 0.925, zFar - 0.35, 0.35, 0.18, 0.75); for (const dx of [-1.6, -1.1]) ellipseFlat(dx, 0.925, zFar - 0.35, 0.16, 0.1, 0.9); slab(-W2 + 0.65, 1.5, zFar - 0.35, W2 - 1.0, 2.2, zFar - 0.05, 0.12, { extra: (fc, P3, w2) => { if (fc.o.n[2] !== -1) return; for (const u of [0.25, 0.5, 0.75]) ll(onFace(P3, u, 0.05), onFace(P3, u, 0.95), w2 * 0.8); } }); slab(W2 - 0.95, 0, zFar - 0.8, W2 - 0.1, 1.9, zFar - 0.1, 0.05, { extra: (fc, P3, w2) => { if (fc.o.n[2] !== -1) return; ll(onFace(P3, 0, 0.62), onFace(P3, 1, 0.62), w2); ll(onFace(P3, 0.85, 0.66), onFace(P3, 0.85, 0.8), w2 * 1.5); ll(onFace(P3, 0.85, 0.3), onFace(P3, 0.85, 0.5), w2 * 1.5); } }); slab(1.2, 0.72, 3.5, 2.2, 0.76, 4.3, 0.3); legs(1.7, 3.9, 1.0, 0.8, 0.72, 0.05, 0.6); }
    if (name === 'room') { bed(W2 - 1.0, zFar - 1.3, 1.1, 2.0); desk(-W2 + 0.9, zFar - 0.5, 1.2, 0.6, 0.72, 0.3, true); chair(-W2 + 0.9, zFar - 1.1, 0.42, -1, 0.5); shelf(-W2 + 0.05, -W2 + 0.4, 3, 1.6, 0.3, 4, 0.5); slab(-0.6, 0, 3.6, 0.6, 0.38, 4.3, 0.35); legs(0, 3.95, 1.2, 0.7, 0.34, 0.04, 0.6); }
    if (name === 'library') { for (let i = -2; i <= 2; i++) { if (!i) continue; const x0 = i * 1.6 - 0.25, x1 = i * 1.6 + 0.25; slab(x0, 0, 4, x1, 2.4, zFar - 2, 0.45, { extra: (fc, P3, w2) => { if (fc.o.n[0] === 0) return; for (let r = 0; r < 5; r++) { const y0 = 0.1 + r * 0.46; ll(onFace(P3, 0, y0 / 2.4), onFace(P3, 1, y0 / 2.4), w2 * 0.8); if (det > 0.2) { let u = 0.01; while (u < 0.99) { const bw = rr(0.006, 0.014), bh = rr(0.3, 0.42) / 2.4; const P = [onFace(P3, u, y0 / 2.4 + 0.005), onFace(P3, u + bw, y0 / 2.4 + 0.005), onFace(P3, u + bw, y0 / 2.4 + bh), onFace(P3, u, y0 / 2.4 + bh)]; const PP = cam.poly(P).map(q => [q[0], q[1]]); if (PP.length > 2) { sc.ly.fill(PP, pick3(0.1, 0.4, 0.7, 0.9), { shade: 0, knock: false }); ink(sc.ly.l, PP.concat([PP[0]]), w2 * 0.4, { dense: true, noRough: true }); } u += bw + 0.002; } } } } }); } desk(0, 2.5, 1.6, 0.8, 0.74, 0.3); chair(-0.5, 1.9, 0.42, -1); chair(0.5, 1.9, 0.42, -1); }
    if (name === 'hospital') { const x = -1.5, z = 5; slab(x - 0.5, 0.5, z - 1, x + 0.5, 0.65, z + 1, 0.02); legs(x, z, 1.0, 2.0, 0.5, 0.04, 0.7); slab(x - 0.5, 0.5, z + 0.95, x + 0.5, 1.2, z + 1.0, 0.6); slab(x - 0.3, 0.65, z + 0.5, x + 0.3, 0.75, z + 0.9, 0.0); slab(x + 0.8, 0, z + 0.6, x + 0.85, 1.8, z + 0.65, 0.6); }
    if (name === 'throne' || name === 'castle') { for (const sd of [-1, 1]) for (let z = 3; z < zFar; z += 6) furn(sd * (W2 - 1.5), z, 1.2, 1.2, Hh, 0.3); if (name === 'throne') { furn(0, zFar - 2, 2, 1.5, 2.8, 0.85); sc.face([[-1.2, 0.01, 0], [1.2, 0.01, 0], [1.2, 0.01, zFar - 3], [-1.2, 0.01, zFar - 3]], 0.75, 0.1); } }
    if (name === 'stage') { for (const sd of [-1, 1]) sc.face([[sd * W2, 0, zFar - 0.5], [sd * (W2 - 2.5), 0, zFar - 0.5], [sd * (W2 - 2.0), Hh, zFar - 0.5], [sd * W2, Hh, zFar - 0.5]], 0.9, 0.4, { extra: (fc, P3, w) => { for (let k = 1; k < 6; k++) ll([sd * (W2 - k * 0.45), 0, zFar - 0.5], [sd * (W2 - k * 0.4), Hh, zFar - 0.5], w * 0.6); } }); }
    sc.draw();
    // 床の線（板・畳・コート）
    if (name === 'washitsu') { for (let x = -W2; x <= W2; x += 1.8) ll([x, 0, -2], [x, 0, zFar], 0.8); for (let z = 0; z < zFar; z += 0.9) ll([-W2, 0, z], [W2, 0, z], 0.5); }
    else if (name === 'gym') { ll([-4, 0, 2], [4, 0, 2], 1); ll([-4, 0, 2], [-4, 0, zFar - 2], 1); ll([4, 0, 2], [4, 0, zFar - 2], 1); }
    else if (det > 0.2) for (let x = -W2; x <= W2; x += lerp(1.6, 0.5, det)) ll([x, 0, -1], [x, 0, zFar], 0.45);
    if (name === 'cafe' || name === 'castle') for (let i = 0; i < 3; i++) { const x = -2 + i * 2.5, z = 3 + i * 2; ll([x, Hh, z], [x, Hh - 0.8, z], 0.6); const p0 = cam.proj([x, Hh - 0.9, z]); if (p0) { const r = cam.f * 0.25 / Math.max(1, cam.view([x, Hh, z])[2]); const P = ellipsePts(p0[0], p0[1], r, r * 0.6, 0, 12); ly.fill(P, 0.0, { shade: 0.2 }); ink(ly.l, P.concat([P[0]]), 0.6, { dense: true }); } }
  }
  function backWall(env, cam, ll, W2, Hh, z, w) {
    const { ly, name, art, night } = env; const det = art.detail;
    const rect = (x0, y0, x1, y1, mat, edge = 1) => { const P = cam.poly([[x0, y0, z - 0.01], [x1, y0, z - 0.01], [x1, y1, z - 0.01], [x0, y1, z - 0.01]]).map(p => [p[0], p[1]]); if (P.length < 3) return null; ly.fill(P, mat, { shade: 0, knock: false }); ink(ly.l, P.concat([P[0]]), w * edge, { dense: true, tin: 0.5, tout: 0.5 }); return P; };
    if (name === 'classroom') { rect(-2.5, 1.0, 2.5, 2.4, 0.85); }
    else if (name === 'washitsu') { for (let x = -W2; x < W2 - 0.1; x += 1.5) { rect(x + 0.05, 0.1, x + 1.45, Hh - 0.4, 0.0); for (let k = 1; k < 4; k++) ll([x + 0.05 + k * 0.35, 0.1, z - 0.02], [x + 0.05 + k * 0.35, Hh - 0.4, z - 0.02], w * 0.4); for (let y = 0.6; y < Hh - 0.4; y += 0.5) ll([x + 0.05, y, z - 0.02], [x + 1.45, y, z - 0.02], w * 0.4); } }
    else if (name === 'castle' || name === 'throne') { for (let x = -W2 + 2; x < W2; x += 4) { const P = rect(x - 0.9, 0, x + 0.9, Hh * 0.6, 0.9); } for (let y = 0.6; y < Hh && det > 0.3; y += 0.6) ll([-W2, y, z - 0.02], [W2, y, z - 0.02], w * 0.35); }
    else if (name === 'spaceship') { rect(-W2 + 0.5, 1, W2 - 0.5, Hh - 0.3, 0.97); for (let x = -W2 + 0.5; x < W2; x += 1.5) ll([x, 1, z - 0.02], [x, Hh - 0.3, z - 0.02], w * 1.5); env.windowStars = true; }
    else if (name === 'library') { }
    else if (name === 'stage') { rect(-W2 + 2.5, 0, W2 - 2.5, Hh, 0.3); }
    else { const P = rect(-1.4, 0.9, 1.4, 2.3, night ? 0.95 : 0.0); if (P) { rect(-1.48, 0.84, 1.48, 0.9, 0.4, 0.8); ll([0, 0.9, z - 0.02], [0, 2.3, z - 0.02], w * 1.2); ll([-1.4, 1.6, z - 0.02], [1.4, 1.6, z - 0.02], w); if (!night && det > 0.3) { ll([-1.2, 2.1, z - 0.02], [-0.9, 1.8, z - 0.02], w * 0.5); ll([0.3, 2.15, z - 0.02], [0.55, 1.95, z - 0.02], w * 0.5); }
        // カーテン：ひだのある布
        if (det > 0.2) for (const sd of [-1, 1]) { const x0 = sd * 1.35, x1 = sd * 1.85; const Pc = cam.poly([[Math.min(x0, x1), 0.8, z - 0.05], [Math.max(x0, x1), 0.8, z - 0.05], [Math.max(x0, x1), 2.45, z - 0.05], [Math.min(x0, x1), 2.45, z - 0.05]]).map(q => [q[0], q[1]]); if (Pc.length > 2) { ly.fill(Pc, 0.35, { shade: 0.3, knock: false }); ink(ly.l, Pc.concat([Pc[0]]), w, { dense: true }); for (let k = 1; k < 4; k++) ll([lerp(x0, x1, k / 4), 0.85, z - 0.06], [lerp(x0, x1, k / 4 + 0.03), 2.4, z - 0.06], w * 0.6); } }
        ll([-2.0, 2.5, z - 0.07], [2.0, 2.5, z - 0.07], w * 1.3); } }
    // 幅木と時計
    ll([-W2, 0.08, z - 0.01], [W2, 0.08, z - 0.01], w * 0.7);
    if (['classroom', 'office', 'cafe', 'kitchen', 'room'].includes(name) && det > 0.3) { const c = cam.proj([W2 * 0.55, 2.55, z - 0.02]); if (c) { const r = cam.f * 0.16 / Math.max(1, cam.view([0, 0, z])[2]); const E = ellipsePts(c[0], c[1], r, r, 0, 16); ly.fill(E, 0, { shade: 0, knock: false }); ink(ly.l, E.concat([E[0]]), w, { dense: true }); ink(ly.l, [[c[0], c[1]], [c[0], c[1] - r * 0.7]], w * 0.8); ink(ly.l, [[c[0], c[1]], [c[0] + r * 0.5, c[1]]], w * 0.8); } }
    if (name === 'cafe' || name === 'room' || name === 'office') for (let i = 0; i < det * 3; i++) { const x = rr(-W2 + 0.5, W2 - 1.2), y = rr(1.6, 2.4); rect(x, y, x + 0.6, y + 0.5, rr(0, 0.6), 0.8); }
  }
  function sideWall(env, cam, ll, W2, Hh, z, w) { const { name, art } = env; if (name === 'classroom' || name === 'office' || name === 'hospital') for (let zz = 2; zz < z - 1; zz += 3) { const P = cam.poly([[W2 - 0.01, 0.9, zz], [W2 - 0.01, 0.9, zz + 2], [W2 - 0.01, 2.4, zz + 2], [W2 - 0.01, 2.4, zz]]).map(p => [p[0], p[1]]); if (P.length > 2) { env.ly.fill(P, 0, { shade: 0, knock: false }); ink(env.ly.l, P.concat([P[0]]), w, { dense: true }); } } }

  // ---------- 洗濯物（背景と持ち物で共通） ----------
  // ly: Layer。x,y = 吊るす点（竿の上）, s = 大きさ, sway = 風でゆれる量
  function laundry(ly, kind, x, y, s, sway = 0, mat = 0) {
    const l = ly.l, sw = sway * s;
    const pin = (px, py) => { const P = [[px - s * 0.05, py - s * 0.12], [px + s * 0.05, py - s * 0.12], [px + s * 0.04, py + s * 0.1], [px - s * 0.04, py + s * 0.1]]; ly.fill(P, 0.6, { shade: 0 }); ink(l, P.concat([P[0]]), 0.7, { dense: true }); };
    if (kind === 'shirt') { // 肩で竿にかけたシャツ
      const P = catmull([[x - s * 0.55, y], [x - s * 0.18, y - s * 0.04], [x, y + s * 0.08], [x + s * 0.18, y - s * 0.04], [x + s * 0.55, y], [x + s * 0.8 + sw * 0.3, y + s * 0.3], [x + s * 0.55 + sw * 0.3, y + s * 0.42], [x + s * 0.42 + sw, y + s * 0.28], [x + s * 0.45 + sw, y + s * 1.05], [x - s * 0.45 + sw, y + s * 1.08], [x - s * 0.42 + sw, y + s * 0.28], [x - s * 0.55 + sw * 0.3, y + s * 0.42], [x - s * 0.8 + sw * 0.3, y + s * 0.3]], 3, true);
      ly.fill(P, mat, { shade: 0.5, off: s * 0.1 }); contour(l, P, 1.2);
      ink(l, [[x - s * 0.18, y - s * 0.03], [x, y + s * 0.22], [x + s * 0.18, y - s * 0.03]], 0.8);
      for (let i = 0; i < 3; i++) { const yy = y + s * (0.45 + i * 0.2); ink(l, [[x + sw - s * 0.1 + i * s * 0.08, yy], [x + sw - s * 0.02 + i * s * 0.1, yy + s * 0.18]], 0.5); }
      pin(x - s * 0.45, y); pin(x + s * 0.45, y);
    } else if (kind === 'towel') { // 二つ折りのタオル：端に縞
      const P = catmull([[x - s * 0.5, y], [x + s * 0.5, y], [x + s * 0.52 + sw, y + s * 0.9], [x + sw * 0.9, y + s * 0.95], [x - s * 0.48 + sw, y + s * 0.88]], 3, true);
      ly.fill(P, mat, { shade: 0.5, off: s * 0.1 }); contour(l, P, 1.2);
      for (const t of [0.72, 0.8]) ink(l, [[x - s * 0.49 + sw * t, y + s * t], [x + s * 0.51 + sw * t, y + s * t]], 0.6);
      ink(l, [[x - s * 0.2 + sw * 0.4, y + s * 0.15], [x - s * 0.15 + sw * 0.6, y + s * 0.6]], 0.5);
      pin(x - s * 0.4, y); pin(x + s * 0.4, y);
    } else if (kind === 'socks') { // くつ下ふたつ
      for (const dx of [-0.18, 0.18]) { const cx = x + dx * s; const P = catmull([[cx - s * 0.08, y], [cx + s * 0.08, y], [cx + s * 0.09 + sw * 0.5, y + s * 0.42], [cx + s * 0.25 + sw * 0.5, y + s * 0.5], [cx + s * 0.22 + sw * 0.5, y + s * 0.62], [cx - s * 0.02 + sw * 0.5, y + s * 0.6], [cx - s * 0.09 + sw * 0.5, y + s * 0.45]], 3, true); ly.fill(P, mat, { shade: 0.4 }); contour(l, P, 1.0); ink(l, [[cx - s * 0.08, y + s * 0.1], [cx + s * 0.08, y + s * 0.1]], 0.5); pin(cx, y); }
    } else if (kind === 'futon') {
      const P = [[x - s * 0.9, y], [x + s * 0.9, y], [x + s * 0.92 + sw, y + s * 0.55], [x - s * 0.88 + sw, y + s * 0.55]];
      const PP = catmull(P, 4, true); ly.fill(PP, mat || 0.25, { shade: 0.5, off: s * 0.15 }); contour(l, PP, 1.3); ink(l, [[x - s * 0.9, y + s * 0.02], [x + s * 0.9, y + s * 0.02]], 1.0);
    }
  }
  // 虹：7本の帯を、トーンの濃さを変えて（白黒でも帯の区別がつく）
  function rainbowArc(ly, cx, cy, r, w, a0 = Math.PI * 1.04, a1 = Math.PI * 1.96, bold = false) {
    // 太い虹は、黒に近い帯から白い帯までコントラストを大きく（白黒でも帯がはっきり見える）
    const mats = bold ? [0.25, 0.05, 0.5, 0.95, 0.7, 0.12, 0.38] : [0.55, 0.12, 0.38, 0.05, 0.3, 0.7, 0.2]; const n = mats.length;
    for (let i = 0; i < n; i++) { const r0 = r - w * i / n, r1 = r - w * (i + 1) / n; const P = ellipsePts(cx, cy, r0, r0, 0, 60, a0, a1).concat(ellipsePts(cx, cy, r1, r1, 0, 60, a0, a1).reverse()); ly.fill(P, mats[i], { shade: 0, knock: false, ha: 2 }); }
    ink(ly.l, ellipsePts(cx, cy, r, r, 0, 60, a0, a1), 1.1, { dense: true, tin: 20, tout: 20 }); ink(ly.l, ellipsePts(cx, cy, r - w, r - w, 0, 60, a0, a1), 0.8, { dense: true, tin: 20, tout: 20 });
    for (let i = 1; i < n; i++) { const rr2 = r - w * i / n; ink(ly.l, ellipsePts(cx, cy, rr2, rr2, 0, 50, a0 + 0.05, a1 - 0.05), 0.35, { dense: true, tin: 30, tout: 30 }); }
  }
  // ---------- 自然 ----------
  function nature(env) {
    const { ly, box, hz, art, name, night } = env; const det = art.detail, l = ly.l;
    const ground = [[box.x, hz], [box.x + box.w, hz], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]];
    if (name === 'cave') { ly.fill([[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]], 0.92, { shade: 0 }); const mouth = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; mouth.push([box.x + box.w / 2 + Math.cos(a) * box.w * 0.32 * rr(0.9, 1.1), hz + Math.sin(a) * box.h * 0.5 * rr(0.9, 1.08)]); } mouth.push([box.x + box.w * 0.82, box.y + box.h], [box.x + box.w * 0.18, box.y + box.h]); const P = catmull(mouth, 3, true); ly.fill(P, 0.25, { shade: 0.4 }); ink(l, P, 1.4, { dense: true, closed: true }); for (let i = 0; i < det * 30; i++) { const x = box.x + rand() * box.w, y = box.y + rand() * box.h; ink(ly.hi, [[x, y], [x + rr(-10, 10), y + rr(4, 14)]], 0.6); } return; }
    if (name === 'rainbow') { // 空いっぱいの大きな虹＋丘
      // bgSpec.scale（既定1、大ゴマでは自動で大きく）: 1 で画面幅いっぱい、帯の太さもそれに合わせる
      const big = env.bg.big || (env.bg.scale ?? (box.w * box.h > 150000 ? 1.25 : 1)) > 1.1; const sc2 = env.bg.scale ?? (big ? 1.3 : 1);
      const cx = box.x + box.w * 0.5, cyR = hz + box.h * (big ? 0.2 : 0.1), r = Math.min(box.w * 0.5 * sc2, (cyR - box.y) * (big ? 1.05 : 0.92));
      rainbowArc(ly, cx, cyR, r, r * (big ? 0.42 : 0.26), Math.PI * 1.0, Math.PI * 2.0, big);
      const hill = catmull([[box.x - 10, hz + box.h * 0.04], [box.x + box.w * 0.3, hz - box.h * 0.04], [box.x + box.w * 0.7, hz + box.h * 0.02], [box.x + box.w + 10, hz - box.h * 0.03], [box.x + box.w + 10, box.y + box.h], [box.x - 10, box.y + box.h]], 6, true);
      ly.fill(hill, 0.12, { shade: 0, ha: 2 }); ink(l, hill.slice(0, 24), 1.0, { dense: true });
      for (let i = 0; i < 12 + art.detail * 20; i++) { const x = box.x + rand() * box.w, y = hz + rand() * (box.y + box.h - hz), s2 = lerp(3, 12, (y - hz) / (box.y + box.h - hz)); ink(l, [[x - s2 * 0.3, y], [x, y - s2], [x + s2 * 0.3, y]], 0.6); }
      return;
    }
    if (name === 'yard') return yard(env);
    const gm = name === 'beach' ? 0.08 : name === 'desert' ? 0.15 : name === 'field' || name === 'park' ? 0.12 : 0.2;
    ly.fill(ground, gm * (night ? 3 : 1), { shade: 0, ha: 2 });
    // 遠景
    if (name === 'mountain' || name === 'field' || name === 'desert' || name === 'shrine' || name === 'park') {
      const layers = name === 'mountain' ? 3 : 2;
      for (let L = 0; L < layers; L++) {
        const amp = (name === 'mountain' ? box.h * 0.35 : box.h * 0.08) * (1 - L * 0.25), base = hz + L * box.h * 0.02;
        const pts = [[box.x - 10, base]]; const n = name === 'mountain' ? 5 : 8;
        for (let i = 0; i <= n; i++) { const x = box.x + i / n * box.w; pts.push([x, base - amp * (name === 'mountain' ? (i % 2 ? rr(0.5, 1) : rr(0.1, 0.4)) : rr(0.3, 1))]); }
        pts.push([box.x + box.w + 10, base]);
        const P = name === 'mountain' ? pts : catmull(pts, 6);
        ly.fill(P, lerp(0.3, 0.1, L / layers) * (night ? 2 : 1), { shade: name === 'mountain' ? 0.8 : 0.3, off: amp * 0.25, blur: 0 });
        ink(l, P.slice(1, -1), 1.0 - L * 0.2, { dense: name !== 'mountain' });
        if (name === 'mountain' && det > 0.3) for (let i = 1; i < pts.length - 1; i += 2) { const pk = pts[i]; if (pk[1] > base - amp * 0.5) continue; ink(l, [pk, [pk[0] + rr(-10, 10), pk[1] + amp * 0.35]], 0.7); }
      }
    }
    if (name === 'beach') { const sea = [[box.x, hz], [box.x + box.w, hz], [box.x + box.w, hz + box.h * 0.18], [box.x, hz + box.h * 0.15]]; ly.fill(sea, 0.4, { shade: 0 }); ink(l, [[box.x, hz], [box.x + box.w, hz]], 1.0); for (let i = 0; i < 8 + det * 30; i++) { const y = hz + rr(0.01, 0.16) * box.h, x = box.x + rand() * box.w, w2 = rr(8, 30) * (1 + (y - hz) / box.h * 4); ink(rand() < 0.5 ? l : ly.hi, [[x, y], [x + w2, y]], 0.6); } ink(l, catmull([[box.x, hz + box.h * 0.15], [box.x + box.w * 0.3, hz + box.h * 0.19], [box.x + box.w * 0.6, hz + box.h * 0.16], [box.x + box.w, hz + box.h * 0.19]], 6), 1.0, { dense: true }); }
    if (name === 'desert') for (let i = 0; i < 3; i++) { const y = hz + box.h * (0.08 + i * 0.12); ink(l, catmull([[box.x, y + rr(-10, 10)], [box.x + box.w * 0.4, y - box.h * 0.05], [box.x + box.w, y + rr(-10, 10)]], 8), 0.9, { dense: true }); }
    // 木
    const tree = (x, gy, s, far) => {
      const tw = s * 0.07, th = s * 0.55;
      const trunk = [[x - tw, gy], [x - tw * 0.6, gy - th], [x + tw * 0.6, gy - th], [x + tw, gy]];
      ly.fill(trunk, 0.6, { shade: 0.8, off: tw, ha: 1 }); ink(l, [trunk[0], trunk[1]], 1.0 * (far ? 0.6 : 1)); ink(l, [trunk[3], trunk[2]], 1.2 * (far ? 0.6 : 1));
      const cy = gy - th - s * 0.2, pts = []; const k = 11;
      for (let i = 0; i < k; i++) { const a = i / k * TAU; const r = s * 0.38 * rr(0.85, 1.1); pts.push([x + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 0.85]); }
      // 葉のふち：もこもこ
      const P = []; for (let i = 0; i < k; i++) { const a = pts[i], b = pts[(i + 1) % k]; const mid = V.lerp(a, b, 0.5); const out = V.norm(V.sub(mid, [x, cy])); P.push(a, V.add(mid, V.mul(out, s * 0.07))); }
      const PP = catmull(P, 3, true);
      ly.fill(PP, 0.35, { shade: 0.9, off: s * 0.18, blur: s * 0.02 }); contour(l, PP, 1.2 * (far ? 0.6 : 1));
      if (det > 0.35) for (let i = 0; i < det * 10; i++) { const a = rand() * TAU, r = s * 0.25 * rand(); const c = [x + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8]; ink(l, [[c[0] - s * 0.05, c[1]], [c[0], c[1] - s * 0.04], [c[0] + s * 0.05, c[1]]], 0.6); }
    };
    if (name === 'forest' || name === 'park' || name === 'shrine' || name === 'field') {
      const n = name === 'forest' ? 6 + Math.round(det * 10) : 2 + Math.round(det * 3);
      const trees = []; for (let i = 0; i < n; i++) { const depth = rand(); trees.push({ x: box.x + rand() * box.w, gy: hz + depth * box.h * 0.12, s: box.h * lerp(0.35, 1.1, depth) * (name === 'forest' ? 1.1 : name === 'field' ? 0.45 : 0.8), far: depth < 0.4 }); }
      trees.sort((a, b) => a.gy - b.gy).forEach(t => tree(t.x, t.gy, t.s, t.far));
    }
    if (name === 'shrine') { const cx = box.x + box.w * 0.5, gy = hz + box.h * 0.04, s = box.h * 0.55; const post = (x) => { const P = [[x - s * 0.03, gy], [x - s * 0.025, gy - s * 0.8], [x + s * 0.025, gy - s * 0.8], [x + s * 0.03, gy]]; ly.fill(P, 0.6, { shade: 0.8, off: s * 0.02 }); contour(l, P, 1.2); }; post(cx - s * 0.35); post(cx + s * 0.35); const beam = (y, ww, hh, curve) => { const P = catmull([[cx - ww, y - curve], [cx, y], [cx + ww, y - curve], [cx + ww, y + hh - curve], [cx, y + hh], [cx - ww, y + hh - curve]], 3, true); ly.fill(P, 0.6, { shade: 0.6 }); contour(l, P, 1.2); }; beam(gy - s * 0.85, s * 0.55, s * 0.07, s * 0.06); beam(gy - s * 0.68, s * 0.45, s * 0.05, 0); }
    // 草
    const gN = Math.round((name === 'desert' || name === 'beach' ? 0 : 25) * (0.3 + det));
    for (let i = 0; i < gN; i++) { const t = rand(), x = box.x + rand() * box.w, y = hz + t * t * (box.y + box.h - hz), s = lerp(3, 16, t); for (let k = -1; k <= 1; k++) ink(l, [[x + k * s * 0.3, y], [x + k * s * 0.5 + rr(-2, 2), y - s * rr(0.7, 1.2)]], 0.7, { tin: 1, tout: s * 0.6 }); }
    if (name === 'park' && det > 0.2) { const y = hz + box.h * 0.25, x = box.x + box.w * 0.7, w2 = box.w * 0.15; const seat = [[x, y], [x + w2, y], [x + w2 * 1.05, y + box.h * 0.03], [x + w2 * 0.05, y + box.h * 0.03]]; ly.fill(seat, 0.5, { shade: 0.5 }); contour(l, seat, 1.1); ink(l, [[x + w2 * 0.1, y + box.h * 0.03], [x + w2 * 0.1, y + box.h * 0.09]], 1); ink(l, [[x + w2 * 0.95, y + box.h * 0.03], [x + w2 * 0.95, y + box.h * 0.09]], 1); }
  }
  // 物干しのある庭：家の壁・縁側、板の塀、物干し台2本と竿、洗濯物
  function yard(env) {
    const { ly, box, hz, art, night } = env; const l = ly.l, det = art.detail;
    const g = [[box.x, hz], [box.x + box.w, hz], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]]; ly.fill(g, 0.1, { shade: 0, ha: 2 });
    // 塀（板）
    const fy = hz - box.h * 0.22; const fence = [[box.x, fy], [box.x + box.w, fy], [box.x + box.w, hz], [box.x, hz]]; ly.fill(fence, 0.18, { shade: 0.2, ha: 1 }); ink(l, [[box.x, fy], [box.x + box.w, fy]], 1.1);
    const bw = lerp(28, 14, det); for (let x = box.x + bw; x < box.x + box.w; x += bw) ink(l, [[x, fy + 1], [x, hz]], 0.6, { noRough: true });
    ink(l, [[box.x, fy + (hz - fy) * 0.35], [box.x + box.w, fy + (hz - fy) * 0.35]], 0.5);
    // 家の壁（左端）と縁側
    const wx = box.x + box.w * 0.14; const wall = [[box.x, box.y], [wx, box.y], [wx, hz + box.h * 0.12], [box.x, hz + box.h * 0.12]]; ly.fill(wall, 0.05, { shade: 0.6, ha: 1 }); ink(l, [[wx, box.y], [wx, hz + box.h * 0.12]], 1.3);
    const ew = [[box.x, hz + box.h * 0.06], [wx + box.w * 0.05, hz + box.h * 0.06], [wx + box.w * 0.05, hz + box.h * 0.12], [box.x, hz + box.h * 0.12]]; ly.fill(ew, 0.35, { shade: 0.3 }); ink(l, ew.concat([ew[0]]), 1.0, { dense: true });
    const win = [[box.x + box.w * 0.02, box.y + box.h * 0.12], [wx - box.w * 0.02, box.y + box.h * 0.12], [wx - box.w * 0.02, hz - box.h * 0.05], [box.x + box.w * 0.02, hz - box.h * 0.05]]; ly.fill(win, night ? 0.9 : 0.25, { shade: 0, knock: false }); ink(l, win.concat([win[0]]), 0.9, { dense: true }); ink(l, [[(win[0][0] + win[1][0]) / 2, win[0][1]], [(win[0][0] + win[1][0]) / 2, win[2][1]]], 0.7);
    // 物干し台：2本の柱（T字）と竿
    const py = hz - box.h * 0.48, base = hz + box.h * 0.1; const xs = [box.x + box.w * 0.24, box.x + box.w * 0.92];
    for (const x of xs) { const post = [[x - 3, py], [x + 3, py], [x + 4, base], [x - 4, base]]; ly.fill(post, 0.45, { shade: 0.6, ha: 1 }); ink(l, post.concat([post[0]]), 1.0, { dense: true }); const arm = [[x - 16, py - 3], [x + 16, py - 3], [x + 16, py + 3], [x - 16, py + 3]]; ly.fill(arm, 0.45, { shade: 0.4 }); ink(l, arm.concat([arm[0]]), 1.0, { dense: true }); const ft = [[x - 12, base], [x + 12, base], [x + 9, base - 6], [x - 9, base - 6]]; ly.fill(ft, 0.8, { shade: 0 }); ink(l, ft.concat([ft[0]]), 0.8, { dense: true }); }
    const sag = box.h * 0.012; const pole = catmull([[xs[0] - 10, py - 1], [(xs[0] + xs[1]) / 2, py + sag], [xs[1] + 10, py - 1]], 12);
    const poleP = K.sweep(pole, () => 2.2).poly; ly.fill(poleP, 0.15, { shade: 0.3 }); ink(l, poleP.slice(0, pole.length), 1.0, { dense: true }); ink(l, poleP.slice(pole.length), 0.8, { dense: true });
    // 洗濯物
    const items = env.bg.laundry || ['shirt', 'towel', 'socks', 'shirt', 'towel'];
    const sway = (art.dynamism - 0.3) * 0.3 + (env.bg.weather === 'storm' ? 0.4 : 0);
    const s0 = (xs[1] - xs[0]) / (items.length + 0.5) * 0.8;
    items.forEach((k, i) => { const t = (i + 0.75) / (items.length + 0.5); const x = lerp(xs[0], xs[1], t); laundry(ly, k, x, py + sag * 4 * t * (1 - t) + 1, s0 * (k === 'socks' ? 0.8 : 1), sway * rr(0.6, 1.2), i % 3 === 2 ? 0.3 : 0); });
    // 草
    for (let i = 0; i < 15 + det * 30; i++) { const x = box.x + rand() * box.w, y = hz + rand() * (box.y + box.h - hz), s2 = lerp(3, 12, (y - hz) / (box.y + box.h - hz)); ink(l, [[x - s2 * 0.3, y], [x, y - s2], [x + s2 * 0.3, y]], 0.6); }
  }
  // ---------- 空間・装飾背景 ----------
  function voidBg(env) {
    const { ly, box, hz, art, name } = env; const all = [[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]];
    const m = ly.m;
    if (name === 'plain' || name === 'sky') { ly.fill(all, 0, { shade: 0 }); if (name === 'sky') sky(Object.assign({}, env, { hz: box.y + box.h })); return; }
    if (name === 'black') { ly.fill(all, 1, { shade: 0 }); return; }
    if (name === 'tone') { ly.fill(all, 0.3, { shade: 0 }); return; }
    if (name === 'space') { ly.fill(all, 1, { shade: 0 }); env.stars = true; env.hz = box.y + box.h; const r = box.h * 0.35, c = [box.x + box.w * 0.78, box.y + box.h * 0.75]; const P = ellipsePts(c[0], c[1], r, r, 0, 40); ly.fill(P, 0.3, { shade: 1, off: r * 0.45, blur: r * 0.1 }); ink(ly.hi, P.slice(5, 20), 1.2, { dense: true }); return; }
    if (name === 'underwater') { ly.fill(all, 0.3, { shade: 0 }); const g = m.createLinearGradient(0, box.y, 0, box.y + box.h); g.addColorStop(0, ly.g(0.15)); g.addColorStop(1, ly.g(0.65)); m.fillStyle = g; fillPoly(m, all); for (let i = 0; i < 5; i++) { const x = box.x + rand() * box.w; ink(ly.hi, [[x, box.y], [x + box.w * 0.1, box.y + box.h]], rr(4, 12), { tin: 1, tout: box.h * 0.8 }); } for (let i = 0; i < 12 + art.detail * 20; i++) { const x = box.x + rand() * box.w, y = box.y + rand() * box.h, r = rr(1.5, 5); const P = ellipsePts(x, y, r, r, 0, 12); ly.fill(P, 0, { shade: 0 }); ink(ly.l, P.concat([P[0]]), 0.6, { dense: true }); } return; }
    if (name === 'flowers') { ly.fill(all, 0, { shade: 0 }); env.flowers = true; return; }
    if (name === 'sparkle') { ly.fill(all, 0.25 + art.black * 0.4, { shade: 0 }); env.sparkles = true; return; }
  }
  function weather(env) {
    const { ly, box, art, bg } = env;
    if (env.stars) stars(env);
    if (env.flowers || env.sparkles) env.post = ctx => K.drawEffect(ctx, { name: env.flowers ? 'flowers' : 'sparkle' }, box, art);
    const w = bg.weather;
    if (w === 'rain' || w === 'storm') { const prev = env.post; env.post = ctx => { if (prev) prev(ctx); K.drawEffect(ctx, { name: 'rain', amount: w === 'storm' ? 1.4 : 1 }, box, art); }; }
    if (w === 'snow') { for (let i = 0; i < box.w * box.h / 2400; i++) { const x = box.x + rand() * box.w, y = box.y + rand() * box.h, r = rr(1, 3.2); const P = ellipsePts(x, y, r, r, 0, 10); ly.hi.beginPath(); ly.hi.arc(x, y, r, 0, TAU); ly.hi.fill(); ink(ly.l, P.concat([P[0]]), 0.5, { dense: true }); } }
    if (w === 'fog') { const prev = env.post; env.post = ctx => { if (prev) prev(ctx); const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h); g.addColorStop(0, 'rgba(255,255,255,.3)'); g.addColorStop(0.6, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,.5)'); ctx.fillStyle = g; ctx.fillRect(box.x, box.y, box.w, box.h); }; }
  }
  Object.assign(K, { drawBackground, Cam, BG_NAMES: NAMES, laundry, rainbowArc });
})();

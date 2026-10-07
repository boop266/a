/* =========================================================
   manga/styles3d/kit.js — 背景の3Dキット（すべて手続き的に生成）
   ・部品：地面、石垣・城壁、塔、がれき、岩、崖、ねじれた木、家（中世）、ビル（現代）、部屋、洞窟、遠くの山
   ・場面：SCENES[name](B, env) が部品を並べ、空・光・霧・カメラの好みを返す
   ・カメラ：camera({ angle, lens, yaw, dist, height, target }) で煽り・俯瞰・広角・望遠
   ========================================================= */
(() => {
  const M3 = window.Manga3D; if (!M3 || !M3.THREE) return;
  const T = M3.THREE;
  const { rand, rr, pick, clamp, lerp, sstep, noise3, fbm3, V3, M, Mab, displace, displaceWelded, tube, lathe, rock, stone } = M3;
  const PI = Math.PI;

  // ---------- 地面 ----------
  // 中央（舞台）は平ら、遠くほど起伏。fn(x,z) で高さを返す
  function terrain(o = {}) {
    const amp = o.amp ?? 6, flat = o.flat ?? 12, s0 = rr(0, 50), sc = o.scale ?? 0.025;
    return (x, z) => {
      const d = Math.hypot(x - (o.cx ?? 0), z - (o.cz ?? 0));
      const k = sstep(flat, flat * 4, d);
      return (fbm3(x * sc + s0, 0, z * sc, 4) * amp + Math.max(0, fbm3(x * sc * 0.4, 3, z * sc * 0.4, 3)) * amp * 2.5) * k + (o.base ?? 0) + fbm3(x * 0.3, 7, z * 0.3, 2) * (o.bump ?? 0.08);
    };
  }
  function ground(B, o = {}) {
    const size = o.size ?? 400, seg = o.seg ?? 140;
    const g = new T.PlaneGeometry(size, size, seg, seg); g.rotateX(-PI / 2);
    const h = o.height || (() => 0);
    const p = g.attributes.position;
    // 近くを細かく：頂点を中心に寄せる（2乗）
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), z = p.getZ(i);
      const r = Math.hypot(x, z) / (size / 2) || 0; const k = r > 0 ? Math.pow(r, 1.6) / r : 0;
      x = x * k + (o.cx ?? 0); z = z * k + (o.cz ?? 0);
      p.setXYZ(i, x, h(x, z), z);
    }
    g.computeVertexNormals();
    B.add(g, null, { tone: o.tone ?? 0.12, pat: o.pat ?? 'ground', id: o.id });
    return h;
  }
  // 遠くの山なみ（輪郭が大事）
  function mountains(B, o = {}) {
    const n = o.n ?? 7, R = o.r ?? 220;
    for (let i = 0; i < n; i++) {
      const a = (o.a0 ?? -PI * 0.85) + (i / (n - 1)) * (o.span ?? PI * 0.7) + rr(-0.08, 0.08);
      const g = new T.ConeGeometry(1, 1, 18, 8, true); g.translate(0, 0.5, 0);
      const s0 = rr(0, 99);
      displace(g, v => { const k = (1 - v.y) * 0.35; return V3(fbm3(v.x * 3 + s0, v.y * 3, v.z * 3) * k, fbm3(v.x * 2, v.y * 4 + s0, v.z * 2) * 0.12, fbm3(v.z * 3, s0, v.x * 3) * k); });
      const hh = rr(25, 60) * (o.hk ?? 1), w = hh * rr(1.4, 2.4);
      B.add(g, M([Math.sin(a) * R, -2, Math.cos(a) * R], [0, rr(0, 6), 0], [w, hh, w * 0.7]), { tone: 0.35, pat: 'stone', flat: true, double: true });
    }
  }

  // ---------- 石の壁 ----------
  // 壁を x 方向に。o: { x0, x1, z, y0, h, t(厚み), course(段の高さ), merlons, broken: [ {x, w, d} ], walk: true, ang }
  function wall(B, o) {
    const x0 = o.x0, x1 = o.x1, z = o.z ?? 0, y0 = o.y0 ?? 0, H = o.h ?? 6, t = o.t ?? 2.2, ch = o.course ?? 0.55;
    const base = M([o.ox ?? 0, 0, o.oz ?? 0], [0, o.ang ?? 0, 0]);
    const put = (g, m, op) => B.add(g, base.clone().multiply(m), op);
    const id = o.id ?? B.newId();
    // 崩れ：その x での高さの上限
    const limit = x => { let h = H; for (const b of o.broken || []) { const u = (x - b.x) / (b.w / 2); if (Math.abs(u) < 1.3) { const jag = noise3(x * 1.7, b.x, 3) * 0.9; h = Math.min(h, H - b.d * Math.max(0, 1 - u * u) + jag * (1 - Math.abs(u) * 0.5) + (Math.abs(u) > 1 ? (Math.abs(u) - 1) * 5 : 0)); } } return h; };
    const rows = Math.ceil(H / ch);
    for (const side of [-1, 1]) {
      const zf = z + side * (t / 2 - 0.22);
      for (let r = 0; r < rows; r++) {
        const y = y0 + r * ch; let x = x0 - (r % 2) * rr(0.2, 0.6);
        while (x < x1) {
          const L = rr(0.6, 1.25), xc = Math.min(x + L / 2, x1 - 0.1), lim = limit(xc);
          if (y + ch * 0.5 < lim) {
            const top = y + ch > lim; // 崩れぎわ
            if (!(top && rand() < 0.45)) {
              const tilt = top ? rr(-0.25, 0.25) : rr(-0.02, 0.02), sink = top ? rr(-0.15, 0.05) : 0;
              put(stone(L - 0.04, ch - 0.04, rr(0.38, 0.5), { amp: top ? 0.1 : 0.05, seg: top ? 2 : 1 }), M([xc, y + ch / 2 + sink, zf + rr(-0.03, 0.03)], [rr(-0.03, 0.03), rr(-0.04, 0.04), tilt]), { tone: rr(0.12, 0.32), pat: 'stone', id });
            }
          }
          x += L;
        }
      }
    }
    // 中身（芯）：崩れの形に合わせて
    const step = 0.8;
    for (let x = x0; x < x1; x += step) { const lim = limit(x + step / 2) - 0.25; if (lim > 0.3) put(new T.BoxGeometry(step, lim, t - 0.7), M([x + step / 2, y0 + lim / 2, z]), { tone: 0.55, pat: 'stone', id }); }
    // 上：歩廊の敷石と、胸壁（凸凹）
    if (o.walk !== false) {
      for (let x = x0; x < x1; x += rr(0.7, 1.1)) {
        const lim = limit(x + 0.4); if (lim < H - 0.05) continue;
        for (let k = 0; k < 3; k++) put(stone(rr(0.7, 1.0), 0.18, (t - 0.1) / 3 - 0.03, { amp: 0.03, seg: 1 }), M([x + 0.45, y0 + H + 0.06, z - t / 2 + (k + 0.5) * (t - 0.1) / 3 + 0.05], [rr(-0.02, 0.02), rr(-0.05, 0.05), rr(-0.02, 0.02)]), { tone: rr(0.08, 0.2), pat: 'stone', id });
      }
    }
    if (o.merlons !== false) {
      for (const side of o.merlonSides || [-1]) {
        const zf = z + side * (t / 2 - 0.3);
        // 胸壁の下段（腰壁）
        for (let x = x0; x < x1; x += 0.9) { const lim = limit(x + 0.45); if (lim < H - 0.05) continue; put(stone(0.86, 0.5, 0.55), M([x + 0.45, y0 + H + 0.25, zf], [0, rr(-0.03, 0.03), rr(-0.02, 0.02)]), { tone: rr(0.15, 0.3), pat: 'stone', id }); }
        // 凸（メルロン）
        for (let x = x0 + 0.2; x < x1 - 1; x += 2.0) {
          const lim = limit(x + 0.6); if (lim < H - 0.05) continue;
          const mh = rr(0.9, 1.15) * (rand() < 0.15 ? 0.5 : 1);
          put(stone(1.15, mh, 0.6, { amp: 0.08 }), M([x + 0.6, y0 + H + 0.5 + mh / 2, zf], [0, rr(-0.04, 0.04), rr(-0.03, 0.03)]), { tone: rr(0.15, 0.3), pat: 'stone', id });
        }
      }
    }
    return limit;
  }
  // がれき（石材が転がる）
  function rubble(B, o) {
    const n = o.n ?? 30, [cx, cy, cz] = o.pos, r = o.r ?? 3;
    for (let i = 0; i < n; i++) {
      const a = rand() * PI * 2, d = Math.sqrt(rand()) * r, s = rr(0.25, 0.75) * (o.size ?? 1);
      const g = rand() < 0.6 ? stone(s * rr(1, 1.8), s * rr(0.5, 0.9), s * rr(0.7, 1.1), { amp: s * 0.15 }) : rock(s * 0.6, { detail: 0, rough: 0.4 });
      B.add(g, M([cx + Math.cos(a) * d, cy + s * 0.25 + (1 - d / r) * (o.heap ?? 0.8) * r * 0.25, cz + Math.sin(a) * d], [rr(-0.6, 0.6), rr(0, 6), rr(-0.6, 0.6)]), { tone: rr(0.15, 0.4), pat: 'stone', flat: true, id: o.id });
    }
  }
  // 崩れた塔（石を円く積む）
  function tower(B, o) {
    const [cx, cy, cz] = o.pos, R = o.r ?? 3.5, H = o.h ?? 18, ch = o.course ?? 0.6, id = o.id ?? B.newId();
    const s0 = rr(0, 50);
    const top = a => H - (o.broken ?? 6) * Math.max(0, Math.sin(a * 1.0 + s0) * 0.7 + noise3(a * 2.2, s0, 0) * 0.6 + 0.3);
    const rows = Math.ceil(H / ch);
    const n = Math.max(10, Math.round(2 * PI * R / 1.0));
    const slits = o.slits ?? [0.3, 2.4, 4.1];
    for (let r = 0; r < rows; r++) {
      const y = cy + r * ch, off = (r % 2) * 0.5;
      for (let k = 0; k < n; k++) {
        const a = (k + off) / n * 2 * PI, lim = top(a);
        if (y - cy + ch * 0.5 > lim) continue;
        if (y - cy + ch > lim && rand() < 0.4) continue;
        // 矢狭間（縦長の窓）
        if (slits.some(s => Math.abs(((a - s + PI * 3) % (PI * 2)) - PI) < 0.09) && (r % 9) > 3 && (r % 9) < 8) continue;
        const L = 2 * PI * R / n;
        B.add(stone(L - 0.05, ch - 0.04, 0.6, { amp: 0.05, seg: 1 }), M([cx + Math.sin(a) * R, y + ch / 2, cz + Math.cos(a) * R], [0, a, rr(-0.03, 0.03)]), { tone: rr(0.12, 0.32), pat: 'stone', id });
      }
    }
    // 中は暗い
    B.add(new T.CylinderGeometry(R - 0.35, R - 0.35, H * 0.7, 20, 1, true), M([cx, cy + H * 0.35, cz]), { tone: 0.9, pat: 'stone', id, double: true });
    // 胸壁の張り出し（持ち送り）
    if (o.corbel !== false) for (let k = 0; k < n; k += 2) { const a = k / n * 2 * PI; if (top(a) < H - 1.5) continue; B.add(stone(0.4, 0.5, 0.9), M([cx + Math.sin(a) * (R + 0.2), cy + H - 2.4, cz + Math.cos(a) * (R + 0.2)], [0, a, 0]), { tone: 0.3, pat: 'stone', id }); }
    rubble(B, { pos: [cx + R * 1.2, cy, cz + R * 0.5], r: R * 1.4, n: 25, id });
  }
  // 岩場・崖（大きな岩を寄せ集める）
  function crag(B, o) {
    const [cx, cy, cz] = o.pos, n = o.n ?? 8, s = o.size ?? 6;
    for (let i = 0; i < n; i++) {
      const a = rand() * PI * 2, d = rr(0, s * 0.8), sz = s * rr(0.35, 0.8);
      B.add(rock(sz, { squash: rr(0.8, 1.6), rough: 0.5, cut: 0.6 }), M([cx + Math.cos(a) * d, cy + sz * rr(0.1, 0.6), cz + Math.sin(a) * d], [rr(-0.3, 0.3), rr(0, 6), rr(-0.3, 0.3)]), { tone: rr(0.2, 0.4), pat: 'stone', flat: true, id: o.id });
    }
  }
  // とがった岩の柱（荒野の奇岩）
  function spire(B, o) {
    const [x, y, z] = o.pos, h = o.h ?? 12, r = o.r ?? 2;
    const g = new T.CylinderGeometry(r * 0.25, r, h, 9, 6); g.translate(0, h / 2, 0);
    const s0 = rr(0, 50);
    displace(g, v => V3(fbm3(v.x * 0.4 + s0, v.y * 0.25, v.z * 0.4, 3) * r * 0.6, 0, fbm3(v.z * 0.4, v.y * 0.25 + s0, v.x * 0.4, 3) * r * 0.6), false);
    B.add(g, M([x, y - 0.5, z], [rr(-0.12, 0.12), rr(0, 6), rr(-0.12, 0.12)]), { tone: 0.3, pat: 'stone', flat: true, id: o.id });
  }

  // ---------- ねじれた木 ----------
  function tree(B, o) {
    const [x, y, z] = o.pos, H = o.h ?? 8, id = o.id ?? B.newId(), twist = o.twist ?? 1, dead = o.dead !== false;
    const s0 = rr(0, 99);
    function branch(p, dir, len, r, depth) {
      const pts = [], rad = [], N = Math.max(4, Math.round(len * 1.6));
      let d = dir.clone(), q = p.clone();
      for (let i = 0; i <= N; i++) {
        pts.push([q.x, q.y, q.z]); rad.push(r * lerp(1, 0.35, i / N) * (i === 0 ? 1.25 : 1));
        const n = V3(noise3(q.x * 0.5 + s0, q.y * 0.5, depth), noise3(q.y * 0.5, q.z * 0.5 + s0, depth + 3) * 0.4, noise3(q.z * 0.5, q.x * 0.5, s0 + depth)).multiplyScalar(0.55 * twist);
        if (depth > 0) n.y -= 0.12 * depth; // 枝はたれる
        d.add(n).normalize(); q = q.clone().addScaledVector(d, len / N);
      }
      B.add(tube(pts, rad, Math.max(5, Math.round(10 - depth * 2))), null, { tone: o.tone ?? 0.35, pat: 'wood', id });
      if (depth >= (o.depth ?? 3) || r < 0.04) return;
      const k = depth === 0 ? 3 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 2);
      for (let i = 0; i < k; i++) {
        const t = lerp(0.45, 0.95, (i + rand()) / k), j = Math.min(pts.length - 1, Math.round(t * (pts.length - 1)));
        const bd = d.clone().add(V3(rr(-1, 1), rr(-0.1, 0.8), rr(-1, 1)).multiplyScalar(1.1)).normalize();
        branch(V3(...pts[j]), bd, len * rr(0.45, 0.7), rad[j] * rr(0.55, 0.75), depth + 1);
      }
      if (!dead && depth >= 1) { // 葉のかたまり
        const e = pts[pts.length - 1]; const g = new T.IcosahedronGeometry(1, 1); const s1 = rr(0, 9); displace(g, v => v.clone().multiplyScalar(fbm3(v.x * 2 + s1, v.y * 2, v.z * 2) * 0.5), false);
        B.add(g, M(e, [0, rand() * 6, 0], len * rr(0.5, 0.8)), { tone: 0.45, pat: 'leaf', flat: true, id });
      }
    }
    // 根：地面を這う
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + rr(-0.3, 0.3); branch(V3(x, y + 0.5, z), V3(Math.cos(a), -0.35, Math.sin(a)).normalize(), H * 0.22, H * 0.035, 3); }
    branch(V3(x, y - 0.3, z), V3(rr(-0.2, 0.2), 1, rr(-0.2, 0.2)).normalize(), H * 0.65, H * 0.06, 0);
  }

  // ---------- 中世の家 ----------
  function house(B, o) {
    const [x, y, z] = o.pos, w = o.w ?? 6, d = o.d ?? 7, h1 = o.h1 ?? 3.2, h2 = o.h2 ?? 3, ang = o.ang ?? 0, id = o.id ?? B.newId(), jet = 0.45;
    const base = M([x, y, z], [0, ang, 0]);
    const put = (g, m, op) => B.add(g, base.clone().multiply(m), Object.assign({ id }, op));
    // 1階：石
    for (let yy = 0; yy < h1; yy += 0.42) for (const s of [-1, 1]) for (let xx = -w / 2; xx < w / 2 - 0.1; xx += rr(0.6, 1.0)) {
      const L = Math.min(0.95, w / 2 - xx); if (s === 1 && Math.abs(xx + L / 2) < 0.7 && yy < 2.2) continue; // 戸口
      put(stone(L - 0.04, 0.38, 0.3, { amp: 0.03, seg: 1 }), M([xx + L / 2, yy + 0.21, s * (d / 2 - 0.15)], [0, 0, rr(-0.02, 0.02)]), { tone: rr(0.1, 0.3), pat: 'stone' });
    }
    put(new T.BoxGeometry(w - 0.1, h1, d - 0.4), M([0, h1 / 2, 0]), { tone: 0.2, pat: 'stone' });
    put(new T.BoxGeometry(1.2, 2.2, 0.2), M([0, 1.1, d / 2 - 0.25]), { tone: 0.6, pat: 'wood' }); // 戸
    // 2階：張り出した木骨の壁
    const W2 = w + jet * 2, D2 = d + jet * 2;
    put(new T.BoxGeometry(W2, h2, D2), M([0, h1 + h2 / 2, 0]), { tone: 0.04, pat: 'plain' });
    const beam = (a, b, t = 0.2) => put(new T.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), Mab(a, b, [t, t]), { tone: 0.7, pat: 'wood' });
    for (const s of [-1, 1]) {
      const zf = s * (D2 / 2 + 0.05);
      beam([-W2 / 2, h1, zf], [W2 / 2, h1, zf]); beam([-W2 / 2, h1 + h2, zf], [W2 / 2, h1 + h2, zf]);
      const nPost = Math.max(3, Math.round(W2 / 1.4));
      for (let i = 0; i <= nPost; i++) { const xx = -W2 / 2 + W2 * i / nPost; beam([xx, h1, zf], [xx, h1 + h2, zf]); if (i < nPost && i % 2 === 0) beam([xx, h1, zf], [xx + W2 / nPost, h1 + h2, zf], 0.16); }
      // 窓（よろい戸つき）
      for (let i = 1; i < nPost; i += 2) { const xx = -W2 / 2 + W2 * (i + 0.5) / nPost; put(new T.BoxGeometry(0.8, 1.0, 0.1), M([xx, h1 + h2 * 0.55, zf + s * 0.02]), { tone: 0.92, pat: 'glass' }); put(new T.BoxGeometry(0.4, 1.05, 0.06), M([xx - 0.62, h1 + h2 * 0.55, zf + s * 0.06], [0, s * rr(0.2, 0.9), 0]), { tone: 0.45, pat: 'wood' }); }
      // 持ち送り
      for (let i = 0; i <= nPost; i++) { const xx = -W2 / 2 + W2 * i / nPost; put(new T.BoxGeometry(0.18, 0.18, jet + 0.2), M([xx, h1 - 0.1, s * (d / 2 + jet / 2)]), { tone: 0.6, pat: 'wood' }); }
    }
    // 屋根：急な切妻＋瓦の段
    const rh = o.roofH ?? w * 0.75, ov = 0.5;
    const rl = Math.hypot(W2 / 2 + ov, rh);
    for (const s of [-1, 1]) {
      const a = Math.atan2(rh, W2 / 2 + ov);
      const rows = Math.round(rl / 0.35);
      for (let r = 0; r < rows; r++) {
        const t = (r + 0.5) / rows; const px = s * (W2 / 2 + ov) * (1 - t), py = h1 + h2 + rh * t - 0.15;
        put(new T.BoxGeometry(0.42, 0.06, D2 + ov * 2), M([px, py, 0], [0, 0, -s * a + s * 0.06]), { tone: rr(0.3, 0.5), pat: 'stone' });
      }
    }
    // 妻壁（三角）
    const tri = new T.BufferGeometry(); tri.setAttribute('position', new T.Float32BufferAttribute([-W2 / 2, 0, 0, W2 / 2, 0, 0, 0, rh - 0.2, 0], 3)); tri.computeVertexNormals();
    for (const s of [-1, 1]) put(tri, M([0, h1 + h2, s * (D2 / 2)], [0, s > 0 ? 0 : PI, 0]), { tone: 0.06, double: true });
    // 煙突
    if (rand() < 0.7) put(stone(0.8, rh + 1.5, 0.8, { amp: 0.04 }), M([rr(-1, 1) * w * 0.25, h1 + h2 + (rh + 1.5) / 2, rr(-1, 1) * d * 0.25]), { tone: 0.3, pat: 'stone' });
  }

  // ---------- 現代のビル ----------
  function building(B, o) {
    const [x, y, z] = o.pos, w = o.w ?? 12, d = o.d ?? 12, h = o.h ?? 30, ang = o.ang ?? 0, id = o.id ?? B.newId(), fl = o.floor ?? 3.4;
    const base = M([x, y, z], [0, ang, 0]);
    const put = (g, m, op) => B.add(g, base.clone().multiply(m), Object.assign({ id }, op));
    put(new T.BoxGeometry(w, h, d), M([0, h / 2, 0]), { tone: o.tone ?? rr(0.05, 0.25), pat: 'plain' });
    const floors = Math.floor(h / fl), cols = Math.max(2, Math.floor(w / 2.2));
    const style = o.style ?? pick(['grid', 'band', 'grid']);
    for (const [face, fw, rot] of [[d / 2, w, 0], [-d / 2, w, PI], [w / 2, d, PI / 2], [-w / 2, d, -PI / 2]]) {
      const c = Math.max(2, Math.floor(fw / 2.2));
      for (let f = 1; f < floors; f++) {
        if (style === 'band') { put(new T.BoxGeometry(fw * 0.94, fl * 0.45, 0.15), M([0, 0, 0], [0, rot, 0]).multiply(M([0, f * fl + fl * 0.5, face > 0 ? Math.abs(face) : Math.abs(face)])), { tone: 0.85, pat: 'glass' }); continue; }
        for (let k = 0; k < c; k++) {
          const xx = -fw / 2 + fw * (k + 0.5) / c;
          const lit = rand() < 0.2;
          put(new T.BoxGeometry(fw / c * 0.55, fl * 0.5, 0.12), M([0, 0, 0], [0, rot, 0]).multiply(M([xx, f * fl + fl * 0.5, Math.abs(face) + 0.02])), { tone: lit ? 0.1 : 0.88, pat: 'glass' });
        }
      }
    }
    // 屋上の物：給水塔、手すり、アンテナ
    put(new T.BoxGeometry(w + 0.3, 0.6, d + 0.3), M([0, h + 0.3, 0]), { tone: 0.2 });
    if (rand() < 0.6) { put(new T.CylinderGeometry(1, 1, 2.2, 12), M([rr(-w / 4, w / 4), h + 2.5, rr(-d / 4, d / 4)]), { tone: 0.3, pat: 'metal' }); }
    if (rand() < 0.5) put(new T.CylinderGeometry(0.05, 0.05, 6, 4), M([rr(-w / 3, w / 3), h + 3, rr(-d / 3, d / 3)]), { tone: 0.8, pat: 'metal' });
  }

  // ---------- 部屋 ----------
  function room(B, o = {}) {
    const W = o.w ?? 7, D = o.d ?? 8, H = o.h ?? 2.8, id = B.newId();
    // 床（板）
    for (let x = -W / 2; x < W / 2; x += 0.3) B.add(new T.BoxGeometry(0.29, 0.05, D), M([x + 0.15, -0.025, -D / 2 + 1.5]), { tone: rr(0.15, 0.3), pat: 'wood', id });
    // 壁（窓つき）
    const wallBox = (w, h, d, p) => B.add(new T.BoxGeometry(w, h, d), M(p), { tone: 0.06, id });
    wallBox(W, H, 0.2, [0, H / 2, -D + 1.5]);
    // 左の壁に窓（光が差す）
    const zw = -D / 2 + 1.5;
    wallBox(0.2, 0.9, D, [-W / 2, 0.45, zw]); wallBox(0.2, 0.5, D, [-W / 2, H - 0.25, zw]);
    wallBox(0.2, H, D / 2 - 1.2, [-W / 2, H / 2, zw - D / 4 - 0.6]); wallBox(0.2, H, D / 2 - 1.2, [-W / 2, H / 2, zw + D / 4 + 0.6]);
    B.add(new T.BoxGeometry(0.08, 1.4, 0.08), M([-W / 2, 1.6, zw]), { tone: 0.5, pat: 'wood', id });
    wallBox(0.2, H, D, [W / 2, H / 2, zw]);
    // 家具：机・いす・本棚・ベッド
    const fid = B.newId();
    B.add(new T.BoxGeometry(1.6, 0.06, 0.8), M([1.2, 0.74, -2.5]), { tone: 0.35, pat: 'wood', id: fid });
    for (const [a, b] of [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]]) B.add(new T.BoxGeometry(0.06, 0.72, 0.06), M([1.2 + a, 0.36, -2.5 + b]), { tone: 0.5, pat: 'wood', id: fid });
    const cid = B.newId();
    B.add(new T.BoxGeometry(0.45, 0.05, 0.45), M([1.1, 0.45, -1.9]), { tone: 0.35, pat: 'wood', id: cid }); B.add(new T.BoxGeometry(0.45, 0.5, 0.05), M([1.1, 0.72, -1.68]), { tone: 0.35, pat: 'wood', id: cid });
    for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) B.add(new T.BoxGeometry(0.04, 0.45, 0.04), M([1.1 + a, 0.22, -1.9 + b]), { tone: 0.5, id: cid });
    const bid = B.newId();
    B.add(new T.BoxGeometry(1.0, 2.0, 0.35), M([W / 2 - 0.3, 1.0, -4]), { tone: 0.4, pat: 'wood', id: bid });
    for (let s = 0; s < 5; s++) for (let k = 0; k < 9; k++) B.add(new T.BoxGeometry(0.08, rr(0.22, 0.3), 0.25), M([W / 2 - 0.42 - 0.02, 0.2 + s * 0.38 + 0.12, -4.4 + k * 0.1], [0, PI / 2, rr(-0.08, 0.08)]), { tone: rr(0.2, 0.8), id: bid });
    const bedId = B.newId();
    B.add(new T.BoxGeometry(1.4, 0.45, 2.1), M([-W / 2 + 1.0, 0.22, -4.2]), { tone: 0.3, pat: 'wood', id: bedId });
    const cloth = new T.BoxGeometry(1.45, 0.25, 1.6, 6, 2, 8); displace(cloth, v => V3(0, noise3(v.x * 3, 0, v.z * 3) * 0.06, 0));
    B.add(cloth, M([-W / 2 + 1.0, 0.55, -3.9]), { tone: 0.05, pat: 'cloth', id: bedId });
  }

  // ---------- 洞窟 ----------
  function cave(B, o = {}) {
    const L = o.len ?? 40, id = B.newId();
    const g = new T.CylinderGeometry(6, 6, L, 28, 40, true); g.rotateX(PI / 2);
    const s0 = rr(0, 50);
    displace(g, v => { const n = fbm3(v.x * 0.25 + s0, v.y * 0.25, v.z * 0.12, 4); const k = 1 + n * 0.55; const out = V3(v.x * k * 1.3, Math.max(v.y * k, -2.2 + n * 0.5), v.z); return out.sub(v); }, false);
    g.computeVertexNormals();
    B.add(g, M([0, 2, -L / 2 + 4]), { tone: 0.35, pat: 'stone', id, flat: true, double: true });
    for (let i = 0; i < 40; i++) { // 鍾乳石
      const h = rr(0.6, 2.6), up = rand() < 0.35;
      const c = new T.ConeGeometry(rr(0.12, 0.4), h, 6, 3); const s1 = rr(0, 9); displace(c, v => V3(noise3(v.y * 2 + s1, 0, 0) * 0.08, 0, noise3(0, v.y * 2 + s1, 0) * 0.08), false);
      const x = rr(-5, 5), z = rr(-L + 6, 2);
      B.add(c, M([x, up ? -0.1 + h / 2 : 6.5 - h / 2 + rr(-0.5, 0.5), z], [up ? 0 : PI, 0, 0]), { tone: 0.3, pat: 'stone', flat: true });
    }
    for (let i = 0; i < 18; i++) B.add(rock(rr(0.3, 1.2)), M([rr(-6, 6), 0, rr(-L + 6, 2)], [0, rr(0, 6), 0]), { tone: 0.3, pat: 'stone', flat: true });
  }

  // ---------- 骨（荒野に散らばる） ----------
  function bones(B, o) {
    const [cx, cy, cz] = o.pos, n = o.n ?? 6, id = B.newId();
    for (let i = 0; i < n; i++) {
      const a = rand() * PI * 2, d = rr(0, o.r ?? 3), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      const k = rand();
      if (k < 0.5 && M3.Actors) M3.Actors.longBone(B, [x, cy + 0.06, z], rr(0.3, 0.6), rr(0, 6), id);
      else if (k < 0.75 && M3.Actors) M3.Actors.skull(B, [x, cy + 0.1, z], rr(0.12, 0.16), [rr(-0.5, 0.5), rr(0, 6), rr(-0.8, 0.8)], id);
      else if (M3.Actors) M3.Actors.ribs(B, [x, cy, z], rr(0.3, 0.45), rr(0, 6), id);
    }
  }
  // 地面に突き立った剣・槍（戦場の名残）
  function graveyardWeapons(B, o) {
    const [cx, cy, cz] = o.pos, n = o.n ?? 6;
    for (let i = 0; i < n; i++) {
      const a = rand() * PI * 2, d = rr(1, o.r ?? 6), p = [cx + Math.cos(a) * d, cy, cz + Math.sin(a) * d];
      const tilt = [rr(-0.35, 0.35), rr(0, 6), rr(-0.35, 0.35)];
      if (!M3.Actors) return;
      if (rand() < 0.5) M3.Actors.sword(B, M([p[0], p[1] - 0.35, p[2]], tilt).multiply(M([0, 0, 0], [PI, 0, 0])), { len: rr(0.9, 1.2) });
      else M3.Actors.spear(B, M([p[0], p[1] - 0.4, p[2]], tilt), { len: rr(2, 2.8), broken: rand() < 0.5 });
    }
  }

  // ---------- カメラ ----------
  // o: { angle: 'low'|'eye'|'high'|'bird'|'worm', lens: 'tele'|'normal'|'wide'|'ultra'|fov(deg), yaw(deg), dist, target:[x,y,z], height, roll(deg) }
  function camera(o = {}, art = {}, aspect = 1.5) {
    const p = art.perspective ?? 0.45;
    const LENS = { tele: 16, long: 22, normal: 38, wide: 62, ultra: 88 };
    let fovH = typeof o.lens === 'number' ? o.lens : LENS[o.lens] ?? lerp(30, 70, p);
    const fov = 2 * Math.atan(Math.tan(fovH * PI / 360) / Math.max(0.6, aspect) * 1.0) * 180 / PI; // 横の画角 → 縦
    const tgt = V3(...(o.target || [0, 1.4, 0]));
    const subj = o.subject ?? 2.2;
    const SHOT = { long: 3.2, full: 1.25, knee: 0.9, bust: 0.55, up: 0.3 };
    const fill = SHOT[o.shot] ?? 1.6;
    let dist = o.dist ?? subj * fill / (2 * Math.tan(fov * PI / 360));
    const ANG = { worm: -38, low: -18, eye: 2, high: 28, bird: 62, top: 89.5 };
    let elev = (typeof o.angle === 'number' ? o.angle : ANG[o.angle] ?? lerp(4, -14, Math.max(0, p - 0.5) * 2)) * PI / 180;
    const yaw = (o.yaw ?? 0) * PI / 180;
    const cam = new T.PerspectiveCamera(fov, aspect, 0.1, 1500);
    const pos = V3(tgt.x + Math.sin(yaw) * Math.cos(elev) * dist, tgt.y + Math.sin(elev) * dist, tgt.z + Math.cos(yaw) * Math.cos(elev) * dist);
    if (o.height != null) pos.y = o.height;
    pos.y = Math.max(pos.y, (o.minY ?? 0.5));
    cam.position.copy(pos);
    if (Math.abs(elev) > 1.4) cam.up.set(-Math.sin(yaw), 0, -Math.cos(yaw));   // 真上から：画面の上＝奥
    cam.lookAt(tgt);
    if (o.roll) cam.rotateZ(o.roll * PI / 180);
    if (o.shift) { cam.setViewOffset(1000, 1000 / aspect, 0, -o.shift * 1000 / aspect, 1000, 1000 / aspect); }
    cam.updateMatrixWorld();
    return cam;
  }

  // ---------- 場面 ----------
  // env: { time, weather, art, B, actors } → 返り値：{ sky, moon, light, fog, mist, rain, cam(既定のカメラ), bounds, floorY }
  const SCENES = {
    // 嵐の夜の城壁の上（歩廊に立つ）
    rampart(B, env) {
      const H = 7.5, t = 4.2;
      // 足もとの城壁（手前から奥へ続く）
      wall(B, { x0: -40, x1: 40, z: 0, h: H, t, y0: -H, ang: 0, ox: 0, oz: 0, broken: [{ x: 9, w: 6, d: 4 }, { x: -22, w: 8, d: 6 }], merlonSides: [-1], walk: true });
      const W2 = wall(B, { x0: -6, x1: 30, z: 0, h: H + 2, t: 3, y0: -H, ang: -PI / 2 + 0.25, ox: -10, oz: -38, broken: [{ x: 12, w: 8, d: 7 }], merlonSides: [1, -1] });
      tower(B, { pos: [-14, -H, -14], r: 4.2, h: 22, broken: 7 });
      tower(B, { pos: [26, -H, -60], r: 5, h: 26, broken: 10 });
      // 城の下の荒れ地
      const hgt = terrain({ amp: 10, flat: 25, base: -H - 0.5, scale: 0.02 });
      ground(B, { size: 900, seg: 160, height: hgt, tone: 0.2 });
      mountains(B, { n: 9, r: 320, hk: 1.4 });
      for (let i = 0; i < 6; i++) { const x = rr(-80, 80), z = rr(-160, -50); tree(B, { pos: [x, hgt(x, z), z], h: rr(6, 10), depth: 2 }); }
      for (let i = 0; i < 4; i++) { const x = rr(-60, 60), z = rr(-140, -60); spire(B, { pos: [x, hgt(x, z), z], h: rr(14, 30), r: rr(2, 4) }); }
      rubble(B, { pos: [9, 0, 0.5], r: 2.6, n: 22, heap: 0.3 });
      rubble(B, { pos: [-6, 0, -0.5], r: 1.4, n: 7, heap: 0.1, size: 0.7 });
      return { floorY: 0.0, sky: 'storm', moon: true, light: { dir: [0.55, 0.65, -0.55] }, fog: { near: 30, far: 260 }, bounds: { c: [0, 0, -6], r: 34 }, cam: { target: [0, 1.6, 0], yaw: 18, angle: 'low' } };
    },
    // 廃墟（崩れた壁とアーチ）
    ruins(B, env) {
      const hgt = terrain({ amp: 3, flat: 18 }); ground(B, { size: 600, height: hgt });
      wall(B, { x0: -14, x1: 4, z: -9, h: 6, t: 1.6, broken: [{ x: -3, w: 7, d: 5 }, { x: -11, w: 4, d: 4 }], merlons: false, walk: false });
      wall(B, { x0: -6, x1: 10, z: 0, h: 5, t: 1.4, ang: PI / 2, ox: 9, oz: -4, broken: [{ x: 2, w: 6, d: 4.5 }], merlons: false, walk: false });
      tower(B, { pos: [-18, 0, -26], r: 4, h: 20, broken: 9 });
      for (let i = 0; i < 4; i++) column(B, [-12 + i * 4, 0, -16], rr(2.5, 7));
      rubble(B, { pos: [-3, 0, -7], r: 4, n: 40 }); rubble(B, { pos: [8, 0, 1], r: 3, n: 20 });
      mountains(B, {});
      for (let i = 0; i < 4; i++) { const x = rr(-60, 60), z = rr(-120, -40); tree(B, { pos: [x, hgt(x, z), z], h: rr(6, 9), depth: 2 }); }
      return { sky: env.time === 'night' ? 'night' : 'storm', moon: env.time === 'night', light: { dir: [-0.5, 0.6, 0.5] }, bounds: { c: [0, 0, -8], r: 32 }, cam: { target: [0, 1.4, 0] } };
    },
    tower(B, env) {
      const hgt = terrain({ amp: 4, flat: 20 }); ground(B, { size: 600, height: hgt });
      tower(B, { pos: [0, 0, -14], r: 5.5, h: 30, broken: 9 });
      rubble(B, { pos: [5, 0, -6], r: 5, n: 45 });
      crag(B, { pos: [-14, 0, -12], size: 6, n: 7 });
      mountains(B, {});
      return { sky: 'storm', moon: env.time === 'night', light: { dir: [0.6, 0.5, 0.4] }, bounds: { c: [0, 8, -10], r: 30 }, cam: { target: [0, 1.6, 0], angle: 'low', lens: 'wide' } };
    },
    rocks(B, env) {
      const hgt = terrain({ amp: 8, flat: 10, scale: 0.03 }); ground(B, { size: 600, height: hgt, pat: 'ground', tone: 0.18 });
      crag(B, { pos: [-9, 0, -8], size: 6, n: 10 }); crag(B, { pos: [10, 0, -14], size: 8, n: 10 }); crag(B, { pos: [2, 0, -30], size: 12, n: 12 });
      for (let i = 0; i < 25; i++) { const x = rr(-20, 20), z = rr(-25, 4); if (Math.hypot(x, z) < 3) continue; B.add(rock(rr(0.2, 0.9)), M([x, hgt(x, z), z], [0, rr(0, 6), 0]), { tone: 0.3, pat: 'stone', flat: true }); }
      spire(B, { pos: [-22, 0, -40], h: 26, r: 4 }); spire(B, { pos: [24, 0, -50], h: 34, r: 5 });
      mountains(B, { hk: 1.5 });
      return { sky: env.time === 'night' ? 'night' : 'day', light: { dir: [-0.6, 0.55, 0.4] }, bounds: { c: [0, 2, -10], r: 30 }, cam: { target: [0, 1.4, 0] } };
    },
    wasteland(B, env) {
      const hgt = terrain({ amp: 5, flat: 16, scale: 0.015 }); ground(B, { size: 900, height: hgt, tone: 0.1 });
      for (let i = 0; i < 5; i++) { const x = rr(-40, 40), z = rr(-70, -15); tree(B, { pos: [x, hgt(x, z), z], h: rr(5, 9), depth: 3 }); }
      tree(B, { pos: [-7, 0, -6], h: 7.5, depth: 3, twist: 1.3 });
      for (let i = 0; i < 6; i++) { const x = rr(-120, 120), z = rr(-250, -80); spire(B, { pos: [x, hgt(x, z), z], h: rr(15, 40), r: rr(3, 6) }); }
      for (let i = 0; i < 18; i++) { const x = rr(-25, 25), z = rr(-35, 5); if (Math.hypot(x, z) < 2.5) continue; B.add(rock(rr(0.2, 1.1)), M([x, hgt(x, z), z], [0, rr(0, 6), 0]), { tone: 0.25, pat: 'stone', flat: true }); }
      bones(B, { pos: [4, 0, -3], r: 4, n: 8 });
      graveyardWeapons(B, { pos: [-2, 0, -10], r: 9, n: 8 });
      mountains(B, { n: 11, r: 380 });
      return { sky: env.time === 'night' ? 'night' : env.time === 'evening' ? 'dusk' : 'day', moon: env.time === 'night', light: { dir: [-0.7, 0.35, -0.3] }, bounds: { c: [0, 0, -10], r: 36 }, cam: { target: [0, 1.4, 0] } };
    },
    forest(B, env) {
      const hgt = terrain({ amp: 3, flat: 10 }); ground(B, { size: 400, height: hgt, tone: 0.2 });
      for (let i = 0; i < 26; i++) { const x = rr(-28, 28), z = rr(-60, -2); if (Math.abs(x) < 2.5 && z > -10) continue; tree(B, { pos: [x, hgt(x, z), z], h: rr(9, 15), depth: 3, twist: rr(0.9, 1.6), tone: rr(0.3, 0.5) }); }
      tree(B, { pos: [-4.5, 0, -2], h: 12, depth: 3, twist: 1.6 }); tree(B, { pos: [5, 0, -3.5], h: 14, depth: 3, twist: 1.4 });
      for (let i = 0; i < 10; i++) B.add(rock(rr(0.3, 1)), M([rr(-12, 12), 0, rr(-20, 2)], [0, rr(0, 6), 0]), { tone: 0.35, pat: 'stone', flat: true });
      return { sky: 'storm', moon: env.time === 'night', light: { dir: [0.3, 0.7, -0.6] }, fog: { near: 8, far: 60, tone: 0 }, mist: { amount: 0.5, falloff: 0.3 }, bounds: { c: [0, 4, -14], r: 30 }, cam: { target: [0, 1.5, 0] } };
    },
    cave(B, env) {
      cave(B, {});
      return { sky: 'white', lightMode: 'fixed', light: { dir: [0.2, 0.35, 0.9], ambient: 0.12 }, fog: { near: 8, far: 34, tone: 1 }, bounds: { c: [0, 2, -12], r: 26 }, cam: { target: [0, 1.4, 0] } };
    },
    town(B, env) {
      const id = B.newId();
      for (let z = 6; z > -70; z -= 7) for (const s of [-1, 1]) house(B, { pos: [s * rr(6.8, 7.4), 0, z], w: rr(5.5, 7), d: 6.4, h1: rr(2.8, 3.4), h2: rr(2.6, 3.4), ang: s > 0 ? -PI / 2 : PI / 2 });
      // 石畳
      const g = new T.PlaneGeometry(12, 90); g.rotateX(-PI / 2); B.add(g, M([0, 0.03, -30]), { tone: 0.12, pat: 'cobble', id });
      ground(B, { size: 600, seg: 60, tone: 0.15 });
      tower(B, { pos: [4, 0, -95], r: 4, h: 34, broken: 0, slits: [0, 1.5, 3, 4.5], corbel: true });
      return { sky: env.time === 'night' ? 'night' : 'day', moon: env.time === 'night', light: { high: 2.0, front: 0.5 }, bounds: { c: [0, 3, -16], r: 32 }, cam: { target: [0, 1.5, 0], lens: 'wide' } };
    },
    city(B, env) {
      const id = B.newId();
      for (let z = 0; z > -160; z -= rr(14, 20)) for (const s of [-1, 1]) building(B, { pos: [s * rr(14, 16), 0, z], w: 12, d: rr(11, 16), h: rr(15, 70) });
      const g = new T.PlaneGeometry(14, 200); g.rotateX(-PI / 2); B.add(g, M([0, 0.03, -70]), { tone: 0.18, pat: 'plain', id });
      for (const s of [-1, 1]) B.add(new T.BoxGeometry(4, 0.18, 200), M([s * 8.5, 0.09, -70]), { tone: 0.08, pat: 'cobble', id: B.newId() });
      for (let z = 4; z > -150; z -= 18) for (const s of [-1, 1]) { B.add(new T.CylinderGeometry(0.08, 0.1, 7, 6), M([s * 7, 3.5, z]), { tone: 0.6, pat: 'metal' }); B.add(new T.BoxGeometry(1.6, 0.12, 0.3), M([s * 6.3, 7, z]), { tone: 0.6, pat: 'metal' }); }
      for (let z = 4; z > -150; z -= 1.6) B.add(new T.BoxGeometry(0.15, 0.01, 0.8), M([0, 0.04, z]), { tone: 0.0, noLine: true });
      ground(B, { size: 800, seg: 40, tone: 0.2 });
      return { sky: env.time === 'night' ? 'night' : 'day', light: { high: 2.4, front: 0.6 }, bounds: { c: [0, 10, -30], r: 45 }, cam: { target: [0, 1.5, 0], lens: 'wide' } };
    },
    room(B, env) {
      room(B, {});
      return { sky: 'white', lightMode: 'fixed', light: { dir: [-0.9, 0.5, 0.15], ambient: 0.45, strength: 0.6 }, fog: { near: 50, far: 200 }, bounds: { c: [0, 1.5, -2.5], r: 8 }, cam: { target: [0, 1.2, 0], lens: 'wide' } };
    },
    sky(B, env) {
      return { sky: env.time === 'night' ? 'night' : 'storm', moon: env.time === 'night', light: { dir: [0, 1, 0] }, bounds: { c: [0, 0, 0], r: 10 }, cam: { target: [0, 6, 0], angle: 'worm', lens: 'wide' } };
    },
    plain(B, env) {
      ground(B, { size: 600, seg: 40, tone: 0.05 });
      return { sky: 'white', light: { dir: [-0.5, 0.8, 0.4] }, bounds: { c: [0, 1, 0], r: 12 }, cam: { target: [0, 1.4, 0] } };
    },
  };
  function column(B, p, h) {
    const id = B.newId();
    const n = Math.ceil(h / 0.8);
    for (let i = 0; i < n; i++) { const g = new T.CylinderGeometry(0.55, 0.58, 0.78, 14, 1); B.add(g, M([p[0] + rr(-0.04, 0.04), p[1] + i * 0.8 + 0.39, p[2]], [0, rr(0, 6), rr(-0.03, 0.03)]), { tone: rr(0.1, 0.25), pat: 'stone', id }); }
    B.add(stone(1.5, 0.4, 1.5), M([p[0], p[1] + 0.2, p[2]]), { tone: 0.2, pat: 'stone', id });
  }
  const ALIAS = {
    castle: 'rampart', wall: 'rampart', rampart: 'rampart', battlement: 'rampart', 城壁: 'rampart', ruins: 'ruins', ruin: 'ruins', 廃墟: 'ruins', tower: 'tower', 塔: 'tower',
    rocks: 'rocks', mountain: 'rocks', cliff: 'rocks', 岩場: 'rocks', wasteland: 'wasteland', desert: 'wasteland', field: 'wasteland', 荒野: 'wasteland', battlefield: 'wasteland',
    forest: 'forest', woods: 'forest', 森: 'forest', cave: 'cave', dungeon: 'cave', 洞窟: 'cave', town: 'town', edo: 'town', village: 'town', medieval: 'town', 町: 'town',
    city: 'city', street: 'city', shopping: 'city', station: 'city', 街: 'city', room: 'room', classroom: 'room', office: 'room', home: 'room', 部屋: 'room', sky: 'sky', space: 'sky', 空: 'sky', plain: 'plain', white: 'plain',
  };

  const box = (w, h, d, sg = 1) => new T.BoxGeometry(w, h, d, sg, sg, sg);
  Object.assign(M3, { Kit: { terrain, ground, mountains, wall, rubble, tower, crag, spire, tree, house, building, room, cave, bones, graveyardWeapons, column }, SCENES, SCENE_ALIAS: ALIAS, camera });

  // ---------- コンクリートの廃墟：床板・柱・壁（窓の穴）・露出した鉄筋・瓦礫 ----------
  // 縁がぎざぎざの板（多角形を押し出す）
  function jaggedSlab(w, d, t, o = {}) {
    const sh = new T.Shape(); const n = 28, pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * PI * 2, cx = Math.cos(a), cz = Math.sin(a);
      let r = 1 / Math.max(Math.abs(cx) / (w / 2), Math.abs(cz) / (d / 2));
      const broken = o.broken && Math.cos(a - (o.breakDir ?? 0)) > 0.35;
      if (broken) r *= rr(0.35, 0.85);
      else r *= rr(0.95, 1.0);
      pts.push([cx * r, cz * r]);
    }
    sh.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) sh.lineTo(q[0], q[1]);
    const g = new T.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 1 }); g.rotateX(PI / 2); g.translate(0, t / 2, 0);
    g.userData.edge = pts.filter((_, i) => o.broken && Math.cos(i / n * PI * 2 - (o.breakDir ?? 0)) > 0.35);
    return g;
  }
  // 鉄筋：折れ口から突き出して曲がる細い棒
  function rebar(B, p, dir, n = 5, len = 1.2, id) {
    const d0 = V3(...dir).normalize(), side = V3().crossVectors(d0, V3(0, 1, 0)).normalize();
    for (let i = 0; i < n; i++) {
      const o = V3(...p).addScaledVector(side, (i - (n - 1) / 2) * 0.18).add(V3(0, rr(-0.05, 0.05), 0));
      const L = len * rr(0.4, 1.2), bend = V3(rr(-0.4, 0.4), rr(-0.8, 0.2), rr(-0.4, 0.4));
      const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(o.clone().addScaledVector(d0, L * t).addScaledVector(bend, t * t * L).toArray()); }
      B.add(tube(pts, 0.03, 5), null, { tone: 0.97, pat: 'plain', id });
    }
  }
  function concreteRuin(B, o) {
    const [x, y, z] = o.pos, w = o.w ?? 12, d = o.d ?? 10, fl = o.floors ?? 4, fh = o.fh ?? 3.3, id = o.id ?? B.newId();
    const ang = o.ang ?? 0, base = M([x, y, z], [0, ang, 0]);
    const put = (g, m, op = {}) => B.add(g, base.clone().multiply(m), Object.assign({ tone: 0.12, pat: 'concrete', id }, op));
    const breakDir = rr(0, PI * 2);
    const keep = (k) => k < fl - Math.floor(rand() * 2);  // 上の階ほど欠ける
    for (let k = 1; k <= fl; k++) {
      if (!keep(k) && k > 1) continue;
      const broken = k >= fl - 1 || rand() < 0.4;
      const slab = jaggedSlab(w, d, 0.3, { broken, breakDir });
      const tilt = broken && k === fl ? [rr(-0.15, 0.15), 0, rr(-0.15, 0.15)] : [0, 0, 0];
      put(slab, M([0, k * fh, 0], tilt));
      if (broken) for (const e of slab.userData.edge.filter((_, i) => i % 3 === 0)) {
        const pW = V3(e[0], k * fh + 0.15, -e[1]).applyMatrix4(base);
        rebar(B, pW.toArray(), V3(e[0], 0, -e[1]).normalize().transformDirection(base).toArray(), 4, rr(0.6, 1.4), id);
      }
    }
    // 柱：格子に。上が折れた柱もある
    const cx = Math.max(2, Math.round(w / 4)), cz = Math.max(2, Math.round(d / 4));
    for (let i = 0; i <= cx; i++) for (let j = 0; j <= cz; j++) {
      const h = fh * fl * (rand() < 0.25 ? rr(0.3, 0.8) : 1);
      const px = -w / 2 + w * i / cx, pz = -d / 2 + d * j / cz;
      put(box(0.5, h, 0.5, 1), M([px, h / 2, pz], [rr(-0.02, 0.02), 0, rr(-0.03, 0.03)]), { tone: 0.15 });
      if (h < fh * fl) rebar(B, V3(px, h, pz).applyMatrix4(base).toArray(), [0, 1, 0], 4, 0.9, id);
    }
    // 外壁：窓の穴のあいたパネル（ところどころ抜け落ちる）
    for (const side of [-1, 1]) for (let k = 0; k < fl; k++) for (let i = 0; i < Math.round(w / 2.4); i++) {
      if (rand() < 0.3) continue;
      const px = -w / 2 + (i + 0.5) * w / Math.round(w / 2.4);
      put(box(2.3, 0.9, 0.22), M([px, k * fh + 0.45 + 0.3, side * d / 2]), { tone: 0.1 });
      put(box(2.3, 0.6, 0.22), M([px, k * fh + fh - 0.0, side * d / 2]), { tone: 0.1 });
      put(box(0.35, fh - 1.2, 0.22), M([px - 1.0, k * fh + fh / 2 + 0.3, side * d / 2]), { tone: 0.1 });
    }
    rubbleHeap(B, { pos: [x + Math.cos(breakDir) * w * 0.5, y, z - Math.sin(breakDir) * d * 0.5], r: Math.max(w, d) * 0.5, n: 60 });
  }
  // 瓦礫の塊：コンクリ片（不規則な多角形）を山に。鉄筋も少し
  function rubbleHeap(B, o) {
    const [cx, cy, cz] = o.pos, r = o.r ?? 4, n = o.n ?? 50, id = o.id ?? B.newId();
    for (let i = 0; i < n; i++) {
      const a = rand() * PI * 2, dd = Math.sqrt(rand()) * r, h = (1 - dd / r) * r * 0.35;
      const s = rr(0.2, 1.1) * (o.size ?? 1);
      const g = rand() < 0.5 ? rock(s, { detail: 0, rough: 0.55, squash: rr(0.4, 0.9), cut: 0.6 }) : stone(s * rr(1, 2.2), s * rr(0.25, 0.5), s * rr(0.8, 1.5), { amp: s * 0.2, seg: 1 });
      B.add(g, M([cx + Math.cos(a) * dd, cy + h * rr(0.3, 1), cz + Math.sin(a) * dd], [rr(-0.7, 0.7), rr(0, 6), rr(-0.7, 0.7)]), { tone: rr(0.08, 0.4), pat: 'concrete', flat: true, id });
      if (rand() < 0.12) rebar(B, [cx + Math.cos(a) * dd, cy + h + 0.1, cz + Math.sin(a) * dd], [rr(-1, 1), rr(0.2, 1), rr(-1, 1)], 2, rr(0.5, 1.2), id);
    }
  }

  // ---------- 機械キット：パイプ・フランジ・配線・タンク・パネルとボルト・鉄骨 ----------
  function pipe(B, pts, r = 0.25, o = {}) {
    const id = o.id ?? B.newId();
    // 角を丸めた折れ線
    const P = pts.map(p => V3(...p)), path = [];
    for (let i = 0; i < P.length; i++) {
      if (i === 0 || i === P.length - 1) { path.push(P[i]); continue; }
      const a = P[i].clone().lerp(P[i - 1], Math.min(0.5, r * 2.5 / P[i].distanceTo(P[i - 1]))), b = P[i].clone().lerp(P[i + 1], Math.min(0.5, r * 2.5 / P[i].distanceTo(P[i + 1])));
      for (let k = 0; k <= 4; k++) { const t = k / 4; path.push(a.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(P[i], 2 * t * (1 - t)).addScaledVector(b, t * t)); }
    }
    const dense = []; for (let i = 0; i < path.length - 1; i++) { const L = path[i].distanceTo(path[i + 1]), m = Math.max(1, Math.ceil(L / 1.0)); for (let k = 0; k < m; k++) dense.push(path[i].clone().lerp(path[i + 1], k / m)); } dense.push(path[path.length - 1]);
    B.add(tube(dense.map(v => v.toArray()), r, 14), null, { tone: o.tone ?? 0.2, pat: 'machine', id });
    // フランジ（継ぎ目の輪）とボルト
    let acc = 0;
    for (let i = 1; i < dense.length; i++) {
      acc += dense[i].distanceTo(dense[i - 1]);
      if (acc > (o.flangeEvery ?? 3)) {
        acc = 0; const dir = dense[i].clone().sub(dense[i - 1]).normalize();
        const m = new T.Matrix4().compose(dense[i], new T.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir), V3(1, 1, 1));
        B.add(new T.CylinderGeometry(r * 1.35, r * 1.35, r * 0.35, 16), m, { tone: 0.3, pat: 'machine', id });
        for (let b = 0; b < 8; b++) { const a = b / 8 * PI * 2; B.add(new T.CylinderGeometry(r * 0.08, r * 0.08, r * 0.45, 6), m.clone().multiply(M([Math.cos(a) * r * 1.18, 0, Math.sin(a) * r * 1.18])), { tone: 0.6, pat: 'machine', id }); }
      }
    }
  }
  // 配線：たるんだ束（懸垂線）
  function cables(B, a, b, n = 5, sag = 1.5, o = {}) {
    const id = o.id ?? B.newId();
    for (let i = 0; i < n; i++) {
      const off = V3(rr(-0.25, 0.25), rr(-0.15, 0.15), rr(-0.25, 0.25)), sg = sag * rr(0.8, 1.3), pts = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16; const p = V3(...a).lerp(V3(...b), t).add(off); p.y -= sg * 4 * t * (1 - t); pts.push(p.toArray()); }
      B.add(tube(pts, o.r ?? rr(0.02, 0.05), 5), null, { tone: 0.95, pat: 'plain', id });
    }
  }
  function tank(B, p, r = 2.5, h = 6, o = {}) {
    const id = o.id ?? B.newId();
    B.add(new T.CylinderGeometry(r, r, h, 28), M([p[0], p[1] + h / 2, p[2]]), { tone: 0.15, pat: 'machine', id });
    B.add(new T.SphereGeometry(r, 28, 10, 0, PI * 2, 0, PI / 2), M([p[0], p[1] + h, p[2]], [0, 0, 0], [1, 0.35, 1]), { tone: 0.15, pat: 'machine', id });
    for (let k = 1; k < 4; k++) B.add(new T.TorusGeometry(r * 1.01, 0.05, 6, 32), M([p[0], p[1] + h * k / 4, p[2]], [PI / 2, 0, 0]), { tone: 0.5, pat: 'machine', id });
    // はしご
    const a = o.ladder ?? 0.5; const lx = p[0] + Math.cos(a) * (r + 0.25), lz = p[2] + Math.sin(a) * (r + 0.25);
    for (const s of [-0.22, 0.22]) B.add(box(0.05, h, 0.05), M([lx - Math.sin(a) * s, p[1] + h / 2, lz + Math.cos(a) * s]), { tone: 0.6, pat: 'machine', id });
    for (let y = 0.3; y < h; y += 0.35) B.add(box(0.03, 0.03, 0.44), M([lx, p[1] + y, lz], [0, -a, 0]), { tone: 0.6, pat: 'machine', id });
  }
  function panel(B, p, w = 2, h = 1.5, rot = 0, o = {}) {
    const id = o.id ?? B.newId(), m = M(p, [0, rot, 0]);
    B.add(box(w, h, 0.12), m, { tone: 0.18, pat: 'machine', id });
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) B.add(new T.CylinderGeometry(0.03, 0.03, 0.05, 6), m.clone().multiply(M([(i - 0.5) * (w - 0.15), (j - 0.5) * (h - 0.15), 0.08], [PI / 2, 0, 0])), { tone: 0.7, pat: 'machine', id });
    for (let k = 0; k < 6; k++) B.add(box(w * 0.1, 0.03, 0.03), m.clone().multiply(M([w * 0.3, -h * 0.3 + k * 0.08, 0.08])), { tone: 0.9, pat: 'plain', id });
  }
  function truss(B, a, b, o = {}) {   // 鉄骨の梁（ラチス）
    const id = o.id ?? B.newId(), A = V3(...a), Bv = V3(...b), L = A.distanceTo(Bv), dir = Bv.clone().sub(A).normalize();
    const side = V3().crossVectors(dir, Math.abs(dir.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).normalize().multiplyScalar(0.3), upv = V3().crossVectors(side, dir).normalize().multiplyScalar(0.3);
    const rail = (o2) => B.add(box(1, 1, 1).translate(0, 0.5, 0), Mab(A.clone().add(o2).toArray(), Bv.clone().add(o2).toArray(), [0.06, 0.06]), { tone: 0.5, pat: 'machine', id });
    for (const s of [-1, 1]) for (const u of [-1, 1]) rail(side.clone().multiplyScalar(s).addScaledVector(upv, u));
    const n = Math.round(L / 0.8);
    for (let i = 0; i < n; i++) { const p0 = A.clone().addScaledVector(dir, L * i / n), p1 = A.clone().addScaledVector(dir, L * (i + 1) / n);
      for (const s of [-1, 1]) B.add(box(1, 1, 1).translate(0, 0.5, 0), Mab(p0.clone().add(side.clone().multiplyScalar(s)).sub(upv).toArray(), p1.clone().add(side.clone().multiplyScalar(s)).add(upv).toArray(), [0.035, 0.035]), { tone: 0.5, pat: 'machine', id }); }
  }

  // ---------- 密な高層ビル（窓の格子はシェーダで） ----------
  function tower2(B, o) {
    const [x, y, z] = o.pos, w = o.w ?? 14, d = o.d ?? 14, h = o.h ?? 80, id = o.id ?? B.newId();
    B.add(box(w, h, d), M([x, y + h / 2, z]), { tone: o.tone ?? rr(0.0, 0.2), pat: 'windows', id });
    // 段々の屋上、アンテナ、看板
    let hh = h, ww = w * rr(0.6, 0.8), dd = d * rr(0.6, 0.8);
    for (let k = 0; k < (rand() < 0.6 ? 2 : 1); k++) { const sh = rr(4, 12); B.add(box(ww, sh, dd), M([x, y + hh + sh / 2, z]), { tone: 0.2, pat: 'windows', id }); hh += sh; ww *= 0.65; dd *= 0.65; }
    if (rand() < 0.6) B.add(box(0.15, rr(6, 18), 0.15), M([x + rr(-1, 1), y + hh + 6, z]), { tone: 0.9, pat: 'machine', id });
    // 外壁の縦の柱（ピラスター）
    for (const s of [-1, 1]) for (let i = 0; i <= 3; i++) B.add(box(0.5, h, 0.5), M([x - w / 2 + w * i / 3, y + h / 2, z + s * (d / 2 + 0.2)]), { tone: 0.1, pat: 'concrete', id });
  }

  // ---------- 新しい場面 ----------
  Object.assign(SCENES, {
    // 消失点1つの高層都市（大通り）
    metropolis(B, env) {
      const id = B.newId();
      for (const s of [-1, 1]) { let z = 6; while (z > -420) { const d = rr(16, 30), w = rr(14, 22); tower2(B, { pos: [s * (16 + w / 2 + rr(0, 3)), 0, z - d / 2], w, d, h: rr(50, 160) }); z -= d + rr(1, 6); } }
      for (const s of [-1, 1]) { let z = -40; while (z > -500) { const d = rr(20, 34), w = rr(16, 26); tower2(B, { pos: [s * (50 + w / 2 + rr(0, 20)), 0, z], w, d, h: rr(80, 220) }); z -= d + rr(8, 30); } }
      const road = new T.PlaneGeometry(32, 900); road.rotateX(-PI / 2); B.add(road, M([0, 0.03, -400]), { tone: 0.05, pat: 'road', id });
      for (const s of [-1, 1]) B.add(box(5, 0.25, 900), M([s * 18.5, 0.125, -400]), { tone: 0.05, pat: 'concrete', id: B.newId() });
      for (let z = 2; z > -300; z -= 22) for (const s of [-1, 1]) { B.add(new T.CylinderGeometry(0.1, 0.13, 9, 6), M([s * 16.5, 4.5, z]), { tone: 0.6, pat: 'machine' }); B.add(box(2.6, 0.14, 0.3), M([s * 15.3, 9, z]), { tone: 0.6, pat: 'machine' }); }
      ground(B, { size: 1400, seg: 30, tone: 0.1, pat: 'plain' });
      return { sky: env.time === 'night' ? 'night' : 'day', light: { high: 2.6, front: 0.2 }, fog: { near: 120, far: 600 }, bounds: { c: [0, 30, -60], r: 120 }, cam: { target: [0, 6, -60], lens: 'wide', angle: 'eye', height: 1.7, dist: 62 }, onePoint: true };
    },
    // コンクリートの廃都：崩れたビル、瓦礫の原、鉄筋
    ruined_city(B, env) {
      const hgt = terrain({ amp: 1.5, flat: 30 }); ground(B, { size: 800, height: hgt, tone: 0.12 });
      concreteRuin(B, { pos: [-14, 0, -18], w: 12, d: 10, floors: 5, ang: 0.2 });
      concreteRuin(B, { pos: [16, 0, -30], w: 14, d: 12, floors: 7, ang: -0.3 });
      concreteRuin(B, { pos: [-30, 0, -60], w: 16, d: 14, floors: 9, ang: 0.5 });
      concreteRuin(B, { pos: [30, 0, -80], w: 18, d: 12, floors: 11, ang: 0.1 });
      for (let i = 0; i < 6; i++) concreteRuin(B, { pos: [rr(-90, 90), 0, rr(-220, -110)], w: rr(14, 24), d: rr(12, 20), floors: Math.round(rr(5, 14)), ang: rr(0, 3) });
      rubbleHeap(B, { pos: [4, 0, -6], r: 6, n: 70 }); rubbleHeap(B, { pos: [-5, 0, 4], r: 3, n: 25, size: 0.6 });
      return { sky: env.time === 'night' ? 'night' : 'storm', light: { high: 1.2 }, fog: { near: 40, far: 260 }, bounds: { c: [0, 6, -25], r: 50 }, cam: { target: [0, 2, -6], lens: 'wide', angle: 'low' }, height: hgt };
    },
    // 機械の置き場：パイプ・タンク・配線・鉄骨
    factory(B, env) {
      ground(B, { size: 500, seg: 40, tone: 0.1, pat: 'concrete' });
      tank(B, [-9, 0, -10], 3.2, 9); tank(B, [-2, 0, -16], 2.4, 7, { ladder: 2 }); tank(B, [10, 0, -14], 4, 12, { ladder: 3 });
      pipe(B, [[-14, 1.2, 4], [-14, 1.2, -6], [-6, 1.2, -6], [-6, 6, -6], [12, 6, -6], [12, 6, -12]], 0.45);
      pipe(B, [[-16, 0.6, 2], [16, 0.6, 2], [16, 0.6, -20]], 0.3, { flangeEvery: 2.5 });
      pipe(B, [[-10, 9.5, -10], [-10, 11, -2], [6, 11, -2], [6, 3, 4], [6, 0.4, 4]], 0.35);
      for (let i = 0; i < 4; i++) pipe(B, [[-12 + i * 0.6, 0.3, 8], [-12 + i * 0.6, 0.3, -3], [-12 + i * 0.6, 3 + i * 0.5, -5], [8, 3 + i * 0.5, -5]], 0.12, { flangeEvery: 4, tone: 0.4 });
      truss(B, [-16, 8, 6], [16, 8, 6]); truss(B, [-16, 8, -22], [16, 8, -22]); truss(B, [-16, 8, 6], [-16, 8, -22]);
      for (const x of [-16, 16]) for (const z of [6, -22]) B.add(box(0.5, 8, 0.5), M([x, 4, z]), { tone: 0.4, pat: 'machine' });
      cables(B, [-16, 7.5, 6], [16, 7.5, 6], 6, 2.2); cables(B, [-9, 9, -10], [10, 12, -14], 4, 3); cables(B, [-2, 7, -16], [-16, 7.8, -22], 5, 1.8);
      for (let i = 0; i < 6; i++) panel(B, [rr(-14, 14), 0.8, rr(-4, 6)], rr(1.4, 2.4), rr(1.2, 1.8), rr(0, 6));
      rubbleHeap(B, { pos: [3, 0, 2], r: 3, n: 20, size: 0.5 });
      return { sky: env.time === 'night' ? 'night' : 'day', light: { high: 1.4 }, fog: { near: 60, far: 300 }, bounds: { c: [0, 4, -6], r: 30 }, cam: { target: [0, 3, -4], lens: 'wide' } };
    },
    // 草原・丘（短い筆致で）
    grassland(B, env) {
      const t0 = terrain({ amp: 9, flat: 140, scale: 0.008, base: 0, bump: 0.15 });
      const hill = env.hill ?? 7;   // 手前の小高い丘（見下ろすため）
      const hgt = (x, z) => t0(x, z) + hill * Math.exp(-(x * x + (z - 2) * (z - 2)) / 500) - hill * 0.25 * Math.exp(-((z + 70) * (z + 70)) / 3000);
      ground(B, { size: 1400, seg: 150, height: hgt, tone: 0.1, pat: 'grass' });
      for (let i = 0; i < 5; i++) { const x = rr(-120, 120), z = rr(-300, -80); tree(B, { pos: [x, hgt(x, z), z], h: rr(7, 12), depth: 3, dead: false }); }
      for (let i = 0; i < 12; i++) { const x = rr(-30, 30), z = rr(-40, 5); if (Math.hypot(x, z) < 4) continue; B.add(rock(rr(0.3, 1.2)), M([x, hgt(x, z), z], [0, rr(0, 6), 0]), { tone: 0.25, pat: 'stone', flat: true }); }
      mountains(B, { n: 9, r: 520, hk: 1.6 });
      return { sky: env.time === 'night' ? 'scratch' : 'day', moon: env.time === 'night', light: { high: 0.9 }, fog: { near: 80, far: 600 }, bounds: { c: [0, 0, -20], r: 60 }, cam: { target: [0, 1.6 + hgt(0, 0), 0] }, height: hgt, floorY: hgt(0, 0) };
    },
  });
  Object.assign(ALIAS, { metropolis: 'metropolis', megacity: 'metropolis', skyscrapers: 'metropolis', downtown: 'metropolis', 高層: 'metropolis', 摩天楼: 'metropolis',
    ruined_city: 'ruined_city', ruincity: 'ruined_city', concrete: 'ruined_city', 廃都: 'ruined_city', 廃ビル: 'ruined_city',
    factory: 'factory', machine: 'factory', plant: 'factory', 工場: 'factory', 機械: 'factory', grassland: 'grassland', prairie: 'grassland', 草原: 'grassland', 丘: 'grassland' });
  Object.assign(M3.Kit, { jaggedSlab, rebar, concreteRuin, rubbleHeap, pipe, cables, tank, panel, truss, tower2 });
})();

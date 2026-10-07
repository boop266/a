/* =========================================================
   manga/styles3d/api.js — 外向きの口（window.MangaInk3D）
   styles/ と同じ境界：
     drawBackground(ctx, bgSpec, box, opts)       … 3D の背景を描く（bgSpec.camera で視点を変えられる）
     drawEffect(ctx, effectSpec, box, opts)       … 集中線・スピード線・雨・稲妻（それ以外は false＝標準に任せる）
     drawCharacter(ctx, charSpec, pose, expr, box, opts) … デッサン人形／騎士を 3D で描く（透明の背景）
     drawScene(ctx, sceneSpec, box, opts)         … 背景＋人物＋獣などを一つの 3D 空間で描く（影が落ち、パースがそろう）
   opts は art そのもの、または { art }。art は styles/art.js と同じ連続パラメータ。
   ========================================================= */
(() => {
  const M3 = window.Manga3D; if (!M3 || !M3.THREE) return;
  const T = M3.THREE;
  const { clamp, lerp, rr, seed, hashStr, V3, M, Builder } = M3;
  const A = M3.Actors, PI = Math.PI;

  // ---------- 場面の組み立て（同じ背景は使い回す） ----------
  const CACHE = new Map(); const CACHE_MAX = 6;
  function sceneName(n) { n = String(n || 'plain'); return M3.SCENE_ALIAS[n] || (M3.SCENES[n] ? n : 'plain'); }
  function buildBackground(bg) {
    const name = sceneName(bg.name);
    const key = name + '|' + (bg.time || '') + '|' + (bg.seed ?? 0);
    if (CACHE.has(key)) return CACHE.get(key);
    seed(hashStr(key));
    const B = new Builder();
    const env = { time: bg.time, weather: bg.weather };
    const info = M3.SCENES[name](B, env) || {};
    const geo = B.geometry();
    const res = { name, info, geo, tris: B.count };
    CACHE.set(key, res); if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value);
    return res;
  }
  // 人物・獣など（毎回つくる。軽い）
  function buildActors(list, floorY, sd) {
    const B = new Builder(); const out = [];
    seed(sd || 7);
    for (const a of list || []) {
      const p = a.pos || [0, 0]; const pos = p.length === 2 ? [p[0], floorY, p[1]] : [p[0], p[1] + floorY, p[2]];
      const t = a.type || 'mannequin';
      if (t === 'knight' || t === 'mannequin' || t === 'human') out.push(Object.assign({ type: t }, A.figure(B, Object.assign({}, a, { kind: t === 'knight' ? 'knight' : 'mannequin', pos }))));
      else if (t === 'beast') out.push(Object.assign({ type: t }, A.beast(B, Object.assign({}, a, { pos }))));
      else if (t === 'horse') out.push(Object.assign({ type: t }, A.horse(B, Object.assign({}, a, { pos }))));
      else if (t === 'skull') A.skull(B, pos, a.size ?? 0.14, [0, (a.yaw || 0) * PI / 180, 0]);
      else if (t === 'bones') M3.Kit.bones(B, { pos, n: a.n ?? 6, r: a.r ?? 2 });
      else if (t === 'sword') A.sword(B, M(pos, [(a.tilt ?? 180) * PI / 180, (a.yaw || 0) * PI / 180, 0]), {});
      else if (t === 'spear') A.spear(B, M(pos, [0, (a.yaw || 0) * PI / 180, (a.tilt ?? 0) * PI / 180]), {});
      else if (t === 'shield') A.shield(B, M([pos[0], pos[1] + 0.42, pos[2]], [-(a.tilt ?? 70) * PI / 180, (a.yaw || 0) * PI / 180, 0]), {});
      else if (t === 'rock') M3.Kit.crag(B, { pos, size: a.size ?? 2, n: a.n ?? 3 });
      else if (t === 'tree') M3.Kit.tree(B, { pos, h: a.h ?? 8 });
      else if (t === 'rubble') M3.Kit.rubble(B, { pos, r: a.r ?? 2, n: a.n ?? 20 });
    }
    return { geo: B.count ? B.geometry() : null, out, tris: B.count };
  }

  // 天気・時間 → 空・光・雨・霧
  function atmosphere(bg, info, art) {
    const night = bg.time === 'night', eve = bg.time === 'evening', w = bg.weather || '';
    const sky = { kind: info.sky || 'day', dark: 0.85, clouds: 0.5, seed: (bg.seed ?? 0) * 3.1 + 1 };
    if (info.sky === 'white') sky.kind = 'white';
    else if (night) { sky.kind = w === 'storm' || w === 'rain' || info.sky === 'storm' ? 'storm' : 'night'; sky.dark = lerp(0.7, 0.98, art.black); sky.clouds = sky.kind === 'storm' ? 0.65 : 0.25; }
    else if (eve) { sky.kind = 'dusk'; sky.dark = lerp(0.5, 0.9, art.black); }
    else if (w === 'storm' || w === 'rain') { sky.kind = 'storm'; sky.dark = lerp(0.45, 0.85, art.black); }
    else if (w === 'cloudy') { sky.kind = 'day'; sky.clouds = 0.8; }
    else if (sky.kind === 'storm' && !night) sky.dark = lerp(0.4, 0.8, art.black);
    else if (sky.kind === 'day') { sky.clouds = 0.35; }
    const L = Object.assign({ dir: [-0.5, 0.75, 0.4], strength: 0.95, ambient: 0.18, rim: 0 }, info.light || {});
    if (night) { L.ambient = 0.12; L.rim = 0.9; L.strength = 0.95; L.front = 0.1; L.high = 0.6; }
    if (eve) { L.dir = [L.dir[0], 0.25, L.dir[2]]; L.rim = 0.3; }
    if (bg.light) Object.assign(L, bg.light);
    const moon = (info.moon || night) && sky.kind !== 'white' ? { dir: bg.moonDir || [L.dir[0] * 0.8, 0.35, Math.min(-0.5, L.dir[2])], size: 0.075, halo: 0.6 } : null;
    const rain = (w === 'rain' || w === 'storm') ? { amount: w === 'storm' ? 0.85 : 0.6, angle: w === 'storm' ? 0.32 : 0.12, length: w === 'storm' ? 55 : 35, seed: bg.seed ?? 1 } : null;
    const fog = Object.assign({ near: 35, far: 260, tone: night ? 0.35 : 0, amount: 0.85 }, info.fog || {});
    if (w === 'fog') { fog.near = 6; fog.far = 70; fog.tone = 0; }
    let mist = info.mist || null;
    if (w === 'fog') mist = { amount: 0.85, falloff: 0.08 };
    if (bg.mist != null) mist = bg.mist ? Object.assign({ amount: 0.6, falloff: 0.2 }, typeof bg.mist === 'object' ? bg.mist : {}) : null;
    return { sky, light: L, moon, rain, fog, mist };
  }

  // カメラ：bg.camera があれば使う。無ければ地平線（horizon）に合わせた目の高さ
  function cameraFor(bg, info, art, aspect, extra = {}) {
    const c = Object.assign({}, info.cam || {}, bg.camera || {}, extra);
    if (!bg.camera && !extra.angle && bg.horizon != null && !c.angle) {
      // 地平線を画面の horizon の高さに：目の高さのカメラを、少し上か下へ向ける
      const cam = M3.camera(Object.assign({}, c, { angle: 'eye' }), art, aspect);
      const fov = cam.fov * PI / 180; const want = clamp(bg.horizon, 0.05, 0.95);
      const pitch = Math.atan((want - 0.5) * 2 * Math.tan(fov / 2));  // >0 なら上を向く（地平線が下がる）
      const tgt = V3(...(c.target || [0, 1.4, 0]));
      const d = cam.position.distanceTo(tgt);
      const dir = V3().subVectors(tgt, cam.position); dir.y = 0; dir.normalize();
      cam.position.y = Math.max(0.3, (c.height ?? 1.55) + (info.floorY ?? 0));
      cam.lookAt(cam.position.clone().addScaledVector(dir, 10).add(V3(0, Math.tan(pitch) * 10, 0)));
      cam.updateMatrixWorld();
      return cam;
    }
    if (info.floorY && c.target) c.target = [c.target[0], c.target[1] + 0, c.target[2]];
    return M3.camera(c, art, aspect);
  }

  // ---------- drawScene ----------
  // spec: { bg: bgSpec, actors: [...], camera: {...}, fx: { focus, speed, angle, behind, center }, flash }
  function drawScene(ctx, spec, box, opts) {
    spec = spec || {}; const bg = Object.assign({}, spec.bg || {}); if (spec.camera) bg.camera = Object.assign({}, bg.camera || {}, spec.camera);
    const art = M3.artOf(opts);
    const t0 = performance.now();
    const back = buildBackground(bg);
    const info = back.info;
    const floorY = info.floorY ?? 0;
    const act = buildActors(spec.actors, floorY, hashStr(JSON.stringify(spec.actors || [])));
    const scene = new T.Scene();
    if (!spec.noBackground) scene.add(new T.Mesh(back.geo));
    if (act.geo) scene.add(new T.Mesh(act.geo));
    const aspect = box.w / box.h;
    const camera = cameraFor(bg, info, art, aspect);
    const at = atmosphere(bg, info, art);
    const fx = Object.assign({}, spec.fx || {});
    if (fx.focus || fx.speed) { fx.behind = fx.behind ?? true; if (fx.depth == null) { const tg = V3(...((bg.camera && bg.camera.target) || info.cam?.target || [0, 1.4, 0])); fx.depth = camera.position.distanceTo(tg) + 1.5; } if (fx.center && fx.center.length === 3) { const p = V3(...fx.center).project(camera); fx.center = [p.x * 0.5 + 0.5, p.y * 0.5 + 0.5]; } }
    if (!(bg.light && bg.light.dir) && info.lightMode !== 'fixed') {
      // 主光源はカメラから見て左上・やや手前（形が読める 3/4 の光）。逆光（月）はその反対側
      const e = camera.matrixWorld.elements; const right = V3(e[0], e[1], e[2]), back = V3(e[8], 0, e[10]).normalize();
      const k = at.light.side ?? -1;
      const d = V3().addScaledVector(right, 0.75 * k).add(V3(0, at.light.high ?? 0.8, 0)).addScaledVector(back, at.light.front ?? 0.35).normalize();
      at.light.dir = d.toArray();
      if (!at.light.rimDir) at.light.rimDir = V3().addScaledVector(right, -0.6 * k).add(V3(0, 0.35, 0)).addScaledVector(back, -0.9).normalize().toArray();
      if (at.moon && !bg.moonDir) { const md = V3().addScaledVector(right, 0.35).add(V3(0, 0.42, 0)).addScaledVector(back, -1).normalize(); at.moon.dir = md.toArray(); }
    }
    const S = { scene, camera, light: at.light, sky: at.sky, moon: at.moon, rain: spec.rain === false ? null : at.rain, fog: at.fog, mist: at.mist, fx, bounds: spec.bounds || info.bounds, flash: spec.flash, transparent: !!spec.transparent };
    const t1 = performance.now();
    const r = M3.render(ctx, S, box, opts);
    const t2 = performance.now();
    // 後片付け（人物のジオメトリ）
    if (act.geo) act.geo.dispose();
    const res = { ok: !!r, ms: Math.round(t2 - t0), buildMs: Math.round(t1 - t0), renderMs: Math.round(t2 - t1), tris: back.tris + act.tris, camera, actors: act.out };
    res.project = p => M3.project(S, box, p);
    if (bg.weather === 'storm' && spec.lightning !== false && bg.lightning !== false) lightning(ctx, box, art, hashStr(bg.name + (bg.seed ?? 0)));
    return res;
  }

  function drawBackground(ctx, bg, box, opts) {
    try { const r = drawScene(ctx, { bg: bg || {} }, box, opts); return !!(r && r.ok); }
    catch (e) { console.warn('styles3d.drawBackground', e); return false; }
  }

  // ---------- drawCharacter：人物だけを透明の背景で ----------
  // box: { footX, footY, unit(大人の身長=100*unit px), facing(1/-1), back, yaw, panel }
  function drawCharacter(ctx, spec, pose, expr, box, opts) {
    spec = spec || {}; box = box || {};
    const unit = box.unit || 3, Hpx = 100 * unit, pxPerM = Hpx / 1.8;
    const kind = spec.model || (/(knight|騎士|armor|甲冑)/i.test(JSON.stringify(spec.outfit || '') + (spec.role || '') + (spec.items || []).join(',')) ? 'knight' : 'mannequin');
    const facing = box.facing ?? 1;
    const yaw = box.yaw != null ? box.yaw * facing : (box.back ? 180 : 35 * facing);
    const pad = Hpx * 0.9;
    let lb = { x: (box.footX || 0) - pad, y: (box.footY || 0) - Hpx * 1.45, w: pad * 2, h: Hpx * 1.6 };
    // 望遠に近いカメラ：画面の大きさを 2D と合わせる
    const fov = 12, aspect = lb.w / lb.h;
    const mH = lb.h / pxPerM;          // 枠の高さ（m）
    const dist = mH / 2 / Math.tan(fov * PI / 360);
    const cy = (lb.y + lb.h / 2 - (box.footY || 0)) / -pxPerM; // 足もとから枠の中心までの高さ（m）
    const cx = (lb.x + lb.w / 2 - (box.footX || 0)) / pxPerM;
    const camera = new T.PerspectiveCamera(fov, aspect, 0.5, dist * 3);
    camera.position.set(cx, cy, dist); camera.lookAt(cx, cy, 0); camera.updateMatrixWorld();
    const B = new Builder(); seed(hashStr((spec.id || spec.name || 'x') + pose));
    const P = { stand: 'stand', walk: 'walk', run: 'run', jump: 'run', fight: 'guard', punch: 'slash', kick: 'slash', fall: 'fallen', lookup: 'lookup', look_up: 'lookup' };
    const fig = A.figure(B, { kind, pose: P[pose] || pose || 'stand', yaw, height: 1.8 * (spec.height || 1), weapon: (spec.items || []).includes('sword') || kind === 'knight' ? 'sword' : (spec.items || []).includes('spear') ? 'spear' : null, shield: (spec.items || []).includes('shield'), cape: kind === 'knight' || /cape|cloak|マント/.test(JSON.stringify(spec.outfit || '')) });
    const scene = new T.Scene(); scene.add(new T.Mesh(B.geometry()));
    const art = M3.artOf(opts);
    const S = { scene, camera, light: { dir: [-0.55 * facing, 0.75, 0.5], strength: 0.95, ambient: 0.2 }, sky: { kind: 'white' }, bounds: { c: [0, 1, 0], r: 3 }, fog: { near: 1e4, far: 2e4 }, transparent: true };
    ctx.save(); if (box.panel) { ctx.beginPath(); ctx.rect(box.panel.x, box.panel.y, box.panel.w, box.panel.h); ctx.clip(); }
    M3.render(ctx, S, lb, opts);
    ctx.restore();
    B.P.length = 0;
    const hp = M3.project(S, lb, fig.head);
    const hr = fig.headR * pxPerM;
    return { head: { x: hp.x, y: hp.y, r: hr }, body: { x: box.footX - Hpx * 0.2, y: box.footY - Hpx, w: Hpx * 0.4, h: Hpx } };
  }

  // ---------- drawEffect（2D の上描き） ----------
  function rng(s) { let x = s >>> 0 || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; }; }
  function wedge(ctx, a, b, w0, w1) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.beginPath(); ctx.moveTo(a[0] + nx * w0, a[1] + ny * w0); ctx.lineTo(b[0] + nx * w1, b[1] + ny * w1); ctx.lineTo(b[0] - nx * w1, b[1] - ny * w1); ctx.lineTo(a[0] - nx * w0, a[1] - ny * w0); ctx.closePath(); ctx.fill();
  }
  function drawEffect(ctx, spec, box, opts) {
    spec = typeof spec === 'string' ? { name: spec } : (spec || {});
    const art = M3.artOf(opts), dyn = art.dynamism, r = rng(hashStr(spec.name + Math.round(box.x) + ',' + Math.round(box.y)) + (spec.seed || 0));
    const sc = clamp(Math.sqrt(box.w * box.h) / 600, 0.5, 2), R = Math.hypot(box.w, box.h);
    const ink = spec.dark ? '#fff' : '#000';
    const f = spec.focus ? [spec.focus.x, spec.focus.y] : [box.x + box.w / 2, box.y + box.h * 0.45];
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); ctx.fillStyle = ink;
    let done = true;
    switch (spec.name) {
      case 'focus': { // 集中線：細い楔を、太さと長さを散らして密に
        const n = Math.round(lerp(140, 420, dyn) * sc), r0 = Math.min(box.w, box.h) * lerp(0.38, 0.22, dyn);
        for (let i = 0; i < n; i++) { const a = r() * PI * 2, ri = r0 * (0.85 + r() * 0.9) * (r() < 0.12 ? 0.75 : 1); const d = [Math.cos(a), Math.sin(a)]; wedge(ctx, [f[0] + d[0] * ri, f[1] + d[1] * ri], [f[0] + d[0] * R, f[1] + d[1] * R], 0.05, (0.6 + r() * r() * 4.5) * sc * lerp(0.7, 1.3, art.line.weight)); }
        break; }
      case 'speed': case 'speedv': { // スピード線：平行な楔（片側が細い）
        const ang = spec.angle ?? (spec.name === 'speedv' ? PI / 2 : 0); const d = [Math.cos(ang), Math.sin(ang)], nv = [-d[1], d[0]];
        const n = Math.round(lerp(60, 220, dyn) * sc); const c = [box.x + box.w / 2, box.y + box.h / 2];
        for (let i = 0; i < n; i++) { const o = (r() - 0.5) * R, s = (r() - 0.5) * R * 0.6, L = R * (0.25 + r() * 0.6); const a = [c[0] + nv[0] * o + d[0] * (s - L / 2), c[1] + nv[1] * o + d[1] * (s - L / 2)], b = [a[0] + d[0] * L, a[1] + d[1] * L]; wedge(ctx, a, b, (0.4 + r() * r() * 3.2) * sc, 0.05); }
        break; }
      case 'rain': { // 雨：斜めの細い線。暗い所は白、明るい所は黒（差の合成）
        ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff';
        const n = Math.round(box.w * box.h / 900 * (spec.amount ?? 1)), a = spec.angle ?? 0.25;
        for (let i = 0; i < n; i++) { const x = box.x + r() * box.w, y = box.y + r() * box.h, L = (14 + r() * 40) * sc; wedge(ctx, [x, y], [x - Math.sin(a) * L, y + Math.cos(a) * L], 0.05, (0.35 + r() * 0.6) * sc); }
        break; }
      case 'lightning': lightning(ctx, box, art, hashStr('lt' + box.x + box.y) + (spec.seed || 0), spec.x); break;
      case 'betaflash': { // ベタフラ：黒地に白い放射
        ctx.fillStyle = '#000'; ctx.fillRect(box.x, box.y, box.w, box.h); ctx.fillStyle = '#fff';
        const n = Math.round(lerp(120, 300, dyn) * sc);
        for (let i = 0; i < n; i++) { const a = r() * PI * 2, d = [Math.cos(a), Math.sin(a)], ri = Math.min(box.w, box.h) * (0.05 + r() * 0.2); wedge(ctx, [f[0] + d[0] * ri, f[1] + d[1] * ri], [f[0] + d[0] * R * (0.3 + r() * 0.5), f[1] + d[1] * R * (0.3 + r() * 0.5)], (0.8 + r() * 3) * sc, 0.05); }
        const g = ctx.createRadialGradient(f[0], f[1], 0, f[0], f[1], Math.min(box.w, box.h) * 0.25); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(box.x, box.y, box.w, box.h);
        break; }
      default: done = false;
    }
    ctx.restore();
    return done;
  }
  // 稲妻：枝分かれする白い帯に黒いふち
  function lightning(ctx, box, art, s, x0) {
    const r = rng(s); const sc = clamp(Math.sqrt(box.w * box.h) / 600, 0.5, 2);
    const segs = [];
    const grow = (p, a, len, w, depth) => { let q = p.slice(); const n = 8 + Math.floor(r() * 6); for (let i = 0; i < n; i++) { a += (r() - 0.5) * 0.9; const nq = [q[0] + Math.sin(a) * len / n, q[1] + Math.cos(a) * len / n]; segs.push([q, nq, w * (1 - i / n * 0.6)]); if (depth < 2 && r() < 0.18) grow(nq, a + (r() < 0.5 ? -0.8 : 0.8), len * 0.45, w * 0.5, depth + 1); q = nq; } };
    grow([x0 ?? box.x + box.w * (0.15 + r() * 0.7), box.y], (r() - 0.5) * 0.4, box.h * 0.55, 3.2 * sc, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const pass of [0, 1]) for (const [a, b, w] of segs) { ctx.strokeStyle = pass ? '#fff' : '#000'; ctx.lineWidth = pass ? w : w + 2.6 * sc; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.restore();
  }

  const API = {
    name: 'ink3d',
    drawBackground, drawEffect, drawCharacter, drawScene,
    metrics: (spec, opts) => (window.MangaInk && window.MangaInk.metrics) ? window.MangaInk.metrics(spec, opts) : { top: 100, hc: -88, R: 12, widthRatio: 0.4, size: 1 },
    POSES: Object.keys(A.POSES), SCENES: Object.keys(M3.SCENES), clearCache: () => CACHE.clear(),
    // 組み込み用：studio の画風として登録する（背景・効果・人物を 3D に）。
    // only: ['drawBackground'] のように一部だけ 3D にして、残りは base（既定 window.MangaInk）に任せられる
    register(name = 'ink3d', o = {}) {
      const base = o.base || window.MangaInk || {};
      const only = o.only || ['drawBackground', 'drawEffect'];
      const impl = Object.assign({}, base);
      for (const k of only) impl[k] = (...a) => { try { const r = API[k](...a); return r; } catch (e) { console.warn('ink3d', k, e); return base[k] ? base[k](...a) : false; } };
      if (only.includes('drawEffect') && base.drawEffect) impl.drawEffect = (ctx, sp, box, op) => { const r = drawEffect(ctx, sp, box, op); return r || base.drawEffect(ctx, sp, box, op); };
      return window.MangaStyles && window.MangaStyles.register(name, impl);
    },
  };
  window.MangaInk3D = API;
  M3.API = API;
})();

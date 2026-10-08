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
    CACHE.set(key, res); if (CACHE.size > CACHE_MAX) { const k = CACHE.keys().next().value; CACHE.get(k).geo.dispose(); CACHE.delete(k); }
    return res;
  }
  // 人物・獣など（毎回つくる。軽い）
  const ACACHE = new Map();
  function buildActors(list, floorY, sd, heightFn, art) {
    const key = JSON.stringify(list || []) + '|' + floorY + '|' + (heightFn ? 'h' : '') + '|' + (art ? art.headRatio + ',' + art.deform : '');
    if (ACACHE.has(key)) return ACACHE.get(key);
    const r = buildActors0(list, floorY, sd, heightFn, art);
    ACACHE.set(key, r); if (ACACHE.size > 8) { const k = ACACHE.keys().next().value; const o = ACACHE.get(k); if (o.geo) o.geo.dispose(); ACACHE.delete(k); }
    return r;
  }
  function buildActors0(list, floorY, sd, heightFn, art) {
    const B = new Builder(); const out = [];
    seed(sd || 7);
    for (const a of list || []) {
      const p0 = B.P.length, n0 = out.length;
      const p = a.pos || [0, 0]; const gy = (x, z) => heightFn ? heightFn(x, z) : floorY; const pos = p.length === 2 ? [p[0], gy(p[0], p[1]), p[1]] : [p[0], p[1] + gy(p[0], p[2]), p[2]];
      const t = a.type || 'mannequin';
      if (t === 'human' || t === 'person' || t === 'man' || t === 'woman') out.push(Object.assign({ type: 'human' }, A.human(B, Object.assign({ headRatio: art && art.headRatio, deform: art && art.deform }, a, { pos, female: a.female ?? (t === 'woman' ? true : undefined) }))));
      else if (t === 'knight' || t === 'mannequin') out.push(Object.assign({ type: t }, A.figure(B, Object.assign({}, a, { kind: t === 'knight' ? 'knight' : 'mannequin', pos }))));
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
      else if (t === 'debris') A.debris(B, Object.assign({}, a, { pos: (a.pos && a.pos.length === 3) ? [a.pos[0], a.pos[1] + floorY, a.pos[2]] : [pos[0], floorY + 1, pos[2]] }));
      else if (t === 'concrete' || t === 'ruin') M3.Kit.concreteRuin(B, Object.assign({ floors: 4 }, a, { pos }));
      else if (t === 'rubbleHeap') M3.Kit.rubbleHeap(B, Object.assign({}, a, { pos }));
      else if (t === 'pipe') M3.Kit.pipe(B, a.points || [[pos[0] - 3, pos[1] + 0.5, pos[2]], [pos[0] + 3, pos[1] + 0.5, pos[2]]], a.r ?? 0.3);
      else if (t === 'tank') M3.Kit.tank(B, pos, a.r ?? 2.5, a.h ?? 6);
      // 主役（人物・獣・馬）の範囲を記録：カメラの自動の寄せに使う
      if (out.length > n0 && B.P.length > p0) { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = p0; i < B.P.length; i += 3) for (let k = 0; k < 3; k++) { const v = B.P[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; } out[out.length - 1].bbox = [mn, mx]; }
    }
    return { geo: B.count ? B.geometry() : null, out, tris: B.count };
  }

  // 天気・時間 → 空・光・雨・霧
  function atmosphere(bg, info0, art) {
    let info = info0;
    const night = bg.time === 'night', eve = bg.time === 'evening', w = bg.weather || '';
    const sky = { kind: info.sky || 'day', dark: 0.85, clouds: 0.5, seed: (bg.seed ?? 0) * 3.1 + 1 };
    if (bg.sky) info = Object.assign({}, info, { sky: bg.sky });
    if (info.sky === 'scratch') { sky.kind = 'scratch'; sky.clouds = 0.6; }
    else if (info.sky === 'white') { sky.kind = 'white'; sky.clouds = 0; }
    else if (night) { sky.kind = w === 'storm' || w === 'rain' || info.sky === 'storm' ? 'storm' : 'night'; sky.dark = lerp(0.7, 0.98, art.black); sky.clouds = sky.kind === 'storm' ? 0.65 : 0.25; }
    else if (eve) { sky.kind = 'dusk'; sky.dark = lerp(0.5, 0.9, art.black); }
    else if (w === 'storm' || w === 'rain') { sky.kind = 'storm'; sky.dark = lerp(0.45, 0.85, art.black); }
    else if (w === 'cloudy') { sky.kind = 'day'; sky.clouds = 0.8; }
    else if (sky.kind === 'storm' && !night) sky.dark = lerp(0.4, 0.8, art.black);
    else if (sky.kind === 'day') { sky.clouds = 0.35; }
    const L = Object.assign({ dir: [-0.5, 0.75, 0.4], strength: 0.85, ambient: 0.32, rim: 0.35 }, info.light || {});   // 昼でも逆光のふちを少し（暗い物と暗い背景を分ける）
    if (sky.kind === 'scratch') { sky.swirl = bg.swirl || null; }
    if (night) { L.ambient = Math.min(L.ambient, 0.14); L.rim = 0.9; L.strength = 1.0; L.front = 0.3; L.high = 0.95; }
    if (eve) { L.high = 0.3; L.rim = 0.5; L.strength = 0.75; L.ambient = 0.2; }
    if (bg.light) Object.assign(L, bg.light);
    const moon = (info.moon || night) && sky.kind !== 'white' && sky.kind !== 'scratch' ? { dir: bg.moonDir || [L.dir[0] * 0.8, 0.35, Math.min(-0.5, L.dir[2])], size: 0.075, halo: 0.6 } : null;
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

  // ---------- 主役に合わせた自動の寄せ ----------
  // 人物などの範囲（bbox）を画面に投影し、パネルの高さ（または幅）の 55〜75% に収める。
  // 寄りのショット（shot: 'up' / 'bust' / 'closeup'、または crop: true）は、わざと切るのでそのまま。
  // 真下から（煽り）は、頭と手が画面の上の方を占め、その上に空が見えるように狙う（足は切れてよい）。
  function fitCamera(cam, actors, cs, aspect) {
    const subj = (actors || []).filter(a => a.bbox); if (!subj.length) return;
    if (subj.length > 1 && cs.fit !== true) return;   // 複数の主役の構図は、頼まれたときだけ寄せる
    if (cs.crop || ['up', 'bust', 'closeup'].includes(cs.shot)) return;
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (const a of subj) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], a.bbox[0][k]); mx[k] = Math.max(mx[k], a.bbox[1][k]); }
    const fwd = V3(); cam.getWorldDirection(fwd);
    const ang = typeof cs.angle === 'number' ? cs.angle : ({ worm: -38, top: 89 }[cs.angle] ?? 0);
    const H = mx[1] - mn[1];
    const worm = (fwd.y > 0.3 || ang <= -30) && H > 0.8, top = fwd.y < -0.85 || ang >= 80;   // 寝ている人を真下からは煽らない
    const want = cs.fill ?? (worm ? 0.72 : top ? 0.62 : 0.66);
    // 煽り：上半分（頭・手）だけで寄せ、カメラは地面すれすれから見上げる。足は切れてよい
    const lo = worm ? mn[1] + H * 0.4 : mn[1];
    const aim = V3((mn[0] + mx[0]) / 2, worm ? mn[1] + H * 0.62 : (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2);
    if (worm) { const hd = V3(cam.position.x - aim.x, 0, cam.position.z - aim.z); const hl = Math.max(hd.length(), 0.5); hd.normalize(); const el = Math.max(-ang, 40) * Math.PI / 180; cam.position.set(aim.x + hd.x * hl, Math.max(0.12, Math.min(cam.position.y, aim.y - Math.tan(el) * hl)), aim.z + hd.z * hl); }
    const corners = []; for (let i = 0; i < 8; i++) corners.push(V3(i & 1 ? mx[0] : mn[0], i & 2 ? mx[1] : lo, i & 4 ? mx[2] : mn[2]));
    const up = cam.up.clone();
    // まず今の画面での大きさを測る。作り込んだ構図（距離の指定・複数の主役）は、明らかに外れているときだけ直す
    { cam.updateMatrixWorld(); let x0 = 1, x1 = -1, y0 = 1, y1 = -1, vis = 0;
      for (const c of corners) { const v = c.clone().project(cam); if (v.z > 1) continue; vis++; x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      const frac0 = vis ? Math.max((y1 - y0) / 2, (x1 - x0) / 2) : 0;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, inside = vis > 0 && Math.abs(cx) < 0.9 && Math.abs(cy) < 0.9;
      const composed = subj.length > 1 || cs.dist != null;
      if (composed && !(worm || top) && inside && frac0 > (subj.length > 1 ? 0.2 : 0.4)) return;
      if (subj.length > 1 && inside && frac0 > 0.2) return;
    }
    for (let it = 0; it < 4; it++) {
      // 向きを主役へ（煽りは上体へ）。距離は今のまま
      const dir = V3().subVectors(cam.position, aim); let d = dir.length(); dir.normalize();
      cam.up.copy(up); cam.lookAt(aim); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      let x0 = 1, x1 = -1, y0 = 1, y1 = -1, behind = false;
      for (const c of corners) { const v = c.clone().project(cam); if (v.z > 1) { behind = true; continue; } x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      if (behind) { d *= 1.4; cam.position.copy(aim).addScaledVector(dir, d); continue; }
      const frac = Math.max((y1 - y0) / 2, (x1 - x0) / 2 * (worm ? 0.8 : 1));
      const k = frac / want;
      if (Math.abs(k - 1) < 0.04) break;
      // 寄る・引く：主役までの距離を変える（極端な広角でも近づきすぎない）
      d = Math.max(0.6, d * k);
      cam.position.copy(aim).addScaledVector(dir, d);
      if (cam.position.y < 0.12) cam.position.y = 0.12;
    }
    if (worm) { // 主役の上側を画面の上 1/3 あたりまで持ち上げ、上に空を残す：少しだけ下を見る
      cam.updateMatrixWorld(); const v = V3(aim.x, mx[1], aim.z).project(cam);
      if (v.y > 0.55) cam.rotateX(Math.atan((v.y - 0.55) * Math.tan(cam.fov * Math.PI / 360)));   // 頭の上に空を残す
    }
    cam.updateMatrixWorld(); cam.updateProjectionMatrix(); cam.userData.aim = aim;
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
    const aspect = box.w / box.h;
    const camera = cameraFor(bg, info, art, aspect);
    const list = (spec.actors || []).filter(a => a.type !== 'crowd');
    const act = buildActors(list, floorY, hashStr(JSON.stringify(list)), info.height, art);
    const hasCrowd = (spec.actors || []).some(a => a.type === 'crowd');
    const camSpec = Object.assign({}, info.cam || {}, bg.camera || {});
    if (!hasCrowd && camSpec.fit !== false) fitCamera(camera, act.out, camSpec, aspect);
    const scene = new T.Scene();
    if (!spec.noBackground) scene.add(new T.Mesh(back.geo));
    if (act.geo) scene.add(new T.Mesh(act.geo));
    // 群衆・軍勢：インスタンス描画（手前は描き込み、奥は記号）
    let crowdN = 0;
    for (const a of (spec.actors || []).filter(a => a.type === 'crowd')) {
      seed(hashStr(JSON.stringify(a)));
      const p = a.pos || [0, -10]; const pos = p.length === 2 ? [p[0], floorY, p[1]] : [p[0], p[1] + floorY, p[2]];
      const hf = info.height ? ((x, z) => info.height(x, z)) : (() => pos[1]);
      const c = A.crowd(Object.assign({}, a, { pos, camPos: camera.position.toArray(), height: hf }));
      c.meshes.forEach(m => scene.add(m)); crowdN += c.count;
    }
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
    // 白飛び：fx.bloom = { at:[x,y,z] か center:[u,v](0..1, 下が0), radius(画面の高さに対する割合), amount }（配列で2つまで）
    const bloom = [].concat(fx.bloom || []).slice(0, 2).map(b => { let c = b.center; if (b.at) { const q = V3(...b.at).project(camera); c = [q.x * 0.5 + 0.5, q.y * 0.5 + 0.5]; } return { center: c || [0.5, 0.5], radius: b.radius ?? 0.18, amount: b.amount ?? 1 }; });
    const refZ = camera.userData.aim ? camera.position.distanceTo(camera.userData.aim) : camera.position.distanceTo(V3(...((bg.camera && bg.camera.target) || (info.cam && info.cam.target) || [0, 1.4, 0])));
    const S = { refZ, scene, camera, light: at.light, sky: at.sky, moon: at.moon, rain: spec.rain === false ? null : at.rain, fog: at.fog, mist: at.mist, fx, bloom, night: bg.time === 'night', bounds: spec.bounds || info.bounds, flash: spec.flash, transparent: !!spec.transparent };
    const t1 = performance.now();
    const r = M3.render(ctx, S, box, opts);
    const t2 = performance.now();
    const res = { ok: !!r, ms: Math.round(t2 - t0), buildMs: Math.round(t1 - t0), renderMs: Math.round(t2 - t1), tris: back.tris + act.tris, camera, actors: act.out };
    res.project = p => M3.project(S, box, p);
    if (bg.weather === 'storm' && spec.lightning !== false && bg.lightning !== false) lightning(ctx, box, art, hashStr(bg.name + (bg.seed ?? 0)));
    // 墨の飛沫：fx.splatter = { at:[x,y,z], dir:[x,y,z]（世界の向き）, amount, size } または配列
    for (const sp of [].concat(fx.splatter || [])) {
      const q = V3(...(sp.at || [0, 1, 0])).project(camera), q2 = V3(...(sp.at || [0, 1, 0])).add(V3(...(sp.dir || [0, 1, 0]))).project(camera);
      const p0 = { x: box.x + (q.x * 0.5 + 0.5) * box.w, y: box.y + (0.5 - q.y * 0.5) * box.h };
      const dx = (q2.x - q.x) * box.w, dy = -(q2.y - q.y) * box.h;
      splatter(ctx, box, art, { focus: p0, angle: Math.atan2(dy, dx), amount: sp.amount ?? 1, size: sp.size ?? 1, seed: sp.seed ?? 1 });
    }
    res.crowd = crowdN;
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
    const kind = spec.model || (/(knight|騎士|armor|甲冑)/i.test(JSON.stringify(spec.outfit || '') + (spec.role || '') + (spec.items || []).join(',')) ? 'knight' : 'human');
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
    const P = { stand: 'stand', walk: 'walk', run: 'run', jump: 'jump', fight: 'guard', punch: 'slash', kick: 'kick', fall: 'fallen', lookup: 'lookup', look_up: 'lookup', dance: 'spin', surprise: 'scream', scared: 'scream' };
    const art0 = M3.artOf(opts), artRaw = (opts && (opts.art || opts)) || {};
    const outfitStr = JSON.stringify(spec.outfit || '');
    const outfit3 = /coat|コート|cloak|jacket/.test(outfitStr) ? 'coat' : /dress|ドレス|ワンピ/.test(outfitStr) ? 'dress' : /skirt|スカート/.test(outfitStr) ? 'skirt' : 'casual';
    const hair3 = /long|ロング|長/.test(JSON.stringify(spec.hair || '')) ? 'long' : /spik|ツンツン|とげ/.test(JSON.stringify(spec.hair || '')) ? 'spiky' : /bald|none|坊主|スキン/.test(JSON.stringify(spec.hair || '')) ? 'none' : undefined;
    const fig = kind === 'human' ? A.human(B, { pose: P[pose] || pose || 'stand', yaw, height: 1.8 * (spec.height || 1), headRatio: artRaw.headRatio, deform: artRaw.deform, outfit: spec.outfit3 || outfit3, hair: spec.hair3 || hair3, female: spec.gender === 'female' || spec.gender === 'f' ? true : undefined, expr, weapon: (spec.items || []).includes('sword') ? 'sword' : null })
      : A.figure(B, { kind, pose: P[pose] || pose || 'stand', yaw, height: 1.8 * (spec.height || 1), weapon: (spec.items || []).includes('sword') || kind === 'knight' ? 'sword' : (spec.items || []).includes('spear') ? 'spear' : null, shield: (spec.items || []).includes('shield'), cape: kind === 'knight' || /cape|cloak|マント/.test(JSON.stringify(spec.outfit || '')) });
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
      case 'splatter': case 'dust': splatter(ctx, box, art, { focus: { x: f[0], y: f[1] }, angle: spec.angle ?? -PI / 2, amount: spec.amount ?? 1, size: spec.size ?? 1, seed: spec.seed || 1, dust: spec.name === 'dust' }); break;
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
  // 墨の飛沫・粉塵：進行方向に流れる大小の黒点と、しずくの尾
  function splatter(ctx, box, art, o) {
    const r = rng(hashStr('sp' + Math.round(o.focus.x) + ',' + Math.round(o.focus.y)) + (o.seed || 0)); const sc = clamp(Math.max(box.w, box.h) / 1600, 0.5, 3) * (o.size ?? 1);
    const n = Math.round((o.dust ? 900 : 420) * (o.amount ?? 1)), a0 = o.angle ?? -PI / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); ctx.fillStyle = o.white ? '#fff' : '#000';
    for (let i = 0; i < n; i++) {
      const a = a0 + (r() - 0.5) * (o.dust ? 1.6 : 1.1) * (0.4 + r()), d = Math.pow(r(), 0.7) * 260 * sc * (o.dust ? 1.4 : 1);
      const x = o.focus.x + Math.cos(a) * d, y = o.focus.y + Math.sin(a) * d;
      const big = r() < 0.06 && !o.dust;
      const rad = (big ? 3 + r() * 6 : 0.6 + Math.pow(r(), 3) * 2.6) * sc * (1 - d / (300 * sc) * 0.5);
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, rad), 0, PI * 2); ctx.fill();
      if (big || (r() < 0.15 && !o.dust)) { const L = rad * (2 + r() * 5); wedge(ctx, [x, y], [x - Math.cos(a) * L, y - Math.sin(a) * L], rad * 0.9, 0.05); }   // 尾（飛んできた向きへ細る）
    }
    ctx.restore();
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
    POSES: Object.keys(A.POSES), SCENES: Object.keys(M3.SCENES), clearCache: () => { CACHE.forEach(c => c.geo.dispose()); CACHE.clear(); ACACHE.forEach(c => c.geo && c.geo.dispose()); ACACHE.clear(); },
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

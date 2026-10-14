// 黄泉還：遊びの中心（主人公・カメラ・撃つ・調べる・部屋の出入り）
const G = { mode: 'boot', room: null, rid: '', cam: null, camOv: null, time: 0, t: 0, en: [], fx: [], msgQ: [], timer: null, flags: {}, taken: {}, killed: {}, open: {}, files: [], maps: {}, visited: {}, inv: [], box: [], eq: 'hg', mag: {}, saves: 0, heals: 0, lockSeen: {}, kills: 0, shots: 0, inf: false };
const PL = { x: 0, z: 0, y: 0, ang: 0, rad: 0.28, hp: 100, poison: false, h: null, st: { t: 0, mode: 'idle', hp: 100 }, aimT: 0, cd: 0, tgt: null, pitch: 0, hurtT: 0, inv: 0, grab: null, dead: false, reloadT: 0, kb: [0, 0], stepT: 0, actT: 0, shadow: null };
const INV_N = 8;
function flag(k) { return !!G.flags[k]; }
function setFlag(k, v = true) { G.flags[k] = v; }
function condOK(c) { if (!c) return true; return c.split('&').every(s => { s = s.trim(); const neg = s[0] === '!'; if (neg) s = s.slice(1); const v = s.startsWith('f:') ? flag(s.slice(2)) : s.startsWith('t:') ? !!G.taken[s.slice(2)] : s.startsWith('k:') ? !!G.killed[s.slice(2)] : s.startsWith('v:') ? !!G.visited[s.slice(2)] : true; return neg ? !v : v; }); }
// ── 持ち物 ──
function invCount(id) { let n = 0; for (const s of G.inv) if (s && s.id === id) n += s.n || 1; return n; }
function invHas(id) { return G.inv.some(s => s && s.id === id); }
function invFree() { return G.inv.filter(s => !s).length; }
function invAdd(id, n = 1) {
  const it = ITEMS[id];
  if (it.stack) { for (const s of G.inv) if (s && s.id === id && s.n < it.stack) { const k = Math.min(n, it.stack - s.n); s.n += k; n -= k; if (!n) return true; } }
  while (n > 0) { const i = G.inv.indexOf(null); if (i < 0) return false; const k = it.stack ? Math.min(n, it.stack) : 1; G.inv[i] = { id, n: it.stack ? k : 1 }; n -= k; if (!it.stack) break; }
  return true;
}
function invTake(id, n = 1) { for (let i = G.inv.length - 1; i >= 0 && n > 0; i--) { const s = G.inv[i]; if (!s || s.id !== id) continue; const k = Math.min(n, s.n || 1); s.n = (s.n || 1) - k; n -= k; if (s.n <= 0) G.inv[i] = null; } return n <= 0; }
function canFit(id, n) { const it = ITEMS[id]; if (it.stack) { let room = 0; for (const s of G.inv) { if (!s) room += it.stack; else if (s.id === id) room += it.stack - s.n; } return room >= n; } return invFree() > 0; }
// ── 新しく始める ──
function newGame() {
  Object.assign(G, { time: 0, en: [], fx: [], msgQ: [], timer: null, flags: {}, taken: {}, killed: {}, open: {}, files: [], maps: {}, visited: {}, box: [], eq: 'hg', mag: { hg: 15, sg: 0, mg: 0, gl: 0 }, saves: 0, heals: 0, lockSeen: {}, kills: 0, shots: 0, camOv: null });
  G.inf = !!(QS.has('inf') || (G.unlockInf && G.useInf));
  G.inv = new Array(INV_N).fill(null); G.inv[0] = { id: 'hg', n: 1 }; G.inv[1] = { id: 'hg_ammo', n: 15 };
  Object.assign(PL, { hp: 100, poison: false, dead: false, grab: null, hurtT: 0, inv: 0, reloadT: 0 });
}
// ── 部屋に入る ──
function disposeRoom(R) { R.scene.traverse(o => { if (o.geometry && !o.userData.keep) o.geometry.dispose(); }); }
function enterRoom(id, sp) {
  if (G.room) { G.room.scene.remove(PL.h.root); if (PL.shadow) G.room.scene.remove(PL.shadow); for (const e of G.en) if (e.h) G.room.scene.remove(e.h.root); disposeRoom(G.room); }
  const R = buildRoom(id); G.room = R; G.rid = id; G.visited[id] = true; G.fx = [];
  for (const it of R.D.items || []) if (!G.taken[it.key] && condOK(it.cond)) spawnPickup(R, it);
  for (const k in (G.drops || {})) { const d = G.drops[k]; if (d.room === id && !G.taken[k]) spawnPickup(R, Object.assign({ key: k }, d)); }
  G.en = []; for (const e of R.D.enemies || []) if (!G.killed[e.key] && condOK(e.cond)) G.en.push(spawnEnemy(R, e));
  for (const e of (G.corpses || [])) if (e.room === id) addCorpse(R, e);
  R.scene.add(PL.h.root); if (!PL.shadow) PL.shadow = blobShadow(0.42); R.scene.add(PL.shadow);
  if (sp) { PL.x = sp.x; PL.z = sp.z; PL.y = sp.y != null ? sp.y : (floorAt(R, sp.x, sp.z, sp.y0 || 0) ?? 0); PL.ang = sp.ang != null ? sp.ang : PL.ang; }
  PL.h.root.position.set(PL.x, PL.y, PL.z); PL.h.root.rotation.y = PL.ang; PL.tgt = null; PL.aimT = 0; PL.grab = null;
  G.cam = null; G.cam = pickCam(R, null, PL.x, PL.z, PL.y); G.ctrl = null;
  AU.setAmb(R.D.ambience); AU.room(R.D.rev != null ? R.D.rev : 0.25); AU.music(R.D.music || '');
  R.lightningT = 4 + rnd() * 8;
  storyEnter(id);
}
function blobShadow(r) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 12), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.42, depthWrite: false })); m.rotation.x = -PI / 2; m.renderOrder = 1; m.userData.keep = true; return m; }
function spawnPickup(R, it) {
  const mdl = makeItemModel(it.model || it.id); const y = it.y != null ? it.y : (floorAt(R, it.x, it.z, 0) ?? 0);
  mdl.position.set(it.x, y + 0.01, it.z); mdl.rotation.y = it.a || 0; mdl.scale.setScalar(it.s || 1.25); R.scene.add(mdl);
  R.pick.push(Object.assign({}, it, { mdl, y }));
}
// ── カメラ ──
function curCam() { return G.camOv ? G.camOv.cam : (G.cam ? G.cam.cam : null); }
function setCamOv(p, t, fov = 50) { const cam = new THREE.PerspectiveCamera(fov, 4 / 3, 0.05, 90); cam.position.set(...p); cam.lookAt(...t); cam.updateMatrixWorld(); G.camOv = { cam }; }
function camBasis(c) { const m = c.matrixWorld.elements; let rx = m[0], rz = m[2], fx = -m[8], fz = -m[10]; let a = hyp(rx, rz) || 1, b = hyp(fx, fz) || 1; return { rx: rx / a, rz: rz / a, fx: fx / b, fz: fz / b }; }
// ── 主人公 ──
function hpCond() { return PL.hp > 66 ? 0 : PL.hp > 33 ? 1 : 2; }
function weaponReady() { const w = G.eq; if (!w) return false; return w === 'knife' || invHas(w); }
function updPlayer(dt) {
  const R = G.room, st = PL.st; st.t += dt; st.hp = PL.hp; st.poison = PL.poison; PL.cd -= dt; PL.inv -= dt;
  if (PL.dead) { st.dead = true; st.deadT = (st.deadT || 0) + dt; poseRyo(PL.h, st, dt); return; }
  if (PL.poison) { PL.poisonT = (PL.poisonT || 0) + dt; if (PL.poisonT > 4) { PL.poisonT = 0; if (PL.hp > 6) { PL.hp -= 3; } } }
  // 噛まれている：もがいて振りほどく
  if (PL.grab) { st.mode = 'grabbed'; if (IN.e.any) PL.grabMash = (PL.grabMash || 0) + 1; if (IN.mag > 0.5) { PL.wig = (PL.wig || 0) + dt; if (PL.wig > 0.18) { PL.wig = 0; PL.grabMash = (PL.grabMash || 0) + 1; } } poseRyo(PL.h, st, dt); return; }
  PL.grabMash = 0;
  if (PL.hurtT > 0) { PL.hurtT -= dt; st.mode = 'hurt'; moveActor(R, PL, PL.kb[0] * dt, PL.kb[1] * dt, 'pl'); PL.kb[0] *= 0.85; PL.kb[1] *= 0.85; poseRyo(PL.h, st, dt); return; }
  if (PL.actT > 0) { PL.actT -= dt; st.mt = (st.mt || 0) + dt; poseRyo(PL.h, st, dt); if (PL.actT <= 0 && PL.actCb) { const cb = PL.actCb; PL.actCb = null; cb(); } return; }
  if (PL.reloadT > 0) { PL.reloadT -= dt; st.mode = 'idle'; if (PL.reloadT <= 0) finishReload(); poseRyo(PL.h, st, dt); return; }
  const cam = curCam(); if (!cam) return;
  if (IN.aim && weaponReady()) { aimUpdate(dt, cam); poseRyo(PL.h, st, dt); return; }
  if (PL.aimT > 0) { PL.aimT = 0; PL.tgt = null; setWeapon(PL.h, null); }
  st.recoil = 0; st.slash = 0;
  // 動く
  let mvx = 0, mvz = 0, mode = 'idle'; const cond = hpCond();
  const spd = (IN.run ? 3.6 : 1.45) * (cond === 2 ? (IN.run ? 0.62 : 0.85) : cond === 1 ? 0.93 : 1) * (PL.poison ? 0.88 : 1);
  if (OPT.ctrl === 'tank') {
    if (abs(IN.mx) > 0.25) PL.ang -= IN.mx * (IN.run ? 3.2 : 2.6) * dt;
    if (IN.my > 0.3) { mvx = Math.sin(PL.ang) * spd; mvz = Math.cos(PL.ang) * spd; mode = IN.run ? 'run' : 'walk'; }
    else if (IN.my < -0.3) { if (IN.run && !PL.qt) { PL.qt = 0.28; } else if (!PL.qt) { mvx = -Math.sin(PL.ang) * 1.0; mvz = -Math.cos(PL.ang) * 1.0; mode = 'back'; } }
    if (PL.qt) { const step = PI * dt / 0.28; PL.ang += step; PL.qt -= dt; if (PL.qt <= 0) PL.qt = 0; }
  } else if (IN.mag > 0.12) {
    // 倒した向きへ。カメラが切り替わっても、指を離すまでは前のカメラの向きのまま
    const cur = camBasis(cam); const ia = Math.atan2(IN.mx, IN.my);
    if (!G.ctrl || abs(angDiff(G.ctrl.ia, ia)) > 0.6) G.ctrl = { b: cur, ia };
    const b = G.ctrl.b, dx = b.rx * IN.mx + b.fx * IN.my, dz = b.rz * IN.mx + b.fz * IN.my;
    const ta = Math.atan2(dx, dz), d = angDiff(PL.ang, ta);
    PL.ang = angTo(PL.ang, ta, (abs(d) > 2.4 ? 14 : 9) * dt);
    if (abs(d) < 1.3) { const k = IN.mag < 0.5 && !IN.run ? 0.6 : 1, s = (IN.mag > 0.72 && IN.touch) || IN.run ? spd : spd * k; mvx = Math.sin(PL.ang) * s; mvz = Math.cos(PL.ang) * s; mode = s > 2.2 ? 'run' : 'walk'; }
  } else G.ctrl = null;
  if (mvx || mvz) { const r = moveActor(R, PL, mvx * dt, mvz * dt, 'pl'); if (!r) mode = 'idle'; }
  for (const e of G.en) if (!e.dead && e.solid !== false) { const dx = PL.x - e.x, dz = PL.z - e.z, d = hyp(dx, dz), m = PL.rad + e.rad; if (d < m && d > 1e-4 && abs(PL.y - e.y) < 1) moveActor(R, PL, dx / d * (m - d) * 0.5, dz / d * (m - d) * 0.5, 'pl'); }
  st.mode = mode;
  // 足音
  if (mode !== 'idle') { PL.stepT -= dt * (mode === 'run' ? 1.9 : 1.05); if (PL.stepT <= 0) { PL.stepT = 0.5; AU.sfx('step', { mat: stepMat(R, PL.x, PL.z, PL.y), v: mode === 'run' ? 1 : 0.6, x: PL.x, z: PL.z, rev: 0.25 }); } }
  // 調べる・メニュー
  if (IN.e.act) interact();
  if (IN.e.reload) tryReload(true);
  poseRyo(PL.h, st, dt);
}
function stepMat(R, x, z, y) { const D = R.D; if (D.stepAt) { const m = D.stepAt(x, z, y); if (m) return m; } return D.step || ({ parquet: 'wood', parquet_d: 'wood', marble: 'marble', tile: 'tile', labfloor: 'tile', stone: 'stone', concrete: 'concrete', carpet: 'carpet', grass: 'grass', gravel: 'stone' }[D.floor || 'parquet'] || 'wood'); }
// ── 構える・撃つ ──
function targets() { return G.en.filter(e => !e.dead && e.hp > 0 && e.targetable !== false); }
function pickTarget() {
  let best = null, bs = 1e9; const fx = Math.sin(PL.ang), fz = Math.cos(PL.ang);
  for (const e of targets()) { const dx = e.x - PL.x, dz = e.z - PL.z, d = hyp(dx, dz); if (d > 14) continue; const a = abs(angDiff(PL.ang, Math.atan2(dx, dz))); if (a > 1.35 && d > 2) continue; if (!lineClear(G.room, PL.x, PL.z, e.x, e.z, PL.y)) continue; const s = d + a * 3; if (s < bs) { bs = s; best = e; } }
  return best;
}
function aimUpdate(dt, cam) {
  const st = PL.st, w = G.eq;
  if (PL.aimT === 0) { PL.tgt = pickTarget(); setWeapon(PL.h, w === 'knife' ? 'knife' : w); }
  PL.aimT += dt; st.mode = 'aim'; st.wid = w; st.recoil = Math.max(0, (st.recoil || 0) - dt * 6); st.slash = Math.max(0, (st.slash || 0) - dt * 4);
  // 向き：スティックを倒していればその方向、離していれば自動で狙う
  if (OPT.ctrl === 'tank') { if (abs(IN.mx) > 0.3) { PL.ang -= IN.mx * 2.2 * dt; PL.tgt = null; } }
  else if (IN.mag > 0.35) { const b = camBasis(cam), dx = b.rx * IN.mx + b.fx * IN.my, dz = b.rz * IN.mx + b.fz * IN.my, ta = Math.atan2(dx, dz); if (!PL.tgt || abs(angDiff(Math.atan2(PL.tgt.x - PL.x, PL.tgt.z - PL.z), ta)) > 0.5) { PL.tgt = null; PL.ang = angTo(PL.ang, ta, 7 * dt); } }
  if (PL.tgt && (PL.tgt.dead || PL.tgt.hp <= 0)) PL.tgt = pickTarget();
  let pitch = 0;
  if (PL.tgt) { const e = PL.tgt, ta = Math.atan2(e.x - PL.x, e.z - PL.z); PL.ang = angTo(PL.ang, ta, 8 * dt); const d = hyp(e.x - PL.x, e.z - PL.z); pitch = Math.atan2((e.y + e.aimY) - (PL.y + 1.35), Math.max(0.6, d)); }
  if (OPT.ctrl === 'tank' && abs(IN.my) > 0.4) pitch = IN.my > 0 ? 0.5 : -0.6;
  PL.pitch += (clamp(pitch, -0.9, 0.7) - PL.pitch) * Math.min(1, dt * 10); st.pitch = PL.pitch;
  if (IN.e.fire && PL.aimT > 0.16 && PL.cd <= 0) fire();
  if (IN.e.reload) tryReload(true);
}
function fire() {
  const w = G.eq, W = WEAP[w]; if (!W) return;
  if (!W.melee) {
    if ((G.mag[w] || 0) <= 0) { if (!tryReload(false)) { AU.sfx('empty'); PL.cd = 0.3; } return; }
    if (!G.inf || w !== 'hg') G.mag[w]--;
  }
  PL.cd = W.cd; G.shots++;
  const st = PL.st; if (W.melee) st.slash = 1; else st.recoil = 1;
  AU.sfx(W.snd, { x: PL.x, z: PL.z, rev: 0.6 });
  const ox = PL.x, oz = PL.z, oy = PL.y + 1.35, fx = Math.sin(PL.ang), fz = Math.cos(PL.ang);
  if (W.melee) { // ナイフ：前の近くを切る
    for (const e of targets()) { const dx = e.x - ox, dz = e.z - oz, d = hyp(dx, dz) - e.rad; if (d < W.range && abs(angDiff(PL.ang, Math.atan2(dx, dz))) < 0.8 && abs(e.y - PL.y) < 1) { damageEnemy(e, W.dmg, { w: 'knife', dist: d, knock: W.knock }); } }
    return;
  }
  if (!W.melee) { muzzle(ox + fx * 0.6, oy + 0.05, oz + fz * 0.6, W.flash); alertRoom(14); if (w === 'sg' || w === 'hg' || w === 'mg') setTimeout(() => AU.sfx('shell', { x: ox, z: oz }), 0); }
  const hits = new Map();
  for (let p = 0; p < W.pellets; p++) {
    const a = PL.ang + (rnd() - 0.5) * 2 * W.spread, pt = PL.pitch + (rnd() - 0.5) * W.spread;
    const dx = Math.sin(a) * Math.cos(pt), dz = Math.cos(a) * Math.cos(pt), dy = Math.sin(pt);
    const hit = rayEnemies(ox, oy, oz, dx, dy, dz, W.range, W.pierce);
    let wallD = W.range; // 壁に当たる所
    for (let s = 0.2; s < W.range; s += 0.2) { const x = ox + dx * s, z = oz + dz * s; if (floorAt(G.room, x, z, PL.y) == null) { wallD = s; break; } }
    for (const hh of hit) { if (hh.t > wallD) continue; const e = hh.e; const fall = W.fall ? clamp(1.4 - hh.t / W.range * 1.1, 0.25, 1.2) : 1; const prev = hits.get(e) || { dmg: 0, t: hh.t, y: hh.y }; prev.dmg += W.dmg * fall; hits.set(e, prev); if (!W.pierce) break; }
    if (!hit.length || hit[0].t > wallD) { if (!W.melee) puff(ox + dx * wallD * 0.98, oy + dy * wallD, oz + dz * wallD * 0.98); }
  }
  for (const [e, h] of hits) damageEnemy(e, h.dmg, { w, dist: h.t, y: h.y, pitch: PL.pitch, burn: W.burn, knock: W.knock });
  if (W.burn && !hits.size) { const d = 6; boom(ox + fx * d, PL.y + 0.3, oz + fz * d, 2.2, 60); }
}
function rayEnemies(ox, oy, oz, dx, dy, dz, range, pierce) {
  const out = []; const h2 = hyp(dx, dz) || 1;
  for (const e of targets()) {
    const ex = e.x - ox, ez = e.z - oz, t = (ex * dx + ez * dz) / (h2 * h2); if (t < 0 || t * h2 > range) continue;
    const cx = ox + dx * t - e.x, cz = oz + dz * t - e.z, d = hyp(cx, cz); if (d > e.rad + 0.12) continue;
    const y = oy + dy * t; if (y < e.y + e.hy[0] - 0.15 || y > e.y + e.hy[1] + 0.15) continue;
    if (!lineClear(G.room, ox, oz, e.x, e.z, PL.y)) continue;
    out.push({ e, t: t * h2, y: y - e.y });
  }
  return out.sort((a, b) => a.t - b.t);
}
function tryReload(manual) {
  const w = G.eq, it = ITEMS[w]; if (!it || !it.ammo) return false;
  const need = it.mag - (G.mag[w] || 0); if (need <= 0) return false; const have = invCount(it.ammo); if (!have) return false;
  PL.reloadT = 0.85; PL.reloadW = w; AU.sfx('reload', { x: PL.x, z: PL.z }); return true;
}
function finishReload() { const w = PL.reloadW, it = ITEMS[w]; if (!it) return; const need = it.mag - (G.mag[w] || 0), have = invCount(it.ammo), k = Math.min(need, have); if (k > 0) { invTake(it.ammo, k); G.mag[w] = (G.mag[w] || 0) + k; } }
// ── 当たったとき ──
function hurtPlayer(dmg, fromX, fromZ, o = {}) {
  if (PL.dead || PL.inv > 0) return false;
  PL.hp = Math.max(0, PL.hp - dmg); PL.inv = o.inv != null ? o.inv : 0.6; G.redT = 0.35;
  const dx = PL.x - fromX, dz = PL.z - fromZ, d = hyp(dx, dz) || 1; PL.kb = [dx / d * (o.kb || 2.5), dz / d * (o.kb || 2.5)]; PL.hurtT = o.stun || 0.35;
  if (PL.aimT) { PL.aimT = 0; setWeapon(PL.h, null); }
  AU.sfx('hurt', { x: PL.x, z: PL.z }); bleed(PL.x, PL.y + 1.2, PL.z, 6);
  if (o.poison) PL.poison = true;
  if (PL.hp <= 0) killPlayer(o.why);
  return true;
}
function killPlayer(why) { if (PL.dead) return; PL.dead = true; PL.grab = null; PL.st.deadT = 0; PL.st.dead = true; AU.sfx('die', { x: PL.x, z: PL.z }); G.deathT = 0; G.deathWhy = why; }
// ── 小さな見た目（火花・血・閃光） ──
function muzzle(x, y, z, k) { const L = new THREE.PointLight('#ffd27a', 18 * k, 7, 1.5); L.position.set(x, y, z); G.room.scene.add(L); const s = new THREE.Mesh(new THREE.SphereGeometry(0.08 * k, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff0b0' })); s.position.set(x, y, z); G.room.scene.add(s); G.fx.push({ o: L, life: 0.06, light: true }, { o: s, life: 0.04 }); }
const FXG = { box: new THREE.BoxGeometry(0.04, 0.04, 0.04) };
function particles(x, y, z, n, col, spd = 2, life = 0.6, grav = 9) { const m = new THREE.MeshBasicMaterial({ color: col }); for (let i = 0; i < n; i++) { const o = new THREE.Mesh(FXG.box, m); o.position.set(x, y, z); G.room.scene.add(o); G.fx.push({ o, v: [(rnd() - 0.5) * spd, rnd() * spd * 0.8, (rnd() - 0.5) * spd], life: life * (0.6 + rnd() * 0.6), g: grav }); } }
function bleed(x, y, z, n = 8) { particles(x, y, z, n, '#6a0008', 2.4, 0.7); }
function puff(x, y, z) { particles(x, y, z, 4, '#a8a090', 1.2, 0.35, 2); }
function boom(x, y, z, rad, dmg) { AU.sfx('boom', { x, z }); particles(x, y + 0.3, z, 30, '#ff8a20', 5, 0.8, 4); const L = new THREE.PointLight('#ff8030', 40, 10, 1.4); L.position.set(x, y + 1, z); G.room.scene.add(L); G.fx.push({ o: L, life: 0.4, light: true }); for (const e of targets()) { const d = hyp(e.x - x, e.z - z); if (d < rad) damageEnemy(e, dmg * (1 - d / rad * 0.5), { w: 'gl', burn: true, knock: 1 }); } }
function updFx(dt) {
  for (const f of G.fx) { f.life -= dt; if (f.v) { f.v[1] -= f.g * dt; f.o.position.x += f.v[0] * dt; f.o.position.y += f.v[1] * dt; f.o.position.z += f.v[2] * dt; if (f.o.position.y < PL.y + 0.02 && f.v[1] < 0) { f.o.position.y = Math.max(f.o.position.y, 0.02); f.v[0] *= 0.5; f.v[2] *= 0.5; f.v[1] = 0; } } if (f.light) f.o.intensity *= 0.7; if (f.life <= 0) G.room.scene.remove(f.o); }
  G.fx = G.fx.filter(f => f.life > 0);
}
// ── 調べる ──
function interact() {
  const R = G.room, fx = Math.sin(PL.ang), fz = Math.cos(PL.ang); let best = null, bp = 9, bd = 9;
  const consider = (pri, d, o) => { if (pri < bp || (pri === bp && d < bd)) { best = o; bp = pri; bd = d; } };
  for (const p of R.pick) { const dx = p.x - PL.x, dz = p.z - PL.z, d = hyp(dx, dz); if (d < 1.05 && abs(p.y - PL.y) < 1.4 && (d < 0.5 || (dx * fx + dz * fz) / d > 0.35)) consider(0, d, { k: 'pick', p }); }
  for (const a of R.acts) { if (a.cond && !condOK(a.cond)) continue; const dx = a.p[0] - PL.x, dz = a.p[1] - PL.z, d = hyp(dx, dz); if (d < a.r && abs((a.y || 0) - PL.y) < 1.2 && (d < 0.45 || (dx * fx + dz * fz) / d > 0.25)) consider(1, d, { k: 'act', a }); }
  for (const dr of R.doors) { const dx = dr.pos[0] - PL.x, dz = dr.pos[1] - PL.z, d = hyp(dx, dz); if (d < 1.15 && abs(dr.y - PL.y) < 0.8 && (fx * -dr.n[0] + fz * -dr.n[1]) > 0.45) consider(2, d, { k: 'door', d: dr }); }
  for (const l of R.looks) { if (l.cond && !condOK(l.cond)) continue; const dx = l.p[0] - PL.x, dz = l.p[1] - PL.z, d = hyp(dx, dz); if (d < l.r && abs((l.y || 0) - PL.y) < 1.2 && (d < 0.4 || (dx * fx + dz * fz) / d > 0.3)) consider(3, d, { k: 'look', l }); }
  if (!best) return;
  if (best.k === 'pick') pickupPrompt(best.p);
  else if (best.k === 'act') doAct(best.a);
  else if (best.k === 'door') useDoor(best.d);
  else { const t = typeof best.l.t === 'function' ? best.l.t() : best.l.t; if (t) say(t); }
}
function pickupPrompt(p) {
  const id = p.id;
  if (id === 'file') { takePickup(p); G.files.push(p.file); AU.sfx('pick'); say(`「${FILES[p.file].t}」を見つけた。`, () => openFile(p.file)); return; }
  if (id === 'map') { takePickup(p); G.maps[p.map] = true; AU.sfx('pick'); say(`${FLOORS[p.map]}の地図を手に入れた。`); return; }
  const it = ITEMS[id], n = p.n || 1, nm = it.name + (it.stack ? `（${n}）` : '');
  ask(`${nm}がある。\n拾いますか？`, ['はい', 'いいえ'], i => {
    if (i !== 0) return;
    if (!canFit(id, n)) { say('持ち物がいっぱいで、これ以上持てない。'); return; }
    PL.actT = 0.45; PL.st.mode = 'pick'; PL.st.mt = 0; PL.actCb = () => { invAdd(id, n); takePickup(p); AU.sfx('pick'); itemGet(id, n); storyPick(p.key, id); };
  });
}
function takePickup(p) { G.taken[p.key] = true; const R = G.room; R.scene.remove(p.mdl); R.pick = R.pick.filter(q => q !== p); if (G.drops && G.drops[p.key]) delete G.drops[p.key]; }
// ── 扉 ──
function doorPair(rid, d) { return [rid + ':' + d.id, d.to ? d.to[0] + ':' + d.to[1] : ''].sort().join('|'); }
function useDoor(d) {
  const R = G.room, L = d.lock, key = doorPair(R.id, d);
  if (L && !G.open[key]) {
    if (L.story) { AU.sfx('locked', { x: d.pos[0], z: d.pos[1] }); say(typeof L.story === 'function' ? L.story() : L.story); return; }
    if (L.flag) { if (condOK(L.flag)) { G.open[key] = true; } else { AU.sfx('locked'); say(L.msg || '開かない。'); return; } }
    else if (L.bar === 'other') { AU.sfx('locked'); say(L.msg || '向こう側から、かんぬきが掛かっている。'); return; }
    else if (L.bar === 'this') { ask(L.msg || 'かんぬきが掛かっている。外しますか？', ['はい', 'いいえ'], i => { if (i) return; G.open[key] = true; AU.sfx('unlock'); say('かんぬきを外した。'); }); return; }
    else if (L.key) {
      const kid = Object.keys(ITEMS).find(k => ITEMS[k].lock === L.key);
      if (invHas(kid)) { G.open[key] = true; AU.sfx('unlock'); say(`${ITEMS[kid].name}を使った。`); storyUnlock(R.id, d.id, kid); return; }
      AU.sfx('locked', { x: d.pos[0], z: d.pos[1] }); G.lockSeen[key] = true;
      say(L.msg || { hawk: '鍵がかかっている。\n鍵穴の上に、鷹の紋章が彫られている。', snake: '鍵がかかっている。\n鍵穴の上に、蛇の紋章が彫られている。', wolf: '鍵がかかっている。\n硝子越しに、緑の葉が見える。取っ手に狼の紋章。', base: '鍵がかかっている。錆びた大きな錠前だ。', id: '扉の横に、カード読み取り機がある。' }[L.key] || '鍵がかかっている。'); return;
    }
  }
  if (!d.to) { say('開かない。'); return; }
  doorGo(d);
}
function doorGo(d) {
  const [rid, did] = d.to; G.mode = 'door'; G.doorFx = startDoorFx(d.type || 'wood', d.fx);
  G.doorFx.mid = () => { const D2 = ROOMS[rid], dd = D2.doors.find(x => x.id === did); enterRoomAtDoor(rid, did); };
}
function enterRoomAtDoor(rid, did) {
  const R0 = buildRoomDoorsOnly(rid), dd = R0.find(x => x.id === did);
  const sp = dd ? { x: dd.spawn[0], z: dd.spawn[1], y: dd.y, ang: dd.ang } : { x: 0, z: 0 };
  enterRoom(rid, sp);
}
// 扉の位置だけ先に求める（部屋を作る前）
function buildRoomDoorsOnly(rid) {
  const D = ROOMS[rid], rects = D.rects || [[-D.w / 2, -D.d / 2, D.w / 2, D.d / 2]], segs = boundary(rects);
  return (D.doors || []).map(d => { const s = onSeg(segs, d.p[0], d.p[1]); if (!s) return null; const horiz = s.a[1] === s.b[1], t = horiz ? d.p[0] : d.p[1], pos = [horiz ? t : s.a[0], horiz ? s.a[1] : t]; return { id: d.id, spawn: [pos[0] + s.n[0] * 0.75, pos[1] + s.n[1] * 0.75], y: d.y || 0, ang: Math.atan2(s.n[0], s.n[1]) }; }).filter(Boolean);
}
// ── 部屋の時間（灯りのゆらぎ・雷・敵・出来事） ──
function updRoom(dt) {
  const R = G.room; R.t += dt;
  for (const l of R.lights) { if (l.fl) { const n = Math.sin(R.t * 13 + l.ph) * 0.5 + Math.sin(R.t * 7.3 + l.ph * 2) * 0.5; let k = 1 + n * l.fl; if (l.fl > 0.2 && Math.sin(R.t * 0.7 + l.ph) > 0.97) k *= 0.2; l.L.intensity = l.base * k; } }
  for (const f of R.anims) f(R.t, dt);
  for (const w of R.wins) if (w.rainM) w.rainM.map.offset.y += dt * 1.6;
  // 雷
  if (R.wins.length || R.D.thunder) { R.lightningT -= dt; if (R.lightningT <= 0) { R.lightningT = 9 + rnd() * 14; R.flashT = 0.25; AU.sfx('thunder', { delay: 0.4 + rnd() * 1.6, v: R.wins.length ? 1 : 0.5 }); } }
  if (R.flashT > 0) { R.flashT -= dt; const k = R.flashT > 0.12 ? 1 : (R.flashT > 0.06 ? 0.2 : 0.8); for (const w of R.wins) w.outM.color.copy(w.base).multiplyScalar(1 + k * 3.5); R.ambient.intensity = (R.D.amb ? R.D.amb[1] : 0.6) * (1 + k * (R.wins.length ? 2.2 : 0.4)); if (R.flashT <= 0) { for (const w of R.wins) w.outM.color.copy(w.base); R.ambient.intensity = R.D.amb ? R.D.amb[1] : 0.6; } }
}
function alertRoom(r) { for (const e of G.en) if (!e.dead && hyp(e.x - PL.x, e.z - PL.z) < r) e.alert = true; }

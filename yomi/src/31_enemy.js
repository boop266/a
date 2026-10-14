// 黄泉還：化け物たち（ゾンビ・犬・蜘蛛・庭師・狩人・ヨミ）
const ESPEC = {
  zombie: { hp: 72, rad: 0.32, hy: [0, 1.75], aimY: 1.3, model: 'servant' },
  crawler: { hp: 45, rad: 0.36, hy: [0, 0.55], aimY: 0.25, model: 'worker' },
  dog: { hp: 36, rad: 0.36, hy: [0, 0.85], aimY: 0.5 },
  spider: { hp: 110, rad: 0.62, hy: [0, 1.0], aimY: 0.55 },
  brute: { hp: 520, rad: 0.48, hy: [0, 2.3], aimY: 1.7, model: 'gardener' },
  hunter: { hp: 170, rad: 0.38, hy: [0, 1.6], aimY: 1.0, model: 'hunter' },
  boss1: { hp: 950, rad: 0.58, hy: [0, 2.7], aimY: 1.9, model: 'boss' },
  boss2: { hp: 700, rad: 0.58, hy: [0, 2.7], aimY: 1.9, model: 'boss' },
};
function spawnEnemy(R, d) {
  const S = ESPEC[d.t]; let h;
  if (d.t === 'dog') h = makeDog(); else if (d.t === 'spider') h = makeSpider(); else h = makeHuman(d.k || S.model);
  const e = { def: d, type: d.t, key: d.key, h, x: d.x, z: d.z, y: d.y != null ? d.y : (floorAt(R, d.x, d.z, 0) ?? 0), ang: d.r != null ? d.r : rnd() * TAU, rad: S.rad, hy: S.hy, aimY: S.aimY,
    hp: d.hp || S.hp, max: d.hp || S.hp, state: d.st || 'idle', anim: 'idle', at: 0, t: 0, seed: rnd() * 100, spd: d.spd || (0.55 + rnd() * 0.4), cd: 0.8 + rnd(), alert: !!d.alert, path: null, pathT: 0, hitT: 0, stag: 0, groanT: 2 + rnd() * 5, sense: d.sense || 9 };
  if (d.t === 'zombie' || d.t === 'crawler') e.anim = { eat: 'eat', lie: 'lie', crawl: 'crawl', sit: 'sit' }[e.state] || 'idle';
  if (d.t === 'crawler') { e.state = 'crawl'; e.anim = 'crawl'; e.spd = 0.4; }
  if (d.t === 'brute') { setWeapon(h, 'shears'); e.spd = 1.25; }
  if (d.t === 'hunter') e.spd = 3.9;
  if (d.t === 'boss1' || d.t === 'boss2') e.spd = d.t === 'boss1' ? 1.15 : 1.9;
  // 隠れている敵（衣装棚・培養槽・水槽の中）：出来事がもう起きていれば、外に出た姿で置く（定義は書きかえない）
  const shown = d.hidden && d.revealIf && condOK(d.revealIf);
  if (d.hidden && !shown) { h.root.visible = false; e.targetable = false; e.solid = false; }
  if (shown) { e.revealed = true; e.alert = true; if (d.revealAt) { e.x = d.revealAt[0]; e.z = d.revealAt[1]; e.y = floorAt(R, e.x, e.z, e.y) ?? e.y; } const st = { zombie: ['chase', 'walk'], hunter: ['run', 'hunt'], boss1: ['walk', 'walk'] }[d.t] || ['idle', 'idle']; e.state = st[0]; e.anim = st[1]; }
  h.root.position.set(e.x, e.y, e.z); h.root.rotation.y = e.ang; R.scene.add(h.root);
  e.sh = blobShadow(d.t === 'spider' ? 0.8 : d.t.startsWith('boss') || d.t === 'brute' ? 0.65 : 0.42); e.sh.position.set(e.x, e.y + 0.012, e.z); R.scene.add(e.sh);
  for (let i = 0; i < 6; i++) pose(e, 0.1); // 最初の姿勢になじませる
  return e;
}
function pose(e, dt) {
  if (e.type === 'dog') poseDog(e.h, e, dt); else if (e.type === 'spider') poseSpider(e.h, e, dt); else poseZombie(e.h, e, dt);
}
function addCorpse(R, c) { const m = c.kind === 'dog' ? (() => { const d = makeDog(); poseDog(d, { anim: 'dead', t: 0, seed: 0 }, 10); return d.root; })() : c.kind === 'spider' ? (() => { const s = makeSpider(); poseSpider(s, { anim: 'dead', t: 0, seed: 0 }, 1); return s.root; })() : makeCorpse(c.model || 'servant', 'back'); m.position.set(c.x, c.y || 0, c.z); m.rotation.y = c.ang; if (c.nohead) m.traverse(o => { }); R.scene.add(m); }
// ── 動き：まっすぐ行けるなら直に、行けなければ道を探す ──
function chase(e, dt, speed, tx = PL.x, tz = PL.z, turn = 2.6) {
  const R = G.room, d = hyp(tx - e.x, tz - e.z); let ax = tx, az = tz;
  if (!lineClear(R, e.x, e.z, tx, tz, e.y) || d > 7) {
    e.pathT -= dt; if (!e.path || e.pathT <= 0) { e.path = findPath(R, e.x, e.z, e.y, tx, tz, e.rad); e.pathT = 0.7 + rnd() * 0.3; }
    if (e.path) { while (e.path.length > 1 && hyp(e.path[0][0] - e.x, e.path[0][1] - e.z) < 0.3) e.path.shift(); if (e.path.length) { ax = e.path[0][0]; az = e.path[0][1]; } }
  } else e.path = null;
  const ta = Math.atan2(ax - e.x, az - e.z); e.ang = angTo(e.ang, ta, turn * dt);
  if (abs(angDiff(e.ang, ta)) < 1.1) { const r = moveActor(R, e, Math.sin(e.ang) * speed * dt, Math.cos(e.ang) * speed * dt, 'enemy'); if (!r) e.path = null; return !!r; }
  return false;
}
function facePlayer(e, dt, rate = 4) { e.ang = angTo(e.ang, Math.atan2(PL.x - e.x, PL.z - e.z), rate * dt); }
function sees(e, d) { return d < e.sense && lineClear(G.room, e.x, e.z, PL.x, PL.z, e.y); }
// ── 毎こま ──
function updEnemies(dt) {
  for (const e of G.en) updEnemy(e, dt);
  for (let i = 0; i < G.en.length; i++) for (let j = i + 1; j < G.en.length; j++) { const a = G.en[i], b = G.en[j]; if (a.dead || b.dead || a.solid === false || b.solid === false) continue; const dx = b.x - a.x, dz = b.z - a.z, d = hyp(dx, dz), m = (a.rad + b.rad) * 0.9; if (d < m && d > 1e-4) { const k = (m - d) / 2 / d; moveActor(G.room, a, -dx * k, -dz * k, 'enemy'); moveActor(G.room, b, dx * k, dz * k, 'enemy'); } }
  for (const p of G.proj || []) { p.life -= dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt; p.vy -= 4 * dt; p.m.position.set(p.x, p.y, p.z); if (hyp(p.x - PL.x, p.z - PL.z) < 0.45 && p.y > PL.y && p.y < PL.y + 1.8 && !PL.dead) { hurtPlayer(9, p.x - p.vx, p.z - p.vz, { poison: true, kb: 1.5 }); p.life = 0; } if (floorAt(G.room, p.x, p.z, PL.y) == null || p.y < PL.y) p.life = 0; if (p.life <= 0) { G.room.scene.remove(p.m); particles(p.x, p.y, p.z, 5, '#8aa020', 1.5, 0.4); } }
  if (G.proj) G.proj = G.proj.filter(p => p.life > 0);
}
function updEnemy(e, dt) {
  e.t += dt; e.at += dt; e.hitT = Math.max(0, e.hitT - dt * 3); e.cd -= dt;
  if (e.burn > 0) { e.burn -= dt; if (!e.dead) { e.hp -= 22 * dt; if (rnd() < dt * 12) particles(e.x, e.y + 1, e.z, 1, '#ff7a20', 1, 0.5, -1); if (e.hp <= 0) killEnemy(e, { w: 'gl' }); } }
  if (e.dead) { if (e.anim !== 'dead') e.anim = 'dead'; pose(e, dt); place(); return; }
  if (e.def.hidden && !e.revealed) return;
  const dx = PL.x - e.x, dz = PL.z - e.z, d = hyp(dx, dz);
  if (!e.alert && !e.script && (sees(e, d) && d < 6.5 || d < 2.0 || (PL.st.mode === 'run' && d < 5.5))) { e.alert = true; if (e.type === 'zombie') AU.sfx('groan', { x: e.x, z: e.z, v: 1.2 }); }
  if (!e.dead && (e.type === 'zombie' || e.type === 'crawler')) { e.groanT -= dt; if (e.groanT <= 0) { e.groanT = 3 + rnd() * 6; if (d < 14) AU.sfx('groan', { x: e.x, z: e.z, v: e.alert ? 1 : 0.6 }); } }
  if (!e.script) AI[e.type](e, dt, d);
  unstick(e, dt);
  pose(e, dt); place();
  function place() { e.h.root.position.set(e.x, e.y, e.z); e.h.root.rotation.y = e.ang; if (e.sh) { e.sh.position.set(e.x, e.y + 0.012, e.z); e.sh.visible = e.h.root.visible; } }
}
// 家具や壁に体が食いこんでいるとき（椅子に座っていた・衣装棚から出た など）：立ち上がったら、いちばん近い立てる所へ歩み出る
function unstick(e, dt) {
  if (e.script || ['sit', 'lie', 'eat', 'idle', 'crouch', 'down'].includes(e.state)) return;
  if (e.unT == null || e.t - e.unT > 0.5) { e.unT = e.t; e.unTo = null; if (standAt(G.room, e.x, e.z, e.y, e.rad, 'enemy') == null) { for (let r = 0.05; r <= 1.0 && !e.unTo; r += 0.05) for (let k = 0; k < 16; k++) { const a = e.ang + k / 16 * TAU, x = e.x + Math.sin(a) * r, z = e.z + Math.cos(a) * r; if (standAt(G.room, x, z, e.y, e.rad, 'enemy') != null) { e.unTo = [x, z]; break; } } } }
  if (!e.unTo) return; const dx = e.unTo[0] - e.x, dz = e.unTo[1] - e.z, dd = hyp(dx, dz), st = Math.min(dd, 1.6 * dt);
  if (dd < 1e-3) { e.unTo = null; return; } e.x += dx / dd * st; e.z += dz / dd * st; const y = floorAt(G.room, e.x, e.z, e.y); if (y != null) e.y = y;
}
function setState(e, s, anim) { e.state = s; e.at = 0; if (anim) e.anim = anim; }
const AI = {
  zombie(e, dt, d) {
    switch (e.state) {
      case 'idle': case 'sit': e.anim = e.state === 'sit' ? 'sit' : 'idle'; if (e.alert) setState(e, e.state === 'sit' ? 'rise' : 'chase', e.state === 'sit' ? 'rise' : 'walk'); break;
      case 'eat': e.anim = 'eat'; if (e.alert) { setState(e, 'turn', 'turn'); AU.sfx('groan', { x: e.x, z: e.z, v: 1.3 }); } break;
      case 'turn': e.ty = clamp(angDiff(e.ang, Math.atan2(PL.x - e.x, PL.z - e.z)), -2.3, 2.3); if (e.at > 1.6) { e.ang += e.ty * 0.5; setState(e, 'rise', 'rise'); } break;
      case 'lie': e.anim = 'lie'; if (e.alert && d < 2.2) { setState(e, 'rise', 'rise'); AU.sfx('moan2', { x: e.x, z: e.z }); } break;
      case 'down': e.anim = 'down'; if (e.at > 1.9) setState(e, 'rise', 'rise'); break;
      case 'rise': e.anim = 'rise'; if (e.at > 1.1) setState(e, 'chase', 'walk'); break;
      case 'feed': e.anim = 'eat'; facePlayer(e, dt, 2); break; // 倒れた主人公に、かがみこむ
      case 'chase': {
        if (PL.dead && d < 1.7) { setState(e, 'feed', 'eat'); if (rnd() < 0.5) AU.sfx('flesh', { x: e.x, z: e.z }); break; }
        e.anim = d < 2.2 ? 'reach' : 'walk';
        if (e.hitT > 0.35) break; // よろけている間は止まる
        const facing = abs(angDiff(e.ang, Math.atan2(PL.x - e.x, PL.z - e.z)));
        if (d < 0.82 && facing < 0.75 && e.cd <= 0 && !PL.grab && PL.inv <= 0 && !PL.dead && abs(PL.y - e.y) < 0.5) { setState(e, 'grab', 'grab'); PL.grab = e; PL.grabMash = 0; e.hold = 0; PL.ang = Math.atan2(e.x - PL.x, e.z - PL.z); if (PL.aimT) { PL.aimT = 0; setWeapon(PL.h, null); } AU.sfx('groan', { x: e.x, z: e.z, v: 1.5 }); break; }
        if (d > 0.7) chase(e, dt, e.spd * (e.lunge ? 1.6 : 1)); else facePlayer(e, dt);
        break; }
      case 'grab': {
        e.hold += dt; facePlayer(e, dt, 10);
        const ox = e.x + Math.sin(e.ang) * 0.6, oz = e.z + Math.cos(e.ang) * 0.6; PL.x += (ox - PL.x) * 0.2; PL.z += (oz - PL.z) * 0.2;
        if (PL.grabMash >= 7) { PL.grab = null; PL.grabMash = 0; setState(e, 'chase', 'stagger'); e.hitT = 1; e.cd = 1.8; moveActor(G.room, e, -Math.sin(e.ang) * 0.6, -Math.cos(e.ang) * 0.6, 'enemy'); AU.sfx('grunt', { x: PL.x, z: PL.z }); break; }
        if (e.hold > 1.15) { PL.grab = null; AU.sfx('bite', { x: e.x, z: e.z }); hurtPlayer(20, e.x, e.z, { kb: 3.2, inv: 1.3, stun: 0.5, why: 'bite' }); setState(e, 'chase', 'walk'); e.cd = 2.6; }
        break; }
    }
  },
  crawler(e, dt, d) {
    if (e.state === 'down') { if (e.at > 1.5) setState(e, 'crawl', 'crawl'); return; }
    e.anim = 'crawl'; if (!e.alert) return;
    if (d < 0.8 && e.cd <= 0 && !PL.dead && PL.inv <= 0) { e.cd = 2.2; AU.sfx('bite', { x: e.x, z: e.z }); hurtPlayer(11, e.x, e.z, { kb: 1.5, stun: 0.4, why: 'bite' }); return; }
    if (d > 0.6) chase(e, dt, e.spd, PL.x, PL.z, 1.8);
  },
  dog(e, dt, d) {
    switch (e.state) {
      case 'idle': e.anim = 'idle'; if (e.alert) { setState(e, 'run', 'run'); AU.sfx('bark', { x: e.x, z: e.z }); } break;
      case 'window': { // 窓から飛び込む
        e.anim = 'lunge'; const k = Math.min(1, e.at / 0.55); e.x = lerp(e.wx0, e.wx1, k); e.z = lerp(e.wz0, e.wz1, k); e.y = Math.sin(k * PI) * 0.8;
        if (k >= 1) { e.y = 0; setState(e, 'run', 'run'); e.alert = true; } break; }
      case 'run': e.anim = 'run';
        if (d < 2.6 && d > 1.0 && e.cd <= 0 && sees(e, d)) { setState(e, 'lunge', 'lunge'); e.lx = Math.sin(e.ang); e.lz = Math.cos(e.ang); AU.sfx('bark', { x: e.x, z: e.z }); break; }
        if (d < 1.0 && e.cd <= 0) { e.cd = 1.2; setState(e, 'bite', 'bite'); break; }
        chase(e, dt, 5.0, PL.x, PL.z, 6); break;
      case 'lunge': { facePlayer(e, dt, 2); moveActor(G.room, e, e.lx * 6.5 * dt, e.lz * 6.5 * dt, 'enemy'); if (d < 0.75 && !e.hitDone) { e.hitDone = true; hurtPlayer(12, e.x, e.z, { kb: 3, stun: 0.45, why: 'dog' }); } if (e.at > 0.38) { e.hitDone = false; e.cd = 1.4 + rnd(); setState(e, 'back', 'run'); } break; }
      case 'bite': facePlayer(e, dt, 8); if (e.at > 0.35 && !e.hitDone) { e.hitDone = true; if (d < 1.05) hurtPlayer(9, e.x, e.z, { kb: 2, stun: 0.3, why: 'dog' }); } if (e.at > 0.6) { e.hitDone = false; setState(e, 'back', 'run'); } break;
      case 'back': e.anim = 'run'; { const a = Math.atan2(e.x - PL.x, e.z - PL.z) + (e.seed % 2 > 1 ? 0.9 : -0.9); e.ang = angTo(e.ang, a, 7 * dt); moveActor(G.room, e, Math.sin(e.ang) * 4.2 * dt, Math.cos(e.ang) * 4.2 * dt, 'enemy'); if (e.at > 0.55) setState(e, 'run', 'run'); } break;
      case 'hit': e.anim = 'run'; if (e.at > 0.3) setState(e, 'run', 'run'); break;
    }
  },
  spider(e, dt, d) {
    switch (e.state) {
      case 'idle': e.anim = 'idle'; if (e.alert) { setState(e, 'walk', 'walk'); AU.sfx('hiss', { x: e.x, z: e.z }); } break;
      case 'walk': e.anim = 'walk'; if (rnd() < dt * 2) AU.sfx('skitter', { x: e.x, z: e.z, vol: 0.6 });
        if (d < 1.3 && e.cd <= 0) { setState(e, 'bite', 'spit'); e.cd = 1.6; break; }
        if (d > 3 && d < 7.5 && e.cd <= 0 && sees(e, d)) { setState(e, 'spit', 'spit'); e.cd = 3 + rnd() * 1.5; break; }
        chase(e, dt, 1.25, PL.x, PL.z, 2.2); break;
      case 'spit': facePlayer(e, dt, 5); if (e.at > 0.45 && !e.fired) { e.fired = true; AU.sfx('spit', { x: e.x, z: e.z }); spit(e); } if (e.at > 0.9) { e.fired = false; setState(e, 'walk', 'walk'); } break;
      case 'bite': facePlayer(e, dt, 5); if (e.at > 0.35 && !e.fired) { e.fired = true; if (d < 1.5) { AU.sfx('bite', { x: e.x, z: e.z }); hurtPlayer(15, e.x, e.z, { kb: 2.5, poison: rnd() < 0.5, why: 'spider' }); } } if (e.at > 0.8) { e.fired = false; setState(e, 'walk', 'walk'); } break;
    }
  },
  brute(e, dt, d) {
    switch (e.state) {
      case 'idle': e.anim = 'idle'; if (e.alert) setState(e, 'walk', 'walk'); break;
      case 'walk': e.anim = 'walk';
        if (d < 2.1 && e.cd <= 0) { setState(e, 'windup', 'windup'); AU.sfx('grunt', { x: e.x, z: e.z }); break; }
        if (d > 4.5 && d < 9 && e.cd <= -1.5 && sees(e, d)) { setState(e, 'charge', 'hunt'); AU.sfx('roar', { x: e.x, z: e.z, vol: 0.7 }); e.cx = Math.sin(e.ang); e.cz = Math.cos(e.ang); break; }
        chase(e, dt, e.spd, PL.x, PL.z, 2.0); break;
      case 'windup': facePlayer(e, dt, 3.5); if (e.at > 0.62) { setState(e, 'swing', 'swing'); AU.sfx('swing', { x: e.x, z: e.z }); const a = abs(angDiff(e.ang, Math.atan2(PL.x - e.x, PL.z - e.z))); if (d < 2.3 && a < 1.0) hurtPlayer(30, e.x, e.z, { kb: 4.5, stun: 0.6, why: 'brute' }); } break;
      case 'swing': if (e.at > 0.7) { e.cd = 1.2; setState(e, 'walk', 'walk'); } break;
      case 'charge': { facePlayer(e, dt, 1.2); e.anim = 'hunt'; e.spd2 = 4.6; const r = moveActor(G.room, e, Math.sin(e.ang) * 4.6 * dt, Math.cos(e.ang) * 4.6 * dt, 'enemy'); if (d < 1.0 && !e.hitDone) { e.hitDone = true; hurtPlayer(26, e.x, e.z, { kb: 5, stun: 0.7, why: 'brute' }); } if (e.at > 1.1 || !r) { e.hitDone = false; e.cd = 1.5; setState(e, 'walk', 'walk'); } break; }
      case 'stagger': e.anim = 'stagger'; if (e.at > 0.7) setState(e, 'walk', 'walk'); break;
    }
  },
  hunter(e, dt, d) {
    switch (e.state) {
      case 'idle': e.anim = 'crouch'; if (e.alert) { setState(e, 'run', 'hunt'); AU.sfx('screech', { x: e.x, z: e.z }); } break;
      case 'run': e.anim = 'hunt';
        if (d < 1.7 && e.cd <= 0) { setState(e, 'windup', 'windup'); break; }
        if (d > 3.2 && d < 6.5 && e.cd <= -0.5 && sees(e, d) && rnd() < dt * 3) { setState(e, 'crouch', 'crouch'); break; }
        chase(e, dt, e.spd, PL.x, PL.z, 5); break;
      case 'crouch': facePlayer(e, dt, 6); if (e.at > 0.38) { setState(e, 'leap', 'leap'); AU.sfx('screech', { x: e.x, z: e.z }); e.lx = Math.sin(e.ang); e.lz = Math.cos(e.ang); e.ld = Math.min(d - 0.6, 6); } break;
      case 'leap': { const k = Math.min(1, e.at / 0.5); moveActor(G.room, e, e.lx * e.ld / 0.5 * dt, e.lz * e.ld / 0.5 * dt, 'enemy'); e.h.body.position.y = Math.sin(k * PI) * 0.9; if (d < 0.95 && !e.hitDone) { e.hitDone = true; hurtPlayer(24, e.x, e.z, { kb: 4, stun: 0.5, why: 'hunter' }); } if (k >= 1) { e.h.body.position.y = 0; e.hitDone = false; e.cd = 1.2; setState(e, 'run', 'hunt'); } break; }
      case 'windup': facePlayer(e, dt, 6); e.anim = 'windup'; if (e.at > 0.36) { setState(e, 'slash', 'slash'); AU.sfx('swing', { x: e.x, z: e.z }); const a = abs(angDiff(e.ang, Math.atan2(PL.x - e.x, PL.z - e.z))); if (d < 1.85 && a < 1.0) { if (PL.hp <= 33 && rnd() < 0.5 && !PL.dead) { PL.hp = 0; bleed(PL.x, PL.y + 1.6, PL.z, 30); killPlayer('head'); } else hurtPlayer(22, e.x, e.z, { kb: 3, stun: 0.45, why: 'hunter' }); } } break;
      case 'slash': e.anim = 'slash'; if (e.at > 0.5) { e.cd = 0.9 + rnd() * 0.6; setState(e, 'run', 'hunt'); } break;
      case 'stagger': e.anim = 'stagger'; if (e.at > 0.5) setState(e, 'run', 'hunt'); break;
    }
  },
  boss1(e, dt, d) { AI.boss(e, dt, d, 1); }, boss2(e, dt, d) { AI.boss(e, dt, d, 2); },
  boss(e, dt, d, ph) {
    const fast = e.hp < e.max * 0.5 ? 1.45 : 1;
    switch (e.state) {
      case 'idle': e.anim = 'idle'; if (e.alert) { setState(e, 'roar', 'roar'); AU.sfx('roar', { x: e.x, z: e.z }); } break;
      case 'roar': e.anim = 'roar'; facePlayer(e, dt, 2); if (e.at > 1.6) setState(e, 'walk', 'walk'); break;
      case 'walk': e.anim = 'walk';
        if (d < 2.5 && e.cd <= 0) { setState(e, 'windup', 'windup'); AU.sfx('grunt', { x: e.x, z: e.z }); break; }
        if (d > 4 && d < 9 && e.cd <= -1 && sees(e, d) && rnd() < dt * 1.5) { setState(e, 'brace', 'roar'); AU.sfx('roar', { x: e.x, z: e.z, vol: 0.6 }); break; }
        chase(e, dt, e.spd * fast, PL.x, PL.z, 2.2 * fast); break;
      // 突進の前に、立ち止まって身構え、吠える（見てから横へよければ、かわせる。撃ってひるませれば止まる）
      case 'brace': facePlayer(e, dt, 3); if (e.at > 0.5 / fast) { setState(e, 'lunge', 'hunt'); e.lx = Math.sin(e.ang); e.lz = Math.cos(e.ang); } break;
      case 'windup': facePlayer(e, dt, 3); if (e.at > 0.72 / fast) { setState(e, 'swing', 'swing'); AU.sfx('swing', { x: e.x, z: e.z }); const a = abs(angDiff(e.ang, Math.atan2(PL.x - e.x, PL.z - e.z))); if (d < 2.6 && a < 1.1) hurtPlayer(ph === 1 ? 32 : 36, e.x, e.z, { kb: 5, stun: 0.7, why: 'boss' }); } break;
      case 'swing': if (e.at > 0.75) { e.cd = 1.1 / fast; setState(e, 'walk', 'walk'); } break;
      case 'lunge': { facePlayer(e, dt, 0.8); e.anim = 'hunt'; moveActor(G.room, e, Math.sin(e.ang) * 6.5 * dt, Math.cos(e.ang) * 6.5 * dt, 'enemy'); if (d < 1.2 && !e.hitDone) { e.hitDone = true; hurtPlayer(28, e.x, e.z, { kb: 6, stun: 0.8, why: 'boss' }); } if (e.at > 0.6) { e.hitDone = false; e.cd = 1.6; setState(e, 'walk', 'walk'); } break; }
      case 'stagger': e.anim = 'stagger'; if (e.at > 0.8) setState(e, 'walk', 'walk'); break;
    }
  },
};
function spit(e) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshBasicMaterial({ color: '#a8c030' })); const sx = e.x + Math.sin(e.ang) * 0.5, sz = e.z + Math.cos(e.ang) * 0.5; const dx = PL.x - sx, dz = PL.z - sz, d = hyp(dx, dz) || 1, t = d / 7.5; m.position.set(sx, e.y + 0.6, sz); G.room.scene.add(m); (G.proj = G.proj || []).push({ m, x: sx, y: e.y + 0.6, z: sz, vx: dx / d * 7.5, vz: dz / d * 7.5, vy: (PL.y + 1.0 - (e.y + 0.6)) / t + 2 * t, life: 2 }); }
// ── 撃たれたとき ──
function damageEnemy(e, dmg, o = {}) {
  if (e.dead || e.hp <= 0) return;
  e.hp -= dmg; e.alert = true; e.hitT = Math.min(1, e.hitT + (o.knock || 0.2) + 0.2);
  AU.sfx('flesh', { x: e.x, z: e.z }); bleed(e.x, e.y + (o.y != null ? o.y : e.aimY), e.z, o.w === 'sg' ? 10 : 6);
  if (o.burn) e.burn = 4;
  const t = e.type;
  if (t === 'zombie') {
    if (e.state === 'lie' || e.state === 'sit') setState(e, 'rise', 'rise');
    if (o.w === 'sg' && o.dist < 2.4 && o.pitch > 0.05 && rnd() < 0.5) { decap(e); e.hp = 0; }
    else if ((o.w === 'sg' && o.dist < 3) || o.w === 'mg' || o.w === 'gl') { if (e.state === 'grab') PL.grab = null; if (e.hp > 0) setState(e, 'down', 'down'); }
    else if (e.state === 'chase') moveActor(G.room, e, -Math.sin(e.ang) * 0.08, -Math.cos(e.ang) * 0.08, 'enemy');
  } else if (t === 'crawler') { if (o.w === 'sg' || o.w === 'mg') setState(e, 'down', 'crawl'); }
  else if (t === 'dog') { AU.sfx('yelp', { x: e.x, z: e.z }); const a = Math.atan2(e.x - PL.x, e.z - PL.z); moveActor(G.room, e, Math.sin(a) * 0.5, Math.cos(a) * 0.5, 'enemy'); if (e.state !== 'window') setState(e, 'hit', 'run'); }
  else if (t === 'brute' || t === 'hunter' || t.startsWith('boss')) { e.stag += dmg; const lim = t === 'hunter' ? 45 : t === 'brute' ? 150 : 140; if (e.stag > lim && !['charge', 'lunge', 'leap'].includes(e.state)) { e.stag = 0; setState(e, 'stagger', 'stagger'); } if (t === 'hunter' && e.state === 'idle') { setState(e, 'run', 'hunt'); } }
  if (e.hp <= 0) killEnemy(e, o);
}
function decap(e) { const hd = e.h.J.head; if (hd) hd.visible = false; bleed(e.x, e.y + 1.65, e.z, 26); AU.sfx('splat', { x: e.x, z: e.z }); e.nohead = true; }
function killEnemy(e, o = {}) {
  if (e.dead) return; e.dead = true; e.hp = 0; setState(e, 'dead', 'dead'); if (PL.grab === e) PL.grab = null; if (PL.tgt === e) PL.tgt = null;
  if (e.key) G.killed[e.key] = true; G.kills++;
  const snd = { dog: 'yelp', spider: 'hiss', brute: 'roar', hunter: 'screech', boss1: 'roar', boss2: 'roar' }[e.type] || 'moan2'; AU.sfx(snd, { x: e.x, z: e.z });
  if (e.h.body) e.h.body.position.y = 0;
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), M('blood', { at: 0.3 })); pool.rotation.x = -PI / 2; pool.position.set(e.x - Math.sin(e.ang) * 0.6, e.y + 0.014, e.z - Math.cos(e.ang) * 0.6); G.room.scene.add(pool);
  if (e.key && !e.type.startsWith('boss')) (G.corpses = G.corpses || []).push({ room: G.rid, x: e.x, z: e.z, y: e.y, ang: e.ang, kind: e.type === 'dog' ? 'dog' : e.type === 'spider' ? 'spider' : 'human', model: e.h.key, nohead: !!e.nohead });
  storyKill(e);
}

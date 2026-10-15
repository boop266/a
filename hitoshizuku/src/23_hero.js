// ---------------------------------------------------------------------------
// 人（あなた）：墨のひとしずくから生まれた「人」の字
//   タップした所へ歩く。一段ならのぼる、三段までなら降りる、一マスの谷なら跳ぶ。
//   はしご・縄・木・つた・竹は登る。押せる物は押す。乗れる物に乗ったら、行きたい方をタップ。
//   深い水・火・白紙の谷・つかまる……は「にじむ」。にじんでも、休んだ所からやり直すだけ。
// ---------------------------------------------------------------------------
const HERO_DEF = { ch: '人', yomi: 'ひと', imi: 'あなた', kind: 'hero', w: 1, h: 1, heavy: 1, col: 'sumi', burn: 0 };
const STEP_T = 0.2;

function makeHero(x, y) {
  const e = new Ent('人', HERO_DEF, x, y);
  e.isHero = true;
  e.hero = { path: [], goal: null, cd: 0, face: 1, buff: {}, climbing: false, ride: null, rideGoal: null, checkpoint: { x, y }, shoveCD: 0, hurtT: 0, why: '', vehGoal: null, stuckT: 0, anim: 'idle', animT: 0, jump: null, bowT: 0, restT: 0, inHide: false, steps: 0 };
  e.tiny = function () { return !!this.hero.buff.tiny; };
  e.floats = function () { return !!(this.hero.buff.swim || this.hero.buff.light); };
  e.flying = function () { return !!(this.hero.buff.fly || this.hero.buff.float); };
  e.slowFall = function () { return !!(this.hero.buff.umbrella || this.hero.buff.light || this.hero.buff.slowfall); };
  e.weight = function () { return this.hero.buff.heavy ? 3 : this.hero.buff.light ? 0 : 1; };
  e.windResist = function () { return this.hero.buff.heavy ? 9 : this.hero.buff.light ? 0 : (this.hero.buff.big ? 2.5 : 1.2); };
  e.glowR = function () { return this.hero.buff.glow ? 4.5 : 0; };
  e.heatR = function () { return this.hero.buff.hot ? 1.5 : 0; };
  e.coldR = function () { return this.hero.buff.cold ? 1 : 0; };
  e.canBurn = function () { return false; };
  e.calm = function () { return true; };
  W.ents.push(e); W.byId.set(e.id, e);
  W.hero = e;
  return e;
}
function heroStrength() { const b = W.hero.hero.buff; return b.big ? 2 : 1; }
function heroMaxDrop() { const b = W.hero.hero.buff; return (b.umbrella || b.light || b.slowfall) ? 14 : 3; }
function climbAt(x, y) {
  for (const e of entsAt(x, y)) if (e.d.climb && !e.isHero && (e.burnT <= 0) && !(e.d.kind === 'plant' && !e.rooted && e.grounded === false)) return true;
  const hb = W.hero && W.hero.hero.buff;
  if (hb && hb.climb && (T_SOLID[tAt(x - 1, y)] || T_SOLID[tAt(x + 1, y)])) return true;
  return false;
}
function heroCanBe(x, y) {
  const h = W.hero;
  if (!cellFreeFor(h, x, y)) return false;
  if (tAt(x, y) === T.BLANK) return false;
  return true;
}
function waterDepthAt(x, y) { let d = 0; while (d < 6 && waAt(x, y + d) >= DEEP) d++; return d; }
function heroDanger(x, y) {
  const h = W.hero, b = h.hero.buff;
  if (deepAt(x, y) && !b.swim && !(b.stilts && waterDepthAt(x, y) <= 3) && !b.fly) {
    // 浮いている物の上ではない
    return 'water';
  }
  for (const e of entsAt(x, y)) {
    if (e.isHero) continue;
    if ((e.d.flame || e.burnT > 0) && !b.cold) return 'fire';
    if (e.d.ai && e.d.ai.hostile && !e.tamed && !e.calm() && !b.hide && !b.disguise) return 'beast';
  }
  if (W.dark >= 0.5 && lightAt(x, y) < 0.22 && !b.glow) return 'dark';
  return null;
}
function standable(x, y) {
  if (!heroCanBe(x, y)) return false;
  if (heroDanger(x, y)) return false;
  const h = W.hero, b = h.hero.buff;
  if (b.fly || b.float) return true;
  if (climbAt(x, y)) return true;
  if (supportBelow(h, x, y)) return true;
  if (b.swim && deepAt(x, y + 1)) return true;
  if (b.stilts && waAt(x, y + 1) > 0 && waterDepthAt(x, y + 1) <= 3) return true;
  return false;
}
// 道さがし（A*）
function heroPath(gx, gy, maxNodes) {
  const h = W.hero; const sx = h.x, sy = h.y;
  const W_ = W.w, key = (x, y) => y * W_ + x;
  const open = [[0, sx, sy]]; const g = new Map(); const from = new Map();
  g.set(key(sx, sy), 0);
  let best = null, bestH = 1e9, n = 0;
  const hfn = (x, y) => Math.abs(x - gx) + Math.abs(y - gy) * 1.2;
  const b = h.hero.buff;
  const maxDrop = heroMaxDrop();
  const jumpLen = b.fast ? 3 : 2;
  const stepUp = b.big ? 2 : 1;
  while (open.length && n < (maxNodes || 4000)) {
    // 小さい順に取り出す（配列は小さいので線形）
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [f, x, y] = open.splice(bi, 1)[0]; n++;
    const k0 = key(x, y);
    const hh = hfn(x, y); if (hh < bestH) { bestH = hh; best = [x, y]; }
    if (x === gx && y === gy) { best = [x, y]; break; }
    const g0 = g.get(k0);
    const push = (nx, ny, cost, how) => {
      if (nx < 0 || ny < 0 || nx >= W.w || ny >= W.h) return;
      const k = key(nx, ny); const ng = g0 + cost;
      if (g.has(k) && g.get(k) <= ng) return;
      g.set(k, ng); from.set(k, [x, y, how]); open.push([ng + hfn(nx, ny), nx, ny]);
    };
    const climbing = climbAt(x, y) || b.fly || b.float;
    for (const dx of [-1, 1]) {
      // 歩く
      if (standable(x + dx, y)) push(x + dx, y, 1, 'w');
      else if (heroCanBe(x + dx, y) && !heroDanger(x + dx, y)) {
        // 落ちる
        let k = 1; while (k <= maxDrop + 1 && heroCanBe(x + dx, y + k) && !standable(x + dx, y + k)) k++;
        if (k <= maxDrop && standable(x + dx, y + k)) { let ok = true; for (let j = 0; j < k; j++) if (heroDanger(x + dx, y + j) === 'fire') ok = false; if (ok) push(x + dx, y + k, 1 + k * 0.3, 'd'); }
        // 跳ぶ（一マスの谷）
        if (!climbing || true) {
          for (let jl = 2; jl <= jumpLen; jl++) {
            let clear = true; for (let j = 1; j < jl; j++) if (!heroCanBe(x + dx * j, y) || !heroCanBe(x + dx * j, y - 1)) clear = false;
            if (!clear || !heroCanBe(x, y - 1)) break;
            if (standable(x + dx * jl, y) && supportBelow(h, x + dx * jl, y)) { push(x + dx * jl, y, 2.4 + jl * 0.2, 'j'); break; }
            if (standable(x + dx * jl, y + 1) && heroCanBe(x + dx * jl, y)) { push(x + dx * jl, y + 1, 2.6, 'j'); break; }
            if (standable(x + dx * jl, y + 2) && heroCanBe(x + dx * jl, y) && heroCanBe(x + dx * jl, y + 1)) { push(x + dx * jl, y + 2, 2.8, 'j'); break; }
          }
        }
      } else {
        // 段をのぼる
        for (let s = 1; s <= stepUp; s++) {
          let head = true; for (let j = 1; j <= s; j++) if (!heroCanBe(x, y - j)) head = false;
          if (head && standable(x + dx, y - s)) { push(x + dx, y - s, 1.4 + s * 0.3, 'u'); break; }
        }
        // 押す
        const blk = occAt(x + dx, y);
        if (blk && blk.d.push && entSolid(blk) && blk.weight() <= heroStrength() && blk.h === 1 && blk.y === y) {
          const tx = dx > 0 ? blk.x + blk.w : blk.x - 1;
          if (canPlace(blk, blk.x + dx, blk.y)) push(x + dx, y, 4, 'p');
        }
      }
      // 空を飛ぶ・浮いている時は斜めも
      if (b.fly) { if (heroCanBe(x + dx, y - 1) && !heroDanger(x + dx, y - 1)) push(x + dx, y - 1, 1.4, 'f'); if (heroCanBe(x + dx, y + 1) && !heroDanger(x + dx, y + 1)) push(x + dx, y + 1, 1.4, 'f'); }
    }
    // 登る・降りる
    if (climbing || climbAt(x, y - 1) && heroCanBe(x, y - 1)) {
      if (heroCanBe(x, y - 1) && !heroDanger(x, y - 1) && (climbAt(x, y - 1) || standable(x, y - 1) || b.fly || climbAt(x, y))) push(x, y - 1, 1.5, 'c');
    }
    if (heroCanBe(x, y + 1) && !heroDanger(x, y + 1) && (climbAt(x, y + 1) || (climbing && standable(x, y + 1)) || b.fly)) push(x, y + 1, 1.3, 'c');
  }
  if (!best) return { path: [], reached: false };
  // たどる
  const path = []; let cur = best; let guard = 0;
  while (cur && !(cur[0] === sx && cur[1] === sy) && guard++ < 999) {
    const k = key(cur[0], cur[1]); const fr = from.get(k);
    if (!fr) break;
    path.push({ x: cur[0], y: cur[1], how: fr[2] });
    cur = [fr[0], fr[1]];
  }
  path.reverse();
  return { path, reached: best[0] === gx && best[1] === gy };
}
// タップした所 → 歩いて行ける「立てる場所」
function heroGoalFor(tx, ty) {
  if (standable(tx, ty)) return [tx, ty];
  for (let d = 1; d <= 7; d++) if (standable(tx, ty + d)) return [tx, ty + d];
  for (let d = 1; d <= 2; d++) if (standable(tx, ty - d)) return [tx, ty - d];
  for (const dx of [-1, 1, -2, 2]) for (let d = 0; d <= 6; d++) if (standable(tx + dx, ty + d)) return [tx + dx, ty + d];
  return [tx, ty];
}
// ---- タップ ----
function heroTap(tx, ty) {
  const h = W.hero; if (!h || !h.alive || h.hero.hurtT > 0) return;
  const hb = h.hero;
  hb.restT = 0;
  // 乗り物
  const veh = heroVehicle();
  const tappedEnt = entsAt(tx, ty, e => !e.isHero)[0] || entsAt(tx, ty + 1, e => !e.isHero && e.d.beast)[0];
  // 乗れる生き物をタップ：乗る
  if (tappedEnt && canRide(tappedEnt) && !hb.ride && entDist(h, tappedEnt) <= 2.2) { mount(tappedEnt); return; }
  // 乗っている時に自分か乗り物をタップ：降りる
  if (hb.ride && (tappedEnt === hb.ride || (tx === h.x && ty === h.y))) { heroDismount(); return; }
  // 押せる物をさわった：となりにいれば押す。はなれていれば、そばまで行く
  const pe = tappedEnt && !tappedEnt.isHero && tappedEnt.d.push && entSolid(tappedEnt) && !hb.ride ? tappedEnt : null;
  if (pe && pe.weight() <= heroStrength() && h.y >= pe.y && h.y < pe.y + pe.h) {
    const dir = h.x < pe.x ? 1 : -1;
    const side = dir > 0 ? pe.x - 1 : pe.x + pe.w;
    if (h.x === side) {
      if (moveEnt(pe, dir, 0)) { h.x += dir; hb.face = dir; Sfx.push(); Bus.emit('heroPush', { who: pe }); if (pe.d.roll) pe.rollV = dir * 4; }
      else { h.talk('うごかない', 1.2); Sfx.nope(); }
      hb.path = []; hb.goal = null; return;
    }
    const r0 = heroPath(side, h.y);
    if (r0.reached) { hb.path = r0.path; hb.goal = { x: side, y: h.y }; Fx.tapMark(tx + .5, ty + .5, true); return; }
  }
  const [gx, gy] = heroGoalFor(tx, ty);
  hb.goal = { x: gx, y: gy, tx, ty };
  const r = heroPath(gx, gy);
  if (hb.ride || veh) {
    // 歩いて行けるなら歩く、行けないなら乗り物を動かす
    if (r.reached && r.path.length && !(veh && r.path.every(p => p.y === h.y && veh && p.x >= veh.x && p.x < veh.x + veh.w))) { if (hb.ride) heroDismount(true); hb.path = r.path; hb.vehGoal = null; return; }
    const v = hb.ride || veh;
    hb.vehGoal = { x: tx, y: ty, v }; hb.path = [];
    if (hb.ride) hb.rideGoal = { x: tx - Math.floor(v.w / 2), y: v.d.ai && (v.d.ai.rideFly || v.flying()) ? ty : v.y };
    Fx.tapMark(tx + .5, ty + .5, true);
    Bus.emit('steer', { v: v.k });
    return;
  }
  hb.path = r.path;
  Fx.tapMark(tx + .5, ty + .5, r.reached);
  if (!r.reached) { hb.stuckT = 0.8; if (r.path.length === 0) { h.talk('？', 1); } }
}
function canRide(e) {
  if (!e.d.beast || !e.d.ai || !e.d.ai.ride) return false;
  return e.charmT > 0 || e.tamed || e.companion || e.bowT > 0 && e.k === '河童';
}
function mount(e) {
  const h = W.hero;
  h.hero.ride = e; h.hero.path = []; h.hero.vehGoal = null; h.hero.rideGoal = null;
  const px = e.x + Math.floor(e.w / 2), py = e.y - 1;
  if (cellFreeFor(h, px, py)) { h.x = px; h.y = py; }
  h.hero.jump = { t: 0, from: [h.rx, h.ry] };
  e.ai.goal = null;
  Sfx.hop(); h.talk('よいしょ', 1.2);
  Bus.emit('ride', { who: e });
}
function heroDismount(quiet) {
  const h = W.hero; const e = h.hero.ride; h.hero.ride = null; h.hero.rideGoal = null;
  if (!e) return;
  // 降りる場所
  for (const [dx, dy] of [[-1, 0], [e.w, 0], [-1, 1], [e.w, 1], [-1, -1], [e.w, -1]]) {
    const x = e.x + dx, y = e.y + e.h - 1 + dy;
    if (heroCanBe(x, y) && !heroDanger(x, y)) { h.x = x; h.y = y; break; }
  }
  if (!quiet) Sfx.hop();
}
// 乗せてもらって着いた：降りて、行きたい所まで歩ける所なら、ぴょんと降りる
function rideArrive(m) {
  const h = W.hero, hb = h.hero, g = hb.goal;
  if (!g || hb.ride !== m || (h.x === g.x && h.y === g.y)) return;
  const ox = h.x, oy = h.y;
  for (const [dx, dy] of [[-1, m.h - 1], [m.w, m.h - 1], [-1, m.h], [m.w, m.h], [-1, m.h - 2], [m.w, m.h - 2], [Math.floor(m.w / 2), m.h]]) {
    const x = m.x + dx, y = m.y + dy;
    if (!standable(x, y)) continue;
    h.x = x; h.y = y; const r = heroPath(g.x, g.y); h.x = ox; h.y = oy;
    if (!r.reached) continue;
    hb.ride = null; hb.rideGoal = null;
    h.x = x; h.y = y; hb.jump = { t: 0, from: [h.rx, h.ry] }; hb.path = r.path; hb.cd = 0.2;
    Sfx.hop(); h.talk('ありがとう', 1.4); Bus.emit('dismount', { who: m });
    return;
  }
}
// いま乗っている物（舟・雲・浮いている板・乗れる生き物）
function heroVehicle() {
  const h = W.hero; if (h.hero.ride) return h.hero.ride;
  const below = entsAt(h.x, h.y + 1, e => !e.isHero && entSolid(e));
  for (const e of below) {
    if (e.d.boat || e.d.cloud || e.d.island || (e.floats() && (e.inWater() || deepAt(e.x, e.y + e.h)))) return e;
    if (e.floatT > 0 || e.stopT > 0) return null;
  }
  return null;
}
// ---- 毎刻み ----
function heroTick() {
  const h = W.hero, hb = h.hero;
  for (const k in hb.buff) { hb.buff[k] -= TICK; if (hb.buff[k] <= 0) { delete hb.buff[k]; if (k === 'fly' || k === 'float') { /* 落ちる */ } } }
  if (h.birthT > 0) { h.birthT -= TICK; return; }
  if (hb.shoveCD > 0) hb.shoveCD -= TICK;
  if (h.squash > 0) h.squash = Math.max(0, h.squash - TICK * 4);
  if (h.sayT > 0) { h.sayT -= TICK; if (h.sayT <= 0) h.say = null; }
  if (hb.bowT > 0) hb.bowT -= TICK;
  if (hb.hurtT > 0) { hb.hurtT -= TICK; if (hb.hurtT <= 0) heroRespawn(); return; }
  if (hb.jump) { hb.jump.t += TICK / 0.28; if (hb.jump.t >= 1) hb.jump = null; }
  if (h.stopT > 0) { h.stopT -= TICK; return; }
  hb.climbing = climbAt(h.x, h.y) && !supportBelow(h, h.x, h.y) || !!(hb.buff.fly || hb.buff.float);
  // 乗り物
  if (hb.ride) {
    const m = hb.ride;
    if (!m.alive || !(canRide(m))) { hb.ride = null; }
    else {
      const px = m.x + Math.floor(m.w / 2), py = m.y - 1;
      if (cellFreeFor(h, px, py) || (px === h.x && py === h.y)) { h.x = px; h.y = py; }
      else heroDismount();
      hb.climbing = true;
      if (hb.rideGoal && Math.abs(m.x - hb.rideGoal.x) <= 0 && (!m.flying() || Math.abs(m.y - hb.rideGoal.y) <= 1)) { hb.rideGoal = null; rideArrive(m); }
      if (m.d.ai) { m.ai.goal = hb.rideGoal; }
      // 乗り物が進めなくなった：降りて、歩いて行ける所なら歩く
      if (hb.rideGoal) {
        const key = m.x + ',' + m.y;
        if (hb.rideLast === key) hb.rideStill = (hb.rideStill || 0) + TICK; else { hb.rideStill = 0; hb.rideLast = key; }
        if (hb.rideStill > 1.2 && hb.goal) {
          const g = hb.goal; heroDismount();
          const r = heroPath(g.x, g.y); if (r.path.length) hb.path = r.path;
          hb.rideStill = 0;
        }
      }
    }
  }
  if (hb.vehGoal && !hb.ride) steerVehicle();
  // 道を歩く
  hb.cd -= TICK;
  if (hb.cd <= 0 && hb.path.length && !hb.ride) {
    const st = hb.path[0];
    const dx = st.x - h.x, dy = st.y - h.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 16) { replan(); }
    else if (!(st.how === 'd' || st.how === 'j') && (Math.abs(dx) > 1 || Math.abs(dy) > 2)) { replan(); }
    else if (!heroCanBe(st.x, st.y) && !(st.how === 'p')) { replan(); }
    else {
      let ok = true;
      if (dx) hb.face = sign(dx);
      if (st.how === 'p') {
        const blk = occAt(st.x, st.y);
        if (blk && blk.d.push && blk.weight() <= heroStrength() && moveEnt(blk, sign(dx), 0)) { h.x = st.x; h.y = st.y; Sfx.push(); Bus.emit('heroPush', { who: blk }); if (blk.d.roll) blk.rollV = sign(dx) * 4; }
        else ok = false;
      } else if (st.how === 'd' || st.how === 'w' || st.how === 'f') {
        if (st.how === 'd') { h.x = st.x; /* 落ちるのは重さにまかせる */ if (!supportBelow(h, h.x, h.y) && !climbAt(h.x, h.y)) { h.y = st.y; h.fallN = st.y - (h.y); } else h.y = st.y; }
        else { h.x = st.x; h.y = st.y; }
      } else if (st.how === 'j') { hb.jump = { t: 0, from: [h.rx, h.ry] }; h.x = st.x; h.y = st.y; Sfx.hop(); }
      else { h.x = st.x; h.y = st.y; }
      if (ok) {
        hb.path.shift(); hb.steps++;
        const slow = st.how === 'c' ? 1.35 : st.how === 'p' ? 1.6 : st.how === 'j' ? 1.3 : 1;
        hb.cd = STEP_T * slow / (hb.buff.fast ? 1.8 : 1) * (inMud(h) ? 1.8 : 1);
        if (st.how !== 'c') Sfx.step(); else Sfx.climb();
        if (hb.buff.bell && hb.steps % 3 === 0) { Sfx.bell(0.25); noiseAt(h.cx, h.cy, 5, 'bell'); }
        if (waAt(h.x, h.y) > 0 && W.tick % 2 === 0) Sfx.splash(0.15);
      } else replan();
    }
  }
  if (!hb.path.length && hb.goal && !hb.vehGoal && !hb.ride) {
    if (h.x === hb.goal.x && h.y === hb.goal.y) hb.goal = null;
  }
  // 危ないこと
  const dz = heroDanger(h.x, h.y);
  if (dz === 'water' && !heroVehicle()) heroHurt('drown');
  else if (dz === 'fire') heroHurt('fire');
  for (const e of entsNear(h.x, h.y, 1, o => (o.d.flame || o.burnT > 0) && !o.isHero)) { if (touching(e, h) && entDist(e, h) < 0.5 && !hb.buff.cold) heroHurt('fire'); }
  // 林や森の中は見つかりにくい
  hb.inHide = entsAt(h.x, h.y, e => e.d.hide && !e.isHero).length > 0;
  // 墨のしずく
  for (const dr of W.drops) if (!dr.got && dr.x === h.x && dr.y === h.y) { dr.got = true; Game.gotDrop(dr); }
  // 出口
  if (Scene.cur && !Scene.leaving && h.grounded !== undefined) {
    const ex = Scene.cur.exitX != null ? Scene.cur.exitX : W.w - 2;
    if (h.x >= ex && !hb.ride) Scene.exit('right');
  }
  // 凧：風で持ち上がる
  if (hb.buff.kite && (Math.abs(W.wind) > 0.3 || gustAt(h.x, h.y)) && W.tick % 4 === 0 && heroCanBe(h.x, h.y - 1) && h.y > 1) { h.y--; hb.kiteUp = 1; }
  // 雪女のそばは寒い
  if (!hb.buff.hot) for (const e of entsNear(h.x, h.y, 2, o => o.d.ai && o.d.ai.snowy && !o.calm() && !o.leaving)) { if (W.tick % 20 === 0) { heroKnock(sign(h.x - e.x) || -1, 1); h.talk('さむい……', 1.4); Bus.emit('cold', {}); } }
  // じっとしていたら
  if (!hb.path.length) { hb.idleT = (hb.idleT || 0) + TICK; } else hb.idleT = 0;
}
function inMud(h) { return tAt(h.x, h.y + 1) === T.MUD || waAt(h.x, h.y) >= 2; }
function replan() {
  const hb = W.hero.hero;
  if (!hb.goal) { hb.path = []; return; }
  const r = heroPath(hb.goal.x, hb.goal.y);
  hb.path = r.path;
}
function steerVehicle() {
  const h = W.hero, hb = h.hero, g = hb.vehGoal, v = g.v;
  if (!v.alive || heroVehicle() !== v) { hb.vehGoal = null; return; }
  v.steerCD = (v.steerCD || 0) - TICK;
  if (v.steerCD > 0) return;
  const spd = v.d.boat ? 4 : v.d.cloud ? 2.5 : (v.d.ai && v.d.ai.spd) ? v.d.ai.spd : 1.6;
  v.steerCD = 1 / spd;
  const dx = sign(g.x - (v.x + Math.floor(v.w / 2)));
  const flyer = v.d.cloud || v.d.fly || v.flying();
  const dy = flyer ? sign(g.y + 1 - v.y) : 0;
  let moved = false;
  if (dx) {
    if (flyer) moved = moveEnt(v, dx, 0);
    else {
      // 水の上だけ進む
      const nx = dx > 0 ? v.x + v.w : v.x - 1;
      if (deepAt(nx, v.y + v.h) || deepAt(nx, v.y + v.h - 1) || v.d.ai) moved = moveEnt(v, dx, 0);
    }
    if (moved) { v.dir = dx; if (!flyer && W.tick % 3 === 0) Fx.ripple(v.cx, v.y + v.h); }
  }
  if (dy && flyer && (!dx || !moved || W.tick % 2)) { if (moveEnt(v, 0, dy)) moved = true; }
  if (!moved) {
    hb.vehGoal = null;
    // 向こうへ着いた：歩いて行けるなら歩く
    if (hb.goal) { const r = heroPath(hb.goal.x, hb.goal.y); if (r.path.length) hb.path = r.path; }
  }
}
// ---- 自分に起きること ----
function heroHurt(why) {
  const h = W.hero, hb = h.hero;
  if (hb.hurtT > 0 || !h.alive) return;
  if (Game.god) return;
  hb.hurtT = 1.3; hb.why = why; hb.path = []; hb.goal = null; hb.vehGoal = null; hb.ride = null;
  Sfx.bleed(); Fx.inkBleed(h.cx, h.cy, 24);
  const msg = { drown: '水に墨がにじんでしまった', fire: 'あつっ！ 墨がにじんでしまった', fall: '落ちてしまった', crush: 'ぺしゃんこ……', caught: 'つかまってしまった', shock: 'しびれた！', cold: 'こごえてしまった' }[why] || 'にじんでしまった';
  toast(msg);
  Bus.emit('hurt', { why });
  Game.stats.hurts++;
}
function heroRespawn() {
  const h = W.hero, hb = h.hero;
  const cp = hb.checkpoint;
  let x = cp.x, y = cp.y;
  if (!heroCanBe(x, y) || heroDanger(x, y)) { const s = Scene.cur && Scene.cur.start || { x: 1, y: 1 }; x = s.x; y = s.y; }
  h.x = x; h.y = y; h.rx = x; h.ry = y;
  hb.buff = {}; hb.path = []; h.fallN = 0;
  Fx.inkGather(x + .5, y + .5);
  Bus.emit('respawn', {});
}
function heroKnock(dir, n) {
  const h = W.hero; h.hero.path = [];
  for (let i = 0; i < n; i++) { if (heroCanBe(h.x + dir, h.y)) h.x += dir; else if (heroCanBe(h.x + dir, h.y - 1)) { h.x += dir; h.y--; } }
  h.hero.jump = { t: 0, from: [h.rx, h.ry] }; h.squash = 1;
}
function heroJump(n) {
  const h = W.hero; let k = 0;
  for (let i = 0; i < n; i++) if (heroCanBe(h.x, h.y - 1)) { h.y--; k++; }
  h.hero.jump = { t: 0, from: [h.rx, h.ry] };
  h.hero.buff.float = Math.max(h.hero.buff.float || 0, 0.6);
  if (k) Sfx.hop();
}
function heroBow() {
  const h = W.hero; h.hero.bowT = 1.6; h.talk('ぺこり', 1.4); Sfx.bow();
  Bus.emit('bow', {});
  for (const e of entsNear(h.x, h.y, 12, isBeast)) {
    const ai = e.d.ai;
    if (ai.bowWeak) { e.bowT = 45; e.talk('おっと、これはごていねいに……あっ、皿の水が', 3.5); Fx.splash(e.cx, e.y, 8); Bus.emit('bowWeak', { who: e }); }
    else if (ai.likes.includes('礼')) { e.charmT = Infinity; e.talk('うむ。礼を知る者よ、通るがよい', 3); Bus.emit('friend', { who: e, by: '礼' }); }
    else if (ai.yokai || e.d.npc) { e.talk(e.k === '鬼' ? '……ふん' : 'ぺこり', 1.6); }
  }
}
function heroRest() {
  const h = W.hero; h.hero.checkpoint = { x: h.x, y: h.y }; h.hero.restT = 2; h.hero.path = [];
  h.talk('ひと休み', 1.6); Sfx.chime(); Fx.leaves(h.cx, h.y, 6);
  Bus.emit('rest', {});
  toast('ここからやり直せる');
}

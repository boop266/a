// ---------------------------------------------------------------------------
// 物（字）ひとつひとつ：状態・寿命・生き物の気持ちと動き
// ---------------------------------------------------------------------------
class Ent {
  constructor(k, d, x, y) {
    this.id = W.nextId++;
    this.k = k; this.d = d;
    this.w = d.w; this.h = d.h;
    this.x = x; this.y = y; this.rx = x; this.ry = y;
    this.alive = true; this.fadeT = 0;
    this.mine = false; this.ink = 0; this.base = null;
    this.mods = {}; this.modInk = {};
    this.burnT = 0; this.burnMax = 0; this.wetT = 0; this.frozenT = 0; this.sleepT = 0; this.stunT = 0;
    this.fearT = 0; this.fearFrom = null; this.charmT = 0; this.angryT = 0; this.laughT = 0; this.cryT = 0;
    this.drunkT = 0; this.fullT = 0; this.stopT = 0; this.floatT = 0; this.flyT = 0; this.hideT = 0; this.calmT = 0; this.danceT = 0;
    this.lookT = 0; this.callT = 0; this.callTo = null; this.weakT = 0; this.bowT = 0;
    this.life = d.life || 0; this.lifeMax = this.life;
    this.fallN = 0; this.grounded = false; this.squash = 0; this.spawnT = 0; this.bornAt = W.time;
    this.rooted = !!d.root; this.dir = 1; this.rollV = 0; this.tinyFlag = false;
    this.say = null; this.sayT = 0;
    this.ai = d.beast ? { think: rnd() * 0.3, cd: 0, goal: null, home: x, state: 'idle', wanderT: 0 } : null;
    this.open = false;      // 門・戸
    this.isHero = false;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  tiny() { return this.tinyFlag || !!this.d.tinyBody; }
  asleep() { return this.sleepT > 0 || this.drunkT > 0 && this.sleepT > 0; }
  calm() {
    return this.sleepT > 0 || this.stunT > 0 || this.frozenT > 0 || this.stopT > 0 || this.laughT > 0 || this.charmT > 0 ||
      this.calmT > 0 || this.danceT > 0 || this.tinyFlag || this.bowT > 0 || this.cryT > 0 || this.weakT > 0 || this.lookT > 0 || this.leaving || this.d.solid && this.open;
  }
  floats() { return !!((this.d.float || this.mods.light || (this.d.swim && !(this.d.ai && this.d.ai.swimOnly))) && !this.mods.heavy && !this.mods.heavyTmp); }
  flying() {
    if (this.stopT > 0) return true;
    if (this.floatT > 0 || this.flyT > 0) return true;
    if (this.d.fly && !(this.sleepT > 0 || this.stunT > 0 || this.frozenT > 0) && !this.perched) return true;
    return false;
  }
  slowFall() { return !!(this.d.slow || this.mods.light || this.mods.slow); }
  weight() {
    let w = this.d.heavy || 0;
    if (this.mods.heavy) w += 2;
    if (this.mods.light) w -= 2;
    if (this.mods.big) w += 1;
    if (this.tinyFlag) w -= 1;
    if (this.weakT > 0 || this.mods.weak) w -= 2;
    return clamp(w, 0, 3);
  }
  windResist() { if (this.d.root && this.rooted) return 9; if (this.d.ink) return 9; return this.weight() + (this.d.solid && this.grounded ? 0.5 : 0) + (this.d.beast ? 0.5 : 0); }
  canBurn() { return this.alive && !!this.d.burn && this.burnT <= 0 && this.wetT <= 0 && this.frozenT <= 0 && !this.inWater() && !this.d.flame; }
  heatR() {
    let r = 0;
    if (this.d.flame) r = this.d.heat || 1;
    if (this.burnT > 0) r = Math.max(r, this.d.coal ? 2.2 : (this.w > 1 ? 1.8 : 1.2));
    if (this.mods.hot) r = Math.max(r, 2.2);
    if (this.mods.red) r = Math.max(r, 0.8);
    if (this.d.warm) r = Math.max(r, 1);
    if (this.hotT > 0) r = Math.max(r, 1.5);
    return r;
  }
  coldR() {
    let r = this.d.cold || 0;
    if (this.mods.cold) r = Math.max(r, 2.2);
    if (this.mods.blue) r = Math.max(r, 0.8);
    if (this.d.cold && this.leaving) r = 0;
    return r;
  }
  glowR() {
    if (this.hideT > 0) return 0;
    let r = this.d.glow || 0;
    if (this.d.flame && this.burnT <= 0 && !this.d.flame) r = 0;
    if (this.burnT > 0) r = Math.max(r, this.w > 1 ? 4 : 3);
    if (this.mods.bright) r = Math.max(r, 3.5);
    if (this.d.lamp && this.off) r = 0;
    if (this.d.ai && this.d.ai.night === true && !W.night && this.k === '蛍') r = W.dark > 0.3 ? r : 0;
    return r;
  }
  inWater() { return waAt(this.x, this.y + this.h - 1) >= DEEP; }
  wet(t) {
    if (this.d.ink && !this.isHero) { Fx.inkBleed(this.cx, this.cy, 10); removeEnt(this, 'dissolve'); return; }
    this.wetT = Math.max(this.wetT, t);
    if (this.burnT > 0) extinguish(this);
  }
  stun(t) { this.stunT = Math.max(this.stunT, t); this.ai && (this.ai.goal = null); }
  sleep(t) { this.sleepT = Math.max(this.sleepT, t); if (this.ai) this.ai.goal = null; }
  fleeFrom(src, t) {
    if (!this.d.beast || this.isHero) return;
    if (this.stopT > 0 || this.frozenT > 0) return;
    this.fearT = Math.max(this.fearT, t || 4);
    this.fearFrom = { x: src.x + (src.w || 1) / 2, y: src.y };
    if (this.sleepT > 0 && t > 2) this.sleepT = 0;
  }
  speed() {
    let s = this.d.ai ? this.d.ai.spd : 2;
    if (this.mods.fast) s *= 2; if (this.mods.slow) s *= 0.4; if (this.weakT > 0 || this.mods.weak) s *= 0.7;
    if (this.fearT > 0) s *= 1.3; if (this.angryT > 0) s *= 1.5;
    if (this.drunkT > 0) s *= 0.5;
    if (this.leaving) s *= 2;
    return s;
  }
  strength() { let s = this.d.ai && this.d.ai.strong || (this.d.big ? 2 : 1); if (this.mods.big) s++; if (this.mods.strong) s++; if (this.weakT > 0 || this.mods.weak) s -= 2; return s; }
  totalInk() { let n = this.ink; for (const k in this.modInk) n += this.modInk[k]; return n; }
  talk(s, t) { this.say = s; this.sayT = t || 2.6; }
}

// ---- 作る・消す・変える ----
function newEnt(k, x, y, opt) {
  const d = KDEF[k]; if (!d) return null;
  const e = new Ent(k, d, x, y);
  opt = opt || {};
  if (opt.w) e.w = opt.w; if (opt.h) e.h = opt.h;
  if (opt.mine) { e.mine = true; e.ink = opt.ink || 0; }
  if (opt.life) { e.life = opt.life; e.lifeMax = opt.life; }
  if (d.flame) { e.burnT = e.life || d.burn || 10; e.burnMax = e.burnT; }
  e.spawnT = opt.instant ? 0 : 0.35;
  W.ents.push(e); W.byId.set(e.id, e);
  occupy(e);
  if (d.bamboo && !opt.full) { e.growTo = opt.growTo || bambooMax(x, y + e.h - 1); }
  Bus.emit('spawn', { who: e, mine: !!opt.mine });
  return e;
}
function bambooMax(x, by) { let h = 0; for (let y = by; y >= 0 && h < 8; y--) { if (T_SOLID[tAt(x, y)]) break; h++; } return Math.max(1, h); }
function removeEnt(e, why) {
  if (!e.alive) return;
  e.alive = false; e.fadeT = 0.45; e.why = why;
  // occ は次の刻みで作り直す（ここではすぐ空ける）
  for (let yy = e.y; yy < e.y + e.h; yy++) for (let xx = e.x; xx < e.x + e.w; xx++) if (inb(xx, yy) && W.occ[idx(xx, yy)] === e.id + 1) W.occ[idx(xx, yy)] = 0;
  const ink = e.mine ? e.totalInk() : Object.values(e.modInk).reduce((a, b) => a + b, 0);
  if (ink > 0) Ink.flowBack(ink, e.cx, e.cy);
  if (e.base && !e.mine && why === 'return') { /* 元に戻すのは transform 側 */ }
  Bus.emit('remove', { who: e, why });
  if (W.hero && W.hero.hero.ride === e) W.hero.hero.ride = null;
}
// 別の字に変わる（大きさは下の真ん中をそろえる）
function transformEnt(e, k, opt) {
  const d = KDEF[k]; if (!d) return false;
  opt = opt || {};
  const ow = e.w, oh = e.h;
  let nw = d.w, nh = d.h;
  if (e.mods.big) { nw = Math.min(3, nw + 1); nh = Math.min(4, nh + 1); }
  let nx = Math.round(e.x + ow / 2 - nw / 2), ny = e.y + oh - nh;
  unoccupy(e);
  const fits = (x, y) => { const ow2 = e.w, oh2 = e.h; e.w = nw; e.h = nh; const ok = canPlace(e, x, y); e.w = ow2; e.h = oh2; return ok; };
  if (!fits(nx, ny)) {
    let found = false;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-2, 0], [2, 0]]) { if (fits(nx + dx, ny + dy)) { nx += dx; ny += dy; found = true; break; } }
    // 無理にでも変わる時は、もう少し広く空きをさがす
    if (!found && opt.force) for (let r = 2; r <= 4 && !found; r++) for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) === r && fits(nx + dx, ny + dy)) { nx += dx; ny += dy; found = true; break; } }
    if (!found && !opt.force) { occupy(e); return false; }
  }
  const was = e.k;
  e.k = k; e.d = d; e.w = nw; e.h = nh; e.x = nx; e.y = ny;
  e.rooted = !!d.root;
  if (d.flame) { e.burnT = d.burn || 10; e.burnMax = e.burnT; e.life = d.life || 10; } else if (!opt.keepFire) e.burnT = 0;
  if (d.beast && !e.ai) e.ai = { think: 0, cd: 0, goal: null, home: nx, state: 'idle', wanderT: 0 };
  if (!d.beast) e.ai = null;
  if (d.bamboo) e.growTo = bambooMax(nx, ny + nh - 1);
  e.life = d.life || 0; e.lifeMax = e.life;
  e.spawnT = 0.35; e.morphFrom = was; e.morphT = 0;
  occupy(e);
  Bus.emit('transform', { who: e, from: was, to: k });
  return true;
}
function breakEnt(e, by) {
  if (!e.alive) return;
  const d = e.d;
  Sfx.crack(); Fx.shatter(e.cx, e.cy, INK[d.col] || '#555');
  Bus.emit('break', { who: e, by });
  if (d.gate || d.door) { e.open = true; e.broken = true; e.solidNow = false; unoccupy(e); rebuildOcc(); return; }
  if (d.pot && e.holds) { const h = e.holds; removeEnt(e, 'break'); const n = newEnt(h, e.x, e.y); if (n) { n.spawnT = 0.5; } return; }
  if (d.breakTo) {
    const x = e.x, y = e.y, w = e.w, h = e.h, mine = e.mine;
    removeEnt(e, 'break');
    for (let i = 0; i < Math.max(1, w); i++) { const s = newEnt(d.breakTo, x + i, y + h - 1); if (s && mine) { /* 墨は返っている */ } }
    return;
  }
  removeEnt(e, 'break');
}

// ---- 毎刻み ----
function entTick(e) {
  if (e.isHero) return;
  if (e.spawnT > 0) e.spawnT = Math.max(0, e.spawnT - TICK);
  if (e.morphFrom) { e.morphT += TICK * 1.6; if (e.morphT >= 1) e.morphFrom = null; }
  if (e.squash > 0) e.squash = Math.max(0, e.squash - TICK * 4);
  if (e.sayT > 0) { e.sayT -= TICK; if (e.sayT <= 0) e.say = null; }
  const dt = TICK;
  for (const key of ['wetT', 'frozenT', 'sleepT', 'stunT', 'fearT', 'charmT', 'angryT', 'laughT', 'cryT', 'drunkT', 'fullT', 'stopT', 'floatT', 'flyT', 'hideT', 'calmT', 'danceT', 'lookT', 'callT', 'weakT', 'bowT', 'hotT']) {
    if (e[key] > 0 && e[key] !== Infinity) { e[key] -= dt; if (e[key] < 0) e[key] = 0; }
  }
  if (e.stopT > 0) return;
  if (e.drunkT > 0 && e.drunkT < 1 && !e.sleepT) e.sleep(30);
  if (e.life > 0 && !e.eternal && !(e.d.flame && e.burnT > 0 && e.mine)) {
    e.life -= dt;
    if (e.life <= 0) {
      if (e.d.flame) { burnOut(e); return; }
      if (e.d.rainbow) Fx.sparkle(e.cx, e.cy, '#c9a7e8', 12);
      removeEnt(e, 'expire'); return;
    }
  }
  if (e.d.flame && e.burnT <= 0 && !e.eternal) { removeEnt(e, 'out'); return; }
  if (e.d.ink && W.tick % 5 === 0) { for (let xx = e.x; xx < e.x + e.w; xx++) if (waAt(xx, e.y) > 0 || waAt(xx, e.y - 1) > 0) { e.wet(1); return; } }
  // 竹は伸びる
  if (e.d.bamboo && e.growTo && e.h < e.growTo && W.tick % 4 === 0) {
    if (cellFreeFor(e, e.x, e.y - 1)) { unoccupy(e); e.y--; e.h++; occupy(e); } else e.growTo = e.h;
  }
  // 育つ（雨・日）
  if (e.growPts > 12 && e.d.grow && KDEF[e.d.grow]) { e.growPts = 0; transformEnt(e, e.d.grow, { keepMine: true }); }
  // 水源
  if (e.src) {
    e.src.ttl -= dt;
    if (W.tick % e.src.every === 0) addWater(e.src.x, e.src.y, e.src.amt);
    if (e.src.ttl <= 0) { removeEnt(e, 'dry'); return; }
  }
  // 雲は風に流れる
  if (e.d.cloud && W.tick % 20 === 0 && Math.abs(W.wind) > 0.25) moveEnt(e, sign(W.wind), 0);
  // 転がる
  if (e.d.roll || e.rollV) rollTick(e);
  // 磁石
  if (e.d.magnet && W.tick % 6 === 0) {
    for (const o of entsNear(e.cx, e.cy, e.d.magnet, o => o !== e && (o.d.metal || o.d.conduct) && !o.d.beast && !o.isHero)) {
      const dx = sign(e.x - o.x); if (dx && entDist(o, e) > 1) moveEnt(o, dx, 0);
    }
  }
  // 鈴：風で鳴る
  if (e.d.bell && W.tick % 10 === 0 && (Math.abs(W.wind) > 0.2 || gustAt(e.x, e.y))) { noiseAt(e.cx, e.cy, e.d.noise || 4, 'bell'); Sfx.bell(0.3); e.ring = 0.6; }
  if (e.ring > 0) e.ring -= dt;
  // 泣いている：なみだ
  if (e.cryT > 0 && W.tick % 10 === 0) addWater(e.x + (e.w > 1 ? rndi(e.w) : 0), e.y + e.h - 1, 1);
  // 湯気
  if (e.hotT > 0 && W.tick % 8 === 0) Fx.steam(e.cx, e.y, 1);
  // 蜂は花のそばで蜜を作る
  if (e.k === '蜂' && W.tick % 200 === 0 && entsNear(e.cx, e.cy, 2, o => o.d.flower).length && !entsNear(e.cx, e.cy, 4, o => o.k === '蜜').length) {
    const f = entsNear(e.cx, e.cy, 2, o => o.d.flower)[0]; if (f) { const m = newEnt('蜜', f.x, f.y - 1); if (m) Fx.sparkle(m.cx, m.cy, INK.yamabuki, 5); }
  }
  // 鯉の滝のぼり：滝の筋に来た鯉は、ひと跳ねずつ滝をのぼり、のぼりきると竜になる
  if (e.k === '鯉' && W.tick % 7 === 0) {
    const fall = W.ents.find(o => o.alive && o.k === '滝' && o.src && Math.abs(o.x - e.x) <= 1 && o.y < e.y);
    if (fall && !(e.frozenT > 0 || e.sleepT > 0)) {
      if (!e.climbingNow) { e.climbingNow = true; e.talk('えいっ！', 1.4); Bus.emit('climbFalls', { who: e }); }
      if (e.x !== fall.x) { if (canPlace(e, fall.x, e.y)) moveEnt(e, fall.x - e.x, 0); }
      else if (e.y > fall.y + 1 && canPlace(e, e.x, e.y - 1)) { moveEnt(e, 0, -1); e.squash = 0.6; Fx.splash(e.cx, e.y + 1, 5); if (W.tick % 21 === 0) Sfx.splash(0.25); }
      e.climbN = (e.climbN || 0) + 1;
      if (e.y <= fall.y + 1 || e.climbN > 40) {
        e.climbingNow = false;
        Fx.sparkle(e.cx, e.cy, INK.ai, 30); Fx.splash(e.cx, e.cy, 16); Sfx.chime();
        const ok = transformEnt(e, '竜', { keepMine: true, force: true });
        if (ok) { e.charmT = Infinity; e.tamed = true; e.talk('ありがとう。背に乗りなさい', 3); }
        Bus.emit('dragon', { who: e }); toastSoon('鯉が滝をのぼって、竜になった！'); return;
      }
    } else if (e.climbingNow) e.climbingNow = false;
  }
  if (e.climbingNow) return;
  if (e.d.beast) aiTick(e);
  // 枯れ木に灰 → 花
  if (e.d.dead && W.tick % 10 === 0) {
    const ash = entsNear(e.cx, e.cy, 1.5, o => o.d.ash && o.k === '灰')[0];
    if (ash) { removeEnt(ash, 'used'); Fx.petals(e.cx, e.y, 30); Sfx.chime(); transformEnt(e, '桜', { keepMine: true }); Bus.emit('bloom', { who: e, by: 'ash' }); toastSoon('枯れ木に花が咲いた！'); }
  }
  // 柊・鰯は鬼を寄せつけない（aiTick の中で見る）
}

// ---- 転がる ----
function rollTick(e) {
  if (!e.grounded && !e.rollV) return;
  // 坂：進む先が一段下がっていれば転がり出す
  if (!e.rollV && e.grounded && W.tick % 6 === 0) {
    for (const s of [1, -1]) {
      if (canPlace(e, e.x + s, e.y) && !supportBelow(e, e.x + s, e.y) && canPlace(e, e.x + s, e.y + 1)) { e.rollV = s * 3; break; }
    }
  }
  if (!e.rollV) return;
  e.rollAcc = (e.rollAcc || 0) + Math.abs(e.rollV) * TICK;
  if (e.rollAcc < 1) return;
  e.rollAcc = 0;
  const s = sign(e.rollV);
  if (canPlace(e, e.x + s, e.y)) {
    moveEnt(e, s, 0); e.spin = (e.spin || 0) + s;
    if (e.d.snowball && tAt(e.x, e.y + e.h) === T.SNOW) { e.snowN = (e.snowN || 0) + 1; if (e.snowN % 3 === 0 && e.w < 3) { if (canPlace(e, e.x, e.y - 1, e.w + 1, e.h + 1) || canPlace(e, e.x - 1, e.y - 1, e.w + 1, e.h + 1)) { unoccupy(e); if (!canPlace(e, e.x, e.y - 1, e.w + 1, e.h + 1)) e.x--; e.y--; e.w++; e.h++; occupy(e); e.mods.big = 1; } } }
    // 平らならゆっくり止まる
    if (supportBelow(e, e.x + s, e.y)) e.rollV -= s * 0.35; else e.rollV += s * 0.6;
    if (Math.abs(e.rollV) < 0.6) e.rollV = 0;
    e.rollV = clamp(e.rollV, -9, 9);
  } else {
    // ぶつかった
    const hitList = entsAt(e.x + (s > 0 ? e.w : -1), e.y + e.h - 1).concat(entsAt(e.x + (s > 0 ? e.w : -1), e.y));
    const force = Math.abs(e.rollV) * (e.weight() + e.w);
    for (const o of hitList) {
      if (o === e) continue;
      if (o.d.fragile || (o.d.wall && force > 12) || (o.d.door && force > 8)) breakEnt(o, e);
      else if (o.d.beast) { o.stun(3); moveEnt(o, s, 0); }
      else if (o.d.push && o.weight() <= e.weight()) { o.rollV = e.rollV * 0.7; moveEnt(o, s, 0); }
    }
    const hero = W.hero; if (hero && hero.alive && hero.y >= e.y && hero.y < e.y + e.h && hero.x === (s > 0 ? e.x + e.w : e.x - 1) && force > 6) heroHurt('crush');
    Sfx.thud(0.5); e.rollV = 0;
  }
}

// ---- 音（生き物が気づく）----
function noiseAt(x, y, r, kind) {
  Bus.emit('noise', { x, y, r, kind });
  for (const e of entsNear(x, y, r, o => o.d.beast && !o.isHero)) {
    const ai = e.d.ai;
    if (e.sleepT > 0 && !(e.drunkT > 0) && !(e.hibern)) { e.sleepT = 0; e.talk('！', 1.2); }
    const fearsNoise = ai.fears.includes('#noise') || (kind === 'bell' && (ai.fears.includes('鈴') || ai.fears.includes('#bell')));
    if (fearsNoise) e.fleeFrom({ x: x - .5, y, w: 1, h: 1 }, 4);
    else if (kind === 'call' || kind === 'loud') { e.callT = 6; e.callTo = { x: Math.round(x), y: Math.round(y) }; }
  }
}

// ---- 生き物 ----
function seen(e, o) {
  if (o.hideT > 0) return false;
  if (o.isHero && (o.hero.buff.hide || o.hero.buff.disguise)) return false;
  if (W.dark > 0.5 && lightAt(o.x, o.y) < 0.3 && !(e.d.ai.night)) return false;
  if (inFog(o.x, o.y) || inFog(e.x, e.y)) return false;
  if (o.isHero && W.hero.hero.inHide) return false;
  return true;
}
function inFog(x, y) { for (const f of W.fogs || []) if (x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h) return true; return false; }
function feared(e) {
  const ai = e.d.ai, r = ai.sense;
  let worst = null, wd = 1e9;
  for (const o of W.ents) {
    if (!o.alive || o === e) continue;
    const dd = entDist(e, o); if (dd > r) continue;
    let f = false;
    if (ai.fears.includes(o.k) && !(o.charmT > 0 && o.d.beast)) f = true;
    if (!f && ai.fears.includes('#fire') && (o.d.flame || o.burnT > 0) && dd <= 3) f = true;
    if (!f && ai.fears.includes('#light') && o.glowR() > 2 && dd <= o.glowR()) f = true;
    if (!f && ai.yokai && o.d.onirepel && dd <= o.d.onirepel) f = true;
    if (!f && o.d.scary && !ai.yokai && o !== e && dd <= 3 && !(o.charmT > 0) && !o.calm()) f = true;
    if (!f && o.d.sting && !ai.yokai && dd <= 1.5 && !e.d.tinyBody) f = true;
    if (!f && ai.yokai && o.d.mirror && dd <= 3) f = true;
    if (!f && o.d.scare && o.d.scare === e.k && dd <= (o.d.scareR || 4)) f = true;
    if (!f && o.d.scare === '鳥' && (e.k === '烏' || e.k === '鳥') && dd <= (o.d.scareR || 4)) f = true;
    if (!f && o.d.beast && o.d.ai.chase && o.d.ai.chase.includes(e.k) && !o.calm() && dd <= 4) f = true;
    if (f && dd < wd) { wd = dd; worst = o; }
  }
  // 自分に鈴をつけた人
  const h = W.hero;
  if (h && h.alive && h.hero.buff.bell && (ai.fears.includes('鈴') || ai.fears.includes('#noise')) && entDist(e, h) <= 5) { worst = h; }
  return worst;
}
function nearestFood(e) {
  const ai = e.d.ai; let best = null, bd = 1e9;
  for (const o of W.ents) {
    if (!o.alive || o === e || !o.d.food || o.burnT > 0) continue;
    if (!ai.eats.includes(o.d.food)) continue;
    if (o.d.beast && !o.inWater() && o.d.swim && !e.d.swim) { /* 陸の魚はとれる */ }
    else if (o.d.beast) continue;
    const dd = entDist(e, o); if (dd > ai.sense + 1 || dd >= bd) continue;
    if (!seen(e, o) && dd > 1.5) continue;
    bd = dd; best = o;
  }
  return best;
}
function nearestLiked(e) {
  const ai = e.d.ai; let best = null, bd = 1e9;
  for (const o of W.ents) {
    if (!o.alive || o === e) continue;
    if (!ai.likes.includes(o.k) && !(ai.likes.includes('湯') && o.hotT > 0 && o.k === '湯')) continue;
    const dd = entDist(e, o); if (dd > ai.sense + 1 || dd >= bd) continue;
    bd = dd; best = o;
  }
  return best;
}
function eat(e, f) {
  const fk = f.k, food = f.d.food;
  removeEnt(f, 'eaten');
  Sfx.munch(); Fx.crumbs(f.cx, f.cy, INK[f.d.col] || '#a85');
  e.fullT = 45; e.talk(rpick(['もぐもぐ', 'うまい', 'ぱくっ']), 1.6);
  Bus.emit('eat', { who: e, what: fk });
  if (food === 'sake') { e.drunkT = 4; e.talk('ひっく', 2); Bus.emit('drunk', { who: e }); }
  else if (food === 'kinoko') { e.laughT = 30; e.talk('あははは', 3); Bus.emit('laugh', { who: e }); }
  else if (food === 'dango') { e.charmT = Infinity; e.companion = true; e.talk('お供します', 2.5); Bus.emit('friend', { who: e, by: '団子' }); }
  else if (e.d.ai.likes.includes(fk) || e.d.ai.eats[0] === food) {
    if (e.d.ai.hostile) { e.tamed = true; e.charmT = 90; } else e.charmT = Math.max(e.charmT, 90);
    Fx.hearts(e.cx, e.y, 4); Bus.emit('friend', { who: e, by: fk });
  }
}
function aiTick(e) {
  const ai = e.d.ai, A = e.ai;
  A.cd -= TICK; A.think -= TICK;
  if (e.frozenT > 0 || e.stunT > 0) return;
  if (e.sleepT > 0) { if (W.tick % 50 === e.id % 50) Fx.zzz(e.cx, e.y); return; }
  if (A.think <= 0) { A.think = 0.28 + rnd() * 0.14; try { decide(e); } catch (err) { reportError(err); } }
  if (A.cd <= 0 && A.goal) { A.cd = 1 / Math.max(0.3, e.speed()); stepToward(e, A.goal); }
  if (e.danceT > 0 && W.tick % 8 === 0 && e.grounded && canPlace(e, e.x, e.y - 1)) { moveEnt(e, 0, -1); }
}
function decide(e) {
  const ai = e.d.ai, A = e.ai, hero = W.hero;
  A.goal = null; A.run = false;
  // 乗せている
  if (hero && hero.alive && hero.hero.ride === e) { A.state = 'ride'; if (hero.hero.rideGoal) A.goal = hero.hero.rideGoal; return; }
  if (e.leaving) { A.goal = { x: e.leaveDir > 0 ? W.w + 4 : -5, y: e.y }; A.run = true; leaveCheck(e); return; }
  if (e.danceT > 0) { A.state = 'dance'; if (e.danceAt && Math.abs(e.x - e.danceAt.x) > 2) A.goal = e.danceAt; return; }
  if (e.lookT > 0) { A.state = 'look'; return; }
  // こわい
  const f = feared(e);
  if (f) e.fleeFrom(f, 3);
  if (e.fearT > 0 && e.fearFrom) {
    A.state = 'flee';
    const dir = e.cx >= e.fearFrom.x ? 1 : -1;
    A.goal = { x: e.x + dir * 8, y: e.y }; A.run = true;
    // 鬼は外！：豆で逃げた鬼はもどらない
    if (ai.yokai && f && (f.k === '豆' || f.k === '桃' || f.d.mirror || f.k === '鐘' || (ai.snowy && (f.d.flame || f.burnT > 0 || f.k === '湯' || f.hotT > 0)))) {
      if (!e.leaving) { e.leaving = true; e.leaveDir = dir; e.talk(f.k === '豆' ? 'いてて、豆はかなわん' : ai.snowy ? '……あつい。わたしは、行くわ' : 'ひえっ', 2.5); Bus.emit('flee', { who: e, from: f.k }); if (!ai.snowy) Sfx.oni(); }
    }
    if (f && f.k === '鈴' || (f === hero && hero.hero.buff.bell)) Bus.emit('flee', { who: e, from: '鈴' });
    if (e.fearT > 0 && (e.x <= 0 || e.x + e.w >= W.w)) { if (!e.d.ai.guard || e.leaving) { e.leaving = true; e.leaveDir = dir; } }
    leaveCheck(e);
    return;
  }
  // 呼ばれた
  if (e.callT > 0 && e.callTo) { A.state = 'called'; A.goal = e.callTo; if (Math.abs(e.x - e.callTo.x) <= 1) e.callT = Math.min(e.callT, 1.5); return; }
  // 怒っている：前へ突進
  if (e.angryT > 0) { A.state = 'charge'; A.goal = { x: e.x + e.dir * 6, y: e.y }; A.run = true; return; }
  // 食べ物
  if (e.fullT <= 0 && ai.eats.length) {
    const food = nearestFood(e);
    if (food) {
      if (touching(e, food) || entDist(e, food) <= 1.01) { eat(e, food); return; }
      A.state = 'food'; A.goal = { x: food.x, y: food.y }; return;
    }
  }
  // 腹いっぱいの鯉は、近くの滝へのぼりに行く
  if (ai.climbFalls && e.fullT > 0) {
    const fall = W.ents.find(o => o.alive && o.k === '滝' && o.src && o.y < e.y && Math.abs(o.x - e.x) <= 6);
    if (fall) { A.state = 'climb'; A.goal = { x: fall.x, y: e.y }; return; }
  }
  // 好きな物
  const liked = nearestLiked(e);
  if (liked && !e.charmT) {
    if (liked.k === '玉' && e.k === '竜' && entDist(e, liked) <= 1.5) { e.charmT = Infinity; Fx.hearts(e.cx, e.y, 6); Bus.emit('friend', { who: e, by: '玉' }); }
    if (liked.k === '酒' && entDist(e, liked) <= 1.01) { eat(e, liked); return; }
    if (entDist(e, liked) > 1.2) { A.state = 'like'; A.goal = { x: liked.x, y: liked.y }; return; }
  }
  // 追いかける（猫→鼠 など）
  if (ai.chase && !e.calm()) {
    const prey = W.ents.find(o => o.alive && o !== e && ai.chase.includes(o.k) && entDist(e, o) <= ai.sense && !(o.charmT > 0 && e.charmT > 0));
    if (prey && !(e.charmT > 0 && prey.d.ai && prey.d.ai.yokai === undefined && false)) {
      if (ai.bark && W.tick % 30 < 6) { Sfx.bark(); e.talk('わん！', 1); noiseAt(e.cx, e.cy, 3, 'bark'); }
      prey.fleeFrom(e, 3);
      A.state = 'chase'; A.goal = { x: prey.x, y: prey.y }; A.run = true; return;
    }
  }
  // 友だち：ついてくる
  if (e.charmT > 0 && hero && hero.alive && !ai.guard || (e.charmT > 0 && e.companion)) {
    if (hero && hero.alive) {
      const dd = entDist(e, hero);
      if (dd > 2.2) { A.state = 'follow'; A.goal = { x: hero.x - hero.hero.face * 1, y: hero.y }; return; }
      A.state = 'near'; return;
    }
  }
  // 見張り
  if (ai.guard) {
    A.state = 'guard';
    if (e.charmT > 0 || e.laughT > 0 || e.cryT > 0 || e.bowT > 0) {
      // 道をあける：持ち場の横へ
      const side = e.stepAside || (e.stepAside = (hero && hero.x < e.x) ? 1 : -1);
      if (e.x === A.home) { if (canPlace(e, e.x, e.y - 1) && (e.charmT > 0)) { A.goal = { x: e.x + side * 2, y: e.y }; } }
      return;
    }
    if (Math.abs(e.x - A.home) > 0) { A.goal = { x: A.home, y: e.y }; return; }
    if (hero && hero.alive && entDist(e, hero) <= 1.05 && !hero.hero.buff.hide && !hero.hero.buff.disguise && !e.calm()) guardShove(e, hero);
    if (ai.fan && hero && hero.alive && entDist(e, hero) <= 4 && !e.calm() && W.tick % 60 < 8 && !W.gusts.some(g => g.src === e)) {
      const dir = sign(hero.x - e.x) || 1;
      W.gusts.push({ x: e.x + (dir > 0 ? e.w : -1), y0: e.y - 1, y1: e.y + e.h, dir, str: 2.5, ttl: 1.2, range: 8, front: e.x, src: e });
      e.talk('かーっ！', 1.2); Sfx.wind(0.8); Fx.windLines(e.cx, e.cy, dir);
    }
    if (ai.snowy && W.tick % 12 === 0) { Fx.snowPuff(e.cx, e.cy); }
    return;
  }
  // 人を追う（熊）
  if (ai.hostile && !e.tamed && !e.calm() && hero && hero.alive) {
    const target = nearestPrey(e);
    if (target && entDist(e, target) <= ai.sense && seen(e, target)) {
      A.state = 'hunt'; A.goal = { x: target.x, y: target.y }; A.run = true;
      if (entDist(e, target) <= 1.05) {
        if (target.isHero) heroHurt('caught');
        else if (target.d.decoy) { target.squash = 1; e.talk('むむ？', 2); e.lookT = 6; target.d.decoy && Fx.dust(target.cx, target.cy, 6); }
        else { target.fleeFrom(e, 4); }
      }
      return;
    }
  }
  // ぶらぶら
  A.state = 'idle';
  A.wanderT -= 0.35;
  if (A.wanderT <= 0) {
    A.wanderT = 1.5 + rnd() * 3;
    if (chance(0.55)) {
      const span = ai.guard ? 0 : (e.d.fly ? 5 : 4);
      const tx = clamp(A.home + rndi(span * 2 + 1) - span, 0, W.w - e.w);
      A.wander = { x: tx, y: e.d.fly ? clamp(e.y + rndi(5) - 2, 1, W.h - 3) : e.y };
    } else A.wander = null;
  }
  if (A.wander) A.goal = A.wander;
  // 鳥・虫は木や花にとまる
  if (ai.perch && !A.goal && chance(0.02)) e.perched = !e.perched;
}
function nearestPrey(e) {
  const hero = W.hero; let best = hero, bd = hero ? entDist(e, hero) : 1e9;
  for (const o of W.ents) {
    if (!o.alive || !(o.d.decoy || (o.k === '人' && o !== hero))) continue;
    const dd = entDist(e, o); if (dd < bd) { bd = dd; best = o; }
  }
  return best;
}
function leaveCheck(e) {
  if (e.x + e.w <= 0 || e.x >= W.w || (e.leaving && (e.x <= 0 && e.leaveDir < 0 || e.x + e.w >= W.w && e.leaveDir > 0))) {
    Bus.emit('left', { who: e }); removeEnt(e, 'left');
  }
}
function guardShove(e, hero) {
  if (hero.hero.shoveCD > 0) return;
  hero.hero.shoveCD = 1.2;
  const dir = sign(hero.x - e.x) || -1;
  e.talk(e.k === '鬼' ? '通さん！' : e.k === '河童' ? 'ここは通さんぞ' : e.k === '天狗' ? '礼を知らぬ者は通さぬ' : e.k === '雪女' ? '……さむいでしょう' : 'だめ', 2);
  Sfx.thud(0.4);
  heroKnock(dir, 2);
  Bus.emit('shove', { who: e });
}
// 生き物の一歩
function stepToward(e, g) {
  const ai = e.d.ai;
  if (e.flying() || ai.fly && !e.perched && e.d.fly) return flyStep(e, g);
  if (e.d.swim && ai.swimOnly) return swimStep(e, g);
  const dx = sign(g.x - e.x);
  if (!dx) { if (e.ai.wander && e.ai.goal === e.ai.wander) e.ai.wander = null; return; }
  e.dir = dx;
  if (!e.grounded && !e.inWater()) return;
  tryWalk(e, dx, e.ai.run);
}
function tryWalk(e, dx, urgent) {
  const ai = e.d.ai;
  const nx = e.x + dx;
  if (nx < 0 || nx + e.w > W.w) { if (e.leaving || (e.fearT > 0 && !ai.guard)) { e.leaving = true; e.leaveDir = dx; moveEnt(e, dx, 0, true); leaveCheck(e); } return false; }
  if (ai.waterOnly && !waAt(nx, e.y + e.h) && !waAt(nx, e.y + e.h - 1)) { e.dir = -dx; if (e.ai.wander) e.ai.wander = null; return false; }
  if (canPlace(e, nx, e.y)) {
    // 落ちる高さ・深い水を見る
    let drop = 0; while (drop < 12 && canPlace(e, nx, e.y + drop + 1) && !(e.floats() && deepAt(nx, e.y + drop + e.h))) drop++;
    const deep = deepAt(nx, e.y + e.h - 1) || (drop > 0 && deepAt(nx, e.y + drop + e.h - 1));
    if (deep && !e.d.swim && !e.floats()) { return jumpGap(e, dx) || false; }
    if (drop > (ai.drop || 3) && !(urgent && drop <= 5)) { return jumpGap(e, dx) || false; }
    moveEnt(e, dx, 0); return true;
  }
  // 段をのぼる
  if (ai.waterOnly) { e.dir = -dx; return false; }
  for (let s = 1; s <= (ai.step || 1) + (e.mods.big ? 1 : 0); s++) {
    if (canPlace(e, e.x, e.y - s) && canPlace(e, nx, e.y - s)) { moveEnt(e, 0, -s); moveEnt(e, dx, 0); e.hop = 1; return true; }
  }
  // 力持ちは押す・怒っていれば壊す
  const front = entsAt(dx > 0 ? e.x + e.w : e.x - 1, e.y + e.h - 1).filter(o => o !== e && !o.isHero);
  for (const o of front) {
    if (e.angryT > 0 && e.strength() >= 2 && (o.d.wall || o.d.door || o.d.fragile || o.d.gate || o.k === '岩')) { breakEnt(o, e); Bus.emit('ram', { who: e, what: o.k }); e.angryT = Math.min(e.angryT, 1); return true; }
    if (o.d.push && o.weight() <= e.strength() && canPlace(o, o.x + dx, o.y)) { moveEnt(o, dx, 0); moveEnt(e, dx, 0); Bus.emit('pushed', { who: o, by: e }); return true; }
  }
  // かじる（鼠）
  if (ai.gnaw) { const r = entsNear(e.cx, e.cy, 1.2, o => o.d.rope || o.d.ivy || o.d.net)[0]; if (r) { Fx.crumbs(r.cx, r.cy, '#a87'); removeEnt(r, 'gnawed'); Bus.emit('gnaw', { who: e, what: r.k }); return true; } }
  if (e.angryT > 0) e.angryT = 0;
  if (e.ai.wander) e.ai.wander = null;
  e.dir = -dx;
  return false;
}
function jumpGap(e, dx) {
  const J = (e.d.ai.jump || 1) + (e.mods.big ? 1 : 0);
  for (let j = 2; j <= J + 1; j++) {
    const tx = e.x + dx * j;
    for (const dy of [0, -1, 1]) {
      if (canPlace(e, tx, e.y + dy) && supportBelow(e, tx, e.y + dy)) {
        let clear = true;
        for (let k = 1; k < j; k++) if (!canPlace(e, e.x + dx * k, e.y + Math.min(0, dy) - 1) && !canPlace(e, e.x + dx * k, e.y + Math.min(0, dy))) clear = false;
        if (!clear) continue;
        unoccupy(e); e.x = tx; e.y = e.y + dy; occupy(e); e.hop = 1.4; Sfx.hop();
        return true;
      }
    }
  }
  return false;
}
function flyStep(e, g) {
  const dx = sign(g.x - e.x), dy = sign((g.y != null ? g.y : e.y) - e.y);
  if (dx) e.dir = dx;
  if (dx && canPlace(e, e.x + dx, e.y)) { moveEnt(e, dx, 0); }
  else if (dx && canPlace(e, e.x + dx, e.y - 1) && e.y > 0) { moveEnt(e, dx, -1); }
  else if (dy && canPlace(e, e.x, e.y + dy) && e.y + dy >= 0) moveEnt(e, 0, dy);
  else if (!dx && !dy) return;
  else if (canPlace(e, e.x, e.y - 1) && e.y > 0) moveEnt(e, 0, -1);
  if (dy && dx && W.tick % 2 === 0 && canPlace(e, e.x, e.y + dy) && e.y + dy >= 0) moveEnt(e, 0, dy);
  if (e.leaving) leaveCheck(e);
}
function swimStep(e, g) {
  const inW = (x, y) => waAt(x, y) >= 3;
  if (!inW(e.x, e.y)) {
    // 陸にあがった魚：水へもどろうと跳ねる
    for (const s of [e.dir, -e.dir]) if (canPlace(e, e.x + s, e.y) && (inW(e.x + s, e.y) || inW(e.x + s, e.y + 1))) { moveEnt(e, s, 0); return; }
    if (W.tick % 20 === 0) { e.hop = 1; if (canPlace(e, e.x + e.dir, e.y - 1)) moveEnt(e, e.dir, -1); else e.dir *= -1; }
    return;
  }
  const dx = sign(g.x - e.x);
  if (dx && canPlace(e, e.x + dx, e.y) && inW(e.x + dx, e.y)) { e.dir = dx; moveEnt(e, dx, 0); }
  else if (canPlace(e, e.x, e.y + 1) && inW(e.x, e.y + 1) && chance(0.3)) moveEnt(e, 0, 1);
  else if (canPlace(e, e.x, e.y - 1) && inW(e.x, e.y - 1) && chance(0.3)) moveEnt(e, 0, -1);
  else e.dir *= -1;
}
let _toastSoon = null;
function toastSoon(s) { _toastSoon = s; }

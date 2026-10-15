// ---------------------------------------------------------------------------
// 世界：地面のマス目・水・砂・物（字）・重さ・火・熱・冷え・風・光
//   x は右へ、y は下へ。1マス = 1。
// ---------------------------------------------------------------------------
const T = { AIR: 0, EARTH: 1, ROCK: 2, SAND: 3, ICE: 4, SNOW: 5, MUD: 6, PLANK: 7, BLANK: 8, CRACK: 9, MOSS: 10 };
const T_NAME = ['空', '土', '岩', '砂', '氷', '雪', '泥', '板', '白', '隙', '苔'];
const T_SOLID = [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1];
const T_DIG = [0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1];      // 穴・掘る で取れる
const T_SOIL = [0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1];     // 草木が根を張れる
const WMAX = 8;          // 水の量（1マスいっぱい）
const DEEP = 4;          // これ以上は「深い」（人は入れない・浮く物はここに浮く）
const TICK = 1 / 20;     // 世界の1刻み（秒）

let W = null;            // いまの世界
// 世界の時計で、あとで起こす（止めている間は進まない）
function later(sec, fn) { if (W) W.timers.push({ at: W.time + sec, fn }); }

function makeWorld(w, h) {
  return {
    w, h,
    t: new Uint8Array(w * h),
    wa: new Uint8Array(w * h),
    heat: new Float32Array(w * h),     // たまった熱（氷・雪が溶ける）
    light: new Float32Array(w * h),
    occ: new Int32Array(w * h),        // その場所をふさいでいる物（id+1）
    ents: [], byId: new Map(), nextId: 1,
    tick: 0, time: 0,
    dark: 0, darkBase: 0, night: false, // 暗さ（0..1）
    wind: 0,                            // いつも吹いている風（左右・強さ）
    gusts: [],                          // 書いた風
    rains: [],
    sunOut: false,
    tdirty: true,                        // 地面の絵を描き直す
    events: [],                          // この場面で起きたこと（印の判定に使う）
    hero: null,
    paused: false,
    inkHeld: [],                         // しばらく墨を使っている効き目 {ink, ttl, id}
    timers: [],                          // 世界の時計で後から起きること
  };
}
const idx = (x, y) => y * W.w + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < W.w && y < W.h;
function tAt(x, y) {
  if (y < 0) return T.AIR;
  if (x < 0 || x >= W.w || y >= W.h) return T.ROCK;
  return W.t[y * W.w + x];
}
function setT(x, y, v) { if (!inb(x, y)) return; const i = y * W.w + x; if (W.t[i] !== v) { W.t[i] = v; W.tdirty = true; if (T_SOLID[v]) { if (W.wa[i] && y > 0) { addWater(x, y - 1, W.wa[i]); } W.wa[i] = 0; } } }
function waAt(x, y) { return inb(x, y) ? W.wa[y * W.w + x] : 0; }
function deepAt(x, y) { return waAt(x, y) >= DEEP; }
function addWater(x, y, amt) {
  while (amt > 0 && inb(x, y)) {
    if (T_SOLID[tAt(x, y)] || W.occ[idx(x, y)] && entSolid(W.byId.get(W.occ[idx(x, y)] - 1))) { y--; continue; }
    const i = idx(x, y), room = WMAX - W.wa[i];
    const mv = Math.min(room, amt); W.wa[i] += mv; amt -= mv;
    y--;
  }
}

// ---- 物（字）----
function entSolid(e) { return !!(e && e.alive && (e.d.solid || e.solidNow) && !e.open); }
function entBlocks(e) { return !!(e && e.alive && !e.open && (e.d.solid || e.solidNow || (e.d.block && !e.calm()))); }

function rebuildOcc() {
  W.occ.fill(0);
  for (const e of W.ents) {
    if (!e.alive || !entBlocks(e)) continue;
    for (let yy = e.y; yy < e.y + e.h; yy++) for (let xx = e.x; xx < e.x + e.w; xx++) {
      if (inb(xx, yy)) { const i = idx(xx, yy); if (!W.occ[i] || entSolid(e)) W.occ[i] = e.id + 1; }
    }
  }
}
function occAt(x, y) { if (!inb(x, y)) return null; const o = W.occ[idx(x, y)]; return o ? W.byId.get(o - 1) : null; }

// その物が (x,y) のマスに入れるか
function cellFreeFor(e, x, y) {
  if (x < 0 || x >= W.w || y >= W.h) return false;
  if (y < 0) return !!(e && e.d.fly);
  const tt = W.t[y * W.w + x];
  if (T_SOLID[tt]) {
    if (tt === T.CRACK && e && e.tiny()) { /* 小さい者は隙間を通れる */ }
    else return false;
  }
  const o = W.occ[y * W.w + x];
  if (o) {
    const b = W.byId.get(o - 1);
    if (b && b !== e && b.alive) {
      if (entSolid(b)) { if (!(e && (e.ridingOn === b || b.ridingOn === e))) return false; }
      else if (e && e.isHero && entBlocks(b)) return false;
      else if (e && !e.isHero && e.d.block && b.d.block) return false;
    }
  }
  return true;
}
function canPlace(e, x, y, w, h) {
  w = w || e.w; h = h || e.h;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (!cellFreeFor(e, xx, yy)) return false;
  return true;
}
// 下に支えがあるか
function supportBelow(e, x, y) {
  const by = y + e.h;
  if (by >= W.h) return true;
  // 両はしが岸にかかっている（橋・板・丸太）
  if (e.w >= 2 && e.h === 1 && (e.d.solid || e.solidNow)) {
    const solidAt = (xx, yy) => T_SOLID[tAt(xx, yy)] || (occAt(xx, yy) && occAt(xx, yy) !== e && entSolid(occAt(xx, yy)));
    if (solidAt(x - 1, y) && solidAt(x + e.w, y)) return true;
  }
  for (let xx = x; xx < x + e.w; xx++) {
    const tt = tAt(xx, by);
    if (T_SOLID[tt] && !(tt === T.CRACK && e.tiny())) return true;
    const o = inb(xx, by) ? W.occ[idx(xx, by)] : 0;
    if (o) { const b = W.byId.get(o - 1); if (b && b !== e && b.alive && entSolid(b)) return true; }
    if (e.floats() && waAt(xx, by) >= DEEP && waAt(xx, y + e.h - 1) < DEEP) return true;
    // ほかの物の上（solid でなくても、草の上は立てない）
  }
  return false;
}
function entsAt(x, y, filt) {
  const out = [];
  for (const e of W.ents) if (e.alive && x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h && (!filt || filt(e))) out.push(e);
  return out;
}
function entsNear(cx, cy, r, filt) {
  const out = [];
  for (const e of W.ents) {
    if (!e.alive) continue;
    const dx = Math.max(e.x - cx, 0, cx - (e.x + e.w - 1)), dy = Math.max(e.y - cy, 0, cy - (e.y + e.h - 1));
    if (dx * dx + dy * dy <= r * r && (!filt || filt(e))) out.push(e);
  }
  return out;
}
function entDist(a, b) {
  const dx = Math.max(a.x - (b.x + b.w - 1), 0, b.x - (a.x + a.w - 1));
  const dy = Math.max(a.y - (b.y + b.h - 1), 0, b.y - (a.y + a.h - 1));
  return Math.hypot(dx, dy);
}
function touching(a, b) { return entDist(a, b) <= 1.01; }
// 上に乗っている物
function ridersOf(e) {
  const out = [];
  for (const o of W.ents) {
    if (!o.alive || o === e || o.d.fly && !o.grounded) continue;
    if (o.y + o.h === e.y && o.x < e.x + e.w && o.x + o.w > e.x && !o.d.root) out.push(o);
  }
  return out;
}
// 物を動かす（上に乗っている物もいっしょに）
function moveEnt(e, dx, dy, force) {
  if (!e.alive) return false;
  const nx = e.x + dx, ny = e.y + dy;
  if (!force && !canPlace(e, nx, ny)) return false;
  const riders = (e.d.solid || e.solidNow) ? ridersOf(e) : [];
  unoccupy(e);
  e.x = nx; e.y = ny;
  occupy(e);
  for (const r of riders) { if (r.alive && !r.pinned) { if (!moveEnt(r, dx, dy)) { if (dy > 0) { /* 乗り物が下がった：自分で落ちる */ } } } }
  return true;
}
function unoccupy(e) {
  if (!entBlocks(e)) return;
  for (let yy = e.y; yy < e.y + e.h; yy++) for (let xx = e.x; xx < e.x + e.w; xx++) if (inb(xx, yy) && W.occ[idx(xx, yy)] === e.id + 1) W.occ[idx(xx, yy)] = 0;
}
function occupy(e) {
  if (!entBlocks(e)) return;
  for (let yy = e.y; yy < e.y + e.h; yy++) for (let xx = e.x; xx < e.x + e.w; xx++) if (inb(xx, yy)) {
    const i = idx(xx, yy); if (!W.occ[i] || entSolid(e)) W.occ[i] = e.id + 1;
    if (entSolid(e) && W.wa[i]) { const v = W.wa[i]; W.wa[i] = 0; addWater(xx, yy - 1, v); }
  }
}

// ---- 重さ・落下 ----
function physicsStep() {
  // 下にある物から順に
  const list = W.ents.filter(e => e.alive).sort((a, b) => (b.y + b.h) - (a.y + a.h));
  for (const e of list) {
    if (!e.alive || e.pinned) continue;
    if (e.stopT > 0) continue;                                // 止まっている
    if (e.isHero && e.hero.climbing) { e.fallN = 0; continue; }
    if (e.flying()) { e.fallN = 0; e.grounded = false; continue; }
    if (e.d.root && e.rooted) { if (rootOk(e)) { e.fallN = 0; continue; } else e.rooted = false; }
    if (e.climbingNow) { e.fallN = 0; continue; }
    const sup = supportBelow(e, e.x, e.y);
    if (sup) {
      if (e.fallN >= 2) landImpact(e, e.fallN);
      e.fallN = 0; e.grounded = true;
      // 浮く物が水に沈んでいたら浮き上がる
      if (e.floats() && waAt(e.x, e.y + e.h - 1) >= DEEP && canPlace(e, e.x, e.y - 1)) { moveEnt(e, 0, -1); e.anim = 'bob'; }
      continue;
    }
    e.grounded = false;
    // 水の中：浮く物は上へ、重い物はゆっくり沈む
    const inWater = waAt(e.x, e.y + e.h - 1) >= DEEP;
    if (inWater && e.floats()) { if (canPlace(e, e.x, e.y - 1) && waAt(e.x, e.y + e.h - 2) >= DEEP) moveEnt(e, 0, -1); continue; }
    if (inWater && !e.d.heavy && (W.tick + e.id) % 3) continue;   // 水の中はゆっくり
    if (e.slowFall() && (W.tick + e.id) % 4) continue;           // 傘・軽い
    if (canPlace(e, e.x, e.y + 1)) {
      moveEnt(e, 0, 1); e.fallN++;
      if (e.y >= W.h - 1 || isVoid(e)) { fellIntoVoid(e); }
    } else {
      // 物の上に乗れない形（草などの上）でも止まる
      if (e.fallN >= 2) landImpact(e, e.fallN);
      e.fallN = 0; e.grounded = true;
    }
  }
}
function rootOk(e) {
  for (let xx = e.x; xx < e.x + e.w; xx++) { const tt = tAt(xx, e.y + e.h); if (T_SOLID[tt]) return true; const o = occAt(xx, e.y + e.h); if (o && entSolid(o)) return true; }
  return false;
}
function isVoid(e) {
  const by = e.y + e.h;
  if (by >= W.h) return true;
  return false;
}
function fellIntoVoid(e) {
  if (e.isHero) { heroHurt('fall'); return; }
  removeEnt(e, 'void');
}
function landImpact(e, n) {
  e.squash = 1;
  const heavy = e.weight();
  if (n >= 2) { Sfx.thud(Math.min(1, heavy * 0.35 + n * 0.06)); Fx.dust(e.x + e.w / 2, e.y + e.h, Math.min(14, 4 + heavy * 3)); }
  if (e.isHero) { if (n > 4 && !e.hero.buff.light) heroHurt('fall'); return; }
  // 下にあるものに当たる
  if (heavy >= 2 || (heavy >= 1 && n >= 4)) {
    for (let xx = e.x; xx < e.x + e.w; xx++) {
      const below = entsAt(xx, e.y + e.h);
      for (const b of below) {
        if (b.d.fragile) { breakEnt(b, e); }
        else if (b.d.beast && !b.d.big) { b.stun(4); Bus.emit('hit', { who: b, by: e }); }
      }
      if (heavy >= 2 && tAt(xx, e.y + e.h) === T.ICE && n >= 3) { setT(xx, e.y + e.h, T.AIR); addWater(xx, e.y + e.h, WMAX); Fx.shatter(xx + .5, e.y + e.h + .5, '#9cc7e6'); }
    }
    const hero = W.hero;
    if (hero && hero.alive && hero.y === e.y + e.h && hero.x >= e.x && hero.x < e.x + e.w) heroHurt('crush');
  }
}

// ---- 水 ----
function waterStep() {
  const w = W.w, h = W.h, t = W.t, wa = W.wa, occ = W.occ;
  const dir = (W.tick & 1) ? 1 : -1;
  const blocked = i => T_SOLID[t[i]] || (occ[i] && entSolid(W.byId.get(occ[i] - 1)));
  for (let y = h - 1; y >= 0; y--) {
    for (let k = 0; k < w; k++) {
      const x = dir > 0 ? k : w - 1 - k;
      const i = y * w + x;
      let v = wa[i]; if (!v) continue;
      if (t[i] === T.BLANK) { wa[i] = 0; continue; }              // 白紙へ消える
      if (y === h - 1) { wa[i] = Math.max(0, v - 1); continue; }  // 底から少しずつ抜ける
      // 下へ
      const ib = i + w;
      if (!blocked(ib)) {
        if (t[ib] === T.BLANK) { wa[i] = 0; continue; }
        const room = WMAX - wa[ib];
        if (room > 0) { const mv = Math.min(v, room); wa[ib] += mv; v -= mv; wa[i] = v; if (!v) continue; }
      }
      // 横へ（自分より2以上低い所へ1ずつ）
      for (const s of [dir, -dir]) {
        const nx = x + s; if (nx < 0 || nx >= w) continue;
        const ni = i + s;
        if (blocked(ni)) continue;
        if (t[ni] === T.BLANK) { if (v > 0) { v--; wa[i] = v; } continue; }
        const n = wa[ni];
        if (v - n >= 2) { const mv = (v - n) >> 1; wa[ni] += mv; v -= mv; wa[i] = v; }
        else if (v - n === 1 && v > 1 && ((W.tick + x) % 7 === 0)) { /* 揺れを止めるため、まれにだけ */ }
      }
      // 1だけの水たまりは、ゆっくり乾く
      if (v === 1 && ((W.tick * 13 + i) % 211 === 0)) { const bt = t[ib]; if (T_SOLID[bt] && bt !== T.ICE) { wa[i] = 0; if (bt === T.EARTH && chance(0.4)) setT(x, y + 1, T.MUD); } }
    }
  }
  // 圧で押し上がる（せき止めた水が上の段へあふれる）
  if (W.tick % 4 === 0) {
    for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (wa[i] === WMAX && !blocked(i - w) && wa[i - w] === 0) {
        // 横に同じ高さ以上の水柱があれば、少し押し上げる
        let push = false;
        for (const s of [-1, 1]) { let xx = x + s, ok = 0; while (xx >= 0 && xx < w && !blocked(y * w + xx) && wa[y * w + xx] === WMAX && ok < 12) { if (wa[(y - 1) * w + xx] > 2) { push = true; break; } xx += s; ok++; } }
        if (push) { wa[i]--; wa[i - w]++; }
      }
    }
  }
}

// ---- 砂（下へ・斜めへこぼれる）----
function sandStep() {
  const w = W.w;
  for (let y = W.h - 2; y >= 0; y--) for (let x = 0; x < w; x++) {
    if (W.t[y * w + x] !== T.SAND) continue;
    const below = tAt(x, y + 1);
    const freeT = (xx, yy) => { const tt = tAt(xx, yy); return (tt === T.AIR || tt === T.BLANK) && !(occAt(xx, yy) && entSolid(occAt(xx, yy))); };
    if (freeT(x, y + 1)) { moveSand(x, y, x, y + 1); continue; }
    if (below === T.AIR) continue;
    const s = chance(0.5) ? 1 : -1;
    if (freeT(x + s, y + 1) && freeT(x + s, y)) moveSand(x, y, x + s, y + 1);
    else if (freeT(x - s, y + 1) && freeT(x - s, y)) moveSand(x, y, x - s, y + 1);
  }
}
function moveSand(x, y, nx, ny) {
  setT(x, y, T.AIR);
  if (tAt(nx, ny) === T.BLANK) return;
  const v = waAt(nx, ny);
  W.t[idx(nx, ny)] = T.SAND; W.tdirty = true;
  if (v) { W.wa[idx(nx, ny)] = 0; addWater(x, y, v); }
  const hero = W.hero; if (hero && hero.alive && hero.x === nx && hero.y === ny) heroHurt('crush');
  for (const e of entsAt(nx, ny)) if (!e.isHero && !e.d.fly) { if (!moveEnt(e, 0, -1)) removeEnt(e, 'buried'); }
}

// ---- 火・熱・冷え ----
function thermalStep() {
  const dt = TICK * 4;
  // 燃えている物
  for (const e of W.ents) {
    if (!e.alive) continue;
    if (e.burnT > 0 && e.eternal) continue;
    if (e.burnT > 0) {
      e.burnT -= dt;
      if (e.inWater() || e.wetT > 0) { extinguish(e); continue; }
      // まわりへ燃え移る
      const spread = e.d.spreadless ? 0.04 : e.d.flame ? 0.33 : 0.22;
      for (const o of entsNear(e.x + e.w / 2 - .5, e.y + e.h / 2 - .5, 1.6 + (e.w > 1 ? .8 : 0), o => o !== e && o.canBurn())) {
        let p = spread; const wd = W.wind + gustAt(o.x, o.y);
        if (wd && sign(o.x - e.x) === sign(wd)) p *= 1.8;
        if (chance(p)) ignite(o, e);
      }
      // 板の地面
      for (let yy = e.y - 1; yy <= e.y + e.h; yy++) for (let xx = e.x - 1; xx <= e.x + e.w; xx++) {
        if (tAt(xx, yy) === T.PLANK && chance(0.08)) { setT(xx, yy, T.AIR); spawnFlame(xx, yy, 3); }
      }
      if (e.burnT <= 0) burnOut(e);
    }
  }
  // 熱をためる・冷やす
  W.heat.fill(0);
  const heatSources = [], coldSources = [];
  for (const e of W.ents) {
    if (!e.alive) continue;
    const ht = e.heatR(), cd = e.coldR();
    if (ht > 0) heatSources.push([e, ht]);
    if (cd > 0) coldSources.push([e, cd]);
  }
  for (const [e, r] of heatSources) {
    const cx = e.x + (e.w - 1) / 2, cy = e.y + (e.h - 1) / 2;
    for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++) for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) {
      if (!inb(xx, yy)) continue;
      const d = Math.hypot(xx - cx, yy - cy); if (d > r + .01) continue;
      const tt = W.t[idx(xx, yy)];
      if (tt === T.ICE && chance(0.12 * (1.2 - d / (r + 1)))) { setT(xx, yy, T.AIR); addWater(xx, yy, WMAX); Fx.steam(xx + .5, yy + .5, 3); Sfx.hiss(.3); Bus.emit('melt', { x: xx, y: yy, by: e }); }
      else if (tt === T.SNOW && chance(0.2)) { setT(xx, yy, T.AIR); addWater(xx, yy, 3); Fx.steam(xx + .5, yy + .5, 2); }
      const wv = W.wa[idx(xx, yy)];
      if (wv && d <= 1.5 && e.heatR() >= 1.5 && chance(0.05)) { W.wa[idx(xx, yy)] = wv - 1; Fx.steam(xx + .5, yy + .3, 2); }
    }
    for (const o of entsNear(cx, cy, r, o => o !== e)) {
      if (o.d.melt && chance(0.1)) meltEnt(o, e);
      if (o.frozenT > 0) o.frozenT = Math.max(0, o.frozenT - 2);
      if (o.canBurn() && entDist(o, e) <= 1 && e.heatR() >= 2 && chance(0.06)) ignite(o, e);
    }
  }
  for (const [e, r] of coldSources) {
    const cx = e.x + (e.w - 1) / 2, cy = e.y + (e.h - 1) / 2;
    for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r + 1); yy++) for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) {
      if (!inb(xx, yy)) continue;
      const d = Math.hypot(xx - cx, yy - cy); if (d > r + 1.01) continue;
      const i = idx(xx, yy);
      // 水面だけ凍る（上が水でない深い水）
      if (W.wa[i] >= DEEP && waAt(xx, yy - 1) < 2 && chance(0.25)) { freezeCell(xx, yy); }
    }
    for (const o of entsNear(cx, cy, r, o => o !== e && o.burnT > 0)) extinguish(o);
  }
}
function freezeCell(x, y) {
  const i = idx(x, y);
  W.wa[i] = 0; setT(x, y, T.ICE);
  Fx.sparkle(x + .5, y + .5, '#cfe6f7', 3);
  for (const e of entsAt(x, y)) { if (e.d.swim) { e.frozenT = 12; } else if (!e.d.fly || e.isHero) moveEnt(e, 0, -1, e.isHero); }
  Bus.emit('freeze', { x, y });
}
function ignite(e, by) {
  if (!e.alive || e.burnT > 0 || !e.canBurn()) return;
  e.burnT = e.d.burn || 6; e.burnMax = e.burnT;
  Sfx.ignite(); Bus.emit('ignite', { who: e, by });
  if (e.d.beast) { e.fleeFrom(by || e, 4); }
}
function extinguish(e) {
  if (e.burnT <= 0) return;
  e.burnT = 0; Fx.steam(e.x + e.w / 2, e.y, 6); Sfx.hiss(.6);
  if (e.d.flame) removeEnt(e, 'out');
  Bus.emit('extinguish', { who: e });
}
function burnOut(e) {
  e.burnT = 0;
  Fx.smoke(e.x + e.w / 2, e.y + e.h / 2, 8);
  Bus.emit('burned', { who: e });
  if (e.d.flame) { removeEnt(e, 'burnout'); return; }
  const ash = e.d.ash;
  if (ash && KDEF[ash]) transformEnt(e, ash, { keepMine: true });
  else if (e.isHero) heroHurt('fire');
  else removeEnt(e, 'burned');
}
function meltEnt(e, by) {
  const to = e.d.melt;
  Bus.emit('melt', { who: e, by });
  if (to === '水') { const x = e.x, y = e.y, n = e.w * e.h; removeEnt(e, 'melt'); for (let i = 0; i < n; i++) addWater(x + (i % 2), y + e.h - 1, WMAX); Fx.steam(x + .5, y + .5, 4); }
  else if (to && KDEF[to]) transformEnt(e, to, { keepMine: true });
  else removeEnt(e, 'melt');
}
function spawnFlame(x, y, life) {
  if (!inb(x, y)) return null;
  const f = newEnt('火', x, y, { life: life || 4, native: true });
  if (f) { f.burnT = f.life; }
  return f;
}

// ---- 風 ----
function gustAt(x, y) {
  let s = 0;
  for (const g of W.gusts) if (y >= g.y0 && y <= g.y1 && (g.dir > 0 ? x >= g.x && x <= g.front : x <= g.x && x >= g.front)) s += g.dir * g.str;
  return s;
}
function windStep() {
  for (const g of W.gusts) {
    g.ttl -= TICK;
    g.front += g.dir * 0.9;
    if (Math.abs(g.front - g.x) > g.range) g.front = g.x + g.dir * g.range;
    if (W.tick % 3 === 0) {
      for (const e of W.ents) {
        if (!e.alive || e.pinned || e.stopT > 0) continue;
        if (e.y + e.h - 1 < g.y0 || e.y > g.y1) continue;
        const ex = e.x + e.w / 2;
        if (g.dir > 0 ? (ex < g.x || ex > g.front + 1) : (ex > g.x + 1 || ex < g.front)) continue;
        const resist = e.windResist();
        if (resist >= g.str * 2) continue;
        if (e.isHero && e.hero.buff.heavy) continue;
        if (e.d.flame && e.w === 1 && g.str >= 2) { extinguish(e); continue; }
        if (resist <= g.str) {
          if (moveEnt(e, g.dir, 0)) { e.windPushed = 4; if (e.d.lift && !e.grounded) moveEnt(e, 0, -1); }
          else if (e.d.lift || (e.isHero && e.hero.buff.light)) moveEnt(e, 0, -1);
          if (e.d.beast && !e.d.fly && e.weight() <= 1) e.fleeFrom({ x: g.x - g.dir, y: e.y, w: 1, h: 1 }, 1.5);
        }
      }
      // 煙・霧が晴れる
      for (const r of W.rains) if (r.cloud && r.y >= g.y0 - 3 && r.y <= g.y1) r.x += g.dir * 0.6;
    }
  }
  W.gusts = W.gusts.filter(g => g.ttl > 0);
}

// ---- 雨 ----
function rainStep() {
  for (const r of W.rains) {
    r.ttl -= TICK;
    r.x += (W.wind * 0.02);
    if (r.follow && r.follow.alive) { r.x = r.follow.x + r.follow.w / 2 - r.w / 2; r.y = r.follow.y; }
    if (W.tick % 4 !== 0) continue;
    const x0 = Math.floor(r.x), x1 = Math.floor(r.x + r.w);
    for (let x = x0; x < x1; x++) {
      if (x < 0 || x >= W.w || !chance(r.rate)) continue;
      // まっすぐ下の最初の場所
      let y = Math.max(0, Math.floor(r.y) + 1);
      while (y < W.h && !T_SOLID[tAt(x, y)] && !(occAt(x, y) && entSolid(occAt(x, y)))) {
        const es = entsAt(x, y, e => e.burnT > 0); for (const e of es) extinguish(e);
        y++;
      }
      // 当たった物を濡らす
      for (const e of entsAt(x, y - 1)) e.wet(6);
      if (y < W.h) { const top = entsAt(x, y); for (const e of top) e.wet(6); }
      if (r.snow) { if (y - 1 >= 0 && tAt(x, y - 1) === T.AIR && !deepAt(x, y - 1) && !entsAt(x, y - 1).length && chance(0.25)) { if (waAt(x, y - 1) >= DEEP) freezeCell(x, y - 1); else setT(x, y - 1, T.SNOW); } }
      else if (y - 1 >= 0) { addWater(x, y - 1, 1); }
      // 草木が育つ
      for (const e of entsAt(x, y - 1, e => e.d.grow)) e.growPts = (e.growPts || 0) + 1;
    }
  }
  W.rains = W.rains.filter(r => r.ttl > 0);
}

// ---- 光 ----
function lightStep() {
  const L = W.light;
  if (W.dark <= 0.01) { L.fill(1); return; }
  const amb = 1 - W.dark;
  L.fill(amb);
  for (const e of W.ents) {
    if (!e.alive) continue;
    const r = e.glowR(); if (r <= 0) continue;
    const cx = e.x + (e.w - 1) / 2, cy = e.y + (e.h - 1) / 2;
    for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++) for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) {
      if (!inb(xx, yy)) continue;
      const d = Math.hypot(xx - cx, yy - cy); if (d > r) continue;
      const v = 1 - (d / (r + .5)) * 0.85; const i = idx(xx, yy); if (v > L[i]) L[i] = v;
    }
  }
}
function lightAt(x, y) { return inb(x, y) ? W.light[idx(x, y)] : 1; }

// ---- 雷（ひとつながりの水・金物へ伝わる）----
function lightning(x) {
  x = clamp(Math.round(x), 0, W.w - 1);
  let y = 0;
  while (y < W.h && !T_SOLID[tAt(x, y)] && !entsAt(x, y, e => !e.d.flame && !e.d.sky).length && waAt(x, y) < 3) y++;
  Fx.bolt(x + .5, y);
  Sfx.thunder();
  Fx.flash(0.8);
  Bus.emit('lightning', { x, y });
  const hitEnts = entsAt(x, y, e => !e.d.flame && !e.d.sky);
  for (const e of hitEnts) {
    if (e.isHero) { heroHurt('shock'); continue; }
    if (e.canBurn()) ignite(e, null);
    if (e.d.beast) { e.stun(8); Bus.emit('shock', { who: e }); }
    if (e.d.thunderBreak) breakEnt(e, null);
  }
  if (tAt(x, y) === T.ROCK && chance(0.5)) { /* 岩は割れない */ }
  // 水と金物を伝う
  if (waAt(x, y) >= 3 || hitEnts.some(e => e.d.conduct)) {
    const seen = new Set(), q = [[x, y]]; let n = 0;
    while (q.length && n < 120) {
      const [cx, cy] = q.shift(); const k = cx + ',' + cy; if (seen.has(k)) continue; seen.add(k); n++;
      const cond = waAt(cx, cy) >= 3 || entsAt(cx, cy, e => e.d.conduct).length;
      if (!cond) continue;
      if (chance(0.25)) Fx.spark(cx + .5, cy + .5);
      for (const e of entsAt(cx, cy)) { if (e.isHero) heroHurt('shock'); else if (e.d.beast) { e.stun(8); Bus.emit('shock', { who: e }); } }
      for (const e of entsAt(cx, cy - 1)) { if (e.d.beast && e.d.swim) e.stun(8); if (e.isHero && waAt(cx, cy - 1) > 0) heroHurt('shock'); }
      q.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }
}

// ---- 世界の1刻み ----
function worldTick() {
  W.tick++; W.time += TICK;
  if (W.timers.length) { const due = W.timers.filter(t => t.at <= W.time); if (due.length) { W.timers = W.timers.filter(t => t.at > W.time); for (const t of due) { try { t.fn(); } catch (e) { reportError(e); } } } }
  rebuildOcc();
  if (W.hero && W.hero.alive) heroTick();
  for (const e of W.ents) { if (e.alive) { try { entTick(e); } catch (err) { reportError(err); } } }
  physicsStep();
  waterStep();
  if (W.tick % 2 === 0) sandStep();
  if (W.tick % 4 === 0) thermalStep();
  windStep();
  rainStep();
  if (W.tick % 3 === 0) lightStep();
  // 効き目の墨を返す
  for (const h of W.inkHeld) h.ttl -= TICK;
  if (W.inkHeld.some(h => h.ttl <= 0)) { for (const h of W.inkHeld) if (h.ttl <= 0) Ink.flowBack(h.ink, h.x, h.y); W.inkHeld = W.inkHeld.filter(h => h.ttl > 0); }
  W.ents = W.ents.filter(e => e.alive || e.fadeT > 0);
  for (const e of W.ents) if (!e.alive && e.fadeT > 0) e.fadeT -= TICK;
  if (typeof sceneTick === 'function') sceneTick();
}

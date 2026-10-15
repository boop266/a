// ---------------------------------------------------------------------------
// 書く：字をどこに置くと、何が起きるか
//   1. 薄れたもの に正しい名を書く → よみがえる（墨はいらない）
//   2. 世界の字 に重ねて合わせ字になる → その場で変わる（木に木 → 林）
//   3. 動き・様子・心 → 書いた物に効く
//   4. それ以外 → そこに現れる
// 墨：書いた物が世界にあるあいだ、その画数ぶんの墨を使う。消えれば墨はもどる。
// ---------------------------------------------------------------------------
const Ink = {
  max: 12,
  pending: 0,
  used() {
    let n = this.pending;
    if (!W) return n;
    for (const e of W.ents) if (e.alive) n += e.mine ? e.totalInk() : Object.values(e.modInk).reduce((a, b) => a + b, 0);
    for (const h of W.inkHeld) n += h.ink;
    return n;
  },
  free() { return Math.max(0, this.max - this.used()); },
  flowBack(n, x, y) { if (n > 0) { Fx.inkFlow(x, y, n); Bus.emit('inkback', { n }); } },
  hold(n, ttl, x, y) { if (n > 0) W.inkHeld.push({ ink: n, ttl, x, y }); },
};

function kindOf(k) { const d = KDEF[k]; return d ? d.kind : 'none'; }
function isEffectKind(kind) { return kind === 'verb' || kind === 'adj' || kind === 'feel' || kind === 'self'; }
function physicalOut(k) { const d = KDEF[k]; return d && ['thing', 'plant', 'beast', 'flame', 'struct'].includes(d.kind) && !d.fx; }

// その場所で、いちばん「狙っている」らしい物
function targetAt(tx, ty) {
  const hero = W.hero;
  if (hero && hero.alive && tx === hero.x && (ty === hero.y || ty === hero.y - 1)) return hero;
  let list = entsAt(tx, ty, e => !e.isHero);
  if (!list.length) list = entsAt(tx, ty + 1, e => !e.isHero && (e.d.flat || e.d.kind === 'thing' && e.h === 1 && e.d.heavy === 0));
  if (!list.length) return null;
  const pri = e => e.d.beast ? 5 : e.d.kind === 'thing' ? 4 : e.d.kind === 'flame' ? 3 : e.d.kind === 'plant' ? 2 : 1;
  list.sort((a, b) => pri(b) - pri(a));
  return list[0];
}
function fadedAt(tx, ty, k) {
  for (const f of W.faded) {
    if (f.restored || !(tx >= f.x && tx < f.x + f.w && ty >= f.y && ty < f.y + f.h)) continue;
    if (!k || k === f.k || k === '心') return f;
    // 名がちがう字は、大きな薄れたものの「まん中」でだけ止める（ほかの所には書ける）
    const cx0 = f.x + Math.max(0, Math.floor((f.w - 2) / 2)), cx1 = cx0 + Math.min(2, f.w) - 1;
    const cy0 = f.y + Math.max(0, Math.floor((f.h - 2) / 2)), cy1 = cy0 + Math.min(2, f.h) - 1;
    if (tx >= cx0 && tx <= cx1 && ty >= cy0 && ty <= cy1) return f;
  }
  return null;
}

// どうなるかの見立て（引っぱっている間ずっと呼ぶ）
function planWrite(k, tx, ty) {
  const d = KDEF[k]; if (!d) return { kind: 'none', msg: '' };
  const cost = strokesOf(k);
  const hero = W.hero;
  // 薄れたもの
  const fd = fadedAt(tx, ty, k);
  if (fd) {
    if (fd.k === k || (k === '心' && fd.k)) return { kind: 'restore', faded: fd, cost: 0, msg: 'よみがえらせる' };
    return { kind: 'wrongname', faded: fd, cost: 0, msg: '……ちがう名のようだ' };
  }
  // 自分にだけ書く字
  if (d.kind === 'self') return { kind: 'self', target: hero, cost, msg: '自分に書く' };
  const tgt = targetAt(tx, ty);
  if (tgt && tgt.isHero) {
    const r = findRecipe(k, '人', true);
    if (r && r.out === '休') return { kind: 'self', target: hero, cost, as: '休', msg: '休む' };
    if (isEffectKind(d.kind) || d.fx && FX[d.fx] && FX[d.fx].hero) {
      if (FX[d.fx] && FX[d.fx].hero) return { kind: 'self', target: hero, cost, msg: '自分に書く' };
    }
  }
  if (tgt && !tgt.isHero) {
    // 合わせ字
    const r = findRecipe(k, tgt.k, true);
    if (r && physicalOut(r.out) && !tgt.d.beast) return { kind: 'transform', target: tgt, out: r.out, recipe: r, cost, msg: tgt.k + '＋' + k + '＝' + r.out };
    if (r && physicalOut(r.out) && tgt.d.beast && KDEF[r.out].beast) return { kind: 'transform', target: tgt, out: r.out, recipe: r, cost, msg: tgt.k + '＋' + k + '＝' + r.out };
    if (isEffectKind(d.kind) || (d.fx && FX[d.fx] && FX[d.fx].ent)) {
      const fx = FX[d.fx];
      if (fx && fx.ent && fx.ent(tgt)) return { kind: 'apply', target: tgt, cost, msg: fx.label ? fx.label(tgt) : '' };
      if (fx && fx.cell && fx.cell(tx, ty)) return { kind: 'area', x: tx, y: ty, cost, msg: '' };
      return { kind: 'noeffect', target: tgt, cost: 0, msg: tgt.k + 'には効かない' };
    }
  }
  if (isEffectKind(d.kind)) {
    const fx = FX[d.fx];
    if (fx && fx.cell && fx.cell(tx, ty)) return { kind: 'area', x: tx, y: ty, cost, msg: '' };
    // 近くの物
    if (fx && fx.ent) {
      const near = entsNear(tx, ty, 1.2, e => !e.isHero && fx.ent(e));
      if (near.length) return { kind: 'apply', target: near[0], cost, msg: fx.label ? fx.label(near[0]) : '' };
      if (fx.hero && hero && entDist(hero, { x: tx, y: ty, w: 1, h: 1 }) <= 1) return { kind: 'self', target: hero, cost, msg: '自分に書く' };
    }
    return { kind: 'noeffect', cost: 0, msg: 'ここには効かない' };
  }
  // 現れる物・起きる事
  if (d.fx && FX[d.fx]) {
    const fx = FX[d.fx];
    const p = fx.place ? fx.place(tx, ty) : { x: tx, y: ty };
    if (!p) return { kind: 'noroom', cost: 0, msg: fx.why || 'ここには書けない' };
    return Object.assign({ kind: 'event', cost }, p);
  }
  const spot = findSpot(d, tx, ty);
  if (!spot) return { kind: 'noroom', cost: 0, msg: 'ここには入らない' };
  return { kind: 'place', x: spot.x, y: spot.y, w: d.w, h: d.h, cost };
}
// 物を置ける場所（指した所のまわり）
function findSpot(d, tx, ty) {
  const probe = { d, w: d.w, h: d.h, tiny: () => false, isHero: false, ridingOn: null };
  const ox = Math.round(tx - (d.w - 1) / 2), oy = ty - (d.h - 1);
  const tries = [[0, 0], [0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [0, -2], [-2, 0], [2, 0], [-1, 1], [1, 1]];
  for (const [dx, dy] of tries) {
    const x = ox + dx, y = oy + dy;
    if (x < 0 || y < 0 || x + d.w > W.w || y + d.h > W.h) continue;
    let ok = true;
    for (let yy = y; yy < y + d.h && ok; yy++) for (let xx = x; xx < x + d.w; xx++) {
      if (T_SOLID[tAt(xx, yy)]) { ok = false; break; }
      const o = occAt(xx, yy); if (o && (entSolid(o) || entBlocks(o))) { ok = false; break; }
      if (d.solid && W.hero && W.hero.alive && W.hero.x === xx && W.hero.y === yy) { ok = false; break; }
      if (tAt(xx, yy) === T.BLANK) { ok = false; break; }
    }
    if (ok) return { x, y };
  }
  return null;
}

// 書く（筆の動きが終わってから commitWrite）
function commitWrite(k, plan, tx, ty) {
  const d = KDEF[k];
  const cost = plan.cost || 0;
  const ev = { k, kind: plan.kind, x: tx, y: ty, target: plan.target ? plan.target.k : null, out: plan.out };
  switch (plan.kind) {
    case 'restore': restoreFaded(plan.faded, k); break;
    case 'self': {
      const as = plan.as || k;
      const fx = FX[KDEF[as].fx];
      if (fx && fx.hero) { const ttl = fx.hero(W.hero, as) || 2; Ink.hold(cost, ttl, W.hero.cx, W.hero.cy); }
      break;
    }
    case 'transform': {
      const e = plan.target;
      if (!e.alive) { Ink.flowBack(cost, tx, ty); break; }
      const from = e.k;
      if (transformEnt(e, plan.out, { keepMine: true })) {
        if (!e.mine) { if (!e.base) e.base = from; e.modInk.__morph = (e.modInk.__morph || 0) + cost; }
        else e.ink += cost;
        (e.stack || (e.stack = [])).push({ type: 'morph', from, ink: cost });
        Fx.sparkle(e.cx, e.cy, INK[e.d.col] || '#333', 10); Sfx.combine();
        Game.learn(plan.out, 'world');
        Bus.emit('combine', { a: from, b: k, out: plan.out, where: 'world', who: e });
      } else { toast('ここでは広がれない'); Ink.flowBack(cost, tx, ty); }
      break;
    }
    case 'apply': {
      const fx = FX[d.fx];
      const ttl = fx.run(plan.target, k, cost);
      if (ttl === 'mod') { /* 物が墨を持つ */ }
      else Ink.hold(cost, typeof ttl === 'number' ? ttl : 1.5, tx, ty);
      break;
    }
    case 'area': {
      const fx = FX[d.fx];
      const ttl = fx.area(tx, ty, k);
      Ink.hold(cost, typeof ttl === 'number' ? ttl : 1.5, tx, ty);
      break;
    }
    case 'event': {
      const fx = FX[d.fx];
      const r = fx.run(plan, k, cost);
      if (r && r.ent) { r.ent.mine = true; r.ent.ink = cost; (r.ent.stack || (r.ent.stack = [])).push({ type: 'spawn', ink: cost }); }
      else Ink.hold(cost, (r && r.ttl) || 2, tx, ty);
      break;
    }
    case 'place': {
      const e = newEnt(k, plan.x, plan.y, { mine: true, ink: cost });
      if (e) {
        e.stack = [{ type: 'spawn', ink: cost }];
        if (d.beast && e.ai) e.ai.home = e.x;
        if (d.kind === 'plant') Fx.leaves(e.cx, e.cy, 6);
        afterPlace(e);
      } else Ink.flowBack(cost, tx, ty);
      break;
    }
    default: break;
  }
  Bus.emit('write', ev);
}
// 置いた直後のひと工夫
function afterPlace(e) {
  const d = e.d;
  if (d.becomes === 'EARTH') e.becomeEarth = true;
  if (d.flash) { /* 油 */ }
  if (d.kite) { e.kiteT = 0; }
  if (d.pop) e.popReady = true;
}
function k_is(e, k) { return e && e.k === k; }

// 薄れたものを、よみがえらせる
function restoreFaded(f, k) {
  f.restored = true;
  const e = newEnt(f.k, f.x, f.y, { instant: true, w: f.w, h: f.h });
  if (e) { if (f.w) e.w = f.w; if (f.h) e.h = f.h; if (e.d.bamboo) e.growTo = e.h; if (f.sky || f.story || !e.d.beast && ['sky', 'feel'].includes(e.d.kind)) e.pinned = true; if (e.d.rainbow) e.life = 0; e.restoredFrom = true; e.spawnT = 0.9; if (f.open) e.open = true; if (f.holds) e.holds = f.holds; if (e.ai) e.ai.home = e.x; }
  Fx.restore(f.x + f.w / 2, f.y + f.h / 2, f.w, f.h, INK[KDEF[f.k].col] || INK.sumi);
  Sfx.restore();
  Game.colors++;
  Game.learn(f.k, 'restore');
  Bus.emit('restore', { k: f.k, with: k, f });
  if (f.memory) Voice.say(f.memory, { who: 'painter' });
  if (f.onRestore) f.onRestore(e);
}

// ---- 地形の手伝い ----
function groundBelow(x, y) { for (let yy = Math.max(0, y); yy < W.h; yy++) { if (T_SOLID[tAt(x, yy)]) return yy; const o = occAt(x, yy); if (o && entSolid(o)) return yy; } return W.h; }
function fillCells(cells, t) { let n = 0; for (const [x, y] of cells) { if (inb(x, y) && (tAt(x, y) === T.AIR) && !occAt(x, y)) { setT(x, y, t); n++; const hero = W.hero; if (hero && hero.x === x && hero.y === y) moveEnt(hero, 0, -1, true); } } return n; }
function digCells(cells) {
  let n = 0;
  for (const [x, y] of cells) {
    if (!inb(x, y)) continue;
    const tt = tAt(x, y);
    if (T_DIG[tt]) { setT(x, y, T.AIR); n++; if (chance(0.5)) Fx.dirt(x + .5, y + .5); }
    // 埋まっていた物
    const bur = (W.buried || []).find(b => b.x === x && b.y === y && !b.found);
    if (bur && tt !== T.ROCK) { bur.found = true; const e = newEnt(bur.k, x, y); if (e) { e.spawnT = 0.6; Fx.sparkle(x + .5, y + .5, INK.kin, 10); Bus.emit('dugup', { k: bur.k }); } }
  }
  return n;
}
// 隣の高い壁（はしご・坂用）。返り値：壁のある向きと、壁の上の面の行
function findWallTop(x, groundY, maxH) {
  let best = null;
  for (const s of [1, -1]) {
    for (let dist = 1; dist <= 3; dist++) {
      const wx = x + s * dist;
      if (wx < 0 || wx >= W.w) break;
      if (!T_SOLID[tAt(wx, groundY - 1)] && !(occAt(wx, groundY - 1) && entSolid(occAt(wx, groundY - 1)))) { if (dist === 1) continue; else break; }
      // 壁：上へたどって、上の面
      let top = groundY - 1;
      while (top > 0 && (T_SOLID[tAt(wx, top - 1)] || (occAt(wx, top - 1) && entSolid(occAt(wx, top - 1)))) && groundY - top < maxH + 2) top--;
      const h = groundY - top;
      if (h >= 2 && h <= maxH + 1 && (!best || h < best.h)) best = { dir: s, wx, top, h, dist };
      break;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// 効き目の表
//   ent(e): その物に効くか / cell(x,y): その場所に効くか / hero: 自分に書いた時
//   run(e,k,cost): 物に効かせる（墨を持たせる秒を返す、'mod' なら物が墨を持つ）
//   area(x,y,k): 場所に効かせる / place(x,y): 現れる場所の見立て / run(plan,k,cost): 現れる
// ---------------------------------------------------------------------------
function modOn(e, key, k, cost, apply) {
  if (e.mods[key]) return 1.2;          // もう効いている：墨はすぐもどる
  e.mods[key] = 1; e.modInk[key] = cost;
  (e.stack || (e.stack = [])).push({ type: 'mod', key, ink: cost, k });
  if (apply) apply(e);
  Fx.seal(e.cx, e.y, k); Sfx.stamp();
  Bus.emit('mod', { who: e, key, k });
  return 'mod';
}
function unmod(e, key) {
  if (!e.mods[key]) return;
  delete e.mods[key];
  const ink = e.modInk[key] || 0; delete e.modInk[key];
  if (key === 'big') resizeEnt(e, -1);
  if (key === 'small') { if (e.tinyFlag) e.tinyFlag = false; else resizeEnt(e, +1); }
  if (key === 'long') unlong(e);
  if (key === 'friend') { e.charmT = 0; }
  Ink.flowBack(ink, e.cx, e.cy);
}
function resizeEnt(e, dv) {
  const nw = clamp(e.w + dv, 1, 4), nh = clamp(e.h + dv, 1, 5);
  if (nw === e.w && nh === e.h) return false;
  const nx = Math.round(e.x + e.w / 2 - nw / 2), ny = e.y + e.h - nh;
  unoccupy(e);
  const ow = e.w, oh = e.h, ox = e.x, oy = e.y;
  e.w = nw; e.h = nh;
  let ok = false;
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1]]) { if (canPlace(e, nx + dx, ny + dy)) { e.x = nx + dx; e.y = ny + dy; ok = true; break; } }
  if (!ok) { e.w = ow; e.h = oh; e.x = ox; e.y = oy; occupy(e); return false; }
  occupy(e); e.squash = 1;
  return true;
}
function unlong(e) {
  if (e.longBy) { const n = e.longBy; e.longBy = 0; if (e.d.rope || e.d.ladder || e.d.bamboo || e.d.kind === 'plant') { unoccupy(e); e.h = Math.max(1, e.h - n); if (e.d.ladder || e.d.bamboo || e.d.kind === 'plant') e.y += n; occupy(e); } else { unoccupy(e); e.w = Math.max(1, e.w - n); occupy(e); } }
}
const isBeast = e => e.d.beast && !e.isHero;
const canFeel = e => isBeast(e) && !e.d.npc;
function sayFx(e, s) { e.talk(s, 2.2); }

const FX = {
  // 鈴：自分に書けば身につける。ほかの所では鈴が置かれる
  bellput: {
    hero: h => { h.hero.buff.bell = 45; Sfx.bell(0.6); Bus.emit('heroBell', {}); return 45; },
    place(x, y) { const sp = findSpot(KDEF['鈴'], x, y); return sp ? { x: sp.x, y: sp.y, w: 1, h: 1 } : null; }, why: 'ここには入らない',
    run(p) { const e = newEnt('鈴', p.x, p.y, {}); if (e) { Sfx.bell(0.5); noiseAt(e.cx, e.cy, 5, 'bell'); } return { ent: e }; },
  },
  // 氷：深い水に書くと水面が凍る（五マス）。ほかの所では氷のかたまり
  ice: {
    place(x, y) {
      for (const yy of [y, y + 1, y - 1]) {
        if (waAt(x, yy) >= 2 || deepAt(x, yy)) { let sy = yy; while (sy > 0 && waAt(x, sy - 1) >= 2) sy--; return { x, y: sy, w: 1, h: 1, freeze: true }; }
      }
      const sp = findSpot(KDEF['氷'], x, y); return sp ? { x: sp.x, y: sp.y, w: 1, h: 1 } : null;
    }, why: 'ここには入らない',
    run(p, k, cost) {
      if (p.freeze) { let n = 0; for (let dx = -2; dx <= 2; dx++) if (waAt(p.x + dx, p.y) >= 2) { freezeCell(p.x + dx, p.y); n++; } Sfx.freeze(); Bus.emit('freezeSurface', { x: p.x, y: p.y, n }); return { ttl: 2 }; }
      const e = newEnt('氷', p.x, p.y, {}); return { ent: e };
    },
  },
  // ===== 動き =====
  up: { label: () => '持ち上げる', ent: e => !e.d.root || e.d.kind !== 'plant', hero: h => { heroJump(3); return 1; },
    run(e) { let n = 0; for (let i = 0; i < 2; i++) if (moveEnt(e, 0, -1)) n++; if (n) { e.floatT = Math.max(e.floatT, 1.2); Fx.puff(e.cx, e.y + e.h, 6); Bus.emit('lift', { who: e }); } return 1.5; } },
  down: { label: () => '下へ', ent: e => true, hero: h => { if (h.hero.ride) heroDismount(); return 1; },
    run(e) { e.floatT = 0; e.flyT = 0; if (e.d.fly) { e.perched = true; } if (e.floats()) { e.sinkT = 8; } Bus.emit('drop', { who: e }); return 1.5; } },
  stop: { label: () => '時を止める', ent: e => true, cell: (x, y) => waAt(x, y) > 0,
    run(e) { e.stopT = 20; e.rollV = 0; Fx.ring(e.cx, e.cy, '#888', 1.4); Sfx.stop(); Bus.emit('stop', { who: e }); return 20; },
    area(x, y) { W.waterStop = 20; Fx.ring(x + .5, y + .5, INK.ai, 2); Sfx.stop(); return 20; } },
  cut: { label: e => e.d.cut ? '切る' : '切る', ent: e => !!(e.d.cut || e.d.rope || e.d.ivy || e.d.net || e.d.bamboo || e.d.kite || e.k === '稲'),
    run(e, k) {
      Sfx.slash(); Fx.slash(e.cx, e.cy);
      Bus.emit('cut', { who: e });
      if (e.d.rope || e.d.ivy || e.d.net || e.d.kite) { removeEnt(e, 'cut'); return 1.5; }
      if (e.d.bamboo) { const h = e.h; const x = e.x, y = e.y; removeEnt(e, 'cut'); const s = newEnt('竹', x, y + h - 1, { full: true }); if (s) s.growTo = 1; return 1.5; }
      if (e.d.cut === '丸太') return fellTree(e);
      if (e.d.cut && KDEF[e.d.cut]) { transformEnt(e, e.d.cut, { keepMine: true }); return 1.5; }
      return 1.5;
    } },
  break: { label: () => '打ちこわす', ent: e => !!(e.d.fragile || e.d.breakTo || e.d.wall || e.d.door || e.d.gate || e.d.pot || e.d.mirror || e.k === '氷' || e.k === '岩'),
    cell: (x, y) => [T.ROCK, T.ICE, T.PLANK, T.CRACK].includes(tAt(x, y)),
    run(e) { if (e.k === '氷') { const x = e.x, y = e.y; removeEnt(e, 'break'); addWater(x, y, WMAX); Fx.shatter(x + .5, y + .5, '#9cc7e6'); Sfx.crack(); return 1.5; } breakEnt(e, null); return 1.5; },
    area(x, y) {
      let n = 0;
      for (let yy = y; yy <= y + 1; yy++) for (let xx = x; xx <= x + 1; xx++) {
        const tt = tAt(xx, yy);
        if (!inb(xx, yy)) continue;
        if (tt === T.ROCK || tt === T.CRACK || tt === T.PLANK) { setT(xx, yy, T.AIR); n++; Fx.shatter(xx + .5, yy + .5, '#777'); }
        else if (tt === T.ICE) { setT(xx, yy, T.AIR); addWater(xx, yy, WMAX); n++; Fx.shatter(xx + .5, yy + .5, '#9cc7e6'); }
      }
      if (n) { Sfx.crack(); const s = newEnt('石', x, y); if (s) s.spawnT = 0.2; Bus.emit('break', { terrain: true, x, y }); }
      return 1.5;
    } },
  open: { label: () => '開ける', ent: e => !!((e.d.gate || e.d.door) && !e.open || e.d.pot || (e.k === '箱' && e.holds)),
    run(e) { return openEnt(e) ? 1.5 : 1; } },
  close: { label: () => '閉める', ent: e => !!((e.d.gate || e.d.door) && e.open && !e.broken),
    run(e) { if (e.d.solid && W.hero && canPlace(e, e.x, e.y) === false) { } e.open = false; e.solidNow = false; rebuildOcc(); Sfx.thud(0.4); Bus.emit('close', { who: e }); return 1.5; } },
  unlock: { label: () => '鍵を開ける', ent: e => !!((e.d.gate || e.d.door) && !e.open || e.k === '箱' || e.d.pot),
    run(e) { return openEnt(e, true) ? 1.5 : 1; } },
  push: { label: () => '押しやる', ent: e => !(e.d.root && e.rooted) && e.weight() <= 3 && !e.isHero,
    run(e) { const dir = sign(e.cx - W.hero.cx) || W.hero.hero.face; let n = 0; for (let i = 0; i < 3; i++) if (moveEnt(e, dir, 0)) n++; else break; if (n) { Fx.windLines(e.cx, e.cy, dir); Bus.emit('push', { who: e, n }); } if (e.d.roll) e.rollV = dir * 5; return 1.5; } },
  pull: { label: () => '引きよせる', ent: e => !(e.d.root && e.rooted) && !e.isHero,
    run(e) { const dir = sign(W.hero.cx - e.cx) || -W.hero.hero.face; let n = 0; for (let i = 0; i < 3; i++) { if (entDist(e, W.hero) <= 1) break; if (moveEnt(e, dir, 0)) n++; else if (moveEnt(e, dir, -1)) n++; else break; } if (n) { Fx.windLines(e.cx, e.cy, dir); Bus.emit('pull', { who: e, n }); } return 1.5; } },
  float: { label: () => '浮かせる', ent: e => !(e.d.root && e.rooted && e.d.kind === 'plant') || true, hero: h => { h.hero.buff.float = 6; heroJump(3); return 6; },
    run(e) { if (e.d.root) e.rooted = false; let n = 0; for (let i = 0; i < 3; i++) if (moveEnt(e, 0, -1)) n++; e.floatT = 25; Fx.puff(e.cx, e.y + e.h, 6); Bus.emit('float', { who: e }); return 25; } },
  sink: { label: () => '沈める', ent: e => true,
    run(e) { e.floatT = 0; e.sinkT = 20; e.mods.heavyTmp = 1; Bus.emit('sink', { who: e }); return 20; } },
  fly: { label: e => isBeast(e) ? '飛び去らせる' : '飛ばす', ent: e => !e.isHero, hero: h => { h.hero.buff.fly = 8; heroJump(4); Bus.emit('heroFly', {}); return 8; },
    run(e) { if (e.d.root) e.rooted = false; let n = 0; for (let i = 0; i < 5; i++) if (moveEnt(e, 0, -1)) n++; e.flyT = 4; Fx.puff(e.cx, e.y + e.h, 8); if (isBeast(e) && !e.d.ai.guard) { e.flyT = 20; e.leaving = true; e.leaveDir = chance(.5) ? 1 : -1; } else if (isBeast(e)) { e.flyT = 6; } Bus.emit('fly', { who: e }); return 6; } },
  animate: { label: () => '歩かせる', ent: e => !e.d.beast && !e.isHero && !e.d.flame && e.d.kind !== 'sky',
    run(e) { e.walkT = 15; e.walkDir = sign(e.cx - W.hero.cx) || 1; e.rooted = false; Fx.sparkle(e.cx, e.y + e.h, '#555', 6); Bus.emit('animate', { who: e }); return 15; } },
  sleep: { label: () => '眠らせる', ent: e => isBeast(e) && !e.sleepT,
    run(e) { e.sleep(30); Fx.zzz(e.cx, e.y); Sfx.lull(); Bus.emit('sleep', { who: e, by: '眠' }); return 30; } },
  wake: { label: () => '起こす', ent: e => isBeast(e) && e.sleepT > 0,
    run(e) { e.sleepT = 0; e.drunkT = 0; e.hibern = false; e.talk('はっ', 1.4); Bus.emit('wake', { who: e }); return 1.5; } },
  grow: { label: () => '育てる', ent: e => e.d.kind === 'plant' || e.k === '子',
    run(e) {
      Fx.leaves(e.cx, e.cy, 10); Sfx.grow();
      if (e.d.bamboo) { e.growTo = (e.growTo || e.h) + 4; return 1.5; }
      if (e.d.grow && KDEF[e.d.grow]) { transformEnt(e, e.d.grow, { keepMine: true }); Bus.emit('grow', { who: e }); return 1.5; }
      if (e.k === '草') { e.mods.tall = 1; return 1.5; }
      if (e.k === '花') { for (const s of [-1, 1]) if (canPlace(e, e.x + s, e.y) && supportBelow(e, e.x + s, e.y)) newEnt('花', e.x + s, e.y); return 1.5; }
      if (e.d.kind === 'plant') { resizeEnt(e, 1); return 1.5; }
      return 1.5;
    } },
  bloom: { label: e => e.d.wood ? '花を咲かせる' : '咲かせる', ent: e => e.d.kind === 'plant',
    run(e) {
      Fx.petals(e.cx, e.y, 24); Sfx.chime();
      if (e.k === '木' || e.k === '枯木' || e.k === '大木') { transformEnt(e, '桜', { keepMine: true }); Bus.emit('bloom', { who: e }); return 1.5; }
      if (e.k === '草') { transformEnt(e, '花', { keepMine: true }); Bus.emit('bloom', { who: e }); return 1.5; }
      Bus.emit('bloom', { who: e }); return 1.5;
    } },
  wither: { label: () => '枯らす', ent: e => e.d.kind === 'plant' && !e.d.dead || e.d.ivy,
    run(e) {
      Fx.leavesFall(e.cx, e.cy, 12); Sfx.wither();
      Bus.emit('wither', { who: e });
      if (e.d.ivy || e.k === '草' || e.k === '花' || e.k === '稲' || e.k === '竹') { removeEnt(e, 'wither'); Fx.dust(e.cx, e.y + e.h, 6); return 1.5; }
      if (e.d.wood && e.d.kind === 'plant') { transformEnt(e, '枯木', { keepMine: true }); return 1.5; }
      return 1.5;
    } },
  ignite: { label: () => '火をつける', ent: e => e.canBurn() || !!(e.d.lamp && e.off), run(e) { if (e.d.lamp) { e.off = false; return 1.5; } ignite(e, null); return 1.5; } },
  douse: { label: () => '消す', ent: e => e.burnT > 0 || e.d.flame || (e.d.lamp && !e.off) || e.d.glow > 0 && e.d.wisp,
    cell: (x, y) => entsNear(x, y, 2, o => o.burnT > 0).length > 0,
    run(e) { if (e.d.lamp) { e.off = true; return 1.5; } if (e.d.wisp && !e.d.flame) { removeEnt(e, 'douse'); return 1.5; } extinguish(e); return 1.5; },
    area(x, y) { for (const o of entsNear(x, y, 2, o => o.burnT > 0)) extinguish(o); return 1.5; } },
  freeze: { label: e => isBeast(e) ? 'こおらせる' : '凍らせる', ent: e => isBeast(e) || e.d.flame || e.burnT > 0,
    cell: (x, y) => waAt(x, y) > 0 || waAt(x, y + 1) > 0 || entsNear(x, y, 2, o => o.d.swim).length > 0,
    run(e) { if (e.d.flame || e.burnT > 0) { extinguish(e); return 1.5; } e.frozenT = 20; Fx.sparkle(e.cx, e.cy, '#cfe6f7', 14); Sfx.freeze(); Bus.emit('frozen', { who: e }); return 20; },
    area(x, y) {
      let n = 0;
      for (let yy = y - 2; yy <= y + 3; yy++) for (let xx = x - 3; xx <= x + 3; xx++) { if (waAt(xx, yy) >= 2 && waAt(xx, yy - 1) < 2) { freezeCell(xx, yy); n++; } }
      for (const o of entsNear(x, y, 2.5, o => o.d.swim)) o.frozenT = 20;
      if (n) Sfx.freeze();
      return 1.5;
    } },
  melt: { label: () => '溶かす', ent: e => !!(e.d.melt || e.frozenT > 0),
    cell: (x, y) => { for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if ([T.ICE, T.SNOW].includes(tAt(xx, yy))) return true; return false; },
    run(e) { if (e.frozenT > 0) { e.frozenT = 0; return 1.5; } meltEnt(e, null); Sfx.hiss(.5); return 1.5; },
    area(x, y) { for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) { const tt = tAt(xx, yy); if (tt === T.ICE) { setT(xx, yy, T.AIR); addWater(xx, yy, WMAX); Fx.steam(xx + .5, yy + .5, 2); } else if (tt === T.SNOW) { setT(xx, yy, T.AIR); addWater(xx, yy, 3); Fx.steam(xx + .5, yy + .5, 1); } } Sfx.hiss(.6); Bus.emit('melt', { area: true, x, y }); return 1.5; } },
  dig: { label: () => '掘る', cell: (x, y) => { for (let yy = y; yy <= y + 3; yy++) if (T_DIG[tAt(x, yy)]) return true; return false; },
    area(x, y) { let g = y; while (g < W.h && !T_SOLID[tAt(x, g)]) g++; digCells([[x, g], [x, g + 1], [x, g + 2]]); Sfx.dig(); Bus.emit('dig', { x, y: g }); return 1.5; } },
  fill: { label: () => '埋める', cell: (x, y) => true,
    area(x, y) {
      const cells = [];
      for (let yy = y + 3; yy >= y - 1; yy--) for (let xx = x - 2; xx <= x + 2; xx++) {
        if (!inb(xx, yy) || tAt(xx, yy) !== T.AIR || occAt(xx, yy)) continue;
        const below = T_SOLID[tAt(xx, yy + 1)], l = T_SOLID[tAt(xx - 1, yy)] || T_SOLID[tAt(xx - 2, yy)], r = T_SOLID[tAt(xx + 1, yy)] || T_SOLID[tAt(xx + 2, yy)];
        if (below && (l || r) && cells.length < 6) cells.push([xx, yy]);
      }
      fillCells(cells, T.EARTH); Sfx.dig(); Bus.emit('fill', { x, y, n: cells.length }); return 1.5;
    } },
  fix: { label: () => '直す', ent: e => !!(e.broken || e.d.dead), run(e) { if (e.broken) { e.broken = false; e.open = false; e.solidNow = false; rebuildOcc(); } if (e.d.dead) transformEnt(e, '木', { keepMine: true }); Fx.sparkle(e.cx, e.cy, INK.moegi, 10); Sfx.chime(); Bus.emit('fix', { who: e }); return 1.5; } },
  hide: { label: () => '見えなくする', ent: e => true, hero: h => { h.hero.buff.hide = 25; Fx.puff(h.cx, h.cy, 8); Bus.emit('heroHide', {}); return 25; },
    run(e) { e.hideT = 25; Fx.puff(e.cx, e.cy, 8); Bus.emit('hide', { who: e }); return 25; } },
  disguise: { label: e => isBeast(e) ? '化かす' : '葉っぱに化かす', ent: e => !e.isHero && !(e.d.root && e.d.heavy >= 3), hero: h => { h.hero.buff.disguise = 25; Fx.puff(h.cx, h.cy, 10); Sfx.poof(); Bus.emit('heroDisguise', {}); return 25; },
    run(e) { Fx.puff(e.cx, e.cy, 10); Sfx.poof(); const from = e.k; if (isBeast(e)) { e.disguised = 25; e.lookT = 3; } else transformEnt(e, '葉', { keepMine: true, force: true }); Bus.emit('disguise', { who: e, from }); return 1.5; } },
  call: { label: () => 'ここへ呼ぶ', cell: () => true, ent: e => true,
    run(e) { noiseAt(e.cx, e.cy, 9, 'call'); Fx.ring(e.cx, e.cy, INK.shu, 2.5); Sfx.call(); return 1.5; },
    area(x, y) { noiseAt(x + .5, y + .5, 9, 'call'); Fx.ring(x + .5, y + .5, INK.shu, 2.5); Sfx.call(); return 1.5; } },
  gather: { label: () => 'みんなを集める', cell: () => true,
    area(x, y) { for (const o of W.ents) if (isBeast(o)) { o.callT = 10; o.callTo = { x, y }; o.sleepT = 0; } Fx.ring(x + .5, y + .5, INK.cha, 4); Sfx.call(); Bus.emit('gather', { x, y }); return 1.5; } },
  cry: { label: () => '大きな音', cell: () => true, ent: e => true,
    run(e) { noiseAt(e.cx, e.cy, 9, 'loud'); Fx.ring(e.cx, e.cy, INK.kin, 3); Sfx.cry(); return 1.5; },
    area(x, y) { noiseAt(x + .5, y + .5, 9, 'loud'); Fx.ring(x + .5, y + .5, INK.kin, 3); Sfx.cry(); return 1.5; } },
  sound: { label: () => '音を鳴らす', ent: () => false },
  blow: { label: () => '息を吹く', hero: h => { const dir = h.hero.face; W.gusts.push({ x: h.x + dir, y0: h.y - 1, y1: h.y + 1, dir, str: 1.6, ttl: 1, range: 4, front: h.x + dir }); for (const o of entsNear(h.x + dir * 1.5, h.y, 2.5, o => o.d.flame && o.w === 1)) extinguish(o); Fx.windLines(h.cx + dir, h.cy, dir); Sfx.wind(0.4); return 1; } },
  eat: { label: () => '食べに行かせる', ent: e => isBeast(e) && e.d.ai.eats.length > 0,
    run(e) { e.fullT = 0; e.d.ai.sense; e.ai.think = 0; e.hungry = 20; Bus.emit('hungry', { who: e }); return 1.5; } },
  rest: { hero: h => { heroRest(); return 2; } },
  swim: { hero: h => { h.hero.buff.swim = 30; Fx.sparkle(h.cx, h.cy, INK.ai, 8); Bus.emit('heroSwim', {}); return 30; } },
  run: { hero: h => { h.hero.buff.fast = 25; Fx.windLines(h.cx, h.cy, h.hero.face); return 25; } },
  climbbuff: { hero: h => { h.hero.buff.climb = 25; Fx.sparkle(h.cx, h.cy, INK.cha, 8); Bus.emit('heroClimb', {}); return 25; } },
  umbrella: { hero: h => { h.hero.buff.umbrella = 40; Sfx.poof(); Bus.emit('heroUmbrella', {}); return 40; } },
  stilts: { hero: h => { h.hero.buff.stilts = 40; Sfx.poof(); Bus.emit('heroStilts', {}); return 40; } },
  standup: { label: () => '立てる', ent: e => e.k === '丸太',
    run(e) { const x = e.x + 1, y = e.y; removeEnt(e, 'stand'); const p = newEnt('柱', x, y - 3, { mine: e.mine, ink: e.ink }); if (p) { p.h = Math.min(4, p.h); Fx.dust(x + .5, y + 1, 8); } return 1.5; } },
  festival: { place: (x, y) => ({ x, y }), run(p) { festival(p.x, p.y); return { ttl: 20 }; } },
  song: { place: (x, y) => ({ x, y }), run(p) { for (const o of entsNear(p.x, p.y, 9, isBeast)) { o.calmT = 20; o.fearT = 0; o.angryT = 0; } Music.motif('song'); Fx.notes(p.x + .5, p.y, 10); Bus.emit('song', {}); return { ttl: 6 }; } },

  // ===== 様子（物が墨を持つ。もどすと元どおり）=====
  big: { label: e => isBeast(e) ? '大きく・強く' : '大きく', ent: e => !e.mods.big && (e.w < 3 || e.d.flame), hero: h => { h.hero.buff.big = 30; h.squash = 1; Sfx.grow(); Bus.emit('heroBig', {}); return 30; },
    run(e, k, cost) {
      if (e.d.flame && e.k === '火') { transformEnt(e, '炎', { keepMine: true }); return 1.5; }
      if (e.k === '石') { const ok = transformEnt(e, '岩', { keepMine: true }); return ok ? 1.5 : 1; }
      if (e.k === '木') { transformEnt(e, '大木', { keepMine: true }); return 1.5; }
      return modOn(e, 'big', k, cost, x => { if (!resizeEnt(x, 1)) { x.mods.bigSoft = 1; } });
    } },
  small: { label: () => '小さく', ent: e => !e.mods.small, hero: h => { h.hero.buff.tiny = 30; Sfx.poof(); Bus.emit('heroTiny', {}); return 30; },
    run(e, k, cost) { return modOn(e, 'small', k, cost, x => { if (!resizeEnt(x, -1)) x.tinyFlag = true; if (isBeast(x) && x.d.ai.guard) Bus.emit('shrinkGuard', { who: x }); }); } },
  less: { label: e => { const r = lessOf(e.k); return r ? e.k + '→' + r : '少なく'; }, ent: e => !!lessOf(e.k),
    run(e) { const to = lessOf(e.k); Fx.puff(e.cx, e.cy, 8); transformEnt(e, to, { keepMine: true }); Bus.emit('less', { who: e, to }); return 1.5; } },
  heavy: { label: () => '重く', ent: e => !e.mods.heavy, hero: h => { h.hero.buff.heavy = 30; return 30; }, run(e, k, cost) { return modOn(e, 'heavy', k, cost, x => { x.floatT = 0; }); } },
  light: { label: () => '軽く', ent: e => !e.mods.light, hero: h => { h.hero.buff.light = 30; Bus.emit('heroLight', {}); return 30; }, run(e, k, cost) { return modOn(e, 'light', k, cost); } },
  hot: { label: () => '熱く', ent: e => !e.mods.hot, hero: h => { h.hero.buff.hot = 30; return 30; }, run(e, k, cost) { return modOn(e, 'hot', k, cost, x => { if (x.frozenT) x.frozenT = 0; }); } },
  cold: { label: () => '冷たく', ent: e => !e.mods.cold, hero: h => { h.hero.buff.cold = 30; return 30; }, run(e, k, cost) { return modOn(e, 'cold', k, cost, x => { if (x.burnT > 0) extinguish(x); }); } },
  long: { label: () => '長く', ent: e => !e.mods.long && !!(e.d.rope || e.d.ladder || e.d.bamboo || e.d.kind === 'plant' && e.d.wood || e.k === '板' || e.k === '一' || e.k === '丸太' || e.d.bridge),
    run(e, k, cost) {
      return modOn(e, 'long', k, cost, x => {
        if (x.d.rope) { let n = 0; for (let i = 0; i < 4; i++) { if (cellFreeFor(x, x.x, x.y + x.h)) { unoccupy(x); x.h++; occupy(x); n++; } } x.longBy = n; }
        else if (x.d.ladder || x.d.bamboo || x.d.kind === 'plant') { let n = 0; for (let i = 0; i < 3; i++) { if (cellFreeFor(x, x.x, x.y - 1)) { unoccupy(x); x.y--; x.h++; occupy(x); n++; } } x.longBy = n; if (x.d.bamboo) x.growTo = x.h; }
        else { let n = 0; for (let i = 0; i < 2; i++) { const dir = (i % 2) ? -1 : 1; const ox = x.x; if (dir > 0 ? cellFreeFor(x, x.x + x.w, x.y) : cellFreeFor(x, x.x - 1, x.y)) { unoccupy(x); if (dir < 0) x.x--; x.w++; occupy(x); n++; } } x.longBy = n; }
      });
    } },
  fast: { label: () => '速く', ent: e => !e.mods.fast && (isBeast(e) || e.d.roll), hero: h => { h.hero.buff.fast = 25; return 25; }, run(e, k, cost) { return modOn(e, 'fast', k, cost); } },
  slow: { label: () => '遅く', ent: e => !e.mods.slow, hero: h => { h.hero.buff.slowfall = 25; return 25; }, run(e, k, cost) { return modOn(e, 'slow', k, cost); } },
  strong: { label: () => '強く', ent: e => isBeast(e) && !e.mods.strong, hero: h => { h.hero.buff.big = 30; return 30; }, run(e, k, cost) { return modOn(e, 'strong', k, cost); } },
  weak: { label: () => '弱く', ent: e => isBeast(e) && !e.mods.weak, run(e, k, cost) { Bus.emit('weaken', { who: e }); return modOn(e, 'weak', k, cost); } },
  power: { label: () => '力持ちに', ent: e => isBeast(e) && !e.mods.strong, hero: h => { h.hero.buff.big = 30; Sfx.grow(); return 30; }, run(e, k, cost) { return modOn(e, 'strong', k, cost); } },
  bright: { label: () => '光らせる', ent: e => !e.mods.bright, hero: h => { h.hero.buff.glow = 40; Bus.emit('heroGlow', {}); return 40; }, run(e, k, cost) { return modOn(e, 'bright', k, cost); } },
  dim: { label: () => '暗く', ent: e => !e.mods.dark, run(e, k, cost) { return modOn(e, 'dark', k, cost); } },
  quiet: { label: () => '静かに', ent: e => !e.mods.quiet, hero: h => { h.hero.buff.hide = 25; return 25; }, run(e, k, cost) { return modOn(e, 'quiet', k, cost, x => { if (isBeast(x)) x.calmT = Infinity; }); } },
  red: { label: e => e.k === '鬼' ? '赤鬼に' : '赤く', ent: e => !e.mods.red, run(e, k, cost) { delete e.mods.blue; return modOn(e, 'red', k, cost); } },
  blue: { label: e => e.k === '鬼' ? '青鬼に' : '青く', ent: e => !e.mods.blue, run(e, k, cost) { delete e.mods.red; return modOn(e, 'blue', k, cost, x => { if (isBeast(x)) x.calmT = 15; }); } },
  white: { label: () => '白く', ent: e => !e.mods.white, run(e, k, cost) { return modOn(e, 'white', k, cost); } },
  black: { label: () => '黒く', ent: e => !e.mods.black, run(e, k, cost) { return modOn(e, 'black', k, cost); } },
  old: { label: e => e.d.wood && e.d.kind !== 'plant' ? '朽ちさせる' : '古く', ent: e => !!(e.d.wood || e.d.metal || e.k === '子' || e.k === '木'),
    run(e) {
      Fx.dust(e.cx, e.cy, 10); Bus.emit('age', { who: e });
      if (e.k === '木' || e.k === '桜') { transformEnt(e, '枯木', { keepMine: true }); return 1.5; }
      if (e.d.wood || e.d.metal) { Sfx.crumble(); removeEnt(e, 'rot'); return 1.5; }
      return 1.5;
    } },
  new: { label: () => '新しく', ent: e => !!(e.broken || e.d.dead || e.burnT > 0),
    run(e) { if (e.burnT > 0) extinguish(e); if (e.broken) { e.broken = false; e.open = false; } if (e.d.dead) transformEnt(e, '木', { keepMine: true }); Fx.sparkle(e.cx, e.cy, INK.moegi, 10); Sfx.chime(); return 1.5; } },

  // ===== 心（生き物の気持ち）=====
  friend: { label: e => '友だちになる', ent: e => canFeel(e) && !e.charmT,
    run(e, k, cost) {
      if (e.d.ai.hostile && !e.tamed && !e.calm()) { e.talk('ぐるる……', 2); Bus.emit('friendFail', { who: e }); return 1; }
      if (e.fearT > 0 || e.angryT > 0) { e.talk('……', 1.5); return 1; }
      Fx.hearts(e.cx, e.y, 6); Sfx.chime();
      e.talk(e.d.ai.yokai ? (e.k === '鬼' ? 'ほんとうか……！' : 'ふむ') : '♪', 2);
      Bus.emit('friend', { who: e, by: '友' });
      return modOn(e, 'friend', k, cost, x => { x.charmT = Infinity; x.fearT = 0; });
    } },
  like: { label: () => '好きにさせる', ent: e => canFeel(e) && !e.charmT,
    run(e) { if (e.d.ai.hostile && !e.tamed && !e.calm()) { e.talk('ぐる……', 2); return 1; } e.charmT = 60; Fx.hearts(e.cx, e.y, 6); Bus.emit('friend', { who: e, by: '好' }); return 60; } },
  love: { label: () => 'みんな仲よし', cell: () => true, ent: e => true,
    run(e) { return FX.love.area(e.x, e.y); },
    area(x, y) { for (const o of entsNear(x, y, 8, canFeel)) { o.charmT = 60; o.fearT = 0; o.angryT = 0; o.tamed = true; Fx.hearts(o.cx, o.y, 4); Bus.emit('friend', { who: o, by: '愛' }); } Sfx.chime(); return 60; } },
  laugh: { label: () => '笑わせる', ent: e => canFeel(e) && !e.laughT,
    run(e) { e.laughT = 25; e.angryT = 0; e.talk(e.k === '鬼' ? 'がっはっは' : 'あはは', 2.5); Sfx.laugh(); Bus.emit('laugh', { who: e }); return 25; } },
  weep: { label: () => '泣かせる', ent: e => canFeel(e) && !e.cryT,
    run(e) { e.cryT = 20; e.talk(e.k === '鬼' ? 'うおーん' : 'しくしく', 2.5); Bus.emit('weep', { who: e }); return 20; } },
  anger: { label: () => '怒らせる', ent: e => canFeel(e),
    run(e) { e.angryT = 10; e.dir = sign(e.cx - W.hero.cx) || e.dir; e.talk('むきーっ', 1.6); e.sleepT = 0; e.calmT = 0; e.laughT = 0; if (e.d.ai.guard) e.ai.home = -99; Sfx.angry(); Bus.emit('anger', { who: e }); return 10; } },
  scare: { label: () => 'こわがらせる', ent: e => canFeel(e), cell: () => true,
    run(e) { e.fleeFrom(W.hero, 12); e.talk('ひいっ', 1.4); if (e.d.ai.guard) { e.leaving = true; e.leaveDir = sign(e.cx - W.hero.cx) || 1; } Bus.emit('scare', { who: e }); return 12; },
    area(x, y) { for (const o of entsNear(x, y, 4, canFeel)) { o.fleeFrom({ x, y, w: 1, h: 1 }, 10); if (o.d.ai.guard) { o.leaving = true; o.leaveDir = sign(o.cx - x) || 1; } Bus.emit('scare', { who: o }); } return 10; } },
  bow: { label: e => '礼をする', cell: () => true, ent: e => true, hero: h => { heroBow(); return 3; },
    run(e) { heroBow(); return 3; }, area() { heroBow(); return 3; } },
  dream: { label: () => '夢を見せる', ent: e => isBeast(e) && e.sleepT > 0,
    run(e) { const s = (Scene.cur && Scene.cur.dreams && Scene.cur.dreams[e.k]) || dreamOf(e); e.talk('むにゃ……' + s, 5); Bus.emit('dream', { who: e }); return 3; } },
  heart: { label: () => '心をこめる', ent: e => false },
  calm: { label: () => '落ちつかせる', cell: () => true, ent: e => true,
    run(e) { return FX.calm.area(e.x, e.y); },
    area(x, y) { for (const o of entsNear(x, y, 6, canFeel)) { o.calmT = 20; o.fearT = 0; o.angryT = 0; } Fx.ring(x + .5, y + .5, INK.moegi, 3); return 20; } },
  forget: { label: e => e.d.ai && e.d.ai.guard ? '役目を忘れさせる' : '忘れさせる', ent: e => canFeel(e),
    run(e) { e.talk('……あれ？', 2.5); if (e.d.ai.guard) { e.forgot = true; e.leaving = true; e.leaveDir = chance(.5) ? 1 : -1; e.ai.home = -99; } e.tamed = true; Bus.emit('forget', { who: e }); return 6; } },
  think: { label: () => '思い出す', ent: e => true, run(e) { Voice.say(thoughtOf(e), { who: 'painter' }); return 2; } },
  life: { label: () => '元気にする', ent: e => e.d.dead || e.stunT > 0 || e.sleepT > 0 || e.frozenT > 0,
    run(e) { if (e.d.dead) transformEnt(e, '木', { keepMine: true }); e.stunT = 0; e.frozenT = 0; Fx.leaves(e.cx, e.cy, 8); Sfx.grow(); return 1.5; } },
  mouth: { label: () => '話を聞く', ent: e => isBeast(e), run(e) { e.talk(wantOf(e), 4.5); Bus.emit('ask', { who: e }); return 2; } },
  listen: { label: () => '耳をすます', cell: () => true, ent: e => true, run(e) { return FX.listen.area(e.x, e.y); }, area(x, y) { for (const o of entsNear(x, y, 7, isBeast)) o.talk(wantOf(o), 4.5); return 2; } },
  name: { label: () => '名を呼ぶ', ent: e => true, run(e) { Bus.emit('name', { who: e }); return 2; } },
  mother: { cell: () => true, area(x, y) { Bus.emit('memory', { k: '母' }); return 2; } },
  father: { cell: () => true, area(x, y) { Bus.emit('memory', { k: '父' }); return 2; } },
  master: { cell: () => true, area(x, y) { Bus.emit('memory', { k: '師' }); return 2; } },
  part: { cell: () => true, area(x, y) { Bus.emit('memory', { k: '別' }); return 2; } },

  // ===== 現れる・起きる =====
  sun: { place: (x, y) => ({ x, y }), run(p) { setTime('day', true); W.sunOut = 40; Fx.sunRise(); Sfx.chime(); for (const o of W.ents) if (isBeast(o) && o.d.ai.snowy && !o.leaving) { o.leaving = true; o.leaveDir = 1; o.talk('……まぶしい', 2.5); Bus.emit('flee', { who: o, from: '日' }); } Bus.emit('sun', {}); return { ttl: 4 }; } },
  moon: { place: (x, y) => ({ x, y }), run(p) { setTime('night'); W.dark = Math.min(W.dark, 0.42); W.moonT = 60; Bus.emit('moon', {}); return { ttl: 4 }; } },
  night: { place: (x, y) => ({ x, y }), run(p) { setTime('night'); Bus.emit('night', {}); return { ttl: 4 }; } },
  morning: { place: (x, y) => ({ x, y }), run(p) { setTime('day', true); Bus.emit('morning', {}); return { ttl: 4 }; } },
  fullmoon: { place: (x, y) => ({ x, y }), run(p) { setTime('night'); W.dark = 0.3; W.fullmoon = true; for (const o of W.ents) if (o.k === '狸') { o.talk('ぽんぽこ', 3); Sfx.drum(); } Bus.emit('fullmoon', {}); return { ttl: 4 }; } },
  star: { place: (x, y) => ({ x, y }), run(p) { meteor(p.x); return { ttl: 2 }; } },
  rain: { place: (x, y) => ({ x, y }), run(p) { W.rains.push({ x: p.x - 2, y: Math.max(0, cloudRow(p.x, p.y)), w: 5, ttl: 12, rate: 0.6, cloud: true }); Sfx.rain(12); Bus.emit('rain', { x: p.x }); return { ttl: 12 }; } },
  raincloud: { place: (x, y) => ({ x, y }), run(p) { W.rains.push({ x: W.hero.x - 1, y: Math.max(0, W.hero.y - 5), w: 3, ttl: 25, rate: 0.5, cloud: true, follow: { get alive() { return W.hero.alive; }, get x() { return W.hero.x - 1; }, get y() { return Math.max(0, W.hero.y - 5); }, w: 3 } }); Sfx.rain(25); return { ttl: 25 }; } },
  snow: { place: (x, y) => ({ x, y }), run(p) { W.rains.push({ x: p.x - 3, y: Math.max(0, cloudRow(p.x, p.y)), w: 7, ttl: 10, rate: 0.5, cloud: true, snow: true }); Bus.emit('snow', { x: p.x }); return { ttl: 10 }; } },
  wind: { place: (x, y) => ({ x, y }), run(p) { const h = W.hero; const dir = (p.x === h.x ? h.hero.face : sign(p.x - h.x)); const g = { x: p.x - dir * 2, y0: p.y - 1, y1: p.y + 1, dir, str: 1.8, ttl: 2.6, range: 11, front: p.x - dir * 2 }; W.gusts.push(g); Fx.windLines(p.x + .5, p.y + .5, dir); Sfx.wind(1); Bus.emit('wind', { x: p.x, y: p.y, dir }); return { ttl: 3 }; } },
  storm: { place: (x, y) => ({ x, y }), run(p) { const dir = sign(p.x - W.hero.x) || 1; W.gusts.push({ x: dir > 0 ? 0 : W.w - 1, y0: 0, y1: W.h, dir, str: 2.6, ttl: 6, range: W.w, front: dir > 0 ? 0 : W.w - 1 }); W.rains.push({ x: 0, y: 0, w: W.w, ttl: 8, rate: 0.5, cloud: true }); W.stormT = 8; Sfx.wind(1.5); Sfx.rain(8); Sfx.thunder(); Bus.emit('storm', {}); return { ttl: 8 }; } },
  calm: { place: (x, y) => ({ x, y }), run(p) { W.wind = 0; W.gusts = []; W.calmT = 30; Bus.emit('calmwind', {}); return { ttl: 4 }; } },
  thunder: { place: (x, y) => ({ x, y }), run(p) { lightning(p.x); return { ttl: 2 }; } },
  fog: { place: (x, y) => ({ x, y }), run(p) { (W.fogs || (W.fogs = [])).push({ x: p.x - 3, y: p.y - 2, w: 7, h: 4, ttl: 16 }); Bus.emit('fog', {}); return { ttl: 16 }; } },
  clear: { place: (x, y) => ({ x, y }), run(p) { W.rains = []; W.fogs = []; W.gusts = []; W.stormT = 0; W.clearT = 40; if (!W.night) W.dark = W.darkBase * 0.3; Fx.sunRise(); Bus.emit('clear', {}); return { ttl: 4 }; } },
  wave: { place: (x, y) => { for (let yy = y - 2; yy <= y + 3; yy++) if (waAt(x, yy) >= DEEP) return { x, y: yy }; return null; }, why: '水の上に書こう',
    run(p) { const dir = sign(p.x - W.hero.x) || 1; for (const o of entsNear(p.x, p.y, 4, o => (o.floats() || o.d.swim || o.isHero && o.hero.ride) && !o.d.root)) { for (let i = 0; i < 5; i++) moveEnt(o.isHero ? o : (o.hero ? o : o), dir, 0); Bus.emit('wave', { who: o }); } Fx.wave(p.x, p.y, dir); Sfx.splash(1); return { ttl: 2 }; } },
  spring: { place: (x, y) => groundSpot(x, y), run(p) { const e = newEnt('泉', p.x, p.y, { mine: true }); if (e) { e.src = { x: p.x, y: p.y, amt: 1, every: 3, ttl: Infinity }; } return { ent: e }; } },
  river: { place: (x, y) => ({ x, y }), run(p) { const e = newEnt('川', p.x, p.y, {}); if (e) { e.src = { x: p.x, y: p.y, amt: 2, every: 1, ttl: 9 }; e.sky = true; } Sfx.splash(1); Bus.emit('water', { x: p.x, y: p.y, n: 'river' }); return { ttl: 9 }; } },
  water: { place: (x, y) => ({ x, y }), run(p) { splash(p.x, p.y, 3, WMAX); return { ttl: 2 }; } },
  drop: { place: (x, y) => ({ x, y }), run(p) { splash(p.x, p.y, 1, 2); return { ttl: 1 }; } },
  sea: { place: (x, y) => ({ x, y }), run(p) { for (let i = -3; i <= 3; i++) splash(p.x + i, p.y, 1, WMAX * 2); Sfx.splash(1.5); Bus.emit('water', { x: p.x, y: p.y, n: 'sea' }); return { ttl: 3 }; } },
  falls: { place: (x, y) => ({ x, y: 0 }), run(p) { let y = 0; while (y < W.h - 1 && T_SOLID[tAt(p.x, y)]) y++; const e = newEnt('滝', p.x, y, {}); if (e) { e.src = { x: p.x, y, amt: 3, every: 1, ttl: 10 }; } Sfx.splash(1.2); Bus.emit('water', { x: p.x, y, n: 'falls' }); return { ttl: 10 }; } },
  hotwater: { place: (x, y) => ({ x, y }), run(p) { splash(p.x, p.y, 3, WMAX); const e = newEnt('湯', p.x, p.y, { life: 25 }); if (e) { e.hotT = 25; e.d = Object.assign({}, KDEF['湯'], { heat: 1 }); } return { ttl: 4 }; } },
  mountain: { place: (x, y) => { const g = groundBelow(x, y); return g < W.h ? { x, y: g } : null; }, why: '地面の上に書こう',
    run(p) { const cells = []; const g = p.y; for (let dx = -2; dx <= 2; dx++) { const hgt = 3 - Math.abs(dx); for (let k = 1; k <= hgt; k++) { const gx = p.x + dx; const gg = groundBelow(gx, g - 4); cells.push([gx, gg - k]); } } fillCells(cells, T.EARTH); Fx.dirt(p.x + .5, g - 1); Sfx.dig(); Bus.emit('mountain', { x: p.x }); return { ttl: 2 }; } },
  sand: { place: (x, y) => ({ x, y }), run(p) { const cells = []; for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) cells.push([p.x + dx, p.y + dy]); fillCells(cells, T.SAND); Sfx.sand(); Bus.emit('sand', {}); return { ttl: 3 }; } },
  hole: { place: (x, y) => { for (let yy = y; yy <= y + 2; yy++) if (T_DIG[tAt(x, yy)]) return { x, y: yy }; return null; }, why: '掘れる地面に書こう',
    run(p) { digCells([[p.x, p.y], [p.x + 1, p.y], [p.x, p.y + 1], [p.x + 1, p.y + 1]]); Sfx.dig(); Bus.emit('dig', { x: p.x, y: p.y }); return { ttl: 2 }; } },
  valley: { place: (x, y) => { for (let yy = y; yy <= y + 2; yy++) if (T_DIG[tAt(x, yy)]) return { x, y: yy }; return null; }, why: '掘れる地面に書こう',
    run(p) { const c = []; for (let dy = 0; dy < 3; dy++) for (let dx = -1; dx <= 1; dx++) c.push([p.x + dx, p.y + dy]); digCells(c); Sfx.dig(); Bus.emit('dig', { x: p.x, y: p.y, big: true }); return { ttl: 2 }; } },
  pond: { place: (x, y) => { const g = groundBelow(x, y); return g < W.h && T_DIG[tAt(x, g)] ? { x, y: g } : null; }, why: '掘れる地面に書こう',
    run(p) { digCells([[p.x - 1, p.y], [p.x, p.y], [p.x + 1, p.y]]); for (let dx = -1; dx <= 1; dx++) addWater(p.x + dx, p.y, WMAX); Sfx.splash(1); return { ttl: 2 }; } },
  paddy: { place: (x, y) => { const g = groundBelow(x, y); return g < W.h ? { x, y: g } : null; },
    run(p) { for (let dx = -1; dx <= 1; dx++) { if (T_DIG[tAt(p.x + dx, p.y)]) setT(p.x + dx, p.y, T.MUD); addWater(p.x + dx, p.y - 1, 3); } return { ttl: 2 }; } },
  void: { place: (x, y) => T_SOLID[tAt(x, y)] && tAt(x, y) !== T.BLANK ? { x, y } : null, why: '地面や岩に書こう',
    run(p) { setT(p.x, p.y, T.AIR); Fx.puff(p.x + .5, p.y + .5, 8); Bus.emit('void', { x: p.x, y: p.y }); return { ttl: 2 }; } },
  slope: { place: (x, y) => { const g = groundBelow(x, y); if (g >= W.h) return null; const w = findWallTop(x, g, 6); return w ? { x, y: g, wall: w } : null; }, why: 'となりに高い所がない',
    run(p) { const w = p.wall; const cells = []; const n = w.h - 1; for (let i = 0; i < n; i++) { const cx = w.wx - w.dir * (n - i); const top = p.y - (i + 1); for (let yy = groundBelow(cx, top) - 1; yy >= top; yy--) cells.push([cx, yy]); } fillCells(cells, T.EARTH); Sfx.dig(); Bus.emit('slope', {}); return { ttl: 2 }; } },
  volcano: { place: (x, y) => { const g = groundBelow(x, y); return g < W.h ? { x, y: g } : null; },
    run(p) { FX.mountain.run(p); const top = groundBelow(p.x, p.y - 6); const v = newEnt('炎', p.x, top - 2, { life: 20 }); if (v) v.burnT = 20; for (let yy = 0; yy < W.h; yy++) for (let xx = 0; xx < W.w; xx++) { const tt = tAt(xx, yy); if (tt === T.SNOW || tt === T.ICE) { if (chance(0.6)) { setT(xx, yy, T.AIR); if (tt === T.ICE) addWater(xx, yy, WMAX); } } } Fx.flash(0.5); Sfx.thunder(); Bus.emit('volcano', {}); return { ttl: 6 }; } },
  rainbow: { place: (x, y) => rainbowSpot(x, y), why: '向こう岸が見えない',
    run(p) { const e = newEnt('虹', p.x, p.y, { w: p.w, h: 1, life: 40 }); if (e) { e.w = p.w; Fx.sparkle(e.cx, e.cy, '#c9a7e8', 20); Sfx.chime(); Bus.emit('rainbow', {}); } return { ent: e }; } },
  bridge: { place: (x, y) => bridgeSpot(x, y), why: '谷や川の上に書こう（八マスまで）',
    run(p) { const e = newEnt('橋', p.x, p.y, { w: p.w, h: 1 }); if (e) { e.w = p.w; occupy(e); Fx.dust(e.cx, e.cy, 10); Sfx.thud(0.6); Bus.emit('bridge', { w: p.w }); } return { ent: e }; } },
  ladder: { place: (x, y) => ladderSpot(x, y), why: 'ここには立てられない',
    run(p) { const e = newEnt('梯', p.x, p.y, { w: 1, h: p.h }); if (e) { e.h = p.h; Bus.emit('ladder', { h: p.h }); } return { ent: e }; } },
  rope: { place: (x, y) => ropeSpot(x, y), why: 'ここからは垂らせない',
    run(p) { const e = newEnt('縄', p.x, p.y, { w: 1, h: p.h }); if (e) { e.h = p.h; Bus.emit('rope', { h: p.h }); } return { ent: e }; } },
  ivy: { place: (x, y) => ivySpot(x, y), why: '壁のそばに書こう',
    run(p) { const e = newEnt('蔦', p.x, p.y, { w: 1, h: p.h }); if (e) { e.h = p.h; Bus.emit('ivy', { h: p.h }); } return { ent: e }; } },
  emerge: { place: (x, y) => ({ x, y }), run(p) { let n = 0; for (const b of W.buried || []) { if (!b.found && Math.abs(b.x - p.x) <= 2 && Math.abs(b.y - p.y) <= 3) { b.found = true; digCells([[b.x, b.y]]); const e = entsAt(b.x, b.y)[0]; if (!e) newEnt(b.k, b.x, b.y); n++; } } for (const o of entsNear(p.x, p.y, 3, o => o.hideT > 0)) { o.hideT = 0; n++; } Fx.ring(p.x + .5, p.y + .5, INK.cha, 2); if (!n) toast('何も出てこなかった'); return { ttl: 2 }; } },
  bigbell: { place: (x, y) => ({ x, y }), run(p) { Sfx.bigBell(); Fx.ring(p.x + .5, p.y + .5, INK.kin, 6); for (const o of W.ents) if (isBeast(o)) { o.sleepT = 0; o.drunkT = 0; if (o.d.ai.yokai || o.d.ai.fears.includes('#noise')) { o.fleeFrom({ x: p.x, y: p.y, w: 1, h: 1 }, 10); if (o.d.ai.yokai) { o.leaving = true; o.leaveDir = sign(o.cx - p.x) || 1; o.talk('ひえっ', 2); } } } Bus.emit('bigbell', {}); return { ttl: 4 }; } },
  flute: { place: (x, y) => ({ x, y }), run(p) { Music.motif('flute'); Fx.notes(p.x + .5, p.y, 12); for (const o of entsNear(p.x, p.y, 8, isBeast)) { o.calmT = 18; o.fearT = 0; o.angryT = 0; if (o.k === '蛇') { o.danceT = 18; o.danceAt = { x: o.x, y: o.y }; o.talk('♪', 2); } if (o.k === '鳥') { o.callT = 8; o.callTo = { x: p.x, y: p.y - 1 }; } } Bus.emit('flute', {}); return { ttl: 6 }; } },
  drum: { place: (x, y) => ({ x, y }), run(p) { Sfx.drum(); Sfx.drum(0.25); Fx.ring(p.x + .5, p.y + .5, INK.aka, 4); noiseAt(p.x, p.y, 10, 'loud'); for (const o of W.ents) if (isBeast(o) && (o.d.npc || o.k === '狸')) { o.danceT = 15; o.danceAt = { x: p.x, y: p.y }; } Bus.emit('drum', {}); return { ttl: 4 }; } },
  quake: { place: (x, y) => ({ x, y }), run(p) { Fx.shake(1); Sfx.thunder(); for (const o of W.ents) { if (!o.alive) continue; if (o.d.fragile && chance(0.5)) breakEnt(o, null); if (isBeast(o)) { o.sleepT = 0; o.stun(1); } if (o.floatT > 0) o.floatT = 0; if (o.d.root && o.d.kind === 'plant' && o.d.heavy < 2) { } } for (const l of W.loose || []) { if (!l.done) { l.done = true; for (const [x, y] of l.cells) setT(x, y, T.AIR); const s = newEnt(l.k || '岩', l.x, l.y); } } Bus.emit('quake', {}); return { ttl: 3 }; } },
  hanami: { place: (x, y) => ({ x, y }), run(p) { for (const o of entsNear(p.x, p.y, 9, canFeel)) { o.calmT = 25; o.lookT = 6; o.fearT = 0; o.angryT = 0; o.talk('きれいだなあ', 2.5); } Fx.petals(p.x + .5, p.y - 2, 40); Bus.emit('hanami', {}); return { ttl: 6 }; } },
  fireworks: { place: (x, y) => ({ x, y }), run(p) { Fx.fireworks(p.x, Math.max(1, p.y - 4)); Sfx.fireworks(); for (const o of W.ents) if (isBeast(o)) { if (o.d.ai.yokai && W.dark > 0.3) { o.fleeFrom({ x: p.x, y: p.y, w: 1, h: 1 }, 6); } else { o.lookT = 6; o.talk('わあ', 2); } } Bus.emit('fireworks', {}); return { ttl: 6 }; } },
  autumn: { place: (x, y) => ({ x, y }), run(p) { setSeason('autumn'); return { ttl: 4 }; } },
  summer: { place: (x, y) => ({ x, y }), run(p) { setSeason('summer'); return { ttl: 4 }; } },
  winter: { place: (x, y) => ({ x, y }), run(p) { setSeason('winter'); return { ttl: 4 }; } },
  spring: Object.assign({}, {}),
  village: { place: (x, y) => ({ x, y }), run(p) { Voice.say('……どこかで、里の人の笑い声がする', { who: 'painter' }); return { ttl: 2 }; } },
};
// 「泉」と「春」が同じ名になるので分ける
FX.spring = FX.spring || {};
FX.springWater = { place: (x, y) => groundSpot(x, y), run(p) { const e = newEnt('泉', p.x, p.y, { mine: true }); if (e) { e.src = { x: p.x, y: p.y, amt: 1, every: 3, ttl: Infinity }; } return { ent: e }; } };
FX.springSeason = { place: (x, y) => ({ x, y }), run(p) { setSeason('spring'); return { ttl: 4 }; } };
KDEF['泉'].fx = 'springWater';
KDEF['春'].fx = 'springSeason';
FX.paddy = FX.paddy;

function groundSpot(x, y) { const g = groundBelow(x, y); return g <= W.h ? { x, y: Math.max(0, g - 1) } : null; }
function cloudRow(x, y) { let yy = Math.max(0, y - 6); return yy; }
function splash(x, y, n, amt) {
  for (let i = 0; i < n; i++) { const xx = x + i - Math.floor(n / 2); let yy = y; while (yy > 0 && T_SOLID[tAt(xx, yy)]) yy--; addWater(xx, yy, amt); for (const e of entsAt(xx, yy)) e.wet(8); for (const e of entsNear(xx, yy, 1, o => o.burnT > 0)) extinguish(e); }
  Fx.splash(x + .5, y + .5, 14); Sfx.splash(0.8);
  for (const e of entsNear(x, y, 2, o => o.d.kind === 'plant')) e.growPts = (e.growPts || 0) + 6;
  Bus.emit('water', { x, y, n: 'splash' });
}
function meteor(x) {
  x = clamp(Math.round(x), 0, W.w - 1);
  let y = 0; while (y < W.h && !T_SOLID[tAt(x, y)] && !entsAt(x, y, e => e.d.solid || e.d.beast || e.d.kind === 'plant').length) y++;
  Fx.meteor(x + .5, y); Sfx.thunder(); Fx.flash(0.6);
  later(0.45, () => {
    for (const e of entsNear(x, y, 1.2, o => !o.isHero)) { if (e.d.fragile || e.d.breakTo || e.k === '岩' || e.d.wall) breakEnt(e, null); else if (e.canBurn()) ignite(e, null); else if (e.d.beast) e.stun(5); }
    for (let yy = y; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) { const tt = tAt(xx, yy); if (tt === T.ROCK || tt === T.ICE || tt === T.CRACK) { setT(xx, yy, T.AIR); if (tt === T.ICE) addWater(xx, yy, WMAX); Fx.shatter(xx + .5, yy + .5, '#888'); } }
    if (W.hero && W.hero.alive && Math.abs(W.hero.x - x) <= 0 && Math.abs(W.hero.y - y) <= 1) heroHurt('crush');
    Bus.emit('meteor', { x, y });
  });
}
function festival(x, y) {
  Sfx.drum(); Music.motif('festival'); Fx.confetti(x + .5, y - 2, 40);
  for (const o of W.ents) if (isBeast(o)) { o.danceT = 20; o.danceAt = { x: clamp(x + rndi(5) - 2, 0, W.w - o.w), y }; o.sleepT = 0; o.fearT = 0; if (o.d.ai.guard) { o.ai.home = o.danceAt.x; } }
  Bus.emit('festival', { x, y });
}
function lessOf(k) {
  const m = { '森': '林', '林': '木', '炎': '火', '岩': '石', '嵐': '風', '海': '水', '大木': '木', '焚': '火', '晶': '日', '島': '山' };
  return m[k] || null;
}
function fellTree(e) {
  const dir = sign(e.cx - W.hero.cx) || 1;
  const baseY = e.y + e.h - 1, x0 = e.x;
  const len = Math.max(3, e.h + (e.mods.long ? 1 : 0) + (e.w > 1 ? 1 : 0));
  removeEnt(e, 'cut');
  // 切り株から倒れる向きへ
  let lx = dir > 0 ? x0 : x0 - len + 1;
  let y = baseY;
  const log = newEnt('丸太', clamp(lx, 0, W.w - len), y, { w: len, h: 1, instant: true, mine: e.mine, ink: e.mine ? e.ink : 0 });
  if (log) { log.w = len; unoccupy(log); if (!canPlace(log, log.x, log.y)) { for (let up = 1; up <= 3; up++) if (canPlace(log, log.x, log.y - up)) { log.y -= up; break; } } occupy(log); log.fellDir = dir; log.spawnT = 0.6; Sfx.timber(); Fx.dust(log.cx, log.cy, 12); Bus.emit('fell', { who: log, dir }); }
  return 1.5;
}
function openEnt(e, key) {
  if (e.d.gate || e.d.door) {
    if (e.locked && !key) { toast('鍵がかかっている'); return false; }
    e.open = true; e.locked = false; unoccupy(e); rebuildOcc(); Sfx.door(); Bus.emit('open', { who: e }); return true;
  }
  if (e.k === '箱' || e.d.pot) {
    if (e.holds) { const h = e.holds; e.holds = null; const n = newEnt(h, e.x, e.y - 1); if (n) { Fx.sparkle(n.cx, n.cy, INK.kin, 8); } }
    if (e.d.pot) breakEnt(e, null);
    Sfx.door(); Bus.emit('open', { who: e }); return true;
  }
  return false;
}
// 橋：指した行で、左右の岸（その行の地面）をさがす
function bridgeSpot(x, y) {
  for (const row of [y, y + 1, y - 1, y + 2]) {
    if (row < 0 || row >= W.h) continue;
    if (T_SOLID[tAt(x, row)]) continue;
    if (waAt(x, row) >= 2) continue;
    let l = x, r = x;
    while (l > 0 && !T_SOLID[tAt(l - 1, row)] && x - l < 9) l--;
    while (r < W.w - 1 && !T_SOLID[tAt(r + 1, row)] && r - x < 9) r++;
    const okL = l > 0 && T_SOLID[tAt(l - 1, row)], okR = r < W.w - 1 && T_SOLID[tAt(r + 1, row)];
    const w = r - l + 1;
    if (okL && okR && w <= 8 && w >= 1) {
      // 橋の上（歩く行）に人が入れる
      let clear = true; for (let xx = l; xx <= r; xx++) { const o = occAt(xx, row); if (o && entSolid(o)) clear = false; }
      if (clear) return { x: l, y: row, w, h: 1 };
    }
  }
  return null;
}
function rainbowSpot(x, y) {
  const b = bridgeSpot(x, y); if (b) return b;
  // 岸がなくても、地面の高さから向こうへ 10 マス
  const g = groundBelow(x, y);
  if (g >= W.h) return null;
  const dir = sign(x - W.hero.x) || 1;
  const row = g;
  const x0 = dir > 0 ? x : x - 9;
  if (x0 < 0 || x0 + 10 > W.w) return null;
  return { x: x0, y: row - 1, w: 10, h: 1 };
}
function ladderSpot(x, y) {
  if (T_SOLID[tAt(x, y)]) y--;
  const g = groundBelow(x, y); if (g >= W.h) return null;
  const wall = findWallTop(x, g, 9);
  let h = wall ? (g - wall.top) : 4;
  h = clamp(h, 2, 10);
  for (let k = 1; k <= h; k++) { if (T_SOLID[tAt(x, g - k)]) { h = k - 1; break; } }
  if (h < 2) return null;
  return { x, y: g - h, w: 1, h };
}
function ropeSpot(x, y) {
  if (T_SOLID[tAt(x, y)]) return null;
  let top = y;
  // 上が開いている崖のふち：そこから下へ
  let h = 0; while (h < 12 && !T_SOLID[tAt(x, top + h)] && !(occAt(x, top + h) && entSolid(occAt(x, top + h)))) h++;
  if (h < 2) return null;
  return { x, y: top, w: 1, h };
}
function ivySpot(x, y) {
  if (T_SOLID[tAt(x, y)]) return null;
  const g = groundBelow(x, y);
  if (!T_SOLID[tAt(x - 1, g - 1)] && !T_SOLID[tAt(x + 1, g - 1)]) return null;
  const side = T_SOLID[tAt(x - 1, g - 1)] ? -1 : 1;
  let h = 0; while (h < 9 && T_SOLID[tAt(x + side, g - 1 - h)] && !T_SOLID[tAt(x, g - 1 - h)]) h++;
  if (h < 1) return null;
  return { x, y: g - h, w: 1, h };
}
// 時と季節
function setTime(t, sun) {
  if (t === 'night') { W.night = true; W.dark = Math.max(W.darkBase, 0.62); W.fullmoon = false; for (const o of W.ents) if (isBeast(o)) { if (o.d.ai.night || o.d.ai.yokai) o.sleepT = 0; else if (!o.d.ai.guard && !o.charmT && chance(0.7)) o.sleep(40); } Fx.dusk(); }
  else { W.night = false; W.dark = sun ? 0 : W.darkBase; for (const o of W.ents) if (isBeast(o) && !o.drunkT) { if (o.d.ai.night && o.k !== '蛍') o.sleep(40); else if (!o.hibern) o.sleepT = 0; } Fx.dawn(); }
  Music.mood(W.night ? 'night' : null);
  Bus.emit('time', { t });
}
function setSeason(s) {
  W.season = s;
  Fx.season(s);
  if (s === 'spring' || s === 'summer') {
    W.meltAll = s === 'spring' ? 20 : 30;
    for (const o of W.ents) if (isBeast(o)) { if (o.hibern) { o.hibern = false; o.sleepT = 0; o.talk('ふわあ', 2); } if (o.d.ai.snowy) { o.leaving = true; o.leaveDir = 1; o.talk('……春が来たのね', 3); } }
    if (s === 'spring') for (const o of W.ents.slice()) { if (o.alive && o.k === '草' && chance(0.6)) transformEnt(o, '花'); if (o.alive && o.k === '枯木') transformEnt(o, '桜'); }
    if (s === 'summer') { for (let i = 0; i < 3; i++) { const x = rndi(W.w); const g = groundBelow(x, 0); if (g < W.h) newEnt(W.night ? '蛍' : '虫', x, Math.max(0, g - 3)); } }
  }
  if (s === 'autumn') { for (const o of W.ents.slice()) if (o.alive && o.d.kind === 'plant' && o.d.wood && !o.d.dead) { const k = chance(0.5) ? '柿' : '栗'; const f = newEnt(k, o.x + (chance(.5) ? -1 : 1), o.y); if (f) f.spawnT = 0.5; Fx.leavesFall(o.cx, o.cy, 10); } }
  if (s === 'winter') {
    W.rains.push({ x: 0, y: 0, w: W.w, ttl: 10, rate: 0.35, cloud: true, snow: true });
    for (let y = 1; y < W.h; y++) for (let x = 0; x < W.w; x++) if (W.wa[idx(x, y)] >= DEEP && waAt(x, y - 1) < 2 && chance(0.85)) freezeCell(x, y);
    for (const o of W.ents) if (isBeast(o) && o.d.ai.hibernate) { o.hibern = true; o.sleep(9999); o.talk('ぐう', 2); Bus.emit('sleep', { who: o, by: '冬' }); }
  }
  Bus.emit('season', { s });
}
function dreamOf(e) { return { '鬼': 'お酒……おいしいお酒がのみたいのう', '熊': 'はちみつ……あまい……', '猿': '柿……桃……', '河童': 'きゅうり……', '狐': 'あぶらあげ……', '犬': 'ほね……ほね……', '猫': 'さかな……' }[e.k] || '……'; }
function wantOf(e) {
  const ai = e.d.ai; if (!ai) return '……';
  const want = { '鬼': 'お酒がのみたいのう。……豆はきらいじゃ', '熊': 'はちみつはないか。……鈴の音はいやだ', '猿': '桃か柿がほしいな。犬はこわい', '河童': 'きゅうりがあればなあ', '狐': '油あげ、油あげ', '狸': 'お酒と、きらきらした物がほしいのう', '犬': 'ほねがほしいワン', '猫': 'さかなー', '鼠': 'お米ちょうだい。猫はこわい', '牛': '草が食べたいモウ', '馬': '草をくれたら乗せてあげる', '鶴': 'さかなを分けてくれたら、空へ運んであげる', '竜': '玉……あの丸い玉がほしい', '天狗': '礼を知る者なら、通してやろう', '雪女': '……あたたかいのは、きらい', '亀': 'のんびり行こう。背中に乗るかい', '兎': 'お月さまが見たいな', '鹿': '草のあるところへ行きたい', '蛇': '笛の音が聞こえると、踊りたくなる', '子': 'あそんで！' }[e.k];
  return want || (ai.eats.length ? 'おなかがすいた' : '……');
}
function thoughtOf(e) { return '……' + (KDEF[e.k] ? KDEF[e.k].imi : e.k) + 'か。なつかしいのう'; }

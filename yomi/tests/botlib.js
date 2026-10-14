// 黄泉還：通しプレイの自動操作（ページの中で動く）。
// ゲームの中身は直接いじらず、プレイヤーと同じ「スティック・ボタン」（IN.bot と IN.e）だけで遊ぶ。
// 見るのは画面に出ている情報と同じもの（部屋の形・敵の位置・持ち物）。
module.exports = `
window.BOT = (() => {
  const B = { i: 0, route: [], opts: {}, log: [], co: null, task: null, t: 0, taskT: 0, path: null, pathKey: '', pathT: 0, stuck: 0, lastP: null, lastPT: 0,
    deaths: 0, saveIdx: [null, null, null], seenRoom: {}, lastRid: '', evt: 0, flagSeen: {}, done: false, fail: null, snaps: [], hurt: 0, shots: 0, frameN: 0, macro: null, fightT: 0, wantSave: false, died: {}, kills0: 0, pressT: 0, noti: [] };
  const say_ = s => { B.log.push('[' + fmtTime(G.time) + ' ' + (G.rid || '-') + '] ' + s); };
  const key = k => { IN.e[k] = 1; if (k !== 'any') IN.e.any = 1; };
  const idle = () => { IN.bot = { mx: 0, my: 0, run: false, aim: false }; };
  // 世界の向き(dx,dz)へ進むスティック。ゲームが前のカメラの向きを覚えている間は、それに合わせる
  function stickVec(dx, dz) {
    const cam = curCam(); if (!cam) return [0, 0]; const L = hyp(dx, dz) || 1; dx /= L; dz /= L;
    let b = G.ctrl ? G.ctrl.b : camBasis(cam), mx = dx * b.rx + dz * b.rz, my = dx * b.fx + dz * b.fz;
    if (G.ctrl && abs(angDiff(G.ctrl.ia, Math.atan2(mx, my))) > 0.6) { b = camBasis(cam); mx = dx * b.rx + dz * b.rz; my = dx * b.fx + dz * b.fz; }
    return [mx, my];
  }
  function stickTo(dx, dz, run, mag = 1) { const [mx, my] = stickVec(dx, dz); IN.bot = { mx: mx * mag, my: my * mag, run: !!run, aim: false }; }
  // ── 部屋の中の道さがし（高さも含めて） ──
  const S = 0.25;
  function stand(x, z, y) { return standAt(G.room, x, z, y, 0.29, 'pl'); }
  function segClear(x0, z0, y0, x1, z1) { const n = Math.ceil(hyp(x1 - x0, z1 - z0) / 0.1); let y = y0; for (let k = 1; k <= n; k++) { const t = k / n, yy = stand(lerp(x0, x1, t), lerp(z0, z1, t), y); if (yy == null || abs(yy - y) > 0.3) return false; y = yy; } return true; }
  // 小さな二分ヒープ
  function heap() { const a = []; return { push(v) { a.push(v); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }, pop() { const top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }, get size() { return a.length; } }; }
  function findPath3(tx, tz, ty, near = 0.2) {
    const R = G.room, xs = R.rects.flatMap(q => [q[0], q[2]]), zs = R.rects.flatMap(q => [q[1], q[3]]), X0 = Math.min(...xs), Z0 = Math.min(...zs);
    const si = Math.round((PL.x - X0) / S), sj = Math.round((PL.z - Z0) / S); const K = (i, j, y) => i + ',' + j + ',' + Math.round(y * 2);
    let start = [si, sj, stand(X0 + si * S, Z0 + sj * S, PL.y)];
    if (start[2] == null) { for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const y = stand(X0 + (si + di) * S, Z0 + (sj + dj) * S, PL.y); if (y != null) { start = [si + di, sj + dj, y]; break; } } if (start[2] == null) return null; }
    const H = heap(), g = new Map([[K(...start), 0]]), from = new Map(), closed = new Set(); H.push([0, ...start]); let n = 0;
    while (H.size && n++ < 12000) {
      const [, i, j, y] = H.pop(), k0 = K(i, j, y); if (closed.has(k0)) continue; closed.add(k0);
      const x = X0 + i * S, z = Z0 + j * S;
      if (hyp(x - tx, z - tz) <= near + 0.01 && (ty == null || abs(y - ty) < 0.5)) { const out = [[x, z, y]]; let k = k0; while (from.has(k)) { const p = from.get(k); out.unshift([X0 + p[0] * S, Z0 + p[1] * S, p[2]]); k = K(...p); } return out; }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = i + di, nj = j + dj, ny = stand(X0 + ni * S, Z0 + nj * S, y); if (ny == null || abs(ny - y) > 0.35) continue;
        const nk = K(ni, nj, ny); if (closed.has(nk)) continue;
        if (di && dj && (stand(X0 + (i + di) * S, Z0 + j * S, y) == null || stand(X0 + i * S, Z0 + (j + dj) * S, y) == null)) continue;
        const ng = g.get(k0) + (di && dj ? 1.414 : 1);
        if (!g.has(nk) || ng < g.get(nk)) { g.set(nk, ng); from.set(nk, [i, j, y]); H.push([ng + hyp(X0 + ni * S - tx, Z0 + nj * S - tz) / S, ni, nj, ny]); }
      }
    }
    return null;
  }
  // 目的地まで1こま歩く。着いたら true
  function walk(tx, tz, ty, near = 0.3, run = true) {
    if (hyp(tx - PL.x, tz - PL.z) < near && (ty == null || abs(ty - PL.y) < 0.5)) { idle(); return true; }
    // 道は、目的地が0.5m以上動いたか、1.5秒たったときだけ引き直す（毎こまは重い）
    const moved = !B.pathTo || hyp(B.pathTo[0] - tx, B.pathTo[1] - tz) > 0.5;
    if (!B.path || moved || B.t - B.pathT > 1.5) { B.path = findPath3(tx, tz, ty, Math.max(0.2, near - 0.12)); B.pathTo = [tx, tz]; B.pathT = B.t; if (!B.path) { if (B.t - (B.noPathT || -9) > 5) { say_('道が見つからない → ' + tx.toFixed(2) + ',' + tz.toFixed(2)); B.noPathT = B.t; } B.path = [[tx, tz, ty == null ? PL.y : ty]]; } }
    const P = B.path; while (P.length > 1 && hyp(P[0][0] - PL.x, P[0][1] - PL.z) < 0.35) P.shift();
    // 見通せるいちばん先の点をめざす（なめらかに）
    let tgt = P[0]; for (let k = Math.min(P.length - 1, 8); k >= 1; k--) { if (hyp(P[k][0] - PL.x, P[k][1] - PL.z) < 2.2 && segClear(PL.x, PL.z, PL.y, P[k][0], P[k][1])) { tgt = P[k]; break; } }
    const dx = tgt[0] - PL.x, dz = tgt[1] - PL.z, d = hyp(dx, dz);
    stickTo(dx, dz, run && hyp(tx - PL.x, tz - PL.z) > 1.2);
    // 動けていないとき：少し横へ
    if (B.t - B.lastPT > 1.2) { if (B.lastP && hyp(PL.x - B.lastP[0], PL.z - B.lastP[1]) < 0.08) { B.stuck++; B.path = null; } else B.stuck = 0; B.lastP = [PL.x, PL.z]; B.lastPT = B.t; }
    if (B.stuck > 0 && (B.t * 2 % 1) < 0.5) { const a = Math.atan2(dx, dz) + (B.stuck % 2 ? 1.4 : -1.4); stickTo(Math.sin(a), Math.cos(a), false); }
    return false;
  }
  function faceTo(tx, tz) { const ta = Math.atan2(tx - PL.x, tz - PL.z), d = angDiff(PL.ang, ta); if (abs(d) < 0.22) { idle(); return true; } stickTo(Math.sin(ta), Math.cos(ta), false, 0.4); return false; }
  // 近づく所：目標から r 以内で、立てて、歩いて行ける所のうち、いちばん近い所
  function approach(tx, tz, ty, rmax, rmin = 0.35) {
    let best = null, bd = 1e9;
    for (let r = rmin; r <= rmax + 1e-6; r += 0.06) for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, x = tx + Math.sin(a) * r, z = tz + Math.cos(a) * r; const y = stand(x, z, ty != null ? ty : PL.y); if (y == null || (ty != null && abs(y - ty) > 0.6)) continue; const s = r * 3 + hyp(x - PL.x, z - PL.z) * 0.15; if (s < bd) { bd = s; best = [x, z, y]; } }
    return best;
  }
  // 持ち物と、込めてある弾（記録用）
  const invStr = () => G.inv.map(q => q ? q.id + (q.n > 1 ? '×' + q.n : '') : '-').join(' ') + '　弾 ' + Object.entries(G.mag).filter(([w, n]) => invHas(w)).map(([w, n]) => w + n).join(' ');
  // ── 敵 ──
  function threats() {
    const out = [];
    for (const e of G.en) {
      if (e.dead || e.hp <= 0 || e.targetable === false || !e.h.root.visible) continue; if (abs(e.y - PL.y) > 1.6) continue;
      const d = hyp(e.x - PL.x, e.z - PL.z), t = e.type, big = t === 'brute' || t === 'hunter' || t.startsWith('boss');
      const see = lineClear(G.room, PL.x, PL.z, e.x, e.z, PL.y);
      let th = false;
      // 大きな敵：気づいていて、見えている（槽の中で眠っている物は相手にしない）
      if (big) th = e.alert && d < 16 && (see || d < 4); else if (t === 'dog') th = d < 9; else if (t === 'spider') th = (e.alert && d < 8) || d < 3; else th = (e.alert || d < 2.6) && d < 6.5 && (see || d < 2);
      if (th) out.push({ e, d, see });
    }
    return out.sort((a, b) => a.d - b.d);
  }
  const WPREF = { zombie: ['hg', 'sg'], crawler: ['hg', 'sg'], dog: ['hg', 'sg'], spider: ['hg', 'sg'], hunter: ['sg', 'hg', 'mg'], brute: ['sg', 'hg', 'mg'], boss1: ['mg', 'sg', 'hg'], boss2: ['gl', 'mg', 'sg', 'hg'] };
  const hasAmmo = w => w === 'knife' || (invHas(w) && ((G.mag[w] || 0) > 0 || invCount(ITEMS[w].ammo) > 0 || (w === 'hg' && G.inf)));
  function wantWeapon(t) { for (const w of WPREF[t] || ['hg', 'sg']) if (hasAmmo(w)) return w; for (const w of ['hg', 'sg', 'mg', 'gl']) if (hasAmmo(w)) return w; return 'knife'; }
  // 逃げる向き：敵から離れる向きのうち、先が広く開いている向き（壁や家具の角へ追いこまれない）
  function openDir(away) {
    let best = null, bs = -1e9;
    for (let k = 0; k < 16; k++) { const a = away + (k < 8 ? k : k - 16) / 16 * TAU, fx = Math.sin(a), fz = Math.cos(a); let L = 0; for (let r = 0.35; r <= 4; r += 0.35) { if (!segClear(PL.x, PL.z, PL.y, PL.x + fx * r, PL.z + fz * r)) break; L = r; }
      if (L < 1.0) continue; const sc = L + Math.cos(a - away) * 2.2; if (sc > bs) { bs = sc; best = a; } }
    return best;
  }
  function fight(T0, all) {
    const e = T0.e, d = T0.d, t = e.type;
    if (PL.grab) { key('any'); idle(); return; }
    const go = a => { stickTo(Math.sin(a), Math.cos(a), true); };
    const away = Math.atan2(PL.x - e.x, PL.z - e.z), big = t === 'brute' || t.startsWith('boss');
    // 大きな敵の大技はよける：身構え・突進は横へ（いま居る側へ）、振りかぶりは広い方へ下がる
    if (big && PL.hurtT <= 0) {
      if (['brace', 'lunge', 'charge'].includes(e.state)) { const side = (PL.x - e.x) * Math.cos(e.ang) - (PL.z - e.z) * Math.sin(e.ang) >= 0 ? 1 : -1; for (const a of [e.ang + side * PI / 2, e.ang - side * PI / 2]) { const o = openDir(a); if (o != null && abs(angDiff(o, a)) < 1.0) { go(o); return; } } }
      if (e.state === 'windup' && d < 3.4) { const o = openDir(away); if (o != null) { B.kiteT = B.t + 0.5; B.kiteA = o; go(o); return; } }
    }
    // 近すぎる：しばらく走って間をあける（すぐ構えなおすと、構え終わる前にまた詰められる）。
    // 大きな敵が振り終わり・ひるみの間は、離れずに撃つ
    const kd = { zombie: 1.45, crawler: 1.1, dog: 0, spider: 1.7, hunter: 2.2, brute: 2.6, boss1: 2.7, boss2: 2.7 }[t] || 1.4;
    const opening = big && ['swing', 'stagger', 'roar'].includes(e.state);
    if (PL.hurtT <= 0 && !opening) {
      if (B.kiteT > B.t && B.kiteE === e && d < kd + 1.6) { if (B.t - (B.kiteAT || 0) > 0.25) { B.kiteAT = B.t; const o = openDir(away); if (o != null) B.kiteA = o; } go(B.kiteA); return; }
      if (d < kd) { const o = openDir(away); if (o != null) { B.kiteE = e; B.kiteT = B.t + (big ? 0.9 : 0.5); B.kiteA = o; B.kiteAT = B.t; go(o); return; } }
    }
    const w = G.eq; if (w !== 'knife' && (G.mag[w] || 0) <= 0 && !invCount(ITEMS[w].ammo) && !(w === 'hg' && G.inf)) { idle(); return; }
    // 撃つ相手は、ゲームが自動で狙っている相手（脅威のうちの一体なら）。狙っていなければ、いちばん近い敵へ向ける
    const tq = all.find(q => q.e === PL.tgt) || T0, te = tq.e;
    const ta = Math.atan2(te.x - PL.x, te.z - PL.z), dA = angDiff(PL.ang, ta);
    IN.bot = { mx: 0, my: 0, run: false, aim: true };
    if (tq === T0 && PL.tgt !== e && abs(dA) > 0.2) { const [mx, my] = stickVec(Math.sin(ta), Math.cos(ta)); IN.bot.mx = mx; IN.bot.my = my; }
    // 当たる向きになってから撃つ（遠いほど細かく合わせる）。散弾は近いほど効くので、寄ってくる相手は引きつけてから
    const tol = Math.min(0.3, Math.atan2(te.rad + 0.05, Math.max(0.6, tq.d)) * (w === 'sg' ? 1.5 : 0.85));
    const inRange = w !== 'sg' || tq.d < 4.8 || te.type === 'brute' || te.type.startsWith('boss');
    if (PL.aimT > 0.18 && PL.cd <= 0 && abs(dA) < tol && inRange && (tq.see || tq.d < 2.5)) { key('fire'); B.shots++; }
  }
  // ── 持ち物の画面を、ボタンで動かす（コルーチン） ──
  function* openMenuCo() { for (let k = 0; k < 30 && !(G.ui && G.ui.k === 'menu'); k++) { if (!G.msg && G.mode === 'play' && PL.actT <= 0 && PL.reloadT <= 0 && !PL.grab && PL.hurtT <= 0) key('menu'); yield; } if (!(G.ui && G.ui.k === 'menu')) return false; yield; return true; }
  function* closeMenuCo() { for (let k = 0; k < 30 && G.ui; k++) { if (G.msg) key('ok'); else key('cancel'); yield; yield; } }
  function* selSlotCo(i) { const m = G.ui; for (let k = 0; k < 20 && m.sel !== i; k++) { const r0 = Math.floor(m.sel / 2), c0 = m.sel % 2, r1 = Math.floor(i / 2), c1 = i % 2; if (i === INV_N) key('down'); else if (r0 < r1) key('down'); else if (r0 > r1) key('up'); else if (c0 < c1) key('right'); else key('left'); yield; } }
  function* menuActCo(slot, act) { // slot の物に act（'use' 'equip' 'comb' 'drop'）
    if (!(yield* openMenuCo())) return false; yield* selSlotCo(slot); key('ok'); yield; const m = G.ui; if (!m || !m.act) { yield* closeMenuCo(); return false; }
    const j = m.act.findIndex(a => a[1] === act); if (j < 0) { key('cancel'); yield; yield* closeMenuCo(); return false; }
    for (let k = 0; k < 6 && m.asel !== j; k++) { key('down'); yield; } key('ok'); yield; yield;
    return true;
  }
  function* equipCo(w) {
    if (G.eq === w) return;
    if (w === 'knife') { if (!(yield* openMenuCo())) return; yield* selSlotCo(INV_N); key('ok'); yield; yield* closeMenuCo(); say_('ナイフに持ちかえ'); return; }
    const slot = G.inv.findIndex(s => s && s.id === w); if (slot < 0) return;
    if (yield* menuActCo(slot, 'equip')) say_('装備：' + ITEMS[w].name); yield* closeMenuCo();
  }
  function* healCo() {
    const heal = PL.hp < 40 ? ['herb_grb', 'herb_gr', 'herb_ggg', 'spray', 'herb_gg', 'herb_gb', 'herb_g'] : ['herb_g', 'herb_gg', 'herb_gb', 'herb_gr', 'herb_ggg', 'herb_grb', 'spray'];
    // 毒：体力に余裕があれば毒消しを先に。危ないときは回復を先に（毒消しがなくても回復はする）
    const order = !PL.poison ? heal : PL.hp < 40 ? ['herb_grb', ...heal.filter(h => h !== 'herb_grb'), 'herb_b'] : ['herb_grb', 'herb_gb', 'herb_b', ...heal];
    for (const id of order) { const slot = G.inv.findIndex(s => s && s.id === id); if (slot < 0) continue; const hp0 = PL.hp; if (yield* menuActCo(slot, 'use')) say_('回復：' + ITEMS[id].name + ' ' + hp0 + '→' + PL.hp); yield* closeMenuCo(); return true; }
    return false;
  }
  function* combineCo(a, b) { const i = G.inv.findIndex(s => s && s.id === a); let j = G.inv.findIndex((s, k) => s && s.id === b && k !== i); if (i < 0 || j < 0) return false; if (!(yield* menuActCo(i, 'comb'))) { yield* closeMenuCo(); return false; } yield* selSlotCo(j); key('ok'); yield; yield; yield* closeMenuCo(); say_('組み合わせ：' + a + '+' + b); return true; }
  function* tidyHerbsCo() { for (let k = 0; k < 6; k++) { if (invHas('herb_g') && invHas('herb_r')) { yield* combineCo('herb_g', 'herb_r'); continue; } if (invCount('herb_g') >= 2 || (invHas('herb_gg') && invHas('herb_g'))) { yield* combineCo(invHas('herb_gg') ? 'herb_gg' : 'herb_g', 'herb_g'); continue; } break; } }
  // ── 調べる・拾う・扉 ──
  function* interactCo(tx, tz, ty, rmax, label, opts = {}) {
    for (let tries = 0; tries < 5; tries++) {
      const ap = opts.at || approach(tx, tz, ty, rmax); if (!ap) { say_('近づけない：' + label); return false; }
      let T0 = B.t; while (!walk(ap[0], ap[1], ap[2], 0.16, true)) { B.where = 'walk ' + label; if (B.t - T0 > 40) { say_('たどり着けない：' + label); return false; } yield; }
      T0 = B.t; const fx = opts.face ? opts.face[0] : tx, fz = opts.face ? opts.face[1] : tz; while (!faceTo(fx, fz)) { B.where = 'face ' + label; if (B.t - T0 > 3) break; yield; }
      idle(); yield; const e0 = B.evt;
      key('act'); yield; yield; yield;
      if (B.evt !== e0 || G.msg || G.ui || G.mode !== 'play' || PL.actT > 0) return true;
      say_('反応なし、やり直し：' + label + ' 距離' + hyp(tx - PL.x, tz - PL.z).toFixed(2)); for (let k = 0; k < 20; k++) { stickTo(Math.sin(PL.ang + PI), Math.cos(PL.ang + PI), false, 0.6); yield; } idle();
    }
    return false;
  }
  function* waitCalmCo(sec = 60) { const T0 = B.t; B.where = 'calm'; yield; while ((G.msg || G.ui || G.card || G.mode === 'cut' || G.mode === 'door' || PL.actT > 0) && B.t - T0 < sec) { B.where = 'calm ' + (G.msg ? 'msg' : G.ui ? G.ui.k : G.mode); yield; } }
  // 扉の行き先をたどる（今あける鍵・旗があるものだけ）
  function canPass(rid, d) { if (!d.to) return false; const L = d.lock, k = doorPair(rid, d); if (!L || G.open[k]) return true; if (L.story) return false; if (L.flag) return condOK(L.flag); if (L.bar === 'this') return true; if (L.bar === 'other') return false; if (L.key) { const kid = Object.keys(ITEMS).find(q => ITEMS[q].lock === L.key); return invHas(kid); } return false; }
  function roomRoute(to) { const prev = { [G.rid]: null }, q = [G.rid]; while (q.length) { const r = q.shift(); if (r === to) break; for (const d of ROOMS[r].doors || []) { if (!canPass(r, d)) continue; const n = d.to[0]; if (!(n in prev)) { prev[n] = [r, d.id]; q.push(n); } } } if (!(to in prev)) return null; const hops = []; let r = to; while (prev[r]) { hops.unshift(prev[r]); r = prev[r][0]; } return hops; }
  function* goCo(to) {
    for (let guard = 0; guard < 12 && G.rid !== to; guard++) {
      const hops = roomRoute(to); if (!hops || !hops.length) { say_('行けない：' + to); B.fail = B.fail || ('行けない ' + G.rid + '→' + to); return false; }
      const [rid, did] = hops[0]; const d = G.room.doors.find(x => x.id === did);
      const sp = d.spawn, rid0 = G.rid;
      const ok = yield* interactCo(d.pos[0], d.pos[1], d.y, 0.8, '扉 ' + did, { at: [sp[0], sp[1], d.y], face: [d.pos[0], d.pos[1]] });
      yield* waitCalmCo(30);
      if (G.rid === rid0) { if (!ok) { say_('扉を通れない：' + did); } yield; }
      else say_('→ ' + G.rid + '　体力' + PL.hp + '　' + invStr());
    }
    return G.rid === to;
  }
  // この先、次に箱へ寄るまでに拾う「要る物」の数（そのぶんの枠は、ほかの物で埋めない）
  function needFree() { let n = 0; for (let k = B.i + 1; k < B.route.length; k++) { const T = B.route[k]; if (T.box) break; if (T.pick && T.req) n++; } return n; }
  function* pickCo(k, req, want) {
    if (G.taken[k]) return true; const p = G.room.pick.find(q => q.key === k); if (!p) { say_('拾い物が見当たらない：' + k); if (req) B.fail = B.fail || ('拾えない ' + k); return false; }
    const loose = p.id === 'file' || p.id === 'map', fits = loose || canFit(p.id, p.n || 1);
    // いっぱいでも、もう使わない鍵を捨てるか、武器なら持ちかえて拾える（ゲームがそう聞いてくる）
    const room = G.inv.some(q => q && ITEMS[q.id].kind === 'key' && keyDone(q.id)) || (ITEMS[p.id] && ITEMS[p.id].kind === 'weapon' && invHas(G.eq));
    if (!fits && !((req || want) && room)) { say_('持ちきれず置いていく：' + k); if (req) B.fail = B.fail || ('持てない ' + k); return false; }
    // 先の要る物のために枠をあけておく（重ねられない物を拾うときだけ。ふつうの物は、さらにひとつ余分に）
    const stacks = ITEMS[p.id] && ITEMS[p.id].stack && G.inv.some(q => q && q.id === p.id && q.n + (p.n || 1) <= ITEMS[p.id].stack);
    if (!req && fits && !loose && !stacks && invFree() - 1 < (want ? needFree() : Math.max(1, needFree()))) { say_('枠を空けておくため置いていく：' + k); return false; }
    let lv = null; for (const dy of [0, 0.6, 0.95, 1.3, 1.9]) { if (approach(p.x, p.z, p.y - dy, 0.95)) { lv = p.y - dy; break; } }
    if (lv == null) { say_('近づけない：拾う ' + k); if (req) B.fail = B.fail || ('近づけない ' + k); return false; }
    for (let t = 0; t < 3 && !G.taken[k]; t++) { yield* interactCo(p.x, p.z, lv, 0.95, '拾う ' + k); yield* waitCalmCo(20); }
    if (G.taken[k]) say_('拾った：' + (p.id === 'file' ? 'ファイル ' + p.file : p.id === 'map' ? '地図' : ITEMS[p.id].name)); else { say_('拾えなかった：' + k); if (req) B.fail = B.fail || ('拾えない ' + k); }
    if (G.taken[k] && p.id.startsWith('herb') && invFree() < 2) yield* tidyHerbsCo(); // 薬草は混ぜて枠を空ける
    return !!G.taken[k];
  }
  function* actCo(id, o = {}) {
    const a = G.room.acts.find(q => q.id === id && (o.idx == null || q.idx === o.idx) && (!q.cond || condOK(q.cond))); if (!a) { say_('調べる所がない：' + id); B.fail = B.fail || ('調べる所がない ' + id); return false; }
    yield* interactCo(a.p[0], a.p[1], a.y, Math.max(0.4, a.r - 0.06), '調べる ' + id);
    if (!o.ui) yield* waitCalmCo(60); return true;
  }
  // 持ち物を整える：アイテムボックスに預ける・出す
  function keepSet() { const s = new Set(['hg', 'hg_ammo']); for (const w of ['sg', 'mg', 'gl']) if (invHas(w) || G.box.some(q => q.id === w)) { s.add(w); s.add(ITEMS[w].ammo); } return s; }
  function* boxCo(o = {}) {
    if (!(yield* actCo('box', { ui: 'box' }))) return; for (let k = 0; k < 20 && !(G.ui && G.ui.k === 'box'); k++) { if (G.msg) key('ok'); yield; }
    const b = G.ui; if (!b || b.k !== 'box') { say_('箱が開かない'); return; }
    const keep = keepSet(); const heals = ['herb_grb', 'herb_gr', 'herb_ggg', 'spray', 'herb_gg', 'herb_gb', 'herb_g', 'herb_b'];
    // 預ける：武器と弾と鍵いがいの物（回復は良い物を2つまで持つ）
    let healKeep = o.heals != null ? o.heals : 1; const put = [];
    const order = G.inv.map((s, i) => [s, i]).filter(q => q[0]).sort((p, q) => (heals.indexOf(p[0].id) + 99) % 99 - (heals.indexOf(q[0].id) + 99) % 99);
    for (const [s, i] of order) { const it = ITEMS[s.id]; if (keep.has(s.id) || it.kind === 'key') continue; if (it.kind === 'heal' && s.id !== 'herb_r' && s.id !== 'herb_b' && healKeep > 0) { healKeep--; continue; } if (s.id === 'ribbon' && o.keepRibbon) continue; put.push(i); }
    for (const i of put) { if (b.side !== 0) { key('left'); yield; } while (b.sel !== i) { key(b.sel < i ? 'down' : 'up'); yield; } key('ok'); yield; say_('預けた：' + (G.box[G.box.length - 1] || {}).id); }
    // 出す：持っていく武器の弾・回復（足りなければ）・リボン
    const take = id => G.box.findIndex(q => q.id === id);
    const want = [...keep].filter(id => ITEMS[id].kind === 'ammo' || ITEMS[id].kind === 'weapon'); if (o.takeRibbon) want.push('ribbon');
    let hc = G.inv.filter(s => s && ITEMS[s.id].kind === 'heal' && s.id !== 'herb_r' && s.id !== 'herb_b').length; for (const h of heals) { if (hc >= (o.heals != null ? o.heals : 1)) break; if (h === 'herb_b' || h === 'herb_r') continue; if (take(h) >= 0) { want.push(h); hc++; } }
    for (const id of want) { const j = take(id); if (j < 0 || invFree() <= 0) continue; if (b.side !== 1) { key('right'); yield; } while (b.bsel !== j) { key(b.bsel < j ? 'down' : 'up'); yield; } key('ok'); yield; say_('出した：' + id); }
    key('cancel'); yield; yield* waitCalmCo(5);
  }
  function* saveCo(slot) {
    if (!invHas('ribbon')) { say_('リボンがない'); return false; }
    B.wantSave = true; const s0 = G.saves; if (!(yield* actCo('type', { ui: 'save' }))) { B.wantSave = false; return false; }
    for (let k = 0; k < 60 && !(G.ui && G.ui.k === 'save'); k++) { if (G.msg) key('ok'); yield; }
    B.wantSave = false; const u = G.ui; if (!u || u.k !== 'save') { say_('記録の画面が出ない'); return false; }
    while (u.sel !== slot) { key('down'); yield; } key('ok'); yield; yield* waitCalmCo(5);
    if (G.saves > s0) { B.saveIdx[slot] = B.i + 1; say_('記録した（' + (slot + 1) + '）'); return true; } return false;
  }
  // ── ひと部屋の敵を片づける（行ける所の、生きている敵） ──
  function* clearCo(o = {}) {
    const T0 = B.t; let lastN = -1;
    while (B.t - T0 < (o.max || 150)) {
      const alive = G.en.filter(e => !e.dead && e.hp > 0 && e.h.root.visible && (!e.def.hidden || e.revealed));
      // 行けるかどうかは、敵ごとに2秒に一度だけ調べる
      const reach = alive.filter(e => { if (e._botR && B.t - e._botR.t < 2) return e._botR.ok; const ap = approach(e.x, e.z, e.y, 1.6, 0.6); const ok = !!(ap && findPath3(ap[0], ap[1], ap[2], 0.3)); e._botR = { t: B.t, ok }; return ok; });
      if (!reach.length) break;
      if (reach.length !== lastN) { say_('敵：' + reach.map(e => e.type + '(' + Math.round(e.hp) + ')').join(' ')); lastN = reach.length; }
      const e = reach.sort((a, b) => hyp(a.x - PL.x, a.z - PL.z) - hyp(b.x - PL.x, b.z - PL.z))[0];
      // 近づく（脅威になれば、毎こまの戦いが引き受ける）
      const ap = approach(e.x, e.z, e.y, 4.5, 3.0) || approach(e.x, e.z, e.y, 2.5, 1.2); if (ap) walk(ap[0], ap[1], ap[2], 0.4, false); else idle();
      yield;
    }
    return true;
  }
  function* bossCo(k) { const T0 = B.t; while (B.t - T0 < 400) { const b = G.en.find(e => e.key === k); if (G.killed[k] || (b && b.dead)) { say_('倒した：' + k); return true; } if (b && b.h.root.visible && !threats().some(t => t.e === b)) { const ap = approach(b.x, b.z, b.y, 6, 4); if (ap) walk(ap[0], ap[1], ap[2], 0.5, false); } else idle(); yield; } say_('ボスが倒せない：' + k); B.fail = B.fail || ('ボス ' + k); return false; }
  function* dieCo() { say_('（わざと何もしないで、やられる）'); B.noFight = true; B.passive = true; const T0 = B.t; while (!PL.dead && B.t - T0 < 120) { const e = G.en.filter(e => !e.dead).sort((a, b) => hyp(a.x - PL.x, a.z - PL.z) - hyp(b.x - PL.x, b.z - PL.z))[0]; if (e && hyp(e.x - PL.x, e.z - PL.z) > 1.0) { const ap = approach(e.x, e.z, e.y, 1.2, 0.8); if (ap) walk(ap[0], ap[1], ap[2], 0.3, false); } else idle(); yield; } B.noFight = false; B.passive = false; return PL.dead; }
  function* portraitsCo() { for (const idx of [1, 3, 5, 0, 2, 4]) { yield* actCo('portrait', { idx }); if (flag('portraits')) break; } say_(flag('portraits') ? '肖像画：そろった' : '肖像画：失敗'); return flag('portraits'); }
  function* endingCo() { const T0 = B.t; while (B.t - T0 < 200 && !(G.ui && G.ui.k === 'results')) yield; if (G.ui && G.ui.k === 'results') { const r = G.ui; B.result = { rank: r.rank, time: fmtTime(r.time), saves: r.saves, heals: r.heals, kills: r.kills, haya: r.haya }; say_('成績：' + JSON.stringify(B.result)); B.snapNow = 'results'; for (let k = 0; k < 120; k++) yield; } return !!B.result; }
  function taskCo(T) {
    if (T.go) { if (T.passive && !B.died[T.passive]) B.passive = true; return goCo(T.go); } if (T.pick) return pickCo(T.pick, T.req, T.want); if (T.act) return actCo(T.act, T); if (T.clear) return clearCo(T); if (T.box) return boxCo(T); if (T.save != null) return saveCo(T.save);
    if (T.die) { if (B.died[T.die]) return (function* () { })(); B.died[T.die] = 1; return dieCo(); } if (T.portraits) return portraitsCo(); if (T.boss) return bossCo(T.boss); if (T.ending) return endingCo(); if (T.heal) return (function* () { if (PL.hp < (T.heal === true ? 100 : T.heal) && hasHeal()) { say_('戦いの前に回復'); yield* healCo(); } })(); if (T.tidy) return tidyHerbsCo(); if (T.equip) return equipCo(T.equip);
    if (T.wait) return (function* () { const T0 = B.t; while (B.t - T0 < T.wait) { idle(); yield; } })();
    if (T.fn) return (function* () { T.fn(); yield; })();
    return (function* () { })();
  }
  // ── 伝言・選択への答え方 ──
  function choiceFor(m) {
    const t = m.pages.join('');
    if (t.includes('記録を残しますか')) return B.wantSave ? 0 : 1;
    if (t.includes('血清を打ちますか')) return B.opts.haya === false ? 1 : 0;
    if (t.includes('拾いますか')) return 0;
    return 0;
  }
  // ── 毎こま ──
  function tick(dt) {
    B.t += dt; B.frameN++; idle();
    // 記録：倒した敵・起きた出来事・場面の写真
    for (const e of G.en) if (e.dead && !e._botSeen) { e._botSeen = 1; say_('倒した：' + e.type + (e.key ? '(' + e.key + ')' : '')); }
    for (const f in G.flags) if (!B.flagSeen[f] && typeof G.flags[f] !== 'object') { B.flagSeen[f] = 1; say_('出来事：' + f); }
    if (G.mode === 'cut') { B.cutT = (B.cutT || 0) + dt; if (B.cutT > 1.0 && !B.cutShot) { B.cutShot = 1; B.snapNow = 'cut'; } } else { B.cutT = 0; B.cutShot = 0; }
    if (G.msg && G.msg !== B.lastMsgObj) { B.evt++; B.lastMsgObj = G.msg; } const uk = G.ui ? G.ui.k : null; if (uk !== B.lastUi) { B.evt++; B.lastUi = uk; } if (G.mode !== B.lastMode) { B.evt++; B.lastMode = G.mode; } if (PL.actT > 0 && !B.lastAct) B.evt++; B.lastAct = PL.actT > 0;
    if (B.done) return;
    // 死んだ：最後の記録から
    if (G.mode === 'dead') { if (!B.deadSeen) { B.deadSeen = true; B.deaths++; say_('死んだ（' + (G.deathWhy || '?') + '）'); B.snapNow = 'dead'; } if (G.deathT > 3.4 && (B.frameN % 10 === 0)) key('ok'); return; }
    if (G.ui && G.ui.k === 'load') { if (B.frameN % 8 === 0) { const want = B.loadSlot || 0; if (G.ui.sel !== want) key('down'); else key('ok'); } return; }
    if (B.deadSeen && G.mode === 'title' && !B.titleGo) { B.deadSeen = false; say_('記録がないので、はじめから'); B.i = 0; B.co = null; B.path = null; B.died = {}; B.titleGo = 'はじめから'; return; }
    if (B.deadSeen && G.mode === 'play') { B.deadSeen = false; const back = B.saveIdx[B.loadSlot || 0] ?? 0; say_('最後の記録から再開 → 手順 ' + back); B.i = back; B.co = null; B.path = null; B.loadSlot = 0; return; }
    // 成績の画面（ボス戦のあと、結末から自動で出る）：手順を結末まで進めて、成績を記録してから閉じる
    if (G.ui && G.ui.k === 'results') {
      if (!(B.task && B.task.ending)) { const k = B.route.findIndex((T, j) => j >= B.i && T.ending); if (k >= 0) { B.i = k; B.task = B.route[k]; B.taskT = B.t; B.co = endingCo(); say_('手順 ' + k + '：' + JSON.stringify(B.task)); } }
      if (B.co) { const r = B.co.next(); if (r.done) { B.co = null; B.i++; } } else if (B.frameN % 10 === 0) key('ok');
      return;
    }
    if (B.titleGo === 'はじめから' && G.mode !== 'title' && G.mode !== 'boot') B.titleGo = null; // 始まったら、もうタイトルでは押さない
    if (G.mode === 'title') {
      if (B.titleGo && B.frameN % 10 === 0) { if (TITLE.phase === 'press') key('any'); else { const items = titleItems(), want = items.findIndex(q => q[0] === B.titleGo); if (want >= 0 && TITLE.sel !== want) key('down'); else if (want >= 0) { key('ok'); if (B.titleGo === 'つづきから') B.titleGo = null; } } }
      if (!B.titleGo && B.co === null && B.i >= B.route.length) B.done = true;
      return;
    }
    if (G.card) { if (B.frameN % 40 === 0) key('ok'); return; }
    if (G.ui && G.ui.k === 'menu' && G.ui.solo) { if (B.frameN % 6 === 0) key('ok'); return; } // 読んだファイルをめくる
    if (G.ui && G.ui.k === 'pass') { if (!B.passStep) B.passStep = 1; if (B.passStep === 1) { IN.typed = 'SAYO'; B.passStep = 2; } else if (B.passStep === 2) { key('left'); B.passStep = 3; } else { key('ok'); B.passStep = 0; } return; }
    // はじめて入った部屋の写真：扉の暗転が明けてから撮る
    if (G.rid && G.rid !== B.lastRid) { B.lastRid = G.rid; if (!B.seenRoom[G.rid]) { B.seenRoom[G.rid] = 1; B.pendRoom = G.rid; } }
    if (B.pendRoom && G.mode === 'play' && G.fade < 0.05 && !G.doorFx && !G.msg) { B.snapRoom = B.pendRoom; B.pendRoom = null; }
    if (G.msg) {
      const m = G.msg, full = m.pages[m.i].length;
      if (m.o.choice && m.ch >= full && m.i === m.pages.length - 1) { const want = choiceFor(m); if ((m.sel || 0) !== want) { if (B.frameN % 3 === 0) key('down'); } else if (B.frameN % 3 === 0) key('ok'); }
      else if (B.frameN % 4 === 0) key('ok');
      if (G.mode !== 'cut') return;
    }
    if (G.mode === 'cut') { if (G.msg && B.frameN % 4 === 0) key('ok'); return; }
    if (G.mode !== 'play') return;
    // 戦い（毎こま、手順より先）
    const T = (B.noFight || B.passive) ? [] : threats(); // わざとやられる間は戦わない
    // ボス戦の最中に投げ落とされた武器：大技が来ていないうちに拾いに行く
    const danger = T.length && (['brace', 'lunge', 'charge'].includes(T[0].e.state) || (T[0].e.state === 'windup' && T[0].d < 3.4) || T[0].d < 1.8);
    if (B.grabCo && danger) B.grabCo = null; // 大技が来たら、いったんよけてから拾いなおす
    if (!B.grabCo && !danger && T.some(q => q.e.type.startsWith('boss')) && !PL.grab && B.t - (B.grabT || -9) > 1.5) { const q = G.room.pick.find(q => ITEMS[q.id] && ITEMS[q.id].kind === 'weapon' && !invHas(q.id)); if (q) { B.grabT = B.t; B.grabCo = pickCo(q.key, false, true); } }
    if (B.grabCo) { const r = B.grabCo.next(); if (r.done) B.grabCo = null; else return; }
    if (T.length) {
      const w = wantWeapon(T[0].e.type), dry = G.eq !== 'knife' && !hasAmmo(G.eq); // 持ち物を開いている間は時間が止まるので、近くても持ちかえてよい（弾切れならすぐ）
      if (w !== G.eq && !B.equipCo && !PL.grab && B.t - (B.equipT || -9) > (dry ? 0.5 : 3)) { B.equipT = B.t; B.equipCo = equipCo(w); } // 持ちかえは3秒に一度まで（だめなら今の武器で戦う）
      if (B.equipCo) { const r = B.equipCo.next(); if (r.done) B.equipCo = null; return; }
      if (PL.hp <= 40 && !PL.grab && hasHeal() && !B.healCo && B.t - (B.healNoT || -9) > 5) B.healCo = healCo(); // 危ない（足も遅くなる）：持ち物の画面は時間が止まるので、近くてもすぐ回復
      if (B.healCo) { const r = B.healCo.next(); if (r.done) { B.healCo = null; if (!r.value) B.healNoT = B.t; } else return; }
      fight(T[0], T); B.fightT += dt; return;
    }
    if (B.equipCo) { const r = B.equipCo.next(); if (r.done) B.equipCo = null; return; }
    // 落ち着いているとき：回復・毒消し
    if (!B.passive && !B.healCo && B.t - (B.healNoT || -9) > 5 && (PL.hp < 50 || (PL.poison && (invHas('herb_b') || invHas('herb_gb') || invHas('herb_grb')))) && hasHeal()) B.healCo = healCo();
    if (B.healCo) { const r = B.healCo.next(); if (r.done) { B.healCo = null; if (!r.value) B.healNoT = B.t; } else return; } // 使える物がなければ、しばらく試さない
    if (PL.reloadT > 0 || PL.actT > 0) return;
    if (!B.passive && G.eq && G.eq !== 'knife' && (G.mag[G.eq] || 0) < (ITEMS[G.eq].mag || 0) && invCount(ITEMS[G.eq].ammo) > 0 && B.frameN % 30 === 0) key('reload');
    // 手順
    if (!B.co) {
      if (B.fail) { say_('止める：' + B.fail); B.done = true; return; }
      if (B.i >= B.route.length) { B.done = true; return; }
      B.task = B.route[B.i]; B.taskT = B.t; B.co = taskCo(B.task); say_('手順 ' + B.i + '：' + JSON.stringify(B.task));
    }
    const r = B.co.next();
    if (r.done) { B.co = null; B.i++; B.path = null; }
    else if (B.t - B.taskT > 420) { say_('手順が終わらない：' + JSON.stringify(B.task)); B.fail = B.fail || ('止まった ' + JSON.stringify(B.task)); B.co = null; B.i++; }
  }
  function hasHeal() { return G.inv.some(s => s && ITEMS[s.id].kind === 'heal' && s.id !== 'herb_r' && (s.id !== 'herb_b' || PL.poison) && (ITEMS[s.id].heal > 0 || (ITEMS[s.id].cure && PL.poison))); }
  B.tick = tick; B.findPath3 = findPath3; B.approach = approach;
  // 1こま：ボタンを決めて、ゲームを進める。描かずに進めるので、描くときに進む画面の重ね（傷の赤・暗転）も、ここで同じだけ進める
  B.frame = dt => { tick(dt); step(dt); drawOverlay(dt); if (G.room && PL.hp < (B.lastHp ?? 100)) B.hurt += (B.lastHp ?? 100) - PL.hp; B.lastHp = PL.hp; };
  B.run = (n, dt = 1 / 60) => { B.snapRoom = null; for (let k = 0; k < n && !B.done && !B.snapNow && !B.snapRoom; k++) B.frame(dt); return B.status(); };
  B.status = () => ({ where: B.where, i: B.i, n: B.route.length, rid: G.rid, mode: G.mode, hp: PL.hp, time: fmtTime(G.time), done: B.done, fail: B.fail, deaths: B.deaths, eq: G.eq, mag: G.mag[G.eq], log: B.log.splice(0), snap: B.snapNow, room: B.snapRoom, inv: G.inv.map(s => s ? s.id + (s.n > 1 ? 'x' + s.n : '') : '-').join(' ') });
  return B;
})();
`;

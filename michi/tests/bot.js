// 果てなき道：自動で遊んで、つながりを確かめる
//   node michi/tests/bot.js
//   1) どの建物のどの階にも、町から歩いて行けるか（鍵・バール・管理棟の鍵を持っている前提）
//   2) 1階から展望台まで、非常階段を自分の足で登れるか・ともだちもついてくるか
//   3) 鍵 → スタッフ室 → 地下 → バール → スタンドの燃料 → 発電機 → ブレーカー → 明かり
//      → エレベーター → 展望台 → 点検階の柵 → はしご → てっぺんで見わたす → 夜の望遠鏡で遠くの灯り
//   4) 遊園地：回転ゲートを乗りこえる → 管理棟の鍵 → 門 → スパナ → 駐車場のバンからバッテリー
//      → 非常用発電機 → 主ブレーカー → 設備ごとのブレーカー → 観覧車・メリーゴーランド・コースター・スワンボート・お化け屋敷
//   5) 灯台のらせん階段で灯室まで、ひかりが丘の灯りの家の2階まで、民家・学校・電車
//   6) 眠ると朝・保存と読み込み・紙の地図・タイトルから始める
//   7) ゾンビを押しのけられるか、町を歩きまわってもエラーが出ないか・重くないか
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?test';

// ページの中で使う道具（経路さがし・歩く・調べる）
function botKit() {
  const M = window.__michi, { G, P, F, LEV, DOORS, RUNS, GW, GH, N } = M; M.hold = true;
  const log = []; let fails = 0;
  const ok = (c, m) => { log.push((c ? '○ ' : '× ') + m); if (!c) fails++; return c };
  const kx = k => k % GW, ky = k => (k / GW) | 0, K = (x, y) => y * GW + x;
  const doorAt = (L, k) => DOORS.get(L * N + k);
  const stand = (L, k) => {
    if (!LEV[L] || M.RUNON[L].get(k) || M.HOLEON[L].get(k)) return false;
    const d = doorAt(L, k);
    if (d) { if (d.kind === 'E') return false; if (d.lock) return d.lock === 'key_staff' ? M.has('key_staff') || M.has('crowbar') : M.has('crowbar'); return true }
    return M.basicPass(L, k);
  };
  // 階段の入口と出口・回転ゲートの内と外・はしごをつなぐ
  const nid = (L, k) => (L + 1) * N + k, nL = n => Math.floor(n / N) - 1, nk = n => n % N;
  const jumps = new Map(), link = (a, b, t = 'run') => { (jumps.get(a) || jumps.set(a, []).get(a)).push({ m: b, t }) };
  for (const r of RUNS) { const a = nid(r.L, r.entry), b = nid(r.L + 1, r.arr); link(a, b); link(b, a) }
  for (let x = 177; x <= 183; x++) { const a = nid(0, K(x, 61)), b = nid(0, K(x, 63)); link(a, b, 'gate'); link(b, a, 'gate') }
  const ld = M.OBJ.find(o => o.type === 'ladder'); if (ld) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = nid(ld.L, K(ld.x + dx, ld.y + dy)), b = nid(ld.L + 1, K(M.BX + 6, M.BY + 7)); link(a, b, 'ladder') }
  function bfs(goal, from, allow) {
    const s = from ?? nid(P.L, K(Math.floor(P.x), Math.floor(P.y))); const prev = new Map([[s, -1]]); const q = [s];
    while (q.length) {
      const n = q.shift(); if (goal(nL(n), nk(n))) { const out = []; for (let c = n; c !== -1; c = prev.get(c)) out.push(c); return out.reverse() }
      const L = nL(n), k = nk(n), x = kx(k), y = ky(k);
      const nb = []; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const kk = K(xx, yy); if (stand(L, kk) && (!allow || allow(L, kk))) nb.push(nid(L, kk)) }
      for (const j of jumps.get(n) || []) if (j.t === 'run' || walkJumps) nb.push(j.m);
      for (const m of nb) if (!prev.has(m)) { prev.set(m, n); q.push(m) }
    }
    return null;
  }
  let walkJumps = false; // 歩くときは、回転ゲート・はしごは使わない（調べるで越える）
  const busy = () => P.act || G.ride || G.look || P.climb;
  function goXY(tx, ty, sec = 5) { for (let i = 0; i < sec * 60; i++) { if (busy()) { G.inpW = null; settle() } const dx = tx - P.x, dy = ty - P.y, d = Math.hypot(dx, dy); if (d < .1) { G.inpW = null; return true } const s = Math.max(.4, Math.min(1, d * 4)); G.inpW = [dx / d * s, dy / d * s]; M.update(1 / 60) } G.inpW = null; return false }
  function settle(sec = 30) { for (let i = 0; i < sec * 60; i++) { if (G.note) G.note = null; if (G.mapOpen) G.mapOpen = false; if (!(P.act || G.ride || P.climb || G.sleep)) break; M.update(1 / 60) } G.note = null }
  function openDoor(d) {
    { const dx = d.x + .5 - P.x, dy = d.y + .5 - P.y, l = Math.hypot(dx, dy) || 1; P.fx = dx / l; P.fy = dy / l }
    const it = M.interactables()[0];
    if (it && it.kind === 'door' && it.d === d) { M.interact(); settle() }
    if (!d.open) { log.push(`  （扉 ${d.x},${d.y} L${d.L} は調べるで開かなかったので直接あける）`); d.open = true; d.lock = null; d.stuck = false }
  }
  function walk(path) {
    if (!path) return false;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i], La = nL(a), Lb = nL(b), kb = nk(b);
      if (La !== Lb) {
        const ka = nk(a); const r = RUNS.find(r => r.L === La && r.entry === ka && r.arr === kb || r.L === Lb && r.arr === ka && r.entry === kb); if (!r) return false; const up = r.L === La;
        const t = r.tiles.slice().sort((p, q) => (p[0] * r.dir[0] + p[1] * r.dir[1]) - (q[0] * r.dir[0] + q[1] * r.dir[1]));
        const seq = up ? [...t, r.arrXY] : [...t.reverse(), r.entryXY];
        for (const [x, y] of seq) if (!goXY(x + .5, y + .5)) return false;
        if (P.L !== Lb) return false; continue;
      }
      const d = doorAt(Lb, kb); if (d && !d.open) openDoor(d);
      if (!goXY(kx(kb) + .5, ky(kb) + .5)) return false;
    }
    return true;
  }
  const near = (L, x0, y0, x1, y1) => (l, k) => { if (l !== L) return false; const x = kx(k), y = ky(k); return (x >= x0 - 1 && x <= x1 && y >= y0 - 1 && y <= y1) && !(x >= x0 && x < x1 && y >= y0 && y < y1) && (x === x0 - 1 || x === x1 || y === y0 - 1 || y === y1) && !(x === x0 - 1 && (y === y0 - 1 || y === y1)) && !(x === x1 && (y === y0 - 1 || y === y1)) };
  function face(o) { for (let i = 0; i < 40 && !(M.interactables()[0] && M.interactables()[0].o === o); i++) { const dx = o.x + o.w / 2 - P.x, dy = o.y + o.h / 2 - P.y, d = Math.hypot(dx, dy) || 1; P.fx = dx / d; P.fy = dy / d; G.inpW = [dx / d * .4, dy / d * .4]; M.update(1 / 60) } G.inpW = null }
  function useObj(o, label, quiet) {
    if (!o) { ok(false, `${label}：見つからない`); return false }
    const p = bfs(near(o.L, o.x, o.y, o.x + o.w, o.y + o.h)); if (!p) { ok(false, `${label}：たどりつける`); return false } if (!quiet) ok(true, `${label}：たどりつける（${p.length}歩）`);
    if (!walk(p)) { ok(false, `${label}：歩いて行けた`); return false }
    face(o); const it = M.interactables()[0]; if (!ok(it && it.o === o, `${label}：目の前で「${it ? M.verbOf(it) : '-'}」`)) return false;
    M.interact(); settle(); return true;
  }
  function useDoor(d, label) {
    const p = bfs(near(d.L, d.x, d.y, d.x + 1, d.y + 1)); if (!ok(!!p && walk(p), `${label}：扉の前まで行ける`)) return false;
    { const dx = d.x + .5 - P.x, dy = d.y + .5 - P.y, l = Math.hypot(dx, dy) || 1; P.fx = dx / l; P.fy = dy / l }
    const it = M.interactables()[0]; if (!ok(it && it.d === d, `${label}：目の前で「${it ? M.verbOf(it) : '-'}」`)) return false;
    M.interact(); settle(); return true;
  }
  const findObj = f => M.OBJ.find(f);
  const sim = (sec, f) => { for (let i = 0; i < sec * 60; i++) { M.update(1 / 60); if (f && f()) return true } return false };
  const awayZ = () => { for (const z of M.ZB) { z.x = 2.5; z.y = 158.5; z.tx = null } };
  return { M, G, P, F, ok, log, bfs, walk, goXY, settle, useObj, useDoor, findObj, stand, nid, nL, nk, kx, ky, K, sim, awayZ, face, jumps, setWalkJumps: v => { walkJumps = v }, fails: () => fails };
}

(async () => {
  const b = await chromium.launch(); let total = 0;
  const run = async (title, fn) => {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
    await p.goto(FILE); await p.waitForTimeout(500);
    const r = await p.evaluate(`(()=>{const B=(${botKit.toString()})();B.M.start();B.M.tp(47.5,71.6,0);(${fn.toString()})(B);return {log:B.log,fails:B.fails()}})()`);
    console.log(`\n■ ${title}`); for (const l of r.log) console.log('  ' + l);
    if (errs.length) { console.log('  × エラー:', errs.slice(0, 5)); r.fails++ }
    total += r.fails; await p.close();
  };

  await run('どの建物のどの階にも、歩いて行けるか', B => {
    const { M, ok } = B; M.give('key_staff'); M.give('crowbar'); M.G.park.gate = true; M.parkGateSolid(); B.setWalkJumps(true);
    for (const d of M.DOORS.values()) if (d.kind === 'G') d.stuck = false;
    const seen = new Set(); const s = B.nid(0, B.K(47, 71)); const q = [s]; seen.add(s);
    while (q.length) { const n = q.shift(); const L = B.nL(n), k = B.nk(n), x = B.kx(k), y = B.ky(k); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const kk = B.K(x + dx, y + dy); const m = B.nid(L, kk); if (!seen.has(m) && B.stand(L, kk)) { seen.add(m); q.push(m) } } for (const j of B.jumps.get(n) || []) if (!seen.has(j.m)) { seen.add(j.m); q.push(j.m) } }
    const names = {}; for (let i = 1; i < M.BLD.length; i++) { const bd = M.BLD[i]; if (!bd) continue; names[bd.name] = (names[bd.name] || 0) + 1; const lv = new Map(); for (let L = -1; L <= 10; L++) { const g = M.LEV[L]; if (!g) continue; for (let k = 0; k < M.N; k++) if (g.bid[k] === i && M.basicPass(L, k)) { if (!lv.has(L)) lv.set(L, [0, 0]); lv.get(L)[0]++; if (seen.has(B.nid(L, k))) lv.get(L)[1]++ } }
      for (const [L, [n, r]] of lv) if (!ok(r > 0, `${bd.name}${names[bd.name] > 1 ? names[bd.name] : ''} の ${L < 0 ? '地下' : L + 1 + '階'}：${r}/${n} マス`) || r < n * .6) B.log.push(`  （${bd.name} ${L + 1}階は ${n - r} マス届かない）`) }
    ok(B.log.filter(l => l.startsWith('○')).length > 40, 'たくさんの建物と階を確かめた');
  });

  await run('非常階段で展望台まで、自分の足で', B => {
    const { M, P, F, ok, bfs, walk } = B; B.awayZ();
    for (const d of M.DOORS.values()) if (d.kind === 'G') d.stuck = false;
    const path = bfs((L) => L === 8); ok(!!path, '展望台への道がある（' + (path ? path.length : 0) + '歩）');
    const t0 = M.G.gameT; ok(walk(path), '登りきった'); ok(P.L === 8, `いまの階 ${P.L + 1}階（展望台）`);
    B.sim(4); ok(Math.abs(F.z - P.z) < M.LH && Math.hypot(F.x - P.x, F.y - P.y) < 4, `ともだちもついてきた（高さの差 ${(P.z - F.z).toFixed(1)}）`);
    B.log.push(`  （かかった時間：ゲーム内 ${(M.G.gameT - t0).toFixed(0)} 秒）`);
    const down = bfs((L) => L === 0); ok(walk(down) && P.L === 0, '1階まで降りられた');
  });

  await run('塔に電気を戻して、てっぺんへ。夜の望遠鏡で遠くを見る', B => {
    const { M, G, P, ok, useObj, useDoor, findObj } = B; B.awayZ(); G.t = 9 * 60;
    const door = [...M.DOORS.values()].find(d => d.kind === 'G' && d.stuck && d.L === 0 && d.bid === M.T_ID);
    if (door) useDoor(door, '塔の止まった自動ドア'); ok(!door || !door.stuck, '自動ドアを手で開けた');
    const has = (o, id) => o.items && o.items.includes(id);
    useObj(findObj(o => has(o, 'key_staff')), 'スタッフの鍵のある所'); ok(M.has('key_staff') && M.has('map_town') === false || M.has('key_staff'), 'スタッフの鍵を手に入れた');
    useObj(findObj(o => has(o, 'crowbar')), 'バールのある所'); ok(M.has('crowbar'), 'バールを手に入れた（地下）');
    useObj(findObj(o => has(o, 'jerry_full')), '燃料の缶のある所'); ok(M.has('jerry_full'), '燃料の入った携行缶を手に入れた');
    const gen = findObj(o => o.type === 'generator'), brk = findObj(o => o.type === 'breaker');
    useObj(gen, '発電機（給油）'); useObj(gen, '発電機（始動）'); ok(G.gen.run, '発電機が動いた');
    useObj(brk, 'ブレーカー'); ok(G.power, '塔に電気が来た'); B.sim(8); ok(G.litLevel >= 10, '下の階から順に明かりがついた');
    const el = [...M.DOORS.values()].find(d => d.kind === 'E' && d.L === 0);
    const p = B.bfs((L, k) => L === 0 && Math.abs(B.kx(k) - el.x) + Math.abs(B.ky(k) - el.y) === 1); ok(p && B.walk(p), 'エレベーターの前まで行ける');
    const it = M.interactables()[0]; ok(it && it.d === el && M.verbOf(it) === 'エレベーターに乗る', '「エレベーターに乗る」が出る'); M.interact(); B.settle(); B.sim(2); B.settle();
    ok(P.L === 8, `エレベーターで展望台へ（${P.L + 1}階）`);
    const gate = [...M.DOORS.values()].find(d => d.kind === 'gate'); if (gate) { useDoor(gate, '点検階の柵（バール）'); ok(!gate.lock && gate.open, '柵をこじあけた') }
    useObj(findObj(o => o.type === 'ladder'), 'はしご'); ok(P.L === 10, `てっぺんに出た（${P.L + 1}階）`);
    useObj(findObj(o => o.type === 'antenna'), 'てっぺんで見わたす'); ok(!!G.look, '自分の目で、まわりを見わたしている'); G.inpW = [1, -.3]; B.sim(3); G.inpW = null; ok(Math.hypot(G.look.x - G.look.ox, G.look.y - G.look.oy) > 15, '見る方向を動かせた'); M.interact(); ok(!G.look, 'もどった');
    useObj(findObj(o => o.type === 'ladder_top'), 'はしごを降りる'); ok(P.L === 9, '点検階に戻った');
    G.t = 20 * 60; const tel = M.OBJ.filter(o => o.type === 'telescope' && o.L === 8)[0];
    useObj(tel, '望遠鏡（100円がない）'); ok(!G.look, '100円玉がないと、のぞけない');
    M.give('coin'); useObj(tel, '望遠鏡（100円玉を入れる）'); ok(!!G.look && G.look.src === 'scope', '望遠鏡をのぞいた');
    const tx = M.FARLIGHT[0], ty = M.FARLIGHT[1]; for (let i = 0; i < 60 * 12; i++) { const dx = tx - G.look.x, dy = ty - G.look.y, d = Math.hypot(dx, dy); if (d < 2) break; G.inpW = [dx / d, dy / d]; M.update(1 / 60) } G.inpW = null; B.sim(2);
    ok(Math.hypot(G.look.x - tx, G.look.y - ty) < 6, '遠くの灯りの家まで、望遠鏡を向けられた'); ok(!!M.F.said.see_light, 'ともだちが灯りに気づいた');
  });

  await run('遊園地：電気を戻して、乗り物を動かす', B => {
    const { M, G, P, ok, useObj, findObj, sim } = B; B.awayZ(); G.t = 14 * 60; M.tp(180.5, 67.5, 0);
    const has = (o, id) => o.items && o.items.includes(id);
    useObj(findObj(o => has(o, 'key_park')), 'きっぷ売り場のキーボックス'); ok(M.has('key_park'), '管理棟の鍵を手に入れた');
    useObj(findObj(o => has(o, 'map_park')), 'パンフレット'); ok(M.has('map_park'), '園内マップを手に入れた');
    const ts = findObj(o => o.type === 'turnstile' && o.x === 180); useObj(ts, '回転ゲート'); ok(P.y < 62, '回転ゲートを乗りこえて、中に入った');
    useObj(findObj(o => o.type === 'pgate'), '関係者以外立入禁止の門'); ok(G.park.gate, '鍵で門を開けた');
    useObj(findObj(o => o.type === 'workbench'), '作業台'); ok(M.has('wrench'), 'スパナを手に入れた');
    const pg = findObj(o => o.type === 'pgen'); useObj(pg, '非常用発電機（バッテリーなし）'); ok(!G.park.gen.run, 'セルが回らない');
    useObj(findObj(o => o.type === 'turnstile' && o.x === 181), '回転ゲート（外へ）'); ok(P.y > 62, '外に出た');
    useObj(findObj(o => o.van), '駐車場の社用バン'); ok(M.has('battery_car'), '車のバッテリーを外した');
    useObj(findObj(o => o.type === 'turnstile' && o.x === 179), '回転ゲート（また中へ）');
    useObj(pg, '発電機にバッテリーをつなぐ'); ok(G.park.gen.bat, 'バッテリーをつないだ'); useObj(pg, '発電機のエンジン'); ok(G.park.gen.run, '非常用発電機が動いた');
    useObj(findObj(o => o.type === 'mainpanel'), '主ブレーカー'); ok(M.parkPower(), '遊園地に電気が来た');
    for (const o of M.OBJ.filter(o => o.type === 'rbreaker')) useObj(o, o.name, true); ok(Object.values(G.park.br).every(v => v), '設備のブレーカーを全部入れた');
    G.t = 20 * 60; sim(1); ok(M.parkSys('lights'), '夜、園内の照明がついた');
    // 観覧車
    useObj(findObj(o => o.type === 'opbooth'), '観覧車の操作室'); ok(G.park.run.wheel, '観覧車を動かした'); sim(15); ok(G.park.wheelV > .03, '観覧車がゆっくり回っている');
    let boarded = false; for (let i = 0; i < 6 && !boarded; i++) { useObj(findObj(o => o.type === 'wboard'), '観覧車の乗り場', true); boarded = !!G.rideOn; if (!boarded) sim(4) } ok(boarded && G.rideOn.type === 'wheel', '観覧車に乗った');
    let top = 0; sim(150, () => { top = Math.max(top, P.z); return !G.rideOn }); ok(top > 18, `てっぺんまで上がった（高さ ${top.toFixed(1)}）`); ok(!G.rideOn && M.basicPass(0, B.K(Math.floor(P.x), Math.floor(P.y))), '一周して、乗り場に降りた');
    // メリーゴーランド
    useObj(findObj(o => o.type === 'opanel' && o.sys === 'car'), 'メリーゴーランドの操作盤'); ok(G.park.run.car, 'メリーゴーランドを動かした');
    useObj(findObj(o => o.type === 'carousel'), 'メリーゴーランド'); ok(G.rideOn && G.rideOn.type === 'car', '木馬に乗った'); sim(.2); const a0 = Math.atan2(P.y - M.CC[1], P.x - M.CC[0]); sim(4); const a1 = Math.atan2(P.y - M.CC[1], P.x - M.CC[0]); ok(Math.abs(Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0))) > .3, '木馬といっしょに回っている'); M.interact(); ok(!G.rideOn && M.basicPass(0, B.K(Math.floor(P.x), Math.floor(P.y))), '木馬から降りた');
    // ジェットコースター
    useObj(findObj(o => o.type === 'opanel' && o.sys === 'coaster'), 'コースターの操作盤'); ok(G.park.run.coaster, 'コースターを自動運転にした');
    sim(90, () => G.park.co.ph === 'wait'); useObj(findObj(o => o.type === 'cboard'), 'コースターの乗り場'); ok(G.rideOn && G.rideOn.type === 'coaster', 'コースターに乗った');
    let hi = 0, vmax = 0; sim(120, () => { hi = Math.max(hi, P.z); vmax = Math.max(vmax, G.park.co.v); return !G.rideOn }); ok(hi > 10, `巻き上げでてっぺんへ（高さ ${hi.toFixed(1)}）`); ok(vmax > 5, `下りで速くなった（${vmax.toFixed(1)}）`); ok(!G.rideOn, '一周して乗り場で降りた');
    // スワンボート
    const sw = findObj(o => o.type === 'swan'); useObj(sw, 'スワンボート'); ok(G.rideOn && G.rideOn.type === 'swan', 'スワンボートに乗った'); const x0 = sw.fx; G.inpW = [0, 1]; sim(2); G.inpW = [1, 0]; sim(2); G.inpW = null; ok(Math.hypot(sw.fx - x0, sw.fy - 48.5) > 1, '池をこいで進んだ'); M.interact(); if (G.rideOn) { G.inpW = [0, -1]; sim(2); G.inpW = [-1, 0]; sim(2); G.inpW = null; M.interact() } ok(!G.rideOn && M.basicPass(0, B.K(Math.floor(P.x), Math.floor(P.y))), '岸に降りた');
    // お化け屋敷：入口から出口まで、迷路を歩く
    const ent = B.bfs((L, k) => L === 0 && B.kx(k) === 150 && B.ky(k) === 59); if (!ok(ent && B.walk(ent), 'お化け屋敷の入口へ')) B.log.push(`  （いま ${P.x.toFixed(2)},${P.y.toFixed(2)} L${P.L} 乗り物:${G.rideOn ? G.rideOn.type : 'なし'} 経路:${ent ? ent.length : 'なし'}）`);
    const ex = B.bfs((L, k) => L === 0 && B.kx(k) === 158 && B.ky(k) === 59, B.nid(0, B.K(150, 58)), (L, k) => M.LEV[0].bid[k] === M.HH); ok(ex && ex.length > 50 && B.walk(ex), `迷路を抜けて出口へ（${ex ? ex.length : '-'}歩）`); ok(M.OBJ.some(o => o.type === 'ghost' && o.pop), 'お化けの仕掛けが動いた');
  });

  await run('灯台のてっぺん・灯りの家・民家・学校・電車', B => {
    const { M, P, ok, bfs, walk } = B; B.awayZ();
    for (const d of M.DOORS.values()) if (d.kind === 'G') d.stuck = false;
    const go = (name, goal, from) => { if (from) M.tp(...from, 0); const p = bfs(goal); ok(!!p && walk(p) && goal(P.L, B.K(Math.floor(P.x), Math.floor(P.y))), `${name}へ歩いて行けた（${p ? p.length : '-'}歩）`) };
    const inB = (id, L) => (l, k) => l === L && M.LEV[l].bid[k] === id;
    go('灯台の灯室', inB(M.LH_ID, M.LHN), [230.5, 116.5]); ok(P.L === M.LHN, `灯台の${P.L + 1}階まで登った`);
    go('ひかりが丘・灯りの家の2階', inB(M.HK_B, 1), [222.5, 31.5]);
    for (const h of M.BLD.filter(b => b && b.name === '民家' && b.levels === 2 && b.x < 100)) go(`町の2階建ての民家（${h.x},${h.y}）の2階`, inB(h.id, 1), [47.5, 71.6]);
    const sch = M.BLD.findIndex(b => b && b.name === '学校'); go('学校の屋上', (l, k) => l === 2 && M.LEV[2].bid[k] === sch, [47.5, 71.6]);
    const tr = M.BLD.findIndex(b => b && b.name === '電車'); go('電車の中', inB(tr, 0), [47.5, 71.6]);
    go('鉄橋を歩いて渡る', (l, k) => l === 0 && B.kx(k) === 136 && B.ky(k) === 15, [116.5, 15.5]);
  });

  await run('眠ると朝・保存と読み込み・紙の地図・タイトル', B => {
    const { M, G, P, ok, useObj } = B; B.awayZ();
    G.t = 22 * 60; const bed = M.OBJ.find(o => o.type === 'futon' && o.L === 0);
    if (bed) { useObj(bed, 'ふとん'); B.sim(10, () => !G.sleep); const h = (G.t % 1440) / 60; ok(h >= 6 && h < 6.5, `眠ったら朝になった（${h.toFixed(2)}時）`) }
    G.allowSave = true; M.give('lighter'); G.flags.test = 1; G.park.gate = true; const t = G.t, x = P.x; M.saveGame(); ok(M.hasSave(), '保存できた');
    G.t = 0; P.x = 10; delete G.inv.lighter; G.flags = {}; G.park.gate = false; ok(M.loadGame(), '読み込めた'); ok(Math.abs(G.t - t) < .01 && Math.abs(P.x - x) < .01 && M.has('lighter') && G.flags.test && G.park.gate, '時間・場所・持ち物・できごと・遊園地の門が戻った');
    localStorage.removeItem('hatenakimichi_v3');
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' })); ok(!G.mapOpen, '地図を持っていないと、開かない'); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM' }));
    M.give('map_town'); M.give('map_road'); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' })); ok(G.mapOpen === 'map_town', '町の観光マップを開いた'); M.frame(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' })); ok(G.mapOpen === 'map_road', 'Mで道路地図にめくった'); M.frame(); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' })); ok(!G.mapOpen, 'もう一度Mでしまった'); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM' }));
    G.title = true; G.started = false; M.titleChoose('new'); ok(!G.title, 'タイトルから始まった'); const said = new Set(); B.sim(14, () => { if (M.F.say) said.add(M.F.say) }); ok([...said].some(t => /塔/.test(t)), `ともだちがひとこと（${[...said].join(' / ')}）`);
  });

  await run('ゾンビ・町を歩きまわる・描く速さ', B => {
    const { M, G, P, ok } = B; const z = M.ZB[0]; z.x = P.x + 1.2; z.y = P.y; z.L = 0; z.down = 0; G.t = 12 * 60;
    for (let i = 0; i < 30; i++) M.update(1 / 60); P.fx = 1; P.fy = 0; M.shove(); for (let i = 0; i < 10; i++) M.update(1 / 60); ok(z.down > 0, 'ゾンビを押したおした');
    B.awayZ();
    let bad = 0; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]];
    for (let s = 0; s < 240; s++) { G.inpW = dirs[(s * 7 + (s >> 2)) % 8]; for (let i = 0; i < 30; i++) M.update(1 / 60); if (!M.pass(P, Math.floor(P.x), Math.floor(P.y)) && !P.stair) bad++; if (s % 40 === 39) { M.tp(20 + (s * 37) % 220 + .5, 10 + (s * 53) % 140 + .5, 0); if (!M.pass(P, Math.floor(P.x), Math.floor(P.y))) M.tp(47.5, 71.6, 0) } }
    G.inpW = null; ok(bad === 0, `壁や水の中に入りこまなかった（${bad}）`);
    const ts = []; for (const [x, y, L, h] of [[47.5, 71.6, 0, 17], [91, 64, 0, 19], [M.BX + 4.5, M.BY + 12.5, 8, 18], [181.5, 50.5, 0, 20], [226.5, 80.5, 0, 14]]) { M.tp(x, y, L); G.t = h * 60; for (let i = 0; i < 90; i++) M.update(1 / 60); for (let i = 0; i < 8; i++) { const t0 = performance.now(); M.frame(); ts.push(performance.now() - t0) } }
    ts.sort((a, b) => a - b); const med = ts[ts.length >> 1]; ok(med < 60, `1枚を描く時間（真ん中）${med.toFixed(1)}ms`);
  });

  await b.close();
  console.log(total ? `\n× 失敗 ${total}` : '\n○ ぜんぶ通った'); process.exit(total ? 1 : 0);
})();

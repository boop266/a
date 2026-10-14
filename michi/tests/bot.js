// 果てなき道：自動で遊んで、つながりを確かめる
//   node michi/tests/bot.js
//   1) どの建物のどの階にも、町から歩いて行けるか（鍵・バールを持っている前提）
//   2) 1階から展望台まで、非常階段を自分の足で登れるか・ともだちもついてくるか
//   3) 鍵 → スタッフ室 → 地下 → バール → スタンドの燃料 → 発電機 → ブレーカー → 明かり
//      → エレベーター → 展望台 → 点検階の柵 → はしご → てっぺん → 夜の望遠鏡 → 遠くの灯り
//   4) 民家の2階・学校の屋上・電車の中へ歩いて行けるか、眠ると朝になるか、保存と読み込み
//   5) タイトルから始められるか、迷ったときにともだちが次の行き先を教えてくれるか
//   6) ゾンビを押しのけられるか、町を歩きまわってもエラーが出ないか・重くないか
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?test';

// ページの中で使う道具（経路さがし・歩く・調べる）
function botKit() {
  const M = window.__michi, { G, P, F, LEV, DOORS, RUNS, GW, N } = M; M.hold = true;
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
  // 階段の入口と出口をつなぐ
  const runEdges = new Map(); for (const r of RUNS) { const a = (r.L + 1) * N + r.entry, b = (r.L + 2) * N + r.arr; (runEdges.get(a) || runEdges.set(a, []).get(a)).push(b); (runEdges.get(b) || runEdges.set(b, []).get(b)).push(a) }
  const nid = (L, k) => (L + 1) * N + k, nL = n => Math.floor(n / N) - 1, nk = n => n % N;
  function bfs(goal, from) {
    const s = from ?? nid(P.L, K(Math.floor(P.x), Math.floor(P.y))); const prev = new Map([[s, -1]]); const q = [s];
    while (q.length) {
      const n = q.shift(); if (goal(nL(n), nk(n))) { const out = []; for (let c = n; c !== -1; c = prev.get(c)) out.push(c); return out.reverse() }
      const L = nL(n), k = nk(n), x = kx(k), y = ky(k);
      const nb = []; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GW) continue; const kk = K(xx, yy); if (stand(L, kk)) nb.push(nid(L, kk)) }
      for (const m of runEdges.get(n) || []) nb.push(m);
      for (const m of nb) if (!prev.has(m)) { prev.set(m, n); q.push(m) }
    }
    return null;
  }
  // 1歩ぶん（世界の向きで歩く）
  function goXY(tx, ty, sec = 5) { for (let i = 0; i < sec * 60; i++) { if (G.cine || G.ride || P.act) { G.inpW = null; settle() } const dx = tx - P.x, dy = ty - P.y, d = Math.hypot(dx, dy); if (d < .1) { G.inpW = null; return true } const s = Math.max(.4, Math.min(1, d * 4)); G.inpW = [dx / d * s, dy / d * s]; M.update(1 / 60) } G.inpW = null; return false }
  function settle(sec = 30) { for (let i = 0; i < sec * 60; i++) { if (G.note) G.note = null; if (!(P.act || G.cine || G.ride || P.climb || G.sleep)) break; M.update(1 / 60) } G.note = null }
  function openDoor(d) {
    { const dx = d.x + .5 - P.x, dy = d.y + .5 - P.y, l = Math.hypot(dx, dy) || 1; P.fx = dx / l; P.fy = dy / l }
    const it = M.interactables()[0];
    if (it && it.kind === 'door' && it.d === d) { M.interact(); settle() }
    if (!d.open) { log.push(`  （扉 ${d.x},${d.y} L${d.L} は調べるで開かなかったので直接あける：目の前は ${it ? (it.o ? it.o.type + '@' + it.o.x + ',' + it.o.y : 'door@' + it.d.x + ',' + it.d.y) : 'なし'}・自分 ${P.x.toFixed(2)},${P.y.toFixed(2)}）`); d.open = true; d.lock = null; d.stuck = false }
  }
  // 経路をたどる（扉は開けて、階段は1段ずつ）
  function walk(path) {
    if (!path) return false;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i], La = nL(a), Lb = nL(b), kb = nk(b);
      if (La !== Lb) {
        const ka = nk(a); const r = RUNS.find(r => r.L === La && r.entry === ka && r.arr === kb || r.L === Lb && r.arr === ka && r.entry === kb); const up = r.L === La;
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
  // 物のとなりまで行って「調べる」
  function useObj(o, label) {
    const p = bfs(near(o.L, o.x, o.y, o.x + o.w, o.y + o.h)); if (!ok(!!p, `${label}：たどりつける`)) return false;
    if (!walk(p)) { ok(false, `${label}：歩いて行けた`); return false }
    for (let i = 0; i < 40 && !(M.interactables()[0] && M.interactables()[0].o === o); i++) { const dx = o.x + o.w / 2 - P.x, dy = o.y + o.h / 2 - P.y, d = Math.hypot(dx, dy); G.inpW = [dx / d * .5, dy / d * .5]; M.update(1 / 60) } G.inpW = null;
    const it = M.interactables()[0]; if (!ok(it && it.o === o, `${label}：目の前で「${it ? M.verbOf(it) : '-'}」`)) return false;
    M.interact(); settle(); return true;
  }
  function useDoor(d, label) {
    const p = bfs(near(d.L, d.x, d.y, d.x + 1, d.y + 1)); if (!ok(!!p && walk(p), `${label}：扉の前まで行ける`)) return false;
    const it = M.interactables()[0]; if (!ok(it && it.d === d, `${label}：目の前で「${it ? M.verbOf(it) : '-'}」`)) return false;
    M.interact(); settle(); return true;
  }
  const findObj = f => M.OBJ.find(f);
  return { M, G, P, F, ok, log, bfs, walk, goXY, settle, useObj, useDoor, findObj, stand, nid, nL, nk, kx, ky, K, fails: () => fails };
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
    const { M, ok, bfs } = B; M.give('key_staff'); M.give('crowbar');
    for (const d of M.DOORS.values()) if (d.kind === 'G') d.stuck = false;
    const seen = new Set();
    const s = B.nid(0, B.K(47, 71)); const prev = new Map([[s, 1]]); const q = [s];
    while (q.length) { const n = q.shift(); seen.add(n); const L = B.nL(n), k = B.nk(n), x = B.kx(k), y = B.ky(k); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const kk = B.K(x + dx, y + dy); const m = B.nid(L, kk); if (!prev.has(m) && B.stand(L, kk)) { prev.set(m, 1); q.push(m) } } for (const r of M.RUNS) { const a = B.nid(r.L, r.entry), c = B.nid(r.L + 1, r.arr); if (n === a && !prev.has(c)) { prev.set(c, 1); q.push(c) } if (n === c && !prev.has(a)) { prev.set(a, 1); q.push(a) } }
      // はしご（点検階 ⇄ てっぺん）
      const ld = M.OBJ.find(o => o.type === 'ladder'); if (ld && L === ld.L && Math.abs(x - ld.x) + Math.abs(y - ld.y) === 1) { const m = B.nid(ld.L + 1, B.K(M.BX + 6, M.BY + 7)); if (!prev.has(m)) { prev.set(m, 1); q.push(m) } } }
    for (let i = 1; i < M.BLD.length; i++) { const bd = M.BLD[i]; if (!bd) continue; const lv = new Map(); for (let L = -1; L <= 10; L++) { const g = M.LEV[L]; if (!g) continue; for (let k = 0; k < M.N; k++) if (g.bid[k] === i && M.basicPass(L, k)) { if (!lv.has(L)) lv.set(L, [0, 0]); lv.get(L)[0]++; if (seen.has(B.nid(L, k))) lv.get(L)[1]++ } }
      for (const [L, [n, r]] of lv) ok(r > 0, `${bd.name || '建物' + i} の ${L < 0 ? '地下' : L + 1 + '階'}：${r}/${n} マス`) }
  });

  await run('非常階段で展望台まで、自分の足で', B => {
    const { M, P, F, ok, bfs, walk } = B; for (const z of M.ZB) { z.x = 150.5; z.y = 150.5 }
    for (const d of M.DOORS.values()) if (d.kind === 'G') d.stuck = false;
    const path = bfs((L) => L === 8); ok(!!path, '展望台への道がある（' + (path ? path.length : 0) + '歩）');
    const t0 = M.G.gameT; ok(walk(path), '登りきった'); ok(P.L === 8, `いまの階 ${P.L + 1}階（展望台）`);
    ok(M.G.flags.deck, '展望台の名場面が始まった'); B.settle();
    for (let i = 0; i < 240; i++) M.update(1 / 60); ok(Math.abs(F.z - P.z) < M.LH && Math.hypot(F.x - P.x, F.y - P.y) < 4, `ともだちもついてきた（高さの差 ${(P.z - F.z).toFixed(1)}・${Math.hypot(F.x - P.x, F.y - P.y).toFixed(1)}マス）`);
    B.log.push(`  （かかった時間：ゲーム内 ${(M.G.gameT - t0).toFixed(0)} 秒）`);
    const down = bfs((L) => L === 0); ok(walk(down) && P.L === 0, '1階まで降りられた');
  });

  await run('電気を戻して、てっぺんへ。夜の望遠鏡で遠くの灯り', B => {
    const { M, G, P, ok, useObj, useDoor, findObj } = B; for (const z of M.ZB) { z.x = 150.5; z.y = 150.5 } G.t = 9 * 60;
    const door = [...M.DOORS.values()].find(d => d.kind === 'G' && d.stuck && d.L === 0 && d.bid === M.T_ID);
    if (door) useDoor(door, '塔の止まった自動ドア'); ok(!door || !door.stuck, '自動ドアを手で開けた');
    const has = (o, id) => o.items && o.items.includes(id);
    useObj(findObj(o => has(o, 'key_staff')), 'スタッフの鍵のある所'); ok(M.has('key_staff'), 'スタッフの鍵を手に入れた');
    useObj(findObj(o => has(o, 'crowbar')), 'バールのある所'); ok(M.has('crowbar'), 'バールを手に入れた（地下）');
    useObj(findObj(o => has(o, 'jerry_full')), '燃料の缶のある所'); ok(M.has('jerry_full'), '燃料の入った携行缶を手に入れた');
    const gen = findObj(o => o.type === 'generator'), brk = findObj(o => o.type === 'breaker');
    useObj(gen, '発電機（給油）'); ok(G.gen.fuel > 50, '発電機に燃料が入った');
    useObj(gen, '発電機（始動）'); ok(G.gen.run, '発電機が動いた');
    useObj(brk, 'ブレーカー'); ok(G.flags.poweredOnce, '明かりが戻る名場面'); B.settle(); ok(G.power && G.litLevel >= 10, '塔に電気が来た');
    const el = [...M.DOORS.values()].find(d => d.kind === 'E' && d.L === 0);
    const p = B.bfs((L, k) => L === 0 && Math.abs(B.kx(k) - el.x) + Math.abs(B.ky(k) - el.y) === 1); ok(p && B.walk(p), 'エレベーターの前まで行ける');
    const it = M.interactables()[0]; ok(it && it.d === el && M.verbOf(it) === 'エレベーターに乗る', '「エレベーターに乗る」が出る'); M.interact(); B.settle(); for (let i = 0; i < 120; i++) M.update(1 / 60); B.settle();
    ok(P.L === 8, `エレベーターで展望台へ（${P.L + 1}階）`); ok(G.flags.deck, '展望台の名場面');
    const gate = [...M.DOORS.values()].find(d => d.kind === 'gate'); ok(!!gate, '点検階への柵がある');
    if (gate) { useDoor(gate, '点検階の柵（バール）'); ok(!gate.lock && gate.open, '柵をこじあけた') }
    useObj(findObj(o => o.type === 'ladder'), 'はしご'); ok(P.L === 10, `てっぺんに出た（${P.L + 1}階）`);
    const ant = findObj(o => o.type === 'antenna'); if (ant) { useObj(ant, 'てっぺんの見わたし'); ok(G.scope > 0, '景色を見わたした') }
    useObj(findObj(o => o.type === 'ladder_top'), 'はしごを降りる'); ok(P.L === 9, '点検階に戻った');
    G.t = 20 * 60; const tel = M.OBJ.filter(o => o.type === 'telescope' && o.L === 8)[0];
    useObj(tel, '夜の望遠鏡'); ok(G.flags.farlight, '遠くの灯りの名場面'); B.settle(); ok(G.chapter, '章の終わりの絵が出た');
  });

  await run('民家の2階・学校の屋上・電車の中・神社', B => {
    const { M, P, ok, bfs, walk } = B; for (const z of M.ZB) { z.x = 150.5; z.y = 150.5 }
    for (const d of M.DOORS.values()) if (d.kind === 'G') d.stuck = false;
    const go = (name, goal) => { M.tp(47.5, 71.6, 0); const p = bfs(goal); ok(!!p && walk(p) && goal(P.L, B.K(Math.floor(P.x), Math.floor(P.y))), `${name}へ歩いて行けた（${p ? p.length : '-'}歩）`) };
    const inB = (id, L) => (l, k) => l === L && M.LEV[l].bid[k] === id;
    for (const h of M.BLD.filter(b => b && b.name === '民家' && b.levels === 2)) go(`2階建ての民家（${h.x},${h.y}）の2階`, inB(h.id, 1));
    const sch = M.BLD.findIndex(b => b && b.name === '学校'); if (sch > 0) { go('学校の2階', inB(sch, 1)); go('学校の屋上', (l, k) => l === 2 && M.LEV[2].bid[k] === sch) }
    const tr = M.BLD.findIndex(b => b && b.name === '電車'); if (tr > 0) go('電車の中', inB(tr, 0));
    go('神社の境内', (l, k) => l === 0 && Math.hypot(B.kx(k) - M.JX - 5, B.ky(k) - M.JY - 6) < 4);
  });

  await run('眠ると朝・保存と読み込み', B => {
    const { M, G, P, ok, useObj } = B; for (const z of M.ZB) { z.x = 150.5; z.y = 150.5 }
    G.t = 22 * 60; const bed = M.OBJ.find(o => o.type === 'futon' && o.L === 0);
    ok(!!bed, 'ふとん・ベッドがある'); if (bed) { useObj(bed, 'ふとん'); for (let i = 0; i < 600 && G.sleep; i++) M.update(1 / 60); const h = (G.t % 1440) / 60; ok(h >= 6 && h < 6.5, `眠ったら朝になった（${h.toFixed(2)}時）`) }
    G.allowSave = true; M.give('lighter'); G.flags.test = 1; const t = G.t, x = P.x; M.saveGame(); ok(M.hasSave(), '保存できた');
    G.t = 0; P.x = 10; delete G.inv.lighter; G.flags = {}; ok(M.loadGame(), '読み込めた'); ok(Math.abs(G.t - t) < .01 && Math.abs(P.x - x) < .01 && M.has('lighter') && G.flags.test, '時間・場所・持ち物・できごとが戻った');
    localStorage.removeItem('hatenakimichi_v2');
  });

  await run('タイトルから始めて、迷ったらともだちが教えてくれる', B => {
    const { M, G, P, F, ok } = B; G.title = true; G.started = false; M.titleChoose('new'); ok(!G.title, 'タイトルから始まった');
    for (let i = 0; i < 60 * 8; i++) M.update(1 / 60); ok(!G.cine, '最初の場面が終わって、歩ける');
    const said = new Set(); for (let i = 0; i < 60 * 45; i++) { M.update(1 / 60); if (F.say) said.add(F.say) } ok([...said].some(t => /塔/.test(t)) && G.hint && G.hint.k === 0, `じっとしていると、ともだちが塔を指さす（${[...said].join(' / ')}）`);
    M.tp(M.BX + 4.5, M.BY + 11.5, 0); for (let i = 0; i < 60 * 85; i++) M.update(1 / 60); ok(G.hint && G.hint.k === 1, '塔に入ると、次はチケット売り場を教えてくれる');
  });

  await run('ゾンビ・町を歩きまわる・描く速さ', B => {
    const { M, G, P, ok } = B; const z = M.ZB[0]; z.x = P.x + 1.2; z.y = P.y; z.L = 0; z.down = 0; G.t = 12 * 60;
    for (let i = 0; i < 30; i++) M.update(1 / 60); P.fx = 1; P.fy = 0; M.shove(); for (let i = 0; i < 10; i++) M.update(1 / 60); ok(z.down > 0, 'ゾンビを押したおした');
    for (const zz of M.ZB) { zz.x = 150.5; zz.y = 150.5 }
    let stuck = 0, bad = 0, last = [P.x, P.y]; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]];
    for (let s = 0; s < 240; s++) { G.inpW = dirs[(s * 7 + (s >> 2)) % 8]; for (let i = 0; i < 30; i++) M.update(1 / 60); if (!M.pass(P, Math.floor(P.x), Math.floor(P.y)) && !P.stair) bad++; if (Math.hypot(P.x - last[0], P.y - last[1]) < .01) stuck++; last = [P.x, P.y]; if (s % 60 === 59) { M.tp(20 + (s * 37) % 110 + .5, 30 + (s * 53) % 90 + .5, 0); if (!M.pass(P, Math.floor(P.x), Math.floor(P.y))) M.tp(47.5, 71.6, 0) } }
    G.inpW = null; ok(bad === 0, `壁や水の中に入りこまなかった（${bad}）`); B.log.push(`  （壁にぶつかって止まった回数 ${stuck}/240）`);
    const ts = []; for (const [x, y, L, h] of [[47.5, 71.6, 0, 17], [91, 64, 0, 19], [M.BX + 4.5, M.BY + 12.5, 8, 18], [60.5, 33.5, 0, 12]]) { M.tp(x, y, L); G.t = h * 60; for (let i = 0; i < 90; i++) M.update(1 / 60); for (let i = 0; i < 8; i++) { const t0 = performance.now(); M.frame(); ts.push(performance.now() - t0) } }
    ts.sort((a, b) => a - b); const med = ts[ts.length >> 1]; ok(med < 60, `1枚を描く時間（真ん中）${med.toFixed(1)}ms`);
  });

  await b.close();
  console.log(total ? `\n× 失敗 ${total}` : '\n○ ぜんぶ通った'); process.exit(total ? 1 : 0);
})();

// 果てなき道：自動で遊んで、つながりを確かめる
//   node michi/tests/bot.js
//   1) 1階から展望台まで、非常階段を自分の足で登れるか（ともだちもついてくるか）
//   2) 鍵 → スタッフ室 → 地下 → 燃料 → 発電機 → ブレーカー → エレベーター → 点検階 → はしご → てっぺん
//   3) 町を歩きまわってもエラーが出ないか・重くないか
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?test';

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
  await p.goto(FILE); await p.waitForTimeout(600);
  const res = await p.evaluate(() => {
    const M = window.__michi, P = M.P, G = M.G, BX = M.BX, BY = M.BY; G.started = true; const log = [];
    const ok = (c, m) => { log.push((c ? '○ ' : '× ') + m); return c };
    // まっすぐ目的地へ（世界の向きで歩く）
    const go = (x, y, t = 12) => { for (let i = 0; i < t * 60; i++) { const dx = x - P.x, dy = y - P.y, d = Math.hypot(dx, dy); if (d < .12) break; G.inpW = [dx / d, dy / d]; M.update(1 / 60) } G.inpW = null; M.update(1 / 60) };
    const walk = (dx, dy, sec) => { G.inpW = [dx, dy]; for (let i = 0; i < sec * 60; i++) M.update(1 / 60); G.inpW = null };
    const act = (wait = 3) => { M.interact(); M.step(wait) };
    // ── 1) 階段を歩いて登る
    M.tp(BX + 6.5, BY + 8.5, 0);
    for (let L = 0; L < 8; L++) {
      if (L % 2 === 0) { if (L > 0) go(BX + 6.5, BY + 7.5); go(BX + 6.5, BY + 5.5); walk(1, 0, 3.5) }
      else { go(BX + 11.5, BY + 5.5); go(BX + 11.5, BY + 7.5); walk(-1, 0, 3.5) }
      if (P.L !== L + 1) { ok(false, `階段 ${L}→${L + 1} で止まった（いま L=${P.L} x=${P.x.toFixed(2)} y=${P.y.toFixed(2)}）`); break }
    }
    ok(P.L === 8, `非常階段で展望台（8階）まで登れた L=${P.L}`);
    M.step(1.5); ok(M.F.L === P.L, `ともだちもついてきた（ともだち L=${M.F.L}）`);
    // 降りる
    go(BX + 6.5, BY + 7.5); walk(1, 0, .01); go(BX + 7.6, BY + 7.5); walk(1, 0, 3.5);
    ok(P.L === 7, `階段を降りられた L=${P.L}`);
    // ── 2) 電気を戻して、てっぺんへ
    M.tp(BX + 8.5, BY + 14.5, 0); M.interact(); M.step(2); ok(M.DOORS.get(0 * 140 * 140 + M.key(BX + 8, BY + 13)).open, '止まった自動ドアを手で開けた');
    go(BX + 8.5, BY + 12.5); go(BX + 3.5, BY + 12.5); go(BX + 3.5, BY + 11.5); act(1.5); ok(M.has('key_staff'), 'チケット売り場でスタッフの鍵を見つけた');
    go(BX + 3.5, BY + 12.5); go(BX + 15.5, BY + 12.5); go(BX + 15.5, BY + 5.5); go(BX + 14.5, BY + 5.5); act(1); ok(M.DOORS.get(M.key(BX + 14, BY + 4)).open, '鍵でスタッフ室を開けた');
    go(BX + 14.5, BY + 3.5); go(BX + 16.5, BY + 3.5); go(BX + 16.5, BY + 2.5); walk(-1, 0, 3);
    ok(P.L === -1, `スタッフ室の階段で地下へ降りた L=${P.L}`);
    go(BX + 12.5, BY + 3.5); go(BX + 12.5, BY + 8.5); act(1.5); ok(M.has('crowbar'), '工具ワゴンでバールを見つけた');
    go(BX + 9.5, BY + 6.5); act(1); ok(!G.gen.run && G.gen.fuel === 0, '燃料がないので発電機は動かない');
    // スタンドへ（町を歩くのは省略してとぶ）
    M.tp(93.5, 67.5, 0); act(1); go(95.5, 67.5); go(95.5, 68.5); act(1.5); ok(M.has('jerry_full'), 'ガソリンスタンドの奥で携行缶を見つけた');
    M.tp(BX + 9.5, BY + 6.5, -1); act(3); ok(G.gen.fuel > 0, '発電機に燃料を入れた'); act(2.5); ok(G.gen.run, '発電機が動いた');
    go(BX + 15.5, BY + 6.5); act(.5); ok(G.power, `ブレーカーを上げて電気が戻った power=${G.power}`);
    M.tp(BX + 14.5, BY + 9.5, 0); act(5); ok(P.L === 8, `エレベーターで展望台へ L=${P.L}`);
    // 展望台 → 芯の中 → 9階
    go(BX + 9.5, BY + 10.5); go(BX + 9.5, BY + 8.5); go(BX + 6.5, BY + 8.5); go(BX + 6.5, BY + 5.5); walk(1, 0, 3.5); ok(P.L === 9, `点検階へ登った L=${P.L}`);
    go(BX + 11.5, BY + 5.5); go(BX + 11.5, BY + 6.5); act(3); ok(M.DOORS.get(9 * 140 * 140 + M.key(BX + 11, BY + 7)).open, 'バールで関係者以外の扉をこじあけた');
    go(BX + 11.5, BY + 7.5); act(4); ok(P.L === 10, `はしごを登って、てっぺんに出た L=${P.L}`);
    go(BX + 9.5, BY + 6.5); act(1); ok(G.scope > 0, 'てっぺんで、アンテナの足もとから見わたした');
    // ── 3) 町を歩きまわる
    M.tp(44.5, 59.5, 0); const t0 = performance.now(); let frames = 0;
    for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28; walk(Math.cos(a), Math.sin(a), .6); M.render(); frames++ }
    const ms = (performance.now() - t0) / frames;
    const tm = {}; for (const [n, x, y, L] of [['てっぺん', 66.5, 44.5, 10], ['展望台', 62.5, 51.5, 8], ['町', 44.5, 59.5, 0], ['ロビー', 66.5, 49.5, 0]]) { M.tp(x, y, L); M.step(2); const ts = []; for (let i = 0; i < 15; i++) { const t = performance.now(); M.render(); ts.push(performance.now() - t) } ts.sort((a, b) => a - b); tm[n] = ts[7] }
    ok(tm['町'] < 35 && tm['ロビー'] < 35 && tm['てっぺん'] < 60 && tm['展望台'] < 60, '描く時間（テスト用の遅い描画で）' + Object.entries(tm).map(([k, v]) => k + ' ' + v.toFixed(1) + 'ms').join('／'));
    return { log, hp: P.hp };
  });
  for (const l of res.log) console.log(l);
  console.log('errors', errs.slice(0, 5));
  const bad = res.log.filter(l => l.startsWith('×')).length + errs.length;
  console.log(bad ? `NG ${bad}` : 'ALL OK'); await b.close(); process.exit(bad ? 1 : 0);
})();

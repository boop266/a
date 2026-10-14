// 黄泉還：通しプレイ（タイトル → オープニング → 洋館 → 地下 → 研究所 → ボス2体 → 結末 → 成績 → タイトル）
// プレイヤーと同じ操作（スティック・ボタン）だけで最後まで遊び切れるかを確かめる。
//   node yomi/tests/bot.js [保存先] [--seed N]
//   前半(A)：血清を早瀬に打つ結末。途中でわざと一度死んで、最後の記録から続ける。研究所の手前で記録2にも残す。
//   後半(B)：タイトルの「つづきから」で記録2を読み、血清を打たない結末まで。
const path = require('path'), fs = require('fs'); const { execFileSync } = require('child_process');
const { chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
const args = process.argv.slice(2); const out = args.find(a => !a.startsWith('--')) || null; const seed = +(args[args.indexOf('--seed') + 1] || 7) || 7;
const ROUTE = `[
  // ── 1階 西 ──
  { go: 'dining' }, { pick: 'f_invite' }, { act: 'dining_drawer' },
  { go: 'wcorr' }, { clear: true }, { pick: 'miura_ammo' }, { pick: 'f_miura' },
  { go: 'servant' }, { pick: 'srv_rib' }, { pick: 'map1f' }, { pick: 'srv_spray' }, { pick: 'f_servant' }, { save: 0 },
  { go: 'kitchen', passive: 'kitchen' }, { die: 'kitchen' },
  { clear: true }, { pick: 'kit_ammo' }, { pick: 'f_cook' }, { act: 'oven' },
  { go: 'dining' }, { act: 'clock' }, { pick: 'hawkkey', req: true },
  // ── 2階 ──
  { go: 'hall' }, { clear: true }, { go: 'w2corr' },
  { go: 'shosei' }, { pick: 'sho_rib' }, { pick: 'sho_h1' }, { tidy: true }, { box: true, takeRibbon: true }, { save: 0 }, { box: true },
  { go: 'child' }, { act: 'toychest' }, { pick: 'f_sayo' },
  { go: 'bed' }, { act: 'vanity' }, { clear: true }, { pick: 'bed_h1' }, { pick: 'f_yukino' },
  { go: 'w2corr' }, { clear: true }, { pick: 'w2_ammo' },
  { go: 'gallery' }, { go: 'library' }, { clear: true },
  { pick: 'f_family' }, { pick: 'map2f' }, { act: 'pushshelf' }, { pick: 'huntkey', req: true }, { pick: 'lib_sg' },
  { go: 'gallery' }, { portraits: true }, { pick: 'wolfkey', req: true },
  // ── 1階 東・温室 ──
  { go: 'ecorr' }, { clear: true }, { act: 'ecorr_cab' },
  { go: 'study' }, { act: 'desk_drawer' }, { pick: 'f_baron' }, { act: 'cabinet' }, { act: 'cabinet' },
  { go: 'ecorr' }, { clear: true },
  { go: 'green' }, { clear: true, max: 300 }, { pick: 'basekey', req: true }, { pick: 'gr_h1' }, { pick: 'gr_h2' }, { pick: 'gr_h3' }, { pick: 'f_gardener' },
  { go: 'servant' }, { tidy: true }, { box: true, takeRibbon: true }, { save: 0 }, { box: true },
  // ── 地下 ──
  { go: 'cellar' }, { clear: true }, { pick: 'handle', req: true }, { pick: 'cel_ammo' }, { pick: 'cel_hb1' }, { pick: 'cel_hb2' },
  { go: 'boiler' }, { clear: true }, { pick: 'boi_ammo' }, { pick: 'boi_sg' }, { pick: 'boi_h1' },
  { go: 'keeper' }, { pick: 'kp_rib' }, { pick: 'mapb1' }, { pick: 'f_delivery' }, { pick: 'kp_h1' }, { tidy: true }, { box: true, takeRibbon: true }, { save: 0 }, { box: true },
  { go: 'boiler' }, { act: 'valve' },
  { go: 'tunnel' }, { clear: true }, { pick: 'tun_sg' },
  { go: 'lab_sec' }, { pick: 'ls_rib' }, { pick: 'ls_ammo' }, { pick: 'f_guard' }, { pick: 'maplab' }, { tidy: true }, { box: true, takeRibbon: true }, { save: 0 }, { save: 1 }, { box: true },
  // ── 研究所 ──
  { go: 'lab_corr' }, { clear: true },
  { go: 'lab_res' }, { clear: true }, { pick: 'reagB', req: true }, { pick: 'f_research' }, { pick: 'f_kuga' }, { pick: 'res_spray' }, { pick: 'res_ammo' },
  { go: 'lab_cult' }, { clear: true }, { pick: 'idcard', req: true }, { pick: 'reagA', req: true }, { pick: 'cult_sg' },
  { go: 'lab_res' }, { act: 'synth' },
  { go: 'lab_corr' }, { clear: true }, { act: 'terminal' },
  { go: 'lab_cell' }, { clear: true }, { pick: 'magnum', want: true }, { pick: 'mg_a1', want: true }, { pick: 'cell_h1' },
  { act: 'hayase' }, { act: 'hayase' }, { pick: 'haya_ammo', want: true },
  { go: 'lab_core' }, { heal: 85 }, { heal: 85 }, { act: 'core_term' }, { boss: 'boss1' },
  { go: 'lab_exit' }, { clear: true }, { heal: 70 }, { go: 'heliport' }, { boss: 'boss2' },
  { ending: true },
]`;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 640, height: 480 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 4).join(' | '))); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + `?test&seed=${seed}`); await p.waitForTimeout(600);
  await p.evaluate(() => localStorage.clear());
  await p.evaluate(require('./botlib.js'));
  // 応答がなくなったときの手がかり：ページを一時停止して、どこで回っているかを出す
  const cdp = await p.context().newCDPSession(p); await cdp.send('Debugger.enable'); let paused = null; cdp.on('Debugger.paused', ev => { paused = ev; });
  const evalT = async (fn, ms = 90000) => { const r = await Promise.race([p.evaluate(fn), new Promise(res => setTimeout(() => res('TIMEOUT'), ms))]); if (r !== 'TIMEOUT') return r;
    console.log('応答なし：ページを止めて調べる'); await cdp.send('Debugger.pause'); for (let w = 0; w < 50 && !paused; w++) await new Promise(res => setTimeout(res, 100));
    if (paused) { for (const f of paused.callFrames.slice(0, 16)) console.log('  at', f.functionName || '(無名)', 'line', f.location.lineNumber + 1, 'col', f.location.columnNumber);
      try { const q = await cdp.send('Debugger.evaluateOnCallFrame', { callFrameId: paused.callFrames[0].callFrameId, expression: 'JSON.stringify({rid: G.rid, mode: G.mode, pl: [PL.x, PL.y, PL.z], task: BOT.task, ui: G.ui && G.ui.k, msg: !!G.msg})' }); console.log('  状態', q.result.value); } catch (e) { } }
    await b.close(); process.exit(2); };
  if (out) fs.mkdirSync(out, { recursive: true });
  let shot = 0; const snap = async name => { if (!out) return; await p.evaluate(() => YOMI.render()); await p.screenshot({ path: path.join(out, `${String(++shot).padStart(3, '0')}_${name}.png`) }); };
  const runPhase = async (label, setup, limitMin) => {
    await p.evaluate(setup);
    const t0 = Date.now(); let st, lastRid = '', quiet = 0;
    while (true) {
      st = await evalT(() => BOT.run(900));
      for (const l of st.log) console.log(`  ${l}`);
      // 何も起きないまま時間だけ進むとき：いまの様子を出す（止まった原因を探す手がかり）
      quiet = st.log.length ? 0 : quiet + 1; if (quiet >= 3 && quiet % 3 === 0) console.log('  （様子）', JSON.stringify(await p.evaluate(() => ({ t: fmtTime(G.time), mode: G.mode, ui: G.ui && G.ui.k, msg: G.msg && G.msg.pages[G.msg.i], card: !!G.card, door: !!G.doorFx, cut: !!CUT.gen, pl: [PL.x, PL.y, PL.z].map(v => +v.toFixed(2)), ang: +PL.ang.toFixed(2), act: PL.actT, rel: PL.reloadT, hurt: PL.hurtT, grab: !!PL.grab, task: BOT.task, rid: G.rid, hp: PL.hp, poison: PL.poison, eq: G.eq, mag: G.mag, inv: G.inv.map(q => q ? q.id + (q.n > 1 ? 'x' + q.n : '') : '-').join(' '), heal: !!BOT.healCo, equip: !!BOT.equipCo, where: BOT.where, frame: BOT.frameN, co: !!BOT.co, passive: BOT.passive, i: BOT.i, path: BOT.path && BOT.path.length, stick: [IN.mx, IN.my].map(v => +v.toFixed(2)), cam: G.cam && G.cam.i, en: G.en.filter(e => !e.dead).map(e => e.type + ':' + e.state) }))));
      if (st.room) await snap(`${label}_${st.room}`);
      if (st.snap) { await snap(`${label}_${st.snap}`); await p.evaluate(() => { BOT.snapNow = null; }); }
      if (st.done || errs.length > 20) break;
      if ((Date.now() - t0) / 60000 > limitMin) { console.log('  時間切れ（テストの）'); break; }
    }
    const res = await p.evaluate(() => ({ result: BOT.result, deaths: BOT.deaths, fail: BOT.fail, i: BOT.i, n: BOT.route.length, time: fmtTime(G.time), kills: G.kills, shots: BOT.shots, hurt: BOT.hurt, saves: G.saves, mode: G.mode, haya: flag('hayaSaved'), inv: G.inv.map(q => q ? q.id + (q.n > 1 ? 'x' + q.n : '') : '-').join(' ') }));
    console.log(`${label}: ${JSON.stringify(res)}`); return res;
  };
  // 前半：はじめから（血清を打つ）
  const A = await runPhase('A', `BOT.route = ${ROUTE}; BOT.opts = { haya: true }; BOT.titleGo = 'はじめから'; G.mode = 'title'; TITLE.phase = 'press';`, 25);
  // 後半：つづきから（記録2）→ 血清を打たない
  const routeB = `(() => { const r = ${ROUTE}; const k = r.findIndex(t => t.save === 1); return r.slice(k + 1); })()`;
  const B2 = await runPhase('B', `if (G.mode !== 'title') toTitle(); BOT.route = ${routeB}; BOT.i = 0; BOT.co = null; BOT.done = false; BOT.fail = null; BOT.result = null; BOT.opts = { haya: false }; BOT.saveIdx = [0, 0, 0]; BOT.loadSlot = 1; BOT.titleGo = 'つづきから'; BOT.deaths = 0; BOT.passive = false; BOT.noFight = false; BOT.deadSeen = false; BOT.healCo = BOT.equipCo = BOT.grabCo = null;`, 15);
  // 時間切れで死ぬか（脱出の残り時間）
  const timer = await p.evaluate(() => { YOMI.go('lab_exit', 0, 12); G.timer = { left: 1.5 }; PL.hp = 100; PL.dead = false; for (let k = 0; k < 60 * 4; k++) step(1 / 60); return { dead: PL.dead, why: G.deathWhy, mode: G.mode }; });
  console.log('時間切れ:', JSON.stringify(timer));
  console.log(errs.length ? 'エラー:\n' + [...new Set(errs)].slice(0, 20).join('\n') : 'エラーなし');
  const ok = A.result && B2.result && A.result.haya && !B2.result.haya && A.deaths >= 1 && timer.dead && !errs.length && !A.fail && !B2.fail;
  console.log(ok ? '通し：OK（2つの結末・死んで続き・記録と読み込み・時間切れ）' : '通し：NG');
  await b.close(); process.exit(ok ? 0 : 1);
})();

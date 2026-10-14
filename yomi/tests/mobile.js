// 黄泉還：スマホで、指だけで遊べるか（縦持ち・横持ち）
//   スマホとして開き（タッチ・?test なし＝本番と同じ動き方）、画面をたたく・なぞる操作だけで、
//   タイトル → オープニング → 歩く・調べる・撃つ → 持ち物・ファイル・地図 → 選択肢 → アイテムボックス → 記録
//   → 合言葉 → 死んで記録から続ける → 設定 → つづきから → 成績 → タイトル を一通り動かし、効いたかをゲームの状態で確かめる。
//   部屋の移動や物の準備だけは、ページの中から直接おこなう（指で確かめたいのは「押せるか・効くか」なので）。
//   node yomi/tests/mobile.js [写真の保存先]
const path = require('path'), fs = require('fs'); const { execFileSync } = require('child_process');
const { chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
const out = process.argv[2] || null; if (out) fs.mkdirSync(out, { recursive: true });
const FILE = 'file://' + (process.env.YOMI_FILE || path.resolve(__dirname, '..', 'index.html')) + '?seed=5'; // YOMI_FILE：ほかの置き場の版（公開用の写し など）を試すとき
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=user-gesture-required'] });
  let bad = 0;
  for (const [name, vw, vh] of [['縦持ち', 390, 844], ['横持ち', 844, 390]]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(FILE); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
    const cdp = await ctx.newCDPSession(p);
    // 指：id ごとの [x, y]。指を足す・離すたびに、いま触れている指をまとめて送る
    const fingers = new Map(); const send = type => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [...fingers].map(([id, [x, y]]) => ({ x, y, id })) });
    const down = async (id, x, y) => { fingers.set(id, [x, y]); await send('touchStart'); };
    const move = async (id, x, y) => { fingers.set(id, [x, y]); await send('touchMove'); };
    const up = async id => { fingers.delete(id); await send('touchEnd'); };
    const tap = async (x, y, wait = 250) => { await down(9, x, y); await p.waitForTimeout(60); await up(9); await p.waitForTimeout(wait); };
    const until = async (f, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(f)) return true; await p.waitForTimeout(80); } return false; };
    // 画面に出ている「押せる所」を名前で探してたたく（いちばん手前に描かれた物）
    const rect = lab => p.evaluate(lab => { const r = [...UIR].reverse().find(r => r.lab === lab); return r ? [r.x + r.w / 2, r.y + r.h / 2] : null; }, lab);
    const press = async (lab, wait = 300) => { await p.waitForTimeout(120); const r = await rect(lab); if (!r) return false; await tap(r[0], r[1], wait); return true; };
    const btn = async k => p.evaluate(k => { const q = TOUCH.btn[k]; return [q.x, q.y]; }, k);
    const lines = []; const ok = (label, cond) => { lines.push((cond ? '  ○ ' : '  × ') + label); if (!cond) bad++; return cond; };
    let n = 0; const shot = async nm => { if (out) await p.screenshot({ path: path.join(out, `${name}_${String(++n).padStart(2, '0')}_${nm}.png`) }); };
    const set = (f, a) => p.evaluate(f, a);
    const center = [vw / 2, vh * 0.45];

    // タイトル
    await shot('title');
    await tap(...center, 500); ok('タイトル：画面にふれると、項目が出る', await until(() => TITLE.phase === 'menu'));
    await shot('title_menu');
    await press('title:はじめから', 600); ok('タイトル：「はじめから」をたたくと始まる', await until(() => G.mode !== 'title'));
    // オープニング：スキップをたたく（出るまでは、文をたたいて送る）
    let skipped = false;
    for (let k = 0; k < 120; k++) { if (await p.evaluate(() => G.mode === 'play' && !G.msg && !G.card)) break; if (!skipped && await press('スキップ', 400)) { skipped = true; continue; } await tap(...center, 300); }
    ok('オープニング：「スキップ」と文送りを指で', skipped && await until(() => G.mode === 'play' && G.rid === 'hall' && !G.msg, 15000));
    await p.waitForTimeout(800); await shot('play');
    ok('遊ぶ画面：指のボタン（スティック・調べる・構える・持ち物・地図）が出ている', await p.evaluate(() => IN.touch && TOUCH.area && ['aim', 'act', 'menu', 'map'].every(k => TOUCH.btn[k])));

    // 歩く：左下の丸を上へなぞって、そのまま押さえる
    const home = await p.evaluate(() => [TOUCH.home.x, TOUCH.home.y, TOUCH.home.R]); const p0 = await p.evaluate(() => [PL.x, PL.z]);
    await down(1, home[0], home[1]); for (let k = 1; k <= 8; k++) { await move(1, home[0], home[1] - home[2] * 0.95 * k / 8); await p.waitForTimeout(25); }
    await p.waitForTimeout(1300); await shot('walk'); await up(1); await p.waitForTimeout(300);
    const p1 = await p.evaluate(() => [PL.x, PL.z]); ok(`歩く：スティックをなぞると歩く（${Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(1)}m）`, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.8);

    // 調べる：調べられる物の前に立って、調べるボタン
    await set(() => { const R = G.room, l = R.looks.find(q => !q.cond || condOK(q.cond)); const a = Math.atan2(PL.x - l.p[0], PL.z - l.p[1]); for (const d of [0.5, 0.7, 0.9]) { const x = l.p[0] + Math.sin(a) * d, z = l.p[1] + Math.cos(a) * d; if (standAt(R, x, z, PL.y, 0.28, 'pl') != null) { PL.x = x; PL.z = z; break; } } PL.ang = Math.atan2(l.p[0] - PL.x, l.p[1] - PL.z); });
    const actB = await btn('act'); await tap(...actB, 400); ok('調べる：右下のボタンで調べると、言葉が出る', await until(() => !!G.msg)); await shot('look');
    for (let k = 0; k < 8 && await p.evaluate(() => !!G.msg); k++) await tap(...center, 300);
    ok('言葉：画面をたたくと閉じる', await until(() => !G.msg));

    // 撃つ：構えるボタンを押さえたまま、調べるボタンを別の指で
    const s0 = await p.evaluate(() => G.shots), aimB = await btn('aim');
    await down(2, ...aimB); await p.waitForTimeout(450); await down(3, ...actB); await p.waitForTimeout(80); await up(3); await p.waitForTimeout(300); await shot('fire'); await up(2); await p.waitForTimeout(300);
    ok('撃つ：構えるボタンを押さえて、調べるボタンで撃つ', await p.evaluate(s0 => G.shots > s0, s0));

    // 持ち物
    await set(() => { G.inv[1] = { id: 'herb_g', n: 1 }; G.files = ['guard', 'kuga']; G.maps['1F'] = true; });
    await tap(...await btn('menu'), 500); ok('持ち物ボタン：持ち物の画面が開く', await until(() => G.ui && G.ui.k === 'menu')); await shot('menu');
    await press('inv:1', 400); ok('持ち物：枠をたたくと、使い道が出る', await until(() => G.ui && !!G.ui.act));
    await press('do:調べる', 400); ok('持ち物：「調べる」で説明が出る', await until(() => G.ui && !!G.ui.ex)); await shot('menu_ex');
    await tap(...center, 400); ok('持ち物：説明はたたくと閉じる', await until(() => G.ui && !G.ui.ex));
    await press('tab:ファイル', 400); ok('ファイル：つまみで切りかわる', await until(() => G.ui && G.ui.tab === 'file'));
    await press('file:guard', 400); ok('ファイル：たたくと読める', await until(() => G.ui && G.ui.page === 0)); await shot('file');
    for (let k = 0; k < 8 && await p.evaluate(() => G.ui && G.ui.page != null); k++) await press('page:次', 300);
    ok('ファイル：「次」で最後までめくれる', await until(() => G.ui && G.ui.page == null));
    await press('tab:地図', 400); ok('地図：つまみで切りかわる', await until(() => G.ui && G.ui.tab === 'map')); await shot('map');
    await press('tab:閉じる', 400); ok('持ち物：「閉じる」で閉じる', await until(() => !G.ui));
    await tap(...await btn('map'), 500); ok('地図ボタン：地図が開く', await until(() => G.ui && G.ui.tab === 'map'));
    await press('tab:閉じる', 400); await until(() => !G.ui);

    // 選択肢
    await set(() => { window._ans = null; ask('（指で選ぶテスト）\nどちらを選びますか？', ['はい', 'いいえ'], i => { window._ans = i; }); });
    await until(() => G.msg && G.msg.ch >= G.msg.pages[G.msg.i].length); await shot('choice');
    await press('choice:いいえ', 400); ok('選択肢：「いいえ」をたたいて選べる', await until(() => window._ans === 1));

    // アイテムボックスと記録（使用人部屋）
    await set(() => { enterRoom('servant', { x: 0, z: 0, ang: 0 }); G.fade = 0; G.fadeTo = null; G.inv = [{ id: 'hg', n: 1 }, { id: 'herb_g', n: 1 }, { id: 'ribbon', n: 2 }, null, null, null, null, null]; G.box = []; });
    const face = id => set(id => { const R = G.room, a = R.acts.find(q => q.id === id); for (const d of [0.55, 0.7, 0.85]) for (let k = 0; k < 16; k++) { const an = k / 16 * TAU, x = a.p[0] + Math.sin(an) * d, z = a.p[1] + Math.cos(an) * d; if (standAt(R, x, z, 0, 0.29, 'pl') == null) continue; PL.x = x; PL.z = z; PL.ang = Math.atan2(a.p[0] - x, a.p[1] - z); const t = actTarget(); if (t && t.k === 'act' && t.a === a) return true; } return false; }, id);
    await p.waitForTimeout(600);
    await face('box'); await tap(...actB, 500); ok('アイテムボックス：調べるボタンで開く', await until(() => G.ui && G.ui.k === 'box')); await shot('box');
    await press('binv:1', 400); ok('アイテムボックス：持ち物をたたいて預ける', await until(() => G.box.some(q => q.id === 'herb_g') && !invHas('herb_g')));
    await press('box:0', 400); ok('アイテムボックス：箱の物をたたいて出す', await until(() => invHas('herb_g')));
    await press('閉じる', 400); ok('アイテムボックス：「閉じる」で閉じる', await until(() => !G.ui));
    await face('type'); await tap(...actB, 500); await until(() => G.msg && G.msg.o.choice && G.msg.ch >= G.msg.pages[G.msg.i].length);
    await press('choice:はい', 500); ok('記録：タイプライターで「はい」→ 記録の画面', await until(() => G.ui && G.ui.k === 'save')); await shot('save');
    await press('slot:0', 600); ok('記録：記録1をたたくと記録される', await until(() => G.saves >= 1 && !G.ui));
    for (let k = 0; k < 5 && await p.evaluate(() => !!G.msg); k++) await tap(...center, 300);

    // 合言葉（研究所の端末）
    await set(() => { G.inv.push({ id: 'idcard', n: 1 }); G.ui = { k: 'pass', text: '', sel: 0 }; }); await p.waitForTimeout(300); await shot('pass');
    for (const ch of 'SAYO') await press('key:' + ch, 200);
    await press('key:決定', 400); ok('合言葉：キーをたたいて打ちこめる', await until(() => flag('password')));
    for (let k = 0; k < 5 && await p.evaluate(() => !!G.msg); k++) await tap(...center, 300);

    // 死んで、記録から続ける
    await set(() => { killPlayer('test'); }); ok('死ぬ：倒れて、死んだ画面になる', await until(() => G.mode === 'dead', 10000));
    await until(() => G.deathT > 3.5, 8000); await shot('dead');
    await press('dead:最後に記録した所から', 600); ok('死んだ画面：「最後に記録した所から」をたたく', await until(() => G.ui && G.ui.k === 'load'));
    await press('slot:0', 800); ok('読み込み：記録1をたたくと、記録した所から続く', await until(() => G.mode === 'play' && G.rid === 'servant', 10000));

    // 設定（タイトルから）
    await set(() => toTitle()); await p.waitForTimeout(800);
    await press('title:設定', 500); ok('設定：タイトルの「設定」をたたくと開く', await until(() => G.ui && G.ui.k === 'opts')); await shot('opts');
    const b0 = await p.evaluate(() => OPT.bright);
    for (let k = 0; k < 5; k++) await press('opt:画面の明るさ', 250);
    ok('設定：明るさをたたくと一段ずつ変わり、上まで行くと下へもどる（指だけで上げ下げできる）', await p.evaluate(b0 => OPT.bright === b0, b0));
    await press('opt:もどる', 400); ok('設定：「もどる」で閉じる', await until(() => !G.ui));

    // つづきから
    await press('title:つづきから', 500); ok('つづきから：記録を選ぶ画面が出る', await until(() => G.ui && G.ui.k === 'load'));
    await press('slot:0', 800); ok('つづきから：記録1をたたくと続きから遊べる', await until(() => G.mode === 'play' && G.rid === 'servant', 10000));

    // 成績 → タイトル
    await set(() => finishGame()); await until(() => G.ui && G.ui.k === 'results'); await until(() => G.ui && G.ui.t > 1.6, 6000); await shot('results');
    await tap(...center, 500); ok('成績：たたくとタイトルへもどる', await until(() => G.mode === 'title' && !G.ui));

    ok('エラーが出ていない', !errs.length);
    console.log(`${name}（${vw}×${vh}）\n` + lines.join('\n') + (errs.length ? '\n  エラー：' + [...new Set(errs)].slice(0, 5).join(' / ') : ''));
    await ctx.close();
  }
  console.log(bad ? `指で動かせない所が ${bad} か所` : 'スマホ：指だけで最後まで動かせる');
  await b.close(); process.exit(bad ? 1 : 0);
})();

// 自動プレイでバグを探すボット。
// 使い方: node tests/bot.js [回数=4] [1回あたりの手数=600] [幅x高さ=390x844]
// 村→潜る→探索・戦闘・階段・モーダル操作を自動で繰り返し、JSエラーと操作不能（ソフトロック）を報告する。
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const RUNS = +process.argv[2] || 4;
const STEPS = +process.argv[3] || 600;
const [VW, VH] = (process.argv[4] || '390x844').split('x').map(Number);
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = process.env.BOT_OUT || path.resolve(__dirname, 'out');

// ページ内で動く1手分の判断。状態を文字列で返す。
function botTick() {
  const $ = id => document.getElementById(id);
  const ret = $('ret');
  if (ret) { ret.click(); return 'ret'; }
  const modal = $('modal');
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const BAD = /消去|リセット|初期化|全部消す|削除|協力|ホスト|参加|コピー|貼り付け/;
  if (modal && modal.innerHTML) {
    const bs = [...modal.querySelectorAll('button')].filter(b => !b.disabled && b.offsetParent && !BAD.test(b.textContent));
    // 村では「潜る」系を優先
    const dive = bs.find(b => /^(潜る|同じ構成ですぐ潜る|探索の続きから)/.test(b.textContent.trim()));
    if (dive && Math.random() < .45) { dive.click(); return 'modal:' + dive.textContent.trim().slice(0, 12); }
    const inputs = modal.querySelectorAll('input');
    inputs.forEach(i => { if (!i.value) i.value = 'テスト'; });
    if (bs.length) { const b = rnd(bs); b.click(); return 'modal:' + b.textContent.trim().slice(0, 12); }
    return 'modal-stuck';
  }
  if (typeof G === 'undefined' || !G) return 'noG';
  if (G.over) return 'over';
  if (typeof DEF !== 'undefined' && DEF) {
    if (!DEF.input && performance.now() > DEF.impact - DEF.win * .6) defInput(DEF.peril ? 'swipe' : 'tap', 1);
    return 'def';
  }
  if (G.fishing) { if (Math.random() < .3) fishInput(); return 'fish'; }
  if (G.sheet && G.sheet != 'closed') { closeSheet(); return 'sheet'; }
  if (G.busy) return 'busy';
  if (G.fight) {
    const its = G.bag.items;
    const ws = its.map((p, i) => [p, i]).filter(([p]) => ITEM[p.id].weapon && !p.out);
    const ok = ws.filter(([p]) => reachOK(p.id));
    const r = Math.random();
    const fb = [...document.querySelectorAll('#frow button')].filter(b => !b.disabled);
    if (fb.length && (!ok.length || r < .08)) { const b = rnd(fb); b.click(); return 'frow:' + b.textContent; }
    if (ok.length && r < .8) { act(rnd(ok)[1]); return 'atk'; }
    if (r < .9) { const d = [[1, 0], [-1, 0], [0, 1], [0, -1]]; step(...rnd(d)); return 'fmove'; }
    const any = its.map((p, i) => i).filter(i => !ITEM[its[i].id].tre && !ITEM[its[i].id].passive);
    if (any.length) { act(rnd(any)); return 'use'; }
    fists(); return 'fists';
  }
  // 探索: 足元に機能があれば使う
  try {
    const m = mainAction && mainAction();
    if (m && m.f && Math.random() < (m.ic == 'down' ? .9 : .5)) { m.f(); return 'main:' + (m.t || m.ic); }
  } catch (e) { return 'mainErr:' + e.message; }
  if (Math.random() < .04) { const i = Math.floor(Math.random() * G.bag.items.length); if (G.bag.items[i]) { slotUse(i); return 'slot'; } }
  // 階段へBFS、なければ未探索方向へ
  const p = G.p, goal = G.down || G.exit;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let dir = null;
  if (goal && Math.random() < .85) {
    const key = (x, y) => x + ',' + y, prev = new Map([[key(p.x, p.y), null]]), q = [[p.x, p.y]];
    while (q.length) {
      const [x, y] = q.shift(); if (x == goal[0] && y == goal[1]) break;
      for (const [dx, dy] of dirs.slice(0, 4)) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (prev.has(k) || !walk(nx, ny)) continue; prev.set(k, [x, y]); q.push([nx, ny]); }
    }
    let c = [goal[0], goal[1]];
    if (prev.has(key(...c))) { while (prev.get(key(...c)) && (prev.get(key(...c))[0] != p.x || prev.get(key(...c))[1] != p.y)) c = prev.get(key(...c)); dir = [c[0] - p.x, c[1] - p.y]; }
  }
  if (!dir) dir = rnd(dirs);
  step(dir[0], dir[1]);
  return 'step';
}

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { errors: [], locks: [], stats: {} };
  for (let run = 0; run < RUNS; run++) {
    const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, hasTouch: false });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|ERR_CERT|fonts/.test(m.text())) errs.push('console: ' + m.text()); });
    // テスト時だけ、握りつぶされている例外も記録する
    const html = require('fs').readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8')
      .replace(/catch\((e|er|err)\)\{\}/g, (m, v) => `catch(${v}){window.__sw&&window.__sw(${v})}`)
      .replace('<head>', '<head><script>window.__swl=[];window.__sw=e=>{try{const k=String(e&&e.message||e)+" @ "+String(e&&e.stack||"").split("\\n")[1];if(!/localStorage|JSON|Unexpected token|is not valid JSON|null/.test(k)||1)window.__swl.push(k)}catch(_){}}</script>');
    await ctx.route(FILE, r => r.fulfill({ body: html, contentType: 'text/html; charset=utf-8' }));
    await page.goto(FILE);
    await page.waitForTimeout(600);
    // START=階 で深い階から始める。GOD=1 で倒れないようにして奥まで見る
    const START = +process.env.START || 0, GOD = !!process.env.GOD;
    if (START) await page.evaluate(sf => { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, sf); }, START);
    let same = 0, lastSig = '', maxF = 0, dives = 0, deaths = 0, escapes = 0;
    for (let s = 0; s < STEPS; s++) {
      let r;
      if (GOD) await page.evaluate(() => { if (typeof G != 'undefined' && G && G.p && !G.over) G.p.hp = G.p.max; });
      try { r = await page.evaluate(botTick); } catch (e) { errs.push('evaluate: ' + e.message); break; }
      if (r.startsWith('mainErr')) errs.push(r);
      // 帰還と死亡の流れも必ず通す
      if (s === Math.floor(STEPS * .35) || s === Math.floor(STEPS * .75)) await page.evaluate(() => { if (G && !G.over && !G.fight && !document.getElementById('modal').innerHTML) { G.busy = false; escape(); } });
      if (s === Math.floor(STEPS * .55)) await page.evaluate(() => { if (G && !G.over) { G.p.hp = 1; G.lastHit = 'テスト'; if (!G.fight) die(); } });
      const sig = await page.evaluate(() => typeof G == 'undefined' || !G ? 'x' : [G.fi, G.p && G.p.x, G.p && G.p.y, G.p && G.p.hp, !!G.fight, G.over, !!(typeof DEF != 'undefined' && DEF), document.getElementById('modal').innerHTML.length, G.fight ? G.fight.foes.map(f => f.hp).join() : ''].join('|'));
      const fi = await page.evaluate(() => (typeof G != 'undefined' && G && G.fi) || 0);
      maxF = Math.max(maxF, fi + 1);
      if (/modal:(潜る|同じ構成)/.test(r)) dives++;
      report.stats[r.split(':')[0]] = (report.stats[r.split(':')[0]] || 0) + 1;
      if (sig === lastSig) same++; else { same = 0; lastSig = sig; }
      if (same === 60) {
        const shot = path.join(OUT, `lock-${VW}x${VH}-r${run}-s${s}.png`);
        await page.screenshot({ path: shot });
        // 本当に固まっているか: 3秒待っても busy が解けないか確かめる
        await page.waitForTimeout(3000);
        const info = await page.evaluate(() => ({ busy: G.busy, x: G.p.x, y: G.p.y, cur: !!(G.cur && G.cur.cells && G.cur.cells.has && G.cur.cells.has(G.p.x + ',' + G.p.y)), fight: !!G.fight, over: G.over, sheet: G.sheet, map: G.map, modal: document.getElementById('modal').innerText.slice(0, 200) }));
        report.locks.push({ run, s, last: r, info, shot });
        await page.evaluate(() => { if (G) { G.busy = false; } });
      }
      await page.waitForTimeout(r === 'def' ? 30 : r === 'busy' ? 60 : 70);
    }
    try { const sw = await page.evaluate(() => window.__swl); sw.forEach(k => errs.push('swallowed: ' + k)); } catch (e) {}
    report.errors.push(...errs.map(e => `[run${run}] ${e}`));
    console.log(`run ${run}: 最深 ${maxF}F / 潜った ${dives} 回 / エラー ${errs.length}`);
    await ctx.close();
  }
  await browser.close();
  const uniq = [...new Set(report.errors.map(e => e.replace(/^\[run\d+\] /, '')))];
  console.log('--- 行動の内訳', JSON.stringify(report.stats));
  console.log('--- エラー（重複除く）', uniq.length); uniq.forEach(e => console.log('  ' + e));
  console.log('--- 操作不能', report.locks.length); report.locks.forEach(l => console.log('  ', JSON.stringify(l)));
  process.exitCode = uniq.length || report.locks.length ? 1 : 0;
})();

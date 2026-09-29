// 見つけたバグを一つずつ狙って再現する回帰テスト。
// 使い方: node tests/regress.js [html=index.html]
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const FILE = 'file://' + path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));

const cases = {
  // レシピ本と村の飾りがリロードで消えない
  async 'レシピと飾りの保存が残る'(p) {
    await p.evaluate(() => { localStorage.setItem('yw65_rec', JSON.stringify({ potion2: 1 })); localStorage.setItem('yw63_deco', JSON.stringify([{ id: 'potion', x: 8, y: 14 }])); });
    await p.reload(); await p.waitForTimeout(400);
    const r = await p.evaluate(() => [RECIPE.potion2, decoI.length]);
    if (r[0] !== 1 || r[1] !== 1) throw new Error('読み込まれていない: ' + JSON.stringify(r));
  },
  // 敵の先手の待ちの間に相手が消えても、操作が戻る
  async '先手の途中で敵が消えても固まらない'(p) {
    await dive(p);
    await p.evaluate(() => { const f = foeNext(); startFight([f], 'enemy', 1); setTimeout(() => { f.hp = 0; G.fight.foes = []; }, 50); });
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => ({ busy: G.busy, fight: !!G.fight }));
    if (r.busy) throw new Error('busy のまま: ' + JSON.stringify(r));
  },
  // 糸で縛られて武器が届かなくても、取れる行動がある
  async '糸で縛られても詰まない'(p) {
    await dive(p);
    await p.evaluate(() => { const f = foeNext(2); startFight([f], 'first', 2); });
    await p.waitForTimeout(1200);
    await p.evaluate(() => { G.fight.webbed = 2; G.fight.dist = 3; G.busy = false; ui(); });
    const btn = await p.$('#frow button:not([disabled])');
    const labels = await p.$$eval('#frow button', bs => bs.map(b => b.textContent));
    if (!labels.includes('もがく')) throw new Error('もがくが無い: ' + labels);
  },
  // 階の題字と説明の一言が重ならない
  async '題字の間は一言を待たせる'(p) {
    await dive(p);
    await p.waitForTimeout(800);
    const during = await p.evaluate(() => [!!G.title, getComputedStyle(document.getElementById('toast')).opacity]);
    if (during[0] && +during[1] > 0.05) throw new Error('題字の最中に一言が出ている');
    await p.waitForTimeout(5200);
    const after = await p.evaluate(() => +getComputedStyle(document.getElementById('toast')).opacity);
    if (after < 0.5) throw new Error('題字の後に一言が出ていない');
  },
  // 流れの上に階段が来ても、乗れば降りられる
  async '流れの中の階段から降りられる'(p) {
    const r = await p.evaluate(async () => {
      let found = 0, placed = 0;
      for (let i = 0; i < 400 && found < 5; i++) {
        document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, [1, 9, 12, 15][i % 4]);
        if (G.cur && G.down && G.cur.cells.has(G.down.join(','))) placed++;
        // 生成で避けていても、安全網を確かめるため、階段を無理やり流れに入れる
        if (!G.cur || !G.down) continue;
        const [x, y] = G.down; if (!(G.water[y] && G.water[y][x])) continue;
        G.cur.cells.add(x + ',' + y); G.cur.spd = 3; G.foes = [];
        const [a, b] = [-G.cur.dir[0], -G.cur.dir[1]]; if (!walk(x + a, y + b)) continue;
        found++; G.p.x = x + a; G.p.y = y + b; G.busy = false; G.title = null;
        await step(-a, -b); for (let k = 0; k < 60 && G.busy; k++) await new Promise(r => setTimeout(r, 50));
        const ma = mainAction(); if (!(ma && ma.ic == 'down')) return 'SAFETY:流されて降りられない';
      }
      return placed ? 'GEN:流れの上に階段が作られた（' + placed + '）' : found ? 'ok' : 'NONE';
    });
    if (r !== 'ok') throw new Error(r);
  },
  // 待っても、戦っても、環境の時間（火など）は進む
  async '待つと火が燃え広がる'(p) {
    await dive(p);
    const r = await p.evaluate(async () => { G.title = null; const P = G.p; G.oil = new Set(); for (const [a, b] of DIRS8) G.oil.add((P.x + a) + ',' + (P.y + b));
      const c = DIRS.map(([a, b]) => [P.x + a, P.y + b]).find(([x, y]) => walk(x, y)); ignite(c[0], c[1]); const n0 = G.fires.length;
      G.busy = false; await doWait(); return [n0, G.fires.length]; });
    if (!(r[1] > r[0])) throw new Error('待っても火が広がらない: ' + r);
  },
  // 蔦・ひび割れた壁・燭台の門が、道具で開く
  async '環境で開く門'(p) {
    for (const type of ['vine', 'crack', 'brazier']) {
      const res = await p.evaluate(async t => {
        let g = null; for (let i = 0; i < 400 && !g; i++) { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, 5); g = G.gim.find(q => q.type == t); }
        if (!g) return 'NONE'; G.foes = []; G.title = null;
        const pk = new Set(g.pocket.map(q => q + '')); const c = DIRS.map(([a, b]) => [g.x + a, g.y + b]).find(([x, y]) => walk(x, y) && !pk.has(x + ',' + y));
        G.p.x = c[0]; G.p.y = c[1]; G.items = G.items.filter(i => !(i.x == G.p.x && i.y == G.p.y)); G.srcs = (G.srcs || []).filter(q => !(q.x == G.p.x && q.y == G.p.y)); const add = id => { const f = firstFit(id); if (f) G.bag.items.push({ id, ...f, inst: makeInst(id) }) }; add(t == 'crack' ? 'bomb' : 'torch');
        if (passGim(g)) return '最初から通れる';
        if (t == 'brazier') { for (const b of g.brz) lightBrazier(g, b) } else { const m = mainAction(); if (!m) return '行動が出ない'; m.f() }
        for (let k = 0; k < 6 && !g.open; k++) { G.p.hp = G.p.max; G.busy = false; await doWait(); for (let w = 0; w < 50 && G.busy; w++) await new Promise(r => setTimeout(r, 40)) }
        return g.open && passGim(g) ? 'ok' : '開かない';
      }, type);
      if (res !== 'ok') throw new Error(type + ': ' + res);
    }
  },
  // 亡骸に隠れた古代の鞄を漁っても落ちない
  async '古代の鞄を漁れる'(p) {
    const r = await p.evaluate(() => { for (let i = 0; i < 60; i++) { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, 1); const it = G.items.find(q => q.hid && q.id.startsWith('bag:')); if (!it) continue; const s = G.srcs.find(q => q.x == it.x && q.y == it.y); searchSrc(s); return document.getElementById('toast').textContent } return 'NONE' });
    if (r === 'NONE' || !/鞄/.test(r)) throw new Error('結果: ' + r);
  },
  // 仲間と倉庫が、開き直しても消えない（後から登録される仲間・ボスの武器も）
  async '仲間と倉庫が残る'(p) {
    await p.evaluate(() => { farm = [{ k: 'kagebi', name: '影灯', trips: 1 }, { k: 'gob', name: 'ゴブリン', trips: 0 }, { k: 'puru', name: 'ぷる', trips: 0 }]; wh = [{ id: 'hakamori' }, { id: 'axe' }, { id: 'potion' }]; saveMeta(); });
    await p.reload(); await p.waitForTimeout(500);
    const r = await p.evaluate(() => [farm.map(f => f.k).join(), wh.map(i => i.id).join()]);
    if (r[0] !== 'kagebi,gob,puru' || r[1] !== 'hakamori,axe,potion') throw new Error('消えた: ' + JSON.stringify(r));
  },
  // 引き継ぎコードで、別のブラウザに記録を移せる
  async '引き継ぎコード'(p) {
    const r = await p.evaluate(() => { gold = 777; farm = [{ k: 'fushicho', name: '不死鳥', trips: 0 }]; saveMeta(); const c = saveCode(); const o = loadCode(c); return [o.yw7_gold, JSON.parse(o.yw4_farm)[0].k] });
    if (r[0] !== '777' || r[1] !== 'fushicho') throw new Error(JSON.stringify(r));
  },
  // 化学反応：どの障害にも答えがある
  async '氷と雷の解決策'(p) {
    const r = await p.evaluate(async () => {
      const give = id => { const f = firstFit(id); if (f) G.bag.items.push({ id, ...f, inst: makeInst(id) }) };
      const floorWith = (c, sf) => { for (let i = 0; i < 500; i++) { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, sf || 12); G.title = null; G.foes = []; if (c()) return true } return false };
      const bad = [];
      if (floorWith(() => G.cur && G.cur.cells && G.cur.cells.size >= 4)) { const k = [...G.cur.cells][0].split(',').map(Number); G.p.x = k[0]; G.p.y = k[1]; give('hyouka'); slotUse(G.bag.items.findIndex(q => q.id == 'hyouka')); if (curAt(k[0], k[1])) bad.push('凍らせても流れが残る') }
      if (floorWith(() => G.cur && G.cur.cells && G.cur.cells.size >= 4)) { const k = [...G.cur.cells][0].split(',').map(Number); G.p.x = k[0]; G.p.y = k[1]; while (bagUsed() < Math.ceil(bagCap() * .75) && firstFit('gem')) give('gem'); if (curPush(G.p, true)) bad.push('重い荷物でも流される') }
      if (floorWith(() => G.volts && G.volts.length, 15)) { const v = G.volts[0]; const w = DIRS8.map(([a, b]) => [v.x + a, v.y + b]).find(([x, y]) => inWater(x, y)); if (w) { G.p.x = w[0]; G.p.y = w[1]; G.p.hp = 30; for (let k = 0; k < 3; k++) { G.busy = false; await doWait() } if (G.p.hp >= 30) bad.push('放電石の水で感電しない'); G.p.hp = 30; give('boots'); for (let k = 0; k < 3; k++) { G.busy = false; await doWait() } if (G.p.hp < 30) bad.push('長靴でも感電する'); G.bag.items = G.bag.items.filter(q => q.id != 'boots'); freezeAt(w[0], w[1], 0); for (let k = 0; k < 3; k++) { const m = mainAction(); if (m && m.t == '放電石を砕く') m.f() } if (v.hp > 0) bad.push('氷の上から砕けない') } }
      for (const [t, tool] of [['crack', 'hammer'], ['vine', 'v_poison'], ['volt', 'raika']]) { if (!floorWith(() => G.gim.some(g => g.type == t), 5)) continue; const g = G.gim.find(g => g.type == t); const pk = new Set(g.pocket.map(q => q + '')); const c = DIRS.map(([a, b]) => [g.x + a, g.y + b]).find(([x, y]) => walk(x, y) && !pk.has(x + ',' + y)); G.p.x = c[0]; G.p.y = c[1]; G.items = G.items.filter(i => !(i.x == c[0] && i.y == c[1])); G.srcs = []; give(tool);
        if (t == 'crack') for (let k = 0; k < 3; k++) { const m = mainAction(); if (m && m.t == '槌で壁を叩く') { m.f(); for (let w = 0; w < 40 && G.busy; w++) await new Promise(r => setTimeout(r, 30)) } }
        if (t == 'vine') { spill(G.p.x, G.p.y, 'gas', 5); for (let k = 0; k < 2; k++) { G.busy = false; await doWait() } }
        if (t == 'volt') slotUse(G.bag.items.findIndex(q => q.id == 'raika'));
        if (!g.open) bad.push(t + 'が開かない') }
      return bad.join(' / ') || 'ok' });
    if (r !== 'ok') throw new Error(r);
  },
  // 誤字
  async '誤字が無い'(p) {
    const html = require('fs').readFileSync(FILE.replace('file://', ''), 'utf8');
    if (/[가-힯]/.test(html)) throw new Error('ハングルが混ざっている');
  },
  // 帰還と倒れたの演出が出て、タップで閉じられる
  async '帰還と倒れたの演出'(p) {
    await dive(p);
    await p.evaluate(() => escape());
    if (!await p.$('#ret')) throw new Error('帰還の画面が出ない');
    // 1回目で演出を飛ばし、2回目で閉じる（演出が終わっていれば1回目で閉じる）
    await p.evaluate(() => { const r = document.getElementById('ret'); r.click(); const r2 = document.getElementById('ret'); if (r2 && !r2.classList.contains('out')) r2.click(); });
    await p.waitForTimeout(400);
    if (await p.$('#ret')) throw new Error('帰還の画面が閉じない');
    await dive(p);
    await p.evaluate(() => die());
    if (!await p.$('#ret.fall')) throw new Error('倒れたの画面が出ない');
  },
};

async function dive(p) {
  await p.evaluate(() => { document.getElementById('modal').innerHTML = ''; const r = document.getElementById('ret'); if (r) r.remove(); newRaid(null, [], null, 0); });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    // 隣（または n マス先）の空きマスに敵を置く
    window.foeNext = (n = 1) => { const P = G.p; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let ok = true; for (let k = 1; k <= n; k++) if (!walk(P.x + a * k, P.y + b * k)) ok = false; if (!ok) continue; const f = mkFoe('slime', P.x + a * n, P.y + b * n, 0); f.rx = f.x * T; f.ry = f.y * T; G.foes.push(f); return f; } throw new Error('置き場所がない'); };
  });
}

(async () => {
  const browser = await chromium.launch();
  let fail = 0;
  for (const [name, fn] of Object.entries(cases)) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(/fonts\.g/, r => r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(FILE); await p.waitForTimeout(500);
    try { await fn(p); if (errs.length) throw new Error('JSエラー: ' + errs.join(' / ')); console.log('✓', name); }
    catch (e) { fail++; console.log('✗', name, '—', e.message); }
    await ctx.close();
  }
  await browser.close();
  console.log(fail ? `${fail} 件失敗` : 'すべて通過');
  process.exitCode = fail ? 1 : 0;
})();

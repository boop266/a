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

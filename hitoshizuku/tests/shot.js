// 開発用：場面を開いて、操作をいくつか流し、写真をとる
//   node tests/shot.js <出力.png> [クエリ=scene=0] [幅x高さ=390x844] [台本.js]
//   台本は page を受けとる async 関数（module.exports = async (page) => {...}）
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || 'tests/out/shot.png';
  const qs = process.argv[3] || 'scene=0';
  const [w, h] = (process.argv[4] || '390x844').split('x').map(Number);
  const script = process.argv[5];
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });
  const logs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?' + qs);
  await p.waitForTimeout(1200);
  if (script) await require(path.resolve(script))(p);
  await p.screenshot({ path: out });
  const errs = await p.evaluate(() => (window.HS ? HS.ERRORS : ['no HS']));
  console.log('errors:', JSON.stringify(errs.slice(0, 5), null, 1));
  console.log(logs.slice(0, 10).join('\n'));
  await b.close();
})();

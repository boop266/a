// 写真を1枚にまとめて見る：node yomi/tests/sheet.js <フォルダ> <出力.png> [前置き,前置き...] [列]
const path = require('path'), fs = require('fs'); const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const dir = process.argv[2], out = process.argv[3], pre = process.argv[4] ? process.argv[4].split(',') : null, cols = +(process.argv[5] || 3);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') && (!pre || pre.some(p => f.startsWith(p + '_')))).sort();
(async () => {
  const b = await chromium.launch(); const w = cols * 400 + 20; const p = await b.newPage({ viewport: { width: w, height: 400 } });
  const html = `<body style="margin:0;background:#111;color:#ddd;font:14px sans-serif;display:grid;grid-template-columns:repeat(${cols},400px);gap:4px;padding:6px">` + files.map(f => `<div><img src="file://${path.resolve(dir, f)}" style="width:400px;display:block"><div>${f}</div></div>`).join('') + '</body>';
  await p.setContent(html); await p.waitForTimeout(400); await p.screenshot({ path: out, fullPage: true }); await b.close(); console.log(files.length, 'images');
})();

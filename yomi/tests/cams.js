// 黄泉還：全部の部屋を、全部のカメラで撮る（目で確かめる用）
//   node yomi/tests/cams.js <保存先> [部屋,部屋,...]
const path = require('path'); const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const out = process.argv[2] || require('os').tmpdir(); const only = process.argv[3] ? process.argv[3].split(',') : null;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 800, height: 600 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | '))); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?test&seed=3'); await p.waitForTimeout(800);
  const rooms = await p.evaluate(() => Object.keys(YOMI.ROOMS));
  for (const r of rooms) {
    if (only && !only.includes(r)) continue;
    const ncam = await p.evaluate(r => { YOMI.go(r, 0, 0); return YOMI.G.room.cams.length; }, r);
    for (let i = 0; i < ncam; i++) {
      const info = await p.evaluate(([r, i]) => {
        const R = YOMI.G.room, c = R.cams[i]; const z = c.zs ? c.zs[0] : c.z; let x = 0, zz = 0, y = c.lv ? c.lv[0] + 0.05 : 0;
        if (z) { x = (z[0] + z[2]) / 2; zz = (z[1] + z[3]) / 2; }
        // 立てる場所をさがす
        let best = null; for (let k = 0; k < 400 && !best; k++) { const a = k * 2.39996, rr = Math.sqrt(k) * 0.25; const tx = x + Math.cos(a) * rr, tz = zz + Math.sin(a) * rr; const yy = standAt(R, tx, tz, y, 0.28, 'pl'); if (yy != null && (!z || inR(z, tx, tz)) && (!c.lv || (yy >= c.lv[0] && yy <= c.lv[1]))) best = [tx, tz, yy]; }
        if (best) { PL.x = best[0]; PL.z = best[1]; PL.y = best[2]; }
        G.cam = c; G.camOv = c.event ? { cam: c.cam } : null; PL.ang = Math.atan2(c.p[0] - PL.x, c.p[2] - PL.z);
        for (let k = 0; k < 30; k++) { updRoom(1 / 60); poseRyo(PL.h, PL.st, 1 / 60); }
        YOMI.render(); G.camOv = null; return { name: R.D.name, id: c.id || i, at: best };
      }, [r, i]);
      await p.screenshot({ path: path.join(out, `${r}_${i}.png`) });
      console.log(r, i, info.name, info.at ? info.at.map(v => v.toFixed(2)).join(',') : '立てる所なし');
    }
  }
  console.log(errs.length ? 'エラー:\n' + [...new Set(errs)].slice(0, 30).join('\n') : 'エラーなし');
  await b.close();
})();

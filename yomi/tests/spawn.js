// 黄泉還：敵が出てくる所・現れる所が、立てる所にあるか（家具や壁に体が食いこんで、動けなくならないか）
//   ・ふつうの敵 … 出てくる所に立てること
//   ・隠れている敵（衣装棚・水槽の中など）… 現れる所（revealAt）に立てること
//   ・座っている・倒れている・かがんでいる敵 … 食いこんでいてよいが、立ち上がったとき近くに出られる所があること
//   node yomi/tests/spawn.js
const path = require('path'); const { execFileSync } = require('child_process');
const { chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 320, height: 240 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?test&seed=3'); await p.waitForTimeout(500);
  const res = await p.evaluate(() => {
    const out = []; let n = 0;
    for (const rid of Object.keys(ROOMS)) { const D = ROOMS[rid]; if (!D.enemies || !D.enemies.length) continue; YOMI.go(rid, 0, 0); const R = G.room;
      const ok = (x, z, rad) => standAt(R, x, z, 0, rad, 'enemy') != null || [0, 0.5, 1, 2, 3, 4, 5].some(y => standAt(R, x, z, y, rad, 'enemy') != null);
      const nearOK = (x, z, rad) => { for (let r = 0.05; r <= 1.0; r += 0.05) for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; if (ok(x + Math.sin(a) * r, z + Math.cos(a) * r, rad)) return true; } return false; };
      for (const d of D.enemies) { n++; const rad = ESPEC[d.t].rad, nm = `${rid} ${d.key || d.t}（${d.t}）`;
        if (d.hidden) { if (!d.revealAt) out.push(`× ${nm}：隠れている敵に、現れる所（revealAt）がない`); else if (!ok(d.revealAt[0], d.revealAt[1], rad)) out.push(`× ${nm}：現れる所 ${d.revealAt} に立てない`); }
        else if (['sit', 'lie', 'eat'].includes(d.st)) { if (!ok(d.x, d.z, rad) && !nearOK(d.x, d.z, rad)) out.push(`× ${nm}：${d.st} から立ち上がっても、出られる所がない`); }
        else if (!ok(d.x, d.z, rad)) out.push(`× ${nm}：出てくる所 ${d.x},${d.z} に立てない（家具や壁に食いこむ）`);
      } }
    return { out, n };
  });
  console.log(res.out.length ? res.out.join('\n') : `敵 ${res.n}体：すべて立てる所から出る`);
  console.log(errs.length ? 'エラー:\n' + errs.join('\n') : 'エラーなし');
  await b.close(); process.exit(res.out.length || errs.length ? 1 : 0);
})();

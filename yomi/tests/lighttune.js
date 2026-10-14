// 黄泉還：暗すぎる部屋を見つけて、まわりの明るさ（amb）を目標に合わせる値を出す
//   node yomi/tests/lighttune.js        … 各部屋の明るさ（カメラごとの平均）を出す
//   node yomi/tests/lighttune.js tune   … 目標より暗い部屋の amb の強さを探して出す（ファイルは書きかえない）
const path = require('path'); const { execFileSync } = require('child_process');
const { chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
const tune = process.argv[2] === 'tune'; const abs_ = Math.abs;
// 目標の明るさ（画面の平均の明るさ、0〜100）。洋館は暗いが見える、研究所は蛍光灯
const TARGET = { hall: 16, dining: 11, wcorr: 8.2, servant: 11.3, kitchen: 19, ecorr: 10, study: 8.5, green: 9.7, w2corr: 8.5, bed: 9, child: 10.9, gallery: 7.5, library: 8.5, cellar: 7.5, boiler: 7.5, keeper: 17, tunnel: 7.5, lab_sec: 20, lab_corr: 23, lab_res: 20, lab_cult: 18, lab_cell: 15, lab_core: 9.1, lab_exit: 8, heliport: 26 };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?test&seed=3'); await p.waitForTimeout(500); await p.evaluate(require('./pagelib.js'));
  await p.evaluate(() => { window._lum = function () { const c = document.getElementById('gl'), cv = document.createElement('canvas'); cv.width = 80; cv.height = 60; const x = cv.getContext('2d'); x.drawImage(c, 0, 0, 80, 60); const d = x.getImageData(0, 0, 80, 60).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; return s / (d.length / 4) / 255 * 100; };
    window._roomLum = function (r, amb) { if (amb) ROOMS[r].amb = amb; YOMI.go(r, 0, 0); const R = G.room; const pts = reachPts(R); let sum = 0, n = 0;
      for (const c of R.cams) { if (c.event) continue; let best = null, bd = 1e9; const z = c.zs ? c.zs[0] : c.z; const cx = z ? (z[0] + z[2]) / 2 : c.t[0], cz = z ? (z[1] + z[3]) / 2 : c.t[2]; for (const q of pts) { if (!camZoneHas(c, q[0], q[2], q[1]) || !camSees(R, c, q[0], q[2], q[1])) continue; const d = hyp(q[0] - cx, q[2] - cz); if (d < bd) { bd = d; best = q; } } if (best) { PL.x = best[0]; PL.y = best[1]; PL.z = best[2]; } G.cam = c; G.camOv = null; for (let k = 0; k < 5; k++) updRoom(1 / 60); RD.U.fade.value = 0; YOMI.render(); sum += _lum(); n++; }
      return n ? sum / n : 0; }; });
  const rooms = await p.evaluate(() => Object.keys(ROOMS).filter(r => !ROOMS[r].cut));
  for (const r of rooms) {
    const amb0 = await p.evaluate(r => ROOMS[r].amb || ['#4a4038', 0.6], r); const L0 = await p.evaluate(r => _roomLum(r), r);
    let line = `${r.padEnd(9)} 明るさ ${L0.toFixed(1)}（目標 ${TARGET[r]}） amb ${JSON.stringify(amb0)}`;
    if (tune && abs_(L0 - TARGET[r]) > TARGET[r] * 0.1) {
      let lo = amb0[1] / 8, hi = amb0[1] * 12, best = null;
      for (let k = 0; k < 9; k++) { const mid = (lo + hi) / 2; const L = await p.evaluate(([r, a]) => _roomLum(r, a), [r, [amb0[0], mid]]); if (L < TARGET[r]) lo = mid; else { hi = mid; best = [mid, L]; } }
      if (!best) { const L = await p.evaluate(([r, a]) => _roomLum(r, a), [r, [amb0[0], hi]]); best = [hi, L]; }
      await p.evaluate(([r, a]) => { ROOMS[r].amb = a; }, [r, amb0]);
      line += `  → 強さ ${best[0].toFixed(2)} で ${best[1].toFixed(1)}`;
    }
    console.log(line);
  }
  await b.close();
})();

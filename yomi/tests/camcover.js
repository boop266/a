// 黄泉還：カメラの「映り」を全部の部屋で確かめる
//   ・どこに立っても、ゲームが選ぶカメラに主人公が映るか（画面の外・壁の陰にならないか）
//   ・受け持ちのカメラで映せず、ほかのカメラに頼っている所（作り直しの目安）
//   node yomi/tests/camcover.js [部屋,部屋,...]
const path = require('path'); const { execFileSync } = require('child_process');
const { chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
const only = process.argv[2] ? process.argv[2].split(',') : null;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 400, height: 300 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?test&seed=3'); await p.waitForTimeout(500); await p.evaluate(require('./pagelib.js'));
  const rooms = await p.evaluate(() => Object.keys(YOMI.ROOMS));
  let bad = 0, worstMs = 0;
  for (const r of rooms) {
    if (only && !only.includes(r)) continue;
    const res = await p.evaluate(r => {
      if (ROOMS[r].cut) return { r, skip: true };
      YOMI.go(r, 0, 0); const R = G.room, out = { r, blind: [], borrow: [], n: 0, ms: 0 };
      const pts = reachPts(R); // 歩いて行ける所だけ
      out.n = pts.length; const cams = R.cams.filter(c => !c.event);
      for (const [x, y, z] of pts) {
        const t0 = performance.now(); R.seeCache.clear();
        const seeing = cams.filter(c => camSees(R, c, x, z, y)); out.ms = Math.max(out.ms, performance.now() - t0);
        if (!seeing.length) { // なぜ映らないか：受け持ちのカメラ（なければ近いカメラ）で調べる
          const c = cams.find(c => camZoneHas(c, x, z, y)) || cams[0]; let why = 'c' + c.i + ':';
          _cv.set(x, y + 1.1, z).project(c.cam); if (_cv.z > 1 || _cv.z < -1 || abs(_cv.x) > 0.9 || abs(_cv.y) > 0.92) why += '画面外';
          else { _cp.set(x, y + 1.1, z).sub(c.cam.position); const L = _cp.length(); _crc.set(c.cam.position, _cp.normalize()); _crc.near = 0.05; _crc.far = L - 0.35; const h = _crc.intersectObjects(R.solids, false)[0]; const m = h && h.object.material; why += h ? (m.map ? m.map.name : '#' + m.color.getHexString()) + '@' + h.point.toArray().map(v => v.toFixed(1)).join(',') : '?'; }
          out.blind.push([x, z, y, why]); continue; }
        if (!cams.some(c => camZoneHas(c, x, z, y) && seeing.includes(c))) out.borrow.push([x, z, y, seeing.map(c => c.i).join('/')]);
      }
      return out;
    }, r);
    if (res.skip) { console.log(`${r.padEnd(10)} （場面だけの部屋なので調べない）`); continue; }
    worstMs = Math.max(worstMs, res.ms);
    const ex = a => a.filter((_, k) => k % Math.max(1, Math.floor(a.length / 10)) === 0).slice(0, 10).map(q => `(${q[0].toFixed(1)},${q[1].toFixed(1)}${q[2] ? ' y' + q[2].toFixed(1) : ''}${q[3] != null ? ' ' + q[3] : ''})`).join(' ');
    const line = `${r.padEnd(10)} ${res.n}点  映らない ${res.blind.length}  よそのカメラ頼み ${res.borrow.length}  （1点の判定 最大${res.ms.toFixed(1)}ms）`;
    console.log(line + (res.blind.length ? '\n   映らない例: ' + ex(res.blind) : '') + (res.borrow.length ? '\n   よそ頼みの例: ' + ex(res.borrow) : ''));
    if (res.blind.length) bad++;
  }
  console.log(errs.length ? 'エラー:\n' + [...new Set(errs)].join('\n') : 'エラーなし', `\n判定の重さ（全カメラ・1点）最大 ${worstMs.toFixed(1)}ms`, bad ? `\n映らない所のある部屋: ${bad}` : '\nどこに立っても映る');
  await b.close();
})();

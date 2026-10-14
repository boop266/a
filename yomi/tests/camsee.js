// 黄泉還：カメラごとの「映る範囲」を真上から描いた図を作る（カメラの置き場所を決める用）
//   node yomi/tests/camsee.js <保存先> [部屋,部屋,...]
//   1枚に、カメラの数だけ小さな図：明るい点＝そのカメラに映る／白い枠＝受け持ち／赤＝どのカメラにも映らない
const path = require('path'), fs = require('fs'); const { execFileSync } = require('child_process');
const { chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
const out = process.argv[2] || '.'; const only = process.argv[3] ? process.argv[3].split(',') : null;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?test&seed=3'); await p.waitForTimeout(500); await p.evaluate(require('./pagelib.js'));
  const rooms = await p.evaluate(() => Object.keys(YOMI.ROOMS));
  for (const r of rooms) {
    if (only && !only.includes(r)) continue;
    const url = await p.evaluate(r => {
      YOMI.go(r, 0, 0); const R = G.room, cams = R.cams.filter(c => !c.event);
      const xs = R.rects.flatMap(q => [q[0], q[2]]), zs = R.rects.flatMap(q => [q[1], q[3]]), X0 = Math.min(...xs) - 0.5, X1 = Math.max(...xs) + 0.5, Z0 = Math.min(...zs) - 0.5, Z1 = Math.max(...zs) + 0.5;
      const S = Math.min(26, 300 / Math.max(X1 - X0, Z1 - Z0)), PW = (X1 - X0) * S, PH = (Z1 - Z0) * S, n = cams.length;
      const cv = document.createElement('canvas'); cv.width = Math.ceil(PW * n + 10 * (n - 1)); cv.height = Math.ceil(PH + 22); const x = cv.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, cv.width, cv.height);
      const pts = reachPts(R).map(q => [q[0], q[2], q[1]]);
      const see = pts.map(q => cams.map(c => camSeesAt(R, c, q[0], q[1], q[2])));
      const cols = ['#4ad', '#da4', '#4d6', '#d6c', '#6cf', '#fa6', '#9f9', '#f9c'];
      cams.forEach((c, k) => {
        const ox = k * (PW + 10), T = (wx, wz) => [ox + (wx - X0) * S, (wz - Z0) * S];
        x.strokeStyle = '#666'; for (const q of R.rects) { const [a, bb] = T(q[0], q[1]); x.strokeRect(a, bb, (q[2] - q[0]) * S, (q[3] - q[1]) * S); }
        x.fillStyle = '#333'; for (const bk of R.blocks) { if (bk.y > 0.5) continue; const [a, bb] = T(bk.r[0], bk.r[1]); x.fillRect(a, bb, (bk.r[2] - bk.r[0]) * S, (bk.r[3] - bk.r[1]) * S); }
        pts.forEach((q, i) => { const [a, bb] = T(q[0], q[1]); const hi = q[2] > 0.5; x.fillStyle = see[i][k] ? cols[k % cols.length] : see[i].some(Boolean) ? (hi ? '#2a2a3a' : '#2a2a2a') : '#e22'; x.fillRect(a - S * 0.11, bb - S * 0.11, S * 0.22, S * 0.22); });
        x.strokeStyle = '#fff'; x.lineWidth = 1.5; for (const zr of (c.zs || (c.z ? [c.z] : []))) { const [a, bb] = T(zr[0], zr[1]); x.strokeRect(a, bb, (zr[2] - zr[0]) * S, (zr[3] - zr[1]) * S); }
        x.fillStyle = '#5af'; for (const d of R.doors) { const [a, bb] = T(d.pos[0], d.pos[1]); x.fillRect(a - 3, bb - 3, 6, 6); }
        const [cx, cz] = T(c.p[0], c.p[2]), [tx, tz] = T(c.t[0], c.t[2]); x.strokeStyle = '#fff'; x.beginPath(); x.moveTo(cx, cz); x.lineTo(cx + (tx - cx) * 0.4, cz + (tz - cz) * 0.4); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cz, 4, 0, 6.3); x.fill();
        x.font = '12px sans-serif'; x.fillText(`${R.id} cam${c.i}${c.lv ? ' lv' + c.lv.join('~') : ''}`, ox + 2, PH + 16);
      });
      return cv.toDataURL('image/png');
    }, r);
    fs.writeFileSync(path.join(out, `see_${r}.png`), Buffer.from(url.split(',')[1], 'base64'));
    console.log(r);
  }
  await b.close();
})();

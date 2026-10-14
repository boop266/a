// 黄泉還：調べるボタンで、向いている物がちゃんと選ばれるか（全部の部屋の、拾う物・調べる所・扉）
//   その物の前に立って向いたとき、ボタンで「その物」が選ばれるかを、立てる所ぜんぶから確かめる。
//   ・どこから向いても選ばれない物 … ×（ボタンでは触れない：不具合）
//   ・いちばん近くから向いて選ばれない物 … △（となりの物に取られやすい）
//   node yomi/tests/touch.js
const path = require('path'); const { execFileSync } = require('child_process');
const { chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 320, height: 240 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?test&seed=3'); await p.waitForTimeout(500); await p.evaluate(require('./pagelib.js'));
  const rooms = await p.evaluate(() => Object.keys(ROOMS).filter(r => !ROOMS[r].cut));
  let bad = 0, warn = 0, total = 0;
  for (const r of rooms) {
    const res = await p.evaluate(r => {
      YOMI.go(r, 0, 0); const R = G.room;
      // 条件つきの拾い物（仕掛けのあとに出る物）も並べる。出来事で落ちる物は、落ちたあとの様子で別に確かめる
      for (const it of R.D.items || []) if (!R.pick.some(q => q.key === it.key)) spawnPickup(R, it);
      const drops = { dining: [{ id: 'key_hawk', x: 2.6, z: -3.35, key: 'hawkkey' }], heliport: [{ id: 'gl', x: 2.2, z: 3.0, key: 'gl' }] }[r] || [];
      const reach = reachPts(R); const near = (x, z, y) => reach.some(q => Math.hypot(q[0] - x, q[2] - z) < 0.18 && Math.abs(q[1] - y) < 0.4);
      const ring = (tx, tz, ty, r0, r1, yOK) => { const out = []; for (let rr = r0; rr <= r1 + 1e-6; rr += 0.1) for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, x = tx + Math.sin(a) * rr, z = tz + Math.cos(a) * rr; const y = standAt(R, x, z, ty, 0.29, 'pl'); if (y == null || !yOK(y) || !near(x, z, y)) continue; out.push([x, z, y, rr]); } return out; };
      const T = [];
      for (const q of R.pick) { let pts = []; for (const dy of [0, 0.6, 0.95, 1.3, 1.9]) { const lv = q.y - dy; pts = ring(q.x, q.z, lv, 0.35, 0.95, y => Math.abs(y - lv) < 0.6); if (pts.length) break; } T.push({ name: '拾う ' + q.key, tx: q.x, tz: q.z, pts, is: o => o && o.k === 'pick' && o.p === q }); }
      for (const a of R.acts) { if (a.cond && !condOK(a.cond)) continue; const ay = a.y || 0; T.push({ name: '調べる ' + a.id + (a.idx != null ? '#' + a.idx : ''), tx: a.p[0], tz: a.p[1], pts: ring(a.p[0], a.p[1], ay, 0.35, Math.max(0.4, a.r - 0.06), y => Math.abs(y - ay) < 1.2), is: o => o && o.k === 'act' && o.a === a }); }
      for (const d of R.doors) { if (!d.spawn) continue; const y = standAt(R, d.spawn[0], d.spawn[1], d.y, 0.29, 'pl'); T.push({ name: '扉 ' + d.id, tx: d.pos[0], tz: d.pos[1], pts: y == null ? [] : [[d.spawn[0], d.spawn[1], y, hyp(d.spawn[0] - d.pos[0], d.spawn[1] - d.pos[1])]], is: o => o && o.k === 'door' && o.d === d }); }
      const test = t => {
        let ok = 0, okJ = 0, nJ = 0, closest = null, got = {};
        for (const [x, z, y, rr] of t.pts) {
          PL.x = x; PL.z = z; PL.y = y; const a0 = Math.atan2(t.tx - x, t.tz - z);
          PL.ang = a0; const o = actTarget(); const hit = t.is(o); if (hit) ok++; else { const n = !o ? 'なし' : o.k === 'pick' ? o.p.key : o.k === 'act' ? o.a.id : o.k === 'door' ? '扉' + o.d.id : '説明'; got[n] = (got[n] || 0) + 1; }
          for (const da of [-0.15, 0.15]) { PL.ang = a0 + da; nJ++; if (t.is(actTarget())) okJ++; }
          if (!closest || rr < closest.rr) closest = { rr, hit };
        }
        return { name: t.name, n: t.pts.length, ok, okJ, nJ, closest: closest && closest.hit, got };
      };
      const out = T.map(test);
      // 出来事で落ちる物：落ちたあとは、その物が選ばれること（その下の仕掛けより先）
      for (const dd of drops) { spawnPickup(R, dd); const q = R.pick[R.pick.length - 1]; let pts = []; for (const dy of [0, 0.6, 0.95]) { const lv = q.y - dy; pts = ring(q.x, q.z, lv, 0.35, 0.95, y => Math.abs(y - lv) < 0.6); if (pts.length) break; } out.push(test({ name: '拾う ' + q.key + '（落ちた物）', tx: q.x, tz: q.z, pts, is: o => o && o.k === 'pick' && o.p === q })); }
      return out;
    }, r);
    const lines = [];
    for (const t of res) {
      total++;
      if (!t.n) { lines.push(`   ？ ${t.name}：立てる所がない`); continue; }
      const mark = t.ok === 0 ? '×' : !t.closest ? '△' : null; if (mark === '×') bad++; if (mark === '△') warn++;
      if (mark) lines.push(`   ${mark} ${t.name}：${t.ok}/${t.n} か所で選ばれる（少しずれても ${t.okJ}/${t.nJ}）　かわりに選ばれた物 ${JSON.stringify(t.got)}`);
    }
    console.log(`${r.padEnd(10)} ${res.length}個` + (lines.length ? '\n' + lines.join('\n') : '  すべて選べる'));
  }
  console.log(errs.length ? 'エラー:\n' + errs.join('\n') : 'エラーなし');
  console.log(`${total}個のうち  × ${bad}  △ ${warn}`);
  await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();

// 邪神の領域：自動で遊ぶボット（エラー・詰まり・バランス確認）
//   node jashin/tests/bot.js [回数=3] [最大の日数=6] [god=0]
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const RUNS = +(process.argv[2] || 3), DAYS = +(process.argv[3] || 6), GOD = +(process.argv[4] || 0);
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');

function setup(god) {
  const J = window.__jashin; J.setSim(true);
  const N = 128, DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
  const B = window.__bot = { god, path: [], pt: 0, target: null, why: '', stuck: 0, lx: 0, ly: 0, looted: new Set(), log: [], wp: null, sleepT: 0 };
  const W = () => J.W, P = () => J.P;
  function passable(x, y) { if (x < 0 || y < 0 || x >= N || y >= N) return false; const i = y * N + x, w = W(), t = w.T[i];
    if (t === 11) { const o = w.obj.get(i); return o.broken || o.open || !o.bar } if (t === 12) { const o = w.obj.get(i); return !o.bar }
    return !J.isSolid(x, y, 0) }
  function bfs(tx, ty, near) { const p = P(), sx = Math.floor(p.x), sy = Math.floor(p.y); const prev = new Int32Array(N * N).fill(-1); const s = sy * N + sx; prev[s] = s; const q = [s]; let h = 0, goal = -1;
    while (h < q.length) { const i = q[h++]; const x = i % N, y = (i / N) | 0; if (near ? Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1 && !(x === tx && y === ty) : (x === tx && y === ty)) { goal = i; break }
      for (let k = 0; k < 4; k++) { const nx = x + DX[k], ny = y + DY[k]; if (!passable(nx, ny)) continue; const ni = ny * N + nx; if (prev[ni] >= 0) continue; prev[ni] = i; q.push(ni) } if (q.length > 17000) break }
    if (goal < 0) return null; const out = []; let i = goal; while (i !== s) { out.push(i); i = prev[i] } return out.reverse() }
  B.bfs = bfs; B.passable = passable;
  B.tick = function (dt) {
    const p = P(), w = W(), G = J.G, inp = J.inp; inp.mx = inp.my = 0; inp.attack = false; inp.aimX = null; inp.aimY = null; inp.run = false;
    if (G.state !== 'play') return;
    if (B.god) { p.hp = p.mhp; p.corr = 0; p.hunger = 90; p.thirst = 90; p.fatigue = 10; p.bleed = 0 }
    if (G.sleeping) return;
    const use = k => { const it = p.inv.find(i => i.k === k); if (it) { J.useItem(it); return true } return false };
    if (p.bleed && (use('bandage') || use('cloth'))) return;
    if (p.hunger < 45 && (use('can') || use('bread') || use('jerky') || use('apple'))) return;
    if (p.thirst < 45 && (use('water') || use('wine'))) return;
    if (p.corr > 50 && (use('holy') || use('herb'))) return;
    if (p.hp < p.mhp * .4 && (use('herb') || use('bandage'))) return;
    if (p.inv.find(i => i.k === 'map') && !G.mapKnown) use('map');
    if (!p.hand) { const wpn = p.inv.find(i => J.W && ['sword', 'axe', 'maul', 'spear', 'mace', 'pipe', 'dagger', 'staff', 'stick'].includes(i.k)); if (wpn) J.useItem(wpn) }
    // 戦い
    const now = J.G.rt; B.ign = B.ign || new Map();
    const mons = J.MON.filter(m => !m.dead && !(B.ign.get(m) > now) && Math.hypot(m.x - p.x, m.y - p.y) < 7 && (m.state === 'chase' || Math.hypot(m.x - p.x, m.y - p.y) < 2.2));
    if (mons.length) { const m0 = mons.reduce((a, b) => Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b); const d0 = Math.hypot(m0.x - p.x, m0.y - p.y);
      if (B.fm !== m0) { B.fm = m0; B.fd = d0; B.ft = now } else if (d0 < B.fd - .3) { B.fd = d0; B.ft = now } else if (now - B.ft > 3 && d0 > 1.6) { B.ign.set(m0, now + 12); B.fm = null } }
    if (mons.length && !mons.every(m => B.ign.get(m) > now)) { mons.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); const m = mons[0]; const d = Math.hypot(m.x - p.x, m.y - p.y);
      inp.aimX = m.x; inp.aimY = m.y; const close = mons.filter(o => Math.hypot(o.x - p.x, o.y - p.y) < 1.6).length;
      if (close >= 3) { inp.shove = true; if (p.cls === '戦士' || p.cls === '僧侶') inp.skill = true }
      if (p.cls === '魔女' && d > 1.4) { inp.skill = true; if (d < 3) { inp.mx = (p.x - m.x) / d; inp.my = (p.y - m.y) / d } return }
      if (!B.god && (p.hp < p.mhp * .35 && mons.length > 1 || m.k === 'guardian' && p.lv < 6)) { inp.mx = (p.x - m.x) / d; inp.my = (p.y - m.y) / d; inp.run = true; if (d < 1.2) inp.shove = true; return }
      if (d < 1.3) { inp.attack = true; return } inp.mx = (m.x - p.x) / d; inp.my = (m.y - p.y) / d; return }
    // 弱ったら休む
    if (p.hp < p.mhp * .45 || B.resting) { B.resting = p.hp < p.mhp * .8; if (p.fatigue > 35) { const bed = nearestF(1, 30); if (bed != null) { if (goTo(bed % N, (bed / N) | 0, true)) { faceTile(bed); J.trySleep() } return } } return }
    // 眠る
    if (p.fatigue > 78) { const bed = nearestF(1, 40); if (bed != null) { if (goTo(bed % N, (bed / N) | 0, true)) { faceTile(bed); J.trySleep() } return } }
    // 目的
    let goal = null;
    const shr = w.shrines.filter(s => s.alive && (B.god || G.mapKnown || w.explored[s.y * N + s.x]));
    if (G.seals >= 4) goal = { x: 64, y: 64, gate: 1 };
    else if (shr.length && (p.lv >= 6 || B.god && p.lv >= 3) && p.hp > p.mhp * .75) { shr.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); goal = { x: shr[0].x, y: shr[0].y, shrine: shr[0] } }
    if (!goal && J.carry() < J.capOf() - 2) { const c = nearestCont(25); if (c != null) goal = { x: c % N, y: (c / N) | 0, cont: c } }
    if (!goal) { if (!B.wp || Math.hypot(B.wp.x - p.x, B.wp.y - p.y) < 2 || B.wpT-- <= 0) { for (let t = 0; t < 40; t++) { const x = 8 + Math.floor(Math.random() * 112), y = 8 + Math.floor(Math.random() * 112); if (passable(x, y)) { B.wp = { x, y }; B.wpT = 600; break } } } goal = B.wp }
    if (!goal) return;
    B.why = goal.gate ? 'gate' : goal.shrine ? 'shrine' : goal.cont != null ? 'cont' : 'wp';
    if (goal.gate) { if (!w.gate.boss) { if (goTo(64, 64, false)) J.bossSpawn() } else { const b = J.MON.find(m => !m.dead && m.k === 'boss'); if (b) { inp.aimX = b.x; inp.aimY = b.y; const d = Math.hypot(b.x - p.x, b.y - p.y); if (d < 2.2) inp.attack = true; else { inp.mx = (b.x - p.x) / d; inp.my = (b.y - p.y) / d } } } return }
    if (goal.shrine) { if (goTo(goal.x, goal.y, true)) { inp.aimX = goal.x + .5; inp.aimY = goal.y + .5; inp.attack = true } return }
    if (goal.cont != null) { if (goTo(goal.x, goal.y, true)) { const items = J.contents(goal.cont); while (items.length && J.carry() < J.capOf()) { const it = items.shift(); J.addTo(p.inv, it) } B.looted.add(goal.cont) } return }
    goTo(goal.x, goal.y, false);
  };
  function faceTile(i) { const p = P(); J.inp.aimX = i % N + .5; J.inp.aimY = ((i / N) | 0) + .5; p.a = Math.atan2(J.inp.aimY - p.y, J.inp.aimX - p.x) }
  function nearestF(f, r) { const p = P(), w = W(); let best = null, bd = 1e9; for (let y = Math.max(0, Math.floor(p.y - r)); y < Math.min(N, p.y + r); y++)for (let x = Math.max(0, Math.floor(p.x - r)); x < Math.min(N, p.x + r); x++) { const i = y * N + x; if (w.F[i] !== f) continue; const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = i } } return best }
  function nearestCont(r) { const p = P(), w = W(); let best = null, bd = 1e9; for (let y = Math.max(0, Math.floor(p.y - r)); y < Math.min(N, p.y + r); y++)for (let x = Math.max(0, Math.floor(p.x - r)); x < Math.min(N, p.x + r); x++) { const i = y * N + x; const f = w.F[i]; if (![2, 3, 5, 6, 8, 9].includes(f) || B.looted.has(i) || B.bad && B.bad.has(i)) continue; const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = i } } return best }
  function goTo(tx, ty, near) {
    const p = P(), w = W(); const px = Math.floor(p.x), py = Math.floor(p.y);
    if (near && Math.abs(px - tx) <= 1 && Math.abs(py - ty) <= 1) { const ex = tx + .5 - p.x, ey = ty + .5 - p.y, L = Math.hypot(ex, ey); if (L < 1.35) return true; J.inp.mx = ex / L; J.inp.my = ey / L; return L < 1.7 }
    if (!near && px === tx && py === ty) return true;
    const key = tx + ',' + ty + ',' + near; if (B.pkey !== key || B.pt-- <= 0 || !B.path.length) { B.path = bfs(tx, ty, near) || []; B.pkey = key; B.pt = 15; if (!B.path.length) { (B.bad || (B.bad = new Set())).add(ty * N + tx); B.wp = null; return false } }
    while (B.path.length && B.path[0] === py * N + px) B.path.shift();
    const ni = B.path[0]; if (ni == null) return false; const nx = ni % N, ny = (ni / N) | 0, t = w.T[ni];
    if ((t === 11 || t === 12) && J.isSolid(nx, ny, 0)) { const o = w.obj.get(ni); faceTile(ni); if (Math.hypot(nx + .5 - p.x, ny + .5 - p.y) < 1.5) { if (t === 11 && !o.open) J.doInteract(false); else if (t === 12 && !o.open && !o.broken) J.doInteract(false) } }
    const ex = nx + .5 - p.x, ey = ny + .5 - p.y, L = Math.hypot(ex, ey) || 1; J.inp.mx = ex / L; J.inp.my = ey / L;
    if (Math.hypot(p.x - B.lx, p.y - B.ly) < .01) { B.stuck++; if (B.stuck > 60) { B.path = []; B.stuck = 0; J.inp.mx = Math.random() * 2 - 1; J.inp.my = Math.random() * 2 - 1; B.unstuck = (B.unstuck || 0) + 1 } } else B.stuck = 0; B.lx = p.x; B.ly = p.y;
    return false }
}
function runChunk(n) {
  const J = window.__jashin, B = window.__bot; const t0 = performance.now(); let worst = 0;
  for (let k = 0; k < n; k++) { if (J.G.state !== 'play') break; const a = performance.now(); B.tick(1 / 20); J.step(1 / 20); if (J.G.sleeping) for (let s = 0; s < 5; s++) J.step(1 / 20); worst = Math.max(worst, performance.now() - a) }
  const P = J.P, G = J.G; return { state: G.state, day: J.day(), hour: Math.floor(J.hour()), hp: Math.round(P.hp), lv: P.lv, kills: G.kills, seals: G.seals, cause: G.cause, mons: J.MON.filter(m => !m.dead).length, ms: (performance.now() - t0) / n, worst, inv: P.inv.length, gate: J.W.gate.open, boss: J.W.gate.boss, unstuck: B.unstuck || 0, why: B.why, fm: B.fm ? B.fm.k + ':' + B.fm.state : '-', hunger: Math.round(P.hunger), thirst: Math.round(P.thirst), corr: Math.round(P.corr), x: P.x.toFixed(1), y: P.y.toFixed(1) }
}
(async () => {
  const b = await chromium.launch(); let bad = 0;
  const classes = ['戦士', '盗賊', '魔女', '僧侶'];
  for (let r = 0; r < RUNS; r++) {
    const pg = await b.newPage(); const errs = [];
    pg.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
    await pg.goto(FILE); await pg.waitForTimeout(300);
    const cls = classes[r % 4], seed = 1000 + r * 7919;
    await pg.evaluate(([cls, seed, god, setupSrc]) => { eval('(' + setupSrc + ')')(god); window.__jashin.start(cls, seed) }, [cls, seed, GOD, setup.toString()]);
    let st, t0 = Date.now();
    while (true) { st = await pg.evaluate(runChunk, 2000); if (st.state !== 'play' || st.day > DAYS || Date.now() - t0 > 240000) break }
    const res = st.state === 'win' ? '★勝利' : st.state === 'dead' ? '死亡' : '生存中';
    console.log(`#${r + 1} ${cls} seed${seed} ${res} ${st.day}日目${st.hour}時 Lv${st.lv} 倒した${st.kills} 祠${st.seals}/4 門${st.gate ? '開' : '閉'} ${st.cause ? '死因:' + st.cause : ''} 平均${st.ms.toFixed(2)}ms 最悪${st.worst.toFixed(1)}ms 詰まり直し${st.unstuck} 魔物${st.mons} 目的${st.why} 相手${st.fm} 位置${st.x},${st.y} (${((Date.now() - t0) / 1000) | 0}秒)`);
    if (errs.length) { bad++; console.log('  エラー:', [...new Set(errs)].slice(0, 6).join('\n         ')) }
    await pg.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();

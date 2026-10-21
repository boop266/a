// 自動プレイのテスト（ブラウザ不要）。
// 使い方: node tests/bot.js [シード数=50] [1シードあたりのターン数=2000] [最初のシード=1]
// index.html の <script id="logic"> だけを取り出して Node で動かす。
// 1ターン = 1/30秒。ボットは自転車を探して乗り、走り回り、ときどき降りて歩き、ゾンビから逃げる。
// 捕まったら（このゲームでは終わり）、続きのシードで新しく始めて最後まで動かし続ける。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SEEDS = +process.argv[2] || 50;
const TURNS = +process.argv[3] || 2000;
const FIRST = +process.argv[4] || 1;
const DT = 1 / 30;

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/<script id="logic">([\s\S]*?)<\/script>/);
if (!m) { console.error('index.html に <script id="logic"> が見つからない'); process.exit(1); }
const sandbox = { module: { exports: {} }, globalThis: {}, Math, console };
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox, { filename: 'index.html#logic' });
const M = sandbox.module.exports;

const fails = [];
const fail = (seed, turn, msg) => { fails.push({ seed, turn, msg }); };
const num = v => typeof v === 'number' && isFinite(v);
const pos = v => num(v) && v >= 0;

function check(g, seed, turn) {
  const p = g.player;
  for (const k of ['x', 'y']) if (!pos(p[k])) return fail(seed, turn, `player.${k} = ${p[k]}`);
  for (const k of ['vx', 'vy', 'heading']) if (!num(p[k])) return fail(seed, turn, `player.${k} = ${p[k]}`);
  if (!pos(p.speed)) return fail(seed, turn, `player.speed = ${p.speed}`);
  if (!pos(g.time)) return fail(seed, turn, `time = ${g.time}`);
  if (M.SOLID[M.tileAt(g.world, p.x, p.y)] && p.mount <= 0) return fail(seed, turn, `プレイヤーが固い物の中にいる (${p.x.toFixed(2)},${p.y.toFixed(2)}) tile=${M.tileAt(g.world, p.x, p.y)}`);
  for (const z of g.zombies) {
    if (!pos(z.x) || !pos(z.y) || !num(z.vx) || !num(z.vy)) return fail(seed, turn, `zombie#${z.id} pos/vel = ${z.x},${z.y},${z.vx},${z.vy}`);
  }
  for (const b of g.bikes) if (!pos(b.x) || !pos(b.y)) return fail(seed, turn, `bike pos = ${b.x},${b.y}`);
  if (g.world.chunks.size > 200) return fail(seed, turn, `チャンクが解放されない (${g.world.chunks.size})`);
  if (g.zombies.length > 3000) return fail(seed, turn, `ゾンビが増えすぎ (${g.zombies.length})`);
}

function makeBot(seed) {
  const R = M.mulberry(seed * 7919 + 13);
  let dir = R() * Math.PI * 2, dirT = 0, nextToggle = 300 + R() * 400, lastX = 0, lastY = 0, stuckT = 0;
  return function (g, turn) {
    const p = g.player;
    const inp = { mx: 0, my: 0, dash: false, interact: false };
    // 近くの追ってくるゾンビから逃げる
    let flee = null, fd = 7;
    for (const z of g.zombies) { if (z.state !== 1) continue; const d = Math.hypot(z.x - p.x, z.y - p.y); if (d < fd) { fd = d; flee = z; } }
    if (!p.riding && p.mount <= 0) {
      const b = M.nearestBike(g);
      if (b && R() < 0.5) { inp.interact = true; return inp; }
      // 一番近い自転車へ
      let tb = null, td = 30;
      for (const q of g.bikes) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < td) { td = d; tb = q; } }
      if (tb && !flee) dir = Math.atan2(tb.y - p.y, tb.x - p.x);
    }
    if (flee) { dir = Math.atan2(p.y - flee.y, p.x - flee.x) + (R() - 0.5) * 0.6; inp.dash = true; }
    dirT -= 1;
    if (dirT <= 0) { dirT = 60 + R() * 120; if (!flee) dir += (R() - 0.5) * 2.5; }
    // 詰まったら向きを変える
    if (Math.hypot(p.x - lastX, p.y - lastY) < 0.01 && p.mount <= 0) { stuckT++; if (stuckT > 10) { dir = R() * Math.PI * 2; stuckT = 0; } } else stuckT = 0;
    lastX = p.x; lastY = p.y;
    if (turn > nextToggle && p.riding) { inp.interact = true; nextToggle = turn + 200 + R() * 500; return inp; }
    const mag = 0.4 + R() * 0.6;
    inp.mx = Math.cos(dir) * mag; inp.my = Math.sin(dir) * mag;
    if (R() < 0.05) inp.dash = true;
    // ときどきおかしな入力も混ぜる
    if (R() < 0.002) { inp.mx = NaN; inp.my = Infinity; }
    if (R() < 0.002) { inp.mx = 5; inp.my = -7; }
    return inp;
  };
}

const t0 = Date.now();
let deaths = 0, rides = 0, totalChunks = 0, maxDist = 0, nightTurns = 0;
for (let s = FIRST; s < FIRST + SEEDS; s++) {
  // 始まりの場所：歩ける・近くに自転車がある
  {
    const g = M.createGame(s);
    const p = g.player;
    if (M.SOLID[M.tileAt(g.world, p.x, p.y)]) fail(s, 0, '始まりの場所が固い物の中');
    const near = g.bikes.filter(b => Math.hypot(b.x - p.x, b.y - p.y) < 6);
    if (!near.length) fail(s, 0, '始まりの場所の近くに自転車がない');
    const zNear = g.zombies.filter(z => Math.hypot(z.x - p.x, z.y - p.y) < M.CFG.world.safeRadius - 0.5);
    if (zNear.length) fail(s, 0, `始まりの場所のすぐ近くにゾンビがいる (${zNear.length})`);
  }
  let seed = s, g = M.createGame(seed), bot = makeBot(seed), sx = g.player.x, sy = g.player.y;
  // シードごとに時刻をずらして、夜も通す
  g.time = (s % 4) * 6 * M.CFG.time.secondsPerHour;
  let n = fails.length;
  try {
    for (let turn = 1; turn <= TURNS; turn++) {
      const inp = bot(g, turn);
      const wasRiding = g.player.riding;
      M.step(g, inp, DT);
      if (!wasRiding && g.player.riding) rides++;
      g.events.length = 0;
      if (M.lightAt(M.hourOf(g.time)).day < 0.5) nightTurns++;
      check(g, seed, turn);
      if (fails.length > n) break;
      maxDist = Math.max(maxDist, Math.hypot(g.player.x - sx, g.player.y - sy));
      if (g.dead) {
        deaths++;
        // まだ動かしていない状態で step を呼んでも何も起きないこと
        const px = g.player.x; M.step(g, { mx: 1, my: 1, interact: true }, DT);
        if (g.player.x !== px) { fail(seed, turn, '捕まったあとも動ける'); break; }
        seed = s * 1000 + turn; g = M.createGame(seed); bot = makeBot(seed); sx = g.player.x; sy = g.player.y;
      }
    }
  } catch (e) {
    fail(seed, -1, e && e.stack || String(e));
  }
  totalChunks += g.world.chunks.size;
}

// 明るさの表が一日じゅう正しい範囲にあるか
for (let h = 0; h < 24; h += 0.01) {
  const L = M.lightAt(h);
  for (const k of ['day', 'warm', 'deep']) if (!(L[k] >= 0 && L[k] <= 1)) fail(0, 0, `lightAt(${h.toFixed(2)}).${k} = ${L[k]}`);
}
// 日の出・日没が 15秒（= sunFade）で切り替わるか
{
  const f = M.CFG.feel.sunFade / M.CFG.time.secondsPerHour;
  if (M.lightAt(M.CFG.time.sunset - 0.001).day !== 1 || M.lightAt(M.CFG.time.sunset + f + 0.001).day !== 0) fail(0, 0, '日没の切り替えが sunFade どおりでない');
  if (M.lightAt(M.CFG.time.sunrise - 0.001).day !== 0 || M.lightAt(M.CFG.time.sunrise + f + 0.001).day !== 1) fail(0, 0, '日の出の切り替えが sunFade どおりでない');
  // 30分で一周
  if (Math.abs(M.hourOf(30 * 60) - M.CFG.time.startHour) > 1e-6) fail(0, 0, '30分で24時間が一周しない');
}
// 遠くまで行っても生成が続くか（いろいろな方向・距離）
{
  const g = M.createGame(12345);
  const sp = M.startPos();
  for (const [dx, dy] of [[5000, 0], [0, 5000], [-5000, -5000], [40000, -30000], [-200000, 150000], [1, 1]]) {
    const cx = Math.floor((sp.x + dx) / M.CS), cy = Math.floor((sp.y + dy) / M.CS);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      try {
        const c = M.genChunk(12345, cx + i, cy + j);
        if (c.t.length !== M.CS * M.CS) fail(12345, 0, `チャンクの大きさがおかしい (${cx + i},${cy + j})`);
        for (const z of c.zs) if (M.SOLID[c.t[(Math.floor(z.y) - c.y0) * M.CS + Math.floor(z.x) - c.x0]]) fail(12345, 0, `ゾンビが壁の中に生まれる (${cx + i},${cy + j})`);
      } catch (e) { fail(12345, 0, `遠くのチャンク (${cx + i},${cy + j}) で例外: ${e.message}`); }
    }
  }
  // 同じシードなら同じ街
  const a = M.genChunk(777, 41700, 41650), b = M.genChunk(777, 41700, 41650);
  if (Buffer.compare(Buffer.from(a.t), Buffer.from(b.t)) !== 0) fail(777, 0, '同じシードで街が変わる');
}
// 街の中身の割合（偏りすぎていないか）
{
  const kinds = {};
  let zs = 0, chunks = 0, river = 0, houses = 0;
  for (let i = 0; i < 30; i++) for (let j = 0; j < 30; j++) {
    const c = M.genChunk(99, 41600 + i, 41600 + j);
    kinds[c.kind] = (kinds[c.kind] || 0) + 1;
    zs += c.zs.length; chunks++; houses += c.houses.length;
    if (c.t.some(t => t === M.T.WATER)) river++;
  }
  console.log(`街の内訳(30x30区画): ${JSON.stringify(kinds)} 家=${houses} ゾンビ=${zs} (1区画あたり ${(zs / chunks).toFixed(1)}) 水のある区画=${river}`);
  // 人が多い所ほどゾンビが多いか
  let hi = 0, hn = 0, lo = 0, ln = 0;
  for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) {
    const c = M.genChunk(5, 41500 + i, 41500 + j);
    if (c.d > 0.58) { hi += c.zs.length; hn++; } else if (c.d < 0.36) { lo += c.zs.length; ln++; }
  }
  console.log(`ゾンビ密度: 人の多い区画 ${(hi / Math.max(1, hn)).toFixed(2)} / 少ない区画 ${(lo / Math.max(1, ln)).toFixed(2)}`);
  if (hn && ln && hi / hn <= lo / ln) fail(5, 0, '人の多い区画のほうがゾンビが少ない');
}

const sec = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`シード ${SEEDS}個 × ${TURNS}ターン: 捕まった ${deaths}回 / 自転車に乗った ${rides}回 / 夜のターン ${nightTurns} / 最も遠くまで ${maxDist.toFixed(0)}マス / ${sec}秒`);
if (fails.length) {
  console.log(`\n失敗 ${fails.length}件:`);
  for (const f of fails.slice(0, 30)) console.log(`  シード ${f.seed} ターン ${f.turn}: ${f.msg}`);
  process.exit(1);
}
console.log('OK');

// 自動プレイのテスト（ブラウザ不要）。
// 使い方: node tests/bot.js [シード数=50] [1シードあたりのターン数=2000] [最初のシード=1]
// index.html の <script id="logic"> だけを取り出して Node で動かす。
// 1ターン = 1/30秒。ボットは自転車を探して乗り、走り回り、ときどき降りて歩き、ゾンビから逃げる。
// 腹が減ったり喉が渇いたりしたら家に入り、冷蔵庫・食器棚・水道を使って、また外へ出る。
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
  const p = g.player, N = M.CFG.needs;
  for (const k of ['x', 'y']) if (!pos(p[k])) return fail(seed, turn, `player.${k} = ${p[k]}`);
  for (const k of ['vx', 'vy', 'heading']) if (!num(p[k])) return fail(seed, turn, `player.${k} = ${p[k]}`);
  if (!pos(p.speed)) return fail(seed, turn, `player.speed = ${p.speed}`);
  for (const k of ['stamina', 'food', 'water']) if (!pos(p[k]) || p[k] > N.max) return fail(seed, turn, `player.${k} = ${p[k]}`);
  if (!pos(g.time)) return fail(seed, turn, `time = ${g.time}`);
  if (g.inside) {
    if (M.iBlocked(g.inside, p.x, p.y, 0.01)) return fail(seed, turn, `家の中で壁の中にいる (${p.x.toFixed(2)},${p.y.toFixed(2)}) 家=${g.inside.id}`);
    if (!g.outPos || !pos(g.outPos.x) || !pos(g.outPos.y)) return fail(seed, turn, `家の中にいるのに外の位置がない`);
    for (const z of g.inside.zombies) if (!pos(z.x) || !pos(z.y) || !num(z.vx) || !num(z.vy) || M.iBlocked(g.inside, z.x, z.y, 0.01)) return fail(seed, turn, `家の中のゾンビ#${z.id} = ${z.x},${z.y}`);
  } else if (M.SOLID[M.tileAt(g.world, p.x, p.y)] && p.mount <= 0) return fail(seed, turn, `プレイヤーが固い物の中にいる (${p.x.toFixed(2)},${p.y.toFixed(2)}) tile=${M.tileAt(g.world, p.x, p.y)}`);
  for (const z of g.zombies) {
    if (!pos(z.x) || !pos(z.y) || !num(z.vx) || !num(z.vy)) return fail(seed, turn, `zombie#${z.id} pos/vel = ${z.x},${z.y},${z.vx},${z.vy}`);
  }
  for (const b of g.bikes) if (!pos(b.x) || !pos(b.y)) return fail(seed, turn, `bike pos = ${b.x},${b.y}`);
  // 速さがすべて決まった範囲に入っているか
  const U = M.CFG.speed.unit;
  if (p.riding) {
    const V = M.CFG.vehicle[p.vehicle];
    if (!V) return fail(seed, turn, `知らない乗り物 ${p.vehicle}`);
    if (p.speed > V.speed * V.down + 1e-9) return fail(seed, turn, `${p.vehicle} が速すぎる ${p.speed.toFixed(3)} > ${(V.speed * V.down).toFixed(3)}`);
  } else if (p.speed > M.CFG.speed.sprint + 0.02) return fail(seed, turn, `歩き・走りが速すぎる ${p.speed.toFixed(3)}`);
  for (const z of (g.inside ? g.inside.zombies : g.zombies)) {
    const v = Math.hypot(z.vx, z.vy) / U;
    if (v > M.CFG.speed.zombie + 0.02) return fail(seed, turn, `ゾンビ#${z.id} が速すぎる ${v.toFixed(3)}`);
  }
  if (g.world.chunks.size > 200) return fail(seed, turn, `チャンクが解放されない (${g.world.chunks.size})`);
  if (g.zombies.length > 3000) return fail(seed, turn, `ゾンビが増えすぎ (${g.zombies.length})`);
}

// 外の道探し（タイル単位の幅優先）。返り値は次に向かう点
function pathStep(g, tx, ty, maxR) {
  const p = g.player, sx = Math.floor(p.x), sy = Math.floor(p.y), gx = Math.floor(tx), gy = Math.floor(ty);
  if (sx === gx && sy === gy) return { x: tx, y: ty };
  const R = maxR || 30, Wd = R * 2 + 1, key = (x, y) => (y - sy + R) * Wd + (x - sx + R);
  const prev = new Int32Array(Wd * Wd).fill(-1), q = [[sx, sy]];
  prev[key(sx, sy)] = key(sx, sy);
  while (q.length) {
    const [x, y] = q.shift();
    if (x === gx && y === gy) {
      let k = key(x, y), last = k;
      while (prev[k] !== key(sx, sy)) { last = k; k = prev[k]; if (k === last) break; }
      const nx = (k % Wd) - R + sx, ny = Math.floor(k / Wd) - R + sy;
      return { x: nx + 0.5, y: ny + 0.5 };
    }
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ax, ny = y + ay;
      if (Math.abs(nx - sx) > R || Math.abs(ny - sy) > R) continue;
      const k = key(nx, ny);
      if (prev[k] !== -1) continue;
      if ((M.SOLID[M.tileAt(g.world, nx + 0.5, ny + 0.5)] || M.blocked(g.world, nx + 0.5, ny + 0.5, 0.3)) && !(nx === gx && ny === gy)) continue;
      prev[k] = key(x, y);
      q.push([nx, ny]);
    }
  }
  return null;
}
function nearestEntry(g, maxD) {
  const p = g.player;
  let best = null, bd = maxD;
  for (const c of g.world.chunks.values()) for (const h of c.houses) for (const e of h.entries) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < bd) { bd = d; best = { h, e }; }
  }
  return best;
}

function makeBot(seed) {
  const R = M.mulberry(seed * 7919 + 13);
  let dir = R() * Math.PI * 2, dirT = 0, nextToggle = 300 + R() * 400, lastX = 0, lastY = 0, stuckT = 0;
  let goal = null, goalT = 0, insideT = 0, pathT = 0, way = null;
  return function (g, turn) {
    const p = g.player;
    const inp = { mx: 0, my: 0, dash: false, sprint: false, interact: false };
    if (g.trans || p.act || p.mount > 0) return inp;
    // 家の中：使えるものを使って、しばらくしたら出る
    if (g.inside) {
      insideT++;
      const it = M.nearestInteract(g);
      if (it && it.type === 'fixture' && !it.empty && R() < 0.5) { inp.interact = true; return inp; }
      const I = g.inside;
      let target = null;
      if (insideT < 240) { const f = I.fixtures.find(f => f.food > 0 || f.water > 0); if (f) target = { x: f.x + 0.5, y: f.y + 0.5 }; }
      if (!target || insideT > 400) {
        const e = I.exits[0];
        if (Math.hypot(e.sx - p.x, e.sy - p.y) < 0.6) {
          if (R() < 0.5) { inp.interact = true; return inp; }
          inp.mx = e.ox; inp.my = e.oy; return inp;   // 押し込んで出る
        }
        target = { x: e.sx, y: e.sy };
      }
      let a = Math.atan2(target.y - p.y, target.x - p.x);
      if (Math.hypot(p.x - lastX, p.y - lastY) < 0.005) { stuckT++; if (stuckT > 8) { dir = R() * 6.28; stuckT = -15; } } else if (stuckT > 0) stuckT = 0;
      if (stuckT < 0) { a = dir; stuckT++; }
      lastX = p.x; lastY = p.y;
      inp.mx = Math.cos(a) * 0.8; inp.my = Math.sin(a) * 0.8;
      if (R() < 0.1) inp.sprint = true;
      return inp;
    }
    insideT = 0;
    // 近くの追ってくるゾンビから逃げる（本気ダッシュ）
    let flee = null, fd = 7;
    for (const z of g.zombies) { if (z.state !== 1) continue; const d = Math.hypot(z.x - p.x, z.y - p.y); if (d < fd) { fd = d; flee = z; } }
    // 腹が減った・喉が渇いた・気まぐれ → 家へ
    goalT--;
    if (!flee && !p.riding && (!goal || goalT <= 0) && (p.food < 75 || p.water < 75 || R() < 0.01)) {
      const ne = nearestEntry(g, 22);
      if (ne) { goal = ne; goalT = 400; }
    }
    if (goal && !flee && !p.riding) {
      const it = M.nearestInteract(g);
      if (it && it.type === 'entry') { inp.interact = true; goal = null; return inp; }
      pathT--;
      if (pathT <= 0 || !way) { way = pathStep(g, goal.e.x, goal.e.y, 26); pathT = 10; if (!way) { goal = null; } }
      if (way) {
        if (Math.hypot(way.x - p.x, way.y - p.y) < 0.35) pathT = 0;
        const a = Math.atan2(way.y - p.y, way.x - p.x);
        inp.mx = Math.cos(a) * 0.7; inp.my = Math.sin(a) * 0.7;
        return inp;
      }
    }
    if (!p.riding && p.mount <= 0 && !goal) {
      const it = M.nearestInteract(g);
      if (it && !it.empty && it.type !== 'entry' && R() < 0.5) { inp.interact = true; return inp; }
      // 一番近い自転車へ
      let tb = null, td = 30;
      for (const q of g.bikes) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < td) { td = d; tb = q; } }
      if (tb && !flee) dir = Math.atan2(tb.y - p.y, tb.x - p.x);
    }
    if (flee) { dir = Math.atan2(p.y - flee.y, p.x - flee.x) + (R() - 0.5) * 0.6; inp.sprint = true; }
    dirT -= 1;
    if (dirT <= 0) { dirT = 60 + R() * 120; if (!flee) dir += (R() - 0.5) * 2.5; }
    // 詰まったら向きを変える
    if (Math.hypot(p.x - lastX, p.y - lastY) < 0.01 && p.mount <= 0) { stuckT++; if (stuckT > 10) { dir = R() * Math.PI * 2; stuckT = 0; } } else stuckT = 0;
    lastX = p.x; lastY = p.y;
    if (turn > nextToggle && p.riding) { inp.interact = true; nextToggle = turn + 200 + R() * 500; return inp; }
    const mag = 0.4 + R() * 0.6;
    inp.mx = Math.cos(dir) * mag; inp.my = Math.sin(dir) * mag;
    if (R() < 0.05) inp.dash = true;
    if (R() < 0.03) inp.sprint = true;
    // ときどきおかしな入力も混ぜる
    if (R() < 0.002) { inp.mx = NaN; inp.my = Infinity; }
    if (R() < 0.002) { inp.mx = 5; inp.my = -7; }
    return inp;
  };
}

// 始まりの場所から歩いて行ける範囲に、水と食料が両方あるか
function suppliesReachable(seed, radius) {
  const g = M.createGame(seed), w = g.world, sp = g.player;
  const sx = Math.floor(sp.x), sy = Math.floor(sp.y), R = radius, Wd = R * 2 + 1;
  const seen = new Uint8Array(Wd * Wd), q = [[sx, sy]];
  seen[R * Wd + R] = 1;
  const reached = new Set([sx + ',' + sy]);
  while (q.length) {
    const [x, y] = q.pop();
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ax, ny = y + ay;
      if (Math.abs(nx - sx) > R || Math.abs(ny - sy) > R) continue;
      const k = (ny - sy + R) * Wd + (nx - sx + R);
      if (seen[k] || M.SOLID[M.tileAt(w, nx + 0.5, ny + 0.5)]) continue;
      seen[k] = 1; reached.add(nx + ',' + ny); q.push([nx, ny]);
    }
  }
  const near = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => reached.has((Math.floor(x) + a) + ',' + (Math.floor(y) + b)));
  let food = 0, water = 0;
  const pcx = Math.floor(sx / M.CS), pcy = Math.floor(sy / M.CS), CR = Math.ceil(R / M.CS) + 1;
  for (let dy = -CR; dy <= CR; dy++) for (let dx = -CR; dx <= CR; dx++) {
    const c = M.getChunk(w, pcx + dx, pcy + dy);
    for (const o of c.props) {
      if (o.k === 'vend' && o.uses > 0 && near(o.x + 0.5, o.y + 0.5)) water++;
      if (o.k === 'fountain' && o.uses > 0 && near(o.x + 0.5, o.y + 0.5)) water++;
      if (o.k === 'veg' && reached.has(Math.floor(o.x) + ',' + Math.floor(o.y))) food++;
    }
    for (const h of c.houses) {
      if (!h.supplies) continue;
      h.entries.forEach((e, i) => {
        if (!reached.has(e.tx + ',' + e.ty)) return;
        const I = M.genInterior(seed, h);
        const ex = I.exits.find(q => q.entry === i);
        // 家の中で、その入口から手の届く所まで行けるか
        const iseen = new Set(), iq = [[Math.floor(ex.sx), Math.floor(ex.sy)]];
        iseen.add(iq[0].join(','));
        while (iq.length) {
          const [x, y] = iq.pop();
          for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + ax, ny = y + ay, k = nx + ',' + ny;
            if (iseen.has(k) || M.ISOLID(M.iTile(I, nx, ny))) continue;
            iseen.add(k); iq.push([nx, ny]);
          }
        }
        for (const f of I.fixtures) {
          const ok = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => iseen.has((f.x + a) + ',' + (f.y + b)));
          if (!ok) continue;
          if (f.food > 0) food++;
          if (f.water > 0) water++;
        }
      });
    }
  }
  return { food, water };
}

const t0 = Date.now();
let deaths = 0, rides = 0, totalChunks = 0, maxDist = 0, nightTurns = 0, entered = 0, exited = 0, ate = 0, drank = 0;
const causes = {};
let hillStarts = 0;
// 丘の近くの歩ける点（where: 'base' ふもと / 'top' 頂上）
function hillSpot(seed, where, wantLevel) {
  const sp = M.startPos(), C = M.CFG.terrain.cell;
  const g = M.createGame(seed);
  const hills = [];
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const h = M.hillAt(seed, Math.floor(sp.x / C) + i, Math.floor(sp.y / C) + j); if (h && (!wantLevel || h.level === wantLevel)) hills.push(h); }
  hills.sort((a, b) => Math.hypot(a.x - sp.x, a.y - sp.y) - Math.hypot(b.x - sp.x, b.y - sp.y));
  for (const h of hills) {
    const rr = where === 'top' ? 0 : h.R + 1.5;
    for (let r = rr; r < rr + 6; r += 0.5) for (let a = 0; a < 6.28; a += 0.3) {
      const x = h.x + Math.cos(a) * r, y = h.y + Math.sin(a) * r;
      if (!M.SOLID[M.tileAt(g.world, x, y)] && !M.blocked(g.world, x, y, 0.35)) return { x: Math.floor(x) + 0.5, y: Math.floor(y) + 0.5, h };
    }
  }
  return null;
}
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
    const sup = suppliesReachable(s, 40);
    if (!sup.food) fail(s, 0, '歩いて行ける所に食料がない');
    if (!sup.water) fail(s, 0, '歩いて行ける所に水がない');
  }
  let seed = s, g = M.createGame(seed), bot = makeBot(seed), sx = g.player.x, sy = g.player.y;
  // 5つに1つは丘のふもとから始めて、坂の上り下りも混ぜる
  if (s % 5 === 0) {
    const spot = hillSpot(seed, 'base');
    if (spot) { g.player.x = spot.x; g.player.y = spot.y; g.bikes.push({ x: spot.x, y: spot.y, heading: 0, fallen: false, col: 0, type: s % 10 === 0 ? 'skate' : 'bike' }); sx = spot.x; sy = spot.y; hillStarts++; }
  }
  // シードごとに時刻をずらして、夜も通す
  g.time = (s % 4) * 6 * M.CFG.time.secondsPerHour;
  let n = fails.length;
  try {
    for (let turn = 1; turn <= TURNS; turn++) {
      const inp = bot(g, turn);
      const wasRiding = g.player.riding, wasIn = !!g.inside;
      M.step(g, inp, DT);
      if (!wasRiding && g.player.riding) rides++;
      if (!wasIn && g.inside) entered++;
      if (wasIn && !g.inside) exited++;
      for (const e of g.events) { if (e.t === 'eat') ate++; if (e.t === 'drink') drank++; }
      g.events.length = 0;
      if (M.lightAt(M.hourOf(g.time)).day < 0.5) nightTurns++;
      check(g, seed, turn);
      if (fails.length > n) break;
      const op = g.inside ? g.outPos : g.player;
      maxDist = Math.max(maxDist, Math.hypot(op.x - sx, op.y - sy));
      if (g.dead) {
        deaths++;
        causes[g.cause] = (causes[g.cause] || 0) + 1;
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

// ---- 第2段階の決まりごと ----
const CFG = M.CFG;
const at = (g, h) => { g.time = ((h - CFG.time.startHour + 24) % 24) * CFG.time.secondsPerHour; };
{
  // 昼のゾンビは歩き、夜は走る（フェードで移り変わる）
  const g = M.createGame(3);
  at(g, 12); if (Math.abs(M.chaseSpeed(g) - CFG.speed.zombieDay) > 1e-9) fail(3, 0, `昼の追跡速度が ${M.chaseSpeed(g)}`);
  at(g, 23); if (Math.abs(M.chaseSpeed(g) - CFG.speed.zombie) > 1e-9) fail(3, 0, `夜の追跡速度が ${M.chaseSpeed(g)}`);
  at(g, CFG.time.sunset + CFG.feel.sunFade / CFG.time.secondsPerHour / 2);
  const mid = M.chaseSpeed(g);
  if (!(mid > CFG.speed.zombieDay && mid < CFG.speed.zombie)) fail(3, 0, `日没の途中の追跡速度が ${mid}`);
  if (!(CFG.speed.sprint > CFG.speed.zombie)) fail(3, 0, '本気ダッシュが夜のゾンビより遅い');
}
{
  // 夜、本気ダッシュで後ろのゾンビを振り切れる（始まりの道をまっすぐ走る）
  const g = M.createGame(11), p = g.player;
  at(g, 23);
  g.zombies.length = 0; g.bikes.length = 0;
  const z = { id: 999999, x: p.x, y: p.y - 2.2, vx: 0, vy: 0, kind: 0, state: 1, timer: 0, tx: 0, ty: 0, lost: 0, stuck: 0, detour: 0, detourDir: 1, see: 0, phase: 0, face: 1, sway: 0 };
  g.zombies.push(z);
  const d0 = Math.hypot(z.x - p.x, z.y - p.y);
  for (let i = 0; i < 45; i++) { M.step(g, { mx: 0, my: 1, sprint: true }, DT); g.events.length = 0; }
  const d1 = Math.hypot(z.x - p.x, z.y - p.y);
  if (g.dead || !(d1 > d0 + 0.5)) fail(11, 0, `夜の本気ダッシュで離れられない (${d0.toFixed(2)} → ${d1.toFixed(2)}, dead=${g.dead})`);
  // 普通のダッシュでは追いつかれる
  const g2 = M.createGame(11), p2 = g2.player;
  at(g2, 23); g2.zombies.length = 0; g2.bikes.length = 0;
  const z2 = Object.assign({}, z, { x: p2.x, y: p2.y - 2.2 });
  g2.zombies.push(z2);
  for (let i = 0; i < 120 && !g2.dead; i++) { M.step(g2, { mx: 0, my: 0.75, dash: true }, DT); g2.events.length = 0; }
  if (!g2.dead) fail(11, 0, '夜、普通のダッシュでもゾンビに追いつかれない');
}
{
  // スタミナ：本気ダッシュで減り、切れたら普通のダッシュに落ちる。歩き・停止で戻る
  const g = M.createGame(5), p = g.player;
  g.zombies.length = 0;
  let sprintTurns = 0, fellBack = false;
  for (let i = 0; i < 30 * 12 && !g.dead; i++) {
    M.step(g, { mx: (i % 200 < 100 ? 1 : -1) * 0.0001, my: i % 200 < 100 ? 1 : -1, sprint: true }, DT); g.events.length = 0;
    if (p.sprint) sprintTurns++;
    if (p.tired && p.moving && !p.sprint && p.dash) fellBack = true;
  }
  const expect = CFG.needs.max / CFG.needs.sprintDrain * 30;
  if (!fellBack) fail(5, 0, 'スタミナが切れても普通のダッシュに落ちない');
  if (Math.abs(sprintTurns - expect) > expect * 0.2 + 5) fail(5, 0, `本気ダッシュの続く長さが想定と違う (${sprintTurns}ターン / 想定 ${expect.toFixed(0)})`);
  for (let i = 0; i < 15; i++) { M.step(g, { mx: 0, my: 0 }, DT); g.events.length = 0; }
  const s0 = p.stamina;
  for (let i = 0; i < 30; i++) { M.step(g, { mx: 0, my: 0 }, DT); g.events.length = 0; }
  if (!(Math.abs(p.stamina - s0 - CFG.needs.restRegen) < 0.6)) fail(5, 0, `止まって1秒でスタミナ +${(p.stamina - s0).toFixed(2)}（想定 +${CFG.needs.restRegen}）`);
}
{
  // 空腹・水分：時間で減り、0で終わる
  const g = M.createGame(8);
  g.zombies.length = 0;
  for (let i = 0; i < 30 * 60; i++) { M.step(g, {}, DT); g.events.length = 0; }
  const fl = CFG.needs.max - CFG.needs.max * 60 / CFG.needs.foodSeconds, wl = CFG.needs.max - CFG.needs.max * 60 / CFG.needs.waterSeconds;
  if (Math.abs(g.player.food - fl) > 0.5 || Math.abs(g.player.water - wl) > 0.5) fail(8, 0, `1分後の空腹 ${g.player.food.toFixed(1)} 水分 ${g.player.water.toFixed(1)}（想定 ${fl.toFixed(1)} / ${wl.toFixed(1)}）`);
  g.player.water = 0.001;
  M.step(g, {}, DT);
  if (!g.dead || g.cause !== 'thirst') fail(8, 0, '水分が0になっても終わらない');
  const g2 = M.createGame(8); g2.player.food = 0.001; M.step(g2, {}, DT);
  if (!g2.dead || g2.cause !== 'hunger') fail(8, 0, '空腹が0になっても終わらない');
}
{
  // 家の出入りと、中での飲食（始まりの区画の家すべて・全部の入口で）
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const base = M.createGame(seed);
    const sp = M.startPos();
    const c = M.getChunk(base.world, Math.floor(sp.x / M.CS), Math.floor(sp.y / M.CS));
    let foundSupply = false;
    for (const h of c.houses) h.entries.forEach((e, i) => {
      const g = M.createGame(seed), p = g.player;
      g.zombies.length = 0;
      const hh = M.getChunk(g.world, Math.floor(sp.x / M.CS), Math.floor(sp.y / M.CS)).houses.find(q => q.id === h.id);
      try {
        p.x = e.x; p.y = e.y;
        const it = M.nearestInteract(g);
        if (!it || it.type !== 'entry') { fail(seed, 0, `入口の前で入口に触れられない (家 ${h.id})`); return; }
        M.step(g, { interact: true }, DT);
        for (let k = 0; k < 20; k++) M.step(g, {}, DT);
        if (!g.inside) { fail(seed, 0, `家に入れない (家 ${h.id} 入口 ${i})`); return; }
        g.inside.zombies.length = 0;
        if (M.iBlocked(g.inside, p.x, p.y, M.CFG.player.radius)) fail(seed, 0, `家の中の出現位置が壁の中 (家 ${h.id})`);
        // 中のものを全部使う
        for (const f of g.inside.fixtures) {
          let guard = 0;
          while ((f.food > 0 || f.water > 0) && guard++ < 10) {
            const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([a, b]) => !M.ISOLID(M.iTile(g.inside, f.x + a, f.y + b)));
            if (!nb) break;
            p.x = f.x + nb[0] + 0.5; p.y = f.y + nb[1] + 0.5;
            p.food = 50; p.water = 50;
            M.step(g, { interact: true }, DT);
            if (!p.act) break;
            for (let k = 0; k < 45; k++) M.step(g, {}, DT);
            if (p.food <= 50 && p.water <= 50) fail(seed, 0, `飲み食いしても増えない (家 ${h.id})`);
            if (h.supplies) foundSupply = true;
          }
        }
        const snap = g.inside.fixtures.map(f => f.food + ',' + f.water).join(' ');
        // 出口へ押し込んで外へ
        const ex = g.inside.exits.find(q => q.entry === i);
        p.x = ex.sx; p.y = ex.sy;
        for (let k = 0; k < 40 && g.inside; k++) M.step(g, { mx: ex.ox, my: ex.oy }, DT);
        if (g.inside) fail(seed, 0, `家から出られない (家 ${h.id} 入口 ${i})`);
        else if (Math.hypot(p.x - e.x, p.y - e.y) > 0.01) fail(seed, 0, `出た場所が入口と違う (家 ${h.id})`);
        // もう一度入って、中が前のまま（使ったものは空）
        p.x = e.x; p.y = e.y;
        for (let k = 0; k < 40 && !g.inside; k++) M.step(g, { mx: e.nx, my: e.ny }, DT);
        if (!g.inside) fail(seed, 0, `入口へ押し込んでも入れない (家 ${h.id})`);
        else if (g.inside.fixtures.map(f => f.food + ',' + f.water).join(' ') !== snap) fail(seed, 0, `使ったものが戻っている (家 ${h.id})`);
        g.events.length = 0;
      } catch (err) { fail(seed, 0, `家の出入りで例外 (家 ${h.id}): ${err.stack}`); }
    });
    if (!foundSupply) fail(seed, 0, '始まりの区画の家で飲み食いできない');
  }
}
{
  // 家の中のゾンビに捕まっても同じように終わる
  const g = M.createGame(2), p = g.player, sp = M.startPos();
  g.zombies.length = 0;
  const h = M.getChunk(g.world, Math.floor(sp.x / M.CS), Math.floor(sp.y / M.CS)).houses.find(q => q.entries.length);
  p.x = h.entries[0].x; p.y = h.entries[0].y;
  M.step(g, { interact: true }, DT);
  for (let k = 0; k < 20; k++) M.step(g, {}, DT);
  const I = g.inside;
  I.zombies.length = 0;
  I.zombies.push({ id: 424242, x: p.x + 0.3, y: p.y, vx: 0, vy: 0, kind: 0, state: 1, timer: 0, tx: 0, ty: 0, lost: 0, stuck: 0, detour: 0, detourDir: 1, see: 0, phase: 0, face: 1, sway: 0 });
  M.step(g, {}, DT);
  if (!g.dead || g.cause !== 'zombie') fail(2, 0, '家の中のゾンビに触れても終わらない');
}

// ---- 第3段階：乗り物・高低差・見晴らし ----
{
  // 見える距離
  const V = CFG.view;
  if (M.viewScale(0) !== V[0] || M.viewScale(1) !== V[1] || M.viewScale(2) !== V[2]) fail(0, 0, `見える距離の倍率が違う ${M.viewScale(0)}/${M.viewScale(1)}/${M.viewScale(2)}`);
  if (!(M.viewScale(1.5) > V[1] && M.viewScale(1.5) < V[2])) fail(0, 0, '見える距離がなめらかに変わらない');
  // 坂の倍率（いちばん急な坂で表の値）
  const SM = M.SLOPE_MAX, VB = CFG.vehicle.bike, VS = CFG.vehicle.skate;
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  if (!near(M.slopeMul(SM, VB.up, VB.down), 0.5) || !near(M.slopeMul(-SM, VB.up, VB.down), 1.4)) fail(0, 0, '自転車の坂の倍率が表と違う');
  if (!near(M.slopeMul(SM, VS.up, VS.down), 0.35) || !near(M.slopeMul(-SM, VS.up, VS.down), 1.3)) fail(0, 0, 'スケボーの坂の倍率が表と違う');
  if (!near(M.slopeMul(SM, CFG.slope.zombieUp, 1), 0.8)) fail(0, 0, 'ゾンビの登りの倍率が表と違う');
  if (!(VS.speed < VB.speed && VS.turn > VB.turn)) fail(0, 0, 'スケボーが自転車より遅く・小回りが利く、になっていない');
}
{
  // 高さは 0..2、斜面はなめらか（段差・崖がない）
  let maxG = 0, maxH = 0, maxErr = 0, hillsSeen = 0;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const g = M.createGame(seed), sp = M.startPos(), C = CFG.terrain.cell;
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
      const h = M.hillAt(seed, Math.floor(sp.x / C) + i, Math.floor(sp.y / C) + j);
      if (!h) continue;
      hillsSeen++;
      const R = M.mulberry(seed * 31 + i * 7 + j);
      for (let k = 0; k < 300; k++) {
        const x = h.x + (R() - 0.5) * h.R * 2.4, y = h.y + (R() - 0.5) * h.R * 2.4;
        const a = M.heightRaw(seed, x, y), b = M.heightRaw(seed, x + 0.05, y), c = M.heightRaw(seed, x, y + 0.05);
        const gr = Math.hypot(b - a, c - a) / 0.05;
        if (!(a >= 0 && a <= 2)) fail(seed, 0, `高さが範囲外 ${a}`);
        maxG = Math.max(maxG, gr); maxH = Math.max(maxH, a);
        if (k % 10 === 0) maxErr = Math.max(maxErr, Math.abs(M.heightAt(g.world, x, y) - a));
      }
    }
  }
  console.log(`地形：丘 ${hillsSeen}個 / いちばん急な傾き ${maxG.toFixed(3)}（上限 ${M.SLOPE_MAX.toFixed(3)}）/ 最高 ${maxH.toFixed(2)} / 格子の誤差 ${maxErr.toFixed(3)}`);
  if (maxG > M.SLOPE_MAX * 1.05) fail(0, 0, `斜面が急すぎる（段差に近い） ${maxG}`);
  if (maxErr > 0.06) fail(0, 0, `チャンクの高さの格子がずれている ${maxErr}`);
  if (maxH < 1.99) fail(0, 0, '高台（高さ2）ができていない');
}
{
  // 丘のふもとから頂上まで、自転車でも歩きでも登りきれる（スタックしない）。下りも降りられる
  let climbs = 0;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) for (const mode of ['bike', 'walk']) {
    const base = hillSpot(seed, 'base', 2);
    if (!base) continue;
    const g = M.createGame(seed), p = g.player, h = base.h;
    p.x = base.x; p.y = base.y;
    g.zombies.length = 0;
    if (mode === 'bike') { g.bikes.push({ x: p.x, y: p.y, heading: 0, fallen: false, col: 0, type: 'bike' }); M.step(g, { interact: true }, DT); for (let k = 0; k < 15; k++) M.step(g, {}, DT); }
    // 頂上の平らな所で一番近い歩ける点
    let goal = null, gd = Infinity;
    for (let y = Math.floor(h.y - h.r0); y <= h.y + h.r0; y++) for (let x = Math.floor(h.x - h.r0); x <= h.x + h.r0; x++) {
      if (M.SOLID[M.tileAt(g.world, x + 0.5, y + 0.5)] || M.heightAt(g.world, x + 0.5, y + 0.5) < h.level - 0.05) continue;
      const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y);
      if (d < gd) { gd = d; goal = { x: x + 0.5, y: y + 0.5 }; }
    }
    if (!goal) { fail(seed, 0, '高台の上に立てる所がない'); continue; }
    let reached = false, lastProgress = { x: p.x, y: p.y }, best = Infinity, way = null;
    const side = { x: p.x, y: p.y, t: 0 };
    let retries = 0;
    for (let i = 0; i < 30 * 40 && !reached; i++) {
      if (i % 8 === 0 || !way) way = pathStep(g, goal.x, goal.y, 40);
      if (!way) break;
      let a = Math.atan2(way.y - p.y, way.x - p.x);
      // 電柱などに正面から当たって止まったら、人がするように少し横へよける
      if (i % 30 === 0) { if (i && Math.hypot(p.x - side.x, p.y - side.y) < 0.3) side.t = 18; side.x = p.x; side.y = p.y; }
      if (side.t > 0) { side.t--; a += Math.PI / 2 * (Math.floor(i / 120) % 2 ? 1 : -1); }
      g.zombies.length = 0; p.food = p.water = 100;   // 登れるかだけを見る
      // 曲がり角の手前では自転車も速度を落とす（人がするように）
      let turnNeed = Math.abs(((a - p.heading) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      const mg = mode === 'bike' ? (turnNeed > 0.5 ? 0.12 : 0.55) : 0.6;
      M.step(g, { mx: Math.cos(a) * mg, my: Math.sin(a) * mg }, DT);
      g.events.length = 0;
      check(g, seed, i);
      const d = Math.hypot(goal.x - p.x, goal.y - p.y);
      best = Math.min(best, d);
      // 3秒で0.5マスも動けない＝スタック
      //（人がするように、少し下がってやり直すのは5回まで）
      if (i % 90 === 0) {
        if (i && Math.hypot(p.x - lastProgress.x, p.y - lastProgress.y) < 0.5) {
          if (++retries > 5) break;
          const back = p.heading + Math.PI + (retries % 2 ? 0.6 : -0.6);
          for (let k = 0; k < 24; k++) { g.zombies.length = 0; M.step(g, { mx: Math.cos(back) * 0.5, my: Math.sin(back) * 0.5 }, DT); }
        }
        lastProgress = { x: p.x, y: p.y };
      }
      if (M.heightAt(g.world, p.x, p.y) >= h.level - 0.05) reached = true;
    }
    if (!reached) fail(seed, 0, `${mode} で高台に登れない（残り ${best.toFixed(1)}マス / 位置 ${(p.x - h.x).toFixed(1)},${(p.y - h.y).toFixed(1)} 高さ ${M.heightAt(g.world, p.x, p.y).toFixed(2)} way=${!!way} 乗車=${p.riding}）`);
    else climbs++;
  }
  console.log(`高台への登り：${climbs}回成功`);
}
{
  // 坂で速さが変わる（道路の上で、坂に沿ってまっすぐ）
  const found = [];
  for (let seed = 1; seed <= 40 && found.length < 4; seed++) {
    const g = M.createGame(seed), sp = M.startPos(), C = CFG.terrain.cell;
    for (let j = -3; j <= 3 && found.length < 4; j++) for (let i = -3; i <= 3 && found.length < 4; i++) {
      const h = M.hillAt(seed, Math.floor(sp.x / C) + i, Math.floor(sp.y / C) + j);
      if (!h) continue;
      for (let y = Math.floor(h.y - h.R); y < h.y + h.R && found.length < 4; y++) for (let x = Math.floor(h.x - h.R); x < h.x + h.R; x++) {
        if (M.tileAt(g.world, x + 0.5, y + 0.5) !== M.T.ROAD) continue;
        for (const [ux, uy] of [[1, 0], [0, 1]]) {
          const sl = M.slopeAlong(g.world, x + 0.5, y + 0.5, ux, uy);
          if (Math.abs(sl) < M.SLOPE_MAX * 0.7) continue;
          let ok = true;
          for (let k = -6; k <= 6; k++) { const tx = x + 0.5 + ux * k, ty = y + 0.5 + uy * k; if (M.tileAt(g.world, tx, ty) !== M.T.ROAD || M.blocked(g.world, tx, ty, 0.3)) { ok = false; break; } }
          if (ok && !found.some(q => q.seed === seed)) { const dn = sl > 0 ? [-ux, -uy] : [ux, uy]; found.push({ seed, x: x + 0.5, y: y + 0.5, dn }); break; }
        }
      }
    }
  }
  if (!found.length) fail(0, 0, '坂の道路が見つからない');
  for (const f of found) for (const type of ['bike', 'skate']) {
    const V = CFG.vehicle[type];
    // 坂の途中の点を通り抜けるあいだの最高速・最低速
    const run = (dir) => {
      const g = M.createGame(f.seed), p = g.player;
      g.zombies.length = 0; g.bikes.length = 0;
      p.x = f.x - dir[0] * 5; p.y = f.y - dir[1] * 5;
      p.riding = true; p.vehicle = type; p.heading = Math.atan2(dir[1], dir[0]); p.speed = V.speed;
      let top = 0, low = Infinity;
      for (let i = 0; i < 60; i++) {
        M.step(g, { mx: dir[0], my: dir[1] }, DT); g.events.length = 0; g.zombies.length = 0; check(g, f.seed, i);
        const along = (p.x - f.x) * dir[0] + (p.y - f.y) * dir[1];
        if (Math.abs(along) < 2) { top = Math.max(top, p.speed); low = Math.min(low, p.speed); }
        if (along > 3) break;
      }
      return { top, low };
    };
    const down = run(f.dn).top, up = run([-f.dn[0], -f.dn[1]]).low;
    if (!(down > V.speed * 1.05)) fail(f.seed, 0, `${type} が下り坂で速くならない (${down.toFixed(2)})`);
    if (!(up < V.speed * 0.92)) fail(f.seed, 0, `${type} が登り坂で遅くならない (${up.toFixed(2)})`);
  }
  console.log(`坂の道路 ${found.length}か所で 自転車・スケボーの上り下りを確認`);
}
{
  // スケボー：始まりの場所にあり、乗り降りでき、自転車より遅く小回りが利き、草の上では大きく遅くなる
  const g = M.createGame(1), p = g.player;
  g.zombies.length = 0;
  const sk = g.bikes.find(b => b.type === 'skate' && Math.hypot(b.x - p.x, b.y - p.y) < 6);
  if (!sk) fail(1, 0, '始まりの場所の近くにスケボーがない');
  else {
    p.x = sk.x; p.y = sk.y;
    M.step(g, { interact: true }, DT);
    for (let k = 0; k < 15; k++) M.step(g, {}, DT);
    if (!p.riding || p.vehicle !== 'skate') fail(1, 0, 'スケボーに乗れない');
    for (let k = 0; k < 90; k++) { M.step(g, { mx: 0, my: -1 }, DT); }
    if (Math.abs(p.speed - CFG.vehicle.skate.speed) > 0.05) fail(1, 0, `スケボーの平地の最高速が ${p.speed.toFixed(2)}`);
    M.step(g, { interact: true }, DT);
    if (p.riding || !g.bikes.some(b => b.type === 'skate' && Math.hypot(b.x - p.x, b.y - p.y) < 0.01)) fail(1, 0, 'スケボーを降りてもその場に残らない');
  }
  // 旋回：同じ速さで90度曲がるのにかかる時間
  const turnTime = type => {
    const g2 = M.createGame(1), q = g2.player;
    g2.zombies.length = 0;
    q.riding = true; q.vehicle = type; q.heading = -Math.PI / 2; q.speed = 2.5;
    for (let i = 1; i < 200; i++) { M.step(g2, { mx: 1, my: 0 }, DT); if (Math.abs(q.heading) < 0.05) return i; }
    return 999;
  };
  const tb = turnTime('bike'), ts = turnTime('skate');
  if (!(ts < tb)) fail(1, 0, `スケボーのほうが小回りが利かない（${ts} / ${tb}ターン）`);
  // 草の上
  const g3 = M.createGame(1), q = g3.player;
  g3.zombies.length = 0;
  let spot = null;
  for (let y = -20; y < 20 && !spot; y++) for (let x = -20; x < 20; x++) { const tx = q.x + x, ty = q.y + y; if (M.baseAt(g3.world, tx, ty) === M.T.GRASS && !M.blocked(g3.world, tx, ty, 0.35)) { spot = [tx, ty]; break; } }
  if (spot) {
    q.x = spot[0]; q.y = spot[1]; q.riding = true; q.vehicle = 'skate'; q.speed = 0; q.heading = 0;
    let mx = 0;
    for (let i = 0; i < 20; i++) { M.step(g3, { mx: 1, my: 0 }, DT); if (M.baseAt(g3.world, q.x, q.y) === M.T.GRASS) mx = Math.max(mx, q.speed); }
    if (mx > CFG.vehicle.skate.speed * 0.3) fail(1, 0, `スケボーが草の上で速すぎる ${mx.toFixed(2)}`);
  }
}

const sec = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`シード ${SEEDS}個 × ${TURNS}ターン: 終わった ${deaths}回 ${JSON.stringify(causes)} / 自転車に乗った ${rides}回 / 家に入った ${entered}回・出た ${exited}回 / 食べた ${ate}回・飲んだ ${drank}回 / 丘から始めた ${hillStarts}回 / 夜のターン ${nightTurns} / 最も遠くまで ${maxDist.toFixed(0)}マス / ${sec}秒`);
if (fails.length) {
  console.log(`\n失敗 ${fails.length}件:`);
  for (const f of fails.slice(0, 30)) console.log(`  シード ${f.seed} ターン ${f.turn}: ${f.msg}`);
  process.exit(1);
}
console.log('OK');

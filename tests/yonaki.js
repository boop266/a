// 夜鳴村（yonaki/index.html）のテスト。
// 使い方: node tests/yonaki.js [ケース名の一部...]
// three.js と PeerJS は CDN から読むが、ネットがない環境では YNK_MODULES=<node_modules のパス> を渡すとそこから読む。
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const MODS = process.env.YNK_MODULES;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    });
    srv.listen(0, () => res(srv));
  });
}
async function route(ctx) {
  if (!MODS) return;
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/(three|peerjs)@[^/]+\/(.*)$/, (rt, rq) => {
    const m = rq.url().match(/npm\/(three|peerjs)@[^/]+\/(.*)$/); const f = path.join(MODS, m[1], m[2]);
    if (fs.existsSync(f)) rt.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(f) }); else rt.abort();
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, rt => rt.fulfill({ status: 200, contentType: 'text/css', body: '' }));
}
const W8 = ms => new Promise(r => setTimeout(r, ms));
// ゲームの中の時間で待つ（遅いテスト環境でもずれない）
const WG = (p, sec) => p.evaluate(s => new Promise(r => { const t0 = G.time; const f = () => G.time - t0 >= s || G.mode !== 'game' ? r() : setTimeout(f, 20); f(); }), sec);
async function ready(p) { await p.waitForFunction(() => window.G && G.mode === 'game', null, { timeout: 30000 }); }
async function errs(p) { return p.evaluate(() => __errs.slice()); }

const cases = {
  // 何度か村を作って、どの村でも出口・家・敵・物がそろい、道がつながっているか
  async '村の生成'(ctx, base) {
    const p = await ctx.newPage(); await p.goto(base + '?solo=1&fast=1&mute=1&seed=11'); await ready(p);
    const r = await p.evaluate(() => {
      const out = [];
      for (let s = 1; s <= 12; s++) {
        const W = G.debug.genWorld(s * 7919);
        const o = { seed: s, houses: W.houses.length, enemies: W.enemies.length, items: W.items.length, closets: W.closets.length, obj: W.obj };
        o.need = W.obj === 'car' ? ['key', 'gas'].every(k => W.items.some(i => i.id === k)) : W.obj === 'tunnel' ? W.items.some(i => i.id === 'cutter') : W.objs.winches.length === 2;
        out.push(o);
      }
      return out;
    });
    for (const o of r) if (o.houses < 12 || o.enemies < 10 || !o.need || o.closets < 5) throw new Error('村が足りない: ' + JSON.stringify(o));
    // 今の村で、スタートから物・出口まで歩いて行けるか
    const reach = await p.evaluate(() => {
      const W = G.W, s = W.spawn[0], bad = [];
      for (const it of W.items) if (!G.debug.findPath(s[0], s[1], it.x, it.z)) bad.push(it.id);
      const O = W.objs; const goals = O.car ? [[O.car.x, O.car.z]] : O.gate ? [O.gate.c, ...O.winches.map(w => [w.x, w.z])] : [O.chain.c];
      for (const g of goals) if (!G.debug.findPath(s[0], s[1], g[0] + (Math.random() - .5), g[1] + 1.5)) bad.push('goal');
      return bad;
    });
    if (reach.length) throw new Error('たどり着けない: ' + reach.join(','));
    await p.close();
  },
  // ボットがしばらく遊んでもエラーが出ない（スクショも撮る）
  async 'ひとりで遊び続ける'(ctx, base) {
    const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 });
    await p.goto(base + '?solo=1&fast=1&mute=1&seed=4242&bot=1&god=1&shot=1'); await ready(p);
    await WG(p, 1.5); await p.screenshot({ path: path.join(OUT, 'ynk_solo1.png') });
    await WG(p, 12);
    const st = await p.evaluate(() => ({ t: G.t, x: me().x, z: me().z, e: G.enemies.length, errs: __errs.slice() }));
    await p.screenshot({ path: path.join(OUT, 'ynk_solo2.png') });
    if (st.errs.length) throw new Error(st.errs.join('\n'));
    if (st.t < 8) throw new Error('時間が進まない ' + st.t);
    await p.close();
  },
  // 敵は明かりをつけた人を見つけて追いかけ、殴る
  async '敵が見つけて襲う'(ctx, base) {
    const p = await ctx.newPage(); await p.goto(base + '?solo=1&fast=1&mute=1&seed=99'); await ready(p);
    const r = await p.evaluate(async () => {
      const W8 = ms => new Promise(r => { const t0 = G.time; const f = () => (G.time - t0) * 1000 >= ms || G.mode !== 'game' ? r() : setTimeout(f, 20); f(); }); const P = me();
      // 開けた道の上を探す
      const W = G.W; let spot = null;
      for (const rd of W.roads) for (const q of rd.pl) { if (q[0] < 30 || q[1] < 30 || q[0] > 114 || q[1] > 114) continue; if (G.debug.los(q[0], 1.5, q[1], q[0] + 6, 1.5, q[1]) && !G.W.nav[Math.floor(q[1] / .5) * 288 + Math.floor((q[0] + 6) / .5)]) { spot = q; break; } }
      if (!spot) return { skip: 1 };
      G.enemies.forEach(e => { e.x = 5; e.z = 5; e.st = 'routine'; e.kind = 'grave'; e.anchor = [5, 5]; e.face = [5, 6]; });
      const e = G.enemies[0]; e.x = spot[0] + 6; e.z = spot[1]; e.yaw = -Math.PI / 2; e.st = 'routine'; e.kind = 'grave'; e.anchor = [e.x, e.z]; e.face = [spot[0], spot[1]];
      G.debug.tp(spot[0], spot[1]); P.light = true; P.hp = 100;
      await W8(1500); const saw = e.st;
      await W8(2500);
      return { saw, hp: P.hp, st: P.st };
    });
    if (r.skip) return;
    if (r.saw !== 'chase' && r.saw !== 'attack') throw new Error('見つけない: ' + JSON.stringify(r));
    if (r.hp >= 100 && r.st === 'alive') throw new Error('殴らない: ' + JSON.stringify(r));
    await p.close();
  },
  // 押し入れに隠れると、見られていなければ見失う
  async '隠れる'(ctx, base) {
    const p = await ctx.newPage(); await p.goto(base + '?solo=1&fast=1&mute=1&seed=77'); await ready(p);
    const r = await p.evaluate(async () => {
      const W8 = ms => new Promise(r => { const t0 = G.time; const f = () => (G.time - t0) * 1000 >= ms || G.mode !== 'game' ? r() : setTimeout(f, 20); f(); }); const c = G.W.closets[0];
      G.debug.tp(c.x, c.z); me().yaw = Math.atan2(c.cx - c.x, c.cz - c.z);
      await W8(100); const it = G.debug.findInteract(); if (!it || !/隠れる/.test(it.label)) return { label: it && it.label };
      it.run(); await W8(100); const hid = me().hidden;
      const e = G.enemies[0]; e.x = c.x + Math.sin(c.yaw) * 3; e.z = c.z + Math.cos(c.yaw) * 3; e.yaw = Math.atan2(c.x - e.x, c.z - e.z); e.st = 'scan'; e.scanT = 3;
      await W8(1200); const st = e.st; G.debug.findInteract().run(); await W8(100);
      return { hid, st, after: me().hidden };
    });
    if (r.label !== undefined) throw new Error('隠れる操作が出ない: ' + r.label);
    if (r.hid == null || r.st === 'chase' || r.after != null) throw new Error(JSON.stringify(r));
    await p.close();
  },
  // 視界ジャック：見回した方向の敵の目に入れる
  async '視界ジャック'(ctx, base) {
    const p = await ctx.newPage(); await p.setViewportSize({ width: 390, height: 844 }); await p.goto(base + '?solo=1&fast=1&mute=1&seed=5&shot=1'); await ready(p);
    const r = await p.evaluate(async () => {
      const W8 = ms => new Promise(r => { const t0 = G.time; const f = () => (G.time - t0) * 1000 >= ms || G.mode !== 'game' ? r() : setTimeout(f, 20); f(); }); const P = me(), e = G.enemies[0];
      G.enemies.forEach(o => { if (o !== e) { o.x = 3; o.z = 3; o.down = 999; } }); e.x = P.x + 18; e.z = P.z + 6; e.st = 'scan'; e.scanT = 99; await W8(100);
      G.cam.yaw = Math.atan2(e.x - P.x, e.z - P.z); G.in.sj = true; await W8(300);
      const a = { on: G.sj.on, id: G.sj.view && G.sj.view.o.id, clar: G.sj.clar, want: e.id };
      G.cam.yaw += Math.PI; await W8(200); a.away = G.sj.view ? G.sj.view.o.id : null; G.cam.yaw -= Math.PI; await W8(300);
      return a;
    });
    await p.screenshot({ path: path.join(OUT, 'ynk_sj.png') });
    await p.evaluate(() => { G.in.sj = false; });
    if (!r.on || r.id !== r.want || r.clar < .3) throw new Error(JSON.stringify(r));
    await p.close();
  },
  // 仕掛け：押し入れの先客が飛び出して追ってくる／黒電話が鳴って敵を呼び、受話器を取ると止まる
  async '仕掛け'(ctx, base) {
    const p = await ctx.newPage(); await p.goto(base + '?solo=1&fast=1&mute=1&seed=61&god=1'); await ready(p);
    const r = await p.evaluate(async () => {
      const W8 = ms => new Promise(r => { const t0 = G.time; const f = () => (G.time - t0) * 1000 >= ms || G.mode !== 'game' ? r() : setTimeout(f, 20); f(); });
      const o = {}; G.enemies.forEach(e => { e.x = 3; e.z = 3; e.down = 999; });
      const c = G.W.closets.find(c => c.occ); o.hasOcc = !!c;
      if (c) {
        const n0 = G.enemies.length; G.debug.tp(c.x, c.z); me().yaw = Math.atan2(c.cx - c.x, c.cz - c.z); await W8(100);
        const it = G.debug.findInteract(); o.label = it && it.label; it.run(); await W8(300);
        const e = G.enemies[G.enemies.length - 1]; o.spawned = G.enemies.length === n0 + 1; o.hidden = me().hidden; o.chase = e.st === 'chase' || e.st === 'attack' || e.stun > 0;
      }
      o.phones = G.W.phones.length;
      const ph = G.W.phones[0];
      if (ph) {
        const e = G.enemies[0]; e.down = 0; e.st = 'routine'; e.kind = 'grave'; e.x = ph.x + 8; e.z = ph.z; e.anchor = [e.x, e.z]; e.face = [e.x + 1, e.z];
        G.debug.tp(ph.x + 5.5, ph.z); await W8(400); o.ring = G.obj['ph0'] != null; await W8(800); o.heard = e.st;
        G.debug.tp(ph.x + .9, ph.z); await W8(100); const it = G.debug.findInteract(); o.pl = it && it.label; if (it) it.run(); await W8(200); o.up = G.obj['pu0'] != null;
      }
      return o;
    });
    if (!r.hasOcc || r.label !== '押し入れに隠れる' || !r.spawned || r.hidden != null || !r.chase) throw new Error('押し入れ: ' + JSON.stringify(r));
    if (r.phones && (!r.ring || r.heard === 'routine' || r.pl !== '受話器を取る' || !r.up)) throw new Error('電話: ' + JSON.stringify(r));
    const e = await errs(p); if (e.length) throw new Error(e.join('\n'));
    await p.close();
  },
  // 三つの脱出条件をそれぞれ最後まで通す
  async '脱出できる'(ctx, base) {
    for (const obj of ['car', 'tunnel', 'gate']) {
      const p = await ctx.newPage(); await p.goto(base + `?solo=1&fast=1&mute=1&seed=31&obj=${obj}&god=1`); await ready(p);
      const r = await p.evaluate(async (obj) => {
        const W8 = ms => new Promise(r => { const t0 = G.time; const f = () => (G.time - t0) * 1000 >= ms || G.mode !== 'game' ? r() : setTimeout(f, 20); f(); }); const P = me(), O = G.W.objs;
        G.enemies.forEach(e => { e.x = 3; e.z = 3; e.down = 999; });
        const hold = async (x, z, re) => {
          G.debug.tp(x, z); await W8(80);
          for (let k = 0; k < 80; k++) { const it = G.debug.findInteract(); if (it && re.test(it.label)) break; P.yaw += .3; await W8(20); }
          const it = G.debug.findInteract(); if (!it || !re.test(it.label)) return 'no:' + (it && it.label);
          G.in.act = true; G.in.actTap = true; await W8((it.need || 0) * 1000 + 300); G.in.act = false; await W8(100); return 'ok';
        };
        const log = [];
        for (const it of G.W.items.filter(i => ['key', 'gas', 'cutter'].includes(i.id))) log.push(await hold(it.x, it.z, /拾う/));
        if (obj === 'car') { const c = O.car; const pt = G.debug.findPath(c.x + 2.6, c.z + 2.6, c.x, c.z); const [x, z] = [c.x + Math.sin(c.yaw + 1.57) * 1.6, c.z + Math.cos(c.yaw + 1.57) * 1.6]; log.push(await hold(x, z, /給油/)); log.push(await hold(x, z, /エンジン/)); log.push(await hold(x, z, /乗り込む/)); }
        if (obj === 'tunnel') { const c = O.chain.c, d = O.chain.yaw; log.push(await hold(c[0] + Math.sin(d) * 1.2, c[1] + Math.cos(d) * 1.2, /鎖を切る/)); await W8(200); G.debug.tp(c[0] - Math.sin(d) * 2.5, c[1] - Math.cos(d) * 2.5); }
        if (obj === 'gate') { for (const w of O.winches) log.push(await hold(w.x + Math.sin(w.yaw) * 1.1, w.z + Math.cos(w.yaw) * 1.1, /巻き上げる/)); await W8(300); const c = O.gate.c, d = O.gate.yaw; G.debug.tp(c[0] - Math.sin(d) * 3, c[1] - Math.cos(d) * 3); }
        await W8(600);
        return { log, st: P.st, res: G.result, open: G.obj };
      }, obj);
      if (!r.res || !r.res.win) throw new Error(obj + ' で脱出できない: ' + JSON.stringify(r));
      const e = await errs(p); if (e.length) throw new Error(e.join('\n'));
      await p.close();
    }
  },
  // サイレンが鳴ると敵が増え、倒した敵が起き上がる。最後は時間切れ
  async 'サイレン'(ctx, base) {
    const p = await ctx.newPage(); await p.goto(base + '?solo=1&fast=1&mute=1&seed=8&st=6'); await ready(p);
    const r = await p.evaluate(async () => {
      const W8 = ms => new Promise(r => { const t0 = G.time; const f = () => (G.time - t0) * 1000 >= ms || G.mode !== 'game' ? r() : setTimeout(f, 20); f(); }); G.enemies[0].down = 999; const n0 = G.enemies.length;
      G.debug.tp(G.W.spawn[0][0], G.W.spawn[0][1]); G.enemies.forEach(e => { if (Math.hypot(e.x - me().x, e.z - me().z) < 40) { e.x = 3; e.z = 3; } });
      await W8(7000); return { n0, n1: G.enemies.length, siren: G.siren, down: G.enemies[0].down };
    });
    if (r.siren < 1 || r.n1 <= r.n0 || r.down > 0) throw new Error(JSON.stringify(r));
    await p.close();
  },
  // 同じ端末の二つのタブで協力プレイ（BroadcastChannel）
  async 'ふたりで遊ぶ'(ctx, base) {
    const room = 'T' + Math.floor(Math.random() * 1e6);
    const h = await ctx.newPage(), c = await ctx.newPage();
    await h.goto(base + `?net=local&room=${room}&role=host&autostart=1&fast=1&mute=1&seed=123&name=ホスト`);
    await c.goto(base + `?net=local&room=${room}&role=join&fast=1&mute=1&name=ゲスト`);
    await ready(h); await ready(c);
    const same = await Promise.all([h, c].map(p => p.evaluate(() => ({ seed: G.W.seed, n: G.enemies.length, items: G.W.items.length, me: G.me, names: G.players.map(p => p.name) }))));
    if (same[0].seed !== same[1].seed || same[0].n !== same[1].n || same[1].me !== 1) throw new Error('村がそろわない ' + JSON.stringify(same));
    // ゲストが動くとホストに見える
    await c.evaluate(() => { const s = G.W.spawn[1]; G.debug.tp(s[0] + 1, s[1]); });
    await WG(h, 0.5);
    const seen = await h.evaluate(() => [G.players[1].x, G.players[1].z]); const real = await c.evaluate(() => [me().x, me().z]);
    if (Math.hypot(seen[0] - real[0], seen[1] - real[1]) > .5) throw new Error('位置が届かない ' + seen + ' / ' + real);
    // 敵の位置がゲスト側にも届く
    await h.evaluate(() => { const e = G.enemies[0]; e.x = 50; e.z = 50; e.down = 999; });
    await WG(h, 0.6);
    const ep = await c.evaluate(() => [G.enemies[0].x, G.enemies[0].z]);
    if (Math.hypot(ep[0] - 50, ep[1] - 50) > 1) throw new Error('敵の位置が届かない ' + ep);
    // ゲストが物を拾うとホストからも消える
    const uid = await c.evaluate(async () => { const it = G.W.items.find(i => i.id === 'med'); G.debug.tp(it.x, it.z); await new Promise(r => setTimeout(r, 150)); G.debug.findInteract().run(); return it.uid; });
    await WG(h, 0.5);
    const gone = await h.evaluate(u => !!G.W.items.find(i => i.uid === u).gone, uid); const med = await c.evaluate(() => me().med);
    if (!gone || med !== 1) throw new Error('拾った物が同期しない ' + gone + ' ' + med);
    // ゲストが倒れ、ホストが起こす
    await h.evaluate(() => G.debug.bcast({ t: 'hit', i: 1, dmg: 200, id: G.enemies[1].id }));
    await WG(h, 0.5);
    const down = await h.evaluate(() => G.players[1].st);
    if (down !== 'down') throw new Error('倒れたのが伝わらない ' + down);
    await h.evaluate(async () => { const q = G.players[1]; G.debug.tp(q.x + .8, q.z); G.enemies.forEach(e => e.down = 999); await new Promise(r => setTimeout(r, 100)); G.in.act = true; G.in.actTap = true; await new Promise(r => { const t0 = G.time; const f = () => G.time - t0 >= 2.9 ? r() : setTimeout(f, 20); f(); }); G.in.act = false; });
    await WG(h, 0.5);
    const up = await c.evaluate(() => [me().st, me().hp]);
    if (up[0] !== 'alive') throw new Error('起こせない ' + up);
    // ゲストが倒れたまま時間が過ぎると還り人になり、ホスト側に敵が一体増える
    const n0 = await h.evaluate(() => G.enemies.length);
    await h.evaluate(() => G.debug.bcast({ t: 'hit', i: 1, dmg: 200, id: G.enemies[1].id }));
    await WG(h, 0.4); await c.evaluate(() => { me().downT = .1; });
    await WG(h, 0.8);
    const turned = await h.evaluate(() => ({ st: G.players[1].st, n: G.enemies.length, last: G.enemies[G.enemies.length - 1].kind }));
    const cst = await c.evaluate(() => ({ st: me().st, sj: G.sj.on, n: G.enemies.length }));
    if (turned.st !== 'ghost' || turned.n !== n0 + 1 || turned.last !== 'turned' || cst.st !== 'ghost' || !cst.sj || cst.n !== n0 + 1) throw new Error('還り人にならない ' + JSON.stringify([turned, cst]));
    await c.screenshot({ path: path.join(OUT, 'ynk_ghost.png') });
    // 幽霊は物音で敵をそらせる
    await h.evaluate(() => G.enemies.forEach(e => { if (e.down > 0) { e.down = 0; e.st = 'routine'; e.hp = 3; } }));
    await WG(h, 0.5);
    const polt = await c.evaluate(async () => { const e = G.enemies.find(e => e.kind !== 'turned' && e.id !== G.enemies[0].id && e.anim !== 6 && e.stc === 0); G.sj.obj = e; await new Promise(r => setTimeout(r, 100)); document.getElementById('bNoise').click(); return e.id; });
    await WG(h, 0.5);
    const pst = await h.evaluate(id => G.enemies.find(e => e.id === id).st, polt);
    if (pst !== 'inv') throw new Error('物音が効かない ' + pst);
    // ホストだけ脱出しても、ゲストが幽霊なら終わる（ひとりだけ生還）
    await h.evaluate(() => G.debug.req('esc'));
    await WG(h, 0.6);
    const res = await Promise.all([h, c].map(p => p.evaluate(() => G.result && G.result.why)));
    if (res[0] !== 'partial' || res[1] !== 'partial') throw new Error('終わり方がそろわない ' + res);
    for (const p of [h, c]) { const e = await errs(p); if (e.length) throw new Error(e.join('\n')); }
    await h.close(); await c.close();
  },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(); const base = `http://localhost:${srv.address().port}/yonaki/index.html`;
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const want = process.argv.slice(2);
  let fail = 0;
  for (const [name, fn] of Object.entries(cases)) {
    if (want.length && !want.some(w => name.includes(w))) continue;
    const ctx = await br.newContext(); await route(ctx);
    const t0 = Date.now();
    try { await fn(ctx, base); console.log('ok  ', name, ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
    catch (e) { fail++; console.log('FAIL', name, '\n     ' + String(e.message || e).split('\n').join('\n     ')); }
    await ctx.close();
  }
  await br.close(); srv.close();
  console.log(fail ? `${fail} 件失敗` : 'すべて成功');
  process.exit(fail ? 1 : 0);
})();

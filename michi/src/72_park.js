// ════════════════ 遊園地のしくみ（電気・乗り物） ════════════════
Object.assign(G.park, { gen: { fuel: 62, run: false, bat: false }, main: false, br: { lights: false, wheel: false, car: false, coaster: false, haunt: false, fountain: false }, run: { wheel: false, car: false, coaster: false }, wheelA: 0, wheelV: 0, carA: 0, carV: 0, gate: false, vanBat: true });
const parkPower = () => G.park.gen.run && G.park.main && G.park.gen.fuel > 0;
const parkSys = s => parkPower() && G.park.br[s];
const isNight = () => !!curD && (curD.night > .3 || curD.h > 18.6);
const inPark = (x, y) => x > 146 && x < 211 && y > 24 && y < 62;
// ───────── ジェットコースターの線路（なめらかな輪） ─────────
const CO_PTS = [[199.5, 43.6, .35], [202.5, 43.6, .35], [205.5, 43.6, .35], [207.6, 44.2, .6], [208.8, 46.2, 1.2], [208.9, 49, 3], [208.9, 54, 8], [208.9, 57.2, 11], [208.2, 59.7, 11.4], [205.8, 60.4, 10], [202.8, 60.4, 5], [199.8, 60, 1.3], [197.4, 58.6, 1.6], [196.9, 55.6, 4.4], [197.6, 53.2, 5], [199.6, 52, 3.6], [202.6, 52.4, 3], [204.6, 50.4, 2.6], [203.2, 48, 2.2], [200.6, 48.4, 1.8], [198.4, 47.6, 1.2], [197.4, 46, .8], [198, 44.4, .45]];
const CO = (() => {
  const n = CO_PTS.length, out = [], cr = (a, b, c2, d, t) => .5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t);
  for (let i = 0; i < n; i++) { const p0 = CO_PTS[(i - 1 + n) % n], p1 = CO_PTS[i], p2 = CO_PTS[(i + 1) % n], p3 = CO_PTS[(i + 2) % n]; for (let j = 0; j < 12; j++) { const t = j / 12; out.push([0, 1, 2].map(q => cr(p0[q], p1[q], p2[q], p3[q], t))) } }
  let s = 0; const pts = out.map((p, i) => { if (i) s += Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1], p[2] - out[i - 1][2]); return { x: p[0], y: p[1], z: p[2], s } });
  const len = s + Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1], out[0][2] - out[out.length - 1][2]);
  const sAt = i => pts[i * 12].s, lift0 = sAt(5), lift1 = sAt(7), stop = sAt(1);
  return { pts, len, lift0, lift1, stop };
})();
function coAt(s) { const L = CO.len; s = ((s % L) + L) % L; const P2 = CO.pts; let lo = 0, hi = P2.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (P2[m].s <= s) lo = m; else hi = m - 1 } const a = P2[lo], b = P2[(lo + 1) % P2.length], sb = lo + 1 < P2.length ? b.s : L, t = (s - a.s) / Math.max(1e-6, sb - a.s); return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), dx: b.x - a.x, dy: b.y - a.y, dz: b.z - a.z } }
G.park.co = { s: CO.stop, v: 0, ph: 'wait', t: 0 };
// 支柱の下は通れない
for (let i = 0; i < CO.pts.length; i += 5) { const p = CO.pts[i]; if (p.z < .8) continue; const k = key(Math.floor(p.x), Math.floor(p.y)); if (!SOLID[0].has(k)) obj({ type: 'wpit', x: Math.floor(p.x), y: Math.floor(p.y), solid: true }) }
furn('cboard', 201, 42, { solid: false, name: 'ジェットコースターの乗り場' });
// ───────── 毎フレーム ─────────
function parkUpdate(dt) {
  const pk = G.park, g = pk.gen;
  if (g.run) { g.fuel -= dt * .01; if (g.fuel <= 0) { g.fuel = 0; g.run = false; sfx('off'); toast('遊園地の発電機が、止まった') } }
  // 観覧車：とてもゆっくり。メリーゴーランド：くるくる
  const wv = parkSys('wheel') && pk.run.wheel ? .05 : 0; pk.wheelV += (wv - pk.wheelV) * Math.min(1, dt * .4); pk.wheelA += pk.wheelV * dt;
  const cvT = parkSys('car') && pk.run.car ? .42 : 0; pk.carV += (cvT - pk.carV) * Math.min(1, dt * .5); pk.carA += pk.carV * dt;
  coasterUpdate(dt);
  // お化け屋敷の仕掛け
  if (parkSys('haunt') && P.L === 0) for (const o of OBJ) { if (o.type !== 'ghost') continue; const d = Math.hypot(o.x + .5 - P.x, o.y + .5 - P.y); if (d < 1.7 && (!o.pop || G.gameT - o.pop > 12)) { o.pop = G.gameT; sfx('scare'); say(['ひゃっ！', 'うわぁっ！', 'もう、やだぁ……'][Math.floor(Math.random() * 3)], .2) } }
  // 遊園地に電気が戻った瞬間
  if (parkPower() && !G.flags.parkOn) { G.flags.parkOn = true; say(P.L === 0 && inPark(P.x, P.y) ? 'ついた……！' : '遊園地のほう、なにか動いた……？', .8) }
  if (pk.wheelV > .03 && !G.flags.wheelMove) { G.flags.wheelMove = true; once('wheelmove', '観覧車、動いてる……！', 1) }
  if (pk.carV > .3 && !G.flags.carMove && Math.hypot(P.x - CC[0], P.y - CC[1]) < 16) { G.flags.carMove = true; once('carmove', 'わあ……なつかしい音', 1) }
}
// ジェットコースター：巻き上げ・重力・ブレーキ
function coasterUpdate(dt) {
  const co = G.park.co, on = parkSys('coaster') && G.park.run.coaster;
  if (co.ph === 'wait') { co.v = 0; co.t += dt; if (on && co.t > (G.rideOn && G.rideOn.type === 'coaster' ? 2.5 : 7)) { co.ph = 'run'; co.v = 2.2; co.t = 0; sfx('clank'); if (G.rideOn && G.rideOn.type === 'coaster') say('……安全バー、下りた', .2) } return }
  const L = CO.len, s = ((co.s % L) + L) % L, p = coAt(s), slope = p.dz / Math.max(.05, Math.hypot(p.dx, p.dy, p.dz));
  if (s > CO.lift0 && s < CO.lift1) { co.v = 1.7; if (Math.floor(G.gameT * 3) !== Math.floor((G.gameT - dt) * 3) && Math.hypot(camX - p.x, camY - p.y) < 30) sfx('chain') }
  else { co.v += (-9 * slope - .04 * co.v * co.v) * dt; co.v = Math.max(co.v, 1.3); if (!on && co.v > 1.3) co.v = Math.max(1.3, co.v - dt * 2) }
  const prev = s; co.s += co.v * dt; const ns = ((co.s % L) + L) % L;
  // 一周して、乗り場に戻る
  if (prev < CO.stop && ns >= CO.stop || ns < prev && ns >= CO.stop) { co.s = CO.stop; co.ph = 'wait'; co.t = 0; co.v = 0; sfx('brake'); if (G.rideOn && G.rideOn.type === 'coaster') { G.rideOn.done = true; say(['……もう一回乗る？', 'ひざ、笑ってる……', 'たのしかったー！'][Math.floor(Math.random() * 3)], .6) } }
  if (G.rideOn && G.rideOn.type === 'coaster' && co.ph === 'run') { const sc = coAt(co.s); if (sc.dz < -.04 && co.v > 4 && !G.rideOn.scr) { G.rideOn.scr = 1; say('きゃーーーっ！'); sfx('wind') } if (sc.dz > .04) G.rideOn.scr = 0 }
}
// ───────── 乗り物に乗っているあいだ ─────────
function rideStart(r) { G.rideOn = r; P.hide = F.hide = true; P.stair = null; G.panX = G.panY = 0 }
function rideEnd(x, y) { const r = G.rideOn; G.rideOn = null; P.hide = F.hide = false; P.x = x; P.y = y; P.L = 0; P.z = 0; TRAIL.length = 0; F.x = x - .7; F.y = y + .2; F.L = 0; F.z = 0; if (r && r.type === 'wheel' && !r.still) once('wheelend', 'また乗ろうね', 1) }
function wheelGondola(i) { const a = G.park.wheelA + i / WN * Math.PI * 2; return { a, x: WC[0] + Math.cos(a) * WR * .5, y: WC[1] - Math.cos(a) * WR * .5, z: WZ + Math.sin(a) * WR } }
const wheelBottom = () => { let best = 0, bd = 9; for (let i = 0; i < WN; i++) { const g = wheelGondola(i), d = Math.abs(Math.sin((g.a + Math.PI / 2) / 2)); if (d < bd) { bd = d; best = i } } return best };
function rideUpdate(dt, D) {
  const r = G.rideOn; r.t = (r.t || 0) + dt;
  let mx = 0, my = 0; if (keys.KeyW || keys.ArrowUp) my -= 1; if (keys.KeyS || keys.ArrowDown) my += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
  if (touch.on) { const dx = touch.x - touch.sx, dy = touch.y - touch.sy, d = Math.hypot(dx, dy); if (d > 10) { mx = dx / Math.max(d, 60); my = dy / Math.max(d, 60) } }
  let wx = mx + my, wy = my - mx; if (G.inpW) { wx = G.inpW[0]; wy = G.inpW[1] }
  if (r.type === 'wheel') {
    const g = wheelGondola(r.gi); P.x = g.x; P.y = g.y; P.z = Math.max(0, g.z - 1.3); P.L = 0;
    if (!r.still) { r.trav = (r.trav || 0) + G.park.wheelV * dt; if (g.z > WZ + WR - 1.2) once('wheeltop', 'てっぺん……！ ねえ、海が見える', .5); if (r.trav > Math.PI * 2 - .04) { rideEnd(WC[0] + 2.5, WC[1] + 2.5); return } }
    // 高いところから、まわりを見わたす（移動キー）
    const sp = 14 * dt; G.panX = clamp((G.panX || 0) + (wx) * sp, -45, 45); G.panY = clamp((G.panY || 0) + (wy) * sp, -45, 45);
  } else if (r.type === 'car') {
    const i = r.i, n = i < 10 ? 10 : 7, rr = i < 10 ? 3.3 : 2.1, a = G.park.carA + (i % 10) / n * Math.PI * 2 + (i < 10 ? 0 : .3); P.x = CC[0] + Math.cos(a) * rr; P.y = CC[1] + Math.sin(a) * rr; P.z = .9 + (G.park.carV > .05 ? Math.sin(G.park.carA * 3 + i) * .25 : 0); P.fx = -Math.sin(a); P.fy = Math.cos(a);
  } else if (r.type === 'coaster') {
    const co = G.park.co, p = coAt(co.s); P.x = p.x; P.y = p.y; P.z = p.z + .3; const l = Math.hypot(p.dx, p.dy) || 1; P.fx = p.dx / l; P.fy = p.dy / l;
    if (r.done && co.ph === 'wait') { rideEnd(201.5, 42.5); return }
  } else if (r.type === 'swan') {
    const o = r.o, sp = 1.5, l = Math.hypot(wx, wy); if (l > .1) { const nx = o.fx + wx / Math.max(1, l) * sp * dt, ny = o.fy + wy / Math.max(1, l) * sp * dt; const ok = (x, y) => GT[key(Math.floor(x), Math.floor(y))] === TG.pond; if (ok(nx + Math.sign(wx) * .45, o.fy) && ok(nx, o.fy + .3) && ok(nx, o.fy - .3)) o.fx = nx; if (ok(o.fx, ny + Math.sign(wy) * .45) && ok(o.fx + .3, ny) && ok(o.fx - .3, ny)) o.fy = ny; o.a = Math.atan2(wy, wx); if (Math.floor(G.gameT * 2.4) !== Math.floor((G.gameT - dt) * 2.4)) sfx('paddle') }
    o.x = Math.floor(o.fx); o.y = Math.floor(o.fy); P.x = o.fx; P.y = o.fy; P.z = .35; if (r.t > 6) once('swan', 'こぐの、けっこう疲れるね', 0); P.stam = clamp(P.stam - dt * (l > .1 ? 1.5 : 0), 0, 100);
  }
  F.x = P.x; F.y = P.y; F.z = P.z; F.L = 0;
}
function rideExit() {
  const r = G.rideOn; if (!r) return;
  if (r.type === 'wheel') { const g = wheelGondola(r.gi); if (!r.still && g.z > WZ - WR + 1.2) { toast('ゴンドラは空の上。降りられない'); return } rideEnd(WC[0] + 2.5, WC[1] + 2.5); return }
  if (r.type === 'car') { const a = Math.atan2(P.y - CC[1], P.x - CC[0]); rideEnd(CC[0] + Math.cos(a) * (CR + .9), CC[1] + Math.sin(a) * (CR + .9)); return }
  if (r.type === 'coaster') { if (G.park.co.ph === 'run') { toast('走っている。降りられない'); return } rideEnd(201.5, 42.5); return }
  if (r.type === 'swan') { const o = r.o; let best = null, bd = 2.2; for (let y = 44; y <= 49; y++)for (let x = 160; x <= 177; x++) { const g = GT[key(x, y)]; if (g !== TG.quay && g !== TG.parkpath && g !== TG.grass) continue; if (!basicPass(0, key(x, y))) continue; const d = Math.hypot(x + .5 - o.fx, y + .5 - o.fy); if (d < bd) { bd = d; best = [x + .5, y + .5] } } if (!best) { toast('ここからは降りられない。桟橋まで戻ろう'); return } rideEnd(best[0], best[1]) }
}
// ───────── 調べる・使う ─────────
function parkVerb(o) {
  const pk = G.park, g = pk.gen;
  switch (o.type) {
    case 'turnstile': return '乗りこえる';
    case 'wboard': return pk.wheelV > .02 ? '観覧車に乗る' : '止まったゴンドラに乗りこむ';
    case 'opbooth': case 'opanel': return parkSys(o.sys) ? (pk.run[o.sys] ? '運転を止める' : '〈運転〉ボタンを押す') : '操作盤（明かりがついていない）';
    case 'carousel': return '木馬に乗る';
    case 'swan': return 'スワンボートに乗る';
    case 'cboard': return pk.co.ph === 'wait' ? 'ジェットコースターに乗る' : '（コースターが戻ってくるのを待つ）';
    case 'pgen': return !g.bat ? (has('battery_car') ? 'バッテリーをつなぐ' : 'セルを回す') : g.run ? '発電機を止める' : g.fuel <= 0 ? '発電機（燃料がない）' : 'エンジンをかける';
    case 'mainpanel': return pk.main ? '主ブレーカーを切る' : '主ブレーカーを入れる';
    case 'rbreaker': return pk.br[o.sys] ? `〈${o.label}〉を切る` : `〈${o.label}〉を入れる`;
    case 'pgate': return pk.gate ? '門を閉める' : has('key_park') ? '鍵で門を開ける' : '関係者以外立入禁止の門';
    case 'car': if (o.van) return !pk.vanBat ? '（バッテリーは外した）' : has('wrench') ? 'ボンネットを開けて、バッテリーを外す' : 'ボンネット（工具がいる）'; return null;
  }
  return null;
}
function parkInteract(o) {
  const pk = G.park, g = pk.gen;
  switch (o.type) {
    case 'turnstile': startAct('よいしょ……', 1, () => { const to = P.y < 62.5 ? 63.4 : 61.5; P.y = to; P.x = o.x + .5; TRAIL.length = 0; F.x = P.x + (hash(o.x, 3) > .5 ? .6 : -.6); F.y = to + (to > 62 ? .4 : -.4); sfx('push'); once('turnstile', 'おじゃましまーす……', .4) }); return true;
    case 'wboard': { const gi = wheelBottom(), gg = wheelGondola(gi); if (pk.wheelV > .02) { if (gg.z > WZ - WR + .9) { toast('次のゴンドラが下りてくるのを待とう'); return true } rideStart({ type: 'wheel', gi }); sfx('door'); say('ドア、しめるね', .5) } else { rideStart({ type: 'wheel', gi, still: true }); sfx('door'); toast('ゴンドラの中にすわった') } return true }
    case 'opbooth': case 'opanel': if (!parkSys(o.sys)) { sfx('tap'); toast('ボタンを押しても、何も起きない'); return true } pk.run[o.sys] = !pk.run[o.sys]; sfx(pk.run[o.sys] ? 'buzzer' : 'off'); if (o.sys === 'coaster' && pk.run.coaster) pk.co.t = 0; return true;
    case 'carousel': { const n = Math.floor(Math.random() * 10); rideStart({ type: 'car', i: n }); sfx('tap'); return true }
    case 'swan': rideStart({ type: 'swan', o }); sfx('slide'); return true;
    case 'cboard': if (pk.co.ph !== 'wait') { toast('コースターが走っている'); return true } rideStart({ type: 'coaster' }); sfx('door'); once('coaster0', 'ほんとに乗るの……？', .6); return true;
    case 'pgen':
      if (!g.bat) { if (take('battery_car')) { startAct('バッテリーをつないでいる……', 2.4, () => { g.bat = true; sfx('switch'); toast('バッテリーをつないだ') }) } else { sfx('starter'); toast('カチ、カチ……。セルが回らない'); once('genbat', 'バッテリー、上がってるのかな', 1) } return true }
      if (g.run) { g.run = false; sfx('off'); return true } if (g.fuel <= 0) { toast('燃料がない'); return true }
      startAct('セルを回している……', 1.6, () => { g.run = true; sfx('engine'); toast('ドドドド……発電機が動き出した') }); return true;
    case 'mainpanel': pk.main = !pk.main; sfx('clunk'); if (pk.main && !g.run) toast('ガチャン。……でも、何も起きない'); return true;
    case 'rbreaker': pk.br[o.sys] = !pk.br[o.sys]; sfx('switch'); return true;
    case 'pgate': if (!pk.gate && !has('key_park')) { sfx('tap'); toast('鍵がかかっている'); return true } pk.gate = !pk.gate; o.state = pk.gate ? 1 : 0; parkGateSolid(); sfx('door'); return true;
    case 'car': if (!o.van) return false; if (!pk.vanBat) { toast('もう外してある'); return true } if (!has('wrench')) { toast('ボンネットの中のバッテリーは、工具がないと外せない'); return true } startAct('スパナで端子をゆるめている……', 3, () => { pk.vanBat = false; give('battery_car'); sfx('pick'); toast('車のバッテリーを手に入れた。ずっしり重い', '#c8f0a0') }); return true;
  }
  return false;
}
function parkGateSolid() { const o = OBJ.find(q => q.type === 'pgate'); const k = key(o.x, o.y); if (G.park.gate) SOLID[0].delete(k); else SOLID[0].set(k, o) }
// 歩いていて、ふと目に入るもの（ともだちが気づく）
const WSIGHTS = [
  { k: 'w_wheel', x: WC[0], y: WC[1], z: WZ + WR, t: 'あれ……観覧車？ 遊園地かな', t2: 'ねえ、あそこ行ってみない？', cond: () => !inPark(P.x, P.y) },
  { k: 'w_beam', x: LHC[0], y: LHC[1], z: LH_TOP + 2, t: '……灯台の光？', night: true, cond: () => P.x < 230 },
  { k: 'w_light', x: FARLIGHT[0], y: FARLIGHT[1], z: 3, t: 'あんなところに、灯り……', night: true, cond: () => Math.hypot(P.x - FARLIGHT[0], P.y - FARLIGHT[1]) > 14 },
  { k: 'w_sea', x: 238, y: 72, z: 0, t: '海だ……！', day: true },
  { k: 'w_bridge', x: 128, y: 15, z: 2, t: '鉄橋……線路の先、どこまで続いてるんだろ', cond: () => P.x < 125 },
];

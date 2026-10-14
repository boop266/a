// ════════════════ 遊び（歩く・調べる・電気・ともだち・抜け殻・名場面） ════════════════
const G = { t: 17 * 60 + 5, power: false, gen: { fuel: 0, run: false }, breaker: false, litLevel: 10, ride: null, msgs: [], sit: false, sleep: null, scope: 0, scopeMax: 7, started: false, inv: {}, gameT: 0, wind: .5, cine: null, flags: {}, found: {}, mapOpen: false, photo: false, explored: new Uint8Array(N), touchUI: false, title: true, note: null, chapter: false, restNear: false };
const P = { x: 47.5, y: 71.6, L: 0, z: 0, stair: null, fx: 1, fy: -.35, hp: 100, hunger: 82, thirst: 76, stam: 100, act: null, moving: false, walkT: 0, climb: null, knock: 0, place: '', stepT: 0, push: 0 };
const F = { x: 46.4, y: 72.3, L: 0, z: 0, fx: 1, fy: 0, moving: false, walkT: 0, say: null, sayT: 0, said: {}, point: 0 };
const TRAIL = [{ x: P.x, y: P.y, L: 0, z: 0 }];
const ZB = ZSTART.map(([x, y], i) => ({ x: x + .5, y: y + .5, L: 0, z: 0, fx: 1, fy: 0, down: 0, wander: hash(i, 3) * 6, ci: i % 8, step: hash(i, 7) * 4, zombie: true, chase: false }));
const FIRES = OBJ.filter(o => o.type === 'firebarrel' || o.type === 'firepit');
const give = (id, n = 1) => { G.inv[id] = (G.inv[id] || 0) + n }, has = id => (G.inv[id] || 0) > 0, take = id => { if (has(id)) { G.inv[id]--; if (!G.inv[id]) delete G.inv[id]; return true } return false };
give('water'); give('onigiri');
function toast(t, col) { G.msgs.push({ t, col: col || '#fff', life: 3.8 }); if (G.msgs.length > 4) G.msgs.shift() }
// ゲームの時間で「少しあとに」起きること（止めている間は進まない）
const LATER = []; function later(sec, f) { LATER.push({ at: G.gameT + sec, f }) }
function say(t, wait = 0) { const f = () => { F.say = t; F.sayT = 3.6 }; if (wait) later(wait, f); else f() }
function once(k, t, wait) { if (F.said[k]) return; F.said[k] = 1; say(t, wait) }
// ───────── 歩けるか ─────────
function basicPass(L, k) { const g = LEV[L]; if (!g) return false; const t = g.t[k]; if (t === EMPTY) return L === 0 && !SOLID[0].has(k) && GT[k] !== TG.water; if (t === FLOOR) return !SOLID[L].has(k); if (t === DOOR) { const d = DOORS.get(L * N + k); return d.open } return false }
function pass(a, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return false; const L = a.L, k = key(tx, ty), ct = key(Math.floor(a.x), Math.floor(a.y));
  if (a.stair) { const s = a.stair; if (s.set.has(k) || k === s.entry) return true; if (k === s.arr) return basicPass(s.L + 1, k); return false }
  if (a.zombie) { const t = LEV[L].t[k]; if (t === STAIR || t === HOLE) return false; if (GT[k] === TG.pond) return false }
  const sr = RUNON[L].get(k); if (sr) return ct === sr.entry || sr.set.has(ct);
  const hr = HOLEON[L].get(k); if (hr) return ct === hr.arr || hr.set.has(ct);
  if (L === 0 && GT[k] === TG.pond && !SOLID[0].has(k)) { return OBJ.some(o => o.type === 'pbridge' && tx >= o.x && tx < o.x + o.w && ty === o.y) }
  return basicPass(L, k)
}
function free(a, x, y, r = .26) { for (const [cx, cy] of [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]]) if (!pass(a, Math.floor(cx), Math.floor(cy))) return false; return true }
function frac(s, a) { const d = s.dir; if (d[0]) { const e = d[0] > 0 ? s.tiles[0][0] : s.tiles[0][0] + 1; return clamp((a.x - e) * d[0] / s.len, 0, 1) } const e = d[1] > 0 ? s.tiles[0][1] : s.tiles[0][1] + 1; return clamp((a.y - e) * d[1] / s.len, 0, 1) }
function stairUpdate(a) {
  const k = key(Math.floor(a.x), Math.floor(a.y));
  if (a.stair) { const s = a.stair; if (k === s.arr) { a.L = s.L + 1; a.stair = null; a.z = a.L * LH; return 'up' } if (k === s.entry) { a.stair = null; a.z = s.L * LH; return } a.z = s.L * LH + frac(s, a) * LH; if (s.dir[0]) a.y += (Math.floor(a.y) + .5 - a.y) * .25; else a.x += (Math.floor(a.x) + .5 - a.x) * .25; return }
  const sr = RUNON[a.L].get(k); if (sr) { a.stair = sr; a.z = a.L * LH + frac(sr, a) * LH; return }
  const hr = HOLEON[a.L].get(k); if (hr) { a.L = hr.L; a.stair = hr; a.z = hr.L * LH + frac(hr, a) * LH; return 'down' }
  a.z = a.L * LH
}
function moveActor(a, dx, dy) { let m = false; if (dx && free(a, a.x + dx, a.y)) { a.x += dx; m = true } if (dy && free(a, a.x, a.y + dy)) { a.y += dy; m = true } return m }
// ───────── 場所の名前 ─────────
function placeName() {
  const tx = Math.floor(P.x), ty = Math.floor(P.y), bid = LEV[P.L].bid[key(tx, ty)];
  if (bid) { const B = BLD[bid]; for (const [L, a, b, c2, d, n] of B.rooms) if (L === P.L && tx >= a && tx <= c2 && ty >= b && ty <= d) return n; if (bid === T_ID && P.L > 0 && P.L < 8) return `非常階段　${P.L + 1}階`; return B.name }
  const g = GT[key(tx, ty)];
  if (Math.hypot(tx - DCX, ty - DCY) < 18) return 'タワー前の広場'; if (ty < 24 && tx > 34 && tx < 94) return '駅のホーム'; if (ty >= 30 && ty <= 39 && tx >= 44 && tx <= 78) return '駅前広場';
  if (tx < 37 && ty > 20 && ty < 52) return '神社の森'; if (tx >= 34 && tx <= 57 && ty >= 76 && ty <= 100) return '公園'; if (tx >= 67 && tx <= 107 && ty >= 80 && ty <= 116) return '学校'; if (g === TG.water || g === TG.bank || g === TG.bridge) return '川べり';
  if (tx >= 6 && tx <= 34 && ty >= 56 && ty <= 68) return 'ガソリンスタンド'; if (tx >= 66 && tx <= 75 && ty >= 56 && ty <= 68) return 'コンビニの前';
  if (ty >= 69 && ty <= 74) return '中央通り'; if (Math.hypot(tx - 64, ty - 70) < 55) return '住宅街'; return '町はずれ'
}
// 塔は1階ぶんが高い（展望台150m）。家や学校は1階 3.5m くらい
const altitude = () => { const b = LEV[P.L] ? LEV[P.L].bid[key(Math.floor(P.x), Math.floor(P.y))] : 0; return Math.round(Math.max(0, P.z) * (b === T_ID ? 7.8 : 3.5 / LH)) };
function clockStr() { const m = Math.floor(G.t) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
// ───────── 調べる ─────────
const NOINT = new Set(['parapet', 'tree', 'pole', 'canopy', 'pcanopy', 'plazalamp', 'block', 'hedge', 'fence', 'flower', 'plant', 'lantern', 'bike', 'cans', 'shoes', 'laundry', 'pipes', 'sdesk', 'chair', 'seat', 'gate', 'watertank', 'podium', 'flagpole', 'goal', 'pantograph', 'jungle', 'slide', 'mirror', 'tlight', 'busstop', 'postbox', 'atm', 'clock', 'pbridge', 'kotatsu_no', 'mattress_no', 'magazine_no']);
function interactables() {
  const out = []; const L = P.L;
  for (const d of DOORS.values()) { if (d.L !== L || d.kind === 'T') continue; if (Math.floor(P.x) === d.x && Math.floor(P.y) === d.y) continue; const dist = Math.hypot(clamp(P.x, d.x, d.x + 1) - P.x, clamp(P.y, d.y, d.y + 1) - P.y); if (dist < .95) out.push({ kind: 'door', d, dist, x: d.x + .5, y: d.y + .5, z: L * LH + 1.7 }) }
  for (const o of OBJ) {
    if (o.L !== L || NOINT.has(o.type)) continue; if (o.type === 'bench' && !o.seat) continue; if ((o.type === 'car' || o.type === 'bus') && o.searched) continue;
    const nx = clamp(P.x, o.x, o.x + o.w), ny = clamp(P.y, o.y, o.y + o.h), dist = Math.hypot(nx - P.x, ny - P.y); if (dist < 1.15) out.push({ kind: 'obj', o, dist: dist + (o.type === 'note' ? -.2 : 0), x: o.x + o.w / 2, y: o.y + o.h / 2, z: L * LH + 1.5 })
  }
  // 向いている方を優先（扉の前で、横の棚より扉が選ばれるように）
  const fl = Math.hypot(P.fx, P.fy) || 1; for (const it of out) { const dx = it.x - P.x, dy = it.y - P.y, d = Math.hypot(dx, dy) || 1; it.score = it.dist - .3 * Math.max(0, (dx * P.fx + dy * P.fy) / (d * fl)) }
  out.sort((a, b) => a.score - b.score); return out
}
function verbOf(it) {
  if (it.kind === 'door') {
    const d = it.d; if (d.kind === 'E') return G.power ? 'エレベーターに乗る' : 'エレベーター（動かない）';
    if (d.kind === 'G' && d.stuck) return '止まった自動ドアを手で開ける';
    if (d.lock) return d.lock === 'key_staff' ? (has('key_staff') ? '鍵で開ける' : '鍵がかかっている') : (has('crowbar') ? 'バールでこじあける' : '鍵がかかっている');
    return d.open ? '閉める' : '開ける'
  }
  const o = it.o; switch (o.type) {
    case 'generator': return G.gen.run ? '発電機を止める' : G.gen.fuel <= 0 ? (has('jerry_full') ? '燃料を入れる' : '発電機（燃料がない）') : 'エンジンをかける';
    case 'breaker': return G.breaker ? 'ブレーカーを下げる' : 'ブレーカーを上げる'; case 'telescope': return '望遠鏡をのぞく'; case 'bench': case 'swing': return 'すわって休む';
    case 'ladder': return 'はしごを登る'; case 'ladder_top': return 'はしごを降りる'; case 'antenna': return '見わたす';
    case 'vending': return o.searched ? '（からっぽ）' : has('crowbar') ? 'バールでこじあける' : '自動販売機（電気がない）';
    case 'piano': return 'ピアノを弾く'; case 'omikuji': return 'おみくじを引く'; case 'saisen': return '手を合わせる'; case 'taiko': return '太鼓をたたく';
    case 'firebarrel': case 'firepit': return o.fire ? 'あたたまる' : (has('lighter') ? '火をおこす' : '火をおこす道具がない');
    case 'futon': case 'bed': case 'cbed': case 'mattress': return '眠る';
  }
  if (o.items && !o.searched && o.items.length) return '調べる'; if (o.read) return '読む・見る'; return o.searched ? '（からっぽ）' : '調べる'
}
function startAct(label, dur, done) { P.act = { label, t: 0, dur, done } }
function interact() {
  if (G.ride || P.climb || G.cine || G.sleep) return; if (G.sit) { G.sit = false; G.restNear = false; return }
  const it = interactables()[0]; if (!it) return; sfx('tap');
  if (it.kind === 'door') {
    const d = it.d;
    if (d.kind === 'E') { if (!G.power) { toast('ボタンを押しても反応がない。電気がきていない…', '#ffb0a0'); once('elev', '電気、どこから来てるんだろ'); return } rideElevator(d); return }
    if (d.kind === 'G' && d.stuck) { startAct('すきまに指をかけて…', 1.4, () => { for (const e of d.group) { e.stuck = false; e.open = true } sfx('slide'); toast('自動ドアをこじあけた') }); return }
    if (d.lock) {
      if (d.lock === 'key_staff' && has('key_staff')) { d.lock = null; d.open = true; sfx('door'); toast('スタッフの鍵で開いた'); return }
      if (has('crowbar')) { startAct('バールでこじあけている…', 2.2, () => { d.lock = null; d.open = true; sfx('crash'); noise(P.x, P.y, 12); toast('ガキン！ 扉がひらいた'); if (d.kind === 'gate') once('gate', 'やっちゃったね…行こう') }); return }
      toast(d.lock === 'crowbar' ? 'がっちり閉まっている。こじあける道具がいる' : '鍵がかかっている。鍵はどこだろう', '#ffd090'); return
    }
    if (d.open) { if (Math.hypot(d.x + .5 - P.x, d.y + .5 - P.y) < .62) return; d.open = false } else d.open = true; sfx(d.kind === 'S' ? 'slide' : 'door'); return
  }
  const o = it.o;
  switch (o.type) {
    case 'generator': if (G.gen.run) { G.gen.run = false; sfx('off'); toast('発電機を止めた'); return }
      if (G.gen.fuel <= 0) { if (take('jerry_full')) { give('jerry_empty'); startAct('とくとく…燃料を入れている', 2, () => { G.gen.fuel = 100; toast('発電機に燃料が入った') }) } else toast('燃料がからっぽだ。どこかで手に入れないと', '#ffd090'); return }
      startAct('ひもを引いている…', 1.6, () => { G.gen.run = true; sfx('engine'); toast('ブルン…ブルルルル！ 発電機が動き出した'); say('動いた！'); if (G.breaker) powerOn() }); return;
    case 'breaker': G.breaker = !G.breaker; sfx('switch'); if (G.breaker && !G.gen.run) toast('ブレーカーを上げた。でも、電気が来ていない', '#ffd090'); else if (G.breaker) powerOn(); else { G.power = false; toast('ブレーカーを下げた') } return;
    case 'telescope': lookScope(7); return;
    case 'bench': case 'swing': G.sit = true; G.restNear = true; G.seat = o; P.x = o.x + o.w / 2; P.y = o.y + .5; if (o.type === 'swing') P.x = o.x + .8; toast('すわって、ひと休み'); if (P.L === 8) once('bench', '……きれいだね', 1.8); else if (o.L === 2) once('roofbench', '屋上って、なんかいいよね', 1.6); else once('bench0', 'ちょっと休も', 1.2); return;
    case 'ladder': startClimb(1); return; case 'ladder_top': startClimb(-1); return;
    case 'antenna': lookScope(9); toast('風が強い。世界が、ぜんぶ見える気がする'); once('top', 'ここまで来たね', 1.5); return;
    case 'vending': if (o.searched) { toast('もう空っぽだ'); return } if (!has('crowbar')) { toast('電気がなくて動かない。こじあける道具があれば…', '#ffd090'); return } startAct('ガラスをこじあけている…', 1.6, () => { noise(P.x, P.y, 9); loot(o) }); return;
    case 'piano': if (G.pianoT > G.gameT) return; const dur = playPianoTheme() || 8; G.pianoT = G.gameT + dur; toast('ポロン…'); AU.want = 'none'; G.musicHold = G.gameT + dur; once('piano', '……その曲、知ってる。どこで聴いたんだっけ', 5); return;
    case 'omikuji': { const R2 = [['大吉', '旅：思いのほか遠くまで行ける。\n待ち人：灯りの下で会える。'], ['吉', '旅：急がずに。夕暮れは味方。\n失せ物：高いところで見つかる。'], ['中吉', '旅：ふたりなら道は続く。\n健康：よく眠ること。'], ['末吉', '旅：橋の向こうに良いことあり。\n願い事：時間はかかるが叶う。'], ['小吉', '旅：迷ったら線路にそって。\n恋愛：言葉にするとよし。']]; const r = R2[Math.floor(Math.random() * R2.length)]; sfx('page'); showNote(`おみくじ　【${r[0]}】`, r[1]); once('omikuji', r[0] === '大吉' ? '大吉！？ いいなあ' : 'わたしも引こうかな', 2.5); return }
    case 'saisen': sfx('shrinebell'); toast('手を合わせた。少しだけ、心が静かになった'); once('pray', '……なにをお願いしたの？', 2); return;
    case 'taiko': sfx('taiko'); noise(P.x, P.y, 10); return;
    case 'firebarrel': case 'firepit': if (o.fire) { G.sit = true; G.restNear = true; toast('火にあたる。体があたたまっていく'); return } if (!has('lighter')) { toast('火をおこす道具がない。ライターがあれば…', '#ffd090'); return } startAct('火をおこしている…', 2, () => { o.fire = true; sfx('flame'); toast('ぱちぱちと、火がついた'); once('fire', 'あったかい……', 1.5) }); return;
    case 'futon': case 'bed': case 'cbed': case 'mattress': goSleep(o); return;
  }
  if (o.read && (!o.items || o.searched || !o.items.length)) { showNote(o.name || '', o.read); o.readDone = 1; sfx('page'); reactRead(o); return }
  if (o.items) { if (o.searched) { if (o.read) showNote(o.name, o.read); else toast('もう何もない'); return } startAct('調べている…', .7, () => { loot(o); if (o.read) { showNote(o.name, o.read); reactRead(o) } }); return }
}
function reactRead(o) { if (o.type === 'register' && o.L === 0 && LEV[0].bid[key(o.x, o.y)] === K_ID) once('konbini', '「ご自由にどうぞ」だって……', 1); if (o.name === '黒板' && o.L === 1) once('board2', '……会えたのかな、みんな', 1.5); if (o.type === 'desk' && /運転日誌/.test(o.read)) once('diary', 'ひかりが丘……東の方だね', 1.5); if (o.type === 'note' && o.L === -1) once('b1note', '先に行った人がいるんだ', 1.5) }
function loot(o) { o.searched = true; if (!o.items.length) { toast(`${o.name || 'ここ'}には何もなかった`); return } const names = o.items.map(i => IT[i].n); for (const i of o.items) give(i); sfx('pick'); toast(`${names.join('、')} を手に入れた`, '#c8f0a0'); if (o.items.includes('jerry_full')) say('これで発電機、動かせるかも', .9); if (o.items.includes('key_staff')) say('スタッフって書いてあるね', .9); if (o.items.includes('lighter')) say('ライター！ 夜、焚き火できるね', .9) }
function showNote(title, text) { G.note = { title, text, t: 0 } }
function rideElevator(d) { const to = d.L === 0 ? 8 : 0; G.ride = { t: 0, dur: 4.6, from: d.L, to }; sfx('ding'); toast(to === 8 ? '展望台へ…' : '1階へ…') }
function startClimb(dir) { P.climb = { t: 0, dur: 3.4, dir, from: P.L }; P.x = BX + 6.5; P.y = BY + 9.05; P.fx = 0; P.fy = -1; P.stair = null }
function lookScope(sec) { G.scope = sec; G.scopeMax = sec; toast('望遠鏡をのぞいた'); const D = dayInfo(G.t); if ((P.L >= 8) && (D.night > .4 || D.h > 18.6)) { if (!G.flags.farlight) { G.flags.farlight = true; startCine('farlight') } else once('scope2', 'あの灯り、まだついてる', 1.5) } else once('scope', 'あっちの山、行ってみたいね', 1.6) }
function goSleep(o) { const h = (G.t % 1440) / 60; if (!(h >= 19 || h < 5) && P.stam > 35) { toast('まだ眠くない'); return } G.sleep = { t: 0, o }; P.x = o.x + .5; P.y = o.y + .5; toast('おやすみ……') }
function powerOn() { if (!G.gen.run || !G.breaker) return; G.power = true; if (!G.flags.poweredOnce) { G.flags.poweredOnce = true; startCine('power') } else toast('電気が戻った') }
// ───────── 名場面 ─────────
function startCine(type) {
  const c = G.cine = { type, t: 0, outside: false };
  if (type === 'power') { c.outside = true; c.viewL = 0; c.dur = 11; G.litLevel = -2; sfx('power'); toast('ガチャン。どこか遠くで、機械がうなり始めた') }
  if (type === 'deck') { c.dur = 8 }
  if (type === 'farlight') { c.outside = true; c.viewL = 0; c.dur = 10 }
  if (type === 'intro') { c.dur = 6 }
}
function cineUpdate(dt) {
  const c = G.cine; c.t += dt; let tx = P.x, ty = P.y, tz = P.z, tk = camK, rate = 2;
  if (c.type === 'power') { const f = c.t; tx = DCX + 9; ty = DCY + 15; tz = 6; tk = .5; rate = f < 1 ? 6 : 1.5; c.dark = f < .8 ? f / .8 * .6 : f > c.dur - 1 ? (f - c.dur + 1) * .6 : .3; const lv = Math.floor((f - 1.5) / .55) - 1; if (lv > G.litLevel && lv <= 10) { G.litLevel = lv; sfx('light') } if (f > 8.5 && !c.said) { c.said = 1; say('ついた……！'); F.point = 3 } if (f > c.dur) { G.litLevel = 10; G.cine = null; toast('塔に、明かりが戻った', '#ffe0a0') } }
  else if (c.type === 'deck') { tk = .36; rate = .6; if (c.t > 1.2 && !c.said) { c.said = 1; say('うわぁ…街が全部見える') } if (c.t > c.dur) G.cine = null }
  else if (c.type === 'farlight') { const f = c.t; tx = lerp(P.x, FARLIGHT[0] - 6, ease(clamp(f / 4.5, 0, 1))); ty = lerp(P.y, FARLIGHT[1] + 3, ease(clamp(f / 4.5, 0, 1))); tz = 2; tk = .42; rate = 1.4; if (f > 4.5 && !c.s1) { c.s1 = 1; say('あれ…灯り？ だれか、いるのかな') } if (f > 7.5 && !c.s2) { c.s2 = 1; say('行ってみようよ、あの灯りまで') } if (f > c.dur) { G.cine = null; G.chapter = true; G.chapterT = 0 } }
  else if (c.type === 'intro') { const f = c.t; const k2 = f < 1 ? 0 : f < 3.5 ? ease((f - 1) / 2.5) : f < 4.5 ? 1 : 1 - ease((f - 4.5) / 1.5); tx = lerp(P.x, DCX, k2 * .85); ty = lerp(P.y, DCY, k2 * .85); tz = k2 * 10; tk = lerp(1.15, .62, k2); rate = 3; if (f > .5 && !c.s1) { c.s1 = 1; say('ねえ、あの塔……てっぺんまで、行ってみない？') } if (f > c.dur) G.cine = null }
  camX = lerp(camX, tx, 1 - Math.exp(-dt * rate)); camY = lerp(camY, ty, 1 - Math.exp(-dt * rate)); camZ = lerp(camZ, tz, 1 - Math.exp(-dt * rate)); camK = lerp(camK, tk, 1 - Math.exp(-dt * rate * .8));
}
// ───────── 入力 ─────────
const keys = {}; const touch = { id: null, sx: 0, sy: 0, x: 0, y: 0, on: false };
addEventListener('keydown', e => {
  if (e.repeat) return; keys[e.code] = true; audioStart();
  if (G.title) { if (e.code === 'KeyN' && hasSave()) return; titleChoose(e.code === 'KeyC' ? 'cont' : 'new'); return }
  if (G.note) { G.note = null; return } if (G.chapter && G.chapterT > 2) { G.chapter = false; return }
  if (G.photo) { if (e.code === 'KeyP' || e.code === 'Enter' || e.code === 'Space') takePhoto(); if (e.code === 'Escape') G.photo = false; return }
  if (e.code === 'KeyM') { G.mapOpen = !G.mapOpen; sfx('page'); return } if (G.mapOpen) { if (e.code === 'Escape') G.mapOpen = false; return }
  if (e.code === 'KeyP') { G.photo = true; return }
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') interact(); if (e.code === 'KeyF') shove();
  if (e.code === 'KeyZ') { if (G.sit) { G.sit = false; G.restNear = false } else if (!G.cine) { G.sit = true; G.restNear = true; toast('その場にすわって休む') } }
  if (/^Digit[1-9]$/.test(e.code)) useSlot(+e.code.slice(5) - 1);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false });
const toCanvas = e => { const r = cv.getBoundingClientRect(), s = Math.min(r.width / CW, r.height / CH), ox = (r.width - CW * s) / 2, oy = (r.height - CH * s) / 2; return [(e.clientX - r.left - ox) / s, (e.clientY - r.top - oy) / s] };
const BTN = { act: { x: CW - 96, y: CH - 176, r: 48, t: '調べる' }, push: { x: CW - 200, y: CH - 112, r: 34, t: '押す' }, rest: { x: CW - 96, y: CH - 282, r: 30, t: '休む' }, map: { x: CW - 46, y: 150, r: 26, t: '地図' }, photo: { x: CW - 46, y: 214, r: 26, t: '写真' } };
cv.addEventListener('pointerdown', e => {
  audioStart(); const [x, y] = toCanvas(e);
  if (G.title) { const b = titleButtons(); for (const t of b) if (x > t.x && x < t.x + t.w && y > t.y && y < t.y + t.h) { titleChoose(t.id); return } return }
  if (G.note) { G.note = null; return } if (G.chapter && G.chapterT > 2) { G.chapter = false; return }
  if (G.photo) { takePhoto(); return } if (G.mapOpen) { G.mapOpen = false; return }
  if (e.pointerType !== 'mouse') G.touchUI = true;
  if (G.touchUI) for (const [k, b] of Object.entries(BTN)) if (Math.hypot(x - b.x, y - b.y) < b.r + 8) { if (k === 'act') interact(); if (k === 'push') shove(); if (k === 'rest') { G.sit = !G.sit; G.restNear = G.sit } if (k === 'map') G.mapOpen = true; if (k === 'photo') G.photo = true; return }
  const s = invSlots(); for (let i = 0; i < s.length; i++)if (x > s[i].x && x < s[i].x + s[i].w && y > s[i].y && y < s[i].y + s[i].h) { useSlot(i); return }
  if (x < CW * .55 && y > CH * .3 && G.touchUI) { touch.id = e.pointerId; touch.sx = x; touch.sy = y; touch.x = x; touch.y = y; touch.on = true }
  else if (!G.touchUI) { const it = interactables()[0]; if (it) interact() }
});
cv.addEventListener('pointermove', e => { if (e.pointerId !== touch.id) return; const [x, y] = toCanvas(e); touch.x = x; touch.y = y });
const endT = e => { if (e.pointerId === touch.id) { touch.on = false; touch.id = null } }; cv.addEventListener('pointerup', endT); cv.addEventListener('pointercancel', endT);
function invSlots() { const ids = Object.keys(G.inv), w = 62, gap = 6, x0 = CW / 2 - (ids.length * (w + gap)) / 2; return ids.map((id, i) => ({ id, x: x0 + i * (w + gap), y: CH - 76, w, h: 62 })) }
function useSlot(i) { const s = invSlots()[i]; if (!s) return; const it = IT[s.id]; if (it.use) { take(s.id); toast(it.use(P), '#c8f0a0'); sfx('pick') } else toast(`${it.n}。使える場所で使おう`) }
function shove() { if (P.act || G.ride || G.cine) return; P.push = .35; sfx('push'); for (const z of ZB) { if (z.L !== P.L) continue; const dx = z.x - P.x, dy = z.y - P.y, d = Math.hypot(dx, dy); if (d < 1.5 && (dx * P.fx + dy * P.fy) / (d || 1) > .1) { moveActor(z, dx / d * .9, dy / d * .9); z.down = 4.5; z.chase = false } } }
const NOISE = []; function noise(x, y, r) { NOISE.push({ x, y, r, t: 2 }) }
// ───────── 動かす ─────────
let camX = 66, camY = 60, camZ = 6, camK = .62;
function update(dt) {
  G.gameT += dt; G.wind = .5 + Math.sin(G.gameT * .13) * .3 + Math.sin(G.gameT * .51) * .15;
  const D = dayInfo(G.t);
  for (const p of PETALS) { p.x += (40 * G.wind + 10) * dt * p.v; p.y += (14 + Math.sin(G.gameT * 2 + p.ph) * 16) * dt * p.v; if (p.x > CW + 10) { p.x = -10; p.y = Math.random() * CH } if (p.y > CH + 10) { p.y = -10; p.x = Math.random() * CW } }
  for (const f of FLIES) { f.ph += dt; f.x += Math.sin(f.ph * .7 + f.hx) * dt * .4; f.y += Math.cos(f.ph * .53 + f.hy) * dt * .4; f.x += (f.hx - f.x) * dt * .05; f.y += (f.hy - f.y) * dt * .05 }
  BIRDS.next -= dt; if (BIRDS.next < 0 && D.h > 16 && D.h < 19.2) { BIRDS.next = 25 + Math.random() * 30; const y0 = camY - 30 + Math.random() * 20, x0 = camX - 40; for (let i = 0; i < 7; i++)BIRDS.list.push({ x: x0 - i * 1.6, y: y0 + (i % 2) * 1.2 + i * .6, z: 9 + Math.random() * 2, ph: Math.random() * 6, vx: 5.5, vy: 2.2 }); if (AU.ac) crow(AU.ac.currentTime + .2, .04) }
  for (const b of BIRDS.list) { b.x += b.vx * dt; b.y += b.vy * dt } BIRDS.list = BIRDS.list.filter(b => b.x < camX + 60);
  if (G.title) { titleCam(dt); musicPick(D); if (AU.ac) { musicUpdate(); ambUpdate(dt, D, 0, false, 99, 0) } return }
  for (let i = LATER.length - 1; i >= 0; i--) if (LATER[i].at <= G.gameT) { const f = LATER[i].f; LATER.splice(i, 1); f() }
  G.t += dt * (G.sleep && !G.sleep.done ? 60 : .45);
  for (const m of G.msgs) m.life -= dt; G.msgs = G.msgs.filter(m => m.life > 0); if (F.sayT > 0) F.sayT -= dt; if (F.point > 0) F.point -= dt; if (G.scope > 0) G.scope -= dt; if (P.push > 0) P.push -= dt; if (G.chapter) G.chapterT += dt;
  for (const n of NOISE) n.t -= dt; while (NOISE.length && NOISE[0].t <= 0) NOISE.shift();
  G.power = G.gen.run && G.breaker && G.gen.fuel > 0;
  if (G.gen.run) { G.gen.fuel -= dt * .012; if (G.gen.fuel <= 0) { G.gen.run = false; G.gen.fuel = 0; G.power = false; toast('発電機の燃料が切れた', '#ffb0a0') } }
  // 体
  P.hunger = clamp(P.hunger - dt * .05, 0, 100); P.thirst = clamp(P.thirst - dt * .075, 0, 100); if (P.hunger <= 0 || P.thirst <= 0) P.hp = clamp(P.hp - dt * .5, 0, 100);
  if (G.sit) { const fire = FIRES.some(o => o.fire && o.L === P.L && Math.hypot(o.x + .5 - P.x, o.y + .5 - P.y) < 3); P.stam = clamp(P.stam + dt * (fire ? 30 : 18), 0, 100); P.hp = clamp(P.hp + dt * (fire ? 1.2 : .4), 0, 100) }
  if (G.sleep) { const s = G.sleep; s.t += dt; if (s.t > 2.2 && !s.done) { s.done = true; const m = G.t % 1440; const target = 6 * 60; const add = m < target ? target - m : 1440 - m + target; G.t += add; P.stam = 100; P.hp = clamp(P.hp + 40, 0, 100); P.hunger = clamp(P.hunger - 18, 0, 100); P.thirst = clamp(P.thirst - 22, 0, 100); saveGame(); } if (s.t > 4.4) { G.sleep = null; toast('朝になった。小鳥が鳴いている', '#ffe0a0'); once('morning', 'おはよ。よく眠れた？', 1) } camFollow(dt, D); finishFrame(dt, D); return }
  if (G.cine) { cineUpdate(dt); finishFrame(dt, D); return }
  // エレベーター
  if (G.ride) { const r = G.ride; r.t += dt; if (r.t > r.dur / 2 && !r.moved) { r.moved = true; P.L = r.to; P.z = r.to * LH; P.x = BX + 14.5; P.y = BY + 9.5; P.stair = null; TRAIL.length = 0; F.L = P.L; F.z = P.z; F.x = P.x - .8; F.y = P.y - .1; if (r.to === 8 && !G.flags.deck) { G.flags.deck = true; later(.9, () => startCine('deck')) } } if (r.t >= r.dur) { G.ride = null; sfx('ding') } camFollow(dt, D); finishFrame(dt, D); return }
  if (P.climb) { const c = P.climb; c.t += dt; P.z = c.from * LH + clamp(c.t / c.dur, 0, 1) * LH * c.dir; P.stam = clamp(P.stam - dt * 6, 0, 100); if (c.t >= c.dur) { P.L = c.from + c.dir; P.z = P.L * LH; P.x = BX + (c.dir > 0 ? 6.5 : 7.5); P.y = BY + (c.dir > 0 ? 7.5 : 8.5); P.climb = null; TRAIL.length = 0; F.L = P.L; F.z = P.z; F.x = P.x + .9; F.y = P.y - (c.dir > 0 ? .4 : 0); if (P.L === 10) { toast('てっぺんに出た。風の音しかしない'); once('topfirst', 'こわっ……でも、すごい', 1.5) } } camFollow(dt, D); finishFrame(dt, D); return }
  // 歩く
  let mx = 0, my = 0; if (keys.KeyW || keys.ArrowUp) my -= 1; if (keys.KeyS || keys.ArrowDown) my += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
  if (touch.on) { const dx = touch.x - touch.sx, dy = touch.y - touch.sy, d = Math.hypot(dx, dy); if (d > 10) { mx = dx / Math.max(d, 60); my = dy / Math.max(d, 60) } }
  let wx = mx + my, wy = my - mx; if (G.inpW) { wx = G.inpW[0]; wy = G.inpW[1] }
  if (P.act) { P.act.t += dt; if (Math.hypot(wx, wy) > .3 && P.act.t > .2) { P.act = null; toast('やめた') } else if (P.act.t >= P.act.dur) { const d = P.act.done; P.act = null; d() } wx = wy = 0 }
  if (G.mapOpen || G.photo || G.note) wx = wy = 0;
  if (G.sit && Math.hypot(wx, wy) > .3) { G.sit = false; G.restNear = false } if (G.sit) wx = wy = 0;
  const run = (keys.ShiftLeft || keys.ShiftRight || (touch.on && Math.hypot(touch.x - touch.sx, touch.y - touch.sy) > 80)) && P.stam > 5;
  const ll = Math.hypot(wx, wy); P.moving = ll > .1;
  if (P.moving) {
    wx /= Math.max(1, ll); wy /= Math.max(1, ll); P.fx = wx; P.fy = wy; let sp = (run ? 5 : 3.1) * (P.stair ? .62 : 1) * (P.stam < 10 ? .7 : 1); if (P.knock > 0) sp *= .5;
    const steps = Math.ceil(sp * dt / .12); for (let i = 0; i < steps; i++) { moveActor(P, wx * sp * dt / steps, wy * sp * dt / steps); const r = stairUpdate(P); if (r === 'up' && P.L === 8 && !G.flags.deck) { G.flags.deck = true; startCine('deck') } }
    P.walkT += dt * sp; if (P.stair) P.stam = clamp(P.stam - dt * (run ? 9 : 3.6), 0, 100); else if (run) { P.stam = clamp(P.stam - dt * 7, 0, 100); if (P.L === 0) noise(P.x, P.y, 5) } else P.stam = clamp(P.stam + dt * 3, 0, 100);
    P.stepT -= dt * sp; if (P.stepT < 0) { P.stepT = 1.15; const fm = LEV[P.L].fm[key(Math.floor(P.x), Math.floor(P.y))], g = GT[key(Math.floor(P.x), Math.floor(P.y))]; sfx(P.stair && fm === FM.conc ? 'stepm' : (P.L === 0 && [TG.grass, TG.forest, TG.bank, TG.sand, TG.yard, TG.dirt, TG.sgravel].includes(g) && !LEV[0].bid[key(Math.floor(P.x), Math.floor(P.y))]) ? 'stepg' : 'step', .7) }
    const last = TRAIL[TRAIL.length - 1]; if (!last || Math.hypot(last.x - P.x, last.y - P.y) > .08 || last.L !== P.L) { TRAIL.push({ x: P.x, y: P.y, L: P.L, z: P.z }); if (TRAIL.length > 500) TRAIL.shift() }
  } else P.stam = clamp(P.stam + dt * (G.sit ? 0 : 4), 0, 100);
  if (P.knock > 0) P.knock -= dt;
  updateFriend(dt); updateZombies(dt, D);
  camFollow(dt, D); finishFrame(dt, D);
}
function finishFrame(dt, D) {
  // 場所が変わったら
  const pl = placeName(); if (pl !== P.place) { P.place = pl; G.placeT = 3.2; if (!G.found[pl]) { G.found[pl] = 1 } placeLines(pl, D) }
  if (G.placeT > 0) G.placeT -= dt;
  if (P.L === 0 && Math.floor(G.gameT * 2) !== Math.floor((G.gameT - dt) * 2)) { const px = Math.floor(P.x), py = Math.floor(P.y); for (let y = py - 11; y <= py + 11; y++)for (let x = px - 11; x <= px + 11; x++)if (x >= 0 && y >= 0 && x < GW && y < GH && (x - px) ** 2 + (y - py) ** 2 < 121) G.explored[key(x, y)] = 1 }
  if (D.h > 19.2 && D.h < 19.6) once('night', '暗くなってきたね……', 0); if (P.stam < 18) once('tired', 'ちょっと休もうか', 0); if (P.hunger < 25) once('hungry', 'おなか、すいたね', 0);
  musicPick(D);
  if (AU.ac) { musicUpdate(); const nearR = Math.abs(P.x - riverX(P.y)); const genNear = G.gen.run ? (P.L === -1 ? .05 : P.L === 0 && inB === T_ID ? .015 : 0) : 0; ambUpdate(dt, D, P.z, !!inB, nearR, genNear) }
  hintUpdate(dt);
  G.saveT = (G.saveT || 0) + dt; if (G.saveT > 30) { G.saveT = 0; saveGame() }
}
// ───────── 迷ったときの、ともだちのひとこと（指さして、その先がきらっと光る） ─────────
const STEPS = (() => { const f = id => OBJ.find(o => o.items && o.items.includes(id)), t = ty => OBJ.find(o => o.type === ty);
  return { staff: [...DOORS.values()].find(d => d.lock === 'key_staff'), gate: [...DOORS.values()].find(d => d.kind === 'gate'), key: f('key_staff'), crow: f('crowbar'), jerry: f('jerry_full'), gen: t('generator'), brk: t('breaker'), lad: t('ladder'), tel: OBJ.find(o => o.type === 'telescope' && o.L === 8), elev: [...DOORS.values()].find(d => d.kind === 'E' && d.L === 0) } })();
function nextStep() {
  const S = STEPS, at = (o, t, k) => ({ k, t, x: o.x + (o.w || 1) / 2, y: o.y + (o.h || 1) / 2, L: o.L });
  if (!G.flags.towerIn) return { k: 0, t: 'あの塔、てっぺんまで行ってみようよ', x: BX + 8.5, y: BY + 13.5, L: 0 };
  if (S.staff && S.staff.lock && !has('key_staff')) return at(S.key, 'チケット売り場、なにか置いてないかな', 1);
  if (!has('crowbar') && !S.crow.searched) return P.L === -1 ? at(S.crow, 'あの工具ワゴン、何か使えそう', 2) : { k: 2, t: 'スタッフ室の奥、下に降りる階段があったよ', x: BX + 14.5, y: BY + 2.5, L: 0 };
  if (G.gen.fuel <= 0 && !has('jerry_full') && !S.jerry.searched) return at(S.jerry, P.L === -1 ? '発電機、燃料がいるみたい。ガソリンスタンドなら……' : 'ガソリンスタンド、燃料ないかな', 3);
  if (G.gen.fuel <= 0 && has('jerry_full')) return at(S.gen, '燃料、地下の発電機に入れに行こう', 4);
  if (!G.gen.run && G.gen.fuel > 0) return at(S.gen, '発電機のひも、引いてみよう', 5);
  if (!G.breaker) return at(S.brk, 'ブレーカー、上げてみよう。壁の灰色の箱', 6);
  if (!G.flags.deck) return { ...at(S.elev, 'エレベーター、動くかも！', 7), x: S.elev.x + .5, y: S.elev.y + .5 };
  if (S.gate && S.gate.lock) return { ...at(S.gate, P.L >= 8 ? '「関係者以外」の柵……バールなら開くかも' : 'まだ上がある。展望台の上', 8), x: S.gate.x + .5, y: S.gate.y + .5 };
  if (!G.flags.top) return at(S.lad, 'はしご……のぼってみる？', 9);
  if (!G.flags.farlight) return at(S.tel, '夜になったら、展望台の望遠鏡をのぞいてみない？', 10);
  return { k: 11 };
}
function hintUpdate(dt) {
  if (LEV[P.L] && LEV[P.L].bid[key(Math.floor(P.x), Math.floor(P.y))] === T_ID) G.flags.towerIn = true; if (P.L === 10) G.flags.top = true;
  const st = nextStep(); if (G.hintK !== st.k) { G.hintK = st.k; G.hintT = 0; G.hint = null } if (!st.t) return;
  if (!G.cine && !G.sleep && !G.note && !G.mapOpen && !P.act) G.hintT = (G.hintT || 0) + dt;
  const wait = st.k === 0 ? 35 : 80; if (G.hintT < wait) return;
  G.hintT = wait - 100; say(st.t); G.hint = { ...st, until: G.gameT + 16 };
  if (st.L === P.L && !F.moving && Math.hypot(st.x - F.x, st.y - F.y) > 1.5) { F.point = 2.6; F.fx = st.x - F.x; F.fy = st.y - F.y }
}
function placeLines(pl, D) {
  const L = { '地下　機械室': ['b1', G.power ? '明るいね' : '暗いね……ライト、離さないで'], '点検階': ['l9', 'ここ、入っていいのかな'], 'コンビニ': ['kon', '電気がないと、冷蔵庫もぬるいね'], '神社の森': ['shrine', '静かだね……'], '拝殿': ['haiden', 'おじゃまします……'], '学校の廊下': ['school', '学校、なつかしいな'], '音楽室': ['music', 'ピアノ、弾ける？'], '学校の屋上': ['schoolroof', '屋上って、なんかいいよね'], '駅の改札': ['station', '駅、だれもいないね'], '止まったままの電車': ['train', 'どこまで行くはずだったんだろう'], '公園': ['park', 'ブランコ、まだ揺れてる'], '川べり': ['river', '水の音、落ちつくね'], 'ガソリンスタンドの店': ['gas', '燃料、どこかにないかな'] };
  const v = L[pl]; if (v) once(v[0], v[1], .6); if (pl.startsWith('非常階段') && P.L === 4) once('mid', 'まだ半分……？', 0); if (pl.startsWith('非常階段') && P.L === 7) once('almost', 'もうちょっと！', 0);
}
function musicPick(D) {
  if (G.musicHold > G.gameT) { AU.want = 'none'; return }
  if (G.title) { AU.want = 'theme'; return } if (G.chapter) { AU.want = 'theme'; return }
  if (G.cine) { AU.want = G.cine.type === 'power' ? 'none' : 'sunset'; return }
  const chased = ZB.some(z => z.chase && Math.hypot(z.x - P.x, z.y - P.y) < 7);
  if (chased) { AU.want = 'danger'; return }
  if ((P.L >= 8 || G.sit) && D.h > 16.8 && D.h < 19.2) { AU.want = 'sunset'; return }
  if (D.night > .6) { AU.want = 'night'; return }
  if (inB) { AU.want = 'inside'; return } AU.want = 'town';
}
function camFollow(dt, D) {
  camX = lerp(camX, P.x, 1 - Math.exp(-dt * 6)); camY = lerp(camY, P.y, 1 - Math.exp(-dt * 6)); camZ = lerp(camZ, P.z, 1 - Math.exp(-dt * 5));
  let tk = clamp(1.3 - camZ * .034, .46, 1.3); if (P.L === -1) tk = 1.35; if (G.sit) tk *= .78; if (G.scope > 0) tk = P.L >= 10 ? .28 : .34; if (G.sleep) tk = 1.4;
  camK = lerp(camK, tk, 1 - Math.exp(-dt * (G.scope > 0 ? 1.2 : G.sit ? .5 : 2.2)))
}
function updateFriend(dt) {
  if (G.ride || P.climb) return;
  if (G.sit && G.seat && Math.hypot(F.x - P.x, F.y - P.y) < 3) { const sx = P.x + (G.seat.w > 1 ? .9 : -.9), sy = P.y; F.x = lerp(F.x, sx, dt * 3); F.y = lerp(F.y, sy, dt * 3); F.moving = false; return }
  let need = 1.35, i = TRAIL.length - 1, px = P.x, py = P.y, tgt = null; while (i >= 0) { const t = TRAIL[i]; const d = Math.hypot(t.x - px, t.y - py); if (d >= need || t.L !== P.L && d > 0) { tgt = t; break } need -= d; px = t.x; py = t.y; i-- }
  if (!tgt) { if (F.L !== P.L || Math.hypot(F.x - P.x, F.y - P.y) > 4) { F.L = P.L; F.z = P.z; F.x = P.x - .9; F.y = P.y - .3 } F.moving = false; return }
  const dx = tgt.x - F.x, dy = tgt.y - F.y, d = Math.hypot(dx, dy); if (tgt.L !== F.L) F.L = tgt.L; if (d > 3.5) { F.x = tgt.x; F.y = tgt.y; F.z = tgt.z; F.L = tgt.L }
  else if (d > .05) { const sp = Math.min(d, dt * 6); F.x += dx / d * sp; F.y += dy / d * sp; F.z = lerp(F.z, tgt.z, .3); F.fx = dx / d; F.fy = dy / d; F.moving = true; F.walkT += sp * 3 } else F.moving = false;
  while (TRAIL.length > 2 && i > 1) { TRAIL.shift(); i-- }
  // 抜け殻が近いと知らせる
  const zn = ZB.find(z => z.L === P.L && z.down <= 0 && Math.hypot(z.x - P.x, z.y - P.y) < 4.5); if (zn) { F.fx = zn.x - F.x; F.fy = zn.y - F.y; if (!F.warnT || F.warnT < G.gameT) { F.warnT = G.gameT + 14; say(['うしろ！', 'Fで押しのけて！', '来てる……！'][Math.floor(Math.random() * 3)]) } }
}
function updateZombies(dt, D) {
  const night = D.night > .5;
  for (const z of ZB) {
    if (z.down > 0) { z.down -= dt; continue } const dx = P.x - z.x, dy = P.y - z.y, d = Math.hypot(dx, dy);
    const pIn = LEV[P.L].bid[key(Math.floor(P.x), Math.floor(P.y))], zIn = LEV[0].bid[key(Math.floor(z.x), Math.floor(z.y))];
    const sees = P.L === 0 && d < (night ? 10 : 8) && (pIn === zIn); let heard = null; for (const n of NOISE) if (Math.hypot(n.x - z.x, n.y - z.y) < n.r) heard = n;
    let wx = 0, wy = 0;
    if (sees || P.L === 0 && d < 2.5) { wx = dx / d; wy = dy / d; z.chase = true; z.tx = P.x; z.ty = P.y }
    else if (heard) { z.tx = heard.x; z.ty = heard.y; z.chase = false }
    if (!sees && z.tx != null) { const ex = z.tx - z.x, ey = z.ty - z.y, ed = Math.hypot(ex, ey); if (ed > .6) { wx = ex / ed; wy = ey / ed } else z.tx = null; z.chase = z.chase && ed > .6 }
    if (!wx && !wy) { z.chase = false; z.wander += dt * .3; wx = Math.cos(z.wander) * .4; wy = Math.sin(z.wander * 1.3) * .4 }
    const sp = (z.chase ? (night ? 1.6 : 1.3) : .45) * dt; const m = moveActor(z, wx * sp, wy * sp); if (!m && (z.chase || z.tx != null)) { if (!moveActor(z, -wy * sp, wx * sp)) moveActor(z, wy * sp, -wx * sp) }
    if (Math.hypot(wx, wy) > .05) { z.fx = wx; z.fy = wy } z.step += dt * (z.chase ? 1.4 : .7);
    if (z.chase && d < .62 && P.L === 0 && !G.sleep) { P.hp = clamp(P.hp - dt * 9, 0, 100); if (P.knock <= 0) { P.knock = .6; sfx('hurt'); moveActor(P, dx / d * .25, dy / d * .25); G.hurtT = .35 } }
  }
  if (G.hurtT > 0) G.hurtT -= dt;
  if (P.hp <= 0 && !G.down) { G.down = true; toast('たおれてしまった……でも、ともだちが起こしてくれた', '#ffb0a0'); P.hp = 45; P.x = 47.5; P.y = 71.6; P.L = 0; P.z = 0; P.stair = null; TRAIL.length = 0; later(.5, () => G.down = false) }
}
// ───────── 保存 ─────────
const SAVEKEY = 'hatenakimichi_v2';
function hasSave() { try { return !!localStorage.getItem(SAVEKEY) } catch (e) { return false } }
function saveGame() {
  if (TEST && !G.allowSave || G.title) return;
  try { const ex = []; let cur = G.explored[0], n = 0; for (let i = 0; i < N; i++) { if (G.explored[i] === cur) n++; else { ex.push(n); cur = G.explored[i]; n = 1 } } ex.push(n);
    const s = { v: 2, P: { x: P.x, y: P.y, L: P.L, hp: P.hp, hunger: P.hunger, thirst: P.thirst, stam: P.stam }, G: { t: G.t, gen: G.gen, breaker: G.breaker, inv: G.inv, flags: G.flags, found: G.found }, said: F.said, doors: [...DOORS.values()].map(d => [d.id, d.open, d.lock, d.stuck]), objs: OBJ.filter(o => o.searched || o.readDone || o.fire).map(o => [o.id, !!o.searched, !!o.readDone, !!o.fire]), ex0: G.explored[0], ex };
    localStorage.setItem(SAVEKEY, JSON.stringify(s)) } catch (e) { }
}
function loadGame() {
  try { const s = JSON.parse(localStorage.getItem(SAVEKEY)); if (!s) return false; Object.assign(P, s.P); P.z = P.L * LH; P.stair = null; Object.assign(G, { t: s.G.t, gen: s.G.gen, breaker: s.G.breaker, inv: s.G.inv, flags: s.G.flags, found: s.G.found }); F.said = s.said || {};
    const dm = new Map(s.doors.map(d => [d[0], d])); for (const d of DOORS.values()) { const v = dm.get(d.id); if (v) { d.open = v[1]; d.lock = v[2]; d.stuck = v[3] } }
    const om = new Map(s.objs.map(o => [o[0], o])); for (const o of OBJ) { const v = om.get(o.id); if (v) { o.searched = v[1]; o.readDone = v[2]; o.fire = v[3] } }
    let i = 0, cur = s.ex0; for (const n of s.ex) { G.explored.fill(cur, i, i + n); i += n; cur = cur ? 0 : 1 }
    G.power = G.gen.run && G.breaker && G.gen.fuel > 0; F.x = P.x - .9; F.y = P.y - .3; F.L = P.L; F.z = P.z; TRAIL.length = 0; return true } catch (e) { return false }
}
// ───────── タイトル ─────────
let titleT = 0;
function titleCam(dt) { titleT += dt; const a = titleT * .045; camX = DCX - 6 + Math.cos(a) * 26; camY = DCY + 10 + Math.sin(a) * 18; camZ = 7 + Math.sin(titleT * .2) * 2; camK = .58 }
function titleButtons() { const b = [{ id: 'new', t: 'はじめから', x: CW / 2 - 130, y: CH / 2 + 70, w: 260, h: 50 }]; if (hasSave()) b.push({ id: 'cont', t: 'つづきから', x: CW / 2 - 130, y: CH / 2 + 132, w: 260, h: 50 }); return b }
function titleChoose(id) {
  if (id === 'cont' && hasSave() && loadGame()) { G.title = false; G.started = true; camX = P.x; camY = P.y; camZ = P.z; toast('つづきから'); return }
  G.title = false; G.started = true; camX = P.x; camY = P.y; camZ = 0; camK = 1.1; startCine('intro');
}
function takePhoto() {
  sfx('switch'); G.flash = .35; if (TEST) return;
  setTimeout(() => { try { cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); const d = new Date(); a.download = `hatenaki_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000) }) } catch (e) { } }, 30);
}

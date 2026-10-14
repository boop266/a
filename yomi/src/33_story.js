// 黄泉還：出来事・仕掛け・場面（オープニングからエンディングまで）
// ── 場面の進め方：yield 秒数／yield 'msg'（伝言を閉じるまで）／yield ()=>条件 ──
const CUT = { gen: null, wait: 0, cond: null, movers: [], onEnd: null, skip: null, t: 0 };
// skip：飛ばしたときに、場面の終わりの状態へそろえる関数（オープニングだけ）
function runCut(fn, onEnd, skip) { G.mode = 'cut'; CUT.gen = fn(); CUT.wait = 0; CUT.cond = null; CUT.movers = []; CUT.onEnd = onEnd || null; CUT.skip = skip || null; CUT.skippable = false; CUT.t = 0; PL.aimT = 0; setWeapon(PL.h, null); PL.st.mode = 'idle'; cutAdvance(); }
function skipCut() { const f = CUT.skip; CUT.gen = null; CUT.skip = null; G.msg = null; G.msgQ = []; G.card = null; AU.sfx('cancel'); if (f) f(); endCut(); }
// 飛ばす印（右上の ▶▶）：押せる場面のときだけ
function drawSkip() { if (!CUT.skip || CUT.t < 1.2 || G.ui) return; const u = U(), w = u * 15, h = u * 6.5, x = VW.x + VW.w - w - u * 3, y = VW.y + u * 3; UX.globalAlpha = 0.75; UX.fillStyle = 'rgba(0,0,0,0.5)'; rr(x, y, w, h, u); UX.fill(); txt('スキップ ▶▶', x + w / 2, y + h * 0.68, u * 3, '#d8d0c0', { a: 'center' }); UX.globalAlpha = 1; hit(x, y, w, h, skipCut); }
function cutStep(dt) {
  CUT.t += dt;
  if (CUT.skip && CUT.t > 1.2 && (IN.e.esc || IN.e.menu || (!G.msg && !G.card && uiTap()))) { skipCut(); return; }
  updRoom(dt); updFx(dt);
  for (const m of CUT.movers) { const a = m.a, dx = m.x - a.x, dz = m.z - a.z, d = hyp(dx, dz); if (d < 0.08) { m.done = true; continue; } const s = Math.min(d, m.spd * dt); a.x += dx / d * s; a.z += dz / d * s; a.ang = angTo(a.ang, Math.atan2(dx, dz), 8 * dt); if (a.y != null && G.room) { const y = floorAt(G.room, a.x, a.z, a.y); if (y != null) a.y = y; } }
  CUT.movers = CUT.movers.filter(m => { if (m.done && m.onDone) m.onDone(); return !m.done; });
  // 主人公と、人物と、敵の姿勢
  PL.st.t += dt; if (PL.cutMode) PL.st.mode = PL.cutMode; else PL.st.mode = CUT.movers.some(m => m.a === PL) ? (CUT.movers.find(m => m.a === PL).spd > 2.2 ? 'run' : 'walk') : 'idle';
  poseRyo(PL.h, PL.st, dt);
  for (const n of G.npcs || []) updNpc(n, dt);
  for (const e of G.en) { if (e.script) { e.t += dt; e.at += dt; pose(e, dt); e.h.root.position.set(e.x, e.y, e.z); e.h.root.rotation.y = e.ang; if (e.sh) e.sh.position.set(e.x, e.y + 0.012, e.z); } else { e.t += dt; pose(e, dt); } }
  if (CUT.wait > 0) { CUT.wait -= dt; if (IN.e.cancel && CUT.skippable) CUT.wait = 0; if (CUT.wait > 0) return; }
  if (CUT.cond) { if (!CUT.cond()) return; CUT.cond = null; }
  cutAdvance();
}
function cutAdvance() {
  while (CUT.gen) {
    const r = CUT.gen.next(); if (r.done) { endCut(); return; }
    const v = r.value; if (typeof v === 'number') { CUT.wait = v; return; } if (typeof v === 'function') { CUT.cond = v; return; } if (v === 'msg') { CUT.cond = () => !G.msg; return; }
  }
}
function endCut() { const f = CUT.onEnd; CUT.gen = null; CUT.movers = []; PL.cutMode = null; if (G.mode === 'cut') { G.mode = 'play'; G.camOv = null; } if (f) f(); }
function moveTo(a, x, z, spd = 1.5) { const m = { a, x, z, spd }; CUT.movers.push(m); return m; }
function camEv(id) { const c = G.room.cams.find(c => c.id === id); if (c) G.camOv = { cam: c.cam }; }
function camAt(p, t, fov = 50) { setCamOv(p, t, fov); }
function camNormal() { G.camOv = null; }
// ── 人物（早瀬） ──
function addNpc(key, x, z, ang, anim = 'stand') { const h = makeHuman(key), n = { h, x, z, y: floorAt(G.room, x, z, 0) ?? 0, ang, anim, t: 0, st: { t: 0, mode: 'idle', hp: 100 } }; G.room.scene.add(h.root); const sh = blobShadow(0.42); G.room.scene.add(sh); n.sh = sh; (G.npcs = G.npcs || []).push(n); updNpc(n, 0.1); return n; }
function updNpc(n, dt) {
  n.t += dt; n.st.t += dt;
  if (n.anim === 'sit') poseZombie(n.h, { anim: 'sit', t: n.t, seed: 0, hitT: 0 }, dt);
  else { const mv = CUT.movers.find(m => m.a === n); n.st.mode = n.aim ? 'aim' : mv ? (mv.spd > 2.2 ? 'run' : 'walk') : 'idle'; n.st.wid = 'hg'; n.st.recoil = Math.max(0, (n.st.recoil || 0) - dt * 6); poseRyo(n.h, n.st, dt); }
  n.h.root.position.set(n.x, n.y, n.z); n.h.root.rotation.y = n.ang; n.sh.position.set(n.x, n.y + 0.012, n.z);
}
function clearNpcs() { for (const n of G.npcs || []) { if (n.h.root.parent) n.h.root.parent.remove(n.h.root); if (n.sh.parent) n.sh.parent.remove(n.sh); } G.npcs = []; }
function npcShoot(n, tx, tz) { n.ang = Math.atan2(tx - n.x, tz - n.z); n.aim = true; setWeapon(n.h, 'hg'); n.st.recoil = 1; muzzle(n.x + Math.sin(n.ang) * 0.6, n.y + 1.4, n.z + Math.cos(n.ang) * 0.6, 1); AU.sfx('hg', { x: n.x, z: n.z }); }
// 大きな文字の札（オープニングの語り）
function textCard(pages) { G.card = { pages, i: 0, t: 0 }; return () => !G.card; }
function cardUpdate(dt) { const c = G.card; c.t += dt; if ((IN.e.ok || IN.e.act || IN.e.cancel || IN.ptr.length) && c.t > 0.6 || c.t > 9) { c.i++; c.t = 0; if (c.i >= c.pages.length) G.card = null; } }
function drawCard() { const c = G.card; if (!c) return; const u = U(); UX.fillStyle = '#000'; UX.fillRect(VW.x, VW.y, VW.w, VW.h); const a = Math.min(1, c.t * 1.5); UX.globalAlpha = a; const lines = wrapText(c.pages[c.i], VW.w * 0.78, u * 3.8, FONT_MIN); lines.forEach((l, i) => txt(l, VW.x + VW.w / 2, VW.y + VW.h / 2 - (lines.length - 1) * u * 3.2 + i * u * 6.4, u * 3.8, '#d8d0bc', { a: 'center', f: FONT_MIN })); UX.globalAlpha = 1; }
// ── オープニング ──
function startOpening() {
  G.mode = 'cut'; G.npcs = []; G.fade = 1;
  enterRoom('yard', { x: 0.6, z: 12.5, ang: PI }); G.mode = 'cut'; AU.music('');
  runCut(function* () {
    CUT.skippable = true;
    yield textCard(['一九九七年　九月二十二日　深夜\n長野県　鷲尾山', '麓の村で、家畜と人が食い荒らされる事件が続いていた。\n調べに入った県警の先発隊四人は、この夜、山の中で消息を絶った。', '第七特殊対応班の如月 遼と早瀬は、先発隊を探しに山へ入った。\nヘリを降りてすぐ、隊長の黒木が、犬のような何かに喉を裂かれた。', 'ヘリは犬に追われて空へ逃げた。\n二人は、木々の向こうに見えた明かりへと走った。']);
    const hy = addNpc('haya', -0.7, 13.0, PI);
    camAt([3.6, 1.1, 1.5], [0.2, 1.4, 12], 52); G.fadeTo = 0; AU.sfx('bark', { x: 0, z: 18, vol: 0.8 });
    moveTo(PL, 0.4, -1.4, 3.6); moveTo(hy, -0.7, -1.2, 3.5); yield 1.6;
    const d1 = makeDog(); d1.root.position.set(0.5, 0, 17); G.room.scene.add(d1.root); const dog = { x: 0.5, z: 17, ang: PI, y: 0, h: d1 }; const dm = moveTo(dog, 0.4, 4.0, 5.2);
    let dt0 = 0; G.cutDog = { d: d1, o: dog };
    AU.sfx('bark', { x: 0.5, z: 15 }); yield 1.0;
    camAt([-3.4, 2.2, 3.6], [0.3, 1.5, -4.5], 54); yield () => hyp(hy.x + 0.7, hy.z + 1.2) < 0.5;
    hy.ang = 0; yield 0.25; npcShoot(hy, dog.x, dog.z); AU.sfx('yelp', { x: dog.x, z: dog.z }); dm.done = true; poseDog(d1, { anim: 'dead', t: 0, seed: 0 }, 10); yield 0.5; hy.aim = false; setWeapon(hy.h, null);
    AU.sfx('door', {}); yield 0.8; G.fadeTo = 1; yield 1.0;
    // ホールの中へ
    clearNpcs(); G.cutDog = null; enterRoom('hall', { x: 0.5, z: 5.6, ang: PI }); G.mode = 'cut'; const hy2 = addNpc('haya', -0.6, 5.9, PI);
    AU.sfx('doorshut', {}); camNormal(); G.fadeTo = 0; yield 1.4;
    hy2.ang = 0; yield 0.6; say('早瀬「……隊長は」'); yield 'msg'; yield 0.4;
    say('遼「……夜明けまで、ここで持ちこたえるしかない」'); yield 'msg'; yield 0.8;
    AU.sfx('hg', { x: -14, z: -1, vol: 0.5, rev: 1 }); yield 1.2; hy2.ang = -PI / 2; yield 0.6;
    say('早瀬「今の……銃声だ。西の奥」'); yield 'msg';
    say('早瀬「三浦たちかもしれない。見てくる。お前はここを動くな」'); yield 'msg';
    moveTo(hy2, -6.9, -1.2, 2.4); yield () => !CUT.movers.length; AU.sfx('door', { x: -8, z: -1.2, vol: 0.6 }); hy2.h.root.visible = false; hy2.sh.visible = false; yield 1.0; AU.sfx('doorshut', { x: -8, z: -1.2, vol: 0.5 });
    yield 1.6; clearNpcs(); setFlag('opening');
  }, () => { G.fadeTo = 0; clearNpcs(); G.time = 0; setFlag('opening'); },
  () => { clearNpcs(); G.cutDog = null; enterRoom('hall', { x: 0.5, z: 5.6, ang: PI }); G.camOv = null; G.fade = 1; });
}
// ── 部屋に入ったとき ──
function storyEnter(id) {
  G.npcs = [];
  if (id === 'child' && !flag('horse')) { setFlag('horse'); const h = G.room.dyn.horse; if (h) h.rock = 5; AU.sfx('creak', { x: -1.5, z: -1.6, delay: 0.4 }); }
  if (id === 'lab_cell' && !flag('boss1')) { const n = addNpc('haya', 0, -2.35, 0, 'sit'); n.y = 0; }
  if (id === 'heliport' && !flag('boss2')) heliEnter();
  if (id === 'lab_core' && flag('boss1')) { const c = G.room.dyn.core; c.liq.visible = c.glass.visible = c.body.visible = false; }
  if (id === 'hall' && flag('clock') && !flag('hallZ')) { setFlag('hallZ'); AU.sfx('groan', { x: 3, z: 1, v: 1.2, delay: 0.6 }); }
}
// ── 毎こま：場所と条件で起こる出来事 ──
function storyTick(dt) {
  const R = G.room, id = R.id;
  if (id === 'wcorr' && !flag('turnSeen') && PL.z < 0.9 && PL.x < 1.3) { const z = G.en.find(e => e.key === 'wc_z1' && !e.dead); setFlag('turnSeen'); if (z && z.state === 'eat') evZombieTurn(z); }
  if (id === 'w2corr' && G.taken.snakekey && !flag('dogs') && PL.z > -5 && PL.z < 6) evDogs();
  if (id === 'green' && !flag('bruteSeen') && PL.z < 2.2) evBrute();
  if (id === 'lab_cult' && !flag('hunters') && PL.x < 2.6) evTank();
  if (G.helper) helperTick(dt);
  if (id === 'heliport' && G.heliT != null && !flag('boss2')) heliTick(dt);
}
function evZombieTurn(z) {
  runCut(function* () {
    z.script = true; z.anim = 'eat'; camEv('turn'); yield 1.4; z.anim = 'turn'; z.ty = clamp(angDiff(z.ang, Math.atan2(PL.x - z.x, PL.z - z.z)), -2.3, 2.3); AU.sfx('shock'); AU.sfx('groan', { x: z.x, z: z.z, v: 1.6 }); yield 2.2;
    z.script = false; z.alert = true; z.ang += z.ty * 0.5; setState(z, 'rise', 'rise'); camNormal();
  });
}
function evDogs() {
  setFlag('dogs');
  runCut(function* () {
    camEv('dogs'); yield 0.6; AU.sfx('growl', { x: -2, z: 1 }); yield 0.9; AU.sfx('glass', { x: -1.3, z: 1.0 }); AU.sfx('shock');
    const R = G.room;
    for (const [k, wz] of [['w2_d1', 1.0], ['w2_d2', -2.6]]) { const d = ROOMS.w2corr.enemies.find(e => e.key === k); const e = spawnEnemy(R, Object.assign({}, d, { x: -2.2, z: wz })); e.state = 'window'; e.at = 0; e.wx0 = -2.2; e.wx1 = -0.3; e.wz0 = wz; e.wz1 = wz + 0.3; e.ang = PI / 2; e.alert = true; G.en.push(e); particles(-1.3, 1.8, wz, 20, '#c8d8e8', 3, 0.7); }
    yield 0.5; AU.sfx('glass', { x: -1.3, z: -2.6 }); yield 1.0; AU.sfx('bark', { x: -0.5, z: 0 }); camNormal();
  });
}
function evBrute() {
  setFlag('bruteSeen'); const b = G.en.find(e => e.key === 'brute'); if (!b) return;
  runCut(function* () {
    b.script = true; b.anim = 'idle'; camEv('brute'); yield 0.8; AU.sfx('grunt', { x: b.x, z: b.z }); yield 0.5; b.anim = 'roar'; AU.sfx('roar', { x: b.x, z: b.z }); AU.sfx('shock'); yield 1.8;
    b.script = false; b.alert = true; b.sense = 12; setState(b, 'walk', 'walk'); camNormal(); AU.music('boss');
  });
}
function evTank() {
  setFlag('hunters'); const h = G.en.find(e => e.key === 'cult_h1'); const T2 = G.room.dyn.t2;
  runCut(function* () {
    camEv('tank'); yield 0.8; AU.sfx('creak', { x: -1.5, z: -2.95 }); yield 0.7; AU.sfx('glass', { x: -1.5, z: -2.95 }); AU.sfx('shock');
    if (T2) { T2.glass.visible = false; T2.liq.visible = false; T2.body.visible = false; } particles(-1.5, 1.4, -2.5, 30, '#8ae8c8', 4, 0.9);
    if (h) { h.def.hidden = false; h.revealed = true; h.h.root.visible = true; h.targetable = true; h.solid = true; h.script = true; h.anim = 'crouch'; h.x = -1.5; h.z = -2.1; }
    yield 0.6; if (h) { h.anim = 'roar'; AU.sfx('screech', { x: h.x, z: h.z }); } yield 1.2;
    if (h) { h.script = false; h.alert = true; setState(h, 'run', 'hunt'); } camNormal();
  });
}
// ── 敵を倒したとき ──
function storyKill(e) {
  if (e.key === 'brute') { const d = { room: 'green', id: 'key_base', x: e.x + 0.4, z: e.z + 0.3 }; (G.drops = G.drops || {}).basekey = d; spawnPickup(G.room, Object.assign({ key: 'basekey' }, d)); AU.music(''); say('庭師の腰の鍵束から、錆びた鍵が落ちた。'); }
  if (e.key === 'boss1') evBoss1Down(e);
  if (e.key === 'boss2') evBoss2Down(e);
}
function storyUnlock(rid, did, kid) {
  const opened = k => Object.keys(G.open).filter(p => p.includes(k));
  if (kid === 'key_hawk' && G.open[doorPair('ecorr', ROOMS.ecorr.doors.find(d => d.id === 'E'))] && G.open[doorPair('w2corr', ROOMS.w2corr.doors.find(d => d.id === 'N'))]) setFlag('hawkdone');
  if (kid === 'key_snake') setFlag('snakedone'); if (kid === 'key_wolf') setFlag('wolfdone'); if (kid === 'key_base') setFlag('basedone');
}
function storyPick(key, id) {
  if (key === 'shotgun') { setFlag('shotgun'); const c = G.room.dyn.cabinet; if (c) c.gun.visible = false; AU.sfx('crash', { x: -4, z: 1, delay: 1.2, vol: 0.6 }); say('東の廊下のほうで、何かが倒れる音がした。'); }
  if (key === 'snakekey') setTimeout(() => { }, 0);
}
// ── 調べる仕掛け ──
function doAct(a, useId) {
  const R = G.room, id = a.id;
  const give = (iid, n, key, msg) => { if (!canFit(iid, n)) { say('持ち物がいっぱいで、持てない。'); return false; } invAdd(iid, n); G.taken[key] = true; AU.sfx('pick'); say(msg || `${ITEMS[iid].name}を手に入れた。`); return true; };
  switch (id) {
    case 'type': if (invHas('ribbon')) ask('タイプライターがある。\nインクリボンを使って、記録を残しますか？', ['はい', 'いいえ'], i => { if (!i) openSave(); }); else say('タイプライターがある。\nインクリボンがあれば、記録を残せそうだ。'); return;
    case 'box': openBox(); return;
    case 'clock':
      if (flag('clock')) { say(G.taken.hawkkey ? '大時計は、静かに時を刻んでいる。' : '大時計の足元の小さな扉が、開いている。'); return; }
      if (!invHas('gear')) { say('大時計の振り子が止まっている。\n文字盤の裏をのぞくと、歯車がひとつ足りない。'); return; }
      ask('真鍮の歯車をはめこみますか？', ['はい', 'いいえ'], i => { if (i) return; invTake('gear'); evClock(); }); return;
    case 'oven':
      if (G.taken.gear) { say('竈の中は、冷たい灰ばかりだ。'); return; }
      ask('竈（かまど）がある。火は落ちている。\n扉を開けてみますか？', ['開ける', 'やめる'], i => { if (i) return; AU.sfx('creak', { x: 1.2, z: -2.8 }); give('gear', 1, 'gear', '灰の中に、真鍮の歯車が埋もれていた。'); }); return;
    case 'toychest':
      if (G.taken.smallkey) { say('おもちゃ箱。木の兵隊が、一体だけ首を折られている。'); return; }
      give('key_small', 1, 'smallkey', 'おもちゃ箱の底に、小さな鍵が隠してあった。'); return;
    case 'musicbox': AU.sfx('musicbox', { x: -2.4, z: 2.4 }); { const h = R.dyn.horse; if (h) h.rock = 6; } say('オルゴールの蓋を開けると、やさしい旋律が流れはじめた。\n……木馬が、ひとりでに揺れている。'); return;
    case 'vanity':
      if (G.taken.snakekey) { say('鏡台の引き出しは、空になっている。'); return; }
      if (!invHas('key_small')) { say('鏡台の小さな引き出しに、鍵がかかっている。\n子どもの持つような、小さな鍵穴だ。'); return; }
      invTake('key_small'); give('key_snake', 1, 'snakekey', '小さな鍵で、引き出しが開いた。\n中に、蛇の巻きついた鍵が入っていた。'); G.msg && (G.msg.cb = () => evWardrobe()); return;
    case 'portrait': portraitPress(a.idx); return;
    case 'pushshelf':
      ask('本棚の前の床に、引きずった跡がある。\n押してみますか？', ['押す', 'やめる'], i => { if (i) return; evShelf(); }); return;
    case 'cabinet': {
      const c = R.dyn.cabinet;
      if (G.taken.shotgun) { say('空になった銃の棚。'); return; }
      if (!flag('cabOpen')) { if (!invHas('key_hunt')) { say('硝子戸の銃の棚。中に、散弾銃が一挺だけ掛けてある。\n鍵がかかっている。'); return; } setFlag('cabOpen'); invTake('key_hunt'); AU.sfx('unlock'); if (c) c.pivot.rotation.y = -1.6; say('狩猟用の鍵で、銃の棚が開いた。'); return; }
      ask('散弾銃がある。持っていきますか？', ['はい', 'いいえ'], i => { if (i) return; if (!canFit('sg', 1)) { say('持ち物がいっぱいで、持てない。'); return; } invAdd('sg', 1); G.taken.shotgun = true; G.mag.sg = 4; AU.sfx('pick'); say('ショットガンを手に入れた。\n弾が4発、込められている。', () => storyPick('shotgun', 'sg')); }); return; }
    case 'desk_drawer': if (G.taken.deskammo) { say('引き出しの中は、もう空っぽだ。'); return; } give('hg_ammo', 10, 'deskammo', '机の引き出しに、ハンドガンの弾が入っていた。'); return;
    case 'ecorr_cab': if (G.taken.ecab) { say('飾り棚。銀の燭台が並んでいるだけだ。'); return; } give('herb_r', 1, 'ecab', '飾り棚の奥に、乾いた赤い薬草がしまってあった。'); return;
    case 'valve':
      if (flag('valve')) { say('弁は、固く閉まっている。'); return; }
      if (!invHas('handle')) { say('蒸気を止める弁だ。\nハンドルが外されていて、回せない。'); return; }
      ask('バルブハンドルを取りつけて、回しますか？', ['回す', 'やめる'], i => { if (i) return; invTake('handle'); evValve(); }); return;
    case 'terminal': termAct(); return;
    case 'synth':
      if (G.taken.serum) { say('合成機。もう試薬は残っていない。'); return; }
      if (invHas('reagA') && invHas('reagB')) { ask('試薬Aと試薬Bを、合成機にかけますか？', ['かける', 'やめる'], i => { if (i) return; invTake('reagA'); invTake('reagB'); AU.sfx('valve', { x: PL.x, z: PL.z }); setTimeout(() => { }, 0); G.taken.serum = true; invAdd('serum', 1); say('機械が低く唸り、しばらくして止まった。\n血清ができた。'); }); return; }
      if (invHas('reagA') || invHas('reagB')) { say('試薬がもうひとつ要りそうだ。'); return; }
      say('薬品の合成機。二本の瓶を差しこむ口がある。'); return;
    case 'hayase': hayaAct(); return;
    case 'core_term': coreAct(); return;
  }
  say('……');
}
function evClock() {
  runCut(function* () {
    camEv('clock'); yield 0.6; AU.sfx('tick'); yield 0.4; const k = G.room.dyn.clock; if (k) k.run = true; AU.sfx('clock1', {}); yield 1.4; AU.sfx('chime', {}); yield 3.6;
    setFlag('clock'); spawnPickup(G.room, { id: 'key_hawk', x: 2.6, z: -3.35, key: 'hawkkey' });
    AU.sfx('unlock', { x: 2.6, z: -3.5 }); say('大時計が時を告げた。\n足元の小さな扉が、かちりと開いた。'); yield 'msg'; camNormal();
  });
}
function evWardrobe() {
  if (flag('wardrobe')) return; setFlag('wardrobe');
  const z = G.en.find(e => e.key === 'bed_z1'); const W = G.room.dyn.wardrobe;
  runCut(function* () {
    yield 0.6; AU.sfx('creak', { x: 3.6, z: 1.7 }); yield 0.9; camEv('ward'); AU.sfx('crash', { x: 3.6, z: 1.7 }); AU.sfx('shock');
    if (W) { W.doors[0].rotation.y = 1.7; W.doors[1].rotation.y = -1.7; }
    if (z) { z.def.hidden = false; z.revealed = true; z.h.root.visible = true; z.targetable = true; z.solid = true; z.x = 3.1; z.alert = true; setState(z, 'chase', 'walk'); AU.sfx('groan', { x: z.x, z: z.z, v: 1.6 }); }
    yield 1.4; camNormal();
  });
}
function evShelf() {
  const sh = G.room.dyn.shelf; PL.ang = PI / 2;
  runCut(function* () {
    PL.cutMode = 'push'; AU.sfx('slide', { x: 4.7, z: -1 }); const t0 = G.t; let z = -1.0;
    while (z > -2.6) { z = Math.max(-2.6, z - 0.016); sh.position.z = z; yield 0.016; }
    PL.cutMode = null; setFlag('shelf'); G.room.dyn.shelfBlock.r = [4.55, -3.6, 5, -1.6]; AU.sfx('solve');
    const d = ROOMS.library.items.find(i => i.key === 'huntkey'); spawnPickup(G.room, d);
    say('本棚の奥に、小さなくぼみがあった。'); yield 'msg';
  });
}
function evValve() {
  const v = G.room.dyn.valve; if (v) v.wheel.visible = true;
  runCut(function* () {
    PL.ang = PI / 2; PL.cutMode = 'push'; AU.sfx('valve', { x: 4.8, z: 1.4 }); for (let i = 0; i < 60; i++) { if (v) v.wheel.rotation.z -= 0.05; yield 0.016; }
    PL.cutMode = null; setFlag('valve'); AU.sfx('steam', { x: 5, z: -1.2, vol: 0.3 }); say('弁が閉まり、噴き出していた蒸気が、ゆっくりと止んだ。'); yield 'msg';
  });
}
// 肖像画：生まれた順に押す
const BIRTH = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'];
function portraitPress(i) {
  const p = GALLERY[i], R = G.room;
  if (flag('portraits')) { say(`「${p.name}」の肖像画。`); return; }
  ask(`「${p.name}」の肖像画。\n額の下に、小さな押しボタンがある。押しますか？`, ['押す', 'やめる'], c => {
    if (c) return; AU.sfx('switch', { x: 1.3, z: p.z });
    const seq = G.flags.pseq = G.flags.pseq || []; seq.push(p.k);
    const ok = seq.every((k, j) => k === BIRTH[j]);
    const lights = R.dyn.plights;
    if (!ok) {
      G.flags.pseq = []; lights.forEach(m => m.color.set('#6a5634')); AU.sfx('locked', { x: 1.3, z: p.z });
      for (const l of R.lights) { l.L.intensity = 0; } setTimeout(() => { for (const l of R.lights) l.L.intensity = l.base; }, 700);
      if (!flag('portraitFail')) { setFlag('portraitFail'); const d = ROOMS.gallery.enemies[0]; const e = spawnEnemy(R, Object.assign({}, d, { x: 0.1, z: -9.2 })); e.alert = true; G.en.push(e); AU.sfx('door', { x: 0, z: -10, vol: 0.6 }); say('ボタンが、元の位置に戻った。\n……奥の扉が、ひとりでに開く音がした。'); }
      else say('ボタンが、すべて元の位置に戻った。');
      return;
    }
    lights[i].color.set('#ffe0a0');
    if (seq.length === 6) {
      setFlag('portraits'); AU.sfx('solve'); const lid = R.dyn.lid; if (lid) lid.rotation.x = -1.2;
      const d = ROOMS.gallery.items.find(q => q.key === 'wolfkey'); spawnPickup(R, d);
      say('六つの灯りがそろった。\n回廊の突き当たりで、飾り箱の蓋が開く音がした。');
    }
  });
}
// ── 研究所：合言葉の端末 ──
function termAct() {
  if (flag('password')) { say('隔壁は開いている。'); return; }
  if (!invHas('idcard')) { say('端末の画面に、文字が出ている。\n「身分証を差しこんでください」'); return; }
  say('IDカードを差しこむと、画面が切り替わった。\n「合言葉を入力してください」', () => { G.ui = { k: 'pass', text: '', sel: 0 }; });
}
const PASS_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['←', '決定']);
function passUpdate() {
  const s = G.ui; if (uiTap()) return;
  for (const ch of IN.typed) { if (ch === '<') s.text = s.text.slice(0, -1); else if (s.text.length < 10) s.text += ch; AU.sfx('tick'); }
  const cols = 7, n = PASS_KEYS.length;
  if (IN.e.left) s.sel = (s.sel + n - 1) % n; if (IN.e.right) s.sel = (s.sel + 1) % n; if (IN.e.up) s.sel = (s.sel - cols + n) % n; if (IN.e.down) s.sel = (s.sel + cols) % n;
  if (KEYS.enter && IN.e.ok) { passSubmit(); return; }
  if (IN.e.ok || IN.e.act) passKey(PASS_KEYS[s.sel]);
  if (IN.e.cancel && !KEYS.backspace) { G.ui = null; AU.sfx('cancel'); }
}
function passKey(k) { const s = G.ui; if (k === '←') s.text = s.text.slice(0, -1); else if (k === '決定') { passSubmit(); return; } else if (s.text.length < 10) s.text += k; AU.sfx('tick'); }
function passSubmit() { const s = G.ui; G.ui = null; if (s.text === 'SAYO') { setFlag('password'); AU.sfx('solve'); say('「認証しました」\n重い隔壁が、ゆっくりと開いていく。'); AU.sfx('elev', { x: 0, z: -10 }); } else { AU.sfx('locked'); say('「合言葉が違います」'); } }
function drawPass() {
  const s = G.ui, u = U(); UX.fillStyle = 'rgba(0,10,4,0.94)'; UX.fillRect(VW.x, VW.y, VW.w, VW.h);
  txt('合言葉を入力してください', VW.x + VW.w / 2, VW.y + u * 12, u * 4, '#60ff90', { a: 'center', f: 'monospace' });
  UX.strokeStyle = '#40c070'; UX.strokeRect(VW.x + VW.w / 2 - u * 30, VW.y + u * 17, u * 60, u * 10); txt(s.text + ((G.t * 2 % 1) < 0.5 ? '_' : ''), VW.x + VW.w / 2, VW.y + u * 24.5, u * 6, '#a0ffc0', { a: 'center', f: 'monospace', w: 700 });
  const cols = 7, kw = u * 12, kh = u * 9;
  PASS_KEYS.forEach((k, i) => { const x = VW.x + VW.w / 2 - (cols * (kw + u)) / 2 + (i % cols) * (kw + u), y = VW.y + u * 34 + Math.floor(i / cols) * (kh + u), on = i === s.sel; UX.fillStyle = on ? 'rgba(60,200,110,0.6)' : 'rgba(40,120,70,0.25)'; UX.fillRect(x, y, kw, kh); txt(k, x + kw / 2, y + kh * 0.68, u * (k.length > 1 ? 3 : 4), '#c0ffd0', { a: 'center', f: 'monospace' }); hit(x, y, kw, kh, () => { s.sel = i; passKey(k); }); });
  txt('もどる', VW.x + VW.w / 2, VW.y + VW.h - u * 4, u * 3, '#60a070', { a: 'center' }); hit(VW.x + VW.w / 2 - u * 10, VW.y + VW.h - u * 9, u * 20, u * 7, () => { G.ui = null; });
}
// ── 早瀬 ──
function hayaAct() {
  if (flag('hayaSaved')) { say('早瀬は壁にもたれて、目を閉じている。\n呼吸は落ち着いている。'); return; }
  if (invHas('serum')) { ask('早瀬に、血清を打ちますか？', ['打つ', 'やめる'], i => { if (i) return; invTake('serum'); setFlag('hayaSaved'); runCut(function* () { camEv('haya'); yield 0.8; AU.sfx('flesh', { x: 0, z: -2.3, vol: 0.3 }); yield 1.2; say('早瀬「……っ。……効いてきた」'); yield 'msg'; say('早瀬「少し休めば、動ける。……先に行け、遼。必ず追いつく」'); yield 'msg'; camNormal(); }); }); return; }
  if (!flag('hayaMet')) { setFlag('hayaMet'); runCut(function* () { camEv('haya'); yield 1.0; say('早瀬「……遼か」'); yield 'msg'; say('早瀬「噛まれた。……熱が、ひどい」'); yield 'msg'; say('早瀬「俺のことはいい。……行け」'); yield 'msg'; camNormal(); }); return; }
  say('早瀬の呼吸が浅い。額に触れると、ひどく熱い。');
}
// ── 最深部：救難信号とヨミ ──
function coreAct() {
  if (flag('boss1')) { say('画面に「自己保存プログラム　作動中」の赤い文字。'); return; }
  ask('救難信号の送信装置がある。\n信号を送りますか？', ['送る', 'やめる'], i => {
    if (i) return;
    runCut(function* () {
      AU.sfx('beep'); yield 0.4; AU.sfx('beep'); yield 1.0; say('無線「……こちら春日。信号を受けた。\n夜明けに、屋上のヘリポートへ向かう。持ちこたえろ」'); yield 'msg';
      setFlag('alarm'); AU.setAmb(Object.assign({}, G.room.D.ambience, { alarm: 1 })); yield 0.8; camEv('boss'); AU.sfx('creak', {}); yield 1.0; AU.sfx('glass', {}); AU.sfx('shock');
      const c = G.room.dyn.core; c.glass.visible = false; c.liq.visible = false; c.body.visible = false; c.L.base = 3; particles(0, 2.0, -0.9, 40, '#8ad8ff', 5, 1.0);
      const b = G.en.find(e => e.key === 'boss1'); if (b) { b.def.hidden = false; b.revealed = true; b.h.root.visible = true; b.targetable = true; b.solid = true; b.script = true; b.anim = 'roar'; b.x = 0; b.z = 0.0; b.ang = 0; }
      AU.sfx('roar', { x: 0, z: 0 }); yield 2.0; camNormal(); if (b) { b.script = false; b.alert = true; setState(b, 'walk', 'walk'); } AU.music('boss');
    });
  });
}
function evBoss1Down(e) {
  setFlag('boss1');
  runCut(function* () {
    yield 1.6; AU.sfx('alarm', {}); say('警報「警告。研究所の自己保存プログラムが作動しました」\n「三分後に、全区画を焼却します。職員はただちに退避してください」'); yield 'msg';
    G.timer = { left: 180 }; AU.music('escape'); AU.setAmb(Object.assign({}, G.room.D.ambience, { alarm: 1 }));
    say('東の搬出用昇降機に、電源が入った。'); yield 'msg';
  });
}
function timerOut() { G.timer = null; RD.U.flash.value = 1; AU.sfx('boom', {}); AU.sfx('boom', { delay: 0.3 }); killPlayer('fire'); setTimeout(() => { RD.U.flash.value = 0; }, 400); }
// ── ヘリポート：ヨミ、ふたたび ──
function heliEnter() {
  if (G.timer && G.timer.left < 100) G.timer.left = 100;
  G.heliT = 0; G.heli = null;
  runCut(function* () {
    camAt([4, 2.2, 7.5], [-2, 3, -6], 55); AU.sfx('heli', { vol: 0.4 }); yield 1.0; say('無線「見えた。屋上だな！　いま降りる——」'); yield 'msg';
    AU.sfx('crash', {}); AU.sfx('shock'); G.shakeT = 0.8; yield 0.5;
    const b = G.en.find(e => e.key === 'boss2'); if (b) { b.def.hidden = false; b.revealed = true; b.h.root.visible = true; b.targetable = true; b.solid = true; b.script = true; b.anim = 'roar'; b.x = 0; b.z = -6; b.ang = 0; }
    camEv('sky'); AU.sfx('roar', { x: 0, z: -6 }); yield 2.0; say('無線「なんだ、あれは……！　近づけない！」'); yield 'msg'; camNormal();
    if (b) { b.script = false; b.alert = true; setState(b, 'walk', 'walk'); } AU.music('boss');
  });
}
function heliTick(dt) {
  G.heliT += dt; const b = G.en.find(e => e.key === 'boss2');
  if (!flag('glDrop') && b && (G.heliT > 22 || b.hp < b.max * 0.7)) {
    setFlag('glDrop'); AU.sfx('heli', { vol: 0.8 }); say('春日「遼！　受け取れ！」\n――ヘリから、何かが投げ落とされた。');
    const d = { room: 'heliport', id: 'gl', x: 2.2, z: 3.0 }; (G.drops = G.drops || {}).gl = d; spawnPickup(G.room, Object.assign({ key: 'gl' }, d)); G.mag.gl = 6;
    if (flag('hayaSaved') && !G.helper) { const n = addNpc('haya', -5.5, 6.5, PI * 0.8); G.helper = { n, t: 3 }; setTimeout(() => say('早瀬「遼、撃て！」'), 600); }
  }
}
function helperTick(dt) { const h = G.helper, b = G.en.find(e => e.key === 'boss2' && !e.dead); if (!b || G.room.id !== 'heliport') { if (h) h.n.aim = false; return; } h.t -= dt; h.n.ang = Math.atan2(b.x - h.n.x, b.z - h.n.z); updNpc(h.n, dt); if (h.t <= 0) { h.t = 3.2; npcShoot(h.n, b.x, b.z); damageEnemy(b, 30, { w: 'hg', knock: 0.3 }); } }
function evBoss2Down(e) {
  setFlag('boss2'); G.timer = null;
  runCut(function* () {
    yield 1.5; AU.music(''); AU.sfx('heli', { vol: 1 }); say('春日「よくやった！　乗れ！」'); yield 'msg'; G.fadeTo = 1; yield 1.2; startEnding();
  });
}
// ── エンディング ──
function startEnding() {
  G.mode = 'end'; G.endT = 0; clearNpcs(); G.timer = null; AU.music('ending');
  try { localStorage.setItem('yomi_inf', '1'); } catch (e) { } G.unlockInf = true;
  const R = G.room; G.endHeli = makeHeli(); G.endHeli.position.set(0, 0.1, 0); R.scene.add(G.endHeli); PL.h.root.visible = false; for (const e of G.en) e.h.root.visible = false; if (PL.shadow) PL.shadow.visible = false;
  G.endPages = flag('hayaSaved') ? ['ヘリは、明けていく空へ舞い上がった。\n隣で早瀬が、眠るように目を閉じている。', '眼下で、鷲尾山の中腹が、音もなく炎に包まれた。\n七十年、娘を待ち続けた男の館が、崩れていく。', '男爵は、ようやく娘のところへ行けたのだろうか。\nそれとも――。', '早瀬が、目を開けた。\n「……朝だな」\n「ああ。朝だ」'] : ['ヘリは、明けていく空へ舞い上がった。\n隣の席は、空いたままだ。', '眼下で、鷲尾山の中腹が、音もなく炎に包まれた。\n七十年、娘を待ち続けた男の館が、崩れていく。', '早瀬は、あの地下に残った。\n自分は、間に合わなかった。', '男爵は、ようやく娘のところへ行けたのだろうか。\n朝日がまぶしくて、目を閉じた。'];
  G.endI = -1; G.fade = 1; G.fadeTo = 0;
}
function endStep(dt) {
  G.endT += dt; const R = G.room; updRoom(dt);
  const h = G.endHeli, rot = h.userData.rotor; rot.rotation.y += dt * 30; h.userData.tr.rotation.x += dt * 40;
  const k = Math.max(0, G.endT - 1.5); h.position.y = 0.1 + k * k * 0.25; h.position.z = -k * k * 0.4; h.rotation.x = -Math.min(0.2, k * 0.05);
  const cam = new THREE.PerspectiveCamera(50, 4 / 3, 0.05, 200); cam.position.set(7 - G.endT * 0.2, 2.2 + G.endT * 0.3, 10); cam.lookAt(h.position.x, h.position.y + 1, h.position.z); cam.updateMatrixWorld(); G.camOv = { cam };
  if (G.endT > 6 && !G.endBoom) { G.endBoom = true; AU.sfx('boom', {}); RD.U.flash.value = 0.6; setTimeout(() => { RD.U.flash.value = 0; }, 300); }
  const pi = Math.floor((G.endT - 7) / 6); if (pi >= 0 && pi < G.endPages.length) G.endI = pi;
  if (G.endT > 7 + G.endPages.length * 6 + 2 || (G.endT > 8 && IN.e.cancel)) finishGame();
}
function drawEnd() {
  if (G.endI < 0 || G.endI >= G.endPages.length) return; const u = U(), t = (G.endT - 7) % 6, a = Math.min(1, t, 6 - t); UX.globalAlpha = Math.max(0, a); UX.fillStyle = 'rgba(0,0,0,0.45)'; UX.fillRect(VW.x, VW.y + VW.h * 0.62, VW.w, VW.h * 0.3);
  const lines = wrapText(G.endPages[G.endI], VW.w * 0.86, u * 3.6, FONT_MIN); lines.forEach((l, i) => txt(l, VW.x + VW.w / 2, VW.y + VW.h * 0.7 + i * u * 5.6, u * 3.6, '#f4ecd8', { a: 'center', f: FONT_MIN, sh: true })); UX.globalAlpha = 1;
}
function finishGame() {
  const t = G.time, haya = flag('hayaSaved');
  const rank = (t < 50 * 60 && G.saves <= 3 && haya) ? 'S' : (t < 80 * 60 && haya) ? 'A' : t < 120 * 60 ? 'B' : 'C';
  G.mode = 'title'; G.camOv = null; PL.h.root.visible = true;
  G.ui = { k: 'results', time: t, saves: G.saves, heals: G.heals, kills: G.kills, haya, rank, note: 'クリア特典：タイトルの「おまけ」で、ハンドガンの弾が無限になる', t: 0 };
  TITLE.phase = 'menu'; enterTitleScene();
}

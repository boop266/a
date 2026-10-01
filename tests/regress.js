// 見つけたバグを一つずつ狙って再現する回帰テスト。
// 使い方: node tests/regress.js [html=index.html]
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const FILE = 'file://' + path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));

const cases = {
  // 思い通りに動かす：タップで歩く（罠と溶岩を避ける）・狙って投げる・松明を覆う・錠を壊す
  // 役割表と、倒し方で変わる落とし物
  async '役割と倒し方'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = {}; const W8 = ms => new Promise(r => setTimeout(r, ms)); const add = id => { G.bag.items.push({ id, x: 0, y: 0, rot: 0 }); return G.bag.items.length - 1; };
      G.traps = []; G.faceX = 1; G.faceY = 0; slotUse(add('rope')); await W8(300); o.snare = G.traps.some(t => t.mine && t.k == 'seal'); G.busy = false;
      G.items = [{ x: 8, y: 8, id: 'gem', drop: 0 }]; for (let x = 4; x <= 9; x++) G.seen.add(x + ',8'); G.p.x = 5; G.p.y = 8; G.busy = false; document.getElementById('modal').innerHTML = ''; slotUse(add('whip')); await W8(300); o.whip = G.items[0].x == 6; G.busy = false;
      G.foes = []; G.items = []; const f = put('rat', 10, 10); f.frozen = 2; f.hp = 1; hit(f, 5); o.ice = G.items.some(i => i.id == 'tomeniku');
      G.items = []; const g = put('rat', 11, 11); g.assassinated = 1; g.hp = 0; onFoeDeath(g); o.stealth = G.items.length > 0;
      o.weapons = wspec('spear', put('bat', 12, 12)) == 2;
      return o;
    });
    for (const k of ['snare', 'whip', 'ice', 'stealth', 'weapons']) if (!r[k]) throw new Error(k + ': ' + JSON.stringify(r));
  },
  // 相性と場面の型：弱点・弾けない攻撃・眠る群れ
  async '相性と場面の型'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = {}; const b = put('beetle', 9, 8); const w = weakOf(b); o.armor = w.blade < 1 && w.volt > 1;
      const s = put('salam', 9, 10); o.fire = weakOf(s).fire == 0 && weakOf(s).water > 1; o.peril = perilOf(put('golem', 12, 12)) >= .3;
      o.scenes = [3, 4, 5, 6, 7, 8].some(fi => (genFloor0(fi).scenes || []).length >= 1);
      G.foes = []; const n = put('rat', 12, 8); n.mhSleep = 1; n.nap = 1; const m = put('rat', 13, 8); m.mhSleep = 1; m.nap = 1; makeNoise(11, 8, 4, 'stone'); o.wake = !n.mhSleep && !m.mhSleep && n.aware == 2;
      return o;
    });
    for (const k of ['armor', 'fire', 'peril', 'scenes', 'wake']) if (!r[k]) throw new Error(k + ': ' + JSON.stringify(r));
  },
  // 世界が勝手に反応を起こす：壺と樽・性質を持ち歩く敵・性質のぶつかる敵同士
  async '壺と樽と、性質を持つ敵'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = {}; G.p.x = 5; G.p.y = 8; G.oil = new Set(); G.gas = []; G.mud = new Set();
      G.pots = [{ x: 6, y: 8, k: 'oil' }]; await step(1, 0); await new Promise(r => setTimeout(r, 400)); o.bump = !G.pots.length && hasOil(6, 8); G.busy = false;
      G.pots = [{ x: 5, y: 9, k: 'poison' }]; const m = mainAction(); o.lift = m && m.t == '持ち上げる'; m.f(); const i = G.bag.items.findIndex(q => q.id == 'pot_poison');
      o.inBag = i >= 0; throwAt(i, 9, 8); await new Promise(r => setTimeout(r, 400)); o.thrown = inGas(9, 8); G.busy = false;
      G.pots = [{ x: 12, y: 12, k: 'oil' }]; ignite(12, 12, 'quiet'); o.fire = !G.pots.length;
      G.foes = []; const a = put('salam', 10, 5), b = put('frog', 11, 5); o.rival = !!rivalWhy(a, b); G.steam = []; feudStep(); o.steam = G.steam.length > 0;
      G.foes = []; G.fires = []; for (let x = 3; x <= 12; x++) G.garden[3][x] = true; const s = put('salam', 3, 3); for (let k = 0; k < 8; k++) { s.x++; envFoeStep() } o.trail = (G.fires || []).length > 0;
      return o;
    });
    for (const k of ['bump', 'lift', 'inBag', 'thrown', 'fire', 'rival', 'steam', 'trail']) if (!r[k]) throw new Error(k + ': ' + JSON.stringify(r));
  },
  // 化学反応が、その場の敵に状態を起こす（28すべてに割り当て）
  async '反応が状態を起こす'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = { all: REACT.every(R => REFF[R.k] && RST[REFF[R.k][0]]) };
      const a = put('gob', 9, 8); a.aware = 2; react('fire+water', 9, 8); o.blind = a.aware == 0 && a.blind > 0;
      await enemiesMove(); o.noFight = !G.fight; G.foes = []; G.fight = null; G.busy = false;
      const b = put('gob', 9, 8); react('fire+poison', 9, 8); o.conf = b.conf > 0; const c1 = b.conf; react('fire+poison', 9, 8); o.once = b.conf == c1; G.foes = [];
      const c = put('gob', 9, 8); react('water+volt', 9, 8); o.stun = c.stun >= 2; G.foes = [];
      return o;
    });
    for (const k of ['all', 'blind', 'noFight', 'conf', 'once', 'stun']) if (!r[k]) throw new Error(k + ': ' + JSON.stringify(r));
  },
  // 次の予測：追ってくる敵の一歩・氷の滑り先
  async '次の予測'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const H = G.m.length, W = G.m[0].length; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) G.seen.add(x + ',' + y);
      const f = put('gob', 9, 8); f.aware = 2; f.alpha = 1; const n = foeNextTile(f);
      G.ice = new Set(['6,10', '7,10', '8,10']); const s = iceSlide(6, 10, 1, 0);
      const g = put('gob', 6, 8); g.aware = 2; const a = foeNextTile(g);
      let err = null; try { drawNext(0, G.view.cx, G.view.cy, SW / G.view.vw) } catch (e) { err = e.message }
      return { n, s, a, err };
    });
    if (!r.n || r.n.x != 8 || r.s.x != 9 || r.s.n != 3 || !r.a || !r.a.atk || r.err) throw new Error(JSON.stringify(r));
  },
  // 蹴る：傷は与えずに押し出す。穴の手前なら落ちる。重い敵は動かない
  async '蹴って地形を使う'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      store('yw31_fights', '5'); G.p.x = 5; G.p.y = 8; G.holes = new Set(['7,8']); const f = put('gob', 6, 8); f.alpha = 1;
      await startFight([f], 'first'); await new Promise(r => setTimeout(r, 1200)); G.busy = false; G.fight && (G.fight.tgt = f);
      const o = { w: kickDest(f).w, btn: foeActs(f).some(a => /^蹴る/.test(a[0])) };
      await kick(); await new Promise(r => setTimeout(r, 600)); o.fell = !G.foes.includes(f);
      G.fight = null; G.busy = false; const g = put('golem', 6, 9); o.heavy = kickDest(g).w; return o;
    });
    if (r.w != '穴へ落ちる' || !r.btn || !r.fell || r.heavy != '重くて動かない') throw new Error(JSON.stringify(r));
  },
  // 持ち物の使い道：宝石の光、古銭の奪い合い、重い物、割れ物、胞子、板、檻
  async '持ち物の使い道'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = {}; const give = id => { const f0 = firstFit(id); G.bag.items.push({ id, ...f0, inst: makeInst(id) }); return G.bag.items.length - 1; };
      const turn = async () => { for (let w = 0; w < 60 && G.busy; w++) await new Promise(r => setTimeout(r, 30)); };
      for (let x = 2; x <= 20; x++) for (let y = 2; y <= 14; y++) G.seen.add(x + ',' + y);
      // 宝石：落ちた所のまわりの目をくらませる。床に残る
      G.p.x = 5; G.p.y = 8; let a = put('gob', 9, 8); a.aware = 0; throwAt(give('gem'), 9, 8); await turn();
      o.gem = a.blind > 0 && G.items.some(i => i.id == 'gem');
      // 古銭：小鬼が寄っていき、先に拾った者を、もう一体が襲う
      G.foes = []; G.items = []; const g1 = put('gob', 12, 6), g2 = put('gob', 12, 10); g1.aware = g2.aware = 0;
      throwAt(give('oldcoin'), 12, 8); await turn(); o.covet = g1.covet == 'oldcoin' && g2.covet == 'oldcoin';
      for (let k = 0; k < 6 && G.items.some(i => i.id == 'oldcoin'); k++) { G.busy = false; await doWait(); await turn(); }
      o.taken = !G.items.some(i => i.id == 'oldcoin'); o.grudge = !!((g1.grudge && g1.grudge.t > 0) || (g2.grudge && g2.grudge.t > 0)); o.why = rivalWhy(g1, g2);
      // 重い物：当たると、よろける
      G.foes = []; G.items = []; a = put('gob', 8, 8); a.aware = 0; throwAt(give('idol'), 8, 8); await turn(); o.heavy = a.hp < a.max && a.stun >= 1;
      // 割れ物：砕けて、遠くまで音が届く
      G.foes = []; G.items = []; throwAt(give('plated'), 9, 8); await turn(); o.crash = !G.items.some(i => i.id == 'plated');
      // 胞子：上にいる魔物が眠る
      G.foes = []; a = put('gob', 9, 8); a.aware = 0; throwAt(give('houshi'), 9, 8); await turn(); G.busy = false; await doWait(); await turn(); o.spore = G.spores.length > 0 && (a.stun > 0 || a.spored > 0);
      // 板：魔物の通り道をふさぐ。叩かれると破れる
      G.foes = []; G.spores = []; G.faceX = 1; G.faceY = 0; a = put('gob', 8, 8); a.aware = 2; slotUse(give('timber')); await turn(); o.plank = (G.planks || []).length == 1;
      // 檻：鍵で開けると、中の魔物が一番近い者を襲う
      G.foes = []; G.planks = []; G.items = []; const c = put('grat', 10, 8); c.caged = 1; const v = put('gob', 12, 8); v.aware = 0; G.p.x = 9; G.p.y = 8; give('key');
      const m = mainAction(); o.cageAct = m && m.t; if (m) m.f(); await turn(); o.cage = !c.caged && c.wild > 0;
      for (let k = 0; k < 4; k++) { G.busy = false; await doWait(); await turn(); } o.wild = (c.grudge && c.grudge.u == v.uid) || v.hp < v.max || c.hp < c.max;
      return o;
    });
    if (!r.gem || !r.covet || !r.taken || !r.grudge || r.why != '奪い合い' || !r.heavy || !r.crash || !r.spore || !r.plank || r.cageAct != '鍵で檻を開ける' || !r.cage || !r.wild) throw new Error(JSON.stringify(r));
  },
  // 魔物との付き合い方：好物を渡す・苦手で遠ざける・化ける・脅す・取引・技の袋
  async '魔物との付き合い方'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      store('yw31_fights', '5'); const o = {}; const give = id => { const f0 = firstFit(id); G.bag.items.push({ id, ...f0, inst: makeInst(id) }); return G.bag.items.length - 1; };
      const turn = async () => { for (let w = 0; w < 60 && G.busy; w++) await new Promise(r => setTimeout(r, 30)); };
      for (let x = 2; x <= 20; x++) for (let y = 2; y <= 14; y++) G.seen.add(x + ',' + y);
      const beast = Object.keys(FOE).find(k => FAM[k] == 'beast' && !SPARE[k] && !FOE[k].boss && !FOE[k].still);
      o.kin = [kinOf('skel'), kinOf('gob'), kinOf(beast)].join(',');
      // 好物を渡すと、戦いが終わる
      G.p.x = 5; G.p.y = 8; let f = put(beast, 6, 8); f.alpha = 1; give('jerky'); await startFight([f], 'first'); await new Promise(r => setTimeout(r, 1200)); G.busy = false; G.fight.tgt = f; ui();
      o.btn = foeActs(f).some(a => /を渡す$/.test(a[0])); spare(); o.gave = !G.bag.items.some(q => q.id == 'jerky') && (!G.fight || !G.fight.foes.includes(f));
      if (G.fight) endFight(); G.fight = null; G.busy = false;
      // 苦手：死者は光る石を持っていると寄れない
      G.foes = []; give('gem'); f = put('skel', 7, 8); f.aware = 2; o.fear = fearFire(f, 2);
      G.bag.items = G.bag.items.filter(q => q.id != 'gem');
      // 化ける：獣の皮をかぶると、獣は気づかない
      G.foes = []; f = put(beast, 7, 8); f.aware = 0; f.flip = true; slotUse(give('kawa')); o.guise = G.guise && G.guise.kin;
      for (let k = 0; k < 3; k++) { G.busy = false; await doWait(); await turn(); } o.unseen = !f.aware && !G.fight;
      G.guise = null; G.fight = null; G.busy = false;
      // 脅す：崩れた相手が逃げ、二度と気づかない
      G.foes = []; f = put('gob', 6, 8); f.alpha = 1; await startFight([f], 'first'); await new Promise(r => setTimeout(r, 1200)); G.busy = false; f.broken = 1; ui();
      o.thr = foeActs(f).some(a => /^脅して/.test(a[0])); threaten(); o.cowed = f.cowed && f.fear > 0 && !G.fight;
      G.fight = null; G.busy = false;
      // 取引：小鬼に「取引」が出て、通行料で通してもらえる
      G.foes = []; f = put('gob', 6, 8); f.alpha = 1; f.pers = null; give('oldcoin'); await startFight([f], 'first'); await new Promise(r => setTimeout(r, 1200)); G.busy = false; G.fight.tgt = f; ui();
      o.trade = foeActs(f).some(a => a[0] == '取引する'); tradeWith(); o.modal = /通行料/.test(document.getElementById('modal').innerText);
      document.getElementById('modal').innerHTML = ''; if (G.fight) endFight(); G.fight = null; G.busy = false;
      // 技の袋：火袋で前へ炎を吹く
      G.foes = []; G.fires = []; f = put('gob', 7, 8); f.aware = 0; G.faceX = 1; G.faceY = 0; slotUse(give('fukuro_f')); await turn(); o.sac = f.hp < f.max || f.burn > 0;
      // 倒し方で袋が取れる：糸を吐く魔物を斬って倒す
      const sp = Object.keys(FOE).find(k => FOE[k].spit && !FOE[k].boss); G.items = []; let got = 0; for (let k = 0; k < 20; k++) { const s = put(sp, 10, 10); G.items = []; sacDrop(s, 'weapon'); if (G.items.some(i => i.id == 'fukuro_s')) got++; } o.drop = got > 0;
      return o;
    });
    if (r.kin.split(',')[0] != 'dead' || r.kin.split(',')[1] != 'gob' || !r.btn || !r.gave || !r.fear || r.guise != 'beast' || !r.unseen || !r.thr || !r.cowed || !r.trade || !r.modal || !r.sac || !r.drop) throw new Error(JSON.stringify(r));
  },
  // 生態系：階ごとに様子が変わり、魔物は勝手に狩り・眠り・増える
  async '生態系'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = {}; const turn = async () => { for (let w = 0; w < 60 && G.busy; w++) await new Promise(r => setTimeout(r, 30)); };
      for (let x = 2; x <= 20; x++) for (let y = 2; y <= 14; y++) G.seen.add(x + ',' + y);
      // 入るたびに違う：20回振って、組み合わせがばらける
      const combos = new Set(); for (let i = 0; i < 20; i++) { const F = { water: G.water, foes: [], m: G.m }; rollEco(F, 3); combos.add([F.eco.hum, F.eco.temp, F.eco.food, F.eco.breed].join()); } o.vary = combos.size;
      G.eco = { hum: 1, temp: 1, food: 1, breed: false, day: 160, ph0: 0, clock: 0, ev: null };
      // 狩り：腹を空かせた捕食者は獲物を襲い、食べたら眠る
      const beasts = Object.keys(FOE).filter(k => kinOf(k) == 'beast' && !FOE[k].boss && !FOE[k].still && !FOE[k].fly);
      const big = beasts.sort((a, b) => FOE[b].hp - FOE[a].hp)[0], small = beasts.find(k => FOE[k].hp * 2 < FOE[big].hp);
      G.p.x = 3; G.p.y = 3; G.hush = 99;
      const pr = put(big, 10, 8), pv = put(small, 11, 8); [pr, pv].forEach(f => { f.aware = 0; ecoInit(f); }); pr.hunger = 90; pv.hunger = 0;
      o.canEat = canEat(pr, pv); o.why = rivalWhy(pr, pv);
      for (let k = 0; k < 12 && pv.hp > 0; k++) { pv.x = 11; pv.y = 8; G.busy = false; await doWait(); await turn(); }
      o.eaten = pv.hp <= 0; o.nap = !!pr.ecoNap && pr.hunger < 10;
      // 巣：時間で子が生まれ、卵を取ると親はついてくるが襲わない、壊すと怒る
      G.foes = []; G.items = []; const mom = put(small, 9, 10); mom.aware = 0; ecoInit(mom);
      G.nests = [{ id: 7, x: 10, y: 10, k: small, kin: 'beast', t: 0, every: 3, max: 3, eggs: 2, flam: true }];
      for (let k = 0; k < 5; k++) { G.busy = false; await doWait(); await turn(); }
      o.born = G.foes.filter(f => f.nestId == 7).length;
      G.p.x = 11; G.p.y = 10; const m1 = mainAction(); o.act1 = m1 && m1.t; if (m1) m1.f(); o.egg = G.bag.items.some(q => q.id == 'tamago') && mom.eggChase;
      const m2 = mainAction(); o.act2 = m2 && m2.t; if (m2 && m2.t == '巣を壊す') { m2.f(); await turn(); } o.rage = !!mom.rage && mom.aware == 2;
      G.fight = null; G.busy = false;
      // 昼と夜：夜は昼行性が見えにくく、夜行性がよく見る
      G.eco.clock = 0; G.eco.ph0 = 3; const night = ecoPhase(); const g = put('gob', 15, 4); g.aware = 0; const sk = put('skel', 15, 6); sk.aware = 0;
      o.night = night == 3 && ecoSight(g) < 0 && ecoSight(sk) > 0;
      // 地面と魔物の詳しい様子
      G.water[12][12] = true; G.garden[13][12] = true; const ti = tileInfo(12, 12).H.map(h => h[0]).join(), tg = tileInfo(12, 13).H.map(h => h[0]).join(); o.tile = /水/.test(ti) && /草/.test(tg);
      o.info = /空腹/.test(ecoFoeLines(g)) && /昼行性/.test(ecoFoeLines(g));
      // 跡目争い：小鬼の長が倒れると、上の2体が争う
      G.foes = []; const L = put('gob', 5, 12), a = put('gob', 6, 12), b = put('gob', 7, 12); L.lead = 1; a.max = a.hp = 20; b.max = b.hp = 15; succession(L); o.heir = rivalWhy(a, b) == '奪い合い' && a.heir && b.heir;
      // 留守の間の変化：戻ると子が増え、傷が癒えている
      G.foes = []; const m3 = put(small, 9, 10); m3.hp = 1; ecoInit(m3); G.nests = [{ id: 8, x: 10, y: 10, k: small, kin: 'beast', t: 0, every: 10, max: 3, eggs: 0 }]; G.turnAll = 100; G.eco.leftAt = 40; ecoCatchUp();
      o.away = G.foes.filter(f => f.nestId == 8).length >= 2 && m3.hp > 1;
      return o;
    });
    if (r.vary < 6 || !r.canEat || r.why != '狩り' || !r.eaten || !r.nap || r.born < 1 || r.act1 != '卵を取る' || !r.egg || r.act2 != '巣を壊す' || !r.rage || !r.night || !r.tile || !r.info || !r.heir || !r.away) throw new Error(JSON.stringify(r));
  },
  // リアルさ：深手で逃げる、壁で音がこもる、匂いをたどる、火は煙を出す、休めば癒える
  async 'リアルさ'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      store('yw31_fights', '5'); const o = {}; const turn = async () => { for (let w = 0; w < 60 && G.busy; w++) await new Promise(r => setTimeout(r, 30)); };
      for (let x = 2; x <= 20; x++) for (let y = 2; y <= 14; y++) G.seen.add(x + ',' + y);
      // 深手：小鬼は逃げる、骸骨は逃げない
      const g = put('gob', 12, 4), s = put('skel', 14, 4); g.hp = g.max = 20; s.hp = s.max = 20; hit(g, 15); hit(s, 15); o.rout = g.routed && g.fear > 0 && !s.routed;
      // 戦いの最中に深手を負うと、逃げて戦いが終わる
      G.foes = []; G.p.x = 5; G.p.y = 8; const f = put('gob', 6, 8); f.alpha = 1; f.hp = f.max = 30; await startFight([f], 'first'); await new Promise(r => setTimeout(r, 1200)); G.busy = false;
      hit(f, 24); await afterPlayer(); o.fled = !G.fight && f.hp > 0 && G.foes.includes(f);
      G.fight = null; G.busy = false;
      // 壁で音がこもる：同じ距離でも、壁の向こうには届かない
      G.foes = []; for (let y = 2; y <= 14; y++) G.m[y][10] = 1; const a = put('gob', 12, 5), b = put('gob', 8, 9); a.aware = 0; b.aware = 0; const n = makeNoise(8, 5, 4, 'test'); o.muffle = !a.inv && !!b.inv;
      for (let y = 2; y <= 14; y++) G.m[y][10] = 0;
      // 匂い：歩いた跡を、獣がたどる
      G.foes = []; G.scent = {}; G.turnAll = 50; for (let x = 5; x <= 12; x++) { G.p.x = x; G.p.y = 12; G.turnAll++; markScent(); }
      const bk = Object.keys(FOE).find(k => kinOf(k) == 'beast' && !FOE[k].boss && !FOE[k].still && !FOE[k].fly); const h = put(bk, 5, 12); h.aware = 0; h.flip = true; G.p.x = 18; G.p.y = 3;
      const opts = DIRS8.map(([a, b]) => [h.x + a, h.y + b, a, b]).filter(([x, y]) => walk(x, y)); o.track = trackStep(h, opts) && h.x == 6;
      // 火は煙を出す
      G.foes = []; G.steam = []; G.fires = [{ x: 15, y: 10, t: 0, life: 6 }]; fireStep(); o.smoke = G.steam.some(q => q.smoke);
      // 休めば癒える
      const w = put('gob', 3, 3); w.max = 20; w.hp = 5; w.aware = 0; w.routed = 1; G.turnAll = 100; for (let k = 0; k < 40; k++) { G.turnAll++; realTick(); } o.heal = w.hp > 5;
      return o;
    });
    if (!r.rout || !r.fled || !r.muffle || !r.track || !r.smoke || !r.heal) throw new Error(JSON.stringify(r));
  },
  // 縄：同じ相手は一戦に一度だけ縛れる（毎ターン縛り続けて無傷、ができないように）
  async '縄は一戦に一度'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      store('yw31_fights', '5'); G.p.x = 5; G.p.y = 8; const f = put('gob', 6, 8); f.alpha = 1; f.hp = f.max = 99;
      const f0 = firstFit('rope'); G.bag.items.push({ id: 'rope', ...f0, inst: makeInst('rope') });
      await startFight([f], 'first'); await new Promise(r => setTimeout(r, 1200)); G.busy = false; G.fight.tgt = f;
      const i = () => G.bag.items.findIndex(q => q.id == 'rope');
      const msgs = []; const _t = toast; toast = m => { msgs.push(m); return _t(m); };
      await act(i()); const s1 = !!f.roped && msgs.some(m => /縛った/.test(m)); G.busy = false; msgs.length = 0; await act(i()); const s2 = msgs.some(m => /警戒/.test(m)) && !msgs.some(m => /縛った/.test(m)); toast = _t;
      const kept = i() >= 0; endFight(); return { s1, s2, kept, again: !f.roped };
    });
    if (!r.s1 || !r.s2 || !r.kept || !r.again) throw new Error(JSON.stringify(r));
  },
  // 予兆と、初めての反応をその場で見せる
  async '予兆と反応の見せ方'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const H = G.m.length, W = G.m[0].length; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) G.seen.add(x + ',' + y);
      const f = put('skel', 9, 8, true); f.alpha = 1; f.aware = 0; const o = {};
      o.watch = watchers().includes(f); o.R = sightR(f) >= 3;
      makeNoise(7, 8, 4, 'stone'); o.noise = (G.noiseFx || []).length > 0 && !!f.heardT;
      REACTD = {}; G.oil.add('12,10'); ignite(12, 10); o.spot = !!G.spot && G.spot.a && G.spot.r;
      await new Promise(r => setTimeout(r, 300)); o.drawn = true; return o;
    });
    if (!r.watch || !r.R || !r.noise || !r.spot) throw new Error(JSON.stringify(r));
  },
  // タップで何でも調べられる（物・階段・罠・地面）
  async 'タップで調べる'(p) {
    await arena(p);
    const r = await p.evaluate(() => {
      G.items.push({ x: 10, y: 8, id: 'sword', drop: 0 }); G.traps = [{ x: 8, y: 10, k: 'noise', known: 1 }]; G.mud = new Set(['9,9']); G.garden = G.m.map(r => r.map(() => false)); G.bush = new Set(); G.glowm = new Set(); G.ice = new Set(); G.anchors = []; G.loose = []; G.thin = []; G.cracks = []; G.graves = []; G.corpses = []; G.cocoons = [];
      const n = (x, y) => { const I = tileInfo(x, y); return I.H.map(h => h[0]).join('|') + '/' + I.L.length; };
      return { item: n(10, 8), trap: n(8, 10), down: n(G.down[0], G.down[1]), exit: n(G.exit[0], G.exit[1]), mud: n(9, 9), none: n(12, 12) };
    });
    if (!/長剣/.test(r.item) || !/鳴子/.test(r.trap) || !/階段/.test(r.down) || !/出口/.test(r.exit) || !/^泥\/1$/.test(r.mud) || r.none !== '/0') throw new Error(JSON.stringify(r));
  },
  async '思い通りに動かす'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const W8 = ms => new Promise(r => setTimeout(r, ms)); const o = {};
      const H = G.m.length, W = G.m[0].length; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) G.seen.add(x + ',' + y);
      G.water = G.m.map(r => r.map(() => false)); G.gim = []; G.traps = []; G.p.hp = G.p.max; G.spawnT = -1e9;
      const add = id => { G.bag.items.push({ id, x: 0, y: 0, rot: 0 }); return G.bag.items.length - 1; };
      G.traps = [{ x: 8, y: 8, k: 'pit', known: 1 }]; const rt = trvRoute(12, 8, false); o.avoid = !!rt && !rt.some(([x, y]) => x == 8 && y == 8) && rt[rt.length - 1][0] == 12;
      G.lava = new Set(); for (let y = 2; y <= 14; y++) G.lava.add('7,' + y); o.lava = trvRoute(12, 8, false) === null; G.lava = new Set(); G.traps = [];
      { const f = put('skel', 9, 8); const hp = f.hp; throwAt(add('bomb'), 9, 8); await W8(400); o.bomb = f.hp < hp; G.foes = []; G.busy = false; }
      { throwAt(add('v_fire'), 10, 9); await W8(300); o.oil = hasOil(10, 9); G.busy = false; }
      { const i = add('torch'); slotUse(i); o.cover = !hasTorch(); slotUse(i); o.uncover = hasTorch(); G.bag.items.splice(i, 1); }
      { G.chest = { x: 6, y: 8, locked: true }; G.bag.items = G.bag.items.filter(q => q.id != 'key'); add('hammer'); openChest(); o.ask = G.chest.locked; openChest(); await W8(300); o.bash = !G.chest.locked && G.items.some(i => i.id == 'idol'); G.chest = null; G.busy = false; }
      return o;
    });
    for (const k of ['avoid', 'lava', 'bomb', 'oil', 'cover', 'uncover', 'ask', 'bash']) if (!r[k]) throw new Error(k + ' が期待どおりでない: ' + JSON.stringify(r));
  },
  // レシピ本と村の飾りがリロードで消えない
  async 'レシピと飾りの保存が残る'(p) {
    await p.evaluate(() => { localStorage.setItem('yw65_rec', JSON.stringify({ potion2: 1 })); localStorage.setItem('yw63_deco', JSON.stringify([{ id: 'potion', x: 8, y: 14 }])); });
    await p.reload(); await p.waitForTimeout(400);
    const r = await p.evaluate(() => [RECIPE.potion2, decoI.length]);
    if (r[0] !== 1 || r[1] !== 1) throw new Error('読み込まれていない: ' + JSON.stringify(r));
  },
  // 敵の先手の待ちの間に相手が消えても、操作が戻る
  async '先手の途中で敵が消えても固まらない'(p) {
    await dive(p);
    await p.evaluate(() => { const f = foeNext(); startFight([f], 'enemy', 1); setTimeout(() => { f.hp = 0; G.fight.foes = []; }, 50); });
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => ({ busy: G.busy, fight: !!G.fight }));
    if (r.busy) throw new Error('busy のまま: ' + JSON.stringify(r));
  },
  // 糸で縛られて武器が届かなくても、取れる行動がある
  async '糸で縛られても詰まない'(p) {
    await dive(p);
    await p.evaluate(() => { const f = foeNext(2); startFight([f], 'first', 2); });
    await p.waitForTimeout(1200);
    const r = await p.evaluate(async () => { G.fight.webbed = 2; G.fight.dist = 3; G.busy = false; const w0 = G.fight.webbed; await fightMove(1, 0); await new Promise(r => setTimeout(r, 900)); return { w0, w1: G.fight ? G.fight.webbed : 0, busy: G.busy, said: LOG.some(m => /もがいた/.test(m)) }; });
    if (!(r.said && r.w1 < r.w0 && !r.busy)) throw new Error('動こうとしても、もがけない: ' + JSON.stringify(r));
  },
  // 戦い方B：ぶつかれば殴る。「！」の大振りは、一歩離れれば空を切る。盾なら受け止める
  async 'ぶつかれば殴る・！の大振り'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = {}; const give = id => { const f0 = firstFit(id); G.bag.items.push({ id, ...f0, inst: makeInst(id) }); return G.bag.items.length - 1; }; store('yw31_fights', '5'); G.p.x = 5; G.p.y = 8; const f = put('gob', 6, 8); f.alpha = 1; f.aware = 2; f.hp = f.max = 40;
      give('sword'); await step(1, 0); await new Promise(r => setTimeout(r, 900)); o.fight = !!G.fight; o.hit = f.hp < 40; o.noRow = !document.getElementById('frow').classList.contains('on');
      // 予告 → 一歩離れる → 空振りで体勢が崩れる
      G.busy = false; f.tele = 1; f.windup = true; const hp = G.p.hp, post = f.post || 0; await fightMove(-1, 0); await new Promise(r => setTimeout(r, 900));
      o.dodged = G.p.hp == hp && !f.tele && (f.post || 0) > post;
      // 予告 → 盾で受け止める
      G.busy = false; G.p.x = 5; f.x = 6; f.y = 8; f.rx = f.x * T; f.ry = f.y * T; syncDist(); f.tele = 1; const hp2 = G.p.hp; G.guard = 3; await strike(f); o.blocked = G.p.hp == hp2;
      // 予告 → そのまま受けると痛い
      G.guard = 0; G.breath = 0; f.tele = 1; const hp3 = G.p.hp; await strike(f); o.hurt = hp3 - G.p.hp >= Math.round(f.atk * 1.6) - 1;
      return o;
    });
    if (!(r.fight && r.hit && r.noRow && r.dodged && r.blocked && r.hurt)) throw new Error(JSON.stringify(r));
  },
  // 階の題字と説明の一言が重ならない
  async '題字の間は一言を待たせる'(p) {
    await dive(p);
    await p.waitForTimeout(800);
    const during = await p.evaluate(() => [!!G.title, getComputedStyle(document.getElementById('toast')).opacity]);
    if (during[0] && +during[1] > 0.05) throw new Error('題字の最中に一言が出ている');
    await p.waitForTimeout(5200);
    const after = await p.evaluate(() => +getComputedStyle(document.getElementById('toast')).opacity);
    if (after < 0.5) throw new Error('題字の後に一言が出ていない');
  },
  // 流れの上に階段が来ても、乗れば降りられる
  async '流れの中の階段から降りられる'(p) {
    const r = await p.evaluate(async () => {
      let found = 0, placed = 0;
      for (let i = 0; i < 400 && found < 5; i++) {
        document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, [1, 9, 12, 15][i % 4]);
        if (G.cur && G.down && G.cur.cells.has(G.down.join(','))) placed++;
        // 生成で避けていても、安全網を確かめるため、階段を無理やり流れに入れる
        if (!G.cur || !G.down) continue;
        const [x, y] = G.down; if (!(G.water[y] && G.water[y][x])) continue;
        G.cur.cells.add(x + ',' + y); G.cur.spd = 3; G.foes = [];
        const [a, b] = [-G.cur.dir[0], -G.cur.dir[1]]; if (!walk(x + a, y + b)) continue;
        found++; G.p.x = x + a; G.p.y = y + b; G.busy = false; G.title = null;
        await step(-a, -b); for (let k = 0; k < 60 && G.busy; k++) await new Promise(r => setTimeout(r, 50));
        const ma = mainAction(); if (!(ma && ma.ic == 'down')) return 'SAFETY:流されて降りられない';
      }
      return placed ? 'GEN:流れの上に階段が作られた（' + placed + '）' : found ? 'ok' : 'NONE';
    });
    if (r !== 'ok') throw new Error(r);
  },
  // 待っても、戦っても、環境の時間（火など）は進む
  async '待つと火が燃え広がる'(p) {
    await dive(p);
    const r = await p.evaluate(async () => { G.title = null; for (let y = 3; y < MH - 3; y++) for (let x = 3; x < MW - 3; x++) { let ok = true; for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) if (!walk(x + k, y + j) || G.water[y + j][x + k]) ok = false; if (ok) { G.p.x = x; G.p.y = y } } G.foes = []; const P = G.p; G.oil = new Set(); for (const [a, b] of DIRS8) G.oil.add((P.x + a) + ',' + (P.y + b));
      G.cur = null; G.wind = null; G.mud = new Set(); const c = DIRS.map(([a, b]) => [P.x + a, P.y + b]).find(([x, y]) => walk(x, y)); ignite(c[0], c[1]); const n0 = G.fires.length;
      for (let k = 0; k < 3 && G.fires.length <= n0; k++) { document.getElementById('modal').innerHTML = ''; G.title = null; G.fight = null; G.busy = false; G.wind = null; await doWait(); } return [n0, G.fires.length]; });
    if (!(r[1] > r[0])) throw new Error('待っても火が広がらない: ' + r);
  },
  // 蔦・ひび割れた壁・燭台の門が、道具で開く
  async '環境で開く門'(p) {
    for (const type of ['vine', 'crack', 'brazier']) {
      const res = await p.evaluate(async t => {
        let g = null; for (let i = 0; i < 400 && !g; i++) { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, 5); g = G.gim.find(q => q.type == t); } G.eco = null; G.nests = [];
        if (!g) return 'NONE'; G.foes = []; G.title = null;
        const pk = new Set(g.pocket.map(q => q + '')); const same = (q, x, y) => q && q[0] == x && q[1] == y; const c = DIRS.map(([a, b]) => [g.x + a, g.y + b]).find(([x, y]) => walk(x, y) && !pk.has(x + ',' + y) && !same(G.down, x, y) && !same(G.up, x, y) && !same(G.exit, x, y) && !G.gim.some(q => q.levers && q.levers.some(l => l.x == x && l.y == y)));
        G.p.x = c[0]; G.p.y = c[1]; G.items = G.items.filter(i => !(i.x == G.p.x && i.y == G.p.y)); G.srcs = (G.srcs || []).filter(q => !(q.x == G.p.x && q.y == G.p.y)); const add = id => { const f = firstFit(id); if (f) G.bag.items.push({ id, ...f, inst: makeInst(id) }) }; add(t == 'crack' ? 'bomb' : 'torch');
        if (passGim(g)) return '最初から通れる';
        if (t == 'brazier') { for (const b of g.brz) lightBrazier(g, b) } else { const m = mainAction(); if (!m) return '行動が出ない'; m.f() }
        for (let k = 0; k < 6 && !g.open; k++) { G.p.hp = G.p.max; G.foes = []; G.fight = null; G.busy = false; await doWait(); for (let w = 0; w < 50 && G.busy; w++) await new Promise(r => setTimeout(r, 40)) }
        return g.open && passGim(g) ? 'ok' : '開かない';
      }, type);
      if (res !== 'ok') throw new Error(type + ': ' + res);
    }
  },
  // 亡骸に隠れた古代の鞄を漁っても落ちない
  async '古代の鞄を漁れる'(p) {
    const r = await p.evaluate(() => { for (let i = 0; i < 60; i++) { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, 1); const it = G.items.find(q => q.hid && q.id.startsWith('bag:')); if (!it) continue; const s = G.srcs.find(q => q.x == it.x && q.y == it.y); G.title = null; G.twistShown = 1; searchSrc(s); return document.getElementById('toast').textContent } return 'NONE' });
    if (r === 'NONE' || !/鞄/.test(r)) throw new Error('結果: ' + r);
  },
  // 仲間と倉庫が、開き直しても消えない（後から登録される仲間・ボスの武器も）
  async '仲間と倉庫が残る'(p) {
    await p.evaluate(() => { farm = [{ k: 'kagebi', name: '影灯', trips: 1 }, { k: 'gob', name: 'ゴブリン', trips: 0 }, { k: 'puru', name: 'ぷる', trips: 0 }]; wh = [{ id: 'hakamori' }, { id: 'axe' }, { id: 'potion' }]; saveMeta(); });
    await p.reload(); await p.waitForTimeout(500);
    const r = await p.evaluate(() => [farm.map(f => f.k).join(), wh.map(i => i.id).join()]);
    if (r[0] !== 'kagebi,gob,puru' || r[1] !== 'hakamori,axe,potion') throw new Error('消えた: ' + JSON.stringify(r));
  },
  // 引き継ぎコードで、別のブラウザに記録を移せる
  async '引き継ぎコード'(p) {
    const r = await p.evaluate(() => { gold = 777; farm = [{ k: 'fushicho', name: '不死鳥', trips: 0 }]; saveMeta(); const c = saveCode(); const o = loadCode(c); return [o.yw7_gold, JSON.parse(o.yw4_farm)[0].k] });
    if (r[0] !== '777' || r[1] !== 'fushicho') throw new Error(JSON.stringify(r));
  },
  // 化学反応：どの障害にも答えがある
  async '氷と雷の解決策'(p) {
    const r = await p.evaluate(async () => {
      const give = id => { const f = firstFit(id); if (f) G.bag.items.push({ id, ...f, inst: makeInst(id) }) };
      const floorWith = (c, sf) => { for (let i = 0; i < 500; i++) { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, sf || 12); G.title = null; G.eco = null; G.nests = []; G.foes = []; G.wind = null; if (c()) return true } return false };
      const bad = [];
      if (floorWith(() => G.cur && G.cur.cells && G.cur.cells.size >= 4)) { const k = [...G.cur.cells][0].split(',').map(Number); G.p.x = k[0]; G.p.y = k[1]; give('hyouka'); slotUse(G.bag.items.findIndex(q => q.id == 'hyouka')); if (curAt(k[0], k[1])) bad.push('凍らせても流れが残る') }
      if (floorWith(() => G.cur && G.cur.cells && G.cur.cells.size >= 4)) { const k = [...G.cur.cells][0].split(',').map(Number); G.p.x = k[0]; G.p.y = k[1]; while (bagUsed() < Math.ceil(bagCap() * .75) && firstFit('gem')) give('gem'); if (curPush(G.p, true)) bad.push('重い荷物でも流される') }
      if (floorWith(() => G.volts && G.volts.length, 15)) { const v = G.volts[0]; G.volts = [v]; const w = DIRS8.map(([a, b]) => [v.x + a, v.y + b]).find(([x, y]) => inWater(x, y)); if (w) { G.p.x = w[0]; G.p.y = w[1]; G.p.hp = 30; for (let k = 0; k < 3; k++) { G.foes = []; G.fight = null; G.busy = false; await doWait() } if (G.p.hp >= 30) bad.push('放電石の水で感電しない'); G.p.hp = 30; give('boots'); for (let k = 0; k < 3; k++) { G.foes = []; G.fight = null; G.busy = false; await doWait() } if (G.p.hp < 30) bad.push('長靴でも感電する'); G.bag.items = G.bag.items.filter(q => q.id != 'boots'); G.cur = null; G.fires = []; G.p.x = w[0]; G.p.y = w[1]; G.water[w[1]][w[0]] = true; freezeAt(w[0], w[1], 0); G.items = G.items.filter(i => !(i.x == w[0] && i.y == w[1])); G.srcs = (G.srcs || []).filter(q => !(q.x == w[0] && q.y == w[1])); G.bodies = []; G.thin = []; for (let k = 0; k < 3; k++) { G.foes = []; G.fight = null; G.busy = false; document.getElementById('modal').innerHTML = ''; G.title = null; const m = mainAction(); if (m && m.t == '放電石を砕く') { m.f(); for (let w = 0; w < 40 && G.busy; w++) await new Promise(r => setTimeout(r, 30)) } } if (v.hp > 0) bad.push('氷の上から砕けない') } }
      for (const [t, tool] of [['crack', 'hammer'], ['vine', 'v_poison'], ['volt', 'raika']]) { if (!floorWith(() => G.gim.some(g => g.type == t), 5)) continue; const g = G.gim.find(g => g.type == t); const pk = new Set(g.pocket.map(q => q + '')); const c = DIRS.map(([a, b]) => [g.x + a, g.y + b]).find(([x, y]) => walk(x, y) && !pk.has(x + ',' + y)); G.p.x = c[0]; G.p.y = c[1]; G.items = G.items.filter(i => !(i.x == c[0] && i.y == c[1])); G.srcs = []; give(tool);
        if (t == 'crack') for (let k = 0; k < 3; k++) { G.foes = []; G.fight = null; G.busy = false; G.pots = []; G.bodies = []; G.items = G.items.filter(i => cd(i.x, i.y, G.p.x, G.p.y) > 1); document.getElementById('modal').innerHTML = ''; G.title = null; const m = mainAction(); if (m && m.t == '槌で壁を叩く') { m.f(); for (let w = 0; w < 40 && G.busy; w++) await new Promise(r => setTimeout(r, 30)) } }
        if (t == 'vine') { spill(G.p.x, G.p.y, 'gas', 5); for (let k = 0; k < 2; k++) { G.busy = false; await doWait() } }
        if (t == 'volt') slotUse(G.bag.items.findIndex(q => q.id == 'raika'));
        if (!g.open) bad.push(t + 'が開かない') }
      return bad.join(' / ') || 'ok' });
    if (r !== 'ok') throw new Error(r);
  },
  // 工房：倉庫の材料で、筋の通ったレシピだけが作れる。鍛冶屋で素材を打ち込むと銘がつく
  async '工房と銘打ち'(p) {
    const r = await p.evaluate(() => { runs = 3; gold = 100; wh = [{ id: 'kawa' }, { id: 'gomu' }, { id: 'raiseki' }, { id: 'sword', inst: Object.assign(makeInst('sword', 'テスト'), { af: [] }) }]; saveMeta(); document.getElementById('modal').innerHTML = ''; showBase('', '');
      [...document.querySelectorAll('.place')].find(b => /工房/.test(b.textContent)).click();
      const btns = [...document.querySelectorAll('#tb button')].map(b => b.textContent);
      if (btns.some(t => /作る：雷の瓶/.test(t))) return '瓶が無いのに雷の瓶が作れる';
      [...document.querySelectorAll('#tb button')].find(b => /作る：ゴム底の長靴/.test(b.textContent)).click();
      if (!wh.some(o => o.id == 'boots') || wh.some(o => o.id == 'kawa' || o.id == 'gomu')) return '長靴: ' + JSON.stringify(wh.map(o => o.id));
      document.getElementById('modal').innerHTML = ''; showBase('', ''); [...document.querySelectorAll('.place')].find(b => /鍛冶屋/.test(b.textContent)).click();
      [...document.querySelectorAll('#tb .chip')].filter(b => /長剣/.test(b.textContent)).pop().click();
      [...document.querySelectorAll('#tb button')].find(b => /雷の結晶を打ち込む/.test(b.textContent)).click();
      const sw = wh.find(o => o.id == 'sword'); return sw && sw.inst.af.includes('rai') && gold == 60 && !wh.some(o => o.id == 'raiseki') ? 'ok' : JSON.stringify({ gold, wh }) });
    if (r !== 'ok') throw new Error(r);
  },
  // 誤字
  async '誤字が無い'(p) {
    const html = require('fs').readFileSync(FILE.replace('file://', ''), 'utf8');
    if (/[가-힯]/.test(html)) throw new Error('ハングルが混ざっている');
  },
  // 帰還と倒れたの演出が出て、タップで閉じられる
  async '帰還と倒れたの演出'(p) {
    await dive(p);
    await p.evaluate(() => escape());
    if (!await p.$('#ret')) throw new Error('帰還の画面が出ない');
    // 1回目で演出を飛ばし、2回目で閉じる（演出が終わっていれば1回目で閉じる）
    await p.evaluate(() => { const r = document.getElementById('ret'); r.click(); const r2 = document.getElementById('ret'); if (r2 && !r2.classList.contains('out')) r2.click(); });
    await p.waitForTimeout(400);
    if (await p.$('#ret')) throw new Error('帰還の画面が閉じない');
    await dive(p);
    await p.evaluate(() => die());
    if (!await p.$('#ret.fall')) throw new Error('倒れたの画面が出ない');
  },
  // 敵は壁の向こうが見えず、小石の音に寄っていき、気づいていない小さな敵は背後から一撃で仕留められる
  async '視線・音・暗殺'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = {};
      let f = put('gob', 8, 8, true); await enemiesMove(); o.open = f.aware;
      G.foes = []; G.m[7][7] = G.m[8][7] = G.m[9][7] = 1; f = put('gob', 8, 8, true); await enemiesMove(); o.wall = f.aware || 0;
      G.m[7][7] = G.m[8][7] = G.m[9][7] = 0; G.foes = [];
      f = put('gob', 16, 11, false); G.bag.items.push({ id: 'koishi', x: 0, y: 0, rot: 0, n: 2 }); G.faceX = 1; G.faceY = 0; throwStone(G.bag.items.length - 1);
      await new Promise(r => setTimeout(r, 300)); for (let k = 0; k < 6; k++) await enemiesMove(); o.stone = [f.x, f.y, f.aware || 0];
      G.foes = []; f = put('gob', 6, 8, false); f.max = f.hp = 9; await startFight([f], contactMode(f)); await new Promise(r => setTimeout(r, 1200)); o.ass = [f.hp, !!G.fight, G.bodies.length];
      return o;
    });
    if (r.open !== 1 || r.wall !== 0) throw new Error('視線: ' + JSON.stringify(r));
    if (Math.abs(r.stone[0] - 11) > 2 || Math.abs(r.stone[1] - 8) > 2 || r.stone[2] !== 0) throw new Error('小石: ' + JSON.stringify(r));
    if (r.ass[0] > 0 || r.ass[1] || r.ass[2] !== 1) throw new Error('暗殺: ' + JSON.stringify(r));
  },
  // 相性の悪い種族は勝手に争い、追ってくる敵も天敵の隣で足を止める
  async '縄張り争い'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const a = put('skel', 10, 8, false), b = put('beetle', 11, 8, true);
      for (let i = 0; i < 12 && G.foes.length > 1; i++) await enemiesMove();
      const o = { left: G.foes.length, bodies: G.bodies.length };
      G.foes = []; G.p.x = 4; G.p.y = 8; const c = put('skel', 9, 8, true); c.aware = 2; put('beetle', 7, 9, false);
      for (let t = 0; t < 3; t++) await enemiesMove(); o.chaser = [c.x, !!feudOf(c), !!G.fight]; try { JSON.stringify(G.foes); o.json = 1 } catch (e) { o.json = 0 }
      return o;
    });
    if (r.left !== 1 || r.bodies !== 1) throw new Error('争わない: ' + JSON.stringify(r));
    if (!r.chaser[1] || r.chaser[2]) throw new Error('追手が止まらない: ' + JSON.stringify(r));
    if (!r.json) throw new Error('争い中の敵が保存できない');
  },
  // 薄い壁は槌・吹き飛ばした敵・揺れで崩れ、崩れかけの天井は小石や太鼓で落ちる
  async '壊れる地形'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const o = {};
      G.m[8][7] = 1; G.thin = [{ x: 7, y: 8 }]; G.p.x = 6; G.p.y = 8; G.bag.items.push({ id: 'hammer', x: 0, y: 0, rot: 0 });
      const a = mainAction(); o.lab = a && a.t; a.f(); await new Promise(r => setTimeout(r, 500)); o.hammer = walk(7, 8);
      G.m[8][12] = 1; G.thin = [{ x: 12, y: 8 }]; G.p.x = 10; const f = put('gob', 11, 8, false); knockBack(f, G.p, 4); o.kb = walk(12, 8);
      G.foes = []; G.p.x = 4; G.p.y = 8; G.loose = [{ x: 9, y: 8, ph: 0 }]; const g = put('beetle', 9, 8, true);
      G.bag.items.push({ id: 'koishi', x: 0, y: 0, rot: 0, n: 3 }); G.faceX = 1; G.faceY = 0; throwStone(G.bag.items.length - 1);
      await new Promise(r => setTimeout(r, 800)); o.rock = [g.hp < g.max, G.loose.length];
      G.foes = []; G.loose = [{ x: 8, y: 11, ph: 0 }]; G.m[5][14] = 1; G.thin = [{ x: 14, y: 5 }]; G.p.x = 12; G.p.y = 8; await new Promise(r => setTimeout(r, 400));
      G.bag.items.push({ id: 'taiko', x: 0, y: 0, rot: 0 }); useTaiko(G.bag.items.length - 1); await new Promise(r => setTimeout(r, 600));
      o.taiko = [G.loose.length, walk(14, 5)];
      return o;
    });
    if (!r.hammer || !/崩す/.test(r.lab)) throw new Error('槌: ' + JSON.stringify(r));
    if (!r.kb) throw new Error('吹き飛ばし: ' + JSON.stringify(r));
    if (!r.rock[0] || r.rock[1]) throw new Error('落石: ' + JSON.stringify(r));
    if (r.taiko[0] || !r.taiko[1]) throw new Error('太鼓: ' + JSON.stringify(r));
  },
  // 仲間は戦い以外にも一つ得意なことがある
  async '仲間の得意なこと'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms)); const mate = k => { G.bag.items.push({ id: k, x: 0, y: 0, rot: 0, hp: ITEM[k].hp }); return G.bag.items.length - 1; };
      const o = {}; for (let y = 2; y <= 14; y++) G.m[y][12] = 1; G.p.x = 11; G.p.y = 9; G.fu = {};
      let i = mate('burrow'); slotUse(i); await W(450); o.dig = walk(12, 9); G.bag.items.splice(i, 1);
      o.dark = hasFire(); i = mate('wisp'); o.fire = hasFire() && hasLight(); G.bag.items.splice(i, 1);
      G.items.push({ x: 15, y: 9, id: 'potion' }); for (let x = 12; x <= 15; x++) G.seen.add(x + ',9'); i = mate('spider'); slotUse(i); await W(700);
      document.getElementById('modal').innerHTML = ''; o.fetch = G.bag.items.some(q => q.id == 'potion');
      G.chest = { x: 10, y: 9, locked: true }; i = mate('rust'); slotUse(i); await W(450); o.lock = !G.chest.locked;
      return o;
    });
    if (!r.dig || r.dark || !r.fire || !r.fetch || !r.lock) throw new Error(JSON.stringify(r));
  },
  // 混乱した敵は同士討ちし、餌付けした獣はなついて仲間になり、群れの長を倒すと残りは逃げる
  async '敵の状態'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms)); const give = (id, n) => { G.bag.items.push({ id, x: 0, y: 0, rot: 0, n }); return G.bag.items.length - 1; };
      const o = {}; G.p.x = 5; G.p.y = 8; for (let y = 2; y <= 14; y++) for (let x = 2; x <= 20; x++) G.seen.add(x + ',' + y);
      const a = put('skel', 10, 8), b = put('skel', 11, 8); G.faceX = 1; G.faceY = 0; throwPowder(give('konran', 2)); await W(400);
      const h0 = a.hp + b.hp; for (let t = 0; t < 4; t++) await enemiesMove(); o.conf = h0 - Math.max(0, a.hp) - Math.max(0, b.hp); o.cfight = !!G.fight;
      G.foes = []; const r = put('rat', 8, 8, true); let i = give('jerky'); await slotUse(i); await slotUse(i); await W(400); o.charm = r.charm > 0;
      i = give('fish'); await slotUse(i); await slotUse(i); await W(400); o.scout = G.items.some(it => it.id == 'rat' && it.scout);
      G.foes = []; put('skel', 12, 8); put('skel', 13, 8); const L = put('lskel', 12, 9); L.max = L.hp = 20; markLeaders(G); o.lead = L.lead;
      L.hp = 0; onFoeDeath(L); G.foes = G.foes.filter(f => f.hp > 0); o.deadNew = G.foes.some(f => f.lead);
      // 獣の長が倒れると、群れは散る
      G.foes = []; const bk = Object.keys(FOE).filter(k => kinOf(k) == 'beast' && !FOE[k].boss && !FOE[k].still); put(bk[0], 12, 8); put(bk[0], 13, 8); const L2 = put(bk[0], 12, 9); L2.max = L2.hp = 40; markLeaders(G);
      L2.hp = 0; onFoeDeath(L2); G.foes = G.foes.filter(f => f.hp > 0); o.fear = G.foes.every(f => f.fear > 0);
      try { JSON.stringify(G.foes); o.json = 1 } catch (e) { o.json = 0 }
      return o;
    });
    if (r.conf <= 0 || r.cfight || !r.charm || !r.scout || !r.lead || !r.deadNew || !r.fear || !r.json) throw new Error(JSON.stringify(r));
  },
  // 地形の性格：氷は滑る、泥は一手遅れる、茂みは隠れる、橋は燃え落ちる、裂け谷は必ず渡れる
  async '地形の性格'(p) {
    await arena(p);
    const r = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms)); const o = {};
      document.getElementById('modal').innerHTML = ''; G.ice = new Set(); for (let x = 6; x <= 12; x++) G.ice.add(x + ',8'); G.p.x = 5; G.p.y = 8; G.busy = false; await step(1, 0); await W(300); o.ice = G.p.x;
      document.getElementById('modal').innerHTML = ''; G.ice = new Set(); G.mud = new Set(['6,8']); G.p.x = 5; G.p.y = 8; const f = put('skel', 12, 8, true); f.aware = 2; const x0 = f.x; G.busy = false; await step(1, 0); await W(300); o.mud = x0 - f.x;
      G.mud = new Set(); G.foes = []; G.bush = new Set(['5,8']); G.p.x = 5; G.p.y = 8; const g = put('gob', 8, 8, true); await enemiesMove(); o.bush = g.aware || 0;
      G.bush = new Set(); G.foes = []; G.holes = new Set(['10,8']); G.bridges = new Set(['9,8']); G.fires = [{ x: 9, y: 8, t: 2, life: 9 }]; fireStep(); o.bridge = [G.bridges.has('9,8'), G.holes.has('9,8')];
      let bad = 0; for (let k = 0; k < 40; k++) { const F = genFloor(5 + (k % 30)); if (F.twist != 'chasm') continue; const H = F.holes; const seen = new Set([F.start + '']); const q = [F.start];
        while (q.length) { const [x, y] = q.pop(); for (const [a, b] of DIRS) { const nx = x + a, ny = y + b, kk = nx + ',' + ny; if (seen.has(kk) || !(F.m[ny] && F.m[ny][nx] === 0) || H.has(kk)) continue; seen.add(kk); q.push([nx, ny]); } }
        if ([F.down, F.exit].filter(Boolean).some(t => !seen.has(t[0] + ',' + t[1]))) bad++; }
      o.chasmBad = bad; return o;
    });
    if (r.ice < 12) throw new Error('氷で滑らない: ' + JSON.stringify(r));
    if (r.mud < 2) throw new Error('泥で遅れない: ' + JSON.stringify(r));
    if (r.bush !== 0) throw new Error('茂みで見つかる: ' + JSON.stringify(r));
    if (r.bridge[0] || !r.bridge[1]) throw new Error('橋が燃えない: ' + JSON.stringify(r));
    if (r.chasmBad) throw new Error('裂け谷で階段に行けない: ' + JSON.stringify(r));
  },
  // 化学反応：8つの性質の総当たり28通りが、すべて起きる
  async '化学反応'(p) {
    await dive(p);
    const cases={
 'fire+water':()=>{W(9,8);G.fires.push({x:8,y:8,t:1,life:9});fireStep()},
 'fire+ice':()=>{G.ice.add('9,8');G.fires.push({x:8,y:8,t:1,life:9});envHazardStep()},
 'fire+volt':()=>{W(12,8);G.fires.push({x:11,y:9,t:1,life:9});G.garden[10][10]=true;G.garden[10][12]=true;shockSet(waterBody(12,8),5,'t')},
 'fire+oil':()=>{G.oil.add('9,8');ignite(9,8)},
 'fire+poison':()=>{G.gas=[{x:9,y:8,t:0,life:14}];G.fires=[{x:9,y:8,t:0,life:5}];gasStep()},
 'fire+wind':()=>{G.garden[8][10]=true;G.fires=[{x:9,y:8,t:1,life:9}];gust(1,0,null,1)},
 'fire+earth':()=>{G.mud.add('9,8');G.fires=[{x:8,y:8,t:1,life:9}];fireStep()},
 'water+ice':()=>{W(9,8);freezeAt(9,8,0)},
 'water+volt':()=>{W(9,8);shockSet(waterBody(9,8),5,'t')},
 'water+oil':()=>{W(9,8);W(10,8);spill(9,8,'oil',1)},
 'water+poison':()=>{W(9,8);G.gas=[{x:9,y:8,t:0,life:14}];gasStep()},
 'water+wind':()=>{W(9,8);W(10,8);const f=mkFoe('skel',9,8,0);G.foes.push(f);gust(1,0,null,1)},
 'water+earth':()=>{W(8,8);G.faceX=1;G.faceY=0;G.p.x=5;G.p.y=8;G.bag.items.push({id:'doro',x:0,y:0,rot:0,n:3});useMudBall(G.bag.items.length-1)},
 'ice+volt':()=>{W(9,8);G.ice.add('10,8');shockSet(waterBody(9,8),5,'t')},
 'ice+oil':()=>{G.oil.add('9,8');freezeAt(9,8,0)},
 'ice+poison':()=>{G.gas=[{x:9,y:8,t:0,life:14}];freezeAt(9,8,0)},
 'ice+wind':()=>{G.ice.add('9,8');W(10,8);gust(1,0,null,1)},
 'ice+earth':()=>{G.mud.add('9,8');freezeAt(9,8,0)},
 'volt+oil':()=>{W(9,8);G.oil.add('10,8');shockSet(waterBody(9,8),5,'t')},
 'volt+poison':()=>{W(9,8);G.gas=[{x:10,y:8,t:0,life:14}];shockSet(waterBody(9,8),5,'t')},
 'volt+wind':()=>{W(9,8);G.wind={dx:1,dy:0,t:0,every:5,n:0};const f=mkFoe('skel',11,8,0);G.foes.push(f);shockSet(waterBody(9,8),5,'t');G.wind=null},
 'volt+earth':()=>{W(9,8);G.mud.add('10,8');G.mud.add('11,8');shockSet(waterBody(9,8),5,'t')},
 'oil+poison':()=>{G.oil.add('9,8');G.gas=[{x:9,y:8,t:0,life:14}];gasStep()},
 'oil+wind':()=>{G.oil.add('9,8');gust(1,0,null,1)},
 'oil+earth':()=>{G.mud.add('9,8');spill(9,8,'oil',1)},
 'poison+wind':()=>{G.gas=[{x:9,y:8,t:0,life:14}];gust(1,0,null,1)},
 'poison+earth':()=>{G.mud.add('9,8');G.gas=[{x:9,y:8,t:0,life:14}];gasStep()},
 'wind+earth':()=>{G.mud.add('9,8');gust(1,0,null,1)}};
    const miss = [];
    for (const [k, fn] of Object.entries(cases)) {
      const ok = await p.evaluate(async ([k, src]) => { G.title = null; G.fight = null; const H = G.m.length, Wd = G.m[0].length; for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) G.m[y][x] = (x >= 2 && x <= 24 && y >= 2 && y <= 16) ? 0 : 1; G.water = G.m.map(r => r.map(() => false)); G.garden = G.m.map(r => r.map(() => false)); G.foes = []; G.fires = []; G.gas = []; G.ice = new Set(); G.mud = new Set(); G.oil = new Set(); G.steam = []; G.items = []; G.srcs = []; G.gim = []; G.pwater = null; G.pmud = null; G.toil = null; G.wind = null; G.gustT = null; G.p.x = 9; G.p.y = 12; for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) G.seen.add(x + ',' + y); REACTD = {};
        window.W = (x, y) => { G.water[y][x] = true }; try { eval('(' + src + ')')() } catch (e) { return 'ERR ' + e.message } await new Promise(r => setTimeout(r, 30)); return !!REACTD[k] }, [k, fn.toString()]);
      if (ok !== true) miss.push(k + ':' + ok);
    }
    if (miss.length || Object.keys(cases).length !== 28) throw new Error('起きない反応: ' + miss.join(','));
  },
  // モンスターは500種。名前が重ならず、見た目と仲間の登録がそろっていて、各階に住人がいる
  async 'モンスター500種'(p) {
    const r = await p.evaluate(() => {
      const ks = Object.keys(FOE); const g = Object.keys(GEN); const names = new Set(g.map(k => FOE[k].n));
      const dyn = ['puru', 'gyoro', 'koke', 'mochi', 'medama', 'ogyoro']; const ms = ks.filter(k => SP[k] && !dyn.includes(k)).map(k => bodyMask(SP[k])); let close = 0; for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) if (maskDist(ms[i], ms[j]) < 6) close++;
      return { close, total: ks.length, gen: g.length, dup: g.length - names.size, noSp: g.filter(k => !SP[k]).length, noItem: g.filter(k => !ITEM[k]).length, emptyFloor: Array.from({ length: 99 }, (_, i) => i + 1).filter(fi => !genPool(fi).length).length };
    });
    if (r.total < 500 || r.close || r.dup || r.noSp || r.noItem || r.emptyFloor) throw new Error(JSON.stringify(r));
  },
  // 名前つきの階が100。形と性格の組はすべて違い、1つの世界で階ごとに違う階が当たる
  async '名前つきの階100'(p) {
    const r = await p.evaluate(() => {
      const pairs = new Set(FLOORDEF.map(d => d.lay + '|' + d.bio)).size, names = new Set(FLOORDEF.map(d => d.n)).size;
      const got = []; for (let fi = 1; fi < 100; fi++) { if (BOSSF[fi]) continue; const d = floorDef(fi); got.push(d); }
      return { n: FLOORDEF.length, pairs, names, distinct: new Set(got).size, floors: got.length };
    });
    if (r.n !== 100 || r.pairs !== 100 || r.names !== 100 || r.distinct !== r.floors) throw new Error(JSON.stringify(r));
  },
  // 仲間になるかどうかはサイコロではなく「どう倒したか」。条件を満たせば必ず、満たさなければ決して仲間にならない
  async '倒し方で仲間になる'(p) {
    await dive(p);
    const r = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms)); const out = {};
      const one = async (k, fn) => { G.fight = null; G.busy = false; G.foes = []; G.items = []; const P = G.p; const d = DIRS.find(([a, b]) => walk(P.x + a, P.y + b)); const f = mkFoe(k, P.x + d[0], P.y + d[1], 0); G.foes.push(f);
        await startFight([f], 'first'); await W(1400); G.busy = false; fn(f); f.hp = 0; await resolveDeaths(); await W(200); if (G.fight) endFight(''); return G.items.some(i => i.scout && i.id == k); };
      for (let i = 0; i < 4; i++) { out['rat' + i] = await one('rat', f => { f.parN = 0; f.hits = 3 }); }
      out.ratParry = await one('rat', f => { f.parN = 2; f.hits = 3 });
      out.gobHurt = await one('gob', f => { G.fight.hurt = 1; f.hits = 3 });
      out.gobClean = await one('gob', f => { f.hits = 3 });
      return out;
    });
    if (r.rat0 || r.rat1 || r.rat2 || r.rat3 || !r.ratParry || r.gobHurt || !r.gobClean) throw new Error(JSON.stringify(r));
  },
};

// 見通しのいい何もない部屋（暗い）に立たせる
async function arena(p) {
  await dive(p);
  await p.evaluate(() => {
    G.title = null; const H = G.m.length, W = G.m[0].length;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) G.m[y][x] = (x >= 2 && x <= 20 && y >= 2 && y <= 14) ? 0 : 1;
    G.rid = G.m.map(r => r.map(() => -1)); G.eco = null; G.nests = []; G.foes = []; G.items = []; G.srcs = []; G.exit = [2, 2]; G.down = [3, 2]; G.up = null; G.wind = null; G.cur = null; G.mud = new Set(); G.bush = new Set(); G.ice = new Set(); G.holes = new Set(); G.bridges = new Set(); G.lava = new Set(); G.webs = new Set(); G.oil = new Set(); G.evs = []; G.chest = null; G.graves = []; G.cocoons = []; G.relic = null; G.volts = []; G.thin = []; G.loose = []; G.water = G.m.map(r => r.map(() => false)); G.gim = []; G.fires = []; G.bodies = []; G.hush = 0;
    G.p.x = 5; G.p.y = 8; G.bag.items = G.bag.items.filter(q => !ITEM[q.id].lit);
    window.put = (k, x, y, flip) => { const f = mkFoe(k, x, y, 0); f.pers = null; f.slowV = 0; f.fastV = 0; f.slow = 0; f.flip = flip; f.rx = x * T; f.ry = y * T; G.foes.push(f); return f; };
  });
}

async function dive(p) {
  await p.evaluate(() => { document.getElementById('modal').innerHTML = ''; const r = document.getElementById('ret'); if (r) r.remove(); newRaid(null, [], null, 0); G.eco = null; G.nests = []; });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    // 隣（または n マス先）の空きマスに敵を置く
    window.foeNext = (n = 1) => { const P = G.p; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let ok = true; for (let k = 1; k <= n; k++) if (!walk(P.x + a * k, P.y + b * k)) ok = false; if (!ok) continue; const f = mkFoe('slime', P.x + a * n, P.y + b * n, 0); f.rx = f.x * T; f.ry = f.y * T; G.foes.push(f); return f; } throw new Error('置き場所がない'); };
  });
}

(async () => {
  const browser = await chromium.launch();
  let fail = 0;
  for (const [name, fn] of Object.entries(cases)) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(/fonts\.g/, r => r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(FILE); await p.waitForTimeout(500);
    try { await fn(p); if (errs.length) throw new Error('JSエラー: ' + errs.join(' / ')); console.log('✓', name); }
    catch (e) { fail++; console.log('✗', name, '—', e.message); }
    await ctx.close();
  }
  await browser.close();
  console.log(fail ? `${fail} 件失敗` : 'すべて通過');
  process.exitCode = fail ? 1 : 0;
})();

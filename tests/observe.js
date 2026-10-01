// 観察ボット：それなりに考えて遊び、「何が起きていて、何が足りないか」を数字で出す。
// 使い方: node tests/observe.js [回数=6] [1回あたりの手数=1500]
//   START=階 で深い階から始める（例: START=10）
// 結果は画面に要約を出し、tests/out/observe.json に全部を書き出す。
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const RUNS = +process.argv[2] || 6;
const STEPS = +process.argv[3] || 1500;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = process.env.BOT_OUT || path.resolve(__dirname, 'out');

// ページに仕込む計測。ゲームの中身は変えず、呼び出しを数えるだけ
function install() {
  const O = window.OBS = {
    ticks: {}, react: {}, reactNear: {}, reactHit: 0, reactNearN: 0, reactEvents: 0,
    kills: { weapon: 0, env: 0, envBy: {} }, deaths: [], escapes: [], floors: [],
    turns: { map: 0, fight: 0, parry: 0, wait: 0, item: 0, kick: 0 },
    hold: { turns: 0, byCount: [0, 0, 0, 0, 0], byEl: {} },
    opp: { foeTurns: 0, usable: 0, terrainNoItem: 0, itemNoTerrain: 0, neither: 0, byPair: {} },
    fights: 0, fightTurns: [], hpLost: 0,
  };
  const seenK = new Set();
  // 化学反応：全体の回数と、プレイヤーの目の前で起きた回数（同じ手・同じ反応は1回に数える）
  const _react = react;
  react = function (k, x, y) {
    try {
      const kk = (REACT_ALIAS[k] || k); const R = REACT.find(q => q.k == kk);
      if (R && x != null) {
        const key = kk + '@' + (G.steps || 0) + '@' + G.fi;
        if (!seenK.has(key)) {
          seenK.add(key); O.reactEvents++; O.react[kk] = (O.react[kk] || 0) + 1;
          if (G.seen && G.seen.has(x + ',' + y) && cd(x, y, G.p.x, G.p.y) <= 9) { O.reactNearN++; O.reactNear[kk] = (O.reactNear[kk] || 0) + 1; }
          if (G.foes.some(f => f.hp > 0 && cd(f.x, f.y, x, y) <= 1)) O.reactHit++;
        }
      }
    } catch (e) {}
    return _react.apply(this, arguments);
  };
  // 敵の倒れ方：武器か、環境か（呼び出し元で見分ける）
  const ENV = ['fireStep', 'gasStep', 'shockSet', 'envFoeStep', 'envHazardStep', 'dropRock', 'quakeAt', 'holeSwallow', 'lavaStep', 'blastAt', 'foeTrap', 'knockBack', 'crackStep', 'pwaterStep', 'reactEffect', 'windStep', 'curStep'];
  const envOf = st => ENV.find(n => st.includes(n));
  const _ofd = onFoeDeath;
  onFoeDeath = function (f) {
    try { if (!f.__obs) { f.__obs = 1; if (f.assassinated) { O.kills.stealth = (O.kills.stealth || 0) + 1 } const e = envOf(new Error().stack || ''); if (e) { O.kills.env++; O.kills.envBy[e] = (O.kills.envBy[e] || 0) + 1 } else O.kills.weapon++ } } catch (e) {}
    return _ofd.apply(this, arguments);
  };
  const _hs = holeSwallow;
  holeSwallow = function (f) { try { if (f && !f.__obs) { f.__obs = 1; O.kills.env++; O.kills.envBy.hole = (O.kills.envBy.hole || 0) + 1 } } catch (e) {} return _hs.apply(this, arguments); };
  const _kb = knockBack;
  knockBack = function (f) { const n0 = G.foes.length; const r = _kb.apply(this, arguments); try { if (f && f.hp <= 0 && !f.__obs && G.foes.length < n0) { f.__obs = 1; O.kills.env++; O.kills.envBy.hole = (O.kills.envBy.hole || 0) + 1 } } catch (e) {} return r; };
  // 戦闘の手数とパリィ
  O.used = {};const use = k => { O.used[k] = (O.used[k] || 0) + 1 };
  const _ta = throwAt; throwAt = function (i) { try { const q = G.bag.items[i]; if (q) use('投げる:' + ITEM[q.id].n) } catch (e) {} return _ta.apply(this, arguments) };
  const _su = slotUse; slotUse = function (i) { try { const q = G.bag.items[i]; if (q && !G.fight) use('使う:' + ITEM[q.id].n) } catch (e) {} return _su.apply(this, arguments) };
  const _act = act; act = function (i) { try { const q = G.bag.items[i]; if (q) use((ITEM[q.id].weapon ? '武器:' : '戦闘で使う:') + ITEM[q.id].n) } catch (e) {} return _act.apply(this, arguments) };
  const _sp = spare; spare = function () { use('なだめる'); return _sp.apply(this, arguments) };
  const _st = startFight;
  startFight = async function (foes, mode) { if (mode == 'ambush') use('背後から'); return _st.apply(this, arguments) };
  const _sf = startFight;
  startFight = async function () { O.fights++; O._ft = 0; const r = await _sf.apply(this, arguments); return r; };
  const _ap = afterPlayer;
  afterPlayer = async function () { O.turns.fight++; O._ft = (O._ft || 0) + 1; return _ap.apply(this, arguments); };
  const _ef = endFight;
  endFight = function () { if (O._ft) O.fightTurns.push(O._ft); O._ft = 0; return _ef.apply(this, arguments); };
  const _df = defend;
  defend = async function () { O.turns.parry++; return _df.apply(this, arguments); };
  const _kick = kick; kick = async function () { O.turns.kick++; return _kick.apply(this, arguments); };
  const _dw = doWait; doWait = async function () { O.turns.wait++; return _dw.apply(this, arguments); };
  // 倒れた・帰った
  const _die = die;
  die = function () { try { O.deaths.push({ fi: G.fi + 1, by: G.lastHit || '?', fight: !!G.fight }) } catch (e) {} return _die.apply(this, arguments); };
  const _esc = escape;
  escape = function () { try { O.escapes.push({ fi: G.fi + 1, val: bagValue() }) } catch (e) {} return _esc.apply(this, arguments); };
}

// 探索中の1手ごとに、「反応を使える機会があったか」を記録する
function sample() {
  const O = window.OBS; if (!O || !G || G.over || G.fight) return;
  const st = G.steps || 0; if (O._lastS === st + '@' + G.fi) return; O._lastS = st + '@' + G.fi; O.turns.map++;
  const p = G.p;
  // 手持ちで起こせる性質
  const els = new Set();
  G.bag.items.forEach(q => {
    const d = ITEM[q.id] || {};
    if (d.lit && !q.wet && !q.off) els.add('fire');
    if (q.id == 'bomb' && !q.wet) els.add('fire');
    if (d.vial == 'fire') els.add('oil'); if (d.vial == 'poison') els.add('poison');
    if (q.id == 'hyouka') els.add('ice'); if (q.id == 'raika') els.add('volt');
    if (q.id == 'mizu') els.add('water'); if (q.id == 'kaze') els.add('wind'); if (q.id == 'doro') els.add('earth');
    if (q.id == 'firearrow') els.add('fire');
  });
  try { if (hasFire()) els.add('fire'); } catch (e) {}
  O.hold.turns++; O.hold.byCount[Math.min(4, els.size)]++; els.forEach(e => O.hold.byEl[e] = (O.hold.byEl[e] || 0) + 1);
  // 見えている敵の足元・隣にある性質
  const foes = G.foes.filter(f => f.hp > 0 && f.alpha > 0 && !f.dormant && cd(f.x, f.y, p.x, p.y) <= 6 && G.seen.has(f.x + ',' + f.y));
  if (!foes.length) return;
  O.opp.foeTurns++;
  const terr = new Set();
  foes.forEach(f => [[0, 0], ...DIRS8].forEach(([a, b]) => {
    const x = f.x + a, y = f.y + b, k = x + ',' + y;
    if (inWater(x, y)) terr.add('water'); if (hasOil(x, y)) terr.add('oil'); if (inGas(x, y)) terr.add('poison');
    if (isIce(x, y)) terr.add('ice'); if (inMud(x, y)) terr.add('earth'); if ((G.fires || []).some(q => q.x == x && q.y == y)) terr.add('fire');
    if (G.lava && G.lava.has(k)) terr.add('fire'); if (burnable(x, y)) terr.add('burn');
  }));
  // 使える組み合わせ：手持ちの性質と、敵のそばの性質が違えば反応が起きる（草などは火で燃える）
  let ok = null;
  for (const e of els) for (const t of terr) { if (t == 'burn' ? e == 'fire' : e != t) { ok = e + '×' + (t == 'burn' ? '草' : t); break } }
  if (!ok && els.has('wind') && foes.length) ok = null;
  if (ok) { O.opp.usable++; O.opp.byPair[ok] = (O.opp.byPair[ok] || 0) + 1; }
  else if (terr.size && !els.size) O.opp.terrainNoItem++;
  else if (!terr.size && els.size) O.opp.itemNoTerrain++;
  else if (terr.size && els.size) O.opp.terrainNoItem++;
  else O.opp.neither++;
}

// それなりに考えて遊ぶ1手
function brain() {
  const $ = id => document.getElementById(id);
  const O = window.OBS; const T = k => { O.ticks[k] = (O.ticks[k] || 0) + 1; return k; };
  const ret = $('ret'); if (ret) { ret.click(); return T('ret'); }
  const modal = $('modal');
  const BAD = /消去|リセット|初期化|全部消す|削除|協力|ホスト|参加|コピー|貼り付け|護符|帰還の|名前/;
  if (modal && modal.innerHTML) {
    const bs = [...modal.querySelectorAll('button')].filter(b => !b.disabled && b.offsetParent && !b.classList.contains('xbtn') && b.textContent.trim() && !BAD.test(b.textContent));
    const pref = bs.find(b => /^(同じ構成ですぐ潜る|潜る|準備して潜る|探索の続きから)/.test(b.textContent.trim()))
      || bs.find(b => /降りる|入れる|持っていく|連れていく|拾う|進む|はい|開ける|受け取る|取引しない|話す|ついていく/.test(b.textContent))
      || bs.find(b => !b.classList.contains('sub') && !/閉じる|やめる|戻る|しない|捨て|置いて/.test(b.textContent))
      || bs.find(b => /閉じる|やめる|戻る|しない/.test(b.textContent)) || bs[0];
    modal.querySelectorAll('input').forEach(i => { if (!i.value) i.value = 'テスト'; });
    if (pref) { const tx = modal.innerText.slice(0, 16).replace(/\s/g, ''); pref.click(); return T('modal:' + tx + '>' + pref.textContent.trim().slice(0, 8)); }
    return T('modal-stuck');
  }
  if (typeof G === 'undefined' || !G) return 'noG';
  if (G.over) return T('over');
  if (typeof DEF !== 'undefined' && DEF) {
    // 人並みのパリィ：7割はちょうどよく、3割は遅れる
    if (!DEF.input) { if (DEF._ok == null) DEF._ok = Math.random() < .7; const t = performance.now(); if (t > DEF.impact - DEF.win * (DEF._ok ? .5 : -1.2)) defInput(DEF.peril ? 'swipe' : 'tap', 1); }
    return T('def');
  }
  if (G.fishing) { fishInput(); return T('fish'); }
  if ((G.sheet && G.sheet != 'closed') || G.tray) { if (G.tray) { const f = firstFit(G.tray.id); if (f) { G.bag.items.push({ ...carry(G.tray), id: G.tray.id, ...f }); G.tray = null; } else { dropToFloor(G.tray, -1); O.full = (O.full || 0) + 1; G.items.filter(i => i.x == G.p.x && i.y == G.p.y).forEach(i => { i.ignore = true; (G.obsSkip = G.obsSkip || new Set()).add(i.x + ',' + i.y + ',' + i.id) }); } } closeSheet(); return T('sheet'); }
  if (G.busy) return T('busy');
  const p = G.p, its = G.bag.items, hpR = p.hp / p.max;
  const heal = its.findIndex(q => q.id == 'potion' || q.id == 'bigpot' || (ITEM[q.id] || {}).food);
  if (G.fight) {
    const tg = tgtFoe(); const fb = [...document.querySelectorAll('#frow button')].filter(b => !b.disabled);
    const kill = fb.find(b => /忍殺/.test(b.textContent)); if (kill) { kill.click(); return T('f-kill'); }
    if (hpR < .35 && heal >= 0) { act(heal); O.turns.item++; return T('f-heal'); }
    if (hpR < .2) { const fl = fb.find(b => /逃げる|離れる/.test(b.textContent)); if (fl) { fl.click(); return T('f-flee'); } }
    try { if (tg && cd(p.x, p.y, tg.x, tg.y) <= 1) { const K = kickDest(tg); if (K && K.good && /穴へ|溶岩|炎|叩きつけ|崩す/.test(K.w)) { kick(); return T('f-kick'); } } } catch (e) {}
    const ws = its.map((q, i) => [q, i]).filter(([q]) => ITEM[q.id].weapon && !q.out && reachOK(q.id));
    if (ws.length) { ws.sort((a, b) => (parseInt(ITEM[b[0].id].d) || 0) - (parseInt(ITEM[a[0].id].d) || 0)); act(ws[0][1]); return T('f-atk'); }
    if (tg) { const dx = Math.sign(tg.x - p.x), dy = Math.sign(tg.y - p.y); if (cd(p.x, p.y, tg.x, tg.y) > 1) { step(dx, dy); return T('f-move'); } }
    const bare = fb.find(b => /素手/.test(b.textContent)); if (bare) { bare.click(); return T('f-bare'); }
    if (fb.length) { fb[0].click(); return T('f-btn'); }
    doWait(); return T('f-wait');
  }
  // 探索
  if (hpR < .45 && heal >= 0 && !(ITEM[its[heal].id] || {}).mon) { slotUse(heal); O.turns.item++; return T('heal'); }
  // 仕掛け：見えている敵に、手持ちと地形で反応を起こせるなら、戦う前に使う
  try { const g = gimmick(); if (g) { O.turns.gim = (O.turns.gim || 0) + 1; O.gim = O.gim || {}; O.gim[g] = (O.gim[g] || 0) + 1; return T(g); } } catch (e) { O.gErr = String(e.message); }
  try {
    const m = mainAction();
    const goHome = G.exit && (hpR < .25 || (bagUsed() >= bagCap() - 1 && G.fi >= 2));
    if (m && m.f && !/叩き壊す|溶岩|飛び降り|戻れない|上がる/.test(m.t + m.sub) && (!/脱出/.test(m.t) || goHome) && !(m.t == '拾う' && G.items.filter(i => i.x == p.x && i.y == p.y).every(i => i.ignore || (G.obsSkip && G.obsSkip.has(i.x + ',' + i.y + ',' + i.id))))) {
      const down = G.down && p.x == G.down[0] && p.y == G.down[1];
      if (!down || (G.obsT || 0) > 90 || !frontier()) { m.f(); G.obsT = 0; return T('main:' + m.t); }
      if (!down) { m.f(); return T('main'); }
    }
  } catch (e) {}
  G.obsT = (G.obsT || 0) + 1; if (G.obsF !== G.fi) { G.obsF = G.fi; G.obsBad = new Set(); G.obsSkip = new Set(); }
  // 帰る：弱っていて出口が近い、または荷がいっぱい
  const goExit = G.exit && (hpR < .25 || (bagUsed() >= bagCap() - 1 && G.fi >= 2));
  let tgt = null;
  if (goExit) tgt = G.exit;
  if (!tgt) { const it = G.items.filter(i => !i.ignore && !(G.obsSkip && G.obsSkip.has(i.x + ',' + i.y + ',' + i.id)) && G.seen.has(i.x + ',' + i.y) && !(i.x == p.x && i.y == p.y)).sort((a, b) => cd(a.x, a.y, p.x, p.y) - cd(b.x, b.y, p.x, p.y))[0]; if (it && cd(it.x, it.y, p.x, p.y) <= 10 && (G.obsT || 0) < 120) tgt = [it.x, it.y]; }
  if (!tgt && (G.obsT || 0) < 140) { const f = frontier(); if (f) tgt = f; }
  if (!tgt) tgt = G.down || G.exit;
  if (tgt) {
    const r = trvRoute(tgt[0], tgt[1], trvBump(tgt[0], tgt[1]));
    if (r && r.length) { step(r[0][0] - p.x, r[0][1] - p.y); return T('walk'); }
    if (r && !r.length && trvBump(tgt[0], tgt[1])) { step(Math.sign(tgt[0] - p.x), Math.sign(tgt[1] - p.y)); return T('bump'); }
    if (G.items.some(i => i.x == tgt[0] && i.y == tgt[1])) G.items.filter(i => i.x == tgt[0] && i.y == tgt[1]).forEach(i => i.ignore = true);
    (G.obsBad = G.obsBad || new Set()).add(tgt[0] + ',' + tgt[1]);
  }
  const d = DIRS8[Math.floor(Math.random() * 8)]; step(d[0], d[1]); return T('wander');

  function gimmick() {
    const idx = id => its.findIndex(q => q.id == id && !q.wet);
    const foes = G.foes.filter(f => f.hp > 0 && f.alpha > 0 && !f.dormant && !(f.charm > 0) && f.k != 'puru' && f.k != 'koke' && cd(f.x, f.y, p.x, p.y) >= 2 && cd(f.x, f.y, p.x, p.y) <= AIMR && G.seen.has(f.x + ',' + f.y) && losClear(p.x, p.y, f.x, f.y))
      .sort((a, b) => cd(a.x, a.y, p.x, p.y) - cd(b.x, b.y, p.x, p.y));
    if (!foes.length) return null;
    const around = (f, pred) => [[0, 0], ...DIRS8].some(([a, b]) => pred(f.x + a, f.y + b));
    const tryT = (i, x, y, why) => { if (i < 0 || !aimOK(x, y)) return null; throwAt(i, x, y); return why; };
    const fire = () => { let i = idx('firearrow'); if (i >= 0) return i; i = its.findIndex(q => ITEM[q.id].lit && !q.wet && !q.off); return i; };
    for (const f of foes) {
      let r; const buddies = G.foes.filter(o => o !== f && o.hp > 0 && cd(o.x, o.y, f.x, f.y) <= 1).length;
      if (inWater(f.x, f.y) || f.wetC > 0) { if (r = tryT(idx('raika'), f.x, f.y, 'g-雷')) return r; if (r = tryT(idx('hyouka'), f.x, f.y, 'g-氷')) return r; }
      if (hasOil(f.x, f.y) || around(f, (x, y) => inGas(x, y)) || (burnable(f.x, f.y) && !FIREOK(f.k))) { if (r = tryT(fire(), f.x, f.y, 'g-火')) return r; }
      if (buddies >= 1) { if (r = tryT(idx('bomb'), f.x, f.y, 'g-爆弾')) return r; if (r = tryT(idx('konran'), f.x, f.y, 'g-混乱')) return r; }
      const pot = (G.pots || []).find(q => cd(q.x, q.y, f.x, f.y) <= 1 && aimOK(q.x, q.y));
      if (pot) { if (r = tryT(idx('koishi'), pot.x, pot.y, 'g-壺を割る')) return r; }
      for (const id of ['hidane', 'pot_oil', 'pot_poison', 'pot_fire', 'pot_sand', 'pot_water', 'v_poison', 'v_fire', 'doro', 'mizu']) { if (r = tryT(idx(id), f.x, f.y, 'g-' + (ITEM[id] || {}).n)) return r; }
    }
    return null;
  }
  // 見えている床のうち、まだ見ていない所に接している一番近い場所
  function frontier() {
    let best = null, bd = 1e9;
    for (const k of G.seen) {
      if (G.obsBad && G.obsBad.has(k)) continue; const [x, y] = k.split(',').map(Number); if (!walk(x, y) || isPit(x, y)) continue;
      if (!DIRS.some(([a, b]) => !G.seen.has((x + a) + ',' + (y + b)) && G.m[y + b] && G.m[y + b][x + a] !== undefined)) continue;
      const dd = cd(x, y, p.x, p.y); if (dd > 0 && dd < bd) { bd = dd; best = [x, y]; }
    }
    return best;
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const all = [];
  for (let run = 0; run < RUNS; run++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(FILE); await page.waitForTimeout(600);
    await page.evaluate(install);
    const START = +process.env.START || 0;
    if (START) await page.evaluate(sf => { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, sf); }, START);
    let maxF = 0, stall = 0, last = '';
    for (let s = 0; s < STEPS; s++) {
      let r; try { r = await page.evaluate(brain); await page.evaluate(sample); } catch (e) { errs.push('evaluate: ' + e.message); break; }
      const sig = await page.evaluate(() => typeof G == 'undefined' || !G ? 'x' : [G.fi, G.p.x, G.p.y, G.p.hp, !!G.fight, G.over, document.getElementById('modal').innerHTML.length].join('|'));
      maxF = Math.max(maxF, await page.evaluate(() => (G && G.fi || 0) + 1));
      if (sig === last) { if (++stall > 80) { await page.evaluate(() => { if (G) { G.busy = false; document.getElementById('modal').innerHTML = ''; if (!G.fight && !G.over) { const d = DIRS8[Math.floor(Math.random() * 8)]; step(d[0], d[1]); } } }); stall = 0; } } else { stall = 0; last = sig; }
      await page.waitForTimeout(r === 'def' ? 25 : r === 'busy' ? 50 : 40);
    }
    const o = await page.evaluate(() => { const O = window.OBS; O.maxF = (G.fi || 0) + 1; return JSON.parse(JSON.stringify(O, (k, v) => k.startsWith('_') ? undefined : v)); });
    o.maxF = maxF; o.errors = errs.slice(0, 5);
    all.push(o);
    console.log('  手の内訳', JSON.stringify(o.ticks));console.log(`run ${run}: 最深 ${maxF}F / 倒れた ${o.deaths.length} / 帰った ${o.escapes.length} / 戦闘 ${o.fights} / 反応 ${o.reactEvents}（目の前 ${o.reactNearN}）/ エラー ${errs.length}`);
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'observe.json'), JSON.stringify(all, null, 1));
  // 要約
  const sum = (f) => all.reduce((s, o) => s + f(o), 0);
  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '-';
  const merge = (f) => { const m = {}; all.forEach(o => Object.entries(f(o) || {}).forEach(([k, v]) => m[k] = (m[k] || 0) + v)); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const mapT = sum(o => o.turns.map), fightT = sum(o => o.turns.fight), parry = sum(o => o.turns.parry);
  const hold = { turns: sum(o => o.hold.turns), c: [0, 1, 2, 3, 4].map(i => sum(o => o.hold.byCount[i])) };
  const opp = { f: sum(o => o.opp.foeTurns), u: sum(o => o.opp.usable), tn: sum(o => o.opp.terrainNoItem), in: sum(o => o.opp.itemNoTerrain), n: sum(o => o.opp.neither) };
  const ft = all.flatMap(o => o.fightTurns);
  console.log('\n===== 観察の要約（' + RUNS + '回 × ' + STEPS + '手） =====');
  console.log('最深の階', all.map(o => o.maxF + 'F').join(' / '));
  console.log('手の使い方  探索 ' + mapT + ' 手 ／ 戦闘 ' + fightT + ' 手（うちパリィの受け ' + parry + ' 回）／ 蹴り ' + sum(o => o.turns.kick) + ' ／ 待つ ' + sum(o => o.turns.wait) + ' ／ 道具 ' + sum(o => o.turns.item));
  console.log('使われた手段 ' + merge(o => o.used).length + ' 種: ' + merge(o => o.used).map(([k, v]) => k + ':' + v).join(' '));
  { const gim = sum(o => (o.turns.gim || 0) + o.turns.kick), fgt = sum(o => o.turns.fight) - sum(o => o.turns.kick); const k = sum(o => o.kills.env), w = sum(o => o.kills.weapon);
    console.log('★ ギミックと戦闘  手の数 ' + gim + ' 対 ' + fgt + '（ギミック ' + pct(gim, gim + fgt) + '）／ 倒した敵 ' + k + ' 対 ' + w + '（ギミック ' + pct(k, k + w) + '）');
    console.log('  使ったギミック: ' + merge(o => o.gim).map(([k, v]) => k + ':' + v).join(' ')); }
  console.log('戦闘  ' + sum(o => o.fights) + ' 回、1戦あたり平均 ' + (ft.length ? (ft.reduce((a, b) => a + b, 0) / ft.length).toFixed(1) : '-') + ' 手');
  console.log('敵の倒れ方  武器 ' + sum(o => o.kills.weapon) + ' ／ 環境 ' + sum(o => o.kills.env) + '（' + merge(o => o.kills.envBy).map(([k, v]) => k + ':' + v).join(' ') + '）');
  console.log('化学反応  自然に起きた ' + sum(o => o.reactEvents) + ' 回、うち目の前 ' + sum(o => o.reactNearN) + ' 回、敵を巻き込んだ ' + sum(o => o.reactHit) + ' 回');
  console.log('  多い反応: ' + merge(o => o.react).slice(0, 8).map(([k, v]) => k + ':' + v).join(' '));
  console.log('反応の材料を持っていた手の割合  0種 ' + pct(hold.c[0], hold.turns) + ' ／ 1種 ' + pct(hold.c[1], hold.turns) + ' ／ 2種 ' + pct(hold.c[2], hold.turns) + ' ／ 3種以上 ' + pct(hold.c[3] + hold.c[4], hold.turns));
  console.log('  持っていた性質: ' + merge(o => o.hold.byEl).map(([k, v]) => k + ':' + pct(v, hold.turns)).join(' '));
  console.log('敵が見えていた手 ' + opp.f + ' のうち');
  console.log('  反応を仕掛けられた（材料も地形もあった） ' + pct(opp.u, opp.f));
  console.log('  地形はあったが、材料がなかった       ' + pct(opp.tn, opp.f));
  console.log('  材料はあったが、敵のそばに地形がなかった ' + pct(opp.in, opp.f));
  console.log('  どちらもなかった                   ' + pct(opp.n, opp.f));
  console.log('  使えた組み合わせ: ' + merge(o => o.opp.byPair).slice(0, 8).map(([k, v]) => k + ':' + v).join(' '));
  console.log('倒れた ' + sum(o => o.deaths.length) + ' 回: ' + all.flatMap(o => o.deaths).map(d => d.fi + 'F ' + d.by).join(' ／ '));
  console.log('帰った ' + sum(o => o.escapes.length) + ' 回: ' + all.flatMap(o => o.escapes).map(d => d.fi + 'F 価値' + d.val).join(' ／ '));
  const errs = all.flatMap(o => o.errors); if (errs.length) console.log('エラー', [...new Set(errs)].slice(0, 5));
})();

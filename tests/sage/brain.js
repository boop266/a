// 賢者ボットの頭脳（ページの中で動く）。
// 敵がいる場面では、打てる手を全部挙げ、ゲームの状態を複製して実際に数手先まで試し、
// 一番よかった手を選ぶ。手の知識を書き込むのではなく、試して確かめるので、
// 「この道具は本当に役に立つのか」を、遊び方の思い込みなしに測れる。
(() => {
  const S = window.SAGE = {
    noRoute: 0,
    skill: .7,          // 受け（パリィ・見切り）が間に合う確率。人並み
    H: 3,               // 試したあと、さらに何手先まで見るか
    style: 'all',       // 遊び方の型（下の STYLES）
    log: { avail: {}, pick: {}, gain: {}, sims: 0, decisions: 0, simMs: 0 },
    real: true,
  };
  const $ = id => document.getElementById(id);

  // ---- 遊び方の型：使ってよい手と、何を喜ぶか ----
  // ban: 使わない手の種類 / like: 点数の重み
  const STYLES = S.STYLES = {
    all: {},
    brawler: { ban: /^(throw|use)/, like: {} },                          // 武器だけで押し切る
    noweapon: { ban: /^act:w/, like: {} },                                 // 武器を振らない：環境・道具・仲間で
    pacifist: { like: { kill: -30, calm: 40 } },                           // 殺さずに進む
    sneak: { like: { seen: -6 } },                                         // 見つからずに進む
    chemist: { like: { env: 25 } },                                        // 反応で倒すのが好き
  };

  // ---- 状態の複製と復元 ----
  const GL = ['REACTD', 'KNOW', 'DISC', 'codex', 'RXK', 'MAPD', 'JOIND', 'farm', 'wh', 'vill', 'pets', 'runs', 'gold', 'stash'];
  const save = () => { const o = { G }; GL.forEach(k => { try { o[k] = structuredClone(eval(k)); } catch (e) {} }); return o; };
  const restore = o => { G = o.G; GL.forEach(k => { if (k in o) try { eval(k + '=o[k]'); } catch (e) {} }); };

  // 試している間だけ差し替える関数（倒れても村へ戻らない、保存しない）
  const _die = die, _esc = escape, _set = Storage.prototype.setItem;
  const QUIET = ['ui', 'toast', 'buzz', 'banner', 'showTitle', 'renderBar']; const _q = {}; QUIET.forEach(k => { try { _q[k] = eval(k); } catch (e) {} });
  const simOn = () => {
    VT.sim = true; S.real = false;
    die = function () { G.over = true; G.simDead = 1; };
    escape = function () { G.over = true; G.simEsc = 1; };
    Storage.prototype.setItem = function () {};
    QUIET.forEach(k => { if (_q[k]) eval(k + '=function(){}'); });
  };
  const simOff = () => { VT.sim = false; S.real = true; die = _die; escape = _esc; Storage.prototype.setItem = _set; QUIET.forEach(k => { if (_q[k]) eval(k + '=_q[k]'); }); const h = VT.held.splice(0); h.forEach(fn => requestAnimationFrame(fn)); };
  window.confirm = () => true; window.alert = () => {};

  // ---- 受け：攻撃が来たら、腕前の確率で正しく受ける ----
  const _tt = turnTick; turnTick = function () { if (G) G.ttN = (G.ttN || 0) + 1; return _tt.apply(this, arguments); };
  const _def = defend;
  defend = function (f, fp) {
    const pr = _def.apply(this, arguments);
    const d = DEF;
    if (d) {
      const good = Math.random() < S.skill;
      const kind = good ? (d.peril ? 'swipe' : 'tap') : (Math.random() < .5 ? 'tap' : 'swipe');
      const t = good ? d.impact - d.win * (.1 + Math.random() * .5) : d.impact + d.win * (1.5 + Math.random());
      setTimeout(() => { if (DEF === d && !d.input) d.input = { kind, t, dx: 1 }; }, Math.max(0, t - performance.now()));
    }
    return pr;
  };

  // 手が終わって、次の手を打てるまで時間を進める
  S.settle = async (lim = 6000) => {
    const idle = () => !G || G.over || (!G.busy && !DEF && !G.fishing && !VT.pending());
    for (let k = 0; k < 8; k++) {
      await VT.run(lim, idle);
      if (G && G.tray && !S.real) { G.tray = null; }
      if (G && G.sheet && G.sheet != 'closed' && !S.real) { try { closeSheet(); } catch (e) {} }
      if (G && G.fishing) { try { fishInput(); } catch (e) {} continue; }
      if (idle()) break;
    }
    if (!S.real) { const m = $('modal'); if (m && m.innerHTML) m.innerHTML = ''; }
  };

  // 今いる所から歩いて行ける床（見えている所だけ）
  // 道探し：眠っている魔物も「どかせる相手」として通れる扱いにする
  const pass = (x, y, goal) => { let c = 0; try { c = trvCost(x, y, goal); } catch (e) {} if (c) return c < 40; return !!(walk(x, y) && G.seen.has(x + ',' + y) && foeAt(x, y) && !lethalTile(x, y)); };
  S.reach = () => { const p = G.p, seen = new Set([p.x + ',' + p.y]), q = [[p.x, p.y]];
    while (q.length) { const [x, y] = q.pop(); for (const [a, b] of DIRS8) { const nx = x + a, ny = y + b, k = nx + ',' + ny; if (seen.has(k) || !diagOK(x, y, a, b) || !pass(nx, ny)) continue; seen.add(k); q.push([nx, ny]); } }
    return seen; };
  S.route = (tx, ty) => { const p = G.p, prev = new Map([[p.x + ',' + p.y, null]]), q = [[p.x, p.y]]; let end = null;
    for (let h = 0; h < q.length; h++) { const [x, y] = q[h]; if (x == tx && y == ty) { end = x + ',' + y; break; } for (const [a, b] of DIRS8) { const nx = x + a, ny = y + b, k = nx + ',' + ny; if (prev.has(k) || !diagOK(x, y, a, b) || !pass(nx, ny, nx == tx && ny == ty)) continue; prev.set(k, x + ',' + y); q.push([nx, ny]); } }
    if (!end) return null; const path = []; let k = end; while (k && prev.get(k) !== null) { path.unshift(k.split(',').map(Number)); k = prev.get(k); } return path; };
  const closedGates = () => (G.gim || []).filter(g => !gOpen(g) && ['vine', 'crack', 'volt', 'brazier', 'boulder', 'plate', 'levers'].includes(g.type));
  // ---- 物差し ----
  const hostile = f => f.hp > 0 && !f.ally && !(f.charm > 0) && !f.dormant && f.alpha !== 0;
  const near = (f, r) => cd(f.x, f.y, G.p.x, G.p.y) <= r;
  const worth = q => { const d = ITEM[q.id] || {}; return 3 + (d.weapon ? 10 : 0) + (d.food ? 4 : 0) + (q.id == 'potion' ? 8 : q.id == 'bigpot' ? 14 : 0) + Math.min(20, (d.tre || d.val || 0) * .15); };
  // 今は脅威が小さい相手：眠っている・満腹・争っている・化けて素通り・卵で手出しできない・怯えている
  S.calmF = f => { try { if (f.mhSleep || f.ecoNap || f.cowed || (f.eggChase && eggOf(f) >= 0)) return .1; if (typeof guised == 'function' && guised(f)) return .15; if (f.stun > 0) return .3; if (feudOf(f)) return .3; if (f.sated > 0) return .5; if (f.conf > 0 || f.fear > 0 || f.blind > 0) return .6; } catch (e) {} return 1; };
  S.stat = () => {
    const p = G.p; const fs = G.foes.filter(f => near(f, 9));
    return {
      hp: p.hp, max: p.max, dead: !!(G.simDead || (G.over && p.hp <= 0)),
      foeHp: fs.filter(hostile).reduce((s, f) => s + Math.max(0, f.hp), 0),
      threat: fs.filter(f => hostile(f) && (f.aware || G.fight) && near(f, 6)).reduce((s, f) => s + (f.atk || 2) * S.calmF(f), 0),
      alive: fs.filter(f => f.hp > 0 && !f.ally).length,
      calm: fs.filter(f => f.hp > 0 && (f.charm > 0 || f.ally)).length + (G.sparedN || 0),
      seen: fs.filter(f => f.hp > 0 && f.aware).length,
      bag: G.bag.items.reduce((s, q) => s + worth(q), 0),
      allies: G.allies.reduce((s, a) => s + Math.max(0, a.hp), 0),
      map: G.seen.size, fi: G.fi, gates: (G.gim || []).filter(g => gOpen(g)).length, reach: S.stuck ? S.reach().size : 0,
    };
  };
  // 手を打って何か変わったか（何も起きない手は、手として数えない）
  S.sig = () => [G.ttN, G.steps, G.fi, G.p.x, G.p.y, G.p.hp, G.bag.items.length, G.items.length, G.foes.map(f => f.x + ',' + f.y + ',' + f.hp + ',' + (f.aware | 0) + ',' + (f.stun | 0) + ',' + (f.charm | 0)).join(';'), (G.fires || []).length, (G.gim || []).filter(g => g.open).length, (G.fight ? G.fight.dist + ',' + G.fight.foes.length : '-'), G.allies.length, (G.anchors || []).length, (G.snares || G.traps || []).length, G.guise ? G.guise.id : '', (G.planks || []).length, (G.spores || []).length].join('|');
  S.score = (a, b) => {
    const L = (STYLES[S.style] || {}).like || {};
    if (b.dead) return -2000;
    if (b.fi > a.fi) return 300;
    const kills = Math.max(0, a.alive - b.alive - (b.calm - a.calm));
    let s = (b.hp - a.hp) * 6 + (a.foeHp - b.foeHp) * 1.5 + kills * (30 + (L.kill || 0)) - (b.threat - a.threat) * 8
      + (b.calm - a.calm) * (25 + (L.calm || 0)) + (b.bag - a.bag) + (b.allies - a.allies) * 1.5 + (b.seen - a.seen) * (L.seen || 0) + Math.min(30, (b.map - a.map) * .25);
    if (b.hp < b.max * .3) s -= (b.max * .3 - b.hp) * 4;
    s += (b.gates - a.gates) * 80 + (b.reach - a.reach) * .5;
    return s;
  };

  // ---- 打てる手を全部挙げる ----
  const NOUSE = new Set(['kikan', 'omamori', 'balloon']);
  S.cands = () => {
    const p = G.p, its = G.bag.items, out = [];
    const seenId = new Set();
    if (G.fight) {
      const tg = tgtFoe();
      if (alive().some(f => f.broken)) out.push({ k: 'deathblow', lab: '忍殺' });
      its.forEach((q, i) => { const d = ITEM[q.id] || {}; if (seenId.has(q.id)) return; seenId.add(q.id); if (q.out || NOUSE.has(q.id)) return; if (d.weapon && !reachOK(q.id)) return; out.push({ k: 'act:' + (d.weapon ? 'w' : 'i') + ':' + q.id, i, lab: (d.weapon ? '振る:' : '戦闘で使う:') + d.n }); });
      if (tg && cd(p.x, p.y, tg.x, tg.y) <= 1 && !(G.fight.webbed > 0)) out.push({ k: 'kick', lab: '蹴る' });
      if (!its.some(q => ITEM[q.id].weapon)) out.push({ k: 'bare', lab: '素手' });
      const sp = tg && SPARE[tg.k]; if (tg && (KNOW['mercy_' + tg.k] || likeIdx(tg) >= 0 || (sp && (sp.free || (sp.need && its.some(q => sp.need.includes(q.id))))))) out.push({ k: 'spare', lab: 'なだめる' });
      if (!isBoss()) out.push({ k: 'flee', lab: '離れる・逃げる' });
      if (alive().some(f => f.broken)) out.push({ k: 'threaten', lab: '脅す' });
      if (tg && KIN[kinOf(tg)] && KIN[kinOf(tg)].talk && !tg.hitByMe && its.some(q => q.id == 'oldcoin' || q.id == 'pcoin' || (ITEM[q.id] || {}).tre)) { out.push({ k: 'trade:0', lab: '取引:払う/交換' }); }
      if (G.fight.webbed > 0) out.push({ k: 'struggle', lab: 'もがく' });
    } else {
      DIRS8.forEach(([dx, dy]) => { const x = p.x + dx, y = p.y + dy; if (walk(x, y) && !isPit(x, y) && !lethalTile(x, y)) out.push({ k: 'step', dx, dy, lab: '歩く' }); });
      out.push({ k: 'wait', lab: '待つ' });
      out.push({ k: 'explore', lab: '先へ進む' });
      if (G.foes.some(f => hostile(f) && f.aware && near(f, 7))) out.push({ k: 'engage', lab: '敵へ寄る' });
      if (S.stuck && closedGates().length) out.push({ k: 'togate', lab: '仕掛けへ近づく' });
      try { const m = mainAction(); if (m && m.f && !/脱出|上がる|飛び降り|戻れない|溶岩/.test(m.t + (m.sub || ''))) out.push({ k: 'main:' + m.t, lab: m.t }); } catch (e) {}
      const foes = G.foes.filter(f => f.hp > 0 && !f.ally && near(f, AIMR) && G.seen.has(f.x + ',' + f.y));
      its.forEach((q, i) => {
        const d = ITEM[q.id] || {}; if (seenId.has(q.id) || NOUSE.has(q.id) || d.mon && !foes.length) return; seenId.add(q.id);
        if (!d.weapon && !(d.food && p.hp >= p.max) && !((q.id == 'potion' || q.id == 'bigpot') && p.hp >= p.max - 4)) out.push({ k: 'use:' + q.id, i, lab: '使う:' + d.n });
        if (d.weapon || d.mon) return;
        // 投げる先：敵そのもの、敵のそばの壺、敵のそばの水・油・草
        const tg = []; foes.slice(0, 3).forEach(f => { tg.push([f.x, f.y]); (G.pots || []).forEach(o => { if (cd(o.x, o.y, f.x, f.y) <= 1) tg.push([o.x, o.y]); }); });
        if (S.stuck) closedGates().forEach(g => { if (cd(g.x, g.y, p.x, p.y) <= AIMR) tg.push([g.x, g.y]); });
        const seenT = new Set(); tg.forEach(([x, y]) => { const kk = x + ',' + y; if (seenT.has(kk) || seenT.size >= 3) return; seenT.add(kk); try { if (aimOK(x, y)) out.push({ k: 'throw:' + q.id, i, x, y, lab: '投げる:' + d.n }); } catch (e) {} });
      });
    }
    const ban = (STYLES[S.style] || {}).ban; return ban ? out.filter(c => !ban.test(c.k)) : out;
  };
  const lethalTile = (x, y) => { try { return (G.lava && G.lava.has(x + ',' + y)) || (G.fires || []).some(q => q.x == x && q.y == y); } catch (e) { return false; } };

  // ---- 手を打つ ----
  S.exec = async c => {
    const k = c.k;
    if (k == 'engage') { if (!engage()) doWait(); }
    else if (k == 'explore') { await S.explore(); }
    else if (k == 'togate') { const p = G.p; const g = closedGates().sort((u, v) => cd(u.x, u.y, p.x, p.y) - cd(v.x, v.y, p.x, p.y))[0]; const r = g && trvRoute(g.x, g.y, true); if (r && r.length) step(r[0][0] - p.x, r[0][1] - p.y); else doWait(); }
    else if (k == 'step') step(c.dx, c.dy);
    else if (k == 'wait') doWait();
    else if (k.startsWith('main:')) { const m = mainAction(); if (m && m.f) m.f(); }
    else if (k.startsWith('use:')) slotUse(c.i);
    else if (k.startsWith('throw:')) throwAt(c.i, c.x, c.y);
    else if (k.startsWith('act:')) act(c.i);
    else if (k == 'kick') kick();
    else if (k == 'bare') bareHand();
    else if (k == 'spare') spare();
    else if (k == 'flee') flee(false);
    else if (k == 'deathblow') deathblow();
    else if (k == 'threaten') threaten();
    else if (k.startsWith('trade')) { tradeWith(); const b = [...document.querySelectorAll('#evb button')][0]; if (b) b.click(); }
    else if (k == 'struggle') { const b = [...$('frow').querySelectorAll('button')].find(b => /もがく/.test(b.textContent)); if (b) b.click(); }
    await S.settle();
  };
  // 一番近い、気づいている敵へ一歩寄る
  const engage = () => { const p = G.p; const f = G.foes.filter(f => hostile(f) && f.aware && near(f, 7) && G.seen.has(f.x + ',' + f.y)).sort((u, v) => cd(u.x, u.y, p.x, p.y) - cd(v.x, v.y, p.x, p.y))[0]; if (!f) return false; const r = trvRoute(f.x, f.y, true); if (r && r.length) { step(r[0][0] - p.x, r[0][1] - p.y); return true; } if (r && !r.length) { step(Math.sign(f.x - p.x), Math.sign(f.y - p.y)); return true; } return false; };
  // 試したあとに続ける、ありふれた手（武器で殴る／待つ）
  S.plain = async () => {
    if (G.over) return;
    if (G.fight) {
      if (alive().some(f => f.broken)) { deathblow(); return S.settle(); }
      const ws = G.bag.items.map((q, i) => [q, i]).filter(([q]) => ITEM[q.id].weapon && !q.out && reachOK(q.id));
      if (ws.length) { ws.sort((a, b) => (parseInt(ITEM[b[0].id].d) || 0) - (parseInt(ITEM[a[0].id].d) || 0)); act(ws[0][1]); }
      else bareHand();
    } else if (!engage()) doWait();
    await S.settle();
  };

  // 同じ「運」で比べるための乱数（候補ごとに同じ目を振る）
  const _rand = Math.random;
  const seeded = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let x = Math.imul(s ^ s >>> 15, 1 | s); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  // ---- 一つの手を、複製した世界で試す ----
  S.trial = async (c, seed) => {
    const t0 = VT.realNow(); const keep = save(); const vt0 = VT.now; const q0 = VT.q.slice();
    const a = S.stat(); let sc = -1e9;
    try {
      G = structuredClone(keep.G); DEF = null; simOn(); Math.random = seeded(seed || 1);
      const sig0 = S.sig(); await S.exec(c);
      if (S.sig() === sig0) { S.log.noop = S.log.noop || {}; S.log.noop[c.lab] = (S.log.noop[c.lab] || 0) + 1; throw { noop: 1 }; }
      const ban = (STYLES[S.style] || {}).ban;
      for (let h = 0; h < (G.fight ? S.H : S.H + 1) && !G.over; h++) { if (ban && G.fight && ban.test('act:w')) { await S.exec({ k: G.bag.items.some(q => ITEM[q.id].weapon) ? 'flee' : 'bare' }); } else await S.plain(); }
      sc = S.score(a, S.stat());
    } catch (e) { if (!e || !e.noop) (S.log.err = S.log.err || []).push(String(e && e.message)); }
    finally { Math.random = _rand; DEF = null; simOff(); restore(keep); VT.q = q0; VT.now = vt0; const m = $('modal'); if (m && m.innerHTML && !keep.modal) m.innerHTML = ''; }
    S.log.sims++; S.log.simMs += VT.realNow() - t0; return sc;
  };

  // ---- 決める ----
  // 先読みする場面：戦闘中、気づいている敵が見えている、気づかれる前の敵に手を出せる（同じ敵には時々だけ）、仕掛けで詰まっている
  S.tactical = () => {
    if (G.fight) return true;
    const vis = G.foes.filter(f => f.hp > 0 && !f.ally && !(f.charm > 0) && near(f, 6) && G.seen.has(f.x + ',' + f.y) && losClear(G.p.x, G.p.y, f.x, f.y));
    S.ign = S.ign || {}; const st0 = G.steps || 0; const fid = f => (f.id || f.k) + '';
    const aw = vis.filter(f => f.aware && !f.dormant && !(S.ign[fid(f)] > st0));
    if (aw.length) { const key = aw.map(fid).sort().join(',') + '@' + G.p.hp + '@' + aw.reduce((s, f) => s + f.hp, 0); S.tk = S.tk && S.tk.key === key ? { key, n: S.tk.n + 1 } : { key, n: 1 }; if (S.tk.n > 15) { aw.forEach(f => S.ign[fid(f)] = st0 + 40); return false; } return true; }
    const st = G.steps || 0; S.opp = S.opp || {};
    const o = vis.find(f => near(f, 4) && !(S.opp[f.id || f.k + f.x] > st));
    if (o) { S.opp[o.id || o.k + o.x] = st + 12; return true; }
    return !!S.stuck;
  };
  S.decide = async () => {
    const cs = S.cands(); if (!cs.length) return null;
    const res = []; const seeds = [1, 2].map(() => 1 + Math.floor(_rand() * 1e9));
    const bonus = c => c.k == 'explore' ? 4 : 0;
    for (const c of cs) { let s = 0; for (const sd of seeds) s += await S.trial(c, sd); res.push([c, s / seeds.length + bonus(c)]); }
    res.sort((x, y) => y[1] - x[1]);
    // 上位は別の運でも試し直す
    const top = res.slice(0, 4); const more = [1, 2, 3].map(() => 1 + Math.floor(_rand() * 1e9));
    for (const r of top) { let s = r[1] * 2; for (const sd of more) s += await S.trial(r[0], sd) + bonus(r[0]); r[1] = s / 5; }
    top.sort((x, y) => y[1] - x[1]);
    const best = top[0]; const ok = res.filter(r => r[1] > -1e8); const base = ok.filter(r => r[0].k == 'wait' || r[0].k.startsWith('act:w') || r[0].k == 'bare').sort((x, y) => y[1] - x[1])[0] || ok[ok.length - 1] || best;
    S.log.decisions++;
    const grp = c => c.k.replace(/:[^:]*$/, '') + ':' + c.lab;
    new Set(cs.map(grp)).forEach(g => S.log.avail[g] = (S.log.avail[g] || 0) + 1);
    const g = grp(best[0]); S.log.pick[g] = (S.log.pick[g] || 0) + 1; S.log.gain[g] = (S.log.gain[g] || 0) + (best[1] - base[1]);
    S.last = res.slice(0, 5).map(r => r[0].lab + ' ' + Math.round(r[1]));
    return best[0];
  };
  // ---- 探索（敵が近くにいない間）：拾う、見ていない所へ、階段へ ----
  S.explore = async () => {
    const p = G.p, its = G.bag.items, hpR = p.hp / p.max;
    const heal = its.findIndex(q => q.id == 'potion' || q.id == 'bigpot' || (ITEM[q.id] || {}).food);
    if (hpR < .45 && heal >= 0) { slotUse(heal); return 'heal'; }
    const goHome = G.exit && (hpR < .25 || (bagUsed() >= bagCap() - 1 && G.fi >= 2));
    if (G.obsF !== G.fi) { S.stuck = false; S.stuckN = 0; G.obsTgt = null; G.obsF = G.fi; G.obsBad = new Set(); G.obsSkip = new Set(); G.obsT = 0; G.obsN = 0; }
    try {
      const m = mainAction();
      if (m && m.f && !/叩き壊す|溶岩|上がる/.test(m.t + (m.sub || '')) && !(/飛び降り/.test(m.t) && !(G.obsN > 200 || S.stuck)) && (!/脱出/.test(m.t) || goHome) && !(m.t == '拾う' && G.items.filter(i => i.x == p.x && i.y == p.y).every(i => G.obsSkip.has(i.x + ',' + i.y + ',' + i.id)))) {
        const down = G.down && p.x == G.down[0] && p.y == G.down[1];
        if (m.t == '釣る') { G.obsFish = (G.obsFish || 0) + 1; if (G.obsFish > 6) m.f = null; }
        const sig = m.t + '@' + p.x + ',' + p.y + '@' + G.fi; G.obsRep = G.obsRep && G.obsRep.sig == sig ? { sig, n: G.obsRep.n + 1 } : { sig, n: 1 };
        if (G.obsRep.n > 3) { (G.obsMute = G.obsMute || {})[sig] = (G.steps || 0) + 15; }
        const muted = G.obsMute && G.obsMute[sig] > (G.steps || 0);
        if (m.f && !muted && (!down || G.obsT > 90 || G.obsN > 170 || !frontier())) { if (m.t == '拾う') G.items.filter(i => i.x == p.x && i.y == p.y).forEach(i => G.obsSkip.add(i.x + ',' + i.y + ',' + i.id)); m.f(); G.obsT = 0; return 'main:' + m.t; }
      }
    } catch (e) {}
    G.obsT++; G.obsN = (G.obsN || 0) + 1; G.obsBad.add(p.x + ',' + p.y);
    const late = G.obsN > 170;
    let tgt = null;
    if (goHome) tgt = G.exit;
    if (!tgt) { const it = G.items.filter(i => !i.hid && !G.obsSkip.has(i.x + ',' + i.y + ',' + i.id) && G.seen.has(i.x + ',' + i.y) && !(i.x == p.x && i.y == p.y)).sort((a, b) => cd(a.x, a.y, p.x, p.y) - cd(b.x, b.y, p.x, p.y))[0]; if (it && cd(it.x, it.y, p.x, p.y) <= 10 && G.obsT < 120) tgt = [it.x, it.y]; }
    if (!tgt && late && G.down && S.route(G.down[0], G.down[1])) tgt = G.down;
    if (G.obsTgt) { const k = G.obsTgt.join(','); G.obsTN = G.obsTK === k ? (G.obsTN || 0) + 1 : 1; G.obsTK = k; if (G.obsTN > 30) { G.obsBad.add(k); G.obsTgt = null; } }
    if (!tgt && G.obsTgt && !G.obsBad.has(G.obsTgt.join(',')) && !(G.obsTgt[0] == p.x && G.obsTgt[1] == p.y)) tgt = G.obsTgt;
    if (!tgt && G.obsT < 140) tgt = G.obsTgt = frontier();
    if (!tgt && G.down && S.route(G.down[0], G.down[1])) tgt = G.down;
    if (!tgt) { tgt = frontier(); if (!tgt && G.down && !S.route(G.down[0], G.down[1])) { if (++S.noRoute > 15) { S.stuck = true; S.noRoute = 0; return 'stuck'; } doWait(); return 'noroute'; } if (tgt) S.noRoute = 0; tgt = tgt || G.down || G.exit; }
    if (tgt) {
      const bump = trvBump(tgt[0], tgt[1]); const r = bump ? trvRoute(tgt[0], tgt[1], true) : S.route(tgt[0], tgt[1]);
      if (r && r.length) {
        const here = p.x + ',' + p.y + '@' + (G.steps || 0);
        if (G.obsLast === here) { // 歩いたのに動けなかった：記録して、その先を避ける
          const [x, y] = r[0]; const d = { x, y, walk: walk(x, y), foe: (foeAt(x, y) || {}).k, pot: !!(potAt && potAt(x, y)), gim: (gimAt(x, y) || {}).type, anchor: (G.anchors || []).some(q => q[0] == x && q[1] == y), title: !!G.title, mudT: G.mudT, stuck: G.stuck, busy: G.busy, sheet: G.sheet, tray: !!G.tray, fight: !!G.fight, modal: ($('modal').innerHTML || '').length, map: G.map, fish: !!G.fishing };
          (S.log.blocked = S.log.blocked || []).length < 12 && S.log.blocked.push(d);
          G.obsBad.add(tgt[0] + ',' + tgt[1]); G.obsLast = null;
        } else { G.obsLast = here; step(r[0][0] - p.x, r[0][1] - p.y); return 'walk'; }
      }
      if (r && !r.length && trvBump(tgt[0], tgt[1])) { step(Math.sign(tgt[0] - p.x), Math.sign(tgt[1] - p.y)); return 'bump'; }
      G.items.filter(i => i.x == tgt[0] && i.y == tgt[1]).forEach(i => G.obsSkip.add(i.x + ',' + i.y + ',' + i.id));
      G.obsBad.add(tgt[0] + ',' + tgt[1]);
      const g = DIRS8.filter(([a, b]) => walk(p.x + a, p.y + b) && !isPit(p.x + a, p.y + b) && !lethalTile(p.x + a, p.y + b)).sort((u, v) => cd(p.x + u[0], p.y + u[1], tgt[0], tgt[1]) - cd(p.x + v[0], p.y + v[1], tgt[0], tgt[1]))[0];
      if (g && Math.random() < .8) { step(g[0], g[1]); return 'greedy'; }
    }
    const d = DIRS8[Math.floor(Math.random() * 8)]; step(d[0], d[1]); return 'wander';
    function frontier() {
      let best = null, bd = 1e9; const R = S.reach();
      for (const k of R) {
        if (G.obsBad.has(k)) continue; const [x, y] = k.split(',').map(Number); if (!walk(x, y) || isPit(x, y)) continue;
        if (!DIRS.some(([a, b]) => !G.seen.has((x + a) + ',' + (y + b)) && G.m[y + b] && G.m[y + b][x + a] !== undefined)) continue;
        const dd = cd(x, y, p.x, p.y); if (dd > 0 && dd < bd) { bd = dd; best = [x, y]; }
      }
      return best;
    }
  };

  // ---- 1手 ----
  S.turn = async () => {
    const ret = $('ret'); if (ret) { ret.click(); await VT.run(300); return 'ret'; }
    const modal = $('modal');
    if (modal && modal.innerHTML) {
      const BAD = /消去|リセット|初期化|全部消す|削除|協力|ホスト|参加|コピー|貼り付け|護符|帰還の|名前/;
      const bs = [...modal.querySelectorAll('button')].filter(b => !b.disabled && b.offsetParent && !b.classList.contains('xbtn') && b.textContent.trim() && !BAD.test(b.textContent));
      const pref = bs.find(b => /^(同じ構成ですぐ潜る|潜る|準備して潜る|探索の続きから)/.test(b.textContent.trim()))
        || bs.find(b => /降りる|入れる|持っていく|連れていく|拾う|進む|はい|開ける|受け取る|取引しない|話す|ついていく/.test(b.textContent))
        || bs.find(b => !b.classList.contains('sub') && !/閉じる|やめる|戻る|しない|捨て|置いて/.test(b.textContent))
        || bs.find(b => /閉じる|やめる|戻る|しない/.test(b.textContent)) || bs[0];
      modal.querySelectorAll('input').forEach(i => { if (!i.value) i.value = 'テスト'; });
      if (pref) { pref.click(); await VT.run(300); return 'modal'; }
      modal.innerHTML = ''; return 'modal-stuck';
    }
    if (typeof G === 'undefined' || !G) { await VT.run(300); return 'noG'; }
    if (G.over) { await VT.run(300); return 'over'; }
    if ((G.sheet && G.sheet != 'closed') || G.tray) { if (G.tray) { const f = firstFit(G.tray.id); if (f) { G.bag.items.push({ ...carry(G.tray), id: G.tray.id, ...f }); G.tray = null; } else { G.obsSkip && G.obsSkip.add(G.p.x + ',' + G.p.y + ',' + G.tray.id); dropToFloor(G.tray, -1); } } closeSheet(); await VT.run(200); return 'sheet'; }
    if (G.busy || DEF || G.fishing) { if (G.fishing) try { fishInput(); } catch (e) {} await S.settle(); return 'busy'; }
    let tag; if (S.stuck && ++S.stuckT > 8) { S.stuck = false; S.stuckT = 0; S.stuckN = (S.stuckN || 0) + 1; }
    // 進み具合：階・見た広さ・敵の数・開いた仕掛け・持ち物。長く変わらなければ、考え込むのをやめる
    const prog = [G.fi, G.seen.size, G.foes.filter(f => f.hp > 0).length, (G.gim || []).filter(g => g.open).length, G.bag.items.length, G.p.hp].join('|');
    if (prog !== S.progK) { S.progK = prog; S.progT = 0; S.calmT = 0; } else S.progT = (S.progT || 0) + 1;
    if (S.progT == 60) S.calmT = 30;
    if (S.progT > 150) S.stuckN = 99;
    if (S.floorK !== G.fi) { S.floorK = G.fi; S.floorT = 0; } if (++S.floorT > 350) { S.stuckN = 99; S.floorT = 0; S.progT = 151; }
    if (S.stuckN > 5 && G.down) { // 解けない仕掛けで詰まった：記録して、次の階へ送る（ボットの限界として数える）
      (S.log.skipped = S.log.skipped || []).push({ fi: G.fi + 1, gates: closedGates().map(g => g.type).join(','), why: S.progT > 150 ? '進まない' : '詰まり' }); S.stuckN = 0; S.stuck = false; S.progT = 0;
      try { goDown(); } catch (e) {} await S.settle(); return 'skip-floor';
    }
    if (S.calmT > 0) S.calmT--;
    if (S.tactical() && !(S.calmT > 0 && !G.fight)) { const c = await S.decide(); if (c) { await S.exec(c); tag = 'T:' + c.lab; } else { doWait(); tag = 'T:none'; } }
    else tag = 'E:' + await S.explore();
    await S.settle();
    return tag;
  };
})();

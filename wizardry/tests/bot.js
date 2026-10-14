// 深淵の迷宮：自動で最後まで遊ぶボット（バランス確認とエラー探し）
//   node wizardry/tests/bot.js [回数=3] [上限の手数=60000]
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const RUNS = +(process.argv[2] || 3), MAX = +(process.argv[3] || 60000);
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');

// ページの中で動く「遊び手」
async function botRun(MAX) {
  const A = window.__abyss; A.setSpeed(0);
  const ch = new MessageChannel(); let wake = null; ch.port1.onmessage = () => wake && wake();
  const tick = () => new Promise(r => { wake = r; ch.port2.postMessage(0) });
  const S = window.__botS || (window.__botS = { wipes: 0, battles: 0, maxFloor: 0, trips: 0, steps: 0, won: false, stuck: 0, levels: [], log: [], st: {} });
  const ST = S.st;
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], N = 21;
  const lastMsg = () => { const m = document.querySelector('#msg'); return m.lastElementChild ? m.lastElementChild.textContent : '' };
  let { plan = null, townStage = 0, retreat = false, battleTag = '', lastMode = '', idleRepeat = 0, lastPos = '' } = ST;
  const party = () => A.G.party;
  const alive = p => p.hp > 0;
  const choose = (ms, re) => { const i = ms.opts.findIndex(o => !o.dis && re.test(o.l)); if (i >= 0) { A.choose(i); return true } return false };
  const chooseIdx = (ms, i) => A.choose(i);
  function bfsFrom(M, sx, sy) {
    const d = new Int16Array(N * N).fill(-1), q = [[sx, sy]]; d[sy * N + sx] = 0; let h = 0;
    while (h < q.length) { const [x, y] = q[h++]; for (let k = 0; k < 4; k++) { const nx = x + DX[k], ny = y + DY[k]; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const t = M.mm[ny * N + nx]; if (t === 1 || d[ny * N + nx] >= 0) continue; d[ny * N + nx] = d[y * N + x] + 1; q.push([nx, ny]) } }
    return d;
  }
  let goal = [-1, -1];
  function stepToward(M, tx, ty) {
    goal = [tx, ty];
    const d = bfsFrom(M, tx, ty); const G = A.G; let best = -1, bd = 1e9;
    for (let k = 0; k < 4; k++) { const nx = G.x + DX[k], ny = G.y + DY[k]; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const v = d[ny * N + nx]; if (v >= 0 && v < bd) { bd = v; best = k } }
    if (best < 0) return null;
    if (best === G.f) return 'w'; if (best === (G.f + 1) % 4) return 'd'; if (best === (G.f + 3) % 4) return 'a'; return 'd';
  }
  for (let step = 0; step < MAX; step++) {
    await tick();
    const G = A.G, mode = A.mode;
    if (mode !== lastMode) { if (mode === 'battle') S.battles++; if (mode === 'town' && lastMode && lastMode !== 'boot') S.trips++; lastMode = mode }
    if (G && G.floor > S.maxFloor) S.maxFloor = G.floor;
    if (mode === 'end') { S.won = true; break }
    if (document.querySelector('#overlay.on')) { const b = document.querySelector('#goBtn'); if (b) b.click(); else document.querySelector('#overlay').click(); continue }
    const ms = A.menuState(); if (!ms) continue;
    const t = ms.title;
    if (mode === 'dead') { S.wipes++; S.log.push('wipe@B' + S.maxFloor + ' lv' + party().map(p => p.lv).join('/')); if (!choose(ms, /最後の記録/)) choose(ms, /はじめから/); townStage = 0; retreat = false; continue }
    if (mode === 'town') {
      if (t === '城塞都市リルガ') {
        retreat = false;
        const P = party(); const inn = P.filter(alive).reduce((s, p) => s + p.lv * 6, 0);
        if (townStage === 0) { townStage = 1; if (P.some(p => !alive(p) || p.poison)) { if (choose(ms, /寺院/)) continue } }
        if (townStage === 1) { townStage = 2; const need = P.some(p => alive(p) && (p.hp < p.mhp || p.mp < p.mmp || p.xp >= Math.floor(28 * Math.pow(p.lv, 1.8)))); if (need && G.gold >= inn) { if (choose(ms, /宿屋/)) continue } if (need && choose(ms, /馬小屋/)) continue }
        if (townStage === 2) { townStage = 3; if (choose(ms, /鍛冶屋/)) continue }
        if (townStage === 3) { townStage = 4; if (choose(ms, /道具屋/)) continue }
        townStage = 0; S.levels.push(P.map(p => p.lv).join('/')); choose(ms, /迷宮へ/); continue;
      }
      if (/^寺院/.test(t)) { if (!chooseIdx(ms, 0)) A.back(); else continue; continue }
      if (/^鍛冶屋/.test(t)) {
        const P = party(); let pickI = -1, cost = 1e9;
        P.forEach((p, i) => { const wc = 60 * (p.w + 1) ** 2, ac = 45 * (p.a + 1) ** 2; if (i < 2 && p.w < 5 && wc < cost) { cost = wc; pickI = i } if (p.a < 5 && ac < cost) { cost = ac; pickI = i } });
        if (pickI >= 0 && G.gold - cost >= 80) { plan = pickI; chooseIdx(ms, pickI) } else A.back(); continue;
      }
      if (/の装備/.test(t)) { const p = party()[plan]; const wc = 60 * (p.w + 1) ** 2, ac = 45 * (p.a + 1) ** 2; if (plan < 2 && p.w < 5 && wc <= ac && G.gold - wc >= 80) { if (!choose(ms, /武器/)) A.back() } else if (p.a < 5 && G.gold - ac >= 80) { if (!choose(ms, /鎧/)) A.back() } else A.back(); continue }
      if (/^道具屋/.test(t)) {
        const n = k => G.bag.filter(x => x === k).length;
        if (n('傷薬') < 3 && G.gold >= 60 && choose(ms, /傷薬/)) continue;
        if (n('帰還の巻物') < 1 && G.gold >= 180 && choose(ms, /帰還/)) continue;
        if (n('たいまつ') < 1 && G.gold >= 60 && choose(ms, /たいまつ/)) continue;
        A.back(); continue;
      }
      if (ms.back) A.back(); else chooseIdx(ms, 0); continue;
    }
    if (mode === 'battle') {
      const P = party();
      const m = /^(.+)は どうする？$/.exec(t);
      if (m) {
        const i = P.findIndex(p => p.n === m[1]); const p = P[i];
        const hurt = P.map((q, j) => ({ q, j })).filter(o => alive(o.q)).sort((a, b) => a.q.hp / a.q.mhp - b.q.hp / b.q.mhp)[0];
        const nEnemies = A.B ? A.B.groups.reduce((s, g) => s + g.list.filter(e => e.hp > 0).length, 0) : 1;
        if (ST.fb === p.n + ':' + A.G.steps) { choose(ms, /守る/); continue }
        battleTag = '';
        if (p.c === '僧侶' && hurt && hurt.q.hp / hurt.q.mhp < .45 && p.mp >= 2) { battleTag = (p.lv >= 5 && p.mp >= 6 ? 'マディ' : 'ディオス') + '>' + hurt.j; if (choose(ms, /呪文/)) continue }
        if (p.c === '魔法使い' && p.mp >= 2) {
          const sp = p.lv >= 6 && p.mp >= 9 && nEnemies >= 3 ? 'ラハリト' : p.lv >= 3 && p.mp >= 5 && nEnemies >= 2 ? 'マハリト' : nEnemies >= 3 && p.mp >= 3 && A.G.floor <= 2 ? 'カティノ' : 'ハリト';
          battleTag = sp; if (choose(ms, /呪文/)) continue;
        }
        if (i < 2 && choose(ms, /たたかう/)) continue;
        // 後列：傷薬で手当て
        if (hurt && hurt.q.hp / hurt.q.mhp < .3 && G.bag.includes('傷薬')) { battleTag = 'item>' + hurt.j; if (choose(ms, /道具/)) continue }
        choose(ms, /守る/); continue;
      }
      if (/の呪文/.test(t)) { const sp = battleTag.split('>')[0]; if (!choose(ms, new RegExp('^' + sp + '$'))) { if (!choose(ms, /^ハリト$|^ディオス$/)) { ST.fb = t.split('の呪文')[0] + ':' + A.G.steps; A.back() } } continue }
      if (/^どの敵/.test(t)) { chooseIdx(ms, 0); continue }
      if (/^誰に/.test(t)) { const j = +(battleTag.split('>')[1] || 0); if (!chooseIdx(ms, j)) { const k = ms.opts.findIndex(o => !o.dis); if (k >= 0) chooseIdx(ms, k); else A.back() } continue }
      if (/^どれを使う/.test(t)) { if (!choose(ms, /傷薬/)) { const cur = A.G.party.find((p, i) => i === (window.__abyssActive || 0)); ST.fb = (document.querySelector('.pm.act div') || {}).textContent + ':' + A.G.steps; A.back() } continue }
      if (ms.back) A.back(); else chooseIdx(ms, 0); continue;
    }
    if (mode === 'chest') {
      const thief = party().findIndex(p => p.c === '盗賊' && alive(p));
      if (t === '宝箱') {
        if (thief < 0) { choose(ms, /立ち去る/); continue }
        if (!plan || plan.chest !== 'insp') { plan = { chest: 'insp' }; choose(ms, /調べる/); continue }
        const m = /……(.+) だと思う/.exec(lastMsg());
        if (m) { plan = { chest: 'dis', trap: m[1] }; choose(ms, /罠を外す/); continue }
        plan = null; choose(ms, /開ける/); continue;
      }
      if (/^誰が/.test(t)) { chooseIdx(ms, thief >= 0 ? thief : 0); continue }
      if (/^罠の名/.test(t)) { const tr = plan && plan.trap; plan = null; if (!choose(ms, new RegExp(tr || 'x'))) chooseIdx(ms, 0); continue }
      if (ms.back) A.back(); else chooseIdx(ms, 0); continue;
    }
    if (mode === 'dungeon') {
      const P = party(), M = A.getMap(G.floor);
      if (A.busy && ms.title === M.fl && false) continue;
      const hp = P.filter(alive).reduce((s, p) => s + p.hp, 0) / P.reduce((s, p) => s + p.mhp, 0);
      const pr = P.find(p => p.c === '僧侶');
      const inn = P.filter(alive).reduce((s, p) => s + p.lv * 6, 0);
      if (!retreat && G.gold >= inn && P.filter(alive).every(p => p.xp >= Math.floor(28 * Math.pow(p.lv, 1.8)))) retreat = true;
      if (G.amulet) retreat = true;
      const canRevive = P.filter(p => !alive(p)).reduce((s, p) => s + p.lv * 40, 0) <= G.gold;
      if (!retreat && ((P.some(p => !alive(p)) && canRevive) || hp < .35 || (hp < .55 && (!pr || !alive(pr) || pr.mp < 2)) || P.some(p => p.poison && !G.bag.includes('毒消し')))) retreat = true;
      if (/^下へ続く/.test(t)) { choose(ms, retreat ? /やめる/ : /下りる/); continue }
      if (/^地上の光|^上へ続く/.test(t)) { choose(ms, retreat ? /町へ戻る|上る/ : /やめる/); continue }
      if (/^冷たい水/.test(t)) { choose(ms, /飲んでみる/); continue }
      if (t === 'キャンプ') {
        if (plan && plan.camp === 'warp') { plan = { camp: 'warp2' }; if (!choose(ms, /道具/)) A.back(); continue }
        if (plan && plan.camp === 'heal') { plan = { camp: 'heal2', t: plan.t }; if (!choose(ms, /呪文/)) A.back(); continue }
        plan = null; A.back(); continue;
      }
      if (/^どれを使う/.test(t)) { if (!choose(ms, /帰還/)) A.back(); plan = null; continue }
      if (/^誰が唱える/.test(t)) { const k = P.findIndex(p => p.c === '僧侶'); if (!chooseIdx(ms, k)) A.back(); continue }
      if (/の呪文/.test(t)) { if (!choose(ms, /^マディ$/) && !choose(ms, /^ディオス$/)) A.back(); continue }
      if (/^誰に/.test(t)) { const j = plan && plan.t != null ? plan.t : 0; if (!chooseIdx(ms, j)) A.back(); plan = null; continue }
      // ふだんの移動
      if (A.busy) continue;
      const pos = G.floor + ',' + G.x + ',' + G.y + ',' + G.f; if (pos === lastPos) idleRepeat++; else idleRepeat = 0; lastPos = pos;
      if (idleRepeat > 60) { S.stuck++; idleRepeat = 0; A.inputMove(['a', 'd', 'w'][step % 3]); continue }
      // 歩きながら手当て
      const low = P.map((q, j) => ({ q, j })).filter(o => alive(o.q) && o.q.hp / o.q.mhp < .5).sort((a, b) => a.q.hp / a.q.mhp - b.q.hp / b.q.mhp)[0];
      if (low && pr && alive(pr) && pr.mp >= 2 && !A.busy) { plan = { camp: 'heal', t: low.j }; choose(ms, /キャンプ/); continue }
      if (retreat && G.bag.includes('帰還の巻物') && !A.busy) { plan = { camp: 'warp' }; choose(ms, /キャンプ/); continue }
      let target;
      if (retreat) target = M.up;
      else {
        const avg = P.reduce((s, p) => s + p.lv, 0) / 4; const need = (window.__NEED || [0, 2, 4, 6, 8, 11])[G.floor];
        const seen = G.seen[G.floor] || [];
        if (avg >= need) target = M.down;
        else {
          // まだ見ていない所へ
          goal = [-1, -1]; const d = bfsFrom(M, G.x, G.y); let best = null, bd = 1e9;
          for (let i = 0; i < N * N; i++) { if (d[i] > 0 && d[i] < bd && d[i] < 9999 && !seen[i] && M.mm[i] !== 1) { bd = d[i]; best = [i % N, i / N | 0] } }
          if (!best) { // 見尽くしたら魔物を探す
            const mo = M.mons.filter(m => m.alive && !m.boss).sort((a, b) => Math.abs(a.x - G.x) + Math.abs(a.y - G.y) - Math.abs(b.x - G.x) - Math.abs(b.y - G.y))[0];
            best = mo ? [mo.x, mo.y] : (avg >= need - 1 ? M.down : M.up);
          }
          target = best;
        }
      }
      const k = stepToward(M, target[0], target[1]);
      S.steps++;
      A.inputMove(k || ['w', 'a', 'w', 'd'][step % 4]);
      continue;
    }
    if (ms.back) A.back(); else chooseIdx(ms, 0);
  }
  Object.assign(ST, { plan, townStage, retreat, battleTag, lastMode, idleRepeat, lastPos });
  S.final = { msgs: [...document.querySelectorAll('#msg div')].map(d => d.textContent).join(' / '), B: A.B && A.B.groups.map(g => g.id + ':' + g.list.map(e => e.hp + (e.sleep ? 'z' : '')).join(',')).join(' '), party: party().map(p => p.hp + (p.sleep ? 'z' : '')).join(','), menu: A.menuState() && (A.menuState().title + ' | ' + A.menuState().opts.map(o => o.l + (o.dis ? '(x)' : '')).join(',')), busy: A.busy, floor: A.G.floor, amulet: A.G.amulet, lv: party().map(p => p.lv).join('/'), gold: A.G.gold, kills: A.G.kills, steps: A.G.steps, mode: A.mode };
  return S;
}

(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (let r = 0; r < RUNS; r++) {
    const pg = await b.newPage({ viewport: { width: 1000, height: 720 } });
    const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
    await pg.goto(FILE); await pg.waitForTimeout(600); if (process.env.NEED) await pg.evaluate(n => window.__NEED = n, JSON.parse(process.env.NEED));
    await pg.click('#bNew'); await pg.waitForTimeout(100); await pg.click('#goBtn'); await pg.waitForTimeout(100);
    const t0 = Date.now(); let S, done = 0;
    while (done < MAX) { S = await pg.evaluate(botRun, 4000); done += 4000; if (process.env.V) console.log('  ..', done, S.maxFloor, JSON.stringify(S.final)); if (S.won || Date.now() - t0 > 240000) break; }
    const F = S.final; console.log(`#${r + 1} ${S.won ? '★クリア' : '未クリア'} ${((Date.now() - t0) / 1000).toFixed(0)}秒 最深B${S.maxFloor} 全滅${S.wipes} 戦闘${S.battles} 帰還${S.trips} 詰まり${S.stuck}　Lv${F.lv} 倒した数${F.kills} 歩数${F.steps}`);
    if (!S.won) {
      const dbg = await pg.evaluate(() => { const A = __abyss, G = A.G, M = A.getMap(G.floor), N = 21, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
        const d = new Int16Array(N * N).fill(-1), q = [[G.x, G.y]]; d[G.y * N + G.x] = 0; let h = 0;
        while (h < q.length) { const [x, y] = q[h++]; for (let k = 0; k < 4; k++) { const nx = x + DX[k], ny = y + DY[k]; if (M.mm[ny * N + nx] === 1 || d[ny * N + nx] >= 0) continue; d[ny * N + nx] = d[y * N + x] + 1; q.push([nx, ny]) } }
        const rows = []; for (let y = 0; y < N; y++) { let r = ''; for (let x = 0; x < N; x++) { const t = M.mm[y * N + x]; const mo = M.mons.find(m => m.alive && m.x === x && m.y === y); r += x === G.x && y === G.y ? '@' : mo ? (mo.boss ? 'B' : 'm') : '#.D><$~xs!T'[t] } rows.push(r) }
        return { pos: [G.x, G.y, G.f], down: M.down, dist: d[M.down[1] * N + M.down[0]], map: rows } });
      console.log('   位置:', JSON.stringify({ pos: dbg.pos, down: dbg.down, dist: dbg.dist })); console.log(dbg.map.map(r => '     ' + r).join('\n'));
      console.log('   止まった所:', JSON.stringify({ mode: F.mode, busy: F.busy, menu: F.menu, B: F.B, party: F.party, msgs: F.msgs })); bad++ }
    console.log('   町に戻るたびのLv:', S.levels.slice(0, 40).join(' '), S.log.join(' '));
    if (errs.length) { bad++; console.log('   エラー:', errs.slice(0, 5)) }
    await pg.screenshot({ path: path.join(process.env.BOT_OUT || require('os').tmpdir(), `abyss-bot-${r + 1}.png`) });
    await pg.close();
  }
  await b.close();
  process.exit(bad ? 1 : 0);
})();

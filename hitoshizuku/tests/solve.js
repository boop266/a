// ひとしずく：場面の解き方ボット（各場面を、ちがう解き方で最後まで行けるか）
//   node tests/solve.js [場面id の一部]
// 台本：場面ごとに、いくつかの解き方。手順は「書く」「歩く」「待つ」
const path = require('path');
const { chromium } = require('playwright');
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?lab';

// w(k,x,y)=書く  go(x,y)=そこへ歩いて着くまで待つ  t(秒)=待つ  ok(式)=条件をたしかめる
const PLANS = {
  p1: {
    restore: `w('木',13,10); go(14,8); go(33,8);`,
    own: `go(11,10); w('木',12,9); go(14,8); go(33,8);`,
  },
  p2: {
    lines: `w('一',7,10); go(10,9); w('一',11,9); w('一',12,8); w('一',13,7); go(18,5); w('一',21,6); w('一',23,6); go(30,5); w('一',32,6); go(33,5); go(41,7);`,
  },
  p3: {
    forest: `combine('木','木'); combine('木','林'); w('森',15,10); go(18,8); w('一',30,9); go(31,8); go(45,8);`,
    lines: `w('一',10,11); w('一',11,10); w('一',12,9); w('一',13,8); w('一',15,8); go(19,8); w('一',30,9); go(45,8);`,
  },
  f1: {
    raft: `go(10,10); w('板',13,10); t(1); tapE('板', 1); t(2); go(19,10); w('日',30,1); go(55,10);`,
    push: `go(6,10); for (let i = 0; i < 5; i++) { tapE('板', 0); t(0.4); } t(1); tapE('板', 1); t(1); go(19,10); go(55,10);`,
    lines: `w('一',12,10); w('一',14,10); w('一',16,10); go(25,10); go(55,10);`,
  },
  f2: {
    rainbow: `go(12,11); combine('日','雨'); w('虹',20,12); go(41,11);`,
    lines: `go(14,11); w('一',16,12); w('一',19,12); w('一',22,12); w('一',25,12); go(41,11);`,
  },
  f3: {
    grove: `go(10,12); combine('木','木'); for (let x = 14; x <= 38; x += 4) { leeWalk('林', x); } go(45,12);`,
  },
  f4: {
    memory: `for (const x of [4,7,10,13,22]) w('花',x,11); t(6); w('母',17,10); t(6); go(36,11);`,
  },
  r1: {
    bridge: `go(12,11); w('橋',17,12); go(22,11); tapE('舟',1); go(40,11); go(51,11);`,
    lines: `go(13,11); w('一',14,12); w('一',16,12); w('一',19,12); go(22,11); w('一',26,12); w('一',28,12); w('一',30,12); tapE('舟',0); t(1); go(51,11);`,
    boat: `go(13,11); w('舟',15,12); t(1); tapE('舟',1); go(22,11); tapE('舟',1); go(40,11); go(51,11);`,
    swim: `go(13,11); combine('水','人'); w('泳',13,11); go(51,11);`,
  },
  r2: {
    cuke: `go(17,11); w('瓜',19,11); t(6); go(43,11);`,
    bow: `go(19,11); w('礼',19,11); t(1); go(43,11);`,
    over: `go(17,11); w('一',18,11); w('一',20,10); w('一',22,10); go(43,11);`,
    friend: `go(19,11); combine('人','人'); w('友',21,11); t(2); go(43,11);`,
  },
  r3: {
    dragon: `go(5,15); w('米',19,16); t(18); go(5,15); t(2); tapE('竜',0); t(1); HS.heroTap(28,3); t(8); go(33,3);`,
    lines: `go(5,15); for (let k = 0; k < 12; k++) w('一', 6 + k, 15 - k); go(19,3); go(33,3);`,
  },
  r4: {
    memory: `w('魚',11,10); w('魚',14,9); w('魚',16,10); w('橋',13,12); t(6); w('父',19,11); t(8); go(37,11);`,
  },
  m1: {
    tools: `go(7,20); w('梯',8,20); go(12,15); w('縄',17,11); go(19,10); w('蔦',26,8); go(30,5); go(39,5);`,
    bamboo: `go(7,20); w('竹',8,20); t(2); go(12,15); w('竹',17,15); t(2); go(20,10); w('竹',26,10); t(2); go(39,5);`,
  },
  m2: {
    honey: `go(16,11); w('蜜',21,11); t(8); go(49,11);`,
    bell: `go(12,11); w('鈴',12,11); go(49,11);`,
    decoy: `go(16,11); w('人',20,11); t(1); go(49,11);`,
  },
  m3: {
    bow: `go(16,10); w('礼',16,10); t(1); go(41,12);`,
    friend: `go(16,10); combine('人','人'); w('友',22,10); t(2); go(41,12);`,
  },
  m4: {
    memory: `w('竹',4,10); w('灯',11,11); w('木',20,11); w('花',8,11); t(6); w('師',17,11); t(8); go(35,11);`,
  },
  v1: {
    key: `go(16,11); w('鍵',19,10); t(1); go(43,11);`,
    over: `go(16,11); w('梯',18,11); w('縄',21,4); go(43,11);`,
  },
  v2: {
    fire: `go(12,10); w('橋',23,11); go(35,10); w('火',37,10); t(8); go(49,10);`,
    spring: `go(12,10); w('橋',23,11); go(36,10); combine('日','花'); w('春',36,5); t(10); go(49,11);`,
  },
  v3: {
    beans: `go(23,11); w('豆',26,11); t(8); go(45,9);`,
    sake: `go(22,11); w('酒',25,11); t(14); go(45,9);`,
    friend: `go(23,11); combine('人','人'); w('友',27,11); t(2); go(45,9);`,
  },
  v4: {
    memory: `w('犬',6,10); w('家',10,9); w('木',20,10); t(6); w('友',15,10); t(8); go(35,11);`,
  },
  n1: {
    moon: `w('月',10,3); w('一',15,12); go(18,11); w('一',29,12); go(37,11); w('一',38,11); w('一',40,11); go(49,11);`,
    glow: `combine('日','月'); w('明',1,11); w('一',15,12); go(18,11); w('一',29,12); go(37,11); w('一',38,11); w('一',40,11); go(49,11);`,
  },
  n2: {
    mirror: `go(20,11); w('鏡',22,11); t(2); go(45,11);`,
    sake: `go(20,11); w('酒',22,11); t(2); go(45,11);`,
    dog: `go(19,11); w('犬',21,11); t(3); go(45,11);`,
  },
  n3: {
    memory: `w('蛍',6,9); w('星',12,3); w('星',25,2); w('橋',13,12); t(6); w('別',19,11); t(8); go(37,11);`,
  },
  s1: {
    cloud: `go(9,12); t(0.5); go(46,8); go(51,8);`,
    crane: `w('魚',6,13); t(6); tapE('鶴',0); t(1); HS.heroTap(46,8); t(10); go(51,8);`,
  },
  s2: {
    ladder: `go(22,15); w('梯',23,15); go(29,9); w('梯',29,9); go(36,4); go(43,4);`,
    dragon: `w('玉',12,10); t(8); go(8,15); t(3); tapE('竜',0); t(1); HS.heroTap(36,4); t(10); go(43,4);`,
  },
  s3: {
    memory: `w('虹',9,6); w('鳥',17,5); w('竜',21,3); t(6); w('夢',13,11); t(8); go(37,11);`,
  },
};

(async () => {
  const only = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto(FILE); await p.waitForTimeout(800);
  // その場面までに「知りえる字」：前の場面の物・薄れたもの・贈り物・地形＋合わせ字（何度でも）
  await p.evaluate((FULLFLAG) => {
    const K = {}; const acc = new Set();
    const terr = { '~': '水', 'R': '岩', 's': '砂', 'I': '氷', 'S': '雪' };
    const closure = set => { let grew = true; while (grew) { grew = false; for (const r of HS.RECIPES) { if (!set.has(r.out) && r.parts.every(p => set.has(p))) { set.add(r.out); grew = true; } } } };
    HS.SCENES.forEach((sc, i) => {
      const cur = new Set(acc); for (const g of sc.gifts || []) cur.add(g); for (const g of sc.give || []) cur.add(g);
      closure(cur); K[sc.id] = [...cur];
      for (const e of sc.ents || []) if (HS.KDEF[e.k] && !HS.KDEF[e.k].hidden) acc.add(e.k);
      for (const f of sc.faded || []) acc.add(f.k);
      for (const g of (sc.gifts || []).concat(sc.give || [])) acc.add(g);
      for (const row of sc.map) for (const ch of row) if (terr[ch]) acc.add(terr[ch]);
    });
    window.KNOWN_BEFORE = K; window.FULL = !!FULLFLAG;
  }, !!process.env.FULL);
  let pass = 0, fail = 0;
  for (const [id, plans] of Object.entries(PLANS)) {
    if (only && !id.includes(only)) continue;
    for (const [pname, plan] of Object.entries(plans)) {
      const r = await p.evaluate(async ({ id, plan }) => {
        const i = HS.SCENES.findIndex(s => s.id === id);
        if (i < 0) return 'no scene';
        // それまでの場面で知っている字をそろえる（その場面より前の字＋場面でおぼえる字）
        HS.Game.known = []; HS.Game.cleared = {}; HS.Game.gotDrops = {}; HS.Game.restored = {}; HS.Game.stamps = {};
        for (let j = 0; j < i; j++) { HS.Game.cleared[HS.SCENES[j].id] = 1; }
        HS.setRng(7); HS.Scene.load(i); HS.Game.paused = true; HS.setRng(7); HS.Game.god = false;
        for (const k of (window.KNOWN_BEFORE[id] || [])) if (!HS.Game.known.includes(k)) HS.Game.known.push(k);
        HS.Ink.max = Math.max(HS.Game.inkMax(), 12 + i * 2);
        let exited = false; const off = HS.Bus.on ? null : null;
        const W = () => HS.W;
        const log = [];
        const sim = s => { const n = Math.round(s / HS.TICK); for (let k = 0; k < n; k++) { HS.worldTick(); HS.Game.tickSee(); if (HS.Scene.leaving) { exited = true; return; } } };
        const w = (k, x, y) => { if (exited) return; const r = HS.writeNow(k, x, y); log.push(k + '@' + x + ',' + y + ':' + r); sim(0.4); };
        const go = (x, y) => { if (exited) return; if (window.FULL) log.push('[from ' + HS.W.hero.x + ',' + HS.W.hero.y + ' ents ' + HS.ents().filter(e => !e.isHero).map(e => e.k + e.x + ',' + e.y).join(' ') + ']'); HS.heroTap(x, y); for (let k = 0; k < 60 && !exited; k++) { sim(0.25); const h = HS.W.hero; if (h.x === x && h.y === y) break; if (!h.hero.path.length && !h.hero.vehGoal && k > 4) { if (!h.hero.ride) HS.heroTap(x, y); } } log.push('go ' + x + ',' + y + '→' + HS.W.hero.x + ',' + HS.W.hero.y); };
        const t = s => sim(s);
        const combine = (a, b) => { HS.combineInTray(a, b); log.push('combine ' + a + b); };
        const boardAt = () => { const bd = HS.ents('板')[0] || HS.ents('舟')[0]; if (bd) { HS.heroTap(bd.x + 1, bd.y - 1); sim(2); } };
        const leeWalk = (k, x) => { const before = HS.ents(k).filter(e => e.mine); HS.writeNow(k, x, 8); sim(0.6); const g = HS.ents(k).filter(e => e.mine && !before.includes(e))[0]; if (g) go(g.x - 1, g.y + g.h - 1); for (const e of before) HS.returnInk(e); sim(0.2); };
        // 物をさわる（k の字の、いちばん近いもの。top=1 なら上に乗る）
        const ret = k => { for (const e of HS.ents(k).filter(e => e.mine)) HS.returnInk(e); sim(0.3); };
        const tapE = (k, top) => { const h = HS.W.hero; const es = HS.ents(k).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x)); const e = es[0]; if (!e) return; if (top) { HS.heroTap(e.x + 1, e.y - 1); sim(2.5); } else { HS.heroTap(e.x, e.y); sim(0.3); } };
        try { eval(plan); } catch (e) { return 'throw ' + e.message + ' | ' + log.slice(-6).join(' '); }
        if (!exited) sim(1);
        const st = HS.Scene.leaving;
        HS.Scene.leaving = false;
        const errs = HS.ERRORS.splice(0);
        if (errs.length) return 'errors ' + errs[0].split('\n')[0];
        const hurts = HS.W.events.filter(e => e.type === 'hurt').map(e => e.why).join(',');
        return st ? true : ('stuck at ' + HS.W.hero.x + ',' + HS.W.hero.y + (hurts ? ' hurts:' + hurts : '') + ' | ' + log.slice(window.FULL ? 0 : -6).join(' '));
      }, { id, plan });
      if (r === true) { pass++; console.log('◎', id, pname); } else { fail++; console.log('×', id, pname, '→', r); }
      await p.evaluate(() => { document.querySelectorAll('body > div[style*="z-index:38"]').forEach(d => d.remove()); });
    }
  }
  console.log(`\n${pass} 通過 / ${fail} 失敗`);
  await b.close(); process.exit(fail ? 1 : 0);
})();

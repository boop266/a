// 場面のある手順を、一歩ずつ様子を出しながら流す
module.exports = async (p) => {
  const id = process.env.SID, plan = process.env.PLAN;
  const out = await p.evaluate(({ id, plan }) => {
    const i = HS.SCENES.findIndex(s => s.id === id);
    HS.Scene.load(i); HS.Game.paused = true; HS.setRng(7);
    for (const k in HS.KDEF) if (!HS.Game.known.includes(k)) HS.Game.known.push(k);
    HS.Ink.max = 60;
    const L = [];
    const st = () => { const h = HS.W.hero; return 'hero ' + h.x + ',' + h.y + (h.hero.ride ? ' ride:' + h.hero.ride.k : '') + ' path' + h.hero.path.length + (h.hero.vehGoal ? ' veh' : '') + ' | ' + HS.ents().filter(e => !e.isHero && ((window.WATCH || '').includes(e.k))).map(e => e.k + '@' + e.x + ',' + e.y + (e.charmT ? '♥' : '') + (e.open ? 'open' : '')).join(' '); };

    const sim = s => { const n = Math.round(s / HS.TICK); for (let k = 0; k < n; k++) { HS.worldTick(); HS.Game.tickSee(); } };
    const w = (k, x, y) => { const r = HS.writeNow(k, x, y); L.push('w ' + k + ' ' + x + ',' + y + ' → ' + r + ' | ' + st()); sim(0.4); };
    const go = (x, y) => { HS.heroTap(x, y); for (let k = 0; k < 40; k++) { sim(0.25); const h = HS.W.hero; if (h.x === x && h.y === y) break; } L.push('go ' + x + ',' + y + ' | ' + st()); };
    const t = s => { sim(s); L.push('t ' + s + ' | ' + st()); };
    const tap = (x, y) => { HS.heroTap(x, y); sim(0.3); L.push('tap ' + x + ',' + y + ' | ' + st()); };
    const ents = k => HS.ents(k).map(e => e.k + '@' + e.x + ',' + e.y);
    eval(plan);
    return L.concat(HS.ERRORS.slice(0, 3));
  }, { id, plan });
  console.log(out.join('\n'));
};

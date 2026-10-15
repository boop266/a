module.exports = async (p) => {
  const r = await p.evaluate(() => {
    const FLAT = ['..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '##############################', '##############################'];
    HS.loadLab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '天狗', x: 14, y: 6 }] }); HS.Game.paused = true; HS.Ink.max = 99;
    for (const k in HS.KDEF) if (!HS.Game.known.includes(k)) HS.Game.known.push(k);
    HS.setRng(2); HS.heroTap(25, 7); HS.sim(6);
    const out = ['after walk hero ' + HS.hero().x];
    out.push('bow ' + HS.writeNow('礼', HS.hero().x, 7));
    HS.sim(1);
    const t = HS.ents('天狗')[0];
    out.push('tengu charm ' + t.charmT + ' calm ' + t.calm() + ' x ' + t.x + ' home ' + t.ai.home + ' gusts ' + HS.W.gusts.length);
    HS.heroTap(25, 7);
    out.push('path ' + HS.hero().hero.path.map(s => s.x + ',' + s.y + s.how).join(' '));
    HS.sim(8);
    out.push('end hero ' + HS.hero().x + ' tengu ' + t.x + ' gusts ' + HS.W.gusts.length + ' ' + JSON.stringify(HS.W.events.filter(e=>e.type!=='spawn').slice(-8)));
    return out;
  });
  console.log(r.join('\n'));
};

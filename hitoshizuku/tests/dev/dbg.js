module.exports = async (p) => {
  const r = await p.evaluate(() => {
    HS.Ink.max = 60;
    const pl = HS.planWrite('橋', 10, 9);
    const out = { plan: Object.assign({}, pl, { target: pl.target && pl.target.k, faded: pl.faded && pl.faded.k }) };
    out.ok = HS.startWrite('橋', 10, 9);
    out.writing = HS.R.writing.length;
    return out;
  });
  console.log(JSON.stringify(r));
  await p.waitForTimeout(2500);
  const r2 = await p.evaluate(() => ({ w: HS.R.writing.length, ents: HS.W.ents.filter(e=>e.alive).map(e=>e.k+'@'+e.x+','+e.y+'w'+e.w), err: HS.ERRORS, paused: HS.Game.paused, tick: HS.W.tick }));
  console.log(JSON.stringify(r2));
};

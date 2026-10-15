module.exports = async (p) => {
  await p.evaluate(() => { HS.Ink.max = 60; HS.startWrite('橋', 10, 9); });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { HS.heroTap(17, 8); });
  await p.waitForTimeout(3500);
  const st = await p.evaluate(() => ({ x: HS.W.hero.x, y: HS.W.hero.y, ink: HS.Ink.free(), ents: HS.W.ents.filter(e=>e.alive).map(e => e.k + '@' + e.x + ',' + e.y + (e.w>1?'w'+e.w:'')) }));
  console.log(JSON.stringify(st));
};

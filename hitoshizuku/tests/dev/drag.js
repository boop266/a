module.exports = async (p) => {
  await p.evaluate(() => { HS.Ink.max = 40; });
  // 字帳の「木」をさがして、絵巻へ引っぱる
  const box = await p.evaluate(() => { const c = [...document.querySelectorAll('.cell')].find(c => c.dataset.k === '木'); if (!c) return null; c.scrollIntoView({ inline: 'center' }); const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (!box) { console.log('no cell'); return; }
  await p.mouse.move(box.x, box.y); await p.mouse.down();
  for (let i = 1; i <= 12; i++) { await p.mouse.move(box.x - i * 8, box.y - i * 45); await p.waitForTimeout(16); }
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'tests/out/drag_mid.png' });
  await p.mouse.up();
  await p.waitForTimeout(1600);
  const r = await p.evaluate(() => HS.ents().map(e => e.k + '@' + e.x + ',' + e.y + (e.mine ? '*' : '')));
  console.log(JSON.stringify(r));
};

// 指定の場面を開いて、少し歩かせて写真
module.exports = async (p) => {
  const id = process.env.SID || 'f1';
  await p.evaluate((id) => { const i = HS.SCENES.findIndex(s => s.id === id); HS.Scene.load(i); for (const k in HS.KDEF) if (!HS.Game.known.includes(k)) HS.Game.known.push(k); }, id);
  await p.waitForTimeout(600);
  if (process.env.GOX) { await p.evaluate(([x, y]) => HS.heroTap(x, y), [Number(process.env.GOX), Number(process.env.GOY || 10)]); await p.waitForTimeout(Number(process.env.WAIT || 3000)); }
  if (process.env.EVAL) { await p.evaluate(process.env.EVAL); await p.waitForTimeout(Number(process.env.WAIT2 || 1500)); }
};

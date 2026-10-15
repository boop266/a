// 終の巻を、はじめから名をつけて絵巻が流れるまで（写真を何枚かとる）
module.exports = async (p) => {
  const shot = async (n) => { await p.screenshot({ path: 'tests/out/final_' + n + '.png' }); };
  const ev = (f, a) => p.evaluate(f, a);
  await ev(() => {
    const i = HS.SCENES.findIndex(s => s.id === 'e1');
    for (const k of ['灯', '母', '父', '師', '友', '別', '夢', '花', '人', '木', '一']) if (!HS.Game.known.includes(k)) HS.Game.known.push(k);
    HS.Game.useN = { 花: 9, 一: 20 };
    HS.Scene.load(i);
  });
  await p.waitForTimeout(2500); await shot('1_dark');
  const w = (k, x, y) => ev(([k, x, y]) => HS.writeNow(k, x, y), [k, x, y]);
  console.log('lamp', await w('灯', 4, 11));
  await p.waitForTimeout(1500); await shot('2_lamp');
  await ev(() => HS.heroTap(10, 11)); await p.waitForTimeout(6000);
  console.log('suzuri', await w('硯', 11, 11));
  await p.waitForTimeout(6000);
  console.log('fude', await w('筆', 13, 11));
  await ev(() => HS.heroTap(17, 11)); await p.waitForTimeout(5000); await shot('3_painter');
  for (const k of ['母', '父', '師']) { console.log(k, await w(k, 22, 8)); await p.waitForTimeout(1200); }
  await shot('4_three');
  for (const k of ['友', '別', '夢']) { console.log(k, await w(k, 22, 8)); await p.waitForTimeout(1200); }
  await p.waitForTimeout(3000); await shot('5_gather');
  await p.waitForTimeout(3000); await shot('6_awake');
  await p.waitForTimeout(14000); await shot('7_strip');
  console.log('title plan', await ev(() => HS.planWrite('花', 14, 5).kind));
  console.log('title start', await ev(() => HS.startWrite('花', 14, 5)));
  await p.waitForTimeout(1500); await shot('8_writing');
  await p.waitForTimeout(12000); await shot('9_missing');
  console.log('stage', await ev(() => HS.Final.stage));
  await ev(() => { const h = HS.W.hero; HS.tapAt && 0; HS.Final.onTap(h.x, h.y); });
  await p.waitForTimeout(2600); await shot('10_leap');
  await p.waitForTimeout(1200); await shot('11_stroke');
  await p.waitForTimeout(4000); await shot('12_done');
  await p.waitForTimeout(6000); await shot('13_dawn');
  await p.waitForTimeout(10000); await shot('14_end_start');
  await p.waitForTimeout(5000); await shot('15_title_panel');
  await p.waitForTimeout(12000); await shot('16_pan');
  await ev(() => HS.Ending.skip());
  await p.waitForTimeout(3500); await shot('17_end');
  await p.waitForTimeout(5000); await shot('18_end_menu');
  console.log('errors', JSON.stringify(await ev(() => HS.ERRORS.slice(0, 5))));
};

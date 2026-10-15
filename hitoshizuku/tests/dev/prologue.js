module.exports = async (p) => {

  await p.click('#titleMenu button');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: 'tests/out/prologue1.png' });
  for (let i = 0; i < 5; i++) { await p.mouse.click(200, 400); await p.waitForTimeout(700); }
  await p.waitForTimeout(3800);
  await p.screenshot({ path: 'tests/out/prologue6.png' });
  await p.mouse.click(200, 400); await p.waitForTimeout(2500);
};

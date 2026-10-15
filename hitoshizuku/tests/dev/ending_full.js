// 全場面の写しをとってから、おわりの絵巻を流して写真をとる
module.exports = async (p) => {
  await p.evaluate(() => {
    for (const def of HS.SCENES) {
      HS.Scene.load(HS.SCENES.indexOf(def)); HS.Game.paused = true;
      HS.sim(1.5);
      HS.Game.cleared[def.id] = 1;
      HS.Snap.take(def.id);
    }
    HS.Game.finalWord = '夢'; HS.Game.story.ended = true; HS.Game.paused = false;
    HS.Ending.play();
  });
  const shot = async (n, ms) => { await p.waitForTimeout(ms); await p.screenshot({ path: 'tests/out/endfull_' + n + '.png' }); };
  await shot('a_title', 4800);
  await shot('b_early', 6000);
  await shot('c_mid', 15000);
  await shot('d_late', 15000);
  console.log('snaps', await p.evaluate(() => Object.keys(HS.Snap.all()).length), 'dpan', await p.evaluate(() => HS.Ending.dpan));
};

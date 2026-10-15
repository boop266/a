module.exports = async (p) => {
  await p.evaluate(() => { for (const k of ['人', '花']) if (!HS.Game.known.includes(k)) HS.Game.known.push(k); HS.Game.finalWord = '花火'; HS.Game.story.ended = true; HS.Game.save(); });
  await p.reload(); await p.waitForTimeout(3500);
};

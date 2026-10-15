module.exports = async (p) => {
  const ks = Object.keys(await p.evaluate(() => { const o = {}; for (const k in HS.KDEF) o[k] = 1; return o; }));
  const res = await p.evaluate(async (ks) => {
    HS.Ink.max = 999; HS.Game.fastWrite = true;
    const out = [];
    let i = 0;
    for (const k of ks) {
      const x = 4 + (i * 3) % 40, y = 8;
      let pl; try { pl = HS.planWrite(k, x, y); } catch (e) { out.push(k + ' PLAN ' + e.message); continue; }
      try { HS.startWrite(k, x, y); } catch (e) { out.push(k + ' WRITE ' + e.message); }
      for (let t = 0; t < 30; t++) { try { HS.worldTick(); } catch (e) { out.push(k + ' TICK ' + e.message); break; } }
      i++;
      await new Promise(r => setTimeout(r, 30));
    }
    return out;
  }, ks);
  await p.waitForTimeout(3000);
  console.log('issues:', res.length, res.slice(0, 20).join('\n'));
  const st = await p.evaluate(() => ({ n: HS.W.ents.filter(e => e.alive).length, err: HS.ERRORS.slice(0, 8) }));
  console.log(JSON.stringify(st, null, 1));
};

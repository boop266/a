// ひとしずく：いたずらボット。どの場面でも、でたらめに書く・歩く・合わせる・墨をもどすをくり返して、
//   こわれないか（JS のエラー・人が地面の中・位置が NaN・物が増えすぎ）を調べる。
//   node tests/fuzz.js [回数=160] [場面id の一部]
const path = require('path');
const { chromium } = require('playwright');
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?lab';
const STEPS = parseInt(process.argv[2] || '160', 10);
const only = process.argv[3];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  p.on('pageerror', e => pageErrors.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(800);
  const ids = await p.evaluate(() => HS.SCENES.map(s => s.id).concat(['sandbox']));
  let bad = 0;
  for (const id of ids) {
    if (only && !id.includes(only)) continue;
    for (const seed of [1, 2]) {
      const r = await p.evaluate(({ id, STEPS, seed }) => {
        let s = seed * 9973 + id.length * 31; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
        const ri = n => Math.floor(rnd() * n);
        HS.setRng(seed);
        if (id === 'sandbox') HS.Game.sandbox(); else HS.Scene.load(HS.SCENES.findIndex(x => x.id === id));
        HS.Game.paused = true;
        const all = Object.keys(HS.KDEF).filter(k => !HS.KDEF[k].hidden);
        HS.Game.known = all.slice();
        HS.Ink.max = 40;
        const sim = sec => { const n = Math.round(sec / HS.TICK); for (let k = 0; k < n; k++) { HS.worldTick(); HS.Game.tickSee(); if (HS.Scene.leaving) return true; } return false; };
        const problems = [];
        const check = (step, what) => {
          const W = HS.W; if (!W) return;
          const h = W.hero;
          if (!h) { problems.push(step + ' 人がいない'); return; }
          if (!isFinite(h.x) || !isFinite(h.y)) problems.push(step + ' 人の位置が NaN after ' + what);
          if (h.alive && !h.hero.hurtT && !h.birthT && h.y >= 0 && h.y < W.h && h.x >= 0 && h.x < W.w) {
            const t = HS.tAt(h.x, h.y);
            if ([1, 2, 3, 4, 5, 6, 7, 10].includes(t)) problems.push(step + ' 人が地面の中 ' + h.x + ',' + h.y + ' t' + t + ' after ' + what);
          }
          for (const e of W.ents) if (e.alive && (!isFinite(e.x) || !isFinite(e.y) || !isFinite(e.rx))) { problems.push(step + ' ' + e.k + ' の位置が NaN after ' + what); break; }
          if (W.ents.length > 900) problems.push(step + ' 物が多すぎ ' + W.ents.length);
        };
        let left = false, last = '';
        for (let step = 0; step < STEPS && !left; step++) {
          const W = HS.W, h = W.hero;
          const a = rnd();
          try {
            if (a < 0.5) {
              const k = all[ri(all.length)], x = Math.max(0, Math.min(W.w - 1, h.x + ri(13) - 6)), y = Math.max(0, Math.min(W.h - 1, h.y + ri(9) - 5));
              last = 'w ' + k + ' ' + x + ',' + y;
              HS.writeNow(k, x, y);
            } else if (a < 0.75) {
              const x = Math.max(0, Math.min(W.w - 1, h.x + ri(17) - 8)), y = Math.max(0, Math.min(W.h - 1, h.y + ri(9) - 4));
              last = 'tap ' + x + ',' + y; HS.heroTap(x, y);
            } else if (a < 0.85) {
              const mine = W.ents.filter(e => e.alive && e.mine);
              if (mine.length) { const e = mine[ri(mine.length)]; last = 'ret ' + e.k; HS.returnInk(e); }
            } else if (a < 0.93) {
              const k1 = all[ri(all.length)], k2 = all[ri(all.length)]; last = 'comb ' + k1 + k2; HS.combineInTray(k1, k2);
            } else {
              const x = Math.max(0, Math.min(W.w - 1, h.x + ri(9) - 4)), y = Math.max(0, Math.min(W.h - 1, h.y + ri(7) - 3));
              last = 'tapAt ' + x + ',' + y; HS.tapAt((x - HS.R.cam.x) * HS.R.TS + HS.R.vw / 2 + 2, (y - HS.R.cam.y) * HS.R.TS + HS.R.vh / 2 + 2);
            }
          } catch (e) { problems.push(step + ' throw ' + e.message + ' after ' + last); }
          left = sim(0.35 + rnd() * 0.6);
          check(step, last);
          if (HS.ERRORS.length) { problems.push(step + ' ERROR ' + HS.ERRORS[0].split('\n').slice(0, 2).join(' ') + ' after ' + last); HS.ERRORS.splice(0); }
          if (problems.length > 4) break;
        }
        HS.Scene.leaving = false;
        if (HS.Ending && HS.Ending.on) HS.Ending.close('title');
        document.querySelectorAll('body > div[style*="z-index:38"]').forEach(d => d.remove());
        return { left, problems, ents: HS.W ? HS.W.ents.filter(e => e.alive).length : 0 };
      }, { id, STEPS, seed });
      if (pageErrors.length) { r.problems.push('pageerror ' + pageErrors.splice(0).join(' / ')); }
      if (r.problems.length) { bad++; console.log('×', id, 'seed' + seed, '\n   ' + r.problems.slice(0, 5).join('\n   ')); }
      else console.log('◎', id, 'seed' + seed, r.left ? '(ぬけた)' : '', 'ents ' + r.ents);
    }
  }
  console.log(bad ? `\n${bad} 件あやしい` : '\nいたずらしても、こわれなかった');
  await b.close(); process.exit(bad ? 1 : 0);
})();

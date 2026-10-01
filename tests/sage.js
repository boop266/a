// 賢者ボット：先を読んで遊ぶ高性能ボット。
// 敵がいる場面では、打てる手を全部、複製した世界で実際に試してから選ぶ。
// 時間は仮想時計で進むので、本物よりずっと速く遊べる。
// 使い方: node tests/sage.js [回数=4] [1回あたりの手数=600]
//   STYLE=all|brawler|noweapon|pacifist|sneak|chemist   遊び方の型（カンマ区切りで複数）
//   START=階  深い階から始める / SKILL=0.7 受けの腕前 / PAR=並列数
// 結果は tests/out/sage.json に書き出す。
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const RUNS = +process.argv[2] || 4;
const STEPS = +process.argv[3] || 600;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = process.env.BOT_OUT || path.resolve(__dirname, 'out');
const STYLES = (process.env.STYLE || 'all').split(',');
const PAR = +process.env.PAR || 3;

// 本番の手だけを数える計測
function install() {
  const O = window.SOBS = { kills: {}, deaths: [], escapes: [], floors: 0, react: {}, used: {}, fights: 0, gates: {} };
  const real = () => window.SAGE && SAGE.real;
  const _ofd = onFoeDeath;
  onFoeDeath = function (f) { try { if (real() && !f.__sobs) { f.__sobs = 1; let c = 'weapon'; try { c = killCause(f) || c; } catch (e) {} O.kills[c] = (O.kills[c] || 0) + 1; } } catch (e) {} return _ofd.apply(this, arguments); };
  const _r = react; react = function (k) { try { if (real()) O.react[k] = (O.react[k] || 0) + 1; } catch (e) {} return _r.apply(this, arguments); };
  const _d = die; die = function () { try { if (real()) O.deaths.push({ fi: G.fi + 1, by: G.lastHit || '?' }); } catch (e) {} return _d.apply(this, arguments); };
  const _e = escape; escape = function () { try { if (real()) O.escapes.push({ fi: G.fi + 1, val: bagValue() }); } catch (e) {} return _e.apply(this, arguments); };
  const _sf = startFight; startFight = function () { if (real()) O.fights++; return _sf.apply(this, arguments); };
  const _og = openGate; openGate = function (g) { try { if (real() && !g.open) O.gates[g.type] = (O.gates[g.type] || 0) + 1; } catch (e) {} return _og.apply(this, arguments); };
}

async function one(browser, run, style) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.addInitScript({ path: path.join(__dirname, 'sage', 'vtime.js') });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(FILE); await page.evaluate(() => VT.run(800));
  await page.addScriptTag({ path: path.join(__dirname, 'sage', 'brain.js') });
  await page.evaluate(install);
  await page.evaluate(([st, sk]) => { SAGE.style = st; SAGE.skill = sk; }, [style, +process.env.SKILL || .7]);
  const START = +process.env.START || 0;
  if (START) await page.evaluate(sf => { document.getElementById('modal').innerHTML = ''; newRaid(null, [], null, sf); }, START);
  const t0 = Date.now(); let maxF = 0, last = '', stall = 0; const tags = {};
  for (let s = 0; s < STEPS; s++) {
    let r; try { r = await page.evaluate(() => SAGE.turn()); } catch (e) { errs.push('turn: ' + e.message); break; }
    const k = String(r).startsWith('E:') ? String(r).slice(0, 12) : String(r).replace(/:.*/, ''); tags[k] = (tags[k] || 0) + 1;
    const sig = await page.evaluate(() => typeof G == 'undefined' || !G ? 'x' : [G.fi, G.p.x, G.p.y, G.p.hp, !!G.fight, G.over, document.getElementById('modal').innerHTML.length].join('|'));
    maxF = Math.max(maxF, await page.evaluate(() => (G && G.fi || 0) + 1));
    if (sig === last) { if (++stall > 40) { await page.evaluate(() => { if (G) { G.busy = false; DEF = null; document.getElementById('modal').innerHTML = ''; if (!G.fight && !G.over) { const d = DIRS8[Math.floor(Math.random() * 8)]; step(d[0], d[1]); } } }); stall = 0; } } else { stall = 0; last = sig; }
  }
  const o = await page.evaluate(() => ({ ...window.SOBS, log: SAGE.log, verr: (VT.errs || []).slice(0, 5) }));
  o.maxF = maxF; o.errors = [...new Set(errs)].slice(0, 5); o.style = style; o.sec = Math.round((Date.now() - t0) / 1000); o.tags = tags;
  await ctx.close();
  console.log(`[${style}] run ${run}: 最深 ${maxF}F / 倒れた ${o.deaths.length} / 帰った ${o.escapes.length} / 戦闘 ${o.fights} / 判断 ${o.log.decisions}（試行 ${o.log.sims}、1回 ${o.log.sims ? (o.log.simMs / o.log.sims).toFixed(0) : '-'}ms）/ ${o.sec}秒 / エラー ${o.errors.length + o.verr.length}\n   手 ${JSON.stringify(tags)}`);
  return o;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const jobs = []; STYLES.forEach(st => { for (let r = 0; r < RUNS; r++) jobs.push([r, st]); });
  const all = []; let next = 0;
  await Promise.all(Array.from({ length: Math.min(PAR, jobs.length) }, async () => { while (next < jobs.length) { const [r, st] = jobs[next++]; all.push(await one(browser, r, st)); } }));
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'sage.json'), JSON.stringify(all, null, 1));
  const merge = (xs, f) => { const m = {}; xs.forEach(o => Object.entries(f(o) || {}).forEach(([k, v]) => m[k] = (m[k] || 0) + v)); return m; };
  for (const st of STYLES) {
    const xs = all.filter(o => o.style == st);
    console.log(`\n===== 型「${st}」 ${xs.length}回 × ${STEPS}手 =====`);
    console.log('最深 ' + xs.map(o => o.maxF + 'F').join(' / ') + '　倒れた ' + xs.reduce((s, o) => s + o.deaths.length, 0) + '　帰った ' + xs.reduce((s, o) => s + o.escapes.length, 0));
    const k = merge(xs, o => o.kills); const kt = Object.values(k).reduce((a, b) => a + b, 0);
    console.log('倒し方 ' + Object.entries(k).sort((a, b) => b[1] - a[1]).map(([a, b]) => a + ':' + b).join(' ') + '（武器以外 ' + (kt ? Math.round((kt - (k.weapon || 0)) / kt * 100) : 0) + '%）');
    console.log('反応 ' + Object.entries(merge(xs, o => o.react)).sort((a, b) => b[1] - a[1]).map(([a, b]) => a + ':' + b).join(' '));
    console.log('仕掛けを開けた ' + Object.entries(merge(xs, o => o.gates)).map(([a, b]) => a + ':' + b).join(' '));
    const av = merge(xs, o => o.log.avail), pk = merge(xs, o => o.log.pick), gn = merge(xs, o => o.log.gain);
    console.log('手ごとの　打てた回数 → 選んだ回数（選んだときの得、待つ・殴るに比べて）');
    Object.keys(av).sort((a, b) => (pk[b] || 0) / av[b] - (pk[a] || 0) / av[a]).forEach(g => console.log('  ' + g.padEnd(22, '　') + String(av[g]).padStart(5) + ' → ' + String(pk[g] || 0).padStart(4) + '  ' + Math.round((pk[g] || 0) / av[g] * 100) + '%' + (pk[g] ? '  得 ' + (gn[g] / pk[g]).toFixed(0) : '')));
    const sk = xs.flatMap(o => o.log.skipped || []); if (sk.length) console.log('解けずに飛ばした階', JSON.stringify(sk));
    const bl = xs.flatMap(o => o.log.blocked || []); if (bl.length) console.log('歩けなかった所', JSON.stringify(bl.slice(0, 6)));
    const errs = xs.flatMap(o => o.errors.concat(o.verr || [])); if (errs.length) console.log('エラー', [...new Set(errs)].slice(0, 6));
  }
})();

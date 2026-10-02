// 村の暮らしボット：賢者ボットで何度も潜って帰り、帰るたびに村で
// 掲示板・村づくり・牧場・図鑑を（人がするように画面のボタンで）進める。
// 「潜るたびに、目に見える前進があるか」を数えて、サブコンテンツの点検表を作る。
// 使い方: node tests/village.js [村の数=2] [潜る回数=10] [1回の手数=250]
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const VILLS = +process.argv[2] || 2, RAIDS = +process.argv[3] || 10, CAP = +process.argv[4] || 250;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = process.env.BOT_OUT || path.resolve(__dirname, 'out');

function install(cap) {
  window.RAIDCAP = cap; window.VLOG = []; window.RAIDN = 0; window.RAIDEND = 0; window.VDONE = 0;
  // 潜りの始まりと終わりを、世界の種（WSEED）と G.over で見分ける
  window.VSTATE = () => { const g = typeof G != 'undefined' && G; if (g && !g.over && window.CURSEED !== WSEED) { CURSEED = WSEED; RAIDN++; RAID_T0 = SAGE.turnN || 0; } if ((!g || g.over) && RAIDN > RAIDEND) RAIDEND = RAIDN;
    return { n: RAIDN, end: RAIDEND, done: VDONE, inRaid: !!(g && !g.over), t: (SAGE.turnN || 0) - (window.RAID_T0 || 0), busy: !!(g && (g.busy || g.fight)) }; };
}
// 村での一回り（帰ってくるたび）。前と後を比べて、何が進んだかを記録する
async function villageRoutine() {
  const W = ms => VT.run(ms);
  const $ = id => document.getElementById(id);
  const clickAll = async re => { let n = 0; for (let k = 0; k < 12; k++) { const b = [...document.querySelectorAll('#modal button')].find(b => re.test(b.textContent) && !b.disabled); if (!b) break; b.click(); n++; await W(120); } return n; };
  const hearts = () => farm.reduce((s, m) => s + heartsOf(m), 0);
  const need = () => BUILD.filter(B => !M2.built[B.k]).reduce((s, B) => s + Object.entries(B.need).reduce((t, [id, n]) => t + Math.min(n, whCount(id)), 0) + Math.min(B.g, gold) / B.g, 0);
  const seen = () => Object.keys(codex).filter(k => k.startsWith('m:')).length;
  const snap = () => ({ bond: farm.reduce((t, m) => t + bondOf(m), 0), claims: M2.done || 0, built: Object.keys(M2.built).length, hearts: hearts(), farm: farm.length, need: need(), seen: seen(), album: Object.keys(M2.album).length, waza: farm.filter(m => m.inst && m.inst.waza).length, gifts: Object.keys(M2.gifts).length, shiny: farm.filter(m => m.inst && m.inst.shiny).length, reqp: M2.reqs.reduce((s, r) => s + reqProg(r)[0], 0) + (M2.done || 0) * 10 });
  const b0 = window.VPREV || Object.fromEntries(Object.keys(snap()).map(k => [k, 0]));
  const back = () => {};
  // 倉庫の宝を売る（建物や頼みに要る物は残す）。人が「宝をまとめて売る」を押すのと同じ
  { const keep = {}; BUILD.filter(B => !M2.built[B.k]).forEach(B => Object.entries(B.need).forEach(([id, n]) => keep[id] = Math.max(keep[id] || 0, n))); M2.reqs.forEach(r => { if (r.t == 'fetch') keep[r.item] = (keep[r.item] || 0) + r.n; });
    const cnt = {}; wh = wh.filter(o => { const d = ITEM[o.id] || {}; if (!(d.tre || d.val) || d.deco) return true; cnt[o.id] = (cnt[o.id] || 0) + 1; if (cnt[o.id] <= (keep[o.id] || 0)) return true; gold += sellPrice(o.id); return false; }); saveMeta(); }
  // 掲示板：叶った頼みを届ける
  showBoard(back); await W(100); await clickAll(/届ける/); $('modal').innerHTML = '';
  // 村づくり：建てられる物を建てる
  showBuild(back); await W(100); await clickAll(/^建てる$/); $('modal').innerHTML = '';
  // 牧場：みんなをなでる。えさがあれば、なつきの低い子に
  farm.forEach(m => { try { petMon(m); } catch (e) {} });
  for (let k = 0; k < 2; k++) { const m = farm.slice().sort((a, b) => bondOf(a) - bondOf(b))[0]; if (m && wh.some(o => FEEDS.includes(o.id))) feedMon(m); }
  // 図鑑：ページをめくって、もらえるご褒美をもらう
  const P = albumPages(); for (let i = 0; i < P.length; i++) { showAlbum(back, i); await W(60); await clickAll(/^もらう$/); }
  $('modal').innerHTML = '';
  const b1 = snap(); window.VPREV = b1;
  const d = {}; Object.keys(b0).forEach(k => d[k] = +(b1[k] - b0[k]).toFixed(2));
  VLOG.push({ raid: RAIDN, maxF: M2.maxF || 0, gold, d, b1, reqs: M2.reqs.map(r => r.t + ':' + reqProg(r).join('/')) });
  try { showBase(); } catch (e) {}
}

async function one(browser, v) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.addInitScript({ path: path.join(__dirname, 'sage', 'vtime.js') });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(FILE); await page.evaluate(() => VT.run(800));
  await page.addScriptTag({ path: path.join(__dirname, 'sage', 'brain.js') });
  await page.evaluate(install, CAP);
  await page.addScriptTag({ content: 'window.villageRoutine=' + villageRoutine.toString() });
  const t0 = Date.now(); let guard = 0;
  while (guard++ < RAIDS * CAP * 3) {
    const st = await page.evaluate(() => VSTATE());
    if (process.env.VDBG && guard % 40 == 0) console.log(JSON.stringify(st));
    if (st.end >= RAIDS && st.done >= RAIDS) break;
    if (st.end > st.done && !st.inRaid) { await page.evaluate(async () => { VDONE = RAIDEND; await VT.run(1500); await villageRoutine(); }); continue; }
    if (st.inRaid && st.t > CAP * 2 && !st.busy) { await page.evaluate(() => { try { escape(); } catch (e) {} }); continue; }
    try { await page.evaluate(() => SAGE.turn()); } catch (e) { errs.push('turn: ' + e.message); break; }
  }
  const o = await page.evaluate(() => ({ log: VLOG, M2, farm: farm.length, gold, runs }));
  o.errors = [...new Set(errs)].slice(0, 5); o.sec = Math.round((Date.now() - t0) / 1000);
  console.log(`村 ${v}: 潜った ${o.log.length}回 / ${o.sec}秒 / 建物 ${Object.keys(o.M2.built).length} / 届けた ${o.M2.done || 0} / 牧場 ${o.farm}匹 / エラー ${o.errors.length}`);
  o.log.forEach(l => console.log('   ' + l.raid + '回目 最深' + l.maxF + 'F ' + JSON.stringify(l.d)));
  await ctx.close(); return o;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const all = await Promise.all(Array.from({ length: VILLS }, (_, v) => one(browser, v)));
  await browser.close();
  // 判定：潜るたびに目に見える前進があるか（◎ 6割以上、かつ5回目までに本物のご褒美）
  const logs = all.flatMap(o => o.log);
  const F = [
    ['掲示板', d => d.claims > 0 || d.reqp > 0, d => d.claims > 0, l => '届けた ' + l.reduce((s, x) => s + x.d.claims, 0) + '件・仲良しの贈り物 ' + l.reduce((s, x) => s + x.d.gifts, 0)],
    ['村づくり', d => d.built > 0 || d.need > 0, d => d.built > 0, l => '建てた ' + l.reduce((s, x) => s + x.d.built, 0) + '軒'],
    ['牧場（なつき・仲間）', d => d.bond > 0 || d.hearts > 0 || d.farm > 0 || d.waza > 0, d => d.hearts > 0 || d.waza > 0, l => '♥が増えた ' + l.reduce((s, x) => s + x.d.hearts, 0) + '・技 ' + l.reduce((s, x) => s + x.d.waza, 0) + '・仲間 +' + l.reduce((s, x) => s + x.d.farm, 0) + '・色違い ' + l.reduce((s, x) => s + x.d.shiny, 0)],
    ['図鑑', d => d.seen > 0 || d.album > 0, d => d.album > 0, l => '新しく見た ' + l.reduce((s, x) => s + x.d.seen, 0) + '種・ご褒美 ' + l.reduce((s, x) => s + x.d.album, 0)],
  ];
  const rows = F.map(([n, prog, reward, note]) => {
    const r = logs.filter(l => prog(l.d)).length / Math.max(1, logs.length);
    const early = all.every(o => o.log.slice(0, 5).some(l => reward(l.d)));
    const j = !logs.length ? '－' : r >= .6 && early ? '◎' : r >= .3 ? '○' : r > 0 ? '△' : '×';
    return { n, j, rate: Math.round(r * 100), early, note: '前進した潜り ' + Math.round(r * 100) + '%・5回目までにご褒美 ' + (early ? 'あり' : 'なし') + '・' + note(logs) };
  });
  rows.forEach(r => console.log(r.j + ' ' + r.n + '　' + r.note));
  fs.writeFileSync(path.join(OUT, 'village.json'), JSON.stringify({ rows, all }, null, 1));
})();

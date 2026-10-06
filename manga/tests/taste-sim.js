// 好み分析モデル（manga/taste.js）の精度検証。隠れた好みを持つ架空の読者に、ランダムな作品を読ませて当てる。
// 使い方: node manga/tests/taste-sim.js [--quick] [--seed=N] [--only=main,gen,online,ablation]
'use strict';
const path = require('path');
const Taste = require(path.join(__dirname, '..', 'taste.js'));
const { spearman, pearson, normCdf, gauss } = Taste.util;

const ARGS = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.replace(/^--/, '').split('='); return [m[0], m[1] == null ? true : m[1]]; }));
const QUICK = !!ARGS.quick;
const SEED = Number(ARGS.seed || 1);
const ONLY = ARGS.only ? new Set(String(ARGS.only).split(',')) : null;
const want = k => !ONLY || ONLY.has(k);
if (ARGS.sig) Taste.configure({ SIGNALS: JSON.parse(ARGS.sig) }); // 実験用：信号の重みを差し替える
const MEXP = Object.assign({}, ARGS.explore != null ? { explore: Number(ARGS.explore) } : {}, ARGS.lambda != null ? { lambda: Number(ARGS.lambda) } : {}); // 実験用：探索の強さ
const MOPTS = ARGS.opts ? JSON.parse(ARGS.opts) : {}; // 実験用：analyze に渡す追加の設定
const an = (W, F, H, o) => Taste.analyze(W, F, H, Object.assign({ now: 1e15 }, MOPTS, o || {}));
const AX = Taste.schema.AXES.map(a => a[0]);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] * 0.5 + s[Math.ceil((s.length - 1) / 2)] * 0.5 : NaN; };
const sig = x => 1 / (1 + Math.exp(-x));
const pct = x => (x * 100).toFixed(0) + '%';
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '  - ');

/* ---------------- 作品の生成 ----------------
   真の軸（読者が感じる味）と、編集者が付けるラベル（真の値＋ばらつき）を分ける。モデルが見るのはラベルだけ。 */
function makeWork(r, id, o) {
  o = o || {};
  const trueAx = o.axes || Taste.randomAxes(r);
  const w = Taste.randomWork(r, { id, axes: trueAx });
  if (o.tags) for (const c in o.tags) w.profile.tags[c] = o.tags[c];
  if (o.mismatch != null) { // 編集者がズラすかどうかを外から決める（「好みで作る」で絵柄の参考に従ったとき）
    const ex = Taste.util.expectedArt(trueAx); const art = { line: {} };
    for (const row of Taste.schema.ART) { const k = row[0]; const base = ex[k] != null ? ex[k] : 0.5; const v = o.mismatch ? r() : clamp(base + gauss(r) * 0.12, 0, 1); if (k.startsWith('line.')) art.line[k.slice(5)] = v; else art[k] = v; }
    art.headRatio = 2 + 6 * art.headRatio; w.script.art = art;
  }
  const label = {}; for (const k of AX) label[k] = Math.round(clamp(trueAx[k] + gauss(r) * 0.07, 0, 1) * 100) / 100;
  w.profile.axes = label;
  const np = 8 + Math.floor(r() * 5);
  w.script.pages = Array.from({ length: np }, () => ({ panels: [{ say: [{ text: 'あ'.repeat(Math.floor(10 + r() * 80 * (0.4 + w.feat.dialog))) }] }] }));
  w.script.title = id;
  w.meta.createdAt = 0;
  w._true = { axes: trueAx, gap: Taste.util.gapOf(trueAx, w.script.art) };
  return w;
}

/* ---------------- 架空の読者 ----------------
   utility(work) は真の軸・タグ・ズレから計算。あとで標準化（ランダムな作品で平均0・標準偏差1）。 */
function makeReader(type, r) {
  const z = (w, k) => 2 * (w._true.axes[k] - 0.5);
  const pickAx = n => { const a = AX.slice(); const out = []; for (let i = 0; i < n; i++) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; };
  const pm = () => (r() < 0.5 ? -1 : 1);
  const tagPref = () => { const V = Taste.schema.VOCAB; const t = {}; t['ending:' + V.ending[Math.floor(r() * V.ending.length)]] = 0.8; t['ending:' + V.ending[Math.floor(r() * V.ending.length)]] = -0.9; t['genre:' + V.genre[Math.floor(r() * V.genre.length)]] = 0.9; t['humor:' + V.humor[Math.floor(r() * V.humor.length)]] = 0.6; return t; };
  const tagU = (w, tp) => { let s = 0; for (const c in w.profile.tags) for (const v of w.profile.tags[c]) s += tp[c + ':' + v] || 0; return s; };
  const linear = () => { const ks = pickAx(4); const ws = ks.map(() => pm() * (0.6 + r() * 0.7)); const tp = tagPref(); return { desc: ks.map((k, i) => `${k}${ws[i] > 0 ? '+' : '-'}`).join(' '), u: w => ks.reduce((s, k, i) => s + ws[i] * z(w, k), 0) + tagU(w, tp) }; };
  let R = { type, mood: 0.5, likeProp: 0.55 + r() * 0.35, dislikeProp: 0.2 + r() * 0.3, speed: 0.6 + r() * 1.0 };
  if (type === 'linear') Object.assign(R, linear());
  else if (type === 'peak') { const ks = pickAx(4); const c = [0.35 + r() * 0.3, 0.35 + r() * 0.3]; const w2 = [pm() * 0.8, pm() * 0.8]; const tp = tagPref();
    R.desc = `${ks[0]}≈${c[0].toFixed(2)} ${ks[1]}≈${c[1].toFixed(2)} ${ks[2]}${w2[0] > 0 ? '+' : '-'} ${ks[3]}${w2[1] > 0 ? '+' : '-'}`;
    R.u = w => -3.0 * (w._true.axes[ks[0]] - c[0]) ** 2 * 4 - 3.0 * (w._true.axes[ks[1]] - c[1]) ** 2 * 4 + w2[0] * z(w, ks[2]) + w2[1] * z(w, ks[3]) + tagU(w, tp) * 0.7; }
  else if (type === 'combo') { const [a, b, c, d, e] = pickAx(5); const tp = tagPref();
    R.desc = `${a}×${b}+ ${c}×${d}+ ${e}+`;
    R.u = w => 1.6 * z(w, a) * z(w, b) + 1.4 * z(w, c) * z(w, d) + 0.4 * z(w, e) + 0.6 * tagU(w, tp); }
  else if (type === 'gap') { const ks = pickAx(2); const ws = ks.map(() => pm() * 0.7); const tp = tagPref();
    R.desc = `gap+ ${ks.map((k, i) => k + (ws[i] > 0 ? '+' : '-')).join(' ')}`;
    R.u = w => 3.0 * (w._true.gap - 0.4) + ks.reduce((s, k, i) => s + ws[i] * z(w, k), 0) + 0.6 * tagU(w, tp); }
  else if (type === 'moody') { Object.assign(R, linear()); R.mood = 1.3; R.desc += ' (気分むら大)'; }
  else if (type === 'drift') { const A = linear(), B = linear(); R.desc = `${A.desc} → ${B.desc}`; R.uA = A.u; R.uB = B.u; R.switchAt = 40; R.u = A.u; }
  // 標準化
  const rr = Taste.rng(999); const ref = Array.from({ length: 1500 }, (_, i) => makeWork(rr, 's' + i));
  const norm = f => { const us = ref.map(f); const m = mean(us), sd = Math.sqrt(mean(us.map(x => (x - m) ** 2))) || 1; return w => (f(w) - m) / sd; };
  if (type === 'drift') { R.uA = norm(R.uA); R.uB = norm(R.uB); R.uAt = (w, t) => (t < R.switchAt ? R.uA(w) : R.uB(w)); }
  else { const f = norm(R.u); R.uAt = w => f(w); }
  return R;
}

/* ---------------- 反応の生成（ノイズ・押し忘れ・途中離脱・滞在時間） ---------------- */
function react(R, w, t, r) {
  const U = R.uAt(w, t); const L = U + gauss(r) * R.mood;
  const total = w.script.pages.length + 1;
  const abandon = r() < sig(-2.2 * (L + 0.8));
  const maxPage = abandon ? Math.max(0, Math.min(total - 2, Math.floor(total * clamp(0.1 + 0.7 * r() * sig(2 * (L + 1.2)), 0.05, 0.9)))) : total - 1;
  const finished = !abandon;
  const liked = (finished && L > 0.7 && r() < R.likeProp) || r() < 0.02; // 押し忘れ・誤タップ
  const disliked = !liked && L < -0.9 && r() < R.dislikeProp;
  const sequel = finished && L > 1.4 && r() < 0.35;
  const rereads = finished && L > 1.0 && r() < 0.3 ? (r() < 0.3 ? 2 : 1) : 0;
  const session = gauss(r) * 0.3; const dwell = [];
  for (let p = 0; p <= maxPage; p++) { const ch = p === 0 ? 0 : w.script.pages[p - 1].panels[0].say[0].text.length; let s = R.speed * (2.5 + 0.12 * ch) * Math.exp(0.12 * L + session + gauss(r) * 0.45); if (r() < 0.02) s += 120; dwell[p] = Math.min(180, Math.round(s * 10) / 10); }
  return { U, L, fb: { liked, disliked, opens: 1 + (rereads || 0), finished, maxPage, dwell, rereads, sequel, lastRead: t * 600000 } };
}
/* 読書の履歴を作る：works を順に読ませる */
function readAll(R, works, r, t0) {
  const W = {}, F = {}, H = []; t0 = t0 || 0;
  works.forEach((w, i) => { const t = t0 + i; const x = react(R, w, t, r); W[w.id] = w; F[w.id] = x.fb; H.push({ id: w.id, t: t * 600000 }); w._U = x.U; w._L = x.L; });
  return { W, F, H };
}
function subset(log, works, n) { const W = {}, F = {}; for (const w of works.slice(0, n)) { W[w.id] = w; F[w.id] = log.F[w.id]; } return { W, F, H: log.H.slice(0, n) }; }

/* ---------------- 評価指標 ---------------- */
function pairAcc(pred, truth) { let ok = 0, all = 0; for (let i = 0; i < pred.length; i++) for (let j = i + 1; j < pred.length; j += 1) { const a = truth[i] - truth[j]; if (Math.abs(a) < 1e-9) continue; all++; if ((pred[i] - pred[j]) * a > 0) ok++; } return ok / Math.max(1, all); }
function hitAt(pred, truth, topFrac, goodFrac) { const n = pred.length, k = Math.max(1, Math.round(n * topFrac)); const idx = pred.map((p, i) => i).sort((a, b) => pred[b] - pred[a]).slice(0, k); const thr = truth.slice().sort((a, b) => b - a)[Math.floor(n * goodFrac) - 1]; return idx.filter(i => truth[i] >= thr).length / k; }
function pLikeOf(R, U) { // 真の好き度から「いいね」が押される確率（気分のむら込み）
  const pL = 1 - normCdf((0.7 - U) / R.mood); return 0.02 + 0.98 * pL * R.likeProp * (1 - sig(-2.2 * (U + 0.8)) * 0.5);
}

/* ---------------- 素朴な比較対象：旧方式（好きな作品の平均 − 全体の平均 の内積） ---------------- */
function baselineMeanDiff(log, works, n) {
  const ws = works.slice(0, n); const rw = ws.map(w => { const f = log.F[w.id]; return (f.liked ? 2 : 0) - (f.disliked ? 2 : 0) + (f.sequel ? 1.5 : 0) + (f.finished ? 0.5 : -0.8); });
  const pos = rw.map(x => Math.max(0, x)), neg = rw.map(x => Math.max(0, -x) + 0.35);
  const wm = (wt, k) => { const s = wt.reduce((a, b) => a + b, 0) || 1; return ws.reduce((a, w, i) => a + wt[i] * w.profile.axes[k], 0) / s; };
  const d = {}, base = {}; for (const k of AX) { d[k] = wm(pos, k) - wm(neg, k); base[k] = wm(neg, k); }
  return { score: w => AX.reduce((s, k) => s + d[k] * (w.profile.axes[k] - base[k]), 0), likedMean: Object.fromEntries(AX.map(k => [k, wm(pos, k)])) };
}

/* =========================================================================================
   実験
   ========================================================================================= */
const TYPES = ['linear', 'peak', 'combo', 'gap', 'moody', 'drift'];
const TYPE_JA = { linear: '単純（高いほど好き）', peak: '山型（ほどほど）', combo: '組み合わせ', gap: '絵柄のズレ好き', moody: '気分にむら', drift: '途中で好みが変わる' };
const PER_TYPE = QUICK ? 3 : 8;
const NS = ARGS.ns ? String(ARGS.ns).split(',').map(Number) : [5, 10, 20, 40, 80];
const NMAX = 80;
const t0 = Date.now();

function makePopulation() {
  const out = []; TYPES.forEach((type, ti) => { for (let k = 0; k < PER_TYPE; k++) { const r = Taste.rng(SEED * 1000 + ti * 100 + k); out.push({ R: makeReader(type, r), r, id: `${type}#${k}` }); } }); return out;
}
const POP = makePopulation();
const HOLD = (() => { const r = Taste.rng(SEED * 7 + 3); return Array.from({ length: QUICK ? 200 : 300 }, (_, i) => makeWork(r, 'h' + i)); })();

function evalModel(A, R, tNow, scoreFn) {
  const pred = HOLD.map(w => (scoreFn ? scoreFn(w) : Taste.predict(A, w).mean)); const truth = HOLD.map(w => R.uAt(w, tNow));
  const pv = scoreFn ? null : HOLD.map(w => Taste.predict(A, w));
  return { sp: spearman(pred, truth), pr: pearson(pred, truth), pair: pairAcc(pred, truth), hit: hitAt(pred, truth, 0.1, 0.2), predR: A && A.accuracy ? A.accuracy.expectedCorr : NaN, pv };
}

const RESULTS = {};
// ---------- 1) 何作読むと、隠れた好みをどれだけ当てられるか ----------
if (want('main')) {
  console.log('\n■ 1. 何作読むと、隠れた好みをどれだけ当てられるか（読者タイプ×' + PER_TYPE + '人、未読の作品' + HOLD.length + '作で評価）');
  const tab = {}; const base = {}; const calib = [];
  for (const P of POP) {
    const r = Taste.rng(SEED * 31 + POP.indexOf(P));
    const works = Array.from({ length: NMAX }, (_, i) => makeWork(r, P.id + 'w' + i));
    const log = readAll(P.R, works, r);
    P.log = log; P.works = works;
    for (const n of NS) {
      const s = subset(log, works, n); const A = an(s.W, s.F, s.H, { samples: 40 });
      const e = evalModel(A, P.R, n - 1);
      (tab[P.R.type + ':' + n] = tab[P.R.type + ':' + n] || []).push(e);
      const b = baselineMeanDiff(log, works, n); const eb = evalModel(null, P.R, n - 1, b.score);
      (base[P.R.type + ':' + n] = base[P.R.type + ':' + n] || []).push(eb);
      calib.push({ n, pred: A.accuracy.expectedCorr, act: e.pr, predPair: A.accuracy.pairwise, actPair: e.pair });
    }
  }
  const head = '読者タイプ              ' + NS.map(n => `   n=${String(n).padEnd(3)}`).join('');
  for (const [title, key, fmt] of [['順位相関（スピアマン）', 'sp', f2], ['2作のどちらが好きかを当てる率', 'pair', pct], ['推薦の的中率：上位10%に推した作品が、本当に上位20%に入る率（でたらめなら20%）', 'hit', pct]]) {
    console.log('\n' + title); console.log(head);
    for (const type of TYPES) console.log((TYPE_JA[type] + '　　　　　　　　　　').slice(0, 12) + '　 ' + NS.map(n => fmt(med(tab[type + ':' + n].map(e => e[key]))).padStart(9)).join(''));
    console.log('全体（中央値）　　　　　　 ' + NS.map(n => fmt(med(TYPES.flatMap(t => tab[t + ':' + n].map(e => e[key])))).padStart(9)).join(''));
    console.log('旧方式（平均の差）　　　　 ' + NS.map(n => fmt(med(TYPES.flatMap(t => base[t + ':' + n].map(e => e[key])))).padStart(9)).join(''));
  }
  console.log('\n精度の自己申告の当たり具合（モデルが出す「期待される相関 √R」と実際の相関）');
  console.log('   n    自己申告   実際   | 2作当て 自己申告 / 実際');
  for (const n of NS) { const c = calib.filter(x => x.n === n); console.log(`${String(n).padStart(4)}    ${f2(mean(c.map(x => x.pred)))}      ${f2(mean(c.map(x => x.act)))}   |    ${pct(mean(c.map(x => x.predPair)))} / ${pct(mean(c.map(x => x.actPair)))}`); }
  RESULTS.main = { tab, base, calib };
  RESULTS.curve = NS.map(n => ({ n, pair: med(TYPES.flatMap(t => tab[t + ':' + n].map(e => e.pair))) }));
}

// ---------- 2) 「好みで作る」は「ランダムで作る」よりどれだけ好かれるか ----------
function realize(r, tg, id) { // 作者・編集者が狙いを受け取って作る（狙いどおりにはならない：軸は ±0.1 ずれ、タグは 85% だけ採用）
  const ra = Taste.randomAxes(r); const axes = {};
  for (const k of AX) { const a = tg.axes[k]; axes[k] = a.role === 'free' ? ra[k] : clamp(a.value + gauss(r) * 0.1, 0, 1); }
  const tags = {}; for (const c in tg.tags) { const vs = tg.tags[c].map(x => x.v).filter(() => r() < 0.85); if (vs.length) tags[c] = vs; }
  const gh = tg.art.hints.join(''); let mismatch = r() < 0.3; if (/ズラした/.test(gh) && r() < 0.5) mismatch = true; if (/王道/.test(gh) && r() < 0.5) mismatch = false;
  return makeWork(r, id, { axes, tags, mismatch });
}
if (want('gen') && RESULTS.main) {
  console.log('\n■ 2. 「好みで作る」と「ランダムで作る」の比較（その読者の本当の好き度。0=ランダムな作品の平均, 1=1標準偏差上）');
  const GN = [10, 20, 40, 80]; const per = QUICK ? 6 : 10;
  const rows = {};
  for (const P of POP) {
    for (const n of GN) {
      const s = subset(P.log, P.works, n); const A = an(s.W, s.F, s.H, { samples: 30 });
      const r = Taste.rng(SEED * 77 + POP.indexOf(P) * 10 + n);
      const b = baselineMeanDiff(P.log, P.works, n);
      const acc = (key, U, rate) => { const k = key + ':' + n; (rows[k] = rows[k] || { U: [], like: [], top: [], rate: [] }); rows[k].U.push(U); rows[k].like.push(pLikeOf(P.R, U)); rows[k].top.push(U > 0.8416 ? 1 : 0); if (rate != null) rows[k].rate.push(rate); };
      for (let i = 0; i < per; i++) {
        const tN = n - 1 + 0.5;
        const ts = Taste.prefSeed(A, r, MEXP).aim; acc('ts', P.R.uAt(realize(r, ts, 'g'), tN), ts.explore.rate);
        const gr = Taste.target(A.model, { rng: r, mode: 'greedy' }); acc('greedy', P.R.uAt(realize(r, gr, 'g'), tN), gr.explore.rate);
        const rw = makeWork(r, 'rnd'); acc('random', P.R.uAt(rw, tN));
        // 旧方式：好きな作品の軸の平均を狙う（タグはランダム）
        const old = { axes: Object.fromEntries(AX.map(k => [k, { value: clamp(b.likedMean[k] + gauss(r) * 0.08, 0, 1), role: 'aim' }])), tags: {}, art: { hints: [] } };
        acc('old', P.R.uAt(realize(r, old, 'g'), tN));
      }
    }
  }
  console.log('作り方                         ' + GN.map(n => `  n=${String(n).padEnd(3)}`).join('') + '   ← 何作に反応したあとか');
  const lab = { random: 'ランダムで作る', old: '旧方式（好きな作品の平均を狙う）', greedy: '好みで作る（当てに行くだけ）', ts: '好みで作る（トンプソン抽出）' };
  for (const [title, key, fmt] of [['本当の好き度の平均', 'U', f2], ['いいねが押される確率', 'like', pct], ['その人の上位20%に入る作品の割合', 'top', pct]]) {
    console.log('\n' + title);
    for (const m of ['random', 'old', 'greedy', 'ts']) console.log((lab[m] + '　　　　　　　　　　　　　').slice(0, 17) + ' ' + GN.map(n => fmt(mean(rows[m + ':' + n][key])).padStart(8)).join(''));
  }
  console.log('\n探索の割合（トンプソン抽出の狙いのうち、不確かさで動いた分）' + GN.map(n => pct(mean(rows['ts:' + n].rate)).padStart(8)).join(''));
  RESULTS.gen = rows;
}

// ---------- 3) 実際の使い方に近い流れ：読む→分析→好みで作る を繰り返す ----------
if (want('online')) {
  console.log('\n■ 3. 実際の流れ：最初の5作はランダム、その後は 7割「好みで作る」・3割「ランダム」で60作読んだとき');
  const pop = POP.filter((_, i) => i % (QUICK ? 3 : 2) === 0);
  const res = { pref: [], rand: [], byType: {} };
  for (const P of pop) {
    const r = Taste.rng(SEED * 501 + POP.indexOf(P)); const R = P.R;
    const W = {}, F = {}, H = []; let A = null; const got = [];
    for (let t = 0; t < 60; t++) {
      let w; const usePref = t >= 5 && r() < 0.7;
      if (usePref) { if (!A || t % 3 === 0) A = an(W, F, H, { samples: 20 }); w = realize(r, Taste.prefSeed(A, r, MEXP).aim, P.id + 'o' + t); }
      else w = makeWork(r, P.id + 'o' + t);
      const x = react(R, w, t, r); W[w.id] = w; F[w.id] = x.fb; H.push({ id: w.id, t: t * 600000 });
      got.push({ t, pref: usePref, U: x.U, like: x.fb.liked });
    }
    const late = got.filter(g => g.t >= 30);
    const lp = late.filter(g => g.pref), lr = late.filter(g => !g.pref);
    res.pref.push(...lp.map(g => g.U)); res.rand.push(...lr.map(g => g.U));
    (res.byType[R.type] = res.byType[R.type] || { p: [], r: [], lp: [], lr: [] });
    res.byType[R.type].p.push(...lp.map(g => g.U)); res.byType[R.type].r.push(...lr.map(g => g.U));
    res.byType[R.type].lp.push(...lp.map(g => (g.like ? 1 : 0))); res.byType[R.type].lr.push(...lr.map(g => (g.like ? 1 : 0)));
  }
  console.log('読者タイプ              好みで作った作品   ランダムな作品   （31〜60作目、本当の好き度の平均 / いいね率）');
  for (const type of TYPES) { const b = res.byType[type]; if (!b) continue; console.log((TYPE_JA[type] + '　　　　　　　　　　').slice(0, 12) + `　　  ${f2(mean(b.p))} / ${pct(mean(b.lp))}       ${f2(mean(b.r))} / ${pct(mean(b.lr))}`); }
  const all = Object.values(res.byType);
  console.log(`全体　　　　　　　　　　　  ${f2(mean(res.pref))} / ${pct(mean(all.flatMap(b => b.lp)))}       ${f2(mean(res.rand))} / ${pct(mean(all.flatMap(b => b.lr)))}`);
  RESULTS.online = res;
}

// ---------- 4) 部品ごとの効き目（アブレーション）：n=20 と n=40 での 2作当て率 ----------
if (want('ablation') && RESULTS.main) {
  console.log('\n■ 4. 部品ごとの効き目（2作のどちらが好きかを当てる率・中央値。左 n=20 / 右 n=40）');
  const vars = [
    ['完全版', {}],
    ['二次（山型）なし', { quad: false }],
    ['組み合わせなし', { inter: false }],
    ['ARD（軸ごとの縮小）なし', { ard: false }],
    ['明示の反応だけ（いいね・いまいち・続編）', { signals: ['like', 'dislike', 'sequel'] }],
    ['滞在時間なし', { signals: ['like', 'dislike', 'sequel', 'finished', 'abandon', 'reread', 'silent'] }],
    ['時間の重みなし（半減期∞）', { halfLife: Infinity }],
  ];
  const typesShown = ['peak', 'combo', 'gap', 'drift'];
  console.log('部品                                     全体            ' + typesShown.map(t => (TYPE_JA[t] + '　　　　　').slice(0, 8)).join('  '));
  for (const [name, o] of vars) {
    const acc = {};
    for (const P of POP) for (const n of [20, 40]) {
      const s = subset(P.log, P.works, n); const A = an(s.W, s.F, s.H, Object.assign({ samples: 10 }, o));
      const e = evalModel(A, P.R, n - 1); (acc['all:' + n] = acc['all:' + n] || []).push(e.pair); (acc[P.R.type + ':' + n] = acc[P.R.type + ':' + n] || []).push(e.pair);
    }
    console.log((name + '　　　　　　　　　　　　　　　　　　　　').slice(0, 22) + `  ${pct(med(acc['all:20']))} / ${pct(med(acc['all:40']))}   ` + typesShown.map(t => `${pct(med(acc[t + ':20']))}/${pct(med(acc[t + ':40']))}`.padStart(10)).join(''));
  }
}

// ---------- 5) 隠れた好みを、分析画面の言葉で当てられたか（例） ----------
if (want('main') && RESULTS.main) {
  console.log('\n■ 5. 分析画面の「一言」と隠れた好み（各タイプ1人、80作読んだあと）');
  for (const type of TYPES) {
    const P = POP.find(p => p.R.type === type); const s = subset(P.log, P.works, 80); const A = an(s.W, s.F, s.H);
    const top = A.summary.axes.slice().sort((a, b) => b.importance - a.importance).slice(0, 3).map(a => `${a.k}:${a.shape}${a.shape === 'peak' ? '@' + a.ideal : ''}`).join(' ');
    console.log(`${(TYPE_JA[type] + '　　　　　　　　').slice(0, 10)} 正解: ${P.R.desc}\n${'　'.repeat(5)}推定: ${top} | 組: ${A.combos.slice(0, 2).map(c => c.a + '×' + c.b + (c.syn > 0 ? '+' : '-')).join(' ')} | ズレ: ${A.summary.gap.effect} | 一言: ${A.oneLiner}`);
  }
}
console.log(`\n（${((Date.now() - t0) / 1000).toFixed(0)}秒）`);
if (RESULTS.curve) console.log('学習曲線（taste.js の CURVE 用）: ' + JSON.stringify(RESULTS.curve.map(c => ({ n: c.n, pair: Math.round(c.pair * 100) / 100 }))));

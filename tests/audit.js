// 点検表：賢者ボットの記録（tests/out/sage.json）から、要素ごとの判定を出す。
// 使い方: node tests/sage.js 8 600 && node tests/audit.js
//   判定 ◎ 打てる時に15%以上選ばれる、または選べば得が大きい（平均+30以上、3回以上）
//        ○ 5〜15% / △ 1〜5% / × ほぼ選ばれない / － 出会った数が少ない（10回未満）
const fs = require('fs');
const path = require('path');
const OUT = process.env.BOT_OUT || path.resolve(__dirname, 'out');
// AUDIT_DIR の下の */sage.json をまとめて読む（持ち物や深さを変えた回をまとめて判定する）
const AD = process.env.AUDIT_DIR;
const all = AD ? fs.readdirSync(AD).flatMap(d => { try { return JSON.parse(fs.readFileSync(path.join(AD, d, 'sage.json'), 'utf8')); } catch (e) { return []; } }) : JSON.parse(fs.readFileSync(path.join(OUT, 'sage.json'), 'utf8'));

const MAIN = [
  ['戦う手', '武器を振る', /^use:振る:/],
  ['戦う手', '蹴る（押し出す）', /^fa:札:蹴る/],
  ['戦う手', 'なだめる・好物を渡す', /^fa:札:(なだめる|渡す)/],
  ['戦う手', '取引する', /^fa:札:取引/],
  ['戦う手', '脅して追い払う', /^fa:札:脅す/],
  ['戦う手', 'とどめ（忍殺）', /^(fa:札:忍殺|use:振る\(とどめ\))/],
  ['戦う手', '仲間を出す', /^use:使う\(仲間\)/],
  ['戦う手', '化ける', /^use:使う\(化ける\)/],
  ['戦う手', '化学・技の道具', /^(use:使う|throw:投げる)\(化学・技\)/],
  ['物の性質（案A）', '重い物を当てる', /^throw:投げる\(ゴツン\)/],
  ['物の性質（案A）', '穴を埋める', /^throw:投げる\(穴を埋める\)/],
  ['物の性質（案A）', '燃える物で燃え広がらせる', /^throw:投げる\(燃え広がる\)/],
  ['物の性質（案A）', '濡れた物で火を消す', /^throw:投げる\(火を消す\)/],
  ['物の性質（案A）', '濡れた物で濡らす', /^throw:投げる\(濡らす\)/],
  ['物の性質（案A）', '鳴る物で誘う', /^throw:投げる\(鳴らす\)/],
  ['物の性質（案A）', '光る物で目くらまし', /^throw:投げる\(目くらまし\)/],
  ['物の性質（案A）', 'におい・光り物で誘う', /^throw:投げる\((におい|光り物で誘う)\)/],
  ['物の性質（案A）', '割れ物を割る（音）', /^throw:投げる\(割る\)/],
  ['物の性質（案A）', '爆弾を置く', /^place:置く\(爆弾\)/],
  ['物の性質（案A）', '壺を置く（通せんぼ）', /^place:置く\(壺\)/],
  ['物の性質（案A）', '囮を置く', /^place:置く\(囮\)/],
  ['地形を作り変える（案B）', '落とし穴を掘る', /^dig:掘る:落とし穴/],
  ['地形を作り変える（案B）', '水路を掘る', /^dig:掘る:水路/],
  ['地形を作り変える（案B）', '爆弾で壁を崩す', /^throw:投げる\(壁を崩す\)/],
];

const merge = f => { const m = {}; all.forEach(o => Object.entries(f(o) || {}).forEach(([k, v]) => m[k] = (m[k] || 0) + v)); return m; };
const av = merge(o => o.log.avail), pk = merge(o => o.log.pick), gn = merge(o => o.log.gain);
const judge = (a, p, g) => { if (a < 10) return '－'; const r = p / a; if (r >= .15 || (p >= 3 && g / p >= 30)) return '◎'; if (r >= .05) return '○'; if (r >= .01) return '△'; return '×'; };
const rows = MAIN.map(([sec, n, re]) => { let a = 0, p = 0, g = 0; Object.keys(av).forEach(k => { if (re.test(k)) { a += av[k]; p += pk[k] || 0; g += gn[k] || 0; } }); return { sec, n, a, p, rate: a ? Math.round(p / a * 100) : 0, gain: p ? Math.round(g / p) : null, j: judge(a, p, g) }; });

// サブコンテンツ（tests/out/village.json があれば）
let sub = [];
try { sub = JSON.parse(fs.readFileSync(path.join(OUT, 'village.json'), 'utf8')).rows || []; } catch (e) {}

let sec = '';
console.log(`点検表（賢者ボット ${all.length}回）`);
rows.forEach(r => { if (r.sec != sec) { sec = r.sec; console.log('\n■ ' + sec); } console.log(`  ${r.j}  ${r.n.padEnd(16, '　')} 打てた ${String(r.a).padStart(5)}  選んだ ${String(r.p).padStart(4)} (${String(r.rate).padStart(3)}%)  得 ${r.gain == null ? '－' : (r.gain >= 0 ? '+' : '') + r.gain}`); });
if (sub.length) { console.log('\n■ サブコンテンツ'); sub.forEach(r => console.log(`  ${r.j}  ${r.n.padEnd(16, '　')} ${r.note}`)); }
const bad = rows.concat(sub).filter(r => r.j != '◎');
console.log('\n' + (bad.length ? '◎でないもの: ' + bad.map(r => r.n + r.j).join(' / ') : 'すべて◎'));
fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify({ runs: all.length, rows, sub }, null, 1));

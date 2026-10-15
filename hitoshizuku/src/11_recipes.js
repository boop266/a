// ---------------------------------------------------------------------------
// 合わせ字：字と字を重ねると、新しい字になる
//   shape … 字の形が本当に組み合わさっている（木＋木＝林）
//   mean  … 意味を合わせた（雨＋日＝虹）。形はちがうが、思いつけば作れる
//   word  … 二つ並べて言葉になる（花＋火＝花火）
//   trayOnly … 字帳の中だけで合わさる（世界の中では、火は木を燃やす）
// ---------------------------------------------------------------------------
const RECIPES = [];
function RC(out, parts, type, opt) { RECIPES.push(Object.assign({ out, parts, type: type || 'shape' }, opt || {})); }
// --- 字の形 ---
RC('林', ['木', '木']);
RC('森', ['林', '木']);
RC('森', ['木', '木', '木']);
RC('炎', ['火', '火']);
RC('明', ['日', '月']);
RC('休', ['人', '木']);
RC('岩', ['山', '石']);
RC('嵐', ['山', '風']);
RC('島', ['山', '鳥']);
RC('鳴', ['口', '鳥']);
RC('雷', ['雨', '田']);
RC('星', ['日', '生']);
RC('晶', ['日', '日', '日']);
RC('炭', ['山', '灰']);
RC('凪', ['風', '止']);
RC('柊', ['木', '冬']);
RC('椿', ['木', '春']);
RC('枯', ['木', '古']);
RC('花', ['草', '化']);
RC('茸', ['草', '耳']);
RC('海', ['水', '母']);
RC('泣', ['水', '立']);
RC('波', ['水', '皮']);
RC('破', ['石', '皮']);
RC('滝', ['水', '竜']);
RC('焚', ['林', '火'], 'shape', { trayOnly: true });
RC('集', ['鳥', '木']);
RC('闇', ['門', '音']);
RC('暗', ['日', '音']);
RC('音', ['立', '日']);
RC('晴', ['日', '青']);
RC('鰯', ['魚', '弱']);
RC('鯉', ['魚', '里']);
RC('埋', ['土', '里']);
RC('墨', ['黒', '土']);
RC('雫', ['雨', '下']);
RC('東', ['木', '日']);
RC('凍', ['氷', '東']);
RC('出', ['山', '山']);
RC('砂', ['石', '少']);
RC('好', ['女', '子']);
RC('安', ['家', '女']);
RC('赤', ['大', '火']);
RC('思', ['田', '心']);
RC('生', ['草', '土']);
RC('大', ['人', '一']);
RC('動', ['重', '力']);
RC('浮', ['水', '子']);
RC('秋', ['稲', '火']);
RC('笑', ['竹', '人']);
// --- 意味の合わせ ---
RC('虹', ['雨', '日'], 'mean');
RC('消', ['水', '火'], 'mean', { trayOnly: true });
RC('溶', ['熱', '氷'], 'mean', { trayOnly: true });
RC('燃', ['火', '木'], 'mean', { trayOnly: true });
RC('春', ['日', '花'], 'mean');
RC('夏', ['日', '熱'], 'mean');
RC('冬', ['雪', '氷'], 'mean');
RC('夜', ['月', '闇'], 'mean');
RC('泳', ['水', '人'], 'mean');
RC('飛', ['鳥', '風'], 'mean');
RC('沈', ['水', '石'], 'mean', { trayOnly: true });
RC('登', ['山', '人'], 'mean');
RC('眠', ['夜', '人'], 'mean');
RC('起', ['朝', '人'], 'mean');
RC('育', ['水', '日'], 'mean');
RC('咲', ['花', '口'], 'mean');
RC('友', ['人', '人'], 'mean');
RC('愛', ['心', '友'], 'mean');
RC('怒', ['心', '火'], 'mean');
RC('恐', ['心', '鬼'], 'mean');
RC('忘', ['心', '白'], 'mean');
RC('夢', ['眠', '心'], 'mean');
RC('熱', ['火', '日'], 'mean', { trayOnly: true });
RC('冷', ['氷', '水'], 'mean', { trayOnly: true });
RC('強', ['力', '大'], 'mean');
RC('弱', ['小', '力'], 'mean');
RC('静', ['音', '止'], 'mean');
RC('吹', ['口', '風'], 'mean');
RC('満月', ['大', '月'], 'mean');
RC('花見', ['桜', '人'], 'mean');
// --- 言葉（並べる）---
for (const w of ['大木', '枯木', '花火', '火山', '雪玉', '竹馬', '鬼火', '風鈴', '雨雲', '朝日', '青空', '化石']) RC(w, [...w], 'word');

// 材料のならびから、できる字をさがす
function partsKey(parts) { return parts.slice().sort().join(''); }
const RECIPE_MAP = new Map();
for (const r of RECIPES) { const k = partsKey(r.parts); if (!RECIPE_MAP.has(k)) RECIPE_MAP.set(k, []); RECIPE_MAP.get(k).push(r); }
// a を b に重ねたとき（b が下・a が上から来た）
function findRecipe(a, b, inWorld) {
  const list = RECIPE_MAP.get(partsKey([a, b])) || [];
  // 言葉は並び順を見る（下にある字が先）
  let best = null;
  for (const r of list) {
    if (inWorld && r.trayOnly) continue;
    if (r.type === 'word') { if (r.out === b + a) return r; if (!best && r.out === a + b) best = r; continue; }
    if (!best || best.type === 'word') best = r;
  }
  return best;
}
function findRecipe3(parts) {
  const list = RECIPE_MAP.get(partsKey(parts)) || [];
  return list[0] || null;
}
// a と b が、三つ合わせの途中になれるか
function isPartialOf3(a, b) {
  for (const r of RECIPES) {
    if (r.parts.length !== 3) continue;
    const rest = r.parts.slice();
    const ia = rest.indexOf(a); if (ia < 0) continue; rest.splice(ia, 1);
    const ib = rest.indexOf(b); if (ib < 0) continue;
    return true;
  }
  return false;
}
// その字の作り方（字典に出す）
function recipesFor(out) { return RECIPES.filter(r => r.out === out); }

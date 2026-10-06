/* =============================================================================
   taste.js — 漫画工房「読者の好み分析モデル」  (window.Taste)
   依存なし・素のJS。ブラウザでは window.Taste、node では module.exports。

   全体の流れ
     works{id:WORK} + feedback{id:FB} + history[{id,t}]
        │  adaptWork / fuse   … 生の反応 → 作品ごとの「好き度 u」(平均・分散) に変換（信号の統合）
        ▼
     fit                       … ベイズ回帰（双対形式・群ごとの事前分散を経験ベイズで推定）
        │                         特徴 = 20軸の一次 + 二次（山型）+ 2軸の積（組み合わせ）
        │                                + 物語と絵柄のズレ（一次・二次）+ 絵柄17 + 作り12 + タグ
        ▼
     summary / target / predict … 分析画面・「好みで作る」の狙い・好み度の予測
   studio.html との約束（ANALYSIS の形・prefSeed・predictFit）はそのまま満たす（analyze が互換の形を返す）。
   ============================================================================= */
(function (root) {
  'use strict';
  const VERSION = '1.0.0';

  /* ---------------------------------------------------------------------------
     0. スキーマ（studio.html の現状に合わせた既定値。configure で差し替えられる）
     --------------------------------------------------------------------------- */
  const S = {
    AXES: [
      ['humor', 'シリアス', '笑い'], ['warmth', 'クール', '温かさ'], ['tension', 'ゆったり', '緊張感'], ['tempo', 'じっくり', 'テンポ'],
      ['dark', '明るい', 'ダーク'], ['fantasy', '現実的', 'ファンタジー'], ['romance', '恋愛なし', '恋愛'], ['action', '静か', 'アクション'],
      ['mystery', '謎なし', '謎解き'], ['tearjerk', 'からっと', '泣ける'], ['absurd', '筋が通る', '不条理'], ['charDriven', '物語重視', 'キャラ重視'],
      ['talky', '絵で見せる', '会話多め'], ['growth', '変わらない', '成長・変化'], ['everyday', '非日常', '日常感'], ['scale', '身近', '世界規模'],
      ['twist', '王道', 'どんでん返し'], ['afterglow', 'すっきり', '考えさせる'], ['cute', 'かっこいい', 'かわいさ'], ['smart', '直感的', '知的'],
    ],
    TAG_CATS: { genre: 'ジャンル', setting: '舞台', protagonist: '主人公', age: '年代', relation: '関係', ending: '結末', humor: '笑いの種類', motif: 'モチーフ' },
    ART: [
      ['headRatio', '頭身', '2頭身（デフォルメ）', '8頭身（リアル）'], ['deform', 'デフォルメ', '写実', '崩し'], ['eyeSize', '目の大きさ', '小さい', '大きい'],
      ['line.weight', '線の太さ', '細い', '太い'], ['line.taper', '線の入り抜き', '均一', '強弱'], ['line.jitter', '線の揺れ', 'まっすぐ', '揺れる'], ['line.roughness', '線の荒さ', 'きれい', 'ラフ'],
      ['hatching', '斜線', '少ない', '多い'], ['crossHatch', '網目の斜線', '少ない', '多い'], ['black', 'ベタ', '白っぽい', '黒っぽい'], ['tone', 'トーン', '少ない', '多い'],
      ['detail', '描き込み', 'あっさり', '描き込み'], ['perspective', 'パース', '平面的', '強いパース'], ['dynamism', '動き', '静か', '躍動'],
      ['sparkle', 'キラキラ', 'なし', '多い'], ['softness', 'やわらかさ', '硬い', 'やわらか'], ['grain', 'ざらつき', 'つるつる', 'ざらざら'],
    ],
    FEATS: [
      ['dialog', '1コマのセリフ量', '少ない', '多い'], ['sfx', '効果音の数', '少ない', '多い'], ['closeup', 'アップの割合', '少ない', '多い'],
      ['cast', '登場人物の数', '少人数', '大人数'], ['narr', 'ナレーションの割合', '少ない', '多い'], ['pages', 'ページ数', '短い', '長い'],
      ['panels', '1ページのコマ数', '大ゴマ', '細かく'], ['shout', '叫びの割合', '静か', 'にぎやか'], ['think', '心の声の割合', '少ない', '多い'],
      ['night', '夜の場面', '昼中心', '夜中心'], ['fx', '演出の多さ', '控えめ', '派手'], ['nonhuman', '人間以外の割合', '人間', '人外'],
    ],
    /* 物語の軸から「王道の絵柄」を予想する式（studio.html の EXPECT と同じ。0〜1 の正規化済みの絵柄値） */
    EXPECT: {
      headRatio: ax => 1 - (0.3 + 0.5 * ax.cute + 0.2 * ax.humor - 0.2 * ax.dark - 0.15 * ax.tension),
      deform: ax => 0.15 + 0.5 * ax.humor + 0.3 * ax.absurd + 0.2 * ax.cute - 0.25 * ax.dark,
      eyeSize: ax => 0.3 + 0.4 * ax.cute + 0.3 * ax.romance - 0.2 * ax.dark,
      'line.weight': ax => 0.35 + 0.3 * ax.action + 0.2 * ax.tension - 0.2 * ax.cute,
      'line.roughness': ax => 0.15 + 0.3 * ax.dark + 0.3 * ax.action - 0.2 * ax.cute,
      hatching: ax => 0.05 + 0.5 * ax.dark + 0.3 * ax.tension,
      black: ax => 0.15 + 0.5 * ax.dark + 0.3 * ax.tension,
      detail: ax => 0.3 + 0.3 * ax.scale + 0.2 * ax.fantasy + 0.2 * ax.tension - 0.2 * ax.humor,
      dynamism: ax => 0.15 + 0.7 * ax.action + 0.2 * ax.tempo,
      sparkle: ax => 0.05 + 0.5 * ax.romance + 0.3 * ax.cute,
      softness: ax => 0.3 + 0.4 * ax.warmth + 0.3 * ax.cute - 0.3 * ax.dark,
    },
    /* 一般的な読者の傾向（studio.html の POP_AXES / POP_TAGS と同じ目安）。「意外な好み」の比較対象 */
    POP_AXES: { humor: 0.15, warmth: 0.25, tension: 0.05, tempo: 0.18, dark: -0.15, fantasy: 0.05, romance: 0.05, action: 0.08, mystery: 0.05, tearjerk: 0.1, absurd: -0.12, charDriven: 0.05, talky: -0.05, growth: 0.12, everyday: 0, scale: 0, twist: 0.15, afterglow: -0.05, cute: 0.08, smart: 0 },
    POP_TAGS: { 'ending:バッドエンド': -0.8, 'ending:ハッピーエンド': 0.4, 'humor:ブラック': -0.4, 'humor:シュール': -0.3, 'genre:ホラー': -0.2, 'genre:不条理': -0.4, 'genre:ラブコメ': 0.3, 'genre:ギャグ': 0.2, 'relation:友情': 0.3, 'motif:食べ物': 0.2, 'motif:動物': 0.25 },
    /* 企画の種の語彙（studio.html の SEED と同じ）。タグの候補・探索先として使う */
    VOCAB: {
      genre: ['ギャグ', 'ホラー', 'SF', 'ファンタジー', 'ラブコメ', 'ミステリー', 'スポーツ', '時代劇', '日常', '職業もの', 'バトル', '童話風', '不条理', 'サスペンス', 'ほのぼの動物', '青春', '冒険', 'グルメ', '怪談', 'スパイもの', '西部劇風', '音楽もの', '怪獣もの', '異世界もの', '民話風', '医療もの', '家族もの', '寓話', 'タイムトラベル', '忍者もの', '海賊もの', '妖怪もの', '料理対決', '探偵コメディ', 'ディストピア', 'お仕事コメディ', '宇宙冒険', 'ロボットもの', '学園もの'],
      setting: ['商店街', '宇宙ステーション', '深い森', '海辺の町', '雪山のふもと', '夜の学校', '古いお城', '地下の洞窟', '山の上の神社', '砂漠のオアシス', '海の底の町', '小さな病院', 'あやしい研究所', '古い図書館', '終電後の駅', '学校の屋上', '江戸の町', '体育館', '小さなライブ会場', '祖母の家の和室', '路地裏の喫茶店', '下町の台所', '雑居ビルの会社', '雲の上', '草原の村', '月面の基地'],
      hero: ['気弱な小学生', '定年したばかりのおじいさん', '新人の会社員', '見習い魔法使い', '旧型のロボット', '迷子の小さな雲', '空から落ちてきた星', '料理が苦手な料理人', '無口な猫', '怖がりのおばけ', '宇宙人の転校生', 'うそが下手な忍者', '売れないミュージシャン', '方向音痴の探偵', '毒舌なうさぎ', '冬眠に失敗したくま', '世界一弱いモンスター', '宿題を忘れた中学生', '引っ越してきた転校生', '引退した元ヒーロー', '町の郵便配達員', '夜勤の看護師', 'おばあちゃんスパイ', '新米の神様', 'はずかしがりのスライム', '負けず嫌いのペンギン', '書けなくなった小説家', '漁師の娘'],
      relation: ['友情', '家族', '師弟', 'ライバル', '恋', '仲間', '主従', '敵どうし', 'きょうだい', '親子', 'ご近所', '初対面どうし'],
      conflict: ['大事なものをなくす', '約束が守れそうにない', '正体がばれそう', '締め切りに追われる', 'ひどい誤解をされる', '町に危機が迫る', '絶対に負けられない勝負', '帰る場所がない', '秘密を守らなければならない', '苦手なものに向き合う', '別れの日が来る', '何かが毎日ひとつずつ消える', '言えなかったひと言', 'ルールを破ってしまった'],
      tone: ['からっと明るい', 'しみじみ', 'ドタバタ', 'ひんやり不気味', '熱血', '静かでやさしい', '皮肉っぽい', '夢のよう', '緊迫', 'とぼけた', 'せつない', 'ばかばかしい'],
      ending: ['ハッピーエンド', 'ほろ苦い', 'どんでん返し', '余韻を残す', '大団円', '意外なオチ', '新しい始まりの予感', 'ちょっと怖いオチ', '笑えるオチ', '静かな和解'],
      gimmick: ['どんでん返し', '時間ループ', '手紙', '勘違い', '入れ替わり', '予言', '体が小さくなる', '二つの視点', '回想', '嘘が本当になる', '言葉が通じない', '鏡', '古い地図', '留守番', '落とし物', '気持ちで天気が変わる', '変身', '透明になる', '謎の電話', '同じ一日', '逆さまの世界', '賭け'],
      motif: ['食べ物', '天気', '動物', '魔法', '機械', '音楽', '手紙', '星', '植物', '海', '時計', '写真', '傘', '鍵', 'お祭り', '雪', '電車', '本', 'スポーツ', 'お菓子', '宝物', '帽子'],
      humor: ['ボケとツッコミ', 'ドタバタ', 'シュール', 'ほっこり', 'ブラック', 'なし'],
    },
    /* トーン（種の言葉）と軸の対応。狙いの軸に一番合うトーンを選ぶのに使う */
    TONE_AXES: {
      'からっと明るい': { humor: 0.8, dark: 0.1, tearjerk: 0.2 }, 'しみじみ': { warmth: 0.8, tempo: 0.25, afterglow: 0.7 }, 'ドタバタ': { humor: 0.85, tempo: 0.85, action: 0.6 },
      'ひんやり不気味': { dark: 0.85, tension: 0.7, warmth: 0.2 }, '熱血': { action: 0.8, growth: 0.8, tension: 0.6 }, '静かでやさしい': { warmth: 0.85, tempo: 0.2, tension: 0.15 },
      '皮肉っぽい': { humor: 0.6, smart: 0.7, warmth: 0.25 }, '夢のよう': { fantasy: 0.85, afterglow: 0.6, everyday: 0.15 }, '緊迫': { tension: 0.9, tempo: 0.7, humor: 0.15 },
      'とぼけた': { humor: 0.7, absurd: 0.6, tension: 0.15 }, 'せつない': { tearjerk: 0.8, romance: 0.5, afterglow: 0.7 }, 'ばかばかしい': { humor: 0.9, absurd: 0.85, smart: 0.15 },
    },
  };
  /* 表記ゆれの吸収（編集者の自由記述タグ用。必要なら configure で足す） */
  const TAG_ALIAS = { 'ハッピー': 'ハッピーエンド', 'バッド': 'バッドエンド', 'バッドエンディング': 'バッドエンド', 'ハッピーエンディング': 'ハッピーエンド', '恋愛': '恋', 'ねこ': '猫', 'ネコ': '猫' };

  /* ---------------------------------------------------------------------------
     1. 信号の重み（作品ごとの好き度 u への「測定」。u は作品間で平均0・標準偏差1くらいの尺度）
        v   = その信号が出たときの u の見込み（条件付き平均のつもり）
        rho = 信頼度（精度 = 1/分散）。複数の信号は独立な測定としてガウスで合成する：
              u の測定値 m = Σrho·v / Σrho、 測定の分散 τ = 1/Σrho
     --------------------------------------------------------------------------- */
  const SIGNALS = {
    // 続編を作った：時間と手間をかけて「この続きがほしい」と言った。最強のプラス
    sequel: { v: 1.9, rho: 3.0, label: '続編を作った' },
    // いいね：わざわざ押した明示の好意。押し忘れはあるが、押したときはほぼ確実に好き
    like: { v: 1.4, rho: 2.5, label: 'いいね' },
    // いまいち：押す人が少ない分、押したときの意味は重い。強いマイナス
    dislike: { v: -1.6, rho: 2.5, label: 'いまいち' },
    // 最後まで読んだ：短い作品は惰性でも読めるので弱いプラス
    finished: { v: 0.35, rho: 0.5, label: '最後まで読んだ' },
    // 途中でやめた：早くやめるほど「入口で合わなかった」強いマイナス。終盤でのやめは中断の可能性もあり弱い
    //   v = -0.5 - 1.1 × (残りの割合)。「やめた」と確定できるとき（その後に別の作品を開いた／30分たった）だけ使う
    abandon: { v0: -0.5, vSlope: -1.1, rho: 1.2, label: '途中でやめた' },
    // 読み返し：自分から戻ってくるのは強い好意。回数は対数で頭打ち
    reread: { v: 1.2, rho: 0.9, label: '読み返し' },
    // 黙って読了：いいねをよく押す人が押さなかったのは、少しだけマイナス（押し忘れを考えて弱く、いいね率に比例）
    silent: { v: -0.4, rhoK: 1.5, label: 'いいねなしで読了' },
    // 滞在時間：人ごとの読む速さ（と、ページの文字量）で正規化した残差。信頼度は明示の反応との相関から人ごとに推定
    dwell: { r0: 0.15, label: '滞在時間' },
  };

  /* ---------------------------------------------------------------------------
     2. 小道具
     --------------------------------------------------------------------------- */
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const r2 = x => Math.round(x * 100) / 100;
  const sum = a => { let s = 0; for (const x of a) s += x; return s; };
  function mulberry32(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function normCdf(x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  function quantile(sorted, q) { if (!sorted.length) return 0; const i = clamp((sorted.length - 1) * q, 0, sorted.length - 1), lo = Math.floor(i), hi = Math.ceil(i); return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo); }
  function median(a) { return quantile(a.slice().sort((x, y) => x - y), 0.5); }
  function spearman(a, b) { const rk = x => { const idx = x.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(x.length); idx.forEach(([, i], k) => { r[i] = k; }); return r; }; return pearson(rk(a), rk(b)); }
  function pearson(a, b) { const n = a.length; if (n < 2) return 0; const ma = sum(a) / n, mb = sum(b) / n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; } return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : 0; }

  /* 軸・特徴の索引（configure で作り直す） */
  let AX, K, AXL, ARTK, FEATK, NI, OFF, PAIRS;
  function rebuild() {
    AX = S.AXES.map(a => a[0]); K = AX.length; AXL = Object.fromEntries(S.AXES.map(([k, l, r]) => [k, { l, r }]));
    ARTK = S.ART.map(a => a[0]); FEATK = S.FEATS.map(a => a[0]);
    PAIRS = []; for (let i = 0; i < K; i++) for (let j = i + 1; j < K; j++) PAIRS.push([i, j]);
    NI = PAIRS.length;
    OFF = { icpt: 0, lin: 1, quad: 1 + K, inter: 1 + 2 * K, gap: 1 + 2 * K + NI, art: 3 + 2 * K + NI, feat: 3 + 2 * K + NI + ARTK.length, tag: 3 + 2 * K + NI + ARTK.length + FEATK.length };
  }
  rebuild();
  function configure(o) {
    o = o || {};
    for (const k of ['AXES', 'TAG_CATS', 'ART', 'FEATS', 'EXPECT', 'POP_AXES', 'POP_TAGS', 'TONE_AXES']) if (o[k]) S[k] = o[k];
    if (o.VOCAB) S.VOCAB = Object.assign({}, S.VOCAB, o.VOCAB);
    if (o.TAG_ALIAS) Object.assign(TAG_ALIAS, o.TAG_ALIAS);
    if (o.SIGNALS) for (const k in o.SIGNALS) SIGNALS[k] = Object.assign({}, SIGNALS[k], o.SIGNALS[k]);
    rebuild(); adaptCache = new WeakMap(); REF = null;
    return Taste;
  }

  /* ---------------------------------------------------------------------------
     3. アダプター：studio.html の WORK / FB / HISTORY を内部の形にそろえる
        （スキーマが変わっても、ここだけ直せばよい）
     --------------------------------------------------------------------------- */
  let adaptCache = new WeakMap();
  /* 絵柄の値を 0〜1 に。headRatio は「頭身」2〜8（0=2頭身, 1=8頭身）。古い 0〜1 の headRatio（1=大きな頭）は向きを反転 */
  function artVal(art, k) {
    const v = Number(getP(art, k));
    if (!Number.isFinite(v)) return null;
    if (k === 'headRatio') return v >= 1.5 ? clamp((v - 2) / 6, 0, 1) : clamp(1 - v, 0, 1);
    return clamp(v > 1 && v <= 10 ? v / 10 : v, 0, 1);
  }
  function normTagValue(v) {
    let s = String(v == null ? '' : v).trim(); if (!s) return '';
    try { s = s.normalize('NFKC'); } catch (e) { /* 古い環境 */ }
    s = s.replace(/\s+/g, '').slice(0, 20);
    return TAG_ALIAS[s] || s;
  }
  /* タグを "cat:値" の配列に（{cat:[..]} / ["cat:値"] / ["値"] のどれでも） */
  function normTags(t) {
    const out = new Set();
    if (!t) return [];
    if (Array.isArray(t)) { for (const x of t) { const s = String(x); const i = s.indexOf(':'); if (i > 0) { const v = normTagValue(s.slice(i + 1)); if (v) out.add(s.slice(0, i) + ':' + v); } else { const v = normTagValue(s); if (v) out.add('misc:' + v); } } }
    else if (typeof t === 'object') { for (const c of Object.keys(t)) { const vs = Array.isArray(t[c]) ? t[c] : [t[c]]; for (const x of vs) { const v = normTagValue(x); if (v && v !== 'なし' || (v === 'なし' && c === 'humor')) out.add(c + ':' + v); } } }
    return [...out];
  }
  /* 台本からの特徴（studio.html の scriptFeatures と同じ。work.feat が無いときだけ使う） */
  function scriptFeatures(Sc) {
    const pages = (Sc && Sc.pages) || []; const panels = pages.flatMap(p => p.panels || []), np = Math.max(1, panels.length), npg = Math.max(1, pages.length);
    const says = panels.flatMap(p => p.say || []), chars = says.reduce((a, s) => a + [...String(s.text || '').replace(/\n/g, '')].length, 0);
    const chs = (Sc && Sc.characters) || [];
    const f = {
      dialog: chars / np / 30, sfx: panels.reduce((a, p) => a + (p.sfx || []).length, 0) / npg / 4,
      closeup: panels.filter(p => p.shot === 'up').length / np, cast: (chs.length - 1) / 5,
      narr: panels.filter(p => p.narr).length / np, pages: (pages.length + 1 - 6) / 10, panels: (np / npg - 2) / 4,
      shout: says.filter(s => s.type === 'shout').length / Math.max(1, says.length) * 2.5, think: says.filter(s => s.type === 'think' || s.type === 'mono').length / Math.max(1, says.length) * 3,
      night: panels.filter(p => p.time === 'night' || (p.fx || []).includes('dark')).length / np, fx: panels.reduce((a, p) => a + (p.fx || []).length, 0) / np / 1.5,
      nonhuman: chs.filter(c => c.species && c.species !== 'human').length / Math.max(1, chs.length),
    };
    for (const k in f) f[k] = clamp(f[k], 0, 1);
    return f;
  }
  function expectedArt(axObj) { const o = {}; for (const k in S.EXPECT) o[k] = clamp(S.EXPECT[k](axObj), 0, 1); return o; }
  /* 物語と絵柄のズレ：物語の軸から予想した「王道の絵柄」と実際の絵柄の平均絶対差 ÷ 0.4（studio と同じ定義） */
  function gapOf(axObj, art) {
    if (!art) return null; const ex = expectedArt(axObj); let d = 0, n = 0;
    for (const k in ex) { const v = artVal(art, k); if (v == null) continue; d += Math.abs(v - ex[k]); n++; }
    return n ? clamp(d / n / 0.4, 0, 1) : null;
  }
  function adaptWork(w) {
    if (!w || typeof w !== 'object') return null;
    if (adaptCache.has(w)) return adaptCache.get(w);
    const prof = w.profile || {}; const axSrc = prof.axes || w.axes || {};
    const ax = new Float64Array(K), axObj = {}; let got = 0;
    AX.forEach((k, i) => { let v = Number(axSrc[k]); if (Number.isFinite(v)) { if (v > 1 && v <= 10) v /= 10; v = clamp(v, 0, 1); got++; } else v = 0.5; ax[i] = v; axObj[k] = v; });
    if (got < Math.min(6, K)) { adaptCache.set(w, null); return null; }
    const sc = w.script || {};
    const art = sc.art || w.art || null;
    const artV = new Float64Array(ARTK.length).fill(0.5); let hasArt = false;
    if (art) ARTK.forEach((k, i) => { const v = artVal(art, k); if (v != null) { artV[i] = v; hasArt = true; } });
    if (!hasArt && w.artFeat) ARTK.forEach((k, i) => { const v = Number(w.artFeat[k]); if (Number.isFinite(v)) { artV[i] = clamp(v, 0, 1); hasArt = true; } });
    let gap = art ? gapOf(axObj, art) : null;
    if (gap == null && w.artFeat && Number.isFinite(Number(w.artFeat.gap))) gap = clamp(Number(w.artFeat.gap), 0, 1);
    const fsrc = w.feat || (sc.pages ? scriptFeatures(sc) : {});
    const featV = new Float64Array(FEATK.length).fill(0.5); FEATK.forEach((k, i) => { const v = Number(fsrc[k]); if (Number.isFinite(v)) featV[i] = clamp(v, 0, 1); });
    const pageChars = [0]; (sc.pages || []).forEach(pg => { let c = 0; for (const p of pg.panels || []) { for (const s of p.say || []) c += String(s.text || '').replace(/\n/g, '').length; if (p.narr) c += String(p.narr).length; } pageChars.push(c); });
    const total = sc.pages ? sc.pages.length + 1 : (Number(w.pages) || 0);
    const meta = w.meta || {};
    const out = { id: w.id, ax, axObj, tags: normTags(prof.tags || w.tags), art: artV, hasArt, gap: gap == null ? 0.5 : gap, hasGap: gap != null, feat: featV, pageChars, total, t: Number(meta.createdAt || w.createdAt || 0), title: sc.title || w.title || String(w.id), genre: sc.genre || '', seriesId: meta.seriesId || null, src: w };
    adaptCache.set(w, out);
    return out;
  }
  function adaptFb(f) {
    f = f || {};
    return { liked: !!f.liked, disliked: !!f.disliked, opens: Number(f.opens) || 0, finished: !!f.finished, maxPage: Number(f.maxPage) || 0, dwell: Array.isArray(f.dwell) ? f.dwell.map(Number) : [], rereads: Number(f.rereads) || 0, sequel: !!f.sequel, lastRead: Number(f.lastRead) || 0 };
  }

  /* ---------------------------------------------------------------------------
     4. 信号の統合：生の反応 → 作品ごとの好き度（測定値 m・測定分散 τ・時間の重み d）
     --------------------------------------------------------------------------- */
  function fuse(works, fbs, history, opts) {
    opts = opts || {};
    const now = opts.now != null ? opts.now : Date.now();
    const halfLife = opts.halfLife != null ? opts.halfLife : 40; // 何作前の反応で重みが半分になるか（好みの変化への対応）
    const allow = opts.signals ? new Set(opts.signals) : null; // 検証用：使う信号を絞る
    const list = Array.isArray(works) ? works : Object.values(works || {});
    const hist = Array.isArray(history) ? history : (history && history.items) || [];
    fbs = fbs || {};
    const lastT = {}, lastI = {}; hist.forEach((h, i) => { if (h && h.id != null) { lastT[h.id] = Number(h.t) || 0; lastI[h.id] = i; } });
    const cand = [];
    for (const w of list) {
      const aw = adaptWork(w); if (!aw) continue;
      const fb = adaptFb(fbs[aw.id]);
      if (!(fb.opens > 0 || fb.liked || fb.disliked || fb.sequel)) continue;
      const key = lastT[aw.id] != null ? lastT[aw.id] : fb.lastRead || aw.t;
      cand.push({ aw, fb, key });
    }
    cand.sort((a, b) => a.key - b.key || a.aw.t - b.aw.t);
    const n = cand.length;
    // ---- 読む人の癖：いいね率（押し忘れ・押しすぎの補正に使う） ----
    let fin = 0, lk = 0; for (const c of cand) if (c.fb.finished) { fin++; if (c.fb.liked) lk++; }
    const likeRate = (lk + 0.3 * 4) / (fin + 4);
    // ---- 滞在時間：log(秒) = a + b·log(1+文字数/10) + 残差。a・b は読む人ごとに推定（読む速さの正規化） ----
    const pts = [];
    cand.forEach((c, ci) => { c.fb.dwell.forEach((s, pi) => { if (pi >= 1 && s >= 0.8 && s < 179) pts.push({ ci, x: Math.log(1 + (c.aw.pageChars[pi] || 0) / 10), y: Math.log(s) }); }); });
    let dwellInfo = { used: false, r: 0, pages: pts.length };
    const dz = new Float64Array(n).fill(NaN);
    if (pts.length >= 12) {
      const mx = sum(pts.map(p => p.x)) / pts.length, my = sum(pts.map(p => p.y)) / pts.length;
      let sxy = 0, sxx = 0; for (const p of pts) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; }
      const b = (sxy + 3 * 0.4) / (sxx + 3), a = my - b * mx; // 傾きの事前値 0.4（文字が多いページほど長くいる）
      const per = Array.from({ length: n }, () => []);
      for (const p of pts) per[p.ci].push(p.y - a - b * p.x);
      const dm = []; per.forEach((rs, ci) => { if (rs.length >= 2) { const m = median(rs); dz[ci] = m; dm.push(m); } });
      if (dm.length >= 4) {
        const md = median(dm), sd = Math.max(0.05, 1.4826 * median(dm.map(x => Math.abs(x - md))));
        for (let i = 0; i < n; i++) if (!Number.isNaN(dz[i])) dz[i] = clamp((dz[i] - md) / sd, -2.5, 2.5);
        // 明示の反応との相関から、この人にとっての滞在時間の信頼度を推定（縮小して使う）
        const xs = [], es = [];
        cand.forEach((c, i) => { if (Number.isNaN(dz[i])) return; const e = explicitOf(c.fb, c.aw, true); if (e != null) { xs.push(dz[i]); es.push(e); } });
        const remp = xs.length >= 3 ? pearson(xs, es) / 0.85 : 0;
        const r = clamp((xs.length * remp + 6 * SIGNALS.dwell.r0) / (xs.length + 6), 0, 0.7);
        dwellInfo = { used: r >= 0.05, r, pages: pts.length, slope: b, works: dm.length, calib: xs.length };
      } else for (let i = 0; i < n; i++) dz[i] = NaN;
    }
    // ---- 作品ごとに合成 ----
    const rows = [];
    cand.forEach((c, i) => {
      const { aw, fb } = c; const sig = [];
      if (fb.sequel) sig.push({ k: 'sequel', v: SIGNALS.sequel.v, rho: SIGNALS.sequel.rho, label: SIGNALS.sequel.label });
      if (fb.liked) sig.push({ k: 'like', v: SIGNALS.like.v, rho: SIGNALS.like.rho, label: SIGNALS.like.label });
      if (fb.disliked) sig.push({ k: 'dislike', v: SIGNALS.dislike.v, rho: SIGNALS.dislike.rho, label: SIGNALS.dislike.label });
      if (fb.finished) sig.push({ k: 'finished', v: SIGNALS.finished.v, rho: SIGNALS.finished.rho, label: SIGNALS.finished.label });
      else if (fb.opens > 0 && aw.total > 2) {
        const leftLater = (lastI[aw.id] != null && lastI[aw.id] < hist.length - 1) || cand.slice(i + 1).some(o => o.key > c.key) || (fb.lastRead > 0 && now - fb.lastRead > 30 * 60 * 1000);
        if (leftLater && !fb.liked && !fb.sequel) {
          const prog = clamp((fb.maxPage + 1) / aw.total, 0, 1);
          sig.push({ k: 'abandon', v: SIGNALS.abandon.v0 + SIGNALS.abandon.vSlope * (1 - prog), rho: SIGNALS.abandon.rho, label: `${fb.maxPage + 1}/${aw.total}ページでやめた` });
        }
      }
      if (fb.rereads > 0) sig.push({ k: 'reread', v: SIGNALS.reread.v, rho: SIGNALS.reread.rho * Math.log2(1 + Math.min(fb.rereads, 4)), label: `読み返し${fb.rereads}回` });
      if (fb.finished && !fb.liked && !fb.disliked && !fb.sequel) { const rho = SIGNALS.silent.rhoK * likeRate * likeRate; if (rho > 0.02) sig.push({ k: 'silent', v: SIGNALS.silent.v, rho, label: SIGNALS.silent.label }); }
      if (dwellInfo.used && !Number.isNaN(dz[i])) { const r = dwellInfo.r; sig.push({ k: 'dwell', v: dz[i] / r, rho: r * r / (1 - r * r), label: dz[i] > 0.5 ? '滞在 長め' : dz[i] < -0.5 ? '滞在 短め' : '滞在 ふつう', z: dz[i] }); }
      if (allow) for (let q = sig.length - 1; q >= 0; q--) if (!allow.has(sig[q].k)) sig.splice(q, 1);
      if (!sig.length) return;
      const R = sum(sig.map(s => s.rho)), m = sum(sig.map(s => s.rho * s.v)) / R;
      const age = n - 1 - i; const d = halfLife > 0 && isFinite(halfLife) ? Math.max(0.05, Math.pow(0.5, age / halfLife)) : 1;
      const u = R * m / (1 + R); // 事前 N(0,1) と合わせた好き度（表示用）
      rows.push({ id: aw.id, aw, fb, y: m, tau: 1 / R, info: R, d, u, conf: R / (1 + R), sig, order: i,
        parts: sig.map(s => `${s.label} ${s.v * s.rho / (1 + R) >= 0 ? '+' : '−'}${Math.abs(s.v * s.rho / (1 + R)).toFixed(1)}`) });
    });
    return { rows, reader: { likeRate, dwell: dwellInfo, n: rows.length, halfLife } };
  }
  /* 滞在時間の校正に使う「明示の反応」だけの値 */
  function explicitOf(fb, aw, confirmedOnly) {
    if (fb.sequel) return SIGNALS.sequel.v; if (fb.liked) return SIGNALS.like.v; if (fb.disliked) return SIGNALS.dislike.v;
    if (!fb.finished && fb.opens > 0 && aw.total > 2 && confirmedOnly) return SIGNALS.abandon.v0 + SIGNALS.abandon.vSlope * (1 - clamp((fb.maxPage + 1) / aw.total, 0, 1));
    return null;
  }

  /* ---------------------------------------------------------------------------
     5. 特徴ベクトル
        z = 2(x-0.5) ∈ [-1,1]
        [切片 | 一次 z_k ×20 | 二次 z_k²-1/3 ×20（山型・谷型）| 積 z_i z_j ×190（組み合わせ）
         | ズレ g, g²-1/3 | 絵柄 ×17 | 作り ×12 | タグ（0/1）×T]
     --------------------------------------------------------------------------- */
  const GROUPS = ['icpt', 'lin', 'quad', 'inter', 'gap', 'art', 'feat', 'tag'];
  // 事前分散（u の尺度で）と、経験ベイズの更新でどれくらい事前値に引っぱるか（擬似件数 nu）
  const HYPER = { gmax: 30, fmax: 60, nuFeat: 0.3 }; const ARD_GROUPS = new Set(['lin', 'quad', 'inter']); // nuFeat：軸ごとの ARD を群の値へ引き戻す強さ（検証で 0.3 が最良）
  const PRIOR = { icpt: { s: 1.0, nu: Infinity }, lin: { s: 0.12, nu: 4 }, quad: { s: 0.08, nu: 4 }, inter: { s: 0.02, nu: 12 }, gap: { s: 0.06, nu: 3 }, art: { s: 0.006, nu: 6 }, feat: { s: 0.02, nu: 6 }, tag: { s: 0.05, nu: 6 } };
  function featurize(aw, tagIndex, p) {
    const phi = new Float64Array(p);
    phi[0] = 1;
    const z = new Float64Array(K); for (let k = 0; k < K; k++) z[k] = 2 * (aw.ax[k] - 0.5);
    for (let k = 0; k < K; k++) { phi[OFF.lin + k] = z[k]; phi[OFF.quad + k] = z[k] * z[k] - 1 / 3; }
    for (let q = 0; q < NI; q++) { const [i, j] = PAIRS[q]; phi[OFF.inter + q] = z[i] * z[j]; }
    const g = 2 * (aw.gap - 0.5); phi[OFF.gap] = g; phi[OFF.gap + 1] = g * g - 1 / 3;
    for (let k = 0; k < ARTK.length; k++) phi[OFF.art + k] = 2 * (aw.art[k] - 0.5);
    for (let k = 0; k < FEATK.length; k++) phi[OFF.feat + k] = 2 * (aw.feat[k] - 0.5);
    if (tagIndex) for (const t of aw.tags) { const j = tagIndex.get(t); if (j != null) phi[OFF.tag + j] = 1; }
    return phi;
  }
  function groupOf(j) { if (j === 0) return 'icpt'; if (j < OFF.quad) return 'lin'; if (j < OFF.inter) return 'quad'; if (j < OFF.gap) return 'inter'; if (j < OFF.art) return 'gap'; if (j < OFF.feat) return 'art'; if (j < OFF.tag) return 'feat'; return 'tag'; }

  /* ---------------------------------------------------------------------------
     6. 線形代数（n×n だけを扱う双対形式。p が大きくても n が小さいうちは速い）
     --------------------------------------------------------------------------- */
  function chol(A, n) { // A: Float64Array n*n（上書きしない）→ 下三角 L
    const L = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let s = A[i * n + j]; for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k];
        if (i === j) L[i * n + i] = Math.sqrt(Math.max(s, 1e-10)); else L[i * n + j] = s / L[j * n + j];
      }
    }
    return L;
  }
  function fwd(L, n, b) { const x = new Float64Array(n); for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i * n + k] * x[k]; x[i] = s / L[i * n + i]; } return x; }
  function bwd(L, n, b) { const x = new Float64Array(n); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k]; x[i] = s / L[i * n + i]; } return x; }
  const solveK = (L, n, b) => bwd(L, n, fwd(L, n, b));

  /* ---------------------------------------------------------------------------
     7. 学習：重み付きベイズ回帰（ガウス事前・群ごとの分散を経験ベイズ＝MacKay の更新で推定）
        y_i = φ_i·θ + ε_i,  ε_i ~ N(0, (σ² + τ_i)/d_i)   … τ_i=反応の測定分散, σ²=気分のむら, d_i=時間の重み
        θ_j ~ N(0, s_j)   s_j は群（一次・二次・組み合わせ・…）ごとに推定。一次と二次は軸ごとに ARD（群の値へ縮小）
     --------------------------------------------------------------------------- */
  function fitRows(rows, opts) {
    opts = opts || {};
    const useQuad = opts.quad !== false, useInter = opts.inter !== false, useArd = opts.ard !== false;
    const GMAX = opts.gmax || HYPER.gmax, FMAX = opts.fmax || HYPER.fmax, NU_FEAT = opts.nuFeat || HYPER.nuFeat;
    const tagCount = new Map(); for (const r of rows) for (const t of r.aw.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
    const tagNames = [...tagCount.keys()].sort(); const tagIndex = new Map(tagNames.map((t, i) => [t, i]));
    const p = OFF.tag + tagNames.length, n = rows.length;
    const Phi = rows.map(r => featurize(r.aw, tagIndex, p));
    const y = Float64Array.from(rows.map(r => r.y)), tau = rows.map(r => r.tau), dd = rows.map(r => r.d);
    // 事前分散
    const gs = {}; for (const g of GROUPS) gs[g] = PRIOR[g].s * (opts.priorScale && opts.priorScale[g] != null ? opts.priorScale[g] : 1);
    if (!useQuad) gs.quad = 1e-8; if (!useInter) gs.inter = 1e-8;
    const grp = new Array(p); for (let j = 0; j < p; j++) grp[j] = groupOf(j);
    const s = new Float64Array(p); for (let j = 0; j < p; j++) s[j] = gs[grp[j]];
    let sigma2 = opts.sigma2 != null ? opts.sigma2 : 0.35;
    const iters = n ? (opts.iters != null ? opts.iters : 10) : 0;
    let L = null, alpha = null, mu = new Float64Array(p), B = null, diagS = Float64Array.from(s);
    const noise = () => rows.map((r, i) => Math.min(80, (sigma2 + tau[i]) / dd[i]));
    function solve(computeB) {
      const nz = noise(); const Kmat = new Float64Array(n * n);
      // G = Φ S Φᵀ
      const PS = Phi.map(ph => { const o = new Float64Array(p); for (let j = 0; j < p; j++) o[j] = ph[j] * s[j]; return o; });
      for (let i = 0; i < n; i++) for (let k = 0; k <= i; k++) { let acc = 0; const a = PS[i], b = Phi[k]; for (let j = 0; j < p; j++) acc += a[j] * b[j]; Kmat[i * n + k] = acc; Kmat[k * n + i] = acc; }
      const G = Kmat.slice();
      for (let i = 0; i < n; i++) Kmat[i * n + i] += nz[i];
      L = chol(Kmat, n); alpha = solveK(L, n, y);
      mu = new Float64Array(p); for (let i = 0; i < n; i++) { const a = alpha[i], ps = PS[i]; for (let j = 0; j < p; j++) mu[j] += ps[j] * a; }
      if (computeB) {
        // B = L⁻¹Φ （n×p）、Σ_jj = s_j - s_j² Σ_i B_ij²
        B = new Float64Array(n * p);
        for (let i = 0; i < n; i++) { const row = Phi[i]; for (let j = 0; j < p; j++) { let v = row[j]; for (let k = 0; k < i; k++) v -= L[i * n + k] * B[k * p + j]; B[i * p + j] = v / L[i * n + i]; } }
        diagS = new Float64Array(p); for (let j = 0; j < p; j++) { let a = 0; for (let i = 0; i < n; i++) a += B[i * p + j] ** 2; diagS[j] = Math.max(1e-12, s[j] - s[j] * s[j] * a); }
      }
      return { G, nz };
    }
    for (let it = 0; it <= iters; it++) {
      const { G } = solve(true);
      if (it === iters || !n) break;
      // --- 群ごとの分散（MacKay の固定点 + 事前値への縮小） ---
      const acc = {}; for (const g of GROUPS) acc[g] = { m2: 0, gam: 0, cnt: 0 };
      for (let j = 0; j < p; j++) { const a = acc[grp[j]]; a.m2 += mu[j] * mu[j]; a.gam += clamp(1 - diagS[j] / s[j], 0, 1); a.cnt++; }
      for (const g of GROUPS) {
        if (g === 'icpt' || (g === 'quad' && !useQuad) || (g === 'inter' && !useInter) || !acc[g].cnt) continue;
        const nu = PRIOR[g].nu, s0 = PRIOR[g].s * (opts.priorScale && opts.priorScale[g] != null ? opts.priorScale[g] : 1);
        gs[g] = clamp((acc[g].m2 + nu * s0) / (acc[g].gam + nu), s0 / 40, s0 * GMAX);
      }
      // 組み合わせは「効いている軸どうし」に起こりやすい（遺伝性の原則）：一次・二次の大きい軸ほど積の事前分散の中心を広げる
      const h = new Float64Array(K).fill(1);
      if (useInter && useArd) for (let k = 0; k < K; k++) h[k] = clamp(Math.sqrt((s[OFF.lin + k] + s[OFF.quad + k]) / (gs.lin + gs.quad)), 0.5, 2);
      // 特徴ごとの分散（ARD）：群の値を中心に、特徴ごとの事後から更新（強く効く少数の軸・組み合わせを拾う）
      for (let j = 0; j < p; j++) {
        const g = grp[j]; let center = gs[g];
        if (g === 'inter') { const [a, b] = PAIRS[j - OFF.inter]; center = gs.inter * h[a] * h[b]; }
        if (useArd && ARD_GROUPS.has(g) && !(g === 'quad' && !useQuad) && !(g === 'inter' && !useInter)) {
          const gam = clamp(1 - diagS[j] / s[j], 0, 1);
          s[j] = clamp((mu[j] * mu[j] + NU_FEAT * center) / (gam + NU_FEAT), center / 30, center * FMAX);
        } else s[j] = center;
      }
      // --- 気分のむら σ²（EM：E[(y-φθ)²] = 残差² + 事後分散） ---
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        let f = 0; const ph = Phi[i]; for (let j = 0; j < p; j++) f += ph[j] * mu[j];
        const gi = new Float64Array(n); for (let k = 0; k < n; k++) gi[k] = G[i * n + k];
        const v = fwd(L, n, gi); let h = G[i * n + i]; for (let k = 0; k < n; k++) h -= v[k] * v[k];
        const e = dd[i] * ((y[i] - f) ** 2 + Math.max(0, h)) - tau[i];
        const w = (sigma2 / (sigma2 + tau[i])) ** 2; num += w * e; den += w;
      }
      sigma2 = clamp((num + 4 * 0.35) / (den + 4), 0.04, 3);
    }
    if (!n) { B = new Float64Array(0); alpha = new Float64Array(0); L = new Float64Array(0); diagS = Float64Array.from(s); }
    let logML = 0; for (let i = 0; i < n; i++) logML -= 0.5 * y[i] * alpha[i] + Math.log(L[i * n + i]) + 0.5 * Math.log(2 * Math.PI);
    return { n, p, logML, rows, Phi, y, tau, d: dd, s, gs, sigma2, L, alpha, mu, B, diagS, tagNames, tagIndex, tagCount, opts };
  }
  /* 事後の共分散の一部：Σ_ab = δ s_a − s_a s_b (B_a·B_b) */
  function covAB(M, a, b) { let acc = 0; for (let i = 0; i < M.n; i++) acc += M.B[i * M.p + a] * M.B[i * M.p + b]; return (a === b ? M.s[a] : 0) - M.s[a] * M.s[b] * acc; }
  /* 予測：平均と分散（作品の特徴 φ について） */
  function predictPhi(M, phi) {
    let mean = 0, pv = 0; for (let j = 0; j < M.p; j++) { mean += phi[j] * M.mu[j]; pv += phi[j] * phi[j] * M.s[j]; }
    if (M.n) { const v = new Float64Array(M.n); for (let i = 0; i < M.n; i++) { const ph = M.Phi[i]; let a = 0; for (let j = 0; j < M.p; j++) a += ph[j] * M.s[j] * phi[j]; v[i] = a; } const w = fwd(M.L, M.n, v); for (let i = 0; i < M.n; i++) pv -= w[i] * w[i]; }
    return { mean, var: Math.max(1e-9, pv) };
  }
  /* 事後からの標本（Matheron の規則：θ = θ₀ + SΦᵀK⁻¹(y − Φθ₀ − ε)、θ₀~事前, ε~雑音） */
  function sampleTheta(M, rng) {
    const th = new Float64Array(M.p); for (let j = 0; j < M.p; j++) th[j] = Math.sqrt(M.s[j]) * gauss(rng);
    if (!M.n) return th;
    const r = new Float64Array(M.n);
    for (let i = 0; i < M.n; i++) { const ph = M.Phi[i]; let f = 0; for (let j = 0; j < M.p; j++) f += ph[j] * th[j]; const nz = Math.min(80, (M.sigma2 + M.tau[i]) / M.d[i]); r[i] = M.y[i] - f - Math.sqrt(nz) * gauss(rng); }
    const a = solveK(M.L, M.n, r);
    for (let i = 0; i < M.n; i++) { const ph = M.Phi[i], ai = a[i]; if (!ai) continue; for (let j = 0; j < M.p; j++) th[j] += M.s[j] * ph[j] * ai; }
    return th;
  }

  /* ---------------------------------------------------------------------------
     8. 比較用の「ランダムに作った作品」の分布（studio の randomSeed を真似る。意外な好み・精度の目安に使う）
     --------------------------------------------------------------------------- */
  function randomAxes(r) {
    const a = {}; for (const k of AX) a[k] = r() * 0.7 + 0.15;
    for (let i = 0; i < 4; i++) a[pick(AX, r)] = r() < 0.5 ? r() * 0.15 : 0.85 + r() * 0.15;
    return a;
  }
  function randomWork(r, o) {
    o = o || {};
    const axes = o.axes || randomAxes(r);
    const ex = expectedArt(axes); const art = { line: {} };
    const mismatch = r() < 0.3; // 3割は編集者があえてズラす
    for (const k of ARTK) { const base = ex[k] != null ? ex[k] : 0.5; const v = mismatch ? r() : clamp(base + gauss(r) * 0.12, 0, 1); if (k.startsWith('line.')) art.line[k.slice(5)] = v; else art[k] = v; }
    art.headRatio = 2 + 6 * (art.headRatio != null ? art.headRatio : 0.5);
    const tags = { genre: [pick(S.VOCAB.genre, r)], setting: [pick(S.VOCAB.setting, r)], relation: [pick(S.VOCAB.relation, r)], ending: [pick(S.VOCAB.ending, r)], motif: [...new Set([pick(S.VOCAB.motif, r), pick(S.VOCAB.motif, r)])], humor: [pick(S.VOCAB.humor, r)] };
    const feat = {}; for (const k of FEATK) feat[k] = clamp(0.5 + gauss(r) * 0.2, 0, 1);
    feat.dialog = clamp(0.3 + 0.5 * axes.talky + gauss(r) * 0.1, 0, 1); feat.sfx = clamp(0.2 + 0.5 * axes.action + gauss(r) * 0.1, 0, 1); feat.night = clamp(0.1 + 0.6 * axes.dark + gauss(r) * 0.1, 0, 1);
    return { id: o.id || 'ref' + Math.floor(r() * 1e9), profile: { axes, tags }, script: { art, title: '', pages: [] }, feat, meta: { createdAt: 0 } };
  }
  let REF = null;
  function refWorks() { if (REF) return REF; const r = mulberry32(20261006); REF = []; for (let i = 0; i < 400; i++) REF.push(adaptWork(randomWork(r, { id: 'ref' + i }))); return REF; }

  /* ---------------------------------------------------------------------------
     9. 学習の入口
     --------------------------------------------------------------------------- */
  const HALF_LIVES = [1e9, 40, 15]; let HL_MARGIN = 0;
  function fit(works, fbs, history, opts) {
    opts = opts || {};
    // 好みの変化：古い反応の重みを下げる半減期を、最近の作品での予測の当たり具合で自動選択（∞ / 40作 / 15作）。
    // 30作未満では変化を見分けられないので ∞（ただし opts.halfLife の指定があればそれを使う）
    const fitWith = hl => { const F1 = fuse(works, fbs, history, Object.assign({}, opts, { halfLife: hl })); let rows = F1.rows; if (rows.length > (opts.maxRows || 400)) rows = rows.slice(-(opts.maxRows || 400)); const M1 = fitRows(rows, opts); M1.halfLife = hl; return { M: M1, F: F1 }; };
    let best;
    if (opts.halfLife != null) best = fitWith(opts.halfLife);
    else {
      const base = fuse(works, fbs, history, Object.assign({}, opts, { halfLife: 1e9 }));
      const nAll = base.rows.length;
      if (nAll < 30) best = fitWith(1e9);
      else {
        const m = Math.max(8, Math.round(nAll / 5)); const scores = {};
        for (const hl of HALF_LIVES) {
          // 古い順に並んだ反応のうち、最後の m 作を隠して学習し、その m 作の好き度を当てられるか（対数予測密度）
          const F1 = fuse(works, fbs, history, Object.assign({}, opts, { halfLife: hl }));
          const rows = F1.rows; const train = rows.slice(0, rows.length - m).map(r => Object.assign({}, r, { d: Math.max(0.05, Math.pow(0.5, (rows.length - m - 1 - r.order) / hl)) }));
          const M1 = fitRows(train, Object.assign({}, opts, { iters: 4 }));
          let sc = 0; for (const r of rows.slice(-m)) { const pr = predictPhi(M1, featurize(r.aw, M1.tagIndex, M1.p)); const v = pr.var + M1.sigma2 + r.tau; sc += -0.5 * Math.log(2 * Math.PI * v) - 0.5 * (r.y - pr.mean) ** 2 / v; }
          scores[hl] = sc;
        }
        let hl = 1e9; for (const h of HALF_LIVES) if (scores[h] > scores[hl] + HL_MARGIN) hl = h; // 変化ありと判断する余裕（検証で決めた値）
        best = fitWith(hl); best.M.halfLifeScores = scores;
      }
    }
    const M = best.M, F = best.F;
    M.reader = F.reader;
    M.reliability = reliabilityOf(M);
    return M;
  }
  /* 信頼度（ベイズ R²）：参照作品での「予測の平均のばらつき」÷（それ＋予測の不確かさ）。期待される相関 ≈ √R */
  function reliabilityOf(M) {
    const ref = refWorks(); const means = [], vars = [];
    const step = M.n > 120 ? 4 : 2;
    for (let i = 0; i < ref.length; i += step) { const pr = predictPhi(M, featurize(ref[i], M.tagIndex, M.p)); means.push(pr.mean); vars.push(pr.var); }
    const m = sum(means) / means.length; const vm = sum(means.map(x => (x - m) ** 2)) / means.length; const ev = sum(vars) / vars.length;
    return { R: vm / (vm + ev + 1e-9), varMean: vm, meanVar: ev };
  }

  /* ---------------------------------------------------------------------------
     10. まとめ（分析画面用）
     --------------------------------------------------------------------------- */
  const GRID = Array.from({ length: 21 }, (_, i) => i / 20);
  function axisCurve(b, c) { return GRID.map(x => { const z = 2 * (x - 0.5); return b * z + c * (z * z - 1 / 3); }); }
  function shapeOf(f) {
    let mx = -Infinity, mn = Infinity, imx = 0, imn = 0; f.forEach((v, i) => { if (v > mx) { mx = v; imx = i; } if (v < mn) { mn = v; imn = i; } });
    const range = mx - mn, end = Math.max(f[0], f[f.length - 1]), endMin = Math.min(f[0], f[f.length - 1]);
    if (range < 0.12) return { shape: 'flat', range, ideal: GRID[imx] };
    if (imx >= 3 && imx <= 17 && mx - end > 0.3 * range) return { shape: 'peak', range, ideal: GRID[imx] };
    if (imn >= 3 && imn <= 17 && endMin - mn > 0.3 * range) return { shape: 'valley', range, ideal: f[0] > f[f.length - 1] ? 0 : 1 };
    return { shape: f[f.length - 1] > f[0] ? 'up' : 'down', range, ideal: f[f.length - 1] > f[0] ? 1 : 0 };
  }
  function posteriorSamples(M, nS, seed) { const r = mulberry32(seed || 7); const out = []; for (let i = 0; i < nS; i++) out.push(sampleTheta(M, r)); return out; }

  function summarize(M, opts) {
    opts = opts || {};
    const nS = opts.samples || 120;
    const TH = posteriorSamples(M, nS, 11);
    const rows = M.rows;
    // --- 軸 ---
    const axes = AX.map((k, i) => {
      const bj = OFF.lin + i, cj = OFF.quad + i;
      const fm = axisCurve(M.mu[bj], M.mu[cj]); const sm = shapeOf(fm);
      const effS = [], rangeS = [], idealS = [], shapeCnt = {};
      for (const th of TH) { const f = axisCurve(th[bj], th[cj]); const sh = shapeOf(f); effS.push(f[20] - f[0]); rangeS.push(sh.range); idealS.push(sh.ideal); shapeCnt[sh.shape] = (shapeCnt[sh.shape] || 0) + 1; }
      effS.sort((a, b) => a - b); rangeS.sort((a, b) => a - b); idealS.sort((a, b) => a - b);
      const eff = fm[20] - fm[0];
      const pPos = effS.filter(e => e > 0).length / nS;
      const shapeConf = (shapeCnt[sm.shape] || 0) / nS;
      return { k, label: AXL[k], effect: r2(eff), ci80: [r2(quantile(effS, 0.1)), r2(quantile(effS, 0.9))], pPos: r2(pPos),
        importance: r2(sm.range), importanceCI: [r2(quantile(rangeS, 0.1)), r2(quantile(rangeS, 0.9))],
        shape: sm.shape, shapeConf: r2(shapeConf), ideal: r2(sm.ideal), idealCI: sm.shape === 'peak' ? [r2(quantile(idealS, 0.1)), r2(quantile(idealS, 0.9))] : null,
        curve: fm.filter((_, i2) => i2 % 2 === 0).map(r2), lin: r2(M.mu[bj]), quad: r2(M.mu[cj]) };
    });
    // --- 組み合わせ ---
    const combos = [];
    for (let q = 0; q < NI; q++) {
      const j = OFF.inter + q, m = M.mu[j], sd = Math.sqrt(M.diagS[j]); const P = normCdf(m / sd);
      const [a, b] = PAIRS[q]; let nBoth = 0; for (const r of rows) if (r.aw.ax[a] >= 0.6 && r.aw.ax[b] >= 0.6) nBoth++;
      combos.push({ a: AX[a], b: AX[b], syn: m, sd, p: P, conf: Math.abs(2 * P - 1), nBoth });
    }
    combos.sort((x, y) => Math.abs(y.syn) * y.conf - Math.abs(x.syn) * x.conf);
    const combosTop = combos.filter(c => Math.abs(c.syn) > 0.06 && c.conf > 0.6).slice(0, 6).map(c => ({ ...c, syn: r2(c.syn), sd: r2(c.sd), p: r2(c.p), conf: r2(c.conf),
      text: c.syn > 0 ? `「${AXL[c.a].r}」と「${AXL[c.b].r}」がそろうと特に好き` : `「${AXL[c.a].r}」と「${AXL[c.b].r}」の組み合わせは、むしろ苦手（どちらか片方なら良い）` }));
    // --- 一次の効果（絵柄・作り） ---
    const linStat = (j, nameRow) => { const m = M.mu[j], sd = Math.sqrt(M.diagS[j]), P = normCdf(m / sd); return { key: nameRow[0], name: nameRow[1], l: nameRow[2], r: nameRow[3], effect: r2(2 * m), ci80: [r2(2 * (m - 1.2816 * sd)), r2(2 * (m + 1.2816 * sd))], pPos: r2(P), conf: r2(Math.abs(2 * P - 1)) }; };
    const art = S.ART.map((row, i) => linStat(OFF.art + i, row));
    const feats = S.FEATS.map((row, i) => linStat(OFF.feat + i, row));
    // ズレ（一次＋二次で山型も見る）
    const gf = axisCurve(M.mu[OFF.gap], M.mu[OFF.gap + 1]), gsh = shapeOf(gf);
    const gEff = []; for (const th of TH) { const f = axisCurve(th[OFF.gap], th[OFF.gap + 1]); gEff.push(f[20] - f[0]); } gEff.sort((a, b) => a - b);
    const gp = gEff.filter(e => e > 0).length / nS;
    const gap = { effect: r2(gf[20] - gf[0]), ci80: [r2(quantile(gEff, 0.1)), r2(quantile(gEff, 0.9))], pPos: r2(gp), conf: r2(Math.abs(2 * gp - 1)), shape: gsh.shape, ideal: r2(gsh.ideal),
      text: Math.abs(2 * gp - 1) < 0.5 || gsh.shape === 'flat' ? '王道の組み合わせとズラした組み合わせ、どちらが好きかはまだはっきりしない' : gsh.shape === 'peak' ? '物語と絵柄が「少しだけ」ズレた作品が好き' : gf[20] > gf[0] ? '物語と絵柄をあえてズラした作品が好き' : '物語と絵柄が素直に合った王道の作品が好き' };
    // --- タグ：平滑化した対数オッズ（+1 のラプラス平滑化）＋経験ベイズ縮小 ＋ 回帰の係数 ---
    const tags = tagLogOdds(M);
    // --- 意外な好み ---
    const surprises = surprisesOf(M, TH.slice(0, 50), axes, tags);
    // --- 精度の目安 ---
    const accuracy = accuracyOf(M);
    // --- 信号の内訳 ---
    const counts = { works: rows.length, like: 0, dislike: 0, sequel: 0, finished: 0, abandon: 0, reread: 0 };
    for (const r of rows) { if (r.fb.liked) counts.like++; if (r.fb.disliked) counts.dislike++; if (r.fb.sequel) counts.sequel++; if (r.fb.finished) counts.finished++; if (r.sig.some(s => s.k === 'abandon')) counts.abandon++; if (r.fb.rereads) counts.reread++; }
    const sum0 = { n: rows.length, counts, axes, combos: combosTop, tags, art, gap, feats, surprises, accuracy, sigma2: r2(M.sigma2), reader: { likeRate: r2(M.reader ? M.reader.likeRate : 0), dwell: M.reader ? M.reader.dwell : null }, groupScale: Object.fromEntries(Object.entries(M.gs).map(([k, v]) => [k, Math.round(v * 1000) / 1000])) };
    sum0.oneLiner = oneLiner(sum0);
    return sum0;
  }
  function tagLogOdds(M) {
    const rows = M.rows; const a = rows.map(r => r.d * r.conf * normCdf(r.u / 0.5)), b = rows.map(r => r.d * r.conf * (1 - normCdf(r.u / 0.5)));
    const P = sum(a), N = sum(b); const out = [];
    M.tagNames.forEach((t, ti) => {
      let p = 0, q = 0, cnt = 0; rows.forEach((r, i) => { if (r.aw.tags.includes(t)) { p += a[i]; q += b[i]; cnt++; } });
      const lo = Math.log((p + 1) / (P - p + 1)) - Math.log((q + 1) / (N - q + 1));
      const se = Math.sqrt(1 / (p + 1) + 1 / (P - p + 1) + 1 / (q + 1) + 1 / (N - q + 1));
      const shr = 0.6 / (0.6 + se * se); // 経験ベイズ風の縮小（件数が少ないほど 0 へ）
      const j = OFF.tag + ti, cm = M.mu[j], csd = Math.sqrt(M.diagS[j]);
      out.push({ t, cat: t.split(':')[0], v: t.slice(t.indexOf(':') + 1), lo: r2(lo * shr), loRaw: r2(lo), se: r2(se), z: r2(lo / se), conf: r2(clamp(Math.abs(lo / se) / 2.5, 0, 1)), n: cnt, p: r2(p), q: r2(q), coef: r2(cm), coefP: r2(normCdf(cm / csd)) });
    });
    out.sort((x, y) => y.lo - x.lo);
    return out;
  }
  /* 意外な好み：ランダムに作った作品の分布を「好みで重み付け」したときに、元の分布から大きくずれる領域。
     さらに「一般的な読者（POP）」でも同じずれ方をするものは差し引く（＝あなたならではのずれ）。 */
  function surprisesOf(M, TH, axesSum, tags) {
    const ref = refWorks(); const R = ref.length;
    const PH = ref.map(w => featurize(w, M.tagIndex, M.p));
    const regions = [];
    AX.forEach((k, i) => { regions.push({ kind: 'axis', k, side: 'high', test: w => w.ax[i] > 0.75 }); regions.push({ kind: 'axis', k, side: 'low', test: w => w.ax[i] < 0.25 }); regions.push({ kind: 'axis', k, side: 'mid', test: w => w.ax[i] > 0.38 && w.ax[i] < 0.62 }); });
    for (const [i, j] of PAIRS) { regions.push({ kind: 'combo', a: AX[i], b: AX[j], side: 'hh', test: w => w.ax[i] > 0.6 && w.ax[j] > 0.6 }); }
    regions.push({ kind: 'gap', side: 'high', test: w => w.gap > 0.55 }); regions.push({ kind: 'gap', side: 'low', test: w => w.gap < 0.2 });
    const IND = regions.map(rg => { const ind = new Uint8Array(R); let c = 0; ref.forEach((w, i) => { if (rg.test(w)) { ind[i] = 1; c++; } }); return { ind, base: c / R }; });
    const beta = 1.2;
    const liftUnder = util => { // util: 参照作品ごとの好き度 → 領域ごとの log(重み付き割合 / 元の割合)
      const mx = Math.max(...util); const w = util.map(u => Math.exp(beta * (u - mx))); const W = sum(w);
      return IND.map(({ ind, base }) => { if (base < 0.02) return 0; let a = 0; for (let i = 0; i < R; i++) if (ind[i]) a += w[i]; return Math.log((a / W + 1e-4) / base); });
    };
    const popU = ref.map(w => { let s = 0; AX.forEach((k, i) => { s += (S.POP_AXES[k] || 0) * 2 * (w.ax[i] - 0.5) * 2.5; }); for (const t of w.tags) s += S.POP_TAGS[t] || 0; return s; });
    const popLift = liftUnder(popU);
    const liftS = TH.map(th => liftUnder(PH.map(ph => { let s = 0; for (let j = 0; j < ph.length; j++) if (ph[j]) s += ph[j] * th[j]; return s; })));
    const meanU = PH.map(ph => { let s = 0; for (let j = 0; j < ph.length; j++) if (ph[j]) s += ph[j] * M.mu[j]; return s; });
    const liftM = liftUnder(meanU);
    const items = [];
    regions.forEach((rg, ri) => {
      const ls = liftS.map(l => l[ri]); const pos = ls.filter(x => x - popLift[ri] > 0).length / ls.length;
      const d = liftM[ri] - popLift[ri]; const conf = Math.abs(2 * pos - 1);
      if (Math.abs(d) < 0.25 || conf < 0.6 || liftM[ri] < 0.15) return; // 好き側にずれていて、一般の目安とも違うものだけ
      items.push({ ...rg, test: undefined, lift: r2(liftM[ri]), popLift: r2(popLift[ri]), d: r2(d), conf: r2(conf), base: r2(IND[ri].base), score: Math.abs(d) * conf * (1.2 - IND[ri].base) });
    });
    // タグ：一般には分かれる／人気でないものが好き、または一般に人気のものが苦手
    for (const tg of tags) { const pop = S.POP_TAGS[tg.t] || 0; if (tg.conf < 0.3) continue; if ((tg.lo > 0.4 && pop < 0) || (tg.lo < -0.4 && pop > 0)) items.push({ kind: 'tag', t: tg.t, tg, pop, d: r2(tg.lo - pop), conf: tg.conf, score: Math.abs(tg.lo - pop) * tg.conf * 0.6 }); }
    items.sort((x, y) => y.score - x.score);
    const seen = new Set(), out = [];
    for (const it of items) { const key = it.kind === 'axis' ? 'a:' + it.k : it.kind === 'combo' ? 'c:' + it.a + it.b : it.kind + ':' + (it.t || it.side); if (seen.has(key)) continue; seen.add(key); it.text = surpriseText(it, axesSum); delete it.test; out.push(it); if (out.length >= 6) break; }
    return out;
  }
  function surpriseText(it, axesSum) {
    if (it.kind === 'axis') { const L = AXL[it.k]; const pop = S.POP_AXES[it.k] || 0; if (it.side === 'mid') return `「${L.l}↔${L.r}」は、どちらかに振り切るより「ほどほど」が好き`; const side = it.side === 'high' ? L.r : L.l; return pop && (pop > 0) !== (it.side === 'high') ? `多くの人は「${pop > 0 ? L.r : L.l}」寄りを好みがちですが、あなたは「${side}」が強い作品が好き` : `「${side}」が極端に強い作品が、ふつうよりずっと好き`; }
    if (it.kind === 'combo') return `「${AXL[it.a].r}」と「${AXL[it.b].r}」が両方強い、めずらしい組み合わせが好き`;
    if (it.kind === 'gap') return it.side === 'high' ? '物語と絵柄が大きくズレた作品（例：ゆるい絵で重い話）が好き' : 'ぴったり王道の絵柄で描かれた作品が、とくに好き';
    if (it.kind === 'tag') return it.tg.lo > 0 ? `一般には好みが分かれる「${tagLabel(it.t)}」が好き` : `一般には人気の「${tagLabel(it.t)}」が、あなたは苦手`;
    return '';
  }
  const tagLabel = t => { const i = t.indexOf(':'); const c = t.slice(0, i), v = t.slice(i + 1); return `${S.TAG_CATS[c] || c}：${v}`; };

  /* 精度の目安：検証（tests/taste-sim.js）で測った学習曲線と、いまの信頼度 R から */
  // 検証で測った「ランダムな2作のどちらが好きかを当てる率」（6種類の架空の読者の中央値）。taste-sim.js の結果で更新する
  const CURVE = [{ n: 0, pair: 0.50 }, { n: 5, pair: 0.58 }, { n: 10, pair: 0.63 }, { n: 20, pair: 0.69 }, { n: 40, pair: 0.74 }, { n: 80, pair: 0.78 }, { n: 160, pair: 0.81 }];
  const C_PROJ = 6; // 事後分散 ∝ 1/(n + c) の c（検証で合わせた値）
  function accuracyOf(M) {
    const R = M.reliability ? M.reliability.R : 0; const rho = Math.sqrt(Math.max(0, R));
    const pair = 0.5 + Math.asin(clamp(rho, 0, 1)) / Math.PI; // 二変量正規での「2作の順番を当てる率」
    const nEff = sum(M.rows.map(r => r.d * r.conf)) / 0.75; // 信号が強い作品ほど 1 作に近い
    const proj = target => { // R が target になるまで、あと何作か
      if (R >= target) return 0; const ev = 1 - R; const need = (nEff + C_PROJ) * ev / (1 - target) - C_PROJ; return Math.max(1, Math.ceil(need - nEff));
    };
    const ahead = [5, 10, 20, 40].map(add => { const ev = (1 - R) * (nEff + C_PROJ) / (nEff + add + C_PROJ); const rr = Math.sqrt(1 - ev); return { more: add, pair: r2(0.5 + Math.asin(clamp(rr, 0, 1)) / Math.PI), R: r2(1 - ev) }; });
    return { R: r2(R), expectedCorr: r2(rho), pairwise: r2(pair), nEff: r2(nEff), moreFor80: proj(0.8), moreFor60: proj(0.6), ahead, curve: CURVE };
  }

  /* 「あなたの好みを一言で」：ルールで作る短い日本語 */
  function oneLiner(sm) {
    if (sm.n < 3) return `まだ好みを探っている途中です（あと${Math.max(1, 3 - sm.n)}作ほど読むと見えてきます）`;
    const parts = [];
    const cmb = sm.combos.find(c => c.syn > 0 && c.conf > 0.75);
    if (cmb) parts.push(`「${AXL[cmb.a].r}×${AXL[cmb.b].r}」に弱い`);
    const strong = sm.axes.filter(a => a.shape !== 'flat' && a.shapeConf > 0.55 && a.importance > 0.3 && (a.shape === 'peak' || Math.abs(2 * a.pPos - 1) > 0.7)).sort((x, y) => y.importance - x.importance);
    for (const a of strong) {
      if (parts.length >= 3) break; if (cmb && (a.k === cmb.a || a.k === cmb.b) && a.shape !== 'peak') continue;
      const L = a.label;
      if (a.shape === 'peak') parts.push(`${L.r}は${a.ideal < 0.42 ? 'ひかえめ' : a.ideal > 0.58 ? '強め' : 'ほどほど'}派`);
      else if (a.shape === 'valley') parts.push(`${L.l}か${L.r}か、振り切った作品が好き`);
      else if (a.shape === 'up') parts.push(`${L.r}${/[いさ]$/.test(L.r) ? '' : '多め'}好き`);
      else parts.push(`${L.l}寄りが好き`);
    }
    if (sm.gap && sm.gap.conf > 0.7 && sm.gap.shape !== 'flat') parts.push(sm.gap.effect > 0 ? '絵と話のギャップ好き' : '王道の絵柄好き');
    const tl = sm.tags.filter(t => t.lo > 0.35 && t.conf > 0.35)[0], td = sm.tags.filter(t => t.lo < -0.35 && t.conf > 0.35).slice(-1)[0];
    let s = parts.slice(0, 3).join('、');
    const tagBits = []; if (tl) tagBits.push(`${tl.v}が好き`); if (td) tagBits.push(`${td.v}は苦手`);
    if (tagBits.length) s += (s ? '。' : '') + tagBits.join('、');
    if (!s) return 'いろいろな作品を楽しめる、好みの幅が広い読み手です（まだ強い傾向は出ていません）';
    return s + '。';
  }

  /* ---------------------------------------------------------------------------
     11. 次に作る作品の狙い（トンプソン抽出で「当てに行く」と「探しに行く」を両立）
     --------------------------------------------------------------------------- */
  const LAMBDA = 0.05; // 軸を極端に振りすぎないための弱い罰則（効かない軸は 0.5＝おまかせ に残る）
  function optimizeAxes(th, fix, rng) {
    const z = new Float64Array(K); const fixed = new Array(K).fill(false);
    if (fix) AX.forEach((k, i) => { if (fix[k] != null) { z[i] = 2 * (clamp(fix[k], 0, 1) - 0.5); fixed[i] = true; } });
    const vals = []; for (let g = 0.05; g <= 0.951; g += 0.05) vals.push(2 * (g - 0.5));
    const order = AX.map((_, i) => i);
    for (let sweep = 0; sweep < 4; sweep++) {
      if (rng) for (let i = K - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      let moved = false;
      for (const k of order) {
        if (fixed[k]) continue;
        const b = th[OFF.lin + k], c = th[OFF.quad + k]; let cross = 0;
        for (let q = 0; q < NI; q++) { const [i, j] = PAIRS[q]; if (i === k) cross += th[OFF.inter + q] * z[j]; else if (j === k) cross += th[OFF.inter + q] * z[i]; }
        let best = z[k], bv = -Infinity;
        for (const v of vals) { const u = b * v + c * (v * v - 1 / 3) + cross * v - LAMBDA * v * v; if (u > bv + 1e-12) { bv = u; best = v; } }
        if (best !== z[k]) { z[k] = best; moved = true; }
      }
      if (!moved) break;
    }
    return z;
  }
  function axisUtility(th, z) { let u = 0; for (let k = 0; k < K; k++) u += th[OFF.lin + k] * z[k] + th[OFF.quad + k] * (z[k] * z[k] - 1 / 3); for (let q = 0; q < NI; q++) { const [i, j] = PAIRS[q]; u += th[OFF.inter + q] * z[i] * z[j]; } return u; }
  const TARGET_CATS = [['genre', 1], ['setting', 1], ['relation', 1], ['ending', 1], ['motif', 2], ['humor', 1]];
  function chooseTags(M, th, rng, mode, explore) {
    const out = {}; const tagS = M.gs.tag;
    for (const [cat, k] of TARGET_CATS) {
      const known = M.tagNames.filter(t => t.startsWith(cat + ':'));
      const vocab = (S.VOCAB[cat] || []).map(v => cat + ':' + normTagValue(v)).filter(t => !M.tagIndex.has(t));
      // 探索の候補は毎回いくつかに絞る（候補が多いカテゴリで、未知のタグばかり選ばれるのを防ぐ）
      const unk = []; const pool = vocab.slice(); const m = Math.min(pool.length, mode === 'greedy' ? 0 : 4);
      for (let i = 0; i < m; i++) { const j = Math.floor(rng() * pool.length); unk.push(pool.splice(j, 1)[0]); }
      const sc = [];
      for (const t of known) sc.push({ t, s: th[OFF.tag + M.tagIndex.get(t)], known: true, mean: M.mu[OFF.tag + M.tagIndex.get(t)] });
      for (const t of unk) sc.push({ t, s: mode === 'greedy' ? 0 : Math.sqrt(tagS) * gauss(rng) * explore, known: false, mean: 0 });
      if (mode === 'greedy' && !sc.length) for (const t of vocab.slice(0, 3)) sc.push({ t, s: -1e-6 * rng(), known: false, mean: 0 });
      sc.sort((a, b) => b.s - a.s);
      out[cat] = sc.slice(0, k);
    }
    return out;
  }
  function target(M, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random; const mode = opts.mode || 'ts'; const explore = opts.explore != null ? opts.explore : 1;
    const mix = th => { if (explore === 1) return th; const o = new Float64Array(M.p); for (let j = 0; j < M.p; j++) o[j] = M.mu[j] + explore * (th[j] - M.mu[j]); return o; };
    const th = mode === 'greedy' ? M.mu : mix(sampleTheta(M, rng));
    const z = optimizeAxes(th, opts.fixAxes, rng), zg = optimizeAxes(M.mu, opts.fixAxes, null);
    const tg = chooseTags(M, th, rng, mode, explore);
    // 各軸の大事さ：その軸を 0.5 に戻すと（平均の好みで）どれだけ損するか
    const u0 = axisUtility(M.mu, z);
    const axes = {}; const exploredAxes = [];
    AX.forEach((k, i) => {
      const zz = Float64Array.from(z); zz[i] = 0; const gain = u0 - axisUtility(M.mu, zz);
      const sd = Math.sqrt(M.diagS[OFF.lin + i] + M.diagS[OFF.quad + i]);
      const value = r2(0.5 + z[i] / 2), greedy = r2(0.5 + zg[i] / 2);
      const explored = mode !== 'greedy' && Math.abs(value - greedy) >= 0.2;
      if (explored) exploredAxes.push(k);
      axes[k] = { value, greedy, gain: r2(gain), sd: r2(sd), role: explored ? 'explore' : gain > 0.05 ? 'aim' : gain < -0.02 ? 'explore' : 'free' };
    });
    // 探索の割合：狙い値のうち「不確かさで動いた分」の比（軸）と、未知・非最良のタグの比
    let dEx = 0, dEq = 0; for (let k = 0; k < K; k++) { dEx += Math.abs(z[k] - zg[k]); dEq += Math.abs(zg[k]); }
    const axisShare = dEx / (dEx + dEq + 1e-9);
    const tagList = Object.values(tg).flat(); const tagShare = tagList.length ? tagList.filter(x => !x.known || x.mean <= 0.02).length / tagList.length : 1;
    const rate = r2(0.7 * axisShare + 0.3 * tagShare);
    // 避けたいもの
    const tagsLO = tagLogOdds(M);
    const avoidTags = tagsLO.filter(t => t.lo < -0.3 && (t.z < -1.2 || t.coefP < 0.15)).slice(-4).reverse();
    const likeTags = tagsLO.filter(t => t.lo > 0.3 && (t.z > 1.2 || t.coefP > 0.85)).slice(0, 4);
    const negCombos = []; const posCombos = [];
    for (let q = 0; q < NI; q++) { const j = OFF.inter + q, m = M.mu[j], P = normCdf(m / Math.sqrt(M.diagS[j])); const [a, b] = PAIRS[q]; if (m > 0.08 && P > 0.85) posCombos.push({ a: AX[a], b: AX[b], m }); if (m < -0.08 && P < 0.15) negCombos.push({ a: AX[a], b: AX[b], m }); }
    posCombos.sort((x, y) => y.m - x.m); negCombos.sort((x, y) => x.m - y.m);
    // 作りのヒント（台本から計算する特徴）と、絵柄の参考
    const craft = {}; FEATK.forEach((k, i) => { const m = M.mu[OFF.feat + i], P = normCdf(m / Math.sqrt(M.diagS[OFF.feat + i])); if (P > 0.85 || P < 0.15) craft[k] = r2(clamp(0.5 + Math.sign(m) * 0.25, 0, 1)); });
    const artHints = artHintsOf(M);
    const tgt = {
      axes, tags: Object.fromEntries(Object.entries(tg).map(([c, l]) => [c, l.map(x => ({ v: x.t.slice(c.length + 1), known: x.known, mean: r2(x.mean) }))])),
      include: likeTags.map(t => t.t), avoid: avoidTags.map(t => t.t), avoidCombos: negCombos.slice(0, 2).map(c => [c.a, c.b]), combos: posCombos.slice(0, 2).map(c => [c.a, c.b]),
      craft, art: { hints: artHints, note: '絵柄は編集者のセンスで決める。ここは参考情報だけ' },
      explore: { rate, axisShare: r2(axisShare), tagShare: r2(tagShare), axes: exploredAxes, tags: tagList.filter(x => !x.known).map(x => x.t) },
      mode,
    };
    const ph = phiFromTarget(M, tgt); const pr = predictPhi(M, ph);
    tgt.predicted = { mean: r2(pr.mean), sd: r2(Math.sqrt(pr.var)), fit: Math.round(100 * normCdf(pr.mean / Math.sqrt(pr.var + M.sigma2))) };
    tgt.brief = briefOf(tgt);
    return tgt;
  }
  function phiFromTarget(M, tgt) {
    const axObj = {}; for (const k of AX) axObj[k] = tgt.axes[k].value;
    const tags = {}; for (const c in tgt.tags) tags[c] = tgt.tags[c].map(x => x.v);
    const aw = adaptWork({ id: '_t', profile: { axes: axObj, tags } }); return featurize(aw, M.tagIndex, M.p);
  }
  function artHintsOf(M) {
    const out = [];
    const gm = M.mu[OFF.gap], gP = normCdf(gm / Math.sqrt(M.diagS[OFF.gap]));
    if (gP > 0.8) out.push(`物語と絵柄をあえてズラした作品に反応が良い（確信度${Math.round(Math.abs(2 * gP - 1) * 100)}%）`);
    else if (gP < 0.2) out.push(`物語と絵柄が素直に合った王道の作品に反応が良い（確信度${Math.round(Math.abs(2 * gP - 1) * 100)}%）`);
    const cand = S.ART.map(([k, name, l, r], i) => { const m = M.mu[OFF.art + i], P = normCdf(m / Math.sqrt(M.diagS[OFF.art + i])); return { name, l, r, m, P, c: Math.abs(2 * P - 1) }; }).filter(x => x.c > 0.6).sort((a, b) => Math.abs(b.m) * b.c - Math.abs(a.m) * a.c).slice(0, 3);
    for (const x of cand) out.push(`${x.name}は「${x.m > 0 ? x.r : x.l}」寄りの作品に反応が良い（確信度${Math.round(x.c * 100)}%）`);
    return out;
  }
  function levelWord(v) { return v < 0.25 ? 'かなり控えめ' : v < 0.4 ? '控えめ' : v <= 0.6 ? 'ほどほど' : v <= 0.75 ? '強め' : 'かなり強め'; }
  function briefOf(t) {
    const aim = AX.filter(k => t.axes[k].role === 'aim').sort((a, b) => t.axes[b].gain - t.axes[a].gain).slice(0, 6);
    const ex = t.explore.axes.slice(0, 2);
    const A = [];
    if (aim.length) A.push('物語の味：' + aim.map(k => `${AXL[k].r}は${levelWord(t.axes[k].value)}（${t.axes[k].value.toFixed(2)}）`).join('、') + '。');
    if (t.combos.length) A.push('組み合わせ：' + t.combos.map(([a, b]) => `${AXL[a].r}と${AXL[b].r}を両方しっかり`).join('、') + '。');
    const inc = t.include.map(x => tagLabel(x)); if (inc.length) A.push('入れたい要素：' + inc.join('、') + '。');
    const av = t.avoid.map(x => tagLabel(x)).concat(t.avoidCombos.map(([a, b]) => `${AXL[a].r}×${AXL[b].r}の組み合わせ`)); if (av.length) A.push('避けたいもの：' + av.join('、') + '。');
    const ch = { dialog: v => v > 0.5 ? 'セリフ多めで会話を楽しませる' : 'セリフは少なめで絵で見せる', closeup: v => v > 0.5 ? '表情のアップを多めに' : '引きの絵を多めに', narr: v => v > 0.5 ? 'ナレーション多め' : 'ナレーション控えめ', panels: v => v > 0.5 ? 'コマは細かく' : '大ゴマを活かす', sfx: v => v > 0.5 ? '効果音を多めに' : '効果音は控えめ', night: v => v > 0.5 ? '夜の場面を多めに' : '昼の場面中心', nonhuman: v => v > 0.5 ? '人間以外のキャラを中心に' : '人間中心', pages: v => v > 0.5 ? '長め' : '短め', cast: v => v > 0.5 ? '登場人物は多め' : '登場人物は少なめ', shout: v => v > 0.5 ? 'にぎやかに' : '静かに', think: v => v > 0.5 ? '心の声を多めに' : '心の声は控えめ', fx: v => v > 0.5 ? '演出は派手に' : '演出は控えめ' };
    const cr = Object.entries(t.craft).map(([k, v]) => ch[k] ? ch[k](v) : '').filter(Boolean); if (cr.length) A.push('作り：' + cr.join('、') + '。');
    if (ex.length) A.push('今回の冒険：' + ex.map(k => `${AXL[k].r}を${t.axes[k].value.toFixed(2)}に`).join('、') + '（まだ好みが分からないので試す）。');
    A.push('ほかの軸は作者におまかせ。');
    const E = ['絵柄は編集者のセンスで決めてください。以下は読者の反応から見た参考情報です。'];
    if (t.art.hints.length) E.push(...t.art.hints.map(h => '・' + h)); else E.push('・絵柄の好みは、まだはっきりしていません。自由に冒険してください。');
    return { author: A.join(''), editor: E.join('\n') };
  }
  /* トーンの言葉を、狙いの軸に一番近いものに */
  function toneFor(axObj, rng) {
    let best = null, bv = Infinity;
    for (const [tone, m] of Object.entries(S.TONE_AXES)) { let d = 0; for (const k in m) d += (m[k] - (axObj[k] != null ? axObj[k] : 0.5)) ** 2; d = d / Object.keys(m).length + rng() * 0.01; if (d < bv) { bv = d; best = tone; } }
    return best || pick(S.VOCAB.tone, rng);
  }

  /* ---------------------------------------------------------------------------
     12. studio.html との約束（ANALYSIS の形）
     --------------------------------------------------------------------------- */
  function analyze(works, fbs, history, opts) {
    opts = opts || {};
    const M = fit(works, fbs, history, opts);
    const sm = summarize(M, opts);
    const rows = M.rows;
    const compat = st => ({ pref: clamp(st.effect / 4, -0.5, 0.5), conf: clamp(st.conf != null ? st.conf : Math.abs(2 * st.pPos - 1), 0, 1) });
    const likedMean = (get) => { let a = 0, w = 0, b = 0, wb = 0; for (const r of rows) { const x = get(r), q = r.d * r.conf * normCdf(r.u / 0.5); a += q * x; w += q; b += r.d * x; wb += r.d; } return { likedMean: w > 0 ? r2(a / w) : 0.5, base: wb > 0 ? r2(b / wb) : 0.5 }; };
    const axesC = {};
    sm.axes.forEach((a, i) => {
      const lm = likedMean(r => r.aw.ax[i]);
      const conf = a.shape === 'peak' ? a.shapeConf : Math.abs(2 * a.pPos - 1);
      axesC[a.k] = { pref: clamp(a.effect / 4, -0.5, 0.5), conf: r2(conf), likedMean: a.shape === 'peak' ? a.ideal : lm.likedMean, base: lm.base, shape: a.shape, ideal: a.ideal, importance: a.importance, ci80: a.ci80, effect: a.effect };
    });
    const featsC = {}; sm.feats.forEach((f, i) => { featsC[f.key] = { ...compat(f), ...likedMean(r => r.aw.feat[i]), effect: f.effect, ci80: f.ci80 }; });
    const artC = {}; sm.art.forEach((f, i) => { artC[f.key] = { ...compat(f), ...likedMean(r => r.aw.art[i]), effect: f.effect, ci80: f.ci80 }; });
    artC.gap = { pref: clamp(sm.gap.effect / 4, -0.5, 0.5), conf: sm.gap.conf, ...likedMean(r => r.aw.gap), shape: sm.gap.shape, effect: sm.gap.effect, ci80: sm.gap.ci80 };
    const combos = sm.combos.map(c => ({ a: c.a, b: c.b, syn: c.syn, nBoth: c.nBoth, conf: c.conf, text: c.text }));
    const unique = [];
    for (const s of sm.surprises) {
      if (s.kind === 'axis' && s.side !== 'mid' && axesC[s.k] && Math.abs(axesC[s.k].pref) > 0.01 && Math.sign(axesC[s.k].pref) === (s.side === 'high' ? 1 : -1)) unique.push({ kind: 'axis', k: s.k, s: axesC[s.k], d: s.d, text: s.text });
      else if (s.kind === 'tag') unique.push({ kind: 'tag', tg: s.tg, pop: s.pop, text: s.text });
    }
    const acc = sm.accuracy;
    const nPos = rows.filter(r => r.u > 0.3).length, nNeg = rows.filter(r => r.u < -0.3).length;
    return {
      version: VERSION, n: rows.length, nPos, nNeg, avgConf: acc.R, more: acc.moreFor80 || null,
      axes: axesC, feats: featsC, art: artC, tags: sm.tags, combos, unique: unique.slice(0, 4),
      rows: rows.map(r => ({ w: r.aw.src, r: r2(2 * r.u), u: r2(r.u), conf: r2(r.conf), weight: r2(r.d), parts: r.parts })),
      summary: sm, oneLiner: sm.oneLiner, accuracy: acc, model: M,
    };
  }
  function modelOf(A) { return A && A.model ? A.model : A && A.mu ? A : null; }
  /* SEED の pref 部分（studio.html の prefSeed と同じ形 ＋ aim / brief / tasteNote） */
  function prefSeed(A, rand, opts) {
    const M = modelOf(A) || fitRows([], {}); const rng = typeof rand === 'function' ? rand : Math.random;
    const t = target(M, Object.assign({ rng }, opts || {}));
    const axObj = {}; for (const k of AX) axObj[k] = t.axes[k].value;
    const one = (c, fallback) => (t.tags[c] && t.tags[c][0] ? t.tags[c][0].v : pick(fallback, rng));
    const pagesPref = t.craft.pages != null ? (t.craft.pages > 0.5 ? 11 : 8) : 8 + Math.floor(rng() * 5);
    return {
      mode: 'pref', genre: one('genre', S.VOCAB.genre), setting: one('setting', S.VOCAB.setting), hero: pick(S.VOCAB.hero, rng), relation: one('relation', S.VOCAB.relation),
      conflict: pick(S.VOCAB.conflict, rng), tone: toneFor(axObj, rng), ending: one('ending', S.VOCAB.ending), gimmick: pick(S.VOCAB.gimmick, rng),
      motifs: (t.tags.motif || []).map(x => x.v), pages: pagesPref, axes: axObj,
      likes: t.include.map(tagLabel), avoid: t.avoid.map(tagLabel).concat(t.avoidCombos.map(([a, b]) => `${AXL[a].r}×${AXL[b].r}の組み合わせ`)),
      combo: t.combos.map(([a, b]) => `${AXL[a].r}と${AXL[b].r}を両方強く`), craft: t.craft, artHints: t.art.hints,
      explore: t.explore.tags.map(x => x.slice(x.indexOf(':') + 1)).concat(t.explore.axes.map(k => AXL[k].r)), shifted: t.explore.axes,
      exploreRate: t.explore.rate, aim: t, tasteNote: t.brief.author, editorNote: t.brief.editor,
    };
  }
  /* 好み度の予測（0〜100）：好き度 u > 0 になる確率 */
  function predict(A, workOrProfile, art) {
    const M = modelOf(A); if (!M) return null;
    let w = workOrProfile; if (!w) return null;
    if (!w.profile && w.axes) w = { id: '_p', profile: w, script: art ? { art } : undefined };
    else if (art && w.profile && !(w.script && w.script.art)) w = Object.assign({}, w, { script: Object.assign({}, w.script || {}, { art }) });
    const aw = adaptWork(w); if (!aw) return null;
    const pr = predictPhi(M, featurize(aw, M.tagIndex, M.p));
    return { mean: r2(pr.mean), sd: r2(Math.sqrt(pr.var)), fit: Math.round(100 * normCdf(pr.mean / Math.sqrt(pr.var + M.sigma2))) };
  }
  function predictFit(A, profile, art) { const M = modelOf(A); if (!M || !M.n) return null; const p = predict(A, profile, art); return p ? p.fit : null; }

  /* Claude に言葉で分析してもらうためのデータ（JSON にできる素のオブジェクト） */
  function forClaude(A, opts) {
    opts = opts || {};
    const sm = A && A.summary ? A.summary : summarize(modelOf(A));
    const rows = (A && A.model ? A.model.rows : []);
    const ax = sm.axes.filter(a => a.shape !== 'flat' || Math.abs(2 * a.pPos - 1) > 0.5).sort((x, y) => y.importance - x.importance).map(a => ({
      axis: `${a.label.l}↔${a.label.r}`, shape: { up: `${a.label.r}が強いほど好き`, down: `${a.label.l}寄りほど好き`, peak: `ほどほど（${a.ideal}あたり）が好き`, valley: 'どちらかに振り切った方が好き', flat: 'はっきりしない' }[a.shape],
      strength: a.importance, shapeConfidence: a.shapeConf, effect01: a.effect, ci80: a.ci80 }));
    const sorted = rows.slice().sort((a, b) => b.u - a.u);
    const ex = r => ({ title: r.aw.title, genre: r.aw.genre, liking: r2(r.u), signals: r.sig.map(s => s.label), tags: r.aw.tags.slice(0, 6).map(tagLabel) });
    return {
      howToRead: '好き度は作品ごとに -2〜+2 くらい（0=ふつう）。strength は軸を0→1に動かしたときの好き度の振れ幅。confidence は 0〜1。ci80 は80%の確信区間。',
      worksReacted: sm.n, signalCounts: sm.counts, accuracy: { expectedCorrelation: sm.accuracy.expectedCorr, pairwise: sm.accuracy.pairwise, moreWorksFor80: sm.accuracy.moreFor80 },
      oneLiner: sm.oneLiner, axes: ax.slice(0, opts.maxAxes || 12),
      combos: sm.combos.map(c => ({ pair: `${AXL[c.a].r}×${AXL[c.b].r}`, meaning: c.text, strength: c.syn, confidence: c.conf })),
      likedTags: sm.tags.filter(t => t.lo > 0.2).slice(0, 8).map(t => ({ tag: tagLabel(t.t), smoothedLogOdds: t.lo, confidence: t.conf, works: t.n })),
      dislikedTags: sm.tags.filter(t => t.lo < -0.2).slice(-8).reverse().map(t => ({ tag: tagLabel(t.t), smoothedLogOdds: t.lo, confidence: t.conf, works: t.n })),
      surprises: sm.surprises.map(s => s.text),
      artReference: { gap: sm.gap.text, params: sm.art.filter(a => a.conf > 0.6).map(a => `${a.name}：${a.effect > 0 ? a.r : a.l}寄りに反応が良い（確信度${Math.round(a.conf * 100)}%）`), note: '絵柄は編集者のセンスに任せる。参考情報' },
      craft: sm.feats.filter(f => f.conf > 0.6).map(f => `${f.name}：${f.effect > 0 ? f.r : f.l}寄りが好き`),
      moodVariance: sm.sigma2, topWorks: sorted.slice(0, 5).map(ex), bottomWorks: sorted.slice(-5).reverse().filter(r => r.u < 0).map(ex),
    };
  }

  const Taste = {
    VERSION, configure, SIGNALS, PRIOR, schema: S,
    // 入口（studio.html の約束）
    analyze, prefSeed, predictFit,
    // 部品
    adaptWork, adaptFb, fuse, fit, summarize, target, predict, forClaude, oneLiner,
    // 検証・道具
    randomWork, randomAxes, rng: mulberry32, util: { spearman, pearson, normCdf, gauss, featurize, predictPhi, sampleTheta, fitRows, tagLabel, gapOf, expectedArt },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Taste;
  if (root) root.Taste = Taste;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);

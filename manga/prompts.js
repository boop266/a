/* =========================================================
   manga/prompts.js — 漫画工房の「企画・脚本」担当
   Claude に「作者」と「編集者」を演じさせる指示文と、ネタの元になる種の表。
   ・グローバル window.MangaPrompts で公開（Node でも require できる）
   ・studio.html の台本スキーマ（species / pose / bg / fx …）と art パラメータに合わせてある
   ・DOM を使わない純粋な関数だけ。乱数は rng()（0〜1 を返す関数）を渡す
   ========================================================= */
(function (root) {
'use strict';

const VERSION = '1.0.0';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const arr = v => Array.isArray(v) ? v : v == null || v === '' ? [] : [v];
const str = (v, n) => String(v == null ? '' : v).slice(0, n);

/* ---------- 乱数 ---------- */
function makeRng(seed) {
  let t = (Number(seed) || 0) >>> 0;
  return () => { t += 0x6D2B79F5; let x = t; x = Math.imul(x ^ x >>> 15, x | 1); x ^= x + Math.imul(x ^ x >>> 7, x | 61); return ((x ^ x >>> 14) >>> 0) / 4294967296; };
}
function asRng(r) { if (typeof r === 'function') return r; if (r != null && Number.isFinite(Number(r))) return makeRng(Number(r)); return Math.random; }
const pickR = (a, r) => a[Math.floor(r() * a.length)];
function pickN(a, n, r) { const pool = a.slice(), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); return out; }

/* =========================================================
   描画エンジンが描けるもの（studio.html の定数の写し）
   studio 側が変わったら setVocab() で上書きできる
   ========================================================= */
const VOCAB = {
  species: ['human', 'cat', 'dog', 'rabbit', 'bear', 'bird', 'fox', 'mouse', 'frog', 'panda', 'tanuki', 'penguin', 'lion', 'robot', 'ghost', 'cloud', 'star', 'monster', 'slime', 'alien'],
  age: ['child', 'teen', 'adult', 'elder'],
  body: ['slim', 'normal', 'round', 'tall'],
  hair: ['short', 'bob', 'long', 'ponytail', 'twintail', 'spiky', 'bun', 'curly', 'bald', 'braid', 'messy'],
  hairColor: ['black', 'white', 'tone', 'light'],
  eyes: ['round', 'sharp', 'sleepy', 'dot', 'sparkle', 'narrow'],
  outfit: ['tshirt', 'shirt', 'suit', 'dress', 'uniform', 'sailor', 'kimono', 'armor', 'labcoat', 'hoodie', 'robe', 'apron', 'jersey', 'spacesuit', 'none'],
  pattern: ['white', 'black', 'tone', 'light', 'stripe', 'dots', 'check', 'star'],
  worn: ['glasses', 'sunglasses', 'hat', 'fedora', 'cap', 'crown', 'helmet', 'headband', 'scarf', 'ribbon', 'cape', 'mask', 'eyepatch', 'beard', 'mustache', 'bowtie', 'necklace', 'hairflower', 'bandage', 'horns', 'halo', 'wings', 'headphones', 'earmuffs'],
  held: ['sword', 'staff', 'wand', 'book', 'umbrella', 'bag', 'flower', 'phone', 'cup', 'lantern', 'letter', 'ball', 'blaster', 'shield', 'food', 'mic', 'key', 'camera', 'fishingrod', 'broom', 'bouquet', 'map', 'box', 'guitar', 'sweets'],
  bodyColor: ['white', 'gray', 'dark', 'tone'],
  shot: ['up', 'bust', 'full', 'long', 'bg'],
  bg: ['room', 'classroom', 'office', 'kitchen', 'cafe', 'washitsu', 'hospital', 'lab', 'library', 'station', 'street', 'shopping', 'park', 'forest', 'beach', 'mountain', 'field', 'sky', 'space', 'spaceship', 'castle', 'throne', 'cave', 'shrine', 'desert', 'underwater', 'rooftop', 'edo', 'gym', 'stage', 'plain', 'tone', 'black', 'flowers', 'sparkle'],
  time: ['day', 'evening', 'night'],
  weather: ['clear', 'cloudy', 'rain', 'snow', 'storm', 'fog'],
  expr: ['normal', 'smile', 'happy', 'laugh', 'surprised', 'shock', 'angry', 'rage', 'sad', 'cry', 'worried', 'think', 'determined', 'nervous', 'sleepy', 'smug', 'love', 'scared', 'embarrassed', 'blank', 'pain', 'funny'],
  pose: ['stand', 'walk', 'run', 'jump', 'sit', 'kneel', 'point', 'wave', 'surprise', 'cheer', 'fight', 'punch', 'cast', 'think', 'cry', 'hold', 'armscross', 'reach', 'shrug', 'hips', 'hide', 'float'],
  face: ['left', 'right', 'front', 'back'],
  sayType: ['speech', 'shout', 'think', 'whisper', 'electric', 'mono'],
  sfxSize: ['s', 'm', 'l'],
  fx: ['focus', 'speed', 'speedv', 'dark', 'spotlight', 'flashback', 'sparkle', 'hearts', 'gloom', 'shake', 'impact', 'explosion', 'fire', 'smoke', 'magic', 'question', 'exclaim', 'flowers', 'tone', 'sweat', 'wind', 'bubbles'],
  eyeStyle: ['dot', 'simple', 'round', 'sparkle', 'sharp', 'realistic'],
  toneKind: ['dot', 'gradient', 'line', 'sand', 'none'],
  panelFrame: ['clean', 'rough', 'rounded', 'borderless', 'dynamic'],
};
const ART_NUM = [
  ['headRatio', '頭の大きさ', 'リアルな頭身', '大きな頭'], ['deform', 'デフォルメ', '写実', '崩し'], ['eyeSize', '目の大きさ', '小さい', '大きい'],
  ['line.weight', '線の太さ', '細い', '太い'], ['line.taper', '線の入り抜き', '均一', '強弱'], ['line.jitter', '線の揺れ', 'まっすぐ', '揺れる'], ['line.roughness', '線の荒さ', 'きれい', 'ラフ'],
  ['hatching', '斜線', '少ない', '多い'], ['crossHatch', '網目の斜線', '少ない', '多い'], ['black', 'ベタ', '白っぽい', '黒っぽい'], ['tone', 'トーン', '少ない', '多い'],
  ['detail', '描き込み', 'あっさり', '描き込み'], ['perspective', 'パース', '平面的', '強いパース'], ['dynamism', '動き', '静か', '躍動'],
  ['sparkle', 'キラキラ', 'なし', '多い'], ['softness', 'やわらかさ', '硬い', 'やわらか'], ['grain', 'ざらつき', 'つるつる', 'ざらざら'],
];
const ART_DEFAULT = {
  headRatio: 0.5, deform: 0.4, eyeSize: 0.5, eyeStyle: 'round',
  line: { weight: 0.5, taper: 0.4, jitter: 0.1, roughness: 0.15 },
  hatching: 0.15, crossHatch: 0.05, black: 0.3, tone: 0.5, toneKind: 'dot', detail: 0.5, perspective: 0.4,
  dynamism: 0.4, sparkle: 0.2, softness: 0.4, grain: 0.05, panelFrame: 'clean',
};
const AXES = [
  ['humor', 'シリアス', '笑い'], ['warmth', 'クール', '温かさ'], ['tension', 'ゆったり', '緊張感'], ['tempo', 'じっくり', 'テンポ'],
  ['dark', '明るい', 'ダーク'], ['fantasy', '現実的', 'ファンタジー'], ['romance', '恋愛なし', '恋愛'], ['action', '静か', 'アクション'],
  ['mystery', '謎なし', '謎解き'], ['tearjerk', 'からっと', '泣ける'], ['absurd', '筋が通る', '不条理'], ['charDriven', '物語重視', 'キャラ重視'],
  ['talky', '絵で見せる', '会話多め'], ['growth', '変わらない', '成長・変化'], ['everyday', '非日常', '日常感'], ['scale', '身近', '世界規模'],
  ['twist', '王道', 'どんでん返し'], ['afterglow', 'すっきり', '考えさせる'], ['cute', 'かっこいい', 'かわいさ'], ['smart', '直感的', '知的'],
];
const AXIS_KEYS = AXES.map(a => a[0]);
const TAG_CATS = { genre: 'ジャンル', setting: '舞台', protagonist: '主人公', age: '年代', relation: '関係', ending: '結末', humor: '笑いの種類', motif: 'モチーフ' };
function setVocab(v) { if (v && typeof v === 'object') for (const k of Object.keys(v)) if (Array.isArray(v[k]) && v[k].length) VOCAB[k] = v[k].slice(); return VOCAB; }

/* 吹き出し1つの上限（作者に守らせる値。エンジン自体は28字程度まで描ける） */
const BUBBLE_MAX = 15;

/* =========================================================
   ひらめきの種（企画を決める乱数のための表）
   すべてオリジナルの一般的な要素。既存作品の固有名詞は入れない。
   ========================================================= */
const SEEDS = {
  /* ジャンル（50） */
  genre: ['ほのぼの日常', 'ドタバタギャグ', '不条理ギャグ', 'シュールな会話劇', 'じわじわ怖いホラー', '怪談', 'サスペンス', '本格ミステリー', '倒叙ミステリー', 'ハードSF',
    'すこし不思議な日常', 'ディストピア', '剣と魔法のファンタジー', '異世界の暮らし', '民話', '寓話', '童話', 'ラブコメ', '純愛', '失恋もの',
    '青春', 'スポ根', '職人もの', 'お仕事もの', 'グルメ', '料理対決', '医療ドラマ', '法廷劇', '時代劇', '剣劇',
    '忍者活劇', '西部劇風', '海洋冒険', '怪獣パニック', 'ロボットもの', '超能力もの', '妖怪もの', 'スパイ活劇', '怪盗もの', '家族ドラマ',
    '老いと記憶の話', '動物もの', 'ヒーローもの', '音楽もの', '受験もの', '選挙もの', 'サバイバル', '昔をなつかしむ話', '日常の哲学', 'ブラックコメディ'],
  /* 語り口（32） */
  voice: ['淡々とした報告書の調子', '子どもの日記の調子', 'スポーツ実況の調子', '昔話の語り部の調子', '主人公の言い訳の調子', '寄席の噺のような軽妙さ', 'ドキュメンタリーの調子', '取扱説明書の調子',
    '信用できない語り手', '動物の目線', '置き手紙の調子', '天気予報の調子', '古い映画の予告編の調子', 'ひたすらハイテンション', '静かな詩のよう', 'ツッコミ不在のボケ',
    '大真面目な大人がやるコメディ', '夜の怪談の語り口', '手品師の口上', '料理番組の調子', '裁判記録の調子', '観察日記の調子', 'うわさ話の調子', 'ニュース速報の調子',
    '教科書の例文の調子', '晩年の回顧録の調子', '寝る前の読み聞かせ', '熱血解説者の調子', '冷めた皮肉屋の目線', 'からっと明るい', 'しみじみ', 'ひんやり不気味'],
  /* 舞台（88）：[言葉, 描くときの背景] */
  setting: [['閉店間際の商店街', 'shopping'], ['シャッターだらけの夜の商店街', 'shopping'], ['宇宙ステーションの洗濯室', 'spaceship'], ['深い森の奥の一軒家', 'forest'], ['霧の出る海辺の町', 'beach'],
    ['雪山のふもとの山小屋', 'mountain'], ['夜の学校', 'classroom'], ['廃校になった小学校', 'classroom'], ['古いお城の台所', 'castle'], ['掃除中の玉座の間', 'throne'],
    ['地下の鍾乳洞', 'cave'], ['山の上の小さな神社', 'shrine'], ['砂漠のオアシスの屋台', 'desert'], ['海の底の町', 'underwater'], ['小さな町医者', 'hospital'],
    ['夜勤の病棟', 'hospital'], ['あやしい研究所', 'lab'], ['深夜の大学の研究室', 'lab'], ['古い図書館', 'library'], ['閉館後の図書館', 'library'],
    ['終電後の駅', 'station'], ['大雪で電車が止まった駅', 'station'], ['学校の屋上', 'rooftop'], ['雑居ビルの屋上', 'rooftop'], ['江戸の長屋', 'edo'],
    ['宿場町の茶屋', 'edo'], ['体育館の倉庫', 'gym'], ['市民体育館の大会', 'gym'], ['小さなライブハウス', 'stage'], ['公民館の舞台', 'stage'],
    ['祖母の家の和室', 'washitsu'], ['老舗旅館の宴会場', 'washitsu'], ['路地裏の喫茶店', 'cafe'], ['深夜のファミレス', 'cafe'], ['下町の台所', 'kitchen'],
    ['給食室', 'kitchen'], ['雑居ビルの小さな会社', 'office'], ['つぶれかけの町工場の事務所', 'office'], ['市役所の窓口', 'office'], ['雲の上', 'sky'],
    ['気球のかごの中', 'sky'], ['草原の村', 'field'], ['見わたすかぎりの畑', 'field'], ['月面の基地', 'space'], ['小惑星の上', 'space'],
    ['宇宙船の操縦室', 'spaceship'], ['団地の一室', 'room'], ['ワンルームの部屋', 'room'], ['子ども部屋', 'room'], ['真夜中の公園', 'park'],
    ['桜並木の公園', 'park'], ['閉園後の動物園', 'park'], ['夏祭りの境内', 'shrine'], ['お寺の鐘つき堂', 'shrine'], ['大雨の交差点', 'street'],
    ['住宅街の坂道', 'street'], ['引っ越しトラックの止まった道', 'street'], ['港町の市場', 'shopping'], ['ゲームセンターの跡地', 'shopping'], ['海水浴場', 'beach'],
    ['無人島', 'beach'], ['灯台のある岬', 'beach'], ['登山道の途中', 'mountain'], ['火山のふもと', 'mountain'], ['迷いの森', 'forest'],
    ['きのこの森', 'forest'], ['魔王の城の裏口', 'castle'], ['お城の地下牢', 'cave'], ['宝の眠る遺跡', 'cave'], ['ダムの底に沈んだ村', 'underwater'],
    ['水族館の水槽の中', 'underwater'], ['掃除の時間の教室', 'classroom'], ['予備校の自習室', 'classroom'], ['放課後の美術室', 'classroom'], ['保健室', 'hospital'],
    ['手術室の前の廊下', 'hospital'], ['一面の花畑', 'flowers'], ['町の写真館', 'stage'], ['結婚式の控え室', 'room'], ['お通夜の和室', 'washitsu'],
    ['銭湯の脱衣所', 'room'], ['パン屋の厨房', 'kitchen'], ['屋台のラーメン屋', 'street'], ['テレビ局のスタジオ', 'stage'], ['真っ暗で何もない場所', 'black'],
    ['誰かの夢の中', 'sparkle'], ['砂漠の真ん中の電話ボックス', 'desert'], ['砂嵐の中の隊商', 'desert']],
  /* 主人公：種族（20）・年代（12）・職業（52）・欠点（42） */
  heroSpecies: [['人間', 'human'], ['ねこ', 'cat'], ['いぬ', 'dog'], ['うさぎ', 'rabbit'], ['くま', 'bear'], ['小鳥', 'bird'], ['きつね', 'fox'], ['ねずみ', 'mouse'], ['かえる', 'frog'], ['パンダ', 'panda'],
    ['たぬき', 'tanuki'], ['ペンギン', 'penguin'], ['ライオン', 'lion'], ['ロボット', 'robot'], ['おばけ', 'ghost'], ['雲', 'cloud'], ['星', 'star'], ['怪物', 'monster'], ['スライム', 'slime'], ['宇宙人', 'alien']],
  heroAge: [['幼い', 'child'], ['小学生くらいの', 'child'], ['中学生くらいの', 'teen'], ['高校生くらいの', 'teen'], ['二十代の', 'adult'], ['三十代の', 'adult'], ['四十代の', 'adult'], ['五十代の', 'adult'],
    ['定年したばかりの', 'elder'], ['九十歳の', 'elder'], ['年齢不詳の', 'adult'], ['生まれたばかりの', 'child']],
  heroJob: ['郵便配達員', '夜勤の看護師', '新米の消防士@t', '売れない手品師', '町の電器屋', '銭湯の番台', '見習いの料理人@t', '引退した殺し屋', '保険の営業', '図書館の司書',
    '灯台守', '葬儀屋', '占い師', 'パン屋', '漁師', '宇宙飛行士の補欠', '市役所の苦情係', '学校の用務員', '駅の落とし物係', '天気予報士',
    '時計の修理屋', '新聞配達@t', '鍵屋', '素人探偵@any', '給食の調理員', '歯医者', '獣医', '引っ越し屋', '家政婦', '庭師',
    '美容師', '書道の先生', '舞台の黒子', '着ぐるみの中の人', '動物園の飼育員', '剣術道場の跡取り@t', '魔法学校の落第生@y', '勇者の荷物持ち@t', '魔王の経理係', '神社の跡取り@t',
    '新米の死神@t', '地図職人', '自称発明家@any', '無職@any', '家出中の子@y', '帰宅部の学生@y', 'お城の料理番@t', 'ロボットの修理工', '宇宙の配達人', '深夜ラジオの話し手',
    '花屋@t', '駄菓子屋の店主'],
  heroFlaw: ['嘘がつけない', '嘘ばかりつく', 'ひどい方向音痴', '寝坊ぐせ', '人の名前を覚えられない', '怖がり', '見栄っ張り', '負けず嫌いがすぎる', '頼まれると断れない', '心配性',
    '早とちり', '食いしん坊', '忘れっぽい', '頑固', '気が弱い', '声が大きすぎる', '声が小さすぎる', '正直すぎて失礼', '何でも数えてしまう', '一言多い',
    '計画を立てすぎる', 'まったく計画しない', '運が悪い', '高いところが苦手', '泳げない', '自分を天才だと思っている', 'お金に細かい', '片付けられない', '涙もろい', '笑い上戸',
    'くしゃみが止まらない', '動物にだけ嫌われる', '物をすぐ壊す', '謝れない', '感情が顔に出ない', '人見知り', '秘密を守れない', '昔の自慢話が長い', '自分の欠点に気づいていない', '優しすぎて損をする',
    'すぐ眠くなる', '褒められると調子に乗る'],
  /* 関係性（33） */
  relation: ['長年のライバル（じつは互いのファン）', '師匠と弟子（弟子のほうが才能がある）', '親子（子のほうがしっかり者）', '祖父母と孫', '年の離れたきょうだい', '双子', '元恋人', '片思い（相手は気づいていない）',
    '両思いなのに二人とも気づかない', '初対面どうし', '犯人と探偵', '看守と囚人', '店主と常連客', '壁ごしにしか話さない隣人', '会ったことのない文通相手', '雇い主と雇われ',
    '主人と執事', '飼い主とペット（ペットの目線）', '人間と人間でないもの', '先生と生徒', '転校生とクラスの人気者', '捨てられた物と拾った人', '宿敵どうしが手を組む', '腐れ縁の三人組',
    '新入りと古株', '嘘をついた側とつかれた側', '恩人と恩を返したい人', '同じ人を好きな二人', '立場が入れ替わった二人', 'ケンカ中の夫婦', 'ただの通りすがりどうし', '互いの正体を知らない二人', '追う者と追われる者'],
  /* 葛藤（30）と目的（30） */
  conflict: ['大事なものをなくした', '約束の時間に間に合いそうにない', '正体がばれそう', '締め切りが今夜', 'ひどい誤解をされた', '町に危機が迫る', '負けられない勝負がある', '帰る場所がなくなった',
    '秘密を一日だけ守らないといけない', '苦手なものと向き合わされる', '別れの日が明日', '何かが毎日ひとつずつ消える', '言えなかったひと言がある', 'ルールを破ってしまった', '自分のニセモノが現れた', '記憶がところどころない',
    '大事な人に嘘をついてしまった', 'お金がまったくない', '閉じこめられて出られない', '声が出なくなった', 'みんなが自分のことを忘れている', '頼まれた物を壊してしまった', 'いちばん大事な日に限って大雨', '才能のある後輩が来た',
    '自分だけがルールを知らない', '差出人のない手紙が届いた', '誰も信じてくれない', '家族の秘密を知ってしまった', '引退を迫られている', '何をしても元に戻ってしまう'],
  goal: ['夜明けまでに届け物をする', '一番になる', 'ある人を一度だけ笑わせる', 'きちんと謝る', '告白する', '落とし主を探す', 'ひとりで家に帰る', '料理を完成させる',
    '家を守る', '犯人を見つける', '最後まで隠し通す', '元の姿に戻る', '一日だけ別人として過ごす', '誰かの夢をかなえる', '写真を一枚撮る', '秘密の場所に行く',
    'ある歌を思い出す', '店をつぶさない', '敵と仲直りする', 'ニセモノと勝負する', '雨を止める', '小さな嘘を本当にする', '最後まで笑わずにいる', '誰にも気づかれずに元に戻す',
    '約束の品を作り直す', 'お別れ会を成功させる', '宝物を手放す', '自分の名前を取り戻す', '迷子を家に帰す', '空の星を数えきる'],
  /* 仕掛けと構成（46） */
  structure: ['倒叙（最初に犯人が分かっている）', '手紙だけで進む', '時間が逆に進む（最後のページが始まり）', '勘違いが連鎖する', '最後の1コマでひっくり返る', '同じ場面を二人の目線で繰り返す', '同じ一日がくり返す', '一つの部屋から一歩も出ない',
    'すべてが主人公の言い訳として語られる', '語り手が嘘をついている', '1ページごとに一年ずつ進む', '1ページごとに1分ずつ進む', '物の目線で語る（傘・椅子など）', '回想の中にさらに回想がある', '冒頭が結末の場面（そこへどう来たか）', '伝言ゲームで話がねじれる',
    '三つの小さな事件が最後に一つにつながる', '予言どおりに進むが意味が違った', '主人公が最後まで事件に気づかない', '脇役がじつは主役だった', '天気が気持ちを表す', 'くり返しのギャグが最後に泣かせる', '地図をたどる道のり', '劇中劇',
    '取り調べの供述で進む', '実況中継で進む', '日記の日付ごとに進む', '電話の会話だけで進む', '中身の入れ替わり', '体が小さくなる', '張り紙と看板だけで状況が分かる', '同じセリフが三回出て意味が毎回変わる',
    'ルールが一つずつ明かされる', '対戦ゲームのように一手ずつ進む', 'お店のメニューの順に進む', 'レシピの手順どおりに進む', '背中合わせの二つの話が交互に進む', '待っている話（相手は最後まで来ない）', '逃げる話（最後に追っ手の正体が分かる）', '作戦を立てて失敗し続ける',
    '荷物を一つずつ開けていく', '答え合わせが最後にまとめて来る', '主人公だけが知らない秘密を読者は知っている', '一つの小物が持ち主を転々とする', '同じ構図のコマが何度も出てくる', '大きな事件を、関係ない人の小さな一日から見る'],
  /* 結末の型（24） */
  ending: ['ハッピーエンド', 'ほろ苦い', 'どんでん返し', '余韻を残す', '大団円', '意外なオチ', '新しい始まり', 'ちょっと怖いオチ',
    '笑えるオチ', '静かな和解', '振り出しに戻る（でも少し違う）', '主人公だけが知らない幸せ', '勝負に負けて何かを得る', '誰にも知られない英雄', 'ループが一つ先へ進む', '冒頭と同じ構図で意味が反転する',
    '置き手紙で終わる', '次の誰かへバトンが渡る', '小さな嘘が残る', '世界は変わらないが主人公が変わる', '一番の悪者が一番得をする', '全員が少しずつ損をする', '動物だけが真実を知っている', 'セリフのない一枚絵で終わる'],
  /* 小物とモチーフ（120）："言葉:描ける小物"（小物は items / hold の値） */
  motif: ['傘:umbrella', '手紙:letter', '鍵:key', '古い地図:map', 'カメラ:camera', '釣りざお:fishingrod', 'ほうき:broom', '花束:bouquet', 'ギター:guitar', 'マイク:mic',
    '一冊の本:book', 'ランタン:lantern', '開けてはいけない箱:box', 'お菓子:sweets', '手作りの弁当:food', '湯のみ:cup', 'ボール:ball', '杖:staff', '魔法の杖:wand', '錆びた剣:sword',
    '古い盾:shield', 'おもちゃの光線銃:blaster', '鳴らない電話:phone', '一輪の花:flower', '大きすぎるかばん:bag', '帽子:hat', '紙の王冠:crown', '度の合わない眼鏡:glasses', 'サングラス:sunglasses', '手編みのマフラー:scarf',
    'リボン:ribbon', 'マント:cape', 'お面:mask', '眼帯:eyepatch', 'つけひげ:mustache', '蝶ネクタイ:bowtie', 'ペンダント:necklace', '髪かざり:hairflower', 'ばんそうこう:bandage', '天使の輪:halo',
    '羽根:wings', 'ヘッドホン:headphones', '耳あて:earmuffs', 'ヘルメット:helmet', 'はちまき:headband', '角:horns', '止まった時計', '片方だけの手袋', '雪だるま', '風鈴',
    '金魚', '自転車のベル', '古いラジオ', '割れた鏡', '紙飛行機', '折り鶴', '星座', '満月', '流れ星', '雷',
    '虹', '霧', '落ち葉', 'どんぐり', '桜の花びら', '入道雲', '線香花火', '打ち上げ花火', '盆踊り', '年越しそば',
    'おみくじ', 'だるま', '指輪', '合鍵', '植木鉢', 'サボテン', '何かの種', '卵', '目覚まし時計', '砂時計',
    '方位磁石', '双眼鏡', '地球儀', '切手', '回覧板', '落とし物の財布', '外れたくじ', '揚げパン', 'プリン', 'おにぎり',
    'カレーのにおい', '焼きいも', 'ラーメン', 'かき氷', '誕生日ケーキ', '秘伝のタレ', '漬物石', '将棋の駒', 'けん玉', '竹とんぼ',
    'ビー玉', 'カプセルのおもちゃ', '古い写真', '卒業アルバム', '寄せ書き', '置き手紙', '駅の伝言板', '張り紙', '迷子のお知らせ放送', '子守歌',
    '口笛', '鼻歌', '拍手', '足音', '影', '長い行列', '自動販売機', '踏切', '最終バス', '観覧車',
    '貝がら', '瓶に入った手紙', '砂のお城', '雪の足あと', '体温計', '入れ歯'],
  /* 制約のお題（36） */
  constraint: ['セリフは全部で十個まで', '主人公は一言もしゃべらない', '一日の出来事だけ', '一つの場所だけで起きる', 'ナレーションを使わない', '全部のページが夜', '最初と最後のコマを同じ構図にする', '登場人物は二人だけ',
    '人間が一人も出ない', '悪人が一人も出ない', '誰も泣かない', '叫び声は一回だけ', '効果音を使わない', '毎ページ一つはセリフのないコマを入れる', 'ある一言を三回使う', '主人公の顔は最後まで見せない（いつも後ろ姿）',
    '雨が最後まで降り続ける', '全員が同じ服を着ている', '一段一コマの大ゴマを三回以上使う', '六コマの細かいページを一つ入れる', '心の声だけで進む場面がある', '電話の声だけの人物が鍵をにぎる', '主人公が途中でいなくなる', '最後のページはセリフなし',
    'タイトルの言葉が最後のセリフになる', '動物が一番賢い', '効果音が物語の鍵になる', '誰も走らない', '子どもとお年寄りしか出ない', '誰かが毎ページ何かを食べている', 'ずっと雪が降っている', 'セリフはひらがなとカタカナだけ',
    'ついていい嘘は一つだけ', '誰も名前を呼ばない', '主人公はずっと座っている', '敵が一度も姿を見せない'],
  /* 編集者のための「絵柄のひらめき」：ジャンルと無関係な素材・手触りのたとえ（30） */
  artMood: ['鉛筆の落書き帳', '古い新聞の挿絵', '切り絵', '木版画', '影絵', '雨の日の窓ガラス', '寝る前の絵本', '理科の教科書の図', '古い映画のポスター', '筆ペンの年賀状',
    '消しゴムはんこ', '銅版画', '駅の時刻表のような几帳面さ', '子どもがクレヨンで描いた絵', '日に焼けた古い写真', '設計図', '刺繍', '雪の朝の静けさ', '真夏の強い日ざし', '夜の水族館',
    'ガリ版刷りの学級新聞', '工事現場の看板', 'お菓子の包み紙', '地図帳', '霧の中の街灯', '紙芝居', '墨一色の水墨画', 'すりガラスごしの景色', '虫めがねで見た世界', '漫画の下描きのまま'],
};

/* 表の規模（報告・UI用） */
function seedStats() {
  return {
    genreVoice: SEEDS.genre.length + SEEDS.voice.length, setting: SEEDS.setting.length,
    hero: SEEDS.heroSpecies.length + SEEDS.heroAge.length + SEEDS.heroJob.length + SEEDS.heroFlaw.length,
    relation: SEEDS.relation.length, conflictGoal: SEEDS.conflict.length + SEEDS.goal.length, structure: SEEDS.structure.length,
    ending: SEEDS.ending.length, motif: SEEDS.motif.length, constraint: SEEDS.constraint.length, artMood: SEEDS.artMood.length,
  };
}

/* ---------- 種を引く ----------
   studio の seed と同じ項目名（genre / setting / hero / relation / conflict / tone / ending / gimmick / motifs / pages / axes）も持つので、
   そのまま studio の seedBrief() にも渡せる。詳しい中身は parts にある。 */
function drawSeed(rngIn, opts = {}) {
  const r = asRng(rngIn);
  const g1 = pickR(SEEDS.genre, r); let g2 = r() < 0.4 ? pickR(SEEDS.genre, r) : null; if (g2 === g1) g2 = null;
  const voice = pickR(SEEDS.voice, r);
  const [settingLabel, settingBg] = pickR(SEEDS.setting, r);
  const sp = r() < 0.5 ? SEEDS.heroSpecies[0] : pickR(SEEDS.heroSpecies.slice(1), r);
  // 職業と年代：ふつうは合うものを選ぶ。15%だけ、わざと合わない組み合わせ（「九十歳の帰宅部の学生」）を残す
  const [job, jobTag] = pickR(SEEDS.heroJob, r).split('@');
  const okAge = a => jobTag === 'any' ? true : jobTag === 'y' ? ['child', 'teen'].includes(a[1]) : jobTag === 't' ? a[1] !== 'child' : ['adult', 'elder'].includes(a[1]);
  let age = pickR(SEEDS.heroAge, r);
  const odd = r() < 0.15;
  if (!odd) { const ok = SEEDS.heroAge.filter(a => okAge(a) && !(a[0] === '生まれたばかりの' && sp[1] === 'human')); if (!okAge(age) || !ok.includes(age)) age = pickR(ok, r); }
  const flaw = pickR(SEEDS.heroFlaw, r);
  const motifs = pickN(SEEDS.motif, 3, r).map(m => { const [label, item] = m.split(':'); return { label, item: item || null }; });
  const axes = Object.fromEntries(AXIS_KEYS.map(k => [k, Math.round((r() * 0.7 + 0.15) * 100) / 100]));
  for (let i = 0; i < 4; i++) axes[pickR(AXIS_KEYS, r)] = r() < 0.5 ? Math.round(r() * 15) / 100 : Math.round((0.85 + r() * 0.15) * 100) / 100;
  const parts = {
    genre: g2 ? [g1, g2] : [g1], voice, setting: { label: settingLabel, bg: settingBg },
    hero: { species: sp[1], speciesLabel: sp[0], age: age[1], ageLabel: age[0], job, flaw, odd },
    relation: pickR(SEEDS.relation, r), conflict: pickR(SEEDS.conflict, r), goal: pickR(SEEDS.goal, r),
    structure: pickR(SEEDS.structure, r), ending: pickR(SEEDS.ending, r), motifs,
    constraint: opts.noConstraint ? null : pickR(SEEDS.constraint, r),
  };
  const heroText = `${age[0]}${sp[1] === 'human' ? '' : sp[0] + 'の'}${job}（${flaw}）`;
  return {
    mode: opts.mode || 'random', v: 2, parts,
    genre: parts.genre.join(' × '), setting: settingLabel, hero: heroText, relation: parts.relation,
    conflict: `${parts.conflict}／目的：${parts.goal}`, tone: voice, ending: parts.ending, gimmick: parts.structure,
    motifs: motifs.map(m => m.label), constraint: parts.constraint,
    pages: opts.pages || 8 + Math.floor(r() * 5), axes,
  };
}
function seedBrief(seed) {
  if (!seed) return '（種なし）';
  const p = seed.parts;
  const L = [];
  if (p) {
    L.push(`ジャンル: ${p.genre.join(' × ')}`, `語り口: ${p.voice}`, `舞台: ${p.setting.label}（背景に使える例: ${p.setting.bg}）`,
      `主人公: ${p.hero.ageLabel}${p.hero.species === 'human' ? '' : p.hero.speciesLabel + 'の'}${p.hero.job}。欠点は「${p.hero.flaw}」（species は ${p.hero.species}、age は ${p.hero.age} が目安）${p.hero.odd ? '。年代と職業がわざと合っていない。その「なぜ？」を話の入口にする' : ''}`,
      `関係性: ${p.relation}`, `葛藤: ${p.conflict}`, `目的: ${p.goal}`, `仕掛け・構成: ${p.structure}`, `結末の型: ${p.ending}`,
      `小物・モチーフ: ${p.motifs.map(m => m.item ? `${m.label}（描くなら ${m.item}）` : `${m.label}（小物としては描けない。背景・天気・効果・セリフ・効果音で見せる）`).join('、')}`);
    if (p.constraint) L.push(`制約のお題: ${p.constraint}`);
  } else {
    for (const [k, n] of [['genre', 'ジャンル'], ['setting', '舞台'], ['hero', '主人公'], ['relation', '関係性'], ['conflict', '葛藤'], ['tone', 'トーン'], ['ending', '結末の型'], ['gimmick', '仕掛け']]) if (seed[k]) L.push(`${n}: ${seed[k]}`);
    if (seed.motifs && seed.motifs.length) L.push(`モチーフ: ${seed.motifs.join('、')}`);
    if (seed.constraint) L.push(`制約のお題: ${seed.constraint}`);
  }
  if (seed.wish) L.push(`読者のリクエスト（最優先で叶える）: ${seed.wish}`);
  if (seed.axes) L.push(`作品の味（0〜1 の目安。種と食い違ったら種を優先）: ${axisWords(seed.axes, 0.22) || 'とくに偏りなし'}`);
  return L.join('\n');
}
function axisWords(axes, th = 0.2) {
  return AXES.filter(([k]) => axes && Number.isFinite(Number(axes[k])) && Math.abs(axes[k] - 0.5) >= th)
    .sort((a, b) => Math.abs(axes[b[0]] - 0.5) - Math.abs(axes[a[0]] - 0.5))
    .slice(0, 6).map(([k, l, r]) => { const v = Number(axes[k]); const s = Math.abs(v - 0.5) > 0.35 ? 'かなり' : 'やや'; return `${s}${v > 0.5 ? r : l}`; }).join('、');
}

/* =========================================================
   スキーマの説明（描けるものだけを書かせる）
   ========================================================= */
function schemaDoc(schema) {
  if (typeof schema === 'string' && schema.trim()) return schema + `\n【このアプリでの追加の決まり】吹き出し1つは${BUBBLE_MAX}字以内（上の説明に「最長28字」とあっても、こちらを優先）。`;
  const V = schema && typeof schema === 'object' ? { ...VOCAB, ...schema } : VOCAB;
  return `【台本JSONの形】
{
 "memo": { …下の【書く前の設計図】… },
 "title": "タイトル（12字以内）", "genre": "ジャンルを短く（10字以内）", "logline": "あらすじ（2文。オチまで書く）", "ending": "end",
 "characters": [ {"id":"英小文字の短いID","name":"名前","role":"役割","species":"…","age":"…","body":"…","hair":"…","hairColor":"…","eyes":"…","outfit":"…","pattern":"…","items":["…"],"color":"…","desc":"見た目の一言"} ],
 "cover": {"bg":"…","time":"…","cast":[{"id":"…","expr":"…","pose":"…","face":"…"}],"catch":"キャッチコピー（16字以内）"},
 "pages": [ {"rows":[1,2,1], "panels":[ {"shot":"…","bg":"…","time":"…","weather":"…",
     "cast":[{"id":"…","expr":"…","pose":"…","face":"…","hold":"…"}],
     "say":[{"who":"人物id","type":"…","text":"セリフ"}], "narr":"ナレーション（無ければ空）",
     "sfx":[{"text":"ドン","size":"l"}], "fx":["…"] } ] } ]
}
【使える値】（これ以外の値は描けない。英単語をそのまま書く）
species: ${V.species.join(' / ')}
age: ${V.age.join(' / ')}　body: ${V.body.join(' / ')}
hair: ${V.hair.join(' / ')}　hairColor: ${V.hairColor.join(' / ')}（動物は毛の色）
eyes: ${V.eyes.join(' / ')}　outfit: ${V.outfit.join(' / ')}
pattern（服の柄）: ${V.pattern.join(' / ')}
items（身につける）: ${V.worn.join(' / ')}
items・hold（手に持つ）: ${V.held.join(' / ')}（hold:"none" で手ぶら）
color（cloud・ghost・star・slime・monster の体の色）: ${V.bodyColor.join(' / ')}
shot: up（顔のアップ・1人だけ）/ bust（胸から上）/ full（全身）/ long（引き・人物小さめ）/ bg（背景だけ・人物なし）
bg: ${V.bg.join(' / ')}（plain=白、tone=網点、black=黒、flowers=花の心象、sparkle=キラキラの心象）
time: ${V.time.join(' / ')}　weather: ${V.weather.join(' / ')}
expr: ${V.expr.join(' / ')}
pose: ${V.pose.join(' / ')}
face: ${V.face.join(' / ')}（back=後ろ姿。省略すると自動）
say.type: speech（ふつう）/ shout（叫び・ギザギザ）/ think（心の声・もこもこ）/ whisper（小声・点線）/ electric（電話・機械の声）/ mono（モノローグ・しっぽなし）
sfx.size: s / m / l
fx: ${V.fx.join(' / ')}（focus=集中線, speed=横のスピード線, speedv=縦, dark=暗転, flashback=回想トーン, gloom=どよーん, impact=衝撃, sweat=汗, question=？, exclaim=！）
【描画のルール】
- pages は表紙を除いた本文。rows は上の段から順に「その段のコマ数」（1〜3）。合計はそのページのコマ数と同じ。コマは右上→左→次の段の順に読む。
- 1ページ3〜6コマ。1段1コマの段は横長の大ゴマになる。
- shot が up なら cast は1人。bg なら cast は空。1コマの cast は最大4人（見やすいのは3人まで）。
- cast の並びは「右から順」。右にいる人の吹き出しが先に読まれるので、先にしゃべる人を cast の先頭に。
- say.who は characters の id。そのコマの cast にいる人を指すと、しっぽがその人に向く。cast にいない id は「画面の外からの声」になる（意図してやるときだけ）。
- 雲（cloud）は表情で色が変わる（悲しいと灰色、怒ると黒）。cast に "rain":0〜3 を付けると雨を降らせる。
- 絵は白黒。色の名前は使わず、hairColor・pattern・color の値で表す。
- セリフ・ナレーション・効果音は縦書き。英字・算用数字・空白は使わない（数は漢数字）。改行は \\n。
- "art"（絵柄）は編集者が決めるので、作者は書かない。`;
}

const ORIGINALITY = `【オリジナリティの決まり（必ず守る）】
- 既存の漫画・アニメ・映画・ゲーム・小説・絵本・昔話のキャラクター、名前、決めゼリフ、見た目、設定、話の筋をまねしない。パロディ・オマージュもしない。
- 実在の人物・企業・商品・作品の名前を出さない。
- 「有名なあの話の○○版」になっていないか、書き終えたら一度疑う。似ていたら、似ている部分を別の新しいものに替える。
- 名前・見た目・世界のルールは、この作品のためだけに新しく考える。`;

/* =========================================================
   作者の指示文
   ========================================================= */
const CRAFT_STORY = `【書く前の設計図】（memo に書く。ここで面白さが決まる）
1. core: 一行の芯。「（欠点のある）主人公が、（葛藤）のせいで、（目的）をめざす話」。
2. hook（1ページ目）: 最初の3コマ以内に「え？」と思う絵か一言を置く。説明から始めない。主人公の欠点を1ページ目に「行動」で見せる。
3. turn（全体の40〜60%のページ）: 読者の予想を一度裏切る出来事。目的そのもの、または状況の意味が変わる。「やっぱりね」で進む話は没。
4. climax（70〜85%のページ）: いちばん大きな選択かぶつかり。大ゴマ（1段1コマ）を使う。主人公の欠点がここで効く（欠点のせいで勝つ・欠点を越えて勝つ・欠点のせいで負けて何かを得る）。
5. punch（最後のページ）: 結末の型に沿ったオチ。最後のコマは、1ページ目のどれかのコマと響き合わせる（同じ構図・同じセリフ・同じ小物で、意味だけが変わる）。
6. foreshadow: 伏線を2つ以上。前半の何気ないコマに小物か一言で置き、後半で回収する。少なくとも1つは「読み返すと分かる」さりげなさで。回収するコマは見せ場にする。
7. change: 主人公が最初と最後でどう違うか（変わらない主人公なら、周りが何を変えられたか）。
8. motifPlan: モチーフの見せ方（描けない物は、セリフ・効果音・別の小物でどう見せるか）。
9. dropped: 使えなかった種と、その理由（全部使えたら空）。`;

const CRAFT_AVOID = `【面白くするための禁じ手】
- 「私は○○。」の自己紹介ナレーションで始めない。状況説明から始めない。
- 教訓をセリフで言わない（「大切なのは○○なんだ」「○○って素敵だね」）。テーマは行動と小物で見せる。
- 最後に全員で笑って終わるだけ、夢オチ、「全部うそでした」は禁止（種がそれを求めるときだけ例外）。
- 最初に思いついた展開は、読者も思いつく。2つ目か3つ目の案を使う。
- 驚きと笑いは「前振り→外し」。前振りのコマを必ず先に置く。
- 障害や悪役にも、その人なりの理由がある。
- 主人公がぼーっと流されない。主人公の選択で話が動く。
- 種のジャンル名・語り口の名前をセリフやナレーションにそのまま書かない（「これは寓話だ」など）。`;

const CRAFT_PANEL = `【コマ割りと間】
- 1ページ3〜5コマを基本に。1ページ6コマは「せわしなさ」を出したいときだけ。
- 見せ場（turn・climax・punch）は大ゴマ（rows に 1 を入れた段）。いちばんの見せ場は、rows [1,1] か [1,2] の、コマの少ない贅沢なページにする。
- ページの右上の最初のコマは「めくった瞬間の驚き」に使える。ページの最後のコマ（左下）は「次をめくりたくなる引き」にする。
- 間（ま）：セリフのないコマ（say は空、表情とポーズだけ）を作品全体で3つ以上。「ためのコマ→爆発のコマ」「沈黙のコマ→ひと言」の順で効かせる。
- 同じ shot を3コマ続けない。場所が変わった最初のコマは long か bg で場所を見せる（説明は絵で）。感情のいちばん高いところは up。
- 1コマに入れる出来事は1つ。表情（expr）とポーズ（pose）はコマごとに演技させる。同じ人の同じ表情を3コマ続けない。
- 時間の流れは time（day→evening→night）と weather でも見せられる。`;

const CRAFT_DIALOG = `【セリフ】
- 吹き出し1つは${BUBBLE_MAX}字以内（句読点こみ、改行は数えない）。長いときは2つに分けるか削る。\\n で2〜3行に分ける。
- 1コマの吹き出しは0〜2個。3個は短い掛け合いのときだけ。
- 絵で分かることは言わせない（cry の顔に「泣いてるの？」は不要）。
- 心の声（think）は1ページ1つまで。ナレーションは場所・時間の切り替えだけ、20字以内。
- 人物ごとに一人称・語尾・口ぐせを変え、セリフだけで誰か分かるようにする。
- 効果音（sfx）はカタカナかひらがな4字以内。音で場面が分かるように。`;

const CRAFT_DRAW = `【描けるものだけで書く】
- 絵は【使える値】の組み合わせだけで描かれる。種族・服・小物・背景・表情・ポーズ・効果は、リストの英単語をそのまま書く。
- リストにない物（自転車、ピアノ、車、特定の建物、群衆など）は、(a) 近い背景・小物に置きかえる、(b) セリフ・ナレーション・効果音で伝える、(c) コマの外で起きたことにする。描けない物をコマの主役にしない。
- 種の舞台がリストにないときは、いちばん近い bg を選び、最初のナレーションか張り紙のセリフで場所を伝える。
- 人物は見た目で見分けられるように、髪型・服・柄・小物のうち2つ以上を人物ごとに変える。動物どうしなら species か color を変える。
- 登場人物は2〜4人に絞る（多くて5人）。名前は読みやすく短く（カタカナ2〜4字か、短い和名）。`;

function targetBlock(target) {
  if (!target || typeof target !== 'object') return '';
  const L = [];
  const aw = target.axes ? axisWords(target.axes, 0.15) : '';
  if (aw) L.push(`- 好まれてきた味: ${aw}`);
  if (arr(target.likes).length) L.push(`- 反応が良かった要素: ${arr(target.likes).slice(0, 6).join('、')}`);
  if (arr(target.tags).length) L.push(`- 入れてみたい要素: ${arr(target.tags).slice(0, 6).join('、')}`);
  if (arr(target.avoid).length) L.push(`- 避けたいもの（これは入れない）: ${arr(target.avoid).slice(0, 6).join('、')}`);
  if (arr(target.craft).length) L.push(`- 作りの好み: ${arr(target.craft).join('、')}`);
  if (target.note) L.push(`- 分析担当のひと言: ${str(target.note, 120)}`);
  if (!L.length) return '';
  return `【この読者について（分析担当のメモ。参考に）】
${L.join('\n')}
- これは答え合わせの表ではない。全部を満たそうとしない。種を土台に、この傾向は「味つけ」として2〜3か所で効かせる。
- 好きな要素の名前をそのまま出さない。その要素が生む手触り（たとえば「温かさ」なら、ちょっとした気づかいの1コマ）を入れる。
- 避けたいものだけは、はっきり避ける。
- 好みに寄せすぎて「前にも読んだ話」にならないよう、種の意外さは残す。\n`;
}

function seriesBlock(series) {
  if (!series) return '';
  const prev = series.script || (series.pages ? series : null) || {};
  const ep = series.episode || (prev.episode || 1) + 1;
  const chars = arr(prev.characters).map(c => { const o = {}; for (const k of ['id', 'name', 'role', 'species', 'age', 'body', 'hair', 'hairColor', 'eyes', 'outfit', 'pattern', 'items', 'color', 'desc']) if (c[k] != null && c[k] !== '') o[k] = c[k]; return o; });
  const lastPage = arr(prev.pages).slice(-1)[0];
  const lastLines = lastPage ? arr(lastPage.panels).flatMap(p => [p.narr, ...arr(p.say).map(s => s.text)]).filter(Boolean).join(' / ').replace(/\n/g, '').slice(0, 200) : '';
  const hist = arr(series.history).map(h => typeof h === 'string' ? h : `第${h.episode}話『${h.title}』: ${h.logline || ''}`).slice(-4);
  const ex = series.extras || series.lore || null;
  let lore = '';
  if (ex && typeof ex === 'object') {
    const secrets = arr(ex.characters).map(c => c && (c.secret || c.past) ? `・${c.name || c.id}: ${[c.past, c.secret].filter(Boolean).join(' ／ ')}` : '').filter(Boolean);
    const world = ex.world ? arr(ex.world.secrets || ex.world.rules || ex.world).map(x => typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 4) : [];
    const hooks = arr(ex.sequelHints).map(h => typeof h === 'string' ? h : h.hint).filter(Boolean).slice(0, 4);
    lore = `【前作の裏設定（本編にはまだ出ていない。読者はおまけ資料で読んでいるかもしれない）】
${secrets.join('\n') || '（人物の裏設定なし）'}
${world.length ? '世界の裏設定: ' + world.join(' ／ ') + '\n' : ''}${hooks.length ? '続編へのヒント: ' + hooks.join(' ／ ') + '\n' : ''}- 裏設定は、この話で「1つだけ」少し明かす（全部明かさない）。明かし方は、セリフで説明せず、小物・行動・一コマの表情でにおわせる。
- 裏設定と矛盾することは書かない。memo.loreReveal に「どの裏設定を、どのコマで、どこまで明かしたか」を書く。\n`;
  }
  return `【続編の依頼】『${prev.seriesTitle || prev.title || '前作'}』の第${ep}話を書いてください。
前作のあらすじ: ${prev.logline || '（なし）'}
前作の最後のページ: ${lastLines || '（なし）'}
${hist.length ? 'これまでの話:\n' + hist.join('\n') + '\n' : ''}前作の登場人物（id と見た目の値はこのまま使う。変えない）:
${JSON.stringify(chars)}
${lore}【続編の決まり】
- 前作の人物はそのまま引き継ぐ（id・species・髪型・服・小物を変えない）。性格・口ぐせ・関係も前作と地続きに。
- 事件は新しく起こす。前作と同じ型の事件のくり返しにしない。今回の種を使う。
- 人物どうしの関係を「少しだけ」前に進める。memo.relationStep に「前作の終わりの関係 → 今回の終わりの関係」を一言ずつ書く。進めすぎない（告白・和解・別れの完了は、まだ取っておいてよい）。
- 1話だけ読んでも楽しめるように：1ページ目で、主要人物の関係と特徴を「いつもの行動」で自然に見せる。「前回は○○」という説明ナレーションは禁止。
- 前作の小ネタ（小物・口ぐせ・場所）を1つだけ再登場させる。知らなくても分かり、知っていると嬉しい形で。
- 新しい人物は0〜2人まで。title はこの話のサブタイトル（シリーズ名は自動で付く）。ending は "end"（次も続きそうなら "continue" でもよい）。\n`;
}

function authorPrompt({ seed, schema, target, series, plan } = {}) {
  const pages = (seed && seed.pages) || 10;
  return `あなたは、読み切り短編で何度も賞を取ってきた日本の漫画家（作者）です。白黒の短編漫画を1本、「台本JSON」で書いてください。
絵はプログラムが台本どおりに描きます。あなたの仕事は、話・コマ割り・セリフ・演技（表情とポーズ）・カメラ（shot）です。

${series ? seriesBlock(series) : ''}${planBlock(plan)}【今回の企画の種】（ページ側でランダムに引いたくじ${plan ? '。会議で決まった企画のもとになったもの' : ''}）
${seedBrief(seed)}
【種の使い方】
- 種は全部使う。いちばん変な組み合わせこそ、この作品にしかない面白さの元。無難な話に丸めない。
- 種どうしがぶつかるところを、話の芯にする（例：「怖がり」と「灯台守」なら、夜がいちばん怖い仕事をなぜ続けているのか）。
- どうしても両立しない種は1つだけ捨ててよい（memo.dropped に書く）。
- 制約のお題は守る。守ることで生まれる面白さ（不自由さが生む工夫）を探す。
${targetBlock(target)}
【分量】表紙を入れて ${pages} ページ前後（pages は ${pages - 1} 個前後、6〜13個）。最後のページで完結させる。
${CRAFT_STORY}
${CRAFT_AVOID}
${CRAFT_PANEL}
${CRAFT_DIALOG}
${CRAFT_DRAW}
${ORIGINALITY}
${schemaDoc(schema)}
【出力】JSONだけを返す（説明文やコードフェンスは不要）。いちばん最初のキーを "memo" にして、設計図を書いてから台本を書く。
"memo": {"core":"…","hook":"…","turn":"…（何ページ目）","climax":"…（何ページ目）","punch":"…","foreshadow":[{"setup":"何を・何ページ何コマ目","payoff":"どう回収・何ページ何コマ目"}],"change":"…","motifPlan":"…","dropped":"…"${series ? ',"relationStep":"…","loreReveal":"…"' : ''}}`;
}

/* 作者への直しの依頼（編集者の指摘を反映） */
function authorRevisePrompt({ script, notes, seed, schema } = {}) {
  return `あなたは日本の漫画家（作者）です。編集者から直しの指示が来ました。指示に沿って台本を直し、台本全体をJSONで返してください。
【企画の種】
${seedBrief(seed)}
【編集者の指示】
${arr(notes).map((n, i) => `${i + 1}. ${typeof n === 'string' ? n : [n.where, n.problem, n.fix].filter(Boolean).join('：')}`).join('\n')}
- 指示の「意図」をくんで直す。言われた所だけ直して、前後がつながらなくなっていないか確かめる。
- "art" と、コマの "art" は編集者が決めた絵柄なので、そのまま残す。
- 吹き出し1つは${BUBBLE_MAX}字以内。memo も直した内容に合わせて書き直す。
${ORIGINALITY}
${schemaDoc(schema)}
【いまの台本】
${JSON.stringify(script)}`;
}

/* =========================================================
   編集者の指示文
   ========================================================= */
function artDoc() {
  return `【絵柄 art の形】（数値はすべて 0〜1 の連続値。文字の項目は候補から）
{"headRatio":頭の大きさ(0=リアルな頭身,1=大きな頭),"deform":デフォルメ(0=写実,1=崩し),"eyeSize":目の大きさ,"eyeStyle":"${VOCAB.eyeStyle.join('|')}",
 "line":{"weight":線の太さ,"taper":入り抜きの強弱,"jitter":線の揺れ,"roughness":線の荒さ},
 "hatching":斜線の量,"crossHatch":網目の斜線,"black":ベタ(黒)の量,"tone":トーンの量,"toneKind":"${VOCAB.toneKind.join('|')}",
 "detail":描き込み,"perspective":パースの強さ,"dynamism":動き・躍動,"sparkle":キラキラ,"softness":やわらかさ,"grain":紙のざらつき,"panelFrame":"${VOCAB.panelFrame.join('|')}",
 "direction":"作画方針（作画担当への指示。60〜150字。素材のたとえを1つ入れる）","aim":"狙いを一言（30字以内。読者に見せる）","reason":"なぜこの絵柄にしたか（2〜3文）"}`;
}

const ART_SENSE = `【絵柄の決め方】（いちばん大事。ここがあなたのセンスの見せどころ）
■ 禁止：ジャンルから絵柄を決めること。「ホラーだから黒く荒く」「ラブコメだからキラキラ大きな目」「ギャグだから崩し」「SFだから描き込み」。これはいちばんつまらない。
■ 考える順番
1. 読み終えた読者に残したい感情を一語で決める（例：「くすぐったい」「背筋が冷える」「誇らしい」「置いていかれた」）。それは物語のどのコマで生まれるか。
2. 絵と物語の関係を選ぶ。
   ・共鳴：物語と同じ方向に、絵を振り切って強める（ただし「その話のどの瞬間のために」振り切るのかを言えること）
   ・対位：逆の手触りの絵で、物語を浮かび上がらせる（ゆるい絵で描く静かな恐怖、重い劇画で描くくだらない事件）
   ・裏切り：作品全体は一つの絵柄で、山場かオチの1〜3コマだけ panelArt で絵柄を変える（ゆるい絵が最後の1コマだけ写実になる、など）
3. 主役のつまみを2〜4個決めて、思い切って振る（0.15以下か0.85以上）。残りは控えめに。全部が0.4〜0.6の「無難な中間」は禁止。
4. 素材のたとえを1つ持つ（例：「鉛筆の落書き帳」「古い新聞の挿絵」「切り絵」）。direction に書き、数値をそのたとえに合わせる。
5. 最後に、このジャンルの「ありがちな絵柄」を頭の中で一度思い浮かべ、あなたの案がそれと3項目以上で0.3以上違うか確かめる。違わないなら、王道がこの話に効く理由を reason に具体的に書く（「定番だから」は理由にならない）。
■ 悪い例
×「ホラーなので black 0.9、hatching 0.8、roughness 0.7。怖さを出すため」→ ジャンルから決めている。
×「全部0.5前後。バランスよく」→ 何も決めていない。
×「ラブコメなので sparkle 0.9、eyeSize 0.9」→ 定番をなぞっただけ。
■ 良い例
○ 祖母の家で毎日ひとつ物が消える静かなホラー → headRatio 0.8、deform 0.7、softness 0.9、black 0.05、tone 0.3、たとえは「寝る前の絵本」。最後のコマだけ panelArt で black 0.85、hatching 0.8、eyeStyle realistic。狙い「絵本のまま、最後のページで背筋だけ冷やす」。
○ 市役所の苦情係が魔王の苦情を受け付けるギャグ → headRatio 0.15、deform 0.1、detail 0.9、hatching 0.7、line.taper 0.9、たとえは「銅版画」。狙い「重々しい絵ほど、くだらなさが光る」。
○ 言えなかった気持ちの失恋もの → line.jitter 0.8、roughness 0.7、tone 0、grain 0.6、detail 0.25、たとえは「漫画の下描きのまま」。狙い「清書できなかった気持ちを、清書しない線で」。
○ 王道を選ぶ場合：決勝戦の最後の一球 → dynamism 0.95、perspective 0.9、speed の多用。ただし理由は「最後の一球の0.1秒を3ページに引き延ばすため」と、話の具体的な瞬間に結びつける。
■ panelArt（コマだけの絵柄）は多くても3コマ。意図のある場所だけ。note に意図を書く。`;

function editorPlanPrompt({ script, inspiration, tasteHint } = {}) {
  const insp = inspiration || {};
  const seed = insp.seed || (insp.parts || insp.genre ? insp : null);
  const sparks = arr(insp.sparks);
  const moods = arr(insp.moods);
  const report = craftReport(script);
  const hint = tasteHint ? (Array.isArray(tasteHint) ? tasteHint.join('\n') : typeof tasteHint === 'string' ? tasteHint : JSON.stringify(tasteHint)) : '';
  return `あなたはベテランの漫画編集者です。新人の担当作家から届いたネーム（台本JSON）を読んで、
(1) ネームを検討して直し、(2) この作品の絵柄（art）を、あなた自身のセンスで決め、(3) 作品のプロファイルを付けてください。
【企画の種】（作者に渡したくじ）
${seed ? seedBrief(seed) : '（なし）'}
【自動の読みやすさチェック】
${report.length ? report.slice(0, 20).join('\n') : '問題なし'}
【(1) ネームの検討】読者として読み、次を厳しく確かめる。
- つかみ：1ページ目だけで、続きを読みたくなるか。説明や自己紹介で始まっていないか。
- 転：中盤で予想が一度ひっくり返るか。「やっぱりね」で進んでいないか。
- 山場：見せ場が大ゴマになっているか。主人公の選択で話が動いているか。
- オチ：最後のコマで効いているか。説明しすぎ・教訓の口上になっていないか。1ページ目と響き合っているか。
- 伏線：置いた物が回収されているか。回収が唐突でないか（前振りのコマがあるか）。
- 種：くじ（とくに変な組み合わせと制約のお題）が生きているか。無難な話に丸められていないか。
- 読みやすさ：吹き出し${BUBBLE_MAX}字以内、1コマ2個まで、話し手がコマにいるか、同じ shot・表情が続いていないか、セリフのない「間」のコマがあるか。
- 描けるか：【使える値】にない種族・背景・小物・ポーズを主役にしていないか。
- オリジナリティ：既存作品のキャラクター・名前・決めゼリフ・見た目・設定・筋に似ていないか。似ていれば差し替える。
直し方：
- 自分で直せるもの（セリフの短縮、shot や表情の変更、コマの入れ替え、伏線の一言の追加、名前の差し替え）は、直した台本を "script" に入れて返す。
- 筋やオチを作者が大きく直すべきときだけ verdict を "revise" にし、notes に「どこを・なぜ・どう直すか」を書く（最大6つ、大事な順）。
- 判断の基準は「読者が面白いか」。あなたの好みの押しつけはしない。良いところは残す。
${ART_SENSE}
【ひらめきの種】（ページ側でランダムに振った案。ジャンルとは無関係。使っても、混ぜても、無視してもよい）
${sparks.length ? sparks.map(x => `${x.label}: ${arr(x.parts).join('、')}`).join('\n') : ''}${moods.length ? '\n素材のたとえ: ' + moods.join(' ／ ') : ''}
${hint ? `【参考：この読者の絵柄の反応】（あくまで参考。最終判断はあなたのセンスで）\n${hint}\n` : ''}${artDoc()}
【プロファイル】直したあとの作品の「物語」の味を、次の20の物差しで 0〜1（小数2桁）で付ける。絵柄ではなく物語で付ける。タグは各1〜3語の短い日本語。
${AXES.map(([k, l, r]) => `${k}: 0=${l} … 1=${r}`).join('\n')}
${ORIGINALITY}
【返事】次のJSONだけを返す:
{"verdict":"ok か revise","notes":["作者への直し（最大6つ）"],"originality":"似ていたものと差し替えた内容（無ければ 問題なし）",
 "script": 直したネーム全体（同じ形のJSON。直しが不要なら null）,
 "feeling": "読者に残したい感情を一語で",
 "approach": "共鳴 / 対位 / 裏切り のどれか",
 "aim": "絵柄の狙いを一言（30字以内。art.aim と同じでよい）",
 "art": { …上の【絵柄 art の形】のすべての項目… },
 "panelArt": [ {"page":ページ番号(表紙が1、本文は2から),"panel":そのページの何コマ目か(1から),"art":{変えたい項目だけ},"note":"演出の意図（20字以内）"} ],
 "profile": {"axes":{${AXIS_KEYS.map(k => `"${k}":0.0`).join(',')}},
   "tags":{"genre":["…"],"setting":["…"],"protagonist":["主人公の種族"],"age":["主人公の年代"],"relation":["…"],"ending":["…"],"humor":["ボケとツッコミ/ドタバタ/シュール/ほっこり/ブラック/なし など"],"motif":["…"]}}}
【ネーム】
${JSON.stringify(script)}`;
}

const WARN_GUIDE = `【自動チェックの警告の読み方と直し方】
- 「顔に重なっています」→ セリフを短くする、吹き出しを減らす、shot を up から bust に、または話し手を1人にする。
- 「他の吹き出しと重なっています」「吹き出しがコマに収まりません」→ 1コマの吹き出しを2個までにし、長いセリフを削るか次のコマへ送る。小さいコマ（3コマの段）には吹き出し1個まで。
- 「話し手がコマにいません」→ しっぽが外を向く。声だけの演出でなければ、話し手を cast に入れるか、who を直す。
- 「ナレーション: 人物と重なっています」→ ナレーションを短く（20字以内）するか、人物の少ないコマ（long・bg）へ移す。
- 「セリフが長すぎます」→ ${BUBBLE_MAX}字以内に。`;

function editorReviewPrompt({ script, warnings, hasImages, seed } = {}) {
  const report = craftReport(script);
  const w = [...arr(warnings), ...report];
  return `あなたはベテランの漫画編集者です。ネームとあなたが決めた絵柄で作画した原稿の、最終チェックをしてください。
${hasImages ? '添付画像は、この台本を作画した数ページ（表紙・最初・途中・最後）です。吹き出しの読みやすさ、しっぽの向き、絵の伝わり方、絵柄の狙い（art.aim）が効いているかを、画像で確かめてください。\n' : '画像はありません。台本と自動チェックから判断してください。\n'}${seed ? `【企画の種】\n${seedBrief(seed)}\n` : ''}【自動チェックの警告】
${w.length ? w.slice(0, 40).join('\n') : 'なし'}
${WARN_GUIDE}
【見るところ】（この順で）
1. 読みやすさ：吹き出しの長さ（${BUBBLE_MAX}字以内）と数、1コマの情報量、コマの順番、誰がしゃべっているか分かるか。
2. しっぽの向き：吹き出しの who が、そのコマの cast にいるか。会話では先にしゃべる人が cast の先頭（右側）にいるか。声だけの演出は意図どおりか。
3. オチ：最後のページ・最後のコマで効いているか。説明しすぎていないか。
4. スキーマ違反：【使える値】にない値、shot:"up" に2人以上、shot:"bg" に人物、rows の合計とコマ数のずれ、英字・算用数字・空白のセリフ。
5. オリジナリティ：既存作品のキャラクター・名前・決めゼリフ・見た目・設定・筋に似ていないか。
6. 絵柄：狙いが仕上がりで効いているか。効いていなければ artFix で項目を直す（ジャンルに合わせるための直しはしない）。
【判定】
- 自分で直せるもの（上の1・2・4・5、セリフの言い回し）は、直した台本全体を "script" に入れる。"art" とコマの "art" は消さずに残す。
- 判定 "ok"：直したあとの台本で、読者に出せる。
- 判定 "revise"：作者が筋やオチを直さないと面白くならない（mustFix に、作者がやるべきことを書く）。
- 細かい好みで "revise" にしない。必須でないものは notes に。
${ORIGINALITY}
【返事】次のJSONだけを返す:
{"verdict":"ok か revise",
 "mustFix":[{"where":"3ページ2コマ目 など","problem":"何が問題か","fix":"どう直すか"}],
 "notes":["必須ではない提案（最大4つ）"],
 "originality":"似ていたもの と 差し替えた内容（無ければ 問題なし）",
 "script": 直した台本の全体（同じ形のJSON。直しが不要なら null）,
 "artFix": {直したい絵柄の項目だけ。無ければ null},
 "profile":{"axes":{${AXIS_KEYS.map(k => `"${k}":0.0`).join(',')}},"tags":{"genre":["…"],"setting":["…"],"protagonist":["…"],"age":["…"],"relation":["…"],"ending":["…"],"humor":["…"],"motif":["…"]}}}
- profile は直したあとの物語の味（20軸は 0〜1）。
${AXES.map(([k, l, r]) => `${k}: 0=${l} … 1=${r}`).join('\n')}
【台本】
${JSON.stringify(script)}`;
}

/* 絵柄のひらめき（数値の案＋素材のたとえ）。ジャンルとは独立に振る */
function artSparks(rngIn, n = 3) {
  const r = asRng(rngIn), out = [];
  for (let i = 0; i < n; i++) {
    const k = 2 + (r() < 0.5 ? 1 : 0), used = new Set(), parts = [], art = {};
    while (parts.length < k) {
      const [path, name, l, rr] = pickR(ART_NUM, r); if (used.has(path)) continue; used.add(path);
      const v = r() < 0.5 ? Math.round(r() * 20) / 100 : Math.round((0.8 + r() * 0.2) * 100) / 100;
      parts.push(`${name}=${v}（${v > 0.5 ? rr : l}）`);
      if (path.startsWith('line.')) { art.line = art.line || {}; art.line[path.slice(5)] = v; } else art[path] = v;
    }
    if (r() < 0.35) { const f = pickR(VOCAB.panelFrame, r); parts.push(`枠=${f}`); art.panelFrame = f; }
    if (r() < 0.3) { const e = pickR(VOCAB.eyeStyle, r); parts.push(`目=${e}`); art.eyeStyle = e; }
    const mood = pickR(SEEDS.artMood, r); parts.push(`たとえ=${mood}`);
    out.push({ label: '案' + 'ABCDE'[i], parts, art, mood });
  }
  return out;
}

/* =========================================================
   好みを言葉で語る
   ========================================================= */
function tasteNarrativePrompt(stats) {
  const s = stats || {};
  const n = Number(s.reacted ?? s.n ?? 0);
  return `あなたは、この読者を何年も担当してきた漫画編集者です。読者がこのアプリで読んだ漫画への反応（いいね・読了・読み返し・ページの滞在時間など）から計算した統計があります。
これをもとに、この読者の「好み」を、本人に向けて語ってください。
【語り方】
- 温かく、具体的に。読者に話しかける「あなたは〜」の文体。見出し・箇条書きは使わない。${n < 3 ? '\n- まだ反応が少ない（' + n + '作）。分かったことは控えめに、「これから分かってくること」を楽しみにさせる。200〜350字。' : '\n- 400〜600字、3〜4段落。'}
- 意外な発見を最低1つ入れる。例：一見反対に見える好みが同居している（「ダークな話が好きなのに、絵はやわらかい方に反応する」）、一般的な読者の傾向と違うところ、作品名を挙げた具体的な根拠（「『○○』を読み返していたのは、たぶん〜だから」）。
- ジャンル名だけで終わらせない。作品の味（軸）、作り（セリフの量・コマ割り・アップの多さなど）、絵柄、組み合わせの好み、苦手なものまで踏み込む。
- 数字や統計の用語（対数オッズ、確信度、相関、preference など）はそのまま出さない。確信度が低いものは「まだはっきりしないけれど」「たぶん」と言葉で表す。確信度が高いものは言い切る。
- 苦手なものは責めない言い方で（「〜はあなたの好みの外みたいです」）。決めつけ・説教・診断めいた言い方をしない。
- データにないことを事実のように言わない。作品名はデータにあるものだけを使う。
- 最後の段落で「次に読むと面白そうな企画」を1つ、短い一文で提案する。好みのど真ん中ではなく、好みから半歩ずらした案にする（既存作品の名前は出さない）。
【出力】本文だけ（前置き・あいさつの締めの定型句は不要）。
【統計データ】
${JSON.stringify(s)}`;
}

/* =========================================================
   完成作品のおまけ：裏話と裏設定
   history は制作の実際の記録。制作の経緯は history の事実だけで書かせる
   ========================================================= */
function panelList(S) {
  const out = [];
  arr(S && S.pages).forEach((pg, i) => arr(pg.panels).forEach((p, k) => {
    const lines = [p.narr, ...arr(p.say).map(s => `${s.who}「${s.text}」`)].filter(Boolean).join(' ').replace(/\n/g, '');
    out.push(`${i + 2}-${k + 1} [${p.shot}/${p.bg}] ${arr(p.cast).map(c => `${c.id}:${c.expr}`).join(',')} ${lines}`.slice(0, 140));
  }));
  return out;
}
function historyBlock(h) {
  if (!h || typeof h !== 'object') return '（記録なし）';
  const L = [];
  if (h.firstDraft) L.push(`■ 作者の最初のネーム（要約）\n${typeof h.firstDraft === 'string' ? h.firstDraft : JSON.stringify(h.firstDraft)}`);
  if (h.memo) L.push(`■ 作者の設計図（memo）\n${JSON.stringify(h.memo)}`);
  if (arr(h.editorNotes).length) L.push(`■ 編集者の指摘\n${arr(h.editorNotes).map((x, i) => `${i + 1}. ${typeof x === 'string' ? x : JSON.stringify(x)}`).join('\n')}`);
  if (arr(h.changes).length) L.push(`■ どこをどう直したか\n${arr(h.changes).map((x, i) => `${i + 1}. ${typeof x === 'string' ? x : JSON.stringify(x)}`).join('\n')}`);
  if (h.artDecision) L.push(`■ 編集者が絵柄を決めたときの狙い\n${typeof h.artDecision === 'string' ? h.artDecision : JSON.stringify(h.artDecision)}`);
  if (arr(h.unusedSparks).length) L.push(`■ 採用しなかった「ひらめきの種」\n${arr(h.unusedSparks).map(x => typeof x === 'string' ? x : `${x.label || ''}: ${arr(x.parts).join('、')}`).join('\n')}`);
  if (arr(h.droppedSeeds).length || h.dropped) L.push(`■ 使わなかった企画の種\n${[...arr(h.droppedSeeds), ...arr(h.dropped)].join('、')}`);
  if (h.meeting) {
    const m = h.meeting.minutes ? h.meeting : validateMeeting(h.meeting);
    L.push(`■ 企画会議の議事録（そのまま。引用するときは一字一句変えない）\n${arr(m.minutes).map((x, i) => `${i + 1}. ${({ author: '作者', editor: '編集者', artist: '作画' })[x.speaker] || x.speaker}「${x.line}」`).join('\n')}`);
    if (arr(m.rejected).length) L.push(`■ 会議で没になった企画\n${m.rejected.map(r => `${r.label}『${r.title}』: ${r.why}`).join('\n')}`);
  }
  const designs = arr(h.designs).length ? arr(h.designs) : h.meeting && arr((h.meeting.minutes ? h.meeting : validateMeeting(h.meeting)).characters);
  if (designs && designs.length) L.push(`■ キャラクターデザイン案（採用・不採用）\n${designs.map(c => `${c.name}（${c.id}）: ${arr(c.designs).map(d => `案${d.label}${d.label === c.chosen ? '【採用】' : ''} ${JSON.stringify(d.spec)} 印象「${d.note || ''}」${c.rejectedWhy && c.rejectedWhy[d.label] ? ' 没の理由「' + c.rejectedWhy[d.label] + '」' : ''}`).join(' ／ ')}${c.why ? ' 採用理由「' + c.why + '」' : ''}`).join('\n')}`);
  if (h.nameScript) L.push(`■ ネームの段階の台本（コマの一覧）\n${panelList(h.nameScript).join('\n')}`);
  if (h.seed) L.push(`■ 企画の種\n${seedBrief(h.seed)}`);
  if (arr(h.events).length) L.push(`■ そのほかの記録\n${arr(h.events).map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('\n')}`);
  return L.join('\n') || '（記録なし）';
}
function extrasPrompt({ script, art, artIntent, history } = {}) {
  const S = script || {};
  const A = art || S.art || null;
  const intent = artIntent || (A ? { aim: A.aim, direction: A.direction, reason: A.reason } : null);
  const panelIdx = panelList(S);
  return `あなたは、この漫画を作った「作者」と「担当編集者」の二人です。完成した作品の巻末に載せる「おまけ資料」（裏設定と裏話）を書いてください。
読者は本編を読み終えたばかりです。「もう一度最初から読み返したくなる」「この人物たちにまた会いたくなる」資料にしてください。
【いちばん大事な決まり：事実と創作を分ける】
- 制作の経緯（作者あとがきの「着想」「苦労」、編集後記の「絵柄を決めた理由」「ネームからの変更点」「没になった案」、没ネタ）は、下の【制作の記録】に書かれた事実だけにもとづいて書く。
  ・記録にない出来事（「三日徹夜した」「編集部で大げんかした」「取材に行った」など）を作り話にしない。
  ・記録が少ないところは、短く正直に書く（「ネームからの大きな変更はありませんでした」でよい）。
  ・各項目の "basis" に、もとにした記録の項目名（例：「編集者の指摘2」「採用しなかったひらめきの種 案B」）を書く。記録にもとづかない感想だけなら "感想" と書く。
- 裏設定（人物の過去・秘密・好きなもの、世界の裏設定）は自由に創作してよい。ただし本編と矛盾させない。本編に描かれたこと（見た目・セリフ・出来事）は変えない。
- 伏線の解説は、本編に実際にあるコマだけを指す（下の【コマの一覧】の番号「ページ-コマ」を使う）。無い伏線をでっちあげない。後付けの「じつはこういう意味もあった」は裏設定として書き、伏線の解説には入れない。
- 企画会議の議事録は、すでに読者に見せる記録。引用するときは一字一句そのまま。議事録にない発言や場面を「会議でこんなことも言っていた」と足さない。
【絵に添える短いコメント】（画面では次の3つが「絵」として並ぶ。文章は絵に添える短いコメントにする。1つ30字以内）
- キャラクターデザイン案の比較：案ごとに一言（例：「案Bは目つきが鋭すぎて没」「案Aの丸い体型が、怖がりの性格に合った」）。理由はデザイン案の記録と議事録から。
- ネームと完成原稿の比較：ネームの段階の台本と完成台本で、違うコマを選んで一言（例：「ネームでは説明ゼリフだったのを、表情だけに」）。ネームの記録が無ければ空にする。違いが無いコマを選ばない。
- 表情集：人物ごとに、本編で使った表情を2〜4個選び、一言（例：「smug：探偵が強がるときの顔。三回出てくる」）。本編に無い表情を選ばない。
【面白くするコツ】
- 裏設定は「本編のあのコマの見え方が変わる」ものにする（例：口ぐせの由来、小物を手放さない理由）。どうでもいいプロフィールの羅列にしない。
- 秘密は一人につき一つ。小さくて具体的なものほど良い（世界の運命より、引き出しにしまってある物）。
- 作者と編集者の声を書き分ける。作者は作品への思い入れと照れ、編集者は冷静さと作品への愛。互いへの軽いツッコミはよいが、記録にない対立を作らない。
- 続編のヒントは、本編のどこかに根っこがあるものを。
${ORIGINALITY}
【作品】タイトル『${S.title || ''}』${S.episode > 1 ? `（${S.seriesTitle || ''} 第${S.episode}話）` : ''}　ジャンル: ${S.genre || ''}
あらすじ: ${S.logline || ''}
【登場人物（本編の定義）】
${JSON.stringify(arr(S.characters).map(c => ({ id: c.id, name: c.name, role: c.role, species: c.species, age: c.age, outfit: c.outfit, items: c.items, desc: c.desc })))}
【コマの一覧】（ページ-コマ [shot/背景] 人物:表情 セリフ）
${panelIdx.join('\n')}
【絵柄】${A ? JSON.stringify({ aim: A.aim, direction: A.direction, reason: A.reason }) : '（なし）'}
【絵柄を決めたときの意図】${intent ? JSON.stringify(intent) : '（なし）'}
【制作の記録】（事実。これ以外の制作の出来事は書かない）
${historyBlock(history)}
【返事】次のJSONだけを返す:
{"characters":[{"id":"本編のid","name":"名前","profile":"プロフィール（年齢・仕事・暮らし。60字以内）","past":"本編に出てこない過去（80字以内）","secret":"本編に出てこない秘密を一つ（60字以内）","catchphrase":"口ぐせ（本編のセリフから選ぶか、本編と矛盾しないもの）","likes":["好きなもの"],"dislikes":["苦手なもの"],"designNote":"デザインの意図（見た目の値と物語の関係。60字以内）","basis":"…"}],
 "world":{"summary":"世界観・舞台の裏設定（120字以内）","rules":["この世界のルールや小さな事実（2〜4個）"],"places":[{"name":"本編の場所","note":"裏設定（50字以内）"}]},
 "authorAfterword":{"text":"作者あとがき（作者の一人称。250〜400字。着想のきっかけ・苦労したコマ・お気に入りのシーンを含む）","favoritePanel":"ページ-コマ","hardestPanel":"ページ-コマ","basis":["…"]},
 "editorNote":{"text":"編集後記（編集者の一人称。200〜350字。絵柄をこう決めた理由・ネームからの大きな変更点・没になった案を含む）","basis":["…"]},
 "foreshadowing":[{"setup":"ページ-コマ","what":"どの描写","payoff":"ページ-コマ","how":"何につながっていたか"}],
 "cutIdeas":[{"title":"没ネタ・幻のシーンの名前","what":"どんな場面だったか（80字以内）","whyCut":"なぜ没になったか","basis":"記録の項目名 か 創作"}],
 "sequelHints":[{"hint":"続編につながるヒント","root":"本編のどこに根っこがあるか（ページ-コマ）"}],
 "visual":{"designs":[{"id":"人物id","label":"A","comment":"30字以内"}],"nameVsFinal":[{"panel":"ページ-コマ","comment":"30字以内"}],"expressions":[{"id":"人物id","expr":"表情の値","comment":"30字以内"}]}}
- characters は本編の全員。cutIdeas は1〜2個。記録に没案があればそれを使い、無ければ "basis":"創作" として、作中の世界の「幻のシーン」として書く（制作の出来事として書かない）。
- sequelHints は2〜3個。foreshadowing は本編にある分だけ（0個でもよい）。`;
}

/* =========================================================
   企画会議（ネームの前）：作者・編集者・作画担当の会議を1回の呼び出しで
   議事録はそのまま裏話として読者に見せる。盛らない
   ========================================================= */
function charSpecDoc() {
  return `charSpec の形（描ける値だけ）: {"species":"${VOCAB.species.join('|')}","age":"${VOCAB.age.join('|')}","body":"${VOCAB.body.join('|')}","hair":"${VOCAB.hair.join('|')}","hairColor":"${VOCAB.hairColor.join('|')}","eyes":"${VOCAB.eyes.join('|')}","outfit":"${VOCAB.outfit.join('|')}","pattern":"${VOCAB.pattern.join('|')}","items":["身につける: ${VOCAB.worn.join('|')} / 手に持つ: ${VOCAB.held.join('|')}"（4つまで）],"color":"${VOCAB.bodyColor.join('|')}（雲・おばけ・星・スライム・怪物の体の色。それ以外は省略）"}`;
}
function meetingPrompt({ seeds, target, series, tasteHint } = {}) {
  const list = arr(seeds).slice(0, 3);
  const prev = series ? (series.script || (series.pages ? series : null) || {}) : null;
  const hint = tasteHint ? (Array.isArray(tasteHint) ? tasteHint.join('\n') : typeof tasteHint === 'string' ? tasteHint : JSON.stringify(tasteHint)) : '';
  return `これから、短編漫画1本の「企画会議」をします。あなたは次の三人を演じ分け、会議を最初から最後まで一度に行ってください。
- 作者（author）：この漫画を描く漫画家。思いつきが早く、少し照れ屋。自分の案に愛着がある。
- 編集者（editor）：担当編集者。読者の目で厳しくツッコむが、案を膨らませるのも得意。「無難」がいちばん嫌い。
- 作画担当（artist）：キャラクターの見た目と絵柄の担当。必要なときだけ発言する（キャラデザと絵柄の話のとき）。
${series ? seriesBlock(series).replace('を書いてください。', 'の企画会議です。') + `【続編の会議でやること】最初に前作を短く振り返り（何がうまくいったか・何が心残りか）、それから「次に何をやるか」を話し合う。前作の人物の見た目は変えない（designs には前作の charSpec を案Aとして入れ、変えるなら小物の追加など小さな案だけを並べる）。\n` : ''}【ひらめきの種】（ページ側でランダムに引いたくじ。${list.length}組）
${list.map((s, i) => `── 種${i + 1} ──\n${seedBrief(s)}`).join('\n')}
${targetBlock(target)}${hint ? `【参考：この読者の絵柄の反応】（参考まで）\n${hint}\n` : ''}
【会議の流れ】
1. 作者が、種から2〜3案を短くプレゼンする（1案につき1〜2発言。種を混ぜてもよい。どの種を使ったか言う）。
2. 編集者がツッコむ・案を混ぜる・膨らませる。「その案、最初のページで何を見せるの？」「オチは？」「それ、よくある話じゃない？」のように、具体的に。
3. 作者が言い返したり、ひらめいたりする。作画担当が見た目と絵柄の案を出す（キャラ1人につき2〜3通り）。
4. 1つに決める。決め手を編集者が一言でまとめる。
【議事録の決まり（大事）】
- 議事録 minutes は、この会議で起きたやりとりそのもの。読者にそのまま見せる。あとから盛らない・きれいにまとめ直さない。
- decision・characters・artDraft・rejected に書くことは、すべて議事録の中で実際に話されたことだけ。議事録に出てこない決定や理由を書かない。
- 会議の外の出来事（「先週の打ち合わせで」「徹夜して」など）を作らない。
- 発言は1つ60字以内、全部で14〜26発言。だらだら同意し合わない。話が進む発言だけ。ツッコミ・ひらめき・小さな笑いのある、生きたやりとりに。
- 人の名前は「作者」「編集者」「作画」のまま。実在の人物・既存作品の名前は出さない。
【決めること】
- 企画：一行の芯、つかみ、中盤の転、オチ、伏線の案（会議で出たもの）。種の制約のお題をどう使うか。
- 主要キャラクター（2〜4人）：名前・役割・性格・口ぐせ。見た目は charSpec を2〜3通り（案A・案B・案C）出し、どれを採用したかと理由。案どうしは「見た目の印象」がはっきり違うように（髪型・目・服・体型・小物のどれかを大きく変える）。
- 絵柄の仮決め：art の数値案と狙い。ジャンルから決めない（ホラーだから黒く、ラブコメだからキラキラ、は禁止）。「読者に残したい感情」から決め、あえてズラすか響き合わせるかを話す。
- 没にした案と、その理由（議事録で言われた理由）。
${charSpecDoc()}
${artDoc()}
${ORIGINALITY}
【返事】次のJSONだけを返す:
{"minutes":[{"speaker":"author|editor|artist","line":"発言"}],
 "pitches":[{"label":"案1","title":"仮タイトル","pitch":"二文で","seeds":[使った種の番号]}],
 "decision":{"title":"タイトル（12字以内）","logline":"あらすじ（2文。オチまで）","core":"一行の芯","hook":"1ページ目のつかみ","turn":"中盤の転","punch":"オチ","foreshadow":["伏線の案"],"useOfConstraint":"制約のお題の使い方","why":"これに決めた理由（議事録より）","seedIndex":採用した主な種の番号},
 "characters":[{"id":"英小文字のID","name":"名前","role":"役割","personality":"性格（30字以内）","speech":"一人称・語尾・口ぐせ","designs":[{"label":"A","spec":{charSpec},"note":"どんな印象か（20字以内）"}],"chosen":"A|B|C","why":"採用理由（議事録より、30字以内）","rejectedWhy":{"B":"没の理由（20字以内）"}}],
 "artDraft":{ …art の形… },
 "rejected":[{"label":"案2","title":"…","why":"没の理由（議事録より）"}]}`;
}
function validateMeeting(raw) {
  const o = parseJSON(raw) || {};
  const sp = ['author', 'editor', 'artist'];
  const jp = { 作者: 'author', 編集者: 'editor', 編集: 'editor', 作画: 'artist', 作画担当: 'artist' };
  const minutes = arr(o.minutes).map(m => m && typeof m === 'object' ? { speaker: sp.includes(m.speaker) ? m.speaker : jp[m.speaker] || 'editor', line: str(m.line || m.text, 120) } : null).filter(m => m && m.line).slice(0, 40);
  const d = o.decision && typeof o.decision === 'object' ? o.decision : {};
  const decision = {
    title: str(d.title, 24), logline: str(d.logline, 200), core: str(d.core, 120), hook: str(d.hook, 120), turn: str(d.turn, 120), punch: str(d.punch, 120),
    foreshadow: arr(d.foreshadow).map(x => str(typeof x === 'string' ? x : JSON.stringify(x), 100)).slice(0, 4), useOfConstraint: str(d.useOfConstraint, 120), why: str(d.why, 160),
    seedIndex: Math.max(1, Math.round(Number(d.seedIndex) || 1)),
  };
  const usedIds = new Set();
  const characters = arr(o.characters).filter(c => c && typeof c === 'object').slice(0, 5).map((c, i) => {
    const designsRaw = arr(c.designs).filter(x => x && typeof x === 'object').slice(0, 3);
    const designs = designsRaw.map((x, k) => {
      const label = str(x.label || 'ABC'[k], 2).toUpperCase();
      const v = validateScript({ characters: [{ ...(x.spec || {}), id: c.id || 'c' + i, name: c.name }] }).script.characters[0];
      const { id, name, role, desc, ...spec } = v;
      return { label, spec, note: str(x.note, 40) };
    });
    let id = String(c.id || '').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'c' + (i + 1); if (usedIds.has(id)) id += '_' + i; usedIds.add(id);
    const chosen = designs.find(x => x.label === String(c.chosen || '').toUpperCase().slice(0, 1)) ? String(c.chosen).toUpperCase().slice(0, 1) : (designs[0] || {}).label || 'A';
    const rw = c.rejectedWhy && typeof c.rejectedWhy === 'object' ? Object.fromEntries(Object.entries(c.rejectedWhy).map(([k, v]) => [k.toUpperCase().slice(0, 1), str(v, 40)])) : {};
    return { id, name: str(c.name || id, 16), role: str(c.role, 30), personality: str(c.personality, 60), speech: str(c.speech, 60), designs, chosen, why: str(c.why, 60), rejectedWhy: rw };
  }).filter(c => c.designs.length);
  return {
    minutes, pitches: arr(o.pitches).filter(p => p && typeof p === 'object').map(p => ({ label: str(p.label, 8), title: str(p.title, 24), pitch: str(p.pitch, 160), seeds: arr(p.seeds).map(Number).filter(Number.isFinite) })).slice(0, 3),
    decision, characters, artDraft: o.artDraft && typeof o.artDraft === 'object' ? validateArt(o.artDraft) : null,
    rejected: arr(o.rejected).filter(r => r && typeof r === 'object').map(r => ({ label: str(r.label, 8), title: str(r.title, 24), why: str(r.why, 120) })).slice(0, 3),
  };
}
/* 会議で決まった人物を、台本の characters の形にする（作者に渡す・裏話の比較に使う） */
function chosenCharacters(meeting) {
  return arr(meeting && meeting.characters).map(c => {
    const d = c.designs.find(x => x.label === c.chosen) || c.designs[0];
    return { id: c.id, name: c.name, role: c.role, ...(d ? d.spec : {}), desc: [c.personality, c.speech].filter(Boolean).join('／').slice(0, 80) };
  });
}
function planBlock(plan) {
  if (!plan) return '';
  const m = plan.decision ? plan : validateMeeting(plan);
  const d = m.decision || {};
  const chars = chosenCharacters(m);
  return `【企画会議で決まったこと】（この企画でネームを書く。会議の決定は守り、細部はあなたが膨らませてよい）
タイトル案: ${d.title}
あらすじ: ${d.logline}
芯: ${d.core}
つかみ: ${d.hook}　中盤の転: ${d.turn}　オチ: ${d.punch}
伏線の案: ${arr(d.foreshadow).join(' ／ ') || '（なし）'}
制約のお題の使い方: ${d.useOfConstraint || '（なし）'}
決め手: ${d.why}
主要キャラクター（id と見た目の値は、このまま characters に使う。会議で決めたデザインなので変えない。脇役は足してよい）:
${JSON.stringify(chars)}
性格と話し方:
${arr(m.characters).map(c => `・${c.name}（${c.id}）: ${c.personality}／${c.speech}`).join('\n')}
`;
}

/* =========================================================
   JSON の形の定義（ドキュメント兼、検証の手がかり）
   ========================================================= */
const SHAPES = {
  script: { title: 'string<=12', genre: 'string', logline: 'string', ending: 'end|continue', memo: 'object?', characters: '[character]', cover: '{bg,time,weather,cast[],catch<=16}', pages: '[{rows:int[],panels:[panel]}]', art: 'art?', episode: 'int?', seriesTitle: 'string?' },
  character: { id: '[a-z0-9_]+', name: 'string<=16', role: 'string', species: 'VOCAB.species', age: 'VOCAB.age', body: 'VOCAB.body', hair: 'VOCAB.hair', hairColor: 'VOCAB.hairColor', eyes: 'VOCAB.eyes', outfit: 'VOCAB.outfit', pattern: 'VOCAB.pattern', items: '[VOCAB.worn|VOCAB.held] <=4', color: 'VOCAB.bodyColor?', desc: 'string' },
  panel: { shot: 'VOCAB.shot', bg: 'VOCAB.bg', time: 'VOCAB.time', weather: 'VOCAB.weather', cast: '[{id,expr,pose,face?,hold?,rain?}] <=4', say: `[{who,type,text<=${BUBBLE_MAX}}] <=3`, narr: 'string<=40', sfx: '[{text<=6,size}] <=3', fx: '[VOCAB.fx] <=4', art: 'panelArt?' },
  art: { headRatio: '0..1', deform: '0..1', eyeSize: '0..1', eyeStyle: 'VOCAB.eyeStyle', line: '{weight,taper,jitter,roughness: 0..1}', hatching: '0..1', crossHatch: '0..1', black: '0..1', tone: '0..1', toneKind: 'VOCAB.toneKind', detail: '0..1', perspective: '0..1', dynamism: '0..1', sparkle: '0..1', softness: '0..1', grain: '0..1', panelFrame: 'VOCAB.panelFrame', direction: 'string<=150', aim: 'string<=30', reason: 'string<=300' },
  profile: { axes: `{${AXIS_KEYS.join(',')}: 0..1}`, tags: `{${Object.keys(TAG_CATS).join(',')}: string[]<=3}` },
  plan: { verdict: 'ok|revise', notes: 'string[]<=6', originality: 'string', script: 'script|null', feeling: 'string', approach: '共鳴|対位|裏切り', aim: 'string<=30', art: 'art', panelArt: '[{page>=2,panel>=1,art:partial art,note}] <=3', profile: 'profile' },
  review: { verdict: 'ok|revise', mustFix: '[{where,problem,fix}]', notes: 'string[]<=4', originality: 'string', script: 'script|null', artFix: 'partial art|null', profile: 'profile|null' },
  extras: { characters: '[{id,name,profile,past,secret,catchphrase,likes[],dislikes[],designNote,basis}]', world: '{summary,rules[],places[{name,note}]}', authorAfterword: '{text,favoritePanel,hardestPanel,basis[]}', editorNote: '{text,basis[]}', foreshadowing: '[{setup,what,payoff,how}]', cutIdeas: '[{title,what,whyCut,basis}] 1..2', sequelHints: '[{hint,root}] 2..3', visual: '{designs:[{id,label,comment}],nameVsFinal:[{panel,comment}],expressions:[{id,expr,comment}]}' },
  meeting: { minutes: '[{speaker:author|editor|artist,line<=60}] 14..26', pitches: '[{label,title,pitch,seeds[]}] 2..3', decision: '{title,logline,core,hook,turn,punch,foreshadow[],useOfConstraint,why,seedIndex}', characters: '[{id,name,role,personality,speech,designs:[{label,spec:charSpec,note}] 2..3,chosen,why,rejectedWhy:{label:why}}]', artDraft: 'art', rejected: '[{label,title,why}]' },
};

/* =========================================================
   検証と修復
   ========================================================= */
function parseJSON(text) {
  if (text == null) return null;
  if (typeof text === 'object') return text;
  let t = String(text);
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/); if (fence) t = fence[1];
  const a = t.indexOf('{'); if (a < 0) return null; t = t.slice(a);
  try { return JSON.parse(t); } catch (e) { /* 次へ */ }
  const lastB = t.lastIndexOf('}'); if (lastB > 0) { try { return JSON.parse(t.slice(0, lastB + 1)); } catch (e) { /* 次へ */ } }
  // 文字列中の改行をエスケープし、末尾のカンマを消し、閉じ忘れを補う
  let out = '', stack = [], inStr = false, esc = false;
  for (const ch of t) {
    if (inStr) { if (esc) { esc = false; out += ch; continue; } if (ch === '\\') { esc = true; out += ch; continue; } if (ch === '"') { inStr = false; out += ch; continue; } if (ch === '\n') { out += '\\n'; continue; } if (ch === '\t') { out += ' '; continue; } out += ch; continue; }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
    else if (ch === '}' || ch === ']') { if (stack[stack.length - 1] === ch) stack.pop(); else continue; }
    out += ch;
    if (!stack.length && out.trim()) break;
  }
  if (inStr) out += '"';
  for (let tries = 0; tries < 60; tries++) {
    const s = out.replace(/,\s*$/, '').replace(/:\s*$/, ': null').replace(/,\s*"[^"]*"\s*$/, '') + stack.slice().reverse().join('');
    try { return JSON.parse(s.replace(/,\s*([}\]])/g, '$1')); } catch (e) {
      const cut = Math.max(out.lastIndexOf(','), out.lastIndexOf('{'), out.lastIndexOf('['));
      if (cut <= 0) break;
      out = out.slice(0, out[cut] === ',' ? cut : cut + 1);
      stack = []; let s2 = false, e2 = false;
      for (const c of out) { if (s2) { if (e2) e2 = false; else if (c === '\\') e2 = true; else if (c === '"') s2 = false; continue; } if (c === '"') s2 = true; else if (c === '{') stack.push('}'); else if (c === '[') stack.push(']'); else if (c === '}' || c === ']') stack.pop(); }
    }
  }
  return null;
}

const SYN = {
  species: { person: 'human', man: 'human', woman: 'human', boy: 'human', girl: 'human', android: 'robot', spirit: 'ghost', yokai: 'monster', demon: 'monster', dragon: 'monster', kitten: 'cat', puppy: 'dog', bunny: 'rabbit', hamster: 'mouse', rat: 'mouse', owl: 'bird', crow: 'bird', toad: 'frog', raccoon: 'tanuki', blob: 'slime' },
  age: { kid: 'child', baby: 'child', young: 'teen', student: 'teen', old: 'elder', senior: 'elder', grownup: 'adult' },
  shot: { closeup: 'up', close: 'up', face: 'up', medium: 'bust', wide: 'long', establishing: 'long', scenery: 'bg', background: 'bg', none: 'bg', whole: 'full' },
  time: { morning: 'day', noon: 'day', afternoon: 'day', sunset: 'evening', dusk: 'evening', dawn: 'evening', midnight: 'night' },
  weather: { sunny: 'clear', rainy: 'rain', snowy: 'snow', thunder: 'storm', overcast: 'cloudy', foggy: 'fog', mist: 'fog' },
  sayType: { normal: 'speech', say: 'speech', yell: 'shout', scream: 'shout', thought: 'think', monologue: 'mono', small: 'whisper', phone: 'electric', radio: 'electric' },
  expr: { neutral: 'normal', joy: 'happy', grin: 'laugh', surprise: 'surprised', shocked: 'shock', mad: 'angry', furious: 'rage', crying: 'cry', thinking: 'think', serious: 'determined', anxious: 'nervous', fear: 'scared', afraid: 'scared', shy: 'embarrassed', tired: 'sleepy', proud: 'smug', confused: 'worried', gentle: 'smile', calm: 'normal', excited: 'happy', sorrow: 'sad' },
  pose: { standing: 'stand', walking: 'walk', running: 'run', sitting: 'sit', crouch: 'kneel', pointing: 'point', waving: 'wave', battle: 'fight', attack: 'punch', magic: 'cast', thinking: 'think', crying: 'cry', holding: 'hold', crossed: 'armscross', reaching: 'reach', flying: 'float', fly: 'float', sleep: 'sit', lie: 'sit', bow: 'stand' },
  bg: { home: 'room', bedroom: 'room', house: 'room', school: 'classroom', city: 'street', town: 'street', road: 'street', market: 'shopping', ocean: 'beach', sea: 'beach', hill: 'field', meadow: 'field', temple: 'shrine', woods: 'forest', palace: 'castle', ship: 'spaceship', universe: 'space', train: 'station', restaurant: 'cafe', japanese_room: 'washitsu', clinic: 'hospital', laboratory: 'lab', dungeon: 'cave', roof: 'rooftop', stadium: 'gym', theater: 'stage', bookstore: 'library', village: 'edo', white: 'plain', none: 'plain' },
  hairColor: { gray: 'tone', grey: 'tone', brown: 'tone', blonde: 'light', silver: 'white', red: 'tone', blue: 'tone' },
  outfit: { tee: 'tshirt', blouse: 'shirt', school: 'uniform', yukata: 'kimono', coat: 'labcoat', cloak: 'robe', sweater: 'hoodie', tracksuit: 'jersey' },
};
function snap(v, list, syn, dflt) {
  if (v == null || v === '') return dflt;
  const s = String(v).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (list.includes(s)) return s;
  if (syn && syn[s] && list.includes(syn[s])) return syn[s];
  const hit = list.find(x => s.includes(x)); if (hit) return hit;
  return dflt;
}
const KANJI_DIGIT = '〇一二三四五六七八九';
function cleanText(t) {
  return String(t == null ? '' : t).replace(/\r/g, '').replace(/\\n/g, '\n').replace(/[ 　\t]+/g, '')
    .replace(/[0-9０-９]/g, d => KANJI_DIGIT[(d.charCodeAt(0) - (d.charCodeAt(0) >= 0xFF10 ? 0xFF10 : 48))])
    .replace(/\.\.\.|・・・/g, '…').replace(/\n{2,}/g, '\n').trim();
}
const visLen = t => [...String(t).replace(/\n/g, '')].length;
/* 長い吹き出しを、文の切れ目で分ける */
function splitBubble(text, max = BUBBLE_MAX) {
  const flat = String(text).replace(/\n/g, '');
  if (visLen(flat) <= max) return [text];
  const sent = flat.match(/[^。！？!?…]+[。！？!?…]*/g) || [flat];
  const out = []; let cur = '';
  for (const s of sent) { if (cur && visLen(cur + s) > max) { out.push(cur); cur = s; } else cur += s; }
  if (cur) out.push(cur);
  return out.map(x => breakLine(x));
}
/* 改行の無い長めのセリフに、読みやすい改行を入れる（句読点の後ろ優先） */
function breakLine(t, per = 7) {
  if (t.includes('\n') || visLen(t) <= per + 1) return t;
  const a = [...t], lines = []; let cur = [];
  for (let i = 0; i < a.length; i++) {
    cur.push(a[i]);
    const atPunct = '、。！？…'.includes(a[i]) && cur.length >= 3;
    if ((atPunct || cur.length >= per) && i < a.length - 1 && !'、。！？…ーっゃゅょ」'.includes(a[i + 1])) { lines.push(cur.join('')); cur = []; }
  }
  if (cur.length) { if (cur.length <= 1 && lines.length) lines[lines.length - 1] += cur.join(''); else lines.push(cur.join('')); }
  return lines.join('\n');
}
function rowsFor(n) { return { 1: [1], 2: [1, 1], 3: [1, 2], 4: [1, 2, 1], 5: [2, 1, 2], 6: [2, 2, 2] }[n] || [n]; }

function validateArt(a, opts = {}) {
  const src = a && typeof a === 'object' ? a : {}; const partial = !!opts.partial; const base = partial ? null : ART_DEFAULT;
  const n = (v, d) => { let x = Number(v); if (!Number.isFinite(x)) return d; if (x > 1 && x <= 10) x /= 10; else if (x > 10 && x <= 100) x /= 100; return Math.round(clamp(x, 0, 1) * 100) / 100; };
  const out = partial ? {} : { line: {} };
  for (const k of ['headRatio', 'deform', 'eyeSize', 'hatching', 'crossHatch', 'black', 'tone', 'detail', 'perspective', 'dynamism', 'sparkle', 'softness', 'grain']) { const v = n(src[k], base ? base[k] : undefined); if (v !== undefined) out[k] = v; }
  const sl = src.line && typeof src.line === 'object' ? src.line : {};
  const line = {};
  for (const k of ['weight', 'taper', 'jitter', 'roughness']) { const v = n(sl[k] ?? src['line.' + k], base ? base.line[k] : undefined); if (v !== undefined) line[k] = v; }
  if (Object.keys(line).length) out.line = line;
  for (const k of ['eyeStyle', 'toneKind', 'panelFrame']) { const v = snap(src[k], VOCAB[k], null, base ? base[k] : undefined); if (v !== undefined) out[k] = v; }
  if (!partial) { out.direction = str(src.direction, 200); out.aim = str(src.aim, 40); out.reason = str(src.reason, 300); if (src.renderer) out.renderer = str(src.renderer, 30); }
  else if (src.note) out.note = str(src.note, 40);
  return out;
}

function validateScript(raw, opts = {}) {
  const issues = [];
  const obj = parseJSON(raw);
  let s = obj && typeof obj === 'object' ? obj : {};
  if (s.script && typeof s.script === 'object' && s.script.pages) s = s.script;
  const memo = s.memo && typeof s.memo === 'object' ? s.memo : null;
  // 人物
  const idMap = {};
  const chars = arr(s.characters || s.cast).slice(0, 8).map((c, i) => {
    c = c && typeof c === 'object' ? c : {};
    let id = String(c.id || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!id) id = 'c' + (i + 1);
    if (Object.values(idMap).includes(id)) id = id + '_' + i;
    if (c.id != null) idMap[c.id] = id; if (c.name != null) idMap[c.name] = idMap[c.name] || id;
    const species = snap(c.species, VOCAB.species, SYN.species, 'human');
    const items = arr(c.items).map(x => String(x).toLowerCase().trim()).filter(x => VOCAB.worn.includes(x) || VOCAB.held.includes(x)).slice(0, 4);
    if (arr(c.items).length > items.length) issues.push(`人物 ${id}: 描けない小物を外しました（${arr(c.items).filter(x => !items.includes(String(x).toLowerCase().trim())).join('、')}）`);
    if (c.species && !VOCAB.species.includes(String(c.species).toLowerCase())) issues.push(`人物 ${id}: 種族「${c.species}」→ ${species}`);
    const o = {
      id, name: str(c.name || id, 16), role: str(c.role, 30), species,
      age: snap(c.age, VOCAB.age, SYN.age, species === 'human' ? 'teen' : 'adult'), body: snap(c.body, VOCAB.body, null, 'normal'),
      hair: snap(c.hair, VOCAB.hair, null, 'short'), hairColor: snap(c.hairColor || c.hair_color, VOCAB.hairColor, SYN.hairColor, 'black'),
      eyes: snap(c.eyes, VOCAB.eyes, { big: 'sparkle', small: 'dot', closed: 'narrow' }, 'round'),
      outfit: snap(c.outfit, VOCAB.outfit, SYN.outfit, species === 'human' ? 'tshirt' : 'none'), pattern: snap(c.pattern, VOCAB.pattern, { plain: 'white', striped: 'stripe', polka: 'dots', plaid: 'check', dark: 'black' }, 'white'),
      items, desc: str(c.desc || c.description, 80),
    };
    const col = snap(c.color, VOCAB.bodyColor, { black: 'dark' }, null); if (col) o.color = col;
    if (c.size != null && Number.isFinite(Number(c.size))) o.size = clamp(Number(c.size), 0.5, 1.8);
    return o;
  });
  if (!chars.length) { issues.push('登場人物が空でした（仮の人物を入れました）'); chars.push({ id: 'a', name: '主人公', role: '', species: 'human', age: 'teen', body: 'normal', hair: 'short', hairColor: 'black', eyes: 'round', outfit: 'tshirt', pattern: 'white', items: [], desc: '' }); }
  const ids = new Set(chars.map(c => c.id));
  const resolve = v => { if (v == null) return null; if (ids.has(v)) return v; if (idMap[v] && ids.has(idMap[v])) return idMap[v]; const l = String(v).toLowerCase(); return ids.has(l) ? l : null; };
  const castOf = (list, where) => {
    const out = [], seen = new Set();
    for (let c of arr(list)) {
      if (typeof c === 'string') c = { id: c };
      if (!c || typeof c !== 'object') continue;
      const id = resolve(c.id || c.who || c.name);
      if (!id) { issues.push(`${where}: 登場人物にいない「${c.id || c.name}」を外しました`); continue; }
      if (seen.has(id)) continue; seen.add(id);
      const o = { id, expr: snap(c.expr || c.expression, VOCAB.expr, SYN.expr, 'normal'), pose: snap(c.pose, VOCAB.pose, SYN.pose, 'stand') };
      if (c.expr && !VOCAB.expr.includes(String(c.expr).toLowerCase()) && !SYN.expr[String(c.expr).toLowerCase()]) issues.push(`${where}: 表情「${c.expr}」→ ${o.expr}`);
      if (c.pose && !VOCAB.pose.includes(String(c.pose).toLowerCase()) && !SYN.pose[String(c.pose).toLowerCase()]) issues.push(`${where}: ポーズ「${c.pose}」→ ${o.pose}`);
      const face = snap(c.face, VOCAB.face, null, null); if (face) o.face = face;
      if (c.hold) { const h = String(c.hold).toLowerCase() === 'none' ? 'none' : snap(c.hold, VOCAB.held, null, null); if (h) o.hold = h; else issues.push(`${where}: 持ち物「${c.hold}」は描けないので外しました`); }
      if (c.rain != null) o.rain = clamp(Math.round(Number(c.rain) || 0), 0, 3);
      const col = snap(c.color, VOCAB.bodyColor, null, null); if (col) o.color = col;
      if (c.look) { const lk = snap(c.look, ['up', 'down', 'side'], null, null); if (lk) o.look = lk; }
      if (c.x != null && Number.isFinite(Number(c.x))) o.x = clamp(Number(c.x), 0.05, 0.95);
      out.push(o);
    }
    return out;
  };
  const maxPages = opts.maxPages || 14;
  const pages = arr(s.pages).filter(p => p && typeof p === 'object' && !p.cover).slice(0, maxPages).map((pg, i) => {
    const where = `${i + 2}ページ`;
    let panelsRaw = arr(pg.panels);
    if (panelsRaw.length > 6) { issues.push(`${where}: コマが多すぎるので6コマにしました`); panelsRaw = panelsRaw.slice(0, 6); }
    let panels = panelsRaw.map((p, k) => {
      const w = `${where}${k + 1}コマ目`;
      p = p && typeof p === 'object' ? p : {};
      let cast = castOf(p.cast || p.characters, w);
      let shot = snap(p.shot, VOCAB.shot, SYN.shot, cast.length ? (cast.length > 2 ? 'full' : 'bust') : 'bg');
      if (shot === 'up' && cast.length > 1) { issues.push(`${w}: アップ（up）に${cast.length}人いたので bust にしました`); shot = cast.length > 2 ? 'full' : 'bust'; }
      if (shot === 'bg' && cast.length) { issues.push(`${w}: 背景だけ（bg）に人物がいたので full にしました`); shot = cast.length > 2 ? 'full' : 'bust'; }
      if (shot !== 'bg' && !cast.length) shot = 'bg';
      if (cast.length > 4) { issues.push(`${w}: 人物が多すぎるので4人にしました`); cast = cast.slice(0, 4); }
      let bgRaw = String(p.bg || p.background || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
      let bg = VOCAB.bg.includes(bgRaw) ? bgRaw : SYN.bg[bgRaw] || VOCAB.bg.find(x => bgRaw.includes(x)) || null;
      if (!bg) { if (bgRaw) issues.push(`${w}: 背景「${p.bg}」は描けないので plain にしました`); bg = 'plain'; }
      const panel = { shot, bg, time: snap(p.time, VOCAB.time, SYN.time, 'day'), weather: snap(p.weather, VOCAB.weather, SYN.weather, 'clear'), cast: shot === 'bg' ? [] : cast, say: [], narr: '', sfx: [], fx: [] };
      // セリフ
      const castIds = new Set(panel.cast.map(c => c.id));
      for (let b of arr(p.say || p.lines || p.dialogue)) {
        if (typeof b === 'string') b = { text: b };
        if (!b || typeof b !== 'object') continue;
        let text = cleanText(b.text || b.line || '');
        if (!text) continue;
        let who = b.who || b.speaker || null;
        if (who === 'narr' || who === 'narration') { panel.narr = [panel.narr, text].filter(Boolean).join('\n'); continue; }
        const rid = resolve(who);
        if (rid) who = rid; else { if (who) issues.push(`${w}: 話し手「${who}」がいないので画面外の声にしました`); who = 'off'; }
        if (who !== 'off' && !castIds.has(who) && panel.shot !== 'bg') issues.push(`${w}: 話し手 ${who} がコマにいません（画面外の声になります）`);
        if (/[A-Za-z]/.test(text)) issues.push(`${w}: セリフに英字があります「${text.slice(0, 10)}」`);
        const type = snap(b.type, VOCAB.sayType, SYN.sayType, 'speech');
        const parts = splitBubble(text);
        if (parts.length > 1) issues.push(`${w}: 長いセリフ（${visLen(text)}字）を${parts.length}つの吹き出しに分けました`);
        for (const t of parts) { if (visLen(t) > 28) issues.push(`${w}: 吹き出しが長すぎます（${visLen(t)}字）`); panel.say.push({ who, type, text: breakLine(t) }); }
      }
      if (panel.say.length > 3) { issues.push(`${w}: 吹き出しが${panel.say.length}個あるので3個にしました（後ろを削除）`); panel.say = panel.say.slice(0, 3); }
      const narr = cleanText(typeof p.narr === 'object' && p.narr ? p.narr.text || p.narr.t : p.narr || p.narration || '');
      panel.narr = [narr, panel.narr].filter(Boolean).join('\n');
      if (visLen(panel.narr) > 40) issues.push(`${w}: ナレーションが長めです（${visLen(panel.narr)}字）`);
      panel.narr = panel.narr.slice(0, 80);
      panel.sfx = arr(p.sfx).map(x => typeof x === 'string' ? { text: x } : x).filter(x => x && (x.text || x.t)).map(x => ({ text: cleanText(x.text || x.t).replace(/\n/g, '').slice(0, 6), size: snap(x.size, VOCAB.sfxSize, { small: 's', medium: 'm', large: 'l', big: 'l' }, 'm') })).filter(x => x.text).slice(0, 3);
      const fxIn = arr(p.fx || p.effects); panel.fx = [...new Set(fxIn.map(f => snap(f, VOCAB.fx, { concentration: 'focus', speedlines: 'speed', blackout: 'dark', memory: 'flashback', glitter: 'sparkle', love: 'hearts', boom: 'explosion', flash: 'impact' }, null)).filter(Boolean))].slice(0, 4);
      if (fxIn.length > panel.fx.length) issues.push(`${w}: 描けない効果を外しました`);
      if (p.art) { const pa = validateArt(p.art, { partial: true }); if (Object.keys(pa).some(k => k !== 'note')) panel.art = pa; }
      return panel;
    });
    if (!panels.length) { issues.push(`${where}: コマが空でした`); panels = [{ shot: 'bg', bg: 'plain', time: 'day', weather: 'clear', cast: [], say: [], narr: '…', sfx: [], fx: [] }]; }
    let rows = arr(pg.rows).map(n => Math.round(Number(n))).filter(n => n >= 1 && n <= 3);
    if (rows.reduce((a, b) => a + b, 0) !== panels.length) { if (rows.length) issues.push(`${where}: 段の割り方とコマ数が合わないので割り直しました`); rows = rowsFor(panels.length); }
    return { rows, panels };
  });
  if (!pages.length) issues.push('ページがありません');
  if (pages.length && pages.length < 5) issues.push(`ページ数が少なすぎます（本文${pages.length}ページ）`);
  const cv = s.cover && typeof s.cover === 'object' ? s.cover : {};
  let coverCast = castOf(cv.cast, '表紙').slice(0, 3);
  if (!coverCast.length) coverCast = chars.slice(0, 2).map((c, i) => ({ id: c.id, expr: 'smile', pose: i ? 'stand' : 'point' }));
  const cbg = String(cv.bg || '').toLowerCase();
  const title = str(cleanText(s.title || '無題').replace(/\n/g, ''), 24);
  if (visLen(title) > 12) issues.push(`タイトルが長めです（${visLen(title)}字）`);
  const script = {
    title, genre: str(s.genre, 40), logline: str(s.logline || s.synopsis, 200),
    ending: snap(s.ending, ['end', 'continue'], { tbc: 'continue', つづく: 'continue' }, 'end'),
    characters: chars,
    cover: { bg: VOCAB.bg.includes(cbg) ? cbg : SYN.bg[cbg] || (pages[0] && pages[0].panels.find(p => p.bg !== 'plain') || {}).bg || 'sky', time: snap(cv.time, VOCAB.time, SYN.time, 'day'), weather: snap(cv.weather, VOCAB.weather, SYN.weather, 'clear'), cast: coverCast, catch: str(cleanText(cv.catch || cv.tagline || ''), 28) },
    pages,
  };
  if (s.art && typeof s.art === 'object') script.art = validateArt(s.art);
  if (s.episode != null) script.episode = Math.max(1, Math.round(Number(s.episode) || 1));
  if (s.seriesTitle) script.seriesTitle = str(s.seriesTitle, 24);
  return { script, issues, memo };
}

function validateProfile(p) {
  if (!p || typeof p !== 'object') return null;
  const ax = p.axes && typeof p.axes === 'object' ? p.axes : p; const axes = {};
  let got = 0;
  for (const k of AXIS_KEYS) { let v = Number(ax[k]); if (Number.isFinite(v)) { if (v > 1 && v <= 10) v /= 10; else if (v > 10) v /= 100; axes[k] = Math.round(clamp(v, 0, 1) * 100) / 100; got++; } else axes[k] = 0.5; }
  if (got < 8) return null;
  const tags = {}; const t = p.tags && typeof p.tags === 'object' ? p.tags : {};
  for (const c of Object.keys(TAG_CATS)) tags[c] = arr(t[c]).map(x => String(x).trim().slice(0, 14)).filter(Boolean).slice(0, 3);
  return { axes, tags };
}
function validatePlan(raw, opts = {}) {
  const o = parseJSON(raw) || {};
  const out = {
    verdict: o.verdict === 'revise' ? 'revise' : 'ok', notes: arr(o.notes).map(x => typeof x === 'string' ? x : JSON.stringify(x)).map(x => str(x, 200)).slice(0, 6),
    originality: str(o.originality || '問題なし', 200), feeling: str(o.feeling, 20), approach: ['共鳴', '対位', '裏切り'].find(a => String(o.approach || '').includes(a)) || '',
    script: null, scriptIssues: [], art: validateArt(o.art), panelArt: [], profile: validateProfile(o.profile),
  };
  out.aim = str(o.aim || out.art.aim, 40); if (!out.art.aim) out.art.aim = out.aim;
  if (o.script && typeof o.script === 'object' && arr(o.script.pages).length) { const v = validateScript(o.script, opts); out.script = v.script; out.scriptIssues = v.issues; }
  const pagesN = opts.pages || (out.script ? out.script.pages.length : 99);
  for (const pa of arr(o.panelArt).slice(0, 3)) {
    const page = Math.round(Number(pa && pa.page)), panel = Math.round(Number(pa && pa.panel));
    if (!(page >= 2 && page <= pagesN + 1 && panel >= 1 && panel <= 6)) continue;
    const art = validateArt({ ...(pa.art || {}), note: pa.note }, { partial: true });
    if (Object.keys(art).some(k => k !== 'note')) out.panelArt.push({ page, panel, art, note: str(pa.note, 40) });
  }
  return out;
}
function validateReview(raw, opts = {}) {
  const o = parseJSON(raw) || {};
  const mustFix = arr(o.mustFix).map(x => typeof x === 'string' ? { where: '', problem: x, fix: '' } : x && typeof x === 'object' ? { where: str(x.where, 40), problem: str(x.problem, 200), fix: str(x.fix, 200) } : null).filter(Boolean).slice(0, 8);
  const out = {
    verdict: o.verdict === 'revise' && mustFix.length ? 'revise' : 'ok', mustFix,
    notes: arr(o.notes).map(x => str(typeof x === 'string' ? x : JSON.stringify(x), 200)).slice(0, 4), originality: str(o.originality || '問題なし', 200),
    script: null, scriptIssues: [], artFix: null, profile: validateProfile(o.profile),
  };
  if (o.script && typeof o.script === 'object' && arr(o.script.pages).length) { const v = validateScript(o.script, opts); out.script = v.script; out.scriptIssues = v.issues; }
  if (o.artFix && typeof o.artFix === 'object') { const f = validateArt(o.artFix, { partial: true }); delete f.note; if (Object.keys(f).length) out.artFix = f; }
  // studio の editorCheck と同じ形でも使えるように
  out.notesForAuthor = mustFix.map(m => [m.where, m.problem, m.fix].filter(Boolean).join('：'));
  return out;
}
function visualOf(v, S, known) {
  v = v && typeof v === 'object' ? v : {};
  const used = new Map(); arr(S.pages).forEach(pg => arr(pg.panels).forEach(p => arr(p.cast).forEach(c => { if (!used.has(c.id)) used.set(c.id, new Set()); used.get(c.id).add(c.expr); })));
  const ref = x => { const m = String(x || '').match(/(\d+)\s*[-ー－の]\s*(\d+)/); return m ? `${+m[1]}-${+m[2]}` : ''; };
  return {
    designs: arr(v.designs).filter(x => x && known.has(x.id)).map(x => ({ id: x.id, label: str(x.label, 2).toUpperCase(), comment: str(x.comment, 40) })).filter(x => x.comment).slice(0, 12),
    nameVsFinal: arr(v.nameVsFinal).filter(x => x && ref(x.panel)).map(x => ({ panel: ref(x.panel), comment: str(x.comment, 40) })).filter(x => x.comment).slice(0, 6),
    expressions: arr(v.expressions).filter(x => x && used.has(x.id) && used.get(x.id).has(x.expr)).map(x => ({ id: x.id, expr: x.expr, comment: str(x.comment, 40) })).slice(0, 16),
  };
}
function validateExtras(raw, script) {
  const o = parseJSON(raw) || {};
  const S = script || {};
  const known = new Map(arr(S.characters).map(c => [c.id, c]));
  const panelRef = v => { const m = String(v || '').match(/(\d+)\s*[-ー－の]\s*(\d+)/); if (!m) return ''; const pg = +m[1], pn = +m[2]; const page = arr(S.pages)[pg - 2]; return page && page.panels[pn - 1] ? `${pg}-${pn}` : ''; };
  const sl = (v, n) => str(typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v), n);
  const chars = arr(o.characters).filter(c => c && typeof c === 'object').map(c => ({
    id: known.has(c.id) ? c.id : ([...known.values()].find(k => k.name === c.name) || {}).id || '', name: sl(c.name || (known.get(c.id) || {}).name, 16),
    profile: sl(c.profile, 120), past: sl(c.past, 160), secret: sl(c.secret, 120), catchphrase: sl(c.catchphrase, 30),
    likes: arr(c.likes).map(x => sl(x, 20)).slice(0, 4), dislikes: arr(c.dislikes).map(x => sl(x, 20)).slice(0, 4), designNote: sl(c.designNote, 120), basis: sl(c.basis, 60),
  })).filter(c => c.id);
  for (const k of known.values()) if (!chars.some(c => c.id === k.id)) chars.push({ id: k.id, name: k.name, profile: k.role || '', past: '', secret: '', catchphrase: '', likes: [], dislikes: [], designNote: k.desc || '', basis: '' });
  const w = o.world && typeof o.world === 'object' ? o.world : {};
  const aa = o.authorAfterword && typeof o.authorAfterword === 'object' ? o.authorAfterword : { text: o.authorAfterword };
  const en = o.editorNote && typeof o.editorNote === 'object' ? o.editorNote : { text: o.editorNote };
  const issues = [];
  const fs = arr(o.foreshadowing).filter(f => f && typeof f === 'object').map(f => ({ setup: panelRef(f.setup), what: sl(f.what, 80), payoff: panelRef(f.payoff), how: sl(f.how, 120) }));
  const fsOk = fs.filter(f => f.setup && f.payoff); if (fsOk.length < fs.length) issues.push(`伏線の解説のうち、本編に無いコマを指していた ${fs.length - fsOk.length} 件を外しました`);
  return {
    extras: {
      characters: chars,
      world: { summary: sl(w.summary, 240), rules: arr(w.rules).map(x => sl(x, 80)).slice(0, 5), places: arr(w.places).filter(p => p && typeof p === 'object').map(p => ({ name: sl(p.name, 20), note: sl(p.note, 100) })).slice(0, 4) },
      authorAfterword: { text: sl(aa.text, 800), favoritePanel: panelRef(aa.favoritePanel), hardestPanel: panelRef(aa.hardestPanel), basis: arr(aa.basis).map(x => sl(x, 60)).slice(0, 6) },
      editorNote: { text: sl(en.text, 700), basis: arr(en.basis).map(x => sl(x, 60)).slice(0, 6) },
      foreshadowing: fsOk.slice(0, 6),
      cutIdeas: arr(o.cutIdeas).filter(x => x && typeof x === 'object').map(x => ({ title: sl(x.title, 30), what: sl(x.what, 160), whyCut: sl(x.whyCut, 120), basis: sl(x.basis, 60) })).slice(0, 2),
      visual: visualOf(o.visual, S, known),
      sequelHints: arr(o.sequelHints).map(x => typeof x === 'string' ? { hint: sl(x, 100), root: '' } : x && typeof x === 'object' ? { hint: sl(x.hint, 100), root: panelRef(x.root) } : null).filter(x => x && x.hint).slice(0, 3),
    },
    issues,
  };
}

/* =========================================================
   作りのチェック（台本だけから分かる、面白さ・読みやすさの目安）
   ========================================================= */
function craftReport(script) {
  const S = script && script.pages ? script : (script && script.script) || null;
  if (!S || !arr(S.pages).length) return [];
  const out = [];
  const panels = []; S.pages.forEach((pg, i) => arr(pg.panels).forEach((p, k) => panels.push({ p, where: `${i + 2}ページ${k + 1}コマ目`, page: i, rows: arr(pg.rows) })));
  let silent = 0, bigPanels = 0, sameShot = 1, lastShot = null;
  const exprRun = {};
  for (const { p, where } of panels) {
    const say = arr(p.say);
    if (!say.length && !p.narr) silent++;
    for (const b of say) if (visLen(b.text || '') > BUBBLE_MAX) out.push(`${where}: 吹き出しが${BUBBLE_MAX}字を超えています（${visLen(b.text)}字）「${String(b.text).replace(/\n/g, '').slice(0, 10)}…」`);
    if (say.length > 2) out.push(`${where}: 吹き出しが${say.length}個（2個までが読みやすい）`);
    const castIds = arr(p.cast).map(c => c.id);
    for (const b of say) if (b.who && b.who !== 'off' && p.shot !== 'bg' && !castIds.includes(b.who)) out.push(`${where}: 話し手 ${b.who} がコマにいない（しっぽが外を向く）`);
    if (say.length >= 2 && castIds.length >= 2) { const first = castIds.indexOf(say[0].who), second = castIds.indexOf(say[1].who); if (first > second && second >= 0) out.push(`${where}: 先にしゃべる人を cast の先頭（右側）に置くと読む順と合う`); }
    if (p.shot === lastShot) { sameShot++; if (sameShot === 3) out.push(`${where}: 同じ shot（${p.shot}）が3コマ続いています`); } else { sameShot = 1; lastShot = p.shot; }
    for (const c of arr(p.cast)) { const r = exprRun[c.id] || { e: null, n: 0 }; if (r.e === c.expr) r.n++; else { r.e = c.expr; r.n = 1; } exprRun[c.id] = r; if (r.n === 3) out.push(`${where}: ${c.id} の表情（${c.expr}）が3コマ続いています`); }
    if (p.narr && visLen(p.narr) > 30) out.push(`${where}: ナレーションが長め（${visLen(p.narr)}字）`);
  }
  for (const pg of S.pages) bigPanels += arr(pg.rows).filter(n => n === 1).length;
  if (silent < 2) out.push(`セリフのない「間」のコマが${silent}個（3個以上あると緩急がつく）`);
  if (bigPanels < 2) out.push(`大ゴマ（1段1コマ）が${bigPanels}個（見せ場に使う）`);
  const p0 = arr(S.pages[0] && S.pages[0].panels)[0];
  if (p0 && p0.narr && /^(私|僕|俺|わたし|ぼく|おれ|ここは)/.test(p0.narr)) out.push('1ページ目が自己紹介・状況説明のナレーションで始まっています（つかみが弱い）');
  const lines = panels.flatMap(x => arr(x.p.say).map(b => b.text || ''));
  if (lines.some(t => /大切なのは|大事なのは|ってことなんだ|だったんだね/.test(t.replace(/\n/g, '')))) out.push('教訓を口で言っているセリフがあります');
  return out;
}

const API = {
  VERSION, VOCAB, SEEDS, AXES, AXIS_KEYS, TAG_CATS, ART_NUM, ART_DEFAULT, SHAPES, BUBBLE_MAX, ORIGINALITY,
  makeRng, drawSeed, seedBrief, seedStats, artSparks, setVocab, schemaDoc, artDoc,
  authorPrompt, authorRevisePrompt, editorPlanPrompt, editorReviewPrompt, tasteNarrativePrompt, extrasPrompt, meetingPrompt, validateMeeting, chosenCharacters,
  parseJSON, validateScript, validateArt, validateProfile, validatePlan, validateReview, validateExtras, craftReport, splitBubble,
};
if (root) root.MangaPrompts = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : null);

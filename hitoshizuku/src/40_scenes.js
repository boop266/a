// ---------------------------------------------------------------------------
// 絵巻の場面
//   地図の字：. 空  # 土  R 岩  s 砂  I 氷  S 雪  M 泥  = 板  x 白紙（落ちると消える）  c 隙間  g 苔  ~ 深い水  - 浅い水
//   どの場面も「右のはし」へ行けば、次の場面。行き方は決めていない（印は、見つけた解き方の数）
// ---------------------------------------------------------------------------
const CHAPTERS = [
  { seal: '序', title: '序の巻　白紙', music: 'blank', intro: null },
  { seal: '野', title: '一の巻　野', music: 'field', intro: ['一の巻　野', '絵師が、まだ小さかったころ。', '母の背中で見た、春の野原。'] },
  { seal: '川', title: '二の巻　川', music: 'river', intro: ['二の巻　川', '夏の川。', '父と舟を出して、魚を釣った。'] },
  { seal: '山', title: '三の巻　山', music: 'mountain', intro: ['三の巻　山', '秋の山。', '絵を習いに、師のもとへ通った道。'] },
  { seal: '里', title: '四の巻　里', music: 'village', intro: ['四の巻　里', '冬の里。', '友と走りまわった、雪の日と祭りの夜。'] },
  { seal: '夜', title: '五の巻　夜', music: 'night', intro: ['五の巻　夜', '夜。', 'だいじな人と、別れた夜。'] },
  { seal: '空', title: '六の巻　空', music: 'sky', intro: ['六の巻　空', '空。', 'いつか描きたいと、夢見ていたもの。'] },
  { seal: '終', title: '終の巻　名', music: 'end', intro: ['終の巻　名', 'そして、いま。'] },
];
const has = (L, type, f) => L.some(e => e.type === type && (!f || f(e)));
const wrote = (L, k, f) => L.some(e => e.type === 'write' && e.k === k && (!f || f(e)));
const ridOn = (L, k) => L.some(e => e.type === 'ride' && e.who === k);

// よく使う形
const SKY = n => Array(n).fill('');
// 地図を四角の重ねで作る：[字, x0, y0, x1, y1]（あとの四角が上書き）
function B(w, h, ops) {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  for (const [c, x0, y0, x1, y1] of ops) for (let y = y0; y <= (y1 == null ? y0 : y1); y++) for (let x = x0; x <= (x1 == null ? x0 : x1); x++) if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = c;
  return g.map(r => r.join(''));
}
function pad(rows, w) { return rows.map(r => (r + '.'.repeat(w)).slice(0, w)); }

const SCENES = [
  // =========================================================================
  // 序の巻　白紙
  // =========================================================================
  {
    id: 'p1', chapter: 0, no: '一', title: 'ひとしずく', music: 'blank', theme: { seed: 11, hills: 0.6 }, give: ['人'],
    start: { x: 1, y: 10 }, birth: true,
    map: pad([
      '', '', '', '', '', '', '', '', '',
      '..............###################',
      '..............###################',
      '#######.##########################',
      '#######x##########################',
      'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    ], 34),
    ents: [{ k: '木', x: 3, y: 9 }],
    faded: [{ k: '木', x: 13, y: 9, memory: '……そうじゃ、木じゃ。名を書けば、もどってくる', hint: '……まっすぐ立って、枝をひろげて……あれは、何じゃったかのう' }],
    drops: [{ x: 20, y: 7 }],
    noSee: ['土'],
    voice: {
      enter: ['……おや。筆から、墨がひとしずく、こぼれたか', '歩いてごらん。行きたい所に、さわるのじゃ'],
      hints: ['薄れた木に、字帳の「木」を重ねてごらん。下から上へ、引っぱって、はなすのじゃ', '木には登れる。木のてっぺんから、段の上へ', '墨のしずくは、高い所にある。木を書いて、登ってごらん'],
    },
    cues: [
      { when: W => Scene.enterT > 7, say: 'おまえは……「人」じゃな。墨のしずくの、人じゃ' },
      { when: W => Game.known.includes('木') && W.hero.x < 8, say: '木じゃ。名を知れば、書ける' },
      { when: W => W.hero.x >= 9, say: '……ここにも、木があったはずじゃが……色が抜けてしもうた', tutor: { k: '木', x: 13, y: 10, until: 14 } },
      { when: W => W.faded.some(f => f.restored), say: 'さあ、登ってごらん' },
      { when: W => W.hero.x >= 16, say: '書いた字は、墨を使う。墨つぼが空になったら、書いた字にさわってごらん。墨がもどる' },
    ],
    stamps: [
      { id: 'restore', name: '薄れた木に色をもどした', test: L => has(L, 'restore', e => e.k === '木') },
      { id: 'own', name: '自分で木を書いた', test: L => wrote(L, '木', e => e.kind === 'place') },
      { id: 'drop', name: 'しずくを見つけた', test: L => has(L, 'drop') },
    ],
  },
  {
    id: 'p2', chapter: 0, no: '二', title: '一本の線', gifts: ['一'], music: 'blank', theme: { seed: 12, hills: 0.5 },
    start: { x: 1, y: 9 },
    map: pad([
      '', '', '', '', '', '',
      '...............######....#######..........',
      '...............######....#######..........',
      '...............######....#######...#######',
      '...............######....#######...#######',
      '#######..############....#######...#######',
      '#######xx############xxxx#######xxx#######',
      'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    ], 43),
    drops: [{ x: 29, y: 2 }],
    voice: {
      enter: [],
      hints: ['線を一本、谷にわたしてごらん。線は、書いた所にとどまる', '高い所へは、線を一本ずつ、ずらして書いてごらん。階段になる', '書いた線にさわれば、墨はもどる。何度でも書きなおせる'],
    },
    onEnter() { setTimeout(() => { if (Scene.cur && Scene.cur.id === 'p2' && !Game.known.includes('一')) Game.gift('一', ['字のはじまりは、一本の線じゃった', '……ひいてごらん。線は、乗れる'], () => Tutor.point('一', 7, 10, { until: 12 })); }, 1400); },
    cues: [
      { when: W => W.hero.x >= 12 && W.hero.y >= 9, say: '高い所へは、線を一本ずつ、ずらして書いてごらん' },
      { when: W => W.hero.x >= 24, say: 'うまいものじゃ' },
    ],
    stamps: [
      { id: 'bridge', name: '線の橋', test: L => wrote(L, '一') },
      { id: 'stairs', name: '線の階段', test: (L, W) => W.ents.filter(e => e.alive && e.k === '一').length >= 3 || L.filter(e => e.type === 'write' && e.k === '一').length >= 4 },
      { id: 'tree', name: '木を書いて登った', test: L => wrote(L, '木') },
      { id: 'drop', name: '空のしずく', test: L => has(L, 'drop') },
    ],
  },
  {
    id: 'p3', chapter: 0, no: '三', title: '木と木と木', music: 'blank', theme: { seed: 13, hills: 0.8 },
    start: { x: 1, y: 11 },
    map: pad([
      '', '', '', '', '', '', '', '', '',
      '.................#############...#############',
      '.................#############...#############',
      '.................#############...#############',
      '##############################...#############',
      '##############################xxx#############',
    ], 46),
    ents: [{ k: '木', x: 4, y: 10 }, { k: '木', x: 6, y: 10 }, { k: '日', x: 24, y: 1, set: { pinned: true } }, { k: '鳥', x: 10, y: 4 }],
    faded: [{ k: '森', x: 14, y: 9, memory: '……森じゃ。子どものころ、この森で迷うて、母にしかられた', hint: '……木が、たくさん。木と、木と、木と……' }],
    drops: [{ x: 8, y: 6 }],
    voice: {
      enter: ['木が二本。……字は、重ねると、別の字になるのじゃ'],
      hints: ['字帳の中で、「木」を「木」の上に重ねてごらん。林になる', '林に、もう一つ木を重ねると……', '墨が足りぬ時は、書いた字にさわって、墨をもどすのじゃ'],
    },
    cues: [
      { when: W => Scene.enterT > 3 && !Game.known.includes('林'), run: () => Tutor.pointCell('木', '木') },
      { when: W => Game.known.includes('林') && !Game.known.includes('森'), say: '林じゃ。……木がもう一本あれば？' },
      { when: W => Game.known.includes('森'), say: '森じゃ。あの薄れた森に、名を返してやっておくれ' },
      { when: W => W.hero.x >= 29, say: '墨が足りぬ時は、書いた字にさわって、墨をもどすのじゃ' },
    ],
    stamps: [
      { id: 'forest', name: '森に色をもどした', test: L => has(L, 'restore', e => e.k === '森') },
      { id: 'grove', name: '林を書いた', test: L => wrote(L, '林') || has(L, 'combine', e => e.out === '林' && e.where === 'world') },
      { id: 'lines', name: '線で登った', test: L => wrote(L, '一') && !has(L, 'restore', e => e.k === '森') },
      { id: 'drop', name: '鳥のしずく', test: L => has(L, 'drop') },
    ],
  },
  // =========================================================================
  // 一の巻　野
  // =========================================================================
  {
    id: 'f1', chapter: 1, no: '一', title: '朝の野', music: 'field', theme: { seed: 21, hills: 0.9, sun: false }, dark: 0.55,
    start: { x: 1, y: 10 },
    map: pad([
      '', '', '', '', '', '', '', '', '',
      '...................................####...............',
      '..................................#####...............',
      '############~~~~~~######################.....#########',
      '############~~~~~~##############################...####',
      '##############################################################',
    ], 56),
    ents: [{ k: '石', x: 5, y: 10 }, { k: '板', x: 7, y: 10 }, { k: '草', x: 22, y: 10 }, { k: '草', x: 25, y: 10 }, { k: '蝶', x: 24, y: 7 }],
    faded: [
      { k: '日', x: 30, y: 1, sky: true, memory: '……日じゃ。朝日じゃ。母の背中で見た、朝日じゃ', hint: '……まあるくて、あたたかくて、東からのぼるもの……', onRestore() { setTime('day', true); Music.mood(null); W.darkBase = 0; Bus.emit('dawn', {}); } },
      { k: '花', x: 20, y: 10, memory: '……花じゃ' }, { k: '花', x: 27, y: 10 }, { k: '花', x: 32, y: 10 },
    ],
    drops: [{ x: 43, y: 8 }],
    voice: {
      enter: ['……まだ夜明け前か。暗いのう'],
      hints: ['池は深い。墨のおまえは、水に入るとにじんでしまう', '板は水に浮く。浮かべて乗ったら、行きたい岸をさわってごらん', '空の高い所にも、薄れたものがある。……あれは、何じゃったかのう'],
    },
    cues: [
      { when: W => W.hero.x >= 9, say: '池じゃ。墨のおまえは、水に入るとにじんでしまう。……渡り方は、いくつもある' },
      { when: W => W.hero.x >= 26 && !W.faded[0].restored, say: '……空が、さみしいのう。あそこに、何かがあったはずじゃ' },
    ],
    stamps: [
      { id: 'sun', name: '朝日をよみがえらせた', test: L => has(L, 'restore', e => e.k === '日') },
      { id: 'raft', name: '板の舟で渡った', test: L => has(L, 'steer', e => e.v === '板') },
      { id: 'line', name: '線で渡った', test: L => wrote(L, '一') },
      { id: 'fill', name: '池を埋めた', test: L => wrote(L, '土') || wrote(L, '石') || wrote(L, '山') },
      { id: 'flowers', name: '花を三つ咲かせた', test: L => L.filter(e => e.type === 'restore' && e.k === '花').length >= 3 },
    ],
  },
  {
    id: 'f2', chapter: 1, no: '二', title: '雨あがり', music: 'field', theme: { seed: 22, hills: 0.7 }, ambient: 'petals',
    start: { x: 1, y: 11 },
    map: pad([
      '', '', '', '', '', '', '', '', '', '', '',
      '..........................................',
      '################...........###############',
      '################xxxxxxxxxxx###############',
      'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    ], 42),
    ents: [
      { k: '雨', x: 5, y: 2, set: { pinned: true, rainer: true } },
      { k: '雲', x: 18, y: 5, set: { pinned: true } },
      { k: '雲', x: 24, y: 3, set: { pinned: true } },
    ],
    faded: [{ k: '花', x: 8, y: 11 }, { k: '花', x: 11, y: 11 }, { k: '虹', x: 16, y: 12, w: 11, h: 1, memory: '……雨のあとには、空に七色の橋がかかったものじゃ', hint: '……雨と、日と。ふたつがそろうと、空にかかるもの……' }],
    drops: [{ x: 25, y: 2 }],
    voice: {
      enter: ['谷じゃ。向こうまで、ずいぶんある'],
      hints: ['雨のあとには……空に、何がかかったかのう', '字帳で、雨と日を重ねてごらん', '雲には乗れる。乗ったら、行きたい方をさわってごらん'],
    },
    onTick(W) { const r = W.ents.find(e => e.rainer); if (r && W.tick % 240 === 0) W.rains.push({ x: r.x - 2, y: r.y + 1, w: 5, ttl: 5, rate: 0.5, cloud: false }); },
    cues: [{ when: W => W.hero.x >= 12, say: '……雨のあとには、空に七色の橋がかかったものじゃ' }],
    stamps: [
      { id: 'rainbow', name: '虹の橋', test: L => has(L, 'restore', e => e.k === '虹') || wrote(L, '虹') },
      { id: 'cloud', name: '雲に乗った', test: L => has(L, 'steer', e => e.v === '雲') },
      { id: 'line', name: '線の橋', test: L => wrote(L, '一') },
      { id: 'drop', name: '雲の上のしずく', test: L => has(L, 'drop') },
    ],
  },
  {
    id: 'f3', chapter: 1, no: '三', title: '風の丘', music: 'field', theme: { seed: 23, hills: 1.2 }, ambient: 'petals',
    start: { x: 1, y: 12 },
    zones: [{ x0: 12, x1: 38, y0: 0, y1: 13, dir: -1, str: 1.6 }],
    map: pad([
      '', '', '', '', '', '', '', '', '',
      '..............................................',
      '..........#####################...............',
      '........##########################............',
      '......################################........',
      '##############################################',
      'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    ], 46),
    ents: [{ k: '風', x: 24, y: 3, set: { pinned: true } }, { k: '山', x: 40, y: 2, set: { pinned: true } }, { k: '石', x: 5, y: 12 }, { k: '石', x: 16, y: 9 }],
    faded: [{ k: '花', x: 33, y: 10 }],
    drops: [{ x: 20, y: 5 }],
    voice: {
      enter: ['丘の上は、風が強い。……押しもどされんようにな'],
      hints: ['風は、木や岩のかげでは吹かぬ。かげを作って、少しずつ進むのじゃ', '林を書いて、そのかげへ。墨をもどして、また先に書く', '山を書けば、山のかげができる'],
    },
    cues: [{ when: W => W.hero.hero.windT > 0, say: '風じゃ。かげを作れば、吹かぬ' }],
    stamps: [
      { id: 'grove', name: '林のかげ', test: L => wrote(L, '林') || wrote(L, '森') || has(L, 'combine', e => (e.out === '林' || e.out === '森') && e.where === 'world') },
      { id: 'stone', name: '石のかげ', test: L => wrote(L, '石') || wrote(L, '岩') },
      { id: 'hill', name: '山のかげ', test: L => wrote(L, '山') || wrote(L, '土') },
      { id: 'calm', name: '風を止めた', test: L => wrote(L, '凪') || wrote(L, '重') },
    ],
  },
  {
    id: 'f4', chapter: 1, no: '四', title: '母の花', gifts: ['母'], music: 'field', theme: { seed: 24, hills: 0.8 }, memory: true, ambient: 'petals',
    start: { x: 1, y: 11 },
    map: pad([
      '', '', '', '', '', '', '', '', '', '', '',
      '.....................................',
      '##########################xxxxxxxxxxx',
      '##########################xxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    ], 37),
    paint: [[26, 12, 36, 13, '#']],
    ents: [{ k: '蝶', x: 6, y: 8 }, { k: '蝶', x: 15, y: 7 }],
    faded: [
      { k: '花', x: 4, y: 11 }, { k: '花', x: 7, y: 11 }, { k: '花', x: 10, y: 11 }, { k: '花', x: 13, y: 11 }, { k: '花', x: 22, y: 11 },
      { k: '母', x: 17, y: 9, w: 2, h: 3, always: true, story: true, hint: '……いつも、わしを背負ってくれた人じゃ……', memory: '……母さん', onRestore() { memoryDone('f4'); } },
    ],
    voice: { enter: ['……ここは。……なつかしい匂いがする'], hints: ['花を、ぜんぶ咲かせてごらん', '思い出した字を、薄れた人に書いてごらん'] },
    onTick(W) {
      const fl = W.faded.filter(f => f.k === '花');
      if (!Scene.flag('mom') && fl.every(f => f.restored)) { Scene.setFlag('mom'); later(1.2, () => Game.gift('母', ['……ああ。花を摘んでおったのは、母じゃ', 'わしの、母じゃ'], () => Tutor.point('母', 17, 10, { until: 10 }))); }
    },
    stamps: [{ id: 'mother', name: '母を思い出した', test: L => has(L, 'restore', e => e.k === '母') }],
  },
];
// 思い出の場面をおえる：白紙が描きもどって、道ができる
function memoryDone(id) {
  const def = Scene.cur; if (!def || def.id !== id) return;
  const lines = MEMORIES[id] || [];
  Voice.say(lines);
  // 描きもどす所（場面ごとに決める）
  const rects = def.paint || [[0, 12, W.w - 1, 13, '#']];
  later(2.4, () => {
    for (const [x0, y0, x1, y1, c] of rects) {
      const cells = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (tAt(x, y) === T.BLANK) cells.push([x, y]);
      cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      paintBack(cells, MAPKEY[c] != null ? MAPKEY[c] : T.EARTH);
    }
  });
  Bus.emit('memory', { id });
}
const MEMORIES = {
  f4: ['母は、花の名をたくさん知っておった', '「名を呼んでやると、花はよろこぶんだよ」', '……そう言うて、わしの手に、花をにぎらせた'],
};
const SANDBOX = {
  id: 'sandbox', chapter: 0, title: '自由帳', music: 'title', sandbox: true, theme: { seed: 9 },
  start: { x: 3, y: 9 },
  map: [
    '..................................................',
    '..................................................',
    '..................................................',
    '..................................................',
    '..................................................',
    '..................................................',
    '........................................RRRRR.....',
    '........................................RRRRR.....',
    '..............................#####.....RRRRR.....',
    '.............................#######....RRRRR.....',
    '##############......#########################~~~##',
    '##############......#######################~~~~~##',
    '##############~~~~~~##############################',
    '##################################################',
  ],
  ents: [],
  voice: { enter: ['ここは自由帳。知っている字を、好きなだけ書いてごらん'] },
};

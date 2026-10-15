// ---------------------------------------------------------------------------
// 二の巻 川 ・ 三の巻 山 ・ 四の巻 里 ・ 五の巻 夜 ・ 六の巻 空 ・ 終の巻 名
// ---------------------------------------------------------------------------
const fed = (L, who, what) => L.some(e => e.type === 'eat' && e.who === who && (!what || e.what === what));
const friended = (L, who, by) => L.some(e => e.type === 'friend' && e.who === who && (!by || e.by === by));
const steered = (L, v) => L.some(e => e.type === 'steer' && e.v === v);
const memScene = (id, k, extra) => Object.assign({ id, memory: true, gifts: [k], stamps: [{ id: 'mem', name: k + 'を思い出した', test: L => has(L, 'restore', e => e.k === k) }] }, extra);

SCENES.push(
  // =========================================================================
  // 二の巻　川
  // =========================================================================
  {
    id: 'r1', chapter: 2, no: '一', title: '川べり', music: 'river', theme: { seed: 31, hills: 0.7 },
    start: { x: 1, y: 11 },
    map: B(52, 16, [['#', 0, 12, 13, 15], ['.', 4, 12, 5, 12], ['.', 14, 12, 21, 12], ['~', 14, 13, 21, 14], ['#', 14, 15, 33, 15], ['R', 22, 12, 23, 15], ['.', 24, 12, 31, 12], ['~', 24, 13, 31, 14], ['#', 32, 12, 51, 15]]),
    ents: [
      { k: '橋', x: 4, y: 12, w: 2, h: 1 }, { k: '草', x: 8, y: 11 }, { k: '草', x: 10, y: 11 },
      { k: '舟', x: 24, y: 12 }, { k: '亀', x: 18, y: 12 }, { k: '魚', x: 27, y: 14 }, { k: '魚', x: 18, y: 14 }, { k: '蛙', x: 11, y: 11 },
    ],
    faded: [{ k: '橋', x: 14, y: 12, w: 8, h: 1, memory: '……橋じゃ。父と、毎朝わたった橋じゃ', hint: '……川をまたいで、向こうへ渡す……さっきも見たのう' }],
    drops: [{ x: 22, y: 8 }],
    voice: { enter: ['夏の川じゃ。……水の音がする'], hints: ['こわれた橋は、さっき小さな橋を見たじゃろう', '舟は浮く。舟を書いて乗ったら、向こう岸をさわってごらん', '亀は草が好きじゃ。仲よくなれば、背に乗せてくれる'] },
    stamps: [
      { id: 'bridge', name: '橋をよみがえらせた', test: L => has(L, 'restore', e => e.k === '橋') },
      { id: 'boat', name: '舟をこいだ', test: L => steered(L, '舟') },
      { id: 'turtle', name: '亀に乗った', test: L => steered(L, '亀') },
      { id: 'swim', name: '泳いだ', test: L => has(L, 'heroSwim') },
      { id: 'line', name: '線で渡った', test: L => wrote(L, '一') },
    ],
  },
  {
    id: 'r2', chapter: 2, no: '二', title: '河童の淵', music: 'river', theme: { seed: 32, hills: 0.8 },
    start: { x: 1, y: 11 },
    map: B(44, 16, [['#', 0, 12, 11, 15], ['~', 12, 13, 31, 15], ...[13, 15, 17, 19, 21, 23, 25, 27, 29, 31].map(x => ['R', x, 12, x, 15]), ['#', 32, 12, 43, 15]]),
    ents: [
      { k: '河童', x: 21, y: 11 }, { k: '瓜', x: 3, y: 11 }, { k: '瓜', x: 5, y: 11 },
      { k: '礼', x: 8, y: 8, set: { pinned: true } }, { k: '女', x: 9, y: 11, id: 'oba' },
    ],
    talks: [{ sid: 'oba', near: 3, lines: ['淵の河童さまはね、とても礼儀正しいお方なんだよ', 'ていねいにお辞儀をされたら、お辞儀を返さずにはいられないのさ', 'それから、きゅうりに目がなくてねえ'], repeat: true }],
    voice: { enter: ['淵じゃ。……主がおる'], hints: ['河童は、ていねいなお辞儀に弱い', '河童は、きゅうり（瓜）が大好きじゃ', '河童の頭の上を、こえていくこともできる'] },
    stamps: [
      { id: 'cuke', name: '瓜で友だち', test: L => friended(L, '河童') && fed(L, '河童') },
      { id: 'bow', name: 'お辞儀をした', test: L => has(L, 'bowWeak') },
      { id: 'over', name: '頭の上をこえた', test: L => wrote(L, '一') },
      { id: 'friend', name: '友だちになった', test: L => friended(L, '河童', '友') },
      { id: 'sleep', name: '眠らせた', test: L => has(L, 'sleep', e => e.who === '河童') },
    ],
  },
  {
    id: 'r3', chapter: 2, no: '三', title: '滝', music: 'river', theme: { seed: 33, hills: 1.3, peak: 0.6 },
    start: { x: 1, y: 15 },
    map: B(34, 20, [['#', 0, 16, 5, 19], ['~', 6, 16, 20, 18], ['#', 6, 19, 19, 19], ['x', 20, 19, 20, 19], ['#', 21, 4, 33, 19], ['~', 20, 16, 20, 18], ['R', 19, 4, 19, 5]]),
    ents: [
      { k: '滝', x: 20, y: 3, set: { pinned: true, src: { x: 20, y: 3, amt: 1, every: 2, ttl: Infinity } } },
      { k: '鯉', x: 10, y: 17 }, { k: '梯', x: 3, y: 13, h: 3 }, { k: '米', x: 1, y: 15 },
    ],
    drops: [{ x: 8, y: 9 }],
    voice: { enter: ['滝じゃ。……上へ行かねばならん'], hints: ['鯉が滝をのぼりきると、竜になるという', '鯉は米が好きじゃ。滝の下へ、さそってごらん', '線を書いて、階段にするのもよい'] },
    stamps: [
      { id: 'dragon', name: '鯉が竜になった', test: L => has(L, 'dragon') },
      { id: 'ride', name: '竜に乗った', test: L => ridOn(L, '竜') },
      { id: 'lines', name: '線の階段', test: L => L.filter(e => e.type === 'write' && e.k === '一').length >= 4 },
      { id: 'ladder', name: 'はしごをかけた', test: L => wrote(L, '梯') },
    ],
  },
  memScene('r4', '父', {
    chapter: 2, no: '四', title: '父の舟', music: 'river', theme: { seed: 34, hills: 0.6, sky: 'rgba(230,150,90,.18)' },
    start: { x: 1, y: 11 },
    map: B(38, 15, [['#', 0, 12, 9, 14], ['~', 10, 13, 17, 13], ['#', 10, 14, 17, 14], ['#', 18, 12, 20, 14], ['x', 21, 12, 37, 14]]),
    paint: [[21, 12, 37, 13, '#']],
    ents: [{ k: '蛍', x: 6, y: 8 }],
    faded: [
      { k: '魚', x: 11, y: 10 }, { k: '魚', x: 14, y: 9 }, { k: '魚', x: 16, y: 10 },
      { k: '橋', x: 10, y: 12, w: 8, h: 1, always: true },
      { k: '父', x: 19, y: 10, w: 1, h: 2, always: true, story: true, hint: '……大きな手で、竿をにぎっておった……', memory: '……父さん', onRestore() { memoryDone('r4'); } },
    ],
    voice: { enter: ['夕焼けの湖じゃ。……舟が出ておる'], hints: ['はねる魚に、名を返してごらん', '思い出した字を、舟の上の人に書いてごらん'] },
    onTick(W) {
      const fl = W.faded.filter(f => f.k === '魚');
      if (!Scene.flag('dad') && fl.every(f => f.restored)) { Scene.setFlag('dad'); later(1.2, () => Game.gift('父', ['……魚がはねるたび、父は笑うた', 'わしの、父じゃ'], () => Tutor.point('父', 19, 11, { until: 10 }))); }
    },
  }),
  // =========================================================================
  // 三の巻　山
  // =========================================================================
  {
    id: 'm1', chapter: 3, no: '一', title: '山道', music: 'mountain', theme: { seed: 41, hills: 1.5, peak: 0.4 }, season: 'autumn', ambient: 'leaves',
    start: { x: 1, y: 20 },
    map: B(40, 22, [['#', 0, 21, 39, 21], ['#', 9, 16, 39, 20], ['#', 18, 11, 39, 15], ['#', 27, 6, 39, 10], ['R', 4, 18, 5, 20]]),
    ents: [
      { k: '竹', x: 2, y: 20, h: 1, full: true }, { k: '蔦', x: 3, y: 18, h: 3 }, { k: '縄', x: 17, y: 11, h: 2 },
      { k: '猿', x: 22, y: 10 }, { k: '柿', x: 24, y: 10 }, { k: '山', x: 34, y: 1, set: { pinned: true } }, { k: '長', x: 14, y: 12, set: { pinned: true } },
    ],
    faded: [{ k: '蔦', x: 26, y: 6, w: 1, h: 5, hint: '……壁をはいのぼる、緑のもの……' }],
    drops: [{ x: 12, y: 9 }],
    voice: { enter: ['秋の山道じゃ。師のもとへ通うた道……けわしいのう'], hints: ['竹はぐんぐん伸びる。登れるぞ', 'あの縄は短い。「長」と書けば長くなる', '上の壁の薄れたつたに、名を返してごらん'] },
    stamps: [
      { id: 'bamboo', name: '竹で登った', test: L => wrote(L, '竹') },
      { id: 'rope', name: '縄をたらした', test: L => wrote(L, '縄') },
      { id: 'ivy', name: 'つたで登った', test: L => wrote(L, '蔦') },
      { id: 'ladder', name: 'はしごをかけた', test: L => wrote(L, '梯') },
      { id: 'lines', name: '線の階段', test: L => L.filter(e => e.type === 'write' && e.k === '一').length >= 4 },
    ],
  },
  {
    id: 'm2', chapter: 3, no: '二', title: '熊の森', music: 'mountain', theme: { seed: 42, hills: 1.1 }, season: 'autumn', ambient: 'leaves',
    start: { x: 2, y: 11 },
    map: B(50, 15, [['#', 0, 12, 49, 14]]),
    ents: [
      { k: '焚', x: 0, y: 11, set: { eternal: true } }, { k: '火', x: 7, y: 7, set: { pinned: true, eternal: true } }, { k: '家', x: 4, y: 9 }, { k: '鈴', x: 9, y: 9, set: { pinned: true } },
      { k: '花', x: 13, y: 11 }, { k: '花', x: 14, y: 11 }, { k: '蜂', x: 13, y: 8 }, { k: '蜜', x: 15, y: 11 },
      { k: '林', x: 17, y: 10 }, { k: '熊', x: 26, y: 10 }, { k: '林', x: 36, y: 10 }, { k: '柿', x: 40, y: 11 },
    ],
    drops: [{ x: 18, y: 7 }],
    voice: { enter: ['森じゃ。……何かの気配がする'], hints: ['熊は、鈴の音と火をいやがる', '熊は、はちみつに目がない', '林や森の中にいると、見つかりにくい。人をおとりにするのもよい'] },
    stamps: [
      { id: 'honey', name: 'はちみつで仲よし', test: L => fed(L, '熊', '蜜') },
      { id: 'bell', name: '鈴の音', test: L => has(L, 'flee', e => e.who === '熊' && e.from === '鈴') || wrote(L, '鈴') },
      { id: 'fire', name: '火でおどかした', test: L => wrote(L, '火') || wrote(L, '焚') || wrote(L, '炎') },
      { id: 'decoy', name: 'おとり', test: L => wrote(L, '人') || wrote(L, '人形') },
      { id: 'sleep', name: '眠らせた', test: L => has(L, 'sleep', e => e.who === '熊') },
    ],
  },
  {
    id: 'm3', chapter: 3, no: '三', title: '天狗の峠', music: 'mountain', theme: { seed: 43, hills: 1.6, peak: 0.5 }, season: 'autumn', ambient: 'leaves',
    start: { x: 1, y: 12 },
    map: B(42, 16, [['#', 0, 13, 41, 15], ['#', 8, 12, 33, 12], ['#', 14, 11, 28, 11], ['x', 0, 15, 41, 15]]),
    ents: [{ k: '天狗', x: 22, y: 9 }, { k: '重', x: 6, y: 9, set: { pinned: true } }, { k: '止', x: 4, y: 10, set: { pinned: true } }],
    drops: [{ x: 22, y: 4 }],
    voice: { enter: ['峠じゃ。……天狗がおるという'], hints: ['天狗は、礼を知る者を通す', '重くなれば、風に負けぬ', '風と止で、凪。風がやむ'] },
    stamps: [
      { id: 'bow', name: '礼をつくした', test: L => friended(L, '天狗', '礼') },
      { id: 'friend', name: '天狗と友だち', test: L => friended(L, '天狗', '友') },
      { id: 'laugh', name: '天狗を笑わせた', test: L => has(L, 'laugh', e => e.who === '天狗') },
      { id: 'over', name: '天狗をこえた', test: L => wrote(L, '一') },
      { id: 'calm', name: '風を止めた', test: L => wrote(L, '凪') || wrote(L, '重') },
    ],
  },
  memScene('m4', '師', {
    chapter: 3, no: '四', title: '師の庵', music: 'mountain', theme: { seed: 44, hills: 1 }, season: 'autumn', ambient: 'leaves',
    start: { x: 1, y: 11 },
    map: B(36, 15, [['#', 0, 12, 23, 14], ['x', 24, 12, 35, 14]]),
    paint: [[24, 12, 35, 13, '#']],
    ents: [{ k: '家', x: 13, y: 9 }],
    faded: [
      { k: '竹', x: 4, y: 9, w: 1, h: 3 }, { k: '灯', x: 11, y: 11 }, { k: '木', x: 20, y: 10 }, { k: '花', x: 8, y: 11 },
      { k: '師', x: 17, y: 10, w: 1, h: 2, always: true, story: true, hint: '……筆の持ち方から、教えてくれた人じゃ……', memory: '……師匠', onRestore() { memoryDone('m4'); } },
    ],
    voice: { enter: ['師の庵じゃ。……何もかも、薄れてしもうた'], hints: ['庵のまわりのものに、名を返してごらん', '思い出した字を、庵の前の人に書いてごらん'] },
    onTick(W) {
      const fl = W.faded.filter(f => f.k !== '師');
      if (!Scene.flag('sensei') && fl.every(f => f.restored)) { Scene.setFlag('sensei'); later(1.2, () => Game.gift('師', ['……「字は、形ではない。心をうつすものじゃ」', 'わしに筆を教えてくれた、師じゃ'], () => Tutor.point('師', 17, 11, { until: 10 }))); }
    },
  }),
  // =========================================================================
  // 四の巻　里
  // =========================================================================
  {
    id: 'v1', chapter: 4, no: '一', title: '里の門', music: 'village', theme: { seed: 51, hills: 0.7 }, season: 'winter', ambient: 'snow',
    start: { x: 1, y: 11 },
    map: B(44, 15, [['#', 0, 12, 43, 14], ['R', 19, 4, 20, 8]]),
    ents: [
      { k: '門', x: 19, y: 9, locked: true }, { k: '大木', x: 9, y: 8 }, { k: '鍵', x: 10, y: 4, set: { pinned: true } }, { k: '烏', x: 11, y: 5 },
      { k: '家', x: 26, y: 9 }, { k: '家', x: 33, y: 9 }, { k: '犬', x: 30, y: 11 }, { k: '猫', x: 37, y: 11 },
    ],
    drops: [{ x: 19, y: 3 }],
    voice: { enter: ['冬の里じゃ。……門が閉まっておる'], hints: ['あの木の上の、光るものは何じゃ', '鍵を、門に書いてごらん', '塀をこえる手もある'] },
    stamps: [
      { id: 'key', name: '鍵で開けた', test: L => has(L, 'open', e => e.who === '門') },
      { id: 'over', name: '塀をこえた', test: (L, W) => !has(L, 'open', e => e.who === '門') },
    ],
  },
  {
    id: 'v2', chapter: 4, no: '二', title: '雪の橋', music: 'village', theme: { seed: 52, hills: 0.9 }, season: 'winter', ambient: 'snow',
    start: { x: 7, y: 10 },
    map: B(50, 15, [['#', 0, 12, 49, 14], ['S', 0, 11, 13, 11], ['S', 34, 11, 49, 11], ['~', 14, 12, 33, 13], ['I', 14, 11, 19, 11], ['I', 28, 11, 33, 11], ['#', 14, 14, 33, 14], ['.', 1, 11, 4, 11], ['~', 1, 12, 4, 12]]),
    ents: [{ k: '雪女', x: 40, y: 9 }, { k: '猿', x: 2, y: 11 }, { k: '湯', x: 3, y: 8, set: { pinned: true } }, { k: '椿', x: 11, y: 9 }],
    faded: [{ k: '橋', x: 20, y: 11, w: 8, h: 1 }],
    voice: { enter: ['雪じゃ。……川が凍っておる。まん中だけは、とけておるな'], hints: ['こわれた橋に名を返すか、凍らせるか', '雪女は、あたたかいものがきらいじゃ', '火、お日さま、お湯、春……'] },
    stamps: [
      { id: 'fire', name: '火で去らせた', test: L => has(L, 'flee', e => e.who === '雪女') && (wrote(L, '火') || wrote(L, '焚') || wrote(L, '炎')) },
      { id: 'spring', name: '春をよんだ', test: L => wrote(L, '春') },
      { id: 'sun', name: 'お日さま', test: L => wrote(L, '日') },
      { id: 'hot', name: 'お湯で', test: L => wrote(L, '湯') },
      { id: 'ice', name: '川を凍らせた', test: L => wrote(L, '凍') || wrote(L, '氷') || wrote(L, '冷') },
    ],
  },
  {
    id: 'v3', chapter: 4, no: '三', title: '節分の夜', music: 'village', theme: { seed: 53, hills: 0.6 }, season: 'winter', dark: 0.45, night: true, ambient: 'snow',
    start: { x: 1, y: 11 },
    map: B(46, 15, [['#', 0, 12, 45, 14], ['#', 30, 11, 45, 11], ['#', 33, 10, 45, 10]]),
    ents: [
      { k: '灯', x: 4, y: 11 }, { k: '灯', x: 14, y: 11 }, { k: '灯', x: 24, y: 11 }, { k: '灯', x: 36, y: 9 },
      { k: '家', x: 6, y: 9 }, { k: '豆', x: 10, y: 11 }, { k: '柊', x: 12, y: 11 }, { k: '鰯', x: 13, y: 10, set: { pinned: true } },
      { k: '酒', x: 19, y: 11 }, { k: '子', x: 16, y: 11, id: 'kid' }, { k: '鬼', x: 27, y: 10 },
    ],
    talks: [{ sid: 'kid', near: 3, lines: ['鬼がいて、お社へ行けないの', '「鬼は外！」って、豆をまけばいいんだって', 'でもね……あの鬼、ほんとうはさみしいだけかも'], repeat: true }],
    voice: { enter: ['節分の夜じゃ。……鬼が出たか'], hints: ['豆をまけば、鬼は逃げる', '鬼は酒に目がない。酔えば眠る', '鬼と友だちになる手も、あるかもしれん'] },
    stamps: [
      { id: 'beans', name: '鬼は外！', test: L => has(L, 'flee', e => e.who === '鬼' && e.from === '豆') },
      { id: 'sake', name: '酒で眠らせた', test: L => has(L, 'drunk', e => e.who === '鬼') },
      { id: 'friend', name: '鬼と友だち', test: L => friended(L, '鬼') },
      { id: 'laugh', name: '鬼を笑わせた', test: L => has(L, 'laugh', e => e.who === '鬼') },
      { id: 'holly', name: '柊と鰯', test: L => wrote(L, '柊') || wrote(L, '鰯') },
    ],
  },
  memScene('v4', '友', {
    chapter: 4, no: '四', title: '雪の日の友', music: 'village', theme: { seed: 54, hills: 0.7 }, season: 'winter', ambient: 'snow',
    start: { x: 1, y: 11 },
    map: B(36, 15, [['#', 0, 12, 23, 14], ['S', 0, 11, 23, 11], ['x', 24, 11, 35, 14]]),
    paint: [[24, 11, 35, 11, '.'], [24, 12, 35, 13, '#']],
    faded: [
      { k: '犬', x: 6, y: 10 }, { k: '家', x: 9, y: 8, w: 3, h: 3 }, { k: '木', x: 20, y: 9 },
      { k: '友', x: 15, y: 9, w: 1, h: 2, always: true, story: true, hint: '……いつも、となりで笑っておった子じゃ……', memory: '……おまえか', onRestore() { memoryDone('v4'); } },
    ],
    voice: { enter: ['雪の日の、空き地じゃ'], hints: ['まわりのものに、名を返してごらん', '思い出した字を、子に書いてごらん'] },
    onTick(W) {
      const fl = W.faded.filter(f => f.k !== '友');
      if (!Scene.flag('tomo') && fl.every(f => f.restored)) { Scene.setFlag('tomo'); later(1.2, () => Game.gift('友', ['……雪玉をぶつけあって、日が暮れるまで遊んだ', 'わしの、友じゃ'], () => Tutor.point('友', 15, 10, { until: 10 }))); }
    },
  }),
  // =========================================================================
  // 五の巻　夜（紺紙金泥）
  // =========================================================================
  {
    id: 'n1', chapter: 5, no: '一', title: '闇の森', music: 'night', theme: { seed: 61, hills: 1 }, konshi: true, dark: 0.88, night: true,
    start: { x: 1, y: 11 },
    map: B(50, 15, [['#', 0, 12, 49, 14], ['.', 15, 12, 17, 13], ['x', 15, 14, 17, 14], ['.', 29, 12, 30, 13], ['x', 29, 14, 30, 14], ['~', 38, 12, 41, 13]]),
    ents: [
      { k: '光', x: 3, y: 9 }, { k: '月', x: 30, y: 1, set: { pinned: true } }, { k: '蛍', x: 22, y: 9 }, { k: '蛍', x: 39, y: 10 },
      { k: '森', x: 7, y: 9 }, { k: '鬼火', x: 34, y: 8 },
    ],
    drops: [{ x: 24, y: 6 }],
    voice: { enter: ['……真っ暗じゃ。何も見えん', '暗い所へは、おまえも進めぬ。灯りがいる'], hints: ['光、灯、火……明るいものを書いてごらん', '自分に「明」を書けば、おまえが光る', '月をよべば、夜が少し明るくなる'] },
    stamps: [
      { id: 'light', name: '光をともした', test: L => wrote(L, '光') || wrote(L, '灯') || wrote(L, '火') },
      { id: 'self', name: '自分が光った', test: L => has(L, 'heroGlow') },
      { id: 'moon', name: '月をよんだ', test: L => wrote(L, '月') || wrote(L, '満月') },
      { id: 'sun', name: '朝をよんだ', test: L => wrote(L, '日') || wrote(L, '朝') || wrote(L, '東') || wrote(L, '朝日') },
      { id: 'fire', name: '蛍をよんだ', test: L => wrote(L, '蛍') },
    ],
  },
  {
    id: 'n2', chapter: 5, no: '二', title: '化け岩', music: 'night', theme: { seed: 62, hills: 1 }, konshi: true, dark: 0.5, night: true,
    start: { x: 1, y: 11 },
    map: B(46, 15, [['#', 0, 12, 45, 14], ['R', 20, 3, 21, 9], ['R', 26, 3, 27, 9]]),
    ents: [
      { k: '灯', x: 5, y: 11 }, { k: '灯', x: 33, y: 11 }, { k: '狐', x: 9, y: 11 }, { k: '油', x: 12, y: 11 }, { k: '鏡', x: 15, y: 11 },
      { k: '岩', x: 23, y: 10, id: 'fake', set: { trueForm: '狸' } }, { k: '酒', x: 3, y: 11 },
    ],
    voice: { enter: ['……岩で道がふさがっておる。こんな所に、岩などあったかのう'], hints: ['あの岩、ときどき動いておらんか', '鏡にうつせば、正体がわかる', '狸は、酒と犬がきらいで、酒は好きじゃ'] },
    onTick(W) {
      const f = W.ents.find(e => e.alive && e.sid === 'fake' && e.k === '岩');
      if (!f) return;
      if (W.tick % 80 === 0) { f.squash = 0.6; if (chance(0.5)) f.talk('……', 1); }
      // 正体があらわれる：鏡・酒・犬・笑・地震・破
      const near = (k, r) => W.ents.some(o => o.alive && o.k === k && entDist(o, f) <= r);
      let why = null;
      if (near('鏡', 3)) why = '鏡'; else if (near('酒', 4)) why = '酒'; else if (near('犬', 4)) why = '犬'; else if (f.laughT > 0) why = '笑'; else if (f.stunT > 0) why = '雷';
      if (why) {
        transformEnt(f, '狸', { force: true }); f.talk(why === '鏡' ? 'ばれたか！' : why === '酒' ? 'お、お酒……' : why === '犬' ? 'ひゃあ、犬だ！' : 'ぽんぽこ', 2.4);
        Sfx.poof(); Fx.puff(f.cx, f.cy, 16); Bus.emit('reveal', { who: '狸', by: why });
        if (why === '犬') { f.leaving = true; f.leaveDir = 1; }
      }
    },
    stamps: [
      { id: 'mirror', name: '鏡で正体を見た', test: L => has(L, 'reveal', e => e.by === '鏡') },
      { id: 'sake', name: '酒でつった', test: L => has(L, 'reveal', e => e.by === '酒') },
      { id: 'dog', name: '犬でおどかした', test: L => has(L, 'reveal', e => e.by === '犬') },
      { id: 'over', name: '岩をこえた', test: L => !has(L, 'reveal') },
    ],
  },
  memScene('n3', '別', {
    chapter: 5, no: '三', title: '月の橋', music: 'night', theme: { seed: 63, hills: 0.8 }, konshi: true, dark: 0.3, night: true,
    start: { x: 1, y: 11 },
    map: B(38, 15, [['#', 0, 12, 9, 14], ['~', 10, 13, 17, 14], ['#', 18, 12, 20, 14], ['x', 21, 12, 37, 14]]),
    paint: [[21, 12, 37, 13, '#']],
    ents: [{ k: '月', x: 18, y: 1, set: { pinned: true } }],
    faded: [
      { k: '蛍', x: 6, y: 9 }, { k: '星', x: 12, y: 3 }, { k: '星', x: 25, y: 2 },
      { k: '橋', x: 10, y: 12, w: 8, h: 1, always: true },
      { k: '別', x: 19, y: 10, w: 1, h: 2, always: true, story: true, hint: '……さよならを、言えなかった夜じゃ……', memory: '……さよなら', onRestore() { memoryDone('n3'); } },
    ],
    voice: { enter: ['月の夜じゃ。……この橋で、だいじな人を見送った'], hints: ['夜空のものに、名を返してごらん', '思い出した字を、橋の向こうの人に'] },
    onTick(W) {
      const fl = W.faded.filter(f => f.k === '蛍' || f.k === '星');
      if (!Scene.flag('wakare') && fl.every(f => f.restored)) { Scene.setFlag('wakare'); later(1.2, () => Game.gift('別', ['……あの夜、舟は遠くへ行ってしもうた', 'さよならも、言えなんだ。……別れじゃ'], () => Tutor.point('別', 19, 11, { until: 10 }))); }
    },
  }),
  // =========================================================================
  // 六の巻　空
  // =========================================================================
  {
    id: 's1', chapter: 6, no: '一', title: '雲の上', music: 'sky', theme: { seed: 71, hills: 0.4 },
    start: { x: 1, y: 13 },
    map: B(52, 18, [['#', 0, 14, 7, 15], ['x', 0, 16, 51, 17], ['#', 44, 9, 51, 15]]),
    ents: [
      { k: '雲', x: 8, y: 13, set: { pinned: true } }, { k: '雲', x: 18, y: 10 }, { k: '雲', x: 29, y: 12, set: { pinned: true } },
      { k: '鶴', x: 4, y: 11 }, { k: '凧', x: 36, y: 4 }, { k: '風', x: 24, y: 3, set: { pinned: true } },
    ],
    drops: [{ x: 30, y: 4 }],
    voice: { enter: ['雲の上じゃ。……下は、白紙じゃ。落ちるでないぞ'], hints: ['雲には乗れる。乗ったら、行きたい所をさわる', '鶴は魚が好きじゃ。仲よくなれば、背に乗せて飛んでくれる', '風を書けば、雲は流れる'] },
    stamps: [
      { id: 'crane', name: '鶴に乗った', test: L => ridOn(L, '鶴') },
      { id: 'cloud', name: '雲をあやつった', test: L => steered(L, '雲') },
      { id: 'rainbow', name: '虹の橋', test: L => wrote(L, '虹') },
      { id: 'fly', name: '空を飛んだ', test: L => has(L, 'heroFly') },
      { id: 'line', name: '線の道', test: L => L.filter(e => e.type === 'write' && e.k === '一').length >= 5 },
    ],
  },
  {
    id: 's2', chapter: 6, no: '二', title: '雷の峰', music: 'sky', theme: { seed: 72, hills: 1.6, peak: 0.7 },
    start: { x: 1, y: 15 },
    map: B(44, 20, [['#', 0, 16, 43, 19], ['#', 30, 5, 43, 15], ['#', 24, 10, 29, 15], ['x', 0, 19, 43, 19]]),
    ents: [{ k: '竜', x: 12, y: 5 }, { k: '玉', x: 24, y: 2, set: { pinned: true } }, { k: '雷', x: 20, y: 1, set: { pinned: true } }, { k: '雲', x: 16, y: 3, set: { pinned: true } }],
    drops: [{ x: 18, y: 2 }],
    voice: { enter: ['雷の峰じゃ。……竜が、空を泳いでおる'], hints: ['竜は、丸い玉が好きじゃ', '玉を竜のそばへ。仲よくなれば、背に乗せてくれる', '高い所へは、いろいろな登り方がある'] },
    onTick(W) { if (W.clearT > 0) W.clearT -= TICK; if (W.tick % 140 === 70 && !(W.calmT > 0) && !(W.clearT > 0)) { const x = 14 + rndi(12); lightning(x); } },
    stamps: [
      { id: 'dragon', name: '竜に乗った', test: L => ridOn(L, '竜') },
      { id: 'jewel', name: '玉で友だち', test: L => friended(L, '竜', '玉') },
      { id: 'calm', name: '雷をしずめた', test: L => wrote(L, '晴') || wrote(L, '凪') || wrote(L, '青空') },
      { id: 'climb', name: '自分で登った', test: L => !ridOn(L, '竜') },
    ],
  },
  memScene('s3', '夢', {
    chapter: 6, no: '三', title: '夢', music: 'sky', theme: { seed: 73, hills: 0.5, sky: 'rgba(200,170,220,.2)' },
    start: { x: 1, y: 11 },
    map: B(38, 15, [['#', 0, 12, 25, 13], ['x', 0, 14, 37, 14], ['x', 26, 12, 37, 13]]),
    paint: [[26, 12, 37, 13, '#']],
    faded: [
      { k: '虹', x: 6, y: 6, w: 8, h: 1 }, { k: '鳥', x: 17, y: 5 }, { k: '竜', x: 20, y: 2, w: 3, h: 3 },
      { k: '夢', x: 13, y: 10, w: 1, h: 2, always: true, story: true, hint: '……いつか、描いてみたかったものじゃ……', memory: '……ああ、これじゃった', onRestore() { memoryDone('s3'); } },
    ],
    voice: { enter: ['……ここは、どこじゃ。見たこともない場所じゃ'], hints: ['夢に見たものに、名を返してごらん', '思い出した字を、まん中に'] },
    onTick(W) {
      const fl = W.faded.filter(f => f.k !== '夢');
      if (!Scene.flag('yume') && fl.every(f => f.restored)) { Scene.setFlag('yume'); later(1.2, () => Game.gift('夢', ['……空の上まで、絵にしたかった', 'わしの、夢じゃ'], () => Tutor.point('夢', 13, 11, { until: 10 }))); }
    },
  }),
);
Object.assign(MEMORIES, {
  r4: ['父は、口数の少ない人じゃった', '魚が釣れると、だまって、わしの頭をなでた', '……その手の大きさを、いまも覚えておる'],
  m4: ['師は言うた。「名を書くとは、そのものを、もう一度生むことじゃ」', '……わしは、その言葉が好きで、絵師になった'],
  v4: ['雪の日も、祭りの夜も、いつもいっしょじゃった', '「おまえの絵、おれは好きだ」', '……あいつが、はじめて言うてくれたんじゃ'],
  n3: ['だいじな人を、この橋で見送った', '月が、川に落ちておった', '……さよならは、言えなんだ。いまも、それだけが心残りじゃ'],
  s3: ['竜の背にのって、雲をこえて、虹をわたる', '……子どものころから、ずっと見ておった夢じゃ', 'その夢を、絵巻のおしまいに描こうと思うておった'],
});

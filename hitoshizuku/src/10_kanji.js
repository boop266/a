// ---------------------------------------------------------------------------
// 字の表：書くとどうなるか
//   cat: 字帳のどの頁か（自然・草木・生き物・物・動き・様子・心・言葉）
//   kind: thing(物) plant(草木) beast(生き物) struct(形の決まった物) terra(地形) fluid(水) flame(火) sky(空の出来事)
//         verb(動き) adj(様子) feel(心) self(自分に)
//   物の性質（どれもあれば効く）：
//     solid 立てる・ふさぐ / heavy 0軽い 1ふつう 2重い 3動かない / float 水に浮く / fly 飛ぶ / climb 登れる
//     push 押せる / fragile 割れる / root 根がある / burn 燃えている秒 / ash 燃えたあと / melt 溶けたあと
//     glow 光の届く広さ / heat 熱 / cold 冷え / conduct 雷を通す / food 食べ物の種類 / life 消えるまでの秒
//   生き物（ai）：spd 速さ / sense 気づく広さ / eats 食べる物 / likes 好きな物 / fears こわい物（#fire #light #noise #big #dog）
//                hostile 人を追う / guard その場を守る / ride 乗れる / jump 跳べる幅 / night 夜に動く
// ---------------------------------------------------------------------------
const KDEF = {};
const CATS = [
  ['all', 'すべて'], ['shizen', '自然'], ['kusaki', '草木'], ['ikimono', '生き物'], ['mono', '物'], ['ugoki', '動き'], ['yousu', '様子'], ['kokoro', '心'], ['kotoba', '言葉'],
];
function D(ch, yomi, imi, cat, p) {
  const d = Object.assign({ ch, yomi, imi, cat, kind: 'thing', col: 'sumi', sz: 1, heavy: 1 }, p || {});
  if (typeof d.sz === 'number') d.w = d.h = d.sz; else { d.w = d.sz[0]; d.h = d.sz[1]; }
  if (d.ai) { d.beast = true; d.ai = Object.assign({ spd: 2, sense: 5, eats: [], likes: [], fears: [], jump: 1, step: 1, drop: 3 }, d.ai); }
  KDEF[ch] = d;
  return d;
}
/*GLYPHS*/
// ===== 自然 =====
D('一', 'いち', '一本の線', 'shizen', { kind: 'struct', sz: [2, 1], solid: true, heavy: 0, ink: true, fly: true, note: '宙に墨の線を一本ひく。乗れる。何本もひけば階段にも橋にもなる。水や雨にぬれると溶ける。', gen: '横に引いた一本の線。数のはじまり。' });
D('日', 'ひ', 'お日さま', 'shizen', { kind: 'sky', col: 'shu', fx: 'sun', note: 'お日さまが出て、昼になる。暗がりが明るくなり、雪や氷がゆっくり溶け、草木が育つ。', gen: '丸い太陽の形。' });
D('月', 'つき', 'お月さま', 'shizen', { kind: 'sky', col: 'kogane', fx: 'moon', note: '月が出て、夜になる。昼の生き物は眠り、夜の生き物が動き出す。', gen: '欠けた月の形。' });
D('星', 'ほし', '流れ星', 'shizen', { kind: 'sky', col: 'kogane', fx: 'star', note: '空から流れ星が落ちる。当たった岩は割れ、燃える物は燃える。', gen: '日（光る玉）と生（生まれる）。きらきら生まれる光。' });
D('山', 'やま', '山', 'shizen', { kind: 'terra', col: 'cha', fx: 'mountain', note: '土を山の形に盛る。登れる。水をせき止める。', gen: '三つの峰が並ぶ山の形。' });
D('川', 'かわ', '川', 'shizen', { kind: 'fluid', col: 'ai', fx: 'river', note: 'しばらく水がわき出して流れる。くぼみを満たす。', gen: '水の流れる筋の形。' });
D('水', 'みず', '水', 'shizen', { kind: 'fluid', col: 'ai', fx: 'water', note: '水をまく。火を消し、草木を育て、低い方へ流れる。', gen: '流れる水の形。' });
D('火', 'ひ', '火', 'shizen', { kind: 'flame', col: 'shu', flame: true, heavy: 0, solid: false, life: 14, heat: 1, glow: 3, burn: 14, note: '火をおこす。燃える物に燃え移る。暗がりを照らし、氷を溶かし、獣はこわがる。水で消える。', gen: '燃え上がる炎の形。' });
D('炎', 'ほのお', '大きな炎', 'shizen', { kind: 'flame', col: 'shu', flame: true, sz: 2, heavy: 0, life: 18, heat: 2.5, glow: 5, burn: 18, note: '大きな炎。まわりをよく燃やし、遠くまで照らす。', gen: '火が二つ重なって、燃えさかる炎。' });
D('焚', 'たき', 'たき火', 'shizen', { kind: 'flame', col: 'shu', flame: true, sz: 1, heavy: 2, life: 60, heat: 1.5, glow: 5, burn: 60, spreadless: true, note: '長く燃えるたき火。燃え広がりにくい。暖まり、明るく、獣は近寄らない。', gen: '林の下に火。木を燃やすたき火。' });
D('土', 'つち', '土', 'shizen', { kind: 'thing', col: 'tsuchi', becomes: 'EARTH', heavy: 1, note: '土のかたまり。落ちて止まると地面になる。穴を埋め、段を作り、水をせき止める。', gen: '地面から芽が出る形とも、土を盛った形とも。' });
D('石', 'いし', '石', 'shizen', { solid: true, push: true, heavy: 1, col: 'hai', note: '石。重くて沈む。押せる。上に乗れる。高い所から落とすと、割れ物を割る。', gen: '崖（厂）の下に転がる石（口）。' });
D('岩', 'いわ', '大きな岩', 'shizen', { solid: true, sz: 2, heavy: 3, col: 'hai', breakTo: '石', fragileBy: '破', note: '大きな岩。人の力では動かない。道をふさぎ、水をせき止める。「破」で割れる。', gen: '山の石。' });
D('砂', 'すな', '砂', 'shizen', { kind: 'terra', col: 'tsuchi', fx: 'sand', note: '砂をまく。さらさら流れ落ちて、すき間を埋める。水を吸う。', gen: '石が少なく（細かく）なったもの。' });
D('氷', 'こおり', '氷', 'shizen', { fx: 'ice', solid: true, float: true, heavy: 1, col: 'sora', melt: '水', cold: 1, push: true, slip: true, note: '氷のかたまり。水に浮く。熱で溶けて水になる。深い水に書くと水面が凍って歩ける。', gen: '水が冫（こおり）になったもの。' });
D('雪', 'ゆき', '雪', 'shizen', { kind: 'sky', col: 'sora', fx: 'snow', note: '雪をふらせる。地面に積もり、水面を凍らせ、火を消す。', gen: '雨と、ほうきで掃く手（ヨ）。掃けるほど積もる雨。' });
D('雨', 'あめ', '雨', 'shizen', { kind: 'sky', col: 'ai', fx: 'rain', note: '雨雲を呼ぶ。火を消し、水をため、草木を育てる。風で流れる。', gen: '雲から雨つぶが落ちる形。' });
D('雲', 'くも', '雲', 'shizen', { kind: 'struct', col: 'sora', sz: [3, 1], solid: true, fly: true, heavy: 0, cloud: true, note: '乗れる雲。ふわりと浮かび、風に流される。', gen: '雨と云（立ちのぼる湯気）。' });
D('風', 'かぜ', '風', 'shizen', { kind: 'sky', col: 'sora', fx: 'wind', note: '人の向こうへ風が吹く。軽い物を飛ばし、雲を流し、火を広げる。小さな火は吹き消す。', gen: '帆（几）の中に虫。風で生まれる生き物とも。' });
D('嵐', 'あらし', '嵐', 'shizen', { kind: 'sky', col: 'sora', fx: 'storm', note: '大風と大雨。画面じゅうの軽い物が飛び、火が消える。', gen: '山に吹きおろす風。' });
D('凪', 'なぎ', '凪', 'shizen', { kind: 'sky', col: 'sora', fx: 'calm', note: '風がぴたりとやむ。波も静まる。', gen: '風が止まる。日本で生まれた字（国字）。' });
D('雷', 'かみなり', '雷', 'shizen', { kind: 'sky', col: 'kin', fx: 'thunder', note: '雷を落とす。燃える物は燃え、獣はしびれる。水と金物を伝わる。', gen: '雨と田。田はごろごろ鳴る雷の形とも。' });
D('光', 'ひかり', '光の玉', 'shizen', { kind: 'thing', col: 'kogane', fly: true, glow: 5, heavy: 0, wisp: true, note: '宙に浮かぶ光の玉。暗がりを照らす。闇の物はこわがる。', gen: '人の頭の上で火が輝く形。' });
D('闇', 'やみ', '闇', 'shizen', { kind: 'thing', col: 'kon', fly: true, heavy: 0, dark: 4, wisp: true, note: 'あたりを暗くする。中に隠れると見つからない。闇の物が喜ぶ。', gen: '門の内で音だけがする。見えない暗がり。' });
D('虹', 'にじ', '虹', 'shizen', { kind: 'struct', col: 'murasaki', fx: 'rainbow', solid: true, fly: true, life: 40, rainbow: true, note: '虹の橋。向こう岸まで弓なりにかかり、しばらく渡れる。', gen: '虫（へび・竜）と工（天地をつらぬく）。空にかかる竜。' });
D('海', 'うみ', '海', 'shizen', { kind: 'fluid', col: 'ai', fx: 'sea', note: 'たくさんの水があふれる。', gen: '水の中に母（毎）。「海の中には母がいる」と詠んだ詩人もいた。' });
D('池', 'いけ', '池', 'shizen', { kind: 'terra', col: 'ai', fx: 'pond', note: '地面をくぼませて水をはる。', gen: '水と也（くねる蛇・器）。' });
D('泉', 'いずみ', '泉', 'shizen', { kind: 'fluid', col: 'ai', fx: 'spring', source: 1, note: '水がこんこんとわき続ける。', gen: '白（岩穴）から水がわく。' });
D('滝', 'たき', '滝', 'shizen', { kind: 'fluid', col: 'ai', fx: 'falls', note: '上から勢いよく水が落ちる。鯉は滝をのぼる。', gen: '水と竜。竜のように落ちる水。' });
D('波', 'なみ', '波', 'shizen', { kind: 'sky', col: 'ai', fx: 'wave', note: '水の上に波が立ち、浮いている物や泳ぐ物を向こうへ押し流す。', gen: '水の皮（おもて）。' });
D('湯', 'ゆ', 'お湯', 'shizen', { kind: 'fluid', col: 'shu', fx: 'hotwater', note: 'あたたかいお湯。氷や雪を溶かす。猿や人が喜ぶ。', gen: '水と昜（日が上がる・あたたか）。' });
D('油', 'あぶら', '油', 'shizen', { kind: 'thing', col: 'yamabuki', float: true, heavy: 0, burn: 8, flash: true, flat: true, food: 'abura', note: 'よく燃える油。水に浮く。火が近づくと大きく燃え上がる。狐の好物。', gen: '水と由（つぼから出る）。' });
D('煙', 'けむり', '煙', 'shizen', { kind: 'thing', col: 'hai', fly: true, heavy: 0, life: 14, smoke: true, wisp: true, note: '煙が立ちこめる。中の物は見えにくくなる。蜂は煙をいやがって逃げる。', gen: '火と垔（ふさぐ）。' });
D('灰', 'はい', '灰', 'shizen', { kind: 'thing', col: 'hai', heavy: 0, flat: true, ash: true, note: '燃えたあとの灰。枯れ木にまくと花が咲く。', gen: '手（ナ）で火をかきまぜたあと。' });
D('炭', 'すみ', '炭', 'shizen', { kind: 'thing', col: 'sumi', burn: 40, heavy: 1, push: true, solid: true, coal: true, note: '炭。火がつくと長く熱く燃える。燃え広がりにくい。', gen: '山の灰（山で焼く炭）。' });
D('霧', 'きり', '霧', 'shizen', { kind: 'sky', col: 'hai', fx: 'fog', note: '霧がたちこめる。生き物はまわりが見えなくなる。風で晴れる。', gen: '雨と務（おおいかぶさる）。' });
D('晴', 'はれ', '晴れ', 'shizen', { kind: 'sky', col: 'sora', fx: 'clear', note: '雨・雪・霧・嵐がやんで、空が晴れる。', gen: '日と青。青空にお日さま。' });
D('島', 'しま', '島', 'shizen', { kind: 'struct', col: 'cha', sz: [3, 1], solid: true, float: true, heavy: 2, island: true, note: '水に浮かぶ小さな島。乗れる。', gen: '鳥がとまる山。海に浮かぶ山。' });
D('穴', 'あな', '穴', 'shizen', { kind: 'terra', col: 'cha', fx: 'hole', note: '土を掘って穴をあける（岩は掘れない）。', gen: '宀（いえ）と八（左右に分ける）。掘った穴ぐら。' });
D('谷', 'たに', '谷', 'shizen', { kind: 'terra', col: 'cha', fx: 'valley', note: '大きく地面を掘り下げる。', gen: '山の間がひらけている形。' });
D('坂', 'さか', '坂', 'shizen', { kind: 'terra', col: 'cha', fx: 'slope', note: 'となりの高い所へ向かって土の坂（段）をつける。', gen: '土と反（そりかえる）。' });
D('出', 'で', '出る', 'shizen', { kind: 'verb', col: 'cha', fx: 'emerge', note: '埋まっている物・隠れている物が出てくる。', gen: '足が囲いから出ていく形。山が二つにも見える。' });
D('空', 'そら', '空', 'shizen', { kind: 'terra', col: 'sora', fx: 'void', note: 'そのマスを空っぽにする（岩でも）。', gen: '穴と工。つらぬいてできた、がらんどう。' });
D('春', 'はる', '春', 'shizen', { kind: 'sky', col: 'momo', fx: 'spring', note: '春が来る。雪と氷が溶け、花が咲き、冬眠の獣が目をさます。雪女は去る。', gen: '草木が日をあびて芽ぶく形。' });
D('夏', 'なつ', '夏', 'shizen', { kind: 'sky', col: 'shu', fx: 'summer', note: '夏が来る。氷が溶け、水たまりがかわき、虫や蛍が出る。', gen: '頭と足をのばして舞う人の形。' });
D('秋', 'あき', '秋', 'shizen', { kind: 'sky', col: 'aka', fx: 'autumn', note: '秋が来る。木に実がなり、葉が散る。', gen: '禾（いね）と火。稲を干し、虫を焼くころ。' });
D('冬', 'ふゆ', '冬', 'shizen', { kind: 'sky', col: 'sora', fx: 'winter', note: '冬が来る。雪が降り、水面が凍り、熊は冬眠する。', gen: '糸のはし（終わり）が冫（こおる）。一年の終わり。' });
D('夜', 'よる', '夜', 'shizen', { kind: 'sky', col: 'kon', fx: 'night', note: '夜になる。暗くなり、夜の生き物が動き出す。', gen: '人のわきの下に月。月が出ている時。' });
D('朝', 'あさ', '朝', 'shizen', { kind: 'sky', col: 'shu', fx: 'morning', note: '朝になる。明るくなり、眠っている生き物が目をさます。', gen: '草の間に日がのぼり、月が残る。' });
D('東', 'ひがし', '東', 'shizen', { kind: 'sky', col: 'shu', fx: 'morning', note: '東から日がのぼる。朝になる。', gen: '木の間から日がのぼる方角。' });
D('晶', 'しょう', '水晶', 'shizen', { solid: true, push: true, heavy: 1, col: 'sora', glow: 2.5, fragile: true, crystal: true, note: 'きらめく水晶。ほのかに光る。割れやすい。', gen: '日（星）が三つ。きらきら光る。' });
D('金', 'きん', '金', 'shizen', { solid: true, push: true, heavy: 2, col: 'kin', conduct: true, shiny: true, food: 'shiny', note: '金のかたまり。重い。雷を通す。烏や狸がほしがる。', gen: '土の中に光る粒（丶丶）。' });
D('鉄', 'てつ', '鉄', 'shizen', { solid: true, push: true, heavy: 2, col: 'hai', conduct: true, metal: true, note: '鉄のかたまり。重くて沈む。雷を通す。磁石に引かれる。', gen: '金と失（おしだす）。' });
D('玉', 'たま', '玉', 'shizen', { solid: true, push: true, heavy: 1, col: 'murasaki', roll: true, shiny: true, food: 'shiny', note: '丸い玉。押すと転がっていく。坂を転がり落ちる。竜の宝。', gen: '三つの玉を糸でつらぬいた形。' });
D('墨', 'すみ', '墨', 'shizen', { kind: 'thing', col: 'sumi', heavy: 1, flat: true, inkpool: true, note: '墨。薄れたものにたらすと、色がもどる手がかりになる。', gen: '黒と土。すすを固めた黒い土。' });
D('雫', 'しずく', 'しずく', 'shizen', { kind: 'fluid', col: 'ai', fx: 'drop', note: 'ひとしずくの水。', gen: '雨が下へ落ちる。日本で生まれた字（国字）。' });

// ===== 草木 =====
D('木', 'き', '木', 'kusaki', { kind: 'plant', col: 'moegi', sz: [1, 2], root: true, climb: true, burn: 10, ash: '灰', grow: '大木', cut: '丸太', heavy: 2, wood: true, note: '木が生える。登れる。燃える。切ると丸太になる。', gen: '立ち木の形。' });
D('林', 'はやし', '林', 'kusaki', { kind: 'plant', col: 'moegi', sz: 2, root: true, climb: true, burn: 14, ash: '灰', heavy: 3, wood: true, windbreak: true, hide: true, note: '木が並ぶ林。登れる。風をさえぎる。中に入ると見つかりにくい。', gen: '木が二本。' });
D('森', 'もり', '森', 'kusaki', { kind: 'plant', col: 'matsu', sz: 3, root: true, climb: true, burn: 20, ash: '灰', heavy: 3, wood: true, windbreak: true, hide: true, home: true, note: '深い森。登れる。生き物のすみか。よく燃える。', gen: '木が三本。' });
D('大木', 'たいぼく', '大木', 'kusaki', { kind: 'plant', col: 'matsu', sz: [2, 4], root: true, climb: true, burn: 20, ash: '灰', heavy: 3, wood: true, cut: '丸太', word: true, note: '見上げるほどの大木。高い所まで登れる。', gen: '大きな木。' });
D('竹', 'たけ', '竹', 'kusaki', { kind: 'plant', col: 'moegi', sz: [1, 1], root: true, climb: true, burn: 5, heavy: 1, bamboo: true, note: '竹。ぐんぐん伸びて、天井につくまで高くなる。登れる。', gen: '竹の枝と葉が並ぶ形。' });
D('草', 'くさ', '草', 'kusaki', { kind: 'plant', col: 'moegi', root: true, burn: 3, heavy: 0, food: 'kusa', soft: true, hide: true, note: '草むら。牛・馬・羊・鹿が食べる。すぐ燃える。', gen: '艹（くさ）と早。' });
D('花', 'はな', '花', 'kusaki', { kind: 'plant', col: 'momo', root: true, burn: 3, heavy: 0, food: 'mitsu', flower: true, note: '花が咲く。蜂や蝶が寄ってくる。見た人はうれしくなる。', gen: '艹（くさ）が化ける（姿を変える）と花。' });
D('桜', 'さくら', '桜', 'kusaki', { kind: 'plant', col: 'momo', sz: [1, 2], root: true, climb: true, burn: 10, ash: '灰', heavy: 2, wood: true, sakura: true, note: '桜の木。花びらが舞い、まわりの生き物はおだやかになる。', gen: '木と、首かざりをした女の人（嬰）。' });
D('柊', 'ひいらぎ', '柊', 'kusaki', { kind: 'plant', col: 'matsu', root: true, burn: 6, heavy: 1, wood: true, onirepel: 3, note: 'とげのある柊。鬼はこの葉をいやがって近づかない。', gen: '冬の木。' });
D('椿', 'つばき', '椿', 'kusaki', { kind: 'plant', col: 'aka', sz: [1, 2], root: true, climb: true, burn: 8, heavy: 2, wood: true, flower: true, warm: true, note: '雪の中でも咲く椿。まわりの雪を少しずつ溶かす。', gen: '春の木。' });
D('枯', 'かれ', '枯れる', 'kusaki', { kind: 'verb', col: 'cha', fx: 'wither', note: '草木を枯らす。枯れた物はよく燃え、道をふさぐつるはしおれる。', gen: '木が古くなる。' });
D('枯木', 'かれき', '枯れ木', 'kusaki', { kind: 'plant', col: 'cha', sz: [1, 2], root: true, climb: true, burn: 4, ash: '灰', heavy: 1, wood: true, dead: true, cut: '丸太', word: true, note: '枯れた木。よく燃える。灰をまくと花が咲く。', gen: '枯れた木。' });
D('丸太', 'まるた', '丸太', 'kusaki', { kind: 'struct', col: 'cha', sz: [3, 1], solid: true, float: true, heavy: 1, burn: 12, ash: '灰', push: true, wood: true, word: true, note: '丸太。水に浮く。谷にわたせば橋になる。', gen: '丸い木。' });
D('蔦', 'つた', 'つた', 'kusaki', { kind: 'struct', col: 'moegi', fx: 'ivy', climb: true, burn: 4, heavy: 0, ivy: true, note: '壁をはい上がるつた。登れる。', gen: '艹（くさ）と鳥（まとわりつく）。' });
D('稲', 'いね', '稲', 'kusaki', { kind: 'plant', col: 'yamabuki', root: true, burn: 3, heavy: 0, food: 'kome', soft: true, cut: '米', note: '実った稲。切ると米になる。雀や狐が喜ぶ。', gen: '禾（いね）と舀（臼でつく）。' });
D('茸', 'きのこ', 'きのこ', 'kusaki', { kind: 'thing', col: 'cha', heavy: 0, food: 'kinoko', note: '笑い茸。食べた生き物は笑い出して、しばらくおとなしい。', gen: '艹（くさ）と耳。耳の形の草。' });
D('葉', 'は', '葉っぱ', 'kusaki', { kind: 'thing', col: 'moegi', heavy: 0, float: true, burn: 2, lift: true, leaf: true, note: '葉っぱ。風に舞い、水に浮く。小さな物なら乗れる小舟になる。', gen: '艹（くさ）と、木の上の世（重なる葉）。' });
D('枝', 'えだ', '枝', 'kusaki', { kind: 'thing', col: 'cha', heavy: 0, burn: 4, float: true, stick: true, note: '木の枝。ぬりかべは足もとを枝でたたくと消える。', gen: '木と支（わかれる）。' });

// ===== 生き物 =====
D('人', 'ひと', '人', 'ikimono', { kind: 'beast', col: 'sumi', heavy: 1, helper: true, ai: { spd: 2.2, sense: 5, eats: ['dango', 'kome'], step: 1 }, note: '小さな人。あなたのあとをついて歩く。獣は、ときどきこちらを追う。', gen: '人が立っている横すがた。' });
D('犬', 'いぬ', '犬', 'ikimono', { kind: 'beast', col: 'cha', ai: { spd: 3.6, sense: 7, eats: ['niku', 'hone', 'dango'], likes: ['骨'], fears: [], chase: ['猫', '猿', '狐', '狸', '鬼'], dig: true, bark: true }, note: '犬。骨と肉が好き。猫・猿・狐・狸を追いかける。「ここ掘れ」と埋まった物を掘り出す。', gen: '大の字の人に耳（丶）。耳の立った犬。' });
D('猫', 'ねこ', '猫', 'ikimono', { kind: 'beast', col: 'cha', ai: { spd: 3.2, sense: 6, eats: ['sakana'], fears: ['犬'], chase: ['鼠'], climb: true, jump: 2, step: 2 }, note: '猫。魚が好き。鼠を追い、犬はきらい。高い所へ跳び上がる。', gen: '犭（けもの）と苗。' });
D('鼠', 'ねずみ', '鼠', 'ikimono', { kind: 'beast', col: 'hai', tinyBody: true, ai: { spd: 3.4, sense: 5, eats: ['kome', 'mame'], fears: ['猫'], gnaw: true }, note: '鼠。小さくて隙間を通る。縄やつたをかじって切る。猫がこわい。', gen: '歯と、しっぽのある体の形。' });
D('牛', 'うし', '牛', 'ikimono', { kind: 'beast', col: 'cha', sz: 2, ai: { spd: 1.2, sense: 4, eats: ['kusa'], ride: true, strong: 3, step: 1, drop: 2 }, block: true, heavy: 3, note: '牛。力持ちで、大岩も押せる。草が好き。仲よくなると背に乗れる。', gen: '角のある牛の頭の形。' });
D('馬', 'うま', '馬', 'ikimono', { kind: 'beast', col: 'cha', sz: 2, ai: { spd: 4.5, sense: 6, eats: ['kusa', 'ninjin'], ride: true, jump: 3, step: 1, drop: 3 }, heavy: 2, note: '馬。速い。三マスの谷も跳びこえる。草が好き。仲よくなると乗れる。', gen: 'たてがみと足の馬の形。' });
D('羊', 'ひつじ', '羊', 'ikimono', { kind: 'beast', col: 'shiro', ai: { spd: 1.4, sense: 4, eats: ['kusa'], fears: ['狼', '#fire'] }, soft: true, burn: 4, note: 'ふわふわの羊。上に落ちても痛くない。草が好き。', gen: '角のある羊の頭の形。' });
D('猿', 'さる', '猿', 'ikimono', { kind: 'beast', col: 'cha', ai: { spd: 3, sense: 6, eats: ['momo', 'kaki', 'kuri'], likes: ['湯'], fears: ['犬'], climb: true, jump: 2, step: 2, steal: true }, note: '猿。木に登り、実をとる。桃や柿が好き。光る物をほしがる。お湯が好き。', gen: '犭（けもの）と袁（長い衣）。' });
D('鹿', 'しか', '鹿', 'ikimono', { kind: 'beast', col: 'cha', ai: { spd: 3.6, sense: 7, eats: ['kusa', 'senbei'], fears: ['狼', '犬', '#noise'], jump: 2, step: 2 }, note: '鹿。身軽に跳ぶ。草が好き。物音に驚いて逃げる。', gen: '角のある鹿の形。' });
D('熊', 'くま', '熊', 'ikimono', { kind: 'beast', col: 'sumi', sz: 2, block: true, heavy: 3, ai: { spd: 2.2, sense: 6, eats: ['mitsu', 'sakana', 'niku'], fears: ['#noise', '#fire', '鈴'], hostile: true, strong: 3, hibernate: true }, note: '熊。人を追ってくる。はちみつと魚が好き。鈴の音と火をいやがる。冬は眠る。', gen: '能（力のある獣）と灬（火）。' });
D('狐', 'きつね', '狐', 'ikimono', { kind: 'beast', col: 'yamabuki', ai: { spd: 3.5, sense: 6, eats: ['abura', 'kome'], fears: ['犬'], trick: true }, note: '狐。油あげ（油）と米が好き。犬がこわい。化かすのが得意。', gen: '犭（けもの）と瓜。' });
D('狸', 'たぬき', '狸', 'ikimono', { kind: 'beast', col: 'cha', ai: { spd: 2.4, sense: 5, eats: ['sake', 'kaki', 'shiny'], fears: ['犬'], trick: true }, note: '狸。お酒と光る物が好き。腹つづみをうつ。化けるのが得意。', gen: '犭（けもの）と里。里にいる獣。' });
D('兎', 'うさぎ', '兎', 'ikimono', { kind: 'beast', col: 'shiro', ai: { spd: 4, sense: 7, eats: ['kusa', 'ninjin'], fears: ['狼', '狐', '#noise'], jump: 3, step: 3 }, note: '兎。三マス跳び上がる。草が好き。月を見ると餅をつく。', gen: '長い耳としっぽの兎の形。' });
D('鳥', 'とり', '鳥', 'ikimono', { kind: 'beast', col: 'sumi', fly: true, heavy: 0, ai: { spd: 3.5, sense: 7, eats: ['kome', 'mame', 'mushi'], fears: ['猫', '#noise'], carry: 1, perch: true }, note: '鳥。空を飛ぶ。米・豆・虫を食べる。小さな物を運ぶ。', gen: '目と羽と足の鳥の形。' });
D('烏', 'からす', '烏', 'ikimono', { kind: 'beast', col: 'sumi', fly: true, heavy: 0, ai: { spd: 3.5, sense: 8, eats: ['shiny', 'kome', 'niku'], fears: ['#fire'], steal: true, perch: true }, note: '烏。光る物を持っていってしまう。かしこい。', gen: '鳥から目の一画をとった字。黒くて目が見えない鳥。' });
D('鶴', 'つる', '鶴', 'ikimono', { kind: 'beast', col: 'shiro', fly: true, heavy: 1, sz: 2, ai: { spd: 3, sense: 6, eats: ['sakana'], ride: true, fly: true, rideFly: true }, note: '鶴。仲よくなると背に乗せて空を飛んでくれる。魚が好き。恩を返す。', gen: '寉（高く飛ぶ白い鳥）と鳥。' });
D('魚', 'さかな', '魚', 'ikimono', { kind: 'beast', col: 'ai', swim: true, heavy: 0, food: 'sakana', ai: { spd: 2.6, sense: 4, eats: ['mushi'], swimOnly: true }, note: '魚。水の中を泳ぐ。猫・熊・鶴の好物。', gen: '頭とうろことひれの魚の形。' });
D('鯉', 'こい', '鯉', 'ikimono', { kind: 'beast', col: 'shu', swim: true, heavy: 0, food: 'sakana', ai: { spd: 2.2, sense: 4, eats: ['mushi', 'kome'], swimOnly: true, climbFalls: true }, note: '鯉。滝をのぼりきると竜になると言われる。', gen: '魚と里。' });
D('鰯', 'いわし', '鰯', 'ikimono', { kind: 'thing', col: 'sora', heavy: 0, food: 'sakana', onirepel: 2, note: '鰯。においで鬼が近寄らない（柊といっしょだと強い）。猫の好物。', gen: '魚と弱。すぐ弱る魚。' });
D('亀', 'かめ', '亀', 'ikimono', { kind: 'beast', col: 'moegi', sz: [2, 1], swim: true, float: true, heavy: 2, ai: { spd: 0.9, sense: 4, eats: ['mushi', 'kusa'], ride: true, swimRide: true, waterOnly: true }, note: '亀。のんびり。背中に乗れて、水の上を運んでくれる。', gen: '甲らと頭と足の亀の形。' });
D('蛙', 'かえる', '蛙', 'ikimono', { kind: 'beast', col: 'moegi', swim: true, ai: { spd: 2.4, sense: 5, eats: ['mushi'], fears: ['蛇'], jump: 2, step: 2, croak: true }, note: '蛙。ぴょんと跳ぶ。虫を食べる。蛙が鳴くと雨が降る。', gen: '虫と圭（ケロケロ）。' });
D('虫', 'むし', '虫', 'ikimono', { kind: 'beast', col: 'moegi', fly: true, heavy: 0, tinyBody: true, food: 'mushi', ai: { spd: 2.5, sense: 4, likes: ['花'], perch: true }, note: '虫。花のまわりを飛ぶ。鳥や蛙のごはん。', gen: 'へびの形。小さな生き物みな。' });
D('蜂', 'はち', '蜂', 'ikimono', { kind: 'beast', col: 'yamabuki', fly: true, heavy: 0, tinyBody: true, sting: true, ai: { spd: 3, sense: 5, likes: ['花'], fears: ['煙'], perch: true, makes: '蜜' }, note: '蜂。花から蜜を作る。さされると獣はとび上がって逃げる。煙がきらい。', gen: '虫と夆（とがった先）。' });
D('蛍', 'ほたる', '蛍', 'ikimono', { kind: 'beast', col: 'kogane', fly: true, heavy: 0, tinyBody: true, glow: 2.5, ai: { spd: 1.6, sense: 4, likes: ['水'], perch: true, night: true }, note: '蛍。光りながら飛ぶ。暗い所を照らしてくれる。', gen: '虫の上に火（光）。' });
D('蝶', 'ちょう', '蝶', 'ikimono', { kind: 'beast', col: 'momo', fly: true, heavy: 0, tinyBody: true, ai: { spd: 1.8, sense: 6, likes: ['花'], perch: true }, note: '蝶。花から花へ舞う。花のある方へ道案内してくれる。', gen: '虫と枼（うすい葉）。' });
D('蛇', 'へび', '蛇', 'ikimono', { kind: 'beast', col: 'moegi', ai: { spd: 2, sense: 5, eats: ['kaeru', 'nezumi'], fears: ['鳥', '#fire'], hostile: false, scary: true, charm: '笛', crawl: true }, note: '蛇。せまい所をはう。生き物はこわがる。笛の音に聞きほれる。', gen: '虫と它（へび）。' });
D('竜', 'りゅう', '竜', 'ikimono', { kind: 'beast', col: 'ai', fly: true, sz: 3, heavy: 2, ai: { spd: 3, sense: 8, likes: ['玉'], ride: true, rideFly: true, fly: true, rain: true }, note: '竜。空を泳ぐ。玉が好き。仲よくなると背に乗せて空を飛ぶ。雨を呼ぶ。', gen: '頭に冠をのせ、体をくねらせる竜の形。' });
D('鬼', 'おに', '鬼', 'ikimono', { kind: 'beast', col: 'aka', sz: 2, block: true, heavy: 3, ai: { spd: 1.6, sense: 4, eats: ['sake'], likes: ['酒'], fears: ['豆', '桃', '柊', '鰯', '#bell'], guard: true, strong: 3, yokai: true }, note: '鬼。道をふさいで通さない。豆と桃と柊がこわい。お酒を飲むと眠ってしまう。', gen: '大きな頭の人の形。人ならぬもの。' });
D('河童', 'かっぱ', '河童', 'ikimono', { kind: 'beast', col: 'moegi', word: true, swim: true, block: true, ai: { spd: 2.4, sense: 5, eats: ['uri'], likes: ['瓜'], guard: true, yokai: true, bowWeak: true, ride: true, swimRide: true }, note: '河童。川を守る。胡瓜（瓜）が大好き。お辞儀（礼）をされると、お辞儀を返して頭の皿の水がこぼれ、力が抜ける。', gen: '河の童（子ども）。' });
D('天狗', 'てんぐ', '天狗', 'ikimono', { kind: 'beast', col: 'aka', word: true, sz: 2, block: true, heavy: 2, ai: { spd: 2, sense: 6, likes: ['礼'], guard: true, yokai: true, fan: true }, note: '天狗。山を守る。うちわで大風を起こす。礼を尽くす者には道をゆずる。', gen: '天の狗（いぬ）。流れ星の音が犬の声に聞こえたことから。' });
D('雪女', 'ゆきおんな', '雪女', 'ikimono', { kind: 'beast', col: 'sora', word: true, sz: 2, block: true, cold: 3, ai: { spd: 1.5, sense: 5, fears: ['#fire', '春', '日', '湯'], guard: true, yokai: true, snowy: true }, note: '雪女。吹雪で道をとざす。火や春のあたたかさで去っていく。', gen: '雪の夜にあらわれる女。' });
D('子', 'こ', '子ども', 'ikimono', { kind: 'beast', col: 'sumi', npc: true, ai: { spd: 2, sense: 4, eats: ['dango', 'kaki', 'momo'] }, note: '子ども。', gen: '頭が大きく、手を広げた幼子の形。' });

// ===== 物 =====
D('箱', 'はこ', '箱', 'mono', { solid: true, push: true, heavy: 1, float: true, burn: 8, ash: '灰', col: 'cha', wood: true, note: '木の箱。押せる。乗れる。水に浮く。燃える。', gen: '竹と相（向かいあう板）。' });
D('板', 'いた', '板', 'mono', { kind: 'struct', solid: true, sz: [3, 1], heavy: 0, float: true, burn: 8, ash: '灰', col: 'cha', wood: true, push: true, note: '長い板。水に浮く。せまい谷にわたすと橋になる。', gen: '木と反（そりかえる）。' });
D('橋', 'はし', '橋', 'mono', { kind: 'struct', fx: 'bridge', solid: true, heavy: 2, burn: 16, ash: '灰', col: 'cha', wood: true, bridge: true, note: '谷や川に、向こう岸まで橋をかける（八マスまで）。木なので燃える。', gen: '木と喬（高い）。高くかけわたした木。' });
D('梯', 'はしご', 'はしご', 'mono', { kind: 'struct', fx: 'ladder', climb: true, heavy: 1, burn: 8, ash: '灰', col: 'cha', wood: true, ladder: true, note: 'はしご。となりの高い所まで届く長さで立つ。登れる。', gen: '木と弟（順番・段）。' });
D('縄', 'なわ', '縄', 'mono', { kind: 'struct', fx: 'rope', climb: true, heavy: 0, burn: 5, col: 'tsuchi', rope: true, note: '縄。上の出っぱりから下までたれる。登り下りできる。燃える。鼠がかじる。', gen: '糸と黽（よじれる）。' });
D('舟', 'ふね', '小舟', 'mono', { kind: 'struct', solid: true, sz: [2, 1], heavy: 1, float: true, burn: 10, ash: '灰', col: 'cha', wood: true, boat: true, push: true, note: '小舟。水に浮かべて乗れる。行きたい方へ進む。', gen: '小舟の形。' });
D('船', 'ふね', '船', 'mono', { kind: 'struct', solid: true, sz: [4, 1], heavy: 2, float: true, burn: 16, ash: '灰', col: 'cha', wood: true, boat: true, note: '大きな船。生き物もいっしょに乗れる。', gen: '舟と㕣（ふちの水）。' });
D('車', 'くるま', '車', 'mono', { solid: true, sz: [2, 1], push: true, heavy: 1, burn: 10, ash: '灰', col: 'cha', wood: true, cart: true, roll: true, note: '荷車。押すとしばらく転がる。坂では勝手に走り出す。乗れる。', gen: '車輪と車軸を上から見た形。' });
D('門', 'もん', '門', 'mono', { kind: 'struct', solid: true, sz: [2, 3], heavy: 3, col: 'aka', gate: true, note: '門。閉まっていると通れない。「開」で開く。', gen: '左右の扉の形。' });
D('戸', 'と', '戸', 'mono', { kind: 'struct', solid: true, sz: [1, 2], heavy: 3, col: 'cha', door: true, burn: 10, note: '戸。閉まっている。「開」で開く。', gen: '片びらきの戸の形。' });
D('壁', 'かべ', '壁', 'mono', { kind: 'struct', solid: true, sz: [1, 3], heavy: 3, col: 'hai', wall: true, note: '壁。通れない。水も風もさえぎる。', gen: '辟（平らにならす）と土。' });
D('柱', 'はしら', '柱', 'mono', { kind: 'struct', solid: true, sz: [1, 4], heavy: 3, col: 'aka', wood: true, burn: 16, note: '太い柱。上の物を支える。', gen: '木と主（じっと立つ）。' });
D('家', 'いえ', '家', 'mono', { kind: 'struct', sz: 3, heavy: 3, col: 'cha', house: true, burn: 20, ash: '灰', wood: true, note: '家。中は雨も風も入らない。', gen: '宀（屋根）の下に豕（ぶた）。家畜のいる住まい。' });
D('灯', 'あかり', '灯り', 'mono', { solid: false, heavy: 1, col: 'shu', glow: 4.5, lamp: true, note: '灯り（ちょうちん）。燃え移らない光で、まわりを明るくする。', gen: '火と丁（くぎのように立つ）。' });
D('鈴', 'すず', '鈴', 'mono', { fx: 'bellput', heavy: 0, col: 'kin', bell: true, noise: 5, conduct: true, note: '鈴。風でちりんと鳴る。熊はこの音をいやがる。自分に書くと、歩くたびに鳴って、熊が寄ってこない。', gen: '金と令（すんだ音で知らせる）。' });
D('鐘', 'かね', '大きな鐘', 'mono', { kind: 'sky', col: 'kin', fx: 'bigbell', note: 'ごーんと鐘が鳴る。眠っている生き物は起き、鬼や闇の物は逃げ出す。', gen: '金と童（つきならす）。' });
D('笛', 'ふえ', '笛', 'mono', { kind: 'sky', col: 'cha', fx: 'flute', note: '笛の音がひびく。生き物は聞きほれておとなしくなり、蛇は踊り出す。鳥が集まる。', gen: '竹と由（穴から音が出る）。' });
D('鏡', 'かがみ', '鏡', 'mono', { solid: true, heavy: 1, col: 'kin', mirror: true, fragile: true, push: true, shiny: true, food: 'shiny', note: '鏡。化けているものの本当の姿をうつす。鬼や妖怪は自分の顔を見て逃げる。', gen: '金と竟（ここまで、のさかい）。' });
D('鍵', 'かぎ', '鍵', 'mono', { kind: 'verb', col: 'kin', fx: 'unlock', note: '鍵。閉まっている門・戸・箱を開ける。', gen: '金と建（さしこむ）。' });
D('傘', 'かさ', '傘', 'mono', { kind: 'self', col: 'ai', fx: 'umbrella', note: '自分にさす。高い所からふわりと降りられる。雨にもぬれない。', gen: '広げた傘の骨の形。' });
D('凧', 'たこ', '凧', 'mono', { kind: 'thing', col: 'shu', fly: true, heavy: 0, lift: true, kite: true, burn: 3, note: '凧。風を受けて高く上がる。自分に書くと、風で空へ運ばれる。', gen: '風と巾（布）。日本で生まれた字。' });
D('網', 'あみ', '網', 'mono', { kind: 'struct', col: 'hai', sz: [2, 2], net: true, heavy: 0, burn: 5, note: '網。鳥・魚・虫をつかまえる。', gen: '糸と罔（あみ）。' });
D('壺', 'つぼ', '壺', 'mono', { solid: true, push: true, heavy: 1, fragile: true, col: 'cha', pot: true, note: '壺。割れやすい。何かが入っていることがある。', gen: '口がすぼまった、ふたつきのつぼの形。' });
D('豆', 'まめ', '豆', 'mono', { kind: 'thing', col: 'cha', heavy: 0, food: 'mame', scatter: true, note: '豆。まくと鬼は「鬼は外！」と逃げ出す。鳩や鼠の好物。', gen: '高つき（たかつき）の形。' });
D('米', 'こめ', '米', 'mono', { kind: 'thing', col: 'shiro', heavy: 0, food: 'kome', note: '米。鳥・鼠・狐の好物。', gen: '稲の実が四方に散る形。' });
D('桃', 'もも', '桃', 'mono', { kind: 'thing', col: 'momo', heavy: 0, food: 'momo', float: true, note: '桃。猿の好物。鬼は桃をこわがる（桃は魔よけ）。川に浮いて流れる。', gen: '木と兆（二つに割れる）。' });
D('柿', 'かき', '柿', 'mono', { kind: 'thing', col: 'aka', heavy: 0, food: 'kaki', note: '柿。猿の大好物。', gen: '木と市（にぎわう）。' });
D('栗', 'くり', '栗', 'mono', { kind: 'thing', col: 'cha', heavy: 0, food: 'kuri', pop: true, note: '栗。火にくべるとはじけて飛ぶ。当たると獣は驚く。', gen: 'いがのある実（覀）が木になる。' });
D('瓜', 'うり', '胡瓜', 'mono', { kind: 'thing', col: 'moegi', heavy: 0, food: 'uri', float: true, note: '瓜（きゅうり）。河童の大好物。', gen: 'つるにぶらさがる瓜の形。' });
D('肉', 'にく', '肉', 'mono', { kind: 'thing', col: 'aka', heavy: 0, food: 'niku', note: '肉。犬・熊・狼の好物。', gen: '切った肉のすじの形。' });
D('骨', 'ほね', '骨', 'mono', { kind: 'thing', col: 'shiro', heavy: 0, food: 'hone', note: '骨。犬の大好物。', gen: '関節の形と肉（月）。' });
D('蜜', 'みつ', 'はちみつ', 'mono', { kind: 'thing', col: 'yamabuki', heavy: 0, food: 'mitsu', note: 'はちみつ。熊の大好物。', gen: '宓（とじこめる）と虫。' });
D('酒', 'さけ', 'お酒', 'mono', { kind: 'thing', col: 'ai', heavy: 1, food: 'sake', solid: false, note: 'お酒のとっくり。鬼や狸はのむと、酔って眠ってしまう。', gen: '水と酉（さけつぼ）。' });
D('団子', 'だんご', '団子', 'mono', { kind: 'thing', col: 'momo', heavy: 0, food: 'dango', word: true, note: '団子。あげると犬・猿・鳥がお供になる。', gen: '丸めた子（小さなもの）。' });
D('人形', 'にんぎょう', '人形', 'mono', { kind: 'thing', col: 'aka', heavy: 1, decoy: true, word: true, push: true, burn: 6, note: '人形。人を追う獣は、まちがえて人形の方へ行く。', gen: '人のかたち。' });
D('花火', 'はなび', '花火', 'mono', { kind: 'sky', col: 'shu', fx: 'fireworks', word: true, note: '夜空に花火。みんな見上げて足を止め、闇の物は逃げる。', gen: '花のように開く火。' });
D('火山', 'かざん', '火山', 'shizen', { kind: 'terra', col: 'shu', fx: 'volcano', word: true, note: '火を吹く山ができる。まわりの雪と氷はみな溶ける。', gen: '火の出る山。' });
D('雪玉', 'ゆきだま', '雪玉', 'shizen', { solid: true, push: true, heavy: 1, col: 'sora', melt: '水', roll: true, snowball: true, word: true, note: '雪玉。転がるほど大きくなる。坂の上から転がすと、ぶつかった物を倒す。', gen: '雪の玉。' });
D('竹馬', 'たけうま', '竹馬', 'mono', { kind: 'self', col: 'moegi', fx: 'stilts', word: true, note: '自分に書く。背が高くなって、浅い川も歩いて渡れる。', gen: '竹の馬。' });
D('太鼓', 'たいこ', '太鼓', 'mono', { kind: 'sky', col: 'aka', fx: 'drum', word: true, note: 'どんどん太鼓。里の人は集まって踊り出し、獣は驚いて逃げる。', gen: '太い鼓。' });
D('鬼火', 'おにび', '鬼火', 'shizen', { kind: 'thing', col: 'ai', fly: true, glow: 4, heavy: 0, wisp: true, word: true, coldfire: true, note: '青い火の玉。燃え移らない光。', gen: '鬼の火。' });
D('風鈴', 'ふうりん', '風鈴', 'mono', { heavy: 0, col: 'sora', bell: true, noise: 3, word: true, note: '風鈴。風が吹くとちりんと鳴る。', gen: '風の鈴。' });
D('磁石', 'じしゃく', '磁石', 'mono', { solid: true, push: true, heavy: 1, col: 'hai', magnet: 5, word: true, note: '磁石。まわりの鉄や金物を引きよせる。', gen: '磁（引きつける）石。' });
D('地震', 'じしん', '地震', 'shizen', { kind: 'sky', col: 'cha', fx: 'quake', word: true, note: '大地がゆれる。不安定な物は落ち、ひびの入った岩はくずれる。', gen: '地がふるえる。' });
D('満月', 'まんげつ', '満月', 'shizen', { kind: 'sky', col: 'kogane', fx: 'fullmoon', word: true, note: '満月の夜。明るい夜になり、兎は高く跳ね、狸は腹つづみ。', gen: '満ちた月。' });
D('花見', 'はなみ', '花見', 'kokoro', { kind: 'sky', col: 'momo', fx: 'hanami', word: true, note: 'みんなで花見。まわりの生き物はみんな座って、おだやかになる。', gen: '花を見る。' });
D('案山子', 'かかし', '案山子', 'mono', { kind: 'thing', col: 'cha', sz: [1, 2], heavy: 1, scare: '鳥', scareR: 5, word: true, burn: 5, note: 'かかし。鳥や烏は近寄らない。', gen: '山の田に立てる人の形。' });

// ===== 動き =====
D('上', 'うえ', '上へ', 'ugoki', { kind: 'verb', col: 'sumi', fx: 'up', note: '書いた物を二マス持ち上げる。自分に書くと、ぴょんと高く跳ぶ。', gen: '線の上にしるし。' });
D('下', 'した', '下へ', 'ugoki', { kind: 'verb', col: 'sumi', fx: 'down', note: '書いた物を下へ落とす。浮いている物は沈む。', gen: '線の下にしるし。' });
D('止', 'とまる', '止まる', 'ugoki', { kind: 'verb', col: 'sumi', fx: 'stop', note: '書いた物の時を止める。落ちかけた岩も宙で止まり、乗れる。生き物も止まる。', gen: '足あとの形。立ち止まる足。' });
D('切', 'きる', '切る', 'ugoki', { kind: 'verb', col: 'hai', fx: 'cut', note: '縄・つた・竹・稲を切る。木を切ると丸太になって倒れる。', gen: '七（切れ目）と刀。' });
D('破', 'やぶる', '破る', 'ugoki', { kind: 'verb', col: 'sumi', fx: 'break', note: '岩・氷・壁・戸・壺を打ちこわす。', gen: '石の皮をはぐ。' });
D('開', 'ひらく', '開く', 'ugoki', { kind: 'verb', col: 'aka', fx: 'open', note: '門・戸・箱を開ける。つぼみを開く。', gen: '門の閂（かんぬき）を両手ではずす。' });
D('閉', 'とじる', '閉じる', 'ugoki', { kind: 'verb', col: 'aka', fx: 'close', note: '門・戸を閉める。', gen: '門に才（せき止める木）。' });
D('押', 'おす', '押す', 'ugoki', { kind: 'verb', col: 'sumi', fx: 'push', note: '書いた物を、人から遠ざける向きに三マス押しやる。重い物も動く。', gen: '扌（て）と甲（おさえる）。' });
D('引', 'ひく', '引く', 'ugoki', { kind: 'verb', col: 'sumi', fx: 'pull', note: '書いた物を人の方へ三マス引きよせる。', gen: '弓のつるを引く。' });
D('浮', 'うく', '浮く', 'ugoki', { kind: 'verb', col: 'sora', fx: 'float', note: '書いた物が三マス浮き上がって、しばらく宙にとどまる。乗れる。', gen: '水と孚（子をかかえる）。' });
D('沈', 'しずむ', '沈む', 'ugoki', { kind: 'verb', col: 'ai', fx: 'sink', note: '浮いている物を沈める。', gen: '水と冘（おもしで沈む）。' });
D('飛', 'とぶ', '飛ぶ', 'ugoki', { kind: 'verb', col: 'sora', fx: 'fly', note: '書いた物が空へ飛び上がる。自分に書くと、しばらく空を飛べる。', gen: '鳥がはばたく形。' });
D('動', 'うごく', '動く', 'ugoki', { kind: 'verb', col: 'sumi', fx: 'animate', note: '動かない物に足がはえて、とことこ歩き出す。', gen: '重と力。重い物を力で動かす。' });
D('眠', 'ねむる', '眠る', 'ugoki', { kind: 'verb', col: 'kon', fx: 'sleep', note: '生き物を眠らせる。眠っている見張りは通れる。', gen: '目と民（目を閉じた人）。' });
D('起', 'おきる', '起きる', 'ugoki', { kind: 'verb', col: 'shu', fx: 'wake', note: '眠っている生き物を起こす。倒れた物を起こす。', gen: '走と己（身を起こす）。' });
D('育', 'そだつ', '育つ', 'ugoki', { kind: 'verb', col: 'moegi', fx: 'grow', note: '草木が大きく育つ。木は大木に、竹はもっと高く。', gen: '子がさかさに生まれ、肉（月）がつく。' });
D('咲', 'さく', '咲く', 'ugoki', { kind: 'verb', col: 'momo', fx: 'bloom', note: '花を咲かせる。木に書くと桜、枯れ木にも花が咲く。', gen: '口がほころぶ（笑う）ように花ひらく。' });
D('燃', 'もえる', '燃える', 'ugoki', { kind: 'verb', col: 'shu', fx: 'ignite', note: '書いた物に火をつける。', gen: '火と然（燃やす）。' });
D('消', 'けす', '消す', 'ugoki', { kind: 'verb', col: 'ai', fx: 'douse', note: '火を消す。光を消す。', gen: '水と肖（小さくなる）。' });
D('凍', 'こおる', '凍る', 'ugoki', { kind: 'verb', col: 'sora', fx: 'freeze', note: '水を凍らせる。生き物はしばらくこおりつく。', gen: '冫（こおり）と東。' });
D('溶', 'とける', '溶ける', 'ugoki', { kind: 'verb', col: 'shu', fx: 'melt', note: '氷や雪を溶かす。', gen: '水と容（いれる）。' });
D('掘', 'ほる', '掘る', 'ugoki', { kind: 'verb', col: 'cha', fx: 'dig', note: '下へまっすぐ三マス掘る。', gen: '扌（て）と屈（かがむ）。' });
D('埋', 'うめる', '埋める', 'ugoki', { kind: 'verb', col: 'cha', fx: 'fill', note: 'まわりのくぼみを土で埋める。', gen: '土と里。' });
D('直', 'なおす', '直す', 'ugoki', { kind: 'verb', col: 'moegi', fx: 'fix', note: 'こわれた物・薄れた物を直す。', gen: '十の目でまっすぐ見る。' });
D('隠', 'かくれる', '隠れる', 'ugoki', { kind: 'verb', col: 'kon', fx: 'hide', note: '書いた物が見えなくなる。自分に書くと、生き物に見つからない。', gen: '阝（おか）のかげにかくす。' });
D('化', 'ばける', '化ける', 'ugoki', { kind: 'verb', col: 'murasaki', fx: 'disguise', note: '自分に書くと、石に化ける。獣も鬼も気がつかない。物に書くと葉っぱになる。', gen: '人と、さかさの人。姿が変わる。' });
D('呼', 'よぶ', '呼ぶ', 'ugoki', { kind: 'verb', col: 'shu', fx: 'call', note: '書いた所へ、まわりの生き物を呼びよせる。', gen: '口と乎（声をはりあげる）。' });
D('集', 'あつまる', '集まる', 'ugoki', { kind: 'verb', col: 'cha', fx: 'gather', note: '書いた所へ、遠くの生き物まで集まってくる。', gen: '隹（とり）が木にむらがる。' });
D('鳴', 'なく', '鳴く', 'ugoki', { kind: 'verb', col: 'kin', fx: 'cry', note: '書いた所で大きな音がする。生き物はそちらを見に来る。眠った物は起きる。', gen: '鳥が口をあけて鳴く。' });
D('吹', 'ふく', '吹く', 'ugoki', { kind: 'verb', col: 'sora', fx: 'blow', note: '人がふうっと息を吹く。目の前の小さな火を消し、軽い物を飛ばす。', gen: '口と欠（口をあける）。' });
D('食', 'たべる', '食べる', 'ugoki', { kind: 'verb', col: 'cha', fx: 'eat', note: '生き物に書くと、まわりの食べ物を食べに行く。', gen: '器にもったごはんとふた。' });
D('休', 'やすむ', '休む', 'ugoki', { kind: 'self', col: 'moegi', fx: 'rest', note: '自分に書く。その場で一休み。次からここからやり直せる。', gen: '人が木によりかかって休む。' });
D('泳', 'およぐ', '泳ぐ', 'ugoki', { kind: 'self', col: 'ai', fx: 'swim', note: '自分に書く。しばらく深い水も泳げる（墨がにじまない）。', gen: '水と永（長く続く）。' });
D('走', 'はしる', '走る', 'ugoki', { kind: 'self', col: 'sumi', fx: 'run', note: '自分に書く。しばらく速く走れる。', gen: '人が腕をふって走る形と止（足）。' });
D('登', 'のぼる', '登る', 'ugoki', { kind: 'self', col: 'cha', fx: 'climbbuff', note: '自分に書く。しばらく壁をよじ登れる。', gen: '癶（両足）を豆（高つき）にかける。' });
D('祭', 'まつり', 'お祭り', 'ugoki', { kind: 'sky', col: 'aka', fx: 'festival', note: 'お祭りだ！ 生き物も人もみな集まって踊り出す。見張りも持ち場を離れる。', gen: '肉（月）を手（又）で示（祭壇）にそなえる。' });
D('歌', 'うた', '歌', 'ugoki', { kind: 'sky', col: 'momo', fx: 'song', note: '歌が流れる。生き物はおだやかになり、鳥が歌い返す。', gen: '哥（うたう）と欠（口をあける）。' });

// ===== 様子 =====
D('大', 'おおきい', '大きく', 'yousu', { kind: 'adj', col: 'shu', fx: 'big', note: '書いた物を大きくする。大きな石は岩に、大きな獣は強く。自分に書くと力持ちになる。', gen: '人が手足を大きく広げた形。' });
D('小', 'ちいさい', '小さく', 'yousu', { kind: 'adj', col: 'ai', fx: 'small', note: '書いた物を小さくする。小さな鬼はこわくない。自分に書くと、隙間を通れる。', gen: '小さな点を三つ。' });
D('少', 'すこし', '少なく', 'yousu', { kind: 'adj', col: 'ai', fx: 'less', note: '書いた物を少なくする。森は林に、林は木に、炎は火に。', gen: '小さいものを、さらに削る。' });
D('重', 'おもい', '重く', 'yousu', { kind: 'adj', col: 'sumi', fx: 'heavy', note: '書いた物を重くする。水に沈み、風に飛ばされず、落ちると下の物をつぶす。', gen: '人が重い袋（東）を背負う形。' });
D('軽', 'かるい', '軽く', 'yousu', { kind: 'adj', col: 'sora', fx: 'light', note: '書いた物を軽くする。水に浮き、風に飛ぶ。自分に書くと、ふわりと落ちる。', gen: '車と巠（まっすぐ）。' });
D('熱', 'あつい', '熱く', 'yousu', { kind: 'adj', col: 'shu', fx: 'hot', note: '書いた物を熱くする。まわりの氷や雪を溶かし、燃える物に火がつく。', gen: '埶（火をかかげる）と灬（火）。' });
D('冷', 'つめたい', '冷たく', 'yousu', { kind: 'adj', col: 'sora', fx: 'cold', note: '書いた物を冷たくする。まわりの水面が凍り、火が消える。', gen: '冫（こおり）と令。' });
D('長', 'ながい', '長く', 'yousu', { kind: 'adj', col: 'cha', fx: 'long', note: '書いた物を長くする。縄やはしごは長く、木は高く、板や橋は長く。', gen: '長い髪の老人の形。' });
D('速', 'はやい', '速く', 'yousu', { kind: 'adj', col: 'shu', fx: 'fast', note: '書いた物を速くする。', gen: '辶（すすむ）と束。' });
D('遅', 'おそい', '遅く', 'yousu', { kind: 'adj', col: 'ai', fx: 'slow', note: '書いた物を遅くする。落ちるのもゆっくり。', gen: '辶（すすむ）と犀（のろい）。' });
D('強', 'つよい', '強く', 'yousu', { kind: 'adj', col: 'shu', fx: 'strong', note: '生き物を強くする。', gen: '弓と虽（かたい虫）。' });
D('弱', 'よわい', '弱く', 'yousu', { kind: 'adj', col: 'ai', fx: 'weak', note: '生き物を弱くする。弱った鬼は押しのけられる。', gen: '弓が二つ。たわんだ弱い弓。' });
D('明', 'あかるい', '明るく', 'yousu', { kind: 'adj', col: 'kogane', fx: 'bright', note: '書いた物が光る。まわりが明るくなる。', gen: '日と月。' });
D('暗', 'くらい', '暗く', 'yousu', { kind: 'adj', col: 'kon', fx: 'dim', note: '書いた物のまわりを暗くする。', gen: '日と音（とざす）。日がかげる。' });
D('静', 'しずか', '静かに', 'yousu', { kind: 'adj', col: 'ai', fx: 'quiet', note: '書いた物が静かになる。生き物は気づかなくなり、音は止む。', gen: '青（すむ）と争。争いがすむ。' });
D('赤', 'あか', '赤く', 'yousu', { kind: 'adj', col: 'aka', fx: 'red', note: '書いた物を赤くそめる。赤い物はほんのりあたたかい。鬼に書くと赤鬼。', gen: '大と火。大きく燃える火の色。' });
D('青', 'あお', '青く', 'yousu', { kind: 'adj', col: 'ai', fx: 'blue', note: '書いた物を青くそめる。青い物はひんやり。鬼に書くと青鬼。', gen: '生と井（井戸のすんだ水の色）。' });
D('白', 'しろ', '白く', 'yousu', { kind: 'adj', col: 'shiro', fx: 'white', note: '書いた物を白くする。雪の中では見えなくなる。', gen: 'どんぐりの実（白い中身）、または日の光。' });
D('黒', 'くろ', '黒く', 'yousu', { kind: 'adj', col: 'sumi', fx: 'black', note: '書いた物を黒くする。暗がりでは見えなくなる。', gen: '火（灬）でいぶされた窓（里）。すすの色。' });
D('古', 'ふるい', '古く', 'yousu', { kind: 'adj', col: 'cha', fx: 'old', note: '書いた物を古くする。木は朽ち、子は大人になり、卵はかえる。', gen: '十代も口伝えされた昔のこと。' });
D('新', 'あたらしい', '新しく', 'yousu', { kind: 'adj', col: 'moegi', fx: 'new', note: '書いた物を新しくする。こわれた物も直る。', gen: '立てた木を斤（おの）で切った、新しい切り口。' });

// ===== 心 =====
D('友', 'とも', '友だち', 'kokoro', { kind: 'feel', col: 'shu', fx: 'friend', note: '生き物と友だちになる。ついてきて、乗せてくれたり、道をゆずってくれたりする。人をこわがっている生き物や、怒っている生き物には効かない。', gen: '手（ナ）と手（又）をとりあう。' });
D('好', 'すき', '好き', 'kokoro', { kind: 'feel', col: 'momo', fx: 'like', note: '生き物があなたを好きになり、ついてくる。', gen: '女の人が子をだいている。' });
D('笑', 'わらう', '笑う', 'kokoro', { kind: 'feel', col: 'yamabuki', fx: 'laugh', note: '生き物が笑い出す。笑っている間は、見張りも道をあける。怒っていても笑えばおさまる。', gen: '竹がしなるように身をよじって笑う。' });
D('泣', 'なく', '泣く', 'kokoro', { kind: 'feel', col: 'ai', fx: 'weep', note: '生き物が泣き出す。なみだが水たまりになる。', gen: '水（なみだ）と立。立ったまま泣く。' });
D('怒', 'おこる', '怒る', 'kokoro', { kind: 'feel', col: 'aka', fx: 'anger', note: '生き物が怒って、前にあるものに体当たりする。牛が怒ると壁もこわす。', gen: '奴と心。' });
D('恐', 'こわい', 'こわい', 'kokoro', { kind: 'feel', col: 'kon', fx: 'scare', note: '生き物がこわがって、書いた場所から逃げていく。', gen: '巩（かかえる）と心。' });
D('愛', 'あい', '愛', 'kokoro', { kind: 'feel', col: 'momo', fx: 'love', note: 'まわりの生き物みんなが、あなたと仲よしになる。', gen: '心を、ふりかえって受けわたす。' });
D('礼', 'れい', 'お辞儀', 'kokoro', { kind: 'feel', col: 'sumi', fx: 'bow', note: 'ていねいにお辞儀をする。礼を知るものは道をゆずる。河童はお辞儀を返して、頭の皿の水をこぼす。', gen: '示（神）と乚（ひざまずく人）。' });
D('夢', 'ゆめ', '夢', 'kokoro', { kind: 'feel', col: 'murasaki', fx: 'dream', note: '眠っている生き物に書くと、夢を見て、寝言でひみつを教えてくれる。', gen: '夜（夕）、目をおおう草（艹）。' });
D('心', 'こころ', '心', 'kokoro', { kind: 'feel', col: 'shu', fx: 'heart', note: '薄れたものに書くと、名前は思い出せなくても、色がよみがえる。', gen: '心臓の形。' });
D('安', 'やすらか', 'やすらか', 'kokoro', { kind: 'feel', col: 'moegi', fx: 'soothe', note: 'まわりの生き物の気持ちが落ちつく。逃げ回る物も止まる。', gen: '宀（家）の中に女の人。' });
D('忘', 'わすれる', '忘れる', 'kokoro', { kind: 'feel', col: 'hai', fx: 'forget', note: '生き物が、自分の役目を忘れてどこかへ行く。', gen: '亡（なくなる）と心。' });
D('思', 'おもう', '思う', 'kokoro', { kind: 'feel', col: 'murasaki', fx: 'think', note: '書いた物の思い出が、絵師の声になって聞こえる。', gen: '田（頭）と心。' });
D('名', 'な', '名', 'kokoro', { kind: 'feel', col: 'shu', fx: 'name', story: true, note: '名を呼ぶ。', gen: '夕方、口で名のる。暗くて見えないので。' });
D('母', 'はは', '母', 'kokoro', { kind: 'feel', col: 'momo', fx: 'mother', story: true, note: '絵師の母の思い出。', gen: '女の人に乳房（丶丶）。' });
D('父', 'ちち', '父', 'kokoro', { kind: 'feel', col: 'cha', fx: 'father', story: true, note: '絵師の父の思い出。', gen: '石おのを手に持つ形。' });
D('師', 'し', '師', 'kokoro', { kind: 'feel', col: 'sumi', fx: 'master', story: true, note: '絵師の師匠の思い出。', gen: '人のあつまり。人を導く人。' });
D('別', 'わかれ', '別れ', 'kokoro', { kind: 'feel', col: 'ai', fx: 'part', story: true, note: '絵師の別れの思い出。', gen: '骨（冎）を刀で分ける。' });
D('生', 'いきる', '生きる', 'kokoro', { kind: 'feel', col: 'moegi', fx: 'life', note: '枯れた物・弱った物が元気になる。', gen: '地面から草が生える形。' });

// ===== 材料にだけ使う字（書くと、小さな印になる）=====
D('口', 'くち', '口', 'kokoro', { kind: 'feel', col: 'sumi', fx: 'mouth', part: true, note: '口。合わせると、鳴く・呼ぶ……声に関わる字になる。', gen: '口の形。' });
D('田', 'た', '田んぼ', 'shizen', { kind: 'terra', col: 'cha', fx: 'paddy', note: '田んぼを作る。水がたまる。', gen: 'あぜ道で区切った田の形。' });
D('力', 'ちから', '力', 'yousu', { kind: 'adj', col: 'shu', fx: 'power', note: '自分に書くと力持ちになり、重い物も押せる。', gen: 'うでの筋肉（すき）の形。' });
D('立', 'たつ', '立つ', 'ugoki', { kind: 'verb', col: 'sumi', fx: 'standup', note: '倒れた物・横の物をまっすぐ立てる。', gen: '地面に人が立つ形。' });
D('女', 'おんな', '女の人', 'ikimono', { kind: 'beast', col: 'sumi', npc: true, ai: { spd: 1.6, sense: 4 }, note: '女の人。', gen: 'ひざまずく女の人の形。' });
D('音', 'おと', '音', 'kokoro', { kind: 'sky', col: 'kin', fx: 'sound', note: 'ぽーんと音が鳴る。生き物が気づく。', gen: '口に一本線（声に節）を立てる。' });
D('耳', 'みみ', '耳', 'kokoro', { kind: 'feel', col: 'sumi', fx: 'listen', part: true, note: '耳をすますと、生き物の声が聞こえる。', gen: '耳の形。' });
D('皮', 'かわ', '皮', 'mono', { kind: 'thing', col: 'cha', heavy: 0, flat: true, burn: 4, note: '皮。', gen: '手で獣の皮をはぐ形。' });
D('冬日', 'ふゆび', '冬の日', 'shizen', { kind: 'sky', col: 'sora', fx: 'sun', word: true, hidden: true, note: '', gen: '' });
D('里', 'さと', '里', 'shizen', { kind: 'sky', col: 'cha', fx: 'village', note: '里の人の声がする。', gen: '田と土。田畑のある所。' });
D('青空', 'あおぞら', '青空', 'shizen', { kind: 'sky', col: 'sora', fx: 'clear', word: true, note: '空が晴れわたる。', gen: '青い空。' });
D('化石', 'かせき', '化石', 'shizen', { solid: true, push: true, heavy: 1, col: 'hai', word: true, note: '大昔の生き物が石になったもの。', gen: '石に化ける。' });
D('雨雲', 'あまぐも', '雨雲', 'shizen', { kind: 'sky', col: 'ai', fx: 'raincloud', word: true, note: 'あなたの頭の上についてくる雨雲。', gen: '雨をふらせる雲。' });
D('朝日', 'あさひ', '朝日', 'shizen', { kind: 'sky', col: 'shu', fx: 'morning', word: true, note: '朝日がのぼる。', gen: '朝の日。' });
D('翁', 'おきな', '絵師', 'kokoro', { kind: 'thing', col: 'sumi', sz: [2, 3], heavy: 3, story: true, note: '絵巻を描いた絵師。', gen: '公（おおやけ）と羽。白いひげの老人。' });
D('筆', 'ふで', '筆', 'mono', { kind: 'thing', col: 'cha', heavy: 0, story: true, note: '筆。あなたが生まれたところ。', gen: '竹と聿（手に持つ筆）。' });
D('硯', 'すずり', '硯', 'mono', { kind: 'thing', col: 'sumi', heavy: 1, story: true, note: '硯。墨をする石。', gen: '石と見。' });
/*END_GLYPHS*/

// 書く墨の量（画数）
function strokesOf(k) {
  const d = KDEF[k];
  if (d && d._strokes) return d._strokes;
  let n = 0; for (const ch of k) n += Brush.strokeCount(ch);
  if (d) d._strokes = n;
  return n;
}

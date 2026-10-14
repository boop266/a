// 黄泉還：洋館 2階
ROOMS.w2corr = {
  name: '2階 西廊下', fl: '2F', map: [0, 0, 3, 18], w: 2.6, d: 18, h: 3.2,
  floor: 'parquet', wall: 'paper_blue', wain: 'wainscot', wainH: 1.0, ceil: 'plaster', rev: 0.35, thunder: true,
  ambience: { rain: 0.7, wind: 0.5, drone: 0.25 }, amb: ['#2c3440', 0.5], fog: ['#05070a', 0.045],
  doors: [
    { id: 'E', p: [1.3, 6.5], type: 'wood', to: ['hall', 'BW'] },
    { id: 'N', p: [0, -9], type: 'wood', to: ['bed', 'S'], lock: { key: 'hawk' } },
    { id: 'C', p: [1.3, -3], type: 'wood', to: ['child', 'W'] },
    { id: 'S', p: [0, 9], type: 'wood', to: ['wcorr', 'N'], fx: 'stairsdown', lock: { bar: 'this', msg: '階段室の扉だ。こちら側から、かんぬきが掛かっている。\n外しますか？' } },
  ],
  wins: [{ p: [-1.3, -6.2], w: 1.15, y: 0.85, h: 2.1 }, { p: [-1.3, -2.6], w: 1.15, y: 0.85, h: 2.1 }, { p: [-1.3, 1.0], w: 1.15, y: 0.85, h: 2.1 }, { p: [-1.3, 4.6], w: 1.15, y: 0.85, h: 2.1 }],
  props: [
    { k: 'runner', x: 0.15, z: 0, L: 17.2, w: 1.1 },
    { k: 'sconce', x: 1.27, z: 3.0, r: 3, i: 2.4 }, { k: 'sconce', x: 1.27, z: -5.6, r: 3, i: 2.0, fl: 0.2 },
    { k: 'painting', x: 1.27, z: 0.6, r: 3, tex: 'pt_p2', w: 0.65, h: 0.85, t: '着物姿の婦人の肖像。額の裏に「千鶴」と墨で書いてある。' },
    { k: 'vase', x: 0.95, z: -7.6 }, { k: 'sideboard', x: 0.98, z: 8.0, r: 3, L: 1.2, t: '小さな棚。上に、手燭が一本だけ置いてある。' },
  ],
  build(c) { // 窓の両脇の重たいカーテン
    for (const z of [-6.2, -2.6, 1.0, 4.6]) for (const s of [-1, 1]) c.g.box(M('velvet_r'), -1.2, 1.55, z + s * 0.78, 0.08, 3.0, 0.32);
  },
  looks: [{ p: [-1.0, 1.0], r: 1.0, t: '窓の外は、森と雨と闇だけだ。\n稲光のたびに、木々の間に何かの影が動いた気がする。' }, { p: [-1.0, -2.6], r: 1.0, t: '窓の下の地面に、四つ足の足跡がいくつも残っている。' }],
  cams: [
    { p: [1.0, 2.8, 8.6], t: [-0.6, 0.9, -1.2], fov: 54, z: [-1.3, 0, 1.3, 9] },
    { p: [1.0, 2.8, -8.6], t: [-0.6, 0.9, 1.2], fov: 54, z: [-1.3, -9, 1.3, 0] },
    { id: 'dogs', p: [1.0, 1.7, 4.2], t: [-1.3, 1.4, 0.4], fov: 52, event: true },
  ],
  enemies: [{ t: 'dog', x: -0.3, z: 1.0, key: 'w2_d1', cond: 'f:dogs', alert: true }, { t: 'dog', x: -0.3, z: -2.6, key: 'w2_d2', cond: 'f:dogs', alert: true }],
};
ROOMS.bed = {
  name: '寝室', fl: '2F', map: [-4, -9, 8, 7], w: 8, d: 7, h: 3.6,
  floor: 'parquet_d', wall: 'paper_red', wain: 'wainscot', wainH: 1.1, ceil: 'ceil', rev: 0.2, thunder: true,
  ambience: { rain: 0.5, drone: 0.3 }, amb: ['#4a3636', 0.62], fog: ['#080505', 0.03],
  doors: [{ id: 'S', p: [-2.6, 3.5], type: 'wood', to: ['w2corr', 'N'], lock: { key: 'hawk' } }],
  wins: [{ p: [1.0, -3.5], w: 1.4, y: 1.0, h: 2.0 }],
  props: [
    { k: 'rug', x: -0.5, z: 0.2, w: 3.4, d: 2.6 },
    { k: 'bed', x: -1.4, z: -1.6, r: 0, canopy: true, t: '天蓋つきの寝台。枕は二つ。片方だけ、ひどくへこんでいる。' },
    { k: 'vanity', x: 3.7, z: -1.3, r: 3 },
    { k: 'wardrobe', x: 3.62, z: 1.7, r: 3, id: 'wardrobe' },
    { k: 'desk', x: -3.45, z: 1.9, r: 1, L: 1.2, papers: true, t: '書き物机。手紙の束が、紐で丁寧にくくってある。' },
    { k: 'painting', x: -3.96, z: -1.4, r: 1, tex: 'pt_p5', w: 0.7, h: 0.9, yc: 1.9, t: '白い服の少女の肖像。\n額に「小夜　十歳」と金文字がある。' },
    { k: 'sconce', x: -3.96, z: 0.3, r: 1, i: 2.6, c: '#ffc0a0' }, { k: 'sconce', x: 3.96, z: -2.9, r: 3, i: 1.6, fl: 0.2 },
    { k: 'armchair', x: 1.6, z: 2.6, r: 2, cloth: 'velvet_r' }, { k: 'chandelier', x: 0.6, y: 3.45, z: 0.2, s: 0.7, i: 6, d: 9, chain: 0.25 },
  ],
  acts: [{ p: [3.15, -1.3], r: 0.9, id: 'vanity', items: ['key_small'] }],
  looks: [{ p: [3.1, 1.7], r: 0.9, t: () => flag('wardrobe') ? '衣装棚の扉が、内側から打ち破られている。' : '衣装棚。奥から、かすかに何かが擦れる音がした……気のせいだろうか。' }],
  items: [{ id: 'file', file: 'yukino', x: -3.3, z: 1.8, y: 0.8, key: 'f_yukino' }, { id: 'herb_g', x: 1.6, z: -3.0, key: 'bed_h1' }],
  cams: [
    { p: [3.7, 3.25, 3.2], t: [-1.7, 0.5, -1.3], fov: 58, z: [-4, -3.5, 1.2, 3.5] },
    { p: [-3.7, 3.25, 3.2], t: [2.0, 0.6, -0.8], fov: 58, z: [1.2, -3.5, 4, 3.5] },
    { id: 'ward', p: [0.6, 1.6, 0.8], t: [3.4, 1.2, 1.7], fov: 52, event: true },
  ],
  enemies: [{ t: 'zombie', k: 'servant', x: 3.45, z: 1.7, r: -PI / 2, key: 'bed_z1', hidden: true, st: 'idle' }],
};
ROOMS.child = {
  name: '子ども部屋', fl: '2F', map: [3, -3, 6, 6], w: 6, d: 6, h: 3.2,
  floor: 'parquet', wall: 'paper_child', wain: 'wainscot', wainH: 0.9, ceil: 'plaster', rev: 0.15, thunder: true,
  ambience: { rain: 0.45, drone: 0.15, wind: 0.25 }, amb: ['#3a4250', 0.52], hemi: ['#8090b0', '#302820', 0.25], fog: ['#06070a', 0.035],
  doors: [{ id: 'W', p: [-3, 1.0], type: 'wood', to: ['w2corr', 'C'] }],
  wins: [{ p: [0.6, -3], w: 1.0, y: 1.1, h: 1.4 }],
  props: [
    { k: 'rug', x: 0, z: 0.3, w: 2.8, d: 2.2, tex: 'velvet_b' },
    { k: 'smallbed', x: 1.9, z: -1.85, r: 0 }, { k: 'rockinghorse', x: -1.5, z: -1.6, r: 1 },
    { k: 'toychest', x: 2.3, z: 2.45, r: 2 }, { k: 'dollshelf', x: 2.86, z: 0.5, r: 3 }, { k: 'musicbox', x: -2.45, z: 2.45, r: 0 },
    { k: 'painting', x: -0.6, z: 2.96, r: 2, tex: 'cray0', w: 0.5, h: 0.5, yc: 1.3, frame: 'wood_l', t: '子どもの絵。背の高い男の人と、赤い服の女の子が手をつないでいる。\n「おとうさまと　わたし」' },
    { k: 'painting', x: 0.4, z: 2.96, r: 2, tex: 'cray1', w: 0.5, h: 0.5, yc: 1.4, frame: 'wood_l', t: 'お屋敷の絵。窓がぜんぶ、青いクレヨンで塗られている。' },
    { k: 'painting', x: -2.96, z: -0.6, r: 1, tex: 'cray2', w: 0.5, h: 0.5, yc: 1.4, frame: 'wood_l', t: '黒く塗りつぶされた絵。上から、大きくバツが描かれている。\n裏に、大人の字で「見るな」。' },
    { k: 'sconce', x: 2.96, z: -1.0, r: 3, i: 2.0, c: '#ffd8b0', fl: 0.1 },
  ],
  acts: [{ p: [2.3, 1.95], r: 0.9, id: 'toychest' }],
  items: [{ id: 'file', file: 'sayo', x: 1.95, z: -1.4, y: 0.53, key: 'f_sayo' }],
  cams: [
    { p: [2.7, 2.8, 2.7], t: [-1.2, 0.5, -1.3], fov: 62, z: [-3, -3, 3, 0.3] },
    { p: [-2.7, 2.8, -2.7], t: [1.3, 0.5, 1.6], fov: 62, z: [-3, 0.3, 3, 3] },
  ],
};
// 肖像画の回廊：壁に並ぶ順（北←→南）と、生まれた順
const GALLERY = [
  { z: 6.4, k: 'p3', name: '鷲尾 弦一郎' }, { z: 4.0, k: 'p0', name: '鷲尾 宗一郎' }, { z: 1.6, k: 'p4', name: '鷲尾 雪乃' },
  { z: -0.8, k: 'p1', name: '鷲尾 重光' }, { z: -3.2, k: 'p5', name: '鷲尾 小夜' }, { z: -5.6, k: 'p2', name: '鷲尾 千鶴' },
];
ROOMS.gallery = {
  name: '肖像画の回廊', fl: '2F', map: [32, -2, 3, 20], w: 3, d: 20, h: 3.4,
  floor: 'parquet_d', wall: 'paper_green', wain: 'wainscot', wainH: 1.1, ceil: 'ceil', rev: 0.45,
  ambience: { rain: 0.15, drone: 0.45 }, amb: ['#2c302a', 0.42], fog: ['#060705', 0.045],
  doors: [{ id: 'W', p: [-1.5, 8.5], type: 'wood', to: ['hall', 'BE'], lock: { key: 'snake' } }, { id: 'N', p: [0, -10], type: 'wood', to: ['library', 'S'] }],
  props: [
    { k: 'runner', x: -0.2, z: 0, L: 19, w: 1.2 },
    ...GALLERY.map(p => ({ k: 'painting', x: 1.46, z: p.z, r: 3, tex: 'pt_' + p.k, w: 0.75, h: 0.95, yc: 1.95, frame: 'brass', t: null })),
    { k: 'sconce', x: -1.46, z: 5.0, r: 1, i: 2.0 }, { k: 'sconce', x: -1.46, z: -4.0, r: 1, i: 2.0, fl: 0.15 },
    { k: 'bench', x: -1.1, z: 1.0, r: 1, t: '長椅子。肖像画をゆっくり眺めるためのものだろう。' },
    { k: 'vase', x: -1.15, z: -8.6 },
  ],
  build(c) {
    const g = c.g, br = M('brass'); c.R.dyn.plights = [];
    for (let i = 0; i < GALLERY.length; i++) {
      const p = GALLERY[i];
      g.box(br, 1.44, 1.22, p.z, 0.04, 0.12, 0.34); // 名札
      g.box(M('wood_d'), 1.38, 1.0, p.z, 0.12, 0.3, 0.24); g.cyl(br, 1.3, 1.05, p.z, 0.025, 0.04, 6); // 押しボタンの台
      const lm = new THREE.MeshBasicMaterial({ color: '#6a5634' }); const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.5), lm); lamp.position.set(1.38, 2.55, p.z); c.add(lamp); c.R.dyn.plights.push(lm);
      c.act(1.0, p.z, 0.75, 'portrait', { idx: i });
    }
    // 南の突き当たり：狼の鍵が収まる飾り箱
    const box = gbMesh(gb => { gb.box(M('wood_d'), 0, 0.5, 0, 0.6, 1.0, 0.45); gb.box(M('velvet_r'), 0, 1.01, 0, 0.5, 0.02, 0.36); });
    box.position.set(0, 0, 9.55); c.add(box); c.block([-0.35, 9.25, 0.35, 10], 0); c.look(0, 9.2, 0.8, () => flag('portraits') ? '飾り箱の蓋が開いている。' : '鍵のかかった飾り箱。蓋に、狼の横顔が彫られている。\n鍵穴はない。');
    const lid = gbMesh(gb => gb.box(M('wood_d'), 0, 0, -0.22, 0.62, 0.05, 0.46)); lid.position.set(0, 1.04, 9.78); c.add(lid); c.R.dyn.lid = lid;
    if (flag('portraits')) { lid.rotation.x = -1.2; GALLERY.forEach((_, i) => c.R.dyn.plights[i].color.set('#ffe0a0')); }
  },
  looks: [{ p: [-1.0, -9.4], r: 0.9, t: '回廊の突き当たり。図書室の扉がある。' }],
  items: [{ id: 'key_wolf', x: 0, z: 9.6, y: 1.04, key: 'wolfkey', cond: 'f:portraits' }],
  cams: [
    { p: [-1.1, 2.9, 9.6], t: [0.7, 1.3, 0.4], fov: 55, z: [-1.5, 0.3, 1.5, 10] },
    { p: [-1.1, 2.9, -9.6], t: [0.7, 1.3, -0.4], fov: 55, z: [-1.5, -10, 1.5, 0.3] },
  ],
  enemies: [{ t: 'zombie', k: 'butler', x: 0.2, z: -9.0, r: 0, key: 'gal_z1', cond: 'f:portraitFail', alert: true }],
};
ROOMS.library = {
  name: '図書室', fl: '2F', map: [29, -11, 10, 8], w: 10, d: 8, h: 4.6,
  floor: 'parquet_d', wall: 'paper_green', wain: 'wainscot', wainH: 1.0, ceil: 'ceil', rev: 0.3, thunder: true,
  ambience: { rain: 0.35, clock: 0.6, drone: 0.25 }, amb: ['#2e3428', 0.5], fog: ['#050604', 0.035],
  doors: [{ id: 'S', p: [3.5, 4], type: 'wood', to: ['gallery', 'N'] }],
  wins: [{ p: [-5, -0.2], w: 1.2, y: 1.2, h: 2.2 }],
  props: [
    { k: 'bookshelf', x: -2.7, z: -3.78, r: 0, L: 3.6, h: 3.4 }, { k: 'bookshelf', x: 1.4, z: -3.78, r: 0, L: 3.2, h: 3.4, t: '鷲尾家の帳簿。大正の終わりから、神代製薬からの入金が毎月記されている。' },
    { k: 'bookshelf', x: 4.78, z: 2.3, r: 3, L: 1.9, h: 3.0 }, { k: 'bookshelf', x: -4.78, z: -2.7, r: 1, L: 1.8, h: 3.0 }, { k: 'bookshelf', x: -4.78, z: 2.4, r: 1, L: 2.4, h: 3.0, t: '詩集が並んでいる。一冊だけ、子ども向けの絵本が混じっている。' },
    { k: 'ladder', x: 3.1, z: -3.35, r: 0 },
    { k: 'readtable', x: -1.5, z: 0.6, L: 2.4, lamp: true }, { k: 'chair', x: -2.2, z: 1.3, r: 2 }, { k: 'chair', x: -0.8, z: -0.1, r: 0 },
    { k: 'lectern', x: 1.6, z: 1.9, r: 2, t: null }, { k: 'globe', x: 2.2, z: -1.6, t: '大きな地球儀。独逸のあたりが、手垢で黒ずんでいる。' }, { k: 'armchair', x: -3.6, z: 0.4, r: 1, cloth: 'leather' },
    { k: 'chandelier', x: 0, y: 4.4, z: 0, s: 0.9, i: 5, d: 9, chain: 0.5 },
    { k: 'blood', x: 3.6, z: -1.0, s: 0.9, tex: 'smear', a: 0, asp: 0.5 },
  ],
  build(c) { // 押せる本棚（床に引きずった跡）
    const pushed = flag('shelf'); const sh = gbMesh(gb => { const w = M('wood_d'), bk = M('books'); gb.box(w, 0, 1.4, -0.18, 2.0, 2.8, 0.04); gb.box(w, -0.97, 1.4, 0, 0.06, 2.8, 0.4); gb.box(w, 0.97, 1.4, 0, 0.06, 2.8, 0.4); gb.box(w, 0, 2.77, 0, 2.0, 0.06, 0.42); for (let k = 0; k < 6; k++) { const y = 0.08 + k * 0.45; gb.box(w, 0, y, 0, 1.92, 0.04, 0.38); gb.quad(bk, [-0.94, y + 0.02, 0.1], [0.94, y + 0.02, 0.1], [0.94, y + 0.42, 0.1], [-0.94, y + 0.42, 0.1], [[k * 0.3, 0], [k * 0.3 + 1, 0], [k * 0.3 + 1, 1], [k * 0.3, 1]]); } });
    sh.rotation.y = -PI / 2; sh.position.set(4.78, 0, pushed ? -2.6 : -1.0); c.add(sh); c.R.dyn.shelf = sh;
    c.R.dyn.shelfBlock = c.block([4.55, -2.0, 5, 0.0], 0, { tall: true }); if (pushed) c.R.dyn.shelfBlock.r = [4.55, -3.6, 5, -1.6];
    // 奥のくぼみ
    c.g.box(M('col', { c: '#0c0908' }), 4.95, 1.2, -1.0, 0.1, 2.4, 1.2, { no: '-x' });
    c.g.plate(M('smear', { at: 0.3 }), 4.3, 0.013, -1.6, 1.2, 0.5, '+y');
  },
  acts: [{ p: [4.15, -1.0], r: 1.0, id: 'pushshelf', cond: '!f:shelf' }],
  looks: [{ p: [4.2, -1.6], r: 0.9, t: '本棚の前の床に、何度も引きずったような跡がある。', cond: '!f:shelf' }],
  items: [{ id: 'file', file: 'family', x: -1.0, z: 0.6, y: 0.78, key: 'f_family' }, { id: 'map', map: '2F', x: 1.6, z: 1.9, y: 1.12, key: 'map2f' }, { id: 'sg_ammo', n: 7, x: -2.2, z: 0.5, y: 0.78, key: 'lib_sg' }, { id: 'key_hunt', x: 4.75, z: -1.0, y: 0.95, key: 'huntkey', cond: 'f:shelf' }],
  cams: [
    { p: [4.6, 4.2, 3.6], t: [-2.1, 0.5, -1.6], fov: 58, z: [-5, -4, 0.8, 4] },
    { p: [-4.6, 4.2, 3.6], t: [2.7, 0.6, -1.2], fov: 58, z: [0.8, -4, 5, 4] },
  ],
  enemies: [{ t: 'zombie', k: 'servant', x: -3.2, z: 2.9, r: 0.6, key: 'lib_z1' }, { t: 'zombie', k: 'butler', x: 2.6, z: -2.2, r: 2.6, key: 'lib_z2' }],
};

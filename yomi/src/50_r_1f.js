// 黄泉還：洋館 1階
// 共通の組み立て：まっすぐな階段（z の負の向きに上る）
function stairsZ(c, x0, x1, zb, zt, h, n, o = {}) {
  const g = c.g, run = (zb - zt) / n, rise = h / n, w = x1 - x0, cx = (x0 + x1) / 2;
  for (let i = 0; i < n; i++) { const top = rise * (i + 1), z = zb - run * (i + 0.5); g.box(M(o.mat || 'wood_d'), cx, top / 2, z, w, top, run, { no: '-y' }); g.box(M('runner'), cx, top + 0.004, z, w * 0.62, 0.008, run, { fit: true, no: '-y' }); }
  if (o.rail !== false) for (const x of [x0 + 0.06, x1 - 0.06]) {
    const L = hyp(zb - zt, h), a = Math.atan2(h, zb - zt);
    c.g.pushM(new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2 + 0.95, (zb + zt) / 2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a), new THREE.Vector3(1, 1, 1))); c.g.box(M('wood_d'), 0, 0, 0, 0.1, 0.1, L + 0.1); c.g.pop();
    for (let i = 0; i <= n; i += 2) { const z = zb - run * i, y = rise * i; g.box(M('wood_d'), x, y + 0.5, z - run * 0.5, 0.05, 0.95, 0.05); }
    g.box(M('wood_d'), x, 0.6, zb - 0.1, 0.16, 1.2, 0.16); g.ball(M('wood_d'), x, 1.28, zb - 0.1, 0.1, 0.1, 0.1, 3);
  }
}
// 手すり（一直線）
function balus(c, x0, z0, x1, z1, y, h = 1.0) {
  const g = c.g, L = hyp(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 0.22)), w = M('wood_d');
  g.push((x0 + x1) / 2, y, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0) - PI / 2);
  g.box(w, 0, h, 0, L, 0.08, 0.12); g.box(w, 0, 0.06, 0, L, 0.1, 0.12);
  for (let i = 0; i <= n; i++) g.cyl(w, -L / 2 + L * i / n, 0.1, 0, 0.025, h - 0.12, 5, { r2: 0.035 });
  g.pop();
}
ROOMS.hall = {
  name: '玄関ホール', fl: '1F', map: [16, 8, 16, 14], w: 16, d: 14, h: 7.2,
  floor: 'parquet', wall: 'paper_cream', wain: 'wainscot', wainH: 1.2, ceil: 'ceil', music: '', rev: 0.55,
  ambience: { rain: 0.25, drone: 0.25 }, amb: ['#56483c', 0.5], fog: ['#0b0907', 0.03],
  floors: [{ r: [-8, -7, 8, 7], y: 0 }, { r: [-1.6, -3.8, 1.6, 1.8], y: 3.6, y2: 0, ax: 'z' }, { r: [-8, -7, 8, -3.8], y: 3.6 }],
  blocks: [{ r: [-1.75, -3.8, 1.75, 0.95], y: 0, tall: true }, { r: [-8, -3.98, -1.6, -3.74], y: 3.6 }, { r: [1.6, -3.98, 8, -3.74], y: 3.6 },
    { r: [-2.65, -4.15, -2.15, -3.65], y: 0, tall: true }, { r: [2.15, -4.15, 2.65, -3.65], y: 0, tall: true }],
  stepAt: (x, z, y) => abs(x) < 0.95 && z > -3.8 ? 'carpet' : null,
  doors: [
    { id: 'S', p: [0, 7], w: 2.2, type: 'double', h: 3.0, lock: { story: () => flag('dogsOut') ? '扉の向こうで、まだ何かが唸っている。\n……今は、外へは出られない。' : '外で、犬が唸っている。\n今は出られない。' } },
    { id: 'W', p: [-8, -1.2], type: 'double', to: ['dining', 'E'] },
    { id: 'E', p: [8, -1.2], type: 'double', to: ['ecorr', 'W'] },
    { id: 'BW', p: [-8, -5.4], y: 3.6, type: 'wood', to: ['w2corr', 'E'] },
    { id: 'BE', p: [8, -5.4], y: 3.6, type: 'wood', to: ['gallery', 'W'], lock: { key: 'snake' } },
  ],
  wins: [{ p: [-5, 7], w: 1.3, y: 1.0, h: 2.6 }, { p: [5, 7], w: 1.3, y: 1.0, h: 2.6 }, { p: [-4, 7], w: 1.0, y: 4.6, h: 1.6 }, { p: [4, 7], w: 1.0, y: 4.6, h: 1.6 }],
  props: [
    { k: 'runner', x: 0, z: 4.4, L: 5.2, w: 1.8 }, { k: 'runner', x: 0, y: 3.6, z: -5.4, L: 3.2, w: 1.6, r: 1 },
    { k: 'statue', x: -2.6, z: 2.7, r: 1 }, { k: 'statue', x: 2.6, z: 2.7, r: 3, t: '中が空っぽの甲冑。兜の隙間から、蜘蛛の巣が垂れている。' },
    { k: 'chandelier', x: 0, y: 6.4, z: 1.5, s: 1.4, i: 26, d: 18, chain: 0.8 },
    { k: 'sconce', x: -7.95, z: 2.6, r: 1, i: 3 }, { k: 'sconce', x: 7.95, z: 2.6, r: 3, i: 3 }, { k: 'sconce', x: -7.95, z: -5.6, r: 1, i: 2.2, off: true },
    { k: 'painting', x: 0, z: -6.95, tex: 'pt_p3', w: 1.5, h: 1.9, yc: 5.55, frame: 'brass', t: '鷲尾弦一郎男爵の肖像画。\n落ちくぼんだ目が、階段の下をじっと見下ろしている。' },
    { k: 'painting', x: -7.95, z: -2.8, r: 1, tex: 'pt_night', w: 1.4, h: 1.0, yc: 2.1, t: '夜の鷲尾山を描いた絵。山の中腹に、この館が小さく描かれている。' },
    { k: 'painting', x: 7.95, z: -2.8, r: 3, tex: 'pt_land1', w: 1.4, h: 1.0, yc: 2.1, t: '湖と山の風景画。署名は「弦」。男爵が自分で描いたのだろうか。' },
    { k: 'vase', x: -6.6, z: -6.4 }, { k: 'vase', x: 6.6, z: -6.4, t: '花瓶の水が、赤く濁っている。' },
    { k: 'sideboard', x: -6.5, z: 6.6, r: 2, L: 1.6, t: '靴箱。大きさの違う長靴が並んでいる。そのうちの一足は、泥がまだ乾いていない。' },
    { k: 'blood', x: -6.9, z: -0.4, s: 1.2, tex: 'smear', a: 1.4, t: '血の跡が、食堂の扉の下へと続いている。' },
  ],
  build(c) {
    const g = c.g, pm = M('parquet'), wd = M('wood_d'), mb = M('marble_w');
    // 二階の回廊（床・裏・前の縁）
    g.quad(pm, [-8, 3.6, -3.8], [8, 3.6, -3.8], [8, 3.6, -7], [-8, 3.6, -7], [[-8 / 1.6, 3.8 / 1.6], [8 / 1.6, 3.8 / 1.6], [8 / 1.6, 7 / 1.6], [-8 / 1.6, 7 / 1.6]]);
    g.quad(M('ceil'), [-8, 3.4, -7], [8, 3.4, -7], [8, 3.4, -3.8], [-8, 3.4, -3.8], [[-4, -3.5], [4, -3.5], [4, -1.9], [-4, -1.9]]);
    g.box(wd, 0, 3.5, -3.8, 16, 0.22, 0.1, { no: '-z' });
    balus(c, -8, -3.85, -1.62, -3.85, 3.6); balus(c, 1.62, -3.85, 8, -3.85, 3.6);
    for (const x of [-2.4, 2.4]) { g.cyl(mb, x, 0, -3.9, 0.2, 3.4, 8); g.box(mb, x, 0.1, -3.9, 0.5, 0.2, 0.5); g.box(mb, x, 3.32, -3.9, 0.5, 0.16, 0.5); }
    stairsZ(c, -1.6, 1.6, 1.8, -3.8, 3.6, 18);
    // 階段下の壁（中は物置）
    g.quad(M('wainscot'), [-1.6, 0, 0.95], [1.6, 0, 0.95], [1.6, 0.4, 0.95], [-1.6, 0.4, 0.95], [[0, 0], [3, 0], [3, 0.35], [0, 0.35]]);
    // 二階の扉の前の床の縁
    g.box(wd, -6.2, 3.62, -5.4, 2.8, 0.02, 1.6, { no: '-y' });
  },
  looks: [
    { p: [0, 2.6], r: 1.4, t: 'シャンデリアは電球だ。この館には、自家発電の設備があるらしい。\n――つまり、誰かが今も、この館を動かしている。' },
    { p: [0, -6.4], r: 1.6, y: 3.6, t: '男爵の肖像画。真下から見上げると、目が合う。' },
    { p: [0, -1.5], r: 1.1, t: '階段の下に、小さな扉の跡がある。釘で打ちつけられて、開かない。' },
  ],
  cams: [
    { p: [6.3, 2.5, 6.5], t: [-1.0, 2.2, -3.0], fov: 58, z: [-8, -0.6, 8, 7], lv: [-0.5, 0.45] },
    { p: [-7.3, 3.1, -6.4], t: [1.2, 0.6, 2.6], fov: 58, z: [-8, -7, 0, -0.6], lv: [-0.5, 0.45] },
    { p: [7.3, 3.1, -6.4], t: [-1.2, 0.6, 2.6], fov: 58, z: [0, -7, 8, -0.6], lv: [-0.5, 0.45] },
    { p: [-5.6, 5.6, 4.6], t: [0.4, 2.0, -1.4], fov: 56, z: [-1.7, -3.8, 1.7, 1.9], lv: [0.4, 3.5] },
    { p: [6.6, 6.5, -2.4], t: [-5.2, 3.6, -5.6], fov: 58, z: [-8, -7, 0, -3.7], lv: [3.3, 4] },
    { p: [-6.6, 6.5, -2.4], t: [5.2, 3.6, -5.6], fov: 58, z: [0, -7, 8, -3.7], lv: [3.3, 4] },
  ],
  enemies: [
    { t: 'zombie', k: 'butler', x: 3.2, z: 1.0, r: PI, key: 'hall_z1', cond: 'f:clock', st: 'idle' },
  ],
};
ROOMS.dining = {
  name: '食堂', fl: '1F', map: [3, 9, 13, 8], w: 14, d: 8, h: 4.2,
  floor: 'parquet_d', wall: 'paper_red', wain: 'wainscot', wainH: 1.1, ceil: 'ceil', rev: 0.4,
  ambience: { rain: 0.5, clock: 1, fire: 0.6, drone: 0.2 }, amb: ['#3a2a22', 0.42], fog: ['#0a0605', 0.04],
  doors: [{ id: 'E', p: [7, 0], type: 'double', to: ['hall', 'W'] }, { id: 'N', p: [-5.5, -4], type: 'wood', to: ['wcorr', 'S'] }],
  wins: [{ p: [-4, 4], w: 1.2, y: 1.0, h: 2.3 }, { p: [0, 4], w: 1.2, y: 1.0, h: 2.3 }, { p: [4, 4], w: 1.2, y: 1.0, h: 2.3 }],
  props: [
    { k: 'table_long', x: 0, z: 0.3, L: 7, W: 1.3 },
    ...[-2.4, -1.2, 0, 1.2, 2.4].flatMap(x => [{ k: 'chair', x, z: -0.55, r: 0 }, { k: 'chair', x, z: 1.15, r: 2 }]),
    { k: 'chair', x: -4.0, z: 0.3, r: 1 }, { k: 'chair', x: 4.0, z: 0.3, r: 3, t: '主人の席。椅子が、少しだけ引かれている。' },
    { k: 'fireplace', x: -6.72, z: 0.2, r: 1, fire: true, W: 1.9 },
    { k: 'clock', x: 2.6, z: -3.72, r: 0 },
    { k: 'sideboard', x: -2.2, z: -3.7, r: 0, L: 1.9 },
    { k: 'painting', x: -2.2, z: -3.96, tex: 'pt_sea', w: 1.4, h: 0.9, yc: 2.3, t: '海の絵。この山奥の屋敷に、海の絵は少し不思議だ。' },
    { k: 'painting', x: 6.95, z: -2.3, r: 3, tex: 'pt_p4', w: 0.7, h: 0.9, yc: 2.0, t: '若い女性の肖像。男爵夫人、雪乃。微笑んでいるのに、寂しそうに見える。' },
    { k: 'chandelier', x: -2.0, y: 3.9, z: 0.3, s: 0.8, i: 6, d: 8, chain: 0.3 }, { k: 'chandelier', x: 2.0, y: 3.9, z: 0.3, s: 0.8, i: 6, d: 8, chain: 0.3, fl: 0.25 },
    { k: 'blood', x: -5.4, z: 1.7, s: 1.4, t: '暖炉の前に血だまり。まだ乾いていない。\n引きずったような跡が、北の扉のほうへ続いている。' },
    { k: 'blood', x: -5.5, z: -1.6, s: 1.0, tex: 'smear', a: 0.4 },
  ],
  looks: [{ p: [0, 3.6], r: 1.3, t: '雨が窓を叩いている。外は真っ暗で、何も見えない。' }, { p: [4, 3.6], r: 1.0, t: '窓に、自分の顔が映っている。その後ろには、誰もいない。……いないはずだ。' }],
  acts: [{ p: [2.6, -3.25], r: 1.0, id: 'clock', items: ['gear'] }],
  items: [{ id: 'file', file: 'invite', x: 3.1, z: 0.5, y: 0.79, key: 'f_invite' }],
  cams: [
    { p: [6.5, 3.3, 3.5], t: [-2.6, 0.5, -1.2], fov: 56, z: [0.6, -4, 7, 4] },
    { p: [-6.4, 3.1, 3.6], t: [3.0, 0.6, -1.4], fov: 56, z: [-7, -4, 0.6, 4] },
    { id: 'clock', p: [1.3, 1.9, -1.4], t: [2.6, 1.85, -3.7], fov: 45, event: true },
  ],
};
ROOMS.wcorr = {
  name: '1階 西廊下', fl: '1F', map: [0, 0, 3, 9], rects: [[-1.2, -6, 1.2, 6], [-1.2, -8.4, 9, -6]], h: 3.0,
  floor: 'parquet', wall: 'paper_green', wain: 'wainscot', wainH: 1.1, ceil: 'plaster', rev: 0.3,
  ambience: { rain: 0.15, drone: 0.4, wind: 0.2 }, amb: ['#2a3028', 0.4], fog: ['#060806', 0.06],
  doors: [
    { id: 'S', p: [0, 6], type: 'wood', to: ['dining', 'N'] }, { id: 'W', p: [-1.2, 0.2], type: 'wood', to: ['servant', 'E'] },
    { id: 'E', p: [9, -7.2], type: 'wood', to: ['kitchen', 'W'] },
    { id: 'N', p: [5.2, -8.4], type: 'wood', to: ['w2corr', 'S'], fx: 'stairs', lock: { bar: 'other', msg: '階段室の扉だ。\n向こう側から、かんぬきが掛かっている。' } },
  ],
  props: [
    { k: 'runner', x: 0, z: 0, L: 11.5, w: 1.0 }, { k: 'runner', x: 3.9, z: -7.2, L: 9.6, w: 1.0, r: 1 },
    { k: 'sconce', x: -1.17, z: 3.3, r: 1, i: 2.4 }, { k: 'sconce', x: 1.17, z: -3.0, r: 3, i: 1.6, fl: 0.4 }, { k: 'sconce', x: 6.8, z: -8.37, r: 0, i: 2 }, { k: 'sconce', x: -1.17, z: -6.9, r: 1, i: 1.8, fl: 0.15 },
    { k: 'painting', x: 1.17, z: 2.0, r: 3, tex: 'pt_land2', w: 1.1, h: 0.75, t: '冬の山の絵。描かれた木々が、どれも同じ方向に傾いている。' },
    { k: 'vase', x: 8.4, z: -6.5, t: '花瓶。中の水に、髪の毛が一本浮いている。' },
    { k: 'wallblood', x: -1.17, z: -4.5, r: 1, yc: 1.0, t: '壁に、手でこすったような血の跡。' },
    { k: 'blood', x: 0.9, z: -7.0, s: 1.6 },
  ],
  build(c) { const m = makeCorpse('miura', 'back'); m.position.set(1.8, 0, -7.45); m.rotation.y = PI / 2; c.add(m); c.look(1.9, -7.4, 1.0, () => G.taken.miura_ammo ? '先発隊の三浦。首から下が、ほとんど残っていない。\nもう、何も持っていない。' : '先発隊の三浦だ……。\n首から下が、ひどく食い荒らされている。'); },
  items: [{ id: 'hg_ammo', n: 15, x: 2.4, z: -7.0, key: 'miura_ammo' }, { id: 'file', file: 'miura', x: 1.2, z: -7.9, key: 'f_miura' }],
  cams: [
    { p: [0.85, 2.55, 5.85], t: [-0.1, 0.9, -3.4], fov: 52, z: [-1.2, -1, 1.2, 6] },
    { p: [-0.9, 2.6, -0.6], t: [1.0, 0.6, -7.4], fov: 55, z: [-1.2, -6, 1.2, -1] },
    { p: [-0.95, 2.7, -8.15], t: [8.4, 0.7, -6.8], fov: 54, z: [-1.2, -8.4, 9, -6] },
    { id: 'turn', p: [1.35, 1.1, -5.55], t: [0.95, 0.95, -6.95], fov: 44, event: true },
  ],
  enemies: [{ t: 'zombie', k: 'miura', x: 1.0, z: -7.0, r: 1.6, key: 'wc_z1', st: 'eat', sense: 5 }],
};
ROOMS.servant = {
  name: '使用人部屋', fl: '1F', map: [-5, 2, 4, 5], w: 4.4, d: 5.2, h: 2.9, save: true,
  floor: 'parquet', wall: 'paper_cream', wain: 'wainscot', wainH: 1.0, ceil: 'plaster', music: 'save', rev: 0.15,
  ambience: { rain: 0.3, drone: 0 }, amb: ['#5a4a38', 0.55], fog: ['#0a0806', 0.03],
  doors: [{ id: 'E', p: [2.2, 0], type: 'wood', to: ['wcorr', 'W'] }],
  wins: [{ p: [-2.2, -1.0], w: 0.9, y: 1.1, h: 1.3 }],
  props: [
    { k: 'typewriter', x: 0.7, z: -2.22, r: 0 }, { k: 'itembox', x: -1.82, z: 1.0, r: 1 },
    { k: 'cot', x: -1.5, z: 1.45, r: 0, noblock: false, t: '使用人の寝台。枕もとに、編みかけの手袋が置いてある。' },
    { k: 'shelf', x: 1.2, z: 2.45, r: 2, L: 1.2, t: '棚。家族の写真が一枚、伏せて置いてある。' },
    { k: 'sconce', x: 2.17, z: -1.6, r: 3, i: 3.2, c: '#ffd8a0' },
  ],
  build(c) { c.R.blocks = c.R.blocks.filter(b => !(b.r[0] < -1.7 && b.r[3] > 2.3 && b.r[1] > 0.4)); c.block([-1.95, 0.45, -1.05, 2.4], 0); },
  items: [{ id: 'ribbon', n: 3, x: 1.25, z: -2.15, y: 0.75, key: 'srv_rib' }, { id: 'map', map: '1F', x: 0.1, z: -2.15, y: 0.75, key: 'map1f' }, { id: 'spray', x: 1.0, z: 2.3, y: 0.62, key: 'srv_spray' }, { id: 'file', file: 'servant', x: 1.5, z: 2.3, y: 1.12, key: 'f_servant' }],
  cams: [{ p: [1.98, 2.55, 2.42], t: [-1.25, 0.45, -0.85], fov: 68 }],
};
ROOMS.kitchen = {
  name: '厨房', fl: '1F', map: [12, 0, 8, 7], w: 8, d: 7, h: 3.3,
  floor: 'tile', wall: 'plaster', wain: 'tile', wainH: 1.4, ceil: 'plaster', rev: 0.35,
  ambience: { rain: 0.3, drone: 0.35, water: 0.4 }, amb: ['#3c4246', 0.6], fog: ['#060707', 0.045],
  doors: [{ id: 'W', p: [-4, -0.5], type: 'wood', to: ['wcorr', 'E'] }, { id: 'S', p: [2.6, 3.5], type: 'iron', to: ['cellar', 'N'], fx: 'stairsdown', lock: { key: 'base', msg: '地下へ降りる扉。錆びた大きな錠前がかかっている。' } }],
  wins: [{ p: [-1.5, -3.5], w: 1.2, y: 1.3, h: 1.2 }],
  props: [
    { k: 'stove', x: 1.6, z: -3.1, r: 0 }, { k: 'prep', x: -0.2, z: 0.3, L: 2.2 }, { k: 'pots', x: -0.2, z: 0.3 },
    { k: 'sink', x: 3.65, z: -1.0, r: 3 }, { k: 'shelf', x: 3.78, z: 1.6, r: 3, L: 1.4, t: '食料の棚。缶詰の中身が、どれも膨らんでいる。' },
    { k: 'shelf', x: -3.78, z: -2.3, r: 1, L: 1.2 }, { k: 'barrel', x: -3.3, z: 2.9 }, { k: 'barrel', x: -2.6, z: 3.0, t: '樽に、塩漬けの何かが入っている。' },
    { k: 'blood', x: 0.9, z: 1.7, s: 1.6 }, { k: 'blood', x: -2.2, z: 2.2, s: 1.3 },
    { k: 'cagelamp', x: -0.2, z: -3.45, r: 0, y: 2.6, i: 3.5, c: '#d8e0ff', fl: 0.3 }, { k: 'bulb', x: 0.4, z: 0.6, y: 3.3, i: 7, c: '#f0f2ff', fl: 0.12 },
  ],
  build(c) { const b = makeCorpse('servant', 'back'); b.position.set(-2.3, 0, 2.35); b.rotation.y = -0.4; c.add(b); c.look(-2.3, 2.3, 0.9, '女中の亡骸。前掛けに「ヨネ」と刺繍がある。'); c.R.dyn.horse = null; },
  acts: [{ p: [1.25, -2.5], r: 0.85, id: 'oven' }],
  items: [{ id: 'hg_ammo', n: 15, x: 3.6, z: 1.6, y: 1.12, key: 'kit_ammo' }, { id: 'file', file: 'cook', x: 0.3, z: 0.45, y: 0.93, key: 'f_cook' }],
  cams: [
    { p: [3.65, 3.05, 3.2], t: [-1.9, 0.4, -1.4], fov: 58, z: [-4, -3.5, 0.6, 3.5] },
    { p: [-3.65, 3.05, 3.2], t: [2.0, 0.5, -1.9], fov: 58, z: [0.6, -3.5, 4, 3.5] },
  ],
  enemies: [{ t: 'zombie', k: 'cook', x: -1.6, z: 1.85, r: -2.2, key: 'kit_z1', st: 'eat' }, { t: 'zombie', k: 'servant', x: 2.0, z: 0.8, r: 1.2, key: 'kit_z2', st: 'lie' }],
};
ROOMS.ecorr = {
  name: '1階 東廊下', fl: '1F', map: [32, 4, 3, 18], w: 2.6, d: 18, h: 3.2,
  floor: 'parquet', wall: 'paper_cream', wain: 'wainscot', wainH: 1.1, ceil: 'plaster', rev: 0.35,
  ambience: { rain: 0.1, drone: 0.4 }, amb: ['#40362c', 0.42], fog: ['#080605', 0.05],
  doors: [
    { id: 'W', p: [-1.3, 6], type: 'double', to: ['hall', 'E'] },
    { id: 'E', p: [1.3, 2.5], type: 'wood', to: ['study', 'W'], lock: { key: 'hawk' } },
    { id: 'N', p: [0, -9], type: 'glass', w: 1.7, to: ['green', 'S'], lock: { key: 'wolf' } },
  ],
  props: [
    { k: 'runner', x: 0, z: 0, L: 17, w: 1.2 },
    { k: 'sconce', x: -1.27, z: 1.5, r: 1, i: 2.2 }, { k: 'sconce', x: 1.27, z: -4.5, r: 3, i: 2.2 }, { k: 'sconce', x: -1.27, z: -7.5, r: 1, i: 1.6, fl: 0.3 },
    { k: 'painting', x: 1.27, z: 6.2, r: 3, tex: 'pt_p1', w: 0.7, h: 0.9, t: '二代当主、鷲尾重光の肖像。' },
    { k: 'painting', x: -1.27, z: -2.4, r: 1, tex: 'pt_land1', w: 1.0, h: 0.7, t: '湖の絵。水面に、描かれていないはずの人影が映っている……ように見える。' },
    { k: 'bust', x: -0.95, z: -5.2, r: 1, t: '胸像。台座に「宗一郎」とある。この家の初代だろう。' },
    { k: 'vase', x: 0.95, z: -7.6 },
    { k: 'sideboard', x: -0.95, z: 3.6, r: 1, L: 1.4, t: '飾り棚。' },
  ],
  acts: [{ p: [-0.6, 3.6], r: 0.9, id: 'ecorr_cab' }],
  cams: [
    { p: [0.95, 2.8, 8.6], t: [-0.2, 0.9, -1.4], fov: 52, z: [-1.3, -0.6, 1.3, 9] },
    { p: [-0.95, 2.8, -8.6], t: [0.2, 0.9, 1.4], fov: 52, z: [-1.3, -9, 1.3, -0.6] },
  ],
  enemies: [
    { t: 'zombie', k: 'butler', x: 0.25, z: -3.2, r: 0.5, key: 'ec_z1', st: 'lie' },
    { t: 'zombie', k: 'servant', x: -0.3, z: 7.8, r: PI, key: 'ec_z2', cond: 'f:shotgun', alert: true },
    { t: 'zombie', k: 'cook', x: 0.4, z: 8.4, r: PI, key: 'ec_z3', cond: 'f:shotgun', alert: true },
  ],
};
ROOMS.study = {
  name: '書斎', fl: '1F', map: [35, 9, 7, 7], w: 7, d: 7, h: 3.4,
  floor: 'parquet_d', wall: 'paper_green', wain: 'wainscot', wainH: 1.1, ceil: 'ceil', rev: 0.2,
  ambience: { rain: 0.4, clock: 0, drone: 0.25 }, amb: ['#363c32', 0.56], fog: ['#060705', 0.035], lights: [{ p: [2.8, 2.1, -0.6], c: '#8aa0d0', i: 3.2, d: 7 }],
  doors: [{ id: 'W', p: [-3.5, 1], type: 'wood', to: ['ecorr', 'E'], lock: { key: 'hawk' } }],
  wins: [{ p: [3.5, -0.6], w: 1.3, y: 1.0, h: 2.0 }],
  props: [
    { k: 'rug', x: 0, z: 0.3, w: 3.6, d: 2.6 },
    { k: 'desk', x: 0.3, z: -1.5, r: 0, L: 1.7, lamp: true, t: '男爵の机。インク壺の蓋が開いたまま、乾いている。' }, { k: 'chair', x: 0.3, z: -2.35, r: 0, t: null },
    { k: 'bookshelf', x: -1.6, z: -3.28, r: 0, L: 2.6, h: 2.6 }, { k: 'bookshelf', x: 3.28, z: 2.1, r: 3, L: 2.0, h: 2.6, t: '医学の本が多い。「蘇生」と題された独逸語の本に、栞が挟まっている。' },
    { k: 'gun_cabinet', x: 1.2, z: 3.26, r: 2 },
    { k: 'trophy', x: -3.46, z: -1.6, r: 1 }, { k: 'globe', x: -2.5, z: 2.5 }, { k: 'armchair', x: -2.3, z: -0.5, r: 1 },
  ],
  acts: [{ p: [1.2, 2.55], r: 0.95, id: 'cabinet', items: ['key_hunt'] }, { p: [0.9, -0.85], r: 0.7, id: 'desk_drawer' }],
  items: [{ id: 'file', file: 'baron', x: -0.1, z: -1.45, y: 0.8, key: 'f_baron' }],
  cams: [
    { p: [3.2, 3.05, 3.2], t: [-1.6, 0.5, -1.7], fov: 58, z: [-3.5, -3.5, 3.5, 0.2] },
    { p: [-3.2, 3.05, -3.2], t: [1.6, 0.6, 1.9], fov: 58, z: [-3.5, 0.2, 3.5, 3.5] },
  ],
};
ROOMS.green = {
  name: '温室', fl: '1F', map: [29, -10, 10, 12], w: 10, d: 12, h: 4.6,
  floor: 'stone', wall: 'col', wain: 'brick', wainH: 0.8, ceil: false, crown: false, rail: false, step: 'stone', rev: 0.3, thunder: true,
  ambience: { rainOut: 0.9, drone: 0.2, water: 0.4 }, amb: ['#33424a', 0.55], hemi: ['#6a8aa8', '#202818', 0.5], fog: ['#0b1216', 0.04],
  doors: [{ id: 'S', p: [0, 6], type: 'glass', w: 1.7, to: ['ecorr', 'N'], lock: { key: 'wolf' } }],
  props: [
    { k: 'fountain', x: 0, z: -0.6 },
    { k: 'bed_soil', x: -3, z: 3, w: 2.4, d: 1.2 }, { k: 'bed_soil', x: 3, z: 3, w: 2.4, d: 1.2, t: '花壇。土の中から、白いものがのぞいている。……骨だ。' }, { k: 'bed_soil', x: -3, z: -3.6, w: 2.4, d: 1.2 }, { k: 'bed_soil', x: 3, z: -3.6, w: 2.4, d: 1.2 },
    { k: 'palm', x: -4.1, z: -5.0 }, { k: 'palm', x: 4.1, z: -5.0, h: 3.0 }, { k: 'palm', x: -4.3, z: 0.6, h: 2.4 }, { k: 'palm', x: 4.3, z: 0.6, h: 2.8 },
    { k: 'fern', x: -3.0, z: 3.0, y: 0.38, s: 0.7, t: null }, { k: 'fern', x: 2.6, z: 3.0, y: 0.38, s: 0.7, t: null }, { k: 'fern', x: -3.3, z: -3.6, y: 0.38, s: 0.8, t: null }, { k: 'fern', x: 3.3, z: -3.5, y: 0.38, s: 0.8, t: null },
    { k: 'fern', x: -1.6, z: -5.3, s: 1.4 }, { k: 'fern', x: 1.7, z: -5.4, s: 1.5 }, { k: 'fern', x: -4.4, z: -2.0, s: 1.3, t: null }, { k: 'fern', x: 4.4, z: -2.6, s: 1.2, t: null }, { k: 'fern', x: -4.4, z: 3.6, s: 1.3, t: null }, { k: 'fern', x: 4.4, z: 4.6, s: 1.2, t: null }, { k: 'fern', x: -2.0, z: 5.3, s: 1.0, t: null }, { k: 'fern', x: 2.2, z: 5.3, s: 1.0, t: null }, { k: 'plant', x: 4.3, z: 2.5, s: 1.3 }, { k: 'plant', x: -4.3, z: -1.0, s: 1.2 },
    { k: 'bench', x: 0, z: 4.4, r: 2 }, { k: 'worktable', x: 3.9, z: -1.2, r: 3 },
    { k: 'blood', x: 0.6, z: 1.6, s: 1.2 },
  ],
  build(c) {
    const g = c.g, ir = M('iron'), glass = M('col', { c: '#8ab0b8', t: 0.16 }), H = 4.6;
    // 硝子の壁は wall:'col' の代わりに組む（枠と硝子）
    c.R.D._glass = true;
    for (const [x0, z0, x1, z1] of [[-5, -6, 5, -6], [-5, 6, 5, 6], [-5, -6, -5, 6], [5, -6, 5, 6]]) {
      const L = hyp(x1 - x0, z1 - z0), n = Math.round(L / 1.25);
      for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t); g.box(ir, x, H / 2, z, 0.07, H, 0.07); }
      g.box(ir, (x0 + x1) / 2, 2.4, (z0 + z1) / 2, abs(x1 - x0) + 0.07, 0.06, abs(z1 - z0) + 0.07);
    }
    for (let i = -4; i <= 4; i++) g.box(ir, i * 1.25, H + 0.6 - abs(i) * 0.12, 0, 0.06, 0.06, 12);
    for (const z of [-6, -3, 0, 3, 6]) { g.box(ir, -2.5, H + 0.3, z, 5.2, 0.05, 0.05); g.box(ir, 2.5, H + 0.3, z, 5.2, 0.05, 0.05); }
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 12.2), new THREE.MeshLambertMaterial({ color: '#8ab0b8', transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide })); roof.rotation.x = -PI / 2; roof.position.y = H + 0.3; c.add(roof);
    // 外：夜の庭（硝子越しに見える）
    const om = new THREE.MeshBasicMaterial({ map: T('night'), color: '#2e3848', fog: false }); c.R.wins.push({ outM: om, base: om.color.clone() });
    for (const [x, z, ry, w] of [[0, -9, 0, 26], [0, 9, PI, 26], [-8, 0, PI / 2, 26], [8, 0, -PI / 2, 26]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 14), om); p.position.set(x, 4, z); p.rotation.y = ry; c.add(p); }
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: T('nightsky'), color: '#3a4458', fog: false })); sky.rotation.x = PI / 2; sky.position.y = 11; c.add(sky);
  },
  items: [{ id: 'herb_g', x: -3.0, z: 3.0, y: 0.38, key: 'gr_h1' }, { id: 'herb_g', x: 3.2, z: -3.6, y: 0.38, key: 'gr_h2' }, { id: 'herb_r', x: -3.2, z: -3.5, y: 0.38, key: 'gr_h3' }, { id: 'file', file: 'gardener', x: 3.75, z: -1.0, y: 0.89, key: 'f_gardener' }],
  cams: [
    { p: [4.3, 3.9, 5.6], t: [-1.3, 0.6, -1.4], fov: 58, z: [-5, 0, 5, 6] },
    { p: [-4.3, 3.9, -5.6], t: [1.3, 0.6, 1.6], fov: 58, z: [-5, -6, 5, 0] },
    { id: 'brute', p: [-1.4, 1.1, 1.4], t: [0.2, 1.9, -4.4], fov: 50, event: true },
  ],
  enemies: [{ t: 'brute', x: 0.2, z: -5.0, r: 0, key: 'brute', st: 'idle', sense: 0 }],
};

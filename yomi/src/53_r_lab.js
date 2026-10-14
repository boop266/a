// 黄泉還：地下研究所
PROPS.synth = (c, o) => { place(c, o, 0.8, 0.4, 1.9, g => { const m = CL('#7a8a90'), d = CL('#2a3034'); g.box(m, 0, 0.6, 0, 1.6, 1.2, 0.8); g.box(d, 0, 1.25, -0.1, 1.6, 0.1, 0.6); g.box(m, 0, 1.6, -0.25, 1.4, 0.7, 0.3); g.plate(M('screen', { e: '#40ff90', em: true, ei: 0.8 }), -0.35, 1.65, -0.098, 0.45, 0.3, '+z'); for (const x of [0.25, 0.55]) { g.cyl(CL('#c8d8d8', '#203030'), x, 1.3, 0.1, 0.07, 0.22, 8); g.box(d, x, 1.27, 0.1, 0.2, 0.04, 0.2); } g.box(CL('#c8a020', '#604010'), -0.6, 1.0, 0.405, 0.12, 0.08, 0.01, { no: '-z' }); }, { t: null }); c.act(o.x + (o.r === 2 ? 0 : 0), o.z + (o.r === 2 ? -0.75 : 0.75), 0.9, 'synth', { items: ['reagA', 'reagB'] }); };
PROPS.gurney = (c, o) => place(c, o, 0.4, 1.0, 0.9, g => { const m = W('metal'); g.box(m, 0, 0.8, 0, 0.7, 0.05, 1.9); g.box(W('linen'), 0, 0.85, 0.1, 0.66, 0.06, 1.6); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(m, sx * 0.3, 0.4, sz * 0.85, 0.04, 0.8, 0.04); g.box(M('blood', { at: 0.3 }), 0, 0.89, 0.2, 0.6, 0.002, 0.9); }, { t: o.t || 'ストレッチャー。拘束具が、引きちぎられている。' });
PROPS.alarmlamp = (c, o) => { const y = o.y || 2.7; c.g.box(M('iron'), o.x, y, o.z, 0.16, 0.06, 0.16); const grp = new THREE.Group(); grp.position.set(o.x, y - 0.12, o.z); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8), new THREE.MeshBasicMaterial({ color: '#ff2a1a' })); grp.add(m); const L = new THREE.SpotLight('#ff3020', 0, 9, 0.5, 0.6, 1.4); L.position.set(0, 0, 0); L.target.position.set(1, -0.6, 0); grp.add(L); grp.add(L.target); c.add(grp); c.R.dyn.alarms = c.R.dyn.alarms || []; c.R.dyn.alarms.push({ grp, L, m }); c.anim(t => { const on = !o.flag || flag(o.flag); grp.visible = true; L.intensity = on ? 22 : 0; m.material.color.set(on ? '#ff2a1a' : '#401010'); grp.rotation.y = on ? t * 4 : 0; }); };
PROPS.extinguisher = (c, o) => place(c, o, 0.12, 0.12, 0.7, g => { g.cyl(CL('#b01a14'), 0, 0.05, 0, 0.09, 0.55, 8); g.cyl(CL('#202020'), 0, 0.6, 0, 0.04, 0.1, 6); }, { t: o.t || '消火器。' });
ROOMS.lab_sec = {
  name: '警備室', fl: 'LAB', map: [0, 14, 6, 6], w: 6, d: 6, h: 3.0, save: true,
  floor: 'labfloor', wall: 'labwall', ceil: 'plaster', trim: 'metal', step: 'tile', music: 'save', rev: 0.15,
  ambience: { hum: 0.5, buzz: 0.5, drone: 0 }, amb: ['#4a5056', 0.6], fog: ['#050608', 0.03],
  doors: [{ id: 'S', p: [0, 3], type: 'elev', to: ['tunnel', 'N'], fx: 'elev' }, { id: 'E', p: [3, 0.6], type: 'lab', to: ['lab_corr', 'W1'] }],
  props: [
    { k: 'console', x: 0.2, z: -2.58, r: 0, L: 3.6, t: '監視用の画面が並んでいる。どの画面にも、誰もいない廊下が映っている。\n……ひとつだけ、画面の前を何かが横切った。' },
    { k: 'typewriter', x: -2.42, z: -0.5, r: 1 }, { k: 'itembox', x: 2.45, z: 2.25, r: 3 }, { k: 'locker', x: 2.75, z: -1.0, r: 3, n: 2 },
    { k: 'chair', x: 0.2, z: -1.6, r: 2, t: null }, { k: 'fluor', x: 0, z: 0, y: 2.95, i: 6 }, { k: 'extinguisher', x: -2.8, z: 2.6 },
  ],
  items: [{ id: 'ribbon', n: 2, x: -2.5, z: -0.05, y: 0.75, key: 'ls_rib' }, { id: 'hg_ammo', n: 15, x: 2.75, z: -1.0, y: 1.92, key: 'ls_ammo' }, { id: 'file', file: 'guard', x: -0.6, z: -2.35, y: 1.06, key: 'f_guard' }, { id: 'map', map: 'LAB', x: 1.0, z: -2.35, y: 1.06, key: 'maplab' }],
  cams: [{ p: [2.6, 2.6, 2.6], t: [-1.2, 0.5, -1.3], fov: 64, z: [-3, -3, 0.8, 3] }, { p: [-2.6, 2.6, 2.6], t: [1.3, 0.5, -1.2], fov: 64, z: [0.8, -3, 3, 3] }],
};
ROOMS.lab_corr = {
  name: '研究所 廊下', fl: 'LAB', map: [6, -4, 3, 20], w: 3, d: 20, h: 3.0,
  floor: 'labfloor', wall: 'labwall', ceil: 'plaster', trim: 'metal', step: 'tile', rev: 0.45, music: 'dread',
  ambience: { hum: 0.7, buzz: 0.8, drone: 0.4 }, amb: ['#3a4246', 0.5], fog: ['#040506', 0.05],
  doors: [
    { id: 'W1', p: [-1.5, 8], type: 'lab', to: ['lab_sec', 'E'] }, { id: 'E1', p: [1.5, 5], type: 'lab', to: ['lab_res', 'W'] },
    { id: 'W2', p: [-1.5, -1], type: 'lab', to: ['lab_cult', 'E'] }, { id: 'E2', p: [1.5, -4], type: 'lab', to: ['lab_cell', 'W'], lock: { key: 'id' } },
    { id: 'N', p: [0, -10], type: 'lab', w: 1.6, to: ['lab_core', 'S'], lock: { flag: 'f:password', msg: '分厚い隔壁だ。横に、合言葉を打ち込む端末がある。' } },
  ],
  props: [
    { k: 'fluor', x: 0, z: 7, y: 2.95, i: 5 }, { k: 'fluor', x: 0, z: 1.5, y: 2.95, i: 4.5, fl: 0.6, id: 'flick' }, { k: 'fluor', x: 0, z: -4.5, y: 2.95, i: 4.5 }, { k: 'fluor', x: 0, z: -8.6, y: 2.95, i: 3.5, c: '#ffd8d0' },
    { k: 'gurney', x: -0.85, z: 3.0, r: 0 }, { k: 'extinguisher', x: 1.3, z: 8.8 },
    { k: 'wallblood', x: -1.47, z: -5.5, r: 1, yc: 1.1, s: 1.2, t: '壁に、四本の深い爪の跡。人の手でつけられるものではない。' },
    { k: 'blood', x: 0.3, z: -6.4, s: 1.4 }, { k: 'blood', x: -0.4, z: 1.0, s: 1.0, tex: 'smear', a: 1.57 },
    { k: 'crt', x: 0.9, z: -9.35, r: 0, t: null },
  ],
  acts: [{ p: [0.9, -8.75], r: 0.8, id: 'terminal' }],
  cams: [
    { p: [1.1, 2.6, 9.6], t: [-0.3, 0.7, 0.2], fov: 54, z: [-1.5, 1.5, 1.5, 10] },
    { p: [-1.1, 2.6, -9.6], t: [0.3, 0.7, -0.2], fov: 54, z: [-1.5, -10, 1.5, 1.5] },
  ],
  enemies: [
    { t: 'zombie', k: 'res', x: 0.5, z: 0.5, r: 0, key: 'lc_z1' }, { t: 'zombie', k: 'guard', x: -0.3, z: -7.4, r: 0.4, key: 'lc_z2', st: 'lie' },
    { t: 'hunter', x: 0.3, z: -7.8, r: 0, key: 'lc_h1', cond: 'f:hunters' }, { t: 'hunter', x: -0.2, z: 9.0, r: PI, key: 'lc_h2', cond: 'f:hunters&v:lab_cell' },
  ],
};
ROOMS.lab_res = {
  name: '研究室', fl: 'LAB', map: [9, -1, 8, 8], w: 8, d: 8, h: 3.0,
  floor: 'labfloor', wall: 'labwall', ceil: 'plaster', trim: 'metal', step: 'tile', rev: 0.3, music: 'dread',
  ambience: { hum: 0.6, buzz: 0.4, drone: 0.3 }, amb: ['#40484c', 0.55], fog: ['#040506', 0.04],
  doors: [{ id: 'W', p: [-4, 0], type: 'lab', to: ['lab_corr', 'E1'] }],
  props: [
    { k: 'labbench', x: 0.4, z: -1.0, L: 3.0 }, { k: 'labbench', x: 0.4, z: 1.8, L: 3.0, t: '実験台。顕微鏡をのぞくと、黒い糸のようなものが、まだ蠢いていた。' },
    { k: 'synth', x: 2.4, z: -3.55, r: 0 }, { k: 'crt', x: 3.45, z: 1.6, r: 3, t: '端末。「被験体　Y-01　覚醒度　97%」の文字が点滅している。' },
    { k: 'locker', x: -3.75, z: -2.6, r: 1, n: 3 }, { k: 'painting', x: -1.4, z: -3.96, tex: 'note', w: 1.6, h: 0.9, yc: 1.7, frame: 'metal', t: '白板。化学式と、「時間がない」という走り書き。' },
    { k: 'fluor', x: -1.2, z: 0, y: 2.95, i: 5 }, { k: 'fluor', x: 2.2, z: 0.5, y: 2.95, i: 4, fl: 0.2 }, { k: 'chair', x: 3.0, z: 1.6, r: 1, t: null },
  ],
  items: [{ id: 'reagB', x: 1.1, z: 1.8, y: 0.95, key: 'reagB' }, { id: 'file', file: 'research', x: -0.4, z: -1.0, y: 0.95, key: 'f_research' }, { id: 'file', file: 'kuga', x: 3.3, z: 1.2, y: 0.75, key: 'f_kuga' }, { id: 'spray', x: -3.7, z: -1.9, y: 1.92, key: 'res_spray' }, { id: 'hg_ammo', n: 15, x: -0.9, z: 1.9, y: 0.95, key: 'res_ammo' }],
  cams: [
    { p: [3.6, 2.7, 3.6], t: [-1.6, 0.5, -1.4], fov: 60, z: [-4, -4, 0.6, 4] },
    { p: [-3.6, 2.7, 3.6], t: [1.8, 0.5, -1.6], fov: 60, z: [0.6, -4, 4, 4] },
  ],
  enemies: [{ t: 'zombie', k: 'res', x: 3.0, z: 1.6, r: -PI / 2, key: 'lr_z1', st: 'sit' }, { t: 'zombie', k: 'res', x: -2.4, z: 2.6, r: 2.4, key: 'lr_z2' }],
};
ROOMS.lab_cult = {
  name: '培養室', fl: 'LAB', map: [-4, 0, 10, 8], w: 10, d: 8, h: 3.6,
  floor: 'labfloor', wall: 'labwall', ceil: 'plaster', trim: 'metal', step: 'tile', rev: 0.5, music: 'dread',
  ambience: { hum: 0.9, water: 0.5, drone: 0.5 }, amb: ['#2a3c38', 0.5], fog: ['#030605', 0.05],
  doors: [{ id: 'E', p: [5, 0], type: 'lab', to: ['lab_corr', 'W2'] }],
  props: [
    { k: 'tank', x: -3.3, z: -2.3, body: 'hunter', id: 't1', t: '培養槽。緑色の液の中で、何かが身を丸めている。爬虫類のような鱗。' },
    { k: 'tank', x: -1.0, z: -2.3, body: 'hunter', id: 't2', t: '培養槽。中の何かと、目が合った気がした。' },
    { k: 'tank', x: 1.3, z: -2.3, id: 't3', t: '空の培養槽。底に、剥がれた鱗が沈んでいる。' },
    { k: 'tank', x: -3.3, z: 2.3, body: 'hunter', id: 't4', light: false, t: '培養槽。液がわずかに濁っている。' },
    { k: 'tank', x: -1.0, z: 2.3, id: 't5', broken: true, light: false, t: '割れた培養槽。中は空っぽだ。' },
    { k: 'console', x: -4.5, z: 0, r: 1, L: 2.2, t: '培養槽の制御盤。「温度異常」の赤い表示が点滅している。' },
    { k: 'pipes', x: 0, z: -3.75, L: 9.6, n: 2, y: 3.0 }, { k: 'fluor', x: 2.6, z: 0, y: 3.5, i: 4, fl: 0.3 },
    { k: 'shelf', x: 3.8, z: -3.75, r: 0, L: 1.2, t: '薬品棚。ほとんどの瓶に「廃棄」の札。' },
    { k: 'blood', x: 2.0, z: 0.6, s: 1.2 },
  ],
  build(c) { const b = makeCorpse('res', 'back'); b.position.set(-3.4, 0, 0.6); b.rotation.y = 0.8; c.add(b); c.look(-3.4, 0.6, 1.0, () => G.taken.idcard ? '研究員の亡骸。胸の名札が外されている。' : '研究員の亡骸。名札には「久我」。\n首からさげたカードが、血に濡れている。'); },
  items: [{ id: 'idcard', x: -2.9, z: 0.9, key: 'idcard' }, { id: 'reagA', x: 3.7, z: -3.65, y: 1.12, key: 'reagA' }, { id: 'sg_ammo', n: 7, x: 3.6, z: 3.3, key: 'cult_sg' }],
  cams: [
    { p: [4.6, 3.2, 3.6], t: [-2.2, 0.8, -1.2], fov: 60, z: [-5, -4, 1.2, 4] },
    { p: [-0.6, 3.3, 3.75], t: [3.6, 0.6, -1.4], fov: 58, z: [1.2, -4, 5, 4] },
    { id: 'tank', p: [0.6, 1.5, 0.4], t: [-1.0, 1.3, -2.3], fov: 50, event: true },
  ],
  enemies: [{ t: 'hunter', x: -1.0, z: -2.3, r: 0, key: 'cult_h1', hidden: true, st: 'idle' }],
};
ROOMS.lab_cell = {
  name: '隔離房', fl: 'LAB', map: [9, -9, 8, 6], w: 8, d: 6, h: 3.0,
  floor: 'labfloor', wall: 'labwall', ceil: 'plaster', trim: 'metal', step: 'tile', rev: 0.3, music: '',
  ambience: { hum: 0.6, drone: 0.4 }, amb: ['#3a3236', 0.42], fog: ['#060304', 0.04],
  doors: [{ id: 'W', p: [-4, 0.8], type: 'lab', to: ['lab_corr', 'E2'], lock: { key: 'id' } }],
  props: [
    { k: 'bars', x: -2.67, z: -1.02, L: 2.6 }, { k: 'bars', x: 2.67, z: -1.02, L: 2.6 }, { k: 'bars', x: -1.33, z: -2.0, L: 2.0, r: 1 }, { k: 'bars', x: 1.33, z: -2.0, L: 2.0, r: 1 },
    { k: 'cot', x: -2.7, z: -2.45, r: 1, t: '独房の寝台。' }, { k: 'cot', x: 2.7, z: -2.45, r: 1, t: '独房の寝台。壁に、爪で数を刻んだ跡がある。' },
    { k: 'crt', x: 2.9, z: 2.25, r: 2, red: true, t: '監視端末。「隔離区画　封鎖中」。' }, { k: 'alarmlamp', x: 0, z: 2.6, y: 2.9 },
    { k: 'fluor', x: -2.5, z: 1.4, y: 2.95, i: 3, fl: 0.5 },
  ],
  build(c) { const b = makeCorpse('guard', 'sit'); b.position.set(1.9, 0, 2.55); b.rotation.y = PI; c.add(b); c.look(1.9, 2.3, 1.0, '警備員の亡骸。壁にもたれて座りこんでいる。\n自分で、自分の頭を撃ったらしい。'); },
  acts: [{ p: [0, -1.55], r: 1.1, id: 'hayase', items: ['serum'] }],
  items: [{ id: 'mg', x: 1.4, z: 2.1, key: 'magnum' }, { id: 'mg_ammo', n: 6, x: 2.4, z: 1.7, key: 'mg_a1' }, { id: 'herb_g', x: -3.3, z: 2.4, key: 'cell_h1' }],
  cams: [{ p: [3.6, 2.6, 2.6], t: [-1.0, 0.7, -1.6], fov: 62, z: [-4, -3, 0.5, 3] }, { p: [-3.6, 2.6, 2.6], t: [1.0, 0.7, -1.6], fov: 62, z: [0.5, -3, 4, 3] }, { id: 'haya', p: [0.9, 1.3, 0.2], t: [0, 0.8, -2.2], fov: 46, event: true }],
  enemies: [{ t: 'zombie', k: 'res', x: -2.6, z: -1.8, r: 0, key: 'cell_z1', sense: 6 }],
};
ROOMS.lab_core = {
  name: '最深部', fl: 'LAB', map: [3, -24, 12, 14], w: 12, d: 14, h: 6.0,
  floor: 'grate', wall: 'metal', ceil: 'concrete', trim: 'iron', base: false, crown: false, step: 'metal', rev: 0.7, music: 'dread',
  ambience: { hum: 1, drone: 0.6, water: 0.3 }, amb: ['#26343c', 0.5], fog: ['#030507', 0.045],
  doors: [
    { id: 'S', p: [0, 7], type: 'lab', w: 1.6, to: ['lab_corr', 'N'] },
    { id: 'E', p: [6, -4.2], type: 'elev', to: ['lab_exit', 'S'], lock: { flag: 'f:boss1', msg: '搬出用の大型昇降機。\n「緊急時以外の使用を禁ず」とある。電源が来ていない。' } },
  ],
  props: [
    { k: 'console', x: -4.4, z: -5.8, r: 0, L: 2.6, t: '制御盤。「Y-01　生命反応：あり」。' }, { k: 'console', x: 3.0, z: 1.6, r: 3, L: 2.2, t: null },
    { k: 'server', x: -5.4, z: 1.0, r: 1 }, { k: 'server', x: -5.4, z: 2.2, r: 1 }, { k: 'server', x: -5.4, z: 3.4, r: 1 },
    { k: 'pipes', x: 0, z: -6.75, L: 11.6, n: 3, y: 4.6 }, { k: 'pipes', x: 5.75, z: 2.0, L: 9, n: 2, r: 1, y: 4.0 },
    { k: 'alarmlamp', x: -3, z: 6.6, y: 5.0, flag: 'alarm' }, { k: 'alarmlamp', x: 3, z: 6.6, y: 5.0, flag: 'alarm' }, { k: 'alarmlamp', x: 5.6, z: -6.6, y: 5.0, flag: 'alarm' },
    { k: 'drum', x: 4.6, z: 5.6 }, { k: 'drum', x: 5.2, z: 5.0, col: '#3a4a3a' }, { k: 'crate', x: -4.8, z: 5.6, s: 1.0 },
  ],
  build(c) {
    const g = c.g, m = M('metal'), ir = M('iron');
    // 大きな水槽（ヨミが眠る）
    g.cyl(m, 0, 0, -2.6, 2.0, 0.6, 16); g.cyl(m, 0, 5.2, -2.6, 2.0, 0.8, 16); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.box(m, Math.sin(a) * 1.9, 2.9, -2.6 + Math.cos(a) * 1.9, 0.1, 4.6, 0.1); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.cylX(ir, 0, 5.8, -2.6, 0.1, 0.1, 5); g.box(ir, Math.sin(a) * 1.0, 5.9, -2.6 + Math.cos(a) * 1.0, 0.12, 0.3, 0.12); }
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 4.6, 16, 1, true), new THREE.MeshBasicMaterial({ map: T('liquid'), color: '#6ad8ff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); liq.position.set(0, 2.9, -2.6); c.add(liq);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.88, 1.88, 4.6, 16, 1, true), new THREE.MeshLambertMaterial({ color: '#c8f0ff', transparent: true, opacity: 0.16, depthWrite: false })); glass.position.copy(liq.position); c.add(glass);
    const body = makeSpecimen('boss'); body.position.set(0, 1.4, -2.6); body.scale.setScalar(1.1); c.add(body); c.anim(t => { if (body.visible) body.position.y = 1.4 + Math.sin(t * 0.5) * 0.08; });
    const L = c.light({ p: [0, 2.6, -0.4], c: '#60c8ff', i: 10, d: 10, fl: 0.04 });
    c.R.dyn.core = { liq, glass, body, L };
    c.block([-2.1, -4.7, 2.1, -0.5], 0, { tall: true });
    if (flag('boss1')) { liq.visible = false; glass.visible = false; body.visible = false; L.base = 2; }
  },
  acts: [{ p: [2.3, 1.6], r: 0.95, id: 'core_term' }],
  looks: [{ p: [0, -0.2], r: 1.2, t: () => flag('boss1') ? '水槽は砕け散っている。' : '巨大な水槽。中に浮かぶ白い巨体は、人の形をしている。\n胸に、古い軍服の切れ端が貼りついている。' }],
  cams: [
    { p: [5.4, 4.6, 6.4], t: [-1.2, 1.2, -1.8], fov: 60, z: [-6, -7, 0, 7] },
    { p: [-5.4, 4.6, 6.4], t: [1.2, 1.2, -1.8], fov: 60, z: [0, -7, 6, 7] },
    { id: 'boss', p: [0.6, 1.4, 2.4], t: [0, 2.6, -2.6], fov: 58, event: true },
  ],
  enemies: [{ t: 'boss1', x: 0, z: -0.2, r: 0, key: 'boss1', hidden: true, st: 'idle' }],
};
ROOMS.lab_exit = {
  name: '搬出路', fl: 'LAB', map: [15, -30, 3, 26], w: 3, d: 28, h: 3.4,
  floor: 'grate', wall: 'metal', ceil: 'concrete', trim: 'iron', base: false, crown: false, step: 'metal', rev: 0.6, music: 'escape',
  ambience: { hum: 0.6, alarm: 1, drone: 0.2 }, amb: ['#3a2a2a', 0.5], fog: ['#060303', 0.05],
  doors: [{ id: 'S', p: [0, 14], type: 'elev', lock: { story: '昇降機は、もう動かない。前へ進むしかない。' } }, { id: 'N', p: [0, -14], type: 'elev', to: ['heliport', 'S'], fx: 'elev' }],
  props: [
    { k: 'alarmlamp', x: 1.45, z: 9, y: 2.9 }, { k: 'alarmlamp', x: -1.45, z: 1, y: 2.9 }, { k: 'alarmlamp', x: 1.45, z: -7, y: 2.9 },
    { k: 'pipes', x: -1.35, z: 0, L: 27.6, n: 3, r: 1, y: 2.6 },
    { k: 'crate', x: -0.9, z: 6.0, s: 1.0 }, { k: 'crate', x: 0.8, z: 1.4, s: 1.1 }, { k: 'drum', x: -1.0, z: -2.6 }, { k: 'drum', x: -0.4, z: -3.0 }, { k: 'crate', x: 0.85, z: -8.5, s: 1.0 },
    { k: 'fluor', x: 0, z: 11, y: 3.3, i: 3, fl: 0.5 }, { k: 'fluor', x: 0, z: -11, y: 3.3, i: 3, fl: 0.5 },
  ],
  cams: [
    { p: [1.1, 2.9, 13.6], t: [-0.2, 0.6, 2], fov: 54, z: [-1.5, 0, 1.5, 14] },
    { p: [-1.1, 2.9, -13.6], t: [0.2, 0.6, -2], fov: 54, z: [-1.5, -14, 1.5, 0] },
  ],
  enemies: [{ t: 'hunter', x: 0.4, z: -4.6, r: 0, key: 'ex_h1', alert: true }, { t: 'hunter', x: -0.3, z: -11.6, r: 0, key: 'ex_h2' }],
};

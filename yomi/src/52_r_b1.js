// 黄泉還：地下
ROOMS.cellar = {
  name: '地下貯蔵庫', fl: 'B1', map: [12, 8, 8, 10], w: 8, d: 10, h: 3.0,
  floor: 'stone', wall: 'stone', ceil: 'stone', trim: 'stone', base: false, crown: false, step: 'stone', rev: 0.6, music: 'dread',
  ambience: { drone: 0.5, water: 0.7 }, amb: ['#2a2620', 0.42], fog: ['#040302', 0.06],
  doors: [{ id: 'N', p: [2.6, -5], type: 'iron', to: ['kitchen', 'S'], fx: 'stairs' }, { id: 'E', p: [4, 2.6], type: 'iron', to: ['boiler', 'W'] }],
  props: [
    { k: 'winerack', x: -3.68, z: -2.4, r: 1, L: 2.8 }, { k: 'winerack', x: -3.68, z: 1.6, r: 1, L: 2.8, t: '葡萄酒の棚。何本かの瓶が割れて、床が赤黒く濡れている。' },
    { k: 'barrel', x: 2.6, z: 4.2 }, { k: 'barrel', x: 3.3, z: 3.6 }, { k: 'barrel', x: -2.6, z: 4.3, t: '樽の蓋が、内側から押し上げられたように歪んでいる。' },
    { k: 'crate', x: 1.0, z: -4.2, s: 0.9 }, { k: 'crate', x: -0.2, z: -4.3, s: 0.8 }, { k: 'crate', x: 3.3, z: -1.2, s: 0.8, t: '木箱。中には藁が詰まっているだけだ。' },
    { k: 'shelf', x: 3.75, z: 0.6, r: 3, L: 1.2, t: '古い缶詰と、蝋燭の束。' },
    { k: 'blood', x: 0.4, z: 0.8, s: 1.6 }, { k: 'blood', x: -1.4, z: -1.6, s: 1.0, tex: 'smear', a: 2 },
  ],
  build(c) { // 揺れる裸電球
    const grp = new THREE.Group(); grp.position.set(0.2, 2.98, 0); const cord = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.6, 0.01), M('iron')); cord.position.y = -0.3; grp.add(cord);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); bulb.position.y = -0.62; grp.add(bulb);
    const L = new THREE.PointLight('#ffd090', 6, 8, 1.6); L.position.y = -0.7; grp.add(L); c.add(grp);
    c.anim(t => { grp.rotation.z = Math.sin(t * 1.3) * 0.22; grp.rotation.x = Math.sin(t * 0.9) * 0.12; L.intensity = 6 * (Math.sin(t * 23) > 0.96 ? 0.3 : 1); });
  },
  looks: [{ p: [0, -4.6], r: 1.0, t: '天井の隅に、大きな蜘蛛の巣。巣にかかっているのは……鼠ではない。もっと大きな何かだ。' }],
  items: [{ id: 'handle', x: 1.0, z: -4.2, y: 0.92, key: 'handle' }, { id: 'herb_b', x: -3.2, z: 4.4, key: 'cel_hb1' }, { id: 'herb_b', x: 3.4, z: -3.6, key: 'cel_hb2' }, { id: 'hg_ammo', n: 15, x: 3.6, z: 0.6, y: 0.62, key: 'cel_ammo' }],
  cams: [
    { p: [3.6, 2.6, 4.6], t: [-1.6, 0.3, -2.2], fov: 60, z: [-4, 0, 4, 5] },
    { p: [-3.6, 2.6, -4.6], t: [1.6, 0.3, 2.3], fov: 60, z: [-4, -5, 4, 0] },
  ],
  enemies: [{ t: 'spider', x: 0.6, z: 1.8, r: PI, key: 'cel_s1' }, { t: 'spider', x: -1.4, z: -2.6, r: 0.5, key: 'cel_s2' }],
};
ROOMS.boiler = {
  name: 'ボイラー室', fl: 'B1', map: [20, 8, 10, 8], w: 10, d: 8, h: 4.0,
  floor: 'concrete', wall: 'brick', ceil: 'concrete', trim: 'iron', base: false, crown: false, step: 'concrete', rev: 0.5, music: 'dread',
  ambience: { boiler: 1, drone: 0.3, water: 0.3 }, amb: ['#3a2a20', 0.5], fog: ['#050302', 0.05],
  doors: [
    { id: 'W', p: [-5, 2.6], type: 'iron', to: ['cellar', 'E'] }, { id: 'N', p: [2.6, -4], type: 'wood', to: ['keeper', 'S'] },
    { id: 'E', p: [5, -1.2], type: 'iron', to: ['tunnel', 'S'], lock: { flag: 'f:valve', msg: '扉の隙間から、熱い蒸気が噴き出している。\nとても通れない。' } },
  ],
  props: [
    { k: 'boiler', x: -1.0, z: -1.8, r: 0 },
    { k: 'pipes', x: 0, z: -3.75, L: 9.6, n: 3, y: 2.9 }, { k: 'pipes', x: 4.8, z: 0, L: 7.6, n: 2, r: 1, y: 3.1 },
    { k: 'valve', x: 4.82, z: 1.4, r: 3 },
    { k: 'gauge', x: 4.97, z: 0.4, r: 3, yc: 1.7 }, { k: 'gauge', x: -4.97, z: -1.0, r: 1, yc: 1.6, t: '圧力計。針が、小刻みに震えている。' },
    { k: 'drum', x: -4.2, z: 3.2 }, { k: 'drum', x: -3.5, z: 3.5, col: '#3a4a3a' }, { k: 'crate', x: 3.8, z: 3.2, s: 0.9 },
    { k: 'worktable', x: 0.6, z: 3.4, r: 2, t: '作業台。錆びた工具が散らばっている。バルブの柄だけが見当たらない。' },
    { k: 'cagelamp', x: -2.5, z: 3.95, r: 2, y: 2.8, i: 3, c: '#ffc070' }, { k: 'cagelamp', x: 3.2, z: -3.95, r: 0, y: 2.8, i: 2.5, fl: 0.3 },
  ],
  build(c) { // 東の扉から噴き出す蒸気
    const mats = [], grp = new THREE.Group(); grp.position.set(4.6, 1.2, -1.2); c.add(grp);
    for (let i = 0; i < 6; i++) { const m = new THREE.MeshBasicMaterial({ map: T('puff'), color: '#e8e8e0', transparent: true, opacity: 0.18, depthWrite: false, fog: false }); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), m); p.position.set(-i * 0.25, (i % 3) * 0.3, (i % 2 - 0.5) * 0.4); p.rotation.y = PI / 2; grp.add(p); mats.push(p); }
    c.anim((t) => { const on = !flag('valve'); grp.visible = on; if (on) mats.forEach((p, i) => { p.position.x = -((t * 1.4 + i * 0.4) % 2.4); p.material.opacity = 0.25 * (1 - (-p.position.x) / 2.4); p.scale.setScalar(0.6 + (-p.position.x) * 0.5); }); });
    c.look(4.4, -1.2, 1.0, () => flag('valve') ? '蒸気は止まっている。扉の取っ手が、まだ温かい。' : '扉の隙間から、白い蒸気が音をたてて噴き出している。');
  },
  items: [{ id: 'hg_ammo', n: 10, x: 0.3, z: 3.4, y: 0.89, key: 'boi_ammo' }, { id: 'herb_g', x: -4.3, z: -3.4, key: 'boi_h1' }],
  cams: [
    { p: [4.6, 3.6, 3.6], t: [-2.0, 0.6, -1.4], fov: 60, z: [-5, -4, 0.8, 4] },
    { p: [-4.6, 3.6, 3.6], t: [2.6, 0.6, -1.4], fov: 60, z: [0.8, -4, 5, 4] },
  ],
  enemies: [{ t: 'zombie', k: 'worker', x: 2.2, z: 2.4, r: 2.4, key: 'boi_z1' }, { t: 'zombie', k: 'worker', x: -3.6, z: 1.4, r: 1.2, key: 'boi_z2', st: 'sit' }],
};
ROOMS.keeper = {
  name: '管理人室', fl: 'B1', map: [22, 3, 5, 4], w: 4.4, d: 4.0, h: 2.8, save: true,
  floor: 'parquet', wall: 'plaster', wain: 'wainscot', wainH: 1.0, ceil: 'plaster', music: 'save', rev: 0.12,
  ambience: { boiler: 0.25, drone: 0 }, amb: ['#5a4a38', 0.58], fog: ['#080604', 0.03],
  doors: [{ id: 'S', p: [0.4, 2], type: 'wood', to: ['boiler', 'N'] }],
  props: [
    { k: 'typewriter', x: 1.1, z: -1.68, r: 0 }, { k: 'itembox', x: -1.82, z: 0.3, r: 1 },
    { k: 'cot', x: -1.5, z: -0.9, r: 1, t: '管理人の寝床。湯たんぽが、まだほんのり温かい。' },
    { k: 'shelf', x: 1.75, z: 1.65, r: 2, L: 0.9, t: '棚に、古いラジオ。つまみを回しても、雑音しか聞こえない。' },
    { k: 'bulb', x: 0.2, z: 0, y: 2.8, i: 4.2, c: '#ffd8a0' },
    { k: 'painting', x: -1.0, z: -1.97, r: 0, tex: 'note', w: 0.4, h: 0.55, yc: 1.6, frame: 'wood', t: '壁の暦。昭和六十三年のまま、めくられていない。' },
  ],
  items: [{ id: 'ribbon', n: 2, x: 1.55, z: -1.62, y: 0.75, key: 'kp_rib' }, { id: 'map', map: 'B1', x: 0.6, z: -1.62, y: 0.75, key: 'mapb1' }, { id: 'file', file: 'delivery', x: 1.75, z: 1.55, y: 0.62, key: 'f_delivery' }, { id: 'herb_g', x: -1.6, z: 1.6, key: 'kp_h1' }],
  cams: [{ p: [1.95, 2.4, 1.75], t: [-1.1, 0.45, -0.9], fov: 68 }],
};
ROOMS.tunnel = {
  name: '地下通路', fl: 'B1', map: [30, -8, 3, 24], rects: [[-1.4, -12, 1.4, 12]], h: 3.0,
  floor: 'concrete', wall: 'concrete', ceil: 'concrete', trim: 'iron', base: false, crown: false, step: 'concrete', rev: 0.7, music: 'dread',
  ambience: { water: 1, drone: 0.4, hum: 0.3 }, amb: ['#3a4242', 0.62], fog: ['#030405', 0.055],
  floors: [{ r: [-0.62, -12, 1.4, 12], y: 0 }],
  doors: [{ id: 'S', p: [0.4, 12], type: 'iron', to: ['boiler', 'E'] }, { id: 'N', p: [0.4, -12], type: 'elev', to: ['lab_sec', 'S'], fx: 'elev' }],
  props: [
    { k: 'cagelamp', x: 1.37, z: 9.0, r: 3, y: 2.4, i: 5 }, { k: 'cagelamp', x: 1.37, z: 3.0, r: 3, y: 2.4, i: 4.2, fl: 0.4 }, { k: 'cagelamp', x: 1.37, z: -3.0, r: 3, y: 2.4, i: 4.6 }, { k: 'cagelamp', x: 1.37, z: -9.0, r: 3, y: 2.4, i: 5, c: '#ff9070' },
    { k: 'pipes', x: 1.25, z: 0, L: 23.8, n: 2, r: 1, y: 2.5 },
    { k: 'blood', x: 0.5, z: -5.6, s: 1.3 }, { k: 'blood', x: 0.8, z: 6.0, s: 0.9, tex: 'smear', a: 1.6 },
    { k: 'crate', x: 0.95, z: -10.4, s: 0.7, t: '「神代製薬　培養液」の木箱。' },
  ],
  build(c) {
    const g = c.g; // 水路
    g.quad(M('concrete'), [-0.62, -0.5, -12], [-0.62, -0.5, 12], [-0.62, 0, 12], [-0.62, 0, -12], [[0, 0], [12, 0], [12, 0.25], [0, 0.25]]);
    g.quad(M('water', { e: '#061214' }), [-1.4, -0.42, 12], [-0.62, -0.42, 12], [-0.62, -0.42, -12], [-1.4, -0.42, -12], [[0, 0], [0.4, 0], [0.4, 12], [0, 12]]);
    g.box(M('iron'), -0.6, 0.03, 0, 0.06, 0.06, 24);
    const c2 = makeCorpse('res', 'front'); c2.position.set(0.9, 0, 7.6); c2.rotation.y = 0.4; c.add(c2); c.look(0.9, 7.6, 1.0, '白衣の亡骸。胸の名札は血で読めない。逃げる途中だったのだろう。');
  },
  looks: [{ p: [-0.3, 0], r: 1.2, t: '水路を、黒い水がゆっくり流れていく。ときどき、何か白いものが浮いて流れていく。' }],
  items: [{ id: 'sg_ammo', n: 7, x: 1.0, z: 7.2, key: 'tun_sg' }],
  cams: [
    { p: [1.1, 2.6, 11.6], t: [-0.1, 0.5, 1.0], fov: 52, z: [-1.4, 0.5, 1.4, 12] },
    { p: [-0.2, 2.6, -11.6], t: [0.4, 0.5, -1.0], fov: 52, z: [-1.4, -12, 1.4, 0.5] },
  ],
  enemies: [{ t: 'zombie', k: 'worker', x: 0.6, z: 4.0, r: 0, key: 'tun_z1' }, { t: 'zombie', k: 'res', x: 0.4, z: -2.6, r: PI, key: 'tun_z2', st: 'lie' }, { t: 'crawler', k: 'worker', x: 0.6, z: -8.0, r: 0, key: 'tun_c1' }],
};

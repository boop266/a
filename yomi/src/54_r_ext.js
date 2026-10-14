// 黄泉還：外（前庭・ヘリポート）
function addRain(c, x0, z0, x1, z1, n = 700, h = 9) {
  const pos = new Float32Array(n * 6), rr = mkRng(7);
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, rr()), z = lerp(z0, z1, rr()), y = rr() * h; pos.set([x, y, z, x + 0.05, y + 0.45, z + 0.02], i * 6); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#9fb0c8', transparent: true, opacity: 0.38, fog: false })); ls.frustumCulled = false; c.add(ls);
  c.anim((t, dt) => { const a = geo.attributes.position.array; for (let i = 0; i < n; i++) { let y = a[i * 6 + 1] - dt * 14; if (y < 0) y += h; a[i * 6 + 1] = y; a[i * 6 + 4] = y + 0.45; } geo.attributes.position.needsUpdate = true; });
}
function skyDome(c, tex, col, r = 70) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), new THREE.MeshBasicMaterial({ map: T(tex), color: col, side: THREE.BackSide, fog: false })); s.position.y = -5; c.add(s); return s; }
function treeLine(c, cx, cz, r0, r1, n, seed, col = '#081008', y0 = -0.5, a0 = 0, a1 = TAU) { const rr = mkRng(seed); for (let i = 0; i < n; i++) { const a = lerp(a0, a1, rr()), d = lerp(r0, r1, rr()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, h = 7 + rr() * 8; c.g.cyl(M('col', { c: col }), x, y0, z, 1.6 + rr() * 1.2, h, 6, { r2: 0.05 }); } }
// 洋館の正面（前庭から見える顔）
function mansionFront(c, z0, o = {}) {
  const g = c.g, wall = M('plaster'), st = M('stone'), wd = M('wood_d'), roof = M('col', { c: '#1c2026' }), lit = M('col', { c: '#ffcf80', e: '#d89a40', ei: 1.0 }), dark = M('night', { c: '#2a3040' });
  g.box(st, 0, 0.45, z0 - 4, 30, 0.9, 8, { no: '-y' }); g.box(wall, 0, 4.6, z0 - 4.2, 28, 7.6, 8, { no: '-y' });
  g.box(wd, 0, 8.45, z0 - 4.2, 28.6, 0.3, 8.6); // 軒
  // 屋根（寄棟の前面）
  g.quad(roof, [-14.3, 8.6, z0 + 0.1], [14.3, 8.6, z0 + 0.1], [10, 12.0, z0 - 4.2], [-10, 12.0, z0 - 4.2], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (const x of [-9, 7.5]) g.box(M('brick'), x, 12.2, z0 - 3.6, 1.0, 2.6, 1.0);
  // 窓（一階・二階）
  const wins = [-11, -8.2, -5.4, 5.4, 8.2, 11], litSet = o.lit || [1, 4, 7, 9];
  wins.forEach((x, i) => { for (const [y, h, k] of [[1.6, 2.2, i], [5.0, 2.0, i + 6]]) { const isLit = litSet.includes(k); g.box(wd, x, y + h / 2, z0 + 0.06, 1.5, h + 0.3, 0.14); g.plate(isLit ? lit : dark, x, y + h / 2, z0 + 0.14, 1.2, h, '+z'); g.box(wd, x, y + h / 2, z0 + 0.15, 0.06, h, 0.03); g.box(wd, x, y + h * 0.62, z0 + 0.15, 1.2, 0.05, 0.03); g.box(st, x, y - 0.08, z0 + 0.2, 1.7, 0.12, 0.3); } });
  // 玄関の張り出し：柱・破風・扉
  g.box(st, 0, 0.25, z0 + 1.8, 6.8, 0.5, 3.6); for (let k = 0; k < 3; k++) g.box(st, 0, 0.08 + k * 0.16, z0 + 3.75 + k * 0.3 - 0.3, 5.6, 0.16, 0.4);
  for (const x of [-2.6, -1.0, 1.0, 2.6]) { g.cyl(M('marble_w'), x, 0.5, z0 + 3.2, 0.22, 4.2, 8); g.box(M('marble_w'), x, 4.75, z0 + 3.2, 0.55, 0.2, 0.55); }
  g.box(wall, 0, 5.1, z0 + 1.8, 6.8, 0.5, 3.6); g.tri(roof, [-3.6, 5.35, z0 + 3.62], [3.6, 5.35, z0 + 3.62], [0, 7.2, z0 + 3.62], [[0, 0], [1, 0], [0.5, 1]]);
  g.box(wd, -0.6, 1.95, z0 + 0.1, 1.15, 2.9, 0.12); g.box(wd, 0.6, 1.95, z0 + 0.1, 1.15, 2.9, 0.12); g.box(M('brass'), -0.15, 1.6, z0 + 0.2, 0.05, 0.2, 0.04); g.box(M('brass'), 0.15, 1.6, z0 + 0.2, 0.05, 0.2, 0.04);
  g.plate(lit, 0, 3.75, z0 + 0.14, 2.2, 0.5, '+z'); // 扉の上の明かり窓
  if (!o.nolight) c.light({ p: [0, 4.6, z0 + 3.0], c: '#ffb860', i: 6, d: 9, fl: 0.15 });
}
ROOMS.yard = {
  name: '前庭', fl: 'EXT', cut: true, w: 20, d: 22, rects: [[-10, -6, 10, 16]], h: 20, noWalls: true, ceil: false, floor: 'gravel', step: 'stone', rev: 0.1, bg: '#05070a', thunder: true,
  ambience: { rainOut: 1, wind: 0.7, drone: 0.2 }, amb: ['#3a4250', 0.55], hemi: ['#5a6a88', '#141810', 0.4], fog: ['#080b10', 0.035],
  doors: [{ id: 'N', p: [0, -6], type: 'double', w: 2.2, to: ['hall', 'S'] }],
  build(c) {
    const g = c.g; skyDome(c, 'nightsky', '#5a6a88');
    g.quad(M('grass'), [-40, -0.02, 40], [40, -0.02, 40], [40, -0.02, -40], [-40, -0.02, -40], [[0, 0], [50, 0], [50, 50], [0, 50]]);
    mansionFront(c, -6);
    treeLine(c, 0, 2, 16, 34, 60, 3); for (const [x, z] of [[-8, 9], [8.5, 7], [-7, 2], [7.4, 1], [-9, 13], [9.6, 13]]) PROPS.tree(c, { x, z, h: 8 + (x * z % 3), noblock: false });
    for (const x of [-4, 4]) { g.cyl(M('iron'), x, 0, 6, 0.06, 3.2, 5); g.box(M('iron'), x, 3.2, 6, 0.3, 0.3, 0.3); g.ball(M('col', { c: '#ffe0a0', e: '#e0a040', ei: x > 0 ? 0.2 : 1 }), x, 3.1, 6, 0.14, 0.18, 0.14, 4); }
    c.light({ p: [-4, 2.9, 6], c: '#ffc070', i: 5, d: 9, fl: 0.2 });
    for (let x = -10; x <= 10; x += 0.5) if (abs(x) > 2) g.cyl(M('iron'), x, 0, 16, 0.03, 2.0, 4); g.box(M('iron'), -6, 1.9, 16, 8, 0.06, 0.06); g.box(M('iron'), 6, 1.9, 16, 8, 0.06, 0.06);
    addRain(c, -12, -6, 12, 18);
  },
  cams: [{ p: [3.5, 1.6, 13], t: [0, 3.5, -6], fov: 55 }],
};
ROOMS.heliport = {
  name: 'ヘリポート', fl: 'LAB', map: [12, -46, 16, 16], w: 18, d: 18, h: 20, noWalls: true, ceil: false, floor: 'concrete', step: 'concrete', rev: 0.05, bg: '#2a2a3a', music: '',
  ambience: { wind: 1, drone: 0.1, alarm: 0.5 }, amb: ['#6a5a5a', 0.7], hemi: ['#d8a080', '#2a2028', 0.55], fog: ['#6a5866', 0.018],
  floors: [{ r: [-9, -9, 9, 9], y: 0 }],
  doors: [{ id: 'S', p: [0, 9], type: 'elev', lock: { story: '昇降機は、もう下へは降りない。' } }],
  lights: [{ t: 'dir', p: [-20, 12, -30], to: [0, 0, 0], c: '#ffc890', i: 1.6 }],
  build(c) {
    const g = c.g; skyDome(c, 'dawn', '#ffffff', 80);
    g.plate(M('col', { c: '#d8d0c0' }), 0, 0.01, 0, 3.2, 0.8, '+y'); g.plate(M('col', { c: '#d8d0c0' }), -1.6, 0.012, 0, 0.7, 5, '+y'); g.plate(M('col', { c: '#d8d0c0' }), 1.6, 0.012, 0, 0.7, 5, '+y');
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.box(M('col', { c: '#c8b860', e: '#504010' }), Math.sin(a) * 6.5, 0.02, Math.cos(a) * 6.5, 0.5, 0.04, 0.3); }
    // 縁の手すりと、下に続く山肌
    for (const [x, z, r, L] of [[0, -9, 0, 18], [-9, 0, 1, 18], [9, 0, 1, 18], [-5.5, 9, 0, 7], [5.5, 9, 0, 7]]) PROPS.railing(c, { x, z, r, L });
    g.box(M('concrete'), 0, -3, 0, 18.4, 6, 18.4, { no: '+y' });
    // 下の研究所の屋上（一段低い屋根・塔屋・換気口）と、山肌へ続く外壁
    g.quad(M('concrete'), [-24, -0.6, 24], [24, -0.6, 24], [24, -0.6, -24], [-24, -0.6, -24], [[0, 0], [12, 0], [12, 12], [0, 12]]);
    g.box(M('concrete'), 0, -21, 0, 48, 40.8, 48, { no: '+y' });
    for (const [x, z, w, d, h] of [[-15, 6, 5, 4, 2.2], [16, -9, 4, 6, 3.0], [-14, -15, 6, 3, 1.6], [15, 14, 3, 3, 1.2]]) g.box(M('metal'), x, -0.6 + h / 2, z, w, h, d);
    for (const [x, z] of [[-12, 12], [12.5, -2], [-17, -4], [6, -16], [-6, 17]]) { g.cyl(M('iron'), x, -0.6, z, 0.5, 1.4, 8); g.cyl(M('metal'), x, 0.8, z, 0.62, 0.15, 8); }
    for (const [x0, z0, x1, z1] of [[-24, 24, 24, 24], [-24, -24, 24, -24], [-24, -24, -24, 24], [24, -24, 24, 24]]) { const L = hyp(x1 - x0, z1 - z0); g.box(M('concrete'), (x0 + x1) / 2, -0.3, (z0 + z1) / 2, abs(x1 - x0) + 0.3, 0.6, abs(z1 - z0) + 0.3); }
    // 赤い標識灯：各辺の中ほどと、昇降機の小屋の屋根（四隅に置くと、四隅のカメラと一直線に並んで画面の真ん中をふさぐ）
    for (const [x, z] of [[0, -9], [-9, 0], [9, 0]]) { g.cyl(M('iron'), x, 0, z, 0.05, 2.4, 5); g.ball(M('col', { c: '#ff3020', e: '#ff2010', ei: 1 }), x, 2.45, z, 0.1, 0.1, 0.1, 3); }
    g.box(M('metal'), 0, 1.3, 10.0, 2.4, 2.6, 1.8); g.box(M('iron'), 0, 2.65, 10.0, 2.6, 0.1, 2.0); g.ball(M('col', { c: '#ff3020', e: '#ff2010', ei: 1 }), 0, 2.8, 10.0, 0.1, 0.1, 0.1, 3); // 昇降機の小屋
    // 遠くの山々と、谷の洋館
    // 遠くの山並み（遠いほど霞む）と、朝日
    for (let k = 0; k < 3; k++) for (let i = 0; i < 12; i++) { const a = -PI + i / 11 * TAU * 0.999, d = 70 + k * 18; const col = ['#2c2638', '#4a3e58', '#6a5872'][k]; g.cyl(M('col', { c: col }), Math.cos(a) * d, -42, Math.sin(a) * d, 22 + ((i * 7 + k * 3) % 5) * 5, 44 + ((i * 3 + k) % 4) * 7 - k * 6, 7, { r2: 1.5 }); }
    const sun = new THREE.Mesh(new THREE.CircleGeometry(5, 20), new THREE.MeshBasicMaterial({ color: '#ffe0a0', fog: false })); sun.position.set(-30, 4, -66); sun.lookAt(0, 2, 0); c.add(sun); c.R.dyn.sun = sun;
    g.push(-4, -24, 40, PI); mansionFront(c, 0, { lit: [], nolight: true }); g.pop();
    treeLine(c, 0, 0, 16, 46, 70, 9, '#121812', -16);
  },
  cams: [
    { p: [11, 4.2, 11], t: [2.5, 0.8, 2.5], fov: 62, z: [-0.6, -0.6, 9, 9] },
    { p: [-11, 4.2, 11], t: [-2.5, 0.8, 2.5], fov: 62, z: [-9, -0.6, 0.6, 9] },
    { p: [11, 4.2, -11], t: [2.5, 0.8, -2.5], fov: 62, z: [-0.6, -9, 9, 0.6] },
    { p: [-11, 4.2, -11], t: [-2.5, 0.8, -2.5], fov: 62, z: [-9, -9, 0.6, 0.6] },
    { id: 'sky', p: [0, 1.4, 6.5], t: [0, 6, -6], fov: 60, event: true },
  ],
  enemies: [{ t: 'boss2', x: 0, z: -5, r: 0, key: 'boss2', hidden: true, st: 'idle', revealAt: [0, -6] }],
};

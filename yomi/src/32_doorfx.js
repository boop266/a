// 黄泉還：扉を開ける場面（暗い中で扉がきしみながら開く。その間に次の部屋を用意する）
function startDoorFx(type, fx) {
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#000000'); sc.fog = new THREE.Fog('#000000', 1.5, 6.5);
  const cam = new THREE.PerspectiveCamera(48, 4 / 3, 0.05, 30); cam.position.set(0, 1.45, 2.6); cam.lookAt(0, 1.3, 0);
  const lamp = new THREE.PointLight('#e8d8b8', 5, 7, 1.4); lamp.position.set(0.4, 1.8, 2.4); sc.add(lamp); sc.add(new THREE.AmbientLight('#3a342c', 0.5));
  const o = { sc, cam, t: 0, dur: OPT.door === 'short' ? 0.9 : 2.25, type, midDone: false, parts: {} };
  const kind = fx || type;
  if (kind === 'stairs' || kind === 'stairsdown') {
    const g = new GB(); const st = M('wood_d'), cp = M('runner'), wall = M('paper_cream');
    for (let i = 0; i < 16; i++) { const y = (kind === 'stairs' ? i : -i) * 0.19, z = -i * 0.3; g.box(st, 0, y - 0.1, z, 1.4, 0.2, 0.3); g.box(cp, 0, y + 0.005, z, 0.9, 0.01, 0.3, { fit: true }); }
    g.quad(wall, [-0.7, -4, 1], [-0.7, -4, -6], [-0.7, 5, -6], [-0.7, 5, 1], [[0, 0], [5, 0], [5, 7], [0, 7]]); g.quad(wall, [0.7, -4, -6], [0.7, -4, 1], [0.7, 5, 1], [0.7, 5, -6], [[0, 0], [5, 0], [5, 7], [0, 7]]);
    sc.add(g.build(new THREE.Group())); cam.position.set(0, 1.6, 1.0); cam.lookAt(0, kind === 'stairs' ? 2.2 : 0.2, -2);
    o.parts.stairs = kind; AU.sfx('stairs');
  } else if (kind === 'elev') {
    const g = new GB(); const m = M('metal'), ir = M('iron');
    g.box(m, 0, 0, 0, 2.4, 0.1, 2.4); g.quad(M('concrete'), [-1.2, -20, -1.25], [1.2, -20, -1.25], [1.2, 20, -1.25], [-1.2, 20, -1.25], [[0, 0], [1, 0], [1, 16], [0, 16]]);
    for (let k = -4; k <= 4; k++) g.box(ir, k * 0.25, 1.2, 1.2, 0.03, 2.4, 0.03);
    const grp = g.build(new THREE.Group()); sc.add(grp); o.parts.shaft = grp; cam.position.set(0.5, 1.5, 0.9); cam.lookAt(0, 1.3, -1.2);
    for (let k = 0; k < 6; k++) { const L = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: '#ffd080' })); L.position.set(0.9, k * 3.2, -1.2); grp.add(L); }
    AU.sfx('elev');
  } else {
    // 扉：枠と板（蝶番で回る、研究所は横に開く）
    const wallM = M(kind === 'lab' ? 'labwall' : kind === 'iron' ? 'stone' : 'paper_cream'), g = new GB();
    g.quad(wallM, [-3, 0, 0], [-0.62, 0, 0], [-0.62, 3, 0], [-3, 3, 0], [[-3, 0], [-0.62, 0], [-0.62, 3], [-3, 3]]); g.quad(wallM, [0.62, 0, 0], [3, 0, 0], [3, 3, 0], [0.62, 3, 0], [[0.62, 0], [3, 0], [3, 3], [0.62, 3]]); g.quad(wallM, [-0.62, 2.3, 0], [0.62, 2.3, 0], [0.62, 3, 0], [-0.62, 3, 0], [[0, 2.3], [1.2, 2.3], [1.2, 3], [0, 3]]);
    g.quad(M(kind === 'lab' ? 'labfloor' : 'parquet'), [-3, 0, 3], [3, 0, 3], [3, 0, -3], [-3, 0, -3], [[0, 0], [4, 0], [4, 4], [0, 4]]);
    const tr = M(kind === 'lab' ? 'metal' : 'wood_d'); g.box(tr, -0.66, 1.15, 0.03, 0.08, 2.35, 0.08); g.box(tr, 0.66, 1.15, 0.03, 0.08, 2.35, 0.08); g.box(tr, 0, 2.34, 0.03, 1.4, 0.1, 0.08);
    sc.add(g.build(new THREE.Group()));
    const leafM = kind === 'iron' ? 'metal' : kind === 'lab' ? 'metal' : kind === 'glass' ? 'wood_l' : 'wood_d';
    if (kind === 'lab') {
      for (const s of [-1, 1]) { const p = gbMesh(gb => { gb.box(M(leafM), 0, 1.15, 0, 0.6, 2.3, 0.06); gb.box(M('hazard'), 0, 0.15, 0.035, 0.6, 0.2, 0.01); }); p.position.set(s * 0.3, 0, -0.02); sc.add(p); o.parts['s' + s] = p; }
      AU.sfx('elev', { vol: 0.4 });
    } else {
      const piv = new THREE.Group(); piv.position.set(-0.6, 0, -0.03); const leaf = gbMesh(gb => { gb.box(M(leafM), 0.6, 1.15, 0, 1.2, 2.3, 0.06); gb.box(M(leafM), 0.6, 0.62, 0.04, 0.8, 0.8, 0.03); gb.box(M(leafM), 0.6, 1.65, 0.04, 0.8, 0.9, 0.03); gb.box(M('brass'), 1.05, 1.0, 0.07, 0.05, 0.16, 0.03); if (kind === 'glass') gb.box(M('col', { c: '#4a6a60', e: '#0a1a14' }), 0.6, 1.3, 0.035, 0.9, 1.6, 0.01); }); piv.add(leaf); sc.add(piv); o.parts.piv = piv;
      AU.sfx('door');
    }
  }
  return o;
}
function updDoorFx(o, dt) {
  o.t += dt; const k = clamp(o.t / o.dur, 0, 1), P = o.parts;
  if (P.piv) { const a = smooth(clamp((k - 0.15) / 0.65, 0, 1)); P.piv.rotation.y = -a * 1.9; o.cam.position.z = 2.6 - smooth(clamp((k - 0.3) / 0.7, 0, 1)) * 2.4; o.cam.position.y = 1.45 + Math.sin(k * PI * 4) * 0.015; }
  if (P['s1']) { const a = smooth(clamp((k - 0.15) / 0.5, 0, 1)); P['s1'].position.x = 0.3 + a * 0.62; P['s-1'].position.x = -0.3 - a * 0.62; o.cam.position.z = 2.6 - smooth(clamp((k - 0.35) / 0.65, 0, 1)) * 2.4; }
  if (P.stairs) { const d = smooth(k) * 3.2; o.cam.position.set(0, 1.6 + (P.stairs === 'stairs' ? d * 0.63 : -d * 0.63), 1.0 - d); o.cam.lookAt(0, (P.stairs === 'stairs' ? 2.2 + d * 0.63 : 0.2 - d * 0.63), -2 - d); }
  if (P.shaft) P.shaft.position.y = -(o.type === 'elevup' ? -1 : 1) * k * 9;
  RD.U.fade.value = k < 0.12 ? 1 - k / 0.12 : k > 0.82 ? (k - 0.82) / 0.18 : 0;
  if (k > 0.85 && !o.midDone) { o.midDone = true; o.mid && o.mid(); }
  if (k >= 1) { G.doorFx = null; G.mode = 'play'; G.fade = 1; G.fadeTo = 0; }
}

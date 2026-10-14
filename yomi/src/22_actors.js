// 黄泉還：人と化け物の体（関節つき）と、その動き
const HSPEC = {
  ryo: { skin: '#d6b294', face: 'face_ryo', hair: '#16110d', hs: 'short', shirt: 'uniform', pants: 'uniform', vest: 'vest', boot: '#121212', glove: '#1b1b1c', patch: '#b8902c' },
  haya: { skin: '#cfa888', face: 'face_haya', hair: '#2b1d14', hs: 'pony', shirt: 'uniform', pants: 'uniform', vest: 'vest', boot: '#121212', glove: '#1b1b1c', patch: '#b8902c', band: '#9a1c1c' },
  miura: { skin: 'skin_z', face: 'face_z', hair: '#16110d', hs: 'short', shirt: 'uniform', pants: 'uniform', vest: 'vest', boot: '#121212', glove: '#1b1b1c', blood: true },
  kuroki: { skin: '#c8a688', face: 'face_ryo', hair: '#3a3a36', hs: 'short', shirt: 'uniform', pants: 'uniform', vest: 'vest', boot: '#121212', glove: '#1b1b1c', blood: true },
  servant: { skin: 'skin_z', face: 'face_zw', hair: '#16120e', hs: 'bun', shirt: 'servant', pants: 'servant', skirt: 'servant', apron: '#cfcabe', boot: '#151515' },
  cook: { skin: 'skin_z', face: 'face_z', hair: '#2a2a22', hs: 'short', shirt: 'linen', pants: '#383836', apron: '#cfcabe', boot: '#151515', hat: true },
  butler: { skin: 'skin_z', face: 'face_z2', hair: '#9a9a90', hs: 'short', shirt: '#1a1a1e', pants: '#1a1a1e', boot: '#0e0e0e', collar: true },
  worker: { skin: 'skin_z', face: 'face_z2', hair: '#2a2218', hs: 'short', shirt: 'worker', pants: 'worker', boot: '#2a2018' },
  res: { skin: 'skin_z', face: 'face_res', hair: '#55504a', hs: 'short', shirt: '#a8b0b0', pants: '#33363c', coat: 'labcoat', boot: '#1a1a1a' },
  guard: { skin: 'skin_z', face: 'face_z', hair: '#16110d', hs: 'short', shirt: '#2a3038', pants: '#2a3038', vest: 'vest', boot: '#121212' },
  gardener: { skin: 'skin_z', face: 'face_z2', hair: '#2a2218', hs: 'bald', shirt: 'worker', pants: 'worker', apron: '#3a2414', boot: '#2a2018', scale: 1.3, bulk: 1.35 },
  hunter: { hunter: true, skin: 'skin_h', face: 'face_hunter', shirt: 'skin_h', pants: 'skin_h', boot: '#3a4a26', glove: 'skin_h', scale: 1.05, bulk: 1.1, claws: true },
  boss: { boss: true, skin: 'skin_boss', face: 'face_z', shirt: 'skin_boss', pants: '#2a2a2e', boot: '#3a3030', glove: 'skin_boss', scale: 1.45, bulk: 1.25, claws: true },
};
function hMat(v) { return v.startsWith('#') ? M('col', { c: v }) : M(v); }
function makeHuman(key) {
  const sp = HSPEC[key], S = sp.scale || 1, B = sp.bulk || 1, root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.scale.setScalar(S);
  const J = {}, meshes = [];
  const mk = (n, p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); J[n] = g; return g; };
  const bx = (p, m, sx, sy, sz, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); p.add(me); meshes.push(me); return me; };
  const skin = hMat(sp.skin), shirt = hMat(sp.shirt), pants = hMat(sp.pants), boot = hMat(sp.boot), glove = sp.glove ? hMat(sp.glove) : skin, hair = sp.hair ? hMat(sp.hair) : skin;
  const pel = mk('pelvis', body, 0, 0.92, 0); bx(pel, pants, 0.32 * B, 0.17, 0.2 * B, 0, -0.03, 0);
  const sp1 = mk('spine', pel, 0, 0.05, 0); bx(sp1, shirt, 0.3 * B, 0.23, 0.18 * B, 0, 0.11, 0);
  const ch = mk('chest', sp1, 0, 0.22, 0); bx(ch, shirt, 0.37 * B, 0.3, 0.21 * B, 0, 0.14, 0);
  if (sp.vest) { bx(ch, hMat(sp.vest), 0.39 * B, 0.27, 0.235 * B, 0, 0.12, 0); bx(sp1, hMat(sp.vest), 0.32 * B, 0.12, 0.2 * B, 0, 0.17, 0); }
  if (sp.apron) { bx(sp1, hMat(sp.apron), 0.3 * B, 0.36, 0.02, 0, -0.02, 0.1 * B); bx(ch, hMat(sp.apron), 0.24 * B, 0.22, 0.02, 0, 0.14, 0.112 * B); }
  if (sp.collar) bx(ch, M('col', { c: '#e8e4d8' }), 0.12, 0.08, 0.02, 0, 0.26, 0.106);
  if (sp.blood) { bx(ch, M('blood', { at: 0.3 }), 0.3, 0.2, 0.01, 0.03, 0.12, 0.124); }
  if (sp.patch) bx(ch, M('col', { c: sp.patch }), 0.08, 0.06, 0.01, -0.1, 0.2, 0.123);
  const nk = mk('neck', ch, 0, 0.3, 0); bx(nk, skin, 0.09, 0.09, 0.09, 0, 0.03, 0);
  const hd = mk('head', nk, 0, 0.07, 0);
  const hm = [hair, hair, hair, skin, M(sp.face), hair].map((m, i) => (i === 0 || i === 1) && sp.hs === 'bald' ? skin : m);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.22), sp.hs === 'bald' || sp.hunter || sp.boss ? [skin, skin, skin, skin, M(sp.face), skin] : hm); head.position.set(0, 0.12, 0.01); hd.add(head); meshes.push(head);
  if (sp.hs === 'short' || sp.hs === 'pony' || sp.hs === 'bun') bx(hd, hair, 0.215, 0.07, 0.23, 0, 0.245, 0);
  if (sp.hs === 'pony') bx(hd, hair, 0.07, 0.22, 0.06, 0, 0.12, -0.13);
  if (sp.hs === 'bun') bx(hd, hair, 0.11, 0.1, 0.08, 0, 0.2, -0.13);
  if (sp.hat) bx(hd, M('linen'), 0.22, 0.14, 0.22, 0, 0.3, 0);
  if (sp.hunter) { bx(hd, skin, 0.16, 0.08, 0.16, 0, 0.02, 0.15); for (let i = 0; i < 5; i++) bx(hd, M('col', { c: '#2a3818' }), 0.03, 0.06, 0.1, 0, 0.26 - i * 0.02, -0.04 - i * 0.04); }
  if (sp.boss) { bx(ch, M('col', { c: '#8a1020', e: '#3a0408' }), 0.14, 0.14, 0.05, -0.08, 0.16, 0.12); bx(hd, skin, 0.24, 0.1, 0.24, 0, 0.02, 0); }
  for (const s of [1, -1]) { // s=1 が左（+x）
    const L = s > 0 ? 'L' : 'R';
    const ua = mk('ua' + L, ch, s * 0.225 * B, 0.255, 0); bx(ua, shirt, 0.1 * B, 0.3, 0.1 * B, 0, -0.14, 0);
    if (sp.band && s > 0) bx(ua, M('col', { c: sp.band }), 0.105 * B, 0.05, 0.105 * B, 0, -0.08, 0);
    const fa = mk('fa' + L, ua, 0, -0.29, 0); bx(fa, sp.coat || sp.vest ? shirt : skin, 0.085 * B, 0.27, 0.085 * B, 0, -0.13, 0);
    const hn = mk('hand' + L, fa, 0, -0.27, 0); bx(hn, glove, 0.08 * B, 0.1, 0.05 * B, 0, -0.05, 0);
    if (sp.claws) for (let k = 0; k < 3; k++) bx(hn, M('col', { c: '#d8d0b0' }), 0.015, sp.boss && s < 0 ? 0.5 : 0.16, 0.015, (k - 1) * 0.025, sp.boss && s < 0 ? -0.33 : -0.16, 0.01);
    const th = mk('th' + L, pel, s * 0.09 * B, -0.06, 0); bx(th, pants, 0.13 * B, 0.44, 0.14 * B, 0, -0.21, 0);
    const sh = mk('sh' + L, th, 0, -0.43, 0); bx(sh, pants, 0.11 * B, 0.3, 0.12 * B, 0, -0.14, 0); bx(sh, boot, 0.12 * B, 0.14, 0.13 * B, 0, -0.34, 0);
    const ft = mk('ft' + L, sh, 0, -0.42, 0); bx(ft, boot, 0.11 * B, 0.07, 0.24, 0, -0.025, 0.05);
  }
  if (sp.skirt) { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.28, 0.6, 8), hMat(sp.skirt)); sk.position.set(0, -0.36, 0); pel.add(sk); meshes.push(sk); }
  if (sp.coat) { const cm = hMat(sp.coat); bx(sp1, cm, 0.34 * B, 0.3, 0.215 * B, 0, 0.12, 0); bx(ch, cm, 0.39 * B, 0.3, 0.225 * B, 0, 0.14, 0); bx(pel, cm, 0.36, 0.55, 0.22, 0, -0.3, 0); for (const L of ['L', 'R']) bx(J['ua' + L], cm, 0.11, 0.3, 0.11, 0, -0.14, 0); }
  // 手に持つ物
  J.gun = new THREE.Group(); J.gun.position.set(0, -0.09, 0.02); J.handR.add(J.gun);
  root.userData = { J, sp, S, key };
  return { root, body, J, sp, S, key, meshes, cur: {}, imp: 0 };
}
// 武器の形（手に持たせる）
function makeWeapon(id) {
  return gbMesh(g => {
    const m = M('col', { c: '#1c1c1e' }), w = M('wood');
    if (id === 'hg') { g.box(m, 0, -0.02, 0.07, 0.035, 0.05, 0.2); g.box(m, 0, -0.07, 0.0, 0.03, 0.11, 0.05); }
    else if (id === 'sg') { g.box(m, 0, 0, 0.3, 0.04, 0.045, 0.72); g.box(m, 0, -0.04, 0.32, 0.035, 0.03, 0.4); g.box(w, 0, -0.04, -0.12, 0.05, 0.1, 0.3); g.box(w, 0, -0.03, 0.42, 0.05, 0.05, 0.18); }
    else if (id === 'mg') { g.box(m, 0, -0.01, 0.12, 0.04, 0.05, 0.3); g.cylZ(m, 0, -0.02, 0.0, 0.03, 0.08, 6); g.box(w, 0, -0.08, -0.01, 0.035, 0.12, 0.05); }
    else if (id === 'gl') { g.box(m, 0, 0, 0.25, 0.06, 0.07, 0.6); g.cylZ(m, 0, -0.04, 0.05, 0.07, 0.16, 8); g.box(w, 0, -0.06, -0.1, 0.05, 0.12, 0.2); }
    else if (id === 'knife') { g.box(M('col', { c: '#c8ccd0' }), 0, 0, 0.12, 0.01, 0.03, 0.18); g.box(m, 0, 0, 0.0, 0.02, 0.03, 0.08); }
    else if (id === 'shears') { g.box(M('metal'), 0.02, 0, 0.4, 0.015, 0.06, 0.7); g.box(M('metal'), -0.02, 0, 0.4, 0.015, 0.06, 0.7); g.box(w, 0, 0, -0.05, 0.04, 0.05, 0.25); }
  });
}
function setWeapon(h, id) {
  if (h.wid === id) return; h.wid = id; while (h.J.gun.children.length) h.J.gun.remove(h.J.gun.children[0]);
  if (!id) return; const w = makeWeapon(id); h.J.gun.add(w);
}
// ── 動き：目標の角度を作り、なめらかに寄せる ──
const JN = ['pelvis', 'spine', 'chest', 'neck', 'head', 'uaL', 'faL', 'handL', 'uaR', 'faR', 'handR', 'thL', 'shL', 'ftL', 'thR', 'shR', 'ftR'];
function applyPose(h, P, dt, speed = 14) {
  const k = 1 - Math.exp(-dt * speed);
  for (const n of JN) { const j = h.J[n]; if (!j) continue; const t = P[n] || [0, 0, 0]; j.rotation.x += (t[0] - j.rotation.x) * k; j.rotation.y += (t[1] - j.rotation.y) * k; j.rotation.z += (t[2] - j.rotation.z) * k; }
  const py = 0.92 + (P.py || 0), pz = P.pz || 0; h.J.pelvis.position.y += (py - h.J.pelvis.position.y) * k; h.J.pelvis.position.z += (pz - h.J.pelvis.position.z) * k;
  const bx = P.bx || 0, bz = P.bz || 0, by = P.by || 0; h.body.rotation.x += (bx - h.body.rotation.x) * k; h.body.rotation.z += (bz - h.body.rotation.z) * k; h.body.position.y += (by - h.body.position.y) * k;
}
// 歩き・走り（ph：歩幅の位相　amp：大きさ）
function gait(P, ph, amp, run, limp = 0) {
  const s = Math.sin(ph), c = Math.cos(ph), A = run ? 0.75 : 0.45 * amp;
  const lim = 1 - limp * 0.6;
  P.thL = [-s * A * lim, 0, 0]; P.thR = [s * A, 0, 0];
  P.shL = [Math.max(0, -c) * (run ? 1.3 : 0.7) * amp * lim, 0, 0]; P.shR = [Math.max(0, c) * (run ? 1.3 : 0.7) * amp, 0, 0];
  P.ftL = [-0.2 * s * amp, 0, 0]; P.ftR = [0.2 * s * amp, 0, 0];
  P.uaL = [s * (run ? 0.7 : 0.35) * amp, 0, 0.06]; P.uaR = [-s * (run ? 0.7 : 0.35) * amp, 0, -0.06];
  P.faL = [-(run ? 1.3 : 0.25), 0, 0]; P.faR = [-(run ? 1.3 : 0.25), 0, 0];
  P.py = -Math.abs(Math.sin(ph)) * (run ? 0.05 : 0.025) * amp - limp * 0.03; P.spine = [run ? 0.18 : 0.04, s * 0.06, 0]; P.chest = [0, s * 0.08, 0];
}
// 主人公の姿勢
function poseRyo(h, st, dt) {
  const P = {}; const t = st.t;
  const cond = st.hp > 66 ? 0 : st.hp > 33 ? 1 : 2; // ふつう・注意・危険
  if (st.dead) { P.bx = -PI / 2 * Math.min(1, st.deadT * 2.2); P.by = 0.12 * Math.min(1, st.deadT * 2); P.uaL = [-0.4, 0, 0.8]; P.uaR = [-0.4, 0, -0.8]; P.thL = [-0.2, 0, 0.1]; P.thR = [-0.1, 0, -0.1]; P.head = [0.3, 0.5, 0]; applyPose(h, P, dt, 6); return; }
  if (st.mode === 'walk' || st.mode === 'run' || st.mode === 'back') {
    const run = st.mode === 'run'; st.ph = (st.ph || 0) + dt * (run ? 10.5 : 6.2) * (cond === 2 ? 0.75 : 1) * (st.mode === 'back' ? -1 : 1);
    gait(P, st.ph, 1, run && cond < 2, cond === 2 ? 1 : 0);
    if (cond === 1) { P.uaL = [-0.3, 0, 0.35]; P.faL = [-1.7, 0, 0]; P.spine = [0.15, 0, 0]; }
    if (cond === 2) { P.uaL = [-0.3, 0, 0.35]; P.faL = [-1.8, 0, 0]; P.spine = [0.28, 0, 0.12]; P.head = [0.2, 0, 0.1]; }
    if (st.poison) { P.head = [0.25, 0, Math.sin(t * 2) * 0.15]; }
  } else if (st.mode === 'aim' || st.mode === 'shoot') {
    const pitch = st.pitch || 0, rc = st.recoil || 0, w = st.wid;
    P.thL = [-0.25, 0, 0.05]; P.thR = [0.15, 0, -0.05]; P.shL = [0.25, 0, 0]; P.shR = [0.1, 0, 0]; P.spine = [0.02, 0, 0];
    P.chest = [-pitch * 0.4 - rc * 0.15, 0, 0]; P.head = [-pitch * 0.4, 0, 0];
    if (w === 'sg' || w === 'gl') { P.uaR = [-1.0 - pitch * 0.6 + rc * 0.5, 0, -0.1]; P.faR = [-0.9, 0, 0]; P.handR = [0.35, 0, 0]; P.uaL = [-1.35 - pitch * 0.6 + rc * 0.4, 0, -0.35]; P.faL = [-0.5, 0, 0]; P.chest[1] = 0.35; P.head[1] = -0.3; }
    else if (w === 'knife') { const sw = st.slash || 0; P.uaR = [-1.2 + sw * 1.6, 0.4 - sw * 0.9, -0.5 + sw]; P.faR = [-0.6, 0, 0]; P.handR = [0.6, 0, 0]; P.uaL = [-0.2, 0, 0.3]; P.faL = [-0.6, 0, 0]; P.spine = [0.25, -0.3 + sw * 0.6, 0]; P.thL = [-0.5, 0, 0]; P.shL = [0.6, 0, 0]; P.py = -0.1; }
    else { P.uaR = [-1.52 - pitch + rc * 0.5, 0, 0.06]; P.faR = [-0.05, 0, 0]; P.handR = [0.05 - rc * 0.3, 0, 0]; P.uaL = [-1.42 - pitch + rc * 0.4, 0, -0.42]; P.faL = [-0.25, 0, 0]; P.handL = [0, 0, 0]; }
  } else if (st.mode === 'pick') { const k = Math.sin(Math.min(1, st.mt / 0.6) * PI); P.thL = [-1.0 * k, 0, 0]; P.thR = [-0.3 * k, 0, 0]; P.shL = [1.4 * k, 0, 0]; P.shR = [1.5 * k, 0, 0]; P.py = -0.32 * k; P.spine = [0.5 * k, 0, 0]; P.uaR = [-0.9 * k, 0, 0]; P.faR = [-0.3 * k, 0, 0]; }
  else if (st.mode === 'push') { st.ph = (st.ph || 0) + dt * 4; gait(P, st.ph, 0.6, false); P.uaL = [-1.4, 0, -0.2]; P.uaR = [-1.4, 0, 0.2]; P.faL = [-0.4, 0, 0]; P.faR = [-0.4, 0, 0]; P.spine = [0.35, 0, 0]; }
  else if (st.mode === 'grabbed') { P.spine = [-0.2 + Math.sin(t * 15) * 0.05, Math.sin(t * 9) * 0.2, 0]; P.uaL = [-1.3, 0, -0.3 + Math.sin(t * 13) * 0.2]; P.uaR = [-1.3, 0, 0.3 + Math.sin(t * 11) * 0.2]; P.faL = [-0.8, 0, 0]; P.faR = [-0.8, 0, 0]; P.head = [-0.3, Math.sin(t * 7) * 0.3, 0]; P.thL = [-0.3, 0, 0]; P.shL = [0.4, 0, 0]; }
  else if (st.mode === 'hurt') { P.spine = [-0.45, 0, 0.1]; P.head = [-0.35, 0, 0]; P.uaL = [-0.3, 0, 0.5]; P.uaR = [-0.3, 0, -0.5]; P.thL = [-0.3, 0, 0]; P.shL = [0.5, 0, 0]; }
  else { // 立っている
    const b = Math.sin(t * 1.6) * 0.02; P.chest = [b, 0, 0]; P.uaL = [0.05, 0, 0.08 + b]; P.uaR = [0.05, 0, -0.08 - b]; P.faL = [-0.15, 0, 0]; P.faR = [-0.15, 0, 0];
    if (cond === 1) { P.uaL = [-0.3, 0, 0.35]; P.faL = [-1.7, 0, 0]; P.spine = [0.12, 0, 0]; }
    if (cond === 2) { P.uaL = [-0.3, 0, 0.35]; P.faL = [-1.8, 0, 0]; P.spine = [0.3, 0, 0.12]; P.head = [0.25, 0, 0.1]; P.thL = [-0.1, 0, 0]; P.shL = [0.25, 0, 0]; P.py = -0.03; }
    if (st.look) P.head = [0, clamp(st.look, -0.9, 0.9), 0];
  }
  applyPose(h, P, dt, st.mode === 'shoot' ? 30 : 13);
}
// ゾンビ（と人型の化け物）の姿勢
function poseZombie(h, e, dt) {
  const P = {}, t = e.t + e.seed;
  const sway = Math.sin(t * 0.9) * 0.1;
  switch (e.anim) {
    case 'idle': P.spine = [0.18, 0, sway]; P.head = [0.25, Math.sin(t * 0.4) * 0.3, 0.35]; P.uaL = [-0.15, 0, 0.12]; P.uaR = [-0.2, 0, -0.1]; P.faL = [-0.2, 0, 0]; P.faR = [-0.3, 0, 0]; break;
    case 'walk': case 'reach': {
      e.ph = (e.ph || 0) + dt * (e.spd || 0.8) * 4.2; const s = Math.sin(e.ph);
      P.thL = [-s * 0.35, 0, 0.04]; P.thR = [s * 0.35, 0, -0.04]; P.shL = [Math.max(0, -Math.cos(e.ph)) * 0.35, 0, 0]; P.shR = [Math.max(0, Math.cos(e.ph)) * 0.35, 0, 0];
      P.bz = s * 0.08; P.spine = [0.22, s * 0.1, 0]; P.head = [0.2, 0, -s * 0.25 + 0.2];
      const up = e.anim === 'reach' ? -1.55 : -1.25; P.uaL = [up + Math.sin(t * 2.1) * 0.12, 0, -0.1]; P.uaR = [up + Math.cos(t * 1.9) * 0.12, 0, 0.1]; P.faL = [-0.2, 0, 0]; P.faR = [-0.25, 0, 0]; P.py = -Math.abs(s) * 0.03; break; }
    case 'eat': P.py = -0.5; P.thL = [-1.75, 0, 0.1]; P.thR = [-1.4, 0, -0.1]; P.shL = [2.1, 0, 0]; P.shR = [2.0, 0, 0]; P.ftL = [-0.4, 0, 0]; P.spine = [0.7, 0, 0]; P.chest = [0.3, 0, 0]; P.head = [0.4 + Math.sin(t * 9) * 0.15, 0, 0]; P.uaL = [-0.9, 0, -0.2]; P.uaR = [-0.9, 0, 0.2]; P.faL = [-0.9, 0, 0]; P.faR = [-0.9, 0, 0]; break;
    case 'turn': P.py = -0.5; P.thL = [-1.75, 0, 0.1]; P.thR = [-1.4, 0, -0.1]; P.shL = [2.1, 0, 0]; P.shR = [2.0, 0, 0]; P.spine = [0.4, 0.6, 0]; P.chest = [0.1, 0.4, 0]; P.head = [0.05, 0.9, 0.2]; P.uaL = [-0.6, 0, -0.2]; P.uaR = [-0.6, 0, 0.2]; P.faL = [-0.9, 0, 0]; P.faR = [-0.9, 0, 0]; break;
    case 'grab': P.uaL = [-1.5, 0, -0.25]; P.uaR = [-1.5, 0, 0.25]; P.faL = [-0.5, 0, 0]; P.faR = [-0.5, 0, 0]; P.spine = [0.35, 0, 0]; P.head = [0.4 + Math.sin(t * 12) * 0.1, 0, 0]; P.thL = [-0.3, 0, 0]; P.shL = [0.3, 0, 0]; break;
    case 'stagger': P.spine = [-0.45, 0, 0.15]; P.head = [-0.4, 0, 0.3]; P.uaL = [0.3, 0, 0.7]; P.uaR = [0.2, 0, -0.7]; P.thR = [0.3, 0, 0]; P.shR = [0.3, 0, 0]; break;
    case 'down': case 'dead': P.bx = -PI / 2; P.by = 0.13; P.uaL = [-0.3, 0, 1.0]; P.uaR = [-2.6, 0, -0.4]; P.thL = [-0.15, 0, 0.12]; P.thR = [0.1, 0, -0.1]; P.head = [0.3, e.seed % 1 > 0.5 ? 0.7 : -0.7, 0]; break;
    case 'rise': P.bx = -PI / 2 * Math.max(0, 1 - e.at * 1.2); P.by = 0.13 * Math.max(0, 1 - e.at); P.thL = [-1.2, 0, 0]; P.shL = [1.6, 0, 0]; P.uaL = [-0.6, 0, 0.3]; P.uaR = [-0.6, 0, -0.3]; P.spine = [0.5, 0, 0]; break;
    case 'crawl': { e.ph = (e.ph || 0) + dt * 2.8; const s = Math.sin(e.ph); P.bx = PI / 2 - 0.15; P.by = 0.15; P.uaL = [-2.4 + s * 0.6, 0, -0.2]; P.uaR = [-2.4 - s * 0.6, 0, 0.2]; P.faL = [-0.3, 0, 0]; P.faR = [-0.3, 0, 0]; P.head = [-0.9, 0, 0]; P.thL = [0.1, 0, 0.1]; P.thR = [0.1, 0, -0.1]; break; }
    case 'lie': P.bx = PI / 2; P.by = 0.13; P.uaL = [-2.2, 0, -0.3]; P.uaR = [-0.3, 0, -0.4]; P.head = [-0.8, 0.8, 0]; break;
    case 'hunt': { // 狩人：低い前かがみで走る
      e.ph = (e.ph || 0) + dt * (e.spd || 3) * 3.0; const s = Math.sin(e.ph); gait(P, e.ph, 1, true); P.spine = [0.65, 0, 0]; P.chest = [0.3, 0, 0]; P.head = [-0.75, 0, 0]; P.uaL = [-0.5 + s * 0.6, 0, 0.2]; P.uaR = [-0.5 - s * 0.6, 0, -0.2]; P.faL = [-0.6, 0, 0]; P.faR = [-0.6, 0, 0]; P.py = -0.12; break; }
    case 'crouch': P.py = -0.3; P.thL = [-1.2, 0, 0.2]; P.thR = [-1.2, 0, -0.2]; P.shL = [1.5, 0, 0]; P.shR = [1.5, 0, 0]; P.spine = [0.8, 0, 0]; P.head = [-0.9, 0, 0]; P.uaL = [-0.4, 0, 0.5]; P.uaR = [-0.4, 0, -0.5]; break;
    case 'leap': P.spine = [0.3, 0, 0]; P.uaL = [-2.6, 0, 0.3]; P.uaR = [-2.6, 0, -0.3]; P.thL = [-1.0, 0, 0]; P.shL = [1.2, 0, 0]; P.thR = [0.5, 0, 0]; P.head = [-0.5, 0, 0]; break;
    case 'slash': { const k = e.at; P.spine = [0.4, 0.5 - k * 1.2, 0]; P.uaR = [-2.4 + k * 2.6, 0.3, -0.6 + k * 0.8]; P.faR = [-0.3, 0, 0]; P.uaL = [-0.5, 0, 0.4]; P.thL = [-0.6, 0, 0]; P.shL = [0.7, 0, 0]; P.py = -0.08; break; }
    case 'windup': P.spine = [-0.1, -0.6, 0]; P.uaR = [-2.6, 0.2, -0.9]; P.faR = [-0.7, 0, 0]; P.uaL = [-0.6, 0, 0.5]; P.head = [0.1, 0.3, 0]; break;
    case 'swing': P.spine = [0.35, 0.7, 0]; P.uaR = [-1.2, 0, 0.4]; P.faR = [-0.1, 0, 0]; P.uaL = [-0.4, 0, 0.4]; P.thL = [-0.5, 0, 0]; P.shL = [0.5, 0, 0]; break;
    case 'roar': P.spine = [-0.35, 0, 0]; P.chest = [-0.3, 0, 0]; P.head = [-0.6, 0, 0]; P.uaL = [-0.3, 0, 1.2]; P.uaR = [-0.3, 0, -1.2]; P.faL = [-1.0, 0, 0]; P.faR = [-1.0, 0, 0]; break;
    case 'curl': P.py = -0.45; P.thL = [-2.0, 0, 0.1]; P.thR = [-2.0, 0, -0.1]; P.shL = [2.3, 0, 0]; P.shR = [2.3, 0, 0]; P.spine = [0.9, 0, 0]; P.chest = [0.4, 0, 0]; P.head = [0.6, 0, 0]; P.uaL = [-0.9, 0, -0.4]; P.uaR = [-0.9, 0, 0.4]; P.faL = [-1.8, 0, 0]; P.faR = [-1.8, 0, 0]; break;
    case 'sit': P.py = -0.62; P.thL = [-1.5, 0, 0.15]; P.thR = [-1.45, 0, -0.1]; P.shL = [0.4, 0, 0]; P.shR = [0.6, 0, 0]; P.spine = [-0.25, 0, 0.05]; P.head = [0.35, 0.3, 0.2]; P.uaL = [-0.2, 0, 0.3]; P.faL = [-1.4, 0, 0]; P.uaR = [0.1, 0, -0.2]; P.faR = [-0.3, 0, 0]; break;
  }
  if (e.hitT > 0) { P.spine = P.spine || [0, 0, 0]; P.spine[0] -= e.hitT * 1.5; P.head = P.head || [0, 0, 0]; P.head[0] -= e.hitT * 1.2; }
  applyPose(h, P, dt, e.anim === 'turn' ? 3 : (e.anim === 'down' || e.anim === 'dead') ? 7 : 12);
}
// ── 犬 ──
function makeDog() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const fur = M('fur'), dark = M('col', { c: '#1a120c' });
  const J = {}; const mk = (n, p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); J[n] = g; return g; };
  const bx = (p, m, sx, sy, sz, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); p.add(me); return me; };
  const tor = mk('tor', body, 0, 0.55, 0); bx(tor, fur, 0.26, 0.28, 0.75, 0, 0, 0); bx(tor, M('blood', { at: 0.3 }), 0.27, 0.18, 0.3, 0.0, 0.03, 0.1);
  const nk = mk('neck', tor, 0, 0.1, 0.36); bx(nk, fur, 0.16, 0.18, 0.18, 0, 0.05, 0.05);
  const hd = mk('head', nk, 0, 0.12, 0.12); bx(hd, fur, 0.18, 0.17, 0.2, 0, 0, 0); bx(hd, fur, 0.11, 0.1, 0.2, 0, -0.03, 0.17); bx(hd, M('col', { c: '#d8d0c0' }), 0.1, 0.02, 0.18, 0, -0.08, 0.17);
  for (const s of [1, -1]) { bx(hd, fur, 0.04, 0.1, 0.04, s * 0.07, 0.12, -0.04); bx(hd, M('col', { c: '#e0d040', e: '#806010' }), 0.025, 0.02, 0.01, s * 0.05, 0.03, 0.1); }
  const jaw = mk('jaw', hd, 0, -0.07, 0.08); bx(jaw, fur, 0.09, 0.04, 0.17, 0, -0.02, 0.07);
  const tail = mk('tail', tor, 0, 0.08, -0.37); bx(tail, fur, 0.05, 0.05, 0.3, 0, 0, -0.14);
  for (const [n, x, z] of [['fl', 0.1, 0.28], ['fr', -0.1, 0.28], ['bl', 0.1, -0.28], ['br', -0.1, -0.28]]) { const u = mk(n, tor, x, -0.1, z); bx(u, fur, 0.07, 0.26, 0.08, 0, -0.12, 0); const l = mk(n + '2', u, 0, -0.24, 0); bx(l, fur, 0.05, 0.24, 0.05, 0, -0.11, 0); bx(l, dark, 0.06, 0.04, 0.09, 0, -0.23, 0.03); }
  return { root, body, J };
}
function poseDog(h, e, dt) {
  const J = h.J, k = 1 - Math.exp(-dt * 14), t = e.t + e.seed; let tgt = {};
  if (e.anim === 'run' || e.anim === 'walk') { e.ph = (e.ph || 0) + dt * (e.anim === 'run' ? 16 : 7); const s = Math.sin(e.ph), c = Math.cos(e.ph), A = e.anim === 'run' ? 0.8 : 0.4; tgt = { fl: s * A, fr: s * A * 0.8, bl: -s * A, br: -s * A * 0.8, fl2: Math.max(0, c) * 0.8, fr2: Math.max(0, c) * 0.8, bl2: -Math.max(0, -c) * 0.8, br2: -Math.max(0, -c) * 0.8, tor: s * 0.08, head: -s * 0.1, tail: 0.3 }; }
  else if (e.anim === 'lunge') tgt = { fl: -1.2, fr: -1.1, bl: 0.9, br: 0.9, tor: -0.25, head: -0.3, jaw: 0.6 };
  else if (e.anim === 'bite') tgt = { jaw: Math.abs(Math.sin(t * 18)) * 0.7, head: Math.sin(t * 14) * 0.2, tor: 0.1 };
  else if (e.anim === 'dead') tgt = { fl: 0.3, fr: 0.6, bl: -0.4, br: -0.2, jaw: 0.4 };
  else tgt = { head: 0.3 + Math.sin(t * 3) * 0.1, tail: Math.sin(t * 2) * 0.3 }; // 嗅ぐ
  for (const n of ['fl', 'fr', 'bl', 'br', 'fl2', 'fr2', 'bl2', 'br2', 'head', 'tail']) if (J[n]) J[n].rotation.x += ((tgt[n] || 0) - J[n].rotation.x) * k;
  J.jaw.rotation.x += ((tgt.jaw || 0.1) - J.jaw.rotation.x) * k; J.tor.rotation.x += ((tgt.tor || 0) - J.tor.rotation.x) * k;
  const roll = e.anim === 'dead' ? PI / 2 : 0; h.body.rotation.z += (roll - h.body.rotation.z) * k; h.body.position.y += ((e.anim === 'dead' ? -0.3 : 0) - h.body.position.y) * k;
}
// ── 大蜘蛛 ──
function makeSpider() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); const J = { legs: [] };
  const sk = M('col', { c: '#2a2418' }), sk2 = M('col', { c: '#4a3a20' });
  const ab = new THREE.Mesh(new THREE.SphereGeometry(0.42, 7, 5), sk); ab.scale.set(1, 0.75, 1.25); ab.position.set(0, 0.55, -0.45); body.add(ab);
  const st = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.6), M('col', { c: '#8a6a20' })); st.position.set(0, 0.85, -0.45); body.add(st);
  const ce = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 4), sk2); ce.scale.set(1, 0.6, 1.1); ce.position.set(0, 0.45, 0.15); body.add(ce); J.ce = ce;
  for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.05), M('col', { c: '#c0b090' })); f.position.set(s * 0.07, 0.3, 0.42); f.rotation.x = 0.4; body.add(f); }
  for (let i = 0; i < 6; i++) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), M('col', { c: '#ff3020', e: '#a01010', basic: true })); e.position.set((i % 3 - 1) * 0.06, 0.55 + ((i / 3) | 0) * 0.04, 0.4); body.add(e); }
  for (let i = 0; i < 8; i++) { const s = i < 4 ? 1 : -1, k = i % 4; const hip = new THREE.Group(); hip.position.set(s * 0.18, 0.47, 0.25 - k * 0.15); hip.rotation.y = s * (0.5 + (k - 1.5) * 0.45) + (s < 0 ? PI : 0); body.add(hip);
    const up = new THREE.Group(); up.rotation.z = 0.7; hip.add(up); const a = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), sk); a.position.x = 0.3; up.add(a); const kn = new THREE.Group(); kn.position.x = 0.6; kn.rotation.z = -1.9; up.add(kn); const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), sk); b.position.x = 0.35; kn.add(b); J.legs.push({ up, kn, k, s }); }
  return { root, body, J };
}
function poseSpider(h, e, dt) {
  const t = e.t + e.seed, moving = e.anim === 'walk';
  for (const L of h.J.legs) { const ph = t * (moving ? 12 : 1.5) + L.k * 1.6 + (L.s > 0 ? 0 : PI); L.up.rotation.z = 0.7 + Math.max(0, Math.sin(ph)) * (moving ? 0.35 : 0.05) + (e.anim === 'dead' ? 0.9 : 0); L.up.rotation.y = Math.cos(ph) * (moving ? 0.25 : 0.03); L.kn.rotation.z = e.anim === 'dead' ? -2.6 : -1.9; }
  h.body.rotation.x = e.anim === 'spit' ? -0.35 : 0; h.body.position.y = e.anim === 'dead' ? -0.25 : Math.sin(t * 2) * 0.01;
}
// 培養槽の中の標本
function makeSpecimen(kind) { const h = makeHuman(kind === 'boss' ? 'boss' : 'hunter'); const P = {}; poseZombie(h, { anim: 'curl', t: 0, seed: 0 }, 10); applyPose(h, { py: -0.3, thL: [-1.6, 0, 0.1], thR: [-1.6, 0, -0.1], shL: [1.8, 0, 0], shR: [1.8, 0, 0], spine: [0.7, 0, 0], head: [0.5, 0, 0], uaL: [-0.8, 0, -0.3], uaR: [-0.8, 0, 0.3], faL: [-1.6, 0, 0], faR: [-1.6, 0, 0] }, 10, 100); h.root.scale.setScalar(kind === 'boss' ? 0.9 : 0.85); return h.root; }
// 動かない亡骸（姿勢を決めて固める）
function makeCorpse(key, pose = 'back') {
  const h = makeHuman(key); const P = pose === 'sit' ? { py: -0.62, thL: [-1.5, 0, 0.15], thR: [-1.45, 0, -0.1], shL: [0.4, 0, 0], spine: [-0.3, 0, 0.1], head: [0.6, 0.4, 0.3], uaL: [0.1, 0, 0.4], uaR: [0.1, 0, -0.5], faL: [-0.2, 0, 0] } : pose === 'front' ? { bx: PI / 2, by: 0.12, uaL: [-2.6, 0, -0.2], uaR: [-0.2, 0, -0.5], head: [-0.6, 0.9, 0], thL: [0.1, 0, 0.15] } : { bx: -PI / 2, by: 0.12, uaL: [-0.2, 0, 1.1], uaR: [-2.4, 0, -0.3], thL: [-0.3, 0, 0.1], shL: [0.4, 0, 0], head: [0.2, 0.8, 0] };
  applyPose(h, P, 10, 100); return h.root;
}
// ── ヘリ ──
function makeHeli() {
  const root = new THREE.Group(); const b = gbMesh(g => { const m = M('col', { c: '#2c3a2c' }), dk = M('col', { c: '#151a15' }), gl = M('col', { c: '#8aa0b0', e: '#203040' });
    g.box(m, 0, 1.2, 0, 1.8, 1.6, 3.6); g.box(gl, 0, 1.4, 1.9, 1.6, 1.0, 0.3); g.box(m, 0, 1.6, -3.4, 0.4, 0.5, 3.4); g.box(m, 0, 2.2, -5.0, 0.12, 1.2, 0.8); g.box(dk, 0, 2.05, 0, 0.6, 0.3, 1.2);
    for (const s of [-1, 1]) { g.box(dk, s * 0.8, 0.1, 0, 0.08, 0.08, 3.2); g.box(dk, s * 0.7, 0.35, 0.8, 0.06, 0.5, 0.06); g.box(dk, s * 0.7, 0.35, -0.8, 0.06, 0.5, 0.06); }
    g.box(M('col', { c: '#c8a030' }), 0, 1.0, 0, 1.82, 0.12, 2.0); });
  root.add(b); const rotor = new THREE.Group(); rotor.position.set(0, 2.3, 0); for (let i = 0; i < 2; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(9, 0.04, 0.3), M('col', { c: '#111' })); bl.rotation.y = i * PI / 2; rotor.add(bl); } root.add(rotor);
  const tr = new THREE.Group(); tr.position.set(0.15, 2.2, -5.0); const tb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.15), M('col', { c: '#111' })); tr.add(tb); root.add(tr);
  const spot = new THREE.SpotLight('#fff8e0', 0, 30, 0.35, 0.6, 1); spot.position.set(0, 0.6, 1.6); spot.target.position.set(0, -5, 4); root.add(spot); root.add(spot.target);
  root.userData = { rotor, tr, spot }; return root;
}

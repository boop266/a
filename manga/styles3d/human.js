/* =========================================================
   manga/styles3d/human.js — 人物（マネキンではない人の形）
   ・頭身（art.headRatio）と崩し（art.deform）で体の比率が変わる：劇画の8頭身からゆるかわの2〜3頭身まで
   ・胴体は腰・胴・胸の関節の向きに沿ってつながった一枚の形（肩と腰のねじれがそのまま出る）
   ・腕と脚はひと続きの管（球の関節を見せない）。手は指の関節つき（扇・鉤爪・こぶし・握り・指差し・自然）
   ・顔：鼻と鼻の穴・顎の下・眉・目・耳（真下からでも形が読める）。髪は動きの向きへ流れる
   ・服：シャツとズボン／コート（裾が遅れて弧を描く・ベルト・縦のひだ）／スカート（回転で円盤状に広がる）
   ・ポーズ：重心線と、肩と腰のひねり。跳ぶ・走る・回る・手を伸ばす・膝を抱える・蹴る・叫ぶ など
   すべてオリジナルの形。M3.Actors に足す（rig は互換のまま、比率を受け付けるようにする）
   ========================================================= */
(() => {
  const M3 = window.Manga3D; if (!M3 || !M3.THREE || !M3.Actors) return;
  const T = M3.THREE, A = M3.Actors;
  const { rand, rr, clamp, lerp, noise3, V3, M, displace, tube, lathe } = M3;
  const PI = Math.PI, D2R = PI / 180;
  const ell = (rx, ry, rz, ws = 18, hs = 12) => { const g = new T.SphereGeometry(1, ws, hs); g.scale(rx, ry, rz); return g; };

  // ---------- ポーズ（足す・直す） ----------
  // 角度は度。+X：背骨は前へ曲がる／手足は後ろへ。-X：脚・腕が前へ。膝は +X で曲がる。肘は -X で曲がる。+Z：左手足が外へ
  const NEW = {
    // 立つ：重心は右足。腰は傾き、肩は逆へ傾く（コントラポスト）
    stand: { hips: [0, 8, -4], spine: [0, -4, 3], chest: [0, -6, 3], neck: [4, 4, -2], shL: [4, 0, 8], elL: [-12, 0, 0], shR: [-6, 0, -10], elR: [-22, 0, 0], hipL: [-6, 0, 6], knL: [12, 0, 0], anL: [-4, 0, 0], hipR: [2, 0, -2], hands: { L: 'relaxed', R: 'relaxed' } },
    walk: { hips: [4, 12, -2], spine: [2, -6, 0], chest: [2, -14, 2], neck: [0, 8, 0], shL: [22, 0, 8], elL: [-15, 0, 0], shR: [-25, 0, -8], elR: [-30, 0, 0], hipL: [-25, 0, 2], knL: [10, 0, 0], hipR: [18, 0, -2], knR: [25, 0, 0], anR: [-10, 0, 0], hands: { L: 'relaxed', R: 'relaxed' }, motion: [0, 0, 0.5] },
    // 走る：前傾。前の腕と後ろの脚が対角にそろう。肩と腰が逆にひねれる
    run: { root: { y: 0.05 }, hips: [18, 16, 0], spine: [8, -6, 0], chest: [6, -24, 0], neck: [-18, 10, 0], head: [-6, 0, 0], shL: [55, 0, 12], elL: [-75, 0, 0], shR: [-70, 0, -12], elR: [-90, 0, 0], hipL: [-78, 0, 4], knL: [82, 0, 0], anL: [-20, 0, 0], hipR: [32, 0, -4], knR: [100, 0, 0], anR: [35, 0, 0], hands: { L: 'fist', R: 'fist' }, motion: [0, 0, 1] },
    // 跳ぶ：膝を胸へ引き寄せ、腕は左右ちがう向きに広げる。体幹は弓なり。足の裏が見える
    jump: { root: { y: 0.6 }, hips: [-18, 12, 0], spine: [-12, -4, 0], chest: [-10, -14, 0], neck: [-12, 12, 0], head: [-8, 0, 0], hipL: [-118, 0, 12], knL: [138, 0, 0], anL: [-35, 0, 0], hipR: [-62, 0, -14], knR: [118, 0, 0], anR: [30, 0, 0], shL: [-150, 0, 38], elL: [-25, 0, 0], shR: [35, 0, -72], elR: [-45, 0, 0], hands: { L: 'fan', R: 'fan' }, motion: [0, 1, 0.4] },
    // 回る：片足で立ち、もう片足は曲げる。腕を大きく開く。裾は円盤状に広がる
    spin: { hips: [0, 28, 0], spine: [0, -12, 0], chest: [0, -22, -6], neck: [0, 34, 6], shL: [-10, 0, 82], elL: [-12, 0, 0], shR: [-28, 0, -72], elR: [-38, 0, 0], hipL: [-8, 0, 6], hipR: [-55, 0, -22], knR: [95, 0, 0], anR: [30, 0, 0], hands: { L: 'fan', R: 'fan' }, spin: 1, flare: 0.9 },
    // 手を伸ばす：手前（+Z）へ腕を突き出す。手のひらがこちらを向く（短縮法）
    reach: { hips: [6, 4, 0], spine: [8, 0, 0], chest: [12, -10, 0], neck: [-14, 6, 0], head: [-4, 0, 0], aim: { R: { dir: [0.12, 0.1, 1], palm: [0, 0, 1], up: [0.1, 1, 0.15] } }, shL: [24, 0, 14], elL: [-60, 0, 0], hipL: [-30, 0, 6], knL: [28, 0, 0], hipR: [16, 0, -6], knR: [12, 0, 0], hands: { L: 'claw', R: 'fan' }, motion: [0, 0, 0.6] },
    // 膝を抱えて座る（真上から見るとほぼ円になる）
    crouch: { root: { sit: 0.13 }, hips: [-28, 0, 0], spine: [26, 0, 0], chest: [22, 0, 0], neck: [26, 0, 0], head: [14, 0, 0], hipL: [-122, 0, 10], knL: [148, 0, 0], anL: [-20, 0, 0], hipR: [-122, 0, -10], knR: [148, 0, 0], anR: [-20, 0, 0], shL: [-62, -18, 16], elL: [-100, 0, 0], shR: [-62, 18, -16], elR: [-100, 0, 0], hands: { L: 'grip', R: 'grip' } },
    // 前蹴り：靴の裏を前へ突き出す
    kick: { hips: [-14, 10, 0], spine: [-12, 0, 0], chest: [-6, -14, 0], neck: [10, 10, 0], hipR: [-100, 0, -6], knR: [14, 0, 0], anR: [-55, 0, 0], hipL: [8, 0, 6], knL: [18, 0, 0], shL: [-30, 0, 42], elL: [-75, 0, 0], shR: [32, 0, -38], elR: [-62, 0, 0], hands: { L: 'fist', R: 'fist' }, motion: [0, 0, 0.8] },
    // 叫ぶ：上体を反らし、鉤爪のように曲げた両手を顔の横へ
    scream: { spine: [-10, 0, 0], chest: [-12, 0, 0], neck: [-18, 0, 0], head: [-16, 0, 0], shL: [-115, 30, 24], elL: [-112, 0, 0], shR: [-115, -30, -24], elR: [-112, 0, 0], hipL: [-5, 0, 9], hipR: [5, 0, -9], knL: [8, 0, 0], hands: { L: 'claw', R: 'claw' }, expr: 'scream' },
  };
  // 既存のポーズに手の形を足す（形は保つ）
  const HANDS = { slash: { L: 'grip', R: 'grip' }, guard: { L: 'grip', R: 'grip' }, raise: { L: 'fan', R: 'fist' }, fallen: { L: 'fan', R: 'relaxed' }, lookup: { L: 'relaxed', R: 'relaxed' }, kneel: { L: 'relaxed', R: 'fist' } };
  for (const [k, h] of Object.entries(HANDS)) if (A.POSES[k] && !A.POSES[k].hands) A.POSES[k].hands = h;
  if (A.POSES.raise) A.POSES.raise.expr = 'shout';
  // 走る・立つ・歩くは新しい形に（ひねりと重心線）。ほかは足す
  Object.assign(A.POSES, NEW);
  Object.assign(A.POSE_ALIAS, { jump: 'jump', 跳ぶ: 'jump', ジャンプ: 'jump', leap: 'jump', dance: 'spin', turn: 'spin', 回る: 'spin', reach: 'reach', 手を伸ばす: 'reach', point: 'reach', crouch: 'crouch', sit: 'crouch', hug: 'crouch', しゃがむ: 'crouch', 座る: 'crouch', kick: 'kick', 蹴る: 'kick', scream: 'scream', 叫ぶ: 'scream', shout: 'raise', fear: 'scream' });

  // ---------- 骨組み（比率つき） ----------
  // 標準：身長 1.8m、頭 0.235m（約7.7頭身）。headRatio が小さいほど頭が大きく、体と手足が短くなる
  const JOINTS = [
    ['hips', null, [0, 0.98, 0]], ['spine', 'hips', [0, 0.1, 0]], ['chest', 'spine', [0, 0.22, 0]], ['neck', 'chest', [0, 0.22, 0]], ['head', 'neck', [0, 0.1, 0]],
    ['shL', 'chest', [0.19, 0.16, 0]], ['elL', 'shL', [0, -0.3, 0]], ['haL', 'elL', [0, -0.26, 0]],
    ['shR', 'chest', [-0.19, 0.16, 0]], ['elR', 'shR', [0, -0.3, 0]], ['haR', 'elR', [0, -0.26, 0]],
    ['hipL', 'hips', [0.1, -0.06, 0]], ['knL', 'hipL', [0, -0.45, 0]], ['anL', 'knL', [0, -0.44, 0]],
    ['hipR', 'hips', [-0.1, -0.06, 0]], ['knR', 'hipR', [0, -0.45, 0]], ['anR', 'knR', [0, -0.44, 0]],
  ];
  function proportions(o = {}) {
    let hr = Number(o.headRatio); if (!Number.isFinite(hr)) hr = 7.66; if (hr <= 1) hr = lerp(8, 2, clamp(hr)); hr = clamp(hr, 2, 9);
    const H = 1.8 * ((o.height ?? 1.8) / 1.8), head = H / hr, body = H - head;
    const d = clamp(o.deform ?? 0);
    return { hr, bs: body / 1.565, hs: head / 0.235, girth: 1 + d * 0.5 + Math.max(0, 5 - hr) * 0.22, d };
  }
  function rig(pose, o = {}) {
    const P = typeof pose === 'object' ? pose : A.POSES[A.POSE_ALIAS[pose] || pose] || A.POSES.stand;
    const s = (o.height ?? 1.8) / 1.8, pr = proportions(o), bs = pr.bs / s; // bs は身長に対する体の割合（s をかけて使う）
    const J = {}, root = new T.Object3D();
    for (const [name, par, off] of JOINTS) {
      const j = new T.Object3D(); const k = s * pr.bs / (s || 1);
      const sy = name === 'head' ? 0.62 * lerp(1, pr.hs, 0.15) : name === 'neck' ? 0.92 : 1;   // 首は短く
      j.position.set(off[0] * k * (name.startsWith('sh') ? lerp(1, 1.15, pr.d) : 1), off[1] * k * sy, off[2] * k);
      const r = P[name]; if (r) j.rotation.set(r[0] * D2R, r[1] * D2R, r[2] * D2R, 'YXZ');
      (par ? J[par] : root).add(j); J[name] = j;
    }
    const rt = P.root || {};
    root.updateMatrixWorld(true);
    if (rt.lie) { root.rotation.set(-PI / 2, 0, 0); root.position.set(0, 0.16 * s * pr.bs, 0.98 * s * pr.bs); root.updateMatrixWorld(true); }
    else if (rt.sit != null) { const hy = J.hips.getWorldPosition(V3()).y; root.position.y += rt.sit * s * pr.bs + 0.06 * s * pr.bs - hy; }
    else { const ya = Math.min(J.anL.getWorldPosition(V3()).y, J.anR.getWorldPosition(V3()).y); root.position.y = 0.075 * s * pr.bs - ya + (rt.y ?? 0) * s; }
    const outer = new T.Object3D(); outer.add(root);
    outer.position.set(...(o.pos || [0, 0, 0])); outer.rotation.y = (o.yaw ?? 0) * D2R;
    outer.updateMatrixWorld(true);
    return { J, s, root: outer, P, pr, k: s * pr.bs };
  }
  // 腕を向きで決める：dir（体の向きの座標：+Z が前）へ腕をまっすぐ伸ばし、手のひらを palm の向きへ、指を up の向きへ
  function aimArms(R, aim, yaw) {
    const rotY = new T.Quaternion().setFromAxisAngle(V3(0, 1, 0), yaw);
    for (const [S, a] of Object.entries(aim || {})) {
      const sh = R.J['sh' + S], el = R.J['el' + S], ha = R.J['ha' + S], sg = S === 'L' ? 1 : -1;
      const d = V3(...a.dir).normalize().applyQuaternion(rotY);
      const setWorld = (j, qw) => { const pq = new T.Quaternion(); j.parent.getWorldQuaternion(pq); j.quaternion.copy(pq.invert().multiply(qw)); j.updateMatrixWorld(true); };
      // 肩：-Y を d へ
      setWorld(sh, new T.Quaternion().setFromUnitVectors(V3(0, -1, 0), d));
      setWorld(el, new T.Quaternion().setFromUnitVectors(V3(0, -1, 0), d));
      // 手：指（-Y）を up へ、手のひら（-sg*X）を palm へ
      const f = V3(...(a.up || [0, 1, 0])).applyQuaternion(rotY).normalize();
      let n = V3(...(a.palm || a.dir)).applyQuaternion(rotY).normalize();
      n.addScaledVector(f, -n.dot(f)).normalize();
      const yAx = f.clone().negate(), xAx = n.clone().multiplyScalar(-sg), zAx = V3().crossVectors(xAx, yAx).normalize();
      const m = new T.Matrix4().makeBasis(xAx, yAx, zAx);
      setWorld(ha, new T.Quaternion().setFromRotationMatrix(m));
    }
  }
  const W = j => j.matrixWorld.clone();
  const wp = j => j.getWorldPosition(V3());
  const lp = (j, x, y, z) => j.localToWorld(V3(x, y, z));

  // ---------- 形の道具 ----------
  // 断面をつないだ胴体：sec = [{ j: 関節, y, rx, rzF(前), rzB(後ろ), x? }]。関節の向きがそのまま断面の向きになる
  function loft(sec, n = 22) {
    const pos = [], idx = [], arc = []; let acc = 0, prev = null;
    for (let i = 0; i < sec.length; i++) {
      const c = sec[i], ctr = lp(c.j, c.x || 0, c.y, c.z || 0);
      if (prev) acc += ctr.distanceTo(prev); prev = ctr;
      for (let k = 0; k < n; k++) {
        const a = k / n * PI * 2, sa = Math.sin(a), ca = Math.cos(a);
        const rz = ca > 0 ? c.rzF : c.rzB;
        // 角を少し四角く（胸郭・骨盤らしく）
        const sq = c.sq ?? 0.15, ex = Math.sign(sa) * Math.pow(Math.abs(sa), 1 - sq), ez = Math.sign(ca) * Math.pow(Math.abs(ca), 1 - sq);
        const p = lp(c.j, (c.x || 0) + ex * c.rx, c.y, (c.z || 0) + ez * rz);
        pos.push(p.x, p.y, p.z); arc.push(acc);
      }
    }
    for (let i = 0; i < sec.length - 1; i++) for (let k = 0; k < n; k++) { const a = i * n + k, b = i * n + (k + 1) % n, c = a + n, d = b + n; idx.push(a, b, c, b, d, c); }
    const c0 = pos.length / 3; const e0 = lp(sec[0].j, sec[0].x || 0, sec[0].y - 0.01, 0); pos.push(e0.x, e0.y, e0.z); arc.push(0);
    const c1 = c0 + 1; const last = sec[sec.length - 1]; const e1 = lp(last.j, last.x || 0, last.y + 0.01, 0); pos.push(e1.x, e1.y, e1.z); arc.push(acc);
    const L = (sec.length - 1) * n;
    for (let k = 0; k < n; k++) { idx.push(c0, k, (k + 1) % n); idx.push(c1, L + (k + 1) % n, L + k); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('aU', new T.Float32BufferAttribute(arc, 1)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  // 点の列をなめらかに（カトマル）
  function smooth(pts, per = 4) {
    const P = pts.map(p => p.clone ? p : V3(...p)), out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push(V3(0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
          0.5 * (2 * p1.z + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3))); }
    }
    out.push(P[P.length - 1]); return out;
  }
  // 太さの曲線 prof（[t, r]）に沿う管
  function limbTube(pts, prof, seg = 12, flat) {
    const S = smooth(pts, 5); const L = []; let acc = 0; L.push(0); for (let i = 1; i < S.length; i++) { acc += S[i].distanceTo(S[i - 1]); L.push(acc); }
    const rad = L.map(l => interp(prof, l / (acc || 1)));
    return tube(S.map(v => v.toArray()), rad, seg, { flat });
  }
  function interp(prof, t) { for (let i = 1; i < prof.length; i++) if (t <= prof[i][0]) { const a = prof[i - 1], b = prof[i]; const u = (t - a[0]) / (b[0] - a[0] || 1); const s = u * u * (3 - 2 * u); return a[1] + (b[1] - a[1]) * s; } return prof[prof.length - 1][1]; }

  // ---------- 手：指の関節つき ----------
  // 手の形：relaxed（自然）fist（こぶし）fan（扇に開く）claw（鉤爪）grip（握る）point（指差し）
  const HAND = {
    relaxed: { spread: 0.06, c: [[0.25, 0.35, 0.25], [0.3, 0.42, 0.3], [0.38, 0.5, 0.35], [0.48, 0.6, 0.4]], th: [0.35, 0.25] },
    fist: { spread: 0, c: [[1.5, 1.65, 1.1], [1.55, 1.7, 1.1], [1.55, 1.7, 1.1], [1.5, 1.7, 1.1]], th: [0.9, 0.7], thIn: 1 },
    fan: { spread: 0.26, c: [[0.02, 0.1, 0.06], [0.12, 0.14, 0.08], [0.22, 0.25, 0.15], [0.32, 0.38, 0.22]], th: [0.05, 0.1], thOut: 1 },
    claw: { spread: 0.2, c: [[0.25, 1.15, 1.05], [0.35, 1.25, 1.1], [0.42, 1.25, 1.1], [0.5, 1.3, 1.0]], th: [0.5, 0.8], thOut: 0.6 },
    grip: { spread: 0.02, c: [[1.15, 1.35, 0.9], [1.2, 1.4, 0.95], [1.25, 1.45, 0.95], [1.3, 1.45, 0.9]], th: [0.75, 0.45], thIn: 0.6 },
    point: { spread: 0.05, c: [[0.0, 0.05, 0.04], [1.55, 1.7, 1.1], [1.55, 1.7, 1.1], [1.5, 1.7, 1.1]], th: [0.9, 0.7], thIn: 1 },
  };
  function hand(B, J, sg, style, sc, op) {
    const H = HAND[style] || HAND.relaxed;
    const m = J.matrixWorld;
    const toW = (x, y, z) => V3(x, y, z).applyMatrix4(m);
    const pn = V3(-sg, 0, 0);                 // 手のひらの向き（手の座標）
    const add = (g, mm, o = {}) => B.add(g, mm, Object.assign({}, op, o));
    // 手のひら：平たい卵形＋親指の付け根のふくらみ
    add(ell(0.017 * sc, 0.048 * sc, 0.042 * sc, 14, 10), m.clone().multiply(M([0, -0.048 * sc, 0])));
    add(ell(0.016 * sc, 0.026 * sc, 0.018 * sc, 10, 8), m.clone().multiply(M([-sg * 0.006 * sc, -0.03 * sc, 0.03 * sc], [0, 0, 0])));
    const lens = [[0.044, 0.028, 0.02], [0.048, 0.031, 0.022], [0.045, 0.029, 0.021], [0.036, 0.022, 0.018]];
    const zs = [0.03, 0.01, -0.01, -0.029];
    for (let f = 0; f < 4; f++) {
      const spread = (1.5 - f) * H.spread * (f === 3 ? 1.3 : 1);
      let dir = V3(0, -Math.cos(spread), Math.sin(spread)).normalize();
      let p = V3(0, -0.092 * sc + Math.abs(f - 1.3) * 0.004 * sc, zs[f] * sc);
      const pts = [p.clone()];
      for (let k = 0; k < 3; k++) {
        const axis = V3().crossVectors(dir, pn).normalize();
        dir.applyAxisAngle(axis, -(H.c[f][k] + (rand() - 0.5) * 0.08));     // 手のひら側へ曲げる
        p = p.clone().addScaledVector(dir, lens[f][k] * sc); pts.push(p.clone());
      }
      // 指：付け根が太く先へ細る。関節（第2・第3）で少しふくらみ、指先は丸い。手のひら側にやや平たい
      const r0 = 0.0102 * sc * (f === 3 ? 0.85 : 1);
      const L = [0, lens[f][0], lens[f][0] + lens[f][1], lens[f][0] + lens[f][1] + lens[f][2]]; const tot = L[3];
      const kn1 = L[1] / tot, kn2 = L[2] / tot;
      const prof = [[0, r0], [kn1 - 0.1, r0 * 0.86], [kn1, r0 * 0.95], [kn1 + 0.08, r0 * 0.8], [kn2 - 0.06, r0 * 0.72], [kn2, r0 * 0.8], [kn2 + 0.06, r0 * 0.68], [0.92, r0 * 0.6], [1, r0 * 0.38]];
      add(limbTube(pts.map(v => toW(v.x, v.y, v.z)), prof, 8, 0.85), null, { ring: false });
      const tip = toW(pts[3].x, pts[3].y, pts[3].z); add(ell(r0 * 0.5, r0 * 0.5, r0 * 0.5, 7, 5), M(tip.toArray()), { ring: false });   // 指先の丸み
    }
    // 親指
    let dir = V3(0, -0.55, 1).normalize().addScaledVector(pn, 0.45 - (H.thOut || 0) * 0.5 + (H.thIn || 0) * 0.2).normalize();
    let p = V3(-sg * 0.008 * sc, -0.028 * sc, 0.035 * sc); const pts = [p.clone()];
    const tl = [0.03, 0.026, 0.022];
    for (let k = 0; k < 3; k++) {
      if (k > 0) { const axis = V3().crossVectors(dir, pn).normalize(); dir.applyAxisAngle(axis, -(H.th[k - 1]) * 0.9); if (H.thIn) dir.addScaledVector(V3(0, -0.6, -1), 0.35 * H.thIn).normalize(); }
      p = p.clone().addScaledVector(dir, tl[k] * sc); pts.push(p.clone());
    }
    add(limbTube(pts.map(v => toW(v.x, v.y, v.z)), [[0, 0.0135 * sc], [0.4, 0.0115 * sc], [0.5, 0.0122 * sc], [0.62, 0.0102 * sc], [0.92, 0.0078 * sc], [1, 0.005 * sc]], 8, 0.85), null, { ring: false });
  }

  // ---------- 頭：顔の造作と髪 ----------
  function head(B, R, o, op) {
    const J = R.J.head, k = R.k, hs = R.pr.hs * R.s, sc = hs;
    const m = J.matrixWorld;
    const H = (g, p, r = [0, 0, 0], s = 1, x = {}) => B.add(g, m.clone().multiply(M([p[0] * sc, p[1] * sc, p[2] * sc], r, Array.isArray(s) ? s.map(v => v * sc) : s * sc)), Object.assign({}, op, x));
    const chibi = clamp((R.pr.hs - 1.2) / 1.5);         // 頭が大きいほど、顔は丸く・目は大きく
    const skin = { tone: o.skinTone ?? 0.04, pat: 'skin' };
    H(ell(0.09, 0.104, 0.102, 24, 18), [0, 0.118, -0.01], [0, 0, 0], 1, skin);                          // 頭蓋
    H(ell(0.068 + chibi * 0.014, 0.07, 0.07, 20, 14), [0, 0.06 + chibi * 0.01, 0.012], [0.22, 0, 0], 1, skin);  // 頬と顎
    H(ell(0.026, 0.022, 0.026, 10, 8), [0, 0.004 + chibi * 0.022, 0.052 - chibi * 0.006], [0, 0, 0], 1, skin);  // 顎先
    for (const s of [-1, 1]) H(ell(0.034, 0.011, 0.02, 10, 6), [s * 0.033, 0.122, 0.079], [0.15, s * 0.25, s * -0.12], 1, skin);  // 眉の骨（左右）
    // 鼻：鼻すじ→鼻先。前へ少し下向きに突き出す
    const nose = lathe([[0.0001, 0], [0.011, 0.006], [0.0125, 0.026], [0.009, 0.04], [0.0001, 0.044]], 8, 1.1, 0.75);
    if (chibi < 0.5) H(nose, [0, 0.104 - chibi * 0.012, 0.082 + chibi * 0.006], [PI / 2 + 0.55, 0, 0], [1, lerp(1, 0.45, chibi), 1], skin);
    else H(ell(0.006, 0.004, 0.004, 6, 4), [0, 0.08, 0.098], [0, 0, 0], 1, skin);   // 頭の大きい絵柄：鼻は小さな点
    for (const s of [-1, 1]) {
      if (chibi < 0.5) H(ell(0.0045, 0.0028, 0.0045, 6, 5), [s * 0.0075, 0.069 - chibi * 0.008, 0.1 + chibi * 0.002], [0, 0, 0], 1, { tone: 1, pat: 'plain' });  // 鼻の穴（下から見える）
      H(ell(0.011, 0.028, 0.019, 10, 8), [s * 0.091, 0.098, -0.008], [0, s * 0.2, 0], 1, skin);         // 耳
      // 目：白目とひとみ。頭が大きい絵柄ほど大きく
      const es = 1 + chibi * 1.25, ey = 0.104 - chibi * 0.014;
      const wide = (o.expr === 'scream' ? 1.7 : 1);
      H(ell(0.0135 * es * lerp(1, 0.72, chibi), (0.006 + chibi * 0.008) * es * wide, 0.007, 10, 8), [s * 0.032, ey, 0.083 + chibi * 0.008], [0, s * 0.32, 0], 1, { tone: 0.0, pat: 'plain' });
      H(ell(0.0058 * es * lerp(1, 1.15, chibi), 0.0072 * es * lerp(1, 1.3, chibi), 0.005, 8, 6), [s * 0.032, ey, 0.0885 + chibi * 0.009], [0, s * 0.32, 0], 1, { tone: 1, pat: 'plain' });
      if (chibi < 0.35) H(new T.BoxGeometry(0.026 * es, 0.0026, 0.005), [s * 0.032, ey + 0.0068 * es * wide, 0.0865], [0, s * 0.32, s * -0.1], 1, { tone: 1, pat: 'plain' });   // まぶたの線（大人の頭身だけ）
      else H(ell(0.0022 * es, 0.0026 * es, 0.002, 6, 4), [s * 0.032 - 0.002 * es, ey + 0.002 * es, 0.0925 + chibi * 0.01], [0, s * 0.32, 0], 1, { tone: 0, pat: 'plain' });   // 目の光
    }
    // 口：叫び（縦長に大きく開く・歯）か、閉じた線
    if (o.expr === 'scream' || o.expr === 'shout') {
      H(ell(0.02, 0.028, 0.014, 12, 8), [0, 0.03, 0.07], [0.15, 0, 0], 1, { tone: 1, pat: 'plain' });
      H(new T.BoxGeometry(0.028, 0.006, 0.008), [0, 0.053, 0.076], [0, 0, 0], 1, { tone: 0.02, pat: 'plain' });
      H(new T.BoxGeometry(0.022, 0.005, 0.008), [0, 0.008, 0.074], [0, 0, 0], 1, { tone: 0.02, pat: 'plain' });
    } else H(new T.BoxGeometry(0.026, 0.0035, 0.006), [0, 0.045 + chibi * 0.008, 0.078], [0, 0, 0], 1, { tone: 1, pat: 'plain' });
    // 髪：頭頂を覆う帽子形＋毛束（動きの向きへ流れる）
    const style = o.hair ?? 'short';
    if (style === 'none') return;
    const hairOp = { tone: o.hairTone ?? 0.82, pat: 'hair' };
    const cap = new T.SphereGeometry(1, 22, 12, 0, PI * 2, 0, PI * 0.5); cap.scale(0.096, 0.112, 0.108);
    H(cap, [0, 0.124, -0.02], [-0.55, 0, 0], 1, hairOp);
    const flow = (o.flow || V3(0, -1, -0.3)).clone();   // ワールドの向き
    const n = style === 'long' ? 34 : style === 'spiky' ? 22 : 26;
    for (let i = 0; i < n; i++) {
      // 頭頂のつむじから放射状に。前は額の上で止め、横と後ろは下へ
      const a = (i / n) * PI * 2 + rr(-0.1, 0.1), ca = Math.cos(a);
      const el = (ca > 0.55 ? rr(0.22, 0.36) : rr(0.3, 0.55)) * PI;
      const dirL = V3(Math.sin(a) * Math.sin(el), Math.cos(el), ca * Math.sin(el));
      const r0 = V3(dirL.x * 0.1, 0.124 + dirL.y * 0.112, -0.02 + dirL.z * 0.108);
      const base = V3(r0.x * sc, r0.y * sc, r0.z * sc).applyMatrix4(m);
      const out = dirL.clone().transformDirection(m);
      const front = ca > 0.55;
      const hk = lerp(1, 0.55, chibi);
      const len = hk * (style === 'long' ? (front ? rr(0.06, 0.1) : rr(0.25, 0.42)) : style === 'spiky' ? rr(0.09, 0.15) : (front ? rr(0.05, 0.08) : rr(0.07, 0.13))) * sc;
      const soft = chibi > 0.35 && style !== 'spiky';    // 頭の大きい絵柄：とがらせず、丸くまとまった房に
      const g = style === 'spiky' ? 0.15 : soft ? 0.9 : 0.75;
      const pts = [base]; let d = out.clone().multiplyScalar(1 - g * 0.6).addScaledVector(flow, g).normalize();
      if (front) d.addScaledVector(V3(0, -1, 0.3).transformDirection(m), 0.6).normalize();
      for (let k = 1; k <= 4; k++) { d.addScaledVector(flow, style === 'spiky' ? 0.05 : 0.22).normalize(); pts.push(pts[k - 1].clone().addScaledVector(d, len / 4).addScaledVector(out, len * 0.05)); }
      if (soft) { // 房の先を頭へ寄せ、太く丸い先にする
        const c0 = V3(0, 0.12 * sc, -0.01 * sc).applyMatrix4(m);
        for (let k = 2; k <= 4; k++) pts[k].lerp(c0, 0.06 * (k - 1));
        B.add(tube(pts.map(v => v.toArray()), [0.03, 0.03, 0.026, 0.018, 0.009].map(r => r * sc * hk * 1.25), 8), null, Object.assign({}, op, hairOp, { ring: false }));
      } else B.add(tube(pts.map(v => v.toArray()), [0.024, 0.019, 0.012, 0.006, 0.0008].map(r => r * sc * hk * (style === 'long' ? 1.05 : 1)), 6), null, Object.assign({}, op, hairOp, { ring: false }));
    }
  }

  // ---------- 体 ----------
  function humanBody(B, R, o = {}) {
    const { J, k, pr } = R, g = pr.girth * lerp(0.92, 1.12, o.build ?? 0.5), id = o.id ?? B.newId();
    const fem = o.female ? 1 : 0;
    const op = { id };
    const skin = Object.assign({ tone: o.skinTone ?? 0.04, pat: 'skin', ring: true }, op);
    const top = Object.assign({ tone: o.topTone ?? 0.1, pat: 'cloth' }, op);
    const bottom = Object.assign({ tone: o.bottomTone ?? 0.55, pat: 'cloth' }, op);
    const shoe = Object.assign({ tone: 0.85, pat: 'plain' }, op);
    const K = v => v * k, G = v => v * k * g;
    // 胴：骨盤→腰のくびれ→胸郭→肩→首の付け根。関節ごとの向きに沿う（ねじれが出る）
    const torso = loft([
      { j: J.hips, y: K(-0.09), rx: G(0.15 + fem * 0.025), rzF: G(0.1), rzB: G(0.115) },
      { j: J.hips, y: K(0.0), rx: G(0.155 + fem * 0.02), rzF: G(0.1), rzB: G(0.11) },
      { j: J.spine, y: K(0.0), rx: G(0.135 - fem * 0.02), rzF: G(0.095), rzB: G(0.09) },
      { j: J.spine, y: K(0.12), rx: G(0.145 - fem * 0.01), rzF: G(0.105), rzB: G(0.095) },
      { j: J.chest, y: K(0.04), rx: G(0.165), rzF: G(0.118 + fem * 0.02), rzB: G(0.1) },
      { j: J.chest, y: K(0.14), rx: G(0.185), rzF: G(0.11), rzB: G(0.095), sq: 0.3 },
      { j: J.chest, y: K(0.2), rx: G(0.16), rzF: G(0.075), rzB: G(0.07), sq: 0.3 },
      { j: J.chest, y: K(0.235), rx: G(0.07), rzF: G(0.055), rzB: G(0.055) },
    ]);
    B.add(torso, null, o.outfit === 'none' ? skin : top);
    // 首（胸鎖乳突筋のすじ）
    B.add(limbTube([lp(J.chest, 0, K(0.19), 0), lp(J.neck, 0, K(0.04), K(0.005)), lp(J.head, 0, K(0.04), K(-0.005))], [[0, G(0.072)], [0.5, G(0.06)], [1, G(0.056)]], 14), null, skin);
    for (const s of [-1, 1]) B.add(ell(G(0.075), G(0.03), G(0.05), 12, 8), W(J.chest).multiply(M([s * K(0.075), K(0.205), K(-0.012)], [0, 0, s * -0.42])), o.sleeve === 'none' ? skin : top);   // 僧帽筋（首から肩への傾斜）
    for (const s of [-1, 1]) B.add(tube([lp(J.chest, s * K(0.025), K(0.2), K(0.06)).toArray(), lp(J.head, s * K(0.035), K(0.03), K(0.01)).toArray()], [G(0.013), G(0.01)], 6), null, skin);
    // 腕：肩からひと続き。三角筋のふくらみだけ球で
    for (const [S, s] of [['L', 1], ['R', -1]]) {
      const sh = wp(J['sh' + S]), el = wp(J['el' + S]), wr = wp(J['ha' + S]);
      B.add(ell(G(0.056), G(0.064), G(0.06)), W(J['sh' + S]).multiply(M([0, K(-0.025), 0])), o.sleeve === 'none' ? skin : top);
      const upper = [sh, V3().lerpVectors(sh, el, 0.5), el], lower = [el, V3().lerpVectors(el, wr, 0.4), wr];
      const sleeveLong = o.sleeve === 'long';
      B.add(limbTube([...upper, ...lower.slice(1)], [[0, G(0.054)], [0.22, G(0.052)], [0.42, G(0.043)], [0.53, G(0.038)], [0.62, G(0.043)], [0.85, G(0.032)], [1, G(0.026)]], 12), null, sleeveLong ? top : skin);
      if (!sleeveLong && o.sleeve !== 'none') {   // 半袖：袖口が少し広がる。端は開いている
        const sp = [lp(J['sh' + S], 0, K(0.01), 0), V3().lerpVectors(sh, el, 0.3), V3().lerpVectors(sh, el, 0.55)];
        B.add(tube(smooth(sp, 3).map(v => v.toArray()), [G(0.062), G(0.06), G(0.06), G(0.061), G(0.063), G(0.066), G(0.07)], 12, { cap: false }), null, Object.assign({}, top, { double: true }));
      }
      // 関節の内側のしわ（曲げると出る）
      const bend = V3().subVectors(sh, el).normalize().dot(V3().subVectors(wr, el).normalize());
      if (bend > -0.7 && sleeveLong) wrinkles(B, el, sh, wr, G(0.04), 3, top);
      hand(B, J['ha' + S], s, (o.hands || {})[S] || 'relaxed', K(1) * lerp(1, pr.hs / Math.max(pr.bs, 0.3), 0.18) * (1 + pr.d * 0.15), skin);
    }
    // 脚
    for (const S of ['L', 'R']) {
      const hp = wp(J['hip' + S]), kn = wp(J['kn' + S]), an = wp(J['an' + S]);
      const pts = [lp(J['hip' + S], 0, K(0.04), 0), V3().lerpVectors(hp, kn, 0.45), kn, V3().lerpVectors(kn, an, 0.3), an];
      B.add(limbTube(pts, [[0, G(0.092)], [0.2, G(0.084)], [0.45, G(0.06)], [0.5, G(0.054)], [0.6, G(0.058)], [0.72, G(0.052)], [1, G(0.036)]], 14), null, o.legs === 'bare' ? skin : bottom);
      const bend = V3().subVectors(hp, kn).normalize().dot(V3().subVectors(an, kn).normalize());
      if (bend > -0.8 && o.legs !== 'bare') wrinkles(B, kn, hp, an, G(0.055), 4, bottom);
      // 靴：つま先が少し上がった形。靴底は平ら（真下・前から靴の裏が見える）
      const sole = lathe([[0.0001, 0], [0.042, 0.01], [0.05, 0.08], [0.046, 0.18], [0.03, 0.245], [0.0001, 0.255]], 12, 1, 0.62); sole.rotateX(PI / 2); sole.translate(0, K(-0.045) / k, -0.06);
      B.add(sole, W(J['an' + S]).multiply(M([0, 0, 0], [0, 0, 0], K(1) * (1 + pr.d * 0.2))), shoe);
      B.add(new T.BoxGeometry(0.1, 0.012, 0.25), W(J['an' + S]).multiply(M([0, K(-0.07), K(0.065)], [0, 0, 0], K(1) * (1 + pr.d * 0.2))), Object.assign({}, shoe, { tone: 0.97 }));
    }
    // 腰ベルト
    B.add(new T.TorusGeometry(1, 0.06, 6, 24), W(J.hips).multiply(M([0, K(0.02), 0], [PI / 2, 0, 0], [G(0.158), G(0.112), G(0.3)])), Object.assign({ tone: 0.85, pat: 'plain' }, op));
    return id;
  }
  // 関節の内側に放射状のしわ（細い管を数本）
  function wrinkles(B, j, a, b, r, n, op) {
    const da = V3().subVectors(a, j).normalize(), db = V3().subVectors(b, j).normalize();
    const inner = V3().addVectors(da, db).normalize();            // 曲げた内側
    for (let i = 0; i < n; i++) {
      const t = (i - (n - 1) / 2) * 0.5, side = V3().crossVectors(da, db).normalize().multiplyScalar(t * r * 0.8);
      const p0 = j.clone().addScaledVector(inner, r * 0.95).add(side);
      const p1 = p0.clone().addScaledVector(da, r * (1.2 + 0.4 * rand())).addScaledVector(inner, -r * 0.1);
      const p2 = p0.clone().addScaledVector(db, r * (1.0 + 0.4 * rand())).addScaledVector(inner, -r * 0.1);
      B.add(tube([p1.toArray(), p0.toArray(), p2.toArray()], [r * 0.03, r * 0.07, r * 0.03], 5), null, Object.assign({}, op, { ring: false }));
    }
  }

  // ---------- 布：スカート・コートの裾（遅れてついてくる・回転で円盤に） ----------
  // 腰の関節から下げる。flare 0..1（1＝ほぼ水平の円盤）、trail（ワールドの向き：裾が流れる向き）、spin（回転のねじれ）
  function hem(B, R, o) {
    const { J, k, pr } = R; const g = pr.girth;
    const NX = 40, NY = 14, len = (o.len ?? 0.55) * k, rx0 = (o.rx ?? 0.165) * k * g, rz0 = (o.rz ?? 0.125) * k * g;
    const flare = clamp(o.flare ?? 0.15), trail = o.trail || V3(0, 0, 0), spin = o.spin || 0, folds = o.folds ?? 9;
    const m = J.hips.matrixWorld, y0 = (o.y0 ?? 0.02) * k;
    const pos = [], idx = [], s0 = rr(0, 50);
    const down = V3(0, -1, 0);
    const center = V3(0, y0, 0).applyMatrix4(m);
    const cut = [];
    for (let i = 0; i < NX; i++) cut.push(o.ragged ? NY - Math.floor(rand() * rand() * NY * 0.35) : NY);
    for (let j = 0; j <= NY; j++) {
      const v = j / NY;
      for (let i = 0; i <= NX; i++) {
        const a = i / NX * PI * 2;
        const waist = V3(Math.sin(a) * rx0, y0, Math.cos(a) * rz0).applyMatrix4(m);
        const radial = V3().subVectors(waist, center); radial.y = 0; radial.normalize();
        // ひだ：中心から放射（回るほど深く）
        const fold = Math.sin(a * folds + noise3(a, v, s0) * 1.5) * (0.35 + flare);
        const ang = lerp(0.1, 1.42, flare) * (0.85 + 0.15 * fold);
        const dir = down.clone().multiplyScalar(Math.cos(ang)).addScaledVector(radial, Math.sin(ang));
        const tan = V3(-radial.z, 0, radial.x);
        const p = waist.clone().addScaledVector(dir, v * len);
        p.addScaledVector(radial, fold * v * len * 0.06 * (1 + flare));
        p.y += Math.sin(a * folds) * flare * v * len * 0.1;                        // 円盤のふち：波打つ
        p.addScaledVector(tan, spin * v * v * len * 0.35);                          // 回転：裾が遅れてねじれる
        p.addScaledVector(trail, v * v * len);                                      // 動き：裾が後ろへ流れる
        if (o.front) { const fr = Math.max(0, Math.cos(a)); p.addScaledVector(trail, -fr * v * len * 0.15); }
        pos.push(p.x, p.y, p.z);
      }
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { if (j >= cut[i]) continue; if (o.open && Math.abs(i / NX - 0.0) < 0.04 || o.open && i / NX > 0.96) continue; const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    B.add(geo, null, { tone: o.tone ?? 0.6, pat: 'cloth', id: o.id ?? B.newId(), double: true });
  }

  // ---------- まとめ ----------
  // o: { pose, pos, yaw, height, headRatio, deform, build, female, outfit:'casual'|'coat'|'skirt'|'dress'|'none', hair:'short'|'long'|'spiky'|'none', hands:{L,R}, expr, weapon, tone... }
  function human(B, o = {}) {
    const R = rig(o.pose || 'stand', o);
    const P = R.P;
    const yaw = (o.yaw ?? 0) * D2R;
    if (P.aim || o.aim) aimArms(R, Object.assign({}, P.aim || {}, o.aim || {}), yaw);
    const toW = v => V3(...v).applyAxisAngle(V3(0, 1, 0), yaw);
    const motion = toW(P.motion || [0, 0, 0]);
    const outfit = o.outfit || 'casual';
    const hands = Object.assign({}, P.hands || {}, o.hands || {});
    const id = B.newId();
    const look = {
      casual: { topTone: 0.08, bottomTone: 0.55, sleeve: 'short' },
      coat: { topTone: 0.72, bottomTone: 0.5, sleeve: 'long' },
      skirt: { topTone: 0.06, bottomTone: 0.04, sleeve: 'short', legs: 'bare' },
      dress: { topTone: 0.35, bottomTone: 0.04, sleeve: 'none', legs: 'bare' },
      none: { topTone: 0.04, bottomTone: 0.04, sleeve: 'none', legs: 'bare', outfit: 'none' },
    }[outfit] || {};
    humanBody(B, R, Object.assign({ id, hands, build: o.build, female: o.female ?? (outfit === 'skirt' || outfit === 'dress') }, look, o.tones || {}));
    // 髪の流れ：動きと逆、回転なら接線
    let flow = V3(0, -1, 0).addScaledVector(motion, -1.2);
    if (P.spin) flow.add(V3(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(1.2));
    head(B, R, { expr: o.expr ?? P.expr, hair: o.hair ?? (outfit === 'skirt' || outfit === 'dress' ? 'long' : 'short'), hairTone: o.hairTone, flow: flow.normalize() }, { id });
    // 裾：コートは重く遅れてつく。スカートは回ると円盤に
    const up = P.motion && P.motion[1] > 0.5;
    const trail = motion.clone().multiplyScalar(-0.9); if (up) trail.set(trail.x, 0.25, trail.z);   // 跳ぶと裾はふわりと持ち上がる
    const flare = P.flare ?? (up ? 0.45 : 0);
    if (outfit === 'coat') {
      hem(B, R, { len: 0.62, flare: 0.12 + flare * 0.55, trail: trail.multiplyScalar(1.2), spin: (P.spin || 0) * 1.2, folds: 7, tone: look.topTone, open: true, front: true, y0: 0.07 });
      // 襟
      B.add(new T.TorusGeometry(1, 0.22, 6, 18, PI * 1.4), W(R.J.chest).multiply(M([0, R.k * 0.215, -R.k * 0.005], [PI / 2 - 0.25, 0, PI * 0.8], [R.k * 0.085, R.k * 0.075, R.k * 0.1])), { tone: look.topTone, pat: 'cloth', id, double: true });
    } else if (outfit === 'skirt' || outfit === 'dress') {
      hem(B, R, { len: outfit === 'dress' ? 0.6 : 0.4, flare: 0.22 + flare * 0.78, trail, spin: P.spin || 0, folds: 11, tone: outfit === 'dress' ? 0.35 : 0.6 });
    }
    // 持ち物
    if (o.weapon === 'sword') A.sword(B, W(R.J.haR).multiply(M([0, -0.06 * R.k, 0.0], [PI / 2, 0, 0])).multiply(M([0, -0.12, 0])), { len: 1.0 });
    const hp = wp(R.J.head).add(V3(0, 0.11 * R.k * R.pr.hs, 0));
    return { rig: R, head: hp.toArray(), headR: 0.12 * R.s * R.pr.hs, hands: [wp(R.J.haL).toArray(), wp(R.J.haR).toArray()], top: hp.y + 0.14 * R.s * R.pr.hs };
  }

  Object.assign(A, { human, humanBody, hand, hem, rigH: rig, proportions, HAND_STYLES: Object.keys(HAND) });
})();

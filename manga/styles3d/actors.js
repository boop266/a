/* =========================================================
   manga/styles3d/actors.js — 人物（デッサン人形＋ポーズ）、甲冑の騎士、馬、巨大な獣、骨、剣・盾・槍、マント
   ・すべてオリジナルの形（既存作品のデザイン・紋章はまねしない）
   ・骨組み（Object3D の親子）でポーズを付け、部品をワールドの行列で Builder に焼き込む
   ========================================================= */
(() => {
  const M3 = window.Manga3D; if (!M3 || !M3.THREE) return;
  const T = M3.THREE;
  const { rand, rr, clamp, lerp, noise3, fbm3, V3, M, Mab, displace, displaceWelded, tube, lathe, rock, stone } = M3;
  const PI = Math.PI, D2R = PI / 180;

  // ---------- 形の部品 ----------
  // 下（-Y）へ伸びる手足。prof: [[t(0..1), r]]（r は m）
  function limb(len, prof, sx = 1, sz = 1, seg = 14) {
    const pts = []; const N = 18;
    for (let i = 0; i <= N; i++) { const t = i / N; pts.push([interp(prof, t), t * len]); }
    pts.unshift([0.0001, 0]); pts.push([0.0001, len]);
    const g = lathe(pts, seg, sx, sz); g.rotateX(PI); return g;
  }
  function interp(prof, t) { for (let i = 1; i < prof.length; i++) if (t <= prof[i][0]) { const a = prof[i - 1], b = prof[i]; const u = (t - a[0]) / (b[0] - a[0] || 1); const s = u * u * (3 - 2 * u); return a[1] + (b[1] - a[1]) * s; } return prof[prof.length - 1][1]; }
  const ell = (rx, ry, rz, ws = 20, hs = 14) => { const g = new T.SphereGeometry(1, ws, hs); g.scale(rx, ry, rz); return g; };
  const box = (w, h, d, s = 1) => new T.BoxGeometry(w, h, d, s, s, s);
  // 球の一部（肩当て・ひざ当ての板）
  const shell = (r, phi0, phiL, th0, thL, seg = 16) => new T.SphereGeometry(r, seg, 8, phi0, phiL, th0, thL);

  // ---------- 骨組み ----------
  const JOINTS = [
    ['hips', null, [0, 0.98, 0]], ['spine', 'hips', [0, 0.1, 0]], ['chest', 'spine', [0, 0.22, 0]], ['neck', 'chest', [0, 0.22, 0]], ['head', 'neck', [0, 0.1, 0]],
    ['shL', 'chest', [0.19, 0.16, 0]], ['elL', 'shL', [0, -0.3, 0]], ['haL', 'elL', [0, -0.26, 0]],
    ['shR', 'chest', [-0.19, 0.16, 0]], ['elR', 'shR', [0, -0.3, 0]], ['haR', 'elR', [0, -0.26, 0]],
    ['hipL', 'hips', [0.1, -0.06, 0]], ['knL', 'hipL', [0, -0.45, 0]], ['anL', 'knL', [0, -0.44, 0]],
    ['hipR', 'hips', [-0.1, -0.06, 0]], ['knR', 'hipR', [0, -0.45, 0]], ['anR', 'knR', [0, -0.44, 0]],
  ];
  // ポーズ：関節の回転（度、XYZ）。+X：背骨は前へ曲がる／手足は後ろへ振れる。+Z：左手足は外へ。
  const POSES = {
    stand: { shL: [0, 0, 9], elL: [-8, 0, 0], shR: [0, 0, -9], elR: [-8, 0, 0], hipL: [0, 0, 3], hipR: [0, 0, -3], neck: [4, 0, 0] },
    walk: { hips: [4, 8, 0], chest: [2, -10, 0], shL: [20, 0, 8], elL: [-15, 0, 0], shR: [-25, 0, -8], elR: [-30, 0, 0], hipL: [-25, 0, 2], knL: [10, 0, 0], hipR: [18, 0, -2], knR: [25, 0, 0], anR: [-10, 0, 0] },
    run: { root: { y: 0.04 }, hips: [22, 10, 0], spine: [8, 0, 0], chest: [4, -16, 0], neck: [-18, 0, 0], head: [-6, 0, 0], shL: [48, 0, 12], elL: [-70, 0, 0], haL: [0, 0, 0], shR: [-62, 0, -12], elR: [-85, 0, 0], hipL: [-75, 0, 4], knL: [80, 0, 0], anL: [-20, 0, 0], hipR: [30, 0, -4], knR: [95, 0, 0], anR: [30, 0, 0] },
    // 斬る：右上から振り下ろした直後。前足を深く踏み込む
    slash: { hips: [10, 35, 0], spine: [14, -10, 0], chest: [12, -30, 6], neck: [-14, 18, 0], head: [-6, 8, 0],
      shR: [-60, 30, -35], elR: [-25, 0, 0], haR: [-40, 0, 10], shL: [-72, -35, 25], elL: [-40, 0, 0], haL: [-20, 0, 0],
      hipL: [-62, -10, 14], knL: [70, 0, 0], anL: [-10, 0, 0], hipR: [30, 0, -16], knR: [18, 0, 0], anR: [25, 0, 0] },
    // 構える：剣を両手で前に、切っ先を相手へ
    guard: { hips: [8, 30, 0], spine: [6, -6, 0], chest: [4, -24, 0], neck: [-10, 0, 0], head: [-4, -4, 0],
      shR: [-48, 28, -18], elR: [-62, 0, 0], haR: [-25, 0, 0], shL: [-55, -30, 22], elL: [-55, 0, 0], haL: [-15, 0, 0],
      hipL: [-38, -8, 16], knL: [42, 0, 0], anL: [-6, 0, 0], hipR: [18, 0, -22], knR: [28, 0, 0], anR: [10, 0, 0] },
    // 振りかぶる：頭の上に大きく
    raise: { hips: [0, -10, 0], spine: [-8, 0, 0], chest: [-10, 20, 0], neck: [-8, -14, 0], shR: [-170, 0, -20], elR: [-40, 0, 0], shL: [-165, 0, 25], elL: [-50, 0, 0], hipL: [-28, 0, 14], knL: [30, 0, 0], hipR: [20, 0, -18], knR: [20, 0, 0] },
    // 倒れる：あおむけ
    fallen: { root: { lie: true }, neck: [-10, 30, 0], shL: [-20, 0, 70], elL: [-30, 0, 0], shR: [10, 0, -40], elR: [-60, 0, 0], hipL: [-20, 0, 18], knL: [35, 0, 0], hipR: [-5, 0, -8], knR: [10, 0, 0], head: [-10, 20, 0] },
    // 見上げる
    lookup: { spine: [-6, 0, 0], chest: [-10, 0, 0], neck: [-28, 0, 0], head: [-26, 0, 0], shL: [8, 0, 12], elL: [-10, 0, 0], shR: [8, 0, -12], elR: [-10, 0, 0], hipL: [0, 0, 6], hipR: [0, 0, -6] },
    kneel: { root: { y: -0.45 }, hips: [0, 0, 0], spine: [12, 0, 0], neck: [10, 0, 0], hipL: [-90, 0, 4], knL: [90, 0, 0], anL: [0, 0, 0], hipR: [5, 0, -4], knR: [120, 0, 0], anR: [-30, 0, 0], shL: [-20, 0, 10], elL: [-40, 0, 0], shR: [10, 0, -12], elR: [-10, 0, 0] },
  };
  const POSE_ALIAS = { idle: 'stand', 立つ: 'stand', dash: 'run', 走る: 'run', attack: 'slash', swing: 'slash', 斬る: 'slash', ready: 'guard', fight: 'guard', 構える: 'guard', fall: 'fallen', down: 'fallen', dead: 'fallen', 倒れる: 'fallen', look_up: 'lookup', 見上げる: 'lookup', kneeling: 'kneel', jump: 'run', shout: 'raise' };

  function rig(pose, o = {}) {
    const P = typeof pose === 'object' ? pose : POSES[POSE_ALIAS[pose] || pose] || POSES.stand;
    const s = (o.height ?? 1.8) / 1.8;
    const J = {};
    const root = new T.Object3D();
    for (const [name, par, off] of JOINTS) {
      const j = new T.Object3D(); j.position.set(off[0] * s, off[1] * s, off[2] * s);
      const r = P[name]; if (r) j.rotation.set(r[0] * D2R, r[1] * D2R, r[2] * D2R, 'YXZ');
      (par ? J[par] : root).add(j); J[name] = j;
    }
    const rt = P.root || {};
    root.updateMatrixWorld(true);
    // 足を地面に：いちばん低い足首を y=0.07 に
    if (rt.lie) {
      root.rotation.set(-PI / 2, 0, 0); root.position.set(0, 0.16 * s, 0.98 * s); root.updateMatrixWorld(true);
    } else {
      const ya = Math.min(J.anL.getWorldPosition(V3()).y, J.anR.getWorldPosition(V3()).y);
      root.position.y = 0.075 * s - ya + (rt.y ?? 0) * s;
    }
    const outer = new T.Object3D(); outer.add(root);
    outer.position.set(...(o.pos || [0, 0, 0])); outer.rotation.y = (o.yaw ?? 0) * D2R;
    outer.updateMatrixWorld(true);
    return { J, s, root: outer };
  }
  const W = j => j.matrixWorld.clone();
  const wp = j => j.getWorldPosition(V3());

  // ---------- デッサン人形（筋肉の量感つき） ----------
  // o: { tone, pat, joints: true(球関節), build: 0..1(筋肉), female: false }
  function body(B, R, o = {}) {
    const { J, s } = R, id = o.id ?? B.newId(), tone = o.tone ?? 0.1, pat = o.pat ?? 'skin', mus = o.build ?? 0.6, f = o.female ? 1 : 0;
    const add = (g, j, m, op = {}) => B.add(g, W(j).multiply(m || new T.Matrix4()), Object.assign({ tone, pat, id }, op));
    const k = lerp(0.85, 1.15, mus);
    // 頭：卵形＋あご
    if (!o.noHead) {
      add(ell(0.095, 0.118, 0.108).translate(0, 0.1, 0.0), J.head, M([0, 0, 0], [0, 0, 0], s));
      add(ell(0.072, 0.06, 0.08).translate(0, 0.035, 0.03), J.head, M([0, 0, 0], [0.25, 0, 0], s));
    }
    add(limb(0.16, [[0, 0.055], [0.5, 0.05 * k], [1, 0.06]]), J.neck, M([0, 0.13 * s, 0], [0, 0, 0], s));
    // 胴：胸郭、腹、骨盤
    add(ell(0.17 * k - f * 0.02, 0.19, 0.115 * k), J.chest, M([0, 0.06 * s, 0], [0, 0, 0], s));
    add(ell(0.13 * k, 0.15, 0.1), J.spine, M([0, 0.04 * s, 0.005 * s], [0, 0, 0], s));
    add(ell(0.155 + f * 0.03, 0.12, 0.11), J.hips, M([0, -0.02 * s, 0], [0, 0, 0], s));
    // 胸筋・僧帽筋・臀部・広背筋
    for (const sd of [-1, 1]) {
      add(ell(0.085 * k, 0.06 * k, 0.045 * k), J.chest, M([sd * 0.075 * s, 0.1 * s, 0.085 * s], [0.2, sd * 0.3, 0], s));
      add(ell(0.08, 0.04 * k, 0.06), J.chest, M([sd * 0.1 * s, 0.2 * s, -0.02 * s], [0, 0, sd * -0.45], s));
      add(ell(0.075, 0.08, 0.07 * k), J.hips, M([sd * 0.075 * s, -0.04 * s, -0.07 * s], [0, 0, 0], s));
      add(ell(0.05 * k, 0.13, 0.07), J.chest, M([sd * 0.13 * s, -0.04 * s, -0.04 * s], [0, 0, sd * 0.25], s));
    }
    // 腹筋のふくらみ
    add(ell(0.07, 0.11, 0.05), J.spine, M([0, 0.05 * s, 0.07 * s], [0, 0, 0], s));
    // 腕
    for (const sd of ['L', 'R']) {
      add(ell(0.065 * k, 0.07, 0.07 * k), J['sh' + sd], M([0, -0.02 * s, 0], [0, 0, 0], s));  // 三角筋
      add(limb(0.3, [[0, 0.055], [0.15, 0.058 * k], [0.45, 0.052 * k], [0.8, 0.044], [1, 0.038]], 1.0, 1.08), J['sh' + sd], M([0, 0, 0], [0, 0, 0], s));
      add(limb(0.26, [[0, 0.04], [0.22, 0.048 * k], [0.6, 0.036], [1, 0.027]], 1.2, 0.9), J['el' + sd], M([0, 0, 0], [0, 0, 0], s));
      add(box(0.075, 0.1, 0.035).translate(0, -0.05, 0), J['ha' + sd], M([0, 0, 0], [0, 0, 0], s));                   // 手（ミトン）
      add(limb(0.06, [[0, 0.014], [1, 0.011]]), J['ha' + sd], M([(sd === 'L' ? -1 : 1) * 0.035 * s, -0.01 * s, 0.02 * s], [0, 0, (sd === 'L' ? -1 : 1) * 0.6], s));
      if (o.joints !== false) { add(ell(0.04, 0.04, 0.04), J['el' + sd], M([0, 0, 0], [0, 0, 0], s), { tone: tone + 0.15 }); add(ell(0.028, 0.028, 0.028), J['ha' + sd], M([0, 0, 0], [0, 0, 0], s), { tone: tone + 0.15 }); }
    }
    // 脚
    for (const sd of ['L', 'R']) {
      add(limb(0.46, [[0, 0.085], [0.25, 0.088 * k], [0.7, 0.066 * k], [1, 0.05]], 1.0, 1.1), J['hip' + sd], M([0, 0, 0], [0, 0, 0], s));
      const shin = limb(0.44, [[0, 0.05], [0.25, 0.058 * k], [0.55, 0.045], [1, 0.032]], 1.0, 1.0);
      displace(shin, v => (v.z < 0 && v.y < -0.05 && v.y > -0.25) ? V3(0, 0, -0.015 * k * Math.sin((-v.y - 0.05) / 0.2 * PI)) : null);
      add(shin, J['kn' + sd], M([0, 0, 0], [0, 0, 0], s));
      add(lathe([[0.0001, 0], [0.045, 0.02], [0.05, 0.1], [0.04, 0.2], [0.0001, 0.25]], 10, 1.0, 0.65).rotateX(PI / 2).translate(0, -0.04, -0.03), J['an' + sd], M([0, 0, 0], [0, 0, 0], s));
      if (o.joints !== false) { add(ell(0.052, 0.052, 0.052), J['kn' + sd], M([0, 0, 0], [0, 0, 0], s), { tone: tone + 0.15 }); add(ell(0.035, 0.035, 0.035), J['an' + sd], M([0, 0, 0], [0, 0, 0], s), { tone: tone + 0.15 }); }
    }
    return id;
  }

  // ---------- 甲冑（オリジナル：とがった前立ての兜、三枚重ねの肩当て、竜骨の胸当て） ----------
  function armor(B, R, o = {}) {
    const { J, s } = R, tone = o.tone ?? 0.85, pat = 'metal';
    const add = (g, j, m, op = {}) => B.add(g, W(j).multiply(m || new T.Matrix4()), Object.assign({ tone, pat, id: o.id ?? B.newId(), double: true }, op));
    const S = s;
    // 兜：丸い鉢＋前へ突き出た面頬＋横一文字の覗き穴＋背の高いひれ（前立て）
    const hid = B.newId();
    add(lathe([[0.0001, 0.27], [0.06, 0.262], [0.1, 0.235], [0.122, 0.19], [0.13, 0.12], [0.128, 0.04], [0.118, -0.01]], 20, 1, 1.08), J.head, M([0, 0, 0], [0, 0, 0], S), { id: hid });
    const vis = lathe([[0.0001, 0.0], [0.05, 0.02], [0.085, 0.07], [0.1, 0.11], [0.098, 0.14]], 12, 1, 1); vis.rotateX(-PI / 2);
    add(vis, J.head, M([0, 0.075 * S, 0.19 * S], [0.08, 0, 0], [S * 0.95, S * 0.85, S * 0.75]), { id: hid, tone: Math.max(tone, 0.55) });
    add(box(0.2, 0.02, 0.07), J.head, M([0, 0.14 * S, 0.12 * S], [0, 0, 0], S), { tone: 1.0, pat: 'plain', id: hid });   // 覗き穴
    for (let i = 0; i < 3; i++) add(box(0.05, 0.008, 0.06), J.head, M([0, (0.07 + i * 0.022) * S, 0.2 * S], [0, 0, 0], S), { tone: 1, pat: 'plain', id: hid });  // 息穴
    const fin = new T.Shape(); fin.moveTo(-0.16, 0); fin.quadraticCurveTo(-0.05, 0.08, 0.02, 0.24); fin.lineTo(0.06, 0.2); fin.quadraticCurveTo(0.05, 0.08, 0.17, 0.0); fin.lineTo(-0.16, 0);
    const fg = new T.ExtrudeGeometry(fin, { depth: 0.012, bevelEnabled: false }); fg.translate(0, 0, -0.006); fg.rotateY(PI / 2);
    add(fg, J.head, M([0, 0.24 * S, -0.02 * S], [0, 0, 0], S), { id: hid });
    // のど当て
    add(lathe([[0.075, 0], [0.095, 0.05], [0.13, 0.1], [0.17, 0.12]], 18, 1, 0.9), J.neck, M([0, 0.12 * S, 0], [PI, 0, 0], S));
    // 胸当て：竜骨（中心の稜）
    const cp = lathe([[0.0001, -0.2], [0.13, -0.17], [0.17, -0.05], [0.185, 0.08], [0.17, 0.2], [0.11, 0.25]], 8, 1.15, 0.85);
    add(cp, J.chest, M([0, 0.06 * S, 0.012 * S], [0, PI / 8, 0], S), { flat: true });
    add(box(0.25, 0.012, 0.18).translate(0, 0, 0), J.spine, M([0, 0.0, 0.0], [0, 0, 0], S));
    add(lathe([[0.15, 0], [0.155, 0.12], [0.165, 0.16]], 16, 1.05, 0.8), J.spine, M([0, -0.06 * S, 0], [0, 0, 0], S));
    // 腰の草摺（段々）
    for (let i = 0; i < 4; i++) add(lathe([[0.17 + i * 0.012, 0.06], [0.2 + i * 0.016, 0]], 18, 1.05, 0.85), J.hips, M([0, (0.02 - i * 0.055) * S, 0], [0, 0, 0], S));
    // 肩当て：三枚重ね＋立ち上がりの縁
    for (const sd of ['L', 'R']) {
      const sg = sd === 'L' ? 1 : -1;
      for (let i = 0; i < 3; i++) {
        const g = shell(0.13 + i * 0.006, 0, PI * 2, 0, PI * 0.42 - i * 0.02, 18); g.scale(1, 0.85, 1.05);
        add(g, J['sh' + sd], M([sg * 0.02 * S, (0.03 - i * 0.06) * S, 0], [0, 0, sg * (-0.35 - i * 0.12)], S));
      }
      add(box(0.03, 0.09, 0.2), J['sh' + sd], M([-sg * 0.06 * S, 0.12 * S, 0], [0, 0, sg * 0.2], S));
      // 上腕・ひじ当て・腕甲・こて
      add(limb(0.24, [[0, 0.064], [1, 0.054]]), J['sh' + sd], M([0, -0.06 * S, 0], [0, 0, 0], S));
      add(ell(0.058, 0.058, 0.058), J['el' + sd], M([0, 0, -0.01 * S], [0, 0, 0], S));
      const wing = shell(0.075, 0, PI, 0, PI / 2, 10); wing.scale(1, 1, 0.3);
      add(wing, J['el' + sd], M([sg * 0.03 * S, 0, -0.02 * S], [0, PI / 2 * sg, 0], S));
      add(limb(0.22, [[0, 0.052], [0.3, 0.056], [1, 0.042]], 1.15, 0.95), J['el' + sd], M([0, -0.02 * S, 0], [0, 0, 0], S));
      add(lathe([[0.045, 0], [0.065, 0.05]], 12, 1.2, 1), J['el' + sd], M([0, -0.26 * S, 0], [PI, 0, 0], S));
      add(box(0.088, 0.11, 0.05, 2).translate(0, -0.05, 0), J['ha' + sd], M([0, 0, 0], [0, 0, 0], S));
      // ももの板・ひざ・すね当て・鉄靴
      add(limb(0.38, [[0, 0.098], [0.6, 0.085], [1, 0.07]], 1.05, 1.12), J['hip' + sd], M([0, -0.04 * S, 0], [0, 0, 0], S));
      add(ell(0.065, 0.06, 0.06), J['kn' + sd], M([0, 0, 0.025 * S], [0, 0, 0], S));
      const kw = shell(0.08, 0, PI, 0, PI / 2, 10); kw.scale(1, 1, 0.35); add(kw, J['kn' + sd], M([sg * 0.04 * S, 0, 0.0], [0, PI / 2 * sg, 0], S));
      add(limb(0.38, [[0, 0.062], [0.3, 0.068], [1, 0.045]], 1.0, 1.05), J['kn' + sd], M([0, -0.04 * S, 0], [0, 0, 0], S));
      for (let i = 0; i < 3; i++) add(box(0.1, 0.035, 0.09 - i * 0.012), J['an' + sd], M([0, -0.03 * S, (0.04 + i * 0.05) * S], [0.25, 0, 0], S));
      add(box(0.1, 0.05, 0.1), J['an' + sd], M([0, -0.04 * S, -0.02 * S], [0, 0, 0], S));
    }
  }

  // ---------- マント（風になびく、すそは裂けている） ----------
  function cape(B, R, o = {}) {
    const { J, s } = R; const id = o.id ?? B.newId();
    const len = (o.len ?? 1.45) * s, wid = (o.width ?? 0.62) * s, wind = V3(...(o.wind || [0.5, 0.15, -1])).normalize().multiplyScalar(o.windK ?? 1);
    const NX = 18, NY = 26;
    const cL = wp(J.shL), cR = wp(J.shR), ch = wp(J.chest), hp = wp(J.hips);
    const back = V3().subVectors(cL, cR).cross(V3(0, 1, 0)).normalize(); // 体の後ろ向き
    if (back.dot(V3().subVectors(ch, wp(J.neck)).cross(V3().subVectors(cL, cR))) > 10) back.negate();
    const fwd = J.chest.localToWorld(V3(0, 0, 1)).sub(ch).normalize(); back.copy(fwd).negate();
    const pos = [], idx = [];
    const s0 = rr(0, 50);
    for (let j = 0; j <= NY; j++) {
      const v = j / NY;
      for (let i = 0; i <= NX; i++) {
        const u = i / NX;
        const top = V3().lerpVectors(cR, cL, u).addScaledVector(back, 0.1 * s).add(V3(0, 0.06 * s, 0));
        const spread = lerp(1, 1.0 + (o.flare ?? 0.9), v);
        const side = V3().subVectors(cL, cR).normalize().multiplyScalar((u - 0.5) * wid * (spread - 1));
        let p = top.clone().add(side).add(V3(0, -v * len, 0)).addScaledVector(back, v * 0.15 * s);
        // 体の後ろに沿わせる
        const fold = Math.sin(u * PI * (o.folds ?? 5) + noise3(u * 3, v * 2, s0) * 2) * 0.05 * s * (0.3 + v);
        p.addScaledVector(back, fold + Math.sin(u * PI) * 0.08 * s);
        // 風：すそほど流れる
        const wv = v * v * len * 0.9;
        p.addScaledVector(wind, wv * (0.8 + 0.4 * noise3(u * 2 + s0, v * 2, 0)));
        p.y += Math.sin(u * PI * 3 + v * 6 + s0) * 0.06 * v * s;
        pos.push(p.x, p.y, p.z);
      }
    }
    // 裂けたすそ：列ごとに長さを変える
    const cut = []; for (let i = 0; i < NX; i++) cut.push(NY - Math.floor(rand() * rand() * NY * 0.45));
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { if (j >= cut[i]) continue; const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    B.add(g, null, { tone: o.tone ?? 0.9, pat: 'cloth', id, double: true });
    return id;
  }

  // ---------- 武器 ----------
  // 剣：m は柄頭（ポンメル）→刃先が +Y の行列
  function sword(B, m, o = {}) {
    const id = o.id ?? B.newId(), L = o.len ?? 1.05, bw = o.width ?? 0.055;
    const add = (g, mm, op = {}) => B.add(g, m.clone().multiply(mm), Object.assign({ tone: 0.15, pat: 'metal', id, double: true }, op));
    add(ell(0.03, 0.03, 0.03), M([0, 0, 0]));                                  // 柄頭
    add(limb(0.2, [[0, 0.016], [0.5, 0.019], [1, 0.016]]), M([0, 0.22, 0], [0, 0, 0]), { tone: 0.8, pat: 'cloth' });  // 握り
    // 鍔：下向きに曲がった腕＋中央の菱形
    add(tube([[-0.16, 0.2, 0], [-0.1, 0.235, 0], [0, 0.24, 0], [0.1, 0.235, 0], [0.16, 0.2, 0]], 0.016, 6), M(), { tone: 0.3 });
    add(box(0.05, 0.06, 0.035), M([0, 0.245, 0], [0, 0, PI / 4]), { tone: 0.3 });
    // 刃：菱形断面、切っ先へ細る
    const sh = new T.Shape(); sh.moveTo(0, -0.012); sh.lineTo(bw / 2, 0); sh.lineTo(0, 0.012); sh.lineTo(-bw / 2, 0); sh.lineTo(0, -0.012);
    const pts = []; for (let i = 0; i <= 10; i++) pts.push(new T.Vector3(0, 0.26 + (L - 0.26) * i / 10, 0));
    const g = new T.BufferGeometry(); const P = [], I = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, w = t < 0.85 ? lerp(1, 0.8, t / 0.85) : lerp(0.8, 0.0, (t - 0.85) / 0.15), y = 0.26 + (L - 0.26) * t; P.push(0, y, -0.012 * w, bw / 2 * w, y, 0, 0, y, 0.012 * w, -bw / 2 * w, y, 0); }
    for (let i = 0; i < 10; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + (k + 1) % 4, c = a + 4, d = b + 4; I.push(a, c, b, b, c, d); }
    g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setIndex(I);
    add(g, M(), { tone: 0.1, flat: true });
    // 血溝
    add(box(0.008, (L - 0.26) * 0.6, 0.026), M([0, 0.26 + (L - 0.26) * 0.32, 0]), { tone: 0.7 });
    return id;
  }
  function spear(B, m, o = {}) {
    const id = o.id ?? B.newId(), L = o.len ?? 2.4;
    const add = (g, mm, op = {}) => B.add(g, m.clone().multiply(mm), Object.assign({ tone: 0.4, pat: 'wood', id }, op));
    const sl = o.broken ? L * rr(0.4, 0.7) : L;
    add(limb(sl, [[0, 0.018], [1, 0.02]]), M([0, sl, 0]));
    if (!o.broken) { const h = new T.ConeGeometry(0.035, 0.3, 4); h.scale(1, 1, 0.35); add(h, M([0, L + 0.15, 0]), { tone: 0.15, pat: 'metal', flat: true }); add(ell(0.025, 0.04, 0.025), M([0, L, 0]), { tone: 0.3, pat: 'metal' }); }
    else add(new T.ConeGeometry(0.02, 0.08, 5), M([0, sl + 0.04, 0], [0.2, 0, 0.3]), { tone: 0.6, pat: 'wood', flat: true });
  }
  // 盾：上が平らな凧形（ヒーター）。紋章はなく、縁の補強と斜めの帯だけ
  function shield(B, m, o = {}) {
    const id = o.id ?? B.newId();
    const sh = new T.Shape(); sh.moveTo(-0.3, 0.32); sh.lineTo(0.3, 0.32); sh.quadraticCurveTo(0.3, -0.15, 0, -0.42); sh.quadraticCurveTo(-0.3, -0.15, -0.3, 0.32);
    const g = new T.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 1, curveSegments: 10 });
    displace(g, v => V3(0, 0, -v.x * v.x * 0.5), false); g.computeVertexNormals();
    B.add(g, m, { tone: o.tone ?? 0.3, pat: 'wood', id });
    B.add(box(0.06, 0.8, 0.02), m.clone().multiply(M([0.0, -0.02, 0.06], [0, 0, 0.6])), { tone: 0.8, pat: 'metal', id });
    B.add(ell(0.07, 0.07, 0.03), m.clone().multiply(M([0, 0.05, 0.06])), { tone: 0.3, pat: 'metal', id });
  }

  // ---------- 人物（まとめ） ----------
  // o: { kind:'mannequin'|'knight', pose, pos, yaw, height, weapon:'sword'|'spear'|null, shield, cape, tone }
  function figure(B, o = {}) {
    const R = rig(o.pose || 'stand', o);
    const kind = o.kind || 'mannequin';
    const knight = kind === 'knight';
    body(B, R, { tone: knight ? 0.7 : (o.tone ?? 0.05), pat: knight ? 'cloth' : 'skin', build: o.build ?? (knight ? 0.8 : 0.6), noHead: knight, joints: !knight && o.joints !== false, female: o.female });
    if (knight) armor(B, R, { tone: o.tone ?? 0.4 });
    if (o.cape ?? knight) cape(B, R, Object.assign({ tone: knight ? 0.92 : 0.8 }, o.capeOpts || {}));
    const P = R.J;
    const wpn = o.weapon ?? (knight ? 'sword' : null);
    if (wpn === 'sword') {
      // 右手に握る：手首から少し先が柄。刃は手の向き（-Y）からさらに前へ
      const m = W(P.haR).multiply(M([0, -0.05 * R.s, 0.0], [PI / 2 + (o.swordTilt ?? 0), 0, 0])).multiply(M([0, -0.12, 0]));
      sword(B, m, { len: o.swordLen ?? 1.15 });
    } else if (wpn === 'spear') {
      spear(B, W(P.haR).multiply(M([0, -0.05, 0], [PI / 2, 0, 0])).multiply(M([0, -0.9, 0])), { len: 2.6 });
    }
    if (o.shield) shield(B, W(P.elL).multiply(M([0.06, -0.14, 0.05], [0, PI / 2, 0])), {});
    const head = wp(P.head).add(V3(0, 0.1 * R.s, 0));
    return { rig: R, head: [head.x, head.y, head.z], headR: 0.12 * R.s, hands: [wp(P.haL).toArray(), wp(P.haR).toArray()], top: head.y + 0.15 * R.s };
  }

  // ---------- 馬 ----------
  function horse(B, o = {}) {
    const id = B.newId(), tone = o.tone ?? 0.75, s = o.scale ?? 1;
    const base = M(o.pos || [0, 0, 0], [0, (o.yaw ?? 0) * D2R, 0], s);
    const add = (g, m, op = {}) => B.add(g, base.clone().multiply(m), Object.assign({ tone, pat: 'hide', id }, op));
    const gait = o.gait ?? 'stand'; // stand | gallop | rear
    const rear = gait === 'rear' ? 0.6 : 0;
    const bodyM = M([0, 1.38 + rear * 0.5, 0], [-rear, 0, 0]);
    const BM = (m) => bodyM.clone().multiply(m);
    // 胴：胸・腹・尻
    add(ell(0.4, 0.42, 0.7), BM(M([0, 0, 0])));
    add(ell(0.4, 0.46, 0.38), BM(M([0, 0.04, 0.55])));
    add(ell(0.42, 0.44, 0.42), BM(M([0, 0.08, -0.55])));
    // 首と頭
    const neck = [[0, 0.15, 0.62], [0, 0.55, 0.85], [0, 0.85, 0.98]];
    add(tube(neck.map(p => p), [0.3, 0.2, 0.13], 12), BM(M()));
    const head = lathe([[0.0001, 0], [0.09, 0.03], [0.11, 0.18], [0.085, 0.4], [0.065, 0.55], [0.0001, 0.58]], 12, 0.85, 1.15);
    add(head, BM(M([0, 0.95, 1.0], [2.3, 0, 0])));
    for (const sd of [-1, 1]) add(new T.ConeGeometry(0.03, 0.13, 5), BM(M([sd * 0.06, 1.05, 0.98], [-0.4, 0, sd * 0.2])));
    // たてがみ・尾（毛の束）
    for (let i = 0; i < 9; i++) { const t = i / 8; const p = [0, 0.2 + t * 0.75, 0.6 + t * 0.4]; add(tube([p, [p[0] + rr(-0.05, 0.05), p[1] - 0.05, p[2] - 0.2], [p[0] + rr(-0.1, 0.1), p[1] - 0.15 - rand() * 0.2, p[2] - 0.38]], [0.04, 0.03, 0.005], 5), BM(M()), { pat: 'hair', tone: 0.9 }); }
    for (let i = 0; i < 6; i++) add(tube([[0, 0.15, -0.78], [rr(-0.1, 0.1), 0.0, -0.95], [rr(-0.2, 0.2), -0.5, -1.05 - rand() * 0.2], [rr(-0.2, 0.2), -0.9, -1.0 - rand() * 0.3]], [0.05, 0.05, 0.03, 0.005], 5), BM(M()), { pat: 'hair', tone: 0.9 });
    // 脚：前後とも、関節で折れる
    const legs = { stand: [[-5, 10], [5, 10], [-5, -10], [5, -10]], gallop: [[-60, 70], [30, 20], [-40, -50], [40, -10]], rear: [[-80, 110], [-60, 100], [40, -20], [55, -30]] }[gait];
    const L = [[0.22, -0.05, 0.5], [-0.22, -0.05, 0.5], [0.22, -0.05, -0.5], [-0.22, -0.05, -0.5]];
    L.forEach((p, i) => {
      const [a1, a2] = legs[i]; const front = i < 2;
      const hip = V3(...p), up = M([0, 0, 0], [a1 * D2R, 0, 0]);
      const k1 = hip.clone().add(V3(0, -0.55, 0).applyMatrix4(up));
      const lo = M([0, 0, 0], [(a1 + (front ? a2 : -Math.abs(a2))) * D2R, 0, 0]);
      const k2 = k1.clone().add(V3(0, -0.42, 0).applyMatrix4(lo));
      const k3 = k2.clone().add(V3(0, -0.2, 0.04).applyMatrix4(lo));
      add(tube([hip.toArray(), V3().lerpVectors(hip, k1, 0.5).toArray(), k1.toArray()], [front ? 0.2 : 0.26, 0.14, 0.075], 10), BM(M()));
      add(tube([k1.toArray(), k2.toArray(), k3.toArray()], [0.065, 0.045, 0.05], 8), BM(M()));
      add(lathe([[0.065, 0], [0.07, 0.07], [0.05, 0.1]], 8), BM(M(k3.toArray(), [0, 0, 0]).multiply(M([0, -0.08, 0]))), { tone: 0.3, pat: 'plain' });
    });
    // 鞍と馬具（簡素）
    add(ell(0.36, 0.08, 0.32), BM(M([0, 0.33, 0.05])), { tone: 0.5, pat: 'wood' });
    add(tube([[0.12, 0.95, 1.2], [0.25, 0.5, 0.6], [0.2, 0.35, 0.2]], 0.01, 4), BM(M()), { tone: 0.9, pat: 'plain' });
    return { id, saddle: V3(0, 1.85 + rear * 0.6, 0).applyMatrix4(base).toArray() };
  }

  // ---------- 巨大な獣（オリジナル：猫背で前腕が太く、頭は肩の間に低く。前へ曲がる四本の角、背にとげの列） ----------
  // o: { pos, yaw, scale, pose: 'roar'(片腕を振り上げる) | 'crouch'(両腕をつく), tone }
  function beast(B, o = {}) {
    const id = B.newId(), tone = o.tone ?? 0.55, s = o.scale ?? 1;
    const base = M(o.pos || [0, 0, 0], [0, (o.yaw ?? 0) * D2R, 0], s);
    const add = (g, m, op = {}) => B.add(g, base.clone().multiply(m || new T.Matrix4()), Object.assign({ tone, pat: 'hide', id }, op));
    const s0 = rr(0, 50);
    const lumpy = (g, amp, f) => displaceWelded(g, (v, n) => (fbm3(v.x * f + s0, v.y * f, v.z * f, 4) * 0.7 + Math.abs(noise3(v.x * f * 2.3, v.y * f * 2.3 + s0, v.z * f * 2.3)) * 0.5) * amp);
    const flesh = (pts, rad, seg = 16, amp = 0.12, f = 1.3) => lumpy(tube(pts, rad, seg), amp, f);
    const roar = (o.pose ?? 'roar') === 'roar';
    // 背骨：尻(後ろ・低い) → 背のこぶ(高い) → 首の付け根(前・低め)
    const spine = [[0, 2.6, -3.2], [0, 3.4, -2.0], [0, 4.4, -0.6], [0, 4.9, 0.6], [0, 4.5, 1.6], [0, 4.0, 2.3]];
    add(flesh(spine, [0.9, 1.25, 1.55, 1.75, 1.45, 1.0], 22, 0.14, 0.9));
    // 胸の厚み（下へふくらむ）と腹
    add(lumpy(ell(1.5, 1.35, 1.2, 30, 22), 0.12, 1.2), M([0, 3.6, 1.0]));
    add(lumpy(ell(1.1, 1.0, 1.3, 26, 18), 0.1, 1.4), M([0, 2.9, -0.9]));
    // 肩の盛り上がり（左右）
    for (const sd of [-1, 1]) add(lumpy(ell(1.0, 0.9, 1.0, 24, 18), 0.12, 1.5), M([sd * 1.45, 4.6, 1.2]));
    // 背のとげ：背骨に沿って、後ろへ寝る
    for (let i = 0; i < 11; i++) { const t = i / 10; const p = [rr(-0.08, 0.08), lerp(5.2, 3.0, t) + Math.sin(t * PI) * 1.2, lerp(1.6, -3.0, t)]; const h = lerp(1.3, 0.5, Math.abs(t - 0.35) * 1.5);
      const c = new T.ConeGeometry(0.16 * h, h, 5); add(c, M(p, [-0.9 - t * 0.4, 0, rr(-0.2, 0.2)]), { tone: 0.25, pat: 'bone', flat: true }); }
    // 頭：肩の間から前へ突き出す。平たい額、裂けたあご
    const HM = M([0, 4.05, 3.0], [roar ? -0.35 : 0.25, 0, 0]);
    const Hd = m => HM.clone().multiply(m || new T.Matrix4());
    add(lumpy(ell(0.75, 0.6, 0.85, 24, 18), 0.1, 2.2), Hd(M([0, 0.15, 0])));
    const snout = lathe([[0.0001, 0], [0.42, 0.05], [0.5, 0.35], [0.42, 0.8], [0.25, 1.05], [0.0001, 1.1]], 14, 1.15, 0.6); snout.rotateX(PI / 2);
    add(lumpy(snout, 0.06, 3), Hd(M([0, 0.12, 0.55], [0.08, 0, 0])));
    const jaw = Hd(M([0, -0.25, 0.35], [0.75, 0, 0]));
    const jg = lathe([[0.0001, 0], [0.38, 0.05], [0.4, 0.4], [0.28, 0.85], [0.0001, 0.95]], 12, 1.1, 0.45); jg.rotateX(PI / 2);
    add(lumpy(jg, 0.05, 3), jaw.clone().multiply(M([0, -0.05, 0.1])));
    add(ell(0.36, 0.16, 0.55), Hd(M([0, -0.12, 0.9], [0.4, 0, 0])), { tone: 1.0, pat: 'plain' });   // 口の奥（黒）
    for (let i = 0; i < 12; i++) { const t = i / 11, a = (t - 0.5) * 2.4, r = 0.44;   // 上下の牙
      add(new T.ConeGeometry(0.055, rr(0.22, 0.38) * (Math.abs(a) > 0.9 ? 1.4 : 1), 4), Hd(M([Math.sin(a) * r * 1.05, 0.0, 0.62 + Math.cos(a) * 0.5], [PI, 0, 0])), { tone: 0.0, pat: 'bone', flat: true });
      add(new T.ConeGeometry(0.05, rr(0.18, 0.3), 4), jaw.clone().multiply(M([Math.sin(a) * r, 0.1, 0.18 + Math.cos(a) * 0.55])), { tone: 0.0, pat: 'bone', flat: true }); }
    for (const sd of [-1, 1]) { // 目（深い眼窩に白い点）と眉の骨
      add(ell(0.2, 0.09, 0.14), Hd(M([sd * 0.42, 0.42, 0.55], [0.2, sd * 0.3, sd * 0.35])), { tone });
      add(ell(0.07, 0.04, 0.04), Hd(M([sd * 0.4, 0.3, 0.68], [0, sd * 0.4, 0])), { tone: 0.0, pat: 'plain' });
    }
    // 角：前へ曲がる二本（太い）と、横へねじれる二本
    for (const sd of [-1, 1]) for (const k of [0, 1]) {
      const pts = [], rad = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10;
        pts.push(k === 0 ? [sd * (0.45 + t * 0.9), 0.45 + t * 1.2 - t * t * 0.7, 0.1 + t * t * 1.4] : [sd * (0.6 + t * 1.3), 0.25 + Math.sin(t * PI) * 0.35, -0.2 - t * 0.6 + Math.sin(t * 5) * 0.12]);
        rad.push(lerp(k ? 0.17 : 0.22, 0.012, Math.pow(t, 0.8))); }
      add(tube(pts, rad, 9), Hd(), { tone: 0.3, pat: 'bone' });
      for (let i = 1; i < 8; i++) { const t = i / 10; const p = V3(...pts[i]); add(new T.TorusGeometry(rad[i] * 1.02, 0.012, 4, 10), Hd(M(p.toArray(), [0, 0, 0])).multiply(Mab([0, 0, 0], V3(...pts[i + 1]).sub(p).toArray()).multiply(M([0, 0, 0], [PI / 2, 0, 0]))), { tone: 0.6, pat: 'bone' }); }
    }
    // 前腕：肩→ひじ→手首（太い前腕）。片方は振り上げて爪を開く
    for (const sd of [-1, 1]) {
      const up = roar && sd > 0;
      const sh = V3(sd * 1.7, 4.5, 1.4);
      const el = up ? V3(sd * 3.2, 4.6, 2.6) : V3(sd * 2.5, 2.4, 2.2);
      const wr = up ? V3(sd * 2.6, 6.4, 3.9) : V3(sd * 2.3, 0.55, 3.2);
      add(flesh([sh.toArray(), V3().lerpVectors(sh, el, 0.4).add(V3(sd * 0.25, 0.1, 0)).toArray(), el.toArray()], [0.9, 0.85, 0.55], 16, 0.12, 1.6));
      add(flesh([el.toArray(), V3().lerpVectors(el, wr, 0.3).add(V3(sd * 0.15, 0, 0.1)).toArray(), wr.toArray()], [0.6, 0.72, 0.42], 16, 0.12, 1.8));
      const hand = up ? M(wr.toArray(), [-0.9, 0, 0]) : M(wr.toArray(), [0.1, 0, 0]);
      add(lumpy(ell(0.55, 0.38, 0.55, 18, 14), 0.08, 3), hand);
      for (let f = 0; f < 4; f++) { const a = (f / 3 - 0.5) * 1.5;   // 指とかぎ爪
        const p0 = V3(Math.sin(a) * 0.4, -0.1, 0.3 + Math.cos(a) * 0.1), p1 = p0.clone().add(V3(Math.sin(a) * 0.25, up ? 0.1 : -0.25, 0.45)), p2 = p1.clone().add(V3(Math.sin(a) * 0.1, up ? 0.3 : -0.3, 0.3));
        add(tube([p0.toArray(), p1.toArray()], [0.14, 0.11], 7), hand);
        add(tube([p1.toArray(), V3().lerpVectors(p1, p2, 0.5).add(V3(0, 0.05, 0.05)).toArray(), p2.toArray()], [0.1, 0.06, 0.004], 6), hand, { tone: 0.15, pat: 'bone' }); }
    }
    // 後ろ脚：太いもも、しゃがんだひざ、つま先立ちのかかと
    for (const sd of [-1, 1]) {
      const hp = V3(sd * 1.0, 2.8, -2.4), kn = V3(sd * 1.5, 1.9, -0.6), an = V3(sd * 1.35, 0.9, -2.2), ft = V3(sd * 1.35, 0.3, -1.3);
      add(flesh([hp.toArray(), V3().lerpVectors(hp, kn, 0.5).add(V3(sd * 0.2, 0.2, 0)).toArray(), kn.toArray()], [1.05, 0.95, 0.5], 16, 0.12, 1.4));
      add(flesh([kn.toArray(), V3().lerpVectors(kn, an, 0.5).toArray(), an.toArray(), ft.toArray()], [0.5, 0.42, 0.3, 0.32], 12, 0.1, 2));
      for (let f = 0; f < 3; f++) add(tube([[ft.x + (f - 1) * 0.22, 0.25, ft.z + 0.2], [ft.x + (f - 1) * 0.3, 0.12, ft.z + 0.7]], [0.12, 0.02], 6), M(), { tone: 0.15, pat: 'bone' });
    }
    // 尾：太く、地面を這う
    const tp = [], tr = []; for (let i = 0; i <= 12; i++) { const t = i / 12; tp.push([Math.sin(t * 2.6 + s0) * 1.2 * t, lerp(2.4, 0.35, Math.min(1, t * 1.6)), -3.3 - t * 4.5]); tr.push(lerp(0.75, 0.04, t)); }
    add(flesh(tp, tr, 12, 0.06, 2));
    return { id, head: V3(0, 0.3, 0.8).applyMatrix4(HM).applyMatrix4(base).toArray(), top: 7.5 * s };
  }

  // ---------- 骨 ----------
  function skull(B, p, r = 0.14, rot = [0, 0, 0], id) {
    id = id ?? B.newId(); const m = M(p, rot, r / 0.14);
    B.add(ell(0.11, 0.1, 0.13), m.clone().multiply(M([0, 0.08, 0])), { tone: 0.05, pat: 'bone', id });
    B.add(ell(0.075, 0.05, 0.07), m.clone().multiply(M([0, 0.02, 0.07])), { tone: 0.05, pat: 'bone', id });
    for (const sd of [-1, 1]) B.add(ell(0.03, 0.026, 0.02), m.clone().multiply(M([sd * 0.04, 0.07, 0.115])), { tone: 1.0, pat: 'plain', id });
    B.add(new T.ConeGeometry(0.014, 0.03, 3), m.clone().multiply(M([0, 0.03, 0.13], [PI, 0, 0])), { tone: 1, pat: 'plain', id });
    for (let i = 0; i < 6; i++) B.add(box(0.012, 0.018, 0.01), m.clone().multiply(M([(i - 2.5) * 0.013, -0.012, 0.125])), { tone: 0.0, pat: 'bone', id });
  }
  function longBone(B, p, len = 0.45, yaw = 0, id) {
    id = id ?? B.newId(); const m = M(p, [0, yaw, PI / 2]);
    B.add(limb(len, [[0, 0.03], [0.1, 0.018], [0.9, 0.018], [1, 0.03]], 1, 0.8, 8), m.clone().multiply(M([0, len / 2, 0])), { tone: 0.05, pat: 'bone', id });
    for (const e of [0, 1]) for (const sd of [-1, 1]) B.add(ell(0.028, 0.028, 0.028), m.clone().multiply(M([sd * 0.015, len / 2 - e * len, 0])), { tone: 0.05, pat: 'bone', id });
  }
  function ribs(B, p, r = 0.4, yaw = 0, id) {
    id = id ?? B.newId(); const m = M(p, [0, yaw, 0]);
    B.add(limb(r * 2.2, [[0, 0.025], [1, 0.02]], 1, 1, 6), m.clone().multiply(M([0, r * 0.25, r * 1.1], [PI / 2, 0, 0])), { tone: 0.1, pat: 'bone', id });
    for (let i = 0; i < 6; i++) { const g = new T.TorusGeometry(r * (1 - i * 0.06), 0.014, 5, 16, PI * 0.8); B.add(g, m.clone().multiply(M([0, r * 0.25, r * (0.9 - i * 0.32)], [0, 0, PI * 0.1 + rr(-0.2, 0.2)])), { tone: 0.08, pat: 'bone', id }); }
  }

  M3.Actors = { POSES, POSE_ALIAS, rig, body, armor, cape, sword, spear, shield, figure, horse, beast, skull, longBone, ribs, limb };
})();

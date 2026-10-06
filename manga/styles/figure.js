/* =========================================================
   manga/styles/figure.js — 人物（3D骨格リグ＋肉付け＋顔）
   ・等身（2〜8）、デフォルメ、目の描き方は、どれとどれを組み合わせても描ける
   ・体は 3D の骨格（体の向き yaw を持つ）を正射影して描くので、正面・3/4・横・後ろが同じ仕組み
   ・ポーズは「骨の角度」で決める。名前付きプリセットは POSES
   ========================================================= */
(() => {
  const K = window.MangaStylesKit;
  const { TAU, clamp, lerp, V, rand, rr, seed, hashStr, catmull, ellipsePts, sweep, convexHull, fillPoly, pathPoly, ink, contour, penPath, Layer, compose, derive, setLine, getLight } = K;
  const D = Math.PI / 180;

  /* ---------- ポーズ（骨の角度・度） ----------
     腕・脚：[sw, ab, sw2, ab2]  sw=前へ振る角度（0=真下, 90=前に水平, 180=真上）, ab=横へ開く角度
             1つ目＝付け根の骨（上腕・太もも）、2つ目＝先の骨（前腕・すね）。どれも「体に対する向き」
     n = 手前側（見る人に近い方）, f = 奥側
     lean=前かがみ, twist=上半身のひねり, bend=横への傾き, yaw=体の向きの追加, air=宙に浮く
     head: [うなずき, 横を向く, 首をかしげる]
     hand: 'relax'|'fist'|'open'|'point'|'grip'    */
  const POSES = {
    stand: { arms: { n: [6, 8, 10, 6], f: [-4, 8, 4, 6] }, legs: { n: [3, 4, 0, 2], f: [-3, 4, -2, 2] } },
    walk: { lean: 4, arms: { n: [-24, 6, -6, 4], f: [26, 6, 50, 4] }, legs: { n: [26, 2, 4, 0], f: [-22, 2, -40, 0] }, yaw: 15 },
    run: { lean: 18, arms: { n: [-45, 10, 40, 6, 'fist'], f: [55, 8, 135, 6, 'fist'] }, legs: { n: [62, 2, -10, 0], f: [-38, 2, -105, 0] }, yaw: 25, air: 0.06 },
    jump: { lean: -4, arms: { n: [150, 30, 170, 20, 'open'], f: [140, 30, 165, 20, 'open'] }, legs: { n: [50, 6, -30, 2], f: [10, 6, -70, 2] }, air: 0.22, head: [-12, 0, 0] },
    sit: { lean: 4, arms: { n: [30, 10, 70, 4], f: [26, 10, 66, 4] }, legs: { n: [100, 8, 15, 4], f: [96, 8, 10, 4] }, ground: 'seat' },
    kneel: { lean: 8, arms: { n: [20, 8, 60, 4], f: [6, 8, 30, 4] }, legs: { n: [92, 4, 2, 2], f: [-8, 4, -95, 2] }, ground: 'knee' },
    point: { arms: { n: [92, 6, 94, 4, 'point'], f: [-4, 8, 4, 6] }, legs: { n: [12, 4, 2, 2], f: [-6, 4, -4, 2] }, yaw: 10, head: [0, 10, 0] },
    wave: { arms: { n: [10, 8, 12, 4], f: [100, 70, 165, 50, 'open'] }, legs: { n: [3, 4, 0, 2], f: [-3, 4, -2, 2] }, head: [0, 0, 6] },
    surprise: { lean: -10, arms: { n: [40, 35, 130, 30, 'open'], f: [40, 35, 130, 30, 'open'] }, legs: { n: [-6, 8, -4, 4], f: [10, 8, 4, 4] }, head: [-6, 0, 0] },
    cheer: { arms: { n: [165, 22, 175, 15, 'fist'], f: [160, 22, 175, 15, 'fist'] }, legs: { n: [4, 10, 0, 4], f: [-4, 10, -2, 4] }, head: [-10, 0, 0], air: 0.05 },
    fight: { lean: 10, twist: -15, arms: { n: [70, 12, 140, 6, 'fist'], f: [55, 14, 130, 6, 'fist'] }, legs: { n: [28, 10, 8, 4], f: [-26, 10, -20, 4] }, yaw: 20, head: [6, 0, 0] },
    punch: { lean: 16, twist: 25, arms: { n: [-20, 12, 110, 6, 'fist'], f: [92, 4, 92, 2, 'fist'] }, legs: { n: [40, 6, 10, 2], f: [-30, 6, -30, 2] }, yaw: 25 },
    cast: { arms: { n: [95, 20, 120, 10, 'open'], f: [80, 30, 100, 20, 'open'] }, legs: { n: [12, 8, 2, 4], f: [-8, 8, -4, 4] }, head: [-4, 0, 0] },
    think: { arms: { n: [30, 10, 150, 0, 'fist'], f: [20, 10, 95, -10] }, legs: { n: [3, 4, 0, 2], f: [-3, 4, -2, 2] }, head: [8, 10, -8], handAt: { n: 'chin' } },
    cry: { lean: 10, arms: { n: [40, 8, 165, 0, 'fist'], f: [40, 8, 165, 0, 'fist'] }, legs: { n: [2, 6, 0, 2], f: [-2, 6, -2, 2] }, head: [16, 0, 0], handAt: { n: 'eye', f: 'eye' } },
    hold: { arms: { n: [32, 8, 85, 4, 'grip'], f: [20, 8, 80, 4, 'grip'] }, legs: { n: [3, 4, 0, 2], f: [-3, 4, -2, 2] } },
    armscross: { arms: { n: [24, 10, 95, -55, 'fist'], f: [24, 10, 95, -55, 'fist'] }, legs: { n: [4, 8, 0, 4], f: [-4, 8, -2, 4] }, head: [-4, 0, 0] },
    reach: { lean: 12, arms: { n: [96, 4, 100, 2, 'open'], f: [80, 8, 86, 4, 'open'] }, legs: { n: [30, 4, 6, 2], f: [-14, 4, -12, 2] }, yaw: 15 },
    shrug: { arms: { n: [10, 30, 90, 70, 'open'], f: [10, 30, 90, 70, 'open'] }, legs: { n: [3, 6, 0, 2], f: [-3, 6, -2, 2] }, head: [0, 0, 10] },
    hips: { arms: { n: [12, 45, 120, -30, 'fist'], f: [12, 45, 120, -30, 'fist'] }, legs: { n: [4, 10, 0, 4], f: [-4, 10, -2, 4] }, head: [-4, 0, 0] },
    hide: { lean: 22, arms: { n: [80, 10, 150, -20, 'open'], f: [70, 10, 150, -20, 'open'] }, legs: { n: [50, 8, -40, 4], f: [40, 8, -50, 4] }, ground: 'feet', head: [10, 0, 0] },
    float: { arms: { n: [30, 30, 50, 30, 'open'], f: [30, 30, 50, 30, 'open'] }, legs: { n: [20, 6, -20, 2], f: [5, 6, -40, 2] }, air: 0.15 },
    // 追加：バトル向き
    slash: { lean: 20, twist: 35, arms: { n: [120, 10, 150, 5, 'grip'], f: [100, 15, 140, 10, 'grip'] }, legs: { n: [55, 8, 0, 2], f: [-40, 6, -50, 2] }, yaw: 25, hold: 'sword', swordAng: -30 },
    guard: { lean: 8, twist: -10, arms: { n: [60, 12, 115, 6, 'grip'], f: [55, 14, 110, 6, 'grip'] }, legs: { n: [30, 12, 6, 4], f: [-26, 12, -20, 4] }, yaw: 30, swordAng: -55 },
    crouch: { lean: 30, arms: { n: [40, 12, 80, 6], f: [20, 12, 50, 6] }, legs: { n: [100, 10, -20, 4], f: [70, 10, -60, 4] }, ground: 'feet' },
    fall: { lean: -30, arms: { n: [160, 40, 140, 30, 'open'], f: [110, 50, 90, 40, 'open'] }, legs: { n: [70, 10, 20, 4], f: [30, 10, -10, 4] }, air: 0.2, head: [-15, 0, 10] },
  };
  const POSE_ALIAS = { idle: 'stand', running: 'run', jumping: 'jump', sitting: 'sit', attack: 'slash', swing: 'slash', defend: 'guard', battle: 'fight', ready: 'guard', surprised: 'surprise', crying: 'cry', thinking: 'think' };

  /* ---------- 表情 ---------- */
  // e: 目の状態, b: 眉, m: 口, x: 追加（blush, sweat, vein, tears, gloom, sparkle, shine）
  const EXPRS = {
    normal: { e: 'open', b: 'flat', m: 'line' }, smile: { e: 'open', b: 'soft', m: 'smile' }, happy: { e: 'happy', b: 'soft', m: 'grin' },
    laugh: { e: 'happy', b: 'up', m: 'laugh' }, surprised: { e: 'wide', b: 'up', m: 'o' }, shock: { e: 'shock', b: 'up', m: 'shout', x: ['sweat', 'gloom'] },
    angry: { e: 'glare', b: 'angry', m: 'teeth', x: ['vein'] }, rage: { e: 'shock', b: 'angry', m: 'shout', x: ['vein'] },
    sad: { e: 'half', b: 'sad', m: 'frown' }, cry: { e: 'tearful', b: 'sad', m: 'wail', x: ['tears'] }, worried: { e: 'open', b: 'sad', m: 'wavy', x: ['sweat'] },
    think: { e: 'lookup', b: 'quirk', m: 'side' }, determined: { e: 'glare', b: 'angry', m: 'firm' }, nervous: { e: 'open', b: 'sad', m: 'wavy', x: ['sweat', 'sweat'] },
    sleepy: { e: 'closed', b: 'flat', m: 'o', x: ['zzz'] }, smug: { e: 'half', b: 'quirk', m: 'smirk' }, love: { e: 'heart', b: 'soft', m: 'smile', x: ['blush'] },
    scared: { e: 'shock', b: 'sad', m: 'wavyopen', x: ['sweat', 'gloom'] }, embarrassed: { e: 'away', b: 'sad', m: 'wavy', x: ['blush', 'sweat'] },
    blank: { e: 'blank', b: 'flat', m: 'line' }, pain: { e: 'squeeze', b: 'sad', m: 'teeth', x: ['sweat'] }, funny: { e: 'squeeze', b: 'up', m: 'cat', x: ['blush'] },
  };
  const EXPR_ALIAS = { neutral: 'normal', joy: 'happy', glad: 'happy', grin: 'happy', mad: 'angry', fury: 'rage', crying: 'cry', tears: 'cry', fear: 'scared', afraid: 'scared', serious: 'determined', calm: 'normal', shy: 'embarrassed' };

  /* ---------- 人物の素材（同じ charSpec はどの絵柄でも同じ「人」になる） ---------- */
  const HAIR_MAT = { black: 0.96, tone: 0.5, light: 0.2, white: 0.0, gray: 0.5, brown: 0.6, blonde: 0.15, red: 0.55, blue: 0.7 };
  const PAT_MAT = { white: 0.0, black: 0.94, tone: 0.45, light: 0.2, stripe: 0.0, dots: 0.0, check: 0.0, star: 0.0 };
  const OUTFIT = {
    tshirt: { sleeve: 'short', top: 'waist', bottom: 'pants', collar: 'round' },
    shirt: { sleeve: 'long', top: 'waist', bottom: 'pants', collar: 'shirt', buttons: true },
    suit: { sleeve: 'long', top: 'hip', bottom: 'pants', collar: 'suit', mat: 0.94, tie: true },
    dress: { sleeve: 'short', top: 'waist', bottom: 'skirt', skirt: 'knee', collar: 'round' },
    uniform: { sleeve: 'long', top: 'hip', bottom: 'pants', collar: 'stand', mat: 0.94, buttons: true },
    sailor: { sleeve: 'long', top: 'waist', bottom: 'skirt', skirt: 'knee', collar: 'sailor', skirtMat: 0.9 },
    kimono: { sleeve: 'wide', top: 'waist', bottom: 'skirt', skirt: 'ankle', collar: 'cross', obi: true },
    armor: { sleeve: 'long', top: 'hip', bottom: 'pants', collar: 'stand', armor: true, mat: 0.55 },
    labcoat: { sleeve: 'long', top: 'knee', bottom: 'pants', collar: 'suit', coat: true },
    hoodie: { sleeve: 'long', top: 'hip', bottom: 'pants', collar: 'hood', pocket: true },
    robe: { sleeve: 'wide', top: 'waist', bottom: 'skirt', skirt: 'ankle', collar: 'cross', mat: 0.5 },
    apron: { sleeve: 'short', top: 'waist', bottom: 'skirt', skirt: 'knee', collar: 'round', apron: true },
    jersey: { sleeve: 'long', top: 'waist', bottom: 'pants', collar: 'stand', stripe: true },
    spacesuit: { sleeve: 'long', top: 'hip', bottom: 'pants', collar: 'ring', puffy: true },
    none: { sleeve: 'none', top: 'none', bottom: 'shorts', collar: 'none' },
  };
  const AGE = { child: { H: 0.68, size: 0.64, build: 0.92 }, teen: { H: 0.93, size: 0.87, build: 0.95 }, adult: { H: 1, size: 1, build: 1 }, elder: { H: 0.95, size: 0.92, build: 1 } };
  const ANIMAL_EARS = { cat: 'point', fox: 'bigpoint', dog: 'flop', rabbit: 'long', bear: 'round', panda: 'round', tanuki: 'round', mouse: 'biground', lion: 'round', bird: 'none', penguin: 'none', frog: 'none' };
  const BLOBS = ['ghost', 'slime', 'cloud', 'star'];

  function sizeFactor(spec) {
    const sp = spec.species; let s;
    if (sp === 'cloud') s = 0.62; else if (sp === 'star') s = 0.55; else if (sp === 'slime') s = 0.45; else if (sp === 'ghost') s = 0.85; else if (sp === 'monster') s = 1.25;
    else s = (AGE[spec.age] || AGE.adult).size;
    if (spec.body === 'tall') s *= 1.08; if (['mouse', 'bird', 'frog'].includes(sp)) s *= 0.88;
    return s * clamp(spec.size || 1, 0.4, 2);
  }
  // 体の寸法（px）：art の等身・デフォルメから
  function measure(spec, art, Ht) {
    const ag = AGE[spec.age] || AGE.adult;
    let H = Math.max(1.8, art.headRatio * ag.H); if (BLOBS.includes(spec.species)) H = 2;
    const r = clamp((H - 2) / 6), q = r * (1 - 0.65 * art.deform); // q = 写実度
    const fem = /dress|sailor|skirt/.test(spec.outfit || '') || spec.gender === 'f' ? 1 : 0;
    const bw = spec.body === 'round' ? 1.35 : spec.body === 'slim' ? 0.82 : 1;
    const h = Ht / H, B = Ht - h;
    const m = { H, r, q, fem, h, R: h * 0.5 * lerp(1.06, 1, r), B, Ht, deform: art.deform };
    m.neck = B * lerp(0.02, 0.05, r); m.footH = B * 0.035;
    m.torso = B * lerp(0.43, 0.38, r);
    m.leg = B - m.neck - m.torso - m.footH; m.thigh = m.leg * 0.5; m.shin = m.leg * 0.5;
    m.shHalf = B * lerp(0.27, 0.16, r) * ag.build * (fem ? 0.86 : 1) * (bw > 1 ? 1.12 : 1);
    m.hipHalf = B * lerp(0.17, 0.095, r) * (fem ? 1.12 : 1) * (bw > 1 ? 1.25 : 1);
    m.upper = B * lerp(0.2, 0.205, r); m.fore = B * lerp(0.17, 0.185, r);
    m.armR = B * lerp(0.07, 0.03, r) * (1 + art.deform * 0.25) * (bw > 1 ? 1.3 : bw < 1 ? 0.85 : 1) * (fem ? 0.88 : 1);
    m.legR = B * lerp(0.085, 0.045, r) * (1 + art.deform * 0.2) * (bw > 1 ? 1.35 : bw < 1 ? 0.85 : 1);
    m.hand = B * lerp(0.08, 0.072, r) * lerp(1, 0.9, art.deform); m.foot = B * lerp(0.13, 0.135, r);
    m.waist = m.shHalf * (fem ? 0.62 : 0.74) * (bw > 1 ? 1.45 : 1); m.depth = m.shHalf * lerp(0.75, 0.55, r) * (bw > 1 ? 1.4 : 1);
    m.muscle = (spec.species === 'robot' ? 0 : 1) * q * (1 - art.deform) * (fem ? 0.35 : 1) * (spec.age === 'child' ? 0.2 : 1);
    return m;
  }

  /* ---------- 骨格を組む（3D） ---------- */
  function buildRig(spec, poseName, box, art, m) {
    let P = POSES[poseName] || POSES[POSE_ALIAS[poseName]] || POSES.stand;
    P = JSON.parse(JSON.stringify(P));
    const dyn = art.dynamism, amp = lerp(0.75, 1.35, dyn); // 誇張
    const facing = box.facing == null ? 1 : box.facing, back = !!box.back;
    let yaw = (facing === 0 ? 0 : 52) + (P.yaw || 0) * (facing === 0 ? 0.3 : 1) * lerp(0.6, 1.3, dyn);
    if (back) yaw = facing === 0 ? 180 : 180 - 40;
    if (box.yaw != null) yaw = box.yaw;
    const mir = facing === -1 ? -1 : 1;
    const cy = Math.cos(yaw * D), sy = Math.sin(yaw * D);
    const lean = (P.lean || 0) * amp, twist = (P.twist || 0) * amp, bend = (P.bend || 0) * amp;
    const ex = a => a.map((v, i) => typeof v === 'number' ? (i % 2 === 0 ? v * (Math.abs(v) > 15 ? amp : 1) : v) : v);
    // 体の座標：x=横（外へ+, side で符号）, y=下+, z=前+
    const dirOf = (sw, ab, s) => { const a = ab * D, w = sw * D; return [s * Math.sin(a), Math.cos(a) * Math.cos(w), Math.cos(a) * Math.sin(w)]; };
    const rotY = (p, a) => { const c = Math.cos(a * D), s = Math.sin(a * D); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
    const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
    const J = {};
    J.pelvis = [0, -(m.leg + m.footH), 0];
    const sp = [Math.sin(bend * D), -Math.cos(lean * D) * Math.cos(bend * D), Math.sin(lean * D)];
    J.chest = add3(J.pelvis, sp, m.torso * 0.62);
    J.neckB = add3(J.pelvis, sp, m.torso);
    J.sp = sp;
    const sideN = sy >= 0 ? -1 : 1; // 手前に来る側（x の符号）
    const sides = { n: sideN, f: -sideN };
    for (const k of ['n', 'f']) {
      const s = sides[k];
      const sh = add3(J.neckB, rotY([s * m.shHalf * 0.84, m.torso * 0.07, 0], twist));
      const ar = ex(P.arms[k]);
      const d1 = rotY(dirOf(ar[0], ar[1], s), twist), d2 = rotY(dirOf(ar[2], ar[3], s), twist);
      const el = add3(sh, d1, m.upper), wr = add3(el, d2, m.fore);
      J['sh' + k] = sh; J['el' + k] = el; J['wr' + k] = wr; J['hand' + k] = ar[4] || 'relax'; J['ad' + k] = d2;
      const hp = add3(J.pelvis, [s * m.hipHalf * 0.85, 0, 0]);
      const lg = ex(P.legs[k]);
      const e1 = dirOf(lg[0], lg[1] * 0.5, s), e2 = dirOf(lg[2], lg[3] * 0.5, s);
      const kn = add3(hp, e1, m.thigh), an = add3(kn, e2, m.shin);
      J['hip' + k] = hp; J['kn' + k] = kn; J['an' + k] = an;
      J['toe' + k] = add3(an, [s * 0.15, 0.25, 1], m.foot * 0.85);
    }
    // 手を顔へ（考える・泣く）
    if (P.handAt) for (const k in P.handAt) { const tgt = add3(J.neckB, [sides[k] * m.R * (P.handAt[k] === 'eye' ? 0.35 : 0.1), -m.neck - m.R * (P.handAt[k] === 'eye' ? 0.85 : 0.45), m.R * 0.9]); const sh = J['sh' + k]; const mid = add3(sh, [sides[k] * m.upper * 0.35, m.upper * 0.75, m.upper * 0.45]); J['el' + k] = mid; J['wr' + k] = tgt; }
    // 首と頭
    const hd = P.head || [0, 0, 0];
    J.headNod = (hd[0] || 0) + (box.look === 'down' ? 14 : box.look === 'up' ? -16 : 0); J.headTurn = (hd[1] || 0) + (box.look === 'side' ? 25 : 0); J.headTilt = (hd[2] || 0) * amp;
    J.neckT = add3(J.neckB, sp, m.neck + m.R * 0.15);
    J.head = add3(J.neckT, [0, -m.R * 0.78, m.R * 0.05]);
    // 接地：一番低い点を地面へ
    let air = (P.air || 0) * m.Ht * lerp(0.7, 1.4, dyn);
    let low = -1e9;
    const pts = [J.ann, J.anf, J.toen, J.toef];
    if (P.ground === 'seat') pts.push(add3(J.pelvis, [0, m.legR * 1.2, 0]));
    if (P.ground === 'knee') pts.push(add3(J.knn, [0, m.legR, 0]), add3(J.knf, [0, m.legR, 0]));
    for (const p of pts) low = Math.max(low, p[1] + m.footH * 0.4);
    const dy = -low - air;
    for (const k in J) if (Array.isArray(J[k]) && J[k].length === 3 && k !== 'sp' && k !== 'adn' && k !== 'adf') J[k] = add3(J[k], [0, dy, 0]);
    // 投影：正射影＋弱い遠近（perspective が強いほど、手前の物が大きい）
    const pf = art.perspective * 0.55;
    const cyl = J.pelvis[1];
    const proj = p => {
      const X = (p[0] * cy + p[2] * sy) * mir, Z = -p[0] * sy + p[2] * cy;
      const k = clamp(1 / (1 - Z * pf / m.Ht), 0.6, 1.8);
      return { x: box.footX + X * k, y: box.footY + (cyl + (p[1] - cyl) * k), z: Z, k };
    };
    return { J, proj, yaw, mir, sides, cy, sy, P, rotY, add3, twist, sideN };
  }

  /* ---------- 2D の肉付け ---------- */
  function limb2(A, B, wa, wb, prof) { // prof: [[t, 左の倍率, 右の倍率]...]
    const n = 12, C = []; for (let i = 0; i <= n; i++) C.push(V.lerp(A, B, i / n));
    const ev = t => { for (let i = 0; i < prof.length - 1; i++) if (t <= prof[i + 1][0]) { const u = (t - prof[i][0]) / (prof[i + 1][0] - prof[i][0]), s = u * u * (3 - 2 * u); return [lerp(prof[i][1], prof[i + 1][1], s), lerp(prof[i][2], prof[i + 1][2], s)]; } const l = prof[prof.length - 1]; return [l[1], l[2]]; };
    const sw = sweep(C, t => { const w = lerp(wa, wb, t), e = ev(t); return [w * e[0], w * e[1]]; });
    const d = V.norm(V.sub(B, A)), capA = [], capB = [];
    for (let i = 1; i < 8; i++) { const a = Math.PI * i / 8; capB.push(V.add(B, V.add(V.mul(V.perp(d), Math.cos(a) * wb), V.mul(d, Math.sin(a) * wb * 0.9)))); capA.push(V.add(A, V.add(V.mul(V.perp(d), -Math.cos(a) * wa), V.mul(d, -Math.sin(a) * wa * 0.9)))); }
    return { poly: sw.L.concat(capB, sw.R.slice().reverse(), capA), L: sw.L, R: sw.R, C };
  }

  /* =========================================================
     drawCharacter
     ========================================================= */
  function drawCharacter(ctx, spec, pose, expr, box, opts) {
    spec = spec || {}; box = box || {};
    const art = K.normalizeArt(opts && (opts.art || opts));
    const unit = box.unit || 3, sz = sizeFactor(spec), Ht = 100 * unit * sz;
    seed(hashStr((spec.id || spec.name || 'x') + '|' + pose + '|' + expr + '|' + Math.round(box.footX || 0)));
    const lineSc = clamp(Math.sqrt(Ht / 300), 0.45, 2.2);
    const { line, R } = derive(art, lineSc);
    setLine(line);
    const m = measure(spec, art, Ht);
    const S = K.ctxScale(ctx) * (box.res || 1);
    let rig = buildRig(spec, pose, box, art, m);
    // headAt：頭の中心をその位置に合わせる（バストアップ・アップのコマ用）
    if (box.headAt) { const hp = rig.proj(rig.J.head); box = Object.assign({}, box, { footX: box.footX + box.headAt.x - hp.x, footY: box.footY + box.headAt.y - hp.y }); rig = buildRig(spec, pose, box, art, m); }
    const pad = Ht * 0.9;
    let lb = { x: (box.footX || 0) - pad, y: (box.footY || 0) - Ht * 1.45, w: pad * 2, h: Ht * 1.6 };
    if (box.panel) { const p = box.panel; const x0 = Math.max(lb.x, p.x), y0 = Math.max(lb.y, p.y), x1 = Math.min(lb.x + lb.w, p.x + p.w), y1 = Math.min(lb.y + lb.h, p.y + p.h); lb = { x: x0, y: y0, w: Math.max(4, x1 - x0), h: Math.max(4, y1 - y0) }; }
    const ly = new Layer(lb, S);
    const poseKey = POSES[pose] ? pose : (POSE_ALIAS[pose] || 'stand');
    const freeHand = !NOHOLD.has(poseKey);
    const ctxD = { ly, spec, art, m, rig, R, line, expr: EXPRS[expr] || EXPRS[EXPR_ALIAS[expr]] || EXPRS.normal, exprName: expr, box, hold: box.hold != null ? box.hold : (rig.P.hold || (freeHand ? (spec.items || []).find(i => HELD_SET.has(i)) : null)) };
    if (ctxD.hold === 'none') ctxD.hold = null;
    const res = BLOBS.includes(spec.species) ? drawBlob(ctxD) : art.rough ? drawRough(ctxD) : drawHumanoid(ctxD);
    ctx.save();
    if (box.panel) { ctx.beginPath(); ctx.rect(box.panel.x, box.panel.y, box.panel.w, box.panel.h); ctx.clip(); }
    compose(ctx, ly, R);
    ctx.restore();
    return res;
  }
  const NOHOLD = new Set(['armscross', 'cheer', 'cry', 'think', 'hips', 'shrug', 'hide', 'surprise', 'jump', 'fall', 'wave']);
  const HELD_SET = new Set(['sword', 'staff', 'wand', 'book', 'umbrella', 'bag', 'flower', 'phone', 'cup', 'lantern', 'letter', 'ball', 'blaster', 'shield', 'food', 'mic', 'key', 'camera', 'fishingrod', 'broom', 'bouquet', 'map', 'box', 'guitar', 'sweets']);

  // 線の太さ（基準）
  const LWb = c => 1.5;
  let ROBOT_RINGS = false;
  function part(ly, poly, mat, o = {}) {
    if (ROBOT_RINGS && o.edges && o.edges.length === 2 && o.edges[0].length > 8) { const [A, B] = o.edges; const n = A.length - 1; o.lines = (o.lines || []).concat([0.3, 0.5, 0.7].map(t => ({ p: [A[Math.round(t * n)], B[Math.round(t * n)]], w: 0.7 }))); }
    let ha = o.ha; if (ha == null && o.edges && o.edges[0] && o.edges[0].length > 2) { const e = o.edges[0]; const a = Math.atan2(e[e.length - 1][1] - e[0][1], e[e.length - 1][0] - e[0][0]); ha = K.angBucket(a + Math.PI / 2); }
    ly.fill(poly, mat, { shade: o.shade ?? 0.85, off: o.off ?? 4, blur: o.blur ?? 0.8, ha });
    if (o.inner) o.inner();
    const l = ly.l; l.fillStyle = '#000';
    if (o.edges) for (const e of o.edges) contour(l, e, o.w ?? 1.5, { closed: false, sgn: e.sgn ?? 1, base: 0.55, k: 1, tin: 3, tout: 5 });
    else if (o.outline !== false) contour(l, poly, o.w ?? 1.5, { closed: true, base: 0.5, k: 1.1 });
    if (o.lines) for (const s of o.lines) { l.fillStyle = s.c || '#000'; ink(l, s.p, s.w ?? 0.8, s.o || {}); }
    l.fillStyle = '#000';
  }

  /* ---------- 人型 ---------- */
  function drawHumanoid(C) {
    const { ly, spec, art, m, rig } = C; const { J, proj } = rig;
    const robot = spec.species === 'robot'; C.robot = robot;
    const outfit = OUTFIT[spec.outfit] || (spec.species === 'human' ? OUTFIT.tshirt : OUTFIT.none);
    const items = new Set(spec.items || []);
    if (spec.species === 'monster') items.add('horns');
    const pat = spec.pattern || null;
    const topMat = outfit.mat != null && (!pat || pat === 'white') ? outfit.mat : (PAT_MAT[pat] ?? (outfit.mat ?? 0.0));
    const skinMat = robot ? (spec.color === 'white' ? 0.04 : spec.color === 'dark' || spec.color === 'black' ? 0.85 : spec.color === 'gray' || spec.color === 'tone' ? 0.4 : 0.18)
      : spec.species === 'monster' ? (spec.color === 'white' ? 0.05 : spec.color === 'dark' || spec.color === 'black' ? 0.85 : 0.45)
      : spec.species === 'alien' ? (spec.color === 'dark' ? 0.7 : 0.15)
      : spec.color === 'dark' || spec.color === 'black' ? 0.55 : spec.color === 'gray' || spec.color === 'tone' ? 0.3 : 0;
    const furMat = ANIMAL_EARS[spec.species] ? (spec.color === 'white' ? 0 : spec.species === 'panda' ? 0 : spec.color ? (spec.color === 'dark' || spec.color === 'black' ? 0.9 : 0.35) : (HAIR_MAT[spec.hairColor] ?? 0.35)) : null;
    const bottomMat = outfit.skirtMat ?? (outfit.bottom === 'pants' ? (topMat > 0.6 ? topMat : 0.55) : outfit.bottom === 'shorts' ? 0.85 : topMat);
    const shoeMat = robot ? Math.min(0.9, skinMat + 0.35) : 0.88;
    const capMat = v => v == null ? v : Math.min(v, (C.R.betaM ?? 0.9) - 0.12); // 肌がベタになると顔が消えるので、ベタの手前で止める
    C.mat = { skin: capMat(skinMat), top: topMat, bottom: bottomMat, hair: HAIR_MAT[spec.hairColor] ?? 0.96, shoe: shoeMat, fur: capMat(furMat) };
    const W = m.Ht / 300; // 線の基準
    const parts = [];
    const P2 = p => proj(p);
    // ----- 背中側（マント・翼・しっぽ・後ろ髪）
    if (items.has('cape')) parts.push({ z: -1e3, f: () => drawCape(C) });
    if (items.has('wings')) parts.push({ z: -1e3 + 1, f: () => drawWings(C) });
    if (ANIMAL_EARS[spec.species] || spec.species === 'monster') parts.push({ z: -900, f: () => drawTail(C) });
    parts.push({ z: -800, f: () => drawHead(C, 'back') });
    // ----- 腕・脚
    const sleeve = outfit.sleeve, pants = outfit.bottom;
    for (const k of ['f', 'n']) {
      const sh = P2(J['sh' + k]), el = P2(J['el' + k]), wr = P2(J['wr' + k]);
      const hp = P2(J['hip' + k]), kn = P2(J['kn' + k]), an = P2(J['an' + k]), toe = P2(J['toe' + k]);
      const mus = m.muscle;
      const armMat1 = sleeve === 'none' ? (C.mat.fur ?? skinMat) : topMat, armMat2 = sleeve === 'long' || sleeve === 'wide' ? topMat : (C.mat.fur ?? skinMat);
      const sk = sleeve === 'none' ? 1 : 1.15, wide = sleeve === 'wide';
      const zA = (sh.z + el.z) / 2, zF = (el.z + wr.z) / 2;
      parts.push({ z: zA, f: () => {
        const prof = [[0, 0.95, 0.95], [0.18, 1.05 + mus * 0.3, 1.0 + mus * 0.05], [0.55, 1.0 + mus * 0.12, 0.98 + mus * 0.15], [1, 0.82, 0.82]];
        const L = limb2([sh.x, sh.y], [el.x, el.y], m.armR * sh.k * sk, m.armR * el.k * 0.85 * sk, prof);
        part(ly, L.poly, armMat1, { edges: [L.L, L.R], w: 1.5, off: m.armR * 0.7, lines: mus > 0.5 && sleeve === 'none' ? [{ p: [V.lerp(L.C[2], L.L[2], 0.3), V.lerp(L.C[5], L.L[5], 0.5), V.lerp(L.C[7], L.L[7], 0.85)], w: 0.8 }] : (sleeve === 'short' && art.detail > 0.4 ? [{ p: [V.lerp(L.C[6], L.L[6], 0.9), V.lerp(L.C[9], L.L[9], 0.3)], w: 0.6 }] : []) });
      } });
      parts.push({ z: zF + 0.01, f: () => {
        const sk2 = (sleeve === 'long' ? 1.12 : 1) * (wide ? 1.7 : 1);
        const prof = wide ? [[0, 1, 1], [1, 1.25, 1.25]] : [[0, 1, 1], [0.25, 1.1 + mus * 0.25, 1.05], [0.7, 0.9, 0.88], [1, 0.75, 0.75]];
        const L = limb2([el.x, el.y], [wr.x, wr.y], m.armR * el.k * 0.85 * sk2, m.armR * wr.k * 0.62 * sk2, prof);
        part(ly, L.poly, armMat2, { edges: wide ? null : [L.L, L.R], w: 1.4, off: m.armR * 0.6,
          lines: (sleeve === 'long' && art.detail > 0.3) ? [{ p: [L.L[10], V.lerp(L.C[10], L.C[11], 0.5), L.R[11]], w: 0.7 }, { p: [V.lerp(L.C[1], L.R[1], 0.8), V.lerp(L.C[3], L.R[3], 0.2)], w: 0.6 }] : [] });
        // 手（持ち物の後ろ／前）
        const dir = V.norm([wr.x - el.x, wr.y - el.y]);
        if (C.hold && k === 'n') drawHeld(C, [wr.x, wr.y], dir, wr.k);
        drawHand(C, [wr.x, wr.y], dir, m.hand * wr.k, (C.hold && k === 'n') ? 'grip' : J['hand' + k], k, armMat2 === topMat && !wide ? (C.mat.fur ?? skinMat) : (C.mat.fur ?? skinMat));
      } });
      if (robot) { // 機械の関節（玉）
        const ball = (p, r, z) => parts.push({ z, f: () => { const E = ellipsePts(p.x, p.y, r, r, 0, 18); part(ly, E, Math.min(0.9, skinMat + 0.4), { off: r * 0.5, w: 1.2, lines: [{ p: ellipsePts(p.x, p.y, r * 0.45, r * 0.45, 0, 10), w: 0.5, o: { closed: true } }] }); } });
        ball(sh, m.armR * 1.25 * sh.k, zA + 0.02); ball(el, m.armR * 0.95 * el.k, Math.max(zA, zF) + 0.03);
        ball(kn, m.legR * 0.95 * kn.k, Math.max((hp.z + kn.z) / 2 - 0.5, (kn.z + an.z) / 2 - 0.4) + 0.03);
      }
      const zT = (hp.z + kn.z) / 2 - 0.5, zS = (kn.z + an.z) / 2 - 0.4;
      const legMat1 = pants === 'pants' || pants === 'shorts' ? bottomMat : (C.mat.fur ?? skinMat), legMat2 = pants === 'pants' ? bottomMat : (C.mat.fur ?? skinMat);
      const pk = pants === 'pants' ? 1.12 : 1;
      parts.push({ z: zT, f: () => {
        const prof = [[0, 1.1 + mus * 0.15, 1.0], [0.35, 1.08 + mus * 0.12, 0.95], [1, 0.75, 0.72]];
        const L = limb2([hp.x, hp.y], [kn.x, kn.y], m.legR * hp.k * pk * 1.15, m.legR * kn.k * pk * 0.85, prof);
        const lines = [];
        if ((pants === 'pants') && art.detail > 0.25) for (let i = 0; i < 1 + Math.round(art.detail * 3); i++) { const t = rr(0.45, 0.95), i0 = Math.round(t * 12), sd = rand() < 0.5 ? L.L : L.R; lines.push({ p: [V.lerp(L.C[i0], sd[i0], 0.95), V.lerp(L.C[Math.max(0, i0 - 3)], sd[Math.max(0, i0 - 3)], rr(0.15, 0.5))], w: 0.65 }); }
        part(ly, L.poly, legMat1, { edges: [L.L, L.R], w: 1.6, off: m.legR * 0.8, lines });
      } });
      parts.push({ z: zS, f: () => {
        const prof = [[0, 1, 1], [0.3, 1.08 + mus * 0.15, 1.05], [1, 0.72, 0.72]];
        const L = limb2([kn.x, kn.y], [an.x, an.y], m.legR * kn.k * pk * 0.85, m.legR * an.k * pk * 0.62, prof);
        part(ly, L.poly, legMat2, { edges: [L.L, L.R], w: 1.6, off: m.legR * 0.7 });
        drawShoe(C, an, toe, k);
      } });
    }
    // ----- 胴体
    parts.push({ z: 0, f: () => drawTorso(C, outfit) });
    if (outfit.bottom === 'skirt') parts.push({ z: 0.5, f: () => drawSkirt(C, outfit) });
    if (items.has('scarf')) parts.push({ z: 0.8, f: () => drawScarf(C) });
    parts.push({ z: m.R * 0.2 + 1, f: () => drawHead(C, 'front') });
    // 腕が胴体の前にあるか（z の比較）を、胴の厚み分だけ補正
    parts.forEach(p => { if (p.z > -500 && p.z !== 0 && p.z < m.depth * 0.6 && p.z > -m.depth * 0.6 && Math.abs(p.z) < 1e2) { /* 体の横 */ } });
    ROBOT_RINGS = robot;
    try { parts.sort((a, b) => a.z - b.z).forEach(p => p.f()); } finally { ROBOT_RINGS = false; }
    if (items.has('cape') && rig.yaw > 120) drawCape(C, true);
    // 返り値
    const hc = proj(J.head);
    const xs = [], ys = []; for (const k of ['shn', 'shf', 'ann', 'anf', 'wrn', 'wrf', 'head']) { const p = proj(J[k]); xs.push(p.x); ys.push(p.y); }
    const top = hc.y - m.R * 1.2, bot = Math.max(...ys) + m.footH;
    return { head: { x: hc.x, y: hc.y, r: m.R * hc.k }, body: { x: Math.min(...xs) - m.R * 0.3, y: top, w: Math.max(...xs) - Math.min(...xs) + m.R * 0.6, h: bot - top } };
  }

  /* ---------- ネーム用：アタリ（丸と棒）の人物 ---------- */
  function drawRough(C) {
    const { ly, m, rig, art, spec } = C; const { J, proj } = rig; const l = ly.l;
    C.mat = { skin: 0, top: 0, bottom: 0, hair: HAIR_MAT[spec.hairColor] ?? 0.96, shoe: 0, fur: null };
    const P = k => { const p = proj(J[k]); return [p.x, p.y]; };
    const sk = (a, b, w = 1.1) => ink(l, [a, V.lerp(a, b, 0.5), b], w, { tin: 3, tout: 4 });
    const joint = (p, r) => { const E = ellipsePts(p[0], p[1], r, r, 0, 12); ink(l, E.concat([E[0]]), 0.6, { dense: true }); };
    const order = ['f', 'n'];
    const limbSet = k => { const sh = P('sh' + k), el = P('el' + k), wr = P('wr' + k), hp = P('hip' + k), kn = P('kn' + k), an = P('an' + k), to = P('toe' + k);
      const aw = m.armR * 0.9, lw2 = m.legR * 0.9;
      // 腕と脚：細長い円筒（輪郭だけ）
      for (const [a, b, w] of [[hp, kn, lw2], [kn, an, lw2 * 0.8], [sh, el, aw], [el, wr, aw * 0.8]]) { const L = limb2(a, b, w, w * 0.85, [[0, 1, 1], [1, 1, 1]]); ly.fill(L.poly, 0, { shade: 0 }); ink(l, L.L, 0.8, { dense: true }); ink(l, L.R, 0.8, { dense: true }); }
      joint(el, aw * 0.6); joint(kn, lw2 * 0.6);
      const hr = m.hand * 0.4; const E = ellipsePts(wr[0] + (wr[0] - el[0]) * 0.15, wr[1] + (wr[1] - el[1]) * 0.15, hr, hr, 0, 10); ly.fill(E, 0, { shade: 0 }); ink(l, E.concat([E[0]]), 0.8, { dense: true });
      sk(an, to, 1.4);
      if (C.hold && k === 'n') drawHeld(C, wr, V.norm(V.sub(wr, el)), 1);
    };
    limbSet('f');
    // 胴：胸の楕円＋腰の箱
    const nb = P('neckB'), pv = P('pelvis'), ch = proj(rig.add3(J.pelvis, J.sp, m.torso * 0.68));
    const up = V.norm(V.sub(nb, pv)), ang = Math.atan2(up[1], up[0]) + Math.PI / 2;
    const tw = Math.abs(Math.cos(rig.yaw * Math.PI / 180)) * 0.6 + 0.4;
    const rib = ellipsePts(ch.x, ch.y, m.shHalf * 0.9 * tw + m.depth * 0.3, m.torso * 0.36, ang, 24); ly.fill(rib, 0, { shade: 0 }); ink(l, rib.concat([rib[0]]), 1.0, { dense: true });
    const hipC = V.lerp(pv, nb, 0.08); const hb = ellipsePts(hipC[0], hipC[1], m.hipHalf * 1.25 * tw + m.depth * 0.2, m.torso * 0.16, ang, 18); ly.fill(hb, 0, { shade: 0 }); ink(l, hb.concat([hb[0]]), 0.9, { dense: true });
    sk(V.lerp(nb, pv, -0.02), V.lerp(nb, pv, 0.98), 0.6); // 背骨（中心線）
    sk(P('shn'), P('shf'), 0.7); sk(P('hipn'), P('hipf'), 0.7);
    // 頭：円＋十字のアタリ＋簡単な顔
    const art2 = Object.assign({}, art, { eyeStyle: art.eyeStyle === 'realistic' || art.eyeStyle === 'sharp' ? 'simple' : art.eyeStyle, detail: 0, sparkle: 0 });
    const keep = C.art; C.art = art2;
    const F = C.F = headFrame(C);
    const hc = [F.c.x, F.c.y], R = F.R;
    const head = ellipsePts(hc[0], hc[1], R, R, 0, 28); ly.fill(head, 0, { shade: 0 });
    const jaw = []; for (const sx of [-1, 0, 1]) { const p = F.pt(sx * lerp(0.6, 0.35, F.q), lerp(0.85, 1.15, F.q), lerp(0.3, 0.5, F.q)); jaw.push([p.x, p.y]); }
    const hull = catmull(convexHull(head.concat(jaw)), 2, true); ly.fill(hull, 0, { shade: 0 }); ink(l, hull, 1.1, { dense: true, closed: true });
    C.headHull = hull;
    const cl = []; for (let v = -0.95; v <= 1.0; v += 0.1) { const p = F.sp(0, v); if (p.z > 0) cl.push([p.x, p.y]); }
    if (cl.length > 2) ink(l, cl, 0.5, { dense: true });
    const el = []; const eyeV = lerp(0.3, 0.06, F.q); for (let u = -1.6; u <= 1.6; u += 0.1) { const p = F.sp(u, eyeV); if (p.z > 0) el.push([p.x, p.y]); }
    if (el.length > 2) ink(l, el, 0.5, { dense: true });
    if (F.faceOn > -0.25) drawFace(C, F);
    // 髪：外形だけ、ざっと
    drawHair(C, F, 'front');
    C.art = keep;
    const hp = proj(J.head);
    limbSet('n');
    const xs = ['shn', 'shf', 'ann', 'anf', 'wrn', 'wrf'].map(k => proj(J[k]).x), ys = ['ann', 'anf'].map(k => proj(J[k]).y);
    return { head: { x: hp.x, y: hp.y, r: R }, body: { x: Math.min(...xs) - R * 0.3, y: hp.y - R * 1.2, w: Math.max(...xs) - Math.min(...xs) + R * 0.6, h: Math.max(...ys) - hp.y + R * 1.2 } };
  }

  // 胴体：高さごとの断面（楕円）を体の向きで投影し、外形を作る
  function drawTorso(C, outfit) {
    const { ly, m, rig, art, spec } = C, { J, proj } = rig;
    const secs = [ // t: 骨盤0→首1, a: 横幅の半分, b: 厚みの半分, z: 前への張り出し
      [-0.08, m.hipHalf * 1.25, m.depth * 0.95, 0], [0.12, m.hipHalf * 1.2, m.depth * 0.9, 0], [0.4, m.waist, m.depth * 0.85, 0.02],
      [0.62, lerp(m.waist, m.shHalf, 0.6), m.depth * (m.fem ? 1.05 : 1), m.depth * (m.fem ? 0.2 : 0.1)], [0.84, m.shHalf * 0.92, m.depth * 0.95, m.depth * 0.08], [0.95, m.shHalf * 0.96, m.depth * 0.8, 0], [1.0, m.shHalf * 0.72, m.depth * 0.6, 0], [1.05, m.shHalf * 0.32, m.depth * 0.45, 0],
    ];
    const Lf = [], Rt = [];
    for (const [t, a, b, zc] of secs) {
      const tw = rig.twist * clamp((t - 0.3) / 0.6);
      const c3 = rig.add3(J.pelvis, J.sp, m.torso * t);
      const yawT = (rig.yaw + tw) * Math.PI / 180;
      const half = Math.sqrt((a * Math.cos(yawT)) ** 2 + (b * Math.sin(yawT)) ** 2);
      const cz = rig.add3(c3, rig.rotY([0, 0, zc], tw));
      const c = proj(cz);
      // 背骨の向きに垂直な方向
      const up = proj(rig.add3(cz, J.sp, 10)); const d = V.norm([up.x - c.x, up.y - c.y]); const nn = [-d[1], d[0]];
      Lf.push([c.x - nn[0] * half * c.k, c.y - nn[1] * half * c.k]); Rt.push([c.x + nn[0] * half * c.k, c.y + nn[1] * half * c.k]);
    }
    const poly = catmull(Lf.concat(Rt.slice().reverse()), 6, true);
    const mat = outfit.top === 'none' ? (C.mat.fur ?? C.mat.skin) : C.mat.top;
    const lines = [];
    const T = (t, x, zf = 1) => { // 胴の表面の点（x: -1..1 横, 前面）
      const c3 = rig.add3(J.pelvis, J.sp, m.torso * t);
      const tw = rig.twist * clamp((t - 0.3) / 0.6);
      const a = lerp(m.hipHalf * 1.2, m.shHalf, clamp(t)) * x;
      const zz = Math.sqrt(Math.max(0, 1 - x * x)) * m.depth * zf;
      const p = proj(rig.add3(c3, rig.rotY([a, 0, zz], tw)));
      return [p.x, p.y, p.z - proj(c3).z];
    };
    const front = Math.cos(rig.yaw * Math.PI / 180) > -0.2;
    part(ly, poly, mat, { w: 1.7, off: m.shHalf * 0.5, blur: 1.2, inner: () => {
      // 模様
      drawPattern(C, poly, spec.pattern, outfit);
    } });
    const l = ly.l; l.fillStyle = '#000';
    if (front) {
      // 襟元
      const neckL = T(1.0, -0.38), neckR = T(1.0, 0.38), neckC = T(0.9, 0);
      if (outfit.collar === 'round' || outfit.collar === 'ring') ink(l, [neckL, T(0.94, -0.15), T(0.93, 0), T(0.94, 0.15), neckR], 1.1);
      if (outfit.collar === 'shirt' || outfit.collar === 'suit') { ink(l, [neckL, T(0.8, -0.05), T(0.65, 0)], 1.1); ink(l, [neckR, T(0.8, 0.05), T(0.65, 0)], 1.1); if (outfit.collar === 'suit') { ink(l, [T(0.95, -0.45), T(0.7, -0.3), T(0.45, -0.05)], 1.0); ink(l, [T(0.95, 0.45), T(0.7, 0.3), T(0.45, 0.05)], 1.0); } }
      if (outfit.tie) { const tp = [T(0.86, 0), T(0.8, -0.06), T(0.5, -0.05), T(0.44, 0), T(0.5, 0.05), T(0.8, 0.06)]; ly.fill(catmull(tp, 3, true), 0.2, { shade: 0.5 }); contour(l, catmull(tp, 3, true), 1.0); }
      if (outfit.collar === 'sailor') { const sc = [T(1.0, -0.5), T(0.78, -0.12), T(0.72, 0), T(0.78, 0.12), T(1.0, 0.5), T(0.95, 0.7), T(0.85, 0.3), T(0.8, 0.0), T(0.85, -0.3), T(0.95, -0.7)]; const sp = catmull(sc, 3, true); ly.fill(sp, 0.9, { shade: 0.3 }); contour(l, sp, 1.1); const rb = [T(0.76, 0), T(0.66, -0.18), T(0.6, -0.08), T(0.6, 0.08), T(0.66, 0.18)]; ly.fill(catmull(rb, 3, true), 0.1, { shade: 0.6 }); contour(l, catmull(rb, 3, true), 1.0); }
      if (outfit.collar === 'stand') { ink(l, [neckL, T(0.98, 0), neckR], 1.1); ink(l, [T(0.95, 0), T(0.2, 0)], 0.9); }
      if (outfit.collar === 'cross') { ink(l, [neckL, T(0.75, 0.05), T(0.5, 0.3)], 1.2); ink(l, [neckR, T(0.8, 0.0)], 1.1); }
      if (outfit.collar === 'hood') { const hd = [T(1.04, -0.75), T(0.92, -0.35), T(0.9, 0), T(0.92, 0.35), T(1.04, 0.75), T(1.1, 0)]; ink(l, hd, 1.3, { closed: true }); ink(l, [T(0.86, -0.12), T(0.62, -0.14)], 0.8); ink(l, [T(0.86, 0.12), T(0.62, 0.14)], 0.8); }
      if (outfit.buttons) for (let i = 0; i < 4; i++) { const p = T(0.82 - i * 0.16, 0.02); l.beginPath(); l.arc(p[0], p[1], 0.9 * C.line.w, 0, 7); l.fill(); }
      if (outfit.pocket) ink(l, [T(0.3, -0.5), T(0.42, -0.3), T(0.42, 0.3), T(0.3, 0.5)], 0.9);
      if (outfit.apron) { const ap = catmull([T(0.75, -0.42), T(0.75, 0.42), T(0.1, 0.62), T(-0.6, 0.6), T(-0.6, -0.6), T(0.1, -0.62)], 3, true); ly.fill(ap, 0, { shade: 0.5 }); contour(l, ap, 1.2); }
      if (outfit.obi) { const ob = catmull([T(0.48, -1), T(0.48, 1), T(0.3, 1), T(0.3, -1)], 2, true); ly.fill(ob, 0.85, { shade: 0.3 }); contour(l, ob, 1.2); }
      if (outfit.armor) { const pl = catmull([T(0.95, -0.7), T(0.95, 0.7), T(0.55, 0.75), T(0.45, 0), T(0.55, -0.75)], 3, true); ly.fill(pl, 0.3, { shade: 0.9, off: m.shHalf * 0.4 }); contour(l, pl, 1.5); ink(l, [T(0.9, 0), T(0.5, 0)], 0.9); for (const sd of [-1, 1]) { const sp = catmull([T(1.05, sd * 0.75), T(1.08, sd * 1.15), T(0.8, sd * 1.2), T(0.78, sd * 0.85)], 3, true); ly.fill(sp, 0.4, { shade: 0.9 }); contour(l, sp, 1.4); } }
      if (outfit.stripe) { ink(l, [T(0.95, -0.92), T(0.2, -0.95)], 1.2); ink(l, [T(0.95, 0.92), T(0.2, 0.95)], 1.2); }
      if (outfit.coat) { ink(l, [T(0.6, -0.02), T(-0.75, -0.08)], 1.0); }
      if (C.robot && outfit.top === 'none') { // 胸の装甲板・コア・腹の蛇腹
        const pl = catmull([T(0.92, -0.62), T(0.92, 0.62), T(0.6, 0.55), T(0.52, 0), T(0.6, -0.55)], 2, true); ly.fill(pl, Math.min(0.9, C.mat.skin + 0.15), { shade: 0.7, off: m.shHalf * 0.3 }); contour(l, pl, 1.3);
        const cc = T(0.76, 0); const core = ellipsePts(cc[0], cc[1], m.shHalf * 0.16, m.shHalf * 0.16, 0, 16); ly.fill(core, 0.9, { shade: 0 }); contour(l, core, 1.0); ly.hi.beginPath(); ly.hi.arc(cc[0], cc[1], m.shHalf * 0.07, 0, TAU); ly.hi.fill();
        for (let i = 0; i < 3; i++) { const t = 0.42 - i * 0.1; ink(l, [T(t, -0.7), T(t - 0.02, 0), T(t, 0.7)], 0.8); }
        for (const sx of [-0.8, 0.8]) { const p = T(0.88, sx); l.beginPath(); l.arc(p[0], p[1], m.shHalf * 0.035, 0, TAU); l.fill(); }
      }
      // 体の起伏（服の上から・描き込みに応じて）
      if (art.detail > 0.35 && m.q > 0.3) { if (m.fem) { ink(l, [T(0.66, -0.55), T(0.6, -0.3), T(0.64, -0.1)], 0.7); ink(l, [T(0.64, 0.1), T(0.6, 0.3), T(0.66, 0.55)], 0.7); } else if (outfit.top === 'none' || m.muscle > 0.6) { ink(l, [T(0.7, -0.6), T(0.66, -0.2), T(0.72, -0.02)], 0.8); ink(l, [T(0.72, 0.02), T(0.66, 0.2), T(0.7, 0.6)], 0.8); if (outfit.top === 'none') { for (let i = 0; i < 3; i++) { ink(l, [T(0.5 - i * 0.1, -0.15), T(0.5 - i * 0.1, 0.15)], 0.5); } ink(l, [T(0.62, 0), T(0.2, 0)], 0.6); } } }
      // しわ
      for (let i = 0; i < Math.round(art.detail * 4 * (outfit.top === 'none' ? 0 : 1)); i++) { const t0 = rr(0.25, 0.85), x0 = rr(-0.7, 0.7); ink(l, [T(t0, x0), T(t0 - rr(0.1, 0.2), x0 + rr(-0.3, 0.3))], 0.6); }
    }
    // 帯・ベルト
    if (outfit.top !== 'none' && outfit.top !== 'knee' && !outfit.obi && outfit.bottom === 'pants') { const b1 = [T(0.05, -1), T(0.03, 0), T(0.05, 1)]; ink(l, b1, 0.9); }
    if (outfit.top === 'knee') { // 白衣のすそ
      const hem = [T(0.95, -0.98), T(0.2, -1.15), T(-0.9, -1.25), T(-0.95, 0), T(-0.9, 1.25), T(0.2, 1.15), T(0.95, 0.98)];
      const hp = catmull(hem, 4, true); ly.fill(hp, C.mat.top, { shade: 0.7, off: m.shHalf * 0.5 }); contour(l, hp, 1.6); ink(l, [T(0.6, 0), T(-0.9, 0.05)], 1.0);
    }
  }
  function drawPattern(C, poly, pat, outfit) {
    if (!pat || !['stripe', 'dots', 'check', 'star'].includes(pat)) return;
    const { ly, m } = C; const l = ly.m; const b = K.bbox(poly), u = m.shHalf * 0.28;
    l.save(); l.beginPath(); pathPoly(l, poly); l.clip(); l.fillStyle = ly.g(0.94);
    if (pat === 'stripe') for (let y = b.y + u * 0.6; y < b.y + b.h; y += u * 1.1) l.fillRect(b.x - 2, y, b.w + 4, u * 0.5);
    if (pat === 'dots') for (let y = b.y, i = 0; y < b.y + b.h + u; y += u * 0.9, i++) for (let x = b.x + (i % 2) * u * 0.55; x < b.x + b.w + u; x += u * 1.1) { l.beginPath(); l.arc(x, y, u * 0.2, 0, 7); l.fill(); }
    if (pat === 'check') { l.fillStyle = ly.g(0.45); for (let y = b.y; y < b.y + b.h; y += u * 1.2) l.fillRect(b.x, y, b.w, u * 0.6); for (let x = b.x; x < b.x + b.w; x += u * 1.2) l.fillRect(x, b.y, u * 0.6, b.h); }
    if (pat === 'star') for (let y = b.y, i = 0; y < b.y + b.h + u; y += u * 1.5, i++) for (let x = b.x + (i % 2) * u * 0.75; x < b.x + b.w + u; x += u * 1.5) { const st = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? u * 0.18 : u * 0.42; st.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } fillPoly(l, st); }
    l.restore();
  }
  function drawSkirt(C, outfit) {
    const { ly, m, rig } = C, { J, proj } = rig;
    const len = outfit.skirt === 'ankle' ? m.leg * 0.98 : m.leg * 0.48;
    const w0 = m.hipHalf * 1.2, w1 = (outfit.skirt === 'ankle' ? m.hipHalf * 1.3 : m.hipHalf * 1.6) * lerp(1, 1.25, C.art.dynamism * (C.rig.P.air ? 1 : 0.3));
    const top = rig.add3(J.pelvis, J.sp, m.torso * 0.1);
    // 脚の開きに合わせて裾を広げる
    const kn = proj(J.knn), kf = proj(J.knf), c0 = proj(top);
    const spread = Math.abs(kn.x - kf.x) * 0.5;
    const bot = [ (kn.x + kf.x) / 2, c0.y + len * c0.k ];
    const hw = Math.max(w1 * lerp(1, 0.78, Math.abs(Math.sin(rig.yaw * Math.PI / 180))), spread + m.legR * 1.3);
    const pts = [[c0.x - w0, c0.y], [c0.x + w0, c0.y], [bot[0] + hw, bot[1]], [bot[0] + hw * 0.5, bot[1] + len * 0.04], [bot[0], bot[1] - len * 0.02], [bot[0] - hw * 0.5, bot[1] + len * 0.04], [bot[0] - hw, bot[1]]];
    const poly = catmull(pts, 4, true);
    const lines = []; const nf = 2 + Math.round(C.art.detail * 4);
    for (let i = 1; i < nf; i++) { const t = i / nf; lines.push({ p: [[lerp(c0.x - w0, c0.x + w0, t), c0.y + len * 0.25], [lerp(bot[0] - hw, bot[0] + hw, t), bot[1]]], w: 0.7, o: { tin: len * 0.4, tout: 1 } }); }
    part(ly, poly, C.mat.bottom, { w: 1.6, off: hw * 0.3, lines });
  }
  function drawHand(C, W, dir, hs, kind, k, mat) {
    const { ly, art, m } = C; const n = V.perp(dir), sgn = (C.rig.mir) * (k === 'n' ? 1 : -1);
    const L = (x, y) => V.add(W, V.add(V.mul(dir, x * hs), V.mul(n, y * hs * sgn)));
    const simple = art.deform > 0.55 || hs < 7;
    if (simple) {
      const c = L(0.45, 0); const r = hs * 0.5;
      const P = ellipsePts(c[0], c[1], r, r * 0.9, Math.atan2(dir[1], dir[0]), 20);
      part(ly, P, mat, { w: 1.2, off: r * 0.4 });
      if (kind === 'open' || kind === 'point') { const th = catmull([L(0.2, 0.35), L(0.45, 0.75), L(0.7, 0.5)], 4); ink(ly.l, th, 1.0); }
      return;
    }
    if (kind === 'open' || kind === 'relax') {
      const palm = catmull([L(0, -0.3), L(0.55, -0.38), L(0.6, 0.35), L(0.05, 0.32)], 4, true);
      const fingers = [];
      const spread = kind === 'open' ? 0.22 : 0.06;
      for (let i = 0; i < 4; i++) { const a = (i - 1.5) * spread, d2 = V.rot(dir, a * sgn), b0 = L(0.55, -0.28 + i * 0.19); const len = hs * [0.48, 0.55, 0.52, 0.42][i] * (kind === 'relax' ? 0.85 : 1); const tip = V.add(b0, V.mul(d2, len)); fingers.push(limb2(b0, tip, hs * 0.085, hs * 0.07, [[0, 1, 1], [1, 1, 1]]).poly); }
      const tb = L(0.12, 0.32), tt = V.add(tb, V.mul(V.rot(dir, 0.9 * sgn), hs * 0.45));
      fingers.push(limb2(tb, tt, hs * 0.11, hs * 0.08, [[0, 1, 1], [1, 1, 1]]).poly);
      for (const f of fingers) part(ly, f, mat, { w: 1.0, off: hs * 0.05 });
      part(ly, palm, mat, { w: 1.2, off: hs * 0.1 });
    } else { // 拳・握る・指さし
      const fist = catmull([L(-0.05, -0.32), L(0.35, -0.38), L(0.62, -0.25), L(0.66, 0.1), L(0.55, 0.36), L(0.05, 0.36)], 4, true);
      const lines = [];
      for (let i = 0; i < 3; i++) { const y = -0.22 + i * 0.17; lines.push({ p: [L(0.38, y + 0.08), L(0.58, y + 0.1)], w: 0.6 }); }
      lines.push({ p: [L(0.05, 0.25), L(0.35, 0.12), L(0.5, 0.05)], w: 0.9 });
      part(ly, fist, mat, { w: 1.3, off: hs * 0.12, lines });
      if (kind === 'point') { const b0 = L(0.55, -0.25), tip = V.add(b0, V.mul(dir, hs * 0.6)); part(ly, limb2(b0, tip, hs * 0.09, hs * 0.075, [[0, 1, 1], [1, 1, 1]]).poly, mat, { w: 1.0 }); }
    }
  }
  function drawShoe(C, an, toe, k) {
    const { ly, m } = C;
    const A = [an.x, an.y], T = [toe.x, toe.y]; const d = V.sub(T, A); const len = V.len(d);
    const fw = m.legR * an.k * 1.0;
    let poly;
    if (len < fw * 1.4) { poly = ellipsePts(an.x + d[0] * 0.5, an.y + fw * 0.35 + d[1] * 0.3, fw * 1.05, fw * 0.62, 0, 22); }
    else {
      const u = V.norm(d), n = [0, -1], sgn = 1;
      const P = (x, y) => [A[0] + u[0] * x * len, A[1] + u[1] * x * len + y * fw];
      poly = catmull([P(-0.28, -0.4), P(0.25, -0.65), P(0.75, -0.25), P(1.06, 0.2), P(1.0, 0.62), P(-0.25, 0.65)], 4, true);
    }
    part(ly, poly, C.mat.shoe, { w: 1.4, off: fw * 0.3 });
  }

  /* ---------- 頭 ---------- */
  function headFrame(C) {
    const { m, rig, art } = C, { J, proj } = rig;
    const c = proj(J.head); const R = m.R * c.k;
    const yaw = (rig.yaw + rig.twist + J.headTurn) * D, nod = J.headNod * D, tilt = J.headTilt * D * rig.mir;
    const q = m.q;
    // 顔の上の点 (u: 横の角度, v: 縦 -1..1.2) → 画面
    const sp = (u, v, rad = 1, zOff = 0) => {
      const cv = Math.sqrt(Math.max(0, 1 - Math.min(1, v * v)));
      let x = Math.sin(u) * cv * rad, y = v * rad, z = Math.cos(u) * cv * rad + zOff;
      // うなずき
      const y2 = y * Math.cos(nod) - z * Math.sin(nod), z2 = y * Math.sin(nod) + z * Math.cos(nod); y = y2; z = z2;
      // 向き
      const X = x * Math.cos(yaw) + z * Math.sin(yaw), Z = -x * Math.sin(yaw) + z * Math.cos(yaw);
      let sx = X * rig.mir, sy = y;
      const tx = sx * Math.cos(tilt) - sy * Math.sin(tilt), ty = sx * Math.sin(tilt) + sy * Math.cos(tilt);
      return { x: c.x + tx * R, y: c.y + ty * R, z: Z, vis: Z > -0.05 };
    };
    const pt = (x, y, z) => { // 頭の局所座標（R単位）
      let y2 = y * Math.cos(nod) - z * Math.sin(nod), z2 = y * Math.sin(nod) + z * Math.cos(nod);
      const X = x * Math.cos(yaw) + z2 * Math.sin(yaw), Z = -x * Math.sin(yaw) + z2 * Math.cos(yaw);
      const sx = X * rig.mir; const tx = sx * Math.cos(tilt) - y2 * Math.sin(tilt), ty = sx * Math.sin(tilt) + y2 * Math.cos(tilt);
      return { x: c.x + tx * R, y: c.y + ty * R, z: Z };
    };
    const faceOn = Math.cos(yaw); // 1=正面, 0=横, -1=後ろ
    return { c, R, yaw, nod, tilt, q, sp, pt, faceOn, side: Math.sin(yaw) * rig.mir };
  }
  function drawHead(C, phase) {
    if (C.robot) { if (phase !== 'back') drawRobotHead(C); return; }
    const { ly, m, art, spec } = C; const F = C.F || (C.F = headFrame(C));
    const { R, q, pt } = F;
    const items = new Set(spec.items || []);
    if (phase === 'back') { drawHair(C, F, 'back'); return; }
    // 首
    const { J, proj } = C.rig;
    const nb = proj(J.neckB), nt = proj(C.rig.add3(J.neckT, [0, 0, 0]));
    const nw = m.R * lerp(0.28, 0.32, q) * nb.k;
    if (m.neck > 1) { const nk = limb2([nb.x, nb.y], [nt.x, nt.y - R * 0.1], nw * 1.1, nw, [[0, 1, 1], [1, 1, 1]]); part(C.ly, nk.poly, C.mat.fur ?? C.mat.skin, { edges: [nk.L, nk.R], w: 1.3, off: nw * 0.6 }); }
    // 頭の形：頭蓋（球）＋あご
    const chinY = lerp(0.82, 1.18, q), jawW = lerp(0.8, 0.66, q), jawY = lerp(0.55, 0.72, q), chinZ = lerp(0.35, 0.55, q), chinW = lerp(0.42, 0.18, q);
    const pts = [];
    // 頭蓋は球なので、どの向きでも画面上では円
    for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; pts.push([F.c.x + Math.cos(a) * R * 0.98, F.c.y + Math.sin(a) * R * 0.98]); }
    for (const sx of [-1, 1]) { const j = pt(sx * jawW, jawY, lerp(0.1, 0.0, q)); pts.push([j.x, j.y]); const cw = pt(sx * chinW, chinY * 0.97, chinZ); pts.push([cw.x, cw.y]); }
    const ch = pt(0, chinY, chinZ); pts.push([ch.x, ch.y]);
    // 動物の鼻先
    const sp = spec.species, animal = ANIMAL_EARS[sp];
    if (animal && sp !== 'frog' && sp !== 'penguin') { const mz = pt(0, 0.38, 1.15 - 0.1 * (1 - q)); pts.push([mz.x, mz.y]); const mz2 = pt(0, 0.55, 1.0); pts.push([mz2.x, mz2.y]); }
    let hull = convexHull(pts);
    hull = catmull(hull, 3, true);
    const skin = C.mat.fur ?? C.mat.skin;
    // 耳（人）
    const ears = [];
    if (!animal || sp === 'bird') for (const sx of [-1, 1]) { const e = F.sp(sx * Math.PI / 2 * 0.98, lerp(0.25, 0.12, q)); if (e.z > -0.6) ears.push({ sx, e }); }
    // 動物の耳（頭の上）
    if (animal && animal !== 'none') drawAnimalEars(C, F, animal, 'back');
    part(ly, hull, skin, { w: 1.7, off: R * 0.25, blur: R * 0.04 });
    for (const { sx, e } of ears) { if (e.z <= -0.15) continue; const ex = e.x, ey = e.y, er = R * lerp(0.2, 0.17, q); const P = ellipsePts(ex + F.side * 0, ey, er * 0.62, er, F.tilt, 16); part(ly, P, skin, { w: 1.2, off: er * 0.3, lines: [{ p: [[ex - er * 0.1, ey - er * 0.5], [ex - er * 0.3 * Math.sign(sx * C.rig.mir), ey], [ex - er * 0.05, ey + er * 0.5]], w: 0.6 }] }); }
    C.headHull = hull;
    if (F.faceOn > -0.25) drawFace(C, F);
    drawHair(C, F, 'front');
    if (animal && animal !== 'none') drawAnimalEars(C, F, animal, 'front');
    if (sp === 'alien') for (const sx of [-0.45, 0.45]) antenna(C, F.pt(sx, -0.85, 0.1), V.norm([sx * 0.8, -1]), R * 0.7);
    drawWorn(C, F, items);
  }

  function antenna(C, p, d, len) { const { ly } = C; const tip = [p.x + d[0] * len, p.y + d[1] * len]; ink(ly.l, [[p.x, p.y], tip], 1.1, { tin: 1, tout: 1 }); const E = ellipsePts(tip[0], tip[1], len * 0.16, len * 0.16, 0, 12); ly.fill(E, 0.6, { shade: 0.5 }); contour(ly.l, E, 1.0); }
  // ロボットの頭：角を丸めた箱（3Dで向きが変わる）＋バイザー＋アンテナ
  function drawRobotHead(C) {
    const { ly, m, art, spec } = C; const F = C.F || (C.F = headFrame(C)); const { R, pt } = F; const l = ly.l;
    const metal = C.mat.skin;
    const { J, proj } = C.rig;
    const nb = proj(J.neckB), nt = proj(J.neckT); const nw = m.R * 0.22 * nb.k;
    if (m.neck > 1) { const nk = limb2([nb.x, nb.y], [nt.x, nt.y], nw, nw, [[0, 1, 1], [1, 1, 1]]); part(ly, nk.poly, Math.min(0.9, metal + 0.4), { edges: [nk.L, nk.R], w: 1.2 }); }
    const hx = 0.92, y0 = -0.95, y1 = lerp(0.75, 0.9, F.q), hz = 0.85;
    const faces = [
      { c: [0, (y0 + y1) / 2, hz], n: [0, 0, 1], q: [[-hx, y0, hz], [hx, y0, hz], [hx, y1, hz], [-hx, y1, hz]], k: 'front' },
      { c: [0, (y0 + y1) / 2, -hz], n: [0, 0, -1], q: [[hx, y0, -hz], [-hx, y0, -hz], [-hx, y1, -hz], [hx, y1, -hz]], k: 'back' },
      { c: [hx, (y0 + y1) / 2, 0], n: [1, 0, 0], q: [[hx, y0, hz], [hx, y0, -hz], [hx, y1, -hz], [hx, y1, hz]], k: 'side' },
      { c: [-hx, (y0 + y1) / 2, 0], n: [-1, 0, 0], q: [[-hx, y0, -hz], [-hx, y0, hz], [-hx, y1, hz], [-hx, y1, -hz]], k: 'side' },
      { c: [0, y0, 0], n: [0, -1, 0], q: [[-hx, y0, -hz], [hx, y0, -hz], [hx, y0, hz], [-hx, y0, hz]], k: 'top' },
    ];
    const vis = faces.filter(f => pt(f.c[0] + f.n[0] * 0.1, f.c[1] + f.n[1] * 0.1, f.c[2] + f.n[2] * 0.1).z - pt(...f.c).z > 0.001 || (f.k === 'top' && pt(0, y0 - 0.1, 0).y < pt(0, y0, 0).y - R * 0.02 && F.nod > 0.05));
    // 外形（丸い角）
    const all = []; for (const f of faces) for (const v of f.q) { const p = pt(...v); all.push([p.x, p.y]); }
    const hull = catmull(convexHull(all), 3, true);
    // アンテナ（奥）
    const ant = pt(0, y0, 0), antDir = V.norm(V.sub([pt(0, y0 - 1, 0).x, pt(0, y0 - 1, 0).y], [ant.x, ant.y]));
    antenna(C, ant, antDir, R * 0.65);
    ly.fill(hull, metal, { shade: 0.85, off: R * 0.3 }); C.headHull = hull;
    const proj4 = q => q.map(v => { const p = pt(...v); return [p.x, p.y]; });
    for (const f of vis) { if (f.k === 'side' || f.k === 'top') { const P = proj4(f.q); ly.fill(P, Math.min(0.92, metal + (f.k === 'top' ? 0.08 : 0.25)), { shade: 0.3, off: 0, knock: false }); ink(l, P.concat([P[0]]), 0.8, { dense: true, tin: 1, tout: 1 }); } }
    contour(l, hull, 1.7);
    // 耳のボルト
    for (const sx of [-1, 1]) { const b = pt(sx * (hx + 0.02), 0, 0); const dz = pt(sx * (hx + 0.12), 0, 0).z - b.z; if (dz <= 0) continue; const E = ellipsePts(b.x, b.y, R * 0.2 * Math.min(1, dz * 12), R * 0.2, 0, 14); ly.fill(E, 0.75, { shade: 0.4 }); contour(l, E, 1.0); }
    const front = vis.find(f => f.k === 'front');
    if (front) {
      const fs = clamp(pt(0, 0, hz + 0.1).z - pt(0, 0, hz).z, 0, 0.1) * 10;
      // バイザー
      const vz = hz + 0.01, va = -0.42, vb = 0.12;
      const visor = proj4([[-hx * 0.82, va, vz], [hx * 0.82, va, vz], [hx * 0.82, vb, vz], [-hx * 0.82, vb, vz]]);
      ly.fill(visor, 0.94, { shade: 0, knock: false }); ink(l, visor.concat([visor[0]]), 1.0, { dense: true });
      // 目（光る）：表情と目の描き方に合わせる
      const e = C.expr.e, st = art.eyeStyle; const ew = R * lerp(0.1, 0.2, art.eyeSize) * (st === 'sparkle' ? 1.3 : 1);
      for (const sx of [-1, 1]) {
        const c = pt(sx * 0.4, (va + vb) / 2, vz); const w = ew * Math.max(0.35, fs);
        l.fillStyle = '#fff';
        if (e === 'happy' || e === 'closed') { l.save(); l.fillStyle = '#fff'; ink(l, e === 'happy' ? [[c.x - w, c.y + ew * 0.3], [c.x, c.y - ew * 0.5], [c.x + w, c.y + ew * 0.3]] : [[c.x - w, c.y], [c.x + w, c.y]], 1.6, { noRough: true }); l.restore(); }
        else if (e === 'glare' || st === 'sharp') { fillPoly(l, [[c.x - w * 1.2, c.y - ew * 0.25 * sx * (e === 'glare' ? 1 : 0.3)], [c.x + w * 1.2, c.y + ew * 0.25 * sx * (e === 'glare' ? 1 : 0.3)], [c.x + w * 1.2, c.y + ew * 0.45], [c.x - w * 1.2, c.y + ew * 0.45]]); }
        else { const r = ew * (e === 'shock' || e === 'wide' ? 1.25 : st === 'dot' ? 0.55 : 0.9); l.beginPath(); l.ellipse(c.x, c.y, r * Math.max(0.35, fs), r, 0, 0, TAU); l.fill(); if (st !== 'dot' && e !== 'shock') { l.fillStyle = '#000'; l.beginPath(); l.arc(c.x, c.y, r * 0.35, 0, TAU); l.fill(); } if (st === 'sparkle') drawStar(l, c.x - r * 0.3, c.y - r * 0.3, r * 0.5, '#fff'); }
        l.fillStyle = '#000';
      }
      // 口：表情の口＋格子
      const mp = pt(0, 0.45, vz);
      if (['line', 'firm', 'side'].includes(C.expr.m)) { const g = proj4([[-0.4, 0.38, vz], [0.4, 0.38, vz], [0.4, 0.58, vz], [-0.4, 0.58, vz]]); ly.fill(g, 0.5, { shade: 0, knock: false }); ink(l, g.concat([g[0]]), 0.8, { dense: true }); for (let i = -2; i <= 2; i++) { const a = pt(i * 0.13, 0.38, vz), b = pt(i * 0.13, 0.58, vz); ink(l, [[a.x, a.y], [b.x, b.y]], 0.5); } }
      else drawMouth(C, F, [mp.x, mp.y], C.expr.m, art.deform > 0.7);
      for (const x of C.expr.x || []) drawExtra(C, F, x, []);
      // パネルの線・ねじ
      if (art.detail > 0.3) { const a = pt(-hx, -0.62, vz), b = pt(hx, -0.62, vz); ink(l, [[a.x, a.y], [b.x, b.y]], 0.6); for (const sx of [-0.75, 0.75]) { const p = pt(sx, 0.62, vz); l.beginPath(); l.arc(p.x, p.y, R * 0.04, 0, TAU); l.fill(); } }
    } else { // 後ろ：排気口
      for (let i = 0; i < 3; i++) { const a = pt(-0.5, -0.3 + i * 0.2, -hz - 0.01), b = pt(0.5, -0.3 + i * 0.2, -hz - 0.01); if (a.z > 0) ink(l, [[a.x, a.y], [b.x, b.y]], 0.9); }
    }
    drawWorn(C, F, new Set(spec.items || []));
  }

  // ---- 顔のパーツ ----
  function drawFace(C, F) {
    const { ly, m, art, spec } = C; const { R, q } = F; const l = ly.l; const e = C.expr;
    const look = C.box.look;
    const sz = art.eyeSize, st = art.eyeStyle === 'round' ? 'simple' : art.eyeStyle;
    const gag = art.deform > 0.7;
    const eyeV = lerp(0.3, 0.06, q) * (st === 'sparkle' ? 1.05 : 1) + (spec.species === 'frog' ? -0.5 : 0), eyeU = lerp(0.45, 0.4, q) * lerp(1, 1.12, sz * (1 - q * 0.5));
    // 目の大きさ（頭の半径に対して）
    const base = { dot: [0.13, 0.13], simple: [0.24, 0.3], sparkle: [0.32, 0.42], sharp: [0.36, 0.17], realistic: [0.3, 0.15] }[st] || [0.24, 0.3];
    const es = lerp(0.55, 1.45, sz) * lerp(1, 0.75, q * (st === 'sparkle' ? 0.3 : 0.6));
    const ew = R * base[0] * es, eh = R * base[1] * es;
    const eyes = [];
    for (const sx of [-1, 1]) {
      const p = F.sp(sx * eyeU, eyeV);
      if (p.z < 0.12) continue;
      const fs = clamp(p.z * 1.1, 0.25, 1);
      eyes.push({ sx, x: p.x, y: p.y, w: ew * fs, h: eh, fs, scr: Math.sign((p.x - F.c.x) || sx) });
    }
    const lk = look === 'up' ? [0, -0.3] : look === 'down' ? [0, 0.3] : [F.side * 0.35, 0];
    // 眉
    const bv = { flat: [0, 0], soft: [0.05, -0.05], up: [-0.25, 0], angry: [0.2, 0.55], sad: [-0.1, -0.5], quirk: [-0.15, 0.2] }[e.b] || [0, 0];
    for (const E of eyes) {
      const by = E.y - E.h * (st === 'dot' ? 1.9 : 1.05) - R * 0.07 + bv[0] * R * 0.25 * (gag ? 1.5 : 1);
      const inner = E.scr * -1; // 鼻側
      const bw = Math.max(E.w * 1.15, R * 0.2 * E.fs);
      const tilt = bv[1] * (e.b === 'quirk' && E.sx > 0 ? -1 : 1);
      const p0 = [E.x + inner * bw * 0.6, by + tilt * R * 0.08], p1 = [E.x - inner * bw * 0.6, by - tilt * R * 0.08];
      const thick = lerp(0.9, 2.2, q * (1 - art.softness * 0.5)) * (spec.age === 'elder' ? 1.3 : 1);
      ink(l, [p0, [ (p0[0] + p1[0]) / 2, Math.min(p0[1], p1[1]) - R * 0.04 ], p1], thick, { tin: 1, tout: bw * 0.5 });
      if (st === 'realistic' && q > 0.4 && art.hatching > 0.3) ly.shadeIn(C.headHull, ellipsePts(E.x, E.y - E.h * 0.5, E.w * 1.2, E.h * 1.1, 0, 14), 0.55, R * 0.06);
    }
    for (const E of eyes) drawEye(C, E, st, e.e, lk, gag);
    // 鼻
    const np = F.sp(0, lerp(0.55, 0.42, q)); const ns = R * lerp(0.05, 0.16, q);
    if (np.z > 0.1) {
      const sd = F.side;
      if (q < 0.25 || art.deform > 0.6) { if (st !== 'dot' || q > 0.1) { l.beginPath(); l.arc(np.x + sd * ns * 0.5, np.y, Math.max(0.6, ns * 0.25) * C.line.w, 0, TAU); l.fill(); } }
      else {
        ink(l, [[np.x + sd * ns * 0.6, np.y - ns * 1.6], [np.x + sd * ns * 1.0, np.y - ns * 0.2], [np.x + sd * ns * 0.3, np.y + ns * 0.35]], 0.8, { tin: ns, tout: 1 });
        if (q > 0.55) { ink(l, [[np.x - sd * ns * 0.4, np.y + ns * 0.25], [np.x - sd * ns * 0.05, np.y + ns * 0.45]], 0.7); ly.shadeIn(C.headHull, ellipsePts(np.x - sd * ns * 0.3, np.y - ns * 0.3, ns * 0.5, ns * 1.2, 0, 10), 0.75, R * 0.04); }
      }
    }
    // 動物の鼻・ひげ
    const sp = spec.species, animal = ANIMAL_EARS[sp];
    if (animal) drawMuzzle(C, F, sp);
    // 口
    if ((spec.items || []).includes('beard')) drawBeard(C, F);
    const mp = F.sp(0, lerp(0.72, 0.78, q)); if (mp.z > 0) drawMouth(C, F, [mp.x + F.side * R * 0.05, mp.y], e.m, gag);
    // 追加（汗・赤面・青筋・涙・暗い縦線）
    for (const x of e.x || []) drawExtra(C, F, x, eyes);
    // 頬・あごの線（写実寄り）
    if (q > 0.55 && art.detail > 0.4 && F.faceOn < 0.92) { const ck = F.sp(-F.side * 0.0 + Math.sign(F.side) * 0.75, 0.45); if (ck.z > 0) ink(l, [[ck.x, ck.y - R * 0.12], [ck.x - F.side * R * 0.03, ck.y + R * 0.06]], 0.6); }
    if (spec.species === 'robot') { const vp = F.sp(0, eyeV); ink(l, [[vp.x - R * 0.75, vp.y - eh * 1.2], [vp.x + R * 0.75, vp.y - eh * 1.2]], 1.0); ink(l, [[vp.x - R * 0.75, vp.y + eh * 1.2], [vp.x + R * 0.75, vp.y + eh * 1.2]], 1.0); }
  }
  function drawEye(C, E, st, state, lk, gag) {
    const { ly, art } = C; const l = ly.l, hi = ly.hi;
    const { x, y, w, h, fs, scr } = E; const sp = art.sparkle; const outer = scr; // 目尻の向き
    const lw = C.line.w;
    const happyArc = () => ink(l, [[x - w, y + h * 0.25], [x, y - h * 0.55], [x + w, y + h * 0.25]], 1.6, { tin: 2, tout: 2 });
    const closedLine = () => ink(l, [[x - w, y], [x, y + h * 0.25], [x + w, y]], 1.4, { tin: 2, tout: 2 });
    if (state === 'happy') return happyArc();
    if (state === 'closed') return closedLine();
    if (state === 'squeeze') { ink(l, [[x - outer * w, y - h * 0.5], [x + outer * w * 0.6, y], [x - outer * w, y + h * 0.5]], 1.7, { tin: 1, tout: 2 }); return; }
    if (state === 'heart' && (gag || art.sparkle > 0.4 || art.deform > 0.4)) { const s = Math.max(w, h) * 0.9; const P = []; for (let i = 0; i < 30; i++) { const t = i / 30 * TAU; P.push([x + s * 0.06 * 16 * Math.pow(Math.sin(t), 3) * fs, y - s * 0.06 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } l.fillStyle = '#000'; fillPoly(l, P); return; }
    const shock = state === 'shock', wide = state === 'wide' || shock, half = state === 'half' || state === 'away' || state === 'glare' || state === 'tearful';
    const blank = state === 'blank';
    // 崩し：白目に点
    if (gag && (shock || blank)) { const r = Math.max(w, h) * 1.05; const P = ellipsePts(x, y, r * fs, r * 1.1, 0, 22); ly.fill(P, 0, { shade: 0, knock: false }); contour(l, P, 1.3); if (!blank) { l.beginPath(); l.arc(x, y, r * 0.12, 0, TAU); l.fill(); } return; }
    const look = [lk[0] * w * 0.4, lk[1] * h * 0.4];
    if (st === 'dot') {
      const r = Math.max(1, w * (wide ? 0.75 : 0.62));
      if (half) { ink(l, [[x - r * 1.5, y - r * 0.2], [x + r * 1.5, y - r * 0.2]], 1.2); l.beginPath(); l.ellipse(x + look[0], y + r * 0.25, r * 0.8 * fs, r * 0.6, 0, 0, TAU); l.fill(); return; }
      if (wide) { l.lineWidth = 1.1 * lw; l.strokeStyle = '#000'; l.beginPath(); l.ellipse(x, y, r * 1.6 * fs, r * 1.8, 0, 0, TAU); l.stroke(); l.beginPath(); l.arc(x + look[0], y + look[1], r * 0.45, 0, TAU); l.fill(); return; }
      l.beginPath(); l.ellipse(x + look[0], y + look[1], r * fs, r * 1.15, 0, 0, TAU); l.fill();
      if (sp > 0.3) { hi.beginPath(); hi.arc(x + look[0] - r * 0.3, y + look[1] - r * 0.4, r * 0.3, 0, TAU); hi.fill(); l.fillStyle = '#fff'; l.beginPath(); l.arc(x + look[0] - r * 0.3, y + look[1] - r * 0.4, r * 0.3, 0, TAU); l.fill(); l.fillStyle = '#000'; }
      return;
    }
    // 目の形（上まぶた・下まぶた）
    let up, lo, open = 1;
    if (st === 'sharp') { up = [[x - outer * w, y + h * 0.15], [x - outer * w * 0.2, y - h * 0.65], [x + outer * w, y - h * 0.35]]; lo = [[x - outer * w * 0.9, y + h * 0.2], [x, y + h * 0.5], [x + outer * w * 0.95, y - h * 0.1]]; }
    else if (st === 'realistic') { up = [[x - outer * w, y + h * 0.1], [x - outer * w * 0.15, y - h * 0.6], [x + outer * w, y + h * 0.05]]; lo = [[x - outer * w * 0.9, y + h * 0.15], [x, y + h * 0.5], [x + outer * w, y + h * 0.05]]; }
    else if (st === 'sparkle') { up = [[x - outer * w * 1.1, y - h * 0.05], [x - outer * w * 0.1, y - h * 0.62], [x + outer * w * 1.05, y - h * 0.38]]; lo = [[x - outer * w * 0.8, y + h * 0.35], [x, y + h * 0.55], [x + outer * w * 0.7, y + h * 0.42]]; }
    else { up = [[x - w, y - h * 0.15], [x, y - h * 0.55], [x + w, y - h * 0.15]]; lo = [[x - w * 0.9, y + h * 0.2], [x, y + h * 0.52], [x + w * 0.9, y + h * 0.2]]; }
    if (half) { open = state === 'glare' ? 0.65 : 0.5; up = up.map(p => [p[0], lerp(p[1], y + h * 0.15, 1 - open + (state === 'glare' ? 0.1 : 0))]); }
    if (wide) { up = up.map(p => [p[0], p[1] - h * 0.12]); lo = lo.map(p => [p[0], p[1] + h * 0.1]); }
    const eyeP = catmull(up, 6).concat(catmull(lo, 6).reverse());
    // 白目
    ly.fill(eyeP, 0, { shade: 0, knock: false });
    // 黒目
    const irR = st === 'sparkle' ? w * 0.72 : st === 'sharp' ? h * 0.65 : st === 'realistic' ? h * 0.62 : w * 0.6;
    const irH = st === 'sparkle' ? h * 0.48 : irR;
    const pr = shock ? 0.35 : 1;
    const ix = x + look[0] + (st === 'sharp' ? -outer * w * 0.1 : 0), iy = y + look[1] + (st === 'sparkle' ? h * 0.05 : 0);
    l.save(); l.beginPath(); pathPoly(l, eyeP); l.clip();
    if (st === 'sparkle') {
      // 瞳：上が濃いグラデーション（トーンで表す）＋ 瞳孔 ＋ 大小のハイライト
      const ir = ellipsePts(ix, iy, irR * fs * pr, irH * pr, 0, 24);
      ly.matIn(eyeP, ir, 0.55); ly.matIn(eyeP, ellipsePts(ix, iy - irH * 0.45 * pr, irR * fs * pr, irH * 0.55 * pr, 0, 20), 0.95, irR * 0.15);
      l.lineWidth = 0.9 * lw; l.strokeStyle = '#000'; l.beginPath(); pathPoly(l, ir); l.stroke();
      l.beginPath(); l.ellipse(ix, iy + irH * 0.05, irR * 0.42 * fs * pr, irH * 0.42 * pr, 0, 0, TAU); l.fill();
    } else if (st === 'realistic') {
      const ir = ellipsePts(ix, iy, irR * fs * pr, irR * pr, 0, 22); ly.matIn(eyeP, ir, 0.45);
      l.lineWidth = 0.8 * lw; l.strokeStyle = '#000'; l.beginPath(); pathPoly(l, ir); l.stroke();
      l.beginPath(); l.arc(ix, iy, irR * 0.42 * pr, 0, TAU); l.fill();
      // 上まぶたの落ち影
      ly.shadeIn(eyeP, ellipsePts(x, y - h * 0.5, w * 1.2, h * 0.45, 0, 12), 0.8, 0);
    } else {
      l.beginPath(); l.ellipse(ix, iy, irR * fs * pr, irR * (st === 'simple' ? 1.15 : 1) * pr, 0, 0, TAU); l.fill();
    }
    l.restore();
    // ハイライト（白い艶）
    const hl = (dx, dy, r) => { l.fillStyle = '#fff'; l.beginPath(); l.ellipse(ix + dx, iy + dy, r * fs, r, 0, 0, TAU); l.fill(); l.fillStyle = '#000'; };
    if (!shock && !blank) {
      if (st === 'sparkle') { hl(-irR * 0.35 * outer, -irH * 0.45, irR * 0.32); hl(irR * 0.35 * outer, irH * 0.4, irR * 0.14); if (sp > 0.5) { hl(irR * 0.1, -irH * 0.1, irR * 0.08); drawStar(l, ix + irR * 0.25 * outer, iy - irH * 0.2, irR * 0.25 * sp, '#fff'); } }
      else if (st === 'simple') hl(-irR * 0.3, -irR * 0.35, irR * 0.3);
      else hl(-irR * 0.3 * outer, -irR * 0.3, irR * 0.22);
    }
    // まぶたの線
    const upW = st === 'sparkle' ? 2.6 : st === 'sharp' ? 2.0 : st === 'realistic' ? 1.4 : 1.3;
    ink(l, catmull(up, 6), upW, { dense: true, tin: w * 0.3, tout: w * 0.2 });
    if (st === 'sparkle') { // まつげ
      const p = up[2]; for (let i = 0; i < 3; i++) { const a = [-0.9, -0.5, -0.1][i]; const d = [outer * Math.cos(a), Math.sin(a) - 0.3]; ink(l, [V.lerp(up[1], p, 0.6 + i * 0.2), V.add(V.lerp(up[1], p, 0.6 + i * 0.2), V.mul(V.norm(d), h * (0.35 - i * 0.05)))], 1.0, { tin: 0.5, tout: 3 }); }
      ink(l, [lo[0], lo[1], lo[2]].map((p, i) => p), 0.6, { tin: 2, tout: 2 });
    } else if (st === 'realistic') {
      ink(l, catmull(lo, 5), 0.55, { dense: true, tin: 2, tout: 2 });
      ink(l, catmull(up.map(p => [p[0], p[1] - h * 0.35]), 5).slice(3, -2), 0.6, { dense: true, tin: 2, tout: 3 }); // 二重
    } else if (st === 'sharp') { ink(l, catmull(lo, 4).slice(4), 0.6, { dense: true, tin: 1, tout: 2 }); }
    else { if (art.detail > 0.4) ink(l, catmull(lo, 4).slice(2, -2), 0.5, { dense: true }); }
  }
  function drawStar(c, x, y, r, col) { const P = []; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr2 = k % 2 ? r * 0.25 : r; P.push([x + Math.cos(a) * rr2, y + Math.sin(a) * rr2]); } c.fillStyle = col; fillPoly(c, catmull(P, 2, true)); c.fillStyle = '#000'; }
  function drawMouth(C, F, p, kind, gag) {
    const { ly, art } = C; const l = ly.l; const R = F.R, q = F.q; const [x, y] = p;
    const w = R * lerp(0.2, 0.26, q) * (gag ? 1.4 : 1) * clamp(F.faceOn + 0.4, 0.5, 1.1);
    const off = F.side * w * 0.2;
    const blackFill = P => { ly.fill(P, 0.97, { shade: 0, knock: false }); };
    switch (kind) {
      case 'smile': ink(l, [[x - w * 0.9 + off, y - w * 0.2], [x + off, y + w * 0.25], [x + w * 0.9 + off, y - w * 0.2]], 1.2); break;
      case 'grin': case 'laugh': {
        const k = kind === 'laugh' ? 1.4 : 1;
        const P = catmull([[x - w * k + off, y - w * 0.25], [x + w * k + off, y - w * 0.25], [x + off + w * 0.3, y + w * 0.9 * k], [x + off - w * 0.3, y + w * 0.9 * k]], 4, true);
        blackFill(P); contour(l, P, 1.2);
        if (q > 0.3) { l.fillStyle = '#fff'; fillPoly(l, catmull([[x - w * k * 0.8 + off, y - w * 0.18], [x + w * k * 0.8 + off, y - w * 0.18], [x + w * k * 0.7 + off, y + w * 0.05], [x - w * k * 0.7 + off, y + w * 0.05]], 2, true)); l.fillStyle = '#000'; }
        else { ly.matIn(P, ellipsePts(x + off, y + w * 0.75 * k, w * 0.5, w * 0.3, 0, 12), 0.45); }
        break; }
      case 'o': { const P = ellipsePts(x + off, y + w * 0.1, w * 0.35, w * 0.45, 0, 16); blackFill(P); contour(l, P, 1.0); break; }
      case 'shout': case 'wail': case 'wavyopen': {
        const k = kind === 'shout' ? 1.25 : 1;
        const P = kind === 'wavyopen' ? catmull([[x - w * 0.8 + off, y], [x - w * 0.3 + off, y - w * 0.2], [x + w * 0.3 + off, y], [x + w * 0.8 + off, y - w * 0.2], [x + w * 0.6 + off, y + w * 0.6], [x - w * 0.6 + off, y + w * 0.6]], 3, true)
          : catmull([[x - w * k + off, y - w * 0.35], [x + off, y - w * 0.45], [x + w * k + off, y - w * 0.35], [x + w * 0.6 * k + off, y + w * 1.2 * k], [x - w * 0.6 * k + off, y + w * 1.2 * k]], 4, true);
        blackFill(P); contour(l, P, 1.3);
        if (q > 0.4 && kind === 'shout') { l.fillStyle = '#fff'; fillPoly(l, catmull([[x - w * 0.9 + off, y - w * 0.32], [x + w * 0.9 + off, y - w * 0.32], [x + w * 0.8 + off, y - w * 0.12], [x - w * 0.8 + off, y - w * 0.12]], 2, true)); l.fillStyle = '#000'; }
        ly.matIn(P, ellipsePts(x + off, y + w * 1.0 * k, w * 0.55, w * 0.35, 0, 12), 0.5);
        break; }
      case 'frown': ink(l, [[x - w * 0.8 + off, y + w * 0.2], [x + off, y - w * 0.15], [x + w * 0.8 + off, y + w * 0.2]], 1.2); break;
      case 'wavy': ink(l, [[x - w * 0.9 + off, y], [x - w * 0.45 + off, y - w * 0.15], [x + off, y + w * 0.05], [x + w * 0.45 + off, y - w * 0.15], [x + w * 0.9 + off, y]], 1.1); break;
      case 'teeth': { const P = catmull([[x - w * 0.9 + off, y - w * 0.18], [x + w * 0.9 + off, y - w * 0.18], [x + w * 0.85 + off, y + w * 0.3], [x - w * 0.85 + off, y + w * 0.3]], 2, true); ly.fill(P, 0, { shade: 0, knock: false }); contour(l, P, 1.3); ink(l, [[x - w * 0.85 + off, y + w * 0.06], [x + w * 0.85 + off, y + w * 0.06]], 0.7); for (let i = -2; i <= 2; i++) ink(l, [[x + off + i * w * 0.32, y - w * 0.16], [x + off + i * w * 0.32, y + w * 0.28]], 0.5); break; }
      case 'firm': ink(l, [[x - w * 0.7 + off, y], [x + w * 0.7 + off, y + w * 0.04]], 1.4, { tin: 2, tout: 3 }); break;
      case 'side': ink(l, [[x - w * 0.3 + off, y + w * 0.05], [x + w * 0.6 + off, y - w * 0.08]], 1.1); break;
      case 'smirk': ink(l, [[x - w * 0.6 + off, y + w * 0.05], [x + w * 0.2 + off, y + w * 0.08], [x + w * 0.75 + off, y - w * 0.25]], 1.2); break;
      case 'cat': ink(l, [[x - w * 0.8 + off, y - w * 0.15], [x - w * 0.4 + off, y + w * 0.2], [x + off, y - w * 0.05], [x + w * 0.4 + off, y + w * 0.2], [x + w * 0.8 + off, y - w * 0.15]], 1.2); break;
      default: ink(l, [[x - w * 0.6 + off, y], [x + w * 0.6 + off, y]], 1.1, { tin: 2, tout: 2 });
    }
    // 下唇の影（写実寄り）
    if (q > 0.6 && art.detail > 0.5 && ['line', 'firm', 'frown', 'smirk', 'side'].includes(kind)) ink(l, [[x - w * 0.25 + off, y + w * 0.45], [x + w * 0.25 + off, y + w * 0.45]], 0.6);
  }
  function drawExtra(C, F, kind, eyes) {
    const { ly, art } = C; const l = ly.l; const R = F.R; const c = F.c;
    const side = F.side >= 0 ? 1 : -1;
    if (kind === 'blush') { for (const E of eyes) for (let i = 0; i < 3 + Math.round(art.sparkle * 2); i++) { const bx = E.x + (i - 1.5) * R * 0.08, by = E.y + E.h * 0.9 + R * 0.08; ink(l, [[bx + R * 0.03, by - R * 0.04], [bx - R * 0.03, by + R * 0.05]], 0.7, { tin: 1, tout: 1 }); } }
    if (kind === 'sweat') { const sx = c.x + side * R * rr(0.7, 1.0), sy = c.y - R * rr(0.2, 0.6); const P = catmull([[sx, sy - R * 0.25], [sx + R * 0.12, sy + R * 0.05], [sx, sy + R * 0.15], [sx - R * 0.12, sy + R * 0.05]], 4, true); ly.fill(P, 0, { shade: 0 }); contour(l, P, 1.0); l.fillStyle = '#000'; }
    if (kind === 'vein') { const vx = c.x - side * R * 0.55, vy = c.y - R * 0.7, s = R * 0.18; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; const p = [vx + Math.cos(a) * s * 0.35, vy + Math.sin(a) * s * 0.35]; ink(l, [V.add(p, V.mul([Math.cos(a + 0.8), Math.sin(a + 0.8)], s * 0.5)), V.add(p, V.mul([Math.cos(a), Math.sin(a)], s * 0.2)), V.add(p, V.mul([Math.cos(a - 0.8), Math.sin(a - 0.8)], s * 0.5))], 1.3); } }
    if (kind === 'tears') { for (const E of eyes) { const x0 = E.x, y0 = E.y + E.h * 0.4; const big = art.deform > 0.6; const P = big ? [[x0 - R * 0.06, y0], [x0 - R * 0.1, y0 + R * 1.0], [x0 + R * 0.1, y0 + R * 1.0], [x0 + R * 0.06, y0]] : [[x0, y0], [x0 - R * 0.05, y0 + R * 0.35], [x0, y0 + R * 0.45], [x0 + R * 0.05, y0 + R * 0.35]]; const pp = catmull(P, 3, true); ly.fill(pp, 0, { shade: 0 }); contour(l, pp, 0.8); } }
    if (kind === 'gloom') { const hh = ly.l; for (let i = 0; i < 6; i++) { const x = c.x - R * 0.5 + i * R * 0.2, y0 = c.y - R * 0.75, y1 = c.y - R * rr(0.1, 0.35); ink(hh, [[x, y0], [x, y1]], 0.8, { tin: 1, tout: (y1 - y0) * 0.6 }); } }
    if (kind === 'zzz') { const sx = c.x + side * R * 1.2, sy = c.y - R * 1.1; for (let i = 0; i < 3; i++) { const s = R * (0.18 + i * 0.07), x = sx + side * i * R * 0.3, y = sy - i * R * 0.35; ink(l, [[x - s, y - s], [x + s, y - s], [x - s, y + s], [x + s, y + s]], 0.9, { seg: 1 }); } }
  }

  // ---- 髪 ----
  // 髪型ごとの生え際（前・横・後ろの高さ, -1=頭頂, 0=目の高さ）と前髪の長さ、後ろ髪の長さ
  const HAIR = {
    short: { f: -0.45, s: -0.05, b: 0.75, bang: 0.25, back: 0 }, spiky: { f: -0.5, s: -0.1, b: 0.7, bang: 0.32, back: 0 },
    messy: { f: -0.45, s: 0.1, b: 0.85, bang: 0.38, back: 0.7 }, bob: { f: -0.52, s: 0.62, b: 0.95, bang: 0.44, back: 0.95, even: 1 },
    long: { f: -0.5, s: 0.5, b: 0.9, bang: 0.4, back: 2.6 }, ponytail: { f: -0.52, s: -0.08, b: 0.6, bang: 0.24, back: 0 },
    twintail: { f: -0.5, s: 0.0, b: 0.7, bang: 0.32, back: 0 }, bun: { f: -0.6, s: -0.12, b: 0.55, bang: 0.12, back: 0 },
    curly: { f: -0.45, s: 0.3, b: 0.9, bang: 0.3, back: 1.2, curl: 1 }, braid: { f: -0.5, s: 0.0, b: 0.7, bang: 0.26, back: 0 },
  };
  function drawHair(C, F, phase) {
    const { ly, spec, art, m } = C; const ha0 = ly.ha; ly.ha = 1; try { drawHair2(C, F, phase); } finally { ly.ha = ha0; } }
  function drawHair2(C, F, phase) {
    const { ly, spec, art, m } = C; const { pt, R, c } = F;
    let hair = spec.species === 'alien' || (ANIMAL_EARS[spec.species] && !spec.keepHair) ? 'bald' : spec.hair || (ANIMAL_EARS[spec.species] || spec.species === 'robot' ? 'bald' : 'short');
    const H = HAIR[hair];
    const mat = C.mat.hair; const q = F.q, dyn = art.dynamism;
    const vol = lerp(1.13, 1.07, q) * (H && H.curl ? 1.1 : 1);
    const moving = (C.rig.P.air || (C.rig.P.lean || 0) > 10) ? 1 : 0.25;
    const wind = dyn * moving;
    const back = -Math.sign(F.side || 0.0001); // 画面上で「頭の後ろ」の向き
    const l = ly.l;
    const shine = (P) => { if (mat < 0.5) return; const b = K.bbox(P); const g = ly.hi; g.save(); g.beginPath(); pathPoly(g, P); g.clip(); g.lineWidth = Math.max(0.6, R * 0.05) * lerp(0.6, 1.2, q); g.strokeStyle = '#fff'; g.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = -2.5 + i * 0.28; g.beginPath(); g.arc(c.x - F.side * R * 0.2, c.y + R * 0.15, R * 0.78, a, a + 0.12 + 0.05 * (i % 2)); g.stroke(); } g.restore(); };
    const flowLines = (P, n) => { const b = K.bbox(P); for (let i = 0; i < n; i++) { const x = b.x + rr(0.15, 0.85) * b.w; ink(mat > 0.6 ? ly.hi : l, [[x, b.y + b.h * rr(0.2, 0.4)], [x + rr(-3, 3), b.y + b.h * rr(0.7, 0.95)]], 0.6, { tin: 4, tout: 8 }); } };
    if (hair === 'bald' || !H) { if (phase === 'front' && art.detail > 0.3 && mat === undefined) {} return; }
    const tailRootZ = pt(0, -0.45, -0.85).z;
    const tails = () => {
      const tail = (root, dir, len, w) => { const C2 = []; for (let i = 0; i <= 5; i++) { const t = i / 5; C2.push(V.add(root, V.add(V.mul(dir, len * t), [Math.sin(t * 3 + 1) * w * 0.3 * (1 + wind), t * t * len * 0.12 * (1 - wind)]))); } const cc = catmull(C2, 4); const sw = K.sweep(cc, t => w * (t < 0.15 ? lerp(0.55, 1, t / 0.15) : lerp(1, 0.12, (t - 0.15) / 0.85) * (1 + 0.12 * Math.sin(t * 9)))); const P = sw.poly; ly.fill(P, mat, { shade: 0.8, off: w * 0.4 }); contour(l, P, 1.4); shine(P); for (let i = 0; i < 3; i++) ink(mat > 0.6 ? ly.hi : l, cc.slice(3 + i, -4).map(p => [p[0] + (i - 1) * w * 0.25, p[1]]), 0.55, { dense: true, tin: 3, tout: 8 }); };
      const flow = V.norm([back * lerp(0.35, 1.8, wind), lerp(1, 0.35, wind)]);
      if (hair === 'ponytail') { const r0 = pt(0, -0.5, -0.9); const tie = ellipsePts(r0.x, r0.y, R * 0.12, R * 0.12, 0, 10); tail([r0.x, r0.y], flow, R * lerp(1.5, 2.4, q), R * 0.38); ly.fill(tie, 0.2, { shade: 0 }); contour(l, tie, 1); }
      if (hair === 'twintail') for (const sx of [-1, 1]) { const r0 = pt(sx * 0.82, -0.4, -0.25); tail([r0.x, r0.y], V.norm([(r0.x - c.x) / R * 0.5 + flow[0] * 0.6, 1]), R * lerp(1.4, 2.3, q), R * 0.34); }
      if (hair === 'braid') { const r0 = pt(0, 0.35, -0.9); const dir = V.norm([flow[0] * 0.6, 1]); for (let i = 0; i < 7; i++) { const cc = V.add([r0.x, r0.y], V.mul(dir, R * 0.3 * i)); const P = ellipsePts(cc[0] + (i % 2 ? 1 : -1) * R * 0.04, cc[1], R * 0.16 * (1 - i * 0.06), R * 0.19, 0, 14); ly.fill(P, mat, { shade: 0.7, off: R * 0.08 }); contour(l, P, 1.0); } }
      if (hair === 'bun') { const r0 = pt(0, -0.85, -0.6); const P = ellipsePts(r0.x, r0.y, R * 0.4, R * 0.36, 0, 20); ly.fill(P, mat, { shade: 0.8, off: R * 0.15 }); contour(l, P, 1.3); shine(P); }
    };
    if (phase === 'back') {
      // 後ろ髪：頭の円から下へ垂れる（頭と体の後ろ）
      if (H.back > 0.6) {
        const L = H.back, top = [];
        for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; top.push([c.x + Math.cos(a) * vol * R, c.y + Math.sin(a) * vol * R]); }
        const dx = back * wind * R * 0.9 * Math.min(1, L);
        const flare = L > 1.5 ? 1.25 : 1.05;
        const bl = [c.x + vol * R * flare + dx * (back > 0 ? 1 : 0.4), c.y + L * R], br = [c.x - vol * R * flare + dx * (back < 0 ? 1 : 0.4), c.y + L * R];
        const pts = top.concat([[c.x + vol * R, c.y], bl]);
        const tips = H.even ? 3 : Math.round(lerp(4, 8, 1 - art.deform));
        for (let i = 1; i < tips; i++) { const t = i / tips; pts.push([lerp(bl[0], br[0], t), lerp(bl[1], br[1], t) + (i % 2 ? -R * (H.even ? 0.03 : 0.16) : R * 0.04)]); }
        pts.push(br, [c.x - vol * R, c.y]);
        const P = catmull(pts, 4, true);
        ly.fill(P, mat, { shade: 0.85, off: R * 0.35 }); contour(l, P, 1.4); shine(P); flowLines(P, Math.round(2 + art.detail * 5));
      }
      if (tailRootZ < 0.1) tails();
      return;
    }
    // ---- 前：生え際の線（球の上）＋ 頭の外形の円弧 ----
    const vOf = u => { const a = Math.abs(u); return a <= Math.PI / 2 ? lerp(H.f, H.s, Math.pow(a / (Math.PI / 2), 1.6)) : lerp(H.s, H.b, (a - Math.PI / 2) / (Math.PI / 2)); };
    const N = 72, line = [];
    for (let i = 0; i < N; i++) { const u = -Math.PI + i / N * TAU; const p = F.sp(u, Math.max(-0.97, Math.min(0.97, vOf(u))), vol); line.push({ u, p }); }
    // 見えている区間（連続）を取り出す
    let start = line.findIndex((o, i) => o.p.z <= 0 && line[(i + 1) % N].p.z > 0);
    let vis = [];
    if (start < 0) vis = line.every(o => o.p.z > 0) ? line : [];
    else for (let k = 1; k <= N; k++) { const o = line[(start + k) % N]; if (o.p.z > 0) vis.push(o); else break; }
    let P;
    if (vis.length < 2) {
      const all = []; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; all.push([c.x + Math.cos(a) * vol * R, c.y + Math.sin(a) * vol * R]); } P = all;
    } else {
      // 前髪：おでこ側（|u|<1.1）をギザギザの房に
      const nb = Math.round(lerp(4, 9, (1 - art.deform) * 0.6 + q * 0.4)) + (hair === 'messy' || hair === 'spiky' ? 2 : 0);
      const edge = [];
      const bangW = H.even ? 1.25 : 1.1;
      let lastBang = -1;
      for (const o of vis) {
        if (Math.abs(o.u) < bangW && H.bang > 0.05) {
          const idx = Math.floor((o.u + bangW) / (2 * bangW) * nb);
          if (idx !== lastBang) {
            lastBang = idx;
            const u0 = -bangW + (idx + 0.5) / nb * 2 * bangW;
            const len = H.bang * (H.even ? 1 : 0.75 + 0.45 * Math.abs(Math.sin(idx * 2.7 + 1))) * (1 - Math.abs(u0) * 0.25);
            const sway = (hair === 'spiky' || hair === 'messy') ? rr(-0.25, 0.25) : 0.12 * (F.side);
            const tip = F.sp(u0 + sway, Math.min(0.9, vOf(u0) + len), vol * 1.02);
            const rootA = F.sp(-bangW + idx / nb * 2 * bangW, vOf(u0) + 0.02, vol);
            if (rootA.z > 0) edge.push([rootA.x, rootA.y]);
            if (tip.z > 0) edge.push([tip.x, tip.y]);
          }
        } else edge.push([o.p.x, o.p.y]);
      }
      const e1 = edge[0], e2 = edge[edge.length - 1];
      const ang = p => Math.atan2(p[1] - c.y, p[0] - c.x);
      const arcPts = (a0, a1, dir) => { const o = []; let d = a1 - a0; if (dir > 0 && d < 0) d += TAU; if (dir < 0 && d > 0) d -= TAU; for (let i = 1; i < 24; i++) { const a = a0 + d * i / 24; o.push([c.x + Math.cos(a) * vol * R, c.y + Math.sin(a) * vol * R]); } return o; };
      const A = arcPts(ang(e2), ang(e1), 1), B = arcPts(ang(e2), ang(e1), -1);
      const avgY = Q => Q.reduce((s2, p) => s2 + p[1], 0) / Q.length;
      P = edge.concat(avgY(A) < avgY(B) ? A : B);
    }
    // とがり（スパイキー・ぼさぼさ）：頭の外形から外へ
    const spikes = [];
    if (hair === 'spiky' || hair === 'messy' || (hair === 'short' && q > 0.5 && art.deform < 0.4)) {
      const ns = hair === 'spiky' ? 9 : hair === 'messy' ? 7 : 4;
      for (let i = 0; i < ns; i++) {
        const a = -Math.PI / 2 + (lerp(-1.25, 1.25, i / (ns - 1)) + back * 0.35) ;
        const r0 = [c.x + Math.cos(a) * vol * R * 0.92, c.y + Math.sin(a) * vol * R * 0.92];
        const dirW = V.norm([Math.cos(a) + back * (0.5 + wind), Math.sin(a) * 1.1 - 0.15]);
        const L2 = R * (hair === 'spiky' ? rr(0.5, 0.85) : rr(0.28, 0.5)) * lerp(0.75, 1, q);
        const tip = V.add(r0, V.mul(dirW, L2)), nn = V.perp(dirW), w = R * 0.2;
        spikes.push(catmull([V.add(r0, V.mul(nn, w)), V.add(V.lerp(r0, tip, 0.6), V.mul(nn, w * 0.25)), tip, V.add(V.lerp(r0, tip, 0.55), V.mul(nn, -w * 0.35)), V.add(r0, V.mul(nn, -w))], 3));
      }
    }
    if (H.curl) { const o2 = []; for (let i = 0; i < P.length; i += 2) { const p = P[i]; const d = V.norm(V.sub(p, [c.x, c.y])); o2.push(V.add(p, V.mul(d, (i / 2) % 2 ? R * 0.07 : -R * 0.02))); } P = o2; }
    P = catmull(P, 2, true);
    for (const sp2 of spikes) { ly.fill(sp2, mat, { shade: 0.8, off: R * 0.15 }); contour(l, sp2, 1.2); }
    ly.fill(P, mat, { shade: 0.8, off: R * 0.25, blur: R * 0.03 });
    contour(l, P, 1.5);
    shine(P);
    // 毛の流れ
    const ln = Math.round(lerp(1, 7, art.detail) * lerp(0.4, 1, 1 - art.deform));
    const crown = F.sp(0.0, -0.95, vol);
    for (let i = 0; i < ln; i++) { const k = Math.floor(rand() * P.length); const tip = P[k]; if (tip[1] < c.y - R * 0.6) continue; ink(mat > 0.6 ? ly.hi : l, [[crown.x, crown.y], V.lerp([crown.x, crown.y], tip, 0.6), V.lerp([crown.x, crown.y], tip, 0.9)], 0.6, { tin: 3, tout: 10 }); }
    if (tailRootZ >= 0.1) tails();
  }
  function drawAnimalEars(C, F, kind, phase) {
    const { ly, spec } = C; const { pt, R } = F; const mat = C.mat.fur ?? C.mat.hair;
    for (const sx of [-1, 1]) {
      const base = pt(sx * 0.62, -0.72, 0.0); const z = base.z;
      if ((phase === 'back') !== (z < 0)) continue;
      let P;
      const b0 = pt(sx * 0.35, -0.9, 0.15), b1 = pt(sx * 0.92, -0.42, 0.0);
      if (kind === 'point' || kind === 'bigpoint') { const tip = pt(sx * 0.85, kind === 'bigpoint' ? -1.75 : -1.5, 0.1); P = catmull([[b0.x, b0.y], [tip.x, tip.y], [b1.x, b1.y]], 3, true); }
      else if (kind === 'long') { const tip = pt(sx * 0.5, -2.6, -0.1); const t2 = pt(sx * 0.85, -2.5, -0.1); P = catmull([[b0.x, b0.y], [tip.x, tip.y], [t2.x, t2.y], [b1.x, b1.y]], 5, true); }
      else if (kind === 'flop') { const t1 = pt(sx * 1.15, -0.2, 0.2), t2 = pt(sx * 1.05, 0.35, 0.3); P = catmull([[b0.x, b0.y], [t1.x, t1.y], [t2.x, t2.y], [b1.x, b1.y]], 5, true); }
      else { const c = pt(sx * 0.72, -0.95, 0.05); const r = R * (kind === 'biground' ? 0.48 : 0.3); P = ellipsePts(c.x, c.y, r, r, 0, 18); }
      ly.fill(P, spec.species === 'panda' ? 0.95 : mat, { shade: 0.8, off: R * 0.12 }); contour(ly.l, P, 1.3);
      if (kind === 'point' || kind === 'bigpoint' || kind === 'long') { const c = K.bbox(P); ink(ly.l, [[c.x + c.w * 0.5, c.y + c.h * 0.85], [c.x + c.w * 0.5, c.y + c.h * 0.3]], 0.6); }
    }
  }
  function drawMuzzle(C, F, sp) {
    const { ly, art } = C; const { R } = F; const l = ly.l;
    const n = F.sp(0, 0.42, 1.12);
    if (n.z < 0) return;
    if (sp === 'bird' || sp === 'penguin') { const P = [[n.x - R * 0.15, n.y - R * 0.05], [n.x + F.side * R * 0.45 + R * 0.05, n.y + R * 0.08], [n.x - R * 0.12, n.y + R * 0.22]]; ly.fill(P, 0.3, { shade: 0.5 }); contour(l, P, 1.2); return; }
    if (sp === 'frog') return;
    // 鼻づら（白い楕円）・パンダとたぬきの目のまわり
    if (['dog', 'fox', 'bear', 'lion', 'tanuki', 'panda', 'mouse', 'cat'].includes(sp)) { const mz = F.sp(0, 0.5, 1.05); const big = ['bear', 'panda', 'dog'].includes(sp) ? 1.25 : 1; const P2 = ellipsePts(mz.x + F.side * R * 0.04, mz.y, R * 0.3 * big * clamp(F.faceOn + 0.3, 0.55, 1.1), R * 0.22 * big, 0, 18); ly.fill(P2, 0, { shade: 0.3, knock: false }); ink(l, P2.slice(2, 16), 0.8, { dense: true }); }
    if (sp === 'panda' || sp === 'tanuki') for (const sx of [-1, 1]) { const e = F.sp(sx * 0.42, 0.1); if (e.z < 0.1) continue; ly.matIn(C.headHull, ellipsePts(e.x, e.y + R * 0.03, R * 0.22 * clamp(e.z, 0.3, 1), R * 0.18, sx * 0.5, 14), 0.97); }
    const P = ellipsePts(n.x, n.y, R * 0.11, R * 0.08, 0, 12); l.fillStyle = '#000'; fillPoly(l, P);
    ink(l, [[n.x, n.y + R * 0.08], [n.x, n.y + R * 0.2]], 0.8);
    if (['cat', 'mouse', 'fox', 'tanuki', 'lion'].includes(sp)) for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) ink(l, [[n.x + sx * R * 0.2, n.y + R * 0.1 + i * R * 0.06], [n.x + sx * R * 0.65, n.y + R * (0.02 + i * 0.12)]], 0.6, { tin: 1, tout: 6 });
    if (sp === 'panda' || sp === 'tanuki') { /* 目のまわりの黒い模様は fill で */ }
  }
  function drawTail(C) {
    const { ly, m, rig, spec } = C; const { J, proj } = rig;
    const base = proj(rig.add3(J.pelvis, [0, 0, -m.depth * 0.9]));
    const big = spec.species === 'fox' || spec.species === 'tanuki' || spec.species === 'monster';
    if (['rabbit', 'bear', 'panda', 'bird', 'penguin', 'frog'].includes(spec.species)) { const r = m.legR * (spec.species === 'rabbit' ? 1.2 : 0.9); const P = ellipsePts(base.x - rig.mir * r * 0.5, base.y, r, r, 0, 14); part(ly, P, C.mat.fur ?? 0.3, { w: 1.2, off: r * 0.3 }); return; }
    const dir = -rig.mir; const L = m.Ht * (big ? 0.38 : 0.32);
    const Cc = catmull([[base.x, base.y], [base.x + dir * L * 0.45, base.y + L * 0.15], [base.x + dir * L * 0.8, base.y - L * 0.25], [base.x + dir * L * 0.7, base.y - L * 0.6]], 6);
    const w = m.legR * (big ? 1.4 : 0.45);
    const sw = sweep(Cc, t => w * (big ? Math.sin(Math.min(1, t + 0.2) * Math.PI) + 0.15 : lerp(1, 0.7, t)));
    part(ly, sw.poly, C.mat.fur ?? 0.3, { w: 1.3, off: w * 0.4 });
  }
  function drawWorn(C, F, items) {
    const { ly, art } = C; const { pt, R } = F; const l = ly.l; const q = F.q;
    const front = F.faceOn > -0.2;
    if ((items.has('glasses') || items.has('sunglasses')) && front) {
      const eyeV = lerp(0.3, 0.06, q), eyeU = lerp(0.45, 0.4, q);
      const lens = [];
      for (const sx of [-1, 1]) { const p = F.sp(sx * eyeU, eyeV); if (p.z < 0.1) continue; const fs = clamp(p.z, 0.3, 1); const P = ellipsePts(p.x, p.y, R * 0.24 * fs, R * 0.19, 0, 20); lens.push(P); if (items.has('sunglasses')) ly.fill(P, 0.97, { shade: 0, knock: false }); contour(l, P, 1.2); }
      if (lens.length === 2) { const a = lens[0], b = lens[1]; const ca = K.bbox(a), cb = K.bbox(b); const left = ca.x < cb.x ? ca : cb, right = ca.x < cb.x ? cb : ca; ink(l, [[left.x + left.w, left.y + left.h * 0.4], [right.x, right.y + right.h * 0.4]], 1.0); }
    }
    if (items.has('eyepatch') && front) { const p = F.sp(0.42, 0.08); if (p.z > 0) { const P = ellipsePts(p.x, p.y, R * 0.22, R * 0.2, 0, 16); ly.fill(P, 0.97, { shade: 0 }); contour(l, P, 1); const a = pt(-1, -0.4, 0), b = pt(1, -0.3, 0); ink(l, [[a.x, a.y], [p.x, p.y], [b.x, b.y]], 1.0); } }
    if (items.has('headband')) { const pts = []; for (let i = 0; i <= 14; i++) { const u = -1.6 + i / 14 * 3.2; const p = F.sp(u, -0.5, 1.12); if (p.z > -0.1) pts.push([p.x, p.y]); } if (pts.length > 2) { const sw = sweep(catmull(pts, 3), () => R * 0.09); ly.fill(sw.poly, 0.1, { shade: 0.6 }); contour(l, sw.poly, 1.1); } }
    if (items.has('bandage') && front) { const p = F.sp(0.5, 0.45); if (p.z > 0) { const P = [[p.x - R * 0.15, p.y - R * 0.08], [p.x + R * 0.15, p.y - R * 0.13], [p.x + R * 0.17, p.y + R * 0.0], [p.x - R * 0.13, p.y + R * 0.05]]; ly.fill(P, 0, { shade: 0.3 }); contour(l, P, 0.9); ink(l, [[p.x - R * 0.02, p.y - R * 0.1], [p.x, p.y + R * 0.03]], 0.5); } }
    if (items.has('mustache') && front) { const p = F.sp(0, lerp(0.62, 0.66, q)); if (p.z > 0) { const P = catmull([[p.x - R * 0.3, p.y + R * 0.08], [p.x, p.y - R * 0.06], [p.x + R * 0.3, p.y + R * 0.08], [p.x, p.y + R * 0.04]], 3, true); ly.fill(P, C.mat.hair > 0.3 ? C.mat.hair : 0.6, { shade: 0.4 }); contour(l, P, 1.0); } }
    if (items.has('hairflower')) { const p = pt(0.7 * C.rig.mir, -0.65, 0.4); drawFlower(ly, p.x, p.y, R * 0.28); }
    if (items.has('ribbon')) { const p = pt(-0.6, -0.8, 0.3); for (const sx of [-1, 1]) { const P = catmull([[p.x, p.y], [p.x + sx * R * 0.4, p.y - R * 0.25], [p.x + sx * R * 0.45, p.y + R * 0.2]], 3, true); ly.fill(P, 0.9, { shade: 0.3 }); contour(l, P, 1.1); } const k = ellipsePts(p.x, p.y, R * 0.09, R * 0.09, 0, 10); ly.fill(k, 0.9, { shade: 0 }); }
    if (items.has('horns')) for (const sx of [-1, 1]) { const b = pt(sx * 0.5, -0.85, 0.2); const t = pt(sx * 0.95, -1.55, 0.1); const P = catmull([[b.x - R * 0.13, b.y], [lerp(b.x, t.x, 0.5) + sx * R * 0.1, lerp(b.y, t.y, 0.6)], [t.x, t.y], [b.x + R * 0.13, b.y + R * 0.02]], 4, true); ly.fill(P, 0.25, { shade: 0.9, off: R * 0.1 }); contour(l, P, 1.2); }
    if (items.has('halo')) { const c = pt(0, -1.45, 0); const P = ellipsePts(c.x, c.y, R * 0.6, R * 0.16, F.tilt, 26); l.lineWidth = R * 0.07; l.strokeStyle = '#000'; l.beginPath(); pathPoly(l, P); l.stroke(); }
    if (items.has('crown')) { const b0 = pt(-0.55, -0.9, 0.3), b1 = pt(0.55, -0.9, 0.3); const P = [[b0.x, b0.y], [b0.x, b0.y - R * 0.4], [lerp(b0.x, b1.x, 0.25), b0.y - R * 0.15], [lerp(b0.x, b1.x, 0.5), b0.y - R * 0.5], [lerp(b0.x, b1.x, 0.75), b0.y - R * 0.15], [b1.x, b1.y - R * 0.4], [b1.x, b1.y]]; ly.fill(P, 0.25, { shade: 0.8 }); contour(l, P, 1.2, { seg: 1 }); }
    if (items.has('hat') || items.has('fedora') || items.has('cap') || items.has('helmet')) {
      const cap = items.has('cap'), helmet = items.has('helmet');
      const top = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; const p = pt(Math.cos(a) * 1.08, Math.sin(a) * 1.1 - 0.3, 0); top.push([p.x, p.y]); }
      const bl = pt(-1.1, -0.3, 0), br = pt(1.1, -0.3, 0);
      const crown = catmull(top, 2, true); ly.fill(crown, helmet ? 0.3 : 0.9, { shade: 0.8 }); contour(l, crown, 1.4);
      if (!helmet) { const brim = cap ? (() => { const f = F.sp(0, -0.3, 1.1); const s = F.side; return catmull([[bl.x, bl.y], [f.x + s * R * 0.9, f.y + R * 0.05], [f.x + s * R * 0.4, f.y + R * 0.2], [br.x, br.y]], 4, true); })() : ellipsePts((bl.x + br.x) / 2, (bl.y + br.y) / 2, R * 1.75, R * 0.35, F.tilt, 26); ly.fill(brim, 0.9, { shade: 0.6 }); contour(l, brim, 1.4); }
    }
    if (items.has('headphones')) for (const sx of [-1, 1]) { const p = F.sp(sx * Math.PI / 2, 0.1, 1.05); if (p.z < -0.3) continue; const P = ellipsePts(p.x, p.y, R * 0.22, R * 0.3, 0, 16); ly.fill(P, 0.9, { shade: 0.4 }); contour(l, P, 1.2); }
    if (items.has('bowtie')) { const { J, proj } = C.rig; const p = proj(J.neckB); const s = R * 0.22; for (const sx of [-1, 1]) { const P = [[p.x, p.y], [p.x + sx * s, p.y - s * 0.6], [p.x + sx * s, p.y + s * 0.6]]; ly.fill(P, 0.9, { shade: 0 }); contour(l, P, 1); } }
  }
  // ひげ：頬からあごの下へ、毛先はギザギザ。口はこの上に描く
  function drawBeard(C, F) {
    const { ly, art } = C; const q = F.q, R = F.R; const l = ly.l;
    const chinY = lerp(0.82, 1.18, q);
    // 内側（頬の線と口ひげ）→ 外側（もみあげからあごの下）
    const inner = [[-1.45, 0.02], [-1.0, 0.38], [-0.5, 0.56], [-0.2, 0.6], [0, 0.57], [0.2, 0.6], [0.5, 0.56], [1.0, 0.38], [1.45, 0.02]];
    const P3 = inner.map(([u, v]) => F.sp(u, v, 1.03));
    const outer = [];
    const n = 9; for (let i = 0; i <= n; i++) { const t = i / n, u = lerp(1.45, -1.45, t); const sideV = lerp(0.35, chinY + 0.28, Math.pow(1 - Math.abs(u) / 1.45, 0.6)); const v = sideV + (i % 2 ? -0.06 : 0.06) * (1 - Math.abs(u) / 1.45); const z = Math.cos(u) * 0.75; const p = F.pt(Math.sin(u) * lerp(0.95, 0.75, 1 - Math.abs(u) / 1.45), v, z); outer.push(p); }
    const pts = P3.concat(outer).filter(p => p.z > -0.15).map(p => [p.x, p.y]);
    if (pts.length < 4) return;
    const P = catmull(pts, 2, true);
    ly.fill(P, C.mat.hair, { shade: 0.7, off: R * 0.12 }); contour(l, P, 1.2);
    const mp = F.sp(0, lerp(0.72, 0.78, q)); const mo = ellipsePts(mp.x + F.side * R * 0.04, mp.y + R * 0.03, R * 0.2 * clamp(F.faceOn + 0.4, 0.5, 1.1), R * 0.1, 0, 16);
    ly.fill(mo, C.mat.skin, { shade: 0.2 });
    for (let i = 0; i < 3 + art.detail * 6; i++) { const a = V.lerp(pts[Math.floor(rand() * 9) % pts.length], pts[9 + Math.floor(rand() * (pts.length - 9))] || pts[0], rr(0.25, 0.6)); ink(C.mat.hair > 0.6 ? ly.hi : l, [a, [a[0] + rr(-1, 1), a[1] + R * 0.15]], 0.5, { tin: 1, tout: 4 }); }
  }
  function drawFlower(ly, x, y, r) { for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; const P = ellipsePts(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45, r * 0.32, a, 12); ly.fill(P, 0, { shade: 0.3 }); contour(ly.l, P, 0.9); } const c = ellipsePts(x, y, r * 0.25, r * 0.25, 0, 10); ly.fill(c, 0.6, { shade: 0 }); contour(ly.l, c, 0.8); }
  function drawScarf(C) {
    const { ly, m, rig, art } = C; const { J, proj } = rig;
    const nb = proj(J.neckB); const R = m.R;
    const rx = Math.max(m.shHalf * 0.62, m.R * 0.45), ring = ellipsePts(nb.x, nb.y - rx * 0.12, rx, rx * 0.36, 0, 20);
    ly.fill(ring, 0.5, { shade: 0.8, off: R * 0.1 }); contour(ly.l, ring, 1.3);
    // なびく端
    const mv = (rig.P.air || (rig.P.lean || 0) > 10) ? art.dynamism : art.dynamism * 0.15;
    const dir = V.norm([-rig.mir * lerp(0.15, 1.6, mv), lerp(1, 0.25, mv)]);
    const a = [nb.x - rig.mir * R * 0.25, nb.y + R * 0.05], L = m.Ht * lerp(0.16, 0.32, mv);
    const Cc = catmull([a, V.add(a, V.add(V.mul(dir, L * 0.5), [0, Math.sin(1) * R * 0.3])), V.add(a, V.mul(dir, L))], 6);
    const sw = sweep(Cc, t => R * 0.2 * lerp(1, 0.85, t));
    const end = sw.L[sw.L.length - 1], end2 = sw.R[sw.R.length - 1];
    const P = sw.L.concat([V.add(V.lerp(end, end2, 0.25), V.mul(dir, R * 0.15)), V.lerp(end, end2, 0.5), V.add(V.lerp(end, end2, 0.75), V.mul(dir, R * 0.15))], sw.R.slice().reverse());
    ly.fill(P, 0.5, { shade: 0.8, off: R * 0.1 }); contour(ly.l, P, 1.3);
  }
  function drawCape(C, front) {
    const { ly, m, rig, art } = C; const { J, proj } = rig;
    const a = proj(J.shn), b = proj(J.shf); const top = V.lerp([a.x, a.y], [b.x, b.y], 0.5);
    const len = m.torso + m.leg * 0.8; const dyn = art.dynamism * ((rig.P.air || rig.P.lean > 10) ? 1 : 0.35);
    const dir = V.norm([-rig.mir * lerp(0.15, 1.3, dyn), lerp(1, 0.35, dyn)]);
    const w0 = V.dist([a.x, a.y], [b.x, b.y]) * 0.55 + m.shHalf * 0.3, w1 = m.shHalf * lerp(1.4, 2.0, dyn);
    const Cc = catmull([top, V.add(top, V.add(V.mul(dir, len * 0.5), V.mul(V.perp(dir), len * 0.05))), V.add(top, V.mul(dir, len))], 8);
    const sw = sweep(Cc, t => lerp(w0, w1, Math.pow(t, 0.7)) * (1 + 0.1 * Math.sin(t * 8)));
    const n = Cc.length - 1, end = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; const p = V.lerp(sw.L[n], sw.R[n], t); end.push(V.add(p, V.mul(dir, (i % 2 ? -1 : 1) * m.R * 0.25 * (art.detail + 0.3)))); }
    const P = sw.L.concat(end, sw.R.slice().reverse());
    const lines = []; for (let i = 0; i < 2 + Math.round(art.detail * 4); i++) { const s = rr(0.2, 0.8); const pts = []; for (let k = Math.round(n * rr(0.1, 0.3)); k <= n; k += 2) pts.push(V.lerp(sw.L[k], sw.R[k], s)); if (pts.length > 2) lines.push({ p: pts, w: 0.8, o: { tin: 8, tout: 12 } }); }
    part(ly, P, 0.8, { w: 1.6, off: m.shHalf * 0.6, blur: 2, lines });
  }
  function drawWings(C) {
    const { ly, m, rig } = C; const { J, proj } = rig; const c = proj(J.chest);
    for (const sx of [-1, 1]) { const tip = [c.x + sx * m.Ht * 0.38, c.y - m.Ht * 0.22]; const P = catmull([[c.x, c.y - m.R * 0.3], tip, [c.x + sx * m.Ht * 0.3, c.y + m.Ht * 0.05], [c.x + sx * m.Ht * 0.18, c.y + m.Ht * 0.02], [c.x + sx * m.Ht * 0.12, c.y + m.Ht * 0.1]], 4, true); part(C.ly, P, 0, { w: 1.4, lines: [0.3, 0.55, 0.8].map(t => ({ p: [[c.x + sx * m.Ht * 0.06, c.y], [c.x + sx * m.Ht * 0.3 * t + sx * m.Ht * 0.05, c.y - m.Ht * 0.15 * t + m.Ht * 0.05]], w: 0.7 })) }); }
  }

  /* ---------- 持ち物 ---------- */
  function drawHeld(C, W, dir, k) {
    const { ly, m, art } = C; const it = C.hold; const l = ly.l; const s = m.Ht / 100 * k; const n = V.perp(dir);
    const P = (x, y, d = dir) => V.add(W, V.add(V.mul(d, x * s), V.mul(V.perp(d), y * s)));
    if (it === 'sword') {
      const ang = (C.rig.P.swordAng ?? 100) * Math.PI / 180;
      const d = V.norm(V.rot([C.rig.mir, 0], ang * C.rig.mir));
      const L = m.Ht * 0.55, bw = m.Ht * 0.022;
      const base = V.add(W, V.mul(d, m.hand * 0.3));
      const B = (x, y) => V.add(base, V.add(V.mul(d, x * L), V.mul(V.perp(d), y * bw)));
      const blade = [B(0.02, -0.5), B(0.86, -0.5), B(1, 0.45), B(0.02, 0.5)];
      ly.fill(blade, 0.05, { shade: 0.5, off: bw }); ly.matIn(blade, [B(0, -0.5), B(1, -0.5), B(1, 0.0), B(0, 0.0)], 0.35);
      contour(l, blade, 1.2, { seg: 1 }); ink(l, [B(0.03, 0), B(0.9, 0.02)], 0.6, { tin: 4, tout: 20 });
      if (art.sparkle > 0.3) drawStar(ly.hi, ...B(0.7, -0.3), bw * 2.5 * art.sparkle, '#fff');
      const gd = [B(-0.005, -2.0), B(0.025, -2.0), B(0.025, 2.0), B(-0.005, 2.0)]; ly.fill(gd, 0.9, { shade: 0 }); contour(l, gd, 1.0, { seg: 1 });
      const h0 = B(-0.005, 0), h1 = V.add(base, V.mul(d, -m.hand * 1.6));
      const hp = limb2(h0, h1, bw * 0.75, bw * 0.7, [[0, 1, 1], [1, 1, 1]]); ly.fill(hp.poly, 0.85, { shade: 0 }); contour(l, hp.poly, 1.0);
      return;
    }
    if (it === 'staff' || it === 'wand' || it === 'broom' || it === 'fishingrod' || it === 'mic') {
      const L = it === 'staff' ? m.Ht * 0.75 : it === 'broom' ? m.Ht * 0.7 : it === 'fishingrod' ? m.Ht * 0.9 : m.Ht * 0.22;
      const up = V.norm([C.rig.mir * 0.15, -1]); const a = V.add(W, V.mul(up, it === 'wand' || it === 'mic' ? -m.hand * 0.2 : -L * 0.35)), b = V.add(a, V.mul(up, L));
      const sh = limb2(a, b, m.Ht * 0.011, m.Ht * (it === 'fishingrod' ? 0.004 : 0.009), [[0, 1, 1], [1, 1, 1]]); ly.fill(sh.poly, 0.6, { shade: 0.6 }); contour(l, sh.poly, 1.0);
      if (it === 'staff') { const o = ellipsePts(b[0], b[1], m.Ht * 0.035, m.Ht * 0.035, 0, 16); ly.fill(o, 0.1, { shade: 0.7 }); contour(l, o, 1.2); if (art.sparkle > 0.2) drawStar(ly.hi, b[0] - m.Ht * 0.01, b[1] - m.Ht * 0.01, m.Ht * 0.02, '#fff'); }
      if (it === 'wand') drawStar(l, b[0], b[1], m.Ht * 0.04, '#000');
      if (it === 'mic') { const o = ellipsePts(b[0], b[1], m.Ht * 0.022, m.Ht * 0.026, 0, 14); ly.fill(o, 0.6, { shade: 0.5 }); contour(l, o, 1); }
      if (it === 'broom') { const P2 = [V.add(a, [-m.Ht * 0.05, 0]), V.add(a, [m.Ht * 0.05, 0]), V.add(a, [m.Ht * 0.07, m.Ht * 0.12]), V.add(a, [-m.Ht * 0.07, m.Ht * 0.12])]; ly.fill(P2, 0.3, { shade: 0.5 }); contour(l, P2, 1.1); }
      return;
    }
    if (it === 'umbrella' && !C.box.rain) { // 晴れの日は閉じた傘（杖のように持つ）
      const a0 = V.add(W, [0, -m.hand * 0.6]), b0 = V.add(W, [C.rig.mir * m.Ht * 0.04, m.Ht * 0.36]);
      const sh = limb2(a0, b0, m.Ht * 0.007, m.Ht * 0.005, [[0, 1, 1], [1, 1, 1]]); ly.fill(sh.poly, 0.6, { shade: 0 }); contour(l, sh.poly, 0.9);
      const d = V.norm(V.sub(b0, a0)), nn = V.perp(d); const c0 = V.lerp(a0, b0, 0.25), c1 = V.lerp(a0, b0, 0.92);
      const fold = catmull([V.add(c0, V.mul(nn, m.Ht * 0.012)), V.add(V.lerp(c0, c1, 0.5), V.mul(nn, m.Ht * 0.03)), c1, V.add(V.lerp(c0, c1, 0.5), V.mul(nn, -m.Ht * 0.028)), V.add(c0, V.mul(nn, -m.Ht * 0.012))], 4, true);
      ly.fill(fold, 0.5, { shade: 0.6 }); contour(l, fold, 1.1); ink(l, [c0, V.lerp(c0, c1, 0.9)], 0.6);
      const hook = [a0, V.add(a0, [0, -m.Ht * 0.02]), V.add(a0, [-C.rig.mir * m.Ht * 0.02, -m.Ht * 0.025])]; ink(l, hook, 1.2);
      return;
    }
    if (it === 'umbrella') { const top = V.add(W, [0, -m.Ht * 0.45]); const sh = limb2(W, top, m.Ht * 0.008, m.Ht * 0.008, [[0, 1, 1], [1, 1, 1]]); ly.fill(sh.poly, 0.6, { shade: 0 }); contour(l, sh.poly, 0.9); const cw = m.Ht * 0.4; const can = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + i / 20 * Math.PI; can.push([top[0] + Math.cos(a) * cw, top[1] + Math.sin(a) * cw * 0.5 + m.Ht * 0.03]); } for (let i = 6; i >= 0; i--) { const x = top[0] - cw + i / 6 * cw * 2; can.push([x, top[1] + m.Ht * 0.03 + (i % 2 ? -m.Ht * 0.03 : 0)]); } const cp = catmull(can.reverse(), 2, true); ly.fill(cp, 0.5, { shade: 0.6, off: cw * 0.2 }); contour(l, cp, 1.4); for (let i = 1; i < 6; i++) ink(l, [top, [top[0] - cw + i / 6 * cw * 2, top[1] + m.Ht * 0.02]], 0.6); return; }
    // 小さな物（手の前）
    const box = (w, h, mat, extra) => { const c = V.add(W, V.mul(dir, s * 4)); const Pp = [[c[0] - w / 2, c[1] - h / 2], [c[0] + w / 2, c[1] - h / 2], [c[0] + w / 2, c[1] + h / 2], [c[0] - w / 2, c[1] + h / 2]]; ly.fill(Pp, mat, { shade: 0.6, off: w * 0.15 }); contour(l, Pp, 1.1, { seg: 1 }); if (extra) extra(c, w, h); };
    if (it === 'book' || it === 'map' || it === 'letter') return box(s * 12, s * (it === 'book' ? 15 : 8), it === 'book' ? 0.85 : 0, (c, w, h) => { if (it === 'letter') ink(l, [[c[0] - w / 2, c[1] - h / 2], [c[0], c[1]], [c[0] + w / 2, c[1] - h / 2]], 0.7, { seg: 1 }); if (it === 'book') ink(ly.hi, [[c[0] - w * 0.35, c[1] - h * 0.3], [c[0] + w * 0.35, c[1] - h * 0.3]], 0.8); });
    if (it === 'phone') return box(s * 5, s * 9, 0.9);
    if (it === 'box' || it === 'camera') return box(s * 11, s * 9, it === 'camera' ? 0.9 : 0.1);
    if (it === 'cup') return box(s * 7, s * 8, 0, (c, w, h) => ink(l, [[c[0] + w / 2, c[1] - h * 0.25], [c[0] + w * 0.85, c[1]], [c[0] + w / 2, c[1] + h * 0.25]], 1.0));
    if (it === 'ball' || it === 'food' || it === 'sweets') { const c = V.add(W, V.mul(dir, s * 4.5)); const r = s * (it === 'ball' ? 6 : 4.5); const Pp = ellipsePts(c[0], c[1], r, r * (it === 'ball' ? 1 : 0.8), 0, 20); ly.fill(Pp, it === 'ball' ? 0 : 0.35, { shade: 0.7, off: r * 0.3 }); contour(l, Pp, 1.1); if (it === 'ball') { ink(l, [[c[0] - r, c[1]], [c[0], c[1] + r * 0.2], [c[0] + r, c[1]]], 0.7); } else { const t = ellipsePts(c[0], c[1] - r * 0.7, r * 0.8, r * 0.3, 0, 14); ly.fill(t, 0.9, { shade: 0 }); contour(l, t, 0.9); } return; }
    if (it === 'flower' || it === 'bouquet') { const top = V.add(W, [0, -s * 14]); ink(l, [W, top], 1.0); drawFlower(ly, top[0], top[1], s * 5); if (it === 'bouquet') { drawFlower(ly, top[0] - s * 5, top[1] + s * 3, s * 4); drawFlower(ly, top[0] + s * 5, top[1] + s * 2, s * 4); } return; }
    if (it === 'lantern') { const c = V.add(W, [0, s * 12]); ink(l, [W, [c[0], c[1] - s * 6]], 0.8); const Pp = ellipsePts(c[0], c[1], s * 5, s * 6.5, 0, 18); ly.fill(Pp, 0, { shade: 0.2 }); contour(l, Pp, 1.1); for (let i = -1; i <= 1; i++) ink(l, [[c[0] + i * s * 2.5, c[1] - s * 6], [c[0] + i * s * 3.2, c[1]], [c[0] + i * s * 2.5, c[1] + s * 6]], 0.5); return; }
    if (it === 'shield') { const c = V.add(W, V.mul(dir, s * 3)); const Pp = catmull([[c[0] - s * 12, c[1] - s * 12], [c[0] + s * 12, c[1] - s * 12], [c[0] + s * 11, c[1] + s * 4], [c[0], c[1] + s * 16], [c[0] - s * 11, c[1] + s * 4]], 3, true); ly.fill(Pp, 0.3, { shade: 0.8, off: s * 3 }); contour(l, Pp, 1.5); ink(l, [[c[0], c[1] - s * 9], [c[0], c[1] + s * 11]], 1.0); return; }
    if (it === 'bag') { const c = V.add(W, [0, s * 8]); const Pp = catmull([[c[0] - s * 7, c[1] - s * 4], [c[0] + s * 7, c[1] - s * 4], [c[0] + s * 8, c[1] + s * 7], [c[0] - s * 8, c[1] + s * 7]], 2, true); ly.fill(Pp, 0.5, { shade: 0.6 }); contour(l, Pp, 1.2); ink(l, [[c[0] - s * 4, c[1] - s * 4], [c[0], c[1] - s * 10], [c[0] + s * 4, c[1] - s * 4]], 0.9); return; }
    if (it === 'key') { const c = V.add(W, V.mul(dir, s * 3)); ink(l, [c, V.add(c, V.mul(dir, s * 8))], 1.2); const r = ellipsePts(c[0], c[1], s * 2, s * 2, 0, 10); contour(l, r, 1); return; }
    if (it === 'blaster' || it === 'guitar') return box(s * 14, s * 6, 0.8);
  }

  /* ---------- 人型でないもの（おばけ・スライム・雲・星） ---------- */
  function drawBlob(C) {
    const { ly, spec, m, rig, box, art } = C; const { J, proj } = rig;
    const sp = spec.species; const H = m.Ht; const cx = box.footX, base = box.footY;
    const mat = spec.color === 'dark' || spec.color === 'black' ? 0.9 : spec.color === 'gray' || spec.color === 'tone' ? 0.45 : 0;
    let P, hc, R;
    const wob = art.dynamism;
    if (sp === 'ghost') { R = H * 0.3; hc = [cx, base - H * 0.62]; const pts = []; for (let i = 0; i <= 18; i++) { const a = Math.PI + i / 18 * Math.PI; pts.push([hc[0] + Math.cos(a) * R, hc[1] + Math.sin(a) * R]); } pts.push([hc[0] + R * 1.0, hc[1] + H * 0.25], [hc[0] + R * 0.5 - rig.mir * R * 0.4 * wob, base - H * 0.08], [hc[0] - rig.mir * R * 1.2, base - H * 0.02], [hc[0] - R * 0.6, hc[1] + H * 0.3], [hc[0] - R, hc[1] + H * 0.2]); P = catmull(pts, 4, true); }
    else if (sp === 'slime') { R = H * 0.45; hc = [cx, base - H * 0.42]; P = catmull([[cx - R * 1.2, base], [cx - R * 1.0, base - R * 0.7], [cx - R * 0.2, base - R * 1.35], [cx + R * 0.4, base - R * 1.1], [cx + R * 1.05, base - R * 0.55], [cx + R * 1.2, base]], 5, true); }
    else if (sp === 'star') { R = H * 0.35; hc = [cx, base - H * 0.5]; const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? R * 0.55 : R * 1.25; pts.push([hc[0] + Math.cos(a) * r, hc[1] + Math.sin(a) * r]); } P = catmull(pts, 3, true); }
    else { R = H * 0.38; hc = [cx, base - H * 0.6]; const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; const rr2 = R * (i % 2 ? 0.95 : 1.15); pts.push([hc[0] + Math.cos(a) * rr2 * 1.35, hc[1] + Math.sin(a) * rr2 * 0.85]); } P = catmull(pts, 6, true); }
    part(ly, P, mat, { w: 1.8, off: R * 0.3, blur: R * 0.05 });
    // 顔（人と同じ顔の仕組みで）
    const F = { c: { x: hc[0], y: hc[1], k: 1 }, R: R * 0.8, yaw: 0, nod: 0, tilt: 0, q: 0, faceOn: 1, side: (box.facing || 0) * 0.3,
      sp: (u, v) => ({ x: hc[0] + Math.sin(u) * R * 0.8 + (box.facing || 0) * R * 0.15, y: hc[1] + v * R * 0.8, z: Math.cos(u), vis: true }), pt: (x, y) => ({ x: hc[0] + x * R * 0.8, y: hc[1] + y * R * 0.8, z: 1 }) };
    C.headHull = P; C.F = F;
    const art2 = C.art; C.art = Object.assign({}, art2, { deform: Math.max(0.6, art2.deform) });
    drawFace(C, F); C.art = art2;
    drawWorn(C, F, new Set(spec.items || []));
    return { head: { x: hc[0], y: hc[1], r: R }, body: Object.assign({}, K.bbox(P)) };
  }

  function metrics(spec, opts) {
    const art = K.normalizeArt(opts && (opts.art || opts));
    const sz = sizeFactor(spec || {}); const Ht = 100 * sz;
    const m = measure(spec || {}, art, Ht);
    if (BLOBS.includes((spec || {}).species)) return { top: Ht, hc: -Ht * 0.6, R: Ht * 0.3, widthRatio: 0.9, size: sz };
    const ears = { long: 1.6, bigpoint: 0.75, point: 0.5 }[ANIMAL_EARS[(spec || {}).species]] || 0;
    return { top: Ht + m.R * (0.15 + ears), hc: -(Ht - m.R), R: m.R, widthRatio: clamp(0.3 + 0.35 / (m.H / 2), 0.32, 0.6), size: sz };
  }
  Object.assign(K, { drawCharacter, metrics, POSES, EXPRS, POSE_ALIAS, EXPR_ALIAS, OUTFIT, sizeFactor, drawStarShape: drawStar, drawFlowerShape: drawFlower });
})();

/* =========================================================
   manga/styles/effects.js — 効果（集中線・流線・衝撃・キラキラ・花・描き文字…）とコマ枠
   ・量と質は art で変わる：dynamism＝線の数と勢い、sparkle＝甘さ、line＝線の質、rough＝ネーム
   ========================================================= */
(() => {
  const K = window.MangaStylesKit;
  const { TAU, clamp, lerp, V, rand, rr, rg, seed, hashStr, catmull, ellipsePts, fillPoly, pathPoly, penPath, ink, contour, derive, setLine } = K;

  // 効果ごとに「人物の下（under）」か「上（over）」か
  const PHASE = { focus: 'under', speed: 'under', speedv: 'under', dark: 'under', spotlight: 'under', flashback: 'under', tone: 'under', flowers: 'under', gloom: 'under', betaflash: 'under', wind: 'under', bubbles: 'under',
    sparkle: 'over', rainbow: 'under', arcspeed: 'under', splatter: 'over', splash: 'over', hearts: 'over', shake: 'over', impact: 'over', explosion: 'over', fire: 'over', smoke: 'over', magic: 'over', question: 'over', exclaim: 'over', sweat: 'over', rain: 'over', grain: 'over', sfx: 'over', debris: 'over', shockwave: 'over' };

  function drawEffect(ctx, spec, box, opts) {
    spec = typeof spec === 'string' ? { name: spec } : (spec || {});
    const art = K.normalizeArt(opts && (opts.art || opts));
    const name = spec.name;
    if (spec.phase && PHASE[name] && PHASE[name] !== spec.phase) return true;
    seed(hashStr(name + Math.round(box.x) + ',' + Math.round(box.y)) + (spec.seed || 0));
    const sc = clamp(Math.sqrt(box.w / 500), 0.6, 1.6);
    const { line } = derive(art, sc); setLine(line);
    const dyn = art.dynamism, spk = art.sparkle;
    const f = spec.focus ? [spec.focus.x, spec.focus.y] : [box.x + box.w / 2, box.y + box.h * 0.45];
    const heads = spec.heads || [];
    const R = Math.hypot(box.w, box.h);
    const INK = (spec.dark ?? isDark(ctx, box)) ? '#fff' : '#000'; // 暗いコマ（dark）では白い線
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); ctx.fillStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pencil = art.rough;
    if (pencil) ctx.globalAlpha = 0.75;
    let done = true;
    if (pencil && ['betaflash', 'dark', 'spotlight'].includes(name)) { // ネームでは黒く塗らず、斜線で「ここは黒」と示す
      ctx.fillStyle = '#3c3c3c'; const sp = 9 * sc; for (let o = -box.h; o < box.w; o += sp) { const p0 = [box.x + o, box.y + box.h], p1 = [box.x + o + box.h * 0.6, box.y]; penPath(ctx, [p0, p1], 0.6 * sc, { tin: 4, tout: 4, taper: 0.4, jit: 1 }); }
      if (name === 'betaflash') { ctx.fillStyle = '#fff'; const g = ctx.createRadialGradient(f[0], f[1], 0, f[0], f[1], Math.min(box.w, box.h) * 0.45); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(box.x, box.y, box.w, box.h); }
      ctx.restore(); return true;
    }
    switch (name) {
      case 'focus': { // 集中線
        ctx.fillStyle = INK;
        const wk = INK === '#fff' ? 0.55 : 1; const n = Math.round(lerp(60, 260, dyn) * sc * (pencil ? 0.3 : 1) * wk); const r0 = Math.min(box.w, box.h) * lerp(0.42, 0.28, dyn);
        for (let i = 0; i < n; i++) { const a = rand() * TAU, ri = r0 * rr(0.9, 1.5); const d = [Math.cos(a), Math.sin(a) * 0.85]; const p0 = [f[0] + d[0] * ri, f[1] + d[1] * ri], p1 = [f[0] + d[0] * R, f[1] + d[1] * R]; penPath(ctx, [p0, V.lerp(p0, p1, 0.5), p1], line.w * rr(0.4, 2.2) * wk, { tin: V.dist(p0, p1) * 0.75, tout: 1, wob: 0, taper: 1, jit: 0 }); }
        break; }
      case 'speed': case 'speedv': { // 流線
        ctx.fillStyle = INK;
        const ang = spec.angle ?? (name === 'speedv' ? Math.PI / 2 : 0) + (dyn > 0.6 ? rr(-0.15, 0.15) : 0); const d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]];
        const cnt = Math.round(lerp(30, 160, dyn) * sc * (pencil ? 0.3 : 1)); const c = [box.x + box.w / 2, box.y + box.h / 2];
        for (let i = 0; i < cnt; i++) { const off = rr(-R / 2, R / 2); if (heads.some(h => Math.abs((h.x - c[0]) * n[0] + (h.y - c[1]) * n[1] - off) < h.r * 1.2)) continue; const len = rr(0.3, 1.1) * R * 0.6, st = rr(-R / 2, R / 2 - len * 0.3); const p0 = [c[0] + n[0] * off + d[0] * st, c[1] + n[1] * off + d[1] * st], p1 = V.add(p0, V.mul(d, len)); penPath(ctx, [p0, p1], line.w * rr(0.3, 1.6), { tin: len * 0.4, tout: len * 0.4, wob: 0, taper: 1, jit: 0 }); }
        break; }
      case 'betaflash': { // ベタフラッシュ：黒地に白い放射
        ctx.fillRect(box.x, box.y, box.w, box.h); ctx.fillStyle = '#fff';
        const n = Math.round(lerp(120, 320, Math.max(dyn, spk)) * sc); const r0 = Math.min(box.w, box.h) * 0.12;
        for (let i = 0; i < n; i++) { const a = rand() * TAU, d = [Math.cos(a), Math.sin(a)]; const p0 = [f[0] + d[0] * r0 * rr(0.5, 2.5), f[1] + d[1] * r0 * rr(0.5, 2.5)], p1 = [f[0] + d[0] * R * rr(0.4, 0.9), f[1] + d[1] * R * rr(0.4, 0.9)]; penPath(ctx, [p0, p1], line.w * rr(0.4, 1.8), { tin: 2, tout: V.dist(p0, p1) * 0.8, taper: 1, wob: 0, jit: 0 }); }
        const g = ctx.createRadialGradient(f[0], f[1], 0, f[0], f[1], r0 * 2.5); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(box.x, box.y, box.w, box.h);
        break; }
      case 'impact': case 'explosion': case 'shockwave': { // 衝撃：白い爆発形＋割れ＋破片
        const big = name === 'explosion' ? 1.5 : 1; const r = Math.min(box.w, box.h) * 0.3 * big * lerp(0.7, 1.2, dyn);
        const P = []; const k = Math.round(lerp(10, 20, dyn)); for (let i = 0; i < k * 2; i++) { const a = i / (k * 2) * TAU; P.push([f[0] + Math.cos(a) * r * (i % 2 ? rr(0.35, 0.55) : rr(0.85, 1.3)), f[1] + Math.sin(a) * r * 0.75 * (i % 2 ? rr(0.35, 0.55) : rr(0.85, 1.3))]); }
        ctx.fillStyle = '#fff'; fillPoly(ctx, P); ctx.fillStyle = '#000'; ink(ctx, P.concat([P[0]]), 1.6, { dense: true, tin: 2, tout: 2 });
        // 輪（衝撃波）
        for (let j = 0; j < 2 + Math.round(dyn * 2); j++) { const rr2 = r * (1.3 + j * 0.35); const a0 = rand() * TAU; for (let s = 0; s < 3; s++) { const a = a0 + s * TAU / 3; const arc = ellipsePts(f[0], f[1], rr2, rr2 * 0.6, 0, 16, a, a + rr(0.7, 1.5)); ink(ctx, arc, line.w * 1.4, { dense: true, tin: 10, tout: 20 }); } }
        // 破片
        for (let i = 0; i < Math.round(lerp(6, 26, dyn)); i++) { const a = rand() * TAU, d = r * rr(1.0, 2.2), s = r * rr(0.04, 0.12); const c = [f[0] + Math.cos(a) * d, f[1] + Math.sin(a) * d * 0.75]; const Q = []; for (let q = 0; q < 5; q++) { const b = q / 5 * TAU + rr(-0.3, 0.3); Q.push([c[0] + Math.cos(b) * s * rr(0.6, 1.2), c[1] + Math.sin(b) * s * rr(0.6, 1.2)]); } ctx.fillStyle = rand() < 0.5 + art.black * 0.3 ? '#000' : '#fff'; fillPoly(ctx, Q); ctx.fillStyle = '#000'; ink(ctx, Q.concat([Q[0]]), 0.8, { dense: true }); const tail = V.add(c, [Math.cos(a) * -s * 4, Math.sin(a) * -s * 3]); ink(ctx, [tail, c], 0.6, { tin: s * 3, tout: 1 }); }
        if (name === 'explosion') for (let i = 0; i < 8; i++) { const a = rand() * TAU; const c = [f[0] + Math.cos(a) * r * 1.1, f[1] + Math.sin(a) * r * 0.8]; const P2 = ellipsePts(c[0], c[1], r * 0.3, r * 0.25, 0, 14).map(p => [p[0] + rr(-3, 3), p[1] + rr(-3, 3)]); ctx.fillStyle = '#fff'; fillPoly(ctx, P2); ctx.fillStyle = '#000'; ink(ctx, P2.concat([P2[0]]), 1.0, { dense: true }); }
        break; }
      case 'debris': for (let i = 0; i < 20 * (0.5 + dyn); i++) { const c = [box.x + rand() * box.w, box.y + rand() * box.h], s = rr(2, 8) * sc; const Q = []; for (let q = 0; q < 5; q++) { const b = q / 5 * TAU; Q.push([c[0] + Math.cos(b) * s * rr(0.6, 1.2), c[1] + Math.sin(b) * s * rr(0.6, 1.2)]); } ctx.fillStyle = '#000'; fillPoly(ctx, Q); } break;
      case 'sparkle': { // キラキラ：sparkle が高いほど多く、甘く
        const n = Math.round(lerp(4, 40, spk) * sc);
        for (let i = 0; i < n; i++) { const x = box.x + rand() * box.w, y = box.y + rand() * box.h; if (heads.some(h => Math.hypot(h.x - x, h.y - y) < h.r * 1.3)) continue; const s = rr(3, 14) * sc * (rand() < 0.15 ? 2 : 1); star(ctx, x, y, s, spk); }
        break; }
      case 'flowers': { const n = Math.round(lerp(4, 22, spk) * sc); for (let i = 0; i < n; i++) { const x = box.x + rand() * box.w, y = box.y + rand() * box.h; if (heads.some(h => Math.hypot(h.x - x, h.y - y) < h.r * 1.5)) continue; flower(ctx, x, y, rr(8, 22) * sc, rand() < 0.5 ? 5 : 8, line); } break; }
      case 'hearts': for (let i = 0; i < 4 + spk * 6; i++) { const h0 = heads[0] || { x: f[0], y: f[1], r: 30 }; const x = h0.x + rr(-1.6, 1.6) * h0.r * 2, y = h0.y - h0.r * rr(0.8, 2.2); heart(ctx, x, y, rr(6, 14) * sc); } break;
      case 'gloom': { const h0 = heads[0]; ctx.fillStyle = INK; const x0 = h0 ? h0.x - h0.r * 1.4 : box.x, w = h0 ? h0.r * 2.8 : box.w; for (let x = x0; x < x0 + w; x += 4 * sc) { const y1 = (h0 ? h0.y - h0.r * 0.2 : box.y + box.h * 0.5) + rr(-10, 10); penPath(ctx, [[x, box.y], [x, y1]], line.w * 0.8, { tin: 1, tout: (y1 - box.y) * 0.5, taper: 1, wob: 0 }); } break; }
      case 'dark': ctx.fillRect(box.x, box.y, box.w, box.h); break;
      case 'spotlight': { ctx.fillRect(box.x, box.y, box.w, box.h); const g = ctx.createRadialGradient(f[0], f[1] + box.h * 0.2, 0, f[0], f[1] + box.h * 0.2, box.h * 0.6); g.addColorStop(0, '#fff'); g.addColorStop(0.7, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(box.x, box.y, box.w, box.h); break; }
      case 'flashback': case 'tone': { // 回想：周りを網点でぼかす
        const c = K.mkCanvas(box.w, box.h), g = c.getContext('2d'); g.fillStyle = '#000'; const per = 4 * sc; for (let y = 0; y < box.h; y += per) for (let x = (Math.floor(y / per) % 2) * per / 2; x < box.w; x += per) { const dx = (x + box.x - f[0]) / box.w, dy = (y + box.y - f[1]) / box.h; const v = name === 'tone' ? 0.25 : clamp(Math.hypot(dx, dy) * 1.4 - 0.25); if (v > 0) { g.beginPath(); g.arc(x, y, per * 0.5 * Math.sqrt(v), 0, TAU); g.fill(); } } ctx.drawImage(c, box.x, box.y); break; }
      case 'shake': { const h0 = heads[0] || { x: f[0], y: f[1], r: 30 }; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const x = h0.x + sd * h0.r * (1.3 + i * 0.25), y0 = h0.y - h0.r * 0.6, y1 = h0.y + h0.r * 0.6; ink(ctx, [[x, y0], [x + sd * 3, (y0 + y1) / 2], [x, y1]], 1.2); } break; }
      case 'sweat': { const h0 = heads[0] || { x: f[0], y: f[1], r: 30 }; for (let i = 0; i < 3; i++) { const x = h0.x + h0.r * rr(-1.4, 1.4), y = h0.y - h0.r * rr(0.6, 1.3); drop(ctx, x, y, h0.r * 0.18); } break; }
      case 'question': case 'exclaim': { const h0 = heads[0] || { x: f[0], y: f[1], r: 30 }; const x = h0.x + h0.r * 1.2, y = h0.y - h0.r * 1.4; K.sfxText(ctx, name === 'question' ? '?' : '!', x, y, h0.r * 1.1, art, { outline: true }); break; }
      case 'wind': ctx.fillStyle = INK; for (let i = 0; i < 6 + dyn * 10; i++) { const y = box.y + rand() * box.h, x = box.x + rand() * box.w * 0.6, w = box.w * rr(0.15, 0.4); ink(ctx, catmull([[x, y], [x + w * 0.5, y - 6], [x + w, y], [x + w * 1.1, y - 10], [x + w, y - 14]], 5), 0.9, { dense: true }); } break;
      case 'bubbles': for (let i = 0; i < 14; i++) { const x = box.x + rand() * box.w, y = box.y + rand() * box.h, r = rr(3, 10) * sc; const P = ellipsePts(x, y, r, r, 0, 16); ctx.fillStyle = '#fff'; fillPoly(ctx, P); ctx.fillStyle = '#000'; ink(ctx, P.concat([P[0]]), 0.8, { dense: true }); } break;
      case 'smoke': case 'fire': case 'magic': { const n = name === 'magic' ? 10 : 7; for (let i = 0; i < n; i++) { const c = [f[0] + rr(-0.4, 0.4) * box.w, f[1] + rr(-0.1, 0.4) * box.h], r = rr(15, 40) * sc; if (name === 'fire') { const P = catmull([[c[0] - r * 0.6, c[1] + r], [c[0] - r * 0.4, c[1]], [c[0] + rr(-r, r) * 0.3, c[1] - r * 1.6], [c[0] + r * 0.45, c[1] - r * 0.2], [c[0] + r * 0.6, c[1] + r]], 5, true); ctx.fillStyle = '#fff'; fillPoly(ctx, P); ctx.fillStyle = '#000'; ink(ctx, P.concat([P[0]]), 1.2, { dense: true }); } else if (name === 'magic') star(ctx, c[0], c[1], r * 0.5, 1); else { const P = []; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; P.push([c[0] + Math.cos(a) * r * rr(0.8, 1.1), c[1] + Math.sin(a) * r * 0.75]); } const PP = catmull(P, 4, true); ctx.fillStyle = '#fff'; fillPoly(ctx, PP); ctx.fillStyle = '#000'; ink(ctx, PP.concat([PP[0]]), 0.9, { dense: true }); } } break; }
      case 'rain': { const n = Math.round(box.w * box.h / 900 * (spec.amount || 1)); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; const a = 1.72 + (dyn - 0.5) * 0.15; const d = [Math.cos(a), Math.sin(a)]; for (let i = 0; i < n; i++) { const p = [box.x + rr(-0.1, 1.05) * box.w, box.y + rr(-0.1, 1) * box.h], L = rr(8, 36) * sc, q = V.add(p, V.mul(d, L)); penPath(ctx, [p, q], rr(0.35, 1.0) * sc, { tin: L * 0.4, tout: L * 0.4, wob: 0, taper: 1, jit: 0 }); } break; }
      case 'rainbow': { // 虹の効果：コマに重ねる虹（下地を少し白く抜いてから）
        const ly = new K.Layer(box, K.ctxScale(ctx)); const big = spec.big || (spec.scale ?? 1) > 1.1; const cx = spec.x ?? box.x + box.w * 0.5, cy = spec.y ?? box.y + box.h * (big ? 1.05 : 0.95), r = spec.r ?? Math.min(box.w * 0.55 * (spec.scale ?? 1), box.h * (big ? 1.0 : 0.85));
        K.rainbowArc(ly, cx, cy, r, r * (big ? 0.42 : 0.22), Math.PI, TAU, big); const { R: RR } = derive(art, sc); K.compose(ctx, ly, RR);
        if (spk > 0.2) for (let i = 0; i < 4 + spk * 8; i++) { const a = Math.PI * rr(1.05, 1.95); star(ctx, cx + Math.cos(a) * r * rr(0.7, 1.08), cy + Math.sin(a) * r * rr(0.7, 1.08), rr(4, 10) * sc, spk); }
        break; }
      case 'splatter': { // 墨の飛沫・粉塵：focus から angle の向きへ。大小の点、しずく、筆の塊
        const ang = spec.angle ?? (spec.dir != null ? spec.dir : rr(0, TAU)), amt = (spec.amount ?? 1) * lerp(0.6, 1.6, Math.max(dyn, art.black));
        const sz = Math.min(box.w, box.h) * 0.08 * (spec.size ?? 1);
        K.splatter(ctx, f[0], f[1], ang, sz, Math.round(70 * amt), { spread: spec.spread ?? 1.0, reach: 3.2, blot: !!spec.blot });
        K.splatter(ctx, f[0], f[1], ang + Math.PI * 0.85, sz * 0.5, Math.round(15 * amt), { spread: 1.6, reach: 2 });
        // 粉塵：進行方向に流れる短い線
        for (let i = 0; i < 25 * amt; i++) { const a = ang + rg(0, 0.4), d = sz * rr(0.5, 4); const p = [f[0] + Math.cos(a) * d, f[1] + Math.sin(a) * d]; const L = rr(2, 8) * sc; penPath(ctx, [p, [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L]], rr(0.3, 0.8) * sc, { tin: L * 0.5, tout: L * 0.4, taper: 1, jit: 0, wob: 0 }); }
        break; }
      case 'arcspeed': { // 体を弧で包むスピード線（打撃・斬撃）：focus を中心に、回転方向へ細くなる弧
        ctx.fillStyle = INK; const h0 = heads[0]; const c0 = spec.focus ? f : h0 ? [h0.x, h0.y + h0.r * 2] : f;
        const R0 = spec.r ?? Math.min(box.w, box.h) * 0.42, dirn = spec.dir ?? 1, a0 = spec.angle ?? -Math.PI * 0.75;
        const n = Math.round(lerp(25, 90, dyn) * sc);
        for (let i = 0; i < n; i++) { const r = R0 * rr(0.55, 1.5), span = rr(0.5, 1.6) * lerp(0.7, 1.2, dyn), st = a0 + rg(0, 0.7); const P = []; for (let k = 0; k <= 20; k++) { const a = st + dirn * span * k / 20; P.push([c0[0] + Math.cos(a) * r, c0[1] + Math.sin(a) * r * 0.82]); } penPath(ctx, P, line.w * rr(0.4, 2.0), { tin: V.dist(P[0], P[20]) * 0.15, tout: V.dist(P[0], P[20]) * 0.8, taper: 1, jit: 0, wob: 0 }); }
        break; }
      case 'splash': { // 水しぶき：弧を描く水の帯（白に輪郭と中の線）＋細かい粒
        const c0 = f, s0 = Math.min(box.w, box.h) * 0.36 * (spec.size ?? 1); const nb = Math.round(6 + dyn * 6);
        for (let i = 0; i < nb; i++) { const t = i / (nb - 1) - 0.5; const a = -Math.PI / 2 + t * 2.6 + rg(0, 0.06); const L = s0 * rr(0.55, 1.0) * (1 - Math.abs(t) * 0.7); const w = s0 * rr(0.07, 0.13) * (1 - Math.abs(t) * 0.4);
          // 帯：上へ立ち上がり、先が外へ巻いて垂れる
          const out = Math.sign(t || 0.01), base = [c0[0] + t * s0 * 0.35, c0[1]];
          const mid = [base[0] + Math.cos(a) * L * 0.55, base[1] + Math.sin(a) * L * 0.6];
          const tip = [mid[0] + out * L * 0.32 + Math.cos(a) * L * 0.2, mid[1] - L * 0.05];
          const Cc = catmull([base, mid, tip], 10); const sw = K.sweep(Cc, u => w * Math.sin(Math.min(1, u * 1.1 + 0.15) * Math.PI) + 0.4);
          ctx.fillStyle = '#fff'; fillPoly(ctx, sw.poly); ctx.fillStyle = '#000'; ink(ctx, sw.L, 1.1, { dense: true, tin: 2, tout: 8 }); ink(ctx, sw.R, 0.8, { dense: true, tin: 2, tout: 8 }); ink(ctx, Cc.slice(3, -3), 0.4, { dense: true, tin: 3, tout: 6 });
          for (let k = 0; k < 4; k++) { const d = L * rr(0.05, 0.3), p = [tip[0] + out * d, tip[1] + d * rr(0.2, 1.2)], r = rr(0.8, 2.6) * sc; const D = catmull([[p[0], p[1] - r * 2.2], [p[0] + r, p[1] + r * 0.2], [p[0], p[1] + r], [p[0] - r, p[1] + r * 0.2]], 3, true); ctx.fillStyle = '#fff'; fillPoly(ctx, D); ctx.fillStyle = '#000'; ink(ctx, D.concat([D[0]]), 0.6, { dense: true }); } }
        // 足もとの水面：波紋の楕円
        for (let k = 0; k < 3; k++) { const rx = s0 * (0.6 + k * 0.35), ry = rx * 0.18; ink(ctx, ellipsePts(c0[0], c0[1] + 2, rx, ry, 0, 30, Math.PI * 0.05 + k * 0.2, Math.PI * 0.95 - k * 0.1), 0.7, { dense: true, tin: 8, tout: 8 }); }
        // 粒の散布
        ctx.fillStyle = '#000'; for (let i = 0; i < 40 + dyn * 60; i++) { const a = -Math.PI / 2 + rg(0, 0.9), d = s0 * Math.pow(rand(), 0.6) * 1.5, r = rr(0.3, 1.4) * sc; ctx.beginPath(); ctx.arc(c0[0] + Math.cos(a) * d, c0[1] + Math.sin(a) * d * 0.9, r, 0, TAU); ctx.fill(); }
        break; }
      case 'grain': { const amt = spec.amount ?? art.grain; const c = ctx.getImageData ? null : null; for (let i = 0; i < box.w * box.h / 60 * amt; i++) { ctx.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.6)'; ctx.fillRect(box.x + rand() * box.w, box.y + rand() * box.h, rr(0.4, 1.2), rr(0.4, 1.2)); } break; }
      case 'sfx': K.sfxText(ctx, spec.text || 'ドン', spec.x ?? f[0], spec.y ?? f[1], spec.size ?? Math.min(box.w, box.h) * 0.22, art, spec); break;
      default: done = false;
    }
    ctx.restore();
    return done;
  }
  // 下地が暗いか（dark が渡されないときの保険）：コマの中を数点しらべる
  function isDark(ctx, box) {
    try { const m = ctx.getTransform(); let sum = 0, n = 0; for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) { const x = box.x + box.w * i / 4, y = box.y + box.h * j / 4; const px = Math.round(m.a * x + m.c * y + m.e), py = Math.round(m.b * x + m.d * y + m.f); const d = ctx.getImageData(px, py, 1, 1).data; sum += d[0]; n++; } return sum / n < 70; } catch (e) { return false; }
  }
  function star(ctx, x, y, s, spk) {
    // 4方向の光＋十字（甘いほど細く長い）
    ctx.fillStyle = '#000';
    const k = lerp(0.18, 0.08, spk); const P = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * k : s * (i % 4 === 0 ? 1 : 0.7); P.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    ctx.fillStyle = '#fff'; ctx.lineWidth = Math.max(0.6, s * 0.08); ctx.strokeStyle = '#000'; ctx.beginPath(); pathPoly(ctx, P); ctx.fill(); ctx.stroke();
  }
  function flower(ctx, x, y, r, petals, line) {
    const rot = rand() * TAU; ctx.lineWidth = Math.max(0.6, line.w * 0.6); ctx.strokeStyle = '#000';
    for (let i = 0; i < petals; i++) { const a = rot + i * TAU / petals; const P = ellipsePts(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * (petals > 6 ? 0.18 : 0.32), a, 14); ctx.fillStyle = '#fff'; ctx.beginPath(); pathPoly(ctx, P); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, r * 0.18, 0, TAU); ctx.fill();
  }
  function heart(ctx, x, y, s) { const P = []; for (let i = 0; i < 30; i++) { const t = i / 30 * TAU; P.push([x + s * 0.06 * 16 * Math.pow(Math.sin(t), 3), y - s * 0.06 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } ctx.fillStyle = '#fff'; fillPoly(ctx, P); ctx.fillStyle = '#000'; ink(ctx, P.concat([P[0]]), 1.0, { dense: true }); }
  function drop(ctx, x, y, r) { const P = catmull([[x, y - r * 1.6], [x + r, y + r * 0.3], [x, y + r], [x - r, y + r * 0.3]], 4, true); ctx.fillStyle = '#fff'; fillPoly(ctx, P); ctx.fillStyle = '#000'; ink(ctx, P.concat([P[0]]), 0.9, { dense: true }); }

  // 描き文字：太い字を、文字ごとに回して、横帯ごとにずらしてゆがませる（白フチ付き）
  function sfxText(ctx, text, x, y, size, art, o = {}) {
    art = K.normalizeArt(art);
    const font = o.font ?? (art.softness > 0.6 ? '"Zen Maru Gothic","Dela Gothic One","IPAGothic",sans-serif' : '"Dela Gothic One","IPAGothic",sans-serif');
    const chars = [...text.normalize('NFC')]; let cx = x, cy = y; const marks = []; const ang = o.ang ?? (art.dynamism > 0.5 ? -0.12 : 0), step = size * 0.85;
    const S = K.ctxScale(ctx);
    const warp = lerp(0.0, 0.05, Math.max(art.dynamism, art.line.roughness)), shear = lerp(0, 0.16, art.dynamism);
    chars.forEach((ch0, i) => {
      // 濁点・半濁点は、文字から外して自分で描く（太いフチでつぶれないように）
      const dec = ch0.normalize('NFD'); const mark = dec.includes('\u309A') ? 'han' : dec.includes('\u3099') ? 'daku' : null;
      const ch = mark ? dec.replace(/[\u3099\u309A]/g, '') : ch0;
      const small = 'ァィゥェォッャュョヮぁぃぅぇぉっゃゅょゎ'.includes(ch);
      const sz = size * (o.grow ? Math.pow(o.grow, i) : 1) * rr(0.92, 1.08);
      const c = K.mkCanvas(sz * 1.8 * S, sz * 1.8 * S), g = c.getContext('2d');
      g.scale(S, S); g.translate(sz * 0.9, sz * 0.9); g.font = `${sz}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      // 外側の黒フチ → 白フチ → 文字（黒）。soft な絵柄では白抜き文字
      const whiteIn = art.softness > 0.6 && !art.rough;
      if (o.outline !== false) { const ok = small ? 0.7 : 1; g.strokeStyle = '#000'; g.lineWidth = sz * lerp(0.22, 0.3, art.line.weight) * ok; g.strokeText(ch, 0, 0); g.strokeStyle = '#fff'; g.lineWidth = sz * 0.17 * ok; g.strokeText(ch, 0, 0); }
      g.fillStyle = whiteIn ? '#fff' : '#000'; g.fillText(ch, 0, 0);
      if (whiteIn) { g.strokeStyle = '#000'; g.lineWidth = sz * 0.03; g.strokeText(ch, 0, 0); }
      const d = K.mkCanvas(c.width, c.height), h = d.getContext('2d'); const band = 3 * S, ph = rand() * 9, amp = warp * sz * S;
      for (let yy = 0; yy < c.height; yy += band) { const dx = Math.sin(yy / c.height * Math.PI * 1.3 + ph) * amp + (yy / c.height - 0.5) * shear * sz * S; h.drawImage(c, 0, yy, c.width, band, dx, yy, c.width, band); }
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang + rr(-0.15, 0.15) * (0.3 + art.dynamism)); if (art.rough) ctx.globalAlpha = 0.7; ctx.drawImage(d, -sz * 0.9, -sz * 0.9, sz * 1.8, sz * 1.8);
      ctx.restore();
      if (mark) marks.push([ctx.getTransform ? null : null, cx, cy, ang + 0, mark, sz, whiteIn]);
      cx += Math.cos(ang) * step; cy += Math.sin(ang) * step + (o.vertical ? step : 0);
    });
    // 濁点・半濁点は最後に、いちばん上へ（次の字に隠れないように）
    for (const [, mx, my, ma, mk, msz, wi] of marks) { ctx.save(); ctx.translate(mx, my); ctx.rotate(ma); if (art.rough) ctx.globalAlpha = 0.8; drawMark(ctx, mk, msz, wi); ctx.restore(); }
  }

  // 濁点・半濁点：白フチ→黒。半濁点は輪の中を必ず白く空ける
  function drawMark(ctx, kind, sz, whiteIn) {
    const fg = whiteIn ? '#fff' : '#000', bg = whiteIn ? '#000' : '#fff';
    if (kind === 'han') {
      const cx = sz * 0.38, cy = -sz * 0.4, r = sz * 0.16;
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, r + sz * 0.11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r + sz * 0.065, 0, TAU); ctx.fill();
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
      ctx.fillStyle = bg === '#fff' ? '#fff' : '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.48, 0, TAU); ctx.fill();
      if (whiteIn) { ctx.strokeStyle = '#000'; ctx.lineWidth = sz * 0.03; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r * 0.48, 0, TAU); ctx.stroke(); }
    } else {
      const seg = [[sz * 0.22, -sz * 0.6, sz * 0.31, -sz * 0.3], [sz * 0.43, -sz * 0.64, sz * 0.52, -sz * 0.34]];
      ctx.lineCap = 'round';
      for (const [w, c] of [[sz * 0.32, '#000'], [sz * 0.22, '#fff'], [sz * 0.13, fg]]) { ctx.strokeStyle = c; ctx.lineWidth = w; for (const [a, b, c2, d] of seg) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d); ctx.stroke(); } }
      if (whiteIn) { ctx.strokeStyle = '#000'; ctx.lineWidth = sz * 0.02; }
    }
  }
  // コマ枠：panelFrame・線・ネームで変わる
  function drawFrame(ctx, b, opts) {
    const art = K.normalizeArt(opts && (opts.art || opts));
    const { line } = derive(art, 1); setLine(Object.assign({}, line, { jitter: art.rough ? 1.4 : line.jitter }));
    seed(hashStr('frame' + Math.round(b.x) + ',' + Math.round(b.y)));
    const w = lerp(1.6, 4.2, art.line.weight);
    ctx.save(); ctx.fillStyle = art.rough ? '#444' : '#000';
    const kind = art.rough ? 'rough' : art.panelFrame;
    if (kind === 'borderless') { /* 枠なし */ }
    else if (kind === 'rounded') { const r = Math.min(18, b.w * 0.06); const P = []; const add = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + i / 6 * Math.PI / 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }; add(b.x + b.w - r, b.y + r, -Math.PI / 2); add(b.x + b.w - r, b.y + b.h - r, 0); add(b.x + r, b.y + b.h - r, Math.PI / 2); add(b.x + r, b.y + r, Math.PI); P.push(P[0]); ink(ctx, P, w, { dense: true, tin: 0.1, tout: 0.1, taper: 0.1, noRough: true }); }
    else if (kind === 'rough') { const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]]; for (let i = 0; i < 4; i++) { const a = pts[i], c = pts[(i + 1) % 4]; const ex = V.mul(V.norm(V.sub(c, a)), rr(2, 7)); ink(ctx, [V.sub(a, ex), V.lerp(a, c, 0.5), V.add(c, ex)], art.rough ? 1.2 : w, { tin: 3, tout: 3 }); if (art.rough) ink(ctx, [V.sub(a, V.mul(ex, 0.5)), V.add(c, ex)], 0.7, { tin: 3, tout: 3 }); } }
    else { ctx.strokeStyle = '#000'; ctx.lineWidth = kind === 'dynamic' ? w * 1.4 : w; ctx.lineJoin = 'miter'; ctx.strokeRect(b.x, b.y, b.w, b.h); }
    ctx.restore();
  }
  Object.assign(K, { drawEffect, sfxText, drawFrame, EFFECT_PHASE: PHASE });
})();

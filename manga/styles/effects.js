/* =========================================================
   manga/styles/effects.js — 効果（集中線・流線・衝撃・キラキラ・花・描き文字…）とコマ枠
   ・量と質は art で変わる：dynamism＝線の数と勢い、sparkle＝甘さ、line＝線の質、rough＝ネーム
   ========================================================= */
(() => {
  const K = window.MangaStylesKit;
  const { TAU, clamp, lerp, V, rand, rr, seed, hashStr, catmull, ellipsePts, fillPoly, pathPoly, penPath, ink, contour, derive, setLine } = K;

  // 効果ごとに「人物の下（under）」か「上（over）」か
  const PHASE = { focus: 'under', speed: 'under', speedv: 'under', dark: 'under', spotlight: 'under', flashback: 'under', tone: 'under', flowers: 'under', gloom: 'under', betaflash: 'under', wind: 'under', bubbles: 'under',
    sparkle: 'over', hearts: 'over', shake: 'over', impact: 'over', explosion: 'over', fire: 'over', smoke: 'over', magic: 'over', question: 'over', exclaim: 'over', sweat: 'over', rain: 'over', grain: 'over', sfx: 'over', debris: 'over', shockwave: 'over' };

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
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); ctx.fillStyle = '#000'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pencil = art.rough;
    if (pencil) ctx.globalAlpha = 0.75;
    let done = true;
    switch (name) {
      case 'focus': { // 集中線
        const n = Math.round(lerp(60, 260, dyn) * sc * (pencil ? 0.3 : 1)); const r0 = Math.min(box.w, box.h) * lerp(0.42, 0.28, dyn);
        for (let i = 0; i < n; i++) { const a = rand() * TAU, ri = r0 * rr(0.9, 1.5); const d = [Math.cos(a), Math.sin(a) * 0.85]; const p0 = [f[0] + d[0] * ri, f[1] + d[1] * ri], p1 = [f[0] + d[0] * R, f[1] + d[1] * R]; penPath(ctx, [p0, V.lerp(p0, p1, 0.5), p1], line.w * rr(0.4, 2.2), { tin: V.dist(p0, p1) * 0.75, tout: 1, wob: 0, taper: 1, jit: 0 }); }
        break; }
      case 'speed': case 'speedv': { // 流線
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
      case 'gloom': { const h0 = heads[0]; ctx.fillStyle = '#000'; const x0 = h0 ? h0.x - h0.r * 1.4 : box.x, w = h0 ? h0.r * 2.8 : box.w; for (let x = x0; x < x0 + w; x += 4 * sc) { const y1 = (h0 ? h0.y - h0.r * 0.2 : box.y + box.h * 0.5) + rr(-10, 10); penPath(ctx, [[x, box.y], [x, y1]], line.w * 0.8, { tin: 1, tout: (y1 - box.y) * 0.5, taper: 1, wob: 0 }); } break; }
      case 'dark': ctx.fillRect(box.x, box.y, box.w, box.h); break;
      case 'spotlight': { ctx.fillRect(box.x, box.y, box.w, box.h); const g = ctx.createRadialGradient(f[0], f[1] + box.h * 0.2, 0, f[0], f[1] + box.h * 0.2, box.h * 0.6); g.addColorStop(0, '#fff'); g.addColorStop(0.7, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(box.x, box.y, box.w, box.h); break; }
      case 'flashback': case 'tone': { // 回想：周りを網点でぼかす
        const c = K.mkCanvas(box.w, box.h), g = c.getContext('2d'); g.fillStyle = '#000'; const per = 4 * sc; for (let y = 0; y < box.h; y += per) for (let x = (Math.floor(y / per) % 2) * per / 2; x < box.w; x += per) { const dx = (x + box.x - f[0]) / box.w, dy = (y + box.y - f[1]) / box.h; const v = name === 'tone' ? 0.25 : clamp(Math.hypot(dx, dy) * 1.4 - 0.25); if (v > 0) { g.beginPath(); g.arc(x, y, per * 0.5 * Math.sqrt(v), 0, TAU); g.fill(); } } ctx.drawImage(c, box.x, box.y); break; }
      case 'shake': { const h0 = heads[0] || { x: f[0], y: f[1], r: 30 }; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const x = h0.x + sd * h0.r * (1.3 + i * 0.25), y0 = h0.y - h0.r * 0.6, y1 = h0.y + h0.r * 0.6; ink(ctx, [[x, y0], [x + sd * 3, (y0 + y1) / 2], [x, y1]], 1.2); } break; }
      case 'sweat': { const h0 = heads[0] || { x: f[0], y: f[1], r: 30 }; for (let i = 0; i < 3; i++) { const x = h0.x + h0.r * rr(-1.4, 1.4), y = h0.y - h0.r * rr(0.6, 1.3); drop(ctx, x, y, h0.r * 0.18); } break; }
      case 'question': case 'exclaim': { const h0 = heads[0] || { x: f[0], y: f[1], r: 30 }; const x = h0.x + h0.r * 1.2, y = h0.y - h0.r * 1.4; K.sfxText(ctx, name === 'question' ? '?' : '!', x, y, h0.r * 1.1, art, { outline: true }); break; }
      case 'wind': for (let i = 0; i < 6 + dyn * 10; i++) { const y = box.y + rand() * box.h, x = box.x + rand() * box.w * 0.6, w = box.w * rr(0.15, 0.4); ink(ctx, catmull([[x, y], [x + w * 0.5, y - 6], [x + w, y], [x + w * 1.1, y - 10], [x + w, y - 14]], 5), 0.9, { dense: true }); } break;
      case 'bubbles': for (let i = 0; i < 14; i++) { const x = box.x + rand() * box.w, y = box.y + rand() * box.h, r = rr(3, 10) * sc; const P = ellipsePts(x, y, r, r, 0, 16); ctx.fillStyle = '#fff'; fillPoly(ctx, P); ctx.fillStyle = '#000'; ink(ctx, P.concat([P[0]]), 0.8, { dense: true }); } break;
      case 'smoke': case 'fire': case 'magic': { const n = name === 'magic' ? 10 : 7; for (let i = 0; i < n; i++) { const c = [f[0] + rr(-0.4, 0.4) * box.w, f[1] + rr(-0.1, 0.4) * box.h], r = rr(15, 40) * sc; if (name === 'fire') { const P = catmull([[c[0] - r * 0.6, c[1] + r], [c[0] - r * 0.4, c[1]], [c[0] + rr(-r, r) * 0.3, c[1] - r * 1.6], [c[0] + r * 0.45, c[1] - r * 0.2], [c[0] + r * 0.6, c[1] + r]], 5, true); ctx.fillStyle = '#fff'; fillPoly(ctx, P); ctx.fillStyle = '#000'; ink(ctx, P.concat([P[0]]), 1.2, { dense: true }); } else if (name === 'magic') star(ctx, c[0], c[1], r * 0.5, 1); else { const P = []; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; P.push([c[0] + Math.cos(a) * r * rr(0.8, 1.1), c[1] + Math.sin(a) * r * 0.75]); } const PP = catmull(P, 4, true); ctx.fillStyle = '#fff'; fillPoly(ctx, PP); ctx.fillStyle = '#000'; ink(ctx, PP.concat([PP[0]]), 0.9, { dense: true }); } } break; }
      case 'rain': { const n = Math.round(box.w * box.h / 900 * (spec.amount || 1)); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; const a = 1.72 + (dyn - 0.5) * 0.15; const d = [Math.cos(a), Math.sin(a)]; for (let i = 0; i < n; i++) { const p = [box.x + rr(-0.1, 1.05) * box.w, box.y + rr(-0.1, 1) * box.h], L = rr(8, 36) * sc, q = V.add(p, V.mul(d, L)); penPath(ctx, [p, q], rr(0.35, 1.0) * sc, { tin: L * 0.4, tout: L * 0.4, wob: 0, taper: 1, jit: 0 }); } break; }
      case 'grain': { const amt = spec.amount ?? art.grain; const c = ctx.getImageData ? null : null; for (let i = 0; i < box.w * box.h / 60 * amt; i++) { ctx.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.6)'; ctx.fillRect(box.x + rand() * box.w, box.y + rand() * box.h, rr(0.4, 1.2), rr(0.4, 1.2)); } break; }
      case 'sfx': K.sfxText(ctx, spec.text || 'ドン', spec.x ?? f[0], spec.y ?? f[1], spec.size ?? Math.min(box.w, box.h) * 0.22, art, spec); break;
      default: done = false;
    }
    ctx.restore();
    return done;
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
    const chars = [...text]; let cx = x, cy = y; const ang = o.ang ?? (art.dynamism > 0.5 ? -0.12 : 0), step = size * 0.85;
    const S = K.ctxScale(ctx);
    const warp = lerp(0.0, 0.09, Math.max(art.dynamism, art.line.roughness)), shear = lerp(0, 0.3, art.dynamism);
    chars.forEach((ch, i) => {
      const sz = size * (o.grow ? Math.pow(o.grow, i) : 1) * rr(0.92, 1.08);
      const c = K.mkCanvas(sz * 1.8 * S, sz * 1.8 * S), g = c.getContext('2d');
      g.scale(S, S); g.translate(sz * 0.9, sz * 0.9); g.font = `${sz}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      if (o.outline !== false) { g.strokeStyle = '#fff'; g.lineWidth = sz * 0.24; g.strokeText(ch, 0, 0); }
      g.strokeStyle = '#000'; g.lineWidth = sz * lerp(0.04, 0.1, art.line.weight); g.strokeText(ch, 0, 0);
      g.fillStyle = art.black > 0.4 || art.rough ? '#000' : '#fff'; g.fillText(ch, 0, 0);
      const d = K.mkCanvas(c.width, c.height), h = d.getContext('2d'); const band = 3 * S, ph = rand() * 9, amp = warp * sz * S;
      for (let yy = 0; yy < c.height; yy += band) { const dx = Math.sin(yy / c.height * Math.PI * 1.3 + ph) * amp + (yy / c.height - 0.5) * shear * sz * S; h.drawImage(c, 0, yy, c.width, band, dx, yy, c.width, band); }
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang + rr(-0.15, 0.15) * (0.3 + art.dynamism)); if (art.rough) ctx.globalAlpha = 0.7; ctx.drawImage(d, -sz * 0.9, -sz * 0.9, sz * 1.8, sz * 1.8); ctx.restore();
      cx += Math.cos(ang) * step; cy += Math.sin(ang) * step + (o.vertical ? step : 0);
    });
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

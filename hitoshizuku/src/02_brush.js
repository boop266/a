// ---------------------------------------------------------------------------
// 筆：KanjiVG の中心線にそって、筆の毛先（だ円）を押していく。
//   止め（s）・払い（t）・右払い（r）・はね（h）・点（d）で筆圧を変え、
//   払いの終わりは毛先ごとに墨が尽きて「かすれ」る。
// ---------------------------------------------------------------------------
const INK = {
  sumi: '#1c1a20', usuzumi: '#6f6a62', shu: '#c4381f', ai: '#22508a', sora: '#3f7fb5', moegi: '#4f7a28', matsu: '#2f5a2a',
  kin: '#b0832a', cha: '#7a5230', murasaki: '#6a3f98', momo: '#c2507a', hai: '#8a8680', shiro: '#8e9aa8', kogane: '#d7a73a',
  aka: '#b42f2a', kon: '#1f2d4f', tsuchi: '#8c6a3c', yamabuki: '#c99a1d',
};
const Brush = (() => {
  const STEP = 0.6;           // 109 四方の中での点の間かく
  const TIP = { a: 0.63, b: 0.33, phi: 0.5 };   // 毛先のだ円（長さ・幅・傾き）
  const parsed = new Map();   // 字 → {strokes:[{p:Float32Array, pr:Float32Array, kind}], comps, n}

  function cubic(a, b, c, d, t) { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; }
  function flattenNums(nums) {
    const raw = []; let x0 = nums[0] / 2, y0 = nums[1] / 2; raw.push(x0, y0);
    for (let i = 2; i < nums.length; i += 6) {
      const c1x = nums[i] / 2, c1y = nums[i + 1] / 2, c2x = nums[i + 2] / 2, c2y = nums[i + 3] / 2, px = nums[i + 4] / 2, py = nums[i + 5] / 2;
      const len = Math.hypot(c1x - x0, c1y - y0) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(px - c2x, py - c2y);
      const n = Math.max(2, Math.ceil(len / 0.4));
      for (let k = 1; k <= n; k++) { const t = k / n; raw.push(cubic(x0, c1x, c2x, px, t), cubic(y0, c1y, c2y, py, t)); }
      x0 = px; y0 = py;
    }
    return resample(raw, STEP);
  }
  function resample(raw, step) {
    const out = [raw[0], raw[1]]; let acc = 0;
    let ax = raw[0], ay = raw[1];
    for (let i = 2; i < raw.length; i += 2) {
      const bx = raw[i], by = raw[i + 1];
      let d = Math.hypot(bx - ax, by - ay);
      while (acc + d >= step) { const t = (step - acc) / d; ax = ax + (bx - ax) * t; ay = ay + (by - ay) * t; out.push(ax, ay); d = Math.hypot(bx - ax, by - ay); acc = 0; }
      acc += d; ax = bx; ay = by;
    }
    const lx = raw[raw.length - 2], ly = raw[raw.length - 1];
    if (Math.hypot(lx - out[out.length - 2], ly - out[out.length - 1]) > 0.15) out.push(lx, ly);
    return new Float32Array(out);
  }
  function hookIndex(p) {
    const n = p.length / 2; let best = -1, bestA = 0.8;
    for (let i = Math.floor(n * 0.5); i < n - 3; i++) {
      const a0 = Math.atan2(p[2 * i + 1] - p[2 * (i - 3) + 1], p[2 * i] - p[2 * (i - 3)]);
      const a1 = Math.atan2(p[2 * (i + 3) + 1] - p[2 * i + 1], p[2 * (i + 3)] - p[2 * i]);
      let da = Math.abs(a1 - a0); if (da > Math.PI) da = TAU - da;
      if (da > bestA) { bestA = da; best = i; }
    }
    return best;
  }
  function pressure(p, kind) {
    const n = p.length / 2, L = (n - 1) * STEP, pr = new Float32Array(n);
    const hk = kind === 'h' ? hookIndex(p) : -1;
    for (let i = 0; i < n; i++) {
      const s = i * STEP, u = n > 1 ? i / (n - 1) : 0;
      let k = 0.93 + 0.17 * (1 - smooth(0, 6, s)) - 0.07 * Math.sin(Math.PI * u);
      if (s < 1.2) k *= 0.85 + 0.15 * s / 1.2;
      if (kind === 's') k *= 1 + 0.13 * smooth(L - 6, L - 1.5, s);
      else if (kind === 't') k *= Math.pow(1 - smooth(0.3, 1.0, u), 1.05) * 0.96 + 0.04;
      else if (kind === 'r') k *= (0.72 + 0.66 * smooth(0.12, 0.8, u)) * (1 - smooth(0.82, 1.0, u)) * 0.96 + 0.04;
      else if (kind === 'd') k = 0.5 + 0.75 * smooth(0, 0.85, u);
      else if (kind === 'h' && hk > 0) { const sh = hk * STEP; if (s < sh) k *= 1 + 0.16 * smooth(sh - 5, sh, s); else k *= Math.max(0.05, 1.12 * (1 - (s - sh) / Math.max(2.5, L - sh))); }
      pr[i] = k;
    }
    return pr;
  }
  function get(ch) {
    let g = parsed.get(ch);
    if (g !== undefined) return g;
    const d = (typeof KVG !== 'undefined') ? KVG[ch] : null;
    if (!d) { parsed.set(ch, null); return null; }
    const strokes = d.s.map((s, i) => { const p = flattenNums(s.split(',').map(Number)); return { p, pr: pressure(p, d.k[i]), kind: d.k[i] }; });
    g = { strokes, comps: d.c || [], n: strokes.length };
    parsed.set(ch, g);
    return g;
  }
  function strokeCount(ch) { const g = get(ch); return g ? g.n : 1; }
  function baseWidth(n) { return Math.max(5.4, Math.min(10.5, 11.6 - n * 0.3)); }

  // 1画を描く（ctx は 109 単位）。prog: 0..1 書きかけ。p,pr を直接渡せる（変形用）
  function drawStroke(ctx, p, pr, kind, W, seed, prog, dry) {
    const r = makeRng(seed);
    const N = p.length / 2;
    let n = N; if (prog !== undefined && prog < 1) n = Math.max(1, Math.floor(N * prog));
    const a = TIP.a * W, b = TIP.b * W, phi = TIP.phi, ca = Math.cos(phi), sa = Math.sin(phi);
    const L = (N - 1) * STEP;
    const dryFrom = dry === false ? 2 : (kind === 't' || kind === 'r') ? 0.55 : (L > 40 ? 0.78 : 2);
    ctx.beginPath();
    let wob = 0;
    for (let i = 0; i < n; i++) {
      const u = N > 1 ? i / (N - 1) : 0;
      wob += (r() - 0.5) * 0.08; wob *= 0.92;
      const k = pr[i] * (1 + wob);
      if (u < dryFrom || r() < 0.4) {
        const x = p[2 * i], y = p[2 * i + 1];
        ctx.moveTo(x + a * k * ca, y + a * k * sa);
        ctx.ellipse(x, y, a * k, b * k, phi, 0, TAU);
      }
    }
    ctx.fill();
    if (dryFrom < 1 && n > 2) {
      const K = 9, ink = []; for (let j = 0; j < K; j++) ink.push(0.6 + r() * 0.6);
      ctx.beginPath();
      for (let i = Math.floor(dryFrom * (N - 1)); i < n; i++) {
        const k = pr[i];
        for (let j = 0; j < K; j++) {
          ink[j] -= 0.012 + r() * 0.02;
          if (ink[j] < r() * 0.5) continue;
          const t = (j / (K - 1)) * 2 - 1;
          const x = p[2 * i] + ca * a * k * t * 0.95, y = p[2 * i + 1] + sa * a * k * t * 0.95;
          const rr = Math.max(0.15, b * k * 0.55);
          ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, TAU);
        }
      }
      ctx.fill();
    }
  }

  // 字を描く。opts: strokes(書きかけの画数, 小数可), weight, alpha, bleed, dry
  function draw(ctx, ch, size, color, opts = {}) {
    const g = get(ch);
    if (!g) {
      ctx.save(); ctx.fillStyle = color; ctx.globalAlpha *= (opts.alpha || 0.92);
      ctx.font = '600 ' + Math.round(size * 0.86) + 'px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-hand');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, size / 2, size * 0.54); ctx.restore();
      return;
    }
    const W = (opts.weight || 1) * baseWidth(g.n);
    const seed0 = ch.charCodeAt(0) * 7919 + (opts.seed || 0);
    const upto = opts.strokes === undefined ? g.n : opts.strokes;
    ctx.save(); ctx.scale(size / 109, size / 109); ctx.fillStyle = color;
    const base = ctx.globalAlpha;
    const passes = opts.bleed === false ? [[1, opts.alpha || 0.93]] : [[1.22, 0.085], [1, opts.alpha || 0.93]];
    for (const [wm, al] of passes) {
      ctx.globalAlpha = base * al;
      for (let i = 0; i < g.n && i < Math.ceil(upto); i++) {
        const st = g.strokes[i];
        const pr = (i < Math.floor(upto)) ? undefined : (upto - Math.floor(upto));
        drawStroke(ctx, st.p, st.pr, st.kind, W * wm, seed0 + i, pr, opts.dry);
      }
    }
    ctx.restore();
  }

  // 変形：from の画（変換つき）から、to の画へ（合わせ字の動き）。t:0..1
  // pairs: [{from:{ch,i,dx,dy,s}, to:{i}}] は draw の外で作る
  function lerpStroke(sA, sB, t) {
    const nA = sA.p.length / 2, nB = sB.p.length / 2, n = Math.max(nA, nB);
    const p = new Float32Array(n * 2), pr = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const ua = nA > 1 ? i / (n - 1) * (nA - 1) : 0, ub = nB > 1 ? i / (n - 1) * (nB - 1) : 0;
      const ia = Math.min(nA - 1, Math.floor(ua)), ib = Math.min(nB - 1, Math.floor(ub));
      const fa = ua - ia, fb = ub - ib, ia2 = Math.min(nA - 1, ia + 1), ib2 = Math.min(nB - 1, ib + 1);
      const ax = lerp(sA.p[2 * ia], sA.p[2 * ia2], fa), ay = lerp(sA.p[2 * ia + 1], sA.p[2 * ia2 + 1], fa);
      const bx = lerp(sB.p[2 * ib], sB.p[2 * ib2], fb), by = lerp(sB.p[2 * ib + 1], sB.p[2 * ib2 + 1], fb);
      p[2 * i] = lerp(ax, bx, t); p[2 * i + 1] = lerp(ay, by, t);
      pr[i] = lerp(lerp(sA.pr[ia], sA.pr[ia2], fa), lerp(sB.pr[ib], sB.pr[ib2], fb), t);
    }
    return { p, pr, kind: t < 0.5 ? sA.kind : sB.kind };
  }
  function transformStroke(st, sx, sy, dx, dy) {
    const p = new Float32Array(st.p.length);
    for (let i = 0; i < p.length; i += 2) { p[i] = st.p[i] * sx + dx; p[i + 1] = st.p[i + 1] * sy + dy; }
    return { p, pr: st.pr, kind: st.kind };
  }
  function bbox(ch, i0, i1) {
    const g = get(ch); if (!g) return { x: 10, y: 10, w: 89, h: 89 };
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = (i0 || 0); i < (i1 === undefined ? g.n : i1); i++) {
      const p = g.strokes[i].p;
      for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); y0 = Math.min(y0, p[k + 1]); y1 = Math.max(y1, p[k + 1]); }
    }
    return { x: x0, y: y0, w: Math.max(4, x1 - x0), h: Math.max(4, y1 - y0) };
  }
  // 合わせ字の部品：result の中で、材料 part がどの画にあたるか
  function findPart(result, part, used) {
    const g = get(result); if (!g) return null;
    const cands = g.comps.filter(c => c[0] === part && !used.some(u => u[0] === c[1]));
    if (cands.length) { cands.sort((a, b) => a[4] - b[4]); return [cands[0][1], cands[0][2]]; }
    return null;
  }
  // 合わせ字の動きの「台本」を作る：材料（字のならび）→ 結果の各画へ
  function morphPlan(parts, result) {
    const g = get(result); if (!g) return null;
    const used = [];
    const plan = [];   // {part, srcIdx, range:[i0,i1], mode:'morph'|'fade', box}
    const rest = [];
    for (let k = 0; k < parts.length; k++) {
      const ch = parts[k];
      let range = findPart(result, ch, used);
      if (!range) {
        // 部首の形（水→氵 など）や、似た部品を探す
        const alt = RADICAL_FORM[ch];
        if (alt) for (const a of alt) { range = findPart(result, a, used); if (range) break; }
      }
      if (range) { used.push(range); plan.push({ part: ch, range }); }
      else rest.push(k);
    }
    // 割り当てのない材料は、残りの画をまとめて受け持つ
    const covered = new Uint8Array(g.n);
    for (const u of used) for (let i = u[0]; i < u[1]; i++) covered[i] = 1;
    const left = []; for (let i = 0; i < g.n; i++) if (!covered[i]) left.push(i);
    if (rest.length) {
      const per = Math.ceil(left.length / rest.length) || 0;
      rest.forEach((k, j) => { const seg = left.slice(j * per, (j + 1) * per); if (seg.length) plan.push({ part: parts[k], strokes: seg }); else plan.push({ part: parts[k], strokes: [] }); });
    } else if (left.length && plan.length) {
      plan[plan.length - 1].extra = left;
    }
    for (const pl of plan) {
      const pg = get(pl.part);
      const idx = pl.range ? range(pl.range[0], pl.range[1]) : pl.strokes;
      pl.idx = idx;
      pl.mode = (pg && pl.range && pg.n === idx.length) ? 'morph' : 'fade';
      pl.box = idx.length ? bboxIdx(result, idx) : { x: 30, y: 30, w: 49, h: 49 };
    }
    return plan;
  }
  function range(a, b) { const r = []; for (let i = a; i < b; i++) r.push(i); return r; }
  function bboxIdx(ch, idx) {
    const g = get(ch); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const i of idx) { const p = g.strokes[i].p; for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); y0 = Math.min(y0, p[k + 1]); y1 = Math.max(y1, p[k + 1]); } }
    return { x: x0, y: y0, w: Math.max(4, x1 - x0), h: Math.max(4, y1 - y0) };
  }
  // 合わせ字の一こま。t: 0（材料が並んでいる）→ 1（合わさった字）
  // 材料は横に並べて始める（starts: [{x,y,s}] 109 単位の、材料ごとの置き場所と大きさ）
  function drawMorph(ctx, parts, result, plan, t, size, color, starts) {
    const g = get(result); if (!g || !plan) { draw(ctx, result, size, color); return; }
    const W = baseWidth(g.n);
    ctx.save(); ctx.scale(size / 109, size / 109); ctx.fillStyle = color;
    const base = ctx.globalAlpha;
    const te = easeInOut(clamp(t, 0, 1));
    plan.forEach((pl, k) => {
      const pg = get(pl.part);
      const st = starts[k] || { x: 0, y: 0, s: 1 };
      if (pl.mode === 'morph' && pg) {
        const Wp = lerp(baseWidth(pg.n) * st.s, W, te);
        pl.idx.forEach((ri, j) => {
          const src = transformStroke(pg.strokes[j], st.s, st.s, st.x, st.y);
          const s = lerpStroke(src, g.strokes[ri], te);
          ctx.globalAlpha = base * 0.92;
          drawStroke(ctx, s.p, s.pr, s.kind, Wp, 77 + ri, undefined, false);
        });
      } else {
        // 部品の形が違う時：材料が小さくなって部品の場所へ行きながら、部品の画に変わる
        if (pg) {
          const bx = pl.box, sb = bbox(pl.part);
          const sx = lerp(st.s, bx.w / sb.w, te), sy = lerp(st.s, bx.h / sb.h, te);
          const dx = lerp(st.x, bx.x - sb.x * (bx.w / sb.w), te), dy = lerp(st.y, bx.y - sb.y * (bx.h / sb.h), te);
          ctx.globalAlpha = base * 0.92 * (1 - smooth(0.45, 0.9, t));
          const Wp = baseWidth(pg.n) * Math.min(sx, sy);
          for (let j = 0; j < pg.n; j++) { const s = transformStroke(pg.strokes[j], sx, sy, dx, dy); drawStroke(ctx, s.p, s.pr, s.kind, Wp, 91 + j, undefined, false); }
        }
        ctx.globalAlpha = base * 0.92 * smooth(0.45, 0.95, t);
        for (const ri of pl.idx) { const s = g.strokes[ri]; drawStroke(ctx, s.p, s.pr, s.kind, W, 77 + ri, undefined, false); }
      }
      if (pl.extra) { ctx.globalAlpha = base * 0.92 * smooth(0.5, 1, t); for (const ri of pl.extra) { const s = g.strokes[ri]; drawStroke(ctx, s.p, s.pr, s.kind, W, 77 + ri, undefined, false); } }
    });
    ctx.restore();
  }

  // ---- 字の絵の作り置き ----
  const cache = new Map();
  let cacheBytes = 0;
  function sprite(ch, px, color, variant) {
    px = Math.max(8, Math.round(px));
    const key = ch + '|' + px + '|' + color + '|' + (variant || '');
    let c = cache.get(key);
    if (c) { cache.delete(key); cache.set(key, c); return c; }
    const pad = Math.ceil(px * 0.08);
    c = document.createElement('canvas'); c.width = px + pad * 2; c.height = px + pad * 2; c.pad = pad;
    const x = c.getContext('2d');
    x.translate(pad, pad);
    if (variant === 'faded') { x.globalAlpha = 0.35; draw(x, ch, px, color, { bleed: false }); }
    else if (variant === 'bold') draw(x, ch, px, color, { weight: 1.15 });
    else if (variant === 'thin') draw(x, ch, px, color, { weight: 0.8 });
    else draw(x, ch, px, color);
    cache.set(key, c); cacheBytes += c.width * c.height * 4;
    while (cacheBytes > 96e6 && cache.size > 10) { const k = cache.keys().next().value; const o = cache.get(k); cacheBytes -= o.width * o.height * 4; cache.delete(k); }
    return c;
  }
  // 二字の言葉（熟語）を横に並べた絵
  function wordSprite(word, px, color) {
    const key = '\u0001' + word + '|' + px + '|' + color;
    let c = cache.get(key); if (c) return c;
    const chars = [...word], pad = Math.ceil(px * 0.08);
    c = document.createElement('canvas'); c.width = Math.round(px * chars.length * 0.92) + pad * 2; c.height = px + pad * 2; c.pad = pad;
    const x = c.getContext('2d');
    chars.forEach((ch, i) => { x.save(); x.translate(pad + i * px * 0.92, pad); draw(x, ch, px, color); x.restore(); });
    cache.set(key, c); cacheBytes += c.width * c.height * 4;
    return c;
  }
  return { draw, sprite, wordSprite, get, strokeCount, morphPlan, drawMorph, bbox, baseWidth, drawStroke, TIP };
})();

// 部首の形：材料の字が、合わさった字の中ではこの形で入っている
const RADICAL_FORM = {
  '水': ['氵', '氺', '水'], '火': ['灬', '火'], '人': ['亻', '𠆢', '人'], '手': ['扌', '手'], '心': ['忄', '㣺', '心'], '草': ['艹', '⺿'],
  '言': ['訁', '言'], '金': ['釒', '金'], '糸': ['糹', '糸'], '食': ['飠', '食'], '犬': ['犭', '犬'], '衣': ['衤', '衣'], '示': ['礻', '示'],
  '竹': ['⺮', '竹'], '雨': ['⻗', '雨'], '肉': ['月', '⺼'], '刀': ['刂', '刀'], '玉': ['王', '玉'], '足': ['⻊', '足'], '網': ['罒'], '老': ['耂'],
  '走': ['走'], '道': ['辶', '⻌'], '冷': ['冫'], '氷': ['冫'], '家': ['宀'], '穴': ['穴', '宀'], '山': ['山'], '目': ['目', '罒'], '羊': ['⺶', '羊'],
};

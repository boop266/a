/* =========================================================
   manga/styles/api.js — 外向きの口（window.MangaInk）と studio への登録
   ・drawCharacter(ctx, charSpec, pose, expression, box, opts)
   ・drawBackground(ctx, bgSpec, box, opts)
   ・drawEffect(ctx, effectSpec, box, opts)
   ・metrics(charSpec, opts)
   ・drawCharacterSheet(ctx, charSpec, art, box) / drawExpressionSheet(ctx, charSpec, art, box, expressions)
   ・drawFrame(ctx, box, opts)
   opts は art そのもの、または { art } のどちらでもよい
   ========================================================= */
(() => {
  const K = window.MangaStylesKit;
  const { clamp, lerp } = K;
  const EXPR_JA = { normal: 'ふつう', smile: 'ほほえみ', happy: 'うれしい', laugh: '大笑い', surprised: 'おどろき', shock: 'ショック', angry: '怒り', rage: '激怒', sad: 'かなしい', cry: '泣く', worried: '心配', think: '考える', determined: '決意', nervous: 'あせり', sleepy: 'ねむい', smug: 'したり顔', love: 'うっとり', scared: 'こわい', embarrassed: '照れ', blank: 'ぽかん', pain: '痛い', funny: 'おどけ' };
  const label = (ctx, t, x, y, size, align = 'center') => { ctx.save(); ctx.font = `700 ${size}px "Zen Kaku Gothic New","IPAGothic",sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = '#222'; ctx.fillText(t, x, y); ctx.restore(); };
  const describe = s => [s.age && ({ child: '子ども', teen: '少年少女', adult: '大人', elder: '年配' }[s.age]), s.species && s.species !== 'human' ? s.species : null, s.hair && ('髪:' + s.hair), s.hairColor && ('(' + s.hairColor + ')'), s.outfit && ('服:' + s.outfit), s.pattern && ('柄:' + s.pattern), (s.items || []).length ? ('小物:' + s.items.join('・')) : null].filter(Boolean).join('  ');

  // 設定資料：正面・横・後ろの全身（頭身の目盛りつき）＋バストアップ
  function drawCharacterSheet(ctx, spec, art, box) {
    art = K.normalizeArt(art);
    const { x, y, w, h } = box;
    ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const th = Math.max(14, h * 0.045);
    label(ctx, spec.name || spec.id || '', x + 12, y + th * 0.9, th, 'left');
    label(ctx, describe(spec), x + 12, y + th * 2.0, th * 0.5, 'left');
    const top = y + th * 2.8, bot = y + h - th * 0.8;
    const met = K.metrics(spec, art);
    const avail = bot - top;
    const unit = avail * 0.92 / met.top;
    const fullW = w * 0.72;
    const cols = [{ f: 0, back: false, lab: '正面' }, { f: 1, yaw: 90, lab: '横' }, { f: 0, back: true, lab: '後ろ' }];
    // 頭身の目盛り
    const H = met.top * unit, headPx = H / (art.headRatio * ({ child: 0.68, teen: 0.93, adult: 1, elder: 0.95 }[spec.age] || 1));
    ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    for (let yy = bot; yy > bot - H - 2; yy -= headPx) { ctx.beginPath(); ctx.moveTo(x + 8, yy); ctx.lineTo(x + fullW, yy); ctx.stroke(); }
    ctx.restore();
    cols.forEach((c, i) => {
      const cx = x + fullW * (i + 0.5) / cols.length;
      K.drawCharacter(ctx, spec, 'stand', 'normal', { footX: cx, footY: bot, unit, facing: c.f, back: c.back, yaw: c.yaw, panel: { x: x + fullW * i / cols.length, y: top - th * 0.3, w: fullW / cols.length, h: bot - top + th * 0.6 } }, art);
      label(ctx, c.lab, cx, bot + th * 0.45, th * 0.5);
    });
    // バストアップ（3/4・ほほえみ）
    const bx = x + fullW + 8, bw = w - fullW - 16, bh = Math.min(bw * 1.25, avail * 0.55);
    const pan = { x: bx, y: top, w: bw, h: bh };
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.strokeRect(pan.x, pan.y, pan.w, pan.h);
    bust(ctx, spec, art, pan, 'smile', 1);
    const pan2 = { x: bx, y: top + bh + 8, w: bw, h: Math.min(bh, bot - top - bh - 8) };
    if (pan2.h > 40) { ctx.strokeRect(pan2.x, pan2.y, pan2.w, pan2.h); bust(ctx, spec, art, pan2, 'determined', -1); }
    ctx.restore();
  }
  // バストアップを枠に収める
  function bust(ctx, spec, art, pan, expr, facing, pose = 'stand') {
    const met = K.metrics(spec, art);
    const unit = pan.h * 0.36 / Math.max(met.R, 6);
    const footY = pan.y + pan.h * 0.42 - met.hc * unit;
    K.drawCharacter(ctx, spec, pose, expr, { footX: pan.x + pan.w / 2, footY, unit, facing, panel: pan, headAt: { x: pan.x + pan.w / 2, y: pan.y + pan.h * 0.42 } }, art);
  }
  // 表情集
  function drawExpressionSheet(ctx, spec, art, box, expressions) {
    art = K.normalizeArt(art);
    const ex = (expressions && expressions.length ? expressions : ['normal', 'smile', 'laugh', 'angry', 'sad', 'surprised', 'embarrassed', 'determined']).slice(0, 12);
    const { x, y, w, h } = box;
    ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#bbb'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const th = Math.max(12, h * 0.05);
    label(ctx, (spec.name || '') + '  表情集', x + 10, y + th * 0.85, th, 'left');
    const cols = ex.length > 6 ? 4 : 3, rows = Math.ceil(ex.length / cols);
    const gx = x + 8, gy = y + th * 1.8, gw = w - 16, gh = h - th * 1.8 - 8;
    const cw = gw / cols, ch = gh / rows;
    ex.forEach((e, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const pan = { x: gx + c * cw + 3, y: gy + r * ch + 3, w: cw - 6, h: ch - th * 0.9 - 6 };
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2; ctx.strokeRect(pan.x, pan.y, pan.w, pan.h);
      bust(ctx, spec, art, pan, e, i % 2 ? -1 : 1, { cry: 'cry', think: 'think' }[e] || 'stand');
      label(ctx, EXPR_JA[e] || e, pan.x + pan.w / 2, pan.y + pan.h + th * 0.5, th * 0.62);
    });
    ctx.restore();
  }

  const API = {
    name: 'ink',
    drawCharacter: (ctx, spec, pose, expr, box, opts) => K.drawCharacter(ctx, spec, pose, expr, box, opts),
    drawBackground: (ctx, spec, box, opts) => K.drawBackground(ctx, spec, box, opts),
    drawEffect: (ctx, spec, box, opts) => K.drawEffect(ctx, spec, box, opts),
    metrics: (spec, opts) => K.metrics(spec, opts),
    drawFrame: (ctx, box, opts) => K.drawFrame(ctx, box, opts),
    drawCharacterSheet, drawExpressionSheet,
    sfx: (ctx, text, x, y, size, opts) => K.sfxText(ctx, text, x, y, size, opts),
    normalizeArt: K.normalizeArt, randomArt: K.randomArt, presets: K.PRESETS, POSES: K.POSES, EXPRS: K.EXPRS, BG_NAMES: K.BG_NAMES,
  };
  window.MangaInk = API;
  // studio.html の登録口があれば、登録する
  try { if (window.MangaStyles && typeof window.MangaStyles.register === 'function') window.MangaStyles.register('ink', API); } catch (e) { console.warn('MangaStyles.register failed', e); }
})();

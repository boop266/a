/* =========================================================
   manga/styles/art.js — 絵柄パラメータ（art）
   ・どんな組み合わせでも描けるように、値を正規化し、描画の設定へ変換する
   ・プリセットは「出発点の一例」。中身はただのパラメータの値
   ========================================================= */
(() => {
  const K = window.MangaStylesKit; const { clamp, lerp } = K;
  const DEFAULT_ART = {
    headRatio: 6.5, deform: 0.3, eyeSize: 0.5, eyeStyle: 'simple',
    line: { weight: 0.5, taper: 0.6, jitter: 0.15, roughness: 0.1 },
    hatching: 0.2, crossHatch: 0.1, black: 0.4, tone: 0.4, toneKind: 'dot',
    detail: 0.5, perspective: 0.3, dynamism: 0.4, sparkle: 0.2, softness: 0.3, grain: 0, panelFrame: 'clean',
  };
  // studio.html の語彙（round / line / sand / dynamic）も受け付ける
  const EYE_STYLES = ['dot', 'simple', 'round', 'sparkle', 'sharp', 'realistic'];
  const TONE_KINDS = ['dot', 'gradient', 'kakeami', 'line', 'sand', 'none'];
  const FRAMES = ['clean', 'rough', 'borderless', 'rounded', 'dynamic'];
  // headRatio：2..8 は「等身」。0..1 は studio の「頭の大きさ」（0=リアルな頭身, 1=大きな頭）
  const headsOf = v => { v = Number(v); if (!Number.isFinite(v)) return null; return v <= 1 ? lerp(8, 2, clamp(v)) : clamp(v, 2, 8); };
  const n01 = (v, d) => { v = Number(v); return Number.isFinite(v) ? clamp(v) : d; };
  function normalizeArt(a = {}) {
    if (a && a.art && typeof a.art === 'object') a = a.art;
    a = a || {}; const d = DEFAULT_ART, l = a.line || {};
    return {
      headRatio: headsOf(a.headRatio) ?? d.headRatio,
      deform: n01(a.deform, d.deform), eyeSize: n01(a.eyeSize, d.eyeSize),
      eyeStyle: EYE_STYLES.includes(a.eyeStyle) ? a.eyeStyle : d.eyeStyle,
      line: { weight: n01(l.weight, d.line.weight), taper: n01(l.taper, d.line.taper), jitter: n01(l.jitter, d.line.jitter), roughness: n01(l.roughness, d.line.roughness) },
      hatching: n01(a.hatching, d.hatching), crossHatch: n01(a.crossHatch, d.crossHatch), black: n01(a.black, d.black), tone: n01(a.tone, d.tone),
      toneKind: TONE_KINDS.includes(a.toneKind) ? a.toneKind : d.toneKind,
      detail: n01(a.detail, d.detail), perspective: n01(a.perspective, d.perspective), dynamism: n01(a.dynamism, d.dynamism),
      sparkle: n01(a.sparkle, d.sparkle), softness: n01(a.softness, d.softness), grain: n01(a.grain, d.grain),
      panelFrame: FRAMES.includes(a.panelFrame) ? a.panelFrame : d.panelFrame,
    };
  }
  // プリセット（出発点の例）
  const PRESETS = {
    gekiga: { headRatio: 7.8, deform: 0.0, eyeSize: 0.22, eyeStyle: 'realistic', line: { weight: 0.75, taper: 0.95, jitter: 0.25, roughness: 0.35 }, hatching: 0.9, crossHatch: 0.8, black: 0.85, tone: 0.1, toneKind: 'none', detail: 0.95, perspective: 0.45, dynamism: 0.55, sparkle: 0, softness: 0, grain: 0.15, panelFrame: 'clean' },
    shonen: { headRatio: 7, deform: 0.2, eyeSize: 0.45, eyeStyle: 'sharp', line: { weight: 0.7, taper: 0.85, jitter: 0.08, roughness: 0.05 }, hatching: 0.25, crossHatch: 0.1, black: 0.6, tone: 0.45, toneKind: 'dot', detail: 0.6, perspective: 0.6, dynamism: 0.95, sparkle: 0.15, softness: 0.1, grain: 0, panelFrame: 'clean' },
    action: { headRatio: 7.5, deform: 0.05, eyeSize: 0.35, eyeStyle: 'sharp', line: { weight: 0.5, taper: 0.8, jitter: 0.05, roughness: 0.05 }, hatching: 0.5, crossHatch: 0.35, black: 0.55, tone: 0.55, toneKind: 'gradient', detail: 1.0, perspective: 1.0, dynamism: 0.85, sparkle: 0.05, softness: 0.0, grain: 0, panelFrame: 'clean' },
    yuru: { headRatio: 2.6, deform: 0.85, eyeSize: 0.25, eyeStyle: 'dot', line: { weight: 0.6, taper: 0.15, jitter: 0.2, roughness: 0.05 }, hatching: 0, crossHatch: 0, black: 0.45, tone: 0.35, toneKind: 'dot', detail: 0.3, perspective: 0.05, dynamism: 0.3, sparkle: 0.3, softness: 0.75, grain: 0, panelFrame: 'rounded' },
    shojo: { headRatio: 6.8, deform: 0.25, eyeSize: 0.9, eyeStyle: 'sparkle', line: { weight: 0.25, taper: 0.9, jitter: 0.05, roughness: 0 }, hatching: 0.1, crossHatch: 0, black: 0.35, tone: 0.75, toneKind: 'gradient', detail: 0.6, perspective: 0.2, dynamism: 0.25, sparkle: 1.0, softness: 0.6, grain: 0, panelFrame: 'borderless' },
    gag: { headRatio: 3.2, deform: 1.0, eyeSize: 0.6, eyeStyle: 'simple', line: { weight: 0.85, taper: 0.5, jitter: 0.5, roughness: 0.3 }, hatching: 0.05, crossHatch: 0, black: 0.5, tone: 0.3, toneKind: 'dot', detail: 0.25, perspective: 0.35, dynamism: 1.0, sparkle: 0.1, softness: 0.2, grain: 0, panelFrame: 'rough' },
    horror: { headRatio: 7, deform: 0.1, eyeSize: 0.4, eyeStyle: 'realistic', line: { weight: 0.45, taper: 0.7, jitter: 0.6, roughness: 0.65 }, hatching: 0.55, crossHatch: 0.5, black: 1.0, tone: 0.6, toneKind: 'kakeami', detail: 0.75, perspective: 0.6, dynamism: 0.35, sparkle: 0, softness: 0, grain: 0.35, panelFrame: 'rough' },
    ehon: { headRatio: 3.8, deform: 0.6, eyeSize: 0.3, eyeStyle: 'dot', line: { weight: 0.3, taper: 0.3, jitter: 0.45, roughness: 0.2 }, hatching: 0.0, crossHatch: 0, black: 0.05, tone: 0.45, toneKind: 'gradient', detail: 0.35, perspective: 0.0, dynamism: 0.15, sparkle: 0.35, softness: 1.0, grain: 0.55, panelFrame: 'borderless' },
  };
  function randomArt(rnd = Math.random) {
    const r = () => Math.round(rnd() * 100) / 100, pk = a => a[Math.floor(rnd() * a.length)];
    return normalizeArt({ headRatio: Math.round((2 + rnd() * 6) * 10) / 10, deform: r(), eyeSize: r(), eyeStyle: pk(EYE_STYLES), line: { weight: r(), taper: r(), jitter: r(), roughness: r() }, hatching: r(), crossHatch: r(), black: r(), tone: r(), toneKind: pk(TONE_KINDS), detail: r(), perspective: r(), dynamism: r(), sparkle: r(), softness: r(), grain: r(), panelFrame: pk(FRAMES) });
  }
  // art → 描き分けの設定（線・トーン・ハッチ）。sc = 線や網点の基準の大きさ
  function derive(art, sc = 1) {
    const a = normalizeArt(art), soft = a.softness;
    const line = { w: lerp(0.5, 1.9, a.line.weight) * lerp(1, 0.75, soft) * sc, taper: a.line.taper * lerp(1, 0.55, soft), jitter: a.line.jitter * 1.4 * sc, rough: a.line.roughness, soft, grain: a.grain };
    const hat = a.hatching * lerp(1, 0.6, soft), ch = a.crossHatch * (0.4 + 0.6 * hat > 0.05 ? 1 : 0.3) * lerp(1, 0.5, soft);
    const tk = a.toneKind === 'none' ? 'none' : a.toneKind, tn = tk === 'none' ? 0 : a.tone * lerp(1, 0.8, soft);
    const blk = a.black * lerp(1, 0.7, soft);
    const shadeK = Math.min(1, Math.max(hat * 1.1, tn * 0.8, blk > 0.5 ? (blk - 0.5) * 2 : 0) + 0.05);
    const R = {
      art: a, sc, paper: '#fff', toneKind: tk,
      betaM: lerp(0.93, 0.6, blk), shadeBeta: blk > 0.55, betaS: lerp(0.98, 0.5, clamp((blk - 0.55) / 0.45)), shadeK,
      toneMat: tn, toneShade: tn * (1 - hat) * 0.75 + (hat === 0 && tn === 0 ? 0 : 0), hatchShade: hat > 0.02 ? lerp(0.55, 1.1, hat) : 0, hatchMat: hat > 0.02 ? hat * (1 - tn) * 0.75 : 0,
      dotPer: lerp(3.6, 2.5, a.detail) * sc, levels: [[0.05, 0.1], [0.2, 0.2], [0.38, 0.32], [0.58, 0.5], [0.75, 0.62]],
      grain: a.grain, rough: a.line.roughness, grainTone: tk === 'gradient' ? a.grain * 0.5 : 0,
      hatch: [],
    };
    if (hat > 0.02) {
      const sp = lerp(3.6, 1.9, hat) * sc;
      R.hatch.push({ ang: -1.0, thr: lerp(0.5, 0.12, hat), sp, w: sp * 0.55, band: 0.35 });
      if (ch > 0.05) R.hatch.push({ ang: 0.45, thr: lerp(0.9, 0.36, ch), sp: sp * 1.05, w: sp * 0.5, band: 0.3 });
      if (ch > 0.5) R.hatch.push({ ang: -0.15, thr: lerp(0.95, 0.6, (ch - 0.5) * 2), sp: sp * 0.9, w: sp * 0.45, band: 0.25 });
    }
    return { art: a, line, R };
  }
  Object.assign(K, { headsOf, DEFAULT_ART, PRESETS, normalizeArt, randomArt, derive, EYE_STYLES, TONE_KINDS, FRAMES });
})();

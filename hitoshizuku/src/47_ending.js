// ---------------------------------------------------------------------------
// あなたの絵巻：ぬけた場面の「写し」をつないで、一巻の絵巻として流す。
//   はじめに名と落款。つぎに旅した場面が右から左へ。さいごに、また、ひとしずく。
// ---------------------------------------------------------------------------
// 場面の写し（ぬける時の絵巻を、まるごと小さく写しておく）
const Snap = {
  key: 'hitoshizuku.snaps.v1', map: null,
  all() {
    if (!this.map) { try { this.map = JSON.parse(localStorage.getItem(this.key) || '{}') || {}; } catch (e) { this.map = {}; } }
    return this.map;
  },
  take(id) {
    if (!W || !id || !R.ctx) return;
    const keep = { cv: R.cv, ctx: R.ctx, vw: R.vw, vh: R.vh, TS: R.TS, dpr: R.dpr, cx: R.cam.x, cy: R.cam.y, sh: R.cam.shake, focus: R.cam.focus, terr: R.terrainCv, terrKey: R.terrainKey, preview: R.preview, writing: R.writing, paperPat: R.paperPat };
    try {
      const TS = clamp(Math.floor(340 / W.h), 10, 24);
      const c = document.createElement('canvas'); c.width = W.w * TS; c.height = W.h * TS;
      R.cv = c; R.ctx = c.getContext('2d'); R.vw = c.width; R.vh = c.height; R.TS = TS; R.dpr = 1;
      R.cam.x = W.w / 2; R.cam.y = W.h / 2; R.cam.shake = 0; R.cam.focus = null;
      R.darkCv = null; R.terrainCv = null; R.preview = null; R.writing = []; R.paperPat = null; R.snap = true;
      renderFrame(0);
      let url = c.toDataURL('image/webp', 0.8);
      if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', 0.74);
      this.all()[id] = url;
      try { localStorage.setItem(this.key, JSON.stringify(this.map)); } catch (e) { }
    } catch (e) { reportError(e); }
    finally {
      R.snap = false;
      Object.assign(R, { cv: keep.cv, ctx: keep.ctx, vw: keep.vw, vh: keep.vh, TS: keep.TS, dpr: keep.dpr, terrainCv: keep.terr, terrainKey: keep.terrKey, preview: keep.preview, writing: keep.writing, paperPat: keep.paperPat, darkCv: null });
      R.cam.x = keep.cx; R.cam.y = keep.cy; R.cam.shake = keep.sh; R.cam.focus = keep.focus;
      if (W) W.tdirty = true;
    }
  },
};

// 場面ごとの色（写しがない時の絵）
const CH_WASH = ['rgba(150,140,120,.10)', 'rgba(120,170,90,.16)', 'rgba(60,120,190,.16)', 'rgba(190,120,50,.16)', 'rgba(200,210,230,.30)', 'rgba(30,40,80,.22)', 'rgba(170,190,220,.22)', 'rgba(200,150,90,.14)'];
const CREDITS = [
  [0.01, 0.15, 'ひとしずく　ことだま絵巻'],
  [0.17, 0.31, '物語・絵・しかけ・音　Claude'],
  [0.33, 0.47, '字のかたち　KanjiVG（Ulrich Apel ほか・CC BY-SA 3.0）'],
  [0.49, 0.63, '文字　Klee One（Fontworks・SIL Open Font License 1.1）'],
  [0.65, 0.79, '琴も、尺八も、太鼓も、その場で鳴らした音'],
  [0.81, 0.97, 'この絵巻を書いたのは　あなた'],
];

const Ending = {
  on: false, raf: 0, t0: 0, panels: [], imgs: new Map(), name: '', endAt: 0, endShown: false, dpan: 60, replay: false,
  play(replay) {
    this.replay = !!replay;
    this.name = Game.finalWord || '人';
    let box = $('ending');
    if (!box) {
      box = el('div'); box.id = 'ending';
      const cv = el('canvas'); cv.id = 'endcv'; box.append(cv);
      const sk = el('button', 'skip', 'とばす'); sk.id = 'endSkip'; box.append(sk);
      const m = el('div', 'endmenu'); m.id = 'endMenu'; box.append(m);
      document.body.append(box);
    }
    $('endSkip').onclick = ev => { ev.stopPropagation(); this.skip(); };
    $('endSkip').hidden = false;
    $('endMenu').innerHTML = ''; $('endMenu').classList.remove('on');
    box.classList.add('on');
    Game.paused = true; Voice.clear(); Tutor.stop(); hideBubble && hideBubble();
    this.build();
    this.t0 = performance.now(); this.endShown = false; this.skipAt = 0;
    AudioSys.init(); Music.theme();
    this.on = true;
    cancelAnimationFrame(this.raf);
    const loop = () => { if (!this.on) return; try { this.draw(); } catch (e) { reportError(e); } this.raf = requestAnimationFrame(loop); };
    loop();
    Bus.emit('ending', { name: this.name });
  },
  // 絵巻にならべる物（高さ 1 に対する幅）
  build() {
    const P = [{ type: 'title', u: 1.05 }];
    const snaps = Snap.all();
    let lastCh = -1, nScenes = 0;
    for (const def of SCENES) {
      if (!Game.cleared[def.id] && !snaps[def.id]) continue;
      if (def.chapter !== lastCh) { lastCh = def.chapter; P.push({ type: 'chapter', c: def.chapter, u: 0.5 }); }
      const url = snaps[def.id];
      let img = null;
      if (url) { img = this.imgs.get(url); if (!img) { img = new Image(); img.src = url; this.imgs.set(url, img); } }
      const asp = def.map[0].length / def.map.length;
      P.push({ type: 'scene', def, img, u: asp * 0.86 + 0.14, asp });
      nScenes++;
    }
    let x = 0; for (const p of P) { p.x = x; x += p.u; }
    this.panels = P; this.totalU = x;
    this.dpan = clamp(nScenes * 2.05 + 8, 22, 72);
  },
  skip() {
    const t = (performance.now() - this.t0) / 1000;
    const endT = 6 + this.dpan + 1.2;
    if (t < endT) this.t0 -= (endT - t) * 1000;
  },
  draw() {
    const c = $('endcv'), dpr = Math.min(2, window.devicePixelRatio || 1);
    const W_ = c.clientWidth, H_ = c.clientHeight;
    if (c.width !== Math.round(W_ * dpr) || c.height !== Math.round(H_ * dpr)) { c.width = Math.round(W_ * dpr); c.height = Math.round(H_ * dpr); }
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = (performance.now() - this.t0) / 1000;
    const fadeIn = clamp(t / 1.6, 0, 1);
    x.clearRect(0, 0, W_, H_);
    x.globalAlpha = fadeIn;
    x.fillStyle = x.createPattern(R.paperCv, 'repeat'); x.fillRect(0, 0, W_, H_);
    x.globalAlpha = 1;
    // 帯（絵巻）
    const Hb = Math.min(H_ * 0.44, W_ * 0.72, 360);
    const by = H_ * 0.42 - Hb / 2;
    const panStart = 6, panEnd = panStart + this.dpan;
    const P = this.panels;
    const title = P[0], last = P[P.length - 1];
    const startOff = W_ / 2 - (title.x + title.u / 2) * Hb;
    const endOff = W_ / 2 - (last.x + last.u / 2) * Hb;
    const pk = clamp((t - panStart) / this.dpan, 0, 1);
    const ease = pk < 0.04 ? (pk / 0.04) * (pk / 0.04) * 0.02 : pk > 0.97 ? 1 - Math.pow((1 - pk) / 0.03, 2) * 0.015 : 0.02 + (pk - 0.04) / 0.93 * 0.965;
    const off = lerp(startOff, endOff, clamp(ease, 0, 1));
    const endK = smooth(panEnd + 0.4, panEnd + 2.2, t);
    x.save(); x.globalAlpha = fadeIn * (1 - endK);
    this.drawBand(x, W_, H_, by, Hb, off, t);
    // つくった者
    const cy = by + Hb + (H_ - by - Hb) * 0.42;
    const fs = clamp(W_ * 0.04, 13, 19);
    x.font = '600 ' + fs + 'px ' + FONT; x.textAlign = 'center'; x.fillStyle = INK.sumi;
    if (t < panStart + 0.5) { const a = smooth(3.4, 4.6, t); x.globalAlpha = fadeIn * a; x.font = '600 ' + Math.round(fs * 1.25) + 'px ' + FONT; x.fillText('あなたの絵巻', W_ / 2, cy); }
    else for (const [a0, a1, s] of CREDITS) {
      if (pk < a0 || pk > a1) continue;
      const a = Math.min(smooth(a0, a0 + 0.025, pk), 1 - smooth(a1 - 0.025, a1, pk));
      x.globalAlpha = fadeIn * a * (1 - endK);
      this.fitText(x, s, W_ / 2, cy, W_ - 40, fs);
    }
    x.restore();
    if (t > panEnd + 0.4) this.drawEnd(x, W_, H_, t - panEnd - 0.4);
  },
  fitText(x, s, cx, cy, maxW, fs) {
    let f = fs; x.font = '600 ' + f + 'px ' + FONT;
    while (x.measureText(s).width > maxW && f > 10) { f -= 1; x.font = '600 ' + f + 'px ' + FONT; }
    x.fillText(s, cx, cy);
  },
  drawBand(x, W_, H_, by, Hb, off, t) {
    // 紙の帯と、上下のふち
    x.fillStyle = 'rgba(248,243,228,.9)'; x.fillRect(0, by, W_, Hb);
    x.fillStyle = 'rgba(60,40,20,.10)'; x.fillRect(0, by + Hb, W_, 5);
    x.strokeStyle = 'rgba(120,90,50,.45)'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(0, by + 0.5); x.lineTo(W_, by + 0.5); x.moveTo(0, by + Hb - 0.5); x.lineTo(W_, by + Hb - 0.5); x.stroke();
    // はじまりの軸
    const startX = off - Hb * 0.06;
    if (startX > -40) { x.fillStyle = '#5a3d22'; x.fillRect(startX - 10, by - 12, 14, Hb + 24); x.fillStyle = '#2b1d10'; x.fillRect(startX - 12, by - 18, 18, 8); x.fillRect(startX - 12, by + Hb + 10, 18, 8); }
    for (const p of this.panels) {
      const px = off + p.x * Hb, pw = p.u * Hb;
      if (px > W_ + 10 || px + pw < -10) continue;
      if (p.type === 'title') this.drawTitlePanel(x, px, by, pw, Hb, t);
      else if (p.type === 'chapter') this.drawChapterPanel(x, p, px, by, pw, Hb);
      else this.drawScenePanel(x, p, px, by, pw, Hb);
    }
    // おわりの軸
    const last = this.panels[this.panels.length - 1];
    const endX = off + (last.x + last.u) * Hb + Hb * 0.06;
    if (endX < W_ + 40) { x.fillStyle = '#5a3d22'; x.fillRect(endX - 4, by - 12, 14, Hb + 24); x.fillStyle = '#2b1d10'; x.fillRect(endX - 6, by - 18, 18, 8); x.fillRect(endX - 6, by + Hb + 10, 18, 8); }
  },
  drawTitlePanel(x, px, by, pw, Hb, t) {
    // 題簽：名を、筆が書く。さいごの一画は、少しおくれて金色に光る
    const sw = Hb * 0.36, sh = Hb * 0.84, sx = px + (pw - sw) / 2, sy = by + (Hb - sh) / 2;
    x.fillStyle = '#26314f'; x.fillRect(sx, sy, sw, sh);
    x.fillStyle = '#f8f2e0'; x.fillRect(sx + sw * 0.1, sy + sw * 0.14, sw * 0.8, sh - sw * 0.28);
    const chars = [...this.name], n = chars.length;
    const s = Math.min(sw * 0.74, (sh - sw * 0.5) / n);
    const total = chars.reduce((a, ch) => a + Brush.strokeCount(ch), 0);
    const prog = clamp((t - 1.2) / 1.8, 0, 1) * total;
    let before = 0;
    chars.forEach((ch, i) => {
      const cnt = Brush.strokeCount(ch);
      x.save(); x.translate(sx + (sw - s) / 2, sy + (sh - s * n) / 2 + i * s);
      Brush.draw(x, ch, s, INK.sumi, { strokes: clamp(prog - before, 0, cnt) });
      x.restore(); before += cnt;
    });
    if (t > 3.0) {
      const k = clamp((t - 3.0) / 0.25, 0, 1), sc = lerp(1.6, 1, easeInOut(k)), q = sw * 0.3;
      x.save(); x.globalAlpha *= k; x.translate(sx + sw * 0.08 + q / 2, sy + sh - sw * 0.16 - q / 2); x.rotate(-0.06); x.scale(sc, sc);
      x.fillStyle = INK.shu; x.fillRect(-q / 2, -q / 2, q, q); x.translate(-q * 0.44, -q * 0.44); Brush.draw(x, '雫', q * 0.88, '#f6f1e2', { bleed: false });
      x.restore();
      if (!this._stamped) { this._stamped = true; Sfx.stamp(); }
    } else this._stamped = false;
  },
  drawChapterPanel(x, p, px, by, pw, Hb) {
    const ch = CHAPTERS[p.c] || { seal: '', title: '' };
    const q = Math.min(pw * 0.5, Hb * 0.16);
    const cx = px + pw / 2;
    x.save();
    x.fillStyle = INK.shu; x.translate(cx, by + Hb * 0.14 + q / 2); x.rotate(-0.05); x.fillRect(-q / 2, -q / 2, q, q);
    x.translate(-q * 0.44, -q * 0.44); Brush.draw(x, ch.seal, q * 0.88, '#f6f1e2', { bleed: false });
    x.restore();
    // 巻の名（縦書き）
    const name = ch.title.replace('　', '');
    const fs = clamp(Hb * 0.075, 12, 22);
    x.save(); x.fillStyle = INK.sumi; x.font = '600 ' + fs + 'px ' + FONT; x.textAlign = 'center';
    [...name].forEach((c2, i) => x.fillText(c2, cx, by + Hb * 0.14 + q + fs * 1.4 + i * fs * 1.12));
    x.restore();
  },
  drawScenePanel(x, p, px, by, pw, Hb) {
    const pad = Hb * 0.07, ih = Hb - pad * 2, iw = ih * p.asp, ix = px + (pw - iw) / 2, iy = by + pad;
    if (p.img && p.img.complete && p.img.naturalWidth) {
      // 絵巻の紙に、墨と絵の具がしみこんだように（かけ合わせ）
      x.save(); x.globalCompositeOperation = 'multiply'; x.drawImage(p.img, ix, iy, iw, ih); x.restore();
    } else {
      // 写しがない：その場面の名と、よみがえらせた物を、筆で
      x.fillStyle = CH_WASH[p.def.chapter] || CH_WASH[0]; x.fillRect(ix, iy, iw, ih);
      const ks = []; for (const f of p.def.faded || []) if (!ks.includes(f.k) && KDEF[f.k] && f.k.length === 1) ks.push(f.k); for (const e of p.def.ents || []) if (!ks.includes(e.k) && KDEF[e.k] && e.k.length === 1) ks.push(e.k);
      const show = ks.slice(0, 5), gs = Math.min(ih * 0.3, iw / (show.length + 1));
      show.forEach((k, i) => { x.save(); x.translate(ix + iw * (i + 1) / (show.length + 1) - gs / 2, iy + ih * (0.55 + (i % 2) * 0.1) - gs / 2); Brush.draw(x, k, gs, INK[KDEF[k].col] || INK.sumi); x.restore(); });
    }
    // 端は紙にとける（左右と上）
    const fw = Math.min(iw * 0.08, 30);
    for (const [gx, dir] of [[ix, 1], [ix + iw, -1]]) {
      const g = x.createLinearGradient(gx, 0, gx + dir * fw, 0);
      g.addColorStop(0, 'rgba(248,243,228,1)'); g.addColorStop(1, 'rgba(248,243,228,0)');
      x.fillStyle = g; x.fillRect(dir > 0 ? gx : gx - fw, iy, fw, ih);
    }
    const gt = x.createLinearGradient(0, iy, 0, iy + ih * 0.14); gt.addColorStop(0, 'rgba(248,243,228,.9)'); gt.addColorStop(1, 'rgba(248,243,228,0)');
    x.fillStyle = gt; x.fillRect(ix, iy, iw, ih * 0.14);
    // 場面の名
    const fs = clamp(Hb * 0.06, 11, 16);
    x.save(); x.font = '600 ' + fs + 'px ' + FONT; x.fillStyle = 'rgba(28,26,32,.72)'; x.textAlign = 'left';
    const lab = (p.def.no ? p.def.no + '　' : '') + p.def.title;
    x.fillStyle = 'rgba(248,243,228,.8)'; const tw = x.measureText(lab).width; x.fillRect(ix + 6, iy + 6, tw + 12, fs + 10);
    x.fillStyle = 'rgba(28,26,32,.8)'; x.fillText(lab, ix + 12, iy + 6 + fs + 2);
    // 印
    const got = Game.stamps[p.def.id] ? Object.keys(Game.stamps[p.def.id]).length : 0;
    for (let i = 0; i < got; i++) { x.fillStyle = INK.shu; x.fillRect(ix + 12 + i * 9, iy + fs + 22, 6, 6); }
    x.restore();
  },
  // おしまい：筆の先に、また、ひとしずく
  drawEnd(x, W_, H_, t) {
    x.save();
    x.globalAlpha = smooth(0, 1.4, t);
    x.fillStyle = x.createPattern(R.paperCv, 'repeat'); x.fillRect(0, 0, W_, H_);
    // 横長の画面では、絵は左、記録は右
    const land = W_ > H_ * 1.1, cx = land ? W_ * 0.3 : W_ / 2, aw = land ? W_ * 0.56 : W_;
    const top = H_ * (land ? 0.1 : 0.07);
    // おしまい
    const gs = Math.min(aw * 0.14, H_ * 0.085, 72);
    const word = 'おしまい'; const wx = cx - gs * 2 * 0.95;
    const prog = clamp((t - 0.6) * 5, 0, 12);
    let before = 0;
    [...word].forEach((ch, i) => { const n = Brush.strokeCount(ch); x.save(); x.translate(wx + i * gs * 0.95, top); Brush.draw(x, ch, gs, INK.sumi, { strokes: clamp(prog - before, 0, n) }); x.restore(); before += n; });
    // 筆
    const bLen = Math.min(H_ * 0.2, 170), ang = -0.42, bx = cx - Math.sin(-ang) * bLen, bTop = top + gs * 1.55;
    x.save(); x.translate(bx, bTop); x.rotate(ang);
    x.fillStyle = '#7a5230'; x.fillRect(-5, -bLen * 0.15, 10, bLen * 0.78);
    x.fillStyle = '#5a3d22'; for (let i = 1; i < 4; i++) x.fillRect(-6, -bLen * 0.15 + i * bLen * 0.19, 12, 3);
    x.fillStyle = INK.shu; x.fillRect(-6, -bLen * 0.2, 12, 8);
    x.fillStyle = INK.sumi; x.beginPath(); x.moveTo(-7, bLen * 0.63); x.quadraticCurveTo(-8, bLen * 0.86, 0, bLen); x.quadraticCurveTo(8, bLen * 0.86, 7, bLen * 0.63); x.closePath(); x.fill();
    x.restore();
    // 筆先の位置（回転後）
    const fx = bx - Math.sin(ang) * bLen, fy = bTop + Math.cos(ang) * bLen;
    // しずくがふくらんで、落ちて、人になる
    const groundY = H_ * (land ? 0.66 : 0.56);
    const r = Math.min(W_, H_) * 0.016;
    if (t < 2.6) { const k = smooth(1.2, 2.6, t); x.fillStyle = INK.sumi; x.beginPath(); x.arc(fx, fy + r * k * 0.8, r * (0.3 + 0.7 * k), 0, TAU); x.fill(); }
    else if (t < 3.1) { const k = (t - 2.6) / 0.5, yy = lerp(fy + r * 0.8, groundY - r, k * k); this.drawDrop(x, fx, yy, r); }
    else {
      const k = clamp((t - 3.1) / 0.5, 0, 1);
      if (!this._splash) { this._splash = true; Sfx.drop(); }
      x.save(); x.globalAlpha *= 1 - k; x.fillStyle = 'rgba(28,26,32,.85)'; x.beginPath(); x.ellipse(fx, groundY, r * (1 + k * 4), r * (0.35 + k), 0, 0, TAU); x.fill(); x.restore();
      if (t > 3.3) {
        const a = clamp((t - 3.3) / 0.8, 0, 1), hop = t > 4.4 && t < 4.9 ? Math.sin((t - 4.4) / 0.5 * Math.PI) * r * 2.2 : 0;
        x.save(); x.globalAlpha *= a; drawHeroFigure(x, fx, groundY - hop, Math.min(W_, H_) * 0.09, { phase: 0, walk: false, bob: Math.sin(t * 2) * 1.2, col: INK.sumi }); x.restore();
        x.fillStyle = 'rgba(40,30,10,.12)'; x.beginPath(); x.ellipse(fx, groundY, r * 2.2, r * 0.45, 0, 0, TAU); x.fill();
      }
    }
    if (t > 5.2) {
      x.globalAlpha = smooth(5.2, 6.4, t);
      x.fillStyle = INK.sumi; x.textAlign = 'center';
      this.fitText(x, 'また、ひとしずく。', cx, groundY + Math.min(W_, H_) * 0.09, aw - 40, clamp(aw * 0.05, 15, 22));
    }
    x.restore();
    if (t > 6.2 && !this.endShown) this.showEnd();
  },
  drawDrop(x, cx, cy, r) {
    x.fillStyle = INK.sumi; x.beginPath(); x.moveTo(cx, cy - r * 1.9);
    x.bezierCurveTo(cx + r * .4, cy - r, cx + r * 1.05, cy - r * .25, cx + r, cy + r * .15);
    x.arc(cx, cy + r * .1, r, 0.05, Math.PI - 0.05);
    x.bezierCurveTo(cx - r * 1.05, cy - r * .25, cx - r * .4, cy - r, cx, cy - r * 1.9); x.fill();
  },
  showEnd() {
    this.endShown = true; this._splash = false;
    $('endSkip').hidden = true;
    const m = $('endMenu'); m.innerHTML = '';
    const total = SCENES.reduce((a, s) => a + (s.stamps || []).length, 0);
    const lines = [
      ['絵巻の名', '「' + this.name + '」'],
      ['おぼえた字', Game.known.filter(k => KDEF[k] && !KDEF[k].story).length + ' / ' + dictTotal()],
      ['書いた字', String(Game.stats.writes || 0)],
      ['色をもどしたもの', String(Game.colors || 0)],
      ['解き方の印', Game.stampCount() + ' / ' + total],
    ];
    const card = el('div', 'endcard');
    for (const [a, b] of lines) { const r = el('div', 'endrow'); r.append(el('span', null, a), el('b', null, b)); card.append(r); }
    m.append(card);
    if (Game.stampCount() < total) m.append(el('p', 'endnote', 'ほかの解き方も、まだ絵巻のどこかに。'));
    const row = el('div', 'mrow');
    const b1 = el('button', 'mbtn red', '自由帳で書く'); b1.onclick = () => this.close('sandbox');
    const b2 = el('button', 'mbtn', '場面をえらぶ'); b2.onclick = () => this.close('scenes');
    const b3 = el('button', 'mbtn', '表紙へ'); b3.onclick = () => this.close('title');
    row.append(b1, b2, b3); m.append(row);
    requestAnimationFrame(() => m.classList.add('on'));
  },
  close(where) {
    this.on = false; cancelAnimationFrame(this.raf);
    $('ending').classList.remove('on');
    Music.stopTheme();
    Game.paused = false;
    if (where === 'sandbox') { Game.started = true; Game.sandbox(); }
    else if (where === 'scenes') { Game.started = true; Scene.load(0); setTimeout(openScenes, 60); }
    else Game.toTitle();
  },
};

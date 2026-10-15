// ---------------------------------------------------------------------------
// 物語：表紙・はじまりの頁・巻のはじめ
// glyphs:ひとしずくことだま絵巻雫
// ---------------------------------------------------------------------------
const PROLOGUE = [
  ['むかし、', 'ひとりの絵師がいた。'],
  ['絵師は一生をかけて、', '一巻の絵巻を描いた。'],
  ['野も、川も、山も、里も、', '夜も、空も。', '好きなものを、ぜんぶ字で描いた。'],
  ['絵師は年をとった。', 'ものの名を、ひとつ、またひとつと', '忘れていった。'],
  ['名を忘れられたものは、', '絵巻から、白く消えていく。'],
  ['ある夜。', 'すっかり白くなりかけた絵巻に、', '筆から最後の墨が、ひとしずく、', 'ぽとりと落ちた。'],
];
const Story = {
  pages: null, i: 0, done: null, anim: null, t0: 0, bgKind: 'paper',
  show(pages, done, opt) {
    this.pages = pages; this.i = 0; this.done = done; this.opt = opt || {};
    const s = $('story'); s.classList.add('on');
    Game.paused = true;
    s.onclick = ev => { if (ev.target === $('storySkip')) return; this.next(); };
    $('storySkip').onclick = ev => { ev.stopPropagation(); this.finish(); };
    this.drawBg();
    this.page();
  },
  page() {
    const box = $('storyTxt'); box.innerHTML = '';
    const lines = this.pages[this.i];
    lines.forEach((l, k) => {
      const p = el('p', null, l);
      if (this.opt.titleFirst && this.i === 0 && k === 0) { p.style.fontSize = 'clamp(26px,7vw,36px)'; p.style.fontWeight = '600'; p.style.marginLeft = '18px'; }
      box.append(p);
      setTimeout(() => p.classList.add('on'), 250 + k * 700);
    });
    $('storyTap').classList.remove('on');
    setTimeout(() => $('storyTap').classList.add('on'), 600 + lines.length * 700);
    Sfx.page();
    this.t0 = performance.now();
    if (this.opt.dropOnLast && this.i === this.pages.length - 1) this.dropAnim();
  },
  next() {
    if (performance.now() - this.t0 < 500) return;
    this.i++;
    if (this.i >= this.pages.length) this.finish(); else this.page();
  },
  finish() {
    const s = $('story'); s.classList.remove('on'); s.onclick = null;
    Game.paused = false; cancelAnimationFrame(this.anim);
    const d = this.done; this.done = null; if (d) d();
  },
  drawBg() {
    const c = $('storycv'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.max(1, c.clientWidth * dpr); c.height = Math.max(1, c.clientHeight * dpr);
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W_ = c.clientWidth, H_ = c.clientHeight;
    const pat = x.createPattern(R.paperCv, 'repeat'); x.fillStyle = pat; x.fillRect(0, 0, W_, H_);
    // 遠い山の薄墨
    const r = makeRng(77);
    for (let li = 0; li < 2; li++) {
      x.fillStyle = li ? 'rgba(80,76,70,.10)' : 'rgba(80,76,70,.06)';
      x.beginPath(); x.moveTo(0, H_);
      for (let px = 0; px <= W_; px += 10) x.lineTo(px, H_ * (0.78 + li * 0.06) - fbm1(px / W_ * 3 + li * 5, 7 + li) * H_ * 0.18);
      x.lineTo(W_, H_); x.fill();
    }
    if (this.opt.seal) {
      x.fillStyle = INK.shu; const s = 46; x.save(); x.translate(28, H_ - 92); x.rotate(-0.05); x.fillRect(0, 0, s, s); x.restore();
      x.save(); x.translate(31, H_ - 89); Brush.draw(x, this.opt.seal, 40, '#f6f1e2', { bleed: false }); x.restore();
    }
  },
  dropAnim() {
    const c = $('storycv'); const x = c.getContext('2d'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W_ = c.clientWidth, H_ = c.clientHeight; const t0 = performance.now();
    const base = document.createElement('canvas'); base.width = c.width; base.height = c.height; base.getContext('2d').drawImage(c, 0, 0);
    const f = () => {
      const t = (performance.now() - t0) / 1000;
      x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(base, 0, 0); x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const k = clamp((t - 2.2) / 1.1, 0, 1);
      const cx = W_ * 0.22, y = lerp(-20, H_ * 0.72, k * k);
      if (k < 1) { const r = 9; x.fillStyle = INK.sumi; x.beginPath(); x.moveTo(cx, y - r * 2); x.bezierCurveTo(cx + r * .5, y - r, cx + r, y - r * .2, cx + r, y + r * .2); x.arc(cx, y + r * .2, r, 0, Math.PI); x.bezierCurveTo(cx - r, y - r * .2, cx - r * .5, y - r, cx, y - r * 2); x.fill(); }
      else { const s = clamp((t - 3.3) * 2.5, 0, 1); x.fillStyle = 'rgba(28,26,32,' + (0.85 * (1 - s * .3)) + ')'; x.beginPath(); x.ellipse(cx, H_ * 0.72 + 8, 10 + s * 40, 4 + s * 10, 0, 0, TAU); x.fill(); if (t > 3.3 && !this._splashed) { this._splashed = true; Sfx.drop(); } }
      this.anim = requestAnimationFrame(f);
    };
    this._splashed = false;
    this.anim = requestAnimationFrame(f);
  },
  prologue(done) { this.show(PROLOGUE, done, { dropOnLast: true }); Music.play('blank'); },
  chapter(ci, done) {
    const ch = CHAPTERS[ci];
    if (!ch || !ch.intro) { done(); return; }
    this.show([ch.intro], done, { titleFirst: true, seal: ch.seal });
    Music.play(ch.music); Music.motif('chapter');
  },
};

// ---- 表紙 ----
const Title = {
  t0: 0, raf: 0,
  show() {
    $('title').classList.add('on');
    Music.play('title');
    const menu = $('titleMenu'); menu.innerHTML = '';
    const cont = Game.known.length > 0;
    const b = el('button', 'red', cont ? 'つづきから' : 'はじめる');
    b.onclick = () => { AudioSys.init(); Music.play('title'); this.hide(); Game.started = true; if (!cont) Story.prologue(() => Scene.load(0)); else Scene.load(Game.sceneIdx || 0); };
    menu.append(b);
    if (cont) {
      const s = el('button', null, '場面をえらぶ'); s.onclick = () => { AudioSys.init(); this.hide(); Game.started = true; Scene.load(Game.sceneIdx || 0); setTimeout(openScenes, 50); }; menu.append(s);
      const d = el('button', null, '自由帳'); d.onclick = () => { AudioSys.init(); this.hide(); Game.started = true; Game.sandbox(); }; menu.append(d);
    }
    this.t0 = performance.now();
    cancelAnimationFrame(this.raf);
    const draw = () => { this.draw(); if ($('title').classList.contains('on')) this.raf = requestAnimationFrame(draw); };
    draw();
  },
  hide() { $('title').classList.remove('on'); cancelAnimationFrame(this.raf); },
  draw() {
    const c = $('titlecv'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W_ = c.clientWidth, H_ = c.clientHeight;
    if (c.width !== Math.round(W_ * dpr) || c.height !== Math.round(H_ * dpr)) { c.width = Math.round(W_ * dpr); c.height = Math.round(H_ * dpr); }
    const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = (performance.now() - this.t0) / 1000;
    x.fillStyle = x.createPattern(R.paperCv, 'repeat'); x.fillRect(0, 0, W_, H_);
    // 遠山
    for (let li = 0; li < 3; li++) {
      x.fillStyle = ['rgba(90,86,80,.07)', 'rgba(90,86,80,.10)', 'rgba(90,86,80,.14)'][li];
      x.beginPath(); x.moveTo(0, H_);
      for (let px = 0; px <= W_; px += 8) x.lineTo(px, H_ * (0.62 + li * 0.07) - fbm1(px / W_ * (2 + li) + li * 9 + t * 0.01 * (li + 1), 3 + li) * H_ * 0.2);
      x.lineTo(W_, H_); x.fill();
    }
    // 朱の日
    x.fillStyle = 'rgba(196,56,31,.85)'; x.beginPath(); x.arc(W_ * 0.24, H_ * 0.2, Math.min(W_, H_) * 0.07, 0, TAU); x.fill();
    // 題：ひとしずく（縦）
    const title = 'ひとしずく';
    const size = Math.min(W_ * 0.2, H_ * 0.12, 96);
    const tx = W_ * 0.62 - size / 2, ty = H_ * 0.1;
    let before = 0; const total = [...title].reduce((a, ch) => a + Brush.strokeCount(ch), 0);
    const prog = Math.min(total, t * 4.2);
    [...title].forEach((ch, i) => { const n = Brush.strokeCount(ch); x.save(); x.translate(tx, ty + i * size * 0.98); Brush.draw(x, ch, size, INK.sumi, { strokes: clamp(prog - before, 0, n) }); x.restore(); before += n; });
    // 副題
    if (t > 2.4) {
      x.globalAlpha = clamp((t - 2.4) * 1.5, 0, 1);
      x.fillStyle = INK.usuzumi; x.font = '600 ' + Math.round(size * 0.22) + 'px ' + FONT; x.textAlign = 'center';
      const sub = 'ことだま絵巻'; [...sub].forEach((ch, i) => x.fillText(ch, tx - size * 0.45, ty + size * 0.6 + i * size * 0.26));
      // 落款
      x.fillStyle = INK.shu; const s = size * 0.42; x.fillRect(tx + size * 0.28, ty + size * 5.05, s, s);
      x.save(); x.translate(tx + size * 0.28 + s * 0.06, ty + size * 5.05 + s * 0.06); Brush.draw(x, '雫', s * 0.88, '#f6f1e2', { bleed: false }); x.restore();
      x.globalAlpha = 1;
    }
    // 人（しずくの頭）
    const hx = W_ * 0.24, hy = H_ * 0.56 + Math.sin(t * 1.6) * 2;
    drawHeroFigure(x, hx, hy, Math.min(W_, H_) * 0.13, { phase: 0, walk: false, bob: 0 });
    x.fillStyle = 'rgba(40,30,10,.12)'; x.beginPath(); x.ellipse(hx, hy, Math.min(W_, H_) * 0.05, 4, 0, 0, TAU); x.fill();
  },
};

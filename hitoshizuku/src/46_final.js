// ---------------------------------------------------------------------------
// 終の巻「名」：絵師の部屋。思い出を返し、絵巻に名をつける。
//   名のさいごの一画をひくのは、ひとしずく（主人公）自身。
//   そのあと、旅してきた場面の「写し」をつないだ絵巻が、あなたの絵巻として流れる。
// glyphs:序野終題雫名おしまいまたひとしずく
// ---------------------------------------------------------------------------
const MEMK = ['母', '父', '師', '友', '別', '夢'];
const MEMLINE = {
  母: ['……花の名を、たくさん教えてくれた', '……母じゃ'],
  父: ['……大きな手で、だまって頭をなでてくれた', '……父じゃ'],
  師: ['……名を書くとは、もう一度生むことじゃと', '……教えてくれた、師じゃ'],
  友: ['……わしの絵を、好きだと言うてくれた', '……友じゃ'],
  別: ['……さよならを、言えなんだ', '……あの夜の、別れじゃ'],
  夢: ['……竜の背で、雲をこえる', '……わしの、夢じゃ'],
};
// 絵巻の名を聞いた絵師のことば
function nameLine(k) {
  const d = KDEF[k] || {};
  const S = {
    母: ['……母、か', 'そうじゃな。花の名を教えてくれた、あの人の絵巻じゃ'],
    父: ['……父、か', 'だまって頭をなでてくれた、あの手の絵巻じゃ'],
    師: ['……師、か', '名を書くとは、もう一度生むこと。……ほんとうじゃった'],
    友: ['……友、か', 'あいつに、見せてやりたかったのう'],
    別: ['……別れ、か', 'さよならを、言えなんだ。……これが、わしのさよならじゃ'],
    夢: ['……夢、か', 'そうじゃ。これは、わしの夢の絵巻じゃ'],
    人: ['……人、か', 'ひとしずくの、おまえの字じゃな'],
    雫: ['……雫、か', 'ひとしずく。……おまえの名じゃ'],
    心: ['……心、か', '名を忘れても、心は忘れん。……ええ名じゃ'],
    名: ['……名、か', 'はは。名のない絵巻に「名」とつけるか。おまえらしい'],
    翁: ['……翁、か', 'わしの絵巻、か。てれるのう'],
    忘: ['……忘れる、か', 'そうじゃな。忘れても、ええ。この絵巻が、おぼえておってくれる'],
    一: ['……一、か', 'はじまりの、一本の線。……ええ名じゃ'],
    愛: ['……愛、か', 'てれるが……そのとおりじゃ'],
    好: ['……好き、か', 'ああ。好きなものを、ぜんぶ描いたんじゃった'],
    思: ['……思い、か', '思い出の絵巻。そのとおりじゃ'],
    生: ['……生きる、か', '生きた。ぜんぶ、ここに描いた'],
    花: ['……花、か', '母が、いちばん好きな字じゃった'],
    竜: ['……竜、か', '子どものころの夢が、名になったのう'],
    月: ['……月、か', 'あの夜も、月が出ておった'],
    空: ['……空、か', 'どこまでも、ひろい名じゃ'],
    川: ['……川、か', '父と、舟を出した川じゃ'],
    山: ['……山、か', '師のもとへ通うた、あの山じゃ'],
    里: ['……里、か', '友と走りまわった、あの里じゃ'],
    夜: ['……夜、か', '別れの夜も、ほたるの夜も。……ええ名じゃ'],
    光: ['……光、か', 'まぶしいのう。ええ名じゃ'],
    春: ['……春、か', 'なにもかも、はじまる名じゃ'],
    笑: ['……笑う、か', 'そうじゃな。笑うて、おしまいにしよう'],
    泣: ['……泣く、か', '……そうじゃな。少しだけ、泣いてもええかのう'],
  };
  if (S[k]) return S[k];
  const head = '……' + (d.imi || k) + '、か';
  const tail = {
    shizen: '空も、水も、山も。……ええ名じゃ', kusaki: '草木の、やさしい名じゃのう', ikimono: '生きものの、にぎやかな絵巻じゃな',
    mono: '人の手のぬくもりのある、ええ名じゃ', kokoro: '心の絵巻、か。……ええ名じゃ', ugoki: '止まらずに、動いていく絵巻じゃな', yousu: 'この絵巻の、ありさまそのものじゃ',
  }[d.cat] || 'ええ名じゃ。ほんとうに、ええ名じゃ';
  return [head, tail];
}
// 思い出の座（絵師のまわりに六つ）
function painterSlot(f, i) { const col = i % 2, row = i >> 1; return [f.x + (col ? f.w - 0.7 : 0.7), f.y + 1.3 + row * 2.6]; }

// ---- 薄れた絵師（思い出がもどるほど、こくなる）----
function drawPainterFaded(ctx, f, sx, sy, W_, H_, t) {
  const TS = R.TS, got = f.got ? Object.keys(f.got).length : 0, night = PAL === PAL_NIGHT;
  const g = Final.gather;
  ctx.save();
  const [cx, cy] = w2s(f.x + f.w / 2, f.y + f.h / 2);
  ctx.globalAlpha = Math.min(0.85, 0.11 + got * 0.075 + Math.sin(t * 1.3) * 0.02 + (f.hintT > 0 ? 0.15 : 0) + (g ? clamp((W.time - g.t0) / 1.4, 0, 1) * 0.35 : 0));
  for (let i = 0; i < 2; i++) { ctx.save(); ctx.translate(Math.sin(t * .7 + i * 2) * 2.5, Math.cos(t * .6 + i) * 2.5); drawGlyphAt(ctx, '翁', cx, cy, 7.5, night ? '#c8b080' : '#6a6258'); ctx.restore(); }
  ctx.globalAlpha = 1;
  MEMK.forEach((k, i) => {
    let [px, py] = painterSlot(f, i);
    const have = f.got && f.got[k];
    if (g && have) { const u = easeInOut(clamp((W.time - g.t0) / 1.4, 0, 1)); px = lerp(px, f.x + f.w / 2, u); py = lerp(py, f.y + f.h / 2, u); if (u >= 1) return; }
    const [qx, qy] = w2s(px, py);
    const col = inkCol(KDEF[k].col);
    ctx.save();
    if (have) {
      const gl = ctx.createRadialGradient(qx, qy, 0, qx, qy, TS * 0.95); gl.addColorStop(0, 'rgba(255,228,160,.55)'); gl.addColorStop(1, 'rgba(255,228,160,0)');
      ctx.fillStyle = gl; ctx.fillRect(qx - TS, qy - TS, TS * 2, TS * 2);
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(qx, qy, TS * 0.52, 0, TAU); ctx.stroke();
      drawGlyphAt(ctx, k, qx, qy, 0.78, col);
    } else {
      ctx.strokeStyle = 'rgba(196,56,31,.5)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -t * 6;
      ctx.beginPath(); ctx.arc(qx, qy, TS * 0.52, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 0.3 + 0.1 * Math.sin(t * 2 + i) + (f.hintT > 0 ? 0.3 : 0);
      drawGlyphAt(ctx, k, qx, qy, 0.72, night ? '#c8b080' : '#8a8070', { variant: 'faded' });
    }
    ctx.restore();
  });
  ctx.restore();
}

// ---- 名を書く紙（題簽）----
function drawTitleStrip(ctx, f, sx, sy, W_, H_, t) {
  if (f.hidden) return;
  const TS = R.TS, F = Final;
  const ap = clamp((W.time - (f.shownAt || 0)) / 1.2, 0, 1);
  ctx.save();
  ctx.globalAlpha = ap;
  // 紐と軸
  ctx.strokeStyle = 'rgba(60,40,20,.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(sx + W_ * 0.2, sy - TS * 0.05); ctx.lineTo(sx + W_ / 2, sy - TS * 0.75); ctx.lineTo(sx + W_ * 0.8, sy - TS * 0.05); ctx.stroke();
  ctx.fillStyle = 'rgba(40,30,10,.18)'; ctx.fillRect(sx + 6, sy + 7, W_ - 4, H_ - 2);
  ctx.fillStyle = '#26314f'; ctx.fillRect(sx + 1, sy, W_ - 2, H_);
  ctx.strokeStyle = 'rgba(176,131,42,.8)'; ctx.lineWidth = 1; ctx.strokeRect(sx + 3.5, sy + 3.5, W_ - 7, H_ - 7);
  const m = TS * 0.24;
  ctx.fillStyle = '#f8f2e0'; ctx.fillRect(sx + m, sy + m * 1.6, W_ - m * 2, H_ - m * 3.2);
  ctx.fillStyle = '#5a3d22';
  ctx.fillRect(sx - TS * 0.1, sy - TS * 0.1, W_ + TS * 0.2, TS * 0.16);
  ctx.fillRect(sx - TS * 0.2, sy + H_ - TS * 0.06, W_ + TS * 0.4, TS * 0.2);
  ctx.fillStyle = '#2b1d10'; ctx.fillRect(sx - TS * 0.28, sy + H_ - TS * 0.08, TS * 0.12, TS * 0.24); ctx.fillRect(sx + W_ + TS * 0.16, sy + H_ - TS * 0.08, TS * 0.12, TS * 0.24);
  // 名
  const shown = F.writing ? F.writing.k : F.name;
  if (!shown) {
    // まだ名がない：書く所が、ほんのり呼んでいる
    const pulse = 0.35 + 0.25 * Math.sin(t * 2.4);
    ctx.strokeStyle = 'rgba(196,56,31,' + pulse + ')'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 12;
    ctx.strokeRect(sx + m * 1.6, sy + m * 2.6, W_ - m * 3.2, H_ - m * 5.2); ctx.setLineDash([]);
  } else {
    const L = F.layout(shown, f);
    const total = L.reduce((a, c) => a + Brush.strokeCount(c.ch), 0);
    let upto;
    if (F.writing) upto = clamp((W.time - F.writing.t0) / F.writing.dur, 0, 1) * (total - 1);
    else if (F.stage >= 3 && F.leap && F.leap.from) upto = total - 1 + F.lastK;
    else if (F.stage >= 4) upto = total;
    else upto = total - 1;
    const col = PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi;
    let before = 0;
    for (const c of L) {
      const n = Brush.strokeCount(c.ch);
      const [px, py] = w2s(c.x, c.y);
      ctx.save(); ctx.translate(px, py);
      Brush.draw(ctx, c.ch, c.s * TS, col, { strokes: clamp(upto - before, 0, n) });
      ctx.restore();
      before += n;
    }
    // 足りない一画のおもかげ
    const last = L[L.length - 1], g = Brush.get(last.ch);
    if (g && upto < total - 0.001 && !F.writing) {
      const st = g.strokes[g.n - 1];
      const [px, py] = w2s(last.x, last.y);
      ctx.save(); ctx.translate(px, py); ctx.scale(last.s * TS / 109, last.s * TS / 109);
      ctx.globalAlpha = ap * (0.18 + 0.12 * Math.sin(t * 3)); ctx.fillStyle = INK.shu;
      Brush.drawStroke(ctx, st.p, st.pr, st.kind, Brush.baseWidth(g.n), 5, undefined, false);
      ctx.restore();
    }
    // 書いている筆先
    if (F.writing) {
      const p = F.tipAt(L, upto);
      if (p) { const [bx, by] = w2s(p[0], p[1]); ctx.strokeStyle = INK.sumi; ctx.lineWidth = Math.max(2, TS * 0.08); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + TS * 0.5, by - TS * 1.1); ctx.stroke(); ctx.fillStyle = INK.shu; ctx.fillRect(bx + TS * 0.42, by - TS * 1.25, TS * 0.16, TS * 0.2); }
    }
    // できあがりの光
    if (F.shineT && W.time - F.shineT < 3) {
      const k = 1 - (W.time - F.shineT) / 3;
      const [gx, gy] = w2s(f.x + f.w / 2, f.y + f.h / 2);
      const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, TS * 3.5); gr.addColorStop(0, 'rgba(255,225,150,' + (0.5 * k) + ')'); gr.addColorStop(1, 'rgba(255,225,150,0)');
      ctx.fillStyle = gr; ctx.fillRect(gx - TS * 4, gy - TS * 4, TS * 8, TS * 8);
    }
    // 落款「雫」
    if (F.sealT) {
      const k = clamp((W.time - F.sealT) / 0.25, 0, 1), sc = lerp(1.7, 1, easeInOut(k));
      const s = TS * 0.62, qx = sx + m * 1.2, qy = sy + H_ - m * 1.7 - s;
      ctx.save(); ctx.globalAlpha = ap * k; ctx.translate(qx + s / 2, qy + s / 2); ctx.rotate(-0.06); ctx.scale(sc, sc);
      ctx.fillStyle = INK.shu; ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.translate(-s * 0.44, -s * 0.44); Brush.draw(ctx, '雫', s * 0.88, '#f6f1e2', { bleed: false });
      ctx.restore();
    }
  }
  ctx.restore();
}

const Final = {
  stage: 0, name: null, names: [], lock: false, writing: null, leap: null, lastK: 0, gather: null, sealT: 0, shineT: 0, askHero: 0, ended: false, dawnT: 0,
  enter() {
    Object.assign(this, { stage: 0, name: null, names: [], lock: false, writing: null, leap: null, lastK: 0, gather: null, sealT: 0, shineT: 0, askHero: 0, ended: false, dawnT: 0 });
    if (W.hero) W.hero.hidden = false;
    later(4.5, () => { if (!this.restored('灯') && Scene.cur && Scene.cur.final) this.gift('灯', null, 4, 11); });
  },
  painter() { return W.faded.find(f => f.painter); },
  strip() { return W.faded.find(f => f.title); },
  restored(k) { return W.faded.some(f => f.k === k && f.restored && !f.painter && !f.title); },
  gift(k, lines, tx, ty) {
    if (!Scene.cur || !Scene.cur.final) return;
    if (Game.known.includes(k)) { if (lines) Voice.say(lines, { who: 'painter' }); Tutor.point(k, tx, ty, { until: 10 }); }
    else Game.gift(k, lines, () => Tutor.point(k, tx, ty, { until: 10 }));
  },
  favorite() {
    const u = Game.useN || {}; let best = null, bn = 0;
    for (const k of Game.known) if ((u[k] || 0) > bn && KDEF[k] && !KDEF[k].story) { bn = u[k]; best = k; }
    return best || (Game.known.includes('人') ? '人' : Game.known[0]);
  },
  // 名の字の置き方（縦にならべる）
  layout(name, f) {
    const chars = [...name], n = chars.length;
    const s = Math.min(f.w - 0.9, (f.h - 1.6) / n) * 0.96;
    const x0 = f.x + (f.w - s) / 2, y0 = f.y + (f.h - s * n) / 2;
    return chars.map((ch, i) => ({ ch, x: x0, y: y0 + i * s, s }));
  },
  // 書きかけ upto 画目の筆先（絵巻の座標）
  tipAt(L, upto) {
    let before = 0;
    for (const c of L) {
      const g = Brush.get(c.ch); const n = g ? g.n : 1;
      if (upto <= before + n || c === L[L.length - 1]) {
        if (!g) return [c.x + c.s / 2, c.y + c.s / 2];
        const u = clamp(upto - before, 0, n - 0.0001), i = Math.floor(u), fr = u - i;
        const p = g.strokes[Math.min(i, n - 1)].p, N = p.length / 2, j = Math.min(N - 1, Math.floor(fr * (N - 1)));
        return [c.x + p[2 * j] / 109 * c.s, c.y + p[2 * j + 1] / 109 * c.s];
      }
      before += n;
    }
    return null;
  },
  lastPoint(k) {
    const f = this.strip(); const L = this.layout(this.name, f); const c = L[L.length - 1]; const g = Brush.get(c.ch);
    if (!g) return [c.x + c.s / 2, c.y + c.s / 2];
    const p = g.strokes[g.n - 1].p, N = p.length / 2, j = Math.min(N - 1, Math.floor(clamp(k, 0, 1) * (N - 1)));
    return [c.x + p[2 * j] / 109 * c.s, c.y + p[2 * j + 1] / 109 * c.s];
  },
  // ---- 思い出を返す ----
  planMemory(k, fd) {
    if (fd.restored || this.gather) return null;
    if (k === '心' && !MEMK.every(m => fd.got && fd.got[m])) return { kind: 'memory', faded: fd, cost: 0, heart: true, msg: '心をこめる' };
    if (!MEMK.includes(k)) return null;
    if (fd.got && fd.got[k]) return { kind: 'noeffect', cost: 0, msg: 'もう思い出した' };
    return { kind: 'memory', faded: fd, cost: 0, msg: '思い出を返す' };
  },
  giveMemory(k, f, heart) {
    f.got = f.got || {};
    const ks = heart ? MEMK.filter(m => !f.got[m]) : [k];
    if (!ks.length) return;
    for (const m of ks) { f.got[m] = 1; const [px, py] = painterSlot(f, MEMK.indexOf(m)); Fx.sparkle(px, py, inkCol(KDEF[m].col), 14); }
    Sfx.restore(); Tutor.stop();
    if (heart) { Voice.say(['……心が、おぼえておった', '母も、父も、師も、友も', '……別れも、夢も'], { who: 'painter', replace: true }); Bus.emit('painterHeart', {}); }
    else { Voice.say(MEMLINE[k], { who: 'painter', replace: true }); Bus.emit('memoryBack', { k }); }
    if (MEMK.every(m => f.got[m])) later(heart ? 3.2 : 4.4, () => this.wake(f));
  },
  wake(f) {
    if (!Scene.cur || !Scene.cur.final || f.restored || this.gather) return;
    this.gather = { t0: W.time };
    Sfx.restore();
    later(1.5, () => {
      this.gather = null;
      f.restored = true;
      const e = newEnt('翁', f.x + 1, f.y, { instant: true, w: 8, h: 8 });
      if (e) { e.pinned = true; e.restoredFrom = true; e.spawnT = 0.9; e.sid = 'painter'; }
      Fx.restore(f.x + f.w / 2, f.y + f.h / 2, f.w, f.h, INK.sumi);
      Game.colors++; Bus.emit('restore', { k: '翁', with: 'memory', f });
      R.cam.shake = 0.25;
      Voice.say(['……そうじゃ。わしは、絵師じゃ', '花の名を教わり、頭をなでられ、名を書くことを習うた', '絵を好きだと言われ、別れを知り、夢を見た', '……それが、わしじゃ'], { who: 'painter', replace: true });
      this.stage = 1;
      const r = heroPath(16, 11); if (r.reached && W.hero) { W.hero.hero.path = r.path; W.hero.hero.goal = { x: 16, y: 11 }; }
      later(11, () => this.askName());
    });
  },
  askName() {
    const fs = this.strip(); if (!fs || !fs.hidden) return;
    fs.hidden = false; fs.shownAt = W.time;
    Fx.sparkle(fs.x + fs.w / 2, fs.y + fs.h / 2, INK.kin, 24); Sfx.chime();
    Voice.say(['……ありがとう。おまえが、ひとつずつ、返してくれたんじゃな', '……この絵巻には、まだ、名がない', 'おまえが、つけてくれんか', '好きな字を、ひとつ'], { who: 'painter', replace: true });
    const fav = this.favorite();
    later(10, () => { if (this.stage === 1 && !this.writing && !this.name) Tutor.point(fav, fs.x + 1, fs.y + 3, { until: 14 }); });
  },
  // ---- 名をつける ----
  planTitle(k, fd) {
    if (this.stage < 1 || this.lock || this.writing) return { kind: 'noeffect', cost: 0, msg: '……' };
    return { kind: 'title', faded: fd, cost: 0, msg: this.name ? '名を書きなおす' : 'この絵巻の名にする' };
  },
  beginTitle(k) {
    const n = [...k].reduce((a, c) => a + Brush.strokeCount(c), 0);
    this.writing = { k, t0: W.time, dur: clamp(0.32 * n, 1.4, 4.2) };
    Tutor.stop(); Sfx.write(n);
    if (this.name) Voice.say('……こっちかの', { who: 'painter' });
  },
  setTitle(k) {
    const again = !!this.name;
    this.name = k; this.stage = 2; this.names.push(k); this.askHero = 0;
    Bus.emit('title', { k });
    const fs = this.strip(); Fx.inkBleed(fs.x + fs.w / 2, fs.y + fs.h / 2, 8);
    const tail = again ? ['……やはり、墨が、たりん', 'あと、ひとしずく……'] : ['……おや', '……墨が、たりん', 'さいごの一画が、書けん', '……あと、ひとしずく……'];
    Voice.say(nameLine(k).concat(tail), { who: 'painter', replace: true });
    later(again ? 6.5 : 10, () => {
      if (this.stage !== 2 || this.name !== k) return;
      this.askHero = W.time;
      Voice.say(['……ひとしずく', 'おまえが、さいごの一画に、なってくれるか'], { who: 'painter', replace: true });
    });
  },
  // ---- さいごの一画 ----
  onTap(tx, ty) {
    if (this.lock) return true;
    if (this.stage !== 2 || this.writing) return false;
    const h = W.hero, fs = this.strip();
    const onHero = Math.abs(tx - h.x) <= 1 && ty >= h.y - 1 && ty <= h.y + 1;
    const onStrip = tx >= fs.x && tx < fs.x + fs.w && ty >= fs.y && ty < fs.y + fs.h;
    if (onHero || onStrip) { this.leapGo(); return true; }
    return false;
  },
  leapGo() {
    this.stage = 3; this.lock = true; Tutor.stop();
    const h = W.hero, hb = h.hero;
    if (hb.ride) heroDismount(true);
    hb.path = []; hb.goal = null; hb.vehGoal = null; hb.face = 1;
    heroBow();
    Voice.say(['……ありがとう', '……ひとしずく'], { who: 'painter', replace: true });
    Bus.emit('lastStroke', { k: this.name });
    this.leap = { t0: W.time + 1.8, from: null, pos: null };
  },
  tick() {
    const h = W.hero; if (!h) return;
    const fp = this.painter();
    // 灯がともると、部屋が見える
    if (!Scene.flag('lamp') && this.restored('灯')) { Scene.setFlag('lamp'); W.darkBase = 0.1; W.dark = Math.min(W.dark, 0.1); Fx.sunRise(); }
    // 机の上の、硯と筆
    if (!Scene.flag('gSuzuri') && h.x >= 8) { Scene.setFlag('gSuzuri'); later(0.8, () => this.gift('硯', ['……これは、硯じゃ', '毎朝、ここで墨をすった'], 11, 11)); }
    if (!Scene.flag('gFude') && this.restored('硯')) { Scene.setFlag('gFude'); later(1.6, () => this.gift('筆', ['……筆じゃ', '……おまえは、この筆から、落ちてきたんじゃな'], 13, 11)); }
    if (!Scene.flag('meet') && fp && !fp.restored && (this.restored('筆') || h.x >= 17)) {
      Scene.setFlag('meet');
      later(1.8, () => {
        Voice.say(['……そこに、だれか、おる', '……わしか', 'わしは……だれじゃったかのう', '……思い出を、返してくれんか'], { who: 'painter' });
        later(9, () => { const k = MEMK.find(m => !(fp.got && fp.got[m])); if (k && !fp.restored && !this.gather && Game.known.includes(k)) { const [px, py] = painterSlot(fp, MEMK.indexOf(k)); Tutor.point(k, Math.floor(px), Math.floor(py), { until: 10 }); } });
      });
    }
    // 名を書いている
    if (this.writing && W.time - this.writing.t0 >= this.writing.dur) { const k = this.writing.k; this.writing = null; this.setTitle(k); }
    // 跳ぶ・さいごの一画
    const L = this.leap;
    if (L && !L.done) {
      const T = W.time - L.t0;
      if (T >= 0 && !L.from) { L.from = [h.x + 0.5, h.y + 0.3]; L.to = this.lastPoint(0); h.hidden = true; Sfx.hop(); Fx.splash(h.x + .5, h.y + 1, 8); }
      if (L.from) {
        if (T < 1.1) { const u = easeInOut(T / 1.1); L.pos = [lerp(L.from[0], L.to[0], u), lerp(L.from[1], L.to[1], u) - Math.sin(u * Math.PI) * 3.2]; }
        else {
          if (!L.stroking) { L.stroking = true; Sfx.stroke(0.9); Fx.inkBleed(L.to[0], L.to[1], 6); }
          this.lastK = clamp((T - 1.1) / 1.6, 0, 1); L.pos = this.lastPoint(this.lastK);
          if (W.tick % 3 === 0) Fx.sparkle(L.pos[0], L.pos[1], INK.kin, 2);
          if (this.lastK >= 1) { L.done = true; L.pos = null; this.finish(); }
        }
      }
    }
    // 目は、絵師と名のほうへ
    const fs = this.strip();
    if (this.stage >= 3 && fs) R.cam.focus = { x: fs.x + fs.w / 2 - 1, y: fs.y + fs.h / 2 + 0.5 };
    else if (this.stage >= 1 && fs) R.cam.focus = { x: (h.rx + 0.5 + fs.x + fs.w / 2) / 2, y: 7.6 };
    if (this.dawnT) W.dawnK = clamp((W.time - this.dawnT) / 4, 0, 1);
  },
  finish() {
    this.stage = 4;
    const fs = this.strip();
    Fx.sparkle(fs.x + fs.w / 2, fs.y + fs.h / 2, INK.kin, 40); Sfx.restore(); R.cam.shake = 0.2;
    this.shineT = W.time;
    later(1.0, () => { this.sealT = W.time; Sfx.stamp(); });
    later(2.2, () => Voice.say(['……ありがとう、ひとしずく', '名を呼ぶと、ものは、そこにおる', 'わしが、また忘れても……', 'この絵巻が、おぼえておってくれる'], { who: 'painter', replace: true }));
    later(4.2, () => { W.darkBase = 0; W.dark = 0; W.night = false; Fx.dawn(); Music.motif('end'); this.dawnT = W.time; });
    later(12, () => Game.gift('名', ['……この字は、おまえに', '名を呼べば、いつでも、そこにおる']));
    later(18, () => this.toEnding());
  },
  toEnding() {
    if (this.ended || !Scene.cur || !Scene.cur.final) return;
    this.ended = true;
    const def = Scene.cur;
    for (const a of def.stamps || []) {
      let ok = false; try { ok = a.test(W.events, W); } catch (e) { reportError(e); }
      if (ok) (Game.stamps[def.id] || (Game.stamps[def.id] = {}))[a.id] = 1;
    }
    for (const f of W.faded) if (f.restored) Game.restored[f.key] = 1;
    Game.cleared[def.id] = 1; Game.finalWord = this.name; Game.story.ended = true;
    Game.save();
    Snap.take(def.id);
    Bus.emit('clear', { id: def.id, first: true, stamps: [] });
    Ending.play();
  },
  // ---- 絵の上に描く（跳ぶしずく・呼んでいる光）----
  render(ctx) {
    const TS = R.TS, t = R.t, h = W.hero;
    if (this.stage === 2 && !this.writing && h && !h.hidden) {
      const [sx, sy] = w2s(h.rx + 0.5, h.ry + 0.45);
      const k = this.askHero ? 1 : 0.45;
      const r = TS * (0.75 + 0.12 * Math.sin(t * 4));
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.6); g.addColorStop(0, 'rgba(255,225,140,' + (0.42 * k) + ')'); g.addColorStop(1, 'rgba(255,225,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * 1.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(176,131,42,' + (0.75 * k) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.stroke();
      if (this.askHero) {
        const by = sy - TS * 1.45 + Math.sin(t * 5) * TS * 0.12;
        ctx.fillStyle = INK.shu; ctx.beginPath(); ctx.moveTo(sx, by + TS * 0.32); ctx.lineTo(sx - TS * 0.2, by); ctx.lineTo(sx + TS * 0.2, by); ctx.closePath(); ctx.fill();
      }
    }
    const L = this.leap;
    if (L && L.pos) {
      const [sx, sy] = w2s(L.pos[0], L.pos[1]);
      const r = TS * 0.17;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, TS * 0.9); g.addColorStop(0, 'rgba(255,225,140,.55)'); g.addColorStop(1, 'rgba(255,225,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, TS * 0.9, 0, TAU); ctx.fill();
      ctx.fillStyle = PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi;
      ctx.beginPath(); ctx.moveTo(sx, sy - r * 1.9);
      ctx.bezierCurveTo(sx + r * .4, sy - r, sx + r * 1.05, sy - r * .25, sx + r, sy + r * .15);
      ctx.arc(sx, sy + r * .1, r, 0.05, Math.PI - 0.05);
      ctx.bezierCurveTo(sx - r * 1.05, sy - r * .25, sx - r * .4, sy - r, sx, sy - r * 1.9); ctx.fill();
    }
  },
};

// ---- 絵師の部屋の壁（丸窓に月、夜が明けると朝の色）----
function renderRoomBackdrop(ctx) {
  const TS = R.TS, k = W.dawnK || 0;
  // 長押（なげし）
  const [, ly] = w2s(0, 2.2);
  ctx.fillStyle = 'rgba(90,64,36,.18)'; ctx.fillRect(0, ly, R.vw, TS * 0.18);
  // 丸窓
  const [cx, cy] = w2s(5.5, 5.2), r = TS * 2.3;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
  const sky = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sky.addColorStop(0, mixHex('#1d2540', '#f2c9a0', k)); sky.addColorStop(1, mixHex('#2c3658', '#f8e6c8', k));
  ctx.fillStyle = sky; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // 月（夜明けには薄れる）
  ctx.globalAlpha = 1 - k * 0.85;
  ctx.fillStyle = '#efe2b0'; ctx.beginPath(); ctx.arc(cx + r * 0.32, cy - r * 0.3, TS * 0.55, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  // 朝日
  if (k > 0) { ctx.globalAlpha = k; ctx.fillStyle = 'rgba(200,56,30,.85)'; ctx.beginPath(); ctx.arc(cx - r * 0.35, cy + r * 0.55 - k * r * 0.25, TS * 0.6, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  // 遠い山
  ctx.fillStyle = k > 0.5 ? 'rgba(120,100,90,.35)' : 'rgba(10,14,30,.45)';
  ctx.beginPath(); ctx.moveTo(cx - r, cy + r); for (let i = 0; i <= 12; i++) { const u = i / 12; ctx.lineTo(cx - r + u * r * 2, cy + r * 0.45 - Math.sin(u * 5.1 + 1) * r * 0.12 - Math.sin(u * 11) * r * 0.05); } ctx.lineTo(cx + r, cy + r); ctx.fill();
  // 格子
  ctx.strokeStyle = 'rgba(70,48,26,.75)'; ctx.lineWidth = Math.max(1.5, TS * 0.05);
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * r * 0.42, cy - r); ctx.lineTo(cx + i * r * 0.42, cy + r); ctx.stroke(); }
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(cx - r, cy + i * r * 0.62); ctx.lineTo(cx + r, cy + i * r * 0.62); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(70,48,26,.85)'; ctx.lineWidth = Math.max(3, TS * 0.12);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
}

SCENES.push({
  id: 'e1', chapter: 7, no: '', title: '名', music: 'end', final: true, exitX: 999, night: true, dark: 0.5,
  theme: { seed: 81, hills: 0.12, sun: false, room: true },
  start: { x: 1, y: 11 },
  map: B(34, 15, [['#', 0, 12, 7, 14], ['=', 8, 12, 33, 12], ['#', 8, 13, 33, 14]]),
  ents: [],
  faded: [
    { k: '灯', x: 4, y: 11, memory: '……ああ。あたたかい', hint: '……暗いのう。たしか、ここに灯りが……' },
    { k: '硯', x: 11, y: 11, hint: '……毎朝、これで墨をすった……' },
    { k: '筆', x: 13, y: 11, hint: '……わしの、いちばんの友じゃ……' },
    { k: '翁', x: 18, y: 4, w: 10, h: 8, painter: true, always: true, story: true, draw: drawPainterFaded, hint: '……思い出を、返してくれんか。母、父、師、友、別れ、夢……' },
    { k: '名', x: 13, y: 3, w: 3, h: 7, title: true, always: true, hidden: true, draw: drawTitleStrip, hint: '……好きな字を、ひとつ' },
  ],
  voice: {
    enter: ['……ここは', '……わしの、部屋じゃ', '暗いのう。……灯りが、あったはずじゃが'],
    hints: ['灯りを、ともしてごらん', '机の上の物に、名を返してごらん', '思い出を、ひとつずつ、わしに返してくれんか。母、父、師、友、別れ、夢', '好きな字を、ひとつ。それが、この絵巻の名じゃ', '……ひとしずく。おまえ自身を、さわってごらん'],
  },
  stamps: [
    { id: 'name', name: '絵巻に名をつけた', test: L => has(L, 'title') },
    { id: 'all', name: '思い出をぜんぶ返した', test: L => L.filter(e => e.type === 'memoryBack').length >= 6 },
    { id: 'heart', name: '心で思い出させた', test: L => has(L, 'painterHeart') },
    { id: 'again', name: '名を書きなおした', test: L => L.filter(e => e.type === 'title').length >= 2 },
  ],
  onEnter() { Final.enter(); },
  onTick() { Final.tick(); },
  renderOver(ctx) { Final.render(ctx); },
});

// ---------------------------------------------------------------------------
// 場面の仕掛け：手ほどきの指・吹きつづける風・思い出の贈り物・白紙が描きもどる
// ---------------------------------------------------------------------------
// 手ほどき：字帳の字から、書く場所まで、指がすっと動いて見せる
const Tutor = {
  el: null, cur: null, t: 0,
  point(k, tx, ty, opt) {
    this.cur = { k, tx, ty, until: (opt && opt.until) || 12, done: false, self: opt && opt.self };
    this.t = 0;
    if (!this.el) {
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;left:0;top:0;width:44px;height:44px;z-index:44;pointer-events:none;display:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.3))';
      d.innerHTML = '<svg viewBox="0 0 48 48" width="44" height="44"><path d="M18 44c-3-4-9-11-11-14-1.6-2.4 1.6-4.6 3.6-2.8L16 32V9c0-2 1.6-3.2 3.2-3.2S22.4 7 22.4 9v12c0-1.8 1.4-3 3-3s3 1.2 3 3v1c0-1.8 1.4-3 3-3s3 1.2 3 3v2c0-1.6 1.4-2.8 3-2.8s3 1.2 3 3V33c0 5-3 9-6 11z" fill="#f6f1e2" stroke="#1c1a20" stroke-width="2.2" stroke-linejoin="round"/></svg>';
      document.body.append(d); this.el = d;
    }
  },
  // 字帳の字から字帳の字へ（字帳の中で合わせる）
  pointCell(k, k2, opt) { this.point(k, 0, 0, opt); this.cur.cell2 = k2; },
  stop() { if (this.cur) this.cur.done = true; this.cur = null; if (this.el) this.el.style.display = 'none'; },
  tick(dt) {
    const c = this.cur; if (!c || !this.el) return;
    this.t += dt;
    if (this.t > c.until) { this.stop(); return; }
    const cell = [...document.querySelectorAll('#grid .cell')].find(b => b.dataset.k === c.k);
    if (!cell || UI.drag || $('modal').classList.contains('on')) { this.el.style.display = 'none'; return; }
    const a = cell.getBoundingClientRect(); const st = $('stage').getBoundingClientRect();
    const [wx, wy] = w2s(c.tx + .5, c.ty + .5);
    const from = [a.left + a.width * .55, a.top + a.height * .5];
    let to = [st.left + wx, st.top + wy];
    if (c.cell2) {
      // 同じ字なら、少し上に出てから、もどってくる
      const b2 = [...document.querySelectorAll('#grid .cell')].find(b => b.dataset.k === c.cell2);
      if (!b2) { this.el.style.display = 'none'; return; }
      const r2 = b2.getBoundingClientRect(); to = [r2.left + r2.width * .5, r2.top + r2.height * .45];
      if (c.cell2 === c.k) { const cyc = (this.t % 2.4) / 2.4; const up = Math.sin(smooth(0.1, 0.85, cyc) * Math.PI) * 70; this.el.style.display = 'block'; this.el.style.opacity = '1'; this.el.style.transform = 'translate(' + (from[0] - 14 + up * .4) + 'px,' + (from[1] - 4 - up) + 'px)'; return; }
    }
    const cyc = (this.t % 2.4) / 2.4;
    const k = easeInOut(smooth(0.15, 0.8, cyc));
    const x = lerp(from[0], to[0], k), y = lerp(from[1], to[1], k) - Math.sin(k * Math.PI) * 40;
    this.el.style.display = 'block';
    this.el.style.opacity = String(cyc < 0.1 ? cyc * 10 : cyc > 0.9 ? (1 - cyc) * 10 : 1);
    this.el.style.transform = 'translate(' + (x - 14) + 'px,' + (y - 4) + 'px) scale(' + (cyc < 0.15 ? 0.9 : 1) + ')';
  },
};
Bus.on('write', ev => { if (Tutor.cur && ev.k === Tutor.cur.k) Tutor.stop(); });

// 白紙が描きもどる（思い出がよみがえると、道があらわれる）
function paintBack(cells, t, opt) {
  const list = cells.slice();
  let i = 0;
  const step = () => {
    if (!W) return;
    for (let n = 0; n < 3 && i < list.length; n++, i++) {
      const [x, y] = list[i];
      setT(x, y, t);
      if (chance(0.5)) Fx.inkBleed(x + .5, y + .5, 2);
    }
    Sfx.stroke(0.05);
    if (i < list.length) later(0.05, step);
    else if (opt && opt.done) opt.done();
  };
  step();
}
function rectCells(x0, y0, w, h) { const c = []; for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) c.push([x, y]); return c; }

// 思い出の贈り物：字が大きく書かれて、字帳へ
function giftKanji(k, lines, done) {
  if (lines) Voice.say(lines);
  const d = KDEF[k]; if (!d) return;
  const ov = document.createElement('canvas'); const S = 260, dpr = Math.min(2, window.devicePixelRatio || 1);
  ov.width = S * dpr; ov.height = S * dpr;
  ov.style.cssText = 'position:fixed;z-index:61;pointer-events:none;left:50%;top:38%;transform:translate(-50%,-50%);width:min(60vw,260px);height:min(60vw,260px)';
  document.body.append(ov);
  const x = ov.getContext('2d'); const n = strokesOf(k); const t0 = performance.now();
  Sfx.restore();
  (function f() {
    const sec = (performance.now() - t0) / 1000;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, S, S);
    const a = Math.min(1, sec * 2, Math.max(0, 3.4 - sec));
    x.globalAlpha = a;
    x.fillStyle = 'rgba(246,241,226,.95)'; x.beginPath(); x.arc(S / 2, S / 2, S * 0.48, 0, TAU); x.fill();
    x.strokeStyle = INK.kin; x.lineWidth = 3; x.stroke();
    const chars = [...k]; const each = S * 0.72 / chars.length; let before = 0;
    const prog = Math.min(n, sec * 3.2);
    chars.forEach((ch, i) => { const sc = Brush.strokeCount(ch); x.save(); x.translate(S * 0.14 + i * each, (S - each) / 2); Brush.draw(x, ch, each, INK[d.col] || INK.sumi, { strokes: clamp(prog - before, 0, sc) }); x.restore(); before += sc; });
    x.globalAlpha = 1;
    if (sec < 3.4) requestAnimationFrame(f); else { ov.remove(); Game.learn(k, 'gift'); if (done) done(); }
  })();
  Bus.emit('gift', { k });
};

// 毎刻みの場面の仕掛け
function sceneTick() {
  const def = Scene.cur; if (!def || !W) return;
  Scene.enterT += TICK;
  // 吹きつづける風（林・岩・壁のかげは吹かない）
  if (W.zones && W.tick % 3 === 0 && !(W.calmT > 0)) {
    for (const z of W.zones) {
      if (z.off) continue;
      for (const e of W.ents) {
        if (!e.alive || e.pinned || e.stopT > 0) continue;
        if (e.x + e.w - 1 < z.x0 || e.x > z.x1 || e.y + e.h - 1 < z.y0 || e.y > z.y1) continue;
        if (sheltered(e, z.dir)) continue;
        const resist = e.windResist();
        if (e.isHero && (e.hero.buff.heavy || e.hero.ride)) continue;
        if (resist > z.str) continue;
        if (moveEnt(e, z.dir, 0)) { if (e.isHero) { e.hero.windT = 0.6; if (W.tick % 30 === 0) e.talk(rpick(['うう、風が……', '押しもどされる……']), 1.4); } }
      }
      if (W.tick % 9 === 0) Fx.windLines(rnd() * (z.x1 - z.x0) + z.x0, z.y0 + rnd() * (z.y1 - z.y0), z.dir);
    }
  }
  if (W.calmT > 0) W.calmT -= TICK;
  if (W.sunOut > 0) { W.sunOut -= TICK; if (W.tick % 20 === 0) sunWarm(); }
  if (W.meltAll > 0) { W.meltAll -= TICK; if (W.tick % 6 === 0) meltSome(6); }
  if (W.waterStop > 0) W.waterStop -= TICK;
  if (W.stormT > 0) W.stormT -= TICK;
  // 近づくと話す
  for (const tk of def.talks || []) {
    if (tk.done && !tk.repeat) continue;
    const who = W.ents.find(e => e.alive && (tk.sid ? e.sid === tk.sid : e.k === tk.who));
    if (!who || !W.hero) continue;
    if (entDist(who, W.hero) <= (tk.near || 3)) {
      if (tk.cd > 0) { tk.cd -= TICK; continue; }
      tk.done = true; tk.cd = 8; tk.i = ((tk.i || 0) + 1);
      const line = Array.isArray(tk.lines) ? tk.lines[Math.min(tk.i - 1, tk.lines.length - 1)] : tk.lines;
      who.talk(typeof line === 'function' ? line(who) : line, 3.5);
      if (tk.then) tk.then(who);
    }
  }
  // 決まった時に声
  for (const v of def.cues || []) {
    if (v.done) continue;
    let ok = false; try { ok = v.when(W); } catch (e) { reportError(e); }
    if (ok) { v.done = true; if (v.say) Voice.say(v.say); if (v.tutor) Tutor.point(v.tutor.k, v.tutor.x, v.tutor.y, v.tutor); if (v.run) v.run(); }
  }
  if (def.onTick) { try { def.onTick(W); } catch (e) { reportError(e); } }
  Tutor.tick(TICK);
}
function sheltered(e, dir) {
  for (let yy = e.y; yy < e.y + e.h; yy++) {
    for (let k = 1; k <= 4; k++) {
      const xx = dir > 0 ? e.x - k : e.x + e.w - 1 + k;
      if (T_SOLID[tAt(xx, yy)]) return true;
      const o = occAt(xx, yy); if (o && o !== e && entSolid(o)) return true;
      if (entsAt(xx, yy, o => o !== e && (o.d.windbreak || o.d.wall || (o.d.kind === 'plant' && o.d.wood && o.h >= 2))).length) return true;
    }
  }
  return false;
}
// お日さまのあたたかさ：空の見える雪と氷が少しずつ溶ける
function sunWarm() {
  for (let n = 0; n < 4; n++) {
    const x = rndi(W.w);
    for (let y = 0; y < W.h; y++) {
      const t = tAt(x, y);
      if (t === T.SNOW || t === T.ICE) { setT(x, y, T.AIR); addWater(x, y, t === T.ICE ? WMAX : 3); Fx.steam(x + .5, y + .5, 1); break; }
      if (T_SOLID[t]) break;
    }
  }
}
function meltSome(n) {
  let k = 0;
  for (let i = 0; i < 400 && k < n; i++) {
    const x = rndi(W.w), y = rndi(W.h); const t = tAt(x, y);
    if (t === T.SNOW || t === T.ICE) { setT(x, y, T.AIR); addWater(x, y, t === T.ICE ? WMAX : 3); k++; }
  }
}


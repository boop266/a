// ---------------------------------------------------------------------------
// 画面の手ざわり：字帳・引っぱって書く・合わせる・墨つぼ・絵師の声・巻物
// ---------------------------------------------------------------------------
const UI = {
  tab: 'all', selected: null, drag: null, cellSize: 58, potPulseT: 0, potShakeT: 0, bubbleEnt: null, bubbleT: 0,
  pairs: [],                  // 三つ合わせの途中
  newSet: new Set(),
  portrait: true,
};
function potPointImpl() {
  const c = $('inkcv'), st = $('stage');
  const a = c.getBoundingClientRect(), b = st.getBoundingClientRect();
  return [a.left + a.width / 2 - b.left, a.top + a.height / 2 - b.top];
}
UI.potPoint = potPointImpl;
UI.potPulse = () => { UI.potPulseT = 0.35; Sfx.ink(); };

// ---- 字帳 ----
function trayLayout() {
  const grid = $('grid');
  UI.portrait = !window.matchMedia('(min-aspect-ratio: 11/10)').matches;
  const cs = UI.cellSize;
  if (UI.portrait) {
    const h = grid.clientHeight - 16;
    const rows = Math.max(2, Math.floor((h + 6) / (cs + 6)));
    grid.style.gridAutoFlow = 'column dense';
    grid.style.gridTemplateRows = 'repeat(' + rows + ',' + cs + 'px)';
    grid.style.gridTemplateColumns = '';
    grid.style.gridAutoColumns = cs + 'px';
    grid.style.overflowX = 'auto'; grid.style.overflowY = 'hidden'; grid.style.touchAction = 'pan-x';
  } else {
    grid.style.gridAutoFlow = 'row dense';
    grid.style.gridTemplateRows = '';
    grid.style.gridAutoColumns = '';
    grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(' + cs + 'px,1fr))';
    grid.style.overflowX = 'hidden'; grid.style.overflowY = 'auto'; grid.style.touchAction = 'pan-y';
  }
  for (const c of grid.querySelectorAll('.cell')) c.style.touchAction = UI.portrait ? 'pan-x' : 'pan-y';
}
function knownList() {
  const ks = Game.known.slice();
  const used = Game.usedAt;
  ks.sort((a, b) => (used[b] || 0) - (used[a] || 0) || Game.known.indexOf(b) - Game.known.indexOf(a));
  return ks;
}
function buildTabs() {
  const tabs = $('tabs'); tabs.innerHTML = '';
  const counts = {}; for (const k of Game.known) { const d = KDEF[k]; if (d) counts[d.cat] = (counts[d.cat] || 0) + 1; }
  for (const [id, name] of CATS) {
    if (id !== 'all' && !counts[id]) continue;
    const b = el('button', 'tab' + (UI.tab === id ? ' on' : ''));
    b.setAttribute('role', 'tab'); b.dataset.tab = id;
    b.append(document.createTextNode(name));
    const n = el('span', 'n', String(id === 'all' ? Game.known.length : counts[id]));
    b.append(n);
    b.onclick = () => { UI.tab = id; Sfx.page(); buildTray(); };
    tabs.append(b);
  }
}
function buildTray() {
  buildTabs();
  const grid = $('grid'); grid.innerHTML = '';
  const list = knownList().filter(k => UI.tab === 'all' || (KDEF[k] && KDEF[k].cat === UI.tab));
  // 三つ合わせの途中
  for (const p of UI.pairs) grid.append(makeCell(p.parts.join(''), { pair: p }));
  for (const k of list) grid.append(makeCell(k));
  if (!list.length && !UI.pairs.length) { const e = el('div', null, 'まだ字を知らない。世界のものに近づくと、名前をおぼえる。'); e.id = 'trayempty'; grid.append(e); }
  trayLayout();
  updateInk();
}
function makeCell(k, opt) {
  opt = opt || {};
  const d = KDEF[k];
  const b = el('button', 'cell');
  if (k.length > 1 && !opt.pair) b.classList.add('word');
  if (opt.pair) { b.classList.add('word'); b.style.borderStyle = 'dashed'; }
  b.dataset.k = k;
  b.setAttribute('aria-label', opt.pair ? k + '（合わせかけ）' : (d ? d.ch + '（' + d.yomi + '）' : k));
  const c = document.createElement('canvas');
  const cs = UI.cellSize * (k.length > 1 || opt.pair ? 2 : 1);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(cs * dpr); c.height = Math.round(UI.cellSize * dpr);
  b.append(c);
  queueGlyph(c, k, d ? d.col : 'sumi', !!opt.pair);
  if (!opt.pair && d) {
    const cost = el('span', 'cost', String(strokesOf(k)));
    b.append(cost);
    if (UI.newSet.has(k)) b.classList.add('newk');
    if (UI.selected === k) b.classList.add('sel');
    if (strokesOf(k) > Ink.max) b.classList.add('dim');
  }
  b.style.touchAction = UI.portrait ? 'pan-x' : 'pan-y';
  attachCellEvents(b, k, opt.pair);
  return b;
}
// 字の絵は少しずつ描く（いっぺんに描くと重い）
const glyphQ = [];
function queueGlyph(c, k, col, pair) { glyphQ.push({ c, k, col, pair }); if (glyphQ.length === 1) requestAnimationFrame(drainGlyphQ); }
function drainGlyphQ() {
  const t0 = performance.now();
  while (glyphQ.length && performance.now() - t0 < 10) {
    const { c, k, col, pair } = glyphQ.shift();
    if (!c.isConnected) continue;
    const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
    const chars = [...k], h = c.height, each = Math.min(h, c.width / chars.length) * 0.92;
    const color = INK[col] || INK.sumi;
    chars.forEach((ch, i) => {
      x.save();
      const ox = (c.width - each * chars.length * (pair ? 1.1 : 0.96)) / 2 + i * each * (pair ? 1.1 : 0.96);
      x.translate(ox, (h - each) / 2);
      Brush.draw(x, ch, each, pair ? INK.usuzumi : color);
      x.restore();
      if (pair && i < chars.length - 1) { x.fillStyle = INK.shu; x.font = '600 ' + Math.round(h * 0.3) + 'px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('＋', ox + each * 1.05, h / 2); }
    });
  }
  if (glyphQ.length) requestAnimationFrame(drainGlyphQ);
}
function attachCellEvents(b, k, pair) {
  let down = null, lp = null;
  b.addEventListener('pointerdown', ev => {
    if (ev.button > 0) return;
    AudioSys.init();
    down = { x: ev.clientX, y: ev.clientY, t: performance.now(), id: ev.pointerId };
    try { b.setPointerCapture(ev.pointerId); } catch (e) { }
    clearTimeout(lp);
    lp = setTimeout(() => { if (down && !UI.drag) { down = null; showCard(pair ? null : k); } }, 520);
  });
  b.addEventListener('pointermove', ev => {
    if (!down || ev.pointerId !== down.id) return;
    const dx = ev.clientX - down.x, dy = ev.clientY - down.y;
    if (!UI.drag) {
      // 字帳の向き：たて長なら上へ、横長なら左へ引っぱると「書く」
      const toward = UI.portrait ? (-dy > 10 && -dy > Math.abs(dx) * 0.8) : (-dx > 10 && -dx > Math.abs(dy) * 0.8);
      const anyBig = Math.hypot(dx, dy) > 14;
      if (toward || (anyBig && !UI.portrait && Math.abs(dx) > Math.abs(dy)) || (anyBig && UI.portrait && Math.abs(dy) > Math.abs(dx))) {
        clearTimeout(lp);
        try { b.setPointerCapture(ev.pointerId); } catch (e) { }
        startDrag(k, ev, pair);
      }
    }
    if (UI.drag) moveDrag(ev);
  });
  const end = ev => {
    clearTimeout(lp);
    if (UI.drag && down && ev.pointerId === down.id) { endDrag(ev); down = null; return; }
    if (down && ev.type === 'pointerup' && performance.now() - down.t < 500 && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) < 10) {
      if (pair) { UI.pairs = UI.pairs.filter(p => p !== pair); buildTray(); toast('合わせかけを、ほどいた'); }
      else selectKanji(k);
    }
    down = null;
  };
  b.addEventListener('pointerup', end);
  b.addEventListener('pointercancel', ev => { clearTimeout(lp); if (UI.drag) cancelDrag(); down = null; });
  b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectKanji(k); } });
}
function selectKanji(k) {
  UI.selected = UI.selected === k ? null : k;
  for (const c of $('grid').querySelectorAll('.cell')) c.classList.toggle('sel', c.dataset.k === UI.selected);
  if (UI.selected) { Sfx.tap(); toast((KDEF[k] ? KDEF[k].ch : k) + '：書きたい所をタップ'); UI.newSet.delete(k); }
}
// ---- 引っぱる ----
function startDrag(k, ev, pair) {
  UI.drag = { k, pair, overCell: null, plan: null, tx: 0, ty: 0 };
  UI.selected = null;
  const g = $('ghost'); const x = g.getContext('2d');
  x.clearRect(0, 0, g.width, g.height);
  const chars = [...k], d = KDEF[k];
  const each = g.width * 0.86 / chars.length;
  chars.forEach((ch, i) => { x.save(); x.translate(g.width * 0.07 + i * each, (g.height - each) / 2); Brush.draw(x, ch, each, pair ? INK.usuzumi : (d ? INK[d.col] : INK.sumi)); x.restore(); });
  g.classList.add('on');
  UI.newSet.delete(k);
  W && (W.slowmo = true);
  Sfx.stroke(0.05);
  moveDrag(ev);
}
function dragPoint(ev) { const touch = ev.pointerType === 'touch'; return [ev.clientX, ev.clientY - (touch ? 64 : 0)]; }
function moveDrag(ev) {
  const D = UI.drag; if (!D) return;
  const [px, py] = dragPoint(ev);
  const g = $('ghost'); g.style.transform = 'translate(' + (px - 38) + 'px,' + (py - 38) + 'px)';
  // 下にあるもの
  const elAt = document.elementFromPoint(ev.clientX, ev.clientY);
  const cell = elAt && elAt.closest && elAt.closest('.cell');
  for (const c of $('grid').querySelectorAll('.cell.hint')) c.classList.remove('hint');
  D.overCell = null; R.preview = null;
  if (!D.left && !(cell && cell.dataset.k === D.k)) D.left = true;
  if (cell && (cell.dataset.k !== D.k || D.left)) { cell.classList.add('hint'); D.overCell = cell.dataset.k; return; }
  const st = $('stage').getBoundingClientRect();
  if (px >= st.left && px <= st.right && py >= st.top && py <= st.bottom && W && !D.pair) {
    const [tx, ty] = s2cell(px - st.left, py - st.top);
    D.tx = tx; D.ty = ty;
    D.plan = planWrite(D.k, tx, ty);
    R.preview = { k: D.k, tx, ty, plan: D.plan };
    // 端に寄せたら絵巻を動かす
    const ex = px - st.left;
    if (ex < 40) R.cam.panX -= 0.15; else if (ex > st.width - 40) R.cam.panX += 0.15;
    R.cam.panT = 2;
  }
}
function endDrag(ev) {
  const D = UI.drag; if (!D) return;
  moveDrag(ev);
  $('ghost').classList.remove('on');
  for (const c of $('grid').querySelectorAll('.cell.hint')) c.classList.remove('hint');
  W && (W.slowmo = false);
  UI.drag = null; R.preview = null;
  if (D.overCell) { combineInTray(D.k, D.overCell, D.pair); return; }
  if (D.plan && !D.pair) startWrite(D.k, D.tx, D.ty);
}
function cancelDrag() { $('ghost').classList.remove('on'); UI.drag = null; R.preview = null; if (W) W.slowmo = false; }

// ---- 書く ----
function startWrite(k, tx, ty) {
  if (!W || Scene.leaving) return false;
  const plan = planWrite(k, tx, ty);
  if (['none', 'noroom', 'noeffect'].includes(plan.kind)) { toast(plan.msg || 'ここには書けない'); Sfx.nope(); return false; }
  if (plan.kind === 'wrongname') { toast('……ちがう名のようだ'); plan.faded.hintT = 1.2; Sfx.nope(); Bus.emit('wrongname', { k, f: plan.faded }); return false; }
  if ((plan.cost || 0) > Ink.free()) { toast('墨が足りない（' + plan.cost + '画）。書いた字をタップすると墨をもどせる'); UI.potShakeT = 0.5; Sfx.nope(); Bus.emit('noink', { k }); return false; }
  Ink.pending += plan.cost || 0;
  const n = strokesOf(k);
  let bx = tx, by = ty, bw = 1, bh = 1;
  const tg = plan.target || plan.faded;
  if (tg) { bx = tg.x; by = tg.y; bw = tg.w; bh = tg.h; }
  else if (plan.kind === 'place') { bx = plan.x; by = plan.y; bw = plan.w; bh = plan.h; }
  else if (plan.w) { bx = plan.x; by = plan.y; bw = plan.w; bh = plan.h; }
  const size = Math.min(2.6, Math.max(1, Math.min(bw, bh)));
  const dur = clamp(0.12 * n, 0.35, Game.fastWrite ? 0.4 : 1.25);
  const d = KDEF[k];
  R.writing.push({ k, x: bx, y: by, w: bw, h: bh, size: k.length > 1 ? size * 1.6 : size, col: inkCol(d.col), t: 0, dur, cost: plan.cost || 0, tx, ty });
  Sfx.write(n);
  Game.used(k);
  return true;
}
function tickWriting(dt) {
  for (const w of R.writing) {
    w.t += dt;
    if (w.t >= w.dur && !w.done) {
      w.done = true;
      Ink.pending -= w.cost;
      const plan = planWrite(w.k, w.tx, w.ty);
      if (['none', 'noroom', 'noeffect', 'wrongname'].includes(plan.kind) || (plan.cost || 0) > Ink.free()) { toast(plan.msg || 'うまく書けなかった'); Fx.inkBleed(w.x + w.w / 2, w.y + w.h / 2, 8); continue; }
      Fx.inkBleed(w.x + w.w / 2, w.y + w.h / 2, 6);
      try { commitWrite(w.k, plan, w.tx, w.ty); } catch (e) { reportError(e); }
    }
  }
  R.writing = R.writing.filter(w => w.t < w.dur + 0.15);
}

// ---- 字帳で合わせる ----
function combineInTray(a, b, pairA) {
  // b は字帳の上の字（または合わせかけ）
  const pairB = UI.pairs.find(p => p.parts.join('') === b && b.length > 1 && !KDEF[b]);
  let parts = null, r = null;
  if (pairA || pairB) {
    const p = pairA || pairB; const other = pairA ? b : a;
    if (!KDEF[other]) { bounce(); return; }
    parts = [...p.parts, other];
    r = findRecipe3(parts);
    UI.pairs = UI.pairs.filter(x => x !== p);
    if (!r) { buildTray(); bounce('合わない……'); return; }
  } else {
    r = findRecipe(a, b, false);
    parts = [b, a];
    if (!r && isPartialOf3(a, b)) {
      UI.pairs.push({ parts: [b, a] }); buildTray(); Sfx.stamp(); toast(b + '＋' + a + '……もう一つ足りない');
      Bus.emit('pair', { parts: [b, a] });
      return;
    }
    if (!r) { bounce('合わない……'); Bus.emit('combineFail', { a, b }); return; }
  }
  const out = r.out;
  const known = Game.known.includes(out);
  playMorphOverlay(r.parts, out, () => {
    if (known) toast(out + '（' + KDEF[out].yomi + '）はもう知っている');
    else { Game.learn(out, 'combine'); toast(out + '（' + KDEF[out].yomi + '）をおぼえた！　' + r.parts.join('＋') + (r.type === 'mean' ? '（意味の合わせ）' : '')); }
  });
  Sfx.combine();
  Bus.emit('combine', { a, b, out, where: 'tray', type: r.type });
}
function bounce(msg) { Sfx.nope(); if (msg) toast(msg); const g = $('grid'); g.animate && g.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 220 }); }
// 合わせ字の動き（材料が寄って、ひとつの字になる）
function playMorphOverlay(parts, out, done) {
  let ov = $('morphov');
  if (!ov) { ov = document.createElement('canvas'); ov.id = 'morphov'; ov.style.cssText = 'position:fixed;z-index:60;pointer-events:none;left:50%;top:40%;transform:translate(-50%,-50%);width:min(64vw,300px);height:min(64vw,300px);filter:drop-shadow(0 10px 24px rgba(0,0,0,.25))'; document.body.append(ov); }
  const S = 300, dpr = Math.min(2, window.devicePixelRatio || 1);
  ov.width = S * dpr; ov.height = S * dpr; ov.style.display = 'block';
  const x = ov.getContext('2d');
  const word = out.length > 1;
  const plan = word ? null : Brush.morphPlan(parts, out);
  const d = KDEF[out]; const col = INK[d.col] || INK.sumi;
  // 材料の並び：左から右へ、109 単位の位置
  const n = parts.length;
  const starts = parts.map((p, i) => ({ x: (i - (n - 1) / 2) * 72 * (n > 2 ? 0.75 : 1), y: 0, s: n > 2 ? 0.55 : 0.68 }));
  // drawMorph は 109 の箱の中：材料をずらして並べる
  for (const s of starts) { s.x = s.x + 54.5 - 54.5 * s.s; s.y = 54.5 - 54.5 * s.s; }
  const order = plan ? plan.map(pl => parts.indexOf(pl.part)) : [];
  const t0 = performance.now();
  const dur = 1300;
  (function frame() {
    const k = clamp((performance.now() - t0) / dur, 0, 1);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, S, S);
    // 紙
    x.fillStyle = 'rgba(246,241,226,' + (0.94 * Math.min(1, k * 4, (1 - k) * 6 + 0.2)) + ')';
    x.beginPath(); x.arc(S / 2, S / 2, S * 0.48, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(196,56,31,.5)'; x.lineWidth = 2; x.stroke();
    x.save(); x.translate(S * 0.1, S * 0.1);
    const mt = smooth(0.2, 0.85, k);
    if (word) {
      const chars = [...out];
      chars.forEach((ch, i) => { x.save(); const e = S * 0.8 / chars.length; x.translate(i * e, (S * 0.8 - e) / 2 + Math.sin((1 - mt) * Math.PI) * 10 * (i ? 1 : -1)); Brush.draw(x, ch, e, col); x.restore(); });
    } else if (plan) {
      const st2 = plan.map(pl => starts[parts.indexOf(pl.part)] || starts[0]);
      Brush.drawMorph(x, parts, out, plan, mt, S * 0.8, col, st2);
    } else Brush.draw(x, out, S * 0.8, col);
    x.restore();
    // 落款
    if (k > 0.85) { const a = smooth(0.85, 1, k); x.globalAlpha = a; x.fillStyle = INK.shu; x.fillRect(S * 0.76, S * 0.76, S * 0.12, S * 0.12); x.fillStyle = '#fff'; x.font = '600 ' + Math.round(S * 0.08) + 'px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.yomi[0] || '', S * 0.82, S * 0.82); x.globalAlpha = 1; }
    if (k < 1) requestAnimationFrame(frame);
    else setTimeout(() => { ov.style.display = 'none'; done && done(); }, 380);
  })();
}

// ---- 墨つぼ ----
function updateInk() {
  const free = Ink.free(), max = Ink.max;
  $('inkNow').textContent = String(Math.round(free));
  $('inkMax').textContent = String(max);
  const c = $('inkcv'), x = c.getContext('2d'), S = c.width;
  x.clearRect(0, 0, S, S);
  const shake = UI.potShakeT > 0 ? Math.sin(UI.potShakeT * 60) * 3 : 0;
  const pulse = UI.potPulseT > 0 ? UI.potPulseT * 6 : 0;
  x.save(); x.translate(S / 2 + shake, S / 2);
  // 硯
  x.fillStyle = '#3a3640'; x.beginPath(); x.ellipse(0, 4, S * 0.44 + pulse, S * 0.38, 0, 0, TAU); x.fill();
  x.fillStyle = '#56505c'; x.beginPath(); x.ellipse(0, 0, S * 0.4 + pulse, S * 0.33, 0, 0, TAU); x.fill();
  // 墨のたまり
  const k = max ? free / max : 0;
  x.fillStyle = '#121016';
  x.beginPath(); x.ellipse(0, S * 0.04, S * 0.33 * Math.sqrt(k) + 1, S * 0.25 * Math.sqrt(k) + 1, 0, 0, TAU); x.fill();
  x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(-S * 0.1 * Math.sqrt(k), -S * 0.04, S * 0.06, S * 0.03, -0.4, 0, TAU); x.fill();
  x.restore();
}
// ---- 知らせ・吹き出し ----
let toastTimer = null;
function toast(s, ms) {
  const t = $('toast'); t.textContent = s; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), ms || 2600);
  if (Game && Game.log) Game.log.push(s);
}
function showBubbleFor(e) {
  const b = $('bubble'); b.innerHTML = '';
  UI.bubbleEnt = e; UI.bubbleT = 4;
  const stack = e.stack || [];
  const top = stack[stack.length - 1];
  const label = !top ? null : top.type === 'mod' ? '「' + top.k + '」をもどす' : top.type === 'morph' ? '「' + top.from + '」にもどす' : e.k + 'をもどす';
  if (label) {
    const r = el('button', 'red', label + '（墨 ' + top.ink + '）');
    r.onclick = ev => { ev.stopPropagation(); returnInk(e); hideBubble(); };
    b.append(r);
  }
  const info = el('button', null, '調べる');
  info.onclick = ev => { ev.stopPropagation(); hideBubble(); inspect(e); };
  b.append(info);
  b.hidden = false;
  placeBubble();
}
function placeBubble() {
  const b = $('bubble'), e = UI.bubbleEnt; if (!e || b.hidden) return;
  if (!e.alive) { hideBubble(); return; }
  const [sx, sy] = w2s(e.rx + e.w / 2, e.ry);
  b.style.left = clamp(sx, 90, R.vw - 90) + 'px'; b.style.top = Math.max(50, sy - 6) + 'px';
}
function hideBubble() { $('bubble').hidden = true; UI.bubbleEnt = null; }
// 墨をもどす（いちばん新しく書いたものから）
function returnInk(e) {
  const stack = e.stack || []; const top = stack.pop();
  if (!top) return;
  Sfx.page();
  if (top.type === 'mod') { unmod(e, top.key); Bus.emit('return', { who: e, what: top.k }); }
  else if (top.type === 'morph') {
    const ink = top.ink;
    transformEnt(e, top.from, { keepMine: true, force: true });
    if (e.mine) e.ink -= ink; else e.modInk.__morph = (e.modInk.__morph || 0) - ink;
    if (!e.mine && e.modInk.__morph <= 0) delete e.modInk.__morph;
    Ink.flowBack(ink, e.cx, e.cy);
    Bus.emit('return', { who: e, what: top.from });
  } else { removeEnt(e, 'return'); Bus.emit('return', { who: e, what: e.k }); }
}
function inspect(e) {
  if (e.isHero) { toast('あなた。墨のひとしずくから生まれた「人」'); return; }
  const d = e.d;
  const st = [];
  if (e.burnT > 0) st.push('燃えている'); if (e.sleepT > 0) st.push('眠っている'); if (e.frozenT > 0) st.push('こおっている'); if (e.charmT > 0) st.push('仲よし'); if (e.fearT > 0) st.push('こわがっている'); if (e.angryT > 0) st.push('怒っている'); if (e.stopT > 0) st.push('時が止まっている'); if (e.wetT > 0) st.push('ぬれている'); if (e.tamed) st.push('なついている');
  e.talk(d.ch + '（' + d.yomi + '）' + (st.length ? '・' + st.join('・') : ''), 3.2);
  Bus.emit('inspect', { who: e });
}
// ---- 絵師の声（縦書き）----
const Voice = {
  q: [], busy: false,
  say(text, opt) {
    if (!text) return;
    const lines = Array.isArray(text) ? text : [text];
    for (const l of lines) this.q.push({ text: l, dur: (opt && opt.dur) || clamp(2.2 + l.length * 0.16, 3, 8) });
    if (!this.busy) this.next();
  },
  next() {
    const it = this.q.shift(); const box = $('voice');
    if (!it) { this.busy = false; return; }
    this.busy = true;
    const p = el('div', 'line', it.text);
    box.prepend(p);
    while (box.children.length > 3) box.lastChild.remove();
    requestAnimationFrame(() => p.classList.add('on'));
    setTimeout(() => { p.classList.remove('on'); setTimeout(() => p.remove(), 1000); }, it.dur * 1000);
    setTimeout(() => this.next(), Math.min(it.dur * 1000, 1800 + it.text.length * 60));
    if (Game && Game.log) Game.log.push('〔絵師〕' + it.text);
  },
  clear() { this.q = []; this.busy = false; $('voice').innerHTML = ''; },
};

// ---- 絵巻の上の指 ----
function setupCanvasInput() {
  const cv = $('cv');
  let down = null, lp = null;
  cv.addEventListener('pointerdown', ev => {
    AudioSys.init(); Music.play(Scene.cur ? Scene.cur.music : 'field');
    down = { x: ev.clientX, y: ev.clientY, t: performance.now(), pan: false, id: ev.pointerId, cx: R.cam.panX, cy: R.cam.panY };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { }
    clearTimeout(lp);
    lp = setTimeout(() => { if (down && !down.pan) { const p = localPt(ev); longPressAt(p[0], p[1]); down.long = true; } }, 480);
  });
  cv.addEventListener('pointermove', ev => {
    if (!down || ev.pointerId !== down.id) return;
    const dx = ev.clientX - down.x, dy = ev.clientY - down.y;
    if (!down.pan && Math.hypot(dx, dy) > 12) { down.pan = true; clearTimeout(lp); }
    if (down.pan) { R.cam.panX = down.cx - dx / R.TS; R.cam.panY = down.cy - dy / R.TS; R.cam.panT = 3; }
  });
  cv.addEventListener('pointerup', ev => {
    clearTimeout(lp);
    if (!down || ev.pointerId !== down.id) return;
    const d = down; down = null;
    if (d.pan || d.long) return;
    const p = localPt(ev);
    tapAt(p[0], p[1]);
  });
  cv.addEventListener('pointercancel', () => { clearTimeout(lp); down = null; });
  cv.addEventListener('contextmenu', ev => ev.preventDefault());
  // 鍵盤
  window.addEventListener('keydown', ev => {
    if (!W || !W.hero || $('modal').classList.contains('on')) return;
    const h = W.hero;
    const k = ev.key;
    const go = (dx, dy) => { ev.preventDefault(); AudioSys.init(); heroTap(clamp(h.x + dx, 0, W.w - 1), clamp(h.y + dy, 0, W.h - 1)); };
    if (k === 'ArrowLeft' || k === 'a') go(-3, 0);
    else if (k === 'ArrowRight' || k === 'd') go(3, 0);
    else if (k === 'ArrowUp' || k === 'w') go(0, -2);
    else if (k === 'ArrowDown' || k === 's') go(0, 2);
    else if (k === 'Escape') { UI.selected = null; buildTray(); }
  });
}
function localPt(ev) { const r = $('cv').getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
function tapAt(sx, sy) {
  if (!W || !W.hero || Scene.leaving) return;
  const [tx, ty] = s2cell(sx, sy);
  if (UI.selected) { const k = UI.selected; if (startWrite(k, tx, ty)) { UI.selected = null; for (const c of $('grid').querySelectorAll('.cell.sel')) c.classList.remove('sel'); } return; }
  hideBubble();
  // 自分の書いた字をタップ：もどす
  const mineEnt = entsAt(tx, ty, e => !e.isHero && (e.stack && e.stack.length))[0];
  if (mineEnt && !(mineEnt.d.ai && mineEnt.d.ai.ride && canRide(mineEnt))) { showBubbleFor(mineEnt); return; }
  heroTap(tx, ty);
}
function longPressAt(sx, sy) {
  const [tx, ty] = s2cell(sx, sy);
  const f = fadedAt(tx, ty);
  if (f) { f.hintT = 2; Voice.say(f.hint || '……思い出せそうで、思い出せぬ。たしか ' + strokesOf(f.k) + ' 画の字じゃった', { who: 'painter' }); Bus.emit('inspectFaded', { f }); return; }
  const e = entsAt(tx, ty)[0] || entsAt(tx, ty + 1)[0];
  if (e) { if (e.stack && e.stack.length) showBubbleFor(e); else inspect(e); }
}

// ---- 巻物（メニュー）----
function openSheet(build) {
  const m = $('modal'), s = $('sheet'); s.innerHTML = '';
  const close = el('button', 'hbtn close', '×'); close.setAttribute('aria-label', 'とじる'); close.onclick = closeSheet;
  s.append(close);
  build(s);
  m.classList.add('on');
  Game.paused = true; Sfx.page();
}
function closeSheet() { $('modal').classList.remove('on'); Game.paused = false; }
function openMenu() {
  openSheet(s => {
    s.append(el('h2', null, '巻物'));
    const p = el('p', null, '字典 ' + Game.known.length + ' / ' + dictTotal() + '　・　色をもどしたもの ' + Game.colors + '　・　解き方の印 ' + Game.stampCount());
    s.append(p);
    const row = el('div', 'mrow');
    const btn = (t, fn, red) => { const b = el('button', 'mbtn' + (red ? ' red' : ''), t); b.onclick = fn; row.append(b); };
    btn('字典をひらく', openDict, true);
    btn('場面をえらぶ', openScenes);
    btn('自由帳（好きに書く）', () => { closeSheet(); Game.sandbox(); });
    btn('この場面をやり直す', () => { closeSheet(); Scene.restart(); });
    btn('音と設定', openSettings);
    btn('表紙へ', () => { closeSheet(); Game.toTitle(); });
    s.append(row);
    s.append(el('h3', null, 'あそび方'));
    const how = [
      '・絵巻をタップすると、そこへ歩く。',
      '・下の字帳から字を引っぱって絵巻に置くと、その字が本物になる。',
      '・字を字に重ねると、新しい字が生まれる（木＋木＝林）。絵巻の中の字に重ねても合わさる。',
      '・薄れたものには、その名を書くと色がよみがえる。',
      '・書いた字は墨を使う。書いた字をタップすると、墨をもどせる。',
      '・乗れるものに乗ったら、行きたい方をタップ。',
      '・長押しで調べる。「？」で絵師の声を聞く。',
    ];
    for (const l of how) s.append(el('p', null, l));
  });
}
function dictTotal() { return Object.values(KDEF).filter(d => !d.hidden && !d.story).length; }
function openDict() {
  openSheet(s => {
    s.append(el('h2', null, '字典'));
    s.append(el('p', null, 'おぼえた字 ' + Game.known.length + ' / ' + dictTotal() + '。まだの字も、画数と読みの手がかりがある。'));
    for (const [id, name] of CATS) {
      if (id === 'all') continue;
      const list = Object.values(KDEF).filter(d => d.cat === id && !d.hidden && (!d.story || Game.known.includes(d.ch)));
      if (!list.length) continue;
      const known = list.filter(d => Game.known.includes(d.ch)).length;
      s.append(el('h3', null, name + '　' + known + ' / ' + list.length));
      const g = el('div', 'dict');
      for (const d of list) {
        const has = Game.known.includes(d.ch);
        const b = el('button', 'd' + (has ? '' : ' no'));
        b.setAttribute('aria-label', has ? d.ch : '？');
        if (d.word) b.style.gridColumn = 'span 2';
        if (has) { const c = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = 54 * dpr * (d.word ? 2 : 1); c.height = 54 * dpr; b.append(c); queueGlyph(c, d.ch, d.col); }
        else b.append(el('span', null, strokesOf(d.ch) + '画'));
        b.onclick = () => showCard(d.ch, true);
        g.append(b);
      }
      s.append(g);
    }
  });
}
// 字のくわしい札
function showCard(k, fromDict) {
  if (!k) return;
  const d = KDEF[k]; if (!d) return;
  const has = Game.known.includes(k);
  openSheet(s => {
    const card = el('div', 'card');
    const c = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = 120 * dpr; c.height = 120 * dpr;
    card.append(c);
    const info = el('div');
    if (has) {
      info.append(el('div', 'yomi', d.ch + '　' + d.yomi));
      info.append(el('div', 'meta', d.imi + '　・　' + strokesOf(k) + '画（墨 ' + strokesOf(k) + '）'));
      const rs = recipesFor(k);
      if (rs.length) info.append(el('div', 'eq', rs.map(r => r.parts.join('＋') + '＝' + k + (r.type === 'mean' ? '（意味）' : r.type === 'word' ? '（言葉）' : '')).join('　')));
    } else {
      info.append(el('div', 'yomi', '？　' + hintYomi(d.yomi)));
      info.append(el('div', 'meta', strokesOf(k) + '画　・　' + (CATS.find(c => c[0] === d.cat) || ['', ''])[1]));
      const rs = recipesFor(k);
      if (rs.length) info.append(el('div', 'eq', '手がかり：' + rs[0].parts.map((p, i) => i === 0 ? p : '？').join('＋')));
      else info.append(el('div', 'eq', '手がかり：絵巻のどこかにある'));
    }
    card.append(info);
    s.append(card);
    if (has) {
      s.append(el('p', null, d.note || ''));
      if (d.gen) s.append(el('p', null, '字のなりたち：' + d.gen));
    }
    const row = el('div', 'mrow');
    if (fromDict) { const b = el('button', 'mbtn', '字典へもどる'); b.onclick = openDict; row.append(b); }
    s.append(row);
    // 書き順で書いて見せる
    const x = c.getContext('2d'); const t0 = performance.now(); const n = strokesOf(k);
    (function anim() {
      if (!c.isConnected) return;
      const sec = (performance.now() - t0) / 1000;
      const prog = has ? Math.min(n, sec * 2.2) : n;
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, 120, 120);
      const chars = [...k]; const each = 112 / chars.length;
      let before = 0;
      chars.forEach((ch, i) => { const sc = Brush.strokeCount(ch); x.save(); x.translate(4 + i * each, (120 - each) / 2); Brush.draw(x, ch, each, has ? INK[d.col] || INK.sumi : 'rgba(110,100,90,.25)', { strokes: clamp(prog - before, 0, sc) }); x.restore(); before += sc; });
      if (has && prog < n) requestAnimationFrame(anim);
    })();
  });
}
function hintYomi(y) { return [...y].map((c, i) => i === 0 ? c : '○').join(''); }
function openScenes() {
  openSheet(s => {
    s.append(el('h2', null, '場面'));
    s.append(el('p', null, 'おわった場面は、何度でも遊べる。印（■）は、見つけた解き方の数。'));
    let lastCh = null;
    for (let i = 0; i < SCENES.length; i++) {
      const sc = SCENES[i];
      if (sc.chapter !== lastCh) { lastCh = sc.chapter; s.append(el('h3', null, CHAPTERS[sc.chapter].title)); }
      const open = Game.unlocked(i);
      const b = el('button', 'scn');
      b.disabled = !open;
      b.append(el('span', 'no', CHAPTERS[sc.chapter].seal + ' ' + (sc.no || '')));
      b.append(el('span', null, open ? sc.title : '？？？'));
      const st = el('span', 'stamps');
      for (const a of (sc.stamps || [])) { const ii = document.createElement('i'); if (Game.hasStamp(sc.id, a.id)) ii.className = 'on'; ii.title = Game.hasStamp(sc.id, a.id) ? a.name : '？'; st.append(ii); }
      b.append(st);
      b.onclick = () => { closeSheet(); Scene.load(i); };
      s.append(b);
    }
  });
}
function openSettings() {
  openSheet(s => {
    s.append(el('h2', null, '音と設定'));
    const slider = (label, id, val, fn) => {
      const row = el('div', 'setting'); const l = el('label', null, label); l.htmlFor = id;
      const r = document.createElement('input'); r.type = 'range'; r.min = '0'; r.max = '1'; r.step = '0.05'; r.value = String(val); r.id = id;
      r.oninput = () => fn(parseFloat(r.value));
      row.append(l, r); s.append(row);
    };
    slider('曲の音', 'volMusic', AudioSys.st.music, v => { AudioSys.setVol('music', v); Game.settings.music = v; Game.save(); });
    slider('効果音', 'volSfx', AudioSys.st.sfx, v => { AudioSys.setVol('sfx', v); Game.settings.sfx = v; Game.save(); });
    const row = el('div', 'setting'); row.append(el('span', null, '筆を速く（書くのが早くなる）'));
    const tg = el('button', 'mbtn', Game.fastWrite ? 'はやい' : 'ふつう'); tg.onclick = () => { Game.fastWrite = !Game.fastWrite; Game.settings.fast = Game.fastWrite; tg.textContent = Game.fastWrite ? 'はやい' : 'ふつう'; Game.save(); };
    row.append(tg); s.append(row);
    s.append(el('h3', null, 'はじめから'));
    const conf = el('div', 'mrow');
    const del = el('button', 'mbtn', '記録を消す…');
    del.onclick = () => {
      conf.innerHTML = '';
      conf.append(el('p', null, 'おぼえた字も、進んだ場面も、すべて消えます。'));
      const yes = el('button', 'mbtn red', '消して、はじめから'); yes.onclick = () => { Store.clear(); location.reload(); };
      const no = el('button', 'mbtn', 'やめる'); no.onclick = openSettings;
      conf.append(yes, no);
    };
    conf.append(del); s.append(conf);
    s.append(el('h3', null, 'このゲームについて'));
    s.append(el('p', null, '「ひとしずく」――字を書くと、字が本物になる絵巻の旅。'));
    s.append(el('p', null, '漢字の筆順データ：KanjiVG（Ulrich Apel, CC BY-SA 3.0, kanjivg.tagaini.net）。画面の字体：Klee One（Fontworks, SIL Open Font License 1.1）。音はすべてその場で作っています。'));
  });
}

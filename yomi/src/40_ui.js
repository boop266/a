// 黄泉還：文字と画面（伝言・選択・タイトル・死・指のボタン）
const FONT_UI = '"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP","Meiryo",sans-serif';
const FONT_MIN = '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","MS PMincho",serif';
const UIR = []; // 押せる場所
function uiBlocking() { return !!(G.ui || G.msg || G.mode === 'title' || G.mode === 'dead' || G.mode === 'end'); }
function U() { return VW.h / 100; }
function rr(x, y, w, h, r) { UX.beginPath(); UX.moveTo(x + r, y); UX.arcTo(x + w, y, x + w, y + h, r); UX.arcTo(x + w, y + h, x, y + h, r); UX.arcTo(x, y + h, x, y, r); UX.arcTo(x, y, x + w, y, r); UX.closePath(); }
function txt(s, x, y, size, col = '#e8e2d4', o = {}) { UX.font = `${o.w || 500} ${size}px ${o.f || FONT_UI}`; UX.fillStyle = col; UX.textAlign = o.a || 'left'; UX.textBaseline = o.b || 'alphabetic'; if (o.sh) { UX.fillStyle = 'rgba(0,0,0,0.7)'; UX.fillText(s, x + size * 0.06, y + size * 0.06); UX.fillStyle = col; } UX.fillText(s, x, y); }
function hit(x, y, w, h, fn) { UIR.push({ x, y, w, h, fn }); }
function uiTap() { for (const p of IN.ptr) for (let i = UIR.length - 1; i >= 0; i--) { const r = UIR[i]; if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) { r.fn(); return true; } } return false; }
function wrapText(s, maxW, size, font = FONT_UI) { UX.font = `500 ${size}px ${font}`; const out = []; for (const para of s.split('\n')) { let line = ''; for (const ch of para) { if (UX.measureText(line + ch).width > maxW && line) { if ('、。」）'.includes(ch)) { line += ch; out.push(line); line = ''; continue; } out.push(line); line = ch; } else line += ch; } out.push(line); } return out; }
// ── 伝言（下の黒い帯に一文字ずつ） ──
function say(t, cb, o = {}) { const pages = Array.isArray(t) ? t : [t]; const m = { pages, i: 0, ch: 0, cb, o }; if (G.msg) G.msgQ.push(m); else G.msg = m; }
function ask(t, opts, cb) { say(t, null, { choice: opts, ccb: cb }); }
function itemGet(id, n) { const it = ITEMS[id]; say(`${it.name}${it.stack && n > 1 ? `（${n}）` : ''}を手に入れた。`); }
function msgUpdate(dt) {
  const m = G.msg; const full = m.pages[m.i].length;
  m.ch = Math.min(full, m.ch + dt * 42);
  if (m.o.choice && m.ch >= full && m.i === m.pages.length - 1) {
    m.sel = m.sel || 0;
    if (IN.e.up || IN.e.left) { m.sel = (m.sel + m.o.choice.length - 1) % m.o.choice.length; AU.sfx('tick'); }
    if (IN.e.down || IN.e.right) { m.sel = (m.sel + 1) % m.o.choice.length; AU.sfx('tick'); }
    if (uiTap()) return;
    if (IN.e.ok || IN.e.act) { msgChoose(m.sel); return; }
    if (IN.e.cancel) { msgChoose(m.o.choice.length - 1); return; }
    return;
  }
  if (uiTap()) return;
  if (IN.e.ok || IN.e.act || IN.e.cancel || IN.e.fire || (IN.ptr.length && !m.o.choice)) {
    if (m.ch < full) { m.ch = full; return; }
    if (m.i < m.pages.length - 1) { m.i++; m.ch = 0; AU.sfx('tick'); return; }
    msgClose();
  }
}
function msgChoose(i) { const m = G.msg; AU.sfx(i === 0 ? 'ok' : 'cancel'); msgClose(); if (m.o.ccb) m.o.ccb(i); }
function msgClose() { const m = G.msg; G.msg = G.msgQ.length ? G.msgQ.shift() : null; if (m.cb) m.cb(); }
function drawMsg() {
  const m = G.msg; if (!m) return; const u = U(), x = VW.x + u * 4, w = VW.w - u * 8, h = u * 24, y = VW.y + VW.h - h - u * 3;
  UX.fillStyle = 'rgba(0,0,0,0.78)'; rr(x, y, w, h, u * 1.2); UX.fill(); UX.strokeStyle = 'rgba(200,190,160,0.35)'; UX.lineWidth = 1; UX.stroke();
  const size = Math.max(13, u * 4.2), s = m.pages[m.i].slice(0, Math.floor(m.ch));
  const lines = wrapText(s, w - u * 8, size, m.o.min ? FONT_MIN : FONT_UI);
  lines.forEach((l, i) => txt(l, x + u * 4, y + u * 6.5 + i * size * 1.45, size, '#ece6d6', { f: m.o.min ? FONT_MIN : FONT_UI }));
  if (m.o.choice && m.ch >= m.pages[m.i].length && m.i === m.pages.length - 1) {
    const cw = u * 22, ch = u * 7, cx0 = x + w - (cw + u * 2) * m.o.choice.length - u * 2, cy = y - ch - u * 1.5;
    m.o.choice.forEach((c, i) => { const cx = cx0 + i * (cw + u * 2); UX.fillStyle = i === (m.sel || 0) ? 'rgba(160,30,30,0.9)' : 'rgba(0,0,0,0.8)'; rr(cx, cy, cw, ch, u); UX.fill(); UX.strokeStyle = 'rgba(220,200,170,0.5)'; UX.stroke(); txt(c, cx + cw / 2, cy + ch * 0.66, size, '#fff', { a: 'center' }); hit(cx, cy, cw, ch, () => { m.sel = i; msgChoose(i); }); });
  } else if (m.ch >= m.pages[m.i].length) { const bl = (G.t * 2 % 1) < 0.6; if (bl) { UX.fillStyle = '#c8b890'; UX.beginPath(); const ax = x + w - u * 4, ay = y + h - u * 4; UX.moveTo(ax - u, ay - u); UX.lineTo(ax + u, ay - u); UX.lineTo(ax, ay + u * 0.5); UX.fill(); } }
}
// ── 字幕（場面の間の短い言葉） ──
function sub(t, dur = 3) { G.sub = { t, life: dur, max: dur }; }
function drawSub(dt) { const s = G.sub; if (!s) return; s.life -= dt; if (s.life <= 0) { G.sub = null; return; } const u = U(), a = Math.min(1, s.life * 2, (s.max - s.life) * 3); UX.globalAlpha = a; const size = Math.max(13, u * 4); const lines = wrapText(s.t, VW.w * 0.85, size); lines.forEach((l, i) => txt(l, VW.x + VW.w / 2, VW.y + VW.h * 0.86 + i * size * 1.4, size, '#f2ead8', { a: 'center', sh: true })); UX.globalAlpha = 1; }
// ── 指のボタン ──
function drawTouch() {
  if (!IN.touch || G.ui || G.msg || G.mode !== 'play') return;
  const h = TOUCH.home, s = TOUCH.stick, bx = s ? s.sx : h.x, by = s ? s.sy : h.y;
  UX.strokeStyle = 'rgba(255,255,255,0.22)'; UX.fillStyle = 'rgba(255,255,255,0.05)'; UX.lineWidth = 1.5; UX.beginPath(); UX.arc(bx, by, h.R, 0, TAU); UX.fill(); UX.stroke();
  let kx = bx, ky = by; if (s) { let dx = s.x - s.sx, dy = s.y - s.sy; const m = hyp(dx, dy); if (m > h.R) { dx *= h.R / m; dy *= h.R / m; } kx += dx; ky += dy; }
  UX.fillStyle = 'rgba(255,255,255,0.22)'; UX.beginPath(); UX.arc(kx, ky, h.R * 0.42, 0, TAU); UX.fill();
  for (const k in TOUCH.btn) {
    const b = TOUCH.btn[k], on = TOUCH.held[k]; UX.fillStyle = on ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'; UX.strokeStyle = 'rgba(255,255,255,0.3)'; UX.beginPath(); UX.arc(b.x, b.y, b.r, 0, TAU); UX.fill(); UX.stroke();
    UX.strokeStyle = UX.fillStyle = 'rgba(255,255,255,0.85)'; UX.lineWidth = 2; const r = b.r * 0.42;
    if (k === 'aim') { UX.beginPath(); UX.arc(b.x, b.y, r * 0.75, 0, TAU); UX.stroke(); UX.beginPath(); UX.moveTo(b.x - r * 1.2, b.y); UX.lineTo(b.x - r * 0.3, b.y); UX.moveTo(b.x + r * 0.3, b.y); UX.lineTo(b.x + r * 1.2, b.y); UX.moveTo(b.x, b.y - r * 1.2); UX.lineTo(b.x, b.y - r * 0.3); UX.moveTo(b.x, b.y + r * 0.3); UX.lineTo(b.x, b.y + r * 1.2); UX.stroke(); }
    else if (k === 'act') { if (TOUCH.held.aim) { UX.fillStyle = 'rgba(255,200,120,0.95)'; UX.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, q = i % 2 ? r * 0.45 : r * 1.1; UX.lineTo(b.x + Math.cos(a) * q, b.y + Math.sin(a) * q); } UX.fill(); } else { UX.beginPath(); UX.arc(b.x - r * 0.15, b.y - r * 0.15, r * 0.65, 0, TAU); UX.stroke(); UX.beginPath(); UX.moveTo(b.x + r * 0.3, b.y + r * 0.3); UX.lineTo(b.x + r * 0.95, b.y + r * 0.95); UX.stroke(); } }
    else if (k === 'menu') { for (let i = -1; i <= 1; i++) UX.fillRect(b.x - r * 0.8, b.y + i * r * 0.55 - 1, r * 1.6, 2.5); }
    else if (k === 'map') { UX.strokeRect(b.x - r * 0.8, b.y - r * 0.65, r * 1.6, r * 1.3); UX.beginPath(); UX.moveTo(b.x - r * 0.25, b.y - r * 0.65); UX.lineTo(b.x - r * 0.25, b.y + r * 0.65); UX.moveTo(b.x + r * 0.25, b.y - r * 0.65); UX.lineTo(b.x + r * 0.25, b.y + r * 0.65); UX.stroke(); }
  }
}
// ── 脱出の残り時間 ──
function drawTimer() { if (!G.timer || G.mode === 'title') return; const u = U(), t = Math.max(0, G.timer.left); const s = `${String((t / 60) | 0).padStart(2, '0')}:${String((t % 60) | 0).padStart(2, '0')}.${String(((t % 1) * 100) | 0).padStart(2, '0')}`; txt(s, VW.x + VW.w / 2, VW.y + u * 8, u * 6, t < 30 ? '#ff4030' : '#ffd0a0', { a: 'center', w: 700, sh: true, f: 'monospace' }); }
// ── タイトル ──
const TITLE = { sel: 0, t: 0, phase: 'press', cam: null };
function titleUpdate(dt) {
  TITLE.t += dt; UIR.length = 0;
  if (TITLE.phase === 'press') { if (IN.e.any || IN.ptr.length) { TITLE.phase = 'menu'; AU.wake(); AU.music('title'); AU.sfx('ok'); } return; }
  const items = titleItems();
  if (IN.e.up) { TITLE.sel = (TITLE.sel + items.length - 1) % items.length; AU.sfx('tick'); }
  if (IN.e.down) { TITLE.sel = (TITLE.sel + 1) % items.length; AU.sfx('tick'); }
  if (IN.e.ok || IN.e.act) { items[TITLE.sel][1](); }
}
function titleItems() { const it = [['はじめから', () => { AU.sfx('ok'); startNewGame(); }]]; if (hasSave()) it.push(['つづきから', () => { AU.sfx('ok'); openLoad(); }]); it.push(['設定', () => { AU.sfx('ok'); openOpts(); }]); if (G.unlockInf) it.push([`おまけ：弾数無限　${G.useInf ? 'ON' : 'OFF'}`, () => { G.useInf = !G.useInf; AU.sfx('tick'); }]); return it; }
function drawTitle() {
  const u = U(), cx = VW.x + VW.w / 2, a = Math.min(1, TITLE.t / 2.5);
  UX.fillStyle = `rgba(0,0,0,${0.35})`; UX.fillRect(VW.x, VW.y, VW.w, VW.h);
  UX.globalAlpha = a; txt('黄泉還', cx, VW.y + u * 34, u * 17, '#d8cfb8', { a: 'center', f: FONT_MIN, w: 700, sh: true });
  txt('―  Y O M I G A E R I  ―', cx, VW.y + u * 43, u * 3.4, '#9a2a22', { a: 'center', f: FONT_MIN, w: 600 }); UX.globalAlpha = 1;
  if (TITLE.phase === 'press') { if ((TITLE.t * 1.2) % 1 < 0.65) txt(IN.touch ? '画面にふれてください' : 'なにかボタンを押してください', cx, VW.y + u * 72, u * 4, '#cfc6b0', { a: 'center' }); }
  else titleItems().forEach(([s, fn], i) => { const y = VW.y + u * (62 + i * 8.5), on = i === TITLE.sel; if (on) { UX.fillStyle = 'rgba(140,20,20,0.55)'; UX.fillRect(cx - u * 22, y - u * 5, u * 44, u * 7); } txt(s, cx, y, u * 4.4, on ? '#fff' : '#b8b0a0', { a: 'center' }); hit(cx - u * 22, y - u * 5, u * 44, u * 7, () => { TITLE.sel = i; fn(); }); });
  txt('ⓒ 黄泉還　Claude', cx, VW.y + VW.h - u * 3, u * 2.2, '#5a544a', { a: 'center' });
}
// ── 死んだとき ──
function deadUpdate(dt) {
  G.deathT += dt; RD.U.gray.value = Math.min(0.85, G.deathT * 0.4); RD.U.red.value = Math.max(0, 0.4 - G.deathT * 0.2);
  if (G.deathT > 1.5 && !G.deathMus) { G.deathMus = true; AU.music('gameover'); }
  if (G.deathT < 3.2) return;
  const n = hasSave() ? 2 : 1; G.dsel = G.dsel || 0;
  if (IN.e.up || IN.e.down) { G.dsel = (G.dsel + 1) % n; AU.sfx('tick'); }
  if (uiTap()) return;
  if (IN.e.ok || IN.e.act) deadChoose(G.dsel);
}
function deadChoose(i) { AU.sfx('ok'); RD.U.gray.value = 0; RD.U.red.value = 0; G.deathMus = false; const items = hasSave() ? ['load', 'title'] : ['title']; if (items[i] === 'load') openLoad(true); else toTitle(); }
function drawDead() {
  const u = U(), cx = VW.x + VW.w / 2, a = clamp((G.deathT - 1.2) / 1.5, 0, 1);
  UX.fillStyle = `rgba(0,0,0,${a * 0.55})`; UX.fillRect(VW.x, VW.y, VW.w, VW.h);
  UX.globalAlpha = a; txt('YOU DIED', cx, VW.y + VW.h * 0.45, u * 13, '#a8100c', { a: 'center', f: FONT_MIN, w: 700 }); UX.globalAlpha = 1;
  if (G.deathT > 3.2) { const items = hasSave() ? ['最後に記録した所から', 'タイトルへ'] : ['タイトルへ']; items.forEach((s, i) => { const y = VW.y + VW.h * (0.66 + i * 0.09), on = i === (G.dsel || 0); if (on) { UX.fillStyle = 'rgba(120,10,10,0.6)'; UX.fillRect(cx - u * 26, y - u * 5, u * 52, u * 7); } txt(s, cx, y, u * 4.2, on ? '#fff' : '#a8a090', { a: 'center' }); hit(cx - u * 26, y - u * 5, u * 52, u * 7, () => { G.dsel = i; deadChoose(i); }); }); }
}
function toTitle() { G.mode = 'title'; G.ui = null; G.msg = null; G.msgQ = []; G.timer = null; TITLE.phase = 'menu'; TITLE.t = 3; TITLE.sel = 0; enterTitleScene(); AU.music('title'); }
// ── 画面の上に重ねる：赤い傷・暗転 ──
function drawOverlay(dt) {
  if (G.redT > 0) { G.redT -= dt; RD.U.red.value = Math.max(RD.U.red.value, G.redT * 1.4); } else if (G.mode !== 'dead') RD.U.red.value = Math.max(0, RD.U.red.value - dt * 3);
  if (G.fade != null) RD.U.fade.value = G.fade;
}

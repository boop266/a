// 黄泉還：入力（キーボード・ゲームパッド・タッチ）を、同じ「動作」にそろえる
const IN = { mx: 0, my: 0, mag: 0, run: false, aim: false, fireHeld: false, touch: false, last: 'key', e: {}, ptr: [], wheel: 0 };
const EDGES = ['act', 'fire', 'menu', 'map', 'esc', 'reload', 'ok', 'cancel', 'up', 'down', 'left', 'right', 'tabL', 'tabR', 'any'];
for (const k of EDGES) IN.e[k] = 0;
function inEdge(k) { IN.e[k] = 1; if (k !== 'any') IN.e.any = 1; }
function inConsume() { for (const k of EDGES) IN.e[k] = 0; IN.ptr.length = 0; IN.wheel = 0; }
const KEYS = {};
const KMAP = { w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); IN.last = 'key';
  if (typeof AU !== 'undefined') AU.wake();
  if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'backspace'].includes(k)) e.preventDefault();
  const first = !KEYS[k]; KEYS[k] = true;
  if (KMAP[k]) inEdge(KMAP[k]);
  if (!first) return; // 押しっぱなしの繰り返しは、上下左右だけ
  inEdge('any');
  if (k === ' ') { inEdge('ok'); if (KEYS.j) inEdge('fire'); else inEdge('act'); }
  if (k === 'enter' || k === 'z') { inEdge('ok'); inEdge('act'); }
  if (k === 'e') { inEdge('act'); inEdge('tabR'); }
  if (k === 'q') inEdge('tabL');
  if (k === 'k') inEdge('fire');
  if (k === 'tab' || k === 'i') { inEdge('menu'); inEdge('cancel'); }
  if (k === 'm') inEdge('map');
  if (k === 'escape' || k === 'p') { inEdge('esc'); inEdge('cancel'); }
  if (k === 'backspace' || k === 'x') inEdge('cancel');
  if (k === 'r') inEdge('reload');
});
addEventListener('keyup', e => { KEYS[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in KEYS) KEYS[k] = false; MOUSE.r = false; });
const MOUSE = { r: false, x: 0, y: 0 };
addEventListener('contextmenu', e => e.preventDefault());
// ── タッチ（スティックとボタン） ──
const TOUCH = { stick: null, home: { x: 0, y: 0, R: 50 }, btn: {}, held: {}, map: new Map(), area: null };
function layoutTouch() {
  const W = VW.W, H = VW.H, side = VW.side;
  const s = clamp(Math.min(W, H) * 0.15, 48, 82);
  if (side >= s * 2.2) { // 横持ち：左右の黒い帯にボタンを置く
    TOUCH.area = 'side';
    TOUCH.home = { x: side / 2, y: H * 0.68, R: Math.min(side * 0.36, s * 1.1) };
    const cx = W - side / 2;
    TOUCH.btn = { aim: { x: cx - s * 0.45, y: H * 0.78, r: s * 0.62, ic: 'aim' }, act: { x: cx + s * 0.35, y: H * 0.56, r: s * 0.58, ic: 'act' }, menu: { x: cx + s * 0.25, y: H * 0.13, r: s * 0.38, ic: 'menu' }, map: { x: side / 2, y: H * 0.13, r: s * 0.38, ic: 'map' } };
  } else { // 縦持ち・狭い画面：絵の下か、絵の上に重ねる
    const top = VW.y + VW.h, below = H - top;
    TOUCH.area = below > s * 2.6 ? 'below' : 'over';
    const by = TOUCH.area === 'below' ? top + below * 0.55 : H - s * 1.4;
    TOUCH.home = { x: s * 1.5, y: by, R: s * 1.05 };
    TOUCH.btn = { aim: { x: W - s * 2.2, y: by + s * 0.55, r: s * 0.62, ic: 'aim' }, act: { x: W - s * 0.95, y: by - s * 0.35, r: s * 0.58, ic: 'act' }, menu: { x: W - s * 0.8, y: TOUCH.area === 'below' ? top + s * 0.55 : s * 0.6, r: s * 0.38, ic: 'menu' }, map: { x: W - s * 1.8, y: TOUCH.area === 'below' ? top + s * 0.55 : s * 0.6, r: s * 0.38, ic: 'map' } };
  }
}
function hitBtn(x, y) { for (const k in TOUCH.btn) { const b = TOUCH.btn[k]; if (hyp(x - b.x, y - b.y) < b.r * 1.25) return k; } return null; }
UIC.addEventListener('pointerdown', e => {
  if (typeof AU !== 'undefined') AU.wake();
  const x = e.clientX, y = e.clientY;
  if (e.pointerType === 'touch' || e.pointerType === 'pen') { IN.touch = true; IN.last = 'touch'; } else IN.last = 'mouse';
  IN.ptr.push({ x, y }); inEdge('any');
  if (e.pointerType === 'mouse') {
    if (e.button === 2) MOUSE.r = true; else if (e.button === 0 && (MOUSE.r || KEYS.j)) inEdge('fire');
    return;
  }
  if (typeof uiBlocking === 'function' && uiBlocking()) return; // メニュー中はボタン扱いしない
  const b = hitBtn(x, y);
  if (b) { TOUCH.map.set(e.pointerId, { k: b }); TOUCH.held[b] = true; if (b === 'act') { if (TOUCH.held.aim) { inEdge('fire'); IN.fireHeld = true; } else inEdge('act'); } if (b === 'menu') inEdge('menu'); if (b === 'map') inEdge('map'); UIC.setPointerCapture(e.pointerId); e.preventDefault(); return; }
  const inStick = TOUCH.area === 'side' ? x < VW.side : (x < VW.W * 0.5 && (TOUCH.area !== 'below' || y > VW.y + VW.h));
  if (inStick && !TOUCH.stick) { TOUCH.stick = { id: e.pointerId, sx: x, sy: y, x, y }; TOUCH.map.set(e.pointerId, { k: 'stick' }); UIC.setPointerCapture(e.pointerId); e.preventDefault(); }
}, { passive: false });
UIC.addEventListener('pointermove', e => { MOUSE.x = e.clientX; MOUSE.y = e.clientY; const t = TOUCH.map.get(e.pointerId); if (t && t.k === 'stick' && TOUCH.stick) { TOUCH.stick.x = e.clientX; TOUCH.stick.y = e.clientY; } });
function tRelease(e) { if (e.pointerType === 'mouse' && e.button === 2) MOUSE.r = false; const t = TOUCH.map.get(e.pointerId); if (!t) return; if (t.k === 'stick') TOUCH.stick = null; else { TOUCH.held[t.k] = false; if (t.k === 'act') IN.fireHeld = false; } TOUCH.map.delete(e.pointerId); }
UIC.addEventListener('pointerup', tRelease); UIC.addEventListener('pointercancel', tRelease); UIC.addEventListener('lostpointercapture', tRelease);
addEventListener('wheel', e => { IN.wheel += Math.sign(e.deltaY); }, { passive: true });
// ── 毎こま：いまの状態をまとめる ──
const GP = { prev: [], ax: [0, 0], rep: 0 };
function inPoll(dt) {
  let mx = 0, my = 0;
  if (KEYS.a || KEYS.arrowleft) mx -= 1; if (KEYS.d || KEYS.arrowright) mx += 1; if (KEYS.w || KEYS.arrowup) my += 1; if (KEYS.s || KEYS.arrowdown) my -= 1;
  let run = !!KEYS.shift, aim = !!(KEYS.j || MOUSE.r);
  const s = TOUCH.stick;
  if (s) { const R = TOUCH.home.R; let dx = (s.x - s.sx) / R, dy = (s.y - s.sy) / R; const m = hyp(dx, dy); if (m > 1) { dx /= m; dy /= m; } if (m > 0.16) { mx += dx; my -= dy; if (m > 0.72) run = true; } }
  if (TOUCH.held.aim) aim = true;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (!gp) continue; const B = i => !!(gp.buttons[i] && gp.buttons[i].pressed), P = GP.prev;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, am = hyp(ax, ay);
    if (am > 0.2) { mx += ax; my -= ay; if (am > 0.85) run = true; IN.last = 'pad'; }
    if (B(12)) my += 1; if (B(13)) my -= 1; if (B(14)) mx -= 1; if (B(15)) mx += 1;
    const ed = (i, f) => { if (B(i) && !P[i]) { f(); IN.last = 'pad'; inEdge('any'); } };
    ed(0, () => { inEdge('ok'); if (aim || B(6) || B(4)) inEdge('fire'); else inEdge('act'); });
    ed(1, () => inEdge('cancel')); ed(2, () => inEdge('fire')); ed(7, () => inEdge('fire')); ed(3, () => inEdge('menu')); ed(8, () => inEdge('map')); ed(9, () => inEdge('esc')); ed(5, () => inEdge('reload'));
    ed(12, () => inEdge('up')); ed(13, () => inEdge('down')); ed(14, () => inEdge('left')); ed(15, () => inEdge('right'));
    // スティックで上下左右（メニュー用・押しっぱなしで繰り返し）
    const dir = am > 0.6 ? (abs(ax) > abs(ay) ? (ax > 0 ? 'right' : 'left') : (ay > 0 ? 'down' : 'up')) : null;
    if (dir) { if (GP.dir !== dir) { inEdge(dir); GP.rep = 0.35; } else { GP.rep -= dt; if (GP.rep <= 0) { inEdge(dir); GP.rep = 0.12; } } } GP.dir = dir;
    if (B(1)) run = true; if (B(6) || B(4)) aim = true;
    for (let i = 0; i < 17; i++) P[i] = B(i);
    break;
  }
  const m = hyp(mx, my); if (m > 1) { mx /= m; my /= m; }
  IN.mx = mx; IN.my = my; IN.mag = Math.min(1, m); IN.run = run; IN.aim = aim;
}

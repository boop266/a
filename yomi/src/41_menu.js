// 黄泉還：持ち物の画面・ファイル・地図・アイテムボックス・記録・設定・成績
// ── 持ち物の小さな絵（立体を一度だけ描いて写し取る） ──
const THUMB = { c: {}, sc: null, cam: null, rt: null };
function thumb(id) {
  if (THUMB.c[id]) return THUMB.c[id];
  if (!THUMB.sc) { THUMB.sc = new THREE.Scene(); THUMB.sc.add(new THREE.AmbientLight('#ffffff', 1.4)); const d = new THREE.DirectionalLight('#fff4e0', 2.2); d.position.set(1, 2, 2); THUMB.sc.add(d); THUMB.cam = new THREE.PerspectiveCamera(30, 1, 0.01, 20); THUMB.rt = new THREE.WebGLRenderTarget(96, 96); }
  const m = makeItemModel(id); const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()), r = Math.max(s.x, s.y, s.z) || 0.1;
  const g = new THREE.Group(); m.position.sub(c); g.add(m); g.rotation.set(0.55, -0.7, 0); THUMB.sc.add(g);
  THUMB.cam.position.set(0, 0, r * 2.4); THUMB.cam.lookAt(0, 0, 0);
  RD.r.setRenderTarget(THUMB.rt); RD.r.setClearColor('#000000', 0); RD.r.clear(); RD.r.render(THUMB.sc, THUMB.cam); RD.r.setRenderTarget(null); RD.r.setClearColor('#000000', 1);
  const px = new Uint8Array(96 * 96 * 4); RD.r.readRenderTargetPixels(THUMB.rt, 0, 0, 96, 96, px); THUMB.sc.remove(g);
  const cv = cnv(96, 96), x = cv.getContext('2d'), im = x.createImageData(96, 96);
  for (let y = 0; y < 96; y++) for (let i = 0; i < 96; i++) { const s0 = ((95 - y) * 96 + i) * 4, d0 = (y * 96 + i) * 4; for (let k = 0; k < 3; k++) im.data[d0 + k] = 255 * Math.pow(px[s0 + k] / 255, 1 / 2.2); im.data[d0 + 3] = px[s0 + 3]; }
  x.putImageData(im, 0, 0); THUMB.c[id] = cv; return cv;
}
// ── 持ち物の画面 ──
function openMenu(tab = 'item') { G.ui = { k: 'menu', tab, sel: 0, act: null, comb: null, ex: null, t: 0 }; AU.sfx('ok'); }
function menuAct(id) {
  const it = ITEMS[id], a = [];
  if (it.kind === 'heal') a.push(['使う', 'use']);
  if (it.kind === 'weapon') a.push(['装備', 'equip']);
  if (it.kind === 'key') a.push(['使う', 'use']);
  if (it.kind === 'ammo') a.push(['使う', 'use']);
  a.push(['調べる', 'ex'], ['組み合わせる', 'comb']);
  if (it.kind === 'key' && keyDone(id)) a.push(['捨てる', 'drop']);
  return a;
}
function keyDone(id) { const done = { gear: 'f:clock', key_small: 't:snakekey', key_hunt: 't:shotgun', handle: 'f:valve', key_hawk: 'f:hawkdone', key_snake: 'f:snakedone', key_wolf: 'f:wolfdone', key_base: 'f:basedone', reagA: 't:serum', reagB: 't:serum', serum: 'f:hayaSaved' }[id]; return !!done && condOK(done); }
function useItem(i) {
  const s = G.inv[i]; if (!s) return; const it = ITEMS[s.id];
  if (it.kind === 'heal') {
    if (s.id === 'herb_r') { say('赤のハーブだけでは、効き目がない。'); return; }
    if (it.heal && PL.hp >= 100 && !(it.cure && PL.poison)) { say('今は使う必要がない。'); return; }
    PL.hp = Math.min(100, PL.hp + (it.heal || 0)); if (it.cure) PL.poison = false; G.inv[i] = null; G.heals++; AU.sfx('ok'); say(`${it.name}を使った。`); return;
  }
  if (it.kind === 'weapon') { G.eq = s.id; AU.sfx('reload'); return; }
  if (it.kind === 'ammo') { const w = Object.keys(ITEMS).find(k => ITEMS[k].ammo === s.id); if (G.eq === w && invHas(w)) { G.ui = null; tryReload(true); } else say('装備している武器に合わない。'); return; }
  if (it.kind === 'key') { const near = nearActFor(s.id); if (near) { G.ui = null; doAct(near, s.id); } else say('ここでは使えないようだ。'); return; }
}
function nearActFor(id) { const R = G.room; for (const a of R.acts) { if (a.cond && !condOK(a.cond)) continue; if (hyp(a.p[0] - PL.x, a.p[1] - PL.z) < a.r + 0.4 && a.items && a.items.includes(id)) return a; } return null; }
function combine(i, j) {
  const a = G.inv[i], b = G.inv[j]; if (!a || !b || i === j) return false;
  const c = COMBOS.find(c => (c[0] === a.id && c[1] === b.id) || (c[1] === a.id && c[0] === b.id));
  if (c) { G.inv[i] = { id: c[2], n: 1 }; G.inv[j] = null; AU.sfx('ok'); say(`${ITEMS[c[2]].name}になった。`); return true; }
  // 弾と武器：込める
  const w = ITEMS[a.id].kind === 'weapon' ? a : ITEMS[b.id].kind === 'weapon' ? b : null, am = w === a ? b : a;
  if (w && ITEMS[w.id].ammo === am.id) { const need = ITEMS[w.id].mag - (G.mag[w.id] || 0); if (need <= 0) { say('弾はもう込めてある。'); return true; } const k = Math.min(need, am.n); am.n -= k; G.mag[w.id] = (G.mag[w.id] || 0) + k; if (am.n <= 0) G.inv[G.inv.indexOf(am)] = null; AU.sfx('reload'); say(`${ITEMS[w.id].name}に弾を込めた。`); return true; }
  if ((a.id === 'reagA' && b.id === 'reagB') || (a.id === 'reagB' && b.id === 'reagA')) { say('このまま混ぜてはいけない気がする。\n専用の機械が要りそうだ。'); return true; }
  say('組み合わせられない。'); return false;
}
function menuUpdate(dt) {
  const m = G.ui; m.t += dt;
  if (m.tab === 'file') return filesUpdate(m);
  if (m.tab === 'map') return mapUpdate(m);
  if (m.ex) { if (IN.e.cancel || IN.e.ok || IN.e.act || IN.ptr.length) { m.ex = null; AU.sfx('cancel'); } return; }
  if (uiTap()) return;
  if (m.act) {
    const n = m.act.length;
    if (IN.e.up) { m.asel = (m.asel + n - 1) % n; AU.sfx('tick'); } if (IN.e.down) { m.asel = (m.asel + 1) % n; AU.sfx('tick'); }
    if (IN.e.cancel) { m.act = null; AU.sfx('cancel'); return; }
    if (IN.e.ok || IN.e.act) menuDo(m.act[m.asel][1]);
    return;
  }
  const cols = 2;
  if (IN.e.left) { m.sel = m.sel % cols ? m.sel - 1 : m.sel; AU.sfx('tick'); }
  if (IN.e.right) { m.sel = m.sel % cols < cols - 1 ? m.sel + 1 : m.sel; AU.sfx('tick'); }
  if (IN.e.up) { m.sel = Math.max(0, m.sel - cols); AU.sfx('tick'); }
  if (IN.e.down) { m.sel = Math.min(INV_N, m.sel + cols); if (m.sel > INV_N) m.sel = INV_N; AU.sfx('tick'); }
  if (IN.e.tabR) { m.tab = 'file'; m.fsel = 0; m.page = null; AU.sfx('tick'); return; }
  if (IN.e.tabL || IN.e.map) { m.tab = 'map'; m.floor = ROOMS[G.rid].fl; AU.sfx('tick'); return; }
  if (IN.e.cancel || IN.e.menu) { if (m.comb != null) { m.comb = null; AU.sfx('cancel'); return; } G.ui = null; AU.sfx('cancel'); return; }
  if (IN.e.ok || IN.e.act) menuPick(m.sel);
}
function menuPick(i) {
  const m = G.ui; m.sel = i;
  if (i === INV_N) { G.eq = G.eq === 'knife' ? (G.lastGun && invHas(G.lastGun) ? G.lastGun : (['hg', 'sg', 'mg', 'gl'].find(invHas) || 'knife')) : 'knife'; if (G.eq === 'knife') G.lastGun = G.lastGun || 'hg'; AU.sfx('reload'); return; }
  const s = G.inv[i];
  if (m.comb != null) { const j = m.comb; m.comb = null; if (s) combine(j, i); return; }
  if (!s) return; m.act = menuAct(s.id); m.asel = 0; AU.sfx('ok');
}
function menuDo(k) {
  const m = G.ui, i = m.sel, s = G.inv[i]; m.act = null; if (!s) return;
  if (k === 'use') useItem(i);
  else if (k === 'equip') { if (G.eq !== 'knife') G.lastGun = s.id; G.eq = s.id; AU.sfx('reload'); }
  else if (k === 'ex') { m.ex = { id: s.id, t: 0 }; AU.sfx('ok'); }
  else if (k === 'comb') { m.comb = i; AU.sfx('ok'); }
  else if (k === 'drop') ask(`${ITEMS[s.id].name}を捨てますか？\n（もう使わない）`, ['捨てる', 'やめる'], c => { if (!c) { G.inv[i] = null; AU.sfx('ok'); } });
}
function ecg(x, y, w, h, cond, t) {
  const col = PL.poison ? '#b060ff' : ['#30e070', '#e8d040', '#ff3a2a'][cond], sp = [1, 1.4, 2.1][cond];
  UX.strokeStyle = 'rgba(40,80,60,0.6)'; UX.lineWidth = 1; for (let i = 0; i <= 8; i++) { UX.beginPath(); UX.moveTo(x + w * i / 8, y); UX.lineTo(x + w * i / 8, y + h); UX.stroke(); }
  UX.strokeStyle = col; UX.lineWidth = 2; UX.beginPath();
  for (let i = 0; i <= 100; i++) { const px = x + w * i / 100, ph = ((i / 100) * 2 - t * sp) % 1, p = ph < 0 ? ph + 1 : ph; let v = 0; if (p > 0.4 && p < 0.44) v = -0.15; else if (p >= 0.44 && p < 0.47) v = 0.85; else if (p >= 0.47 && p < 0.5) v = -0.45; else if (p > 0.58 && p < 0.66) v = 0.15 * Math.sin((p - 0.58) / 0.08 * PI); const py = y + h / 2 - v * h * 0.45; if (i) UX.lineTo(px, py); else UX.moveTo(px, py); }
  UX.stroke();
}
function drawMenuBG(title) { const u = U(); const g = UX.createLinearGradient(0, UB.y, 0, UB.y + UB.h); g.addColorStop(0, 'rgba(8,10,14,0.96)'); g.addColorStop(1, 'rgba(14,8,8,0.96)'); UX.fillStyle = g; UX.fillRect(UB.x, UB.y, UB.w, UB.h); txt(title, UB.x + u * 4, UB.y + u * 7, u * 4, '#c8b890', { f: FONT_MIN, w: 700 }); }
function drawTabs(cur) {
  const u = U(), tabs = [['item', 'アイテム'], ['file', 'ファイル'], ['map', '地図'], ['close', '閉じる']]; const w = u * 18, y = UB.y + u * 2.5;
  tabs.forEach(([k, s], i) => { const x = UB.x + UB.w - (tabs.length - i) * (w + u) - u * 2; UX.fillStyle = cur === k ? 'rgba(150,30,30,0.85)' : 'rgba(255,255,255,0.06)'; rr(x, y, w, u * 6, u); UX.fill(); txt(s, x + w / 2, y + u * 4.3, u * 3.2, cur === k ? '#fff' : '#a8a090', { a: 'center' }); hit(x, y, w, u * 6, () => { AU.sfx('tick'); if (k === 'close') { G.ui = null; return; } G.ui.tab = k; G.ui.page = null; G.ui.fsel = 0; G.ui.floor = ROOMS[G.rid].fl; }); });
}
// 持ち物の画面の並び：横持ち・パソコンは左に状態と装備、右に8つの枠。縦持ちは上に状態と装備、下に8つの枠
function menuGeom() {
  const u = U(), W = UB.w / u, port = W < 110;
  if (!port) { const cw = (W - 52 - 4 - 1.5) / 2; return { u, st: [4, 12, 44, 22], eq: [4, 37, 44, 20], kn: [4, 59, 44, 8], gx: 52, gy: 12, cw, ch: 12.1 }; }
  return { u, st: [4, 12, 43, 22], eq: [49, 12, 43, 22], kn: [4, 36.5, 88, 8], gx: 4, gy: 47, cw: 43.25, ch: 12.6 };
}
function drawMenu() {
  const m = G.ui, u = U(); if (m.tab === 'file') return drawFiles(m); if (m.tab === 'map') return drawMap(m);
  drawMenuBG('持ち物'); drawTabs('item');
  const cond = hpCond(), Gm = menuGeom(), X = v => UB.x + v * u, Y = v => UB.y + v * u;
  // 状態（心電図）
  { const [x0, y0, w0, h0] = Gm.st, sx = X(x0), sy = Y(y0); UX.fillStyle = 'rgba(0,20,10,0.6)'; rr(sx, sy, u * w0, u * h0, u); UX.fill(); ecg(sx + u * 2, sy + u * 2, u * (w0 - 4), u * (h0 - 9), cond, m.t);
    txt(PL.poison ? '毒' : ['良好', '注意', '危険'][cond], sx + u * 2, sy + u * (h0 - 2), u * 4.2, PL.poison ? '#c080ff' : ['#50f090', '#f0d850', '#ff5040'][cond], { w: 700 }); txt('CONDITION', sx + u * (w0 - 2), sy + u * (h0 - 2), u * 2.4, '#6a7a6a', { a: 'right' }); }
  // 装備
  { const [x0, y0, w0, h0] = Gm.eq, ex = X(x0), ey = Y(y0), ts = Math.min(18, h0 - 2); UX.fillStyle = 'rgba(30,20,10,0.6)'; rr(ex, ey, u * w0, u * h0, u); UX.fill();
    const w = G.eq, tx = ex + u * (ts + 2); if (w && (w === 'knife' || invHas(w))) { if (w !== 'knife') UX.drawImage(thumb(w), ex + u, ey + u * (h0 - ts) / 2, u * ts, u * ts); fitTxt(ITEMS[w].name, tx, ey + u * 7, ex + u * w0 - tx - u, u * 3.6, '#e8dcc0'); if (ITEMS[w].ammo) { txt(`${G.mag[w] || 0}`, tx, ey + u * (h0 - 5), u * 6, (G.mag[w] || 0) ? '#f0e0b0' : '#ff5040', { w: 700, f: 'monospace' }); txt(`/ ${invCount(ITEMS[w].ammo)}${G.inf && w === 'hg' ? ' ∞' : ''}`, tx + u * 11, ey + u * (h0 - 5), u * 3.2, '#a89880', { f: 'monospace' }); } } else txt('装備なし', tx, ey + u * h0 / 2 + u, u * 3.4, '#888'); }
  // ナイフの持ちかえ
  { const [x0, y0, w0, h0] = Gm.kn, kx = X(x0), ky = Y(y0), kw = u * w0, kh = u * h0, ks = m.sel === INV_N && !m.act; UX.fillStyle = ks ? 'rgba(150,30,30,0.7)' : 'rgba(255,255,255,0.05)'; rr(kx, ky, kw, kh, u); UX.fill(); txt(G.eq === 'knife' ? '銃に持ちかえる' : 'ナイフに持ちかえる', kx + kw / 2, ky + kh * 0.67, u * 3.2, '#d8d0c0', { a: 'center' }); hit(kx, ky, kw, kh, () => menuPick(INV_N)); }
  // 8つの枠
  const gx = X(Gm.gx), gy = Y(Gm.gy), cw = u * Gm.cw, h = u * Gm.ch;
  for (let i = 0; i < INV_N; i++) {
    const x = gx + (i % 2) * (cw + u * 1.5), y = gy + Math.floor(i / 2) * (h + u * 1.2), s = G.inv[i], on = m.sel === i;
    UX.fillStyle = on ? 'rgba(160,30,30,0.6)' : m.comb === i ? 'rgba(160,120,30,0.6)' : 'rgba(255,255,255,0.05)'; rr(x, y, cw, h, u * 0.8); UX.fill(); UX.strokeStyle = on ? '#e0b080' : 'rgba(200,190,160,0.25)'; UX.stroke();
    if (s) { UX.drawImage(thumb(s.id), x + u * 0.5, y + h / 2 - u * 5.5, u * 11, u * 11); fitTxt(ITEMS[s.id].name.replace(/（.*）/, ''), x + u * 12, y + u * 4.8, cw - u * 13, u * 2.8, '#d8d0c0'); if (ITEMS[s.id].stack) txt(String(s.n), x + cw - u * 1.2, y + h - u * 1.6, u * 3.6, '#f0e0a0', { a: 'right', w: 700, f: 'monospace' }); if (s.id === G.eq) txt('E', x + cw - u * 1.2, y + h - u * 1.6, u * 3, '#ff8060', { a: 'right', w: 700 }); }
    hit(x, y, cw, h, () => menuPick(i));
  }
  // 説明
  const s = m.sel < INV_N ? G.inv[m.sel] : null, dy = UB.y + UB.h - u * 17;
  UX.fillStyle = 'rgba(0,0,0,0.55)'; rr(UB.x + u * 4, dy, UB.w - u * 8, u * 14, u); UX.fill();
  if (m.comb != null) txt('組み合わせる相手を選んでください', UB.x + u * 7, dy + u * 8.5, u * 3.4, '#f0c870');
  else if (s) { txt(ITEMS[s.id].name, UB.x + u * 7, dy + u * 5.5, u * 3.6, '#f0e0c0', { w: 700 }); const ln = wrapText(ITEMS[s.id].desc, UB.w - u * 16, u * 3); ln.slice(0, 2).forEach((l, i) => txt(l, UB.x + u * 7, dy + u * 9.8 + i * u * 3.8, u * 3, '#c8c0b0')); }
  // 動作の小窓
  if (m.act) { const ax = gx + u * 6, ay = gy + u * 6, aw = u * 28, ah = u * 7; m.act.forEach(([lab, k], i) => { const y = ay + i * (ah + u * 0.6), on = i === m.asel; UX.fillStyle = on ? 'rgba(170,40,30,0.95)' : 'rgba(20,16,14,0.95)'; rr(ax, y, aw, ah, u * 0.8); UX.fill(); UX.strokeStyle = 'rgba(220,200,170,0.5)'; UX.stroke(); txt(lab, ax + aw / 2, y + ah * 0.68, u * 3.4, '#fff', { a: 'center' }); hit(ax, y, aw, ah, () => { m.asel = i; menuDo(k); }); }); hit(UB.x, UB.y, UB.w, UB.h, () => { m.act = null; }); UIR.unshift(UIR.pop()); }
  if (m.ex) drawExamine(m.ex);
}
function drawExamine(ex) {
  const u = U(); ex.t += 1 / 60; UX.fillStyle = 'rgba(0,0,0,0.88)'; UX.fillRect(UB.x, UB.y, UB.w, UB.h);
  const size = u * 46, cx = UB.x + UB.w / 2, cy = UB.y + u * 36; UX.save(); UX.translate(cx, cy); UX.scale(Math.cos(ex.t * 1.2) * 0.25 + 0.95, 1); UX.drawImage(thumb(ex.id), -size / 2, -size / 2, size, size); UX.restore();
  const it = ITEMS[ex.id]; txt(it.name, cx, UB.y + u * 66, u * 4.4, '#f0e0c0', { a: 'center', w: 700 }); wrapText(it.desc, UB.w - u * 20, u * 3.4).forEach((l, i) => txt(l, cx, UB.y + u * 74 + i * u * 4.6, u * 3.4, '#d0c8b8', { a: 'center' }));
}
// ── ファイル ──
function openFile(id) { G.ui = { k: 'menu', tab: 'file', fsel: Math.max(0, G.files.indexOf(id)), page: 0, solo: true, t: 0 }; AU.sfx('ok'); }
function filesUpdate(m) {
  if (uiTap()) return;
  if (m.page != null) {
    const f = FILES[G.files[m.fsel]];
    if (IN.e.right || IN.e.ok || IN.e.act || IN.e.down) { if (m.page < f.p.length - 1) { m.page++; AU.sfx('tick'); } else if (IN.e.ok || IN.e.act) { m.page = null; if (m.solo) G.ui = null; AU.sfx('cancel'); } }
    if (IN.e.left || IN.e.up) { if (m.page > 0) { m.page--; AU.sfx('tick'); } }
    if (IN.e.cancel) { m.page = null; if (m.solo) G.ui = null; AU.sfx('cancel'); }
    return;
  }
  const n = G.files.length;
  if (IN.e.up && n) { m.fsel = (m.fsel + n - 1) % n; AU.sfx('tick'); } if (IN.e.down && n) { m.fsel = (m.fsel + 1) % n; AU.sfx('tick'); }
  if ((IN.e.ok || IN.e.act) && n) { m.page = 0; AU.sfx('ok'); }
  if (IN.e.tabR || IN.e.map) { m.tab = 'map'; m.floor = ROOMS[G.rid].fl; AU.sfx('tick'); } if (IN.e.tabL) { m.tab = 'item'; AU.sfx('tick'); }
  if (IN.e.cancel || IN.e.menu) { G.ui = null; AU.sfx('cancel'); }
}
function drawFiles(m) {
  const u = U(); drawMenuBG('ファイル'); if (!m.solo) drawTabs('file');
  if (m.page != null) {
    const f = FILES[G.files[m.fsel]], px = UB.x + u * 10, py = UB.y + u * 11, pw = UB.w - u * 20, ph = UB.h - u * 22;
    const g = UX.createLinearGradient(px, py, px + pw, py + ph); g.addColorStop(0, '#d6ccb2'); g.addColorStop(1, '#bfb090'); UX.fillStyle = g; UX.fillRect(px, py, pw, ph);
    UX.fillStyle = 'rgba(90,60,30,0.08)'; for (let i = 0; i < 6; i++) UX.fillRect(px + (i * 97 % pw), py, 2, ph);
    txt(f.t, px + pw / 2, py + u * 7, u * 4.2, '#2a1e12', { a: 'center', f: FONT_MIN, w: 700 });
    const lines = wrapText(f.p[m.page], pw - u * 12, u * 3.5, FONT_MIN); lines.forEach((l, i) => txt(l, px + u * 6, py + u * 15 + i * u * 5.2, u * 3.5, '#2a2018', { f: FONT_MIN }));
    txt(`${m.page + 1} / ${f.p.length}`, px + pw / 2, py + ph - u * 3, u * 2.8, '#5a4a38', { a: 'center' });
    if (m.page > 0) { txt('◀', px + u * 3, py + ph / 2, u * 5, '#6a5a40', { a: 'center' }); hit(UB.x, py, u * 14, ph, () => { m.page--; AU.sfx('tick'); }); }
    hit(px + pw - u * 14, py, u * 24, ph, () => { if (m.page < f.p.length - 1) { m.page++; AU.sfx('tick'); } else { m.page = null; if (m.solo) G.ui = null; } });
    if (m.page < f.p.length - 1) txt('▶', px + pw - u * 3, py + ph / 2, u * 5, '#6a5a40', { a: 'center' });
    return;
  }
  if (!G.files.length) { txt('まだ何も見つけていない。', UB.x + UB.w / 2, UB.y + UB.h / 2, u * 3.6, '#888', { a: 'center' }); return; }
  G.files.forEach((id, i) => { const y = UB.y + u * (14 + i * 6.8), on = i === m.fsel; if (on) { UX.fillStyle = 'rgba(150,30,30,0.55)'; UX.fillRect(UB.x + u * 6, y - u * 4.6, UB.w - u * 12, u * 6.2); } txt(FILES[id].t, UB.x + u * 10, y, u * 3.6, on ? '#fff' : '#c8bca8', { f: FONT_MIN }); hit(UB.x + u * 6, y - u * 4.6, UB.w - u * 12, u * 6.2, () => { m.fsel = i; m.page = 0; AU.sfx('ok'); }); });
}
// ── 地図 ──
function mapUpdate(m) {
  if (uiTap()) return; const fls = mapFloors();
  if (IN.e.left || IN.e.up) { m.floor = fls[(fls.indexOf(m.floor) + fls.length - 1) % fls.length]; AU.sfx('tick'); }
  if (IN.e.right || IN.e.down) { m.floor = fls[(fls.indexOf(m.floor) + 1) % fls.length]; AU.sfx('tick'); }
  if (IN.e.tabL) { m.tab = 'file'; AU.sfx('tick'); } if (IN.e.tabR) { m.tab = 'item'; AU.sfx('tick'); }
  if (IN.e.cancel || IN.e.menu || IN.e.map || IN.e.ok || IN.e.act) { G.ui = null; AU.sfx('cancel'); }
}
function mapFloors() { return ['1F', '2F', 'B1', 'LAB'].filter(f => G.maps[f] || Object.keys(G.visited).some(r => ROOMS[r] && ROOMS[r].fl === f)); }
function drawMap(m) {
  const u = U(); drawMenuBG('地図'); drawTabs('map'); const fl = m.floor || ROOMS[G.rid].fl;
  const fls = mapFloors(); fls.forEach((f, i) => { const x = UB.x + u * 4, y = UB.y + u * (14 + i * 8); UX.fillStyle = f === fl ? 'rgba(150,30,30,0.7)' : 'rgba(255,255,255,0.06)'; rr(x, y, u * 22, u * 6.5, u); UX.fill(); txt(FLOORS[f], x + u * 11, y + u * 4.5, u * 2.8, '#e0d8c8', { a: 'center' }); hit(x, y, u * 22, u * 6.5, () => { m.floor = f; AU.sfx('tick'); }); });
  const rooms = Object.keys(ROOMS).filter(r => ROOMS[r].fl === fl && ROOMS[r].map && (G.maps[fl] || G.visited[r]));
  if (!rooms.length) return;
  const all = rooms.map(r => ROOMS[r].map), x0 = Math.min(...all.map(a => a[0])), y0 = Math.min(...all.map(a => a[1])), x1 = Math.max(...all.map(a => a[0] + a[2])), y1 = Math.max(...all.map(a => a[1] + a[3]));
  const ax = UB.x + u * 30, ay = UB.y + u * 12, aw = UB.w - u * 34, ah = UB.h - u * 18, sc = Math.min(aw / (x1 - x0), ah / (y1 - y0)), ox = ax + (aw - (x1 - x0) * sc) / 2, oy = ay + (ah - (y1 - y0) * sc) / 2;
  for (const r of rooms) {
    const a = ROOMS[r].map, X = ox + (a[0] - x0) * sc, Y = oy + (a[1] - y0) * sc, W2 = a[2] * sc, H2 = a[3] * sc, here = r === G.rid, vis = G.visited[r];
    UX.fillStyle = here ? 'rgba(200,60,40,0.55)' : vis ? 'rgba(60,110,90,0.55)' : 'rgba(80,80,80,0.25)'; UX.fillRect(X, Y, W2, H2); UX.strokeStyle = vis ? '#a8d0b8' : '#706858'; UX.lineWidth = 1.5; UX.strokeRect(X, Y, W2, H2);
    if (W2 > u * 10) txt(ROOMS[r].name, X + W2 / 2, Y + H2 / 2 + u, Math.min(u * 2.6, W2 / 6), '#e8e0d0', { a: 'center' });
    // 扉の印
    const D = ROOMS[r], rect = D.rects ? D.rects.reduce((p, q) => [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[2], q[2]), Math.max(p[3], q[3])]) : [-D.w / 2, -D.d / 2, D.w / 2, D.d / 2];
    for (const d of D.doors || []) { if (!d.to) continue; const k = doorPair(r, d), lk = d.lock && !G.open[k]; const px = X + (d.p[0] - rect[0]) / (rect[2] - rect[0]) * W2, py = Y + (d.p[1] - rect[1]) / (rect[3] - rect[1]) * H2; UX.fillStyle = lk ? (G.lockSeen[k] ? '#ff4030' : '#c8b890') : '#60b0ff'; UX.fillRect(px - 3, py - 3, 6, 6); }
    if (here) { const px = X + (PL.x - rect[0]) / (rect[2] - rect[0]) * W2, py = Y + (PL.z - rect[1]) / (rect[3] - rect[1]) * H2; UX.fillStyle = '#ffe080'; UX.save(); UX.translate(px, py); UX.rotate(-PL.ang + PI); UX.beginPath(); UX.moveTo(0, -u * 1.6); UX.lineTo(u * 1.1, u * 1.1); UX.lineTo(-u * 1.1, u * 1.1); UX.fill(); UX.restore(); }
  }
}
// ── アイテムボックス ──
function openBox() { G.ui = { k: 'box', side: 0, sel: 0, bsel: 0 }; AU.sfx('ok'); }
function boxUpdate() {
  const b = G.ui; if (uiTap()) return;
  if (IN.e.cancel || IN.e.menu) { G.ui = null; AU.sfx('cancel'); return; }
  if (IN.e.left) { b.side = 0; AU.sfx('tick'); } if (IN.e.right) { b.side = 1; AU.sfx('tick'); }
  const n = b.side ? Math.max(1, G.box.length + 1) : INV_N;
  if (IN.e.up) { if (b.side) b.bsel = (b.bsel + n - 1) % n; else b.sel = (b.sel + n - 1) % n; AU.sfx('tick'); }
  if (IN.e.down) { if (b.side) b.bsel = (b.bsel + 1) % n; else b.sel = (b.sel + 1) % n; AU.sfx('tick'); }
  if (IN.e.ok || IN.e.act) boxMove(b.side, b.side ? b.bsel : b.sel);
}
function boxMove(side, i) {
  if (side === 0) { const s = G.inv[i]; if (!s) return; const st = ITEMS[s.id].stack; const ex = st && G.box.find(q => q.id === s.id); if (ex) ex.n += s.n; else G.box.push({ ...s }); G.inv[i] = null; if (G.eq === s.id) { } AU.sfx('ok'); }
  else { const s = G.box[i]; if (!s) return; if (!canFit(s.id, ITEMS[s.id].stack ? 1 : 1)) { say('持ち物がいっぱいだ。'); return; } if (ITEMS[s.id].stack) { let n = s.n; const cap = ITEMS[s.id].stack; let moved = 0; for (const q of G.inv) if (q && q.id === s.id && q.n < cap) { const k = Math.min(n, cap - q.n); q.n += k; n -= k; moved += k; } while (n > 0) { const j = G.inv.indexOf(null); if (j < 0) break; const k = Math.min(n, cap); G.inv[j] = { id: s.id, n: k }; n -= k; moved += k; } s.n -= moved; if (s.n <= 0) G.box.splice(i, 1); } else { invAdd(s.id, 1); G.box.splice(i, 1); } AU.sfx('ok'); }
}
function drawBox() {
  const b = G.ui, u = U(); drawMenuBG('アイテムボックス');
  txt('持ち物', UB.x + u * 6, UB.y + u * 13, u * 3.2, '#a8a090'); txt('ボックス', UB.x + UB.w / 2 + u * 2, UB.y + u * 13, u * 3.2, '#a8a090');
  const rowH = u * 7.2;
  for (let i = 0; i < INV_N; i++) { const s = G.inv[i], x = UB.x + u * 4, y = UB.y + u * 15 + i * rowH, w = UB.w / 2 - u * 6, on = b.side === 0 && b.sel === i; UX.fillStyle = on ? 'rgba(150,30,30,0.6)' : 'rgba(255,255,255,0.04)'; rr(x, y, w, rowH - u * 0.8, u * 0.6); UX.fill(); if (s) { UX.drawImage(thumb(s.id), x + u * 0.5, y, rowH - u, rowH - u); txt(ITEMS[s.id].name, x + rowH + u, y + rowH * 0.62, u * 3, '#e0d8c8'); if (ITEMS[s.id].stack) txt(String(s.n), x + w - u * 2, y + rowH * 0.62, u * 3.2, '#f0e0a0', { a: 'right', f: 'monospace' }); } hit(x, y, w, rowH - u * 0.8, () => { b.side = 0; b.sel = i; boxMove(0, i); }); }
  const start = Math.max(0, b.bsel - 7);
  for (let k = 0; k < Math.min(9, G.box.length + 1); k++) { const i = start + k; if (i > G.box.length) break; const s = G.box[i], x = UB.x + UB.w / 2 + u * 2, y = UB.y + u * 15 + k * rowH, w = UB.w / 2 - u * 6, on = b.side === 1 && b.bsel === i; UX.fillStyle = on ? 'rgba(150,30,30,0.6)' : 'rgba(255,255,255,0.04)'; rr(x, y, w, rowH - u * 0.8, u * 0.6); UX.fill(); if (s) { UX.drawImage(thumb(s.id), x + u * 0.5, y, rowH - u, rowH - u); txt(ITEMS[s.id].name, x + rowH + u, y + rowH * 0.62, u * 3, '#e0d8c8'); if (ITEMS[s.id].stack) txt(String(s.n), x + w - u * 2, y + rowH * 0.62, u * 3.2, '#f0e0a0', { a: 'right', f: 'monospace' }); } else txt('（空き）', x + u * 3, y + rowH * 0.62, u * 2.8, '#6a6458'); hit(x, y, w, rowH - u * 0.8, () => { b.side = 1; b.bsel = i; boxMove(1, i); }); }
  const cx = UB.x + UB.w - u * 16; UX.fillStyle = 'rgba(255,255,255,0.08)'; rr(cx, UB.y + u * 2.5, u * 12, u * 6, u); UX.fill(); txt('閉じる', cx + u * 6, UB.y + u * 6.8, u * 3, '#d8d0c0', { a: 'center' }); hit(cx, UB.y + u * 2.5, u * 12, u * 6, () => { G.ui = null; AU.sfx('cancel'); });
}
// ── 記録（タイプライター）と読み込み ──
const SLOTS = 3;
function saveKey(i) { return 'yomi_save_' + i; }
function readSlot(i) { try { return JSON.parse(localStorage.getItem(saveKey(i)) || 'null'); } catch (e) { return null; } }
function hasSave() { for (let i = 0; i < SLOTS; i++) if (readSlot(i)) return true; return false; }
function snapshot() { return { v: 1, rid: G.rid, pl: { x: PL.x, z: PL.z, y: PL.y, ang: PL.ang, hp: PL.hp, poison: PL.poison }, inv: G.inv, box: G.box, eq: G.eq, lastGun: G.lastGun, mag: G.mag, flags: G.flags, taken: G.taken, killed: G.killed, open: G.open, files: G.files, maps: G.maps, visited: G.visited, time: G.time, saves: G.saves, heals: G.heals, kills: G.kills, shots: G.shots, corpses: G.corpses || [], drops: G.drops || {}, lockSeen: G.lockSeen, inf: G.inf, when: Date.now(), place: ROOMS[G.rid].name }; }
function openSave() { G.ui = { k: 'save', sel: 0 }; AU.sfx('type'); }
function openLoad(fromDeath) { G.ui = { k: 'load', sel: 0, fromDeath }; AU.sfx('ok'); }
function slotUpdate() {
  const s = G.ui; if (uiTap()) return;
  if (IN.e.up) { s.sel = (s.sel + SLOTS - 1) % SLOTS; AU.sfx('tick'); } if (IN.e.down) { s.sel = (s.sel + 1) % SLOTS; AU.sfx('tick'); }
  if (IN.e.cancel) { G.ui = null; AU.sfx('cancel'); if (s.fromDeath) toTitle(); return; }
  if (IN.e.ok || IN.e.act) slotPick(s.sel);
}
function slotPick(i) {
  const s = G.ui;
  if (s.k === 'save') { G.saves++; invTake('ribbon', 1); const d = snapshot(); try { localStorage.setItem(saveKey(i), JSON.stringify(d)); } catch (e) { } G.ui = null; AU.sfx('type'); say('記録した。'); }
  else { const d = readSlot(i); if (!d) { AU.sfx('cancel'); return; } G.ui = null; loadGame(d); }
}
function drawSlots() {
  const s = G.ui, u = U(); drawMenuBG(s.k === 'save' ? 'どこに記録しますか' : 'どの記録から始めますか');
  for (let i = 0; i < SLOTS; i++) { const d = readSlot(i), x = UB.x + u * 8, y = UB.y + u * (16 + i * 22), w = UB.w - u * 16, h = u * 18, on = i === s.sel; UX.fillStyle = on ? 'rgba(150,30,30,0.6)' : 'rgba(255,255,255,0.05)'; rr(x, y, w, h, u); UX.fill(); UX.strokeStyle = 'rgba(200,190,160,0.3)'; UX.stroke();
    txt(`記録 ${i + 1}`, x + u * 4, y + u * 7, u * 3.6, '#e8dcc0', { w: 700 });
    if (d) { txt(d.place, x + u * 4, y + u * 13, u * 3.4, '#d0c8b8'); txt(`遊んだ時間 ${fmtTime(d.time)}　記録 ${d.saves}回`, x + w - u * 4, y + u * 7, u * 2.8, '#a8a090', { a: 'right' }); const dt = new Date(d.when); txt(`${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`, x + w - u * 4, y + u * 13, u * 2.8, '#8a8478', { a: 'right' }); }
    else txt('―　なし　―', x + w / 2, y + u * 11, u * 3, '#6a6458', { a: 'center' });
    hit(x, y, w, h, () => { s.sel = i; slotPick(i); }); }
  txt('もどる', UB.x + UB.w / 2, UB.y + UB.h - u * 5, u * 3.2, '#a8a090', { a: 'center' }); hit(UB.x + UB.w / 2 - u * 12, UB.y + UB.h - u * 10, u * 24, u * 8, () => { G.ui = null; AU.sfx('cancel'); if (s.fromDeath) toTitle(); });
}
function loadGame(d) {
  newGame(); Object.assign(G, { inv: d.inv, box: d.box, eq: d.eq, lastGun: d.lastGun, mag: d.mag, flags: d.flags, taken: d.taken, killed: d.killed, open: d.open, files: d.files, maps: d.maps, visited: d.visited, time: d.time, saves: d.saves, heals: d.heals, kills: d.kills || 0, shots: d.shots || 0, corpses: d.corpses || [], drops: d.drops || {}, lockSeen: d.lockSeen || {}, inf: !!d.inf, timer: null });
  Object.assign(PL, { hp: d.pl.hp, poison: d.pl.poison, dead: false, grab: null }); PL.st = { t: 0, mode: 'idle', hp: PL.hp }; resetPlayerModel();
  G.mode = 'play'; G.fade = 1; G.fadeTo = 0; enterRoom(d.rid, { x: d.pl.x, z: d.pl.z, y: d.pl.y, ang: d.pl.ang }); AU.music(G.room.D.music || '');
}
// ── 設定 ──
function openOpts() { G.ui = { k: 'opts', sel: 0 }; }
function optList() { return [
  ['操作', OPT.ctrl === 'tank' ? 'ラジコン（上で前進・左右で回る）' : 'かんたん（倒した方向に進む）', d => { OPT.ctrl = OPT.ctrl === 'tank' ? 'easy' : 'tank'; }],
  ['扉を開ける場面', OPT.door === 'short' ? '短く' : 'ふつう', d => { OPT.door = OPT.door === 'short' ? 'normal' : 'short'; }],
  ['画面', OPT.gfx === 'crisp' ? 'くっきり' : 'あの頃の粗さ', d => { OPT.gfx = OPT.gfx === 'crisp' ? 'retro' : 'crisp'; layout(); }],
  ['画面の明るさ', '■'.repeat((OPT.bright ?? 2) + 1) + '□'.repeat(4 - (OPT.bright ?? 2)), d => { OPT.bright = clamp((OPT.bright ?? 2) + d, 0, 4); layout(); }],
  ['音楽の大きさ', '■'.repeat(Math.round(OPT.bgm * 10)) + '□'.repeat(10 - Math.round(OPT.bgm * 10)), d => { OPT.bgm = clamp(Math.round((OPT.bgm + d * 0.1) * 10) / 10, 0, 1); AU.vol(); }],
  ['効果音の大きさ', '■'.repeat(Math.round(OPT.sfx * 10)) + '□'.repeat(10 - Math.round(OPT.sfx * 10)), d => { OPT.sfx = clamp(Math.round((OPT.sfx + d * 0.1) * 10) / 10, 0, 1); AU.vol(); AU.sfx('tick'); }],
  ['操作の説明', '', () => { G.ui.help = !G.ui.help; }],
  ['もどる', '', () => { G.ui = null; }],
]; }
function optsUpdate() {
  const o = G.ui, L = optList(); if (uiTap()) { saveOpt(); return; }
  if (o.help) { if (IN.e.any || IN.ptr.length) o.help = false; return; }
  if (IN.e.up) { o.sel = (o.sel + L.length - 1) % L.length; AU.sfx('tick'); } if (IN.e.down) { o.sel = (o.sel + 1) % L.length; AU.sfx('tick'); }
  if (IN.e.left) { L[o.sel][2](-1); saveOpt(); } if (IN.e.right) { L[o.sel][2](1); saveOpt(); }
  if (IN.e.ok || IN.e.act) { L[o.sel][2](1); saveOpt(); AU.sfx('ok'); }
  if (IN.e.cancel || IN.e.esc) { G.ui = null; saveOpt(); AU.sfx('cancel'); }
}
function drawOpts() {
  const o = G.ui, u = U(); drawMenuBG('設定');
  if (o.help) { const L = ['【キーボード】', '移動：WASD・矢印　走る：Shift', '構える：J（押している間）／マウス右', '撃つ：構えながら K・Space・マウス左', '調べる：E・Space・Enter', '持ち物：Tab・I　地図：M　弾を込める：R', '【ゲームパッド】', 'スティック：移動　B：走る　LT：構える', 'RT・X：撃つ　A：調べる　Y：持ち物', '【スマホ】左で動く（大きく倒すと走る）', '右の◎で構え、構えながら手のボタンで撃つ', 'つかまれたら、なんでもいいから連打']; L.forEach((s, i) => txt(s, UB.x + u * 8, UB.y + u * (15 + i * 6), u * 3.2, s.startsWith('【') ? '#f0c890' : '#d8d0c0')); return; }
  optList().forEach(([k, v, fn], i) => { const y = UB.y + u * (16 + i * 10), on = i === o.sel; if (on) { UX.fillStyle = 'rgba(150,30,30,0.55)'; UX.fillRect(UB.x + u * 6, y - u * 5.5, UB.w - u * 12, u * 8); } txt(k, UB.x + u * 9, y, u * 3.6, on ? '#fff' : '#c8bca8'); txt(v, UB.x + UB.w - u * 9, y, u * 3, '#e8d0a0', { a: 'right' }); hit(UB.x + u * 6, y - u * 5.5, UB.w - u * 12, u * 8, () => { o.sel = i; fn(1); saveOpt(); AU.sfx('tick'); }); });
}
// ── 成績 ──
function drawResults() {
  const r = G.ui, u = U(); drawMenuBG('記録'); const cx = UB.x + UB.w / 2;
  const rows = [['クリア時間', fmtTime(r.time)], ['記録した回数', r.saves + '回'], ['使った回復', r.heals + '個'], ['倒した数', r.kills + ''], ['早瀬', r.haya ? '生還' : '帰らなかった']];
  rows.forEach(([k, v], i) => { txt(k, cx - u * 4, UB.y + u * (22 + i * 8), u * 3.6, '#a8a090', { a: 'right' }); txt(v, cx + u * 4, UB.y + u * (22 + i * 8), u * 3.8, '#f0e0c0', { w: 700 }); });
  txt('評価', cx, UB.y + u * 70, u * 3.4, '#a8a090', { a: 'center' }); txt(r.rank, cx, UB.y + u * 84, u * 13, { S: '#ffd060', A: '#e8e0d0', B: '#b0a890', C: '#8a7a6a' }[r.rank], { a: 'center', f: FONT_MIN, w: 700 });
  if (r.note) txt(r.note, cx, UB.y + u * 93, u * 2.8, '#d0a070', { a: 'center' });
}
function resultsUpdate() { if (G.ui.t === undefined) G.ui.t = 0; G.ui.t += 1 / 60; if (G.ui.t > 1.5 && (IN.e.ok || IN.e.act || IN.e.cancel || IN.ptr.length)) { G.ui = null; toTitle(); } }

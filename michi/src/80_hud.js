// ════════════════ 画面の文字・地図・タイトル ════════════════
function pill(x, y, text, sub) { const U = ctx; U.save(); U.font = `bold 21px ${JP}`; const tw = U.measureText(text).width; U.font = `14px ${JP}`; const sw = sub ? U.measureText(sub).width : 0; const w = Math.max(tw, sw) + 34, h = sub ? 62 : 42; U.fillStyle = 'rgba(12,14,20,.55)'; U.beginPath(); U.roundRect(x, y, w, h, 12); U.fill(); U.fillStyle = '#fff'; U.textBaseline = 'top'; U.font = `bold 21px ${JP}`; U.fillText(text, x + 17, y + 10); if (sub) { U.fillStyle = 'rgba(255,255,255,.78)'; U.font = `14px ${JP}`; U.fillText(sub, x + 17, y + 38) } U.restore() }
function rings(x, y) {
  const U = ctx, vals = [P.hunger / 100, P.thirst / 100, P.stam / 100, P.hp / 100], ic = [['#f0a24a', 'food'], ['#5aaef0', 'water'], ['#9ad870', 'stam'], ['#e8556a', 'hp']];
  let n = 0;
  vals.forEach((v, i) => {
    const al = clamp((.42 - v) * 5, 0, 1); if (al <= 0) return; const cx = x + n * 54, cy = y, [col, kk] = ic[i]; n++; U.save(); U.globalAlpha = al * .9; U.fillStyle = 'rgba(12,14,20,.5)'; U.beginPath(); U.arc(cx, cy, 22, 0, 7); U.fill(); U.lineWidth = 4; U.strokeStyle = 'rgba(255,255,255,.18)'; U.beginPath(); U.arc(cx, cy, 18, 0, 7); U.stroke(); U.strokeStyle = v < .2 ? (G.gameT % 1 < .5 ? '#ff5040' : col) : col; U.beginPath(); U.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); U.stroke(); U.fillStyle = col; U.beginPath();
    if (kk === 'food') { U.arc(cx, cy + 2, 7, 0, 7); U.fill(); U.fillStyle = '#7aa040'; U.fillRect(cx - 1, cy - 9, 2, 5) } else if (kk === 'water') { U.moveTo(cx, cy - 9); U.quadraticCurveTo(cx + 8, cy + 2, cx, cy + 8); U.quadraticCurveTo(cx - 8, cy + 2, cx, cy - 9); U.fill() }
    else if (kk === 'stam') { U.moveTo(cx + 3, cy - 10); U.lineTo(cx - 5, cy + 2); U.lineTo(cx, cy + 2); U.lineTo(cx - 3, cy + 10); U.lineTo(cx + 6, cy - 3); U.lineTo(cx + 1, cy - 3); U.closePath(); U.fill() }
    else { U.moveTo(cx, cy + 8); U.bezierCurveTo(cx - 12, cy - 2, cx - 5, cy - 11, cx, cy - 4); U.bezierCurveTo(cx + 5, cy - 11, cx + 12, cy - 2, cx, cy + 8); U.fill() } U.restore()
  })
}
function itemIcon(U, id, cx, cy, s) {
  const it = IT[id]; U.save(); U.translate(cx, cy); U.scale(s, s); U.fillStyle = it.c; U.strokeStyle = 'rgba(0,0,0,.5)'; U.lineWidth = 1.5;
  switch (id) {
    case 'water': case 'juice': case 'tea': U.beginPath(); U.roundRect(-6, -12, 12, 24, 4); U.fill(); U.stroke(); U.fillStyle = '#fff'; U.fillRect(-4, -15, 8, 4); break;
    case 'onigiri': U.beginPath(); U.moveTo(0, -11); U.lineTo(11, 9); U.lineTo(-11, 9); U.closePath(); U.fill(); U.stroke(); U.fillStyle = '#1a2a1a'; U.fillRect(-6, 2, 12, 7); break;
    case 'key_staff': U.beginPath(); U.arc(-5, 0, 6, 0, 7); U.fill(); U.fillRect(0, -2, 13, 4); U.fillRect(9, 2, 3, 4); break;
    case 'crowbar': U.save(); U.rotate(-.8); U.fillRect(-14, -2, 28, 4); U.fillRect(10, -2, 4, 8); U.restore(); break;
    case 'jerry_full': case 'jerry_empty': U.beginPath(); U.roundRect(-9, -10, 18, 22, 3); U.fill(); U.stroke(); U.fillRect(-3, -15, 8, 6); break;
    case 'bread': U.beginPath(); U.ellipse(0, 0, 13, 8, 0, 0, 7); U.fill(); U.stroke(); break;
    case 'can': U.beginPath(); U.roundRect(-8, -10, 16, 20, 3); U.fill(); U.stroke(); U.fillStyle = '#c84a3a'; U.fillRect(-8, -3, 16, 6); break;
    case 'bandage': U.beginPath(); U.roundRect(-12, -6, 24, 12, 4); U.fill(); U.stroke(); U.fillStyle = '#e05050'; U.fillRect(-2, -5, 4, 10); break;
    case 'battery': U.fillRect(-6, -10, 12, 20); U.fillStyle = '#ddd'; U.fillRect(-3, -13, 6, 3); break;
    case 'lighter': U.fillRect(-5, -8, 10, 18); U.fillStyle = '#c8ccd2'; U.fillRect(-5, -12, 10, 5); U.fillStyle = '#ffb040'; U.beginPath(); U.ellipse(1, -16, 3, 5, 0, 0, 7); U.fill(); break;
    case 'wood': U.fillStyle = '#8a6440'; for (let i = 0; i < 3; i++) { U.beginPath(); U.roundRect(-12, -9 + i * 6, 24, 5, 2); U.fill() } break;
    case 'omamori': U.beginPath(); U.roundRect(-7, -11, 14, 22, 3); U.fill(); U.fillStyle = '#f0d070'; U.fillRect(-4, -4, 8, 8); break;
    case 'coin': U.fillStyle = '#c8c8c0'; U.beginPath(); U.arc(0, 0, 10, 0, 7); U.fill(); U.stroke(); U.fillStyle = '#9a9a92'; U.font = 'bold 9px sans-serif'; U.textAlign = 'center'; U.fillText('100', 0, 3); break;
    case 'map_town': case 'map_road': case 'map_park': U.beginPath(); U.moveTo(-12, -9); U.lineTo(-4, -11); U.lineTo(4, -9); U.lineTo(12, -11); U.lineTo(12, 9); U.lineTo(4, 11); U.lineTo(-4, 9); U.lineTo(-12, 11); U.closePath(); U.fill(); U.stroke(); U.strokeStyle = 'rgba(0,0,0,.25)'; U.beginPath(); U.moveTo(-4, -11); U.lineTo(-4, 9); U.moveTo(4, -9); U.lineTo(4, 11); U.stroke(); U.strokeStyle = '#c84a3a'; U.lineWidth = 1.5; U.beginPath(); U.moveTo(-9, 5); U.lineTo(-2, -2); U.lineTo(6, 2); U.stroke(); break;
    default: U.beginPath(); U.roundRect(-10, -8, 20, 16, 3); U.fill(); U.stroke()
  } U.restore()
}
function hud() {
  const U = ctx; U.save(); U.setTransform(1, 0, 0, 1, 0, 0); U.globalAlpha = 1; U.globalCompositeOperation = 'source-over';
  const D = dayInfo(G.t), V = view({ x: camX, y: camY, z: camZ }, camK);
  if (G.title) { drawTitle(U); U.restore(); return }
  if (G.sleep) { const s = G.sleep, a = clamp(s.t < 2.2 ? s.t / 1.2 : (4.4 - s.t) / 1.2, 0, 1); U.fillStyle = `rgba(4,4,10,${a})`; U.fillRect(0, 0, CW, CH); U.restore(); return }
  if (G.photo) { U.fillStyle = 'rgba(0,0,0,.92)'; U.fillRect(0, 0, CW, 46); U.fillRect(0, CH - 46, CW, 46); U.fillStyle = 'rgba(255,255,255,.75)'; U.font = `15px ${JP}`; U.textAlign = 'center'; U.fillText('写真　P／クリックで撮る　Esc でもどる', CW / 2, CH - 18); if (G.flash > 0) { U.fillStyle = `rgba(255,255,255,${G.flash * 2})`; U.fillRect(0, 0, CW, CH); G.flash -= 1 / 60 } U.restore(); return }
  const look = !!G.look;
  if (!look) {
    // 体のぐあい：減ってきたときだけ、うっすら見える
    rings(42, CH - 42);
    // 持ち物
    for (const [i, s] of invSlots().entries()) { U.globalAlpha = .82; U.fillStyle = 'rgba(12,14,20,.42)'; U.beginPath(); U.roundRect(s.x, s.y, s.w, s.h, 9); U.fill(); U.globalAlpha = 1; itemIcon(U, s.id, s.x + s.w / 2, s.y + 21, .9); U.fillStyle = 'rgba(255,255,255,.85)'; U.font = `10px ${JP}`; U.textAlign = 'center'; U.fillText(IT[s.id].n.slice(0, 6), s.x + s.w / 2, s.y + 49); if (G.inv[s.id] > 1) { U.font = `bold 11px ${JP}`; U.fillText('×' + G.inv[s.id], s.x + s.w - 11, s.y + 12) } U.textAlign = 'left' }
    // 目の前のもの（小さく）
    if (!G.ride && !P.climb && !P.act && !G.note && !G.mapOpen && !G.rideOn) { const it = interactables()[0]; if (it) { const m = V.p(it.x, it.y, it.z); const v = verbOf(it); U.font = `bold 13px ${JP}`; U.textAlign = 'center'; const tx = m[0], ty = m[1] - 22; U.fillStyle = 'rgba(0,0,0,.55)'; U.fillText(v, tx + 1, ty + 1); U.fillStyle = 'rgba(255,248,230,.95)'; U.fillText(v, tx, ty); U.textAlign = 'left' } }
    if (P.act) { const m = V.p(P.x, P.y, P.z + 2.4); U.fillStyle = 'rgba(0,0,0,.4)'; U.fillRect(m[0] - 40, m[1] - 8, 80, 4); U.fillStyle = 'rgba(255,240,200,.9)'; U.fillRect(m[0] - 40, m[1] - 8, 80 * P.act.t / P.act.dur, 4); U.font = `12px ${JP}`; U.textAlign = 'center'; U.fillStyle = 'rgba(0,0,0,.5)'; U.fillText(P.act.label, m[0] + 1, m[1] - 15); U.fillStyle = '#fff'; U.fillText(P.act.label, m[0], m[1] - 16); U.textAlign = 'left' }
  } else if (G.look.t < 4) { U.globalAlpha = clamp(4 - G.look.t, 0, 1) * .8; U.font = `13px ${JP}`; U.textAlign = 'center'; U.fillStyle = '#fff'; U.fillText(G.touchUI ? 'なぞって見回す　「調べる」でもどる' : '移動キーで見回す　E でもどる', CW / 2, CH - 30); U.globalAlpha = 1 }
  // ともだちのひとこと
  if (F.sayT > 0 && F.say) { const m = V.p(F.x, F.y, F.z + 2.5);
    if (m[0] < 0 || m[0] > CW || m[1] < 40 || m[1] > CH) { U.font = `bold 18px ${JP}`; U.globalAlpha = clamp(F.sayT, 0, 1); U.textAlign = 'center'; U.fillStyle = 'rgba(0,0,0,.6)'; U.fillText(`「${F.say}」`, CW / 2 + 2, CH - 98 + 2); U.fillStyle = '#fff4e0'; U.fillText(`「${F.say}」`, CW / 2, CH - 98); U.globalAlpha = 1 } else { U.font = `bold 15px ${JP}`; const w = U.measureText(F.say).width + 24; const x = clamp(m[0], w / 2 + 8, CW - w / 2 - 8), y = clamp(m[1], 70, CH - 60); U.globalAlpha = clamp(F.sayT, 0, 1); U.fillStyle = 'rgba(255,255,255,.95)'; U.beginPath(); U.roundRect(x - w / 2, y - 44, w, 30, 12); U.fill(); U.beginPath(); U.moveTo(x - 6, y - 15); U.lineTo(m[0], y - 5); U.lineTo(x + 6, y - 15); U.fill(); U.fillStyle = '#1d3a3a'; U.textAlign = 'center'; U.fillText(F.say, x, y - 24); U.globalAlpha = 1 } }
  // 心の声・できごと（字幕のように、下に小さく）
  G.msgs.forEach((m, i) => { if (!m.t) return; U.globalAlpha = clamp(m.life, 0, 1); U.font = `15px ${JP}`; U.textAlign = 'center'; const y = CH - 104 - (G.msgs.length - 1 - i) * 24; U.fillStyle = 'rgba(0,0,0,.65)'; U.fillText(m.t, CW / 2 + 1, y + 1); U.fillStyle = m.col === '#fff' ? 'rgba(255,252,240,.95)' : m.col; U.fillText(m.t, CW / 2, y) }); U.globalAlpha = 1; U.textAlign = 'left';
  // ケガ
  if (G.hurtT > 0) { const g = U.createRadialGradient(CW / 2, CH / 2, CH * .3, CW / 2, CH / 2, CW * .7); g.addColorStop(0, 'rgba(200,0,0,0)'); g.addColorStop(1, `rgba(200,0,0,${G.hurtT})`); U.fillStyle = g; U.fillRect(0, 0, CW, CH) }
  // エレベーター
  if (G.ride) { const r = G.ride, f = r.t / r.dur, a = clamp(1 - Math.abs(f - .5) * 2.4, 0, 1); U.fillStyle = `rgba(10,10,14,${a})`; U.fillRect(0, 0, CW, CH); if (a > .5) { U.fillStyle = '#ff9a40'; U.font = `bold 64px monospace`; U.textAlign = 'center'; const fl = Math.round(lerp(r.from, r.to, clamp((f - .25) * 2, 0, 1))); U.fillText(fl === 8 ? '展' : String(fl + 1), CW / 2, CH / 2 + 20); U.font = `16px ${JP}`; U.fillStyle = '#ccc'; U.fillText('ウィーン……', CW / 2, CH / 2 + 60) } }
  if (G.mapOpen) drawPaperMap(U, G.mapOpen);
  if (G.note) { U.fillStyle = 'rgba(0,0,0,.55)'; U.fillRect(0, 0, CW, CH); const lines = G.note.text.split('\n'), w = 620, h = 96 + lines.length * 32; U.fillStyle = '#f4efe0'; U.beginPath(); U.roundRect(CW / 2 - w / 2, CH / 2 - h / 2, w, h, 8); U.fill(); U.strokeStyle = 'rgba(120,100,70,.35)'; U.lineWidth = 1; for (let i = 0; i < lines.length; i++) { U.beginPath(); U.moveTo(CW / 2 - w / 2 + 30, CH / 2 - h / 2 + 92 + i * 32); U.lineTo(CW / 2 + w / 2 - 30, CH / 2 - h / 2 + 92 + i * 32); U.stroke() } U.fillStyle = '#3a2a1a'; U.font = `bold 21px ${JPM}`; U.textAlign = 'center'; U.fillText(G.note.title, CW / 2, CH / 2 - h / 2 + 42); U.font = `18px ${JPM}`; lines.forEach((l, i) => U.fillText(l, CW / 2, CH / 2 - h / 2 + 84 + i * 32)) }
  if (G.touchUI && !G.note && !G.mapOpen) { U.globalAlpha = .7; for (const [k2, b] of Object.entries(BTN)) { if (k2 === 'map' && !paperMaps().length) continue; if (look && k2 !== 'act') continue; U.fillStyle = 'rgba(255,255,255,.16)'; U.beginPath(); U.arc(b.x, b.y, b.r, 0, 7); U.fill(); U.strokeStyle = 'rgba(255,255,255,.32)'; U.lineWidth = 2; U.stroke(); U.fillStyle = '#fff'; U.font = `bold ${k2 === 'act' ? 17 : 13}px ${JP}`; U.textAlign = 'center'; U.textBaseline = 'middle'; U.fillText(look && k2 === 'act' ? 'もどる' : b.t, b.x, b.y) } if (touch.on) { U.strokeStyle = 'rgba(255,255,255,.35)'; U.lineWidth = 3; U.beginPath(); U.arc(touch.sx, touch.sy, 60, 0, 7); U.stroke(); U.fillStyle = 'rgba(255,255,255,.45)'; U.beginPath(); U.arc(touch.x, touch.y, 24, 0, 7); U.fill() } U.globalAlpha = 1; U.textBaseline = 'alphabetic' }
  // 暗転からはじまる
  if (G.fade > 0) { U.fillStyle = `rgba(0,0,0,${clamp(G.fade / 2, 0, 1)})`; U.fillRect(0, 0, CW, CH); G.fade -= 1 / 60 }
  U.restore();
}
function drawTitle(U) {
  const t = G.gameT; U.fillStyle = 'rgba(8,8,16,.35)'; U.fillRect(0, 0, CW, CH);
  const g = U.createLinearGradient(0, CH * .25, 0, CH * .75); g.addColorStop(0, 'rgba(10,8,20,0)'); g.addColorStop(.5, 'rgba(10,8,20,.45)'); g.addColorStop(1, 'rgba(10,8,20,0)'); U.fillStyle = g; U.fillRect(0, 0, CW, CH);
  U.textAlign = 'center'; U.fillStyle = 'rgba(0,0,0,.4)'; U.font = `bold 66px ${JPM}`; U.fillText('果てなき道', CW / 2 + 3, CH / 2 - 52); U.fillStyle = '#f4ead6'; U.fillText('果てなき道', CW / 2, CH / 2 - 55);
  U.font = `18px ${JPM}`; U.fillStyle = 'rgba(244,234,214,.85)'; U.fillText('だれもいない世界を、ともだちと歩く。', CW / 2, CH / 2 - 12);
  for (const b of titleButtons()) { const hov = false; U.fillStyle = 'rgba(244,234,214,.12)'; U.beginPath(); U.roundRect(b.x, b.y, b.w, b.h, 25); U.fill(); U.strokeStyle = 'rgba(244,234,214,.55)'; U.lineWidth = 1.5; U.stroke(); U.fillStyle = '#f4ead6'; U.font = `bold 20px ${JP}`; U.fillText(b.t, CW / 2, b.y + 32) }
  U.font = `13px ${JP}`; U.fillStyle = 'rgba(244,234,214,.6)'; U.fillText('移動 WASD・矢印 ／ 走る Shift ／ 調べる E ／ 押しのける F ／ 休む Z ／ 地図 M ／ 写真 P ／ 見回す 右ドラッグ ／ 遠く・近く ホイール', CW / 2, CH - 34);
  U.fillText(hasSave() ? 'キー：N はじめから ／ C つづきから' : 'なにかキーで はじめる', CW / 2, CH - 58);
}
// ───────── 紙の地図（拾ったものだけ。自分の居場所は書いていない） ─────────
const MAPS = [];
function defMap(id, title, x0, y0, x1, y1, labels, opt = {}) { MAPS.push({ id, title, x0, y0, x1, y1, labels, opt }) }
const paperMaps = () => MAPS.filter(m => has(m.id) || m.id === G.mapOpen);
function buildPaperMap(m) {
  const w = m.x1 - m.x0, h = m.y1 - m.y0, S = Math.min(1060 / w, 560 / h), cv2 = mkCanvas(Math.ceil(w * S), Math.ceil(h * S)), g = cv2.getContext('2d');
  g.fillStyle = '#efe6cf'; g.fillRect(0, 0, cv2.width, cv2.height);
  const C = { [TG.grass]: '#dfe3bf', [TG.bank]: '#dfe3bf', [TG.forest]: '#b9cfa0', [TG.field]: '#e6dfb0', [TG.water]: '#9cc6dc', [TG.pond]: '#9cc6dc', [TG.sea]: '#8fbcd6', [TG.beach]: '#efe0b4', [TG.road]: '#ffffff', [TG.walk]: '#f6f0e2', [TG.lane]: '#fbf8f0', [TG.bridge]: '#ffffff', [TG.plaza]: '#f2e6cc', [TG.lot]: '#e8e2d6', [TG.gravel]: '#d6d0c6', [TG.platform]: '#ddd6c8', [TG.tactile]: '#ddd6c8', [TG.sand]: '#efe0b4', [TG.yard]: '#ead8b0', [TG.dirt]: '#e4d2a8', [TG.stone]: '#e0dccf', [TG.sgravel]: '#e8e4da', [TG.rock]: '#c8c2b4', [TG.parkpath]: '#f7ecd2' };
  for (let y = m.y0; y < m.y1; y++)for (let x = m.x0; x < m.x1; x++) { if (x < 0 || y < 0 || x >= GW || y >= GH) continue; const k = key(x, y); let col = LEV[0].bid[k] ? (m.opt.bcol || '#d9b48f') : C[GT[k]] || C[TG.grass]; if (GT[k] >= 100 && !LEV[0].bid[k]) col = '#f2e6cc'; g.fillStyle = col; g.fillRect((x - m.x0) * S, (y - m.y0) * S, Math.ceil(S), Math.ceil(S)) }
  // 線路
  g.strokeStyle = '#5a5248'; g.lineWidth = Math.max(2, S * .5); g.setLineDash([S * 2, S * 2]); for (const yy of [13.5, 17]) { g.beginPath(); g.moveTo(0, (yy - m.y0) * S); g.lineTo(cv2.width, (yy - m.y0) * S); g.stroke() } g.setLineDash([]);
  if (m.opt.draw) m.opt.draw(g, S, m);
  // 木の点
  for (const t of TREES) { if (t.fx < m.x0 || t.fx > m.x1 || t.fy < m.y0 || t.fy > m.y1 || hash(t.fx, t.fy) > (m.opt.trees || .35)) continue; g.fillStyle = 'rgba(90,130,70,.55)'; g.beginPath(); g.arc((t.fx - m.x0) * S, (t.fy - m.y0) * S, Math.max(1.2, S * .5), 0, 7); g.fill() }
  g.textAlign = 'center'; for (const [x, y, t, big] of m.labels) { g.font = `bold ${big ? 17 : 13}px ${JP}`; const px = (x - m.x0) * S, py = (y - m.y0) * S; g.lineWidth = 4; g.strokeStyle = 'rgba(244,236,214,.95)'; g.strokeText(t, px, py); g.fillStyle = big ? '#7a2a1a' : '#3a2a1a'; g.fillText(t, px, py) }
  // 方位
  const nx = cv2.width - 34, ny = 38; g.fillStyle = '#3a2a1a'; g.beginPath(); g.moveTo(nx, ny - 18); g.lineTo(nx + 7, ny + 6); g.lineTo(nx, ny); g.lineTo(nx - 7, ny + 6); g.closePath(); g.fill(); g.font = `bold 12px ${JP}`; g.fillText('北', nx, ny + 22);
  return cv2;
}
function drawPaperMap(U, id) {
  const m = MAPS.find(q => q.id === id); if (!m) return; if (!m.cv) m.cv = buildPaperMap(m);
  U.fillStyle = 'rgba(0,0,0,.6)'; U.fillRect(0, 0, CW, CH);
  // 斜めに見ている絵とそろえるため、地図も同じ向きに少し傾けて置く
  const w = m.cv.width, h = m.cv.height, ox = CW / 2, oy = CH / 2 + 8;
  U.save(); U.translate(ox, oy); U.rotate(-.025); U.fillStyle = 'rgba(0,0,0,.35)'; U.fillRect(-w / 2 - 14, -h / 2 - 50, w + 36, h + 76); U.fillStyle = '#f4ecd6'; U.fillRect(-w / 2 - 20, -h / 2 - 56, w + 40, h + 80); U.drawImage(m.cv, -w / 2, -h / 2);
  U.strokeStyle = 'rgba(120,100,70,.25)'; U.lineWidth = 1; for (const f of [-.33, .33]) { U.beginPath(); U.moveTo(f * w, -h / 2 - 56); U.lineTo(f * w, h / 2 + 24); U.stroke() }
  U.fillStyle = '#5a3a2a'; U.font = `bold 22px ${JPM}`; U.textAlign = 'center'; U.fillText(m.title, 0, -h / 2 - 22);
  U.font = `12px ${JP}`; U.fillStyle = '#8a7a6a'; U.fillText(paperMaps().length > 1 ? 'M：つぎの地図　Esc：しまう' : 'M／Esc：しまう', 0, h / 2 + 18); U.restore();
}

// 地図の中身（印刷された名前だけ。自分がどこにいるかは書いていない）
defMap('map_town', 'はてのまち　観光マップ', 0, 6, 138, 124, [[DCX, DCY - 10, '電波塔', 1], [STX + 12, STY - 2, 'はてのまち駅', 1], [JX + 5, JY - 2, 'はてのみや神社'], [46, 92, 'あおば公園'], [SX + 15, SY - 2, 'はてのまち小学校'], [KX + 5, KY - 1, 'コンビニ'], [GX + 4, GY - 2, 'ガソリンスタンド'], [96, 76, '中央通り'], [128, 50, 'はて川'], [26, 46, '住宅街'], [126, 66, 'はて大橋']]);
defMap('map_road', '道路地図　はて川〜灯台岬', 0, 0, GW, GH, [[60, 64, 'はてのまち', 1], [128, 40, 'はて川'], [124, 10, '鉄橋'], [178, 20, 'ひかりが丘ランド', 1], [232, 16, 'ひかりが丘', 1], [244, 104, '灯台岬', 1], [246, 70, '太平洋'], [228, 58, 'はまなす海岸'], [170, 76, '国道', 0], [180, 86, 'P'], [DCX, DCY - 6, '電波塔']], { trees: .12 });
defMap('map_park', 'ひかりが丘ランド　園内マップ', 143, 22, 214, 70, [[WC[0], WC[1] - 4, '観覧車', 1], [CC[0], CC[1] - 6, 'メリーゴーランド', 1], [203, 52, 'ジェットコースター', 1], [154, 46, 'お化け屋敷'], [168, 49, 'スワンボート'], [170, 59, 'おみやげ'], [189, 51, 'レストラン'], [189, 59, '救護室'], [FC[0], FC[1] + 3, '噴水'], [FCK[0], FCK[1] - 3, '花時計'], [170, 24, '屋台村'], [180, 66, '入口', 1], [203, 30, '管理棟（関係者以外）']], { bcol: '#f0b8a0', trees: .9 });

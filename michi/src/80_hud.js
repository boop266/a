// ════════════════ 画面の文字・地図・タイトル ════════════════
function pill(x, y, text, sub) { const U = ctx; U.save(); U.font = `bold 21px ${JP}`; const tw = U.measureText(text).width; U.font = `14px ${JP}`; const sw = sub ? U.measureText(sub).width : 0; const w = Math.max(tw, sw) + 34, h = sub ? 62 : 42; U.fillStyle = 'rgba(12,14,20,.55)'; U.beginPath(); U.roundRect(x, y, w, h, 12); U.fill(); U.fillStyle = '#fff'; U.textBaseline = 'top'; U.font = `bold 21px ${JP}`; U.fillText(text, x + 17, y + 10); if (sub) { U.fillStyle = 'rgba(255,255,255,.78)'; U.font = `14px ${JP}`; U.fillText(sub, x + 17, y + 38) } U.restore() }
function rings(x, y) {
  const U = ctx, vals = [P.hunger / 100, P.thirst / 100, P.stam / 100, P.hp / 100], ic = [['#f0a24a', 'food'], ['#5aaef0', 'water'], ['#9ad870', 'stam'], ['#e8556a', 'hp']];
  vals.forEach((v, i) => {
    const cx = x + i * 54, cy = y, [col, kk] = ic[i]; U.save(); U.fillStyle = 'rgba(12,14,20,.55)'; U.beginPath(); U.arc(cx, cy, 22, 0, 7); U.fill(); U.lineWidth = 4; U.strokeStyle = 'rgba(255,255,255,.18)'; U.beginPath(); U.arc(cx, cy, 18, 0, 7); U.stroke(); U.strokeStyle = v < .25 ? (G.gameT % 1 < .5 ? '#ff5040' : col) : col; U.beginPath(); U.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * v); U.stroke(); U.fillStyle = col; U.beginPath();
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
    default: U.beginPath(); U.roundRect(-10, -8, 20, 16, 3); U.fill(); U.stroke()
  } U.restore()
}
function hud() {
  const U = ctx; U.save(); U.setTransform(1, 0, 0, 1, 0, 0); U.globalAlpha = 1; U.globalCompositeOperation = 'source-over';
  const D = dayInfo(G.t), V = view({ x: camX, y: camY, z: camZ }, camK);
  if (G.title) { drawTitle(U); U.restore(); return }
  if (G.sleep) { const s = G.sleep, a = clamp(s.t < 2.2 ? s.t / 1.2 : (4.4 - s.t) / 1.2, 0, 1); U.fillStyle = `rgba(4,4,10,${a})`; U.fillRect(0, 0, CW, CH); if (a > .6) { U.fillStyle = '#d8d0e8'; U.font = `20px ${JPM}`; U.textAlign = 'center'; U.fillText(s.done ? '……朝' : 'Zzz……', CW / 2, CH / 2) } U.restore(); return }
  if (G.photo) { U.fillStyle = 'rgba(0,0,0,.92)'; U.fillRect(0, 0, CW, 46); U.fillRect(0, CH - 46, CW, 46); U.fillStyle = 'rgba(255,255,255,.75)'; U.font = `15px ${JP}`; U.textAlign = 'center'; U.fillText('写真モード　P／クリックで撮る（画像が保存されます）　Esc でもどる', CW / 2, CH - 18); if (G.flash > 0) { U.fillStyle = `rgba(255,255,255,${G.flash * 2})`; U.fillRect(0, 0, CW, CH); G.flash -= 1 / 60 } U.restore(); return }
  const cine = !!G.cine;
  if (cine) { U.fillStyle = 'rgba(0,0,0,.9)'; U.fillRect(0, 0, CW, 54); U.fillRect(0, CH - 54, CW, 54) }
  if (!cine) {
    const pn = placeName(); const a = clamp(G.placeT, 0, 1); pill(20, 18, pn, `${clockStr()}${P.z > .5 ? `　地上 ${altitude()}m` : ''}${G.power ? '　電気あり' : ''}`);
    rings(42, CH - 42);
    for (const [i, s] of invSlots().entries()) { U.fillStyle = 'rgba(12,14,20,.6)'; U.beginPath(); U.roundRect(s.x, s.y, s.w, s.h, 10); U.fill(); itemIcon(U, s.id, s.x + s.w / 2, s.y + 22, 1); U.fillStyle = '#fff'; U.font = `11px ${JP}`; U.textAlign = 'center'; U.fillText(IT[s.id].n.slice(0, 6), s.x + s.w / 2, s.y + 52); if (G.inv[s.id] > 1) { U.font = `bold 12px ${JP}`; U.fillText('×' + G.inv[s.id], s.x + s.w - 12, s.y + 13) } U.textAlign = 'left'; U.fillStyle = 'rgba(255,255,255,.4)'; U.font = `10px ${JP}`; U.fillText(i + 1, s.x + 5, s.y + 12) }
    if (!G.ride && !P.climb && !P.act && !G.note && !G.mapOpen) { const it = interactables()[0]; if (it) { const m = V.p(it.x, it.y, it.z); const v = verbOf(it); U.font = `bold 15px ${JP}`; const w = U.measureText(v).width + 44; U.fillStyle = 'rgba(12,14,20,.74)'; U.beginPath(); U.roundRect(m[0] - w / 2, m[1] - 46, w, 30, 10); U.fill(); U.fillStyle = '#ffd27a'; U.beginPath(); U.arc(m[0] - w / 2 + 16, m[1] - 31, 10, 0, 7); U.fill(); U.fillStyle = '#1a1a1a'; U.font = `bold 13px ${JP}`; U.textAlign = 'center'; U.fillText(G.touchUI ? '◎' : 'E', m[0] - w / 2 + 16, m[1] - 27); U.fillStyle = '#fff'; U.font = `bold 15px ${JP}`; U.textAlign = 'left'; U.fillText(v, m[0] - w / 2 + 32, m[1] - 26) } }
    if (P.act) { const m = V.p(P.x, P.y, P.z + 2.4); U.fillStyle = 'rgba(12,14,20,.72)'; U.beginPath(); U.roundRect(m[0] - 96, m[1] - 40, 192, 34, 10); U.fill(); U.fillStyle = '#ffd27a'; U.fillRect(m[0] - 84, m[1] - 14, 168 * P.act.t / P.act.dur, 4); U.fillStyle = '#fff'; U.font = `13px ${JP}`; U.textAlign = 'center'; U.fillText(P.act.label, m[0], m[1] - 21) }
  }
  // ともだちのひとこと
  if (F.sayT > 0 && F.say) { const m = V.p(F.x, F.y, F.z + 2.5);
    // ともだちが画面の外（名場面でカメラが離れているとき）は、字幕のように下に出す
    if (m[0] < 0 || m[0] > CW || m[1] < 40 || m[1] > CH) { U.font = `bold 19px ${JP}`; U.globalAlpha = clamp(F.sayT, 0, 1); U.textAlign = 'center'; U.fillStyle = 'rgba(0,0,0,.6)'; U.fillText(`「${F.say}」`, CW / 2 + 2, CH - 88 + 2); U.fillStyle = '#fff4e0'; U.fillText(`「${F.say}」`, CW / 2, CH - 88); U.globalAlpha = 1 } else { U.font = `bold 15px ${JP}`; const w = U.measureText(F.say).width + 24; const x = clamp(m[0], w / 2 + 8, CW - w / 2 - 8), y = clamp(m[1], 70, CH - 60); U.globalAlpha = clamp(F.sayT, 0, 1); U.fillStyle = 'rgba(255,255,255,.95)'; U.beginPath(); U.roundRect(x - w / 2, y - 44, w, 30, 12); U.fill(); U.beginPath(); U.moveTo(x - 6, y - 15); U.lineTo(m[0], y - 5); U.lineTo(x + 6, y - 15); U.fill(); U.fillStyle = '#1d3a3a'; U.textAlign = 'center'; U.fillText(F.say, x, y - 24); U.globalAlpha = 1 } }
  G.msgs.forEach((m, i) => { U.globalAlpha = clamp(m.life, 0, 1); U.font = `bold 17px ${JP}`; const w = U.measureText(m.t).width + 30; U.fillStyle = 'rgba(12,14,20,.72)'; U.beginPath(); U.roundRect(CW / 2 - w / 2, (cine ? 64 : 96) + i * 40, w, 32, 10); U.fill(); U.fillStyle = m.col; U.textAlign = 'center'; U.fillText(m.t, CW / 2, (cine ? 86 : 118) + i * 40) }); U.globalAlpha = 1;
  // ケガ
  if (G.hurtT > 0) { const g = U.createRadialGradient(CW / 2, CH / 2, CH * .3, CW / 2, CH / 2, CW * .7); g.addColorStop(0, 'rgba(200,0,0,0)'); g.addColorStop(1, `rgba(200,0,0,${G.hurtT})`); U.fillStyle = g; U.fillRect(0, 0, CW, CH) }
  // エレベーター
  if (G.ride) { const r = G.ride, f = r.t / r.dur, a = clamp(1 - Math.abs(f - .5) * 2.4, 0, 1); U.fillStyle = `rgba(10,10,14,${a})`; U.fillRect(0, 0, CW, CH); if (a > .5) { U.fillStyle = '#ff9a40'; U.font = `bold 64px monospace`; U.textAlign = 'center'; const fl = Math.round(lerp(r.from, r.to, clamp((f - .25) * 2, 0, 1))); U.fillText(fl === 8 ? '展' : String(fl + 1), CW / 2, CH / 2 + 20); U.font = `16px ${JP}`; U.fillStyle = '#ccc'; U.fillText('ウィーン……', CW / 2, CH / 2 + 60) } }
  if (G.mapOpen) drawMap(U);
  if (G.note) { U.fillStyle = 'rgba(0,0,0,.55)'; U.fillRect(0, 0, CW, CH); const lines = G.note.text.split('\n'), w = 620, h = 96 + lines.length * 32; U.fillStyle = '#f4efe0'; U.beginPath(); U.roundRect(CW / 2 - w / 2, CH / 2 - h / 2, w, h, 8); U.fill(); U.strokeStyle = 'rgba(120,100,70,.35)'; U.lineWidth = 1; for (let i = 0; i < lines.length; i++) { U.beginPath(); U.moveTo(CW / 2 - w / 2 + 30, CH / 2 - h / 2 + 92 + i * 32); U.lineTo(CW / 2 + w / 2 - 30, CH / 2 - h / 2 + 92 + i * 32); U.stroke() } U.fillStyle = '#3a2a1a'; U.font = `bold 21px ${JPM}`; U.textAlign = 'center'; U.fillText(G.note.title, CW / 2, CH / 2 - h / 2 + 42); U.font = `18px ${JPM}`; lines.forEach((l, i) => U.fillText(l, CW / 2, CH / 2 - h / 2 + 84 + i * 32)); U.font = `13px ${JP}`; U.fillStyle = '#8a7a6a'; U.fillText('（なにかキー／タップでとじる）', CW / 2, CH / 2 + h / 2 - 12) }
  if (G.chapter) { const a = clamp(G.chapterT / 2, 0, 1); U.fillStyle = `rgba(4,4,10,${a * .85})`; U.fillRect(0, 0, CW, CH); U.globalAlpha = a; U.fillStyle = '#f0e6d0'; U.textAlign = 'center'; U.font = `bold 40px ${JPM}`; U.fillText('第一章　灯りのない町', CW / 2, CH / 2 - 30); U.font = `20px ${JPM}`; U.fillStyle = '#c8bca8'; U.fillText('線路の先、東の果てに、灯りがひとつ。', CW / 2, CH / 2 + 22); U.fillText('ふたりの旅は、つづく。', CW / 2, CH / 2 + 56); if (G.chapterT > 2) { U.font = `14px ${JP}`; U.fillStyle = 'rgba(255,255,255,.6)'; U.fillText('（なにかキー／タップで、この町をもう少し歩く）', CW / 2, CH / 2 + 120) } U.globalAlpha = 1 }
  if (G.touchUI && !cine && !G.note && !G.mapOpen) { U.globalAlpha = .78; for (const [k2, b] of Object.entries(BTN)) { U.fillStyle = 'rgba(255,255,255,.18)'; U.beginPath(); U.arc(b.x, b.y, b.r, 0, 7); U.fill(); U.strokeStyle = 'rgba(255,255,255,.35)'; U.lineWidth = 2; U.stroke(); U.fillStyle = '#fff'; U.font = `bold ${k2 === 'act' ? 18 : 13}px ${JP}`; U.textAlign = 'center'; U.textBaseline = 'middle'; U.fillText(b.t, b.x, b.y) } if (touch.on) { U.strokeStyle = 'rgba(255,255,255,.4)'; U.lineWidth = 3; U.beginPath(); U.arc(touch.sx, touch.sy, 60, 0, 7); U.stroke(); U.fillStyle = 'rgba(255,255,255,.5)'; U.beginPath(); U.arc(touch.x, touch.y, 24, 0, 7); U.fill() } U.globalAlpha = 1; U.textBaseline = 'alphabetic' }
  U.restore();
}
function drawTitle(U) {
  const t = G.gameT; U.fillStyle = 'rgba(8,8,16,.35)'; U.fillRect(0, 0, CW, CH);
  const g = U.createLinearGradient(0, CH * .25, 0, CH * .75); g.addColorStop(0, 'rgba(10,8,20,0)'); g.addColorStop(.5, 'rgba(10,8,20,.45)'); g.addColorStop(1, 'rgba(10,8,20,0)'); U.fillStyle = g; U.fillRect(0, 0, CW, CH);
  U.textAlign = 'center'; U.fillStyle = 'rgba(0,0,0,.4)'; U.font = `bold 66px ${JPM}`; U.fillText('果てなき道', CW / 2 + 3, CH / 2 - 52); U.fillStyle = '#f4ead6'; U.fillText('果てなき道', CW / 2, CH / 2 - 55);
  U.font = `18px ${JPM}`; U.fillStyle = 'rgba(244,234,214,.85)'; U.fillText('電気の止まった町。ともだちと、てっぺんまで。', CW / 2, CH / 2 - 12);
  for (const b of titleButtons()) { const hov = false; U.fillStyle = 'rgba(244,234,214,.12)'; U.beginPath(); U.roundRect(b.x, b.y, b.w, b.h, 25); U.fill(); U.strokeStyle = 'rgba(244,234,214,.55)'; U.lineWidth = 1.5; U.stroke(); U.fillStyle = '#f4ead6'; U.font = `bold 20px ${JP}`; U.fillText(b.t, CW / 2, b.y + 32) }
  U.font = `13px ${JP}`; U.fillStyle = 'rgba(244,234,214,.6)'; U.fillText('移動 WASD・矢印 ／ 走る Shift ／ 調べる E ／ 押しのける F ／ 休む Z ／ 地図 M ／ 写真 P ／ スマホは画面をタップ', CW / 2, CH - 34);
  U.fillText(hasSave() ? 'キー：N はじめから ／ C つづきから' : 'なにかキーで はじめる', CW / 2, CH - 58);
}
function drawMap(U) {
  U.fillStyle = 'rgba(0,0,0,.6)'; U.fillRect(0, 0, CW, CH); const S = 4.2, W2 = GW * S, H2 = GH * S, ox = CW / 2 - W2 / 2, oy = CH / 2 - H2 / 2 + 10;
  if (!drawMap.base) { const m = mkCanvas(GW, GH), g = m.getContext('2d'), im = g.createImageData(GW, GH); const C = { [TG.grass]: [196, 200, 150], [TG.road]: [120, 116, 108], [TG.walk]: [170, 164, 150], [TG.plaza]: [190, 180, 160], [TG.dirt]: [200, 176, 130], [TG.field]: [210, 196, 140], [TG.forest]: [130, 150, 104], [TG.water]: [120, 160, 190], [TG.pond]: [120, 160, 190], [TG.lot]: [150, 146, 138], [TG.gravel]: [140, 130, 120], [TG.platform]: [180, 176, 168], [TG.tactile]: [210, 190, 100], [TG.sand]: [220, 204, 160], [TG.stone]: [170, 166, 156], [TG.bridge]: [150, 146, 140], [TG.bank]: [176, 186, 140], [TG.yard]: [214, 194, 150], [TG.lane]: [140, 136, 128], [TG.sgravel]: [200, 196, 188] }; for (let k = 0; k < N; k++) { const c = LEV[0].bid[k] ? [110, 90, 70] : C[GT[k]] || [200, 196, 170]; im.data[k * 4] = c[0]; im.data[k * 4 + 1] = c[1]; im.data[k * 4 + 2] = c[2]; im.data[k * 4 + 3] = 255 } g.putImageData(im, 0, 0); drawMap.base = m }
  U.save(); U.fillStyle = '#e8dcc0'; U.beginPath(); U.roundRect(ox - 20, oy - 50, W2 + 40, H2 + 70, 10); U.fill(); U.imageSmoothingEnabled = false; U.drawImage(drawMap.base, ox, oy, W2, H2);
  if (!drawMap.fog || G.gameT - (drawMap.fogT || 0) > 1) { const f = drawMap.fog || mkCanvas(GW, GH), g = f.getContext('2d'), im = g.createImageData(GW, GH); for (let k = 0; k < N; k++) { if (!G.explored[k]) { im.data[k * 4] = 232; im.data[k * 4 + 1] = 220; im.data[k * 4 + 2] = 192; im.data[k * 4 + 3] = 235 } } g.putImageData(im, 0, 0); drawMap.fog = f; drawMap.fogT = G.gameT }
  U.imageSmoothingEnabled = true; U.drawImage(drawMap.fog, ox, oy, W2, H2);
  U.fillStyle = '#5a4a3a'; U.font = `bold 22px ${JPM}`; U.textAlign = 'center'; U.fillText('はてのまち　手書きの地図', CW / 2, oy - 18);
  const lab = [[DCX, DCY - 12, '電波塔'], [60, 27, '駅'], [18, 22, '神社'], [70, 56, 'コンビニ'], [26, 55, 'スタンド'], [46, 104, '公園'], [86, 79, '学校'], [128, 64, '川']];
  U.font = `bold 13px ${JP}`; for (const [x, y, t] of lab) { if (!G.explored[key(Math.floor(x), Math.floor(y + (t === '電波塔' ? 12 : 3)))]) continue; U.fillStyle = 'rgba(232,220,192,.85)'; const w = U.measureText(t).width + 10; U.fillRect(ox + x * S - w / 2, oy + y * S - 12, w, 17); U.fillStyle = '#3a2a1a'; U.fillText(t, ox + x * S, oy + y * S) }
  if (G.hint && G.hintK < 11) { const tw = (Math.sin(G.gameT * 4) + 1) / 2; U.strokeStyle = `rgba(200,80,40,${.5 + tw * .5})`; U.lineWidth = 2.5; U.beginPath(); U.arc(ox + G.hint.x * S, oy + G.hint.y * S, 9 + tw * 5, 0, 7); U.stroke() }
  U.fillStyle = '#d9782b'; U.beginPath(); U.arc(ox + P.x * S, oy + P.y * S, 6, 0, 7); U.fill(); U.strokeStyle = '#fff'; U.lineWidth = 2; U.stroke(); U.fillStyle = '#2f9a96'; U.beginPath(); U.arc(ox + F.x * S + 6, oy + F.y * S + 4, 4.5, 0, 7); U.fill();
  if (G.flags.farlight) { U.fillStyle = '#e8a030'; U.font = `bold 13px ${JP}`; U.fillText('→ 東：ひかりが丘の灯り', ox + W2 - 90, oy + 30) }
  U.font = `13px ${JP}`; U.fillStyle = '#6a5a4a'; U.fillText('M／タップでとじる', CW / 2, oy + H2 + 14); U.restore();
}

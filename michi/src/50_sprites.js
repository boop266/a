// ════════════════ 人のドット絵（ふちどり・歩き・座る・登る） ════════════════
const SPW = 26, SPH = 34, SAX = 13, SAY = 32;
const PAL = {
  me: { skin: '#f0c49a', skinD: '#d8a47a', hair: '#3a2a1f', hairL: '#5a4030', top: '#e07a2a', topD: '#b85e1a', topL: '#f09a4a', pants: '#3b4a5c', pantsD: '#2a3646', shoe: '#2a2420', pack: '#5a7040', packD: '#3e5030', eye: '#1a1418' },
  fr: { skin: '#dcaa80', skinD: '#c08a62', hair: '#1d1a18', hairL: '#3a3430', top: '#2f9a96', topD: '#22706c', topL: '#4ab8b4', pants: '#5a4b3f', pantsD: '#40352c', shoe: '#30302e', pack: '#8a5a32', packD: '#6a4222', eye: '#1a1418', hat: '#e8dcc0', hatD: '#c8b890', scarf: '#d84a4a', scarfD: '#a83434' },
};
const ZPAL = ['#5b6e8a', '#7a5a4a', '#6b6b5a', '#8a7f6a', '#4f5c46', '#6e4e5e', '#5b5f6a', '#8a8a92'].map(c => ({ skin: '#9fb38f', skinD: '#7a8c6a', hair: '#3d4a36', hairL: '#4d5a46', top: c, topD: sh(c, .75).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, r, g, b) => '#' + [r, g, b].map(v => (+v).toString(16).padStart(2, '0')).join('')), topL: c, pants: '#3a3d45', pantsD: '#2a2c32', shoe: '#2a2a2a', eye: '#e8f0b0', blood: '#6a1e1a' }));
const SPR = {};
function sprite(kind, pal, pose, frame, back, wind = 0) {
  const id = [kind, pal === PAL.me ? 'm' : pal === PAL.fr ? 'f' : pal.top, pose, frame, back ? 1 : 0, wind].join('|'); if (SPR[id]) return SPR[id];
  const cvs = mkCanvas(SPW, SPH), g = cvs.getContext('2d');
  const R = (x, y, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(SAX + x, SAY + y, w, h) };
  const zb = kind === 'z', fr = kind === 'fr';
  if (pose === 'down' || pose === 'lie') {// 横になった姿
    R(-10, -5, 6, 4, pal.pants); R(-4, -6, 8, 5, pal.top); R(-4, -6, 8, 1, pal.topL); R(4, -6, 5, 5, pal.skin); R(4, -6, 5, 2, pal.hair); R(7, -4, 1, 1, pal.eye); R(-12, -5, 2, 4, pal.shoe);
    if (pose === 'lie') { R(-11, -6, 15, 5, '#8aa0c8'); R(-11, -6, 15, 1, '#a8bce0') }
    if (zb) R(-2, -5, 2, 2, pal.blood);
  } else {
    const sit = pose === 'sit', ty = sit ? 4 : 0, hunch = zb ? 1 : 0;
    // 足
    if (sit) { R(-2, -6, 6, 2, pal.pants); R(-2, -5, 6, 1, pal.pantsD); R(3, -4, 2, 4, pal.pants); R(3, -1, 3, 1, pal.shoe); R(-1, -7, 5, 1, pal.pantsD) }
    else {
      const st = (pose === 'walk' || pose === 'zwalk') ? [0, 1, 0, -1][frame] : 0, lift = pose === 'climb' ? [0, 1, 0, -1][frame] : 0;
      // うしろの足
      R(-3 - st, -9, 2, 8 - Math.max(0, -st), pal.pantsD); R(-3 - st, -1 - Math.max(0, -st), 3, 1, pal.shoe);
      // まえの足
      R(0 + st, -9, 2, 8 - Math.max(0, st) - lift, pal.pants); R(0 + st, -1 - Math.max(0, st) - lift, 3, 1, pal.shoe);
      if (zb) R(-3 - st, -4, 1, 1, pal.skinD);
    }
    const sw = (pose === 'walk') ? [0, 1, 0, -1][frame] : 0;
    // うしろの腕
    if (pose === 'climb') { R(-5, -24 + ty, 2, 8, pal.topD); R(-5, -26 + ty, 2, 2, pal.skin) }
    else if (zb) { R(-1 + hunch, -15, 6, 2, pal.skinD) }
    else { R(-5, -16 + ty + sw, 2, 6, pal.topD); R(-5, -10 + ty + sw, 2, 1, pal.skinD) }
    // リュック（前向き：わきから見える）
    if (pal.pack && !back) { R(-6, -17 + ty, 3, 7, pal.packD); R(-6, -17 + ty, 3, 1, pal.pack) }
    // 胴
    R(-3 + hunch, -17 + ty + hunch, 6, 8, pal.top); R(-3 + hunch, -17 + ty + hunch, 6, 1, pal.topL); R(-3 + hunch, -10 + ty + hunch, 6, 1, pal.topD);
    if (!back && !zb) R(0, -16 + ty, 1, 6, pal.topD);
    if (zb) { R(-2 + hunch, -13 + hunch, 2, 2, pal.blood); R(1 + hunch, -11 + hunch, 2, 1, pal.skinD); R(-3 + hunch, -10 + hunch, 1, 1, null) }
    if (pal.pack && back) { R(-3, -17 + ty, 6, 7, pal.pack); R(-3, -17 + ty, 6, 1, pal.packD); R(-2, -14 + ty, 4, 2, pal.packD) }
    if (pal.pack && !back) { R(-2, -17 + ty, 1, 5, pal.packD); R(1, -17 + ty, 1, 5, pal.packD) }
    // マフラー
    if (fr) { R(-3, -18 + ty, 6, 2, pal.scarf); R(-3, -17 + ty, 6, 1, pal.scarfD); const t = Math.round(wind); R(-5 - t, -17 + ty, 2 + t, 2, pal.scarf); R(-6 - t, -16 + ty + (frame % 2), 2, 2, pal.scarfD) }
    // 頭
    const hx2 = -3 + hunch * 1, hy = -24 + ty + hunch * 2;
    R(hx2, hy, 6, 6, pal.skin); R(hx2, hy + 5, 6, 1, pal.skinD);
    if (back) { R(hx2, hy - 1, 6, 6, pal.hair); R(hx2 + 1, hy - 1, 3, 1, pal.hairL) }
    else {
      R(hx2, hy - 1, 6, 2, pal.hair); R(hx2, hy + 1, 1, 3, pal.hair); R(hx2 + 1, hy - 1, 3, 1, pal.hairL);
      if (zb) { R(hx2 + 3, hy + 2, 1, 1, pal.eye); R(hx2 + 5, hy + 2, 1, 1, pal.eye); R(hx2 + 3, hy + 4, 2, 1, pal.skinD) }
      else { R(hx2 + 2, hy + 2, 1, 2, pal.eye); R(hx2 + 4, hy + 2, 1, 2, pal.eye); R(hx2 + 1, hy + 4, 1, 1, '#f0a0a0'); R(hx2 + 5, hy + 4, 1, 1, '#f0a0a0') }
    }
    if (fr) { R(hx2 - 1, hy - 2, 7, 2, pal.hat); R(hx2, hy - 3, 5, 1, pal.hat); R(hx2 - 1, hy - 1, 7, 1, pal.hatD); if (!back) R(hx2 + 4, hy, 3, 1, pal.hatD) }
    // まえの腕
    if (pose === 'climb') { R(2, -24 + ty, 2, 8, pal.top); R(2, -26 + ty, 2, 2, pal.skin) }
    else if (pose === 'push') { R(2, -15 + ty, 7, 2, pal.top); R(9, -15 + ty, 2, 2, pal.skin) }
    else if (pose === 'point') { for (let i = 0; i < 5; i++)R(2 + i, -16 + ty - i, 2, 2, pal.top); R(7, -22 + ty, 2, 2, pal.skin) }
    else if (sit) { R(2, -15 + ty, 4, 2, pal.top); R(5, -14 + ty, 2, 2, pal.skin) }
    else if (zb) { R(2 + hunch, -17 + hunch, 7, 2, pal.top); R(9 + hunch, -17 + hunch, 2, 2, pal.skin) }
    else { R(3, -16 + ty - sw, 2, 6, pal.top); R(3, -10 + ty - sw, 2, 1, pal.skin) }
  }
  // ふちどり
  const im = g.getImageData(0, 0, SPW, SPH), d = im.data, out = new Uint8ClampedArray(d);
  for (let y = 0; y < SPH; y++)for (let x = 0; x < SPW; x++) { const o = (y * SPW + x) * 4; if (d[o + 3]) continue; let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= SPW || yy >= SPH) continue; if (d[(yy * SPW + xx) * 4 + 3]) n++ } if (n) { out[o] = 22; out[o + 1] = 18; out[o + 2] = 26; out[o + 3] = 215 } }
  g.putImageData(new ImageData(out, SPW, SPH), 0, 0);
  return SPR[id] = cvs;
}
function drawPerson(c, V, a, kind, pose, frame, back, dir, pal, scale = 1) {
  const [px, py] = V.p(a.x, a.y, a.z), p = 1.55 * V.k * scale;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py, 7 * p, 2.6 * p, 0, 0, 7); c.fill();
  const s = sprite(kind, pal, pose, frame, back, kind === 'fr' ? Math.min(2, Math.round(G.wind * 2)) : 0);
  c.save(); c.imageSmoothingEnabled = false; c.translate(Math.round(px), Math.round(py)); c.scale(dir, 1); c.drawImage(s, -SAX * p, -SAY * p, SPW * p, SPH * p); c.restore();
}

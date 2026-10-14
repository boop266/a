// 黄泉還：絵（手続き的なテクスチャ）。どれも絵の具ではなくコードで描く
const TEXC = {};
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function ctx2(c) { return c.getContext('2d', { willReadFrequently: true }); }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbS(r, g, b, a = 1) { return `rgba(${r | 0},${g | 0},${b | 0},${a})`; }
// 1画素ずつ色を混ぜる（ざらつき・汚れ）
function grain(c, amt, r, mono = true) {
  const g = ctx2(c), d = g.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const n = (r() - 0.5) * amt; if (mono) { a[i] += n; a[i + 1] += n; a[i + 2] += n; } else { a[i] += n; a[i + 1] += (r() - 0.5) * amt; a[i + 2] += (r() - 0.5) * amt; } }
  g.putImageData(d, 0, 0);
}
function stains(c, n, r, col = 'rgba(40,30,20,', a0 = 0.06, a1 = 0.18) {
  const g = ctx2(c);
  for (let i = 0; i < n; i++) {
    const x = r() * c.width, y = r() * c.height, rad = 4 + r() * c.width * 0.3, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, col + (a0 + r() * (a1 - a0)) + ')'); gr.addColorStop(1, col + '0)'); g.fillStyle = gr;
    for (const ox of [-c.width, 0, c.width]) for (const oy of [-c.height, 0, c.height]) { g.save(); g.translate(ox, oy); g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.restore(); }
  }
}
function woodGrain(g, x, y, w, h, base, r, dark = 0.75, vertical = false) {
  const [R, G, B] = base; const k0 = 0.85 + r() * 0.3;
  g.fillStyle = rgbS(R * k0, G * k0, B * k0); g.fillRect(x, y, w, h);
  const len = vertical ? h : w, wid = vertical ? w : h;
  for (let i = 0; i < wid * 1.5; i++) {
    const o = r() * wid, ph = r() * 10, amp = 0.6 + r() * 1.6, k = (r() < 0.5 ? dark : 1.12) * k0;
    g.fillStyle = rgbS(R * k, G * k, B * k, 0.35 + r() * 0.4);
    for (let t = 0; t < len; t += 1) { const off = o + Math.sin(t * 0.07 + ph) * amp; if (off < 0 || off >= wid) continue; if (vertical) g.fillRect(x + off, y + t, 1, 1); else g.fillRect(x + t, y + off, 1, 1); }
  }
  if (r() < 0.5) { const kx = x + r() * w, ky = y + r() * h; g.fillStyle = rgbS(R * 0.5, G * 0.5, B * 0.5, 0.6); g.beginPath(); g.ellipse(kx, ky, vertical ? 1.2 : 2.5, vertical ? 2.5 : 1.2, 0, 0, TAU); g.fill(); }
}
const TG = {
  // ── 床 ──
  parquet(r, base = [120, 72, 40]) {
    const c = cnv(128, 128), g = ctx2(c);
    for (let row = 0; row < 8; row++) {
      let x = -((r() * 48) | 0); while (x < 128) { const L = 40 + ((r() * 56) | 0); woodGrain(g, x, row * 16, L, 16, base, r); g.fillStyle = 'rgba(20,10,5,0.85)'; g.fillRect(x, row * 16, 1, 16); x += L; }
      g.fillStyle = 'rgba(20,10,5,0.9)'; g.fillRect(0, row * 16, 128, 1); g.fillStyle = 'rgba(255,220,180,0.06)'; g.fillRect(0, row * 16 + 1, 128, 1);
    }
    grain(c, 10, r); stains(c, 5, r); return { c, m: 1.6 };
  },
  parquet_d(r) { return TG.parquet(r, [78, 44, 26]); },
  marble(r) {
    const c = cnv(128, 128), g = ctx2(c);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const lt = (i + j) % 2 === 0; g.fillStyle = lt ? '#cfc6b4' : '#26302d'; g.fillRect(i * 64, j * 64, 64, 64);
      for (let v = 0; v < 5; v++) { let x = i * 64 + r() * 64, y = j * 64 + r() * 64; g.strokeStyle = lt ? `rgba(110,100,90,${0.25 + r() * 0.3})` : `rgba(160,170,160,${0.15 + r() * 0.2})`; g.lineWidth = r() < 0.3 ? 1.5 : 0.8; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 14; s++) { x += (r() - 0.3) * 9; y += (r() - 0.5) * 9; g.lineTo(clamp(x, i * 64, i * 64 + 63), clamp(y, j * 64, j * 64 + 63)); } g.stroke(); }
    }
    g.fillStyle = 'rgba(30,25,20,0.8)'; g.fillRect(0, 0, 128, 1); g.fillRect(0, 64, 128, 1); g.fillRect(0, 0, 1, 128); g.fillRect(64, 0, 1, 128);
    grain(c, 8, r); return { c, m: 1.8 };
  },
  carpet(r) {
    const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#5c0f16'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(30,4,8,0.6)'; g.lineWidth = 2; for (let k = -64; k < 128; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 64, 64); g.stroke(); g.beginPath(); g.moveTo(k + 64, 0); g.lineTo(k, 64); g.stroke(); }
    g.fillStyle = 'rgba(180,120,50,0.35)'; for (let k = 0; k < 64; k += 16) for (let l = 0; l < 64; l += 16) g.fillRect(k + 7, l + 7, 2, 2);
    grain(c, 22, r, false); return { c, m: 0.8 };
  },
  runner(r) { // 細長い敷物：uが幅（0..1）、vが長さ
    const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#5a0e15'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#2a0508'; g.fillRect(0, 0, 6, 64); g.fillRect(58, 0, 6, 64); g.fillStyle = '#a07a38'; g.fillRect(6, 0, 2, 64); g.fillRect(56, 0, 2, 64);
    g.fillStyle = 'rgba(160,110,40,0.35)'; for (let y = 0; y < 64; y += 16) { g.beginPath(); g.moveTo(32, y + 2); g.lineTo(44, y + 8); g.lineTo(32, y + 14); g.lineTo(20, y + 8); g.closePath(); g.fill(); }
    grain(c, 20, r, false); return { c, m: 1.2 };
  },
  tile(r) {
    const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#6d6a62'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const k = 200 + r() * 30 - ((i + j) % 2) * 8; g.fillStyle = rgbS(k, k * 0.98, k * 0.93); g.fillRect(i * 8 + 1, j * 8 + 1, 7, 7); }
    grain(c, 12, r); stains(c, 6, r, 'rgba(60,50,30,', 0.05, 0.2); return { c, m: 0.8 };
  },
  labfloor(r) {
    const c = cnv(64, 64), g = ctx2(c);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const k = 120 + r() * 14; g.fillStyle = rgbS(k, k + 2, k + 4); g.fillRect(i * 32, j * 32, 32, 32); }
    for (let n = 0; n < 160; n++) { const k = r() < 0.5 ? 80 : 170; g.fillStyle = rgbS(k, k, k, 0.5); g.fillRect(r() * 64, r() * 64, 1, 1); }
    g.fillStyle = 'rgba(40,40,40,0.6)'; g.fillRect(0, 0, 64, 1); g.fillRect(0, 32, 64, 1); g.fillRect(0, 0, 1, 64); g.fillRect(32, 0, 1, 64);
    grain(c, 6, r); stains(c, 4, r, 'rgba(40,40,30,'); return { c, m: 1.4 };
  },
  stone(r) {
    const c = cnv(128, 128), g = ctx2(c); g.fillStyle = '#2b2722'; g.fillRect(0, 0, 128, 128);
    let y = 0; while (y < 128) { const h = 18 + ((r() * 14) | 0); let x = -((r() * 30) | 0); while (x < 128) { const w = 26 + ((r() * 30) | 0), k = 70 + r() * 35; g.fillStyle = rgbS(k, k * 0.95, k * 0.86); g.fillRect(x + 1, y + 1, w - 2, Math.min(h, 128 - y) - 2); g.fillStyle = 'rgba(255,255,240,0.07)'; g.fillRect(x + 1, y + 1, w - 2, 2); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + 1, y + h - 4, w - 2, 2); x += w; } y += h; }
    grain(c, 26, r); stains(c, 8, r, 'rgba(20,30,10,', 0.08, 0.25); return { c, m: 2.0 };
  },
  brick(r) {
    const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#3a2a22'; g.fillRect(0, 0, 64, 64);
    for (let row = 0; row < 8; row++) { const off = row % 2 ? 8 : 0; for (let x = -off; x < 64; x += 16) { const k = 0.8 + r() * 0.35; g.fillStyle = rgbS(120 * k, 56 * k, 40 * k); g.fillRect(x + 1, row * 8 + 1, 14, 6); } }
    grain(c, 18, r); return { c, m: 1.0 };
  },
  concrete(r) {
    const c = cnv(128, 128), g = ctx2(c); g.fillStyle = '#6b6a66'; g.fillRect(0, 0, 128, 128);
    grain(c, 30, r); stains(c, 14, r, 'rgba(30,30,25,', 0.08, 0.3);
    g.strokeStyle = 'rgba(30,30,30,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 64); g.lineTo(128, 64); g.stroke();
    for (let i = 0; i < 3; i++) { let x = r() * 128, y = r() * 128; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 10; s++) { x += (r() - 0.5) * 10; y += r() * 8; g.lineTo(x, y); } g.strokeStyle = 'rgba(20,20,20,0.45)'; g.stroke(); }
    for (const x of [16, 112]) for (const y of [16, 80]) { g.fillStyle = 'rgba(30,30,30,0.6)'; g.beginPath(); g.arc(x, y, 2, 0, TAU); g.fill(); }
    return { c, m: 2.4 };
  },
  // ── 壁 ──
  paper(r, base = '#b6a888', fig = 'rgba(120,100,70,0.35)', stripe = 'rgba(90,70,50,0.12)') {
    const c = cnv(128, 128), g = ctx2(c); g.fillStyle = base; g.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 32) { g.fillStyle = stripe; g.fillRect(x, 0, 3, 128); g.fillRect(x + 14, 0, 1, 128); }
    g.fillStyle = fig;
    const flour = (cx, cy) => { g.beginPath(); g.ellipse(cx, cy, 7, 11, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx, cy - 15, 3, 5, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx, cy + 15, 3, 5, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx - 8, cy - 9, 5, 2.5, -0.6, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx + 8, cy - 9, 5, 2.5, 0.6, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx - 8, cy + 9, 5, 2.5, 0.6, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx + 8, cy + 9, 5, 2.5, -0.6, 0, TAU); g.fill(); };
    for (let x = 23; x < 128; x += 32) for (let y = 0; y < 129; y += 64) { flour(x, y + 16); flour((x + 16) % 128, y + 48); }
    grain(c, 10, r); stains(c, 10, r); return { c, m: 1.2 };
  },
  paper_cream(r) { return TG.paper(r); },
  paper_green(r) { return TG.paper(r, '#3d4c40', 'rgba(20,30,22,0.38)', 'rgba(10,20,12,0.18)'); },
  paper_red(r) { return TG.paper(r, '#5b1f22', 'rgba(30,6,8,0.38)', 'rgba(20,4,6,0.2)'); },
  paper_blue(r) { return TG.paper(r, '#3d4656', 'rgba(20,24,34,0.38)', 'rgba(10,14,24,0.18)'); },
  paper_child(r) {
    const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#9db1c4'; g.fillRect(0, 0, 64, 64);
    for (let x = 0; x < 64; x += 16) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, 0, 6, 64); }
    g.fillStyle = 'rgba(255,240,180,0.6)'; for (let i = 0; i < 6; i++) { const x = (i * 23 + 7) % 64, y = (i * 37 + 11) % 64; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * PI / 5 - PI / 2, rr = k % 2 ? 1.5 : 3.5; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
    grain(c, 10, r); stains(c, 6, r); return { c, m: 0.9 };
  },
  wainscot(r) { // 腰板：幅1.2m・高さ1.2m で1枚
    const c = cnv(64, 64), g = ctx2(c); woodGrain(g, 0, 0, 64, 64, [70, 40, 24], r, 0.7, true);
    g.fillStyle = 'rgba(10,5,2,0.5)'; g.fillRect(8, 8, 48, 1); g.fillRect(8, 8, 1, 46); g.fillStyle = 'rgba(255,220,180,0.12)'; g.fillRect(8, 54, 48, 1); g.fillRect(56, 8, 1, 47);
    g.fillStyle = 'rgba(255,220,180,0.08)'; g.fillRect(12, 12, 40, 1); g.fillRect(12, 12, 1, 38); g.fillStyle = 'rgba(10,5,2,0.4)'; g.fillRect(12, 50, 40, 1); g.fillRect(51, 12, 1, 39);
    g.fillStyle = 'rgba(10,5,2,0.8)'; g.fillRect(0, 0, 1, 64); grain(c, 8, r); return { c, m: 1.0 };
  },
  plaster(r) { const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#b7afa0'; g.fillRect(0, 0, 64, 64); grain(c, 12, r); stains(c, 8, r); return { c, m: 2.0 }; },
  ceil(r) {
    const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#a99c84'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#4a2e1c'; g.fillRect(0, 0, 64, 6); g.fillRect(0, 0, 6, 64); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(6, 6, 58, 3); g.fillRect(6, 6, 3, 58);
    grain(c, 10, r); stains(c, 4, r); return { c, m: 2.0 };
  },
  labwall(r) {
    const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#c9cbc6'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(60,60,60,0.5)'; g.fillRect(0, 0, 1, 64); g.fillRect(0, 40, 64, 1); g.fillStyle = 'rgba(80,80,80,0.6)'; for (const y of [4, 36, 44, 60]) { g.fillRect(4, y, 1, 1); g.fillRect(59, y, 1, 1); }
    g.fillStyle = '#7d8a8c'; g.fillRect(0, 44, 64, 3);
    grain(c, 8, r); stains(c, 6, r, 'rgba(50,50,40,'); return { c, m: 1.6 };
  },
  metal(r) {
    const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#5c6062'; g.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(0, y, 64, 1); }
    g.fillStyle = 'rgba(20,20,20,0.6)'; g.fillRect(0, 0, 64, 1); g.fillRect(0, 0, 1, 64);
    for (let x = 4; x < 64; x += 10) { g.fillStyle = 'rgba(200,200,200,0.4)'; g.fillRect(x, 3, 2, 2); g.fillRect(x, 59, 2, 2); }
    grain(c, 10, r); stains(c, 5, r, 'rgba(60,35,15,', 0.08, 0.3); return { c, m: 1.2 };
  },
  // ── 家具の材 ──
  wood(r) { const c = cnv(64, 64), g = ctx2(c); woodGrain(g, 0, 0, 64, 64, [110, 66, 36], r); grain(c, 8, r); return { c, m: 1.0 }; },
  wood_d(r) { const c = cnv(64, 64), g = ctx2(c); woodGrain(g, 0, 0, 64, 64, [58, 34, 20], r, 0.7); grain(c, 6, r); return { c, m: 1.0 }; },
  wood_l(r) { const c = cnv(64, 64), g = ctx2(c); woodGrain(g, 0, 0, 64, 64, [150, 110, 70], r); grain(c, 8, r); return { c, m: 1.0 }; },
  velvet(r, col = [110, 18, 26]) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = rgbS(...col); g.fillRect(0, 0, 32, 32); grain(c, 26, r); return { c, m: 0.6 }; },
  velvet_r(r) { return TG.velvet(r); }, velvet_g(r) { return TG.velvet(r, [30, 64, 42]); }, velvet_b(r) { return TG.velvet(r, [36, 46, 82]); },
  linen(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#d6d0c4'; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 32; i += 2) { g.fillStyle = 'rgba(0,0,0,0.04)'; g.fillRect(i, 0, 1, 32); g.fillRect(0, i, 32, 1); } grain(c, 10, r); stains(c, 3, r, 'rgba(90,70,40,'); return { c, m: 0.8 }; },
  leather(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#4b2a18'; g.fillRect(0, 0, 32, 32); grain(c, 22, r); return { c, m: 0.5 }; },
  brass(r) { const c = cnv(16, 16), g = ctx2(c); g.fillStyle = '#9b7a34'; g.fillRect(0, 0, 16, 16); grain(c, 30, r); return { c, m: 0.3 }; },
  iron(r) { const c = cnv(16, 16), g = ctx2(c); g.fillStyle = '#2a2b2d'; g.fillRect(0, 0, 16, 16); grain(c, 16, r); return { c, m: 0.4 }; },
  books(r) { // 本棚の一段：横2m × 高さ0.4m
    const c = cnv(128, 32), g = ctx2(c); g.fillStyle = '#140c08'; g.fillRect(0, 0, 128, 32);
    let x = 0; const cols = [[90, 20, 22], [30, 50, 80], [40, 70, 40], [100, 80, 40], [60, 30, 50], [120, 100, 80], [50, 40, 30], [20, 40, 50]];
    while (x < 128) { const w = 3 + ((r() * 5) | 0), h = 20 + ((r() * 10) | 0), [R, G, B] = pick(cols, r), k = 0.7 + r() * 0.4; g.fillStyle = rgbS(R * k, G * k, B * k); g.fillRect(x, 32 - h, w, h); g.fillStyle = 'rgba(210,170,80,0.55)'; if (r() < 0.7) { g.fillRect(x, 32 - h + 3, w, 1); g.fillRect(x, 32 - 5, w, 1); } g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x + w - 1, 32 - h, 1, h); x += w; if (r() < 0.08) x += 4; }
    grain(c, 12, r); return { c, m: 2.0 };
  },
  soil(r) { const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#2c2116'; g.fillRect(0, 0, 64, 64); grain(c, 30, r); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,80,60,${r() * 0.5})`; g.fillRect(r() * 64, r() * 64, 2, 1); } return { c, m: 1.0 }; },
  grass(r) { const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#1d2a14'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 400; i++) { const k = r(); g.fillStyle = rgbS(30 + k * 40, 50 + k * 50, 20 + k * 20, 0.8); g.fillRect(r() * 64, r() * 64, 1, 2 + r() * 3); } return { c, m: 1.5 }; },
  gravel(r) { const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#3d3b37'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 300; i++) { const k = 60 + r() * 70; g.fillStyle = rgbS(k, k * 0.97, k * 0.92); g.fillRect(r() * 64, r() * 64, 1 + r() * 2, 1 + r() * 2); } return { c, m: 1.2 }; },
  bark(r) { const c = cnv(32, 64), g = ctx2(c); g.fillStyle = '#2a2018'; g.fillRect(0, 0, 32, 64); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(0,0,0,${0.2 + r() * 0.4})`; g.fillRect(r() * 32, 0, 1 + r() * 2, 64); } grain(c, 20, r); return { c, m: 1.0 }; },
  leaf(r) { // 葉（透過）
    const c = cnv(64, 64), g = ctx2(c);
    for (let i = 0; i < 26; i++) { const x = r() * 64, y = r() * 64, a = r() * TAU, k = 0.6 + r() * 0.6; g.fillStyle = rgbS(30 * k, 70 * k, 30 * k); g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 9, 3, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-8, 0, 16, 0.6); g.restore(); }
    return { c, m: 1.0 };
  },
  water(r) { const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#0d1a1c'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(120,160,170,${r() * 0.2})`; g.beginPath(); g.ellipse(r() * 64, r() * 64, 4 + r() * 8, 1 + r() * 2, 0, 0, TAU); g.stroke(); } return { c, m: 2.0 }; },
  grate(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#3a3d40'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#6a6e72'; for (let i = 0; i < 32; i += 8) for (let j = 0; j < 32; j += 8) { g.fillRect(i + ((j / 8) % 2) * 4, j + 2, 3, 1); g.fillRect(i + ((j / 8) % 2) * 4 + 1, j + 3, 1, 2); } grain(c, 10, r); return { c, m: 0.8 }; },
  // ── 外 ──
  night(r) { // 窓の外：雨の夜の森
    const c = cnv(128, 128), g = ctx2(c), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#0c1422'); gr.addColorStop(0.6, '#0a1018'); gr.addColorStop(1, '#05070a'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 3) { const h = 40 + r() * 50; g.fillStyle = '#04070a'; g.beginPath(); g.moveTo(x - 6, 128); g.lineTo(x, 128 - h); g.lineTo(x + 6, 128); g.fill(); }
    for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(150,170,200,0.12)'; g.fillRect(r() * 128, r() * 128, 1, 6); }
    return { c, m: 4 };
  },
  dawn(r) {
    const c = cnv(64, 128), g = ctx2(c), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#1b2140'); gr.addColorStop(0.45, '#6a4a6e'); gr.addColorStop(0.7, '#d9875a'); gr.addColorStop(0.85, '#f2c27a'); gr.addColorStop(1, '#3a2a30'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
    return { c, m: 1 };
  },
  nightsky(r) { const c = cnv(64, 128), g = ctx2(c), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#05070d'); gr.addColorStop(0.7, '#0e1524'); gr.addColorStop(1, '#141c2a'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); stains(c, 10, r, 'rgba(60,70,90,', 0.05, 0.15); return { c, m: 1 }; },
  rain(r) { const c = cnv(32, 64), g = ctx2(c); for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(190,210,235,${0.15 + r() * 0.35})`; const x = r() * 32, y = r() * 64; g.fillRect(x, y, 1, 3 + r() * 9); } return { c, m: 1 }; },
  // ── 研究所 ──
  screen(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#062014'; g.fillRect(0, 0, 32, 32); g.fillStyle = 'rgba(90,255,150,0.75)'; for (let y = 3; y < 30; y += 4) { const w = 4 + r() * 22; g.fillRect(3, y, w, 1); } grain(c, 20, r); return { c, m: 1 }; },
  screen_red(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#200606'; g.fillRect(0, 0, 32, 32); g.fillStyle = 'rgba(255,90,70,0.8)'; for (let y = 3; y < 30; y += 4) g.fillRect(3, y, 4 + r() * 22, 1); grain(c, 20, r); return { c, m: 1 }; },
  liquid(r) { const c = cnv(32, 64), g = ctx2(c), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#3fd0b0'); gr.addColorStop(1, '#0b5a48'); g.fillStyle = gr; g.fillRect(0, 0, 32, 64); for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(220,255,240,0.5)'; g.beginPath(); g.arc(r() * 32, r() * 64, 0.5 + r() * 1.5, 0, TAU); g.fill(); } return { c, m: 1 }; },
  hazard(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#c8a01c'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#151515'; for (let k = -32; k < 64; k += 12) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 6, 0); g.lineTo(k + 38, 32); g.lineTo(k + 32, 32); g.fill(); } grain(c, 14, r); return { c, m: 0.6 }; },
  // ── 布・肌 ──
  uniform(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#26324a'; g.fillRect(0, 0, 32, 32); grain(c, 18, r); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 15, 32, 1); return { c, m: 0.4 }; },
  vest(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#17191c'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#25282c'; g.fillRect(3, 10, 11, 9); g.fillRect(18, 10, 11, 9); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(3, 10, 11, 1); g.fillRect(18, 10, 11, 1); grain(c, 12, r); return { c, m: 0.4 }; },
  labcoat(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#c9c6bb'; g.fillRect(0, 0, 32, 32); grain(c, 14, r); stains(c, 4, r, 'rgba(110,10,10,', 0.2, 0.5); return { c, m: 0.5 }; },
  servant(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#1e1c22'; g.fillRect(0, 0, 32, 32); grain(c, 12, r); stains(c, 3, r, 'rgba(90,10,10,', 0.2, 0.4); return { c, m: 0.5 }; },
  worker(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#3f4a3a'; g.fillRect(0, 0, 32, 32); grain(c, 16, r); stains(c, 4, r, 'rgba(30,20,10,', 0.2, 0.5); return { c, m: 0.5 }; },
  skin_z(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#7d8a74'; g.fillRect(0, 0, 32, 32); grain(c, 22, r, false); stains(c, 5, r, 'rgba(90,20,20,', 0.2, 0.6); return { c, m: 0.4 }; },
  skin_h(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#4c5d32'; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 32; i += 4) for (let j = 0; j < 32; j += 4) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(i + (j % 8 ? 2 : 0), j, 3, 1); } grain(c, 18, r); return { c, m: 0.3 }; },
  skin_boss(r) { const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#9a8f86'; g.fillRect(0, 0, 64, 64); stains(c, 10, r, 'rgba(140,20,30,', 0.3, 0.8); for (let i = 0; i < 20; i++) { g.strokeStyle = `rgba(80,20,40,${0.3 + r() * 0.4})`; g.beginPath(); let x = r() * 64, y = r() * 64; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 12; y += (r() - 0.5) * 12; g.lineTo(x, y); } g.stroke(); } grain(c, 16, r); return { c, m: 0.6 }; },
  fur(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#3a2c22'; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '20,12,8' : '90,70,55'},0.5)`; g.fillRect(r() * 32, r() * 32, 1, 2); } stains(c, 4, r, 'rgba(120,10,10,', 0.2, 0.6); return { c, m: 0.3 }; },
  // ── 血 ──
  blood(r) { const c = cnv(64, 64), g = ctx2(c); for (let i = 0; i < 9; i++) { const x = 32 + (r() - 0.5) * 30, y = 32 + (r() - 0.5) * 30, rr = 3 + r() * 12; g.fillStyle = `rgba(${60 + r() * 40},0,4,${0.6 + r() * 0.35})`; g.beginPath(); g.ellipse(x, y, rr, rr * (0.5 + r() * 0.5), r() * PI, 0, TAU); g.fill(); } for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(70,0,4,0.8)'; g.beginPath(); g.arc(r() * 64, r() * 64, 0.5 + r() * 1.5, 0, TAU); g.fill(); } return { c, m: 1 }; },
  smear(r) { const c = cnv(64, 32), g = ctx2(c); for (let i = 0; i < 4; i++) { const y = 8 + r() * 16; g.fillStyle = `rgba(70,0,4,${0.4 + r() * 0.4})`; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 64; x += 4) g.lineTo(x, y + Math.sin(x * 0.1 + i) * 2 + (x / 64) * 3); for (let x = 64; x >= 0; x -= 4) g.lineTo(x, y + 4 + Math.sin(x * 0.13) * 2 - (x / 64) * 3); g.fill(); } return { c, m: 1 }; },
  // ── 紙・文字 ──
  note(r) { const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, 32, 32); g.fillStyle = 'rgba(40,30,20,0.55)'; for (let y = 5; y < 30; y += 3) g.fillRect(3, y, 6 + r() * 22, 1); grain(c, 10, r); return { c, m: 1 }; },
  clockface(r) { const c = cnv(64, 64), g = ctx2(c); g.fillStyle = '#e2d8c0'; g.beginPath(); g.arc(32, 32, 30, 0, TAU); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#2a1a10'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillRect(32 + Math.sin(a) * 25 - 1, 32 - Math.cos(a) * 25 - 2, 2, 4); } grain(c, 8, r); return { c, m: 1 }; },
};
// 絵画（風景・肖像）。肖像は家族ひとりひとりの顔を描き分ける
const PORTRAITS = {
  p0: { bg: '#2a2418', coat: '#1a1a1a', skin: '#c9a888', hair: '#d8d8d8', beard: true, age: 1 },     // 初代 宗一郎
  p1: { bg: '#24202c', coat: '#2a1e18', skin: '#c8a080', hair: '#606060', beard: true, age: 0.7 },   // 二代 重光
  p2: { bg: '#2c2420', coat: '#4a2030', skin: '#e0c0a8', hair: '#2a2018', woman: true, age: 0.6 },   // 千鶴
  p3: { bg: '#1e2428', coat: '#151515', skin: '#d0a888', hair: '#1a1410', beard: true, age: 0.3 },   // 三代 弦一郎（男爵）
  p4: { bg: '#2a2228', coat: '#3a4a6a', skin: '#ecd0b8', hair: '#1a1210', woman: true, age: 0.15 },  // 雪乃
  p5: { bg: '#2a2a22', coat: '#e8e0d0', skin: '#f2d8c4', hair: '#1a1210', woman: true, child: true }, // 小夜
};
function drawPortrait(key, r) {
  const P = PORTRAITS[key], c = cnv(64, 80), g = ctx2(c);
  const gr = g.createRadialGradient(32, 30, 4, 32, 36, 50); gr.addColorStop(0, P.bg.replace('#', '#')); gr.addColorStop(1, '#080604'); g.fillStyle = gr; g.fillRect(0, 0, 64, 80);
  const s = P.child ? 0.8 : 1, cy = P.child ? 40 : 34;
  g.fillStyle = P.coat; g.beginPath(); g.ellipse(32, 80, 26 * s, 26 * s, 0, PI, TAU); g.fill();
  if (!P.woman) { g.fillStyle = '#e8e4d8'; g.beginPath(); g.moveTo(32, 58); g.lineTo(27, 66); g.lineTo(37, 66); g.fill(); }
  g.fillStyle = P.skin; g.fillRect(28, cy + 12 * s, 8, 10); g.beginPath(); g.ellipse(32, cy, 10 * s, 13 * s, 0, 0, TAU); g.fill();
  g.fillStyle = P.hair; g.beginPath();
  if (P.woman) { g.ellipse(32, cy - 6 * s, 12 * s, 9 * s, 0, PI, TAU); g.fill(); g.beginPath(); g.ellipse(32, cy - 14 * s, 6, 5, 0, 0, TAU); g.fill(); if (P.child) { g.fillRect(21, cy - 6, 4, 18); g.fillRect(39, cy - 6, 4, 18); g.fillStyle = '#a02030'; g.fillRect(36, cy - 15, 6, 3); } }
  else { g.ellipse(32, cy - 8 * s, 11 * s, 6 * s, 0, PI, TAU); g.fill(); }
  g.fillStyle = 'rgba(30,20,15,0.9)'; g.fillRect(27, cy - 1, 3, 1.5); g.fillRect(34, cy - 1, 3, 1.5);
  g.fillStyle = 'rgba(120,60,50,0.6)'; g.fillRect(29.5, cy + 7 * s, 5, 1);
  if (P.beard) { g.fillStyle = P.hair; g.beginPath(); g.ellipse(32, cy + 8, 8 * (0.6 + P.age * 0.4), 3 + P.age * 5, 0, 0, PI); g.fill(); g.fillRect(27, cy + 4, 10, 2); }
  if (P.age > 0.5) { g.strokeStyle = 'rgba(80,50,40,0.35)'; g.beginPath(); g.moveTo(26, cy + 3); g.lineTo(28, cy + 6); g.moveTo(38, cy + 3); g.lineTo(36, cy + 6); g.stroke(); }
  grain(c, 18, r); stains(c, 6, r, 'rgba(10,8,4,', 0.1, 0.3); return c;
}
function drawLandscape(kind, r) {
  const c = cnv(96, 64), g = ctx2(c), gr = g.createLinearGradient(0, 0, 0, 64);
  if (kind === 'night') { gr.addColorStop(0, '#0e1420'); gr.addColorStop(1, '#2a3040'); } else if (kind === 'sea') { gr.addColorStop(0, '#506878'); gr.addColorStop(1, '#a89870'); } else { gr.addColorStop(0, '#6a7880'); gr.addColorStop(1, '#c0a878'); }
  g.fillStyle = gr; g.fillRect(0, 0, 96, 64);
  if (kind === 'sea') { g.fillStyle = '#2a4050'; g.fillRect(0, 40, 96, 24); for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(220,230,230,0.4)'; g.fillRect(r() * 96, 40 + r() * 24, 4, 1); } }
  else { g.fillStyle = kind === 'night' ? '#141a20' : '#4a5a50'; g.beginPath(); g.moveTo(0, 50); for (let x = 0; x <= 96; x += 8) g.lineTo(x, 26 + Math.sin(x * 0.07 + r()) * 10 + r() * 6); g.lineTo(96, 64); g.lineTo(0, 64); g.fill(); g.fillStyle = kind === 'night' ? '#0a0e10' : '#2a3a28'; g.fillRect(0, 48, 96, 16); if (kind === 'night') { g.fillStyle = '#e8e0c0'; g.beginPath(); g.arc(70, 14, 5, 0, TAU); g.fill(); } }
  grain(c, 16, r, false); stains(c, 5, r, 'rgba(20,15,5,', 0.1, 0.3); return c;
}
function drawCrayon(kind, r) {
  const c = cnv(48, 48), g = ctx2(c); g.fillStyle = '#e6e0d0'; g.fillRect(0, 0, 48, 48); g.lineWidth = 1.5; g.lineCap = 'round';
  const L = (col, pts) => { g.strokeStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i] + (r() - 0.5), pts[i + 1] + (r() - 0.5)); g.stroke(); };
  if (kind === 0) { // おとうさまとわたし
    L('#3050a0', [12, 40, 12, 22]); g.strokeStyle = '#3050a0'; g.beginPath(); g.arc(12, 17, 4, 0, TAU); g.stroke(); L('#3050a0', [6, 28, 18, 28]);
    L('#d04060', [30, 40, 30, 28]); g.strokeStyle = '#d04060'; g.beginPath(); g.arc(30, 24, 3.5, 0, TAU); g.stroke(); L('#d04060', [25, 32, 35, 32]); L('#e0b020', [38, 8, 44, 8, 41, 4, 41, 12]);
  } else if (kind === 1) { // おやしき
    L('#806040', [8, 40, 8, 20, 24, 8, 40, 20, 40, 40, 8, 40]); L('#4070c0', [14, 26, 20, 26, 20, 32, 14, 32, 14, 26]); L('#4070c0', [28, 26, 34, 26, 34, 32, 28, 32, 28, 26]); L('#30a040', [0, 44, 48, 44]);
  } else { // ねこ（黒く塗りつぶされている）
    g.fillStyle = 'rgba(20,20,20,0.85)'; g.fillRect(8, 10, 32, 28); L('#202020', [4, 6, 44, 42]); L('#202020', [44, 6, 4, 42]);
  }
  grain(c, 10, r); return c;
}
function drawEmblem(kind) { // 扉の紋章（鷹・蛇・狼）
  const c = cnv(32, 32), g = ctx2(c); g.fillStyle = '#7d6228'; g.beginPath(); g.arc(16, 16, 15, 0, TAU); g.fill(); g.strokeStyle = '#c8a050'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#2a1e0c';
  if (kind === 'hawk') { g.beginPath(); g.moveTo(16, 8); g.lineTo(5, 13); g.lineTo(12, 15); g.lineTo(16, 24); g.lineTo(20, 15); g.lineTo(27, 13); g.closePath(); g.fill(); }
  else if (kind === 'snake') { g.lineWidth = 3; g.strokeStyle = '#2a1e0c'; g.beginPath(); g.moveTo(9, 24); g.bezierCurveTo(4, 14, 22, 18, 16, 10); g.bezierCurveTo(12, 5, 22, 4, 23, 9); g.stroke(); }
  else if (kind === 'wolf') { g.beginPath(); g.moveTo(9, 9); g.lineTo(12, 14); g.lineTo(20, 14); g.lineTo(23, 9); g.lineTo(22, 18); g.lineTo(16, 25); g.lineTo(10, 18); g.closePath(); g.fill(); }
  return c;
}
function drawFace(kind, r) { // 顔（32×32）
  const c = cnv(32, 32), g = ctx2(c);
  const F = { ryo: ['#d8b496', '#15110e', 0], haya: ['#caa486', '#2b1d14', 1], z: ['#7d8a74', '#2a2a22', 2], z2: ['#86907a', '#3a3428', 2], zw: ['#8a9280', '#1a1612', 3], res: ['#8f9888', '#55504a', 2], hunter: ['#4c5d32', '#4c5d32', 4] }[kind];
  g.fillStyle = F[0]; g.fillRect(0, 0, 32, 32);
  if (F[2] === 4) { g.fillStyle = '#d8e070'; g.fillRect(8, 12, 5, 3); g.fillRect(19, 12, 5, 3); g.fillStyle = '#100'; g.fillRect(10, 13, 1, 1); g.fillRect(21, 13, 1, 1); g.fillStyle = '#1a0a08'; g.fillRect(8, 22, 16, 4); g.fillStyle = '#ddd'; for (let x = 9; x < 24; x += 2) g.fillRect(x, 22, 1, 2); grain(c, 14, r); return c; }
  g.fillStyle = F[1]; g.fillRect(0, 0, 32, F[2] === 3 ? 12 : 9); if (F[2] === 1 || F[2] === 3) { g.fillRect(0, 0, 4, 22); g.fillRect(28, 0, 4, 22); }
  if (F[2] >= 2) { g.fillStyle = '#e8e4c8'; g.fillRect(8, 13, 5, 3); g.fillRect(19, 13, 5, 3); g.fillStyle = '#6a2020'; g.fillRect(10, 14, 1, 1); g.fillRect(21, 14, 1, 1); g.fillStyle = 'rgba(40,10,10,0.6)'; g.fillRect(7, 16, 7, 2); g.fillRect(18, 16, 7, 2); g.fillStyle = '#2a0a08'; g.fillRect(11, 23, 10, 3); g.fillStyle = 'rgba(120,10,10,0.8)'; g.fillRect(12, 26, 3, 5); g.fillRect(18, 25, 2, 6); }
  else { g.fillStyle = '#fff'; g.fillRect(9, 14, 4, 2); g.fillRect(19, 14, 4, 2); g.fillStyle = '#1a120c'; g.fillRect(10, 14, 2, 2); g.fillRect(20, 14, 2, 2); g.fillStyle = F[1]; g.fillRect(8, 11, 6, 1); g.fillRect(18, 11, 6, 1); g.fillStyle = 'rgba(120,60,50,0.7)'; g.fillRect(13, 24, 6, 1); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(15, 16, 2, 5); }
  grain(c, 10, r); return c;
}
// テクスチャを取り出す（名前ごとに1枚だけ作る）
function T(name) {
  let t = TEXC[name]; if (t) return t;
  const r = mkRng(hashStr(name)); let c, m = 1;
  if (TG[name]) { const o = TG[name](r); c = o.c; m = o.m; }
  else if (name.startsWith('pt_')) { const k = name.slice(3); c = PORTRAITS[k] ? drawPortrait(k, r) : drawLandscape(k, r); }
  else if (name.startsWith('cray')) c = drawCrayon(+name.slice(4), r);
  else if (name.startsWith('emb_')) c = drawEmblem(name.slice(4));
  else if (name.startsWith('face_')) c = drawFace(name.slice(5), r);
  else throw new Error('テクスチャがない: ' + name);
  t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace; t.userData.m = m; TEXC[name] = t; return t;
}

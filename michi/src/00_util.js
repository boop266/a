// ════════════════════════════════════════════════════════════════
//  果てなき道 — 電気の止まった町。ともだちと、てっぺんまで。
//  移動 WASD/矢印  走る Shift  調べる E/スペース  押しのける F  休む Z
//  地図 M  写真 P  持ち物 1〜9
// ════════════════════════════════════════════════════════════════
const CW = 1280, CH = 720;
const cv = document.getElementById('c'); cv.width = CW; cv.height = CH;
const ctx = cv.getContext('2d');
const TEST = /test/.test(location.search);

function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
const R = rng(20261014);
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296 };
function vn(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v }
const fbm = (x, y) => vn(x, y) * .55 + vn(x * 2.1 + 7, y * 2.1) * .3 + vn(x * 4.3, y * 4.3 + 3) * .15;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const _hc = {}; const hx = c => _hc[c] || (_hc[c] = (n => [n >> 16 & 255, n >> 8 & 255, n & 255])(parseInt(c.slice(1), 16)));
const sh = (c, f, a) => { const [r, g, b] = hx(c); const q = v => Math.max(0, Math.min(255, v * f)) | 0; return a == null ? `rgb(${q(r)},${q(g)},${q(b)})` : `rgba(${q(r)},${q(g)},${q(b)},${a})` };
const mixc = (c1, c2, t) => { const a = hx(c1), b = hx(c2); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, '0')).join('') };
function fp(c, pts, fill, stroke, lw) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++)c.lineTo(pts[i][0], pts[i][1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill() } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke() } }
function ln(c, a, b, col, lw) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = lw || 1; c.stroke() }
const LVEC = (() => { const v = [-.7, .45, .55], l = Math.hypot(...v); return v.map(a => a / l) })();
const shadeF = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return .55 + .6 * Math.max(0, (x * LVEC[0] + y * LVEC[1] + z * LVEC[2]) / l) };
const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Noto Sans CJK JP","Yu Gothic",Meiryo,system-ui,sans-serif';
const JPM = '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Noto Serif CJK JP",serif';
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }
// 1ピクセルずつ色を決める小さな絵
function mkTex(w, h, fn) { const c = mkCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data; for (let y = 0; y < h; y++)for (let x = 0; x < w; x++) { const v = fn(x, y); if (!v) continue; const o = (y * w + x) * 4; d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = v[3] == null ? 255 : v[3] } g.putImageData(im, 0, 0); return c }
const col3 = (c, f = 1, n = 0) => { const [r, g, b] = hx(c); return [clamp(r * f + n, 0, 255), clamp(g * f + n, 0, 255), clamp(b * f + n, 0, 255)] };

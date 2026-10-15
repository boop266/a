// ---------------------------------------------------------------------------
// 道具箱：乱数・補間・ノイズ・保存・小さな仕組み
// ---------------------------------------------------------------------------
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// 決まった種から同じ並びが出る乱数（世界の模様・筆のかすれ用）
function makeRng(seed) {
  let s = (seed >>> 0) || 0x9e3779b9;
  const f = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  f.int = n => Math.floor(f() * n);
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.range = (a, b) => a + (b - a) * f();
  return f;
}
// 遊びの乱数（ボットの再現のため、種を差し替えられる）
let RNG = makeRng(Date.now() & 0xffffffff);
const rnd = () => RNG();
const rndi = n => Math.floor(RNG() * n);
const rpick = arr => arr[Math.floor(RNG() * arr.length)];
const chance = p => RNG() < p;

function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + (s | 0) * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// なめらかなノイズ（1次元・2次元）
function noise1(x, s = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash2(i, 0, s), hash2(i + 1, 0, s), u);
}
function noise2(x, y, s = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}
function fbm1(x, s = 0, oct = 4) { let v = 0, a = .5, f = 1; for (let i = 0; i < oct; i++) { v += a * noise1(x * f, s + i * 17); f *= 2; a *= .5; } return v; }

// 色：'#rrggbb' と透明度から rgba
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
}
function mixHex(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const r = Math.round(lerp(a >> 16 & 255, b >> 16 & 255, t)), g = Math.round(lerp(a >> 8 & 255, b >> 8 & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

// 保存（使えない時もゲームは動く）
const Store = {
  key: 'hitoshizuku.v1',
  load() { try { const s = localStorage.getItem(this.key); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  save(obj) { try { localStorage.setItem(this.key, JSON.stringify(obj)); return true; } catch (e) { return false; } },
  clear() { try { localStorage.removeItem(this.key); } catch (e) { } },
};

// 小さな出来事の知らせ（ゲームの中の出来事を、点検・印・音が聞く）
const Bus = {
  map: new Map(),
  on(type, fn) { if (!this.map.has(type)) this.map.set(type, []); this.map.get(type).push(fn); },
  emit(type, data) { const l = this.map.get(type); if (l) for (const fn of l) { try { fn(data); } catch (e) { reportError(e); } } },
};

// 握りつぶさずに記録する（テストのボットが読む）
const ERRORS = [];
function reportError(e) { ERRORS.push(String(e && e.stack || e)); if (ERRORS.length > 50) ERRORS.shift(); console.error(e); }

const $ = id => document.getElementById(id);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const now = () => performance.now() / 1000;

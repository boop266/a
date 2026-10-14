// 黄泉還：小道具（数・乱数・角度）
const PI = Math.PI, TAU = PI * 2, hyp = Math.hypot, abs = Math.abs, min = Math.min, max = Math.max;
const sin = Math.sin, cos = Math.cos, atan2 = Math.atan2, sqrt = Math.sqrt, floor = Math.floor, round = Math.round;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => (t = clamp(t, 0, 1), t * t * (3 - 2 * t));
const QS = new URLSearchParams(location.search);
const TEST = QS.has('test');
function angDiff(a, b) { return ((b - a + PI) % TAU + TAU) % TAU - PI; }
function angTo(a, b, step) { const d = angDiff(a, b); return abs(d) <= step ? b : a + Math.sign(d) * step; }
// 遊びの乱数（テストでは種を固定できる）
let SEED = (+QS.get('seed')) || ((Math.random() * 1e9) | 0);
function rnd() { SEED = SEED + 0x6D2B79F5 | 0; let t = Math.imul(SEED ^ SEED >>> 15, 1 | SEED); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
// 絵づくり用の乱数（毎回同じ絵になるよう、別の種）
function mkRng(s) { let a = s | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function pick(a, r = rnd) { return a[(r() * a.length) | 0]; }
function fmtTime(sec) { sec = Math.max(0, sec | 0); const h = (sec / 3600) | 0, m = ((sec % 3600) / 60) | 0, s = sec % 60; return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0'); }
// 点が矩形 [x0,z0,x1,z1] の中か
const inR = (r, x, z, m = 0) => x >= r[0] - m && x <= r[2] + m && z >= r[1] - m && z <= r[3] + m;

// ════════════════ 世界のしくみ（マス・階・扉・階段・物） ════════════════
const GW = 256, GH = 160, N = GW * GH, LH = 2.4, MINL = -1, MAXL = 10;
const EMPTY = 0, FLOOR = 1, WALL = 2, WIN = 3, DOOR = 4, RAIL = 5, STAIR = 6, HOLE = 7, SOLIDX = 8, SHAFT = 9, GLASS = 10, ROOF = 11, FENCE = 12;
const WALLISH = new Set([WALL, WIN, DOOR, SHAFT, SOLIDX]);
const FM = { none: 0, tile: 1, wood: 2, carpet: 3, conc: 4, metal: 5, roof: 6, tatami: 7, lino: 8, deck: 9, stone: 10, train: 11 };
const LEV = {}; for (let L = MINL; L <= MAXL; L++)LEV[L] = { t: new Uint8Array(N), fm: new Uint8Array(N), bid: new Uint8Array(N), wv: new Uint8Array(N) };
const key = (x, y) => y * GW + x;
const BLD = [null]; function defBuilding(o) { o.id = BLD.length; o.rooms = o.rooms || []; BLD.push(o); return o.id }
const DOORS = new Map(), OBJ = [], SOLID = {}, RUNS = [], RUNON = {}, HOLEON = {};
for (let L = MINL; L <= MAXL; L++) { SOLID[L] = new Map(); RUNON[L] = new Map(); HOLEON[L] = new Map() }

function addDoor(L, x, y, kind, lock) { const d = { L, x, y, kind, open: kind === 'T', lock: lock || null, stuck: kind === 'G', axis: 'x', bid: LEV[L].bid[key(x, y)], id: 'd' + L + '_' + x + '_' + y }; DOORS.set(L * N + key(x, y), d); return d }
function stamp(L, ox, oy, rows, bid, fm = FM.tile, lockKey) {
  const g = LEV[L];
  for (let j = 0; j < rows.length; j++)for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i]; if (ch === ' ') continue; const x = ox + i, y = oy + j, k = key(x, y);
    g.bid[k] = bid; g.fm[k] = fm; g.wv[k] = Math.floor(hash(x * 7 + L, y * 13) * 16);
    switch (ch) {
      case '#': g.t[k] = WALL; break; case 'W': g.t[k] = WIN; break;
      case '.': g.t[k] = FLOOR; break; case ',': g.t[k] = FLOOR; g.fm[k] = FM.wood; break; case ':': g.t[k] = FLOOR; g.fm[k] = FM.carpet; break; case ';': g.t[k] = FLOOR; g.fm[k] = FM.conc; break;
      case 't': g.t[k] = FLOOR; g.fm[k] = FM.tatami; break; case 'l': g.t[k] = FLOOR; g.fm[k] = FM.lino; break; case 'm': g.t[k] = FLOOR; g.fm[k] = FM.train; break; case 'k': g.t[k] = FLOOR; g.fm[k] = FM.deck; break;
      case 'o': g.t[k] = FLOOR; g.fm[k] = FM.roof; break;
      case 'D': g.t[k] = DOOR; addDoor(L, x, y, 'D'); break; case 'S': g.t[k] = DOOR; addDoor(L, x, y, 'S'); break; case 'T': g.t[k] = DOOR; addDoor(L, x, y, 'T'); break;
      case 'L': g.t[k] = DOOR; addDoor(L, x, y, 'D', lockKey || 'key_staff'); break; case 'K': g.t[k] = DOOR; addDoor(L, x, y, 'gate', 'crowbar'); break;
      case 'G': g.t[k] = DOOR; addDoor(L, x, y, 'G'); break; case 'E': g.t[k] = DOOR; addDoor(L, x, y, 'E'); break;
      case 's': g.t[k] = STAIR; break; case 'h': g.t[k] = HOLE; break; case 'x': g.t[k] = SOLIDX; break; case 'e': g.t[k] = SHAFT; break;
      case 'g': g.t[k] = GLASS; break; case 'r': g.t[k] = RAIL; g.fm[k] = fm === FM.tile ? FM.conc : fm; break; case 'f': g.t[k] = FENCE; g.fm[k] = FM.roof; break; case 'R': g.t[k] = ROOF; g.fm[k] = FM.roof; break;
    }
  }
}
// 文字の絵を、配列で組み立てるための道具
function grid(w, h, ch = '#') { return Array.from({ length: h }, () => Array(w).fill(ch)) }
function gfill(g, x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++)for (let x = x0; x <= x1; x++)g[y][x] = ch }
const grows = g => g.map(r => r.join(''));
function addRun(L, tiles, dir, entry, arr) { const r = { L, tiles, dir, len: tiles.length, set: new Set(tiles.map(([x, y]) => key(x, y))), entry: key(...entry), arr: key(...arr), entryXY: entry, arrXY: arr }; RUNS.push(r); for (const k of r.set) { RUNON[L].set(k, r); HOLEON[L + 1].set(k, r) } return r }
// 折り返し階段の芯（外枠 8×6・中 6×4）。下の階から上の階まで、1階ごとに向きが変わる
function makeCore(ox, oy, L0, L1, bid, opt = {}) {
  for (let L = L0; L <= L1; L++) {
    const even = (L - L0) % 2 === 0, up = L < L1, down = L > L0, g = grid(8, 6, '#');
    gfill(g, 1, 1, 6, 4, ';');
    if (even) { if (up) { g[1][2] = g[1][3] = g[1][4] = 's'; g[1][5] = 'x' } if (down) { g[3][3] = g[3][4] = g[3][5] = 'h' } }
    else { if (down) { g[1][2] = g[1][3] = g[1][4] = 'h' } if (up) { g[3][2] = 'x'; g[3][3] = g[3][4] = g[3][5] = 's' } }
    const w = opt.win || [[0, 3], [0, 4], [5, 2]]; for (const [r, c] of w) if (g[r][c] === '#') g[r][c] = 'W';
    for (const d of (opt.doors && opt.doors[L]) || []) g[d[0]][d[1]] = d[2] || 'D';
    stamp(L, ox, oy, grows(g), bid, FM.conc);
    const bx = ox + 1, by = oy + 1;
    if (even && up) addRun(L, [[bx + 1, by], [bx + 2, by], [bx + 3, by]], [1, 0], [bx, by], [bx + 4, by]);
    if (!even && up) addRun(L, [[bx + 4, by + 2], [bx + 3, by + 2], [bx + 2, by + 2]], [-1, 0], [bx + 5, by + 2], [bx + 1, by + 2]);
  }
}
function obj(o) { o.L = o.L || 0; o.w = o.w || 1; o.h = o.h || 1; o.id = o.id || ('o' + OBJ.length); OBJ.push(o); if (o.solid !== false) for (let i = 0; i < o.w; i++)for (let j = 0; j < o.h; j++)SOLID[o.L].set(key(o.x + i, o.y + j), o); return o }
function finishDoors() {
  for (const d of DOORS.values()) { const g = LEV[d.L], t = (x, y) => g.t[key(x, y)]; const open = (x, y) => t(x, y) === FLOOR || t(x, y) === STAIR || d.L === 0 && t(x, y) === EMPTY; d.axis = (open(d.x, d.y - 1) || open(d.x, d.y + 1)) ? 'x' : 'y'; d.bid = g.bid[key(d.x, d.y)] }
  for (const d of DOORS.values()) if (d.kind === 'G') d.group = [...DOORS.values()].filter(e => e.kind === 'G' && e.L === d.L && Math.abs(e.x - d.x) + Math.abs(e.y - d.y) <= 1);
}

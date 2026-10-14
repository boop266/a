// ════════════════ 町（地面・建物の間取り・家具・通りの小物） ════════════════
const TG = { grass: 0, road: 1, walk: 2, plaza: 3, dirt: 4, field: 5, forest: 6, water: 7, lot: 8, gravel: 9, platform: 10, tactile: 11, sand: 12, stone: 13, bridge: 14, bank: 15, yard: 16, lane: 17, sgravel: 18, pond: 19 };
const GT = new Uint8Array(N);
const setG = (x0, y0, x1, y1, t) => { for (let y = Math.max(0, y0); y <= Math.min(GH - 1, y1); y++)for (let x = Math.max(0, x0); x <= Math.min(GW - 1, x1); x++)GT[key(x, y)] = t };
const riverX = y => 128 + 3 * Math.sin(y / 13) + 2 * Math.sin(y / 5.3);
// 町のまわり：畑と森
for (let y = 0; y < GH; y++)for (let x = 0; x < GW; x++) {
  const d = Math.hypot(x - 64, y - 70); let t = TG.grass;
  if (d > 62 && fbm(x / 13, y / 13) > .55) t = TG.field; if (fbm(x / 17 + 40, y / 17) > .6 && d > 56) t = TG.forest;
  const rx = riverX(y), dx = Math.abs(x + .5 - rx); if (dx < 3.6) t = TG.water; else if (dx < 6.5) t = TG.bank;
  GT[key(x, y)] = t;
}
// 線路・駅
setG(0, 11, GW - 1, 18, TG.gravel); setG(36, 19, 92, 23, TG.platform); setG(36, 20, 92, 20, TG.tactile);
setG(44, 32, 78, 38, TG.plaza);
// 道
setG(0, 69, GW - 1, 69, TG.walk); setG(0, 74, GW - 1, 74, TG.walk); setG(0, 70, GW - 1, 73, TG.road);
setG(59, 39, 59, 68, TG.walk); setG(64, 39, 64, 68, TG.walk); setG(59, 75, 59, GH - 1, TG.walk); setG(64, 75, 64, GH - 1, TG.walk); setG(60, 39, 63, GH - 1, TG.road);
setG(2, 52, 58, 53, TG.lane); setG(2, 87, 33, 88, TG.lane);
// 川にかかる橋（車道と歩道、その外に欄干の足もと）
const BRY = [68, 69, 70, 71, 72, 73, 74, 75].map(riverX), BRX0 = Math.floor(Math.min(...BRY) - 5), BRX1 = Math.ceil(Math.max(...BRY) + 5);
setG(BRX0, 68, BRX1, 68, TG.bridge); setG(BRX0, 75, BRX1, 75, TG.bridge);
for (let y = 10; y <= 19; y++) { const rx = riverX(y); setG(Math.floor(rx - 6), y, Math.ceil(rx + 6), y, TG.gravel) }
// 広場・神社・公園・学校
setG(76, 40, 108, 66, TG.plaza);
setG(2, 21, 36, 41, TG.forest); setG(8, 22, 28, 40, TG.sgravel); setG(16, 31, 17, 51, TG.stone);
setG(34, 76, 57, 100, TG.grass); setG(50, 79, 53, 82, TG.sand);
for (let y = 76; y <= 100; y++)for (let x = 34; x <= 57; x++) { if (Math.hypot(x - 42, (y - 92) * 1.2) < 4.6) GT[key(x, y)] = TG.pond; if (Math.abs(x - 46 - Math.sin(y / 4) * 2) < .8 || Math.abs(y - 84) < .7 && x < 56) GT[key(x, y)] = TG.dirt }
setG(68, 93, 106, 114, TG.yard);
setG(66, 56, 75, 68, TG.lot); setG(6, 56, 34, 68, TG.lot);

// 東の果て、線路の先の丘に灯りがひとつ（夜だけ見える）
const FARLIGHT = [173.5, 5.5];
// ───────── 電波塔 ─────────
const BX = 82, BY = 46, DCX = BX + 8.5, DCY = BY + 6.5;
const T_ID = defBuilding({ name: '電波塔', ext: ['conc', '#d4cdc0'], int: ['inner', '#e4ddd0'], roof: 'flat', glassFrame: '#b8bcc2', light: '#ffe2b0' });
stamp(0, BX, BY, [
  '##################',
  '#....#,,,,,,#....#',
  'W....D,,,,,,#hhh.#',
  '#....#,,,,,,#....W',
  '#....#########L###',
  '#....########....W',
  '#....########ee..#',
  'W....########ee..#',
  '#....########.E..W',
  '#D###########....#',
  '#................#',
  'W................W',
  '#................#',
  '#W#W###WGGW###W#W#'], T_ID);
stamp(-1, BX, BY, [
  '##################', '#xxxxxxxxxxx#xxxx#', '#xxxxxxxxxxx;sssx#', '#xxxxx#;;;;;;;;;;#', '#xxxxx#;;;;;;;;;;#', '#xxxxx#;;;;;;;;;;#', '#xxxxx#;;;;;;;;;;#',
  '#xxxxx#;;;;;;;;;;#', '#xxxxx#;;;;;;;;;;#', '#xxxxx#;;;;;;;;;;#', '#xxxxx#;;;;;;;;;;#', '#xxxxx############', '##################', '##################'], T_ID, FM.conc);
addRun(-1, [[BX + 13, BY + 2], [BX + 14, BY + 2], [BX + 15, BY + 2]], [1, 0], [BX + 12, BY + 2], [BX + 16, BY + 2]);
{ const doors = { 0: [[5, 1]], 8: [[0, 4, '.'], [5, 4, '.']] }; makeCore(BX + 5, BY + 4, 0, 9, T_ID, { doors }) }
for (let L = 1; L <= 9; L++)if (L !== 8) for (const [x, y] of [[13, 6], [14, 6], [13, 7], [14, 7], [14, 8]]) stamp(L, BX + x, BY + y, ['e'], T_ID);
for (let j = 0; j < 14; j++)for (let i = 0; i < 18; i++) { const k = key(BX + i, BY + j); if (LEV[1].t[k] === EMPTY) { LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = T_ID } }
{
  const inD = (x, y) => { const dx = x + .5 - DCX, dy = y + .5 - DCY; return Math.abs(dx) <= 9 && Math.abs(dy) <= 9 && Math.abs(dx) + Math.abs(dy) <= 12.5 };
  for (let y = BY - 6; y < BY + 20; y++)for (let x = BX - 4; x < BX + 22; x++) { if (!inD(x, y)) continue; const k = key(x, y); if (LEV[8].t[k] && LEV[8].bid[k] === T_ID && LEV[8].t[k] !== FLOOR) continue; const edge = !inD(x + 1, y) || !inD(x - 1, y) || !inD(x, y + 1) || !inD(x, y - 1); if (LEV[8].t[k]) continue; LEV[8].t[k] = edge ? GLASS : FLOOR; LEV[8].fm[k] = FM.deck; LEV[8].bid[k] = T_ID }
  stamp(8, BX + 14, BY + 8, ['E'], T_ID); for (const [x, y] of [[13, 6], [14, 6], [13, 7], [14, 7]]) stamp(8, BX + x, BY + y, ['e'], T_ID);
}
// 点検階：関係者以外の扉とはしご
stamp(9, BX + 5, BY + 7, ['######K#'], T_ID); stamp(9, BX + 6, BY + 8, [';;;;;;'], T_ID, FM.conc);
stamp(10, BX + 5, BY + 4, ['rrrrrrrr', 'r;;;;;;r', 'r;;;;;;r', 'r;;;;;;r', 'r;;;;;;r', 'rrrrrrrr'], T_ID, FM.conc);
BLD[T_ID].rooms = [[-1, BX, BY, BX + 17, BY + 13, '地下　機械室'], [0, BX + 6, BY + 5, BX + 11, BY + 8, '非常階段　1階'], [0, BX + 1, BY + 1, BX + 4, BY + 8, 'おみやげ売り場'], [0, BX + 6, BY + 1, BX + 11, BY + 3, '展示室'], [0, BX + 13, BY + 1, BX + 16, BY + 3, 'スタッフ室'], [0, BX + 13, BY + 5, BX + 16, BY + 9, 'エレベーターホール'], [0, BX, BY, BX + 17, BY + 13, '電波塔　1階ロビー'], [8, BX - 4, BY - 6, BX + 22, BY + 20, '展望台'], [9, BX, BY, BX + 17, BY + 13, '点検階'], [10, BX, BY, BX + 17, BY + 13, 'てっぺん']];

// ───────── コンビニ ─────────
const KX = 66, KY = 58;
const K_ID = defBuilding({ name: 'コンビニ', ext: ['shop', '#f2f0ea'], int: ['inner', '#f4f2ec'], roof: 'flat', glassFrame: '#d0d4d8', shopGlass: true });
stamp(0, KX, KY, ['##########', '#.....#;;#', '#.....D;;#', '#.....#;;#', '#........W', '#........W', '#........W', 'WWWWGGWWW#'], K_ID);
for (let j = 0; j < 8; j++)for (let i = 0; i < 10; i++) { const k = key(KX + i, KY + j); LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = K_ID }
BLD[K_ID].rooms = [[0, KX + 7, KY + 1, KX + 8, KY + 3, 'コンビニのバックヤード'], [0, KX, KY, KX + 9, KY + 7, 'コンビニ']];

// ───────── ガソリンスタンド ─────────
const GX = 22, GY = 57;
const S_ID = defBuilding({ name: 'ガソリンスタンド', ext: ['conc', '#ece6da'], int: ['inner', '#f0ebe0'], roof: 'flat', glassFrame: '#c8ccd0' });
stamp(0, GX, GY, ['#########', '#.....#,#', '#.....#,#', 'W.....D,#', '#.....#,#', '##WGGW###'], S_ID);
for (let j = 0; j < 6; j++)for (let i = 0; i < 9; i++) { const k = key(GX + i, GY + j); LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = S_ID }
BLD[S_ID].rooms = [[0, GX + 7, GY + 1, GX + 7, GY + 4, 'スタンドの倉庫'], [0, GX, GY, GX + 8, GY + 5, 'ガソリンスタンドの店']];

// ───────── 民家 ─────────
const HOUSE1 = ['#########', '#ttt#,,,#', 'Wttt#,,,W', '#tttD,,,#', '##D###D##', '#,,,,,,,#', 'W,,,,,,,W', '####D####'];
const HOUSE2A = ['##########', '#x,,,#ttt#', '#s,,,Dttt#', 'Ws,,,#ttt#', '#s,,,#####', '#,,,,,,,,W', 'W,,,,,,,,#', '####D#####'];
const HOUSE2B = ['##########', '#;:::#:::#', '#h:::D:::W', 'Wh:::#:::#', '#h:::#####', '#;:::::::W', 'W::::::::#', '####S#####', ' kkkkkkkk ', ' rrrrrrrr '];
const HOUSES = [];
function house(x, y, two, ci, family) {
  const C = [['plaster', '#e8e0cc', 'kawara'], ['siding', '#d8dcd4', 'blue'], ['plaster', '#efe6d2', 'red'], ['siding', '#e4d8c0', 'kawara'], ['plaster', '#dcd8cc', 'brown'], ['siding', '#cfd8de', 'red']][ci];
  const id = defBuilding({ name: '民家', ext: [C[0], C[1]], int: ['innerjp', '#efe6d6'], roof: 'gable', roofTex: C[2], x, y, w: two ? 10 : 9, h: 8, levels: two ? 2 : 1, glassFrame: '#c8ccd0', family });
  stamp(0, x, y, two ? HOUSE2A : HOUSE1, id, FM.wood);
  if (two) { stamp(1, x, y, HOUSE2B, id, FM.carpet); addRun(0, [[x + 1, y + 4], [x + 1, y + 3], [x + 1, y + 2]], [0, -1], [x + 1, y + 5], [x + 1, y + 1]) }
  BLD[id].rooms = two ? [[1, x, y, x + 9, y + 9, '2階'], [0, x, y, x + 9, y + 7, '民家']] : [[0, x, y, x + 8, y + 7, '民家']];
  HOUSES.push({ id, x, y, two }); return id;
}
house(4, 43, 0, 0, 'tanaka'); house(22, 42, 1, 1, 'sato'); house(35, 43, 0, 2, 'suzuki'); house(46, 43, 0, 3, 'kato'); house(6, 78, 1, 4, 'ito'); house(20, 79, 0, 5, 'yamada');

// ───────── 学校 ─────────
const SX = 70, SY = 82;
const SCH = defBuilding({ name: '学校', ext: ['school', '#e8e2d2'], int: ['inner', '#eef0e6'], roof: 'flat', glassFrame: '#c8ccd0' });
for (let L = 0; L <= 1; L++) {
  const g = grid(30, 11, '#'); gfill(g, 1, 1, 9, 6, ','); gfill(g, 11, 1, 19, 6, L === 1 ? ':' : ','); gfill(g, 1, 8, 28, 9, 'l');
  if (L === 0) { gfill(g, 11, 1, 19, 6, 'l') }
  for (let x = 2; x <= 8; x++)g[0][x] = 'W'; for (let x = 12; x <= 18; x++)g[0][x] = 'W';
  for (let x = 1; x <= 28; x += 2)g[10][x] = 'W'; g[8][29] = g[9][29] = 'W'; g[8][0] = g[9][0] = 'W';
  g[7][5] = 'S'; g[7][15] = 'S'; if (L === 0) { g[10][13] = 'G'; g[10][14] = 'G' }
  stamp(L, SX, SY, grows(g), SCH, FM.lino);
}
{ const g = grid(30, 11, 'o'); for (let x = 0; x < 30; x++) { g[0][x] = 'f'; g[10][x] = 'f' } for (let y = 0; y < 11; y++) { g[y][0] = 'f'; g[y][29] = 'f' } stamp(2, SX, SY, grows(g), SCH, FM.roof) }
makeCore(SX + 21, SY + 2, 0, 2, SCH, { doors: { 0: [[5, 1, 'D']], 1: [[5, 1, 'D']], 2: [[5, 4, 'D']] }, win: [[5, 2]] });
for (let x = 21; x <= 28; x++) if (LEV[0].t[key(SX + x, SY + 1)] === WALL) { }
BLD[SCH].rooms = [[0, SX + 1, SY + 1, SX + 9, SY + 6, '1年1組の教室'], [0, SX + 11, SY + 1, SX + 19, SY + 6, '保健室'], [1, SX + 1, SY + 1, SX + 9, SY + 6, '音楽室'], [1, SX + 11, SY + 1, SX + 19, SY + 6, '3年2組の教室'], [0, SX + 22, SY + 3, SX + 27, SY + 6, '学校の階段'], [1, SX + 22, SY + 3, SX + 27, SY + 6, '学校の階段'], [2, SX, SY, SX + 29, SY + 10, '学校の屋上'], [0, SX, SY, SX + 29, SY + 10, '学校の廊下'], [1, SX, SY, SX + 29, SY + 10, '2階の廊下']];

// ───────── 駅と電車 ─────────
const STX = 48, STY = 24;
const ST_ID = defBuilding({ name: '駅', ext: ['tiles', '#d8ccb4'], int: ['inner', '#e8e4da'], roof: 'flat', glassFrame: '#c8ccd0' });
{
  const g = grid(25, 8, '#'); gfill(g, 1, 1, 23, 6, '.'); for (let y = 1; y <= 6; y++) { g[y][6] = '#'; g[y][18] = '#' } g[3][6] = 'D'; g[3][18] = '.'; g[4][18] = '.';
  gfill(g, 1, 1, 5, 6, ','); for (let x = 10; x <= 14; x++)g[0][x] = '.'; for (let x = 1; x <= 23; x += 2)g[7][x] = 'W'; g[7][11] = 'G'; g[7][12] = 'G'; g[7][13] = 'W';
  stamp(0, STX, STY, grows(g), ST_ID);
  for (let j = 0; j < 8; j++)for (let i = 0; i < 25; i++) { const k = key(STX + i, STY + j); LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = ST_ID }
}
BLD[ST_ID].rooms = [[0, STX + 1, STY + 1, STX + 5, STY + 6, '駅事務室'], [0, STX + 19, STY + 1, STX + 23, STY + 6, '待合室'], [0, STX, STY, STX + 24, STY + 7, '駅の改札']];
const TR_ID = defBuilding({ name: '電車', ext: ['metal', '#c8ccd2'], int: ['inner', '#e8e8e2'], roof: 'train', glassFrame: '#5a5e66', train: true });
function car(x0, first) {
  const g = grid(18, 5, '#'); gfill(g, 1, 1, 16, 3, 'm'); for (let x = 2; x <= 15; x++) { g[0][x] = 'W'; g[4][x] = 'W' } for (const x of [4, 9, 14]) g[4][x] = 'T';
  if (first) { g[1][3] = g[3][3] = '#'; g[2][3] = 'D'; g[0][1] = 'W'; g[2][0] = 'W'; g[2][17] = 'D' } else g[2][0] = 'D';
  stamp(0, x0, 14, grows(g), TR_ID, FM.train); for (let j = 0; j < 5; j++)for (let i = 0; i < 18; i++) { const k = key(x0 + i, 14 + j); LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = TR_ID }
}
car(40, true); car(59, false); stamp(0, 58, 15, ['#', 'm', '#'], TR_ID, FM.train);
BLD[TR_ID].rooms = [[0, 41, 15, 42, 17, '電車の運転席'], [0, 40, 14, 76, 18, '止まったままの電車']];

// ───────── 神社 ─────────
const JX = 12, JY = 24;
const J_ID = defBuilding({ name: '神社', ext: ['vermil', '#ece4d4'], int: ['board', '#a8885e'], roof: 'gable', roofTex: 'copper', x: JX, y: JY, w: 10, h: 7, levels: 1, shrine: true, glassFrame: '#6a4a30' });
stamp(0, JX, JY, ['##########', '#kkkkkkkk#', '#kkkkkkkk#', '#kkkkkkkk#', '#kkkkkkkk#', '#kkkkkkkk#', '###SSSS###'], J_ID, FM.deck);
BLD[J_ID].rooms = [[0, JX, JY, JX + 9, JY + 6, '拝殿']];
finishDoors();
for (const d of DOORS.values()) if (d.kind === 'S' && d.bid === J_ID) d.open = false;

// 地上の床は、地面の絵にも入れる
for (let k = 0; k < N; k++)if (LEV[0].bid[k] && LEV[0].t[k] !== EMPTY) GT[k] = 100 + LEV[0].fm[k];

// ════════════════ 物 ════════════════
const furn = (type, x, y, o = {}) => obj({ type, x, y, ...o });
const IT = {
  water: { n: '水', c: '#5aaef0', use: p => { p.thirst = clamp(p.thirst + 35, 0, 100); return 'のどが うるおった' } },
  tea: { n: 'お茶', c: '#7ab86a', use: p => { p.thirst = clamp(p.thirst + 30, 0, 100); return 'ほっとする味' } },
  juice: { n: 'ジュース', c: '#f0a040', use: p => { p.thirst = clamp(p.thirst + 25, 0, 100); p.hunger = clamp(p.hunger + 5, 0, 100); return 'あまい' } },
  bread: { n: 'パン', c: '#d8a860', use: p => { p.hunger = clamp(p.hunger + 25, 0, 100); return 'おなかが少しふくれた' } },
  onigiri: { n: 'おにぎり', c: '#f0f0e8', use: p => { p.hunger = clamp(p.hunger + 30, 0, 100); return 'しょっぱくて、おいしい' } },
  can: { n: '缶詰', c: '#b8b8c0', use: p => { p.hunger = clamp(p.hunger + 40, 0, 100); return 'しっかり食べた' } },
  snack: { n: 'おかし', c: '#e85a8a', use: p => { p.hunger = clamp(p.hunger + 12, 0, 100); return 'ちょっと元気' } },
  choco: { n: 'チョコ', c: '#7a4a2a', use: p => { p.hunger = clamp(p.hunger + 15, 0, 100); p.stam = clamp(p.stam + 30, 0, 100); return '力がわいてきた' } },
  bandage: { n: '包帯', c: '#f0ece0', use: p => { p.hp = clamp(p.hp + 30, 0, 100); return '傷の手当てをした' } },
  key_staff: { n: 'スタッフの鍵', c: '#e0c040' }, crowbar: { n: 'バール', c: '#c0392b' },
  jerry_full: { n: '携行缶（満タン）', c: '#c8342a' }, jerry_empty: { n: '携行缶（から）', c: '#7a4038' },
  postcard: { n: '絵はがき', c: '#8ac0e8' }, battery: { n: '電池', c: '#4a8a4a' }, lighter: { n: 'ライター', c: '#e05a3a' }, wood: { n: '薪', c: '#8a6440' },
  omamori: { n: 'お守り', c: '#c83a4a' }, photo: { n: '写真', c: '#e8e0d0' },
};
// 塔 1階
furn('counter', BX + 2, BY + 10, { w: 3, name: 'チケット売り場', items: ['key_staff'] });
furn('rack', BX + 13, BY + 11, { w: 2, name: 'パンフレット', read: '【電波塔のご案内】\n地上150m 展望台 ／ 地上187m 点検階より上は関係者のみ\n停電時：地下の発電設備から館内に電気を送ります' });
furn('vending', BX + 16, BY + 10, { name: '自動販売機', items: ['water', 'tea', 'juice'] });
furn('bench', BX + 5, BY + 11, { w: 2 }); furn('bench', BX + 11, BY + 11, { w: 2 });
furn('model', BX + 8, BY + 10, { w: 2, name: '塔の模型', read: '塔の模型。\n赤と白の鉄骨が、上にいくほど細くなっていく。\nいちばん上には、夜に赤く光るランプ。' });
furn('plant', BX + 1, BY + 12); furn('plant', BX + 16, BY + 12);
for (const [x, y, items] of [[1, 2, ['snack', 'postcard']], [1, 4, ['choco']], [1, 6, ['juice', 'snack']], [3, 3, ['water']], [3, 6, ['postcard', 'onigiri']]]) furn('shelf', BX + x, BY + y, { name: 'おみやげの棚', items });
furn('case', BX + 7, BY + 2, { w: 2, name: '展示ケース', read: '「あの日の夕焼け」という写真。\n展望台から撮った、まっ赤な街。\n下に小さく：ここから見る景色は、毎日ちがう。' });
furn('case', BX + 10, BY + 1, { name: '展示ケース', read: '建設中の写真。\n鉄骨の上に座って、お弁当を食べる作業員たち。\nみんな、笑っている。' });
furn('desk', BX + 13, BY + 1, { name: 'スタッフの机', items: ['battery'], read: '走り書きのメモ：\n「停電したら地下の発電機。燃料はスタンドで」' });
furn('locker', BX + 16, BY + 1, { name: 'ロッカー', items: ['bread', 'water'] });
// 地下
furn('generator', BX + 8, BY + 5, { L: -1, w: 2, name: '発電機' });
furn('tank', BX + 11, BY + 4, { L: -1, name: '燃料タンク', read: '燃料タンク。中はからっぽ。\n「携行缶で発電機に直接給油すること」とテープが貼ってある。' });
furn('breaker', BX + 16, BY + 6, { L: -1, name: 'ブレーカー' });
furn('toolcart', BX + 12, BY + 9, { L: -1, name: '工具ワゴン', items: ['crowbar'] });
furn('mattress', BX + 7, BY + 9, { L: -1, w: 2, solid: false, name: '寝袋', sleep: true });
furn('note', BX + 9, BY + 9, { L: -1, solid: false, name: '書き置き', read: '誰かの書き置き：\n「ここで三日すごした。\n上の展望台からなら、ほかの町の灯りが見えるかもしれない。\nでも燃料がない。スタンドまで行く勇気もない。\n……先に行く。駅の方へ。」' });
furn('pipes', BX + 15, BY + 3, { L: -1, w: 2 }); furn('cans', BX + 7, BY + 8, { L: -1, solid: false });
// 展望台
for (const [x, y] of [[DCX - .5, DCY + 7.5], [DCX - 8.5, DCY - .5], [DCX + 7.5, DCY - .5], [DCX - .5, DCY - 8.5], [DCX + 5.5, DCY + 5.5], [DCX - 6.5, DCY - 6.5]]) furn('telescope', Math.floor(x), Math.floor(y), { L: 8, name: '望遠鏡' });
for (const [x, y] of [[DCX - 5.5, DCY + 5.5], [DCX + 5.5, DCY - 5.5], [DCX - 6.5, DCY + 3.5], [DCX + 2.5, DCY + 6.5]]) furn('bench', Math.floor(x), Math.floor(y), { L: 8, w: 2, name: 'ベンチ', seat: true });
furn('cafe', Math.floor(DCX - 3.5), Math.floor(DCY - 7.5), { L: 8, w: 4, name: 'カフェのカウンター', items: ['water', 'bread', 'choco'] });
furn('note', Math.floor(DCX - 5.5) + 1, Math.floor(DCY + 5.5) + 1, { L: 8, solid: false, name: 'ベンチの書き置き', read: 'ベンチに残された紙：\n「ここから見る夕焼けが、世界でいちばん好きだった。\nまた来よう。ふたりで。」' });
furn('plant', Math.floor(DCX + 6.5), Math.floor(DCY + 2.5), { L: 8 }); furn('plant', Math.floor(DCX - 7.5), Math.floor(DCY - 2.5), { L: 8 });
furn('ladder', BX + 6, BY + 8, { L: 9, name: 'てっぺんへのはしご' });
furn('toolbox', BX + 6, BY + 8, { L: 9, name: '点検用の箱', items: ['bandage'] });
furn('ladder_top', BX + 6, BY + 8, { L: 10, solid: false, name: '下へのはしご' });
furn('antenna', BX + 8, BY + 6, { L: 10, name: 'アンテナ' });
// コンビニ
for (let i = 1; i <= 4; i++) furn('fridge_shop', KX + 1, KY + i, { name: '飲み物の冷蔵ケース', items: [['water', 'tea'], ['juice'], ['tea', 'water'], ['juice', 'water']][i - 1] });
furn('shelf', KX + 3, KY + 2, { name: '商品棚', items: ['onigiri', 'bread'] }); furn('shelf', KX + 4, KY + 2, { name: '商品棚', items: ['snack', 'choco'] });
furn('shelf', KX + 3, KY + 5, { name: '商品棚', items: ['can'] }); furn('shelf', KX + 4, KY + 5, { name: '商品棚', items: ['bandage'] });
furn('register', KX + 7, KY + 4, { w: 2, name: 'レジ', read: 'レジの横に、手書きの紙：\n「ご自由にどうぞ。\n　みなさん、どうかご無事で。　店長」' });
furn('magazine', KX + 1, KY + 6, { w: 2, name: '雑誌コーナー', read: '雑誌の表紙：「この夏、行きたい絶景100」\n日付は、あの日の前の週だった。' });
furn('atm', KX + 8, KY + 6); furn('boxes', KX + 7, KY + 1, { name: '段ボール', items: ['water', 'water'] }); furn('boxes', KX + 8, KY + 3, { name: '段ボール', items: ['lighter', 'wood'] });
// スタンド
for (const [x, y, items] of [[2, 2, ['water', 'snack']], [2, 3, ['bread']], [4, 2, ['can', 'juice']], [4, 3, ['choco']]]) furn('shelf', GX + x, GY + y, { name: '商品棚', items });
furn('register', GX + 5, GY + 1, { name: 'レジ', items: [] }); furn('jerry', GX + 7, GY + 1, { name: '携行缶', items: ['jerry_full'] }); furn('cans', GX + 7, GY + 4, { solid: false });
furn('canopy', 8, 60, { w: 10, h: 6, solid: false }); for (const [x, y] of [[10, 62], [14, 62]]) furn('pump', x, y, { name: '給油機', read: '給油機。電気がこないので動かない。\n奥の店に、携行缶があるかもしれない。' });
// 民家の家具
const FAM = {
  tanaka: 'こどもの絵。クレヨンで、四人と一匹。\n「おとうさん　おかあさん　ぼく　ばあば　ぽち」\nすみに小さく：「また みんなで おまつり いこうね」',
  sato: '机の上の日記：\n「8月14日　はれ。あしたは花火大会。\nあの子に、浴衣を見せるんだ」',
  suzuki: '冷蔵庫に貼られたメモ：\n「先に避難所に行きます。駅で待ってるね。　母」',
  kato: '仏壇の写真立て。笑っているおじいさん。\nそばに、まだ新しいお線香の箱。',
  ito: '2階の窓に貼られた紙：\n「わたしたちは無事です。線路ぞいに、東へ行きます」',
  yamada: 'テーブルの上の手紙：\n「この家を見つけた人へ。\n食べものは好きに使ってください。\nどうか、生きて。」',
};
for (const h of HOUSES) {
  const { x, y, two, id } = h, fam = BLD[id].family;
  if (!two) {
    furn('futon', x + 1, y + 1, { w: 2, name: '布団', sleep: true, solid: false }); furn('chest', x + 3, y + 1, { name: 'たんす', items: fam === 'tanaka' ? ['bandage'] : ['snack'] });
    furn('fridge', x + 7, y + 1, { name: '冷蔵庫', items: ['water'] }); furn('kitchen', x + 5, y + 1, { w: 2, name: '台所の戸棚', items: ['can'] });
    furn('kotatsu', x + 3, y + 5, { name: 'こたつ', items: [], read: FAM[fam] }); furn('tv', x + 1, y + 5, { w: 1, name: 'テレビ' }); furn('sofa', x + 5, y + 6, { w: 2 });
    furn('shoes', x + 5, y + 6, { solid: false });
  } else {
    furn('kitchen', x + 2, y + 1, { w: 2, name: '台所', items: ['can', 'onigiri'] }); furn('fridge', x + 4, y + 1, { name: '冷蔵庫', items: ['tea'] });
    furn('table', x + 3, y + 3, { name: 'テーブル' }); furn('futon', x + 6, y + 1, { w: 2, name: '布団', sleep: true, solid: false }); furn('butsudan', x + 8, y + 3, { name: '仏壇', read: '小さな仏壇。お供えのみかんが、すっかりしなびている。' });
    furn('sofa', x + 5, y + 6, { w: 2 }); furn('tv', x + 8, y + 5, { w: 1 });
    furn('bed', x + 6, y + 1, { L: 1, w: 2, name: 'ベッド', sleep: true }); furn('desk', x + 3, y + 1, { L: 1, name: '勉強机', items: ['choco'], read: FAM[fam] });
    furn('bookshelf', x + 8, y + 3, { L: 1, name: '本棚', read: '本棚。図鑑、まんが、旅行のガイドブック。\n「北の町の灯台めぐり」に、付せんがたくさん。' });
    furn('laundry', x + 2, y + 8, { L: 1, w: 4, solid: false });
  }
}
// 学校
for (const L of [0, 1]) { for (const cx of [2, 4, 6, 8]) for (const cy of [3, 5]) { if (L === 1) continue; furn('sdesk', SX + cx, SY + cy, { L }) } }
furn('board', SX + 3, SY + 1, { w: 4, solid: false, name: '黒板', read: '黒板に、チョークの大きな字：\n「1年1組　みんなで、また春に。」\nまわりに、たくさんの落書きとハートマーク。' });
furn('tdesk', SX + 5, SY + 2, { w: 2, name: '先生の机', items: ['snack'] });
furn('cbed', SX + 12, SY + 1, { w: 2, name: '保健室のベッド', sleep: true }); furn('cbed', SX + 12, SY + 4, { w: 2, name: '保健室のベッド', sleep: true });
furn('medicine', SX + 18, SY + 1, { name: '薬の棚', items: ['bandage', 'bandage'] }); furn('tdesk', SX + 16, SY + 5, { w: 2, name: '保健の先生の机', read: '日誌：「熱のある子、3名。様子見。\n校庭で待つように、と放送があった」' });
for (const cx of [12, 14, 16, 18]) for (const cy of [3, 5]) furn('sdesk', SX + cx, SY + cy, { L: 1 });
furn('board', SX + 13, SY + 1, { L: 1, w: 4, solid: false, name: '黒板', read: '黒板いっぱいの寄せ書き：\n「3年2組　卒業おめでとう！」\n「みんな、生きてまた会おう」\n「先生ありがとう」「ずっと友達」' });
furn('piano', SX + 2, SY + 2, { L: 1, w: 2, name: 'ピアノ' });
for (const [x, y] of [[5, 3], [7, 3], [5, 5], [7, 5]]) furn('chair', SX + x, SY + y, { L: 1 });
furn('lockers', SX + 7, SY + 6, { w: 3, name: 'ロッカー', items: ['water'] });
furn('notice', SX + 10, SY + 9, { w: 2, solid: false, name: '掲示板', read: '掲示板：「夏休みのおしらせ」\n「プール開放日：8月15日（雨天中止）」' });
furn('watertank', SX + 8, SY + 2, { L: 2, w: 3, h: 3 }); furn('bench', SX + 4, SY + 6, { L: 2, w: 2, name: '屋上のベンチ', seat: true });
furn('firebarrel', SX + 14, SY + 5, { L: 2, name: 'ドラム缶' });
furn('podium', SX + 14, SY + 13); furn('flagpole', SX + 2, SY + 13);
for (const [x, y] of [[SX + 8, SY + 24], [SX + 30, SY + 24]]) furn('goal', x, y, { w: 1, h: 3 });
// 駅
furn('ticketm', STX + 7, STY + 1, { w: 2, name: '券売機', read: '券売機の画面は真っ暗。\n上の路線図：果ての町 ― ひかりが丘 ― 灯台岬\nいちばん東の駅に、だれかが丸をつけている。' });
for (const x of [10, 12, 14]) furn('gate', STX + x, STY);
furn('kiosk', STX + 15, STY + 2, { w: 2, name: '売店', items: ['onigiri', 'tea'] });
furn('bench', STX + 20, STY + 2, { w: 3 }); furn('bench', STX + 20, STY + 5, { w: 3, name: '待合室のベンチ', seat: true });
furn('desk', STX + 2, STY + 2, { w: 2, name: '駅員の机', read: '運転日誌（最後のページ）：\n「最終列車、当駅にて運転を打ち切る。\n線路の先、ひかりが丘の方角は、まだ明るかった。\n乗客を見送ったあと、私も歩いて東へ向かう」' });
furn('locker', STX + 1, STY + 5, { name: '駅員のロッカー', items: ['water', 'bandage'] });
furn('timetable', STX + 16, STY + 6, { w: 1, solid: false, name: '時刻表', read: '時刻表。\n最終の欄に、赤いペンで丸。\n「22:41　ひかりが丘ゆき」' });
for (const x of [50, 70]) furn('bench', x, 21, { w: 2, name: 'ホームのベンチ', seat: true });
furn('stationsign', 63, 22, { w: 2, name: '駅名標', read: '駅名標：\n　　　　はてのまち\n← 　　　　　　　ひかりがおか →' });
furn('vending', 57, 22, { name: '自動販売機', items: ['tea', 'water'] }); furn('pcanopy', 42, 20, { w: 42, h: 3, solid: false });
// 電車の中
for (const [x0, x1] of [[44, 56], [60, 75]]) { furn('seat', x0, 15, { w: x1 - x0 + 1 }) }
for (const seg of [[45, 48], [50, 53], [55, 56], [60, 62], [64, 67], [69, 72], [74, 75]]) furn('seat', seg[0], 17, { w: seg[1] - seg[0] + 1 });
furn('cab', 41, 15, { w: 2, name: '運転台', read: '運転台。キーは抜かれている。\nフロントガラスの内側に、メモがはさまっている。\n「この先の鉄橋は無事。いつか、だれかがまた走らせてくれますように」' });
furn('pantograph', 47, 16, { L: 1 }); furn('pantograph', 66, 16, { L: 1 });
// 神社
furn('torii', 15, 40, { w: 4, solid: false }); furn('torii', 15, 32.5 | 0, { w: 4, solid: false, small: true });
for (const [x, y] of [[14, 34], [19, 34], [14, 38], [19, 38]]) furn('lantern', x, y);
furn('komainu', 14, 31, { name: '狛犬' }); furn('komainu', 19, 31, { name: '狛犬', flip: true });
furn('saisen', 16, 31, { w: 2, name: 'さい銭箱' }); furn('temizu', 22, 35, { w: 2, h: 2, name: '手水舎', read: '手水舎。ひしゃくが一本、水の上に浮いている。\n水は、まだ澄んでいる。' });
furn('omikuji', 10, 33, { name: 'おみくじ' }); furn('ema', 23, 31, { w: 2, name: '絵馬', read: '絵馬がたくさん。\n「家族が無事でありますように」\n「またあの子と花火が見たい」\n「世界が、もとにもどりますように」\n「ずっと、ふたりで旅ができますように」' });
furn('shintree', 26, 27, { w: 2, h: 2, name: 'ご神木', read: '大きな楠。しめ縄が巻かれている。\n見上げると、葉のすきまから光がこぼれてくる。' });
furn('altar', JX + 4, JY + 1, { w: 2, name: '祭壇', read: '祭壇の奥に、まるい鏡。\n手を合わせると、少しだけ心が静かになった。', items: ['omamori'] });
furn('taiko', JX + 7, JY + 2, { name: '太鼓' });
// 公園
furn('swing', 37, 78, { w: 3, name: 'ブランコ' }); furn('slide', 45, 79, { w: 1, h: 3 }); furn('jungle', 51, 86, { w: 2, h: 2 });
for (const [x, y] of [[38, 84], [52, 92], [44, 98], [55, 80]]) furn('bench', x, y, { w: 2, name: '公園のベンチ', seat: true });
furn('firepit', 48, 95, { name: '焚き火のあと' }); furn('clock', 47, 82); furn('vending', 56, 77, { name: '自動販売機', items: ['juice', 'water'] });
furn('pbridge', 41, 91, { w: 2, h: 1, solid: false });
// 通りの小物
const POLES = [];
const pole = (x, y) => { const o = obj({ type: 'pole', x, y, solid: true }); POLES.push(o); return o };
const lineA = [], lineB = [], lineC = [], lineD = [];
for (let x = 4; x < 118; x += 8) if (x < 56 || x > 67) lineA.push(pole(x, 68 - 0));
for (let y = 42; y < 66; y += 8) lineB.push(pole(58, y));
for (let x = 6; x < 58; x += 9) lineC.push(pole(x, 54));
for (let y = 78; y < 150; y += 9) lineD.push(pole(65, y));
const WIRES = [lineA, lineB, lineC, lineD];
for (const [x, y, items] of [[65, 66, ['tea', 'water']], [46, 33, ['juice', 'tea']], [66, 94, ['water']], [78, 63, ['tea']], [31, 63, ['juice']], [13, 51, ['water']]]) furn('vending', x, y, { name: '自動販売機', items });
furn('postbox', 75, 67); furn('mirror', 58, 54); furn('tlight', 58, 75); furn('tlight', 65, 68); furn('busstop', 72, 37, { w: 2 }); furn('clock', 61, 34);
furn('statue', 53, 35, { name: '犬の像', read: '台座に「待ちつづけた犬」と彫ってある。\n首に、だれかが赤いスカーフを巻いていった。' });
for (const [x, y] of [[49, 33], [50, 33], [51, 33], [100, 92], [101, 92]]) furn('bike', x, y, { solid: false });
for (let x = 78; x < 108; x += 6) furn('flower', x, 64, { w: 2 }); for (let x = 46; x < 76; x += 7) furn('flower', x, 38, { w: 2 });
furn('bus', 64, 34, { w: 6, h: 2, name: 'バス', items: ['water'] });
// 塀・生け垣
const BWALL = [];
function bwall(x0, y0, x1, y1, kind = 'block') { const L = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i < L; i++) { const t = i / L, t2 = (i + 1) / L; const o = obj({ type: kind, x: Math.floor(lerp(x0, x1, (t + t2) / 2)), y: Math.floor(lerp(y0, y1, (t + t2) / 2)), x0: lerp(x0, x1, t), y0: lerp(y0, y1, t), x1: lerp(x0, x1, t2), y1: lerp(y0, y1, t2), solid: true }); BWALL.push(o) } }
for (let x = BRX0; x <= BRX1; x++) for (const [y, ly] of [[68, 68.62], [75, 75.38]]) BWALL.push(obj({ type: 'parapet', x, y, x0: x, y0: ly, x1: x + 1, y1: ly, post: (x - BRX0) % 3 === 0, end: x === BRX0 || x === BRX1 }));
for (const h of HOUSES) { const w = h.two ? 10 : 9, X0 = h.x - 1, X1 = h.x + w + 1, Y1 = h.y + 10; bwall(X0, h.y - 1, X0, Y1); bwall(X1, h.y - 1, X1, Y1); bwall(X0, Y1, h.x + 3, Y1); bwall(h.x + 5, Y1, X1, Y1, 'hedge') }
for (let x = 68; x <= 106; x++) { if (x >= 70 && x <= 99) continue } bwall(68, 93, 68, 95, 'fence'); bwall(68, 99, 68, 115, 'fence'); bwall(68, 115, 107, 115, 'fence'); bwall(107, 81, 107, 115, 'fence');
// 車
const CARS = [];
for (const [x, y, a, c, wr] of [[30, 71.2, 0, '#2f6fa8'], [90, 72.6, Math.PI, '#b5382c'], [104, 71.5, .3, '#8a8476', 1], [61.5, 100, Math.PI / 2, '#d8d0b8'], [12, 64.5, 0, '#5a6a4a'], [14.5, 50, 0, '#e8e4dc'], [27, 52.5, Math.PI, '#4a4a52'], [69, 67.4, 0, '#a83a3a']]) {
  const w = Math.abs(Math.cos(a)) > .7 ? 2 : 1, h = 3 - w; CARS.push(obj({ type: 'car', x: Math.round(x - w / 2), y: Math.round(y - h / 2), fx: x, fy: y, a, col: c, wreck: wr, w, h, name: '車のトランク', items: hash(x, y) < .5 ? ['water'] : ['snack'] }))
}
// 木
const TREES = [];
function addTree(x, y, o = {}) {
  // 扉の前には植えない
  if (!o.force) for (const d of DOORS.values()) if (d.L === 0 && Math.abs(d.x + .5 - x) < 1.8 && Math.abs(d.y + .5 - y) < 1.8) return;
  const k = key(Math.floor(x), Math.floor(y)); const g = GT[k];
  if (g >= 100 || [TG.road, TG.walk, TG.water, TG.lot, TG.gravel, TG.platform, TG.tactile, TG.plaza, TG.bridge, TG.lane, TG.stone, TG.pond, TG.yard].includes(g) && !o.force) return;
  if (SOLID[0].has(k) || LEV[0].t[k]) return;
  const t = { type: 'tree', x: Math.floor(x), y: Math.floor(y), fx: x, fy: y, r: o.r || .8, hgt: o.h || 2.6, kind: o.kind || null, col: o.col || '#4b7533', ph: hash(x * 3, y * 7) * 6, solid: true, blossom: o.blossom };
  TREES.push(t); obj(t); return t;
}
const SAKURA = ['#f0b8c8', '#f4c8d4', '#e8a8bc'];
for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; addTree(DCX + Math.cos(a) * 13.6, DCY + Math.sin(a) * 12.6, { col: i % 3 ? '#4b7533' : SAKURA[i % 3], blossom: i % 3 === 0, r: .85, h: 2.6, force: true }) }
for (const [x, y] of [[35, 77], [56, 99], [35, 99], [57, 88], [40, 80], [48, 100]]) addTree(x, y, { col: SAKURA[(x + y) % 3], blossom: true, r: 1.05, h: 2.8 });
for (let x = 69; x <= 106; x += 4) { addTree(x + .5, 116.5, { col: SAKURA[x % 3], blossom: true, r: .95, h: 2.7 }) }
for (let i = 0; i < 4000 && TREES.length < 160; i++) { const x = 3 + R() * 33, y = 21 + R() * 20; if (GT[key(x | 0, y | 0)] !== TG.forest) continue; if (TREES.some(t => Math.abs(t.fx - x) < 1.4 && Math.abs(t.fy - y) < 1.4)) continue; addTree(x, y, { kind: 'cedar', col: ['#2a4a32', '#30543a'][i % 2], r: .8, h: 4.2 + R() * 1.5 }) }
for (let i = 0; i < 16000 && TREES.length < 1100; i++) {
  const x = 2 + R() * (GW - 4), y = 2 + R() * (GH - 4), g = GT[key(x | 0, y | 0)]; const d = Math.hypot(x - 64, y - 70);
  if (g === TG.forest || g === TG.bank && R() < .25 || (g === TG.grass && R() < (d < 50 ? .02 : .14))) {
    if (TREES.some(t => Math.abs(t.fx - x) < 1.25 && Math.abs(t.fy - y) < 1.25)) continue; const pine = R() < .4;
    addTree(x, y, { kind: pine ? 'pine' : null, col: pine ? ['#2f5a35', '#386a3c'][i % 2] : ['#3d6a33', '#4b7533', '#5a7d2e', '#6a8a34'][i % 4], r: .7 + R() * .35, h: 2.2 + R() * .9 })
  }
}
// ゾンビ（抜け殻）
const ZSTART = [[30, 72], [52, 71], [96, 71], [110, 70], [62, 90], [61, 120], [40, 53], [20, 53], [70, 36], [90, 34], [100, 104], [80, 110], [45, 88], [24, 88], [118, 60], [12, 66]];

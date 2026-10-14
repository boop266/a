// ════════════════ ひかりが丘ランド（遊園地）と駐車場 ════════════════
// 観覧車：軸の位置・半径・軸の高さ・ゴンドラの数（輪は x+y が一定の面に立っている＝画面に正円で見える）
const WC = [157, 33], WR = 10.5, WZ = 12, WN = 16;
// メリーゴーランド・噴水・花時計
const CC = [189.5, 33], CR = 4.3, FC = [180, 44], FCK = [180, 28.5];
// 池（スワンボート）
const PONDC = [168, 51], PONDR = [6.2, 4.2];
// ───────── 地面 ─────────
{
  const pave = (x0, y0, x1, y1) => setG(x0, y0, x1, y1, TG.parkpath);
  const paveC = (cx, cy, r) => { for (let y = Math.floor(cy - r); y <= cy + r; y++)for (let x = Math.floor(cx - r); x <= cx + r; x++)if (Math.hypot(x + .5 - cx, y + .5 - cy) < r) GT[key(x, y)] = TG.parkpath };
  pave(176, 25, 184, 61); pave(147, 42, 194, 45); paveC(FC[0], FC[1], 5.6); paveC(WC[0], WC[1], 7); paveC(CC[0], CC[1], 5.8); pave(166, 25, 175, 41); pave(185, 46, 194, 61); pave(162, 56, 175, 61);
  pave(147, 46, 161, 61); pave(196, 41, 205, 45); setG(196, 25, 210, 33, TG.lot); pave(151, 25, 165, 26);
  for (let y = 46; y <= 56; y++)for (let x = 161; x <= 176; x++) if (((x + .5 - PONDC[0]) / PONDR[0]) ** 2 + ((y + .5 - PONDC[1]) / PONDR[1]) ** 2 < 1) GT[key(x, y)] = TG.pond;
  setG(168, 46, 169, 48, TG.quay);
}
// ───────── 入口の外：券売所 ─────────
const PB_W = defBuilding({ name: 'きっぷ売り場', ext: ['pastel', '#f4ece0'], int: ['inner', '#f0ebe0'], roof: 'flat', glassFrame: '#d0d4d8', shopGlass: true });
stamp(0, 167, 63, ['#####', '#,,,D', '#,,,#', 'WWWWW'], PB_W, FM.wood);
const PB_E = defBuilding({ name: 'きっぷ売り場', ext: ['pastel', '#f4ece0'], int: ['inner', '#f0ebe0'], roof: 'flat', glassFrame: '#d0d4d8', shopGlass: true });
stamp(0, 189, 63, ['#####', 'D,,,#', '#,,,#', 'WWWWW'], PB_E, FM.wood);
for (const [bx, id] of [[167, PB_W], [189, PB_E]]) { for (let j = 0; j < 4; j++)for (let i = 0; i < 5; i++) { const k = key(bx + i, 63 + j); LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = id } BLD[id].rooms = [[0, bx, 63, bx + 4, 66, 'きっぷ売り場']] }
// ───────── お化け屋敷（中は真っ暗な迷路） ─────────
const HH = defBuilding({ name: 'お化け屋敷', ext: ['haunt', '#5a4a3e'], int: ['haunt', '#4a3c32'], roof: 'flat', glassFrame: '#3a2a20' });
stamp(0, 148, 47, ['#############', '#,,,,,,,,,,,#', '#,#########,#', '#,,,,,,,,,#,#', '#########,#,#', '#,,,,,,,,,#,#', '#,#########,#', '#,,,,,,,,,#,#', '#########,#,#', '#,,,,,,,,,#,#', '#,#########,#', '#,,,######,,#', '##T#######T##'], HH, FM.wood);
for (let j = 0; j < 13; j++)for (let i = 0; i < 13; i++) { const k = key(148 + i, 47 + j); LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = HH }
BLD[HH].rooms = [[0, 148, 47, 160, 59, 'お化け屋敷']]; BLD[HH].dark = true;
// ───────── おみやげ屋・レストラン・救護室 ─────────
const GS_ID = defBuilding({ name: 'おみやげ屋', ext: ['pastel', '#f6eee4'], int: ['inner', '#f4efe6'], roof: 'flat', glassFrame: '#d0d4d8', shopGlass: true });
stamp(0, 165, 56, ['####SS####', '#........#', 'W........W', '#........#', 'W........W', '##########'], GS_ID, FM.tile);
const CF_ID = defBuilding({ name: 'レストラン', ext: ['brick', '#b8705a'], int: ['inner', '#efe6d8'], roof: 'flat', glassFrame: '#c8ccd0' });
stamp(0, 185, 47, ['#########', '#,,,,,#;#', 'W,,,,,D;#', '#,,,,,#;#', 'W,,,,,###', '#,,,,,,,W', 'W,,,,,,,#', '###SS####'], CF_ID, FM.wood);
const FA_ID = defBuilding({ name: '救護室', ext: ['pastel', '#eef0f2'], int: ['inner', '#f2f4f2'], roof: 'flat', glassFrame: '#c8ccd0' });
stamp(0, 185, 57, ['####D####', '#,,,,,,,#', 'W,,,,,,,W', '#,,,,,,,#', '#########'], FA_ID, FM.lino);
for (const [bx, by, w, h, id] of [[165, 56, 10, 6, GS_ID], [185, 47, 9, 8, CF_ID], [185, 57, 9, 5, FA_ID]]) for (let j = 0; j < h; j++)for (let i = 0; i < w; i++) { const k = key(bx + i, by + j); LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = id }
BLD[GS_ID].rooms = [[0, 165, 56, 174, 61, 'おみやげ屋']]; BLD[CF_ID].rooms = [[0, 192, 48, 192, 50, 'レストランの厨房'], [0, 185, 47, 193, 54, 'レストラン']]; BLD[FA_ID].rooms = [[0, 185, 57, 193, 61, '救護室']];
// ───────── 裏方（関係者以外立入禁止）：電気室と控室 ─────────
const BK_ID = defBuilding({ name: '管理棟', ext: ['conc', '#d8d4cc'], int: ['inner', '#e4e0d8'], roof: 'flat', glassFrame: '#c8ccd0' });
stamp(0, 198, 25, ['############', '#;;;;;#,,,,#', '#;;;;;#,,,,W', '#;;;;;D,,,,#', '#;;;;;#,,,,W', '#;;;;;#,,,,#', '###D######D#'], BK_ID, FM.conc);
for (let j = 0; j < 7; j++)for (let i = 0; i < 12; i++) { const k = key(198 + i, 25 + j); LEV[1].t[k] = ROOF; LEV[1].fm[k] = FM.roof; LEV[1].bid[k] = BK_ID }
BLD[BK_ID].rooms = [[0, 199, 26, 203, 30, '電気室'], [0, 205, 26, 208, 30, '控室'], [0, 198, 25, 209, 31, '管理棟']];
// 地上の床を地面の絵にも
for (let k = 0; k < N; k++)if (LEV[0].bid[k] && LEV[0].t[k] !== EMPTY && GT[k] < 100) GT[k] = 100 + LEV[0].fm[k];
finishDoors();
for (const d of DOORS.values()) if (d.bid === HH) d.open = true;

// ───────── 遊園地の物 ─────────
IT.key_park = { n: '管理棟の鍵', c: '#d0a040' }; IT.wrench = { n: 'スパナ', c: '#9aa0a8' }; IT.battery_car = { n: '車のバッテリー', c: '#3a3e46' }; IT.ticket = { n: '回数券', c: '#f0c8d8' };
IT.popcorn = { n: 'ポップコーン', c: '#f4e0a0', use: p => { p.hunger = clamp(p.hunger + 14, 0, 100); return 'しけってるけど、おいしい' } }; IT.plush = { n: 'くまのぬいぐるみ', c: '#c89a6a' };
// 柵（入口の左右・裏方・ジェットコースターのまわり）
bwall(146, 24, 211, 24, 'pfence'); bwall(146, 24, 146, 62, 'pfence'); bwall(211, 24, 211, 62, 'pfence'); bwall(146, 62, 176, 62, 'pfence'); bwall(185, 62, 211, 62, 'pfence');
bwall(195, 24, 195, 29, 'pfence'); bwall(195, 30, 195, 34, 'pfence'); bwall(195, 34, 211, 34, 'pfence'); bwall(195, 35, 195, 42, 'pfence'); bwall(195, 46, 195, 62, 'pfence');
// 入口：アーチ・柱・回転ゲート（閉まっているので、乗りこえる）
obj({ type: 'parch', x: 176, y: 62, fx: 180, fy: 62.5, solid: false, tall: 6 }); furn('pillar', 176, 62); furn('pillar', 184, 62);
for (let x = 177; x <= 183; x++) furn('turnstile', x, 62, { name: '回転ゲート' });
furn('keybox', 168, 64, { solid: false, name: 'キーボックス', items: ['key_park'], read: 'キーボックス。札：「管理棟」「観覧車操作室」「予備」\n管理棟の鍵だけ、残っている。' });
furn('register', 169, 65, { w: 2, name: 'きっぷ売り場のレジ', items: ['coin', 'coin', 'ticket'] });
furn('rack', 192, 64, { name: 'パンフレット', items: ['map_park'], read: '「ひかりが丘ランド　園内マップ」\n開園 9:00 ／ 閉園 21:00\n夜は、観覧車と園内のイルミネーションをお楽しみください。' });
furn('desk', 191, 65, { w: 2, name: '受付の机', read: '業務連絡（ホワイトボード）：\n「停電時は管理棟の非常用発電機。\n　セルのバッテリーが弱っているので注意！\n　予備がなければ、駐車場の社用バンから借りること」' });
furn('mapboard', 174, 64, { w: 2, name: '園内案内図', read: 'ひかりが丘ランド　園内案内図\n観覧車／メリーゴーランド／ジェットコースター\nお化け屋敷／スワンボート／レストラン\nおみやげ屋／救護室' });
for (const [x, y] of [[165, 64], [195, 64], [166, 67], [194, 67]]) furn('fpot', x, y, { name: 'プランター' });
furn('bench', 171, 67, { w: 2, name: '入口のベンチ', seat: true }); furn('bench', 187, 67, { w: 2, name: '入口のベンチ', seat: true }); furn('vending', 196, 64, { name: '自動販売機', items: ['juice', 'coin'] });
// 園内案内図（中）・花時計・噴水
furn('mapboard', 175, 58, { w: 1, name: '園内案内図', read: 'ひかりが丘ランド　園内案内図\n左奥：観覧車　右奥：メリーゴーランド\n左：お化け屋敷・スワンボート　右：レストラン・救護室\n右の奥：ジェットコースター' });
obj({ type: 'flowerclock', x: 178, y: 26, w: 5, h: 5, fx: FCK[0], fy: FCK[1], name: '花時計', read: '花の時計。針は、ちゃんと動いている。\n（電池で動いているらしい）' });
obj({ type: 'fountain', x: 178, y: 42, w: 4, h: 4, fx: FC[0], fy: FC[1], name: '噴水', read: '噴水。水はたまっているけれど、止まっている。\n底に、小銭がたくさん光っている。', items: ['coin', 'coin', 'coin'] });
for (const [x, y] of [[174, 40], [186, 40], [174, 47], [186, 47]]) furn('bench', x, y, { w: 2, name: 'ベンチ', seat: true });
// 観覧車：本体・足・乗り場・操作室
obj({ type: 'fwheel', x: WC[0], y: WC[1], fx: WC[0], fy: WC[1], solid: false, tall: WZ + WR + 2 });
for (const s of [-1, 1]) for (const t of [-1, 1]) obj({ type: 'wfoot', x: Math.floor(WC[0] + .6 * t + 3.4 * s), y: Math.floor(WC[1] + .6 * t - 3.4 * s), solid: true });
for (let y = WC[1] - 1; y <= WC[1] + 1; y++)for (let x = WC[0] - 1; x <= WC[0] + 1; x++) if (!SOLID[0].has(key(x, y))) obj({ type: 'wpit', x, y, solid: true });
furn('wboard', WC[0] + 2, WC[1] + 2, { name: '観覧車の乗り場', solid: false });
furn('opbooth', WC[0] + 3, WC[1] + 4, { w: 2, h: 2, name: '観覧車の操作室', sys: 'wheel' });
// メリーゴーランド：本体（中は乗るときだけ）・操作盤
obj({ type: 'carousel', x: Math.floor(CC[0] - 4), y: Math.floor(CC[1] - 4), w: 9, h: 9, fx: CC[0], fy: CC[1], solid: false, tall: 6.5, name: 'メリーゴーランド' });
for (let y = Math.floor(CC[1] - CR); y <= CC[1] + CR; y++)for (let x = Math.floor(CC[0] - CR); x <= CC[0] + CR; x++) if (Math.hypot(x + .5 - CC[0], y + .5 - CC[1]) < CR - .1) obj({ type: 'wpit', x, y, solid: true });
furn('opanel', 185, 39, { name: 'メリーゴーランドの操作盤', sys: 'car' });
// 屋台村
furn('stall', 167, 26, { w: 3, h: 2, kind: 'たこ焼き', col: '#e8504a', name: 'たこ焼きの屋台', items: ['snack'] }); furn('stall', 171, 26, { w: 3, h: 2, kind: 'クレープ', col: '#f0a0c0', name: 'クレープの屋台', items: ['choco'] });
furn('stall', 167, 30, { w: 3, h: 2, kind: 'ドリンク', col: '#5aa0e8', name: 'ドリンクの屋台', items: ['juice', 'water'] }); furn('popcart', 172, 31, { name: 'ポップコーンのワゴン', items: ['popcorn', 'popcorn'] });
for (const [x, y] of [[167, 35], [170, 35], [173, 35], [168, 38], [171, 38], [174, 38]]) furn('ptable', x, y, { col: ['#e8504a', '#f0c040', '#5aa0e8', '#6ac070'][(x + y) % 4] });
for (const [x, y] of [[175, 30], [166, 41], [185, 44], [176, 53]]) furn('bin', x, y);
// スワンボート
for (const [x, y, c] of [[167, 47, '#f8f8f4'], [170, 48, '#f8f8f4'], [172, 51, '#f4d8e0']]) furn('swan', x, y, { solid: false, fx: x + .5, fy: y + .5, a: Math.PI * .75, col: c, name: 'スワンボート', hx: x + .5, hy: y + .5 });
furn('notice', 170, 45, { w: 2, solid: false, name: '料金表', read: 'スワンボート　30分　800円\n「足でこいで進みます。池のまわりを一周してね」' });
// お化け屋敷の中：音の鳴る仕掛け・ちょうちん・看板
obj({ type: 'hsign', x: 149, y: 59, fx: 151, fy: 59.6, solid: false, tall: 4 });
for (const [x, y] of [[149, 56], [157, 54], [149, 50], [159, 50]]) furn('chochin', x, y, { solid: false });
for (const [x, y] of [[153, 56], [153, 52], [154, 48], [159, 54]]) furn('ghost', x, y, { solid: false });
furn('well', 151, 58, { name: '古井戸', read: '古井戸。のぞきこむと、底に小さな光がゆれている。\n……と思ったら、電球の仕掛けだった。' }); furn('note', 159, 58, { solid: false, name: 'お札', read: '出口のそばに、お札が一枚。\n「おつかれさまでした！　また来てね　スタッフ一同」' });
// おみやげ屋
for (const [x, y, items] of [[167, 58, ['plush']], [169, 58, ['snack', 'choco']], [171, 58, ['plush']], [167, 60, ['postcard']], [171, 60, ['snack']]]) furn('plushshelf', x, y, { name: 'おみやげの棚', items });
furn('register', 173, 57, { name: 'レジ', items: ['coin', 'coin'] });
// レストラン
for (const [x, y] of [[186, 49], [189, 49], [186, 52], [189, 52], [191, 52]]) furn('table', x, y, { name: 'テーブル' });
furn('kitchen', 192, 48, { name: '厨房の棚', items: ['can', 'can', 'bread'] }); furn('fridge', 192, 50, { name: '業務用冷蔵庫', items: ['water', 'juice'] });
furn('counter', 186, 48, { w: 3, name: 'レストランのカウンター', items: ['coin'], read: 'カウンターのメニュー：\n「ハッピーカレー」「くまさんオムライス」「メロンソーダ」\n伝票の最後の一枚：お子さまランチ×2、メロンソーダ×1' });
// 救護室
furn('cbed', 186, 58, { w: 2, name: '救護室のベッド', sleep: true }); furn('cbed', 186, 60, { w: 2, name: '救護室のベッド', sleep: true }); furn('medicine', 192, 58, { name: '薬の棚', items: ['bandage', 'bandage'] }); furn('desk', 190, 60, { w: 2, name: '救護室の机', read: '迷子の記録：\n「15:20　ゆうとくん（5さい）　青いぼうし」\n「15:42　お母さんと会えました」' });
// 管理棟：電気室（非常用発電機・主ブレーカー・設備ごとのブレーカー）と控室
furn('pgen', 201, 26, { w: 2, h: 2, name: '非常用発電機' }); furn('mainpanel', 203, 26, { name: '主ブレーカー' });
for (const [y, sys, n] of [[27, 'lights', '園内照明'], [28, 'wheel', '観覧車'], [29, 'car', 'メリーゴーランド'], [30, 'coaster', 'ジェットコースター']]) furn('rbreaker', 199, y, { sys, label: n, name: `ブレーカー〈${n}〉` });
for (const [x, sys, n] of [[202, 'haunt', 'お化け屋敷'], [203, 'fountain', '噴水']]) furn('rbreaker', x, 30, { sys, label: n, name: `ブレーカー〈${n}〉` });
furn('lockers', 205, 26, { w: 2, name: 'スタッフのロッカー', items: ['water', 'bread'] }); furn('desk', 207, 26, { w: 2, name: '運転マニュアル', read: '「停電時の運転手順」\n1. 非常用発電機を始動（セルが回らないときはバッテリーを確認）\n2. 主ブレーカーを入れる\n3. 必要な設備のブレーカーを入れる\n4. 各アトラクションの操作盤で〈運転〉' });
furn('workbench', 205, 30, { w: 2, name: '作業台', items: ['wrench'], read: '作業台。工具が散らばっている。\nスパナが一本、手に取りやすいところに置いてある。' });
furn('board', 208, 28, { w: 1, solid: false, name: 'ホワイトボード', read: 'ホワイトボード：\n「8/15　観覧車　点検済」\n「8/15　コースター　ブレーキ調整　済」\n「最後の日まで、笑顔で！」' });
obj({ type: 'pgate', x: 195, y: 29, name: '関係者以外立入禁止の門', solid: true });
furn('cart', 199, 32, { w: 2, name: '作業用カート', items: ['bandage'] });
// ジェットコースター：乗り場と操作盤（線路は 46_park で描く）
furn('cstation', 197, 41, { w: 8, h: 4, solid: false }); furn('opanel', 197, 44, { name: 'ジェットコースターの操作盤', sys: 'coaster' });
// 街灯（園内照明）と、つなぐ電球
const PLAMPS = []; const plamp = (x, y, line) => { const o = obj({ type: 'plamp', x, y, line, solid: true }); PLAMPS.push(o); return o };
for (const y of [33, 38, 49, 54, 59]) { plamp(176, y, 'L'); plamp(184, y, 'R') }
for (const x of [150, 156, 162, 173, 192]) { plamp(x, 41, 'N'); plamp(x, 46, 'S') }
// 遠くを見たときに、ともだちが気づくもの
const SIGHTS = [];
SIGHTS.push({ k: 'see_wheel', x: WC[0], y: WC[1], r: 14, t: 'あれ、観覧車……？ 遊園地だ' }, { k: 'see_light', x: FARLIGHT[0], y: FARLIGHT[1], r: 10, t: 'あれ……灯り？ だれか、いるのかな', night: true }, { k: 'see_lh', x: LHC[0], y: LHC[1], r: 14, t: '灯台……光ってる', night: true }, { k: 'see_sea', x: 236, y: 80, r: 12, t: '海だ……！', day: true });
// ───────── 駐車場（社用バンのバッテリー） ─────────
for (const [x, y, a, c] of [[163.5, 79.5, Math.PI / 2, '#3a6aa8'], [166.5, 79.5, Math.PI / 2, '#e8e4dc'], [175.5, 79.5, Math.PI / 2, '#b5382c'], [181.5, 84.5, Math.PI / 2, '#5a6a4a'], [163.5, 89.5, Math.PI / 2, '#8a8476'], [187.5, 89.5, Math.PI / 2, '#d8c040'], [193.5, 84.5, Math.PI / 2, '#4a4a52']]) {
  CARS.push(obj({ type: 'car', x: Math.round(x - .5), y: Math.round(y - 1), fx: x, fy: y, a, col: c, w: 1, h: 2, name: '車のトランク', items: hash(x, y) < .5 ? ['water'] : ['snack'] }));
}
CARS.push(obj({ type: 'car', van: true, x: 172, y: 84, fx: 172.5, fy: 85, a: Math.PI / 2, col: '#f0f0ec', w: 1, h: 2, name: '社用バン', logo: true }));
obj({ type: 'bus', x: 190, y: 78, w: 6, h: 2, name: 'ツアーバス', items: ['water', 'snack'], col: '#e8a040' });
obj({ type: 'lotsign', x: 178, y: 76, solid: false });
ZSTART.push([178, 52], [160, 45], [190, 41], [170, 66], [203, 37], [180, 82], [226, 31], [221, 44], [230, 96]);

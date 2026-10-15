// ひとしずく：仕組みの回帰テスト（世界の決まりが思ったとおりに動くか）
//   node tests/regress.js [名前の一部]
const path = require('path');
const { chromium } = require('playwright');
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?lab';
const T = {};   // 名前 → ページの中で動く関数（文字列で渡す）

// よく使う地図
const FLAT = ['..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '##############################', '##############################'];
const GAP = ['..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '##########....################', '##########xxxx################'];
const CLIFF = ['..............................', '..............................', '..............................', '..............................', '.............#################', '.............#################', '.............#################', '.............#################', '##############################', '##############################'];
const POND = ['..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '##########~~~~~~##############', '##########~~~~~~##############', '##############################'];

T['橋：谷にかかって、渡れる'] = `
  lab({ map: GAP, start: { x: 2, y: 7 } });
  const k = HS.writeNow('橋', 11, 8); if (k !== 'event') return 'plan ' + k;
  const b = HS.ents('橋')[0]; if (!b || b.w !== 4) return 'no bridge ' + (b && b.w);
  HS.sim(0.5); if (!HS.ents('橋').length) return 'bridge fell';
  HS.heroTap(20, 7); HS.sim(6); return HS.hero().x >= 19 || 'hero at ' + HS.hero().x;`;
T['一：宙に線、階段になる'] = `
  lab({ map: CLIFF, start: { x: 2, y: 7 } });
  HS.writeNow('一', 9, 7); HS.writeNow('一', 10, 6); HS.writeNow('一', 11, 5); HS.sim(1);
  if (HS.ents('一').length !== 3) return 'lines ' + HS.ents('一').length;
  if (HS.ents('一')[1].y !== 6) return 'line fell';
  HS.heroTap(16, 3); HS.sim(8); return (HS.hero().y <= 3 && HS.hero().x >= 13) || 'hero ' + HS.hero().x + ',' + HS.hero().y;`;
T['一：水にぬれると溶ける'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 } });
  HS.writeNow('一', 10, 6); HS.sim(0.3); HS.writeNow('水', 10, 5); HS.sim(1.5);
  return HS.ents('一').length === 0 || 'line still there';`;
T['合わせ：字帳で木＋木＝林、林＋木＝森'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, give: ['木'] });
  HS.combineInTray('木', '木'); if (!HS.Game.known.includes('林')) return 'no 林';
  HS.combineInTray('木', '林'); return HS.Game.known.includes('森') || 'no 森';`;
T['合わせ：三つ合わせ（日＋日＋日＝晶）'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, give: ['日'] });
  HS.combineInTray('日', '日'); if (!HS.UI.pairs.length) return 'no pair';
  HS.combineInTray('日', '日日'); return HS.Game.known.includes('晶') || 'no 晶';`;
T['合わせ：絵巻の木に木を書くと林'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '木', x: 10, y: 6 }] });
  const k = HS.writeNow('木', 10, 7); if (k !== 'transform') return 'kind ' + k;
  return (HS.ents('林').length === 1 && HS.Game.known.includes('林')) || 'no 林';`;
T['墨：書いた物をもどすと墨がもどる'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 } });
  const f0 = HS.Ink.free(); HS.writeNow('石', 10, 7); HS.sim(0.3);
  if (HS.Ink.free() !== f0 - 5) return 'ink after write ' + HS.Ink.free();
  HS.returnInk(HS.ents('石')[0]); HS.sim(0.2); return HS.Ink.free() === f0 || 'ink ' + HS.Ink.free();`;
T['薄れたもの：正しい名でよみがえる・ちがう名は書けない'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, faded: [{ k: '木', x: 10, y: 6 }] });
  if (HS.writeNow('火', 10, 7) !== 'wrongname') return 'wrong accepted';
  const k = HS.writeNow('木', 10, 7); if (k !== 'restore') return 'kind ' + k;
  return HS.ents('木').length === 1 || 'no tree';`;
T['火：木が燃えて灰になり、雨で消える'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '木', x: 10, y: 6 }, { k: '木', x: 20, y: 6 }] });
  HS.setRng(5); HS.writeNow('火', 11, 7); HS.sim(14);
  if (HS.ents('木').filter(e => e.x === 10).length) return 'tree not burned';
  if (!HS.ents('灰').length) return 'no ash';
  HS.writeNow('火', 21, 7); HS.sim(1); const t = HS.ents('木').find(e => e.x === 20); if (!t || t.burnT <= 0) return 'tree2 not burning';
  HS.writeNow('雨', 20, 5); HS.sim(3); return (t.alive && t.burnT <= 0) || 'not extinguished';`;
T['水：くぼみへ流れる'] = `
  lab({ map: ['..........', '..........', '..........', '....#.....', '#..##.....', '#.###...##', '##########'], start: { x: 7, y: 5 } });
  HS.writeNow('水', 2, 1); HS.sim(4);
  return (HS.waAt(1, 5) + HS.waAt(2, 4) > 0) || 'no water in pit';`;
T['氷：深い水に書くと水面が凍って歩ける'] = `
  lab({ map: POND, start: { x: 2, y: 6 } });
  HS.writeNow('氷', 12, 7); HS.sim(3);
  let iced = 0; for (let x = 10; x < 16; x++) if (HS.tAt(x, 7) === HS.T.ICE) iced++;
  if (iced < 2) return 'iced ' + iced;
  HS.writeNow('凍', 14, 7); HS.sim(1);
  iced = 0; for (let x = 10; x < 16; x++) if (HS.tAt(x, 7) === HS.T.ICE) iced++;
  if (iced < 6) return 'iced2 ' + iced;
  HS.heroTap(20, 6); HS.sim(6); return HS.hero().x >= 19 || 'hero ' + HS.hero().x;`;
T['はしご：となりの崖の高さまで立つ'] = `
  lab({ map: CLIFF, start: { x: 2, y: 7 } });
  const k = HS.writeNow('梯', 12, 7); const l = HS.ents('梯')[0]; if (!l) return 'no ladder ' + k;
  if (l.y !== 4) return 'ladder top ' + l.y + ' h ' + l.h;
  HS.heroTap(17, 3); HS.sim(8); return (HS.hero().y === 3 && HS.hero().x >= 14) || 'hero ' + HS.hero().x + ',' + HS.hero().y;`;
T['縄：崖の上からたらして降りる'] = `
  lab({ map: CLIFF, start: { x: 16, y: 3 } });
  HS.writeNow('縄', 12, 4); const r = HS.ents('縄')[0]; if (!r) return 'no rope';
  HS.heroTap(4, 7); HS.sim(8); return (HS.hero().y === 7 && HS.hero().x <= 6) || 'hero ' + HS.hero().x + ',' + HS.hero().y;`;
T['切る：木を切ると丸太になって谷にかかる'] = `
  lab({ map: GAP, start: { x: 2, y: 7 }, ents: [{ k: '大木', x: 8, y: 4 }] });
  HS.writeNow('切', 8, 7); HS.sim(1);
  const lg = HS.ents('丸太')[0]; if (!lg) return 'no log';
  HS.heroTap(20, 7); HS.sim(6); return HS.hero().x >= 19 || 'log ' + lg.x + ',' + lg.y + ' w' + lg.w + ' hero ' + HS.hero().x;`;
T['鬼：道をふさぐ・豆で逃げる'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '鬼', x: 12, y: 6 }] });
  HS.heroTap(20, 7); HS.sim(5); if (HS.hero().x >= 12) return 'oni did not block';
  HS.writeNow('豆', 11, 7); HS.sim(8);
  if (HS.ents('鬼').length) return 'oni stayed at ' + HS.ents('鬼')[0].x;
  HS.heroTap(20, 7); HS.sim(6); return HS.hero().x >= 19 || 'hero ' + HS.hero().x;`;
T['鬼：お酒をのむと眠る（通れる）'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '鬼', x: 12, y: 6 }] });
  HS.writeNow('酒', 10, 7); HS.sim(14);
  const o = HS.ents('鬼')[0]; if (!o) return 'oni gone';
  if (!(o.sleepT > 0)) return 'not asleep drunk=' + o.drunkT;
  HS.heroTap(20, 7); HS.sim(7); return HS.hero().x >= 19 || 'hero ' + HS.hero().x;`;
T['鬼：友だちになると道をあける'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '鬼', x: 12, y: 6 }] });
  const k = HS.writeNow('友', 12, 7); if (k !== 'apply') return 'kind ' + k;
  HS.heroTap(20, 7); HS.sim(8); return HS.hero().x >= 19 || 'hero ' + HS.hero().x;`;
T['犬は猫を追い、猫は逃げる'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '犬', x: 8, y: 7 }, { k: '猫', x: 12, y: 7 }] });
  HS.setRng(3); HS.sim(4); const c = HS.ents('猫')[0];
  return (!c || c.x > 14) || 'cat at ' + c.x;`;
T['熊は人を追う・鈴をつけると寄ってこない'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '熊', x: 7, y: 6 }] });
  HS.setRng(7); HS.sim(5); const h = HS.ev('hurt'); if (!h.length) return 'bear did not catch';
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '熊', x: 7, y: 6 }] });
  HS.hero().hero.buff.bell = 60; HS.sim(5); return HS.ev('hurt').length === 0 || 'caught with bell';`;
T['鶴：魚をあげると背に乗せて飛ぶ'] = `
  lab({ map: GAP, start: { x: 2, y: 7 }, ents: [{ k: '鶴', x: 6, y: 6 }] });
  HS.writeNow('魚', 7, 7); HS.sim(5);
  const c = HS.ents('鶴')[0]; if (!c || !(c.charmT > 0)) return 'crane not friend';
  HS.heroTap(c.x, c.y); HS.sim(0.5); if (HS.hero().hero.ride !== c) return 'not riding';
  HS.heroTap(20, 6); HS.sim(8); HS.heroTap(c.x, c.y); HS.sim(1); return HS.hero().x >= 15 || 'hero ' + HS.hero().x;`;
T['河童：お辞儀（礼）をすると力が抜ける'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '河童', x: 12, y: 7 }] });
  HS.heroTap(20, 7); HS.sim(4); if (HS.hero().x >= 12) return 'kappa did not block';
  HS.writeNow('礼', HS.hero().x, 7); HS.sim(1); const k = HS.ents('河童')[0]; if (!(k.bowT > 0)) return 'no bow';
  HS.heroTap(20, 7); HS.sim(6); return HS.hero().x >= 19 || 'hero ' + HS.hero().x;`;
T['雪女：春が来ると去る'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '雪女', x: 12, y: 6 }] });
  HS.writeNow('春', 8, 5); HS.sim(10); return HS.ents('雪女').length === 0 || 'still there';`;
T['暗がり：人は入らない・火で明るくすれば行ける'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, dark: 0.9 });
  HS.heroTap(12, 7); HS.sim(5); if (HS.hero().x >= 8) return 'walked into dark ' + HS.hero().x;
  HS.hero().hero.buff.glow = 30; HS.heroTap(12, 7); HS.sim(5); return HS.hero().x >= 11 || 'hero ' + HS.hero().x;`;
T['鯉が滝をのぼって竜になる'] = `
  lab({ map: POND, start: { x: 2, y: 6 }, ents: [{ k: '鯉', x: 12, y: 8 }] });
  HS.writeNow('滝', 12, 2); HS.sim(6); return HS.ents('竜').length === 1 || 'no dragon';`;
T['灰を枯れ木にまくと花が咲く'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '枯木', x: 10, y: 6 }] });
  HS.writeNow('灰', 11, 7); HS.sim(2); return HS.ents('桜').length === 1 || 'no sakura';`;
T['押す：石を押して谷に落とす'] = `
  lab({ map: ['....................', '....................', '....................', '....................', '....................', '....................', '##########..........', '....................', '######.#############', '####################', '####################'], start: { x: 2, y: 7 }, ents: [{ k: '石', x: 4, y: 7 }] });
  HS.heroTap(12, 7); HS.sim(6); const s = HS.ents('石')[0];
  return (s.x === 6 && s.y === 8 && HS.hero().x >= 11) || 'stone ' + s.x + ',' + s.y + ' hero ' + HS.hero().x;`;
T['天狗：近づくと風で押しもどす・礼で通す'] = `
  lab({ map: FLAT, start: { x: 2, y: 7 }, ents: [{ k: '天狗', x: 14, y: 6 }] });
  HS.setRng(2); HS.heroTap(25, 7); HS.sim(6); if (HS.hero().x >= 14) return 'passed tengu';
  HS.writeNow('礼', HS.hero().x, 7); HS.sim(1); HS.heroTap(25, 7); HS.sim(8); return HS.hero().x >= 24 || 'hero ' + HS.hero().x;`;
T['乗り物：舟に乗って川を渡る'] = `
  lab({ map: POND, start: { x: 2, y: 6 } });
  HS.writeNow('舟', 10, 6); HS.sim(1); const b = HS.ents('舟')[0]; if (!b) return 'no boat';
  HS.heroTap(b.x, b.y - 1); HS.sim(3); if (HS.hero().y !== b.y - 1) return 'not on boat ' + HS.hero().x + ',' + HS.hero().y + ' boat ' + b.x + ',' + b.y;
  HS.heroTap(20, 6); HS.sim(10); return HS.hero().x >= 17 || 'hero ' + HS.hero().x + ' boat ' + b.x;`;

(async () => {
  const only = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto(FILE); await p.waitForTimeout(800);
  await p.evaluate(({ FLAT, GAP, CLIFF, POND }) => { window.FLAT = FLAT; window.GAP = GAP; window.CLIFF = CLIFF; window.POND = POND;
    window.lab = def => { HS.loadLab(Object.assign({ give: [] }, def)); HS.Game.paused = true; HS.Ink.max = 99; HS.setRng(1); for (const k in HS.KDEF) if (!HS.Game.known.includes(k)) HS.Game.known.push(k); };
  }, { FLAT, GAP, CLIFF, POND });
  let pass = 0, fail = 0;
  for (const [name, body] of Object.entries(T)) {
    if (only && !name.includes(only)) continue;
    let r;
    try { r = await p.evaluate(new Function(body)); } catch (e) { r = 'throw ' + e.message.split('\n')[0]; }
    const errs = await p.evaluate(() => HS.ERRORS.splice(0));
    if (r === true && !errs.length) { pass++; console.log('◎', name); }
    else { fail++; console.log('×', name, '→', r, errs.length ? errs[0].split('\n').slice(0, 2).join(' / ') : ''); }
  }
  console.log(`\n${pass} 通過 / ${fail} 失敗`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();

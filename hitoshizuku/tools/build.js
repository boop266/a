#!/usr/bin/env node
// ひとしずく：src/ をまとめて、1枚で遊べる index.html を作る。
//   node tools/build.js          … ふつうに作る
//   node tools/build.js --fast   … 字体（フォント）の作り直しを省く（前回のを使う）
// 中でやること：
//   1. src/10_kanji.js などに出てくる漢字を集め、KanjiVG の筆順データを用意（tools/fetch_kvg.py → tools/kvg2js.py）
//   2. 画面の文字に使う字体「Klee One」を、使う字だけに絞って埋め込む（tools/subset_font.py）
//   3. src/*.html, src/*.js を順に並べて index.html へ
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const GEN = path.join(ROOT, '.gen');
const fast = process.argv.includes('--fast');
fs.mkdirSync(GEN, { recursive: true });

const files = fs.readdirSync(SRC).filter(f => /^\d\d_.*\.(js|html|css)$/.test(f)).sort();
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

// --- 1. 筆順データ ---
// 字の一覧は「筆で書く字」：漢字表（GLYPHS: で始まる行のあいだ）と、各ファイルの「// glyphs:」行
let glyphChars = '';
for (const f of files) {
  const s = read(f);
  const m = s.match(/\/\*GLYPHS\*\/([\s\S]*?)\/\*END_GLYPHS\*\//g);
  // 字の表では、定義している字（D('…' の最初）だけ
  if (m) for (const blk of m) for (const d of blk.matchAll(/\bD\('([^']+)'/g)) glyphChars += d[1];
  for (const line of s.split('\n')) {
    const g = line.match(/\/\/ glyphs:(.*)$/);
    if (g) glyphChars += g[1];
  }
}
const isKanji = c => { const o = c.codePointAt(0); return (o >= 0x4e00 && o <= 0x9fff) || (o >= 0x3400 && o <= 0x4dbf) || (o >= 0x3041 && o <= 0x30fa) || c === '々' || c === '〆'; };
const kanjiSet = [...new Set([...glyphChars].filter(isKanji))].sort();
fs.writeFileSync(path.join(GEN, 'glyph_chars.txt'), kanjiSet.join(''));
execFileSync('python3', [path.join(__dirname, 'fetch_kvg.py'), '--from-file', path.join(GEN, 'glyph_chars.txt')], { stdio: 'inherit' });
const kvg = execFileSync('python3', [path.join(__dirname, 'kvg2js.py'), path.join(GEN, 'glyph_chars.txt')], { maxBuffer: 64 << 20 }).toString();

// --- 2. 字体 ---
let allText = '';
for (const f of files) allText += read(f);
const textChars = [...new Set([...allText].filter(c => c.codePointAt(0) > 0x7e))].join('')
  + ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
  + 'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわをんー'
  + 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロワヲンヴ・「」『』（）、。！？…～';
fs.writeFileSync(path.join(GEN, 'text_chars.txt'), textChars);
const fontCss = path.join(GEN, 'font.css');
if (!fast || !fs.existsSync(fontCss)) {
  execFileSync('python3', [path.join(__dirname, 'subset_font.py'), path.join(GEN, 'text_chars.txt'), fontCss], { stdio: 'inherit' });
}

// --- 3. まとめる ---
let html = '';
let js = '';
for (const f of files) {
  if (f.endsWith('.html')) html += read(f) + '\n';
  else if (f.endsWith('.css')) html += '<style>\n' + read(f) + '\n</style>\n';
  else js += '// ==== ' + f + ' ====\n' + read(f) + '\n';
}
html = html.replace('/*FONT_CSS*/', fs.readFileSync(fontCss, 'utf8'));
// 構文の点検（ここで落ちれば、ブラウザでも落ちる）
try { new Function(js); } catch (e) { console.error('JS の書き間違い:', e.message); process.exit(1); }
const body = html
  + '<script>\n' + kvg + '\n</script>\n'
  + '<script>\n"use strict";\n' + js + '\n</script>\n';
// そのまま開く版（スマホのホーム画面にも置ける）
const standalone = '<!doctype html>\n<html lang="ja">\n<meta charset="utf-8">\n'
  + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'
  + '<meta name="theme-color" content="#ebe2c8">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
  + body + '</html>\n';
fs.writeFileSync(path.join(ROOT, 'index.html'), standalone);
// 共有ページ版（外側の枠は公開の時につく）
fs.writeFileSync(path.join(GEN, 'artifact.html'), body);
console.log('index.html', (standalone.length / 1024).toFixed(0) + 'KB', 'glyphs', kanjiSet.length, 'textchars', textChars.length);

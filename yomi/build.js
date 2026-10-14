// 黄泉還：src/*.js と three.js を1枚の index.html にまとめる（node yomi/build.js）
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
// three.js（ESモジュール）を、ふつうのscriptで動く形に包む：export{a as B,...} → window.THREE={B:a,...}
const vend = path.join(__dirname, '..', 'michi', 'vendor');
let three = fs.readFileSync(path.join(vend, 'three.module.min.js'), 'utf8');
const ex = three.lastIndexOf('export{');
const names = three.slice(ex + 7, three.indexOf('}', ex)).split(',').map(s => {
  const m = s.trim().split(/\s+as\s+/); return m.length === 2 ? `${m[1]}:${m[0]}` : `${m[0]}:${m[0]}`;
}).join(',');
three = '(function(){"use strict";' + three.slice(0, ex) + ';window.THREE={' + names + '};})();';
const lic = fs.readFileSync(path.join(vend, 'THREE_LICENSE'), 'utf8').split('\n').slice(0, 3).join(' ');
const js = files.map(f => `// ──────── ${f}\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const html = fs.readFileSync(path.join(dir, 'shell.html'), 'utf8')
  .replace('/*__THREE__*/', () => `/* three.js r170 — ${lic} */\n` + three)
  .replace('/*__GAME__*/', () => js);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0) + 'KB', files.join(' '));

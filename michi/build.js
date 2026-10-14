// 果てなき道：src/*.js をまとめて index.html を作る（node michi/build.js）
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `// ──────── ${f}\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const html = fs.readFileSync(path.join(dir, 'shell.html'), 'utf8').replace('/*__GAME__*/', () => js);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0) + 'KB', files.join(' '));

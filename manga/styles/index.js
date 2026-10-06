/* manga/styles/index.js — 画風モジュールの読み込み口
   <meta name="manga-styles" content="styles/index.js"> から読まれる。残りのファイルを順番に読む。 */
(() => {
  const FILES = ['ink.js', 'art.js', 'figure.js', 'background.js', 'effects.js', 'api.js'];
  if (window.MangaInk) return;
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.slice(0, me.lastIndexOf('/') + 1) : 'styles/';
  let i = 0;
  const next = () => { if (i >= FILES.length) { window.dispatchEvent(new Event('mangaink-ready')); return; } const s = document.createElement('script'); s.src = base + FILES[i++]; s.onload = next; s.onerror = () => console.warn('styles: 読み込み失敗', s.src); document.head.appendChild(s); };
  next();
})();

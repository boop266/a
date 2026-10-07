/* manga/styles3d/index.js — 3D 作画モジュールの読み込み口
   ・three.js r128（UMD）が無ければ cdnjs から読む（Artifact の CSP で許されている置き場所）
   ・続けて core → kit → actors → api を順に読み、終わったら 'manga3d-ready' を出す
   ・window.MANGA3D_THREE_URL で three.js の置き場所を差し替えられる（テスト用） */
(() => {
  if (window.MangaInk3D) return;
  const THREE_URL = window.MANGA3D_THREE_URL || 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const FILES = ['core.js', 'kit.js', 'actors.js', 'api.js'];
  const me = document.currentScript && document.currentScript.src;
  const base = me ? me.slice(0, me.lastIndexOf('/') + 1) : 'styles3d/';
  const load = src => new Promise((ok, ng) => { const s = document.createElement('script'); s.charset = 'utf-8'; s.src = src; s.onload = ok; s.onerror = () => ng(new Error('styles3d: 読み込み失敗 ' + src)); document.head.appendChild(s); });
  (async () => {
    try {
      if (!window.THREE) await load(THREE_URL);
      for (const f of FILES) await load(base + f);
      window.dispatchEvent(new Event('manga3d-ready'));
    } catch (e) { console.warn(e); window.dispatchEvent(new CustomEvent('manga3d-failed', { detail: String(e) })); }
  })();
})();

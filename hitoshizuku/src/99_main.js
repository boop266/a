// ---------------------------------------------------------------------------
// はじまり：毎こまの流れ
// ---------------------------------------------------------------------------
// 出来事は、いまの場面の記録にも残す（解き方の印の判定に使う）
(function () {
  const emit = Bus.emit.bind(Bus);
  Bus.emit = function (type, data) {
    if (W && W.events && type !== 'noise' && type !== 'spawn') {
      const rec = { t: W.time, type };
      if (data) for (const k in data) { const v = data[k]; rec[k] = (v && v.d && v.k) ? v.k : (v && v.k && v.parts) ? v.k : v; }
      W.events.push(rec);
      if (W.events.length > 4000) W.events.splice(0, 1000);
    }
    emit(type, data);
  };
})();

let lastT = 0, acc = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const t = ts / 1000;
  let dt = lastT ? Math.min(0.1, t - lastT) : 0.016;
  lastT = t;
  if (!W) return;
  try {
    const slow = W.slowmo ? 0.25 : 1;
    if (!Game.paused) {
      acc += dt * slow;
      let n = 0;
      while (acc >= TICK && n < 6) { worldTick(); acc -= TICK; n++; Game.tickSee(); }
      tickWriting(dt);
    }
    renderFrame(Game.paused ? 0 : dt);
    if (UI.potPulseT > 0) UI.potPulseT -= dt; if (UI.potShakeT > 0) UI.potShakeT -= dt;
    if (W.tick % 3 === 0 || UI.potPulseT > 0 || UI.potShakeT > 0) updateInk();
    if (UI.bubbleEnt) { placeBubble(); UI.bubbleT -= dt; if (UI.bubbleT <= 0) hideBubble(); }
    if (_toastSoon) { toast(_toastSoon); _toastSoon = null; }
  } catch (e) { reportError(e); }
}
function boot() {
  setupCanvas();
  setupCanvasInput();
  $('menuBtn').onclick = () => { AudioSys.init(); openMenu(); };
  $('hintBtn').onclick = () => { AudioSys.init(); Scene.hint(); };
  $('modal').addEventListener('pointerdown', ev => { if (ev.target === $('modal')) closeSheet(); });
  window.addEventListener('resize', () => { trayLayout(); });
  Game.load();
  const qs = new URLSearchParams(location.search);
  if (qs.has('god')) Game.god = true;
  if (qs.has('fast')) Game.fastWrite = true;
  if (qs.has('scene')) { const i = parseInt(qs.get('scene'), 10) || 0; Game.started = true; Game.maxScene = Math.max(Game.maxScene, i); Scene.load(i); }
  else if (qs.has('sandbox')) { Game.started = true; Game.sandbox(); }
  else Title.show();
  requestAnimationFrame(frame);
}
// 外から見るための入り口（テスト用）
window.HS = { get W() { return W; }, loadLab: def => { Game.started = true; $('title').classList.remove('on'); Scene.loadDef(Object.assign({ chapter: 0, title: 'lab', id: 'lab' }, def), -1); }, get Scene() { return Scene; }, T, tAt, waAt, entsAt, fadedAt, Fx, Brush,  Game, KDEF, RECIPES, planWrite, startWrite, heroTap, heroPath, ERRORS, Ink, combineInTray, findRecipe, UI, R, newEnt, removeEnt, Bus, TICK, worldTick, strokesOf, SCENES, Voice, returnInk, setRng: s => { RNG = makeRng(s); },
  // テスト用：筆の動きを待たずに書く／時を進める
  writeNow(k, x, y) { const pl = planWrite(k, x, y); if (['none', 'noroom', 'noeffect', 'wrongname'].includes(pl.kind)) return pl.kind; if ((pl.cost || 0) > Ink.free()) return 'noink'; commitWrite(k, pl, x, y); return pl.kind; },
  sim(sec) { const n = Math.round(sec / TICK); for (let i = 0; i < n; i++) { worldTick(); Game.tickSee(); } },
  hero() { return W.hero; }, ents(k) { return W.ents.filter(e => e.alive && (!k || e.k === k)); }, ev(type) { return W.events.filter(e => e.type === type); },
  combineInTray, tapAt, findRecipe3, isPartialOf3, returnInk, get UI() { return UI; }, Final, Ending, Snap, Music, Tutor };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

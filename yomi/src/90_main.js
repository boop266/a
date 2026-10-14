// 黄泉還：はじまり・まわし続ける所
let LAST = performance.now();
function resetPlayerModel() {
  if (PL.h && PL.h.root.parent) PL.h.root.parent.remove(PL.h.root);
  PL.h = makeHuman('ryo'); PL.st = { t: 0, mode: 'idle', hp: PL.hp }; PL.dead = false; PL.aimT = 0; PL.tgt = null; PL.grab = null;
}
function startNewGame() { newGame(); resetPlayerModel(); G.ui = null; TITLE.phase = 'menu'; if (typeof startOpening === 'function' && !QS.has('skipop')) startOpening(); else { G.mode = 'play'; enterRoom(QS.get('room') || 'hall', { x: 0, z: 5.5, ang: PI }); } }
// タイトルの後ろ：雨の前庭を、ゆっくり見上げる
function enterTitleScene() {
  if (!ROOMS.yard) return; if (G.titleRoom) disposeRoom(G.titleRoom);
  G.titleRoom = buildRoom('yard'); G.titleCam = new THREE.PerspectiveCamera(46, 4 / 3, 0.05, 120); AU.setAmb(ROOMS.yard.ambience);
}
function drawTitleScene(dt) {
  const R = G.titleRoom; if (!R) return; R.t += dt; for (const l of R.lights) if (l.fl) l.L.intensity = l.base * (1 + Math.sin(R.t * 9 + l.ph) * l.fl);
  for (const f of R.anims) f(R.t, dt);
  R.lightningT = (R.lightningT ?? 3) - dt; if (R.lightningT <= 0) { R.lightningT = 6 + Math.random() * 9; R.flashT = 0.3; AU.sfx('thunder', { delay: 0.6 + Math.random() }); }
  const fl = R.flashT > 0 ? (R.flashT -= dt, R.flashT > 0.18 ? 1 : R.flashT > 0.1 ? 0.15 : 0.7) : 0; R.ambient.intensity = (R.D.amb[1]) * (1 + fl * 5);
  const t = TITLE.t * 0.04; G.titleCam.position.set(Math.sin(t) * 3, 1.4 + Math.sin(t * 0.7) * 0.2, 16 - TITLE.t * 0.05 % 4); G.titleCam.lookAt(0, 5.5, -8);
  draw3D(R.scene, G.titleCam, G.t);
}
function playStep(dt) {
  G.time += dt;
  if (!PL.dead && !PL.grab) { if (IN.e.menu) { openMenu('item'); return; } if (IN.e.map) { openMenu('map'); return; } if (IN.e.esc) { openOpts(); return; } }
  updPlayer(dt); updEnemies(dt); updRoom(dt); updFx(dt);
  if (typeof storyTick === 'function') storyTick(dt);
  if (!G.camOv && G.room) { const prev = G.cam; G.cam = pickCam(G.room, G.cam, PL.x, PL.z, PL.y); }
  if (G.timer) { G.timer.left -= dt; if (G.timer.left <= 30 && !G.timer.warn) { G.timer.warn = true; } if (G.timer.left <= 0 && !PL.dead) { G.timer.left = 0; if (typeof timerOut === 'function') timerOut(); } }
  if (PL.dead && PL.st.deadT > 1.2 && G.mode === 'play') { G.mode = 'dead'; G.deathT = 0; G.dsel = 0; }
}
function step(dt) {
  G.t += dt; inPoll(dt);
  if (G.fadeTo != null) { G.fade += Math.sign(G.fadeTo - G.fade) * dt * 2.2; if (abs(G.fade - G.fadeTo) < dt * 2.3) { G.fade = G.fadeTo; G.fadeTo = null; } }
  if (G.ui) { const k = G.ui.k; if (k === 'menu') menuUpdate(dt); else if (k === 'box') boxUpdate(); else if (k === 'save' || k === 'load') slotUpdate(); else if (k === 'opts') optsUpdate(); else if (k === 'results') resultsUpdate(); }
  else if (G.mode === 'title') titleUpdate(dt);
  else if (G.msg) msgUpdate(dt);
  else if (G.mode === 'play') playStep(dt);
  else if (G.mode === 'door' && G.doorFx) updDoorFx(G.doorFx, dt);
  else if (G.mode === 'cut') { if (typeof cutStep === 'function') cutStep(dt); }
  else if (G.mode === 'dead') { updPlayer(dt); updEnemies(dt); updRoom(dt); updFx(dt); deadUpdate(dt); }
  else if (G.mode === 'end') { if (typeof endStep === 'function') endStep(dt); }
  if (G.mode === 'cut' && G.msg) { /* 場面の中の伝言は cutStep が待つ */ }
  // 音：聞く人とカメラ
  const cam = curCam(); if (cam && G.room) { const b = camBasis(cam); AU.lis = { x: PL.x, z: PL.z, cx: cam.position.x, cz: cam.position.z, rx: b.rx, rz: b.rz }; }
  if (AU.on) { AU.ambTick(dt, G.t); AU.musTick(); }
  inConsume();
}
function render(dt) {
  UIR.length = 0; UX.clearRect(0, 0, VW.W, VW.H);
  if (G.mode !== 'door') RD.U.fade.value = G.fade || 0;
  drawOverlay(dt);
  if (G.mode === 'title') drawTitleScene(dt);
  else if (G.mode === 'door' && G.doorFx) draw3D(G.doorFx.sc, G.doorFx.cam, G.t);
  else if (G.room) {
    PL.h.root.position.set(PL.x, PL.y, PL.z); PL.h.root.rotation.y = PL.ang; if (PL.shadow) { PL.shadow.position.set(PL.x, PL.y + 0.012, PL.z); PL.shadow.visible = PL.h.root.visible; }
    const cam = curCam(); if (cam) draw3D(G.room.scene, cam, G.t);
  }
  if (G.mode === 'title' && !G.ui) drawTitle();
  if (G.mode === 'dead') drawDead();
  if (G.ui) { const k = G.ui.k; if (k === 'menu') drawMenu(); else if (k === 'box') drawBox(); else if (k === 'save' || k === 'load') drawSlots(); else if (k === 'opts') drawOpts(); else if (k === 'results') drawResults(); }
  if (G.mode === 'end' && typeof drawEnd === 'function') drawEnd();
  drawTimer(); drawSub(dt); drawMsg(); drawTouch();
}
function frame(now) {
  const dt = Math.min(0.05, (now - LAST) / 1000); LAST = now;
  if (!YOMI.paused) step(dt);
  render(dt);
  requestAnimationFrame(frame);
}
const YOMI = { G, PL, ROOMS, IN, paused: TEST,
  step(sec, dt = 1 / 60) { const n = Math.round(sec / dt); for (let i = 0; i < n; i++) step(dt); },
  render() { render(1 / 60); },
  go(rid, x, z, ang = 0, y) { G.mode = 'play'; G.ui = null; G.msg = null; G.msgQ = []; enterRoom(rid, { x, z, ang, y }); G.fade = 0; },
};
window.YOMI = YOMI;
function boot() {
  initRender(); layout(); addEventListener('resize', layout);
  try { G.unlockInf = localStorage.getItem('yomi_inf') === '1'; } catch (e) { }
  newGame(); resetPlayerModel();
  G.mode = 'title'; G.fade = 1; G.fadeTo = 0; enterTitleScene();
  if (QS.has('play')) startNewGame();
  requestAnimationFrame(frame);
}
addEventListener('load', boot);

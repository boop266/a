// ════════════════ うごかす ════════════════
window.__michi = {
  G, P, F, ZB, LEV, RUNS, RUNON, HOLEON, SOLID, GT, TG, IT, GW, GH, N, DOORS, OBJ, BLD, basicPass, pass, saveGame, loadGame, hasSave, shove, useSlot, invSlots, titleChoose, TRAIL, FIRES, rideStart, rideExit, parkSys, parkPower, parkGateSolid, LH_ID, LHN, HK_B, HH, FARLIGHT, LHC, CO, coAt, WC, CC, wheelGondola, wheelBottom, PLAMPS, BX, BY, SX, SY, STX, STY, KX, KY, GX, GY, JX, JY, T_ID, LH, key, interact, interactables, verbOf, update, render, hud, give, has, placeName, dayInfo,
  tp(x, y, L) { P.x = x; P.y = y; P.L = L; P.z = L * LH; P.stair = null; TRAIL.length = 0; F.x = x - .8; F.y = y; F.L = L; F.z = P.z; camX = x; camY = y; camZ = P.z },
  start() { G.title = false; G.started = true; camX = P.x; camY = P.y; camZ = P.z; camK = 1.1 },
  step(sec) { const n = Math.round(sec * 60); for (let i = 0; i < n; i++)update(1 / 60) },
  frame() { render(); hud() }, hold: false, later, LATER,
};
let last = performance.now();
// 重い端末では、目立たない飾りから順に軽くする（q: 2 ふつう → 1 → 0）
const QA = { ema: 16, slow: 0, t: 0 }; G.q = 2;
function adaptQ(ms, dt) { if (TEST || document.hidden) return; QA.t += dt; if (QA.t < 4) return; QA.ema = QA.ema * .95 + Math.min(ms, 120) * .05; if (QA.ema > 30 && G.q > 0) { QA.slow += dt; if (QA.slow > 3) { G.q--; QA.slow = 0; QA.ema = 20 } } else QA.slow = Math.max(0, QA.slow - dt * .5) }
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); adaptQ(now - last, dt); last = now; try { if (!window.__michi.hold) update(dt); render(); hud() } catch (e) { if ((loop.errs = (loop.errs || 0) + 1) < 4) console.error(e) } requestAnimationFrame(loop) }
requestAnimationFrame(loop);

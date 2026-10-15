// ---------------------------------------------------------------------------
// ちいさな動き：しぶき・花びら・湯気・火の粉・稲妻・墨のもどり
//   座標は世界のマス（renderTop だけ画面の点）
// ---------------------------------------------------------------------------
const Fx = (() => {
  let P = [];
  let top = [];          // 画面の上に描く（閃光・墨のもどり）
  const MAX = 700;
  function add(p) { if (P.length > MAX) P.shift(); P.push(Object.assign({ vx: 0, vy: 0, g: 0, drag: 0.98, life: 1, rot: 0, vr: 0, size: 0.1, a: 1 }, p, { max: p.life || 1 })); }
  function burst(x, y, n, base) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, s = (base.speed || 3) * (0.3 + rnd() * 0.7); add(Object.assign({}, base, { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (base.up || 0), life: (base.life || 0.8) * (0.6 + rnd() * 0.6), rot: rnd() * TAU, vr: (rnd() - .5) * 8, size: (base.size || 0.08) * (0.6 + rnd() * 0.8) })); } }
  const api = {
    clear() { P = []; top = []; },
    dust(x, y, n) { burst(x, y - .1, n || 6, { kind: 'dot', col: 'rgba(120,100,70,.5)', speed: 2, up: 1.2, g: 4, life: .6, size: .08 }); },
    dirt(x, y) { burst(x, y, 6, { kind: 'dot', col: 'rgba(110,85,50,.7)', speed: 3, up: 2, g: 9, life: .7, size: .07 }); },
    shatter(x, y, col) { burst(x, y, 14, { kind: 'shard', col: col || '#777', speed: 5, up: 2, g: 12, life: .9, size: .12 }); },
    steam(x, y, n) { for (let i = 0; i < (n || 3); i++) add({ kind: 'smoke', x: x + (rnd() - .5) * .6, y, vx: (rnd() - .5) * .4, vy: -1 - rnd(), life: 1.4, size: .18, grow: .5, col: 'rgba(250,250,250,.55)' }); },
    smoke(x, y, n) { for (let i = 0; i < (n || 5); i++) add({ kind: 'smoke', x: x + (rnd() - .5), y, vx: (rnd() - .5) * .6 + W.wind * .3, vy: -0.8 - rnd(), life: 2, size: .25, grow: .7, col: 'rgba(90,85,80,.35)' }); },
    sparkle(x, y, col, n) { burst(x, y, n || 8, { kind: 'star', col: col || INK.kin, speed: 2.5, life: .9, size: .09, drag: .9 }); },
    inkBleed(x, y, n) { burst(x, y, n || 12, { kind: 'ink', col: PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi, speed: 2.2, g: 6, life: 1.1, size: .1 }); },
    inkGather(x, y) { for (let i = 0; i < 14; i++) { const a = rnd() * TAU; add({ kind: 'ink', x: x + Math.cos(a) * 1.5, y: y + Math.sin(a) * 1.5, vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 3, life: .5, size: .08, col: PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi, drag: .95 }); } },
    crumbs(x, y, col) { burst(x, y, 6, { kind: 'dot', col: col || '#a85', speed: 1.8, up: 1, g: 6, life: .6, size: .06 }); },
    hearts(x, y, n) { for (let i = 0; i < (n || 4); i++) add({ kind: 'text', text: '♥', x: x + (rnd() - .5) * .8, y, vx: (rnd() - .5) * .6, vy: -1.2 - rnd() * .6, life: 1.3, size: .3, col: INK.shu, drag: .97 }); },
    zzz(x, y) { add({ kind: 'text', text: 'z', x: x + .2, y: y - .1, vx: .4, vy: -.6, life: 1.6, size: .28, col: PAL === PAL_NIGHT ? '#c8cfe0' : '#555', drag: 1 }); },
    notes(x, y, n) { for (let i = 0; i < (n || 6); i++) add({ kind: 'text', text: rpick(['♪', '♫']), x: x + (rnd() - .5) * 3, y: y - rnd(), vx: (rnd() - .5) * .8, vy: -.7 - rnd() * .5, life: 2, size: .32, col: INK.momo, drag: .99 }); },
    petals(x, y, n) { for (let i = 0; i < (n || 12); i++) add({ kind: 'petal', x: x + (rnd() - .5) * 2, y: y + (rnd() - .5), vx: (rnd() - .5) * 1.5 + W.wind * .5, vy: -.5 + rnd() * .5, g: .8, life: 2.5, size: .09, col: rpick(['#f0b8c8', '#f5c9d4', '#e9a3b8']), rot: rnd() * TAU, vr: (rnd() - .5) * 6, drag: .96 }); },
    leaves(x, y, n) { burst(x, y, n || 6, { kind: 'petal', col: '#7fa04a', speed: 1.8, up: 1, g: 2, life: 1.2, size: .08, drag: .95 }); },
    leavesFall(x, y, n) { for (let i = 0; i < (n || 8); i++) add({ kind: 'petal', x: x + (rnd() - .5) * 1.5, y: y + (rnd() - .5), vx: (rnd() - .5) * .8, vy: .2, g: 1.2, life: 2, size: .09, col: rpick(['#b5782f', '#c9a13a', '#8a5a2a']), rot: rnd() * TAU, vr: (rnd() - .5) * 5, drag: .96 }); },
    seal(x, y, k) { add({ kind: 'seal', text: k, x, y: y - .2, vx: 0, vy: -.6, life: 1.2, size: .45, col: INK.shu, drag: .96 }); },
    splash(x, y, n) { burst(x, y, n || 10, { kind: 'dot', col: 'rgba(40,90,160,.65)', speed: 3.5, up: 2.5, g: 10, life: .7, size: .07 }); },
    ripple(x, y) { add({ kind: 'ring', x, y, life: .8, size: .2, grow: 1.5, col: 'rgba(40,90,160,.5)' }); },
    ring(x, y, col, r) { add({ kind: 'ring', x, y, life: .9, size: .3, grow: r || 2, col: col || INK.shu }); },
    puff(x, y, n) { for (let i = 0; i < (n || 6); i++) add({ kind: 'smoke', x: x + (rnd() - .5) * .6, y: y + (rnd() - .5) * .4, vx: (rnd() - .5) * 1.4, vy: (rnd() - .5) * 1.2, life: .8, size: .2, grow: .5, col: 'rgba(250,248,240,.8)' }); },
    slash(x, y) { add({ kind: 'slash', x, y, life: .35, size: .9, col: PAL === PAL_NIGHT ? '#f0e0b0' : INK.sumi }); },
    windLines(x, y, dir) { for (let i = 0; i < 5; i++) add({ kind: 'wind', x: x - dir * (1 + rnd()), y: y + (rnd() - .5) * 2, vx: dir * (6 + rnd() * 3), vy: 0, life: .7, size: .5 + rnd() * .6, col: PAL === PAL_NIGHT ? 'rgba(200,210,240,.6)' : 'rgba(60,80,100,.45)', drag: .98 }); },
    snowPuff(x, y) { for (let i = 0; i < 3; i++) add({ kind: 'dot', x: x + (rnd() - .5) * 2, y: y + (rnd() - .5), vx: (rnd() - .5) * 2, vy: (rnd() - .5) * 1, life: 1.2, size: .06, col: 'rgba(255,255,255,.9)', drag: .97 }); },
    spark(x, y) { burst(x, y, 3, { kind: 'star', col: '#f7e27a', speed: 3, life: .4, size: .07 }); },
    confetti(x, y, n) { for (let i = 0; i < (n || 30); i++) add({ kind: 'shard', x: x + (rnd() - .5) * 4, y: y - rnd() * 2, vx: (rnd() - .5) * 3, vy: -2 - rnd() * 2, g: 3, life: 2.4, size: .09, col: rpick([INK.shu, INK.kin, INK.ai, INK.momo, INK.moegi]), rot: rnd() * TAU, vr: (rnd() - .5) * 10, drag: .97 }); },
    fireworks(x, y) {
      const cols = ['#f7d36b', '#f08a6b', '#9fd0f0', '#f3a6c8', '#b6e08a'];
      for (let b = 0; b < 4; b++) setTimeout(() => { const bx = x + (rnd() - .5) * 6, by = y + (rnd() - .5) * 2; const c = rpick(cols); for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; add({ kind: 'star', x: bx, y: by, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, g: 1.5, drag: .93, life: 1.6, size: .1, col: c }); } top.push({ kind: 'flash', life: .25, max: .25, a: .25, col: '255,240,200' }); Sfx.boom(); }, b * 380);
    },
    birth(x, y) { add({ kind: 'dropfall', x, y: -2, tx: x, ty: y, life: 1.1, size: .16, col: INK.sumi }); setTimeout(() => { if (!W) return; api.inkBleed(x, y - .2, 16); api.ring(x, y - .2, INK.sumi, 1.2); Sfx.drop(); }, 1100); },
    meteor(x, y) { add({ kind: 'meteor', x: x + 5, y: -3, tx: x, ty: y, life: .45, size: .3, col: '#f7d36b' }); },
    bolt(x, y) {
      const pts = [[x + (rnd() - .5) * 2, -2]]; let cx = pts[0][0];
      for (let yy = -1; yy <= y; yy += 1) { cx += (rnd() - .5) * 1.2; pts.push([cx, yy]); }
      pts.push([x, y]);
      add({ kind: 'bolt', pts, x, y, life: .35, size: .1, col: '#fff7c0' });
    },
    flash(a) { top.push({ kind: 'flash', life: .35, max: .35, a: a || .6, col: '255,255,240' }); },
    shake(a) { R.cam.shake = Math.max(R.cam.shake, a || 1); },
    wave(x, y, dir) { for (let i = 0; i < 8; i++) add({ kind: 'wind', x: x - dir * 2 + i * dir * .4, y: y + (rnd() - .5) * .4, vx: dir * 6, vy: 0, life: .8, size: .7, col: 'rgba(40,90,160,.55)' }); },
    tapMark(x, y, ok) { add({ kind: 'ring', x, y, life: .45, size: .15, grow: .6, col: ok ? 'rgba(28,26,32,.45)' : 'rgba(196,56,31,.6)' }); },
    restore(x, y, w, h, col) {
      for (let i = 0; i < 40; i++) { const a = rnd() * TAU, r = Math.max(w, h) * (0.6 + rnd()); add({ kind: 'ink', x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: -Math.cos(a) * r * 2.4, vy: -Math.sin(a) * r * 2.4, life: .45, size: .09, col, drag: .9 }); }
      setTimeout(() => { if (!W) return; burst(x, y, 30, { kind: 'star', col: INK.kin, speed: 4, life: 1.2, size: .1, drag: .9 }); api.ring(x, y, col, Math.max(w, h) * 1.5); }, 420);
    },
    // 墨が墨つぼへもどる（画面の点へ）
    inkFlow(x, y, n) {
      const [sx, sy] = w2s(x, y);
      for (let i = 0; i < Math.min(18, 3 + n); i++) top.push({ kind: 'inkback', x: sx + (rnd() - .5) * 20, y: sy + (rnd() - .5) * 20, t: -i * 0.035, life: 1, max: 1 });
    },
    sunRise() { top.push({ kind: 'flash', life: .8, max: .8, a: .35, col: '255,220,160' }); },
    dusk() { top.push({ kind: 'flash', life: 1, max: 1, a: .4, col: '20,24,50' }); },
    dawn() { top.push({ kind: 'flash', life: 1, max: 1, a: .35, col: '255,235,200' }); },
    season(s) { const c = { spring: '#f3c1cf', summer: '#9fd0a0', autumn: '#d98b4a', winter: '#e6eef6' }[s]; for (let i = 0; i < 60; i++) add({ kind: s === 'winter' ? 'dot' : 'petal', x: R.cam.x + (rnd() - .5) * 14, y: R.cam.y - 7 + rnd() * 3, vx: (rnd() - .5) * 1.2, vy: .5 + rnd(), g: .5, life: 4, size: .09, col: c, rot: rnd() * TAU, vr: (rnd() - .5) * 4, drag: .99 }); top.push({ kind: 'flash', life: .9, max: .9, a: .25, col: s === 'winter' ? '235,240,250' : '255,240,220' }); },
    update(dt) {
      for (const p of P) {
        p.life -= dt;
        if (p.kind === 'meteor') { const k = 1 - p.life / p.max; p.x = lerp(p.tx + 5, p.tx, k); p.y = lerp(-3, p.ty, k); continue; }
        if (p.kind === 'dropfall') { const k = 1 - p.life / p.max; p.x = p.tx; p.y = lerp(R.cam.y - 8, p.ty, k * k); continue; }
        p.vy += p.g * dt; p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60);
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.grow) p.size += p.grow * dt;
      }
      P = P.filter(p => p.life > 0);
    },
    render(ctx, dt) {
      api.update(dt);
      const TS = R.TS;
      for (const p of P) {
        const [sx, sy] = w2s(p.x, p.y);
        if (sx < -60 || sy < -60 || sx > R.vw + 60 || sy > R.vh + 60) continue;
        const k = clamp(p.life / p.max, 0, 1), s = p.size * TS;
        ctx.globalAlpha = Math.min(1, k * 1.5) * p.a;
        ctx.fillStyle = p.col; ctx.strokeStyle = p.col;
        switch (p.kind) {
          case 'dot': ctx.beginPath(); ctx.arc(sx, sy, s, 0, TAU); ctx.fill(); break;
          case 'ink': ctx.beginPath(); ctx.ellipse(sx, sy, s * 1.2, s, p.rot, 0, TAU); ctx.fill(); break;
          case 'shard': ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.rot); ctx.fillRect(-s, -s * .4, s * 2, s * .8); ctx.restore(); break;
          case 'petal': ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.rot); ctx.beginPath(); ctx.ellipse(0, 0, s * 1.4, s * .7, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
          case 'smoke': ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.arc(sx, sy, s, 0, TAU); ctx.fill(); break;
          case 'star': ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.rot); ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.lineTo(Math.cos(a) * s * 1.6, Math.sin(a) * s * 1.6); ctx.lineTo(Math.cos(a + Math.PI / 4) * s * .45, Math.sin(a + Math.PI / 4) * s * .45); } ctx.closePath(); ctx.fill(); ctx.restore(); break;
          case 'text': case 'seal': {
            ctx.font = '600 ' + Math.round(s * (p.kind === 'seal' ? 1 : 1.1)) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            if (p.kind === 'seal') { ctx.fillStyle = INK.shu; ctx.fillRect(sx - s * .6, sy - s * .6, s * 1.2, s * 1.2); ctx.fillStyle = '#fff'; }
            ctx.fillText(p.text, sx, sy); ctx.textBaseline = 'alphabetic'; break;
          }
          case 'ring': ctx.lineWidth = Math.max(1.5, TS * .05); ctx.beginPath(); ctx.arc(sx, sy, s, 0, TAU); ctx.stroke(); break;
          case 'slash': ctx.lineWidth = TS * .08 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx - s * .5, sy - s * .5); ctx.lineTo(sx + s * .5, sy + s * .5); ctx.stroke(); break;
          case 'wind': ctx.lineWidth = Math.max(1.5, TS * .04); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx - sign(p.vx) * s * TS * .5, sy - TS * .1, sx - sign(p.vx) * s * TS, sy); ctx.stroke(); break;
          case 'bolt': ctx.lineWidth = Math.max(3, TS * .1); ctx.lineJoin = 'round'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.beginPath(); p.pts.forEach(([x, y], i) => { const [a, b] = w2s(x, y); if (i) ctx.lineTo(a, b); else ctx.moveTo(a, b); }); ctx.stroke(); ctx.shadowBlur = 0; break;
          case 'dropfall': { const r = s; ctx.fillStyle = PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi; ctx.beginPath(); ctx.moveTo(sx, sy - r * 2); ctx.bezierCurveTo(sx + r * .5, sy - r, sx + r, sy - r * .2, sx + r, sy + r * .2); ctx.arc(sx, sy + r * .2, r, 0, Math.PI); ctx.bezierCurveTo(sx - r, sy - r * .2, sx - r * .5, sy - r, sx, sy - r * 2); ctx.fill(); break; }
          case 'meteor': { ctx.lineWidth = TS * .12; ctx.lineCap = 'round'; const [tx, ty] = w2s(p.x + 1.5, p.y - 1); const g = ctx.createLinearGradient(sx, sy, tx, ty); g.addColorStop(0, '#fff6c8'); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(sx, sy, s * .6, 0, TAU); ctx.fill(); break; }
        }
      }
      ctx.globalAlpha = 1;
    },
    renderTop(ctx, dt) {
      const pot = UI.potPoint();
      for (const p of top) {
        p.life -= dt;
        if (p.kind === 'flash') { ctx.fillStyle = 'rgba(' + p.col + ',' + (p.a * clamp(p.life / p.max, 0, 1)) + ')'; ctx.fillRect(0, 0, R.vw, R.vh); }
        else if (p.kind === 'inkback') {
          p.t += dt * 1.6; if (p.t < 0) { p.life += dt; continue; }
          const k = easeInOut(clamp(p.t, 0, 1));
          const x = lerp(p.x, pot[0], k), y = lerp(p.y, pot[1], k) - Math.sin(k * Math.PI) * 60;
          ctx.fillStyle = PAL === PAL_NIGHT ? '#e0bd64' : INK.sumi; ctx.beginPath(); ctx.arc(x, y, 3.2 * (1 - k * .4), 0, TAU); ctx.fill();
          if (p.t >= 1) { p.life = 0; UI.potPulse(); }
        }
      }
      top = top.filter(p => p.life > 0);
    },
  };
  return api;
})();

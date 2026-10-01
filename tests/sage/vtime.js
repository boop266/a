// 仮想時計：ページの時間（setTimeout・requestAnimationFrame・performance.now・Date.now）を
// ボットが進める。待ち時間が一瞬で済むので、本物の速さの何十倍でも遊べて、先読みもできる。
(() => {
  const realNow = performance.now.bind(performance);
  const mc = new MessageChannel(); const waiters = [];
  mc.port1.onmessage = () => { const w = waiters.shift(); if (w) w(); };
  const macro = () => new Promise(r => { waiters.push(r); mc.port2.postMessage(0); });
  const VT = window.VT = {
    now: 1000, seq: 1, q: [], held: [], sim: false, drawEvery: 120,
    add(fn, ms, args, rep) { const id = VT.seq++; VT.q.push({ id, at: VT.now + Math.max(0, +ms || 0), fn, args: args || [], rep }); return id; },
    clear(id) { const i = VT.q.findIndex(t => t.id === id); if (i >= 0) VT.q.splice(i, 1); },
    next() { let b = -1; for (let i = 0; i < VT.q.length; i++) if (b < 0 || VT.q[i].at < VT.q[b].at || (VT.q[i].at === VT.q[b].at && VT.q[i].id < VT.q[b].id)) b = i; return b; },
    // 描画と繰り返し以外に、まだ起きていない予定があるか（手の続きが裏で走っている）
    pending(win) { return VT.q.some(t => t.rep == null && !t.draw && t.at - VT.now <= (win || 1500)); },
    // ms だけ時間を進める。途中の予定はすべて順番に起こす
    async run(ms, stop) {
      const end = VT.now + ms; let n = 0;
      for (;;) {
        await macro();
        if (stop && stop()) return true;
        const b = VT.next(); if (b < 0 || VT.q[b].at > end) break;
        const t = VT.q.splice(b, 1)[0]; VT.now = Math.max(VT.now, t.at);
        if (t.rep != null) { t.at = VT.now + Math.max(1, t.rep); VT.q.push(t); }
        try { typeof t.fn === 'function' ? t.fn(...t.args) : 0; } catch (e) { (VT.errs = VT.errs || []).push(String(e && e.message || e)); }
        if (++n > 20000) break;
      }
      VT.now = Math.max(VT.now, end); await macro(); return false;
    },
  };
  const isDraw = fn => fn && (fn.name === 'render' || fn.name === 'drawIt' || fn.name === 'fitSheet');
  window.setTimeout = (fn, ms, ...a) => VT.add(fn, ms, a);
  window.clearTimeout = id => VT.clear(id);
  window.setInterval = (fn, ms, ...a) => VT.add(fn, Math.max(1, ms || 0), a, Math.max(1, ms || 0));
  window.clearInterval = id => VT.clear(id);
  window.requestAnimationFrame = fn => { if (VT.sim && isDraw(fn)) { VT.held.push(fn); return 0; } const id = VT.add(() => fn(VT.now), isDraw(fn) ? VT.drawEvery : 16); if (isDraw(fn)) VT.q[VT.q.length - 1].draw = 1; return id; };
  window.cancelAnimationFrame = id => VT.clear(id);
  performance.now = () => VT.now;
  const D0 = Date.now(); Date.now = () => D0 + VT.now;
  VT.realNow = realNow;
})();

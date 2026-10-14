// ════════════════ 音（その場で作る曲・虫の声・風） ════════════════
const AU = { ac: null, master: null, music: null, amb: null, sfx: null, rev: null, cur: null, want: 'theme', songs: {}, step: 0, nextT: 0, wind: null, river: null, gen: null, nextCall: 0, mute: false };
const mfreq = m => 440 * Math.pow(2, (m - 69) / 12);
function audioStart() {
  if (AU.ac || TEST) return;
  try {
    const ac = AU.ac = new (window.AudioContext || window.webkitAudioContext)();
    AU.master = ac.createGain(); AU.master.gain.value = .9; AU.master.connect(ac.destination);
    // 残響
    const len = ac.sampleRate * 2.8, ir = ac.createBuffer(2, len, ac.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++)d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) }
    AU.rev = ac.createConvolver(); AU.rev.buffer = ir; const rg = ac.createGain(); rg.gain.value = .55; AU.rev.connect(rg).connect(AU.master);
    AU.music = ac.createGain(); AU.music.gain.value = .55; AU.music.connect(AU.master); AU.music.connect(AU.rev);
    AU.amb = ac.createGain(); AU.amb.gain.value = .8; AU.amb.connect(AU.master); const ar = ac.createGain(); ar.gain.value = .25; AU.amb.connect(ar).connect(AU.rev);
    AU.sfx = ac.createGain(); AU.sfx.gain.value = .8; AU.sfx.connect(AU.master); const sr = ac.createGain(); sr.gain.value = .2; AU.sfx.connect(sr).connect(AU.rev);
    // 風・川・発電機
    const nb = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), nd = nb.getChannelData(0); let l = 0; for (let i = 0; i < nd.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; nd[i] = l * 3.2 }
    const mk = (f, q, type) => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.playbackRate.value = .8 + Math.random() * .4; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.value = 0; s.connect(fl).connect(g).connect(AU.amb); s.start(); return g };
    AU.wind = mk(420, .6, 'lowpass'); AU.river = mk(900, .4, 'bandpass'); AU.sea = mk(300, .5, 'lowpass');
    // 雨（白いざあざあ）
    const wb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), wd = wb.getChannelData(0); for (let i = 0; i < wd.length; i++)wd[i] = Math.random() * 2 - 1;
    const mkW = (f, q, type) => { const s2 = ac.createBufferSource(); s2.buffer = wb; s2.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.value = 0; s2.connect(fl).connect(g).connect(AU.amb); s2.start(); return g };
    AU.rain = mkW(3200, .4, 'bandpass'); AU.rainLow = mkW(600, .6, 'lowpass');
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 47; const of = ac.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 170; AU.gen = ac.createGain(); AU.gen.gain.value = 0; o.connect(of).connect(AU.gen).connect(AU.amb); o.start();
    AU.nextT = ac.currentTime + .1;
  } catch (e) { AU.ac = null }
}
// ───────── 楽器 ─────────
function env(g, t, a, peak, dec, rel = 0) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0005, t + a + dec + rel) }
function piano(m, t, vel = .2, dec = 1.8, out) { const ac = AU.ac; const g = ac.createGain(); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; g.connect(f).connect(out || AU.music); for (const [type, mul, v] of [['triangle', 1, 1], ['sine', 2, .35], ['sine', 3, .12]]) { const o = ac.createOscillator(); o.type = type; o.frequency.value = mfreq(m) * mul; o.detune.value = (Math.random() - .5) * 6; const og = ac.createGain(); og.gain.value = v; o.connect(og).connect(g); o.start(t); o.stop(t + dec + .1) } env(g, t, .006, vel, dec) }
function mbox(m, t, vel = .14) { const ac = AU.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = mfreq(m + 12); o.connect(g).connect(AU.music); env(g, t, .002, vel, 1.3); o.start(t); o.stop(t + 1.5); const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'sine'; o2.frequency.value = mfreq(m + 24) * 1.003; o2.connect(g2).connect(AU.music); env(g2, t, .002, vel * .3, .5); o2.start(t); o2.stop(t + .7) }
function bell(m, t, vel = .12) { const ac = AU.ac, car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain(); car.frequency.value = mfreq(m); mod.frequency.value = mfreq(m) * 3.5; mg.gain.value = mfreq(m) * 1.4; mod.connect(mg).connect(car.frequency); car.connect(g).connect(AU.music); env(g, t, .004, vel, 2.6); mg.gain.setValueAtTime(mfreq(m) * 1.4, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.5); car.start(t); mod.start(t); car.stop(t + 2.8); mod.stop(t + 2.8) }
function pad(ms, t, dur, vel = .045, bright = 900) { const ac = AU.ac, f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = bright; f.Q.value = .4; f.connect(g).connect(AU.music); for (const m of ms) for (const dt of [-7, 7]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mfreq(m); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + 1.6) } g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + Math.min(1.2, dur * .4)); g.gain.setValueAtTime(vel, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 1.5) }
function strings(m, t, dur, vel = .05) { const ac = AU.ac, o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); o.type = o2.type = 'sawtooth'; o.frequency.value = mfreq(m); o2.frequency.value = mfreq(m) * 1.004; lfo.frequency.value = 5.2; lg.gain.value = 4; lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune); f.type = 'lowpass'; f.frequency.value = 1500; o.connect(f); o2.connect(f); f.connect(g).connect(AU.music); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .5); g.gain.setValueAtTime(vel, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .8); for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + dur + 1) } }
function bass(m, t, dur, vel = .12) { const ac = AU.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = mfreq(m); o.connect(g).connect(AU.music); env(g, t, .01, vel, dur); o.start(t); o.stop(t + dur + .1) }
// ───────── 曲 ─────────
const CHD = { C7: [48, 52, 55, 58], Bb: [46, 50, 53, 58], D: [50, 62, 66, 69], Bm: [47, 59, 62, 66], G: [43, 59, 62, 67], A: [45, 57, 61, 64], Em: [40, 55, 59, 62], F: [41, 57, 60, 64], C: [48, 55, 60, 64], Am: [45, 57, 60, 64], Dmaj7: [50, 61, 66, 69], Gmaj7: [43, 59, 62, 66], Bm7: [47, 57, 62, 66], A6: [45, 57, 61, 66], Em9: [40, 54, 59, 62], Cmaj7: [48, 55, 59, 64], Fmaj7: [41, 57, 60, 64], Asus: [45, 57, 62, 64] };
// テーマ（8小節・8分音符で16歩ずつ：数字＝音、0＝のばす、-1＝休み）
const THEME = [[66, 0, 69, 0, 74, 0, 73, 0], [71, 0, 0, 0, 69, 0, 66, 0], [67, 0, 71, 0, 76, 0, 74, 0], [73, 0, 0, 0, 0, 0, -1, 0], [74, 0, 73, 0, 71, 0, 69, 0], [71, 0, 69, 0, 66, 0, 64, 0], [66, 0, 67, 0, 69, 0, 71, 0], [69, 0, 0, 0, 0, 0, -1, -1]];
const THEME_CH = ['D', 'Bm', 'G', 'A', 'Bm', 'G', 'Em', 'A'];
const SONGS = {
  theme: { bpm: 70, bars: 8, chords: THEME_CH, play(bar, s, t, d) { const n = THEME[bar][s]; if (n > 0) mbox(n, t, .13); if (s === 0) pad(CHD[THEME_CH[bar]].slice(1), t, d * 8, .03, 700); if (s % 4 === 0) mbox(CHD[THEME_CH[bar]][1 + (s / 4)] - 12, t, .05) } },
  town: { bpm: 66, bars: 4, chords: ['Dmaj7', 'Bm7', 'Gmaj7', 'A6'], play(bar, s, t, d, st) { const ch = CHD[this.chords[bar]]; if (s === 0) { bass(ch[0], t, d * 7, .08); pad(ch.slice(1), t, d * 8, .022, 650) } const arp = [1, 2, 3, 2, 1, 2, 3, 2]; piano(ch[arp[s]] + (s >= 4 ? 12 : 0), t, .055, 1.6); if (s % 2 === 0 && Math.random() < .3) { const sc = [74, 76, 78, 81, 83, 86]; piano(sc[Math.floor(Math.random() * sc.length)], t + d * .02, .07, 2.2) } } },
  inside: { bpm: 56, bars: 4, chords: ['Am', 'Fmaj7', 'Cmaj7', 'G'], play(bar, s, t, d) { const ch = CHD[this.chords[bar]]; if (s === 0) pad(ch.slice(0, 3), t, d * 8, .03, 520); if (s === 0 || s === 5 && Math.random() < .6) { const sc = [69, 72, 74, 76, 79, 81]; bell(sc[Math.floor(Math.random() * sc.length)], t, .06) } } },
  sunset: { bpm: 68, bars: 8, chords: THEME_CH, play(bar, s, t, d) { const n = THEME[bar][s]; const ch = CHD[THEME_CH[bar]]; if (n > 0) { piano(n, t, .14, 2.4); piano(n - 12, t, .05, 2) } if (s === 0) { bass(ch[0], t, d * 8, .1); pad(ch.slice(1), t, d * 8, .03, 1100); for (const m of ch.slice(1)) strings(m - 12, t, d * 7.5, .018) } if (s % 2 === 1) piano(ch[1 + ((s >> 1) % 3)], t, .04, 1.2) } },
  night: { bpm: 50, bars: 2, chords: ['Em9', 'Cmaj7'], play(bar, s, t, d) { const ch = CHD[this.chords[bar]]; if (s === 0) pad(ch, t, d * 8, .03, 480); if (Math.random() < .12) piano([76, 79, 83, 86, 88][Math.floor(Math.random() * 5)], t, .045, 3) } },
  danger: { bpm: 96, bars: 2, chords: ['Em', 'F'], play(bar, s, t, d) { const ch = CHD[this.chords[bar]]; bass(ch[0] - 12 + (s % 2 ? 12 : 0), t, d * .9, .1); if (s === 0) pad([ch[1], ch[1] + 1], t, d * 8, .025, 400); if (s === 4) bell(ch[2] + 12, t, .03) } },
  // 遊園地のスピーカーから流れる、はずむ曲（オルゴールと鐘）
  park: { bpm: 104, bars: 8, chords: ['F', 'C7', 'F', 'Bb', 'F', 'C7', 'F', 'F'], mel: [[72, 0, 77, 0, 81, 0, 77, 0], [79, 0, 76, 0, 72, 0, 79, 0], [81, 0, 84, 0, 81, 0, 77, 0], [82, 0, 81, 0, 79, 0, 77, 0], [77, 0, 81, 0, 84, 0, 86, 0], [84, 0, 82, 0, 79, 0, 76, 0], [77, 0, 79, 0, 81, 0, 76, 0], [77, 0, 0, 0, -1, 0, -1, 0]], play(bar, s, t, d) { const ch = CHD[this.chords[bar]], n = this.mel[bar][s]; if (n > 0) { mbox(n, t, .1); if (s === 0) bell(n + 12, t, .02) } if (s === 0 || s === 4) bass(ch[0], t, d * 1.6, .07); if (s === 2 || s === 6) for (const m of ch.slice(1)) mbox(m, t, .025) } },
  none: { bpm: 60, bars: 1, chords: ['D'], play() { } },
};
function musicUpdate() {
  const ac = AU.ac; if (!ac) return; const want = AU.want;
  if (AU.cur !== want && (AU.step % 8 === 0 || AU.cur === null)) { if (AU.curGain) { const g = AU.curGain; g.gain.setTargetAtTime(0, ac.currentTime, .8); setTimeout(() => g.disconnect(), 4000) } AU.cur = want; AU.step = 0; AU.curGain = ac.createGain(); AU.curGain.gain.value = 1; AU.curGain.connect(AU.music); AU.nextT = Math.max(AU.nextT, ac.currentTime + .05) }
  const song = SONGS[AU.cur]; if (!song) return; const d = 60 / song.bpm / 2;
  const prevMusic = AU.music;
  while (AU.nextT < ac.currentTime + .25) { const bar = Math.floor(AU.step / 8) % song.bars, s = AU.step % 8; AU.music = AU.curGain; try { song.play(bar, s, AU.nextT, d, AU.step) } catch (e) { } AU.music = prevMusic; AU.step++; AU.nextT += d }
}
// ───────── 虫・鳥・からす ─────────
function higurashi(t, vol = .03) { const ac = AU.ac; const pan = ac.createStereoPanner ? ac.createStereoPanner() : null; const g = ac.createGain(); g.gain.value = vol; if (pan) { pan.pan.value = Math.random() * 2 - 1; g.connect(pan).connect(AU.amb) } else g.connect(AU.amb); const n = 9 + Math.floor(Math.random() * 6); for (let i = 0; i < n; i++) { const tt = t + i * .16, o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; const f0 = 4700 - i * 45; o.frequency.setValueAtTime(f0, tt); o.frequency.linearRampToValueAtTime(f0 - 380, tt + .12); o.connect(og).connect(g); og.gain.setValueAtTime(0, tt); og.gain.linearRampToValueAtTime(1 - i / n * .6, tt + .015); og.gain.exponentialRampToValueAtTime(.001, tt + .13); o.start(tt); o.stop(tt + .15) } }
function cricket(t, vol = .02) { const ac = AU.ac, g = ac.createGain(); g.gain.value = vol; g.connect(AU.amb); for (let r = 0; r < 3; r++)for (let i = 0; i < 4; i++) { const tt = t + r * .42 + i * .045, o = ac.createOscillator(), og = ac.createGain(); o.frequency.value = 4300 + Math.random() * 200; o.connect(og).connect(g); og.gain.setValueAtTime(0, tt); og.gain.linearRampToValueAtTime(1, tt + .005); og.gain.exponentialRampToValueAtTime(.001, tt + .035); o.start(tt); o.stop(tt + .04) } }
function crow(t, vol = .05) { const ac = AU.ac; for (let i = 0; i < 2; i++) { const tt = t + i * .42, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(640, tt); o.frequency.exponentialRampToValueAtTime(420, tt + .3); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 2.5; o.connect(f).connect(g).connect(AU.amb); env(g, tt, .02, vol, .32); o.start(tt); o.stop(tt + .4) } }
function birdie(t, vol = .025) { const ac = AU.ac; for (let i = 0; i < 3; i++) { const tt = t + i * .14, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(3200 + Math.random() * 800, tt); o.frequency.exponentialRampToValueAtTime(4800 + Math.random() * 600, tt + .08); o.connect(g).connect(AU.amb); env(g, tt, .005, vol, .09); o.start(tt); o.stop(tt + .12) } }
function ambUpdate(dt, D, alt, inside, nearRiver, genNear) {
  const ac = AU.ac; if (!ac) return; const t = ac.currentTime;
  AU.wind.gain.setTargetAtTime(inside ? .006 : .012 + clamp(alt / 24, 0, 1) * .09 + (P.L === 10 ? .05 : 0), t, .6);
  AU.river.gain.setTargetAtTime(inside ? 0 : clamp(1 - nearRiver / 14, 0, 1) * .05, t, .6);
  // 波の音：寄せては返す
  const sd = coastX(P.y) - P.x, swell = .55 + .45 * Math.sin(t * .55) * Math.sin(t * .23 + 1); AU.sea.gain.setTargetAtTime(clamp(1 - sd / 26, 0, 1) * (inside ? .02 : .09) * swell, t, .4);
  const rn = G.wx ? G.wx.rain : 0; AU.rain.gain.setTargetAtTime(rn * (inside ? .012 : .05), t, .8); AU.rainLow.gain.setTargetAtTime(rn * (inside ? .05 : .025), t, .8);
  AU.gen.gain.setTargetAtTime(genNear, t, .3);
  if (t > AU.nextCall && !inside) {
    const h = D.h; AU.nextCall = t + 2.5 + Math.random() * 5;
    if (h > 16.3 && h < 19.1) { higurashi(t + .1, .022); if (Math.random() < .25) crow(t + .5 + Math.random(), .035) }
    else if (D.night > .6) { cricket(t + .1, .014); if (Math.random() < .5) cricket(t + .9, .01) }
    else if (h > 5 && h < 9) birdie(t + .1)
    else if (Math.random() < .3) birdie(t + .1, .015);
  }
}
// ───────── 効果音 ─────────
function sfx(k, vol = 1) {
  const ac = AU.ac; if (!ac) return; const t = ac.currentTime;
  const tone = (f, dur, v, type = 'sine', f2) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); o.connect(g).connect(AU.sfx); env(g, t, .004, v * vol, dur); o.start(t); o.stop(t + dur + .05) };
  const noise = (dur, v, f = 1200, q = 1, type = 'bandpass', at = 0) => { const b = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++)d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); s.connect(fl).connect(g).connect(AU.sfx); env(g, t + at, .004, v * vol, dur); s.start(t + at) };
  switch (k) {
    case 'tap': tone(880, .05, .05); break; case 'pick': tone(988, .09, .08); setTimeout(() => tone(1318, .12, .07), 70); break;
    case 'door': noise(.25, .12, 400, 2); tone(160, .2, .05, 'triangle', 120); break; case 'slide': noise(.4, .08, 900, .7); break;
    case 'ding': tone(1320, 1, .1); setTimeout(() => tone(990, 1.2, .1), 280); break;
    case 'switch': noise(.06, .3, 2000, 1); tone(110, .12, .12, 'square'); break;
    case 'crash': noise(.5, .3, 700, .8); tone(90, .4, .15, 'sawtooth', 50); break;
    case 'engine': { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(30, t); o.frequency.linearRampToValueAtTime(52, t + 1.2); o.connect(g).connect(AU.sfx); env(g, t, .2, .2 * vol, 1.6); o.start(t); o.stop(t + 1.9); noise(1.2, .1, 300, .5, 'lowpass'); break }
    case 'off': tone(60, .6, .12, 'sawtooth', 30); break; case 'push': noise(.15, .2, 300, 1); break; case 'hurt': tone(220, .2, .12, 'sawtooth', 110); noise(.15, .15, 600); break;
    case 'step': noise(.05, .05, 1600 + Math.random() * 600, 1.5); break; case 'stepm': noise(.06, .07, 2400, 4); tone(1800 + Math.random() * 300, .08, .015); break; case 'stepg': noise(.07, .04, 700, .8); break;
    case 'page': noise(.18, .07, 3000, .6, 'highpass'); break;
    case 'shrinebell': for (let i = 0; i < 6; i++) setTimeout(() => { if (AU.ac) { const tt = AU.ac.currentTime; const o = AU.ac.createOscillator(), g = AU.ac.createGain(); o.frequency.value = 2400 + Math.random() * 400; o.connect(g).connect(AU.sfx); env(g, tt, .002, .05, .4); o.start(tt); o.stop(tt + .5) } }, i * 60); break;
    case 'taiko': tone(70, .7, .4, 'sine', 45); noise(.1, .2, 200, .6, 'lowpass'); break;
    case 'power': { const ch = [50, 57, 62, 66, 69, 74]; ch.forEach((m, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = mfreq(m); o.connect(g).connect(AU.sfx); g.gain.setValueAtTime(0, t + i * .35); g.gain.linearRampToValueAtTime(.05 * vol, t + i * .35 + .4); g.gain.linearRampToValueAtTime(0, t + 6); o.start(t + i * .35); o.stop(t + 6.2) }); break }
    case 'light': tone(120, .35, .03, 'square', 118); noise(.04, .05, 3000, 2); break;
    case 'clunk': noise(.25, .45, 260, .7, 'lowpass'); tone(58, .9, .25, 'sawtooth', 46); noise(.6, .05, 900, .5, 'bandpass', .15); break;
    case 'scare': noise(.5, .25, 2600, .6); tone(1400, .6, .06, 'sawtooth', 300); break;
    case 'clank': tone(320, .15, .12, 'square', 200); noise(.12, .2, 1800, 2); break;
    case 'chain': noise(.03, .08, 3200, 6); tone(900, .03, .02, 'square'); break;
    case 'brake': noise(.9, .12, 3000, .7, 'highpass'); tone(2100, .5, .02, 'sine', 1700); break;
    case 'wind': noise(1.4, .18, 600, .4, 'lowpass'); break;
    case 'paddle': noise(.18, .05, 1100, 1.2); break;
    case 'buzzer': for (let i = 0; i < 6; i++) tone(1046 + (i % 2) * 220, .1, .05, 'square'); break;
    case 'starter': tone(120, .06, .1, 'square'); noise(.05, .12, 900, 2); break;
    case 'coin': tone(2600, .12, .06); tone(3500, .25, .04); noise(.5, .03, 1800, 3, 'bandpass', .1); break;
    case 'flame': noise(.6, .06, 500, .4, 'lowpass'); break;
  }
}
function playPianoTheme() { const ac = AU.ac; if (!ac) return; const d = 60 / 72 / 2; let t = ac.currentTime + .1; for (let bar = 0; bar < 8; bar++) { const ch = CHD[THEME_CH[bar]]; piano(ch[0] - 12, t, .1, 2.6, AU.sfx); for (let s = 0; s < 8; s++) { const n = THEME[bar][s]; if (n > 0) piano(n, t + s * d, .16, 2.2, AU.sfx); if (s % 2 === 1) piano(ch[1 + (s >> 1) % 3], t + s * d, .05, 1.2, AU.sfx) } t += d * 8 } return d * 64 }

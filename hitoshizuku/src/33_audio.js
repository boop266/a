// ---------------------------------------------------------------------------
// 音：琴（カープラス・ストロング）・尺八・太鼓・拍子木・筆の音・水・風・雷・鈴
//   すべてその場で合成する（音の素材は使わない）
// ---------------------------------------------------------------------------
const AudioSys = (() => {
  let ac = null, master, musicBus, sfxBus, verb, verbGain, noiseBuf;
  const kotoCache = new Map();
  const st = { music: 0.55, sfx: 0.8, on: true };
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
      ac = new C();
      master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.connect(master);
      musicBus = ac.createGain(); musicBus.gain.value = st.music * 0.5; musicBus.connect(comp);
      sfxBus = ac.createGain(); sfxBus.gain.value = st.sfx * 0.7; sfxBus.connect(comp);
      verb = ac.createConvolver(); verb.buffer = makeImpulse(2.8, 2.4);
      verbGain = ac.createGain(); verbGain.gain.value = 0.32; verb.connect(verbGain); verbGain.connect(comp);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });
      return true;
    } catch (e) { reportError(e); ac = null; return false; }
  }
  function makeImpulse(sec, decay) {
    const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  const T0 = () => ac.currentTime;
  function env(g, t, a, peak, d, sus, r) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + r); }
  function noise(t, dur, filt, f, q, peak, bus, a, sweepTo) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = filt; fl.frequency.value = f; fl.Q.value = q || 1;
    if (sweepTo) fl.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ac.createGain(); env(g, t, a || 0.005, peak, dur * 0.3, 0.4, dur * 0.7);
    s.connect(fl); fl.connect(g); g.connect(bus || sfxBus);
    s.start(t, Math.random()); s.stop(t + dur + 0.1);
    return g;
  }
  function tone(t, type, f, dur, peak, bus, fTo, a) {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (fTo) o.frequency.exponentialRampToValueAtTime(fTo, t + dur);
    const g = ac.createGain(); env(g, t, a || 0.004, peak, dur * 0.25, 0.5, dur * 0.75);
    o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
    return g;
  }
  // 琴：カープラス・ストロング
  function kotoBuf(freq, bright) {
    const key = Math.round(freq * 10) + '|' + (bright || 0.5);
    if (kotoCache.has(key)) return kotoCache.get(key);
    const sr = ac.sampleRate, dur = 3.2, len = Math.floor(sr * dur);
    const b = ac.createBuffer(1, len, sr), d = b.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq));
    const buf = new Float32Array(N);
    // はじいた所の形（少しやわらかい雑音）
    let prev = 0; for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev * (1 - (bright || 0.5)) + r * (bright || 0.5); buf[i] = prev; }
    let idx = 0; const decay = 0.996 - Math.min(0.012, freq / 90000);
    for (let i = 0; i < len; i++) {
      const a = buf[idx], b2 = buf[(idx + 1) % N];
      const v = (a + b2) * 0.5 * decay;
      buf[idx] = v; d[i] = a; idx = (idx + 1) % N;
    }
    // はじきの瞬間の「ばちっ」
    for (let i = 0; i < Math.min(len, 220); i++) d[i] += (Math.random() * 2 - 1) * 0.3 * (1 - i / 220);
    kotoCache.set(key, b);
    return b;
  }
  function koto(t, freq, peak, bus, wet, bend) {
    const s = ac.createBufferSource(); s.buffer = kotoBuf(freq, 0.55);
    if (bend) { s.playbackRate.setValueAtTime(1, t + 0.18); s.playbackRate.linearRampToValueAtTime(bend, t + 0.45); }
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
    const g = ac.createGain(); g.gain.value = peak;
    s.connect(lp); lp.connect(g); g.connect(bus || sfxBus);
    if (wet) { const w = ac.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); }
    s.start(t); s.stop(t + 3.2);
  }
  // 尺八：息のまじった笛
  function shaku(t, freq, dur, peak, bus) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2.003;
    const vib = ac.createOscillator(); vib.frequency.value = 5.2; const vg = ac.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(freq * 0.012, t + dur * 0.8); vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const g2 = ac.createGain(); g2.gain.value = 0.12;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = freq * 3.2;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.18); g.gain.setValueAtTime(peak, t + Math.max(0.2, dur - 0.35)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(bus || sfxBus);
    const wv = ac.createGain(); wv.gain.value = 0.5; g.connect(wv); wv.connect(verb);
    // 息
    const nb = noise(t, dur, 'bandpass', freq * 1.5, 2.5, peak * 0.35, bus || sfxBus, 0.08);
    o.start(t); o2.start(t); vib.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  }
  function taiko(t, peak, bus) {
    tone(t, 'sine', 140, 0.5, peak, bus, 48);
    noise(t, 0.18, 'lowpass', 260, 1, peak * 0.6, bus);
    const w = ac.createGain(); w.gain.value = 0.3;
  }
  function hyoshigi(t, peak, bus) {
    for (const dt of [0, 0.11]) { noise(t + dt, 0.06, 'bandpass', 2600, 12, peak, bus); tone(t + dt, 'sine', 1900, 0.06, peak * 0.4, bus); }
  }
  function bell(t, f, peak, dur, bus) {
    const parts = [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.93, 0.12]];
    for (const [m, a] of parts) { const g = tone(t, 'sine', f * m, dur * (1.2 - m * 0.08), peak * a, bus, null, 0.002); }
    const w = ac.createGain(); w.gain.value = 0.4;
  }
  // ---- 効果音 ----
  const Sfx = {};
  const ok = () => ac && st.on;
  const S = (name, fn) => { Sfx[name] = (...a) => { if (!ok()) return; try { fn(T0(), ...a); } catch (e) { reportError(e); } }; };
  S('stroke', (t, len) => { noise(t, 0.08 + (len || 0.1), 'bandpass', 1500, 1.4, 0.12, sfxBus, 0.01, 700); });
  S('write', (t, n) => { for (let i = 0; i < Math.min(n, 12); i++) noise(t + i * 0.075, 0.07, 'bandpass', 1700 - i * 40, 1.6, 0.09, sfxBus, 0.006, 800); });
  S('combine', t => { hyoshigi(t, 0.35); koto(t + 0.22, 587.3, 0.35, sfxBus, 0.4); koto(t + 0.34, 880, 0.3, sfxBus, 0.4); });
  S('restore', t => { const sc = [587.3, 659.3, 784, 880, 987.8, 1174.7]; sc.forEach((f, i) => koto(t + i * 0.07, f, 0.28, sfxBus, 0.5)); bell(t + 0.45, 1568, 0.08, 2.5); });
  S('chime', t => { koto(t, 784, 0.3, sfxBus, 0.4); koto(t + 0.12, 987.8, 0.25, sfxBus, 0.4); });
  S('stamp', t => { tone(t, 'sine', 220, 0.12, 0.3, sfxBus, 110); noise(t, 0.05, 'lowpass', 900, 1, 0.2); });
  S('drop', t => { tone(t, 'sine', 700, 0.18, 0.35, sfxBus, 1400); koto(t + 0.12, 1174.7, 0.3, sfxBus, 0.6); });
  S('thud', (t, a) => { tone(t, 'sine', 95, 0.25, 0.4 * (a || 0.6), sfxBus, 40); noise(t, 0.12, 'lowpass', 400, 1, 0.25 * (a || 0.6)); });
  S('hiss', (t, a) => { noise(t, 0.6, 'highpass', 3500, 0.7, 0.12 * (a || 0.5), sfxBus, 0.02); });
  S('ignite', t => { noise(t, 0.35, 'highpass', 1800, 0.8, 0.22, sfxBus, 0.01); for (let i = 0; i < 6; i++) noise(t + 0.05 + Math.random() * 0.4, 0.015, 'bandpass', 3000 + Math.random() * 2000, 4, 0.18); });
  S('crack', t => { noise(t, 0.18, 'bandpass', 1400, 2, 0.4); for (let i = 0; i < 4; i++) noise(t + i * 0.04, 0.03, 'highpass', 2500, 1, 0.25); });
  S('thunder', t => { noise(t, 0.08, 'highpass', 800, 0.5, 0.6); noise(t + 0.05, 2.6, 'lowpass', 160, 0.8, 0.7, sfxBus, 0.05); });
  S('bell', (t, a) => { bell(t, 1850 + Math.random() * 120, 0.12 * (a || 0.5), 1.6); });
  S('bigBell', t => { bell(t, 98, 0.45, 7); bell(t, 196.5, 0.15, 6); const w = ac.createGain(); w.gain.value = 0; });
  S('munch', t => { for (let i = 0; i < 3; i++) noise(t + i * 0.09, 0.05, 'bandpass', 900, 2, 0.25); });
  S('bark', t => { for (const dt of [0, 0.16]) { const g = tone(t + dt, 'sawtooth', 420, 0.1, 0.15, sfxBus, 300); } });
  S('oni', t => { tone(t, 'sawtooth', 90, 0.6, 0.18, sfxBus, 70); noise(t, 0.5, 'bandpass', 300, 2, 0.12); });
  S('hop', t => { tone(t, 'sine', 330, 0.12, 0.18, sfxBus, 660); });
  S('wind', (t, a) => { noise(t, 1.2 * (a || 1), 'bandpass', 450, 1.2, 0.18 * (a || 1), sfxBus, 0.2, 900); });
  S('splash', (t, a) => { noise(t, 0.35, 'lowpass', 1300, 1, 0.32 * (a || 0.6)); for (let i = 0; i < 3; i++) tone(t + Math.random() * 0.15, 'sine', 400 + Math.random() * 300, 0.08, 0.1 * (a || 0.6), sfxBus, 900); });
  S('rain', (t, dur) => { noise(t, dur || 8, 'highpass', 2500, 0.5, 0.08, sfxBus, 0.8); });
  S('step', t => { noise(t, 0.025, 'bandpass', 700 + Math.random() * 300, 3, 0.05); });
  S('climb', t => { noise(t, 0.03, 'bandpass', 1100, 3, 0.05); });
  S('push', t => { noise(t, 0.15, 'bandpass', 320, 1.5, 0.15); });
  S('slash', t => { noise(t, 0.15, 'highpass', 5000, 0.7, 0.3, sfxBus, 0.002, 1500); });
  S('freeze', t => { for (let i = 0; i < 5; i++) tone(t + i * 0.04, 'sine', 2400 + i * 300, 0.3, 0.06, sfxBus); });
  S('grow', t => { koto(t, 587.3, 0.22, sfxBus, 0.4); koto(t + 0.1, 784, 0.22, sfxBus, 0.4); });
  S('wither', t => { koto(t, 523.3, 0.2, sfxBus, 0.4); koto(t + 0.15, 392, 0.2, sfxBus, 0.4, 0.94); });
  S('lull', t => { shaku(t, 523.3, 0.6, 0.12); shaku(t + 0.55, 440, 0.9, 0.1); });
  S('laugh', t => { for (let i = 0; i < 4; i++) tone(t + i * 0.1, 'triangle', 500 + (i % 2) * 120, 0.08, 0.12, sfxBus); });
  S('angry', t => { tone(t, 'sawtooth', 140, 0.4, 0.16, sfxBus, 110); });
  S('call', t => { shaku(t, 698.5, 0.5, 0.14); });
  S('cry', t => { bell(t, 880, 0.18, 1.2); });
  S('door', t => { tone(t, 'sawtooth', 160, 0.35, 0.08, sfxBus, 120); noise(t, 0.2, 'bandpass', 500, 3, 0.12); });
  S('dig', t => { for (let i = 0; i < 3; i++) noise(t + i * 0.08, 0.07, 'lowpass', 700, 1, 0.22); });
  S('sand', t => { noise(t, 0.6, 'highpass', 2000, 0.5, 0.1, sfxBus, 0.05); });
  S('timber', t => { tone(t, 'sawtooth', 110, 0.5, 0.08, sfxBus, 70); noise(t + 0.45, 0.25, 'lowpass', 300, 1, 0.45); });
  S('crumble', t => { for (let i = 0; i < 5; i++) noise(t + i * 0.06, 0.06, 'lowpass', 600 - i * 60, 1, 0.18); });
  S('bleed', t => { koto(t, 293.7, 0.3, sfxBus, 0.6, 0.92); noise(t, 0.5, 'lowpass', 500, 1, 0.12, sfxBus, 0.05); });
  S('boom', t => { tone(t, 'sine', 80, 0.5, 0.3, sfxBus, 40); for (let i = 0; i < 8; i++) noise(t + 0.1 + Math.random() * 0.5, 0.02, 'highpass', 3000, 1, 0.1); });
  S('fireworks', t => { tone(t, 'sine', 400, 0.8, 0.05, sfxBus, 1600); });
  S('bow', t => { noise(t, 0.04, 'bandpass', 1800, 6, 0.15); });
  S('poof', t => { noise(t, 0.25, 'bandpass', 900, 1, 0.22, sfxBus, 0.005, 3000); });
  S('stop', t => { tone(t, 'sine', 2093, 0.6, 0.12, sfxBus); tone(t, 'sine', 1046.5, 0.8, 0.08, sfxBus); });
  S('drum', (t, dly) => { const tt = t + (dly || 0); taiko(tt, 0.5); taiko(tt + 0.28, 0.35); taiko(tt + 0.42, 0.45); });
  S('ink', t => { tone(t, 'sine', 900, 0.1, 0.12, sfxBus, 500); });
  S('nope', t => { tone(t, 'sine', 300, 0.12, 0.12, sfxBus, 220); });
  S('tap', t => { hyoshigi(t, 0.12); });
  S('page', t => { noise(t, 0.25, 'bandpass', 2400, 0.8, 0.1, sfxBus, 0.02, 1200); });
  S('learn', t => { koto(t, 880, 0.26, sfxBus, 0.5); koto(t + 0.09, 1174.7, 0.22, sfxBus, 0.5); });

  // ---- 曲（その場で作る）----
  const SCALES = {
    yo: [0, 2, 5, 7, 9], in: [0, 1, 5, 7, 8], ritsu: [0, 2, 5, 7, 10], minyo: [0, 3, 5, 7, 10], ryukyu: [0, 4, 5, 7, 11],
  };
  const MOODS = {
    blank: { scale: 'yo', root: 62, tempo: 54, density: 0.25, drone: true, flute: 0.05, taiko: 0 },
    field: { scale: 'yo', root: 62, tempo: 72, density: 0.55, drone: true, flute: 0.15, taiko: 0 },
    river: { scale: 'ritsu', root: 64, tempo: 80, density: 0.65, drone: true, flute: 0.1, taiko: 0 },
    mountain: { scale: 'minyo', root: 57, tempo: 60, density: 0.4, drone: true, flute: 0.35, taiko: 0 },
    village: { scale: 'yo', root: 62, tempo: 96, density: 0.7, drone: false, flute: 0.2, taiko: 0.6 },
    night: { scale: 'in', root: 57, tempo: 56, density: 0.35, drone: true, flute: 0.3, taiko: 0 },
    sky: { scale: 'ritsu', root: 69, tempo: 66, density: 0.45, drone: true, flute: 0.2, taiko: 0 },
    end: { scale: 'yo', root: 60, tempo: 50, density: 0.3, drone: true, flute: 0.4, taiko: 0 },
    title: { scale: 'yo', root: 62, tempo: 58, density: 0.35, drone: true, flute: 0.12, taiko: 0 },
  };
  const mid = n => 440 * Math.pow(2, (n - 69) / 12);
  const M = { mood: null, base: null, timer: null, nextT: 0, beat: 0, deg: 2, phrase: [] };
  function noteOf(mood, deg, oct) {
    const sc = SCALES[mood.scale]; const n = sc.length;
    const o = Math.floor(deg / n), r = ((deg % n) + n) % n;
    return mid(mood.root + 12 * (o + (oct || 0)) + sc[r]);
  }
  function schedule() {
    if (!ac || !M.mood) return;
    const mood = MOODS[M.mood] || MOODS.field;
    const spb = 60 / mood.tempo / 2;          // 八分
    while (M.nextT < ac.currentTime + 0.4) {
      const t = M.nextT, b = M.beat;
      // 低い弦
      if (mood.drone && b % 16 === 0) { koto(t, noteOf(mood, 0, -1), 0.22, musicBus, 0.6); if (chance(0.5)) koto(t + spb * 3, noteOf(mood, 4, -1), 0.14, musicBus, 0.6); }
      // 琴の流れ
      if (chance(mood.density * (b % 2 === 0 ? 0.9 : 0.4))) {
        M.deg = clamp(M.deg + rpick([-2, -1, -1, 1, 1, 2, 0, 3, -3]), 0, 11);
        koto(t, noteOf(mood, M.deg, 0), 0.16 + Math.random() * 0.08, musicBus, 0.45, chance(0.06) ? 1.06 : 0);
        if (chance(0.15)) koto(t + spb * 0.5, noteOf(mood, M.deg + 2, 0), 0.1, musicBus, 0.45);
      }
      // 尺八のひとふし
      if (b % 32 === 8 && chance(mood.flute)) {
        let d = rpick([5, 7, 4]); let tt = t;
        const n = 2 + rndi(3);
        for (let i = 0; i < n; i++) { const dur = spb * rpick([3, 4, 6]); shaku(tt, noteOf(mood, d, 0) * (mood.root > 65 ? 1 : 2), dur, 0.07, musicBus); tt += dur; d += rpick([-1, 1, -2]); }
      }
      // 太鼓・拍子木（里）
      if (mood.taiko) {
        if (b % 8 === 0) taiko(t, 0.18 * mood.taiko, musicBus);
        if (b % 8 === 6 && chance(0.5)) taiko(t, 0.1 * mood.taiko, musicBus);
        if (b % 16 === 12 && chance(0.4)) hyoshigi(t, 0.07, musicBus);
      }
      M.beat++; M.nextT += spb * (1 + (chance(0.1) ? 0.15 : 0));
    }
  }
  // 「ひとしずく」のふし（陽音階・二まわり目は尺八が重なる）。[度, 拍]
  const THEME = [
    [4, 1], [5, 1], [4, 1], [2, 1], [3, 2], [2, 2],
    [4, 1], [5, 1], [7, 1], [5, 1], [4, 2], [null, 2],
    [5, 1], [7, 1], [8, 1], [7, 1], [5, 1], [4, 1], [5, 2],
    [4, 1], [3, 1], [2, 1], [1, 1], [2, 2], [null, 2],
    [2, 1], [3, 1], [4, 2], [3, 1], [2, 1], [1, 2],
    [0, 1], [1, 1], [2, 1], [3, 1], [2, 2], [1, 2],
    [4, 1.5], [3, 0.5], [2, 1], [3, 1], [4, 2], [5, 2],
    [4, 1], [2, 1], [1, 1], [2, 1], [0, 4],
  ];
  const THEME_BASS = [0, 2, 0, 3, 2, 0, 3, 0, 2, 3, 0, 0, 3, 2, 0, 0];
  let themeBus = null;
  const Music = {
    themeUntil: 0,
    theme() {
      if (!ac) return 0;
      this.stopTheme(true);
      M.mood = null;
      themeBus = ac.createGain(); themeBus.gain.value = 1; themeBus.connect(musicBus);
      const mood = { scale: 'yo', root: 62 }, spb = 60 / 64;
      let t = ac.currentTime + 0.5; const t0 = t;
      for (let pass = 0; pass < 2; pass++) {
        const ps = t;
        for (const [d, b] of THEME) {
          if (d != null) {
            koto(t, noteOf(mood, d, 0), pass ? 0.17 : 0.24, themeBus, 0.55);
            if (pass) shaku(t, noteOf(mood, d, 0), Math.max(0.3, b * spb * 0.96), 0.075, themeBus);
          }
          t += b * spb;
        }
        THEME_BASS.forEach((d, bar) => { const tb = ps + bar * 4 * spb; koto(tb, noteOf(mood, d, -1), 0.2, themeBus, 0.7); koto(tb + 2 * spb, noteOf(mood, d + 3, -1), 0.09, themeBus, 0.7); });
      }
      koto(t, noteOf(mood, 0, -1), 0.22, themeBus, 0.8); koto(t + 0.05, noteOf(mood, 5, -1), 0.14, themeBus, 0.8); koto(t + 0.1, noteOf(mood, 0, 0), 0.12, themeBus, 0.8);
      this.themeUntil = t + 3;
      return t - t0;
    },
    stopTheme(now) {
      this.themeUntil = 0;
      if (!themeBus || !ac) return;
      const g = themeBus; themeBus = null;
      try { g.gain.setValueAtTime(g.gain.value, ac.currentTime); g.gain.linearRampToValueAtTime(0, ac.currentTime + (now ? 0.05 : 1.2)); setTimeout(() => { try { g.disconnect(); } catch (e) { } }, now ? 100 : 1400); } catch (e) { }
    },
    play(mood) {
      M.base = mood;
      if (ac && this.themeUntil > ac.currentTime) return;
      if (M.mood === mood) return; M.mood = mood;
      if (!ac) return;
      M.nextT = Math.max(M.nextT, ac.currentTime + 0.1);
      if (!M.timer) M.timer = setInterval(() => { try { schedule(); } catch (e) { reportError(e); } }, 120);
    },
    mood(m) { if (ac && this.themeUntil > ac.currentTime) return; const to = m || M.base; if (to && to !== M.mood) { M.mood = to; } },
    stop() { M.mood = null; },
    motif(kind) {
      if (!ok()) return;
      const t = T0(), mood = MOODS[M.mood] || MOODS.field;
      if (kind === 'flute') { [4, 5, 7, 5, 4, 2].forEach((d, i) => shaku(t + i * 0.32, noteOf(mood, d, 1), 0.45, 0.12)); }
      else if (kind === 'festival') { for (let i = 0; i < 8; i++) { taiko(t + i * 0.25, i % 4 === 0 ? 0.4 : 0.2); } hyoshigi(t + 1.9, 0.25); [0, 2, 4, 2, 4, 5, 4].forEach((d, i) => koto(t + i * 0.25, noteOf(mood, d, 1), 0.25, sfxBus, 0.3)); }
      else if (kind === 'song') { [2, 4, 5, 4, 2, 1, 2].forEach((d, i) => koto(t + i * 0.3, noteOf(mood, d, 1), 0.25, sfxBus, 0.4)); }
      else if (kind === 'chapter') { [0, 2, 4, 5, 7].forEach((d, i) => koto(t + i * 0.16, noteOf(mood, d, 0), 0.3, sfxBus, 0.5)); }
      else if (kind === 'end') { [7, 5, 4, 2, 4, 5, 7, 9].forEach((d, i) => koto(t + i * 0.4, noteOf(mood, d, 0), 0.28, sfxBus, 0.6)); }
    },
  };
  function setVol(kind, v) { st[kind] = v; if (!ac) return; if (kind === 'music') musicBus.gain.value = v * 0.5; if (kind === 'sfx') sfxBus.gain.value = v * 0.7; }
  return { init, Sfx, Music, setVol, st, get ready() { return !!ac; } };
})();
const Sfx = AudioSys.Sfx;
const Music = AudioSys.Music;

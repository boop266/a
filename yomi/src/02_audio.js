// 黄泉還：音（ぜんぶその場で鳴らす。録音はひとつも使わない）
const AU = {
  ac: null, out: null, sfxG: null, bgmG: null, ambG: null, rev: null, revG: null, nb: null, on: false,
  lis: { x: 0, z: 0, cx: 0, cz: 0, rx: 1, rz: 0 }, // 聞く人（主人公）と、カメラの右向き
  amb: {}, ambT: {}, ambN: {}, mus: null, musName: '', musT: 0,
  wake() {
    if (TEST) return;
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      const ac = this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.out = ac.createDynamicsCompressor(); this.out.threshold.value = -14; this.out.ratio.value = 4; this.out.connect(ac.destination);
      this.sfxG = ac.createGain(); this.bgmG = ac.createGain(); this.ambG = ac.createGain();
      [this.sfxG, this.bgmG, this.ambG].forEach(g => g.connect(this.out));
      this.rev = ac.createConvolver(); this.revG = ac.createGain(); this.revG.gain.value = 0.25; this.rev.connect(this.revG); this.revG.connect(this.out);
      const len = ac.sampleRate * 2.6, ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 200 ? i / 200 : 1); }
      this.rev.buffer = ir;
      const n = ac.sampleRate * 2; this.nb = ac.createBuffer(1, n, ac.sampleRate); const d = this.nb.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.vol(); this.on = true; this.startAmb(); if (this.musName) { const m = this.musName; this.musName = ''; this.music(m); }
    } catch (e) { this.ac = null; }
  },
  vol() { if (!this.ac) return; this.sfxG.gain.value = OPT.sfx; this.ambG.gain.value = OPT.sfx * 0.9; this.bgmG.gain.value = OPT.bgm * 0.55; },
  room(rev) { if (this.revG) this.revG.gain.setTargetAtTime(rev, this.ac.currentTime, 0.3); },
  // ── 部品 ──
  env(g, t, a, peak, d, sus = 0) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + d); },
  dest(o = {}) { // 位置があれば左右に振り、遠いほど小さく。残響へも少し送る
    const ac = this.ac, g = ac.createGain(); let v = o.vol != null ? o.vol : 1;
    let node = g;
    if (o.x != null) {
      const L = this.lis, d = hyp(o.x - L.x, o.z - L.z); v *= 1 / (1 + d * 0.22);
      const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
      if (pan) { const px = (o.x - L.cx) * L.rx + (o.z - L.cz) * L.rz; pan.pan.value = clamp(px / 6, -0.85, 0.85); g.connect(pan); node = pan; }
    }
    g.gain.value = v; node.connect(o.bus || this.sfxG);
    if (o.rev !== 0) { const s = ac.createGain(); s.gain.value = o.rev != null ? o.rev : 0.5; node.connect(s); s.connect(this.rev); }
    return g;
  },
  osc(type, f0, f1, t, dur, peak, dst, a = 0.005) { const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); this.env(g, t, a, peak, dur); o.connect(g); g.connect(dst); o.start(t); o.stop(t + a + dur + 0.05); return o; },
  noise(t, dur, peak, dst, type = 'lowpass', f0 = 2000, f1 = f0, q = 0.7, a = 0.003) { const ac = this.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = this.nb; s.loop = true; s.playbackRate.value = 0.8 + Math.random() * 0.4; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); this.env(g, t, a, peak, dur); s.connect(f); f.connect(g); g.connect(dst); s.start(t, Math.random() * 1.5); s.stop(t + a + dur + 0.05); return s; },
  // 声（うめき・叫び）：のこぎり波を2つの山（ホルマント）で絞る
  voice(t, dur, f0, f1, peak, dst, form = [500, 1100], rough = 0.3) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f1, t + dur);
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5 + Math.random() * 4; lg.gain.value = f0 * 0.04; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.1);
    const mix = ac.createGain(); for (const f of form) { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = 6; o.connect(b); b.connect(mix); }
    this.env(g, t, Math.min(0.12, dur * 0.3), peak, dur); mix.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + 0.2);
    if (rough) this.noise(t, dur, peak * rough, dst, 'bandpass', form[0], form[0] * 0.8, 3, 0.05);
  },
  // ── 効果音 ──
  sfx(name, o = {}) {
    if (!this.on || TEST) return; const ac = this.ac, t = ac.currentTime + (o.delay || 0), d = this.dest(o), R = Math.random;
    switch (name) {
      case 'step': { const k = o.mat || 'wood'; const p = { wood: [900, 0.22, 'lowpass', 180], marble: [3000, 0.18, 'bandpass', 2200], carpet: [500, 0.12, 'lowpass', 120], stone: [1500, 0.2, 'bandpass', 900], metal: [2500, 0.2, 'bandpass', 1800], tile: [3500, 0.16, 'bandpass', 2800], grass: [2500, 0.1, 'highpass', 1500], water: [1200, 0.25, 'bandpass', 700], concrete: [1800, 0.18, 'bandpass', 1100] }[k] || [900, 0.2, 'lowpass', 200];
        this.noise(t, 0.06 + R() * 0.03, p[1] * (o.v || 1), d, p[2], p[0] * (0.85 + R() * 0.3), p[3], 1.2);
        if (k === 'wood') this.osc('sine', 120 + R() * 30, 80, t, 0.06, 0.12 * (o.v || 1), d);
        if (k === 'metal') this.osc('triangle', 600 + R() * 200, 500, t, 0.08, 0.04, d);
        if (k === 'water') this.noise(t + 0.03, 0.12, 0.08, d, 'bandpass', 900, 400, 2);
        break; }
      case 'door': { this.noise(t, 0.12, 0.25, d, 'lowpass', 400, 100); const o1 = this.osc('sawtooth', 180, 120, t + 0.25, 0.9, 0.05, d, 0.2); const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 900; this.osc('sawtooth', 340 + R() * 60, 260, t + 0.3, 0.8, 0.035, d, 0.15); this.noise(t + 1.0, 0.3, 0.06, d, 'bandpass', 800, 500, 4, 0.1); break; }
      case 'doorshut': this.noise(t, 0.25, 0.5, d, 'lowpass', 300, 60); this.osc('sine', 70, 40, t, 0.25, 0.4, d); break;
      case 'locked': for (let i = 0; i < 3; i++) { this.noise(t + i * 0.09, 0.05, 0.25, d, 'bandpass', 1800, 1200, 3); this.osc('square', 300, 280, t + i * 0.09, 0.03, 0.04, d); } break;
      case 'unlock': this.noise(t, 0.04, 0.3, d, 'bandpass', 2500, 2000, 4); this.osc('triangle', 900, 700, t + 0.08, 0.1, 0.15, d); this.noise(t + 0.15, 0.06, 0.3, d, 'bandpass', 1500, 900, 3); break;
      case 'stairs': for (let i = 0; i < 6; i++) this.noise(t + i * 0.28, 0.07, 0.18, d, 'lowpass', 700, 200, 1); break;
      case 'elev': this.osc('sawtooth', 55, 60, t, 2.2, 0.06, d, 0.4); this.noise(t, 2.2, 0.05, d, 'lowpass', 300, 300, 1, 0.4); this.noise(t + 2.1, 0.2, 0.4, d, 'lowpass', 600, 100); break;
      case 'hg': this.noise(t, 0.09, 0.9, d, 'highpass', 900, 500, 0.7, 0.001); this.osc('sine', 160, 50, t, 0.12, 0.8, d, 0.001); this.noise(t + 0.02, 0.3, 0.15, d, 'lowpass', 1500, 200); break;
      case 'sg': this.noise(t, 0.2, 1.0, d, 'lowpass', 3000, 200, 0.7, 0.001); this.osc('sine', 120, 35, t, 0.25, 1, d, 0.001); this.noise(t + 0.45, 0.06, 0.2, d, 'bandpass', 1500, 1000, 3); this.noise(t + 0.6, 0.06, 0.2, d, 'bandpass', 1200, 900, 3); break;
      case 'mg': this.noise(t, 0.3, 1.2, d, 'lowpass', 5000, 150, 0.7, 0.001); this.osc('sine', 90, 30, t, 0.4, 1.2, d, 0.001); break;
      case 'gl': this.osc('sine', 200, 60, t, 0.15, 0.6, d, 0.001); this.noise(t, 0.1, 0.4, d, 'lowpass', 800, 200); break;
      case 'boom': this.noise(t, 1.4, 1.2, d, 'lowpass', 1800, 50, 0.7, 0.002); this.osc('sine', 70, 25, t, 1.0, 1.2, d, 0.002); break;
      case 'knife': this.noise(t, 0.14, 0.35, d, 'bandpass', 2500, 5000, 2); break;
      case 'empty': this.noise(t, 0.02, 0.4, d, 'highpass', 4000, 4000, 1); this.osc('square', 1800, 1700, t, 0.02, 0.05, d); break;
      case 'reload': this.noise(t, 0.04, 0.4, d, 'bandpass', 2200, 1800, 3); this.noise(t + 0.35, 0.05, 0.5, d, 'bandpass', 1600, 1200, 3); this.osc('triangle', 1200, 1000, t + 0.36, 0.05, 0.08, d); break;
      case 'shell': this.osc('triangle', 3000 + R() * 800, 2500, t + 0.25, 0.08, 0.06, d); this.osc('triangle', 2800, 2400, t + 0.38, 0.05, 0.03, d); break;
      case 'flesh': this.noise(t, 0.12, 0.55, d, 'lowpass', 900, 200, 1); this.osc('sine', 110, 60, t, 0.1, 0.25, d); break;
      case 'splat': this.noise(t, 0.3, 0.6, d, 'lowpass', 1200, 150, 1); break;
      case 'groan': this.voice(t, 0.9 + R() * 1.2, 85 + R() * 50, 70 + R() * 30, 0.35 * (o.v || 1), d, [380 + R() * 150, 900 + R() * 300], 0.35); break;
      case 'moan2': this.voice(t, 1.6, 110, 70, 0.4, d, [450, 1000], 0.5); break;
      case 'bite': this.noise(t, 0.08, 0.7, d, 'bandpass', 1400, 600, 2); this.noise(t + 0.12, 0.25, 0.6, d, 'lowpass', 800, 150); this.voice(t + 0.05, 0.5, 200, 150, 0.3, d, [700, 1400], 0.4); break;
      case 'bark': this.voice(t, 0.16, 420, 280, 0.6, d, [900, 2000], 0.6); this.voice(t + 0.22, 0.14, 400, 260, 0.5, d, [900, 2000], 0.6); break;
      case 'growl': this.voice(t, 1.0, 70, 60, 0.45, d, [300, 700], 0.9); break;
      case 'yelp': this.voice(t, 0.4, 700, 300, 0.5, d, [1200, 2400], 0.3); break;
      case 'hiss': this.noise(t, 0.7, 0.5, d, 'highpass', 3000, 5000, 1, 0.05); break;
      case 'spit': this.noise(t, 0.15, 0.5, d, 'bandpass', 800, 1500, 2); break;
      case 'skitter': for (let i = 0; i < 6; i++) this.noise(t + i * 0.05, 0.02, 0.15, d, 'highpass', 4000, 4000, 1); break;
      case 'screech': this.voice(t, 0.6, 900, 600, 0.6, d, [1500, 3200], 0.6); break;
      case 'roar': this.voice(t, 1.8, 70, 45, 0.9, d, [300, 650], 0.8); this.osc('sawtooth', 50, 35, t, 1.8, 0.25, d, 0.1); break;
      case 'grunt': this.voice(t, 0.5, 90, 70, 0.5, d, [350, 800], 0.5); break;
      case 'swing': this.noise(t, 0.3, 0.4, d, 'bandpass', 600, 2400, 2); break;
      case 'hurt': this.voice(t, 0.28, 220 + R() * 30, 160, 0.45, d, [700, 1300], 0.2); break;
      case 'die': this.voice(t, 1.4, 230, 90, 0.5, d, [700, 1200], 0.3); break;
      case 'glass': this.noise(t, 0.4, 1.0, d, 'highpass', 2500, 1500, 0.7, 0.001); for (let i = 0; i < 9; i++) this.osc('sine', 2500 + R() * 4000, 2000, t + 0.05 + R() * 0.5, 0.1, 0.08, d); break;
      case 'thunder': this.noise(t, 4 + R() * 2, 0.9 * (o.v || 1), d, 'lowpass', 300, 40, 0.7, 0.05 + R() * 0.3); this.noise(t, 0.6, 0.5 * (o.v || 1), d, 'lowpass', 1200, 150, 0.7, 0.01); break;
      case 'pick': this.osc('triangle', 880, 880, t, 0.08, 0.12, d); this.osc('triangle', 1320, 1320, t + 0.08, 0.16, 0.12, d); break;
      case 'tick': this.osc('square', 1400, 1400, t, 0.015, 0.04, d); break;
      case 'ok': this.osc('triangle', 660, 660, t, 0.05, 0.08, d); this.osc('triangle', 990, 990, t + 0.05, 0.08, 0.08, d); break;
      case 'cancel': this.osc('triangle', 500, 350, t, 0.1, 0.08, d); break;
      case 'type': for (let i = 0; i < 9; i++) this.noise(t + i * 0.09 + R() * 0.04, 0.025, 0.3, d, 'bandpass', 2500, 2000, 3); this.osc('triangle', 2400, 2400, t + 0.95, 0.4, 0.08, d); break;
      case 'chime': [523, 659, 784, 1047].forEach((f, i) => { this.osc('sine', f, f, t + i * 0.9, 2.5, 0.18, d, 0.01); this.osc('sine', f * 2.01, f * 2.01, t + i * 0.9, 1.2, 0.05, d, 0.01); }); break;
      case 'solve': [392, 494, 587, 784].forEach((f, i) => this.osc('triangle', f, f, t + i * 0.1, 0.6, 0.1, d)); break;
      case 'slide': this.noise(t, 1.4, 0.5, d, 'lowpass', 400, 200, 1, 0.1); this.osc('sawtooth', 50, 45, t, 1.4, 0.05, d, 0.2); break;
      case 'valve': this.osc('sawtooth', 300, 500, t, 0.5, 0.06, d, 0.05); this.noise(t + 0.4, 1.4, 0.4, d, 'highpass', 3000, 800, 0.7, 0.05); break;
      case 'switch': this.noise(t, 0.03, 0.5, d, 'bandpass', 2000, 2000, 3); this.osc('square', 200, 180, t, 0.04, 0.05, d); break;
      case 'clock1': this.osc('sine', 392, 392, t, 3, 0.25, d, 0.01); this.osc('sine', 784.5, 784.5, t, 1.4, 0.06, d, 0.01); break;
      case 'crash': this.noise(t, 0.5, 0.8, d, 'lowpass', 2500, 300, 0.7, 0.002); this.osc('sine', 90, 40, t, 0.3, 0.6, d); break;
      case 'shock': this.osc('sawtooth', 110, 104, t, 1.4, 0.28, this.bgmG, 0.01); this.osc('sawtooth', 156, 149, t, 1.4, 0.22, this.bgmG, 0.01); this.osc('sawtooth', 233, 220, t, 1.4, 0.18, this.bgmG, 0.01); this.noise(t, 1.0, 0.3, this.bgmG, 'highpass', 2000, 6000, 1, 0.3); break;
      case 'heart': this.osc('sine', 60, 45, t, 0.12, 0.5, d); this.osc('sine', 55, 40, t + 0.2, 0.12, 0.35, d); break;
      case 'beep': this.osc('square', 1000, 1000, t, 0.08, 0.08, d); break;
      case 'alarm': this.osc('square', 700, 900, t, 0.45, 0.08, d, 0.02); this.osc('square', 900, 700, t + 0.5, 0.45, 0.08, d, 0.02); break;
      case 'heli': for (let i = 0; i < 24; i++) this.noise(t + i * 0.085, 0.06, 0.3, d, 'lowpass', 400, 150, 1); break;
      case 'musicbox': [784, 659, 698, 587, 659, 523, 587, 392].forEach((f, i) => { this.osc('sine', f * 2, f * 2, t + i * 0.42, 1.0, 0.07, d, 0.003); this.osc('sine', f * 4.02, f * 4.02, t + i * 0.42, 0.4, 0.02, d, 0.003); }); break;
      case 'drip': this.osc('sine', 1400 + R() * 600, 700, t, 0.12, 0.06, d); break;
      case 'creak': this.osc('sawtooth', 120 + R() * 50, 90, t, 0.7, 0.04, d, 0.1); break;
      case 'steam': this.noise(t, 2.0, 0.4, d, 'highpass', 2500, 2500, 0.7, 0.1); break;
      case 'fire': this.osc('sine', 150, 40, t, 0.4, 0.5, d); this.noise(t, 0.6, 0.6, d, 'lowpass', 1500, 200); break;
    }
  },
  // ── 環境音（雨・風・時計・唸り…）。部屋ごとに目標の強さを渡すと、ゆっくり切り替わる ──
  setAmb(o) { this.ambT = Object.assign({ rain: 0, wind: 0, hum: 0, buzz: 0, boiler: 0, water: 0, fire: 0, clock: 0, drone: 0.3, alarm: 0, rainOut: 0 }, o || {}); },
  startAmb() {
    const ac = this.ac; if (!ac) return;
    const mk = (name, build) => { const g = ac.createGain(); g.gain.value = 0; g.connect(this.ambG); build(g); this.ambN[name] = g; };
    const loopNoise = (g, type, f, q, rate = 1) => { const s = ac.createBufferSource(); s.buffer = this.nb; s.loop = true; s.playbackRate.value = rate; const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; s.connect(b); b.connect(g); s.start(); return b; };
    mk('rain', g => { loopNoise(g, 'bandpass', 1800, 0.4); loopNoise(g, 'lowpass', 500, 0.5, 0.7); });
    mk('rainOut', g => { loopNoise(g, 'highpass', 2500, 0.5); loopNoise(g, 'bandpass', 900, 0.6); });
    mk('wind', g => { const b = loopNoise(g, 'bandpass', 400, 2, 0.5); const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 0.13; lg.gain.value = 250; l.connect(lg); lg.connect(b.frequency); l.start(); });
    mk('hum', g => { for (const f of [60, 120, 180]) { const o = ac.createOscillator(); o.frequency.value = f; const og = ac.createGain(); og.gain.value = 0.25 / (f / 60); o.connect(og); og.connect(g); o.start(); } });
    mk('buzz', g => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 120; const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 2400; b.Q.value = 3; o.connect(b); b.connect(g); o.start(); });
    mk('boiler', g => { loopNoise(g, 'lowpass', 120, 1, 0.4); const o = ac.createOscillator(); o.frequency.value = 41; const og = ac.createGain(); og.gain.value = 0.5; o.connect(og); og.connect(g); o.start(); });
    mk('water', g => { loopNoise(g, 'bandpass', 600, 1.5, 0.6); });
    mk('fire', g => { loopNoise(g, 'lowpass', 700, 0.8, 0.5); });
    mk('drone', g => { for (const f of [55, 58.3, 82.4]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const b = ac.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = 180; const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 0.05 + Math.random() * 0.05; lg.gain.value = 80; l.connect(lg); lg.connect(b.frequency); l.start(); const og = ac.createGain(); og.gain.value = 0.18; o.connect(b); b.connect(og); og.connect(g); o.start(); } });
    mk('alarm', g => { const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 760; const l = ac.createOscillator(), lg = ac.createGain(); l.type = 'square'; l.frequency.value = 1.2; lg.gain.value = 140; l.connect(lg); lg.connect(o.frequency); l.start(); const b = ac.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = 1800; const og = ac.createGain(); og.gain.value = 0.08; o.connect(b); b.connect(og); og.connect(g); o.start(); });
    this.ambN.clock = { gain: { value: 0 } }; // 時計は刻みで鳴らす
  },
  ambTick(dt, t) {
    if (!this.on) return; const ac = this.ac, now = ac.currentTime;
    const lv = { rain: 0.18, rainOut: 0.5, wind: 0.25, hum: 0.05, buzz: 0.012, boiler: 0.35, water: 0.12, fire: 0.25, drone: 0.22, alarm: 1 };
    for (const k in lv) { const n = this.ambN[k]; if (!n) continue; const target = (this.ambT[k] || 0) * lv[k]; n.gain.setTargetAtTime(target, now, 0.6); }
    if (this.ambT.clock) { this.clockT = (this.clockT || 0) - dt; if (this.clockT <= 0) { this.clockT = 1; this.osc('square', this.tk ? 1800 : 1500, 1500, now, 0.02, 0.03 * this.ambT.clock, this.ambG); this.tk = !this.tk; } }
    if (this.ambT.water) { if (Math.random() < dt * 0.6) this.sfx('drip', { vol: 0.5 * this.ambT.water, rev: 0.8 }); }
  },
  // ── 音楽（小さな順番機） ──
  music(name) {
    if (name === this.musName) return; this.musName = name;
    if (!this.on) return;
    const ac = this.ac, now = ac.currentTime;
    if (this.mus) { const old = this.mus; old.g.gain.setTargetAtTime(0, now, 0.5); setTimeout(() => { try { old.g.disconnect(); } catch (e) { } }, 3000); this.mus = null; }
    const S = SONGS[name]; if (!S) return;
    const g = ac.createGain(); g.gain.value = 0; g.connect(this.bgmG); const sr = ac.createGain(); sr.gain.value = S.rev || 0.4; g.connect(sr); sr.connect(this.rev); g.gain.setTargetAtTime(S.vol || 0.7, now, 0.8);
    this.mus = { g, S, t0: now + 0.1, step: 0, next: now + 0.1 };
  },
  musTick() {
    const m = this.mus; if (!m || !this.on) return; const ac = this.ac, S = m.S, spb = 60 / S.bpm / 4; // 16分音符ひとつの長さ
    while (m.next < ac.currentTime + 0.25) {
      const st = m.step % S.len;
      for (const tr of S.tracks) { const ev = tr.at(st, m.step); if (ev) for (const e of (Array.isArray(ev[0]) ? ev : [ev])) INST[tr.inst](this, m.next, e[0], e[1] * spb, (e[2] || 1) * (tr.v || 1), m.g); }
      m.step++; m.next += spb;
      if (!S.loop && m.step >= S.len) { this.mus = null; this.musName = ''; break; }
    }
  },
};
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const INST = {
  pad(A, t, n, d, v, g) { for (const det of [-6, 0, 6]) { const o = A.ac.createOscillator(), gg = A.ac.createGain(), f = A.ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det; f.type = 'lowpass'; f.frequency.value = 900; gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(0.035 * v, t + Math.min(1.2, d * 0.4)); gg.gain.setValueAtTime(0.035 * v, t + d * 0.8); gg.gain.linearRampToValueAtTime(0.0001, t + d + 0.8); o.connect(f); f.connect(gg); gg.connect(g); o.start(t); o.stop(t + d + 1); } },
  piano(A, t, n, d, v, g) { const f = NOTE(n); A.osc('triangle', f, f, t, Math.min(2.5, d + 1.2), 0.13 * v, g, 0.004); A.osc('sine', f * 2, f * 2, t, 0.6, 0.05 * v, g, 0.003); A.osc('sine', f * 3.01, f * 3.01, t, 0.25, 0.02 * v, g, 0.002); },
  bell(A, t, n, d, v, g) { const f = NOTE(n); A.osc('sine', f, f, t, 2.5, 0.1 * v, g, 0.002); A.osc('sine', f * 2.76, f * 2.76, t, 1.2, 0.04 * v, g, 0.002); A.osc('sine', f * 5.4, f * 5.4, t, 0.5, 0.02 * v, g, 0.002); },
  bass(A, t, n, d, v, g) { const f = NOTE(n); A.osc('triangle', f, f, t, d * 0.95, 0.22 * v, g, 0.01); A.osc('sine', f / 2, f / 2, t, d * 0.9, 0.12 * v, g, 0.01); },
  str(A, t, n, d, v, g) { const o = A.ac.createOscillator(), gg = A.ac.createGain(), f = A.ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); const l = A.ac.createOscillator(), lg = A.ac.createGain(); l.frequency.value = 5.5; lg.gain.value = 4; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d + 0.5); f.type = 'lowpass'; f.frequency.value = 1600; gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(0.05 * v, t + 0.06); gg.gain.setValueAtTime(0.05 * v, t + d * 0.85); gg.gain.linearRampToValueAtTime(0.0001, t + d + 0.25); o.connect(f); f.connect(gg); gg.connect(g); o.start(t); o.stop(t + d + 0.3); },
  brass(A, t, n, d, v, g) { const o = A.ac.createOscillator(), gg = A.ac.createGain(), f = A.ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(2200, t + 0.08); f.frequency.linearRampToValueAtTime(900, t + d); gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(0.07 * v, t + 0.03); gg.gain.linearRampToValueAtTime(0.0001, t + d + 0.1); o.connect(f); f.connect(gg); gg.connect(g); o.start(t); o.stop(t + d + 0.2); },
  kick(A, t, n, d, v, g) { A.osc('sine', 120, 40, t, 0.25, 0.5 * v, g, 0.002); },
  snare(A, t, n, d, v, g) { A.noise(t, 0.15, 0.25 * v, g, 'highpass', 1500, 1500, 0.7, 0.001); A.osc('triangle', 220, 180, t, 0.08, 0.1 * v, g); },
  hat(A, t, n, d, v, g) { A.noise(t, 0.04, 0.08 * v, g, 'highpass', 7000, 7000, 0.7, 0.001); },
  choir(A, t, n, d, v, g) { const o = A.ac.createOscillator(), gg = A.ac.createGain(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); const mix = A.ac.createGain(); for (const ff of [600, 1040, 2250]) { const b = A.ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = 8; o.connect(b); b.connect(mix); } gg.gain.setValueAtTime(0.0001, t); gg.gain.linearRampToValueAtTime(0.09 * v, t + 0.8); gg.gain.setValueAtTime(0.09 * v, t + d * 0.8); gg.gain.linearRampToValueAtTime(0.0001, t + d + 1); mix.connect(gg); gg.connect(g); o.start(t); o.stop(t + d + 1.1); },
};
// 曲：16分音符単位。at(st)が [音,長さ(16分),強さ] を返す
function seq(str, base = 0) { // "60:4 62:2 - 64:2" のような並び → 位置ごとの音
  const out = {}; let pos = 0; for (const tok of str.trim().split(/\s+/)) { if (tok === '-') { pos++; continue; } const [n, l, v] = tok.split(':'); const ln = +(l || 1); if (n !== 'r') out[pos] = (n.includes('+') ? n.split('+').map(x => [+x + base, ln, v ? +v : 1]) : [[+n + base, ln, v ? +v : 1]]); pos += ln; } return st => out[st] || null;
}
function chords(list, len) { // [[音,音,音], ...] を len 16分ずつ
  return st => (st % len === 0 && list[(st / len) | 0]) ? list[(st / len) | 0].map(n => [n, len, 1]) : null;
}
const SONGS = {
  // セーブ部屋：ほっとする。でも少しだけ不安が残る
  save: { bpm: 66, len: 128, loop: true, vol: 0.75, rev: 0.6, tracks: [
    { inst: 'pad', v: 0.9, at: chords([[50, 57, 60, 65], [46, 53, 57, 62], [43, 50, 53, 58], [45, 52, 55, 61], [50, 57, 60, 65], [46, 53, 57, 62], [43, 50, 55, 58], [45, 49, 52, 57]], 16) },
    { inst: 'piano', v: 0.9, at: seq('74:4 72:2 69:2 72:4 - - - - 70:4 69:2 65:2 67:8 74:4 72:2 69:2 72:4 77:4 76:6 73:2 74:8 - - - - - - - - 69:4 72:4 74:4 76:4 77:6 76:2 74:8 72:4 70:4 69:4 67:4 69:8 r:8 74:4 72:2 69:2 72:4 - - - - 70:4 69:2 65:2 67:8 65:2 67:2 69:4 70:4 72:4 69:16') },
    { inst: 'bass', v: 0.6, at: seq('38:16 34:16 31:16 33:16 38:16 34:16 31:16 33:16') },
  ] },
  // タイトル：遠い合唱と、低いピアノ
  title: { bpm: 54, len: 128, loop: true, vol: 0.8, rev: 0.8, tracks: [
    { inst: 'choir', v: 0.8, at: chords([[57, 60, 64], [55, 58, 62], [53, 57, 60], [52, 56, 59], [57, 60, 64], [58, 62, 65], [53, 57, 62], [52, 56, 59]], 16) },
    { inst: 'piano', v: 1, at: seq('45:8 52:8 43:8 50:8 41:8 48:8 40:8 47:8 45:8 52:8 46:8 53:8 41:8 50:8 40:8 44:8') },
    { inst: 'bell', v: 0.6, at: seq('r:30 76:2 r:30 74:2 r:30 72:2 r:30 71:2') },
  ] },
  // ボス：低い弦の刻みと、金管
  boss: { bpm: 146, len: 64, loop: true, vol: 0.8, rev: 0.3, tracks: [
    { inst: 'str', v: 1, at: seq('36:2 36:2 39:2 36:2 43:2 42:2 39:2 38:2 36:2 36:2 39:2 36:2 44:2 43:2 39:2 41:2 36:2 36:2 39:2 36:2 43:2 42:2 39:2 38:2 34:2 34:2 37:2 34:2 41:2 39:2 38:2 35:2') },
    { inst: 'brass', v: 1, at: seq('60+63+67:6 r:2 - - - - - - - - 58+62+65:6 r:2 - - - - - - - - 56+60+63:6 r:2 - - - - - - - - 55+59+62:8 - - - - - - - -') },
    { inst: 'kick', at: st => st % 4 === 0 ? [36, 1, 1] : null }, { inst: 'snare', at: st => st % 8 === 4 ? [0, 1, 1] : null }, { inst: 'hat', at: st => st % 2 === 0 ? [0, 1, 1] : null },
  ] },
  // 脱出：速い鼓動
  escape: { bpm: 168, len: 32, loop: true, vol: 0.75, rev: 0.25, tracks: [
    { inst: 'bass', v: 1, at: seq('33:2 33:2 45:2 33:2 33:2 44:2 33:2 43:2 31:2 31:2 43:2 31:2 32:2 32:2 44:2 34:2') },
    { inst: 'str', v: 0.8, at: seq('69:8 68:8 67:8 68:8') },
    { inst: 'kick', at: st => st % 4 === 0 ? [36, 1, 1] : null }, { inst: 'hat', at: st => [0, 1, st % 2 ? 0.5 : 1] },
  ] },
  // エンディング：明け方
  ending: { bpm: 72, len: 128, loop: true, vol: 0.8, rev: 0.7, tracks: [
    { inst: 'pad', v: 1, at: chords([[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 60], [43, 50, 55, 62]], 16) },
    { inst: 'piano', v: 1, at: seq('72:4 74:4 76:8 79:4 76:4 74:8 72:4 69:4 72:8 74:4 72:4 71:8 72:4 74:4 76:8 79:4 81:4 79:8 77:4 76:4 74:4 72:4 74:16') },
    { inst: 'bass', v: 0.6, at: seq('36:16 33:16 29:16 31:16 36:16 33:16 29:16 31:16') },
  ] },
  // 地下・研究所の低い不安
  dread: { bpm: 50, len: 64, loop: true, vol: 0.6, rev: 0.8, tracks: [
    { inst: 'pad', v: 0.8, at: chords([[38, 44, 49], [37, 43, 48], [38, 44, 50], [36, 42, 47]], 16) },
    { inst: 'bell', v: 0.5, at: seq('r:14 74:2 r:30 73:2 r:16') },
  ] },
  gameover: { bpm: 60, len: 32, loop: false, vol: 0.9, rev: 0.9, tracks: [
    { inst: 'choir', v: 1, at: seq('45+48+52:16 44+47+50:16') }, { inst: 'bass', v: 1, at: seq('33:16 32:16') },
  ] },
};

// ---------------------------------------------------------------------------
// 旅のしるし：おぼえた字・色をもどしたもの・墨のしずく・解き方の印・進んだ場面
// ---------------------------------------------------------------------------
const Game = {
  known: [], usedAt: {}, useN: {}, colors: 0, gotDrops: {}, stamps: {}, cleared: {}, restored: {}, sceneIdx: 0, maxScene: 0,
  settings: { music: 0.55, sfx: 0.8, fast: false }, fastWrite: false, god: false, paused: false,
  stats: { hurts: 0, writes: 0, combos: 0 }, log: [], started: false, story: {}, finalWord: null,
  inkBase: 12,
  gift(k, lines, done) { giftKanji(k, lines, done); },
  learn(k, how) {
    if (!KDEF[k] || KDEF[k].hidden) return false;
    if (this.known.includes(k)) return false;
    this.known.push(k); this.usedAt[k] = Date.now();
    UI.newSet.add(k);
    Bus.emit('learn', { k, how });
    if (how !== 'silent') { Sfx.learn(); if (how === 'see' || how === 'restore' || how === 'world') Fx.learnFly && Fx.learnFly(k); }
    buildTray(); this.save();
    return true;
  },
  used(k) { this.usedAt[k] = Date.now(); this.useN[k] = (this.useN[k] || 0) + 1; this.stats.writes++; },
  gotDrop(d) {
    const sid = Scene.cur ? Scene.cur.id : 'x';
    this.gotDrops[sid + ':' + d.x + ',' + d.y] = 1;
    Ink.max = this.inkMax();
    Sfx.drop(); Fx.sparkle(d.x + .5, d.y + .5, INK.kin, 14);
    toast('墨のしずく！ 墨つぼが大きくなった（' + Ink.max + '画）');
    Bus.emit('drop', { x: d.x, y: d.y });
    this.save(); updateInk();
  },
  inkMax() { return this.inkBase + Object.keys(this.gotDrops).length * 2 + Object.keys(this.cleared).length * 1 + (this.story.inkBonus || 0); },
  stampCount() { let n = 0; for (const s in this.stamps) n += Object.keys(this.stamps[s]).length; return n; },
  hasStamp(sid, aid) { return !!(this.stamps[sid] && this.stamps[sid][aid]); },
  unlocked(i) { return i <= this.maxScene; },
  save() {
    Store.save({ v: 1, known: this.known, usedAt: this.usedAt, useN: this.useN, colors: this.colors, gotDrops: this.gotDrops, stamps: this.stamps, cleared: this.cleared, restored: this.restored, sceneIdx: this.sceneIdx, maxScene: this.maxScene, settings: this.settings, story: this.story, finalWord: this.finalWord, stats: this.stats });
  },
  load() {
    const s = Store.load(); if (!s || s.v !== 1) return false;
    Object.assign(this, { known: s.known || [], usedAt: s.usedAt || {}, useN: s.useN || {}, colors: s.colors || 0, gotDrops: s.gotDrops || {}, stamps: s.stamps || {}, cleared: s.cleared || {}, restored: s.restored || {}, sceneIdx: s.sceneIdx || 0, maxScene: s.maxScene || 0, settings: Object.assign(this.settings, s.settings || {}), story: s.story || {}, finalWord: s.finalWord || null, stats: Object.assign(this.stats, s.stats || {}) });
    this.known = this.known.filter(k => KDEF[k]);
    this.fastWrite = !!this.settings.fast;
    AudioSys.setVol('music', this.settings.music); AudioSys.setVol('sfx', this.settings.sfx);
    return true;
  },
  // 見えているものの名をおぼえる
  tickSee() {
    if (!W || !W.hero || W.tick % 5) return;
    const h = W.hero;
    // 地形の名も、見ればおぼえる
    if (W.tick % 15 === 0) {
      const seenT = {};
      for (let yy = h.y - 3; yy <= h.y + 3; yy++) for (let xx = h.x - 4; xx <= h.x + 4; xx++) {
        if (!inb(xx, yy)) continue;
        const t = W.t[idx(xx, yy)];
        if (W.wa[idx(xx, yy)] >= DEEP) seenT['水'] = (seenT['水'] || 0) + 1;
        const k = { [T.ROCK]: '岩', [T.SAND]: '砂', [T.ICE]: '氷', [T.SNOW]: '雪' }[t];
        if (k) seenT[k] = (seenT[k] || 0) + 1;
      }
      for (const k in seenT) if (seenT[k] >= 3 && !this.known.includes(k) && !(Scene.cur && Scene.cur.noSee && Scene.cur.noSee.includes(k))) { this.learn(k, 'see'); toast(k + '（' + KDEF[k].yomi + '）をおぼえた'); return; }
    }
    for (const e of W.ents) {
      if (!e.alive || e.isHero || e.mine || this.known.includes(e.k)) continue;
      if (Scene.cur && Scene.cur.noSee && Scene.cur.noSee.includes(e.k)) continue;
      if (KDEF[e.k].hidden) continue;
      if (entDist(e, h) <= (e.pinned ? 11 : 6) && (W.dark < 0.5 || lightAt(e.x, e.y) > 0.3 || e.pinned)) {
        this.learn(e.k, 'see');
        e.talk(e.d.ch + '（' + e.d.yomi + '）', 1.8);
        Fx.learnFrom(e);
        break;
      }
    }
  },
  sandbox() { Scene.loadDef(SANDBOX, -1); },
  toTitle() { Scene.cur = null; W = null; Voice.clear(); Title.show(); },
};
// 字が字帳へ飛んでいく
Fx.learnFly = k => { };
Fx.learnFrom = e => {
  const [sx, sy] = w2s(e.rx + e.w / 2, e.ry);
  const pot = UI.potPoint();
  const g = document.createElement('canvas'); const s = 64, dpr = Math.min(2, window.devicePixelRatio || 1);
  g.width = s * dpr; g.height = s * dpr; g.style.cssText = 'position:fixed;z-index:45;pointer-events:none;width:' + s + 'px;height:' + s + 'px;left:0;top:0;';
  const x = g.getContext('2d'); x.scale(dpr, dpr); Brush.draw(x, e.k.length > 1 ? e.k[0] : e.k, s, INK[e.d.col] || INK.sumi);
  document.body.append(g);
  const st = $('stage').getBoundingClientRect(), tr = $('grid').getBoundingClientRect();
  const from = [st.left + sx - s / 2, st.top + sy - s];
  const to = [tr.left + 20, tr.top + 4];
  const t0 = performance.now();
  (function f() {
    const k = clamp((performance.now() - t0) / 900, 0, 1), e2 = easeInOut(k);
    const x2 = lerp(from[0], to[0], e2), y2 = lerp(from[1], to[1], e2) - Math.sin(k * Math.PI) * 80;
    g.style.transform = 'translate(' + x2 + 'px,' + y2 + 'px) scale(' + (1 - k * 0.5) + ')';
    g.style.opacity = String(1 - smooth(0.8, 1, k));
    if (k < 1) requestAnimationFrame(f); else g.remove();
  })();
};

// ---------------------------------------------------------------------------
// 場面
// ---------------------------------------------------------------------------
const MAPKEY = { '.': T.AIR, '#': T.EARTH, 'R': T.ROCK, 's': T.SAND, 'I': T.ICE, 'S': T.SNOW, 'M': T.MUD, '=': T.PLANK, 'x': T.BLANK, 'c': T.CRACK, 'g': T.MOSS, '~': T.AIR, '-': T.AIR };
const Scene = {
  cur: null, idx: 0, leaving: false, hintN: 0, enterT: 0, flags: {},
  flag(k) { return !!this.flags[k]; }, setFlag(k) { this.flags[k] = true; },
  load(i) {
    i = clamp(i, 0, SCENES.length - 1);
    this.loadDef(SCENES[i], i);
  },
  loadDef(def, i) {
    this.idx = i; this.cur = def; this.leaving = false; this.hintN = 0; this.enterT = 0; this.flags = {};
    for (const c of def.cues || []) c.done = false; for (const t of def.talks || []) { t.done = false; t.i = 0; t.cd = 0; }
    Tutor.stop(); if ($('title').classList.contains('on')) Title.hide();
    if (i >= 0) { Game.sceneIdx = i; Game.maxScene = Math.max(Game.maxScene, i); }
    const rows = def.map;
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    W = makeWorld(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x] || '.';
      W.t[y * w + x] = MAPKEY[ch] != null ? MAPKEY[ch] : T.AIR;
      if (ch === '~') W.wa[y * w + x] = WMAX;
      if (ch === '-') W.wa[y * w + x] = DEEP;
    }
    W.faded = []; W.drops = []; W.buried = (def.buried || []).map(b => Object.assign({ found: false }, b)); W.loose = def.loose || [];
    W.darkBase = def.dark || 0; W.dark = W.darkBase; W.night = !!def.night; W.wind = def.wind || 0; W.season = def.season || null;
    W.zones = (def.zones || []).map(z => Object.assign({}, z));
    PAL = def.konshi ? PAL_NIGHT : PAL_DAY;
    R.terrainCv = null; R.cam.inited = false; R.cam.panX = 0; R.cam.panY = 0; R.cam.focus = null;
    R.bg = makeBackdrop(def.theme || {});
    Fx.clear(); Voice.clear(); hideBubble(); R.writing = []; Ink.pending = 0;
    const s = def.start || { x: 1, y: 1 };
    makeHero(s.x, s.y);
    for (const e of def.ents || []) {
      const n = newEnt(e.k, e.x, e.y, { instant: true, w: e.w, h: e.h });
      if (!n) continue;
      n.spawnT = 0;
      if (e.w) n.w = e.w; if (e.h) n.h = e.h;
      Object.assign(n, e.set || {});
      if (n.ai) n.ai.home = n.x;
      if (e.sleep) n.sleepT = 9999;
      if (e.hibern) { n.hibern = true; n.sleepT = 9999; }
      if (e.locked) n.locked = true;
      if (e.holds) n.holds = e.holds;
      if (e.full && n.d.bamboo) n.growTo = n.h;
      if (e.id) n.sid = e.id;
    }
    for (const f of def.faded || []) {
      const d = KDEF[f.k]; if (!d) continue;
      const key = (def.id || 'x') + ':' + f.k + '@' + f.x + ',' + f.y;
      const restoredBefore = Game.restored[key];
      const fo = Object.assign({ w: f.w || d.w, h: f.h || d.h, restored: false, key }, f);
      if (restoredBefore && !f.always) { const n = newEnt(f.k, f.x, f.y, { instant: true }); if (n) { n.spawnT = 0; if (n.ai) n.ai.home = n.x; } fo.restored = true; }
      W.faded.push(fo);
    }
    for (const d of def.drops || []) W.drops.push({ x: d.x, y: d.y, got: !!Game.gotDrops[(def.id || 'x') + ':' + d.x + ',' + d.y] });
    W.hero.hero.checkpoint = { x: s.x, y: s.y };
    if (def.birth && !Game.cleared[def.id]) { W.hero.hero.hurtT = 0; W.hero.birthT = 2.2; Fx.birth(s.x + .5, s.y + 1); }
    Ink.max = def.sandbox ? 60 : Game.inkMax();
    for (const k of def.give || []) Game.learn(k, 'silent');
    rebuildOcc();
    // 見出し
    const ch = CHAPTERS[def.chapter] || { seal: '自', title: '' };
    $('sealStamp').textContent = ch.seal;
    $('sealName').textContent = (def.no ? def.no + '　' : '') + def.title;
    UI.selected = null; buildTray();
    Music.play(def.music || 'field');
    if (def.voice && def.voice.enter) setTimeout(() => { if (Scene.cur === def) Voice.say(def.voice.enter, { who: 'painter' }); }, 900);
    if (def.onEnter) { try { def.onEnter(); } catch (e) { reportError(e); } }
    Bus.emit('enter', { id: def.id });
    Game.save();
  },
  restart() { if (this.idx >= 0) this.load(this.idx); else Game.sandbox(); },
  hint() {
    const def = this.cur; if (!def) return;
    const hs = (def.voice && def.voice.hints) || [];
    if (!hs.length) { Voice.say('……好きに書いてごらん。字は、思ったとおりに動いてくれる'); return; }
    const h = hs[Math.min(this.hintN, hs.length - 1)];
    this.hintN++;
    Voice.say(h, { who: 'painter' });
    Bus.emit('hint', { n: this.hintN });
  },
  exit(dir) {
    if (this.leaving) return;
    const def = this.cur;
    if (def.sandbox) { return; }
    if (def.canExit && !def.canExit()) return;
    this.leaving = true;
    // 印
    const got = [];
    for (const a of def.stamps || []) {
      let ok = false; try { ok = a.test(W.events, W); } catch (e) { reportError(e); }
      if (ok) { if (!Game.stamps[def.id]) Game.stamps[def.id] = {}; if (!Game.stamps[def.id][a.id]) { Game.stamps[def.id][a.id] = 1; got.push(a); } }
    }
    for (const f of W.faded) if (f.restored) Game.restored[f.key] = 1;
    const first = !Game.cleared[def.id];
    Game.cleared[def.id] = 1;
    Bus.emit('clear', { id: def.id, first, stamps: got.map(a => a.id) });
    if (def.onExit) { try { def.onExit(); } catch (e) { reportError(e); } }
    Game.save();
    Snap.take(def.id);
    Transition.play(def, got, () => {
      const next = def.next != null ? def.next : this.idx + 1;
      if (typeof next === 'function') { next(); return; }
      if (next >= SCENES.length) { Ending.play(); return; }
      const nd = SCENES[next];
      if (nd.chapter !== def.chapter && CHAPTERS[nd.chapter].intro) Story.chapter(nd.chapter, () => this.load(next));
      else this.load(next);
    });
  },
};
// 場面の変わり目：解き方の印を見せて、巻物をくるくる
const Transition = {
  play(def, got, done) {
    const total = (def.stamps || []).length;
    const have = Game.stamps[def.id] ? Object.keys(Game.stamps[def.id]).length : 0;
    const box = el('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:38;background:rgba(235,226,200,0);transition:background .5s;display:flex;align-items:center;justify-content:center;padding:0 max(16px,env(safe-area-inset-left,0px));pointer-events:auto';
    const card = el('div');
    card.style.cssText = 'background:var(--washi-light);border:2px solid var(--sumi);border-radius:6px;padding:18px 20px;max-width:min(420px,100%);font-size:16px;line-height:1.8;opacity:0;transform:translateY(10px);transition:all .5s';
    card.append(el('div', null, '「' + def.title + '」をぬけた'));
    if (total) {
      const st = el('div'); st.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:10px 0';
      for (const a of def.stamps) {
        const on = Game.hasStamp(def.id, a.id), isNew = got.includes(a);
        const s = el('span', null, on ? a.name : '？？？');
        s.style.cssText = 'font-size:13px;padding:3px 8px;border-radius:4px;border:1.5px solid ' + (on ? 'var(--shu)' : 'rgba(28,26,32,.25)') + ';' + (isNew ? 'background:var(--shu);color:#fff' : on ? 'color:var(--shu)' : 'color:var(--usuzumi)');
        st.append(s);
      }
      card.append(st);
      card.append(el('div', null, '解き方の印 ' + have + ' / ' + total + (have < total ? '　ほかの解き方もある' : '　すべて見つけた！')));
    }
    const btn = el('button', 'mbtn red', 'つづきへ'); btn.style.marginTop = '12px';
    card.append(btn);
    box.append(card); document.body.append(box);
    requestAnimationFrame(() => { box.style.background = 'rgba(235,226,200,.75)'; card.style.opacity = '1'; card.style.transform = 'none'; });
    if (got.length) Sfx.restore(); else Sfx.chime();
    let fired = false;
    const go = () => { if (fired) return; fired = true; box.remove(); done(); };
    btn.onclick = go;
    if (Game.autoNext) setTimeout(go, 300);
  },
};

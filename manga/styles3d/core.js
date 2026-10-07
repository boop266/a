/* =========================================================
   manga/styles3d/core.js — 3D → 白黒漫画（NPR）の心臓部
   ・Builder   : 手続き的に作った部品を、1つの BufferGeometry にまとめる（濃さ・質感・部品番号つき）
   ・ink 材質  : 光の向き＋表面の向きに沿ったハッチング（1〜4層）、黒ベタ、網点／カケアミ、質感の描き込み
   ・後処理    : 深度・法線・部品番号の段差から主線（太さに強弱）、空と雲、月、雨、霧、集中線・スピード線
   ・render()  : オフスクリーンの WebGL で描いて、2D canvas に drawImage する
   すべて window.Manga3D（M3）にぶら下げる。three.js r128（UMD）が先に読まれていること。
   ========================================================= */
(() => {
  const M3 = window.Manga3D = window.Manga3D || {};
  const T = window.THREE;
  if (!T) { console.warn('styles3d: THREE がありません'); return; }
  M3.THREE = T;

  // ---------- 乱数・ノイズ ----------
  let _s = 1;
  const seed = n => { _s = (n >>> 0) || 1; };
  const rand = () => { _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * rand();
  const pick = a => a[Math.floor(rand() * a.length)];
  const hashStr = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  function h3(x, y, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const L = (a, b, t) => a + (b - a) * t;
    return L(L(L(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), L(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v),
      L(L(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), L(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u), v), w) * 2 - 1;
  }
  const fbm3 = (x, y, z, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s; };

  // ---------- 行列の小道具 ----------
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  const _e = new T.Euler(), _q = new T.Quaternion();
  // M([x,y,z], [rx,ry,rz](rad), s or [sx,sy,sz])
  function M(p = [0, 0, 0], r = [0, 0, 0], s = 1) {
    const m = new T.Matrix4(); _e.set(r[0] || 0, r[1] || 0, r[2] || 0, 'YXZ'); _q.setFromEuler(_e);
    const sc = Array.isArray(s) ? V3(s[0], s[1], s[2]) : V3(s, s, s);
    return m.compose(V3(p[0], p[1], p[2]), _q, sc);
  }
  // a から b へ伸びる部品の行列（部品は +Y 方向に長さ 1 で作っておく）
  function Mab(a, b, s = [1, 1], roll = 0) {
    const A = V3(...a), B = V3(...b), d = B.clone().sub(A), len = d.length() || 1e-6;
    const q = new T.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
    if (roll) q.multiply(new T.Quaternion().setFromAxisAngle(V3(0, 1, 0), roll));
    return new T.Matrix4().compose(A, q, V3(s[0], len, s[1] ?? s[0]));
  }

  // ---------- 手続き的ジオメトリ ----------
  // 頂点を関数でずらす（f(v:Vector3, n:Vector3) → 変位ベクトル or 数値=法線方向）
  function displace(geo, f, smooth = true) {
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const p = geo.attributes.position, n = geo.attributes.normal, v = new T.Vector3(), nn = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i);
      const d = f(v, nn);
      if (typeof d === 'number') v.addScaledVector(nn, d); else if (d) v.add(d);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    p.needsUpdate = true;
    if (smooth) geo.computeVertexNormals();
    return geo;
  }
  // 位置が同じ頂点を一つにまとめた上で変位（球の継ぎ目が割れないように）
  function displaceWelded(geo, f) {
    const p = geo.attributes.position, key = (x, y, z) => `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
    const cache = new Map(); geo.computeVertexNormals();
    const n = geo.attributes.normal, v = new T.Vector3(), nn = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const k = key(v.x, v.y, v.z);
      let r = cache.get(k);
      if (!r) { nn.fromBufferAttribute(n, i); const d = f(v.clone(), nn.clone()); r = typeof d === 'number' ? v.clone().addScaledVector(nn, d) : v.clone().add(d || V3(0, 0, 0)); cache.set(k, r); }
      p.setXYZ(i, r.x, r.y, r.z);
    }
    p.needsUpdate = true; geo.computeVertexNormals(); return geo;
  }
  // 太さの変わるチューブ（pts:[[x,y,z]], rad:[r] or fn(t)）。+ 断面の平たさ flat
  function tube(pts, rad, seg = 8, o = {}) {
    const P = pts.map(p => V3(...p)), N = P.length;
    const pos = [], idx = [];
    let prevN = null;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const tg = (i === 0 ? P[1].clone().sub(P[0]) : i === N - 1 ? P[i].clone().sub(P[i - 1]) : P[i + 1].clone().sub(P[i - 1])).normalize();
      let nrm = prevN ? prevN.clone().sub(tg.clone().multiplyScalar(prevN.dot(tg))) : (Math.abs(tg.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0)).cross(tg);
      nrm.normalize(); prevN = nrm;
      const bin = tg.clone().cross(nrm).normalize();
      const r = typeof rad === 'function' ? rad(t, i) : (Array.isArray(rad) ? rad[i] : rad);
      for (let k = 0; k < seg; k++) {
        const a = k / seg * Math.PI * 2, c = Math.cos(a) * r * (o.flat || 1), s = Math.sin(a) * r;
        pos.push(P[i].x + nrm.x * c + bin.x * s, P[i].y + nrm.y * c + bin.y * s, P[i].z + nrm.z * c + bin.z * s);
      }
    }
    for (let i = 0; i < N - 1; i++) for (let k = 0; k < seg; k++) { const a = i * seg + k, b = i * seg + (k + 1) % seg, c = a + seg, d = b + seg; idx.push(a, c, b, b, c, d); }
    if (o.cap !== false) { // 端をふさぐ
      const c0 = pos.length / 3; pos.push(P[0].x, P[0].y, P[0].z); const c1 = c0 + 1; pos.push(P[N - 1].x, P[N - 1].y, P[N - 1].z);
      for (let k = 0; k < seg; k++) { idx.push(c0, k, (k + 1) % seg); idx.push(c1, (N - 1) * seg + (k + 1) % seg, (N - 1) * seg + k); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // 回転体（prof: [[r, y]...]）。断面を楕円に（sx, sz）
  function lathe(prof, seg = 12, sx = 1, sz = 1) {
    const g = new T.LatheGeometry(prof.map(p => new T.Vector2(Math.max(0.0001, p[0]), p[1])), seg);
    if (sx !== 1 || sz !== 1) g.scale(sx, 1, sz);
    g.computeVertexNormals(); return g;
  }
  // 岩：正二十面体を割って、ノイズで面ごとにゆがめる（面ごとのハッチが映える）
  function rock(r = 1, o = {}) {
    const g = new T.IcosahedronGeometry(1, o.detail ?? 1);
    const s0 = rr(0, 100), sq = o.squash ?? rr(0.55, 0.9), cut = o.cut ?? 0.35;
    displace(g, v => {
      const n = fbm3(v.x * 1.3 + s0, v.y * 1.3, v.z * 1.3, 3) * (o.rough ?? 0.45);
      const k = 1 + n; const out = v.clone().multiplyScalar(k);
      out.y *= sq; if (out.y < -cut) out.y = -cut + (out.y + cut) * 0.15; // 地面に座らせる
      return out.sub(v);
    }, false);
    g.scale(r, r, r); g.computeVertexNormals(); return g;
  }
  // 少しゆがんだ箱（石材）
  function stone(w, h, d, o = {}) {
    const g = new T.BoxGeometry(w, h, d, o.seg ?? 2, o.seg ?? 2, o.seg ?? 2);
    const s0 = rr(0, 100), amp = o.amp ?? Math.min(w, h, d) * 0.12;
    displace(g, v => { // 角を欠く・ふくらむ
      const nx = Math.abs(v.x) / (w / 2), ny = Math.abs(v.y) / (h / 2), nz = Math.abs(v.z) / (d / 2);
      const corner = (nx > 0.99) + (ny > 0.99) + (nz > 0.99);
      const k = noise3(v.x * 3 + s0, v.y * 3, v.z * 3) * amp;
      const chip = corner >= 2 ? -amp * (0.5 + 0.8 * rand()) : 0;
      return v.clone().normalize().multiplyScalar(k + chip);
    }, false);
    return g;
  }

  // ---------- Builder：部品を1つにまとめる ----------
  // 質感の番号（シェーダで使う）
  const PAT = { plain: 0, stone: 1, metal: 2, cloth: 3, skin: 4, wood: 5, hide: 6, ground: 7, leaf: 8, bone: 9, glass: 10, water: 11, hair: 12, brick: 13, cloud: 14, cobble: 15 };
  let _idc = 1;
  class Builder {
    constructor() { this.P = []; this.N = []; this.A = []; this.count = 0; }
    // geo を行列 m で置いて足す。o: { tone 0白..1黒, pat, id, flat }
    add(geo, m, o = {}) {
      let g = geo;
      if (o.flat) { g = g.index ? g.toNonIndexed() : g.clone(); g.computeVertexNormals(); }
      else { if (!g.attributes.normal) g.computeVertexNormals(); if (g.index) g = g.toNonIndexed(); }
      const p = g.attributes.position, n = g.attributes.normal;
      const nm = new T.Matrix3().getNormalMatrix(m || new T.Matrix4());
      const v = new T.Vector3(), w = new T.Vector3();
      const tone = o.tone ?? 0.15, pat = typeof o.pat === 'string' ? (PAT[o.pat] ?? 0) : (o.pat ?? 0), id = o.id ?? (_idc++);
      const det = m ? m.determinant() : 1;
      const tri = [];
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i); if (m) v.applyMatrix4(m);
        w.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
        tri.push([v.x, v.y, v.z, w.x, w.y, w.z]);
        if (tri.length === 3) {
          if (det < 0) tri.reverse();
          for (const t of tri) { this.P.push(t[0], t[1], t[2]); this.N.push(t[3], t[4], t[5]); this.A.push(tone, pat, id % 251); }
          tri.length = 0;
        }
      }
      this.count += p.count / 3;
      return id;
    }
    newId() { return _idc++; }
    geometry() {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(this.P, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(this.N, 3));
      g.setAttribute('aInk', new T.Float32BufferAttribute(this.A, 3));
      g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    }
  }

  // ---------- シェーダ ----------
  const GLSL_NOISE = `
    float h13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
    float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
    float vn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
      return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z)*2.0-1.0; }
    float vn2(vec2 x){ vec2 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
      return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y)*2.0-1.0; }
    float fbm3(vec3 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vn3(p); p*=2.03; a*=0.5; } return s; }
    float fbm2(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*vn2(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return s; }
    // 画面の網点
    float dots(vec2 fc, float cov, float cell){
      vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * fc / cell;
      vec2 f = fract(q) - 0.5; float d = length(f);
      float r = sqrt(clamp(cov, 0.0, 1.0) / 3.1416);
      float aa = 0.7 / cell;
      float c = 1.0 - smoothstep(r - aa, r + aa, d);
      if (cov > 0.75) { // 濃い所は白い点に反転
        vec2 g = fract(q) ; float d2 = length(g - vec2(0.0)); d2 = min(d2, length(g - vec2(1.0,0.0))); d2 = min(d2, length(g - vec2(0.0,1.0))); d2 = min(d2, length(g - vec2(1.0)));
        float r2 = sqrt(clamp(1.0 - cov, 0.0, 1.0) / 3.1416);
        c = smoothstep(r2 - aa, r2 + aa, d2);
      }
      return c;
    }
    float kakeami(vec2 fc, float cov, float cell){
      float c = 0.0; float hw = clamp(cov, 0.0, 1.0) * 0.32;
      for (int k = 0; k < 3; k++){
        float a = 0.5 + float(k) * 1.05; vec2 d = vec2(cos(a), sin(a));
        float u = dot(fc, d) / cell + 0.35 * sin(dot(fc, vec2(-d.y, d.x)) / cell * 1.3);
        float f = abs(fract(u) - 0.5); float fw = fwidth(u);
        float on = step(float(k) * 0.28, cov);
        c = max(c, on * (1.0 - smoothstep(hw - fw, hw + fw, f)));
      }
      return c;
    }
  `;

  const INK_VS = `
    attribute vec3 aInk;
    varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying float vZ;
    #include <common>
    #include <shadowmap_pars_vertex>
    void main(){
      #include <begin_vertex>
      #include <project_vertex>
      #include <worldpos_vertex>
      #include <beginnormal_vertex>
      #include <defaultnormal_vertex>
      #include <shadowmap_vertex>
      vW = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vN = normalize(mat3(modelMatrix) * objectNormal);
      vInk = aInk; vZ = -mvPosition.z;
    }`;

  // 濃さ d（0=白, 1=黒）を、線・トーン・ベタに置き換える
  const INK_FS = `
    uniform vec3 uL;            // 光の来る向き（ワールド）
    uniform vec3 uCam; uniform vec3 uRight; uniform vec3 uUp; uniform vec3 uFwdH;
    uniform float uFocal;       // 1m 先で 1m が何 px か
    uniform float uPx;          // 解像度の倍率（線の太さ・間隔の基準）
    uniform vec4 uH;            // x hatching, y crossHatch, z black, w tone
    uniform vec4 uA;            // x detail, y grain, z toneKind(0 none,1 dot,2 gradient,3 kakeami,4 line,5 sand), w ambient
    uniform vec4 uF;            // x fogNear, y fogFar, z fogTone(0..1), w fogAmt
    uniform vec4 uL2;           // x key strength, y rim, z lightning flash, w softness
    uniform float uJit; uniform vec3 uRimDir;
    varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying float vZ;
    #include <common>
    #include <packing>
    #include <bsdfs>
    #include <lights_pars_begin>
    #include <shadowmap_pars_fragment>
    #include <shadowmask_pars_fragment>
    ${GLSL_NOISE}
    // 1本の平行線の束（ワールドの平面 dot(P,a) の等高線）。画面上の間隔 spPx を保つよう、距離で2つの細かさを混ぜる
    float hatch(vec3 P, vec3 a, float spPx, float hw, float wob){
      float wpp = vZ / uFocal;                 // 1px が何 m か
      float sp = spPx * uPx * wpp;
      float l = log2(sp / 0.004); float l0 = floor(l); float t = l - l0;
      float s = dot(P, a);
      float c = 0.0;
      for (int k = 0; k < 2; k++){
        float fk = float(k);
        float spk = 0.004 * exp2(l0 + fk);
        float hk = clamp(hw * exp2(t - fk), 0.0, 0.5);
        float u = s / spk + wob * (1.0 - fk * 0.5);
        float fw = max(fwidth(u), 1e-4);
        float f = abs(fract(u) - 0.5);
        float cov = 1.0 - smoothstep(hk - fw * 0.7, hk + fw * 0.7, f);
        // 細かすぎる線は灰色に（モアレ防止）
        cov = mix(cov, hk * 2.0, smoothstep(0.35, 0.6, fw));
        c += (k == 0 ? (1.0 - t) : t) * cov;
      }
      return c;
    }
    void main(){
      vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
      vec3 V = normalize(uCam - vW);
      float tone = vInk.x; float pat = floor(vInk.y + 0.5);
      float det = uA.x;
      // --- 光 ---
      float sh = getShadowMask();
      float lam = max(dot(n, uL), 0.0);
      float wrap = clamp(dot(n, uL) * 0.5 + 0.5, 0.0, 1.0);
      float key = mix(lam, smoothstep(0.0, 0.35, lam), 0.6) * sh;   // 劇画：光と影をはっきり分ける
      float sky = n.y * 0.5 + 0.5;
      float L = uA.w * (0.55 + 0.45 * sky) + uL2.x * key + uL2.w * wrap * 0.25;
      float fres = 1.0 - max(dot(n, V), 0.0);
      float rim = smoothstep(0.55, 0.8, fres) * uL2.y * smoothstep(0.0, 0.35, dot(n, uRimDir));   // 逆光のふち
      L += rim; L += uL2.z * (0.4 + 0.6 * wrap);
      L = clamp(L, 0.0, 1.0);
      // --- 質感（濃さに足す） ---
      float tex = 0.0; float line2 = 0.0;
      float nz = fbm3(vW * 1.7);
      if (pat == 1.0 || pat == 13.0) { // 石：ひび・欠け・しみ
        float cr = abs(fbm3(vW * 2.3 + 7.0));
        float fw = fwidth(cr) * 1.2;
        line2 = max(line2, (1.0 - smoothstep(0.012, 0.012 + fw, cr)) * smoothstep(0.1, 0.5, det) * smoothstep(0.0, 0.3, vn3(vW * 0.7)));
        tex += (fbm3(vW * 6.0) * 0.1 + nz * 0.1) * det;
        float pv = vn3(vW * 9.0 + 3.0); float pit = 1.0 - smoothstep(0.0, fwidth(pv) * 1.5, abs(pv - 0.62)); line2 = max(line2, pit * 0.8 * det * smoothstep(0.3, 0.6, vn3(vW * 1.3)));
      } else if (pat == 5.0) { // 木：たての木目
        vec3 q = vW * vec3(4.0, 0.35, 4.0);
        float g = abs(fract((vW.x + vW.z) * 3.5 + fbm3(q) * 2.5) - 0.5);
        float fw = fwidth((vW.x + vW.z) * 3.5 + fbm3(q) * 2.5);
        line2 = max(line2, (1.0 - smoothstep(0.08, 0.08 + fw * 1.5, g)) * det * 0.9);
        tex += fbm3(vW * 3.0) * 0.15 * det;
      } else if (pat == 6.0) { // 獣の皮：こぶとしわ
        tex += (fbm3(vW * 3.0) * 0.12 + abs(fbm3(vW * 8.0)) * 0.12) * det;
        float wr = abs(fbm3(vW * vec3(5.0, 1.5, 5.0) + 2.0)); float fw = fwidth(wr);
        line2 = max(line2, (1.0 - smoothstep(0.02, 0.02 + fw * 1.4, wr)) * det * 0.8 * (1.0 - L * 0.6));
      } else if (pat == 7.0) { // 地面：小石・草のつぶ
        tex += fbm3(vW * 0.6) * 0.12;
        float pv = vn3(vW * vec3(5.0, 5.0, 9.0)); float near = 1.0 - smoothstep(8.0, 30.0, vZ);
        line2 = max(line2, (1.0 - smoothstep(0.0, fwidth(pv) * 1.2, abs(pv - 0.7))) * det * near);   // 小石の輪郭
        float cr = abs(fbm3(vW * 0.9 + 4.0)); line2 = max(line2, (1.0 - smoothstep(0.008, 0.008 + fwidth(cr) * 1.2, cr)) * det * 0.9 * near * smoothstep(0.1, 0.4, vn3(vW * 0.15)));  // ひび
      } else if (pat == 12.0) { // 毛・たてがみ
        float u = (vW.x * 13.0 + vW.z * 7.0 + fbm3(vW * 2.0) * 3.0); float fw = fwidth(u);
        line2 = max(line2, (1.0 - smoothstep(0.1, 0.1 + fw, abs(fract(u) - 0.5))) * 0.8);
      } else if (pat == 9.0) { // 骨：小さな穴としみ
        tex += fbm3(vW * 4.0) * 0.08; float pv = vn3(vW * 18.0); line2 = max(line2, (1.0 - smoothstep(0.0, fwidth(pv) * 1.5, abs(pv - 0.65))) * 0.6 * det);
      } else if (pat == 15.0) { // 石畳・敷石：石の輪郭（ボロノイ）
        vec2 q = vW.xz * 2.6; vec2 ip = floor(q), fp = fract(q); float f1 = 9.0, f2 = 9.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = vec2(h12(ip + g), h12(ip + g + 17.0)) * 0.8 + 0.1; float dd = length(g + o - fp); if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd; }
        float e = f2 - f1; float fw = fwidth(e);
        float near = 1.0 - smoothstep(10.0, 40.0, vZ);
        line2 = max(line2, (1.0 - smoothstep(0.06, 0.06 + fw * 1.5, e)) * near * 0.95);
        tex += fbm3(vW * 3.0) * 0.08;
      } else if (pat == 10.0) { // ガラス：斜めの映り込み
        float u = (gl_FragCoord.x + gl_FragCoord.y * 0.6) / (14.0 * uPx); float f = abs(fract(u) - 0.5);
        tex -= (1.0 - smoothstep(0.08, 0.12, f)) * step(0.5, vn3(vW * 0.7 + 2.0)) * 0.6;
      } else if (pat == 3.0) { // 布：ゆるいしわ
        tex += fbm3(vW * vec3(2.0, 6.0, 2.0)) * 0.12 * det;
      }
      // --- 金属：映り込み（空は白、地面は黒）と鋭いハイライト ---
      float spec = 0.0; float metalD = -1.0;
      if (pat == 2.0) {
        vec3 R = reflect(-V, n);
        float env = smoothstep(-0.08, 0.06, R.y + 0.15 * fbm3(R * 3.0));
        float hl = pow(max(dot(R, uL), 0.0), 24.0) * sh;
        spec = smoothstep(0.35, 0.6, hl);
        metalD = 1.0 - (0.2 + 0.55 * env * (0.35 + 0.65 * L) + 0.25 * key);
      }
      // --- 濃さ ---
      float mat = tone;
      float hatchMat = mix(1.0, 0.35, uH.w);          // トーンが多い絵柄は、固有色を線でなくトーンで
      float d = 1.0 - L * (1.0 - mat * 0.75 * hatchMat);
      if (metalD >= 0.0) d = mix(d, metalD, 0.75) + mat * 0.3;
      float dBase = clamp(d, 0.0, 1.0);
      d = clamp(d + tex, 0.0, 1.0);
      // 霧：遠くは薄く
      float fog = smoothstep(uF.x, uF.y, vZ) * uF.w;
      d = mix(d, uF.z, fog);
      // --- 黒ベタ ---
      float betaT = mix(1.08, 0.5, uH.z);
      float black = smoothstep(betaT - 0.02, betaT + 0.02, mix(dBase, uF.z, fog)) * (1.0 - fog * 0.9);
      // 黒い物（固有色が黒）：影も光もベタ。光の当たる所は白抜きの線
      float darkMat = smoothstep(0.78, 0.86, mat) * (1.0 - fog * 0.85);
      // --- ハッチング（表面の向きに沿う） ---
      float hat = uH.x, ch = uH.y;
      float t1 = mix(0.72, 0.2, hat), gap = mix(0.42, 0.13, ch);
      float wob = vn3(vW * 2.1) * 0.35 * (0.3 + uJit) + vn3(vW * 9.0) * 0.08;
      float spPx = mix(7.5, 4.2, det) ;
      vec3 up = vec3(0.0, 1.0, 0.0);
      float flatK = smoothstep(0.55, 0.8, abs(n.y));
      vec3 a1 = normalize(mix(up, uFwdH, flatK));
      vec3 a2 = normalize(uRight * 0.85 + up + uFwdH * 0.85 * flatK);
      vec3 a3 = normalize(-uRight * 0.85 + up + uFwdH * 0.85 * flatK);
      vec3 a4 = normalize(uRight + 0.25 * up);
      float ink = 0.0;
      // 光の届き方に沿った向き：照らされた面と影の境目の近くでは、線を光の向きにそろえる
      if (hat > 0.02) {
        float w1 = smoothstep(t1, t1 + 0.3, d);
        if (w1 > 0.0) ink = max(ink, hatch(vW, a1, spPx, 0.06 + 0.32 * w1, wob) * smoothstep(t1 - 0.01, t1 + 0.06, d));
        if (ch > 0.04) { float t2 = t1 + gap; float w2 = smoothstep(t2, t2 + 0.3, d); if (w2 > 0.0) ink = max(ink, hatch(vW, a2, spPx * 1.05, 0.05 + 0.3 * w2, wob * 0.8) * smoothstep(t2 - 0.01, t2 + 0.06, d)); }
        if (ch > 0.35) { float t3 = t1 + gap * 2.0; float w3 = smoothstep(t3, t3 + 0.25, d); if (w3 > 0.0) ink = max(ink, hatch(vW, a3, spPx * 0.95, 0.05 + 0.3 * w3, wob * 0.7) * smoothstep(t3 - 0.01, t3 + 0.05, d)); }
        if (ch > 0.65) { float t4 = t1 + gap * 3.0; float w4 = smoothstep(t4, t4 + 0.2, d); if (w4 > 0.0) ink = max(ink, hatch(vW, a4, spPx * 0.8, 0.05 + 0.35 * w4, wob * 0.5) * smoothstep(t4 - 0.01, t4 + 0.05, d)); }
      }
      // --- トーン ---
      float tk = floor(uA.z + 0.5); float toneCov = 0.0;
      if (tk > 0.5 && uH.w > 0.02) {
        float tv = clamp(mat * uH.w * 1.1 + (1.0 - L) * uH.w * (1.0 - hat) * 0.85, 0.0, 0.95) * (1.0 - fog * 0.7);
        float cell = mix(5.5, 3.6, det) * uPx;
        vec2 fc = gl_FragCoord.xy;
        if (tk < 1.5) toneCov = dots(fc, tv, cell);
        else if (tk < 2.5) toneCov = dots(fc, tv * smoothstep(-0.2, 1.0, fc.y / (uFocal * 1.4)) , cell);
        else if (tk < 3.5) toneCov = kakeami(fc, tv, cell * 1.6);
        else if (tk < 4.5) { float u = fc.y / (cell * 0.8); float f = abs(fract(u) - 0.5); toneCov = 1.0 - smoothstep(tv * 0.5 - fwidth(u), tv * 0.5 + fwidth(u), f); }
        else toneCov = step(1.0 - tv * 0.8, h12(floor(fc / max(1.0, uPx))));
      }
      ink = max(ink, toneCov);
      ink = max(ink, line2 * (0.4 + 0.6 * smoothstep(0.15, 0.6, d)) * (1.0 - fog));
      ink = max(ink, black);
      // 黒い物：白抜き
      if (darkMat > 0.0) {
        float hiL = smoothstep(0.45, 1.0, L);
        float whiteLines = hatch(vW, a1, spPx * 1.2, 0.22 * hiL * hiL, wob) * step(0.02, hiL);
        float rimW = smoothstep(0.25, 0.5, rim);
        float m = 1.0 - max(max(whiteLines, rimW), spec);
        ink = mix(ink, m, darkMat);
      }
      ink = max(ink * (1.0 - spec), 0.0);
      // 雷・紙の粒
      float grain = uA.y * (h12(gl_FragCoord.xy * 0.73) - 0.5) * 0.35;
      ink = clamp(ink + grain * ink, 0.0, 1.0);
      gl_FragColor = vec4(vec3(1.0 - ink), 1.0);
    }`;

  // 法線＋部品番号＋影の強さ（線の太さに使う）
  const GEO_VS = `
    attribute vec3 aInk;
    uniform vec3 uL;
    varying vec3 vNv; varying float vId; varying float vLit; varying float vTone; varying float vZ;
    void main(){
      vec3 nW = normalize(mat3(modelMatrix) * normal);
      vNv = normalize(normalMatrix * normal);
      vId = aInk.z; vLit = dot(nW, uL); vTone = aInk.x;
      vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`;
  // R,G = 視線空間の法線 xy、B = 距離（m）、A = 部品番号 + 光(0..0.49) + 黒い物(0.5)
  const GEO_FS = `
    varying vec3 vNv; varying float vId; varying float vLit; varying float vTone; varying float vZ;
    void main(){
      vec3 n = normalize(vNv); if (!gl_FrontFacing) n = -n;
      float lit = clamp(vLit * 0.5 + 0.5, 0.0, 1.0);
      gl_FragColor = vec4(n.xy, vZ, floor(vId + 0.5) + lit * 0.49 + (vTone > 0.8 ? 0.5 : 0.0));
    }`;

  const QUAD_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  // 輪郭の検出：深度の段差（シルエット）、法線の折れ（稜線）、部品の境目
  const EDGE_FS = `
    uniform sampler2D tGeo; uniform vec2 uRes;
    uniform float uPx; uniform vec4 uLine;   // x weight, y taper(強弱), z detail(内側の線の量), w fogFar
    uniform float uFogNear;
    varying vec2 vUv;
    vec3 nrm(vec4 g){ return vec3(g.xy, sqrt(max(0.0, 1.0 - dot(g.xy, g.xy)))); }
    void main(){
      vec2 px = 1.0 / uRes;
      vec4 gc = texture2D(tGeo, vUv);
      float zc = gc.z; float bg = step(zc, 0.0001);
      vec3 nc = nrm(gc); float idc = floor(gc.w);
      float zmax = 0.0, ndiff = 0.0, idd = 0.0, far = 0.0;
      vec2 o[4]; o[0] = vec2(px.x, 0.0); o[1] = vec2(-px.x, 0.0); o[2] = vec2(0.0, px.y); o[3] = vec2(0.0, -px.y);
      float zs[4];
      for (int i = 0; i < 4; i++){
        vec4 g = texture2D(tGeo, vUv + o[i]);
        float z = g.z; bool b = z <= 0.0001;
        zs[i] = b ? zc * 10.0 : z;
        if (b) far = 1.0;
        else {
          zmax = max(zmax, z);
          ndiff = max(ndiff, 1.0 - dot(nc, nrm(g)));
          if (abs(floor(g.w) - idc) > 0.5) idd = 1.0;
        }
      }
      float lap = abs(zs[0] + zs[1] - 2.0 * zc) + abs(zs[2] + zs[3] - 2.0 * zc);
      float sil = 0.0;
      if (bg < 0.5) {
        sil = max(smoothstep(0.02, 0.05, (max(zmax, far * zc * 10.0) - zc) / zc), far);
        sil = max(sil, smoothstep(0.03, 0.08, lap / zc) * 0.9 * smoothstep(0.12, 0.35, nc.z));
      }
      float crease = (1.0 - bg) * smoothstep(mix(0.45, 0.16, uLine.z), mix(0.75, 0.4, uLine.z), ndiff);
      float part = (1.0 - bg) * idd;
      float e = max(sil, max(crease * 0.8, part * 0.85));
      // 太さ：外側は太く、内側は細く。近いほど太く、遠いほど細く。影の側は太く
      float f = fract(gc.w); float darkMat = step(0.5, f); float lit = (f - 0.5 * darkMat) / 0.49;
      float near = clamp(pow(7.0 / max(zc, 0.1), 0.6), 0.35, 1.7);
      float w = mix(1.3, 5.0, uLine.x) * uPx;
      w *= mix(mix(0.5, 0.75, part), 1.0, sil);
      w *= mix(1.0, mix(1.35, 0.6, smoothstep(0.3, 0.75, lit)) * near, uLine.y);
      float fog = smoothstep(uFogNear, uLine.w, zc);
      w *= 1.0 - fog * 0.6; e *= 1.0 - fog * 0.85; e = smoothstep(0.15, 0.55, e);
      gl_FragColor = vec4(e, w / 8.0, darkMat, 1.0);
    }`;

  // 太らせ（主線）＋空＋雨＋霧＋効果線 → 最終画
  const COMP_FS = `
    uniform sampler2D tShade; uniform sampler2D tEdge; uniform sampler2D tGeo;
    uniform vec2 uRes; uniform float uPx; uniform float uNear; uniform float uFar;
    uniform mat4 uInvProj; uniform mat4 uCamMat;
    uniform vec4 uSky;     // x kind(0 white,1 storm,2 night,3 dusk,4 day clouds), y darkness, z cloudiness, w seed
    uniform vec3 uMoon;    // 月の向き（ワールド） ※ uMoonOn
    uniform vec4 uMoonP;   // x on, y size, z halo, w craters
    uniform vec4 uRain;    // x amount, y angle, z length, w seed
    uniform vec4 uFx;      // x focus amount, y speed amount, z speed angle, w behindOnly(深度でキャラを避ける)
    uniform vec2 uFocus;   // 集中線の中心（0..1）
    uniform float uFxDepth;
    uniform vec4 uLine;    // x jitter, y roughness, z hatch(空の線), w crossHatch
    uniform vec4 uMist;    // x amount, y height falloff, z tone, w seed
    uniform float uAlphaBg;
    uniform float uFlash; uniform float uDebug;
    varying vec2 vUv;
    ${GLSL_NOISE}
    vec3 rayDir(vec2 uv){ vec4 p = uInvProj * vec4(uv * 2.0 - 1.0, 1.0, 1.0); p /= p.w; return normalize((uCamMat * vec4(p.xyz, 0.0)).xyz); }
    float lineCov(float u, float hw){ float fw = max(fwidth(u), 1e-4); float f = abs(fract(u) - 0.5); return 1.0 - smoothstep(hw - fw * 0.7, hw + fw * 0.7, f); }
    void main(){
      vec2 fc = gl_FragCoord.xy;
      float zg = texture2D(tGeo, vUv).z; float bg = step(zg, 0.0001);
      float shade = texture2D(tShade, vUv).r;
      float ink = 1.0 - shade;
      vec3 rd = rayDir(vUv);
      // ---- 空 ----
      float skyInk = 0.0;
      if (bg > 0.5) {
        float k = floor(uSky.x + 0.5);
        vec2 sp = rd.xz / max(0.06, rd.y + 0.12) * 0.6 + uSky.w;
        float alt = clamp(rd.y, 0.0, 1.0);
        float c = fbm2(sp * vec2(0.9, 1.6)) * 0.5 + 0.5;            // 雲の濃さ
        float c2 = fbm2(sp * vec2(2.3, 3.6) + 5.0) * 0.5 + 0.5;
        float cl = smoothstep(0.62 - uSky.z * 0.3, 0.72 - uSky.z * 0.3, c);   // 雲の塊
        float dark = uSky.y;
        float base = 0.0;
        if (k == 1.0) base = mix(dark * 0.75, dark, smoothstep(0.0, 0.5, alt));                 // 嵐：上が暗い
        else if (k == 2.0) base = dark;                                                          // 夜
        else if (k == 3.0) base = mix(dark * 0.2, dark, smoothstep(0.02, 0.6, alt));             // 夕
        else base = 0.0;
        // 雲：嵐の雲は暗い腹と、光る縁
        float rimLight = 0.0;
        if (uMoonP.x > 0.5) { float md = max(dot(rd, normalize(uMoon)), 0.0); rimLight = pow(md, 6.0); }
        float cloudD = base;
        if (k >= 1.0) {
          float belly = smoothstep(0.45, 0.85, c) * (0.55 + 0.45 * c2);
          cloudD = mix(base * 0.65, min(1.0, base + 0.25), belly);
          cloudD -= cl * (1.0 - c2) * 0.35 * (0.5 + rimLight);
          cloudD -= rimLight * 0.35 * smoothstep(0.4, 0.6, c);
          cloudD = clamp(cloudD, 0.0, 1.0);
        } else if (uSky.z > 0.05) {
          cloudD = cl * 0.25 * (1.0 - c2);
        }
        // 空は横線で描く（劇画の空）。線の太さが濃さ
        float sp1 = 6.0 * uPx;
        float u = fc.y / sp1 + vn2(vec2(fc.x / (90.0 * uPx), fc.y / (40.0 * uPx))) * 0.6 * (0.3 + uLine.x);
        float hw = clamp(cloudD * 0.52, 0.0, 0.5);
        skyInk = lineCov(u, hw);
        if (cloudD > 0.92) skyInk = 1.0;
        if (uLine.w > 0.3 && cloudD > 0.7) skyInk = max(skyInk, lineCov((fc.x * 0.5 + fc.y) / (sp1 * 1.3), clamp((cloudD - 0.7) * 1.5, 0.0, 0.5)));
        // 雲の輪郭線
        float edgeC = abs(c - (0.66 - uSky.z * 0.3)); float fwC = fwidth(c);
        float cline = (1.0 - smoothstep(fwC * 0.6, fwC * 1.6, edgeC)) * step(0.5, uSky.z + float(k >= 1.0));
        if (k >= 1.0) skyInk = mix(skyInk, 1.0 - skyInk * 0.0, 0.0);
        skyInk = max(skyInk * (1.0 - cline * step(0.5, base)), cline * (1.0 - step(0.5, base)));
        if (base > 0.5) skyInk = min(skyInk, 1.0 - cline);   // 暗い空では雲の縁が白く抜ける
        // 月
        if (uMoonP.x > 0.5) {
          vec3 m = normalize(uMoon); float ang = acos(clamp(dot(rd, m), -1.0, 1.0));
          float R = uMoonP.y;
          float fw = fwidth(ang);
          float disk = 1.0 - smoothstep(R - fw, R + fw, ang);
          float halo = (1.0 - smoothstep(R, R * (2.2 + uMoonP.z * 2.0), ang));
          skyInk *= 1.0 - halo * 0.85;
          // 月の模様
          vec3 tq = cross(m, vec3(0.0, 1.0, 0.0)); vec3 bq = cross(tq, m);
          vec2 mu = vec2(dot(rd - m, normalize(tq)), dot(rd - m, normalize(bq))) / R;
          float cr = smoothstep(0.25, 0.55, fbm2(mu * 2.2 + 3.0) * 0.5 + 0.5) * uMoonP.w;
          float moonInk = cr * 0.55 * dots(fc, 0.45, 3.0 * uPx);
          float ring = 1.0 - smoothstep(fw * 0.5, fw * 1.8 + 0.0015 * uPx, abs(ang - R));
          // 雲が月の前を横切る
          float occl = smoothstep(0.55, 0.8, c) * 0.9 * step(0.5, uSky.z);
          float mInk = max(moonInk, ring);
          skyInk = mix(skyInk, mix(mInk, skyInk, occl), disk + ring * (1.0 - disk));
        }
        if (k == 0.0 && uSky.z < 0.05) skyInk = 0.0;
        ink = skyInk;
      }
      float z = bg > 0.5 ? 1e4 : zg;
      // ---- 地面近くの霧（遠く・低い所を白く） ----
      if (uMist.x > 0.0) {
        vec3 wp = rd * min(z, 400.0);
        float camY = uCamMat[3].y;
        float hy = camY + wp.y;
        float fogN = vn2(fc / (180.0 * uPx) + uMist.w) * 0.5 + 0.5;
        float m = uMist.x * smoothstep(4.0, 60.0, z) * exp(-max(hy, 0.0) * uMist.y) * (0.6 + 0.6 * fogN);
        m = clamp(m, 0.0, 0.95);
        ink = mix(ink, uMist.z, m);
      }
      // ---- 主線：太らせる ----
      float lineInk = 0.0; float onDark = 0.0;
      vec2 jit = vec2(vn2(fc / (14.0 * uPx)), vn2(fc / (14.0 * uPx) + 7.3)) * uLine.x * 1.6 * uPx;
      for (int y = -4; y <= 4; y++) for (int x = -4; x <= 4; x++) {
        vec2 off = vec2(float(x), float(y));
        float r = length(off); if (r > 4.2) continue;
        vec4 e = texture2D(tEdge, (fc + off + jit) / uRes);
        float w = max(e.g * 8.0 * 0.5, 0.55);
        float cov = e.r * (1.0 - smoothstep(w - 0.5, w + 0.5, r));
        if (cov > lineInk) { lineInk = cov; onDark = e.b; }
      }
      // 線のかすれ
      float br = vn2(fc / (9.0 * uPx) + 11.0) * 0.5 + 0.5;
      lineInk *= 1.0 - uLine.y * smoothstep(0.62, 0.8, br) * 0.9;
      // 黒い物の輪郭は、黒の上では白い線（ふち取り）にしない＝そのまま黒
      ink = max(ink, lineInk);
      // ---- 雨 ----
      if (uRain.x > 0.0) {
        float a = uRain.y; vec2 dir = vec2(sin(a), -cos(a)); vec2 nrm = vec2(dir.y, -dir.x);
        float rainInk = 0.0, rainWhite = 0.0;
        for (int l = 0; l < 3; l++) {
          float fl = float(l);
          float sc = (7.0 + fl * 5.0) * uPx;                       // 列の間隔
          float u = dot(fc, nrm) / sc; float id = floor(u);
          float len = uRain.z * uPx * (0.6 + fl * 0.5);
          float v = dot(fc, dir) / len + h12(vec2(id, fl + uRain.w)) * 17.0;
          float seg = fract(v); float on = step(1.0 - uRain.x * (0.35 - fl * 0.08), h12(vec2(id, floor(v) + fl * 31.0)));
          float off = (h12(vec2(id, floor(v) + 5.0)) - 0.5) * 0.6;
          float lw = (0.35 + fl * 0.25) * uPx / sc;                 // 線の半幅（列の間隔に対する割合）
          float c = (1.0 - smoothstep(lw, lw + fwidth(u) * 1.0, abs(fract(u) - 0.5 - off))) * smoothstep(0.0, 0.5, seg) * (1.0 - smoothstep(0.5, 1.0, seg)) * on;
          rainInk = max(rainInk, c);
        }
        // 暗い所には白い雨、明るい所には黒い雨
        ink = mix(ink, 1.0 - step(0.5, ink), rainInk * 0.9);
      }
      // ---- 集中線・スピード線（物の後ろにだけ描ける） ----
      float behind = uFx.w > 0.5 ? step(uFxDepth, z) : 1.0;
      if (uFx.x > 0.0) {
        vec2 p = (vUv - uFocus) * vec2(uRes.x / uRes.y, 1.0);
        float ang = atan(p.y, p.x); float r = length(p);
        float nL = 260.0 * uFx.x + 60.0;
        float u = ang / 6.2832 * nL; float id = floor(u);
        float r0 = (0.22 + 0.22 * h12(vec2(id, 3.0))) * (1.15 - uFx.x * 0.35);
        float len = smoothstep(r0, r0 + 0.25, r);
        float hw = 0.5 * len * (0.25 + 0.75 * h12(vec2(id, 9.0)));
        float c = lineCov(u, hw) * step(0.35, h12(vec2(id, 5.0)));
        ink = mix(ink, max(ink, c), behind);
        float white = smoothstep(r0 * 0.9, r0 * 0.5, r) * 0.0;
      }
      if (uFx.y > 0.0) {
        float a = uFx.z; vec2 d = vec2(cos(a), sin(a)); vec2 nn = vec2(-d.y, d.x);
        float u = dot(fc, nn) / (3.0 * uPx); float id = floor(u);
        float v = dot(fc, d) / uRes.x + h12(vec2(id, 1.0));
        float on = step(1.0 - uFx.y * 0.7, h12(vec2(id, 2.0)));
        float hw = 0.42 * (0.3 + 0.7 * h12(vec2(id, 4.0))) * smoothstep(0.0, 0.5, fract(v * 0.7)) ;
        float c = lineCov(u, hw) * on;
        ink = mix(ink, max(ink, c), behind);
      }
      if (uFlash > 0.0) ink *= 1.0 - uFlash * bg;
      float alpha = mix(1.0, max(1.0 - bg, lineInk), uAlphaBg);
      gl_FragColor = vec4(vec3(1.0 - ink), alpha);
      if (uDebug > 3.5) gl_FragColor = vec4(vec3(1.0 - lineInk), 1.0); else if (uDebug > 0.5) { vec4 e = texture2D(tEdge, vUv); gl_FragColor = uDebug < 1.5 ? vec4(e.rgb, 1.0) : uDebug < 2.5 ? texture2D(tShade, vUv) : vec4(vec3(fract(zg * 0.1)), 1.0); }
    }`;

  // ---------- レンダラ ----------
  let R = null;
  function renderer() {
    if (R) return R;
    const canvas = document.createElement('canvas');
    let gl;
    try { gl = new T.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); }
    catch (e) { console.warn('styles3d: WebGL が使えません', e); return null; }
    gl.shadowMap.enabled = true; gl.shadowMap.type = T.PCFSoftShadowMap; gl.shadowMap.autoUpdate = false;
    gl.setPixelRatio(1); gl.autoClear = true;
    const inkMat = new T.ShaderMaterial({
      uniforms: T.UniformsUtils.merge([T.UniformsLib.lights, {
        uL: { value: V3(0, 1, 0) }, uCam: { value: V3() }, uRight: { value: V3(1, 0, 0) }, uUp: { value: V3(0, 1, 0) }, uFwdH: { value: V3(0, 0, -1) },
        uFocal: { value: 500 }, uPx: { value: 1 }, uH: { value: new T.Vector4() }, uA: { value: new T.Vector4() }, uF: { value: new T.Vector4() }, uL2: { value: new T.Vector4() }, uJit: { value: 0 }, uRimDir: { value: V3(0, 1, 0) },
      }]),
      vertexShader: INK_VS, fragmentShader: INK_FS, lights: true, side: T.DoubleSide, extensions: { derivatives: true },
    });
    const geoMat = new T.ShaderMaterial({ uniforms: { uL: { value: V3(0, 1, 0) } }, vertexShader: GEO_VS, fragmentShader: GEO_FS, side: T.DoubleSide });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2));
    const qScene = new T.Scene(); qScene.add(quad); const qCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const edgeMat = new T.ShaderMaterial({ uniforms: { tGeo: { value: null }, uRes: { value: new T.Vector2() }, uPx: { value: 1 }, uLine: { value: new T.Vector4() }, uFogNear: { value: 50 } }, vertexShader: QUAD_VS, fragmentShader: EDGE_FS, depthTest: false, depthWrite: false });
    const compMat = new T.ShaderMaterial({
      uniforms: {
        tShade: { value: null }, tEdge: { value: null }, tGeo: { value: null }, uRes: { value: new T.Vector2() }, uPx: { value: 1 }, uNear: { value: 0.1 }, uFar: { value: 1000 },
        uInvProj: { value: new T.Matrix4() }, uCamMat: { value: new T.Matrix4() }, uSky: { value: new T.Vector4() }, uMoon: { value: V3(0, 1, 0) }, uMoonP: { value: new T.Vector4() },
        uRain: { value: new T.Vector4() }, uFx: { value: new T.Vector4() }, uFocus: { value: new T.Vector2(0.5, 0.5) }, uFxDepth: { value: 0 }, uLine: { value: new T.Vector4() },
        uMist: { value: new T.Vector4() }, uAlphaBg: { value: 0 }, uFlash: { value: 0 }, uDebug: { value: 0 },
      }, vertexShader: QUAD_VS, fragmentShader: COMP_FS, depthTest: false, depthWrite: false, transparent: false, extensions: { derivatives: true },
    });
    R = { gl, canvas, inkMat, geoMat, edgeMat, compMat, quad, qScene, qCam, rt: null, w: 0, h: 0 };
    return R;
  }
  function targets(w, h) {
    if (R.rt && R.w === w && R.h === h) return R.rt;
    if (R.rt) Object.values(R.rt).forEach(t => t.dispose());
    const mk = (fl) => new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, format: T.RGBAFormat, type: fl ? T.FloatType : T.UnsignedByteType, depthBuffer: true });
    R.rt = { shade: mk(false), geo: mk(true), edge: mk(false) }; R.w = w; R.h = h;
    return R.rt;
  }

  // art（styles と同じ連続パラメータ）→ シェーダの値
  function artOf(opts) {
    let a = opts && (opts.art || opts) || {};
    const n = (v, d) => { v = Number(v); return Number.isFinite(v) ? clamp(v) : d; };
    const l = a.line || {};
    const TK = { none: 0, dot: 1, gradient: 2, kakeami: 3, line: 4, sand: 5 };
    return {
      hatching: n(a.hatching, 0.6), crossHatch: n(a.crossHatch, 0.5), black: n(a.black, 0.6), tone: n(a.tone, 0.2), toneKind: TK[a.toneKind] ?? 1,
      detail: n(a.detail, 0.7), perspective: n(a.perspective, 0.45), dynamism: n(a.dynamism, 0.5), grain: n(a.grain, 0.1), softness: n(a.softness, 0),
      line: { weight: n(l.weight, 0.6), taper: n(l.taper, 0.8), jitter: n(l.jitter, 0.15), roughness: n(l.roughness, 0.15) },
      rough: !!a.rough,
    };
  }

  // 場面を描く。scene: { root: THREE.Object3D, camera, light:{dir,strength,ambient,rim,flash}, sky, moon, rain, fog, mist, fx }
  // dst: 2D ctx, box: {x,y,w,h}（ctx 座標）。描いた canvas を drawImage する
  function render(ctx, S, box, opts = {}) {
    const r = renderer(); if (!r) return false;
    const art = artOf(opts);
    const tr = ctx.getTransform ? ctx.getTransform() : { a: 1, d: 1 };
    const dpr = Math.max(0.5, Math.min(3, Math.abs(tr.a) || 1)) * (opts.quality ?? 1);
    const W = Math.max(8, Math.round(box.w * dpr)), H = Math.max(8, Math.round(box.h * dpr));
    const px = Math.max(0.6, Math.sqrt(W * H) / 900) * (opts.lineScale ?? 1);   // 線の太さ・間隔の基準
    const gl = r.gl; gl.setSize(W, H, false);
    const rt = targets(W, H);
    const cam = S.camera; cam.aspect = W / H; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const scene = S.scene;
    // 光
    const L = S.light || {}; const ldir = V3(...(L.dir || [-0.5, 0.8, 0.4])).normalize();
    const dl = S._dl || (S._dl = new T.DirectionalLight(0xffffff, 1));
    if (!dl.parent) { scene.add(dl); scene.add(dl.target); }
    const bs = S.bounds || { c: [0, 0, 0], r: 40 };
    dl.position.set(bs.c[0] + ldir.x * bs.r * 2, bs.c[1] + ldir.y * bs.r * 2, bs.c[2] + ldir.z * bs.r * 2); dl.target.position.set(...bs.c);
    dl.castShadow = L.shadow !== false;
    const sc = dl.shadow.camera; sc.left = -bs.r; sc.right = bs.r; sc.top = bs.r; sc.bottom = -bs.r; sc.near = 0.5; sc.far = bs.r * 4.5; sc.updateProjectionMatrix();
    const ms = W * H > 900000 ? 4096 : 2048;
    if (dl.shadow.mapSize.x !== ms) { dl.shadow.mapSize.set(ms, ms); if (dl.shadow.map) { dl.shadow.map.dispose(); dl.shadow.map = null; } }
    dl.shadow.bias = -0.0006; dl.shadow.normalBias = 0.03; dl.shadow.radius = 1.5;
    dl.updateMatrixWorld(); dl.target.updateMatrixWorld();
    // ink 材質
    const U = r.inkMat.uniforms;
    U.uL.value.copy(ldir);
    cam.getWorldPosition(U.uCam.value);
    const e = cam.matrixWorld.elements; U.uRight.value.set(e[0], e[1], e[2]).normalize(); U.uUp.value.set(e[4], e[5], e[6]).normalize();
    const fw = V3(-e[8], 0, -e[10]); if (fw.lengthSq() < 1e-6) fw.set(0, 0, -1); U.uFwdH.value.copy(fw.normalize());
    const focal = H / (2 * Math.tan(cam.fov * Math.PI / 360)); U.uFocal.value = focal;
    U.uPx.value = px;
    const rough = art.rough;
    U.uH.value.set(rough ? 0.35 : art.hatching, rough ? 0 : art.crossHatch, rough ? 0.1 : art.black, rough ? 0 : art.tone);
    U.uA.value.set(art.detail, art.grain, art.toneKind, L.ambient ?? 0.18);
    const fog = S.fog || {}; U.uF.value.set(fog.near ?? 40, fog.far ?? 160, fog.tone ?? 0, fog.amount ?? 0.8);
    U.uL2.value.set(L.strength ?? 0.95, L.rim ?? 0.0, L.flash ?? 0, art.softness);
    U.uJit.value = art.line.jitter; U.uRimDir.value.set(...(L.rimDir || [-ldir.x, Math.max(0.2, ldir.y), -ldir.z])).normalize();
    r.geoMat.uniforms.uL.value.copy(ldir);
    // 1) 陰影＋ハッチ（影の計算もここで）
    const meshes = []; scene.traverse(o => { if (o.isMesh) meshes.push(o); });
    meshes.forEach(m => { m.material = r.inkMat; m.castShadow = m.userData.noShadow ? false : true; m.receiveShadow = true; m.frustumCulled = false; });
    gl.shadowMap.needsUpdate = true;
    gl.setClearColor(0xffffff, 1);
    gl.setRenderTarget(rt.shade); gl.clear(); gl.render(scene, cam);
    // 2) 法線・部品番号・深度
    meshes.forEach(m => { m.material = r.geoMat; });
    gl.setClearColor(0x000000, 0); gl.setRenderTarget(rt.geo); gl.clear(); gl.render(scene, cam);
    // 3) 輪郭
    const EU = r.edgeMat.uniforms;
    EU.tGeo.value = rt.geo.texture; EU.uRes.value.set(W, H); EU.uPx.value = px;
    EU.uLine.value.set(rough ? 0.35 : art.line.weight, art.line.taper, art.detail, fog.far ?? 160); EU.uFogNear.value = fog.near ?? 40;
    r.quad.material = r.edgeMat; gl.setRenderTarget(rt.edge); gl.render(r.qScene, r.qCam);
    // 4) 仕上げ
    const CU = r.compMat.uniforms;
    CU.tShade.value = rt.shade.texture; CU.tEdge.value = rt.edge.texture; CU.tGeo.value = rt.geo.texture;
    CU.uRes.value.set(W, H); CU.uPx.value = px; CU.uNear.value = cam.near; CU.uFar.value = cam.far;
    CU.uInvProj.value.copy(cam.projectionMatrixInverse); CU.uCamMat.value.copy(cam.matrixWorld);
    const sky = S.sky || {}; const SK = { white: 0, none: 0, storm: 1, night: 2, dusk: 3, day: 4 };
    CU.uSky.value.set(SK[sky.kind] ?? 0, sky.dark ?? 0.8, sky.clouds ?? 0, sky.seed ?? 0);
    const moon = S.moon; if (moon) { CU.uMoon.value.set(...moon.dir); CU.uMoonP.value.set(1, moon.size ?? 0.06, moon.halo ?? 0.5, moon.craters ?? 1); } else CU.uMoonP.value.set(0, 0, 0, 0);
    const rain = S.rain; CU.uRain.value.set(rain ? (rain.amount ?? 0.7) : 0, rain ? (rain.angle ?? 0.25) : 0, rain ? (rain.length ?? 40) : 40, rain ? (rain.seed ?? 1) : 0);
    const fx = S.fx || {}; CU.uFx.value.set(fx.focus ?? 0, fx.speed ?? 0, fx.angle ?? 0, fx.behind ? 1 : 0); CU.uFocus.value.set(...(fx.center || [0.5, 0.5])); CU.uFxDepth.value = fx.depth ?? 0;
    CU.uLine.value.set(art.line.jitter, art.line.roughness, art.hatching, art.crossHatch);
    const mist = S.mist; CU.uMist.value.set(mist ? (mist.amount ?? 0.6) : 0, mist ? (mist.falloff ?? 0.25) : 0, mist ? (mist.tone ?? 0) : 0, mist ? (mist.seed ?? 3) : 0);
    CU.uAlphaBg.value = S.transparent ? 1 : 0; CU.uDebug.value = opts.debug || 0; CU.uFlash.value = S.flash ?? 0;
    r.quad.material = r.compMat; gl.setRenderTarget(null); gl.setClearColor(0xffffff, 0); gl.clear(); gl.render(r.qScene, r.qCam);
    ctx.drawImage(r.canvas, 0, 0, W, H, box.x, box.y, box.w, box.h);
    return { W, H, px };
  }

  // 3D の点 → box 内の 2D 座標（2D の顔などを重ねるため）
  function project(S, box, p) {
    const v = V3(...p).project(S.camera);
    return { x: box.x + (v.x * 0.5 + 0.5) * box.w, y: box.y + (0.5 - v.y * 0.5) * box.h, z: v.z };
  }

  Object.assign(M3, { T, seed, rand, rr, pick, hashStr, clamp, lerp, sstep, noise3, fbm3, V3, M, Mab, displace, displaceWelded, tube, lathe, rock, stone, Builder, PAT, renderer, render, project, artOf });
})();

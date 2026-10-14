// 黄泉還：形づくり（動かない物は材質ごとに1つにまとめて、軽く描く）
const MATC = {};
// 材質：名前はテクスチャ名。色・発光・透明などは opts で
function M(name, o = {}) {
  const key = name + JSON.stringify(o); let m = MATC[key]; if (m) return m;
  const p = {};
  if (name && name !== 'col') p.map = T(name);
  if (o.c) p.color = new THREE.Color(o.c);
  if (o.e && !o.basic) { p.emissive = new THREE.Color(o.e); if (o.ei != null) p.emissiveIntensity = o.ei; if (o.em) p.emissiveMap = p.map; }
  if (o.t) { p.transparent = true; p.opacity = o.t; p.depthWrite = !!o.dw; }
  if (o.at) p.alphaTest = o.at;
  if (o.ds) p.side = THREE.DoubleSide;
  m = o.basic ? new THREE.MeshBasicMaterial(p) : new THREE.MeshLambertMaterial(p);
  if (o.fog === false) m.fog = false;
  m.userData.m = p.map ? p.map.userData.m : 1; MATC[key] = m; return m;
}
const _m4 = new THREE.Matrix4(), _v3 = new THREE.Vector3(), _n3 = new THREE.Matrix3();
class GB {
  constructor() { this.parts = new Map(); this.stack = []; this.mx = new THREE.Matrix4(); }
  push(x = 0, y = 0, z = 0, ry = 0, s = 1) { this.stack.push(this.mx.clone()); const t = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(s, s, s)); this.mx.multiply(t); return this; }
  pushM(m) { this.stack.push(this.mx.clone()); this.mx.multiply(m); return this; }
  pop() { this.mx = this.stack.pop(); return this; }
  arr(mat) { let a = this.parts.get(mat); if (!a) { a = { p: [], n: [], u: [] }; this.parts.set(mat, a); } return a; }
  // 4点（表から見て反時計回り）の面。uv は [[u,v]×4]
  quad(mat, A, B, C, D, uv) {
    const a = this.arr(mat), P = [A, B, C, D].map(v => _v3.set(v[0], v[1], v[2]).applyMatrix4(this.mx).toArray());
    const e1 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]], e2 = [P[3][0] - P[1][0], P[3][1] - P[1][1], P[3][2] - P[1][2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = hyp(...n) || 1; n = n.map(v => v / l);
    for (const i of [0, 1, 2, 0, 2, 3]) { a.p.push(...P[i]); a.n.push(...n); a.u.push(uv[i][0], uv[i][1]); }
  }
  tri(mat, A, B, C, uv) {
    const a = this.arr(mat), P = [A, B, C].map(v => _v3.set(v[0], v[1], v[2]).applyMatrix4(this.mx).toArray());
    const e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const l = hyp(...n) || 1; n = n.map(v => v / l);
    for (let i = 0; i < 3; i++) { a.p.push(...P[i]); a.n.push(...n); a.u.push(uv[i][0], uv[i][1]); }
  }
  // 箱（中心・大きさ）。uv は材のメートル単位で連続。o.fit=true なら各面0..1。o.no='+y-y...' で面を省く
  box(mat, cx, cy, cz, sx, sy, sz, o = {}) {
    const m = o.m || mat.userData.m || 1, x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    const F = (a, b, c, d, uv) => this.quad(mat, a, b, c, d, uv);
    const U = (u0, v0, u1, v1) => o.fit ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[u0 / m, v0 / m], [u1 / m, v0 / m], [u1 / m, v1 / m], [u0 / m, v1 / m]];
    const no = o.no || '';
    if (!no.includes('+z')) F([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], U(x0, y0, x1, y1));
    if (!no.includes('-z')) F([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], U(-x1, y0, -x0, y1));
    if (!no.includes('+x')) F([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], U(-z1, y0, -z0, y1));
    if (!no.includes('-x')) F([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], U(z0, y0, z1, y1));
    if (!no.includes('+y')) F([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], U(x0, -z1, x1, -z0));
    if (!no.includes('-y')) F([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], U(x0, z0, x1, z1));
    return this;
  }
  // 縦の円柱（上下のふた付き）。r2 で上下の太さを変えられる（円すい台）
  cyl(mat, cx, y0, cz, r, h, seg = 8, o = {}) {
    const m = o.m || mat.userData.m || 1, r2 = o.r2 != null ? o.r2 : r, y1 = y0 + h, circ = TAU * r;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
      const p = (a, rr, y) => [cx + Math.sin(a) * rr, y, cz + Math.cos(a) * rr];
      const u0 = o.fit ? i / seg : (i / seg * circ) / m, u1 = o.fit ? (i + 1) / seg : ((i + 1) / seg * circ) / m, v1 = o.fit ? 1 : h / m;
      this.quad(mat, p(a0, r, y0), p(a1, r, y0), p(a1, r2, y1), p(a0, r2, y1), [[u0, 0], [u1, 0], [u1, v1], [u0, v1]]);
      if (!o.open) {
        if (r2 > 0.001) this.tri(mat, [cx, y1, cz], p(a0, r2, y1), p(a1, r2, y1), [[0.5, 0.5], [0.5 + Math.sin(a0) * 0.5, 0.5 + Math.cos(a0) * 0.5], [0.5 + Math.sin(a1) * 0.5, 0.5 + Math.cos(a1) * 0.5]]);
        if (r > 0.001) this.tri(mat, [cx, y0, cz], p(a1, r, y0), p(a0, r, y0), [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5]]);
      }
    }
    return this;
  }
  // 横向きの円柱（x軸方向）
  cylX(mat, x0, cy, cz, r, len, seg = 8, o = {}) { this.push(x0, cy, cz, 0); this.pushM(new THREE.Matrix4().makeRotationZ(-PI / 2)); this.cyl(mat, 0, 0, 0, r, len, seg, o); this.pop(); this.pop(); return this; }
  cylZ(mat, cx, cy, z0, r, len, seg = 8, o = {}) { this.push(cx, cy, z0, 0); this.pushM(new THREE.Matrix4().makeRotationX(PI / 2)); this.cyl(mat, 0, 0, 0, r, len, seg, o); this.pop(); this.pop(); return this; }
  // 低いポリゴンの球
  ball(mat, cx, cy, cz, rx, ry = rx, rz = rx, seg = 6) {
    for (let j = 0; j < seg; j++) for (let i = 0; i < seg * 2; i++) {
      const t0 = j / seg * PI, t1 = (j + 1) / seg * PI, p0 = i / (seg * 2) * TAU, p1 = (i + 1) / (seg * 2) * TAU;
      const P = (t, p) => [cx + Math.sin(t) * Math.cos(p) * rx, cy + Math.cos(t) * ry, cz + Math.sin(t) * Math.sin(p) * rz];
      const uv = [[i / (seg * 2), 1 - j / seg], [(i + 1) / (seg * 2), 1 - j / seg], [(i + 1) / (seg * 2), 1 - (j + 1) / seg], [i / (seg * 2), 1 - (j + 1) / seg]];
      this.quad(mat, P(t0, p0), P(t0, p1), P(t1, p1), P(t1, p0), uv);
    }
    return this;
  }
  // 平らな板（絵・紙・敷物など）：中心と向き。face='+z' なら手前向き
  plate(mat, cx, cy, cz, w, h, face = '+z', o = {}) {
    const hw = w / 2, hh = h / 2, uv = o.uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
    const V = { '+z': [[cx - hw, cy - hh, cz], [cx + hw, cy - hh, cz], [cx + hw, cy + hh, cz], [cx - hw, cy + hh, cz]], '-z': [[cx + hw, cy - hh, cz], [cx - hw, cy - hh, cz], [cx - hw, cy + hh, cz], [cx + hw, cy + hh, cz]], '+x': [[cx, cy - hh, cz + hw], [cx, cy - hh, cz - hw], [cx, cy + hh, cz - hw], [cx, cy + hh, cz + hw]], '-x': [[cx, cy - hh, cz - hw], [cx, cy - hh, cz + hw], [cx, cy + hh, cz + hw], [cx, cy + hh, cz - hw]], '+y': [[cx - hw, cy, cz + hh], [cx + hw, cy, cz + hh], [cx + hw, cy, cz - hh], [cx - hw, cy, cz - hh]] }[face];
    this.quad(mat, ...V, uv); return this;
  }
  build(group, o = {}) {
    for (const [mat, a] of this.parts) {
      if (!a.p.length) continue;
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(a.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(a.n, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(a.u, 2));
      geo.computeBoundingSphere(); const mesh = new THREE.Mesh(geo, mat); mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      if (o.shadow) mesh.receiveShadow = true; if (mat.transparent) mesh.renderOrder = 2; group.add(mesh);
    }
    this.parts.clear(); return group;
  }
}
// 動く物用：箱1つのメッシュ（キャラクターや仕掛け）
function boxMesh(mat, sx, sy, sz, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); return m; }
function gbMesh(fn) { const g = new GB(); fn(g); return g.build(new THREE.Group()); }

// 黄泉還：テスト用にページの中へ入れる小道具
// reachPts(R)：扉の前から歩いて行ける所だけを、0.25m 間隔で集める（[x, y, z] の並び）
module.exports = `
window.reachPts = function (R, S = 0.25) {
  const xs = R.rects.flatMap(q => [q[0], q[2]]), zs = R.rects.flatMap(q => [q[1], q[3]]), X0 = Math.min(...xs), Z0 = Math.min(...zs);
  const seen = new Map(), q = [], out = [];
  const push = (i, j, y) => { const k = i + ',' + j + ',' + Math.round(y * 2); if (seen.has(k)) return; seen.set(k, 1); q.push([i, j, y]); out.push([X0 + i * S, y, Z0 + j * S]); };
  for (const d of R.doors) { const x = d.spawn[0], z = d.spawn[1]; const i = Math.round((x - X0) / S), j = Math.round((z - Z0) / S); const y = standAt(R, X0 + i * S, Z0 + j * S, d.y || 0, 0.28, 'pl'); if (y != null) push(i, j, y); }
  while (q.length) { const [i, j, y] = q.shift(); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj, y2 = standAt(R, X0 + ni * S, Z0 + nj * S, y, 0.28, 'pl'); if (y2 != null && Math.abs(y2 - y) < 0.35) push(ni, nj, y2); } }
  return out;
};
`;

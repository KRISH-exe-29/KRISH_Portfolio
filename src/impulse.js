// The standard lightning impulse, 1.2/50 µs (IEC 60060-1), as the double exponential
// u(t) = e^(-t/τ1) - e^(-t/τ2), scaled so the crest is 1 per unit. It falls to half at 50 µs.
const TAU1 = 68.2
const TAU2 = 0.405
export const END = 50 // µs
export const CREST = (Math.log(TAU1 / TAU2) * TAU1 * TAU2) / (TAU1 - TAU2) // ≈ 2.09 µs
const raw = (t) => Math.exp(-t / TAU1) - Math.exp(-t / TAU2)
const PEAK = raw(CREST)
export const volts = (t) => (t <= 0 ? 0 : raw(t) / PEAK)

// The front is over in two microseconds and the tail takes fifty, so the time axis is stretched:
// log-like near zero, so the rise gets as much room as the fall.
const K = 0.35
const W = Math.log1p(END / K)
export const warp = (t) => Math.log1p(Math.max(0, t) / K) / W
export const unwarp = (x) => K * Math.expm1(x * W)

// A small seeded generator, so the bolt is the same shape on every visit.
function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let r = Math.imul(s ^ (s >>> 15), 1 | s)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// One jagged channel from a to b, built by midpoint displacement. Points are in a 1 x 1 box.
function channel(rand, a, b, rough, depth) {
  let pts = [a, b]
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]]
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1]
      const q = pts[i]
      const len = Math.hypot(q.x - p.x, q.y - p.y)
      const off = (rand() - 0.5) * len * rough
      next.push({ x: (p.x + q.x) / 2 - ((q.y - p.y) / len) * off, y: (p.y + q.y) / 2 + ((q.x - p.x) / len) * off }, q)
    }
    pts = next
  }
  return pts
}

// The strike: a main channel from cloud to ground, nine branches (one per production app),
// and a scatter of short twigs. `at` is how far down the main channel a branch leaves it (0 to 1).
export function bolt(seed = 2026) {
  const rand = seeded(seed)
  const main = channel(rand, { x: 0.56, y: -0.04 }, { x: 0.48, y: 1.04 }, 0.9, 7)
  const fork = (from, dir, length, rough, depth) => {
    const angle = dir * (0.35 + rand() * 0.7) + Math.PI / 2
    const to = { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length }
    return channel(rand, from, to, rough, depth)
  }
  const branches = Array.from({ length: 9 }, (_, i) => {
    const at = 0.1 + i * 0.085 + rand() * 0.03
    const from = main[Math.floor(at * (main.length - 1))]
    return { at, pts: fork(from, i % 2 ? 1 : -1, 0.16 + rand() * 0.14, 0.8, 5) }
  })
  const twigs = Array.from({ length: 26 }, () => {
    const at = 0.04 + rand() * 0.9
    const from = main[Math.floor(at * (main.length - 1))]
    return { at, pts: fork(from, rand() < 0.5 ? 1 : -1, 0.03 + rand() * 0.06, 1, 3), flicker: rand() }
  })
  return { main, branches, twigs }
}

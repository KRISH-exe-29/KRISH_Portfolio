// Pure maths for the kolam: lay dots, weave one curved line around them, and map scroll
// to how much of the line is drawn. No DOM, so `node src/kolam.check.js` can test it.

const TURN = Math.PI / 4 // a loop is drawn through eight points round the dot
const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l] }

// The line passes each dot on alternating sides, `reach` px away. Where the route turns a
// corner it loops once right round the dot, the way a kolam does.
// Returns the points the curve goes through, and which point belongs to each dot.
export function weave(dots, reach) {
  const knots = []
  const knotOf = []
  dots.forEach((dot, k) => {
    const prev = dots[Math.max(0, k - 1)]
    const next = dots[Math.min(dots.length - 1, k + 1)]
    const [dx, dy] = unit(next.x - prev.x, next.y - prev.y)
    const side = k % 2 ? 1 : -1
    const from = Math.atan2(dx * side, -dy * side) // angle of the passing point, seen from the dot
    knotOf.push(knots.length)
    knots.push({ x: dot.x + Math.cos(from) * reach, y: dot.y + Math.sin(from) * reach })
    const [ax, ay] = unit(dot.x - prev.x, dot.y - prev.y)
    const [bx, by] = unit(next.x - dot.x, next.y - dot.y)
    const corner = k > 0 && k < dots.length - 1 && ax * bx + ay * by < 0.85
    if (corner) for (let j = 1; j <= 8; j++) knots.push({ x: dot.x + Math.cos(from + side * j * TURN) * reach, y: dot.y + Math.sin(from + side * j * TURN) * reach })
  })
  return { knots, knotOf }
}

// A smooth curve through every knot (Catmull-Rom, written out as cubic Beziers). Also walks
// the curve to measure it, so nothing has to ask the browser for path lengths later.
export function trace(knots, closed = false) {
  const n = knots.length
  const at = (i) => (closed ? knots[((i % n) + n) % n] : knots[Math.max(0, Math.min(n - 1, i))])
  const f = (v) => v.toFixed(1)
  let d = `M${f(knots[0].x)} ${f(knots[0].y)}`
  const lens = [0] // length along the curve at each knot
  const sLen = [0]
  const sX = [knots[0].x]
  const sY = [knots[0].y]
  let total = 0
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += `C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`
    for (let s = 1; s <= 6; s++) {
      const t = s / 6
      const u = 1 - t
      const x = u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x
      const y = u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y
      total += Math.hypot(x - sX.at(-1), y - sY.at(-1))
      sLen.push(total); sX.push(x); sY.push(y)
    }
    lens.push(total)
  }
  return { d, lens, total, sLen, sX, sY }
}

// The line down the whole page. boxes are the chapters ({ top, bottom } in page px). The
// line runs down the left of the first chapter, crosses to the right of the next, and so on.
export function route({ width, lane, step, boxes }) {
  const dots = []
  const firstDot = []
  boxes.forEach((box, i) => {
    const x = i % 2 ? width - lane / 2 : lane / 2
    const top = box.top - step / 2
    if (i) {
      const last = dots.at(-1)
      const hops = Math.max(2, Math.round(Math.hypot(x - last.x, top - last.y) / step))
      for (let j = 1; j < hops; j++) dots.push({ x: last.x + ((x - last.x) * j) / hops, y: last.y + ((top - last.y) * j) / hops })
    }
    firstDot.push(dots.length)
    for (let y = top; y <= box.bottom + step / 2; y += step) dots.push({ x, y })
  })
  const { knots, knotOf } = weave(dots, step * 0.36)
  const line = trace(knots)
  // How far down the page the line has reached by each sample. This only ever grows, so
  // scroll position can be looked up in it.
  const deepest = []
  line.sY.forEach((y, i) => deepest.push(i ? Math.max(deepest[i - 1], y) : y))
  const dotAt = knotOf.map((k) => line.lens[k])
  return { ...line, dots, dotAt, deepest, chapterAt: firstDot.map((k) => dotAt[k]) }
}

// How much line is drawn when its tip should be level with page position tipY.
export function drawnAt(tipY, r) {
  let [lo, hi] = [0, r.deepest.length - 1]
  if (!(tipY > r.deepest[0])) return 0
  if (tipY >= r.deepest[hi]) return r.total
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (r.deepest[mid] <= tipY) lo = mid
    else hi = mid
  }
  return r.sLen[lo] + ((r.sLen[hi] - r.sLen[lo]) * (tipY - r.deepest[lo])) / Math.max(1e-6, r.deepest[hi] - r.deepest[lo])
}

// Where the tip of the line is once `len` of it is drawn.
export function headAt(len, r) {
  let [lo, hi] = [0, r.sLen.length - 1]
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (r.sLen[mid] <= len) lo = mid
    else hi = mid
  }
  const t = Math.max(0, Math.min(1, (len - r.sLen[lo]) / Math.max(1e-6, r.sLen[hi] - r.sLen[lo])))
  return { x: r.sX[lo] + (r.sX[hi] - r.sX[lo]) * t, y: r.sY[lo] + (r.sY[hi] - r.sY[lo]) * t }
}

// How many entries of a rising list (dots, chapters) the line has reached.
export const reached = (len, marks) => marks.filter((m) => m <= len).length

// The pinned kolam for the internships: n closed rings round one dot, each with more petals.
export function rings(n) {
  return [...Array(n).keys()].map((k) => {
    const petals = 4 * (k + 1)
    const knots = [...Array(petals * 4).keys()].map((j) => {
      const angle = (j / (petals * 4)) * Math.PI * 2
      const r = 40 + k * 30 + 9 * Math.cos(angle * petals)
      return { x: 200 + Math.cos(angle) * r, y: 200 + Math.sin(angle) * r }
    })
    return trace(knots, true).d + 'Z'
  })
}

// The pinned kolam for the apps: nine dots, threaded row by row with one line.
export function thread() {
  const dots = [...Array(9).keys()].map((k) => {
    const row = Math.floor(k / 3)
    const col = row % 2 ? 2 - (k % 3) : k % 3
    return { x: 80 + col * 120, y: 80 + row * 120 }
  })
  const { knots, knotOf } = weave([{ x: 80, y: -20 }, ...dots, { x: 320, y: 420 }], 44)
  const line = trace(knots)
  return { d: line.d, total: line.total, dots, dotAt: knotOf.slice(1, -1).map((k) => line.lens[k]) }
}

// One plucked string (Karplus-Strong): a burst of noise fed round a short loop that
// averages itself quieter. Returns raw samples; audio.js wraps them in an AudioBuffer.
export function pluck(freq, sampleRate, seconds, rand = Math.random) {
  const period = Math.max(2, Math.round(sampleRate / freq))
  const loop = Float32Array.from({ length: period }, () => rand() * 2 - 1)
  const out = new Float32Array(Math.floor(sampleRate * seconds))
  for (let i = 0; i < out.length; i++) {
    const k = i % period
    out[i] = loop[k]
    loop[k] = 0.4975 * (loop[k] + loop[(k + 1) % period])
  }
  return out
}

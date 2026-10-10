// Pure maths for the swarm: which two shapes we are between, and turning a rastered
// drawing into particle positions. No DOM, so `node src/morph.check.js` can test it.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (t) => t * t * (3 - 2 * t)

// y is the middle of the viewport in document space, tops[i] is where chapter i starts.
// A shape holds while its chapter is on screen and morphs over `span` px around each boundary.
export function segment(y, tops, span) {
  span = Math.max(1, span)
  let k = 0
  for (let i = 1; i < tops.length; i++) if (y >= tops[i] - span / 2) k = i
  if (!k) return { from: 0, to: 0, mix: 0 }
  return { from: k - 1, to: k, mix: smooth(clamp((y - tops[k] + span / 2) / span)) }
}

// pixels is a flat [x0, y0, x1, y1, ...] list of filled raster pixels. Returns exactly n
// points as a Float32Array, centred, scaled to fit [-1, 1] with the aspect kept, y pointing up.
export function sample(pixels, n, rand = Math.random) {
  const out = new Float32Array(n * 2)
  const filled = pixels.length >> 1
  if (!filled) return dust(n, rand)
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  for (let i = 0; i < filled; i++) {
    x0 = Math.min(x0, pixels[i * 2]); x1 = Math.max(x1, pixels[i * 2] + 1)
    y0 = Math.min(y0, pixels[i * 2 + 1]); y1 = Math.max(y1, pixels[i * 2 + 1] + 1)
  }
  const scale = 2 / Math.max(x1 - x0, y1 - y0)
  for (let i = 0; i < n; i++) {
    const p = Math.min(filled - 1, Math.floor(rand() * filled))
    out[i * 2] = (pixels[p * 2] + rand() - (x0 + x1) / 2) * scale
    out[i * 2 + 1] = -(pixels[p * 2 + 1] + rand() - (y0 + y1) / 2) * scale
  }
  return out
}

// Loose filings scattered over the whole sheet.
export function dust(n, rand = Math.random) {
  const out = new Float32Array(n * 2)
  for (let i = 0; i < n; i++) {
    out[i * 2] = (rand() * 2 - 1) * 1.8
    out[i * 2 + 1] = rand() * 2 - 1
  }
  return out
}

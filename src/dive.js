// Pure maths for the dive: how deep the camera is, and what each scene looks like from there.
// No DOM in here, so `node src/dive.check.js` can test it.

export const LEVELS = [
  { id: 'grid', volts: 400000, place: 'Transmission line', bg: '#103A8E', ink: '#EEF4FF' },
  { id: 'bay', volts: 161000, place: 'Transformer test bay', bg: '#1C2733', ink: '#E3EAF0' },
  { id: 'panel', volts: 415, place: 'Control panel', bg: '#C8CCC6', ink: '#14181A' },
  { id: 'board', volts: 3.3, place: 'Circuit board', bg: '#0A5236', ink: '#F4ECCB' },
  { id: 'chip', volts: 1.2, place: 'Inside the chip', bg: '#0E0B16', ink: '#ECE9F5' },
  { id: 'ground', volts: 0, place: 'Ground', bg: '#2B1D13', ink: '#F7ECDC' },
]

export const ZOOM = 14 // how much bigger a scene gets between arriving and being flown through
const DRIFT = 0.08 // the camera keeps creeping forward while you read a level

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (t) => t * t * (3 - 2 * t)

// tops[i] is the document y of level i's section, which opens with an empty "gate" of
// `gate` px that the camera flies through. Returns a depth: i while reading level i,
// fractional while flying from one level to the next.
export function depth(y, tops, vh, gate, end) {
  const fly = (i) => [tops[i] - vh * 0.5, tops[i] + gate - vh] // scroll range of the flight into level i
  let k = 0
  while (k < tops.length - 1 && y >= fly(k + 1)[0]) k++
  const [a, b] = k ? fly(k) : [0, 0]
  if (k && y < b) return k - 1 + DRIFT + (1 - DRIFT) * smooth((y - a) / (b - a))
  const next = k < tops.length - 1 ? fly(k + 1)[0] : end
  return k + DRIFT * clamp((y - b) / Math.max(1, next - b))
}

// Scene i seen from depth d. It grows out of the distance, holds, then swallows the camera.
export function scene(d, i) {
  const rel = d - i
  const opacity = rel < 0 ? clamp((rel + 0.85) / 0.6) : 1 - clamp((rel - 0.3) / 0.55)
  return { scale: ZOOM ** rel, opacity }
}

// The voltage read-out between two levels. Voltage ratios are huge, so blend on a log scale.
export function voltage(d) {
  const i = clamp(Math.floor(d), 0, LEVELS.length - 1)
  const j = Math.min(i + 1, LEVELS.length - 1)
  const t = clamp((d - i - DRIFT) / (1 - DRIFT))
  const a = LEVELS[i].volts
  const b = LEVELS[j].volts
  return b > 0 ? a * (b / a) ** t : a * (1 - t)
}

export function volts(v) {
  if (v >= 1000) return `${Math.round(v / 1000)} kV`
  if (v >= 10) return `${Math.round(v)} V`
  if (v >= 0.05) return `${v.toFixed(1)} V`
  return '0 V'
}

const rgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16))
// Colour between two levels, used for the stage background and the gauge ink.
export function blend(d, key) {
  const i = clamp(Math.floor(d), 0, LEVELS.length - 1)
  const j = Math.min(i + 1, LEVELS.length - 1)
  const t = smooth(clamp((d - i - DRIFT) / (1 - DRIFT)))
  const a = rgb(LEVELS[i][key])
  const b = rgb(LEVELS[j][key])
  return `rgb(${a.map((c, k) => Math.round(c + (b[k] - c) * t)).join(' ')})`
}

// The page is one SFRA sweep. Sweep frequency response analysis injects a signal into a
// transformer winding from 20 Hz to 2 MHz and plots what comes back; each frequency band
// reads a different part of the machine. Here, scroll position is the frequency.
export const F_MIN = 20
export const F_MAX = 2e6

// Oldest reading first: the order the sweep passes through them.
export const BANDS = {
  core: { id: 'core', from: 20, to: 2e3, reads: 'the core' },
  windings: { id: 'windings', from: 2e3, to: 2e4, reads: 'the main windings' },
  interaction: { id: 'interaction', from: 2e4, to: 4e5, reads: 'how the windings interact' },
  leads: { id: 'leads', from: 4e5, to: 2e6, reads: 'the leads and connections' },
}

// Indian phase colours: red, yellow, blue.
export const PHASES = [
  { name: 'R', color: '#e4322b' },
  { name: 'Y', color: '#f5c52b' },
  { name: 'B', color: '#2d6cf6' },
]

const DECADES = Math.log10(F_MAX / F_MIN)
export const xOf = (f) => Math.log10(f / F_MIN) / DECADES // 0 at 20 Hz, 1 at 2 MHz
export const fOf = (x) => F_MIN * 10 ** (x * DECADES)

export function fmt(f) {
  if (f < 1e3) return `${f < 100 ? f.toFixed(1) : Math.round(f)} Hz`
  if (f < 1e6) return `${(f / 1e3).toPrecision(3)} kHz`
  return `${(f / 1e6).toFixed(2)} MHz`
}

// [centre on the log axis 0..1, depth in dB, width]. Negative depth is an anti-resonance.
const SHAPE = [
  [0.27, -40, 0.05], [0.38, 14, 0.06], [0.47, -18, 0.02], [0.56, -25, 0.015], [0.62, 10, 0.03],
  [0.66, -14, 0.02], [0.78, -22, 0.012], [0.84, 12, 0.04], [0.9, -16, 0.02],
]
const bell = (x, c, w) => Math.exp(-(((x - c) / w) ** 2))

// Magnitude in dB (about -85 to -5) for one phase. The three phases nearly overlap, as they
// should on a healthy unit; the outer limbs (R, B) show a second core dip the centre limb lacks.
export function response(phase, f) {
  const x = xOf(f)
  const skew = (phase - 1) * 0.006
  let db = -30 + 18 * x
  for (const [c, depth, w] of SHAPE) db += depth * (1 + (phase - 1) * 0.08) * bell(x, c + skew, w)
  if (phase !== 1) db -= 22 * bell(x, 0.325 + skew, 0.025)
  return db
}

// Frequency under the middle of the viewport: each [data-band] section spans its own range.
let bands = []
export function readSweep() {
  if (!bands.length) bands = [...document.querySelectorAll('[data-band]')]
  const mid = window.innerHeight / 2
  let f = F_MIN
  for (const [i, el] of bands.entries()) {
    const r = el.getBoundingClientRect()
    if (r.top > mid) break
    // The last band ends where the page does, so the sweep reaches 2 MHz at the bottom.
    const span = i === bands.length - 1 ? r.height - mid : r.height
    const t = Math.min(1, (mid - r.top) / span)
    const from = Number(el.dataset.from)
    f = from * (Number(el.dataset.to) / from) ** t
  }
  return f
}

// One shared frame loop: subscribers get the current frequency whenever it changes.
const subs = new Set()
let last = 0
function tick() {
  const f = readSweep()
  if (f !== last) {
    last = f
    subs.forEach((fn) => fn(f))
  }
  if (subs.size) requestAnimationFrame(tick)
}
export function onSweep(fn) {
  subs.add(fn)
  if (subs.size === 1) requestAnimationFrame(tick)
  fn(last || F_MIN)
  return () => subs.delete(fn)
}

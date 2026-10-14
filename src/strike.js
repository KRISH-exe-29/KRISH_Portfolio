// Draws the strike on a fixed canvas behind the page.
// Before the crest a faint stepped leader feels its way down; at the crest the return stroke
// lights the whole channel; after it, the glow follows the impulse back down toward half.
import { bolt, volts, CREST } from './impulse.js'

const BOLT = bolt()
const STEPS = 22 // the leader moves in jumps, as a real stepped leader does

export function startStrike(canvas, read, calm) {
  const ctx = canvas.getContext('2d')
  let w = 0
  let h = 0
  let paths = []
  let frame = 0
  let dirty = true

  const toPx = (pts) => {
    const out = pts.map((p) => [p.x * w, p.y * h])
    const len = [0]
    for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]))
    return { pts: out, len }
  }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // The text runs down the left, so the strike comes down the right-hand side.
    const shift = 0.2
    const place = (pts) => toPx(pts.map((p) => ({ x: p.x + shift, y: p.y })))
    paths = {
      main: place(BOLT.main),
      branches: BOLT.branches.map((b) => ({ ...b, path: place(b.pts) })),
      twigs: BOLT.twigs.map((b) => ({ ...b, path: place(b.pts) })),
    }
    dirty = true
  }

  // Stroke a path up to `upto` of its length.
  const trace = ({ pts, len }, upto = 1) => {
    const stop = len[len.length - 1] * upto
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) {
      if (len[i] <= stop) { ctx.lineTo(pts[i][0], pts[i][1]); continue }
      const k = (stop - len[i - 1]) / (len[i] - len[i - 1])
      ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k)
      break
    }
  }

  // Three passes, wide and faint to thin and white, read as a glow without any blur filter.
  const glow = (path, level, upto) => {
    if (level <= 0.01) return
    trace(path, upto)
    ctx.strokeStyle = `rgba(120, 140, 255, ${0.07 * level})`
    ctx.lineWidth = 18
    ctx.stroke()
    ctx.strokeStyle = `rgba(170, 190, 255, ${0.28 * level})`
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * level})`
    ctx.lineWidth = 1.6
    ctx.stroke()
  }

  const draw = (now) => {
    const { t, lit } = read()
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    const flick = (seed) => (calm ? 0.7 : 0.55 + 0.45 * Math.sin(now / 90 + seed * 40) * Math.sin(now / 37 + seed * 17))

    if (t < CREST) {
      // Stepped leader: faint, violet, advancing in jumps.
      const reach = Math.floor((t / CREST) * STEPS) / STEPS
      if (reach > 0) {
        trace(paths.main, reach)
        ctx.strokeStyle = 'rgba(160, 140, 255, 0.45)'
        ctx.lineWidth = 1.4
        ctx.stroke()
        for (const b of [...paths.branches, ...paths.twigs]) {
          if (b.at > reach) continue
          trace(b.path, Math.min(1, (reach - b.at) * 4))
          ctx.strokeStyle = `rgba(160, 140, 255, ${0.22 * flick(b.at)})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    } else {
      const level = volts(t)
      glow(paths.main, level)
      paths.branches.forEach((b, i) => glow(b.path, i < lit ? level * 0.85 : level * 0.18))
      for (const b of paths.twigs) glow(b.path, level * 0.35 * flick(b.flicker))
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  const loop = (now) => {
    // The leader and twigs flicker, so they redraw every frame; in calm mode only on change.
    if (!calm || dirty) draw(now)
    dirty = false
    frame = requestAnimationFrame(loop)
  }

  resize()
  window.addEventListener('resize', resize)
  frame = requestAnimationFrame(loop)
  return {
    changed: () => { dirty = true },
    stop: () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) },
  }
}

// Canvas painter for GRID RUN: a pseudo-3D highway at dusk, drawn far to near.
import { SEG, GAP, LEAD, MAX_SPEED, curveAt } from './track.js'

const ROAD = 1100 // half road width, world units
const CAM_H = 1100
const DEPTH = 0.9
const DRAW = 150 // segments drawn ahead
const CAR_AHEAD = 1300 // the car sits this far in front of the camera
const LIT = 42 // street lights wake up this many segments ahead of the car

const C = {
  night: '#17132E', dusk: '#5B2A6E', ember: '#FF7A45', sodium: '#FFC83D',
  paint: '#F3ECD8', teal: '#3FD0C9', road: ['#2A2838', '#2F2D40'], ground: ['#1C1730', '#211B38'],
}

function sky(ctx, W, H, horizon, s) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon)
  g.addColorStop(0, C.night)
  g.addColorStop(0.62, C.dusk)
  g.addColorStop(1, C.ember)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, horizon + 1)

  // Low sun, drifting against the bends.
  const sunX = W / 2 - s.sky * 6
  const r = Math.min(W, H) * 0.2
  const sg = ctx.createRadialGradient(sunX, horizon, r * 0.2, sunX, horizon, r * 2.4)
  sg.addColorStop(0, 'rgba(255,200,61,.55)')
  sg.addColorStop(1, 'rgba(255,122,69,0)')
  ctx.fillStyle = sg
  ctx.fillRect(0, 0, W, horizon)
  ctx.fillStyle = '#FFD98A'
  ctx.beginPath()
  ctx.arc(sunX, horizon, r, Math.PI, 0)
  ctx.fill()

  // Factory skyline: saw-tooth roofs, stacks and a gantry, repeated along the horizon.
  const unit = Math.max(260, W * 0.3)
  const u = unit / 100
  const shift = (((-s.sky * 14) % unit) + unit) % unit
  ctx.fillStyle = '#140F26'
  for (let x0 = shift - unit; x0 < W; x0 += unit) {
    ctx.beginPath()
    ctx.moveTo(x0, horizon)
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(x0 + (i * 11) * u, horizon - 9 * u)
      ctx.lineTo(x0 + (i * 11 + 11) * u, horizon - 4 * u)
    }
    ctx.lineTo(x0 + 44 * u, horizon)
    ctx.fill()
    ctx.fillRect(x0 + 50 * u, horizon - 20 * u, 3 * u, 20 * u)
    ctx.fillRect(x0 + 56 * u, horizon - 15 * u, 3 * u, 15 * u)
    ctx.fillRect(x0 + 66 * u, horizon - 8 * u, 28 * u, 1.2 * u)
    for (let i = 0; i < 4; i++) ctx.fillRect(x0 + (66 + i * 9) * u, horizon - 8 * u, 1.2 * u, 8 * u)
  }
}

function quad(ctx, color, x1, y1, w1, x2, y2, w2) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x1 - w1, y1)
  ctx.lineTo(x2 - w2, y2 + 1)
  ctx.lineTo(x2 + w2, y2 + 1)
  ctx.lineTo(x1 + w1, y1)
  ctx.fill()
}

function light(ctx, x, y, k, side, lit) {
  const h = k * 950
  const arm = -side * k * 260
  ctx.strokeStyle = '#0E0A1C'
  ctx.lineWidth = Math.max(1, k * 26)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - h)
  ctx.lineTo(x + arm, y - h)
  ctx.stroke()
  const r = Math.max(1, k * 46)
  if (lit) {
    const g = ctx.createRadialGradient(x + arm, y - h, 0, x + arm, y - h, r * 7)
    g.addColorStop(0, 'rgba(255,200,61,.75)')
    g.addColorStop(1, 'rgba(255,200,61,0)')
    ctx.fillStyle = g
    ctx.fillRect(x + arm - r * 7, y - h - r * 7, r * 14, r * 14)
  }
  ctx.fillStyle = lit ? '#FFF1BF' : '#4A4266'
  ctx.beginPath()
  ctx.arc(x + arm, y - h, r, 0, 7)
  ctx.fill()
}

// Lattice transmission tower. Returns the three conductor points for stringing wires.
function tower(ctx, x, y, k) {
  const h = k * 2700
  const w = k * 420
  ctx.strokeStyle = '#0E0A1C'
  ctx.lineWidth = Math.max(1, k * 22)
  ctx.beginPath()
  ctx.moveTo(x - w, y)
  ctx.lineTo(x - w * 0.18, y - h)
  ctx.lineTo(x + w * 0.18, y - h)
  ctx.lineTo(x + w, y)
  for (let i = 1; i < 5; i++) {
    const a = i / 5
    const b = (i + 1) / 5
    ctx.moveTo(x - w * (1 - a * 0.82), y - h * a)
    ctx.lineTo(x + w * (1 - b * 0.82), y - h * b)
    ctx.moveTo(x + w * (1 - a * 0.82), y - h * a)
    ctx.lineTo(x - w * (1 - b * 0.82), y - h * b)
  }
  const arms = [0.72, 0.86, 1].map((a) => {
    ctx.moveTo(x - w * 1.2, y - h * a)
    ctx.lineTo(x + w * 1.2, y - h * a)
    return [x - w * 1.2, y - h * a]
  })
  ctx.stroke()
  return arms
}

function gate(ctx, x, y, k, half, label, done, last) {
  const h = k * 1700
  const post = Math.max(2, k * 90)
  const beam = Math.max(4, k * 420)
  const color = done ? C.teal : C.sodium
  ctx.fillStyle = '#0E0A1C'
  ctx.fillRect(x - half - post, y - h, post, h)
  ctx.fillRect(x + half, y - h, post, h)
  ctx.fillStyle = color
  ctx.fillRect(x - half - post, y - h - beam, half * 2 + post * 2, beam)
  if (last) {
    // chequered finish banner
    const n = 16
    const cw = (half * 2 + post * 2) / n
    ctx.fillStyle = '#0E0A1C'
    for (let i = 0; i < n; i++) ctx.fillRect(x - half - post + i * cw, y - h - beam + ((i % 2) * beam) / 2, cw, beam / 2)
    return
  }
  const size = beam * 0.5
  if (size < 7) return
  ctx.fillStyle = '#17132E'
  ctx.font = `700 ${size}px "Chakra Petch", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x, y - h - beam / 2, half * 2)
}

function car(ctx, W, H, s, braking) {
  const w = Math.min(260, Math.max(120, W * 0.2))
  const h = w * 0.5
  const cx = W / 2
  const cy = H * 0.9
  const lean = (s.steer || 0) * 0.05
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = 'rgba(8,5,20,.55)'
  ctx.beginPath()
  ctx.ellipse(0, 0, w * 0.6, h * 0.16, 0, 0, 7)
  ctx.fill()
  ctx.rotate(lean)
  ctx.fillStyle = '#0B0818' // tyres
  ctx.fillRect(-w * 0.5, -h * 0.34, w * 0.16, h * 0.34)
  ctx.fillRect(w * 0.34, -h * 0.34, w * 0.16, h * 0.34)
  ctx.fillStyle = C.paint // body
  ctx.beginPath()
  ctx.roundRect(-w * 0.46, -h * 0.62, w * 0.92, h * 0.5, h * 0.1)
  ctx.fill()
  ctx.beginPath() // cabin
  ctx.moveTo(-w * 0.34, -h * 0.6)
  ctx.lineTo(-w * 0.25, -h)
  ctx.lineTo(w * 0.25, -h)
  ctx.lineTo(w * 0.34, -h * 0.6)
  ctx.fill()
  ctx.fillStyle = '#241E3D' // rear window
  ctx.beginPath()
  ctx.moveTo(-w * 0.27, -h * 0.64)
  ctx.lineTo(-w * 0.21, -h * 0.93)
  ctx.lineTo(w * 0.21, -h * 0.93)
  ctx.lineTo(w * 0.27, -h * 0.64)
  ctx.fill()
  ctx.fillStyle = C.teal // stripe
  ctx.fillRect(-w * 0.46, -h * 0.3, w * 0.92, h * 0.05)
  ctx.shadowColor = '#FF3B30'
  ctx.shadowBlur = braking ? 28 : 10
  ctx.fillStyle = braking ? '#FF5A4D' : '#C22B25'
  ctx.fillRect(-w * 0.42, -h * 0.52, w * 0.2, h * 0.11)
  ctx.fillRect(w * 0.22, -h * 0.52, w * 0.2, h * 0.11)
  ctx.restore()
}

// labels: gate names in order. passed: how many gates are behind the car.
export function draw(ctx, W, H, s, labels, passed, braking) {
  const horizon = H * 0.46
  sky(ctx, W, H, horizon, s)
  ctx.fillStyle = C.ground[0]
  ctx.fillRect(0, horizon, W, H - horizon)

  const camZ = s.z - CAR_AHEAD
  const base = Math.floor(camZ / SEG)
  const frac = camZ / SEG - base
  const camX = s.x * ROAD

  // Project the start of each segment to the screen.
  const pts = []
  let x = 0
  let dx = -curveAt(base) * frac
  for (let n = 0; n <= DRAW + 1; n++) {
    const zRel = Math.max(30, (n - frac) * SEG)
    const k = DEPTH / zRel
    pts.push({ x: W / 2 + k * (x - camX) * W / 2, y: horizon + k * CAM_H * H / 2, w: k * ROAD * W / 2, k, off: x })
    x += dx
    dx += curveAt(base + n)
  }

  const wires = { '-1': null, 1: null }
  for (let n = DRAW; n >= 0; n--) {
    const seg = base + n
    const a = pts[n + 1]
    const b = pts[n]
    const band = Math.abs(Math.floor(seg / 3)) % 2
    ctx.fillStyle = C.ground[band]
    ctx.fillRect(0, a.y, W, b.y - a.y + 1)
    quad(ctx, band ? C.ember : C.paint, a.x, a.y, a.w * 1.08, b.x, b.y, b.w * 1.08)
    quad(ctx, C.road[band], a.x, a.y, a.w, b.x, b.y, b.w)
    if (band) {
      quad(ctx, C.paint, a.x - a.w / 3, a.y, a.w * 0.012, b.x - b.w / 3, b.y, b.w * 0.012)
      quad(ctx, C.paint, a.x + a.w / 3, a.y, a.w * 0.012, b.x + b.w / 3, b.y, b.w * 0.012)
    }
    if (n === 0 || seg < 0) continue

    const k = b.k
    const sx = (lateral) => W / 2 + k * (b.off + lateral - camX) * W / 2
    const kh = k * H / 2
    const side = Math.abs(seg) % 2 ? 1 : -1
    if (seg % 20 === 0) {
      for (const sd of [-1, 1]) {
        const top = tower(ctx, sx(sd * ROAD * 3.6), b.y, kh)
        if (wires[sd]) {
          ctx.lineWidth = 1
          ctx.strokeStyle = 'rgba(14,10,28,.8)'
          ctx.beginPath()
          top.forEach(([tx, ty], i) => {
            const [px, py] = wires[sd][i]
            ctx.moveTo(tx, ty)
            ctx.quadraticCurveTo((tx + px) / 2, Math.max(ty, py) + Math.abs(tx - px) * 0.08, px, py)
          })
          ctx.stroke()
        }
        wires[sd] = top
      }
    }
    if (seg % 6 === 0) light(ctx, sx(side * ROAD * 1.3), b.y, kh, side, n * SEG < CAR_AHEAD + LIT * SEG)
    const g = (seg - LEAD) / GAP
    if (Number.isInteger(g) && g >= 0 && g < labels.length) {
      gate(ctx, b.x, b.y, kh, b.w * 1.18, labels[g], g < passed, g === labels.length - 1)
    }
  }

  // Dusk haze where the road meets the sky.
  const haze = ctx.createLinearGradient(0, horizon, 0, horizon + H * 0.1)
  haze.addColorStop(0, 'rgba(255,122,69,.55)')
  haze.addColorStop(1, 'rgba(255,122,69,0)')
  ctx.fillStyle = haze
  ctx.fillRect(0, horizon, W, H * 0.1)

  // Speed lines at the edges once the car is really moving.
  const fast = s.speed / MAX_SPEED
  if (fast > 0.7) {
    ctx.strokeStyle = `rgba(243,236,216,${(fast - 0.7) * 0.5})`
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const yy = horizon + ((i * 97 + s.z * 0.5) % (H - horizon))
      const xx = i % 2 ? W * 0.02 : W * 0.9
      ctx.moveTo(xx, yy)
      ctx.lineTo(xx + W * 0.08, yy)
    }
    ctx.stroke()
  }
  car(ctx, W, H, s, braking)
}

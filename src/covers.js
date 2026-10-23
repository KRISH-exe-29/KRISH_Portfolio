// Generated covers for the nine apps. No screenshots exist, so each app gets an
// honest typographic poster: its index, its name, its pitch and a drawn motif.
import { apps } from './content.js'

export const slug = (name) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const TONES = [
  { bg: '#FFD43B', ink: '#14120F' },
  { bg: '#14120F', ink: '#FFD43B' },
  { bg: '#ECE6D6', ink: '#14120F' },
  { bg: '#FF5A1F', ink: '#14120F' },
  { bg: '#2230C9', ink: '#ECE6D6' },
]
export const toneOf = (i) => TONES[i % TONES.length]

const W = 1200
const H = 800

// Small deterministic random so covers never change between visits.
function rng(seed) {
  let s = seed * 9301 + 49297
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280)
}

function motif(ctx, kind, ink, rand) {
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.globalAlpha = 0.22
  if (kind === 0) {
    // ripples from an off-centre drop
    const cx = W * (0.6 + rand() * 0.25)
    const cy = H * (0.3 + rand() * 0.3)
    for (let r = 18; r < 1400; r += 22 + r * 0.04) {
      ctx.lineWidth = 1 + r / 260
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (kind === 1) {
    // contour lines, like a slow current
    const f = 0.004 + rand() * 0.004
    for (let y = -40; y < H + 40; y += 16) {
      ctx.lineWidth = 1.4
      ctx.beginPath()
      for (let x = 0; x <= W; x += 12) {
        const yy = y + Math.sin(x * f + y * 0.02) * 26 + Math.sin(x * f * 2.3 + y * 0.05) * 9
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy)
      }
      ctx.stroke()
    }
  } else if (kind === 2) {
    // dot matrix swelling towards a point
    const cx = W * (0.55 + rand() * 0.3)
    const cy = H * (0.4 + rand() * 0.3)
    for (let y = 20; y < H; y += 26) {
      for (let x = 20; x < W; x += 26) {
        const d = Math.hypot(x - cx, y - cy)
        const r = Math.max(0.6, 9 - d / 70)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else {
    // bars, like a test log read from left to right
    const n = 34
    const bw = W / n
    for (let i = 0; i < n; i++) {
      const h = H * (0.15 + rand() * 0.55)
      ctx.fillRect(i * bw + 3, H - h, bw - 6, h)
    }
  }
  ctx.globalAlpha = 1
}

function wrap(ctx, text, maxW) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = t
  }
  lines.push(line)
  return lines
}

function grain(ctx) {
  const g = document.createElement('canvas')
  g.width = g.height = 128
  const gc = g.getContext('2d')
  const img = gc.createImageData(128, 128)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  gc.putImageData(img, 0, 0)
  ctx.globalAlpha = 0.07
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = ctx.createPattern(g, 'repeat')
  ctx.fillRect(0, 0, W, H)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

function draw(app, i) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const { bg, ink } = toneOf(i)
  const rand = rng(i + 3)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  motif(ctx, i % 4, ink, rand)

  const num = String(i + 1).padStart(2, '0')
  ctx.fillStyle = ink
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 0.9
  ctx.font = '800 560px "Archivo", sans-serif'
  ctx.fontStretch = 'extra-condensed' // set after font, which resets it; ignored where unsupported
  ctx.textAlign = 'right'
  ctx.fillText(num, W + 18, H + 70)
  ctx.globalAlpha = 1

  ctx.textAlign = 'left'
  ctx.font = '800 112px "Archivo", sans-serif'
  ctx.fontStretch = 'condensed'
  const lines = wrap(ctx, app.name.toUpperCase(), W - 140)
  lines.forEach((l, k) => ctx.fillText(l, 60, 180 + k * 104))

  ctx.fontStretch = 'normal'
  ctx.font = '500 26px "IBM Plex Mono", monospace'
  ctx.fillText(`${num} / ${String(apps.length).padStart(2, '0')}`, 60, 60)
  ctx.textAlign = 'right'
  ctx.fillText('INDO TECH TRANSFORMERS', W - 60, 60)
  ctx.textAlign = 'left'
  ctx.font = '500 30px "IBM Plex Mono", monospace'
  wrap(ctx, app.pitch, 640).forEach((l, k) => ctx.fillText(l, 60, H - 110 + k * 40))

  grain(ctx)
  return c
}

let cache = null
export function buildCovers() {
  if (cache) return cache
  cache = apps.map((a, i) => {
    const canvas = draw(a, i)
    return { canvas, url: canvas.toDataURL('image/jpeg', 0.86) }
  })
  return cache
}
export const covers = () => cache || buildCovers()

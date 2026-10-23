// Generative typographic covers. No screenshots exist, so every app, side
// project and AI piece gets a poster drawn from its own name and pitch.
const W = 960
const H = 720
const FONT = 'Archivo, "Arial Narrow", sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'

// ground, ink, accent
const PALETTES = [
  ['#111111', '#ECEBE7', '#FF4D00'],
  ['#FF4D00', '#111111', '#ECEBE7'],
  ['#D6D5CF', '#111111', '#FF4D00'],
  ['#1F2FB8', '#ECEBE7', '#FF9E7A'],
  ['#ECEBE7', '#111111', '#1F2FB8'],
  ['#3B0F0B', '#F3D9CF', '#FF4D00'],
  ['#8E8D86', '#111111', '#ECEBE7'],
  ['#111111', '#FF4D00', '#ECEBE7'],
  ['#F3D9CF', '#3B0F0B', '#1F2FB8'],
]

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

function rng(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function font(ctx, weight, size, condensed) {
  if ('fontStretch' in ctx) ctx.fontStretch = condensed ? 'condensed' : 'normal'
  ctx.font = `${weight} ${size}px ${FONT}`
}

// Largest size at which `text` fits `width`.
function fit(ctx, text, width, weight, max, condensed) {
  font(ctx, weight, 100, condensed)
  const size = Math.min(max, (100 * width) / Math.max(1, ctx.measureText(text).width))
  font(ctx, weight, size, condensed)
  return size
}

function wrap(ctx, text, width) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const next = line ? line + ' ' + w : w
    if (ctx.measureText(next).width > width && line) {
      lines.push(line)
      line = w
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function initials(name) {
  return name
    .replace(/[^A-Za-z0-9& ]/g, ' ')
    .split(' ')
    .filter((w) => w && w !== '&')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

function frame(ctx, code, ink, pitch) {
  ctx.fillStyle = ink
  ctx.textBaseline = 'top'
  ctx.font = `500 22px ${MONO}`
  ctx.fillText(code, 40, 38)
  if (pitch) {
    ctx.textBaseline = 'alphabetic'
    font(ctx, 500, 30, false)
    const lines = wrap(ctx, pitch, W * 0.62)
    lines.forEach((l, i) => ctx.fillText(l, 40, H - 44 - (lines.length - 1 - i) * 36))
  }
}

const styles = [
  // Monogram, cropped off the edge.
  (ctx, item, [, ink, acc]) => {
    const mono = initials(item.title)
    ctx.fillStyle = acc
    font(ctx, 900, H * 1.05, true)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'right'
    ctx.fillText(mono, W + 30, H * 0.98)
    ctx.textAlign = 'left'
    ctx.fillStyle = ink
    fit(ctx, item.title.toUpperCase(), W * 0.7, 800, 72, true)
    ctx.textBaseline = 'top'
    ctx.fillText(item.title.toUpperCase(), 40, 88)
  },
  // Name stacked as alternating fill and outline rows.
  (ctx, item, [, ink, acc]) => {
    const word = item.title.split(' ')[0].toUpperCase()
    const size = fit(ctx, word, W - 80, 900, 260, true)
    ctx.textBaseline = 'top'
    const step = size * 0.82
    for (let y = 70, i = 0; y + size * 0.75 < H - 110; y += step, i++) {
      if (i % 2) {
        ctx.strokeStyle = ink
        ctx.lineWidth = 2
        ctx.strokeText(word, 40, y)
      } else {
        ctx.fillStyle = i === 2 ? acc : ink
        ctx.fillText(word, 40, y)
      }
    }
  },
  // Field of discs sized by the name's letters.
  (ctx, item, [, ink, acc], r) => {
    const cols = 12
    const rows = 7
    const cell = (W - 80) / cols
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = item.title.charCodeAt((x + y * cols) % item.title.length) || 65
        const rad = ((c % 7) / 7) * cell * 0.46 + r() * 4
        ctx.fillStyle = (x * 3 + y) % 11 === 0 ? acc : ink
        ctx.beginPath()
        ctx.arc(40 + cell * (x + 0.5), 90 + cell * (y + 0.5) * 0.78, rad, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.fillStyle = ink
    fit(ctx, item.title, W * 0.8, 800, 88, true)
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(item.title, 40, H - 150)
  },
  // Signal bars, like a test trace.
  (ctx, item, [, ink, acc], r) => {
    let x = 40
    while (x < W - 40) {
      const w = 4 + Math.floor(r() * 26)
      const h = H * (0.15 + r() * 0.5)
      ctx.fillStyle = r() > 0.86 ? acc : ink
      ctx.fillRect(x, H * 0.62 - h, w, h)
      x += w + 6 + Math.floor(r() * 14)
    }
    ctx.fillStyle = ink
    fit(ctx, item.title, W * 0.86, 800, 110, true)
    ctx.textBaseline = 'top'
    ctx.fillText(item.title, 40, 84)
  },
]

export function drawCover(item, index) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const pal = PALETTES[index % PALETTES.length]
  const r = rng(hash(item.title))
  ctx.fillStyle = pal[0]
  ctx.fillRect(0, 0, W, H)
  styles[index % styles.length](ctx, item, pal, r)
  frame(ctx, item.code + '/' + String(item.n).padStart(2, '0'), pal[1], item.pitch && item.pitch.length < 70 ? item.pitch : '')
  return canvas.toDataURL('image/jpeg', 0.88)
}

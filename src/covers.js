// The apps have no screenshots in content.js, so each card gets an honest generated cover:
// a colour, a pattern and the app's initials, drawn once on a 2D canvas.
const SETS = [
  ['#ff5b3a', '#1e1b4b'],
  ['#3b5bff', '#fffbf0'],
  ['#19c3a0', '#1e1b4b'],
  ['#ffc21a', '#1e1b4b'],
  ['#ff8fc7', '#1e1b4b'],
  ['#1e1b4b', '#ffc21a'],
]

const mark = (name) => {
  const words = name.split(' ').filter((w) => /^[A-Za-z]/.test(w))
  return words.length === 1 ? words[0].slice(0, 4) : words.map((w) => w[0]).join('').slice(0, 3)
}

export function makeCover(name, i) {
  const W = 800
  const H = 600
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const [bg, fg] = SETS[i % SETS.length]
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  g.fillStyle = fg
  g.strokeStyle = fg
  g.globalAlpha = 0.2
  const kind = i % 4
  if (kind === 0) {
    for (let x = 30; x < W; x += 44) for (let y = 30; y < H; y += 44) {
      g.beginPath()
      g.arc(x, y, 6, 0, Math.PI * 2)
      g.fill()
    }
  } else if (kind === 1) {
    g.lineWidth = 18
    for (let k = -H; k < W + H; k += 58) {
      g.beginPath()
      g.moveTo(k, 0)
      g.lineTo(k - H, H)
      g.stroke()
    }
  } else if (kind === 2) {
    g.lineWidth = 10
    for (let r = 30; r < 900; r += 46) {
      g.beginPath()
      g.arc(640, 120, r, 0, Math.PI * 2)
      g.stroke()
    }
  } else {
    g.lineWidth = 10
    for (let y = 20; y < H + 40; y += 48) {
      g.beginPath()
      for (let x = 0; x <= W; x += 10) g.lineTo(x, y + Math.sin(x / 40 + y) * 14)
      g.stroke()
    }
  }
  g.globalAlpha = 1
  const text = mark(name)
  let px = 320
  g.font = `800 ${px}px "Bricolage Grotesque", system-ui, sans-serif`
  const w = g.measureText(text).width
  if (w > W - 96) {
    px = Math.floor((px * (W - 96)) / w)
    g.font = `800 ${px}px "Bricolage Grotesque", system-ui, sans-serif`
  }
  g.fillText(text, 44, H - 52)
  return c.toDataURL('image/jpeg', 0.86)
}

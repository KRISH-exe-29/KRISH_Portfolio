// The drawings the filings settle into. Each is painted on a small hidden canvas, then
// its filled pixels become particle targets. Nothing here is ever shown directly.
import { dust, sample } from './morph.js'

const W = 480
const H = 320
const FONT = '"Bricolage Grotesque", system-ui, sans-serif'

// Text scaled to fill the sheet width.
function words(c, lines, weight = 800) {
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.font = `${weight} 100px ${FONT}`
  const size = Math.min((100 * (W - 20)) / Math.max(...lines.map((l) => c.measureText(l).width)), (H - 10) / lines.length / 0.9)
  c.font = `${weight} ${size}px ${FONT}`
  lines.forEach((l, i) => c.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * size * 0.9))
}

const line = (c, width, ...pts) => {
  c.lineWidth = width
  c.beginPath()
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
  c.stroke()
}

const drawings = {
  name: (c, name) => words(c, name.toUpperCase().split(/ (?=\S+ \S+$)/)),
  transformer(c) {
    c.fillRect(160, 120, 160, 150)
    for (let k = 0; k < 6; k++) {
      c.fillRect(104 + k * 9, 140, 4, 120)
      c.fillRect(328 + k * 9, 140, 4, 120)
    }
    for (const x of [190, 240, 290]) {
      c.fillRect(x - 3, 40, 6, 80)
      for (let k = 0; k < 5; k++) c.fillRect(x - 13 + k, 104 - k * 14, 26 - 2 * k, 5)
    }
    c.fillRect(300, 60, 90, 22)
    c.fillRect(340, 82, 5, 38)
    c.fillRect(150, 270, 180, 8)
    c.clearRect(214, 160, 52, 34)
  },
  streetlight(c) {
    line(c, 9, [150, 310], [150, 60])
    c.lineWidth = 8
    c.beginPath()
    c.moveTo(150, 60)
    c.quadraticCurveTo(160, 20, 250, 26)
    c.stroke()
    c.fillRect(236, 20, 60, 16)
    for (let k = 0; k <= 14; k++) line(c, 2.2, [266, 36], [170 + k * 17, 310]) // the cone of light
    c.fillRect(110, 306, 320, 5)
  },
  seven: (c) => words(c, ['7'], 800),
  tiles(c) {
    for (let k = 0; k < 9; k++) {
      const [x, y] = [100 + (k % 3) * 98, 22 + Math.floor(k / 3) * 98]
      c.fillRect(x, y, 84, 84)
      c.clearRect(x + 10, y + 10, 64, 64)
      c.fillRect(x + 26, y + 26, 32, 32)
    }
  },
  net(c) {
    const layers = [3, 5, 6, 5, 3].map((n, l) => [...Array(n).keys()].map((k) => [60 + l * 90, 160 + (k - (n - 1) / 2) * 52]))
    layers.slice(0, -1).forEach((layer, l) => layer.forEach((a) => layers[l + 1].forEach((b) => line(c, 1.3, a, b))))
    layers.flat().forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill() })
  },
  plane(c) {
    c.beginPath()
    c.moveTo(40, 150); c.lineTo(440, 30); c.lineTo(300, 290); c.lineTo(230, 190); c.closePath()
    c.fill()
    c.globalCompositeOperation = 'destination-out'
    line(c, 7, [440, 30], [230, 190])
    line(c, 7, [230, 190], [250, 250])
    c.globalCompositeOperation = 'source-over'
  },
}

// Returns particle targets for each named drawing, plus loose dust as the first entry.
export function buildShapes(names, count, name) {
  const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H })
  const c = canvas.getContext('2d', { willReadFrequently: true })
  const shapes = names.map((key) => {
    c.clearRect(0, 0, W, H)
    c.fillStyle = c.strokeStyle = '#000'
    c.lineCap = 'round'
    drawings[key](c, name)
    const alpha = c.getImageData(0, 0, W, H).data
    const pixels = []
    for (let i = 3; i < alpha.length; i += 4) if (alpha[i] > 110) pixels.push(((i - 3) / 4) % W, Math.floor((i - 3) / 4 / W))
    return sample(pixels, count)
  })
  return [dust(count), ...shapes]
}

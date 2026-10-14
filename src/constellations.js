// The constellations, one per chapter. Stars sit in a 1 x 1 box; edges are drawn in order as the
// reader scrolls, and each edge that closes rings a note. Labels come from content.js.
import { experience, numbers, apps, ai, awards } from './content.js'

const pentagram = [0, 1, 2, 3, 4].map((i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
  return [0.5 + Math.cos(a) * 0.42, 0.52 + Math.sin(a) * 0.42]
})

const spiral = Array.from({ length: 12 }, (_, i) => {
  const a = i * 0.62
  const r = 0.06 + i * 0.034
  return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]
})

// The last one spells the name. Each letter is a set of strokes inside a 0.13 x 1 cell.
const LETTERS = {
  K: [[[0, 0], [0, 1]], [[0.13, 0], [0, 0.52], [0.13, 1]]],
  R: [[[0, 1], [0, 0], [0.11, 0.03], [0.13, 0.22], [0.1, 0.44], [0, 0.48], [0.13, 1]]],
  I: [[[0.04, 0], [0.04, 1]]],
  S: [[[0.13, 0.06], [0.04, 0], [0, 0.2], [0.13, 0.72], [0.09, 1], [0, 0.94]]],
  H: [[[0, 0], [0, 1]], [[0, 0.5], [0.13, 0.5]], [[0.13, 0], [0.13, 1]]],
}

function word(text) {
  const stars = []
  const edges = []
  const step = 0.205
  const left = (1 - (text.length * step - 0.075)) / 2
  ;[...text].forEach((ch, n) => {
    for (const stroke of LETTERS[ch]) {
      let prev = -1
      for (const [x, y] of stroke) {
        const px = left + n * step + x
        const py = 0.32 + y * 0.36
        let i = stars.findIndex((s) => Math.hypot(s[0] - px, s[1] - py) < 0.01)
        if (i < 0) i = stars.push([px, py]) - 1
        if (prev >= 0) edges.push([prev, i])
        prev = i
      }
    }
  })
  return { stars, edges }
}

const chain = (n) => Array.from({ length: n - 1 }, (_, i) => [i, i + 1])

export const constellations = {
  path: {
    name: 'The Path',
    stars: [[0.06, 0.86], [0.27, 0.68], [0.44, 0.76], [0.64, 0.44], [0.9, 0.14]],
    edges: chain(5),
    labels: experience.map((e) => `${e.year} · ${e.company.replace(/ (Pvt\. Ltd\.|Limited)$/, '')}`),
  },
  five: {
    name: 'The Five',
    stars: pentagram,
    edges: [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]],
    labels: numbers.map((n) => `${n.value} ${n.unit}`),
  },
  transformer: {
    name: 'The Transformer',
    stars: [[0.2, 0.14], [0.2, 0.4], [0.2, 0.64], [0.2, 0.9], [0.8, 0.14], [0.8, 0.4], [0.8, 0.64], [0.8, 0.9], [0.5, 0.14]],
    edges: [[0, 1], [1, 2], [2, 3], [0, 8], [8, 4], [4, 5], [5, 6], [6, 7], [3, 7]],
    labels: apps.map((a) => a.name),
    // Where each label sits: a(bove), b(elow), l(eft) or r(ight) of its star.
    place: ['a', 'r', 'r', 'b', 'a', 'l', 'l', 'b', 'a'],
  },
  agent: {
    name: 'The Agent',
    stars: spiral,
    edges: chain(12),
    labels: ai.agent.versions.map((v, i) => (i === 0 || i === 11 ? `v${i + 1} ${v}` : '')),
  },
  crown: {
    name: 'The Crown',
    stars: [[0.08, 0.72], [0.2, 0.3], [0.35, 0.6], [0.5, 0.18], [0.65, 0.6], [0.8, 0.3], [0.92, 0.72]],
    edges: [...chain(7), [6, 0]],
    labels: awards.map((a) => a.year),
  },
  name: { name: 'Krish', ...word('KRISH'), labels: [] },
}

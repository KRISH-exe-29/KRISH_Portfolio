// Run with: node src/kolam.check.js
import assert from 'node:assert/strict'
import { drawnAt, headAt, pluck, reached, rings, route, thread } from './kolam.js'

const page = { width: 1200, lane: 120, step: 60, boxes: [{ top: 200, bottom: 900 }, { top: 1400, bottom: 2600 }, { top: 3100, bottom: 3500 }] }
const r = route(page)

assert.equal(route(page).d, r.d, 'same page, same line')
assert.match(r.d, /^M[-\d. ]+(C[-\d. ]+)+$/, 'one unbroken path made only of curves')
assert.ok(r.dots.length > 40)
assert.equal(r.dotAt.length, r.dots.length)
r.dotAt.forEach((at, k) => assert.ok(k === 0 || at > r.dotAt[k - 1], `dot ${k} comes after dot ${k - 1} along the line`))
r.deepest.forEach((y, i) => assert.ok(i === 0 || y >= r.deepest[i - 1], 'the reach table never shrinks'))
assert.equal(r.chapterAt.length, 3)
assert.ok(r.chapterAt[0] === 0 && r.chapterAt[1] > 0 && r.chapterAt[2] > r.chapterAt[1])

// Lanes alternate: left of the first chapter, right of the second.
assert.ok(r.dots[0].x < 600)
assert.ok(headAt(r.chapterAt[1], r).x > 600)

assert.equal(drawnAt(-500, r), 0, 'nothing drawn above the page')
assert.equal(drawnAt(NaN, r), 0, 'a bad scroll value draws nothing')
assert.equal(drawnAt(99999, r), r.total, 'all drawn below the page')
let last = 0
for (let y = 0; y < 3700; y += 9) {
  const len = drawnAt(y, r)
  assert.ok(len >= last && len <= r.total, `drawn length only grows (y=${y})`)
  last = len
}
// The tip stays near where scroll asked for it: within one loop of the target height.
for (let y = 300; y < 3400; y += 50) assert.ok(Math.abs(headAt(drawnAt(y, r), r).y - y) < page.step * 1.5, `tip near y=${y}`)

assert.equal(reached(0, r.dotAt), 1, 'the line starts on the first dot')
assert.equal(reached(r.total, r.dotAt), r.dots.length)

const five = rings(5)
assert.equal(five.length, 5)
five.forEach((d) => assert.match(d, /^M[-\d. ]+(C[-\d. ]+)+Z$/))
const nine = thread()
assert.equal(nine.dots.length, 9)
nine.dotAt.forEach((at, k) => assert.ok(at > (nine.dotAt[k - 1] ?? 0) && at < nine.total))

let seed = 3
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const note = pluck(440, 8000, 1, rand)
const loud = (from, to) => Math.max(...note.slice(from, to).map(Math.abs))
assert.equal(note.length, 8000)
assert.ok(note.every((v) => Number.isFinite(v) && Math.abs(v) <= 1))
assert.ok(loud(7000, 8000) < loud(0, 1000) * 0.2, 'the string rings out')

console.log('kolam: ok')

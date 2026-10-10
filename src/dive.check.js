// Run with: node src/dive.check.js
import assert from 'node:assert/strict'
import { LEVELS, ZOOM, blend, depth, scene, voltage, volts } from './dive.js'

const vh = 800
const gate = 1600
const tops = [0, 2000, 6000, 9000, 13000, 16000]
const end = 18000
const at = (y) => depth(y, tops, vh, gate, end)

assert.equal(at(0), 0, 'starts at the surface')
for (let i = 1; i < tops.length; i++) {
  assert.ok(Math.abs(at(tops[i] + gate - vh) - i) < 1e-9, `lands on level ${i} as its text arrives`)
}
let last = -1
for (let y = 0; y <= end; y += 7) {
  const d = at(y)
  assert.ok(d >= last - 1e-9, `depth never runs backwards (y=${y})`)
  assert.ok(d - last < 0.05 || last < 0, `depth has no jumps (y=${y})`)
  last = d
}
assert.ok(last <= LEVELS.length - 1 + 0.08 + 1e-9, 'never dives past the last level')

assert.deepEqual(scene(2, 2), { scale: 1, opacity: 1 }, 'a level is full size when you arrive')
assert.equal(scene(1, 2).scale, 1 / ZOOM)
assert.equal(scene(1, 2).opacity, 0, 'the next level is invisible until the flight starts')
assert.equal(scene(3, 2).opacity, 0, 'the level behind is gone once you land')

LEVELS.forEach((l, i) => assert.ok(Math.abs(voltage(i) - l.volts) < 1e-6, `${l.place} reads ${l.volts} V`))
assert.ok(voltage(0.5) < 400000 && voltage(0.5) > 161000)
assert.equal(volts(400000), '400 kV')
assert.equal(volts(415), '415 V')
assert.equal(volts(3.3), '3.3 V')
assert.equal(volts(0), '0 V')
assert.equal(blend(0, 'bg'), 'rgb(16 58 142)')
assert.equal(blend(5, 'bg'), 'rgb(43 29 19)')

console.log('dive: ok')

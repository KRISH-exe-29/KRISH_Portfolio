// Run: node src/game/track.check.js
import assert from 'node:assert/strict'
import { SEG, MAX_SPEED, gateZ, gatesPassed, start, step, trackLength } from './track.js'

const GATES = 11
assert.equal(gatesPassed(0, GATES), 0)
assert.equal(gatesPassed(gateZ(0) - 1, GATES), 0)
assert.equal(gatesPassed(gateZ(0), GATES), 1)
assert.equal(gatesPassed(gateZ(4) + SEG, GATES), 5)
assert.equal(gatesPassed(1e9, GATES), GATES)

// Holding the gas with no steering reaches the finish and collects every gate.
let s = start()
let seen = 0
for (let i = 0; i < 60 * 600 && s.z < trackLength(GATES); i++) {
  s = step(s, { gas: true }, 1 / 60, GATES)
  assert.ok(s.speed <= MAX_SPEED && Math.abs(s.x) <= 1.5)
  const now = gatesPassed(s.z, GATES)
  assert.ok(now === seen || now === seen + 1, 'gates are collected one at a time, in order')
  seen = now
}
assert.equal(seen, GATES)
assert.equal(s.z, trackLength(GATES))
assert.equal(s.speed, 0)

// Driving on the verge slows the car but never stops it.
s = { ...start(), x: 1.4, speed: MAX_SPEED }
for (let i = 0; i < 300; i++) s = step({ ...s, x: 1.4 }, { gas: true }, 1 / 60, GATES)
assert.ok(s.speed > 0 && s.speed < MAX_SPEED / 2)

// Scrolling moves the car both ways and never leaves the track.
s = step(start(), { scroll: 5000 }, 1 / 60, GATES)
assert.equal(s.z, 5000)
s = step(s, { scroll: -9000 }, 1 / 60, GATES)
assert.equal(s.z, 0)

console.log('track ok')

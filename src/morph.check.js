// Run with: node src/morph.check.js
import assert from 'node:assert/strict'
import { dust, sample, segment } from './morph.js'

const tops = [0, 1000, 2600, 3400]
const span = 600

assert.deepEqual(segment(-200, tops, span), { from: 0, to: 0, mix: 0 }, 'rubber-band above the page')
assert.deepEqual(segment(400, tops, span), { from: 0, to: 0, mix: 0 }, 'first shape holds')
assert.deepEqual(segment(700, tops, span), { from: 0, to: 1, mix: 0 }, 'morph starts half a span early')
assert.equal(segment(1000, tops, span).mix, 0.5, 'halfway at the boundary')
assert.deepEqual(segment(1300, tops, span), { from: 0, to: 1, mix: 1 }, 'morph done half a span late')
assert.deepEqual(segment(2000, tops, span), { from: 0, to: 1, mix: 1 }, 'second shape holds')
assert.deepEqual(segment(99999, tops, span), { from: 2, to: 3, mix: 1 }, 'past the end')
assert.ok(Number.isFinite(segment(1000, tops, 0).mix), 'a zero span does not divide by zero')

// The shape you see (to at mix 1, from at mix 0) never steps backwards as you scroll down.
let seen = 0
for (let y = -100; y < 4000; y += 13) {
  const s = segment(y, tops, span)
  const shown = s.mix >= 0.5 ? s.to : s.from
  assert.ok(shown >= seen, `no going back at y=${y}`)
  assert.ok(s.mix >= 0 && s.mix <= 1)
  seen = shown
}

// A seeded generator, so the check is repeatable.
let seed = 7
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647

const tall = []
for (let y = 10; y < 110; y++) for (let x = 40; x < 60; x++) tall.push(x, y)
const pts = sample(tall, 500, rand)
assert.equal(pts.length, 1000, 'exactly n points')
let [maxX, maxY] = [0, 0]
for (let i = 0; i < 500; i++) {
  assert.ok(Number.isFinite(pts[i * 2]) && Number.isFinite(pts[i * 2 + 1]))
  maxX = Math.max(maxX, Math.abs(pts[i * 2]))
  maxY = Math.max(maxY, Math.abs(pts[i * 2 + 1]))
}
assert.ok(maxY <= 1 && maxY > 0.9, 'long side fills the box')
assert.ok(maxX <= 0.21 && maxX > 0.15, 'short side keeps its proportion')

const empty = sample([], 50, rand)
assert.equal(empty.length, 100, 'an empty drawing still gives n points')
assert.ok(empty.every(Number.isFinite))
assert.equal(dust(10, rand).length, 20)

console.log('morph: ok')

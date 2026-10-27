// Run: node src/reel.check.js
import assert from 'node:assert/strict'
import { reelPose, sceneAt, slotAngle, expandEase } from './reel.js'

const near = (a, b, eps = 1e-3) => Math.abs(a - b) < eps

// Before formation every card sits stacked at the front.
const s0 = sceneAt(0)
for (let i = 0; i < 16; i++) {
  const p = reelPose(slotAngle(i), 0, s0)
  assert.ok(near(p.x, 0) && near(p.z, 460), `card ${i} not stacked at front`)
}
// After formation each card rests at its slot; slot 0 is the far side.
const far = reelPose(0, 1, s0)
assert.ok(near(far.z, -460) && near(far.x, 0) && far.appear === 1)
// Expansion end values match the spec.
const s1 = sceneAt(1)
assert.deepEqual([s1.radius, s1.tilt, s1.roll, s1.perspective, s1.scale], [1800, 0, 0, 450, 2.3])
// Front card at full expansion is behind the camera (we are inside the ring).
assert.ok(reelPose(180, 1, s1).behindCamera)
assert.ok(!reelPose(0, 1, s1).behindCamera)
// Easing is monotonic with fixed ends.
assert.ok(expandEase(0) === 0 && expandEase(1) === 1 && expandEase(0.5) > expandEase(0.4))
console.log('reel ok')

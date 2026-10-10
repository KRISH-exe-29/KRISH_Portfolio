// Pure driving model for GRID RUN: no DOM, no canvas. Checked by track.check.js.
export const SEG = 200 // length of one road segment
export const GAP = 60 // segments between gates
export const LEAD = 30 // segments before the first gate
export const MAX_SPEED = 3200 // units per second
const ACCEL = 2600
const BRAKE = 4200
const DRAG = 900
const OFFROAD_MAX = 900

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const gateZ = (i) => (LEAD + i * GAP) * SEG
export const trackLength = (gates) => gateZ(gates - 1) + 8 * SEG

// Road bend at a segment. Straight on the start grid, then two overlapping waves.
export const curveAt = (seg) =>
  seg < 15 ? 0 : Math.sin(seg / 23) * 1.6 + Math.sin(seg / 51 + 1) * 2.2

// How many gates lie at or behind distance z.
export const gatesPassed = (z, gates) =>
  clamp(Math.floor((z / SEG - LEAD) / GAP) + 1, 0, gates)

export const start = () => ({ z: 0, x: 0, speed: 0, sky: 0 })

// input: { gas, brake, steer (-1..1), scroll (distance to add directly) }
export function step(s, input, dt, gates) {
  const end = trackLength(gates)
  let speed = s.speed + (input.gas ? ACCEL : -DRAG) * dt - (input.brake ? BRAKE * dt : 0)
  const limit = Math.abs(s.x) > 1 ? OFFROAD_MAX : MAX_SPEED
  if (speed > limit) speed = Math.max(limit, s.speed - BRAKE * dt)
  speed = Math.max(0, speed)

  const ratio = speed / MAX_SPEED
  const curve = curveAt(Math.floor(s.z / SEG))
  // The crash rule: the verge only ever slows you down, it never stops the run.
  const x = clamp(s.x + (input.steer || 0) * 2.2 * ratio * dt - curve * ratio * ratio * 0.12 * dt, -1.5, 1.5)
  const z = clamp(s.z + speed * dt + (input.scroll || 0), 0, end)
  if (z >= end) speed = 0
  return { z, x, speed, sky: s.sky + curve * ratio * dt * 30 }
}

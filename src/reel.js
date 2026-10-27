// Reel ring maths. Pure functions, no DOM. `node src/reel.check.js` asserts the key poses.
export const N = 16
export const slotAngle = (i) => (i * 360) / N // 0deg = far side of the ring
export const FORMATION_S = 2.6
export const EXPANSION_S = 1.9

export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
export const lerp = (a, b, t) => a + (b - a) * t
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

// CSS cubic-bezier(x1,y1,x2,y2) as a JS easing (Newton + bisection fallback).
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t) => ((ax * t + bx) * t + cx) * t
  const sy = (t) => ((ay * t + by) * t + cy) * t
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x
      if (Math.abs(e) < 1e-6) return sy(t)
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    let lo = 0, hi = 1
    t = x
    while (hi - lo > 1e-6) {
      if (sx(t) < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
}
export const expandEase = bezier(0.5, 0, 0.15, 1)

// Scene values for an expansion progress 0..1.
export function sceneAt(expansion, spin = 0) {
  const e = expandEase(clamp01(expansion))
  return {
    e,
    spin,
    radius: lerp(460, 1800, e),
    tilt: lerp(-22, 0, e),
    roll: lerp(-20, 0, e),
    perspective: lerp(1000, 450, e),
    scale: lerp(0.52, 2.3, e),
  }
}

// angle: the card's resting slot angle (deg). Cards are dealt in angle order,
// each swinging out from the front stack (180deg) with ease-out cubic.
export function reelPose(angle, formation, scene) {
  const d = angle / 360
  const p = easeOutCubic(clamp01((clamp01(formation) - d * 0.8) / 0.2))
  const a = lerp(180, angle, p) + scene.spin
  const r = (a * Math.PI) / 180
  const x = scene.radius * Math.sin(r)
  const z = -scene.radius * Math.cos(r)
  return {
    x,
    y: 0,
    z,
    yaw: -a,
    scale: scene.scale,
    appear: Math.min(1, 0.3 + p),
    behindCamera: z > scene.perspective - 140,
  }
}

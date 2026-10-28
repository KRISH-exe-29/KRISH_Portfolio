// Shared by the page and the 3D scene: the unboxing is 6 equal scroll segments.
// Segment 0 is the hero; segments 1 to 5 each pop one accessory out of its slot.
export const SEGMENTS = 6
export const ACCESSORIES = ['laptop', 'hat', 'meter', 'cable', 'transformer']

const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v) }

// How "out of the box" accessory i (0..4) is at chapter position c (0..6): 1 on its plateau, 0 elsewhere.
export function weight(c, i) {
  return smooth((0.5 - Math.abs(c - (i + 1.5))) / 0.22)
}

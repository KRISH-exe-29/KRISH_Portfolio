// Shared, framework-free state between the photo components and the WebGL water layer.
// The water layer reads `lens.el` every frame and draws a rippled copy of that image over it.
export const lens = { el: null }

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

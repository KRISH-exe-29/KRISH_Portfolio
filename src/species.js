/* Kept apart from tank.js so the page can draw the fish swatches without loading Three.js. */
// Nine species, one per app (same order as content.js apps).
export const SPECIES = [
  { kind: 'Comet goldfish', body: [1.0, 0.4, 0.28], tail: 'fork', dorsal: 'fin', a: '#e8622a', b: '#f2b04a', pattern: 0, speed: 1.35 },
  { kind: 'Angelfish', body: [0.62, 0.6, 0.16], tail: 'fan', dorsal: 'sail', a: '#efe3c8', b: '#1d1a16', pattern: 1, speed: 0.8 },
  { kind: 'Zebra danio', body: [0.85, 0.24, 0.17], tail: 'forkS', dorsal: 'fin', a: '#d9c48a', b: '#283a63', pattern: 3, speed: 1.9 },
  { kind: 'Kohaku koi', body: [1.2, 0.36, 0.3], tail: 'fan', dorsal: 'long', a: '#f3ece0', b: '#c8402a', pattern: 2, speed: 1.0 },
  { kind: 'Telescope-eye moor', body: [0.75, 0.55, 0.44], tail: 'veilS', dorsal: 'fin', a: '#24201d', b: '#4a4652', pattern: 0, speed: 0.9, eye: 0.1 },
  { kind: 'Ranchu', body: [0.8, 0.62, 0.52], tail: 'double', dorsal: null, a: '#e04a2a', b: '#f4ead6', pattern: 2, speed: 0.85 },
  { kind: 'Betta', body: [0.8, 0.3, 0.2], tail: 'veil', dorsal: 'long', a: '#2c3f8a', b: '#b0283a', pattern: 4, speed: 1.1 },
  { kind: 'Guppy', body: [0.6, 0.24, 0.16], tail: 'flag', dorsal: 'fin', a: '#cbb98a', b: '#e2563a', pattern: 4, speed: 1.5 },
  { kind: 'Pufferfish', body: [0.8, 0.7, 0.64], tail: 'tiny', dorsal: 'fin', a: '#dd9a2b', b: '#3b2f22', pattern: 2, speed: 0.75 },
]

// Deterministic "hand-placed" offsets for loose pieces: same index, same spot on every render.
const seeded = (index, salt) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

export const scatter = (index, salt = 0) => ({
  '--dx': `${Math.round((seeded(index, salt + 1) - 0.5) * 28)}px`,
  '--dy': `${Math.round(seeded(index, salt + 2) * 22 - 10)}px`,
  '--tilt': `${((seeded(index, salt + 3) - 0.5) * 7).toFixed(1)}deg`,
})

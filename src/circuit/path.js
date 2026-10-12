export const BOARD_COUNT = 7
export const DOCK_EPSILON = 0.012

const clamp = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

export const dockProgress = (index) => Math.min(BOARD_COUNT - 1, Math.max(0, index)) / (BOARD_COUNT - 1)

export function activeBoard(progress) {
  return Math.min(BOARD_COUNT - 1, Math.floor(clamp(progress) * (BOARD_COUNT - 1) + DOCK_EPSILON))
}

export function poweredBoards(progress) {
  const current = clamp(progress)
  return Array.from({ length: BOARD_COUNT }, (_, index) => current >= dockProgress(index) - DOCK_EPSILON)
}

export function advancePowered(previous, progress) {
  const current = poweredBoards(progress)
  return current.map((isPowered, index) => Boolean(previous[index]) || isPowered)
}

export function progressFromScroll(sectionTops, scrollY) {
  if (!Number.isFinite(scrollY) || !Array.isArray(sectionTops)) return 0
  // Fail closed: a malformed measurement must never read as "end of circuit" and reveal identity.
  if (sectionTops.length !== BOARD_COUNT || !sectionTops.every(Number.isFinite)) return 0
  if (scrollY <= sectionTops[0]) return 0
  const last = sectionTops.length - 1
  if (scrollY >= sectionTops[last]) return 1
  for (let index = 0; index < last; index += 1) {
    const start = sectionTops[index]
    const end = sectionTops[index + 1]
    if (scrollY <= end) {
      const local = end === start ? 0 : (scrollY - start) / (end - start)
      return clamp((index + clamp(local)) / last)
    }
  }
  return 1
}

export const isRevealed = (progress) => clamp(progress) >= dockProgress(BOARD_COUNT - 1) - DOCK_EPSILON

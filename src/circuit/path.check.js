// Run: node src/circuit/path.check.js
import assert from 'node:assert/strict'
import {
  BOARD_COUNT,
  DOCK_EPSILON,
  activeBoard,
  advancePowered,
  dockProgress,
  isRevealed,
  progressFromScroll,
  poweredBoards,
} from './path.js'

assert.equal(BOARD_COUNT, 7)
assert.equal(activeBoard(0), 0)
assert.equal(activeBoard(1), 6)
assert.equal(dockProgress(0), 0)
assert.equal(dockProgress(6), 1)

let previous = 0
const reached = new Set()
for (let step = 0; step <= 600; step += 1) {
  const board = activeBoard(step / 600)
  assert.ok(board >= previous, 'board index is monotonic')
  reached.add(board)
  previous = board
}
assert.deepEqual([...reached], [0, 1, 2, 3, 4, 5, 6])
for (let index = 1; index < BOARD_COUNT; index += 1) {
  assert.ok(dockProgress(index) > dockProgress(index - 1), 'docks are ordered')
}

assert.deepEqual(poweredBoards(0), [true, false, false, false, false, false, false])
assert.deepEqual(poweredBoards(dockProgress(3) + DOCK_EPSILON), [true, true, true, true, false, false, false])
assert.deepEqual(poweredBoards(1), [true, true, true, true, true, true, true])
assert.deepEqual(
  advancePowered([true, true, false, false, false, false, false], dockProgress(5)),
  [true, true, true, true, true, true, false],
  'jumping past a board powers every earlier board',
)
assert.deepEqual(
  advancePowered([true, true, true, false, false, false, false], 0),
  [true, true, true, false, false, false, false],
  'powered boards stay powered when progress moves backwards',
)
assert.equal(isRevealed(dockProgress(6) - DOCK_EPSILON * 2), false)
assert.equal(isRevealed(dockProgress(6) - DOCK_EPSILON), true)

const equalTops = [0, 100, 200, 300, 400, 500, 600]
assert.equal(progressFromScroll(equalTops, 300), 0.5)
const unevenTops = [0, 90, 260, 430, 720, 805, 1100]
unevenTops.forEach((top, index) => assert.equal(progressFromScroll(unevenTops, top), index / 6))
assert.equal(progressFromScroll(unevenTops, -20), 0)
assert.equal(progressFromScroll(unevenTops, 5000), 1)
assert.equal(progressFromScroll(unevenTops, Number.NaN), 0)
const brokenTops = [...unevenTops]
brokenTops[3] = Number.NaN
assert.equal(progressFromScroll(brokenTops, 1e9), 0, 'malformed tops fail closed, never reveal')
assert.equal(progressFromScroll(unevenTops.slice(1), 1e9), 0)
let mapped = 0
for (let position = -10; position < 1200; position += 1) {
  const next = progressFromScroll(unevenTops, position)
  assert.ok(next >= mapped, 'piecewise progress is monotonic')
  mapped = next
}
for (let step = 0; step <= 600; step += 1) {
  const progress = step / 600
  const board = activeBoard(progress)
  const powered = poweredBoards(progress)
  assert.ok(powered[board], 'the active board is always powered')
  assert.ok(board === 0 || powered[board - 1])
  assert.equal(isRevealed(progress), progress >= dockProgress(6) - DOCK_EPSILON)
}
console.log('circuit path ok')

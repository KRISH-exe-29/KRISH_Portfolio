import { useEffect, useState } from 'react'
import { calm } from '../motion.js'

// What Amp says in each section, by section id.
const LINES = {
  top: 'Welcome. I am Amp. Scroll, and I will show you around.',
  wake: 'This is a power transformer. Krishna tests these for a living.',
  guides: 'Five postings. Railway yard to transformer test bay.',
  hub: 'Nine apps. All of them in production.',
  ai: 'The tools think. They also cite their sources.',
  ship: 'Numbers, not adjectives.',
  record: 'The paperwork. It checks out.',
  contact: 'That is the tour. Send it over.',
}

// A 12 x 13 sprite: an engineer in a hard hat. Letters map to colours in PALETTE.
const SPRITE = [
  '....cccc....',
  '...cccccc...',
  '..cccccccc..',
  '.cccccccccc.',
  '...bbbbbb...',
  '...bkbbkb...',
  '...bbbbbb...',
  '....bbbb....',
  '..ddrrrrdd..',
  '.dddrrrrddd.',
  '.b.dddddd.b.',
  '...dd..dd...',
  '..kkk..kkk..',
]
const PALETTE = { c: '#e58e2f', b: '#e7e2e6', k: '#101113', d: '#5d5a61', r: '#ff3a2d' }

// The small guide in the corner: says one line per section, typed out.
export default function Guide() {
  const [id, setId] = useState('top')
  const [shown, setShown] = useState(calm ? LINES.top.length : 0)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const seen = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && LINES[e.target.id] && setId(e.target.id)),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    Object.keys(LINES).forEach((key) => {
      const el = document.getElementById(key)
      if (el) seen.observe(el)
    })
    return () => seen.disconnect()
  }, [])

  useEffect(() => {
    if (calm) return setShown(LINES[id].length)
    setShown(0)
    const timer = setInterval(() => {
      setShown((n) => {
        if (n >= LINES[id].length) clearInterval(timer)
        return n + 1
      })
    }, 24)
    return () => clearInterval(timer)
  }, [id])

  return (
    <aside className="guide" aria-hidden="true">
      {open && (
        <div className="guide-bubble slab">
          <p>{LINES[id].slice(0, shown)}</p>
          <button tabIndex={-1} onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
      <button className="guide-amp" tabIndex={-1} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 12 13" shapeRendering="crispEdges">
          {SPRITE.flatMap((row, y) =>
            [...row].map((ch, x) => (ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={PALETTE[ch]} />)),
          )}
        </svg>
        <span>AMP</span>
      </button>
    </aside>
  )
}

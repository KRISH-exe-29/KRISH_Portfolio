import { useEffect, useRef, useState } from 'react'
import { BANDS, F_MIN, PHASES, fmt, onSweep, xOf } from '../sweep.js'
import { scrollTo } from '../motion.js'
import Sound from './Sound.jsx'
import { chime } from '../sound.js'

const LINKS = [
  { band: 'core', label: 'Experience' },
  { band: 'windings', label: 'Apps' },
  { band: 'interaction', label: 'AI' },
  { band: 'leads', label: 'Contact' },
]
const DECADES = [20, 200, 2e3, 2e4, 2e5, 2e6]
// One note per band, rising with the sweep.
const NOTES = { core: 220, windings: 330, interaction: 440, leads: 660 }
// Minor ticks at 2x to 9x of each decade start (40 Hz, 60 Hz, ...), as on log graph paper.
const MINOR = DECADES.slice(0, -1).flatMap((d) => [2, 3, 4, 5, 6, 7, 8, 9].map((k) => d * k))

// Fixed instrument chrome: name and nav on top, the live frequency, and the ruler along the bottom.
export default function Chrome() {
  const [band, setBand] = useState('')
  useEffect(() => {
    if (NOTES[band]) chime(NOTES[band])
  }, [band])
  const value = useRef(null)
  const marker = useRef(null)

  useEffect(() => {
    return onSweep((f) => {
      value.current.textContent = fmt(f)
      marker.current.style.left = `${xOf(f) * 100}%`
      const now = f <= F_MIN ? '' : Object.values(BANDS).find((b) => f <= b.to)?.id ?? 'leads'
      setBand(now)
    })
  }, [])

  const go = (selector) => (e) => {
    e.preventDefault()
    scrollTo(selector)
  }

  return (
    <>
      <header className="top">
        <a className="mark" href="#top" onClick={go('#top')} aria-label="Krishna Raju S, back to the start">
          <span aria-hidden="true">{PHASES.map((p) => <i key={p.name} style={{ background: p.color }} />)}</span>
          Krishna Raju S
        </a>
        <nav aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.band} className="pill" href={`#${l.band}`} onClick={go(`#${l.band}`)} aria-current={band === l.band}>
              {l.label}
            </a>
          ))}
        </nav>
        <Sound track="floating-cities.mp3" />
        <p className="now readout" aria-hidden="true">
          f <b ref={value}>{fmt(F_MIN)}</b>
        </p>
      </header>

      <div className="ruler" aria-hidden="true">
        <div className="ruler-axis">
          {MINOR.map((f) => <i key={f} style={{ left: `${xOf(f) * 100}%` }} />)}
          {DECADES.map((f) => (
            <span key={f} style={{ left: `${xOf(f) * 100}%` }}>
              {fmt(f).replace('.0 ', ' ').replace('.00 ', ' ')}
            </span>
          ))}
          <b ref={marker} />
        </div>
      </div>
    </>
  )
}

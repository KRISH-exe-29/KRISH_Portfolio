import { useEffect, useRef, useState } from 'react'
import Band from '../components/Band.jsx'
import { apps, me, sideProjects } from '../content.js'
import { calm } from '../motion.js'
import './Windings.css'

const last = apps.length - 1
const ext = { target: '_blank', rel: 'noopener noreferrer' }

export default function Windings() {
  const pin = useRef(null)
  const stage = useRef(null)
  const track = useRef(null)
  const [current, setCurrent] = useState(1)

  useEffect(() => {
    if (calm) return
    // How far the track has to move: its full width minus what the stage shows.
    const measure = () => {
      const travel = Math.max(0, track.current.scrollWidth - stage.current.clientWidth)
      pin.current.style.setProperty('--travel', `${travel}px`)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(track.current)
    ro.observe(stage.current)

    const read = () => {
      const r = pin.current.getBoundingClientRect()
      const span = r.height - window.innerHeight
      if (span <= 0) return // not pinned at this width
      const p = Math.min(1, Math.max(0, -r.top / span))
      setCurrent(Math.round(p * last) + 1)
    }
    const raf = requestAnimationFrame(read)
    window.addEventListener('scroll', read, { passive: true })
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', read)
    }
  }, [])

  // Keyboard focus on a plate that is off to the side: scroll the run to where that plate is in view.
  const reveal = (i) => (e) => {
    if (calm || !e.target.matches(':focus-visible')) return
    const r = pin.current.getBoundingClientRect()
    const span = r.height - window.innerHeight
    if (span > 0) window.scrollTo({ top: window.scrollY + r.top + (i / last) * span })
  }

  return (
    <Band band="windings" title="Nine apps wound into one factory." lede={me.lines[0]}>
      <div
        ref={pin}
        className={calm ? 'windings-pin' : 'windings-pin windings-run'}
        data-string="progress"
        data-string-id="apps-pin"
        data-string-enter-el="top"
        data-string-enter-vp="top"
        data-string-exit-el="bottom"
        data-string-exit-vp="bottom"
      >
        <div className="windings-stage" ref={stage}>
          <p className="windings-count readout" aria-hidden="true">
            App {current} of {apps.length}
          </p>
          <ul className="windings-track" ref={track}>
            {apps.map((app, i) => (
              <li className="windings-plate plate" key={app.name} onFocus={reveal(i)}>
                <h3>{app.name}</h3>
                <p className="windings-pitch">{app.pitch}</p>
                <p className="windings-foot">
                  {app.url ? (
                    <a href={app.url} {...ext}>
                      {app.url.includes('github.com') ? 'Open the repo' : 'Open the app'}
                      <span className="sr-only"> for {app.name}</span>
                    </a>
                  ) : (
                    <span className="windings-internal">Internal tool</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
          <div className="windings-line" aria-hidden="true">
            <i />
          </div>
        </div>
      </div>

      <div className="windings-side">
        <h3>Off the clock.</h3>
        <ul>
          {sideProjects.map((p) => (
            <li className="windings-row" key={p.name}>
              <span className="windings-row-name">{p.url ? <a href={p.url} {...ext}>{p.name}</a> : p.name}</span>
              <span className="windings-row-pitch">{p.pitch}</span>
            </li>
          ))}
        </ul>
      </div>
    </Band>
  )
}

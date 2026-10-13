import { useEffect, useRef } from 'react'
import { awards, certifications, leadership, skills } from '../content.js'
import { calm } from '../motion.js'
import './Record.css'

const drift = [0.05, 0.09, 0.13]

export default function Record() {
  const run = useRef(null)
  const stage = useRef(null)
  const track = useRef(null)

  // How far the track has to move so its last card reaches the right edge of the stage.
  useEffect(() => {
    if (calm) return
    const measure = () => {
      const travel = Math.max(0, track.current.scrollWidth - stage.current.clientWidth)
      run.current.style.setProperty('--travel', `${travel}px`)
    }
    const watch = new ResizeObserver(measure)
    watch.observe(stage.current)
    watch.observe(track.current)
    return () => watch.disconnect()
  }, [])

  return (
    <section id="record" className="chapter record">
      <header className="record-head">
        <p className="caption">For when you need precision.</p>
        <h2 className="blur-in" data-string="split|progress" data-string-split="word|char">On the record</h2>
      </header>

      <div
        ref={run}
        className={calm ? 'record-run' : 'record-run record-pinned'}
        data-string="progress"
        data-string-id="record-pin"
        data-string-enter-el="top"
        data-string-enter-vp="top"
        data-string-exit-el="bottom"
        data-string-exit-vp="bottom"
      >
        <div ref={stage} className="record-stage">
          <ol ref={track} className="record-track">
            {awards.map((a) => (
              <li key={a.title} className="slab record-card">
                {a.photo && <img className="record-photo" src={a.photo} alt={a.photoAlt} loading="lazy" />}
                <div className="record-card-text">
                  <p className="caption record-year">{a.year}</p>
                  <h3>{a.title}</h3>
                  <p className="record-detail">{a.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="record-more">
        <div className="record-lead">
          <h3>{leadership.title}</h3>
          <p className="record-lead-text">{leadership.text}</p>
          <ul className="record-shots">
            {leadership.photos.map((p, i) => (
              <li key={p.src} className="slab record-shot">
                <div className="record-shot-drift" data-string="parallax" data-string-parallax={drift[i]}>
                  <img src={p.src} alt={p.alt} loading="lazy" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="record-facts">
          <p className="caption">Degree and certificates</p>
          <ul className="record-certs">
            {certifications.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p className="caption">Skills</p>
          <dl className="record-skills">
            {Object.entries(skills).map(([group, items]) => (
              <div key={group}>
                <dt>{group}</dt>
                <dd>{items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

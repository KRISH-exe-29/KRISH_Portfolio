import { useEffect, useRef } from 'react'
import { animate, createScope, onScroll, stagger } from 'animejs'
import Band from '../components/Band.jsx'
import { calm } from '../motion.js'
import { awards, certifications, leadership, me, skills } from '../content.js'
import './Leads.css'

const DRIFT = [0.06, 0.1, 0.14]
const ext = { target: '_blank', rel: 'noopener noreferrer' }

export default function Leads() {
  const record = useRef(null)

  useEffect(() => {
    if (calm) return
    const scope = createScope({ root: record }).add(() => {
      animate('.leads-row', {
        y: [28, 0], opacity: [0, 1], duration: 900, ease: 'out(4)', delay: stagger(50),
        autoplay: onScroll({ target: record.current, enter: 'bottom-=10% top' }),
      })
    })
    return () => scope.revert()
  }, [])

  return (
    <Band band="leads" title="Receipts, not adjectives." lede="The record first. Then the inbox.">
      <ul className="leads-record" ref={record} aria-label="The record">
        {awards.map((a) => (
          <li key={a.title} className={a.photo ? 'leads-row leads-has-shot' : 'leads-row'} tabIndex={a.photo ? 0 : undefined}>
            <span className="readout leads-year">{a.year}</span>
            <h3 className="leads-title">{a.title}</h3>
            <p className="leads-detail">{a.detail}</p>
            {a.photo && (
              <>
                <span className="leads-hint" aria-hidden="true">Photo</span>
                <figure className="plate leads-shot">
                  <img src={a.photo} alt={a.photoAlt} loading="lazy" />
                </figure>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="leads-lead">
        <div className="leads-lead-text">
          <h3>{leadership.title}</h3>
          <p>{leadership.text}</p>
        </div>
        <div className="leads-trio">
          {leadership.photos.map((p, i) => (
            <figure key={p.src} className="leads-frame">
              <div className="leads-drift" data-string="parallax" data-string-parallax={DRIFT[i % DRIFT.length]}>
                <img src={p.src} alt={p.alt} loading="lazy" />
              </div>
            </figure>
          ))}
        </div>
      </div>

      <div className="leads-papers">
        <div>
          <h3>Degree and certificates</h3>
          <ul className="leads-certs">
            {certifications.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
        <div>
          <h3>Skills</h3>
          <dl className="leads-skills">
            {Object.entries(skills).map(([group, items]) => (
              <div key={group}>
                <dt>{group}</dt>
                <dd>{items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="leads-contact">
        <p className="leads-call"><a href={`mailto:${me.email}`}>Send it over.</a></p>
        <p className="lede">{me.lines[1]}</p>
        <p className="leads-links">
          <a className="pill solid" href={`mailto:${me.email}`}>{me.email}</a>
          <a className="pill" href={me.linkedin} {...ext}>LinkedIn</a>
          <a className="pill" href={me.github} {...ext}>GitHub</a>
          <a className="pill" href={me.resume} download>Download resume</a>
        </p>
        <p className="readout leads-foot">
          <span>{me.name}</span>
          <span>{me.city}</span>
          <span>End of sweep, 2 MHz</span>
        </p>
      </div>
    </Band>
  )
}

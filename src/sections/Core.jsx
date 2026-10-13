import { useEffect, useRef, useState } from 'react'
import Band from '../components/Band.jsx'
import { experience, field } from '../content.js'
import './Core.css'

const notebook = field[0]

export default function Core() {
  const [active, setActive] = useState(0)
  const list = useRef(null)

  // The entry crossing the middle of the viewport is the one on the specimen plate.
  useEffect(() => {
    const io = new IntersectionObserver(
      (hits) => {
        for (const hit of hits) if (hit.isIntersecting) setActive(Number(hit.target.dataset.index))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const el of list.current.children) io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Band band="core" title="Five places that built the core." lede="Railway yard to transformer test bay. Oldest first.">
      <div className="core-grid">
        <div className="core-side">
          <div className="core-stick">
            <p className="core-year" aria-hidden="true">{experience[active].year}</p>
            <div className="core-frame plate">
              {experience.map((e, i) =>
                e.photo ? (
                  <img
                    key={e.id}
                    className={`core-layer${i === active ? ' is-active' : ''}`}
                    src={e.photo}
                    alt={e.photoAlt}
                    aria-hidden={i !== active}
                    loading="lazy"
                  />
                ) : (
                  <div key={e.id} className={`core-layer core-blank${i === active ? ' is-active' : ''}`} aria-hidden="true" />
                ),
              )}
            </div>
          </div>
        </div>

        <div className="core-rail" aria-hidden="true"><i /></div>

        <ol className="core-list" ref={list}>
          {experience.map((e, i) => (
            <li key={e.id} data-index={i} className={`core-entry${i === active ? ' is-active' : ''}`}>
              {e.photo && <img className="core-photo plate" src={e.photo} alt={e.photoAlt} loading="lazy" />}
              <p className="readout">{e.year}</p>
              <h3>{e.company}</h3>
              <p className="core-role">{e.role}, {e.place}</p>
              <p className="core-text">{e.text}</p>

              {e.id === notebook.id && (
                <div className="core-notebook">
                  <a className="pill" href={notebook.link.url} target="_blank" rel="noopener noreferrer">
                    {notebook.link.label}
                  </a>
                  <div className="core-shots">
                    {notebook.photos.map((p) => (
                      <figure key={p.src} className="core-shot plate">
                        <img src={p.src} alt={p.alt} loading="lazy" />
                        <figcaption>{p.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Band>
  )
}

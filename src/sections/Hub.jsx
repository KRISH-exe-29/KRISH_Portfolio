import { useEffect, useRef } from 'react'
import { animate, createScope, onScroll, stagger } from 'animejs'
import { apps, me, numbers, sideProjects } from '../content.js'
import { calm } from '../motion.js'
import './Hub.css'

const figures = ['apps', 'tests', 'seconds'].map((unit) => numbers.find((n) => n.unit === unit)).filter(Boolean)

const external = { target: '_blank', rel: 'noopener noreferrer' }

// One listener for the whole grid: each tile gets the pointer position relative to itself.
function spotlight(event) {
  for (const tile of event.currentTarget.children) {
    const box = tile.getBoundingClientRect()
    tile.style.setProperty('--mx', `${event.clientX - box.left}px`)
    tile.style.setProperty('--my', `${event.clientY - box.top}px`)
  }
}

export default function Hub() {
  const grid = useRef(null)

  useEffect(() => {
    if (calm) return
    const scope = createScope({ root: grid }).add(() => {
      animate('.hub-tile', {
        y: [36, 0], opacity: [0, 1], duration: 900, ease: 'out(4)', delay: stagger(60),
        autoplay: onScroll({ target: grid.current, enter: 'bottom-=10% top' }),
      })
    })
    return () => scope.revert()
  }, [])

  return (
    <section id="hub" className="chapter hub">
      <header className="hub-head">
        <p className="caption">It is minimal, expressive, and production first.</p>
        <h2 className="blur-in" data-string="split|progress" data-string-split="word|char">Skill hub</h2>
        <p className="lede">{me.lines[0]}</p>
      </header>

      <ul className="hub-grid" ref={grid} onPointerMove={calm ? undefined : spotlight}>
        {apps.map((app, i) => (
          <li className="slab hub-tile" key={app.name}>
            <p className="caption quiet">Skill {String(i + 1).padStart(2, '0')}</p>
            <h3>{app.name}</h3>
            <p className="hub-pitch">{app.pitch}</p>
            {app.url ? (
              <a className="hub-link" href={app.url} {...external}>
                {app.url.includes('github.com') ? 'Open the repo' : 'Open the app'}
                <span className="sr-only"> for {app.name}</span>
              </a>
            ) : (
              <p className="hub-link hub-internal">Internal tool</p>
            )}
          </li>
        ))}
      </ul>

      <ul className="hub-figures">
        {figures.map((n) => (
          <li key={n.unit}>
            <p className="hub-value">{n.value}</p>
            <p className="caption quiet">{n.unit} {n.label}</p>
          </li>
        ))}
      </ul>

      <div className="hub-side">
        <h3>Off the clock</h3>
        <ul className="hub-rows">
          {sideProjects.map((p) => (
            <li className="hub-row" key={p.name}>
              <p className="hub-row-name">{p.url ? <a href={p.url} {...external}>{p.name}</a> : p.name}</p>
              <p className="hub-row-pitch">{p.pitch}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import { createScope, createTimeline, splitText, stagger } from 'animejs'
import { experience, me, numbers } from '../content.js'
import { PHASES } from '../sweep.js'
import { calm, scrollTo } from '../motion.js'

export default function Hero() {
  const root = useRef(null)
  const job = experience[experience.length - 1]

  // The one orchestrated moment: the headline, then the panel, then the name, while the trace sweeps in behind.
  useEffect(() => {
    if (calm) return
    const scope = createScope({ root }).add(() => {
      const head = splitText('h1 span', { words: { wrap: 'clip' } })
      const name = splitText('.hero-word', { chars: { wrap: 'clip' } })
      createTimeline({ defaults: { ease: 'out(4)', duration: 1100 } })
        .add(head.words, { y: ['110%', '0%'], delay: stagger(70) }, 150)
        .add('.hero-by, .hero-note', { opacity: [0, 1], y: [18, 0], delay: stagger(120) }, 500)
        .add(name.chars, { y: ['100%', '0%'], duration: 1400, delay: stagger(35) }, 650)
        .add('.hero-numbers li', { opacity: [0, 1], delay: stagger(60) }, 1300)
    })
    return () => scope.revert()
  }, [])

  return (
    <section
      className="hero"
      id="top"
      ref={root}
      data-string="progress"
      data-string-id="hero"
      data-string-enter-el="top"
      data-string-enter-vp="top"
      data-string-exit-el="bottom"
      data-string-exit-vp="top"
    >
      <div className="hero-lead">
        <h1>
          <span>Walk the floor.</span>
          <span>Ship the tool.</span>
        </h1>
        <p className="hero-by">
          {me.name}
          <br />
          {job.role}, {job.company}
        </p>
      </div>

      <aside className="hero-note plate">
        <p>
          A frequency sweep reads a transformer from 20 Hz to 2 MHz, one band at a time: core, windings, connections.
          This page reads me the same way.
        </p>
        <ul>
          {PHASES.map((p) => (
            <li key={p.name} className="readout">
              <i style={{ background: p.color }} />
              {p.name} phase
            </li>
          ))}
        </ul>
        <button className="pill solid" onClick={() => scrollTo('#core')}>Start the sweep</button>
      </aside>

      <ul className="hero-numbers">
        {numbers.slice(0, 3).map((n) => (
          <li key={n.unit}>
            <b>{n.value}</b> {n.unit} <span>{n.label}</span>
          </li>
        ))}
      </ul>

      <p className="hero-word" aria-hidden="true">Krishna Raju</p>
    </section>
  )
}

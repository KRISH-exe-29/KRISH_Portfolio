import { useEffect, useRef } from 'react'
import { createScope, createTimeline, stagger } from 'animejs'
import { experience, me } from '../content.js'
import { calm, scrollTo } from '../motion.js'

const STACK = ['Test', 'the unit.', 'Ship', 'the tool.']

export default function Hero() {
  const root = useRef(null)
  const job = experience[experience.length - 1]

  // The page-load sequence: the stacked headline, then the small pieces, then the wordmark.
  useEffect(() => {
    if (calm) return
    const scope = createScope({ root }).add(() => {
      createTimeline({ defaults: { ease: 'out(4)', duration: 1100 } })
        .add('.hero-stack span i', { y: ['105%', '0%'], delay: stagger(90) }, 200)
        .add('.hero-by, .hero-hub, .hero .caption', { opacity: [0, 1], delay: stagger(90) }, 700)
        .add('.hero-word', { y: ['28%', '0%'], opacity: [0, 1], duration: 1500 }, 500)
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
      <p className="caption quiet hero-v">V_ 2026.10</p>

      <div className="hero-lead">
        <h1 className="hero-stack">
          {STACK.map((line) => (
            <span key={line}><i>{line}</i></span>
          ))}
        </h1>
        <p className="hero-by">
          Built by
          <br />
          {me.name}
        </p>
      </div>

      <div className="hero-hub">
        <p>Skill hub</p>
        <button className="slab" onClick={() => scrollTo('#hub')}>
          <span className="caption quiet">Now playing</span>
          <b>{job.role}</b>
          <span>{job.company}</span>
          <span className="caption">Open the hub</span>
        </button>
      </div>

      <p className="giant hero-word" aria-hidden="true">
        Krish.exe<sup>©</sup>
      </p>

      <p className="caption hero-for">
        For transformers and
        <br />
        the software around them
      </p>
      <p className="caption hero-how">Python first. Spreadsheet last.</p>
    </section>
  )
}

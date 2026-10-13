import { useEffect, useRef } from 'react'
import { animate, createScope, onScroll, splitText, stagger } from 'animejs'
import { BANDS, fmt } from '../sweep.js'
import { calm } from '../motion.js'

// One frequency band of the sweep: the section wrapper every content section uses.
// `band` is a key of BANDS. StringTune writes --progress (0 to 1) on the section as it crosses the viewport.
export default function Band({ band, title, lede, children }) {
  const b = BANDS[band]
  const head = useRef(null)

  useEffect(() => {
    if (calm) return
    const scope = createScope({ root: head }).add(() => {
      const { words } = splitText('h2', { words: { wrap: 'clip' } })
      animate(words, {
        y: ['110%', '0%'],
        duration: 1000,
        ease: 'out(4)',
        delay: stagger(45),
        autoplay: onScroll({ target: head.current, enter: 'bottom-=12% top' }),
      })
    })
    return () => scope.revert()
  }, [])

  return (
    <section
      id={b.id}
      className={`band band-${b.id}`}
      data-band
      data-from={b.from}
      data-to={b.to}
      data-string="progress"
      data-string-id={b.id}
    >
      <header className="band-head" ref={head}>
        <p className="band-range">
          <span>{fmt(b.from)}</span>
          <i aria-hidden="true" />
          <span>{fmt(b.to)}</span>
        </p>
        <p className="band-reads">Here the sweep reads {b.reads}.</p>
        <h2>{title}</h2>
        {lede && <p className="lede">{lede}</p>}
      </header>
      {children}
    </section>
  )
}

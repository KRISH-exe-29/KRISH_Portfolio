import { useEffect, useRef } from 'react'
import { scrollTo } from '../motion.js'
import Sound from './Sound.jsx'

const LINKS = [
  { to: '#guides', label: 'Field guides' },
  { to: '#hub', label: 'Skill hub' },
  { to: '#contact', label: 'Start a project', hot: true },
]

// Fixed chrome: the red progress bar, the mark, the nav pills, the percent and the two edge readouts.
export default function Chrome() {
  const bar = useRef(null)
  const pct = useRef(null)
  const top = useRef(null)
  const fps = useRef(null)

  useEffect(() => {
    let raf = 0
    let last = 0
    let frames = 0
    let since = 0
    let quiet = 0 // frames since the last scroll; the loop stops after a second of stillness

    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      bar.current.style.transform = `scaleX(${p})`
      pct.current.textContent = `${Math.round(p * 100)}%`
      top.current.textContent = `TOP: ${Math.round(window.scrollY)} PX`
    }
    const loop = (now) => {
      frames += 1
      if (now - since >= 500) {
        fps.current.textContent = `FPS: ${Math.round((frames * 1000) / (now - since))}`
        frames = 0
        since = now
      }
      if (window.scrollY !== last) {
        last = window.scrollY
        quiet = 0
        read()
      }
      quiet += 1
      raf = quiet < 70 ? requestAnimationFrame(loop) : 0
    }
    const wake = () => {
      if (raf) return
      quiet = 0
      frames = 0
      since = performance.now()
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('resize', read)
    read()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('resize', read)
    }
  }, [])

  const go = (selector) => (e) => {
    e.preventDefault()
    scrollTo(selector)
  }

  return (
    <>
      <div className="bar" ref={bar} aria-hidden="true" />
      <header className="top">
        <a className="mark" href="#top" onClick={go('#top')} aria-label="Krish.exe, back to the start">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13.5 2 5 13.5h5.5L9.5 22 19 9.5h-6z" />
          </svg>
        </a>
        <a className="wordmark" href="#top" onClick={go('#top')}>
          Krish.exe<sup>©</sup>
        </a>
        <nav aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.to} className={`pill${l.hot ? ' hot' : ''}`} href={l.to} onClick={go(l.to)}>
              {l.label}
            </a>
          ))}
        </nav>
        <Sound track="ishikari-lore.mp3" />
        <p className="pct caption" ref={pct} aria-hidden="true">0%</p>
      </header>
      <p className="edge caption" aria-hidden="true">
        <span ref={fps}>FPS: 60</span>
        <span ref={top}>TOP: 0 PX</span>
      </p>
    </>
  )
}

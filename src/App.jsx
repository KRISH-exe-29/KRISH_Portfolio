import { useEffect, useRef, useState } from 'react'
import { me, numbers } from './content.js'
import { drawnAt, headAt, reached, rings, route, thread } from './kolam.js'
import { startScore } from './audio.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Jobs, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calmQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const RINGS = rings(5)
const THREAD = thread()
const clamp = (x) => Math.min(1, Math.max(0, x))

const chapters = [
  {
    id: 'hello', nav: 'Hello',
    body: (
      <>
        <img className="portrait" src={me.portrait} alt={`${me.name}, portrait`} />
        <h1>{me.name}</h1>
        <p className="lede">{me.role}. {me.field}, {me.city}.</p>
        <p>{me.lines[0]}</p>
        <Numbers />
        <p className="hint">Scroll, and one line draws the rest.</p>
      </>
    ),
  },
  {
    id: 'internships', nav: 'Internships', wide: true,
    body: (
      <>
        <h2>Five internships</h2>
        <p className="lede">One ring for each, oldest at the centre.</p>
        <div className="pin">
          <figure aria-hidden="true">
            <svg viewBox="0 0 400 400">
              {RINGS.map((d) => <path key={d} className="ring" pathLength="1" d={d} />)}
              <circle className="dot lit" cx="200" cy="200" r="7" />
            </svg>
          </figure>
          <Jobs />
        </div>
      </>
    ),
  },
  {
    id: 'apps', nav: 'Apps', wide: true,
    body: (
      <>
        <h2>Nine apps in production</h2>
        <p className="lede">{me.lines[0]} {numbers[1].value} {numbers[1].unit} {numbers[1].label}.</p>
        <div className="pin">
          <figure aria-hidden="true">
            <svg viewBox="-10 -30 420 460">
              <path className="thread" pathLength={THREAD.total} strokeDasharray={THREAD.total} d={THREAD.d} />
              {THREAD.dots.map((p) => <circle key={`${p.x}-${p.y}`} className="dot" cx={p.x} cy={p.y} r="8" />)}
            </svg>
          </figure>
          <Apps />
        </div>
        <h3 className="gap">Off the clock</h3>
        <SideProjects />
      </>
    ),
  },
  { id: 'awards', nav: 'Awards', body: <><h2>A patent, a ranking, a team</h2><Awards /><Leadership /><Certifications /></> },
  { id: 'ai', nav: 'AI', body: <><h2>Agents and retrieval</h2><Agent /><Rag /><BrowserAI /></> },
  { id: 'contact', nav: 'Contact', body: <><h2>{me.lines[1]}</h2><p className="lede">{me.lines[2]} {me.lines[3]}</p><Contact /><Skills /></> },
]

export default function App() {
  const [calm, setCalm] = useState(calmQuery.matches)
  const [at, setAt] = useState(0)
  const [sound, setSound] = useState(false)
  const [line, setLine] = useState(null) // the route for the current page size
  const main = useRef(null)
  const paint = useRef(() => {})
  const score = useRef(null)

  useEffect(() => {
    const on = () => setCalm(calmQuery.matches)
    calmQuery.addEventListener('change', on)
    return () => calmQuery.removeEventListener('change', on)
  }, [])

  // Measure the chapters and lay the line around them. Runs again whenever the page reflows.
  useEffect(() => {
    const wrap = main.current
    const boxes = [...wrap.querySelectorAll('.chapter')]
    const build = () => {
      const width = wrap.clientWidth
      const phone = width < 760
      const top = wrap.getBoundingClientRect().top
      setLine({
        width,
        height: wrap.offsetHeight,
        ...route({
          width,
          lane: phone ? 44 : 120,
          step: phone ? 44 : 60,
          boxes: boxes.map((b) => { const r = b.getBoundingClientRect(); return { top: r.top - top, bottom: r.bottom - top } }),
        }),
      })
    }
    const watch = new ResizeObserver(build)
    watch.observe(wrap)
    document.fonts.ready.then(build)
    return () => watch.disconnect()
  }, [])

  // Draw as much of the line as the scroll position has earned.
  useEffect(() => {
    if (!line) return
    const wrap = main.current
    const strokes = [...wrap.querySelectorAll('.route path')]
    const head = wrap.querySelector('.head')
    const dots = [...wrap.querySelectorAll('.route .dot')]
    const boxes = [...wrap.querySelectorAll('.chapter')]
    const jobs = wrap.querySelector('.jobs')
    const ringEls = [...wrap.querySelectorAll('.ring')]
    const apps = wrap.querySelector('.pin .apps')
    const threadEl = wrap.querySelector('.thread')
    const threadDots = [...threadEl.parentNode.querySelectorAll('.dot')]
    let lit = 0
    let queued = 0
    // How far the reading line (62% down the screen) has got through an element.
    const through = (el) => { const r = el.getBoundingClientRect(); return calm ? 1 : clamp((window.innerHeight * 0.62 - r.top) / r.height) }

    paint.current = () => {
      queued = 0
      const scrolled = drawnAt(window.innerHeight * 0.62 - wrap.getBoundingClientRect().top, line)
      const len = calm ? line.total : scrolled
      strokes.forEach((s) => { s.style.strokeDashoffset = line.total - len })
      const tip = headAt(len, line)
      head.setAttribute('transform', `translate(${tip.x} ${tip.y})`)
      const now = reached(len, line.dotAt)
      for (let k = Math.min(lit, now); k < Math.max(lit, now); k++) dots[k].classList.toggle('lit', k < now)
      lit = now
      const open = reached(len, line.chapterAt)
      boxes.forEach((b, i) => b.classList.toggle('open', i < open))
      setAt(Math.max(0, reached(scrolled, line.chapterAt) - 1))
      score.current?.passed(now)

      const jobsDone = through(jobs) * RINGS.length
      ringEls.forEach((ring, k) => { ring.style.strokeDashoffset = 1 - clamp(jobsDone - k) })
      const threaded = through(apps) * THREAD.total
      threadEl.style.strokeDashoffset = THREAD.total - threaded
      THREAD.dotAt.forEach((mark, k) => {
        threadDots[k].classList.toggle('lit', mark <= threaded)
        apps.children[k].classList.toggle('lit', mark <= threaded)
      })
    }
    const queue = () => { queued ||= requestAnimationFrame(paint.current) }
    window.addEventListener('scroll', queue, { passive: true })
    paint.current()
    return () => {
      cancelAnimationFrame(queued)
      window.removeEventListener('scroll', queue)
    }
  }, [line, calm])

  useEffect(() => () => score.current?.stop(), [])

  const toggleSound = () => {
    if (score.current) {
      score.current.stop()
      score.current = null
    } else {
      score.current = startScore()
    }
    setSound(!!score.current)
  }

  return (
    <div className={calm ? 'calm' : 'live'}>
      <header className="bar">
        <nav aria-label="Chapters">
          <ol>
            {chapters.map((c, i) => (
              <li key={c.id}><a href={`#${c.id}`} aria-current={at === i ? 'step' : undefined}>{c.nav}</a></li>
            ))}
          </ol>
        </nav>
        <button onClick={toggleSound} aria-pressed={sound}>Sound {sound ? 'on' : 'off'}</button>
      </header>

      <main ref={main}>
        {line && (
          <svg className="route" viewBox={`0 0 ${line.width} ${line.height}`} aria-hidden="true">
            {line.dots.map((p, k) => <circle key={k} className="dot" cx={p.x} cy={p.y} r="4" />)}
            <path className="chalk" pathLength={line.total} strokeDasharray={line.total} d={line.d} />
            <path className="core" pathLength={line.total} strokeDasharray={line.total} d={line.d} />
            <circle className="head" r="8" />
          </svg>
        )}
        {chapters.map((c) => (
          <section key={c.id} id={c.id} className={c.wide ? 'chapter wide' : 'chapter'}>{c.body}</section>
        ))}
      </main>
    </div>
  )
}

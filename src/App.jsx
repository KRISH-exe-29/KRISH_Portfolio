import { useEffect, useRef, useState } from 'react'
import { awards, me, numbers } from './content.js'
import { segment } from './morph.js'
import { buildShapes } from './shapes.js'
import { createSwarm } from './swarm.js'
import { startScore } from './audio.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Jobs, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calmQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const patent = awards.find((a) => a.title.startsWith('Patent'))
const rank = awards.find((a) => a.title.startsWith('Rank'))

// Each chapter names the drawing the filings settle into while you read it.
const chapters = [
  {
    id: 'hello', nav: 'Hello', shape: 'name',
    body: (
      <>
        <h1>{me.name}</h1>
        <p className="lede">{me.role}. {me.field}, {me.city}.</p>
        <p>{me.lines[0]}</p>
        <Numbers />
      </>
    ),
  },
  { id: 'internships', nav: 'Internships', shape: 'transformer', body: <><h2>Five internships</h2><Jobs /></> },
  {
    id: 'patent', nav: 'Patent', shape: 'streetlight',
    body: <><h2>{patent.title}</h2><p className="lede">{patent.detail}.</p><Certifications /></>,
  },
  { id: 'awards', nav: 'Awards', shape: 'seven', body: <><h2>{rank.title}</h2><Awards /><Leadership /></> },
  {
    id: 'apps', nav: 'Apps', shape: 'tiles',
    body: (
      <>
        <h2>Nine apps in production</h2>
        <p className="lede">{me.lines[0]} {numbers[1].value} {numbers[1].unit} {numbers[1].label}.</p>
        <Apps />
        <h3 className="gap">Off the clock</h3>
        <SideProjects />
      </>
    ),
  },
  { id: 'ai', nav: 'AI', shape: 'net', body: <><h2>Agents and retrieval</h2><Agent /><Rag /><BrowserAI /></> },
  {
    id: 'contact', nav: 'Contact', shape: 'plane',
    body: <><h2>{me.lines[1]}</h2><p className="lede">{me.lines[2]} {me.lines[3]}</p><Contact /><Skills /></>,
  },
]

// Where a drawing sits: its half-size in px and its centre in clip space. The name gets
// the top of the first screen; on wide screens every other drawing takes the right half.
function place(i, w, h) {
  if (i === 0) return { r: Math.min(w * 0.44, h * 0.6), x: 0, y: 0.34 }
  return w < 900 ? { r: Math.min(w * 0.42, h * 0.3), x: 0, y: 0.3 } : { r: Math.min(w * 0.21, h * 0.38), x: 0.5, y: 0 }
}

export default function App() {
  const [calm, setCalm] = useState(calmQuery.matches)
  const [at, setAt] = useState(0)
  const [sound, setSound] = useState(false)
  const canvas = useRef(null)
  const main = useRef(null)
  const score = useRef(null)

  useEffect(() => {
    const on = () => setCalm(calmQuery.matches)
    calmQuery.addEventListener('change', on)
    return () => calmQuery.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const el = canvas.current
    const sections = [...main.current.children]
    const phone = window.innerWidth < 760
    let swarm
    let tops = []
    let raf = 0
    let last = window.scrollY
    let turb = 0
    let intro = calm ? 1 : 0 // the name gathering out of dust on first load
    let pointer = [9, 9]
    let alive = true
    const dpr = Math.min(window.devicePixelRatio, phone ? 1.5 : 2)

    const frame = (now) => {
      raf = 0
      const [w, h] = [window.innerWidth, window.innerHeight]
      const seg = segment(window.scrollY + h / 2, tops, h * 0.9)
      turb += (Math.min(1, Math.abs(window.scrollY - last) / 90) - turb) * 0.12
      last = window.scrollY
      intro = Math.min(1, intro + 0.011)
      const gathering = intro < 1 && seg.to === 0
      const mix = gathering ? intro * intro * (3 - 2 * intro) : calm ? Math.round(seg.mix) : seg.mix
      const [a, b] = [place(seg.from, w, h), place(seg.to, w, h)]
      const lerp = (k) => a[k] + (b[k] - a[k]) * seg.mix
      const shown = seg.mix >= 0.5 ? seg.to : seg.from
      swarm.draw({
        from: gathering ? 0 : seg.from + 1,
        to: seg.to + 1,
        mix,
        time: calm ? 0 : now / 1000,
        turb: calm ? 0 : turb,
        size: dpr * (phone ? 1.7 : 2.1),
        scale: [(2 * lerp('r')) / w, (2 * lerp('r')) / h],
        offset: [lerp('x'), lerp('y')],
        pointer,
      })
      setAt(shown)
      score.current?.set(turb, shown)
      if (!calm && !document.hidden) raf = requestAnimationFrame(frame)
    }
    const queue = () => { if (swarm) raf ||= requestAnimationFrame(frame) }
    const measure = () => {
      el.width = window.innerWidth * dpr
      el.height = window.innerHeight * dpr
      tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY)
      queue()
    }
    const onPointer = (e) => { pointer = [(e.clientX / window.innerWidth) * 2 - 1, 1 - (e.clientY / window.innerHeight) * 2] }
    const offPointer = () => { pointer = [9, 9] }

    // The name is drawn with the page's display face, so wait for it before sampling.
    document.fonts.load('800 100px "Bricolage Grotesque"').catch(() => {}).then(() => {
      if (!alive) return
      swarm = createSwarm(el, buildShapes(chapters.map((c) => c.shape), phone ? 12000 : 40000, me.name))
      measure()
    })

    const watch = new ResizeObserver(measure)
    watch.observe(main.current)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', queue, { passive: true })
    document.addEventListener('visibilitychange', queue)
    window.addEventListener('pointermove', onPointer)
    document.documentElement.addEventListener('pointerleave', offPointer)
    return () => {
      alive = false
      watch.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', queue)
      document.removeEventListener('visibilitychange', queue)
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', offPointer)
    }
  }, [calm])

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
    <>
      {/* key: a canvas keeps its first context for life, so a motion change needs a fresh one */}
      <canvas key={String(calm)} ref={canvas} className="swarm" aria-hidden="true" />
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
        {chapters.map((c) => (
          <section key={c.id} id={c.id} className={c.id}>
            <div className="copy">{c.body}</div>
          </section>
        ))}
      </main>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { me, numbers } from './content.js'
import { LEVELS, ZOOM, blend, depth, scene, voltage, volts } from './dive.js'
import { Scene } from './scenes.jsx'
import { startScore } from './audio.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Field, Jobs, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calmQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

// What you read at each level, top to bottom.
const chapters = [
  <>
    <img className="portrait" src={me.portrait} alt={`${me.name}, portrait`} />
    <h1>{me.name}</h1>
    <p className="lede">{me.role}. {me.field}, {me.city}.</p>
    <p>{me.lines[0]}</p>
    <Numbers />
    <p className="hint">Scroll to step down. Each level is a lower voltage and a closer look.</p>
  </>,
  <>
    <h2>Five internships</h2>
    <p>Oldest first, one tap position each.</p>
    <Jobs />
    <Field only="buhler" />
  </>,
  <>
    <h2>Nine apps in production</h2>
    <p>{me.lines[0]} {numbers[1].value} {numbers[1].unit} {numbers[1].label}.</p>
    <Apps />
    <p className="legend">A lit lamp means the app has a public link.</p>
    <h3>Off the clock</h3>
    <SideProjects />
  </>,
  <>
    <h2>A patent, a ranking, a team</h2>
    <Awards />
    <Leadership />
    <Field only="ced" />
    <Certifications />
  </>,
  <>
    <h2>Agents and retrieval</h2>
    <Agent />
    <Rag />
    <BrowserAI />
  </>,
  <>
    <h2>{me.lines[1]}</h2>
    <p>{me.lines[2]} {me.lines[3]}</p>
    <Contact />
    <Skills />
  </>,
]

export default function App() {
  const [calm, setCalm] = useState(calmQuery.matches)
  const [at, setAt] = useState(0)
  const [sound, setSound] = useState(false)
  const main = useRef(null)
  const stage = useRef(null)
  const readout = useRef(null)
  const score = useRef(null)
  const deep = useRef(0)

  useEffect(() => {
    const on = () => setCalm(calmQuery.matches)
    calmQuery.addEventListener('change', on)
    return () => calmQuery.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const sections = [...main.current.children]
    const layers = stage.current ? [...stage.current.querySelectorAll('.layer')] : []
    const cams = layers.map((l) => l.querySelector('.cam'))
    const labels = stage.current ? [...stage.current.querySelectorAll('.fly')] : []
    let tops = []
    let gate = 0
    let queued = 0

    const paint = () => {
      queued = 0
      const vh = window.innerHeight
      const d = depth(window.scrollY, tops, vh, gate, root.scrollHeight - vh)
      deep.current = d
      root.style.setProperty('--bg-now', blend(d, 'bg'))
      root.style.setProperty('--ink-now', blend(d, 'ink'))
      readout.current.textContent = volts(voltage(d))
      setAt(Math.round(d))
      score.current?.setDepth(d)
      layers.forEach((layer, i) => {
        const { scale, opacity } = scene(d, i)
        layer.style.opacity = opacity
        layer.style.visibility = opacity > 0 ? 'visible' : 'hidden'
        if (opacity > 0) cams[i].setAttribute('transform', `translate(800 450) scale(${scale}) translate(-800 -450)`)
      })
      // The next level's voltage rushes at the camera halfway through each flight.
      labels.forEach((label, i) => {
        const rel = d - (i + 0.54)
        const opacity = Math.max(0, 1 - Math.abs(rel) / 0.3)
        label.style.opacity = opacity
        label.style.transform = `scale(${ZOOM ** (rel * 1.5)})`
      })
    }
    const queue = () => { queued ||= requestAnimationFrame(paint) }
    const measure = () => {
      if (!main.current) return
      tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY)
      gate = main.current.querySelector('.gate').offsetHeight
      queue()
    }

    const watch = new ResizeObserver(measure)
    watch.observe(main.current)
    document.fonts.ready.then(measure)
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', measure)
    measure()
    return () => {
      watch.disconnect()
      cancelAnimationFrame(queued)
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', measure)
    }
  }, [calm])

  useEffect(() => () => score.current?.stop(), [])

  const toggleSound = () => {
    if (score.current) {
      score.current.stop()
      score.current = null
    } else {
      score.current = startScore()
      score.current.setDepth(deep.current)
    }
    setSound(!!score.current)
  }

  return (
    <div className={calm ? 'calm' : 'live'}>
      {!calm && (
        <div className="stage" ref={stage} aria-hidden="true">
          {LEVELS.map((l, i) => <div key={l.id} className="layer" style={{ color: l.ink }}><Scene level={i} /></div>)}
          {LEVELS.slice(1).map((l) => <b key={l.id} className="fly">{volts(l.volts)}</b>)}
        </div>
      )}

      <nav className="gauge" aria-label="Levels">
        <p ref={readout} aria-hidden="true">{volts(LEVELS[0].volts)}</p>
        <ol>
          {LEVELS.map((l, i) => (
            <li key={l.id}>
              <a href={`#${l.id}`} aria-current={at === i ? 'step' : undefined}>
                <span>{volts(l.volts)}</span> <i>{l.place}</i>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <button className="sound" onClick={toggleSound} aria-pressed={sound}>Sound {sound ? 'on' : 'off'}</button>

      <main ref={main}>
        {LEVELS.map((l, i) => (
          <section key={l.id} className="level" style={{ '--bg': l.bg, '--ink': l.ink }}>
            {i > 0 && <div className="gate" aria-hidden="true" />}
            <div className="sheet" id={l.id}>
              {calm && <Scene level={i} />}
              <p className="tag">{volts(l.volts)}, {l.place.toLowerCase()}</p>
              {chapters[i]}
            </div>
          </section>
        ))}
      </main>

    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { me, experience } from './content.js'
import { constellations } from './constellations.js'
import { startSky } from './sky.js'
import { startScore, setMuted, ring } from './score.js'
import { Agent, Apps, Building, Awards, BrowserAI, Certifications, Contact, Field, Jobs, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const now = experience[experience.length - 1]
const clamp = (x) => Math.min(1, Math.max(0, x))

const chapters = [
  {
    id: 'dark',
    body: (
      <>
        <p className="kicker">{me.name} · {now.role}, {now.company}</p>
        <h1>Every project<br />is a constellation.</h1>
        <p className="lede">This is a planetarium for one engineer&rsquo;s work. Scroll, and the projector draws it for you, one star at a time.</p>
        <p className="hint" aria-hidden="true">Scroll to draw</p>
      </>
    ),
  },
  {
    id: 'path', sky: 'path',
    body: (
      <>
        <p className="kicker">Five stars, oldest first</p>
        <h2>The Path</h2>
        <p className="lede">{me.role}. Each stop is a star; the line between them is the way it went.</p>
        <Jobs />
      </>
    ),
  },
  {
    id: 'five', sky: 'five',
    body: (
      <>
        <p className="kicker">The brightest five</p>
        <h2>The Five</h2>
        <p className="lede">{me.lines[0]}</p>
        <Numbers />
      </>
    ),
  },
  {
    id: 'transformer', sky: 'transformer',
    body: (
      <>
        <p className="kicker">Nine stars, two limbs and a yoke</p>
        <h2>The Transformer</h2>
        <p className="lede">The constellation of the factory: nine apps in production at Indo Tech Transformers, drawn in the shape of what they help build.</p>
        <Apps />
        <Building />
        <h3 className="gap">Off the clock</h3>
        <SideProjects />
      </>
    ),
  },
  {
    id: 'agent', sky: 'agent',
    body: (
      <>
        <p className="kicker">Twelve stars, one spiral</p>
        <h2>The Agent</h2>
        <p className="lede">One agent grown outward in twelve versions, the way a spiral galaxy grows. And the rest of the AI work.</p>
        <Agent />
        <Rag />
        <BrowserAI />
      </>
    ),
  },
  {
    id: 'crown', sky: 'crown',
    body: (
      <>
        <p className="kicker">Seven stars</p>
        <h2>The Crown</h2>
        <Awards />
        <Leadership />
        <Field />
      </>
    ),
  },
  {
    id: 'charts',
    body: (
      <>
        <p className="kicker">The star charts</p>
        <h2>Charts</h2>
        <Skills />
        <Certifications />
      </>
    ),
  },
  {
    id: 'name', sky: 'name',
    body: (
      <>
        <p className="kicker">The last constellation</p>
        <h2>You were looking at<br /><em>{me.name}.</em></h2>
        <p className="lede">{me.lines[1]} {me.lines[2]}</p>
        <Contact />
      </>
    ),
  },
]

export default function App() {
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const canvas = useRef(null)
  const lampOn = useRef(0)
  const state = useRef({ turn: 0, mouse: { x: 0, y: 0 }, shows: [], lamp: 0 })

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
    if (entered) lampOn.current = performance.now()
  }, [entered])

  useEffect(() => {
    const sections = [...document.querySelectorAll('[data-sky]')]
    const drawn = new Map()
    const aim = { x: 0, y: 0 }
    const mouse = { x: 0, y: 0 }
    let scrollState = { turn: 0, shows: [] }

    const measure = () => {
      const vh = window.innerHeight
      const probe = vh * 0.5
      const shows = []
      for (const s of sections) {
        const r = s.getBoundingClientRect()
        if (r.bottom < 0 || r.top > vh) continue
        const c = constellations[s.dataset.sky]
        // On a phone the sky shows in the gap above each chapter's text, so it draws while that gap passes.
        const narrow = window.innerWidth < 900
        const k = narrow ? clamp((vh - r.top) / (vh * 0.75)) : clamp((probe - r.top) / (r.height * 0.7))
        const alpha = narrow
          ? clamp((vh - r.top) / (vh * 0.2)) * clamp((r.bottom - vh * 0.3) / (vh * 0.3))
          : clamp(Math.min(probe - r.top + vh * 0.2, r.bottom - probe) / (vh * 0.3))
        shows.push({ c, k, alpha })
        // Ring a note for each edge as it closes, and only on the way forward.
        const edges = Math.floor(k * c.edges.length + 1e-6)
        const before = drawn.get(c) ?? 0
        for (let e = before; e < edges; e++) ring(e + Object.keys(constellations).indexOf(s.dataset.sky))
        drawn.set(c, edges)
      }
      const max = document.documentElement.scrollHeight - vh
      scrollState = { turn: max > 0 ? window.scrollY / max : 0, shows }
    }

    const read = () => {
      mouse.x += (aim.x - mouse.x) * 0.06
      mouse.y += (aim.y - mouse.y) * 0.06
      const since = lampOn.current ? (performance.now() - lampOn.current) / 1600 : 0
      state.current = { ...scrollState, mouse, lamp: calm ? (lampOn.current ? 1 : 0) : clamp(since) ** 2 }
      return state.current
    }

    const onMove = (e) => {
      aim.x = (e.clientX / window.innerWidth - 0.5) * 2
      aim.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const stop = startSky(canvas.current, read, calm)
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    window.addEventListener('pointermove', onMove)
    return () => {
      stop()
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  const enter = (withSound) => {
    setEntered(true)
    requestAnimationFrame(() => document.querySelector('.sound')?.focus()) // the gate's button is gone; keep keyboard focus on the page
    if (withSound) {
      startScore()
      setSound(true)
    }
  }

  const toggleSound = () => {
    if (!sound) startScore()
    setMuted(sound)
    setSound(!sound)
  }

  return (
    <>
      <div className="beam" aria-hidden="true" />
      <canvas ref={canvas} className="dome" aria-hidden="true" />

      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">Krishna Raju S · portfolio</p>
          <p id="gate-title" className="gate-title">Lights down, please.</p>
          <p className="gate-note">The show has a music box. Every line you draw between two stars rings a note.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Start the show with sound</button>
            <button className="btn" onClick={() => enter(false)}>Start it quietly</button>
          </div>
        </div>
      )}

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        {sound ? 'Sound on' : 'Sound off'}
      </button>

      <main inert={!entered || undefined}>
        {chapters.map((c) => (
          <section key={c.id} id={c.id} className={`chapter ${c.id}`} data-sky={c.sky}>
            <div className="panel">{c.body}</div>
          </section>
        ))}
        <p className="foot">The sky is drawn on a canvas and turns with the page; the music box is synthesised in the browser.</p>
      </main>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { me, experience } from './content.js'
import { startWater } from './water.js'
import { startScore, setMuted, follow, plunge } from './score.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Field, Jobs, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const now = experience[experience.length - 1]
const FLOOR = 200 // metres: where the sunlight zone ends

// Each zone owns a band of depth, in metres. Scrolling through it sinks the reader through that band.
const zones = [
  {
    id: 'surface', m: [0, 0], label: 'Surface',
    body: (
      <>
        <p className="kicker">{me.name} · {now.role}, {now.company}</p>
        <h1>How deep<br />does it go?</h1>
        <p className="lede">Most portfolios stay at the surface: a name, a title, a list. Take a breath. This one goes down {FLOOR} metres, to where the sunlight runs out.</p>
        <p className="hint" aria-hidden="true">Scroll to dive</p>
      </>
    ),
  },
  {
    id: 'shallows', m: [0, 30], label: 'The shallows',
    body: (
      <>
        <p className="kicker">0 to 30 m · still bright</p>
        <h2>The shallows</h2>
        <p className="lede">{me.role}. Five places, oldest first, each one a little deeper than the last.</p>
        <Jobs />
      </>
    ),
  },
  {
    id: 'pressure', m: [30, 60], label: 'Pressure',
    body: (
      <>
        <p className="kicker">30 to 60 m · four to seven atmospheres</p>
        <h2>Pressure</h2>
        <p className="lede">At this depth the water weighs on everything. These numbers hold up under it.</p>
        <Numbers />
      </>
    ),
  },
  {
    id: 'reef', m: [60, 100], label: 'The reef',
    body: (
      <>
        <p className="kicker">60 to 100 m · a working reef</p>
        <h2>The reef</h2>
        <p className="lede">{me.lines[0]} Each one runs on the factory floor at Indo Tech Transformers.</p>
        <Apps />
        <h3 className="gap">Off the clock</h3>
        <SideProjects />
      </>
    ),
  },
  {
    id: 'glow', m: [100, 140], label: 'Bioluminescence',
    body: (
      <>
        <p className="kicker">100 to 140 m · making its own light</p>
        <h2>Bio&shy;luminescence</h2>
        <p className="lede">Down here the light has to come from inside. The AI work.</p>
        <Agent />
        <Rag />
        <BrowserAI />
      </>
    ),
  },
  {
    id: 'wrecks', m: [140, 175], label: 'What is down here',
    body: (
      <>
        <p className="kicker">140 to 175 m · what settled here</p>
        <h2>Found down here</h2>
        <Awards />
        <Leadership />
        <Field />
      </>
    ),
  },
  {
    id: 'floor', m: [175, FLOOR], label: 'The floor',
    body: (
      <>
        <p className="kicker">175 to 200 m · bedrock</p>
        <h2>The floor</h2>
        <Skills />
        <Certifications />
      </>
    ),
  },
  {
    id: 'end', m: [FLOOR, FLOOR], label: '200 m',
    body: (
      <>
        <p className="kicker">200 m · the sunlight zone ends here</p>
        <h2>Most people stay at the surface.</h2>
        <p className="lede">You came all the way down. {me.lines[1]} {me.lines[2]}</p>
        <Contact />
      </>
    ),
  },
]

const TICKS = [0, 50, 100, 150, 200]

export default function App() {
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const canvas = useRef(null)
  const metres = useRef(null)
  const bar = useRef(null)
  const marker = useRef(null)
  const zone = useRef(null)
  const state = useRef({ depth: 0, travel: 0 })

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
  }, [entered])

  useEffect(() => {
    const water = startWater(canvas.current, () => state.current, calm)
    if (!water) document.documentElement.classList.add('flat')
    const sections = [...document.querySelectorAll('[data-m0]')]
    let lastY = window.scrollY
    let queued = false

    const update = () => {
      queued = false
      const probe = window.innerHeight * 0.5
      let m = 0
      let name = zones[0].label
      for (const s of sections) {
        const r = s.getBoundingClientRect()
        if (r.top > probe) break
        const k = Math.min(1, Math.max(0, (probe - r.top) / r.height))
        m = +s.dataset.m0 + (s.dataset.m1 - s.dataset.m0) * k
        name = s.dataset.label
      }
      const before = state.current.depth * FLOOR
      const speed = Math.abs(window.scrollY - lastY)
      lastY = window.scrollY
      state.current = { depth: m / FLOOR, travel: window.scrollY / window.innerHeight }
      if (before < 1 && m >= 1) plunge()
      follow(m / FLOOR, speed)
      water?.changed()
      // Without WebGL the page still darkens, as a plain colour.
      if (!water) document.body.style.setProperty('--sea', `${Math.round(48 - (m / FLOOR) * 46)}%`)

      metres.current.textContent = Math.round(m)
      bar.current.textContent = (1 + m / 10.06).toFixed(1)
      marker.current.style.transform = `translateY(${(m / FLOOR) * 100}%)`
      zone.current.textContent = name
    }
    const onScroll = () => {
      if (!queued) requestAnimationFrame(update)
      queued = true
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      water?.stop()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const enter = (withSound) => {
    setEntered(true)
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
      <canvas ref={canvas} className="sea" aria-hidden="true" />

      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">Krishna Raju S · portfolio</p>
          <p id="gate-title" className="gate-title">Take a breath.</p>
          <p className="gate-note">The music is underwater too. The deeper you go, the further away it sounds.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Dive with sound</button>
            <button className="btn" onClick={() => enter(false)}>Dive quietly</button>
          </div>
        </div>
      )}

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        {sound ? 'Sound on' : 'Sound off'}
      </button>

      <aside className="gauge" aria-hidden="true">
        <div className="scale">
          {TICKS.map((t) => <span key={t} style={{ top: `${(t / FLOOR) * 100}%` }}>{t}</span>)}
          <div className="track"><i ref={marker} /></div>
        </div>
        <p className="read"><b ref={metres}>0</b> m</p>
        <p className="read small"><b ref={bar}>1.0</b> bar</p>
        <p className="zone" ref={zone}>Surface</p>
      </aside>

      <main inert={!entered || undefined}>
        {zones.map((z) => (
          <section key={z.id} id={z.id} className={`zone-${z.id}`} data-m0={z.m[0]} data-m1={z.m[1]} data-label={z.label}>
            <div className="panel">{z.body}</div>
          </section>
        ))}
        <p className="foot">Pressure is absolute: about one bar of air at the surface, plus one for every ten metres of sea water. The water is a shader and the score is synthesised in the browser.</p>
      </main>
    </>
  )
}

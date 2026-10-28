import { useEffect, useRef, useState } from 'react'
import { me, experience } from './content.js'
import { CREST, END, volts, warp, unwarp } from './impulse.js'
import { startStrike } from './strike.js'
import { startScore, setMuted, follow, strike } from './score.js'
import { Agent, Apps, Building, Awards, BrowserAI, Certifications, Contact, Field, Jobs, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const now = experience[experience.length - 1]

// Uppercase type would turn µs into MS, so the unit is always set apart.
const Us = () => <span className="mu">µs</span>

// Each chapter owns a slice of the impulse, in µs. Scrolling through it moves time across that slice.
const chapters = [
  {
    id: 'zero', t: [0, 0.12], label: 't = 0',
    body: (
      <>
        <p className="kicker">Lightning impulse · 1.2/50 <Us /></p>
        <h1>Fifty<br />microseconds.</h1>
        <p className="lede">
          The standard lightning impulse: the shock a power transformer is built to survive. It peaks within two millionths
          of a second and has fallen to half by fifty. I fire it at transformers in a 161 kV test bay. This page slows one strike down until a career fits inside it.
        </p>
        <div className="byline">
          <img src={me.portrait} alt={`${me.name}, portrait`} />
          <p><b>{me.name}</b><br />{now.role}, {now.company}</p>
        </div>
        <p className="hint" aria-hidden="true">Scroll to strike</p>
      </>
    ),
  },
  {
    id: 'front', t: [0.12, CREST], label: 'Front',
    body: (
      <>
        <p className="kicker">0 → crest · the stepped leader</p>
        <h2>The front</h2>
        <p className="lede">Before the flash, a faint leader feels its way down in steps. Mine took five, oldest first.</p>
        <Jobs />
      </>
    ),
  },
  {
    id: 'crest', t: [CREST, 2.8], label: 'Crest',
    body: (
      <>
        <p className="kicker">1.00 per unit · the return stroke</p>
        <h2>Crest</h2>
        <p className="lede">{me.lines[0]}</p>
        <Numbers />
      </>
    ),
  },
  {
    id: 'branches', t: [2.8, 10], label: 'Branches',
    body: (
      <>
        <p className="kicker">The tail begins</p>
        <h2>Nine branches</h2>
        <p className="lede">Each branch of this strike is an app in production at Indo Tech Transformers. They light up as you pass.</p>
        <Apps />
        <Building />
        <h3 className="gap">Off the clock</h3>
        <SideProjects />
      </>
    ),
  },
  {
    id: 'induction', t: [10, 20], label: 'Induction',
    body: (
      <>
        <p className="kicker">Fields make currents</p>
        <h2>Induction</h2>
        <p className="lede">A strike induces current in everything near it. These are the AI projects.</p>
        <Agent />
        <Rag />
        <BrowserAI />
      </>
    ),
  },
  {
    id: 'proof', t: [20, 36], label: 'Proof',
    body: (
      <>
        <p className="kicker">What the strike left behind</p>
        <h2>Proof</h2>
        <Awards />
        <Leadership />
        <Field />
      </>
    ),
  },
  {
    id: 'ground', t: [36, END], label: 'Ground',
    body: (
      <>
        <p className="kicker">Where it all goes to earth</p>
        <h2>Ground</h2>
        <Skills />
        <Certifications />
      </>
    ),
  },
  {
    id: 'half', t: [END, END], label: '50 µs',
    body: (
      <>
        <p className="kicker">Time to half value</p>
        <h2>At 50 <Us /> the wave is down to half.<br /><em>The work isn&rsquo;t.</em></h2>
        <p className="lede">{me.lines[1]} {me.lines[2]}</p>
        <Contact />
      </>
    ),
  },
]

// The scope trace for the readout, drawn once on the stretched axis.
const SCOPE = Array.from({ length: 121 }, (_, i) => {
  const x = i / 120
  return `${i ? 'L' : 'M'}${(x * 200).toFixed(1)} ${(48 - volts(unwarp(x)) * 40).toFixed(1)}`
}).join(' ')

export default function App() {
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const canvas = useRef(null)
  const flash = useRef(null)
  const readT = useRef(null)
  const readU = useRef(null)
  const dot = useRef(null)
  const label = useRef(null)
  const state = useRef({ t: 0, lit: 0 })

  // Keep the page still behind the gate.
  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
  }, [entered])

  useEffect(() => {
    const strikeView = startStrike(canvas.current, () => state.current, calm)
    const sections = [...document.querySelectorAll('[data-t0]')]
    const apps = [...document.querySelectorAll('#branches .apps:not(.side) li')]
    let lastY = window.scrollY
    let queued = false

    const update = () => {
      queued = false
      const probe = window.innerHeight * 0.5
      let t = 0
      let name = chapters[0].label
      for (const s of sections) {
        const r = s.getBoundingClientRect()
        if (r.top > probe) break
        const k = Math.min(1, Math.max(0, (probe - r.top) / r.height))
        const a = warp(+s.dataset.t0)
        const b = warp(+s.dataset.t1)
        t = unwarp(a + (b - a) * k)
        name = s.dataset.label
      }
      const lit = apps.filter((li) => li.getBoundingClientRect().top < window.innerHeight * 0.62).length
      apps.forEach((li, i) => li.classList.toggle('lit', i < lit && t >= CREST))
      const before = state.current.t
      state.current = { t, lit }

      if (before < CREST && t >= CREST) {
        strike()
        if (!calm) {
          flash.current.classList.remove('go')
          void flash.current.offsetWidth // restart the animation
          flash.current.classList.add('go')
        }
      }
      const speed = Math.abs(window.scrollY - lastY)
      lastY = window.scrollY
      follow(t, speed)
      strikeView.changed()

      readT.current.textContent = t.toFixed(t < 10 ? 2 : 1)
      readU.current.textContent = volts(t).toFixed(2)
      dot.current.setAttribute('cx', (warp(t) * 200).toFixed(1))
      dot.current.setAttribute('cy', (48 - volts(t) * 40).toFixed(1))
      label.current.textContent = name
    }
    const onScroll = () => {
      if (!queued) requestAnimationFrame(update)
      queued = true
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      strikeView.stop()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const enter = (withSound) => {
    setEntered(true)
    requestAnimationFrame(() => document.querySelector('.sound')?.focus()) // the gate's button is gone; keep keyboard focus on the page
    if (withSound) {
      startScore()
      follow(state.current.t)
      setSound(true)
    }
  }

  const toggleSound = () => {
    if (!sound) startScore()
    setMuted(sound)
    if (!sound) follow(state.current.t)
    setSound(!sound)
  }

  return (
    <>
      <canvas ref={canvas} className="sky" aria-hidden="true" />
      <div ref={flash} className="flash" aria-hidden="true" />

      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">Krishna Raju S · portfolio</p>
          <p id="gate-title" className="gate-title">One lightning strike, slowed down.</p>
          <p className="gate-note">There is a score. It follows the strike as you scroll.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Enter with sound</button>
            <button className="btn" onClick={() => enter(false)}>Enter quietly</button>
          </div>
        </div>
      )}

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        {sound ? 'Sound on' : 'Sound off'}
      </button>

      <div className="hud" aria-hidden="true">
        <p className="read"><span className="sym">t</span><b ref={readT}>0.00</b><span className="unit">µs</span></p>
        <svg className="scope" viewBox="0 0 200 52">
          <line x1="0" y1="48" x2="200" y2="48" />
          <line x1={warp(CREST) * 200} y1="4" x2={warp(CREST) * 200} y2="48" className="mark" />
          <path d={SCOPE} />
          <circle ref={dot} r="3.2" cx="0" cy="48" />
        </svg>
        <p className="read"><span className="sym">u</span><b ref={readU}>0.00</b><span className="unit">pu</span></p>
        <p className="where" ref={label}>t = 0</p>
      </div>

      <main inert={!entered || undefined}>
        {chapters.map((c) => (
          <section key={c.id} id={c.id} className={`chapter ${c.id}`} data-t0={c.t[0]} data-t1={c.t[1]} data-label={c.label}>
            <div className="panel">{c.body}</div>
          </section>
        ))}
        <p className="foot">The waveform is the 1.2/50 µs lightning impulse of IEC 60060-1, modelled as u(t) = e<sup>−t/68.2</sup> − e<sup>−t/0.405</sup> (t in µs, scaled to a 1 pu crest) on a stretched time axis. The score is synthesised in the browser.</p>
      </main>
    </>
  )
}

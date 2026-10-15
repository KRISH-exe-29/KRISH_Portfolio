import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { me, experience } from './content.js'
import { createScene, LENGTH } from './scene.js'
import { startMusic, setLeg, muffle, setMuted } from './music.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Field, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const job = Object.fromEntries(experience.map((e) => [e.id, e]))

// Fill in an artist and it shows in the credits.
const soundtrack = [
  { title: 'FIN DE LA ODISEA', artist: '' },
  { title: 'Killswitch Lullaby', artist: 'flawed mangoes' },
]

function Job({ id }) {
  const e = job[id]
  return (
    <>
      <p className="where">{e.role} · {e.company} · {e.place} · {e.year}</p>
      <p>{e.text}</p>
      {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" />}
    </>
  )
}

// Each turn of the winding is a chapter. The load climbs as you go down.
const turns = [
  {
    id: 'mouth', leg: 0, rating: 'No load',
    title: <>Wound tight. <em>Built to carry load.</em></>,
    body: (
      <>
        <p className="lede">{me.name}. {me.role}. Nine apps in production at a transformer factory, and every turn of this coil is a job that added to the load.</p>
        <p className="hint">Scroll to energise ↓</p>
      </>
    ),
  },
  { id: 'railway', leg: 0, rating: '110 V', title: <>First current: <em>a railway coach.</em></>, body: <Job id="railway" /> },
  { id: 'mettur', leg: 0, rating: '4 × 210 MW', title: <>Then the <em>big stuff.</em></>, body: <Job id="mettur" /> },
  { id: 'inovate', leg: 0, rating: 'Full stack', title: <>Same discipline. <em>Different voltage.</em></>, body: <Job id="inovate" /> },
  { id: 'buhler', leg: 0, rating: '30 min → 30 s', title: <>Thirty minutes in. <em>Thirty seconds out.</em></>, body: <><Job id="buhler" /><Field only="buhler" /></> },
  { id: 'indotech', leg: 0, rating: '161 kV', title: <>Full load. <em>Nine apps. One factory.</em></>, body: <><Job id="indotech" /><Numbers /><Apps /></> },
  { id: 'ai', leg: 1, rating: 'Overload', title: <>Then I taught the factory <em>to think.</em></>, body: <><Agent /><Rag /><BrowserAI /></> },
  { id: 'tested', leg: 1, rating: 'Type tested', title: <>Tested. Passed. <em>Rank 7 of 1500+.</em></>, body: <><Awards /><Leadership /><h3>Off the clock</h3><SideProjects /></> },
  {
    id: 'core', leg: 1, rating: 'The core',
    title: <>{me.name}, <em>at the core.</em></>,
    body: <><p className="lede">{me.lines[1]} {me.lines[2]}</p><Contact /><Skills /><Certifications /></>,
  },
]
const smooth = (t) => t * t * (3 - 2 * t)

export default function App() {
  const canvasRef = useRef(null)
  const meterRef = useRef(null)
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const [at, setAt] = useState(0)
  const lenisRef = useRef(null)
  const atRef = useRef(0)

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
    if (entered) lenisRef.current?.start()
    else lenisRef.current?.stop()
  }, [entered])

  useEffect(() => {
    const scene = createScene(canvasRef.current, { calm })
    if (!scene) document.documentElement.classList.add('flat')
    const lenis = calm ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true })
    lenis?.stop()
    lenisRef.current = lenis

    const els = [...document.querySelectorAll('[data-turn]')]
    let centers = []
    const measure = () => {
      centers = els.map((el) => el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    els.forEach((el) => ro.observe(el))

    const io = new IntersectionObserver((list) => list.forEach((en) => en.isIntersecting && en.target.classList.add('in')), { rootMargin: '0px 0px -15% 0px' })
    els.forEach((el) => io.observe(el))

    let frame = 0
    const loop = (time) => {
      frame = requestAnimationFrame(loop)
      lenis?.raf(time)
      const y = window.scrollY
      let i = 0
      while (i < centers.length - 1 && y >= centers[i + 1]) i++
      const span = (centers[i + 1] ?? centers[i] + 1) - centers[i]
      const t = Math.min(1, Math.max(0, (y - centers[i]) / span))
      // Hold on each chapter, then plunge to the next.
      const pos = i + (i >= centers.length - 1 ? 0 : smooth(Math.min(1, Math.max(0, (t - 0.2) / 0.6))))
      const p = pos / (turns.length - 1)
      scene?.go(-4 - p * (LENGTH - 16), p)
      meterRef.current?.style.setProperty('--load', p)
      const now = Math.min(turns.length - 1, Math.round(pos))
      if (now !== atRef.current) {
        atRef.current = now
        setAt(now)
        setLeg(turns[now].leg)
      }
      muffle(lenis ? lenis.velocity : 0)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      lenis?.destroy()
      scene?.dispose()
    }
  }, [])

  const enter = (withSound) => {
    setEntered(true)
    requestAnimationFrame(() => document.querySelector('.sound')?.focus()) // the gate's buttons are gone; keep keyboard focus on the page
    if (withSound) {
      startMusic(turns[atRef.current].leg)
      setSound(true)
    }
  }

  const toggleSound = () => {
    if (!sound) startMusic(turns[atRef.current].leg)
    else setMuted(true)
    setSound(!sound)
  }

  const pct = Math.round((at / (turns.length - 1)) * 100)

  return (
    <>
      <canvas ref={canvasRef} className="world" aria-hidden="true" />

      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">Krishna Raju S · portfolio</p>
          <p id="gate-title" className="gate-title">Coil</p>
          <p className="gate-note">You&rsquo;re about to fly down the inside of a transformer winding. Nine turns, one career. It runs hotter the deeper you go.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Energise with sound</button>
            <button className="btn" onClick={() => enter(false)}>Go in quietly</button>
          </div>
        </div>
      )}

      <header className="meter" ref={meterRef} hidden={!entered}>
        <p className="turn">Turn <b>{String(at).padStart(2, '0')}</b>/{String(turns.length - 1).padStart(2, '0')}</p>
        <div className="bar" aria-hidden="true"><i /></div>
        <p className="load" aria-live="polite"><b>{pct}%</b> load · {turns[at].rating}</p>
        {sound && <p className="song">♪ {soundtrack[turns[at].leg].title}</p>}
      </header>

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>♪ Sound</button>

      <main className="bore" inert={!entered || undefined}>
        {turns.map((s, i) => (
          <section key={s.id} id={s.id} className={`turn-ch ${s.id}`} data-turn aria-labelledby={`h-${s.id}`}>
            <div className="card">
              <p className="kicker"><span>{String(i).padStart(2, '0')}</span> {s.rating}</p>
              {i === 0 ? <h1 id={`h-${s.id}`}>{s.title}</h1> : <h2 id={`h-${s.id}`}>{s.title}</h2>}
              {s.body}
            </div>
          </section>
        ))}
        <footer className="credits">
          <p>Soundtrack: {soundtrack.map((t, i) => (
            <span key={t.title}>{i > 0 && ' · '}{t.title}{t.artist && <> by {t.artist}</>}</span>
          ))}. All songs belong to their artists.</p>
          <p>The winding is drawn live in three.js: two layers of copper, pressboard spacers and a laminated core. Nothing here is a video.</p>
        </footer>
      </main>
    </>
  )
}

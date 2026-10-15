import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { me, experience } from './content.js'
import { createScene, GAP } from './scene.js'
import { startMusic, setLeg, muffle, setMuted } from './music.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Field, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const job = Object.fromEntries(experience.map((e) => [e.id, e]))

// Fill in an artist and it shows in the credits.
const soundtrack = [
  { title: 'For a Moment', artist: '' },
  { title: 'Lady Love', artist: '' },
  { title: 'Duvet (Acoustic Version)', artist: 'bôa' },
]

function Job({ id }) {
  const e = job[id]
  return (
    <>
      <p className="where">{e.role} · {e.company} · {e.place}</p>
      <p>{e.text}</p>
      {e.photo && <img className="whole" src={e.photo} alt={e.photoAlt} loading="lazy" />}
    </>
  )
}

// The route, in order. A stop with a board gets a platform; the rest are open line.
const stops = [
  {
    id: 'depart', leg: 0, board: null, kicker: 'Krish Express · 12026 · departs 23:40',
    title: <>Every stop made me <em>faster.</em></>,
    body: (
      <>
        <p className="lede">This one&rsquo;s yours. {me.name}: {me.role.toLowerCase()}, nine apps in production, and a route that runs from a railway yard in Tambaram to a 161 kV test bay in Kanchipuram.</p>
        <p className="hint">Scroll to depart ↓</p>
      </>
    ),
  },
  { id: 'tambaram', leg: 0, board: { name: 'TAMBARAM', code: 'TBM' }, kicker: 'Stop 1 · 2023', title: 'It started in a railway yard.', body: <Job id="railway" /> },
  { id: 'mettur', leg: 0, board: { name: 'METTUR DAM', code: 'MTDM' }, kicker: 'Stop 2 · 2024', title: <>4 × 210 MW of reasons to respect <em>high voltage.</em></>, body: <Job id="mettur" /> },
  { id: 'remote', leg: 1, board: null, kicker: 'Between stations · 2024', title: 'No platform. Just a laptop.', body: <Job id="inovate" /> },
  {
    id: 'mumbai', leg: 1, board: { name: 'MUMBAI', code: 'CSMT' }, kicker: 'Stop 3 · 2025 · IIT Bombay',
    title: <>Rank 7 of 1500+ colleges. <em>Not bad for a detour.</em></>,
    body: <><Awards /><Leadership /></>,
  },
  {
    id: 'bengaluru', leg: 1, board: { name: 'BENGALURU', code: 'SBC' }, kicker: 'Stop 4 · 2025',
    title: <>Thirty minutes of Excel, down to <em>thirty seconds.</em></>,
    body: <><Job id="buhler" /><Field only="buhler" /></>,
  },
  {
    id: 'kanchipuram', leg: 2, board: { name: 'KANCHIPURAM', code: 'CJ' }, kicker: 'Stop 5 · 2026 · now',
    title: <>Nine apps. One factory. <em>Zero spreadsheets left behind.</em></>,
    body: <><Job id="indotech" /><Numbers /><Apps /></>,
  },
  {
    id: 'night', leg: 2, board: null, kicker: 'Night shift · after hours',
    title: <>After hours, I teach machines to <em>read the manual.</em></>,
    body: <><Agent /><Rag /><BrowserAI /><h3>Off the clock</h3><SideProjects /></>,
  },
  {
    id: 'yours', leg: 2, board: { name: 'YOUR STATION', code: 'NEXT' }, kicker: 'Terminus',
    title: <>This one&rsquo;s <em>yours.</em></>,
    body: <><p className="lede">{me.lines[1]} {me.lines[2]}</p><Contact /><Skills /><Certifications /></>,
  },
]
const boarded = stops.filter((s) => s.board)
const smooth = (t) => t * t * (3 - 2 * t)

export default function App() {
  const canvasRef = useRef(null)
  const routeRef = useRef(null)
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const [at, setAt] = useState(0)
  const sceneRef = useRef(null)
  const lenisRef = useRef(null)
  const atRef = useRef(0)

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
    if (entered) lenisRef.current?.start()
    else lenisRef.current?.stop()
  }, [entered])

  useEffect(() => {
    const scene = createScene(canvasRef.current, stops, { calm })
    if (!scene) document.documentElement.classList.add('flat')
    sceneRef.current = scene
    const lenis = calm ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true })
    lenis?.stop()
    lenisRef.current = lenis

    const els = [...document.querySelectorAll('[data-stop]')]
    let centers = []
    const measure = () => {
      centers = els.map((el) => el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    els.forEach((el) => ro.observe(el))

    // Cards ease in as they reach the window.
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
      // The train dwells at each stop, then pulls away and brakes into the next.
      const leg = i >= centers.length - 1 ? 0 : smooth(Math.min(1, Math.max(0, (t - 0.18) / 0.64)))
      const pos = i + leg
      scene?.go(pos * GAP + 20)
      routeRef.current?.style.setProperty('--p', pos / (stops.length - 1))
      const now = Math.min(stops.length - 1, Math.round(pos))
      if (now !== atRef.current) {
        atRef.current = now
        setAt(now)
        setLeg(stops[now].leg)
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
    sceneRef.current?.green()
    requestAnimationFrame(() => document.querySelector('.sound')?.focus()) // the gate's buttons are gone; keep keyboard focus on the page
    if (withSound) {
      startMusic(stops[atRef.current].leg)
      setSound(true)
    }
  }

  const toggleSound = () => {
    if (!sound) startMusic(stops[atRef.current].leg)
    else setMuted(true)
    setSound(!sound)
  }

  const next = stops.slice(at + 1).find((s) => s.board) ?? stops[stops.length - 1]
  const song = soundtrack[stops[at].leg]

  return (
    <>
      <canvas ref={canvasRef} className="world" aria-hidden="true" />

      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">Krish Express · 12026 · Platform 0</p>
          <p id="gate-title" className="gate-title">The night train<br /><em>is boarding.</em></p>
          <p className="gate-note">One engineer, five stops, three songs. Scroll to drive. Scroll fast and the music muffles, like a carriage between stations.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Board with sound</button>
            <button className="btn" onClick={() => enter(false)}>Ride quietly</button>
          </div>
        </div>
      )}

      <header className="hud" hidden={!entered}>
        <p className="flap"><span>12026</span> Krish Express</p>
        <p className="flap next" aria-live="polite"><span>Next</span> {next.board?.name ?? 'Terminus'}</p>
        {sound && <p className="flap song"><span>♪</span> {song.title}</p>}
      </header>

      <nav className="route" ref={routeRef} aria-label="Stops" hidden={!entered}>
        <ol>
          {boarded.map((s) => (
            <li key={s.id} className={stops.indexOf(s) <= at ? 'passed' : ''} style={{ '--at': stops.indexOf(s) / (stops.length - 1) }}>
              <a href={`#${s.id}`}>{s.board.code}</a>
            </li>
          ))}
        </ol>
      </nav>

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        ♪ Sound
      </button>

      <main className="line" inert={!entered || undefined}>
        {stops.map((s) => (
          <section key={s.id} id={s.id} className={`stop ${s.id}`} data-stop aria-labelledby={`h-${s.id}`}>
            <div className="card">
              <p className="kicker">{s.kicker}</p>
              {s.id === 'depart'
                ? <h1 id={`h-${s.id}`}>{s.title}</h1>
                : <h2 id={`h-${s.id}`}>{s.title}</h2>}
              {s.body}
            </div>
          </section>
        ))}
        <footer className="credits">
          <p>Soundtrack: {soundtrack.map((t, i) => (
            <span key={t.title}>{i > 0 && ' · '}{t.title}{t.artist && <> by {t.artist}</>}</span>
          ))}. All songs belong to their artists.</p>
          <p>The night line is drawn live in three.js. Nothing here is a video.</p>
        </footer>
      </main>
    </>
  )
}

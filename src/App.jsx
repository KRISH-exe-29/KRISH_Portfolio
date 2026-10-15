import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { me, experience } from './content.js'
import { createRain } from './rain.js'
import { startMusic, setLeg, muffle, setMuted, thunder } from './music.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Field, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const job = Object.fromEntries(experience.map((e) => [e.id, e]))

// Fill in an artist and it shows in the credits.
const soundtrack = [
  { title: 'Drowning Love // Kou wo OiKakete (piano cover)', artist: '' },
  { title: 'In The Pool (Chainsaw Man: Reze Arc)', artist: '' },
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

// The night, in order. leg = which song plays; storm = lightning the first time you arrive.
const chapters = [
  {
    id: 'window', leg: 0, kicker: 'Chennai · 11 pm · rain on the glass',
    title: <>Some people wait for the storm to pass. <em>I ship through it.</em></>,
    body: (
      <>
        <p className="lede">{me.name}. {me.role}. {job.indotech.role} at {job.indotech.company}, nine apps in production, and a story that starts in a railway yard in Tambaram.</p>
        <p className="hint">Wipe the fog with your cursor or thumb. Scroll into the weather ↓</p>
      </>
    ),
  },
  { id: 'railway', leg: 0, kicker: 'Chapter 1 · 2023 · Tambaram', title: <>First rain: <em>a railway yard.</em></>, body: <Job id="railway" /> },
  { id: 'mettur', leg: 0, kicker: 'Chapter 2 · 2024 · Mettur', title: <>4 × 210 MW. <em>Respect the voltage.</em></>, body: <Job id="mettur" /> },
  { id: 'inovate', leg: 0, kicker: 'Chapter 3 · 2024 · Remote', title: <>No office, no platform. <em>Just the build.</em></>, body: <Job id="inovate" /> },
  { id: 'buhler', leg: 0, kicker: 'Chapter 4 · 2025 · Bangalore', title: <>Thirty minutes of Excel, down to <em>thirty seconds.</em></>, body: <Job id="buhler" /> },
  { id: 'indotech', leg: 0, kicker: 'Chapter 5 · 2026 · Kanchipuram · now', title: <>A 161 kV test bay by day. <em>Nine shipped apps by night.</em></>, body: <Job id="indotech" /> },
  {
    id: 'downpour', leg: 1, storm: true, kicker: 'The downpour · Indo Tech Transformers',
    title: <>Nine apps. One factory. <em>Zero spreadsheets left behind.</em></>,
    body: <><p className="lede">All nine are in production. The linked ones open right now.</p><Numbers /><Apps /></>,
  },
  {
    id: 'after-hours', leg: 1, kicker: 'After hours · still pouring',
    title: <>After hours, I teach machines <em>to read the manual.</em></>,
    body: <><Agent /><Rag /><BrowserAI /></>,
  },
  {
    id: 'thunder', leg: 1, storm: true, kicker: 'Thunder · 2024 to 2026',
    title: <>Rank 7 of 1500+ colleges. <em>Loud enough to hear over the rain.</em></>,
    body: <><Awards /><Leadership /></>,
  },
  { id: 'field', leg: 1, kicker: 'Bengaluru · June 2025', title: <>The photos, <em>wiped clear.</em></>, body: <Field only="buhler" /> },
  {
    id: 'side', leg: 1, kicker: 'Side projects · the rain thins',
    title: <>Even my side projects <em>watch the weather.</em></>,
    body: <><p className="lede">One of them raises a flood alarm early.</p><SideProjects /></>,
  },
  {
    id: 'clear', leg: 1, kicker: 'Clear sky · after the storm',
    title: <>The rain&rsquo;s done. <em>Send it over.</em></>,
    body: <><p className="lede">{me.lines[1]} {me.lines[2]}</p><Contact /><Skills /><Certifications /></>,
  },
]
const last = chapters.length - 1

const weather = (k) =>
  k > 0.85 ? 'Thunderstorm' : k > 0.6 ? 'Heavy rain' : k > 0.35 ? 'Steady rain' : k > 0.12 ? 'Drizzle' : k > 0.02 ? 'Clearing' : 'Clear sky'

export default function App() {
  const canvasRef = useRef(null)
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const [at, setAt] = useState(0)
  const [sky, setSky] = useState({ label: 'Thunderstorm', time: '11:00' })
  const rainRef = useRef(null)
  const lenisRef = useRef(null)
  const atRef = useRef(0)
  const soundRef = useRef(false)
  const enteredRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
    enteredRef.current = entered
    if (entered) lenisRef.current?.start()
    else lenisRef.current?.stop()
  }, [entered])

  useEffect(() => {
    soundRef.current = sound
  }, [sound])

  useEffect(() => {
    const rain = createRain(canvasRef.current, { calm })
    rainRef.current = rain
    const lenis = calm ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true })
    lenis?.stop()
    lenisRef.current = lenis

    const els = [...document.querySelectorAll('[data-chapter]')]
    let centers = []
    const measure = () => {
      centers = els.map((el) => el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    els.forEach((el) => ro.observe(el))

    // Cards clear like breath fading off glass as they reach the window.
    const io = new IntersectionObserver((list) => list.forEach((en) => en.isIntersecting && en.target.classList.add('in')), { rootMargin: '0px 0px -15% 0px' })
    els.forEach((el) => io.observe(el))

    const struck = new Set()
    const root = document.documentElement
    let label = ''
    let frame = 0
    const loop = (time) => {
      frame = requestAnimationFrame(loop)
      lenis?.raf(time)
      const y = window.scrollY
      let i = 0
      while (i < centers.length - 1 && y >= centers[i + 1]) i++
      const span = (centers[i + 1] ?? centers[i] + 1) - centers[i]
      const pos = i + Math.min(1, Math.max(0, (y - centers[i]) / span))
      // Heavy for most of the night, easing off fast near the end, clear on the last chapter.
      const k = 1 - Math.pow(pos / last, 2.2)
      rain?.setIntensity(k)
      root.style.setProperty('--clear', Math.min(1, Math.max(0, pos - (last - 1))))
      const now = Math.min(last, Math.round(pos))
      if (now !== atRef.current) {
        atRef.current = now
        setAt(now)
        setLeg(chapters[now].leg)
      }
      const c = chapters[now]
      if (c.storm && enteredRef.current && !struck.has(c.id)) {
        struck.add(c.id)
        if (rain?.flash() && soundRef.current) thunder()
      }
      // The clock runs from 11:00 to 11:55 as the night scrolls by.
      const clock = `11:${String(Math.round(pos * 5)).padStart(2, '0')}`
      const next = `${weather(k)}|${clock}`
      if (next !== label) {
        label = next
        setSky({ label: weather(k), time: clock })
      }
      muffle(lenis ? lenis.velocity : 0)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      lenis?.destroy()
      rain?.dispose()
    }
  }, [])

  const enter = (withSound) => {
    setEntered(true)
    requestAnimationFrame(() => document.querySelector('.sound')?.focus()) // the gate's buttons are gone; keep keyboard focus on the page
    const flashed = rainRef.current?.flash() // the storm says hello
    if (withSound) {
      startMusic(chapters[atRef.current].leg)
      setSound(true)
      if (flashed) thunder()
    }
  }

  const toggleSound = () => {
    if (!sound) startMusic(chapters[atRef.current].leg)
    else setMuted(true)
    setSound(!sound)
  }

  const song = soundtrack[chapters[at].leg]

  return (
    <>
      <div className="city" aria-hidden="true"><div className="clear-sky" /></div>
      <canvas ref={canvasRef} className="glass" aria-hidden="true" />

      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">Chennai · 11 pm · monsoon</p>
          <p id="gate-title" className="gate-title">It&rsquo;s pouring.<br /><em>Come to the window.</em></p>
          <p className="gate-note">One engineer, twelve chapters, two songs and one storm. Wipe the fogged glass with your cursor or thumb. Scroll and the rain eases. Scroll fast and the music drowns under it.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Enter with sound</button>
            <button className="btn" onClick={() => enter(false)}>Enter quietly</button>
          </div>
        </div>
      )}

      <header className="hud" hidden={!entered}>
        <p className="tag"><span>Chennai</span> {sky.time} pm · {sky.label}</p>
        <p className="tag count"><span>Ch</span> {String(at).padStart(2, '0')} / {last}</p>
        {sound && <p className="tag song"><span>♪</span> {song.title}</p>}
      </header>

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        ♪ Sound
      </button>

      <main className="story" inert={!entered || undefined}>
        {chapters.map((c) => (
          <section key={c.id} id={c.id} className={`chapter ${c.id}`} data-chapter aria-labelledby={`h-${c.id}`}>
            <div className="card">
              <p className="kicker">{c.kicker}</p>
              {c.id === 'window'
                ? <h1 id={`h-${c.id}`}>{c.title}</h1>
                : <h2 id={`h-${c.id}`}>{c.title}</h2>}
              {c.body}
            </div>
          </section>
        ))}
        <footer className="credits">
          <p>Soundtrack: {soundtrack.map((t, i) => (
            <span key={t.title}>{i > 0 && ' · '}{t.title}{t.artist && <> by {t.artist}</>}</span>
          ))}. All songs belong to their artists.</p>
          <p>The rain, the fog and the lightning are drawn live on a canvas. Nothing here is a video.</p>
        </footer>
      </main>
    </>
  )
}

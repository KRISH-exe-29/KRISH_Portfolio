import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { me, experience, apps, ai, awards, leadership, field } from './content.js'
import { startMusic, setLeg, muffle, setMuted, PLUTO } from './music.js'
import { Agent, Awards, BrowserAI, Certifications, Contact, Field, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const job = Object.fromEntries(experience.map((e) => [e.id, e]))
const prize = Object.fromEntries(awards.filter((a) => a.photo).map((a) => [a.photo, a]))
const out = { target: '_blank', rel: 'noopener noreferrer' }

// Fill in an artist and it shows in the credits.
const soundtrack = [
  { title: "Parfum d'étoiles", artist: 'Ichiko Aoba' },
  { title: 'Great Fairy Fountain', artist: '' },
  { title: 'pluto projector ending (instrumental)', artist: '' },
]
// Until the third song is in (see PLUTO in music.js), the last rooms reprise the first song.
const LAST = PLUTO ? 2 : 0
const credited = PLUTO ? soundtrack : soundtrack.slice(0, 2)

// A museum wall label: title, a year and medium line, then the text.
function Label({ title, line, children }) {
  return (
    <div className="label">
      <h3>{title}</h3>
      <p className="medium">{line}</p>
      {children}
    </div>
  )
}

function Job({ id }) {
  const e = job[id]
  return (
    <Label title={e.company} line={`${e.year} · ${e.role} · ${e.place}`}>
      <p>{e.text}</p>
      {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" />}
    </Label>
  )
}

function Works() {
  return (
    <ol className="works">
      {apps.map((a, i) => (
        <li key={a.name}>
          <p className="no">No. {i + 1}</p>
          <Label title={a.name} line="2026 · Software, in production · Indo Tech Transformers">
            <p>{a.pitch}</p>
            {a.url ? <a href={a.url} {...out}>View the work ↗</a> : <p className="medium">On view at the factory only.</p>}
          </Label>
        </li>
      ))}
    </ol>
  )
}

// Seven rooms down one corridor. `leg` picks the song, `door` is painted over the exit,
// `hang` is what hangs on the walls (l/r side, `at` = how far down the room).
const rooms = [
  {
    id: 'entrance', leg: 0, num: '0', name: 'Entrance', paint: '#211e1a', door: 'Gallery I · Early works',
    kicker: 'Admission free · Open late',
    title: <>{me.name}: <em>Works 2023–2026</em></>,
    body: (
      <>
        <p className="lede">Nine works. All of them in use. A retrospective of an {me.role.toLowerCase()}, hung in the order it happened: from a railway yard in Tambaram to a 161 kV test bay in Kanchipuram.</p>
        <Numbers />
        <p className="hint">Walk on ↓</p>
      </>
    ),
    hang: [
      { side: 'l', at: 0.5, img: me.portrait, cap: me.name },
      { side: 'r', at: 0.5, text: 'Works 2023–2026', cap: 'Title wall' },
    ],
  },
  {
    id: 'early', leg: 0, num: 'I', name: 'Early works', paint: '#2c3a33', door: 'Gallery II · The collection',
    kicker: 'Gallery I · 2023–2024',
    title: <>Before the software, <em>the current.</em></>,
    body: <><Job id="railway" /><Job id="mettur" /><Job id="inovate" /></>,
    hang: [
      { side: 'l', at: 0.3, img: job.railway.photo, cap: `${job.railway.company}, ${job.railway.year}` },
      { side: 'r', at: 0.5, text: '4 × 210 MW', cap: `${job.mettur.company}, ${job.mettur.year}` },
      { side: 'l', at: 0.78, text: 'Project: Phantom', cap: `${job.inovate.company}, ${job.inovate.year}` },
    ],
  },
  {
    id: 'collection', leg: 1, num: 'II', name: 'The permanent collection', paint: '#e9e3d7', light: true, door: 'Gallery III · After hours',
    kicker: 'Gallery II · 2026 · Indo Tech Transformers',
    title: <>Nine works. <em>All of them in use.</em></>,
    body: (
      <>
        <p className="lede">{me.lines[0]}</p>
        <Job id="indotech" />
        <Works />
      </>
    ),
    hang: apps.map((a, i) => ({ side: i % 2 ? 'r' : 'l', at: 0.14 + i * 0.095, text: a.name, cap: `No. ${i + 1}` })),
  },
  {
    id: 'after-hours', leg: 1, num: 'III', name: 'After hours', paint: '#1d2636', door: 'Gallery IV · Honours',
    kicker: 'Gallery III · Studies in machine reading',
    title: <>After hours, the machines <em>learn to read.</em></>,
    body: (
      <>
        <div className="label"><Agent /></div>
        <div className="label"><Rag /></div>
        <div className="label"><BrowserAI /></div>
        <h3 className="room-sub">Studio sketches</h3>
        <SideProjects />
      </>
    ),
    hang: [
      { side: 'l', at: 0.3, text: `${ai.agent.name} · ${ai.agent.versions.length} versions`, cap: 'Study I' },
      { side: 'r', at: 0.5, text: ai.rag.steps.join(' → '), cap: 'Study II' },
      { side: 'l', at: 0.75, text: 'On the device', cap: 'Study III' },
    ],
  },
  {
    id: 'honours', leg: 1, num: 'IV', name: 'Honours', paint: '#4a1f21', door: 'Gallery V · Field photographs',
    kicker: 'Gallery IV · The trophy case',
    title: <>Rank 7 of 1500+ colleges. <em>And a team built from scratch.</em></>,
    body: <><Awards /><div className="label"><Leadership /></div></>,
    hang: [
      ...Object.values(prize).map((a, i) => ({ side: i % 2 ? 'r' : 'l', at: 0.2 + i * 0.12, img: a.photo, cap: `${a.title}, ${a.year}` })),
      ...leadership.photos.map((p, i) => ({ side: i % 2 ? 'l' : 'r', at: 0.5 + i * 0.15, img: p.src, cap: leadership.title })),
    ],
  },
  {
    id: 'field', leg: LAST, num: 'V', name: 'Field photographs', paint: '#e4ddcf', light: true, door: 'Exit through the gift shop',
    kicker: `Gallery V · ${field[0].title} · ${field[0].when}`,
    title: <>Thirty minutes of Excel, <em>now thirty seconds.</em></>,
    body: <><Job id="buhler" /><Field only="buhler" /></>,
    hang: [
      { side: 'l', at: 0.3, img: job.buhler.photo, cap: `${job.buhler.company}, ${job.buhler.year}` },
      ...field[0].photos.map((p, i) => ({ side: i % 2 ? 'l' : 'r', at: 0.5 + i * 0.22, img: p.src, cap: p.caption })),
    ],
  },
  {
    id: 'gift-shop', leg: LAST, num: 'VI', name: 'Gift shop', paint: '#26221e', door: 'Exit',
    kicker: 'Exit through the gift shop',
    title: <>The next piece is <em>yours to commission.</em></>,
    body: <><p className="lede">{me.lines[1]} {me.lines[2]}</p><Contact /><Skills /><Certifications /></>,
    hang: [
      { side: 'l', at: 0.4, text: me.lines[3], cap: 'Gift shop' },
      { side: 'r', at: 0.6, text: me.lines[2], cap: 'Gift shop' },
    ],
  },
]
const smooth = (t) => t * t * (3 - 2 * t)

export default function App() {
  const hallRef = useRef(null)
  const worldRef = useRef(null)
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
    const lenis = calm ? null : new Lenis({ lerp: 0.08, wheelMultiplier: 0.9, anchors: true })
    lenis?.stop()
    lenisRef.current = lenis

    const hall = hallRef.current
    const world = worldRef.current
    const halls = [...hall.querySelectorAll('.room')]
    const els = [...document.querySelectorAll('[data-room]')]
    let centers = []
    let depth = 1600
    let eye = 900
    let p = 800
    const measure = () => {
      centers = els.map((el) => el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2)
      // The corridor scales with the window, so a phone sees the same gallery a monitor does.
      const w = window.innerWidth
      p = Math.max(360, w * 0.75)
      depth = p * 2.4
      eye = p + depth * 0.08
      hall.style.setProperty('--p', `${p}px`)
      hall.style.setProperty('--hw', `${Math.max(150, w * 0.46)}px`)
      hall.style.setProperty('--hh', `${window.innerHeight * 0.5}px`)
      hall.style.setProperty('--L', `${depth}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    els.forEach((el) => ro.observe(el))
    window.addEventListener('resize', measure)

    const io = new IntersectionObserver((list) => list.forEach((en) => en.isIntersecting && en.target.classList.add('in')), { rootMargin: '0px 0px -15% 0px' })
    els.forEach((el) => io.observe(el))

    let frame = 0
    let base = -1
    const loop = (time) => {
      frame = requestAnimationFrame(loop)
      lenis?.raf(time)
      const y = window.scrollY
      let i = 0
      while (i < centers.length - 1 && y >= centers[i + 1]) i++
      const span = (centers[i + 1] ?? centers[i] + 1) - centers[i]
      const t = Math.min(1, Math.max(0, (y - centers[i]) / span))
      // Linger in each room, then walk through the door. Reduced motion jumps room to room.
      const leg = calm || i >= centers.length - 1 ? 0 : smooth(Math.min(1, Math.max(0, (t - 0.15) / 0.7)))
      const pos = i + leg
      // The walls turn as you pass: a slow yaw while walking, straight again in each room.
      const yaw = calm ? 0 : Math.sin(leg * Math.PI) * 6 * (i % 2 ? -1 : 1)
      world.style.transform = `translateZ(${p}px) rotateY(${yaw.toFixed(2)}deg) translateZ(${(pos * depth + eye - p).toFixed(1)}px)` // turn around the eye, not the far end
      // Only the room you're in and the two ahead are painted.
      if (i !== base) {
        base = i
        halls.forEach((r, j) => { r.style.visibility = j >= i && j <= i + 2 ? '' : 'hidden' })
      }
      const now = Math.min(rooms.length - 1, Math.round(pos))
      if (now !== atRef.current) {
        atRef.current = now
        setAt(now)
        setLeg(rooms[now].leg)
      }
      muffle(lenis ? lenis.velocity : 0)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('resize', measure)
      lenis?.destroy()
    }
  }, [])

  const enter = (withSound) => {
    setEntered(true)
    requestAnimationFrame(() => document.querySelector('.sound')?.focus()) // the gate's buttons are gone; keep keyboard focus on the page
    if (withSound) {
      startMusic(rooms[atRef.current].leg)
      setSound(true)
    }
  }

  const toggleSound = () => {
    if (!sound) startMusic(rooms[atRef.current].leg)
    else setMuted(true)
    setSound(!sound)
  }

  const room = rooms[at]
  const song = soundtrack[room.leg]

  return (
    <>
      <div className="hall" ref={hallRef} aria-hidden="true">
        <div className="world" ref={worldRef}>
          {rooms.map((r, i) => (
            <div key={r.id} className={`room${r.light ? ' light' : ''}`} style={{ '--i': i, '--paint': r.paint }}>
              <div className="plane floor" />
              <div className="plane ceiling" />
              <div className="plane wall l" />
              <div className="plane wall r" />
              <div className="plane door"><span>{r.door}</span></div>
              {r.hang.map((x) => (
                <figure key={x.cap + x.at} className={`plane piece ${x.side}`} style={{ '--at': x.at }}>
                  <div className="frame">
                    {x.img ? <img src={x.img} alt="" loading="lazy" /> : <p className="canvas">{x.text}</p>}
                  </div>
                  <figcaption>{x.cap}</figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>

      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">{me.name} · Works 2023–2026</p>
          <p id="gate-title" className="gate-title">The Retrospective<br /><em>is now open.</em></p>
          <p className="gate-note">Seven rooms, nine works, three songs. Scroll to walk the corridor. Walk fast and the music muffles, like a gallery heard through the wall.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Enter with sound</button>
            <button className="btn" onClick={() => enter(false)}>Enter quietly</button>
          </div>
        </div>
      )}

      <header className="hud" hidden={!entered}>
        <p className="plaque" aria-live="polite"><span>Now showing</span> {room.num === '0' ? room.name : `Gallery ${room.num} · ${room.name}`}</p>
        {sound && <p className="plaque song"><span>♪</span> {song.title}</p>}
      </header>

      <nav className="map" aria-label="Galleries" hidden={!entered}>
        <ol>
          {rooms.map((r, i) => (
            <li key={r.id} className={i <= at ? 'passed' : ''}>
              <a href={`#${r.id}`} aria-label={r.name} aria-current={i === at ? 'location' : undefined}>{r.num}</a>
            </li>
          ))}
        </ol>
      </nav>

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        ♪ Sound
      </button>

      <main className="galleries" inert={!entered || undefined}>
        {rooms.map((r) => (
          <section key={r.id} id={r.id} className={`stop ${r.id}`} data-room aria-labelledby={`h-${r.id}`}>
            <div className="card">
              <p className="kicker">{r.kicker}</p>
              {r.id === 'entrance'
                ? <h1 id={`h-${r.id}`}>{r.title}</h1>
                : <h2 id={`h-${r.id}`}>{r.title}</h2>}
              {r.body}
            </div>
          </section>
        ))}
        <footer className="credits">
          <p>Soundtrack: {credited.map((t, i) => (
            <span key={t.title}>{i > 0 && ' · '}{t.title}{t.artist && <> by {t.artist}</>}</span>
          ))}. All songs belong to their artists.</p>
          <p>The corridor is built from CSS 3D transforms. No WebGL, no video.</p>
        </footer>
      </main>
    </>
  )
}

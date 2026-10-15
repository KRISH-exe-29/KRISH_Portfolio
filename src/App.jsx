import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { me, experience } from './content.js'
import { startMusic, setLeg, muffle, setMuted } from './music.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Field, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const job = Object.fromEntries(experience.map((e) => [e.id, e]))

// Fill in an artist and it shows in the credits.
const soundtrack = [
  { title: 'fish in the pool • 花屋敷', artist: '' },
  { title: 'Sun Fish', artist: '' },
  { title: 'YKWIM? (instrumental cover)', artist: '' },
]

function Job({ id }) {
  const e = job[id]
  return (
    <>
      <h3>{e.company}</h3>
      <p className="where">{e.role} · {e.place} · {e.year}</p>
      <p>{e.text}</p>
      {e.photo && <img className="whole" src={e.photo} alt={e.photoAlt} loading="lazy" />}
    </>
  )
}

// A paper piece: [x, y, w, h, classes, delay, label]. x and y are % of the spread from its
// left and bottom edges (higher y = further back); w and h are % of its width and height.
// Each piece lies flat on the page and folds up on its bottom edge as its chapter opens.
const chapters = [
  {
    id: 'cover', leg: 0, folio: 'Cover', kicker: 'A pop-up book in nine spreads',
    title: <>Some people tell stories. I build them, <em>page by page.</em></>,
    body: (
      <>
        <p className="lede">{me.name}. {me.role}. {me.lines[0]}</p>
        <p>The story unfolds from a railway yard in Tambaram to a 161 kV test bay in Kanchipuram. Every spread pops up the place it happened.</p>
        <p className="hint">Scroll to turn the page ↓</p>
      </>
    ),
    model: [
      [8, 44, 84, 26, 'teal hill', 0],
      [64, 50, 14, 21, 'gold round', 0.05],
      [8, 24, 10, 42, 'ink tri lattice', 0.25],
      [20, 24, 62, 30, 'red big', 0.35, me.name],
      [4, 6, 92, 10, 'kraft scallop', 0.7],
    ],
  },
  {
    id: 'current', leg: 0, folio: 'Ch. 1 · The current', kicker: 'Chapter 1 · 2023 to 2024',
    title: <>First, I learned what the current <em>actually does.</em></>,
    body: <><Job id="railway" /><Job id="mettur" /></>,
    model: [
      [58, 48, 16, 44, 'cream tower', 0],
      [76, 50, 5, 54, 'red stripes', 0.05],
      [54, 42, 40, 18, 'ink', 0.15, '4 × 210 MW'],
      [6, 44, 10, 48, 'ink tri lattice', 0.1],
      [8, 20, 46, 26, 'teal', 0.4, 'Southern Railway'],
      [52, 20, 14, 34, 'red', 0.45],
      [12, 12, 8, 11, 'ink round', 0.6], [26, 12, 8, 11, 'ink round', 0.62], [40, 12, 8, 11, 'ink round', 0.64], [54, 12, 8, 11, 'ink round', 0.66],
      [4, 6, 92, 5, 'kraft', 0.75],
    ],
  },
  {
    id: 'ship', leg: 0, folio: 'Ch. 2 · Remote', kicker: 'Chapter 2 · 2024 · remote',
    title: <>Then I learned to <em>ship it.</em></>,
    body: <Job id="inovate" />,
    model: [
      [62, 58, 26, 18, 'sky cloud', 0],
      [10, 56, 16, 12, 'cream cloud', 0.05],
      [24, 32, 46, 46, 'ink screen', 0.2, 'Project: Phantom'],
      [18, 18, 58, 10, 'cream keys', 0.5],
      [78, 18, 9, 16, 'red mug', 0.6],
    ],
  },
  {
    id: 'kiosk', leg: 1, folio: 'Ch. 3 · Bengaluru', kicker: 'Chapter 3 · 2025 · Bengaluru',
    title: <>Thirty minutes of Excel. <em>Thirty seconds</em> of Python.</>,
    body: <><Job id="buhler" /><Field only="buhler" /></>,
    model: [
      [60, 50, 12, 42, 'cream arch', 0], [73, 50, 12, 38, 'cream arch', 0.05],
      [58, 42, 30, 10, 'gold', 0.2, '150 TPD'],
      [14, 34, 30, 46, 'ink screen', 0.2, 'Virtual World 2.0'],
      [25, 20, 8, 22, 'kraft', 0.4],
      [48, 24, 14, 38, 'teal panel', 0.5, 'MCC'],
      [68, 12, 20, 12, 'kraft arch', 0.7],
    ],
  },
  {
    id: 'testbay', leg: 1, folio: 'Ch. 4 · The test bay', kicker: 'Chapter 4 · 2026 · now',
    title: <>Nine apps. One factory. <em>Zero spreadsheets left behind.</em></>,
    body: <><Job id="indotech" /><Numbers /><h3>The nine</h3><Apps /></>,
    model: [
      [6, 56, 88, 34, 'ink fence', 0],
      [72, 46, 20, 14, 'gold', 0.1, '161 kV'],
      [30, 40, 5, 46, 'cream bushing', 0.2], [44, 40, 5, 50, 'cream bushing', 0.25], [58, 40, 5, 46, 'cream bushing', 0.3],
      [22, 24, 50, 32, 'teal', 0.45, 'IEC 60076'],
      [74, 22, 16, 28, 'teal fins', 0.55], [6, 22, 14, 28, 'teal fins', 0.55],
      [18, 10, 58, 8, 'kraft', 0.75],
    ],
  },
  {
    id: 'agent', leg: 1, folio: 'Ch. 5 · After hours', kicker: 'Chapter 5 · after hours',
    title: <>After hours, I teach machines to <em>read the manual.</em></>,
    body: <><Agent /><Rag /><BrowserAI /><h3>Off the clock</h3><SideProjects /></>,
    model: [
      [62, 46, 24, 36, 'sky', 0, 'v1'],
      [57, 38, 24, 36, 'gold', 0.15, 'v6'],
      [52, 30, 24, 36, 'red', 0.3, 'v12'],
      [10, 48, 30, 22, 'cream bubble', 0.1, 'Cite'],
      [14, 22, 20, 30, 'cream doc', 0.4],
      [38, 14, 12, 14, 'ink chip', 0.6],
    ],
  },
  {
    id: 'stage', leg: 2, folio: 'Ch. 6 · The stage', kicker: 'Chapter 6 · on stage',
    title: <>Built the team from scratch. <em>Then took the stage.</em></>,
    body: <Leadership />,
    model: [
      [4, 50, 92, 44, 'red curtain', 0],
      [32, 44, 36, 12, 'gold', 0.15, 'E-Cell'],
      [42, 22, 16, 26, 'kraft podium', 0.35],
      [64, 24, 2, 30, 'ink', 0.4], [61, 52, 8, 5, 'ink round', 0.42],
      [4, 4, 92, 16, 'crowd', 0.7, '500+'],
    ],
  },
  {
    id: 'trophy', leg: 2, folio: 'Ch. 7 · The shelf', kicker: 'Chapter 7 · the shelf',
    title: <>Rank 7 of 1500+ colleges. <em>The shelf is getting crowded.</em></>,
    body: <Awards />,
    model: [
      [24, 40, 52, 52, 'gold burst', 0],
      [38, 30, 24, 40, 'gold cup', 0.2],
      [34, 18, 32, 14, 'ink', 0.4, 'Rank 7'],
      [10, 14, 12, 26, 'red ribbon', 0.55, '2025'],
      [78, 14, 12, 26, 'teal ribbon', 0.6, 'IITB'],
    ],
  },
  {
    id: 'back', leg: 2, folio: 'Back cover', kicker: 'The back cover',
    title: <>Your next quick manual step is <em>my next app.</em></>,
    body: <><p className="lede">{me.lines[2]}</p><Contact /><h3>Toolkit</h3><Skills /><Certifications /></>,
    model: [
      [32, 56, 36, 14, 'red', 0, 'Send it over'],
      [24, 30, 52, 34, 'cream envelope', 0.15],
      [62, 44, 10, 12, 'gold stamp', 0.3],
      [4, 6, 92, 10, 'teal scallop', 0.6],
    ],
  },
]

const clamp = (v) => Math.min(1, Math.max(0, v))
const smooth = (t) => t * t * (3 - 2 * t)

export default function App() {
  const bookRef = useRef(null)
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
    const lenis = calm ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true })
    lenis?.stop()
    lenisRef.current = lenis

    const book = bookRef.current
    const leaf = book.querySelector('.leaf')
    const models = [...book.querySelectorAll('.model')]
    const els = [...document.querySelectorAll('[data-chapter]')]
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
      const t = clamp((y - centers[i]) / span)
      // Each spread dwells open, folds shut, the leaf turns, and the next one pops up.
      const turn = i >= centers.length - 1 ? 0 : smooth(clamp((t - 0.15) / 0.7))
      const pos = calm ? Math.round(i + turn) : i + turn
      const flip = calm ? 0 : smooth(clamp((turn - 0.32) / 0.36))
      leaf.style.transform = `translateZ(1px) rotateY(${-180 * flip}deg)`
      models.forEach((m, j) => {
        const u = smooth(clamp(1 - Math.abs(pos - j) * 3.2))
        m.style.setProperty('--u', u.toFixed(3))
        m.style.visibility = u > 0.01 ? 'visible' : 'hidden'
      })
      const now = Math.min(chapters.length - 1, Math.round(pos))
      if (now !== atRef.current) {
        atRef.current = now
        setAt(now)
        setLeg(chapters[now].leg)
      }
      muffle(lenis ? lenis.velocity : 0)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      lenis?.destroy()
    }
  }, [])

  const enter = (withSound) => {
    setEntered(true)
    requestAnimationFrame(() => document.querySelector('.sound')?.focus()) // the gate's buttons are gone; keep keyboard focus on the page
    if (withSound) {
      startMusic(chapters[atRef.current].leg)
      setSound(true)
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
      <div className="stage" aria-hidden="true">
        <div className="book" ref={bookRef}>
          <div className="page left"><span className="folio">{chapters[at].folio}</span></div>
          <div className="page right"><span className="folio">{at + 1} / {chapters.length}</span></div>
          <div className="leaf" />
          {chapters.map((c) => (
            <div key={c.id} className="model">
              <span className="ground" />
              {c.model.map(([x, y, w, h, cls, d, label], k) => (
                <span key={k} className={`p ${cls}`} style={{ left: `${x}%`, bottom: `${y}%`, width: `${w}%`, height: `${h}%`, '--d': d }}>
                  {label && <b>{label}</b>}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">A pop-up book by {me.name}</p>
          <p id="gate-title" className="gate-title">Some people tell stories.<br /><em>I build them.</em></p>
          <p className="gate-note">Nine spreads, three songs. Scroll to turn the pages and watch each one stand up. Scroll fast and the music muffles, like a song heard through paper.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Open with sound</button>
            <button className="btn" onClick={() => enter(false)}>Read quietly</button>
          </div>
        </div>
      )}

      {sound && entered && <p className="now"><span>♪</span> {song.title}</p>}
      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        ♪ Sound
      </button>

      <main className="text" inert={!entered || undefined}>
        {chapters.map((c) => (
          <section key={c.id} id={c.id} className={`chapter ch-${c.id}`} data-chapter aria-labelledby={`h-${c.id}`}>
            <div className="sheet">
              <p className="kicker">{c.kicker}</p>
              {c.id === 'cover'
                ? <h1 id={`h-${c.id}`}>{c.title}</h1>
                : <h2 id={`h-${c.id}`}>{c.title}</h2>}
              {c.body}
            </div>
          </section>
        ))}
        <footer className="credits">
          <p>Soundtrack: {soundtrack.map((s, i) => (
            <span key={s.title}>{i > 0 && ' · '}{s.title}{s.artist && <> by {s.artist}</>}</span>
          ))}. All songs belong to their artists.</p>
          <p>Every fold is CSS: paper, perspective and a few hundred lines of transforms. No 3D library, no video.</p>
        </footer>
      </main>
    </>
  )
}

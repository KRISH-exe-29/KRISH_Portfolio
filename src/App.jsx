import { useEffect, useRef, useState } from 'react'
import { me, experience } from './content.js'
import Cassette from './Cassette.jsx'
import { startScore, setMuted, drag, flip } from './score.js'
import { Agent, Apps, Awards, BrowserAI, Certifications, Contact, Field, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const now = experience[experience.length - 1]

// One job per track, side A, oldest first.
const jobTracks = experience.map((e) => ({
  side: 'A', title: e.company, note: `${e.year} · ${e.role}`,
  body: (
    <>
      <p className="where">{e.place}</p>
      <p>{e.text}</p>
      {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" />}
    </>
  ),
}))

const tracks = [
  ...jobTracks,
  { side: 'A', title: 'Greatest hits', note: 'the numbers, live', body: <Numbers /> },
  { side: 'A', title: 'Nine apps, one factory', note: 'medley · all in production', body: <><p>{me.lines[0]}</p><Apps /></> },
  { side: 'A', title: 'Off the clock', note: 'demo versions', body: <SideProjects /> },
  { side: 'B', title: 'Twelve versions', note: 'one agent, grown up', body: <Agent /> },
  { side: 'B', title: 'Read me the manual', note: 'for the shop floor', body: <Rag /> },
  { side: 'B', title: 'Nothing leaves the device', note: 'AI in the browser', body: <BrowserAI /> },
  { side: 'B', title: 'Trophy case', note: 'the shelf so far', body: <Awards /> },
  { side: 'B', title: 'Built from scratch', note: 'E-Cell, 500+ in the room', body: <Leadership /> },
  { side: 'B', title: 'Polaroids', note: 'from the field', body: <Field /> },
  { side: 'B', title: 'Liner notes', note: 'tools and paper', body: <><Skills /><Certifications /></> },
].map((t, i, all) => ({ ...t, no: `${t.side}${all.slice(0, i + 1).filter((x) => x.side === t.side).length}` }))

const firstB = tracks.findIndex((t) => t.side === 'B')

export default function App() {
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const [tape, setTape] = useState({ side: 'A', wound: 0, turn: 0, count: '000', track: tracks[0].no, title: tracks[0].title })
  const [turning, setTurning] = useState(false)
  const sideRef = useRef('A')

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
  }, [entered])

  useEffect(() => {
    const flipAt = document.getElementById('turn-over')
    const items = [...document.querySelectorAll('[data-track]')]
    let lastY = window.scrollY
    let idle = 0
    let queued = false

    const update = () => {
      queued = false
      const vh = window.innerHeight
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - vh
      const turnOverY = flipAt.offsetTop + flipAt.offsetHeight / 2 - vh / 2
      const side = y >= turnOverY ? 'B' : 'A'
      // Each side winds from one spool to the other; turning the tape over starts it again.
      const wound = side === 'A' ? y / Math.max(1, turnOverY) : (y - turnOverY) / Math.max(1, max - turnOverY)
      let current = tracks[0]
      items.forEach((el, i) => { if (el.getBoundingClientRect().top < vh * 0.5) current = tracks[i] })
      setTape({
        side,
        wound: Math.min(1, Math.max(0, wound)),
        turn: y * 0.35,
        count: String(Math.min(999, Math.round((y / Math.max(1, max)) * 999))).padStart(3, '0'),
        track: current.no,
        title: current.title,
      })
      if (side !== sideRef.current) {
        sideRef.current = side
        flip(side)
        if (!calm) {
          setTurning(true)
          setTimeout(() => setTurning(false), 800)
        }
      }
      drag(y - lastY)
      lastY = y
      clearTimeout(idle)
      idle = setTimeout(() => drag(0), 140)
    }
    const onScroll = () => {
      if (!queued) requestAnimationFrame(update)
      queued = true
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const enter = (withSound) => {
    setEntered(true)
    requestAnimationFrame(() => document.querySelector('.sound')?.focus()) // the gate's button is gone; keep keyboard focus on the page
    if (withSound) {
      startScore()
      flip(sideRef.current)
      setSound(true)
    }
  }

  const toggleSound = () => {
    if (!sound) {
      startScore()
      flip(sideRef.current)
    }
    setMuted(sound)
    setSound(!sound)
  }

  const track = (t) => (
    <article className="track" key={t.no} data-track={t.no} aria-labelledby={`t-${t.no}`}>
      <p className="no">{t.no}</p>
      <div className="body">
        <h3 id={`t-${t.no}`}>{t.title}</h3>
        <p className="note">{t.note}</p>
        {t.body}
      </div>
    </article>
  )

  return (
    <>
      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">Krishna Raju S · portfolio</p>
          <p id="gate-title" className="gate-title">I made you a tape.</p>
          <p className="gate-note">Side A is the career. Side B is the person. Scroll fast and you&rsquo;ll hear the tape drag.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>▶ Press play</button>
            <button className="btn" onClick={() => enter(false)}>Read the liner notes</button>
          </div>
        </div>
      )}

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        {sound ? '❚❚ Pause' : '▶ Play'}
      </button>

      <div className="layout" inert={!entered || undefined}>
        <aside className="deck">
          <div className={`spin ${turning ? 'turning' : ''}`}>
            <Cassette wound={tape.wound} turn={tape.turn} side={tape.side} count={tape.count} />
          </div>
          <p className="readout" aria-live="off">
            <span className="counter">{tape.count}</span>
            <span>Side {tape.side} · {tape.track} · {tape.title}</span>
          </p>
        </aside>

        <main className="jcard">
          <header className="intro">
            <p className="kicker">{me.name} · {now.role}, {now.company}</p>
            <h1>Krish,<br /><em>the mixtape.</em></h1>
            <p className="lede">Some people send a resume. I made you a tape: the career on one side, the person on the other.</p>
            <p className="hand">♡ for whoever&rsquo;s hiring</p>
          </header>

          <h2 className="side-head">Side A <span>the career</span></h2>
          {tracks.slice(0, firstB).map(track)}

          <div id="turn-over" className="turn-over" aria-hidden="true">
            <p>turn over ↻</p>
          </div>

          <h2 className="side-head">Side B <span>the person</span></h2>
          {tracks.slice(firstB).map(track)}

          <section className="hidden-track">
            <p className="no">B∞</p>
            <div className="body">
              <h3>Hidden track: Send it over</h3>
              <p className="note">only on this copy</p>
              <p className="lede">{me.lines[1]} {me.lines[2]}</p>
              <Contact />
            </div>
          </section>
          <p className="foot">The cassette is drawn in SVG and both sides of the tape are synthesised in the browser.</p>
        </main>
      </div>
    </>
  )
}

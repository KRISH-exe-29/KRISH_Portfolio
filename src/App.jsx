import { useEffect, useRef, useState } from 'react'
import { me, experience, apps } from './content.js'
import { startScore, setMuted, setMachines, finale } from './score.js'
import { Agent, Apps, Building, Awards, BrowserAI, Certifications, Contact, Field, Jobs, Leadership, Numbers, Rag, SideProjects, Skills } from './sections.jsx'

const now = experience[experience.length - 1]
const out = { target: '_blank', rel: 'noopener noreferrer' }

// The manual job each app replaced, in the words of its own pitch. One machine per app.
const CHORES = {
  'Dispatch Management': 'Phone calls from work order to gate pass',
  EPMS: 'Projects with no Gantt to track them',
  'Fasteners Automation': 'A 30-minute fastener calculation',
  'Industrial Data System': 'Test data with no QR tag to find it',
  'Job Lens': '100 resumes, read one by one',
  KioskSentinel: 'Attendance at risk in a power cut',
  'RTCC & M.Box Tracker': 'Pending points chased by people',
  'Shop Floor Job Status': 'No live status for the bays',
  'Transformer Test Planner': 'Two hours of test planning',
}
const machines = apps.map((a, i) => ({ ...a, tag: `M-0${i + 1}`, chore: CHORES[a.name] }))

function Machine({ m, off }) {
  return (
    <li className={`machine ${off ? 'off' : 'on'}`} style={{ '--i': machines.indexOf(m) }}>
      <div className="plate">
        <span className="tag">{m.tag}</span>
        <span className="lamp" />
      </div>
      <svg className="dial" viewBox="0 0 60 36" aria-hidden="true">
        <path d="M6 32 A24 24 0 0 1 54 32" />
        <line className="needle" x1="30" y1="32" x2="30" y2="12" />
      </svg>
      <svg className="fan" viewBox="-12 -12 24 24" aria-hidden="true">
        <g>{[0, 120, 240].map((r) => <path key={r} transform={`rotate(${r})`} d="M0 0 C 2 -4, 6 -8, 2 -10 C -1 -8, -1 -4, 0 0" />)}</g>
        <circle r="1.6" />
      </svg>
      <p className="chore">{off ? <><b>Automated</b> {m.name}</> : m.chore}</p>
      <span className="breaker" aria-hidden="true"><i /></span>
    </li>
  )
}

export default function App() {
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const [off, setOff] = useState(0)
  const [dark, setDark] = useState(false)
  const board = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
  }, [entered])

  useEffect(() => {
    document.documentElement.classList.toggle('lights-out', dark)
  }, [dark])

  // Scrolling through the board throws one breaker for every tenth of its length.
  useEffect(() => {
    let queued = false
    const update = () => {
      queued = false
      const r = board.current.getBoundingClientRect()
      const run = r.height - window.innerHeight
      const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0
      setOff(Math.min(9, Math.floor(p * 10)))
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

  useEffect(() => {
    setMachines(machines.map((_, i) => i >= off))
  }, [off])

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

  const last = off > 0 ? machines[off - 1] : null

  return (
    <>
      {!entered && (
        <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
          <p className="kicker">Krishna Raju S · portfolio</p>
          <p id="gate-title" className="gate-title">It&rsquo;s 2 a.m.<br />The plant is still running.</p>
          <p className="gate-note">Fair warning: it&rsquo;s loud in here. It won&rsquo;t stay that way.</p>
          <div className="gate-actions">
            <button className="btn primary" onClick={() => enter(true)} autoFocus>Walk in with sound</button>
            <button className="btn" onClick={() => enter(false)}>Walk in quietly</button>
          </div>
        </div>
      )}

      <button className="btn sound" onClick={toggleSound} aria-pressed={sound} hidden={!entered}>
        {sound ? 'Sound on' : 'Sound off'}
      </button>

      <main inert={!entered || undefined}>
        <section className="intro">
          <p className="kicker">Control room · night shift · {me.name}, {now.role}</p>
          <h1>Killswitch<br />Lullaby</h1>
          <p className="lede">Every alarm on this board is a job somebody does by hand. I spent my nights writing the software that switches them off. Scroll, and put the factory to sleep.</p>
          <p className="hint" aria-hidden="true">Scroll to switch off</p>
        </section>

        <section className="board" ref={board} aria-labelledby="board-title">
          <div className="pin">
            <div className="mimic">
              <p className="mimic-head" id="board-title">
                <span>Plant mimic · Indo Tech Transformers</span>
                <span className="count"><b>{9 - off}</b> of 9 running</span>
              </p>
              <ol className="machines">
                {machines.map((m, i) => <Machine key={m.name} m={m} off={i < off} />)}
              </ol>
            </div>
            <div className="caption" aria-live="polite">
              {last ? (
                <>
                  <p className="kicker">{last.tag} · switched off</p>
                  <p className="was">{last.chore}</p>
                  <h2>{last.url ? <a href={last.url} {...out}>{last.name}</a> : last.name}</h2>
                  <p className="lede">{last.pitch}</p>
                  {off === 9 && <p className="all">All nine are asleep. {me.lines[0]}</p>}
                </>
              ) : (
                <>
                  <p className="kicker">Nine machines · nine chores</p>
                  <h2>Everything is running.</h2>
                  <p className="lede">Each of these is a manual job at the factory. Each has an app that does it now.</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="chapter">
          <p className="kicker">Signed off</p>
          <h2>The night shift, automated</h2>
          <Apps />
          <Building />
          <h3 className="gap">Off the clock</h3>
          <SideProjects />
        </section>

        <section className="chapter">
          <p className="kicker">Shift log · oldest entry first</p>
          <h2>Shift log</h2>
          <p className="lede">{me.role}.</p>
          <Jobs />
        </section>

        <section className="chapter">
          <p className="kicker">Meter readings</p>
          <h2>Readings</h2>
          <Numbers />
        </section>

        <section className="chapter">
          <p className="kicker">Who watches the plant at night</p>
          <h2>Night watch</h2>
          <p className="lede">The AI work: an agent that grew up in twelve versions, an assistant that reads the work instructions, and models that run in the browser.</p>
          <Agent />
          <Rag />
          <BrowserAI />
        </section>

        <section className="chapter">
          <p className="kicker">Pinned to the noticeboard</p>
          <h2>Commendations</h2>
          <Awards />
          <Leadership />
          <Field />
        </section>

        <section className="chapter">
          <p className="kicker">Spares cabinet</p>
          <h2>Spares</h2>
          <Skills />
          <Certifications />
        </section>

        <section className="last">
          <p className="kicker">One switch left</p>
          <button className="killswitch" aria-pressed={dark} onClick={() => { if (!dark) finale(); setDark(!dark) }}>
            <span className="cover" aria-hidden="true" />
            <span className="label">Hire the engineer who did this</span>
          </button>
          <p className="lede">{dark ? 'Lights out. Goodnight, factory.' : 'Everything else is asleep.'} {me.lines[1]} {me.lines[2]}</p>
          <Contact />
        </section>
        <p className="foot">The factory and the lullaby are synthesised in the browser. The chores are taken from what each app does.</p>
      </main>
    </>
  )
}

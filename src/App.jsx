import { useCallback, useEffect, useRef, useState } from 'react'
import { me, numbers, experience, apps, sideProjects, ai, awards, leadership, certifications, skills, asset } from './content.js'
import { MAX_SPEED, SEG, gateZ, gatesPassed, start, step, trackLength } from './game/track.js'
import { draw } from './game/render.js'

const job = (id) => experience.find((e) => e.id === id)
const award = (title) => awards.find((a) => a.title.startsWith(title))

function Job({ e }) {
  return (
    <>
      <p className="meta">{e.role}, {e.place}</p>
      <p>{e.text}</p>
      {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" />}
    </>
  )
}

function Links({ items }) {
  return (
    <ul className="rows">
      {items.map((a) => (
        <li key={a.name}>
          {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.name}</a> : <b>{a.name}</b>}
          <span>{a.pitch}</span>
        </li>
      ))}
    </ul>
  )
}

// The route, in the order it was driven. `gate` is the short name painted on the arch.
const stops = [
  ...['railway', 'mettur', 'inovate'].map((id) => {
    const e = job(id)
    return { gate: e.company, year: e.year, title: e.company, body: <Job e={e} /> }
  }),
  {
    gate: 'E-Cell', year: 'On campus', title: leadership.title,
    body: (
      <>
        <p>{leadership.text}</p>
        <p>{award('National finalist').title}, {award('National finalist').detail.toLowerCase()}, {award('National finalist').year}.</p>
        <div className="pair">{leadership.photos.slice(0, 2).map((p) => <img key={p.src} src={p.src} alt={p.alt} loading="lazy" />)}</div>
      </>
    ),
  },
  { gate: 'Bühler India', year: '2025', title: job('buhler').company, body: <Job e={job('buhler')} /> },
  {
    gate: 'IIT Bombay', year: '2025', title: award('Rank 7').title,
    body: (
      <>
        <p className="meta">{award('Rank 7').detail}</p>
        <p>{award('Runner-up').title} at the {award('Runner-up').detail}, too.</p>
        <img src={award('Rank 7').photo} alt={award('Rank 7').photoAlt} loading="lazy" />
      </>
    ),
  },
  {
    gate: 'Patent', year: '2025', title: award('Patent').title,
    body: (
      <>
        <p>{award('Patent').detail}.</p>
        <p>The street lights on this road brighten as the car gets close, a nod to the patent.</p>
      </>
    ),
  },
  { gate: 'Indo Tech', year: '2026', title: job('indotech').company, body: <Job e={job('indotech')} /> },
  {
    gate: 'The garage', year: '2026', title: 'Nine apps in production',
    body: (
      <>
        <p>{me.lines[0]} {numbers[1].value} {numbers[1].unit} {numbers[1].label}.</p>
        <Links items={apps} />
        <p className="meta">Off the clock</p>
        <Links items={sideProjects} />
      </>
    ),
  },
  {
    gate: 'AI pit stop', year: 'Now', title: 'Agents and retrieval',
    body: (
      <>
        <p><b>{ai.agent.name}.</b> {ai.agent.pitch}</p>
        <ol className="versions">{ai.agent.versions.map((v) => <li key={v}>{v}</li>)}</ol>
        <p><b>{ai.rag.name}.</b> {ai.rag.pitch}</p>
        <p className="flow">{ai.rag.steps.join(' → ')}</p>
        <p><b>{ai.browser.name}.</b> {ai.browser.pitch}</p>
        <p className="meta">{ai.stack.join(', ')}</p>
      </>
    ),
  },
  {
    gate: 'Finish', year: 'Next', title: me.lines[1],
    body: (
      <>
        <p>{me.lines[2]}</p>
        <p className="cta">
          <a href={`mailto:${me.email}`}>{me.email}</a>
          <a href={me.resume} download>Download resume</a>
          <a href={me.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={me.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
        {Object.entries(skills).map(([group, list]) => (
          <p key={group}><b>{group}.</b> {list.join(', ')}</p>
        ))}
        <p><b>Certified.</b> {certifications.join('; ')}.</p>
      </>
    ),
  },
]
const labels = stops.map((s) => s.gate)
const N = stops.length

function Drive({ onLog }) {
  const canvas = useRef(null)
  const car = useRef(start())
  const input = useRef({ gas: false, brake: false, steer: 0, scroll: 0 })
  const speedEl = useRef(null)
  const markEl = useRef(null)
  const audio = useRef(null)
  const [passed, setPassed] = useState(0)
  const [open, setOpen] = useState(true)
  const [sound, setSound] = useState(false)

  useEffect(() => {
    const keys = { ArrowUp: 'gas', w: 'gas', W: 'gas', ArrowDown: 'brake', s: 'brake', S: 'brake' }
    const steer = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 }
    const held = new Set()
    const onKey = (e) => {
      const down = e.type === 'keydown'
      // Up and down scroll the card while it has focus; key releases always count.
      if (down && e.key.startsWith('Arrow') && !(e.key in steer) && e.target.closest?.('.sheet')) return
      if (keys[e.key]) { input.current[keys[e.key]] = down; e.preventDefault() }
      if (steer[e.key]) {
        if (down) held.add(steer[e.key])
        else held.delete(steer[e.key])
        input.current.steer = [...held].reduce((a, b) => a + b, 0)
        e.preventDefault()
      }
    }
    const onWheel = (e) => {
      if (e.target.closest?.('.card')) return
      e.preventDefault()
      input.current.scroll += e.deltaY * 6
    }
    const release = () => { held.clear(); Object.assign(input.current, { gas: false, brake: false, steer: 0 }) }
    window.addEventListener('blur', release)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('blur', release)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    if (!ctx) { onLog(); return } // no canvas: the log has everything
    let raf
    let last = performance.now()
    let seen = 0
    let slowUntil = 0
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      cv.width = cv.clientWidth * dpr
      cv.height = cv.clientHeight * dpr
    }
    size()
    window.addEventListener('resize', size)
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000) * (now < slowUntil ? 0.35 : 1)
      last = now
      const inp = input.current
      car.current = { ...step(car.current, inp, dt, N), steer: inp.steer }
      inp.scroll = 0
      const s = car.current
      const count = gatesPassed(s.z, N)
      if (count !== seen) {
        if (count > seen) slowUntil = now + 900 // a beat of slow motion under each arch
        seen = count
        setPassed(count)
        setOpen(true)
        audio.current?.click()
      }
      audio.current?.rev(s.speed / MAX_SPEED)
      draw(ctx, cv.width, cv.height, s, labels, count, inp.brake)
      speedEl.current.textContent = Math.round((s.speed / MAX_SPEED) * 240)
      markEl.current.style.left = `${(s.z / trackLength(N)) * 100}%`
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size) }
  }, [onLog])

  // Sound is built only after the visitor asks for it.
  useEffect(() => {
    if (!sound) return
    const ac = new AudioContext()
    const osc = ac.createOscillator()
    const filter = ac.createBiquadFilter()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    filter.type = 'lowpass'
    filter.frequency.value = 420
    gain.gain.value = 0.035
    osc.connect(filter).connect(gain).connect(ac.destination)
    osc.start()
    const blip = new Audio(asset('audio/click.mp3'))
    audio.current = {
      rev: (r) => osc.frequency.setTargetAtTime(48 + r * 110, ac.currentTime, 0.08),
      click: () => { blip.currentTime = 0; blip.play().catch(() => {}) },
    }
    return () => { audio.current = null; ac.close() }
  }, [sound])

  const jump = (i) => {
    car.current = { ...car.current, z: gateZ(i) + 8 * SEG, x: 0, speed: 0 }
  }
  const hold = (key, value) => ({
    onPointerDown: (e) => { e.preventDefault(); input.current[key] = value },
    onPointerUp: () => { input.current[key] = key === 'steer' ? 0 : false },
    onPointerLeave: () => { input.current[key] = key === 'steer' ? 0 : false },
    onPointerCancel: () => { input.current[key] = key === 'steer' ? 0 : false },
    onContextMenu: (e) => e.preventDefault(),
  })

  const stop = stops[passed - 1]
  return (
    <main className="drive">
      <canvas ref={canvas} aria-label="A car driving down a highway at dusk, past gates named after each stage of Krishna's career" role="img" />
      <header className="bar">
        <h1>Grid Run</h1>
        <span className="count">{passed} of {N} gates</span>
        <span className="speed"><b ref={speedEl}>0</b> km/h</span>
        <button onClick={() => setSound(!sound)} aria-pressed={sound}>Sound {sound ? 'on' : 'off'}</button>
        <button onClick={onLog}>Read the log</button>
      </header>

      <aside className={`card ${open ? '' : 'shut'}`} aria-live="polite">
        {stop ? (
          <>
            <button className="x" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Hide' : `Show ${stop.gate}`}</button>
            {open && (
              <div className="sheet" key={passed} tabIndex={0}>
                <p className="year">{stop.year}</p>
                <h2>{stop.title}</h2>
                {stop.body}
              </div>
            )}
          </>
        ) : (
          <div className="sheet">
            <h2>First gate ahead: {stops[0].gate}</h2>
            <p className="keys">Hold <kbd>↑</kbd> or <kbd>W</kbd> to drive, <kbd>←</kbd> <kbd>→</kbd> to steer. Scrolling works too.</p>
            <p className="taps">Hold Go to drive. Steer with the arrows.</p>
          </div>
        )}
      </aside>

      <div className="pedals">
        <button aria-label="Steer left" {...hold('steer', -1)}>◀</button>
        <button aria-label="Steer right" {...hold('steer', 1)}>▶</button>
        <button className="go" {...hold('gas', true)}>Go</button>
      </div>

      <nav className="map" aria-label="Route">
        <i ref={markEl} aria-hidden="true" />
        {stops.map((s, i) => (
          <button
            key={s.gate}
            style={{ left: `${(gateZ(i) / trackLength(N)) * 100}%` }}
            className={i < passed ? 'done' : ''}
            aria-current={i === passed - 1 ? 'step' : undefined}
            onClick={() => jump(i)}
          >
            <span>{s.gate}</span>
          </button>
        ))}
      </nav>
    </main>
  )
}

function Log({ onDrive }) {
  return (
    <main className="log">
      <header>
        <p className="kicker">Grid Run, the trip log</p>
        <h1>{me.name}</h1>
        <p className="lede">{me.role}. {me.field}, {me.city}.</p>
        <ul className="tally">
          {numbers.map((n) => <li key={n.unit}><b>{n.value}</b> {n.unit} <span>{n.label}</span></li>)}
        </ul>
        <p className="cta">
          <button onClick={onDrive}>Drive it instead</button>
          <a href={me.resume} download>Download resume</a>
          <a href={`mailto:${me.email}`}>{me.email}</a>
        </p>
      </header>
      <ol>
        {stops.map((s) => (
          <li key={s.gate}>
            <p className="year">{s.year}</p>
            <h2>{s.title}</h2>
            {s.body}
          </li>
        ))}
      </ol>
    </main>
  )
}

export default function App() {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [mode, setMode] = useState(calm ? 'log' : 'start')

  const toLog = useCallback(() => setMode('log'), [])
  if (mode === 'log') return <Log onDrive={() => setMode('drive')} />
  if (mode === 'drive') return <Drive onLog={toLog} />
  return (
    <main className="startline">
      <img src={me.portrait} alt={`${me.name}, portrait`} />
      <div>
        <h1>Grid Run</h1>
        <p className="lede">{me.name} is an {me.role.toLowerCase()}. This is his career as a road: {N} gates, from a railway battery bay to AI agents. Drive it.</p>
        <p className="cta">
          <button className="primary" onClick={() => setMode('drive')} autoFocus>Start engine</button>
          <button onClick={() => setMode('log')}>Skip the drive, read the log</button>
        </p>
        <p className="keys">Arrow keys or WASD. On a phone, hold Go.</p>
      </div>
    </main>
  )
}

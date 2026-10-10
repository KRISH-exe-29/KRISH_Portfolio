import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { me, numbers, experience, apps, sideProjects, ai, awards, leadership, certifications, skills, asset } from './content.js'

gsap.registerPlugin(ScrollTrigger)

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
// The pinned tap changer needs room; short screens get the plain list instead.
const flat = calm || window.innerHeight < 700
const sheets = ['Source', 'Tap changer', 'Distribution board', 'Control logic', 'Protection', 'Load']
const slug = (s) => s.toLowerCase().replace(/ /g, '-')

// One sheet of the drawing: a feeder off the main bus, a breaker, and whatever it powers.
function Sheet({ index, children, className = '' }) {
  return (
    <section id={slug(sheets[index])} className={`sheet ${className}`} data-sheet={index}>
      <div className="feeder" aria-hidden="true">
        <svg viewBox="0 0 44 24" width="44" height="24">
          <circle cx="6" cy="12" r="3.5" />
          <circle cx="38" cy="12" r="3.5" />
          <line className="blade" x1="6" y1="12" x2="36" y2="12" />
        </svg>
      </div>
      <h2><span>{String(index + 1).padStart(2, '0')}</span> {sheets[index]}</h2>
      {children}
    </section>
  )
}

// Panel meter: counts up once, when its sheet goes live.
function Meter({ value, unit, label }) {
  const ref = useRef(null)
  useEffect(() => {
    if (calm) return
    const n = { v: 0 }
    const tween = gsap.to(n, {
      v: value, duration: 1.4, ease: 'power2.out', delay: 0.9,
      onUpdate: () => { ref.current.textContent = Math.round(n.v) },
    })
    return () => tween.kill()
  }, [value])
  return (
    <li>
      <b ref={ref}>{calm ? value : 0}</b>
      <span>{unit}</span>
      <small>{label}</small>
    </li>
  )
}

function TapChanger() {
  const box = useRef(null)
  const trigger = useRef(null)
  const [tap, setTap] = useState(0)
  const n = experience.length

  useEffect(() => {
    if (flat) return
    trigger.current = ScrollTrigger.create({
      trigger: box.current, start: 'top top', end: `+=${n * 60}%`, pin: true,
      onUpdate: (s) => setTap(Math.min(n - 1, Math.floor(s.progress * n))),
    })
    return () => trigger.current?.kill()
  }, [n])

  const go = (i) => {
    const t = trigger.current
    if (t) window.scrollTo({ top: t.start + ((i + 0.5) / n) * (t.end - t.start), behavior: 'smooth' })
  }

  if (flat) {
    return (
      <ol className="taps-flat">
        {experience.map((e) => (
          <li key={e.id}>
            <p className="tag">{e.year}, {e.place}</p>
            <h3>{e.company}</h3>
            <p className="role">{e.role}</p>
            <p>{e.text}</p>
            {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" />}
          </li>
        ))}
      </ol>
    )
  }

  const e = experience[tap]
  const angle = (i) => -60 + (120 / (n - 1)) * i
  return (
    <div className="taps" ref={box}>
      <div className="dial">
        <svg viewBox="-120 -120 240 150" role="group" aria-label="Tap selector, one position per internship">
          <path d="M -86.6 -50 A 100 100 0 0 1 86.6 -50" className="arc" />
          <line className="wiper" x1="0" y1="0" x2="0" y2="-92" style={{ transform: `rotate(${angle(tap)}deg)` }} />
          <circle r="7" className="hub" />
          {experience.map((x, i) => {
            const a = (angle(i) - 90) * (Math.PI / 180)
            return (
              <g key={x.id} className={i === tap ? 'on' : i < tap ? 'was' : ''} onClick={() => go(i)}>
                <circle cx={Math.cos(a) * 100} cy={Math.sin(a) * 100} r="9" />
                <text x={Math.cos(a) * 100} y={Math.sin(a) * 100 + 4}>{i + 1}</text>
              </g>
            )
          })}
        </svg>
        <p className="tag">Tap {tap + 1} of {n}</p>
        <p className="steps">
          {experience.map((x, i) => (
            <button key={x.id} onClick={() => go(i)} aria-current={i === tap ? 'step' : undefined}>{x.year} {x.company}</button>
          ))}
        </p>
      </div>
      <article key={e.id} aria-live="polite">
        <p className="tag">{e.year}, {e.place}</p>
        <h3>{e.company}</h3>
        <p className="role">{e.role}</p>
        <p>{e.text}</p>
        {e.photo && <img src={e.photo} alt={e.photoAlt} />}
      </article>
    </div>
  )
}

function Ladder() {
  const ref = useRef(null)
  const total = ai.agent.versions.length
  const [live, setLive] = useState(calm ? total : 0)
  useEffect(() => {
    if (calm) return
    const t = ScrollTrigger.create({
      trigger: ref.current, start: 'top 70%', end: 'bottom 60%',
      onUpdate: (s) => setLive(Math.round(s.progress * total)),
    })
    return () => t.kill()
  }, [total])
  return (
    <ol className="ladder" ref={ref}>
      {ai.agent.versions.map((v, i) => (
        <li key={v} className={i < live ? 'on' : ''}>
          <span className="contact" aria-hidden="true" />
          <span className="name">{v}</span>
          <span className="coil">v{i + 1}</span>
        </li>
      ))}
    </ol>
  )
}

export default function App() {
  const root = useRef(null)
  const fill = useRef(null)
  const audio = useRef(null)
  const [sheet, setSheet] = useState(0)
  const [sound, setSound] = useState(false)

  useEffect(() => {
    if (calm) return
    document.documentElement.classList.add('js')
    const ctx = gsap.context(() => {
      gsap.to(fill.current, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 62%', end: 'bottom 62%', scrub: true },
      })
      gsap.utils.toArray('.sheet').forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el, start: 'top 62%',
          onEnter: () => { el.classList.add('live'); audio.current?.() },
          onLeaveBack: () => el.classList.remove('live'),
        })
        ScrollTrigger.create({ trigger: el, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => s.isActive && setSheet(i) })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  // 50 Hz mains hum and a relay click, built only when the visitor turns sound on.
  useEffect(() => {
    if (!sound) return
    const ac = new AudioContext()
    const gain = ac.createGain()
    gain.gain.value = 0.02
    gain.connect(ac.destination)
    const hum = [50, 100].map((f) => {
      const o = ac.createOscillator()
      o.frequency.value = f
      o.connect(gain)
      o.start()
      return o
    })
    const click = new Audio(asset('audio/click.mp3'))
    audio.current = () => { click.currentTime = 0; click.play().catch(() => {}) }
    return () => { audio.current = null; hum.forEach((o) => o.stop()); ac.close() }
  }, [sound])

  return (
    <div className="drawing" ref={root}>
      <div className="bus" aria-hidden="true"><i ref={fill} /></div>

      <header id="source" className="sheet source live" data-sheet="0">
        <svg className="gen" viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
          <circle cx="30" cy="30" r="26" />
          <path d="M14 30 q8 -16 16 0 t16 0" />
        </svg>
        <p className="tag">Single-line diagram of one engineer. {me.city}.</p>
        <h1>{me.name}</h1>
        <p className="lede">{me.role}. {me.lines[0]}</p>
        <ul className="meters">{numbers.map((n) => <Meter key={n.unit} {...n} />)}</ul>
        <p className="hint">Scroll to close the breakers.</p>
      </header>

      <Sheet index={1} className="wide">
        <p className="lede">An on-load tap changer moves to the next position without dropping the load. Five positions so far.</p>
        <TapChanger />
      </Sheet>

      <Sheet index={2}>
        <p className="lede">{me.lines[0]} {numbers[1].value} {numbers[1].unit} {numbers[1].label}.</p>
        <ul className="board">
          {apps.map((a, i) => (
            <li key={a.name} style={{ '--i': i }}>
              <p className="tag"><i className="lamp" aria-hidden="true" /> Feeder {i + 1}</p>
              <h3>{a.name}</h3>
              <p>{a.pitch}</p>
              {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer">Open {a.url.includes('github.com') ? 'the repo' : 'the app'}</a>}
            </li>
          ))}
        </ul>
        <h3 className="sub">Spare ways</h3>
        <ul className="spares">
          {sideProjects.map((p) => (
            <li key={p.name}>
              {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.name}</a> : <b>{p.name}</b>} {p.pitch}
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet index={3}>
        <div className="logic">
          <div>
            <h3>{ai.agent.name}</h3>
            <p>{ai.agent.pitch}</p>
            <p className="tag">Each rung adds one capability. Scroll to energise them.</p>
            <Ladder />
          </div>
          <div>
            <h3>{ai.rag.name}</h3>
            <p>{ai.rag.pitch}</p>
            <ol className="flow">{ai.rag.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <h3>{ai.browser.name}</h3>
            <p>{ai.browser.pitch}</p>
            <p className="tag">{ai.stack.join(' / ')}</p>
          </div>
        </div>
      </Sheet>

      <Sheet index={4}>
        <p className="lede">{me.lines[3]} Every flag below dropped for a reason.</p>
        <ul className="flags">
          {awards.map((a, i) => (
            <li key={a.title} style={{ '--i': i }}>
              <i aria-hidden="true" />
              <p className="tag">{a.year}</p>
              <h3>{a.title}</h3>
              <p>{a.detail}</p>
            </li>
          ))}
        </ul>
        <div className="lead">
          <div>
            <h3>{leadership.title}</h3>
            <p>{leadership.text}</p>
            <h3 className="sub">Certified</h3>
            <ul className="spares">{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          {[...leadership.photos, { src: awards[2].photo, alt: awards[2].photoAlt }].map((p) => (
            <img key={p.src} src={p.src} alt={p.alt} loading="lazy" />
          ))}
        </div>
      </Sheet>

      <Sheet index={5} className="load">
        <p className="big">{me.lines[1]}</p>
        <p className="lede">{me.lines[2]}</p>
        <p className="cta">
          <a className="main" href={`mailto:${me.email}`}>{me.email}</a>
          <a href={me.resume} download>Download resume</a>
          <a href={me.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={me.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
        <table className="legend">
          <caption>Legend</caption>
          <tbody>
            {Object.entries(skills).map(([group, list]) => (
              <tr key={group}><th scope="row">{group}</th><td>{list.join(', ')}</td></tr>
            ))}
          </tbody>
        </table>
      </Sheet>

      <nav className="titleblock" aria-label="Sheets">
        <p><span>Drawn by</span> {me.name}</p>
        <p><span>Sheet</span> {sheet + 1} of {sheets.length}, {sheets[sheet]}</p>
        <ol>
          {sheets.map((s, i) => (
            <li key={s}><a href={`#${slug(s)}`} aria-current={i === sheet ? 'true' : undefined} aria-label={`Sheet ${i + 1}, ${s}`}>{i + 1}</a></li>
          ))}
        </ol>
        <button onClick={() => setSound(!sound)} aria-pressed={sound}>Sound {sound ? 'on' : 'off'}</button>
      </nav>
    </div>
  )
}

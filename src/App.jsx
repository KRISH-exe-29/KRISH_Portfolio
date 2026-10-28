import { useEffect, useRef, useState } from 'react'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, certifications, field } from './content.js'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (n) => Math.min(1, Math.max(0, n))

const sections = [['intro', 'Intro'], ['works', 'Works'], ['test', 'Test'], ['story', 'Story']]

function Nav({ active, day }) {
  return (
    <nav className={`nav ${day ? 'day' : ''}`} aria-label="Sections">
      <ul>
        {sections.map(([id, label]) => (
          <li key={id}><a href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>{label}</a></li>
        ))}
      </ul>
      <a className="wordmark" href="#intro" aria-label={me.name}>Krishna <i>Raju</i> S</a>
      <a className="buy" href={`mailto:${me.email}`}><span>Hire Krishna</span><b aria-hidden="true">→</b></a>
    </nav>
  )
}

function Intro() {
  return (
    <header className="intro" id="intro">
      <h1 className="sr">{me.name}, {me.role}</h1>
      <a className="discover" href="#statement">Scroll to discover<b aria-hidden="true">↓</b></a>
    </header>
  )
}

function Statement() {
  return (
    <section className="statement" id="statement">
      <p className="big">
        <span>An engineer <i>–</i> inspired by the hum</span>
        <span><i>Of the factory</i></span>
        <strong>Floor*</strong>
      </p>
      <div className="aside">
        <p>Krishna adds to a transformer factory’s toolbox with nine quietly useful apps, each one built to retire a manual task.</p>
        <a className="pill" href={me.resume} target="_blank" rel="noreferrer">Read the resume</a>
        <small>*The 161 kV test bay at Indo Tech Transformers, Chennai.</small>
      </div>
    </section>
  )
}

const catalogue = [
  ...apps.map((a) => ({ ...a, kind: 'Production' })),
  ...sideProjects.map((a) => ({ ...a, kind: 'Side project' })),
  ...building.map((a) => ({ ...a, kind: 'Now building' })),
  { name: ai.agent.name, pitch: ai.agent.pitch, kind: 'AI' },
]

function Slider({ label, value, set, min, max }) {
  return (
    <label className="slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(+e.target.value)} />
      <output>{value}</output>
    </label>
  )
}

// The specimen: pick a work from the list, then tune the type it is set in.
function Works() {
  const [pick, setPick] = useState(0)
  const [weight, setWeight] = useState(300)
  const [soft, setSoft] = useState(100)
  const item = catalogue[pick]
  return (
    <section className="works" id="works">
      <h2 className="head">Krishna <small>( Explore<br />the shipped<br />apps &amp; tools )</small> Catalogue</h2>
      <div className="specimen">
        <ol className="family">
          {catalogue.map((a, i) => (
            <li key={a.name}>
              <button type="button" className={i === pick ? 'on' : ''} onMouseEnter={() => setPick(i)} onFocus={() => setPick(i)} onClick={() => setPick(i)}>
                {a.name}
              </button>
            </li>
          ))}
        </ol>
        <div className="glyph">
          <p className="word" style={{ fontVariationSettings: `'wght' ${weight}, 'SOFT' ${soft}, 'opsz' 144` }}>{item.name}</p>
          <p className="pitch"><em>{item.kind}</em> {item.pitch}</p>
          {item.url && <a className="pill" href={item.url} target="_blank" rel="noreferrer">Open it</a>}
          <div className="sliders">
            <Slider label="Weight" value={weight} set={setWeight} min={100} max={900} />
            <Slider label="Softness" value={soft} set={setSoft} min={0} max={100} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Marquee() {
  const line = <span>A workshop lit by the glow of the test bay <i>a workshop lit by the glow of the test bay</i> </span>
  return <div className="marquee" aria-hidden="true"><div>{line}{line}</div></div>
}

function Tester() {
  const [n, setN] = useState(0)
  const [size, setSize] = useState(9)
  const [weight, setWeight] = useState(400)
  const [soft, setSoft] = useState(50)
  return (
    <section className="tester" id="test">
      <div className="bar">
        <b>Line tester</b>
        <Slider label="Size" value={size} set={setSize} min={4} max={14} />
        <Slider label="Weight" value={weight} set={setWeight} min={100} max={900} />
        <Slider label="Softness" value={soft} set={setSoft} min={0} max={100} />
        <button type="button" className="pill" onClick={() => setN((n + 1) % me.lines.length)}>Generate new line</button>
      </div>
      <p className="hint">(type your own text)</p>
      <p
        key={n}
        className="line"
        contentEditable
        suppressContentEditableWarning
        spellCheck="false"
        style={{ fontSize: `${size}vw`, fontVariationSettings: `'wght' ${weight}, 'SOFT' ${soft}, 'opsz' 144` }}
      >
        {me.lines[n]}
      </p>
    </section>
  )
}

// Photo sets from content.js, one block per set. `only` picks a single set by id.
function Field({ only }) {
  return field.filter((f) => !only || f.id === only).map((f) => (
    <article className="field" key={f.id}>
      <h3>{f.title}</h3>
      <p className="where">{f.when}</p>
      <p className="say">{f.text}</p>
      {f.link && <a href={f.link.url} target="_blank" rel="noopener noreferrer">{f.link.label} ↗</a>}
      <div className="shots">
        {f.photos.map((p) => (
          <figure key={p.src}>
            <img src={p.src} alt={p.alt} loading="lazy" />
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </article>
  ))
}

// Rows with a photograph show it beside the pointer.
function Story() {
  const peek = useRef(null)
  const [shot, setShot] = useState(null)
  const move = (e) => {
    if (peek.current) peek.current.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 140}px)`
  }
  return (
    <section className="story" id="story">
      <h2 className="head">The story so far <small>(hover to reveal<br />a photograph)</small></h2>
      <ol className="chapters" onPointerMove={move} onPointerLeave={() => setShot(null)}>
        {[...experience].reverse().map((e) => (
          <li key={e.id} onPointerEnter={() => setShot(e.photo ? e : null)}>
            <time>{e.year}</time>
            <h3>{e.company}{e.photo && <sup>*</sup>}</h3>
            <p><em>{e.role}, {e.place}.</em> {e.text}</p>
          </li>
        ))}
      </ol>
      <img ref={peek} className={`peek ${shot ? 'on' : ''}`} src={shot?.photo} alt={shot?.photoAlt ?? ''} />
      <Field />
      <figure className="quote">
        <figcaption>From the engineer</figcaption>
        <blockquote>“{me.lines[3]} {me.lines[0]} {me.lines[1]}”</blockquote>
        <p><b>{me.name}</b> {me.field}, {me.city}</p>
      </figure>
      <ul className="figures">
        {numbers.map((n) => <li key={n.unit}><b>{n.value}</b><span>{n.unit}</span><em>{n.label}</em></li>)}
      </ul>
      <div className="lists">
        <div>
          <h3>Recognition</h3>
          <ul>{awards.map((a) => <li key={a.title}><time>{a.year}</time><span><b>{a.title}</b> {a.detail}</span></li>)}</ul>
        </div>
        <div>
          <h3>Coursework</h3>
          <ul>{certifications.map((c) => <li key={c}><span>{c}</span></li>)}</ul>
          <h3>Working with</h3>
          <ul><li><span>{ai.stack.join(', ')}</span></li></ul>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="foot">
      <p className="start">Start building <i>with</i> Krishna</p>
      <a className="pill" href={`mailto:${me.email}`}>{me.email}</a>
      <div className="thanks">
        <p>Thank you for visiting</p>
        <ul>
          <li><a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
          <li><a href={me.github} target="_blank" rel="noreferrer">GitHub</a></li>
          <li><a href={me.resume} target="_blank" rel="noreferrer">Resume</a></li>
        </ul>
        <small>© 2026 {me.name}</small>
      </div>
    </footer>
  )
}

export default function App() {
  const [active, setActive] = useState('intro')
  const [day, setDay] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    // --a: the sun rising to fill the sky over the first screen. --b: it fading into dusk.
    const on = () => {
      const y = window.scrollY / window.innerHeight
      root.style.setProperty('--a', calm ? 0 : clamp(y))
      root.style.setProperty('--b', calm ? 0 : clamp(y - 1.3))
      setDay(!calm && y > 0.6 && y < 1.8)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    const seen = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    sections.forEach(([id]) => seen.observe(document.getElementById(id)))
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); seen.disconnect() }
  }, [])
  return (
    <>
      <div className="sun" aria-hidden="true"><i /><i /><i /></div>
      <div className="grain" aria-hidden="true" />
      <Nav active={active} day={day} />
      <main>
        <Intro />
        <Statement />
        <Works />
        <Marquee />
        <Tester />
        <Story />
      </main>
      <Footer />
    </>
  )
}

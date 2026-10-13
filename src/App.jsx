import { useEffect, useRef, useState } from 'react'
import { me, numbers, experience, apps, sideProjects, ai, awards, field } from './content.js'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// One cuboid on the isometric floor. Only the three faces the camera can see are drawn:
// top, front (+y) and right (+x).
function Box({ w, d, h, x = 0, y = 0, z = 0, c, k = '', front }) {
  return (
    <div
      className={`box ${k}`}
      style={{ '--w': `${w}px`, '--d': `${d}px`, '--h': `${h}px`, '--c': c, left: x, top: y, transform: `translateZ(${z}px)` }}
    >
      <i className="top" /><i className="front">{front}</i><i className="right" />
    </div>
  )
}

const code = [[34, 'a'], [62, 'b'], [48, 'c'], [70, 'a'], [28, 'd'], [56, 'b'], [40, 'c'], [66, 'd'], [30, 'a']]
const Screen = ({ from = 0 }) => (
  <span className="screen">
    {code.map((_, i) => {
      const [len, tone] = code[(i + from) % code.length]
      return <b key={i} className={tone} style={{ width: `${len}%`, marginLeft: `${(i % 3) * 8}%` }} />
    })}
  </span>
)

// The desk: a small CSS-only 3D scene that leans toward the pointer.
function Bench() {
  const ref = useRef(null)
  useEffect(() => {
    if (calm) return
    const el = ref.current
    const move = (e) => {
      el.style.setProperty('--rz', `${(e.clientX / window.innerWidth - 0.5) * 10}deg`)
      el.style.setProperty('--rx', `${(e.clientY / window.innerHeight - 0.5) * -6}deg`)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  const legs = [[112, 132], [396, 132], [112, 246], [396, 246]]
  return (
    <div className="stage" aria-hidden="true">
      <div className="iso" ref={ref}>
        <div className="rug" />
        {/* desk */}
        {legs.map(([x, y]) => <Box key={x + '-' + y} w={12} d={12} h={110} x={x} y={y} c="#E0B67C" />)}
        <Box w={300} d={130} h={10} x={110} y={130} z={110} c="#FFFDF8" />
        {/* two monitors */}
        <Box w={16} d={12} h={24} x={190} y={166} z={120} c="#4A4460" />
        <Box w={124} d={8} h={78} x={136} y={170} z={140} c="#3B3550" k="monitor" front={<Screen />} />
        <Box w={16} d={12} h={24} x={322} y={166} z={120} c="#4A4460" />
        <Box w={124} d={8} h={78} x={268} y={170} z={140} c="#3B3550" k="monitor" front={<Screen from={4} />} />
        {/* keyboard, mug, books */}
        <Box w={96} d={30} h={5} x={214} y={212} z={120} c="#EDE6D8" />
        <Box w={18} d={18} h={22} x={356} y={220} z={120} c="#FF8A00" />
        <Box w={50} d={34} h={9} x={124} y={212} z={120} c="#2F6FDB" />
        <Box w={46} d={30} h={9} x={126} y={214} z={129} c="#F2C230" />
        <Box w={40} d={28} h={9} x={128} y={215} z={138} c="#E4573D" />
        {/* a toy power transformer: tank, cooling fins, three bushings */}
        <Box w={96} d={66} h={76} x={52} y={330} c="#7D93AE" />
        {[0, 1, 2, 3, 4].map((i) => <Box key={i} w={9} d={12} h={56} x={60 + i * 18} y={396} z={8} c="#63778F" />)}
        {[0, 1, 2].map((i) => <Box key={i} w={12} d={12} h={34} x={66 + i * 28} y={356} z={76} c="#C7673A" />)}
        {[0, 1, 2].map((i) => <Box key={i} w={18} d={18} h={5} x={63 + i * 28} y={353} z={110} c="#F4EFE6" />)}
        <Box w={70} d={16} h={16} x={64} y={334} z={76} c="#93A7C0" />
        {/* cactus */}
        <Box w={48} d={48} h={38} x={420} y={300} c="#F4EEE4" />
        <Box w={18} d={18} h={76} x={435} y={315} z={38} c="#7BC043" />
        <Box w={12} d={12} h={30} x={456} y={318} z={66} c="#8DD04E" />
        <Box w={12} d={12} h={24} x={420} y={318} z={52} c="#6DB23A" />
      </div>
    </div>
  )
}

const links = [['about', 'About'], ['projects', 'Projects'], ['contact', 'Contact']]

function Nav({ active }) {
  return (
    <nav className={`nav ${active === 'about' ? 'dark' : ''}`} aria-label="Sections">
      <a className="logo" href="#top" aria-label="Back to top"><span>⚡</span></a>
      <ul>
        {links.map(([id, label]) => (
          <li key={id}><a href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>{label}</a></li>
        ))}
      </ul>
      <a className="cta" href={`mailto:${me.email}`}>Get in touch</a>
    </nav>
  )
}

function Hero() {
  return (
    <header className="hero" id="top">
      <div className="title">
        <h1>Krishna<br />Raju S</h1>
        <p className="tag">Engineer who ships software</p>
      </div>
      <Bench />
      <a className="mouse" href="#about" aria-label="Scroll to about"><i /></a>
    </header>
  )
}

const skillLines = ['IEC 60076 testing', 'Python + PyQt5', 'React + Next.js', 'Supabase + PostgreSQL', 'AI agents + RAG']

// The scan: the section is three screens tall and its stage sticks. Scroll progress turns the
// hologram into the photo from the head down, runs the counter and reveals the callouts.
function About() {
  const ref = useRef(null)
  const [p, setP] = useState(calm ? 1 : 0)
  useEffect(() => {
    if (calm) return
    const on = () => {
      const r = ref.current.getBoundingClientRect()
      const span = r.height - window.innerHeight
      setP(Math.round(Math.min(1, Math.max(0, -r.top / span)) * 100) / 100)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
  const on = (at) => (p >= at ? ' on' : '')
  return (
    <section className="about" id="about" style={{ '--p': p }}>
      <div className="track" ref={ref}><div className="holo">
        <div className="floor" aria-hidden="true" />
        <figure className="pod">
          <img src={me.portrait} alt={`${me.name}, portrait`} />
          <img className="scan" src={me.portrait} alt="" aria-hidden="true" />
          <span className="beam" aria-hidden="true" />
        </figure>
        <span className="ring" aria-hidden="true" />
        <output className="count" aria-hidden="true">{String(Math.round(p * 100)).padStart(3, '0')}</output>
        <div className={`callout c1${on(0.06)}`}>
          <b>Krishna</b>
          <span>{me.city}</span>
        </div>
        <div className={`callout c2${on(0.36)}`}>
          <p>Tests transformers in a 161 kV bay by day, and turns the factory’s manual work into apps people use every shift.</p>
        </div>
        <div className={`callout c3${on(0.66)}`}>
          <b>Skills</b>
          <ul>{skillLines.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </div></div>
      <div className="path">
        <ul className="numbers">
          {numbers.map((n) => <li key={n.unit}><b>{n.value}</b><span>{n.unit}</span><em>{n.label}</em></li>)}
        </ul>
        <h2>The circuit so far</h2>
        <ol className="stops">
          {experience.map((e) => (
            <li key={e.id}>
              <time>{e.year}</time>
              <h3>{e.company}</h3>
              <p className="role">{e.role}</p>
              <p>{e.short}</p>
            </li>
          ))}
        </ol>
        <Field />
      </div>
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
      <div className="shots">
        {f.photos.map((p) => (
          <figure key={p.src} className={p.wide ? 'full' : undefined}>
            <img src={p.src} alt={p.alt} loading="lazy" />
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </article>
  ))
}

const hues = [28, 215, 268, 152, 340, 192, 46, 8, 236]
const extras = [
  ...sideProjects.map((s) => ({ ...s, kind: 'Side project' })),
  { name: ai.agent.name, pitch: 'One AI agent, grown in twelve versions.', kind: 'AI' },
  { name: ai.rag.name, pitch: 'Answers shop-floor questions and cites its source.', kind: 'AI' },
]

function Card({ item, hue, kind }) {
  const Tag = item.url ? 'a' : 'div'
  const link = item.url ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {}
  return (
    <li>
      <Tag className="card" {...link}>
        <span className="cover" style={{ '--hue': hue }} aria-hidden="true">
          <b>{item.name}</b>
          {kind && <i>{kind}</i>}
        </span>
        <h3>{item.name}</h3>
        <p>{item.pitch}</p>
      </Tag>
    </li>
  )
}

function Projects() {
  return (
    <section className="projects" id="projects">
      <h2><span>Selected</span> Projects</h2>
      <p className="lede">Nine apps in production at Indo Tech Transformers, plus the things built on the side.</p>
      <ul className="cards">
        {apps.map((a, i) => <Card key={a.name} item={a} hue={hues[i]} />)}
        {extras.map((a, i) => <Card key={a.name} item={a} hue={hues[(i * 2 + 3) % hues.length]} kind={a.kind} />)}
        <li>
          <a className="card blank" href={`mailto:${me.email}?subject=A manual task for you`}>
            <span className="cover"><b>+</b></span>
            <h3>Your manual task</h3>
            <p>{me.lines[2]}</p>
          </a>
        </li>
      </ul>
      <h2 className="shelf-title"><span>Trophy</span> shelf</h2>
      <ul className="shelf">
        {awards.map((a) => <li key={a.title}><time>{a.year}</time><b>{a.title}</b><span>{a.detail}</span></li>)}
      </ul>
    </section>
  )
}

function Contact() {
  return (
    <section className="contact" id="contact">
      <p className="tag">Start a new project</p>
      <h2>Let’s work<br />together!</h2>
      <p className="lede">{me.lines[1]}</p>
      <div className="buttons">
        <a className="cta" href={`mailto:${me.email}`}>{me.email}</a>
        <a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        <a href={me.github} target="_blank" rel="noreferrer">GitHub</a>
        <a href={me.resume} target="_blank" rel="noreferrer">Resume</a>
      </div>
      <footer>© 2026 {me.name} · {me.city}</footer>
    </section>
  )
}

export default function App() {
  const [active, setActive] = useState('')
  useEffect(() => {
    const seen = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id === 'top' ? '' : e.target.id) }),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    document.querySelectorAll('#top, #about, #projects, #contact').forEach((s) => seen.observe(s))
    return () => seen.disconnect()
  }, [])
  return (
    <>
      <Nav active={active} />
      <main>
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
    </>
  )
}

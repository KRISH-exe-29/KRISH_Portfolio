import { useEffect } from 'react'
import { me, numbers, experience, apps, sideProjects, ai, awards, leadership, field } from './content.js'

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const no = (n) => String(n).padStart(3, '0')

const links = [['episodes', 'Episodes'], ['why', 'Why Krish?'], ['contact', 'Contact']]

function Nav() {
  return (
    <nav className="nav" aria-label="Sections">
      {links.map(([id, label]) => <a key={id} className="pill" href={`#${id}`}>{label}</a>)}
    </nav>
  )
}

function Hero() {
  return (
    <header className="hero" id="top">
      <div className="portrait"><img src={me.portrait} alt={`${me.name}, portrait`} /></div>
      <h1 aria-label={`${me.lines[3]} The portfolio of ${me.name}.`}>
        <span className="row r1" aria-hidden="true">Results</span>
        <span className="row r2" aria-hidden="true"><small>The<br />portfolio of<br />{me.name}</small>over</span>
        <span className="row r3" aria-hidden="true">resumes</span>
      </h1>
    </header>
  )
}

// Newest first, numbered like a back catalogue.
const episodes = apps.map((a, i) => ({ ...a, n: no(i + 1) })).reverse()
const bonus = [
  ...sideProjects,
  { name: ai.agent.name, pitch: 'One AI agent, grown in twelve versions.' },
  { name: ai.rag.name, pitch: 'Answers shop-floor questions and cites its source.' },
].map((a, i) => ({ ...a, n: `B${String(i + 1).padStart(2, '0')}` }))

function Row({ item }) {
  const Tag = item.url ? 'a' : 'div'
  const link = item.url ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {}
  return (
    <li>
      <Tag className="ep" {...link}>
        <span className="n">{item.n}</span>
        <b>{item.name}</b>
        <span className="what">{item.pitch}</span>
        {item.url && <i aria-hidden="true">↗</i>}
      </Tag>
    </li>
  )
}

function Episodes() {
  return (
    <section className="episodes" id="episodes">
      <header className="top">
        <h2>All the episodes</h2>
        <p>Nine apps in production at Indo Tech Transformers. Each one started as somebody’s manual task.</p>
      </header>
      <ol className="list">{episodes.map((e) => <Row key={e.name} item={e} />)}</ol>
      <h3 className="sub">Bonus tracks</h3>
      <ol className="list small">{bonus.map((e) => <Row key={e.name} item={e} />)}</ol>
    </section>
  )
}

function Band() {
  const line = <span>{me.lines.slice(0, 3).map((l) => <b key={l}>{l}</b>)}</span>
  return <div className="band" aria-hidden="true"><div>{line}{line}</div></div>
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

function Why() {
  return (
    <section className="why" id="why">
      <h2>Why<br />Krish?</h2>
      <p className="claim">
        Because he tests transformers in a <b>161 kV bay</b> by day, and comes back with an app for whatever slowed the shift down. <b>{me.role}.</b>
      </p>
      <ul className="stats">
        {numbers.map((n) => <li key={n.unit}><b>{n.value}</b><span>{n.unit}</span><em>{n.label}</em></li>)}
      </ul>
      <h3 className="sub">Seasons</h3>
      <ol className="seasons">
        {[...experience].reverse().map((e) => (
          <li key={e.id}>
            <time>{e.year}</time>
            <div><b>{e.company}</b><span>{e.role}, {e.place}</span></div>
            <p>{e.text}</p>
          </li>
        ))}
      </ol>
      <h3 className="sub">Field notes</h3>
      <Field />
      <h3 className="sub">On the record</h3>
      <ul className="record">
        {awards.map((a) => <li key={a.title} className="pill"><time>{a.year}</time> {a.title}</li>)}
        <li className="pill">{leadership.title}</li>
      </ul>
    </section>
  )
}

function Contact() {
  return (
    <section className="contact" id="contact">
      <p className="kicker">{me.lines[2]}</p>
      <h2><a href={`mailto:${me.email}`}>Send it<br />over</a></h2>
      <ul className="platforms">
        <li><a className="pill" href={`mailto:${me.email}`}>{me.email}</a></li>
        <li><a className="pill" href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
        <li><a className="pill" href={me.github} target="_blank" rel="noreferrer">GitHub</a></li>
        <li><a className="pill" href={me.resume} target="_blank" rel="noreferrer">Resume</a></li>
      </ul>
      <footer>© 2026 {me.name} · {me.city}</footer>
    </section>
  )
}

export default function App() {
  // --y drives the headline rows sliding apart as the cover scrolls away.
  useEffect(() => {
    if (calm) return
    const root = document.documentElement
    const on = () => root.style.setProperty('--y', Math.min(1, window.scrollY / window.innerHeight))
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <Episodes />
        <Band />
        <Why />
        <Contact />
      </main>
    </>
  )
}

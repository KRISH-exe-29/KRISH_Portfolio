import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  me,
  numbers,
  experience,
  apps, building,
  sideProjects,
  ai,
  awards,
  leadership,
  field,
  certifications,
  skills,
} from './content.js'
import {
  gsap,
  ScrollTrigger,
  prefersReduced,
  finePointer,
  initLenis,
  initCursor,
  initMagnetic,
  initReveals,
  heroIntro,
} from './motion.js'
import { createWater } from './water.js'

const ext = { target: '_blank', rel: 'noopener' }
const pad = (n) => String(n).padStart(2, '0')

// Text that rolls letter by letter on hover. The real text stays readable to assistive tech.
function Roll({ text }) {
  return (
    <span className="roll">
      <span className="sr-only">{text}</span>
      <span className="roll__track" aria-hidden="true">
        {[...text].map((c, i) => (
          <span key={i} className="roll__c" style={{ '--i': i }} data-c={c}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
    </span>
  )
}

function Photo({ src, alt, className = '', reveal = true, caption }) {
  return (
    <figure className={`photo ${className}`}>
      <div className="photo__frame" data-lens="" {...(reveal ? { 'data-reveal': '' } : {})}>
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
      {caption && <figcaption className="mono">{caption}</figcaption>}
    </figure>
  )
}

function Head({ id, title, aside }) {
  return (
    <div className="head grid">
      <div className="rule" data-rule="" />
      <h2 id={id} className="head__title" data-split="">
        {title}
      </h2>
      {aside && <p className="head__aside mono">{aside}</p>}
    </div>
  )
}

const fmt = () =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date())

function Clock() {
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15000)
    return () => clearInterval(id)
  }, [])
  return <time>{t} IST</time>
}

const nav = [
  ['Work', '#work'],
  ['AI', '#ai'],
  ['Record', '#record'],
  ['Contact', '#contact'],
]

export default function App() {
  const root = useRef(null)
  const loader = useRef(null)
  const cursor = useRef(null)
  const canvas = useRef(null)
  const lenisRef = useRef(null)
  const [motion] = useState(() => !prefersReduced())
  const [fine] = useState(() => finePointer())
  const [ready, setReady] = useState(() => prefersReduced())

  // smooth scroll, cursor, water, magnetic buttons
  useEffect(() => {
    const offs = []
    if (motion) {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      window.scrollTo(0, 0)
      const l = initLenis()
      lenisRef.current = l.lenis
      l.lenis.stop()
      offs.push(l.destroy)
    }
    if (motion && fine) {
      document.documentElement.classList.add('has-cursor')
      offs.push(initCursor(cursor.current))
      offs.push(() => document.documentElement.classList.remove('has-cursor'))
      const water = createWater(canvas.current, { ink: '#111111', glint: '#ffd400' })
      if (water) offs.push(water.destroy)
    }
    if (fine) offs.push(initMagnetic(root.current))
    return () => offs.forEach((f) => f())
  }, [motion, fine])

  // loader: counts while fonts and the portrait load, never longer than about 2.4 s
  useEffect(() => {
    if (!motion) return
    const el = loader.current
    const count = el.querySelector('.loader__count')
    const bar = el.querySelector('.loader__bar')
    const p = { v: 0 }
    const draw = () => {
      count.textContent = String(Math.round(p.v * 100)).padStart(3, '0')
      bar.style.transform = `scaleX(${p.v})`
    }
    const img = new Image()
    img.src = me.portrait
    const assets = Promise.all([document.fonts.ready, img.decode().catch(() => {})])
    const cap = new Promise((r) => setTimeout(r, 1700))
    const first = gsap.to(p, { v: 0.86, duration: 1.1, ease: 'power2.inOut', onUpdate: draw })
    let dead = false
    let last
    Promise.all([Promise.race([assets, cap]), first.then()]).then(() => {
      if (dead) return
      last = gsap.to(p, { v: 1, duration: 0.35, ease: 'power2.out', onUpdate: draw, onComplete: () => setReady(true) })
    })
    return () => {
      dead = true
      first.kill()
      last?.kill()
    }
  }, [motion])

  // after the loader: wipe it away, set the hero, arm the scroll reveals
  useLayoutEffect(() => {
    if (!ready || !motion) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => lenisRef.current?.start() })
      tl.to(loader.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'wipe' })
      tl.set(loader.current, { display: 'none' })
      tl.add(heroIntro(root.current), 0.25)
      initReveals(root.current)
    }, root)
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    return () => {
      window.removeEventListener('load', refresh)
      ctx.revert()
    }
  }, [ready, motion])

  return (
    <div ref={root} className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>

      {motion && (
        <div ref={loader} className="loader" aria-hidden="true">
          <p className="loader__name">Krishna Raju S</p>
          <p className="loader__meta mono">Setting type</p>
          <p className="loader__count mono">000</p>
          <span className="loader__bar" />
        </div>
      )}

      <header className="top">
        <a href="#top" className="top__name">
          <Roll text="Krishna Raju S" />
        </a>
        <p className="top__geo mono">
          Chennai 13.08°N 80.27°E <span className="top__time">· <Clock /></span>
        </p>
        <nav className="top__nav" aria-label="Primary">
          <ul>
            {nav.map(([label, href]) => (
              <li key={href}>
                <a href={href}>
                  <Roll text={label} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="hero" id="top" aria-labelledby="hero-name">
          <div className="grid hero__meta">
            <p className="mono" data-hero-meta="">
              {me.role}
            </p>
            <p className="mono hero__meta-mid" data-hero-meta="">
              {me.field}
            </p>
            <p className="mono hero__meta-end" data-hero-meta="">
              {me.city}
            </p>
          </div>
          <h1 id="hero-name" className="hero__name" aria-label={me.name}>
            <span className="hero__word" data-hero-word="" aria-hidden="true">
              Krishna
            </span>
            <span className="hero__word hero__word--r" data-hero-word="" aria-hidden="true">
              Raju S
            </span>
          </h1>
          <div className="grid hero__foot">
            <figure className="hero__photo">
              <div className="photo__frame" data-lens="" data-hero-photo="">
                <img src={me.portrait} alt="Portrait of Krishna Raju S" decoding="async" fetchPriority="high" />
              </div>
            </figure>
            <p className="hero__line" data-hero-meta="">
              {me.lines[0]}
            </p>
            <a className="hero__cue mono" href="#numbers" data-hero-meta="">
              <Roll text="Scroll" />
            </a>
          </div>
        </section>

        {/* Numbers */}
        <section id="numbers" className="numbers" aria-label="Numbers">
          <ul className="numbers__list">
            {numbers.map((n) => (
              <li key={n.label} className="numbers__item">
                <span className="rule" data-rule="" />
                <p className="numbers__v">
                  <span data-count={n.value}>{n.value}</span>
                  <span className="numbers__u mono">{n.unit}</span>
                </p>
                <p className="numbers__l">{n.label}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Work */}
        <section className="work" aria-labelledby="work">
          <Head id="work" title="Work" aside={`${apps.length} apps in production`} />
          <p className="work__intro" data-fade="">
            {me.lines[1]}
          </p>
          <ol className="index" data-stagger="">
            {apps.map((a, i) => {
              const inner = (
                <>
                  <span className="index__n mono">{pad(i + 1)}</span>
                  <span className="index__name">
                    <Roll text={a.name} />
                  </span>
                  <span className="index__pitch">{a.pitch}</span>
                  <span className="index__go mono">{a.url ? 'Open ↗' : 'No public link'}</span>
                </>
              )
              return (
                <li key={a.name}>
                  {a.url ? (
                    <a className="index__row" href={a.url} {...ext} data-cursor="Open">
                      {inner}
                    </a>
                  ) : (
                    <div className="index__row index__row--static">{inner}</div>
                  )}
                </li>
              )
            })}
          </ol>

          {building.map((b) => (
            <p key={b.name} className="work__intro" data-fade="">
              Now building: {b.name}. {b.pitch} {b.status}.
            </p>
          ))}

          <div className="side grid">
            <h3 className="side__title mono">Side projects</h3>
            <ul className="side__list">
              {sideProjects.map((s) => (
                <li key={s.name} className="side__item" data-fade="">
                  <h4 className="side__name">{s.name}</h4>
                  <p className="side__pitch">{s.pitch}</p>
                  {s.url ? (
                    <a className="link mono" href={s.url} {...ext} data-cursor="Open">
                      <Roll text="Open ↗" />
                    </a>
                  ) : (
                    <span className="mono muted">No public link</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* AI */}
        <section className="ai" aria-labelledby="ai">
          <Head id="ai" title="AI" aside={`${ai.agent.versions.length} versions, one agent`} />
          <div className="grid ai__body">
            <aside className="ai__stack">
              <p className="mono muted">Stack</p>
              <ul className="tags">
                {ai.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </aside>
            <div className="ai__main">
              <article className="ai__block">
                <h3 className="ai__name" data-split="">
                  {ai.agent.name}
                </h3>
                <p className="ai__pitch" data-fade="">
                  {ai.agent.pitch}
                </p>
                {/* weight grows with every version: the agent gains mass as it gains abilities */}
                <ol className="ladder" data-stagger="">
                  {ai.agent.versions.map((v, i) => (
                    <li key={v} style={{ '--w': 200 + Math.round((i / (ai.agent.versions.length - 1)) * 700) }}>
                      <span className="mono">v{i + 1}</span>
                      <span className="ladder__v">{v}</span>
                    </li>
                  ))}
                </ol>
              </article>

              <article className="ai__block">
                <h3 className="ai__name" data-split="">
                  {ai.rag.name}
                </h3>
                <p className="ai__pitch" data-fade="">
                  {ai.rag.pitch}
                </p>
                <ol className="steps" data-stagger="">
                  {ai.rag.steps.map((s, i) => (
                    <li key={s}>
                      <span className="mono muted">{pad(i + 1)}</span>
                      <span className="steps__s">{s}</span>
                    </li>
                  ))}
                </ol>
              </article>

              <article className="ai__block">
                <h3 className="ai__name" data-split="">
                  {ai.browser.name}
                </h3>
                <p className="ai__pitch" data-fade="">
                  {ai.browser.pitch}
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="record" aria-labelledby="record">
          <Head id="record" title="Record" aside={`${experience.length} roles, ${experience[0].year} to ${experience.at(-1).year}`} />
          <ol className="record__list">
            {experience.map((x) => (
              <li key={x.id} className="record__row grid" data-fade="">
                <p className="record__year mono">{x.year}</p>
                <div className="record__who">
                  <h3 className="record__co">{x.company}</h3>
                  <p className="mono muted">
                    {x.role}, {x.place}
                  </p>
                </div>
                <p className="record__text">{x.text}</p>
                {x.photo && <Photo className="record__photo" src={x.photo} alt={x.photoAlt} />}
              </li>
            ))}
          </ol>

          {field.map((f) => (
            <div key={f.id} className="field grid">
              <div className="field__text">
                <p className="mono muted">{f.when}</p>
                <h3 className="field__title" data-split="">
                  {f.title}
                </h3>
                <p data-fade="">{f.text}</p>
                <a className="link mono" href={f.link.url} {...ext} data-cursor="Open">
                  <Roll text={`${f.link.label} ↗`} />
                </a>
              </div>
              {f.photos.map((ph, i) => (
                <Photo key={ph.src} className={`field__ph field__ph--${i}`} src={ph.src} alt={ph.alt} caption={ph.caption} />
              ))}
            </div>
          ))}
        </section>

        {/* Awards and leadership */}
        <section className="awards" aria-labelledby="awards">
          <Head id="awards" title="Recognition" aside={`${awards.length} entries`} />
          <ul className="awards__list">
            {awards.map((a) => (
              <li key={a.title} className="awards__row" data-fade="">
                <span className="awards__y mono">{a.year}</span>
                <span className="awards__t">{a.title}</span>
                <span className="awards__d">{a.detail}</span>
                {a.photo ? <Photo className="awards__ph" src={a.photo} alt={a.photoAlt} reveal={false} /> : <span />}
              </li>
            ))}
          </ul>

          <div className="lead grid">
            <h3 className="lead__title" data-split="">
              {leadership.title}
            </h3>
            <p className="lead__text" data-fade="">
              {leadership.text}
            </p>
            {leadership.photos.map((ph, i) => (
              <Photo key={ph.src} className={`lead__ph lead__ph--${i}`} src={ph.src} alt={ph.alt} />
            ))}
          </div>
        </section>

        {/* Skills and certifications */}
        <section className="skills" aria-labelledby="skills">
          <Head id="skills" title="Toolbox" />
          <div className="skills__grid">
            {Object.entries(skills).map(([group, list]) => (
              <div key={group} className="skills__col" data-fade="">
                <h3 className="mono muted">{group}</h3>
                <ul>
                  {list.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="certs grid">
            <h3 className="certs__title mono muted">Education and certifications</h3>
            <ul className="certs__list">
              {certifications.map((c) => (
                <li key={c} data-fade="">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="contact" aria-labelledby="contact">
          <div className="rule" data-rule="" />
          <h2 id="contact" className="contact__h" data-split="">
            {me.lines[2]}
          </h2>
          <a className="contact__mail" href={`mailto:${me.email}`} data-cursor="Write">
            <Roll text={me.email} />
          </a>
          <ul className="contact__links">
            <li>
              <a className="btn" href={me.linkedin} {...ext} data-magnetic="" data-cursor="LinkedIn">
                <span className="mag__inner">
                  <Roll text="LinkedIn ↗" />
                </span>
              </a>
            </li>
            <li>
              <a className="btn" href={me.github} {...ext} data-magnetic="" data-cursor="GitHub">
                <span className="mag__inner">
                  <Roll text="GitHub ↗" />
                </span>
              </a>
            </li>
            <li>
              <a className="btn btn--fill" href={me.resume} {...ext} data-magnetic="" data-cursor="PDF">
                <span className="mag__inner">
                  <Roll text="Resume" />
                </span>
              </a>
            </li>
          </ul>
        </section>
      </main>

      <footer className="foot">
        <p>{me.name}</p>
        <p>{me.lines[3]}</p>
        <a href="#top" className="mono">
          <Roll text="Back to top" />
        </a>
      </footer>

      {motion && fine && (
        <>
          <canvas ref={canvas} className="water" aria-hidden="true" />
          <div ref={cursor} className="cursor" aria-hidden="true">
            <span className="cursor__blob" />
            <span className="cursor__label" />
          </div>
        </>
      )}
    </div>
  )
}

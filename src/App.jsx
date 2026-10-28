import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills,
} from './content.js'
import { reduceMotion, finePointer, startSmoothScroll, getLenis, scrollToId, initReveals, initMagnetic } from './motion.js'
import { initCursor } from './cursor.js'
import { initMediaFX } from './mediafx.js'
import { makeCover } from './covers.js'
import ToyBox from './ToyBox.jsx'

const ext = { target: '_blank', rel: 'noopener' }
const heroLines = [me.lines[1], me.lines[3]]
const [firstName, ...restName] = me.name.split(' ')
const nameLines = [firstName, restName.join(' ')]
const tilts = [-6, 4, -3, 7, -5, 3, -4, 6, -2]
const buhlerField = field[0]
const photos = [
  ...awards.filter((a) => a.photo).map((a) => ({ src: a.photo, alt: a.photoAlt, caption: `${a.title}, ${a.year}` })),
  ...leadership.photos.map((p) => ({ src: p.src, alt: '', caption: p.alt })),
  ...buhlerField.photos.map((p) => ({ src: p.src, alt: p.alt, caption: p.caption })),
]
const nav = [
  ['work', 'Work'],
  ['ai', 'AI'],
  ['story', 'Story'],
  ['contact', 'Contact'],
]

const loadImg = (src) =>
  new Promise((resolve) => {
    const i = new Image()
    i.onload = i.onerror = () => resolve()
    i.src = src
  })

// Letter roll on hover: two stacked copies, staggered per character. Screen readers get the plain text.
function Roll({ text }) {
  const chars = (cls) => (
    <span className={cls} aria-hidden="true">
      {[...text].map((c, i) => (
        <span key={i} style={{ '--i': i }}>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
  return (
    <span className="roll">
      <span className="sr">{text}</span>
      {chars('roll__a')}
      {chars('roll__b')}
    </span>
  )
}

function Preloader({ onReveal, onGone }) {
  const wrap = useRef(null)
  const num = useRef(null)
  useEffect(() => {
    const prog = { v: 0 }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      gsap
        .timeline()
        .to(num.current, { yPercent: -110, duration: 0.45, ease: 'power3.in' })
        .call(onReveal)
        .to(wrap.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: 'expo.inOut' }, '<')
        .call(onGone)
    }
    const font = document.fonts ? document.fonts.load('800 100px "Bricolage Grotesque"').catch(() => {}) : Promise.resolve()
    const tasks = [font, loadImg(me.portrait)]
    let count = 0
    tasks.forEach((p) =>
      p.then(() => {
        count++
        gsap.to(prog, {
          v: (count / tasks.length) * 100,
          duration: 0.7,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: () => {
            if (num.current) num.current.textContent = String(Math.round(prog.v)).padStart(2, '0')
          },
          onComplete: count === tasks.length ? finish : undefined,
        })
      }),
    )
    const safety = setTimeout(finish, 2400)
    return () => clearTimeout(safety)
  }, [onReveal, onGone])
  return (
    <div className="loader" ref={wrap} aria-hidden="true">
      <p className="loader__hand">getting the toys out</p>
      <div className="loader__mask">
        <span className="loader__num" ref={num}>
          00
        </span>
      </div>
    </div>
  )
}

function AgentLevels() {
  const v = ai.agent.versions
  const [n, setN] = useState(reduceMotion ? v.length : 1)
  const ref = useRef(null)
  const tween = useRef(null)
  useEffect(() => {
    if (reduceMotion) return
    const o = { n: 1 }
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        tween.current = gsap.to(o, { n: v.length, duration: 2.6, ease: 'power1.inOut', onUpdate: () => setN(Math.round(o.n)) })
      },
    })
    return () => {
      st.kill()
      tween.current?.kill()
    }
  }, [v.length])
  return (
    <div className="levels" ref={ref}>
      <label className="levels__label" htmlFor="levels">
        Version {n} of {v.length}: <b>{v[n - 1]}</b>
      </label>
      <input
        id="levels"
        type="range"
        min="1"
        max={v.length}
        value={n}
        data-cursor="Slide"
        onChange={(e) => {
          tween.current?.kill()
          setN(Number(e.target.value))
        }}
      />
      <ol className="levels__list">
        {v.map((name, i) => (
          <li key={name} className={i < n ? 'is-on' : ''}>
            <span className="levels__v">v{i + 1}</span> {name}
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function App() {
  const root = useRef(null)
  const [ready, setReady] = useState(reduceMotion)
  const [loading, setLoading] = useState(!reduceMotion)
  const [covers, setCovers] = useState([])
  const [lineIdx, setLineIdx] = useState(0)

  const onReveal = useCallback(() => {
    setReady(true)
    getLenis()?.start()
  }, [])
  const onGone = useCallback(() => setLoading(false), [])

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const offs = [startSmoothScroll(!reduceMotion), initCursor(), initMediaFX()]
    return () => offs.forEach((f) => f())
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', loading)
  }, [loading])

  useEffect(() => {
    let alive = true
    const font = document.fonts ? document.fonts.load('800 100px "Bricolage Grotesque"').catch(() => {}) : Promise.resolve()
    font.then(() => {
      if (alive) setCovers(apps.map((a, i) => makeCover(a.name, i)))
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const offs = [initReveals(root.current), initMagnetic(root.current)]
    let ctx
    if (!reduceMotion) {
      ctx = gsap.context(() => {
        gsap.from('.hero__char', { yPercent: 120, rotate: 14, duration: 1.1, ease: 'back.out(1.7)', stagger: 0.035 })
        gsap.from('.hero [data-intro]', { y: 30, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: 0.35 })
        gsap.fromTo(
          '.hero__portrait',
          { clipPath: 'circle(0% at 50% 60%)' },
          { clipPath: 'circle(75% at 50% 50%)', duration: 1.4, ease: 'expo.out', delay: 0.2, clearProps: 'clipPath' },
        )
      }, root)
    }
    ScrollTrigger.refresh()
    return () => {
      offs.forEach((f) => f())
      ctx?.revert()
    }
  }, [ready])

  const go = (id) => (e) => {
    e.preventDefault()
    scrollToId(id)
  }
  const shakeJar = () => document.getElementById('jar')?.dispatchEvent(new Event('shake'))

  return (
    <div ref={root}>
      {loading && <Preloader onReveal={onReveal} onGone={onGone} />}
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="nav">
        <a className="nav__name" href="#top" onClick={go('top')} data-cursor="Top">
          <Roll text={me.name} />
        </a>
        <nav aria-label="Sections">
          <ul className="nav__list">
            {nav.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={go(id)}>
                  <Roll text={label} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="pill" href={me.resume} {...ext} data-magnetic data-cursor="PDF">
          <Roll text="Resume" />
        </a>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero__text">
            <p className="hand hero__hi" data-intro>
              hi, I am
            </p>
            <h1 className="hero__name" aria-label={me.name}>
              {nameLines.map((w) => (
                <span className="hero__line" aria-hidden="true" key={w}>
                  {[...w].map((c, i) => (
                    <span className="hero__char" key={i}>
                      {c === ' ' ? ' ' : c}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <p className="hero__role" data-intro>
              {me.role}. {me.city}.
            </p>
            <p className="hero__quote" data-intro>
              <span aria-live="polite">
                <span className="pop" key={lineIdx}>
                  {heroLines[lineIdx]}
                </span>
              </span>
              <button
                type="button"
                className="chip-btn"
                data-cursor="Next"
                onClick={() => setLineIdx((lineIdx + 1) % heroLines.length)}
              >
                another line
              </button>
            </p>
          </div>
          <figure className="hero__figure" data-intro>
            <span className="hand hero__me" aria-hidden="true">
              that is me
            </span>
            <div className="hero__portrait media" data-fx data-cursor="Hello">
              <img src={me.portrait} alt={`Portrait of ${me.name}`} />
            </div>
          </figure>
          <div className="hero__box">
            <p className="hand box-note">{finePointer ? 'All true. Grab one and throw it.' : 'All true. Drag one around.'}</p>
            <ToyBox className="toybox--hero" active={ready} drop>
              {numbers.map((n, i) => (
                <button type="button" className={`toy sticker s${i}`} style={{ '--r': `${tilts[i]}deg` }} data-cursor="Throw" key={n.unit}>
                  <span className="sticker__value">
                    {n.unit === 'rank' ? (
                      <>
                        <small>rank</small> {n.value}
                      </>
                    ) : (
                      <>
                        {n.value} <small>{n.unit}</small>
                      </>
                    )}
                  </span>
                  <span className="sticker__label">{n.label}</span>
                </button>
              ))}
              <button type="button" className="toy sticker sticker--tag" style={{ '--r': '-8deg' }} data-cursor="Throw">
                {me.field}
              </button>
            </ToyBox>
          </div>
        </section>

        <section className="work" id="work">
          <header className="sec-head">
            <h2 data-split>{me.lines[0]}</h2>
            <p className="hand">All nine are in production at Indo Tech Transformers.</p>
          </header>
          <ul className="apps">
            {apps.map((a, i) => {
              const inner = (
                <>
                  <div className="app__media media" data-fx>
                    {covers[i] && <img src={covers[i]} alt="" />}
                  </div>
                  <div className="app__body">
                    <h3 className="app__name">
                      <Roll text={a.name} />
                    </h3>
                    <p className="app__pitch">{a.pitch}</p>
                    <span className="app__tag">{a.url ? 'Open it' : 'No public link'}</span>
                  </div>
                </>
              )
              return (
                <li className="app" key={a.name}>
                  {a.url ? (
                    <a className="app__card" href={a.url} {...ext} data-cursor="Open">
                      {inner}
                    </a>
                  ) : (
                    <div className="app__card app__card--still" data-cursor="No link">
                      {inner}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          {building.map((b) => (
            <p className="hand" key={b.name}>Now building: {b.name}. {b.pitch} {b.status}, no public link yet.</p>
          ))}
        </section>

        <section className="ai" id="ai">
          <header className="sec-head">
            <h2 data-split>AI work</h2>
          </header>
          <div className="ai__grid">
            <article className="card ai__agent">
              <h3>{ai.agent.name}</h3>
              <p>{ai.agent.pitch}</p>
              <AgentLevels />
            </article>
            <article className="card card--blue ai__rag">
              <h3>{ai.rag.name}</h3>
              <p>{ai.rag.pitch}</p>
              <ol className="steps" data-rise>
                {ai.rag.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </article>
            <article className="card card--sun ai__browser">
              <h3>{ai.browser.name}</h3>
              <p>{ai.browser.pitch}</p>
            </article>
          </div>
        </section>

        <section className="side" aria-labelledby="side-title">
          <h2 id="side-title" className="side__title" data-split>
            Side projects
          </h2>
          <ul className="side__list">
            {sideProjects.map((p) => {
              const row = (
                <>
                  <span className="side__name">
                    <Roll text={p.name} />
                  </span>
                  <span className="side__pitch">{p.pitch}</span>
                  <span className="side__go" aria-hidden="true">
                    {p.url ? '↗' : ''}
                  </span>
                </>
              )
              return (
                <li key={p.name}>
                  {p.url ? (
                    <a className="side__row" href={p.url} {...ext} data-cursor="Visit">
                      {row}
                    </a>
                  ) : (
                    <div className="side__row side__row--still">{row}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="story" id="story">
          <header className="sec-head">
            <h2 data-split>How I got here</h2>
            <p className="hand">Oldest first.</p>
          </header>
          <ol className="story__list">
            {experience.map((e) => (
              <li className="story__item" key={e.id}>
                <p className="story__year">{e.year}</p>
                <div className="story__body">
                  <h3>
                    {e.role} <span>at {e.company}</span>
                  </h3>
                  <p className="story__place">{e.place}</p>
                  <p className="story__short">{e.short}</p>
                  <p>{e.text}</p>
                  {e.id === buhlerField.id && (
                    <details className="story__more">
                      <summary data-cursor="Open">
                        {buhlerField.title}, {buhlerField.when}
                      </summary>
                      <p>{buhlerField.text}</p>
                      <a href={buhlerField.link.url} {...ext}>
                        {buhlerField.link.label}
                      </a>
                    </details>
                  )}
                </div>
                {e.photo ? (
                  <figure className="story__photo" data-clip>
                    <div className="media" data-fx data-cursor="Look">
                      <img src={e.photo} alt={e.photoAlt} loading="lazy" />
                    </div>
                  </figure>
                ) : (
                  <div className="story__stamp" aria-hidden="true">
                    <span>{e.place.split(',')[0]}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="awards" id="awards">
          <div className="awards__text">
            <h2 data-split>Awards and the E-Cell</h2>
            <ul className="awards__list">
              {awards.map((a) => (
                <li key={a.title}>
                  <span className="awards__year">{a.year}</span>
                  <span>
                    <b>{a.title}</b>
                    <span className="awards__detail">{a.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="card card--pink lead">
              <h3>{leadership.title}</h3>
              <p>{leadership.text}</p>
            </div>
          </div>
          <div className="awards__table">
            <p className="hand box-note">{finePointer ? 'Pick the photos up. Rearrange the table.' : 'From the photo box.'}</p>
            <ToyBox className="toybox--table" active={ready && finePointer} gravity={0} air={0.93}>
              {photos.map((p, i) => (
                <figure className="toy polaroid" key={p.src} style={{ '--r': `${tilts[i]}deg` }} data-cursor="Drag">
                  <img src={p.src} alt={p.alt} loading="lazy" draggable="false" />
                  <figcaption>{p.caption}</figcaption>
                </figure>
              ))}
            </ToyBox>
          </div>
        </section>

        <section className="skills" id="skills">
          <header className="sec-head">
            <h2 data-split>Skills jar</h2>
            {!reduceMotion && (
              <button type="button" className="pill pill--big" onClick={shakeJar} data-magnetic data-cursor="Shake">
                <Roll text="Shake the jar" />
              </button>
            )}
          </header>
          <ul className="legend">
            {Object.keys(skills).map((k, i) => (
              <li key={k}>
                <i className={`dot c${i}`} aria-hidden="true" /> {k}
              </li>
            ))}
          </ul>
          <ToyBox id="jar" className="toybox--jar" active={ready} drop>
            {Object.entries(skills).flatMap(([k, list], ci) =>
              list.map((s) => (
                <button type="button" className={`toy chip c${ci}`} key={k + s} data-cursor="Throw">
                  {s}
                </button>
              )),
            )}
          </ToyBox>
        </section>

        <section className="certs" aria-labelledby="certs-title">
          <h2 id="certs-title" data-split>
            Degree and certificates
          </h2>
          <ul className="certs__list" data-rise>
            {certifications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <section className="contact" id="contact">
          <h2 className="contact__title" data-split>
            {me.lines[2]}
          </h2>
          <a className="big-btn" href={`mailto:${me.email}`} data-magnetic data-cursor="Write">
            <Roll text={me.email} />
          </a>
          <ul className="contact__links">
            <li>
              <a href={me.linkedin} {...ext} data-cursor="LinkedIn">
                <Roll text="LinkedIn" />
              </a>
            </li>
            <li>
              <a href={me.github} {...ext} data-cursor="GitHub">
                <Roll text="GitHub" />
              </a>
            </li>
            <li>
              <a href={me.resume} {...ext} data-cursor="PDF">
                <Roll text="Resume" />
              </a>
            </li>
          </ul>
        </section>
      </main>

      <footer className="foot">
        <p>
          {me.name}, {me.city}
        </p>
        <a href="#top" onClick={go('top')}>
          Back to the top
        </a>
      </footer>
    </div>
  )
}

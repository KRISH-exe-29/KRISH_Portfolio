import { useContext, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { me, numbers, apps, building, sideProjects, ai, experience, field, awards, leadership, skills, certifications } from './content.js'
import { covers, slug } from './covers.js'
import { Flip, ScrollTrigger, reduced, finePointer, scrollToTarget } from './motion.js'
import { GLContext, Media, Roll, Magnetic, usePageMotion, ext } from './ui.jsx'

const pad = (n) => String(n).padStart(2, '0')
export const linkKind = (url) => (!url ? 'Internal' : url.includes('github.com') ? 'Source' : 'Live')

function Work() {
  const stage = useContext(GLContext)
  // touch has no hover preview, so it starts on the grid of covers
  const [grid, setGrid] = useState(() => !finePointer)
  const list = useRef(null)
  const cv = covers()

  const toggle = (next) => {
    if (next === grid) return
    const items = list.current?.querySelectorAll('.row')
    if (reduced || !items) return setGrid(next)
    stage?.previewHide()
    const state = Flip.getState(items)
    flushSync(() => setGrid(next))
    Flip.from(state, { duration: 1.1, ease: 'reel', stagger: 0.03, onComplete: () => ScrollTrigger.refresh() })
  }

  return (
    <section id="work" className="work" aria-labelledby="work-title">
      <div className="work__head">
        <h2 id="work-title" className="h2" data-split>
          Production reel
        </h2>
        <p className="work__sub mono" data-fade>
          {numbers[0].value} {numbers[0].unit} {numbers[0].label}
        </p>
        <div className="toggle mono" role="group" aria-label="Layout">
          <button type="button" aria-pressed={!grid} onClick={() => toggle(false)}>
            <Roll>Index</Roll>
          </button>
          <button type="button" aria-pressed={grid} onClick={() => toggle(true)}>
            <Roll>Grid</Roll>
          </button>
        </div>
      </div>

      <ol
        ref={list}
        className={`rows ${grid ? 'is-grid' : ''}`}
        onPointerLeave={() => stage?.previewHide()}
      >
        {apps.map((a, i) => (
          <li key={a.name} className="row" id={`row-${slug(a.name)}`}>
            <a
              href={`#/work/${slug(a.name)}`}
              className="row__link"
              data-cursor="Open"
              onPointerEnter={() => !grid && stage?.previewShow(cv[i].canvas)}
            >
              <span className="row__num mono">{pad(i + 1)}</span>
              <span className="row__name">{a.name}</span>
              <span className="row__pitch">{a.pitch}</span>
              <span className="row__kind mono">{linkKind(a.url)}</span>
              <img className="row__thumb" src={cv[i].url} alt="" aria-hidden="true" />
              {grid && <Media className="row__cover" src={cv[i].url} glSrc={cv[i].canvas} alt={`Cover for ${a.name}`} />}
            </a>
          </li>
        ))}
      </ol>
      {building.map((b) => (
        <p key={b.name} className="work__sub mono" data-fade>
          Still in the edit: {b.name}. {b.pitch} {b.status}.
        </p>
      ))}
    </section>
  )
}

export default function Index() {
  const root = useRef(null)
  usePageMotion(root, true, 'index')
  const [first, ...rest] = me.name.split(' ')
  const buhler = field[0]

  return (
    <div ref={root} className="view">
      <section id="top" className="hero" aria-labelledby="hero-title">
        <div className="hero__meta mono">
          <p data-intro-fade>{me.role}</p>
          <p className="hero__city" data-intro-fade>
            {me.city}
          </p>
        </div>
        <h1 id="hero-title" className="hero__name">
          <span className="hero__line" data-intro>
            {first}
          </span>
          <span className="hero__line hero__line--b" data-intro>
            {rest.join(' ')}
          </span>
        </h1>
        <Media className="hero__portrait" src={me.portrait} alt={`Portrait of ${me.name}`} reveal={false} />
        <div className="hero__foot">
          <p className="hero__quote" data-intro-fade>
            {me.lines[0]}
          </p>
          <Magnetic>
            <a
              className="pill"
              href="#work"
              data-cursor="Play"
              data-intro-fade
              onClick={(e) => {
                e.preventDefault()
                scrollToTarget('#work')
              }}
            >
              <Roll>Watch the reel</Roll>
            </a>
          </Magnetic>
        </div>
      </section>

      <section className="numbers" aria-label="In numbers">
        <ul className="numbers__list" data-stagger>
          {numbers.map((n) => (
            <li key={n.label}>
              <span className="numbers__value">
                <span data-count={n.value}>{n.value}</span>
                <span className="numbers__unit mono">{n.unit}</span>
              </span>
              <span className="numbers__label">{n.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <Work />

      <section className="side" aria-labelledby="side-title">
        <h2 id="side-title" className="h3" data-split>
          Off the clock
        </h2>
        <ul className="side__list">
          {sideProjects.map((p) => (
            <li key={p.name} data-fade>
              {p.url ? (
                <a href={p.url} {...ext} data-cursor="Visit" className="side__item">
                  <span className="side__name"><Roll>{p.name}</Roll></span>
                  <span className="side__pitch">{p.pitch}</span>
                  <span className="mono side__kind">Live</span>
                </a>
              ) : (
                <div className="side__item">
                  <span className="side__name">{p.name}</span>
                  <span className="side__pitch">{p.pitch}</span>
                  <span className="mono side__kind">Hardware</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="ai" aria-labelledby="ai-title">
        <div className="ai__head">
          <h2 id="ai-title" className="h2" data-split>
            {ai.agent.name}
          </h2>
          <p className="lede" data-fade>
            {ai.agent.pitch}
          </p>
        </div>
        <ol className="strip" data-stagger aria-label="Twelve versions">
          {ai.agent.versions.map((v, i) => (
            <li key={v} className="frame">
              <span className="frame__v mono">v{pad(i + 1)}</span>
              <span className="frame__t">{v}</span>
            </li>
          ))}
        </ol>
        <div className="ai__pair">
          <article className="card" data-fade>
            <h3 className="h4">{ai.rag.name}</h3>
            <p>{ai.rag.pitch}</p>
            <ol className="steps mono">
              {ai.rag.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </article>
          <article className="card" data-fade>
            <h3 className="h4">{ai.browser.name}</h3>
            <p>{ai.browser.pitch}</p>
            <ul className="chips mono" aria-label="AI stack">
              {ai.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section id="about" className="exp" aria-labelledby="exp-title">
        <h2 id="exp-title" className="h2" data-split>
          Five stops, oldest first
        </h2>
        <ol className="exp__list">
          {experience.map((e) => (
            <li key={e.id} className={`exp__item ${e.photo ? 'has-photo' : ''}`}>
              <span className="exp__year mono" data-fade>
                {e.year}
              </span>
              <div className="exp__body">
                <h3 className="h4" data-split>
                  {e.company}
                </h3>
                <p className="mono exp__meta">
                  {e.role}, {e.place}
                </p>
                <p className="exp__short">{e.short}</p>
                <p className="exp__text">{e.text}</p>
              </div>
              {e.photo && <Media className="exp__photo" src={e.photo} alt={e.photoAlt} />}
            </li>
          ))}
        </ol>
      </section>

      <section className="fieldset" aria-labelledby="field-title">
        <div className="fieldset__text">
          <p className="mono">{buhler.when}</p>
          <h2 id="field-title" className="h3" data-split>
            {buhler.title}
          </h2>
          <p data-fade>{buhler.text}</p>
          <Magnetic>
            <a className="pill" href={buhler.link.url} {...ext} data-cursor="Visit">
              <Roll>{buhler.link.label}</Roll>
            </a>
          </Magnetic>
        </div>
        {buhler.photos.map((p) => (
          <figure key={p.src} className="fieldset__fig">
            <Media src={p.src} alt={p.alt} />
            <figcaption className="mono">{p.caption}</figcaption>
          </figure>
        ))}
      </section>

      <section className="awards" aria-labelledby="awards-title">
        <h2 id="awards-title" className="h2" data-split>
          Credits
        </h2>
        <ol className="awards__list">
          {awards.map((a) => (
            <li key={a.title} className={`award ${a.photo ? 'has-photo' : ''}`} data-fade>
              <span className="mono award__year">{a.year}</span>
              <span className="award__title">{a.title}</span>
              <span className="award__detail">{a.detail}</span>
              {a.photo && <Media className="award__photo" src={a.photo} alt={a.photoAlt} />}
            </li>
          ))}
        </ol>
        <div className="lead">
          <div className="lead__text">
            <h3 className="h3" data-split>
              {leadership.title}
            </h3>
            <p data-fade>{leadership.text}</p>
          </div>
          {leadership.photos.map((p, i) => (
            <Media key={p.src} className={`lead__photo lead__photo--${i}`} src={p.src} alt={p.alt} />
          ))}
        </div>
      </section>

      <section className="kit" aria-labelledby="kit-title">
        <h2 id="kit-title" className="h3" data-split>
          Kit
        </h2>
        <div className="kit__grid">
          {Object.entries(skills).map(([group, list]) => (
            <div key={group} data-fade>
              <h3 className="mono kit__group">{group}</h3>
              <ul>
                {list.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
          <div data-fade className="kit__certs">
            <h3 className="mono kit__group">Education and certificates</h3>
            <ul>
              {certifications.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Contact />
    </div>
  )
}

export function Contact() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <p className="mono contact__kicker">{me.lines[1]}</p>
      <h2 id="contact-title" className="contact__title" data-split>
        {me.lines[2]}
      </h2>
      <Magnetic strength={0.2}>
        <a className="contact__mail" href={`mailto:${me.email}`} data-cursor="Write">
          <Roll>{me.email}</Roll>
        </a>
      </Magnetic>
      <ul className="contact__links">
        <li>
          <Magnetic>
            <a className="pill" href={me.linkedin} {...ext} data-cursor="Visit">
              <Roll>LinkedIn</Roll>
            </a>
          </Magnetic>
        </li>
        <li>
          <Magnetic>
            <a className="pill" href={me.github} {...ext} data-cursor="Visit">
              <Roll>GitHub</Roll>
            </a>
          </Magnetic>
        </li>
        <li>
          <Magnetic>
            <a className="pill pill--solid" href={me.resume} {...ext} data-cursor="PDF">
              <Roll>Resume</Roll>
            </a>
          </Magnetic>
        </li>
      </ul>
      <footer className="foot mono">
        <span>{me.name}, {me.city}</span>
        <span>{me.lines[3]}</span>
      </footer>
    </section>
  )
}

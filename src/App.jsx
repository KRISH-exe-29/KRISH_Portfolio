import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, certifications, skills, asset, field } from './content.js'

gsap.registerPlugin(ScrollTrigger)

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const MOTION = '(min-width: 800px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)'

// The cover name. Each letter is a variable-font instance whose weight follows the pointer;
// with no pointer on the page, a slow wave walks across instead.
function Name() {
  const ref = useRef(null)
  useEffect(() => {
    if (calm) return
    const el = ref.current
    const letters = [...el.querySelectorAll('i')]
    let pointer = null
    let raf = 0
    let visible = true
    const move = (e) => { pointer = e.pointerType === 'mouse' ? e.clientX : null }
    const out = () => { pointer = null }
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      const x = pointer ?? (0.5 + 0.5 * Math.sin(now / 1300)) * window.innerWidth
      const mids = letters.map((l) => { const r = l.getBoundingClientRect(); return r.left + r.width / 2 })
      letters.forEach((l, i) => {
        const far = Math.min(1, (Math.abs(mids[i] - x) / window.innerWidth) * 2.4)
        l.style.fontVariationSettings = `'wght' ${Math.round(900 - 680 * far)}`
      })
    }
    const seen = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    seen.observe(el)
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', out)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      seen.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', out)
    }
  }, [])
  const line = (word) => <span>{[...word].map((c, i) => <i key={i}>{c}</i>)}</span>
  return (
    <h1 ref={ref} aria-label={me.name}>
      <span className="back" aria-hidden="true">{line('Krishna')}</span>
      <span className="front" aria-hidden="true">{line('Raju S')}</span>
    </h1>
  )
}

function Cover() {
  return (
    <header className="cover">
      <p className="masthead"><b>Krish</b> <span>Issue 01</span> <span>{me.city}</span> <span>{me.field}</span></p>
      <div className="plate"><img src={me.portrait} alt={`${me.name}, portrait`} /></div>
      <Name />
      <ul className="coverlines">
        {numbers.slice(0, 4).map((n) => <li key={n.unit}><b>{n.value}</b> {n.unit} {n.label}</li>)}
      </ul>
      <p className="standfirst">{me.role}. {me.lines[0]}</p>
      <div className="barcode" aria-hidden="true" />
    </header>
  )
}

function Apps() {
  const wrap = useRef(null)
  const track = useRef(null)
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION, () => {
      const far = () => track.current.scrollWidth - window.innerWidth
      gsap.to(track.current, {
        x: () => -far(), ease: 'none',
        scrollTrigger: { trigger: wrap.current, pin: true, scrub: 0.5, refreshPriority: 1, end: () => `+=${far()}`, invalidateOnRefresh: true },
      })
    })
    return () => mm.revert()
  }, [])
  return (
    <section className="apps" ref={wrap} aria-labelledby="apps-h">
      <ol ref={track}>
        <li className="intro">
          <h2 id="apps-h" className="kin">Nine apps. One factory.</h2>
          <p>Zero spreadsheets left behind. Most of these run on a real shop floor, every shift. {numbers[1].value} {numbers[1].unit} guard dispatch alone.</p>
        </li>
        {apps.map((a, i) => (
          <li key={a.name}>
            <p className="folio">{i + 1}</p>
            <h3>{a.name}</h3>
            <p>{a.pitch}</p>
            {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer">{a.url.includes('github.com') ? 'Read the code' : 'Open the app'}</a>}
          </li>
        ))}
        <li className="extras">
          <h3>Also in this issue</h3>
          {sideProjects.map((p) => (
            <p key={p.name}>
              {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.name}</a> : <b>{p.name}</b>} {p.pitch}
            </p>
          ))}
          <h3>Now building</h3>
          {building.map((b) => <p key={b.name}><b>{b.name}</b> {b.pitch} {b.status}.</p>)}
        </li>
      </ol>
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

function Feature() {
  const [at, setAt] = useState(0)
  const jobs = [...experience].reverse() // newest first, the way a profile is written
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setAt(Number(e.target.dataset.i))),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    document.querySelectorAll('.feature article').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  const now = jobs[at]
  return (
    <section className="feature" aria-labelledby="feature-h">
      <h2 id="feature-h" className="kin">{me.lines[3]}</h2>
      <div className="columns">
        <figure>
          {now.photo ? <img key={now.id} src={now.photo} alt={now.photoAlt} /> : <div key={now.id} className="year" aria-hidden="true">{now.year}</div>}
          <figcaption>{now.company}, {now.year}</figcaption>
        </figure>
        <div>
          {jobs.map((e, i) => (
            <article key={e.id} data-i={i} className={i === at ? 'on' : ''}>
              <p className="when">{e.year}, {e.place}</p>
              <h3>{e.company}</h3>
              <p className="role">{e.role}</p>
              <p>{e.text}</p>
            </article>
          ))}
          <blockquote>{me.lines[2]}</blockquote>
        </div>
      </div>
    </section>
  )
}

function Centrefold() {
  const ref = useRef(null)
  const total = ai.agent.versions.length
  const [lit, setLit] = useState(calm ? total : 0)
  useEffect(() => {
    if (calm) return
    const t = ScrollTrigger.create({
      trigger: ref.current, start: 'top 75%', end: 'bottom 55%',
      onUpdate: (s) => setLit(Math.round(s.progress * total)),
    })
    return () => t.kill()
  }, [total])
  return (
    <section className="fold" aria-labelledby="fold-h">
      <h2 id="fold-h" className="kin">How to grow an agent</h2>
      <p className="deck">{ai.agent.name}. {ai.agent.pitch}</p>
      <ol className="versions" ref={ref}>
        {ai.agent.versions.map((v, i) => <li key={v} className={i < lit ? 'lit' : ''}><sup>{i + 1}</sup>{v}</li>)}
      </ol>
      <div className="two">
        <div>
          <h3>{ai.rag.name}</h3>
          <p>{ai.rag.pitch}</p>
          <ol className="steps">{ai.rag.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
        <div>
          <h3>{ai.browser.name}</h3>
          <p>{ai.browser.pitch}</p>
          <p className="small">Works with {ai.stack.join(', ')}.</p>
        </div>
      </div>
    </section>
  )
}

function Classifieds() {
  return (
    <section className="ads" aria-labelledby="ads-h">
      <h2 id="ads-h" className="kin">Classifieds</h2>
      <div className="grid">
        {awards.map((a) => (
          <article key={a.title} className={a.photo ? 'pic' : ''}>
            {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" />}
            <h3>{a.title}</h3>
            <p>{a.detail}. {a.year}.</p>
          </article>
        ))}
        <article className="wide">
          <h3>{leadership.title}</h3>
          <p>{leadership.text}</p>
          <div className="strip">{leadership.photos.map((p) => <img key={p.src} src={p.src} alt={p.alt} loading="lazy" />)}</div>
        </article>
        {Object.entries(skills).map(([group, list]) => (
          <article key={group}>
            <h3>{group}</h3>
            <p>{list.join(', ')}.</p>
          </article>
        ))}
        <article>
          <h3>Certified</h3>
          <p>{certifications.join('. ')}.</p>
        </article>
      </div>
    </section>
  )
}

export default function App() {
  const root = useRef(null)
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)

  // Headlines put on weight as they travel up the page.
  useEffect(() => {
    const mm = gsap.matchMedia(root)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray('.kin').forEach((el) => {
        gsap.fromTo(el, { '--w': 120 }, { '--w': 900, ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 45%', scrub: true } })
      })
    })
    return () => mm.revert()
  }, [])

  const toggle = () => {
    const a = audio.current
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    else { a.pause(); setPlaying(false) }
  }

  return (
    <div ref={root}>
      <audio ref={audio} src={asset('audio/soundtrack.mp3')} preload="none" loop />
      <button className="sound" onClick={toggle} aria-pressed={playing}>{playing ? 'Pause soundtrack' : 'Play soundtrack'}</button>
      <Cover />
      <div className="ticker" aria-hidden="true">
        <p>{[...apps, ...apps].map((a, i) => <span key={i}>{a.name}</span>)}</p>
      </div>
      <main>
        <Apps />
        <Feature />
        <section className="notes" aria-labelledby="notes-h">
          <h2 id="notes-h" className="kin">Field notes</h2>
          <Field />
        </section>
        <Centrefold />
        <Classifieds />
      </main>
      <footer className="backcover">
        <h2 className="kin">{me.lines[1]}</h2>
        <p className="deck">{me.lines[2]}</p>
        <p className="links">
          <a className="mail" href={`mailto:${me.email}`}>{me.email}</a>
          <a href={me.resume} download>Download resume</a>
          <a href={me.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={me.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
        <div className="barcode" aria-hidden="true" />
        <p className="small">{me.name}, {me.city}. Issue 01.</p>
      </footer>
    </div>
  )
}

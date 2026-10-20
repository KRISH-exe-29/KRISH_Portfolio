import { useEffect, useRef, useState } from 'react'
import { me, numbers, experience, apps, sideProjects, ai, awards, leadership, field, skills, certifications, asset } from './content.js'
import { start } from './scene.js'

const nav = [['index', 'Index'], ['work', 'Work'], ['journey', 'Journey'], ['contact', 'Contact']]
const work = [
  ...apps.map(a => ({ ...a, tag: 'factory' })),
  ...sideProjects.map(a => ({ ...a, tag: 'side' })),
]
const filters = [['all', 'All'], ['factory', 'Factory'], ['side', 'Side']]
const ist = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })

// One letter per span so the headline can rise in, letter by letter.
function Letters({ text, from = 0 }) {
  return [...text].map((c, i) => (
    <span key={i} className="ch" aria-hidden="true" style={{ '--d': from + i }}>{c === ' ' ? ' ' : c}</span>
  ))
}

function Sound({ on, onClick }) {
  return (
    <button className="round dark" onClick={onClick} aria-pressed={on} aria-label={on ? 'Mute sound' : 'Play sound'} data-cursor={on ? 'Mute' : 'Sound'}>
      <span className={`bars${on ? ' on' : ''}`}>{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ '--i': i }} />)}</span>
    </button>
  )
}

export default function App() {
  const canvas = useRef(null)
  const scene = useRef(null)
  const audio = useRef(null)
  const menuBtn = useRef(null)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const [sound, setSound] = useState(false)
  const [menu, setMenu] = useState(false)
  const [active, setActive] = useState('index')
  const [filter, setFilter] = useState('all')
  const [clock, setClock] = useState(() => ist.format(new Date()))

  // scene
  useEffect(() => {
    history.scrollRestoration = 'manual'
    scrollTo(0, 0)
    try {
      scene.current = start(canvas.current)
      scene.current.ready.then(() => setReady(true))
    } catch {
      document.documentElement.classList.add('no-webgl')
      setReady(true)
    }
    return () => scene.current?.dispose()
  }, [])

  // gate locks the page until you step in
  useEffect(() => {
    document.documentElement.classList.toggle('locked', !entered)
    document.documentElement.classList.toggle('entered', entered)
  }, [entered])

  // sound sleeps when the tab is hidden
  useEffect(() => {
    const a = audio.current
    if (!a) return
    const sync = () => (sound && !document.hidden ? a.play().catch(() => setSound(false)) : a.pause())
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [sound])

  // scroll: progress ring, the agent's lit versions
  useEffect(() => {
    const root = document.documentElement
    const agent = document.getElementById('agent')
    const onScroll = () => {
      const max = root.scrollHeight - innerHeight
      root.style.setProperty('--progress', max > 0 ? scrollY / max : 0)
      const r = agent.getBoundingClientRect()
      agent.style.setProperty('--ai', Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height * 0.8))))
    }
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // reveal on view, and which section is active
  useEffect(() => {
    const show = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { rootMargin: '0px 0px -12% 0px' })
    document.querySelectorAll('[data-reveal]').forEach(el => show.observe(el))
    const spy = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.dataset.nav)), { rootMargin: '-48% 0px -48% 0px' })
    document.querySelectorAll('[data-nav]').forEach(el => spy.observe(el))
    return () => { show.disconnect(); spy.disconnect() }
  }, [filter])

  // click and hold stirs the water
  useEffect(() => {
    const down = e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a,button,[role=dialog]')) return
      scene.current?.setHold(true)
      document.documentElement.classList.add('holding')
    }
    const up = () => { scene.current?.setHold(false); document.documentElement.classList.remove('holding') }
    addEventListener('pointerdown', down)
    addEventListener('pointerup', up)
    addEventListener('blur', up)
    return () => { removeEventListener('pointerdown', down); removeEventListener('pointerup', up); removeEventListener('blur', up) }
  }, [])

  // a cursor ring that trails the pointer and names what it is over
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    const ring = document.getElementById('cursor')
    const label = ring.querySelector('span')
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = 0
    const move = e => {
      x = e.clientX; y = e.clientY
      const t = e.target.closest?.('[data-cursor],a,button')
      ring.classList.toggle('big', !!t)
      label.textContent = t?.dataset.cursor ?? ''
    }
    const tick = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2
      ring.style.transform = `translate(${cx}px,${cy}px)`
      raf = requestAnimationFrame(tick)
    }
    document.documentElement.classList.add('custom-cursor')
    addEventListener('pointermove', move, { passive: true })
    tick()
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move) }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setClock(ist.format(new Date())), 20000)
    return () => clearInterval(id)
  }, [])

  // menu: Esc closes and hands focus back
  useEffect(() => {
    if (!menu) return
    document.querySelector('#menu a')?.focus()
    const key = e => {
      if (e.key !== 'Escape') return
      setMenu(false)
      menuBtn.current?.focus()
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [menu])

  function closeMenu() {
    setMenu(false)
    menuBtn.current?.focus()
  }

  function enter(withSound) {
    setEntered(true)
    setSound(withSound)
    document.getElementById('main').focus({ preventScroll: true })
  }

  const list = work.filter(w => filter === 'all' || w.tag === filter)
  const [lead, ...rest] = me.lines

  return (
    <>
      <canvas ref={canvas} className="stage" aria-hidden="true" />
      <div className="veil" aria-hidden="true" />
      <audio ref={audio} src={asset('audio/soundtrack.mp3')} loop preload="none" />
      <div id="cursor" aria-hidden="true"><span /></div>

      {/* gate */}
      <div className={`gate${entered ? ' gone' : ''}`} role="dialog" aria-modal="true" aria-labelledby="gate-name">
        <div className="orb" aria-hidden="true" />
        <p id="gate-name" className="gate-name">{me.name.toUpperCase()}<sup>®</sup></p>
        <p className="gate-text">An electrical engineer who ships software: nine production apps, one factory, and a habit of turning manual steps into buttons.</p>
        {ready ? (
          <button className="pill white" onClick={() => enter(true)} autoFocus>Enter <Arrow /></button>
        ) : (
          <p className="loading" role="status">(Loading)</p>
        )}
        <button className="quiet" onClick={() => enter(false)} disabled={!ready}>Enter without audio</button>
      </div>

      {/* chrome */}
      <header className="top" inert={!entered || undefined}>
        <a href="#index" className="logo" aria-label={`${me.name}, back to the top`}>krishna<em>raju</em><sup>®</sup></a>
        <nav aria-label="Sections">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>{label}</a>
          ))}
        </nav>
        <button ref={menuBtn} className="round white" onClick={() => setMenu(true)} aria-expanded={menu} aria-controls="menu" aria-label="Open menu" data-cursor="Menu">
          <span className="dots" />
        </button>
      </header>

      <div className="bottom" inert={!entered || undefined}>
        <div className="left">
          <Sound on={sound} onClick={() => setSound(s => !s)} />
          <a className="pill outline" href={me.resume} target="_blank" rel="noopener" data-cursor="PDF">Résumé <Arrow /></a>
          <span className="hint">Click &amp; hold</span>
        </div>
        <svg className="ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="18" pathLength="100" />
          <circle cx="20" cy="20" r="18" pathLength="100" className="fill" />
        </svg>
        <p className="right">Chennai {clock} IST<span>©2026</span></p>
      </div>

      <div id="menu" className={`menu${menu ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
        <button className="round white close" onClick={closeMenu} aria-label="Close menu">×</button>
        <ol>
          {nav.map(([id, label], i) => (
            <li key={id}>
              <a href={`#${id}`} onClick={() => setMenu(false)}><small>0{i + 1}</small><span className="swap" data-alt={label}>{label}</span></a>
            </li>
          ))}
        </ol>
        <ul className="out">
          <li><a href={`mailto:${me.email}`}>↳ {me.email}</a></li>
          <li><a href={me.linkedin} target="_blank" rel="noopener">↳ LinkedIn</a></li>
          <li><a href={me.github} target="_blank" rel="noopener">↳ GitHub</a></li>
          <li><a href={me.resume} target="_blank" rel="noopener">↳ Résumé</a></li>
        </ul>
      </div>

      <main id="main" tabIndex={-1} inert={!entered || undefined}>
        {/* hero */}
        <section id="index" data-nav="index" className="hero">
          <p className="eyebrow">{me.role} · {me.city}</p>
          <h1 aria-label="Results over resumes.">
            <span className="serif"><Letters text="Results over" /></span>
            <span className="sans"><Letters text="resumes." from={12} /></span>
          </h1>
          <p className="lede">{lead}</p>
          <a className="pill white" href="#work">View the work <Arrow /></a>
        </section>

        {/* numbers */}
        <section className="block left-col" aria-labelledby="numbers-h">
          <div className="glass" data-reveal>
            <p className="kicker">(01)</p>
            <h2 id="numbers-h"><em>By the</em> numbers</h2>
            <ul className="numbers">
              {numbers.map(n => (
                <li key={n.label}>
                  <b>{n.unit === 'rank' ? '#' : ''}{n.value}</b>
                  <span><i>{n.unit === 'rank' ? 'rank' : n.unit}</i>{n.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* work */}
        <section id="work" data-nav="work" className="block" aria-labelledby="work-h">
          <div className="glass wide" data-reveal>
            <div className="head">
              <div>
                <p className="kicker">(02)</p>
                <h2 id="work-h"><em>Selected</em> work</h2>
              </div>
              <div className="filters" role="group" aria-label="Filter projects">
                {filters.map(([id, label]) => (
                  <button key={id} className={filter === id ? 'on' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}>
                    {label}<sup>{work.filter(w => id === 'all' || w.tag === id).length}</sup>
                  </button>
                ))}
              </div>
            </div>
            <ol className="work">
              {list.map((w, i) => {
                const inner = (
                  <>
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    <strong>{w.name}</strong>
                    <span>{w.pitch}</span>
                    <em>{w.tag === 'side' ? 'Side project' : 'Indo Tech'}</em>
                  </>
                )
                return (
                  <li key={w.name}>
                    {w.url
                      ? <a href={w.url} target="_blank" rel="noopener" data-cursor="Open">{inner}<Arrow /></a>
                      : <div data-cursor="In-house">{inner}<i className="lock">Private</i></div>}
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* AI */}
        <section id="agent" className="block right-col" aria-labelledby="ai-h">
          <div className="glass" data-reveal>
            <p className="kicker">(03)</p>
            <h2 id="ai-h"><em>The</em> agent</h2>
            <p className="body"><b>{ai.agent.name}.</b> {ai.agent.pitch}</p>
            <ol className="versions">
              {ai.agent.versions.map((v, i) => <li key={v} style={{ '--i': i }}><small>v{i + 1}</small>{v}</li>)}
            </ol>
            <div className="pair">
              <div>
                <h3>{ai.rag.name}</h3>
                <p>{ai.rag.pitch}</p>
                <p className="steps">{ai.rag.steps.join(' → ')}</p>
              </div>
              <div>
                <h3>{ai.browser.name}</h3>
                <p>{ai.browser.pitch}</p>
              </div>
            </div>
          </div>
        </section>

        {/* journey */}
        <section id="journey" data-nav="journey" className="journey" aria-labelledby="journey-h">
          <div className="block left-col">
            <div className="glass" data-reveal>
              <p className="kicker">(04)</p>
              <h2 id="journey-h"><em>The</em> journey</h2>
              <p className="body">Five rooms, oldest first. A railway yard, a power plant, a remote team, a mill-automation desk, and a 161 kV test bay.</p>
            </div>
          </div>
          {experience.map((e, i) => {
            const set = field.find(f => f.id === e.id)
            return (
              <article key={e.id} className={`block ${i % 2 ? 'right-col' : 'left-col'}`}>
                <div className="glass chapter" data-reveal>
                  <p className="year">{e.year}</p>
                  <h3>{e.company}</h3>
                  <p className="role">{e.role} · {e.place}</p>
                  <p className="body">{e.text}</p>
                  {set && <p className="body small">{set.text} <a href={set.link.url} target="_blank" rel="noopener" data-cursor="Open">{set.link.label} ↗</a></p>}
                  {(e.photo || set) && (
                    <div className="photos">
                      {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" />}
                      {set?.photos.map(p => <img key={p.src} src={p.src} alt={p.alt} title={p.caption} loading="lazy" />)}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        {/* recognition */}
        <section className="block" aria-labelledby="wins-h">
          <div className="glass wide" data-reveal>
            <p className="kicker">(05)</p>
            <h2 id="wins-h"><em>Quiet</em> wins</h2>
            <ol className="wins">
              {awards.map(a => (
                <li key={a.title}>
                  <small>{a.year}</small>
                  <strong>{a.title}</strong>
                  <span>{a.detail}</span>
                  {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" />}
                </li>
              ))}
            </ol>
            <div className="lead">
              <div>
                <h3>{leadership.title}</h3>
                <p>{leadership.text}</p>
              </div>
              <div className="photos">
                {leadership.photos.map(p => <img key={p.src} src={p.src} alt={p.alt} loading="lazy" />)}
              </div>
            </div>
          </div>
        </section>

        {/* toolkit */}
        <section className="block right-col" aria-labelledby="kit-h">
          <div className="glass" data-reveal>
            <p className="kicker">(06)</p>
            <h2 id="kit-h"><em>The</em> toolkit</h2>
            {Object.entries(skills).map(([group, items]) => (
              <div key={group} className="kit">
                <h3>{group}</h3>
                <p>{items.map(s => <span key={s} className="chip">{s}</span>)}</p>
              </div>
            ))}
            <details>
              <summary>Degree and certificates</summary>
              <ul>{certifications.map(c => <li key={c}>{c}</li>)}</ul>
            </details>
          </div>
        </section>

        {/* contact */}
        <section id="contact" data-nav="contact" className="contact" aria-labelledby="contact-h">
          <p className="eyebrow" data-reveal>(07) Say hello</p>
          <h2 id="contact-h" data-reveal>
            <span className="serif">{rest[0]}</span>
            <span className="sans">{rest[1]}</span>
          </h2>
          <div className="row" data-reveal>
            <a className="pill white" href={`mailto:${me.email}`} data-cursor="Write">{me.email} <Arrow /></a>
            <a className="pill outline" href={me.linkedin} target="_blank" rel="noopener">LinkedIn <Arrow /></a>
            <a className="pill outline" href={me.github} target="_blank" rel="noopener">GitHub <Arrow /></a>
          </div>
          <p className="sign">{me.name} · {me.field}</p>
        </section>
      </main>
    </>
  )
}

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 2l8 8M10 3.5V10H3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

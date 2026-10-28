import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills, asset } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)

const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const SMALL = typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches
const KEYS = experience.length + 2 // hero, one stop per planet, the belt
const fmt = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const weekday = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })
const pin = (n) => asset(`img/pins/${n}.jpg`)

const QUIPS = [
  'Nine launches. No countdown required.',
  'Mission control is paranoid on purpose.',
  'Escape velocity, spreadsheet edition.',
  'The bright ones get catalogued first.',
  'Some people name stars. He patented street lights.',
]

export default function App() {
  const skyRef = useRef(null)
  const canvasRef = useRef(null)
  const tipRef = useRef(null)
  const audioRef = useRef(null)
  const sceneRef = useRef(null)
  const progRef = useRef(0)
  const audio = useRef({ analyser: null })
  const [active, setActive] = useState(0)
  const [intro, setIntro] = useState(!REDUCED)
  const [repos, setRepos] = useState(snapshot.repos)
  const [live, setLive] = useState(false)
  const [syzygy, setSyzygy] = useState(false)
  const [noGL, setNoGL] = useState(false)
  const [playing, setPlaying] = useState(false)

  const [music, setMusic] = useMusic(() => audioRef.current, (ctx, src) => {
    const an = ctx.createAnalyser()
    an.fftSize = 256
    src.connect(an)
    an.connect(ctx.destination)
    audio.current.analyser = an
  })

  // the scene: lazy, so the first paint never waits on three.js
  useEffect(() => {
    let scene = null
    let dead = false
    const done = () => setIntro(false)
    const fallback = setTimeout(done, 4200)
    import('./orbit.js').then(({ createOrbit }) => {
      if (dead || !canvasRef.current) return
      try {
        scene = createOrbit(canvasRef.current, {
          experience, days: snapshot.days, repos: snapshot.repos, moons: apps.length,
          small: SMALL, reduced: REDUCED, audio: audio.current,
          onAssembled: done,
          onSyzygy: () => setSyzygy(true),
          onHover: (hit, at) => {
            const tip = tipRef.current
            if (!tip) return
            if (!hit) { tip.hidden = true; return }
            tip.hidden = false
            tip.textContent = hit.label
            tip.style.transform = `translate(${Math.min(at.x + 14, window.innerWidth - tip.offsetWidth - 8)}px, ${at.y + 16}px)`
          },
        })
      } catch {
        setNoGL(true)
        done()
        return
      }
      sceneRef.current = scene
      scene.setProgress(progRef.current)
      gsap.ticker.add(scene.tick)
    }, () => { setNoGL(true); done() })
    return () => {
      dead = true
      clearTimeout(fallback)
      if (scene) { gsap.ticker.remove(scene.tick); scene.destroy() }
      sceneRef.current = null
    }
  }, [])

  // Escape skips the entrance
  useEffect(() => {
    if (!intro) return
    const onKey = (e) => { if (e.key === 'Escape') skip() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [intro])

  function skip() {
    sceneRef.current?.skipIntro()
    setIntro(false)
  }

  useEffect(() => {
    if (!syzygy) return
    const t = setTimeout(() => setSyzygy(false), 14000)
    return () => clearTimeout(t)
  }, [syzygy])

  // scroll: Lenis + ScrollTrigger. One pinned, scrubbed flight through the system.
  useEffect(() => {
    let lenis = null
    let tick = null
    const ctx = gsap.context(() => {
      if (REDUCED) return
      lenis = new Lenis({ lerp: 0.1 })
      lenis.on('scroll', ScrollTrigger.update)
      tick = (t) => lenis.raf(t * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)

      let last = 0
      ScrollTrigger.create({
        trigger: skyRef.current,
        pin: true,
        start: 'top top',
        end: () => '+=' + window.innerHeight * (KEYS - 1) * 1.1,
        onUpdate: (self) => {
          progRef.current = self.progress
          sceneRef.current?.setProgress(self.progress)
          const f = self.progress * (KEYS - 1)
          const i = Math.abs(f - Math.round(f)) < 0.32 ? Math.round(f) : -1
          if (i !== last) { last = i; setActive(i) }
        },
      })

      // eclipse: each paper section rises over the ink like a planet's disc
      gsap.utils.toArray('.eclipse').forEach((el) => {
        gsap.fromTo(el, { clipPath: 'circle(18% at 50% 100%)' }, {
          clipPath: 'circle(150% at 50% 100%)', ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 20%', scrub: true },
        })
      })
      // ink sections: a crescent sweeps across as they arrive
      gsap.utils.toArray('.crescent').forEach((el) => {
        gsap.fromTo(el, { '--sweep': '0%' }, {
          '--sweep': '140%', ease: 'none',
          scrollTrigger: { trigger: el.parentElement, start: 'top 90%', end: 'top 10%', scrub: true },
        })
      })
      gsap.utils.toArray('.rise').forEach((el) => {
        gsap.from(el, { y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
      gsap.utils.toArray('[data-count]').forEach((el) => {
        const end = +el.dataset.count
        const o = { v: 0 }
        gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' }, onUpdate: () => { el.textContent = Math.round(o.v) } })
      })
      gsap.utils.toArray('.meme-block').forEach((el) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%' } })
        tl.from(el.querySelector('.setup'), { y: 30, autoAlpha: 0, duration: 0.6 })
          .from(el.querySelector('.porthole'), { scale: 0.4, rotate: -25, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.4)' })
          .from(el.querySelector('.reframe'), { y: 30, autoAlpha: 0, duration: 0.6 }, '-=0.2')
      })
    })
    // nav jumps glide with Lenis
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a || !lenis) return
      const el = document.querySelector(a.getAttribute('href'))
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: 0, duration: 1.6 })
      el.focus?.({ preventScroll: true })
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      ctx.revert()
      if (tick) gsap.ticker.remove(tick)
      lenis?.destroy()
    }
  }, [])

  // fresher repos when the GitHub API answers; the snapshot otherwise
  useEffect(() => {
    const ac = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        const next = list.map((r) => ({
          name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
          sizeKB: r.size, pushedAt: (r.pushed_at || '').slice(0, 10), fork: r.fork, homepage: r.homepage, url: r.html_url,
        }))
        setRepos(next)
        setLive(true)
        sceneRef.current?.setRepos(next)
      })
      .catch(() => {})
    return () => ac.abort()
  }, [])

  const best = snapshot.bestDay
  const own = repos.filter((r) => !r.fork).length
  const motion = !REDUCED

  return (
    <>
      <a className="skiplink" href="#telemetry">Skip to content</a>
      <audio ref={audioRef} src={asset('audio/parfum-d-etoiles.mp3')} loop preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />

      <header className="top">
        <a className="mark" href="#sky" aria-label="Orbit, back to the top">
          <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="4" /><ellipse cx="16" cy="16" rx="13" ry="6" transform="rotate(-24 16 16)" /></svg>
          <span>Orbit</span>
        </a>
        <nav aria-label="Sections">
          <a href="#telemetry">Telemetry</a>
          <a href="#moons">Moons</a>
          <a href="#ground">Ground</a>
          <a href="#launch">Launch</a>
        </nav>
        <button type="button" className={`music${playing ? ' on' : ''}`} data-music aria-pressed={music}
          onClick={() => setMusic(!music)}>
          <span className="eq" aria-hidden="true"><i /><i /><i /></span>
          {music ? 'Music off' : 'Music on'}
        </button>
      </header>

      <div className="sky-wrap">
        <section id="sky" ref={skyRef} tabIndex={-1} className={`sky${motion ? ' pinned' : ''}${noGL ? ' nogl' : ''}`} aria-label="The system: his experience as planets">
          <canvas ref={canvasRef} className="stage" aria-hidden="true" />
          <div ref={tipRef} className="tip" hidden role="status" />

          <div className={`hero${active === 0 || !motion ? ' on' : ''}${intro ? ' wait' : ''}`}>
            <p className="eyebrow">A hand-built planetarium · {me.city}</p>
            <h1>
              <span className="star-dot" aria-hidden="true" />
              {me.name}
            </h1>
            <p className="role">{me.role}. The star at the centre of this chart.</p>
            <p className="hook">Five orbits. Nine moons. One asteroid belt of code.<br />Scroll to leave the launch pad.</p>
            <p className="hint" aria-hidden="true">Charts like this were made to be spun.</p>
          </div>

          {experience.map((e, i) => (
            <article key={e.id} className={`stop${active === i + 1 || !motion ? ' on' : ''}`} aria-label={`${e.company}, ${e.year}`}>
              <p className="coord">Orbit {i + 1} of {experience.length} · {e.year} · further out every year</p>
              <h2>{e.company}</h2>
              <p className="role">{e.role} · {e.place}</p>
              <p className="short">{e.short}</p>
              <p>{e.text}</p>
              {e.photo ? (
                <figure className="plate photo"><img src={e.photo} alt={e.photoAlt} loading="lazy" decoding="async" /></figure>
              ) : (
                <div className="plate drawn" aria-hidden="true"><span>{e.year}</span><small>{e.company}</small></div>
              )}
            </article>
          ))}

          <article className={`stop belt${active === KEYS - 1 || !motion ? ' on' : ''}`} aria-label="GitHub as an asteroid belt">
            <p className="coord">The asteroid belt · GitHub</p>
            <h2>{repos.length} rocks. One per public repo.</h2>
            <p className="short">{snapshot.contributionsLastYear} contributions last year, one star per day around the edge.</p>
            <p>
              The big, bright rocks moved recently; {repos.length - own} grey ones are forks he pulled into orbit.
              The supernova is {fmt(best.date)}: {best.contributionCount} contributions in one day.
              Astronomers call that a supernova. The calendar calls it a {weekday(best.date)}.
            </p>
            <ul className="stats">
              <li><b>{snapshot.commitsLastYear}</b> commits</li>
              <li><b>{snapshot.prsLastYear}</b> pull requests</li>
              <li><b>{snapshot.joined.slice(0, 4)}</b> first orbit</li>
            </ul>
            <ul className="repos" aria-label="Public repositories">
              {repos.map((r) => (
                <li key={r.name}><a href={r.url} target="_blank" rel="noopener">{r.name}</a>{r.fork ? <small> fork</small> : null}</li>
              ))}
            </ul>
            <p className="tiny">Hover the stars for dates, click a rock to open it. {live ? 'Live from GitHub.' : `Snapshot from ${snapshot.snapshotAt.slice(0, 10)}.`}</p>
          </article>

          {intro && (
            <div className="intro" role="status">
              <span>Assembling the system from dust</span>
              <button type="button" onClick={skip}>Skip intro <kbd>Esc</kbd></button>
            </div>
          )}
          {motion && <p className="scroll-cue" aria-hidden="true" style={{ opacity: active === 0 && !intro ? 1 : 0 }}>Scroll</p>}
        </section>
      </div>

      <main>
        <section id="telemetry" tabIndex={-1} className="paper eclipse">
          <div className="wrap">
            <p className="eyebrow ink">Mission telemetry</p>
            <h2 className="big rise">Five numbers. Each one survives re‑entry.</h2>
            <ol className="numbers">
              {numbers.map((n, i) => (
                <li key={n.label} className="rise">
                  <span className="num" data-count={motion ? n.value : undefined}>{n.value}</span>
                  <span className="unit">{n.unit}</span>
                  <span className="label">{n.label}</span>
                  <span className="quip">{QUIPS[i]}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Meme
          setup="Mission control: “How long does test planning take?”"
          img={pin('jesse')} alt="Jesse Pinkman leaning out of a red car window, side-eyeing the camera"
          reframe="2 HOURS → 5 MINUTES."
          fact="He cut test planning at Indo Tech Transformers from 2 hours to 5 minutes. Houston stopped asking."
        />

        <section id="moons" tabIndex={-1} className="paper eclipse">
          <div className="wrap">
            <p className="eyebrow ink">The moons · Indo Tech Transformers</p>
            <h2 className="big rise">Nine apps in orbit. Zero spreadsheets survived re‑entry.</h2>
            <p className="lede rise">All nine are in production at Indo Tech Transformers. The moon phase is just where each one sits in the list.</p>
            <div className="orrery" aria-hidden="true">
              <span className="core">Indo Tech</span>
              {apps.map((a, i) => <i key={a.name} style={{ '--i': i, '--n': apps.length }} />)}
            </div>
            <ul className="moons">
              {apps.map((a, i) => (
                <li key={a.name} className="rise">
                  <span className="phase" style={{ '--p': i / (apps.length - 1) }} aria-hidden="true" />
                  <h3>{a.url ? <a href={a.url} target="_blank" rel="noopener">{a.name}</a> : a.name}</h3>
                  <p>{a.pitch}</p>
                </li>
              ))}
            </ul>
            {building.map((b) => (
              <p key={b.name} className="lede rise">On the launch pad: <b>{b.name}</b>. {b.pitch} {b.status}.</p>
            ))}
          </div>
        </section>

        <section className="ink-sec" aria-labelledby="sat-h">
          <div className="crescent" aria-hidden="true" />
          <div className="wrap">
            <p className="eyebrow">Satellites · AI and side projects</p>
            <h2 id="sat-h" className="big rise">Twelve stages to orbit.</h2>
            <p className="lede rise">{ai.agent.name}: {ai.agent.pitch}</p>
            <ol className="stages">
              {ai.agent.versions.map((v, i) => <li key={v} className="rise"><span>v{i + 1}</span>{v}</li>)}
            </ol>
            <div className="sats">
              <div className="rise">
                <h3>{ai.rag.name}</h3>
                <p>{ai.rag.pitch}</p>
                <p className="path">{ai.rag.steps.join(' → ')}</p>
              </div>
              <div className="rise">
                <h3>{ai.browser.name}</h3>
                <p>{ai.browser.pitch}</p>
                <p className="path">{ai.stack.join(' · ')}</p>
              </div>
              {sideProjects.map((s) => (
                <div key={s.name} className="rise">
                  <h3>{s.url ? <a href={s.url} target="_blank" rel="noopener">{s.name}</a> : s.name}</h3>
                  <p>{s.pitch}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Meme
          setup="Bühler, before the tool: every project sized by hand in Excel."
          img={pin('scared')} alt="A chrome figure clutching its head in a red glare, scared and tired"
          reframe="30–40 MINUTES → UNDER 30 SECONDS."
          fact="The GUI tool he co-built removed 90% of the manual calculation errors. They burned up on re-entry."
        />

        <section id="ground" tabIndex={-1} className="paper eclipse">
          <div className="wrap">
            <p className="eyebrow ink">Ground station · field, crew and logbook</p>
            {field.map((f) => (
              <div key={f.id} className="field">
                <div className="rise">
                  <h2 className="big">{f.title}</h2>
                  <p className="coord ink">{f.when}</p>
                  <p>{f.text}</p>
                  <a className="btn" href={f.link.url} target="_blank" rel="noopener">{f.link.label}</a>
                </div>
                {f.photos.map((p) => (
                  <figure key={p.src} className="print rise">
                    <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
                    <figcaption>{p.caption}</figcaption>
                  </figure>
                ))}
              </div>
            ))}

            <div className="crew">
              <div className="rise">
                <h2 className="big">{leadership.title}</h2>
                <p>{leadership.text}</p>
              </div>
              {leadership.photos.map((p) => (
                <figure key={p.src} className="print rise"><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /></figure>
              ))}
            </div>

            <h2 className="big rise">Logbook</h2>
            <ol className="log">
              {awards.map((a) => (
                <li key={a.title} className="rise">
                  <span className="yr">{a.year}</span>
                  <div>
                    <h3>{a.title}</h3>
                    <p>{a.detail}</p>
                  </div>
                  {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" decoding="async" />}
                </li>
              ))}
            </ol>

            <div className="instruments">
              {Object.entries(skills).map(([k, list]) => (
                <div key={k} className="rise">
                  <h3>{k}</h3>
                  <p>{list.join(' · ')}</p>
                </div>
              ))}
              <div className="rise">
                <h3>Certified</h3>
                <ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        <Launch />
      </main>

      <footer className="foot">
        <p>Song: Ichiko Aoba, “Parfum d’étoiles”. Memes belong to their makers. Built with Three.js, GSAP and Lenis.</p>
        <p><a href={me.resume} target="_blank" rel="noopener">Resume (PDF)</a> · <a href={me.github} target="_blank" rel="noopener">GitHub</a> · <a href={me.linkedin} target="_blank" rel="noopener">LinkedIn</a></p>
      </footer>

      {syzygy && (
        <div className="toast" role="status">
          <p><b>Syzygy.</b> You spun the chart hard enough to line up all five planets. Rare event, rare reward:</p>
          <a href={me.resume} target="_blank" rel="noopener">The full flight log (resume, PDF)</a>
          <button type="button" onClick={() => setSyzygy(false)} aria-label="Close">×</button>
        </div>
      )}
    </>
  )
}

function Meme({ setup, img, alt, reframe, fact }) {
  return (
    <section className="meme-block ink-sec" aria-label="Intermission">
      <div className="crescent" aria-hidden="true" />
      <div className="wrap">
        <p className="eyebrow">Intermission · transmission received</p>
        <p className="setup">{setup}</p>
        <figure className="porthole"><img src={img} alt={alt} loading="lazy" decoding="async" /></figure>
        <div className="reframe">
          <p className="punch">{reframe}</p>
          <p>{fact}</p>
        </div>
      </div>
    </section>
  )
}

// CTA: drag the comet into his star; it launches an email.
function Launch() {
  const comet = useRef(null)
  const star = useRef(null)
  const drag = useRef(null)
  const [state, setState] = useState('idle')
  const mail = `mailto:${me.email}?subject=${encodeURIComponent('Launch window: a job for you')}`

  const launch = () => {
    setState('hit')
    setTimeout(() => { window.location.href = mail }, 650)
    setTimeout(() => setState('idle'), 2400)
  }
  const down = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
    setState('drag')
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    d.dx = e.clientX - d.x
    d.dy = e.clientY - d.y
    if (Math.hypot(d.dx, d.dy) > 6) d.moved = true
    comet.current.style.transform = `translate(${d.dx}px, ${d.dy}px) rotate(${Math.atan2(d.dy, d.dx)}rad)`
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const c = comet.current.getBoundingClientRect()
    const s = star.current.getBoundingClientRect()
    const hit = Math.hypot(c.x + c.width / 2 - (s.x + s.width / 2), c.y + c.height / 2 - (s.y + s.height / 2)) < s.width / 2 + 24
    comet.current.style.transform = ''
    if (hit || !d.moved) launch()
    else setState('idle')
  }

  return (
    <section id="launch" tabIndex={-1} className="launch ink-sec" aria-labelledby="launch-h">
      <div className="crescent" aria-hidden="true" />
      <div className="wrap">
        <p className="eyebrow">Launch window · open</p>
        <h2 id="launch-h" className="big">Your next quick manual step is my next app.</h2>
        <p className="lede">{me.lines[2]} Drag the comet into his star; your email app handles the landing.</p>
        <div className={`pad ${state}`}>
          <button type="button" ref={comet} className="comet" aria-label={`Launch the comet: email ${me.name}`}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); launch() } }}>
            <span className="tail" /><span className="head" />
          </button>
          <div ref={star} className="target" aria-hidden="true">
            <img src={me.portrait} alt="" loading="lazy" decoding="async" />
            <span>{me.name.split(' ')[0]}</span>
          </div>
        </div>
        <p className="plain">
          Or the plain way: <a href={`mailto:${me.email}`}>{me.email}</a> · <a href={me.linkedin} target="_blank" rel="noopener">LinkedIn</a> · <a href={me.resume} target="_blank" rel="noopener">Resume</a>
        </p>
      </div>
    </section>
  )
}

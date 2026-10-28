import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills, asset } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Darkroom puns for each chapter. The facts underneath come from content.js.
const PUNS = {
  railway: 'First exposure.',
  mettur: 'Shot at 4 x 210 MW.',
  inovate: 'Front to back, then faster.',
  buhler: '30 minutes in. 30 seconds out.',
  indotech: 'Developed in the test bay.',
}
const STAGES = ['Developer', 'Stop bath', 'Fixer', 'Wash', 'Dry']
const pad = (n) => String(n).padStart(2, '0')

function Edge({ children }) {
  return <div className="edge" aria-hidden="true"><span>{children}</span><span>KRISH 400</span><span>{children}A</span><span>SAFETY FILM</span></div>
}

function Meme({ id, setup, img, alt, reframe, sub }) {
  return (
    <section className="meme sheet" id={id} aria-label="Intermission">
      <p className="meme-setup">{setup}</p>
      <figure className="meme-print"><img src={img} alt={alt} loading="lazy" width="600" height="600" /></figure>
      <p className="meme-reframe">{reframe}</p>
      <p className="meme-sub">{sub}</p>
    </section>
  )
}

function ContactSheet({ gh }) {
  const { cells, cols, best } = useMemo(() => {
    const first = new Date(gh.days[0][0] + 'T00:00:00Z').getUTCDay()
    const max = Math.max(1, ...gh.days.map((d) => d[1]))
    const cells = gh.days.map(([d, c], i) => {
      const e = c ? 0.25 + 0.75 * Math.log1p(c) / Math.log1p(max) : 0
      const mix = (a, b) => Math.round(a + (b - a) * e)
      return { d, c, col: Math.floor((i + first) / 7), row: (i + first) % 7, bg: `rgb(${mix(26, 243)},${mix(11, 236)},${mix(8, 223)})` }
    })
    const best = cells.find((x) => x.d === gh.bestDay.date)
    return { cells, cols: cells[cells.length - 1].col + 1, best }
  }, [gh])
  return (
    <div className="sheet-paper">
      <div className="frames" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="img"
        aria-label={`${gh.days.length} days of GitHub contributions, one frame each. Best day ${gh.bestDay.date} with ${gh.bestDay.contributionCount}.`}>
        {cells.map((x) => (
          <span key={x.d} className="frame" title={`${x.d}: ${x.c}`} style={{ gridColumn: x.col + 1, gridRow: x.row + 1, background: x.bg }} />
        ))}
        {best && (
          <svg className="grease" viewBox="0 0 100 60" aria-hidden="true"
            style={{ left: `${((best.col + 0.5) / cols) * 100}%`, top: `${((best.row + 0.5) / 7) * 100}%`, width: `${(100 / cols) * 7}%` }}>
            <path pathLength="1" d="M18 34 C 14 12, 70 4, 86 22 C 98 38, 66 56, 40 54 C 16 52, 4 36, 22 20 C 30 13, 44 10, 52 11" />
          </svg>
        )}
      </div>
      <p className="grease-note">{gh.bestDay.date}. {gh.bestDay.contributionCount} in one day. Print this one.</p>
    </div>
  )
}

function LastPrint() {
  const [pull, setPull] = useState(0)
  const drag = useRef(null)
  const sent = useRef(false)
  const send = () => {
    setPull(1)
    if (sent.current) return
    sent.current = true
    setTimeout(() => { window.location.href = `mailto:${me.email}`; sent.current = false }, 700)
  }
  return (
    <div className="tray-cta">
      <button
        className="last-print"
        style={{ '--pull': pull }}
        aria-label={`Pull the last print out of the tray: email ${me.email}`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { y: e.clientY, moved: false } }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const d = (drag.current.y - e.clientY) / 220
          if (Math.abs(d) > 0.03) drag.current.moved = true
          setPull(Math.max(0, Math.min(1, d)))
        }}
        onPointerUp={() => {
          const moved = drag.current?.moved
          drag.current = null
          if (!moved) return
          if (pull > 0.6) send(); else setPull(0)
        }}
        onPointerCancel={() => { drag.current = null; setPull(0) }}
        onClick={(e) => { if (e.detail === 0 || pull < 0.05) send() }}
      >
        <span className="lp-paper">
          <span className="lp-kicker">Last print</span>
          <span className="lp-email">{me.email}</span>
          <span className="lp-line">Developed, fixed and addressed to him.</span>
        </span>
      </button>
      <div className="tray-liquid" aria-hidden="true" />
      <p className="tray-hint" aria-hidden="true">{pull > 0.6 ? 'Developed. Opening your mail.' : 'Drag it up out of the tray (or click it)'}</p>
    </div>
  )
}

export default function App() {
  const audioRef = useRef(null)
  const analyser = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const glowRef = useRef(null)
  const capRefs = useRef([])
  const counterRef = useRef(null)
  const [intro, setIntro] = useState(!reduced)
  const [lights, setLights] = useState(false)
  const [gl, setGl] = useState(reduced ? 'off' : 'loading')
  const [gh, setGh] = useState(snapshot)

  const [music, setMusic] = useMusic(() => audioRef.current, (ctx, src) => {
    const a = ctx.createAnalyser()
    a.fftSize = 64
    src.connect(a)
    a.connect(ctx.destination)
    analyser.current = a
  })

  const lightsRef = useRef(lights)
  const toggleLights = (on) => {
    lightsRef.current = on
    setLights(on)
    sceneRef.current?.setLight(on)
  }

  const skip = () => { setIntro(false); sceneRef.current?.skipIntro() }

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 3400)
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      skip()
      if (lightsRef.current) toggleLights(false)
    }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [])  

  // Fresh repos from the public API when reachable; the snapshot otherwise.
  useEffect(() => {
    const ac = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        setGh((g) => ({
          ...g,
          repos: list.map((r) => ({
            name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
            pushedAt: (r.pushed_at || '').slice(0, 10), fork: r.fork, url: r.html_url,
          })),
        }))
      })
      .catch(() => {})
    return () => ac.abort()
  }, [])

  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ lerp: 0.1 })
    lenis.on('scroll', ScrollTrigger.update)
    const buf = new Uint8Array(32)
    let level = 0, glowShown = -1
    const getLevel = () => {
      const a = analyser.current
      if (!a || audioRef.current?.paused) return 0
      a.getByteFrequencyData(buf)
      return (buf[1] + buf[2] + buf[3]) / 765
    }
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(stageRef.current)
    // the one loop: Lenis, the scene and the safelight glow
    const tick = (time, deltaMs) => {
      lenis.raf(time * 1000)
      level = getLevel()
      const g = Math.round((0.55 + level * 0.45) * 50) / 50
      if (g !== glowShown && glowRef.current) { glowRef.current.style.opacity = g; glowShown = g }
      if (visible && !document.hidden && sceneRef.current) sceneRef.current.tick(deltaMs / 1000, () => level)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const small = window.innerWidth < 700
    let dead = false
    import('./darkroom.js').then(({ createDarkroom }) => {
      if (dead) return
      const stations = [{ src: me.portrait }, ...experience.map((e) => (e.photo ? { src: e.photo } : {
        lines: e.id === 'mettur' ? ['4 x 210 MW', 'METTUR, 2024', 'BOILER. TURBINE.', 'GENERATOR.'] : ['Phantom', 'INOVATE, 2024', 'UI AND BACKEND,', 'THEN FASTER.'],
      }))]
      const decor = [asset('img/iitb.jpg'), asset('img/ecell.jpg'), asset('img/speaking.jpg'), asset('img/nec-top7.jpg'), asset('img/ced-team.jpg'), asset('img/buhler-kiosk.jpg'), asset('img/buhler-badge.jpg')]
        .slice(0, small ? 3 : 7).map((src) => ({ src }))
      sceneRef.current = createDarkroom(canvasRef.current, { stations, decor, small })
      setGl('on')
    }).catch(() => setGl('off'))

    const onMove = (e) => sceneRef.current?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
    const onResize = () => sceneRef.current?.layout()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', onResize)
    const onAnchor = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const el = document.querySelector(a.getAttribute('href'))
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -10 })
    }
    document.addEventListener('click', onAnchor)

    const ctx = gsap.context(() => {
      // the pinned, scrubbed dolly down the drying line
      const caps = capRefs.current
      const n = caps.length - 1
      ScrollTrigger.create({
        trigger: stageRef.current,
        pin: true,
        start: 'top top',
        end: () => '+=' + window.innerHeight * n * 1.1,
        onUpdate: (self) => {
          const p = self.progress
          sceneRef.current?.setProgress(p)
          const v = p * n
          caps.forEach((c, i) => {
            const o = Math.max(0, Math.min(1, 1 - (Math.abs(v - i) - 0.16) / 0.26))
            c.style.opacity = o
            c.style.transform = `translate3d(0, ${(i - v) * 60}px, 0)`
            c.style.visibility = o < 0.02 ? 'hidden' : 'visible'
          })
          if (counterRef.current) counterRef.current.textContent = `FRAME ${pad(Math.round(v) + 1)} / ${pad(n + 1)}`
        },
      })

      // trays: each number comes up like a print
      gsap.utils.toArray('.tray').forEach((el) => {
        const num = el.querySelector('.tray-num')
        const value = Number(num.dataset.value)
        ScrollTrigger.create({
          trigger: el, start: 'top 88%', end: 'top 40%', scrub: true,
          onUpdate: (s) => {
            el.style.setProperty('--dev', s.progress.toFixed(3))
            num.textContent = Math.round(value * Math.min(1, s.progress * 1.25))
          },
        })
      })

      // enlarger easel blades open on each sheet
      gsap.utils.toArray('.sheet').forEach((el) => {
        gsap.fromTo(el, { clipPath: 'inset(9% 7% 9% 7%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 45%', scrub: true },
        })
      })

      // grease pencil circles the best day
      gsap.fromTo('.grease path', { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.frames', start: 'top 75%', end: 'top 30%', scrub: true },
      })

      // negatives print to positives as they pass
      gsap.utils.toArray('.neg').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 70%', onEnter: () => el.classList.add('printed') })
      })
    })

    return () => {
      dead = true
      ctx.revert()
      io.disconnect()
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('click', onAnchor)
      lenis.destroy()
      sceneRef.current?.destroy()
      sceneRef.current = null
    }
  }, [])

  const repos = gh.repos.filter((r) => !r.fork)
  const chapters = [null, ...experience]

  return (
    <div className={`room${lights ? ' lights' : ''}${intro ? ' intro' : ''}${reduced ? ' still' : ''} gl-${gl}`}>
      <a className="skip-link" href="#trays">Skip to content</a>
      <audio ref={audioRef} src={asset('audio/for-a-moment.mp3')} loop preload="none" />
      <div className="glow" ref={glowRef} aria-hidden="true" />

      <header className="bar">
        <a className="mark" href="#top" aria-label="Back to the top">KRS<span>/darkroom</span></a>
        <nav aria-label="Sections">
          <a href="#trays">Trays</a>
          <a href="#negatives">Negatives</a>
          <a href="#contact-sheet">Contact sheet</a>
          <a href="#exit">Exit</a>
        </nav>
        <button className="sign" onClick={() => toggleLights(!lights)} aria-pressed={lights}
          aria-label={lights ? 'Turn the safelight back on' : 'Turn on the white light'}>
          <span className="cord" aria-hidden="true" />
          {lights ? 'Safelight on' : 'Do not turn on the light'}
        </button>
        <button className="music" data-music onClick={() => setMusic(!music)} aria-pressed={music}>
          <span className="eq" aria-hidden="true"><i /><i /><i /></span>{music ? 'Music off' : 'Music on'}
        </button>
      </header>

      {intro && <button className="skip-intro" onClick={skip}>Skip intro <kbd>Esc</kbd></button>}

      <main id="top">
        <section className="dolly" aria-label="The drying line: his experience, oldest first">
          <div className="stage" ref={stageRef}>
            <canvas ref={canvasRef} className="gl" aria-hidden="true" />
            <div className="vignette" aria-hidden="true" />
            <p className="counter" ref={counterRef} aria-hidden="true">FRAME 01 / {pad(chapters.length)}</p>
            {chapters.map((e, i) => (
              <article key={e ? e.id : 'hero'} ref={(el) => { capRefs.current[i] = el }}
                className={`cap ${i % 2 ? 'cap-r' : 'cap-l'}${i === 0 ? ' cap-hero' : ''}`}>
                {e === null ? (
                  <>
                    <p className="eyebrow">{me.name} &middot; {me.role} &middot; {me.city}</p>
                    <h1>Every manual task is just a <em>negative.</em> He develops it.</h1>
                    <p className="lede">{me.lines[0]}</p>
                    <p className="scroll-cue" aria-hidden="true">Scroll to walk the drying line</p>
                    <figure className="still-print"><img src={me.portrait} alt={`Portrait of ${me.name}`} width="1024" height="1536" /></figure>
                  </>
                ) : (
                  <>
                    <p className="eyebrow">Print {pad(i)} &middot; {e.year} &middot; {e.place}</p>
                    <h2>{PUNS[e.id]}</h2>
                    <p className="cap-role">{e.role}, <strong>{e.company}</strong></p>
                    <p>{e.text}</p>
                    {e.photo && <figure className="still-print"><img src={e.photo} alt={e.photoAlt} loading="lazy" width="1400" height="1050" /></figure>}
                  </>
                )}
              </article>
            ))}
          </div>
        </section>

        <Edge>12</Edge>

        <Meme id="break-1"
          setup={'"Just do it in Excel. It only takes 30 minutes."'}
          img={asset('img/pins/jesse.jpg')} alt="Jesse Pinkman glancing back from a red car, unimpressed"
          reframe="30 MIN → 30 SEC"
          sub="At Bühler he co-built the tool that does the hardware sheet in under 30 seconds, and took 90% of the calculation errors with it." />

        <section className="trays sheet" id="trays" aria-labelledby="trays-h">
          <p className="eyebrow">Tray line</p>
          <h2 id="trays-h">Numbers come up slowly. Then all at once.</h2>
          <ol className="tray-row">
            {numbers.map((n, i) => (
              <li className="tray" key={n.label}>
                <p className="tray-stage">{STAGES[i]}</p>
                <div className="tray-print">
                  <span className="tray-num" data-value={n.value} aria-hidden="true">{reduced ? n.value : 0}</span>
                  <span className="tray-unit">{n.unit}</span>
                </div>
                <p className="tray-label"><span className="sr-only">{n.value} {n.unit} </span>{n.label}</p>
              </li>
            ))}
          </ol>
        </section>

        <Edge>18</Edge>

        <section className="negatives sheet" id="negatives" aria-labelledby="neg-h">
          <p className="eyebrow">Strip of nine</p>
          <h2 id="neg-h">Nine negatives. All printed. <em>Zero spreadsheets left behind.</em></h2>
          <ul className="neg-strip">
            {apps.map((a, i) => {
              const inner = <><span className="neg-no">{pad(i + 1)}</span><span className="neg-name">{a.name}</span><span className="neg-pitch">{a.pitch}</span></>
              return (
                <li key={a.name} className="neg">
                  {a.url ? <a href={a.url} target="_blank" rel="noreferrer" aria-label={`${a.name}: ${a.pitch} (opens in a new tab)`}>{inner}</a> : <div>{inner}</div>}
                </li>
              )
            })}
          </ul>
          <h3 className="sub-h">Test strips</h3>
          <ul className="strips">
            {sideProjects.map((p) => (
              <li key={p.name}>
                {p.url ? <a href={p.url} target="_blank" rel="noreferrer"><strong>{p.name}</strong> {p.pitch}</a> : <span><strong>{p.name}</strong> {p.pitch}</span>}
              </li>
            ))}
          </ul>
          <h3 className="sub-h">Still in the developer</h3>
          <ul className="strips">
            {building.map((b) => <li key={b.name}><span><strong>{b.name}</strong> {b.pitch} {b.status}.</span></li>)}
          </ul>
        </section>

        <section className="roll sheet" id="ai" aria-labelledby="ai-h">
          <p className="eyebrow">Roll of twelve</p>
          <h2 id="ai-h">{ai.agent.name}: twelve exposures, one agent.</h2>
          <p className="lede">{ai.agent.pitch}</p>
          <ol className="roll-strip">
            {ai.agent.versions.map((v, i) => <li key={v}><span>{i + 1}</span>{v}</li>)}
          </ol>
          <div className="roll-cols">
            <div>
              <h3>{ai.rag.name}</h3>
              <p>{ai.rag.pitch}</p>
              <ol className="process">{ai.rag.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
            <div>
              <h3>{ai.browser.name}</h3>
              <p>{ai.browser.pitch}</p>
              <ul className="chips">{ai.stack.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        </section>

        <Edge>24</Edge>

        <Meme id="break-2"
          setup="The intern looked in the mirror and saw a different job title."
          img={asset('img/pins/focus.jpg')} alt="A white pawn whose reflection in a round mirror is a king"
          reframe="R&D INTERN → ASSOCIATE ENGINEER"
          sub="Same 161 kV test bay at Indo Tech Transformers. Nine shipped apps in between." />

        <section className="contact sheet" id="contact-sheet" aria-labelledby="cs-h">
          <p className="eyebrow">Contact sheet &middot; github.com/{gh.login}</p>
          <h2 id="cs-h">{gh.days.length} frames. One per day. The bright ones are where the work happened.</h2>
          <ContactSheet gh={gh} />
          <dl className="stats">
            <div><dt>Exposures this year</dt><dd>{gh.contributionsLastYear}</dd></div>
            <div><dt>Commits</dt><dd>{gh.commitsLastYear}</dd></div>
            <div><dt>Pull requests</dt><dd>{gh.prsLastYear}</dd></div>
            <div><dt>Developing since</dt><dd>{gh.joined}</dd></div>
          </dl>
          <blockquote className="bio">
            {gh.bio.split(/\r?\n/).map((l) => <span key={l}>{l}</span>)}
            <cite>Caption, in his own handwriting (his GitHub bio)</cite>
          </blockquote>
          <h3 className="sub-h">The roll: {repos.length} public repos</h3>
          <ul className="repo-strip">
            {repos.map((r, i) => (
              <li key={r.name}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  <span className="r-edge">{pad(i + 1)}A {r.language || 'MIXED'}</span>
                  <strong>{r.name}</strong>
                  {r.description && <span className="r-desc">{r.description}</span>}
                  <span className="r-meta">{r.stars ? `★ ${r.stars} · ` : ''}last pushed {r.pushedAt}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Edge>31</Edge>

        <section className="wall sheet" id="wall" aria-labelledby="wall-h">
          <p className="eyebrow">Pinned to the wall</p>
          <h2 id="wall-h">Field prints. No retouching.</h2>
          {field.map((f) => (
            <div className="wall-row" key={f.id}>
              <div className="wall-text">
                <h3>{f.title} <span>{f.when}</span></h3>
                <p>{f.text}</p>
                <a className="btn" href={f.link.url} target="_blank" rel="noreferrer">{f.link.label}</a>
              </div>
              {f.photos.map((p, i) => (
                <figure key={p.src} className={`pinned t${i}`}><img src={p.src} alt={p.alt} loading="lazy" width="700" height="850" /><figcaption>{p.caption}</figcaption></figure>
              ))}
            </div>
          ))}
          <div className="wall-row">
            <div className="wall-text">
              <h3>{leadership.title}</h3>
              <p>{leadership.text}</p>
            </div>
            {leadership.photos.map((p, i) => (
              <figure key={p.src} className={`pinned t${i + 2}`}><img src={p.src} alt={p.alt} loading="lazy" width="700" height="700" /></figure>
            ))}
          </div>
          <h3 className="sub-h">Exposure log</h3>
          <table className="log">
            <thead><tr><th scope="col">Year</th><th scope="col">Print</th><th scope="col">Notes</th></tr></thead>
            <tbody>
              {awards.map((a) => <tr key={a.title}><td>{a.year}</td><th scope="row">{a.title}</th><td>{a.detail}</td></tr>)}
            </tbody>
          </table>
          <div className="log-photos">
            {awards.filter((a) => a.photo).map((a) => <figure key={a.title} className="pinned"><img src={a.photo} alt={a.photoAlt} loading="lazy" width="700" height="700" /><figcaption>{a.title}</figcaption></figure>)}
          </div>
          <h3 className="sub-h">Chemistry shelf</h3>
          <div className="shelf">
            {Object.entries(skills).map(([k, list]) => (
              <div className="bottle" key={k}><h4>{k}</h4><p>{list.join(' · ')}</p></div>
            ))}
            <div className="bottle"><h4>Paper and certificates</h4><p>{certifications.join(' · ')}</p></div>
          </div>
        </section>

        <section className="exit sheet" id="exit" aria-labelledby="exit-h">
          <p className="eyebrow">Exit through the light trap</p>
          <h2 id="exit-h">{me.lines[2]}</h2>
          <LastPrint />
          <p className="plain">
            Or just: <a href={`mailto:${me.email}`}>{me.email}</a>
            <a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={me.github} target="_blank" rel="noreferrer">GitHub</a>
            <a href={me.resume} target="_blank" rel="noreferrer">Resume (PDF)</a>
          </p>
        </section>
      </main>

      <footer className="foot">
        <p>Fixed, washed and dried in {me.city}. Song: &ldquo;for a moment&rdquo;.</p>
      </footer>

      {lights && (
        <div className="ruined" role="dialog" aria-modal="false" aria-labelledby="ruined-h">
          <p className="eyebrow">Somebody opened the door</p>
          <h2 id="ruined-h">Every print on the line just fogged to black.</h2>
          <p>Only one thing survives white light in here:</p>
          <p className="latent">{me.lines[1]}</p>
          <p>{me.lines[3]} But the resume was in the light-safe box, so here it is anyway.</p>
          <p className="ruined-actions">
            <a className="btn" href={me.resume} target="_blank" rel="noreferrer">Open the resume (PDF)</a>
            <button className="btn ghost" onClick={() => toggleLights(false)}>Safelight back on</button>
          </p>
        </div>
      )}
    </div>
  )
}

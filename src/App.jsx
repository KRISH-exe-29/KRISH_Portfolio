import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, certifications, skills, asset, field } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const START = 22 * 60 // 22:00
const NIGHT = 8 * 60 + 12 // to 06:12, sunrise
const hhmm = (p) => {
  const m = Math.round(START + p * NIGHT) % (24 * 60)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
const LABELS = {
  monitors: 'Monitors: the nine apps', corkboard: 'Corkboard: where I worked', shelf: 'Shelf: awards and certificates',
  calendar: 'Wall calendar: GitHub', window: 'Window: what I think about', bed: 'Bed: who I am', plant: 'Plant: what I keep alive',
  lamp: 'Desk lamp (has a switch)', phone: 'Phone: message me',
}
const TOUR = [
  null,
  ['monitors', 'Two monitors. Nine apps in production. Zero spreadsheets left behind.'],
  ['corkboard', 'The corkboard. Five places, pinned oldest first, red pins only.'],
  ['calendar', 'One sticky note per day on GitHub. October 10 needed sixty.'],
  ['shelf', 'The shelf holds a patent. The bed holds a duvet nobody has touched since 22:00.'],
  ['window', 'Out the window: one AI agent in twelve versions, still thinking.'],
  [null, 'Everything in here is clickable. Pick something. Touch anything.'],
]

/* ---------- shared content blocks (used in sections and in the object dialogs) ---------- */
function AppsList() {
  return (
    <ul className="apps">
      {apps.map((a, i) => (
        <li key={a.name} className="app">
          <span className="app-bar" aria-hidden="true"><i /><i /><i /> <b>{String(i + 1).padStart(2, '0')}</b></span>
          <h3>{a.url ? <a href={a.url} target="_blank" rel="noreferrer">{a.name}<span className="sr"> (opens in a new tab)</span></a> : a.name}</h3>
          <p>{a.pitch}</p>
          <span className="live">{a.url ? 'live' : 'internal, in production'}</span>
        </li>
      ))}
      {building.map((b) => (
        <li key={b.name} className="app">
          <span className="app-bar" aria-hidden="true"><i /><i /><i /> <b>WIP</b></span>
          <h3>{b.name}</h3>
          <p>{b.pitch}</p>
          <span className="live">still compiling, {b.status.toLowerCase()}</span>
        </li>
      ))}
    </ul>
  )
}

function Experience() {
  return (
    <ol className="pins">
      {experience.map((e, i) => (
        <li key={e.id} className="pin" style={{ '--r': `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg` }}>
          <span className="tack" aria-hidden="true" />
          {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" decoding="async" />}
          <p className="pin-year">{e.year} · {e.place}</p>
          <h3>{e.company}</h3>
          <p className="pin-role">{e.role}</p>
          <p>{e.text}</p>
        </li>
      ))}
    </ol>
  )
}

function AiBlock() {
  return (
    <div className="ai">
      <article>
        <h3>{ai.agent.name}</h3>
        <p>{ai.agent.pitch}</p>
        <ol className="versions">{ai.agent.versions.map((v, i) => <li key={v}><b>v{i + 1}</b> {v}</li>)}</ol>
      </article>
      <article>
        <h3>{ai.rag.name}</h3>
        <p>{ai.rag.pitch}</p>
        <p className="steps">{ai.rag.steps.join(' → ')}</p>
        <h3>{ai.browser.name}</h3>
        <p>{ai.browser.pitch}</p>
        <p className="chips">{ai.stack.map((s) => <span key={s}>{s}</span>)}</p>
      </article>
    </div>
  )
}

function Shelf() {
  return (
    <div className="shelf">
      <ul className="trophies">
        {awards.map((a) => (
          <li key={a.title}>
            {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" decoding="async" />}
            <span className="pin-year">{a.year}</span>
            <h3>{a.title}</h3>
            <p>{a.detail}</p>
          </li>
        ))}
      </ul>
      <h3 className="shelf-h">Certificates, framed and slightly crooked</h3>
      <ul className="certs">{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
    </div>
  )
}

function Skills() {
  return (
    <dl className="skills">
      {Object.entries(skills).map(([k, list]) => (
        <div key={k}><dt>{k}</dt><dd>{list.map((s) => <span key={s}>{s}</span>)}</dd></div>
      ))}
    </dl>
  )
}

function About() {
  return (
    <div className="about">
      <img src={me.portrait} alt={`Portrait of ${me.name}`} loading="lazy" decoding="async" />
      <div>
        <h3>{me.name}</h3>
        <p>{me.role}. {me.field}, {me.city}.</p>
        <ul>{me.lines.map((l) => <li key={l}>{l}</li>)}</ul>
        <p><a href={me.resume} target="_blank" rel="noreferrer">Resume (PDF)<span className="sr"> opens in a new tab</span></a></p>
      </div>
    </div>
  )
}

const DIALOGS = {
  monitors: ['On the monitors', 'Nine apps. One factory.', AppsList],
  corkboard: ['On the corkboard', 'Pinned oldest first.', Experience],
  shelf: ['On the shelf', 'Dusted for you.', Shelf],
  window: ['Out the window', 'What I think about at 2 a.m.', AiBlock],
  bed: ['The bed', 'Where the good ideas show up, right before sleep.', About],
  plant: ['The plant', 'Things I keep alive. Including the plant, mostly.', Skills],
}

/* ---------- world bits ---------- */
function Blinds() {
  return <div className="blinds" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>
}

function Meme({ id, setup, img, alt, reframe, sub }) {
  return (
    <section className="meme" id={id} aria-label="Intermission">
      <Blinds />
      <p className="meme-setup reveal">{setup}</p>
      <figure className="meme-fig"><img src={img} alt={alt} loading="lazy" decoding="async" /></figure>
      <p className="meme-reframe reveal">{reframe}</p>
      <p className="meme-sub reveal">{sub}</p>
    </section>
  )
}

function Notes({ days, best }) {
  const first = new Date(days[0][0] + 'T00:00:00Z').getUTCDay()
  const tone = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 12 ? 3 : 4)
  return (
    <div className="notes-scroll">
      <div className="notes" role="img" aria-label={`Contribution calendar: one sticky note per day for the last year. The busiest day was ${best.date} with ${best.contributionCount} contributions.`}>
        {Array.from({ length: first }, (_, i) => <i key={'p' + i} className="note blank" aria-hidden="true" />)}
        {days.map(([d, n], i) => (
          <i key={d} className={`note t${tone(n)}${d === best.date ? ' best' : ''}`} title={`${d}: ${n}`} style={{ '--r': `${Math.sin(i * 12.9) * 6}deg` }} aria-hidden="true">
            {d === best.date && <>{Array.from({ length: 7 }, (_, j) => <s key={j} style={{ '--j': j }} />)}<em>{best.contributionCount}</em></>}
          </i>
        ))}
      </div>
    </div>
  )
}

function Phone({ getTime }) {
  const [v, setV] = useState(0)
  const [sent, setSent] = useState(false)
  const mail = `mailto:${me.email}?subject=${encodeURIComponent('I have a manual step')}`
  const slide = (e) => {
    const n = +e.target.value
    setV(n)
    if (n >= 96 && !sent) { setSent(true); window.location.href = mail }
  }
  return (
    <div className="phone">
      <div className="phone-screen">
        <p className="phone-time" aria-hidden="true">{getTime()}</p>
        <div className="bubble">
          <p className="bubble-from">Draft to Krishna</p>
          <p>&ldquo;Hi. We have a manual step nobody likes. Can it be a button?&rdquo;</p>
        </div>
        <label className="slider">
          <span>{sent ? 'Opening your mail app…' : 'Slide to send'}</span>
          <input type="range" min="0" max="100" value={v} onChange={slide} onPointerUp={() => !sent && setV(0)} onKeyUp={(e) => e.key === 'Enter' && (window.location.href = mail)} aria-label="Slide to open an email to Krishna" />
        </label>
      </div>
    </div>
  )
}

export default function App() {
  const canvasRef = useRef(null)
  const roomRef = useRef(null)
  const tourRef = useRef(null)
  const clockRef = useRef(null)
  const tipRef = useRef(null)
  const dialogRef = useRef(null)
  const audioRef = useRef(null)
  const lenisRef = useRef(null)
  const state = useRef({ tour: 0, dawn: 0, time: '22:00', analyser: null })
  const [built, setBuilt] = useState(calm)
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(null)
  const [lamp, setLamp] = useState(true)
  const [gh, setGh] = useState(snapshot)
  const [playing, setPlaying] = useState(false)

  const [music, setMusic] = useMusic(() => audioRef.current, (ctx, src) => {
    const an = ctx.createAnalyser()
    an.fftSize = 256
    src.connect(an)
    an.connect(ctx.destination)
    state.current.analyser = an
    roomRef.current?.setAnalyser(an)
  })

  const pick = (k) => {
    if (k === 'lamp') return setLamp((l) => !l)
    if (k === 'phone') return lenisRef.current ? lenisRef.current.scrollTo('#call') : document.getElementById('call').scrollIntoView()
    if (k === 'calendar') return lenisRef.current ? lenisRef.current.scrollTo('#github') : document.getElementById('github').scrollIntoView()
    setOpen(k)
  }
  const pickRef = useRef(pick)
  useEffect(() => { pickRef.current = pick })

  const skip = () => { roomRef.current?.skip(); setBuilt(true) }

  useEffect(() => { roomRef.current?.setLamp(lamp) }, [lamp])

  useEffect(() => {
    const d = dialogRef.current
    if (open && !d.open) { d.showModal(); lenisRef.current?.stop() }
  }, [open])

  // the room: lazy-loaded so the first paint never waits for three.js
  useEffect(() => {
    let room = null
    let dead = false
    const small = window.innerWidth < 760
    import('./room.js').then(({ createRoom }) => {
      if (dead) return
      room = createRoom(canvasRef.current, {
        small,
        onPick: (k) => pickRef.current(k),
        onBuilt: () => setBuilt(true),
        onHover: (k, x, y) => {
          const tip = tipRef.current
          if (!k) { tip.hidden = true; return }
          tip.hidden = false
          tip.textContent = LABELS[k]
          tip.style.transform = `translate(${Math.min(x + 16, window.innerWidth - 240)}px, ${y + 16}px)`
        },
      })
      roomRef.current = room
      const s = state.current
      room.setTour(s.tour)
      room.setDawn(s.dawn)
      room.setClock(s.time)
      room.setDays(snapshot.days, snapshot.bestDay.date)
      if (s.analyser) room.setAnalyser(s.analyser)
      if (calm) room.skip()
      gsap.ticker.add(room.tick)
    })
    return () => { dead = true; if (room) { gsap.ticker.remove(room.tick); room.destroy() } roomRef.current = null }
  }, [])

  // Escape skips the build
  useEffect(() => {
    if (built) return
    const k = (e) => { if (e.key === 'Escape') { roomRef.current?.skip(); setBuilt(true) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [built])

  // scroll: Lenis + ScrollTrigger, the pinned tour, the clock and the sunrise
  useEffect(() => {
    const root = document.documentElement
    let lenis = null
    const raf = (t) => lenis?.raf(t * 1000)
    if (!calm) {
      lenis = new Lenis({ lerp: 0.1 })
      lenisRef.current = lenis
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          const p = self.progress
          const time = hhmm(p)
          const dawn = Math.max(0, Math.min(1, (p - 0.72) / 0.26))
          state.current.time = time
          state.current.dawn = dawn
          if (clockRef.current) clockRef.current.textContent = time
          root.style.setProperty('--dawn', dawn.toFixed(3))
          roomRef.current?.setClock(time)
          roomRef.current?.setDawn(dawn)
        },
      })
      if (calm) return
      ScrollTrigger.create({
        trigger: tourRef.current, start: 'top top', end: '+=520%', pin: true, anticipatePin: 1,
        onUpdate: (self) => {
          state.current.tour = self.progress
          roomRef.current?.setTour(self.progress)
          setStep(Math.round(self.progress * (TOUR.length - 1)))
        },
      })
      gsap.utils.toArray('.blinds').forEach((el) => {
        gsap.fromTo(el.children, { scaleY: 1 }, { scaleY: 0, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'top 35%', scrub: true } })
      })
      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
      gsap.utils.toArray('.meme-fig').forEach((el) => {
        gsap.fromTo(el, { clipPath: 'circle(8% at 50% 0%)', filter: 'brightness(0.2)' }, { clipPath: 'circle(75% at 50% 40%)', filter: 'brightness(1)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', end: 'center 55%', scrub: true } })
      })
      gsap.from('.note', { opacity: 0, scale: 0.3, duration: 0.4, stagger: { each: 0.003, from: 'start' }, ease: 'back.out(2)', scrollTrigger: { trigger: '.notes', start: 'top 80%' } })
    })

    // anchor links glide with Lenis
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a || !lenis) return
      const el = document.querySelector(a.getAttribute('href'))
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -10 })
    }
    document.addEventListener('click', onClick)

    // latest GitHub profile and repos, never blocking
    const ac = new AbortController()
    const get = (u) => fetch(u, { signal: ac.signal }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    Promise.allSettled([get('https://api.github.com/users/KRISH-exe-29'), get('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed')]).then(([u, r]) => {
      setGh((g) => ({
        ...g,
        ...(u.status === 'fulfilled' && u.value?.login ? { bio: u.value.bio ?? g.bio, followers: u.value.followers ?? g.followers } : {}),
        ...(r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length ? {
          repos: r.value.filter((x) => !x.fork).map((x) => ({ name: x.name, description: x.description, language: x.language, stars: x.stargazers_count, pushedAt: (x.pushed_at || '').slice(0, 10), homepage: x.homepage, url: x.html_url })),
        } : {}),
      }))
    })

    return () => {
      ac.abort()
      ctx.revert()
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(raf)
      lenis?.destroy()
      lenisRef.current = null
    }
  }, [])

  const repos = [...gh.repos].filter((r) => r.description).sort((a, b) => (b.pushedAt || '').localeCompare(a.pushedAt || ''))
  const bio = (gh.bio || '').split(/\r?\n/).filter(Boolean)
  const D = open && DIALOGS[open]
  const DBody = D?.[2]
  const stepOn = calm ? -1 : step

  return (
    <>
      <a className="skiplink" href="#apps">Skip to content</a>
      <audio ref={audioRef} src={asset('audio/duvet.mp3')} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />

      <header className="top">
        <a className="brand" href="#top">KRS<span aria-hidden="true">·</span><small>night shift</small></a>
        <p className="clock" aria-label="Time in the room"><span ref={clockRef}>22:00</span></p>
        <nav aria-label="Sections">
          <a href="#apps">Apps</a><a href="#corkboard">Work</a><a href="#github">GitHub</a><a href="#call">Contact</a>
        </nav>
        <button type="button" data-music className={`music${playing ? ' on' : ''}`} onClick={() => setMusic(!music)}>
          <span className="eq" aria-hidden="true"><i /><i /><i /></span>
          {music ? 'Music off' : 'Music on'}
        </button>
      </header>

      <main id="top">
        <section className={`tour${lamp ? '' : ' dark'}`} ref={tourRef} aria-label="His room at night">
          <div className="stage">
            <canvas ref={canvasRef} aria-hidden="true" />
            <div className="tip" ref={tipRef} hidden />
          </div>

          <div className={`hero${stepOn > 0 ? ' away' : ''}`}>
            <p className="kicker">Night shift · {me.city}</p>
            <h1>{me.name}</h1>
            <p className="role">{me.role}. Day job: the 161 kV test bay. Night job: making somebody&rsquo;s manual step disappear.</p>
            <p className="hook">Somebody&rsquo;s manual step became tonight&rsquo;s side quest.</p>
          </div>

          <ol className="captions">
            {TOUR.map((c, i) => c && (
              <li key={i} className={stepOn === i ? 'on' : ''}>
                <span className="cap-n">{i}/{TOUR.length - 1}</span> {c[1]}
              </li>
            ))}
          </ol>

          <div className="objects" role="group" aria-label="Things in the room">
            {Object.entries(LABELS).map(([k, l]) => (
              <button key={k} type="button" onClick={() => pick(k)} className={k === 'lamp' && !lamp ? 'off' : ''} aria-pressed={k === 'lamp' ? !lamp : undefined}>
                {l.split(':')[0].replace(' (has a switch)', '')}
              </button>
            ))}
          </div>

          {!built && <button type="button" className="skip" onClick={skip}>Skip intro <kbd>Esc</kbd></button>}

          <p className={`stars-msg${lamp ? '' : ' on'}`} aria-live="polite">
            {!lamp && <>Lights out. The stars on the wall were there all along: <b>9 apps</b>, in production. <a href={me.resume} target="_blank" rel="noreferrer">The whole night, in one file (resume PDF)</a></>}
          </p>
        </section>

        <section id="apps" className="sec">
          <Blinds />
          <p className="kicker">23:10 · the monitors</p>
          <h2 className="reveal">Nine apps. One factory. <em>Zero spreadsheets left behind.</em></h2>
          <ul className="numbers">
            {numbers.map((n) => (
              <li key={n.label} className="reveal"><b>{n.unit === 'rank' ? `#${n.value}` : n.value}</b> <span>{n.unit === 'rank' ? '' : n.unit}</span> <small>{n.label}</small></li>
            ))}
          </ul>
          <AppsList />
          <h3 className="side-h">Side quests that also shipped</h3>
          <ul className="side">
            {sideProjects.map((s) => (
              <li key={s.name}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.name}<span className="sr"> (opens in a new tab)</span></a> : <b>{s.name}</b>} <span>{s.pitch}</span></li>
            ))}
          </ul>
        </section>

        <Meme
          id="meme-1"
          setup="1:47 a.m. The Excel has three sheets and a feeling."
          img={asset('img/pins/scared-tired.jpg')}
          alt="A chrome figure clutching its head against a red background, glowing eyes, looking overwhelmed"
          reframe="30 to 40 minutes → under 30 seconds"
          sub="At Bühler I co-built the tool that does the load and I/O card sheet in one click. 90% of the manual calculation errors left with the spreadsheet."
        />

        <section id="corkboard" className="sec cork-sec">
          <Blinds />
          <p className="kicker">01:30 · the corkboard</p>
          <h2 className="reveal">Pinned oldest first. <em>Each pin was a night like this one.</em></h2>
          <Experience />
          {field.map((f) => (
            <div key={f.id} className="field">
              <div>
                <p className="pin-year">{f.when}</p>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <a href={f.link.url} target="_blank" rel="noreferrer">{f.link.label}<span className="sr"> (opens in a new tab)</span></a>
              </div>
              {f.photos.map((p) => (
                <figure key={p.src} className="polaroid"><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /><figcaption>{p.caption}</figcaption></figure>
              ))}
            </div>
          ))}
        </section>

        <section id="window" className="sec">
          <Blinds />
          <p className="kicker">02:40 · out the window</p>
          <h2 className="reveal">The agent got twelve versions. <em>I got zero hours of sleep.</em></h2>
          <AiBlock />
        </section>

        <Meme
          id="meme-2"
          setup="Walked into the 161 kV test bay as the intern."
          img={asset('img/pins/focus.jpg')}
          alt="A white chess pawn looking into a round mirror, its reflection is a king"
          reframe="R&D intern → Associate Engineer"
          sub="Same test bay at Indo Tech. Now I also lead the OT-IT integration of sensors, energy meters and cloud. The mirror was just early."
        />

        <section id="github" className="sec">
          <Blinds />
          <p className="kicker">03:55 · the wall calendar</p>
          <h2 className="reveal">One sticky note per day. <em>October 10 ran out of wall.</em></h2>
          <ul className="numbers gh">
            <li><b>{gh.contributionsLastYear}</b> <span>contributions</span> <small>in the last year</small></li>
            <li><b>{gh.commitsLastYear}</b> <span>commits</span> <small>most of them after dinner</small></li>
            <li><b>{gh.prsLastYear}</b> <span>pull requests</span> <small>reviewed by me, at night, sternly</small></li>
            <li><b>{gh.bestDay.contributionCount}</b> <span>in one day</span> <small>{gh.bestDay.date}. The duvet waited.</small></li>
          </ul>
          <Notes days={gh.days} best={gh.bestDay} />
          <p className="legend" aria-hidden="true"><i className="note t0" /> 0 <i className="note t1" /> 1-2 <i className="note t2" /> 3-5 <i className="note t3" /> 6-11 <i className="note t4" /> 12+</p>
          <blockquote className="bio">
            {bio.map((l) => <p key={l}>{l}</p>)}
            <footer>His GitHub bio, since {gh.joined}. <a href={me.github} target="_blank" rel="noreferrer">@{gh.login}<span className="sr"> on GitHub, opens in a new tab</span></a></footer>
          </blockquote>
          <ul className="repos">
            {repos.map((r) => (
              <li key={r.name}>
                <a href={r.url} target="_blank" rel="noreferrer"><b>{r.name}</b><span className="sr"> (opens in a new tab)</span></a>
                <p>{r.description}</p>
                <small>{[r.language, r.pushedAt && `pushed ${r.pushedAt}`].filter(Boolean).join(' · ')}</small>
              </li>
            ))}
          </ul>
        </section>

        <section id="shelf" className="sec">
          <Blinds />
          <p className="kicker">04:50 · the shelf</p>
          <h2 className="reveal">Rank 7 of 1500+ colleges. <em>One patent. Still dusting.</em></h2>
          <Shelf />
          <div className="lead">
            <div>
              <h3>{leadership.title}</h3>
              <p>{leadership.text}</p>
            </div>
            {leadership.photos.map((p) => <img key={p.src} src={p.src} alt={p.alt} loading="lazy" decoding="async" />)}
          </div>
          <h3 className="shelf-h">The plant, and other things I keep alive</h3>
          <Skills />
        </section>

        <section id="call" className="sec call">
          <Blinds />
          <p className="kicker">05:58 · the phone on the desk</p>
          <h2 className="reveal">Your next quick manual step <em>is my next app.</em></h2>
          <div className="call-grid">
            <Phone getTime={() => state.current.time} />
            <div className="call-plain">
              <p>{me.lines[2]}</p>
              <p className="mail">Or skip the slider: <a href={`mailto:${me.email}`}>{me.email}</a></p>
              <ul className="links">
                <li><a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn<span className="sr"> (opens in a new tab)</span></a></li>
                <li><a href={me.github} target="_blank" rel="noreferrer">GitHub<span className="sr"> (opens in a new tab)</span></a></li>
                <li><a href={me.resume} target="_blank" rel="noreferrer">Resume PDF<span className="sr"> (opens in a new tab)</span></a></li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="sunrise">
        <p className="sun-time">06:12</p>
        <p>Sunrise. Shipped. Going to bed.</p>
        <p className="small">{me.lines[3]} Built at night by {me.name}, {me.city}.</p>
      </footer>

      <dialog ref={dialogRef} className="sheet" onClose={() => { setOpen(null); lenisRef.current?.start() }} onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()} data-lenis-prevent aria-labelledby="sheet-h">
        {D && (
          <div className="sheet-in">
            <p className="kicker">{D[0]}</p>
            <h2 id="sheet-h">{D[1]}</h2>
            <DBody />
            <form method="dialog"><button className="close">Close <kbd>Esc</kbd></button></form>
          </div>
        )}
      </dialog>
    </>
  )
}

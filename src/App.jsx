import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, sideProjects, ai, awards, leadership, field, certifications, skills, asset } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)

const PALETTE = ['#FF4D2E', '#FFB627', '#3DDC97', '#3A4BFF', '#FF7AB6']
const APP_SHORT = {
  'Dispatch Management': 'DISPATCH', EPMS: 'EPMS', 'Fasteners Automation': 'FASTENERS', 'Industrial Data System': 'DATA SYS',
  'Job Lens': 'JOB LENS', KioskSentinel: 'KIOSK', 'RTCC & M.Box Tracker': 'RTCC', 'Shop Floor Job Status': 'SHOP FLOOR', 'Transformer Test Planner': 'TEST PLAN',
}
const AWARD_SHORT = {
  'National finalist': 'FINALIST', 'Entrepreneurship Intern': 'CED', 'Top 8, NEC Basic Track': 'TOP 8', 'Patent published': 'PATENT',
  'Rank 7 of 1500+ colleges': 'RANK 7', 'Runner-up, Fish Tank': 'FISH TANK', 'Nine apps shipped': '9 APPS',
}
const SKILL_PICKS = [['Factory floor', 'IEC 60076 testing', 'IEC 60076'], ['Code', 'Python', 'PYTHON'], ['AI', 'LangGraph', 'LANGGRAPH'], ['Factory floor', 'MCC panels', 'MCC'], ['Code', 'React', 'REACT'], ['AI', 'Ollama', 'OLLAMA'], ['Code', 'Three.js', 'THREE.JS'], ['Code', 'Supabase', 'SUPABASE']]
const PUNCH = [
  'Nine apps. One factory. Zero spreadsheets left behind.',
  'Bugs now need a ticket to get past dispatch.',
  'A 30-minute job, now 30 seconds. Speedrun certified.',
  'Rank 7 of 1500+. High score saved.',
  'Street lights that report their own faults.',
]
const RANKS = ['1ST', '2ND', '3RD', '4TH', '5TH']
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

const RESUME = { kind: 'resume', short: 'RESUME', title: 'The resume', text: 'Jackpot. Every number on this page, on one page, as a PDF.', url: me.resume, cta: 'Open the resume (PDF)', color: '#E8A400' }

function buildPrizes() {
  const appP = apps.map((a) => ({ kind: 'app', short: APP_SHORT[a.name] || a.name.toUpperCase(), title: a.name, text: a.pitch, url: a.url, cta: 'Open this app', tag: 'Production app, Indo Tech Transformers' }))
  const awardP = awards.map((a) => ({ kind: 'award', short: AWARD_SHORT[a.title] || a.year, title: a.title, text: `${a.detail}, ${a.year}.`, tag: 'Award' }))
  const skillP = SKILL_PICKS.map(([group, name, short]) => ({ kind: 'skill', short, title: name, text: `Skill token from the ${group} shelf. Also on that shelf: ${skills[group].filter((x) => x !== name).join(', ')}.`, tag: 'Skill' }))
  const mixed = []
  for (let i = 0; i < Math.max(appP.length, awardP.length, skillP.length); i++) [appP[i], awardP[i], skillP[i]].forEach((p) => p && mixed.push(p))
  return [RESUME, ...mixed].map((p, i) => ({ ...p, color: p.color || PALETTE[i % PALETTE.length] }))
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function mapRepo(r) {
  return { name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, pushedAt: (r.pushed_at || '').slice(0, 10), fork: r.fork, url: r.html_url }
}

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function App() {
  const prizes = useMemo(buildPrizes, [])
  const [reduced] = useState(reducedMotion)
  const [intro, setIntro] = useState(!reduced)
  const [hover, setHover] = useState(null)
  const [status, setStatus] = useState('Insert coin. Receive automation.')
  const [prize, setPrize] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [repos, setRepos] = useState(() => snapshot.repos.filter((r) => !r.fork))
  const [bio, setBio] = useState(snapshot.bio)
  const [chute, setChute] = useState('idle')
  const [rigLit, setRigLit] = useState(false)

  const audio = useRef(null)
  const level = useRef(() => 0)
  const canvas = useRef(null)
  const scene = useRef(null)
  const keys = useRef({})
  const dialog = useRef(null)
  const lenis = useRef(null)
  const taps = useRef([])

  const [music, setMusic] = useMusic(() => audio.current, (ctx, source) => {
    const an = ctx.createAnalyser()
    an.fftSize = 256
    source.connect(an); an.connect(ctx.destination)
    const data = new Uint8Array(an.frequencyBinCount)
    level.current = () => {
      if (audio.current?.paused) return 0
      an.getByteFrequencyData(data)
      let sum = 0
      for (let i = 1; i < 9; i++) sum += data[i]
      return sum / (8 * 255)
    }
  })

  // ---- the scene: lazy-loaded so the first paint never waits on Three.js ----
  useEffect(() => {
    let dead = false, api = null
    const tick = (_, ms) => api?.tick(Math.min(ms / 1000, 1 / 20))
    import('./clawScene.js').then(({ createClawScene }) => createClawScene(canvas.current, {
      prizes,
      reduced,
      keys: keys.current,
      getLevel: () => level.current(),
      onHover: setHover,
      onStatus: setStatus,
      onPrize: (p) => setPrize(p),
    })).then((s) => {
      if (dead) { s.dispose(); return }
      api = s; scene.current = s
      gsap.ticker.add(tick)
      canvas.current.classList.add('on')
    }).catch(() => setStatus('This browser skipped the 3D claw. The prize list below has every capsule.'))
    const end = setTimeout(() => setIntro(false), 3200)
    return () => { dead = true; clearTimeout(end); gsap.ticker.remove(tick); api?.dispose(); scene.current = null }
  }, [prizes, reduced])

  const skipIntro = () => { scene.current?.settle(); setIntro(false) }

  // ---- keys: Escape skips the intro, the old code rigs the claw ----
  useEffect(() => {
    const seq = []
    const onKey = (e) => {
      if (e.key === 'Escape' && intro) skipIntro()
      seq.push(e.key.length === 1 ? e.key.toLowerCase() : e.key)
      if (seq.length > KONAMI.length) seq.shift()
      if (seq.join() === KONAMI.join()) rigIt()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function rigIt() {
    if (!scene.current) return
    lenis.current ? lenis.current.scrollTo(0) : window.scrollTo(0, 0)
    if (scene.current.rig()) { setRigLit(true); setTimeout(() => setRigLit(false), 6000) }
    else setStatus('Code accepted. Let this round finish, then enter it again.')
  }

  function tapSticker() {
    const now = performance.now()
    taps.current = [...taps.current.filter((t) => now - t < 2500), now]
    if (taps.current.length >= 5) { taps.current = []; rigIt() }
    else setStatus(['Operator note: the gold one is rigged.', 'Knock again.', 'The sticker is warming up.', 'One more.'][taps.current.length - 1])
  }

  // ---- prize card ----
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (prize && !d.open) { d.showModal(); lenis.current?.stop() }
  }, [prize])
  const closePrize = () => { setPrize(null); lenis.current?.start() }

  // ---- music state for the pill ----
  useEffect(() => {
    const a = audio.current
    const on = () => setPlaying(true), off = () => setPlaying(false)
    a.addEventListener('play', on); a.addEventListener('pause', off)
    return () => { a.removeEventListener('play', on); a.removeEventListener('pause', off) }
  }, [])

  // ---- GitHub: refresh from the public API, keep the snapshot if it fails ----
  useEffect(() => {
    const u = `https://api.github.com/users/${snapshot.login}`
    fetch(`${u}/repos?per_page=100&sort=pushed`).then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((list) => { const own = list.map(mapRepo).filter((r) => !r.fork); if (own.length) setRepos(own) }).catch(() => {})
    fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(r))).then((j) => { if (j.bio) setBio(j.bio) }).catch(() => {})
  }, [])

  // ---- smooth scroll + scroll scenes ----
  useEffect(() => {
    if (reduced) return
    document.documentElement.classList.add('motion')
    const l = new Lenis({ lerp: 0.1, anchors: true })
    lenis.current = l
    l.on('scroll', ScrollTrigger.update)
    const raf = (t) => l.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      // hero: pinned; scrolling turns the cabinet and slides it off down the arcade
      gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=120%', pin: true, scrub: true, onUpdate: (s) => scene.current?.setScroll(s.progress) } })
        .to('.cap-1', { autoAlpha: 0, y: -40, duration: 0.35 }, 0.05)
        .fromTo('.cap-2', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.4)
        .to('.cap-2', { autoAlpha: 0, duration: 0.2 }, 0.85)

      // roll-up shutters between sections
      gsap.utils.toArray('.shutter').forEach((sh) => {
        gsap.fromTo(sh, { yPercent: 0 }, { yPercent: -101, ease: 'none', scrollTrigger: { trigger: sh.parentElement, start: 'top 92%', end: 'top 25%', scrub: true } })
      })

      // high scores: pinned on big screens, rows type in as you scroll
      const mm = gsap.matchMedia()
      mm.add('(min-width: 760px) and (min-height: 640px)', () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.scores', start: 'top top', end: '+=150%', pin: true, scrub: 0.6 } })
        gsap.utils.toArray('.score-row').forEach((row, i) => {
          const val = row.querySelector('.score-val')
          const n = Number(val.dataset.value), o = { v: 0 }
          tl.from(row, { autoAlpha: 0, x: -80, duration: 0.5 }, i * 0.6)
          tl.to(o, { v: n, duration: 0.5, ease: 'none', onUpdate: () => { val.textContent = String(Math.round(o.v)).padStart(3, '0') } }, i * 0.6)
        })
        tl.from('.score-saved', { autoAlpha: 0, scale: 0.5, rotation: -12, duration: 0.4 })
      })
      mm.add('(max-width: 759px), (max-height: 639px)', () => {
        gsap.utils.toArray('.score-row').forEach((row) => gsap.from(row, { autoAlpha: 0, x: -40, scrollTrigger: { trigger: row, start: 'top 90%', end: 'top 70%', scrub: true } }))
      })

      // memes: the picture opens like a prize door
      gsap.utils.toArray('.meme').forEach((m) => {
        gsap.fromTo(m.querySelector('.meme-img'), { clipPath: 'inset(46% 0% 46% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: m, start: 'top 80%', end: 'center 55%', scrub: true } })
        gsap.from(m.querySelector('.meme-reframe'), { scale: 0.6, rotation: -6, autoAlpha: 0, scrollTrigger: { trigger: m, start: 'center 70%', end: 'bottom 75%', scrub: true } })
      })

      // photo booth: each frame develops from a flash
      gsap.utils.toArray('.frame-pic').forEach((f) => {
        gsap.fromTo(f, { filter: 'brightness(2.6) saturate(0) blur(5px)' }, { filter: 'brightness(1) saturate(1) blur(0px)', ease: 'none', scrollTrigger: { trigger: f, start: 'top 92%', end: 'top 45%', scrub: true } })
      })
      gsap.from('.strip', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.booth', start: 'top 80%', end: 'bottom bottom', scrub: true } })

      // ticket counter: award tickets feed out of the dispenser
      gsap.utils.toArray('.award').forEach((t, i) => {
        gsap.from(t, { x: i % 2 ? 140 : -140, rotation: i % 2 ? 5 : -5, autoAlpha: 0, scrollTrigger: { trigger: t, start: 'top 95%', end: 'top 65%', scrub: true } })
      })

      // GitHub wall prints one ticket per day
      gsap.from('.gh-t', { scaleY: 0, transformOrigin: '50% 0%', ease: 'none', stagger: { amount: 1 }, scrollTrigger: { trigger: '.wall', start: 'top 85%', end: 'bottom 65%', scrub: true } })
      gsap.from('.level', { autoAlpha: 0, y: 30, stagger: 0.08, scrollTrigger: { trigger: '.levels', start: 'top 85%', end: 'bottom 70%', scrub: true } })
    })
    return () => { ctx.revert(); gsap.ticker.remove(raf); l.destroy(); lenis.current = null; document.documentElement.classList.remove('motion') }
  }, [reduced])

  // ---- hero input ----
  const ndc = (e) => {
    const r = canvas.current.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]
  }
  const down = useRef(null)
  // aiming stops while the pointer is on a control, so reaching for GRAB doesn't drag the claw away
  const onMove = (e) => { if (e.pointerType === 'mouse' && !e.target.closest('button, a, summary, details, .pad')) scene.current?.pointTo(...ndc(e)) }
  const onDown = (e) => { down.current = [e.clientX, e.clientY] }
  const onUp = (e) => {
    if (e.target.closest('button, a, summary, details, .cap-1, .sticker')) return
    const d = down.current
    if (!d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 10) return
    if (e.pointerType === 'mouse') scene.current?.grab()
    else scene.current?.tapTo(...ndc(e))
  }
  const onKeyDown = (e) => {
    if (e.key.startsWith('Arrow')) { keys.current[e.key] = true; e.preventDefault() }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); scene.current?.grab() }
  }
  const onKeyUp = (e) => { keys.current[e.key] = false }
  const clearKeys = () => { for (const k in keys.current) keys.current[k] = false }

  // ---- CTA: the prize chute drops the email ----
  function pressChute() {
    if (chute !== 'idle') return
    const go = () => { window.location.href = `mailto:${me.email}?subject=${encodeURIComponent('A manual step for your next app')}` }
    if (reduced) { setChute('open'); go(); return }
    setChute('drop')
    setTimeout(() => setChute('open'), 1100)
    setTimeout(go, 1700)
  }

  const days = snapshot.days
  const best = snapshot.bestDay
  const active = days.filter((d) => d[1] > 0).length
  const tier = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 15 ? 3 : 4)

  return (
    <>
      <a className="skip-link" href="#scores">Skip to content</a>
      <audio ref={audio} src={asset('audio/ykwim.mp3')} loop preload="none" />

      <header className="bar">
        <a className="logo" href="#top" aria-label="Krishna Raju S, back to the claw machine">KRISH<span>-O-</span>MATIC</a>
        <nav aria-label="Arcade map">
          <a href="#scores">Scores</a><a href="#booth">Booth</a><a href="#levels">Levels</a><a href="#tickets">Tickets</a><a href="#github">GitHub</a><a href="#chute">Chute</a>
        </nav>
        <button className={`music ${playing ? 'is-on' : ''}`} data-music aria-pressed={music} onClick={() => setMusic(!music)}>
          <span className="eq" aria-hidden="true"><i /><i /><i /></span>
          {music ? 'Music off' : 'Music on'}
        </button>
      </header>

      <main id="top">
        {/* ============ HERO: the claw machine ============ */}
        <section className={`hero ${intro ? 'is-intro' : ''} ${rigLit ? 'is-rigged' : ''}`} aria-label="Claw machine"
          onPointerMove={onMove} onPointerDown={onDown} onPointerUp={onUp}>
          <canvas ref={canvas} className="claw-canvas" aria-hidden="true" />
          <div className="cap-1">
            <p className="eyebrow">Player 1: you · Prizes: real</p>
            <h1><span className="h1-name">Krishna Raju S</span><span className="h1-hook">Insert coin. Receive automation.</span></h1>
            <p className="lede">{me.role}. The glass box holds his nine production apps, seven awards and a handful of skills. Aim the claw, grab a capsule, and it opens.</p>
            <div className="controls">
              <div className="pad" tabIndex={0} role="group" aria-label="Claw controls. Arrow keys move the claw, Space or Enter grabs."
                onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={clearKeys}>
                <span className="stick" aria-hidden="true" /><span className="pad-label">Joystick: Tab here, arrows to aim, Space to grab</span>
              </div>
              <button className="grab" onClick={() => scene.current?.grab()}>Grab</button>
            </div>
            <div className="led" aria-live="polite">
              <span className="led-k">Under the claw</span>
              <span className="led-v">{hover ? hover.title : 'Nothing yet. Aim at a capsule.'}</span>
              <span className="led-s">{status}</span>
            </div>
            <details className="catalogue">
              <summary>Can’t work a claw? Open the prize list</summary>
              <ul>
                {prizes.filter((p) => p.kind !== 'resume').map((p) => (
                  <li key={p.title}><button onClick={() => setPrize(p)}>{p.title}</button></li>
                ))}
              </ul>
            </details>
          </div>
          <div className="cap-2" aria-hidden="true">
            <p className="big">Every capsule in there is real.</p>
            <p>Now walk the arcade. High scores first.</p>
          </div>
          <button className="sticker" onClick={tapSticker} aria-label="Operator note sticker">
            <b>Operator note</b>The gold one is rigged.<br />Old players know the code: <span>↑↑↓↓…</span>
          </button>
          {intro && <button className="skip" onClick={skipIntro}>Skip intro (Esc)</button>}
        </section>

        {/* ============ HIGH SCORES ============ */}
        <section id="scores" className="scores">
          <div className="shutter" aria-hidden="true" />
          <div className="board">
            <h2 className="board-title">High scores</h2>
            <p className="board-sub">All real. All his. No cheats used. Okay, one. It’s in the claw.</p>
            <ol className="score-list">
              {numbers.map((n, i) => (
                <li className="score-row" key={n.label}>
                  <span className="rank">{RANKS[i]}</span>
                  <span className="score-val" data-value={n.value}>{String(n.value).padStart(3, '0')}</span>
                  <span className="score-what"><b>{n.unit}</b> {n.label}<em>{PUNCH[i]}</em></span>
                  <span className="initials" aria-hidden="true">KRS</span>
                </li>
              ))}
            </ol>
            <p className="score-saved">High score saved.</p>
          </div>
        </section>

        {/* ============ MEME 1 ============ */}
        <section className="meme meme-a" aria-label="Intermission">
          <div className="shutter" aria-hidden="true" />
          <p className="meme-tag">Intermission · Insert another coin</p>
          <p className="meme-setup">Monday, 9 a.m. A test plan that takes 2 hours lands on the desk.</p>
          <div className="meme-img"><img src={asset('img/pins/anya.jpg')} alt="Meme: Anya from Spy x Family pointing excitedly into a gym, captioned WE GO JIM" loading="lazy" decoding="async" width="900" height="1600" /></div>
          <p className="meme-reframe"><b>We go Python.</b> Test planning went from 2 hours to 5 minutes. Then back to the 161 kV test bay.</p>
        </section>

        {/* ============ PHOTO BOOTH ============ */}
        <section id="booth" className="booth">
          <div className="shutter" aria-hidden="true" />
          <div className="booth-head">
            <h2>Photo booth</h2>
            <p>Five jobs, one strip. Hold still. Three, two, one… flash.</p>
            <div className="booth-box" aria-hidden="true"><span>4 POSES</span><span>1 COIN</span></div>
          </div>
          <ol className="strip">
            {experience.map((x) => (
              <li className="frame" key={x.id}>
                {x.photo
                  ? <img className="frame-pic" src={x.photo} alt={x.photoAlt} loading="lazy" decoding="async" />
                  : <div className="frame-pic frame-flash" aria-hidden="true"><span>{x.company}</span></div>}
                <div className="frame-cap">
                  <p className="frame-when">{x.year} · {x.place}</p>
                  <h3>{x.role}, {x.company}</h3>
                  <p>{x.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="bonus">
            <h3 className="bonus-title">Bonus strip</h3>
            {field.map((f) => (
              <article className="bonus-card" key={f.id}>
                <h4>{f.title} <small>{f.when}</small></h4>
                <p>{f.text}</p>
                <a className="btn" href={f.link.url} target="_blank" rel="noopener noreferrer">{f.link.label} <span aria-hidden="true">↗</span></a>
                <div className="bonus-pics">
                  {f.photos.map((p) => <figure key={p.src}><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /><figcaption>{p.caption}</figcaption></figure>)}
                </div>
              </article>
            ))}
            <article className="bonus-card">
              <h4>{leadership.title}</h4>
              <p>{leadership.text}</p>
              <div className="bonus-pics three">
                {leadership.photos.map((p) => <figure key={p.src}><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /></figure>)}
              </div>
            </article>
          </div>
        </section>

        {/* ============ LEVEL SELECT (AI) ============ */}
        <section id="levels" className="levels-sec">
          <div className="shutter" aria-hidden="true" />
          <h2>Level select</h2>
          <p className="sec-sub"><b>{ai.agent.name}.</b> {ai.agent.pitch}</p>
          <ol className="levels">
            {ai.agent.versions.map((v, i) => (
              <li className={`level ${i === ai.agent.versions.length - 1 ? 'boss' : ''}`} key={v}>
                <span>LV {String(i + 1).padStart(2, '0')}</span>{v}
              </li>
            ))}
          </ol>
          <div className="combo-row">
            <article className="combo">
              <h3>{ai.rag.name}</h3>
              <p>{ai.rag.pitch}</p>
              <ol className="combo-steps">{ai.rag.steps.map((st) => <li key={st}>{st}</li>)}</ol>
              <p className="combo-x" aria-hidden="true">Combo ×{ai.rag.steps.length}</p>
            </article>
            <article className="combo">
              <h3>{ai.browser.name}</h3>
              <p>{ai.browser.pitch}</p>
              <ul className="tokens">{ai.stack.map((t) => <li key={t}>{t}</li>)}</ul>
            </article>
          </div>
          <h3 className="bonus-round">Bonus round</h3>
          <ul className="side">
            {sideProjects.map((p) => (
              <li key={p.name}>
                <h4>{p.name}</h4><p>{p.pitch}</p>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer">Play {p.name} <span aria-hidden="true">↗</span></a>}
              </li>
            ))}
          </ul>
        </section>

        {/* ============ MEME 2 ============ */}
        <section className="meme meme-b" aria-label="Intermission">
          <div className="shutter" aria-hidden="true" />
          <p className="meme-tag">Intermission · Continue? 9… 8…</p>
          <p className="meme-setup">Bühler’s Excel: 30 to 40 minutes a project. The claw machine: “Try again.”</p>
          <div className="meme-img round"><img src={asset('img/pins/jesse.jpg')} alt="Meme: Jesse Pinkman leaning out of a red car, glancing back over his shoulder" loading="lazy" decoding="async" width="1000" height="949" /></div>
          <p className="meme-reframe"><b>He didn’t try again. He built a tool.</b> Under 30 seconds, and 90% of the manual calculation errors gone.</p>
        </section>

        {/* ============ TICKET COUNTER (awards) ============ */}
        <section id="tickets" className="counter">
          <div className="shutter" aria-hidden="true" />
          <h2>Ticket counter</h2>
          <p className="sec-sub">Most people trade tickets for prizes. He skipped the tickets.</p>
          <ol className="awards">
            {awards.map((a, i) => (
              <li className="award" key={a.title} style={{ '--c': PALETTE[i % PALETTE.length] }}>
                <span className="award-no" aria-hidden="true">No. {a.year}-{String(i + 1).padStart(2, '0')}</span>
                <div className="award-body">
                  <h3>{a.title}</h3>
                  <p>{a.detail} · {a.year}</p>
                </div>
                {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" decoding="async" />}
                <span className="admit" aria-hidden="true">Admit one</span>
              </li>
            ))}
          </ol>
          <div className="counter-foot">
            <div className="rack">
              <h3>Token rack</h3>
              {Object.entries(skills).map(([g, list]) => (
                <div className="rack-row" key={g}><h4>{g}</h4><ul className="tokens">{list.map((t) => <li key={t}>{t}</li>)}</ul></div>
              ))}
            </div>
            <div className="fine">
              <h3>The small print</h3>
              <ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* ============ GITHUB TICKET WALL ============ */}
        <section id="github" className="github">
          <div className="shutter" aria-hidden="true" />
          <h2>Ticket wall</h2>
          <p className="sec-sub">One ticket per day of the last year. {active} days paid out: {snapshot.contributionsLastYear} contributions, {snapshot.commitsLastYear} commits, {snapshot.prsLastYear} pull requests. Player since {fmtDate(snapshot.joined)}.</p>
          <div className="wall" role="img" aria-label={`Contribution tickets for ${days.length} days. Best day ${fmtDate(best.date)} with ${best.contributionCount} contributions.`}>
            {days.map(([date, n]) => (
              date === best.date
                ? <span key={date} className="gh-t jackpot" title={`${date}: ${n} contributions`}><b>JACKPOT</b>{n}</span>
                : <span key={date} className={`gh-t t${tier(n)}`} title={`${date}: ${n} contribution${n === 1 ? '' : 's'}`} />
            ))}
          </div>
          <p className="jackpot-line"><b>Jackpot:</b> {fmtDate(best.date)}, {best.contributionCount} contributions in one day. The ticket printer needed a break.</p>
          <blockquote className="bio">
            {bio.split(/\r?\n/).map((l) => <span key={l}>{l}</span>)}
            <cite>His GitHub bio</cite>
          </blockquote>
          <h3 className="shelf-title">Prize shelf: public repos</h3>
          <ul className="shelf">
            {repos.map((r, i) => (
              <li key={r.name} style={{ '--c': PALETTE[i % PALETTE.length] }}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  <span className="shelf-name">{r.name}</span>
                  {r.description && <span className="shelf-desc">{r.description}</span>}
                  <span className="shelf-meta">{[r.language, r.stars ? `★ ${r.stars}` : null, r.pushedAt && `pushed ${r.pushedAt}`].filter(Boolean).join(' · ')}</span>
                </a>
              </li>
            ))}
          </ul>
          <a className="btn" href={me.github} target="_blank" rel="noopener noreferrer">The whole arcade on GitHub <span aria-hidden="true">↗</span></a>
        </section>

        {/* ============ CTA: prize chute ============ */}
        <section id="chute" className={`chute chute-${chute}`}>
          <div className="shutter" aria-hidden="true" />
          <h2>Prize chute</h2>
          <p className="sec-sub">{me.lines[1]} {me.lines[2]}</p>
          <div className="chute-machine">
            <div className="chute-window" aria-hidden="true">
              <span className="drop-cap"><i className="dc-top" /><i className="dc-bot" /></span>
              <span className="chute-email">{me.email}</span>
            </div>
            <div className="chute-actions">
              <button className="big-red" onClick={pressChute} aria-describedby="chute-note">Press for email</button>
              <p id="chute-note" className="chute-note">The chute drops his address and opens your mail app.</p>
              <p className="plain">Or plainly: <a href={`mailto:${me.email}`}>{me.email}</a></p>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <p className="continue">Continue?</p>
        <ul>
          <li><a href={me.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li><a href={me.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a href={me.resume} target="_blank" rel="noopener noreferrer">Resume (PDF)</a></li>
          <li><a href={`mailto:${me.email}`}>Email</a></li>
        </ul>
        <p className="small">{me.name} · {me.city} · Song: “YKWIM” (instrumental)</p>
      </footer>

      <dialog ref={dialog} className="prize" onClose={closePrize} aria-labelledby="prize-title" style={{ '--c': prize?.color || '#FF4D2E' }}>
        {prize && (
          <div className="prize-in">
            <div className="prize-cap" aria-hidden="true"><i className="pc-top" /><i className="pc-bot" /></div>
            <p className="prize-tag">{prize.kind === 'resume' ? 'Jackpot' : 'You won'} · {prize.tag || 'Rigged prize'}</p>
            <h2 id="prize-title">{prize.title}</h2>
            <p>{prize.text}</p>
            {prize.url
              ? <a className="btn" href={prize.url} target="_blank" rel="noopener noreferrer">{prize.cta} <span aria-hidden="true">↗</span></a>
              : prize.kind === 'app' && <p className="prize-note">No public link for this one.</p>}
            <form method="dialog"><button className="prize-close">Back to the claw</button></form>
          </div>
        )}
      </dialog>
    </>
  )
}

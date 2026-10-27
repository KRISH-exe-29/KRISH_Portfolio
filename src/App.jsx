import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  me, numbers, experience, apps, sideProjects, ai, awards, leadership, field, certifications, skills, asset,
} from './content.js'
import snapshot from './github.json'

gsap.registerPlugin(ScrollTrigger)

const REDUCE = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const FINE = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
const html = typeof document !== 'undefined' ? document.documentElement : null
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const easeOut3 = (t) => 1 - Math.pow(1 - t, 3)

// cubic-bezier(x1,y1,x2,y2) as a function of x (Newton steps on x, then y).
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const X = (t) => ((ax * t + bx) * t + cx) * t
  const dX = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const d = X(t) - x, s = dX(t)
      if (Math.abs(d) < 1e-5 || !s) break
      t = clamp(t - d / s)
    }
    return ((ay * t + by) * t + cy) * t
  }
}
const liftEase = bezier(0.5, 0, 0.15, 1)

// GitHub: snapshot first, live list when the API answers. Never blocks render.
let ghResolve
const ghDone = new Promise((r) => { ghResolve = r })

function useRepos() {
  const [state, setState] = useState({ repos: snapshot.repos, live: false })
  useEffect(() => {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 5000)
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        setState({
          live: true,
          repos: list.map((r) => ({
            name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
            sizeKB: r.size, pushedAt: (r.pushed_at || '').slice(0, 10), fork: r.fork, homepage: r.homepage, url: r.html_url,
          })),
        })
      })
      .catch(() => {})
      .finally(() => { clearTimeout(timer); ghResolve() })
    return () => { clearTimeout(timer); ctl.abort() }
  }, [])
  return state
}

/* ------------------------------------------------------------------ */
/* Hero: permit to work -> energise -> certificates wheel (mechanic B) */
/* ------------------------------------------------------------------ */

const N = 34
const STEP = 360 / N
const HOME = Array.from({ length: N }, (_, i) => { const a = i * STEP; return a > 180 ? a - 360 : a })
// slots ordered top first, then outward on both sides
const RANKED = HOME.map((_, i) => i).sort((a, b) => Math.abs(HOME[a]) - Math.abs(HOME[b]) || HOME[b] - HOME[a])
const START = RANKED.map((_, k) => (Math.ceil(k / 2) / 17) * 0.62)

function buildCerts() {
  const appUrls = new Set(apps.map((a) => a.url).filter(Boolean))
  const list = [
    ...apps.map((a) => ({
      kind: 'App', title: a.name, text: a.pitch, href: a.url || '#breaker', ext: !!a.url,
      label: a.url ? `${a.name}: ${a.pitch}` : `${a.name}: ${a.pitch} Private build, ask Krishna for a demo`,
    })),
    ...sideProjects.map((p) => ({ kind: 'Side build', title: p.name, text: p.pitch, href: p.url || '#breaker', ext: !!p.url, label: `${p.name}: ${p.pitch}` })),
    { kind: 'Document', title: 'Resume', text: 'One page. Every number on this site, in print.', href: me.resume, ext: true, label: 'Resume, PDF' },
    { kind: 'Profile', title: 'LinkedIn', text: me.role + '.', href: me.linkedin, ext: true, label: 'LinkedIn profile' },
    { kind: 'Profile', title: 'GitHub', text: 'I replace hours of work with scripts.', href: me.github, ext: true, label: 'GitHub profile' },
    ...snapshot.repos.filter((r) => !appUrls.has(r.url)).map((r) => ({
      kind: r.fork ? 'Fork' : 'Repo', title: r.name, text: r.description || r.language || '', href: r.url, ext: true, label: `Repository ${r.name}` })),
    { kind: 'Chapter', title: 'The grid', text: 'Every public repo as a substation.', href: '#grid', label: 'Jump to the GitHub grid' },
    { kind: 'Chapter', title: 'Tea break', text: 'Two intermissions. One scared transformer.', href: '#tea-1', label: 'Jump to the tea break' },
    { kind: 'Chapter', title: 'The breaker', text: 'Close it to reach Krishna.', href: '#breaker', label: 'Jump to contact' },
  ]
  return list.slice(0, N)
}
const CERTS = buildCerts()

const TASKS = [
  ['Isolation verified', 'type: Archivo'],
  ['Earths applied', 'type: Plex Mono'],
  ['Bay lights on', 'img: night sky'],
  ['Grid survey', 'api.github.com'],
  [`${N} test certificates issued`, 'cards dealt'],
]

function Transformer({ arcRef }) {
  const limbs = [110, 200, 290]
  const turns = (x) => {
    let d = ''
    for (let y = 190; y <= 262; y += 6) d += `M${x - 26} ${y}h52`
    return d
  }
  return (
    <svg className="xfmr" viewBox="0 0 400 340" aria-hidden="true">
      <g className="xf-line">
        {[0, 1, 2, 3, 4].map((i) => <path key={'l' + i} d={`M${34 + i * 5} 170v110M${346 + i * 5} 170v110`} />)}
        <path d="M30 168h30M30 282h30M340 168h30M340 282h30" />
        <rect x="60" y="150" width="280" height="150" rx="6" className="xf-tank" />
        <rect x="80" y="166" width="240" height="118" className="xf-core" />
        <path d="M80 184h240M80 266h240" />
        {limbs.map((x) => <rect key={'c' + x} x={x - 10} y="184" width="20" height="82" className="xf-limb" />)}
        {limbs.map((x) => <path key={'w' + x} d={turns(x)} className="xf-turns" />)}
        <path d="M60 300h280M90 300v18M310 300v18M80 318h40M290 318h40" />
        {[130, 200, 270].map((x) => (
          <g key={'b' + x}>
            <path d={`M${x} 150V76`} />
            {[0, 1, 2, 3, 4, 5].map((k) => <ellipse key={k} cx={x} cy={140 - k * 11} rx={11 - k} ry="3" className="xf-shed" />)}
          </g>
        ))}
        <path d="M130 76V40h38M232 40h38V20M260 20h20M264 15h12M268 10h4" />
        <circle cx="178" cy="40" r="10" className="xf-sphere" />
        <circle cx="222" cy="40" r="10" className="xf-sphere" />
      </g>
      <g className="xf-glow">
        {limbs.map((x) => <path key={'g' + x} d={turns(x)} />)}
        {[130, 200, 270].map((x) => <circle key={'t' + x} cx={x} cy="74" r="4" />)}
      </g>
      <polyline ref={arcRef} className="xf-arc" points="188,40 212,40" />
      <text x="62" y="334" className="xf-label">HV 161 kV · LV 33 kV · ONAN</text>
    </svg>
  )
}

function Hero({ onLive }) {
  const root = useRef(null)
  const stage = useRef(null)
  const cards = useRef([])
  const kv = useRef(null)
  const pct = useRef(null)
  const arc = useRef(null)
  const [phase, setPhaseState] = useState(REDUCE ? 'live' : 'permit')
  const [tasks, setTasks] = useState(() => TASKS.map(() => REDUCE))
  const S = useRef(null)
  if (!S.current) {
    S.current = {
      phase: REDUCE ? 'live' : 'permit', deal: REDUCE ? 1 : 0, lift: REDUCE ? 1 : 0, t0: 0, liftStart: 0, loadFrac: 0,
      w: 0, wt: 0, v: 0, ramp: 0, drag: null, moved: 0, want: false, powered: REDUCE, visible: true,
      cache: [], stageT: '', kvT: '', pctT: '', e: -1, arcO: 0, arcT: 0, k: 1,
    }
  }
  const actions = useRef({})

  useEffect(() => {
    const s = S.current
    const setPhase = (p) => { s.phase = p; setPhaseState(p) }
    const power = () => { if (!s.powered) { s.powered = true; html.dataset.power = 'on' } }
    const goLive = () => { setPhase('live'); power(); onLive() }
    const finish = () => {
      if (s.phase === 'live') return
      s.deal = 1; s.lift = 1
      setTasks(TASKS.map(() => true))
      goLive()
    }
    const energise = () => {
      if (s.phase === 'permit') { s.want = true; return }
      if (s.phase !== 'ready') return
      s.liftStart = performance.now()
      setPhase('energising')
      const click = new Audio(asset('audio/click.mp3'))
      click.volume = 0.5
      click.play().catch(() => {})
    }
    actions.current = { finish, energise }
    if (REDUCE) { power(); onLive(); return }

    // real loading work behind the permit
    let alive = true
    const img = new Image()
    img.src = asset('img/pins/storm.jpg')
    const jobs = [
      document.fonts.load('800 1em Archivo'),
      document.fonts.load('500 1em "IBM Plex Mono"'),
      img.decode(),
      ghDone,
    ]
    let done = 0
    jobs.forEach((p, i) => {
      Promise.race([Promise.resolve(p).catch(() => {}), new Promise((r) => setTimeout(r, 4500))]).then(() => {
        if (!alive) return
        done++
        s.loadFrac = done / jobs.length
        setTasks((t) => { const n = [...t]; n[i] = true; return n })
      })
    })

    const resize = () => {
      s.k = clamp(Math.min(window.innerWidth / 1280, window.innerHeight / 860), 0.4, 1)
    }
    resize()
    window.addEventListener('resize', resize)

    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting })
    io.observe(root.current)

    const tick = (_t, dtMs) => {
      const dt = Math.min(dtMs / 1000, 0.05)
      const now = performance.now()
      if (!s.visible && s.phase === 'live') return
      if (!s.t0) s.t0 = now
      if (s.deal < 1) {
        const target = Math.min(s.loadFrac, (now - s.t0) / 2600)
        s.deal += (target - s.deal) * (1 - Math.exp(-dt * 7))
        if (s.deal > 0.998) s.deal = 1
        const p = String(Math.round(s.deal * 100)).padStart(3, '0') + '%'
        if (p !== s.pctT && pct.current) { pct.current.textContent = p; s.pctT = p }
      } else if (s.phase === 'permit') {
        if (pct.current) pct.current.textContent = '100%'
        setTasks((t) => { const n = [...t]; n[4] = true; return n })
        setPhase('ready')
        if (s.want) energise()
      }
      if (s.phase === 'energising') {
        const raw = (now - s.liftStart) / 1900
        s.lift = Math.min(1, raw)
        if (raw > 0.53) power()
        if (raw >= 1) goLive()
      }
      const L = liftEase(s.lift)
      if (s.phase === 'live') s.ramp = Math.min(1, s.ramp + dt / 1.5)

      if (!s.drag) {
        s.wt += (-7 * s.ramp + s.v) * dt
        s.v *= Math.exp(-dt * 3.2)
      }
      s.w += (s.wt - s.w) * (1 - Math.exp(-dt * 9))
      const turn = -28 * L + s.w

      const st = `rotateX(${(12 * L).toFixed(2)}deg) scale(${(s.k * (1 + 0.14 * L)).toFixed(4)})`
      if (st !== s.stageT) { stage.current.style.transform = st; s.stageT = st }

      const R0 = 580 + 430 * L
      const P0 = 500 + 314 * L
      const S0 = 1 + 0.35 * L
      for (let k = 0; k < N; k++) {
        const el = cards.current[k]
        if (!el) continue
        const slot = RANKED[k]
        const e = easeOut3(clamp((s.deal - START[k]) / 0.38))
        let ang = HOME[slot] + 70 * (1 - e) + turn
        ang = ((ang + 540) % 360) - 180
        const dist = Math.abs(ang)
        const vis = e > 0.001 && dist < 100
        const c = s.cache[k] || (s.cache[k] = { t: '', v: null })
        if (vis !== c.v) { el.style.visibility = vis ? 'visible' : 'hidden'; c.v = vis }
        if (!vis) continue
        const t = `translate3d(0,${(P0 + 140 * (1 - e)).toFixed(1)}px,${(-dist * 0.8).toFixed(1)}px) rotateZ(${ang.toFixed(2)}deg) translate3d(0,${(-R0 * e).toFixed(1)}px,0) rotateY(${(180 * (1 - e)).toFixed(1)}deg) scale(${((0.7 + 0.3 * e) * S0).toFixed(3)})`
        if (t !== c.t) { el.style.transform = t; c.t = t }
      }

      const kvT = (161 * L).toFixed(1).padStart(5, '0')
      if (kvT !== s.kvT) { kv.current.textContent = kvT; s.kvT = kvT }
      if (Math.abs(L - s.e) > 0.002) { root.current.style.setProperty('--e', L.toFixed(3)); s.e = L }

      // arcing across the sphere gap
      const arcing = s.phase === 'energising' ? Math.random() < 0.45 : s.phase === 'live' && Math.random() < 0.004
      if (arcing) {
        let pts = '188,40'
        for (let i = 1; i < 8; i++) pts += ` ${188 + i * 3},${(40 + (Math.random() - 0.5) * 18).toFixed(1)}`
        arc.current.setAttribute('points', pts + ' 212,40')
        s.arcO = 1
      } else s.arcO *= 0.78
      const ao = s.arcO < 0.02 ? '0' : s.arcO.toFixed(2)
      if (ao !== s.arcT) { arc.current.style.opacity = ao; s.arcT = ao }
    }
    gsap.ticker.add(tick)

    // input: drag, horizontal wheel, swipe; vertical intent during the entrance energises
    const el = root.current
    const onDown = (e) => {
      if (e.button > 0 || !e.target.closest('.wheel-wrap')) return
      s.drag = { x: e.clientX, t: performance.now(), vel: 0 }
      s.moved = 0
      s.v = 0
    }
    const onMove = (e) => {
      const d = s.drag
      if (!d) return
      const now = performance.now()
      const dx = e.clientX - d.x
      const deg = (dx * 0.16) / s.k
      s.wt += deg
      s.moved += Math.abs(dx)
      d.vel = deg / Math.max((now - d.t) / 1000, 0.008)
      d.x = e.clientX
      d.t = now
    }
    const onUp = () => {
      const d = s.drag
      if (!d) return
      s.v = performance.now() - d.t > 80 ? 0 : clamp(d.vel, -240, 240)
      s.drag = null
    }
    const onClick = (e) => { if (s.moved > 6) { e.preventDefault(); e.stopPropagation(); s.moved = 0 } }
    const onWheel = (e) => {
      if (s.phase !== 'live') { energise(); return }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) s.wt -= e.deltaX * 0.08
    }
    const onTouch = () => { if (s.phase !== 'live') energise() }
    const onKey = (e) => {
      if (s.phase === 'live') return
      if (e.key === 'Escape' || e.key === 'Tab') finish()
      else if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key) && e.target === document.body) energise()
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('click', onClick, true)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      alive = false
      gsap.ticker.remove(tick)
      io.disconnect()
      window.removeEventListener('resize', resize)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('click', onClick, true)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('keydown', onKey)
    }
  }, [onLive])

  return (
    <section id="top" ref={root} className={`hero phase-${phase}`} aria-label="Krishna Raju S, 161 kV test bay" style={{ '--e': REDUCE ? 1 : 0 }}>
      <div className="hero-sky" aria-hidden="true"><img src={asset('img/pins/storm.jpg')} alt="" /></div>
      <div className="hero-sld" aria-hidden="true" />
      <div className="wheel-wrap" role="group" aria-label="Test certificates: apps, repos and links">
        <div className="wheel-stage" ref={stage}>
          {CERTS.map((c, k) => (
            <a
              key={c.title + k}
              ref={(el) => { cards.current[k] = el }}
              className="cert"
              href={c.href}
              aria-label={c.label + (c.ext ? ' (opens in a new tab)' : '')}
              {...(c.ext ? { target: '_blank', rel: 'noreferrer' } : {})}
              draggable="false"
              style={REDUCE ? undefined : { visibility: 'hidden' }}
            >
              <span className="cert-face cert-front">
                <span className="cert-top"><span>CERT {String(k + 1).padStart(2, '0')}/{N}</span><span>{c.kind}</span></span>
                <strong>{c.title}</strong>
                <span className="cert-text">{c.text}</span>
                <span className="cert-pass">PASS</span>
              </span>
              <span className="cert-face cert-back" aria-hidden="true">KR</span>
            </a>
          ))}
        </div>
      </div>
      <Transformer arcRef={arc} />
      <div className="hero-cloud" aria-hidden="true" />

      <div className="danger" aria-hidden="true">
        <span className="danger-top">⚠ Danger</span>
        <span className="danger-kv">161 kV</span>
        <span className="danger-foot">Test bay. Keep clear while energised.</span>
      </div>

      <div className="hero-copy">
        <p className="hero-kicker">Indo Tech Transformers · Test bay</p>
        <h1 className="busbar">
          <span className="busbar-off">Krishna Raju S</span>
          <span className="busbar-on" aria-hidden="true">Krishna Raju S</span>
        </h1>
        <p className="hero-sub">{experience[4].short}.</p>
      </div>

      <div className="kv">
        <span className="kv-lamp" />
        <span className="kv-state">{phase === 'live' ? 'Energised' : phase === 'energising' ? 'Ramping' : 'De-energised'}</span>
        <span className="kv-val"><span ref={kv}>{REDUCE ? '161.0' : '000.0'}</span><small>kV</small></span>
      </div>

      {phase !== 'live' && (
        <div className="permit" role="region" aria-label="Permit to work">
          <div className="permit-head"><span>Permit to work</span><span ref={pct}>000%</span></div>
          <ol>
            {TASKS.map(([t, hint], i) => (
              <li key={t} className={tasks[i] ? 'ok' : ''}>
                <span className="box" aria-hidden="true">{tasks[i] ? '✓' : ''}</span>
                <span>{t}</span>
                <small>{hint}</small>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="energise"
            onClick={() => actions.current.energise()}
            aria-disabled={phase === 'permit'}
          >
            <span className="energise-lever" aria-hidden="true"><span /></span>
            <span>{phase === 'permit' ? 'Permit pending…' : phase === 'energising' ? 'Energising' : 'Energise the bay'}</span>
          </button>
        </div>
      )}
      {phase !== 'live' && (
        <button type="button" className="skip" onClick={() => actions.current.finish()}>Skip to energised</button>
      )}
    </section>
  )
}

/* -------------------------- small pieces ------------------------- */

const PUNS = [
  'Low resistance to change', 'High resistance to manual work', 'Fault found: spreadsheets', 'Fault cleared',
  'Turns ratio 1:∞', 'One engineer, endless output', '9 apps in production', '128 tests guarding dispatch',
  '30 min → 30 s', '2 h → 5 min', 'Rank 7 of 1500+',
]

function Ticker() {
  const row = PUNS.map((p) => <span key={p}>{p}<i aria-hidden="true">⚡</i></span>)
  return (
    <div className="ticker" aria-label={PUNS.join('. ')}>
      <div className="ticker-track" aria-hidden="true">{row}{row}</div>
    </div>
  )
}

function LiveSpot({ fact }) {
  const [open, setOpen] = useState(false)
  const [spark, setSpark] = useState(0)
  const zap = () => { setOpen(true); setSpark((n) => n + 1) }
  return (
    <span className={`live ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="live-btn"
        aria-expanded={open}
        aria-label="Live part. Touch it to reveal a fact"
        onPointerEnter={zap}
        onFocus={zap}
        onClick={zap}
      >
        <span aria-hidden="true">⚡</span>
        {spark > 0 && <svg key={spark} className="spark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 20 6 4M20 20l16-12M20 20 4 30M20 20l14 16M20 20V2" /></svg>}
      </button>
      {open && <span className="live-fact" role="status">{fact}</span>}
    </span>
  )
}

function Photo({ src, alt, className = '', caption }) {
  return (
    <figure className={`photo plx ${className}`}>
      <div className="photo-frame"><img src={src} alt={alt} loading="lazy" decoding="async" /></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

function Chapter({ no, id, test, kind, title, lede, children, verdict }) {
  return (
    <section id={id} className={`ch ch-${id}`} aria-labelledby={id + '-h'} tabIndex={-1}>
      <div className="ch-band" aria-hidden="true" />
      <header className="ch-head">
        <p className="ch-meta"><span>Test {no} / 06</span><span>{kind}</span><span>IEC 60076</span></p>
        <p className="ch-test mask"><span>{test}</span></p>
        <h2 id={id + '-h'} className="ch-title mask"><span>{title}</span></h2>
        {lede && <p className="ch-lede rise">{lede}</p>}
      </header>
      {children}
      {verdict && <p className="verdict rise"><b>Result: PASS</b><span>{verdict}</span></p>}
    </section>
  )
}

function tracePath() {
  const shapes = [
    (y) => 30 + 14 * Math.sin((y / 100) * Math.PI * 8),
    (y) => 30 + (Math.floor((y / 100) * 8) % 2 ? 12 : -12),
    (y) => 30 + 2.5 * Math.sin((y / 100) * Math.PI * 34),
    (y) => 30 + 18 * Math.exp((-y / 100) * 3) * Math.sin((y / 100) * Math.PI * 14),
    (y) => (y < 15 ? 30 : 30 + 32 * (Math.exp(-(y - 15) / 22) - Math.exp(-(y - 15) / 1.6))),
    (y) => 30 + (y / 100) * 22 * Math.sin((y / 100) * Math.PI * 12),
  ]
  let d = 'M30 0'
  shapes.forEach((f, c) => { for (let y = 0; y <= 100; y += 1) d += ` L${f(y).toFixed(1)} ${c * 100 + y}` })
  return d
}
const TRACE = tracePath()

function Intermission({ id, no, setup, children, reframe, sub }) {
  return (
    <section id={id} className="tea" aria-label={`Intermission ${no}: tea break at the test bay`} tabIndex={-1}>
      <div className="tea-in">
        <p className="tea-kicker"><span>Intermission 0{no}</span><span>Tea break at the test bay</span></p>
        <p className="tea-setup">{setup.split(' ').map((w, i) => <span key={i}>{w} </span>)}</p>
        <div className="tea-meme">{children}</div>
        <p className="tea-reframe">{reframe}</p>
        {sub && <p className="tea-sub">{sub}</p>}
      </div>
    </section>
  )
}

/* ------------------------------ grid ----------------------------- */

const DAYS = snapshot.days
const PEAK = DAYS.findIndex(([d]) => d === snapshot.bestDay.date)
const MAXC = Math.max(...DAYS.map(([, c]) => c), 1)
const fmtKB = (kb) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`)

function Grid({ repos, live }) {
  const sec = useRef(null)
  const flow = useRef(null)
  const dateEl = useRef(null)
  const countEl = useRef(null)
  const cursor = useRef(null)
  const [sel, setSel] = useState(0)
  const list = repos.filter((r) => r.pushedAt).sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)).slice(0, 24)
  const n = list.length
  const slot = 1100 / Math.max(n, 1)
  const maxLog = Math.log10(Math.max(...list.map((r) => r.sizeKB), 10) + 1)
  const ref = Date.parse(snapshot.snapshotAt) || 0
  const curve = DAYS.map(([, c], i) => `${i},${(60 - (c / MAXC) * 56).toFixed(1)}`).join(' ')
  const r = list[Math.min(sel, n - 1)]

  useEffect(() => {
    const s = { idx: REDUCE ? PEAK : 0, off: 0, on: false, peak: null }
    const write = () => {
      const [d, c] = DAYS[s.idx]
      dateEl.current.textContent = d
      countEl.current.textContent = String(c).padStart(2, '0')
      cursor.current.style.transform = `translateX(${((s.idx / (DAYS.length - 1)) * 100).toFixed(2)}%)`
      const pk = Math.abs(s.idx - PEAK) <= 2
      if (pk !== s.peak) { sec.current.classList.toggle('is-peak', pk); s.peak = pk }
    }
    write()
    if (REDUCE) return
    const st = ScrollTrigger.create({
      trigger: sec.current, start: 'top 70%', end: 'bottom 30%', scrub: true,
      onUpdate: (self) => { const i = Math.round(self.progress * (DAYS.length - 1)); if (i !== s.idx) { s.idx = i; write() } },
      onToggle: (self) => { s.on = self.isActive },
    })
    const tick = (_t, dt) => {
      if (!s.on) return
      s.off -= (dt / 1000) * (10 + DAYS[s.idx][1] * 3)
      flow.current.style.strokeDashoffset = s.off.toFixed(1)
    }
    gsap.ticker.add(tick)
    return () => { st.kill(); gsap.ticker.remove(tick) }
  }, [])

  return (
    <section id="grid" ref={sec} className="grid" aria-labelledby="grid-h" tabIndex={-1}>
      <header className="grid-head">
        <p className="ch-meta"><span>Off the bay</span><span>Single-line diagram</span><span>{live ? 'Live from api.github.com' : `Snapshot ${snapshot.snapshotAt.slice(0, 10)}`}</span></p>
        <h2 id="grid-h" className="ch-title mask"><span>The grid</span></h2>
        <p className="ch-lede rise">Every public repo is a substation. Height is size on a log scale, lit windows are recent pushes, a beacon on the roof is a star. Scroll to run a year of contributions through the busbar.</p>
        <blockquote className="bio rise">
          <p>I replace hours of work with scripts.<br />Then pretend it was “team effort” <span aria-label="smirk">😏</span></p>
          <cite>github.com/{snapshot.login}</cite>
        </blockquote>
      </header>

      <div className="city-wrap">
        <div className="city-scroll">
          <svg className="city" viewBox="0 0 1200 560" role="group" aria-label={`${n} repositories on a single-line diagram`}>
            <defs>
              <pattern id="win" width="8" height="11" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="4" height="6" /></pattern>
            </defs>
            <g className="city-stars" aria-hidden="true">
              {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 263) % 1200} cy={(i * 97) % 60 + 6} r={i % 3 ? 0.8 : 1.4} />)}
            </g>
            <g ref={flow} className="flow" aria-hidden="true">
              <path d={`M40 74H1160`} className="bus" />
              {list.map((_, i) => {
                const x = 50 + slot * (i + 0.5)
                return <path key={i} d={`M${x} 74V96M${x} 108V122M${x} 146V160`} />
              })}
            </g>
            <text x="40" y="62" className="city-label">BUS A · {snapshot.contributionsLastYear} contributions / 367 days</text>
            {list.map((repo, i) => {
              const x = 50 + slot * (i + 0.5)
              const h = 40 + (Math.log10(repo.sizeKB + 1) / maxLog) * 300
              const w = Math.min(slot * 0.62, 46)
              const top = 500 - h
              const days = (ref - Date.parse(repo.pushedAt)) / 864e5
              const lit = clamp(1 - days / 200, 0.12, 1)
              const chars = Math.max(4, Math.floor((h - 12) / 6.2))
              const label = repo.name.length > chars ? repo.name.slice(0, chars - 1) + '…' : repo.name
              return (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`bldg ${i === sel ? 'is-sel' : ''} ${repo.fork ? 'is-fork' : ''}`}
                  aria-label={`${repo.name}, ${repo.language || 'no language'}, ${fmtKB(repo.sizeKB)}, last pushed ${repo.pushedAt}${repo.stars ? `, ${repo.stars} stars` : ''} (opens in a new tab)`}
                  onMouseEnter={() => setSel(i)}
                  onFocus={() => setSel(i)}
                >
                  <rect x={x - 6} y="96" width="12" height="12" className="sym" />
                  <circle cx={x} cy="128" r="7" className="sym" />
                  <circle cx={x} cy="139" r="7" className="sym" />
                  <path d={`M${x} 160V${top}`} className="drop" />
                  <rect x={x - w / 2} y={top} width={w} height={h} className="bldg-body" />
                  <rect x={x - w / 2 + 3} y={top + 6} width={w - 6} height={h - 12} fill="url(#win)" className="bldg-win" style={{ opacity: lit }} />
                  {repo.stars > 0 && <circle cx={x} cy={top - 6} r={2 + repo.stars} className="beacon" />}
                  <text transform={`translate(${x + 3} ${494}) rotate(-90)`} className="bldg-name">{label}</text>
                </a>
              )
            })}
            <path d="M20 500H1180" className="ground" />
          </svg>
        </div>
        <aside className="readout" aria-live="polite">
          <p className="readout-k">Substation</p>
          {r && (
            <>
              <p className="readout-name">{r.name}</p>
              <dl>
                <div><dt>Lang</dt><dd>{r.language || '—'}</dd></div>
                <div><dt>Size</dt><dd>{fmtKB(r.sizeKB)}</dd></div>
                <div><dt>Pushed</dt><dd>{r.pushedAt}</dd></div>
                <div><dt>Stars</dt><dd>{r.stars}</dd></div>
              </dl>
              {r.description && <p className="readout-desc">{r.description}</p>}
            </>
          )}
        </aside>
      </div>

      <div className="load">
        <div className="load-read" aria-hidden="true">
          <span>Load on <b ref={dateEl}>{DAYS[0][0]}</b></span>
          <span><b ref={countEl}>00</b> contributions</span>
          <span className="peak-tag">Peak load event · {snapshot.bestDay.date} · {snapshot.bestDay.contributionCount}</span>
        </div>
        <div className="load-track">
          <svg viewBox={`0 0 ${DAYS.length - 1} 60`} preserveAspectRatio="none" aria-hidden="true"><polyline points={curve} /></svg>
          <div ref={cursor} className="load-cursor" aria-hidden="true"><i /></div>
        </div>
        <ul className="grid-stats">
          <li><b>{snapshot.contributionsLastYear}</b> contributions in the last year</li>
          <li><b>{snapshot.commitsLastYear}</b> commits</li>
          <li><b>{snapshot.prsLastYear}</b> pull requests</li>
          <li><b>{snapshot.bestDay.contributionCount}</b> on the best day <LiveSpot fact={`On GitHub since ${snapshot.joined}. The best day so far was ${snapshot.bestDay.date}.`} /></li>
        </ul>
      </div>
    </section>
  )
}

/* ------------------------- sound + scope ------------------------- */

function Scope() {
  const audio = useRef(null)
  const canvas = useRef(null)
  const A = useRef({})
  const [on, setOn] = useState(false)

  const toggle = async () => {
    const a = audio.current
    const s = A.current
    if (!s.ctx) {
      const C = window.AudioContext || window.webkitAudioContext
      if (C) {
        s.ctx = new C()
        const src = s.ctx.createMediaElementSource(a)
        s.an = s.ctx.createAnalyser()
        s.an.fftSize = 1024
        s.buf = new Uint8Array(s.an.fftSize)
        src.connect(s.an)
        s.an.connect(s.ctx.destination)
        // transformer hum: 100 Hz (twice 50 Hz mains) plus harmonics
        s.hum = s.ctx.createGain()
        s.hum.gain.value = 0
        ;[[100, 1], [200, 0.35], [300, 0.12]].forEach(([f, g]) => {
          const o = s.ctx.createOscillator(), og = s.ctx.createGain()
          o.frequency.value = f
          og.gain.value = g
          o.connect(og).connect(s.hum)
          o.start()
        })
        s.hum.connect(s.ctx.destination)
      }
    }
    const ramp = (v, sec) => {
      if (!s.hum) return
      const t = s.ctx.currentTime
      s.hum.gain.cancelScheduledValues(t)
      s.hum.gain.setValueAtTime(s.hum.gain.value, t)
      s.hum.gain.linearRampToValueAtTime(v, t + sec)
    }
    if (a.paused) {
      try {
        await s.ctx?.resume()
        await a.play()
      } catch { return }
      setOn(true)
      html.dataset.song = 'on'
      ramp(0.018, 4)
    } else {
      a.pause()
      setOn(false)
      delete html.dataset.song
      ramp(0, 0.6)
    }
  }

  useEffect(() => {
    const c = canvas.current
    const ctx = c.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0
    const size = () => { w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    size()
    window.addEventListener('resize', size)
    let ph = 0
    const draw = (t, dt) => {
      if (document.hidden) return
      const s = A.current
      const playing = s.an && !audio.current.paused
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(61,255,154,.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x <= w; x += w / 8) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2)
      ctx.stroke()
      ctx.strokeStyle = '#3dff9a'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#3dff9a'
      ctx.shadowBlur = playing ? 8 : 4
      ctx.beginPath()
      if (playing) {
        s.an.getByteTimeDomainData(s.buf)
        const n = s.buf.length
        for (let i = 0; i < n; i += 2) {
          const x = (i / n) * w, y = h / 2 + ((s.buf[i] - 128) / 128) * h * 0.9
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        }
      } else {
        const amp = html.dataset.power === 'on' ? h * 0.28 : 0
        if (!REDUCE) ph += (dt / 1000) * 1.2
        for (let x = 0; x <= w; x += 2) {
          const y = h / 2 + Math.sin((x / w) * Math.PI * 6 - ph * Math.PI * 2) * amp
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        }
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    gsap.ticker.add(draw)
    return () => { gsap.ticker.remove(draw); window.removeEventListener('resize', size) }
  }, [])

  return (
    <div className={`scope ${on ? 'is-on' : ''}`}>
      <audio ref={audio} src={asset('audio/sun-fish.mp3')} preload="none" loop />
      <div className="scope-screen">
        <span className="scope-ch">CH1 · {on ? 'Sun Fish' : '50 Hz mains'}</span>
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <button type="button" className="scope-btn" onClick={toggle} aria-pressed={on}>
        <span aria-hidden="true">{on ? '❚❚' : '▶'}</span> {on ? 'Pause “Sun Fish”' : 'Play “Sun Fish”'}
      </button>
    </div>
  )
}

/* ----------------------- probe cursor (surprise) ----------------------- */

function Probe() {
  const el = useRef(null)
  useEffect(() => {
    if (!FINE || REDUCE) return
    html.classList.add('has-probe')
    const move = (e) => {
      el.current.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`
      const t = e.target instanceof Element ? e.target : null
      el.current.classList.toggle('is-live', !!t?.closest('.live-btn'))
      el.current.classList.toggle('is-hot', !!t?.closest('a,button'))
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => { window.removeEventListener('pointermove', move); html.classList.remove('has-probe') }
  }, [])
  if (!FINE || REDUCE) return null
  return (
    <div ref={el} className="probe" aria-hidden="true">
      <svg viewBox="0 0 40 60"><path d="M2 2 8 20h6L34 58" /><circle cx="2" cy="2" r="2" /></svg>
    </div>
  )
}

/* ------------------------------ breaker ------------------------------ */

function Breaker({ closed, onClose }) {
  const lever = useRef(null)
  useEffect(() => {
    if (!FINE || REDUCE) return
    const btn = lever.current
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' })
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' })
    const move = (e) => {
      const r = btn.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * 0.12)
      yTo((e.clientY - (r.top + r.height / 2)) * 0.12)
    }
    const leave = () => { xTo(0); yTo(0) }
    const zone = btn.parentElement
    zone.addEventListener('pointermove', move)
    zone.addEventListener('pointerleave', leave)
    return () => { zone.removeEventListener('pointermove', move); zone.removeEventListener('pointerleave', leave) }
  }, [])

  return (
    <section id="breaker" className={`cta ${closed ? 'is-closed' : ''}`} aria-labelledby="cta-h" tabIndex={-1}>
      <p className="ch-meta"><span>Final operation</span><span>Close the breaker</span><span>{closed ? 'Circuit closed' : 'Circuit open'}</span></p>
      <h2 id="cta-h" className="cta-title mask"><span>{me.lines[1]}</span></h2>
      <div className="cta-row">
        <div className="breaker-zone">
          <button ref={lever} type="button" className="breaker" aria-pressed={closed} onClick={onClose} aria-label={closed ? 'Breaker closed. Contact options are open' : 'Close the breaker to open contact options'}>
            <span className="br-plate"><span>KR-01</span><span>161 kV · 2026</span></span>
            <span className="br-slot">
              <span className="br-on">I ON</span>
              <span className="br-handle" />
              <span className="br-off">O OFF</span>
            </span>
            <span className="br-cap">{closed ? 'Closed. Line is live.' : 'Close the breaker'}</span>
          </button>
        </div>
        <div className="cta-side">
          <p className="cta-line">{closed ? 'Circuit closed. Krishna is on the line.' : me.lines[2]}</p>
          <a className="btn btn-main" href={`mailto:${me.email}`}>Email {me.email}</a>
          <ul className={`cta-links ${closed ? 'is-live' : ''}`}>
            <li><a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a></li>
            <li><a href={me.github} target="_blank" rel="noreferrer">GitHub ↗</a></li>
            <li><a href={me.resume} target="_blank" rel="noreferrer">Resume (PDF) ↗</a></li>
          </ul>
          <p className="cta-small">{me.city} · {me.role}</p>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- app -------------------------------- */

export default function App() {
  const { repos, live } = useRepos()
  const lenis = useRef(null)
  const main = useRef(null)
  const [isLive, setLive] = useState(REDUCE)
  const [closed, setClosed] = useState(false)
  const [tripped, setTripped] = useState(false)
  const [exitAsk, setExitAsk] = useState(false)
  const trip = useRef(null)
  const flags = useRef({ tripped: false, closed: false, asked: false, live: REDUCE })
  const onLive = useRef(() => {
    flags.current.live = true
    setLive(true)
    lenis.current?.start()
    ScrollTrigger.refresh()
  }).current

  // smooth scroll, locked until the bay is energised
  useEffect(() => {
    if (REDUCE) return
    const l = new Lenis({ lerp: 0.1 })
    lenis.current = l
    l.on('scroll', ScrollTrigger.update)
    const raf = (t) => l.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    if (!flags.current.live) l.stop()
    window.scrollTo(0, 0)
    return () => { gsap.ticker.remove(raf); l.destroy() }
  }, [])

  // scroll choreography
  useEffect(() => {
    if (REDUCE) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.rise').forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
      gsap.utils.toArray('.mask > span').forEach((el) => {
        gsap.from(el, { yPercent: 110, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el.parentElement, start: 'top 90%' } })
      })
      gsap.utils.toArray('.ch-band').forEach((el) => {
        gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 45%', scrub: true } })
      })
      gsap.utils.toArray('.plx .photo-frame img').forEach((el) => {
        gsap.fromTo(el, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: el.closest('figure'), start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.fromTo('.tape-in', { xPercent: -100 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.tape', start: 'top bottom', end: 'top 40%', scrub: true } })
      gsap.fromTo('.trace path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.tests', start: 'top 60%', end: 'bottom 60%', scrub: true } })
      gsap.fromTo('.impulse path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.impulse', start: 'top 85%', end: 'top 30%', scrub: true } })

      const clock = document.querySelector('.nll-clock')
      const t = { s: 1800 }
      gsap.to(t, {
        s: 30, ease: 'power2.in',
        scrollTrigger: { trigger: '.nll', start: 'top 75%', end: 'bottom 55%', scrub: true },
        onUpdate: () => { const v = Math.round(t.s); clock.textContent = `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}` },
      })
      gsap.fromTo('.heat i', { scaleX: 0 }, { scaleX: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: '.versions', start: 'top 80%', end: 'bottom 50%', scrub: true } })

      gsap.utils.toArray('.tea').forEach((sec) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: '+=130%', pin: true, scrub: 0.6 } })
        tl.from(sec.querySelectorAll('.tea-setup span'), { opacity: 0.08, y: 14, stagger: 0.05, duration: 0.4 })
          .from(sec.querySelector('.tea-meme'), { scale: 0.82, rotate: -4, opacity: 0, duration: 0.8 }, '-=0.1')
          .from(sec.querySelectorAll('.tea-meme figcaption, .tea-vs'), { y: 24, opacity: 0, stagger: 0.15, duration: 0.4 })
          .from(sec.querySelector('.tea-reframe'), { scale: 1.9, rotate: -8, opacity: 0, duration: 0.6, ease: 'back.out(2)' })
          .from(sec.querySelector('.tea-sub'), { opacity: 0, y: 12, duration: 0.3 })
          .to({}, { duration: 0.4 })
      })

      ScrollTrigger.create({
        trigger: '#breaker', start: 'top 35%',
        onEnter: () => { if (!flags.current.closed && !flags.current.tripped) { flags.current.tripped = true; setTripped(true) } },
        onLeaveBack: () => setTripped(false),
      })
    }, main)
    return () => ctx.revert()
  }, [])

  // torch beam follows the pointer while the page is tripped
  useEffect(() => {
    if (!tripped) return
    const el = trip.current
    const move = (e) => { el.style.setProperty('--x', e.clientX + 'px'); el.style.setProperty('--y', e.clientY + 'px') }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [tripped])

  // "leaving without hiring?" exit moment
  useEffect(() => {
    const out = (e) => {
      const f = flags.current
      if (e.relatedTarget || e.clientY > 0 || !f.live || f.closed || f.asked) return
      f.asked = true
      setExitAsk(true)
    }
    document.addEventListener('mouseout', out)
    return () => document.removeEventListener('mouseout', out)
  }, [])

  const jump = (e, id) => {
    const el = document.querySelector(id)
    if (!el) return
    e?.preventDefault()
    if (lenis.current) lenis.current.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) })
    else el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' })
    el.focus({ preventScroll: true })
  }

  // in-page links anywhere (cards, nav) go through Lenis
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target instanceof Element && e.target.closest('a[href^="#"]')
      if (!a || e.defaultPrevented) return
      jump(e, a.getAttribute('href'))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const close = () => {
    flags.current.closed = true
    setClosed(true)
    setTripped(false)
    setExitAsk(false)
  }

  const xp = experience
  return (
    <>
      <a className="skiplink" href="#tests">Skip to content</a>
      <header className={`top ${isLive ? 'is-live' : ''}`}>
        <a href="#top" className="mark" aria-label="Back to the top">KR<span>/</span>161<small>kV</small></a>
        <nav aria-label="Sections">
          <a href="#tests">Tests</a>
          <a href="#tea-1">Tea break</a>
          <a href="#grid">Grid</a>
          <a href="#breaker" className="nav-cta">Close the breaker</a>
        </nav>
      </header>

      <main ref={main}>
        <Hero onLive={onLive} />
        <div className="tape" aria-hidden="true"><div className="tape-in" /></div>
        <Ticker />

        <section className="plate" aria-labelledby="plate-h">
          <div className="plate-photo">
            <Photo src={me.portrait} alt="Portrait of Krishna Raju S" />
          </div>
          <div className="plate-card rise">
            <p className="plate-k"><span>Rating plate</span><span>Serial KR-2026</span></p>
            <h2 id="plate-h" className="plate-h">{me.lines[0]}</h2>
            <dl className="plate-rows">
              {numbers.map((n) => (
                <div key={n.label}><dt>{n.value}<small>{n.unit}</small></dt><dd>{n.label}</dd></div>
              ))}
            </dl>
            <p className="plate-foot">{me.role} · {me.field} · {me.city}</p>
          </div>
        </section>

        <div className="tests" id="tests" tabIndex={-1}>
          <svg className="trace" viewBox="0 0 60 600" preserveAspectRatio="none" aria-hidden="true">
            <path d={TRACE} pathLength="1" />
          </svg>
          <p className="tests-intro rise">The test sequence. Six tests a transformer must pass before it leaves the bay, and the career that passed them.</p>

          <Chapter
            no="01" id="ratio" test="Turns ratio test" kind="Routine test" title="Theory : practice"
            lede="A ratio test checks that what goes in comes out as designed. Four internships ran the same check on me: classroom in, field out."
            verdict="Turns ratio 1:∞. One engineer, endless output."
          >
            <div className="readings">
              <div className="readings-head" aria-hidden="true"><span>Year</span><span>Bay</span><span>Reading</span><span>Status</span></div>
              {xp.slice(0, 4).map((x) => (
                <article key={x.id} className="reading rise">
                  <span className="r-year">{x.year}</span>
                  <div className="r-bay"><h3>{x.company}</h3><p>{x.role} · {x.place}</p></div>
                  <p className="r-read">{x.text}{x.id === 'mettur' && <LiveSpot fact="Mettur Thermal Power Plant: 4 x 210 MW. Boiler, turbine and generator, documented on the high-voltage side." />}</p>
                  <span className="r-ok">Within tolerance</span>
                </article>
              ))}
            </div>
            <div className="ratio-photos">
              <Photo src={xp[0].photo} alt={xp[0].photoAlt} caption={`${xp[0].company}, ${xp[0].year}`} className="tall" />
              <Photo src={xp[3].photo} alt={xp[3].photoAlt} caption={`${xp[3].company}, ${xp[3].year}`} />
            </div>
            {field.map((f) => (
              <div key={f.id} className="field rise">
                <div className="field-text">
                  <p className="field-k">{f.title} · {f.when}</p>
                  <p>{f.text}</p>
                  <a className="btn" href={f.link.url} target="_blank" rel="noreferrer">{f.link.label} ↗</a>
                </div>
                {f.photos.map((p) => <Photo key={p.src} src={p.src} alt={p.alt} caption={p.caption} />)}
              </div>
            ))}
          </Chapter>

          <Chapter
            no="02" id="winding" test="Winding resistance" kind="Routine test" title="128 tests guarding dispatch"
            lede={xp[4].text}
            verdict="Low resistance to change. High resistance to manual work."
          >
            <div className="winding">
              <Photo src={xp[4].photo} alt={xp[4].photoAlt} caption={`${xp[4].role}, ${xp[4].company}`} className="tall" />
              <ol className="taps">
                {apps.map((a, i) => (
                  <li key={a.name} className="tap rise">
                    <span className="tap-no">Tap {String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{a.url ? <a href={a.url} target="_blank" rel="noreferrer">{a.name} ↗</a> : a.name}</h3>
                      <p>{a.pitch}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <p className="aside rise">Nine apps in production, 128 tests in front of dispatch, and a fastener study for the CEO. <LiveSpot fact="The fastener standardisation study covered 60+ specifications and went to the CEO." /></p>
          </Chapter>

          <Intermission
            id="tea-1" no={1}
            setup="The transformer, every time someone opened the test-plan spreadsheet:"
            reframe="2 hours → 5 minutes."
            sub="Transformer Test Planner now plans every IEC 60076 test per unit. The transformer has calmed down."
          >
            <figure className="meme">
              <img src={asset('img/pins/scared-tired.jpg')} alt="A chrome figure clutching its head against a red background, glowing eyes, looking overwhelmed" loading="lazy" decoding="async" />
              <figcaption>scared and tired.</figcaption>
            </figure>
          </Intermission>

          <Chapter
            no="03" id="insulation" test="Insulation resistance" kind="Routine test" title="Row-level security habits"
            lede="Insulation keeps current where it belongs. Row-level security keeps data where it belongs. Same instinct, different conductor."
            verdict="Leakage between roles: not tolerated."
          >
            <div className="megger rise">
              <span className="megger-val">∞</span><span className="megger-unit">MΩ</span>
              <ul>{skills.Habits.map((h) => <li key={h}>{h}</li>)}</ul>
              <LiveSpot fact="Offline-first, on purpose: KioskSentinel takes attendance that survives power cuts." />
            </div>
            <div className="terminals">
              {Object.entries(skills).filter(([k]) => k !== 'Habits').map(([k, list]) => (
                <div key={k} className="term rise">
                  <p className="term-k">{k}</p>
                  <ul>{list.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              ))}
            </div>
          </Chapter>

          <Chapter
            no="04" id="noload" test="No-load loss" kind="Routine test" title="30 minutes of waste → 30 seconds"
            lede="No-load loss is what a transformer burns while doing nothing useful. Manual paperwork is the same loss, and it shows up every single day."
            verdict="Fault found: spreadsheets. Fault cleared."
          >
            <div className="nll">
              <div className="nll-clock-wrap">
                <span className="nll-k">Loss per job</span>
                <span className="nll-clock" aria-hidden="true">{REDUCE ? '00:30' : '30:00'}</span>
                <span className="sr-only">From 30 minutes down to 30 seconds</span>
              </div>
              <div className="nll-text rise">
                <p>{xp[3].text}</p>
                <ul className="nll-list">
                  <li><b>30 min → 30 s</b> hardware documentation at Bühler</li>
                  <li><b>2 h → 5 min</b> test planning at Indo Tech</li>
                  <li><b>90%</b> of manual calculation errors removed</li>
                </ul>
              </div>
            </div>
            <ul className="sides">
              {sideProjects.map((p) => (
                <li key={p.name} className="rise">
                  <h3>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.name} ↗</a> : p.name}</h3>
                  <p>{p.pitch}</p>
                </li>
              ))}
            </ul>
          </Chapter>

          <Intermission
            id="tea-2" no={2}
            setup="Fragile things on the shop floor, ranked:"
            reframe="Ego: intact. Report: 5 minutes."
            sub="Credit, as always, goes to “team effort” 😏"
          >
            <div className="vs">
              <figure className="meme">
                <img src={asset('img/pins/ego.jpg')} alt="Close-up of a printed page with the word Ego highlighted in yellow" loading="lazy" decoding="async" />
                <figcaption>When it comes to men’s ego</figcaption>
              </figure>
              <span className="tea-vs" aria-hidden="true">vs</span>
              <figure className="meme report">
                <div className="report-card" aria-hidden="true">
                  <span className="rc-k">Test report · per unit</span>
                  <span className="rc-old">02:00:00</span>
                  <span className="rc-new">00:05:00</span>
                </div>
                <figcaption>When it comes to a 2-hour report</figcaption>
              </figure>
            </div>
          </Intermission>

          <Chapter
            no="05" id="impulse" test="Lightning impulse" kind="Dielectric test" title="Rank 7 of 1500+"
            lede="An impulse test hits the insulation with a 1.2/50 µs lightning surge and checks nothing breaks down. Competitions are the same, with judges."
            verdict="Seven shots. No breakdown."
          >
            <div className="impulse-wrap">
              <img className="impulse-sky" src={asset('img/pins/storm.jpg')} alt="" loading="lazy" decoding="async" />
              <svg className="impulse" viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true">
                <path pathLength="1" d="M0 140 L60 140 C66 140 70 18 78 16 C110 12 200 70 320 104 C420 126 520 136 600 138" />
              </svg>
              <ol className="shots">
                {awards.map((a, i) => (
                  <li key={a.title} className="shot rise">
                    <span className="shot-no">Shot {i + 1}</span>
                    <span className="shot-year">{a.year}</span>
                    <div><h3>{a.title}</h3><p>{a.detail}{a.title.startsWith('Patent') && <LiveSpot fact="Patent published in 2025: intelligent street lighting with fault detection, built on an ESP8266 with IR sensing and GPS." />}</p></div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lead">
              {awards.filter((a) => a.photo).map((a) => <Photo key={a.photo} src={a.photo} alt={a.photoAlt} caption={a.title} />)}
              <div className="lead-text rise">
                <p className="field-k">{leadership.title}</p>
                <p>{leadership.text}</p>
                <ul className="certs">{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
              {leadership.photos.map((p) => <Photo key={p.src} src={p.src} alt={p.alt} />)}
            </div>
          </Chapter>

          <Chapter
            no="06" id="heat" test="Temperature rise" kind="Type test" title="Twelve versions, heating up"
            lede={ai.agent.pitch}
            verdict="Hot spot within limits. Still climbing."
          >
            <div className="heat-wrap">
              <ol className="versions">
                {ai.agent.versions.map((v, i) => (
                  <li key={v}>
                    <span className="v-no">v{i + 1}</span>
                    <span className="v-name">{v}</span>
                    <span className="heat" aria-hidden="true"><i style={{ '--w': (i + 1) / 12 }} /></span>
                  </li>
                ))}
              </ol>
              <div className="heat-side">
                <img className="heat-img" src={asset('img/pins/beam.jpg')} alt="" loading="lazy" decoding="async" />
                <div className="rise">
                  <p className="field-k">{ai.rag.name}</p>
                  <p>{ai.rag.pitch}</p>
                  <p className="steps">{ai.rag.steps.join(' → ')}</p>
                </div>
                <div className="rise">
                  <p className="field-k">{ai.browser.name}</p>
                  <p>{ai.browser.pitch} <LiveSpot fact="Job Lens: 100 resumes in, a ranked shortlist out, and the scans never leave the device." /></p>
                </div>
                <ul className="stack rise">{ai.stack.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            </div>
          </Chapter>
        </div>

        <Grid repos={repos} live={live} />
        <Breaker closed={closed} onClose={close} />
      </main>

      <footer className="foot">
        <p className="foot-big">Tested to IEC 60076. Built at night.</p>
        <p>© {new Date().getFullYear()} {me.name}. Some images via the owner’s Pinterest boards. Soundtrack: “Sun Fish”, from the owner’s music folder. Photos are Krishna’s own.</p>
      </footer>

      <Scope />
      <Probe />

      <div ref={trip} className={`trip ${tripped ? 'is-on' : ''}`} aria-hidden={!tripped}>
        <p className="trip-msg"><b>Trip.</b> Protection operated on the last feeder. Find the breaker in the dark.</p>
        {tripped && <button type="button" className="trip-btn" onClick={() => setTripped(false)}>Lights on</button>}
      </div>

      {exitAsk && (
        <div className="exit" role="dialog" aria-label="Before you go">
          <p><b>Leaving with the breaker open?</b> That is an unsafe isolation. Close it first.</p>
          <div>
            <a className="btn btn-main" href="#breaker" onClick={() => setExitAsk(false)}>Close the breaker</a>
            <button type="button" className="btn" onClick={() => setExitAsk(false)}>Stay a bit</button>
          </div>
        </div>
      )}
    </>
  )
}

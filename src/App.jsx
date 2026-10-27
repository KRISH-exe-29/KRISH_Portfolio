import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { me, experience, apps, sideProjects, ai, awards, leadership, certifications, skills, asset, field } from './content.js'
import gh from './github.json'

gsap.registerPlugin(ScrollTrigger)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const MOTION = '(min-width: 900px) and (prefers-reduced-motion: no-preference)'
const xp = Object.fromEntries(experience.map((e) => [e.id, e]))
const pin = (n) => asset(`img/pins/${n}.jpg`)
const thumb = (n) => asset(`img/cards/${n}.jpg`)
const day = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

let lenis = null
function go(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  el.focus?.({ preventScroll: true })
}

/* ---------- reel ring maths ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t) => ((ax * t + bx) * t + cx) * t
  const sy = (t) => ((ay * t + by) * t + cy) * t
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d }
    return sy(clamp(t))
  }
}
const expandEase = bezier(0.5, 0, 0.15, 1)

// Pure pose for one panel on the inside of the ring. angle: slot angle plus spin (0 = far side).
// formation: this panel's own deal progress. scene: { radius, persp, scale }.
function reelPose(angle, formation, scene) {
  const e = easeOutCubic(clamp(formation))
  const home = 180 + wrap180(angle - 180) // 180 = the front of the ring, where the stack waits
  const a = 180 + (home - 180) * e
  const r = (a * Math.PI) / 180
  const x = scene.radius * Math.sin(r)
  const z = -scene.radius * Math.cos(r)
  return { x, y: 0, z, yaw: -home * e, scale: scene.scale, appear: e, behindCamera: z > scene.persp * 0.6, a }
}

const N = 16
const CARDS = [
  { href: '#ch1', ch: 'Ch.1', title: 'Origin', sub: 'Southern Railway', img: 'railway' },
  { href: '#ch1', ch: 'Ch.1', title: '4 × 210 MW', sub: 'Mettur Thermal' },
  { href: '#ch2', ch: 'Ch.2', title: 'Project: Phantom', sub: 'Inovate' },
  { href: '#ch2', ch: 'Ch.2', title: 'Training arc', sub: 'Bühler India', img: 'buhler' },
  { href: '#powerup', ch: 'Ch.2', title: '30 min → 30 s', sub: 'Power-up', img: 'buhler-kiosk' },
  { href: '#ch3', ch: 'Ch.3', title: 'Final form', sub: 'Indo Tech', img: 'indotech' },
  { href: '#ch3', ch: 'Ch.3', title: 'Pawn → king', sub: '9 apps', img: 'focus' },
  { href: '#ch4', ch: 'Ch.4', title: 'AI awakening', sub: '12 forms' },
  { href: '#city', ch: 'Map', title: 'Repo city', sub: `${gh.repos.length} buildings` },
  { href: '#ch5', ch: 'Ch.5', title: 'Tournament arc', sub: 'IIT Bombay', img: 'iitb' },
  { href: '#ch5', ch: 'Ch.5', title: 'Rank 7', sub: 'of 1500+', img: 'nec-top7' },
  { href: '#flashback', ch: 'Extra', title: 'Flashback', sub: '500+ students', img: 'speaking' },
  { href: '#flashback', ch: 'Extra', title: 'From scratch', sub: 'E-Cell', img: 'ecell' },
  { href: '#omake-1', ch: 'Omake', title: 'Relentless', img: 'relentless' },
  { href: '#ch1', ch: 'Vol.1', title: 'This comeback is personal', img: 'comeback' },
  { href: '#recruit', ch: 'Final', title: 'Join the party', sub: 'Recruit', img: 'portrait' },
]

function Hero({ onShown, onLanded, onDone, shown }) {
  const stage = useRef(null)
  const scene = useRef(null)
  const cards = useRef([])
  const backdrop = useRef(null)
  const digits = useRef([])
  const brand = useRef(null)
  const caption = useRef(null)
  const st = useRef(null)
  const [done, setDone] = useState(reduced)

  useEffect(() => {
    const s = (st.current = { f: reduced ? 1 : 0, ex: reduced ? 1 : 0, spin: 0, target: 0, loaded: 0, t0: performance.now(), exStart: null, skip: false, shown: reduced, done: reduced, flown: reduced })
    if (reduced) { onShown(); onLanded(); onDone() }
    const withImg = CARDS.filter((c) => c.img)
    withImg.forEach((c) => {
      const im = new Image()
      im.src = thumb(c.img)
      ;(im.decode ? im.decode() : Promise.resolve()).catch(() => {}).finally(() => { s.loaded++ })
    })

    const fly = () => {
      if (s.flown) return
      s.flown = true
      const b = brand.current
      const t = document.querySelector('#wordmark .wm-mark')
      if (!b || !t || s.skip) { onLanded(); return }
      const r0 = b.getBoundingClientRect(), r1 = t.getBoundingClientRect()
      const k = r1.height / r0.height
      b.animate([{ transform: 'none' }, { transform: `translate(${r1.left - r0.left}px, ${r1.top - r0.top}px) scale(${k})` }],
        { duration: 1000, easing: 'cubic-bezier(.5,0,.15,1)', fill: 'forwards' })
        .finished.then(() => { b.style.visibility = 'hidden'; onLanded() }).catch(() => onLanded())
    }
    const finish = () => {
      if (s.done) return
      s.done = true
      if (!s.shown) { s.shown = true; onShown() }
      if (!s.flown) { s.flown = true; onLanded() }
      setDone(true)
      onDone()
    }
    const skip = () => { s.skip = true }
    s.skipFn = skip
    const key = (e) => { if (!s.done && (e.key === 'Escape' || e.key === 'Tab')) skip() }
    window.addEventListener('keydown', key)

    // Scrambled caption, resolving as the panels arrive.
    const word = 'Loading…'
    const glyphs = 'アイウエオカキクケコサシスセソ#%&ドン'
    const scr = reduced ? 0 : setInterval(() => {
      if (!caption.current) return
      const k = Math.floor(s.f * word.length)
      caption.current.textContent = [...word].map((ch, i) => (i < k ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join('')
      if (s.done) clearInterval(scr)
    }, 70)

    // drag / swipe / sideways wheel all move a target angle that a spring follows
    let drag = null, moved = 0
    const el = stage.current
    const down = (e) => { if (!s.done) return; drag = e.clientX; moved = 0 }
    const move = (e) => { if (drag == null) return; const dx = e.clientX - drag; drag = e.clientX; moved += Math.abs(dx); s.target += dx * 0.18 }
    const up = () => { drag = null }
    const click = (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0 } }
    const wheel = (e) => { if (s.done && Math.abs(e.deltaX) > Math.abs(e.deltaY)) s.target -= e.deltaX * 0.12 }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('click', click, true)
    el.addEventListener('wheel', wheel, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(el)

    const cache = []
    let sceneCache = '', perspCache = '', last = performance.now(), raf = 0, digitCache = ''
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!s.done) {
        const frac = withImg.length ? s.loaded / withImg.length : 1
        s.f = s.skip ? 1 : Math.min((now - s.t0) / 2600, frac)
        if (s.f >= 1 && s.exStart == null) { s.exStart = now; fly() }
        if (s.exStart != null) {
          const t = (now - s.exStart) / 1900
          s.ex = s.skip ? 1 : expandEase(clamp(t))
          if (!s.shown && (s.skip || now - s.exStart > 1050)) { s.shown = true; onShown() }
          if (backdrop.current) backdrop.current.style.opacity = s.skip ? 0 : 1 - clamp((now - s.exStart) / 900)
          if (s.skip || t >= 1) finish()
        }
        const d = String(Math.floor(s.f * 100)).padStart(3, '0')
        if (d !== digitCache) {
          digitCache = d
          ;[...d].forEach((n, i) => { const col = digits.current[i]; if (col) col.style.transform = `translateY(${-n * 10}%)` })
        }
      }
      if (!visible) return
      if (!reduced && s.f >= 1) s.target += dt * 4
      const goal = s.target + (reduced ? 0 : window.scrollY * 0.05)
      s.spin += (goal - s.spin) * (1 - Math.exp(-dt * 5))
      const small = window.innerWidth < 700 ? 0.62 : 1
      const sc = { radius: lerp(460, 1800, s.ex) * small, persp: lerp(1000, 450, s.ex), scale: lerp(0.52, 2.3, s.ex) * small }
      const tilt = lerp(-22, 0, s.ex), roll = lerp(-20, 0, s.ex)
      const p = `${sc.persp.toFixed(1)}px`
      if (p !== perspCache) { perspCache = p; el.style.perspective = p }
      const sv = `rotateX(${tilt.toFixed(2)}deg) rotateZ(${roll.toFixed(2)}deg)`
      if (sv !== sceneCache) { sceneCache = sv; scene.current.style.transform = sv }
      for (let i = 0; i < N; i++) {
        const card = cards.current[i]
        if (!card) continue
        const local = clamp((s.f - (i / N) * 0.75) / 0.25)
        const pose = reelPose((i * 360) / N + s.spin, local, sc)
        const show = !pose.behindCamera && (pose.appear > 0.01 || i === N - 1)
        const tr = `translate3d(${pose.x.toFixed(1)}px,${pose.y}px,${pose.z.toFixed(1)}px) rotateY(${pose.yaw.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`
        const op = (i === N - 1 ? 1 : pose.appear).toFixed(2)
        const near = s.ex > 0.9 && Math.abs(wrap180(pose.a)) < 40
        const c = cache[i] || (cache[i] = {})
        if (c.tr !== tr) { c.tr = tr; card.style.transform = tr }
        if (c.op !== op) { c.op = op; card.style.opacity = op }
        if (c.show !== show) { c.show = show; card.style.visibility = show ? 'visible' : 'hidden' }
        if (c.near !== near) { c.near = near; card.classList.toggle('is-near', near) }
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf); clearInterval(scr); io.disconnect()
      window.removeEventListener('keydown', key)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('click', click, true)
      el.removeEventListener('wheel', wheel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const face = (i) => { const s = st.current; if (s?.done) s.target = Math.round(s.spin / 360) * 360 - (i * 360) / N }

  return (
    <section className="hero" id="top" tabIndex={-1} aria-label="Cover: Comeback Arc, volume one">
      <div className="hero-backdrop" ref={backdrop} aria-hidden="true" />
      <div className="stage" ref={stage}>
        <div className="scene" ref={scene}>
          {CARDS.map((c, i) => (
            <a key={i} href={c.href} className="card" ref={(e) => (cards.current[i] = e)} tabIndex={done ? 0 : -1} onFocus={() => face(i)}
              aria-label={`${c.ch}: ${c.title}${c.sub ? `, ${c.sub}` : ''}`} draggable="false">
              <span className="face front">
                {c.img ? <img src={thumb(c.img)} alt="" draggable="false" /> : <span className="tone-cover" />}
                <span className="cap"><em>{c.ch}</em><strong>{c.title}</strong>{c.sub && <small>{c.sub}</small>}</span>
              </span>
              <span className="face back" aria-hidden="true"><b>KR</b></span>
            </a>
          ))}
        </div>
      </div>
      <span className={`hero-jp ${shown ? 'is-in' : ''}`} aria-hidden="true">逆襲編</span>
      <div className={`hero-copy ${shown ? 'is-in' : ''}`}>
        <p className="kicker">Vol. 1 · {me.name}</p>
        <h1><span>Comeback</span> <span>Arc</span></h1>
        <p className="narr narr-hero">He didn&rsquo;t get stronger.<br />He got automated.</p>
        <p className="hero-role">{me.role}. {me.city}.</p>
        <div className="hero-cta">
          <a className="btn" href="#ch1">Read chapter 1</a>
          <a className="btn ghost" href="#recruit">Skip to recruiting</a>
        </div>
        <p className="hint" aria-hidden="true">Drag the panels ⟷</p>
      </div>
      {!done && (
        <div className="loader">
          <span className="loader-brand" ref={brand} aria-hidden="true">KR</span>
          <p className="loader-cap" ref={caption} aria-live="off">Loading…</p>
          <div className="loader-count" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className="digit"><span ref={(e) => (digits.current[i] = e)}>{'0123456789'.split('').map((n) => <i key={n}>{n}</i>)}</span></span>
            ))}
            <em>%</em>
          </div>
          <button className="skip" type="button" onClick={() => st.current?.skipFn()}>Skip intro</button>
        </div>
      )}
    </section>
  )
}

/* ---------- small pieces ---------- */
function ChapterHead({ n, title, jp, line }) {
  return (
    <header className="ch-head">
      <p className="ch-n">{n}</p>
      <h2 className="ch-title">{title}</h2>
      <span className="ch-jp" aria-hidden="true">{jp}</span>
      {line && <p className="narr">{line}</p>}
    </header>
  )
}

const Wipe = ({ text }) => (
  <div className="wipe" aria-hidden="true"><div className="wipe-lines" /><span>{text}</span></div>
)

const Ticker = ({ items }) => (
  <div className="ticker" aria-hidden="true">
    <div>{[0, 1].map((k) => <span key={k}>{items.map((t) => <b key={t}>{t}<i>✦</i></b>)}</span>)}</div>
  </div>
)

const Stat = ({ value, unit, label, sfx, prefix = '' }) => (
  <div className="stat">
    <p className="stat-v">{prefix}<b data-count={value}>{value}</b><small>{unit}</small></p>
    <p className="stat-l">{label}</p>
    <span className="sfx-pop" aria-hidden="true">{sfx}</span>
  </div>
)

function Omake({ id, n, setup, children, reframe, sub }) {
  return (
    <section className="omake" id={id} tabIndex={-1} aria-label={`Bonus page ${n}`}>
      <p className="omake-tag"><span>おまけ</span> Omake {n} · bonus page</p>
      <p className="omake-setup" data-words>{setup}</p>
      <div className="omake-body">{children}</div>
      <p className="omake-reframe"><span className="stamp">{reframe}</span></p>
      <p className="omake-sub">{sub}</p>
    </section>
  )
}

function Magnet({ as: Tag = 'a', className = '', ...props }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`
    }
    const out = () => { el.style.transform = '' }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', out)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', out) }
  }, [])
  return <Tag ref={ref} className={`magnet ${className}`} {...props} />
}

/* ---------- GitHub: the city and the scouter ---------- */
const snapshotRepos = gh.repos.filter((r) => !r.fork)
function City() {
  const [repos, setRepos] = useState(snapshotRepos)
  const [live, setLive] = useState(false)
  const [active, setActive] = useState(null)
  const root = useRef(null)
  useEffect(() => {
    const el = root.current
    el.classList.add('watch')
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const ctl = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((list) => {
        if (!Array.isArray(list)) return
        const own = list.filter((r) => !r.fork).map((r) => ({
          name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
          sizeKB: r.size, pushedAt: (r.pushed_at || '').slice(0, 10), homepage: r.homepage || null, url: r.html_url,
        }))
        if (own.length) { setRepos(own); setLive(true) }
      })
      .catch(() => {})
    return () => ctl.abort()
  }, [])

  const sorted = [...repos].sort((a, b) => a.pushedAt.localeCompare(b.pushedAt))
  const W = 1200, GROUND = 470
  const slot = (W - 220) / sorted.length
  const blds = sorted.map((r, i) => {
    const h = Math.min(400, 50 + Math.log2(r.sizeKB + 1) * 22)
    return { r, x: 20 + i * slot, w: slot * 0.82, h, y: GROUND - h }
  })
  const cur = active ?? sorted[sorted.length - 1]

  const weeks = []
  gh.days.forEach(([d, c], i) => {
    const wd = new Date(d + 'T00:00:00Z').getUTCDay()
    if (i === 0 || wd === 0) weeks.push(Array(7).fill(null))
    weeks[weeks.length - 1][wd] = [d, c]
  })
  const tone = (c) => (c === 0 ? 'var(--tone-cell)' : c < 3 ? '#f19a8c' : c < 10 ? '#e65a46' : c < 30 ? '#e5231b' : '#8f0f0a')

  return (
    <section className="city" id="city" ref={root} tabIndex={-1} aria-labelledby="city-title">
      <ChapterHead n="Map" title="Repo City" jp="街" line="Every public repo is a building. Height grows with its size, on a log scale, so nothing gets to show off." />
      <h3 id="city-title" className="sr-only">GitHub repositories as a city skyline</h3>
      <div className="city-wrap">
        <div className="city-scroll">
          <svg className="skyline" viewBox={`0 0 ${W} 560`} role="group" aria-label={`${sorted.length} repositories, oldest push on the left, newest on the right`}>
            <defs>
              <pattern id="win" width="12" height="16" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="5" height="7" fill="#efe9dc" opacity=".85" /></pattern>
              <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" fill="#0d0c0b" opacity=".55" /></pattern>
            </defs>
            <circle cx="170" cy="120" r="78" fill="#efe9dc" />
            <circle cx="170" cy="120" r="78" fill="url(#dots)" />
            {blds.map(({ r, x, w, h, y }, i) => (
              <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className="bld" style={{ '--i': i }}
                onMouseEnter={() => setActive(r)} onFocus={() => setActive(r)} aria-label={`${r.name}: ${r.language || 'no language'}, ${r.sizeKB} KB, last push ${day(r.pushedAt)}`}>
                <g className="bld-g">
                  <rect x={x} y={y} width={w} height={h} className="bld-body" />
                  <rect x={x + 4} y={y + 10} width={w - 8} height={h - 18} fill="url(#win)" />
                  {r.homepage && <circle cx={x + w / 2} cy={y - 8} r="5" className="beacon" />}
                  {r.stars > 0 && <text x={x + w / 2} y={y - (r.homepage ? 18 : 6)} textAnchor="middle" className="star">★{r.stars}</text>}
                  {cur?.name === r.name && <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} className="bld-hit" />}
                </g>
              </a>
            ))}
            <rect x="0" y={GROUND} width={W} height="90" fill="#0d0c0b" />
            <path d="M700 560 L740 492 L1200 492 L1200 560 Z" fill="#0d0c0b" stroke="#efe9dc" strokeWidth="3" />
            {[760, 800, 840, 880, 920].map((x) => <line key={x} x1={x} y1="492" x2={x} y2="462" stroke="#efe9dc" strokeWidth="3" />)}
            <line x1="740" y1="462" x2="960" y2="462" stroke="#efe9dc" strokeWidth="3" />
            <g className="rooftop-hero" aria-hidden="true">
              <path className="scarf" d="M1040 392 C1010 384 985 398 950 386 C978 404 1008 408 1040 402 Z" fill="#c8180f" />
              <circle cx="1052" cy="372" r="15" fill="#0d0c0b" stroke="#efe9dc" strokeWidth="2.5" />
              <path d="M1036 390 Q1052 382 1068 390 L1074 448 L1064 450 L1062 492 L1054 492 L1052 452 L1050 492 L1042 492 L1040 450 L1030 448 Z" fill="#0d0c0b" stroke="#efe9dc" strokeWidth="2.5" />
            </g>
            <text x="20" y="510" className="sky-label">{sorted[0]?.pushedAt.slice(0, 4)} →</text>
            <text x="690" y="530" className="sky-label" textAnchor="end">→ {sorted[sorted.length - 1]?.pushedAt.slice(0, 4)}</text>
          </svg>
        </div>
        {cur && (
          <aside className="readout" aria-live="polite">
            <p className="readout-k">Building</p>
            <p className="readout-name">{cur.name}</p>
            {cur.description && <p className="readout-d">{cur.description}</p>}
            <dl>
              <div><dt>Lang</dt><dd>{cur.language || '—'}</dd></div>
              <div><dt>Size</dt><dd>{cur.sizeKB.toLocaleString('en')} KB</dd></div>
              <div><dt>Pushed</dt><dd>{day(cur.pushedAt)}</dd></div>
              <div><dt>Stars</dt><dd>{cur.stars}</dd></div>
            </dl>
            <p className="readout-src">{live ? 'Live from GitHub just now.' : `Snapshot of ${day(gh.snapshotAt.slice(0, 10))}.`} Red beacon: it has a live site.</p>
          </aside>
        )}
      </div>

      <div className="scouter">
        <div className="lens" aria-hidden="true" />
        <div className="scouter-read">
          <p className="readout-k">Scouter · last 12 months</p>
          <p className="power">Power level <b data-count={gh.contributionsLastYear}>{gh.contributionsLastYear}</b></p>
          <p className="over">&ldquo;It&rsquo;s over&hellip; one hundred.&rdquo;</p>
          <p className="honest">Not 9000. Scouters don&rsquo;t lie: {gh.contributionsLastYear} contributions, {gh.commitsLastYear} commits, {gh.prsLastYear} pull requests. Best day: {day(gh.bestDay.date)}, {gh.bestDay.contributionCount} in one go. On GitHub since {day(gh.joined)}.</p>
        </div>
        <svg className="heat" viewBox={`0 0 ${weeks.length * 13} ${7 * 13}`} role="img" aria-label={`Contribution graph: ${gh.contributionsLastYear} contributions in the last year`}>
          {weeks.map((w, x) => w.map((cell, y) => cell && (
            <rect key={cell[0]} x={x * 13} y={y * 13} width="11" height="11" fill={tone(cell[1])}><title>{`${cell[1]} on ${day(cell[0])}`}</title></rect>
          )))}
        </svg>
        <p className="bio">From his GitHub bio: <q>{gh.bio.split('\n').join(' ')}</q></p>
      </div>
    </section>
  )
}

/* ---------- flashback (song) ---------- */
function Flashback({ analyser, playing }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (reduced) { el.style.setProperty('--bleed', 1); return }
    let scrollBleed = 0, audioBleed = 0, level = 0, raf = 0, last = performance.now(), cache = ''
    const trig = ScrollTrigger.create({ trigger: el, start: 'top 80%', end: 'center 45%', onUpdate: (t) => { scrollBleed = t.progress * 0.55 } })
    const buf = new Uint8Array(256)
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const an = analyser.current
      if (an && playing.current) {
        an.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
        const rms = Math.sqrt(sum / buf.length)
        level += (rms - level) * 0.2
        audioBleed = Math.min(1, audioBleed + dt * (0.035 + level * 0.5)) // a slow bleed that breathes with the piano
      } else level *= 0.9
      const b = Math.max(scrollBleed, audioBleed)
      const v = `${b.toFixed(3)}|${level.toFixed(3)}`
      if (v !== cache) { cache = v; el.style.setProperty('--bleed', b.toFixed(3)); el.style.setProperty('--pulse', level.toFixed(3)) }
    }
    const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(frame) })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf); trig.kill() }
  }, [analyser, playing])

  return (
    <section className="flashback" id="flashback" ref={ref} tabIndex={-1} aria-labelledby="fb-title">
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <filter id="inkbleed"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="7" /><feDisplacementMap in="SourceGraphic" scale="70" /></filter>
      </svg>
      <div className="fb-spread">
        <header className="fb-head">
          <p className="ch-n">回想 · Flashback</p>
          <h2 id="fb-title" className="ch-title">Before the arc</h2>
          <p className="fb-hint">Press <b>Play</b> up top and the piano paints this page in.</p>
        </header>
        <figure className="fb-a"><img src={leadership.photos[1].src} alt={leadership.photos[1].alt} loading="lazy" /></figure>
        <figure className="fb-b"><img src={leadership.photos[0].src} alt={leadership.photos[0].alt} loading="lazy" /></figure>
        <figure className="fb-c"><img src={awards[1].photo} alt={awards[1].photoAlt} loading="lazy" /></figure>
        <div className="fb-lines">
          <p style={{ '--at': 0.25 }}>{leadership.title}.</p>
          <p style={{ '--at': 0.45 }}>{leadership.text}</p>
          <p style={{ '--at': 0.65 }}>{awards[1].title}: {awards[1].detail}.</p>
          <p style={{ '--at': 0.85 }} className="fb-last">Every comeback has a flashback. This one has a team photo.</p>
        </div>
        <div className="ink-veil" aria-hidden="true" />
      </div>
    </section>
  )
}

/* ---------- recruit ---------- */
function Recruit() {
  const [shout, setShout] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '').trim()
    const msg = String(f.get('message') || '').trim()
    const href = `mailto:${me.email}?subject=${encodeURIComponent(`Joining the party${name ? `: ${name}` : ''}`)}&body=${encodeURIComponent(`${msg}\n\n${name}`)}`
    setShout(true)
    setTimeout(() => { window.location.href = href }, reduced ? 0 : 900)
    setTimeout(() => setShout(false), 2600)
  }
  return (
    <section className="recruit" id="recruit" tabIndex={-1} aria-labelledby="recruit-title">
      <div className="recruit-panel">
        <img className="recruit-face" src={me.portrait} alt={`${me.name}, portrait`} loading="lazy" />
        <div className="recruit-copy">
          <p className="ch-n">Party recruitment</p>
          <h2 id="recruit-title" className="ch-title">Join the party</h2>
          <p className="narr">{me.lines[1]}</p>
          <ul className="recruit-links">
            <li><Magnet href={`mailto:${me.email}`} className="btn">{me.email}</Magnet></li>
            <li><Magnet href={me.linkedin} target="_blank" rel="noreferrer" className="btn ghost">LinkedIn</Magnet></li>
            <li><Magnet href={me.github} target="_blank" rel="noreferrer" className="btn ghost">GitHub</Magnet></li>
            <li><Magnet href={me.resume} target="_blank" rel="noreferrer" className="btn ghost">Resume (PDF)</Magnet></li>
          </ul>
        </div>
      </div>
      <form className={`bubble-form ${shout ? 'is-shout' : ''}`} onSubmit={submit}>
        <p className="bubble-prompt">{me.lines[2]}</p>
        <label>Your name<input name="name" autoComplete="name" /></label>
        <label>The manual task you want gone<textarea name="message" rows="4" required /></label>
        <Magnet as="button" type="submit" className="btn shout-btn">Shout it</Magnet>
        <span className="shout-sfx" aria-hidden="true">OI!!</span>
        <p className="form-note">Opens your mail app with the message ready to send.</p>
      </form>
    </section>
  )
}

/* ---------- the book ---------- */
export default function App() {
  const [shown, setShown] = useState(reduced)
  const [landed, setLanded] = useState(reduced)
  const [entered, setEntered] = useState(reduced)
  const [playing, setPlaying] = useState(false)
  const [menu, setMenu] = useState(false)
  const [exit, setExit] = useState(false)
  const audio = useRef(null)
  const analyser = useRef(null)
  const playingRef = useRef(false)
  const turn = useRef(null)
  const limit = useRef(null)
  const enteredRef = useRef(reduced)

  // smooth scroll, every anchor eased, limit break on very fast scroll
  useEffect(() => {
    const root = document.documentElement
    let cool = 0
    const onScroll = (e) => {
      ScrollTrigger.update()
      const now = performance.now()
      if (Math.abs(e.velocity) > 70 && now > cool && enteredRef.current) {
        cool = now + 9000
        root.classList.add('limit')
        limit.current?.removeAttribute('hidden')
        setTimeout(() => { root.classList.remove('limit'); limit.current?.setAttribute('hidden', '') }, 1100)
      }
    }
    const tick = (t) => lenis?.raf(t * 1000)
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1 })
      lenis.on('scroll', onScroll)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      if (!enteredRef.current) { lenis.stop(); root.classList.add('locked') }
    }
    const click = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      if (!a || e.defaultPrevented) return
      const id = a.getAttribute('href')
      if (id.length < 2) return
      e.preventDefault()
      setMenu(false)
      go(id)
    }
    document.addEventListener('click', click)
    let warned = false
    const leave = (e) => { if (!warned && !e.relatedTarget && e.clientY <= 0 && enteredRef.current) { warned = true; setExit(true) } }
    document.addEventListener('mouseout', leave)
    return () => {
      document.removeEventListener('click', click)
      document.removeEventListener('mouseout', leave)
      gsap.ticker.remove(tick)
      lenis?.destroy()
      lenis = null
    }
  }, [])

  useEffect(() => {
    enteredRef.current = entered
    if (!entered) return
    document.documentElement.classList.remove('locked')
    lenis?.start()
    ScrollTrigger.refresh()
  }, [entered])

  // scroll choreography
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        const cs = getComputedStyle(el).clipPath
        const pts = cs && cs !== 'none' ? cs.match(/-?[\d.]+%\s-?[\d.]+%/g) : null
        const full = pts || ['0% 0%', '100% 0%', '100% 100%', '0% 100%']
        const dir = el.dataset.reveal
        const from = full.map((p) => { const [x, y] = p.split(/\s+/); return dir === 't' ? `${x} 0%` : dir === 'b' ? `${x} 100%` : dir === 'r' ? `100% ${y}` : `0% ${y}` })
        gsap.fromTo(el, { clipPath: `polygon(${from.join(',')})` }, {
          clipPath: `polygon(${full.join(',')})`, duration: 1, ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      gsap.utils.toArray('.sfx').forEach((el) => {
        gsap.fromTo(el, { scale: 2.6, rotate: -18, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.6, ease: 'back.out(3)', scrollTrigger: { trigger: el, start: 'top 80%', once: true } })
      })
      gsap.utils.toArray('[data-count]').forEach((el) => {
        const to = Number(el.dataset.count)
        const o = { v: 0 }
        el.textContent = '0'
        ScrollTrigger.create({
          trigger: el, start: 'top 85%', once: true,
          onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v) }, onComplete: () => el.closest('.stat')?.classList.add('landed') }),
        })
      })
      gsap.utils.toArray('.wipe-lines').forEach((el) => {
        gsap.fromTo(el, { xPercent: -60 }, { xPercent: 60, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.utils.toArray('[data-words]').forEach((el) => {
        el.innerHTML = el.textContent.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ')
        gsap.from(el.querySelectorAll('.w'), { yPercent: 120, autoAlpha: 0, rotate: 6, stagger: 0.07, duration: 0.6, ease: 'back.out(2)', scrollTrigger: { trigger: el, start: 'top 80%', once: true } })
      })
      gsap.utils.toArray('.stamp').forEach((el) => {
        gsap.fromTo(el, { scale: 3, autoAlpha: 0, rotate: -12 }, { scale: 1, autoAlpha: 1, rotate: -3, duration: 0.5, ease: 'power4.in', scrollTrigger: { trigger: el, start: 'top 75%', once: true } })
      })
    })
    mm.add(MOTION, () => {
      // Ch.2 power-up: thirty minutes collapse to thirty seconds
      const clock = document.querySelector('.pu-clock')
      const t = { s: 1800 }
      const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.powerup', start: 'top top', end: '+=170%', pin: true, scrub: 0.6 } })
      tl.fromTo('.pu-lines', { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 1 }, 0)
        .fromTo(t, { s: 1800 }, { s: 30, duration: 2, ease: 'power3.in', onUpdate: () => { clock.textContent = fmt(t.s) } }, 0.2)
        .fromTo('.pu-aura', { scale: 0.3, autoAlpha: 0 }, { scale: 1.2, autoAlpha: 1, duration: 2 }, 0.2)
        .fromTo('.pu-sfx', { scale: 4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'power4.in' }, 2.2)
        .fromTo('.pu-after', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 2.4)
      // Ch.4: twelve forms side by side
      const track = document.querySelector('.forms-track')
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth + 64), ease: 'none',
        scrollTrigger: { trigger: '.forms', start: 'top top', end: () => `+=${track.scrollWidth}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
      })
      // Final spread: the page turns and the reader is in the story
      document.querySelector('.spread')?.classList.add('can-turn')
      gsap.fromTo('.turn-page', { rotateY: 0 }, { rotateY: -178, ease: 'power1.inOut', scrollTrigger: { trigger: '.spread', start: 'top top', end: '+=120%', pin: true, scrub: 0.6 } })
      return () => document.querySelector('.spread')?.classList.remove('can-turn')
    })
    return () => mm.revert()
  }, [])

  const toggle = () => {
    let a = audio.current
    if (!a) {
      a = audio.current = new Audio(asset('audio/chasing-kou.mp3'))
      a.loop = true
      a.addEventListener('play', () => { playingRef.current = true; setPlaying(true) })
      a.addEventListener('pause', () => { playingRef.current = false; setPlaying(false) })
    }
    if (!a.paused) { a.pause(); return }
    try {
      if (!analyser.current) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const an = ctx.createAnalyser()
        an.fftSize = 512
        ctx.createMediaElementSource(a).connect(an)
        an.connect(ctx.destination)
        analyser.current = an
        a._ctx = ctx
      }
      a._ctx?.resume()
    } catch { /* plays without the visualiser */ }
    a.play().catch(() => {})
    if (reduced) { go('#flashback'); return }
    const fx = turn.current
    fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go')
    setTimeout(() => go('#flashback'), 450)
  }

  const nav = [['#ch1', 'Origin'], ['#ch2', 'Training'], ['#ch3', 'Final form'], ['#ch4', 'Awakening'], ['#city', 'City'], ['#ch5', 'Tournament'], ['#recruit', 'Recruit']]
  const indo = xp.indotech, buh = xp.buhler

  return (
    <>
      <a className="skiplink" href="#ch1">Skip to chapter 1</a>
      <header className={`top ${shown ? 'is-in' : ''}`}>
        <a id="wordmark" href="#top" aria-label="Back to the cover" className={landed ? 'landed' : ''}><span className="wm-mark">KR</span><small>Comeback Arc</small></a>
        <nav aria-label="Chapters" className={menu ? 'open' : ''}>
          <button type="button" className="menu-btn" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>Chapters</button>
          <ul>{nav.map(([h, l]) => <li key={h}><a href={h}>{l}</a></li>)}</ul>
        </nav>
        <button type="button" className={`play ${playing ? 'on' : ''}`} aria-pressed={playing} onClick={toggle}>
          <span className="eq" aria-hidden="true"><i /><i /><i /></span>{playing ? 'Pause flashback' : 'Play flashback'}
        </button>
        {playing && <p className="now" aria-live="polite">♪ Chasing Kou · piano cover</p>}
      </header>

      <main>
        <Hero shown={shown} onShown={() => setShown(true)} onLanded={() => setLanded(true)} onDone={() => setEntered(true)} />

        <Ticker items={['Relentless', 'Outlast them all', 'Focus', '9 apps', '128 tests', '161 kV', 'Rank 7 of 1500+', 'This comeback is personal']} />

        <section className="prologue" aria-label="Prologue">
          <p className="narr big" data-words>Every hero starts at the bottom. His started at 110 V.</p>
          <div className="speech"><p>{gh.bio.split('\n')[0]}.<br />{gh.bio.split('\n')[1]}</p><span>from his GitHub bio</span></div>
        </section>

        {/* Ch.1 */}
        <section className="chapter" id="ch1" tabIndex={-1}>
          <ChapterHead n="Chapter 1" title="Origin" jp="始まり" line="Two internships. All voltage." />
          <div className="grid">
            <figure className="panel s-8 tall cut-r" data-reveal="l">
              <img src={xp.railway.photo} alt={xp.railway.photoAlt} loading="lazy" />
              <figcaption className="box"><b>{xp.railway.year} · {xp.railway.company}, {xp.railway.place}</b>{xp.railway.text}</figcaption>
            </figure>
            <span className="sfx sfx-a" aria-hidden="true">ガタン<br />ゴトン</span>
            <div className="panel s-4 tall toned cut-l" data-reveal="t">
              <p className="mega">4 × 210 MW</p>
              <span className="sfx in-panel" aria-hidden="true">ゴゴゴ</span>
              <p className="box"><b>{xp.mettur.year} · {xp.mettur.company}</b>{xp.mettur.text}</p>
            </div>
          </div>
        </section>

        <Wipe text="次の章 · next chapter" />

        <Omake id="omake-1" n={1} setup="Waku waku: a recruiter is reading this." reframe="Hype ≠ proof. So here's proof." sub={`Anya reads minds. Yours says “is any of this real?” Every number on this page has a repo behind it: ${apps.length} apps, 128 tests, ${snapshotRepos.length} public repos.`}>
          <figure className="meme tilt-l"><img src={pin('anya')} alt="Anya Forger from Spy x Family pointing excitedly into a gym, under the caption 'We go Jim'" loading="lazy" /></figure>
          <div className="speech side"><p>Waku waku!</p><span>Anya, on seeing a recruiter scroll past the cover</span></div>
        </Omake>

        {/* Ch.2 */}
        <section className="chapter" id="ch2" tabIndex={-1}>
          <ChapterHead n="Chapter 2" title="Training arc" jp="修行編" line="Training arcs feel hard. That's how you know it's a training arc." />
          <div className="grid">
            <figure className="panel s-4 tall" data-reveal="b"><img src={pin('outlast')} alt="A man in a hooded jacket looking into fog beside the words 'feels hard'" loading="lazy" /></figure>
            <div className="panel s-8 toned2 cut-l" data-reveal="r">
              <p className="mega small">Project: Phantom</p>
              <p className="box"><b>{xp.inovate.year} · {xp.inovate.company}, {xp.inovate.place}</b>{xp.inovate.text}</p>
            </div>
            <figure className="panel s-7 cut-r" data-reveal="l">
              <img src={buh.photo} alt={buh.photoAlt} loading="lazy" />
              <figcaption className="box"><b>{buh.year} · {buh.company}, {buh.place}</b>{buh.short}.</figcaption>
            </figure>
            <figure className="panel s-5" data-reveal="t">
              <img src={field[0].photos[1].src} alt={field[0].photos[1].alt} loading="lazy" />
              <figcaption className="box">{field[0].photos[1].caption}</figcaption>
            </figure>
          </div>
        </section>

        <section className="powerup" id="powerup" tabIndex={-1} aria-label="Power-up: 30 minutes to 30 seconds">
          <div className="pu-lines" aria-hidden="true" />
          <div className="pu-aura" aria-hidden="true" />
          <div className="pu-core">
            <p className="ch-n">Power-up · Bühler India</p>
            <p className="pu-clock" aria-hidden="true">00:30</p>
            <p className="pu-title">30 minutes <span>→</span> 30 seconds</p>
            <span className="pu-sfx" aria-hidden="true">DOOON</span>
            <div className="pu-after">
              <p>A GUI tool he co-developed does the hardware documentation in under 30 seconds instead of 30 to 40 minutes. 90% of manual calculation errors: gone.</p>
              <a className="btn" href={field[0].link.url} target="_blank" rel="noreferrer">{field[0].link.label} ↗</a>
            </div>
          </div>
        </section>

        <Omake id="omake-2" n={2} setup="Me before automation. Me after." reframe="Tired ≠ weak. Tired = the bug report." sub="Every app in the next chapter started as something that made someone tired.">
          <div className="before-after">
            <figure className="meme tilt-l"><img src={pin('scared')} alt="A chrome figure clutching its head in a red glare, scared and tired" loading="lazy" /><figcaption>Before: test planning by hand, 2 hours.</figcaption></figure>
            <figure className="meme after tilt-r">
              <div className="after-panel"><span className="run">▶ RUN</span><b>5 min</b></div>
              <figcaption>After: 5 minutes. Test planning at Indo Tech, automated.</figcaption>
            </figure>
          </div>
        </Omake>

        {/* Ch.3 */}
        <section className="chapter" id="ch3" tabIndex={-1}>
          <ChapterHead n="Chapter 3" title="Final form" jp="最終形態" line={`Power level: ${apps.length} apps in production.`} />
          <div className="grid">
            <figure className="panel s-7 tall" data-reveal="l">
              <img src={indo.photo} alt={indo.photoAlt} loading="lazy" />
              <figcaption className="box"><b>{indo.year} · {indo.company}, {indo.place}</b>{indo.short}.</figcaption>
            </figure>
            <figure className="panel s-5 tall pawn" data-reveal="r">
              <img src={pin('focus')} alt="A white pawn whose reflection in a round mirror is a king" loading="lazy" />
              <figcaption className="box">Joined as an R&amp;D intern. Now {indo.role}.</figcaption>
            </figure>
          </div>
          <div className="stats">
            <Stat value={9} unit="apps" label="in production" sfx="ドン" />
            <Stat value={128} unit="tests" label="guarding dispatch" sfx="DOOON" />
            <Stat value={161} unit="kV" label="test bay, IEC 60076 and IS 2026" sfx="ゴゴゴ" />
            <Stat value={60} prefix="" unit="+ specs" label="fastener standardisation study for the CEO" sfx="ドドド" />
          </div>
          <p className="narr wide">{indo.text}</p>
          <h3 className="sub-h">The nine techniques</h3>
          <ol className="apps">
            {apps.map((a, i) => (
              <li key={a.name} className="panel app" data-reveal={i % 2 ? 't' : 'l'}>
                <span className="app-n">{String(i + 1).padStart(2, '0')}</span>
                <p className="app-name">{a.url ? <a href={a.url} target="_blank" rel="noreferrer">{a.name} ↗</a> : a.name}</p>
                <p className="app-p">{a.pitch}</p>
              </li>
            ))}
          </ol>
          <div className="side-q">
            <p className="ch-n">Side quests</p>
            <ul>{sideProjects.map((p) => <li key={p.name}>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.name} ↗</a> : <b>{p.name}</b>} <span>{p.pitch}</span></li>)}</ul>
          </div>
        </section>

        <Wipe text="覚醒 · awakening" />

        {/* Ch.4 */}
        <section className="chapter ch4" id="ch4" tabIndex={-1}>
          <ChapterHead n="Chapter 4" title="The AI awakening" jp="覚醒" line="Then he taught the scripts to think." />
          <p className="narr wide">{ai.agent.name}: {ai.agent.pitch}</p>
        </section>
        <section className="forms" aria-label={`${ai.agent.name}: twelve forms`}>
          <ol className="forms-track">
            {ai.agent.versions.map((v, i) => (
              <li key={v} className={`form ${i === 11 ? 'last' : ''}`}>
                <span className="form-n">Form {String(i + 1).padStart(2, '0')}</span>
                <p>{v}</p>
                {i === 11 && <span className="form-sfx" aria-hidden="true">完</span>}
              </li>
            ))}
          </ol>
        </section>
        <section className="chapter ai-more">
          <div className="grid">
            <div className="panel s-7 toned2" data-reveal="l">
              <p className="box"><b>{ai.rag.name}</b>{ai.rag.pitch}</p>
              <ol className="rag">{ai.rag.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
            <div className="panel s-5" data-reveal="r">
              <p className="box"><b>{ai.browser.name}</b>{ai.browser.pitch}</p>
              <ul className="chips">{ai.stack.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        </section>

        <City />

        {/* Ch.5 */}
        <section className="chapter" id="ch5" tabIndex={-1}>
          <ChapterHead n="Chapter 5" title="Tournament arc" jp="大会編" line="1500+ colleges entered. He finished 7th." />
          <div className="grid">
            <figure className="panel s-6 tall" data-reveal="l">
              <img src={awards[4].photo} alt={awards[4].photoAlt} loading="lazy" />
              <figcaption className="box"><b>{awards[4].year} · {awards[4].title}</b>{awards[4].detail}</figcaption>
            </figure>
            <div className="panel s-6 tall rank toned" data-reveal="r">
              <Stat value={7} unit="th" label="of 1500+ colleges, National Entrepreneurship Challenge, IIT Bombay" sfx="ゴゴゴ" />
              <span className="sfx in-panel" aria-hidden="true">ドドド</span>
            </div>
          </div>
          <ol className="bracket">
            {['2024', '2025', '2026'].map((y) => (
              <li key={y}>
                <p className="round">Round {y}</p>
                <ul>{awards.filter((a) => a.year === y).map((a) => <li key={a.title} className="panel" data-reveal="t"><b>{a.title}</b><span>{a.detail}</span></li>)}</ul>
              </li>
            ))}
          </ol>
        </section>

        <Flashback analyser={analyser} playing={playingRef} />

        <Ticker items={['Outlast them all', 'Relentless', 'Results over resumes', 'Focus', 'Send it over']} />

        {/* Final spread */}
        <section className="spread" id="rival" aria-label="Final spread">
          <div className="book">
            <div className="pg pg-l">
              <p className="ch-n">Hero stat sheet</p>
              <h2 className="ch-title sm">{me.name}</h2>
              <dl className="sheet">
                {Object.entries(skills).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v.join(' · ')}</dd></div>)}
              </dl>
              <details className="certs"><summary>Licences and training ({certifications.length})</summary><ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul></details>
            </div>
            <div className="pg pg-r">
              <p className="ch-n">A new rival appears…</p>
              <p className="rival-big">it&rsquo;s you.</p>
              <div className="rival-card">
                <span className="rival-q" aria-hidden="true">?</span>
                <dl>
                  <div><dt>Name</dt><dd>You</dd></div>
                  <div><dt>Class</dt><dd>Recruiter, or a very thorough designer</dd></div>
                  <div><dt>Special move</dt><dd>Read all five chapters</dd></div>
                  <div><dt>Weakness</dt><dd>Manual steps nobody automated yet</dd></div>
                </dl>
              </div>
              <a className="btn" href="#recruit">Turn rival into teammate →</a>
            </div>
            <div className="turn-page" aria-hidden="true">
              <div className="tp-front"><p>To be continued…?</p><span>Keep scrolling to turn the page</span></div>
              <div className="tp-back" />
            </div>
          </div>
        </section>

        <Recruit />
      </main>

      <footer className="foot">
        <p className="foot-big">{me.lines[3]}</p>
        <p>{me.name} · {me.field} · {me.city}</p>
        <p>Song: &ldquo;Drowning Love (Kou wo OiKakete): Chasing Kou&rdquo;, piano cover. Some images via the owner&rsquo;s Pinterest boards. Memes belong to their makers.</p>
        <p><a href="#top">Back to the cover ↑</a></p>
      </footer>

      <div className="page-turn-fx" ref={turn} aria-hidden="true" />
      <div className="limit-fx" ref={limit} hidden aria-hidden="true">
        <svg viewBox="0 0 400 300" preserveAspectRatio="none"><path d="M30 60c40-30 60 10 90-20s70 20 50 60 40 40 10 70-70-10-90 20-60-20-60-60 30-40 0-70z" /><path d="M300 200c30-20 50 0 60 30s-20 50-50 40-40-50-10-70z" /><circle cx="330" cy="70" r="18" /><circle cx="80" cy="250" r="12" /></svg>
        <p>LIMIT BREAK!!<small>Scroll speed: it&rsquo;s over 9000.</small></p>
      </div>
      {exit && (
        <div className="exit" role="dialog" aria-label="Before you go">
          <p><b>Leaving mid-arc?</b> Plot twist: you&rsquo;re in the final chapter.</p>
          <a className="btn" href="#rival" onClick={() => setExit(false)}>Show me</a>
          <button type="button" className="btn ghost" onClick={() => setExit(false)}>Close</button>
        </div>
      )}
    </>
  )
}

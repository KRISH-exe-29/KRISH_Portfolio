import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  me, numbers, experience, apps, sideProjects, ai, awards, leadership, field, certifications, skills, asset,
} from './content.js'
import gh from './github.json'

gsap.registerPlugin(ScrollTrigger)

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const audio = { beat: 0, analyser: null, data: null, playing: false }
let lenis = null

/* ---------- the deck ---------- */
const SUITS = {
  eng: { g: '⚡', name: 'Engineering', red: true },
  code: { g: '⌘', name: 'Code' },
  ai: { g: '✦', name: 'AI' },
  award: { g: '♛', name: 'Awards', red: true },
}
const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
const first = (s) => s.split(/[.:]\s/)[0].replace(/\.$/, '')
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function buildDeck() {
  const appUrls = new Set(apps.map((a) => a.url))
  const q = {
    code: [
      ...apps.map((a) => ({ title: a.name, hook: a.pitch, href: a.url || '#house' })),
      { title: sideProjects[0].name, hook: sideProjects[0].pitch, href: sideProjects[0].url },
    ],
    eng: [
      ...experience.map((e) => ({ title: e.company, hook: e.short, href: '#table' })),
      ...sideProjects.slice(1).map((p) => ({ title: p.name, hook: first(p.pitch), href: p.url || '#house' })),
    ],
    award: awards.map((a) => ({ title: a.title, hook: first(a.detail), href: '#honours' })),
    ai: [ai.agent, ai.rag, ai.browser].map((x) => ({ title: x.name, hook: first(x.pitch), href: '#house' })),
  }
  gh.repos.filter((r) => !r.fork && !appUrls.has(r.url)).slice(0, 7).forEach((r) => {
    q[/agent|rag|ai|llm|gpt/i.test(r.name) ? 'ai' : 'code'].push({
      title: r.name, hook: `${r.language || 'Code'} · pushed ${fmtDate(r.pushedAt)}`, href: r.url,
    })
  })
  const order = ['code', 'eng', 'award', 'ai']
  const deck = []
  const count = { code: 0, eng: 0, award: 0, ai: 0 }
  while (order.some((s) => q[s].length)) {
    for (const s of order) {
      const c = q[s].shift()
      if (c) deck.push({ ...c, suit: s, rank: RANKS[count[s]++ % 13] })
    }
  }
  return deck.slice(0, 34)
}
const DECK = buildDeck()
const N = DECK.length
const STEP = 360 / N
const norm = (a) => ((((a % 360) + 540) % 360) - 180)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
// deal order: top card first, then outward on both sides
const DEAL_RANK = (() => {
  const idx = DECK.map((_, i) => i).sort((a, b) => Math.abs(norm(a * STEP)) - Math.abs(norm(b * STEP)))
  const r = []
  idx.forEach((i, k) => { r[i] = k })
  return r
})()

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
    for (let i = 0; i < 8; i++) {
      const d = sx(t) - x
      const s = dx(t)
      if (Math.abs(d) < 1e-5 || Math.abs(s) < 1e-6) break
      t -= d / s
    }
    return sy(clamp01(t))
  }
}
const liftEase = bezier(0.5, 0, 0.15, 1)

function CardFace({ c }) {
  const s = SUITS[c.suit]
  return (
    <span className={`face front${s.red ? ' red' : ''}`}>
      <span className="corner tl"><b>{c.rank}</b><i>{s.g}</i></span>
      <span className="pip" aria-hidden="true">{s.g}</span>
      <span className="ct">{c.title}</span>
      <span className="ch">{c.hook}</span>
      <span className="corner br"><b>{c.rank}</b><i>{s.g}</i></span>
    </span>
  )
}
const abs = (p) => new URL(asset(p), document.baseURI).href
const ext = (href) => (href && href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})

/* ---------- hero: deal → wheel ---------- */
function Hero({ onReady }) {
  const heroRef = useRef(null)
  const stageRef = useRef(null)
  const sceneRef = useRef(null)
  const skyRef = useRef(null)
  const cloudRef = useRef(null)
  const counterRef = useRef(null)
  const cardRefs = useRef([])
  const sRef = useRef(null)
  const [ui, setUi] = useState(reduced)
  const [done, setDone] = useState(reduced)
  const [joker, setJoker] = useState(false)

  useEffect(() => {
    const TOTAL = 4
    const S = {
      t0: performance.now(), loaded: 0, deal: 0, liftStart: null, liftEnd: null, skip: reduced,
      rot: 0, target: 0, vel: 0, drag: false, lastX: 0, lastT: 0, moved: 0,
      ui: reduced, done: false, k: 1, visible: true, cache: [], vis: [], sceneT: '', counter: -1,
    }
    sRef.current = S
    ;[asset('img/pins/sky.jpg'), asset('img/pins/clouds.jpg'), me.portrait].forEach((src) => {
      const img = new Image()
      img.src = src
      img.decode().catch(() => {}).then(() => { S.loaded++ })
    })
    ;(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { S.loaded++ })

    const resize = () => { S.k = Math.min(1.1, Math.max(0.5, Math.min(innerWidth / 1150, innerHeight / 820))) }
    resize()
    addEventListener('resize', resize)
    const io = new IntersectionObserver(([e]) => { S.visible = e.isIntersecting })
    io.observe(heroRef.current)

    const stage = stageRef.current
    const down = (e) => {
      S.moved = 0
      if (!S.done || e.button > 0) return
      S.drag = true; S.vel = 0; S.lastX = e.clientX; S.lastT = performance.now()
    }
    const move = (e) => {
      if (!S.drag) return
      const now = performance.now()
      const dx = e.clientX - S.lastX
      const dtm = Math.max(0.008, (now - S.lastT) / 1000)
      const deg = (dx * 0.16) / S.k
      S.target += deg
      S.moved += Math.abs(dx)
      S.vel = S.vel * 0.6 + (deg / dtm) * 0.4
      S.lastX = e.clientX; S.lastT = now
      // backwards (against the drift), fast: the house has one more card
      if (S.vel > 380 && S.moved > 90) setJoker(true)
    }
    const up = () => {
      if (!S.drag) return
      S.drag = false
      if (performance.now() - S.lastT > 80) S.vel = 0
    }
    const wheel = (e) => { if (S.done) S.target += e.deltaY * 0.035 + e.deltaX * 0.08 }
    const clickGuard = (e) => { if (S.moved > 6) { e.preventDefault(); e.stopPropagation() } }
    const key = (e) => {
      if (!S.done && (e.key === 'Escape' || e.key === 'Tab')) S.skip = true
      if (S.done && document.activeElement && stage.contains(document.activeElement)) {
        if (e.key === 'ArrowLeft') S.target -= STEP
        if (e.key === 'ArrowRight') S.target += STEP
      }
    }
    stage.addEventListener('pointerdown', down)
    addEventListener('pointermove', move)
    addEventListener('pointerup', up)
    addEventListener('pointercancel', up)
    stage.addEventListener('wheel', wheel, { passive: true })
    stage.addEventListener('click', clickGuard, true)
    addEventListener('keydown', key)

    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (S.skip) S.deal = 1
      else S.deal = Math.max(S.deal, Math.min((now - S.t0) / 2600, S.loaded / TOTAL))
      if (S.deal >= 1 && S.liftStart == null) S.liftStart = now
      const lr = S.skip ? 1 : S.liftStart == null ? 0 : clamp01((now - S.liftStart) / 1900)
      const L = liftEase(lr)
      if (!S.ui && lr * 1.9 >= 1) { S.ui = true; setUi(true) }
      if (lr >= 1 && !S.done) {
        S.done = true; S.liftEnd = now; setUi(true); setDone(true); onReady()
      }
      const drift = reduced || !S.liftEnd ? 0 : -7 * Math.min(1, (now - S.liftEnd) / 1500)
      if (!S.drag) { S.target += (S.vel + drift) * dt; S.vel *= Math.exp(-dt * 3.2) }
      S.rot += (S.target - S.rot) * (1 - Math.exp(-dt * 9))
      if (!S.visible) return

      const pct = Math.round(S.deal * 100)
      if (pct !== S.counter) { S.counter = pct; counterRef.current.textContent = String(pct).padStart(3, '0') }

      const R = 580 + 430 * L
      const pivot = 500 + 314 * L
      const cs = 1 + 0.35 * L
      const wheelA = -28 * L + S.rot
      const st = `rotateX(${(12 * L).toFixed(2)}deg) scale(${((1 + 0.14 * L) * S.k * (1 + audio.beat * 0.03)).toFixed(4)})`
      if (st !== S.sceneT) { S.sceneT = st; sceneRef.current.style.transform = st }
      skyRef.current.style.opacity = (0.15 + 0.85 * L).toFixed(3)
      cloudRef.current.style.transform = `translate3d(0,${((1 - L) * 45).toFixed(2)}%,0)`

      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i]
        if (!el) continue
        const p = clamp01((S.deal - (DEAL_RANK[i] / N) * 0.6) / 0.4)
        const e = 1 - (1 - p) ** 3
        const ang = norm(i * STEP + wheelA + 70 * (1 - e))
        const hidden = p <= 0 || Math.abs(ang) > 100
        if (hidden !== S.vis[i]) { S.vis[i] = hidden; el.style.visibility = hidden ? 'hidden' : 'visible' }
        if (hidden) continue
        const t = `translate3d(0,${(pivot + 140 * (1 - e)).toFixed(1)}px,${(-Math.abs(ang) * 0.6).toFixed(1)}px) rotateZ(${ang.toFixed(2)}deg) translate3d(0,${(-R * e).toFixed(1)}px,0) rotateY(${(180 * (1 - e)).toFixed(1)}deg) scale(${((0.7 + 0.3 * e) * cs).toFixed(3)})`
        if (t !== S.cache[i]) { S.cache[i] = t; el.style.transform = t }
      }
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      io.disconnect()
      removeEventListener('resize', resize)
      stage.removeEventListener('pointerdown', down)
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', up)
      removeEventListener('pointercancel', up)
      stage.removeEventListener('wheel', wheel)
      stage.removeEventListener('click', clickGuard, true)
      removeEventListener('keydown', key)
    }
  }, [onReady])

  return (
    <section id="top" className={`hero${done ? ' done' : ''}`} ref={heroRef} aria-label="The deal">
      <div className="sky" ref={skyRef} aria-hidden="true" style={{ '--img': `url(${abs('img/pins/sky.jpg')})` }} />
      <div className="stage" ref={stageRef}>
        <div className="scene" ref={sceneRef}>
          {DECK.map((c, i) => (
            <a
              key={c.title + i}
              ref={(el) => { cardRefs.current[i] = el }}
              className="hcard"
              href={c.href}
              {...ext(c.href)}
              draggable="false"
              aria-label={`${c.rank} of ${SUITS[c.suit].name}: ${c.title}. ${c.hook}`}
            >
              <CardFace c={c} />
              <span className="face back" aria-hidden="true"><span className="mono">KR</span></span>
            </a>
          ))}
        </div>
      </div>
      <div className="clouds" ref={cloudRef} aria-hidden="true" style={{ '--img': `url(${abs('img/pins/clouds.jpg')})` }} />
      <div className={`hero-copy${ui ? ' in' : ''}`}>
        <p className="kicker"><span>Table 01</span> {me.name} · {me.city}</p>
        <h1>
          <span className="l1"><span>The house always wins.</span></span>
          <span className="l2"><em>Today, you&rsquo;re the house.</em></span>
        </h1>
        <p className="hero-sub">{me.role}. {N} cards on the table, every one dealt in your favour. Drag the wheel; every card is a link.</p>
      </div>
      <div className="counter" aria-hidden="true">
        <span className="counter-cap">Dealing</span>
        <span ref={counterRef}>000</span>
      </div>
      {!done && (
        <button className="skip" onClick={() => { if (sRef.current) sRef.current.skip = true }}>Skip the deal</button>
      )}
      {joker && (
        <div className="joker" role="dialog" aria-label="Bonus card">
          <a className="joker-card" href={me.resume} download>
            <span className="corner tl"><b>★</b><i>JOKER</i></span>
            <span className="joker-mono">KR</span>
            <span className="ct">The wild card</span>
            <span className="ch">You spun against the house. House rules: you get the resume.</span>
            <span className="joker-dl">Download PDF ↓</span>
          </a>
          <button className="joker-x" onClick={() => setJoker(false)} aria-label="Put the Joker back">×</button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">{joker ? 'A hidden Joker card appeared. It downloads the resume.' : ''}</p>
    </section>
  )
}

/* ---------- small pieces ---------- */
function Ticker() {
  const items = ['No bluffing', 'Every number is on GitHub', 'All in on automation', 'Odds of a manual task surviving him: 0%', '30 min → 30 s', '2 h → 5 min', '9 apps', '128 tests', 'Rank 7 of 1500+']
  const row = items.map((t, i) => <span key={i}>{t}<i aria-hidden="true">♛</i></span>)
  return (
    <div className="ticker" aria-label={items.join('. ')}>
      <div className="ticker-track" aria-hidden="true">{row}{row}</div>
    </div>
  )
}

function Curtain() {
  return <div className="curtain" aria-hidden="true" />
}

function SectionHead({ k, title, sub }) {
  return (
    <header className="shead">
      <p className="kicker">{k}</p>
      <h2>{title}</h2>
      {sub && <p className="shead-sub">{sub}</p>}
    </header>
  )
}

/* ---------- your hand ---------- */
const HAND_RANKS = ['10', 'J', 'Q', 'K', 'A']
function Hand() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray('.hc')
        const inners = gsap.utils.toArray('.hc-in')
        gsap.set(inners, { rotateY: 180 })
        gsap.set(['.flush', '.hand-glow'], { opacity: 0 })
        const tl = gsap.timeline({
          scrollTrigger: { trigger: ref.current, start: 'top top', end: '+=260%', scrub: 0.6, pin: true },
        })
        tl.from(cards, {
          y: () => -innerHeight * 0.85, x: (i) => (i - 2) * -90, rotation: (i) => (i - 2) * 30 + 8,
          opacity: 0, stagger: 0.18, duration: 1, ease: 'power3.out',
        })
          .to(inners, { rotateY: 0, stagger: 0.4, duration: 0.8, ease: 'power2.inOut' }, '+=0.15')
          .to(cards, { rotation: (i) => (i - 2) * 7, y: (i) => Math.abs(i - 2) * 16, duration: 0.8, ease: 'power2.out' })
          .fromTo('.flush', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.8 }, '<')
          .to('.hand-glow', { opacity: 1, duration: 0.8 }, '<')
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section id="hand" className="hand" ref={ref} aria-labelledby="hand-h">
      <div className="hand-glow" aria-hidden="true" />
      <header className="shead center">
        <p className="kicker">Your hand</p>
        <h2 id="hand-h">Five cards, dealt to you.</h2>
      </header>
      <div className="hand-row">
        {numbers.map((n, i) => (
          <div className="hc bounce" key={n.label}>
            <div className="hc-in">
              <div className="face front red">
                <span className="corner tl"><b>{HAND_RANKS[i]}</b><i>♛</i></span>
                <span className="hc-val">{n.value}</span>
                <span className="hc-unit">{n.unit}</span>
                <span className="hc-label">{n.label}</span>
                <span className="corner br"><b>{HAND_RANKS[i]}</b><i>♛</i></span>
              </div>
              <div className="face back" aria-hidden="true"><span className="mono">KR</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className="flush">
        <p className="flush-t">Royal flush.</p>
        <p className="flush-s">No bluffing. Every number is on GitHub.</p>
      </div>
    </section>
  )
}

/* ---------- dealer's break ---------- */
function Intermission({ n, setup, img, alt, caption, reframe, sub }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'bottom 70%', scrub: 0.5 } })
        tl.from('.im-setup span', { yPercent: 110, duration: 1, ease: 'power3.out' })
          .fromTo('.im-frame', { clipPath: 'inset(48% 48% 48% 48% round 18px)', rotation: -8 }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', rotation: -2.5, duration: 1.4, ease: 'power2.out' }, '-=0.4')
          .from('.im-cap', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
          .from('.im-reframe span', { yPercent: 110, duration: 1, ease: 'power3.out' }, '+=0.2')
          .from('.im-sub', { opacity: 0, y: 20, duration: 0.6 }, '-=0.5')
      })
    }, ref)
    return () => ctx.revert()
  }, [])
  return (
    <section className="im" ref={ref} aria-label={`Dealer's break ${n}`}>
      <p className="kicker">Dealer&rsquo;s break · {n} of 2</p>
      <p className="im-setup"><span>{setup}</span></p>
      <figure className="im-frame">
        <img src={img} alt={alt} loading="lazy" decoding="async" width="1200" height="1000" />
        <figcaption className="im-cap">{caption}</figcaption>
      </figure>
      <p className="im-reframe"><span>{reframe}</span></p>
      <p className="im-sub">{sub}</p>
    </section>
  )
}

/* ---------- hand history (experience) ---------- */
function Table() {
  const buhler = field[0]
  return (
    <section id="table" className="sec table" aria-labelledby="table-h">
      <Curtain />
      <div className="wrap">
        <div className="dealer">
          <img src={me.portrait} alt={`${me.name}, portrait`} loading="lazy" decoding="async" />
          <p>Your dealer tonight: <strong>{me.name}</strong>. {me.field}. {me.lines[0]}</p>
        </div>
        <SectionHead k="⚡ Hand history" title={<span id="table-h">Every hand he&rsquo;s played.</span>} sub="Oldest first. The stakes went up every year." />
        <ol className="history">
          {experience.map((e, i) => (
            <li key={e.id} className="hrow reveal">
              <div className="mini red bounce" aria-hidden="true">
                <b>{e.year}</b><i>⚡</i>
              </div>
              <div className="hrow-body">
                <p className="hrow-meta">{e.year} · {e.place}</p>
                <h3>{e.role}, <span>{e.company}</span></h3>
                <p>{e.text}</p>
              </div>
              {e.photo && (
                <img className={`hrow-photo r${i % 2}`} src={e.photo} alt={e.photoAlt} loading="lazy" decoding="async" />
              )}
            </li>
          ))}
        </ol>
        <div className="field reveal">
          <div>
            <p className="kicker">Replay · {buhler.when}</p>
            <h3>{buhler.title}</h3>
            <p>{buhler.text}</p>
            <a className="btn ghost" href={buhler.link.url} target="_blank" rel="noopener noreferrer">{buhler.link.label} ↗</a>
          </div>
          <div className="field-photos">
            {buhler.photos.map((p) => (
              <figure key={p.src}>
                <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- the house's picks ---------- */
function PCard({ suit, rank, title, text, href }) {
  const s = SUITS[suit]
  const inner = (
    <>
      <span className="corner tl"><b>{rank}</b><i>{s.g}</i></span>
      <span className="pc-pip" aria-hidden="true">{s.g}</span>
      <span className="ct">{title}</span>
      <span className="ch">{text}</span>
      {href && <span className="pc-go">Play ↗</span>}
    </>
  )
  const cls = `pcard reveal${s.red ? ' red' : ''}`
  return href ? <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : <div className={cls}>{inner}</div>
}

function House() {
  return (
    <section id="house" className="sec house" aria-labelledby="house-h">
      <Curtain />
      <div className="wrap">
        <SectionHead k="⌘ The house's picks" title={<span id="house-h">Nine apps. One factory. All in on automation.</span>} sub={me.lines[1]} />
        <div className="pgrid">
          {apps.map((a, i) => <PCard key={a.name} suit="code" rank={RANKS[i]} title={a.name} text={a.pitch} href={a.url} />)}
        </div>
        <h3 className="sub-h">Side bets</h3>
        <div className="pgrid small">
          {sideProjects.map((p, i) => <PCard key={p.name} suit={i ? 'eng' : 'code'} rank={RANKS[i + 9]} title={p.name} text={p.pitch} href={p.url} />)}
        </div>

        <div className="ai reveal">
          <div className="ai-copy">
            <p className="kicker">✦ The AI suit</p>
            <h3>{ai.agent.name}</h3>
            <p>{ai.agent.pitch}</p>
          </div>
          <ol className="chips" aria-label={`${ai.agent.name}: twelve versions`}>
            {ai.agent.versions.map((v, i) => (
              <li key={v} className="chip bounce" style={{ '--i': i }}>
                <span className="chip-v">v{i + 1}</span><span>{v}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="ai2">
          <div className="reveal">
            <p className="kicker">✦ {ai.rag.name}</p>
            <p>{ai.rag.pitch}</p>
            <ol className="flow">{ai.rag.steps.map((s, i) => <li key={s}><b>{i + 1}</b>{s}</li>)}</ol>
          </div>
          <div className="reveal">
            <p className="kicker">✦ {ai.browser.name}</p>
            <p>{ai.browser.pitch}</p>
          </div>
        </div>

        <div className="rules reveal">
          <h3 className="sub-h">House rules</h3>
          <dl>
            {Object.entries(skills).map(([k, list]) => (
              <div key={k}><dt>{k}</dt><dd>{list.join(' · ')}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

/* ---------- GitHub city ---------- */
function City({ repos, live }) {
  const ref = useRef(null)
  const [open, setOpen] = useState(null)
  const sel = repos.find((r) => r.name === open) || repos[0]
  useLayoutEffect(() => {
    const el = ref.current
    if (reduced) { el.style.setProperty('--fold', '1'); return }
    const st = ScrollTrigger.create({
      trigger: el, start: 'top 80%', end: 'center 50%',
      onUpdate: (s) => el.style.setProperty('--fold', s.progress.toFixed(3)),
    })
    return () => st.kill()
  }, [])
  useEffect(() => { ScrollTrigger.refresh() }, [repos.length])

  const days = gh.days
  const lead = new Date(days[0][0] + 'T00:00:00Z').getUTCDay()
  const lvl = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 8 ? 2 : n < 20 ? 3 : 4)
  const bio = gh.bio.split(/\r?\n/)

  return (
    <section id="city" className="sec city" ref={ref} aria-labelledby="city-h">
      <Curtain />
      <div className="wrap">
        <SectionHead k="⌘ GitHub, folded" title={<span id="city-h">A city built from cards.</span>} sub={`Every public repo is a building. Height is the log of its size. Tap one to flip it. ${live ? 'Live from GitHub.' : `Snapshot from ${fmtDate(gh.snapshotAt.slice(0, 10))}.`}`} />
        <div className="city-grid">
          <div className="city-stage">
            <div className="board">
              {repos.slice(0, 20).map((r, i, arr) => {
                const h = Math.round(46 + 34 * Math.log10((r.sizeKB || 0) + 10))
                const flipped = open === r.name
                const suit = /agent|rag|ai|llm|gpt/i.test(r.name) ? '✦' : '⌘'
                return (
                  <div key={r.name} className={`bld${flipped ? ' flipped' : ''}`} style={{ '--h': h, '--d': ((i / arr.length) * 0.6).toFixed(3) }}>
                    <div className="bld-in">
                      <button className="bld-front" tabIndex={flipped ? -1 : 0} aria-label={`${r.name}: ${r.language || 'no language'}, ${r.sizeKB} KB. Flip to its repo card.`} onClick={() => setOpen(r.name)}>
                        <span className="bld-suit">{suit}</span>
                        <span className="bld-win" />
                        <span className="bld-name">{r.name}</span>
                      </button>
                      <button className="bld-back" tabIndex={flipped ? 0 : -1} aria-label={`Fold ${r.name} back`} onClick={() => setOpen(null)}>
                        <b>{r.name}</b><span>★ {r.stars}</span><span>{r.language || '—'}</span>
                      </button>
                      <span className="bld-side" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {sel && (
            <aside className="slip" aria-live="polite">
              <p className="kicker">{open ? 'Flipped' : 'Most recent'}</p>
              <h3>{sel.name}</h3>
              {sel.description && <p>{sel.description}</p>}
              <dl className="slip-dl">
                <div><dt>Language</dt><dd>{sel.language || '—'}</dd></div>
                <div><dt>Stars</dt><dd>{sel.stars}</dd></div>
                <div><dt>Size</dt><dd>{sel.sizeKB.toLocaleString('en')} KB</dd></div>
                <div><dt>Pushed</dt><dd>{fmtDate(sel.pushedAt)}</dd></div>
              </dl>
              <a className="btn ghost" href={sel.url} target="_blank" rel="noopener noreferrer">Open on GitHub ↗</a>
              {sel.homepage && <a className="btn ghost" href={sel.homepage} target="_blank" rel="noopener noreferrer">Live ↗</a>}
            </aside>
          )}
        </div>

        <div className="rack reveal">
          <div className="rack-stats">
            <p><b>{gh.contributionsLastYear}</b>contributions in the last year</p>
            <p><b>{gh.commitsLastYear}</b>commits</p>
            <p><b>{gh.prsLastYear}</b>pull requests</p>
            <p><b>{gh.bestDay.contributionCount}</b>on the best day, {fmtDate(gh.bestDay.date)}</p>
          </div>
          <div className="heat" role="img" aria-label={`${gh.contributionsLastYear} contributions over the last year. Best day ${fmtDate(gh.bestDay.date)} with ${gh.bestDay.contributionCount}.`}>
            {Array.from({ length: lead }, (_, i) => <span key={'e' + i} className="h0 hollow" />)}
            {days.map(([d, n]) => <span key={d} className={`h${lvl(n)}${d === gh.bestDay.date ? ' best' : ''}`} />)}
          </div>
          <blockquote className="bio">
            {bio.map((l) => <span key={l}>{l}</span>)}
            <cite>— github.com/{gh.login}, on GitHub since {fmtDate(gh.joined)}</cite>
          </blockquote>
        </div>
      </div>
    </section>
  )
}

/* ---------- honours ---------- */
function Honours() {
  return (
    <section id="honours" className="sec honours" aria-labelledby="hon-h">
      <Curtain />
      <div className="wrap">
        <SectionHead k="♛ High rollers" title={<span id="hon-h">The trophy cabinet.</span>} sub={me.lines[3]} />
        <ol className="awards">
          {awards.map((a, i) => (
            <li key={a.title} className={`award reveal${a.photo ? ' has-photo' : ''}`}>
              <span className="award-rank" aria-hidden="true">{RANKS[i]}<i>♛</i></span>
              <div>
                <p className="hrow-meta">{a.year}</p>
                <h3>{a.title}</h3>
                <p>{a.detail}</p>
              </div>
              {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" decoding="async" />}
            </li>
          ))}
        </ol>
        <div className="lead reveal">
          <div>
            <p className="kicker">♛ {leadership.title}</p>
            <p className="lead-t">{leadership.text}</p>
          </div>
          <div className="lead-photos">
            {leadership.photos.map((p, i) => <img key={p.src} className={`lp${i}`} src={p.src} alt={p.alt} loading="lazy" decoding="async" />)}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- cash out ---------- */
const mailto = `mailto:${me.email}?subject=${encodeURIComponent('Cashing out: let’s talk')}`
function CashOut() {
  const stackRef = useRef(null)
  const potRef = useRef(null)
  const [state, setState] = useState('idle')
  useEffect(() => {
    const el = stackRef.current
    let start = null
    let moved = 0
    const cashOut = () => {
      setState('won')
      const p = potRef.current.getBoundingClientRect()
      const s = el.getBoundingClientRect()
      gsap.to(el, {
        x: `+=${p.left + p.width / 2 - (s.left + s.width / 2)}`, y: `+=${p.top + p.height / 2 - (s.top + s.height / 2)}`,
        scale: 0.6, duration: reduced ? 0 : 0.45, ease: 'power3.in',
        onComplete: () => {
          window.location.href = mailto
          gsap.to(el, { x: 0, y: 0, scale: 1, delay: 1.2, duration: 0.6, ease: 'back.out(1.6)', onComplete: () => setState('idle') })
        },
      })
    }
    const down = (e) => {
      if (e.button > 0) return
      start = { x: e.clientX, y: e.clientY }
      moved = 0
      el.setPointerCapture(e.pointerId)
      setState('drag')
    }
    const move = (e) => {
      if (!start) return
      const dx = e.clientX - start.x, dy = e.clientY - start.y
      moved = Math.hypot(dx, dy)
      gsap.set(el, { x: dx, y: dy, rotation: dx * 0.05 })
    }
    const up = (e) => {
      if (!start) return
      start = null
      const p = potRef.current.getBoundingClientRect()
      const inPot = e.clientX > p.left && e.clientX < p.right && e.clientY > p.top && e.clientY < p.bottom
      if (moved < 6 || inPot) { gsap.set(el, { rotation: 0 }); cashOut() } else {
        setState('idle')
        gsap.to(el, { x: 0, y: 0, rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' })
      }
    }
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cashOut() } }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('keydown', key)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('keydown', key)
    }
  }, [])
  return (
    <section id="cashout" className="sec cash" aria-labelledby="cash-h">
      <Curtain />
      <div className="wrap cash-grid">
        <div>
          <p className="kicker">♛ Cash out</p>
          <h2 id="cash-h">You&rsquo;re up. <em>Cash out.</em></h2>
          <p className="cash-sub">{me.lines[2]} Drag the chips into the pot and your email opens. Or just press the button; the house doesn&rsquo;t judge.</p>
          <div className="cash-actions">
            <a className="btn gold" href={mailto}>Cash out by email</a>
            <a className="btn ghost" href={me.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a className="btn ghost" href={me.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a className="btn ghost" href={me.resume} download>Resume (PDF) ↓</a>
          </div>
          <p className="cash-mail">{me.email}</p>
        </div>
        <div className={`felt-pot ${state}`}>
          <div className="pot" ref={potRef} aria-hidden="true">
            <span>The pot</span>
          </div>
          <div className="stack" ref={stackRef} role="button" tabIndex={0} aria-label="Chip stack: drag into the pot, or press Enter, to email Krishna">
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className="pchip bounce" style={{ '--i': i }} />)}
            <span className="stack-label">{state === 'won' ? 'Paid out' : 'Drag me'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- song ---------- */
function Song() {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  const toggle = async () => {
    const a = ref.current
    if (!audio.analyser) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        const ctx = new Ctx()
        const src = ctx.createMediaElementSource(a)
        const an = ctx.createAnalyser()
        an.fftSize = 256
        src.connect(an)
        an.connect(ctx.destination)
        audio.analyser = an
        audio.ctx = ctx
        audio.data = new Uint8Array(an.frequencyBinCount)
      } catch { /* plays without the visualiser */ }
    }
    if (a.paused) {
      audio.ctx?.resume()
      try { await a.play(); setOn(true); audio.playing = true } catch { setOn(false) }
    } else {
      a.pause(); setOn(false); audio.playing = false
    }
  }
  useEffect(() => { document.documentElement.classList.toggle('warm', on) }, [on])
  return (
    <div className={`song${on ? ' on' : ''}`}>
      <audio ref={ref} src={asset('audio/lady-love.mp3')} loop preload="none" onEnded={() => setOn(false)} />
      <button onClick={toggle} aria-pressed={on} aria-label={on ? 'Pause Lady Love' : 'Play Lady Love'}>
        <span className="eq" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="song-t"><b>{on ? 'Now playing' : 'Play the table music'}</b>Lady Love</span>
      </button>
    </div>
  )
}

/* ---------- app ---------- */
const NAV = [['#hand', 'Hand'], ['#table', 'History'], ['#house', 'House'], ['#city', 'City'], ['#cashout', 'Cash out']]

export default function App() {
  const [ready, setReady] = useState(reduced)
  const [repos, setRepos] = useState(() => gh.repos.filter((r) => !r.fork))
  const [live, setLive] = useState(false)
  const [exit, setExit] = useState(false)
  const onReady = useRef(() => {
    setReady(true)
    document.documentElement.classList.remove('locked')
    lenis?.start()
    ScrollTrigger.refresh()
  }).current

  // smooth scroll + one ticker
  useEffect(() => {
    if (!reduced) {
      document.documentElement.classList.add('locked')
      lenis = new Lenis({ lerp: 0.09 })
      lenis.on('scroll', ScrollTrigger.update)
      lenis.stop()
    }
    const root = document.documentElement
    let lastBeat = -1
    const tick = (t) => {
      lenis?.raf(t * 1000)
      let b = audio.beat
      if (audio.playing && audio.analyser) {
        audio.analyser.getByteFrequencyData(audio.data)
        let sum = 0
        for (let i = 1; i < 9; i++) sum += audio.data[i]
        const v = clamp01((sum / 8 / 255 - 0.5) * 2.6)
        b = Math.max(b * 0.86, v)
      } else b *= 0.9
      audio.beat = b < 0.002 ? 0 : b
      if (Math.abs(audio.beat - lastBeat) > 0.004) { lastBeat = audio.beat; root.style.setProperty('--beat', audio.beat.toFixed(3)) }
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // anchors glide
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a || e.defaultPrevented) return
      const el = document.querySelector(a.getAttribute('href'))
      if (!el) return
      e.preventDefault()
      setExit(false)
      if (lenis) lenis.scrollTo(el, { duration: 1.5, easing: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2) })
      else el.scrollIntoView()
    }
    document.addEventListener('click', onClick)

    // the "leaving without cashing out?" moment
    let asked = false
    const out = (e) => {
      if (asked || e.relatedTarget || e.clientY > 0) return
      const c = document.getElementById('cashout')
      if (c && c.getBoundingClientRect().top < innerHeight) return
      asked = true
      setExit(true)
    }
    document.addEventListener('mouseout', out)

    // reveals
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray('.reveal').forEach((el) => {
          gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
        })
        gsap.utils.toArray('.curtain').forEach((el) => {
          gsap.fromTo(el, { scaleY: 1 }, { scaleY: 0, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'top 30%', scrub: true } })
        })
      })
    })

    // latest repos, never blocking
    const ac = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        setRepos(list.filter((r) => !r.fork).map((r) => ({
          name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
          sizeKB: r.size, pushedAt: (r.pushed_at || '').slice(0, 10), homepage: r.homepage, url: r.html_url,
        })))
        setLive(true)
      })
      .catch(() => {})

    return () => {
      ac.abort()
      ctx.revert()
      gsap.ticker.remove(tick)
      document.removeEventListener('click', onClick)
      document.removeEventListener('mouseout', out)
      lenis?.destroy()
      lenis = null
    }
  }, [])

  return (
    <>
      <a className="skiplink" href="#hand">Skip to content</a>
      <div className="table-light" aria-hidden="true" />
      <header className={`top${ready ? ' in' : ''}`}>
        <a href="#top" className="brand" aria-label="Back to the deal"><span className="brand-mono">KR</span><span>Dealt</span></a>
        <nav aria-label="Sections">
          {NAV.map(([h, l]) => <a key={h} href={h} className={h === '#cashout' ? 'nav-cta' : ''}>{l}</a>)}
        </nav>
      </header>
      <main>
        <Hero onReady={onReady} />
        <Ticker />
        <Hand />
        <Intermission
          n={1}
          setup="Oi. Recruiter."
          img={asset('img/pins/butcher.jpg')}
          alt="Meme: Billy Butcher grinning next to a cartoon pony with the exact same grin"
          caption="You, opening a CV that says 'automation enthusiast'. Again."
          reframe="He doesn't do enthusiasm. He does production."
          sub="9 apps in production at Indo Tech Transformers. 128 tests guarding dispatch. 30 minutes → 30 seconds."
        />
        <Table />
        <House />
        <Intermission
          n={2}
          setup="Test planning. Two hours. Every single unit."
          img={asset('img/pins/tamil.jpg')}
          alt="Meme: a man in a white shirt staring into the distance, finger on his lips, deep in thought"
          caption="eaaaa vazhka nadakamahhh 🙃 (life is a drama)"
          reframe="2 h → 5 min. The drama got automated."
          sub="Transformer Test Planner: every IEC 60076 test, planned per unit. Odds of a manual task surviving him: 0%."
        />
        <City repos={repos} live={live} />
        <Honours />
        <CashOut />
      </main>
      <footer className="foot">
        <div className="wrap foot-grid">
          <div>
            <p className="brand"><span className="brand-mono">KR</span><span>Dealt</span></p>
            <p>{me.name} · {me.role} · {me.city}</p>
          </div>
          <div>
            <p className="kicker">Certifications</p>
            <ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div>
            <p className="kicker">Credits</p>
            <p>Some images via the owner&rsquo;s Pinterest boards. Song: &ldquo;Lady Love&rdquo;. Built with React, GSAP and Lenis. No bluffing: every number is on GitHub.</p>
          </div>
        </div>
      </footer>
      <Song />
      {exit && (
        <div className="exit" role="dialog" aria-label="Leaving already?">
          <p><b>Leaving with chips still on the table?</b> The pot&rsquo;s right there.</p>
          <a className="btn gold" href="#cashout">Cash out</a>
          <button className="btn ghost" onClick={() => setExit(false)}>Keep playing</button>
        </div>
      )}
    </>
  )
}

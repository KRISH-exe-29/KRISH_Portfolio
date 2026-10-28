import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, skills, asset } from './content.js'
import snapshot from './github.json'
import { N, slotAngle, FORMATION_S, EXPANSION_S, clamp01, sceneAt, reelPose } from './reel.js'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const root = () => document.documentElement
const repoUrl = (name) => `https://github.com/KRISH-exe-29/${name}`
const fmtDate = (d) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

// Shared between the radio (writes) and the rain loop (reads).
const sound = { ctx: null, analyser: null, data: null, playing: false, avg: 0.2, beat: 0 }
// Lenis instance, set once motion is on. Every in-page jump goes through go().
let lenis = null
function go(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
}

/* ------------------------------------------------------------------ data */

const LANG = { Python: '#3ad4ff', JavaScript: '#ffc53d', TypeScript: '#9b8cff', 'C++': '#ff4f8b', HTML: '#ff8a3d' }
const langColor = (l) => LANG[l] || '#9aa3b5'
const hash = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const indoApps = apps.filter((a) => a.name !== 'Job Lens')
const jobLens = apps.find((a) => a.name === 'Job Lens')
const patent = awards.find((a) => a.title === 'Patent published')

// The 16 billboards on the reel ring: apps, side projects, the AI work and two landmarks.
const COVERS = [
  ['img/cards/indotech.jpg', 'Krishna at Indo Tech Transformers'],
  ['img/cards/porsche.jpg', 'Porsche 911 GT3 RS tail light poster'],
  ['img/cards/supra.jpg', 'Toyota Supra tail lights at night'],
  ['img/cards/iphone.jpg', 'White coupe parked in the dark under a neon kanji sign'],
  ['img/cards/wallpaper.jpg', 'Graffiti sticker wall with speakers and spray cans'],
  ['img/cards/car.jpg', 'Anime girl resting against a sports car on a wet street'],
  ['img/cards/portrait.jpg', 'Portrait of Krishna Raju S'],
  ['img/cards/buhler-kiosk.jpg', 'Krishna leaning on a Bühler touchscreen kiosk'],
  ['img/cards/railway.jpg', 'Diesel locomotives lined up on a Southern Railway track'],
  ['img/cards/nec-top7.jpg', 'National Entrepreneurship Challenge finalist poster'],
  ['img/cards/buhler.jpg', 'Krishna at his desk at Bühler India'],
  ['img/cards/ced-team.jpg', 'Students under the Centre for Entrepreneurship Development signs'],
  ['img/cards/speaking.jpg', 'Krishna speaking to a hall of students'],
  ['img/cards/ecell.jpg', 'The E-Cell team on campus'],
  ['img/cards/iitb.jpg', 'Krishna in front of the IIT Bombay sign'],
  ['img/cards/buhler-badge.jpg', 'Bühler internship ID badge'],
]
const CARDS = [
  ...apps.map((a) => ({ title: a.name, pitch: a.pitch, href: a.url || '#factory', tag: a.name === 'Job Lens' ? 'AI Quarter' : 'Factory District' })),
  ...sideProjects.map((p) => ({ title: p.name, pitch: p.pitch, href: p.url || '#landmarks', tag: 'Side street' })),
  { title: ai.agent.name, pitch: 'One agent, twelve versions, local models.', href: repoUrl('Agentic-AI'), tag: 'AI Quarter' },
  { title: ai.rag.name, pitch: 'Shop-floor answers, with the source attached.', href: '#ai', tag: 'AI Quarter' },
  { title: 'Street-light patent', pitch: patent.detail + '.', href: '#landmarks', tag: 'Landmark' },
  { title: 'capex-project-tracker', pitch: 'PR/PO budget ceiling, PO dossier, exceptions, activity log.', href: repoUrl('capex-project-tracker'), tag: 'Factory District' },
].map((c, i) => ({ ...c, cover: asset(COVERS[i][0]), coverAlt: COVERS[i][1] }))

function highwaySvg(days, bestDate) {
  const W = 6
  const w = days.length * W
  let s = ''
  days.forEach(([d, c], i) => {
    if (!c) return
    const lane = i % 3
    const best = d === bestDate
    const len = 6 + Math.min(c, 60) * 0.9
    const op = (0.4 + (0.6 * Math.min(c, 15)) / 15).toFixed(2)
    const fill = best ? '#ff3d7f' : lane === 1 ? '#fff4d6' : '#ffb547'
    s += `<rect x="${i * W}" y="${8 + lane * 12}" width="${len}" height="${best ? 6 : 2.5}" rx="1.2" fill="${fill}" opacity="${best ? 1 : op}"/>`
  })
  return {
    w,
    src: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="44" viewBox="0 0 ${w} 44">${s}</svg>`),
  }
}

/* ------------------------------------------------------------------ hero: reel ring */

function Hero({ population, onDone }) {
  const stRef = useRef(null)
  const stageRef = useRef(null)
  const ringRef = useRef(null)
  const cardRefs = useRef([])
  const backdropRef = useRef(null)
  const digitRefs = useRef([])
  const captionRef = useRef(null)
  const flyRef = useRef(null)
  const skipRef = useRef(null)
  const popRef = useRef(population)
  popRef.current = population

  useEffect(() => {
    const st = {
      formation: reduced ? 1 : 0,
      expansion: reduced ? 1 : 0,
      tExp: null,
      loaded: 0,
      spin: 0,
      vel: 0,
      target: 0,
      cache: [],
      ring: '',
      persp: '',
      backdrop: -1,
      digits: [-1, -1, -1],
      done: false,
      revealed: false,
      visible: true,
      flew: false,
    }
    stRef.current = st
    const rootEl = root()

    const landBrand = () => rootEl.classList.add('brand-landed')
    const reveal = () => {
      if (st.revealed) return
      st.revealed = true
      rootEl.classList.add('is-revealed')
    }
    const fly = () => {
      if (st.flew) return
      st.flew = true
      const src = flyRef.current
      const dst = document.querySelector('.wordmark-text')
      if (!src || !dst || !src.animate) return landBrand()
      const a = src.getBoundingClientRect()
      const b = dst.getBoundingClientRect()
      const s = b.height / a.height
      const anim = src.animate(
        [
          { transform: 'translate(0,0) scale(1)', color: '#07080c' },
          { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${s})`, color: '#efeadf' },
        ],
        { duration: 1150, easing: 'cubic-bezier(.5,0,.15,1)', fill: 'forwards' },
      )
      anim.onfinish = landBrand
    }
    const finish = () => {
      if (st.done) return
      st.done = true
      st.formation = 1
      st.expansion = 1
      reveal()
      landBrand()
      rootEl.classList.remove('is-entering')
      onDone()
    }
    st.skip = finish

    if (reduced) {
      finish()
    } else {
      rootEl.classList.add('is-entering')
      // Real asset loading drives formation: each decoded cover moves the cap.
      cardRefs.current.forEach((card) => {
        const img = card.querySelector('img')
        const count = () => st.loaded++
        if (img.decode) img.decode().then(count, count)
        else count()
      })
    }
    const safety = setTimeout(() => (st.loaded = N), 7000)

    // Scrambled caption.
    const glyphs = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789#%/_'
    const lines = ['Loading city…', 'Wiring streetlights…', 'Counting residents…', 'Opening the gates…']
    let tick = 0
    const scramble = setInterval(() => {
      const el = captionRef.current
      if (!el || st.done) return
      tick++
      const line = lines[Math.min(lines.length - 1, Math.floor(st.formation * 3 + (st.tExp ? 1 : 0)))]
      const solved = Math.min(line.length, (tick % 40) * 1.2)
      let out = ''
      for (let i = 0; i < line.length; i++) out += i < solved || line[i] === ' ' ? line[i] : glyphs[(Math.random() * glyphs.length) | 0]
      el.textContent = out
    }, 50)

    const loop = (_t, dtMs) => {
      const dt = Math.min(dtMs, 64) / 1000
      const now = performance.now()
      if (!st.done) {
        const loadCap = st.loaded / N
        st.formation = Math.min(1, st.formation + Math.min(dt / FORMATION_S, Math.max(0, loadCap - st.formation)))
        if (st.formation >= 1) {
          if (st.tExp == null) {
            st.tExp = now
            fly()
          }
          st.expansion = clamp01((now - st.tExp) / 1000 / EXPANSION_S)
          if ((now - st.tExp) / 1000 >= 1.05) reveal()
        }
        const pop = Math.round(st.formation * popRef.current)
        const ds = String(pop).padStart(3, '0').slice(-3).split('').map(Number)
        ds.forEach((d, i) => {
          if (st.digits[i] !== d && digitRefs.current[i]) {
            st.digits[i] = d
            digitRefs.current[i].style.transform = `translateY(${-d}em)`
          }
        })
        if (st.expansion >= 1) finish()
      }
      const bd = Math.round((1 - clamp01(st.expansion / 0.55)) * 100) / 100
      if (bd !== st.backdrop && backdropRef.current) {
        st.backdrop = bd
        backdropRef.current.style.opacity = bd
        backdropRef.current.style.visibility = bd === 0 ? 'hidden' : 'visible'
      }
      if (!st.visible) return
      // Idle spin once the ring opens; drag, wheel and swipe move the target, a spring follows.
      if (st.expansion > 0 && !reduced) st.target += dt * 4
      const k = 38
      st.vel += ((st.target - st.spin) * k - st.vel * 2 * Math.sqrt(k)) * dt
      st.spin += st.vel * dt
      const sc = sceneAt(st.expansion, st.spin)
      const persp = `${sc.perspective.toFixed(1)}px`
      if (persp !== st.persp) {
        st.persp = persp
        stageRef.current.style.perspective = persp
      }
      const ring = `rotateZ(${sc.roll.toFixed(2)}deg) rotateX(${sc.tilt.toFixed(2)}deg)`
      if (ring !== st.ring) {
        st.ring = ring
        ringRef.current.style.transform = ring
      }
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i]
        const p = reelPose(slotAngle(i), st.formation, sc)
        const tf = `translate3d(${p.x.toFixed(1)}px,${p.y}px,${p.z.toFixed(1)}px) rotateY(${p.yaw.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`
        const c = st.cache[i] || (st.cache[i] = {})
        if (c.tf !== tf) {
          c.tf = tf
          el.style.transform = tf
        }
        const op = p.appear.toFixed(2)
        if (c.op !== op) {
          c.op = op
          el.style.opacity = op
        }
        if (c.behind !== p.behindCamera) {
          c.behind = p.behindCamera
          el.style.visibility = p.behindCamera ? 'hidden' : 'visible'
        }
        const near = !p.behindCamera && p.z > -sc.radius * 0.35 && st.expansion > 0.9
        if (c.near !== near) {
          c.near = near
          el.classList.toggle('is-near', near)
        }
      }
    }
    gsap.ticker.add(loop)

    const io = new IntersectionObserver(([e]) => (st.visible = e.isIntersecting))
    io.observe(stageRef.current)

    const onKey = (e) => {
      if (!st.done && (e.key === 'Escape' || e.key === 'Tab')) finish()
    }
    window.addEventListener('keydown', onKey)

    const setK = () => rootEl.style.setProperty('--k', Math.min(1, Math.max(0.42, window.innerWidth / 1280)).toFixed(3))
    setK()
    window.addEventListener('resize', setK)

    return () => {
      gsap.ticker.remove(loop)
      clearInterval(scramble)
      clearTimeout(safety)
      io.disconnect()
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', setK)
    }
  }, [onDone])

  // Drag / swipe / horizontal wheel steer the ring. A drag never fires a card's link.
  const drag = useRef({ down: false, x: 0, moved: 0 })
  const onPointerDown = (e) => {
    drag.current = { down: true, x: e.clientX, moved: 0 }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d.down || !stRef.current) return
    const dx = e.clientX - d.x
    d.x = e.clientX
    d.moved += Math.abs(dx)
    stRef.current.target += dx * 0.16
  }
  const onPointerUp = () => (drag.current.down = false)
  const onClickCapture = (e) => {
    if (drag.current.moved > 6) {
      e.preventDefault()
      e.stopPropagation()
    }
    drag.current.moved = 0
  }
  const onWheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && stRef.current) stRef.current.target -= e.deltaX * 0.12
  }
  const focusCard = (i) => {
    const st = stRef.current
    if (!st) return
    const want = -slotAngle(i)
    st.target = want + Math.round((st.target - want) / 360) * 360
  }

  return (
    <section className="hero" id="top" aria-label="Commit City, intro">
      <div className="hero-backdrop" ref={backdropRef} aria-hidden="true" />
      <div
        className="stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onClickCapture={onClickCapture}
        onWheel={onWheel}
      >
        <div className="dive">
          <div className="reel-scale">
            <div className="ring" ref={ringRef}>
              {CARDS.map((c, i) => {
                const external = c.href.startsWith('http')
                return (
                  <a
                    key={c.title}
                    className="card"
                    href={c.href}
                    ref={(el) => (cardRefs.current[i] = el)}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    aria-label={`${c.title}: ${c.pitch}${external ? ' (opens in a new tab)' : ''}`}
                    onFocus={() => focusCard(i)}
                    draggable="false"
                  >
                    <span className="card-face card-front">
                      <img src={c.cover} alt={c.coverAlt} draggable="false" />
                      <span className="card-sweep" aria-hidden="true" />
                      <span className="card-tag">
                        {String(i + 1).padStart(2, '0')}/16 · {c.tag}
                      </span>
                      <span className="card-title">{c.title}</span>
                      <span className="card-pitch">{c.pitch}</span>
                    </span>
                    <span className="card-face card-back" aria-hidden="true">
                      <span>
                        KRISH<b>.exe</b>
                      </span>
                    </span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="loader-ui" aria-hidden="true">
        <span className="brand-fly" ref={flyRef}>
          KRISH<b>.exe</b>
        </span>
        <p className="loader-caption" ref={captionRef}>
          Loading city…
        </p>
        <div className="counter">
          <span className="counter-label">
            Population
            <br />
            contributions, last 12 months
          </span>
          <span className="digits">
            {[0, 1, 2].map((i) => (
              <span className="digit" key={i}>
                <span className="digit-strip" ref={(el) => (digitRefs.current[i] = el)}>
                  {'0123456789'.split('').map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              </span>
            ))}
          </span>
        </div>
      </div>
      <button className="skip" ref={skipRef} onClick={() => stRef.current?.skip()}>
        Skip intro
      </button>

      <div className="hero-copy">
        <p className="hero-kicker">
          <span className="dot" /> Chennai, after dark · {me.role}
        </p>
        <h1 className="hero-title">
          <span className="line">
            <span>Population: {population} repos.</span>
          </span>
          <span className="line">
            <span>
              Curfew: <em>none.</em>
            </span>
          </span>
        </h1>
        <p className="hero-sub">
          I replace hours of work with scripts. Then pretend it was “team effort”.{' '}
          <span className="nowrap">Drag the ring. Scroll to enter the city.</span>
        </p>
      </div>
      <div className="street-glow" aria-hidden="true" />
    </section>
  )
}

/* ------------------------------------------------------------------ skyline */

function Skyline({ repos }) {
  const max = Math.max(...repos.map((r) => r.sizeKB || 1))
  const now = Date.now()
  const hw = useMemo(() => highwaySvg(snapshot.days, snapshot.bestDay.date), [])
  const langs = useMemo(() => {
    const m = {}
    repos.forEach((r) => (m[r.language || 'Unzoned'] = (m[r.language || 'Unzoned'] || 0) + 1))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [repos])
  const sorted = useMemo(() => [...repos].sort((a, b) => (a.pushedAt < b.pushedAt ? -1 : 1)), [repos])

  return (
    <section className="skyline-scene" id="skyline" aria-labelledby="skyline-title" data-pin="skyline">
      <div className="sky-head">
        <p className="eyebrow">Zone 00 · The skyline</p>
        <h2 id="skyline-title" className="neon-sign">
          <span>Commit</span> <span>City</span>
        </h2>
        <p className="sky-copy">
          One tower per public repo. Height is the repo’s size on a log scale, colour is its language, lit windows mean a recent push. Oldest on the left,
          freshest on the right. Hover or tab through to read the plaques.
        </p>
      </div>

      <div className="skyline" role="list">
        {sorted.map((r, i) => {
          const h = 16 + (Math.log10((r.sizeKB || 1) + 1) / Math.log10(max + 1)) * 84
          const days = (now - new Date(r.pushedAt + 'T00:00:00Z').getTime()) / 864e5
          const lit = Math.max(0.06, Math.min(0.95, 1 - days / 240))
          const rows = Math.max(3, Math.round(h / 4.4))
          const align = i < 3 ? 'is-left' : i > sorted.length - 4 ? 'is-right' : ''
          return (
            <div role="listitem" className="tower-wrap" key={r.name} style={{ '--i': i, '--n': sorted.length }}>
              <a
                className={`tower ${align}`}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ '--h': h.toFixed(1) + '%', '--c': langColor(r.language) }}
                aria-label={`${r.name}. ${r.language || 'No language'}. Last push ${fmtDate(r.pushedAt)}. Opens on GitHub.`}
              >
                <span className="tower-body" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                  {Array.from({ length: rows * 3 }, (_, w) => (
                    <i key={w} className={hash(i * 97 + w) < lit ? 'on' : undefined} />
                  ))}
                  {r.stars > 0 && <span className="antenna" />}
                </span>
                <span className="tip" aria-hidden="true">
                  <b>{r.name}</b>
                  <span>
                    <i style={{ background: langColor(r.language) }} />
                    {r.language || 'Unzoned'}
                    {r.fork ? ' · fork' : ''}
                    {r.stars ? ` · ★ ${r.stars}` : ''}
                  </span>
                  <span>Last push {fmtDate(r.pushedAt)}</span>
                  <span className="tip-link">Open on GitHub ↗</span>
                </span>
              </a>
            </div>
          )
        })}
      </div>

      <div className="road" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span className="lamp" key={i} style={{ '--d': i }} />
        ))}
      </div>

      <div className="highway">
        <div className="highway-track" style={{ '--w': hw.w + 'px' }} aria-hidden="true">
          <img src={hw.src} alt="" width={hw.w} height="44" />
          <img src={hw.src} alt="" width={hw.w} height="44" />
        </div>
        <div className="highway-legend">
          <p>
            <b>Highway 367.</b> One lane-light per day with commits, last 367 days: {snapshot.contributionsLastYear} contributions,{' '}
            {snapshot.commitsLastYear} commits, {snapshot.prsLastYear} pull requests.
          </p>
          <p className="best">
            <i /> {fmtDate(snapshot.bestDay.date)}: {snapshot.bestDay.contributionCount} contributions. The night the city never slept.
          </p>
        </div>
      </div>

      <ul className="zoning" aria-label="Zoning by language">
        {langs.map(([l, n]) => (
          <li key={l}>
            <i style={{ background: langColor(l === 'Unzoned' ? null : l) }} />
            {l} <span>×{n}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ shared bits */

function Ticker({ items }) {
  const row = items.join('  ·  ') + '  ·  '
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        <span>{row}</span>
        <span>{row}</span>
      </div>
    </div>
  )
}

function DistrictHead({ no, name, line, id }) {
  return (
    <header className="district-head" data-scrub>
      <p className="eyebrow">
        District {no} <span className="lamp mini" aria-hidden="true" />
      </p>
      <h2 id={id} className="district-name">
        <span className="wipe">{name}</span>
      </h2>
      <p className="district-line">{line}</p>
    </header>
  )
}

function Intermission({ variant, channel, setup, img, alt, caption, reframe, proof }) {
  return (
    <section className={`intermission is-${variant}`} data-scrub aria-label="Intermission">
      <p className="int-label">
        <span className="rec" aria-hidden="true" /> {variant === 'tv' ? `Late-night broadcast · CH ${channel}` : `Billboard · Exit ${channel}`}
      </p>
      <p className="int-setup">{setup}</p>
      <figure className="int-frame">
        <img src={asset(img)} alt={alt} loading="lazy" decoding="async" />
        <figcaption className="int-caption">{caption}</figcaption>
        <span className="int-scan" aria-hidden="true" />
      </figure>
      <p className="int-reframe">{reframe}</p>
      {proof && <p className="int-proof">{proof}</p>}
    </section>
  )
}

/* ------------------------------------------------------------------ districts */

const STREETS = [
  ['30-Seconds Ave', 'formerly 30-Minutes Rd'],
  ['5-Minute Ln', 'formerly 2-Hour Hwy'],
  ['128 Tests St', 'guarding dispatch'],
  ['Gate Pass Rd', 'zero phone calls'],
]

function Factory() {
  return (
    <section className="district factory" id="factory" aria-labelledby="factory-title">
      <DistrictHead no="01" id="factory-title" name="Factory District" line={`Indo Tech Transformers, Kanchipuram. ${me.lines[0]}`} />
      <div className="street-signs" data-scrub>
        {STREETS.map(([a, b], i) => (
          <div className="street-sign" key={a} style={{ '--i': i }}>
            <b>{a}</b>
            <span>{b}</span>
          </div>
        ))}
      </div>
      <ul className="shops">
        {indoApps.map((a, i) => (
          <li className="shop" key={a.name} style={{ '--i': i }}>
            <span className="awning" aria-hidden="true" />
            <span className="shop-no">No. {String(i + 1).padStart(2, '0')}</span>
            <h3 className="shop-name">{a.name}</h3>
            <p className="shop-pitch">{a.pitch}</p>
            {a.url ? (
              <a className="shop-door" href={a.url} target="_blank" rel="noopener noreferrer">
                Walk in <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="shop-door is-staff">Staff only: factory network</span>
            )}
          </li>
        ))}
        {building.map((b, i) => (
          <li className="shop" key={b.name} style={{ '--i': indoApps.length + i }}>
            <span className="awning" aria-hidden="true" />
            <span className="shop-no">Under construction</span>
            <h3 className="shop-name">{b.name}</h3>
            <p className="shop-pitch">{b.pitch} {b.status}.</p>
            <span className="shop-door is-staff">Opening soon</span>
          </li>
        ))}
      </ul>
      <div className="civic" data-scrub>
        <p className="eyebrow">Civic stats, posted at the gate</p>
        <ul>
          {numbers.map((n) => (
            <li key={n.unit}>
              <b>{n.value}</b>
              <span className="unit">{n.unit}</span>
              <span>{n.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function AIQuarter() {
  return (
    <section className="district aiq" id="ai" aria-labelledby="ai-title">
      <DistrictHead no="02" id="ai-title" name="AI Quarter" line="Rents are high, models run local, and every answer cites its source." />
      <div className="aiq-grid">
        <article className="agent-tower" data-scrub>
          <p className="eyebrow">Tallest building in the quarter</p>
          <h3>{ai.agent.name}</h3>
          <p>{ai.agent.pitch}</p>
          <ol className="floors" aria-label="Twelve versions, ground floor first">
            {ai.agent.versions.map((v, i) => (
              <li key={v} style={{ '--i': i }}>
                <span>Fl. {String(i + 1).padStart(2, '0')}</span> {v}
              </li>
            ))}
          </ol>
          <a className="link-neon" href={repoUrl('Agentic-AI')} target="_blank" rel="noopener noreferrer">
            Agentic-AI on GitHub ↗
          </a>
        </article>
        <div className="aiq-side">
          <article className="metro" data-scrub>
            <p className="eyebrow">Line R · {ai.rag.name}</p>
            <p>{ai.rag.pitch}</p>
            <ol className="stations">
              {ai.rag.steps.map((s, i) => (
                <li key={s} style={{ '--i': i }}>
                  <i aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ol>
          </article>
          <article className="lens-shop">
            <p className="eyebrow">Open late · {ai.browser.name}</p>
            <h3>{jobLens.name}</h3>
            <p className="lens-pitch">{jobLens.pitch}</p>
            <p>{ai.browser.pitch}</p>
            <a className="link-neon" href={jobLens.url} target="_blank" rel="noopener noreferrer">
              Try Job Lens ↗
            </a>
          </article>
          <ul className="neon-chips" aria-label="AI stack">
            {ai.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const STREET_NAME = { railway: 'Railway Junction', mettur: 'Power Station Rd', inovate: 'Remote Ln', buhler: 'Bühler Blvd', indotech: 'Transformer Ave' }

function OldTown() {
  return (
    <section className="oldtown" id="oldtown" aria-labelledby="oldtown-title" data-pin="oldtown">
      <div className="oldtown-track">
        <div className="oldtown-intro">
          <p className="eyebrow">District 03</p>
          <h2 id="oldtown-title" className="district-name">
            Old Town
          </h2>
          <p className="district-line">Where the city started. Five internships, oldest first. Mind the potholes; most of them got automated.</p>
        </div>
        {experience.map((x) => (
          <article className="sign-post" key={x.id}>
            <div className="sign">
              <span className="sign-year">{x.year}</span>
              <h3>{STREET_NAME[x.id]}</h3>
              <span className="sign-co">{x.company}</span>
            </div>
            <div className="sign-pole" aria-hidden="true" />
            <div className="sign-body">
              <p className="sign-role">
                {x.role} · {x.place}
              </p>
              <p className="sign-short">{x.short}</p>
              <p>{x.text}</p>
            </div>
            {x.photo && (
              <figure className="poster">
                <img src={x.photo} alt={x.photoAlt} loading="lazy" decoding="async" />
              </figure>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function Landmarks() {
  return (
    <section className="district landmarks" id="landmarks" aria-labelledby="landmarks-title">
      <DistrictHead no="04" id="landmarks-title" name="Landmarks" line="Bronze plaques, a patent on the streetlights, and the hall where he talked to 500+ students." />
      <ul className="plaques">
        {awards.map((a) => (
          <li className="plaque" key={a.title}>
            <span className="plaque-year">{a.year}</span>
            <b>{a.title}</b>
            <span>{a.detail}</span>
          </li>
        ))}
      </ul>
      <div className="townhall">
        <div className="townhall-copy">
          <p className="eyebrow">Town hall</p>
          <h3>{leadership.title}</h3>
          <p>{leadership.text}</p>
          <dl className="codes">
            {Object.entries(skills).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v.join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="townhall-photos">
          {leadership.photos.map((p) => (
            <img key={p.src} src={p.src} alt={p.alt} loading="lazy" decoding="async" />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ surprise: HIRE? from above */

function Aerial() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    let pts = []
    let extra = []
    let w = 0
    let h = 0
    let p = reduced ? 1 : 0

    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = cv.clientWidth
      h = cv.clientHeight
      cv.width = w * dpr
      cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const o = off.getContext('2d')
      const fs = Math.min(w * 0.25, h * 0.48)
      o.font = `900 ${fs}px Archivo, sans-serif`
      o.textAlign = 'center'
      o.textBaseline = 'middle'
      o.fillText('HIRE?', w / 2, h * 0.46)
      const data = o.getImageData(0, 0, w, h).data
      const step = Math.max(5, Math.round(fs / 16))
      const targets = []
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 128) targets.push([x, y])
      // Start positions: streetlights along a block grid, seen from above.
      const grid = Math.max(48, w / 14)
      const street = (n) => {
        const r1 = hash(n + 1), r2 = hash(n + 2), r3 = hash(n + 3)
        return r1 < 0.5 ? [Math.round((r2 * w) / grid) * grid, r3 * h] : [r2 * w, Math.round((r3 * h) / grid) * grid]
      }
      pts = targets.map(([tx, ty], i) => {
        const [sx, sy] = street(i * 7)
        return { sx, sy, tx, ty, d: hash(i * 3.1) }
      })
      extra = Array.from({ length: Math.round(w / 4) }, (_, i) => street(9000 + i * 5))
      draw()
    }
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const dim = 1 - clamp01(p * 1.6) * 0.8
      ctx.fillStyle = `rgba(255,181,71,${0.55 * dim})`
      extra.forEach(([x, y]) => ctx.fillRect(x - 1, y - 1, 2, 2))
      pts.forEach((pt) => {
        const t = ease(clamp01((p * 1.5 - pt.d * 0.5) / 1))
        const x = pt.sx + (pt.tx - pt.sx) * t
        const y = pt.sy + (pt.ty - pt.sy) * t
        ctx.fillStyle = t > 0.98 ? 'rgba(255,61,127,0.22)' : 'rgba(255,181,71,0.18)'
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 6.283)
        ctx.fill()
        ctx.fillStyle = t > 0.98 ? '#ffe0ea' : '#ffd79a'
        ctx.fillRect(x - 1.3, y - 1.3, 2.6, 2.6)
      })
    }
    cv.__setProgress = (v) => {
      p = v
      draw()
    }
    let alive = true
    document.fonts.load('900 100px Archivo').finally(() => alive && build())
    const onResize = () => build()
    window.addEventListener('resize', onResize)
    return () => {
      alive = false
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section className="aerial" id="aerial" aria-labelledby="aerial-title" data-pin="aerial">
      <p className="eyebrow aerial-eyebrow">Altitude 1,200 m · All districts</p>
      <canvas ref={canvasRef} className="aerial-canvas" role="img" aria-label="The city's lights, seen from above, rearrange to spell HIRE?" />
      <div className="aerial-copy">
        <h2 id="aerial-title">From up here, the city has one question.</h2>
        <button className="btn-ghost" onClick={() => go('#cityhall')}>
          Answer it at City Hall ↓
        </button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ CTA: City Hall */

function CityHall() {
  const [form, setForm] = useState({ name: '', company: '', task: '' })
  const [stamped, setStamped] = useState(false)
  const [line, setLine] = useState(0)
  const btnRef = useRef(null)

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setLine((l) => (l + 1) % me.lines.length), 3200)
    return () => clearInterval(id)
  }, [])

  const magnet = (e) => {
    if (reduced) return
    const b = btnRef.current
    const r = b.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) * 0.25
    const y = (e.clientY - r.top - r.height / 2) * 0.35
    b.style.transform = `translate(${x}px, ${y}px)`
  }
  const unmagnet = () => btnRef.current && (btnRef.current.style.transform = '')

  const submit = (e) => {
    e.preventDefault()
    setStamped(true)
    const subject = `Hiring permit${form.company ? ': ' + form.company : ''}`
    const body = `Hi Krishna,\n\n${form.task ? 'The manual step I want gone: ' + form.task + '\n\n' : ''}${form.name ? '— ' + form.name : ''}${form.company ? ', ' + form.company : ''}`
    setTimeout(() => {
      window.location.href = `mailto:${me.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }, reduced ? 0 : 1400)
  }

  return (
    <section className="cityhall" id="cityhall" aria-labelledby="cityhall-title">
      <img className="cityhall-sky" src={asset('img/pins/darknature.jpg')} alt="" loading="lazy" decoding="async" />
      <div className="cityhall-inner">
        <div className="hall-copy">
          <p className="eyebrow">City Hall · Permits issued 24/7</p>
          <h2 id="cityhall-title" className="hall-title">
            Got a manual step?
            <br />
            <em>File a permit.</em>
          </h2>
          <p className="hall-line" aria-live="polite">
            {me.lines[line]}
          </p>
          <figure className="mayor">
            <img src={me.portrait} alt="Portrait of Krishna Raju S" loading="lazy" decoding="async" />
            <figcaption>
              <b>{me.name}</b>
              <span>Mayor, self-appointed. Associate Engineer, Indo Tech Transformers. {me.city}.</span>
            </figcaption>
          </figure>
          <ul className="hall-links">
            <li>
              <a href={`mailto:${me.email}`}>{me.email}</a>
            </li>
            <li>
              <a href={me.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn ↗
              </a>
            </li>
            <li>
              <a href={me.github} target="_blank" rel="noopener noreferrer">
                GitHub ↗
              </a>
            </li>
            <li>
              <a href={me.resume} target="_blank" rel="noopener noreferrer">
                Resume (PDF) ↗
              </a>
            </li>
          </ul>
        </div>

        <form className={`permit ${stamped ? 'is-stamped' : ''}`} onSubmit={submit} aria-label="Hiring permit">
          <div className="permit-head">
            <span>Form KR-29</span>
            <span>Hiring permit</span>
          </div>
          <label>
            <span>Your name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" disabled={stamped} />
          </label>
          <label>
            <span>Company</span>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" disabled={stamped} />
          </label>
          <label>
            <span>The manual step you want gone</span>
            <textarea rows="3" value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} disabled={stamped} />
          </label>
          <div className="permit-foot">
            <button className="btn-stamp" ref={btnRef} onPointerMove={magnet} onPointerLeave={unmagnet} disabled={stamped}>
              <span className="btn-a">Stamp the permit</span>
              <span className="btn-b" aria-hidden="true">
                Approved in 30 s
              </span>
            </button>
            <span className="permit-note">Opens your mail app. Nothing is stored here.</span>
          </div>
          <span className="stamp" aria-hidden="true">
            Approved
          </span>
          <p className="permit-done" role="status">
            {stamped ? 'Permit approved. Your mail app is opening; if it does not, write to ' + me.email : ''}
          </p>
        </form>
      </div>
    </section>
  )
}

function ExitToast({ open, onClose }) {
  if (!open) return null
  return (
    <div className="exit-toast" role="dialog" aria-modal="false" aria-labelledby="exit-title">
      <p id="exit-title">Leaving town without a permit?</p>
      <p>The streetlights will remember this.</p>
      <div>
        <button
          className="btn-ghost"
          onClick={() => {
            onClose()
            go('#cityhall')
          }}
        >
          Fine, I’ll file one
        </button>
        <button className="btn-text" onClick={onClose}>
          I’ll be back
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ chrome: header, radio, rain */

function Radio() {
  const audioRef = useRef(null)
  const [on, setOn] = useState(false) // sound actually coming out
  const [music, setMusic] = useMusic(() => audioRef.current, (ctx, src) => {
    const an = ctx.createAnalyser()
    an.fftSize = 256
    src.connect(an)
    an.connect(ctx.destination)
    Object.assign(sound, { ctx, analyser: an, data: new Uint8Array(an.frequencyBinCount) })
  })
  useEffect(() => {
    sound.playing = on
    root().classList.toggle('is-playing', on)
  }, [on])
  return (
    <>
      <button className="radio" data-music aria-pressed={music} onClick={() => setMusic(!music)} aria-label={music ? 'Music on: turn off the song' : 'Music off: turn on the song, pluto projector ending, slowed and reverb with rain'}>
        <span className="radio-icon" aria-hidden="true">
          {music ? '❚❚' : '▶'}
        </span>
        <span className="radio-text">
          <b>{music ? 'Music on · turn off' : 'Music off · turn on'}</b>
          <span className="radio-track">
            <span>WKRS 29 FM · pluto projector ending · slowed & reverb, with rain</span>
          </span>
        </span>
        <span className="eq" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>
      <audio ref={audioRef} src={asset('audio/pluto-projector-rain.mp3')} preload="auto" loop onPlay={() => setOn(true)} onPause={() => setOn(false)} />
    </>
  )
}

function Rain() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const drops = Array.from({ length: 460 }, (_, i) => ({ x: hash(i) , y: hash(i + 0.5), l: 8 + hash(i + 0.3) * 18, v: 0.9 + hash(i + 0.7) * 0.8 }))
    let w = 0
    let h = 0
    const size = () => {
      w = cv.width = window.innerWidth
      h = cv.height = window.innerHeight
    }
    size()
    window.addEventListener('resize', size)
    const rootEl = root()
    let lastBeat = -1
    const loop = (_t, dtMs) => {
      const dt = Math.min(dtMs, 64) / 1000
      // Beat: low-band energy against a running average.
      if (sound.playing && sound.analyser) {
        sound.analyser.getByteFrequencyData(sound.data)
        let e = 0
        for (let i = 1; i < 9; i++) e += sound.data[i]
        e /= 8 * 255
        sound.avg = sound.avg * 0.96 + e * 0.04
        if (e > sound.avg * 1.12 && e > 0.2) sound.beat = 1
      } else if (sound.playing && Math.random() < 0.03) sound.beat = 1
      sound.beat *= 0.86
      const b = Math.round(sound.beat * 50) / 50
      if (b !== lastBeat) {
        lastBeat = b
        rootEl.style.setProperty('--beat', b)
      }
      if (reduced) return
      const count = (sound.playing ? 460 : 150) * (w < 700 ? 0.5 : 1)
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = sound.playing ? 'rgba(190,210,255,0.32)' : 'rgba(190,210,255,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      const speed = sound.playing ? 1500 : 1000
      for (let i = 0; i < count; i++) {
        const d = drops[i]
        d.y += (d.v * speed * dt) / h
        if (d.y > 1.05) {
          d.y = -0.05
          d.x = Math.random()
        }
        const x = d.x * w
        const y = d.y * h
        ctx.moveTo(x, y)
        ctx.lineTo(x - d.l * 0.18, y + d.l)
      }
      ctx.stroke()
    }
    gsap.ticker.add(loop)
    return () => {
      gsap.ticker.remove(loop)
      window.removeEventListener('resize', size)
    }
  }, [])
  return <canvas ref={ref} className="rain" aria-hidden="true" />
}

const NAV = [
  ['#skyline', 'Skyline'],
  ['#factory', 'Factory'],
  ['#ai', 'AI Quarter'],
  ['#oldtown', 'Old Town'],
  ['#cityhall', 'City Hall'],
]

function Header() {
  return (
    <header className="site-header">
      <a
        className="wordmark"
        href="#top"
        aria-label="KRISH.exe, back to the top"
        onClick={(e) => {
          e.preventDefault()
          go('#top')
        }}
      >
        <span className="wordmark-text">
          KRISH<b>.exe</b>
        </span>
      </a>
      <nav aria-label="Districts">
        <ul>
          {NAV.map(([href, label], i) => (
            <li key={href} style={{ '--i': i }} className={i > 0 && i < 4 ? 'nav-mid' : undefined}>
              <a href={href}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

/* ------------------------------------------------------------------ app */

export default function App() {
  const [repos, setRepos] = useState(snapshot.repos)
  const [exitOpen, setExitOpen] = useState(false)
  const doneRef = useRef(false)

  // Latest repos from the public API; the snapshot stays if anything fails.
  useEffect(() => {
    const ctl = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        setRepos(
          list.map((r) => ({
            name: r.name,
            language: r.language,
            stars: r.stargazers_count,
            sizeKB: r.size,
            pushedAt: (r.pushed_at || '').slice(0, 10),
            homepage: r.homepage,
            url: r.html_url,
            fork: r.fork,
          })),
        )
        requestAnimationFrame(() => ScrollTrigger.refresh())
      })
      .catch(() => {})
    return () => ctl.abort()
  }, [])

  const onDone = useRef(() => {
    if (doneRef.current) return
    doneRef.current = true
    lenis?.start()
    ScrollTrigger.refresh()
  }).current

  useEffect(() => {
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
      lenis.on('scroll', ScrollTrigger.update)
      const raf = (t) => lenis.raf(t * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      if (!doneRef.current) lenis.stop()
    }
    // Every in-page link animates through Lenis.
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a || e.defaultPrevented) return
      e.preventDefault()
      go(a.getAttribute('href'))
    }
    document.addEventListener('click', onClick)

    const mm = gsap.matchMedia()
    mm.add(
      { motion: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 768px)' },
      (c) => {
        const { motion, wide } = c.conditions
        const scrubbed = gsap.utils.toArray('[data-scrub]')
        if (!motion) {
          scrubbed.forEach((el) => el.style.setProperty('--p', 1))
          document.querySelector('.skyline-scene')?.style.setProperty('--p', 1)
          document.querySelector('.aerial-canvas')?.__setProgress?.(1)
          document.querySelector('.aerial')?.style.setProperty('--p', 1)
          return
        }
        // Dive: the camera drops through the ring into the city.
        gsap
          .timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=100%', scrub: true, pin: true } })
          .to('.dive', { yPercent: -55, rotationX: 62, scale: 1.5, ease: 'none' }, 0)
          .to('.stage', { opacity: 0, ease: 'power1.in' }, 0)
          .to('.hero-copy', { yPercent: -60, opacity: 0, ease: 'none' }, 0)
          .to('.street-glow', { opacity: 1, ease: 'none' }, 0)

        const sky = document.querySelector('.skyline-scene')
        ScrollTrigger.create({
          trigger: sky,
          start: 'top top',
          end: '+=140%',
          pin: true,
          onUpdate: (s) => sky.style.setProperty('--p', s.progress.toFixed(3)),
        })

        if (wide) {
          const track = document.querySelector('.oldtown-track')
          const dist = () => track.scrollWidth - window.innerWidth
          gsap.to(track, {
            x: () => -dist(),
            ease: 'none',
            scrollTrigger: { trigger: '.oldtown', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: true, invalidateOnRefresh: true },
          })
        }

        const aerial = document.querySelector('.aerial')
        const cv = document.querySelector('.aerial-canvas')
        ScrollTrigger.create({
          trigger: aerial,
          start: 'top top',
          end: '+=160%',
          pin: true,
          onUpdate: (s) => {
            aerial.style.setProperty('--p', s.progress.toFixed(3))
            cv.__setProgress?.(Math.min(1, s.progress * 1.15))
          },
        })
        // Scrubs after pins so their positions include the pin spacers.
        scrubbed.forEach((el) =>
          ScrollTrigger.create({
            trigger: el,
            start: 'top 88%',
            end: 'bottom 55%',
            onUpdate: (s) => el.style.setProperty('--p', s.progress.toFixed(3)),
            onLeave: () => el.style.setProperty('--p', 1),
          }),
        )
      },
    )

    // Exit moment: pointer leaves through the top after the visitor has seen the city.
    let shown = false
    const onOut = (e) => {
      if (shown || e.relatedTarget || e.clientY > 0) return
      if (window.scrollY < window.innerHeight * 2) return
      shown = true
      setExitOpen(true)
    }
    document.addEventListener('mouseout', onOut)
    const onEsc = (e) => e.key === 'Escape' && setExitOpen(false)
    window.addEventListener('keydown', onEsc)

    return () => {
      mm.revert()
      document.removeEventListener('click', onClick)
      document.removeEventListener('mouseout', onOut)
      window.removeEventListener('keydown', onEsc)
      lenis?.destroy()
      lenis = null
    }
  }, [])

  return (
    <>
      <a className="skip-link" href="#skyline">
        Skip to the city
      </a>
      <Rain />
      <Header />
      <Radio />
      <main>
        <Hero population={repos.length} onDone={onDone} />
        <Skyline repos={repos} />
        <Ticker
          items={[
            `Population: ${repos.length} repos`,
            'Curfew: none',
            'Zoning permit: approved by nobody, used by everyone',
            `${snapshot.contributionsLastYear} contributions last year`,
            `Founded ${fmtDate(snapshot.joined)}`,
          ]}
        />
        <Factory />
        <Intermission
          variant="billboard"
          channel="02"
          setup="An electrical engineer walks into the AI Quarter and is handed a Python REPL."
          img="img/pins/jesse.jpg"
          alt="Jesse Pinkman from Breaking Bad, looking back from a red car"
          caption="Yeah, science!"
          reframe="Yeah, Python. Same energy."
          proof="Twelve versions of one agent, a cited RAG assistant, and resume ranking that never leaves the browser."
        />
        <AIQuarter />
        <Intermission
          variant="tv"
          channel="29"
          setup="Five internships in four years: a railway, a thermal plant, a startup, Bühler, a transformer factory."
          img="img/pins/anya.jpg"
          alt="Anya from Spy x Family pointing excitedly at a gym, captioned We go jim"
          caption="Me, every summer, picking the next internship"
          reframe="Different gym. Same reps: find the manual step, delete it."
        />
        <OldTown />
        <Landmarks />
        <Intermission
          variant="tv"
          channel="60"
          setup="Every transformer. Every IEC 60076 test. Planned by hand, in a spreadsheet."
          img="img/pins/scared.jpg"
          alt="A chrome figure clutching its head against a red background"
          caption="The spreadsheet, now: scared and tired"
          reframe="2 hours → 5 minutes. The Transformer Test Planner took the night shift."
        />
        <Ticker items={['30-Seconds Ave (formerly 30-Minutes Rd)', '5-Minute Ln (formerly 2-Hour Hwy)', 'Rank 7 Circle (of 1500+)', '128 Tests St', 'Patent Plaza']} />
        <Aerial />
        <CityHall />
      </main>
      <footer className="site-footer">
        <p className="footer-big">Zoning permit: approved by nobody, used by everyone.</p>
        <div className="footer-cols">
          <p>
            Built by {me.name}. Data: GitHub ({snapshot.login}), refreshed live when the API allows, snapshot {snapshot.snapshotAt.slice(0, 10)} otherwise.
          </p>
          <p>
            Song: “pluto projector ending (instrumental slowed &amp; reverb with rain)”, from the owner’s Music folder. Some images via the owner’s Pinterest
            boards. Memes: Breaking Bad, Spy x Family, and a very tired chrome man.
          </p>
          <p>
            <a href="#top">Back to the top ↑</a>
          </p>
        </div>
      </footer>
      <ExitToast open={exitOpen} onClose={() => setExitOpen(false)} />
    </>
  )
}

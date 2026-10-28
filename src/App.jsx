import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, certifications, skills, asset, field } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Shared with the WebGL sky (read every frame there, written here).
const S = { h: -2.2, pitch: 0.32, gold: 0, px: 0, py: 0, beat: 0, flash: 0, visible: true, born: 0 }
const audio = { analyser: null, data: null }
let lenis = null

const CEILING = 36000 // feet at the top of the page
const fmt = (n) => n.toLocaleString('en-US')
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const mailto = `mailto:${me.email}?subject=${encodeURIComponent('Something for you to automate')}`

// Altitude (0..1) to camera height, pitch and how golden the light is. Cloud slab sits at h 0..1.
const KEYS = [
  [0, -2.2, 0.34, 0], [0.25, -0.9, 0.3, 0.05], [0.45, -0.05, 0.12, 0.22],
  [0.55, 0.5, 0, 0.45], [0.66, 1.2, -0.12, 0.82], [1, 2.6, -0.08, 1],
]
function camera(alt) {
  for (let i = 1; i < KEYS.length; i++) {
    const [a1, h1, p1, g1] = KEYS[i]
    const [a0, h0, p0, g0] = KEYS[i - 1]
    if (alt <= a1) {
      const t = (alt - a0) / (a1 - a0)
      return [lerp(h0, h1, t), lerp(p0, p1, t), lerp(g0, g1, t)]
    }
  }
  return KEYS.at(-1).slice(1)
}
const layerName = (alt) => (alt < 0.18 ? 'Factory floor' : alt < 0.44 ? 'Low layer' : alt < 0.62 ? 'In the cloud' : alt < 0.82 ? 'Above the clouds' : 'Cruising')

const CHAPTERS = [
  { id: 'floor', label: 'Ground', alt: 0 },
  { id: 'preflight', label: 'Pre-flight', alt: 0.16 },
  { id: 'climb', label: 'Climb log', alt: 0.28 },
  { id: 'cloud', label: 'The cloud', alt: 0.55 },
  { id: 'autopilot', label: 'Autopilot', alt: 0.76 },
  { id: 'weather', label: 'Weather', alt: 0.86 },
  { id: 'log', label: 'Flight log', alt: 0.93 },
  { id: 'summit', label: 'Land', alt: 1 },
]

/* ---------- small pieces ---------- */

function Bank({ tone = 'white', id }) {
  const layers = useMemo(() => [0, 1, 2].map((l) => Array.from({ length: 8 }, (_, i) => {
    const r = Math.sin((i + 1) * 12.9898 + l * 78.233) * 43758.5453
    const f = r - Math.floor(r)
    return { left: i * 13 - 6 + f * 6, top: 20 + f * 40 + l * 6, size: 26 + f * 22 + l * 6 }
  })), [])
  return (
    <div className={`bank bank-${tone}`} aria-hidden="true" data-bank={id}>
      {layers.map((puffs, l) => (
        <div className="bank-layer" data-speed={1 + l * 0.6} key={l}>
          {puffs.map((p, i) => <span key={i} className="puff" style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}vw`, height: `${p.size}vw` }} />)}
        </div>
      ))}
    </div>
  )
}

function Intermission({ n, setup, img, alt, caption, reframe, sub }) {
  return (
    <section className="ife" aria-label={`In-flight entertainment, channel ${n}`}>
      <p className="mono ife-tag">In-flight entertainment · Ch. {n}</p>
      <p className="ife-setup">{setup}</p>
      <figure className="seatback">
        <div className="seatback-screen"><img src={img} alt={alt} loading="lazy" decoding="async" /></div>
        <figcaption>{caption}</figcaption>
      </figure>
      <p className="ife-reframe">{reframe}</p>
      <p className="ife-sub">{sub}</p>
    </section>
  )
}

function Sensor({ x, y, label }) {
  return (
    <span className="sensor" style={{ left: `${x}%`, top: `${y}%` }}>
      <i /><i className="pk" /><i className="pk" /><i className="pk" />
      <b className="mono">{label}</b>
    </span>
  )
}

/* ---------- sections ---------- */

function Floor() {
  return (
    <section id="floor" className="floor" data-alt="0" data-tone="night" aria-labelledby="name">
      <div className="floor-inner">
        <p className="mono kicker">Ground level · 0 ft · Kanchipuram, Tamil Nadu</p>
        <h1 id="name" className="title">
          <span className="t-line">Krishna</span>
          <span className="t-line">Raju S</span>
        </h1>
        <p className="lede"><em>Head in the cloud,</em> boots on the factory floor.</p>
        <p className="role">{me.role}. Associate Engineer at Indo Tech Transformers.</p>
        <div className="dioramas">
          <figure className="dio dio-bay">
            <img src={asset('img/gen/test-bay.jpg')} alt="Isometric miniature of a transformer test bay behind a yellow safety fence" width="1600" height="893" />
            <Sensor x={46} y={30} label="CT" />
            <Sensor x={66} y={44} label="kWh" />
            <Sensor x={34} y={56} label="°C" />
          </figure>
          <figure className="dio dio-desk">
            <img src={asset('img/gen/desk.jpg')} alt="Isometric desk with nine floating glass app windows" width="1600" height="893" />
          </figure>
        </div>
        <div className="climb-captions" aria-hidden="true">
          <p>0 ft: a 161 kV test bay.</p>
          <p>Sensors talk. Energy meters talk.</p>
          <p>Somebody has to carry it all to the cloud.</p>
        </div>
        <p className="scroll-cue mono">Scroll to take off ↑</p>
      </div>
    </section>
  )
}

function Preflight() {
  return (
    <section id="preflight" className="band" data-alt="0.16" data-tone="night" aria-labelledby="pf-h">
      <p className="mono kicker">Pre-flight check · 2,000 ft</p>
      <h2 id="pf-h" className="h2">Forecast: <em>100% chance</em> of automation.</h2>
      <p className="sub">He leads the OT-IT integration of sensors, energy meters and cloud at Indo Tech. Before take-off, the numbers.</p>
      <ul className="gauges">
        {numbers.map((n) => (
          <li key={n.label} className="gauge">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52" className="g-bezel" />
              {Array.from({ length: 24 }, (_, i) => {
                const a = (i / 24) * Math.PI * 1.5 + Math.PI * 0.75
                return <line key={i} x1={60 + Math.cos(a) * 44} y1={60 + Math.sin(a) * 44} x2={60 + Math.cos(a) * (i % 4 ? 47 : 50)} y2={60 + Math.sin(a) * (i % 4 ? 47 : 50)} className="g-tick" />
              })}
              <line x1="60" y1="60" x2="60" y2="20" className="g-needle" />
            </svg>
            <p className="g-value"><span className="count" data-to={n.value}>{n.value}</span><small>{n.unit}</small></p>
            <p className="g-label">{n.label}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Climb() {
  const buhler = field[0]
  return (
    <section id="climb" className="band climb" data-alt="0.28" data-tone="night" aria-labelledby="climb-h">
      <p className="mono kicker">Climb log · 2023 → 2026</p>
      <h2 id="climb-h" className="h2">Five stops. Railway yard to <em>test bay.</em></h2>
      <ol className="waypoints">
        {experience.map((e, i) => (
          <li key={e.id} className={`wpt ${i % 2 ? 'right' : 'left'}`}>
            <p className="mono wpt-tag">WPT 0{i + 1} · {e.year} · {fmt(1500 + i * 1500)} ft</p>
            <div className="glass">
              <h3>{e.company}</h3>
              <p className="wpt-role">{e.role} · {e.place}</p>
              <p className="wpt-short">{e.short}</p>
              <p>{e.text}</p>
              {e.id === 'buhler' && (
                <p><a href={buhler.link.url} target="_blank" rel="noreferrer">{buhler.link.label} ↗</a></p>
              )}
            </div>
            {e.photo && <figure className="polaroid"><img src={e.photo} alt={e.photoAlt} loading="lazy" decoding="async" /></figure>}
            {e.id === 'buhler' && (
              <div className="field-strip">
                {buhler.photos.map((p) => (
                  <figure key={p.src} className="polaroid small"><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /><figcaption>{p.caption}</figcaption></figure>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

const NODE_POS = [[3, 4], [38, 0], [73, 7], [7, 38], [42, 33], [77, 42], [1, 74], [37, 70], [72, 80]]
const LINKS = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [4, 7], [5, 8], [6, 7], [7, 8]]

function Cloud() {
  const c = (i) => [NODE_POS[i][0] + 3, NODE_POS[i][1] + 5]
  return (
    <section id="cloud" className="band cloud" data-alt="0.55" data-tone="cloud" aria-labelledby="cloud-h">
      <p className="mono kicker">Entering the cloud · 19,800 ft · Visibility: nine apps</p>
      <h2 id="cloud-h" className="h2">Nine apps. One factory. <em>Zero spreadsheets</em> left behind.</h2>
      <p className="sub">Everyone talks about moving to the cloud. He moved the paperwork. All nine are in production at Indo Tech Transformers.</p>
      <div className="mesh">
        <svg className="mesh-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {LINKS.map(([a, b], i) => {
            const [x1, y1] = c(a), [x2, y2] = c(b)
            return (
              <g key={i}>
                <path id={`ln${i}`} d={`M${x1} ${y1} L${x2} ${y2}`} className="mesh-line" />
                {!reduced && (
                  <circle r="0.5" className="mesh-pk">
                    <animateMotion dur={`${3 + (i % 4)}s`} repeatCount="indefinite" begin={`${i * 0.4}s`}><mpath href={`#ln${i}`} /></animateMotion>
                  </circle>
                )}
              </g>
            )
          })}
        </svg>
        <ul className="nodes">
          {apps.map((a, i) => {
            const inner = (<><span className="orb" aria-hidden="true" /><b>{a.name}</b><span>{a.pitch}</span></>)
            return (
              <li key={a.name} className="node" style={{ '--x': `${NODE_POS[i][0]}%`, '--y': `${NODE_POS[i][1]}%`, '--d': `${i * -0.7}s` }}>
                {a.url ? <a href={a.url} target="_blank" rel="noreferrer" aria-label={`${a.name}: ${a.pitch} (opens in a new tab)`}>{inner}</a> : <div>{inner}</div>}
              </li>
            )
          })}
        </ul>
      </div>
      <div className="forming">
        {building.map((b) => (
          <p key={b.name}><span className="orb dashed" aria-hidden="true" /> <b>{b.name}</b>: {b.pitch} <span className="mono">Still forming · {b.status}</span></p>
        ))}
      </div>
      <h3 className="h3">Smaller craft</h3>
      <ul className="craft">
        {sideProjects.map((p) => (
          <li key={p.name} className="glass">
            {p.url ? <a href={p.url} target="_blank" rel="noreferrer"><b>{p.name} ↗</b></a> : <b>{p.name}</b>}
            <span>{p.pitch}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Autopilot() {
  const v = ai.agent.versions
  return (
    <section id="autopilot" className="band autopilot" data-alt="0.76" data-tone="gold" aria-labelledby="ap-h">
      <p className="mono kicker">Above the clouds · 27,400 ft · Cruising on autopilot</p>
      <h2 id="ap-h" className="h2">The autopilot <em>he built himself.</em></h2>
      <p className="sub"><b>{ai.agent.name}.</b> {ai.agent.pitch}</p>
      <ol className="levels" aria-label="Agent-Builder versions">
        {v.map((name, i) => (
          <li key={name} style={{ '--i': i }}>
            <span className="mono">FL{String((i + 1) * 10).padStart(3, '0')}</span>
            <b>{name}</b>
          </li>
        ))}
      </ol>
      <div className="ai-grid">
        <div className="glass">
          <p className="mono">Jet stream</p>
          <h3>{ai.rag.name}</h3>
          <p>{ai.rag.pitch}</p>
          <ol className="stream">{ai.rag.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
        <div className="glass">
          <p className="mono">Onboard, no ground link</p>
          <h3>{ai.browser.name}</h3>
          <p>{ai.browser.pitch}</p>
          <ul className="chips">{ai.stack.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </div>
    </section>
  )
}

function weatherOf(n) {
  return n === 0 ? 'Clear skies' : n < 3 ? 'Drizzle' : n < 7 ? 'Showers' : n < 20 ? 'Heavy rain' : 'Thunderstorm'
}
const longDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

function Rain({ days, best }) {
  const ref = useRef(null)
  const hoverRef = useRef(null)
  const [hover, setHover] = useState(null)
  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const bestIdx = days.findIndex((d) => d[0] === best.date)
    const max = Math.max(1, ...days.map((d) => d[1]))
    let W = 0, H = 0, colW = 1, drops = [], splashes = [], bolt = 0, nextBolt = 1.5, visible = false, last = performance.now()
    const size = () => {
      const r = cv.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = r.width; H = r.height
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      colW = W / days.length
    }
    const cover = (n) => 10 + Math.sqrt(n / max) * H * 0.32
    const draw = (dt) => {
      ctx.clearRect(0, 0, W, H)
      const ground = H - 2
      // rain
      if (!reduced) {
        days.forEach(([, n], i) => {
          if (!n) return
          const rate = Math.min(n, 30) * 0.9 * dt
          if (Math.random() < rate) drops.push({ x: (i + Math.random()) * colW, y: cover(n), v: 220 + Math.random() * 120, l: 5 + Math.random() * 6 })
        })
        ctx.strokeStyle = 'rgba(70, 110, 190, 0.75)'
        ctx.lineWidth = 1
        ctx.beginPath()
        drops = drops.filter((d) => {
          d.y += d.v * dt
          if (d.y > ground) { splashes.push({ x: d.x, r: 0.5, a: 0.8 }); return false }
          ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 0.6, d.y - d.l)
          return true
        }).slice(-900)
        ctx.stroke()
        splashes = splashes.filter((s) => {
          s.r += dt * 18; s.a -= dt * 2.6
          if (s.a <= 0) return false
          ctx.strokeStyle = `rgba(70,110,190,${s.a})`
          ctx.beginPath(); ctx.ellipse(s.x, ground, s.r, s.r * 0.3, 0, 0, Math.PI * 2); ctx.stroke()
          return true
        })
      } else {
        ctx.strokeStyle = 'rgba(70, 110, 190, 0.6)'
        days.forEach(([, n], i) => {
          if (!n) return
          ctx.beginPath(); ctx.moveTo((i + 0.5) * colW, cover(n) + 4); ctx.lineTo((i + 0.5) * colW, cover(n) + 4 + Math.sqrt(n) * 14); ctx.stroke()
        })
      }
      // cloud cover: one soft line of cloud, thicker on busier days
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      days.forEach(([, n], i) => ctx.lineTo((i + 0.5) * colW, cover(n)))
      ctx.lineTo(W, 0)
      ctx.closePath()
      ctx.fill()
      // the storm
      const bx = (bestIdx + 0.5) * colW
      const sy = cover(best.contributionCount)
      ctx.fillStyle = '#3a3f58'
      for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.arc(bx + k * 9, sy - 6 + Math.abs(k) * 3, 16 - Math.abs(k) * 2, 0, Math.PI * 2); ctx.fill() }
      if (!reduced) {
        nextBolt -= dt
        if (nextBolt <= 0) { bolt = 0.16; nextBolt = 2.4 + Math.random() * 3; S.flash = 0.7 }
      }
      if (bolt > 0 || reduced) {
        bolt -= dt
        ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 2.5
        ctx.beginPath()
        let x = bx, y = sy + 8
        ctx.moveTo(x, y)
        const seg = (ground - y) / 6
        for (let s = 0; s < 6; s++) { x += (s % 2 ? 7 : -7); y += seg; ctx.lineTo(x, y) }
        ctx.stroke()
        ctx.lineWidth = 1
      }
      if (hoverRef.current != null) {
        ctx.fillStyle = 'rgba(40, 30, 20, 0.14)'
        ctx.fillRect(hoverRef.current * colW, 0, Math.max(colW, 2), H)
      }
    }
    const frame = () => {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (visible && !document.hidden) draw(dt)
    }
    size()
    draw(0)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(cv)
    const ro = new ResizeObserver(() => { size(); draw(0) })
    ro.observe(cv)
    if (!reduced) gsap.ticker.add(frame)
    return () => { gsap.ticker.remove(frame); io.disconnect(); ro.disconnect() }
  }, [days, best])
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.max(0, Math.min(days.length - 1, Math.floor(((e.clientX - r.left) / r.width) * days.length)))
    hoverRef.current = i
    setHover(i)
  }
  const months = days.map((d, i) => [d[0], i]).filter(([d]) => d.endsWith('-01'))
  const h = hover != null ? days[hover] : [best.date, best.contributionCount]
  return (
    <figure className="rain">
      <canvas ref={ref} onPointerMove={pick} onPointerLeave={() => { hoverRef.current = null; setHover(null) }}
        role="img" aria-label={`Contribution weather for the last year: ${days.filter((d) => d[1]).length} days with rain, heaviest on ${longDate(best.date)} with ${best.contributionCount} contributions.`} />
      <div className="months mono" aria-hidden="true">
        {months.map(([d, i]) => <span key={d} style={{ left: `${(i / days.length) * 100}%` }}>{new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { month: 'short' })}</span>)}
      </div>
      <figcaption className="mono readout" aria-live="polite">
        {longDate(h[0])} · {h[1]} contribution{h[1] === 1 ? '' : 's'} · {weatherOf(h[1])}
      </figcaption>
    </figure>
  )
}

const LANG = { JavaScript: 48, TypeScript: 212, Python: 200, HTML: 18, CSS: 268, Jupyter: 30 }
function hue(r) {
  if (r.language && LANG[r.language] != null) return LANG[r.language]
  let h = 0
  for (const ch of r.name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

function Weather({ gh, live }) {
  const wet = gh.days.filter((d) => d[1]).length
  return (
    <section id="weather" className="band weather" data-alt="0.86" data-tone="gold" aria-labelledby="wx-h">
      <p className="mono kicker">Weather report · {live ? 'live from GitHub' : `snapshot ${gh.snapshotAt.slice(0, 10)}`} · @{gh.login}</p>
      <h2 id="wx-h" className="h2">{gh.contributionsLastYear} contributions. Scattered showers, <em>one thunderstorm.</em></h2>
      <div className="wx-stats">
        <p><b>{gh.commitsLastYear}</b> commits</p>
        <p><b>{gh.prsLastYear}</b> pull requests</p>
        <p><b>{wet}</b> wet days of {gh.days.length}</p>
        <p><b>{new Date(`${gh.joined}T00:00:00`).getFullYear()}</b> flying since {longDate(gh.joined)}</p>
      </div>
      <Rain days={gh.days} best={gh.bestDay} />
      <p className="storm-note">⚡ Peak storm: <b>{longDate(gh.bestDay.date)}</b>, {gh.bestDay.contributionCount} contributions in one day. Hover the chart for any day&apos;s weather.</p>
      <blockquote className="remarks glass">
        <p className="mono">Pilot&apos;s remarks (GitHub bio)</p>
        {gh.bio.split('\n').map((l) => <p key={l}>{l}</p>)}
      </blockquote>
      <h3 className="h3">{gh.repos.length} weather balloons up. Each one a public repo.</h3>
      <ul className="balloons">
        {gh.repos.map((r, i) => {
          const s = 0.75 + Math.min(1, Math.log10(Math.max(10, r.sizeKB)) / 5) * 0.6
          return (
            <li key={r.name} style={{ '--s': s, '--h': hue(r), '--d': `${(i % 7) * -0.9}s`, '--o': `${(i * 37) % 60}px` }}>
              <a href={r.url} target="_blank" rel="noreferrer" title={r.description || r.name} aria-label={`${r.name}${r.description ? `: ${r.description}` : ''} (opens GitHub)`}>
                <span className="envelope" aria-hidden="true" />
                <span className="string" aria-hidden="true" />
                <span className="tag"><b>{r.name}</b>{r.language && <small>{r.language}</small>}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Log() {
  return (
    <section id="log" className="band log" data-alt="0.93" data-tone="gold" aria-labelledby="log-h">
      <p className="mono kicker">Flight log · ground crew included</p>
      <h2 id="log-h" className="h2">Rank 7 of 1500+ colleges. <em>Logged, not bragged.</em></h2>
      <ol className="awards">
        {awards.map((a) => (
          <li key={a.title} className={a.photo ? 'has-photo' : ''}>
            <span className="mono">{a.year}</span>
            <div><b>{a.title}</b><span>{a.detail}</span></div>
            {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" decoding="async" />}
          </li>
        ))}
      </ol>
      <div className="pass">
        <div className="pass-main">
          <p className="mono">Boarding pass · crew</p>
          <h3>{leadership.title}</h3>
          <p>{leadership.text}</p>
          <p className="mono pass-row"><span>From: scratch</span><span>To: a full E-Cell team</span><span>Audience: 500+ students</span></p>
        </div>
        <div className="pass-photos">
          {leadership.photos.map((p) => <img key={p.src} src={p.src} alt={p.alt} loading="lazy" decoding="async" />)}
        </div>
      </div>
      <div className="manifest">
        <h3 className="h3">Cargo manifest</h3>
        <div className="manifest-grid">
          {Object.entries(skills).map(([k, list]) => (
            <div key={k} className="glass"><p className="mono">{k}</p><ul className="chips">{list.map((s) => <li key={s}>{s}</li>)}</ul></div>
          ))}
          <div className="glass"><p className="mono">Papers on board</p><ul className="certs">{certifications.map((c) => <li key={c}>{c}</li>)}</ul></div>
        </div>
      </div>
    </section>
  )
}

function Summit({ planeParked, onPlane }) {
  const balloon = useRef(null)
  const [msg, setMsg] = useState('')
  const release = () => {
    setMsg('Balloon away. Opening your email…')
    if (reduced) { window.location.href = mailto; return }
    gsap.timeline({ onComplete: () => { window.location.href = mailto } })
      .to(balloon.current, { scale: 1.12, duration: 0.35, ease: 'back.out(3)' })
      .to(balloon.current, { y: -window.innerHeight * 1.1, x: 60, rotation: 8, duration: 2.2, ease: 'power1.in' })
      .set(balloon.current, { y: 0, x: 0, rotation: 0, scale: 1, delay: 0.6 })
  }
  return (
    <section id="summit" className="band summit" data-alt="1" data-tone="gold" aria-labelledby="sum-h">
      <div className="summit-bg" aria-hidden="true"><img src={asset('img/pins/golden.jpg')} alt="" loading="lazy" decoding="async" /></div>
      <div className="summit-inner">
        <p className="mono kicker">Top of climb · {fmt(CEILING)} ft · Now back down to earth</p>
        <h2 id="sum-h" className="h2">{me.lines[1]}</h2>
        <p className="sub">{me.lines[2]}</p>
        <div className="cta">
          <button type="button" className="cta-balloon" onClick={release} aria-describedby="cta-tag">
            <span ref={balloon} className="big-balloon" aria-hidden="true"><span className="envelope" /><span className="string" /><span className="tag mono" id="cta-tag">{me.email}</span></span>
            <span className="cta-label">Let go of the balloon</span>
          </button>
          <div className="cta-plain">
            <p>It knows the way to his inbox. Or skip the weather:</p>
            <ul className="links">
              <li><a href={`mailto:${me.email}`}>Email {me.email}</a></li>
              <li><a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a href={me.github} target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href={me.resume} download>Resume (PDF)</a></li>
            </ul>
          </div>
          <p className="sr-only" aria-live="polite">{msg}</p>
        </div>
        {planeParked && (
          <button type="button" className="plane parked" onClick={onPlane} aria-label="A paper plane landed here. Open it.">
            <PlaneIcon /><span className="mono">A paper plane landed here.</span>
          </button>
        )}
        <footer className="foot">
          <p className="foot-line">{me.lines[3]}</p>
          <p className="mono">Factory renders: 3D renders generated with Higgsfield from the owner&apos;s own photo. Skies from the owner&apos;s Pinterest boards. Song: “Chasing Kou”.</p>
        </footer>
      </div>
    </section>
  )
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true" className="plane-svg">
      <path d="M2 18 62 2 26 38 22 24Z" fill="#fffaf0" stroke="#2b1508" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M22 24 62 2 30 26Z" fill="#e9dcc4" stroke="#2b1508" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- the app ---------- */

export default function App() {
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const noteRef = useRef(null)
  const planeRef = useRef(null)
  const planeTl = useRef(null)
  const hud = useRef({})
  const [intro, setIntro] = useState(!reduced)
  const [checks, setChecks] = useState({ fonts: 'loading', sky: reduced ? 'painted (reduced motion)' : 'compiling', song: 'buffering', photos: 'loading' })
  const [gh, setGh] = useState(snapshot)
  const [live, setLive] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [caughtAt, setCaughtAt] = useState(0)

  const [music, setMusic] = useMusic(() => audioRef.current, (ctx, src) => {
    const an = ctx.createAnalyser()
    an.fftSize = 256
    src.connect(an)
    an.connect(ctx.destination)
    audio.analyser = an
    audio.data = new Uint8Array(an.frequencyBinCount)
  })

  // GitHub refresh (repos), snapshot otherwise.
  useEffect(() => {
    const ac = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        setGh((g) => ({
          ...g,
          repos: list.filter((r) => !r.fork).map((r) => ({
            name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
            sizeKB: r.size, pushedAt: (r.pushed_at || '').slice(0, 10), homepage: r.homepage, url: r.html_url,
          })),
        }))
        setLive(true)
      })
      .catch(() => {})
    return () => ac.abort()
  }, [])

  // Pre-flight checks that tell the truth.
  useEffect(() => {
    document.fonts?.ready.then(() => setChecks((c) => ({ ...c, fonts: 'ok' })))
    const imgs = ['img/gen/test-bay.jpg', 'img/gen/desk.jpg'].map((p) => new Promise((res) => { const i = new Image(); i.onload = i.onerror = res; i.src = asset(p) }))
    Promise.all(imgs).then(() => setChecks((c) => ({ ...c, photos: 'ok' })))
    const a = audioRef.current
    const ready = () => setChecks((c) => ({ ...c, song: 'ok' }))
    if (a.readyState >= 3) ready()
    a.addEventListener('canplay', ready)
    const on = () => setPlaying(true), off = () => setPlaying(false)
    a.addEventListener('play', on)
    a.addEventListener('pause', off)
    return () => { a.removeEventListener('canplay', ready); a.removeEventListener('play', on); a.removeEventListener('pause', off) }
  }, [])

  // The sky (lazy), Lenis, the one ticker loop, pointer, beat.
  useEffect(() => {
    let dispose = null
    if (!reduced) {
      import('./sky.js')
        .then((m) => { dispose = m.mountSky(canvasRef.current, S, gsap.ticker); setChecks((c) => ({ ...c, sky: 'ok' })) })
        .catch(() => setChecks((c) => ({ ...c, sky: 'painted backup' })))
      lenis = new Lenis({ lerp: 0.09 })
      lenis.on('scroll', ScrollTrigger.update)
    }
    const tick = (t) => {
      lenis?.raf(t * 1000)
      if (audio.analyser && !audioRef.current.paused) {
        audio.analyser.getByteFrequencyData(audio.data)
        let sum = 0
        for (let i = 1; i < 10; i++) sum += audio.data[i]
        const v = clamp01((sum / 9 / 255 - 0.45) * 2.4)
        S.beat = Math.max(S.beat * 0.9, v)
      } else S.beat *= 0.9
      document.documentElement.style.setProperty('--beat', S.beat.toFixed(3))
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const move = (e) => { S.px = (e.clientX / window.innerWidth) * 2 - 1; S.py = -((e.clientY / window.innerHeight) * 2 - 1) }
    window.addEventListener('pointermove', move, { passive: true })
    return () => { gsap.ticker.remove(tick); window.removeEventListener('pointermove', move); dispose?.(); lenis?.destroy(); lenis = null }
  }, [])

  // Altitude: interpolate the chapters' data-alt around the middle of the screen.
  useEffect(() => {
    let marks = []
    const measure = () => {
      marks = CHAPTERS.map((c) => {
        const el = document.getElementById(c.id)
        const r = el.getBoundingClientRect()
        return { ...c, mid: r.top + window.scrollY + Math.min(r.height, window.innerHeight) / 2, top: r.top + window.scrollY }
      })
      marks[0].mid = window.innerHeight / 2
    }
    let lastFt = -1, lastY = window.scrollY, lastT = performance.now()
    const update = () => {
      if (!marks.length) measure()
      const y = window.scrollY + window.innerHeight / 2
      let alt = 0
      if (y >= marks.at(-1).mid) alt = 1
      else for (let i = 1; i < marks.length; i++) {
        if (y < marks[i].mid) { alt = lerp(marks[i - 1].alt, marks[i].alt, clamp01((y - marks[i - 1].mid) / (marks[i].mid - marks[i - 1].mid))); break }
      }
      const [h, p, g] = camera(alt)
      S.h = h; S.pitch = p; S.gold = g
      const ft = Math.round((alt * CEILING) / 10) * 10
      const now = performance.now()
      const rate = Math.round(((window.scrollY - lastY) / Math.max(1, now - lastT)) * 60000 * (CEILING / document.documentElement.scrollHeight) / 100) * 100
      lastY = window.scrollY; lastT = now
      if (ft !== lastFt && hud.current.ft) {
        lastFt = ft
        hud.current.ft.textContent = fmt(ft)
        hud.current.layer.textContent = layerName(alt)
        hud.current.vs.textContent = `${rate >= 0 ? '▲' : '▼'} ${fmt(Math.abs(rate))} ft/min`
        hud.current.bar.style.transform = `scaleY(${alt})`
        let cur = 0
        marks.forEach((m, i) => { if (window.scrollY + window.innerHeight * 0.5 >= m.top) cur = i })
        hud.current.list?.querySelectorAll('a').forEach((a, i) => a.toggleAttribute('aria-current', i === cur))
        document.documentElement.dataset.tone = alt < 0.42 ? 'night' : alt < 0.62 ? 'cloud' : 'gold'
      }
    }
    ScrollTrigger.addEventListener('refresh', measure)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', measure)
    const t = setTimeout(() => { measure(); update() }, 100)
    return () => { clearTimeout(t); ScrollTrigger.removeEventListener('refresh', measure); window.removeEventListener('scroll', update); window.removeEventListener('resize', measure) }
  }, [])

  // Scroll choreography.
  useEffect(() => {
    if (reduced) return
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add('(min-width: 760px)', () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: '#floor', start: 'top top', end: '+=170%', scrub: 0.6, pin: true } })
        tl.to('.dio-bay', { yPercent: 70, scale: 0.72, autoAlpha: 0, ease: 'none' }, 0)
          .to('.dio-desk', { yPercent: 90, scale: 0.6, autoAlpha: 0, ease: 'none' }, 0.1)
          .to('.floor .title, .floor .lede, .floor .role, .floor .kicker, .scroll-cue', { yPercent: -60, autoAlpha: 0, stagger: 0.03 }, 0.15)
        gsap.utils.toArray('.climb-captions p').forEach((p, i) => {
          tl.fromTo(p, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.25 + i * 0.3)
          if (i < 2) tl.to(p, { autoAlpha: 0, y: -40, duration: 0.2 }, 0.48 + i * 0.3)
        })
      })
      mm.add('(max-width: 759px)', () => {
        gsap.to('.dioramas', { yPercent: 30, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '#floor', start: 'top top', end: 'bottom top', scrub: true } })
      })

      // Cloud banks: fly through them. Layers move at different speeds.
      gsap.utils.toArray('.bank').forEach((b) => {
        b.querySelectorAll('.bank-layer').forEach((l) => {
          const k = Number(l.dataset.speed)
          gsap.fromTo(l, { yPercent: 40 * k, scale: 0.9 }, { yPercent: -50 * k, scale: 1.25 + k * 0.1, ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } })
        })
      })

      // Things come out of the haze: blur to sharp.
      gsap.utils.toArray('.wpt, .gauge, .node, .craft li, .ai-grid > *, .awards li, .pass, .manifest-grid > *, .wx-stats p').forEach((el) => {
        gsap.from(el, { autoAlpha: 0, y: 60, filter: 'blur(12px)', duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
      gsap.utils.toArray('.h2').forEach((el) => {
        gsap.from(el, { autoAlpha: 0, y: 50, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
      })
      // Gauges: needles sweep, numbers count.
      gsap.utils.toArray('.gauge').forEach((g) => {
        gsap.fromTo(g.querySelector('.g-needle'), { rotation: -135, svgOrigin: '60 60' }, { rotation: 100, svgOrigin: '60 60', duration: 1.8, ease: 'elastic.out(1, 0.5)', scrollTrigger: { trigger: g, start: 'top 85%' } })
        const c = g.querySelector('.count')
        const o = { v: 0 }
        gsap.to(o, { v: Number(c.dataset.to), duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: g, start: 'top 85%' }, onUpdate: () => { c.textContent = Math.round(o.v) } })
      })
      // Flight levels climb in order.
      gsap.from('.levels li', { autoAlpha: 0, y: 40, stagger: 0.08, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: '.levels', start: 'top 80%' } })
      // Balloons are released from below.
      gsap.from('.balloons li', { y: 260, autoAlpha: 0, stagger: { each: 0.06, from: 'random' }, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: '.balloons', start: 'top 85%' } })
      // Meme screens power on.
      gsap.utils.toArray('.seatback-screen').forEach((s) => {
        gsap.fromTo(s, { clipPath: 'inset(49% 0 49% 0)' }, { clipPath: 'inset(0% 0 0% 0)', ease: 'none', scrollTrigger: { trigger: s, start: 'top 85%', end: 'top 45%', scrub: true } })
      })
      gsap.utils.toArray('.ife-reframe').forEach((el) => {
        gsap.from(el, { scale: 0.7, autoAlpha: 0, duration: 0.9, ease: 'back.out(2)', scrollTrigger: { trigger: el, start: 'top 85%' } })
      })
    })
    const r = setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => { clearTimeout(r); ctx.revert(); mm.revert() }
  }, [gh.repos.length])

  // Take off: the entrance assembles in about three seconds.
  const flown = useRef(false)
  const takeoff = () => {
    if (flown.current) return
    flown.current = true
    setIntro(false)
    S.born = performance.now()
    lenis?.start()
    gsap.timeline()
      .from('.dio-bay', { y: 120, scale: 0.85, autoAlpha: 0, filter: 'blur(14px)', duration: 1.6, ease: 'power3.out', clearProps: 'filter' }, 0.2)
      .from('.dio-desk', { y: 160, scale: 0.85, autoAlpha: 0, filter: 'blur(14px)', duration: 1.6, ease: 'power3.out', clearProps: 'filter' }, 0.45)
      .from('.t-line', { yPercent: 110, autoAlpha: 0, stagger: 0.12, duration: 1.1, ease: 'power4.out' }, 0.6)
      .from('.floor .kicker, .floor .lede, .floor .role, .scroll-cue', { y: 20, autoAlpha: 0, stagger: 0.1, duration: 0.8 }, 1.2)
      .from('.sensor', { scale: 0, autoAlpha: 0, stagger: 0.15, duration: 0.6, ease: 'back.out(3)' }, 1.8)
  }
  useEffect(() => {
    if (!intro) { if (reduced) S.born = performance.now(); return }
    lenis?.stop()
    const key = (e) => { if (e.key === 'Escape') takeoff() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [intro])

  // The paper plane: crosses the sky now and then once you're off the ground.
  useEffect(() => {
    if (reduced || intro) return
    const el = planeRef.current
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 11, delay: 9, paused: true })
    tl.set(el, { autoAlpha: 1, x: -120, y: () => window.innerHeight * (0.25 + Math.random() * 0.4), rotation: 6 })
      .to(el, { x: () => window.innerWidth + 120, duration: 10, ease: 'none' })
      .to(el, { y: '-=90', rotation: -8, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: 3 }, '<')
      .set(el, { autoAlpha: 0 })
    planeTl.current = tl
    const st = ScrollTrigger.create({ trigger: '#climb', start: 'top center', endTrigger: '#log', end: 'bottom center', onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) })
    return () => { st.kill(); tl.kill() }
  }, [intro])

  const catchPlane = () => {
    planeTl.current?.pause()
    gsap.set(planeRef.current, { autoAlpha: 0 })
    setCaughtAt(Math.round((parseFloat(hud.current.ft?.textContent.replace(/,/g, '')) || 0)))
    noteRef.current?.showModal()
    lenis?.stop()
  }
  const closeNote = () => { noteRef.current?.close() }

  const go = (id) => (e) => {
    e.preventDefault()
    if (lenis) lenis.scrollTo(`#${id}`, { duration: 2 })
    else document.getElementById(id)?.scrollIntoView()
  }

  return (
    <>
      <a className="skip" href="#preflight">Skip to content</a>
      <canvas ref={canvasRef} className="sky" aria-hidden="true" />
      <audio ref={audioRef} src={asset('audio/chasing-kou.mp3')} loop preload="auto" />

      {intro && (
        <div className="preflight-screen" role="dialog" aria-modal="true" aria-labelledby="pf-title">
          <p className="mono">CLOUDLINE · KR-29 · Gate: Indo Tech, Kanchipuram</p>
          <h2 id="pf-title" className="pf-title">From the factory floor <em>to the cloud.</em></h2>
          <ul className="mono pf-list">
            <li><span>fonts</span><span>{checks.fonts}</span></li>
            <li><span>sky shader</span><span>{checks.sky}</span></li>
            <li><span>photos</span><span>{checks.photos}</span></li>
            <li><span>song: “Chasing Kou”</span><span>{music ? checks.song : 'off (your choice)'}</span></li>
            <li><span>sensors, meters, packets</span><span>{checks.sky === 'ok' ? 'ok' : 'standing by'}</span></li>
          </ul>
          <button type="button" className="pf-go" onClick={takeoff} autoFocus>Take off <span className="mono">Enter</span></button>
          <button type="button" className="pf-skip mono" onClick={takeoff}>Skip intro (Esc)</button>
        </div>
      )}

      <aside className="hud" aria-label="Altimeter and chapters">
        <div className="alt-tape" aria-hidden="true"><i ref={(n) => (hud.current.bar = n)} /></div>
        <p className="mono hud-alt"><span>ALT</span> <b ref={(n) => (hud.current.ft = n)}>0</b> <span>ft</span></p>
        <p className="mono hud-vs" ref={(n) => (hud.current.vs = n)}>▲ 0 ft/min</p>
        <p className="mono hud-layer" ref={(n) => (hud.current.layer = n)}>Factory floor</p>
        <nav aria-label="Chapters">
          <ol ref={(n) => (hud.current.list = n)}>
            {CHAPTERS.map((c, i) => <li key={c.id}><a href={`#${c.id}`} onClick={go(c.id)}><span className="mono">0{i + 1}</span> {c.label}</a></li>)}
          </ol>
        </nav>
        <p className="mono hud-traffic">Traffic: 1 paper plane, unidentified</p>
      </aside>

      <button type="button" className="music" data-music aria-pressed={!music} onClick={() => setMusic(!music)}>
        <span className="eq" aria-hidden="true"><i /><i /><i /><i /></span>
        {music ? 'Music off' : 'Music on'}
        <span className="mono now">{playing ? 'Chasing Kou · piano' : music ? 'waiting for a tap' : 'muted'}</span>
      </button>

      {!reduced && (
        <button type="button" ref={planeRef} className="plane flying" onClick={catchPlane} aria-label="Catch the paper plane">
          <PlaneIcon />
        </button>
      )}

      <main>
        <Floor />
        <Bank id="haze" tone="night" />
        <Preflight />
        <Climb />
        <Intermission
          n={1}
          setup="Before: hardware documentation sized by hand in Excel. 30 to 40 minutes a project."
          img={asset('img/pins/scared-tired.jpg')}
          alt="A chrome figure clutching its head against a red background, glowing eyes, looking overwhelmed"
          caption="The spreadsheet at minute 39."
          reframe="Under 30 seconds. 90% fewer calculation errors."
          sub="The GUI automation tool he co-developed at Bühler India. One Excel in, the load and I/O card sheet out."
        />
        <Bank id="base" tone="white" />
        <Cloud />
        <Intermission
          n={2}
          setup="“Test planning? Two hours per unit. That's just how it's done.”"
          img={asset('img/pins/jesse.jpg')}
          alt="Jesse Pinkman leaning out of a red car window, side-eyeing the camera"
          caption="Him, hearing “that's just how it's done”."
          reframe="2 hours → 5 minutes."
          sub="Transformer Test Planner: every IEC 60076 test, planned per unit, at Indo Tech Transformers."
        />
        <Bank id="tops" tone="gold" />
        <Autopilot />
        <Weather gh={gh} live={live} />
        <Log />
        <Summit planeParked={reduced} onPlane={catchPlane} />
      </main>

      <dialog ref={noteRef} className="note" aria-labelledby="note-h" onClose={() => { lenis?.start(); planeTl.current?.play() }}>
        <p className="mono">Caught at {fmt(caughtAt)} ft · folded twice</p>
        <h2 id="note-h">You caught it. Most people scroll right past.</h2>
        <p className="note-hand">“{me.lines[1]}”</p>
        <p>The plane was carrying his resume all along. Unfold it properly:</p>
        <p className="note-actions">
          <a href={me.resume} download className="note-btn">Download the resume (PDF)</a>
          <a href={`mailto:${me.email}`}>or write to {me.email}</a>
        </p>
        <p className="mono">P.S. from the GitHub bio: “Then pretend it was ‘team effort’ 😏”</p>
        <button type="button" className="note-close" onClick={closeNote}>Fold it back up</button>
      </dialog>
    </>
  )
}

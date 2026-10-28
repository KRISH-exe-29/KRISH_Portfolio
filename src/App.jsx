import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills, asset,
} from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)

const SONG = 'Great Fairy Fountain'
const MAIL = `mailto:${me.email}?subject=${encodeURIComponent('A commission: one manual step to automate')}`
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
let lenis = null

const hashStr = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0 }
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// One star per day with contributions, in date order, brighter by count. The best day is the moon (index 0).
function skyStars(days) {
  const lit = days.filter(([, c]) => c > 0)
  if (!lit.length) return []
  const max = Math.max(...lit.map(([, c]) => c))
  const best = lit.find(([, c]) => c === max)
  const stars = lit.map(([d, c], k) => {
    const t = lit.length > 1 ? k / (lit.length - 1) : 0.5
    const moon = d === best[0]
    const j = (hashStr(d) % 1000) / 1000 - 0.5
    return {
      date: d, count: c, moon,
      x: 0.06 + 0.88 * t,
      y: moon ? 0.8 : 0.62 + 0.16 * Math.sin(t * Math.PI) + j * 0.12,
      b: 0.35 + 0.65 * Math.sqrt(c / max),
      r: moon ? 0.055 : 0.007 + 0.0032 * Math.sqrt(c),
    }
  })
  return [stars.find((s) => s.moon), ...stars.filter((s) => !s.moon)]
}

// A small repeatable constellation per repo, in a 0..1 box.
function constellation(name) {
  let h = hashStr(name)
  const next = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return (h % 1000) / 1000 }
  const n = 3 + (hashStr(name) % 4)
  return Array.from({ length: n }, (_, i) => [0.1 + 0.8 * ((i + next() * 0.8) / n), 0.15 + 0.7 * next()])
}

/* ---------- small pieces ---------- */

function Label({ title, medium, children, className = '' }) {
  return (
    <div className={'label ' + className}>
      <h3>{title}</h3>
      {medium && <p className="medium">{medium}</p>}
      {children}
    </div>
  )
}

function Painting({ src, alt, ratio, children, className = '' }) {
  return (
    <div className={'gilt ' + className}>
      <div className="canvas" style={ratio ? { aspectRatio: ratio } : undefined}>
        {src ? <img src={src} alt={alt} loading="lazy" decoding="async" /> : children}
      </div>
    </div>
  )
}

// A brushstroke dragged across the page between rooms: the section transition.
function Stroke({ flip }) {
  return (
    <div className={'stroke' + (flip ? ' flip' : '')} aria-hidden="true">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path pathLength="1" d="M-20 70 C 200 20, 380 110, 600 60 S 980 20, 1220 66" />
        <path pathLength="1" className="thin" d="M-20 84 C 220 44, 420 118, 640 76 S 1000 40, 1220 82" />
      </svg>
    </div>
  )
}

function Room({ id, n, title, intro, children, className = '' }) {
  return (
    <section id={id} className={'room ' + className} aria-labelledby={id + '-h'}>
      <header className="room-head">
        <p className="room-n">Room {n}</p>
        <h2 id={id + '-h'}>{title}</h2>
        {intro && <p className="room-intro">{intro}</p>}
      </header>
      {children}
    </section>
  )
}

/* ---------- rooms ---------- */

const MEDIUM = {
  railway: 'Oil on 110 V lead-acid.',
  mettur: 'Oil on 4 x 210 MW.',
  inovate: 'Oil on Project: Phantom.',
  buhler: 'Oil on Excel, retired.',
  indotech: 'Oil on 161 kV.',
}
const UNPAINTED = { mettur: '4 x 210 MW', inovate: 'Project: Phantom' }

function Villages() {
  return (
    <section id="villages" className="villages" aria-labelledby="villages-h">
      <div className="track">
        <header className="slide slide-intro">
          <p className="room-n">Room II</p>
          <h2 id="villages-h">Five villages, one road</h2>
          <p className="room-intro">Every stop on the way hangs where it happened. Keep scrolling: the landscape moves, you stand still. Like a commute, but in oil.</p>
        </header>
        {experience.map((x) => (
          <article className="slide" key={x.id}>
            <Painting src={x.photo} alt={x.photoAlt} ratio={x.photo ? undefined : '4 / 5'} className="village-art">
              <div className="unpainted"><span>{UNPAINTED[x.id]}</span></div>
            </Painting>
            <Label title={`${x.company}, ${x.year}`} medium={MEDIUM[x.id]}>
              <p className="role">{x.role} · {x.place}</p>
              <p>{x.text}</p>
              {!x.photo && <p className="note">No photograph on loan. Painted from the label.</p>}
            </Label>
          </article>
        ))}
      </div>
    </section>
  )
}

function Interval({ id, title, img, alt, label, original, note }) {
  return (
    <section id={id} className="interval" aria-label={'Interval: ' + title}>
      <p className="room-n">Interval</p>
      <div className="interval-wall">
        <Painting src={img} alt={alt} className="meme" />
        <div className="interval-text">
          <Label title={title} medium="On loan from the internet.">
            <p>{label}</p>
            {original && <p className="note">{original}</p>}
          </Label>
          <blockquote className="curator">
            <p className="curator-k">Curator&rsquo;s note</p>
            <p>{note}</p>
          </blockquote>
        </div>
      </div>
    </section>
  )
}

function Collection() {
  return (
    <Room id="collection" n="III" title="The Collection" intro="Nine apps, one factory. Old frames, new software. Every piece is in daily use at Indo Tech Transformers, which is more than most museum pieces can say.">
      <ul className="apps">
        {apps.map((a, i) => (
          <li key={a.name} className="piece">
            <div className="gilt small">
              <div className="canvas app-win">
                <div className="chrome" aria-hidden="true"><i /><i /><i /><span>{String(i + 1).padStart(2, '0')}</span></div>
                <p>{a.pitch}</p>
              </div>
            </div>
            <div className="label">
              <h3>{a.name}</h3>
              <p className="medium">Software. Collection of Indo Tech Transformers.</p>
              {a.url ? <a href={a.url} target="_blank" rel="noreferrer">View the piece<span className="sr"> {a.name} (opens in a new tab)</span></a> : <p className="note">Private collection. Factory floor only.</p>}
            </div>
          </li>
        ))}
        {building.map((b) => (
          <li key={b.name} className="piece wip">
            <div className="gilt small"><div className="canvas app-win wet"><p>{b.pitch}</p></div></div>
            <div className="label">
              <h3>{b.name}</h3>
              <p className="medium">Work in progress, {b.status}.</p>
              <p className="note">Paint still wet. Please don&rsquo;t touch.</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="ai">
        <div className="ai-block">
          <h3 className="ai-h">{ai.agent.name}: a polyptych in {ai.agent.versions.length} panels</h3>
          <p>{ai.agent.pitch}</p>
          <ol className="polyptych">
            {ai.agent.versions.map((v, i) => <li key={v}><b>v{i + 1}</b><span>{v}</span></li>)}
          </ol>
        </div>
        <div className="ai-block">
          <h3 className="ai-h">{ai.rag.name}: a predella in {ai.rag.steps.length} scenes</h3>
          <p>{ai.rag.pitch}</p>
          <ol className="predella">{ai.rag.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <h3 className="ai-h">{ai.browser.name}</h3>
          <p>{ai.browser.pitch}</p>
          <p className="pigments">Pigments: {ai.stack.join(', ')}.</p>
        </div>
      </div>

      <div className="sketchbook">
        <h3 className="ai-h">From the sketchbook</h3>
        <ul>
          {sideProjects.map((s) => (
            <li key={s.name}>
              <b>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.name}<span className="sr"> (opens in a new tab)</span></a> : s.name}</b>
              <span>{s.pitch}</span>
            </li>
          ))}
        </ul>
      </div>
    </Room>
  )
}

function Sky({ stars, gh, repos }) {
  const nights = stars.length
  const moon = stars[0]
  const shown = repos.slice(0, 20)
  return (
    <>
      <section id="sky" className="sky" aria-labelledby="sky-h">
        <div className="sky-stage">
          <header className="sky-head">
            <p className="room-n">Room IV</p>
            <h2 id="sky-h">The night sky is his GitHub</h2>
            <p className="room-intro">{gh.contributionsLastYear} contributions in the last year. {nights} nights with paint on the brush. One star per night, brighter by count.</p>
          </header>
          <div className="star-marks" aria-hidden="true">
            {stars.map((s) => (
              <span key={s.date} className={s.moon ? 'mark moon' : 'mark'} style={{ left: s.x * 100 + '%', top: (1 - s.y) * 100 + '%' }} title={`${fmtDate(s.date)}: ${s.count} contribution${s.count > 1 ? 's' : ''}`} />
            ))}
          </div>
          {moon && (
            <p className="moon-note" style={{ left: `min(${moon.x * 100}%, calc(100% - 16rem))`, top: `calc(${(1 - moon.y) * 100}% + 3.6rem)` }}>
              {fmtDate(moon.date)}: {moon.count} contributions in one day. The sky could only hold that as a moon.
            </p>
          )}
          <svg className="constellations" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {shown.map((r, i) => {
              const cx = 6 + (i % 5) * 18.5, cy = 44 + Math.floor(i / 5) * 10
              const pts = constellation(r.name).map(([x, y]) => [cx + x * 12, cy + y * 7])
              return (
                <g key={r.name}>
                  <polyline pathLength="1" points={pts.map((p) => p.join(',')).join(' ')} />
                  {pts.map((p, k) => <line key={k} className="dot" x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1]} />)}
                </g>
              )
            })}
          </svg>
          <p className="sky-foot">{gh.commitsLastYear} commits and {gh.prsLastYear} pull requests in a year. Painting on GitHub since {fmtDate(gh.joined)}.</p>
        </div>
      </section>
      <section className="chart" data-room="sky" aria-labelledby="chart-h">
        <h3 id="chart-h" className="ai-h">Star chart: {repos.length} repositories, one constellation each</h3>
        <blockquote className="curator inline">
          <p className="curator-k">Inscription, in the artist&rsquo;s hand (GitHub bio)</p>
          <p>{gh.bio.split(/\r?\n/).map((l, i) => <span key={i}>{l}<br /></span>)}</p>
        </blockquote>
        <ul className="repos">
          {repos.map((r) => {
            const pts = constellation(r.name)
            return (
              <li key={r.name}>
                <svg viewBox="0 0 1 1" aria-hidden="true"><polyline points={pts.map((p) => p.join(',')).join(' ')} />{pts.map((p, k) => <circle key={k} cx={p[0]} cy={p[1]} r="0.05" />)}</svg>
                <div>
                  <a href={r.url} target="_blank" rel="noreferrer">{r.name}<span className="sr"> (opens in a new tab)</span></a>
                  <p>{r.description || 'Untitled.'}</p>
                  <p className="meta">{[r.language, r.stars ? `${r.stars} star${r.stars > 1 ? 's' : ''}` : null, `last touched ${fmtDate(r.pushedAt)}`, r.fork ? 'copy after another master (fork)' : null].filter(Boolean).join(' · ')}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}

const SALON = [
  { src: me.portrait, alt: 'Portrait of Krishna Raju S', title: 'Portrait of the Artist', medium: 'Oil on optimism.', size: 'tall' },
  ...awards.filter((a) => a.photo).map((a) => ({ src: a.photo, alt: a.photoAlt, title: `${a.title}, ${a.year}`, medium: a.detail, size: 'wide' })),
  ...leadership.photos.map((p, i) => ({ src: p.src, alt: p.alt, title: i === 0 ? leadership.title : p.alt, medium: i === 0 ? leadership.text : null, size: i === 1 ? 'tall' : 'sq' })),
  ...field[0].photos.map((p) => ({ src: p.src, alt: p.alt, title: field[0].title, medium: p.caption, size: 'sq' })),
]

function Salon() {
  return (
    <Room id="salon" n="V" title="The Salon" intro="Hung floor to ceiling, the way the old academies did it. Awards, rooms full of students, and one intern badge.">
      <ul className="salon">
        {SALON.map((s) => (
          <li key={s.src} className={'hang ' + s.size}>
            <Painting src={s.src} alt={s.alt} />
            <Label title={s.title} medium={s.medium} />
          </li>
        ))}
      </ul>
      <div className="essay">
        <h3 className="ai-h">{field[0].title}, {field[0].when}</h3>
        <p>{field[0].text}</p>
        <a href={field[0].link.url} target="_blank" rel="noreferrer">{field[0].link.label}<span className="sr"> (opens in a new tab)</span></a>
      </div>
      <div className="registers">
        <div>
          <h3 className="ai-h">Acquisitions register</h3>
          <ol className="register">{awards.map((a) => <li key={a.title}><b>{a.year}</b><span><strong>{a.title}</strong>. {a.detail}</span></li>)}</ol>
        </div>
        <div>
          <h3 className="ai-h">Materials</h3>
          <dl className="materials">{Object.entries(skills).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v.join(', ')}</dd></div>)}</dl>
          <h3 className="ai-h">Provenance</h3>
          <ul className="provenance">{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      </div>
    </Room>
  )
}

// CTA: paint across a primed canvas; once it's covered, the commission goes out by email.
function Commission() {
  const ref = useRef(null)
  const [done, setDone] = useState(false)
  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const cells = new Set()
    const COLS = 12, ROWS = 7
    let last = null, sent = false, hue = 0
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2)
      cv.width = r.width * d; cv.height = r.height * d
      ctx.setTransform(d, 0, 0, d, 0, 0)
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    }
    size()
    const at = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r.width, r.height] }
    const down = (e) => { cv.setPointerCapture(e.pointerId); last = at(e); hue = (hue + 1) % 3 }
    const move = (e) => {
      if (!last) return
      const p = at(e)
      const col = ['#1f4fa8', '#e2b53e', '#2f6d5a'][hue]
      for (let k = 0; k < 5; k++) {
        const o = (k - 2) * 5
        ctx.strokeStyle = col
        ctx.globalAlpha = k === 2 ? 0.95 : 0.5
        ctx.lineWidth = k === 2 ? 16 : 5
        ctx.beginPath(); ctx.moveTo(last[0] + o * 0.3, last[1] + o); ctx.lineTo(p[0] + o * 0.3, p[1] + o); ctx.stroke()
      }
      cells.add(Math.floor((p[0] / p[2]) * COLS) + ',' + Math.floor((p[1] / p[3]) * ROWS))
      last = p
      if (!sent && cells.size >= COLS * ROWS * 0.35) { sent = true; setDone(true); window.location.href = MAIL }
    }
    const up = () => { last = null }
    cv.addEventListener('pointerdown', down)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up)
    cv.addEventListener('pointercancel', up)
    window.addEventListener('resize', size)
    return () => { window.removeEventListener('resize', size); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up) }
  }, [])
  return (
    <Room id="commission" n="VI" title="Commissions open" intro={`${me.lines[1]} ${me.lines[2]}`}>
      <div className="commission">
        <div className="gilt big">
          <div className="canvas primed">
            <canvas ref={ref} role="img" aria-label="A primed canvas. Paint across it with your pointer or finger to send a commission by email." />
            {!done && <p className="hint" aria-hidden="true">Paint here. Cover about a third of the canvas and the commission is signed.</p>}
            {done && <p className="hint done" role="status">Commission signed. Your email is opening.</p>}
          </div>
        </div>
        <div className="label commission-label">
          <h3>Untitled (your manual step), 2026</h3>
          <p className="medium">Commissioned work. Medium of your choice, as long as it ends in Python.</p>
          <p>Bring the spreadsheet everyone is scared of. It leaves as a button.</p>
          <a className="mail" href={MAIL}>Or just email {me.email}</a>
          <p className="elsewhere">
            <a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn<span className="sr"> (opens in a new tab)</span></a>
            <a href={me.github} target="_blank" rel="noreferrer">GitHub<span className="sr"> (opens in a new tab)</span></a>
            <a href={me.resume} target="_blank" rel="noreferrer">Resume (PDF)</a>
          </p>
        </div>
      </div>
    </Room>
  )
}

// The surprise: the signature in the corner turns the painting over.
function Verso({ dialog, gh }) {
  return (
    <dialog ref={dialog} className="verso" aria-labelledby="verso-h" onClick={(e) => { if (e.target === dialog.current) dialog.current.close() }}>
      <div className="verso-back">
        <div className="bars" aria-hidden="true" />
        <h2 id="verso-h">Verso</h2>
        <p className="verso-sub">You found the signature, so you get the back of the canvas. This is where the paperwork lives.</p>
        <div className="sticker stamp">
          <b>Inscription on the stretcher bar</b>
          <p>{gh.bio.split(/\r?\n/).map((l, i) => <span key={i}>{l}<br /></span>)}</p>
        </div>
        <div className="sticker">
          <b>Certificate of authenticity</b>
          <p>{me.name}. {me.role}. {me.field}. {me.city}.</p>
          <a href={me.resume} target="_blank" rel="noreferrer">Open the certificate (resume, PDF)</a>
        </div>
        <div className="sticker tag">
          <b>Shipping label</b>
          <p>Fragile: contains {numbers[0].value} production apps.</p>
          <a href={MAIL}>Deliver to {me.email}</a>
        </div>
        <form method="dialog"><button className="pill">Turn it back over</button></form>
      </div>
    </dialog>
  )
}

/* ---------- the app ---------- */

export default function App() {
  const canvas = useRef(null)
  const audio = useRef(null)
  const analyser = useRef(null)
  const painting = useRef(null)
  const verso = useRef(null)
  const [intro, setIntro] = useState(!reduced)
  const [steps, setSteps] = useState([])
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('artist')
  const [repos, setRepos] = useState(snapshot.repos)
  const [noGL, setNoGL] = useState(false)
  const stars = useMemo(() => skyStars(snapshot.days), [])
  const [music, setMusic] = useMusic(() => audio.current, (ctx, src) => {
    const an = ctx.createAnalyser()
    an.fftSize = 256
    src.connect(an); an.connect(ctx.destination)
    analyser.current = { an, data: new Uint8Array(an.frequencyBinCount) }
  })

  const rooms = [
    { id: 'artist', n: 'I', name: 'The Artist', count: numbers.length },
    { id: 'villages', n: 'II', name: 'Five Villages', count: experience.length },
    { id: 'interval-1', n: '·', name: 'Interval' },
    { id: 'collection', n: 'III', name: 'The Collection', count: apps.length },
    { id: 'sky', n: 'IV', name: 'The Night Sky', count: stars.length },
    { id: 'interval-2', n: '·', name: 'Interval' },
    { id: 'salon', n: 'V', name: 'The Salon', count: awards.length },
    { id: 'commission', n: 'VI', name: 'Commissions' },
  ]

  const skipped = useRef(reduced)
  const endIntro = () => { skipped.current = true; painting.current?.skip(); setIntro(false) }

  // Live repos when GitHub answers; the snapshot otherwise.
  useEffect(() => {
    const ac = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        setRepos(list.map((r) => ({ name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, pushedAt: (r.pushed_at || '').slice(0, 10), fork: r.fork, url: r.html_url })))
      })
      .catch(() => {})
    return () => ac.abort()
  }, [])

  // The painting (lazy) and the single frame loop.
  useEffect(() => {
    let alive = true
    let tick = null
    const small = window.innerWidth < 760
    setSteps(['Stretching the canvas'])
    import('./painting.js').then(({ createPainting }) => {
      if (!alive) return
      let p = null
      try { p = createPainting(canvas.current, { small, still: reduced }) } catch { p = null }
      if (!p) { setNoGL(true); setIntro(false); return }
      painting.current = p
      if (skipped.current) p.skip()
      setSteps((s) => [...s, 'Mixing pigments (compiling the shader)'])
      p.setStars(stars)
      setSteps((s) => [...s, `Hanging ${stars.length} stars, one per night of commits`])
      if (reduced) { p.draw(); return }
      let shown = 0
      tick = (_t, dms) => {
        const a = analyser.current
        let level = 0
        if (a && audio.current && !audio.current.paused) {
          a.an.getByteFrequencyData(a.data)
          for (let i = 1; i < 9; i++) level += a.data[i]
          level /= 8 * 255
        }
        p.frame(dms / 1000, level)
        const pr = Math.round(p.revealed ? 100 : Math.min(99, (performance.now() - t0) / 30))
        if (pr !== shown) { shown = pr; setProgress(pr); if (pr === 100) setIntro(false) }
      }
      const t0 = performance.now()
      gsap.ticker.add(tick)
    })
    return () => { alive = false; if (tick) gsap.ticker.remove(tick); painting.current?.destroy() }
  }, [stars])

  // Escape skips the entrance.
  useEffect(() => {
    if (!intro) return
    const k = (e) => { if (e.key === 'Escape') endIntro() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [intro])

  // Running gallery index.
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.dataset.room || e.target.id)), { rootMargin: '-45% 0px -50% 0px' })
    document.querySelectorAll('main section[id], main section[data-room]').forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // Scroll: Lenis on the GSAP ticker, a pinned village road, a pinned night sky, brushstroke transitions.
  useEffect(() => {
    if (reduced) return
    lenis = new Lenis({ lerp: 0.09 })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    const ctx = gsap.context(() => {
      const track = document.querySelector('.villages .track')
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth)
      const road = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.villages', pin: true, scrub: 1, end: () => '+=' + dist(), invalidateOnRefresh: true },
      })
      gsap.utils.toArray('.villages .gilt').forEach((g) => {
        gsap.from(g, { rotate: -3, scale: 0.9, opacity: 0.5, ease: 'none', scrollTrigger: { trigger: g, containerAnimation: road, start: 'left right', end: 'center 60%', scrub: true } })
      })

      const sky = gsap.timeline({ scrollTrigger: { trigger: '.sky', pin: true, scrub: 1, end: '+=140%' } })
      sky.from('.sky-head', { opacity: 0, y: 40, duration: 0.25 })
        .to('.constellations polyline', { strokeDashoffset: 0, duration: 0.5, stagger: 0.02 }, 0.15)
        .from('.moon-note, .sky-foot', { opacity: 0, duration: 0.2 }, 0.5)
        .to({}, { duration: 0.3 })
      ScrollTrigger.create({
        trigger: '.sky', start: 'top bottom', end: () => '+=' + (window.innerHeight * 3.4),
        onUpdate: (st) => {
          const v = Math.min(1, st.progress * 4, (1 - st.progress) * 4)
          painting.current?.set('tSky', v)
          painting.current?.set('tBoost', v)
        },
      })
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (st) => painting.current?.set('tTravel', st.progress) })

      gsap.utils.toArray('.stroke').forEach((el) => {
        gsap.to(el.querySelectorAll('path'), { strokeDashoffset: 0, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 95%', end: 'bottom 35%', scrub: true } })
      })
      gsap.utils.toArray('.room-head, .interval-wall, .apps > li, .hang').forEach((el) => {
        gsap.from(el, { clipPath: 'inset(0 100% 0 0)', ease: 'power2.out', duration: 1.1, scrollTrigger: { trigger: el, start: 'top 85%' } })
      })
    })
    return () => { ctx.revert(); gsap.ticker.remove(raf); lenis.destroy(); lenis = null }
  }, [])

  const go = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (lenis) lenis.scrollTo(el, { duration: 1.6 })
    else el.scrollIntoView()
    el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true })
  }

  const current = rooms.find((r) => r.id === active) || rooms[0]

  return (
    <div className={'app' + (intro ? ' is-intro' : '') + (reduced ? ' reduced' : '') + (noGL ? ' no-gl' : '')}>
      <canvas ref={canvas} className="painting" aria-hidden="true" />
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="14" /></filter>
      </svg>
      <a className="skip" href="#villages" onClick={(e) => go(e, 'villages')}>Skip to the rooms</a>

      <nav className="index" aria-label="Gallery index">
        <p className="index-k">Gallery index</p>
        <p className="index-now" aria-hidden="true">Room {current.n} · {current.name}</p>
        <ol>
          {rooms.map((r) => (
            <li key={r.id} className={r.id === active ? 'on' : ''}>
              <a href={'#' + r.id} onClick={(e) => go(e, r.id)} aria-current={r.id === active ? 'location' : undefined}>
                <span className="rn">{r.n}</span><span className="rname">{r.name}</span>{r.count != null && <span className="rc">{r.count}</span>}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="controls">
        <button className="pill" data-music onClick={() => setMusic(!music)} aria-pressed={!music}>
          {music ? 'Music off' : 'Music on'}
        </button>
        <span className="now">{music ? `In the gallery: ${SONG}` : 'The quartet is resting'}</span>
      </div>
      <audio ref={audio} src={asset('audio/great-fairy-fountain.mp3')} preload="auto" loop />

      {intro && (
        <div className="entrance" role="status">
          <p className="wet">Wet paint. The artist needs three seconds.</p>
          <ul>{steps.map((s) => <li key={s}>{s} <b>ok</b></li>)}<li>Painting the sky <b>{progress}%</b></li></ul>
          <button className="pill" onClick={endIntro}>Skip intro (Esc)</button>
        </div>
      )}

      <main>
        <section id="artist" className="hero" aria-labelledby="hero-h">
          <p className="kicker">The Brushstroke Collection · Room I</p>
          <div className="hero-name">
            <p className="hero-line">{me.lines[0]}</p>
            <h1 id="hero-h">{me.name}</h1>
            <p className="hero-role">{me.role}</p>
          </div>
          <Label title={`${me.name}, ${me.city}`} medium="Oil on factory floor, 2026." className="hero-label">
            <p>Nine apps, one artist. Swirls follow your pointer; the lamp is yours too.</p>
            <p className="note">Signed lower right.</p>
          </Label>
        </section>

        <section className="figures" aria-label="Catalogue in figures">
          <h2 className="ai-h">Catalogue in figures</h2>
          <ul>
            {numbers.map((n) => (
              <li key={n.unit} className="plaque"><b>{n.value}</b><span>{n.unit}</span><small>{n.label}</small></li>
            ))}
          </ul>
        </section>

        <Stroke />
        <Villages />
        <Stroke flip />

        <Interval
          id="interval-1"
          title="Double Portrait with Matching Grins"
          img={asset('img/pins/butcher.jpg')}
          alt="Meme: Billy Butcher grinning next to a cartoon pony with the exact same grin"
          label="Anonymous, every hiring season. Two faces, one expression: the one you make at a CV that says 'automation enthusiast'."
          note={`This artist skipped 'enthusiast' and went straight to 'in production': ${numbers[0].value} apps at Indo Tech Transformers, ${numbers[1].value} tests guarding dispatch.`}
        />
        <Stroke />
        <Collection />
        <Stroke flip />
        <Sky stars={stars} gh={snapshot} repos={repos} />
        <Stroke />

        <Interval
          id="interval-2"
          title="The Thinker (Chennai school)"
          img={asset('img/pins/tamil.jpg')}
          alt="Meme: a man in a white shirt staring into the distance, finger on his lips, deep in thought"
          label="Man contemplating two hours of test planning. Per transformer. Every unit."
          original="Caption in the original Tamil: 'eaaaa vazhka nadakamahhh' (life is a drama)."
          note="Restored in 2026. Test planning now takes 5 minutes; the Transformer Test Planner did the restoration."
        />
        <Stroke flip />
        <Salon />
        <Stroke />
        <Commission />
      </main>

      <footer className="foot">
        <p>{me.name} · {me.city} · <a href={MAIL}>{me.email}</a></p>
        <p className="small">{me.lines[3]} Music: {SONG}. The painting is a live WebGL shader, painted fresh on every visit.</p>
      </footer>

      <button className="signature" onClick={() => verso.current?.showModal()} aria-label="The artist's signature. Turn the painting over.">Krish &rsquo;26</button>
      <Verso dialog={verso} gh={snapshot} />
    </div>
  )
}

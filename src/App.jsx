import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, sideProjects, ai, awards, leadership, field, certifications, skills, asset } from './content.js'
import snapshot from './github.json'

gsap.registerPlugin(ScrollTrigger)

const REDUCE = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (typeof document !== 'undefined') document.documentElement.classList.add(REDUCE ? 'rm' : 'motion', 'locked')

const EASE = (t) => 1 - Math.pow(1 - t, 4)
let lenis = null

function go(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: EASE })
  else el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' })
  el.focus({ preventScroll: true })
}

/* ---------- audio: one element, one analyser ---------- */
const audio = { el: null, an: null, buf: null }
function ensureAnalyser() {
  if (audio.an || !audio.el) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const src = ctx.createMediaElementSource(audio.el)
    const an = ctx.createAnalyser()
    an.fftSize = 256
    src.connect(an)
    an.connect(ctx.destination)
    audio.an = an
    audio.buf = new Uint8Array(an.frequencyBinCount)
  } catch { /* no analyser: music still plays, visualiser stays calm */ }
}
function level() {
  if (!audio.an) return 0
  audio.an.getByteFrequencyData(audio.buf)
  let s = 0
  for (let i = 0; i < audio.buf.length; i++) s += audio.buf[i]
  return s / (audio.buf.length * 255)
}

/* ---------- posters ---------- */
const PAPER = '#EFE9DE'
const INK = '#141210'
const ACCENTS = ['#E23B2E', '#FFB627', '#2F5BEA', '#3CCB8E', '#D9468F', '#E23B2E', '#E08A1E', '#7FA7FF', '#1E8A5A']
const RATINGS = [['U/A', 'Unbelievable Automation'], ['A', 'Strictly Automated'], ['U', 'Universally Unbothered']]
const MOTIF_OF = {
  'Dispatch Management': 'sun', EPMS: 'bars', 'Fasteners Automation': 'clock', 'Industrial Data System': 'qr',
  'Job Lens': 'stack', KioskSentinel: 'bolt', 'RTCC & M.Box Tracker': 'dots', 'Shop Floor Job Status': 'bays',
  'Transformer Test Planner': 'wave',
}
const QR = [1,1,1,0,1,0,1, 1,0,1,0,0,1,1, 1,1,1,1,0,1,0, 0,0,1,0,1,1,1, 1,0,0,1,1,0,1, 0,1,1,0,1,0,0, 1,0,1,1,0,1,1]

function Motif({ kind, fg, ac, bg }) {
  switch (kind) {
    case 'sun': return <>
      <circle cx="100" cy="112" r="62" fill={ac} />
      <rect x="0" y="112" width="200" height="88" fill={bg} />
      <line x1="10" y1="112" x2="190" y2="112" stroke={fg} strokeWidth="1.5" />
      <path d="M96 114 L40 200 M104 114 L160 200" stroke={fg} strokeWidth="1.5" />
      <path d="M100 130 V144 M100 156 V174 M100 186 V200" stroke={fg} strokeWidth="2" />
    </>
    case 'bars': return [[20, 30, 70], [50, 52, 60], [80, 74, 90], [40, 96, 50], [100, 118, 70], [130, 140, 50], [70, 162, 40]].map(([x, y, w], i) =>
      <rect key={i} x={x} y={y} width={w} height="12" fill={i === 3 ? ac : fg} />)
    case 'clock': return <>
      <circle cx="100" cy="100" r="76" fill="none" stroke={fg} strokeWidth="1.5" />
      <line x1="100" y1="100" x2="100" y2="34" stroke={fg} strokeWidth="1.5" />
      <circle cx="100" cy="100" r="9" fill={ac} />
    </>
    case 'qr': return QR.map((v, i) => v ? <rect key={i} x={30 + (i % 7) * 20} y={30 + Math.floor(i / 7) * 20} width="18" height="18" fill={i === 24 ? ac : fg} /> : null)
    case 'stack': return Array.from({ length: 14 }, (_, i) =>
      <rect key={i} x={i === 4 ? 30 : 40} y={22 + i * 11} width={i === 4 ? 140 : 120 - (i * 7) % 40} height={i === 4 ? 6 : 1.5} fill={i === 4 ? ac : fg} />)
    case 'bolt': return <>
      <rect x="62" y="30" width="76" height="140" fill="none" stroke={fg} strokeWidth="1.5" />
      <polyline points="112,44 84,104 112,104 88,160" fill="none" stroke={ac} strokeWidth="8" strokeLinejoin="miter" />
    </>
    case 'dots': return Array.from({ length: 25 }, (_, i) =>
      <circle key={i} cx={40 + (i % 5) * 30} cy={40 + Math.floor(i / 5) * 30} r="7" fill={i === 18 ? ac : 'none'} stroke={i === 18 ? ac : fg} strokeWidth="1.5" />)
    case 'bays': return Array.from({ length: 6 }, (_, i) =>
      <rect key={i} x={22 + i * 27} y="50" width="20" height="100" fill={i === 2 ? ac : 'none'} stroke={i === 2 ? ac : fg} strokeWidth="1.5" />)
    default: return <>
      <path d="M10 100 C 40 30, 60 30, 80 100 S 120 170, 140 100 S 180 30, 190 70" fill="none" stroke={fg} strokeWidth="1.5" />
      <line x1="10" y1="100" x2="190" y2="100" stroke={fg} strokeWidth=".75" strokeDasharray="3 4" />
      <circle cx="45" cy="48" r="8" fill={ac} />
    </>
  }
}

function Poster({ app, i }) {
  const dark = i % 2 === 1
  const bg = dark ? INK : PAPER
  const fg = dark ? PAPER : INK
  const ac = ACCENTS[i]
  const [code, joke] = RATINGS[i % RATINGS.length]
  const Tag = app.url ? 'a' : 'div'
  const link = app.url ? { href: app.url, target: '_blank', rel: 'noreferrer', 'aria-label': `${app.name} poster: ${app.pitch} Opens in a new tab.` } : {}
  return (
    <Tag className="poster" style={{ '--bg': bg, '--fg': fg, '--ac': ac }} {...link}>
      <div className="p-top"><span>Krishna Raju S</span><span>No. {String(i + 1).padStart(2, '0')}/09</span></div>
      <div className="p-art"><svg className="p-motif" viewBox="0 0 200 200" aria-hidden="true"><Motif kind={MOTIF_OF[app.name]} fg={fg} ac={ac} bg={bg} /></svg></div>
      <h3 className="p-title">{app.name}</h3>
      <p className="p-tag">{app.pitch}</p>
      <div className="p-foot">
        <span className="p-rating" title={`${code}: ${joke}`}><b>{code}</b>{joke}</span>
        <span className="p-billing">Starring Python · Written, coded and tested by Krishna Raju S · Now showing at Indo Tech Transformers</span>
        <span className="p-cta">{app.url ? 'Watch now ↗' : 'Private screening · internal'}</span>
      </div>
    </Tag>
  )
}

/* ---------- laurel wreath ---------- */
const LEAVES = Array.from({ length: 9 }, (_, k) => {
  const th = (24 + k * 16) * Math.PI / 180
  const x = 100 - 80 * Math.sin(th), y = 104 + 80 * Math.cos(th)
  const rot = Math.atan2(-Math.sin(th), -Math.cos(th)) * 180 / Math.PI - 28
  return { x, y, rot }
})
function Laurel() {
  const branch = <>
    <path d="M86 182 A80 80 0 0 1 40 46" fill="none" stroke="currentColor" strokeWidth="1.5" />
    {LEAVES.map((l, i) => <ellipse key={i} cx={l.x} cy={l.y} rx="11" ry="4.2" transform={`rotate(${l.rot} ${l.x} ${l.y})`} fill="currentColor" />)}
  </>
  return <svg className="laurel-svg" viewBox="0 0 200 200" aria-hidden="true">{branch}<g transform="translate(200 0) scale(-1 1)">{branch}</g></svg>
}

/* ---------- split-flap board ---------- */
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.'
function flap(str, p, row) {
  if (p >= 1) return str
  let out = ''
  for (let i = 0; i < str.length; i++) {
    const at = (i + row * 1.6) / (str.length + 32)
    out += p >= at || str[i] === ' ' ? str[i] : FLAP[(Math.random() * FLAP.length) | 0]
  }
  return out
}
const pad = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n, ' '))
const gross = (kb) => kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()

function Board({ repos, live }) {
  const ref = useRef(null)
  const [p, setP] = useState(REDUCE ? 1 : 0)
  const [run, setRun] = useState(0)
  useEffect(() => {
    if (REDUCE || !ref.current) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setRun((r) => r + 1); io.disconnect() } }, { threshold: 0.25 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  useEffect(() => { if (live && run) setRun((r) => r + 1) }, [live]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!run || REDUCE) return
    let raf, t0 = performance.now()
    const tick = (t) => { const v = Math.min(1, (t - t0) / 1800); setP(v); if (v < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run])
  const rows = repos.slice(0, 12)
  return (
    <div className="board" ref={ref}>
      <div className="board-head" aria-hidden="true"><span>Title</span><span className="b-lang">Genre</span><span>Gross</span><span>Release</span></div>
      <table className="sr">
        <caption>Repositories, most recently pushed first</caption>
        <thead><tr><th>Repository</th><th>Language</th><th>Size</th><th>Last push</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.language || 'n/a'}</td><td>{gross(r.sizeKB)}</td><td>{r.pushedAt}</td></tr>)}</tbody>
      </table>
      <ol aria-hidden="true">
        {rows.map((r, i) => (
          <li key={r.name} className="board-row">
            <a href={r.url} target="_blank" rel="noreferrer" tabIndex={-1} className="b-name">{flap(pad(r.name.toUpperCase(), 22), p, i)}</a>
            <span className="b-lang">{flap(pad((r.language || '—').toUpperCase(), 10), p, i)}</span>
            <span>{flap(pad(gross(r.sizeKB), 9), p, i)}</span>
            <span>{flap(fmtDate(r.pushedAt), p, i)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Run() {
  const days = snapshot.days
  const max = Math.max(...days.map((d) => d[1]))
  const best = snapshot.bestDay
  const bi = days.findIndex((d) => d[0] === best.date)
  const W = days.length * 3
  return (
    <figure className="run rv">
      <div className="run-chart">
        <svg viewBox={`0 0 ${W} 130`} preserveAspectRatio="none" role="img" aria-label={`Daily contributions over ${days.length} days. Best day ${best.date} with ${best.contributionCount}.`}>
          {days.map(([d, c], i) => c > 0 && <rect key={d} x={i * 3} y={125 - (c / max) * 118} width="2" height={(c / max) * 118} className={i === bi ? 'best' : ''} />)}
          <line x1="0" y1="125.5" x2={W} y2="125.5" />
        </svg>
        <div className="run-cover" aria-hidden="true" />
        <span className="run-flag" style={{ left: `${(bi / days.length) * 100}%` }}>Opening weekend record · {best.contributionCount} on {fmtDate(best.date)}</span>
      </div>
      <figcaption><span>{fmtDate(days[0][0])}</span><span>The box office run · {days.length} days</span><span>{fmtDate(days[days.length - 1][0])}</span></figcaption>
    </figure>
  )
}

/* ---------- ticket ---------- */
function Ticket() {
  const [torn, setTorn] = useState(false)
  const stub = useRef(null)
  const drag = useRef({ x: 0, on: false, moved: false })
  const confirmRef = useRef(null)
  const tear = () => { setTorn(true); setTimeout(() => confirmRef.current?.focus(), REDUCE ? 0 : 700) }
  const down = (e) => { if (torn) return; drag.current = { x: e.clientX, on: true, moved: false }; stub.current.setPointerCapture(e.pointerId) }
  const move = (e) => {
    const d = drag.current
    if (!d.on) return
    const dx = Math.max(0, e.clientX - d.x)
    if (dx > 6) d.moved = true
    stub.current.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`
  }
  const up = (e) => {
    const d = drag.current
    if (!d.on) return
    d.on = false
    stub.current.style.transform = ''
    if (e.clientX - d.x > 70) tear()
  }
  const magnet = (e) => {
    if (REDUCE) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`
  }
  return (
    <div className={`ticket-wrap ${torn ? 'torn' : ''}`}>
      <div className="ticket">
        <div className="t-main">
          <p className="t-admit">Admit one · Screen 01</p>
          <p className="t-show">AUTOMATE</p>
          <dl className="t-meta">
            <div><dt>Hero</dt><dd>{me.name}</dd></div>
            <div><dt>Venue</dt><dd>{me.city}</dd></div>
            <div><dt>Seat</dt><dd>Wherever your team has a spreadsheet</dd></div>
          </dl>
          <ul className="t-links">
            <li><a href={`mailto:${me.email}`}>{me.email}</a></li>
            <li><a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a></li>
            <li><a href={me.github} target="_blank" rel="noreferrer">GitHub ↗</a></li>
            <li><a href={me.resume} download>Resume (PDF)</a></li>
          </ul>
        </div>
        <button ref={stub} className="t-stub" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          onClick={() => { if (!drag.current.moved) tear(); drag.current.moved = false }} aria-label="Tear the stub to book the show" disabled={torn}>
          <span className="t-stub-in">Tear<br />to<br />book</span>
          <span className="t-no">№ 000009</span>
        </button>
      </div>
      <div className="t-confirm" aria-live="polite">
        {torn && <>
          <p className="t-booked">Booked. House full.</p>
          <a ref={confirmRef} className="magnet" href={`mailto:${me.email}?subject=${encodeURIComponent('Booking the show: AUTOMATE')}`}
            onPointerMove={magnet} onPointerLeave={(e) => { e.currentTarget.style.transform = '' }}>Email the director</a>
        </>}
      </div>
    </div>
  )
}

/* ---------- post-credits poster ---------- */
function drawPoster(cv, company) {
  const c = cv.getContext('2d')
  const W = (cv.width = 900), H = (cv.height = 1350)
  const name = (company.trim() || 'Your company').toUpperCase()
  const sp = (v) => { if ('letterSpacing' in c) c.letterSpacing = v }
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H)
  c.fillStyle = INK; c.beginPath(); c.arc(W / 2, 0, 200, 0, Math.PI); c.fill()
  c.fillStyle = '#E23B2E'; c.beginPath(); c.arc(W / 2, H, 200, Math.PI, 0); c.fill()
  c.textAlign = 'center'; c.fillStyle = INK
  sp('10px'); c.font = '22px "Space Mono", monospace'; c.fillText('A KRISHNA RAJU S PRODUCTION', W / 2, 360)
  sp('4px'); c.font = '170px Anton, Impact, sans-serif'; c.fillText('KRISHNA', W / 2, 600)
  sp('0px'); c.fillStyle = '#E23B2E'; c.font = '110px Italiana, serif'; c.fillText('×', W / 2, 730)
  c.fillStyle = INK
  let size = 150
  sp('6px'); c.font = `${size}px Italiana, serif`
  while (c.measureText(name).width > 790 && size > 28) { size -= 4; c.font = `${size}px Italiana, serif` }
  c.fillText(name, W / 2, 860)
  sp('22px'); c.font = '46px Anton, Impact, sans-serif'; c.fillText('COMING SOON', W / 2 + 11, 990)
  sp('2px'); c.font = '17px "Space Mono", monospace'
  c.fillText('THE SEQUEL · STARRING PYTHON · BUDGET: ONE ENGINEER', W / 2, 1090)
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(W - 90, 90, 44, 0, Math.PI * 2); c.stroke()
  sp('0px'); c.font = '30px Anton, Impact, sans-serif'; c.fillText('U/A', W - 90, 101)
}

function PostCredits() {
  const [company, setCompany] = useState('')
  const [fonts, setFonts] = useState(0)
  const cv = useRef(null)
  useEffect(() => {
    Promise.all(['170px Anton', '100px Italiana', '20px "Space Mono"'].map((f) => document.fonts?.load(f))).catch(() => {}).finally(() => setFonts(1))
  }, [])
  useEffect(() => { if (cv.current) drawPoster(cv.current, company) }, [company, fonts])
  const save = () => cv.current.toBlob((b) => {
    if (!b) return
    const u = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = u
    a.download = `krishna-x-${(company.trim() || 'your-company').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(u), 1500)
  }, 'image/png')
  return (
    <section className="post" id="sequel" tabIndex={-1} aria-labelledby="post-h">
      <p className="kicker">Post-credits scene</p>
      <h2 id="post-h" className="post-h">Every hit gets a sequel.<br /><em>This one is set at your company.</em></h2>
      <div className="post-grid">
        <div className="post-form">
          <label htmlFor="co">Your company</label>
          <input id="co" value={company} maxLength={32} autoComplete="organization" placeholder="Type it. Watch the poster." onChange={(e) => setCompany(e.target.value)} />
          <p className="post-line">Coming soon: <b>KRISHNA × {(company.trim() || '[your company]')}</b></p>
          <button className="btn" onClick={save}>Download the poster (PNG)</button>
          <a className="btn ghost" href={`mailto:${me.email}?subject=${encodeURIComponent(`Sequel: Krishna × ${company.trim() || 'our company'}`)}`}>Greenlight the sequel</a>
        </div>
        <canvas ref={cv} className="post-canvas" role="img" aria-label={`Poster: Krishna × ${company.trim() || 'your company'}, coming soon`} />
      </div>
    </section>
  )
}

/* ---------- interval ---------- */
function Interval({ n, setup, img, alt, caption, sub, reframe, after }) {
  return (
    <section className="interval" aria-label={`Interval ${n}`}>
      <div className="iv-stage">
        <div className="iv-curtain l" aria-hidden="true"><span>INTER</span></div>
        <div className="iv-curtain r" aria-hidden="true"><span>VAL</span></div>
        <p className="iv-setup">{setup}</p>
        <figure className="iv-meme">
          <img src={img} alt={alt} loading="lazy" decoding="async" />
          <figcaption>{caption}{sub && <small>{sub}</small>}</figcaption>
        </figure>
        <p className="iv-reframe">{reframe}<small>{after}</small></p>
      </div>
    </section>
  )
}

/* ---------- app ---------- */
const NAV = [['trailer', 'Trailer'], ['posters', 'Posters'], ['prequels', 'Prequels'], ['laurels', 'Laurels'], ['boxoffice', 'Box office'], ['book', 'Book']]
const ROMAN = ['I', 'II', 'III', 'IV', 'V']
const TRAILER = ['In a world…', 'where factories ran on spreadsheets…', 'one engineer…', 'said no.']

export default function App() {
  const [phase, setPhase] = useState(REDUCE ? 'gate' : 'leader')
  const [count, setCount] = useState(5)
  const [pct, setPct] = useState(0)
  const [leaderGone, setLeaderGone] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [repos, setRepos] = useState(() => snapshot.repos.filter((r) => !r.fork).sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)))
  const [live, setLive] = useState(false)
  const [exit, setExit] = useState(false)
  const sound = useRef(false)
  const beam = useRef(null)

  // Leader countdown = real loader: never runs ahead of the assets.
  useEffect(() => {
    if (phase !== 'leader') return
    const srcs = [me.portrait, asset('img/pins/mahaan-poster.jpg')]
    let done = 0, ready = false
    const total = srcs.length + 1
    const bump = () => { done++ }
    srcs.forEach((s) => { const im = new Image(); im.onload = im.onerror = bump; im.src = s })
    ;(document.fonts?.ready || Promise.resolve()).then(bump)
    const t0 = performance.now()
    let raf, last = -1
    const tick = (t) => {
      const prog = done / total
      const step = Math.min(Math.floor((t - t0) / 650), Math.floor(prog * 5))
      if (step !== last) { last = step; setCount(Math.max(1, 5 - step)); setPct(Math.round(prog * 100)) }
      if (step >= 5 && !ready) { ready = true; setPhase('gate'); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const esc = (e) => { if (e.key === 'Escape') setPhase('gate') }
    window.addEventListener('keydown', esc)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', esc) }
  }, [phase])

  // Lenis + GSAP ticker, created once, held until the show starts.
  useEffect(() => {
    if (REDUCE) return
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    lenis.stop()
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(raf); lenis.destroy(); lenis = null }
  }, [])

  // Latest repos, silently falling back to the snapshot.
  useEffect(() => {
    const ac = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((list) => {
        if (!Array.isArray(list)) return
        const mapped = list.filter((r) => !r.fork).map((r) => ({
          name: r.name, language: r.language, stars: r.stargazers_count, sizeKB: r.size,
          pushedAt: (r.pushed_at || '').slice(0, 10), url: r.html_url, homepage: r.homepage,
        })).filter((r) => r.pushedAt).sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
        if (mapped.length) { setRepos(mapped); setLive(true) }
      })
      .catch(() => {})
    return () => ac.abort()
  }, [])
  useEffect(() => { if (live) ScrollTrigger.refresh() }, [live])

  const unlock = () => {
    document.documentElement.classList.remove('locked')
    lenis?.start()
    ScrollTrigger.refresh()
  }

  const start = (withSound) => {
    sound.current = withSound
    if (withSound && audio.el) { ensureAnalyser(); audio.el.play().catch(() => {}) }
    setPhase('show')
  }

  const toggleSound = () => {
    if (!audio.el) return
    if (audio.el.paused) { ensureAnalyser(); audio.el.play().catch(() => {}) } else audio.el.pause()
  }

  // Title card: name, "in", then AUTOMATE slams on the first swell of the score.
  useEffect(() => {
    if (phase !== 'show') return
    if (REDUCE) { setLeaderGone(true); unlock(); return }
    let raf
    gsap.timeline()
      .to('.leader', { autoAlpha: 0, duration: 0.5, onComplete: () => setLeaderGone(true) })
      .fromTo('.tc-name', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 0.3)
      .fromTo('.tc-in', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.9)
    let fired = false, avg = 0
    const t0 = performance.now()
    const slam = () => {
      if (fired) return
      fired = true
      gsap.timeline({ onComplete: unlock })
        .fromTo('.tc-ch', { autoAlpha: 0, scale: 2.8, y: -40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: 'expo.out', stagger: 0.045 })
        .fromTo('.tc-flash', { autoAlpha: 0.85 }, { autoAlpha: 0, duration: 0.7 }, '<0.3')
        .fromTo('.hero-stage', { x: -14 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,0.3)' }, '<')
        .fromTo('.leak', { xPercent: -70, autoAlpha: 0 }, { xPercent: 70, autoAlpha: 0.9, duration: 1.8, ease: 'power1.inOut', stagger: 0.25 }, '<')
        .fromTo('.tc-meta, .hero-foot, .site-head', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.6 }, '-=1.4')
    }
    const wait = () => {
      const dt = performance.now() - t0
      const lv = level()
      avg = avg * 0.94 + lv * 0.06
      if (dt > (sound.current ? 4600 : 1700) || (sound.current && dt > 1400 && lv > 0.2 && lv > avg * 1.25)) slam()
      else raf = requestAnimationFrame(wait)
    }
    raf = requestAnimationFrame(wait)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // Scroll choreography.
  useEffect(() => {
    if (phase !== 'show' || REDUCE) return
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray('.tl-line')
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.trailer', start: 'top top', end: '+=360%', pin: true, scrub: 1 } })
      lines.forEach((l, i) => {
        tl.fromTo(l, { autoAlpha: 0, y: 70, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1 })
        if (i === 2) tl.fromTo('.trailer-bg', { autoAlpha: 0, scale: 1.18 }, { autoAlpha: 0.5, scale: 1, duration: 2 }, '<')
        if (i < lines.length - 1) tl.to(l, { autoAlpha: 0, y: -70, duration: 0.8 }, '+=0.7')
      })

      const track = document.querySelector('.wall-track')
      const dist = () => track.scrollWidth - window.innerWidth
      const wall = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.wall', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } })
      gsap.utils.toArray('.p-motif').forEach((m) => gsap.fromTo(m, { x: 50 }, {
        x: -50, ease: 'none', scrollTrigger: { trigger: m.closest('.poster'), containerAnimation: wall, start: 'left right', end: 'right left', scrub: true },
      }))

      gsap.utils.toArray('.interval').forEach((iv) => {
        const q = gsap.utils.selector(iv)
        gsap.timeline({ scrollTrigger: { trigger: iv, start: 'top top', end: '+=220%', pin: true, scrub: 1 } })
          .to(q('.iv-curtain.l'), { xPercent: -101, duration: 1.2 })
          .to(q('.iv-curtain.r'), { xPercent: 101, duration: 1.2 }, '<')
          .from(q('.iv-setup'), { autoAlpha: 0, y: 40, duration: 0.6 }, '-=0.4')
          .from(q('.iv-meme'), { autoAlpha: 0, scale: 0.8, rotate: -5, duration: 0.8 })
          .from(q('.iv-reframe'), { autoAlpha: 0, scale: 1.7, duration: 0.6, ease: 'power4.out' }, '+=0.3')
          .to({}, { duration: 0.6 })
      })

      gsap.utils.toArray('.slate').forEach((s) => gsap.fromTo(s, { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: s, start: 'top 90%', end: 'top 50%', scrub: true },
      }))
      gsap.utils.toArray('.pq-photo').forEach((p) => gsap.fromTo(p, { clipPath: 'inset(100% 0 0 0)' }, {
        clipPath: 'inset(0% 0 0 0)', ease: 'none', scrollTrigger: { trigger: p, start: 'top 90%', end: 'top 45%', scrub: true },
      }))
      gsap.utils.toArray('.pq-num').forEach((n) => gsap.fromTo(n, { yPercent: 30 }, {
        yPercent: -30, ease: 'none', scrollTrigger: { trigger: n.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      }))
      gsap.set('.rv, .laurel', { autoAlpha: 0 })
      ScrollTrigger.batch('.rv, .laurel', {
        start: 'top 88%', once: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out' }),
      })
      gsap.fromTo('.run-cover', { scaleX: 1 }, { scaleX: 0, ease: 'none', scrollTrigger: { trigger: '.run', start: 'top 85%', end: 'bottom 45%', scrub: true } })

      const roll = document.querySelector('.roll')
      gsap.fromTo(roll, { y: () => window.innerHeight * 0.9 }, {
        y: () => -roll.offsetHeight, ease: 'none',
        scrollTrigger: { trigger: '.credits', start: 'top top', end: () => '+=' + (roll.offsetHeight + window.innerHeight), pin: true, scrub: true, invalidateOnRefresh: true },
      })
    })
    return () => ctx.revert()
  }, [phase])

  // Projector beam: one rAF, only while the score plays.
  useEffect(() => {
    const b = beam.current
    if (!playing || !b) return
    let raf, s = 0
    const loop = () => {
      s += (level() - s) * 0.25
      b.style.opacity = (0.12 + s * 1.4).toFixed(3)
      b.style.transform = `rotate(${(s * 4).toFixed(2)}deg) scaleX(${(1 + s * 0.8).toFixed(3)})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); b.style.opacity = ''; b.style.transform = '' }
  }, [playing])

  // "Leaving before the climax?" once, desktop only.
  useEffect(() => {
    if (phase !== 'show' || !window.matchMedia('(pointer: fine)').matches) return
    let shown = false
    const out = (e) => { if (!shown && !e.relatedTarget && e.clientY <= 0) { shown = true; setExit(true) } }
    document.addEventListener('mouseout', out)
    return () => document.removeEventListener('mouseout', out)
  }, [phase])

  const title = 'AUTOMATE'.split('')

  return (
    <>
      <audio ref={(el) => { audio.el = el }} src={asset('audio/fin-de-la-odisea.mp3')} preload="none" loop
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <div className="grain" aria-hidden="true" />
      <div className="beam" ref={beam} aria-hidden="true" />
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); go('trailer') }}>Skip to the film</a>

      {!leaderGone && (
        <div className="leader" role="dialog" aria-modal="true" aria-label="Opening titles">
          <div className="flicker" aria-hidden="true" />
          {phase === 'leader' ? (
            <>
              <div className="leader-ring" aria-hidden="true">
                <div className="sweep" key={count} />
                <span className="cross h" /><span className="cross v" />
                <span className="ring-a" /><span className="ring-b" />
                <span className="leader-num">{count}</span>
              </div>
              <p className="leader-cap" role="status">Threading the reel · {pct}%</p>
              <button className="btn ghost leader-skip" onClick={() => setPhase('gate')}>Skip the leader</button>
            </>
          ) : (
            <div className="gate">
              <p className="kicker">Reel loaded · Screen 01</p>
              <p className="gate-h">The show is about to begin.</p>
              <button className="btn big" autoFocus onClick={() => start(true)}>▶ Start the show <small>with the score</small></button>
              <button className="btn ghost" onClick={() => start(false)}>Watch silently</button>
              <p className="gate-note">Score: “FIN DE LA ODISEA”. Toggle it any time from the projector button.</p>
            </div>
          )}
        </div>
      )}

      <header className="site-head">
        <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); go('top') }} aria-label="Now showing: back to the top">
          <span className="bulbs" aria-hidden="true" />NOW SHOWING
        </a>
        <nav aria-label="Sections">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id) }}>{label}</a>)}
        </nav>
        <button className={`proj ${playing ? 'on' : ''}`} onClick={toggleSound} aria-pressed={playing} aria-label={playing ? 'Pause the score' : 'Play the score'}>
          <span className="eq" aria-hidden="true"><i /><i /><i /></span>{playing ? 'Score on' : 'Score off'}
        </button>
      </header>

      <main id="main">
        <section className="hero" id="top" tabIndex={-1}>
          <div className="leak a" aria-hidden="true" /><div className="leak b" aria-hidden="true" />
          <div className="tc-flash" aria-hidden="true" />
          <div className="hero-stage">
            <h1 className="tc" aria-label={`${me.name} in Automate`}>
              <span className="tc-name" aria-hidden="true">{me.name}</span>
              <span className="tc-in" aria-hidden="true">in</span>
              <span className="tc-title" aria-hidden="true">{title.map((c, i) => <span className="tc-ch" key={i}>{c}</span>)}</span>
            </h1>
            <p className="tc-meta">{me.role} · Associate Engineer, Indo Tech Transformers · {me.city}</p>
          </div>
          <div className="hero-foot">
            <span>Certified U/A · Unbelievable Automation</span>
            <button className="cue" onClick={() => go('trailer')}>Roll the trailer ↓</button>
            <span>Runtime: 2022 to now</span>
          </div>
        </section>

        <section className="trailer" id="trailer" tabIndex={-1} aria-label="Trailer">
          <img className="trailer-bg" src={me.portrait} alt="" decoding="async" />
          <div className="trailer-lines">
            {TRAILER.map((l) => <p className="tl-line" key={l}>{l}</p>)}
            <p className="tl-line tl-final">Box office: <b>9 apps.</b><br />Budget: <b>one engineer.</b></p>
          </div>
        </section>

        <div className="ticker" aria-label="Numbers">
          <div className="ticker-in">
            {[0, 1].map((k) => <span key={k} aria-hidden={k === 1}>
              {numbers.map((n) => <span key={n.unit}><b>{n.value} {n.unit}</b> {n.label} <i>✦</i> </span>)}
              <span><b>2 h → 5 min</b> test planning <i>✦</i> </span>
            </span>)}
          </div>
        </div>

        <section className="wall" id="posters" tabIndex={-1} aria-labelledby="wall-h">
          <div className="wall-track">
            <div className="wall-intro">
              <p className="kicker slate">Reel 01 · The poster wall</p>
              <h2 id="wall-h" className="mass">Nine releases.<br />One factory.<br /><span className="hl">Zero spreadsheets</span> left behind.</h2>
              <p className="lede">Every app is in production at Indo Tech Transformers. Each one gets the poster it deserves: one colour, one idea, all the white space.</p>
              <figure className="inspo">
                <img src={asset('img/pins/mahaan-poster.jpg')} alt="Minimalist black and white Mahaan film poster with two mirrored profiles" loading="lazy" decoding="async" />
                <figcaption>The look we borrowed: the Mahaan minimalist poster.</figcaption>
              </figure>
            </div>
            {apps.map((a, i) => <Poster key={a.name} app={a} i={i} />)}
            <div className="wall-out">
              <p className="kicker">Short films</p>
              {sideProjects.map((s) => (
                <p key={s.name} className="short">
                  {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a> : <span>{s.name}</span>}
                  <small>{s.pitch}</small>
                </p>
              ))}
            </div>
          </div>
        </section>

        <Interval n={1}
          setup="Interval block twist: the hero of this software story has a degree in Electrical and Electronics Engineering."
          img={asset('img/pins/jesse.jpg')} alt="Jesse Pinkman leaning out of a red car window, side-eyeing the camera"
          caption="“Yeah, Python!”"
          reframe="ELECTRICAL ≠ OFF-TOPIC"
          after="161 kV test bay by day, nine shipped apps by night. That's why the Test Planner knows every IEC 60076 test." />

        <section className="prequels" id="prequels" tabIndex={-1} aria-labelledby="pq-h">
          <p className="kicker slate">Reel 02 · The prequels</p>
          <h2 id="pq-h" className="mass">Every franchise<br />has an origin story.</h2>
          <ol className="pq-list">
            {experience.map((x, i) => {
              const main = i === experience.length - 1
              const shots = x.id === 'buhler' ? field[0].photos : []
              return (
                <li key={x.id} className={`pq ${main ? 'main' : ''}`}>
                  <span className="pq-num" aria-hidden="true">{ROMAN[i]}</span>
                  <div className="pq-body rv">
                    <p className="pq-part">{main ? 'The main feature' : `Part ${ROMAN[i]}`} · {x.year}</p>
                    <h3>{x.company}</h3>
                    <p className="pq-role">{x.role} · {x.place}</p>
                    <p className="pq-short">{x.short}</p>
                    <p>{x.text}</p>
                    {x.id === 'buhler' && <p><a className="ul" href={field[0].link.url} target="_blank" rel="noreferrer">{field[0].link.label} ↗</a></p>}
                  </div>
                  {x.photo && (
                    <div className="pq-shots">
                      <figure className="pq-photo"><img src={x.photo} alt={x.photoAlt} loading="lazy" decoding="async" /></figure>
                      {shots.map((s) => <figure key={s.src} className="pq-photo small"><img src={s.src} alt={s.alt} loading="lazy" decoding="async" /><figcaption>{s.caption}</figcaption></figure>)}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>

        <Interval n={2}
          setup="Second half. Someone on the shop floor says: “It's just a quick manual step.”"
          img={asset('img/pins/vazhka-nadakam.jpg')} alt="Black and white photo of a man in a white shirt, finger on his lips, deep in thought"
          caption="“Eaaaa vazhka nadakamahhh 🙃”" sub="Tamil, roughly: “Ah, life is such a drama.”"
          reframe="QUICK MANUAL STEP = NEXT APP"
          after={me.lines[1]} />

        <section className="laurels" id="laurels" tabIndex={-1} aria-labelledby="la-h">
          <p className="kicker slate">Reel 03 · Festival run</p>
          <h2 id="la-h" className="mass">Official selection.<br />Several times.</h2>
          <ul className="laurel-grid">
            {awards.map((a) => (
              <li key={a.title} className="laurel">
                <Laurel />
                <div className="laurel-in"><span className="laurel-yr">{a.year}</span><b>{a.title}</b></div>
                <p>{a.detail}</p>
              </li>
            ))}
            <li className="laurel jury">
              <Laurel />
              <div className="laurel-in"><span className="laurel-yr">Special mention</span><b>{leadership.title}</b></div>
              <p>{leadership.text}</p>
            </li>
          </ul>
          <div className="stills">
            {[...awards.filter((a) => a.photo).map((a) => ({ src: a.photo, alt: a.photoAlt })), ...leadership.photos].map((p) => (
              <figure key={p.src} className="still rv"><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /></figure>
            ))}
          </div>
        </section>

        <section className="post-prod" aria-labelledby="ai-h">
          <p className="kicker slate">Reel 04 · In post-production</p>
          <h2 id="ai-h" className="mass">{ai.agent.name}: <span className="hl">twelve reels</span>.</h2>
          <p className="lede rv">{ai.agent.pitch}</p>
          <ol className="reels rv">{ai.agent.versions.map((v, i) => <li key={v}><span>v{i + 1}</span>{v}</li>)}</ol>
          <div className="pp-cols">
            <div className="rv"><h3>{ai.rag.name}</h3><p>{ai.rag.pitch}</p><p className="steps">{ai.rag.steps.join(' → ')}</p></div>
            <div className="rv"><h3>{ai.browser.name}</h3><p>{ai.browser.pitch}</p><p className="steps">{ai.stack.join(' · ')}</p></div>
          </div>
        </section>

        <section className="boxoffice" id="boxoffice" tabIndex={-1} aria-labelledby="bo-h">
          <p className="kicker slate">Reel 05 · Filmed on location in Commit City</p>
          <h2 id="bo-h" className="mass">Box office.</h2>
          <p className="bio rv">“{snapshot.bio.split(/\r?\n/).join(' / ')}”</p>
          <div className="bo-stats rv">
            <div><b>{snapshot.contributionsLastYear}</b>contributions · last year</div>
            <div><b>{snapshot.commitsLastYear}</b>commits</div>
            <div><b>{snapshot.prsLastYear}</b>pull requests</div>
            <div><b>{fmtDate(snapshot.joined)}</b>in theatres since</div>
          </div>
          <p className="bo-live"><span className={live ? 'dot on' : 'dot'} aria-hidden="true" />{live ? 'Live from GitHub' : `Snapshot · ${fmtDate(snapshot.snapshotAt.slice(0, 10))}`} · Gross = repo size · Release = last push</p>
          <Board repos={repos} live={live} />
          <p className="bo-more"><a className="ul" href={me.github} target="_blank" rel="noreferrer">All {repos.length} titles on GitHub ↗</a></p>
          <Run />
        </section>

        <section className="book" id="book" tabIndex={-1} aria-labelledby="book-h">
          <p className="kicker slate">Reel 06 · Book the show</p>
          <h2 id="book-h" className="mass">{me.lines[2]}</h2>
          <Ticket />
        </section>
      </main>

      <footer>
        <section className="credits" aria-label="End credits">
          <div className="roll">
            <p className="cr-big">AUTOMATE</p>
            <dl>
              <div><dt>Directed by</dt><dd>{me.name}</dd></div>
              <div><dt>Written, coded and tested by</dt><dd>{me.name}</dd></div>
              <div><dt>Starring</dt><dd>Python <i>as itself</i></dd></div>
              <div><dt>Night shift</dt><dd>Coffee</dd></div>
              <div><dt>Supporting cast</dt><dd>“Team effort” 😏</dd></div>
              {Object.entries(skills).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v.join(' · ')}</dd></div>)}
              <div><dt>Training montage</dt><dd>{certifications.join(' · ')}</dd></div>
              <div><dt>Original score</dt><dd>“FIN DE LA ODISEA”</dd></div>
              <div><dt>Posters inspired by</dt><dd>The Mahaan minimalist poster</dd></div>
              <div><dt>Stills</dt><dd>Some images via the owner’s Pinterest boards.</dd></div>
            </dl>
            <p className="cr-note">No spreadsheets were harmed in the making of this film. Several were retired.</p>
            <p className="cr-note">Don’t leave yet.</p>
          </div>
        </section>
        <PostCredits />
        <p className="fine">© {me.name} · Some images via the owner’s Pinterest boards. · Score: “FIN DE LA ODISEA”, from the owner’s music folder.</p>
      </footer>

      {exit && (
        <div className="exit" role="alertdialog" aria-labelledby="exit-h">
          <p id="exit-h">Leaving before the post-credits scene?</p>
          <button className="btn" autoFocus onClick={() => { setExit(false); go('sequel') }}>Show me the sequel</button>
          <button className="btn ghost" onClick={() => setExit(false)}>I’ll come back</button>
        </div>
      )}
    </>
  )
}

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, sideProjects, ai, awards, leadership, field, certifications, skills, asset } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'
import { SPECIES } from './species.js'

gsap.registerPlugin(ScrollTrigger)

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const audioRoute = { analyser: null } // the tank reads the song's bass from here
let lenis = null

const mail = `mailto:${me.email}?subject=${encodeURIComponent('Message in a bottle')}`
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
function rand(seed) {
  let a = seed
  return () => { a = (a + 0x6d2b79f5) | 0; let r = Math.imul(a ^ (a >>> 15), 1 | a); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296 }
}

function glide(e) {
  const id = e.currentTarget.getAttribute('href')
  if (!lenis || !id?.startsWith('#')) return
  e.preventDefault()
  lenis.scrollTo(id === '#top' ? 0 : id, { duration: 1.4 })
}

function FishIcon({ sp, size = 48 }) {
  const ry = 5 + sp.body[1] * 7
  return (
    <svg className="fishicon" viewBox="0 0 48 24" width={size} height={size / 2} aria-hidden="true">
      <path d="M13 12 2 4c2 5 2 11 0 16Z" fill={sp.b} stroke="#1d1a16" strokeWidth="1" />
      <ellipse cx="28" cy="12" rx="16" ry={ry} fill={sp.a} stroke="#1d1a16" strokeWidth="1.2" />
      <circle cx="38" cy="10.5" r={sp.eye ? 2.6 : 1.6} fill="#1d1a16" />
    </svg>
  )
}

function Tide() {
  return <div className="tide" aria-hidden="true"><div className="tide-water"><i /><i /><i /><i /></div></div>
}

function useGithub() {
  const [gh, setGh] = useState(snapshot)
  useEffect(() => {
    const ac = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        setGh((g) => ({
          ...g,
          repos: list.slice(0, 24).map((r) => ({
            name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
            sizeKB: r.size, pushedAt: (r.pushed_at || '').slice(0, 10), fork: r.fork, url: r.html_url,
          })),
        }))
      })
      .catch(() => { /* offline or rate-limited: the snapshot stays */ })
    return () => ac.abort()
  }, [])
  return gh
}

/* ---------- the tank (hero) ---------- */

function Tank({ intro, onReady, onSkip, tankRef, depthRef }) {
  const canvasRef = useRef(null)
  const [focus, setFocus] = useState(-1)
  const [spelled, setSpelled] = useState(false)

  useEffect(() => {
    let tank, dead = false, io, ro, tick
    const canvas = canvasRef.current
    import('./tank.js')
      .then(({ createTank }) => {
        if (dead) return
        tank = createTank(canvas, { small: window.matchMedia('(max-width: 720px)').matches, audio: audioRoute, onLetters: setSpelled })
        tankRef.current = tank
        tank.setDepth(depthRef.current)
        ro = new ResizeObserver(() => { tank.resize(); if (reduced) tank.renderStill() })
        ro.observe(canvas)
        if (reduced) tank.renderStill()
        else {
          tick = (time, dt) => tank.tick(dt)
          gsap.ticker.add(tick)
          io = new IntersectionObserver(([e]) => tank.setActive(e.isIntersecting))
          io.observe(canvas)
        }
        onReady(true)
      })
      .catch(() => onReady(false)) // no WebGL: the painted water behind the canvas stays
    return () => {
      dead = true
      if (tick) gsap.ticker.remove(tick)
      io?.disconnect(); ro?.disconnect(); tank?.dispose()
      tankRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i) => {
    setFocus(i)
    tankRef.current?.setFocus(i)
    if (reduced) tankRef.current?.renderStill()
  }
  const point = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    tankRef.current?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
  }
  const knock = (e) => {
    if (e.target.closest('a, button, .card')) return
    const r = e.currentTarget.getBoundingClientRect()
    tankRef.current?.tap(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
  }

  return (
    <section className="tank" id="tank" data-intro={intro} onPointerMove={point} onPointerDown={knock} aria-label="The tank">
      <div className="glass">
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="hood" aria-hidden="true"><span>Tank No. 9</span><span>Fresh water · Est. 2022</span></div>
      </div>

      {intro && <button className="skip" onClick={onSkip}>Skip intro <kbd>Esc</kbd></button>}

      <div className="layers">
        <div className="layer l-surface">
          <div className="card label">
            <p className="tag">Surface · {me.city}</p>
            <h1>{me.name}</h1>
            <p className="role">{me.role}.</p>
            <p className="hook">Most automations die in the first week. <em>These nine are still swimming.</em></p>
            <p className="small">Nine apps in production at Indo Tech Transformers. Point at a name and that fish swims up to the glass.</p>
          </div>
          <div className="card stock">
            <p className="tag">In stock: 9 · all alive</p>
            <ul onMouseLeave={() => pick(-1)}>
              {apps.map((a, i) => (
                <li key={a.name} className={focus === i ? 'on' : ''}>
                  <FishIcon sp={SPECIES[i]} size={34} />
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer" onMouseEnter={() => pick(i)} onFocus={() => pick(i)} onBlur={() => pick(-1)}>
                      {a.name}<span className="sr"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <button type="button" onMouseEnter={() => pick(i)} onFocus={() => pick(i)} onBlur={() => pick(-1)} onClick={() => pick(focus === i ? -1 : i)}>{a.name}</button>
                  )}
                  <span className="pitch">{SPECIES[i].kind}. {a.pitch}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="layer l-reef">
          <div className="card report">
            <p className="tag">Reef · water report</p>
            <h2>Mid-tank reading. Every level healthy.</h2>
            <ul>
              {numbers.map((n) => (
                <li key={n.unit}><b>{n.value}</b><span><i>{n.unit}</i> {n.label}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="layer l-sand">
          <div className="card keeper">
            <img src={me.portrait} alt={`Portrait of ${me.name}`} width="160" height="160" />
            <div>
              <p className="tag">Sand · the keeper</p>
              <h2>{me.lines[3]}</h2>
              <p>{me.field}, by degree. {me.lines[1]}</p>
              <a className="btn" href={me.resume} target="_blank" rel="noreferrer">Here&rsquo;s the résumé anyway (PDF)</a>
            </div>
          </div>
        </div>
      </div>

      <div className="gauge" aria-hidden="true"><span>Surface</span><span>Reef</span><span>Sand</span><i /></div>

      <button type="button" className="sign" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); tankRef.current?.tap((r.left / window.innerWidth) * 2 - 1, -0.6) }}>
        Please do not tap the glass.
      </button>
      <p className={`spelled ${spelled ? 'on' : ''}`} role="status" aria-live="polite">
        {spelled ? 'You tapped three times. The fish have a message: HIRE KRISH.' : ''}
      </p>
    </section>
  )
}

/* ---------- meme intermission ---------- */

function Meme({ id, setup, img, alt, big, after }) {
  return (
    <section className="meme" id={id}>
      <p className="setup">{setup}</p>
      <figure className="bowl"><img src={img} alt={alt} loading="lazy" decoding="async" /></figure>
      <p className="reframe"><b>{big}</b><span>{after}</span></p>
    </section>
  )
}

/* ---------- the jar shelf (experience) ---------- */

const SPECIMEN = { mettur: '4 × 210 MW', inovate: 'Project: Phantom' }

function Jars() {
  const [sel, setSel] = useState(experience.length - 1)
  const e = experience[sel]
  return (
    <section className="jars paper" id="jars">
      <Tide />
      <header className="head">
        <p className="tag">Shelf one</p>
        <h2>Five jars. Oldest on the left.</h2>
        <p>Every place he worked, kept in a jar with its label still on. Pick one to read the label.</p>
      </header>
      <div className="shelf" role="group" aria-label="Experience">
        {experience.map((x, i) => (
          <button key={x.id} type="button" className={`jar ${i === sel ? 'on' : ''}`} aria-pressed={i === sel} onClick={() => setSel(i)}>
            <span className="lid" aria-hidden="true" />
            <span className="body">
              <span className="jar-water" aria-hidden="true" />
              {x.photo ? <img src={x.photo} alt={x.photoAlt} loading="lazy" decoding="async" /> : <span className="specimen">{SPECIMEN[x.id]}</span>}
            </span>
            <span className="jar-tag"><b>{x.year}</b> {x.company}</span>
          </button>
        ))}
      </div>
      <article className="jar-label" aria-live="polite">
        <p className="tag">{e.year} · {e.place}</p>
        <h3>{e.role}, {e.company}</h3>
        <p className="short">{e.short}</p>
        <p>{e.text}</p>
      </article>
    </section>
  )
}

/* ---------- field notes, leadership, ribbons ---------- */

function Field() {
  const b = field[0]
  return (
    <section className="field paper" id="field">
      <Tide />
      <header className="head">
        <p className="tag">Shelf two</p>
        <h2>Collected in the field.</h2>
      </header>
      <div className="notes">
        <article className="note-card">
          <p className="tag">{b.when}</p>
          <h3>{b.title}</h3>
          <p>{b.text}</p>
          <a className="btn" href={b.link.url} target="_blank" rel="noreferrer">{b.link.label}<span className="sr"> (opens in a new tab)</span></a>
        </article>
        {b.photos.map((p) => (
          <figure key={p.src} className="polaroid"><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /><figcaption>{p.caption}</figcaption></figure>
        ))}
      </div>
      <div className="lead">
        <article className="note-card">
          <p className="tag">Leadership</p>
          <h3>{leadership.title}</h3>
          <p>{leadership.text}</p>
        </article>
        {leadership.photos.map((p) => (
          <figure key={p.src} className="polaroid"><img src={p.src} alt={p.alt} loading="lazy" decoding="async" /></figure>
        ))}
      </div>
      <div className="ribbons">
        <h3>Ribbons from the fish show.</h3>
        <p className="aside">Yes, one of them is from an actual Fish Tank. He has form with tanks.</p>
        <ol>
          {awards.map((a) => (
            <li key={a.title} className={a.title.includes('Fish Tank') ? 'gold' : ''}>
              <span className="rosette" aria-hidden="true">{a.year}</span>
              <div><b>{a.title}</b><span>{a.detail}</span></div>
              {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" decoding="async" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------- AI: grown in the tank ---------- */

function Grown() {
  return (
    <section className="grown paper" id="grown">
      <Tide />
      <header className="head">
        <p className="tag">The breeding tank</p>
        <h2>One agent, raised from fry. Twelve versions.</h2>
        <p>{ai.agent.name}: {ai.agent.pitch}</p>
      </header>
      <ol className="fry">
        {ai.agent.versions.map((v, i) => (
          <li key={v} style={{ '--s': 0.45 + (i / 11) * 0.75 }}>
            <FishIcon sp={SPECIES[i % 9]} size={56} />
            <span><b>v{i + 1}</b> {v}</span>
          </li>
        ))}
      </ol>
      <div className="filter">
        <div>
          <h3>{ai.rag.name}: a filter for the shop floor.</h3>
          <p>{ai.rag.pitch}</p>
        </div>
        <ol className="stages">{ai.rag.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </div>
      <p className="browser"><b>{ai.browser.name}.</b> {ai.browser.pitch}</p>
      <ul className="chips" aria-label="AI stack">{ai.stack.map((s) => <li key={s}>{s}</li>)}</ul>
    </section>
  )
}

/* ---------- small bowls, supplies, care sheet ---------- */

function Bowls() {
  return (
    <section className="bowls paper" id="bowls">
      <Tide />
      <header className="head">
        <p className="tag">Back of the shop</p>
        <h2>Smaller bowls. Also alive.</h2>
      </header>
      <ul className="side">
        {sideProjects.map((p) => (
          <li key={p.name}>
            <span className="minibowl" aria-hidden="true" />
            <div>
              <h3>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.name}<span className="sr"> (opens in a new tab)</span></a> : p.name}</h3>
              <p>{p.pitch}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="supplies">
        {Object.entries(skills).map(([k, list]) => (
          <div key={k} className="crate">
            <h3>{k}</h3>
            <ul>{list.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="care">
        <h3>Care sheet</h3>
        <ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
    </section>
  )
}

/* ---------- GitHub: the coral reef ---------- */

const LANG = { Python: '#dd9a2b', JavaScript: '#e0533a', TypeScript: '#e58a73', HTML: '#efe3c8', 'C++': '#9fb1d9' }

function Reef() {
  const gh = useGithub()
  const [hover, setHover] = useState(null)
  const repos = gh.repos
  const W = 1200, BASE = 520

  const corals = useMemo(() => repos.map((r, i) => {
    const rnd = rand(hash(r.name))
    const x0 = 40 + (i + 0.5) * (1120 / repos.length) + (rnd() - 0.5) * 18
    const h = Math.min(330, 70 + Math.log10((r.sizeKB || 1) + 10) * 50)
    const segs = [], tips = []
    const grow = (x, y, ang, len, w, d) => {
      const x2 = x + Math.cos(ang) * len, y2 = y - Math.sin(ang) * len
      const cx = (x + x2) / 2 + (rnd() - 0.5) * len * 0.45, cy = (y + y2) / 2
      segs.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, w })
      if (d === 0) { tips.push([x2, y2]); return }
      const n = rnd() < 0.3 ? 3 : 2
      for (let k = 0; k < n; k++) grow(x2, y2, ang + (k - (n - 1) / 2) * 0.6 + (rnd() - 0.5) * 0.3, len * (0.62 + rnd() * 0.15), w * 0.66, d - 1)
    }
    grow(x0, BASE, Math.PI / 2 + (rnd() - 0.5) * 0.25, h * 0.4, 10, 3)
    return { ...r, segs, tips, x0, color: LANG[r.language] || '#c9a27e' }
  }), [repos])

  const plankton = useMemo(() => gh.days.map(([date, n], i) => {
    const rnd = rand(hash(date))
    const wk = Math.floor(i / 7), dow = i % 7
    return { date, n, dow, x: 30 + wk * (1140 / 52) + (rnd() - 0.5) * 12, y: 40 + dow * 34 + (rnd() - 0.5) * 16, r: n ? 2.4 + Math.sqrt(n) * 1.5 : 1.3 }
  }), [gh.days])
  const best = plankton.find((p) => p.date === gh.bestDay.date)
  const shown = hover != null ? corals[hover] : null

  return (
    <section className="reef" id="reef">
      <header className="head">
        <p className="tag">The bottom of the tank · GitHub</p>
        <h2>The reef grows one commit at a time.</h2>
        <p>
          Every repo is a coral branch, taller the more it holds. Every day of the last year is a speck of plankton,
          and it glows by how much he shipped that day. {gh.contributionsLastYear} contributions, {gh.commitsLastYear} commits,{' '}
          {gh.prsLastYear} pull requests. One very bright speck: <b>{gh.bestDay.contributionCount} on {fmtDate(gh.bestDay.date)}</b>.
        </p>
      </header>
      <div className="reef-stage">
        <svg className="reef-svg" viewBox={`0 0 ${W} 560`} role="group" aria-label={`Coral reef: ${repos.length} repositories`}>
          <defs>
            <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <g aria-hidden="true">
            {[0, 1, 2].map((k) => (
              <g key={k} className={`drift d${k}`}>
                {plankton.filter((p) => p.dow % 3 === k).map((p) => (
                  <circle key={p.date} cx={p.x} cy={p.y} r={p.r} className={p.n ? 'lit' : 'dim'} style={p.n ? { opacity: Math.min(1, 0.45 + p.n / 20) } : undefined} filter={p.n ? 'url(#glow)' : undefined}>
                    <title>{`${fmtDate(p.date)}: ${p.n} contribution${p.n === 1 ? '' : 's'}`}</title>
                  </circle>
                ))}
              </g>
            ))}
            {best && (
              <g className="best">
                <circle cx={best.x} cy={best.y} r={best.r + 9} fill="none" stroke="#f6d27a" strokeWidth="1.5" strokeDasharray="3 4" />
                <text x={Math.min(best.x + best.r + 14, W - 210)} y={best.y + 5}>{`${best.n} on ${fmtDate(best.date)}`}</text>
              </g>
            )}
          </g>
          <path className="sand" d={`M0 ${BASE} Q150 ${BASE - 14} 300 ${BASE} T600 ${BASE} T900 ${BASE} T1200 ${BASE} V560 H0Z`} aria-hidden="true" />
          {corals.map((c, i) => (
            <a key={c.name} href={c.url} target="_blank" rel="noreferrer" className={`coral ${c.fork ? 'fork' : ''} ${hover === i ? 'on' : ''}`}
              aria-label={`${c.name}${c.fork ? ' (fork)' : ''}: ${c.description || 'no description'}. Opens on GitHub.`}
              onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onMouseLeave={() => setHover(null)} onBlur={() => setHover(null)}>
              <rect x={c.x0 - 28} y={BASE - 340} width="56" height="340" fill="transparent" />
              {c.segs.map((s, k) => <path key={k} d={s.d} stroke={c.color} strokeWidth={s.w} pathLength="1" />)}
              {c.tips.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.2" fill={c.color} />)}
            </a>
          ))}
        </svg>
        <div className="coral-tag" aria-hidden="true">
          {shown ? (
            <>
              <b>{shown.name}</b>{shown.fork && <i> · fork, transplanted coral</i>}
              <span>{shown.description || 'No description, just code.'}</span>
              <small>{shown.language || 'Mixed'} · last pushed {shown.pushedAt ? fmtDate(shown.pushedAt) : 'a while ago'}{shown.stars ? ` · ${shown.stars} ★` : ''}</small>
            </>
          ) : <span>Point at a coral branch to read its tag. Click to open the repo.</span>}
        </div>
      </div>
      <blockquote className="bio">
        <p>{gh.bio.split(/\r?\n/).map((l) => <span key={l}>{l}</span>)}</p>
        <footer>{gh.login} on GitHub, member since {gh.joined.slice(0, 4)}</footer>
      </blockquote>
      <details className="repolist">
        <summary>Every branch as a plain list ({repos.length})</summary>
        <ul>{repos.map((r) => <li key={r.name}><a href={r.url} target="_blank" rel="noreferrer">{r.name}</a>{r.fork ? ' (fork)' : ''}{r.description ? `: ${r.description}` : ''}</li>)}</ul>
      </details>
      <a className="btn light" href={me.github} target="_blank" rel="noreferrer">Dive into the whole reef on GitHub<span className="sr"> (opens in a new tab)</span></a>
    </section>
  )
}

/* ---------- CTA: a message in a bottle ---------- */

function Bottle() {
  const [open, setOpen] = useState(false)
  const linkRef = useRef(null)
  useEffect(() => { if (open) setTimeout(() => linkRef.current?.focus({ preventScroll: true }), reduced ? 0 : 900) }, [open])
  return (
    <section className="bottle-sec paper" id="bottle">
      <Tide />
      <header className="head">
        <p className="tag">Last stop · contact</p>
        <h2>Got a manual step that eats your week?</h2>
        <p>Throw it in a bottle. {me.lines[2]}</p>
      </header>
      <div className="beach">
        <button type="button" className={`bottle ${open ? 'open' : ''}`} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="note">
          <svg viewBox="0 0 160 300" aria-hidden="true">
            <g className="cork"><rect x="62" y="6" width="36" height="34" rx="6" fill="#a8784a" stroke="#1d1a16" strokeWidth="3" /></g>
            <path d="M64 38h32v46q0 18 22 34 22 16 22 46v104q0 24-24 24H44q-24 0-24-24V164q0-30 22-46 22-16 22-34Z" fill="#5f7d5a" fillOpacity=".45" stroke="#1d1a16" strokeWidth="4" />
            <g className="scroll-in"><rect x="54" y="150" width="52" height="112" rx="22" fill="#efe3c8" stroke="#c8402a" strokeWidth="3" /><path d="M66 180h28M66 196h28M66 212h20" stroke="#c8402a" strokeWidth="3" /></g>
            <path d="M34 170q-2 40 0 90" stroke="#fff" strokeOpacity=".55" strokeWidth="6" fill="none" strokeLinecap="round" />
          </svg>
          <span>{open ? 'Uncorked' : 'Uncork the bottle'}</span>
        </button>
        <div className="note-wrap" id="note">
          {open && (
            <div className="note">
              <p className="tag">Found inside</p>
              <p className="to">Write to {me.name.split(' ')[0]}:</p>
              <p className="addr">{me.email}</p>
              <a ref={linkRef} className="btn" href={mail}>Send your message</a>
            </div>
          )}
        </div>
        <div className="plain">
          <p>Prefer dry land?</p>
          <ul>
            <li><a href={`mailto:${me.email}`}>Email {me.email}</a></li>
            <li><a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn<span className="sr"> (opens in a new tab)</span></a></li>
            <li><a href={me.github} target="_blank" rel="noreferrer">GitHub<span className="sr"> (opens in a new tab)</span></a></li>
            <li><a href={me.resume} target="_blank" rel="noreferrer">Résumé (PDF)<span className="sr"> (opens in a new tab)</span></a></li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- page ---------- */

export default function App() {
  const audioRef = useRef(null)
  const rootRef = useRef(null)
  const tankRef = useRef(null)
  const depthRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [intro, setIntro] = useState(!reduced)
  const [music, setMusic] = useMusic(() => audioRef.current, (ctx, src) => {
    const an = ctx.createAnalyser()
    an.fftSize = 128
    src.connect(an)
    an.connect(ctx.destination)
    audioRoute.analyser = an
  })

  const skip = () => { tankRef.current?.skipIntro(); setIntro(false) }
  const ready = (ok) => { if (!ok) setIntro(false); else if (!reduced) setTimeout(() => setIntro(false), 3400) }

  useEffect(() => {
    if (!intro) return
    const onKey = (e) => { if (e.key === 'Escape') skip() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [intro])

  useLayoutEffect(() => {
    if (reduced) return
    lenis = new Lenis({ lerp: 0.1 })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      // the descent: surface, reef, sand
      const depth = { p: 0 }
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.tank', start: 'top top', end: '+=280%', pin: true, scrub: 0.6 },
      })
        .to(depth, { p: 1, duration: 1, onUpdate: () => { depthRef.current = depth.p; tankRef.current?.setDepth(depth.p) } }, 0)
        .to('.gauge', { '--d': 1, duration: 1 }, 0)
        .to('.l-surface', { autoAlpha: 0, y: -90, duration: 0.1 }, 0.2)
        .fromTo('.l-reef', { autoAlpha: 0, y: 90 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.34)
        .to('.l-reef', { autoAlpha: 0, y: -90, duration: 0.1 }, 0.6)
        .fromTo('.l-sand', { autoAlpha: 0, y: 90 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.74)

      // sections arrive flooded and drain as they reach you
      gsap.utils.toArray('.tide-water').forEach((el) => {
        gsap.to(el, { yPercent: 102, ease: 'power1.in', scrollTrigger: { trigger: el.closest('section'), start: 'top 92%', end: 'top 12%', scrub: true } })
      })
      // jars fill up as the shelf comes in
      gsap.fromTo('.jar-water', { scaleY: 0.08 }, { scaleY: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.shelf', start: 'top 85%', end: 'bottom 55%', scrub: true } })
      // meme: the bowl drops in with a splash, then the punchline surfaces
      gsap.utils.toArray('.meme').forEach((sec) => {
        gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 65%', toggleActions: 'play none none reverse' } })
          .from(sec.querySelector('.setup'), { y: 30, autoAlpha: 0, duration: 0.5 })
          .from(sec.querySelector('.bowl'), { y: -160, rotate: -8, autoAlpha: 0, duration: 0.8, ease: 'bounce.out' }, '-=0.1')
          .from(sec.querySelector('.reframe'), { y: 60, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.6)' }, '-=0.2')
      })
      // the reef grows as you swim over it
      gsap.fromTo('.reef-svg', { '--g': 1 }, { '--g': 0, ease: 'none', scrollTrigger: { trigger: '.reef-stage', start: 'top 90%', end: 'center 50%', scrub: true } })
      gsap.from('.fry li', { scale: 0.2, autoAlpha: 0, stagger: 0.05, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: '.fry', start: 'top 80%' } })
    }, rootRef)

    return () => { ctx.revert(); gsap.ticker.remove(raf); lenis.destroy(); lenis = null }
  }, [])

  return (
    <div ref={rootRef} className={reduced ? 'still' : 'motion'} id="top">
      <audio ref={audioRef} src={asset('audio/fish-in-the-pool.mp3')} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />

      <nav className="nav" aria-label="Main">
        <a href="#top" onClick={glide} className="brand">KRS <span>· Tank No. 9</span></a>
        <ul>
          <li><a href="#jars" onClick={glide}>Jars</a></li>
          <li><a href="#field" onClick={glide}>Field</a></li>
          <li><a href="#reef" onClick={glide}>Reef</a></li>
          <li><a href="#bottle" onClick={glide}>Bottle</a></li>
        </ul>
        <button type="button" data-music className={`music ${playing ? 'on' : ''}`} onClick={() => setMusic(!music)}>
          <span className="bars" aria-hidden="true"><i /><i /><i /></span>
          {music ? 'Music off' : 'Music on'}
        </button>
      </nav>

      <main>
        <Tank intro={intro} onReady={ready} onSkip={skip} tankRef={tankRef} depthRef={depthRef} />

        <Meme
          id="meme-1"
          setup="Test planning used to take two hours. He looked at it like this."
          img={asset('img/pins/jesse.jpg')}
          alt="Jesse Pinkman leaning out of a red car window, side-eyeing the camera"
          big="2 hours → 5 minutes."
          after="Python automation at Indo Tech Transformers. The look was justified."
        />
        <Jars />
        <Field />
        <Grown />
        <Bowls />
        <Meme
          id="meme-2"
          setup="Bühler, before the tool: classify each feeder, sum the load, budget the I/O cards. By hand. In Excel."
          img={asset('img/pins/scared.jpg')}
          alt="A chrome figure clutching its head in a red glare, scared and tired"
          big="30–40 minutes → under 30 seconds."
          after="And 90% of the manual calculation errors, gone. Nobody clutches their head now."
        />
        <Reef />
        <Bottle />
      </main>

      <footer className="foot">
        <p>{me.name} · {me.role} · {me.city}</p>
        <p>Song: &ldquo;fish in the pool&rdquo;. Memes belong to their makers. Built with React, Three.js, GSAP and Lenis.</p>
        <p className="hint">Please do not tap the glass. Especially not three times.</p>
      </footer>
    </div>
  )
}

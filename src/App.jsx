import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills, asset } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'
import { SEGMENTS, weight, smooth } from './chapters.js'

gsap.registerPlugin(ScrollTrigger)

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const planner = apps.find((a) => a.name === 'Transformer Test Planner')
const buhler = field[0]
const MAIL = `mailto:${me.email}?subject=${encodeURIComponent('Order: 1x KRISH action figure (Series 2026)')}&body=${encodeURIComponent('Hi Krishna,\n\nWe would like to order one. ')}`

const CHAPTERS = [
  {
    tag: 'Acc. 01 · Laptop',
    title: 'Nine apps. One factory.',
    body: 'Zero spreadsheets left behind. All nine run in production at Indo Tech Transformers, and 128 tests guard dispatch.',
    apps: true,
  },
  {
    tag: 'Acc. 02 · Hard hat',
    title: 'The 161 kV test bay.',
    body: 'Indo Tech Transformers, Kanchipuram. He joined the test bay as an R&D intern and is now an Associate Engineer. Test planning went from 2 hours to 5 minutes.',
  },
  {
    tag: 'Acc. 03 · Multimeter',
    title: 'Reads 90% fewer errors.',
    body: 'Bühler India, Bangalore. Sizing feeders, loads and I/O cards took 30 to 40 minutes by hand. The tool he co-built does it in under 30 seconds and removed 90% of manual calculation errors.',
    link: buhler.link,
  },
  {
    tag: 'Acc. 04 · Cable',
    title: 'Plugs the factory into the cloud.',
    body: 'He now leads the OT-IT integration at Indo Tech: sensors, energy meters and cloud, on one line.',
  },
  {
    tag: 'Acc. 05 · Mini transformer',
    title: 'Tested to IEC 60076.',
    body: 'Transformers tested to IEC 60076 and IS 2026. Then he built the Transformer Test Planner: every IEC 60076 test, planned per unit.',
    link: { url: planner.url, label: 'Open the Test Planner' },
  },
]

function Ext({ href, children, className }) {
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>
}

/* ---------- the blister pack ---------- */
function Stage({ getLevel, onRare, sceneRef }) {
  const canvas = useRef(null)
  const [ready, setReady] = useState(false)
  const [loaded, setLoaded] = useState(0)
  const [popped, setPopped] = useState(false)
  const [noGL, setNoGL] = useState(false)
  const [gl, setGl] = useState(false)
  const skipped = useRef(false)

  useEffect(() => {
    let dead = false
    let sc
    const id = setTimeout(() => {
      import('./scene.js').then(({ createScene }) => {
        if (dead) return
        sc = createScene(canvas.current, {
          reduced: reducedMotion(),
          figureUrl: asset('models/me-3d.glb'),
          fallbackUrl: asset('img/gen/me-3d.webp'),
          getLevel,
          onProgress: (p) => setLoaded(Math.round(p * 10) * 10),
          onPop: () => setPopped(true),
          onRare,
          onReady: () => setReady(true),
        })
        if (skipped.current) sc.skip()
        setGl(true)
        sceneRef.current = sc
      }).catch(() => setNoGL(true))
    }, 30)
    return () => { dead = true; clearTimeout(id); sc?.destroy(); sceneRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const skip = () => { skipped.current = true; sceneRef.current?.skip(); setReady(true) }
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') skip() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section id="unboxing" tabIndex={-1} className={`stage${ready ? ' ready' : ''}${gl ? ' gl-on' : ''}${noGL ? ' nogl' : ''}`} aria-label="The unboxing">
      <img className="poster" src={asset('img/gen/me-action-figure.webp')} alt="Krishna as a boxed action figure: KRISH, Automation Engineer, with a laptop, hard hat, multimeter, cable and mini transformer" />
      <canvas ref={canvas} className="gl" aria-hidden="true" />
      <div className="hero-copy">
        <p className="eyebrow">Series 2026 · Collector edition · 1 of 1</p>
        <h1><span className="tm">KRISH</span><span className="sr"> </span><span className="full">{me.name}</span></h1>
        <p className="sub">{me.role}. Now available as an action figure.</p>
        <p className="punch">Batteries not included. <b>Automation is.</b></p>
        <div className="hero-actions">
          <button type="button" className="btn pop" onClick={() => sceneRef.current?.peel()} disabled={popped}>{popped ? 'Unboxed!' : 'Peel the plastic'}</button>
          <span className="hint">{popped ? 'Scroll to unbox the accessories' : 'or grab the plastic and drag'}</span>
        </div>
      </div>
      <ol className="chapters" aria-label="What's in the box">
        {CHAPTERS.map((c, i) => (
          <li key={c.tag} className="chapter" data-i={i}>
            <p className="tag">{c.tag}</p>
            <h2>{c.title}</h2>
            <p>{c.body}</p>
            {c.apps && (
              <ul className="chips">
                {apps.map((a) => <li key={a.name}>{a.url ? <Ext href={a.url}>{a.name}</Ext> : <span>{a.name}</span>}</li>)}
              </ul>
            )}
            {c.link && <Ext className="btn small" href={c.link.url}>{c.link.label} ↗</Ext>}
          </li>
        ))}
      </ol>
      <div className="hud" aria-hidden="true">
        <span className="count">Unboxing <b>0</b>/5</span>
        <span className="readout">X 0000 · Y 0000</span>
      </div>
      <p className="loader" role="status">{noGL ? 'Box art only: this browser skipped the 3D.' : loaded < 100 ? `Sculpting the figure… ${loaded}%` : 'Figure in the box.'}</p>
      {!ready && !noGL && <button type="button" className="skip" onClick={skip}>Skip intro <kbd>Esc</kbd></button>}
      {popped && <button type="button" className="spin" onClick={() => sceneRef.current?.nudge(1)} aria-label="Spin the figure">⟳ spin</button>}
    </section>
  )
}

function Ticker() {
  const items = numbers.map((n) => `${n.unit === 'rank' ? 'Rank ' + n.value : n.value + ' ' + n.unit} ${n.label}`)
  const row = items.map((t) => <span key={t}>★ {t}</span>)
  return (
    <div className="ticker" aria-label="Features">
      <div className="ticker-track"><div>{row}</div><div aria-hidden="true">{row}</div></div>
    </div>
  )
}

function Perf({ label }) {
  return <div className="perf" aria-hidden="true"><span className="scissors">✂</span><em>{label}</em></div>
}

function Break({ n, setup, img, alt, reframe, small }) {
  return (
    <section className="break peg" aria-label={`Commercial break ${n}`}>
      <p className="tag">Commercial break · {n} of 2</p>
      <p className="setup">{setup}</p>
      <figure className="tv"><img src={img} alt={alt} loading="lazy" /></figure>
      <p className="reframe"><span>{reframe}</span></p>
      {small && <p className="small-print">{small}</p>}
    </section>
  )
}

/* ---------- back of the card ---------- */
function Checklist() {
  return (
    <section id="checklist" tabIndex={-1} className="back peg" aria-labelledby="ck-h">
      <header className="back-head">
        <p className="tag">Back of the card</p>
        <h2 id="ck-h">Collect all 5 internships</h2>
        <p>Tick them off as you go. He already did.</p>
      </header>
      <ol className="tiles">
        {experience.map((x, i) => (
          <li key={x.id} className="tile">
            <div className={`snap${x.photo ? '' : ' blank'}`}>
              {x.photo ? <img src={x.photo} alt={x.photoAlt} loading="lazy" /> : <span aria-hidden="true">{x.company.split(' ')[0]}</span>}
              <span className="stamp" aria-hidden="true">Collected</span>
            </div>
            <p className="no">No. {String(i + 1).padStart(2, '0')} · {x.year}</p>
            <h3>{x.company}</h3>
            <p className="role">{x.role} · {x.place}</p>
            <p>{x.text}</p>
          </li>
        ))}
      </ol>
      <p className="tally" aria-hidden="true">Collected: <b className="tally-n" /> of 5</p>

      <div className="packs">
        <article className="pack">
          <p className="tag">Field pack</p>
          <h3>{buhler.title}, {buhler.when}</h3>
          <p>{buhler.text}</p>
          <Ext className="btn small" href={buhler.link.url}>{buhler.link.label} ↗</Ext>
          <div className="pack-photos">
            {buhler.photos.map((p) => <figure key={p.src}><img src={p.src} alt={p.alt} loading="lazy" /><figcaption>{p.caption}</figcaption></figure>)}
          </div>
        </article>
        <article className="pack">
          <p className="tag">Leader pack</p>
          <h3>{leadership.title}</h3>
          <p>{leadership.text}</p>
          <div className="pack-photos three">
            {leadership.photos.map((p) => <img key={p.src} src={p.src} alt={p.alt} loading="lazy" />)}
          </div>
        </article>
        <article className="pack trophies">
          <p className="tag">Trophy case</p>
          <h3>Awards, sold separately</h3>
          <ul>
            {awards.map((a) => (
              <li key={a.title}>
                {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" />}
                <span className="yr">{a.year}</span> <b>{a.title}</b> <span>{a.detail}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="pack ai">
          <p className="tag">Expansion pack · AI</p>
          <h3>{ai.agent.name}</h3>
          <p>{ai.agent.pitch}</p>
          <ol className="versions">{ai.agent.versions.map((v, i) => <li key={v}><b>v{i + 1}</b> {v}</li>)}</ol>
          <h3>{ai.rag.name}</h3>
          <p>{ai.rag.pitch}</p>
          <p className="steps">{ai.rag.steps.join(' → ')}</p>
          <h3>{ai.browser.name}</h3>
          <p>{ai.browser.pitch}</p>
        </article>
        <article className="pack side">
          <p className="tag">Mini figures</p>
          <ul>
            {sideProjects.map((s) => <li key={s.name}><b>{s.url ? <Ext href={s.url}>{s.name} ↗</Ext> : s.name}</b> {s.pitch}</li>)}
          </ul>
          {building.map((b) => (
            <p key={b.name} className="soon"><span>Coming soon</span> <b>{b.name}</b>: {b.pitch} ({b.status})</p>
          ))}
        </article>
      </div>
    </section>
  )
}

/* ---------- GitHub: the sticker sheet and the shelf ---------- */
const tier = (n) => (n === 0 ? 'none' : n <= 2 ? 'dot' : n <= 5 ? 'star' : n <= 10 ? 'bolt' : 'burst')
const LANG = { Python: '#ffd400', JavaScript: '#ff6a1a', TypeScript: '#3150ff', HTML: '#ff5fa2', CSS: '#7c5cff' }

function Stickers({ gh }) {
  const holo = useRef(null)
  const active = gh.days.filter((d) => d[1] > 0).length
  const best = gh.bestDay
  const move = (e) => {
    const r = holo.current.getBoundingClientRect()
    holo.current.style.setProperty('--mx', ((e.clientX - r.left) / r.width).toFixed(3))
    holo.current.style.setProperty('--my', ((e.clientY - r.top) / r.height).toFixed(3))
  }
  return (
    <section id="stickers" tabIndex={-1} className="sheet-wrap peg" aria-labelledby="st-h">
      <header>
        <p className="tag">Bonus inside · GitHub</p>
        <h2 id="st-h">The sticker sheet</h2>
        <p>One sticker per day on GitHub. Bigger day, bigger sticker. Empty outlines are days off. There were not many.</p>
      </header>
      <div className="sheet">
        <div className="sheet-top">
          <dl className="stats">
            <div><dt>Contributions</dt><dd>{gh.contributionsLastYear}</dd></div>
            <div><dt>Commits</dt><dd>{gh.commitsLastYear}</dd></div>
            <div><dt>Pull requests</dt><dd>{gh.prsLastYear}</dd></div>
            <div><dt>Sticker days</dt><dd>{active}</dd></div>
          </dl>
          <div className="chase" ref={holo} onPointerMove={move}>
            <span className="chase-tag">Chase sticker</span>
            <b>{best.contributionCount}</b>
            <span>contributions on {fmtDate(best.date)}. His best day.</span>
          </div>
        </div>
        <div className="grid" role="img" aria-label={`${gh.days.length} days of GitHub activity: stickers on ${active} days, ${gh.contributionsLastYear} contributions in the last year, the best day ${fmtDate(best.date)} with ${best.contributionCount}.`}>
          {gh.days.map(([d, n], i) => (
            <span key={d} className={`s ${tier(n)} c${i % 4}${d === best.date ? ' best' : ''}`} title={`${fmtDate(d)}: ${n}`} />
          ))}
        </div>
        <blockquote className="bio">
          {gh.bio.split(/\r?\n/).map((l) => <span key={l}>{l}</span>)}
          <cite>github.com/{gh.login}, collecting since {fmtDate(gh.joined)}</cite>
        </blockquote>
      </div>
    </section>
  )
}

function Shelf({ repos, live }) {
  return (
    <section id="shelf" tabIndex={-1} className="shelf-wrap peg" aria-labelledby="sh-h">
      <header>
        <p className="tag">Toy aisle · {live ? 'live from GitHub' : 'snapshot'}</p>
        <h2 id="sh-h">{repos.length} variant figures</h2>
        <p>Every public repo, boxed and hung on the peg. Re-releases are forks. The colour is the language.</p>
      </header>
      <ul className="shelf">
        {repos.map((r) => (
          <li key={r.name}>
            <a className="variant" href={r.url} target="_blank" rel="noopener noreferrer" style={{ '--lang': LANG[r.language] || '#9aa3b5' }}>
              <span className="peg-hole" aria-hidden="true" />
              <span className="v-lang">{r.fork ? 'Re-release · ' : ''}{r.language || 'Mixed'} variant</span>
              <b className="v-name">{r.name.replace(/[-_]+/g, ' ').trim()}</b>
              <span className="v-desc">{r.description || 'Sold without a description.'}</span>
              <span className="v-meta">★ {r.stars} · updated {r.pushedAt}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- the order form ---------- */
function Order() {
  const [cut, setCut] = useState(false)
  const order = () => {
    if (reducedMotion()) { window.location.href = MAIL; return }
    setCut(true)
    setTimeout(() => { window.location.href = MAIL }, 1100)
    setTimeout(() => setCut(false), 2600)
  }
  return (
    <section id="order" tabIndex={-1} className="order peg" aria-labelledby="or-h">
      <p className="tag">Mail-in offer</p>
      <h2 id="or-h">Order now!</h2>
      <p className="lede">Operators are standing by. Well, one operator. It’s him.</p>
      <div className={`coupon${cut ? ' cut' : ''}`}>
        <dl>
          <div><dt>Item</dt><dd>1x KRISH, Automation Engineer</dd></div>
          <div><dt>Quantity</dt><dd>1 (only one was made)</dd></div>
          <div><dt>Ships from</dt><dd>{me.city}</dd></div>
          <div><dt>Price</dt><dd>One email</dd></div>
        </dl>
        <button type="button" className="btn order-btn" onClick={order}>Order now</button>
        <span className="cut-line" aria-hidden="true"><i>✂</i></span>
      </div>
      <p className="plain">Or just write to <a href={`mailto:${me.email}`}>{me.email}</a></p>
      <ul className="links">
        <li><Ext href={me.linkedin}>LinkedIn ↗</Ext></li>
        <li><Ext href={me.github}>GitHub ↗</Ext></li>
        <li><Ext href={me.resume}>Resume (PDF) ↗</Ext></li>
      </ul>
      <div className="parts">
        <h3>Parts list</h3>
        {Object.entries(skills).map(([k, v]) => <p key={k}><b>{k}:</b> {v.join(', ')}</p>)}
        <h3>Certificates of authenticity</h3>
        <p>{certifications.join(' · ')}</p>
      </div>
    </section>
  )
}

function Rare({ onClose }) {
  const link = useRef(null)
  useEffect(() => {
    link.current?.focus()
    const k = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="rare" role="dialog" aria-labelledby="rare-h">
      <p className="tag">You found it</p>
      <h2 id="rare-h">Rare variant unlocked: Golden Krish</h2>
      <p>You spun him so hard he turned gold. One in one boxes. Every golden figure ships with a certificate of authenticity, and his is the resume.</p>
      <div className="rare-actions">
        <a ref={link} className="btn" href={me.resume} target="_blank" rel="noopener noreferrer">Open the resume ↗</a>
        <button type="button" className="btn ghost" onClick={onClose}>Back to the box</button>
      </div>
    </div>
  )
}

/* ---------- page ---------- */
export default function App() {
  const audio = useRef(null)
  const analyser = useRef(null)
  const bins = useRef(null)
  const sceneRef = useRef(null)
  const [gh, setGh] = useState(snapshot)
  const [live, setLive] = useState(false)
  const [rare, setRare] = useState(false)
  const closeRare = useCallback(() => setRare(false), [])
  const [playing, setPlaying] = useState(false)
  const [music, setMusic] = useMusic(() => audio.current, (ctx, src) => {
    const an = ctx.createAnalyser()
    an.fftSize = 256
    src.connect(an)
    an.connect(ctx.destination)
    analyser.current = an
    bins.current = new Uint8Array(an.frequencyBinCount)
  })

  const getLevel = () => {
    const an = analyser.current
    if (!an || audio.current?.paused) return 0
    an.getByteFrequencyData(bins.current)
    let s = 0
    for (let i = 1; i < 9; i++) s += bins.current[i]
    return Math.max(0, s / (8 * 255) - 0.25) * 1.6
  }

  // GitHub refresh, never blocking
  useEffect(() => {
    const ac = new AbortController()
    const get = (u) => fetch(u, { signal: ac.signal }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    get('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed').then((list) => {
      if (!Array.isArray(list) || !list.length) return
      setGh((g) => ({
        ...g,
        repos: list.map((r) => ({
          name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
          pushedAt: (r.pushed_at || '').slice(0, 10), fork: r.fork, url: r.html_url,
        })),
      }))
      setLive(true)
    }).catch(() => {})
    get('https://api.github.com/users/KRISH-exe-29').then((u) => {
      if (u?.bio) setGh((g) => ({ ...g, bio: u.bio, followers: u.followers }))
    }).catch(() => {})
    return () => ac.abort()
  }, [])

  // one loop: GSAP's ticker drives Lenis and the 3D scene
  useEffect(() => {
    const reduced = reducedMotion()
    const stage = document.querySelector('.stage')
    const hero = stage.querySelector('.hero-copy')
    const chapters = [...stage.querySelectorAll('.chapter')]
    const count = stage.querySelector('.count b')
    const readout = stage.querySelector('.readout')
    let inView = true
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting })
    io.observe(stage)

    const lenis = reduced ? null : new Lenis({ lerp: 0.1 })
    if (lenis) lenis.on('scroll', ScrollTrigger.update)
    const tick = (time, deltaMs) => {
      lenis?.raf(time * 1000)
      if (!inView || document.hidden) return
      sceneRef.current?.tick(Math.min(0.05, deltaMs / 1000))
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const onMove = (e) => {
      readout.textContent = `X ${String(Math.round(e.clientX)).padStart(4, '0')} · Y ${String(Math.round(e.clientY)).padStart(4, '0')}`
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      if (!a) return
      const t = document.querySelector(a.getAttribute('href'))
      if (!t) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(t, { duration: 1.4 })
      else t.scrollIntoView()
      t.focus?.({ preventScroll: true })
    }
    document.addEventListener('click', onClick)

    let pin = null
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const update = (p) => {
        const c = p * SEGMENTS
        sceneRef.current?.setChapter(c)
        const h = smooth((c - 0.3) / 0.6)
        hero.style.opacity = 1 - h
        hero.style.transform = `translateY(${-h * 60}px)`
        hero.style.visibility = h > 0.99 ? 'hidden' : 'visible'
        let on = 0
        chapters.forEach((el, i) => {
          const w = weight(c, i)
          el.style.opacity = w
          el.style.transform = `translateY(${(1 - w) * 48}px) rotate(${(1 - w) * -2.5}deg)`
          el.style.pointerEvents = w > 0.5 ? 'auto' : 'none'
          if (c > i + 1) on = i + 1
        })
        count.textContent = on
      }
      pin = ScrollTrigger.create({
        trigger: stage, start: 'top top', end: () => '+=' + window.innerHeight * 5, pin: true, anticipatePin: 1,
        onUpdate: (s) => update(s.progress),
      })
      update(0)
      // a focused link in a hidden chapter scrolls its chapter into view
      const focus = (e) => {
        const li = e.target.closest('.chapter')
        if (!li) return
        const i = +li.dataset.i
        const y = pin.start + ((i + 1.5) / SEGMENTS) * (pin.end - pin.start)
        if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y)
      }
      stage.addEventListener('focusin', focus)

      // sections swing down onto their peg
      gsap.utils.toArray('.peg').forEach((el) => {
        gsap.fromTo(el, { rotateX: 12, y: 90, transformPerspective: 1400, transformOrigin: '50% 0%' }, {
          rotateX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: true },
        })
      })
      gsap.utils.toArray('.perf').forEach((el) => {
        gsap.fromTo(el.querySelector('.scissors'), { left: '0%' }, { left: '100%', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: true } })
        gsap.fromTo(el, { '--torn': 0 }, { '--torn': 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: true } })
      })
      gsap.utils.toArray('.tv').forEach((el) => {
        gsap.fromTo(el, { scale: 0.86, rotate: -3 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: true } })
      })
      ScrollTrigger.batch('.tile', {
        start: 'top 85%',
        once: true,
        onEnter: (els) => els.forEach((el, i) => setTimeout(() => el.classList.add('got'), i * 220)),
      })
      return () => stage.removeEventListener('focusin', focus)
    })
    if (reduced) document.querySelectorAll('.tile').forEach((el) => el.classList.add('got'))

    return () => {
      mm.revert()
      io.disconnect()
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('click', onClick)
      lenis?.destroy()
    }
  }, [])

  const nav = [['#unboxing', 'Unboxing'], ['#checklist', 'Checklist'], ['#stickers', 'Stickers'], ['#shelf', 'Shelf'], ['#order', 'Order now']]
  return (
    <>
      <a className="skiplink" href="#checklist">Skip to content</a>
      <header className="top">
        <a href="#unboxing" className="brand" aria-label="KRISH action figure, back to the box">KRISH<sup>™</sup></a>
        <nav aria-label="Sections">
          {nav.map(([h, l]) => <a key={h} href={h} className={h === '#order' ? 'cta' : ''}>{l}</a>)}
        </nav>
        <button type="button" className={`music${playing ? ' on' : ''}`} data-music aria-pressed={!music} onClick={() => setMusic(!music)}>
          <span className="eq" aria-hidden="true"><i /><i /><i /></span>{music ? 'Music off' : 'Music on'}
        </button>
      </header>
      <audio ref={audio} src={asset('audio/lady-love.mp3')} loop preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <main>
        <Stage getLevel={getLevel} onRare={() => setRare(true)} sceneRef={sceneRef} />
        <Ticker />
        <Break
          n={1}
          setup="Every toy ad has a kid losing it over the box."
          img={asset('img/pins/anya.jpg')}
          alt="Meme: Anya from Spy x Family pointing excitedly in a gym under the words WE GO JIM"
          reframe="She's right to. 9 apps in production. 128 tests guarding dispatch."
        />
        <Perf label="Cut along the dotted line" />
        <Checklist />
        <Perf label="Tear here for the bonus" />
        <Break
          n={2}
          setup="Some assembly required. Instructions: 30 to 40 minutes of Excel."
          img={asset('img/pins/outlast.jpg')}
          alt="Meme: a man in a dark jacket walking away from a pale green wall, next to the words feels hard"
          reframe="Now it's under 30 seconds, with 90% fewer calculation errors."
          small="The Bühler tool, 2025. Assembly by Python."
        />
        <Stickers gh={gh} />
        <Perf label="Peel from the corner" />
        <Shelf repos={gh.repos} live={live} />
        <Order />
      </main>
      <footer className="foot">
        <p className="punch">Batteries not included. <b>Automation is.</b></p>
        <p>Small parts: 128 tests. Not suitable for manual processes. 3D renders generated with Higgsfield from the owner’s own photo.</p>
        <p>© {me.name}, {me.city}. <a href="#unboxing">Back to the box ↑</a></p>
      </footer>
      {rare && <Rare onClose={closeRare} />}
    </>
  )
}

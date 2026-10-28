import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills, asset } from './content.js'
import snapshot from './github.json'
import { useMusic } from './music.js'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches
const REDUCED = mq('(prefers-reduced-motion: reduce)')
const SMALL = mq('(max-width: 720px)')
const MAIL = `mailto:${me.email}?subject=${encodeURIComponent('A note through the glass')}&body=${encodeURIComponent('Hi Krishna, I have a quick manual step for you: ')}`
const NAV = [['#apps', 'Apps'], ['#work', 'Work'], ['#greenhouse', 'Greenhouse'], ['#contact', 'Contact']]
const PANE_TITLE = { mettur: '4 x 210\nMW', inovate: 'Project:\nPhantom' }
const STEPS = ['Mixing the sand (three.js)', 'Painting the field (landscape, 209 KB)', 'Blowing the glass (compiling shaders)', 'Ready. Look through.']

const kb = (n) => (n >= 1024 ? `${(n / 1024).toFixed(n >= 10240 ? 0 : 1)} MB` : `${n} KB`)
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

let lenis = null
let world = null
const go = (e, href) => {
  const el = document.querySelector(href)
  if (!el) return
  e.preventDefault()
  if (lenis) lenis.scrollTo(el, { duration: 1.4 })
  else el.scrollIntoView()
  el.focus?.({ preventScroll: true })
}

/* ---------------- surprise: breathe on the glass ---------------- */
// Hold the pointer still and the glass fogs. Old finger-writing shows up in the fog, like it does on a real window.
// Move and you draw in it. Read the old writing long enough and the glass gives you the resume.
function useFog(areaRef, canvasRef, onFound) {
  const tickRef = useRef(null)
  useEffect(() => {
    const area = areaRef.current, cv = canvasRef.current
    if (!area || !cv) return
    const g = cv.getContext('2d')
    const s = { x: 0, y: 0, inside: false, still: 0, lastMove: 0, held: 0, read: 0, found: false, fog: 0 }
    const size = () => { const r = area.getBoundingClientRect(); cv.width = Math.round(r.width); cv.height = Math.round(r.height) }
    size()
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    const move = (e) => {
      const [x, y] = pos(e)
      const d = Math.hypot(x - s.x, y - s.y)
      if (s.inside && s.fog > 0.05 && d < 160) {
        g.globalCompositeOperation = 'destination-out'
        g.globalAlpha = 1
        g.lineCap = 'round'; g.lineWidth = 30
        g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(x, y); g.stroke()
      }
      if (d > 4) { s.lastMove = performance.now(); s.held = 0 }
      s.x = x; s.y = y; s.inside = true
    }
    const leave = () => { s.inside = false }
    area.addEventListener('pointermove', move, { passive: true })
    area.addEventListener('pointerdown', move, { passive: true })
    area.addEventListener('pointerleave', leave)
    area.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') leave() })
    window.addEventListener('resize', size)
    const writing = () => {
      g.save()
      g.translate(cv.width / 2, cv.height * 0.8)
      g.rotate(-0.05)
      g.font = `500 ${Math.min(84, cv.width / 9)}px Caveat, cursive`
      g.textAlign = 'center'
      g.fillStyle = '#000'
      g.fillText(me.lines[3], 0, 0)
      g.restore()
    }
    tickRef.current = (dt) => {
      const now = performance.now()
      const breathing = s.inside && now - s.lastMove > 650
      if (breathing) {
        s.held += dt
        const R = Math.min(460, 140 + s.held * 180)
        g.globalCompositeOperation = 'source-over'
        g.globalAlpha = 1
        const grd = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, R)
        grd.addColorStop(0, 'rgba(236,243,247,0.11)')
        grd.addColorStop(0.7, 'rgba(236,243,247,0.05)')
        grd.addColorStop(1, 'rgba(236,243,247,0)')
        g.fillStyle = grd
        g.fillRect(s.x - R, s.y - R, R * 2, R * 2)
        g.globalCompositeOperation = 'destination-out'
        g.globalAlpha = 0.16
        writing()
        s.fog = Math.min(1, s.fog + dt * 0.8)
        if (Math.abs(s.y - cv.height * 0.8) < R * 0.8) s.read += dt
        if (!s.found && s.read > 2.6) { s.found = true; onFound() }
      } else if (s.fog > 0) {
        g.globalCompositeOperation = 'destination-out'
        g.globalAlpha = 0.012
        g.fillRect(0, 0, cv.width, cv.height)
        s.fog = Math.max(0, s.fog - dt * 0.12)
        if (s.fog === 0) g.clearRect(0, 0, cv.width, cv.height)
      }
    }
    return () => {
      tickRef.current = null
      area.removeEventListener('pointermove', move)
      area.removeEventListener('pointerdown', move)
      area.removeEventListener('pointerleave', leave)
      window.removeEventListener('resize', size)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return tickRef
}

/* ---------------- pieces ---------------- */
function Head({ kicker, title, children, id }) {
  return (
    <div className="head">
      <p className="kicker">{kicker}</p>
      <h2 id={id}>{title}</h2>
      {children && <p className="lede">{children}</p>}
      <div className="squeegee" aria-hidden="true"><i /></div>
    </div>
  )
}

function Intermission({ n, setup, img, alt, caption, reframe, proof }) {
  return (
    <section className="meme" aria-label={`Intermission ${n}`}>
      <p className="meme-setup">{setup}</p>
      <figure className="meme-glass">
        <img src={asset(img)} alt={alt} loading="lazy" decoding="async" />
        <span className="meme-frost" aria-hidden="true" />
        <figcaption>{caption}</figcaption>
      </figure>
      <p className="meme-reframe">{reframe}</p>
      {proof && <p className="meme-proof">{proof}</p>}
    </section>
  )
}

function Plant({ size, stars }) {
  const g = Math.min(1, Math.log10(size + 1) / Math.log10(330000))
  const h = 22 + g * 118
  const leaves = 1 + Math.round(g * 6)
  const top = 160 - h
  const stem = `M50 160 C 46 ${160 - h * 0.35}, 56 ${160 - h * 0.7}, 50 ${top}`
  return (
    <svg className="plant" viewBox="0 0 100 166" aria-hidden="true">
      <path d={stem} fill="none" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
      {Array.from({ length: leaves }, (_, i) => {
        const y = 156 - ((i + 1) / (leaves + 1)) * h
        const side = i % 2 ? 1 : -1
        const len = 10 + g * 14
        return <ellipse key={i} cx={50 + side * len * 0.6} cy={y} rx={len * 0.62} ry={len * 0.26} transform={`rotate(${side * -28} ${50 + side * len * 0.6} ${y})`} fill={i % 2 ? '#4f9a58' : '#3d8447'} />
      })}
      {Array.from({ length: stars }, (_, i) => (
        <circle key={i} cx={50 + (i - (stars - 1) / 2) * 9} cy={top - 4} r="4.2" className="bud" />
      ))}
      {!stars && <circle cx="50" cy={top} r="3" fill="#6fb36f" />}
    </svg>
  )
}

function Condensation({ days, best }) {
  const first = new Date(days[0][0] + 'T00:00:00Z').getUTCDay()
  const cell = 18, cols = Math.ceil((days.length + first) / 7)
  const W = cols * cell + 20, H = 7 * cell + 30
  let bestPos = null
  const drops = days.map(([date, c], i) => {
    const k = i + first
    const x = 10 + Math.floor(k / 7) * cell + cell / 2 + (hash(i) - 0.5) * 6
    const y = 15 + (k % 7) * cell + cell / 2 + (hash(i + 99) - 0.5) * 6
    if (date === best.date) { bestPos = [x, y]; return null }
    if (!c) return <circle key={date} cx={x} cy={y} r="1.5" className="mist" />
    const r = Math.min(9, 2.6 + Math.sqrt(c) * 1.5)
    return (
      <g key={date} className="drop">
        <circle cx={x} cy={y} r={r} fill="url(#dropFill)" stroke="rgba(255,255,255,.85)" strokeWidth=".8" />
        <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.28} fill="#fff" opacity=".9" />
      </g>
    )
  })
  return (
    <svg className="condensation" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${days.filter((d) => d[1] > 0).length} days with contributions out of ${days.length}. Best day ${best.date} with ${best.contributionCount}.`}>
      <defs>
        <radialGradient id="dropFill" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="rgba(255,255,255,.15)" />
          <stop offset=".75" stopColor="rgba(220,236,244,.35)" />
          <stop offset="1" stopColor="rgba(40,70,80,.45)" />
        </radialGradient>
      </defs>
      {drops}
      {bestPos && (
        <g className="bloom" transform={`translate(${bestPos[0]} ${bestPos[1]})`}>
          {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="0" cy="-9" rx="5" ry="9" transform={`rotate(${i * 45})`} />)}
          <circle r="5" fill="#fff4c9" />
        </g>
      )}
    </svg>
  )
}

function PassNote() {
  const note = useRef(null)
  const slot = useRef(null)
  const [sent, setSent] = useState(false)
  const drag = useRef(null)
  const send = () => {
    if (sent) return
    setSent(true)
    const n = note.current, s = slot.current
    const a = n.getBoundingClientRect(), b = s.getBoundingClientRect()
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2)
    const done = () => { window.location.href = MAIL }
    if (REDUCED) return done()
    gsap.timeline({ onComplete: done })
      .to(n, { x: dx, y: dy, rotate: 0, duration: 0.45, ease: 'power2.out' })
      .to(n, { scaleY: 0.04, scaleX: 0.9, opacity: 0, duration: 0.35, ease: 'power2.in' })
  }
  const down = (e) => {
    if (sent) return
    drag.current = { x: e.clientX, y: e.clientY, moved: false }
    note.current.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (Math.hypot(dx, dy) > 6) d.moved = true
    note.current.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.02}deg)`
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    const a = note.current.getBoundingClientRect(), b = slot.current.getBoundingClientRect()
    const hit = a.right > b.left && a.left < b.right && a.bottom > b.top - 30 && a.top < b.bottom + 30
    if (hit) send()
    else gsap.to(note.current, { x: 0, y: 0, rotate: -3, duration: 0.5, ease: 'back.out(2)', clearProps: 'transform' })
  }
  return (
    <div className="pass">
      <div className="pass-pane">
        <p className="pass-label">Note slot. Opens on contact.</p>
        <div className="slot" ref={slot} aria-hidden="true"><span /></div>
      </div>
      <button
        ref={note}
        type="button"
        className={`note${sent ? ' sent' : ''}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClick={(e) => { if (e.detail === 0) send() }}
        aria-label="Slide the note through the glass: opens an email to Krishna"
      >
        <span className="note-to">To: Krishna</span>
        <span className="note-body">I have a quick manual step for you.</span>
        <span className="note-hint">Drag me into the slot</span>
      </button>
    </div>
  )
}

/* ---------------- app ---------------- */
export default function App() {
  const audio = useRef(null)
  const canvas = useRef(null)
  const slab = useRef(null)
  const hero = useRef(null)
  const fogCanvas = useRef(null)
  const stageRef = useRef(null)
  const readout = useRef(null)
  const bass = useRef(0)
  const analyser = useRef(null)
  const [step, setStep] = useState(0)
  const [ready, setReady] = useState(false)
  const [gl, setGl] = useState(false)
  const [found, setFound] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(0)
  const [repos, setRepos] = useState(snapshot.repos)
  const [live, setLive] = useState(false)
  const skipped = useRef(REDUCED)

  const [music, setMusic] = useMusic(() => audio.current, (ctx, src) => {
    const a = ctx.createAnalyser()
    a.fftSize = 256
    src.connect(a)
    a.connect(ctx.destination)
    analyser.current = { a, buf: new Uint8Array(a.frequencyBinCount) }
  })
  const fogTick = useFog(hero, fogCanvas, () => setFound(true))

  const finish = () => {
    skipped.current = true
    world?.start(true)
    setReady(true)
    lenis?.start()
  }

  // the world, lazy, after first paint
  useEffect(() => {
    if (REDUCED) { setReady(true); return }
    let dead = false
    const t0 = setTimeout(() => setStep(1), 0)
    import('./world.js')
      .then((m) => { if (!dead) setStep(2); return m.createWorld(canvas.current, {
        small: SMALL,
        bg: asset('img/world/field.jpg'),
        nameLines: SMALL ? ['Krishna', 'Raju S'] : [me.name],
        panes: experience.map((e) => ({ photo: e.photo, title: PANE_TITLE[e.id] || e.year, sub: e.company })),
      }) })
      .then((w) => {
        if (dead) { w.dispose(); return }
        world = w
        w.setHero(slab.current)
        w.addTiles([...document.querySelectorAll('[data-glass]')])
        document.documentElement.classList.add('gl')
        setGl(true)
        setStep(3)
        w.start(skipped.current)
        if (skipped.current) return
        setTimeout(() => { if (!dead) finish() }, 2800)
      })
      .catch(() => { if (!dead) { setStep(3); setReady(true); lenis?.start() } })
    const esc = (e) => { if (e.key === 'Escape') finish() }
    window.addEventListener('keydown', esc)
    return () => { dead = true; clearTimeout(t0); window.removeEventListener('keydown', esc); world?.dispose(); world = null; document.documentElement.classList.remove('gl') }
  }, [])

  // smooth scroll, the one loop, pointer
  useEffect(() => {
    if (!REDUCED) {
      lenis = new Lenis({ lerp: 0.09 })
      lenis.on('scroll', ScrollTrigger.update)
      if (!skipped.current) lenis.stop()
    }
    let maxScroll = 1
    const onRefresh = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); world?.measure() }
    ScrollTrigger.addEventListener('refresh', onRefresh)
    onRefresh()
    const tick = (time, deltaMs) => {
      lenis?.raf(time * 1000)
      if (document.hidden) return
      const dt = Math.min(0.05, deltaMs / 1000)
      const an = analyser.current
      if (an && !audio.current?.paused) {
        an.a.getByteFrequencyData(an.buf)
        let s = 0
        for (let i = 1; i < 8; i++) s += an.buf[i]
        bass.current += (s / 7 / 255 - bass.current) * (1 - Math.exp(-dt * 14))
      } else bass.current *= 0.9
      document.documentElement.style.setProperty('--bass', bass.current.toFixed(3))
      fogTick.current?.(dt)
      if (world) {
        const sy = window.scrollY
        const st = stageRef.current?._st
        let stageY = 99999
        if (st) stageY = sy < st.start ? st.start - sy : sy > st.end ? st.end - sy : 0
        world.set({ bass: bass.current, dusk: sy / maxScroll, stageY })
        world.tick(dt, sy)
      }
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const pm = (e) => {
      world?.pointer(e.clientX, e.clientY)
      if (readout.current) readout.current.textContent = `x ${String(Math.round(e.clientX)).padStart(4, '0')}  y ${String(Math.round(e.clientY)).padStart(4, '0')}  n 1.45`
    }
    const pl = () => world?.leave()
    window.addEventListener('pointermove', pm, { passive: true })
    document.addEventListener('pointerleave', pl)
    let rw = window.innerWidth
    let rt = 0
    const rs = () => {
      clearTimeout(rt)
      rt = setTimeout(() => {
        if (Math.abs(window.innerWidth - rw) < 2 && SMALL) return
        rw = window.innerWidth
        world?.layout()
        ScrollTrigger.refresh()
      }, 160)
    }
    window.addEventListener('resize', rs)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      gsap.ticker.remove(tick)
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      window.removeEventListener('pointermove', pm)
      document.removeEventListener('pointerleave', pl)
      window.removeEventListener('resize', rs)
      lenis?.destroy()
      lenis = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // scroll choreography
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // transition: a squeegee wipes the frost off every section head
        gsap.utils.toArray('.head').forEach((h) => {
          const sq = h.querySelector('.squeegee')
          gsap.fromTo(sq, { '--wipe': '0%' }, { '--wipe': '100%', ease: 'none', scrollTrigger: { trigger: h, start: 'top 88%', end: 'top 42%', scrub: 0.6 } })
        })
        gsap.utils.toArray('.meme-frost').forEach((f) => {
          gsap.fromTo(f, { opacity: 1 }, { opacity: 0, ease: 'none', scrollTrigger: { trigger: f.parentElement, start: 'top 80%', end: 'center 55%', scrub: true } })
        })
        gsap.utils.toArray('.meme-reframe').forEach((el) => {
          gsap.from(el, { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
        })
        ScrollTrigger.batch('.pot', {
          start: 'top 90%',
          once: true,
          onEnter: (b) => gsap.fromTo(b.map((p) => p.querySelector('.plant')), { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 100%', duration: 1.2, ease: 'elastic.out(1, 0.6)', stagger: 0.05 }),
        })
        gsap.from('.drop, .mist', { opacity: 0, scale: 0, transformOrigin: 'center', stagger: { each: 0.002, from: 'random' }, duration: 0.4, scrollTrigger: { trigger: '.condensation', start: 'top 80%' } })
        gsap.utils.toArray('.lens').forEach((l, i) => {
          gsap.from(l, { y: 60, rotate: i % 2 ? 6 : -6, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: l, start: 'top 92%' } })
        })
      })
    })
    return () => ctx.revert()
  }, [repos])

  // the pinned, scrubbed experience panes (WebGL only)
  useEffect(() => {
    if (!gl) return
    const n = experience.length
    const el = stageRef.current
    world?.set({ stageEnabled: true })
    const st = ScrollTrigger.create({
      trigger: el,
      pin: true,
      start: 'top top',
      end: `+=${n * 85}%`,
      scrub: true,
      onUpdate: (self) => {
        world?.set({ stageP: self.progress })
        setActive(Math.min(n - 1, Math.round(self.progress * (n - 1))))
      },
    })
    el._st = st
    ScrollTrigger.refresh()
    return () => { st.kill(); el._st = null }
  }, [gl])

  // fresh repos, never blocking
  useEffect(() => {
    const ac = new AbortController()
    fetch('https://api.github.com/users/KRISH-exe-29/repos?per_page=100&sort=pushed', { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return
        setRepos(list.map((r) => ({
          name: r.name, description: r.description, language: r.language, stars: r.stargazers_count,
          sizeKB: r.size, pushedAt: (r.pushed_at || '').slice(0, 10), fork: r.fork, url: r.html_url,
        })))
        setLive(true)
      })
      .catch(() => {})
    return () => ac.abort()
  }, [])

  useEffect(() => {
    const a = audio.current
    const on = () => setPlaying(true), off = () => setPlaying(false)
    a.addEventListener('play', on); a.addEventListener('pause', off)
    return () => { a.removeEventListener('play', on); a.removeEventListener('pause', off) }
  }, [])

  const days = snapshot.days
  const best = snapshot.bestDay
  const ex = experience[active]
  const own = repos.filter((r) => !r.fork).length

  return (
    <>
      <a className="skiplink" href="#numbers" onClick={(e) => go(e, '#numbers')}>Skip to content</a>
      <canvas ref={canvas} className="world" aria-hidden="true" />
      <div className="world-fallback" aria-hidden="true" />
      <audio ref={audio} src={asset('audio/in-the-pool.mp3')} loop preload="auto" />

      <header className={`top${ready ? ' in' : ''}`}>
        <a href="#top" className="brand" onClick={(e) => go(e, '#top')} aria-label="Glasshouse, back to the top">
          <span className="brand-dot" aria-hidden="true" />Glasshouse
        </a>
        <nav aria-label="Sections">
          {NAV.map(([h, l]) => <a key={h} href={h} onClick={(e) => go(e, h)}>{l}</a>)}
        </nav>
        <button type="button" className="music" data-music aria-pressed={music} onClick={() => setMusic(!music)}>
          <span className={`eq${playing ? ' on' : ''}`} aria-hidden="true"><i /><i /><i /></span>
          {music ? 'Music off' : 'Music on'}
        </button>
      </header>

      {!ready && (
        <div className="loader" role="status">
          <ol>
            {STEPS.map((s, i) => <li key={s} className={i < step ? 'ok' : i === step ? 'now' : ''}>{s}{i < step ? ' ... ok' : ''}</li>)}
          </ol>
          <button type="button" onClick={finish}>Skip intro <kbd>Esc</kbd></button>
        </div>
      )}

      <main id="top">
        <section className={`hero${ready ? ' in' : ''}`} ref={hero} aria-labelledby="hero-name">
          <canvas ref={fogCanvas} className="fog" aria-hidden="true" />
          <p className="hero-eyebrow">{me.city} · {me.field}</p>
          <div className="slab" ref={slab}>
            <h1 id="hero-name">{me.name}</h1>
          </div>
          <p className="hero-role">{me.role}.</p>
          <p className="hero-line">Everything here is see-through. Even the numbers.</p>
          <p className="hero-hint">Hold still on the glass. It remembers things.</p>
          <a className="hero-cue" href="#numbers" onClick={(e) => go(e, '#numbers')}>Look closer</a>
          {found && (
            <div className="found" role="status">
              <p>The glass remembered something he wrote: <em>&ldquo;{me.lines[3]}&rdquo;</em></p>
              <a href={me.resume} target="_blank" rel="noreferrer">Fine. Here&rsquo;s the resume anyway (PDF)</a>
              <button type="button" onClick={() => setFound(false)} aria-label="Close">×</button>
            </div>
          )}
        </section>

        <section className="sec" id="numbers" tabIndex={-1} aria-labelledby="h-numbers">
          <Head kicker="01 · Clear numbers" title="Nothing frosted. Five numbers you can check." id="h-numbers" />
          <ul className="lenses">
            {numbers.map((n) => (
              <li key={n.label} className="lens">
                <strong>{n.value}</strong>
                <span className="lens-unit">{n.unit}</span>
                <span className="lens-label">{n.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="sec" id="apps" tabIndex={-1} aria-labelledby="h-apps">
          <Head kicker="02 · Nine panes" title={me.lines[0]} id="h-apps">
            Nine apps in production at Indo Tech Transformers. Each pane bends the view a little. The apps bend the paperwork a lot.
          </Head>
          <ul className="tiles">
            {apps.map((a, i) => {
              const inner = (
                <>
                  <span className="tile-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="tile-name">{a.name}</span>
                  <span className="tile-pitch">{a.pitch}</span>
                  {a.url && <span className="tile-go" aria-hidden="true">Look through ↗</span>}
                </>
              )
              return (
                <li key={a.name} className="tile" data-glass>
                  {a.url ? <a className="tile-in" href={a.url} target="_blank" rel="noreferrer" aria-label={`${a.name}: ${a.pitch} (opens in a new tab)`}>{inner}</a> : <div className="tile-in">{inner}</div>}
                </li>
              )
            })}
          </ul>
          <div className="blowpipe">
            {building.map((b) => <p key={b.name}><span className="tag">Still on the blowpipe</span> <strong>{b.name}</strong>: {b.pitch} <em>{b.status}.</em></p>)}
          </div>
          <ul className="side">
            {sideProjects.map((p) => (
              <li key={p.name}>
                {p.url ? <a href={p.url} target="_blank" rel="noreferrer"><strong>{p.name}</strong> ↗</a> : <strong>{p.name}</strong>}
                <span>{p.pitch}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="sec" id="ai" aria-labelledby="h-ai">
          <Head kicker="03 · Layered glass" title="Twelve coats, one agent." id="h-ai">{ai.agent.pitch}</Head>
          <div className="ai">
            <ol className="layers" aria-label={`${ai.agent.name} versions`}>
              {ai.agent.versions.map((v, i) => <li key={v} style={{ '--i': i }}><span>v{i + 1}</span>{v}</li>)}
            </ol>
            <div className="ai-side">
              <div className="glass card">
                <h3>{ai.rag.name}</h3>
                <p>{ai.rag.pitch}</p>
                <p className="chain">{ai.rag.steps.map((s, i) => <span key={s}>{s}{i < ai.rag.steps.length - 1 && <i aria-hidden="true"> → </i>}</span>)}</p>
                <p className="small">Shows its sources. Transparent, like everything in here.</p>
              </div>
              <div className="glass card">
                <h3>{ai.browser.name}</h3>
                <p>{ai.browser.pitch}</p>
              </div>
              <ul className="chips">{ai.stack.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        </section>

        <Intermission
          n={1}
          setup="Bühler, week one. Every feeder classified by hand, in Excel."
          img="img/pins/focus.jpg"
          alt="A white chess pawn looking into a round mirror and seeing a king"
          caption="The spreadsheet, looking in the glass"
          reframe="30 to 40 minutes → under 30 seconds."
          proof="And 90% of the manual calculation errors, gone. Same sheet. Better reflection."
        />

        <section className="sec work" id="work" tabIndex={-1} aria-labelledby="h-work">
          <Head kicker="04 · Panes in depth" title="Five workplaces. Oldest pane first." id="h-work">
            Scroll to walk through them. Hover a pane to wipe the frost off.
          </Head>
          {gl ? (
            <div className="stage" ref={stageRef}>
              <div className="stage-card glass" aria-hidden="true">
                <p className="stage-count">Pane {active + 1} of {experience.length} · {ex.year}</p>
                <h3>{ex.role}</h3>
                <p className="stage-co">{ex.company} · {ex.place}</p>
                <p>{ex.text}</p>
              </div>
              <ol className="stage-ticks" aria-hidden="true">
                {experience.map((e, i) => <li key={e.id} className={i === active ? 'on' : ''}>{e.year}</li>)}
              </ol>
              <ol className="sr-only">
                {experience.map((e) => <li key={e.id}>{e.year}, {e.role}, {e.company}, {e.place}. {e.text}</li>)}
              </ol>
            </div>
          ) : (
            <ol className="work-list">
              {experience.map((e) => (
                <li key={e.id} className="glass card">
                  {e.photo && <img src={e.photo} alt={e.photoAlt} loading="lazy" decoding="async" />}
                  <p className="stage-count">{e.year}</p>
                  <h3>{e.role}</h3>
                  <p className="stage-co">{e.company} · {e.place}</p>
                  <p>{e.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="sec" id="field" aria-labelledby="h-field">
          <Head kicker="05 · Behind frosted glass" title="Photos, frosted. Hover to clear them." id="h-field">
            Proof you can see through. Point at a photo, or tab to it.
          </Head>
          {field.map((f) => (
            <div key={f.id} className="field">
              <div className="field-text glass card">
                <h3>{f.title}</h3>
                <p className="stage-co">{f.when}</p>
                <p>{f.text}</p>
                <a href={f.link.url} target="_blank" rel="noreferrer">{f.link.label} ↗</a>
              </div>
              {f.photos.map((p) => (
                <figure key={p.src} className="frosted" tabIndex={0}>
                  <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
                  <figcaption>{p.caption}</figcaption>
                </figure>
              ))}
            </div>
          ))}
          <div className="lead">
            <div className="glass card">
              <h3>{leadership.title}</h3>
              <p>{leadership.text}</p>
            </div>
            {leadership.photos.map((p) => (
              <figure key={p.src} className="frosted" tabIndex={0}>
                <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
              </figure>
            ))}
          </div>
          <ol className="shelf" aria-label="Awards">
            {awards.map((a) => (
              <li key={a.title} className={a.photo ? 'has-photo' : ''}>
                {a.photo && <img src={a.photo} alt={a.photoAlt} loading="lazy" decoding="async" />}
                <span className="shelf-y">{a.year}</span>
                <strong>{a.title}</strong>
                <span>{a.detail}</span>
              </li>
            ))}
          </ol>
        </section>

        <Intermission
          n={2}
          setup="Somebody at the plant says “it’s only a quick manual step.”"
          img="img/pins/jesse.jpg"
          alt="Jesse Pinkman from Breaking Bad, looking back over his shoulder from a red car"
          caption="Me, hearing “quick manual step”"
          reframe={me.lines[1]}
          proof="Testing, Production, Quality and Dispatch: five workflow gaps, now Python."
        />

        <section className="sec" id="greenhouse" tabIndex={-1} aria-labelledby="h-gh">
          <Head kicker="06 · The greenhouse" title={`${repos.length} pots. One very honest window.`} id="h-gh">
            One glass pot per public repo. The plant grows with the code. Forks are cuttings from other people&rsquo;s gardens. Stars are buds.
          </Head>
          <div className="wall glass">
            <div className="wall-top">
              <p><strong>Condensation on the glass.</strong> Every drop is a day with contributions. Bigger drop, busier day. Dry glass is a day off.</p>
              <p className="bloom-note"><span className="bloom-dot" aria-hidden="true" /> {best.date}: {best.contributionCount} contributions. Full bloom.</p>
            </div>
            <div className="wall-scroll"><Condensation days={days} best={best} /></div>
            <ul className="gh-stats">
              <li><strong>{snapshot.contributionsLastYear}</strong> contributions last year</li>
              <li><strong>{snapshot.commitsLastYear}</strong> commits</li>
              <li><strong>{snapshot.prsLastYear}</strong> pull requests</li>
              <li>Planted <strong>{snapshot.joined}</strong></li>
            </ul>
          </div>
          <ul className="pots" aria-label={`${repos.length} public repositories, ${own} of them his own`}>
            {repos.map((r) => (
              <li key={r.name} className={`pot${r.fork ? ' fork' : ''}`}>
                <a href={r.url} target="_blank" rel="noreferrer" aria-label={`${r.name}${r.fork ? ', a fork' : ''}, ${kb(r.sizeKB)}${r.language ? ', ' + r.language : ''}${r.description ? ': ' + r.description : ''}`}>
                  <Plant size={r.sizeKB} stars={Math.min(5, r.stars || 0)} />
                  <span className="pot-glass" aria-hidden="true"><span className="soil" /></span>
                  <span className="pot-name">{r.name}</span>
                  <span className="pot-meta">{r.fork ? 'cutting · ' : ''}{kb(r.sizeKB)}{r.language ? ' · ' + r.language : ''}</span>
                  {r.description && <span className="pot-desc" aria-hidden="true">{r.description}</span>}
                </a>
              </li>
            ))}
          </ul>
          <p className="gh-foot">
            <span className="bio">&ldquo;{snapshot.bio.split(/\r?\n/)[1]}&rdquo;</span> His GitHub bio. The greenhouse says otherwise.
            {' '}{live ? 'Pots are live from GitHub.' : `Pots from a snapshot taken ${snapshot.snapshotAt.slice(0, 10)}.`}{' '}
            <a href={me.github} target="_blank" rel="noreferrer">Walk the real greenhouse ↗</a>
          </p>
        </section>

        <section className="sec" id="made" aria-labelledby="h-made">
          <Head kicker="07 · Ingredients" title="What the glass is made of." id="h-made">Sand, heat, and this:</Head>
          <div className="made">
            {Object.entries(skills).map(([k, list]) => (
              <div key={k} className="glass card">
                <h3>{k}</h3>
                <ul className="chips">{list.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            ))}
            <div className="glass card certs">
              <h3>Paperwork</h3>
              <ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="sec contact" id="contact" tabIndex={-1} aria-labelledby="h-contact">
          <Head kicker="08 · Pass a note" title={me.lines[2]} id="h-contact">
            Slide the note through the glass and it opens an email. Or skip the theatre and use the address. It&rsquo;s see-through too.
          </Head>
          <div className="contact-row">
            <PassNote />
            <div className="contact-plain glass card">
              <img className="portrait" src={me.portrait} alt={`Portrait of ${me.name}`} loading="lazy" decoding="async" />
              <a className="mail" href={`mailto:${me.email}`}>{me.email}</a>
              <ul className="links">
                <li><a href={me.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a></li>
                <li><a href={me.github} target="_blank" rel="noreferrer">GitHub ↗</a></li>
                <li><a href={me.resume} target="_blank" rel="noreferrer">Resume (PDF) ↗</a></li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <p>{me.name} · {me.city}. Built with React, Three.js, GSAP and Lenis. Song: &ldquo;in the pool&rdquo;. Landscape from the owner&rsquo;s Pinterest board.</p>
        <p className="readout" ref={readout} aria-hidden="true">x 0000  y 0000  n 1.45</p>
      </footer>
    </>
  )
}

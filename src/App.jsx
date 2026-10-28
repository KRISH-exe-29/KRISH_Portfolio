import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import Lenis from 'lenis'
import {
  me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills,
} from './content.js'
import { drawCover } from './covers.js'
import { createWater } from './water.js'
import { createHover } from './hover.js'
import { initCursor } from './cursor.js'

gsap.registerPlugin(ScrollTrigger, SplitText, Flip)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const EASE = 'expo.inOut'

const linkLabel = (url) => (url.includes('github.com') ? 'Source on GitHub' : 'Open the live app')

// One flat sequence of work, like a designer's archive wall.
function buildItems() {
  const list = []
  const n = {}
  let ci = 0
  const push = (it) => {
    n[it.code] = (n[it.code] || 0) + 1
    const item = { ...it, n: n[it.code] }
    if (!item.img) item.ci = ci++
    list.push(item)
  }
  apps.forEach((a, i) =>
    push({
      id: 'a' + i, code: 'A', kind: 'App in production', title: a.name, pitch: a.pitch,
      body: ['One of the nine apps in production at Indo Tech Transformers.'],
      link: a.url ? { url: a.url, label: linkLabel(a.url) } : null,
      note: a.url ? '' : 'No public link.',
    }),
  )
  sideProjects.forEach((s, i) =>
    push({
      id: 's' + i, code: 'S', kind: 'Side project', title: s.name, pitch: s.pitch,
      link: s.url ? { url: s.url, label: linkLabel(s.url) } : null,
      note: s.url ? '' : 'No public link.',
    }),
  )
  building.forEach((b, i) =>
    push({ id: 'b' + i, code: 'B', kind: 'Now building', title: b.name, pitch: b.pitch, body: [`${b.status}. In progress, not one of the nine.`], link: null, note: 'Private for now.' }),
  )
  push({ id: 'i0', code: 'I', kind: 'AI', title: ai.agent.name, pitch: 'Twelve versions, chat to workflow automation.', body: [ai.agent.pitch], steps: ai.agent.versions })
  push({ id: 'i1', code: 'I', kind: 'AI', title: ai.rag.name, pitch: ai.rag.steps.join(', '), body: [ai.rag.pitch], steps: ai.rag.steps })
  push({ id: 'i2', code: 'I', kind: 'AI', title: ai.browser.name, pitch: 'Ranking and OCR on the device.', body: [ai.browser.pitch], link: { url: apps[4].url, label: 'Open Job Lens' } })
  experience.filter((e) => e.photo).forEach((e) =>
    push({
      id: 'f-' + e.id, code: 'F', kind: 'Field', title: e.company, pitch: e.short, img: e.photo, alt: e.photoAlt,
      meta: `${e.year}, ${e.role}, ${e.place}`, body: [e.text],
    }),
  )
  field[0].photos.forEach((p, i) =>
    push({
      id: 'f-field' + i, code: 'F', kind: 'Field', title: field[0].title, pitch: p.caption, img: p.src, alt: p.alt,
      meta: field[0].when, body: [field[0].text], link: field[0].link,
    }),
  )
  awards.filter((a) => a.photo).forEach((a, i) =>
    push({ id: 'r-a' + i, code: 'R', kind: 'Recognition', title: a.title, pitch: a.detail, img: a.photo, alt: a.photoAlt, meta: a.year }),
  )
  leadership.photos.forEach((p, i) =>
    push({ id: 'r-l' + i, code: 'R', kind: 'Recognition', title: leadership.title, pitch: p.alt, img: p.src, alt: p.alt, body: [leadership.text] }),
  )
  return list
}
const items = buildItems()

const FILTERS = [
  { k: 'all', label: 'All' },
  { k: 'A', label: 'Apps in production' },
  { k: 'S', label: 'Side projects' },
  { k: 'B', label: 'Now building' },
  { k: 'I', label: 'AI' },
  { k: 'F', label: 'Field' },
  { k: 'R', label: 'Recognition' },
]
const count = (k) => (k === 'all' ? items.length : items.filter((i) => i.code === k).length)
const code = (it) => `${it.code}/${String(it.n).padStart(2, '0')}`

function Roll({ children }) {
  const text = String(children)
  const letters = [...text].map((c, i) => (
    <span key={i} style={{ '--i': i }}>{c === ' ' ? ' ' : c}</span>
  ))
  return (
    <span className="roll">
      <span className="sr-only">{text}</span>
      <span className="roll-in" aria-hidden="true">
        <span className="roll-a">{letters}</span>
        <span className="roll-b">{letters}</span>
      </span>
    </span>
  )
}

function Ext({ href, children, className = '', ...rest }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={className} {...rest}>
      {children}
    </a>
  )
}

export default function App() {
  const rootRef = useRef(null)
  const gridRef = useRef(null)
  const frameRef = useRef(null)
  const waterRef = useRef(null)
  const cursorRef = useRef(null)
  const previewRef = useRef(null)
  const overlayRef = useRef(null)
  const ovMediaRef = useRef(null)
  const closeRef = useRef(null)
  const lenisRef = useRef(null)
  const filterState = useRef(null)
  const openState = useRef(null)
  const switching = useRef(false)
  const lastFocus = useRef(null)

  const [covers, setCovers] = useState({})
  const [latest, setLatest] = useState('')
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('loading')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('grid')
  const [active, setActive] = useState(null)
  const [preview, setPreview] = useState('')

  const src = (it) => it.img || covers[it.id]
  const visible = items.filter((it) => filter === 'all' || it.code === filter)

  // Boot: fonts, generated covers and photos are the real loading work.
  useEffect(() => {
    let cancelled = false
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const photos = [me.portrait, ...items.filter((i) => i.img).map((i) => i.img)]
    const coverItems = items.filter((i) => !i.img).reverse() // a0 last, it flies into the grid
    const total = coverItems.length + photos.length + 1
    let done = 0
    const bump = () => {
      done++
      if (!cancelled) setProgress(done / total)
    }
    const t0 = performance.now()
    const photoLoads = Promise.race([
      Promise.all(
        photos.map(
          (p) =>
            new Promise((res) => {
              const im = new Image()
              im.onload = im.onerror = () => {
                bump()
                res()
              }
              im.src = p
            }),
        ),
      ),
      new Promise((res) => setTimeout(res, 4000)),
    ])
    ;(async () => {
      try {
        await Promise.all([
          document.fonts.load('900 100px Archivo'),
          document.fonts.load('500 20px Archivo'),
          document.fonts.load('500 20px "JetBrains Mono"'),
        ])
      } catch {
        // System fonts stand in.
      }
      bump()
      const out = {}
      for (const it of coverItems) {
        if (cancelled) return
        out[it.id] = drawCover(it, it.ci)
        setCovers({ ...out })
        setLatest(out[it.id])
        bump()
        await new Promise((r) => requestAnimationFrame(r))
      }
      await photoLoads
      const wait = Math.max(0, (reduced ? 0 : 1400) - (performance.now() - t0))
      setTimeout(() => {
        if (!cancelled) setPhase(reduced ? 'done' : 'intro')
      }, wait)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Smooth scroll on GSAP's clock.
  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ lerp: 0.1, anchors: true })
    lenisRef.current = lenis
    lenis.stop()
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Water, liquid media and the cursor: fine pointers with motion only.
  useEffect(() => {
    if (reduced || !fine) return
    const cleanups = []
    const water = createWater(waterRef.current)
    if (water) cleanups.push(water)
    const hover = createHover()
    if (hover) cleanups.push(hover)
    document.documentElement.classList.add('has-cursor')
    cleanups.push(initCursor(cursorRef.current))
    return () => {
      cleanups.forEach((fn) => fn())
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  // Intro: the last cover in the loader flies into its tile.
  useLayoutEffect(() => {
    if (phase !== 'intro') return
    const ctx = gsap.context(() => {
      const target = gridRef.current.querySelector('[data-flip-id="a0"]')
      const split = SplitText.create('.hero-name', { type: 'lines,chars', mask: 'lines' })
      const first = gsap.utils
        .toArray('.tile-media', gridRef.current)
        .filter((m) => m !== target && m.getBoundingClientRect().top < window.innerHeight)
      const tl = gsap.timeline({ onComplete: () => setPhase('done') })
      tl.to('.loader-count, .loader-meta', { yPercent: -120, opacity: 0, duration: 0.5, ease: 'expo.in', stagger: 0.05 })
        .add(() => {
          const st = Flip.getState(frameRef.current)
          gsap.set(frameRef.current, { visibility: 'hidden' })
          Flip.from(st, { targets: target, duration: 1.2, ease: EASE, scale: true, zIndex: 112 })
        })
        .to('.loader-bg', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: EASE }, '<')
        .from(split.chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.022 }, '-=0.45')
        .from('[data-intro]', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, '<0.1')
        .from(first, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1, ease: 'expo.out', stagger: 0.05 }, '<')
    }, rootRef)
    return () => ctx.revert()
  }, [phase])

  // Scroll choreography once the page is live.
  useLayoutEffect(() => {
    if (phase !== 'done') return
    lenisRef.current?.start()
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-split]').forEach((el) =>
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.08,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }),
        }),
      )
      gsap.utils.toArray('[data-reveal]').forEach((el) =>
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out', clearProps: 'clipPath',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          },
        ),
      )
      gsap.utils.toArray('[data-fade]').forEach((el) =>
        gsap.from(el, { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }),
      )
      const below = gsap.utils.toArray('.tile', gridRef.current).filter((t) => t.getBoundingClientRect().top > window.innerHeight)
      gsap.set(below.map((t) => t.querySelector('.tile-media')), { clipPath: 'inset(100% 0% 0% 0%)' })
      ScrollTrigger.batch(below, {
        start: 'top 94%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch.map((t) => t.querySelector('.tile-media')), {
            clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out', stagger: 0.07, clearProps: 'clipPath',
          }),
      })
      gsap.utils.toArray('.num-value').forEach((el) =>
        gsap.from(el, {
          textContent: 0, duration: 1.6, ease: 'power2.out', snap: { textContent: 1 },
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        }),
      )
    }, rootRef)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [phase])

  // Filters re-flow the wall with Flip.
  const changeFilter = (k) => {
    if (k === filter) return
    if (!reduced && view === 'grid' && gridRef.current) filterState.current = Flip.getState(gridRef.current.querySelectorAll('.tile'))
    setFilter(k)
  }
  useLayoutEffect(() => {
    const st = filterState.current
    if (!st) return
    filterState.current = null
    Flip.from(st, {
      targets: gridRef.current.querySelectorAll('.tile'),
      duration: 0.8,
      ease: EASE,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.25, clearProps: 'all' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.4 }),
      onComplete: () => {
        gsap.set(gridRef.current.querySelectorAll('.tile'), { clearProps: 'transform,opacity' })
        ScrollTrigger.refresh()
      },
    })
  }, [filter])

  useEffect(() => {
    ScrollTrigger.refresh()
  }, [view])

  // Floating preview for the index view.
  useEffect(() => {
    if (view !== 'index' || reduced || !fine) return
    const el = previewRef.current
    const t = { x: 0, y: 0 }
    const p = { x: 0, y: 0 }
    const onMove = (e) => {
      t.x = e.clientX
      t.y = e.clientY
    }
    const tick = (time, dt) => {
      const k = 1 - Math.exp(-(dt / 1000) * 9)
      const vx = (t.x - p.x) * k
      p.x += vx
      p.y += (t.y - p.y) * k
      gsap.set(el, { x: p.x, y: p.y, rotate: gsap.utils.clamp(-12, 12, vx * 0.5) })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    gsap.ticker.add(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.ticker.remove(tick)
    }
  }, [view])

  // Case study overlay.
  const open = (idx, mediaEl) => {
    lastFocus.current = document.activeElement
    if (!reduced && mediaEl) openState.current = Flip.getState(mediaEl)
    setActive(idx)
  }

  const step = useCallback(
    (dir) => {
      const pos = visible.findIndex((v) => items.indexOf(v) === active)
      const next = visible[(pos + dir + visible.length) % visible.length]
      switching.current = true
      setActive(items.indexOf(next))
    },
    [visible, active],
  )

  const close = useCallback(() => {
    if (active == null) return
    const ov = overlayRef.current
    const it = items[active]
    const finish = () => {
      setActive(null)
      document.documentElement.classList.remove('is-locked')
      lenisRef.current?.start()
      lastFocus.current?.focus?.({ preventScroll: true })
    }
    const tile = view === 'grid' && gridRef.current?.querySelector(`[data-flip-id="${it.id}"]`)
    if (reduced || !tile || !tile.offsetParent) {
      gsap.to(ov, { opacity: 0, duration: reduced ? 0 : 0.4, onComplete: finish })
      return
    }
    const r = tile.getBoundingClientRect()
    if (r.bottom < 0 || r.top > window.innerHeight) {
      const y = window.scrollY + r.top - window.innerHeight * 0.3
      if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true, force: true })
      else window.scrollTo(0, y)
      lastFocus.current = tile.closest('button')
    }
    const st = Flip.getState(ovMediaRef.current)
    gsap.set(ovMediaRef.current, { visibility: 'hidden' })
    Flip.from(st, { targets: tile, duration: 0.85, ease: EASE, scale: true, zIndex: 60, onComplete: finish })
    gsap.to(ov, { opacity: 0, duration: 0.5, ease: 'power2.out' })
  }, [active, view])

  useLayoutEffect(() => {
    if (active == null) return
    document.documentElement.classList.add('is-locked')
    lenisRef.current?.stop()
    const ov = overlayRef.current
    const panel = ov.querySelectorAll('.ov-panel > *')
    if (openState.current) {
      const st = openState.current
      openState.current = null
      Flip.from(st, { targets: ovMediaRef.current, duration: 0.95, ease: EASE, scale: true })
      gsap.from(ov.querySelector('.ov-bg'), { opacity: 0, duration: 0.6, ease: 'power2.out' })
      gsap.from(panel, { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, delay: 0.45 })
    } else if (switching.current) {
      switching.current = false
      if (!reduced) {
        gsap.fromTo(ovMediaRef.current, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: EASE, clearProps: 'clipPath' })
        gsap.from(panel, { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.04 })
      }
    } else if (!reduced) {
      gsap.from(ov, { opacity: 0, duration: 0.4 })
    }
    closeRef.current?.focus({ preventScroll: true })
  }, [active])

  useEffect(() => {
    if (active == null) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'Tab') {
        const f = overlayRef.current.querySelectorAll('a[href], button')
        const firstEl = f[0]
        const lastEl = f[f.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, close, step])

  const cur = active != null ? items[active] : null
  const pct = String(Math.round(progress * 100)).padStart(3, '0')

  return (
    <div ref={rootRef} className={`app phase-${phase}`}>
      <a className="skip" href="#work">Skip to the work</a>

      {phase !== 'done' && (
        <div className="loader" aria-hidden="true">
          <div className="loader-bg" />
          <div className="loader-frame" ref={frameRef} data-flip-id="a0">
            {latest && <img src={latest} alt="" />}
          </div>
          <p className="loader-meta loader-meta--tl">Krishna Raju S<br />Work, 2023 to 2026</p>
          <p className="loader-meta loader-meta--tr">Pulling {items.length} pieces</p>
          <p className="loader-count">{pct}</p>
        </div>
      )}

      <header className="bar">
        <a href="#top" className="bar-mark" aria-label="Krishna Raju S, back to top">KRS</a>
        <nav aria-label="Sections">
          <ul>
            {[['work', 'Work'], ['about', 'About'], ['experience', 'Experience'], ['recognition', 'Recognition'], ['contact', 'Contact']].map(([id, l]) => (
              <li key={id}><a href={'#' + id}><Roll>{l}</Roll></a></li>
            ))}
          </ul>
        </nav>
        <Ext href={me.resume} className="bar-cv"><Roll>Resume</Roll></Ext>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="name">
          <h1 id="name" className="hero-name">{me.name}</h1>
          <div className="hero-meta">
            <p data-intro className="hero-role">{me.role}.</p>
            <p data-intro className="hero-line">{me.lines[0]}</p>
            <p data-intro className="hero-now">
              {experience[4].role}, {experience[4].company}, {experience[4].place}. Lives in {me.city}.
            </p>
          </div>
        </section>

        <section id="work" className="work" aria-label="Work">
          <div className="work-bar" data-intro>
            <div className="filters" role="group" aria-label="Filter the work">
              {FILTERS.map((f) => (
                <button
                  key={f.k}
                  type="button"
                  className="filter"
                  aria-pressed={filter === f.k}
                  onClick={() => changeFilter(f.k)}
                >
                  {f.k !== 'all' && <span className="filter-k">{f.k}</span>}
                  <Roll>{f.label}</Roll>
                  <sup>{count(f.k)}</sup>
                </button>
              ))}
            </div>
            <div className="views" role="group" aria-label="Layout">
              {['grid', 'index'].map((v) => (
                <button key={v} type="button" className="view" aria-pressed={view === v} onClick={() => setView(v)}>
                  <Roll>{v === 'grid' ? 'Wall' : 'Index'}</Roll>
                </button>
              ))}
            </div>
          </div>

          {view === 'grid' ? (
            <ul className="grid" ref={gridRef}>
              {items.map((it, i) => {
                const hidden = !(filter === 'all' || it.code === filter)
                return (
                  <li key={it.id} className="tile" data-id={it.id} data-hidden={hidden}>
                    <button
                      type="button"
                      className="tile-btn"
                      data-cursor={it.img ? 'View' : 'Open'}
                      onClick={(e) => open(i, e.currentTarget.querySelector('.tile-media'))}
                    >
                      <span className="tile-media gl-media" data-flip-id={it.id}>
                        {src(it) ? <img src={src(it)} alt={it.alt || ''} loading={it.img ? 'lazy' : 'eager'} decoding="async" /> : <span className="tile-ph" />}
                      </span>
                      <span className="tile-cap">
                        <span className="tile-code">{code(it)}</span>
                        <span className="tile-title">{it.title}</span>
                        <span className="tile-pitch">{it.pitch}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <ol className="index" onPointerLeave={() => setPreview('')}>
              {visible.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    className="row"
                    data-cursor="Open"
                    onPointerEnter={() => setPreview(src(it) || '')}
                    onClick={() => open(items.indexOf(it), null)}
                  >
                    <span className="row-code">{code(it)}</span>
                    <span className="row-title">{it.title}</span>
                    <span className="row-pitch">{it.pitch}</span>
                    <span className="row-kind">{it.kind}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="numbers" aria-label="In numbers">
          <ul>
            {numbers.map((n) => (
              <li key={n.label} data-fade>
                <span className="num-value">{n.value}</span>
                <span className="num-unit">{n.unit}</span>
                <span className="num-label">{n.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="about" className="about" aria-labelledby="about-h">
          <figure className="about-photo gl-media" data-reveal>
            <img src={me.portrait} alt="Portrait of Krishna Raju S" loading="lazy" />
          </figure>
          <div className="about-text">
            <p className="label">About</p>
            <h2 id="about-h" data-split>{me.lines[3]}</h2>
            <p data-fade>
              {me.name} is an {me.role.toLowerCase()}. {certifications[0]}. {experience[4].short}.
            </p>
            <p data-fade className="muted">{me.lines[1]}</p>
          </div>
        </section>

        <section className="ai" aria-labelledby="ai-h">
          <p className="label">AI work</p>
          <h2 id="ai-h" data-split>{ai.agent.name}</h2>
          <p className="ai-pitch" data-fade>{ai.agent.pitch}</p>
          <ol className="ai-versions">
            {ai.agent.versions.map((v, i) => (
              <li key={v} data-fade style={{ '--v': i }}>
                <span>v{i + 1}</span>
                {v}
              </li>
            ))}
          </ol>
          <div className="ai-pair">
            <div data-fade>
              <h3>{ai.rag.name}</h3>
              <p>{ai.rag.pitch}</p>
              <ol className="ai-steps">
                {ai.rag.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
            <div data-fade>
              <h3>{ai.browser.name}</h3>
              <p>{ai.browser.pitch}</p>
              <ul className="chips" aria-label="AI stack">
                {ai.stack.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section id="experience" className="exp" aria-labelledby="exp-h">
          <p className="label">Experience</p>
          <h2 id="exp-h" data-split>Five roles, oldest first</h2>
          <ol className="exp-list">
            {experience.map((e) => (
              <li key={e.id} className="exp-row" data-fade>
                <span className="exp-year">{e.year}</span>
                <div className="exp-main">
                  <h3>{e.company}</h3>
                  <p className="exp-role">{e.role}, {e.place}</p>
                  <p className="exp-text">{e.text}</p>
                </div>
                {e.photo ? (
                  <figure className="exp-photo gl-media" data-reveal>
                    <img src={e.photo} alt={e.photoAlt} loading="lazy" />
                  </figure>
                ) : (
                  <span className="exp-short">{e.short}</span>
                )}
              </li>
            ))}
          </ol>

          <article className="note" aria-labelledby="note-h">
            <div className="note-text" data-fade>
              <p className="label">Field note, {field[0].when}</p>
              <h3 id="note-h">{field[0].title}</h3>
              <p>{field[0].text}</p>
              <Ext href={field[0].link.url} className="btn" data-magnetic><Roll>{field[0].link.label}</Roll></Ext>
            </div>
            {field[0].photos.map((p) => (
              <figure key={p.src} className="note-photo">
                <div className="gl-media" data-reveal><img src={p.src} alt={p.alt} loading="lazy" /></div>
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </article>
        </section>

        <section id="recognition" className="rec" aria-labelledby="rec-h">
          <p className="label">Recognition</p>
          <h2 id="rec-h" data-split>Awards and leadership</h2>
          <ol className="rec-list">
            {awards.map((a) => (
              <li key={a.title} data-fade>
                <span className="rec-year">{a.year}</span>
                <span className="rec-title">{a.title}</span>
                <span className="rec-detail">{a.detail}</span>
                {a.photo && (
                  <figure className="rec-photo gl-media" data-reveal>
                    <img src={a.photo} alt={a.photoAlt} loading="lazy" />
                  </figure>
                )}
              </li>
            ))}
          </ol>
          <div className="lead">
            <div className="lead-text" data-fade>
              <h3>{leadership.title}</h3>
              <p>{leadership.text}</p>
            </div>
            {leadership.photos.map((p, i) => (
              <figure key={p.src} className={`lead-photo lead-photo--${i} gl-media`} data-reveal>
                <img src={p.src} alt={p.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>

        <section className="kit" aria-labelledby="kit-h">
          <p className="label">Toolkit</p>
          <h2 id="kit-h" className="sr-only">Skills and certifications</h2>
          <div className="kit-grid">
            {Object.entries(skills).map(([group, list]) => (
              <div key={group} data-fade>
                <h3>{group}</h3>
                <ul>{list.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="certs" data-fade>
            <h3>Education and certifications</h3>
            <ul>{certifications.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        </section>

        <section id="contact" className="contact" aria-labelledby="contact-h">
          <p className="label">Contact</p>
          <h2 id="contact-h" data-split>{me.lines[2]}</h2>
          <a className="contact-mail" href={`mailto:${me.email}`} data-magnetic data-cursor="Write">
            <Roll>{me.email}</Roll>
          </a>
          <div className="contact-links">
            <Ext href={me.linkedin} className="btn" data-magnetic><Roll>LinkedIn</Roll></Ext>
            <Ext href={me.github} className="btn" data-magnetic><Roll>GitHub</Roll></Ext>
            <Ext href={me.resume} className="btn btn--solid" data-magnetic><Roll>Resume, PDF</Roll></Ext>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>{me.name}, {me.city}</span>
        <a href="#top"><Roll>Back to top</Roll></a>
      </footer>

      {cur && (
        <div className="ov" ref={overlayRef} role="dialog" aria-modal="true" aria-labelledby="ov-title" data-lenis-prevent>
          <div className="ov-bg" onClick={close} />
          <div className="ov-media gl-media" ref={ovMediaRef} data-flip-id={cur.id}>
            {src(cur) && <img src={src(cur)} alt={cur.alt || ''} />}
          </div>
          <div className="ov-panel" key={cur.id}>
            <p className="ov-code">{code(cur)}, {cur.kind}{cur.meta ? `, ${cur.meta}` : ''}</p>
            <h2 id="ov-title">{cur.title}</h2>
            <p className="ov-pitch">{cur.pitch}</p>
            {cur.body?.map((b) => <p key={b} className="ov-body">{b}</p>)}
            {cur.steps && (
              <ol className="ov-steps">{cur.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            )}
            {cur.link && (
              <Ext href={cur.link.url} className="btn btn--solid" data-magnetic><Roll>{cur.link.label}</Roll></Ext>
            )}
            {cur.note && <p className="ov-note">{cur.note}</p>}
            <div className="ov-nav">
              <button type="button" onClick={() => step(-1)}><Roll>Previous</Roll></button>
              <button type="button" onClick={() => step(1)}><Roll>Next</Roll></button>
            </div>
          </div>
          <button type="button" className="ov-close" ref={closeRef} onClick={close} data-magnetic>
            <Roll>Close</Roll>
          </button>
        </div>
      )}

      {view === 'index' && fine && !reduced && (
        <div className="preview" ref={previewRef} aria-hidden="true">
          <div className={`preview-in${preview ? ' is-on' : ''}`}>{preview && <img src={preview} alt="" />}</div>
        </div>
      )}

      <canvas ref={waterRef} className="water" aria-hidden="true" />
      <div ref={cursorRef} className="cursor" aria-hidden="true">
        <span className="cursor-blob" />
        <span className="cursor-label" />
      </div>
    </div>
  )
}

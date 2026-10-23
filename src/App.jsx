import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { apps, me, field, leadership, awards, experience } from './content.js'
import { gsap, ScrollTrigger, SplitText, reduced, finePointer, hasGL, startSmoothScroll, lenis, scrollToTarget } from './motion.js'
import { buildCovers, slug } from './covers.js'
import { GLContext, Cursor } from './ui.jsx'
import Index from './Index.jsx'
import Project from './Project.jsx'

const slugs = apps.map((a) => slug(a.name))

function parse(hash) {
  const m = hash.match(/^#\/work\/(.+)$/)
  const i = m ? slugs.indexOf(m[1]) : -1
  if (i >= 0) return { view: 'project', index: i }
  return { view: 'index', section: hash.replace(/^#\/?/, '') || null }
}

// Everything the preloader waits for, with real progress.
async function load(onProgress) {
  const photos = [me.portrait, ...field[0].photos.map((p) => p.src), ...leadership.photos.map((p) => p.src), ...awards.filter((a) => a.photo).map((a) => a.photo), ...experience.filter((e) => e.photo).map((e) => e.photo)]
  let done = 0
  const total = photos.length + 2
  const tickOne = () => onProgress(++done / total)
  await Promise.all([
    document.fonts.load('800 100px "Archivo"'),
    document.fonts.load('500 20px "IBM Plex Mono"'),
  ]).catch(() => {})
  tickOne()
  buildCovers()
  tickOne()
  await Promise.all(
    photos.map(
      (src) =>
        new Promise((res) => {
          const im = new Image()
          im.onload = im.onerror = () => {
            tickOne()
            res()
          }
          im.src = src
        }),
    ),
  )
}

export default function App() {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  const [ready, setReady] = useState(false)
  const [stage, setStage] = useState(null)
  const routeRef = useRef(route)
  const loaderRef = useRef(null)
  const countRef = useRef(null)
  const curtainRef = useRef(null)
  const curtainText = useRef(null)
  const busy = useRef(null)

  // Preload, then hand over to the intro.
  useEffect(() => {
    let alive = true
    const shown = { v: 0 }
    const show = (p) => {
      gsap.to(shown, {
        v: p,
        duration: reduced ? 0 : 0.5,
        overwrite: true,
        onUpdate: () => {
          if (countRef.current) countRef.current.textContent = String(Math.round(shown.v * 100)).padStart(3, '0')
          loaderRef.current?.style.setProperty('--p', shown.v)
        },
      })
    }
    const cap = new Promise((res) => setTimeout(res, 2400))
    Promise.race([load(show), cap]).then(() => {
      buildCovers()
      show(1)
      setTimeout(() => alive && setReady(true), reduced ? 0 : 450)
    })
    return () => {
      alive = false
    }
  }, [])

  // GL layers, smooth scroll and the single clock.
  useEffect(() => {
    if (!ready) return
    startSmoothScroll()
    if (!hasGL) {
      document.documentElement.classList.add('no-gl')
      return
    }
    let st = null
    let water = null
    let cancelled = false
    Promise.all([import('./gl/stage.js'), import('./gl/water.js')]).then(([s, w]) => {
      if (cancelled) return
      try {
        st = s.createStage(document.getElementById('gl-stage'))
        if (finePointer) water = w.createWater(document.getElementById('gl-water'))
      } catch {
        document.documentElement.classList.add('no-gl')
        return
      }
      document.documentElement.classList.add('gl')
      setStage(st)
      gsap.ticker.add(frame)
    })
    function frame(time, dtMs) {
      const dt = Math.min(dtMs / 1000, 0.05)
      st?.tick(time, dt)
      water?.tick(time, dt)
    }
    return () => {
      cancelled = true
      gsap.ticker.remove(frame)
      st?.dispose()
      water?.dispose()
      setStage(null)
    }
  }, [ready])

  // Intro: the loader lifts like a shutter, the name rises.
  useEffect(() => {
    if (!ready) return
    const initial = routeRef.current
    const jump = () => {
      if (initial.view === 'index' && initial.section) scrollToTarget(`#${initial.section}`, true)
    }
    if (reduced) {
      loaderRef.current && (loaderRef.current.style.display = 'none')
      jump()
      return
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => loaderRef.current && (loaderRef.current.style.display = 'none') })
      tl.to(loaderRef.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'reel' })
      const intro = document.querySelectorAll('[data-intro]')
      intro.forEach((node) => {
        const split = SplitText.create(node, { type: 'words,chars', mask: 'chars' })
        tl.from(split.chars, { yPercent: 115, duration: 1.3, stagger: 0.035 }, 0.45)
      })
      tl.from('[data-intro-fade]', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.9)
      jump()
    })
    return () => ctx.revert()
  }, [ready])

  // Hash routing with a curtain between views.
  useEffect(() => {
    const onHash = () => {
      const next = parse(window.location.hash)
      const prev = routeRef.current
      if (next.view === 'index' && prev.view === 'index') {
        if (next.section) scrollToTarget(`#${next.section}`)
        routeRef.current = next
        return
      }
      const swap = () => {
        flushSync(() => setRoute(next))
        routeRef.current = next
        stage?.previewHide()
        const target =
          next.view === 'index'
            ? next.section
              ? `#${next.section}`
              : prev.view === 'project'
                ? `#row-${slugs[prev.index]}`
                : null
            : null
        window.scrollTo(0, 0)
        // lenis is stopped under the curtain, so these jumps need force
        lenis?.scrollTo(0, { immediate: true, force: true })
        ScrollTrigger.refresh()
        if (target) {
          const el = document.querySelector(target)
          if (el && lenis) lenis.scrollTo(el, { immediate: true, force: true, offset: next.section ? 0 : -window.innerHeight * 0.4 })
          else el?.scrollIntoView({ block: next.section ? 'start' : 'center' })
        }
      }
      if (reduced || !curtainRef.current) {
        swap()
        return
      }
      busy.current?.progress(1)
      curtainText.current.textContent = next.view === 'project' ? apps[next.index].name : 'Index'
      lenis?.stop()
      busy.current = gsap
        .timeline({
          onComplete: () => {
            busy.current = null
            lenis?.start()
          },
        })
        .set(curtainRef.current, { visibility: 'visible', clipPath: 'inset(100% 0 0 0)' })
        .fromTo(curtainText.current, { yPercent: 120 }, { yPercent: 0, duration: 0.9, ease: 'reelOut' }, 0.2)
        .to(curtainRef.current, { clipPath: 'inset(0% 0 0% 0)', duration: 0.75, ease: 'reel' }, 0)
        .add(swap, '+=0.1')
        .to(curtainText.current, { yPercent: -120, duration: 0.6, ease: 'reel' }, '+=0.05')
        .to(curtainRef.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'reel' }, '<0.15')
        .set(curtainRef.current, { visibility: 'hidden' })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [stage])

  // Section links on the index scroll in place; elsewhere they route.
  const goSection = useCallback((e, id) => {
    if (routeRef.current.view !== 'index') return
    e.preventDefault()
    scrollToTarget(`#${id}`)
  }, [])

  useEffect(() => {
    document.title = route.view === 'project' ? `${apps[route.index].name} | Krishna Raju S` : 'Krishna Raju S'
  }, [route])

  return (
    <GLContext.Provider value={stage}>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Skip to content
      </a>
      <canvas id="gl-stage" className="gl-layer" aria-hidden="true" />

      <header className="bar">
        <a className="bar__mark" href="#/" onClick={(e) => goSection(e, 'top')} data-cursor="Top">
          KRS<span>Reel</span>
        </a>
        <nav aria-label="Primary">
          <a href="#work" onClick={(e) => goSection(e, 'work')} aria-current={route.view === 'project' ? 'page' : undefined}>Work</a>
          <a href="#about" onClick={(e) => goSection(e, 'about')}>About</a>
          <a href="#contact" onClick={(e) => goSection(e, 'contact')}>Contact</a>
          <a href={me.resume} target="_blank" rel="noopener">Resume</a>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        {ready && (route.view === 'project' ? <Project key={route.index} index={route.index} /> : <Index />)}
      </main>

      <div ref={curtainRef} className="curtain" aria-hidden="true">
        <span className="curtain__mask">
          <span ref={curtainText} className="curtain__text" />
        </span>
      </div>

      <div ref={loaderRef} className="loader" role="status" aria-live="polite" style={{ '--p': 0 }}>
        <div className="loader__dial" aria-hidden="true" />
        <p className="loader__count" ref={countRef}>000</p>
        <p className="loader__label">Loading the reel of {me.name}</p>
      </div>

      <canvas id="gl-water" className="gl-water" aria-hidden="true" />
      <Cursor />
    </GLContext.Provider>
  )
}

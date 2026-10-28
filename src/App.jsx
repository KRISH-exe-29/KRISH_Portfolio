import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import Lenis from 'lenis'
import {
  asset, me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills,
} from './content.js'
import { createScene } from './scene.js'
import { initCursor, initMagnetic, initScramble, initIceMedia } from './fx.js'

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin)

const pad = (n) => String(n).padStart(2, '0')
const ext = { target: '_blank', rel: 'noopener' }

const contacts = [
  { label: 'Email', href: `mailto:${me.email}`, text: me.email, cursor: 'Write', shape: 1, external: false },
  { label: 'LinkedIn', href: me.linkedin, text: me.linkedin.replace('https://', ''), cursor: 'Open', shape: 2, external: true },
  { label: 'GitHub', href: me.github, text: me.github.replace('https://', ''), cursor: 'Open', shape: 3, external: true },
  { label: 'Resume', href: me.resume, text: 'Resume, PDF', cursor: 'Read', shape: 4, external: true },
]

export default function App() {
  const root = useRef(null)
  const canvas = useRef(null)
  const sceneRef = useRef(null)
  const audio = useRef(null)
  const clickAudio = useRef(null)
  const soundOn = useRef(false)
  const [sound, setSound] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    const el = root.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(pointer: fine)').matches
    const offs = []
    const listen = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts)
      offs.push(() => target.removeEventListener(type, fn, opts))
    }

    html.classList.add('is-loading')
    if (reduced) html.classList.add('is-reduced')

    const sceneApi = createScene(canvas.current, { reduced, onLost: () => html.classList.add('no-gl') })
    sceneRef.current = sceneApi
    if (!sceneApi) html.classList.add('no-gl')

    const lenis = reduced ? null : new Lenis({ lerp: 0.085, anchors: true })
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update)
      lenis.stop()
    }
    gsap.ticker.lagSmoothing(0)

    // Camera stops: every [data-stop] element, in document order.
    const stopEls = [...el.querySelectorAll('[data-stop]')]
    const secEls = [...el.querySelectorAll('[data-label]')]
    const names = stopEls.map((n) => n.dataset.stop)
    sceneApi?.setStops(names)
    const aiA = names.indexOf('ai-0')
    const aiB = names.indexOf('ai-1')
    let ys = []
    let tops = []
    const measure = () => {
      const sy = window.scrollY
      const vh = window.innerHeight
      ys = stopEls.map((n) => {
        const r = n.getBoundingClientRect()
        return r.top + sy + r.height / 2 - vh / 2
      })
      tops = secEls.map((n) => n.getBoundingClientRect().top + sy)
    }
    measure()
    let refreshCall = null
    const ro = new ResizeObserver(() => {
      measure()
      refreshCall?.kill()
      refreshCall = gsap.delayedCall(0.25, () => ScrollTrigger.refresh())
    })
    ro.observe(el)
    ScrollTrigger.addEventListener('refresh', measure)

    const stopAt = (y) => {
      const n = ys.length
      if (!n || y <= ys[0]) return 0
      for (let k = 0; k < n - 1; k++) {
        if (y < ys[k + 1]) return k + (y - ys[k]) / Math.max(ys[k + 1] - ys[k], 1)
      }
      return n - 1
    }

    const chapterEl = el.querySelector('.hud__chapter')
    const barEl = el.querySelector('.hud__bar i')
    const versionEls = [...el.querySelectorAll('[data-v]')]
    let lastSec = -1
    let lastV = -2
    let lastY = window.scrollY

    // One clock: Lenis, the scene and the HUD all run from the GSAP ticker.
    const tick = (time, dtMs) => {
      lenis?.raf(time * 1000)
      const y = window.scrollY
      const vh = window.innerHeight
      const s = stopAt(y)
      const vel = lenis ? lenis.velocity : y - lastY
      lastY = y
      sceneApi?.update(Math.min(dtMs, 50) / 1000, s, vel)

      let si = 0
      for (let i = 0; i < tops.length; i++) if (y + vh * 0.5 >= tops[i]) si = i
      if (si !== lastSec && secEls[si]) {
        lastSec = si
        chapterEl.textContent = `${pad(si)}  ${secEls[si].dataset.label}`
      }
      const max = html.scrollHeight - vh
      barEl.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`

      if (aiA >= 0 && aiB > aiA) {
        const g = Math.min(Math.max((s - aiA) / (aiB - aiA), 0), 1)
        const v = s < aiA - 0.5 ? -1 : Math.min(11, Math.floor(g * 12))
        if (v !== lastV) {
          lastV = v
          versionEls.forEach((n, i) => {
            n.classList.toggle('is-on', i <= v)
            n.classList.toggle('is-tip', i === v)
          })
        }
      }
    }
    gsap.ticker.add(tick)

    const ctx = gsap.context(() => {}, el)

    const reveals = () => {
      gsap.utils.toArray('[data-split]', el).forEach((node) => {
        SplitText.create(node, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.07,
            scrollTrigger: { trigger: node, start: 'top 88%', once: true },
          }),
        })
      })
      gsap.utils.toArray('[data-reveal]', el).forEach((node) => {
        gsap.from(node, {
          autoAlpha: 0, y: 28, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: node, start: 'top 90%', once: true },
        })
      })
      gsap.utils.toArray('[data-count]', el).forEach((node) => {
        const end = Number(node.dataset.count)
        const o = { v: 0 }
        node.textContent = '0'
        gsap.to(o, {
          v: end, duration: 1.6, ease: 'expo.out',
          onUpdate: () => { node.textContent = String(Math.round(o.v)) },
          scrollTrigger: { trigger: node, start: 'top 88%', once: true },
        })
      })
    }

    // Preloader: real progress (fonts, shader compile, first photos), 2.3 s cap.
    const loader = el.querySelector('.loader')
    const numEl = el.querySelector('.loader__num')
    const fillEl = el.querySelector('.loader__fill')
    const pre = [me.portrait, experience[0].photo, leadership.photos[0].src].map((src) => new Promise((res) => {
      const img = new Image()
      img.onload = img.onerror = res
      img.src = src
    }))
    const tasks = [document.fonts ? document.fonts.ready : Promise.resolve(), sceneApi ? sceneApi.compile() : Promise.resolve(), ...pre]
    let done = 0
    tasks.forEach((p) => p.then(() => { done++ }, () => { done++ }))
    const t0 = performance.now()
    let prog = 0
    let started = false

    const intro = () => {
      html.classList.remove('is-loading')
      ctx.add(() => {
        if (reduced) {
          gsap.set(loader, { autoAlpha: 0 })
          return
        }
        const heroSplit = SplitText.create('.hero__name', { type: 'words,chars', mask: 'words' })
        gsap.timeline()
          .to('.loader__inner', { autoAlpha: 0, y: -16, duration: 0.45, ease: 'power2.in' })
          .fromTo(loader, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.05')
          .to(sceneApi ? sceneApi.state : { intro: 0 }, { intro: 1, duration: 2.6, ease: 'expo.out' }, '<')
          .from(heroSplit.chars, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.035 }, '-=1.9')
          .from('[data-intro]', { autoAlpha: 0, y: 18, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, '-=1.0')
          .from('.hud__item', { autoAlpha: 0, duration: 0.8, stagger: 0.05 }, '<')
          .call(() => lenis?.start(), null, 1.2)
          .set(loader, { autoAlpha: 0 })
        reveals()
      })
      ScrollTrigger.refresh()
    }

    const loaderTick = () => {
      const ms = performance.now() - t0
      let target = reduced || ms > 2300 ? 1 : done / tasks.length
      target = Math.min(target, reduced ? 1 : ms / 900)
      prog += (target - prog) * (reduced ? 1 : 0.12)
      if (target === 1 && prog > 0.996) prog = 1
      numEl.textContent = String(Math.round(prog * 100)).padStart(3, '0')
      fillEl.style.transform = `scaleX(${prog})`
      if (prog === 1 && !started) {
        started = true
        gsap.ticker.remove(loaderTick)
        intro()
      }
    }
    gsap.ticker.add(loaderTick)

    // Interaction
    listen(window, 'pointermove', (e) => sceneApi?.pointer(e.clientX, e.clientY), { passive: true })
    if (fine) offs.push(initCursor(el.querySelector('.cursor')), initMagnetic(el), initIceMedia(el))
    offs.push(initScramble(el))
    listen(window, 'load', () => ScrollTrigger.refresh())

    // Sound is opt-in; it pauses with the tab.
    listen(document, 'visibilitychange', () => {
      const a = audio.current
      if (!a) return
      if (document.hidden) a.pause()
      else if (soundOn.current) a.play().catch(() => {})
    })
    listen(document, 'click', (e) => {
      if (!soundOn.current || !e.target.closest || !e.target.closest('a, button')) return
      if (!clickAudio.current) {
        clickAudio.current = new Audio(asset('audio/click.mp3'))
        clickAudio.current.volume = 0.4
      }
      clickAudio.current.currentTime = 0
      clickAudio.current.play().catch(() => {})
    })

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.remove(loaderTick)
      refreshCall?.kill()
      ro.disconnect()
      ScrollTrigger.removeEventListener('refresh', measure)
      offs.forEach((f) => f())
      ctx.revert()
      lenis?.destroy()
      sceneApi?.dispose()
      sceneRef.current = null
      audio.current?.pause()
      html.classList.remove('is-loading', 'is-reduced', 'no-gl')
    }
  }, [])

  useEffect(() => {
    soundOn.current = sound
    if (!sound) {
      audio.current?.pause()
      return
    }
    if (!audio.current) {
      const a = new Audio(asset('audio/soundtrack.mp3'))
      a.loop = true
      a.volume = 0.35
      audio.current = a
    }
    audio.current.play().catch(() => setSound(false))
  }, [sound])

  const shape = (i) => () => sceneRef.current?.setShape(i)
  const photo = (src, alt, caption) => (
    <figure className="shot" data-ice="">
      <div className="shot__frame">
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )

  return (
    <div ref={root} className="app">
      <a className="skip" href="#main">Skip to content</a>
      <canvas ref={canvas} className="gl" aria-hidden="true" />
      <div className="gl-fallback" aria-hidden="true" />

      <svg className="defs" aria-hidden="true" width="0" height="0" focusable="false">
        <filter id="ice" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence id="ice-turb" type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap id="ice-disp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset id="ice-shift" in="r" dx="0" dy="0" result="ro" />
          <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
          <feBlend in="ro" in2="gb" mode="screen" />
        </filter>
      </svg>

      <div className="loader" aria-hidden="true">
        <div className="loader__inner">
          <div className="loader__row">
            <span>{me.name}</span>
            <span>Freezing the scene</span>
          </div>
          <div className="loader__count">
            <span className="loader__num">000</span>
            <span className="loader__pct">%</span>
          </div>
          <div className="loader__bar"><i className="loader__fill" /></div>
        </div>
      </div>

      <header className="hud">
        <a className="hud__item hud__brand" href="#top" data-cursor="Top">
          <span className="hud__brand-full" data-scramble="">{me.name}</span>
          <span className="hud__brand-short">K.R.S</span>
        </a>
        <nav className="hud__item hud__nav" aria-label="Sections">
          <a href="#work" className="hud__hide-sm"><span data-scramble="">Work</span></a>
          <a href="#ai" className="hud__hide-sm"><span data-scramble="">AI</span></a>
          <a href="#contact"><span data-scramble="">Contact</span></a>
          <button type="button" className="hud__sound" aria-pressed={sound} onClick={() => setSound((v) => !v)} data-cursor={sound ? 'Mute' : 'Play'}>
            <span className={`eq${sound ? ' is-on' : ''}`} aria-hidden="true"><i /><i /><i /></span>
            {sound ? 'Sound on' : 'Sound off'}
          </button>
        </nav>
        <p className="hud__item hud__chapter" aria-hidden="true">00  Monolith</p>
        <div className="hud__item hud__bar" aria-hidden="true"><i /></div>
      </header>

      <div className="cursor" aria-hidden="true">
        <div className="cursor__blob" />
        <span className="cursor__label" />
      </div>

      <main id="main">
        <section id="top" className="sec hero" data-label="Monolith">
          <div className="hero__inner" data-stop="hero">
            <p className="meta" data-intro="">{me.city} / {me.field}</p>
            <h1 className="hero__name">Krishna <span>Raju S</span></h1>
            <p className="hero__role" data-intro="">{me.role}</p>
            <p className="hero__line" data-intro="">{me.lines[1]}</p>
            <a className="hero__cue" href="#work" data-intro="" data-cursor="Descend">
              <span data-scramble="">Scroll to the nine apps</span>
            </a>
          </div>
        </section>

        <section className="sec numbers" data-label="Readings" aria-labelledby="numbers-h">
          <div className="numbers__inner" data-stop="numbers">
            <h2 id="numbers-h" className="h-small" data-reveal="">Readings</h2>
            <ul className="readings">
              {numbers.map((n) => (
                <li key={n.label} className="reading" data-reveal="">
                  <span className="reading__value" data-count={n.value}>{n.value}</span>
                  <span className="reading__unit">{n.unit}</span>
                  <span className="reading__label">{n.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="work" className="sec apps" data-label="In production" aria-labelledby="apps-h">
          <div className="apps__intro" data-stop="apps-intro">
            <h2 id="apps-h" className="h-big" data-split="">{me.lines[0]}</h2>
            <p className="lede" data-reveal="">Nine apps in production at Indo Tech Transformers. Each one sits in its own block of ice.</p>
          </div>
          {apps.map((a, j) => (
            <article key={a.name} className="app" data-stop={`app-${j}`}>
              <div className="panel app__card" data-reveal="">
                <p className="idx">{pad(j + 1)} / {pad(apps.length)}</p>
                <h3 className="app__name">{a.name}</h3>
                <p className="app__pitch">{a.pitch}</p>
                {a.url ? (
                  <a className="btn" href={a.url} {...ext} data-cursor="Open" data-magnetic="">
                    <span data-scramble="">Open project</span>
                  </a>
                ) : (
                  <p className="muted">No public link</p>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="sec side" data-label="On the side" aria-labelledby="side-h">
          <div className="panel side__inner" data-stop="side">
            <h2 id="side-h" className="h-small">On the side</h2>
            <ul className="list">
              {sideProjects.map((p) => (
                <li key={p.name} className="list__row" data-reveal="">
                  <h3>{p.name}</h3>
                  <p>{p.pitch}</p>
                  {p.url ? (
                    <a className="link" href={p.url} {...ext} data-cursor="Open"><span data-scramble="">Open</span></a>
                  ) : (
                    <span className="muted">No public link</span>
                  )}
                </li>
              ))}
            </ul>
            <h2 className="h-small">Still freezing</h2>
            <ul className="list">
              {building.map((b) => (
                <li key={b.name} className="list__row" data-reveal="">
                  <h3>{b.name}</h3>
                  <p>{b.pitch} {b.status}.</p>
                  <span className="muted">Private for now</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="ai" className="sec ai" data-label="AI" aria-labelledby="ai-h">
          <div className="panel ai__head" data-stop="ai-0">
            <p className="idx">Grown in twelve versions</p>
            <h2 id="ai-h" className="h-big" data-split="">{ai.agent.name}</h2>
            <p data-reveal="">{ai.agent.pitch}</p>
          </div>
          <ol className="versions" aria-label="Agent-Builder versions">
            {ai.agent.versions.map((v, i) => (
              <li key={v} className="version" data-v={i}>
                <span className="version__n">v{pad(i + 1)}</span>
                <span className="version__t">{v}</span>
              </li>
            ))}
          </ol>
          <div className="ai__more" data-stop="ai-1">
            <div className="panel" data-reveal="">
              <h3>{ai.rag.name}</h3>
              <p>{ai.rag.pitch}</p>
              <ol className="steps">
                {ai.rag.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
            <div className="panel" data-reveal="">
              <h3>{ai.browser.name}</h3>
              <p>{ai.browser.pitch}</p>
              <ul className="chips" aria-label="AI stack">
                {ai.stack.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="sec exp" data-label="Experience" aria-labelledby="exp-h">
          <div className="exp__head">
            <h2 id="exp-h" className="h-big" data-split="">Experience</h2>
            <p className="lede" data-reveal="">Five roles, oldest first.</p>
          </div>
          {experience.map((x, i) => (
            <article key={x.id} className="exp__item" data-stop={`exp-${i}`}>
              <div className="panel exp__card" data-reveal="">
                <p className="idx">{x.year}</p>
                <h3>{x.role}</h3>
                <p className="exp__co">{x.company} <span className="muted">/ {x.place}</span></p>
                <p>{x.text}</p>
                {x.photo && photo(x.photo, x.photoAlt)}
              </div>
            </article>
          ))}
        </section>

        <section className="sec recog" data-label="Recognition" aria-labelledby="recog-h">
          <div className="panel panel--wide" data-stop="awards">
            <h2 id="recog-h" className="h-small">Recognition</h2>
            <ol className="awards">
              {awards.map((a) => (
                <li key={a.title} className="award" data-reveal="">
                  <span className="award__year">{a.year}</span>
                  <div className="award__body">
                    <h3>{a.title}</h3>
                    <p>{a.detail}</p>
                    {a.photo && photo(a.photo, a.photoAlt)}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="panel panel--wide" data-stop="lead">
            <h3 className="h-mid" data-split="">{leadership.title}</h3>
            <p data-reveal="">{leadership.text}</p>
            <div className="gallery">
              {leadership.photos.map((p) => <div key={p.src} data-reveal="">{photo(p.src, p.alt)}</div>)}
            </div>
          </div>

          {field.map((f) => (
            <div key={f.id} className="panel panel--wide" data-stop="field">
              <p className="idx">{f.when}</p>
              <h3 className="h-mid" data-split="">{f.title}</h3>
              <p data-reveal="">{f.text}</p>
              <a className="btn" href={f.link.url} {...ext} data-cursor="Open" data-magnetic="">
                <span data-scramble="">{f.link.label}</span>
              </a>
              <div className="gallery gallery--two">
                {f.photos.map((p) => <div key={p.src} data-reveal="">{photo(p.src, p.alt, p.caption)}</div>)}
              </div>
            </div>
          ))}
        </section>

        <section className="sec skills" data-label="Skills" aria-labelledby="skills-h">
          <div className="panel panel--wide" data-stop="skills">
            <h2 id="skills-h" className="h-small">Skills</h2>
            <div className="skills__grid">
              {Object.entries(skills).map(([group, list]) => (
                <div key={group} className="skills__group" data-reveal="">
                  <h3>{group}</h3>
                  <ul className="chips">
                    {list.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <h3 className="certs__h">Certifications</h3>
            <ul className="certs">
              {certifications.map((c) => <li key={c} data-reveal="">{c}</li>)}
            </ul>
          </div>
        </section>

        <section id="contact" className="sec contact" data-label="Contact" aria-labelledby="contact-h">
          <div className="contact__inner" data-stop="contact">
            <h2 id="contact-h" className="h-big" data-split="">{me.lines[2]}</h2>
            <ul className="contact__links">
              {contacts.map((c) => (
                <li key={c.label}>
                  <a
                    className="contact__link"
                    href={c.href}
                    {...(c.external ? ext : {})}
                    data-cursor={c.cursor}
                    data-magnetic=""
                    onPointerEnter={shape(c.shape)}
                    onPointerLeave={shape(0)}
                    onFocus={shape(c.shape)}
                    onBlur={shape(0)}
                  >
                    <span className="contact__label">{c.label}</span>
                    <span className="contact__text" data-scramble="">{c.text}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="contact__portrait">{photo(me.portrait, 'Portrait of Krishna Raju S')}</div>
          </div>
          <footer className="foot">
            <p>{me.lines[3]}</p>
            <p className="muted">{me.name}, {me.city}</p>
          </footer>
        </section>
      </main>
    </div>
  )
}

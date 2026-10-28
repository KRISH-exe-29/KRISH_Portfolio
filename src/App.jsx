/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import {
  me, numbers, experience, apps, building, sideProjects, ai, awards, leadership, field, certifications, skills,
} from './content.js'
import { initWater } from './water.js'
import { initMedia } from './media.js'

gsap.registerPlugin(ScrollTrigger, SplitText)

const nav = [
  ['home', 'Home'], ['about', 'About'], ['work', 'Work'], ['ai', 'AI'],
  ['journey', 'Journey'], ['awards', 'Awards'], ['contact', 'Contact'],
]
const mail = `mailto:${me.email}?subject=${encodeURIComponent('Hi Krishna')}`
const pad = (n) => String(n).padStart(2, '0')
const host = (url) => new URL(url).hostname.replace(/^www\./, '')

let lenis = null

function go(e, id) {
  const el = document.getElementById(id)
  if (!el) return
  e?.preventDefault()
  if (lenis) lenis.scrollTo(el, { duration: 1.4 })
  else el.scrollIntoView()
  history.replaceState(null, '', `#${id}`)
}

const Plus = () => (
  <svg className="plus" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)

function Roll({ children }) {
  return (
    <span className="roll">
      <span data-t={children}>{children}</span>
    </span>
  )
}

function Ext({ href, children, ...rest }) {
  return (
    <a href={href} target="_blank" rel="noopener" {...rest}>
      {children}
    </a>
  )
}

function Photo({ src, alt, className = '' }) {
  return (
    <div className={`fx ${className}`} data-fx data-reveal>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  )
}

function Socials() {
  return (
    <>
      <li><Ext href={me.linkedin}><Roll>LinkedIn</Roll></Ext></li>
      <li><Ext href={me.github}><Roll>GitHub</Roll></Ext></li>
      <li><Ext href={me.resume}><Roll>Résumé</Roll></Ext></li>
    </>
  )
}

// Custom cursor: lerped dot that squashes along its velocity and grows into a labelled disc over targets.
function initCursor(el) {
  const blob = el.querySelector('.cursor-blob')
  const label = el.querySelector('.cursor-label')
  const setX = gsap.quickSetter(el, 'x', 'px')
  const setY = gsap.quickSetter(el, 'y', 'px')
  const setR = gsap.quickSetter(blob, 'rotation', 'deg')
  const setSX = gsap.quickSetter(blob, 'scaleX')
  const setSY = gsap.quickSetter(blob, 'scaleY')
  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const t = { ...pos }

  const move = (e) => {
    t.x = e.clientX
    t.y = e.clientY
    el.classList.add('is-on')
  }
  const over = (e) => {
    const target = e.target.closest?.('a, button, [data-cursor]')
    const text = target?.dataset.cursor || ''
    el.classList.toggle('is-hover', Boolean(text))
    el.classList.toggle('is-link', Boolean(target) && !text)
    label.textContent = text
  }
  const down = () => el.classList.add('is-down')
  const up = () => el.classList.remove('is-down')
  const leave = () => el.classList.remove('is-on')
  const tick = () => {
    const dx = t.x - pos.x
    const dy = t.y - pos.y
    pos.x += dx * 0.2
    pos.y += dy * 0.2
    setX(pos.x)
    setY(pos.y)
    const v = Math.min(Math.hypot(dx, dy) / 140, 0.55)
    setR((Math.atan2(dy, dx) * 180) / Math.PI)
    setSX(1 + v)
    setSY(1 - v * 0.5)
  }

  window.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerover', over)
  window.addEventListener('pointerdown', down)
  window.addEventListener('pointerup', up)
  document.documentElement.addEventListener('pointerleave', leave)
  gsap.ticker.add(tick)
  return () => {
    gsap.ticker.remove(tick)
    window.removeEventListener('pointermove', move)
    document.removeEventListener('pointerover', over)
    window.removeEventListener('pointerdown', down)
    window.removeEventListener('pointerup', up)
    document.documentElement.removeEventListener('pointerleave', leave)
  }
}

export default function App() {
  const root = useRef(null)
  const preRef = useRef(null)
  const menuRef = useRef(null)
  const cursorRef = useRef(null)
  const waterRef = useRef(null)
  const mediaRef = useRef(null)
  const menuWasOpen = useRef(false)
  const [menu, setMenu] = useState(false)
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (reduce) return
    const html = document.documentElement
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const cleanups = []
    let alive = true

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    lenis = new Lenis({ lerp: 0.1 })
    lenis.stop()
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis?.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    if (fine) {
      html.classList.add('has-cursor')
      cleanups.push(initCursor(cursorRef.current))
      const water = initWater(waterRef.current)
      if (water) cleanups.push(water)
      cleanups.push(initMedia(mediaRef.current))
    }

    const ctx = gsap.context(() => {}, root.current)
    let heroChars = []

    // Everything that needs final font metrics: splits, scroll scenes, the hero's hidden start state.
    const build = () => ctx.add(() => {
      heroChars = SplitText.create('.hero-name .l1, .hero-name .l2', { type: 'words,chars', mask: 'chars', aria: 'none' }).chars
      gsap.set(heroChars, { yPercent: 115 })
      gsap.set('[data-intro]', { autoAlpha: 0, y: 24 })
      gsap.set('.hero-portrait', { clipPath: 'inset(100% 0% 0% 0%)' })

      gsap.utils.toArray('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', autoSplit: true,
          onSplit: (s) => gsap.from(s.lines, {
            yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }),
        })
      })

      gsap.utils.toArray('[data-chars]').forEach((el) => {
        const s = SplitText.create(el, { type: 'words,chars', mask: 'chars' })
        gsap.from(s.chars, {
          yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.022,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })

      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
          .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' })
          .from(el.querySelector('img'), { scale: 1.3, duration: 1.6, ease: 'expo.out' }, 0.2)
      })

      gsap.utils.toArray('[data-count]').forEach((el) => {
        const o = { v: 0 }
        el.textContent = '0'
        gsap.to(o, {
          v: Number(el.dataset.count), duration: 1.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => { el.textContent = Math.round(o.v) },
        })
      })

      // Cinematic hero exit: the name parts, the portrait sinks, the red shade floods.
      gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
        .to('.hero-name .l1', { xPercent: -16, ease: 'none' }, 0)
        .to('.hero-name .l2', { xPercent: 16, ease: 'none' }, 0)
        .to('.hero-portrait', { scale: 0.86, yPercent: 12, ease: 'none' }, 0)
        .to('.hero-shade', { opacity: 1, ease: 'none' }, 0)

      gsap.to('.marquee-track', {
        xPercent: -18, ease: 'none',
        scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true },
      })

      gsap.fromTo('.tear-bg', { scaleY: 0.25 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.break', start: 'top bottom', end: 'center center', scrub: true },
      })

      // Work cards stack: each card sinks back as the next one slides over it.
      const cards = gsap.utils.toArray('.app-inner')
      const step = () => cards[0].parentElement.offsetHeight + window.innerHeight * 0.04
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return
        gsap.to(card, {
          scale: 0.9, opacity: 0.3, ease: 'none',
          scrollTrigger: {
            trigger: '.apps',
            start: () => `top+=${(i + 1) * step()} bottom`,
            end: () => `top+=${(i + 1) * step()} 12%`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
      })

      const words = SplitText.create('.banner-text', { type: 'words' })
      gsap.fromTo(words.words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: '.banner', start: 'top 75%', end: 'bottom 60%', scrub: true },
      })

      gsap.to('.ring-scroll', {
        rotation: 240, ease: 'none',
        scrollTrigger: { trigger: '.awards', start: 'top bottom', end: 'bottom top', scrub: true },
      })

      const foot = SplitText.create('.foot-name', { type: 'words,chars', mask: 'chars', aria: 'none' })
      gsap.from(foot.chars, {
        yPercent: 105, stagger: 0.04, ease: 'none',
        scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true },
      })

      if (fine) {
        gsap.utils.toArray('[data-magnetic]').forEach((el) => {
          const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
          const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
          const m = (e) => {
            const r = el.getBoundingClientRect()
            xTo((e.clientX - r.left - r.width / 2) * 0.35)
            yTo((e.clientY - r.top - r.height / 2) * 0.35)
          }
          const l = () => { xTo(0); yTo(0) }
          el.addEventListener('pointermove', m)
          el.addEventListener('pointerleave', l)
          cleanups.push(() => {
            el.removeEventListener('pointermove', m)
            el.removeEventListener('pointerleave', l)
          })
        })
      }
    })

    // Preloader: the counter tracks fonts and the portrait, then waits for a click, like the reference.
    const pre = preRef.current
    const count = pre.querySelector('.pre-count')
    const c = { v: 0 }
    const render = () => { count.textContent = String(Math.round(c.v)).padStart(3, '0') }
    let canEnter = false
    let entered = false
    ctx.add(() => gsap.to(c, { v: 80, duration: 1.4, ease: 'power2.inOut', onUpdate: render }))

    const fonts = document.fonts ? document.fonts.ready : Promise.resolve()
    const portrait = new Promise((res) => {
      const i = new Image()
      i.onload = res
      i.onerror = res
      i.src = me.portrait
    })
    const minTime = new Promise((res) => setTimeout(res, 1400))
    Promise.all([fonts, portrait, minTime]).then(() => {
      if (!alive) return
      build()
      ctx.add(() => gsap.timeline()
        .to(c, { v: 100, duration: 0.5, ease: 'power2.out', onUpdate: render })
        .to('.pre-enter', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' })
        .add(() => {
          canEnter = true
          pre.querySelector('button').focus({ preventScroll: true })
        }))
    })

    const enter = () => {
      if (!canEnter || entered) return
      entered = true
      ctx.add(() => gsap.timeline({ onComplete: () => { pre.style.display = 'none' } })
        .to('.pre-inner', { yPercent: -40, autoAlpha: 0, duration: 0.6, ease: 'power3.in' })
        .to('.pre', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
        .to('.pre-red', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.95')
        .to(heroChars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.035 }, '-=0.6')
        .to('.hero-portrait', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, '<-0.3')
        .to('[data-intro]', { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06 }, '-=0.9')
        .add(() => {
          gsap.set('.pre-red', { display: 'none' })
          lenis?.start()
          ScrollTrigger.refresh()
        }, '-=0.8'))
    }
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!canEnter || entered) return
        e.preventDefault()
        enter()
      }
    }
    pre.addEventListener('click', enter)
    window.addEventListener('keydown', onKey)

    return () => {
      alive = false
      pre.removeEventListener('click', enter)
      window.removeEventListener('keydown', onKey)
      ctx.revert()
      cleanups.forEach((f) => f())
      gsap.ticker.remove(raf)
      lenis?.destroy()
      lenis = null
      html.classList.remove('has-cursor')
    }
  }, [reduce])

  useEffect(() => {
    if (!menu) {
      if (menuWasOpen.current) lenis?.start()
      return
    }
    menuWasOpen.current = true
    lenis?.stop()
    menuRef.current.querySelector('a')?.focus({ preventScroll: true })
    const key = (e) => { if (e.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [menu])

  const menuGo = (e, id) => {
    setMenu(false)
    lenis?.start()
    go(e, id)
  }

  return (
    <div ref={root}>
      <a className="skip" href="#main">Skip to content</a>

      {!reduce && (
        <>
          <div className="pre-red" aria-hidden="true" />
          <div className="pre" ref={preRef}>
            <div className="pre-top label" aria-hidden="true">
              <span>{me.name}</span>
              <span>{me.city}</span>
            </div>
            <div className="pre-inner">
              <p className="pre-count" aria-hidden="true">000</p>
              <button className="pre-enter" type="button">
                <i aria-hidden="true" /> Click anywhere to switch it on
              </button>
            </div>
          </div>
        </>
      )}

      <header className={`top${menu ? ' is-menu' : ''}`}>
        <a href="#home" className="logo" onClick={(e) => go(e, 'home')} aria-label="Krishna Raju S, back to top">
          KRS
        </a>
        <p className="top-status"><i aria-hidden="true" /> Online, {me.city}</p>
        <button
          className="menu-btn"
          type="button"
          aria-expanded={menu}
          aria-controls="menu"
          onClick={() => setMenu((v) => !v)}
        >
          <Roll>{menu ? 'Close' : 'Menu'}</Roll>
          <Plus />
        </button>
      </header>

      <div id="menu" className={`menu${menu ? ' is-open' : ''}`} ref={menuRef} inert={!menu} aria-label="Menu">
        <p className="menu-name label">{me.name}</p>
        <nav aria-label="Sections">
          <ul>
            {nav.map(([id, label], i) => (
              <li key={id} style={{ '--i': i }}>
                <a href={`#${id}`} onClick={(e) => menuGo(e, id)}>
                  <Plus />
                  <Roll>{label}</Roll>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="menu-social label">
          <Socials />
        </ul>
        <p className="menu-words">Test bay. Code. Production.</p>
      </div>

      <main id="main">
        <section className="hero" id="home">
          <ul className="hero-nav" data-intro>
            {nav.slice(1).map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={(e) => go(e, id)}>
                  <Plus />
                  <Roll>{label}</Roll>
                </a>
              </li>
            ))}
          </ul>

          <div className="hero-portrait">
            <img src={me.portrait} alt="Portrait of Krishna Raju S" fetchPriority="high" />
            <div className="hero-shade" aria-hidden="true" />
            <span className="badge" data-intro><i aria-hidden="true" /> Online</span>
          </div>

          <h1 className="hero-name" aria-label={me.name}>
            <span className="l1" aria-hidden="true">Krishna</span>
            <span className="l2" aria-hidden="true">Raju S</span>
          </h1>

          <div className="hero-meta">
            <p className="hero-role" data-intro>{me.role}</p>
            <p className="hero-line" data-intro>{me.lines[0]}</p>
          </div>

          <div className="hero-foot">
            <div data-intro>
              <span className="label">My e-mail</span>
              <a href={mail} data-cursor="Write">{me.email}</a>
            </div>
            <div data-intro>
              <span className="label">Social</span>
              <ul className="inline-links"><Socials /></ul>
            </div>
          </div>
        </section>

        <section className="about" id="about" aria-labelledby="about-title">
          <h2 id="about-title" className="display" data-chars>161 kV by day.<br />Nine apps by night.</h2>
          <div className="about-grid">
            <div className="about-meta">
              <p className="label">{me.field}</p>
              <p className="label">{me.city}</p>
            </div>
            <p className="about-text" data-split>{experience[experience.length - 1].text}</p>
          </div>
          <p className="sr-only">{me.lines[3]}</p>
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              <div className="marquee-inner">
                {[0, 1, 2, 3, 4, 5].map((i) => <span key={i}>{me.lines[3]}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="stats" aria-label="Numbers">
          <ul>
            {numbers.map((n) => (
              <li key={n.unit}>
                <p className="stat-v"><span data-count={n.value}>{n.value}</span><small>{n.unit}</small></p>
                <p className="stat-l">{n.label}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="toolkit" aria-labelledby="toolkit-title">
          <h2 id="toolkit-title" className="giant" data-chars>Toolkit</h2>
          <div className="tk-grid">
            {Object.entries(skills).map(([group, list]) => (
              <div key={group}>
                <h3 className="label">{group}</h3>
                <ul className="tags">
                  {list.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="break" aria-labelledby="break-title">
          <div className="tear-bg" aria-hidden="true" />
          <h2 id="break-title" data-split>The team sized every project by hand in Excel.</h2>
          <p data-split>So I co-built a tool that does it in one click.</p>
        </section>

        {field.map((f) => (
          <section className="field" key={f.id} aria-labelledby={`field-${f.id}`}>
            <div className="field-head">
              <p className="label">Gallery, {f.when}</p>
              <h2 id={`field-${f.id}`} className="display" data-chars>{f.title}</h2>
            </div>
            <p className="field-text" data-split>{f.text}</p>
            <div className="field-photos">
              {f.photos.map((p) => (
                <figure key={p.src}>
                  <Photo src={p.src} alt={p.alt} />
                  <figcaption className="label">{p.caption}</figcaption>
                </figure>
              ))}
            </div>
            <Ext href={f.link.url} className="btn" data-magnetic data-cursor="Open">
              <Roll>{f.link.label}</Roll>
            </Ext>
          </section>
        ))}

        <section className="work" id="work" aria-labelledby="work-title">
          <div className="sec-head">
            <span className="idx">01</span>
            <h2 id="work-title" className="display" data-chars>My work</h2>
            <p>Nine apps in production at Indo Tech Transformers. Scroll down for more.</p>
          </div>
          <ol className="apps">
            {apps.map((a, i) => {
              const body = (
                <>
                  <span className="app-n" aria-hidden="true">{pad(i + 1)}</span>
                  <span className="label app-top">{pad(i + 1)} / {pad(apps.length)}</span>
                  <h3 className="app-name">{a.name}</h3>
                  <p className="app-pitch">{a.pitch}</p>
                  <span className="app-meta label">{a.url ? `Open ${host(a.url)}` : 'No public link'}</span>
                </>
              )
              return (
                <li className="app" key={a.name}>
                  {a.url
                    ? <Ext href={a.url} className="app-inner is-link" data-cursor="Open">{body}</Ext>
                    : <div className="app-inner">{body}</div>}
                </li>
              )
            })}
          </ol>

          <div className="side">
            <h3 className="label">Now building</h3>
            <ul>
              {building.map((b) => (
                <li key={b.name}>
                  <div className="side-row">
                    <span className="side-name">{b.name}</span>
                    <span className="side-pitch">{b.pitch} {b.status}.</span>
                    <span className="side-arrow" aria-hidden="true" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="side">
            <h3 className="label">Side projects</h3>
            <ul>
              {sideProjects.map((s) => {
                const row = (
                  <>
                    <span className="side-name">{s.name}</span>
                    <span className="side-pitch">{s.pitch}</span>
                    <span className="side-arrow" aria-hidden="true">{s.url ? '↗' : ''}</span>
                  </>
                )
                return (
                  <li key={s.name}>
                    {s.url
                      ? <Ext href={s.url} className="side-row" data-cursor="Open">{row}</Ext>
                      : <div className="side-row">{row}</div>}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="ai" id="ai" aria-labelledby="ai-title">
          <div className="sec-head">
            <span className="idx">02</span>
            <h2 id="ai-title" className="display" data-chars>AI work</h2>
          </div>
          <div className="ai-grid">
            <article className="ai-card ai-agent">
              <h3>{ai.agent.name}</h3>
              <p>{ai.agent.pitch}</p>
              <ol className="versions">
                {ai.agent.versions.map((v, i) => (
                  <li key={v}><span>v{i + 1}</span>{v}</li>
                ))}
              </ol>
            </article>
            <article className="ai-card">
              <h3>{ai.rag.name}</h3>
              <p>{ai.rag.pitch}</p>
              <ol className="steps">
                {ai.rag.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </article>
            <article className="ai-card">
              <h3>{ai.browser.name}</h3>
              <p>{ai.browser.pitch}</p>
            </article>
          </div>
          <ul className="tags ai-stack">
            {ai.stack.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>

        <section className="banner" aria-label="Statement">
          <p className="banner-text">{me.lines[1]}</p>
        </section>

        <section className="journey" id="journey" aria-labelledby="journey-title">
          <div className="sec-head">
            <span className="idx">03</span>
            <h2 id="journey-title" className="display" data-chars>Journey</h2>
            <p>Five stops, oldest first.</p>
          </div>
          <ol className="entries">
            {experience.map((x) => (
              <li className="entry" key={x.id}>
                <p className="entry-year">{x.year}</p>
                <div className="entry-body">
                  <h3>{x.company}</h3>
                  <p className="label">{x.role}, {x.place}</p>
                  <p className="entry-short">{x.short}</p>
                  <p className="entry-text">{x.text}</p>
                </div>
                {x.photo && <Photo src={x.photo} alt={x.photoAlt} className="entry-photo" />}
              </li>
            ))}
          </ol>
        </section>

        <section className="awards" id="awards" aria-labelledby="awards-title">
          <div className="awards-head">
            <div className="ring" aria-hidden="true">
              <div className="ring-scroll">
                <svg className="ring-spin" viewBox="0 0 200 200">
                  <defs>
                    <path id="ring-path" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
                  </defs>
                  <text>
                    <textPath href="#ring-path">RANK 7 OF 1500+ COLLEGES • PATENT PUBLISHED • RUNNER-UP, FISH TANK •</textPath>
                  </text>
                </svg>
              </div>
              <span className="ring-core">7</span>
            </div>
            <div>
              <h2 id="awards-title" className="display" data-chars>Awards &amp; recognitions</h2>
              <p className="awards-intro">From a national symposium to the IIT Bombay E-Summit, 2024 to 2026.</p>
            </div>
          </div>

          <ul className="award-list">
            {awards.map((a) => (
              <li className="award" key={a.title}>
                <span className="award-year">{a.year}</span>
                <h3>{a.title}</h3>
                <p>{a.detail}</p>
                {a.photo && <Photo src={a.photo} alt={a.photoAlt} className="award-photo" />}
              </li>
            ))}
          </ul>

          <div className="lead">
            <div className="lead-text">
              <p className="label">Leadership</p>
              <h3>{leadership.title}</h3>
              <p>{leadership.text}</p>
            </div>
            <div className="lead-photos">
              {leadership.photos.map((p) => <Photo key={p.src} src={p.src} alt={p.alt} />)}
            </div>
          </div>

          <div className="certs">
            <h3 className="label">Education and certifications</h3>
            <ul>
              {certifications.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <p className="label">Contact</p>
          <h2 id="contact-title" className="contact-title" data-chars>{me.lines[2]}</h2>
          <a href={mail} className="cta" data-magnetic data-cursor="Write">
            <span>Send it over</span>
          </a>
          <ul className="contact-links">
            <li><span className="label">E-mail</span><a href={mail}><Roll>{me.email}</Roll></a></li>
            <li><span className="label">LinkedIn</span><Ext href={me.linkedin}><Roll>krishnarajus2004</Roll></Ext></li>
            <li><span className="label">GitHub</span><Ext href={me.github}><Roll>KRISH-exe-29</Roll></Ext></li>
            <li><span className="label">Résumé</span><Ext href={me.resume}><Roll>Download PDF</Roll></Ext></li>
          </ul>
        </section>
      </main>

      <footer className="foot">
        <p className="foot-name" aria-hidden="true">Krishna Raju S</p>
        <div className="foot-bar label">
          <span>{me.city}</span>
          <span>© {new Date().getFullYear()} {me.name}</span>
          <a href="#home" onClick={(e) => go(e, 'home')}><Roll>Back to top</Roll></a>
        </div>
      </footer>

      <canvas className="fx-canvas" ref={mediaRef} aria-hidden="true" />
      <canvas className="water" ref={waterRef} aria-hidden="true" />
      <div className="cursor" ref={cursorRef} aria-hidden="true">
        <div className="cursor-size"><div className="cursor-blob" /></div>
        <span className="cursor-label" />
      </div>
    </div>
  )
}

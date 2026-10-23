import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import {
  me, numbers, experience, sideProjects, ai, awards, leadership, field, certifications, skills,
} from './content.js'
import { reducedMotion, finePointer } from './lens.js'
import { Roll, Pill, Photo, useMagnet } from './ui.jsx'
import Bench from './Bench.jsx'
import Preloader from './Preloader.jsx'
import WaterCursor from './WaterCursor.jsx'

gsap.registerPlugin(ScrollTrigger, SplitText)

const links = [
  { href: '#work', label: 'Work' },
  { href: '#ai', label: 'AI' },
  { href: '#record', label: 'Record' },
  { href: '#honours', label: 'Honours' },
  { href: '#contact', label: 'Contact' },
]

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className={'top' + (open ? ' is-open' : '')}>
      <a href="#top" className="brand" data-cursor="Top">
        <span className="brand-mark" aria-hidden="true">KR</span>
        <span className="brand-name">
          {me.name} <em>atelier</em>
        </span>
      </a>
      <nav id="nav" className="nav" aria-label="Primary">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)}>
                <Roll text={l.label} />
              </a>
            </li>
          ))}
        </ul>
        <Pill href={me.resume} cursor="Read">Resume</Pill>
      </nav>
      <button
        type="button"
        className="menu-btn"
        aria-expanded={open}
        aria-controls="nav"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top" aria-label="Introduction">
      <div className="hero-meta mono" data-intro>
        <span>{me.field}</span>
        <span>{me.city}</span>
      </div>
      <h1 className="hero-name">
        <span className="hero-line">Krishna</span>{' '}
        <span className="hero-line hero-line--b">Raju S</span>
      </h1>
      <div className="hero-grid">
        <p className="hero-role" data-intro>{me.role}.</p>
        <p className="hero-quote" data-intro>{me.lines[0]}</p>
        <Photo className="hero-portrait" src={me.portrait} alt="Portrait of Krishna Raju S" eager />
        <a href="#work" className="hero-cue mono" data-intro data-cursor="Go">
          <Roll text="Down to the bench" />
          <span aria-hidden="true"> ↓</span>
        </a>
      </div>
      <svg className="stamp" viewBox="0 0 200 200" role="img" aria-label={me.lines[3]}>
        <defs>
          <path id="stamp-path" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
        </defs>
        <circle cx="100" cy="100" r="98" className="stamp-disc" />
        <text>
          <textPath href="#stamp-path" textLength="470">
            {`${me.lines[3]} • ${me.lines[3]} • `}
          </textPath>
        </text>
        <circle cx="100" cy="100" r="9" className="stamp-dot" />
      </svg>
    </section>
  )
}

function Readings() {
  return (
    <section className="readings" aria-labelledby="readings-title">
      <h2 id="readings-title" className="sr-only">In numbers</h2>
      <ul data-rise>
        {numbers.map((n) => (
          <li key={n.label}>
            <span className="reading-value" data-count={n.value}>{n.value}</span>
            <span className="reading-unit mono">{n.unit}</span>
            <span className="reading-label">{n.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Tag({ p, tilt }) {
  const ref = useMagnet(0.18)
  const body = (
    <>
      <span className="tag-hole" aria-hidden="true" />
      <h3>{p.name}</h3>
      <p>{p.pitch}</p>
      <span className="tag-foot mono">{p.url ? 'Open it ↗' : 'No public link'}</span>
    </>
  )
  return (
    <li className="tag" style={{ '--tilt': tilt + 'deg' }}>
      {p.url ? (
        <a ref={ref} className="tag-card" href={p.url} target="_blank" rel="noopener" data-cursor="Open">
          {body}
        </a>
      ) : (
        <div ref={ref} className="tag-card">{body}</div>
      )}
    </li>
  )
}

function Offcuts() {
  const tilts = [-4, 2.5, -1.5]
  return (
    <section id="offcuts" className="offcuts" aria-labelledby="offcuts-title">
      <h2 id="offcuts-title" className="display" data-split>
        Offcuts from the bench
      </h2>
      <p className="section-note">Side projects, built for the fun of it or for a course.</p>
      <ul className="tags" data-rise>
        {sideProjects.map((p, i) => (
          <Tag key={p.name} p={p} tilt={tilts[i % tilts.length]} />
        ))}
      </ul>
    </section>
  )
}

function AI() {
  const stack = ai.stack.map((s) => <span key={s}>{s}</span>)
  return (
    <section id="ai" className="ai dark" data-panel aria-labelledby="ai-title">
      <div className="ai-inner">
        <h2 id="ai-title" className="display" data-split>
          AI on the same bench
        </h2>
        <article className="ai-agent">
          <h3 className="ai-name">{ai.agent.name}</h3>
          <p className="ai-pitch">{ai.agent.pitch}</p>
          <ol className="versions" data-rise>
            {ai.agent.versions.map((v, i) => (
              <li key={v}>
                <span className="mono">v{i + 1}</span>
                <span>{v}</span>
              </li>
            ))}
          </ol>
        </article>
        <div className="ai-pair">
          <article className="ai-rag">
            <h3 className="ai-name">{ai.rag.name}</h3>
            <p className="ai-pitch">{ai.rag.pitch}</p>
            <ol className="pipe" data-rise>
              {ai.rag.steps.map((s) => (
                <li key={s} className="mono">{s}</li>
              ))}
            </ol>
          </article>
          <article className="ai-browser">
            <h3 className="ai-name">{ai.browser.name}</h3>
            <p className="ai-pitch">{ai.browser.pitch}</p>
          </article>
        </div>
      </div>
      <div className="marquee" role="region" aria-label="AI tools">
        <div className="marquee-track">
          <div className="marquee-set">{stack}</div>
          <div className="marquee-set" aria-hidden="true">{stack}</div>
        </div>
      </div>
    </section>
  )
}

function Record() {
  const f = field[0]
  return (
    <section id="record" className="record" aria-labelledby="record-title">
      <h2 id="record-title" className="display" data-split>
        The record, oldest first
      </h2>
      <ol className="ledger">
        {experience.map((e) => (
          <li key={e.id} className={'entry' + (e.photo ? ' has-photo' : '')}>
            <span className="entry-year" aria-hidden="true">{e.year}</span>
            <div className="entry-body">
              <p className="mono entry-place">
                <span className="sr-only">{e.year}, </span>
                {e.place}
              </p>
              <h3 className="entry-role">
                {e.role}
                <span>{e.company}</span>
              </h3>
              <p className="entry-short">{e.short}</p>
              <p className="entry-text">{e.text}</p>
            </div>
            {e.photo && <Photo className="entry-photo" src={e.photo} alt={e.photoAlt} />}
          </li>
        ))}
      </ol>

      <article className="fieldnote" aria-labelledby="field-title">
        <div className="fieldnote-text">
          <p className="mono">{f.when}</p>
          <h3 id="field-title" className="display-s">{f.title}: field notes</h3>
          <p>{f.text}</p>
          <Pill href={f.link.url}>{f.link.label}</Pill>
        </div>
        <div className="fieldnote-photos">
          {f.photos.map((p) => (
            <Photo key={p.src} src={p.src} alt={p.alt} caption={p.caption} />
          ))}
        </div>
      </article>
    </section>
  )
}

function Honours() {
  return (
    <section id="honours" className="honours" aria-labelledby="honours-title">
      <h2 id="honours-title" className="display" data-split>
        Honours and a team built from scratch
      </h2>
      <ol className="awards">
        {awards.map((a) => (
          <li key={a.title} className={'award' + (a.photo ? ' has-photo' : '')}>
            <span className="award-year mono">{a.year}</span>
            <div className="award-body">
              <h3>{a.title}</h3>
              <p>{a.detail}</p>
            </div>
            {a.photo && <Photo className="award-photo" src={a.photo} alt={a.photoAlt} />}
          </li>
        ))}
      </ol>
      <article className="lead" aria-labelledby="lead-title">
        <div className="lead-text">
          <h3 id="lead-title" className="display-s">{leadership.title}</h3>
          <p>{leadership.text}</p>
        </div>
        <div className="lead-photos">
          {leadership.photos.map((p, i) => (
            <Photo key={p.src} className={'lead-photo lead-photo--' + i} src={p.src} alt={p.alt} />
          ))}
        </div>
      </article>
    </section>
  )
}

function Tools() {
  return (
    <section id="tools" className="tools" aria-labelledby="tools-title">
      <h2 id="tools-title" className="display" data-split>
        The tool wall
      </h2>
      <div className="pegboard">
        {Object.entries(skills).map(([group, items]) => (
          <div key={group} className="peg-group">
            <h3 className="mono">{group}</h3>
            <ul data-rise>
              {items.map((s) => (
                <li key={s} className="peg">{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="certs">
        <h3 className="mono">Education and certifications</h3>
        <ul>
          {certifications.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="contact dark" data-panel aria-labelledby="contact-title">
      <h2 id="contact-title" className="display contact-line" data-split>
        {me.lines[2]}
      </h2>
      <a className="contact-mail" href={`mailto:${me.email}`} data-cursor="Write">
        <Roll text={me.email} />
      </a>
      <div className="contact-pills">
        <Pill href={me.linkedin} dark>LinkedIn</Pill>
        <Pill href={me.github} dark>GitHub</Pill>
        <Pill href={me.resume} dark cursor="Read">Resume, PDF</Pill>
      </div>
      <footer className="foot">
        <p>
          {me.name}, {me.city}
        </p>
        <p className="foot-line">{me.lines[1]}</p>
        <a href="#top" className="mono" data-cursor="Up">
          <Roll text="Back to top" />
        </a>
      </footer>
    </section>
  )
}

export default function App() {
  const [motion] = useState(() => !reducedMotion())
  const [cursor] = useState(() => finePointer() && !reducedMotion())
  const [ready, setReady] = useState(() => reducedMotion())
  const lenisRef = useRef(null)
  const onLoaded = useCallback(() => setReady(true), [])

  // Smooth scroll on the GSAP clock.
  useEffect(() => {
    if (!motion) return
    const lenis = new Lenis({ lerp: 0.09, anchors: true })
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
  }, [motion])

  // Intro: the preloader hands over to the hero.
  useEffect(() => {
    if (!ready || !motion) return
    lenisRef.current?.start()
    let split
    const ctx = gsap.context(() => {
      split = SplitText.create('.hero-name', { type: 'words,chars', mask: 'chars' })
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from(split.chars, { yPercent: 115, rotate: 6, duration: 1.3, stagger: 0.035 })
        .fromTo(
          '.hero-portrait .photo-frame',
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
          0.1,
        )
        .from('.hero-portrait img', { scale: 1.35, duration: 1.8 }, 0.1)
        .from('.hero [data-intro]', { y: 26, opacity: 0, duration: 1, stagger: 0.08 }, 0.45)
        .from('.stamp', { scale: 0, rotate: -120, duration: 1.4, ease: 'back.out(1.6)' }, 0.6)
        .from('.top', { yPercent: -130, duration: 1, clearProps: 'transform' }, 0.5)
      gsap.to('.stamp text', { rotate: 360, svgOrigin: '100 100', duration: 30, repeat: -1, ease: 'none' })
      gsap.to('.hero-name', {
        yPercent: -14,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      })
    })
    return () => {
      ctx.revert()
      split?.revert()
    }
  }, [ready, motion])

  // Scroll choreography.
  useEffect(() => {
    if (!ready || !motion) return
    const splits = []
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-split]').forEach((el) => {
        splits.push(
          SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 1.1,
                ease: 'expo.out',
                stagger: 0.08,
                scrollTrigger: { trigger: el, start: 'top 88%', once: true },
              }),
          }),
        )
      })

      gsap.utils
        .toArray('[data-clip]')
        .filter((el) => !el.closest('.hero'))
        .forEach((el) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
          tl.fromTo(
            el,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
          )
          const img = el.querySelector('img')
          if (img) tl.from(img, { scale: 1.35, duration: 1.7, ease: 'expo.out' }, 0)
        })

      gsap.utils.toArray('[data-rise]').forEach((group) => {
        gsap.from(group.children, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.05,
          scrollTrigger: { trigger: group, start: 'top 88%', once: true },
        })
      })

      gsap.utils.toArray('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count)
        const o = { v: 0 }
        el.textContent = '0'
        gsap.to(o, {
          v: end,
          duration: 1.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(o.v))
          },
        })
      })

      gsap.utils.toArray('[data-panel]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(0% 3% 0% 3% round 48px)' },
          {
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 20%', scrub: true },
          },
        )
      })

      gsap.to('.marquee-track', { xPercent: -50, duration: 28, repeat: -1, ease: 'none' })

      const header = document.querySelector('.top')
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const hide = self.direction === 1 && self.scroll() > 240 && !header.classList.contains('is-open')
          header.classList.toggle('is-hidden', hide)
        },
      })
    })
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      ctx.revert()
      splits.forEach((s) => s.revert())
    }
  }, [ready, motion])

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      {motion && <Preloader onDone={onLoaded} />}
      {cursor && <WaterCursor />}
      <div className="frame" aria-hidden="true" />
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Readings />
        <Bench />
        <Offcuts />
        <AI />
        <Record />
        <Honours />
        <Tools />
        <Contact />
      </main>
    </>
  )
}

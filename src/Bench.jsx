import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { apps, building, numbers } from './content.js'
import { Roll, useMagnet } from './ui.jsx'
import { reducedMotion } from './lens.js'

const N = apps.length
const ARC = 270
const STEP = ARC / (N - 1)
const angleOf = (i) => -ARC / 2 + i * STEP
const pad = (n) => String(n).padStart(2, '0')
const linkKind = (url) => (url.includes('github.com') ? 'Source on GitHub' : 'Open the live app')

// The work showcase: a bench monitor with a channel dial. One channel per production app.
export default function Bench() {
  const [ch, setCh] = useState(0)
  const screenRef = useRef(null)
  const staticRef = useRef(null)
  const knobRef = useRef(null)
  const first = useRef(true)
  const prevRef = useMagnet(0.4)
  const nextRef = useMagnet(0.4)
  const app = apps[ch]
  const tune = (d) => setCh((c) => (c + d + N) % N)

  useEffect(() => {
    const instant = reducedMotion()
    gsap.to(knobRef.current, {
      rotate: angleOf(ch),
      duration: instant ? 0 : 0.7,
      ease: 'back.out(2.2)',
      overwrite: true,
    })
    if (first.current) {
      first.current = false
      return
    }
    if (instant) return
    gsap.fromTo(
      screenRef.current,
      { scaleY: 0.02, scaleX: 1.15, opacity: 0.5 },
      { scaleY: 1, scaleX: 1, opacity: 1, duration: 0.5, ease: 'expo.out', overwrite: true },
    )
    gsap.fromTo(staticRef.current, { opacity: 0.9 }, { opacity: 0.08, duration: 0.45, ease: 'power2.out', overwrite: true })
  }, [ch])

  // Drag the knob round to tune.
  useEffect(() => {
    const knob = knobRef.current
    const dial = knob.parentElement
    let dragging = false
    const pick = (e) => {
      const r = dial.getBoundingClientRect()
      const deg =
        (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI
      const clamped = Math.max(-ARC / 2, Math.min(ARC / 2, deg))
      setCh(Math.round((clamped + ARC / 2) / STEP))
    }
    const down = (e) => {
      dragging = true
      knob.setPointerCapture(e.pointerId)
      pick(e)
    }
    const move = (e) => dragging && pick(e)
    const up = () => {
      dragging = false
    }
    knob.addEventListener('pointerdown', down)
    knob.addEventListener('pointermove', move)
    knob.addEventListener('pointerup', up)
    knob.addEventListener('pointercancel', up)
    return () => {
      knob.removeEventListener('pointerdown', down)
      knob.removeEventListener('pointermove', move)
      knob.removeEventListener('pointerup', up)
      knob.removeEventListener('pointercancel', up)
    }
  }, [])

  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      tune(1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      tune(-1)
    }
  }

  return (
    <section id="work" className="work" aria-labelledby="work-title">
      <div className="work-head">
        <h2 id="work-title" className="display" data-split>
          Tune in to the work
        </h2>
        <p className="work-sub">
          <strong>{numbers[0].value} {numbers[0].unit}</strong> {numbers[0].label}. Turn the dial, or
          pick one from the list below.
        </p>
      </div>

      <div className="bench">
        <div className="monitor">
          <div className="monitor-glass">
            <div className="screen" ref={screenRef} aria-live="polite">
              <p className="screen-ch mono">
                CH {pad(ch + 1)} <span>/ {pad(N)}</span>
              </p>
              <h3 className="screen-name">{app.name}</h3>
              <p className="screen-pitch">{app.pitch}</p>
              {app.url ? (
                <a className="screen-link" href={app.url} target="_blank" rel="noopener" data-cursor="Open">
                  <Roll text={linkKind(app.url)} />
                  <span aria-hidden="true"> ↗</span>
                </a>
              ) : (
                <p className="screen-link is-muted mono">No public link</p>
              )}
            </div>
            <div className="screen-static" ref={staticRef} aria-hidden="true" />
            <div className="screen-scan" aria-hidden="true" />
          </div>
          <div className="monitor-plate mono" aria-hidden="true">
            <span>KR bench monitor</span>
            <span className="led" />
          </div>
        </div>

        <div className="controls">
          <div className="dial" role="group" aria-label="Channel dial" onKeyDown={onKey}>
            {apps.map((a, i) => (
              <button
                key={a.name}
                type="button"
                className={'tick' + (i === ch ? ' is-on' : '')}
                style={{ '--a': angleOf(i) + 'deg' }}
                aria-label={`Channel ${i + 1}: ${a.name}`}
                aria-pressed={i === ch}
                data-cursor={pad(i + 1)}
                onClick={() => setCh(i)}
              >
                {i + 1}
              </button>
            ))}
            <div className="knob" ref={knobRef} data-cursor="Turn" aria-hidden="true">
              <span className="knob-notch" />
            </div>
          </div>
          <div className="arrows">
            <button ref={prevRef} type="button" className="circle" onClick={() => tune(-1)} aria-label="Previous channel" data-cursor="Prev">
              <span aria-hidden="true">←</span>
            </button>
            <button ref={nextRef} type="button" className="circle" onClick={() => tune(1)} aria-label="Next channel" data-cursor="Next">
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className="controls-hint mono">Drag the knob, pick a number, or use the arrows.</p>
        </div>
      </div>

      <ol className="index" aria-label="All nine apps">
        {apps.map((a, i) => {
          const inner = (
            <>
              <span className="index-no mono">{pad(i + 1)}</span>
              <span className="index-name">
                <Roll text={a.name} />
              </span>
              <span className="index-pitch">{a.pitch}</span>
              <span className="index-arrow" aria-hidden="true">{a.url ? '↗' : '•'}</span>
            </>
          )
          return (
            <li key={a.name} className={i === ch ? 'is-on' : ''} onPointerEnter={() => setCh(i)}>
              {a.url ? (
                <a href={a.url} target="_blank" rel="noopener" data-cursor="Open" onFocus={() => setCh(i)}>
                  {inner}
                </a>
              ) : (
                <div className="index-row">{inner}</div>
              )}
            </li>
          )
        })}
      </ol>
      <ol className="index" aria-label="Now building">
        {building.map((b) => (
          <li key={b.name}>
            <div className="index-row">
              <span className="index-no mono">WIP</span>
              <span className="index-name">{b.name}</span>
              <span className="index-pitch">{b.pitch} {b.status}.</span>
              <span className="index-arrow" aria-hidden="true">•</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

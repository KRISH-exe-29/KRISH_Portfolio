import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { me } from './content.js'

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })

// Counts real loading (fonts + portrait). Never holds the page longer than ~2.4 s.
export default function Preloader({ onDone }) {
  const rootRef = useRef(null)
  const countRef = useRef(null)
  const barRef = useRef(null)
  const done = useRef(onDone)

  useEffect(() => {
    const root = rootRef.current
    const tasks = [document.fonts ? document.fonts.ready : Promise.resolve(), loadImage(me.portrait)]
    let finished = 0
    tasks.forEach((p) => p.then(() => finished++))
    const giveUp = performance.now() + 2000
    const shown = { v: 0 }
    let exiting = false
    let tl = null

    const exit = () => {
      exiting = true
      tl = gsap.timeline()
      tl.to(root.querySelectorAll('.pre-rise'), { yPercent: -110, duration: 0.6, ease: 'expo.in', stagger: 0.05 })
        .add(() => done.current(), '-=0.1')
        .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.15')
        .set(root, { display: 'none' })
    }

    const tick = (time, deltaMs) => {
      if (exiting) return
      const goal = performance.now() > giveUp ? 1 : finished / tasks.length
      shown.v += (goal - shown.v) * (1 - Math.exp(-(deltaMs / 1000) * 6)) + 0.002
      shown.v = Math.min(shown.v, goal)
      countRef.current.textContent = String(Math.round(shown.v * 100)).padStart(3, '0')
      gsap.set(barRef.current, { scaleX: shown.v })
      if (goal === 1 && shown.v > 0.995) exit()
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      tl?.kill()
    }
  }, [])

  return (
    <div ref={rootRef} className="pre" aria-hidden="true">
      <div className="pre-mid">
        <div className="pre-mask">
          <p className="pre-mark pre-rise">
            KR<em>atelier</em>
          </p>
        </div>
        <div className="pre-mask">
          <p className="pre-sub mono pre-rise">Opening the workshop, {me.city}</p>
        </div>
      </div>
      <div className="pre-foot mono">
        <div className="pre-mask">
          <span ref={countRef} className="pre-count pre-rise">000</span>
        </div>
        <div className="pre-ruler">
          <span ref={barRef} className="pre-bar" />
        </div>
      </div>
    </div>
  )
}

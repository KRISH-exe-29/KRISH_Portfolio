import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { F_MAX, F_MIN, PHASES, fOf, onSweep, response, xOf } from '../sweep.js'
import { calm } from '../motion.js'

const DB_FLOOR = -95
const GRID_DB = [-20, -40, -60, -80]
const DECADES = [20, 200, 2e3, 2e4, 2e5, 2e6]

// The fixed plot behind the page: three phase responses on a log frequency axis.
// The dim curves are the reference fingerprint; the bright part is what the sweep has reached.
export default function Trace() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const intro = { x: calm ? 1 : 0 } // how much of the reference has been drawn, left to right
    let w = 0
    let h = 0
    let f = F_MIN
    let curves = []

    const yOf = (db) => h * (0.2 + 0.62 * (db / DB_FLOOR))

    function measure() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      curves = PHASES.map((_, phase) => {
        const ys = new Float32Array(Math.max(2, Math.ceil(w / 2) + 1))
        for (let i = 0; i < ys.length; i++) ys[i] = yOf(response(phase, fOf(i / (ys.length - 1))))
        return ys
      })
      draw()
    }

    function path(ys, upTo) {
      const n = Math.max(1, Math.floor(upTo * (ys.length - 1)))
      ctx.beginPath()
      ctx.moveTo(0, ys[0])
      for (let i = 1; i <= n; i++) ctx.lineTo((i / (ys.length - 1)) * w, ys[i])
      ctx.stroke()
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(236, 232, 223, 0.07)'
      ctx.fillStyle = 'rgba(138, 141, 145, 0.7)'
      ctx.font = "11px 'Spline Sans Mono', monospace"
      ctx.beginPath()
      for (const d of DECADES) {
        const x = Math.round(xOf(d) * (w - 1)) + 0.5
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
      }
      for (const db of GRID_DB) {
        const y = Math.round(yOf(db)) + 0.5
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
      }
      ctx.stroke()
      if (w > 700) for (const db of GRID_DB) ctx.fillText(`${db} dB`, 6, yOf(db) - 6)

      const reached = xOf(f)
      curves.forEach((ys, phase) => {
        ctx.strokeStyle = PHASES[phase].color
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1.25
        path(ys, intro.x)
        if (reached > 0.002) {
          ctx.globalAlpha = 1
          ctx.lineWidth = 1.75
          path(ys, Math.min(reached, intro.x))
        }
      })
      ctx.globalAlpha = 1

      if (f <= F_MIN) return // the sweep has not started: no marker yet
      // The marker: where the sweep is now, with the centre phase's magnitude.
      const x = reached * w
      ctx.strokeStyle = 'rgba(236, 232, 223, 0.45)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.round(x) + 0.5, 0)
      ctx.lineTo(Math.round(x) + 0.5, h)
      ctx.stroke()
      PHASES.forEach((p, phase) => {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(x, yOf(response(phase, f)), 3.5, 0, Math.PI * 2)
        ctx.fill()
      })
      const db = response(1, f)
      const label = `${db.toFixed(1)} dB`
      ctx.fillStyle = '#ece8df'
      ctx.textAlign = x > w - 90 ? 'right' : 'left'
      ctx.fillText(label, x + (x > w - 90 ? -10 : 10), Math.max(16, yOf(db) - 14))
      ctx.textAlign = 'left'
    }

    const stop = onSweep((next) => {
      f = Math.min(next, F_MAX)
      draw()
    })
    // Between the hero and the last screen the plot steps back so text stays readable over it.
    const dim = () => {
      const y = window.scrollY
      const end = document.documentElement.scrollHeight - window.innerHeight * 1.5
      canvas.classList.toggle('back', y > window.innerHeight * 0.55 && y < end)
    }
    window.addEventListener('scroll', dim, { passive: true })
    window.addEventListener('resize', measure)
    measure()
    dim()
    document.fonts?.ready.then(draw)
    const sweepIn = calm ? null : animate(intro, { x: 1, duration: 2400, delay: 300, ease: 'inOut(3)', onUpdate: draw })

    return () => {
      stop()
      sweepIn?.revert()
      window.removeEventListener('scroll', dim)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return <canvas ref={ref} className="trace" aria-hidden="true" />
}

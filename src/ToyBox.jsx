import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { reduceMotion } from './motion.js'

const BOUNCE = 0.45
const clampV = (v) => Math.max(-40, Math.min(40, v))

// A box of things you can drag and throw. Children with class "toy" start in normal flow
// (that is the reduced-motion and touch-free layout), then become bodies in a tiny
// box-vs-box physics sim that runs on the GSAP ticker only while awake and on screen.
// ponytail: axis-aligned boxes, no true rotation in collisions; plenty for stickers.
export default function ToyBox({ id, className = '', children, active = true, gravity = 0.55, drop = false, air = 0.995 }) {
  const ref = useRef(null)

  useEffect(() => {
    const root = ref.current
    if (!root || !active || reduceMotion) return
    root.style.height = `${root.offsetHeight}px`
    const els = [...root.children].filter((el) => el.classList.contains('toy'))
    const bodies = els.map((el, i) => ({
      el,
      x: el.offsetLeft,
      y: drop ? -el.offsetHeight - 60 - i * 36 - Math.random() * 160 : el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
      vx: (Math.random() - 0.5) * (gravity ? 3 : 6),
      vy: gravity ? 0 : (Math.random() - 0.5) * 6,
      rot: 0,
      base: parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0,
      px: 0,
      py: 0,
      drag: false,
    }))
    root.classList.add('is-live')
    const box = { w: root.clientWidth, h: root.clientHeight }
    const render = (b) => {
      b.el.style.transform = `translate3d(${b.x}px,${b.y}px,0) rotate(${b.base + b.rot}deg)`
    }
    bodies.forEach(render)

    const walls = (b) => {
      if (b.x < 0) {
        b.x = 0
        b.vx = Math.abs(b.vx) * BOUNCE
      } else if (b.x + b.w > box.w) {
        b.x = Math.max(0, box.w - b.w)
        b.vx = -Math.abs(b.vx) * BOUNCE
      }
      if (b.y + b.h > box.h) {
        b.y = box.h - b.h
        b.vy = Math.abs(b.vy) < 1.2 ? 0 : -Math.abs(b.vy) * BOUNCE
        b.vx *= 0.92
      } else if (b.y < 0 && (b.vy < 0 || !gravity || b.drag)) {
        b.y = 0
        b.vy = Math.abs(b.vy) * BOUNCE
      }
    }

    const collide = (a, b) => {
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      if (ox <= 0 || oy <= 0) return
      const ma = a.drag ? 0 : 1
      const mb = b.drag ? 0 : 1
      const sum = ma + mb
      if (!sum) return
      const axis = ox < oy ? 'x' : 'y'
      const v = axis === 'x' ? 'vx' : 'vy'
      const o = axis === 'x' ? ox : oy
      const dim = axis === 'x' ? 'w' : 'h'
      const s = a[axis] + a[dim] / 2 < b[axis] + b[dim] / 2 ? -1 : 1
      a[axis] += (s * o * ma) / sum
      b[axis] -= (s * o * mb) / sum
      if (a.drag) b[v] = a[v]
      else if (b.drag) a[v] = b[v]
      else {
        const t = a[v]
        a[v] = b[v] * 0.8
        b[v] = t * 0.8
      }
    }

    let running = false
    let visible = false
    let still = 0
    let drag = null
    let dragged = false
    let z = 10

    const step = (_t, dt) => {
      const k = Math.min(dt / 16.667, 2)
      const fr = Math.pow(air, k)
      for (const b of bodies) {
        b.px = b.x
        b.py = b.y
        if (b.drag) continue
        b.vy += gravity * k
        b.vx *= fr
        b.vy *= fr
        b.x += b.vx * k
        b.y += b.vy * k
      }
      for (let it = 0; it < 3; it++) {
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) collide(bodies[i], bodies[j])
        }
      }
      let moved = 0
      for (const b of bodies) {
        walls(b)
        b.rot += (Math.max(-14, Math.min(14, b.vx * 1.2)) - b.rot) * 0.12 * k
        moved += Math.abs(b.x - b.px) + Math.abs(b.y - b.py) + Math.abs(b.rot) * 0.02
        render(b)
      }
      still = !drag && moved < 0.06 * bodies.length ? still + 1 : 0
      if (still > 45) stop()
    }
    const start = () => {
      still = 0
      if (!running && visible) {
        running = true
        gsap.ticker.add(step)
      }
    }
    const stop = () => {
      if (!running) return
      running = false
      gsap.ticker.remove(step)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(root)

    const local = (e) => {
      const r = root.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const find = (e) => {
      const el = e.target instanceof Element ? e.target.closest('.toy') : null
      return el ? bodies.find((b) => b.el === el) : null
    }
    const down = (e) => {
      if (e.button !== 0) return
      const b = find(e)
      if (!b) return
      const [x, y] = local(e)
      drag = { b, ox: x - b.x, oy: y - b.y, sx: e.clientX, sy: e.clientY, t: performance.now() }
      dragged = false
      b.drag = true
      b.vx = 0
      b.vy = 0
      b.el.style.zIndex = ++z
      b.el.classList.add('is-held')
      b.el.setPointerCapture?.(e.pointerId)
      e.preventDefault()
      start()
    }
    const move = (e) => {
      if (!drag) return
      const [x, y] = local(e)
      const b = drag.b
      const nx = x - drag.ox
      const ny = y - drag.oy
      b.vx = clampV(nx - b.x)
      b.vy = clampV(ny - b.y)
      b.x = nx
      b.y = ny
      drag.t = performance.now()
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) dragged = true
      start()
    }
    const up = () => {
      if (!drag) return
      const b = drag.b
      if (performance.now() - drag.t > 90) {
        b.vx = 0
        b.vy = 0
      }
      b.drag = false
      b.el.classList.remove('is-held')
      drag = null
      start()
    }
    const kick = (b, power) => {
      b.vx += (Math.random() - 0.5) * power
      b.vy += gravity ? -(power * 0.6 + Math.random() * power * 0.4) : (Math.random() - 0.5) * power
    }
    const click = (e) => {
      const b = find(e)
      if (!b) return
      if (dragged) {
        dragged = false
        return
      }
      kick(b, 18)
      start()
    }
    const shake = () => {
      bodies.forEach((b) => kick(b, 26))
      start()
    }
    const resize = () => {
      box.w = root.clientWidth
      box.h = root.clientHeight
      start()
    }

    root.addEventListener('pointerdown', down)
    root.addEventListener('click', click)
    root.addEventListener('shake', shake)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('resize', resize)

    return () => {
      stop()
      io.disconnect()
      root.removeEventListener('pointerdown', down)
      root.removeEventListener('click', click)
      root.removeEventListener('shake', shake)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('resize', resize)
      root.classList.remove('is-live')
      root.style.height = ''
      els.forEach((el) => {
        el.style.transform = ''
        el.style.zIndex = ''
      })
    }
  }, [active, gravity, drop, air])

  return (
    <div ref={ref} id={id} className={`toybox ${className}`}>
      {children}
    </div>
  )
}

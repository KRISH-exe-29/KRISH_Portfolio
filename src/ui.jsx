import { createContext, useContext, useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, SplitText, reduced, finePointer, pointer } from './motion.js'

export const GLContext = createContext(null)

// A photo or cover. With WebGL the image is drawn by the stage as a liquid plane
// and the <img> stays in the DOM (for layout, alt text and crawlers) but goes transparent.
export function Media({ src, glSrc, alt = '', className = '', reveal = true }) {
  const stage = useContext(GLContext)
  const box = useRef(null)
  useEffect(() => {
    const el = box.current
    const img = el?.querySelector('img')
    if (!el || !img) return
    const state = { v: reveal && !reduced ? 0 : 1 }
    let handle = null
    const apply = () => {
      if (handle) handle.uniforms.uReveal.value = state.v
      img.style.clipPath = state.v >= 1 ? '' : `inset(0 0 ${(1 - state.v) * 100}% 0)`
    }
    if (stage) handle = stage.add(el, glSrc || src, () => el.classList.add('is-gl'))
    apply()
    let st = null
    if (state.v < 1) {
      st = ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () => gsap.to(state, { v: 1, duration: 1.8, ease: 'reelOut', onUpdate: apply }),
      })
    }
    return () => {
      st?.kill()
      gsap.killTweensOf(state)
      handle?.remove()
      el.classList.remove('is-gl')
      img.style.clipPath = ''
    }
  }, [stage, src, glSrc, reveal])
  return (
    <div ref={box} className={`media ${className}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  )
}

// Text that rolls letter by letter on hover of the nearest link or button.
export function Roll({ children }) {
  const text = String(children)
  return (
    <span className="roll">
      <span className="sr">{text}</span>
      <span className="roll__in" aria-hidden="true">
        {[...text].map((c, i) => {
          const ch = c === ' ' ? ' ' : c
          return (
            <span key={i} style={{ '--i': i }} data-c={ch}>
              {ch}
            </span>
          )
        })}
      </span>
    </span>
  )
}

// Wrapper that pulls its child toward the pointer.
export function Magnetic({ children, strength = 0.35 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced || !finePointer) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.45)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.45)' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      gsap.killTweensOf(el)
    }
  }, [strength])
  return (
    <span ref={ref} className="magnet">
      {children}
    </span>
  )
}

// Scroll reveals for one view. Re-run whenever the view changes.
export function usePageMotion(root, active, key) {
  useEffect(() => {
    const el = root.current
    if (!el || !active || reduced) return
    const ctx = gsap.context(() => {
      // view titles rise letter by letter as the curtain lifts off them
      el.querySelectorAll('[data-title]').forEach((node) => {
        const split = SplitText.create(node, { type: 'words,chars', mask: 'chars' })
        gsap.from(split.chars, { yPercent: 115, duration: 1.3, stagger: 0.025, delay: 0.55 })
      })
      el.querySelectorAll('[data-split]').forEach((node) => {
        SplitText.create(node, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.2,
              stagger: 0.08,
              scrollTrigger: { trigger: node, start: 'top 88%', once: true },
            }),
        })
      })
      el.querySelectorAll('[data-fade]').forEach((node) => {
        gsap.from(node, {
          y: 40,
          autoAlpha: 0,
          duration: 1.2,
          scrollTrigger: { trigger: node, start: 'top 90%', once: true },
        })
      })
      el.querySelectorAll('[data-stagger]').forEach((node) => {
        gsap.from(node.children, {
          y: 30,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.06,
          scrollTrigger: { trigger: node, start: 'top 88%', once: true },
        })
      })
      el.querySelectorAll('[data-count]').forEach((node) => {
        const end = Number(node.dataset.count)
        const o = { v: 0 }
        node.textContent = '0'
        gsap.to(o, {
          v: end,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => (node.textContent = Math.round(o.v)),
          scrollTrigger: { trigger: node, start: 'top 92%', once: true },
        })
      })
    }, el)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [root, active, key])
}

// The lerped cursor: squashes along its velocity, grows and carries a label over targets.
export function Cursor() {
  const blob = useRef(null)
  const label = useRef(null)
  useEffect(() => {
    if (reduced || !finePointer) return
    const root = document.documentElement
    root.classList.add('has-cursor')
    const s = { x: pointer.x, y: pointer.y, scale: 0.18, target: 0.18, angle: 0, stretch: 0 }
    const over = (e) => {
      const t = e.target.closest?.('[data-cursor], a, button')
      const text = t?.getAttribute('data-cursor') || ''
      label.current.textContent = text
      s.target = !t ? 0.18 : text ? 1 : 0.5
      blob.current.classList.toggle('is-label', !!text)
      blob.current.classList.toggle('is-link', !!t && !text)
    }
    const down = () => (s.target *= 0.8)
    const up = (e) => over(e)
    document.addEventListener('pointerover', over)
    document.addEventListener('pointerdown', down)
    document.addEventListener('pointerup', up)
    const tick = (time, dt) => {
      const k = 1 - Math.pow(0.0001, dt / 1000)
      const px = s.x
      const py = s.y
      s.x += (pointer.x - s.x) * k
      s.y += (pointer.y - s.y) * k
      const vx = s.x - px
      const vy = s.y - py
      const speed = Math.hypot(vx, vy)
      if (speed > 0.3) s.angle = Math.atan2(vy, vx) * (180 / Math.PI)
      s.stretch += (Math.min(speed / 40, 0.55) - s.stretch) * 0.25
      s.scale += (s.target - s.scale) * Math.min(1, k * 0.9)
      gsap.set(blob.current, {
        x: s.x,
        y: s.y,
        rotate: s.angle,
        scaleX: s.scale * (1 + s.stretch),
        scaleY: s.scale * (1 - s.stretch * 0.5),
      })
      gsap.set(label.current, { x: s.x, y: s.y, autoAlpha: s.scale > 0.8 ? 1 : 0 })
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('pointerup', up)
      root.classList.remove('has-cursor')
    }
  }, [])
  if (reduced || !finePointer) return null
  return (
    <>
      <div ref={blob} className="cursor" aria-hidden="true" />
      <div ref={label} className="cursor-label" aria-hidden="true" />
    </>
  )
}

export const ext = { target: '_blank', rel: 'noopener' }

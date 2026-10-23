import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches
export const reduceMotion = mq('(prefers-reduced-motion: reduce)')
export const finePointer = mq('(hover: hover) and (pointer: fine)')

let lenis = null
export const getLenis = () => lenis

// Lenis driven by the GSAP ticker so scroll, ScrollTrigger and every effect share one clock.
export function startSmoothScroll(stopped) {
  if (reduceMotion) return () => {}
  lenis = new Lenis({ lerp: 0.1 })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (t) => lenis.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  if (stopped) lenis.stop()
  return () => {
    gsap.ticker.remove(tick)
    lenis.destroy()
    lenis = null
  }
}

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: -16 })
  else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
}

// Scroll reveals, driven by data attributes so the markup stays plain.
export function initReveals(root) {
  if (reduceMotion || !root) return () => {}
  const once = (trigger) => ({ trigger, start: 'top 88%', once: true })
  const ctx = gsap.context(() => {
    root.querySelectorAll('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, { yPercent: 110, rotate: 2, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: once(el) }),
      })
    })
    root.querySelectorAll('[data-clip]').forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', scrollTrigger: once(el) },
      )
      const img = el.querySelector('img')
      if (img) gsap.from(img, { scale: 1.25, duration: 1.6, ease: 'expo.out', scrollTrigger: once(el) })
    })
    root.querySelectorAll('[data-rise]').forEach((el) => {
      gsap.from(el.children, { y: 36, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.05, scrollTrigger: once(el) })
    })
  }, root)
  return () => ctx.revert()
}

export function initMagnetic(root) {
  if (reduceMotion || !finePointer || !root) return () => {}
  const offs = []
  root.querySelectorAll('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - r.left - r.width / 2) * 0.35)
      yTo((e.clientY - r.top - r.height / 2) * 0.35)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    offs.push(() => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      gsap.set(el, { clearProps: 'transform' })
    })
  })
  return () => offs.forEach((f) => f())
}

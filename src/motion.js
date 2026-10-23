import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)

// One easing family. "set" is a quick start and a long exact settle, like a line of type dropping into the chase.
CustomEase.create('set', 'M0,0 C0.16,1 0.3,1 1,1')
CustomEase.create('wipe', 'M0,0 C0.76,0 0.24,1 1,1')

export { gsap, ScrollTrigger, SplitText }

export const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

export function initLenis() {
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 })
  lenis.on('scroll', ScrollTrigger.update)
  const raf = (t) => lenis.raf(t * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  const onClick = (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null
    if (!a) return
    const id = a.getAttribute('href')
    const el = id.length > 1 ? document.querySelector(id) : document.body
    if (!el) return
    e.preventDefault()
    lenis.scrollTo(el, { offset: id === '#top' ? 0 : -96, duration: 1.4, easing: (x) => 1 - Math.pow(1 - x, 4) })
  }
  document.addEventListener('click', onClick)

  return {
    lenis,
    destroy() {
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(raf)
      lenis.destroy()
    },
  }
}

// Lerped dot with velocity squash and stretch. Grows over links; becomes a labelled disc over [data-cursor].
export function initCursor(el) {
  const blob = el.querySelector('.cursor__blob')
  const label = el.querySelector('.cursor__label')
  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const target = { ...pos }
  let scale = 0.16
  let goal = 0.16
  let visible = false

  const onMove = (e) => {
    target.x = e.clientX
    target.y = e.clientY
    if (!visible) {
      pos.x = target.x
      pos.y = target.y
      visible = true
      el.classList.add('is-on')
    }
  }
  const onOver = (e) => {
    const t = e.target instanceof Element ? e.target.closest('[data-cursor], a, button') : null
    const text = t?.dataset.cursor
    if (text) {
      label.textContent = text
      el.classList.add('is-label')
      goal = 1
    } else {
      el.classList.remove('is-label')
      goal = t ? 0.46 : 0.16
    }
  }
  const onLeave = () => {
    visible = false
    el.classList.remove('is-on')
  }
  const onDown = () => el.classList.add('is-down')
  const onUp = () => el.classList.remove('is-down')

  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerover', onOver)
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)

  const setX = gsap.quickSetter(el, 'x', 'px')
  const setY = gsap.quickSetter(el, 'y', 'px')
  const setRot = gsap.quickSetter(blob, 'rotation', 'deg')
  const setSX = gsap.quickSetter(blob, 'scaleX')
  const setSY = gsap.quickSetter(blob, 'scaleY')

  const tick = (_t, dt) => {
    const k = 1 - Math.pow(1 - 0.2, dt / 16.67)
    const dx = target.x - pos.x
    const dy = target.y - pos.y
    pos.x += dx * k
    pos.y += dy * k
    scale += (goal - scale) * (1 - Math.pow(1 - 0.16, dt / 16.67))
    const speed = Math.min(Math.hypot(dx, dy), 160)
    const stretch = (speed / 160) * 0.55 * (goal < 1 ? 1 : 0.25)
    setX(pos.x)
    setY(pos.y)
    if (speed > 0.5) setRot((Math.atan2(dy, dx) * 180) / Math.PI)
    setSX(scale * (1 + stretch))
    setSY(scale * (1 - stretch * 0.45))
  }
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    window.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerover', onOver)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointerup', onUp)
  }
}

export function initMagnetic(scope) {
  const offs = []
  scope.querySelectorAll('[data-magnetic]').forEach((el) => {
    const inner = el.querySelector('.mag__inner') || el
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
    const ixTo = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' })
    const iyTo = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      xTo(dx * 0.32)
      yTo(dy * 0.32)
      if (inner !== el) {
        ixTo(dx * 0.14)
        iyTo(dy * 0.14)
      }
    }
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: true })
      if (inner !== el) gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: true })
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    offs.push(() => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    })
  })
  return () => offs.forEach((f) => f())
}

// Scroll choreography. Call inside a gsap.context so everything reverts together.
export function initReveals(scope) {
  scope.querySelectorAll('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'line',
      aria: 'none',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1.1,
          ease: 'set',
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    })
  })

  scope.querySelectorAll('[data-reveal]').forEach((el) => {
    const img = el.querySelector('img')
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'wipe' })
    if (img) tl.from(img, { scale: 1.25, duration: 1.6, ease: 'set' }, 0)
  })

  scope.querySelectorAll('[data-fade]').forEach((el) => {
    gsap.from(el, {
      y: 28,
      autoAlpha: 0,
      duration: 1,
      ease: 'set',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    })
  })

  scope.querySelectorAll('[data-rule]').forEach((el) => {
    gsap.from(el, {
      scaleX: 0,
      transformOrigin: '0% 50%',
      duration: 1.4,
      ease: 'wipe',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
    })
  })

  scope.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count)
    const o = { v: 0 }
    el.textContent = '0'
    gsap.to(o, {
      v: end,
      duration: 1.6,
      ease: 'set',
      onUpdate: () => (el.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  })

  // the index rows set in one after another like lines of a galley
  scope.querySelectorAll('[data-stagger]').forEach((list) => {
    gsap.from(list.children, {
      yPercent: 40,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'set',
      stagger: 0.06,
      scrollTrigger: { trigger: list, start: 'top 85%', once: true },
    })
  })
}

// Hero after the loader: letters drop into place, meta fades in.
export function heroIntro(scope) {
  const tl = gsap.timeline()
  scope.querySelectorAll('[data-hero-word]').forEach((el, i) => {
    const split = SplitText.create(el, { type: 'words,chars', mask: 'chars', aria: 'none' })
    tl.from(split.chars, { yPercent: 110, duration: 1.2, ease: 'set', stagger: 0.035 }, i * 0.12)
  })
  tl.from(scope.querySelectorAll('[data-hero-meta]'), { y: 16, autoAlpha: 0, duration: 0.9, ease: 'set', stagger: 0.06 }, 0.45)
  const portrait = scope.querySelector('[data-hero-photo]')
  if (portrait) {
    tl.fromTo(portrait, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'wipe' }, 0.3)
    tl.from(portrait.querySelector('img'), { scale: 1.3, duration: 1.8, ease: 'set' }, 0.3)
  }
  return tl
}

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import { Flip } from 'gsap/Flip'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Flip)

// One easing family for the whole reel: a long, buttery settle.
CustomEase.create('reel', '0.7, 0, 0.12, 1')
CustomEase.create('reelOut', '0.22, 1, 0.36, 1')
gsap.defaults({ ease: 'reelOut', duration: 1 })

const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches
export const reduced = mq('(prefers-reduced-motion: reduce)')
export const finePointer = mq('(hover: hover) and (pointer: fine)')

export const hasGL = (() => {
  if (reduced || typeof document === 'undefined') return false
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
})()

// Shared pointer state, written by one listener, read by every GL layer and the cursor.
export const pointer = { x: -999, y: -999, vx: 0, vy: 0, down: false, moved: false }
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.moved = true
  }, { passive: true })
}

// Pause GL work while the tab is hidden.
export const visibility = { hidden: false }
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { visibility.hidden = document.hidden })
}

export let lenis = null

export function startSmoothScroll() {
  if (reduced || lenis) return lenis
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function scrollToTarget(target, immediate = false) {
  if (lenis) lenis.scrollTo(target, { immediate, offset: 0, duration: 1.4 })
  else if (typeof target === 'number') window.scrollTo(0, target)
  else document.querySelector(target)?.scrollIntoView()
}

export { gsap, ScrollTrigger, SplitText, Flip }

// DOM-side interaction: cursor, magnetic pulls, text scramble, icy media hovers.
// Every init returns its own cleanup.
import gsap from 'gsap'

const on = (el, type, fn, opts) => {
  el.addEventListener(type, fn, opts)
  return () => el.removeEventListener(type, fn, opts)
}

// A drop of water that trails the pointer, stretches with speed and swells
// into a labelled lens over anything clickable.
export function initCursor(el) {
  const blob = el.querySelector('.cursor__blob')
  const label = el.querySelector('.cursor__label')
  const p = { x: -100, y: -100 }
  const t = { x: -100, y: -100 }
  let size = 1, sizeT = 1, hover = null, seen = false
  document.documentElement.classList.add('has-cursor')

  const offs = [
    on(window, 'pointermove', (e) => {
      if (e.pointerType !== 'mouse') return
      t.x = e.clientX
      t.y = e.clientY
      if (!seen) { p.x = t.x; p.y = t.y; seen = true }
      el.classList.add('is-on')
    }),
    on(document, 'pointerover', (e) => {
      const h = e.target.closest ? e.target.closest('a, button, [data-cursor]') : null
      if (h === hover) return
      hover = h
      const text = h ? (h.dataset.cursor ?? (h.tagName === 'A' ? 'Open' : '')) : ''
      label.textContent = text
      el.classList.toggle('is-link', !!h)
      sizeT = h ? (text ? 4.6 : 2.4) : 1
    }),
    on(document, 'pointerdown', () => el.classList.add('is-down')),
    on(document, 'pointerup', () => el.classList.remove('is-down')),
    on(document.documentElement, 'pointerleave', () => el.classList.remove('is-on')),
  ]

  const tick = (time, dtMs) => {
    const dt = Math.min(dtMs, 50) / 1000
    const k = 1 - Math.exp(-dt * 13)
    const dx = t.x - p.x, dy = t.y - p.y
    p.x += dx * k
    p.y += dy * k
    size += (sizeT - size) * (1 - Math.exp(-dt * 9))
    const sp = Math.min(Math.hypot(dx, dy) / 110, 1) / size
    const ang = Math.atan2(dy, dx) * 57.2958
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
    blob.style.transform = `rotate(${ang}deg) scale(${size * (1 + sp * 0.6)}, ${size * (1 - sp * 0.32)})`
  }
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    offs.forEach((f) => f())
    document.documentElement.classList.remove('has-cursor')
  }
}

export function initMagnetic(root) {
  const offs = [...root.querySelectorAll('[data-magnetic]')].map((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    const a = on(el, 'pointermove', (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * 0.32)
      yTo((e.clientY - (r.top + r.height / 2)) * 0.32)
    })
    const b = on(el, 'pointerleave', () => { xTo(0); yTo(0) })
    return () => { a(); b() }
  })
  return () => offs.forEach((f) => f())
}

export function initScramble(root) {
  const offs = [...root.querySelectorAll('[data-scramble]')].map((el) => {
    const text = el.textContent
    const host = el.closest('a, button') || el
    const run = () => gsap.to(el, { duration: 0.7, scrambleText: { text, chars: '01/\\+*<>', speed: 0.7 }, overwrite: true })
    const a = on(host, 'pointerenter', run)
    const b = on(host, 'focus', run)
    return () => { a(); b() }
  })
  return () => offs.forEach((f) => f())
}

// Photos thaw under the pointer: an SVG displacement + RGB split filter is
// switched on for the hovered image only, and a specular highlight tracks the
// pointer through CSS variables.
export function initIceMedia(root) {
  const disp = document.getElementById('ice-disp')
  const shift = document.getElementById('ice-shift')
  const turb = document.getElementById('ice-turb')
  if (!disp || !shift || !turb) return () => {}
  const figs = [...root.querySelectorAll('[data-ice]')]
  const offs = figs.map((fig) => {
    const a = on(fig, 'pointerenter', () => {
      figs.forEach((f) => f !== fig && f.classList.remove('is-hot'))
      fig.classList.add('is-hot')
      gsap.to(disp, { attr: { scale: 26 }, duration: 0.5, ease: 'power2.out', overwrite: true })
      gsap.to(shift, { attr: { dx: 5 }, duration: 0.5, ease: 'power2.out', overwrite: true })
    })
    const b = on(fig, 'pointermove', (e) => {
      const r = fig.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      fig.style.setProperty('--mx', `${x * 100}%`)
      fig.style.setProperty('--my', `${y * 100}%`)
      turb.setAttribute('baseFrequency', `${(0.008 + x * 0.012).toFixed(4)} ${(0.018 + y * 0.02).toFixed(4)}`)
    })
    const c = on(fig, 'pointerleave', () => {
      gsap.to(disp, { attr: { scale: 0 }, duration: 0.6, ease: 'power2.out', overwrite: true, onComplete: () => fig.classList.remove('is-hot') })
      gsap.to(shift, { attr: { dx: 0 }, duration: 0.6, ease: 'power2.out', overwrite: true })
    })
    return () => { a(); b(); c() }
  })
  return () => offs.forEach((f) => f())
}

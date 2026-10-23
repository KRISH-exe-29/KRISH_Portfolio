// Lerped cursor with velocity squash and stretch, contextual labels, and
// magnetic pull on [data-magnetic] elements. Everything runs on GSAP's ticker.
import { gsap } from 'gsap'

const SIZE = { dot: 0.12, link: 0.44, media: 1 }

export function initCursor(root) {
  const blob = root.querySelector('.cursor-blob')
  const label = root.querySelector('.cursor-label')
  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const pos = { ...target }
  let size = SIZE.dot
  let goal = SIZE.dot
  let mag = null
  let shown = false

  const onMove = (e) => {
    target.x = e.clientX
    target.y = e.clientY
    if (!shown) {
      pos.x = target.x
      pos.y = target.y
      shown = true
      root.classList.add('is-on')
    }
    if (mag) {
      const r = mag.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      gsap.to(mag, { x: dx * 0.3, y: dy * 0.3, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
    }
  }

  const onOver = (e) => {
    const t = e.target
    if (!t.closest) return
    const m = t.closest('[data-magnetic]')
    if (m !== mag) {
      if (mag) gsap.to(mag, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
      mag = m
    }
    const media = t.closest('[data-cursor]')
    if (media) {
      goal = SIZE.media
      label.textContent = media.getAttribute('data-cursor')
      root.dataset.state = 'media'
    } else if (t.closest('a, button, [role="button"], label')) {
      goal = SIZE.link
      root.dataset.state = 'link'
    } else {
      goal = SIZE.dot
      root.dataset.state = ''
    }
  }

  const onLeaveWindow = () => {
    shown = false
    root.classList.remove('is-on')
  }

  const onDown = () => gsap.to(blob, { '--press': 0.8, duration: 0.15 })
  const onUp = () => gsap.to(blob, { '--press': 1, duration: 0.4, ease: 'back.out(3)' })

  const tick = (time, dt) => {
    const k = 1 - Math.exp(-(dt / 1000) * 16)
    const vx = (target.x - pos.x) * k
    const vy = (target.y - pos.y) * k
    pos.x += vx
    pos.y += vy
    size += (goal - size) * (1 - Math.exp(-(dt / 1000) * 12))
    const speed = Math.min(Math.hypot(vx, vy) / 40, 1)
    // Stretch along travel, shrink across it; calmer when large.
    const s = speed * (goal === SIZE.media ? 0.12 : 0.45)
    gsap.set(root, { x: pos.x, y: pos.y })
    gsap.set(blob, {
      rotate: (Math.atan2(vy, vx) * 180) / Math.PI,
      scaleX: size * (1 + s),
      scaleY: size * (1 - s * 0.6),
    })
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerover', onOver)
  document.documentElement.addEventListener('pointerleave', onLeaveWindow)
  window.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    window.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerover', onOver)
    document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointerup', onUp)
  }
}

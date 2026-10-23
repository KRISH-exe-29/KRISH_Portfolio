import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { lens, finePointer, reducedMotion } from './lens.js'

// Text that rolls up letter by letter when its link or button is hovered or focused.
export function Roll({ text }) {
  const row = [...text].map((c, i) => (
    <span key={i} style={{ '--i': i }}>{c === ' ' ? ' ' : c}</span>
  ))
  return (
    <span className="roll">
      <span className="sr-only">{text}</span>
      <span className="roll-track" aria-hidden="true">
        <span className="roll-a">{row}</span>
        <span className="roll-b">{row}</span>
      </span>
    </span>
  )
}

// Pulls an element toward the pointer and lets it spring back on leave.
export function useMagnet(strength = 0.35) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !finePointer() || reducedMotion()) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - r.left - r.width / 2) * strength)
      yTo((e.clientY - r.top - r.height / 2) * strength)
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
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [strength])
  return ref
}

const external = (href) => /^https?:/.test(href) || href.endsWith('.pdf')

export function Pill({ href, children, cursor = 'Open', dark = false }) {
  const ref = useMagnet()
  const ext = external(href)
  return (
    <a
      ref={ref}
      className={'pill' + (dark ? ' pill--dark' : '')}
      href={href}
      data-cursor={cursor}
      {...(ext ? { target: '_blank', rel: 'noopener' } : {})}
    >
      <span className="pill-fill" aria-hidden="true" />
      <Roll text={children} />
    </a>
  )
}

export function Photo({ src, alt, caption, className = '', eager = false }) {
  const imgRef = useRef(null)
  return (
    <figure
      className={'photo ' + className}
      data-cursor="Look"
      onPointerEnter={() => {
        lens.el = imgRef.current
      }}
      onPointerLeave={() => {
        if (lens.el === imgRef.current) lens.el = null
      }}
    >
      <div className="photo-frame" data-clip="">
        <img ref={imgRef} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

import { useEffect, useRef, useState } from 'react'

/* Soundtrack: on by default, with a remembered "off".
   play() is tried on load; if the browser blocks it, the first real interaction starts it.
   Wheel and scroll don't count as interaction, so they aren't listened to.
   touchend is included because mobile Chrome only unlocks audio on touchend, not touchstart. */
const KEY = 'krish-music-off'
const EVENTS = ['pointerdown', 'keydown', 'touchstart', 'touchend']
const OPTS = { capture: true, passive: true }
const VOLUME = 0.6
const FADE_MS = 1500
const fades = new WeakMap()
const graphs = new WeakMap()

function musicOff() {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

function remember(on) {
  try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, '1') } catch { /* storage blocked: just don't remember */ }
}

// play() with a short fade-in to a modest volume. Rejects when the browser blocks it.
async function playSoft(a) {
  const fresh = a.paused
  if (fresh) { cancelAnimationFrame(fades.get(a)); a.volume = 0 }
  await a.play()
  if (!fresh) return
  const t0 = performance.now()
  const step = (t) => {
    const k = Math.min(1, Math.max(0, (t - t0) / FADE_MS))
    a.volume = VOLUME * k
    if (k < 1) fades.set(a, requestAnimationFrame(step))
  }
  fades.set(a, requestAnimationFrame(step))
}

// Route the element through Web Audio, calling setup(ctx, source) once the context is running.
// Waiting matters: a context the browser keeps suspended would otherwise silence a track it let autoplay.
function connect(a, setup) {
  let g = graphs.get(a)
  if (!g) {
    try { g = { ctx: new (window.AudioContext || window.webkitAudioContext)(), done: false } } catch { return }
    g.go = () => {
      if (g.done || g.ctx.state !== 'running') return
      g.done = true
      try { setup(g.ctx, g.ctx.createMediaElementSource(a)) } catch { /* plays without the visualiser */ }
    }
    g.ctx.addEventListener('statechange', g.go)
    graphs.set(a, g)
  }
  g.ctx.resume().catch(() => {})
  g.go()
}

// Calls start() now; if blocked, again on each interaction until it plays.
// Interactions on a music control ([data-music]) are left to that control: a first click there means "off".
function autoplay(start) {
  let live = true
  const go = (e) => { if (!e.target.closest?.('[data-music]')) start().then(disarm, () => {}) }
  const disarm = () => { live = false; EVENTS.forEach((n) => window.removeEventListener(n, go, OPTS)) }
  start().catch(() => { if (live) EVENTS.forEach((n) => window.addEventListener(n, go, OPTS)) })
  return disarm
}

// [music, setMusic]: music is the visitor's choice (on unless they turned it off before).
// Whether sound is actually coming out is the element's play/pause events, not this.
export function useMusic(getEl, setup) {
  const [music, setState] = useState(() => !musicOff())
  const disarm = useRef(null)
  const start = () => {
    const a = getEl()
    if (!a) return Promise.reject(new Error('no audio element'))
    if (setup) connect(a, setup)
    return playSoft(a)
  }
  useEffect(() => {
    if (!music) return
    disarm.current = autoplay(start)
    return () => disarm.current?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const setMusic = (on) => {
    remember(on)
    setState(on)
    disarm.current?.()
    if (on) start().catch(() => {})
    else getEl()?.pause()
  }
  return [music, setMusic]
}

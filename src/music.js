// The soundtrack: one song per leg of the journey, crossfaded through Web Audio
// (iOS ignores <audio>.volume, a GainNode it respects). Fast scrolling closes a low-pass
// over everything, so the music sounds muffled until the reader settles.
import { asset } from './content.js'

const files = [1, 2].map((n) => asset(`music/coil-${n}.mp3`))

let ctx = null
let filter = null
let current = -1
let muted = false
const els = []
const gains = []

export function startMusic(leg) {
  if (!ctx) {
    ctx = new AudioContext()
    filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 18000
    const master = ctx.createGain()
    master.gain.value = 0.85
    filter.connect(master).connect(ctx.destination)
    files.forEach((src, i) => {
      const el = new Audio()
      el.loop = true
      el.preload = i === 0 ? 'auto' : 'none' // the next song loads only once its leg is near
      el.src = src
      const g = ctx.createGain()
      g.gain.value = 0
      ctx.createMediaElementSource(el).connect(g).connect(filter)
      els.push(el)
      gains.push(g)
    })
    document.addEventListener('visibilitychange', () => (document.hidden ? sleep() : wake()))
  }
  muted = false
  wake()
  current = -1
  setLeg(leg)
}

const sleep = () => {
  if (!ctx) return
  els.forEach((el) => el.pause())
  ctx.suspend()
}

const wake = () => {
  if (!ctx || muted || document.hidden) return
  ctx.resume()
  els[current]?.play().catch(() => {})
}

export function setLeg(i) {
  if (!ctx || i === current) return
  current = i
  const t = ctx.currentTime
  gains.forEach((g, j) => {
    g.gain.cancelScheduledValues(t)
    g.gain.setTargetAtTime(j === i ? 1 : 0, t, j === i ? 0.9 : 0.6)
  })
  if (els[i + 1]) els[i + 1].preload = 'auto'
  if (muted || document.hidden) return
  els[i].play().catch(() => {}) // a missing file just stays silent
  // Pause the songs that faded out, so only one decodes at a time.
  setTimeout(() => els.forEach((el, j) => j !== current && el.pause()), 3500)
}

// px per frame of scroll, from Lenis. 0 = still.
export function muffle(velocity) {
  if (!ctx || muted) return
  const v = Math.min(Math.abs(velocity) / 50, 1)
  filter.frequency.setTargetAtTime(18000 - v * 17000, ctx.currentTime, v > 0.05 ? 0.08 : 0.4)
}

export function setMuted(m) {
  muted = m
  if (m) sleep()
  else wake()
}

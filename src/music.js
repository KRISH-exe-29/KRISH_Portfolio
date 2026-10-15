// The soundtrack: one song per half of the storm, crossfaded through Web Audio
// (iOS ignores <audio>.volume, a GainNode it respects). Fast scrolling closes a low-pass
// over everything, so the music sounds muffled until the reader settles.
import { asset } from './content.js'

const files = [1, 2].map((n) => asset(`music/monsoon-${n}.mp3`))

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

// A synthesized thunder roll: low-passed brown noise with a slow decay. It arrives a beat
// after the flash, plays only with sound on, and a cooldown stops rolls stacking up.
let lastThunder = -1e9
export function thunder() {
  if (!ctx || muted || document.hidden) return
  const t = ctx.currentTime + 0.45
  if (t - lastThunder < 6) return
  lastThunder = t
  const len = 4
  const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * len), ctx.sampleRate)
  const d = buf.getChannelData(0)
  let b = 0
  for (let i = 0; i < d.length; i++) {
    b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02
    d[i] = b * 3.5
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 260
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.9, t + 0.12)
  g.gain.setTargetAtTime(0.5, t + 0.3, 0.3)
  g.gain.setTargetAtTime(0, t + 1.2, 0.7)
  src.connect(lp).connect(g).connect(ctx.destination)
  src.start(t)
  src.stop(t + len)
}

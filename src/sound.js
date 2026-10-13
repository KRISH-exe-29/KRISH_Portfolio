// Interface sounds. Everything is silent until the visitor turns sound on (see components/Sound.jsx).
// The effects are synthesized with Web Audio, so the only audio file on the site is the music.
let ctx
let master
let on = false
let hum // { gain } once the hum oscillators exist
let humLevel = 0

export function setSound(next) {
  on = next
  if (on && !ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
  }
  if (on) ctx.resume()
  setHum(humLevel)
}

// One short tone: `freq` Hz for `dur` seconds, optionally sliding to `slide` Hz.
function blip(freq, dur, type, gain, slide) {
  if (!on) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur)
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(env).connect(master)
  osc.start(t)
  osc.stop(t + dur)
}

export const tick = () => blip(1900, 0.03, 'square', 0.012) // hovering something you can press
export const click = () => blip(540, 0.1, 'triangle', 0.1, 170) // pressing it
export const chime = (freq) => blip(freq, 0.7, 'sine', 0.07) // arriving somewhere new
export const type = () => blip(880, 0.02, 'square', 0.008) // dialogue being typed

// A transformer hums at twice the mains frequency: 100 Hz on a 50 Hz grid, plus its harmonics.
// `level` is 0 to 1; the hum fades toward it and only sounds while sound is on.
export function setHum(level) {
  humLevel = level
  if (!ctx) return
  if (!hum) {
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(master)
    for (const [freq, amount] of [[100, 1], [200, 0.45], [300, 0.2]]) {
      const osc = ctx.createOscillator()
      const part = ctx.createGain()
      osc.frequency.value = freq
      part.gain.value = amount
      osc.connect(part).connect(gain)
      osc.start()
    }
    hum = { gain }
  }
  hum.gain.gain.setTargetAtTime(on ? level * 0.09 : 0, ctx.currentTime, 0.6)
}

// Hover ticks and press clicks for every link and button, from one pair of listeners.
let wired = false
export function wireInterface() {
  if (wired) return
  wired = true
  let last = null
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.('a, button')
    if (el && el !== last) tick()
    last = el
  })
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest?.('a, button')) click()
  })
}

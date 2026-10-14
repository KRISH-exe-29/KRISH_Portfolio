// The score: one chord held for the whole strike, synthesised here, no audio files.
// The front stacks the voices and opens the filter; the crest is thunder; across the tail the
// suspended fourth slides down to the third, so the chord resolves as the wave reaches half.
import { CREST, END, volts } from './impulse.js'

const LEVEL = 0.5
const BASE = [73.42, 110, 146.83, 220, 293.66, 329.63] // D2 A2 D3 A3 D4 E4
const SUS = 196 // G3, the fourth that wants to fall
const THIRD = 185 // F#3, where it lands

let ac
let master
let tone
let voices = []
let sus
let third
let noise
let muted = false

const clamp = (x) => Math.min(1, Math.max(0, x))

// Two slightly detuned saws per note, the way a string pad is built.
function voice(freq, out) {
  const gain = ac.createGain()
  gain.gain.value = 0
  for (const cents of [-7, 7]) {
    const osc = ac.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.detune.value = cents
    osc.connect(gain)
    osc.start()
  }
  gain.connect(out)
  return gain
}

// A few seconds of decaying noise is enough of a room for a pad to sit in.
function room() {
  const conv = ac.createConvolver()
  const len = ac.sampleRate * 3
  const ir = ac.createBuffer(2, len, ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const data = ir.getChannelData(c)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  }
  conv.buffer = ir
  return conv
}

export function startScore() {
  if (ac) return
  ac = new AudioContext()
  master = ac.createGain()
  master.gain.value = 0
  const limiter = ac.createDynamicsCompressor()
  master.connect(limiter).connect(ac.destination)

  const wet = ac.createGain()
  wet.gain.value = 0.35
  const verb = room()
  verb.connect(wet).connect(master)

  tone = ac.createBiquadFilter()
  tone.type = 'lowpass'
  tone.Q.value = 0.7
  tone.frequency.value = 240
  tone.connect(master)
  tone.connect(verb)

  voices = BASE.map((f) => voice(f, tone))
  sus = voice(SUS, tone)
  third = voice(THIRD, tone)

  noise = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate)
  noise.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1 })

  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 0.8)
  follow(0)
}

export function setMuted(next) {
  muted = next
  if (!ac) return
  if (!muted) ac.resume()
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 0.3)
}

// Called as the page scrolls. `t` is the time on the impulse in µs, `speed` how fast it is moving.
export function follow(t, speed = 0) {
  if (!ac) return
  const now = ac.currentTime
  const charge = t < CREST ? clamp(t / CREST) : 1
  const u = volts(t)
  const resolve = clamp((t - 28) / (END - 28))

  // Drone first, then each voice in turn as the front climbs.
  voices.forEach((g, i) => {
    const on = i < 2 ? 1 : clamp(charge * (BASE.length - 1) - (i - 2))
    g.gain.setTargetAtTime((i < 2 ? 0.05 : 0.032) * on, now, 0.25)
  })
  sus.gain.setTargetAtTime(0.03 * charge * (1 - resolve), now, 0.4)
  third.gain.setTargetAtTime(0.03 * charge * resolve, now, 0.4)

  // Brightest at the crest, closing as the voltage falls.
  const open = t < CREST ? 240 + charge * 2600 : 500 + 2340 * clamp((u - 0.5) * 2)
  tone.frequency.setTargetAtTime(open, now, 0.2)

  // The leader crackles while it is moving.
  if (t > 0 && t < CREST && Math.random() < Math.min(0.7, speed * 0.04)) crackle(now)
}

function burst(at, { filter, freq, peak, decay, length }) {
  const src = ac.createBufferSource()
  src.buffer = noise
  src.playbackRate.value = 0.8 + Math.random() * 0.4
  const f = ac.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(peak, at + 0.005)
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay)
  src.connect(f).connect(env).connect(master)
  src.start(at, Math.random() * 3, length)
}

function crackle(at) {
  burst(at, { filter: 'highpass', freq: 2500, peak: 0.12, decay: 0.05, length: 0.06 })
}

// The return stroke: a crack, then thunder rolling off.
export function strike() {
  if (!ac || muted) return
  const now = ac.currentTime
  burst(now, { filter: 'highpass', freq: 1200, peak: 0.5, decay: 0.25, length: 0.3 })
  burst(now + 0.08, { filter: 'lowpass', freq: 160, peak: 0.9, decay: 4.5, length: 4 })
  const sub = ac.createOscillator()
  const env = ac.createGain()
  sub.frequency.setValueAtTime(70, now)
  sub.frequency.exponentialRampToValueAtTime(32, now + 1.5)
  env.gain.setValueAtTime(0.0001, now)
  env.gain.exponentialRampToValueAtTime(0.5, now + 0.03)
  env.gain.exponentialRampToValueAtTime(0.0001, now + 2)
  sub.connect(env).connect(master)
  sub.start(now)
  sub.stop(now + 2.1)
}

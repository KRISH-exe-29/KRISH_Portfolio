// The score: a slow lo-fi loop, synthesised here, no audio files.
// Everything runs through one low-pass filter that closes as the reader dives, the way music
// sounds from under water. The beat fades out in the shallows; the deep has only the chords,
// the bubbles and, past 120 m, a sonar ping.
const LEVEL = 0.55
const BPM = 70
const EIGHTH = 60 / BPM / 2
// Fmaj7, Em7, Dm9, Cmaj7: a slow fall, two bars each.
const CHORDS = [
  [174.61, 220, 261.63, 329.63, 392],
  [164.81, 196, 246.94, 293.66, 392],
  [146.83, 220, 261.63, 329.63, 349.23],
  [130.81, 196, 246.94, 329.63, 392],
]
const ARP = [0, 2, 4, 3, 1, 3, 2, 4]

let ac
let master
let muffle
let wet
let beat
let surf
let noise
let muted = false
let depth = 0
let step = 0
let nextAt = 0

let lastPing = 0

const clamp = (x) => Math.min(1, Math.max(0, x))

function room(seconds) {
  const conv = ac.createConvolver()
  const len = Math.floor(ac.sampleRate * seconds)
  const ir = ac.createBuffer(2, len, ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.5
  }
  conv.buffer = ir
  return conv
}

// A soft electric piano: a sine and a quiet octave, slightly out of tune like old tape.
function key(freq, at, level, length = 1.8) {
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(level, at + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, at + length)
  env.connect(muffle)
  for (const [mult, gain] of [[1, 1], [2, 0.18], [3, 0.05]]) {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.frequency.value = freq * mult
    osc.detune.value = (Math.random() - 0.5) * 12
    g.gain.value = gain
    osc.connect(g).connect(env)
    osc.start(at)
    osc.stop(at + length + 0.05)
  }
}

function kick(at) {
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.frequency.setValueAtTime(110, at)
  osc.frequency.exponentialRampToValueAtTime(42, at + 0.18)
  env.gain.setValueAtTime(0.55, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.35)
  osc.connect(env).connect(beat)
  osc.start(at)
  osc.stop(at + 0.4)
}

function hat(at, level) {
  const src = ac.createBufferSource()
  src.buffer = noise
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6000
  const env = ac.createGain()
  env.gain.setValueAtTime(level, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
  src.connect(hp).connect(env).connect(beat)
  src.start(at, Math.random(), 0.08)
}

// One eighth note of the loop.
function play(at) {
  const bar = Math.floor(step / 8)
  const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length]
  const i = step % 8
  key(chord[ARP[i]] * 2, at, 0.07)
  if (i === 0) {
    key(chord[0] / 2, at, 0.16, 2.6) // bass
    if (bar % 2 === 0) chord.slice(1).forEach((f) => key(f, at, 0.035, 3.4)) // the chord, held
  }
  if (i === 0 || i === 4) kick(at)
  if (i % 2 === 1) hat(at, i === 3 || i === 7 ? 0.05 : 0.03)
  step++
}

function schedule() {
  while (nextAt < ac.currentTime + 0.12) {
    play(nextAt)
    nextAt += EIGHTH * (step % 2 ? 0.92 : 1.08) // a little swing
  }
  // The sonar only works down where it is dark.
  if (depth > 0.6 && ac.currentTime - lastPing > 7) {
    lastPing = ac.currentTime
    key(1318.5, ac.currentTime + 0.05, 0.05, 2.4)
  }
}

export function startScore() {
  if (ac) return
  ac = new AudioContext()
  master = ac.createGain()
  master.gain.value = 0
  const limiter = ac.createDynamicsCompressor()
  master.connect(limiter).connect(ac.destination)

  muffle = ac.createBiquadFilter()
  muffle.type = 'lowpass'
  muffle.Q.value = 1.2
  muffle.connect(master)
  wet = ac.createGain()
  const verb = room(3.5)
  muffle.connect(verb).connect(wet).connect(master)

  beat = ac.createGain()
  beat.connect(muffle)

  noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
  noise.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1 })

  // The surface: waves, heard only before the plunge.
  const waves = ac.createBufferSource()
  waves.buffer = noise
  waves.loop = true
  const waveTone = ac.createBiquadFilter()
  waveTone.type = 'lowpass'
  waveTone.frequency.value = 900
  surf = ac.createGain()
  const swell = ac.createOscillator()
  const swellDepth = ac.createGain()
  swell.frequency.value = 0.12
  swellDepth.gain.value = 0.05
  swell.connect(swellDepth).connect(surf.gain)
  waves.connect(waveTone).connect(surf).connect(master)
  waves.start()
  swell.start()

  nextAt = ac.currentTime + 0.1
  setInterval(schedule, 25)
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 1)
  follow(depth)
}

export function setMuted(next) {
  muted = next
  if (!ac) return
  if (!muted) ac.resume()
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 0.3)
}

// `d` is 0 at the surface and 1 at 200 m; `speed` is how fast the reader is scrolling.
export function follow(d, speed = 0) {
  depth = d
  if (!ac) return
  const now = ac.currentTime
  const under = d > 0.005
  muffle.frequency.setTargetAtTime(under ? 300 + 5200 * (1 - d) ** 2.2 : 12000, now, 0.25)
  wet.gain.setTargetAtTime(0.18 + d * 0.5, now, 0.5)
  beat.gain.setTargetAtTime(clamp(1 - d / 0.3), now, 0.6)
  surf.gain.setTargetAtTime(under ? 0 : 0.09, now, under ? 0.08 : 0.6)
  if (under && Math.random() < Math.min(0.5, speed * 0.015)) bubble(now)
}

function bubble(at) {
  const osc = ac.createOscillator()
  const env = ac.createGain()
  const f = 300 + Math.random() * 500
  osc.frequency.setValueAtTime(f, at)
  osc.frequency.exponentialRampToValueAtTime(f * 2.6, at + 0.07)
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(0.06, at + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.09)
  osc.connect(env).connect(master)
  osc.start(at)
  osc.stop(at + 0.1)
}

// Going under: a rush of water, then the world goes quiet.
export function plunge() {
  if (!ac || muted) return
  const now = ac.currentTime
  const src = ac.createBufferSource()
  src.buffer = noise
  const tone = ac.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.setValueAtTime(5000, now)
  tone.frequency.exponentialRampToValueAtTime(300, now + 0.9)
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, now)
  env.gain.exponentialRampToValueAtTime(0.4, now + 0.03)
  env.gain.exponentialRampToValueAtTime(0.0001, now + 1.1)
  src.connect(tone).connect(env).connect(master)
  src.start(now, 0, 1.2)
  for (let i = 0; i < 6; i++) bubble(now + 0.1 + i * 0.07 + Math.random() * 0.05)
}
